import { SensorReading, DeviceConfiguration, SimulationSource, AlertSeverity } from '../types/telemetry';
import { SIMULATION_SCENARIOS, SimulationScenario } from '../types/scenarios';

export interface DualStreamSnapshot {
  timestamp: string;
  ring: SensorReading | null;
  watch: SensorReading | null;
  heartRateDiff: number | null;
  readingCompatibility: 'HIGH_CONFIDENCE' | 'MODERATE_DIVERGENCE' | 'SINGLE_DEVICE_MODE' | 'LOW_SIGNAL_QUALITY';
  notes: string;
}

/**
 * Calculates synthetic PPG waveform amplitude at phase t (0 to 1).
 * Models physiological photoplethysmogram:
 * 1. Steep systolic rise to peak ~0.2
 * 2. Rapid fall to dicrotic notch ~0.4
 * 3. Secondary diastolic wave ~0.55
 * 4. Exponential baseline decay
 */
export function calculatePPGValue(phase: number, noiseLevel: number = 0.05): number {
  const t = phase % 1.0;
  let cleanValue = 0;

  if (t < 0.22) {
    // Systolic upstroke (Gaussian peak)
    cleanValue = Math.exp(-Math.pow((t - 0.2) / 0.08, 2)) * 1.0;
  } else if (t < 0.38) {
    // Systolic descent towards dicrotic notch
    cleanValue = 0.65 * Math.exp(-Math.pow((t - 0.22) / 0.12, 2));
  } else if (t < 0.58) {
    // Dicrotic notch and secondary wave
    const dicrotic = 0.35 * Math.exp(-Math.pow((t - 0.5) / 0.09, 2));
    cleanValue = 0.2 + dicrotic;
  } else {
    // Diastolic runoff
    cleanValue = 0.2 * Math.exp(-(t - 0.58) * 4.5);
  }

  // Add random high-frequency motion/optical noise
  const noise = (Math.random() - 0.5) * noiseLevel;
  return Math.max(0, Math.min(1.2, cleanValue + noise));
}

export class WearableSimulationEngine {
  private scenario: SimulationScenario = SIMULATION_SCENARIOS[0];
  private isRunning: boolean = false;
  private ringBattery: number = 92;
  private watchBattery: number = 78;
  private ringCharging: boolean = false;
  private watchCharging: boolean = false;
  private ringConnected: boolean = true;
  private watchConnected: boolean = true;
  private tickCounter: number = 0;

  // Custom user overrides for simulator sliders
  public userOverrides: {
    hr?: number;
    spo2?: number;
    activity?: number;
    signalQuality?: number;
  } = {};

  constructor(initialScenarioId: number = 1) {
    this.setScenario(initialScenarioId);
  }

  public setScenario(scenarioId: number) {
    const found = SIMULATION_SCENARIOS.find(s => s.id === scenarioId);
    if (found) {
      this.scenario = found;
      this.ringConnected = found.ringConnected;
      this.watchConnected = found.watchConnected;
      this.userOverrides = {}; // Reset overrides on scenario change
    }
  }

  public getActiveScenario(): SimulationScenario {
    return this.scenario;
  }

  public toggleRingConnection(): boolean {
    this.ringConnected = !this.ringConnected;
    return this.ringConnected;
  }

  public toggleWatchConnection(): boolean {
    this.watchConnected = !this.watchConnected;
    return this.watchConnected;
  }

  public toggleRingCharging(): boolean {
    this.ringCharging = !this.ringCharging;
    return this.ringCharging;
  }

  public toggleWatchCharging(): boolean {
    this.watchCharging = !this.watchCharging;
    return this.watchCharging;
  }

  public getRingBattery(): number {
    return Math.round(this.ringBattery);
  }

  public getWatchBattery(): number {
    return Math.round(this.watchBattery);
  }

  public isRingOnline(): boolean {
    return this.ringConnected;
  }

  public isWatchOnline(): boolean {
    return this.watchConnected;
  }

  /**
   * Generates a step reading for PulseBridge Ring
   */
  public generateRingReading(): SensorReading | null {
    if (!this.ringConnected) {
      return null;
    }

    this.tickCounter++;
    // Subtle battery drain or charge
    if (this.ringCharging) {
      this.ringBattery = Math.min(100, this.ringBattery + 0.1);
    } else {
      this.ringBattery = Math.max(1, this.ringBattery - 0.005);
    }

    const s = this.scenario;
    // Micro physiological respiratory sinus arrhythmia oscillation
    const hrWander = Math.sin(this.tickCounter * 0.3) * 1.5;
    const baseHR = this.userOverrides.hr ?? s.ringHR;
    const currentHR = Math.max(40, Math.min(200, Math.round((baseHR + hrWander) * 10) / 10));

    const baseSpo2 = this.userOverrides.spo2 ?? s.spo2;
    const currentSpo2 = baseSpo2 !== null 
      ? Math.max(70, Math.min(100, Math.round((baseSpo2 + (Math.random() - 0.5) * 0.4) * 10) / 10)) 
      : null;

    const baseSig = this.userOverrides.signalQuality ?? s.signalQualityRing;
    const currentSig = Math.max(0.05, Math.min(1.0, Math.round((baseSig + (Math.random() - 0.5) * 0.04) * 100) / 100));

    const activity = this.userOverrides.activity ?? s.activity;

    return {
      reading_id: `ring-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      source: 'RING_SIMULATOR',
      simulated: true,
      device_id: 'PB-RING-01',
      device_type: 'ring',
      configuration: 'ring_only',
      heart_rate_bpm: currentHR,
      spo2_percent: currentSpo2,
      bp_systolic_mmhg: null, // Ring does not estimate BP in raw mode
      bp_diastolic_mmhg: null,
      glucose_mg_dl: null,    // Ring does not measure glucose
      temperature_c: s.skinTemp !== null ? Math.round((s.skinTemp + (Math.random() - 0.5) * 0.1) * 10) / 10 : null,
      temperature_source: 'skin',
      humidity_percent: null,
      activity_percent: activity,
      signal_quality: currentSig,
      battery_percent: Math.round(this.ringBattery),
      connection_state: currentSig < 0.4 ? 'degraded' : 'connected',
      demo_status: s.expectedStatus
    };
  }

  /**
   * Generates a step reading for PulseBridge Watch
   */
  public generateWatchReading(): SensorReading | null {
    if (!this.watchConnected) {
      return null;
    }

    if (this.watchCharging) {
      this.watchBattery = Math.min(100, this.watchBattery + 0.2);
    } else {
      this.watchBattery = Math.max(1, this.watchBattery - 0.012);
    }

    const s = this.scenario;
    const hrWander = Math.cos(this.tickCounter * 0.3) * 1.8;
    const baseHR = this.userOverrides.hr ?? s.watchHR;
    const currentHR = Math.max(40, Math.min(200, Math.round((baseHR + hrWander) * 10) / 10));

    const baseSpo2 = this.userOverrides.spo2 ?? s.spo2;
    const currentSpo2 = baseSpo2 !== null 
      ? Math.max(70, Math.min(100, Math.round((baseSpo2 + (Math.random() - 0.5) * 0.5) * 10) / 10)) 
      : null;

    const baseSig = this.userOverrides.signalQuality ?? s.signalQualityWatch;
    const currentSig = Math.max(0.05, Math.min(1.0, Math.round((baseSig + (Math.random() - 0.5) * 0.05) * 100) / 100));

    const activity = this.userOverrides.activity ?? s.activity;

    return {
      reading_id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      source: 'WATCH_SIMULATOR',
      simulated: true,
      device_id: 'PB-WATCH-01',
      device_type: 'watch',
      configuration: 'watch_only',
      heart_rate_bpm: currentHR,
      spo2_percent: currentSpo2,
      bp_systolic_mmhg: s.bpSystolic ? Math.round(s.bpSystolic + (Math.random() - 0.5) * 2) : null,
      bp_diastolic_mmhg: s.bpDiastolic ? Math.round(s.bpDiastolic + (Math.random() - 0.5) * 2) : null,
      glucose_mg_dl: s.glucose ? Math.round(s.glucose + (Math.random() - 0.5) * 3) : null,
      temperature_c: s.skinTemp !== null ? Math.round((s.skinTemp + (Math.random() - 0.5) * 0.1) * 10) / 10 : null,
      temperature_source: 'skin',
      humidity_percent: null,
      activity_percent: activity,
      signal_quality: currentSig,
      battery_percent: Math.round(this.watchBattery),
      connection_state: currentSig < 0.4 ? 'degraded' : 'connected',
      demo_status: s.expectedStatus
    };
  }

  /**
   * Generates a synchronized dual-stream comparison snapshot
   */
  public generateDualSnapshot(): DualStreamSnapshot {
    const ring = this.generateRingReading();
    const watch = this.generateWatchReading();

    let diff: number | null = null;
    let compatibility: DualStreamSnapshot['readingCompatibility'] = 'SINGLE_DEVICE_MODE';
    let notes = '';

    if (ring && watch && ring.heart_rate_bpm && watch.heart_rate_bpm) {
      diff = Math.round(Math.abs(ring.heart_rate_bpm - watch.heart_rate_bpm) * 10) / 10;
      if (ring.signal_quality < 0.4 || watch.signal_quality < 0.4) {
        compatibility = 'LOW_SIGNAL_QUALITY';
        notes = 'Signal quality degraded on one or more wearables. Readings show heightened uncertainty.';
      } else if (diff <= 5.0) {
        compatibility = 'HIGH_CONFIDENCE';
        notes = `Readings align within standard physiological tolerance (Δ ${diff} bpm). High dual-sensor confidence.`;
      } else {
        compatibility = 'MODERATE_DIVERGENCE';
        notes = `Readings diverge by ${diff} bpm. May indicate finger vs wrist perfusion lag or motion artifact.`;
      }
    } else if (ring && !watch) {
      compatibility = 'SINGLE_DEVICE_MODE';
      notes = 'Watch is offline. Platform successfully maintaining ring telemetry stream.';
    } else if (!ring && watch) {
      compatibility = 'SINGLE_DEVICE_MODE';
      notes = 'Ring is offline. Platform successfully maintaining watch telemetry stream.';
    } else {
      compatibility = 'SINGLE_DEVICE_MODE';
      notes = 'Both wearables are disconnected.';
    }

    return {
      timestamp: new Date().toISOString(),
      ring,
      watch,
      heartRateDiff: diff,
      readingCompatibility: compatibility,
      notes
    };
  }

  /**
   * Generates a unified platform reading (for Live Dashboard)
   */
  public generateUnifiedReading(config: DeviceConfiguration = 'both'): SensorReading {
    const snapshot = this.generateDualSnapshot();
    const s = this.scenario;

    if (config === 'ring_only' && snapshot.ring) {
      return snapshot.ring;
    }
    if (config === 'watch_only' && snapshot.watch) {
      return snapshot.watch;
    }

    // Dual mode unified reading
    const ring = snapshot.ring;
    const watch = snapshot.watch;

    // Transparent selection: prefer higher signal quality or display both
    const activeStream = (ring && watch)
      ? (ring.signal_quality >= watch.signal_quality ? ring : watch)
      : (ring || watch);

    const hr = activeStream?.heart_rate_bpm ?? 72;
    const spo2 = activeStream?.spo2_percent ?? 98;
    const sig = activeStream?.signal_quality ?? 0.95;

    return {
      reading_id: `dual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      source: 'DUAL_SIMULATION',
      simulated: true,
      device_id: 'PB-DUAL-01',
      device_type: 'both',
      configuration: 'both',
      heart_rate_bpm: hr,
      spo2_percent: s.spo2 !== null ? spo2 : null,
      bp_systolic_mmhg: s.bpSystolic ? Math.round(s.bpSystolic + (Math.random() - 0.5) * 2) : null,
      bp_diastolic_mmhg: s.bpDiastolic ? Math.round(s.bpDiastolic + (Math.random() - 0.5) * 2) : null,
      glucose_mg_dl: s.glucose ? Math.round(s.glucose + (Math.random() - 0.5) * 2) : null,
      temperature_c: s.skinTemp ? Math.round((s.skinTemp + (Math.random() - 0.5) * 0.1) * 10) / 10 : null,
      temperature_source: 'skin',
      humidity_percent: s.humidity,
      activity_percent: s.activity,
      signal_quality: sig,
      battery_percent: Math.min(Math.round(this.ringBattery), Math.round(this.watchBattery)),
      connection_state: (this.ringConnected || this.watchConnected) ? 'connected' : 'disconnected',
      demo_status: s.expectedStatus
    };
  }
}
