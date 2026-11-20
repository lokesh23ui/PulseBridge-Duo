import datetime
import uuid
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
)
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

# -------------------------------------------------------------
# USER & PROFILES (PATIENT & CAREGIVER ROLES)
# -------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False)  # "patient", "caregiver", "admin"
    full_name = Column(String(128), nullable=False)
    status = Column(String(32), default="active", nullable=False)  # "active", "suspended", "deactivated"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    caregiver_profile = relationship("CaregiverProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    emergency_contact_name = Column(String(128), nullable=True)
    emergency_contact_phone = Column(String(64), nullable=True)
    blood_type = Column(String(16), nullable=True)
    medical_conditions = Column(Text, nullable=True)

    user = relationship("User", back_populates="patient_profile")

class CaregiverProfile(Base):
    __tablename__ = "caregiver_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    relationship_type = Column(String(64), default="Family Member")  # "Son", "Daughter", "Spouse", "Nurse", etc.
    phone_number = Column(String(64), nullable=True)

    user = relationship("User", back_populates="caregiver_profile")

# -------------------------------------------------------------
# FAMILY INVITATIONS & RELATIONSHIPS
# -------------------------------------------------------------
class CaregiverInvitation(Base):
    __tablename__ = "caregiver_invitations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    invitation_code = Column(String(32), unique=True, index=True, nullable=False)  # e.g. "PBD-7K92-AX51"
    invitation_token_hash = Column(String(128), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="active")  # "active", "used", "expired", "cancelled"
    created_at = Column(DateTime, default=utc_now)

class PatientCaregiverRelationship(Base):
    __tablename__ = "patient_caregiver_relationships"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    caregiver_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    relationship_label = Column(String(64), default="Caregiver")  # e.g. "Daughter", "Son", "Doctor"
    status = Column(String(32), default="pending_approval")  # "pending_approval", "active", "rejected", "revoked"
    created_at = Column(DateTime, default=utc_now)
    approved_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    permissions = relationship("AccessPermission", back_populates="relationship", uselist=False, cascade="all, delete-orphan")

class AccessPermission(Base):
    __tablename__ = "access_permissions"

    id = Column(Integer, primary_key=True, index=True)
    relationship_id = Column(Integer, ForeignKey("patient_caregiver_relationships.id"), unique=True, index=True, nullable=False)
    
    # 7 Granular Permission Categories
    view_live_readings = Column(Boolean, default=True)
    view_historical_readings = Column(Boolean, default=True)
    view_medical_reports = Column(Boolean, default=False)
    view_health_trends = Column(Boolean, default=True)
    create_manage_alert_rules = Column(Boolean, default=False)
    acknowledge_alerts = Column(Boolean, default=True)
    view_device_status = Column(Boolean, default=True)
    
    updated_at = Column(DateTime, default=utc_now)

    relationship = relationship("PatientCaregiverRelationship", back_populates="permissions")

# -------------------------------------------------------------
# PERSONALIZED ALERT RULES & IN-APP NOTIFICATIONS
# -------------------------------------------------------------
class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parameter = Column(String(64), nullable=False)  # heart_rate_bpm, spo2_percent, bp_systolic_mmhg, etc.
    condition = Column(String(32), nullable=False)  # greater_than, less_than, equal_to, outside_range
    threshold = Column(Float, nullable=False)
    lower_limit = Column(Float, nullable=True)
    upper_limit = Column(Float, nullable=True)
    severity = Column(String(32), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    persistence_seconds = Column(Integer, default=0)
    cooldown_seconds = Column(Integer, default=300)
    enabled = Column(Boolean, default=True)
    last_triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(32), default="HIGH")
    parameter = Column(String(64), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)
    alert_id = Column(String(64), nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    report_title = Column(String(256), nullable=False)
    category = Column(String(64), default="General Checkup")  # Cardiology, Bloodwork, Pulmonology, etc.
    report_date = Column(DateTime, default=utc_now)
    healthcare_provider = Column(String(128), nullable=True)
    patient_notes = Column(Text, nullable=True)
    extracted_summary = Column(JSON, nullable=True)
    file_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=utc_now)

# -------------------------------------------------------------
# PATIENT SYMPTOMS & DISEASE ANALYSIS MODELS
# -------------------------------------------------------------
class PatientSymptom(Base):
    __tablename__ = "patient_symptoms"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    recorded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symptom_name = Column(String(128), nullable=False)
    duration = Column(String(64), nullable=True)  # e.g., "3 days", "2 weeks", "1 month"
    severity = Column(String(32), default="Moderate")  # Mild, Moderate, Severe
    frequency = Column(String(32), default="Intermittent")  # Occasional, Intermittent, Constant
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class DiseaseAnalysisRecord(Base):
    __tablename__ = "disease_analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String(64), unique=True, index=True, default=lambda: f"analysis-{uuid.uuid4().hex[:10]}")
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    performed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_date = Column(DateTime, default=utc_now, index=True)
    reports_considered_count = Column(Integer, default=0)
    symptoms_considered_count = Column(Integer, default=0)
    highlighted_diseases = Column(JSON, nullable=True)  # list of top matched disease summaries
    full_results = Column(JSON, nullable=False)  # detailed results for all analyzed conditions
    clinical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_patient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_entity = Column(String(64), nullable=True)  # "patient", "caregiver", "afib_knowledge", "symptom", "parameter", "settings", "notification", "report"
    target_id = Column(String(64), nullable=True)
    action = Column(String(64), nullable=False)
    details = Column(JSON, nullable=True)
    status = Column(String(32), default="SUCCESS")  # "SUCCESS", "FAILURE", "WARNING"
    timestamp = Column(DateTime, default=utc_now)

    actor = relationship("User", foreign_keys=[actor_user_id])

class SystemAnnouncement(Base):
    __tablename__ = "system_announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    announcement_type = Column(String(32), default="info")  # "info", "warning", "maintenance", "urgent"
    target_audience = Column(String(32), default="all")  # "all", "patient", "caregiver"
    is_active = Column(Boolean, default=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    creator = relationship("User", foreign_keys=[created_by_user_id])

class AFibSymptomCatalog(Base):
    __tablename__ = "afib_symptoms_catalog"

    id = Column(Integer, primary_key=True, index=True)
    symptom_key = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    typical_severity = Column(String(32), default="Moderate")  # "Mild", "Moderate", "Severe"
    clinical_significance = Column(Text, nullable=True)
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    updated_at = Column(DateTime, default=utc_now)

class AFibParameterCatalog(Base):
    __tablename__ = "afib_parameters_catalog"

    id = Column(Integer, primary_key=True, index=True)
    parameter_key = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    unit = Column(String(32), nullable=True)
    normal_range = Column(String(64), nullable=True)
    clinical_role = Column(Text, nullable=False)
    limitations = Column(Text, nullable=True)
    afib_relevance = Column(Text, nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=utc_now)

# -------------------------------------------------------------
# CORE IOT HARDWARE & TELEMETRY MODELS (PRESERVED)
# -------------------------------------------------------------
class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    device_type = Column(String(32), nullable=False)  # "ring", "watch", "both", "esp32_gateway"
    name = Column(String(128), nullable=False)
    status = Column(String(32), default="connected")  # "connected", "disconnected", "degraded"
    battery_percent = Column(Integer, default=100)
    signal_quality = Column(Float, default=1.0)
    firmware_version = Column(String(32), default="1.0.0")
    last_seen = Column(DateTime, default=utc_now)

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    reading_id = Column(String(64), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=utc_now, index=True)
    source = Column(String(64), nullable=False, index=True)  # WOKWI_SIMULATION, RING_SIMULATOR, WATCH_SIMULATOR, DUAL_SIMULATION, DEMO_GENERATOR
    simulated = Column(Boolean, default=True)
    device_id = Column(String(64), index=True, nullable=False)
    device_type = Column(String(32), nullable=False)
    configuration = Column(String(32), default="both")
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)

    # Physiological & Environmental Parameters
    heart_rate_bpm = Column(Float, nullable=True)
    spo2_percent = Column(Float, nullable=True)
    bp_systolic_mmhg = Column(Float, nullable=True)  # Estimate / placeholder
    bp_diastolic_mmhg = Column(Float, nullable=True) # Estimate / placeholder
    glucose_mg_dl = Column(Float, nullable=True)     # Placeholder
    temperature_c = Column(Float, nullable=True)
    temperature_source = Column(String(16), default="skin") # "skin" or "ambient"
    humidity_percent = Column(Float, nullable=True)
    activity_percent = Column(Float, nullable=True)

    # Telemetry Metadata
    signal_quality = Column(Float, default=1.0)
    battery_percent = Column(Integer, nullable=True)
    connection_state = Column(String(32), default="connected")
    demo_status = Column(String(32), default="NORMAL")
    raw_payload = Column(Text, nullable=True)

class HealthAlert(Base):
    __tablename__ = "health_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(64), unique=True, index=True, default=lambda: f"alert-{uuid.uuid4().hex[:8]}")
    reading_id = Column(String(64), index=True, nullable=True)
    patient_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    parameter = Column(String(64), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)
    rule_triggered = Column(String(256), nullable=False)
    severity = Column(String(32), nullable=False)  # "NORMAL", "ATTENTION", "WARNING", "CRITICAL"
    timestamp = Column(DateTime, default=utc_now, index=True)
    source = Column(String(64), nullable=False)
    device_id = Column(String(64), nullable=False)
    signal_quality = Column(Float, default=1.0)
    verification_instruction = Column(Text, nullable=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)

class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(64), unique=True, nullable=False)
    config_value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=utc_now)

class SimulationSession(Base):
    __tablename__ = "simulation_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True)
    scenario_id = Column(Integer, nullable=False)
    scenario_name = Column(String(128), nullable=False)
    started_at = Column(DateTime, default=utc_now)
    status = Column(String(32), default="active")
