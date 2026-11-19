import React, { useState } from 'react';
import { 
  Layers, Cpu, Radio, Server, Monitor, BellRing, 
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Code, ArrowRight 
} from 'lucide-react';

interface TechLayer {
  number: number;
  name: string;
  badge: 'IMPLEMENTED' | 'PROTOTYPE LOGIC' | 'PROPOSED HARDWARE';
  icon: any;
  summary: string;
  technologies: string[];
  details: string;
  dataContract?: string;
}

export const TechnologyPage: React.FC = () => {
  const [expandedLayer, setExpandedLayer] = useState<number>(1);

  const layers: TechLayer[] = [
    {
      number: 1,
      name: "Layer 1: Wearable Sensor & Edge Hardware",
      badge: "PROPOSED HARDWARE",
      icon: Cpu,
      summary: "Microvascular optical PPG, 6-axis IMU, and thermal thermistors in titanium ring and aluminum smartwatch.",
      technologies: ["Grade 5 Titanium", "Sapphire Optical Windows", "Triple-Wavelength PPG (525/660/940nm)", "Bosch MEMS IMU", "NTC Thermistors"],
      details: "Hardware concept designs with 11 ring components (R01-R11) and 15 watch components (W01-W15). Form factors are engineered for finger-based microvascular sensing and wrist-based movement compensation."
    },
    {
      number: 2,
      name: "Layer 2: Communication & IoT Gateway Bridge",
      badge: "IMPLEMENTED",
      icon: Radio,
      summary: "BLE 5.3 GATT telemetry services, Wokwi virtual serial bridge, and HTTP/WebSocket ingestion adapters.",
      technologies: ["Bluetooth Low Energy 5.3", "ESP32 UART Serial", "FastAPI WebSocket Stream", "JSON Ingestion Adapter"],
      details: "Bridges wearable sensor streams into the cloud/local hub. In our implementation, Wokwi ESP32 payloads and browser wearable simulators stream live JSON packets into FastAPI."
    },
    {
      number: 3,
      name: "Layer 3: Normalization & Signal Processing",
      badge: "IMPLEMENTED",
      icon: Layers,
      summary: "Pydantic normalization, motion-artifact penalty estimation, and cross-wearable correlation.",
      technologies: ["Pydantic v2 Schema Validation", "Signal Quality Estimator", "Dual-Stream Divergence Tracker"],
      details: "Normalizes diverse raw payloads into a canonical SensorReading entity. Assesses optical signal quality based on motion artifact scoring, avoiding false alarms during exercise."
    },
    {
      number: 4,
      name: "Layer 4: Storage & State Persistence",
      badge: "IMPLEMENTED",
      icon: Server,
      summary: "SQLAlchemy 2.0 ORM with SQLite database storing time-series telemetry, device states, and alerts.",
      technologies: ["FastAPI Async Server", "SQLAlchemy 2.0", "SQLite 3 with WAL", "Pydantic Schemas"],
      details: "Persistent local relational storage with automated schema creation, indexing, circular buffers, and REST endpoints for query and alert state mutation."
    },
    {
      number: 5,
      name: "Layer 5: Visualization & Clinical Dashboard",
      badge: "IMPLEMENTED",
      icon: Monitor,
      summary: "React 18, Tailwind CSS, Three.js WebGL 3D models, SVG Bézier sparklines, and synthetic oscilloscope.",
      technologies: ["React 18 + TypeScript", "Tailwind CSS", "Three.js WebGL", "Canvas Oscilloscope", "Bézier Splines"],
      details: "Interactive 3D mechanical model exploration (with radial exploded views), synthetic PPG oscilloscope, and responsive metric cards designed for clinicians and caregivers."
    },
    {
      number: 6,
      name: "Layer 6: Rule-Based Health Alert Engine",
      badge: "IMPLEMENTED",
      icon: BellRing,
      summary: "Configurable threshold rules (Critical, Warning, Attention) with clinical verification instructions.",
      technologies: ["Configurable Threshold Schema", "Multi-Severity Rule Evaluation", "Acknowledge Workflow"],
      details: "Evaluates ingested telemetry against physiological safety envelopes. Alerts prompt user verification (e.g. sensor reseating or clinical cuff confirmation) rather than issuing medical diagnoses."
    }
  ];

  const wokwiPayloadJson = `{
  "device_id": "PB-ESP32-01",
  "source": "WOKWI_SIMULATION",
  "simulated": true,
  "heart_rate_bpm": 104,
  "spo2_percent": 86,
  "bp_systolic_mmhg": 131,
  "bp_diastolic_mmhg": 89,
  "glucose_mg_dl": 182,
  "temperature_c": 36.8,
  "humidity_percent": 45.0,
  "activity_percent": 45,
  "demo_status": "REVIEW"
}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="space-y-2 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-mono font-semibold">
          SYSTEM ARCHITECTURE
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Technology Architecture & Integration Flow
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          PulseBridge Duo is designed as a six-layer connected healthcare platform. Click any layer below to 
          inspect its technical protocols, hardware specifications, and implementation status.
        </p>
      </div>

      {/* 6-Layer Architecture Stack */}
      <div className="space-y-4">
        {layers.map(layer => {
          const Icon = layer.icon;
          const isExpanded = expandedLayer === layer.number;
          return (
            <div
              key={layer.number}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isExpanded ? 'bg-white border-blue-400 shadow-md ring-2 ring-blue-500/10' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedLayer(isExpanded ? 0 : layer.number)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isExpanded ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-700'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{layer.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        layer.badge === 'IMPLEMENTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        layer.badge === 'PROTOTYPE LOGIC' ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                        'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {layer.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{layer.summary}</p>
                  </div>
                </div>

                <div className="shrink-0 p-2 text-slate-400 hover:text-slate-700">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {layer.details}
                  </p>

                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                      Key Technical Components & Protocols
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {layer.technologies.map((t, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-mono font-medium border border-slate-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Wokwi Hardware Emulation Payload Contract */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-base">Wokwi Phase 1 ESP32 Ingestion Schema</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">Preserved 100% Unchanged</span>
          </div>

          <pre className="p-4 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto leading-relaxed">
            {wokwiPayloadJson}
          </pre>

          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Endpoint: <code className="text-blue-400">POST /api/sensor-data</code> · Validated with Pydantic · 
            Adapter automatically normalizes ambient temperature (DHT22) and routes vital parameters to the alert engine.
          </p>
        </div>

        {/* REST API & WebSocket Contract */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">FastAPI REST & WebSocket Endpoints</h3>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <span className="text-blue-700 font-bold">GET /api/health</span>
              <span className="text-slate-500">Service Status</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <span className="text-blue-700 font-bold">GET /api/devices</span>
              <span className="text-slate-500">Device Registry</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <span className="text-emerald-700 font-bold">POST /api/sensor-data</span>
              <span className="text-slate-500">Telemetry Ingest</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <span className="text-blue-700 font-bold">GET /api/latest</span>
              <span className="text-slate-500">Latest Metrics</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <span className="text-blue-700 font-bold">GET /api/history</span>
              <span className="text-slate-500">Time-Series Query</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <span className="text-purple-700 font-bold">WS /ws/monitoring</span>
              <span className="text-slate-500">Live JSON Frames</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
