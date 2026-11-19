import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_preseeded_demo_logins(client):
    # 1. Eleanor Vance (Patient)
    p_res = client.post("/api/auth/login", json={
        "email": "patient@pulsebridge.demo",
        "password": "PulsePass123!"
    })
    assert p_res.status_code == 200, f"Patient login failed: {p_res.text}"
    p_data = p_res.json()
    assert p_data["user"]["role"] == "patient"
    assert "Eleanor" in p_data["user"]["full_name"]
    assert "access_token" in p_data

    # 2. Marcus Vance (Caregiver)
    c_res = client.post("/api/auth/login", json={
        "email": "caregiver@pulsebridge.demo",
        "password": "PulsePass123!"
    })
    assert c_res.status_code == 200, f"Caregiver login failed: {c_res.text}"
    c_data = c_res.json()
    assert c_data["user"]["role"] == "caregiver"
    assert "Marcus" in c_data["user"]["full_name"]
    assert "access_token" in c_data

def test_user_registration_and_auth_flow(client):
    uid = uuid.uuid4().hex[:6]
    # Register Patient
    p_email = f"alice_{uid}@test.com"
    p_reg = client.post("/api/auth/register", json={
        "email": p_email,
        "password": "Password123!",
        "role": "patient",
        "full_name": "Alice Patient",
        "age": 68,
        "emergency_contact": "Bob (+1-555-0199)"
    })
    assert p_reg.status_code == 201
    p_token = p_reg.json()["access_token"]
    assert p_reg.json()["user"]["role"] == "patient"

    # Register Caregiver
    c_email = f"bob_{uid}@test.com"
    c_reg = client.post("/api/auth/register", json={
        "email": c_email,
        "password": "Password123!",
        "role": "caregiver",
        "full_name": "Bob Caregiver",
        "relationship_to_patient": "Son"
    })
    assert c_reg.status_code == 201
    c_token = c_reg.json()["access_token"]
    assert c_reg.json()["user"]["role"] == "caregiver"

    # Auth me endpoint
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {p_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == p_email

    # Duplicate registration should fail
    dup_res = client.post("/api/auth/register", json={
        "email": p_email,
        "password": "Password123!",
        "role": "patient",
        "full_name": "Duplicate Alice"
    })
    assert dup_res.status_code == 400
    assert "already" in dup_res.json()["detail"].lower()

def test_family_invitation_redemption_and_approval(client):
    # 1. Login as Eleanor Vance
    p_login = client.post("/api/auth/login", json={
        "email": "patient@pulsebridge.demo",
        "password": "PulsePass123!"
    })
    assert p_login.status_code == 200
    p_token = p_login.json()["access_token"]

    # 2. Generate invitation code
    inv_res = client.post(
        "/api/family/invitations",
        json={},
        headers={"Authorization": f"Bearer {p_token}"}
    )
    assert inv_res.status_code == 201
    inv_data = inv_res.json()
    invite_code = inv_data["invitation_code"]
    assert invite_code.startswith("PBD-")

    # 3. Register a new caregiver to redeem
    uid = uuid.uuid4().hex[:6]
    c_res = client.post("/api/auth/register", json={
        "email": f"nurse_{uid}@test.com",
        "password": "Password123!",
        "role": "caregiver",
        "full_name": "Nurse Clara",
        "relationship_to_patient": "Visiting Nurse"
    })
    assert c_res.status_code == 201
    c_token = c_res.json()["access_token"]

    # 4. Caregiver redeems code
    redeem_res = client.post(
        "/api/family/redeem",
        json={"invitation_code": invite_code, "relationship_label": "Visiting Nurse"},
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert redeem_res.status_code == 200
    rel_data = redeem_res.json()
    rel_id = rel_data["id"]
    assert rel_data["status"] == "pending_approval"

    # Single-use check: redeem again should fail (inactive/already redeemed code returns 404)
    re_redeem = client.post(
        "/api/family/redeem",
        json={"invitation_code": invite_code},
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert re_redeem.status_code in (400, 404)

    # 5. Patient views pending relationships and approves with custom permissions
    patient_rels = client.get("/api/family/relationships", headers={"Authorization": f"Bearer {p_token}"})
    assert patient_rels.status_code == 200
    pending_list = [r for r in patient_rels.json() if r["id"] == rel_id]
    assert len(pending_list) == 1
    assert pending_list[0]["status"] == "pending_approval"

    approve_res = client.post(
        f"/api/family/requests/{rel_id}/approve",
        json={
            "permissions": {
                "view_live_readings": True,
                "view_historical_readings": True,
                "view_medical_reports": False, # Explicitly deny reports
                "view_health_trends": True,
                "create_manage_alert_rules": True,
                "acknowledge_alerts": True,
                "view_device_status": True
            }
        },
        headers={"Authorization": f"Bearer {p_token}"}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "active"
    assert approve_res.json()["permissions"]["view_medical_reports"] is False

    # 6. Verify permission check for Nurse Clara
    patient_id = p_login.json()["user"]["patient_profile"]["id"]
    overview_res = client.get(
        f"/api/patients/{patient_id}/overview",
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert overview_res.status_code == 200
    assert "Eleanor" in overview_res.json()["patient"]["full_name"]

    # Accessing medical reports should fail with 403 Forbidden
    reports_res = client.get(
        f"/api/patients/{patient_id}/reports",
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert reports_res.status_code == 403
    assert "view_medical_reports" in reports_res.json()["detail"]

    # 7. Patient grants medical report permission
    perm_update = client.put(
        f"/api/family/relationships/{rel_id}/permissions",
        json={
            "view_live_readings": True,
            "view_historical_readings": True,
            "view_medical_reports": True, # Now granted!
            "view_health_trends": True,
            "create_manage_alert_rules": True,
            "acknowledge_alerts": True,
            "view_device_status": True
        },
        headers={"Authorization": f"Bearer {p_token}"}
    )
    assert perm_update.status_code == 200

    # Caregiver can now view reports
    reports_res_2 = client.get(
        f"/api/patients/{patient_id}/reports",
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert reports_res_2.status_code == 200
    assert len(reports_res_2.json()) >= 1

    # 8. Revoke relationship
    revoke_res = client.delete(
        f"/api/family/relationships/{rel_id}",
        headers={"Authorization": f"Bearer {p_token}"}
    )
    assert revoke_res.status_code == 200

    # Immediate access check: overview should now fail
    overview_after_revoke = client.get(
        f"/api/patients/{patient_id}/overview",
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert overview_after_revoke.status_code == 403

def test_personalized_alert_rules_and_notifications(client):
    # 1. Marcus Vance logs in
    c_login = client.post("/api/auth/login", json={
        "email": "caregiver@pulsebridge.demo",
        "password": "PulsePass123!"
    })
    assert c_login.status_code == 200
    c_token = c_login.json()["access_token"]

    # Pre-connected patient is Eleanor
    patients_res = client.get("/api/patients", headers={"Authorization": f"Bearer {c_token}"})
    assert patients_res.status_code == 200
    patients = patients_res.json()
    assert len(patients) >= 1
    eleanor_id = patients[0]["patient_id"]

    # 2. Create custom personalized rule: SpO2 < 92%
    rule_res = client.post(
        f"/api/patients/{eleanor_id}/alert-rules",
        json={
            "parameter": "spo2_percent",
            "condition": "less_than",
            "threshold": 92.0,
            "severity": "CRITICAL",
            "cooldown_seconds": 300,
            "enabled": True
        },
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert rule_res.status_code == 201
    rule_data = rule_res.json()
    assert rule_data["parameter"] == "spo2_percent"

    # 3. Inject a controlled reading for Eleanor triggering the rule
    reading_res = client.post(
        f"/api/patients/{eleanor_id}/controlled-reading",
        json={
            "heart_rate_bpm": 85.0,
            "spo2_percent": 89.0, # Triggers SpO2 < 92%
            "bp_systolic_mmhg": 122.0,
            "bp_diastolic_mmhg": 80.0,
            "glucose_mg_dl": 105.0,
            "temperature_c": 36.6,
            "activity_percent": 15,
            "signal_quality": 0.98,
            "battery_percent": 88
        },
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert reading_res.status_code == 201
    ingest_body = reading_res.json()
    assert ingest_body["alerts_generated"] >= 1

    # 4. Check Notifications for Caregiver Marcus
    notif_res = client.get("/api/notifications", headers={"Authorization": f"Bearer {c_token}"})
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert len(notifs) >= 1
    latest = notifs[0]
    assert "spo2" in latest["title"].lower() or "eleanor" in latest["message"].lower()

    # Unread count
    unread_res = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {c_token}"})
    assert unread_res.status_code == 200
    assert unread_res.json()["unread_count"] >= 1

    # Mark as read
    read_res = client.put(f"/api/notifications/{latest['id']}/read", headers={"Authorization": f"Bearer {c_token}"})
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # Mark all as read
    read_all = client.put("/api/notifications/read-all", headers={"Authorization": f"Bearer {c_token}"})
    assert read_all.status_code == 200
