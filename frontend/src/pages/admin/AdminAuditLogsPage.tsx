import React, { useEffect, useState } from 'react';
import { 
  History, Search, Filter, RefreshCw, AlertTriangle, 
  CheckCircle2, ShieldCheck, Eye, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminAuditLog } from '../../types/admin';

export const AdminAuditLogsPage: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetEntity, setTargetEntity] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Selected Log Modal for JSON details
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminAuditLogs(token, targetEntity, actionFilter);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, targetEntity, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                HIPAA & Regulatory Traceability
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 font-mono">{logs.length} Immutable Entries</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              System Audit Logs & Governance Trail
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Permanent record of administrative status changes, diagnostic inspections, knowledge modifications, and security actions.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={targetEntity}
              onChange={(e) => setTargetEntity(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-600"
            >
              <option value="">All Entities</option>
              <option value="patient">Patients</option>
              <option value="caregiver">Caregivers</option>
              <option value="afib_knowledge">AFib Knowledge</option>
              <option value="symptom">Symptoms</option>
              <option value="parameter">Parameters</option>
              <option value="report">Medical Reports</option>
              <option value="notification">Notifications</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-600"
            >
              <option value="">All Actions</option>
              <option value="UPDATE_PATIENT_STATUS">UPDATE_PATIENT_STATUS</option>
              <option value="UPDATE_CAREGIVER_STATUS">UPDATE_CAREGIVER_STATUS</option>
              <option value="VIEW_MEDICAL_REPORT_DETAILS">VIEW_MEDICAL_REPORT_DETAILS</option>
              <option value="UPDATE_AFIB_KNOWLEDGE">UPDATE_AFIB_KNOWLEDGE</option>
              <option value="UPDATE_SYMPTOM">UPDATE_SYMPTOM</option>
              <option value="UPDATE_HEALTH_PARAMETER">UPDATE_HEALTH_PARAMETER</option>
              <option value="CREATE_SYSTEM_ANNOUNCEMENT">CREATE_SYSTEM_ANNOUNCEMENT</option>
              <option value="UPDATE_APP_SETTINGS">UPDATE_APP_SETTINGS</option>
            </select>
          </div>

          <div className="ml-auto text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Append-Only Integrity
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity & Target</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {l.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase">
                          {l.target_entity || 'SYSTEM'}
                        </span>
                        {l.target_id && (
                          <span className="text-slate-500 font-mono text-[10px]">
                            ID: {l.target_id}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{l.actor_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.actor_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {l.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {l.details && Object.keys(l.details).length > 0 ? (
                        <button
                          onClick={() => setSelectedLog(l)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-purple-600" />
                          Inspect
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">None</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-mono text-xs">
                    {loading ? 'Querying audit records...' : 'No audit log entries matching filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 font-mono">
                Log Entry #{selectedLog.id}: {selectedLog.action}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toISOString()}</div>
                <div><strong>Actor:</strong> {selectedLog.actor_name} ({selectedLog.actor_email})</div>
                <div><strong>Target Entity:</strong> {selectedLog.target_entity} (ID: {selectedLog.target_id || 'N/A'})</div>
              </div>

              <div>
                <span className="block font-bold text-slate-700 uppercase font-mono text-[10px] mb-1">Raw Payload & Metadata</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
