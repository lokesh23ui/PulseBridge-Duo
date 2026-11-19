# PulseBridge Duo — Atrial Fibrillation (AFib) Intelligence Architecture

## 1. Executive Summary

This document specifies the single-disease clinical intelligence architecture implemented in **PulseBridge Duo**. 
The previous 10-disease multi-condition catalogue has been completely superseded by a specialized, guideline-adherent decision-support engine dedicated solely to **Atrial Fibrillation (AFib)**.

### Core Medical Objective
To provide transparent, deterministic, and guideline-directed clinical evaluation of Atrial Fibrillation based on:
1. Patient-reported rhythm symptoms (specifically prioritizing *Irregular heartbeat rhythm*).
2. Cardiovascular comorbidity history (e.g. Hypertension, Age $\ge 45$/$65$, Heart Failure).
3. Uploaded diagnostic reports (12-lead ECG, 24-hr Holter, Echocardiography, TSH, Electrolytes).
4. Continuous physiological telemetry from wearable devices, strictly segregated from simulated testbed data.

---

## 2. Knowledge Base Specification

### 2.1 Single Disease Entry
The disease knowledge base (`backend/app/services/disease_knowledge_base.py`) contains **only one** disease record:
- **Name**: Atrial Fibrillation
- **Short Name**: AFib
- **Category**: Cardiac arrhythmia
- **Description**: An abnormal heart rhythm in which the atria beat irregularly and often rapidly.
- **Route**: `/afib`

All previous chronic conditions (Diabetes, Hypertension, Stroke, COPD, Chronic Kidney Disease, Anaemia, Thyroid Disorders, Heart Failure, Coronary Artery Disease, Respiratory Infections) have been completely removed from the knowledge base, seed scripts, and analysis selection options.

### 2.2 The 11 Recognized AFib Symptoms
The symptom catalogue enforces an exact 11-symptom clinical classification, with **Irregular heartbeat rhythm** codified as the primary clinical hallmark (#1):

| # | Symptom Name | Role | Clinical Note |
|---|---|---|---|
| 1 | **Irregular heartbeat rhythm** | **Primary Hallmark** | The irregularly irregular ventricular rhythm characteristic of AFib. Pulse feels erratic or chaotic. |
| 2 | Heart palpitations | Secondary Rhythm | Pounding, fluttering, racing or skipped-beat sensations in the chest. |
| 3 | Rapid heartbeat | Secondary Rhythm | Noticeably fast heart rate (resting tachycardia commonly 100-175 bpm). |
| 4 | Unusual fatigue or tiredness | Associated Symptom | Loss of the 20-30% synchronized "atrial kick" diminishes cardiac output, causing tissue hypoperfusion. |
| 5 | Dizziness or lightheadedness | Associated Symptom | Transient reductions in cerebral perfusion pressure during rapid or irregular ventricular cycles. |
| 6 | Shortness of breath | Associated Symptom | Exertional dyspnea resulting from elevated pulmonary venous pressures and loss of diastolic filling time. |
| 7 | Chest discomfort or tightness | Warning Symptom | Anginal sensation caused by increased myocardial oxygen demand; requires evaluation to exclude acute ischemia. |
| 8 | General weakness | Associated Symptom | Systemic low cardiac output state. |
| 9 | Reduced exercise tolerance | Associated Symptom | Inability to augment stroke volume during physical exertion. |
| 10 | Feeling faint or near-fainting | Warning Symptom | Presyncope due to rapid ventricular response or prolonged pauses upon AFib termination. |
| 11 | Anxiety associated with heartbeat | Associated Symptom | Somatic autonomic hyperarousal triggered by erratic cardiac rhythm sensations. |

---

## 3. Global AFib Statistics & Mortality Phrasing

Epidemiological metrics in PulseBridge Duo are verified against authoritative publications from the **Global Burden of Disease (GBD) Study**, **American Heart Association (AHA 2024)**, **European Society of Cardiology (ESC 2020)**, and the **ACC/AHA/ACCP/HRS 2023 Guidelines**:

1. **Prevalence**: 37.5 – 50 Million individuals worldwide (GBD Study / Lancet).
2. **Lifetime Risk**: 1 in 3 lifetime risk for adults aged $\ge 45$ years (Framingham & Rotterdam Cohorts, ACC 2023).
3. **Stroke Attribution**: 20% – 30% of all ischemic strokes originate from cardioembolic thrombi in the atria / left atrial appendage during AFib (ESC 2020).
4. **Silent AFib**: Up to 30% of AFib cases are asymptomatic (silent AFib), often diagnosed only following acute stroke.
5. **Mortality Estimate Phrasing**:
   > *"Reliable global AFib-specific annual death estimate unavailable (mortality is predominantly recorded under resultant complications, including ischemic stroke and heart failure)"*

---

## 4. Patient-Based Clinical Comparison Engine

The analysis engine (`backend/app/services/disease_analyzer.py`) evaluates patient telemetry, medical records, and active symptoms strictly for Atrial Fibrillation. 

### 4.1 Strict Result Labels
The engine returns **exactly one** of the following five standardized result labels:
1. `ECG confirmation documented in uploaded records`: Explicitly documented electrocardiogram rhythm finding of AFib in uploaded clinical records.
2. `Relevant findings identified`: Irregular heartbeat rhythm reported alongside associated symptoms and cardiovascular risk factors.
3. `Some relevant findings identified`: Palpitations or rapid heart rate reported alongside cardiovascular history or secondary symptoms.
4. `Insufficient information`: Baseline risk factors or non-specific symptoms present without irregular pulse or diagnostic ECG.
5. `No relevant findings identified`: No reported irregular heartbeat sensations, palpitations, or cardiac rhythm documentation.

### 4.2 Exclusion of Simulated Wokwi Telemetry
Telemetry generated by the Wokwi ESP32 testbed (potentiometer inputs) is explicitly labeled:
> **`"SIMULATED — NOT A CLINICAL MEASUREMENT."`**
> The Wokwi simulator uses synthetic potentiometer data and cannot detect or diagnose cardiac arrhythmias or confirm Atrial Fibrillation. The ESP32 circuit does not include an ECG sensor. Simulated readings are excluded from diagnostic evidence.

---

## 5. Emergency Safety Warning Section

A prominent, permanent Emergency Safety Warning is rendered across both `/afib` (Overview) and `/disease-analysis` (Analysis):
> **`EMERGENCY WARNING:`** If you or the patient experience a fast or irregular heartbeat accompanied by **CHEST PAIN**, **SEVERE SHORTNESS OF BREATH**, **FAINTING**, or signs of a **STROKE** (facial drooping, arm weakness, speech difficulty — *BE-FAST*), **CALL EMERGENCY SERVICES (911 / 112) IMMEDIATELY**.

---

## 6. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/disease/knowledge-base` | Returns single disease item: Atrial Fibrillation |
| `GET` | `/api/disease/knowledge-base/{id}` | Returns AFib reference details (404 for old diseases) |
| `GET` | `/api/disease/afib-overview` | Comprehensive AFib background, global stats, parameter refs, 11 symptoms |
| `GET` | `/api/disease/symptom-catalogue` | Returns the 11 AFib symptoms with primary flag |
| `GET` | `/api/disease/patient/{id}/afib-relation` | Dynamic correlation of Eleanor Vance records to AFib |
| `POST` | `/api/disease/patient/{id}/analyze` | Executes single-disease AFib evaluation |
| `GET` | `/api/disease/patient/{id}/analyses` | Historical AFib assessment audit trail |
