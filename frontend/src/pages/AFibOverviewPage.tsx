import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AFibOverviewData } from '../types/disease';
import { 
  Activity, AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, 
  ExternalLink, Globe, Heart, HeartPulse, Info, PhoneCall, Shield, Sparkles, 
  Stethoscope, Clock, Waves
} from 'lucide-react';

export const AFibOverviewPage: React.FC = () => {
  const [overviewData, setOverviewData] = useState<AFibOverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  // 1. Fetch Global AFib Overview Data
  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const data = await api.getAFibOverview();
        setOverviewData(data);
      } catch (err) {
        console.error('Failed to load AFib overview', err);
      } finally {
        setLoadingOverview(false);
      }
    };
    fetchOverview();
  }, []);

  const disease = overviewData?.disease_info;
  const stats = overviewData?.global_statistics;
  const paramRefs = overviewData?.parameter_references || [];
  const symptoms = overviewData?.symptoms || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 text-slate-900">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-mono font-semibold border border-rose-200">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>CARDIAC ARRHYTHMIA REFERENCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Atrial Fibrillation (AFib) — Clinical Overview
            </h1>
            <p className="text-slate-600 max-w-3xl leading-relaxed text-xs sm:text-sm">
              Authoritative clinical guide on Atrial Fibrillation, its electrophysiological mechanisms, 
              clinical classifications, diagnostic investigations, and evidence-based management pathways.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/disease-analysis"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run AFib Patient Analysis</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
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

      {/* 3. Section 1: Disease Introduction & Electrophysiological Mechanism */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">What is Atrial Fibrillation?</h2>
            <p className="text-xs text-slate-500 font-mono">Cardiac Electrophysiology & Hemodynamic Impact</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-600" />
              <span>Electrophysiological Definition</span>
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Atrial Fibrillation (AFib) is a supraventricular tachyarrhythmia characterized by rapid, disorganized, and chaotic electrical activation in the atria. 
              Instead of an orderly electrical impulse spreading from the Sinoatrial (SA) Node, multiple chaotic micro-reentrant wavelets cause the atrial muscle to quiver at rates of <strong>350 to 600 impulses per minute</strong>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Waves className="w-4 h-4 text-teal-600" />
              <span>What Happens Inside the Heart</span>
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Because the atria quiver chaotically rather than contracting synchronously, the <strong>atrial kick</strong> (accounting for 20% to 30% of ventricular filling) is lost. 
              The Atrioventricular (AV) Node conducts intermittently, generating an <strong>irregularly irregular ventricular rhythm</strong> (commonly 100 to 175 bpm). Blood stasis inside the trabeculated left atrial appendage (LAA) significantly increases thromboembolic stroke risk.
            </p>
          </div>
        </div>

        {/* Clinical Classifications of AFib (Clean Concise Cards) */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
            Clinical Classifications (ACC / AHA / HRS & ESC Guidelines)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Paroxysmal AFib</span>
              <span className="text-[11px] font-mono text-teal-700 block">Terminates &le; 7 days</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">Self-terminating or with intervention; stroke risk is equivalent to persistent forms.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Persistent AFib</span>
              <span className="text-[11px] font-mono text-blue-700 block">Sustained &gt; 7 days</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">Does not self-terminate; requires cardioversion, catheter ablation, or rate control.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Long-standing Persistent</span>
              <span className="text-[11px] font-mono text-purple-700 block">Continuous &gt; 12 months</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">Accompanied by significant atrial structural remodeling and cavity enlargement.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Permanent AFib</span>
              <span className="text-[11px] font-mono text-slate-600 block">Accepted chronic rhythm</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">Rhythm control is discontinued; treatment focuses on rate control and anticoagulation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section 3: The 11 Recognized AFib Symptoms */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">The 11 Recognized AFib Symptoms</h2>
              <p className="text-xs text-slate-500 font-mono">Irregular heartbeat rhythm is the #1 primary hallmark</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-medium">
            {symptoms.length} Symptoms Catalogued
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {symptoms.map((sym, idx) => (
            <div
              key={sym.id}
              className={`p-4 rounded-2xl border transition-all ${
                sym.is_primary
                  ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  sym.is_primary ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {idx + 1}
                </span>
                {sym.is_primary && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold uppercase tracking-wider">
                    PRIMARY HALLMARK
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{sym.name}</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-2">{sym.short_description}</p>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 italic">
                {sym.clinical_note}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs leading-relaxed flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Symptoms alone cannot confirm or exclude Atrial Fibrillation. Up to 30% of patients have silent / asymptomatic AFib, and definitive ECG confirmation is required.</span>
        </div>
      </div>

      {/* 5. Section 5: AFib Relevant Health Parameters (EXACTLY FOUR PARAMETERS) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">AFib Relevant Health Parameters</h2>
              <p className="text-xs text-slate-500 font-mono">
                Authoritative 4-Parameter Scope: Heart Rhythm / ECG, Heart Rate, Heart Rate Variability (HRV), and Oxygen Saturation (SpO₂)
              </p>
            </div>
          </div>
        </div>

        {/* Clean Responsive 4-Row Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-mono text-xs">
                <th className="p-3.5">Parameter</th>
                <th className="p-3.5">Clinical role</th>
                <th className="p-3.5">Unit</th>
                <th className="p-3.5">Data source</th>
                <th className="p-3.5">Clinical limitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>Heart Rhythm / ECG</span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                    Diagnostic confirmation
                  </span>
                </td>
                <td className="p-3.5 font-mono text-slate-600">ECG waveform</td>
                <td className="p-3.5">Uploaded ECG / verified ECG data</td>
                <td className="p-3.5 text-slate-500">Requires ECG interpretation</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Heart Rate</span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200 text-[11px]">
                    Monitoring
                  </span>
                </td>
                <td className="p-3.5 font-mono text-slate-600">BPM</td>
                <td className="p-3.5">Verified patient records</td>
                <td className="p-3.5 text-slate-500">Cannot confirm AFib alone</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                  <Waves className="w-4 h-4 text-purple-600" />
                  <span>Heart Rate Variability (HRV)</span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-semibold border border-purple-200 text-[11px]">
                    Supporting physiological information
                  </span>
                </td>
                <td className="p-3.5 font-mono text-slate-600">ms</td>
                <td className="p-3.5">Validated ECG/PPG data</td>
                <td className="p-3.5 text-slate-500">Not an AFib diagnostic test</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span>Oxygen Saturation (SpO₂)</span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold border border-teal-200 text-[11px]">
                    General oxygenation monitoring
                  </span>
                </td>
                <td className="p-3.5 font-mono text-slate-600">%</td>
                <td className="p-3.5">Verified patient records</td>
                <td className="p-3.5 text-slate-500">Cannot confirm AFib</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detailed 4-Parameter Medical Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Parameter 1: Heart Rhythm / ECG */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>1. Heart Rhythm / ECG</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                DIAGNOSTIC GOLD STANDARD
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Clinical Role:</strong> Diagnostic confirmation. A 12-lead Electrocardiogram (ECG) is the definitive gold standard used to confirm Atrial Fibrillation. 
              Diagnostic criteria require irregularly irregular RR intervals, absence of distinct P waves, and irregular baseline fibrillatory waves lasting at least 30 seconds.
            </p>
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
              <div><strong>Unit:</strong> ECG waveform and rhythm interpretation.</div>
              <div><strong>Source:</strong> Uploaded ECG report or verified clinical record.</div>
              <div><strong>Clinical Limitation:</strong> Intermittent paroxysmal AFib requires ambulatory monitoring (24-hr Holter or 7–14 day patch monitor). ECG findings are displayed only when supported by an actual patient report.</div>
            </div>
          </div>

          {/* Parameter 2: Heart Rate */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>2. Heart Rate</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                MONITORING CONTEXT
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Clinical Role:</strong> Heart-rate monitoring. Resting ventricular rate provides physiological context regarding hemodynamic stress, sympathetic tone, and rate-control efficacy. Untreated AFib commonly exhibits resting tachycardia (100–175 bpm).
            </p>
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
              <div><strong>Unit:</strong> BPM (beats per minute).</div>
              <div><strong>Source:</strong> Verified patient readings or uploaded clinical reports.</div>
              <div><strong>Clinical Limitation:</strong> Heart rate alone cannot confirm AFib. Sinus tachycardia, physical exertion, stress, and ectopic beats also elevate heart rate.</div>
            </div>
          </div>

          {/* Parameter 3: Heart Rate Variability (HRV) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Waves className="w-4 h-4 text-purple-600" />
                <span>3. Heart Rate Variability (HRV)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold uppercase">
                SUPPORTING PHYSIOLOGICAL INFO
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Clinical Role:</strong> Supporting physiological information. HRV measures the beat-to-beat variations between consecutive heartbeats (R-R / interbeat intervals) using validated metrics such as RMSSD and SDNN. It reflects autonomic nervous system modulation and differs from average heart rate.
            </p>
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
              <div><strong>Unit:</strong> Milliseconds (ms) — RMSSD and SDNN.</div>
              <div><strong>Source:</strong> Suitable validated ECG or PPG recordings.</div>
              <div className="text-amber-800 font-medium pt-0.5">
                <strong>Important Medical Restrictions:</strong> HRV is NOT a diagnostic test for AFib. In active AFib, ventricular contractions are irregularly irregular, creating chaotic interval fluctuations that invalidate conventional sinus-rhythm HRV reference ranges.
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-900 font-mono text-[11px]">
                HRV data not available. A suitable validated ECG or PPG recording is required.
              </div>
            </div>
          </div>

          {/* Parameter 4: Oxygen Saturation (SpO₂) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>4. Oxygen Saturation (SpO₂)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold uppercase">
                GENERAL OXYGENATION
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Clinical Role:</strong> General oxygenation monitoring. SpO₂ measures the percentage of oxygen-saturated hemoglobin in peripheral capillary blood. It is essential for identifying secondary hypoxia or comorbid pulmonary conditions during acute cardiopulmonary decompensation.
            </p>
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
              <div><strong>Unit:</strong> Percentage (%).</div>
              <div><strong>Source:</strong> Verified patient records or clinical measurement reports.</div>
              <div><strong>Clinical Limitation:</strong> SpO₂ is NOT a diagnostic test for Atrial Fibrillation and cannot be used alone to determine AFib rhythm status.</div>
            </div>
          </div>

        </div>
      </div>

      {/* 6. Section 4 & 7: Causes/Risk Factors, Complications & Treatment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs sm:text-sm">
        
        {/* Causes & Risk Factors */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Causes & Major Risk Factors</h2>
              <p className="text-[11px] text-slate-500 font-mono">Structural & Electrical Remodeling Etiologies</p>
            </div>
          </div>

          <ul className="space-y-2 text-slate-700 text-xs">
            {(disease?.causes_and_risk_factors || disease?.risk_factors || []).map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Treatment Overview & Complications */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Treatment Overview (The ABC Pathway)</h2>
              <p className="text-[11px] text-slate-500 font-mono">Anticoagulation, Better Symptom Control, Cardiovascular Optimization</p>
            </div>
          </div>

          {disease?.treatment_overview && (
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-mono uppercase text-[10px] text-cyan-800">A — Anticoagulation (Stroke Prevention)</strong>
                <p className="mt-0.5 leading-relaxed">{(disease.treatment_overview as any).anticoagulation}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-mono uppercase text-[10px] text-blue-800">B — Better Symptom Control (Rate & Rhythm)</strong>
                <p className="mt-0.5 leading-relaxed">{(disease.treatment_overview as any).rate_control} {(disease.treatment_overview as any).rhythm_control}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-mono uppercase text-[10px] text-teal-800">C — Cardioversion & Catheter Ablation</strong>
                <p className="mt-0.5 leading-relaxed">{(disease.treatment_overview as any).cardioversion} {(disease.treatment_overview as any).catheter_ablation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. Section 11: Global Statistics (Verified Sources) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{stats?.title || 'Global Atrial Fibrillation Statistics'}</h2>
            <p className="text-xs text-slate-500 font-mono">Epidemiological Data Sourced from GBD, AHA, ESC & WHO</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(stats?.key_metrics || []).map((m, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1.5 text-xs">
              <span className="text-[10px] font-mono text-purple-800 font-bold uppercase tracking-wider block">
                {m.geographical_scope} • {m.reporting_year}
              </span>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {m.statistic}
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                {m.description}
              </p>
              <div className="pt-1.5 text-[10px] text-slate-400 font-mono border-t border-purple-100">
                Source: {m.source}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 leading-relaxed">
          {stats?.public_health_summary}
        </div>
      </div>

      {/* 8. Authoritative Clinical References */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Authoritative Clinical Guidelines & References</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {(disease?.medical_references || []).map((ref, idx) => (
            <a
              key={idx}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between text-slate-700 hover:text-rose-600 transition-colors"
            >
              <div>
                <span className="font-bold block">{ref.title}</span>
                <span className="text-slate-400 text-[11px]">{ref.source}</span>
              </div>
              <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};
