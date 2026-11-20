import React, { useEffect, useState } from 'react';
import { 
  Settings, Save, RefreshCw, AlertTriangle, CheckCircle2, 
  Wrench, UserPlus, Cpu, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminAppSettings } from '../../types/admin';

export const AdminSettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<AdminAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [appName, setAppName] = useState('PulseBridge Duo');
  const [supportEmail, setSupportEmail] = useState('support@pulsebridge.health');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);
  const [aiFeaturesEnabled, setAiFeaturesEnabled] = useState(false);

  const fetchSettings = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminSettings(token);
      setSettings(data);
      setAppName(data.app_name);
      setSupportEmail(data.support_email);
      setMaintenanceMode(data.maintenance_mode);
      setMaintenanceMessage(data.maintenance_message);
      setAllowPublicRegistration(data.allow_public_registration);
      setAiFeaturesEnabled(data.ai_features_enabled);
    } catch (err: any) {
      setError(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSavedSuccess(false);
    setError(null);
    try {
      const payload: AdminAppSettings = {
        app_name: appName,
        support_email: supportEmail,
        maintenance_mode: maintenanceMode,
        maintenance_message: maintenanceMessage,
        allow_public_registration: allowPublicRegistration,
        ai_features_enabled: aiFeaturesEnabled
      };
      await api.updateAdminSettings(token, payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
          <span>Loading platform settings...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              Global Platform Governance
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500 font-mono">System Configuration</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Application Settings & Feature Toggles
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure system maintenance mode, control public user registrations, and manage feature flags safely.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configuration saved successfully and logged in audit logs!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Metadata */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-mono">
            <Settings className="w-4 h-4 text-purple-600" />
            Application Identity
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Application Name</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Support Contact Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Access Controls */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-mono">
            <UserPlus className="w-4 h-4 text-teal-600" />
            Registration Control
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPublicRegistration}
                onChange={(e) => setAllowPublicRegistration(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Allow Public User Registration</span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  When disabled, the public registration endpoint immediately returns HTTP 403 Forbidden. Only pre-existing accounts and admin-invited users can sign in.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-mono">
            <Wrench className="w-4 h-4 text-amber-600" />
            System Maintenance Mode
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-bold text-amber-950 block">Enable Maintenance Mode Banner</span>
                <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                  Alerts patients and caregivers across their monitoring portals that scheduled upgrades or database maintenance are active.
                </span>
              </div>
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Notice Message</label>
              <textarea
                rows={2}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Message displayed to portal users..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* AI Features Toggle */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-mono">
              <Cpu className="w-4 h-4 text-blue-600" />
              AI & Advanced Analytics Toggle
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              HIPAA & Privacy Safeguarded
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aiFeaturesEnabled}
                onChange={(e) => setAiFeaturesEnabled(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Enable Optional AI Copilot Integration</span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  By default, PulseBridge Duo uses 100% deterministic, offline-capable clinical algorithms. Turning this on enables optional cloud AI features configured strictly on the backend. Private API keys are never exposed to the frontend client.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
};
