import uuid
import datetime
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

# ==============================================================================
# SECTION 1: AUTHENTICATION TESTING
# ==============================================================================

def test_auth_complete_lifecycle(client):
    uid = uuid.uuid4().hex[:6]
    p_email = f"qa_patient_{uid}@pulsebridge.com"
    c_email = f"qa_caregiver_{uid}@pulsebridge.com"
    pwd = "StrongSecurePassword123!"

    # 1. Register Patient
    p_res = client.post("/api/auth/register", json={
        "email": p_email,
        "password": pwd,
        "role": "patient",
        "full_name": f"QA Patient {uid}",
        "age": 69,
        "blood_type": "A+",
        "emergency_contact": "Son (+1-555-0199)",
        "medical_conditions": "Arrhythmia, Stage 1 Hypertension"
    })
    assert p_res.status_code == 201, f"Patient register failed: {p_res.text}"
    p_data = p_res.json()
    assert p_data["user"]["role"] == "patient"
    assert p_data["user"]["email"] == p_email
    p_token = p_data["access_token"]
    p_user_id = p_data["user"]["id"]

    # 2. Register Caregiver
    c_res = client.post("/api/auth/register", json={
        "email": c_email,
        "password": pwd,
        "role": "caregiver",
        "full_name": f"QA Caregiver {uid}",
        "relationship_to_patient": "Son",
        "contact_phone": "+1-555-0188"
    })
    assert c_res.status_code == 201, f"Caregiver register failed: {c_res.text}"
    c_data = c_res.json()
    assert c_data["user"]["role"] == "caregiver"
    c_token = c_data["access_token"]
    c_user_id = c_data["user"]["id"]

    # 3. Independent Login Verification
    login_p = client.post("/api/auth/login", json={"email": p_email, "password": pwd})
    assert login_p.status_code == 200
    assert login_p.json()["user"]["role"] == "patient"

    login_c = client.post("/api/auth/login", json={"email": c_email, "password": pwd})
    assert login_c.status_code == 200
    assert login_c.json()["user"]["role"] == "caregiver"

    # 4. Invalid Password Rejection
    bad_login = client.post("/api/auth/login", json={"email": p_email, "password": "WrongPassword"})
    assert bad_login.status_code == 401
    assert "invalid" in bad_login.json()["detail"].lower()

    # 5. Protected Route Authorization Checks
    # Valid Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {p_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == p_email

    # Missing token -> 401
    no_auth = client.get("/api/auth/me")
    assert no_auth.status_code == 401

    # Forged/Invalid token -> 401
    fake_auth = client.get("/api/auth/me", headers={"Authorization": "Bearer fake.jwt.signature"})
    assert fake_auth.status_code == 401

    # 6. Role Protection Enforcement (Caregiver cannot call patient-only endpoints)
    caregiver_illegal_invite = client.post(
        "/api/family/invitations",
        json={},
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert caregiver_illegal_invite.status_code == 400 or caregiver_illegal_invite.status_code == 403


# ==============================================================================
# SECTION 2: PATIENT–CAREGIVER CONNECTION LIFECYCLE
# ==============================================================================

def test_family_connection_comprehensive(client):
    uid = uuid.uuid4().hex[:6]
    p_email = f"pat_{uid}@test.com"
    c1_email = f"cg1_{uid}@test.com"
    c2_email = f"cg2_{uid}@test.com"
    pwd = "Password123!"

    # Create Patient & two separate Caregivers
    p_reg = client.post("/api/auth/register", json={"email": p_email, "password": pwd, "role": "patient", "full_name": "Eleanor Test"})
    p_token = p_reg.json()["access_token"]
    p_id = p_reg.json()["user"]["id"]

    c1_reg = client.post("/api/auth/register", json={"email": c1_email, "password": pwd, "role": "caregiver", "full_name": "Caregiver One"})
    c1_token = c1_reg.json()["access_token"]

    c2_reg = client.post("/api/auth/register", json={"email": c2_email, "password": pwd, "role": "caregiver", "full_name": "Caregiver Two"})
    c2_token = c2_reg.json()["access_token"]

    # 1. Generate Invitation 1
    inv1_res = client.post("/api/family/invitations", json={}, headers={"Authorization": f"Bearer {p_token}"})
    assert inv1_res.status_code == 201
    code1 = inv1_res.json()["invitation_code"]
    assert code1.startswith("PBD-")

    # 2. Caregiver 1 Redeems Code 1
    red1 = client.post("/api/family/redeem", json={"invitation_code": code1, "relationship_label": "Son"}, headers={"Authorization": f"Bearer {c1_token}"})
    assert red1.status_code == 200
    rel1_id = red1.json()["id"]
    assert red1.json()["status"] == "pending_approval"

    # 3. Single-Use Verification (Reuse of token must fail)
    re_reuse = client.post("/api/family/redeem", json={"invitation_code": code1}, headers={"Authorization": f"Bearer {c2_token}"})
    assert re_reuse.status_code in (400, 404), "Re-use of single-use invitation must be rejected"

    # 4. Patient Rejection Flow: Generate code for Caregiver 2, redeem, and reject
    inv2_res = client.post("/api/family/invitations", json={}, headers={"Authorization": f"Bearer {p_token}"})
    code2 = inv2_res.json()["invitation_code"]

    red2 = client.post("/api/family/redeem", json={"invitation_code": code2, "relationship_label": "Nurse"}, headers={"Authorization": f"Bearer {c2_token}"})
    assert red2.status_code == 200
    rel2_id = red2.json()["id"]

    # Patient Rejects Caregiver 2
    rej_res = client.post(f"/api/family/requests/{rel2_id}/reject", headers={"Authorization": f"Bearer {p_token}"})
    assert rej_res.status_code == 200

    # Caregiver 2 should NOT have active access
    c2_patients = client.get("/api/patients", headers={"Authorization": f"Bearer {c2_token}"})
    assert len(c2_patients.json()) == 0

    # 5. Patient Approves Caregiver 1
    appr_res = client.post(
        f"/api/family/requests/{rel1_id}/approve",
        json={"permissions": {"view_live_readings": True, "view_historical_readings": True, "view_medical_reports": True}},
        headers={"Authorization": f"Bearer {p_token}"}
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "active"

    # Verify Caregiver 1 now sees patient in dashboard
    c1_patients = client.get("/api/patients", headers={"Authorization": f"Bearer {c1_token}"})
    assert len(c1_patients.json()) == 1
    assert c1_patients.json()[0]["patient_id"] == p_id


# ==============================================================================
# SECTION 3: ALL SEVEN PERMISSIONS & SECURITY TESTING
# ==============================================================================

def test_all_seven_permissions_isolated(client):
    uid = uuid.uuid4().hex[:6]
    p_email = f"perm_patient_{uid}@test.com"
    c_email = f"perm_caregiver_{uid}@test.com"
    unrelated_email = f"unrelated_{uid}@test.com"
    pwd = "Password123!"

    # Register Patient & Caregiver
    p_token = client.post("/api/auth/register", json={"email": p_email, "password": pwd, "role": "patient", "full_name": "Perm Patient"}).json()["access_token"]
    p_id = client.get("/api/auth/me", headers={"Authorization": f"Bearer {p_token}"}).json()["id"]

    c_token = client.post("/api/auth/register", json={"email": c_email, "password": pwd, "role": "caregiver", "full_name": "Perm Caregiver"}).json()["access_token"]
    unrelated_token = client.post("/api/auth/register", json={"email": unrelated_email, "password": pwd, "role": "caregiver", "full_name": "Unrelated Caregiver"}).json()["access_token"]

    # Connect Patient and Caregiver
    code = client.post("/api/family/invitations", json={}, headers={"Authorization": f"Bearer {p_token}"}).json()["invitation_code"]
    rel_id = client.post("/api/family/redeem", json={"invitation_code": code}, headers={"Authorization": f"Bearer {c_token}"}).json()["id"]

    # Ingest a baseline reading for this patient so data exists
    client.post("/api/sensor-data", json={
        "device_id": "PB-RING-01",
        "source": "RING_SIMULATOR",
        "simulated": True,
        "patient_id": p_id,
        "heart_rate_bpm": 74.0,
        "spo2_percent": 98.0,
        "bp_systolic_mmhg": 120.0,
        "bp_diastolic_mmhg": 80.0
    })

    # Upload a medical report as patient
    rep_res = client.post(f"/api/patients/{p_id}/reports", json={
        "report_title": "Confidential Cardiology Workup",
        "category": "Cardiology",
        "healthcare_provider": "St. Jude Clinic",
        "extracted_summary": "Ejection fraction 62%, normal sinus rhythm."
    }, headers={"Authorization": f"Bearer {p_token}"})
    rep_id = rep_res.json()["id"]

    # -------------------------------------------------------------
    # TEST PERMISSION 1: view_live_readings
    # -------------------------------------------------------------
    # Approve with view_live_readings = False
    client.post(f"/api/family/requests/{rel_id}/approve", json={"permissions": {"view_live_readings": False}}, headers={"Authorization": f"Bearer {p_token}"})
    res_deny = client.get(f"/api/patients/{p_id}/overview", headers={"Authorization": f"Bearer {c_token}"})
    assert res_deny.status_code == 403, f"Expected 403 when view_live_readings=False, got {res_deny.status_code}"

    # Grant view_live_readings = True
    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_live_readings": True}, headers={"Authorization": f"Bearer {p_token}"})
    res_allow = client.get(f"/api/patients/{p_id}/overview", headers={"Authorization": f"Bearer {c_token}"})
    assert res_allow.status_code == 200

    # -------------------------------------------------------------
    # TEST PERMISSION 2: view_historical_readings
    # -------------------------------------------------------------
    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_live_readings": True, "view_historical_readings": False}, headers={"Authorization": f"Bearer {p_token}"})
    assert client.get(f"/api/patients/{p_id}/history", headers={"Authorization": f"Bearer {c_token}"}).status_code == 403

    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_live_readings": True, "view_historical_readings": True}, headers={"Authorization": f"Bearer {p_token}"})
    assert client.get(f"/api/patients/{p_id}/history", headers={"Authorization": f"Bearer {c_token}"}).status_code == 200

    # -------------------------------------------------------------
    # TEST PERMISSION 3: view_health_trends
    # -------------------------------------------------------------
    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_health_trends": False}, headers={"Authorization": f"Bearer {p_token}"})
    assert client.get(f"/api/patients/{p_id}/trends", headers={"Authorization": f"Bearer {c_token}"}).status_code == 403

    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_health_trends": True}, headers={"Authorization": f"Bearer {p_token}"})
    trend_res = client.get(f"/api/patients/{p_id}/trends", headers={"Authorization": f"Bearer {c_token}"})
    assert trend_res.status_code == 200
    assert "heart_rate_trend" in trend_res.json()

    # -------------------------------------------------------------
    # TEST PERMISSION 4: view_device_status
    # -------------------------------------------------------------
    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_device_status": False}, headers={"Authorization": f"Bearer {p_token}"})
    assert client.get(f"/api/patients/{p_id}/devices", headers={"Authorization": f"Bearer {c_token}"}).status_code == 403

    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_device_status": True}, headers={"Authorization": f"Bearer {p_token}"})
    assert client.get(f"/api/patients/{p_id}/devices", headers={"Authorization": f"Bearer {c_token}"}).status_code == 200

    # -------------------------------------------------------------
    # TEST PERMISSION 5: view_medical_reports (HIPAA Boundary)
    # -------------------------------------------------------------
    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_medical_reports": False}, headers={"Authorization": f"Bearer {p_token}"})
    assert client.get(f"/api/patients/{p_id}/reports", headers={"Authorization": f"Bearer {c_token}"}).status_code == 403
    assert client.get(f"/api/patients/{p_id}/reports/{rep_id}", headers={"Authorization": f"Bearer {c_token}"}).status_code == 403

    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"view_medical_reports": True}, headers={"Authorization": f"Bearer {p_token}"})
    assert client.get(f"/api/patients/{p_id}/reports", headers={"Authorization": f"Bearer {c_token}"}).status_code == 200
    assert client.get(f"/api/patients/{p_id}/reports/{rep_id}", headers={"Authorization": f"Bearer {c_token}"}).status_code == 200

    # -------------------------------------------------------------
    # TEST PERMISSION 6: create_manage_alert_rules
    # -------------------------------------------------------------
    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"create_manage_alert_rules": False}, headers={"Authorization": f"Bearer {p_token}"})
    create_rule_denied = client.post(f"/api/patients/{p_id}/alert-rules", json={
        "parameter": "heart_rate_bpm", "condition": "greater_than", "threshold": 125.0
    }, headers={"Authorization": f"Bearer {c_token}"})
    assert create_rule_denied.status_code == 403

    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"create_manage_alert_rules": True}, headers={"Authorization": f"Bearer {p_token}"})
    create_rule_allowed = client.post(f"/api/patients/{p_id}/alert-rules", json={
        "parameter": "heart_rate_bpm", "condition": "greater_than", "threshold": 125.0
    }, headers={"Authorization": f"Bearer {c_token}"})
    assert create_rule_allowed.status_code == 201
    rule_id = create_rule_allowed.json()["id"]

    # -------------------------------------------------------------
    # TEST PERMISSION 7: acknowledge_alerts
    # -------------------------------------------------------------
    # Trigger an acute reading for this patient
    ingest_res = client.post(f"/api/patients/{p_id}/controlled-reading", json={
        "heart_rate_bpm": 138.0, "spo2_percent": 96.0
    }, headers={"Authorization": f"Bearer {p_token}"})
    assert ingest_res.status_code == 201

    # Get the generated alert
    alerts = client.get(f"/api/patients/{p_id}/alerts", headers={"Authorization": f"Bearer {p_token}"}).json()
    assert len(alerts) >= 1
    alert_to_ack = alerts[0]["alert_id"]

    # Deny acknowledge_alerts
    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"acknowledge_alerts": False}, headers={"Authorization": f"Bearer {p_token}"})
    ack_denied = client.post(f"/api/alerts/{alert_to_ack}/acknowledge", headers={"Authorization": f"Bearer {c_token}"})
    assert ack_denied.status_code == 403

    # Allow acknowledge_alerts
    client.put(f"/api/family/relationships/{rel_id}/permissions", json={"acknowledge_alerts": True}, headers={"Authorization": f"Bearer {p_token}"})
    ack_allowed = client.post(f"/api/alerts/{alert_to_ack}/acknowledge", headers={"Authorization": f"Bearer {c_token}"})
    assert ack_allowed.status_code == 200

    # -------------------------------------------------------------
    # HORIZONTAL PRIVILEGE ESCALATION (UNRELATED CAREGIVER)
    # -------------------------------------------------------------
    # Unrelated caregiver must NOT be able to view this patient
    assert client.get(f"/api/patients/{p_id}/overview", headers={"Authorization": f"Bearer {unrelated_token}"}).status_code == 403
    assert client.get(f"/api/patients/{p_id}/reports", headers={"Authorization": f"Bearer {unrelated_token}"}).status_code == 403

    # -------------------------------------------------------------
    # IMMEDIATE REVOCATION TEST
    # -------------------------------------------------------------
    revoke_res = client.delete(f"/api/family/relationships/{rel_id}", headers={"Authorization": f"Bearer {p_token}"})
    assert revoke_res.status_code == 200

    # Caregiver immediately blocked across all endpoints
    assert client.get(f"/api/patients/{p_id}/overview", headers={"Authorization": f"Bearer {c_token}"}).status_code == 403
    assert client.get(f"/api/patients/{p_id}/history", headers={"Authorization": f"Bearer {c_token}"}).status_code == 403


# ==============================================================================
# SECTION 4: ALERT ENGINE, RECOVERY & NOTIFICATIONS
# ==============================================================================

def test_alert_engine_and_recovery_flow(client):
    uid = uuid.uuid4().hex[:6]
    p_email = f"alert_pat_{uid}@test.com"
    c_email = f"alert_cg_{uid}@test.com"
    pwd = "Password123!"

    p_token = client.post("/api/auth/register", json={"email": p_email, "password": pwd, "role": "patient", "full_name": "Eleanor AlertTest"}).json()["access_token"]
    p_id = client.get("/api/auth/me", headers={"Authorization": f"Bearer {p_token}"}).json()["id"]

    c_token = client.post("/api/auth/register", json={"email": c_email, "password": pwd, "role": "caregiver", "full_name": "Marcus AlertTest"}).json()["access_token"]

    # Connect
    code = client.post("/api/family/invitations", json={}, headers={"Authorization": f"Bearer {p_token}"}).json()["invitation_code"]
    rel_id = client.post("/api/family/redeem", json={"invitation_code": code}, headers={"Authorization": f"Bearer {c_token}"}).json()["id"]
    client.post(f"/api/family/requests/{rel_id}/approve", json={"permissions": {
        "view_live_readings": True, "create_manage_alert_rules": True, "acknowledge_alerts": True
    }}, headers={"Authorization": f"Bearer {p_token}"})

    # 1. Caregiver creates custom heart rate rule: HR > 120 bpm, cooldown 300s
    rule_res = client.post(f"/api/patients/{p_id}/alert-rules", json={
        "parameter": "heart_rate_bpm",
        "condition": "greater_than",
        "threshold": 120.0,
        "severity": "CRITICAL",
        "cooldown_seconds": 300,
        "enabled": True
    }, headers={"Authorization": f"Bearer {c_token}"})
    assert rule_res.status_code == 201

    # 2. Ingest controlled reading triggering alert: HR = 142 bpm
    ingest_res = client.post(f"/api/patients/{p_id}/controlled-reading", json={
        "heart_rate_bpm": 142.0,
        "spo2_percent": 95.0,
        "bp_systolic_mmhg": 130.0,
        "bp_diastolic_mmhg": 85.0
    }, headers={"Authorization": f"Bearer {p_token}"})
    assert ingest_res.status_code == 201
    assert ingest_res.json()["alerts_generated"] >= 1

    # 3. Verify in-app notifications delivered to Caregiver
    c_notifs = client.get("/api/notifications", headers={"Authorization": f"Bearer {c_token}"}).json()
    assert len(c_notifs) >= 1
    alert_notif = c_notifs[0]
    assert "Heart Rate" in alert_notif["title"] or "Eleanor" in alert_notif["title"] or "142" in alert_notif["message"]

    # 4. Verify Duplicate Prevention & Cooldown Enforcement
    # Second reading with HR = 145 within 300s cooldown should NOT create duplicate notifications
    prior_notif_count = len(c_notifs)
    client.post(f"/api/patients/{p_id}/controlled-reading", json={"heart_rate_bpm": 145.0}, headers={"Authorization": f"Bearer {p_token}"})
    c_notifs_after = client.get("/api/notifications", headers={"Authorization": f"Bearer {c_token}"}).json()
    assert len(c_notifs_after) == prior_notif_count, "Cooldown must prevent duplicate alert spam"

    # 5. Recovery Detection
    # Ingest a normal reading (HR = 72 bpm)
    client.post(f"/api/patients/{p_id}/controlled-reading", json={"heart_rate_bpm": 72.0, "spo2_percent": 98.0}, headers={"Authorization": f"Bearer {p_token}"})
    c_notifs_recovery = client.get("/api/notifications", headers={"Authorization": f"Bearer {c_token}"}).json()
    assert len(c_notifs_recovery) > prior_notif_count
    latest_notif = c_notifs_recovery[0]
    assert "recovered" in latest_notif["title"].lower() or "safe" in latest_notif["message"].lower() or latest_notif["severity"] == "INFO"

    # 6. Read / Unread Lifecycle
    unread_before = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {c_token}"}).json()["unread_count"]
    assert unread_before >= 1

    # Mark single read
    client.put(f"/api/notifications/{latest_notif['id']}/read", headers={"Authorization": f"Bearer {c_token}"})
    unread_after_single = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {c_token}"}).json()["unread_count"]
    assert unread_after_single == unread_before - 1

    # Mark all read
    client.post("/api/notifications/read-all", headers={"Authorization": f"Bearer {c_token}"})
    unread_final = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {c_token}"}).json()["unread_count"]
    assert unread_final == 0
