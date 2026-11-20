import React, { useEffect, useState } from 'react';
import { 
  HeartHandshake, Search, RefreshCw, AlertTriangle, 
  CheckCircle2, ShieldAlert, XCircle, Users, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminCaregiver } from '../../types/admin';

export const AdminCaregiversPage: React.FC = () => {
  const { token } = useAuth();
  const [caregivers, setCaregivers] = useState<AdminCaregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Status Change Modal State
  const [selectedCaregiver, setSelectedCaregiver] = useState<AdminCaregiver | null>(null);
  const [statusToSet, setStatusToSet] = useState<'active' | 'suspended'>('active');
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchCaregivers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminCaregivers(token, search);
      setCaregivers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load caregivers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, [token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCaregivers();
  };

  const handleOpenStatusModal = (cg: AdminCaregiver, newStatus: 'active' | 'suspended') => {
    setSelectedCaregiver(cg);
    setStatusToSet(newStatus);
    setStatusReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!token || !selectedCaregiver) return;
    setUpdating(true);
    try {
      await api.updateAdminCaregiverStatus(token, selectedCaregiver.id, statusToSet, statusReason);
      setSelectedCaregiver(null);
      await fetchCaregivers();
    } catch (err: any) {
      alert(`Error updating caregiver status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                Family & Caregiver Surveillance
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 font-mono">{caregivers.length} Accounts Monitored</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Caregiver Network Management
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Supervise registered caregivers, review patient relationship linkages, and govern account authorizations.
            </p>
          </div>

          <button
            onClick={fetchCaregivers}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by caregiver name, email, or relationship..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
          />
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Caregivers Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Caregiver</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Role & Contact</th>
                <th className="py-3 px-4">Linked Patients</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {caregivers.length > 0 ? (
                caregivers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">UID: #{c.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        c.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {c.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {c.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-semibold text-slate-800">{c.relationship_type || 'Family Member'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.phone_number || 'No phone registered'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.linked_patients && c.linked_patients.length > 0 ? (
                        <div className="space-y-1">
                          {c.linked_patients.map((lp, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                              <span className="font-semibold text-slate-800">{lp.patient_name}</span>
                              <span className="text-slate-400 font-mono">({lp.relationship_label})</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {lp.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">No active patient links</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {c.status === 'active' ? (
                        <button
                          onClick={() => handleOpenStatusModal(c, 'suspended')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-all cursor-pointer"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenStatusModal(c, 'active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-all cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-mono text-xs">
                    {loading ? 'Querying caregiver records...' : 'No matching caregiver accounts found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedCaregiver && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Update Caregiver Status
              </h3>
              <button
                onClick={() => setSelectedCaregiver(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Set status for <strong>{selectedCaregiver.full_name}</strong> to{' '}
              <span className="font-mono uppercase font-bold text-slate-900">{statusToSet}</span>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason (Logged to Immutable Audit Trail):
              </label>
              <textarea
                rows={2}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for suspension or re-activation..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedCaregiver(null)}
                disabled={updating}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={updating}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md ${
                  statusToSet === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {updating ? 'Saving...' : `Confirm ${statusToSet.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
