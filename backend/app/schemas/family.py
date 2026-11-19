from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    invitation_code: str
    expires_at: datetime
    status: str
    created_at: datetime

class RedeemInvitationRequest(BaseModel):
    invitation_code: str
    relationship_label: Optional[str] = "Caregiver"

class AccessPermissionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="allow")

    view_live_readings: bool = True
    view_historical_readings: bool = True
    view_medical_reports: bool = False
    view_health_trends: bool = True
    create_manage_alert_rules: bool = False
    acknowledge_alerts: bool = True
    view_device_status: bool = True

class ApproveRequestPayload(BaseModel):
    model_config = ConfigDict(extra="allow")
    permissions: Optional[AccessPermissionSchema] = None

class RelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    patient_name: str
    patient_email: str
    caregiver_id: int
    caregiver_name: str
    caregiver_email: str
    relationship_label: str
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    permissions: Optional[AccessPermissionSchema] = None
