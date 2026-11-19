import React, { useState, useEffect } from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { api } from '../services/api';
import { SensorReading } from '../types/telemetry';
import { 
  Activity, Clock, Calendar, Database, Filter, 
  ArrowUpRight, Heart, Droplets, Thermometer, Zap, Layers 
} from 'lucide-react';

export const HealthInsightsPage: React.FC = () => {
  const { recentReadings } = useMonitoring();
  const [timeWindowHours, setTimeWindowHours] = useState<number>(6);
  const [historyReadings, setHistoryReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [earliestTime, setEarliestTime] = useState<string | null>(null);
  const [latestTime, setLatestTime] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await api.getHistory(timeWindowHours);
        if (res.readings && res.readings.length > 0) {
          setHistoryReadings(res.readings);
          setEarliestTime(res.earliest);
          setLatestTime(res.latest);
        } else {
          // If backend returns empty, use recent local readings
          setHistoryReadings(recentReadings);
          if (recentReadings.length > 0) {
            setEarliestTime(recentReadings[0].timestamp);
            setLatestTime(recentReadings[recentReadings.length - 1].timestamp);
          }
        }
      } catch {
        setHistoryReadings(recentReadings);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [timeWindowHours, recentReadings]);

  // Helper function to generate smooth SVG cubic Bézier curves (M ... C ...)
  const generateBezierPath = (
    values: (number | null)[],
    width: number = 520,
    height: number = 160,
    minBound?: number,
    maxBound?: number
  ): string => {
    const valid = values.filter((v): v is number => v !== null && !isNaN(v));
    if (valid.length < 2) return '';

    const min = minBound !== undefined ? minBound : Math.min(...valid);
    const max = maxBound !== undefined ? maxBound : Math.max(...valid);
    const range = max - min || 1;

    // Map to points
    const points: [number, number][] = values.map((val, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const v = val !== null ? val : min;
      const y = height - ((v - min) / range) * (height - 30) - 15;
      return [x, y];
    });

    if (points.length < 2) return '';

    let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr[0] + (next[0] - curr[0]) * 0.45;
      const cp1y = curr[1];
      const cp2x = curr[0] + (next[0] - curr[0]) * 0.55;
      const cp2y = next[1];
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next[0].toFixed(1)} ${next[1].toFixed(1)}`;
    }
    return d;
  };

  const hrVals = historyReadings.map(r => r.heart_rate_bpm ?? null);
  const spo2Vals = historyReadings.map(r => r.spo2_percent ?? null);
  const sysVals = historyReadings.map(r => r.bp_systolic_mmhg ?? null);
  const diaVals = historyReadings.map(r => r.bp_diastolic_mmhg ?? null);
  const glucoseVals = historyReadings.map(r => r.glucose_mg_dl ?? null);
  const tempVals = historyReadings.map(r => r.temperature_c ?? null);
  const activityVals = historyReadings.map(r => r.activity_percent ?? null);

  const timeFilters = [
    { label: 'Last hour', hours: 1 },
    { label: 'Last 6 hours', hours: 6 },
    { label: 'Last 24 hours', hours: 24 },
    { label: 'Last 7 days', hours: 168 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header & Time Filter */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-mono font-semibold">
              <Database className="w-3.5 h-3.5" />
              LONGITUDINAL TELEMETRY INSIGHTS
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Health Trends & Longitudinal Analytics
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Continuous physiological time-series with Bézier spline smoothing and multi-interval observation.
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl">
            {timeFilters.map(filter => (
              <button
                key={filter.hours}
                type="button"
                onClick={() => setTimeWindowHours(filter.hours)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  timeWindowHours === filter.hours
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coverage Metadata Header */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-4">
            <span>Stored Samples: <strong className="text-slate-900">{historyReadings.length}</strong></span>
            <span>·</span>
            <span>Window: <strong className="text-slate-900">{timeWindowHours} Hours</strong></span>
            {earliestTime && (
              <>
                <span>·</span>
                <span>From: <strong className="text-slate-900">{new Date(earliestTime).toLocaleTimeString()}</strong></span>
                <span>To: <strong className="text-slate-900">{latestTime ? new Date(latestTime).toLocaleTimeString() : 'Now'}</strong></span>
              </>
            )}
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold">
            Preview / Illustrative Telemetry
          </span>
        </div>
      </div>

      {/* 6 Historical Trend Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Heart Rate History */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Heart Rate History</h3>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              BPM
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
            {hrVals.length > 1 ? (
              <svg viewBox="0 0 520 160" className="w-full h-full overflow-visible">
                <line x1="0" y1="40" x2="520" y2="40" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="520" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="520" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />
                <path
                  d={generateBezierPath(hrVals, 520, 160)}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span className="text-xs text-slate-400 font-mono">No readings stored in this period</span>
            )}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Range: 45 - 180 bpm</span>
            <span>Smooth Bézier Spline</span>
          </div>
        </div>

        {/* 2. SpO2 History */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">SpO2 Oxygen Saturation History</h3>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
              PERCENT %
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
            {spo2Vals.length > 1 ? (
              <svg viewBox="0 0 520 160" className="w-full h-full overflow-visible">
                <line x1="0" y1="40" x2="520" y2="40" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="520" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="520" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />
                <path
                  d={generateBezierPath(spo2Vals, 520, 160, 80, 100)}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span className="text-xs text-slate-400 font-mono">No readings stored in this period</span>
            )}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Critical Line: &lt;90%</span>
            <span>Smooth Bézier Spline</span>
          </div>
        </div>

        {/* 3. Blood Pressure History */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">Blood Pressure Estimate History</h3>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
              SYS / DIA mmHg
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
            {sysVals.length > 1 ? (
              <svg viewBox="0 0 520 160" className="w-full h-full overflow-visible">
                <line x1="0" y1="40" x2="520" y2="40" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="520" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="520" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />
                {/* Systolic */}
                <path
                  d={generateBezierPath(sysVals, 520, 160, 60, 180)}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Diastolic */}
                <path
                  d={generateBezierPath(diaVals, 520, 160, 60, 180)}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span className="text-xs text-slate-400 font-mono">No readings stored in this period</span>
            )}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Dark: Systolic · Light: Diastolic</span>
            <span className="text-teal-700 font-medium">Non-invasive PTT Estimate</span>
          </div>
        </div>

        {/* 4. Glucose History */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Blood Glucose History</h3>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
              mg/dL
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
            {glucoseVals.length > 1 ? (
              <svg viewBox="0 0 520 160" className="w-full h-full overflow-visible">
                <line x1="0" y1="40" x2="520" y2="40" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="520" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="520" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />
                <path
                  d={generateBezierPath(glucoseVals, 520, 160, 60, 260)}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span className="text-xs text-slate-400 font-mono">No readings stored in this period</span>
            )}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Range: 70 - 240 mg/dL</span>
            <span className="text-amber-700 font-medium">Non-invasive Optical Preview</span>
          </div>
        </div>

        {/* 5. Temperature History */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Temperature History</h3>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700">
              CELSIUS °C
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
            {tempVals.length > 1 ? (
              <svg viewBox="0 0 520 160" className="w-full h-full overflow-visible">
                <line x1="0" y1="40" x2="520" y2="40" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="520" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="520" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />
                <path
                  d={generateBezierPath(tempVals, 520, 160, 34, 40)}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span className="text-xs text-slate-400 font-mono">No readings stored in this period</span>
            )}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Range: 35.0 - 39.0 °C</span>
            <span>Skin Dermal Sensor</span>
          </div>
        </div>

        {/* 6. Activity History */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Activity / Motion History</h3>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              RELATIVE %
            </span>
          </div>

          <div className="h-44 w-full flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
            {activityVals.length > 1 ? (
              <svg viewBox="0 0 520 160" className="w-full h-full overflow-visible">
                <line x1="0" y1="40" x2="520" y2="40" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="520" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="520" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />
                <path
                  d={generateBezierPath(activityVals, 520, 160, 0, 100)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span className="text-xs text-slate-400 font-mono">No readings stored in this period</span>
            )}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Range: 0 - 100% Motion Score</span>
            <span>3-Axis MEMS IMU</span>
          </div>
        </div>
      </div>

      {/* Stored Readings Tabular Log */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Historical Telemetry Log</h3>
          <span className="text-xs font-mono text-slate-500">Chronological Telemetry Packets</span>
        </div>

        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 font-mono text-slate-700 uppercase">
              <tr>
                <th className="py-3 px-4 font-semibold">Recorded Time</th>
                <th className="py-3 px-4 font-semibold">Device</th>
                <th className="py-3 px-4 font-semibold">HR (bpm)</th>
                <th className="py-3 px-4 font-semibold">SpO2 (%)</th>
                <th className="py-3 px-4 font-semibold">BP (mmHg)</th>
                <th className="py-3 px-4 font-semibold">Glucose</th>
                <th className="py-3 px-4 font-semibold">Temp (°C)</th>
                <th className="py-3 px-4 font-semibold">Activity</th>
                <th className="py-3 px-4 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {historyReadings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No readings stored in this period
                  </td>
                </tr>
              ) : (
                historyReadings.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {r.device_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600">
                      {r.heart_rate_bpm ?? '—'}
                    </td>
                    <td className={`py-3 px-4 font-bold ${
                      (r.spo2_percent ?? 100) < 90 ? 'text-red-600' : 'text-teal-600'
                    }`}>
                      {r.spo2_percent ? `${r.spo2_percent}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.bp_systolic_mmhg ? `${r.bp_systolic_mmhg}/${r.bp_diastolic_mmhg}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.glucose_mg_dl ? `${r.glucose_mg_dl} mg/dL` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.temperature_c ? (
                        <span>{r.temperature_c} <span className="text-[10px] text-slate-400 uppercase">({r.temperature_source})</span></span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.activity_percent ? `${r.activity_percent}%` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {r.source}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
