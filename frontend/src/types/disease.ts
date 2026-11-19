export interface MedicalReference {
  title: string;
  source: string;
  url: string;
}

export interface GlobalAFibStat {
  statistic: string;
  description: string;
  reporting_year: number;
  geographical_scope: string;
  source: string;
  source_url: string;
  projection_note?: string;
}

export interface AFibParameterRef {
  parameter_name: string;
  clinical_role: string;
  unit: string;
  data_source: string;
  clinical_limitation: string;
  clinical_relevance?: string;
  is_diagnostic?: boolean;
}

export interface AFibSymptomItem {
  id: string;
  name: string;
  short_description: string;
  clinical_note: string;
  is_primary: boolean;
}

export interface AFibClinicalType {
  type: string;
  duration_and_pattern: string;
  clinical_characteristics: string;
  management_focus: string;
}

export interface AFibTreatmentOverview {
  rate_control: string;
  rhythm_control: string;
  anticoagulation: string;
  cardioversion: string;
  catheter_ablation: string;
  surgical_interventions?: string;
}

export interface DiseaseKnowledgeItem {
  id: string;
  name: string;
  short_name?: string;
  category: string;
  short_description: string;
  what_happens_in_heart?: string;
  what_happens_in_body?: string;
  types_of_afib?: AFibClinicalType[];
  common_symptoms: string[];
  symptom_catalogue?: AFibSymptomItem[];
  causes_and_risk_factors?: string[];
  risk_factors?: string[];
  diagnostic_methods?: string[];
  diagnostic_tests?: string[];
  possible_complications?: string[];
  treatment_overview?: AFibTreatmentOverview | Record<string, string>;
  lifestyle_and_management?: string;
  when_to_seek_urgent_medical_attention?: string;
  medical_references: MedicalReference[];
  overview_route?: string | null;
}

export interface AFibOverviewData {
  disease_info: DiseaseKnowledgeItem;
  global_statistics: {
    title: string;
    key_metrics: GlobalAFibStat[];
    public_health_summary: string;
  };
  parameter_references: AFibParameterRef[];
  symptoms: AFibSymptomItem[];
}

export interface PatientAFibRelation {
  patient: {
    id: number;
    full_name: string;
    email: string;
    age: number | null;
    blood_type: string | null;
    medical_conditions: string | null;
  };
  how_afib_relates: {
    relevant_patient_details: string[];
    matching_symptoms: {
      symptom_name: string;
      severity: string;
      duration?: string;
      frequency?: string;
      notes?: string;
      is_primary?: boolean;
    }[];
    has_matching_symptoms: boolean;
    relevant_report_findings: {
      report_title: string;
      report_date?: string;
      test_name: string;
      value: number | string;
      unit: string;
      status: string;
      observation?: string;
    }[];
    missing_clinical_data: string[];
    doctor_review_points: string[];
  };
  emergency_warning: string;
  wokwi_simulation_info: {
    warning_label: string;
    clinical_caution: string;
    latest_vitals: {
      heart_rate_bpm?: number | null;
      spo2_percent?: number | null;
      bp_systolic_mmhg?: number | null;
      bp_diastolic_mmhg?: number | null;
      timestamp?: string | null;
      is_simulated: boolean;
      source: string;
    };
  };
  symptoms_catalogue: AFibSymptomItem[];
}

export type AFibMatchLevel =
  | 'Relevant findings identified'
  | 'Some relevant findings identified'
  | 'Insufficient information'
  | 'No relevant findings identified'
  | 'ECG confirmation documented in uploaded records'
  | 'Some matching information'
  | 'No meaningful match identified';

export interface PatientSymptom {
  id: number;
  patient_id: number;
  recorded_by_user_id: number;
  symptom_name: string;
  duration?: string | null;
  severity: 'Mild' | 'Moderate' | 'Severe';
  frequency: 'Occasional' | 'Intermittent' | 'Constant';
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ExtractedBiomarker {
  test_name: string;
  value: number | string;
  unit: string;
  reference_range?: string;
  status?: string;
  observation?: string;
}

export interface ReportExtractionDraft {
  report_title: string;
  category: string;
  healthcare_provider?: string;
  report_date?: string;
  raw_text: string;
  findings: ExtractedBiomarker[];
  suggested_symptoms: string[];
  confidence_note: string;
}

export interface DiseaseMatchResult {
  disease_id: string;
  disease_name: string;
  short_name?: string;
  category: string;
  short_description: string;
  match_level: AFibMatchLevel;
  match_score_rank?: number;
  ecg_confirmation_documented?: boolean;
  ecg_confirmation_details?: {
    report_title: string;
    report_date: string;
    finding: string;
  } | null;
  matching_symptoms: string[];
  has_primary_irregular_rhythm_symptom?: boolean;
  relevant_patient_details: string[];
  relevant_report_findings: {
    report: string;
    date: string;
    finding: string;
    clinical_interpretation: string;
  }[];
  relevant_parameter_observations: string[];
  missing_information: string[];
  reason_included: string;
  suggested_next_assessments?: string[];
  recommended_next_assessments?: string[];
  emergency_warning_triggered?: boolean;
  emergency_warning_text?: string | null;
  medical_references: MedicalReference[];
  overview_route?: string | null;
  important_warning_signs?: string[];
}

export interface DiseaseAnalysisRunResponse {
  analysis_id: string;
  patient_id: number;
  analysis_date: string;
  disclaimer: string;
  reports_considered_count: number;
  symptoms_considered_count: number;
  parameters_evaluated: Record<string, any>;
  ranked_diseases: DiseaseMatchResult[];
}

export interface DiseaseAnalysisSummary {
  analysis_id: string;
  patient_id: number;
  analysis_date: string;
  reports_considered_count: number;
  symptoms_considered_count: number;
  highlighted_diseases?: {
    disease_id: string;
    disease_name: string;
    match_level: string;
    reason: string;
  }[];
  clinical_notes?: string;
  created_at: string;
}

// Backward-compatibility aliases
export type DiabetesOverviewData = AFibOverviewData;
export type PatientDiabetesRelation = PatientAFibRelation;
export type GlobalDiabetesStat = GlobalAFibStat;
export type DiabetesParameterRef = AFibParameterRef;
