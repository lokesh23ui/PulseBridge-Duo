import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.connection import get_db
from backend.app.models.entities import (
    User, PatientProfile, PatientCaregiverRelationship, 
    SensorReading, Device, HealthAlert, MedicalReport, utc_now
)
from backend.app.schemas.reports import MedicalReportCreate, MedicalReportResponse
from backend.app.schemas.telemetry import SensorReadingResponse, DeviceResponse, HealthAlertResponse
from backend.app.core.auth import get_current_user, require_patient
from backend.app.services.family_service import verify_caregiver_access
from backend.app.services.telemetry_service import ingest_reading
from backend.app.api.websocket import manager

router = APIRouter(prefix="/patients", tags=["Patient Monitoring"])

def resolve_patient_user_id(db: Session, patient_id: int) -> int:
    """Resolves whether patient_id is User.id or PatientProfile.id."""
    user = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if user:
        return user.id
    prof = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if prof:
        return prof.user_id
    return patient_id

def verify_access_to_patient(current_user: User, patient_id: int, db: Session, required_permission: Optional[str] = None) -> int:
    """
    If current_user is the patient themselves, access is always granted.
    If current_user is a caregiver, verifies an active relationship and the required permission.
    Returns the resolved patient User.id.
    """
    real_patient_id = resolve_patient_user_id(db, patient_id)
    if current_user.id == real_patient_id and current_user.role == "patient":
        return real_patient_id
    if current_user.role == "caregiver":
        verify_caregiver_access(db, caregiver_id=current_user.id, patient_id=real_patient_id, required_permission=required_permission)
        return real_patient_id
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: Not authorized for this patient")

# 1. Caregiver lists all connected approved patients
@router.get("", response_model=List[dict])
def list_connected_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        # If patient, returns self
        profile = current_user.patient_profile
        return [{
            "patient_id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "age": profile.age if profile else None,
            "emergency_contact": profile.emergency_contact_name if profile else None,
            "relationship_label": "Self",
            "status": "active"
        }]

    # Caregiver: query active relationships
    rels = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.caregiver_id == current_user.id,
        PatientCaregiverRelationship.status == "active"
    ).all()

    patients = []
    for r in rels:
        p = db.query(User).filter(User.id == r.patient_id).first()
        if p:
            prof = p.patient_profile
            # Check latest reading
            latest = db.query(SensorReading).filter(
                (SensorReading.patient_id == p.id) | (SensorReading.patient_id.is_(None))
            ).order_by(desc(SensorReading.timestamp)).first()
            
            # Check active alerts count
            alert_count = db.query(HealthAlert).filter(
                HealthAlert.patient_id == p.id,
                HealthAlert.acknowledged == False
            ).count()

            patients.append({
                "patient_id": p.id,
                "relationship_id": r.id,
                "full_name": p.full_name,
                "email": p.email,
                "age": prof.age if prof else None,
                "relationship_label": r.relationship_label,
                "permissions": {
                    "view_live_readings": r.permissions.view_live_readings if r.permissions else False,
                    "view_historical_readings": r.permissions.view_historical_readings if r.permissions else False,
                    "view_medical_reports": r.permissions.view_medical_reports if r.permissions else False,
                    "view_health_trends": r.permissions.view_health_trends if r.permissions else False,
                    "create_manage_alert_rules": r.permissions.create_manage_alert_rules if r.permissions else False,
                    "acknowledge_alerts": r.permissions.acknowledge_alerts if r.permissions else False,
                    "view_device_status": r.permissions.view_device_status if r.permissions else False,
                },
                "latest_heart_rate": latest.heart_rate_bpm if latest else None,
                "latest_spo2": latest.spo2_percent if latest else None,
                "active_alert_count": alert_count,
                "status": r.status
            })
    return patients

# 2. Patient Overview
@router.get("/{patient_id}/overview")
def get_patient_overview(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")

    patient = db.query(User).filter(User.id == pid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    prof = patient.patient_profile

    # Fetch latest reading
    latest = db.query(SensorReading).filter(
        (SensorReading.patient_id == pid) | (SensorReading.patient_id.is_(None))
    ).order_by(desc(SensorReading.timestamp)).first()

    # Fetch active alerts
    alerts = db.query(HealthAlert).filter(
        (HealthAlert.patient_id == pid) | (HealthAlert.patient_id.is_(None)),
        HealthAlert.acknowledged == False
    ).order_by(desc(HealthAlert.timestamp)).limit(5).all()

    # Devices
    devices = db.query(Device).all()

    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "email": patient.email,
            "age": prof.age if prof else None,
            "blood_type": prof.blood_type if prof else None,
            "emergency_contact_name": prof.emergency_contact_name if prof else None,
            "emergency_contact_phone": prof.emergency_contact_phone if prof else None,
            "medical_conditions": prof.medical_conditions if prof else None,
        },
        "latest_reading": latest,
        "active_alerts": alerts,
        "devices": devices
    }

# 3. Patient Live Readings
@router.get("/{patient_id}/readings", response_model=Optional[SensorReadingResponse])
def get_patient_readings(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")
    latest = db.query(SensorReading).filter(
        (SensorReading.patient_id == pid) | (SensorReading.patient_id.is_(None))
    ).order_by(desc(SensorReading.timestamp)).first()
    return latest

# 4. Patient Devices
@router.get("/{patient_id}/devices", response_model=List[DeviceResponse])
def get_patient_devices(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_device_status")
    devices = db.query(Device).all()
    return devices

# 5. Patient History
@router.get("/{patient_id}/history")
def get_patient_history(
    patient_id: int,
    hours: int = Query(6, ge=1, le=720),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_historical_readings")
    cutoff = utc_now() - datetime.timedelta(hours=hours)

    readings = db.query(SensorReading).filter(
        (SensorReading.patient_id == pid) | (SensorReading.patient_id.is_(None)),
        SensorReading.timestamp >= cutoff
    ).order_by(SensorReading.timestamp.asc()).all()

    return {
        "patient_id": pid,
        "count": len(readings),
        "time_window_hours": hours,
        "readings": readings
    }

# 5b. Patient Health Trends (Requires view_health_trends permission)
@router.get("/{patient_id}/trends")
def get_patient_trends(
    patient_id: int,
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_health_trends")
    cutoff = utc_now() - datetime.timedelta(days=days)

    readings = db.query(SensorReading).filter(
        (SensorReading.patient_id == pid) | (SensorReading.patient_id.is_(None)),
        SensorReading.timestamp >= cutoff
    ).all()

    hr_vals = [r.heart_rate_bpm for r in readings if r.heart_rate_bpm is not None]
    spo2_vals = [r.spo2_percent for r in readings if r.spo2_percent is not None]

    return {
        "patient_id": pid,
        "time_window_days": days,
        "sample_count": len(readings),
        "heart_rate_trend": {
            "min": min(hr_vals) if hr_vals else None,
            "max": max(hr_vals) if hr_vals else None,
            "avg": round(sum(hr_vals) / len(hr_vals), 1) if hr_vals else None,
        },
        "spo2_trend": {
            "min": min(spo2_vals) if spo2_vals else None,
            "max": max(spo2_vals) if spo2_vals else None,
            "avg": round(sum(spo2_vals) / len(spo2_vals), 1) if spo2_vals else None,
        }
    }

# 6. Patient Medical Reports (GET - requires view_medical_reports permission)
@router.get("/{patient_id}/reports", response_model=List[MedicalReportResponse])
def get_patient_reports(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_medical_reports")
    reports = db.query(MedicalReport).filter(
        MedicalReport.patient_id == pid
    ).order_by(desc(MedicalReport.report_date)).all()
    return reports

# 6b. Single Medical Report (GET - requires view_medical_reports permission)
@router.get("/{patient_id}/reports/{report_id}", response_model=MedicalReportResponse)
def get_single_patient_report(
    patient_id: int,
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_medical_reports")
    report = db.query(MedicalReport).filter(
        MedicalReport.id == report_id,
        MedicalReport.patient_id == pid
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Medical report not found")
    return report

# 7. Patient Medical Reports (POST - patient only)
@router.post("/{patient_id}/reports", response_model=MedicalReportResponse, status_code=status.HTTP_201_CREATED)
def create_patient_report(
    patient_id: int,
    req: MedicalReportCreate,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    pid = resolve_patient_user_id(db, patient_id)
    if current_user.id != pid:
        raise HTTPException(status_code=403, detail="You can only upload reports to your own account")

    rep = MedicalReport(
        patient_id=pid,
        report_title=req.report_title,
        category=req.category,
        report_date=req.report_date or utc_now(),
        healthcare_provider=req.healthcare_provider,
        patient_notes=req.patient_notes,
        extracted_summary=req.extracted_summary
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)
    return rep

# 8. Controlled Test Reading Injection (for judging / interactive demonstrations)
@router.post("/{patient_id}/controlled-reading", status_code=status.HTTP_201_CREATED)
async def inject_controlled_patient_reading(
    patient_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = verify_access_to_patient(current_user, patient_id, db, required_permission="view_live_readings")

    payload["patient_id"] = pid
    reading, alerts, notifications = ingest_reading(db, payload)

    # Broadcast WebSocket update
    await manager.broadcast({
        "type": "PATIENT_READING_UPDATED",
        "patient_id": pid,
        "reading": {
            "reading_id": reading.reading_id,
            "heart_rate_bpm": reading.heart_rate_bpm,
            "spo2_percent": reading.spo2_percent,
            "bp_systolic_mmhg": reading.bp_systolic_mmhg,
            "bp_diastolic_mmhg": reading.bp_diastolic_mmhg,
            "temperature_c": reading.temperature_c,
            "timestamp": reading.timestamp.isoformat() + "Z"
        },
        "alerts_count": len(alerts),
        "notifications_count": len(notifications)
    })

    return {
        "success": True,
        "reading_id": reading.reading_id,
        "alerts_generated": len(alerts),
        "notifications_delivered": len(notifications)
    }
