# PulseBridge Duo — Patient–Caregiver Platform Test Report

## 1. Test Suite Summary

- **Test Framework**: Pytest 9.2.0 + FastAPI `TestClient`
- **Execution Date**: 2026-11-19
- **Total Tests Executed**: 10
- **Total Tests Passed**: 10 (100% Pass Rate)
- **Zero Regressions**: All 6 pre-existing hardware and simulation tests continue to pass alongside 4 new comprehensive patient-caregiver platform integration tests.

---

## 2. Test Execution Results

```text
============================= test session starts =============================
platform win32 -- Python 3.13.17, pytest-9.2.0, pluggy-1.7.0
plugins: anyio-4.16.0, asyncio-1.5.0
collected 10 items

backend/tests/test_api.py::test_health_check PASSED                      [ 10%]
backend/tests/test_api.py::test_device_registry PASSED                   [ 20%]
backend/tests/test_api.py::test_wokwi_canonical_payload_ingestion PASSED [ 30%]
backend/tests/test_api.py::test_alert_generation_and_acknowledgement PASSED [ 40%]
backend/tests/test_api.py::test_historical_telemetry_query PASSED        [ 50%]
backend/tests/test_api.py::test_threshold_configuration_update PASSED    [ 60%]
backend/tests/test_patient_caregiver.py::test_preseeded_demo_logins PASSED [ 70%]
backend/tests/test_patient_caregiver.py::test_user_registration_and_auth_flow PASSED [ 80%]
backend/tests/test_patient_caregiver.py::test_family_invitation_redemption_and_approval PASSED [ 90%]
backend/tests/test_patient_caregiver.py::test_personalized_alert_rules_and_notifications PASSED [100%]

======================== 10 passed in 2.22s ========================
```

---

## 3. Detailed Test Case Specifications

### A. Pre-Seeded Demo Account Authentication (`test_preseeded_demo_logins`)
- **Objective**: Ensure hackathon judges can immediately log in with default demo accounts without registering.
- **Assertions**:
  - `patient@pulsebridge.demo` logs in with `PulsePass123!`, returns valid JWT, verifies role is `"patient"`, verifies patient name is `"Eleanor Vance"`.
  - `caregiver@pulsebridge.demo` logs in with `PulsePass123!`, returns valid JWT, verifies role is `"caregiver"`, verifies caregiver name is `"Marcus Vance"`.

### B. Dynamic User Registration & Isolation (`test_user_registration_and_auth_flow`)
- **Objective**: Verify patient and caregiver registration, password hashing, and duplicate email prevention.
- **Assertions**:
  - Registers unique patient account with age, emergency contacts, medical notes.
  - Registers unique caregiver account with relationship label.
  - `/api/auth/me` validates JWT Bearer authentication.
  - Duplicate registration attempt with same email is safely rejected with HTTP 400.

### C. Cryptographic Invitation & Granular Permission Isolation (`test_family_invitation_redemption_and_approval`)
- **Objective**: Verify end-to-end invitation generation, single-use enforcement, pending state, permission gating, permission updates, and revocation.
- **Assertions**:
  - Patient generates code starting with `PBD-`.
  - New caregiver redeems code; relationship transitions to `pending_approval`.
  - Re-redeeming same code fails (single-use validation).
  - Patient approves request with `view_medical_reports = False`.
  - Caregiver requests `/api/patients/{id}/overview` -> succeeds (200 OK).
  - Caregiver requests `/api/patients/{id}/reports` -> **strictly blocked (403 Forbidden)**.
  - Patient updates permissions granting `view_medical_reports = True`.
  - Caregiver requests reports again -> **now authorized (200 OK)** and receives report records.
  - Patient revokes caregiver relationship (`DELETE /api/family/relationships/{id}`).
  - Caregiver subsequent requests -> **immediately blocked (403 Forbidden)**.

### D. Personalized Alert Rules & Notification Lifecycle (`test_personalized_alert_rules_and_notifications`)
- **Objective**: Validate custom threshold creation, acute telemetry evaluation, in-app notification dispatch, and read receipts.
- **Assertions**:
  - Caregiver creates personalized rule: `spo2_percent < 92.0%` with `CRITICAL` severity and 300s cooldown.
  - Ingests controlled reading with SpO2 = 89.0%.
  - Verifies `HealthAlert` generated and persistent in-app `Notification` record created for caregiver.
  - Verifies `/api/notifications/unread-count` returns `unread_count >= 1`.
  - Marks notification as read via `PUT /api/notifications/{id}/read`.
  - Verifies mark-all-read via `POST /api/notifications/read-all`.
