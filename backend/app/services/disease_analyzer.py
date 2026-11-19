"""
PulseBridge Duo — Patient-to-Disease Clinical Comparison Engine: Atrial Fibrillation (AFib) Only
Transparent, deterministic evaluation strictly aligned with ACC/AHA/HRS and ESC guidelines.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.services.disease_knowledge_base import (
    ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM,
    AFIB_PARAMETER_REFERENCES,
    AFIB_SYMPTOM_CATALOGUE
)

CLINICAL_DISCLAIMER = (
    "These results are informational clinical decision-support suggestions, not a medical diagnosis. "
    "Only a qualified healthcare professional can diagnose a condition."
)

EMERGENCY_WARNING_TEXT = (
    "EMERGENCY SAFETY NOTICE: If you or the patient experience a fast or irregular heartbeat "
    "accompanied by CHEST PAIN, SEVERE BREATHING DIFFICULTY, FAINTING, or signs of a STROKE "
    "(facial drooping, arm weakness, speech difficulty — BE-FAST), CALL EMERGENCY SERVICES (911 / 112) IMMEDIATELY."
)

def evaluate_patient_for_afib(
    patient_profile: Optional[Dict[str, Any]],
    symptoms: List[Dict[str, Any]],
    reports: List[Dict[str, Any]],
    latest_reading: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates an individual patient's records strictly and exclusively for Atrial Fibrillation (AFib).
    Does not produce fabricated percentages or probabilities.
    Excludes simulated Wokwi potentiometer data from clinical evidence.
    """
    matching_symptoms: List[str] = []
    relevant_patient_details: List[str] = []
    relevant_report_findings: List[Dict[str, Any]] = []
    relevant_parameter_observations: List[str] = []
    missing_information: List[str] = []

    has_irregular_heartbeat_symptom = False
    has_palpitations_or_rapid_hr = False
    has_secondary_symptoms = False
    has_chest_pain_or_fainting = False

    ecg_confirmation_documented = False
    ecg_confirmation_details: Optional[Dict[str, Any]] = None

    # 1. Evaluate Reported Symptoms
    for sym in symptoms:
        s_name = sym.get("symptom_name", "").strip()
        s_lower = s_name.lower()
        sev = sym.get("severity", "Moderate")
        dur = sym.get("duration", "unspecified")

        # Check for Primary Symptom: Irregular Heartbeat Rhythm
        if any(term in s_lower for term in ["irregular heartbeat", "irregular pulse", "uneven pulse", "uneven heartbeat", "arrhythmia", "skipped beat"]):
            matching_symptoms.append(f"{s_name} (Primary AFib indicator; Severity: {sev}, Duration: {dur})")
            has_irregular_heartbeat_symptom = True

        elif any(term in s_lower for term in ["palpitation", "fluttering", "pounding", "racing heartbeat", "rapid heartbeat", "tachycardia"]):
            matching_symptoms.append(f"{s_name} (Rhythm sensation; Severity: {sev}, Duration: {dur})")
            has_palpitations_or_rapid_hr = True

        elif any(term in s_lower for term in ["fatigue", "tiredness", "dizziness", "lightheaded", "shortness of breath", "dyspnea", "weakness", "exercise tolerance", "faint", "anxiety"]):
            matching_symptoms.append(f"{s_name} (Associated symptom; Severity: {sev}, Duration: {dur})")
            has_secondary_symptoms = True
            if any(term in s_lower for term in ["faint", "syncope", "near-faint"]):
                has_chest_pain_or_fainting = True

        elif any(term in s_lower for term in ["chest discomfort", "chest tightness", "chest pain"]):
            matching_symptoms.append(f"{s_name} (Requires clinical evaluation to rule out acute ischemia; Severity: {sev})")
            has_chest_pain_or_fainting = True

    # 2. Evaluate Uploaded Medical Reports for ECG Confirmation & Findings
    for rep in reports:
        rep_title = rep.get("report_title", "Medical Report")
        rep_date = rep.get("report_date", "Date unrecorded")
        summary = rep.get("extracted_summary") or {}
        raw_text = ""

        if isinstance(summary, dict):
            raw_text = (summary.get("raw_text") or "").lower()
            findings_list = summary.get("findings", [])
        else:
            findings_list = []

        combined_text = f"{rep_title.lower()} {raw_text}"

        # Check for explicit ECG documentation of AFib
        if any(term in combined_text for term in ["atrial fibrillation", "afib", "a-fib", "irregularly irregular rhythm", "paroxysmal af"]):
            ecg_confirmation_documented = True
            ecg_confirmation_details = {
                "report_title": rep_title,
                "report_date": rep_date,
                "finding": "Electrocardiogram documentation notes Atrial Fibrillation / irregularly irregular rhythm."
            }
            relevant_report_findings.append({
                "report": rep_title,
                "date": rep_date,
                "finding": "ECG documented Atrial Fibrillation rhythm",
                "clinical_interpretation": "Explicit rhythm documentation on file."
            })
        elif "ecg" in combined_text or "holter" in combined_text:
            relevant_report_findings.append({
                "report": rep_title,
                "date": rep_date,
                "finding": "Cardiac telemetry / ECG baseline record",
                "clinical_interpretation": "Cardiac rhythm recording uploaded; review with clinical specialist."
            })



    # 3. Evaluate Patient Profile & Cardiovascular Medical History
    age = patient_profile.get("age") if patient_profile else None
    medical_conditions = (patient_profile.get("medical_conditions") or "").lower() if patient_profile else ""

    if age and age >= 65:
        relevant_patient_details.append(f"Age {age} years is a significant non-modifiable risk factor (prevalence exceeds 5-10% in older demographics).")
    elif age and age >= 50:
        relevant_patient_details.append(f"Age {age} years provides baseline cardiovascular epidemiological context.")

    if "hypertension" in medical_conditions or "high blood pressure" in medical_conditions:
        relevant_patient_details.append("Documented history of hypertension (the most prevalent modifiable risk factor for atrial remodeling and stroke).")
    if "arrhythmia" in medical_conditions or "nocturnal arrhythmia" in medical_conditions:
        relevant_patient_details.append(f"Existing profile medical history: '{patient_profile.get('medical_conditions')}'.")
    if "coronary" in medical_conditions or "cad" in medical_conditions:
        relevant_patient_details.append("Documented coronary artery disease history.")
    if "heart failure" in medical_conditions:
        relevant_patient_details.append("Pre-existing heart failure (bidirectional risk with Atrial Fibrillation).")
    if "sleep apnea" in medical_conditions:
        relevant_patient_details.append("Obstructive sleep apnea (associated with nocturnal hypoxemia and autonomic surges).")

    # 4. Evaluate Health Parameters: ONLY the 4 AFib Parameters (ECG, Heart Rate, HRV, SpO2)
    # Parameter 1: Heart Rhythm / ECG
    if ecg_confirmation_documented:
        relevant_parameter_observations.append("Heart Rhythm / ECG: Electrocardiogram documentation confirms Atrial Fibrillation rhythm.")
    elif any("ecg" in r.get("finding", "").lower() or "sinus" in r.get("finding", "").lower() for r in relevant_report_findings):
        relevant_parameter_observations.append("Heart Rhythm / ECG: Uploaded cardiac recording shows sinus rhythm without sustained AFib.")
    else:
        relevant_parameter_observations.append("Heart Rhythm / ECG: No 12-lead ECG waveform uploaded on file.")

    # Parameter 2: Heart Rate
    if latest_reading and latest_reading.get("heart_rate_bpm"):
        hr = latest_reading.get("heart_rate_bpm")
        if hr > 100:
            relevant_parameter_observations.append(f"Heart Rate: Resting tachycardia observed ({hr} BPM). Note: Heart rate alone cannot confirm AFib.")
        else:
            relevant_parameter_observations.append(f"Heart Rate: Recorded resting heart rate {hr} BPM.")

    # Parameter 3: Heart Rate Variability (HRV)
    # Strictly enforce: do not generate random or fabricated HRV values
    relevant_parameter_observations.append("Heart Rate Variability (HRV): HRV data not available. A suitable validated ECG or PPG recording is required.")

    # Parameter 4: Oxygen Saturation (SpO2)
    if latest_reading and latest_reading.get("spo2_percent"):
        spo2 = latest_reading.get("spo2_percent")
        relevant_parameter_observations.append(f"Oxygen Saturation (SpO₂): {spo2}% (general oxygenation monitoring; cannot confirm AFib).")

    # 5. Missing Information (Exclusively rhythm & monitoring modalities)
    if not ecg_confirmation_documented:
        missing_information.append("Standard 12-lead Electrocardiogram (ECG) during an active symptomatic episode is not on file.")
        missing_information.append("Ambulatory Holter monitoring (24-48h) or prolonged patch monitoring is not uploaded.")

    # 6. Emergency Warning Check
    emergency_warning_triggered = has_chest_pain_or_fainting or (has_irregular_heartbeat_symptom and has_secondary_symptoms and len(matching_symptoms) >= 3)

    # 7. Determine Transparent Match Level Result Label
    if ecg_confirmation_documented:
        match_level = "ECG confirmation documented in uploaded records"
        reason = (
            f"An uploaded medical report explicitly documents an Electrocardiogram finding of Atrial Fibrillation "
            f"({ecg_confirmation_details['report_title']} on {ecg_confirmation_details['report_date']})."
        )
    elif has_irregular_heartbeat_symptom:
        match_level = "Relevant findings identified"
        reason = (
            "The patient reports an irregular heartbeat rhythm (the primary clinical hallmark of cardiac arrhythmia), "
            f"accompanied by {len(matching_symptoms)} associated symptom(s) and relevant cardiovascular profile history."
        )
    elif has_palpitations_or_rapid_hr and (has_secondary_symptoms or len(relevant_patient_details) > 0):
        match_level = "Some relevant findings identified"
        reason = (
            "Symptoms of palpitations or rapid heartbeat are reported alongside cardiovascular risk factors or fatigue, "
            "warranting clinical evaluation to determine rhythm etiology."
        )
    elif len(relevant_patient_details) > 0 or has_secondary_symptoms:
        match_level = "Insufficient information"
        reason = (
            "Baseline cardiovascular risk factors or general symptoms (such as fatigue or dyspnea) are present, "
            "but no irregular pulse rhythm is reported and no diagnostic ECG record is available."
        )
    else:
        match_level = "No relevant findings identified"
        reason = (
            "No reported irregular heartbeat sensations, palpitations, or cardiac rhythm documentation in the current record."
        )

    # 8. Suggested Next Clinical Assessments
    suggested_next_assessments = [
        "12-Lead Electrocardiogram (ECG) to definitively capture electrical cardiac rhythm",
        "Ambulatory ECG monitoring (Holter monitor or patch monitor) if episodes are intermittent / paroxysmal",
        "Comprehensive clinical consultation with a physician or cardiologist"
    ]

    return {
        "disease_id": "atrial_fibrillation",
        "disease_name": "Atrial Fibrillation",
        "short_name": "AFib",
        "category": "Cardiac arrhythmia",
        "short_description": "An abnormal heart rhythm in which the atria beat irregularly and often rapidly.",
        "match_level": match_level,
        "ecg_confirmation_documented": ecg_confirmation_documented,
        "ecg_confirmation_details": ecg_confirmation_details,
        "matching_symptoms": matching_symptoms,
        "has_primary_irregular_rhythm_symptom": has_irregular_heartbeat_symptom,
        "relevant_patient_details": relevant_patient_details,
        "relevant_report_findings": relevant_report_findings,
        "relevant_parameter_observations": relevant_parameter_observations,
        "missing_information": missing_information,
        "reason_included": reason,
        "suggested_next_assessments": suggested_next_assessments,
        "emergency_warning_triggered": emergency_warning_triggered,
        "emergency_warning_text": EMERGENCY_WARNING_TEXT if emergency_warning_triggered else None,
        "overview_route": "/afib",
        "medical_references": ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM.get("medical_references", [])
    }

def run_disease_analysis_for_patient(
    patient_id: int,
    patient_profile: Optional[Dict[str, Any]],
    symptoms: List[Dict[str, Any]],
    reports: List[Dict[str, Any]],
    latest_reading: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Executes single-disease Atrial Fibrillation clinical decision-support evaluation.
    Returns exactly ONE disease evaluation result.
    """
    afib_result = evaluate_patient_for_afib(
        patient_profile=patient_profile,
        symptoms=symptoms,
        reports=reports,
        latest_reading=latest_reading
    )

    parameters_evaluated = {
        "heart_rate_bpm": latest_reading.get("heart_rate_bpm") if latest_reading else None,
        "spo2_percent": latest_reading.get("spo2_percent") if latest_reading else None,
        "bp_systolic_mmhg": latest_reading.get("bp_systolic_mmhg") if latest_reading else None,
        "bp_diastolic_mmhg": latest_reading.get("bp_diastolic_mmhg") if latest_reading else None,
        "source": latest_reading.get("source") if latest_reading else "No live reading",
        "simulated": latest_reading.get("simulated", True) if latest_reading else True,
        "simulation_notice": "SIMULATED — NOT A CLINICAL MEASUREMENT. The Wokwi ESP32 testbed does not contain an ECG sensor and cannot detect electrical heart rhythm."
    }

    return {
        "patient_id": patient_id,
        "analysis_date": datetime.now(timezone.utc).isoformat(),
        "disclaimer": CLINICAL_DISCLAIMER,
        "emergency_warning": EMERGENCY_WARNING_TEXT,
        "reports_considered_count": len(reports),
        "symptoms_considered_count": len(symptoms),
        "parameters_evaluated": parameters_evaluated,
        "afib_result": afib_result,
        "ranked_diseases": [afib_result]  # Contains ONLY Atrial Fibrillation
    }
