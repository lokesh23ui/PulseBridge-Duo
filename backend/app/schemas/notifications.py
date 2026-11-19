from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient_user_id: int
    patient_id: int
    patient_name: str
    title: str
    message: str
    severity: str
    parameter: str
    value: float
    unit: str
    alert_id: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

class NotificationCountResponse(BaseModel):
    unread_count: int
    total_count: int
