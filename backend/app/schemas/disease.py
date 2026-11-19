from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# -------------------------------------------------------------
# SYMPTOM SCHEMAS
# -------------------------------------------------------------
class PatientSymptomCreate(BaseModel):
    symptom_name: str = Field(..., min_length=2, max_length=128)
    duration: Optional[str] = "1 week"
    severity: str = Field(default="Moderate")  # Mild, Moderate, Severe
    frequency: str = Field(default="Intermittent")  # Occasional, Intermittent, Constant
    notes: Optional[str] = None

class PatientSymptomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    recorded_by_user_id: int
    symptom_name: str
    duration: Optional[str] = None
    severity: str
    frequency: str
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime

# -------------------------------------------------------------
# REPORT EXTRACTION & REVIEW SCHEMAS
# -------------------------------------------------------------
class ExtractedBiomarker(BaseModel):
    test_name: str
    value: Union[float, str]
    unit: str
    reference_range: Optional[str] = None
    status: Optional[str] = "Normal"  # Normal, Low, Elevated, Critical
    observation: Optional[str] = None

class ReportExtractionDraft(BaseModel):
    report_title: str
    category: str
    healthcare_provider: Optional[str] = None
    report_date: Optional[str] = None
    raw_text: str
    findings: List[ExtractedBiomarker] = []
    suggested_symptoms: List[str] = []
    confidence_note: str

class ReportConfirmCreate(BaseModel):
    report_title: str
    category: str = "Diagnostic Report"
    report_date: Optional[datetime] = None
    healthcare_provider: Optional[str] = None
    patient_notes: Optional[str] = None
    findings: List[Dict[str, Any]] = []
    raw_text: Optional[str] = None

# -------------------------------------------------------------
# DISEASE ANALYSIS & KNOWLEDGE BASE SCHEMAS
# -------------------------------------------------------------
class MedicalReference(BaseModel):
    title: str
    source: str
    url: str

class DiseaseKnowledgeItem(BaseModel):
    id: str
    name: str
    category: str
    short_description: str
    what_happens_in_body: str
    common_symptoms: List[str]
    risk_factors: List[str]
    relevant_patient_characteristics: List[str]
    relevant_report_biomarkers: List[str]
    relevant_health_parameters: List[str]
    diagnostic_tests: List[str]
    important_warning_signs: List[str]
    prevention_management: str
    medical_references: List[MedicalReference]
    overview_route: Optional[str] = None

class DiseaseMatchResult(BaseModel):
    disease_id: str
    disease_name: str
    short_name: Optional[str] = "AFib"
    category: str
    short_description: str
    match_level: str  # "Relevant findings identified", "Some relevant findings identified", "Insufficient information", "No relevant findings identified", "ECG confirmation documented in uploaded records"
    match_score_rank: Optional[int] = 1
    ecg_confirmation_documented: Optional[bool] = False
    ecg_confirmation_details: Optional[Dict[str, Any]] = None
    matching_symptoms: List[str] = []
    has_primary_irregular_rhythm_symptom: Optional[bool] = False
    relevant_patient_details: List[str] = []
    relevant_report_findings: List[Dict[str, Any]] = []
    relevant_parameter_observations: List[str] = []
    missing_information: List[str] = []
    reason_included: str
    suggested_next_assessments: Optional[List[str]] = []
    recommended_next_assessments: Optional[List[str]] = []
    emergency_warning_triggered: Optional[bool] = False
    emergency_warning_text: Optional[str] = None
    medical_references: List[MedicalReference] = []
    overview_route: Optional[str] = None
    important_warning_signs: Optional[List[str]] = []

class DiseaseAnalysisRunResponse(BaseModel):
    analysis_id: str
    patient_id: int
    analysis_date: datetime
    disclaimer: str
    reports_considered_count: int
    symptoms_considered_count: int
    parameters_evaluated: Dict[str, Any]
    ranked_diseases: List[DiseaseMatchResult]

class DiseaseAnalysisSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    analysis_id: str
    patient_id: int
    analysis_date: datetime
    reports_considered_count: int
    symptoms_considered_count: int
    highlighted_diseases: Optional[List[Dict[str, Any]]] = None
    clinical_notes: Optional[str] = None
    created_at: datetime
