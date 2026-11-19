"""
PulseBridge Duo — Patient-to-Disease Clinical Comparison Engine
Provides transparent, deterministic, rule-based medical decision support without fabricated probabilities.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.services.disease_knowledge_base import (
    DISEASE_KNOWLEDGE_BASE,
    DIABETES_PARAMETER_REFERENCES
)

CLINICAL_DISCLAIMER = (
    "These results are informational clinical decision-support suggestions, not a medical diagnosis. "
    "Only a qualified healthcare professional can diagnose a condition."
)

def evaluate_patient_against_disease(
    disease: Dict[str, Any],
    patient_profile: Optional[Dict[str, Any]],
    symptoms: List[Dict[str, Any]],
    reports: List[Dict[str, Any]],
    latest_reading: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compares a single patient's clinical profile, symptoms, reports, and parameters against a disease definition.
    Excludes simulated telemetry from genuine clinical evidence.
    """
    matching_symptoms: List[str] = []
    relevant_patient_details: List[str] = []
    relevant_report_findings: List[Dict[str, Any]] = []
    relevant_parameter_observations: List[str] = []
    missing_information: List[str] = []
    score = 0

    age = patient_profile.get("age") if patient_profile else None
    medical_conditions = (patient_profile.get("medical_conditions") or "").lower() if patient_profile else ""

    # 1. Evaluate Symptoms
    disease_symptoms_lower = [s.lower() for s in disease.get("common_symptoms", [])]
    for sym in symptoms:
        sym_name = sym.get("symptom_name", "").lower()
        matched = False
        for ds in disease_symptoms_lower:
            # Substring or token overlap
            tokens = [t for t in sym_name.split() if len(t) > 3]
            if sym_name in ds or any(token in ds for token in tokens):
                matching_symptoms.append(f"{sym.get('symptom_name')} (Severity: {sym.get('severity', 'Moderate')}, Duration: {sym.get('duration', 'N/A')})")
                score += 3
                matched = True
                break

    # 2. Evaluate Patient Demographics & Known Medical Conditions
    if disease["id"] == "diabetes_mellitus":
        if age and age >= 45:
            relevant_patient_details.append(f"Patient age ({age} years) is within the elevated risk tier for metabolic disorders (>= 45 yrs).")
            score += 1
        if "hypertension" in medical_conditions or "high blood pressure" in medical_conditions:
            relevant_patient_details.append("Documented history of hypertension (a frequent comorbidity that elevates cardiovascular and microvascular risks).")
            score += 2

    elif disease["id"] == "hypertension":
        if age and age >= 50:
            relevant_patient_details.append(f"Patient age ({age} years) correlates with age-associated vascular stiffness.")
            score += 1
        if "hypertension" in medical_conditions:
            relevant_patient_details.append("Patient profile records pre-existing mild hypertension diagnosis.")
            score += 4

    elif disease["id"] == "coronary_artery_disease":
        if age and age >= 55:
            relevant_patient_details.append(f"Patient age ({age} years) is within the demographic window for coronary risk evaluation.")
            score += 1
        if "arrhythmia" in medical_conditions or "cardiovascular" in medical_conditions or "hypertension" in medical_conditions:
            relevant_patient_details.append(f"Recorded cardiovascular history: '{patient_profile.get('medical_conditions')}'.")
            score += 2

    elif disease["id"] == "stroke":
        if age and age >= 65:
            relevant_patient_details.append(f"Advancing age ({age} years) is a primary non-modifiable risk factor for cerebrovascular events.")
            score += 1
        if "arrhythmia" in medical_conditions:
            relevant_patient_details.append("Documented nocturnal arrhythmia surveillance warrants assessment of stroke / cardioembolic risk.")
            score += 2

    elif disease["id"] == "chronic_kidney_disease":
        if age and age >= 60:
            relevant_patient_details.append(f"Patient age ({age} years) warrants routine renal filtration screening.")
            score += 1
        if "hypertension" in medical_conditions or "diabetes" in medical_conditions:
            relevant_patient_details.append("Chronic hypertension or metabolic stress accelerates glomerular capillary sclerosis.")
            score += 2

    elif disease["id"] == "copd":
        if age and age >= 40:
            relevant_patient_details.append(f"Patient age ({age} years) meets age threshold for exertional airflow assessment.")

    elif disease["id"] == "heart_failure":
        if age and age >= 65:
            relevant_patient_details.append(f"Patient age ({age} years) aligns with highest incidence cohort for heart failure.")
            score += 1
        if "arrhythmia" in medical_conditions or "hypertension" in medical_conditions:
            relevant_patient_details.append("Recorded arrhythmia or hypertensive history contributes to ventricular workload.")
            score += 2

    # 3. Evaluate Uploaded Medical Reports (Biomarkers & Clinical Findings)
    disease_biomarkers = [b.lower() for b in disease.get("relevant_report_biomarkers", [])]
    has_relevant_report = False

    for rep in reports:
        summary = rep.get("extracted_summary") or {}
        rep_date = rep.get("report_date", "Date unrecorded")
        rep_title = rep.get("report_title", "Medical Report")

        # If summary is a dict of findings
        if isinstance(summary, dict):
            findings_list = summary.get("findings", [])
            # Also check flat keys in summary
            if not findings_list:
                for k, v in summary.items():
                    if k in ["resting_hr_bpm", "ecg_status", "recommended_max_hr", "min_spo2_threshold"]:
                        findings_list.append({"test_name": k.replace("_", " ").title(), "value": v, "unit": ""})

            for f in findings_list:
                t_name = str(f.get("test_name", "")).lower()
                val = f.get("value")
                status = f.get("status", "Normal")

                # Check relevance to this disease
                if disease["id"] == "diabetes_mellitus" and any(k in t_name for k in ["glucose", "hba1c", "fbg", "sugar"]):
                    relevant_report_findings.append({
                        "report": rep_title,
                        "date": rep_date,
                        "finding": f"{f.get('test_name')}: {val} {f.get('unit', '')}",
                        "clinical_interpretation": f"Laboratory finding status: {status}"
                    })
                    score += 5
                    has_relevant_report = True

                elif disease["id"] in ["hypertension", "coronary_artery_disease", "heart_failure"] and any(k in t_name for k in ["blood pressure", "bp", "ecg", "heart rate", "troponin", "cholesterol", "lipid"]):
                    relevant_report_findings.append({
                        "report": rep_title,
                        "date": rep_date,
                        "finding": f"{f.get('test_name')}: {val} {f.get('unit', '')}",
                        "clinical_interpretation": f"Cardiovascular parameter finding: {status}"
                    })
                    score += 3
                    has_relevant_report = True

                elif disease["id"] == "chronic_kidney_disease" and any(k in t_name for k in ["creatinine", "egfr", "bun", "albumin", "protein"]):
                    relevant_report_findings.append({
                        "report": rep_title,
                        "date": rep_date,
                        "finding": f"{f.get('test_name')}: {val} {f.get('unit', '')}",
                        "clinical_interpretation": f"Renal function marker status: {status}"
                    })
                    score += 4
                    has_relevant_report = True

                elif disease["id"] == "anaemia" and any(k in t_name for k in ["hemoglobin", "hematocrit", "ferritin", "iron", "cbc"]):
                    relevant_report_findings.append({
                        "report": rep_title,
                        "date": rep_date,
                        "finding": f"{f.get('test_name')}: {val} {f.get('unit', '')}",
                        "clinical_interpretation": f"Hematologic marker: {status}"
                    })
                    score += 4
                    has_relevant_report = True

                elif disease["id"] == "thyroid_disorders" and any(k in t_name for k in ["tsh", "t4", "t3", "thyroid"]):
                    relevant_report_findings.append({
                        "report": rep_title,
                        "date": rep_date,
                        "finding": f"{f.get('test_name')}: {val} {f.get('unit', '')}",
                        "clinical_interpretation": f"Thyroid panel observation: {status}"
                    })
                    score += 4
                    has_relevant_report = True

    # 4. Evaluate Health Parameters & Sensor Readings
    # NOTE: Strictly differentiate between Genuine Clinical Readings and Simulated Potentiometer Telemetry!
    if latest_reading:
        is_sim = latest_reading.get("simulated", True)
        src = latest_reading.get("source", "UNKNOWN")

        if is_sim:
            # Simulated telemetry disclaimer
            relevant_parameter_observations.append(
                f"Virtual Telemetry Stream ({src}): HR {latest_reading.get('heart_rate_bpm')} bpm, "
                f"SpO2 {latest_reading.get('spo2_percent')}%, BP {latest_reading.get('bp_systolic_mmhg')}/{latest_reading.get('bp_diastolic_mmhg')} mmHg. "
                "(SIMULATED READING — Excluded from genuine clinical disease diagnosis per safety guardrails)."
            )
        else:
            # Genuine sensor readings if available
            hr = latest_reading.get("heart_rate_bpm")
            spo2 = latest_reading.get("spo2_percent")
            sys_bp = latest_reading.get("bp_systolic_mmhg")

            if hr and hr > 100 and disease["id"] in ["coronary_artery_disease", "heart_failure", "anaemia", "thyroid_disorders"]:
                relevant_parameter_observations.append(f"Recorded resting tachycardia ({hr} bpm).")
                score += 1
            if spo2 and spo2 < 92 and disease["id"] in ["copd", "respiratory_infections", "heart_failure"]:
                relevant_parameter_observations.append(f"Recorded oxygen desaturation ({spo2}%).")
                score += 3
            if sys_bp and sys_bp >= 140 and disease["id"] in ["hypertension", "coronary_artery_disease", "stroke"]:
                relevant_parameter_observations.append(f"Elevated systolic arterial pressure ({sys_bp} mmHg).")
                score += 2

    # 5. Identify Missing Information
    if disease["id"] == "diabetes_mellitus":
        if not any("glucose" in r.get("finding", "").lower() or "hba1c" in r.get("finding", "").lower() for r in relevant_report_findings):
            missing_information.append("No official Fasting Plasma Glucose or laboratory HbA1c test recorded in medical vault.")
        missing_information.append("No record of 2-Hour Oral Glucose Tolerance Test (OGTT).")
        missing_information.append("Urine albumin-to-creatinine ratio (uACR) for nephropathy screening is absent.")

    elif disease["id"] == "hypertension":
        missing_information.append("24-Hour Ambulatory Blood Pressure Monitoring (ABPM) log not available.")

    elif disease["id"] == "coronary_artery_disease":
        if not any("troponin" in r.get("finding", "").lower() for r in relevant_report_findings):
            missing_information.append("High-sensitivity cardiac troponin lab result is not on file.")
        missing_information.append("Exercise treadmill stress test or Coronary CT Angiography not uploaded.")

    elif disease["id"] == "chronic_kidney_disease":
        if not any("creatinine" in r.get("finding", "").lower() for r in relevant_report_findings):
            missing_information.append("Recent serum creatinine and eGFR filtration calculation not available.")

    elif disease["id"] == "copd":
        missing_information.append("Post-bronchodilator spirometry (FEV1/FVC ratio) is absent.")

    elif disease["id"] == "anaemia":
        missing_information.append("Complete Blood Count (CBC) and serum ferritin iron stores panel not uploaded.")

    elif disease["id"] == "thyroid_disorders":
        missing_information.append("Serum Thyroid Stimulating Hormone (TSH) and Free T4 assays are not on file.")

    elif disease["id"] == "heart_failure":
        missing_information.append("Serum BNP / NT-proBNP biomarker and Transthoracic Echocardiogram (LVEF) not available.")

    # 6. Determine Match Level Category
    if score >= 8:
        match_level = "Relevant findings identified"
        reason = f"Multiple correlating factors identified: {len(matching_symptoms)} matching symptom(s) and {len(relevant_report_findings)} relevant report finding(s)."
    elif score >= 4:
        match_level = "Some matching information"
        reason = f"Partial clinical alignment identified through reported symptoms ({len(matching_symptoms)}) or patient profile risk characteristics."
    elif score >= 1:
        match_level = "Insufficient information"
        reason = "Limited demographic or baseline risk overlap, but key confirmatory diagnostic laboratory tests and specific symptoms are currently absent."
    else:
        match_level = "No meaningful match identified"
        reason = "No reported symptoms, laboratory findings, or specific clinical risk indicators in the current record correspond to this condition."

    # Recommended next steps
    recommended_next_assessments = disease.get("diagnostic_tests", [])[:3]

    return {
        "disease_id": disease["id"],
        "disease_name": disease["name"],
        "category": disease["category"],
        "short_description": disease["short_description"],
        "match_level": match_level,
        "match_score_rank": score,
        "matching_symptoms": matching_symptoms,
        "relevant_patient_details": relevant_patient_details,
        "relevant_report_findings": relevant_report_findings,
        "relevant_parameter_observations": relevant_parameter_observations,
        "missing_information": missing_information,
        "reason_included": reason,
        "recommended_next_assessments": recommended_next_assessments,
        "medical_references": disease.get("medical_references", []),
        "overview_route": disease.get("overview_route"),
        "important_warning_signs": disease.get("important_warning_signs", [])
    }

def run_disease_analysis_for_patient(
    patient_id: int,
    patient_profile: Optional[Dict[str, Any]],
    symptoms: List[Dict[str, Any]],
    reports: List[Dict[str, Any]],
    latest_reading: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Executes full multi-condition comparison across all 10 major diseases in the clinical knowledge base.
    Ranks results deterministically without fabricated percentages.
    """
    results: List[Dict[str, Any]] = []

    for disease in DISEASE_KNOWLEDGE_BASE:
        evaluation = evaluate_patient_against_disease(
            disease=disease,
            patient_profile=patient_profile,
            symptoms=symptoms,
            reports=reports,
            latest_reading=latest_reading
        )
        results.append(evaluation)

    # Sort deterministically by match_score_rank descending
    results.sort(key=lambda x: x["match_score_rank"], reverse=True)

    parameters_evaluated = {
        "heart_rate_bpm": latest_reading.get("heart_rate_bpm") if latest_reading else None,
        "spo2_percent": latest_reading.get("spo2_percent") if latest_reading else None,
        "bp_systolic_mmhg": latest_reading.get("bp_systolic_mmhg") if latest_reading else None,
        "bp_diastolic_mmhg": latest_reading.get("bp_diastolic_mmhg") if latest_reading else None,
        "glucose_mg_dl": latest_reading.get("glucose_mg_dl") if latest_reading else None,
        "source": latest_reading.get("source") if latest_reading else "No live reading",
        "simulated": latest_reading.get("simulated", True) if latest_reading else True
    }

    return {
        "patient_id": patient_id,
        "analysis_date": datetime.now(timezone.utc).isoformat(),
        "disclaimer": CLINICAL_DISCLAIMER,
        "reports_considered_count": len(reports),
        "symptoms_considered_count": len(symptoms),
        "parameters_evaluated": parameters_evaluated,
        "ranked_diseases": results
    }
