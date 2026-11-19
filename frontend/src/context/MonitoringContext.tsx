import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  SensorReading, HealthAlert, DeviceInfo, ThresholdConfig, 
  DeviceConfiguration, SimulationSource, AlertSeverity 
} from '../types/telemetry';
import { SIMULATION_SCENARIOS, SimulationScenario } from '../types/scenarios';
import { WearableSimulationEngine, DualStreamSnapshot } from '../services/simulationEngine';
import { api } from '../services/api';

interface MonitoringContextType {
  activeConfiguration: DeviceConfiguration;
  setConfiguration: (config: DeviceConfiguration) => void;
  simulationMode: 'demo' | 'ring' | 'watch' | 'dual' | 'wokwi' | 'hardware';
  setSimulationMode: (mode: 'demo' | 'ring' | 'watch' | 'dual' | 'wokwi' | 'hardware') => void;
  activeScenarioId: number;
  activeScenario: SimulationScenario;
  setScenario: (scenarioId: number) => void;
  isSimulating: boolean;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  latestReading: SensorReading | null;
  recentReadings: SensorReading[];
  dualSnapshot: DualStreamSnapshot | null;
  alerts: HealthAlert[];
  devices: DeviceInfo[];
  thresholds: ThresholdConfig;
  engine: WearableSimulationEngine;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  clearAllAlerts: () => Promise<void>;
  updateThresholds: (newThresholds: ThresholdConfig) => Promise<void>;
  injectWokwiPayload: (payload: Record<string, any>) => Promise<any>;
  toggleDeviceConnection: (device: 'ring' | 'watch') => boolean;
  toggleDeviceCharging: (device: 'ring' | 'watch') => boolean;
  setUserOverrides: (overrides: { hr?: number; spo2?: number; activity?: number; signalQuality?: number }) => void;
}

const MonitoringContext = createContext<MonitoringContextType | null>(null);

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeConfiguration, setConfiguration] = useState<DeviceConfiguration>('both');
  const [simulationMode, setSimulationMode] = useState<'demo' | 'ring' | 'watch' | 'dual' | 'wokwi' | 'hardware'>('demo');
  const [activeScenarioId, setActiveScenarioId] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([]);
  const [dualSnapshot, setDualSnapshot] = useState<DualStreamSnapshot | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdConfig>({
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
  });

  const engineRef = useRef<WearableSimulationEngine>(new WearableSimulationEngine(1));
  const simIntervalRef = useRef<number | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const initData = async () => {
      const devList = await api.getDevices();
      setDevices(devList);

      const alertList = await api.getAlerts();
      setAlerts(alertList);

      const config = await api.getConfiguration();
      setThresholds(config);

      const historyData = await api.getHistory(6);
      if (historyData.readings && historyData.readings.length > 0) {
        setRecentReadings(historyData.readings.slice(-30));
        setLatestReading(historyData.readings[historyData.readings.length - 1]);
      }
    };
    initData();
  }, []);

  // Scenario change handler
  const setScenario = useCallback((scenarioId: number) => {
    setActiveScenarioId(scenarioId);
    engineRef.current.setScenario(scenarioId);
  }, []);

  const setUserOverrides = useCallback((overrides: { hr?: number; spo2?: number; activity?: number; signalQuality?: number }) => {
    engineRef.current.userOverrides = { ...engineRef.current.userOverrides, ...overrides };
  }, []);

  const toggleDeviceConnection = useCallback((device: 'ring' | 'watch') => {
    if (device === 'ring') return engineRef.current.toggleRingConnection();
    return engineRef.current.toggleWatchConnection();
  }, []);

  const toggleDeviceCharging = useCallback((device: 'ring' | 'watch') => {
    if (device === 'ring') return engineRef.current.toggleRingCharging();
    return engineRef.current.toggleWatchCharging();
  }, []);

  // Main simulation heartbeat loop (fires every 2.5 seconds)
  useEffect(() => {
    if (!isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      return;
    }

    simIntervalRef.current = window.setInterval(async () => {
      const eng = engineRef.current;
      const snapshot = eng.generateDualSnapshot();
      setDualSnapshot(snapshot);

      let reading: SensorReading;
      if (simulationMode === 'ring') {
        const r = eng.generateRingReading();
        if (!r) return;
        reading = r;
      } else if (simulationMode === 'watch') {
        const w = eng.generateWatchReading();
        if (!w) return;
        reading = w;
      } else {
        reading = eng.generateUnifiedReading(activeConfiguration);
      }

      setLatestReading(reading);
      setRecentReadings(prev => [...prev.slice(-49), reading]);

      // Post to backend to trigger alert engine & persistence
      try {
        await api.postSensorData(reading);
        // Refresh alerts periodically
        const updatedAlerts = await api.getAlerts();
        setAlerts(updatedAlerts);
      } catch (err) {
        // Fallback local evaluation if backend is momentarily unreachable
        if (reading.spo2_percent && reading.spo2_percent < thresholds.spo2_low_critical) {
          const fallbackAlert: HealthAlert = {
            alert_id: `alert-local-${Date.now()}`,
            parameter: 'Oxygen Saturation (SpO2)',
            value: reading.spo2_percent,
            unit: '%',
            rule_triggered: `SpO2 ${reading.spo2_percent}% < Critical Threshold (${thresholds.spo2_low_critical}%)`,
            severity: 'CRITICAL',
            timestamp: reading.timestamp,
            source: reading.source,
            device_id: reading.device_id,
            signal_quality: reading.signal_quality,
            verification_instruction: 'Hypoxia demonstration triggered. Verify sensor fit and confirm with a clinical pulse oximeter.',
            acknowledged: false
          };
          setAlerts(prev => [fallbackAlert, ...prev.slice(0, 20)]);
        }
      }
    }, 2500);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, simulationMode, activeConfiguration, thresholds]);

  const startSimulation = useCallback(() => setIsSimulating(true), []);
  const pauseSimulation = useCallback(() => setIsSimulating(false), []);
  const resetSimulation = useCallback(async () => {
    engineRef.current.setScenario(1);
    setActiveScenarioId(1);
    await api.resetPlatform().catch(() => {});
    const r = engineRef.current.generateUnifiedReading(activeConfiguration);
    setLatestReading(r);
    setRecentReadings([r]);
    setAlerts([]);
  }, [activeConfiguration]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId);
    } catch {
      // Local optimistic update
    }
    setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a));
  }, []);

  const clearAllAlerts = useCallback(async () => {
    try {
      await api.clearAlerts();
    } catch {}
    setAlerts([]);
  }, []);

  const updateThresholds = useCallback(async (newThresholds: ThresholdConfig) => {
    try {
      await api.updateConfiguration(newThresholds);
    } catch {}
    setThresholds(newThresholds);
  }, []);

  const injectWokwiPayload = useCallback(async (payload: Record<string, any>) => {
    const res = await api.postSensorData(payload);
    // Refresh alerts and latest
    const latest = await api.getLatestReading();
    if (latest) setLatestReading(latest);
    const updatedAlerts = await api.getAlerts();
    setAlerts(updatedAlerts);
    return res;
  }, []);

  const activeScenario = SIMULATION_SCENARIOS.find(s => s.id === activeScenarioId) || SIMULATION_SCENARIOS[0];

  return (
    <MonitoringContext.Provider
      value={{
        activeConfiguration,
        setConfiguration,
        simulationMode,
        setSimulationMode,
        activeScenarioId,
        activeScenario,
        setScenario,
        isSimulating,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        latestReading,
        recentReadings,
        dualSnapshot,
        alerts,
        devices,
        thresholds,
        engine: engineRef.current,
        acknowledgeAlert,
        clearAllAlerts,
        updateThresholds,
        injectWokwiPayload,
        toggleDeviceConnection,
        toggleDeviceCharging,
        setUserOverrides
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};
