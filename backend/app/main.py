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
            age=72,
            emergency_contact_name="Marcus Vance (Son)",
            emergency_contact_phone="+1 (555) 019-2831",
            blood_type="O+",
            medical_conditions="Mild Hypertension, Nocturnal Arrhythmia Surveillance"
        )
        db.add(profile)
        db.commit()
        db.refresh(demo_patient)

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

    # 4. Seed Medical Report
    if db.query(MedicalReport).filter(MedicalReport.patient_id == demo_patient.id).count() == 0:
        db.add(MedicalReport(
            patient_id=demo_patient.id,
            report_title="Cardiovascular Holter & ECG Baseline",
            category="Cardiology",
            report_date=utc_now() - datetime.timedelta(days=7),
            healthcare_provider="St. Jude Heart & Vascular Center",
            patient_notes="Annual baseline checkup. Advised continuous resting heart rate and nocturnal SpO2 surveillance.",
            extracted_summary={
                "resting_hr_bpm": 74,
                "ecg_status": "Normal Sinus Rhythm",
                "recommended_max_hr": 115,
                "min_spo2_threshold": 92
            }
        ))
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

    # 6. Seed Baseline Clinical Symptoms for Eleanor Vance
    if db.query(PatientSymptom).filter(PatientSymptom.patient_id == demo_patient.id).count() == 0:
        db.add_all([
            PatientSymptom(
                patient_id=demo_patient.id,
                recorded_by_user_id=demo_patient.id,
                symptom_name="Frequent urination (polyuria)",
                duration="2 weeks",
                severity="Mild",
                frequency="Intermittent",
                notes="Noticeable during evening and night hours."
            ),
            PatientSymptom(
                patient_id=demo_patient.id,
                recorded_by_user_id=demo_patient.id,
                symptom_name="Excessive thirst (polydipsia)",
                duration="10 days",
                severity="Mild",
                frequency="Occasional",
                notes="Dry mouth upon waking, increased water consumption."
            ),
            PatientSymptom(
                patient_id=demo_patient.id,
                recorded_by_user_id=demo_patient.id,
                symptom_name="Exertional fatigue",
                duration="1 month",
                severity="Moderate",
                frequency="Constant",
                notes="Tires easily after climbing stairs or brisk walks."
            )
        ])
        db.commit()

    # 7. Seed Comprehensive Metabolic Report
    if db.query(MedicalReport).filter(MedicalReport.patient_id == demo_patient.id, MedicalReport.category == "Endocrinology & Metabolic").count() == 0:
        db.add(MedicalReport(
            patient_id=demo_patient.id,
            report_title="Annual Comprehensive Metabolic & Lipid Panel",
            category="Endocrinology & Metabolic",
            report_date=utc_now() - datetime.timedelta(days=14),
            healthcare_provider="Quest Diagnostics Metro Regional Lab",
            patient_notes="Routine annual evaluation. Fasting glucose slightly elevated above baseline.",
            extracted_summary={
                "raw_text": "Metabolic panel indicates Fasting Blood Glucose of 118 mg/dL (Impaired Fasting Glucose / Prediabetes tier). HbA1c is 5.9%. Serum Creatinine 0.9 mg/dL. eGFR 78 mL/min/1.73m2. Total Cholesterol 210 mg/dL.",
                "findings": [
                    {
                        "test_name": "Fasting Blood Glucose",
                        "value": 118.0,
                        "unit": "mg/dL",
                        "reference_range": "70 - 99 mg/dL",
                        "status": "Impaired (Prediabetes)",
                        "observation": "Fasting plasma glucose in impaired fasting glucose tier (100 - 125 mg/dL)."
                    },
                    {
                        "test_name": "Glycated Hemoglobin (HbA1c)",
                        "value": 5.9,
                        "unit": "%",
                        "reference_range": "< 5.7%",
                        "status": "Prediabetes",
                        "observation": "HbA1c indicates borderline prediabetic range (5.7% - 6.4%)."
                    },
                    {
                        "test_name": "Serum Creatinine",
                        "value": 0.9,
                        "unit": "mg/dL",
                        "reference_range": "0.7 - 1.2 mg/dL",
                        "status": "Normal",
                        "observation": "Normal renal excretion."
                    },
                    {
                        "test_name": "Total Cholesterol",
                        "value": 210.0,
                        "unit": "mg/dL",
                        "reference_range": "< 200 mg/dL",
                        "status": "Borderline",
                        "observation": "Borderline elevation in circulating lipids."
                    }
                ]
            }
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
