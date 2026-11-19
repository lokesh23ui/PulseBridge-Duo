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
  }
};
