from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# Canonical Wokwi ESP32 Ingestion Schema
class WokwiPayloadSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    device_id: str = Field(default="PB-ESP32-01")
    source: str = Field(default="WOKWI_SIMULATION")
    simulated: bool = Field(default=True)
    heart_rate_bpm: Optional[float] = None
    spo2_percent: Optional[float] = None
    bp_systolic_mmhg: Optional[float] = None
    bp_diastolic_mmhg: Optional[float] = None
    glucose_mg_dl: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    activity_percent: Optional[float] = None
    demo_status: Optional[str] = "NORMAL"

# Generic Ingestion Schema (supports Ring, Watch, Dual, Wokwi, Demo)
class SensorReadingCreate(BaseModel):
    model_config = ConfigDict(extra="allow")

    device_id: str = "PB-GENERIC-01"
    device_type: Optional[str] = "esp32_gateway"
    source: str = "DEMO_GENERATOR"
    simulated: bool = True
    configuration: Optional[str] = "both"
    heart_rate_bpm: Optional[float] = None
    spo2_percent: Optional[float] = None
    bp_systolic_mmhg: Optional[float] = None
    bp_diastolic_mmhg: Optional[float] = None
    glucose_mg_dl: Optional[float] = None
    temperature_c: Optional[float] = None
    temperature_source: Optional[str] = "skin"
    humidity_percent: Optional[float] = None
    activity_percent: Optional[float] = None
    signal_quality: Optional[float] = 1.0
    battery_percent: Optional[int] = None
    connection_state: Optional[str] = "connected"
    demo_status: Optional[str] = "NORMAL"
    raw_payload: Optional[str] = None

class SensorReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reading_id: str
    timestamp: datetime
    source: str
    simulated: bool
    device_id: str
    device_type: str
    configuration: str
    heart_rate_bpm: Optional[float] = None
    spo2_percent: Optional[float] = None
    bp_systolic_mmhg: Optional[float] = None
    bp_diastolic_mmhg: Optional[float] = None
    glucose_mg_dl: Optional[float] = None
    temperature_c: Optional[float] = None
    temperature_source: str = "skin"
    humidity_percent: Optional[float] = None
    activity_percent: Optional[float] = None
    signal_quality: float = 1.0
    battery_percent: Optional[int] = None
    connection_state: str = "connected"
    demo_status: str = "NORMAL"

class HealthAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    alert_id: str
    reading_id: Optional[str] = None
    parameter: str
    value: float
    unit: str
    rule_triggered: str
    severity: str
    timestamp: datetime
    source: str
    device_id: str
    signal_quality: float
    verification_instruction: str
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None

class AlertAcknowledgeResponse(BaseModel):
    alert_id: str
    status: str
    acknowledged_at: datetime

class DeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    device_type: str
    name: str
    status: str
    battery_percent: int
    signal_quality: float
    firmware_version: str
    last_seen: datetime

class ThresholdConfigSchema(BaseModel):
    hr_low: float = 50.0
    hr_high_warning: float = 105.0
    hr_high_critical: float = 130.0
    spo2_low_warning: float = 92.0
    spo2_low_critical: float = 90.0
    bp_systolic_attention: float = 140.0
    bp_systolic_warning: float = 160.0
    bp_diastolic_attention: float = 90.0
    bp_diastolic_warning: float = 100.0
    glucose_attention: float = 180.0
    glucose_warning: float = 250.0
    temp_skin_warning: float = 37.8
    temp_ambient_attention: float = 38.0
    min_signal_quality_threshold: float = 0.40

class IngestionResult(BaseModel):
    success: bool
    reading_id: str
    timestamp: datetime
    normalized_source: str
    alerts_generated: int
    message: str = "Reading ingested successfully"
