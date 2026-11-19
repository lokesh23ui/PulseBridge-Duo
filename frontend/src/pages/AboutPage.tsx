import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, Heart, Users, Target, 
  HelpCircle, CheckCircle2, ArrowRight, Activity, 
  Watch, CircleDot, Lock, BellRing, Sparkles, Sliders
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const pillars = [
    {
      title: "Product Purpose",
      icon: Target,
      tag: "Mission & Clinical Vision",
      desc: "PulseBridge Duo connects patients and their families through continuous health parameter monitoring, proactive physiological alerts, and shared health insights. It bridges the gap between solitary wearable tracking and family-centered clinical care.",
      bullets: [
        "Continuous vital sign monitoring without lifestyle interruption",
        "Peace of mind for caregivers caring for aging parents or chronic illness patients",
        "Early warning of physiological deterioration before acute emergencies occur"
      ]
    },
    {
      title: "Two Wearable Experiences",
      icon: Watch,
      tag: "Form Factor Innovation",
      desc: "Choose between the unobtrusive PulseBridge Smart Ring, the interactive Smartwatch, or wear both simultaneously. Each form factor serves distinct lifestyle and physiological monitoring needs.",
      bullets: [
        "PulseBridge Smart Ring: Lightweight Grade 5 Titanium band engineered for 24/7 sleep tracking and finger microvascular sensing.",
        "PulseBridge Smartwatch: Vibrant AMOLED touchscreen with wrist motion compensation, immediate vital feedback, and optical heart array.",
        "Dual Mode: Simultaneous dual-stream synchronization comparing compatible measurements with independent data integrity."
      ]
    },
    {
      title: "Patient–Caregiver Connectivity",
      icon: Users,
      tag: "Connected Family Health",
      desc: "True independent accounts for both patients and caregivers. A patient owns their medical records, generates secure invitation codes (e.g. PBD-KU7W-M1P4), and approves connection requests with full authority.",
      bullets: [
        "Independent login sessions and personalized dashboards for each role",
        "Cryptographically secure single-use invitation tokens with 48-hour expiration",
        "Support for multiple caregivers (son, daughter, clinician) per patient"
      ]
    },
    {
      title: "Personalized Monitoring & Alerts",
      icon: BellRing,
      tag: "Proactive Risk Prevention",
      desc: "Authorized caregivers can configure patient-specific thresholds for Heart Rate, SpO2, Blood Pressure, Glucose, and Temperature. Rules evaluate continuous telemetry in real time.",
      bullets: [
        "Custom parameter thresholds with configurable persistence duration and cooldown",
        "Instant in-app notification center with real-time badges and read receipts",
        "Alert acknowledgement workflows and automated recovery detection when vitals normalize"
      ]
    },
    {
      title: "Privacy & Granular Permissions",
      icon: Lock,
      tag: "Patient Data Ownership",
      desc: "Patients retain absolute control over who accesses their health information. The platform enforces 7 discrete backend permission categories that can be granted or revoked at any moment.",
      bullets: [
        "7 Granular Permissions: Live vitals, history, trends, device status, medical reports, alert management, acknowledgement",
        "Strict backend authorization: Unrelated caregivers are blocked with 403 Forbidden",
        "Medical report isolation: Diagnostic records remain strictly private unless explicitly authorized"
      ]
    },
    {
      title: "Device Independence & Accessibility",
      icon: Sparkles,
      tag: "Zero-Barrier Platform",
      desc: "PulseBridge Duo remains fully functional even without a connected wearable. Users can manage profiles, invite family, upload medical records, review history, and configure alert rules without hardware constraints.",
      bullets: [
        "No mandatory hardware lock: Full account experience accessible immediately",
        "Interactive 3D Device Preview workflow demonstrates ring and watch capabilities",
        "Transparent distinction between illustrative preview readings and certified measurements"
      ]
    }
  ];

  const transparencyRows = [
    {
      category: "Wearable Hardware",
      evaluation: "Interactive 3D WebGL engineering models (R01-R11 Ring & W01-W15 Watch) with exploded views.",
      commercial: "Grade 5 Titanium smart ring and CNC aerospace aluminum smartwatch with clinical optical front-ends."
    },
    {
      category: "Sensor Acquisition",
      evaluation: "Illustrative physiological streams (1 Hz) and virtual Wokwi ESP32 IoT serial-to-cloud packets.",
      commercial: "Certified medical photodiode arrays with multi-wavelength optical PPG and continuous biometric calibration."
    },
    {
      category: "Blood Pressure & Glucose",
      evaluation: "Preview demonstration indicators explicitly labelled as non-invasive estimates.",
      commercial: "Pulse wave velocity (PWV) morphological trend tracking; interoperability with validated continuous glucose monitors (CGM)."
    },
    {
      category: "Connectivity",
      evaluation: "Virtual telemetry sync over secure WebSocket/HTTP. No physical Bluetooth required.",
      commercial: "Encrypted BLE 5.3 GATT services with background smartphone sync and cellular IoT hub integration."
    },
    {
      category: "Alert Rules & Care",
      evaluation: "Personalized user-configured thresholds triggering in-app caregiver notifications and recovery detection.",
      commercial: "Multi-parametric clinical triage algorithms with SMS/telephony escalation and clinical oversight."
    },
    {
      category: "Privacy & Data Vault",
      evaluation: "Relational database with role-based access control, cryptographic tokens, and 7 granular permission gates.",
      commercial: "HIPAA/GDPR-compliant cloud architecture with end-to-end encryption, audit trails, and FHIR export."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Page Title */}
      <div className="space-y-2 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-mono font-semibold">
          PLATFORM ARCHITECTURE & PRODUCT GUIDE
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About PulseBridge Duo
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          One Intelligent Healthcare Platform. Two Wearable Experiences. Continuous health parameter monitoring, 
          patient-owned caregiver connectivity, and transparent physiological risk detection.
        </p>
      </div>

      {/* 6 Core Product Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div key={idx} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {pillar.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{pillar.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                {pillar.bullets.map((b, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight text-slate-600">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Implementation Transparency Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-slate-900 text-base">Platform Transparency Matrix</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Evaluation Environment vs Commercial Vision</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 font-mono text-slate-700 uppercase">
                <th className="py-3.5 px-6 font-semibold w-1/4">System Dimension</th>
                <th className="py-3.5 px-6 font-semibold text-teal-800 w-3/8">Current Evaluation Software</th>
                <th className="py-3.5 px-6 font-semibold text-blue-800 w-3/8">Commercial Product Vision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transparencyRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 font-mono">{row.category}</td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">{row.evaluation}</td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">{row.commercial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ethical Medical Guardrails */}
      <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200/90 text-amber-950 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <h3 className="font-bold text-base text-amber-950">Ethical Healthcare Disclosures</h3>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-amber-900/90 leading-relaxed list-disc list-inside">
          <li><strong>Illustrative Telemetry:</strong> Readings shown in this application are preview telemetry streams designed to demonstrate remote monitoring and caregiver alert routing.</li>
          <li><strong>No Substitute for Clinical Devices:</strong> Optical PPG estimates microvascular changes and does not replace certified arterial blood pressure sphygmomanometers or clinical blood tests.</li>
          <li><strong>Personalized Rules Guidance:</strong> Configured thresholds are set by caregivers based on clinician advice and do not constitute automatic diagnostic prescriptions.</li>
          <li><strong>Patient Privacy Priority:</strong> Patients maintain unilateral ownership of medical records and can revoke caregiver access or modify permissions at any time.</li>
        </ul>
      </div>
    </div>
  );
};
