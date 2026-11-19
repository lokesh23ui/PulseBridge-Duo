import React, { useState } from 'react';
import { Cpu, Send, CheckCircle2, AlertCircle, Copy, RotateCcw, Sparkles, Activity } from 'lucide-react';

interface WokwiPayloadPanelProps {
  onInject: (payload: Record<string, any>) => Promise<any>;
}

type WokwiScenario = 'STABLE' | 'ELEVATED_HR' | 'LOW_SPO2' | 'HIGH_BP' | 'MIXED';

export const WokwiPayloadPanel: React.FC<WokwiPayloadPanelProps> = ({ onInject }) => {
  const [activeScenario, setActiveScenario] = useState<WokwiScenario>('STABLE');
  const [jsonText, setJsonText] = useState(() => generatePayloadJson('STABLE'));
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, any> | null>(() => {
    try { return JSON.parse(generatePayloadJson('STABLE')); } catch { return null; }
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function generatePayloadJson(scenario: WokwiScenario): string {
    const eventId = `PB-EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const isoTimestamp = new Date().toISOString();
    
    let hr = 72;
    let spo2 = 98;
    let sys = 118;
    let dia = 78;
    let glucose = 95;
    let temp = 36.6;

    // Add realistic physiological scenario jitter
    if (scenario === 'STABLE') {
      hr = 70 + Math.floor(Math.random() * 6);
      spo2 = 97 + Math.floor(Math.random() * 3);
      sys = 116 + Math.floor(Math.random() * 6);
      dia = 76 + Math.floor(Math.random() * 4);
      glucose = 92 + Math.floor(Math.random() * 8);
      temp = 36.5 + parseFloat((Math.random() * 0.3).toFixed(1));
    } else if (scenario === 'ELEVATED_HR') {
      hr = 132 + Math.floor(Math.random() * 12); // Triggers HR > 120 / > 130
      spo2 = 96 + Math.floor(Math.random() * 3);
      sys = 130 + Math.floor(Math.random() * 8);
      dia = 84 + Math.floor(Math.random() * 6);
      glucose = 105 + Math.floor(Math.random() * 10);
      temp = 36.9 + parseFloat((Math.random() * 0.3).toFixed(1));
    } else if (scenario === 'LOW_SPO2') {
      hr = 95 + Math.floor(Math.random() * 8);
      spo2 = 86 + Math.floor(Math.random() * 4); // Triggers SpO2 < 90 / < 92
      sys = 124 + Math.floor(Math.random() * 6);
      dia = 80 + Math.floor(Math.random() * 4);
      glucose = 98 + Math.floor(Math.random() * 8);
      temp = 36.6;
    } else if (scenario === 'HIGH_BP') {
      hr = 82 + Math.floor(Math.random() * 6);
      spo2 = 97 + Math.floor(Math.random() * 2);
      sys = 152 + Math.floor(Math.random() * 12); // Triggers BP > 140 / > 160
      dia = 96 + Math.floor(Math.random() * 8);
      glucose = 110 + Math.floor(Math.random() * 15);
      temp = 36.7;
    } else if (scenario === 'MIXED') {
      hr = 128 + Math.floor(Math.random() * 10);
      spo2 = 88 + Math.floor(Math.random() * 3);
      sys = 146 + Math.floor(Math.random() * 10);
      dia = 92 + Math.floor(Math.random() * 6);
      glucose = 185 + Math.floor(Math.random() * 20);
      temp = 37.3 + parseFloat((Math.random() * 0.4).toFixed(1));
    }

    const payload = {
      event_id: eventId,
      device_id: "PB-ESP32-01",
      source: "WOKWI_SIMULATION",
      simulated: true,
      timestamp: isoTimestamp,
      heart_rate_bpm: hr,
      spo2_percent: spo2,
      bp_systolic_mmhg: sys,
      bp_diastolic_mmhg: dia,
      glucose_mg_dl: glucose,
      temperature_c: temp,
      humidity_percent: 45.0 + Math.floor(Math.random() * 6),
      activity_percent: 40 + Math.floor(Math.random() * 15),
      status: "ILLUSTRATIVE_READING"
    };

    return JSON.stringify(payload, null, 2);
  }

  const handleScenarioChange = (scenario: WokwiScenario) => {
    setActiveScenario(scenario);
    const newJson = generatePayloadJson(scenario);
    setJsonText(newJson);
    try {
      setParsedData(JSON.parse(newJson));
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const handleGenerateSampleReading = async () => {
    const freshJson = generatePayloadJson(activeScenario);
    setJsonText(freshJson);
    const parsed = JSON.parse(freshJson);
    setParsedData(parsed);
    setParseError(null);
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const result = await onInject(parsed);
      setStatusMsg({
        type: 'success',
        text: `Fresh illustrative reading generated & ingested! Event ${parsed.event_id}. Alerts: ${result?.alerts_generated ?? 0}`
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Ingestion failed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setParsedData(parsed);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
      setParsedData(null);
    }
  };

  const handleSubmit = async () => {
    if (!parsedData) return;
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const result = await onInject(parsedData);
      setStatusMsg({
        type: 'success',
        text: `Successfully ingested payload. Alerts generated: ${result?.alerts_generated ?? 0}`
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Ingestion failed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">Wokwi ESP32 Emulation Gateway</h3>
            <p className="text-xs text-slate-400 font-mono">ESP32 + DHT22 JSON Data Ingestion Contract</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active Contract: PB-ESP32-01
          </span>
        </div>
      </div>

      {/* Scenario Selection Toolbar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 font-mono mr-1">Scenario:</span>
          {(['STABLE', 'ELEVATED_HR', 'LOW_SPO2', 'HIGH_BP', 'MIXED'] as WokwiScenario[]).map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => handleScenarioChange(sc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition cursor-pointer ${
                activeScenario === sc
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sc.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Generate Sample Reading Button */}
        <button
          type="button"
          onClick={handleGenerateSampleReading}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          Generate Sample Reading
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: JSON Input Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
              Raw Serial / HTTP Payload JSON
            </label>
            {parseError ? (
              <span className="text-xs font-mono text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Invalid JSON
              </span>
            ) : (
              <span className="text-xs font-mono text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid Schema
              </span>
            )}
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={13}
            className="w-full font-mono text-xs p-3.5 bg-slate-900 text-teal-300 rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed resize-none shadow-inner"
            placeholder="Paste ESP32 JSON payload..."
          />

          <button
            onClick={handleSubmit}
            disabled={!parsedData || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold text-xs transition cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Ingesting Payload...' : 'Ingest Raw Payload to Backend'}
          </button>

          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* Right: Parsed Telemetry Inspector & Serial Documentation */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
            Parsed Telemetry Inspector
          </h4>

          {parsedData ? (
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Device ID</span>
                <strong className="text-slate-800">{parsedData.device_id || 'N/A'}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Event ID</span>
                <strong className="text-slate-800 text-[11px]">{parsedData.event_id || 'N/A'}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Heart Rate</span>
                <strong className="text-teal-600 text-sm">{parsedData.heart_rate_bpm ?? 'null'} bpm</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">SpO2 Oxygen</span>
                <strong className={`text-sm ${(parsedData.spo2_percent ?? 100) < 92 ? 'text-red-600' : 'text-teal-600'}`}>
                  {parsedData.spo2_percent ?? 'null'} %
                </strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Blood Pressure</span>
                <strong className="text-slate-800">
                  {parsedData.bp_systolic_mmhg ?? 'null'}/{parsedData.bp_diastolic_mmhg ?? 'null'} mmHg
                </strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Blood Glucose</span>
                <strong className="text-slate-800">{parsedData.glucose_mg_dl ?? 'null'} mg/dL</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Ambient Temp (DHT22)</span>
                <strong className="text-amber-600">{parsedData.temperature_c ?? 'null'} °C</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Ambient Humidity</span>
                <strong className="text-sky-600">{parsedData.humidity_percent ?? 'null'} %</strong>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
              Fix JSON errors to preview parsed fields
            </div>
          )}

          {/* Serial Bridge Hardware Note */}
          <div className="p-4 bg-teal-50/70 border border-teal-200/70 rounded-2xl text-xs text-teal-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-teal-900">
              <Cpu className="w-4 h-4 text-teal-700" />
              <span>Physical ESP32 & Wokwi Serial Bridge Integration</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Browser web security does not permit raw socket access directly to Wokwi virtual serial streams. 
              To connect live microcontrollers or Wokwi desktop simulations:
            </p>
            <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
              <li>Run the local Python serial bridge: <code className="bg-teal-100 text-teal-900 px-1 py-0.5 rounded font-mono">python scripts/serial_bridge.py COM3</code></li>
              <li>Or click <strong>"Generate Sample Reading"</strong> to submit live JSON payloads directly to <code className="bg-teal-100 text-teal-900 px-1 py-0.5 rounded font-mono">POST /api/sensor-data</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
