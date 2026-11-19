import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Upload, Plus, Shield, Calendar, Building2, 
  CheckCircle2, AlertCircle, RefreshCw, X, FileCheck, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MedicalReport } from '../types/family';

export const MedicalReportsPage: React.FC = () => {
  const { user, token, role, isAuthenticated, loginAsDemoPatient } = useAuth();

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [category, setCategory] = useState('Cardiology');
  const [provider, setProvider] = useState('St. Jude Heart Clinic');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const patientId = user?.patient_profile?.id || user?.id || 1;

  const loadReports = async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPatientReports(token, user.id);
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load medical reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
    }
  }, [token, user, isAuthenticated]);

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadPatientReport(token, user.id, {
        report_title: reportTitle,
        category,
        healthcare_provider: provider,
        report_date: new Date(reportDate).toISOString(),
        extracted_summary: summary,
        patient_notes: notes
      });
      setSuccessMsg('Medical report securely uploaded!');
      setShowUploadModal(false);
      // Reset form
      setReportTitle('');
      setSummary('');
      setNotes('');
      loadReports();
    } catch (err: any) {
      setError(err.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Medical Reports Vault</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please sign in to access and manage your encrypted health records and clinical test summaries.
        </p>
        <button
          onClick={loginAsDemoPatient}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all inline-flex items-center gap-2"
        >
          Sign in as Demo Patient (Eleanor Vance)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
              Patient Data Vault
            </span>
            <span className="text-xs text-slate-400">Patient: <strong className="text-white">{user?.full_name}</strong></span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1.5 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-400" />
            Medical Reports & Diagnostic Records
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store, summarize, and control access to clinical documents. Caregivers cannot view these reports unless you grant permission in Family Care.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-600/20 transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Upload New Report
          </button>
          <button
            onClick={loadReports}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            title="Refresh Reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Reports Timeline / List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No Medical Reports Uploaded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Upload your clinical test results, ECG records, or doctor consultation summaries to keep them organized.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
            >
              Upload First Report
            </button>
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl shadow-xl space-y-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{rep.report_title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {rep.healthcare_provider || 'Clinical Provider'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(rep.report_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  {rep.category}
                </span>
              </div>

              {rep.extracted_summary && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                    Diagnostic Summary & Clinical Findings
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {rep.extracted_summary}
                  </p>
                </div>
              )}

              {rep.patient_notes && (
                <div className="text-xs text-slate-400 flex items-start gap-2">
                  <strong className="text-slate-300 flex-shrink-0">Patient Notes:</strong>
                  <span>{rep.patient_notes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-400" />
                Upload Clinical Health Record
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadReport} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Holter ECG 48-Hour Monitoring Summary"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="General Health">General Health</option>
                    <option value="Laboratory">Laboratory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Healthcare Provider / Clinic</label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. St. Jude Heart Clinic"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Extracted Summary / Key Findings</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Mild sinus arrhythmia observed with no ischemic ST changes. Recommended continuous wearable monitoring."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Personal Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Doctor scheduled follow up in 6 months."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-teal-600/20 disabled:opacity-50"
                >
                  {uploading ? 'Encrypting & Saving...' : 'Save Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
