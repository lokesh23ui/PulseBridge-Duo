import React, { useEffect, useState } from 'react';
import { 
  Sliders, RefreshCw, AlertTriangle, CheckCircle2, 
  Info, Edit3, X, Save, Activity, Heart, Wind, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminParameter } from '../../types/admin';

export const AdminParametersPage: React.FC = () => {
  const { token } = useAuth();
  const [params, setParams] = useState<AdminParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingParam, setEditingParam] = useState<AdminParameter | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editNormalRange, setEditNormalRange] = useState('');
  const [editClinicalRole, setEditClinicalRole] = useState('');
  const [editLimitations, setEditLimitations] = useState('');
  const [editAfibRelevance, setEditAfibRelevance] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchParams = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminParameters(token);
      setParams(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load health parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParams();
  }, [token]);

  const handleOpenEdit = (p: AdminParameter) => {
    setEditingParam(p);
    setEditName(p.name);
    setEditUnit(p.unit || '');
    setEditNormalRange(p.normal_range || '');
    setEditClinicalRole(p.clinical_role);
    setEditLimitations(p.limitations || '');
    setEditAfibRelevance(p.afib_relevance);
  };

  const handleSaveParam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingParam) return;
    setSaving(true);
    try {
      await api.updateAdminParameter(token, editingParam.parameter_key, {
        name: editName,
        unit: editUnit,
        normal_range: editNormalRange,
        clinical_role: editClinicalRole,
        limitations: editLimitations,
        afib_relevance: editAfibRelevance,
        sort_order: editingParam.sort_order,
        is_active: editingParam.is_active
      });
      setEditingParam(null);
      await fetchParams();
    } catch (err: any) {
      alert(`Error updating parameter: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getParamIcon = (key: string) => {
    switch (key) {
      case 'heart_rhythm_ecg':
        return <Activity className="w-5 h-5 text-purple-600" />;
      case 'heart_rate':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'hrv':
        return <Sliders className="w-5 h-5 text-blue-500" />;
      case 'spo2':
        return <Wind className="w-5 h-5 text-teal-500" />;
      default:
        return <Activity className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Scope */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              Exact 4-Parameter AFib Scope
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500 font-mono">Cardiology Guidelines Validated</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Health Parameters Configuration
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Governs physiological definitions, diagnostic roles, and medical caveats for the 4 monitored cardiac parameters.
          </p>
        </div>

        <button
          onClick={fetchParams}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scope Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-950 text-xs flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
        <span className="leading-relaxed">
          <strong>Strict Architectural Boundary:</strong> Only the 4 essential AFib parameters are maintained (ECG Rhythm, Heart Rate, HRV, SpO₂). All non-AFib biomarkers (blood glucose, blood pressure estimates) have been permanently decommissioned.
        </span>
      </div>

      {/* Parameters Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {params.map((p) => (
          <div key={p.parameter_key} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-purple-200 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {getParamIcon(p.parameter_key)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                    <span className="text-[10px] font-mono text-purple-700 font-semibold">{p.clinical_role}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit parameter configuration"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Measurement Unit</span>
                  <span className="font-semibold text-slate-800 font-mono">{p.unit || 'Waveform'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Baseline Range</span>
                  <span className="font-semibold text-slate-800 truncate block">{p.normal_range || 'Normal Sinus'}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="font-bold text-slate-800 text-[11px] block">AFib Clinical Relevance:</span>
                  <p className="leading-relaxed text-[11px] text-slate-600">{p.afib_relevance}</p>
                </div>

                {p.limitations && (
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900">
                    <span className="font-bold block mb-0.5">Clinical Limitation / Caveat:</span>
                    {p.limitations}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Key: {p.parameter_key}</span>
              <span className="text-emerald-600 font-bold">ACTIVE REGISTRY</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Parameter Modal */}
      {editingParam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveParam} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                Edit Parameter: {editingParam.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingParam(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parameter Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="e.g. BPM, %, ms"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Normal Reference Range</label>
                  <input
                    type="text"
                    value={editNormalRange}
                    onChange={(e) => setEditNormalRange(e.target.value)}
                    placeholder="e.g. 60 - 100 bpm"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Role</label>
                <input
                  type="text"
                  value={editClinicalRole}
                  onChange={(e) => setEditClinicalRole(e.target.value)}
                  placeholder="e.g. Diagnostic confirmation, Monitoring..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">AFib Clinical Relevance</label>
                <textarea
                  rows={3}
                  value={editAfibRelevance}
                  onChange={(e) => setEditAfibRelevance(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Limitations / Caveats</label>
                <textarea
                  rows={2}
                  value={editLimitations}
                  onChange={(e) => setEditLimitations(e.target.value)}
                  placeholder="e.g. Not an AFib diagnostic test alone..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingParam(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
