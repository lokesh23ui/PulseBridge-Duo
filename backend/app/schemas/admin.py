from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserStatusUpdateRequest(BaseModel):
    status: str = Field(pattern="^(active|suspended|deactivated)$")
    reason: Optional[str] = None

class AdminPatientItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    status: str
    is_active: bool
    created_at: datetime
    age: Optional[int] = None
    blood_type: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_conditions: Optional[str] = None
    linked_caregivers_count: int = 0
    reports_count: int = 0
    analyses_count: int = 0
    readings_count: int = 0

class AdminCaregiverItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    status: str
    is_active: bool
    created_at: datetime
    relationship_type: Optional[str] = None
    phone_number: Optional[str] = None
    linked_patients: List[Dict[str, Any]] = []

class AdminDashboardStatsResponse(BaseModel):
    total_patients: int
    total_caregivers: int
    total_admins: int
    total_reports: int
    total_readings: int
    total_analyses: int
    active_alerts: int
    system_status: str
    registration_trend: List[Dict[str, Any]] = []
    report_trend: List[Dict[str, Any]] = []
    analysis_trend: List[Dict[str, Any]] = []
    recent_activity: List[Dict[str, Any]] = []

class AFibKnowledgeUpdateRequest(BaseModel):
    short_description: str
    what_happens_in_heart: str
    types: List[Dict[str, Any]]
    causes_and_risk_factors: List[str]
    diagnostic_methods: List[str]
    when_to_seek_care: Optional[Dict[str, Any]] = None
    global_statistics: Optional[Dict[str, Any]] = None

class SymptomItem(BaseModel):
    id: Optional[int] = None
    symptom_key: str
    name: str
    description: str
    typical_severity: str = "Moderate"
    clinical_significance: Optional[str] = None
    is_primary: bool = False
    is_active: bool = True
    sort_order: int = 0

class SymptomUpdateRequest(BaseModel):
    name: str
    description: str
    typical_severity: str = "Moderate"
    clinical_significance: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class ParameterItem(BaseModel):
    id: Optional[int] = None
    parameter_key: str
    name: str
    unit: Optional[str] = None
    normal_range: Optional[str] = None
    clinical_role: str
    limitations: Optional[str] = None
    afib_relevance: str
    sort_order: int = 0
    is_active: bool = True

class ParameterUpdateRequest(BaseModel):
    name: str
    unit: Optional[str] = None
    normal_range: Optional[str] = None
    clinical_role: str
    limitations: Optional[str] = None
    afib_relevance: str
    sort_order: int = 0
    is_active: bool = True

class AdminReportItem(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    patient_email: str
    report_title: str
    category: str
    report_date: datetime
    healthcare_provider: Optional[str] = None
    patient_notes: Optional[str] = None
    findings_count: int = 0
    created_at: datetime

class SystemAnnouncementCreate(BaseModel):
    title: str = Field(min_length=3, max_length=256)
    message: str = Field(min_length=5)
    announcement_type: str = "info"  # "info", "warning", "maintenance", "urgent"
    target_audience: str = "all"      # "all", "patient", "caregiver"
    expires_at: Optional[datetime] = None

class SystemAnnouncementItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    message: str
    announcement_type: str
    target_audience: str
    is_active: bool
    created_by_user_id: int
    creator_name: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

class AuditLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_user_id: int
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    target_patient_id: Optional[int] = None
    target_entity: Optional[str] = None
    target_id: Optional[str] = None
    action: str
    details: Optional[Dict[str, Any]] = None
    status: str = "SUCCESS"
    timestamp: datetime

class AppSettingsModel(BaseModel):
    app_name: str = "PulseBridge Duo"
    support_email: str = "support@pulsebridge.health"
    maintenance_mode: bool = False
    maintenance_message: Optional[str] = "PulseBridge Duo is undergoing routine system maintenance. Please check back shortly."
    allow_public_registration: bool = True
    ai_features_enabled: bool = False

class SecurityStatusResponse(BaseModel):
    environment: str
    database_connected: bool
    database_engine: str
    jwt_secret_configured: bool
    jwt_secret_is_default: bool
    cors_origins: List[str]
    admin_users_count: int
    active_users_count: int
    suspended_users_count: int
    audit_logs_count: int
    zero_hardcoded_secrets_verified: bool
    offline_deterministic_parser: bool
    uptime_seconds: float
    api_integrations: List[Dict[str, str]] = []
