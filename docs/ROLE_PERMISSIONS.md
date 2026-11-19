# PulseBridge Duo — Role-Based Access Control & Permission Matrix

## 1. User Roles

PulseBridge Duo enforces strict role isolation across all routes, endpoints, and database models. The two primary user roles are:

| Role Identifier | Description | Data Ownership | Default Capabilities |
| :--- | :--- | :--- | :--- |
| **`patient`** | The individual whose health parameters are measured. | **Owner**: Full sovereignty over all readings, reports, and connections. | Connect devices, upload medical reports, invite caregivers, configure and approve permissions, revoke access. |
| **`caregiver`** | Family member, child, relative, or authorized clinician. | **Viewer / Monitor**: Read-only or action privileges strictly governed by patient consent. | View authorized telemetry of connected patients, configure personalized alert rules (if permitted), receive in-app notifications. |

---

## 2. The 7 Granular Access Permissions

A caregiver's access to a patient is governed by 7 independent boolean flags stored in the `AccessPermission` model. The patient can enable or disable any flag at approval time or dynamically through the Family Care settings.

| Permission Flag | Affected Endpoints | Default on Approval | Description & Security Boundary |
| :--- | :--- | :---: | :--- |
| **`view_live_readings`** | `GET /api/patients/{id}/overview`<br>`GET /api/patients/{id}/readings` | `true` | Allows viewing real-time vital signs (HR, SpO2, BP, Glucose, Temp, Activity, Signal Quality). |
| **`view_historical_readings`** | `GET /api/patients/{id}/history` | `true` | Grants access to historical time-series data and telemetry window queries (up to 30 days). |
| **`view_health_trends`** | `GET /api/patients/{id}/history` (aggregates) | `true` | Allows viewing circadian trends, min/max distributions, and sleep/activity analysis. |
| **`view_device_status`** | `GET /api/patients/{id}/devices` | `true` | Grants visibility into wearable battery levels, connection state, and firmware status. |
| **`view_medical_reports`** | `GET /api/patients/{id}/reports` | **`false`** | **Strict HIPAA/Privacy Protection**: Restricts sensitive diagnostic summaries and doctor notes. Requires explicit patient consent. |
| **`create_manage_alert_rules`** | `POST /api/patients/{id}/alert-rules`<br>`PUT /api/alerts/rules/{rule_id}`<br>`DELETE /api/alerts/rules/{rule_id}` | `false` | Authorizes the caregiver to configure customized alert rules for the patient (e.g. SpO2 < 92%). |
| **`acknowledge_alerts`** | `POST /api/alerts/{id}/acknowledge` | `true` | Allows caregiver to acknowledge and sign off on active alerts. |

---

## 3. Backend Enforcement Architecture

Permission checks are **not merely UI toggles**; they are enforced server-side on every request in `backend/app/services/family_service.py`:

```python
def verify_caregiver_access(
    db: Session, 
    caregiver_id: int, 
    patient_id: int, 
    required_permission: Optional[str] = None
) -> PatientCaregiverRelationship:
    # 1. Query relationship
    rel = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.caregiver_id == caregiver_id,
        PatientCaregiverRelationship.patient_id == patient_id,
        PatientCaregiverRelationship.status == "active"
    ).first()

    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access forbidden: Active relationship not found"
        )

    # 2. Check granular permission
    if required_permission:
        perms = rel.permissions
        if not perms or not getattr(perms, required_permission, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Access forbidden: Missing '{required_permission}' permission from patient"
            )

    return rel
```

### Response on Unauthorized Request
When an unpermitted caregiver requests restricted medical reports:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "detail": "Access forbidden: Missing 'view_medical_reports' permission from patient"
}
```

The frontend responds gracefully by displaying an informative, privacy-compliant locked card rather than crashing.
