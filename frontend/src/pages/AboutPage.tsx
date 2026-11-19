import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, Heart, Users, Target, 
  HelpCircle, CheckCircle2, AlertTriangle, ArrowRight, Activity 
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const transparencyRows = [
    {
      category: "Wearable Hardware",
      prototype: "Procedural 3D WebGL engineering models (Three.js). Standalone virtual simulations without physical ring/watch.",
      proposed: "Grade 5 Titanium smart ring (R01-R11) and CNC aluminum smartwatch (W01-W15) with dedicated biometric front-ends."
    },
    {
      category: "Sensor Readings",
      prototype: "Simulated physiological telemetry streams (1 Hz) and external Wokwi ESP32 potentiometer packets.",
      proposed: "Validated continuous sensor acquisition using medical-grade optical photodiode front-ends and I2C buses."
    },
    {
      category: "Blood Pressure & Glucose",
      prototype: "Simulated demonstration placeholders explicitly labelled as estimates. No direct measurement claimed.",
      proposed: "Secondary pulse wave morphology correlation for BP trends; external validated CGM interoperability for glucose."
    },
    {
      category: "Wireless Connectivity",
      prototype: "Simulated BLE link status and WebSocket streaming over local HTTP/WSS. No physical Bluetooth required.",
      proposed: "Encrypted Bluetooth Low Energy 5.3 GATT services pairing with iOS/Android companion apps and cellular hubs."
    },
    {
      category: "Health Risk Alerts",
      prototype: "Configurable demonstration thresholds evaluating synthetic streams to demonstrate notification flows.",
      proposed: "Clinically reviewed multi-parametric alert algorithms with clinician escalation and medical oversight."
    },
    {
      category: "Backend & Data Pipeline",
      prototype: "FastAPI REST server, SQLite database, and WebSocket streaming running locally on development machine.",
      proposed: "HIPAA/GDPR-compliant cloud microservices with end-to-end encryption, audit logs, and FHIR clinical export."
    }
  ];

  const targetUsers = [
    {
      title: "Elderly Individuals",
      desc: "Passive, screenless continuous ring tracking prevents forgetting to wear or charge complex devices.",
      role: "Passive Safety & Night Monitoring"
    },
    {
      title: "Chronic Condition Patients",
      desc: "Individuals managing hypertension, respiratory challenges, or cardiovascular conditions needing trend awareness.",
      role: "Longitudinal Surveillance"
    },
    {
      title: "High-Exertion & Outdoor Workers",
      desc: "Monitors heat stress, ambient DHT22 conditions, and rapid heart rate excursions during heavy labor.",
      role: "Occupational Safety"
    },
    {
      title: "Underserved & Rural Populations",
      desc: "Provides affordable remote tele-monitoring to connect rural patients with distant clinical specialists.",
      role: "Remote Health Access"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="space-y-2 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-mono font-semibold">
          ABOUT & ETHICAL TRANSPARENCY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Prototype Identity, Problem Context & Transparency
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          PulseBridge Duo is an engineering prototype created for wearable healthcare innovation. We believe rigorous 
          honesty about what is implemented versus proposed is essential in medical technology.
        </p>
      </div>

      {/* Problem Statement Card */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-bold">
          The Hackathon Problem Statement
        </span>
        <blockquote className="text-lg sm:text-xl font-medium leading-relaxed italic text-slate-200">
          "Develop an innovative healthcare solution that continuously monitors and assesses health parameters in real time 
          using wearable devices, smart sensors, or connected technologies to identify potential health risks and provide timely alerts."
        </blockquote>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          PulseBridge Duo directly addresses this challenge by providing dual wearable form factors (ring and watch) feeding a 
          shared real-time risk alert pipeline.
        </p>
      </div>

      {/* 6-Tier Transparency Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Implementation Transparency Matrix</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Prototype vs Proposed Production</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 font-mono text-slate-700 uppercase">
                <th className="py-3.5 px-6 font-semibold w-1/4">System Dimension</th>
                <th className="py-3.5 px-6 font-semibold text-blue-700 w-3/8">Current Software Prototype</th>
                <th className="py-3.5 px-6 font-semibold text-emerald-700 w-3/8">Proposed Commercial Product</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transparencyRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800 font-mono">{row.category}</td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">{row.prototype}</td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">{row.proposed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Beneficiaries */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Who It Is Designed to Support</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Focus groups engineered into our dual-wearable architecture.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {targetUsers.map((user, idx) => (
            <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {user.role}
              </span>
              <h4 className="font-bold text-slate-900 text-base">{user.title}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{user.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ethical Engineering Guardrails */}
      <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-950 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-base text-amber-900">Medical & Engineering Truth in Wearable Health</h3>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-amber-900/90 leading-relaxed list-disc list-inside">
          <li><strong>Optical PPG Constraints:</strong> Consumer optical PPG measures microvascular volume changes; it does not replace direct arterial blood pressure measurement or enzymatic blood glucose monitoring.</li>
          <li><strong>Skin vs Core Temperature:</strong> Finger and wrist sensors detect dermal surface temperature, which varies with peripheral blood flow and ambient weather, unlike core internal body temperature.</li>
          <li><strong>DHT22 Environmental Scope:</strong> The DHT22 sensor integrated in the Wokwi hardware emulation measures ambient surrounding air temperature and humidity, not human bodily temperature.</li>
          <li><strong>Prototype Status:</strong> PulseBridge Duo has not undergone FDA 510(k) or CE medical device clearance. All generated readings and alerts are prototype demonstrations.</li>
        </ul>
      </div>
    </div>
  );
};
