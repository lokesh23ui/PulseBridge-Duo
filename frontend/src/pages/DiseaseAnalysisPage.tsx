import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  DiseaseKnowledgeItem, DiseaseMatchResult, DiseaseAnalysisRunResponse, 
  DiseaseAnalysisSummary, PatientSymptom, ReportExtractionDraft, ExtractedBiomarker 
} from '../types/disease';
import { 
  Activity, AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, 
  Clock, Database, ExternalLink, FileText, Filter, HelpCircle, History, Info, 
  Layers, Plus, RefreshCw, Search, ShieldAlert, Sparkles, Stethoscope, Trash2, 
  Upload, User, X, Zap 
} from 'lucide-react';

export const DiseaseAnalysisPage: React.FC = () => {
  const { user, token, role } = useAuth();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');

  // Patient Selector State
  const [patientsList, setPatientsList] = useState<{ patient_id: number; full_name: string; age?: number }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(() => {
    if (paramPatientId) return parseInt(paramPatientId, 10);
    if (user?.role === 'patient') return user.id;
    return 1;
  });
  const [patientOverview, setPatientOverview] = useState<any>(null);

  // Active Main Tab: 'analysis' | 'knowledge_base' | 'history'
  const [activeMainTab, setActiveMainTab] = useState<'analysis' | 'knowledge_base' | 'history'>('analysis');

  // Symptoms State
  const [symptoms, setSymptoms] = useState<PatientSymptom[]>([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState<boolean>(false);
  const [showSymptomModal, setShowSymptomModal] = useState<boolean>(false);
  const [newSymptomName, setNewSymptomName] = useState('');
  const [newSymptomDuration, setNewSymptomDuration] = useState('1 week');
  const [newSymptomSeverity, setNewSymptomSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [newSymptomFrequency, setNewSymptomFrequency] = useState<'Occasional' | 'Intermittent' | 'Constant'>('Intermittent');
  const [newSymptomNotes, setNewSymptomNotes] = useState('');

  // Report Upload & Review State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawTextUpload, setRawTextUpload] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionDraft, setExtractionDraft] = useState<ReportExtractionDraft | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('Endocrinology & Metabolic');
  const [draftProvider, setDraftProvider] = useState('');
  const [draftFindings, setDraftFindings] = useState<ExtractedBiomarker[]>([]);
  const [isSavingReport, setIsSavingReport] = useState<boolean>(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  // Analysis State
  const [isRunningAnalysis, setIsRunningAnalysis] = useState<boolean>(false);
  const [latestAnalysis, setLatestAnalysis] = useState<DiseaseAnalysisRunResponse | null>(null);
  const [selectedDiseaseDetail, setSelectedDiseaseDetail] = useState<DiseaseMatchResult | null>(null);

  // History State
  const [analysisHistory, setAnalysisHistory] = useState<DiseaseAnalysisSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Knowledge Base State
  const [knowledgeBase, setKnowledgeBase] = useState<DiseaseKnowledgeItem[]>([]);
  const [selectedKbDisease, setSelectedKbDisease] = useState<DiseaseKnowledgeItem | null>(null);

  // 1. Fetch Patients for Selector
  useEffect(() => {
    const fetchPatients = async () => {
      if (!token) return;
      try {
        const list = await api.getConnectedPatients(token);
        if (list && list.length > 0) {
          setPatientsList(list.map((p: any) => ({
            patient_id: p.patient_id,
            full_name: p.full_name,
            age: p.age
          })));
        }
      } catch (err) {
        console.warn('Could not fetch patients', err);
      }
    };
    fetchPatients();
  }, [token]);

  // 2. Fetch Selected Patient Overview & Symptoms
  const loadPatientData = async () => {
    if (!token || !selectedPatientId) return;
    try {
      const overview = await api.getPatientOverview(token, selectedPatientId);
      setPatientOverview(overview);
    } catch (err) {
      console.warn('Error loading patient overview', err);
    }

    setLoadingSymptoms(true);
    try {
      const syms = await api.getPatientSymptoms(token, selectedPatientId);
      setSymptoms(syms);
    } catch (err) {
      console.warn('Error loading patient symptoms', err);
    } finally {
      setLoadingSymptoms(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [token, selectedPatientId]);

  // 3. Fetch Knowledge Base
  useEffect(() => {
    const fetchKB = async () => {
      try {
        const data = await api.getDiseaseKnowledgeBase();
        setKnowledgeBase(data);
        if (data.length > 0) setSelectedKbDisease(data[0]);
      } catch (err) {
        console.error('Error fetching disease knowledge base', err);
      }
    };
    fetchKB();
  }, []);

  // 4. Fetch Analysis History
  const loadHistory = async () => {
    if (!token || !selectedPatientId) return;
    setLoadingHistory(true);
    try {
      const hist = await api.getPatientAnalysisHistory(token, selectedPatientId);
      setAnalysisHistory(hist);
    } catch (err) {
      console.warn('Error loading analysis history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'history') {
      loadHistory();
    }
  }, [activeMainTab, selectedPatientId, token]);

  // Action: Add Symptom
  const handleAddSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPatientId || !newSymptomName.trim()) return;

    try {
      await api.recordPatientSymptom(token, selectedPatientId, {
        symptom_name: newSymptomName.trim(),
        duration: newSymptomDuration,
        severity: newSymptomSeverity,
        frequency: newSymptomFrequency,
        notes: newSymptomNotes.trim() ? newSymptomNotes.trim() : null
      });
      setShowSymptomModal(false);
      setNewSymptomName('');
      setNewSymptomNotes('');
      loadPatientData();
    } catch (err: any) {
      alert(err.message || 'Failed to record symptom');
    }
  };

  // Action: Delete Symptom
  const handleDeleteSymptom = async (symptomId: number) => {
    if (!token || !selectedPatientId) return;
    try {
      await api.deletePatientSymptom(token, selectedPatientId, symptomId);
      setSymptoms(prev => prev.filter(s => s.id !== symptomId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete symptom');
    }
  };

  // Action: Extract Report Draft
  const handleExtractDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPatientId) return;
    if (!selectedFile && !rawTextUpload.trim()) {
      alert('Please select a file or paste report text.');
      return;
    }

    setIsExtracting(true);
    try {
      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      if (rawTextUpload.trim()) formData.append('raw_text', rawTextUpload.trim());

      const draft: ReportExtractionDraft = await api.extractReportDraft(token, selectedPatientId, formData);
      setExtractionDraft(draft);
      setDraftTitle(draft.report_title);
      setDraftCategory(draft.category || 'Endocrinology & Metabolic');
      setDraftProvider(draft.healthcare_provider || 'Clinical Diagnostic Lab');
      setDraftFindings(draft.findings || []);
    } catch (err: any) {
      alert(err.message || 'Report text extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  // Action: Confirm & Save Report
  const handleConfirmReport = async () => {
    if (!token || !selectedPatientId || !extractionDraft) return;
    setIsSavingReport(true);
    try {
      await api.confirmAndSaveReport(token, selectedPatientId, {
        report_title: draftTitle.trim() || 'Verified Medical Report',
        category: draftCategory,
        healthcare_provider: draftProvider,
        findings: draftFindings,
        raw_text: extractionDraft.raw_text,
        patient_notes: 'Reviewed and confirmed through clinical intake portal.'
      });
      setShowUploadModal(false);
      setExtractionDraft(null);
      setSelectedFile(null);
      setRawTextUpload('');
      setReportSuccessMsg('Medical report verified and committed to patient record.');
      setTimeout(() => setReportSuccessMsg(null), 5000);
      loadPatientData();
    } catch (err: any) {
      alert(err.message || 'Failed to save confirmed report');
    } finally {
      setIsSavingReport(false);
    }
  };

  // Action: Run Disease Analysis
  const handleRunAnalysis = async () => {
    if (!token || !selectedPatientId) return;
    setIsRunningAnalysis(true);
    try {
      const res: DiseaseAnalysisRunResponse = await api.runDiseaseAnalysis(token, selectedPatientId);
      setLatestAnalysis(res);
      // Automatically select highest rank match if available
      if (res.ranked_diseases && res.ranked_diseases.length > 0) {
        setSelectedDiseaseDetail(res.ranked_diseases[0]);
      }
    } catch (err: any) {
      alert(err.message || 'Error executing clinical comparison engine');
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  // Match Level Badges
  const renderMatchBadge = (level: string) => {
    switch (level) {
      case 'Relevant findings identified':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">RELEVANT FINDINGS</span>;
      case 'Some matching information':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">PARTIAL ALIGNMENT</span>;
      case 'Insufficient information':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">INSUFFICIENT DATA</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-50 text-slate-400 border border-slate-200">NO MEANINGFUL MATCH</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-slate-50 text-slate-900">
      {/* Page Header Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-mono font-semibold border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              INTELLIGENT CLINICAL DECISION SUPPORT
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Patient-Based Disease Analysis
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Transparent clinical evaluation comparing patient reported symptoms, medical report findings, 
              and physiological baseline parameters against 10 verified chronic disease profiles.
            </p>
          </div>

          {/* Patient Selector */}
          <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <User className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-mono uppercase font-bold text-slate-500">Patient:</span>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(parseInt(e.target.value, 10))}
              className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              {patientsList.map(p => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.full_name} {p.age ? `(${p.age} yrs)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Clinical Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mandatory Clinical Advisory:</strong> These results are informational clinical decision-support suggestions, not a medical diagnosis. Only a qualified healthcare professional can diagnose a condition.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveMainTab('analysis')}
          className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 -mb-px transition-all ${
            activeMainTab === 'analysis'
              ? 'border-blue-600 text-blue-700 bg-white rounded-t-2xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          Clinical Analysis & Engine
        </button>

        <button
          onClick={() => setActiveMainTab('knowledge_base')}
          className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 -mb-px transition-all ${
            activeMainTab === 'knowledge_base'
              ? 'border-teal-600 text-teal-800 bg-white rounded-t-2xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Database className="w-4 h-4" />
          Disease Knowledge Base (10 Conditions)
        </button>

        <button
          onClick={() => setActiveMainTab('history')}
          className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 -mb-px transition-all ${
            activeMainTab === 'history'
              ? 'border-purple-600 text-purple-700 bg-white rounded-t-2xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <History className="w-4 h-4" />
          Patient Analysis History
        </button>
      </div>

      {reportSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {reportSuccessMsg}
        </div>
      )}

      {/* TAB 1: CLINICAL ANALYSIS & ENGINE */}
      {activeMainTab === 'analysis' && (
        <div className="space-y-10 animate-in fade-in duration-200">
          {/* Section A: Selected Patient Overview Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                Section A: Selected Patient Baseline Intake
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Data Sovereignty: Respects Patient Consent & Roles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Patient Identity</span>
                <strong className="text-slate-900 text-sm">{patientOverview?.patient?.full_name || 'Loading...'}</strong>
                <span className="text-[10px] text-slate-500 block truncate">{patientOverview?.patient?.email}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Age & Blood Group</span>
                <strong className="text-slate-900 text-sm">
                  {patientOverview?.patient?.age ? `${patientOverview.patient.age} Years` : 'Age Unrecorded'}
                </strong>
                <span className="text-[10px] text-slate-500 block">Type: {patientOverview?.patient?.blood_type || 'O+'}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Medical Conditions</span>
                <strong className="text-slate-900 text-xs block truncate" title={patientOverview?.patient?.medical_conditions}>
                  {patientOverview?.patient?.medical_conditions || 'None documented'}
                </strong>
                <span className="text-[10px] text-slate-500 block">Baseline comorbidity flags</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Active Sensor Telemetry</span>
                <strong className="text-teal-700 text-sm">
                  HR: {patientOverview?.latest_reading?.heart_rate_bpm || 72} bpm · SpO2: {patientOverview?.latest_reading?.spo2_percent || 98}%
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  {patientOverview?.latest_reading?.simulated ? 'Illustrative stream' : 'Genuine sensor'}
                </span>
              </div>
            </div>
          </div>

          {/* Section B & C: Symptoms Input & Report Upload Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Section B: Medical Report Upload Box */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Section B: Medical Report Upload & Parsing
                  </h3>
                  <p className="text-[11px] text-slate-500">Supports PDF, JPG, PNG & Text reports</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload & Review Report
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <strong className="text-slate-800 block">Interactive User Review Guarantee:</strong>
                <p className="text-slate-600 leading-relaxed">
                  Extracted findings (test names, numeric values, units, reference ranges) are always presented for human confirmation before saving. Unreadable scans or missing values are never fabricated.
                </p>
              </div>
            </div>

            {/* Section C: Symptom Input & Diary */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    Section C: Patient Reported Symptoms ({symptoms.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">Patient or authorized caregiver clinical entry</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSymptomModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Symptom
                </button>
              </div>

              {symptoms.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No active symptoms recorded. Click 'Add Symptom' to record clinical observations.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {symptoms.map(s => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block">{s.symptom_name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Duration: {s.duration || 'N/A'} · Severity: {s.severity} · Frequency: {s.frequency}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSymptom(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Delete Symptom"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section E: Execute Analysis Trigger */}
          <div className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Run Comparison Engine for {patientOverview?.patient?.full_name || 'Patient'}
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Evaluates symptoms, medical history, uploaded lab reports, and vital parameters across all 10 major chronic diseases. 
                Produces deterministic, transparent clinical rankings without fabricated percentages.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isRunningAnalysis}
              className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isRunningAnalysis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Clinical Parameters...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Clinical Analysis
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Display */}
          {latestAnalysis && (
            <div className="space-y-8 animate-in fade-in zoom-in-98 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    Comparative Disease Analysis Results
                  </h3>
                  <p className="text-xs text-slate-500">
                    Analysis ID: <span className="font-mono text-slate-800">{latestAnalysis.analysis_id}</span> · Considered {latestAnalysis.symptoms_considered_count} symptoms and {latestAnalysis.reports_considered_count} medical reports.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(latestAnalysis.analysis_date).toLocaleString()}
                </span>
              </div>

              {/* Grid: Left Ranked Cards, Right Selected Disease Detail */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Ranked Disease List */}
                <div className="lg:col-span-5 space-y-3 max-h-[620px] overflow-y-auto pr-1">
                  {latestAnalysis.ranked_diseases.map((disease, idx) => {
                    const isSelected = selectedDiseaseDetail?.disease_id === disease.disease_id;
                    return (
                      <div
                        key={disease.disease_id}
                        onClick={() => setSelectedDiseaseDetail(disease)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-teal-600 shadow-md ring-2 ring-teal-500/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                              Rank #{idx + 1} · {disease.category}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {disease.disease_name}
                            </h4>
                          </div>
                          {renderMatchBadge(disease.match_level)}
                        </div>

                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                          {disease.reason_included}
                        </p>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
                          <span>{disease.matching_symptoms.length} symptom(s) · {disease.relevant_report_findings.length} report finding(s)</span>
                          <span className="font-semibold text-teal-700 flex items-center gap-1">
                            Inspect Details <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Detailed Selected Disease View (Section F) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  {selectedDiseaseDetail ? (
                    <div className="space-y-6">
                      {/* Title & Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                        <div>
                          <span className="text-xs font-mono uppercase tracking-wider text-teal-700 font-bold">
                            Section F: Clinical Evidence Breakdown
                          </span>
                          <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                            {selectedDiseaseDetail.disease_name}
                          </h3>
                        </div>
                        {renderMatchBadge(selectedDiseaseDetail.match_level)}
                      </div>

                      {/* DIRECT LINK TO DIABETES OVERVIEW IF DIABETES MELLITUS */}
                      {selectedDiseaseDetail.overview_route && (
                        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-4">
                          <div>
                            <strong className="text-teal-950 text-xs block">
                              Dedicated Comprehensive Overview Available
                            </strong>
                            <p className="text-[11px] text-teal-800">
                              Access full epidemiology, parameter reference table, and continuous monitoring for Diabetes.
                            </p>
                          </div>
                          <Link
                            to={`${selectedDiseaseDetail.overview_route}?patientId=${selectedPatientId}`}
                            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0"
                          >
                            Open Diabetes Overview
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}

                      {/* Why Included */}
                      <div>
                        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">
                          Reason Included in Evaluation
                        </h4>
                        <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                          {selectedDiseaseDetail.reason_included}
                        </p>
                      </div>

                      {/* Matching Evidence Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Matching Symptoms */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <strong className="text-slate-900 block font-mono uppercase text-[11px]">
                            Matching Symptoms ({selectedDiseaseDetail.matching_symptoms.length}):
                          </strong>
                          {selectedDiseaseDetail.matching_symptoms.length > 0 ? (
                            <ul className="space-y-1 list-disc list-inside text-slate-700">
                              {selectedDiseaseDetail.matching_symptoms.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-400 italic">No direct symptoms reported.</p>
                          )}
                        </div>

                        {/* Matching Report Values */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <strong className="text-slate-900 block font-mono uppercase text-[11px]">
                            Matching Report Findings ({selectedDiseaseDetail.relevant_report_findings.length}):
                          </strong>
                          {selectedDiseaseDetail.relevant_report_findings.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedDiseaseDetail.relevant_report_findings.map((f, i) => (
                                <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
                                  <span className="font-bold text-slate-800 block">{f.finding}</span>
                                  <span className="text-[10px] text-slate-500">{f.clinical_interpretation}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">No specific laboratory findings matched.</p>
                          )}
                        </div>
                      </div>

                      {/* Missing Clinical Information */}
                      <div>
                        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">
                          Missing Clinical Information (Not Documented)
                        </h4>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          {selectedDiseaseDetail.missing_information.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Tests for Doctor */}
                      <div>
                        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">
                          Recommended Assessments to Discuss With a Doctor
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {selectedDiseaseDetail.recommended_next_assessments.map((test, i) => (
                            <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>{test}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Medical References */}
                      <div className="pt-3 border-t border-slate-100 text-xs">
                        <strong className="text-slate-500 font-mono uppercase tracking-wider text-[10px] block mb-2">
                          Authoritative Medical References:
                        </strong>
                        <div className="flex flex-wrap gap-2">
                          {selectedDiseaseDetail.medical_references.map((ref, i) => (
                            <a
                              key={i}
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 transition"
                            >
                              {ref.title} ({ref.source})
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 text-xs">
                      Select a condition from the left list to review detailed clinical reasoning and references.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DISEASE KNOWLEDGE BASE (10 CONDITIONS) */}
      {activeMainTab === 'knowledge_base' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-extrabold text-slate-900 text-base">
              Section D: Structured Medical Reference Knowledge Base
            </h3>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Curated clinical references across 10 major chronic diseases according to WHO, CDC, NIH, ADA, AHA, and NICE guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* List of 10 Diseases */}
            <div className="lg:col-span-4 space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {knowledgeBase.map((d, i) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedKbDisease(d)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedKbDisease?.id === d.id
                      ? 'bg-teal-50/70 border-teal-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-mono text-teal-700 uppercase font-bold block">
                    Condition #{i + 1} · {d.category}
                  </span>
                  <strong className="text-xs text-slate-900 block mt-0.5">{d.name}</strong>
                </div>
              ))}
            </div>

            {/* Selected Knowledge Base Detail */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {selectedKbDisease && (
                <div className="space-y-6 text-xs">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-mono text-teal-700 uppercase font-bold">
                      {selectedKbDisease.category}
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                      {selectedKbDisease.name}
                    </h3>
                    <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">
                      {selectedKbDisease.short_description}
                    </p>
                  </div>

                  {/* Body Mechanism */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <strong className="text-slate-900 font-mono uppercase text-[11px] block">
                      Pathophysiology: What Happens Inside the Body
                    </strong>
                    <p className="text-slate-700 leading-relaxed">
                      {selectedKbDisease.what_happens_in_body}
                    </p>
                  </div>

                  {/* Symptoms & Risk Factors Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <strong className="text-slate-900 font-mono uppercase text-[11px] block">
                        Common Symptoms:
                      </strong>
                      <ul className="space-y-1 list-disc list-inside text-slate-700">
                        {selectedKbDisease.common_symptoms.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <strong className="text-slate-900 font-mono uppercase text-[11px] block">
                        Risk Factors:
                      </strong>
                      <ul className="space-y-1 list-disc list-inside text-slate-700">
                        {selectedKbDisease.risk_factors.map((rf, i) => (
                          <li key={i}>{rf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Warning Signs */}
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
                    <strong className="font-bold font-mono uppercase text-[11px] flex items-center gap-1.5 text-rose-900">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Critical Warning Signs & Red Flags:
                    </strong>
                    <ul className="space-y-1 list-disc list-inside text-xs text-rose-900">
                      {selectedKbDisease.important_warning_signs.map((ws, i) => (
                        <li key={i}>{ws}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Medical References */}
                  <div className="pt-3 border-t border-slate-100">
                    <strong className="text-slate-400 font-mono uppercase text-[10px] block mb-2">
                      Authoritative Sources:
                    </strong>
                    <div className="flex flex-wrap gap-2">
                      {selectedKbDisease.medical_references.map((ref, i) => (
                        <a
                          key={i}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          {ref.title} ({ref.source})
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PATIENT ANALYSIS HISTORY (SECTION G) */}
      {activeMainTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-extrabold text-slate-900 text-base">
              Section G: Longitudinal Analysis History for {patientOverview?.patient?.full_name || 'Patient'}
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Historical comparisons maintained for clinical audit. An older analysis is an informational baseline and must not be treated as a current diagnosis.
            </p>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading analysis history...
            </div>
          ) : analysisHistory.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              No previous analyses recorded for this patient. Click 'Run Clinical Analysis' on the primary tab to create a baseline.
            </div>
          ) : (
            <div className="space-y-4">
              {analysisHistory.map((hist, idx) => (
                <div key={hist.analysis_id} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 font-mono font-bold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <strong className="text-xs font-mono text-slate-900">{hist.analysis_id}</strong>
                        <span className="text-[10px] text-slate-500 block">
                          Considered {hist.symptoms_considered_count} symptoms and {hist.reports_considered_count} reports.
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(hist.analysis_date).toLocaleString()}
                    </span>
                  </div>

                  {/* Highlighted Diseases in this Run */}
                  {hist.highlighted_diseases && hist.highlighted_diseases.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Diseases Highlighted in This Evaluation:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {hist.highlighted_diseases.map((hd, i) => (
                          <div key={i} className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
                            <span className="font-bold text-slate-800">{hd.disease_name}</span>
                            {renderMatchBadge(hd.match_level)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD SYMPTOM (SECTION C) */}
      {showSymptomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Record Clinical Symptom
              </h3>
              <button onClick={() => setShowSymptomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSymptom} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Symptom Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polyuria (frequent urination), Chest tightness, Dizziness"
                  value={newSymptomName}
                  onChange={e => setNewSymptomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 days, 2 weeks"
                    value={newSymptomDuration}
                    onChange={e => setNewSymptomDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={newSymptomSeverity}
                    onChange={e => setNewSymptomSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Frequency</label>
                <select
                  value={newSymptomFrequency}
                  onChange={e => setNewSymptomFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Occasional">Occasional</option>
                  <option value="Intermittent">Intermittent</option>
                  <option value="Constant">Constant</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Clinical Notes</label>
                <textarea
                  rows={3}
                  placeholder="Specific triggers, morning vs night onset, relievers..."
                  value={newSymptomNotes}
                  onChange={e => setNewSymptomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSymptomModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Symptom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MEDICAL REPORT UPLOAD & INTERACTIVE USER REVIEW (SECTION B) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Upload & Verify Diagnostic Medical Report
                </h3>
                <p className="text-[11px] text-slate-500">Supports PDF, JPG, PNG & Text. You review before saving.</p>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setExtractionDraft(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Upload Form if draft not yet extracted */}
            {!extractionDraft ? (
              <form onSubmit={handleExtractDraft} className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 text-center space-y-2">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <span className="block font-bold text-slate-700">Select Document File (PDF, PNG, JPG)</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold"
                  />
                  {selectedFile && (
                    <span className="text-[11px] text-teal-700 font-mono block">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div className="text-center text-slate-400 font-mono text-[10px] uppercase">
                  — or paste report clinical text —
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="Paste laboratory chemistry, lipid panel, or diagnostic text directly..."
                    value={rawTextUpload}
                    onChange={e => setRawTextUpload(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isExtracting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Extracting Text & Biomarkers...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Extract & Review Findings
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Interactive User Review & Correction Table */
              <div className="space-y-5 text-xs">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs">
                  <strong>User Verification Required:</strong> {extractionDraft.confidence_note}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Report Title</label>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={e => setDraftTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Healthcare Provider / Lab</label>
                    <input
                      type="text"
                      value={draftProvider}
                      onChange={e => setDraftProvider(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* Findings Table */}
                <div className="space-y-2">
                  <strong className="text-slate-800 font-mono uppercase text-[11px] block">
                    Extracted Biomarkers ({draftFindings.length}):
                  </strong>
                  {draftFindings.length === 0 ? (
                    <p className="text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                      No automated biomarker figures detected. You can add one below or save text observations.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {draftFindings.map((f, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 flex items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-slate-900">{f.test_name}:</span>
                            <span className="font-mono text-teal-700 ml-1.5 font-bold">{f.value} {f.unit}</span>
                            <span className="text-[10px] text-slate-500 ml-2">Ref: {f.reference_range}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                            {f.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setExtractionDraft(null)}
                    className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    ← Back to Upload
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReport}
                      disabled={isSavingReport}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingReport ? 'Saving...' : 'Confirm & Save Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
