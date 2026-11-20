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
    PatientSymptom, DiseaseAnalysisRecord, SystemConfig, AFibSymptomCatalog, AFibParameterCatalog, utc_now
)
from backend.app.api.patients_router import verify_access_to_patient, resolve_patient_user_id
from backend.app.services.disease_knowledge_base import (
    get_all_diseases, get_disease_by_id, get_afib_overview_data, get_diabetes_overview_data,
    DISEASE_KNOWLEDGE_BASE, GLOBAL_AFIB_STATISTICS, AFIB_PARAMETER_REFERENCES, AFIB_SYMPTOM_CATALOGUE,
    ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM
)
from backend.app.services.document_parser import extract_text_from_file, parse_report_text_to_findings
from backend.app.services.disease_analyzer import (
    run_disease_analysis_for_patient, CLINICAL_DISCLAIMER, EMERGENCY_WARNING_TEXT
)
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
    """
    Returns the single-disease clinical knowledge base containing only Atrial Fibrillation (AFib).
    All prior chronic diseases have been decommissioned.
    """
    return get_all_diseases()

@router.get("/knowledge-base/{disease_id}")
def get_disease_detail(disease_id: str):
    """Returns comprehensive clinical reference information for Atrial Fibrillation."""
    d = get_disease_by_id(disease_id)
    if not d:
        raise HTTPException(status_code=404, detail="Disease not found in clinical knowledge base. Only Atrial Fibrillation is supported.")
    return d

@router.get("/afib-overview")
def get_afib_overview(db: Session = Depends(get_db)):
    """Returns complete Atrial Fibrillation overview: clinical background, global stats, parameter reference tables, and symptom catalogue."""
    cfg = db.query(SystemConfig).filter(SystemConfig.config_key == "afib_knowledge").first()
    disease_info = cfg.config_value if (cfg and isinstance(cfg.config_value, dict)) else ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM

    # Symptoms from DB catalog
    db_symptoms = db.query(AFibSymptomCatalog).filter(AFibSymptomCatalog.is_active == True).order_by(AFibSymptomCatalog.sort_order).all()
    if db_symptoms:
        symptoms_list = [
            {
                "id": s.symptom_key,
                "name": s.name,
                "short_description": s.description,
                "clinical_note": s.clinical_significance or "",
                "is_primary": s.is_primary
            }
            for s in db_symptoms
        ]
    else:
        symptoms_list = AFIB_SYMPTOM_CATALOGUE

    # Parameters from DB catalog
    db_params = db.query(AFibParameterCatalog).filter(AFibParameterCatalog.is_active == True).order_by(AFibParameterCatalog.sort_order).all()
    if db_params:
        params_list = [
            {
                "parameter_name": p.name,
                "clinical_role": p.clinical_role,
                "unit": p.unit or "",
                "data_source": "Verified patient records",
                "clinical_limitation": p.limitations or "",
                "clinical_relevance": p.afib_relevance,
                "is_diagnostic": (p.parameter_key == "heart_rhythm_ecg")
            }
            for p in db_params
        ]
    else:
        params_list = AFIB_PARAMETER_REFERENCES

    return {
        "disease_info": disease_info,
        "global_statistics": GLOBAL_AFIB_STATISTICS,
        "parameter_references": params_list,
        "symptoms": symptoms_list
    }

@router.get("/diabetes-overview")
def get_diabetes_overview_legacy(db: Session = Depends(get_db)):
    """Legacy redirect/alias returning AFib overview data."""
    return get_afib_overview(db)

@router.get("/symptom-catalogue")
def get_symptom_catalogue(db: Session = Depends(get_db)):
    """Returns the AFib symptom catalogue with 'Irregular heartbeat rhythm' as primary."""
    db_symptoms = db.query(AFibSymptomCatalog).filter(AFibSymptomCatalog.is_active == True).order_by(AFibSymptomCatalog.sort_order).all()
    if db_symptoms:
        return [
            {
                "id": s.symptom_key,
                "name": s.name,
                "short_description": s.description,
                "clinical_note": s.clinical_significance or "",
                "is_primary": s.is_primary
            }
            for s in db_symptoms
        ]
    return AFIB_SYMPTOM_CATALOGUE

# -------------------------------------------------------------
# 2. PATIENT-SPECIFIC ATRIAL FIBRILLATION RELATION
# -------------------------------------------------------------
@router.get("/patient/{patient_id}/afib-relation")
def get_patient_afib_relation(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dynamically correlates the selected patient's available clinical records, symptoms,
    and profile to Atrial Fibrillation (AFib). Respects caregiver permissions and
    prominently cautions against treating simulated Wokwi potentiometer data as diagnostic evidence.
    """
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")
    patient = db.query(User).filter(User.id == pid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    profile = patient.patient_profile

    # Fetch patient's recorded active symptoms
    symptoms = db.query(PatientSymptom).filter(
        PatientSymptom.patient_id == pid,
        PatientSymptom.is_active == True
    ).order_by(desc(PatientSymptom.created_at)).all()

    # Fetch patient's reports (if permission allows)
    reports = []
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

    # Demographic & Medical History Context
    age = profile.age if profile else None
    conditions = (profile.medical_conditions or "") if profile else ""

    relevant_patient_details = []
    if age:
        if age >= 65:
            relevant_patient_details.append(f"Age {age} years is an established non-modifiable risk factor for Atrial Fibrillation (prevalence exceeds 5% in this demographic).")
        else:
            relevant_patient_details.append(f"Age {age} years provides baseline cardiovascular context.")

    if "hypertension" in conditions.lower():
        relevant_patient_details.append(f"Recorded cardiovascular condition: '{conditions}'. Hypertension is a major clinical risk factor for atrial remodeling and an essential component of the CHA2DS2-VASc stroke risk score.")
    elif conditions:
        relevant_patient_details.append(f"Recorded medical conditions: '{conditions}'.")

    # Match against the 11 AFib Symptoms
    matching_symptoms = []
    afib_keywords = [
        "irregular", "arrhythmia", "palpitation", "flutter", "pounding", "rapid", "tachycardia",
        "fatigue", "tired", "dizziness", "lightheaded", "shortness of breath", "dyspnea",
        "chest discomfort", "chest tightness", "chest pain", "weakness", "exercise tolerance",
        "faint", "syncope", "anxiety"
    ]
    for s in symptoms:
        s_lower = s.symptom_name.lower()
        if any(k in s_lower for k in afib_keywords):
            is_primary = any(pk in s_lower for pk in ["irregular heartbeat", "irregular rhythm", "arrhythmia", "irregular pulse"])
            matching_symptoms.append({
                "symptom_name": s.symptom_name,
                "severity": s.severity,
                "duration": s.duration,
                "frequency": s.frequency,
                "notes": s.notes,
                "is_primary": is_primary
            })

    # Relevant Report Findings (Cardiology, Holter, ECG, Labs)
    relevant_report_findings = []
    for rep in reports:
        summary = rep.extracted_summary or {}
        rep_title = rep.report_title or "Medical Report"
        rep_date_str = rep.report_date.isoformat() if rep.report_date else None

        if isinstance(summary, dict):
            raw_text = (summary.get("raw_text") or "").lower()
            findings = summary.get("findings", [])
            for f in findings:
                t_name = str(f.get("test_name", "")).lower()
                obs = f.get("observation") or ""
                relevant_report_findings.append({
                    "report_title": rep_title,
                    "report_date": rep_date_str,
                    "test_name": f.get("test_name"),
                    "value": f.get("value"),
                    "unit": f.get("unit"),
                    "status": f.get("status", "Normal"),
                    "observation": obs
                })
            # Also capture cardiology-specific summary if present
            if "ecg_status" in summary or "resting_hr_bpm" in summary:
                relevant_report_findings.append({
                    "report_title": rep_title,
                    "report_date": rep_date_str,
                    "test_name": "Holter / Telemetry Summary",
                    "value": f"Resting HR: {summary.get('resting_hr_bpm', 'N/A')} bpm, Rhythm: {summary.get('ecg_status', 'Normal Sinus Rhythm')}",
                    "unit": "",
                    "status": "Review Baseline",
                    "observation": rep.patient_notes or "Baseline telemetry evaluation."
                })
        elif rep.patient_notes:
            relevant_report_findings.append({
                "report_title": rep_title,
                "report_date": rep_date_str,
                "test_name": "Clinical Report Note",
                "value": rep.patient_notes,
                "unit": "",
                "status": "Recorded",
                "observation": "Clinical documentation on file."
            })

    # Missing Clinical Investigations
    missing_clinical_data = [
        "Official 12-lead Electrocardiogram (ECG) during an active symptomatic episode",
        "Extended ambulatory monitoring (7-14 day Holter patch or event monitor)"
    ]

    # Doctor Review / Discussion Points
    doctor_review_points = [
        "Should extended 7-day ECG patch monitoring be scheduled to evaluate intermittent palpitations or irregular sensations?",
        "What thresholds of heart rate elevation or irregularity should trigger immediate clinical re-evaluation?"
    ]

    # Sensor Telemetry & Guardrail
    wokwi_simulation_info = {
        "warning_label": "SIMULATED — NOT A CLINICAL MEASUREMENT.",
        "clinical_caution": "The Wokwi simulator uses synthetic potentiometer data and cannot detect or diagnose cardiac arrhythmias or confirm Atrial Fibrillation. The ESP32 circuit does not include an ECG sensor.",
        "latest_vitals": {
            "heart_rate_bpm": latest_reading.heart_rate_bpm if latest_reading else None,
            "spo2_percent": latest_reading.spo2_percent if latest_reading else None,
            "hrv_ms": None,
            "timestamp": latest_reading.timestamp.isoformat() if latest_reading and latest_reading.timestamp else None,
            "is_simulated": latest_reading.simulated if latest_reading else True,
            "source": latest_reading.source if latest_reading else "UNKNOWN"
        }
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
        "how_afib_relates": {
            "relevant_patient_details": relevant_patient_details,
            "matching_symptoms": matching_symptoms,
            "has_matching_symptoms": len(matching_symptoms) > 0,
            "relevant_report_findings": relevant_report_findings,
            "missing_clinical_data": missing_clinical_data,
            "doctor_review_points": doctor_review_points
        },
        "emergency_warning": EMERGENCY_WARNING_TEXT,
        "wokwi_simulation_info": wokwi_simulation_info,
        "symptoms_catalogue": AFIB_SYMPTOM_CATALOGUE
    }

@router.get("/patient/{patient_id}/diabetes-relation")
def get_patient_diabetes_relation_legacy(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Legacy alias redirecting to AFib relation."""
    return get_patient_afib_relation(patient_id, current_user, db)

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
# 5. PATIENT-BASED ATRIAL FIBRILLATION ANALYSIS ENGINE
# -------------------------------------------------------------
@router.post("/patient/{patient_id}/analyze", response_model=DiseaseAnalysisRunResponse)
def run_disease_analysis(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes clinical patient-based disease analysis strictly and exclusively for Atrial Fibrillation (AFib).
    Produces transparent clinical reasoning with standard result labels and emergency warnings.
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

    # Run Analysis Engine (Strictly for AFib)
    raw_analysis = run_disease_analysis_for_patient(
        patient_id=pid,
        patient_profile=profile_dict,
        symptoms=symptoms,
        reports=reports_dict,
        latest_reading=latest_dict
    )

    # Highlighted summary (AFib entry)
    highlighted = [
        {
            "disease_id": d["disease_id"],
            "disease_name": d["disease_name"],
            "match_level": d["match_level"],
            "reason": d["reason_included"]
        }
        for d in raw_analysis["ranked_diseases"]
        if d["match_level"] in [
            "ECG confirmation documented in uploaded records",
            "Relevant findings identified",
            "Some relevant findings identified"
        ]
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
        clinical_notes="Automated clinical decision-support evaluation for Atrial Fibrillation (AFib)."
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
