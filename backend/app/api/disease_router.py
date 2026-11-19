from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.connection import get_db
from backend.app.core.auth import get_current_user
from backend.app.models.entities import (
    User, PatientProfile, MedicalReport, SensorReading, HealthAlert,
    PatientSymptom, DiseaseAnalysisRecord, utc_now
)
from backend.app.api.patients_router import verify_access_to_patient, resolve_patient_user_id
from backend.app.services.disease_knowledge_base import (
    get_all_diseases, get_disease_by_id, get_diabetes_overview_data,
    DISEASE_KNOWLEDGE_BASE, GLOBAL_DIABETES_STATISTICS, DIABETES_PARAMETER_REFERENCES
)
from backend.app.services.document_parser import extract_text_from_file, parse_report_text_to_findings
from backend.app.services.disease_analyzer import run_disease_analysis_for_patient, CLINICAL_DISCLAIMER
from backend.app.schemas.disease import (
    PatientSymptomCreate, PatientSymptomResponse,
    ReportExtractionDraft, ReportConfirmCreate,
    DiseaseAnalysisRunResponse, DiseaseAnalysisSummaryResponse
)

router = APIRouter(prefix="/disease", tags=["Disease Intelligence & Clinical Analysis"])

# -------------------------------------------------------------
# 1. KNOWLEDGE BASE ENDPOINTS (PUBLIC / AUTHENTICATED)
# -------------------------------------------------------------
@router.get("/knowledge-base", response_model=List[Dict[str, Any]])
def get_knowledge_base():
    """Returns the complete medical knowledge base containing all 10 major chronic diseases."""
    return get_all_diseases()

@router.get("/knowledge-base/{disease_id}")
def get_disease_detail(disease_id: str):
    """Returns comprehensive clinical reference information for a single disease."""
    d = get_disease_by_id(disease_id)
    if not d:
        raise HTTPException(status_code=404, detail="Disease not found in clinical knowledge base")
    return d

@router.get("/diabetes-overview")
def get_diabetes_overview():
    """Returns complete Diabetes Mellitus overview: clinical background, global stats, parameter reference tables."""
    return get_diabetes_overview_data()

# -------------------------------------------------------------
# 2. PATIENT-SPECIFIC DIABETES RELATION
# -------------------------------------------------------------
@router.get("/patient/{patient_id}/diabetes-relation")
def get_patient_diabetes_relation(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dynamically relates the selected patient's available clinical records to Diabetes Mellitus.
    Respects caregiver permissions and highlights simulated Wokwi potentiometer readings.
    """
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")
    patient = db.query(User).filter(User.id == pid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    profile = patient.patient_profile

    # Fetch patient's recorded symptoms
    symptoms = db.query(PatientSymptom).filter(
        PatientSymptom.patient_id == pid,
        PatientSymptom.is_active == True
    ).order_by(desc(PatientSymptom.created_at)).all()

    # Fetch patient's reports (if permission allows)
    reports = []
    # If user is caregiver, check view_medical_reports permission
    can_view_reports = True
    if current_user.role == "caregiver":
        try:
            verify_access_to_patient(current_user, patient_id, db, required_permission="view_medical_reports")
        except HTTPException:
            can_view_reports = False

    if can_view_reports:
        reports = db.query(MedicalReport).filter(MedicalReport.patient_id == pid).order_by(desc(MedicalReport.report_date)).all()

    # Fetch recent readings
    readings = db.query(SensorReading).filter(
        (SensorReading.patient_id == pid) | (SensorReading.patient_id.is_(None))
    ).order_by(desc(SensorReading.timestamp)).limit(20).all()

    latest_reading = readings[0] if readings else None

    # Analyze relation to Diabetes Mellitus
    age = profile.age if profile else None
    conditions = (profile.medical_conditions or "") if profile else ""

    relevant_patient_details = []
    if age and age >= 45:
        relevant_patient_details.append(f"Age {age} years meets the ADA recommendation for routine diabetes screening (>= 45 yrs).")
    if "hypertension" in conditions.lower():
        relevant_patient_details.append(f"Recorded cardiovascular comorbidity: '{conditions}'. Hypertension accelerates diabetic microvascular risk.")

    # Symptoms relevant to diabetes
    diabetes_keywords = ["thirst", "urination", "hunger", "fatigue", "vision", "weight", "numbness", "tingling", "healing"]
    matching_symptoms = []
    for s in symptoms:
        if any(k in s.symptom_name.lower() for k in diabetes_keywords):
            matching_symptoms.append({
                "symptom_name": s.symptom_name,
                "severity": s.severity,
                "duration": s.duration,
                "frequency": s.frequency
            })

    # Relevant report findings
    relevant_report_findings = []
    lab_glucose_results = []
    for rep in reports:
        summary = rep.extracted_summary or {}
        if isinstance(summary, dict):
            findings = summary.get("findings", [])
            for f in findings:
                t_name = str(f.get("test_name", "")).lower()
                if any(k in t_name for k in ["glucose", "hba1c", "fbg", "sugar"]):
                    item = {
                        "report_title": rep.report_title,
                        "report_date": rep.report_date.isoformat() if rep.report_date else None,
                        "test_name": f.get("test_name"),
                        "value": f.get("value"),
                        "unit": f.get("unit"),
                        "status": f.get("status", "Normal")
                    }
                    relevant_report_findings.append(item)
                    lab_glucose_results.append(item)

    # Missing clinical data
    missing_clinical_data = []
    if not lab_glucose_results:
        missing_clinical_data.append("No laboratory Fasting Plasma Glucose or venous HbA1c test recorded in medical reports.")
    missing_clinical_data.append("No official 2-Hour Oral Glucose Tolerance Test (OGTT 75g) on file.")
    missing_clinical_data.append("Annual spot urine albumin-to-creatinine ratio (uACR) is absent.")

    # Doctor review points
    doctor_review_points = [
        "Discuss whether an annual comprehensive metabolic panel (CMP) and HbA1c test are indicated.",
        "Review blood pressure target adherence (< 130/80 mmHg is recommended in patients with elevated metabolic risk).",
        "Assess peripheral sensation (10g monofilament test) and schedule annual dilated retinal exam."
    ]

    # Handle Simulated Readings vs Genuine Lab values
    simulated_glucose_info = None
    if latest_reading and latest_reading.glucose_mg_dl is not None:
        simulated_glucose_info = {
            "value": latest_reading.glucose_mg_dl,
            "unit": "mg/dL",
            "source": latest_reading.source,
            "timestamp": latest_reading.timestamp.isoformat() if latest_reading.timestamp else None,
            "warning_label": "SIMULATED READING — NOT A REAL BLOOD GLUCOSE MEASUREMENT.",
            "clinical_caution": "The potentiometer or software simulator generates synthetic illustrative values for hardware testing. It must NEVER be used to diagnose diabetes or evaluate glycemic management."
        }

    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "email": patient.email,
            "age": age,
            "blood_type": profile.blood_type if profile else None,
            "medical_conditions": conditions
        },
        "how_diabetes_relates": {
            "relevant_patient_details": relevant_patient_details,
            "matching_symptoms": matching_symptoms,
            "relevant_report_findings": relevant_report_findings,
            "has_lab_glucose_results": len(lab_glucose_results) > 0,
            "missing_clinical_data": missing_clinical_data,
            "doctor_review_points": doctor_review_points
        },
        "lab_glucose_results": lab_glucose_results,
        "simulated_glucose_telemetry": simulated_glucose_info,
        "recent_vitals": {
            "heart_rate_bpm": latest_reading.heart_rate_bpm if latest_reading else None,
            "spo2_percent": latest_reading.spo2_percent if latest_reading else None,
            "bp_systolic_mmhg": latest_reading.bp_systolic_mmhg if latest_reading else None,
            "bp_diastolic_mmhg": latest_reading.bp_diastolic_mmhg if latest_reading else None,
            "timestamp": latest_reading.timestamp.isoformat() if latest_reading and latest_reading.timestamp else None,
            "is_simulated": latest_reading.simulated if latest_reading else True
        }
    }

# -------------------------------------------------------------
# 3. PATIENT SYMPTOM MANAGEMENT
# -------------------------------------------------------------
@router.get("/patient/{patient_id}/symptoms", response_model=List[PatientSymptomResponse])
def get_patient_symptoms(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")
    symptoms = db.query(PatientSymptom).filter(
        PatientSymptom.patient_id == pid,
        PatientSymptom.is_active == True
    ).order_by(desc(PatientSymptom.created_at)).all()
    return symptoms

@router.post("/patient/{patient_id}/symptoms", response_model=PatientSymptomResponse, status_code=status.HTTP_201_CREATED)
def record_patient_symptom(
    patient_id: int,
    req: PatientSymptomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="create_manage_alert_rules")
    sym = PatientSymptom(
        patient_id=pid,
        recorded_by_user_id=current_user.id,
        symptom_name=req.symptom_name.strip(),
        duration=req.duration,
        severity=req.severity,
        frequency=req.frequency,
        notes=req.notes
    )
    db.add(sym)
    db.commit()
    db.refresh(sym)
    return sym

@router.delete("/patient/{patient_id}/symptoms/{symptom_id}", status_code=status.HTTP_200_OK)
def delete_patient_symptom(
    patient_id: int,
    symptom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="create_manage_alert_rules")
    sym = db.query(PatientSymptom).filter(
        PatientSymptom.id == symptom_id,
        PatientSymptom.patient_id == pid
    ).first()
    if not sym:
        raise HTTPException(status_code=404, detail="Symptom not found")
    sym.is_active = False
    db.commit()
    return {"message": "Symptom deleted successfully", "symptom_id": symptom_id}

# -------------------------------------------------------------
# 4. MEDICAL REPORT UPLOAD, EXTRACTION & CONFIRMATION
# -------------------------------------------------------------
@router.post("/patient/{patient_id}/reports/extract", response_model=ReportExtractionDraft)
async def extract_medical_report_draft(
    patient_id: int,
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Extracts text and candidate findings from an uploaded document (PDF, Image, Text)
    without committing it to the database, allowing user review and correction.
    """
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_medical_reports")

    text_to_parse = ""
    if file:
        content = await file.read()
        filename = file.filename or "uploaded_report"
        content_type = file.content_type or ""
        text_to_parse = extract_text_from_file(content, filename, content_type)
    elif raw_text:
        text_to_parse = raw_text
    else:
        raise HTTPException(status_code=400, detail="Either a file or raw_text must be provided for extraction")

    draft = parse_report_text_to_findings(text_to_parse)
    return draft

@router.post("/patient/{patient_id}/reports/confirm", status_code=status.HTTP_201_CREATED)
def confirm_and_save_report(
    patient_id: int,
    req: ReportConfirmCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves a reviewed and confirmed medical report into the patient's secure diagnostic vault.
    """
    pid = resolve_patient_user_id(db, patient_id)
    # Only patient or caregiver with active permission can commit
    if current_user.role == "patient" and current_user.id != pid:
        raise HTTPException(status_code=403, detail="You can only save reports to your own account")
    elif current_user.role == "caregiver":
        verify_access_to_patient(current_user, patient_id, db, required_permission="view_medical_reports")

    rep = MedicalReport(
        patient_id=pid,
        report_title=req.report_title.strip(),
        category=req.category,
        report_date=req.report_date or utc_now(),
        healthcare_provider=req.healthcare_provider,
        patient_notes=req.patient_notes,
        extracted_summary={
            "raw_text": req.raw_text,
            "findings": req.findings
        }
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)

    return {
        "message": "Medical report successfully verified and saved to patient record.",
        "report_id": rep.id,
        "report_title": rep.report_title,
        "findings_count": len(req.findings)
    }

# -------------------------------------------------------------
# 5. PATIENT-BASED DISEASE ANALYSIS ENGINE
# -------------------------------------------------------------
@router.post("/patient/{patient_id}/analyze", response_model=DiseaseAnalysisRunResponse)
def run_disease_analysis(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes intelligent patient-based disease analysis across all 10 chronic conditions.
    Persists analysis record in history.
    """
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")
    patient = db.query(User).filter(User.id == pid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    profile = patient.patient_profile
    profile_dict = {
        "age": profile.age if profile else None,
        "blood_type": profile.blood_type if profile else None,
        "medical_conditions": profile.medical_conditions if profile else ""
    }

    # Fetch active symptoms
    symptoms_db = db.query(PatientSymptom).filter(
        PatientSymptom.patient_id == pid,
        PatientSymptom.is_active == True
    ).all()
    symptoms = [
        {
            "symptom_name": s.symptom_name,
            "severity": s.severity,
            "duration": s.duration,
            "frequency": s.frequency
        }
        for s in symptoms_db
    ]

    # Fetch reports if authorized
    reports_dict = []
    can_view_reports = True
    if current_user.role == "caregiver":
        try:
            verify_access_to_patient(current_user, patient_id, db, required_permission="view_medical_reports")
        except HTTPException:
            can_view_reports = False

    if can_view_reports:
        reports_db = db.query(MedicalReport).filter(MedicalReport.patient_id == pid).all()
        for r in reports_db:
            reports_dict.append({
                "report_title": r.report_title,
                "category": r.category,
                "report_date": r.report_date.isoformat() if r.report_date else None,
                "extracted_summary": r.extracted_summary
            })

    # Fetch latest reading
    latest = db.query(SensorReading).filter(
        (SensorReading.patient_id == pid) | (SensorReading.patient_id.is_(None))
    ).order_by(desc(SensorReading.timestamp)).first()

    latest_dict = None
    if latest:
        latest_dict = {
            "heart_rate_bpm": latest.heart_rate_bpm,
            "spo2_percent": latest.spo2_percent,
            "bp_systolic_mmhg": latest.bp_systolic_mmhg,
            "bp_diastolic_mmhg": latest.bp_diastolic_mmhg,
            "glucose_mg_dl": latest.glucose_mg_dl,
            "source": latest.source,
            "simulated": latest.simulated
        }

    # Run Analysis Engine
    raw_analysis = run_disease_analysis_for_patient(
        patient_id=pid,
        patient_profile=profile_dict,
        symptoms=symptoms,
        reports=reports_dict,
        latest_reading=latest_dict
    )

    # Highlight top diseases with match levels above 'No meaningful match'
    highlighted = [
        {
            "disease_id": d["disease_id"],
            "disease_name": d["disease_name"],
            "match_level": d["match_level"],
            "reason": d["reason_included"]
        }
        for d in raw_analysis["ranked_diseases"]
        if d["match_level"] in ["Relevant findings identified", "Some matching information"]
    ]

    # Persist in DiseaseAnalysisRecord
    record = DiseaseAnalysisRecord(
        patient_id=pid,
        performed_by_user_id=current_user.id,
        analysis_date=utc_now(),
        reports_considered_count=raw_analysis["reports_considered_count"],
        symptoms_considered_count=raw_analysis["symptoms_considered_count"],
        highlighted_diseases=highlighted,
        full_results=raw_analysis["ranked_diseases"],
        clinical_notes=f"Automated comparison across {len(DISEASE_KNOWLEDGE_BASE)} reference conditions."
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "analysis_id": record.analysis_id,
        "patient_id": pid,
        "analysis_date": record.analysis_date,
        "disclaimer": CLINICAL_DISCLAIMER,
        "reports_considered_count": record.reports_considered_count,
        "symptoms_considered_count": record.symptoms_considered_count,
        "parameters_evaluated": raw_analysis["parameters_evaluated"],
        "ranked_diseases": raw_analysis["ranked_diseases"]
    }

# -------------------------------------------------------------
# 6. ANALYSIS HISTORY
# -------------------------------------------------------------
@router.get("/patient/{patient_id}/analyses", response_model=List[DiseaseAnalysisSummaryResponse])
def get_patient_analysis_history(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")
    history = db.query(DiseaseAnalysisRecord).filter(
        DiseaseAnalysisRecord.patient_id == pid
    ).order_by(desc(DiseaseAnalysisRecord.analysis_date)).all()
    return history

@router.get("/patient/{patient_id}/analyses/{analysis_id}")
def get_single_analysis_record(
    patient_id: int,
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")
    rec = db.query(DiseaseAnalysisRecord).filter(
        DiseaseAnalysisRecord.analysis_id == analysis_id,
        DiseaseAnalysisRecord.patient_id == pid
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return {
        "analysis_id": rec.analysis_id,
        "patient_id": rec.patient_id,
        "analysis_date": rec.analysis_date.isoformat(),
        "disclaimer": CLINICAL_DISCLAIMER,
        "reports_considered_count": rec.reports_considered_count,
        "symptoms_considered_count": rec.symptoms_considered_count,
        "highlighted_diseases": rec.highlighted_diseases,
        "ranked_diseases": rec.full_results,
        "clinical_notes": rec.clinical_notes
    }
