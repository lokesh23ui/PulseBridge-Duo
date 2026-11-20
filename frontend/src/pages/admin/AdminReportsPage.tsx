import React, { useEffect, useState } from 'react';
import { 
  FileText, Search, Filter, RefreshCw, AlertTriangle, 
  Eye, CheckCircle2, X, Download, ShieldCheck, Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminReport } from '../../types/admin';

export const AdminReportsPage: React.FC = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Report Detail Modal
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [reportDetail, setReportDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminReports(token, search, category);
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load medical reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleViewDetail = async (id: number) => {
    if (!token) return;
    setSelectedReportId(id);
    setLoadingDetail(true);
    try {
      const detail = await api.getAdminReportDetail(token, id);
      setReportDetail(detail);
    } catch (err: any) {
      alert(`Error loading report detail: ${err.message}`);
      setSelectedReportId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Clinical Diagnostic Vault
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 font-mono">{reports.length} Reports Archived</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Medical Reports Management
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Review diagnostic records, ECG interpretations, and laboratory panels across all patient accounts with full audit traceability.
            </p>
          </div>

          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by report title, provider, or patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-600"
            >
              <option value="">All Categories</option>
              <option value="Cardiology">Cardiology (Holter / ECG)</option>
              <option value="General Diagnostics">General Diagnostics</option>
              <option value="General Checkup">General Checkup</option>
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

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Report Details</th>
                <th className="py-3 px-4">Patient Owner</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4 text-center">Findings</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{r.report_title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Report ID: #{r.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{r.patient_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.patient_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        {r.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(r.report_date).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {r.healthcare_provider || 'Not specified'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {r.findings_count}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewDetail(r.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        title="Audit report findings (generates audit log entry)"
                      >
                        <Eye className="w-3 h-3 text-purple-600" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-mono text-xs">
                    {loading ? 'Querying diagnostic records...' : 'No matching medical reports found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Report Modal */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {reportDetail?.report_title || 'Medical Report'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Owner: {reportDetail?.patient_name} ({reportDetail?.patient_email}) • Provider: {reportDetail?.healthcare_provider || 'Clinic'}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                Loading medical report contents...
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Audit notice */}
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 flex items-center gap-2 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    HIPAA Compliance Notice: This administrative inspection was logged in the immutable system audit trail.
                  </span>
                </div>

                {/* Patient Notes */}
                {reportDetail?.patient_notes && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Clinical Notes & Impressions</span>
                    <p className="text-slate-700 leading-relaxed">{reportDetail.patient_notes}</p>
                  </div>
                )}

                {/* Findings Table */}
                {reportDetail?.extracted_summary?.findings && reportDetail.extracted_summary.findings.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-mono">
                      Extracted Clinical Findings ({reportDetail.extracted_summary.findings.length})
                    </h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Biomarker / Test</th>
                            <th className="py-2 px-3">Value</th>
                            <th className="py-2 px-3">Reference Range</th>
                            <th className="py-2 px-3">Observation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportDetail.extracted_summary.findings.map((f: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-semibold text-slate-800">{f.test_name}</td>
                              <td className="py-2 px-3 font-mono text-purple-700 font-bold">{f.value} {f.unit}</td>
                              <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{f.reference_range || 'Normal'}</td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">{f.observation || f.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 font-mono text-[11px]">No structured biomarker findings extracted.</p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReportId(null)}
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
