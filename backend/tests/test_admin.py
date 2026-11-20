import os
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import User, MedicalReport, AuditLog, SystemAnnouncement

client = TestClient(app)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@pulsebridge.health").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_INITIAL_PASSWORD", "AdminPulse2026!")

def get_admin_token():
    res = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]

def get_patient_token():
    res = client.post("/api/auth/login", json={"email": "patient@pulsebridge.demo", "password": "PulsePass123!"})
    assert res.status_code == 200, f"Patient login failed: {res.text}"
    return res.json()["access_token"]

def get_caregiver_token():
    res = client.post("/api/auth/login", json={"email": "caregiver@pulsebridge.demo", "password": "PulsePass123!"})
    assert res.status_code == 200, f"Caregiver login failed: {res.text}"
    return res.json()["access_token"]

def test_admin_bootstrap_and_login():
    """Verify administrator account is initialized at bootstrap and logs in successfully."""
    admin_token = get_admin_token()
    assert admin_token is not None

    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["role"] == "admin"
    assert user_data["email"] == ADMIN_EMAIL

def test_admin_rbac_protection():
    """Verify all admin routes strictly enforce role=admin and reject unauthorized roles."""
    # 1. Unauthenticated request -> 401
    anon_res = client.get("/api/admin/stats")
    assert anon_res.status_code == 401

    # 2. Patient role -> 403
    p_token = get_patient_token()
    p_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {p_token}"})
    assert p_res.status_code == 403
    assert "not authorized" in p_res.text.lower() or "forbidden" in p_res.text.lower()

    # 3. Caregiver role -> 403
    c_token = get_caregiver_token()
    c_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {c_token}"})
    assert c_res.status_code == 403

    # 4. Admin role -> 200
    a_token = get_admin_token()
    a_res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {a_token}"})
    assert a_res.status_code == 200

def test_admin_dashboard_stats():
    """Verify admin dashboard stats returns real live counts."""
    a_token = get_admin_token()
    res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {a_token}"})
    assert res.status_code == 200
    data = res.json()

    assert data["total_patients"] >= 1
    assert data["total_caregivers"] >= 1
    assert data["total_admins"] >= 1
    assert "total_reports" in data
    assert "total_readings" in data
    assert "total_analyses" in data
    assert "system_status" in data
    assert isinstance(data["recent_activity"], list)

def test_admin_patient_management_and_suspension():
    """Verify patient listing, profile viewing, status suspension, and login blockage."""
    a_token = get_admin_token()

    # 1. List patients
    list_res = client.get("/api/admin/patients", headers={"Authorization": f"Bearer {a_token}"})
    assert list_res.status_code == 200
    patients = list_res.json()
    assert len(patients) >= 1
    target = next((p for p in patients if p["email"] == "patient@pulsebridge.demo"), patients[0])
    pid = target["id"]

    # 2. View patient details
    det_res = client.get(f"/api/admin/patients/{pid}", headers={"Authorization": f"Bearer {a_token}"})
    assert det_res.status_code == 200
    det = det_res.json()
    assert det["id"] == pid
    assert "profile" in det
    assert "caregivers" in det
    assert "reports" in det

    # 3. Suspend patient
    susp_res = client.put(
        f"/api/admin/patients/{pid}/status",
        headers={"Authorization": f"Bearer {a_token}"},
        json={"status": "suspended", "reason": "Administrative security audit review"}
    )
    assert susp_res.status_code == 200
    assert susp_res.json()["status"] == "suspended"

    # 4. Verify suspended patient cannot log in
    bad_login = client.post("/api/auth/login", json={"email": "patient@pulsebridge.demo", "password": "PulsePass123!"})
    assert bad_login.status_code == 403
    assert "suspended" in bad_login.text.lower()

    # 5. Restore patient to active
    act_res = client.put(
        f"/api/admin/patients/{pid}/status",
        headers={"Authorization": f"Bearer {a_token}"},
        json={"status": "active", "reason": "Audit review concluded successfully"}
    )
    assert act_res.status_code == 200
    assert act_res.json()["status"] == "active"

    # 6. Verify patient can log in again
    good_login = client.post("/api/auth/login", json={"email": "patient@pulsebridge.demo", "password": "PulsePass123!"})
    assert good_login.status_code == 200

def test_admin_afib_knowledge_and_symptoms_management():
    """Verify AFib clinical knowledge and symptoms editing with #1 symptom guardrail."""
    a_token = get_admin_token()

    # 1. Fetch symptoms catalog
    sym_res = client.get("/api/admin/symptoms", headers={"Authorization": f"Bearer {a_token}"})
    assert sym_res.status_code == 200
    symptoms = sym_res.json()
    assert len(symptoms) >= 1
    # Check #1 symptom is irregular heartbeat
    assert symptoms[0]["symptom_key"] == "irregular_heartbeat_rhythm"
    assert symptoms[0]["is_primary"] is True

    # 2. Attempt to deactivate #1 symptom (MUST be rejected)
    bad_update = client.put(
        "/api/admin/symptoms/irregular_heartbeat_rhythm",
        headers={"Authorization": f"Bearer {a_token}"},
        json={
            "name": "Irregular heartbeat rhythm",
            "description": "An uneven pulse",
            "typical_severity": "Moderate",
            "is_active": False,
            "sort_order": 1
        }
    )
    assert bad_update.status_code == 400
    assert "cannot be deactivated" in bad_update.text

    # 3. Valid update to symptom notes
    good_update = client.put(
        "/api/admin/symptoms/irregular_heartbeat_rhythm",
        headers={"Authorization": f"Bearer {a_token}"},
        json={
            "name": "Irregular heartbeat rhythm",
            "description": "An uneven, chaotic or irregular pulse or heartbeat sensation.",
            "typical_severity": "Moderate",
            "clinical_significance": "Primary hallmark of AFib according to ACC/AHA guidelines.",
            "is_active": True,
            "sort_order": 1
        }
    )
    assert good_update.status_code == 200

def test_admin_parameters_management():
    """Verify exactly 4 parameters are managed with AFib relevance."""
    a_token = get_admin_token()
    res = client.get("/api/admin/parameters", headers={"Authorization": f"Bearer {a_token}"})
    assert res.status_code == 200
    params = res.json()
    assert len(params) == 4
    param_keys = [p["parameter_key"] for p in params]
    assert "heart_rhythm_ecg" in param_keys
    assert "heart_rate" in param_keys
    assert "hrv" in param_keys
    assert "spo2" in param_keys

def test_admin_medical_reports_and_audit_logs():
    """Verify medical reports review across patients and persistent audit logging."""
    a_token = get_admin_token()

    # 1. List medical reports
    rep_res = client.get("/api/admin/reports", headers={"Authorization": f"Bearer {a_token}"})
    assert rep_res.status_code == 200
    reports = rep_res.json()
    assert len(reports) >= 1
    rep_id = reports[0]["id"]

    # 2. View details
    det_res = client.get(f"/api/admin/reports/{rep_id}", headers={"Authorization": f"Bearer {a_token}"})
    assert det_res.status_code == 200

    # 3. Check audit logs
    log_res = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {a_token}"})
    assert log_res.status_code == 200
    logs = log_res.json()
    assert len(logs) >= 1
    assert any(l["action"] in ["VIEW_MEDICAL_REPORT_DETAILS", "UPDATE_PATIENT_STATUS", "UPDATE_SYMPTOM"] for l in logs)

def test_admin_announcements_lifecycle():
    """Verify creation, toggling and public visibility of system announcements."""
    a_token = get_admin_token()
    p_token = get_patient_token()

    # 1. Create announcement
    create_res = client.post(
        "/api/admin/announcements",
        headers={"Authorization": f"Bearer {a_token}"},
        json={
            "title": "Scheduled Cardiac Registry Maintenance",
            "message": "PulseBridge Duo will undergo firmware gateway updates at 02:00 UTC.",
            "announcement_type": "maintenance",
            "target_audience": "all"
        }
    )
    assert create_res.status_code == 201
    ann_id = create_res.json()["id"]

    # 2. General user views active announcements
    pub_res = client.get("/api/admin/public/active-announcements", headers={"Authorization": f"Bearer {p_token}"})
    assert pub_res.status_code == 200
    pub_anns = pub_res.json()
    assert any(a["id"] == ann_id for a in pub_anns)

    # 3. Admin deactivates announcement
    tog_res = client.put(f"/api/admin/announcements/{ann_id}/status?is_active=false", headers={"Authorization": f"Bearer {a_token}"})
    assert tog_res.status_code == 200

    # 4. General user no longer sees deactivated announcement
    pub_res2 = client.get("/api/admin/public/active-announcements", headers={"Authorization": f"Bearer {p_token}"})
    assert pub_res2.status_code == 200
    assert not any(a["id"] == ann_id for a in pub_res2.json())

def test_admin_app_settings_and_security_status():
    """Verify application settings toggle and security status diagnostics."""
    a_token = get_admin_token()

    # 1. Fetch current settings
    settings_res = client.get("/api/admin/settings", headers={"Authorization": f"Bearer {a_token}"})
    assert settings_res.status_code == 200
    settings = settings_res.json()
    assert "app_name" in settings
    assert "maintenance_mode" in settings

    # 2. Test registration disable toggle
    up_res = client.put(
        "/api/admin/settings",
        headers={"Authorization": f"Bearer {a_token}"},
        json={
            "app_name": "PulseBridge Duo",
            "support_email": "support@pulsebridge.health",
            "maintenance_mode": False,
            "maintenance_message": "Maintenance active",
            "allow_public_registration": False,
            "ai_features_enabled": False
        }
    )
    assert up_res.status_code == 200

    # 3. Verify public registration is blocked
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": "blocked@pulsebridge.demo",
            "password": "Password123!",
            "full_name": "Blocked User",
            "role": "patient"
        }
    )
    assert reg_res.status_code == 403
    assert "disabled" in reg_res.text.lower()

    # 4. Re-enable public registration
    client.put(
        "/api/admin/settings",
        headers={"Authorization": f"Bearer {a_token}"},
        json={
            "app_name": "PulseBridge Duo",
            "support_email": "support@pulsebridge.health",
            "maintenance_mode": False,
            "maintenance_message": "Maintenance active",
            "allow_public_registration": True,
            "ai_features_enabled": False
        }
    )

    # 5. Security Status checklist
    sec_res = client.get("/api/admin/security-status", headers={"Authorization": f"Bearer {a_token}"})
    assert sec_res.status_code == 200
    sec = sec_res.json()
    assert sec["database_connected"] is True
    assert sec["zero_hardcoded_secrets_verified"] is True
    assert sec["admin_users_count"] >= 1
