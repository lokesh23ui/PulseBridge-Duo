import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Filter, ShieldAlert, CheckCircle2, 
  XCircle, AlertTriangle, Eye, RefreshCw, X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminPatient } from '../../types/admin';

export const AdminPatientsPage: React.FC = () => {
  const { token } = useAuth();
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Status Modal State
  const [selectedPatient, setSelectedPatient] = useState<AdminPatient | null>(null);
  const [statusToSet, setStatusToSet] = useState<'active' | 'suspended' | 'deactivated'>('active');
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // View Details Modal State
  const [detailsPatientId, setDetailsPatientId] = useState<number | null>(null);
  const [patientDetails, setPatientDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchPatients = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminPatients(token, search, statusFilter);
      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load patient accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleOpenStatusModal = (patient: AdminPatient, newStatus: 'active' | 'suspended' | 'deactivated') => {
    setSelectedPatient(patient);
    setStatusToSet(newStatus);
    setStatusReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!token || !selectedPatient) return;
    setUpdating(true);
    try {
      await api.updateAdminPatientStatus(token, selectedPatient.id, statusToSet, statusReason);
      setSelectedPatient(null);
      await fetchPatients();
    } catch (err: any) {
      alert(`Error updating patient status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = async (patientId: number) => {
    if (!token) return;
    setDetailsPatientId(patientId);
    setLoadingDetails(true);
    try {
      const details = await api.getAdminPatientDetail(token, patientId);
      setPatientDetails(details);
    } catch (err: any) {
      alert(`Error loading patient details: ${err.message}`);
      setDetailsPatientId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Identity & Access Governance
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 font-mono">{patients.length} Accounts Monitored</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Patient Account Management
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Review registered patients, check caregiver link counts, view diagnostic vaults, and suspend or activate access.
            </p>
          </div>

          <button
            onClick={fetchPatients}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by patient name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-600"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="deactivated">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Patient Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Clinical Profile</th>
                <th className="py-3 px-4 text-center">Caregivers</th>
                <th className="py-3 px-4 text-center">Reports</th>
                <th className="py-3 px-4 text-center">Analyses</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length > 0 ? (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.email}</div>
                      <div className="text-[10px] text-slate-600 font-mono">UID: #{p.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        p.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'suspended'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {p.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                        {p.status === 'suspended' && <ShieldAlert className="w-3 h-3" />}
                        {p.status === 'deactivated' && <XCircle className="w-3 h-3" />}
                        {p.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Age: <span className="font-semibold text-slate-800">{p.age ?? 'N/A'}</span> • Blood: <span className="font-semibold text-slate-800">{p.blood_type ?? 'N/A'}</span></div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{p.medical_conditions ?? 'None noted'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {p.linked_caregivers_count}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-700">
                      {p.reports_count}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-700">
                      {p.analyses_count}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(p.id)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          title="View patient diagnostic record and caregiver linkages"
                        >
                          <Eye className="w-3 h-3 text-purple-600" />
                          Details
                        </button>

                        {p.status === 'active' ? (
                          <button
                            onClick={() => handleOpenStatusModal(p, 'suspended')}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-all cursor-pointer"
                            title="Suspend account access immediately"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenStatusModal(p, 'active')}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-all cursor-pointer"
                            title="Restore account to active status"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-mono text-xs">
                    {loading ? 'Querying patient records...' : 'No matching patient accounts found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Status Change Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${statusToSet === 'active' ? 'text-emerald-600' : 'text-rose-600'}`} />
                Confirm Account Status Change
              </h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                You are about to change the status of <strong>{selectedPatient.full_name}</strong> ({selectedPatient.email}) to{' '}
                <span className="font-mono uppercase font-bold text-slate-900">{statusToSet}</span>.
              </p>
              {statusToSet === 'suspended' && (
                <p className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  Suspended accounts are immediately blocked from authenticating, accessing health records, or ingesting telemetry readings.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Change (Recorded in Immutable Audit Log):
              </label>
              <textarea
                rows={2}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g., Clinical data review, patient requested pause, or security audit..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPatient(null)}
                disabled={updating}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={updating}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer ${
                  statusToSet === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {updating ? 'Updating...' : `Confirm ${statusToSet.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {detailsPatientId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {patientDetails?.full_name || 'Patient Profile'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {patientDetails?.email} • ID: #{patientDetails?.id}
                </p>
              </div>
              <button
                onClick={() => setDetailsPatientId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                Loading detailed diagnostic dossier...
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Profile Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Age</span>
                    <span className="font-bold text-slate-800">{patientDetails?.profile?.age ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Blood Type</span>
                    <span className="font-bold text-slate-800">{patientDetails?.profile?.blood_type ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Emergency Contact</span>
                    <span className="font-bold text-slate-800">{patientDetails?.profile?.emergency_contact_name ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Account Status</span>
                    <span className="font-bold font-mono text-emerald-700">{patientDetails?.status?.toUpperCase()}</span>
                  </div>
                </div>

                {/* Linked Caregivers */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-mono">
                    Linked Caregiver Network ({patientDetails?.caregivers?.length || 0})
                  </h4>
                  {patientDetails?.caregivers && patientDetails.caregivers.length > 0 ? (
                    <div className="space-y-2">
                      {patientDetails.caregivers.map((c: any) => (
                        <div key={c.relationship_id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{c.caregiver_name}</span>
                            <span className="text-slate-500 text-[11px] ml-1">({c.relationship_label})</span>
                            <div className="text-[10px] text-slate-400 font-mono">{c.caregiver_email}</div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 font-mono text-[11px]">No caregivers linked to this patient account.</p>
                  )}
                </div>

                {/* Reports Summary */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-mono">
                    Uploaded Medical Reports ({patientDetails?.reports?.length || 0})
                  </h4>
                  {patientDetails?.reports && patientDetails.reports.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {patientDetails.reports.map((r: any) => (
                        <div key={r.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-800">{r.report_title}</div>
                            <div className="text-[10px] text-slate-500">{r.category} • {r.healthcare_provider || 'General Lab'}</div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(r.report_date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 font-mono text-[11px]">No diagnostic records on file.</p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailsPatientId(null)}
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
