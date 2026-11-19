import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def login_user(email: str, password: str = "PulsePass123!"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"], res.json()["user"]

def test_knowledge_base_endpoints():
    # 1. Single-disease knowledge base list: must contain ONLY Atrial Fibrillation
    res = client.get("/api/disease/knowledge-base")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1, f"Expected exactly 1 disease, got {len(data)}"
    afib = data[0]
    assert afib["id"] == "atrial_fibrillation"
    assert afib["name"] == "Atrial Fibrillation"
    assert afib["short_name"] == "AFib"
    assert afib["category"] == "Cardiac arrhythmia"
    assert "abnormal heart rhythm in which the atria beat irregularly" in afib["short_description"]
    assert afib["overview_route"] == "/afib"

    # Confirm old diseases are completely absent
    old_diseases = [
        "diabetes_mellitus", "hypertension", "coronary_artery_disease", "stroke",
        "chronic_kidney_disease", "copd", "anaemia", "thyroid_disorders",
        "heart_failure", "respiratory_infections"
    ]
    ids_in_kb = [d["id"] for d in data]
    for old_d in old_diseases:
        assert old_d not in ids_in_kb

    # 2. Single disease detail for AFib
    res_single = client.get("/api/disease/knowledge-base/atrial_fibrillation")
    assert res_single.status_code == 200
    afib_detail = res_single.json()
    assert afib_detail["id"] == "atrial_fibrillation"
    assert len(afib_detail["medical_references"]) >= 3
    assert len(afib_detail["common_symptoms"]) == 11
    # Check that Irregular heartbeat rhythm is #1
    assert afib_detail["common_symptoms"][0] == "Irregular heartbeat rhythm"

    # 3. Querying an old disease returns 404
    res_old = client.get("/api/disease/knowledge-base/diabetes_mellitus")
    assert res_old.status_code == 404

    # 4. AFib overview endpoint
    res_overview = client.get("/api/disease/afib-overview")
    assert res_overview.status_code == 200
    overview_data = res_overview.json()
    assert "global_statistics" in overview_data
    assert "parameter_references" in overview_data
    assert "symptoms" in overview_data
    assert len(overview_data["symptoms"]) == 11
    assert overview_data["symptoms"][0]["name"] == "Irregular heartbeat rhythm"

    # Verify exactly 4 AFib parameters remain
    params = overview_data["parameter_references"]
    assert len(params) == 4, f"Expected exactly 4 parameters, got {len(params)}"
    param_names = [p["parameter_name"] for p in params]
    assert "Heart Rhythm / ECG" in param_names
    assert "Heart Rate" in param_names
    assert "Heart Rate Variability (HRV)" in param_names
    assert any("Oxygen Saturation" in name for name in param_names)

    # Verify removed parameters do NOT appear
    removed_params = ["Blood Pressure", "Echocardiogram", "Thyroid", "Electrolyte"]
    for p_name in param_names:
        for rem in removed_params:
            assert rem not in p_name, f"Forbidden parameter '{rem}' found in '{p_name}'"

    stats = overview_data["global_statistics"]["key_metrics"]
    assert any("37.5 – 50 Million" in s["statistic"] for s in stats)
    assert any("1 in 3 Lifetime Risk" in s["statistic"] for s in stats)
    assert any("20% – 30% of All Ischemic Strokes" in s["statistic"] for s in stats)
    assert any("Reliable global AFib-specific annual death estimate unavailable" in s["statistic"] for s in stats)

    # 5. Symptom catalogue endpoint
    res_sym = client.get("/api/disease/symptom-catalogue")
    assert res_sym.status_code == 200
    syms = res_sym.json()
    assert len(syms) == 11
    assert syms[0]["name"] == "Irregular heartbeat rhythm"
    assert syms[0]["is_primary"] is True

def test_patient_afib_relation_endpoint():
    token, user = login_user("patient@pulsebridge.demo")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/disease/patient/{user['id']}/afib-relation", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "patient" in data
    assert data["patient"]["id"] == user["id"]
    assert "how_afib_relates" in data
    assert "relevant_patient_details" in data["how_afib_relates"]
    assert "missing_clinical_data" in data["how_afib_relates"]
    assert "doctor_review_points" in data["how_afib_relates"]

    # Verify Wokwi simulation caution label
    assert "wokwi_simulation_info" in data
    assert "SIMULATED — NOT A CLINICAL MEASUREMENT." in data["wokwi_simulation_info"]["warning_label"]
    assert "cannot detect or diagnose cardiac arrhythmias" in data["wokwi_simulation_info"]["clinical_caution"]

    # Verify Emergency Warning text
    assert "emergency_warning" in data
    assert "EMERGENCY" in data["emergency_warning"]

def test_symptom_recording_and_deletion():
    token, user = login_user("patient@pulsebridge.demo")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Symptom (from 11 AFib catalogue)
    symptom_payload = {
        "symptom_name": "Irregular heartbeat rhythm",
        "duration": "1 week",
        "severity": "Moderate",
        "frequency": "Intermittent",
        "notes": "Test symptom input via QA test"
    }
    create_res = client.post(f"/api/disease/patient/{user['id']}/symptoms", json=symptom_payload, headers=headers)
    assert create_res.status_code == 201
    created_symptom = create_res.json()
    assert created_symptom["symptom_name"] == "Irregular heartbeat rhythm"
    symptom_id = created_symptom["id"]

    # 2. Verify in List
    list_res = client.get(f"/api/disease/patient/{user['id']}/symptoms", headers=headers)
    assert list_res.status_code == 200
    symptoms = list_res.json()
    assert any(s["id"] == symptom_id for s in symptoms)

    # 3. Delete Symptom
    del_res = client.delete(f"/api/disease/patient/{user['id']}/symptoms/{symptom_id}", headers=headers)
    assert del_res.status_code == 200

    # 4. Confirm it is no longer in active list
    list_after = client.get(f"/api/disease/patient/{user['id']}/symptoms", headers=headers).json()
    assert not any(s["id"] == symptom_id for s in list_after)

def test_report_draft_extraction_and_confirmation():
    token, user = login_user("patient@pulsebridge.demo")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Extract from plain text with ECG interpretation
    sample_text = (
        "CARDIOLOGY CONSULTATION & ECG REPORT\n"
        "Patient: Eleanor Vance Date: 2026-11-10\n"
        "12-Lead Electrocardiogram Interpretation: Sinus Rhythm with frequent Premature Atrial Contractions (PACs)\n"
        "Resting Heart Rate: 78 bpm\n"
        "Blood Pressure: 138/84 mmHg\n"
        "TSH: 1.8 mIU/L\n"
        "Clinical Observation: Patient notes palpitations and irregular heartbeat sensations."
    )
    extract_res = client.post(
        f"/api/disease/patient/{user['id']}/reports/extract",
        data={"raw_text": sample_text},
        headers=headers
    )
    assert extract_res.status_code == 200
    draft = extract_res.json()
    assert len(draft["findings"]) >= 3

    # 2. User confirms & saves report
    confirm_payload = {
        "report_title": "Cardiology Consultation & ECG Report (QA Test)",
        "category": "Cardiology",
        "healthcare_provider": "Metro Heart Center",
        "findings": draft["findings"],
        "raw_text": draft["raw_text"],
        "patient_notes": "Reviewed and confirmed by patient"
    }
    confirm_res = client.post(
        f"/api/disease/patient/{user['id']}/reports/confirm",
        json=confirm_payload,
        headers=headers
    )
    assert confirm_res.status_code == 201
    assert "report_id" in confirm_res.json()

def test_disease_analysis_run_and_history():
    token, user = login_user("patient@pulsebridge.demo")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Execute Analysis: strictly evaluates ONLY Atrial Fibrillation
    run_res = client.post(f"/api/disease/patient/{user['id']}/analyze", headers=headers)
    assert run_res.status_code == 200
    analysis = run_res.json()
    assert "analysis_id" in analysis
    assert "disclaimer" in analysis
    assert "Only a qualified healthcare professional can diagnose" in analysis["disclaimer"]
    
    # Must contain ONLY 1 disease in ranked_diseases
    assert len(analysis["ranked_diseases"]) == 1, f"Expected 1 disease, got {len(analysis['ranked_diseases'])}"
    afib_result = analysis["ranked_diseases"][0]
    assert afib_result["disease_id"] == "atrial_fibrillation"
    assert afib_result["disease_name"] == "Atrial Fibrillation"
    assert afib_result["category"] == "Cardiac arrhythmia"
    assert afib_result["overview_route"] == "/afib"

    # Verify result label is strictly one of the 5 allowed labels
    valid_labels = [
        "Relevant findings identified",
        "Some relevant findings identified",
        "Insufficient information",
        "No relevant findings identified",
        "ECG confirmation documented in uploaded records"
    ]
    assert afib_result["match_level"] in valid_labels
    assert "probability" not in afib_result
    assert "percentage" not in afib_result
    assert "reason_included" in afib_result

    # 2. Verify History
    hist_res = client.get(f"/api/disease/patient/{user['id']}/analyses", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    assert any(h["analysis_id"] == analysis["analysis_id"] for h in history)

def test_ecg_confirmation_match_label():
    """Test that explicit ECG documentation produces 'ECG confirmation documented in uploaded records'"""
    token, user = login_user("patient@pulsebridge.demo")
    headers = {"Authorization": f"Bearer {token}"}

    # Upload report with explicit AFib diagnosis on ECG
    confirm_payload = {
        "report_title": "12-Lead ECG - Confirmed Atrial Fibrillation",
        "category": "Cardiology",
        "healthcare_provider": "Emergency Department Telemetry",
        "findings": [
            {
                "test_name": "ECG Rhythm Finding",
                "value": "Atrial Fibrillation with Rapid Ventricular Response",
                "unit": "",
                "status": "Critical",
                "observation": "Irregularly irregular rhythm, absence of distinct P waves, ventricular rate 132 bpm."
            }
        ],
        "raw_text": "ECG rhythm demonstrates Atrial Fibrillation with rapid ventricular rate. Irregularly irregular ventricular response.",
        "patient_notes": "Symptomatic presentation with rapid irregular palpitations."
    }
    confirm_res = client.post(
        f"/api/disease/patient/{user['id']}/reports/confirm",
        json=confirm_payload,
        headers=headers
    )
    assert confirm_res.status_code == 201

    # Run analysis
    run_res = client.post(f"/api/disease/patient/{user['id']}/analyze", headers=headers)
    assert run_res.status_code == 200
    analysis = run_res.json()
    afib_result = analysis["ranked_diseases"][0]
    assert afib_result["match_level"] == "ECG confirmation documented in uploaded records"
    assert afib_result["ecg_confirmation_documented"] is True

def test_caregiver_permission_isolation():
    cg_token, cg_user = login_user("caregiver@pulsebridge.demo")
    pat_token, pat_user = login_user("patient@pulsebridge.demo")
    cg_headers = {"Authorization": f"Bearer {cg_token}"}

    # 1. Caregiver can access connected approved patient Eleanor Vance
    res_auth = client.get(f"/api/disease/patient/{pat_user['id']}/afib-relation", headers=cg_headers)
    assert res_auth.status_code == 200

    # 2. Caregiver cannot access unrelated patient (e.g. ID 9999)
    res_unauth = client.get("/api/disease/patient/9999/afib-relation", headers=cg_headers)
    assert res_unauth.status_code in [403, 404]
