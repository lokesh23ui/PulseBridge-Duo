"""
PulseBridge Duo — Clinical Disease Knowledge Base & Diagnostic Reference Data
Curated using authoritative guidelines: WHO, IDF, ADA, AHA, ACC, KDIGO, GOLD, NIH, CDC.
"""

from typing import List, Dict, Any, Optional

# -------------------------------------------------------------
# GLOBAL DIABETES STATISTICS (VERIFIED SOURCES)
# -------------------------------------------------------------
GLOBAL_DIABETES_STATISTICS = {
    "title": "Global Diabetes Mellitus Burden & Mortality Statistics",
    "key_metrics": [
        {
            "statistic": "537 Million Adults (20-79 yrs)",
            "description": "Total estimated global adult population living with diabetes mellitus (approx. 1 in 10 adults).",
            "reporting_year": 2021,
            "geographical_scope": "Global (215 countries & territories)",
            "source": "International Diabetes Federation (IDF) Diabetes Atlas 10th Edition",
            "source_url": "https://diabetesatlas.org",
            "projection_note": "Projected to increase to 643 million by 2030 and 783 million by 2045 without comprehensive intervention."
        },
        {
            "statistic": "1.5 Million Direct Deaths",
            "description": "Official direct annual deaths directly attributed to diabetes mellitus on death certificates.",
            "reporting_year": 2019,
            "geographical_scope": "Global",
            "source": "World Health Organization (WHO) Global Health Estimates",
            "source_url": "https://www.who.int/news-room/fact-sheets/detail/diabetes",
            "projection_note": "An additional 460,000 kidney disease deaths were caused directly by diabetes; higher blood glucose causes approx. 20% of cardiovascular deaths."
        },
        {
            "statistic": "6.7 Million Attributable Deaths",
            "description": "Estimated annual global deaths attributable to diabetes and its cardiovascular, renal, and microvascular complications (approx. 1 death every 5 seconds).",
            "reporting_year": 2021,
            "geographical_scope": "Global",
            "source": "IDF Diabetes Atlas 10th Edition (Mortality Chapter)",
            "source_url": "https://diabetesatlas.org/atlas/tenth-edition/",
            "projection_note": "Over 32% of these deaths occurred in individuals under the age of 60."
        },
        {
            "statistic": "44.7% Undiagnosed Proportion (~240 Million)",
            "description": "Estimated proportion of adults currently living with diabetes who are undiagnosed and unaware of their condition.",
            "reporting_year": 2021,
            "geographical_scope": "Global (highest rates in Africa, South-East Asia, and Western Pacific)",
            "source": "International Diabetes Federation (IDF) Epidemiological Review",
            "source_url": "https://diabetesatlas.org",
            "projection_note": "Early screening via Fasting Plasma Glucose or HbA1c is essential to prevent silent microvascular injury."
        },
        {
            "statistic": "Over 90% Type 2 Prevalence",
            "description": "Proportion of all diagnosed diabetes cases accounted for by Type 2 Diabetes Mellitus, driven by socio-economic, demographic, environmental and genetic factors.",
            "reporting_year": 2021,
            "geographical_scope": "Global",
            "source": "WHO & IDF Joint Epidemiology Series",
            "source_url": "https://www.who.int/health-topics/diabetes",
            "projection_note": "Over 3 in 4 adults with diabetes reside in low- and middle-income nations."
        }
    ],
    "public_health_summary": "Diabetes is a chronic metabolic disease with immense public health significance. Left unmanaged, chronic hyperglycemia induces systemic vascular endothelial injury, leading to end-stage renal disease (ESRD), diabetic retinopathy (leading cause of adult blindness), lower-limb amputations, and a 2- to 3-fold elevation in myocardial infarction and ischemic stroke risks."
}

# -------------------------------------------------------------
# DIABETES HEALTH PARAMETERS CLINICAL REFERENCE TABLE
# -------------------------------------------------------------
DIABETES_PARAMETER_REFERENCES = [
    {
        "parameter_name": "Fasting Blood Glucose (FBG / FPG)",
        "unit": "mg/dL",
        "normal_reference_range": "70 – 99 mg/dL",
        "impaired_prediabetes_range": "100 – 125 mg/dL (Impaired Fasting Glucose)",
        "diagnostic_threshold": ">= 126 mg/dL (7.0 mmol/L) on two separate occasions",
        "treatment_target": "80 – 130 mg/dL for non-pregnant adults with diagnosed diabetes (ADA target)",
        "abnormal_indication": "Elevated fasting glucose reflects hepatic insulin resistance and basal hypoinsulinemia. Values >= 126 mg/dL indicate diabetes mellitus requiring confirmation.",
        "measurement_source": "Laboratory Venous Plasma Test (Clinical Blood Draw / Fingerstick Enzymatic Assay)",
        "wokwi_compatibility": "Wokwi potentiometer emulates simulated glucose input (labeled 'SIMULATED READING — NOT A REAL BLOOD GLUCOSE MEASUREMENT').",
        "requires_clinical_test": True
    },
    {
        "parameter_name": "Post-Meal Glucose / 2-Hour OGTT",
        "unit": "mg/dL",
        "normal_reference_range": "< 140 mg/dL (< 7.8 mmol/L)",
        "impaired_prediabetes_range": "140 – 199 mg/dL (7.8 – 11.0 mmol/L) (Impaired Glucose Tolerance)",
        "diagnostic_threshold": ">= 200 mg/dL (>= 11.1 mmol/L) 2 hours post 75g anhydrous glucose challenge",
        "treatment_target": "< 180 mg/dL 1-2 hours postprandial (ADA target)",
        "abnormal_indication": "Impaired peripheral glucose uptake by skeletal muscle and delayed early-phase insulin secretion.",
        "measurement_source": "Laboratory Oral Glucose Tolerance Test (OGTT 75g)",
        "wokwi_compatibility": "Requires laboratory ingestion protocol; cannot be acquired through wrist/finger wearables.",
        "requires_clinical_test": True
    },
    {
        "parameter_name": "Glycated Hemoglobin (HbA1c)",
        "unit": "% (mmol/mol)",
        "normal_reference_range": "< 5.7% (< 39 mmol/mol)",
        "impaired_prediabetes_range": "5.7% – 6.4% (39 – 47 mmol/mol)",
        "diagnostic_threshold": ">= 6.5% (>= 48 mmol/mol) in a certified NGSP laboratory",
        "treatment_target": "< 7.0% (< 53 mmol/mol) for most non-pregnant adults; individualized based on hypoglycemia risk",
        "abnormal_indication": "Reflects weighted average glycemia over the preceding 2–3 months (erythrocyte lifespan). Values >= 6.5% establish chronic hyperglycemia.",
        "measurement_source": "Certified High-Performance Liquid Chromatography (HPLC) Venous Blood Test",
        "wokwi_compatibility": "Requires clinical laboratory biochemistry; not obtainable from optical sensors.",
        "requires_clinical_test": True
    },
    {
        "parameter_name": "Random Blood Glucose (RBG)",
        "unit": "mg/dL",
        "normal_reference_range": "70 – 140 mg/dL (depending on timing of last meal)",
        "impaired_prediabetes_range": "140 – 199 mg/dL if measured without fasting",
        "diagnostic_threshold": ">= 200 mg/dL in the presence of classic symptoms (polyuria, polydipsia, weight loss) or hyperglycemic crisis",
        "treatment_target": "< 180 mg/dL across daytime random evaluations",
        "abnormal_indication": "A random glucose >= 200 mg/dL with classic osmotic symptoms does not require repeat testing for initial clinical diagnosis.",
        "measurement_source": "Clinical Point-of-Care Capillary Meter / Venous Chemistry",
        "wokwi_compatibility": "Wokwi provides simulated potentiometer stream. Must be accompanied by non-diagnostic disclosure.",
        "requires_clinical_test": True
    },
    {
        "parameter_name": "Blood Pressure (Systolic / Diastolic)",
        "unit": "mmHg",
        "normal_reference_range": "< 120 / < 80 mmHg",
        "impaired_prediabetes_range": "120–129 / < 80 mmHg (Elevated BP)",
        "diagnostic_threshold": ">= 130 / >= 80 mmHg (Stage 1 HTN); >= 140 / >= 90 mmHg (Stage 2 HTN)",
        "treatment_target": "< 130 / 80 mmHg for patients with diabetes and cardiovascular risk (ADA / ACC guidelines)",
        "abnormal_indication": "Hypertension is present in >60% of adults with Type 2 diabetes, synergistically accelerating diabetic nephropathy and atherosclerosis.",
        "measurement_source": "PulseBridge Dual Optical PTT Estimate & Clinical Sphygmomanometer Cuff",
        "wokwi_compatibility": "Supported in Wokwi via simulated dual potentiometers and pulse transit time algorithms.",
        "requires_clinical_test": False
    },
    {
        "parameter_name": "Body Mass Index (BMI)",
        "unit": "kg/m²",
        "normal_reference_range": "18.5 – 24.9 kg/m²",
        "impaired_prediabetes_range": "25.0 – 29.9 kg/m² (Overweight; >= 23.0 kg/m² in Asian populations)",
        "diagnostic_threshold": ">= 30.0 kg/m² (Obesity; >= 27.5 kg/m² in Asian populations)",
        "treatment_target": "5%–10% intentional weight reduction achieves substantial glycemic improvement",
        "abnormal_indication": "Visceral adipose tissue releases pro-inflammatory cytokines and free fatty acids, inducing systemic peripheral insulin resistance.",
        "measurement_source": "Clinical Height & Weight Measurement / Patient Profile Entry",
        "wokwi_compatibility": "Captured through patient profile data.",
        "requires_clinical_test": False
    }
]

# -------------------------------------------------------------
# 10 STRUCTURED MAJOR DISEASE KNOWLEDGE BASE
# -------------------------------------------------------------
DISEASE_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "diabetes_mellitus",
        "name": "Diabetes Mellitus (Type 1, Type 2 & Gestational)",
        "category": "Metabolic & Endocrine",
        "short_description": "A chronic metabolic disorder characterized by persistent hyperglycemia resulting from defects in insulin secretion, insulin action, or both.",
        "what_happens_in_body": "In healthy physiology, pancreatic beta cells secrete insulin to transport glucose from the bloodstream into cells for energy. In Type 1 diabetes, autoimmune T-cells destroy beta cells, causing absolute insulin deficiency. In Type 2 diabetes, cells become resistant to insulin while beta cells progressively lose compensatory secretory capacity. Circulating glucose accumulates in the blood, inducing osmotic diuresis and vascular endothelial damage.",
        "common_symptoms": [
            "Frequent urination (polyuria), particularly at night",
            "Excessive thirst (polydipsia)",
            "Extreme hunger (polyphagia) despite food intake",
            "Unexplained weight loss",
            "Persistent fatigue and lethargy",
            "Blurred vision",
            "Slow-healing cuts, sores, or bruising",
            "Tingling, pain, or numbness in the hands or feet (peripheral neuropathy)",
            "Frequent fungal or cutaneous infections"
        ],
        "risk_factors": [
            "Age 45 years or older",
            "Overweight or obesity (BMI >= 25 kg/m², or >= 23 kg/m² in Asian descent)",
            "First-degree family history of diabetes mellitus (parent or sibling)",
            "Physical inactivity (< 150 minutes of moderate activity weekly)",
            "History of gestational diabetes or delivering an infant > 9 lbs (4.1 kg)",
            "Hypertension (BP >= 130/80 mmHg or on antihypertensive therapy)",
            "Dyslipidemia (HDL < 35 mg/dL and/or triglycerides > 250 mg/dL)",
            "Polycystic ovary syndrome (PCOS) or Acanthosis nigricans"
        ],
        "relevant_patient_characteristics": [
            "Age >= 45 years",
            "Elevated BMI (>= 25 kg/m²)",
            "History of hypertension or vascular disease",
            "History of elevated blood pressure readings"
        ],
        "relevant_report_biomarkers": [
            "Fasting Blood Glucose (>= 100 mg/dL impaired, >= 126 mg/dL diagnostic)",
            "HbA1c (>= 5.7% prediabetes, >= 6.5% diagnostic)",
            "Random Blood Glucose (>= 200 mg/dL with symptoms)",
            "Oral Glucose Tolerance Test 2h (>= 140 mg/dL impaired, >= 200 mg/dL diagnostic)",
            "Urine Albumin-to-Creatinine Ratio (uACR >= 30 mg/g indicates nephropathy)",
            "Urine Glucose (Glucosuria)",
            "Serum Ketones (Beta-hydroxybutyrate)"
        ],
        "relevant_health_parameters": [
            "Fasting Glucose (mg/dL)",
            "Random Glucose (mg/dL)",
            "Blood Pressure (Systolic >= 130 mmHg, Diastolic >= 80 mmHg)",
            "Body Mass Index (kg/m²)",
            "Resting Heart Rate (autonomic tachycardia >= 90 bpm at rest)"
        ],
        "diagnostic_tests": [
            "Fasting Plasma Glucose (FPG) test (8-hour overnight fast)",
            "Glycated Hemoglobin (HbA1c) venous blood test (NGSP certified)",
            "75g Oral Glucose Tolerance Test (OGTT)",
            "Random Plasma Glucose with symptom assessment",
            "Autoantibody testing (GAD65, IA-2, ZnT8) for Type 1 vs Type 2 discrimination"
        ],
        "important_warning_signs": [
            "Diabetic Ketoacidosis (DKA): Fruity breath odor, nausea, vomiting, rapid deep Kussmaul breathing, mental confusion (Medical Emergency)",
            "Hyperosmolar Hyperglycemic State (HHS): Blood glucose > 600 mg/dL, severe dehydration, hallucinations, stupor",
            "Severe Hypoglycemia: Tremors, diaphoresis, dizziness, syncope, glucose < 54 mg/dL"
        ],
        "prevention_management": "Comprehensive management incorporates medical nutrition therapy, regular physical activity (>= 150 min/wk), weight reduction (5-10%), pharmacological therapy (Metformin, SGLT2 inhibitors, GLP-1 receptor agonists, insulin), continuous glucose monitoring, and annual screening for retinopathy, nephropathy, and neuropathy.",
        "medical_references": [
            {
                "title": "Standards of Care in Diabetes — 2024",
                "source": "American Diabetes Association (ADA)",
                "url": "https://diabetesjournals.org/care/issue/47/Supplement_1"
            },
            {
                "title": "Global Report on Diabetes",
                "source": "World Health Organization (WHO)",
                "url": "https://www.who.int/publications/i/item/9789241565257"
            },
            {
                "title": "IDF Diabetes Atlas 10th Edition",
                "source": "International Diabetes Federation (IDF)",
                "url": "https://diabetesatlas.org"
            }
        ],
        "overview_route": "/diabetes"
    },
    {
        "id": "hypertension",
        "name": "Hypertension (High Blood Pressure)",
        "category": "Cardiovascular",
        "short_description": "A chronic medical condition in which systemic arterial blood pressure is persistently elevated, imposing excessive workload on the heart and arterial tree.",
        "what_happens_in_body": "Elevated vascular resistance damages arterial walls through mechanical shear stress, triggering endothelial dysfunction, atheroma formation, and left ventricular hypertrophy. Over time, sustained hypertension leads to heart failure, renal failure, hemorrhagic or ischemic stroke, and retinal hemorrhage.",
        "common_symptoms": [
            "Frequently asymptomatic ('The Silent Killer')",
            "Morning occipital headaches",
            "Dizziness or lightheadedness",
            "Epistaxis (nosebleeds)",
            "Visual disturbances or blurred vision",
            "Shortness of breath on exertion",
            "Chest fullness or palpitations"
        ],
        "risk_factors": [
            "Advancing age (>= 60 years)",
            "High dietary sodium intake (> 2,000 mg/day)",
            "Physical inactivity and sedentary habits",
            "Overweight and obesity",
            "Excessive alcohol consumption",
            "Chronic stress and sleep apnea",
            "Family history of early hypertension or cardiovascular disease"
        ],
        "relevant_patient_characteristics": [
            "Age >= 50 years",
            "Elevated BMI",
            "Reported history of elevated blood pressure",
            "Reported sleep apnea or nocturnal oxygen desaturation"
        ],
        "relevant_report_biomarkers": [
            "Serum Creatinine (elevated in hypertensive nephrosclerosis)",
            "Blood Urea Nitrogen (BUN)",
            "Urinary Protein / Microalbuminuria",
            "Serum Electrolytes (Potassium, Sodium)",
            "ECG: Left Ventricular Hypertrophy (Sokolow-Lyon index > 35 mm)"
        ],
        "relevant_health_parameters": [
            "Blood Pressure Systolic (>= 130 mmHg Stage 1, >= 140 mmHg Stage 2)",
            "Blood Pressure Diastolic (>= 80 mmHg Stage 1, >= 90 mmHg Stage 2)",
            "Resting Heart Rate",
            "Pulse Transit Time (PTT arterial stiffness index)"
        ],
        "diagnostic_tests": [
            "24-Hour Ambulatory Blood Pressure Monitoring (ABPM)",
            "Standard clinical resting sphygmomanometer measurements (3 separate visits)",
            "12-Lead Electrocardiogram (ECG)",
            "Comprehensive Metabolic Panel & Urinalysis",
            "Echocardiogram to evaluate left ventricular wall thickness"
        ],
        "important_warning_signs": [
            "Hypertensive Crisis: BP > 180/120 mmHg with chest pain, severe headache, shortness of breath, or neurological deficits (Immediate Emergency)",
            "Acute Pulmonary Edema: Pink frothy sputum with profound dyspnea"
        ],
        "prevention_management": "DASH diet (low sodium, high potassium), regular aerobic exercise, smoking cessation, alcohol moderation, and antihypertensive medications (ACE inhibitors, ARBs, Calcium Channel Blockers, Thiazide diuretics).",
        "medical_references": [
            {
                "title": "2023 ESH Guidelines for the management of arterial hypertension",
                "source": "European Society of Hypertension (ESH)",
                "url": "https://journals.lww.com/jhypertension/fulltext/2023/12000/2023_esh_guidelines_for_the_management_of.2.aspx"
            },
            {
                "title": "Hypertension Guideline 2017",
                "source": "American College of Cardiology (ACC) / AHA",
                "url": "https://www.acc.org/guidelines"
            }
        ],
        "overview_route": None
    },
    {
        "id": "coronary_artery_disease",
        "name": "Coronary Artery Disease (CAD / Ischemic Heart Disease)",
        "category": "Cardiovascular",
        "short_description": "Impairment of coronary blood flow usually caused by atherosclerotic plaque buildup, leading to myocardial ischemia or infarction.",
        "what_happens_in_body": "Cholesterol-rich plaques narrow the coronary arteries, restricting oxygenated blood to the myocardium. When myocardial oxygen demand outstrips supply (during exertion or stress), angina pectoris results. Plaque rupture precipitates platelet aggregation and acute thrombus formation, producing acute myocardial infarction.",
        "common_symptoms": [
            "Angina pectoris (retrosternal chest pressure, tightness, squeezing, or burning)",
            "Radiation of discomfort to jaw, neck, back, left shoulder, or arm",
            "Exertional dyspnea (shortness of breath)",
            "Unusual diaphoresis (cold sweats)",
            "Fatigue during mild exertion",
            "Nausea, lightheadedness, or epigastric discomfort"
        ],
        "risk_factors": [
            "Dyslipidemia (elevated LDL-C, low HDL-C, elevated triglycerides)",
            "Smoking and tobacco use",
            "Hypertension",
            "Diabetes mellitus",
            "Family history of premature coronary disease (male < 55 yrs, female < 65 yrs)",
            "Chronic kidney disease"
        ],
        "relevant_patient_characteristics": [
            "Age >= 55 years (men) or >= 65 years (women)",
            "History of angina, palpitations, or hypertension",
            "Elevated resting heart rate and nocturnal arrhythmia observations"
        ],
        "relevant_report_biomarkers": [
            "High-Sensitivity Cardiac Troponin I / T (elevated in acute myocardial injury)",
            "Lipid Panel (Total Cholesterol > 200, LDL-C > 100, Triglycerides > 150)",
            "High-Sensitivity C-Reactive Protein (hs-CRP > 2.0 mg/L)",
            "ECG ST-segment depression or T-wave inversion (ischemic pattern)",
            "Brain Natriuretic Peptide (BNP / NT-proBNP)"
        ],
        "relevant_health_parameters": [
            "Heart Rate (tachycardia or exertional chronotropic incompetence)",
            "Blood Pressure",
            "SpO2 (hypoxemia during ischemic events)",
            "Photoplethysmography (PPG) pulse morphology alterations"
        ],
        "diagnostic_tests": [
            "12-Lead Electrocardiogram (ECG)",
            "Coronary CT Angiography (CCTA) or Coronary Calcium Score",
            "Exercise Treadmill Stress Test with ECG / Echocardiography",
            "Invasive Coronary Angiography (Gold Standard)"
        ],
        "important_warning_signs": [
            "Acute Coronary Syndrome (ACS): Crushing chest pain lasting > 15 minutes, radiating to arm/jaw with diaphoresis, dyspnea, and syncope (Call 911 / 112 Immediately)"
        ],
        "prevention_management": "Statin therapy, antiplatelet agents (Aspirin), beta-blockers, ACE inhibitors, cardiac rehabilitation, Mediterranean diet, smoking cessation, and revascularization (PCI / CABG) when indicated.",
        "medical_references": [
            {
                "title": "2023 AHA/ACC Guideline for the Management of Patients With Chronic Coronary Disease",
                "source": "AHA / ACC",
                "url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001168"
            }
        ],
        "overview_route": None
    },
    {
        "id": "stroke",
        "name": "Stroke (Cerebrovascular Accident & TIA)",
        "category": "Neurological & Vascular",
        "short_description": "Acute focal neurological deficit caused by interruption of cerebral blood supply (ischemic stroke, 87%) or vascular rupture (hemorrhagic stroke, 13%).",
        "what_happens_in_body": "Deprivation of oxygen and glucose triggers neuronal metabolic failure within minutes, initiating an ischemic core surrounded by a salvageable ischemic penumbra. Immediate reperfusion is required to prevent irreversible necrosis and severe functional disability.",
        "common_symptoms": [
            "Sudden numbness or weakness of face, arm, or leg, especially on one side of the body",
            "Sudden confusion, difficulty speaking (aphasia), or slurred speech (dysarthria)",
            "Sudden visual loss or disturbance in one or both eyes",
            "Sudden trouble walking, loss of balance, dizziness, or coordination deficits",
            "Sudden severe headache with no known cause ('Thunderclap headache')"
        ],
        "risk_factors": [
            "Hypertension (leading modifiable risk factor)",
            "Atrial fibrillation (5-fold elevation in cardioembolic stroke risk)",
            "Diabetes mellitus and insulin resistance",
            "Prior Transient Ischemic Attack (TIA) or stroke",
            "Carotid artery stenosis",
            "Smoking and tobacco use"
        ],
        "relevant_patient_characteristics": [
            "Advancing age",
            "Documented arrhythmia, atrial fibrillation, or hypertension",
            "Reported transient episodes of weakness or numbness"
        ],
        "relevant_report_biomarkers": [
            "ECG: Atrial Fibrillation (irregularly irregular rhythm, absence of P waves)",
            "Carotid Ultrasound (stenosis percentage)",
            "Coagulation Profile (PT/INR, aPTT)",
            "Non-contrast Head CT / MRI Brain"
        ],
        "relevant_health_parameters": [
            "Blood Pressure (acute spikes > 180 mmHg)",
            "Heart Rate Variability (HRV irregularity during paroxysmal AFib)",
            "SpO2"
        ],
        "diagnostic_tests": [
            "Emergent Non-Contrast Head CT or Brain MRI with Diffusion-Weighted Imaging",
            "CT Angiography (CTA) of head and neck",
            "Continuous Cardiac Telemetry for Atrial Fibrillation detection",
            "Echocardiogram (transthoracic / transesophageal for intracardiac thrombus)"
        ],
        "important_warning_signs": [
            "BE-FAST Protocol: Balance loss, Eyesight changes, Facial droop, Arm weakness, Speech difficulty, Time to call emergency (Window for IV thrombolysis is < 4.5 hours)."
        ],
        "prevention_management": "Anticoagulation for atrial fibrillation (DOACs), antiplatelet therapy for non-cardioembolic stroke, rigorous BP control, carotid endarterectomy/stenting for high-grade stenosis, and lifestyle optimization.",
        "medical_references": [
            {
                "title": "Guidelines for the Early Management of Patients With Acute Ischemic Stroke",
                "source": "AHA / American Stroke Association",
                "url": "https://www.ahajournals.org/doi/10.1161/STR.0000000000000211"
            }
        ],
        "overview_route": None
    },
    {
        "id": "chronic_kidney_disease",
        "name": "Chronic Kidney Disease (CKD)",
        "category": "Renal & Urinary",
        "short_description": "Gradual loss of renal function characterized by persistent reduction in estimated glomerular filtration rate (eGFR < 60 mL/min/1.73m²) or kidney damage markers for > 3 months.",
        "what_happens_in_body": "Progressive nephron loss increases intraglomerular pressure in surviving nephrons, causing glomerulosclerosis, tubulointerstitial fibrosis, and declining filtration. Waste products (urea, creatinine) accumulate, and endocrine regulation of erythropoietin, vitamin D, and renin-angiotensin is disrupted.",
        "common_symptoms": [
            "Early stages typically asymptomatic",
            "Peripheral edema (swelling of ankles, feet, legs, or periorbital tissues)",
            "Fatigue, weakness, and generalized malaise (from anemia and uremia)",
            "Changes in urination frequency (nocturia, foamy or bubbly urine)",
            "Loss of appetite, nausea, metallic taste in mouth",
            "Persistent pruritus (itching) and dry skin",
            "Muscle cramping, especially at night"
        ],
        "risk_factors": [
            "Diabetes Mellitus (leading cause worldwide, diabetic nephropathy)",
            "Hypertension (second leading cause, hypertensive nephrosclerosis)",
            "Family history of kidney disease",
            "Frequent use of nephrotoxic medications (NSAIDs, aminoglycosides)",
            "Age > 60 years",
            "Glomerulonephritis or polycystic kidney disease"
        ],
        "relevant_patient_characteristics": [
            "Age >= 60 years",
            "History of diabetes mellitus or hypertension",
            "Documented peripheral edema or swelling"
        ],
        "relevant_report_biomarkers": [
            "Estimated Glomerular Filtration Rate (eGFR < 60 mL/min/1.73m²)",
            "Serum Creatinine (elevated above reference range > 1.2 mg/dL)",
            "Urine Albumin-to-Creatinine Ratio (uACR >= 30 mg/g microalbuminuria, >= 300 macro)",
            "Blood Urea Nitrogen (BUN)",
            "Serum Potassium (Hyperkalemia > 5.0 mEq/L)"
        ],
        "relevant_health_parameters": [
            "Blood Pressure (refractory hypertension)",
            "Resting Heart Rate",
            "Fluid Retention / Weight trends"
        ],
        "diagnostic_tests": [
            "Serum Creatinine with eGFR calculation (CKD-EPI equation)",
            "Spot Urine Albumin-to-Creatinine Ratio (uACR)",
            "Renal Ultrasound (assessing kidney size, parenchymal echogenicity, obstruction)",
            "Urinalysis (assessing cellular casts and hematuria)"
        ],
        "important_warning_signs": [
            "Uremic Pericarditis / Encephalopathy: Asterixis, lethargy, friction rub, pericardial effusion (Immediate dialysis requirement)",
            "Severe Hyperkalemia (K+ > 6.5 mEq/L): Risk of fatal cardiac arrest"
        ],
        "prevention_management": "Renoprotection using SGLT2 inhibitors and ACE inhibitors / ARBs, strict BP control (< 120 mmHg systolic per KDIGO 2021), dietary protein and sodium moderation, and avoidance of nephrotoxic agents.",
        "medical_references": [
            {
                "title": "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease",
                "source": "Kidney Disease: Improving Global Outcomes (KDIGO)",
                "url": "https://kdigo.org/guidelines/ckd-evaluation-and-management/"
            }
        ],
        "overview_route": None
    },
    {
        "id": "copd",
        "name": "Chronic Obstructive Pulmonary Disease (COPD)",
        "category": "Respiratory",
        "short_description": "A common, preventable and treatable chronic lung disease characterized by persistent respiratory symptoms and airflow limitation due to airway and alveolar abnormalities.",
        "what_happens_in_body": "Inhalation of noxious particles (tobacco smoke, biomass fuel) causes chronic bronchitis (mucus hypersecretion and small airway narrowing) and emphysema (destruction of alveolar walls and loss of elastic recoil). Air trapping, hyperinflation, and ventilation-perfusion mismatch result in chronic hypoxemia and hypercapnia.",
        "common_symptoms": [
            "Progressive exertional dyspnea (shortness of breath during daily activities)",
            "Chronic cough, frequently productive with morning sputum",
            "Wheezing and chest tightness",
            "Frequent lower respiratory tract infections",
            "Fatigue and reduced exercise tolerance",
            "Cyanosis of lips or nail beds during exacerbations"
        ],
        "risk_factors": [
            "Tobacco smoking (cigarette, cigar, pipe, cannabis)",
            "Occupational dust and chemical vapor exposure",
            "Indoor biomass cooking and heating fumes",
            "Alpha-1 antitrypsin deficiency (genetic predisposition)",
            "History of severe childhood respiratory infections or asthma"
        ],
        "relevant_patient_characteristics": [
            "Age >= 40 years with history of smoking or environmental exposure",
            "Frequent complaints of shortness of breath or cough",
            "Low resting SpO2 readings (< 94%)"
        ],
        "relevant_report_biomarkers": [
            "Spirometry: Post-bronchodilator FEV1/FVC ratio < 0.70 (Diagnostic hallmark)",
            "Arterial Blood Gas (ABG): Hypoxemia (PaO2 < 60 mmHg) or Hypercapnia (PaCO2 > 45 mmHg)",
            "Chest X-Ray / High-Resolution CT: Hyperinflation, flattened diaphragms, bullae",
            "Complete Blood Count: Secondary polycythemia (elevated hematocrit/hemoglobin)"
        ],
        "relevant_health_parameters": [
            "SpO2 Oxygen Saturation (< 92% baseline or acute dips < 88%)",
            "Respiratory Rate (tachypnea > 20 breaths/min)",
            "Heart Rate (cor pulmonale tachycardia)",
            "Activity Percent (reduced mobility index)"
        ],
        "diagnostic_tests": [
            "Diagnostic Post-Bronchodilator Spirometry (Gold Standard)",
            "Pulse Oximetry and 6-Minute Walk Test",
            "High-Resolution Chest CT",
            "Alpha-1 Antitrypsin level test"
        ],
        "important_warning_signs": [
            "Acute COPD Exacerbation: Marked increase in dyspnea, sputum volume and purulence, acute drop in SpO2 < 85%, use of accessory respiratory muscles (Emergency evaluation required)"
        ],
        "prevention_management": "Smoking cessation (most critical intervention), inhaled bronchodilators (LABA/LAMA), inhaled corticosteroids for frequent exacerbators, pulmonary rehabilitation, vaccinations (influenza, pneumococcal, RSV, COVID-19), and supplemental oxygen therapy when PaO2 <= 55 mmHg.",
        "medical_references": [
            {
                "title": "Global Strategy for Prevention, Diagnosis and Management of COPD (2024 Report)",
                "source": "Global Initiative for Chronic Obstructive Lung Disease (GOLD)",
                "url": "https://goldcopd.org/2024-gold-report/"
            }
        ],
        "overview_route": None
    },
    {
        "id": "anaemia",
        "name": "Anaemia (Iron Deficiency & Chronic Disease)",
        "category": "Hematology",
        "short_description": "A condition in which the number of red blood cells or their oxygen-carrying capacity (hemoglobin concentration) is insufficient to meet physiological needs.",
        "what_happens_in_body": "Inadequate hemoglobin impairs systemic oxygen delivery to tissues. The body attempts to compensate through increased cardiac output (resting tachycardia, flow murmurs) and tissue extraction, manifesting as exercise intolerance, cognitive fog, and pallor.",
        "common_symptoms": [
            "Chronic generalized fatigue and lethargy",
            "Weakness and lightheadedness upon standing",
            "Pale skin, conjunctiva, nail beds, or mucosal pallor",
            "Cold hands and feet",
            "Headaches and difficulty concentrating",
            "Exertional dyspnea and tachycardia / palpitations",
            "Brittle nails (koilonychia) or pica (craving ice, dirt, or starch in iron deficiency)"
        ],
        "risk_factors": [
            "Chronic blood loss (heavy menstruation, occult gastrointestinal bleeding)",
            "Dietary insufficiency of iron, vitamin B12, or folate",
            "Malabsorption disorders (celiac disease, post-bariatric surgery)",
            "Chronic inflammatory diseases (CKD, rheumatoid arthritis, malignancy)",
            "Pregnancy and lactation"
        ],
        "relevant_patient_characteristics": [
            "Female of reproductive age or geriatric patient with gastrointestinal history",
            "Documented chronic fatigue or pallor complaints",
            "Elevated resting heart rate with normal SpO2"
        ],
        "relevant_report_biomarkers": [
            "Hemoglobin (Hb < 12.0 g/dL in women, < 13.0 g/dL in men per WHO)",
            "Hematocrit (Hct < 36% women, < 41% men)",
            "Serum Ferritin (< 30 mcg/L indicates depleted iron stores)",
            "Mean Corpuscular Volume (MCV < 80 fL microcytic, > 100 fL macrocytic)",
            "Total Iron Binding Capacity (TIBC) and Transferrin Saturation (< 20%)"
        ],
        "relevant_health_parameters": [
            "Heart Rate (compensatory resting tachycardia >= 90–100 bpm)",
            "SpO2 (may remain deceptively normal despite severe functional hypoxemia)",
            "Blood Pressure (mild orthostatic hypotension)"
        ],
        "diagnostic_tests": [
            "Complete Blood Count (CBC) with differential and red cell indices",
            "Serum Iron Panel (Iron, Ferritin, TIBC, Transferrin Saturation)",
            "Fecal Occult Blood Test (FOBT) or Colonoscopy/Endoscopy to identify GI blood loss",
            "Serum Vitamin B12 and Folate assays"
        ],
        "important_warning_signs": [
            "Severe Symptomatic Anaemia: Angina, syncope, severe tachycardia (HR > 120 bpm), orthostatic collapse, or acute gastrointestinal hemorrhage (black tarry stools or hematemesis) requiring urgent transfusion"
        ],
        "prevention_management": "Identification and treatment of underlying bleeding etiology, oral or intravenous iron repletion, dietary optimization, vitamin B12/folate supplementation, and erythropoiesis-stimulating agents in advanced CKD.",
        "medical_references": [
            {
                "title": "WHO Guidelines on the prevention and management of anaemia",
                "source": "World Health Organization (WHO)",
                "url": "https://www.who.int/publications/i/item/9789240070776"
            }
        ],
        "overview_route": None
    },
    {
        "id": "thyroid_disorders",
        "name": "Thyroid Disorders (Hypothyroidism & Hyperthyroidism)",
        "category": "Endocrine",
        "short_description": "Functional disorders of the thyroid gland characterized by underproduction (hypothyroidism) or overproduction (hyperthyroidism/thyrotoxicosis) of thyroid hormones (T3 and T4).",
        "what_happens_in_body": "Thyroid hormones modulate basal metabolic rate, cardiac contractility, lipid metabolism, and thermogenesis. Hypothyroidism slows systemic metabolism, yielding bradycardia, fluid retention, and lethargy. Hyperthyroidism induces hypermetabolism, yielding sinus tachycardia, arrhythmias (atrial fibrillation), tremor, and catabolic weight loss.",
        "common_symptoms": [
            "Hypothyroidism: Cold intolerance, weight gain, constipation, dry skin, coarse hair, fatigue, bradycardia, muscle cramps, depression",
            "Hyperthyroidism: Heat intolerance, unexplained weight loss despite hyperphagia, palpitations, hand tremors, frequent bowel movements, anxiety, sleep disturbances",
            "Palpable thyroid enlargement (goiter) or neck fullness"
        ],
        "risk_factors": [
            "Female sex (5–8 times higher prevalence in women)",
            "Personal or family history of autoimmune disorders (Type 1 diabetes, celiac, vitiligo)",
            "Postpartum state (postpartum thyroiditis)",
            "Prior thyroid surgery or radioiodine therapy",
            "Excessive or deficient iodine intake",
            "Medications (amiodarone, lithium, immune checkpoint inhibitors)"
        ],
        "relevant_patient_characteristics": [
            "Female patient or patient with existing autoimmune conditions",
            "Unexplained weight fluctuations or temperature intolerance",
            "Marked resting heart rate abnormalities (unexplained bradycardia or tachycardia)"
        ],
        "relevant_report_biomarkers": [
            "Thyroid Stimulating Hormone (TSH: Normal 0.4–4.0 mIU/L; > 4.5 in primary hypothyroidism; < 0.1 in hyperthyroidism)",
            "Free Thyroxine (Free T4: low in overt hypothyroidism, high in overt hyperthyroidism)",
            "Free Triiodothyronine (Free T3)",
            "Thyroid Peroxidase Antibodies (anti-TPO positive in Hashimoto's thyroiditis)",
            "TSH Receptor Antibodies (TRAb positive in Graves' disease)"
        ],
        "relevant_health_parameters": [
            "Resting Heart Rate (marked bradycardia < 55 bpm in hypothyroidism; tachycardia > 100 bpm in hyperthyroidism)",
            "Skin Temperature",
            "Blood Pressure (widened pulse pressure in hyperthyroidism)"
        ],
        "diagnostic_tests": [
            "Serum TSH (First-line screening test)",
            "Reflex Free T4 and Free T3 assays",
            "Thyroid Ultrasound (nodule and parenchymal echogenicity evaluation)",
            "Radioactive Iodine Uptake and Scan (RAIU)"
        ],
        "important_warning_signs": [
            "Thyroid Storm: Severe hyperpyrexia (> 40°C), delirium, tachyarrhythmias, heart failure (Critical Emergency)",
            "Myxedema Coma: Severe hypothermia, progressive lethargy, hypoventilation, bradycardia (Critical Emergency)"
        ],
        "prevention_management": "Levothyroxine sodium replacement therapy for hypothyroidism (titrated to normal TSH); antithyroid medications (Methimazole), radioactive iodine ablation, or surgery for hyperthyroidism.",
        "medical_references": [
            {
                "title": "Clinical Practice Guidelines for Hypothyroidism in Adults",
                "source": "American Thyroid Association (ATA) / AACE",
                "url": "https://www.thyroid.org/professionals/ata-professional-guidelines/"
            }
        ],
        "overview_route": None
    },
    {
        "id": "heart_failure",
        "name": "Heart Failure (CHF / HFrEF & HFpEF)",
        "category": "Cardiovascular",
        "short_description": "A complex clinical syndrome resulting from structural or functional impairment of ventricular filling or ejection of blood.",
        "what_happens_in_body": "Myocardial damage (from ischemia, hypertension, or cardiomyopathy) reduces cardiac output. Neurohormonal compensatory mechanisms (renin-angiotensin-aldosterone and sympathetic nervous system) drive sodium retention, vasoconstriction, and ventricular remodeling, eventually producing pulmonary and systemic venous congestion.",
        "common_symptoms": [
            "Orthopnea (shortness of breath when lying flat requiring multiple pillows)",
            "Paroxysmal Nocturnal Dyspnea (PND — waking suddenly gasping for air)",
            "Bilateral lower-extremity pitting edema (swollen feet, ankles, and legs)",
            "Severe exertional fatigue and exercise intolerance",
            "Persistent dry cough or wheezing with pink-tinged sputum",
            "Rapid unexplained fluid weight gain (> 2–3 lbs in 24 hours)",
            "Abdominal swelling, bloating, or right upper quadrant discomfort (hepatic congestion)"
        ],
        "risk_factors": [
            "Pre-existing coronary artery disease or prior myocardial infarction",
            "Longstanding uncontrolled hypertension",
            "Diabetes mellitus",
            "Valvular heart disease",
            "Cardiomyopathy (dilated, hypertrophic, or amyloid)",
            "Sleep apnea and chronic kidney disease"
        ],
        "relevant_patient_characteristics": [
            "Age >= 65 years",
            "History of myocardial infarction, hypertension, or arrhythmia",
            "Complaints of orthopnea, fluid retention, or nocturnal cough"
        ],
        "relevant_report_biomarkers": [
            "B-Type Natriuretic Peptide (BNP > 100 pg/mL) or NT-proBNP (> 300 pg/mL)",
            "Echocardiogram: Left Ventricular Ejection Fraction (LVEF <= 40% HFrEF, >= 50% HFpEF)",
            "Serum Creatinine and BUN (Cardiorenal syndrome)",
            "Serum Electrolytes (hyponatremia indicates advanced disease)",
            "Chest X-Ray: Cardiomegaly, pulmonary vascular congestion, Kerley B lines"
        ],
        "relevant_health_parameters": [
            "Heart Rate (resting tachycardia >= 85–100 bpm from sympathetic drive)",
            "SpO2 (nocturnal and exertional oxygen desaturation)",
            "Blood Pressure",
            "Activity Index (drastic decline in daily motion)"
        ],
        "diagnostic_tests": [
            "Transthoracic Echocardiogram (TTE) with Doppler",
            "Serum BNP / NT-proBNP assay (High negative predictive value)",
            "12-Lead Electrocardiogram",
            "Chest Radiography"
        ],
        "important_warning_signs": [
            "Acute Decompensated Heart Failure (ADHF): Severe respiratory distress, inability to speak full sentences, cold clammy extremities, marked hypoxia (Call emergency services immediately)"
        ],
        "prevention_management": "Guideline-Directed Medical Therapy (GDMT): Quadruple therapy with ARNI (Sacubitril/Valsartan), Beta-blockers (Carvedilol/Metoprolol succinate), MRA (Spironolactone/Eplerenone), and SGLT2 inhibitors (Dapagliflozin/Empagliflozin); loop diuretics (Furosemide) for decongestion.",
        "medical_references": [
            {
                "title": "2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure",
                "source": "AHA / ACC / HFSA",
                "url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063"
            }
        ],
        "overview_route": None
    },
    {
        "id": "respiratory_infections",
        "name": "Respiratory Infections (Pneumonia & Lower Respiratory Infections)",
        "category": "Infectious & Pulmonology",
        "short_description": "Infection of the pulmonary parenchyma (pneumonia) or tracheobronchial tree (bronchitis) caused by bacterial, viral, or fungal pathogens.",
        "what_happens_in_body": "Inhaled or aspirated pathogens evade mucosal defenses, proliferating within alveoli and distal bronchioles. Host inflammatory recruitment fills alveolar spaces with purulent exudate, cellular debris, and inflammatory fluid, causing pulmonary consolidation, impaired gas exchange, and hypoxemia.",
        "common_symptoms": [
            "Cough productive of purulent, greenish, yellow, or rust-colored sputum",
            "Fever, shaking chills, and rigor",
            "Pleuritic chest pain (sharp pain aggravated by deep inspiration or coughing)",
            "Dyspnea (shortness of breath) and tachypnea",
            "Fatigue, muscle aches (myalgias), and headache",
            "Confusion or altered mental status, especially in elderly patients"
        ],
        "risk_factors": [
            "Age < 2 years or >= 65 years",
            "Chronic medical conditions (COPD, asthma, heart failure, diabetes)",
            "Immunosuppression (chemotherapy, organ transplant, corticosteroids)",
            "Cigarette smoking and toxic inhalant exposure",
            "Recent viral upper respiratory infection (influenza, COVID-19, RSV)",
            "Impaired swallowing or aspiration risk (dementia, stroke)"
        ],
        "relevant_patient_characteristics": [
            "Age >= 65 years with acute onset of cough or fever",
            "Recent acute drop in peripheral SpO2",
            "Elevated temperature readings and resting tachycardia"
        ],
        "relevant_report_biomarkers": [
            "Complete Blood Count: Leukocytosis (WBC > 11,000/mcL with bandemia / left shift)",
            "C-Reactive Protein (elevated CRP > 50 mg/L)",
            "Serum Procalcitonin (> 0.25 mcg/L suggests bacterial etiology)",
            "Chest X-Ray / CT: Focal alveolar consolidation, air bronchograms, or interstitial infiltrates",
            "Sputum Culture & Gram Stain, Blood Cultures"
        ],
        "relevant_health_parameters": [
            "SpO2 Oxygen Saturation (< 92% suggests significant impairment of gas exchange)",
            "Temperature (febrile > 38.0°C or hypothermic < 36.0°C in elderly sepsis)",
            "Heart Rate (tachycardia > 100 bpm)",
            "Respiratory Rate (tachypnea > 24 breaths/min)"
        ],
        "diagnostic_tests": [
            "Posterior-Anterior and Lateral Chest Radiography (Diagnostic standard)",
            "Pulse Oximetry continuous monitoring",
            "Complete Blood Count with differential and inflammatory markers (CRP/Procalcitonin)",
            "Multiplex PCR respiratory viral and bacterial panel"
        ],
        "important_warning_signs": [
            "Sepsis / Severe Pneumonia: CURB-65 criteria (Confusion, BUN > 19 mg/dL, Respiratory Rate >= 30, Low BP < 90/60, Age >= 65). Acute drop in SpO2 < 88% or cyanosis requires immediate emergency hospitalization."
        ],
        "prevention_management": "Appropriate antimicrobial therapy (targeted antibiotics for bacterial pneumonia, antivirals for influenza/COVID-19), supplemental oxygen for hypoxemia, chest physiotherapy, and prophylactic vaccination (Pneumococcal conjugate/polysaccharide and annual influenza vaccines).",
        "medical_references": [
            {
                "title": "Diagnosis and Treatment of Adults with Community-acquired Pneumonia",
                "source": "ATS / IDSA",
                "url": "https://www.atsjournals.org/doi/10.1164/rccm.201908-1581ST"
            },
            {
                "title": "Pneumonia in Adults: Diagnosis and Management",
                "source": "National Institute for Health and Care Excellence (NICE)",
                "url": "https://www.nice.org.uk/guidance/cg191"
            }
        ],
        "overview_route": None
    }
]

def get_disease_by_id(disease_id: str) -> Optional[Dict[str, Any]]:
    for d in DISEASE_KNOWLEDGE_BASE:
        if d["id"] == disease_id:
            return d
    return None

def get_all_diseases() -> List[Dict[str, Any]]:
    return DISEASE_KNOWLEDGE_BASE

def get_diabetes_overview_data() -> Dict[str, Any]:
    diabetes_item = get_disease_by_id("diabetes_mellitus")
    return {
        "disease_info": diabetes_item,
        "global_statistics": GLOBAL_DIABETES_STATISTICS,
        "parameter_references": DIABETES_PARAMETER_REFERENCES
    }
