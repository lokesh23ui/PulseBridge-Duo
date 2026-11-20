import { SensorReading, HealthAlert, DeviceInfo, ThresholdConfig } from '../types/telemetry';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', active_devices: 0 };
    }
  },

  async getDevices(): Promise<DeviceInfo[]> {
    try {
      const res = await fetch(`${API_BASE}/devices`);
      if (!res.ok) throw new Error('Failed to fetch devices');
      return await res.json();
    } catch {
      // Fallback local devices
      return [
        {
          device_id: 'PB-RING-01',
          device_type: 'ring',
          name: 'PulseBridge Smart Ring',
          status: 'connected',
          battery_percent: 92,
          signal_quality: 0.96,
          firmware_version: '1.0.0',
          last_seen: new Date().toISOString()
        },
        {
          device_id: 'PB-WATCH-01',
          device_type: 'watch',
          name: 'PulseBridge Smartwatch',
          status: 'connected',
          battery_percent: 78,
          signal_quality: 0.94,
          firmware_version: '1.0.0',
          last_seen: new Date().toISOString()
        }
      ];
    }
  },

  async getLatestReading(deviceId?: string, source?: string): Promise<SensorReading | null> {
    try {
      const params = new URLSearchParams();
      if (deviceId) params.append('device_id', deviceId);
      if (source) params.append('source', source);
      const url = `${API_BASE}/latest${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getHistory(hours: number = 6, deviceId?: string) {
    try {
      const params = new URLSearchParams({ hours: hours.toString() });
      if (deviceId) params.append('device_id', deviceId);
      const res = await fetch(`${API_BASE}/history?${params.toString()}`);
      if (!res.ok) throw new Error('History fetch failed');
      return await res.json();
    } catch {
      return { count: 0, readings: [] };
    }
  },

  async postSensorData(payload: Record<string, any>) {
    const res = await fetch(`${API_BASE}/sensor-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || 'Ingestion failed');
    }
    return await res.json();
  },

  async getAlerts(severity?: string, acknowledged?: boolean): Promise<HealthAlert[]> {
    try {
      const params = new URLSearchParams();
      if (severity) params.append('severity', severity);
      if (acknowledged !== undefined) params.append('acknowledged', String(acknowledged));
      const url = `${API_BASE}/alerts${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async acknowledgeAlert(alertId: string) {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return await res.json();
  },

  async clearAlerts() {
    const res = await fetch(`${API_BASE}/alerts/clear?confirm=true`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to clear alerts');
    return await res.json();
  },

  async getConfiguration(): Promise<ThresholdConfig> {
    try {
      const res = await fetch(`${API_BASE}/configuration`);
      if (!res.ok) throw new Error('Failed to fetch config');
      return await res.json();
    } catch {
      return {
        hr_low: 50.0,
        hr_high_warning: 105.0,
        hr_high_critical: 130.0,
        spo2_low_warning: 92.0,
        spo2_low_critical: 90.0,
        bp_systolic_attention: 140.0,
        bp_systolic_warning: 160.0,
        bp_diastolic_attention: 90.0,
        bp_diastolic_warning: 100.0,
        glucose_attention: 180.0,
        glucose_warning: 250.0,
        temp_skin_warning: 37.8,
        temp_ambient_attention: 38.0,
        min_signal_quality_threshold: 0.40
      };
    }
  },

  async updateConfiguration(config: ThresholdConfig) {
    const res = await fetch(`${API_BASE}/configuration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update config');
    return await res.json();
  },

  async resetPlatform() {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Reset failed');
    return await res.json();
  },

  // --- Auth Endpoints ---
  async login(payload: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return await res.json();
  },

  async register(payload: Record<string, any>) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return await res.json();
  },

  async getMe(token: string) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return await res.json();
  },

  // --- Family & Invitations ---
  async getInvitations(token: string) {
    const res = await fetch(`${API_BASE}/family/invitations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch invitations');
    return await res.json();
  },

  async createInvitation(token: string) {
    const res = await fetch(`${API_BASE}/family/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create invitation' }));
      throw new Error(err.detail || 'Failed to create invitation');
    }
    return await res.json();
  },

  async redeemInvitation(token: string, invitationCode: string, relationshipLabel: string = 'Caregiver') {
    const res = await fetch(`${API_BASE}/family/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ invitation_code: invitationCode, relationship_label: relationshipLabel })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Redemption failed' }));
      throw new Error(err.detail || 'Invalid or expired invitation code');
    }
    return await res.json();
  },

  async getRelationships(token: string) {
    const res = await fetch(`${API_BASE}/family/relationships`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch relationships');
    return await res.json();
  },

  async approveRelationship(token: string, relationshipId: number, permissions?: Record<string, boolean>) {
    const res = await fetch(`${API_BASE}/family/requests/${relationshipId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ permissions })
    });
    if (!res.ok) throw new Error('Failed to approve request');
    return await res.json();
  },

  async rejectRelationship(token: string, relationshipId: number) {
    const res = await fetch(`${API_BASE}/family/requests/${relationshipId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to reject request');
    return await res.json();
  },

  async updateRelationshipPermissions(token: string, relationshipId: number, permissions: Record<string, boolean>) {
    const res = await fetch(`${API_BASE}/family/relationships/${relationshipId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(permissions)
    });
    if (!res.ok) throw new Error('Failed to update permissions');
    return await res.json();
  },

  async revokeRelationship(token: string, relationshipId: number) {
    const res = await fetch(`${API_BASE}/family/relationships/${relationshipId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to revoke access');
    return await res.json();
  },

  // --- Patients & Shared Telemetry ---
  async getConnectedPatients(token: string) {
    const res = await fetch(`${API_BASE}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch patients');
    return await res.json();
  },

  async getPatientOverview(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Access restricted' }));
      throw new Error(err.detail || 'Access restricted');
    }
    return await res.json();
  },

  async getPatientReadings(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/readings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  },

  async getPatientHistory(token: string, patientId: number, hours: number = 6) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/history?hours=${hours}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch patient history');
    return await res.json();
  },

  async getPatientReports(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Reports restricted' }));
      throw new Error(err.detail || 'Access restricted');
    }
    return await res.json();
  },

  async uploadPatientReport(token: string, patientId: number, report: Record<string, any>) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(report)
    });
    if (!res.ok) throw new Error('Failed to create report');
    return await res.json();
  },

  async injectControlledPatientReading(token: string, patientId: number, reading: Record<string, any>) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/controlled-reading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(reading)
    });
    if (!res.ok) throw new Error('Failed to inject reading');
    return await res.json();
  },

  // --- Personalized Alert Rules ---
  async getPatientAlertRules(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/alert-rules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch alert rules');
    return await res.json();
  },

  async createPatientAlertRule(token: string, patientId: number, rule: Record<string, any>) {
    const res = await fetch(`${API_BASE}/patients/${patientId}/alert-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(rule)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create rule' }));
      throw new Error(err.detail || 'Failed to create rule');
    }
    return await res.json();
  },

  async deleteAlertRule(token: string, ruleId: number) {
    const res = await fetch(`${API_BASE}/alerts/rules/${ruleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete rule');
    return await res.json();
  },

  // --- In-App Notifications ---
  async getNotifications(token: string, limit: number = 50) {
    const res = await fetch(`${API_BASE}/notifications?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  },

  async getUnreadNotificationCount(token: string) {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { unread_count: 0, total_count: 0 };
    return await res.json();
  },

  async markNotificationRead(token: string, notificationId: number) {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to mark notification read');
    return await res.json();
  },

  async markAllNotificationsRead(token: string) {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to mark all notifications read');
    return await res.json();
  },

  // --- Convenience & Compatibility Methods ---
  async getMedicalReports(token: string, patientId: number = 0) {
    return this.getPatientReports(token, patientId);
  },

  async createMedicalReport(token: string, report: Record<string, any>, patientId: number = 0) {
    return this.uploadPatientReport(token, patientId, report);
  },

  async createAlertRule(token: string, patientId: number, rule: Record<string, any>) {
    return this.createPatientAlertRule(token, patientId, rule);
  },

  async injectPatientControlledReading(token: string, patientId: number, reading: Record<string, any>) {
    return this.injectControlledPatientReading(token, patientId, reading);
  },

  // --- Disease Intelligence & Clinical Analysis ---
  async getDiseaseKnowledgeBase() {
    const res = await fetch(`${API_BASE}/disease/knowledge-base`);
    if (!res.ok) throw new Error('Failed to fetch disease knowledge base');
    return await res.json();
  },

  async getDiseaseDetail(diseaseId: string) {
    const res = await fetch(`${API_BASE}/disease/knowledge-base/${diseaseId}`);
    if (!res.ok) throw new Error('Failed to fetch disease detail');
    return await res.json();
  },

  async getAFibOverview() {
    const res = await fetch(`${API_BASE}/disease/afib-overview`);
    if (!res.ok) throw new Error('Failed to fetch AFib overview');
    return await res.json();
  },

  async getPatientAFibRelation(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/afib-relation`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch patient AFib relation' }));
      throw new Error(err.detail || 'Failed to fetch patient AFib relation');
    }
    return await res.json();
  },

  async getAFibSymptomCatalogue() {
    const res = await fetch(`${API_BASE}/disease/symptom-catalogue`);
    if (!res.ok) throw new Error('Failed to fetch AFib symptom catalogue');
    return await res.json();
  },

  async getDiabetesOverview() {
    return this.getAFibOverview();
  },

  async getPatientDiabetesRelation(token: string, patientId: number) {
    return this.getPatientAFibRelation(token, patientId);
  },

  async getPatientSymptoms(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/symptoms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch patient symptoms');
    return await res.json();
  },

  async recordPatientSymptom(token: string, patientId: number, payload: Record<string, any>) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/symptoms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to record symptom' }));
      throw new Error(err.detail || 'Failed to record symptom');
    }
    return await res.json();
  },

  async deletePatientSymptom(token: string, patientId: number, symptomId: number) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/symptoms/${symptomId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete symptom');
    return await res.json();
  },

  async extractReportDraft(token: string, patientId: number, formData: FormData) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/reports/extract`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to extract report draft' }));
      throw new Error(err.detail || 'Failed to extract report draft');
    }
    return await res.json();
  },

  async confirmAndSaveReport(token: string, patientId: number, payload: Record<string, any>) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/reports/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save confirmed report' }));
      throw new Error(err.detail || 'Failed to save confirmed report');
    }
    return await res.json();
  },

  async runDiseaseAnalysis(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to run disease analysis' }));
      throw new Error(err.detail || 'Failed to run disease analysis');
    }
    return await res.json();
  },

  async getPatientAnalysisHistory(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/analyses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch analysis history');
    return await res.json();
  },

  async getSingleAnalysisRecord(token: string, patientId: number, analysisId: string) {
    const res = await fetch(`${API_BASE}/disease/patient/${patientId}/analyses/${analysisId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch analysis detail');
    return await res.json();
  },

  // =============================================================
  // ADMINISTRATION API (PROTECTED: ROLE = ADMIN)
  // =============================================================
  async getAdminStats(token: string) {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return await res.json();
  },

  async getAdminPatients(token: string, search?: string, statusFilter?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status_filter', statusFilter);
    const res = await fetch(`${API_BASE}/admin/patients?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch patients list');
    return await res.json();
  },

  async getAdminPatientDetail(token: string, patientId: number) {
    const res = await fetch(`${API_BASE}/admin/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch patient detail');
    return await res.json();
  },

  async updateAdminPatientStatus(token: string, patientId: number, status: string, reason?: string) {
    const res = await fetch(`${API_BASE}/admin/patients/${patientId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, reason })
    });
    if (!res.ok) throw new Error('Failed to update patient status');
    return await res.json();
  },

  async getAdminCaregivers(token: string, search?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/admin/caregivers?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch caregivers list');
    return await res.json();
  },

  async updateAdminCaregiverStatus(token: string, caregiverId: number, status: string, reason?: string) {
    const res = await fetch(`${API_BASE}/admin/caregivers/${caregiverId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, reason })
    });
    if (!res.ok) throw new Error('Failed to update caregiver status');
    return await res.json();
  },

  async getAdminAFibKnowledge(token: string) {
    const res = await fetch(`${API_BASE}/admin/afib-knowledge`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch AFib knowledge');
    return await res.json();
  },

  async updateAdminAFibKnowledge(token: string, payload: any) {
    const res = await fetch(`${API_BASE}/admin/afib-knowledge`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update AFib knowledge');
    return await res.json();
  },

  async getAdminSymptoms(token: string) {
    const res = await fetch(`${API_BASE}/admin/symptoms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch symptoms catalog');
    return await res.json();
  },

  async updateAdminSymptom(token: string, key: string, payload: any) {
    const res = await fetch(`${API_BASE}/admin/symptoms/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update symptom' }));
      throw new Error(err.detail || 'Failed to update symptom');
    }
    return await res.json();
  },

  async getAdminParameters(token: string) {
    const res = await fetch(`${API_BASE}/admin/parameters`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch health parameters');
    return await res.json();
  },

  async updateAdminParameter(token: string, key: string, payload: any) {
    const res = await fetch(`${API_BASE}/admin/parameters/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update health parameter');
    return await res.json();
  },

  async getAdminReports(token: string, search?: string, category?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const res = await fetch(`${API_BASE}/admin/reports?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch medical reports');
    return await res.json();
  },

  async getAdminReportDetail(token: string, reportId: number) {
    const res = await fetch(`${API_BASE}/admin/reports/${reportId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch report detail');
    return await res.json();
  },

  async getAdminAnnouncements(token: string) {
    const res = await fetch(`${API_BASE}/admin/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch announcements');
    return await res.json();
  },

  async createAdminAnnouncement(token: string, payload: any) {
    const res = await fetch(`${API_BASE}/admin/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create announcement');
    return await res.json();
  },

  async toggleAdminAnnouncementStatus(token: string, announcementId: number, isActive: boolean) {
    const res = await fetch(`${API_BASE}/admin/announcements/${announcementId}/status?is_active=${isActive}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to update announcement status');
    return await res.json();
  },

  async getAdminAuditLogs(token: string, targetEntity?: string, action?: string) {
    const params = new URLSearchParams();
    if (targetEntity) params.append('target_entity', targetEntity);
    if (action) params.append('action', action);
    const res = await fetch(`${API_BASE}/admin/audit-logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return await res.json();
  },

  async getAdminSettings(token: string) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  },

  async updateAdminSettings(token: string, settings: any) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return await res.json();
  },

  async getAdminSecurityStatus(token: string) {
    const res = await fetch(`${API_BASE}/admin/security-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch security status');
    return await res.json();
  },

  async getActiveAnnouncements(token: string) {
    const res = await fetch(`${API_BASE}/admin/public/active-announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  }
};
