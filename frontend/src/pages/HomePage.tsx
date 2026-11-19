import React from 'react';
import { Link } from 'react-router-dom';
import { DualDeviceCanvas3D } from '../three/DualDeviceCanvas3D';
import { useMonitoring } from '../context/MonitoringContext';
import { 
  Activity, ShieldCheck, HeartPulse, Zap, Layers, Cpu, 
  ArrowRight, Radio, BellRing, Sparkles, SlidersHorizontal, CheckCircle2 
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { latestReading, isSimulating } = useMonitoring();

  const capabilities = [
    {
      title: "Continuous Vital Tracking",
      desc: "Monitors heart rate, estimated SpO2, temperature, and motion dynamics with high-frequency temporal granularity.",
      icon: HeartPulse,
      badge: "Core Telemetry"
    },
    {
      title: "Dual-Wearable Correlation",
      desc: "Simultaneously analyzes ring and watch sensor streams to cross-verify signals and detect motion artifacts.",
      icon: Layers,
      badge: "Signature Feature"
    },
    {
      title: "Personalized Alert Engine",
      desc: "Configurable multi-tier risk thresholds (Critical, Warning, Attention) with clinical verification guidance.",
      icon: BellRing,
      badge: "Risk Prevention"
    },
    {
      title: "Virtual IoT Integration",
      desc: "Preserves the canonical ESP32 + DHT22 JSON data contract, allowing hardware emulation or physical microcontrollers.",
      icon: Cpu,
      badge: "IoT Bridge"
    },
    {
      title: "Historical Trend Analysis",
      desc: "Visualizes longitudinal trends using Bézier spline charts across 1h, 6h, 24h, and 7d observation intervals.",
      icon: Activity,
      badge: "Clinical Insights"
    },
    {
      title: "Interactive 3D Visualization",
      desc: "Interactive Three.js WebGL engineering models of the ring (R01-R11) and watch (W01-W15) with animated exploded views.",
      icon: SlidersHorizontal,
      badge: "3D CAD Studio"
    }
  ];

  const pipelineSteps = [
    {
      step: "01",
      name: "Edge Sensing",
      desc: "Optical PPG, 6-axis IMU, and thermal thermistors collect physiological signals at the finger or wrist."
    },
    {
      step: "02",
      name: "Normalization & Bridge",
      desc: "Cloud REST endpoints and WebSocket stream normalize diverse device streams into a unified data contract."
    },
    {
      step: "03",
      name: "Risk Threshold Engine",
      desc: "Biometric readings are evaluated in real time against configurable rules to detect early physiological desaturation or arrhythmia."
    },
    {
      step: "04",
      name: "Connected Care Dashboard",
      desc: "Web dashboard visualizes real-time metrics, synthetic PPG oscilloscopes, and actionable caregiver alerts."
    }
  ];

  return (
    <div className="space-y-16 pb-20 bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-slate-50 text-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping"></span>
                ONE PLATFORM · TWO WEARABLE EXPERIENCES
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
                Two wearables. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600">
                  One intelligent healthcare platform.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                PulseBridge Duo combines a minimalist titanium smart ring with an interactive smartwatch into a 
                unified healthcare monitoring ecosystem. Designed to identify early health risks, visualize vital trends, 
                and provide timely caregiver alerts with full patient privacy control.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/devices"
                  className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  Explore Devices (3D)
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/family"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-sm flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  Family Care Network
                  <HeartPulse className="w-4 h-4 text-teal-600" />
                </Link>

                <Link
                  to="/monitor"
                  className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center gap-2 transition cursor-pointer"
                >
                  Live Dashboard
                  <Activity className="w-4 h-4 text-blue-600" />
                </Link>
              </div>

              {/* Live Status Pill */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Telemetry Stream: Active</span>
                </div>
                <span>·</span>
                <div>Latest Heart Rate: <strong className="text-slate-900">{latestReading?.heart_rate_bpm ?? 72} bpm</strong></div>
                <span>·</span>
                <div>SpO2: <strong className="text-slate-900">{latestReading?.spo2_percent ?? 98}%</strong></div>
              </div>
            </div>

            {/* Right: 3D Dual Device Showcase */}
            <div className="lg:col-span-5 bg-slate-950 p-4 rounded-3xl shadow-xl border border-slate-800">
              <DualDeviceCanvas3D autoRotate={true} />
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Duo Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Tailored Wearability. Unified Analytics.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Wear either device independently or synchronize both simultaneously. The PulseBridge platform adapts seamlessly 
            to your chosen configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Smart Ring Card */}
          <div className="p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                PULSEBRIDGE RING
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">Compact Design. Connected Health.</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Screenless Grade 5 Titanium smart ring engineered for 24/7 continuous wear, nocturnal recovery tracking, and 
                finger-based microvascular optical photoplethysmography.
              </p>

              <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-100 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Battery</span>
                  <strong className="text-slate-900 text-sm">4-7 Days</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Components</span>
                  <strong className="text-slate-900 text-sm">11 (R01-R11)</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Weight</span>
                  <strong className="text-slate-900 text-sm">4.2 Grams</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/devices/ring"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  Inspect Ring 3D
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/monitor"
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Live Monitoring
                </Link>
              </div>
            </div>
          </div>

          {/* Smartwatch Card */}
          <div className="p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                PULSEBRIDGE WATCH
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">Your Connected Health Companion.</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Feature-rich smartwatch featuring a 1.4" AMOLED touchscreen, 6-axis IMU for dynamic motion tracking, 
                and tactile digital crown interaction for active daywear.
              </p>

              <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-100 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Display</span>
                  <strong className="text-slate-900 text-sm">1.4" AMOLED</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Components</span>
                  <strong className="text-slate-900 text-sm">15 (W01-W15)</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Motion</span>
                  <strong className="text-slate-900 text-sm">6-Axis IMU</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/devices/watch"
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  Inspect Watch 3D
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/monitor"
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Live Monitoring
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Platform Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
            PLATFORM CAPABILITIES
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Six Pillars of Connected Telemetry
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Engineered to handle sensor ingestion, evaluate early health warnings, and present actionable insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div key={i} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{cap.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* End-to-End Pipeline */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200 text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-teal-700 font-bold">
              System Architecture Flow
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              End-to-End Ingestion & Processing Pipeline
            </h2>
            <p className="text-slate-600 text-sm">
              From microscopic optical photons to live caregiver risk advisories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {pipelineSteps.map((step, idx) => (
              <div key={idx} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 relative">
                <span className="text-2xl font-black font-mono text-teal-600 block">
                  {step.step}
                </span>
                <h4 className="font-bold text-base text-slate-900">{step.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-blue-800 text-white shadow-xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to explore the PulseBridge Duo platform?
          </h2>
          <p className="text-teal-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Explore the live 3D models, inspect real-time physiological telemetry, 
            evaluate AFib decision support, and manage family caregiver connections.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/monitor"
              className="px-6 py-3.5 rounded-xl bg-white text-teal-900 hover:bg-slate-100 font-bold text-sm shadow-md transition cursor-pointer"
            >
              Open Live Monitoring
            </Link>
            <Link
              to="/family"
              className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md border border-teal-400 transition cursor-pointer"
            >
              Connect Caregivers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
