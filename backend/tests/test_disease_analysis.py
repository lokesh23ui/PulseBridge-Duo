import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def login_user(email: str, password: str = "PulsePass123!"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"], res.json()["user"]

def test_knowledge_base_endpoints():
    # 1. Complete knowledge base list
    res = client.get("/api/disease/knowledge-base")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 10
    disease_ids = [d["id"] for d in data]
    assert "diabetes_mellitus" in disease_ids
    assert "hypertension" in disease_ids
    assert "coronary_artery_disease" in disease_ids
    assert "stroke" in disease_ids
    assert "chronic_kidney_disease" in disease_ids
    assert "copd" in disease_ids
    assert "anaemia" in disease_ids
    assert "thyroid_disorders" in disease_ids
    assert "heart_failure" in disease_ids
    assert "respiratory_infections" in disease_ids

    # 2. Single disease detail
    res_single = client.get("/api/disease/knowledge-base/diabetes_mellitus")
    assert res_single.status_code == 200
    diabetes_data = res_single.json()
    assert diabetes_data["id"] == "diabetes_mellitus"
    assert "Type 1" in diabetes_data["name"]
    assert diabetes_data["overview_route"] == "/diabetes"
    assert len(diabetes_data["medical_references"]) >= 2

    # 3. Diabetes overview with global statistics and parameter reference table
    res_overview = client.get("/api/disease/diabetes-overview")
    assert res_overview.status_code == 200
    overview_data = res_overview.json()
    assert "global_statistics" in overview_data
    assert "parameter_references" in overview_data
    stats = overview_data["global_statistics"]["key_metrics"]
    assert len(stats) >= 4
    # Verify IDF 537 million and WHO 1.5 million deaths
    assert any("537 Million" in s["statistic"] for s in stats)
    assert any("1.5 Million" in s["statistic"] for s in stats)

    # Verify diagnostic thresholds in parameter reference table
    params = overview_data["parameter_references"]
    fbg = next(p for p in params if "Fasting Blood Glucose" in p["parameter_name"])
    assert "126" in fbg["diagnostic_threshold"]
    hba1c = next(p for p in params if "HbA1c" in p["parameter_name"])
    assert "6.5%" in hba1c["diagnostic_threshold"]

def test_patient_diabetes_relation_endpoint():
    token, user = login_user("patient@pulsebridge.demo")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/disease/patient/{user['id']}/diabetes-relation", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "patient" in data
    assert data["patient"]["id"] == user["id"]
    assert "how_diabetes_relates" in data
    assert "relevant_patient_details" in data["how_diabetes_relates"]
    assert "missing_clinical_data" in data["how_diabetes_relates"]
    assert "doctor_review_points" in data["how_diabetes_relates"]

    # If simulated reading exists, check warning label
    if data.get("simulated_glucose_telemetry"):
        assert "SIMULATED READING" in data["simulated_glucose_telemetry"]["warning_label"]

def test_symptom_recording_and_deletion():
    token, user = login_user("patient@pulsebridge.demo")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Symptom
    symptom_payload = {
        "symptom_name": "Nocturnal dry mouth and thirst",
        "duration": "1 week",
        "severity": "Mild",
        "frequency": "Occasional",
        "notes": "Test symptom input via QA test"
    }
    create_res = client.post(f"/api/disease/patient/{user['id']}/symptoms", json=symptom_payload, headers=headers)
    assert create_res.status_code == 201
    created_symptom = create_res.json()
    assert created_symptom["symptom_name"] == "Nocturnal dry mouth and thirst"
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

    # 1. Extract from plain text
    sample_text = (
        "METRO DIAGNOSTICS CLINICAL REPORT\n"
        "Patient: Eleanor Vance Date: 2026-11-10\n"
        "Fasting Blood Glucose: 134 mg/dL\n"
        "HbA1c: 6.7 %\n"
        "Blood Pressure: 142/88 mmHg\n"
        "Serum Creatinine: 1.0 mg/dL\n"
        "Clinical Observation: Patient notes persistent fatigue and excessive thirst."
    )
    extract_res = client.post(
        f"/api/disease/patient/{user['id']}/reports/extract",
        data={"raw_text": sample_text},
        headers=headers
    )
    assert extract_res.status_code == 200
    draft = extract_res.json()
    assert len(draft["findings"]) >= 3
    test_names = [f["test_name"] for f in draft["findings"]]
    assert any("Glucose" in name for name in test_names)
    assert any("HbA1c" in name for name in test_names)
    assert any("Blood Pressure" in name for name in test_names)

    # 2. User confirms & saves report
    confirm_payload = {
        "report_title": "Verified Metabolic Panel (QA Test)",
        "category": "Endocrinology & Metabolic",
        "healthcare_provider": "Metro Diagnostics",
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

    # 1. Execute Analysis
    run_res = client.post(f"/api/disease/patient/{user['id']}/analyze", headers=headers)
    assert run_res.status_code == 200
    analysis = run_res.json()
    assert "analysis_id" in analysis
    assert "disclaimer" in analysis
    assert "Only a qualified healthcare professional can diagnose" in analysis["disclaimer"]
    assert len(analysis["ranked_diseases"]) == 10

    # Verify no fabricated probabilities
    for d in analysis["ranked_diseases"]:
        assert d["match_level"] in [
            "Relevant findings identified",
            "Some matching information",
            "Insufficient information",
            "No meaningful match identified"
        ]
        assert "probability" not in d
        assert "percentage" not in d
        assert "reason_included" in d

    # Verify Diabetes has overview_route set to /diabetes
    diabetes_res = next(d for d in analysis["ranked_diseases"] if d["disease_id"] == "diabetes_mellitus")
    assert diabetes_res["overview_route"] == "/diabetes"

    # 2. Verify History
    hist_res = client.get(f"/api/disease/patient/{user['id']}/analyses", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    assert any(h["analysis_id"] == analysis["analysis_id"] for h in history)

def test_caregiver_permission_isolation():
    cg_token, cg_user = login_user("caregiver@pulsebridge.demo")
    pat_token, pat_user = login_user("patient@pulsebridge.demo")
    cg_headers = {"Authorization": f"Bearer {cg_token}"}

    # 1. Caregiver can access connected approved patient Eleanor Vance
    res_auth = client.get(f"/api/disease/patient/{pat_user['id']}/diabetes-relation", headers=cg_headers)
    assert res_auth.status_code == 200

    # 2. Caregiver cannot access unrelated patient (e.g. ID 9999)
    res_unauth = client.get("/api/disease/patient/9999/diabetes-relation", headers=cg_headers)
    assert res_unauth.status_code in [403, 404]
