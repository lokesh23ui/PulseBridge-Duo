import React from 'react';
import { Link } from 'react-router-dom';
import { useMonitoring } from '../context/MonitoringContext';
import { ConfigurationSelector } from '../components/ConfigurationSelector';
import { RingCanvas3D } from '../three/RingCanvas3D';
import { WatchCanvas3D } from '../three/WatchCanvas3D';
import { DualDeviceCanvas3D } from '../three/DualDeviceCanvas3D';
import { ArrowRight, CircleDot, Watch, Layers, Check, ShieldCheck, Zap } from 'lucide-react';

export const DevicesExplorerPage: React.FC = () => {
  const { activeConfiguration, setConfiguration } = useMonitoring();

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-mono font-semibold">
            HARDWARE EXPLORER
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Wearable Hardware
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            Select your wearable configuration below. The PulseBridge platform adapts its telemetry ingestion and 
            visualization to whichever devices are active.
          </p>
        </div>

        {/* Global Configuration Switcher */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-medium">
            Active Ecosystem Configuration
          </span>
          <ConfigurationSelector
            currentConfig={activeConfiguration}
            onChange={setConfiguration}
          />
        </div>
      </div>

      {/* Dynamic 3D Display based on selection */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
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

      {/* Device Cards Summary & Direct Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ring Card */}
        <div className={`p-6 rounded-3xl border transition-all ${
          activeConfiguration === 'ring_only' || activeConfiguration === 'both'
            ? 'bg-white border-blue-300 shadow-md ring-2 ring-blue-500/10'
            : 'bg-slate-50 border-slate-200 opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <CircleDot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">PulseBridge Ring</h3>
                <span className="text-xs font-mono text-slate-500">11 Concept Components (R01-R11)</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Titanium
            </span>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
            Lightweight, screenless finger-worn device engineered for 24/7 continuous health tracking, 
            recovery metrics, and sleep stage analysis.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/devices/ring"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              Open Ring 3D Explorer
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Watch Card */}
        <div className={`p-6 rounded-3xl border transition-all ${
          activeConfiguration === 'watch_only' || activeConfiguration === 'both'
            ? 'bg-white border-teal-300 shadow-md ring-2 ring-teal-500/10'
            : 'bg-slate-50 border-slate-200 opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
                <Watch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">PulseBridge Watch</h3>
                <span className="text-xs font-mono text-slate-500">15 Concept Components (W01-W15)</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              1.4" AMOLED
            </span>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
            Interactive smartwatch companion with rich haptic and visual interface, 6-axis IMU for motion 
            capture, and tactile side crown.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/devices/watch"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              Open Watch 3D Explorer
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
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
                <th className="py-3.5 px-6 font-semibold text-blue-700">PulseBridge Ring</th>
                <th className="py-3.5 px-6 font-semibold text-teal-700">PulseBridge Watch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">{row.feature}</td>
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
