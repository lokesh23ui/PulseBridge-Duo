export type DeviceConfiguration = 'ring_only' | 'watch_only' | 'both';

export type SimulationSource = 
  | 'RING_SIMULATOR'
  | 'WATCH_SIMULATOR'
  | 'DUAL_SIMULATION'
  | 'WOKWI_SIMULATION'
  | 'DEMO_GENERATOR';

export type AlertSeverity = 'NORMAL' | 'ATTENTION' | 'WARNING' | 'CRITICAL';

export interface SensorReading {
  reading_id: string;
  timestamp: string;
  source: SimulationSource;
  simulated: boolean;
  device_id: string;
  device_type: 'ring' | 'watch' | 'both' | 'esp32_gateway';
  configuration?: DeviceConfiguration;
  heart_rate_bpm?: number | null;
  spo2_percent?: number | null;
  bp_systolic_mmhg?: number | null;
  bp_diastolic_mmhg?: number | null;
  glucose_mg_dl?: number | null;
  temperature_c?: number | null;
  temperature_source?: 'skin' | 'ambient';
  humidity_percent?: number | null;
  activity_percent?: number | null;
  signal_quality: number;
  battery_percent?: number | null;
  connection_state: 'connected' | 'degraded' | 'disconnected';
  demo_status: AlertSeverity;
}

export interface HealthAlert {
  alert_id: string;
  reading_id?: string;
  parameter: string;
  value: number;
  unit: string;
  rule_triggered: string;
  severity: AlertSeverity;
  timestamp: string;
  source: string;
  device_id: string;
  signal_quality: number;
  verification_instruction: string;
  acknowledged: boolean;
  acknowledged_at?: string | null;
}

export interface DeviceInfo {
  device_id: string;
  device_type: 'ring' | 'watch' | 'both' | 'esp32_gateway';
  name: string;
  status: 'connected' | 'degraded' | 'disconnected';
  battery_percent: number;
  signal_quality: number;
  firmware_version: string;
  last_seen: string;
}

export interface ThresholdConfig {
  hr_low: number;
  hr_high_warning: number;
  hr_high_critical: number;
  spo2_low_warning: number;
  spo2_low_critical: number;
  bp_systolic_attention: number;
  bp_systolic_warning: number;
  bp_diastolic_attention: number;
  bp_diastolic_warning: number;
  glucose_attention: number;
  glucose_warning: number;
  temp_skin_warning: number;
  temp_ambient_attention: number;
  min_signal_quality_threshold: number;
}
