import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DiabetesOverviewData, PatientDiabetesRelation } from '../types/disease';
import { 
  Activity, AlertTriangle, CheckCircle2, ChevronRight, Database, 
  ExternalLink, FileText, Globe, Heart, HelpCircle, Info, ShieldAlert, 
  Sparkles, Stethoscope, User, Zap 
} from 'lucide-react';

export const DiabetesOverviewPage: React.FC = () => {
  const { user, token, isAuthenticated, role } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedPatientId = searchParams.get('patientId');

  // Overview Data
  const [overviewData, setOverviewData] = useState<DiabetesOverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  // Patient Relation State
  const [patientsList, setPatientsList] = useState<{ patient_id: number; full_name: string; age?: number }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(() => {
    if (requestedPatientId) return parseInt(requestedPatientId, 10);
    if (user?.role === 'patient') return user.id;
    return 1;
  });
  const [patientRelation, setPatientRelation] = useState<PatientDiabetesRelation | null>(null);
  const [loadingRelation, setLoadingRelation] = useState<boolean>(false);
  const [relationError, setRelationError] = useState<string | null>(null);

  // Active Type Tab in Introduction
  const [activeTypeTab, setActiveTypeTab] = useState<'type1' | 'type2' | 'gestational'>('type2');

  // 1. Fetch Global Diabetes Overview
  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const data = await api.getDiabetesOverview();
        setOverviewData(data);
      } catch (err) {
        console.error('Failed to load diabetes overview', err);
      } finally {
        setLoadingOverview(false);
      }
    };
    fetchOverview();
  }, []);

  // 2. Fetch Connected Patients List for Selector
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
          // Default to first patient if current selected not in list
          if (!requestedPatientId && role === 'caregiver') {
            setSelectedPatientId(list[0].patient_id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch connected patients list', err);
      }
    };
    fetchPatients();
  }, [token, role, requestedPatientId]);

  // 3. Fetch Patient-Specific Diabetes Relation
  useEffect(() => {
    const fetchRelation = async () => {
      if (!token || !selectedPatientId) return;
      setLoadingRelation(true);
      setRelationError(null);
      try {
        const rel = await api.getPatientDiabetesRelation(token, selectedPatientId);
        setPatientRelation(rel);
      } catch (err: any) {
        setRelationError(err.message || 'Unable to access patient clinical record');
        setPatientRelation(null);
      } finally {
        setLoadingRelation(false);
      }
    };
    fetchRelation();
  }, [token, selectedPatientId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-slate-50 text-slate-900">
      {/* Header Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-mono font-semibold border border-teal-200">
              <Stethoscope className="w-3.5 h-3.5" />
              CLINICAL SPECIALTY FOCUS
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Diabetes Mellitus Overview
            </h1>
            <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
              Comprehensive clinical pathophysiology, verified global mortality and burden statistics, 
              diagnostic parameter reference thresholds, and patient-specific metabolic evaluation.
            </p>
          </div>

          <Link
            to="/disease-analysis"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition"
          >
            Run Full Disease Analysis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* SECTION A: DISEASE INTRODUCTION */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            Section A: Pathophysiology & Clinical Classification
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Understanding glucose homeostasis, beta-cell failure, and systemic microvascular and macrovascular impacts.
          </p>
        </div>

        {/* What Happens in the Body */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <h3 className="text-sm font-bold font-mono text-teal-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            What Happens Inside the Body
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            In healthy individuals, pancreatic beta cells in the islets of Langerhans synthesize and secrete insulin in response to rising blood glucose. 
            Insulin binds to cell-surface receptors on skeletal muscle, adipose tissue, and hepatocytes, facilitating cellular glucose uptake. 
            In diabetes mellitus, this mechanism breaks down due to autoimmune destruction of beta cells (Type 1) or a progressive combination of peripheral insulin resistance and impaired beta-cell compensation (Type 2). 
            Persistent hyperglycemia leads to glucose toxicity, advanced glycation end-product (AGE) accumulation, and chronic microvascular endothelial injury.
          </p>
        </div>

        {/* 3 Diabetes Types Tabs */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 gap-2">
            {[
              { id: 'type2', label: 'Type 2 Diabetes (90%+ of Cases)' },
              { id: 'type1', label: 'Type 1 Diabetes (Autoimmune)' },
              { id: 'gestational', label: 'Gestational Diabetes (GDM)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTypeTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                  activeTypeTab === tab.id
                    ? 'border-teal-600 text-teal-800 bg-teal-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            {activeTypeTab === 'type2' && (
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-base">Type 2 Diabetes Mellitus (T2DM)</h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Characterized by progressive loss of adequate beta-cell insulin secretion, frequently accompanied by systemic insulin resistance. 
                  Strongly influenced by sedentary behavior, excess visceral adiposity, genetic predisposition, and aging. 
                  Often asymptomatic for years, allowing silent microvascular end-organ damage prior to clinical detection.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <strong className="text-slate-800 block">Primary Etiology:</strong>
                    <span className="text-slate-600">Peripheral insulin receptor insensitivity & relative secretory deficit.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <strong className="text-slate-800 block">Typical Age of Onset:</strong>
                    <span className="text-slate-600">Adults &ge; 45 years, though increasingly identified in younger cohorts.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTypeTab === 'type1' && (
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-base">Type 1 Diabetes Mellitus (T1DM)</h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  An autoimmune disease in which autoreactive T-lymphocytes selectively destroy insulin-producing pancreatic beta cells, 
                  resulting in absolute insulin deficiency. Patients require lifelong exogenous insulin replacement to sustain cellular metabolism and prevent diabetic ketoacidosis (DKA).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <strong className="text-slate-800 block">Primary Etiology:</strong>
                    <span className="text-slate-600">Autoimmune destruction (GAD65, IA-2, ZnT8 antibodies).</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <strong className="text-slate-800 block">Typical Age of Onset:</strong>
                    <span className="text-slate-600">Children, adolescents, and young adults (can occur at any age).</span>
                  </div>
                </div>
              </div>
            )}

            {activeTypeTab === 'gestational' && (
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-base">Gestational Diabetes Mellitus (GDM)</h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Hyperglycemia with onset or first recognition during pregnancy (typically screened at 24–28 weeks of gestation via OGTT). 
                  Driven by placental lactogen and progesterone inducing severe maternal insulin resistance. 
                  Increases risks of preeclampsia, macrosomia, and confers a 7- to 10-fold lifetime risk of developing future maternal Type 2 diabetes.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <strong className="text-slate-800 block">Primary Etiology:</strong>
                    <span className="text-slate-600">Placental hormone-induced insulin resistance during pregnancy.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <strong className="text-slate-800 block">Postpartum Care:</strong>
                    <span className="text-slate-600">Screening with 75g OGTT at 4–12 weeks postpartum, followed by lifelong periodic testing.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Symptoms, Risk Factors, Complications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Symptoms */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              Common Symptoms
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>Polyuria (frequent urination, nocturia)</li>
              <li>Polydipsia (excessive unquenchable thirst)</li>
              <li>Polyphagia (extreme hunger despite food intake)</li>
              <li>Unexplained weight loss</li>
              <li>Chronic fatigue & lethargy</li>
              <li>Blurred vision</li>
              <li>Slow-healing lacerations or sores</li>
              <li>Peripheral numbness or tingling in feet</li>
            </ul>
          </div>

          {/* Major Risk Factors */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Major Risk Factors
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>Age 45 years or older</li>
              <li>Overweight / Obesity (BMI &gt;= 25 kg/m²)</li>
              <li>First-degree family history (parent/sibling)</li>
              <li>Physical inactivity (&lt; 150 min/wk)</li>
              <li>Hypertension (&gt;= 130/80 mmHg)</li>
              <li>Dyslipidemia (HDL &lt; 35, Triglycerides &gt; 250)</li>
              <li>History of gestational diabetes</li>
              <li>Cardiovascular disease history</li>
            </ul>
          </div>

          {/* Complications */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Long-Term Complications
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li><strong>Microvascular:</strong> Diabetic retinopathy (blindness), nephropathy (CKD / dialysis), neuropathy.</li>
              <li><strong>Macrovascular:</strong> 2-3x risk of myocardial infarction, ischemic stroke, peripheral arterial disease.</li>
              <li><strong>Diabetic Foot:</strong> Ulceration, osteomyelitis, and lower extremity amputations.</li>
              <li><strong>Acute Emergencies:</strong> Diabetic Ketoacidosis (DKA) and Hyperosmolar Hyperglycemic State (HHS).</li>
            </ul>
          </div>
        </div>

        {/* Prevention & Management Overview */}
        <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs sm:text-sm text-teal-950 space-y-2">
          <strong className="font-bold flex items-center gap-1.5 text-teal-900">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Prevention and Clinical Management Strategy
          </strong>
          <p className="leading-relaxed text-slate-700">
            Intensive lifestyle interventions—including medical nutrition therapy, 150 minutes of moderate aerobic exercise weekly, and 5%–10% weight loss—reduce progression from prediabetes to Type 2 diabetes by over 58%. 
            Pharmacological management leverages Metformin, SGLT2 inhibitors (conferring cardiorenal protection), GLP-1 receptor agonists, and insulin therapy alongside continuous glucose monitoring (CGM).
          </p>
        </div>
      </section>

      {/* SECTION B: GLOBAL DISEASE STATISTICS */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Section B: Verified Global Statistics & Public Health Impact
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Official data from the World Health Organization (WHO) and International Diabetes Federation (IDF).
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-semibold self-start sm:self-auto">
            Verified Epidemiological Data
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {overviewData?.global_statistics.key_metrics.map((stat, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 font-bold px-2 py-0.5 rounded bg-teal-100/60 inline-block">
                  Reporting Year: {stat.reporting_year} · {stat.geographical_scope}
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {stat.statistic}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {stat.description}
                </p>
                {stat.projection_note && (
                  <p className="text-[11px] text-slate-500 italic border-l-2 border-teal-500 pl-2 mt-2">
                    {stat.projection_note}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-500 truncate max-w-[180px]" title={stat.source}>
                  {stat.source}
                </span>
                <a
                  href={stat.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline shrink-0"
                >
                  Reference
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Global Impact Summary */}
        <div className="p-5 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900 block mb-1">Public Health Significance:</strong>
          {overviewData?.global_statistics.public_health_summary}
        </div>
      </section>

      {/* SECTION C: RELEVANT HEALTH PARAMETERS CLINICAL REFERENCE TABLE */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            Section C: Diagnostic Criteria vs Treatment Targets Reference Matrix
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Authoritative criteria based on the American Diabetes Association (ADA) Standards of Care and WHO guidelines.
          </p>
        </div>

        {/* Explanatory Distinction Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <strong className="font-bold flex items-center gap-1.5 text-amber-950">
            <Info className="w-4 h-4 text-amber-600" />
            Clinical Interpretation Note: Distinguishing Diagnostic Criteria from Treatment Targets
          </strong>
          <p className="leading-relaxed text-amber-900">
            <strong>Diagnostic criteria</strong> establish the presence of diabetes (e.g. Fasting Plasma Glucose &gt;= 126 mg/dL or HbA1c &gt;= 6.5%, confirmed on repeat testing). 
            <strong>Treatment targets</strong> (e.g. ADA general HbA1c target &lt; 7.0%, fasting glucose 80–130 mg/dL) apply to patients already diagnosed and undergoing clinical management. 
            Do not confuse healthy non-diabetic reference ranges with therapeutic targets.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold">Parameter</th>
                <th className="p-4 font-bold">Normal Range</th>
                <th className="p-4 font-bold">Impaired / Prediabetes</th>
                <th className="p-4 font-bold text-rose-700">Diagnostic Threshold</th>
                <th className="p-4 font-bold text-teal-700">Treatment Target</th>
                <th className="p-4 font-bold">Measurement Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {overviewData?.parameter_references.map((param, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    {param.parameter_name}
                    <span className="block font-mono text-[10px] text-slate-400 font-normal">
                      Unit: {param.unit}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{param.normal_reference_range}</td>
                  <td className="p-4 font-mono text-amber-700 font-semibold">{param.impaired_prediabetes_range}</td>
                  <td className="p-4 font-mono text-rose-700 font-bold bg-rose-50/40">{param.diagnostic_threshold}</td>
                  <td className="p-4 font-mono text-teal-800 font-semibold bg-teal-50/40">{param.treatment_target}</td>
                  <td className="p-4 text-[11px] text-slate-600 max-w-[200px]">
                    <span className="font-semibold block text-slate-800">{param.measurement_source}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{param.wokwi_compatibility}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION D & E: SELECTED PATIENT INTEGRATION */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Section D & E: Patient-Specific Diabetes Correlation & Monitoring
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Select an authorized patient profile to evaluate genuine medical reports, symptoms, and live telemetry against diabetes criteria.
            </p>
          </div>

          {/* Patient Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono uppercase text-slate-500 font-bold">Patient:</label>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(parseInt(e.target.value, 10))}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
            >
              {patientsList.map(p => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.full_name} {p.age ? `(${p.age} yrs)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingRelation ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium">Retrieving patient clinical record...</p>
          </div>
        ) : relationError ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <strong className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Access Notice
            </strong>
            <p>{relationError}</p>
          </div>
        ) : patientRelation ? (
          <div className="space-y-8">
            {/* Patient Header Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
                  Patient Clinical Profile
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {patientRelation.patient.full_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {patientRelation.patient.email} · Blood Type: {patientRelation.patient.blood_type || 'N/A'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Age</span>
                  <strong className="text-slate-900 text-base">{patientRelation.patient.age || 'N/A'} yrs</strong>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 max-w-[260px]">
                  <span className="text-[10px] text-slate-400 block uppercase">Recorded Conditions</span>
                  <strong className="text-slate-900 text-xs truncate block" title={patientRelation.patient.medical_conditions || 'None'}>
                    {patientRelation.patient.medical_conditions || 'None recorded'}
                  </strong>
                </div>
              </div>
            </div>

            {/* How Diabetes Relates to This Patient */}
            <div className="p-6 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-6">
              <div className="border-b border-teal-200/80 pb-3">
                <h4 className="text-base font-extrabold text-teal-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  How Diabetes Relates to {patientRelation.patient.full_name}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Automated correlation of patient's recorded age, symptoms, uploaded laboratory reports, and vital history.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Left Column: Relevant Details & Findings */}
                <div className="space-y-4">
                  <div>
                    <strong className="text-slate-900 font-mono uppercase tracking-wider text-[11px] block mb-1.5">
                      Relevant Patient Profile Details:
                    </strong>
                    {patientRelation.how_diabetes_relates.relevant_patient_details.length > 0 ? (
                      <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                        {patientRelation.how_diabetes_relates.relevant_patient_details.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 italic">No specific risk profile flags recorded.</p>
                    )}
                  </div>

                  <div>
                    <strong className="text-slate-900 font-mono uppercase tracking-wider text-[11px] block mb-1.5">
                      Reported Symptoms Correlating with Diabetes:
                    </strong>
                    {patientRelation.how_diabetes_relates.matching_symptoms.length > 0 ? (
                      <div className="space-y-2">
                        {patientRelation.how_diabetes_relates.matching_symptoms.map((sym, idx) => (
                          <div key={idx} className="p-2.5 bg-white rounded-xl border border-teal-100 flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{sym.symptom_name}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold">
                              {sym.severity} · {sym.duration || 'ongoing'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No classic symptoms (polyuria, polydipsia) logged in symptom diary.</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Lab Findings & Missing Data */}
                <div className="space-y-4">
                  <div>
                    <strong className="text-slate-900 font-mono uppercase tracking-wider text-[11px] block mb-1.5">
                      Relevant Uploaded Report Findings:
                    </strong>
                    {patientRelation.how_diabetes_relates.relevant_report_findings.length > 0 ? (
                      <div className="space-y-2">
                        {patientRelation.how_diabetes_relates.relevant_report_findings.map((finding, idx) => (
                          <div key={idx} className="p-2.5 bg-white rounded-xl border border-teal-100">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{finding.test_name}: {finding.value} {finding.unit}</span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold">
                                {finding.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">Source: {finding.report_title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No glucose or HbA1c laboratory reports uploaded yet.</p>
                    )}
                  </div>

                  <div>
                    <strong className="text-slate-900 font-mono uppercase tracking-wider text-[11px] block mb-1.5">
                      Missing Clinical Information:
                    </strong>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                      {patientRelation.how_diabetes_relates.missing_clinical_data.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Questions for Doctor */}
              <div className="pt-4 border-t border-teal-200/80">
                <strong className="text-slate-900 font-mono uppercase tracking-wider text-[11px] block mb-2">
                  Recommended Discussion Points for Physician:
                </strong>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {patientRelation.how_diabetes_relates.doctor_review_points.map((pt, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-teal-100 text-xs text-slate-700 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION E: SIMULATED WOKWI READING NOTICE */}
            <div className="p-6 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono font-extrabold text-[10px] tracking-wider uppercase inline-block">
                    SAFETY GUARDRAIL DISCLOSURE
                  </span>
                  <h4 className="text-sm font-extrabold text-amber-950">
                    SIMULATED READING — NOT A REAL BLOOD GLUCOSE MEASUREMENT.
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    The glucose potentiometer on the Wokwi ESP32 testbed and virtual telemetry stream synthesize mock values strictly for hardware firmware integration testing. 
                    <strong> Simulated potentiometer readings cannot diagnose diabetes, assess glycemic control, or indicate medical disease.</strong> Only venous laboratory tests ordered by a licensed physician provide diagnostic validity.
                  </p>
                </div>
              </div>

              {patientRelation.simulated_glucose_telemetry && (
                <div className="p-4 bg-white/90 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Active Virtual Stream</span>
                    <strong className="text-slate-900 text-base">
                      {patientRelation.simulated_glucose_telemetry.value} {patientRelation.simulated_glucose_telemetry.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Telemetry Source</span>
                    <span className="text-slate-700">{patientRelation.simulated_glucose_telemetry.source}</span>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px]">
                    {patientRelation.simulated_glucose_telemetry.warning_label}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
