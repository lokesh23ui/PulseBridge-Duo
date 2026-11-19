import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMonitoring } from '../context/MonitoringContext';
import { ConfigurationSelector } from '../components/ConfigurationSelector';
import { RingCanvas3D } from '../three/RingCanvas3D';
import { WatchCanvas3D } from '../three/WatchCanvas3D';
import { DualDeviceCanvas3D } from '../three/DualDeviceCanvas3D';
import { 
  ArrowRight, CircleDot, Watch, Layers, Check, ShieldCheck, 
  Zap, Radio, Wifi, WifiOff, RefreshCw, Sparkles, CheckCircle2, AlertCircle 
} from 'lucide-react';

type PairingState = 'AVAILABLE' | 'PAIRING' | 'CONNECTED' | 'DISCONNECTED';

export const DevicesExplorerPage: React.FC = () => {
  const { 
    activeConfiguration, 
    setConfiguration, 
    latestReading,
    dualSnapshot,
    injectWokwiPayload 
  } = useMonitoring();

  // Interactive device preview connection state
  const [ringState, setRingState] = useState<PairingState>('CONNECTED');
  const [watchState, setWatchState] = useState<PairingState>('CONNECTED');
  const [pairingProgress, setPairingProgress] = useState<number>(100);
  const [isPairing, setIsPairing] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleStartPairing = (targetDevice: 'ring' | 'watch' | 'both') => {
    setIsPairing(true);
    setPairingProgress(0);
    setStatusNotice(`Initiating interactive pairing preview for ${targetDevice.toUpperCase()}...`);

    const interval = setInterval(() => {
      setPairingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPairing(false);
          if (targetDevice === 'ring') setRingState('CONNECTED');
          if (targetDevice === 'watch') setWatchState('CONNECTED');
          if (targetDevice === 'both') {
            setRingState('CONNECTED');
            setWatchState('CONNECTED');
          }
          setStatusNotice(`Preview Connected: Virtual telemetry channel established.`);
          setTimeout(() => setStatusNotice(null), 3500);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleDisconnect = (targetDevice: 'ring' | 'watch') => {
    if (targetDevice === 'ring') setRingState('DISCONNECTED');
    if (targetDevice === 'watch') setWatchState('DISCONNECTED');
    setStatusNotice(`${targetDevice === 'ring' ? 'Smart Ring' : 'Smartwatch'} preview disconnected.`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleGenerateSampleReading = async () => {
    const evtId = `PB-EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const hr = 72 + Math.floor(Math.random() * 8);
    const spo2 = 97 + Math.floor(Math.random() * 3);
    const sys = 118 + Math.floor(Math.random() * 8);
    const dia = 78 + Math.floor(Math.random() * 5);
    const glucose = 95 + Math.floor(Math.random() * 10);
    const temp = 36.6 + parseFloat((Math.random() * 0.3).toFixed(1));

    try {
      const payload = {
        event_id: evtId,
        device_id: activeConfiguration === 'ring_only' ? 'PB-RING-01' : activeConfiguration === 'watch_only' ? 'PB-WATCH-01' : 'PB-DUO-01',
        source: activeConfiguration === 'ring_only' ? 'RING_PREVIEW' : activeConfiguration === 'watch_only' ? 'WATCH_PREVIEW' : 'DUAL_PREVIEW',
        simulated: true,
        timestamp: new Date().toISOString(),
        heart_rate_bpm: hr,
        spo2_percent: spo2,
        bp_systolic_mmhg: sys,
        bp_diastolic_mmhg: dia,
        glucose_mg_dl: glucose,
        temperature_c: temp,
        activity_percent: 44,
        status: "PREVIEW_DATA"
      };
      await injectWokwiPayload(payload);
      setStatusNotice(`Fresh illustrative reading generated (${evtId}). Dashboard updated.`);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err: any) {
      setStatusNotice(`Failed to generate reading: ${err.message}`);
    }
  };

  const comparisonRows = [
    {
      feature: "Form Factor & Ergonomics",
      ring: "Minimalist Grade 5 Titanium band (4.2g). Unobtrusive 24/7 wear.",
      watch: "1.4\" AMOLED touchscreen with aluminum chassis and fluoroelastomer strap."
    },
    {
      feature: "Battery Endurance",
      ring: "4 to 7 days continuous tracking on a single magnetic dock charge.",
      watch: "24 to 36 hours with active display and multi-sensor sampling."
    },
    {
      feature: "Sensor Suite",
      ring: "Triple-wavelength optical PPG, digital skin thermistor, 3-axis accelerometer.",
      watch: "Multi-channel circular PPG cluster, 6-axis IMU (gyro + accel), skin thermistor."
    },
    {
      feature: "User Interface & Feedback",
      ring: "Screenless design with micro-LED status light and app synchronization.",
      watch: "Full-color capacitive AMOLED display with tactile digital crown and rotary navigation."
    },
    {
      feature: "Primary Use Scenario",
      ring: "Nocturnal sleep architecture, baseline vital tracking, unobtrusive daily wear.",
      watch: "Active workouts, high-intensity exercise, real-time alert notifications."
    },
    {
      feature: "Dual Configuration Role",
      ring: "Provides finger microvascular reference stream for motion artifact cross-checking.",
      watch: "Provides wrist motion compensation and immediate visual feedback to the user."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header & Configuration Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-mono font-semibold">
            WEARABLE ECOSYSTEM PREVIEW
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Wearable Hardware
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            Select your wearable configuration below. The PulseBridge platform adapts its telemetry ingestion and 
            visualization to whichever devices are active in preview mode.
          </p>
        </div>

        {/* Global Configuration Switcher */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold">
            Active Preview Configuration
          </span>
          <ConfigurationSelector
            currentConfig={activeConfiguration}
            onChange={setConfiguration}
          />
        </div>
      </div>

      {/* Interactive Device Preview Pairing Studio */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-teal-600" />
              Interactive Device Preview & Telemetry Pairing
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Experience the proposed pairing lifecycle and stream illustrative telemetry into the monitoring dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateSampleReading}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Generate Reading
            </button>
          </div>
        </div>

        {/* Pairing Status Banner */}
        {statusNotice && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {isPairing && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-teal-700 font-bold">Establishing Virtual Telemetry Channel...</span>
              <span className="text-slate-600">{pairingProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                style={{ width: `${pairingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Device Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Smart Ring Profile Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <CircleDot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">PulseBridge Smart Ring</h4>
                  <span className="text-xs text-slate-500 font-mono">Finger Microvascular PPG</span>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                ringState === 'CONNECTED' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {ringState === 'CONNECTED' ? 'Preview Connected' : 'Disconnected'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Supported parameters: Heart Rate (bpm), SpO2 Saturation (%), Nocturnal Temperature, Motion Index.
            </p>

            <div className="pt-2 flex items-center gap-2">
              {ringState === 'CONNECTED' ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect('ring')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition cursor-pointer"
                >
                  Disconnect Preview
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartPairing('ring')}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Connect Preview
                </button>
              )}
              <Link to="/devices/ring" className="text-xs font-semibold text-teal-700 hover:text-teal-800 ml-auto flex items-center gap-1">
                Explore 3D Model <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Smartwatch Profile Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700">
                  <Watch className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">PulseBridge Smartwatch</h4>
                  <span className="text-xs text-slate-500 font-mono">Wrist Optical Cluster + AMOLED</span>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                watchState === 'CONNECTED' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {watchState === 'CONNECTED' ? 'Preview Connected' : 'Disconnected'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Supported parameters: Heart Rate (bpm), SpO2 Saturation (%), Blood Pressure Trend, AMOLED Vitals, Activity Steps.
            </p>

            <div className="pt-2 flex items-center gap-2">
              {watchState === 'CONNECTED' ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect('watch')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition cursor-pointer"
                >
                  Disconnect Preview
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartPairing('watch')}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Connect Preview
                </button>
              )}
              <Link to="/devices/watch" className="text-xs font-semibold text-teal-700 hover:text-teal-800 ml-auto flex items-center gap-1">
                Explore 3D Model <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic 3D Display based on selection */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <h3 className="font-bold text-sm sm:text-base font-mono">
              {activeConfiguration === 'ring_only' && 'PulseBridge Smart Ring (Solo Configuration)'}
              {activeConfiguration === 'watch_only' && 'PulseBridge Smartwatch (Solo Configuration)'}
              {activeConfiguration === 'both' && 'PulseBridge Duo (Synchronized Dual Configuration)'}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Rotate: Left Click · Zoom: Wheel · Pan: Right Click
          </span>
        </div>

        <div className="h-[460px] pt-4">
          {activeConfiguration === 'ring_only' && (
            <RingCanvas3D autoRotate={true} showLabels={true} />
          )}
          {activeConfiguration === 'watch_only' && (
            <WatchCanvas3D autoRotate={true} showLabels={true} />
          )}
          {activeConfiguration === 'both' && (
            <DualDeviceCanvas3D autoRotate={true} />
          )}
        </div>
      </div>

      {/* Comprehensive Comparison Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Comparative Hardware Specification Matrix</h3>
          <span className="text-xs font-mono text-slate-500">Engineering Concept Architecture</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 font-mono text-slate-700 uppercase">
                <th className="py-3.5 px-6 font-semibold">Specification</th>
                <th className="py-3.5 px-6 font-semibold text-blue-800">PulseBridge Ring</th>
                <th className="py-3.5 px-6 font-semibold text-teal-800">PulseBridge Watch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">{row.feature}</td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">{row.ring}</td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">{row.watch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
