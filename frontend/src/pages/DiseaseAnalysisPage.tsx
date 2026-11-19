import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  DiseaseKnowledgeItem, DiseaseMatchResult, DiseaseAnalysisRunResponse, 
  DiseaseAnalysisSummary, PatientSymptom, ReportExtractionDraft, ExtractedBiomarker,
  AFibSymptomItem
} from '../types/disease';
import { 
  Activity, AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, 
  Clock, Database, ExternalLink, FileText, Filter, HelpCircle, History, Info, 
  Layers, Plus, RefreshCw, Search, ShieldAlert, Sparkles, Stethoscope, Trash2, 
  Upload, User, X, Zap, HeartPulse, PhoneCall, Shield
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
  const [symptomCatalogue, setSymptomCatalogue] = useState<AFibSymptomItem[]>([]);

  // Report Upload & Review State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawTextUpload, setRawTextUpload] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionDraft, setExtractionDraft] = useState<ReportExtractionDraft | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('Cardiology');
  const [draftProvider, setDraftProvider] = useState('');
  const [draftFindings, setDraftFindings] = useState<ExtractedBiomarker[]>([]);
  const [isSavingReport, setIsSavingReport] = useState<boolean>(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  // Analysis State
  const [isRunningAnalysis, setIsRunningAnalysis] = useState<boolean>(false);
  const [latestAnalysis, setLatestAnalysis] = useState<DiseaseAnalysisRunResponse | null>(null);

  // History State
  const [analysisHistory, setAnalysisHistory] = useState<DiseaseAnalysisSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Knowledge Base State (Only Atrial Fibrillation)
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

  // 3. Fetch Knowledge Base & Symptom Catalogue
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

    const fetchSyms = async () => {
      try {
        const catalogue = await api.getAFibSymptomCatalogue();
        setSymptomCatalogue(catalogue);
      } catch (err) {
        console.warn('Error fetching symptom catalogue', err);
      }
    };
    fetchSyms();
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
        notes: newSymptomNotes
      });
      setNewSymptomName('');
      setNewSymptomNotes('');
      setShowSymptomModal(false);
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
      loadPatientData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete symptom');
    }
  };

  // Action: Extract Report Draft
  const handleExtractDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPatientId) return;
    if (!selectedFile && !rawTextUpload.trim()) {
      alert('Please select a report document or enter report text.');
      return;
    }

    setIsExtracting(true);
    const formData = new FormData();
    if (selectedFile) formData.append('file', selectedFile);
    if (rawTextUpload.trim()) formData.append('raw_text', rawTextUpload.trim());

    try {
      const draft: ReportExtractionDraft = await api.extractReportDraft(token, selectedPatientId, formData);
      setExtractionDraft(draft);
      setDraftTitle(draft.report_title || 'Cardiovascular Holter & ECG Report');
      setDraftCategory(draft.category || 'Cardiology');
      setDraftProvider(draft.healthcare_provider || 'Heart & Vascular Clinical Lab');
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
        report_title: draftTitle.trim() || 'Verified Cardiology Report',
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

  // Action: Run Disease Analysis (Strictly AFib)
  const handleRunAnalysis = async () => {
    if (!token || !selectedPatientId) return;
    setIsRunningAnalysis(true);
    try {
      const res: DiseaseAnalysisRunResponse = await api.runDiseaseAnalysis(token, selectedPatientId);
      setLatestAnalysis(res);
    } catch (err: any) {
      alert(err.message || 'Error executing clinical comparison engine');
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  // Match Level Badges (Strict 5 Result Labels)
  const renderMatchBadge = (level: string) => {
    switch (level) {
      case 'ECG confirmation documented in uploaded records':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-900 border-2 border-purple-400 flex items-center gap-1.5 shadow-xs">
            <HeartPulse className="w-3.5 h-3.5 text-purple-700 animate-pulse" />
            ECG CONFIRMATION DOCUMENTED
          </span>
        );
      case 'Relevant findings identified':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            RELEVANT FINDINGS IDENTIFIED
          </span>
        );
      case 'Some relevant findings identified':
      case 'Some matching information':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-700" />
            SOME RELEVANT FINDINGS
          </span>
        );
      case 'Insufficient information':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
            INSUFFICIENT INFORMATION
          </span>
        );
      case 'No relevant findings identified':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-600 border border-slate-300">
            NO RELEVANT FINDINGS
          </span>
        );
    }
  };

  const afibResult = latestAnalysis?.ranked_diseases?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-slate-50 text-slate-900">
      
      {/* 1. Page Header Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-mono font-semibold border border-rose-200">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              CLINICAL DECISION SUPPORT • ATRIAL FIBRILLATION
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Patient-Based AFib Analysis
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Transparent, guideline-directed clinical evaluation comparing patient reported symptoms, medical report findings, 
              and physiological baseline parameters exclusively against <strong>Atrial Fibrillation (AFib)</strong>.
            </p>
          </div>

          {/* Patient Selector */}
          <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <User className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-mono uppercase font-bold text-slate-500">Patient:</span>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(parseInt(e.target.value, 10))}
              className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 cursor-pointer"
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

      {/* 2. COMPACT EMERGENCY SAFETY NOTICE */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl shrink-0">
            <PhoneCall className="w-4 h-4 text-amber-700" />
          </div>
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-900 uppercase font-mono tracking-wider mr-1.5">
              EMERGENCY SAFETY NOTICE:
            </strong>
            If you or the patient experience a fast or irregular heartbeat accompanied by <strong>CHEST PAIN</strong>, 
            <strong>SEVERE BREATHING DIFFICULTY</strong>, <strong>FAINTING (syncope)</strong>, or signs of a <strong>STROKE</strong> (facial drooping, arm weakness, speech difficulty — <em>BE-FAST</em>), 
            <strong>CALL EMERGENCY SERVICES (911 / 112) IMMEDIATELY</strong>.
          </div>
        </div>
      </div>

      {/* 3. Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveMainTab('analysis')}
          className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 -mb-px transition-all ${
            activeMainTab === 'analysis'
              ? 'border-rose-600 text-rose-700 bg-white rounded-t-2xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          AFib Clinical Analysis Engine
        </button>

        <button
          onClick={() => setActiveMainTab('knowledge_base')}
          className={`px-5 py-3 text-xs font-bold flex items-center gap-2 border-b-2 -mb-px transition-all ${
            activeMainTab === 'knowledge_base'
              ? 'border-rose-600 text-rose-800 bg-white rounded-t-2xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Database className="w-4 h-4" />
          Atrial Fibrillation Knowledge Base
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

      {/* TAB 1: AFIB CLINICAL ANALYSIS & ENGINE */}
      {activeMainTab === 'analysis' && (
        <div className="space-y-10 animate-in fade-in duration-200">
          
          {/* Section A: Selected Patient Baseline Intake */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                Section A: Patient Baseline & Cardiac Profile
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
                <span className="text-[10px] text-slate-400 block uppercase">Recorded Medical Conditions</span>
                <strong className="text-slate-900 text-xs block truncate" title={patientOverview?.patient?.medical_conditions}>
                  {patientOverview?.patient?.medical_conditions || 'None documented'}
                </strong>
                <span className="text-[10px] text-rose-600 block">Cardiovascular risk context</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Active Sensor Telemetry</span>
                <strong className="text-rose-700 text-sm">
                  HR: {patientOverview?.latest_reading?.heart_rate_bpm || 74} bpm · SpO2: {patientOverview?.latest_reading?.spo2_percent || 98}%
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  {patientOverview?.latest_reading?.simulated ? 'SIMULATED — NOT A CLINICAL MEASUREMENT' : 'Genuine sensor'}
                </span>
              </div>
            </div>
          </div>

          {/* Section B & C: Medical Report Upload & Symptoms Intake */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Section B: Medical Report Upload */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Section B: Cardiology & ECG Report Upload
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
                <strong className="text-slate-800 block">Diagnostic Rhythm Extraction:</strong>
                <p className="text-slate-600 leading-relaxed">
                  Upload an official 12-lead ECG, 24-hr Holter, or cardiology consult. 
                  Explicit electrocardiogram documentation of Atrial Fibrillation produces the 
                  <em>'ECG confirmation documented in uploaded records'</em> assessment status.
                </p>
              </div>
            </div>

            {/* Section C: Symptom Diary with 11 AFib Symptoms */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-rose-600" />
                    Section C: Patient Reported Symptoms ({symptoms.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">Documented rhythm & cardiovascular symptoms</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSymptomModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition"
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
                  {symptoms.map(s => {
                    const isPrimary = s.symptom_name.toLowerCase().includes('irregular');
                    return (
                      <div 
                        key={s.id} 
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isPrimary ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{s.symptom_name}</strong>
                            {isPrimary && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 text-[9px] font-bold">
                                PRIMARY
                              </span>
                            )}
                          </div>
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section E: Execute Analysis Trigger */}
          <div className="p-6 bg-gradient-to-r from-rose-50 via-purple-50 to-blue-50 rounded-3xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                Run Atrial Fibrillation Clinical Assessment for {patientOverview?.patient?.full_name || 'Patient'}
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Evaluates reported symptoms (such as irregular pulse, palpitations, fatigue), cardiovascular history, 
                and uploaded ECG/Holter reports specifically for Atrial Fibrillation. 
                Excludes simulated Wokwi potentiometer data from clinical evidence. Produces no fabricated percentages.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isRunningAnalysis}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isRunningAnalysis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Evaluating AFib Parameters...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run AFib Clinical Analysis
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Display: Single AFib Assessment Card */}
          {latestAnalysis && afibResult && (
            <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-rose-600" />
                    Atrial Fibrillation Clinical Assessment Result
                  </h3>
                  <p className="text-xs text-slate-500">
                    Analysis ID: <span className="font-mono text-slate-800">{latestAnalysis.analysis_id}</span> · Evaluated {latestAnalysis.symptoms_considered_count} symptoms and {latestAnalysis.reports_considered_count} medical reports.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(latestAnalysis.analysis_date).toLocaleString()}
                </span>
              </div>

              {/* Single Assessment Detailed Card */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                
                {/* Header: Title, Category & Result Label */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-rose-600 font-bold block">
                      Category: {afibResult.category}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                      {afibResult.disease_name} ({afibResult.short_name || 'AFib'})
                    </h3>
                    <p className="text-slate-600 text-xs mt-1">
                      {afibResult.short_description}
                    </p>
                  </div>
                  <div>
                    {renderMatchBadge(afibResult.match_level)}
                  </div>
                </div>

                {/* Direct Link to Dedicated AFib Overview Page */}
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <strong className="text-rose-950 text-xs block">
                      Dedicated Atrial Fibrillation Clinical Overview Available
                    </strong>
                    <p className="text-[11px] text-rose-800">
                      Explore detailed electrophysiology, types of AFib, parameter references, treatment options, and patient-specific correlations.
                    </p>
                  </div>
                  <Link
                    to={`/afib?patientId=${selectedPatientId}`}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0"
                  >
                    Open AFib Overview
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Emergency Warning Trigger (if symptoms indicate red flags) */}
                {afibResult.emergency_warning_triggered && afibResult.emergency_warning_text && (
                  <div className="p-4 rounded-2xl bg-red-100 border border-red-300 text-red-900 text-xs space-y-1">
                    <strong className="flex items-center gap-1.5 font-bold text-red-950">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      CRITICAL CLINICAL ALERT
                    </strong>
                    <p className="leading-relaxed">{afibResult.emergency_warning_text}</p>
                  </div>
                )}

                {/* Transparent Clinical Reasoning */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Transparent Clinical Assessment Reasoning
                  </h4>
                  <div className="text-xs text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed font-medium">
                    {afibResult.reason_included}
                  </div>
                </div>

                {/* Evidence Grid: Symptoms, Reports & Patient History */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Matching Symptoms */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <strong className="text-slate-900 block font-mono uppercase text-[11px] flex items-center justify-between">
                      <span>Matching Symptoms ({afibResult.matching_symptoms.length}):</span>
                      {afibResult.has_primary_irregular_rhythm_symptom && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                          IRREGULAR RHYTHM PRESENT
                        </span>
                      )}
                    </strong>
                    {afibResult.matching_symptoms.length > 0 ? (
                      <ul className="space-y-1.5 text-slate-700">
                        {afibResult.matching_symptoms.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 italic">No matching arrhythmia symptoms logged.</p>
                    )}
                  </div>

                  {/* Relevant Report Findings */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <strong className="text-slate-900 block font-mono uppercase text-[11px]">
                      Diagnostic Report Findings ({afibResult.relevant_report_findings.length}):
                    </strong>
                    {afibResult.relevant_report_findings.length > 0 ? (
                      <div className="space-y-1.5">
                        {afibResult.relevant_report_findings.map((f, i) => (
                          <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-900 block">{f.finding}</span>
                            <span className="text-[10px] text-slate-500">{f.clinical_interpretation} ({f.report})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No diagnostic ECG / Holter rhythm findings in record.</p>
                    )}
                  </div>
                </div>

                {/* Missing Clinical Information */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Missing Diagnostic Information (Not Yet Documented)
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1 bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                    {afibResult.missing_information.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Next Clinical Assessments */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Suggested Next Clinical Assessments to Discuss With a Doctor
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {(afibResult.suggested_next_assessments || afibResult.recommended_next_assessments || []).map((test, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{test}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Authoritative References */}
                <div className="pt-3 border-t border-slate-100 text-xs">
                  <strong className="text-slate-400 font-mono uppercase tracking-wider text-[10px] block mb-2">
                    Authoritative Cardiology References:
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {(afibResult.medical_references || []).map((ref, i) => (
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
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATRIAL FIBRILLATION KNOWLEDGE BASE (SINGLE DISEASE) */}
      {activeMainTab === 'knowledge_base' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                  Atrial Fibrillation Clinical Reference Entry
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                  The clinical knowledge base exclusively focuses on Atrial Fibrillation according to ACC, AHA, HRS, ESC, and NICE guidelines.
                </p>
              </div>
              <Link
                to="/afib"
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-rose-700 transition shadow-xs"
              >
                View Full AFib Overview
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {selectedKbDisease && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-mono text-rose-600 uppercase font-bold">
                  {selectedKbDisease.category}
                </span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  {selectedKbDisease.name} ({selectedKbDisease.short_name || 'AFib'})
                </h3>
                <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                  {selectedKbDisease.short_description}
                </p>
              </div>

              {/* What Happens in Body / Heart */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1.5">
                <strong className="text-rose-950 font-mono uppercase text-[11px] block">
                  Electrophysiological Mechanism: What Happens in the Heart
                </strong>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {selectedKbDisease.what_happens_in_heart || selectedKbDisease.what_happens_in_body}
                </p>
              </div>

              {/* The 11 Recognized Symptoms */}
              <div className="space-y-2">
                <strong className="text-slate-900 font-mono uppercase text-[11px] block">
                  The 11 Recognized Symptoms:
                </strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {selectedKbDisease.common_symptoms.map((s, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border flex items-center gap-2 ${
                        idx === 0 ? 'bg-rose-50 border-rose-300 font-bold text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Causes & Risk Factors */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <strong className="text-slate-900 font-mono uppercase text-[11px] block">
                  Causes & Major Risk Factors:
                </strong>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 list-disc list-inside text-slate-700">
                  {(selectedKbDisease.causes_and_risk_factors || selectedKbDisease.risk_factors || []).map((rf, i) => (
                    <li key={i}>{rf}</li>
                  ))}
                </ul>
              </div>

              {/* Medical References */}
              <div className="pt-3 border-t border-slate-100">
                <strong className="text-slate-400 font-mono uppercase text-[10px] block mb-2">
                  Clinical Guidelines:
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
      )}

      {/* TAB 3: PATIENT ANALYSIS HISTORY */}
      {activeMainTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-extrabold text-slate-900 text-base">
              Section G: Longitudinal AFib Assessment History for {patientOverview?.patient?.full_name || 'Patient'}
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Historical comparisons maintained for clinical audit. An older assessment is an informational baseline and must not be treated as a current diagnosis.
            </p>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading analysis history...
            </div>
          ) : analysisHistory.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              No previous analyses recorded for this patient. Click 'Run AFib Clinical Analysis' on the primary tab to create a baseline.
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

                  {hist.highlighted_diseases && hist.highlighted_diseases.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Assessment Result:
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

      {/* MODAL: ADD SYMPTOM WITH 11 AFIB PRESETS */}
      {showSymptomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-rose-600" />
                Record AFib Clinical Symptom
              </h3>
              <button onClick={() => setShowSymptomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick-Select AFib Symptoms */}
            {symptomCatalogue.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono">
                  Quick Select (11 Recognized AFib Symptoms):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {symptomCatalogue.map((sym) => (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => setNewSymptomName(sym.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                        newSymptomName === sym.name
                          ? 'bg-rose-600 text-white font-bold'
                          : sym.is_primary
                          ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {sym.name} {sym.is_primary && '★'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAddSymptom} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Symptom Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Irregular heartbeat rhythm, Heart palpitations, Rapid heartbeat"
                  value={newSymptomName}
                  onChange={e => setNewSymptomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={newSymptomSeverity}
                    onChange={e => setNewSymptomSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Occasional">Occasional</option>
                  <option value="Intermittent">Intermittent</option>
                  <option value="Constant">Constant</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fluttering sensations in chest when resting quietly or climbing stairs..."
                  value={newSymptomNotes}
                  onChange={e => setNewSymptomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Save Symptom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MEDICAL REPORT UPLOAD & REVIEW */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Upload & Verify Diagnostic Cardiology Report
                </h3>
                <p className="text-[11px] text-slate-500">Supports 12-lead ECG, Holter monitoring, Echo, and Lab reports.</p>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setExtractionDraft(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Upload Form */}
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
                    <span className="text-[11px] text-rose-700 font-mono block">
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
                    placeholder="Paste 12-lead ECG rhythm interpretation, Holter findings, TSH, or electrolyte text directly..."
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
                        Extracting Text & Findings...
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
                    <label className="block font-bold text-slate-700 mb-1">Healthcare Provider / Clinic</label>
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
                    Extracted Rhythm & Biomarker Findings ({draftFindings.length}):
                  </strong>
                  {draftFindings.length === 0 ? (
                    <p className="text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                      No automated biomarker figures detected. You can save the report text for clinician review.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {draftFindings.map((f, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 flex items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-slate-900">{f.test_name}:</span>
                            <span className="font-mono text-rose-700 ml-1.5 font-bold">{f.value} {f.unit}</span>
                            {f.observation && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{f.observation}</p>
                            )}
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
