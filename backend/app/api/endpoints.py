import json
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.connection import get_db
from backend.app.models.entities import Device, SensorReading, HealthAlert, SystemConfig
from backend.app.schemas.telemetry import (
    SensorReadingCreate, SensorReadingResponse,
    HealthAlertResponse, AlertAcknowledgeResponse,
    DeviceResponse, ThresholdConfigSchema, IngestionResult
)
from backend.app.services.telemetry_service import ingest_reading
from backend.app.core.thresholds import DEFAULT_THRESHOLDS
from backend.app.core.auth import get_optional_user
from backend.app.models.entities import User
from backend.app.services.family_service import verify_caregiver_access
from backend.app.api.websocket import manager

router = APIRouter()

def utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)

def ensure_default_devices(db: Session):
    defaults = [
        ("PB-RING-01", "ring", "PulseBridge Smart Ring", 92, 0.96),
        ("PB-WATCH-01", "watch", "PulseBridge Smartwatch", 78, 0.94),
        ("PB-ESP32-01", "esp32_gateway", "ESP32 Wokwi Simulation Gateway", 100, 0.98),
    ]
    for dev_id, dev_type, name, bat, sig in defaults:
        if not db.query(Device).filter(Device.device_id == dev_id).first():
            db.add(Device(
                device_id=dev_id,
                device_type=dev_type,
                name=name,
                status="connected",
                battery_percent=bat,
                signal_quality=sig,
                firmware_version="1.0.0"
            ))
    db.commit()

# 1. System Health
@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    ensure_default_devices(db)
    active_count = db.query(Device).filter(Device.status == "connected").count()
    return {
        "status": "healthy",
        "timestamp": utc_now().isoformat(),
        "version": "1.0.0",
        "database": "connected",
        "active_devices": active_count
    }

# 2. Registered Devices
@router.get("/devices", response_model=List[DeviceResponse])
def get_devices(db: Session = Depends(get_db)):
    ensure_default_devices(db)
    devices = db.query(Device).all()
    return devices

# 3. Latest Telemetry Reading
@router.get("/latest", response_model=Optional[SensorReadingResponse])
def get_latest_reading(
    device_id: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading)
    if device_id:
        query = query.filter(SensorReading.device_id == device_id)
    if source:
        query = query.filter(SensorReading.source == source)
    latest = query.order_by(desc(SensorReading.timestamp)).first()
    return latest

# 4. Historical Telemetry
@router.get("/history")
def get_history(
    hours: int = Query(6, ge=1, le=168),
    device_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    cutoff = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - datetime.timedelta(hours=hours)
    query = db.query(SensorReading).filter(SensorReading.timestamp >= cutoff)
    if device_id:
        query = query.filter(SensorReading.device_id == device_id)
    readings = query.order_by(desc(SensorReading.timestamp)).limit(limit).all()

    chronological = list(reversed(readings))
    earliest = chronological[0].timestamp.isoformat() + "Z" if chronological else None
    latest = chronological[-1].timestamp.isoformat() + "Z" if chronological else None

    data = []
    for r in chronological:
        data.append({
            "reading_id": r.reading_id,
            "timestamp": r.timestamp.isoformat() + "Z",
            "source": r.source,
            "simulated": r.simulated,
            "device_id": r.device_id,
            "device_type": r.device_type,
            "heart_rate_bpm": r.heart_rate_bpm,
            "spo2_percent": r.spo2_percent,
            "bp_systolic_mmhg": r.bp_systolic_mmhg,
            "bp_diastolic_mmhg": r.bp_diastolic_mmhg,
            "glucose_mg_dl": r.glucose_mg_dl,
            "temperature_c": r.temperature_c,
            "temperature_source": r.temperature_source,
            "humidity_percent": r.humidity_percent,
            "activity_percent": r.activity_percent,
            "signal_quality": r.signal_quality,
            "battery_percent": r.battery_percent,
            "connection_state": r.connection_state,
            "demo_status": r.demo_status
        })

    return {
        "count": len(data),
        "time_window_hours": hours,
        "earliest": earliest,
        "latest": latest,
        "readings": data
    }

# 5. Ingestion Endpoint (Supports Wokwi, Ring, Watch, Dual, Demo)
@router.post("/sensor-data", response_model=IngestionResult, status_code=201)
async def ingest_sensor_data(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    try:
        config_record = db.query(SystemConfig).filter(SystemConfig.config_key == "thresholds").first()
        if config_record:
            thresholds = ThresholdConfigSchema(**config_record.config_value)
        else:
            thresholds = DEFAULT_THRESHOLDS

        reading, new_alerts, notifications = ingest_reading(db, payload, thresholds)

        ws_msg = {
            "type": "NEW_READING",
            "data": {
                "reading_id": reading.reading_id,
                "timestamp": reading.timestamp.isoformat() + "Z",
                "source": reading.source,
                "simulated": reading.simulated,
                "device_id": reading.device_id,
                "device_type": reading.device_type,
                "heart_rate_bpm": reading.heart_rate_bpm,
                "spo2_percent": reading.spo2_percent,
                "bp_systolic_mmhg": reading.bp_systolic_mmhg,
                "bp_diastolic_mmhg": reading.bp_diastolic_mmhg,
                "glucose_mg_dl": reading.glucose_mg_dl,
                "temperature_c": reading.temperature_c,
                "temperature_source": reading.temperature_source,
                "humidity_percent": reading.humidity_percent,
                "activity_percent": reading.activity_percent,
                "signal_quality": reading.signal_quality,
                "battery_percent": reading.battery_percent,
                "connection_state": reading.connection_state,
                "demo_status": reading.demo_status
            },
            "alerts": [
                {
                    "alert_id": a.alert_id,
                    "parameter": a.parameter,
                    "value": a.value,
                    "unit": a.unit,
                    "rule_triggered": a.rule_triggered,
                    "severity": a.severity,
                    "timestamp": a.timestamp.isoformat() + "Z",
                    "verification_instruction": a.verification_instruction
                } for a in new_alerts
            ]
        }
        await manager.broadcast(ws_msg)

        for notif in notifications:
            await manager.broadcast({
                "type": "NEW_NOTIFICATION",
                "data": {
                    "id": notif.id,
                    "user_id": notif.user_id,
                    "title": notif.title,
                    "message": notif.message,
                    "severity": notif.severity,
                    "category": notif.category,
                    "patient_id": notif.patient_id,
                    "created_at": notif.created_at.isoformat() + "Z" if notif.created_at else None
                }
            })

        return IngestionResult(
            success=True,
            reading_id=reading.reading_id,
            timestamp=reading.timestamp,
            normalized_source=reading.source,
            alerts_generated=len(new_alerts),
            message="Reading successfully processed and broadcast"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ingestion failed: {str(e)}")

# 6. Health Alerts
@router.get("/alerts", response_model=List[HealthAlertResponse])
def get_alerts(
    severity: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(HealthAlert)
    if severity:
        query = query.filter(HealthAlert.severity == severity.upper())
    if acknowledged is not None:
        query = query.filter(HealthAlert.acknowledged == acknowledged)
    alerts = query.order_by(desc(HealthAlert.timestamp)).limit(limit).all()
    return alerts

# 7. Alert Acknowledgement
@router.post("/alerts/{alert_id}/acknowledge", response_model=AlertAcknowledgeResponse)
async def acknowledge_alert(
    alert_id: str, 
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    alert = db.query(HealthAlert).filter(HealthAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # If the alert is associated with a specific patient and caller is authenticated
    if alert.patient_id and current_user:
        if current_user.role == "caregiver":
            verify_caregiver_access(
                db, 
                caregiver_id=current_user.id, 
                patient_id=alert.patient_id, 
                required_permission="acknowledge_alerts"
            )
        elif current_user.id != alert.patient_id:
            raise HTTPException(status_code=403, detail="Not authorized to acknowledge alert for this patient")

    alert.acknowledged = True
    alert.acknowledged_at = utc_now()
    db.commit()

    await manager.broadcast({
        "type": "ALERT_ACKNOWLEDGED",
        "alert_id": alert_id,
        "acknowledged_at": alert.acknowledged_at.isoformat() + "Z"
    })

    return AlertAcknowledgeResponse(
        alert_id=alert_id,
        status="acknowledged",
        acknowledged_at=alert.acknowledged_at
    )

# 8. Clear demonstration alerts
@router.post("/alerts/clear")
def clear_alerts(confirm: bool = Query(False), db: Session = Depends(get_db)):
    if not confirm:
        raise HTTPException(status_code=400, detail="Must set confirm=true to clear alerts")
    db.query(HealthAlert).delete()
    db.commit()
    return {"message": "All demonstration alerts cleared"}

# 9. Configuration
@router.get("/configuration", response_model=ThresholdConfigSchema)
def get_configuration(db: Session = Depends(get_db)):
    config_record = db.query(SystemConfig).filter(SystemConfig.config_key == "thresholds").first()
    if config_record:
        return ThresholdConfigSchema(**config_record.config_value)
    return DEFAULT_THRESHOLDS

@router.post("/configuration", response_model=ThresholdConfigSchema)
def update_configuration(config: ThresholdConfigSchema, db: Session = Depends(get_db)):
    config_record = db.query(SystemConfig).filter(SystemConfig.config_key == "thresholds").first()
    if not config_record:
        config_record = SystemConfig(config_key="thresholds", config_value=config.model_dump())
        db.add(config_record)
    else:
        config_record.config_value = config.model_dump()
        config_record.updated_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    db.commit()
    return config

# 10. Scenarios
@router.get("/scenarios")
def get_scenarios():
    return [
        {"id": 1, "name": "Resting State Baseline", "hr": 70, "spo2": 98, "bp": "118/78", "glucose": 95, "desc": "Stable resting baseline. Normal parameters."},
        {"id": 2, "name": "Increased Physical Activity", "hr": 125, "spo2": 97, "bp": "135/85", "glucose": 110, "desc": "Cardiovascular response to brisk exercise."},
        {"id": 3, "name": "Low SpO2 (Hypoxia Demo)", "hr": 88, "spo2": 86, "bp": "120/80", "glucose": 100, "desc": "Simulated acute hypoxia excursion. Triggers CRITICAL alert."},
        {"id": 4, "name": "Elevated Resting Heart Rate", "hr": 142, "spo2": 96, "bp": "138/88", "glucose": 105, "desc": "Tachycardia while resting. Triggers WARNING alert."},
        {"id": 5, "name": "Poor Sensor Contact / Noise", "hr": 80, "spo2": 94, "signal_quality": 0.22, "desc": "Optical degradation and motion artifact noise."},
        {"id": 6, "name": "Single Device Disconnected", "device": "ring", "state": "disconnected", "desc": "Ring drops offline; Watch maintains uninterrupted monitoring."},
        {"id": 7, "name": "Low Battery Warning", "battery": 8, "desc": "Simulated battery exhaustion; power conservation triggered."},
        {"id": 8, "name": "Environmental Extreme Shift", "ambient_temp": 38.5, "humidity": 82.0, "desc": "External ambient heat spike via DHT22."},
        {"id": 9, "name": "Sensor Dropout (Null Stream)", "dropped": "spo2", "desc": "Null biometric field; graceful 'No data' rendering."},
        {"id": 10, "name": "Full Dual-Wearable Correlated Stream", "ring_hr": 78, "watch_hr": 81, "desc": "Dual streams side by side with real-time divergence analysis."}
    ]

# 11. Reset Platform State
@router.post("/reset")
def reset_platform_state(db: Session = Depends(get_db)):
    db.query(SensorReading).delete()
    db.query(HealthAlert).delete()
    db.commit()
    return {"message": "Telemetry and alerts cleared successfully"}
