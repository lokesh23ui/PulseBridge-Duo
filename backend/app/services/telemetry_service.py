import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.entities import SensorReading, HealthAlert, Device, Notification, utc_now
from backend.app.services.alert_engine import evaluate_reading_alerts, evaluate_personalized_rules
from backend.app.schemas.telemetry import ThresholdConfigSchema
from backend.app.core.thresholds import DEFAULT_THRESHOLDS

def normalize_payload_to_reading(payload: Dict[str, Any]) -> SensorReading:
    """
    Normalizes diverse ingestion formats (Wokwi, Ring simulator, Watch simulator,
    Dual simulator, Demo generator) into the internal canonical SensorReading model.
    """
    raw_str = json.dumps(payload)
    source = payload.get("source", "DEMO_GENERATOR")
    device_id = payload.get("device_id", "PB-GENERIC-01")
    simulated = payload.get("simulated", True)

    # Device type detection
    if "ESP32" in device_id or source == "WOKWI_SIMULATION":
        device_type = "esp32_gateway"
        temp_source = "ambient"
    elif "RING" in device_id or source == "RING_SIMULATOR":
        device_type = "ring"
        temp_source = "skin"
    elif "WATCH" in device_id or source == "WATCH_SIMULATOR":
        device_type = "watch"
        temp_source = "skin"
    else:
        device_type = payload.get("device_type", "both")
        temp_source = payload.get("temperature_source", "skin")

    # Extract metrics safely (supporting alternative key namings if present)
    hr = payload.get("heart_rate_bpm") or payload.get("heart_rate")
    spo2 = payload.get("spo2_percent") or payload.get("spo2")
    bp_sys = payload.get("bp_systolic_mmhg") or payload.get("systolic_bp")
    bp_dia = payload.get("bp_diastolic_mmhg") or payload.get("diastolic_bp")
    glucose = payload.get("glucose_mg_dl") or payload.get("glucose")
    temp = payload.get("temperature_c") or payload.get("temperature") or payload.get("ambient_temp")
    humidity = payload.get("humidity_percent") or payload.get("humidity")
    activity = payload.get("activity_percent") or payload.get("activity")
    sig_q = payload.get("signal_quality", 0.95 if source == "WOKWI_SIMULATION" else 1.0)
    battery = payload.get("battery_percent")
    conn_state = payload.get("connection_state", "connected")
    demo_status = payload.get("demo_status", "NORMAL")
    patient_id = payload.get("patient_id")

    reading = SensorReading(
        reading_id=payload.get("reading_id") or str(uuid.uuid4()),
        timestamp=utc_now(),
        source=source,
        simulated=simulated,
        device_id=device_id,
        device_type=device_type,
        configuration=payload.get("configuration", "both"),
        patient_id=int(patient_id) if patient_id is not None else None,
        heart_rate_bpm=float(hr) if hr is not None else None,
        spo2_percent=float(spo2) if spo2 is not None else None,
        bp_systolic_mmhg=float(bp_sys) if bp_sys is not None else None,
        bp_diastolic_mmhg=float(bp_dia) if bp_dia is not None else None,
        glucose_mg_dl=float(glucose) if glucose is not None else None,
        temperature_c=float(temp) if temp is not None else None,
        temperature_source=temp_source,
        humidity_percent=float(humidity) if humidity is not None else None,
        activity_percent=float(activity) if activity is not None else None,
        signal_quality=float(sig_q) if sig_q is not None else 1.0,
        battery_percent=int(battery) if battery is not None else None,
        connection_state=conn_state,
        demo_status=demo_status,
        raw_payload=raw_str
    )
    return reading

def ingest_reading(
    db: Session,
    payload: Dict[str, Any],
    thresholds: ThresholdConfigSchema = DEFAULT_THRESHOLDS
) -> tuple[SensorReading, List[HealthAlert], List[Notification]]:
    """
    Ingests, stores, evaluates alerts, evaluates personalized caregiver rules,
    and updates device registry.
    """
    reading = normalize_payload_to_reading(payload)
    db.add(reading)

    # 1. Global prototype alert rules
    new_alerts = evaluate_reading_alerts(reading, thresholds)
    for alert in new_alerts:
        db.add(alert)

    # 2. Personalized patient alert rules & in-app notifications
    custom_alerts, notifications = evaluate_personalized_rules(db, reading)
    new_alerts.extend(custom_alerts)

    # 3. Update or register device
    dev = db.query(Device).filter(Device.device_id == reading.device_id).first()
    if dev:
        dev.last_seen = reading.timestamp
        dev.status = reading.connection_state
        if reading.battery_percent is not None:
            dev.battery_percent = reading.battery_percent
        if reading.signal_quality is not None:
            dev.signal_quality = reading.signal_quality
    else:
        new_dev = Device(
            device_id=reading.device_id,
            device_type=reading.device_type,
            name=f"PulseBridge {reading.device_type.replace('_', ' ').title()}",
            status=reading.connection_state,
            battery_percent=reading.battery_percent if reading.battery_percent is not None else 100,
            signal_quality=reading.signal_quality if reading.signal_quality is not None else 1.0,
            last_seen=reading.timestamp
        )
        db.add(new_dev)

    db.commit()
    db.refresh(reading)
    return reading, new_alerts, notifications
