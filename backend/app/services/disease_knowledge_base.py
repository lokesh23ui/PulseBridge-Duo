"""
PulseBridge Duo — Atrial Fibrillation (AFib) Clinical Knowledge Base & Diagnostic Reference
Authoritative cardiology guidelines: ACC/AHA/ACCP/HRS, ESC, NICE, CDC, WHO.
"""

from typing import List, Dict, Any, Optional

# -------------------------------------------------------------
# GLOBAL ATRIAL FIBRILLATION STATISTICS (VERIFIED SOURCES)
# -------------------------------------------------------------
GLOBAL_AFIB_STATISTICS = {
    "title": "Global Atrial Fibrillation (AFib) Prevalence & Disease Burden",
    "key_metrics": [
        {
            "statistic": "37.5 – 50 Million Individuals Worldwide",
            "description": "Estimated global population living with Atrial Fibrillation. The Global Burden of Disease study identified 37.5 million prevalent cases in 2017, with current projections exceeding 50 million cases globally driven by population aging and improved detection.",
            "reporting_year": 2020,
            "geographical_scope": "Global (195 countries & territories)",
            "source": "Global Burden of Disease (GBD) Study / Lancet & AHA 2024 Heart Disease and Stroke Statistics",
            "source_url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001209",
            "projection_note": "Prevalence is projected to increase by over 60% by 2050 due to longevity and improved surveillance."
        },
        {
            "statistic": "1 in 3 Lifetime Risk (Adults >= 45 yrs)",
            "description": "Cumulative lifetime risk of developing Atrial Fibrillation for individuals aged 45 years and older across longitudinal epidemiological cohorts (Framingham Heart Study & Rotterdam Study).",
            "reporting_year": 2023,
            "geographical_scope": "North America & Europe (Generalizable Global Cohorts)",
            "source": "2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation",
            "source_url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193",
            "projection_note": "Lifetime risk is approximately 1 in 3 to 1 in 4 in individuals with pre-existing hypertension or cardiovascular disease."
        },
        {
            "statistic": "20% – 30% of All Ischemic Strokes",
            "description": "Proportion of all ischemic strokes attributable to cardioembolic thrombi originating in the atria or left atrial appendage during AFib. AFib-related strokes are typically larger, more debilitating, and have higher mortality than non-AFib strokes.",
            "reporting_year": 2020,
            "geographical_scope": "Global",
            "source": "European Society of Cardiology (ESC) Atrial Fibrillation Guidelines",
            "source_url": "https://academic.oup.com/eurheartj/article/42/5/373/5899003",
            "projection_note": "Appropriate oral anticoagulation (DOACs) reduces AFib-related ischemic stroke risk by approximately 64%."
        },
        {
            "statistic": "Reliable global AFib-specific annual death estimate unavailable",
            "description": "Mortality is predominantly recorded under resultant complications (ischemic stroke, heart failure, and sudden cardiac death) rather than primary AFib on standard death certificates.",
            "reporting_year": 2024,
            "geographical_scope": "Global",
            "source": "World Health Organization (WHO) & American Heart Association (AHA)",
            "source_url": "https://www.cdc.gov/heart-disease/about/atrial-fibrillation.html",
            "projection_note": "Deaths associated with AFib complications (such as thromboembolic stroke and heart failure) account for millions of cardiovascular deaths annually, but direct AFib-specific mortality is not independently quantified in global death registries."
        },
        {
            "statistic": "Up to 30% Asymptomatic / Silent AFib",
            "description": "Proportion of patients with Atrial Fibrillation who experience no noticeable symptoms (silent AFib). Many are diagnosed only after presenting with an acute thromboembolic stroke or during routine ECG screening.",
            "reporting_year": 2021,
            "geographical_scope": "Global",
            "source": "Circulation: Arrhythmia and Electrophysiology Review Series",
            "source_url": "https://www.ahajournals.org",
            "projection_note": "Pulse rhythm awareness and targeted ECG surveillance in high-risk individuals enable earlier stroke prophylaxis."
        }
    ],
    "public_health_summary": "Atrial Fibrillation (AFib) is the most common sustained cardiac arrhythmia encountered in clinical practice worldwide. It poses a massive public health burden through its 5-fold increase in ischemic stroke risk, 3-fold increase in heart failure incidence, and substantial elevation in cardiovascular hospitalizations and cognitive impairment."
}

# -------------------------------------------------------------
# AFIB SYMPTOM CATALOGUE (EXACT 11 SYMPTOMS)
# -------------------------------------------------------------
AFIB_SYMPTOM_CATALOGUE = [
    {
        "id": "irregular_heartbeat_rhythm",
        "name": "Irregular heartbeat rhythm",
        "short_description": "An uneven or irregular pulse or heartbeat sensation.",
        "clinical_note": "The primary clinical hallmark of Atrial Fibrillation is an irregularly irregular ventricular rhythm. The pulse may feel erratic or chaotic with no discernible pattern.",
        "is_primary": True
    },
    {
        "id": "heart_palpitations",
        "name": "Heart palpitations",
        "short_description": "Pounding, fluttering, racing or skipped-beat sensations in the chest.",
        "clinical_note": "Patients frequently describe fluttering or flopping sensations in the chest or neck, especially when resting quietly or lying down.",
        "is_primary": False
    },
    {
        "id": "rapid_heartbeat",
        "name": "Rapid heartbeat",
        "short_description": "Noticeably fast heart rate (tachycardia) occurring at rest or with minimal exertion.",
        "clinical_note": "Ventricular response in untreated AFib commonly ranges between 100 and 175 beats per minute due to variable AV nodal conduction.",
        "is_primary": False
    },
    {
        "id": "unusual_fatigue",
        "name": "Unusual fatigue or tiredness",
        "short_description": "Persistent lack of energy, disproportionate exhaustion, or lethargy.",
        "clinical_note": "Loss of the synchronized 20-30% atrial contribution to ventricular filling ('atrial kick') diminishes cardiac output, leading to tissue hypoperfusion and chronic fatigue.",
        "is_primary": False
    },
    {
        "id": "dizziness_lightheadedness",
        "name": "Dizziness or lightheadedness",
        "short_description": "Feeling unsteady, woozy, or lightheaded upon standing or during rhythm changes.",
        "clinical_note": "Transient reductions in cerebral perfusion pressure during rapid or irregular ventricular cycles may provoke lightheadedness.",
        "is_primary": False
    },
    {
        "id": "shortness_of_breath",
        "name": "Shortness of breath",
        "short_description": "Dyspnea occurring during mild exertion or while lying flat.",
        "clinical_note": "Elevated left atrial pressures and reduced cardiac output cause pulmonary venous congestion, manifesting as exertional or nocturnal dyspnea.",
        "is_primary": False
    },
    {
        "id": "chest_discomfort_tightness",
        "name": "Chest discomfort or tightness",
        "short_description": "Aching, pressure, squeezing, or tightness in the anterior chest.",
        "clinical_note": "Rapid ventricular rates increase myocardial oxygen demand, which can induce subendocardial ischemia, especially in the presence of underlying coronary disease. Chest pain must always be evaluated to rule out acute coronary syndrome.",
        "is_primary": False
    },
    {
        "id": "general_weakness",
        "name": "General weakness",
        "short_description": "Overall loss of physical strength or stamina during routine daily activities.",
        "clinical_note": "Systemic hemodynamic inefficiency caused by loss of AV synchrony and erratic stroke volume reduces muscular oxygen delivery.",
        "is_primary": False
    },
    {
        "id": "reduced_exercise_tolerance",
        "name": "Reduced exercise tolerance",
        "short_description": "Inability to maintain previously comfortable levels of physical activity or exercise.",
        "clinical_note": "During exertion, the heart in AFib cannot augment cardiac output effectively, leading to early anaerobic threshold and exertional fatigue.",
        "is_primary": False
    },
    {
        "id": "feeling_faint",
        "name": "Feeling faint or near-fainting",
        "short_description": "Presyncope, tunnel vision, or sensation of imminent loss of consciousness.",
        "clinical_note": "Occurs when abrupt onset of rapid ventricular rates or prolonged pauses upon termination of an AFib episode (tachy-brady syndrome) cause critical drops in cerebral perfusion.",
        "is_primary": False
    },
    {
        "id": "anxiety_heartbeat",
        "name": "Anxiety associated with noticeable heartbeat sensations",
        "short_description": "Nervousness, apprehension, or acute anxiety triggered by erratic heart sensations.",
        "clinical_note": "The unpredictable and chaotic sensation of an irregular heartbeat triggers sympathetic nervous system activation, frequently producing profound situational anxiety.",
        "is_primary": False
    }
]

# -------------------------------------------------------------
# AFIB HEALTH PARAMETERS CLINICAL REFERENCE (EXACTLY FOUR PARAMETERS)
# -------------------------------------------------------------
AFIB_PARAMETER_REFERENCES = [
    {
        "parameter_name": "Heart Rhythm / ECG",
        "clinical_role": "Diagnostic confirmation",
        "unit": "ECG waveform",
        "data_source": "Uploaded ECG / verified ECG data",
        "clinical_limitation": "Requires ECG interpretation",
        "clinical_relevance": "A 12-lead ECG is the definitive diagnostic gold standard used to confirm Atrial Fibrillation (irregularly irregular RR intervals, absence of distinct P waves for >= 30 seconds). Findings are displayed only when supported by an actual patient report or verified clinical record.",
        "is_diagnostic": True
    },
    {
        "parameter_name": "Heart Rate",
        "clinical_role": "Monitoring",
        "unit": "BPM",
        "data_source": "Verified patient records",
        "clinical_limitation": "Cannot confirm AFib alone",
        "clinical_relevance": "Ventricular rate monitoring provides essential physiological context. Untreated AFib commonly exhibits resting tachycardia (100–175 bpm), but elevated heart rate alone cannot confirm AFib since sinus tachycardia and exertion also raise BPM.",
        "is_diagnostic": False
    },
    {
        "parameter_name": "Heart Rate Variability (HRV)",
        "clinical_role": "Supporting physiological information",
        "unit": "ms",
        "data_source": "Validated ECG/PPG data",
        "clinical_limitation": "Not an AFib diagnostic test",
        "clinical_relevance": "HRV measures beat-to-beat variations in consecutive R-R / interbeat intervals (RMSSD and SDNN), reflecting autonomic modulation. In active AFib, ventricular response is chaotic, which renders conventional sinus-rhythm HRV reference ranges misleading. HRV is not a diagnostic test for AFib.",
        "is_diagnostic": False
    },
    {
        "parameter_name": "Oxygen Saturation (SpO₂)",
        "clinical_role": "General oxygenation monitoring",
        "unit": "%",
        "data_source": "Verified patient records",
        "clinical_limitation": "Cannot confirm AFib",
        "clinical_relevance": "SpO₂ assesses peripheral arterial hemoglobin oxygen saturation. It provides general oxygenation surveillance to detect comorbid pulmonary compromise or acute decompensation, but SpO₂ cannot confirm or exclude Atrial Fibrillation.",
        "is_diagnostic": False
    }
]

# -------------------------------------------------------------
# SINGLE-DISEASE KNOWLEDGE BASE: ATRIAL FIBRILLATION ONLY
# -------------------------------------------------------------
ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM: Dict[str, Any] = {
    "id": "atrial_fibrillation",
    "name": "Atrial Fibrillation",
    "short_name": "AFib",
    "category": "Cardiac arrhythmia",
    "short_description": "An abnormal heart rhythm in which the atria beat irregularly and often rapidly.",
    "what_happens_in_heart": (
        "In normal cardiac physiology, an electrical impulse generated by the sinoatrial (SA) node in the right atrium "
        "spreads uniformly across both atria, causing synchronized atrial contraction before conducting through the atrioventricular (AV) node "
        "to trigger ventricular systole. In Atrial Fibrillation, multiple chaotic electrical wavelets or rapid firing triggers—most commonly originating "
        "within the myocardial sleeves of the pulmonary veins—cause the atria to quiver irregularly at rates of 300 to 600 impulses per minute. "
        "The AV node acts as an electrical filter, but allows an irregular, unpredictable bombardment of impulses to reach the ventricles, "
        "resulting in an irregularly irregular ventricular response. This causes loss of the coordinated 20% to 30% atrial filling contribution ('atrial kick'), "
        "reduces effective cardiac output, and promotes blood stasis within the trabeculated left atrial appendage (LAA), where thromboembolic clots form."
    ),
    "types": [
        {
            "type_name": "Paroxysmal Atrial Fibrillation",
            "duration": "Terminates spontaneously or with intervention within 7 days (usually < 48 hours).",
            "clinical_significance": "Episodes are intermittent and unpredictable. Stroke risk is clinically equivalent to persistent forms; anticoagulation decisions are guided by CHA2DS2-VASc score rather than episode frequency or duration."
        },
        {
            "type_name": "Persistent Atrial Fibrillation",
            "duration": "Continuously sustained for more than 7 days.",
            "clinical_significance": "Does not self-terminate spontaneously. Requires active rhythm-control interventions (electrical or pharmacological cardioversion, catheter ablation) or rate-control therapy."
        },
        {
            "type_name": "Long-standing Persistent Atrial Fibrillation",
            "duration": "Continuous Atrial Fibrillation lasting longer than 12 months.",
            "clinical_significance": "Substantial structural remodeling, atrial fibrosis, and cavity dilation have occurred. Rhythm control is technically challenging but still considered when symptoms or tachycardiomyopathy persist."
        },
        {
            "type_name": "Permanent Atrial Fibrillation",
            "duration": "Variable duration where rhythm control is no longer pursued.",
            "clinical_significance": "Accepted by both patient and physician as the chronic rhythm. Treatment strategy focuses exclusively on ventricular rate control and appropriate stroke prevention anticoagulation."
        }
    ],
    "common_symptoms": [s["name"] for s in AFIB_SYMPTOM_CATALOGUE],
    "symptom_catalogue": AFIB_SYMPTOM_CATALOGUE,
    "symptom_notes": (
        "Symptoms vary widely between individuals. Some patients experience debilitating palpitations and breathlessness, "
        "while up to 30% of individuals have silent / asymptomatic AFib with no noticeable symptoms. Experiencing one symptom "
        "does not mean the patient has AFib. Chest discomfort should be evaluated in proper clinical context to rule out acute coronary syndromes."
    ),
    "causes_and_risk_factors": [
        "Advancing age (prevalence rises steeply beyond 65 years, reaching > 10% past 80 years)",
        "Hypertension (high blood pressure — the most common modifiable risk factor)",
        "Coronary artery disease and prior myocardial infarction",
        "Valvular heart disease (especially rheumatic or degenerative mitral regurgitation/stenosis)",
        "Heart failure (reduced or preserved ejection fraction — bidirectional adverse relationship)",
        "Obstructive sleep apnea (OSA — induces intermittent hypoxia and nocturnal vagal/sympathetic surges)",
        "Obesity and elevated BMI",
        "Diabetes mellitus and metabolic syndrome",
        "Thyroid disorders (particularly overt or subclinical hyperthyroidism)",
        "Chronic kidney disease (CKD)",
        "Excessive alcohol consumption / acute binge drinking ('Holiday Heart Syndrome')",
        "Family history and genetic predisposition (e.g. KCNQ1, PITX2 gene loci)",
        "Prior cardiothoracic surgery (postoperative AFib occurs in 20-40% of cardiac surgeries)"
    ],
    "diagnostic_methods": [
        "12-Lead Electrocardiogram (Gold Standard: reveals irregularly irregular RR intervals, absence of distinct P waves, for >= 30 seconds)",
        "Ambulatory Holter Monitoring (24-48 hours) or Wearable Patch Monitors (7-14 days) for intermittent paroxysmal detection",
        "Mobile Cardiac Telemetry (MCT) and Event Recorders for infrequent symptom correlation",
        "Implantable Loop Recorders (ILR) for cryptogenic stroke or recurrent unexplained syncope",
        "Transthoracic Echocardiogram (TTE) to quantify left atrial enlargement, LV systolic/diastolic function, and valvular morphology",
        "Transesophageal Echocardiogram (TEE) to exclude left atrial appendage thrombus prior to cardioversion",
        "Laboratory Testing: TSH, Free T4, Serum Electrolytes (Potassium, Magnesium), Renal function, Complete Blood Count"
    ],
    "possible_complications": [
        "Thromboembolic Stroke: 5-fold elevation in ischemic stroke risk; clots dislodging from the left atrial appendage cause severe cerebral infarctions with high morbidity and mortality.",
        "Systemic Arterial Embolism: Clots traveling to renal, mesenteric, or peripheral limb arteries.",
        "Heart Failure: Tachycardiomyopathy resulting from chronic uncontrolled rapid ventricular rates; loss of 20-30% atrial filling reduces cardiac reserve.",
        "Cognitive Impairment & Vascular Dementia: Associated with micro-emboli, silent cerebral infarcts, and chronic cerebral hypoperfusion.",
        "Increased Cardiovascular Mortality: Approximately 1.5- to 2-fold increase in all-cause mortality compared to individuals in sinus rhythm."
    ],
    "treatment_overview": {
        "rate_control": "Pharmacological therapy to slow AV nodal conduction and maintain resting ventricular rate < 100-110 bpm (beta-blockers such as metoprolol/bisoprolol, non-dihydropyridine calcium channel blockers like diltiazem/verapamil, or digoxin).",
        "rhythm_control": "Restoration and maintenance of normal sinus rhythm to alleviate symptoms and reduce remodeling (antiarrhythmic drugs: flecainide, propafenone, amiodarone, dronedarone, sotalol, dofetilide).",
        "anticoagulation": "Stroke risk stratification using the validated CHA2DS2-VASc score (Congestive heart failure, Hypertension, Age >= 75 [2 pts], Diabetes, Stroke/TIA [2 pts], Vascular disease, Age 65-74, Sex category female). Direct Oral Anticoagulants (DOACs: apixaban, rivaroxaban, dabigatran, edoxaban) are preferred over warfarin for non-valvular AFib.",
        "cardioversion": "Synchronized direct-current (DC) electrical cardioversion or pharmacological cardioversion to convert AFib back to sinus rhythm, accompanied by at least 3 weeks of prior anticoagulation or TEE rule-out of thrombus.",
        "catheter_ablation": "Pulmonary Vein Isolation (PVI) using radiofrequency or cryoballoon energy to electrically isolate ectopic triggers. AV node ablation with permanent pacemaker implantation ('ablate and pace') is considered for refractory rate control.",
        "surgical_interventions": "Surgical Cox-Maze procedure performed concurrently with cardiac surgery, and Left Atrial Appendage Occlusion (LAAO / Watchman device) for patients with high stroke risk who have contraindications to long-term oral anticoagulation."
    },
    "lifestyle_and_management": (
        "Comprehensive lifestyle modification is integral to rhythm control: achieving optimal blood pressure (< 130/80 mmHg), "
        "weight loss (>= 10% reduction correlates with substantial decrease in AFib burden and symptom recurrence), "
        "rigorous treatment of obstructive sleep apnea with CPAP, avoidance or substantial reduction of alcohol intake, "
        "regular moderate aerobic conditioning, and strict adherence to prescribed anticoagulation regimens."
    ),
    "when_to_seek_urgent_medical_attention": (
        "EMERGENCY SAFETY NOTICE: If experiencing a fast or irregular heartbeat accompanied by CHEST PAIN, "
        "SEVERE BREATHING DIFFICULTY, FAINTING, or STROKE SYMPTOMS (sudden facial drooping, arm weakness, speech difficulty — BE-FAST), "
        "CALL EMERGENCY SERVICES (911 / 112) IMMEDIATELY."
    ),
    "medical_references": [
        {
            "title": "2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation",
            "source": "Journal of the American College of Cardiology (JACC) & Circulation",
            "url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193"
        },
        {
            "title": "2020 ESC Guidelines for the diagnosis and management of atrial fibrillation",
            "source": "European Heart Journal (EHJ)",
            "url": "https://academic.oup.com/eurheartj/article/42/5/373/5899003"
        },
        {
            "title": "Atrial Fibrillation: Diagnosis and Management (NICE Guideline NG196)",
            "source": "National Institute for Health and Care Excellence (NICE)",
            "url": "https://www.nice.org.uk/guidance/ng196"
        },
        {
            "title": "Atrial Fibrillation Clinical Resources & Stroke Prevention",
            "source": "Centers for Disease Control and Prevention (CDC)",
            "url": "https://www.cdc.gov/heart-disease/about/atrial-fibrillation.html"
        }
    ],
    "overview_route": "/afib"
}

# The database contains ONLY ONE disease entry
DISEASE_KNOWLEDGE_BASE: List[Dict[str, Any]] = [ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM]

def get_disease_by_id(disease_id: str) -> Optional[Dict[str, Any]]:
    if disease_id in ["atrial_fibrillation", "afib"]:
        return ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM
    return None

def get_all_diseases() -> List[Dict[str, Any]]:
    return [ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM]

def get_afib_overview_data() -> Dict[str, Any]:
    return {
        "disease_info": ATRIAL_FIBRILLATION_KNOWLEDGE_ITEM,
        "global_statistics": GLOBAL_AFIB_STATISTICS,
        "parameter_references": AFIB_PARAMETER_REFERENCES,
        "symptoms": AFIB_SYMPTOM_CATALOGUE
    }

# Backward compatibility alias
def get_diabetes_overview_data() -> Dict[str, Any]:
    return get_afib_overview_data()
