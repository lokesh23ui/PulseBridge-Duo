from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class AlertRuleCreate(BaseModel):
    parameter: str = Field(description="heart_rate_bpm, spo2_percent, bp_systolic_mmhg, bp_diastolic_mmhg, glucose_mg_dl, temperature_c")
    condition: str = Field(description="greater_than, less_than, equal_to, outside_range")
    threshold: float
    lower_limit: Optional[float] = None
    upper_limit: Optional[float] = None
    severity: str = Field(default="HIGH", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    persistence_seconds: int = Field(default=0, ge=0)
    cooldown_seconds: int = Field(default=300, ge=30)
    enabled: bool = True

class AlertRuleUpdate(BaseModel):
    parameter: Optional[str] = None
    condition: Optional[str] = None
    threshold: Optional[float] = None
    lower_limit: Optional[float] = None
    upper_limit: Optional[float] = None
    severity: Optional[str] = None
    persistence_seconds: Optional[int] = None
    cooldown_seconds: Optional[int] = None
    enabled: Optional[bool] = None

class AlertRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    created_by_user_id: int
    created_by_name: Optional[str] = None
    parameter: str
    condition: str
    threshold: float
    lower_limit: Optional[float] = None
    upper_limit: Optional[float] = None
    severity: str
    persistence_seconds: int
    cooldown_seconds: int
    enabled: bool
    last_triggered_at: Optional[datetime] = None
    created_at: datetime
