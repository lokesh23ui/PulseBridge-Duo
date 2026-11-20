export type UserRole = 'patient' | 'caregiver' | 'admin';

export interface PatientProfile {
  id: number;
  user_id: number;
  age?: number;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  medical_conditions?: string;
}

export interface CaregiverProfile {
  id: number;
  user_id: number;
  relationship_to_patient?: string;
  contact_phone?: string;
  organization?: string;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  status?: string;
  is_active?: boolean;
  created_at: string;
  patient_profile?: PatientProfile;
  caregiver_profile?: CaregiverProfile;
}

export interface AccessPermissions {
  view_live_readings: boolean;
  view_historical_readings: boolean;
  view_medical_reports: boolean;
  view_health_trends: boolean;
  create_manage_alert_rules: boolean;
  acknowledge_alerts: boolean;
  view_device_status: boolean;
}

export interface CaregiverInvitation {
  id: number;
  patient_id: number;
  invitation_code: string;
  expires_at: string;
  status: string;
  created_at: string;
}

export interface Relationship {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  caregiver_id: number;
  caregiver_name: string;
  caregiver_email: string;
  relationship_label: string;
  status: 'pending_approval' | 'active' | 'rejected' | 'revoked';
  created_at: string;
  approved_at?: string;
  revoked_at?: string;
  permissions?: AccessPermissions;
}

export interface AlertRule {
  id: number;
  patient_id: number;
  created_by_user_id: number;
  created_by_name?: string;
  parameter: string;
  condition: string;
  threshold: number;
  lower_limit?: number;
  upper_limit?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  persistence_seconds: number;
  cooldown_seconds: number;
  enabled: boolean;
  last_triggered_at?: string;
  created_at: string;
}

export interface InAppNotification {
  id: number;
  recipient_user_id: number;
  patient_id: number;
  patient_name: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  parameter?: string;
  value?: number;
  unit?: string;
  alert_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface MedicalReport {
  id: number;
  patient_id: number;
  report_title: string;
  category: string;
  report_date: string;
  healthcare_provider?: string;
  patient_notes?: string;
  extracted_summary?: string;
  file_path?: string;
  created_at: string;
}

export interface ConnectedPatientCard {
  patient_id: number;
  relationship_id?: number;
  full_name: string;
  email: string;
  age?: number;
  emergency_contact?: string;
  relationship_label: string;
  permissions?: AccessPermissions;
  latest_heart_rate?: number;
  latest_spo2?: number;
  active_alert_count: number;
  status: string;
}
