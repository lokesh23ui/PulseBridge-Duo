# PulseBridge Duo — Disease Information & Patient-Based Disease Analysis

## 1. Executive Summary

PulseBridge Duo extends its connected healthcare ecosystem with two comprehensive, interconnected clinical disease features:
1. **PAGE A — Featured Disease: Diabetes Mellitus (`/diabetes`):** An authoritative, educational, and patient-specific disease intelligence portal detailing etiology, verified global epidemiological statistics, diagnostic criteria versus therapeutic targets, and dynamic patient correlation.
2. **PAGE B — Patient-Based Disease Analysis (`/disease-analysis`):** An intelligent clinical decision-support feature that transparently compares an individual patient's reported symptoms, uploaded diagnostic lab reports, known medical history, and vital signs against a structured knowledge base of 10 major chronic diseases.

Both pages strictly integrate with existing patient profiles, uploaded medical records, sensor history, and caregiver access permissions.

---

## 2. Page A: Diabetes Mellitus Overview

### 2.1 Clinical Pathophysiology & Classification
- **Physiological Mechanism:** Details pancreatic beta-cell function in the islets of Langerhans, peripheral insulin receptor sensitivity, glucose toxicity, advanced glycation end-products (AGEs), and systemic endothelial injury.
- **Three Core Disease Classifications:**
  - *Type 1 Diabetes Mellitus (T1DM):* Autoimmune destruction of beta cells (GAD65, IA-2, ZnT8 antibodies), resulting in absolute insulin deficiency.
  - *Type 2 Diabetes Mellitus (T2DM):* Progressive secretory defect on a background of peripheral insulin resistance and visceral adiposity (>90% of global cases).
  - *Gestational Diabetes Mellitus (GDM):* Placental hormone-induced insulin resistance presenting at 24–28 weeks of gestation, conferring elevated lifetime maternal T2DM risk.
- **Clinical Complications:** Structured categorization of microvascular injuries (retinopathy, nephropathy/CKD, peripheral neuropathy) and macrovascular risks (myocardial infarction, ischemic stroke, peripheral arterial disease), alongside acute emergencies (DKA and HHS).

### 2.2 Verified Global Statistics (WHO & IDF)
To uphold medical veracity, all figures cite official epidemiological reporting years and direct sources:

| Metric | Reported Figure | Reporting Year | Geographical Scope | Authoritative Source & Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Global Prevalence** | 537 Million Adults | 2021 | Global (215 countries/territories) | [IDF Diabetes Atlas 10th Ed.](https://diabetesatlas.org) |
| **Direct Mortality** | 1.5 Million Deaths | 2019 | Global | [WHO Global Health Estimates](https://www.who.int/news-room/fact-sheets/detail/diabetes) |
| **Attributable Mortality** | 6.7 Million Deaths | 2021 | Global | [IDF Diabetes Atlas (Mortality Chapter)](https://diabetesatlas.org) |
| **Undiagnosed Proportion** | 44.7% (~240 Million) | 2021 | Global | [IDF Epidemiological Review](https://diabetesatlas.org) |
| **Type 2 Proportion** | Over 90% | 2021 | Global | [WHO & IDF Joint Series](https://www.who.int/health-topics/diabetes) |

### 2.3 Diagnostic Criteria vs. Treatment Targets Reference Matrix
Distinguishes healthy reference ranges, clinical diagnostic thresholds, and individualized treatment targets per American Diabetes Association (ADA) and WHO standards:

| Health Parameter | Normal Range | Impaired / Prediabetes | Diagnostic Threshold | ADA Treatment Target | Measurement Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fasting Blood Glucose** | 70 – 99 mg/dL | 100 – 125 mg/dL (IFG) | $\ge 126\text{ mg/dL}$ (confirmed) | 80 – 130 mg/dL | Venous Plasma Lab Draw |
| **2-Hour OGTT (75g)** | < 140 mg/dL | 140 – 199 mg/dL (IGT) | $\ge 200\text{ mg/dL}$ | < 180 mg/dL postprandial | Oral Glucose Tolerance Lab |
| **Glycated HbA1c** | < 5.7% (< 39 mmol/mol) | 5.7% – 6.4% | $\ge 6.5\%$ ($\ge 48\text{ mmol/mol}$) | < 7.0% for non-pregnant adults | NGSP-Certified HPLC Lab |
| **Random Blood Glucose** | 70 – 140 mg/dL | 140 – 199 mg/dL | $\ge 200\text{ mg/dL}$ + symptoms | < 180 mg/dL | Point-of-Care / Venous Lab |
| **Blood Pressure** | < 120 / < 80 mmHg | 120–129 / < 80 mmHg | $\ge 130 / \ge 80\text{ mmHg}$ | < 130 / 80 mmHg | Sphygmomanometer / PTT |
| **Body Mass Index (BMI)**| 18.5 – 24.9 kg/m² | 25.0 – 29.9 kg/m² | $\ge 30.0\text{ kg/m²}$ (Obesity) | 5%–10% intentional reduction | Clinical Anthropometry |

### 2.4 Selected Patient Correlation & Monitoring
- **Dynamic Patient Selector:** Allows choosing between registered patient accounts (e.g., Eleanor Vance).
- **"How Diabetes Relates to This Patient":** Automatically correlates age (72 yrs meets ADA $\ge 45$ screening threshold), baseline hypertension, uploaded metabolic reports (Fasting glucose 118 mg/dL, HbA1c 5.9% in prediabetes tier), and reported symptoms (polyuria, polydipsia).
- **Simulated Telemetry Guardrail:** Explicitly flags Wokwi potentiometer values with:
  > **`SIMULATED READING — NOT A REAL BLOOD GLUCOSE MEASUREMENT.`**  
  > *"The potentiometer on the Wokwi ESP32 testbed generates synthetic illustrative values for hardware testing. It must NEVER be used to diagnose diabetes or evaluate glycemic management."*

---

## 3. Page B: Patient-Based Disease Analysis

```
+-----------------------------------------------------------------------------------+
|                        CLINICAL COMPARISON WORKFLOW                               |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Selected Patient Intake] (Age, Sex, Medical Conditions, Vital Baseline)         |
|          │                                                                        |
|          ├───────────────────────────────┬───────────────────────────────┐        |
|          ▼                               ▼                               ▼        |
|  [Patient Symptom Diary]     [Medical Report Vault]         [Sensor Telemetry]    |
|  (Polyuria, Fatigue, etc.)   (Extracted Lab Biomarkers)     (Excludes Sim Pot.)   |
|          │                               │                               │        |
|          └───────────────────────────────┼───────────────────────────────┘        |
|                                          │                                        |
|                                          ▼                                        |
|                         [Patient-to-Disease Comparison Engine]                    |
|                         Evaluates Against 10 Chronic Conditions                   |
|                                          │                                        |
|                                          ▼                                        |
|                 Deterministic Ranked Results & Match Classifications:             |
|                 - Relevant findings identified                                    |
|                 - Some matching information                                       |
|                 - Insufficient information                                        |
|                 - No meaningful match identified                                  |
|                                          │                                        |
|                                          ▼                                        |
|                  Detailed Clinical Reasoning & Medical References                 |
|             (Direct Link to Page A whenever Diabetes Mellitus appears)            |
|                                          │                                        |
|                                          ▼                                        |
|                   Longitudinal Analysis History Record Persisted                  |
+-----------------------------------------------------------------------------------+
```

### 3.1 Ten Structured Disease Knowledge Bases
The engine incorporates structured reference profiles for 10 conditions:
1. **Diabetes Mellitus (Type 1 & Type 2)** — ADA, WHO, IDF
2. **Hypertension** — ESH, ACC/AHA
3. **Coronary Artery Disease (CAD)** — AHA/ACC, ESC
4. **Stroke (Ischemic, Hemorrhagic, TIA)** — AHA/ASA, CDC
5. **Chronic Kidney Disease (CKD)** — KDIGO, NKF
6. **Chronic Obstructive Pulmonary Disease (COPD)** — GOLD, WHO
7. **Anaemia (Iron Deficiency & Chronic Disease)** — WHO, ASH
8. **Thyroid Disorders (Hypo- & Hyperthyroidism)** — ATA, AACE
9. **Heart Failure (HFrEF & HFpEF)** — AHA/ACC/HFSA, ESC
10. **Respiratory Infections (Pneumonia & Lower RTI)** — ATS/IDSA, NICE

### 3.2 Interactive Medical Report Extraction & Verification
- **Multi-Format Support:** Ingests PDF (`pypdf`), images (`Pillow`), and clinical plain text.
- **Biomarker Extraction:** Matches clinical lab patterns (FBG, HbA1c, Serum Creatinine, eGFR, Lipid panels, CBC, TSH, SpO2).
- **Interactive User Review Modal:** Users review, edit, or append extracted test names, values, units, and reference ranges before committing them to the patient's record.

### 3.3 Patient Symptom Diary
Allows patients or authorized caregivers to log clinical symptoms with duration, severity (Mild, Moderate, Severe), frequency (Occasional, Intermittent, Constant), and narrative notes.

### 3.4 Non-Diagnostic Decision-Support Standard
- Eliminates fabricated probability percentages (*e.g., "78% chance of diabetes"*).
- Uses medically responsible qualitative tiers: *Relevant findings identified*, *Some matching information*, *Insufficient information*, and *No meaningful match identified*.
- Enforces non-diagnostic clinical disclaimer:
  > *"These results are informational clinical decision-support suggestions, not a medical diagnosis. Only a qualified healthcare professional can diagnose a condition."*

### 3.5 Cross-Feature Direct Navigation
Whenever **Diabetes Mellitus** is identified in the analysis results, the evidence drawer displays a prominent action button:  
`"Open Diabetes Overview for Detailed Patient Analysis & Monitoring →"`  
This dynamically routes the user to `/diabetes?patientId={id}`, connecting Page B and Page A.

---

## 4. Security, Access Control & Privacy
1. **Role Enforcement:** Caregivers must possess an approved active relationship with the patient and the `view_medical_reports` permission to inspect report findings or run comprehensive disease analyses.
2. **Data Isolation:** Patient records are strictly partitioned by `patient_id`. Switching between patient profiles guarantees that one patient's reports or analyses never leak into another.
3. **Simulated Telemetry Firewall:** Synthetic Wokwi potentiometer values are explicitly marked and excluded from clinical disease matching scores.
