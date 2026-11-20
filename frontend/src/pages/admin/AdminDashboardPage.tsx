import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, HeartHandshake, ShieldCheck, FileText, 
  Activity, BookOpen, AlertTriangle, ArrowUpRight, 
  Clock, CheckCircle2, RefreshCw, Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminDashboardStats } from '../../types/admin';

export const AdminDashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminStats(token);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
          <span>Loading administrative metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              Console Overview
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            PulseBridge Administrator Dashboard
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time multi-role governance, Atrial Fibrillation clinical intelligence, and system telemetry surveillance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/security"
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security Audit
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Monitored Patients</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.total_patients ?? 0}</div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold">Active Profiles</span>
            <Link to="/admin/patients" className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-0.5">
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Total Caregivers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Linked Caregivers</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.total_caregivers ?? 0}</div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-teal-700 font-semibold">Family & Clinical</span>
            <Link to="/admin/caregivers" className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-0.5">
              View <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Uploaded Reports */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Medical Reports</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.total_reports ?? 0}</div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-blue-700 font-semibold">ECG & Diagnostics</span>
            <Link to="/admin/reports" className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-0.5">
              Audit <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* AFib Analyses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">AFib Analyses Run</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.total_analyses ?? 0}</div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-semibold">Deterministic</span>
            <Link to="/admin/afib-knowledge" className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-0.5">
              Ref <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System & Hardware Telemetry Stats */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-purple-600" />
              Infrastructure & Streams
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Online
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600">Total Sensor Readings</span>
              <span className="text-sm font-extrabold font-mono text-slate-900">{stats?.total_readings.toLocaleString() ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600">Active Health Alerts</span>
              <span className={`text-sm font-extrabold font-mono ${stats?.active_alerts ? 'text-amber-600' : 'text-slate-700'}`}>
                {stats?.active_alerts ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600">Administrator Accounts</span>
              <span className="text-sm font-extrabold font-mono text-purple-700">{stats?.total_admins ?? 1}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600">Platform Status</span>
              <span className="text-xs font-bold text-emerald-700">{stats?.system_status ?? 'Operational'}</span>
            </div>
          </div>
        </div>

        {/* Recent Admin Activity / Audit Log Stream */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-purple-600" />
                Recent Governance Actions (Audit Log)
              </h3>
              <Link to="/admin/audit-logs" className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
                View All
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                stats.recent_activity.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                        {act.action.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{act.action.replace(/_/g, ' ')}</span>
                          {act.target_entity && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              {act.target_entity}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          by {act.actor_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                        {act.status}
                      </span>
                      <div className="text-[10px] text-slate-600 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-600 font-mono">
                  No governance actions recorded yet. All administrative updates are immutably logged here.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Audit trail immutable: SQLite database compliant</span>
            <span className="text-emerald-600 font-bold">100% Traceability</span>
          </div>
        </div>
      </div>
    </div>
  );
};
