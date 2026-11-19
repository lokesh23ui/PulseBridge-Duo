import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Activity, HeartPulse, Shield, AlertTriangle, Clock, RefreshCw, 
  FileText, Sliders, ChevronLeft, Plus, CheckCircle2, Lock, BellRing, 
  Send, Sparkles, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SensorReading, HealthAlert } from '../types/telemetry';
import { AlertRule, MedicalReport, AccessPermissions } from '../types/family';

const renderSafeText = (val: any, fallback: string = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.name || val.phone || val.full_name || val.label || JSON.stringify(val);
  }
  return String(val);
};

const renderSummary = (val: any) => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return (
      <div className="space-y-1">
        {Object.entries(val).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs">
            <span className="text-teal-700 font-mono text-[10px] uppercase font-bold">{k.replace(/_/g, ' ')}:</span>
            <span className="text-slate-800">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return String(val);
};

export const PatientMonitoringPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const numericPatientId = patientId ? parseInt(patientId, 10) : 0;
  const { token, user, role } = useAuth();

  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [historyReadings, setHistoryReadings] = useState<SensorReading[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<HealthAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [permissions, setPermissions] = useState<AccessPermissions | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Controlled reading injector state
  const [injectHr, setInjectHr] = useState('135');
  const [injectSpo2, setInjectSpo2] = useState('88');
  const [injectSys, setInjectSys] = useState('145');
  const [injectDia, setInjectDia] = useState('92');
  const [injecting, setInjecting] = useState(false);

  // Rule creation modal state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleParam, setNewRuleParam] = useState('heart_rate_bpm');
  const [newRuleCond, setNewRuleCond] = useState('greater_than');
  const [newRuleThreshold, setNewRuleThreshold] = useState('110');
  const [newRuleSeverity, setNewRuleSeverity] = useState('HIGH');
  const [newRuleCooldown, setNewRuleCooldown] = useState('120');

  // Permission flags for gated UI
  const [reportsRestricted, setReportsRestricted] = useState(false);

  const loadPatientData = useCallback(async () => {
    if (!token || !numericPatientId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch patient overview
      const overview = await api.getPatientOverview(token, numericPatientId);
      setPatientInfo(overview.patient);
      setLatestReading(overview.latest_reading);
      setActiveAlerts(overview.active_alerts || []);
      setAlertRules(overview.active_alert_rules || []);

      // 2. Fetch history
      try {
        const hist = await api.getPatientHistory(token, numericPatientId, 24);
        setHistoryReadings(hist.readings || []);
      } catch (err: any) {
        console.warn('History readings restricted or failed:', err.message);
      }

      // 3. Fetch reports
      try {
        const reps = await api.getPatientReports(token, numericPatientId);
        setReports(reps);
        setReportsRestricted(false);
      } catch (err: any) {
        if (err.message && err.message.includes('403')) {
          setReportsRestricted(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load patient monitoring data');
    } finally {
      setLoading(false);
    }
  }, [token, numericPatientId]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !numericPatientId) return;
    try {
      const payload = {
        parameter: newRuleParam,
        condition: newRuleCond,
        threshold: parseFloat(newRuleThreshold),
        severity: newRuleSeverity,
        cooldown_seconds: parseInt(newRuleCooldown, 10) || 120
      };
      await api.createAlertRule(token, numericPatientId, payload);
      setSuccessMsg(`Personalized alert rule saved: ${newRuleParam} ${newRuleCond} ${newRuleThreshold}`);
      setShowRuleModal(false);
      loadPatientData();
    } catch (err: any) {
      setError(err.message || 'Failed to create alert rule');
    }
  };

  const handleInjectControlledReading = async () => {
    if (!token || !numericPatientId) return;
    setInjecting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.injectPatientControlledReading(token, numericPatientId, {
        heart_rate_bpm: parseFloat(injectHr),
        spo2_percent: parseFloat(injectSpo2),
        bp_systolic_mmhg: parseFloat(injectSys),
        bp_diastolic_mmhg: parseFloat(injectDia)
      });
      setSuccessMsg(`Controlled reading ingested! Generated ${res.alerts_generated} alert(s) and ${res.notifications_delivered} caregiver notification(s).`);
      loadPatientData();
    } catch (err: any) {
      setError(err.message || 'Failed to inject controlled reading');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 text-slate-900">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/family"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Family Care Hub
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPatientData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition shadow-xs cursor-pointer"
            title="Refresh Patient Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Patient Profile Card */}
      {patientInfo && (
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-2xl font-black shadow-md">
              {renderSafeText(patientInfo.full_name, 'P').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{renderSafeText(patientInfo.full_name, 'Patient')}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  CONNECTED PATIENT
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Age: <strong className="text-slate-900">{renderSafeText(patientInfo.age, '72')}</strong> • Blood Type: <strong className="text-slate-900">{renderSafeText(patientInfo.blood_type, 'O+')}</strong>
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Surveillance Conditions: <strong className="text-slate-800">{renderSafeText(patientInfo.medical_conditions, 'Mild Hypertension, Arrhythmia Surveillance')}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-mono font-bold">Emergency Contact</span>
              <span className="text-slate-900 font-bold block">{renderSafeText(patientInfo.emergency_contact_name, 'Marcus Vance')}</span>
              <span className="text-slate-600 block text-[11px] font-mono">{renderSafeText(patientInfo.emergency_contact_phone, '+1 (555) 019-2831')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Live Vitals Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            Live Telemetry Vitals
          </h2>
          <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE STREAM
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Heart Rate */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Heart Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-600 font-mono">
                {latestReading?.heart_rate_bpm ? Math.round(latestReading.heart_rate_bpm) : '--'}
              </span>
              <span className="text-xs text-slate-500">bpm</span>
            </div>
            <p className="text-[10px] text-slate-400">Target: 60-100</p>
          </div>

          {/* SpO2 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">SpO2 Oxygen</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-teal-600 font-mono">
                {latestReading?.spo2_percent ? Math.round(latestReading.spo2_percent) : '--'}
              </span>
              <span className="text-xs text-slate-500">%</span>
            </div>
            <p className="text-[10px] text-slate-400">Normal: &gt;94%</p>
          </div>

          {/* Blood Pressure */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Blood Pressure</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {latestReading?.bp_systolic_mmhg ? `${Math.round(latestReading.bp_systolic_mmhg)}/${Math.round(latestReading.bp_diastolic_mmhg || 80)}` : '--/--'}
              </span>
              <span className="text-xs text-slate-500">mmHg</span>
            </div>
            <p className="text-[10px] text-slate-400">Target: &lt;130/85</p>
          </div>

          {/* Glucose */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Glucose</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-600 font-mono">
                {latestReading?.glucose_mg_dl ? Math.round(latestReading.glucose_mg_dl) : '--'}
              </span>
              <span className="text-xs text-slate-500">mg/dL</span>
            </div>
            <p className="text-[10px] text-slate-400">Normal: 80-140</p>
          </div>

          {/* Temperature */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Skin Temp</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {latestReading?.temperature_c ? latestReading.temperature_c.toFixed(1) : '--'}
              </span>
              <span className="text-xs text-slate-500">°C</span>
            </div>
            <p className="text-[10px] text-slate-400">Normal: 36.1-37.2</p>
          </div>

          {/* Signal Quality */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Signal Quality</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-teal-700 font-mono">
                {latestReading?.signal_quality ? `${Math.round(latestReading.signal_quality * 100)}%` : '--'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Dual Sync Channel</p>
          </div>
        </div>
      </div>

      {/* Interactive Controlled Reading Test Injector */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Controlled Telemetry Injector & Caregiver Alert Trigger
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Simulate an acute physiological reading for Eleanor to immediately test custom alert thresholds and live notification delivery.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
            TEST CONTROLLER
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
            <input
              type="number"
              value={injectHr}
              onChange={(e) => setInjectHr(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">SpO2 Oxygen (%)</label>
            <input
              type="number"
              value={injectSpo2}
              onChange={(e) => setInjectSpo2(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
            <input
              type="number"
              value={injectSys}
              onChange={(e) => setInjectSys(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
            <input
              type="number"
              value={injectDia}
              onChange={(e) => setInjectDia(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                setInjectHr('72');
                setInjectSpo2('98');
                setInjectSys('118');
                setInjectDia('78');
              }}
              className="text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition"
            >
              Normal Baseline
            </button>
            <button
              type="button"
              onClick={() => {
                setInjectHr('138');
                setInjectSpo2('88');
                setInjectSys('152');
                setInjectDia('94');
              }}
              className="text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition"
            >
              Acute Hypoxia & Tachycardia
            </button>
          </div>

          <button
            onClick={handleInjectControlledReading}
            disabled={injecting}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {injecting ? 'Injecting Telemetry...' : 'Inject Telemetry & Trigger Caregiver Alert'}
          </button>
        </div>
      </div>

      {/* Two-Column Grid: Alert Rules & Medical Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personalized Alert Rules */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-600" />
                Personalized Alert Thresholds
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Rules evaluated continuously on incoming patient telemetry
              </p>
            </div>

            <button
              onClick={() => setShowRuleModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Rule
            </button>
          </div>

          <div className="space-y-3">
            {alertRules.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-2xl">
                No personalized alert rules configured yet.
              </p>
            ) : (
              alertRules.map((rule) => (
                <div key={rule.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 uppercase font-mono">
                        {rule.parameter.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                        rule.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rule.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Condition: <strong className="text-slate-900">{rule.condition.replace(/_/g, ' ')}</strong> {rule.threshold}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Cooldown: {rule.cooldown_seconds}s • Configured by: {rule.created_by_name || 'Caregiver'}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    ACTIVE
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medical Reports (With Granular Access Permission Enforcement) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Authorized Medical Reports
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Clinical summaries shared under patient authorization
              </p>
            </div>
          </div>

          {reportsRestricted ? (
            /* Restricted State */
            <div className="p-8 text-center bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-amber-950">Medical Reports Restricted</h4>
              <p className="text-xs text-amber-900/90 max-w-sm mx-auto leading-relaxed">
                Eleanor Vance has kept medical report records private. To view clinical records, request the patient to grant <strong>"Medical Reports"</strong> permission in the Family Care Hub.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-2xl">
                  No medical reports uploaded yet for this patient.
                </p>
              ) : (
                reports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{rep.report_title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                        {rep.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Provider: <strong className="text-slate-700">{rep.healthcare_provider || 'St. Jude Health'}</strong> • Date: {new Date(rep.report_date).toLocaleDateString()}
                    </p>
                    {rep.extracted_summary && (
                      <div className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed shadow-xs">
                        {renderSummary(rep.extracted_summary)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Alert Rule */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Personalized Alert Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Metric Parameter</label>
                <select
                  value={newRuleParam}
                  onChange={(e) => setNewRuleParam(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition"
                >
                  <option value="heart_rate_bpm">Heart Rate (bpm)</option>
                  <option value="spo2_percent">SpO2 Oxygen (%)</option>
                  <option value="bp_systolic_mmhg">Systolic Blood Pressure (mmHg)</option>
                  <option value="glucose_mg_dl">Glucose (mg/dL)</option>
                  <option value="temperature_c">Skin Temperature (°C)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                  <select
                    value={newRuleCond}
                    onChange={(e) => setNewRuleCond(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition"
                  >
                    <option value="greater_than">Greater than (&gt;)</option>
                    <option value="less_than">Less than (&lt;)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Threshold</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 font-mono transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={newRuleSeverity}
                    onChange={(e) => setNewRuleSeverity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cooldown (sec)</label>
                  <input
                    type="number"
                    min={30}
                    value={newRuleCooldown}
                    onChange={(e) => setNewRuleCooldown(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 font-mono transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  Save Alert Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
