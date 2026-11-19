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
  const [reportsRestricted, setReportsRestricted] = useState(false);
  const [permissions, setPermissions] = useState<AccessPermissions | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Rule Modal state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleParam, setNewRuleParam] = useState('heart_rate_bpm');
  const [newRuleCond, setNewRuleCond] = useState('greater_than');
  const [newRuleThreshold, setNewRuleThreshold] = useState('110');
  const [newRuleSeverity, setNewRuleSeverity] = useState('HIGH');
  const [newRuleCooldown, setNewRuleCooldown] = useState('300');

  // Controlled Reading Injector state
  const [injectHr, setInjectHr] = useState('135');
  const [injectSpo2, setInjectSpo2] = useState('88');
  const [injectSys, setInjectSys] = useState('145');
  const [injectDia, setInjectDia] = useState('92');
  const [injecting, setInjecting] = useState(false);

  const loadPatientData = useCallback(async () => {
    if (!token || !numericPatientId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Overview
      const overview = await api.getPatientOverview(token, numericPatientId);
      setPatientInfo(overview.patient);
      if (overview.latest_reading) setLatestReading(overview.latest_reading);
      if (overview.active_alerts) setActiveAlerts(overview.active_alerts);

      // 2. Alert Rules
      try {
        const rules = await api.getPatientAlertRules(token, numericPatientId);
        setAlertRules(rules);
      } catch (e) {
        console.warn('Alert rules restricted or failed', e);
      }

      // 3. History
      try {
        const hist = await api.getPatientHistory(token, numericPatientId, 12);
        setHistoryReadings(hist.readings || []);
      } catch (e) {
        console.warn('History restricted', e);
      }

      // 4. Reports (check for permission restriction)
      try {
        const reps = await api.getPatientReports(token, numericPatientId);
        setReports(reps);
        setReportsRestricted(false);
      } catch (e: any) {
        if (e.message?.includes('view_medical_reports') || e.message?.includes('restricted')) {
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
    const interval = setInterval(loadPatientData, 8000);
    return () => clearInterval(interval);
  }, [loadPatientData]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !numericPatientId) return;
    try {
      await api.createPatientAlertRule(token, numericPatientId, {
        parameter: newRuleParam,
        condition: newRuleCond,
        threshold: parseFloat(newRuleThreshold),
        severity: newRuleSeverity,
        cooldown_seconds: parseInt(newRuleCooldown, 10),
        enabled: true
      });
      setSuccessMsg('Personalized alert rule saved!');
      setShowRuleModal(false);
      loadPatientData();
    } catch (err: any) {
      setError(err.message || 'Failed to create alert rule');
    }
  };

  const handleInjectControlledReading = async () => {
    if (!token || !numericPatientId) return;
    setInjecting(true);
    try {
      const res = await api.injectControlledPatientReading(token, numericPatientId, {
        device_id: 'PB-RING-01',
        source: 'CONTROLLED_TEST_INJECTOR',
        simulated: true,
        heart_rate_bpm: parseFloat(injectHr),
        spo2_percent: parseFloat(injectSpo2),
        bp_systolic_mmhg: parseFloat(injectSys),
        bp_diastolic_mmhg: parseFloat(injectDia),
        glucose_mg_dl: 110,
        temperature_c: 36.6,
        signal_quality: 0.98,
        battery_percent: 94
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/family"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Family Care Hub
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPatientData}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
            title="Refresh Patient Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Patient Profile Card */}
      {patientInfo && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {patientInfo.full_name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{patientInfo.full_name}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  CONNECTED PATIENT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Age: <strong className="text-slate-200">{patientInfo.age || 72}</strong> • Blood Type: <strong className="text-slate-200">{patientInfo.blood_type || 'O+'}</strong>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Surveillance Conditions: <strong className="text-slate-300">{patientInfo.medical_conditions || 'Mild Hypertension, Arrhythmia Surveillance'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Emergency Contact</span>
              <span className="text-slate-200 font-semibold">{patientInfo.emergency_contact_name || 'Marcus Vance'}</span>
              <span className="text-slate-400 block text-[11px] font-mono">{patientInfo.emergency_contact_phone || '+1 (555) 019-2831'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Live Vitals Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500" />
            Live Telemetry Vitals
          </h2>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE STREAM
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Heart Rate */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Heart Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-400">
                {latestReading?.heart_rate_bpm ? Math.round(latestReading.heart_rate_bpm) : '--'}
              </span>
              <span className="text-xs text-slate-500">bpm</span>
            </div>
            <p className="text-[10px] text-slate-500">Target: 60-100</p>
          </div>

          {/* SpO2 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">SpO2 Oxygen</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-400">
                {latestReading?.spo2_percent ? Math.round(latestReading.spo2_percent) : '--'}
              </span>
              <span className="text-xs text-slate-500">%</span>
            </div>
            <p className="text-[10px] text-slate-500">Normal: &gt;94%</p>
          </div>

          {/* Blood Pressure */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Blood Pressure</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-teal-400">
                {latestReading?.bp_systolic_mmhg ? `${Math.round(latestReading.bp_systolic_mmhg)}/${Math.round(latestReading.bp_diastolic_mmhg || 80)}` : '--/--'}
              </span>
              <span className="text-xs text-slate-500">mmHg</span>
            </div>
            <p className="text-[10px] text-slate-500">Target: &lt;130/85</p>
          </div>

          {/* Glucose */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Glucose</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-400">
                {latestReading?.glucose_mg_dl ? Math.round(latestReading.glucose_mg_dl) : '--'}
              </span>
              <span className="text-xs text-slate-500">mg/dL</span>
            </div>
            <p className="text-[10px] text-slate-500">Normal: 80-140</p>
          </div>

          {/* Temperature */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Skin Temp</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-400">
                {latestReading?.temperature_c ? latestReading.temperature_c.toFixed(1) : '--'}
              </span>
              <span className="text-xs text-slate-500">°C</span>
            </div>
            <p className="text-[10px] text-slate-500">Normal: 36.1-37.2</p>
          </div>

          {/* Signal Quality */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Signal Quality</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-400">
                {latestReading?.signal_quality ? `${Math.round(latestReading.signal_quality * 100)}%` : '--'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Dual Wearable Synced</p>
          </div>
        </div>
      </div>

      {/* Interactive Controlled Reading Test Injector */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Interactive Hackathon Alert & In-App Notification Trigger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate an acute biometric event for Eleanor to immediately test customized alert rules and caregiver notification delivery.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            TEST BED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Heart Rate (bpm)</label>
            <input
              type="number"
              value={injectHr}
              onChange={(e) => setInjectHr(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">SpO2 Oxygen (%)</label>
            <input
              type="number"
              value={injectSpo2}
              onChange={(e) => setInjectSpo2(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Systolic BP (mmHg)</label>
            <input
              type="number"
              value={injectSys}
              onChange={(e) => setInjectSys(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Diastolic BP (mmHg)</label>
            <input
              type="number"
              value={injectDia}
              onChange={(e) => setInjectDia(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              setInjectHr('145');
              setInjectSpo2('87');
              setInjectSys('165');
            }}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Preset: Acute Hypoxia & Tachycardia
          </button>

          <button
            onClick={handleInjectControlledReading}
            disabled={injecting}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {injecting ? 'Broadcasting Reading...' : 'Inject Telemetry & Trigger Caregiver Alert'}
          </button>
        </div>
      </div>

      {/* Two-Column Grid: Alert Rules & Medical Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personalized Alert Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                Personalized Alert Thresholds
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rules evaluated continuously on incoming patient telemetry
              </p>
            </div>

            <button
              onClick={() => setShowRuleModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Rule
            </button>
          </div>

          <div className="space-y-3">
            {alertRules.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-xl">
                No personalized alert rules configured yet.
              </p>
            ) : (
              alertRules.map((rule) => (
                <div key={rule.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white uppercase font-mono">
                        {rule.parameter.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        rule.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {rule.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Condition: <strong className="text-slate-200">{rule.condition.replace('_', ' ')}</strong> {rule.threshold}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Cooldown: {rule.cooldown_seconds}s • Configured by: {rule.created_by_name || 'Caregiver'}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTIVE
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medical Reports (With Granular Access Permission Enforcement) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                Authorized Medical Reports
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clinical summaries shared under patient authorization
              </p>
            </div>
          </div>

          {reportsRestricted ? (
            /* Restricted State */
            <div className="p-8 text-center bg-slate-950/80 border border-amber-500/20 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Medical Reports Restricted</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Eleanor Vance has kept medical report records private. To view clinical records, request the patient to grant <strong>"Medical Reports"</strong> permission in the Family Care Hub.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-xl">
                  No medical reports uploaded yet for this patient.
                </p>
              ) : (
                reports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{rep.report_title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {rep.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Provider: <strong className="text-slate-300">{rep.healthcare_provider || 'St. Jude Health'}</strong> • Date: {new Date(rep.report_date).toLocaleDateString()}
                    </p>
                    {rep.extracted_summary && (
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                        {rep.extracted_summary}
                      </p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Personalized Alert Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Metric Parameter</label>
                <select
                  value={newRuleParam}
                  onChange={(e) => setNewRuleParam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
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
                  <label className="block text-xs font-medium text-slate-400 mb-1">Condition</label>
                  <select
                    value={newRuleCond}
                    onChange={(e) => setNewRuleCond(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="greater_than">Greater than (&gt;)</option>
                    <option value="less_than">Less than (&lt;)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Threshold</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Severity</label>
                  <select
                    value={newRuleSeverity}
                    onChange={(e) => setNewRuleSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cooldown (sec)</label>
                  <input
                    type="number"
                    min={30}
                    value={newRuleCooldown}
                    onChange={(e) => setNewRuleCooldown(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/20"
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
