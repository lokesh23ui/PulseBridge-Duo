import os
import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.models.entities import (
    Device, SystemConfig, User, PatientProfile, CaregiverProfile, 
    PatientCaregiverRelationship, AccessPermission, MedicalReport, AlertRule,
    PatientSymptom, DiseaseAnalysisRecord, utc_now
)
from backend.app.core.auth import hash_password
from backend.app.core.thresholds import DEFAULT_THRESHOLDS
from backend.app.api.websocket import manager

# Existing and new routers
from backend.app.api.endpoints import router as api_router
from backend.app.api.auth_router import router as auth_router
from backend.app.api.family_router import router as family_router
from backend.app.api.patients_router import router as patients_router
from backend.app.api.alerts_router import router as alerts_router
from backend.app.api.notifications_router import router as notifications_router
from backend.app.api.disease_router import router as disease_router

def seed_demo_accounts_and_data(db):
    """Seeds Demo Patient and Demo Caregiver for immediate interactive hackathon judging."""
    # 1. Seed Demo Patient
    demo_patient = db.query(User).filter(User.email == "patient@pulsebridge.demo").first()
    if not demo_patient:
        demo_patient = User(
            email="patient@pulsebridge.demo",
            password_hash=hash_password("PulsePass123!"),
            full_name="Eleanor Vance (Patient)",
            role="patient"
        )
        db.add(demo_patient)
        db.flush()

        profile = PatientProfile(
            user_id=demo_patient.id,
            age=48,
            emergency_contact_name="Marcus Vance (Son)",
            emergency_contact_phone="+1 (555) 019-2831",
            blood_type="O+",
            medical_conditions="Mild Hypertension, Nocturnal Arrhythmia Surveillance"
        )
        db.add(profile)
        db.commit()
        db.refresh(demo_patient)
    else:
        # Ensure age and profile match prompt specifications
        if demo_patient.patient_profile:
            demo_patient.patient_profile.age = 48
            demo_patient.patient_profile.medical_conditions = "Mild Hypertension, Nocturnal Arrhythmia Surveillance"
            db.commit()

    # 2. Seed Demo Caregiver
    demo_caregiver = db.query(User).filter(User.email == "caregiver@pulsebridge.demo").first()
    if not demo_caregiver:
        demo_caregiver = User(
            email="caregiver@pulsebridge.demo",
            password_hash=hash_password("PulsePass123!"),
            full_name="Marcus Vance (Caregiver)",
            role="caregiver"
        )
        db.add(demo_caregiver)
        db.flush()

        cg_profile = CaregiverProfile(
            user_id=demo_caregiver.id,
            relationship_type="Son",
            phone_number="+1 (555) 019-2831"
        )
        db.add(cg_profile)
        db.commit()
        db.refresh(demo_caregiver)

    # 3. Seed Active Patient-Caregiver Connection
    rel = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.patient_id == demo_patient.id,
        PatientCaregiverRelationship.caregiver_id == demo_caregiver.id
    ).first()

    if not rel:
        rel = PatientCaregiverRelationship(
            patient_id=demo_patient.id,
            caregiver_id=demo_caregiver.id,
            relationship_label="Father / Son",
            status="active",
            approved_at=utc_now()
        )
        db.add(rel)
        db.flush()

        perm = AccessPermission(
            relationship_id=rel.id,
            view_live_readings=True,
            view_historical_readings=True,
            view_medical_reports=True,
            view_health_trends=True,
            create_manage_alert_rules=True,
            acknowledge_alerts=True,
            view_device_status=True
        )
        db.add(perm)
        db.commit()

    # 4. Seed / Update Cardiovascular Holter & ECG Baseline Report for Eleanor Vance
    cardio_report = db.query(MedicalReport).filter(
        MedicalReport.patient_id == demo_patient.id,
        MedicalReport.report_title == "Cardiovascular Holter & ECG Baseline"
    ).first()
    if not cardio_report:
        cardio_report = MedicalReport(
            patient_id=demo_patient.id,
            report_title="Cardiovascular Holter & ECG Baseline",
            category="Cardiology",
            report_date=utc_now() - datetime.timedelta(days=7),
            healthcare_provider="St. Jude Heart & Vascular Center",
            patient_notes="No sustained atrial fibrillation during 24-hour recording period. Sinus rhythm with occasional premature atrial contractions (PACs). Recommend 7-day Holter or wearable patch monitoring if palpitations recur.",
            extracted_summary={
                "raw_text": (
                    "24-Hour Ambulatory Holter ECG Monitoring Report. Indication: Palpitations and nocturnal arrhythmia surveillance. "
                    "Findings: Predominant normal sinus rhythm with mean heart rate 74 bpm (range 58-112 bpm). "
                    "No sustained atrial fibrillation (>30 seconds) observed during recording period. "
                    "Isolated premature atrial complexes (PACs, 142 total, <1% of total beats). Occasional sinus arrhythmia. "
                    "No high-grade AV block or ventricular tachyarrhythmias. "
                    "Impression: No sustained AFib captured on 24-hour baseline. "
                    "Recommend 7-day Holter or wearable patch monitoring if episodic palpitations recur."
                ),
                "findings": [
                    {
                        "test_name": "24-Hour ECG Rhythm Interpretation",
                        "value": "Sinus Rhythm with Occasional PACs",
                        "unit": "",
                        "reference_range": "Normal Sinus Rhythm",
                        "status": "Normal / Non-sustained PACs",
                        "observation": "No sustained AFib during 24-hr recording. Occasional PACs noted."
                    },
                    {
                        "test_name": "Resting Heart Rate",
                        "value": 74.0,
                        "unit": "bpm",
                        "reference_range": "60 - 100 bpm",
                        "status": "Normal",
                        "observation": "Mean daytime resting heart rate 74 bpm."
                    },
                    {
                        "test_name": "Thyroid Stimulating Hormone (TSH)",
                        "value": 2.1,
                        "unit": "mIU/L",
                        "reference_range": "0.4 - 4.0 mIU/L",
                        "status": "Normal",
                        "observation": "Euthyroid; normal pituitary-thyroid axis."
                    },
                    {
                        "test_name": "Serum Potassium (K+)",
                        "value": 4.2,
                        "unit": "mEq/L",
                        "reference_range": "3.5 - 5.0 mEq/L",
                        "status": "Normal",
                        "observation": "Normal myocardial resting membrane stability."
                    }
                ],
                "resting_hr_bpm": 74,
                "ecg_status": "Normal Sinus Rhythm (PACs observed)"
            }
        )
        db.add(cardio_report)
        db.commit()
    else:
        # Update notes and extracted summary to match prompt specifications
        cardio_report.patient_notes = "No sustained atrial fibrillation during 24-hour recording period. Sinus rhythm with occasional premature atrial contractions (PACs). Recommend 7-day Holter or wearable patch monitoring if palpitations recur."
        if not cardio_report.extracted_summary or "findings" not in cardio_report.extracted_summary:
            cardio_report.extracted_summary = {
                "raw_text": (
                    "24-Hour Ambulatory Holter ECG Monitoring Report. Indication: Palpitations and nocturnal arrhythmia surveillance. "
                    "Findings: Predominant normal sinus rhythm with mean heart rate 74 bpm (range 58-112 bpm). "
                    "No sustained atrial fibrillation (>30 seconds) observed during recording period. "
                    "Isolated premature atrial complexes (PACs, 142 total, <1% of total beats). Occasional sinus arrhythmia. "
                    "No high-grade AV block or ventricular tachyarrhythmias. "
                    "Impression: No sustained AFib captured on 24-hour baseline. "
                    "Recommend 7-day Holter or wearable patch monitoring if episodic palpitations recur."
                ),
                "findings": [
                    {
                        "test_name": "24-Hour ECG Rhythm Interpretation",
                        "value": "Sinus Rhythm with Occasional PACs",
                        "unit": "",
                        "reference_range": "Normal Sinus Rhythm",
                        "status": "Normal / Non-sustained PACs",
                        "observation": "No sustained AFib during 24-hr recording. Occasional PACs noted."
                    },
                    {
                        "test_name": "Resting Heart Rate",
                        "value": 74.0,
                        "unit": "bpm",
                        "reference_range": "60 - 100 bpm",
                        "status": "Normal",
                        "observation": "Mean daytime resting heart rate 74 bpm."
                    },
                    {
                        "test_name": "Thyroid Stimulating Hormone (TSH)",
                        "value": 2.1,
                        "unit": "mIU/L",
                        "reference_range": "0.4 - 4.0 mIU/L",
                        "status": "Normal",
                        "observation": "Euthyroid; normal pituitary-thyroid axis."
                    },
                    {
                        "test_name": "Serum Potassium (K+)",
                        "value": 4.2,
                        "unit": "mEq/L",
                        "reference_range": "3.5 - 5.0 mEq/L",
                        "status": "Normal",
                        "observation": "Normal myocardial resting membrane stability."
                    }
                ],
                "resting_hr_bpm": 74,
                "ecg_status": "Normal Sinus Rhythm (PACs observed)"
            }
            db.commit()

    # Clean up any legacy diabetes-specific reports
    db.query(MedicalReport).filter(
        MedicalReport.patient_id == demo_patient.id,
        MedicalReport.category == "Endocrinology & Metabolic"
    ).delete(synchronize_session=False)
    db.commit()

    # 5. Seed Alert Rule
    if db.query(AlertRule).filter(AlertRule.patient_id == demo_patient.id).count() == 0:
        db.add(AlertRule(
            patient_id=demo_patient.id,
            created_by_user_id=demo_caregiver.id,
            parameter="heart_rate_bpm",
            condition="greater_than",
            threshold=110.0,
            severity="HIGH",
            persistence_seconds=5,
            cooldown_seconds=180,
            enabled=True
        ))
        db.commit()

    # 6. Seed / Update Baseline Clinical Symptoms for Eleanor Vance (AFib specific)
    # Remove any old diabetes symptoms
    for old_symptom in ["Frequent urination (polyuria)", "Excessive thirst (polydipsia)", "Exertional fatigue"]:
        db.query(PatientSymptom).filter(
            PatientSymptom.patient_id == demo_patient.id,
            PatientSymptom.symptom_name == old_symptom
        ).delete(synchronize_session=False)
    db.commit()

    # Ensure the 3 AFib symptoms exist for Eleanor Vance
    afib_seed_symptoms = [
        {
            "symptom_name": "Irregular heartbeat rhythm",
            "duration": "2 weeks",
            "severity": "Moderate",
            "frequency": "Intermittent",
            "notes": "Patient notices irregular, fluttering sensations in the chest at rest."
        },
        {
            "symptom_name": "Heart palpitations",
            "duration": "10 days",
            "severity": "Moderate",
            "frequency": "Occasional",
            "notes": "Pounding sensation in chest after climbing stairs or in the evening."
        },
        {
            "symptom_name": "Unusual fatigue or tiredness",
            "duration": "1 month",
            "severity": "Mild",
            "frequency": "Intermittent",
            "notes": "Unexplained exhaustion and reduced energy during normal activities."
        }
    ]
    for sym_data in afib_seed_symptoms:
        exists = db.query(PatientSymptom).filter(
            PatientSymptom.patient_id == demo_patient.id,
            PatientSymptom.symptom_name == sym_data["symptom_name"]
        ).first()
        if not exists:
            db.add(PatientSymptom(
                patient_id=demo_patient.id,
                recorded_by_user_id=demo_patient.id,
                symptom_name=sym_data["symptom_name"],
                duration=sym_data["duration"],
                severity=sym_data["severity"],
                frequency=sym_data["frequency"],
                notes=sym_data["notes"],
                is_active=True
            ))
    db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed default devices
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

        # Seed global thresholds
        if not db.query(SystemConfig).filter(SystemConfig.config_key == "thresholds").first():
            db.add(SystemConfig(
                config_key="thresholds",
                config_value=DEFAULT_THRESHOLDS.model_dump()
            ))
        db.commit()

        # Seed Demo Patient & Caregiver Accounts
        seed_demo_accounts_and_data(db)

    finally:
        db.close()

    yield

app = FastAPI(
    title="PulseBridge Duo Backend API",
    description="IoT Healthcare Monitoring, Patient-Caregiver Platform & Alert API",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router, prefix="/api")
app.include_router(family_router, prefix="/api")
app.include_router(patients_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(disease_router, prefix="/api")
app.include_router(api_router, prefix="/api")

# WebSocket Endpoint
@app.websocket("/ws/monitoring")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
