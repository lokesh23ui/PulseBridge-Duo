import React, { useState } from 'react';
import { Cpu, Send, CheckCircle2, AlertCircle, Copy, RotateCcw } from 'lucide-react';

interface WokwiPayloadPanelProps {
  onInject: (payload: Record<string, any>) => Promise<any>;
}

const DEFAULT_WOKWI_JSON = `{
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

export const WokwiPayloadPanel: React.FC<WokwiPayloadPanelProps> = ({ onInject }) => {
  const [jsonText, setJsonText] = useState(DEFAULT_WOKWI_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, any> | null>(() => {
    try { return JSON.parse(DEFAULT_WOKWI_JSON); } catch { return null; }
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        text: `Successfully ingested payload. Alerts generated: ${result?.alerts_generated ?? 1}`
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

  const handleResetSample = () => {
    handleJsonChange(DEFAULT_WOKWI_JSON);
    setStatusMsg(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">Wokwi ESP32 Emulation Gateway</h3>
            <p className="text-xs text-slate-400 font-mono">Phase 1 ESP32 + DHT22 JSON Data Ingestion Contract</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active Contract: PB-ESP32-01
          </span>
          <button
            onClick={handleResetSample}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Reset to Canonical Sample"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
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
            rows={12}
            className="w-full font-mono text-xs p-3.5 bg-slate-950 text-sky-300 rounded-2xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none shadow-inner"
            placeholder="Paste ESP32 JSON payload..."
          />

          <button
            onClick={handleSubmit}
            disabled={!parsedData || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Ingesting Payload...' : 'Ingest Wokwi Payload to Backend'}
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
                <span className="text-[10px] text-slate-400 block uppercase">Source</span>
                <strong className="text-slate-800">{parsedData.source || 'N/A'}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Heart Rate</span>
                <strong className="text-blue-600 text-sm">{parsedData.heart_rate_bpm ?? 'null'} bpm</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">SpO2 Oxygen</span>
                <strong className={`text-sm ${(parsedData.spo2_percent ?? 100) < 90 ? 'text-red-600' : 'text-teal-600'}`}>
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
          <div className="p-4 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs text-blue-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Physical ESP32 & Wokwi Serial Bridge Integration</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Browser web security does not permit direct background socket access to Wokwi virtual serial streams. 
              To connect live hardware or Wokwi desktop simulations:
            </p>
            <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
              <li>Run the local Python serial bridge: <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono">python scripts/serial_bridge.py COM3</code></li>
              <li>Or use this HTTP ingestion panel to directly submit live JSON payloads to the FastAPI endpoint <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono">POST /api/sensor-data</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
