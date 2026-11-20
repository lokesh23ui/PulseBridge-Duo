import React, { useEffect, useState } from 'react';
import { 
  BookOpen, Save, RefreshCw, AlertTriangle, CheckCircle2, 
  Info, Activity, Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminAFibKnowledge } from '../../types/admin';

export const AdminAFibPage: React.FC = () => {
  const { token } = useAuth();
  const [knowledge, setKnowledge] = useState<AdminAFibKnowledge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [shortDescription, setShortDescription] = useState('');
  const [whatHappens, setWhatHappens] = useState('');
  const [types, setTypes] = useState<Array<{ type_name: string; duration: string; clinical_significance: string }>>([]);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [diagnosticMethods, setDiagnosticMethods] = useState<string[]>([]);

  const fetchKnowledge = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminAFibKnowledge(token);
      setKnowledge(data);
      setShortDescription(data.short_description || '');
      setWhatHappens(data.what_happens_in_heart || '');
      setTypes(data.types || []);
      setRiskFactors(data.causes_and_risk_factors || []);
      setDiagnosticMethods(data.diagnostic_methods || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AFib clinical knowledge');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSavedSuccess(false);
    setError(null);
    try {
      const payload = {
        short_description: shortDescription,
        what_happens_in_heart: whatHappens,
        types: types,
        causes_and_risk_factors: riskFactors,
        diagnostic_methods: diagnosticMethods,
        when_to_seek_care: knowledge?.when_to_seek_care,
        global_statistics: knowledge?.global_statistics
      };
      await api.updateAdminAFibKnowledge(token, payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update AFib clinical knowledge');
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (idx: number, field: string, val: string) => {
    setTypes(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  };

  if (loading && !knowledge) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
          <span>Loading Atrial Fibrillation clinical knowledge...</span>
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
              Single-Disease Knowledge Repository
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-600 font-bold">Exclusively Atrial Fibrillation (AFib)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AFib Clinical Knowledge Management
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage cardiology references, pathophysiology explanations, clinical types, and diagnostic standards. Updates immediately reflect in the public overview.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchKnowledge}
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
            {saving ? 'Publishing...' : 'Publish Knowledge'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>AFib clinical knowledge updated successfully and logged in the immutable audit trail!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Knowledge Editor */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 font-mono">
            Short Clinical Description
          </label>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 font-mono">
            Pathophysiology ("What Happens in the Heart")
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Detailed explanation of chaotic electrical impulses, pulmonary vein triggers, and loss of AV synchrony.
          </p>
          <textarea
            rows={5}
            value={whatHappens}
            onChange={(e) => setWhatHappens(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white leading-relaxed"
            required
          />
        </div>

        {/* 4 Clinical Types Editor */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Clinical Types of Atrial Fibrillation (ACC/AHA Classifications)
              </h3>
              <p className="text-[11px] text-slate-500">
                Paroxysmal, Persistent, Long-standing Persistent, and Permanent.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              4 Recognized Types
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {types.map((t, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{t.type_name}</span>
                  <span className="text-[10px] font-mono text-purple-600 font-bold">Type #{idx + 1}</span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1">Duration Criterion</label>
                  <input
                    type="text"
                    value={t.duration}
                    onChange={(e) => handleTypeChange(idx, 'duration', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1">Clinical Significance & Strategy</label>
                  <textarea
                    rows={2}
                    value={t.clinical_significance}
                    onChange={(e) => handleTypeChange(idx, 'clinical_significance', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Statistics Preview Card */}
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-purple-900">
            <Info className="w-4 h-4 text-purple-600" />
            <span>Global Burden of Disease Epidemiology Alignment</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Prevalence metrics (37.5M global cases, 1 in 3 lifetime risk, 20-30% ischemic strokes) are backed by the ACC/AHA 2023 AFib Guidelines and European Society of Cardiology.
          </p>
        </div>
      </div>
    </form>
  );
};
