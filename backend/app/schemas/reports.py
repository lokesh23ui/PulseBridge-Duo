from typing import Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MedicalReportCreate(BaseModel):
    report_title: str
    category: str = "General Checkup"
    report_date: Optional[datetime] = None
    healthcare_provider: Optional[str] = None
    patient_notes: Optional[str] = None
    extracted_summary: Optional[Union[Dict[str, Any], str]] = None

class MedicalReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    report_title: str
    category: str
    report_date: datetime
    healthcare_provider: Optional[str] = None
    patient_notes: Optional[str] = None
    extracted_summary: Optional[Union[Dict[str, Any], str]] = None
    file_path: Optional[str] = None
    created_at: datetime
