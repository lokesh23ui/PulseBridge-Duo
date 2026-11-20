import React, { useEffect, useState } from 'react';
import { 
  Stethoscope, RefreshCw, AlertTriangle, CheckCircle2, 
  Lock, Edit3, X, Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminSymptom } from '../../types/admin';

export const AdminSymptomsPage: React.FC = () => {
  const { token } = useAuth();
  const [symptoms, setSymptoms] = useState<AdminSymptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingSymptom, setEditingSymptom] = useState<AdminSymptom | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSeverity, setEditSeverity] = useState('Moderate');
  const [editClinicalNote, setEditClinicalNote] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchSymptoms = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminSymptoms(token);
      setSymptoms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load symptoms catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSymptoms();
  }, [token]);

  const handleOpenEdit = (sym: AdminSymptom) => {
    setEditingSymptom(sym);
    setEditName(sym.name);
    setEditDesc(sym.description);
    setEditSeverity(sym.typical_severity || 'Moderate');
    setEditClinicalNote(sym.clinical_significance || '');
    setEditIsActive(sym.is_active);
    setEditSortOrder(sym.sort_order);
  };

  const handleSaveSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingSymptom) return;
    setSaving(true);
    try {
      await api.updateAdminSymptom(token, editingSymptom.symptom_key, {
        name: editName,
        description: editDesc,
        typical_severity: editSeverity,
        clinical_significance: editClinicalNote,
        is_active: editIsActive,
        sort_order: editSortOrder
      });
      setEditingSymptom(null);
      await fetchSymptoms();
    } catch (err: any) {
      alert(`Error updating symptom: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              AFib Clinical Manifestations
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500 font-mono">{symptoms.length} Symptoms Catalogued</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AFib Symptoms Catalog Management
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage clinical notes and descriptions for AFib manifestations. Symptom #1 is locked as the primary clinical hallmark.
          </p>
        </div>

        <button
          onClick={fetchSymptoms}
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

      {/* Priority 1 Highlight Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Clinical Rule Enforced:</strong> "Irregular heartbeat rhythm" remains permanently fixed at Rank #1 as the primary hallmark of Atrial Fibrillation.
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
          Rank #1 Protected
        </span>
      </div>

      {/* Symptoms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {symptoms.map((s, idx) => (
          <div 
            key={s.symptom_key} 
            className={`bg-white border rounded-2xl p-4 shadow-xs transition-all space-y-3 ${
              s.is_primary ? 'border-purple-300 ring-1 ring-purple-100' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 font-mono text-xs font-bold flex items-center justify-center">
                  #{s.sort_order || idx + 1}
                </span>
                <span className="font-bold text-slate-900 text-xs">{s.name}</span>
                {s.is_primary && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                    Primary
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  s.is_active 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit symptom details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {s.description}
            </p>

            {s.clinical_significance && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-mono">
                <span className="text-purple-700 font-bold block mb-0.5">Clinical Note:</span>
                {s.clinical_significance}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Symptom Modal */}
      {editingSymptom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveSymptom} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-purple-600" />
                Edit Symptom Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingSymptom(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Symptom Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Significance (Guideline Notes)</label>
                <textarea
                  rows={3}
                  value={editClinicalNote}
                  onChange={(e) => setEditClinicalNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Typical Severity</label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2 text-slate-700 font-semibold">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      disabled={editingSymptom.symptom_key === 'irregular_heartbeat_rhythm'}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Active in Public Catalogue</span>
                  </label>
                  {editingSymptom.symptom_key === 'irregular_heartbeat_rhythm' && (
                    <span className="text-[10px] text-amber-700 font-mono">Primary symptom cannot be deactivated</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSymptom(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
