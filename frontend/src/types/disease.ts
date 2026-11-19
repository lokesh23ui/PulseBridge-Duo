export interface MedicalReference {
  title: string;
  source: string;
  url: string;
}

export interface GlobalDiabetesStat {
  statistic: string;
  description: string;
  reporting_year: number;
  geographical_scope: string;
  source: string;
  source_url: string;
  projection_note?: string;
}

export interface DiabetesParameterRef {
  parameter_name: string;
  unit: string;
  normal_reference_range: string;
  impaired_prediabetes_range: string;
  diagnostic_threshold: string;
  treatment_target: string;
  abnormal_indication: string;
  measurement_source: string;
  wokwi_compatibility: string;
  requires_clinical_test: boolean;
}

export interface DiseaseKnowledgeItem {
  id: string;
  name: string;
  category: string;
  short_description: string;
  what_happens_in_body: string;
  common_symptoms: string[];
  risk_factors: string[];
  relevant_patient_characteristics: string[];
  relevant_report_biomarkers: string[];
  relevant_health_parameters: string[];
  diagnostic_tests: string[];
  important_warning_signs: string[];
  prevention_management: string;
  medical_references: MedicalReference[];
  overview_route?: string | null;
}

export interface DiabetesOverviewData {
  disease_info: DiseaseKnowledgeItem;
  global_statistics: {
    title: string;
    key_metrics: GlobalDiabetesStat[];
    public_health_summary: string;
  };
  parameter_references: DiabetesParameterRef[];
}

export interface PatientDiabetesRelation {
  patient: {
    id: number;
    full_name: string;
    email: string;
    age: number | null;
    blood_type: string | null;
    medical_conditions: string | null;
  };
  how_diabetes_relates: {
    relevant_patient_details: string[];
    matching_symptoms: {
      symptom_name: string;
      severity: string;
      duration?: string;
      frequency?: string;
    }[];
    relevant_report_findings: {
      report_title: string;
      report_date?: string;
      test_name: string;
      value: number | string;
      unit: string;
      status: string;
    }[];
    has_lab_glucose_results: boolean;
    missing_clinical_data: string[];
    doctor_review_points: string[];
  };
  lab_glucose_results: {
    report_title: string;
    report_date?: string;
    test_name: string;
    value: number | string;
    unit: string;
    status: string;
  }[];
  simulated_glucose_telemetry?: {
    value: number;
    unit: string;
    source: string;
    timestamp?: string;
    warning_label: string;
    clinical_caution: string;
  } | null;
  recent_vitals: {
    heart_rate_bpm?: number | null;
    spo2_percent?: number | null;
    bp_systolic_mmhg?: number | null;
    bp_diastolic_mmhg?: number | null;
    timestamp?: string | null;
    is_simulated: boolean;
  };
}

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
  category: string;
  short_description: string;
  match_level: 'Relevant findings identified' | 'Some matching information' | 'Insufficient information' | 'No meaningful match identified';
  match_score_rank: number;
  matching_symptoms: string[];
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
  recommended_next_assessments: string[];
  medical_references: MedicalReference[];
  overview_route?: string | null;
  important_warning_signs: string[];
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
