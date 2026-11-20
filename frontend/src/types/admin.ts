export interface AdminDashboardStats {
  total_patients: number;
  total_caregivers: number;
  total_admins: number;
  total_reports: number;
  total_readings: number;
  total_analyses: number;
  active_alerts: number;
  system_status: string;
  registration_trend: Array<{ period: string; patients: number; caregivers: number }>;
  report_trend: Array<{ category: string; count: number }>;
  analysis_trend: Array<{ period: string; count: number }>;
  recent_activity: Array<{
    id: number;
    action: string;
    target_entity: string | null;
    target_id: string | null;
    actor_name: string;
    status: string;
    timestamp: string;
  }>;
}

export interface AdminPatient {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: 'active' | 'suspended' | 'deactivated';
  is_active: boolean;
  created_at: string;
  age?: number | null;
  blood_type?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_conditions?: string | null;
  linked_caregivers_count: number;
  reports_count: number;
  analyses_count: number;
  readings_count: number;
}

export interface AdminCaregiver {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: 'active' | 'suspended' | 'deactivated';
  is_active: boolean;
  created_at: string;
  relationship_type?: string | null;
  phone_number?: string | null;
  linked_patients: Array<{
    patient_id: number;
    patient_name: string;
    patient_email: string;
    relationship_label: string;
    status: string;
  }>;
}

export interface AdminAFibKnowledge {
  id: string;
  name: string;
  short_name: string;
  category: string;
  short_description: string;
  what_happens_in_heart: string;
  types: Array<{
    type_name: string;
    duration: string;
    clinical_significance: string;
  }>;
  common_symptoms?: string[];
  symptom_notes?: string;
  causes_and_risk_factors: string[];
  diagnostic_methods: string[];
  when_to_seek_care?: {
    routine_evaluation: string[];
    urgent_care: string[];
    emergency_care: string[];
  };
  global_statistics?: any;
}

export interface AdminSymptom {
  id?: number;
  symptom_key: string;
  name: string;
  description: string;
  typical_severity: string;
  clinical_significance?: string | null;
  is_primary: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface AdminParameter {
  id?: number;
  parameter_key: string;
  name: string;
  unit?: string | null;
  normal_range?: string | null;
  clinical_role: string;
  limitations?: string | null;
  afib_relevance: string;
  sort_order: number;
  is_active: boolean;
}

export interface AdminReport {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  report_title: string;
  category: string;
  report_date: string;
  healthcare_provider?: string | null;
  patient_notes?: string | null;
  findings_count: number;
  created_at: string;
}

export interface AdminAnnouncement {
  id: number;
  title: string;
  message: string;
  announcement_type: 'info' | 'warning' | 'maintenance' | 'urgent';
  target_audience: 'all' | 'patient' | 'caregiver';
  is_active: boolean;
  created_by_user_id: number;
  creator_name?: string | null;
  created_at: string;
  expires_at?: string | null;
}

export interface AdminAuditLog {
  id: number;
  actor_user_id: number;
  actor_name?: string | null;
  actor_email?: string | null;
  target_patient_id?: number | null;
  target_entity?: string | null;
  target_id?: string | null;
  action: string;
  details?: Record<string, any> | null;
  status: string;
  timestamp: string;
}

export interface AdminAppSettings {
  app_name: string;
  support_email: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  allow_public_registration: boolean;
  ai_features_enabled: boolean;
}

export interface AdminSecurityStatus {
  environment: string;
  database_connected: boolean;
  database_engine: string;
  jwt_secret_configured: boolean;
  jwt_secret_is_default: boolean;
  cors_origins: string[];
  admin_users_count: number;
  active_users_count: number;
  suspended_users_count: number;
  audit_logs_count: number;
  zero_hardcoded_secrets_verified: boolean;
  offline_deterministic_parser: boolean;
  uptime_seconds: number;
  api_integrations?: Array<{
    name: string;
    status: 'Configured' | 'Missing configuration' | 'Optional integration disabled';
    type: string;
  }>;
}
