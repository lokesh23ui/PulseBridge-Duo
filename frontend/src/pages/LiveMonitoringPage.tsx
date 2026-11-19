import React, { useState } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { MetricCard } from '../components/MetricCard';
import { HealthAlertPanel } from '../components/HealthAlertPanel';
import { ThresholdsModal } from '../components/ThresholdsModal';
import { DeviceStatusCard } from '../components/DeviceStatusCard';
import { ConfigurationSelector } from '../components/ConfigurationSelector';
import { 
  Heart, Activity, Droplets, Thermometer, Wind, Zap, 
  Sliders, Send, RefreshCw, Cpu, Layers, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export const LiveMonitoringPage: React.FC = () => {
  const {
    activeConfiguration,
    setConfiguration,
    simulationMode,
    setSimulationMode,
    latestReading,
    recentReadings,
    alerts,
    devices,
    thresholds,
    acknowledgeAlert,
    clearAllAlerts,
    updateThresholds,
    injectWokwiPayload,
    toggleDeviceConnection,
    engine
  } = useMonitoring();

  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [injectStatus, setInjectStatus] = useState<string | null>(null);

  // Extract history series for sparklines
  const hrHistory = recentReadings.map(r => r.heart_rate_bpm ?? null);
  const spo2History = recentReadings.map(r => r.spo2_percent ?? null);
  const bpSysHistory = recentReadings.map(r => r.bp_systolic_mmhg ?? null);
  const bpDiaHistory = recentReadings.map(r => r.bp_diastolic_mmhg ?? null);
  const glucoseHistory = recentReadings.map(r => r.glucose_mg_dl ?? null);
  const tempHistory = recentReadings.map(r => r.temperature_c ?? null);
  const humidityHistory = recentReadings.map(r => r.humidity_percent ?? null);
  const activityHistory = recentReadings.map(r => r.activity_percent ?? null);

  const handleQuickWokwiInject = async () => {
    setInjectStatus("Submitting canonical Wokwi ESP32 payload...");
    try {
      const canonical = {
        device_id: "PB-ESP32-01",
        source: "WOKWI_SIMULATION",
        simulated: true,
        heart_rate_bpm: 104,
        spo2_percent: 86,
        bp_systolic_mmhg: 131,
        bp_diastolic_mmhg: 89,
        glucose_mg_dl: 182,
        temperature_c: 36.8,
        humidity_percent: 45.0,
        activity_percent: 45,
        demo_status: "REVIEW"
      };
      await injectWokwiPayload(canonical);
      setInjectStatus("Canonical Wokwi payload successfully ingested! Alert evaluated.");
      setTimeout(() => setInjectStatus(null), 4000);
    } catch (e: any) {
      setInjectStatus(`Ingestion error: ${e.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner & Stream Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              REAL-TIME CLINICAL TELEMETRY STREAM
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Live Health Monitoring Dashboard
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Continuous multi-parameter surveillance with rule-based physiological risk detection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleQuickWokwiInject}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 font-mono text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              Inject Sample Wokwi Payload
            </button>

            <button
              type="button"
              onClick={() => setIsThresholdModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Sliders className="w-4 h-4" />
              Demo Thresholds
            </button>
          </div>
        </div>

        {injectStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>{injectStatus}</span>
          </div>
        )}

        {/* Data Source & Configuration Toggles */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Source Selector */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-mono text-slate-500 uppercase font-semibold text-[11px]">
              Active Ingestion Source:
            </span>
            {[
              { id: 'demo', label: 'Demo Generator' },
              { id: 'ring', label: 'Ring Simulator' },
              { id: 'watch', label: 'Watch Simulator' },
              { id: 'dual', label: 'Dual Wearable' },
              { id: 'wokwi', label: 'Wokwi ESP32' },
              { id: 'hardware', label: 'Live Hardware (Reserved)' }
            ].map(src => (
              <button
                key={src.id}
                type="button"
                onClick={() => setSimulationMode(src.id as any)}
                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                  simulationMode === src.id
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          {/* Active Configuration Switch */}
          <ConfigurationSelector
            currentConfig={activeConfiguration}
            onChange={setConfiguration}
          />
        </div>
      </div>

      {/* 8 Vital Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Heart Rate */}
        <MetricCard
          title="Heart Rate"
          value={latestReading?.heart_rate_bpm ? Math.round(latestReading.heart_rate_bpm) : null}
          unit="bpm"
          status={latestReading?.demo_status ?? 'NORMAL'}
          statusLabel={
            (latestReading?.heart_rate_bpm ?? 72) > 130 ? 'Critical Tachycardia' :
            (latestReading?.heart_rate_bpm ?? 72) > 105 ? 'Elevated Heart Rate' :
            (latestReading?.heart_rate_bpm ?? 72) < 50 ? 'Bradycardia' : 'Normal sinus rhythm'
          }
          sourceBadge={latestReading?.source ?? 'SIMULATED'}
          signalQuality={latestReading?.signal_quality}
          history={hrHistory}
          icon={Heart}
        />

        {/* 2. SpO2 Oxygen Saturation */}
        <MetricCard
          title="Oxygen Saturation (SpO2)"
          value={latestReading?.spo2_percent !== null && latestReading?.spo2_percent !== undefined ? latestReading.spo2_percent : null}
          unit="%"
          status={
            (latestReading?.spo2_percent ?? 98) < 90 ? 'CRITICAL' :
            (latestReading?.spo2_percent ?? 98) < 92 ? 'WARNING' : 'NORMAL'
          }
          statusLabel={
            (latestReading?.spo2_percent ?? 98) < 90 ? 'Critical Hypoxia Alert' :
            (latestReading?.spo2_percent ?? 98) < 92 ? 'Low Oxygen Warning' : 'Nominal saturation'
          }
          sourceBadge={latestReading?.source ?? 'SIMULATED'}
          signalQuality={latestReading?.signal_quality}
          history={spo2History}
          icon={Droplets}
        />

        {/* 3. Systolic Blood Pressure */}
        <MetricCard
          title="Systolic BP (Estimate)"
          value={latestReading?.bp_systolic_mmhg ? Math.round(latestReading.bp_systolic_mmhg) : null}
          unit="mmHg"
          status={
            (latestReading?.bp_systolic_mmhg ?? 120) > 160 ? 'WARNING' :
            (latestReading?.bp_systolic_mmhg ?? 120) > 140 ? 'ATTENTION' : 'NORMAL'
          }
          statusLabel={
            (latestReading?.bp_systolic_mmhg ?? 120) > 140 ? 'Elevated Systolic Estimate' : 'Within normal limits'
          }
          isEstimate={true}
          sourceBadge={latestReading?.source ?? 'SIMULATED'}
          history={bpSysHistory}
          icon={Activity}
        />

        {/* 4. Diastolic Blood Pressure */}
        <MetricCard
          title="Diastolic BP (Estimate)"
          value={latestReading?.bp_diastolic_mmhg ? Math.round(latestReading.bp_diastolic_mmhg) : null}
          unit="mmHg"
          status={
            (latestReading?.bp_diastolic_mmhg ?? 80) > 100 ? 'WARNING' :
            (latestReading?.bp_diastolic_mmhg ?? 80) > 90 ? 'ATTENTION' : 'NORMAL'
          }
          statusLabel={
            (latestReading?.bp_diastolic_mmhg ?? 80) > 90 ? 'Elevated Diastolic Estimate' : 'Within normal limits'
          }
          isEstimate={true}
          sourceBadge={latestReading?.source ?? 'SIMULATED'}
          history={bpDiaHistory}
          icon={Activity}
        />

        {/* 5. Blood Glucose */}
        <MetricCard
          title="Blood Glucose (Estimate)"
          value={latestReading?.glucose_mg_dl ? Math.round(latestReading.glucose_mg_dl) : null}
          unit="mg/dL"
          status={
            (latestReading?.glucose_mg_dl ?? 100) > 250 ? 'WARNING' :
            (latestReading?.glucose_mg_dl ?? 100) > 180 ? 'ATTENTION' : 'NORMAL'
          }
          statusLabel={
            (latestReading?.glucose_mg_dl ?? 100) > 180 ? 'Hyperglycemia Placeholder' : 'Within normal limits'
          }
          isEstimate={true}
          sourceBadge={latestReading?.source ?? 'SIMULATED'}
          history={glucoseHistory}
          icon={Activity}
        />

        {/* 6. Temperature */}
        <MetricCard
          title={latestReading?.temperature_source === 'ambient' ? 'Ambient Temperature (DHT22)' : 'Skin Temperature'}
          value={latestReading?.temperature_c ? latestReading.temperature_c : null}
          unit="°C"
          status={
            (latestReading?.temperature_c ?? 36.6) > 37.8 ? 'WARNING' : 'NORMAL'
          }
          statusLabel={
            latestReading?.temperature_source === 'ambient' ? 'External DHT22 sensor' : 'Dermal thermistor'
          }
          sourceBadge={latestReading?.source ?? 'SIMULATED'}
          history={tempHistory}
          icon={Thermometer}
        />

        {/* 7. Humidity */}
        <MetricCard
          title="Ambient Humidity (DHT22)"
          value={latestReading?.humidity_percent ? Math.round(latestReading.humidity_percent) : null}
          unit="%"
          status="NORMAL"
          statusLabel="Environmental DHT22"
          sourceBadge="WOKWI_DHT22"
          history={humidityHistory}
          icon={Wind}
        />

        {/* 8. Activity */}
        <MetricCard
          title="Activity / Relative Motion"
          value={latestReading?.activity_percent ? Math.round(latestReading.activity_percent) : null}
          unit="%"
          status="NORMAL"
          statusLabel="3-Axis Accelerometer"
          sourceBadge={latestReading?.source ?? 'SIMULATED'}
          history={activityHistory}
          icon={Zap}
        />
      </div>

      {/* Two Columns: Health Alerts Feed + Device Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Health Alert Feed */}
        <div className="lg:col-span-8">
          <HealthAlertPanel
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onClearAll={clearAllAlerts}
          />
        </div>

        {/* Device Status Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold font-mono text-slate-700 uppercase tracking-wider">
            Connected Wearable Hardware
          </h3>

          <DeviceStatusCard
            deviceType="ring"
            name="PulseBridge Smart Ring"
            status={engine.isRingOnline() ? 'connected' : 'disconnected'}
            batteryPercent={engine.getRingBattery()}
            signalQuality={latestReading?.signal_quality ?? 0.96}
            onToggleConnection={() => toggleDeviceConnection('ring')}
          />

          <DeviceStatusCard
            deviceType="watch"
            name="PulseBridge Smartwatch"
            status={engine.isWatchOnline() ? 'connected' : 'disconnected'}
            batteryPercent={engine.getWatchBattery()}
            signalQuality={latestReading?.signal_quality ?? 0.94}
            onToggleConnection={() => toggleDeviceConnection('watch')}
          />

          <DeviceStatusCard
            deviceType="esp32_gateway"
            name="ESP32 Wokwi Simulation Gateway"
            status="connected"
            batteryPercent={100}
            signalQuality={0.98}
          />
        </div>
      </div>

      {/* Threshold Modal */}
      <ThresholdsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSave={updateThresholds}
      />
    </div>
  );
};
