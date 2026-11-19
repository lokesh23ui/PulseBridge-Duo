import re
import io
import datetime
from typing import Dict, Any, List, Optional
import pypdf
from PIL import Image

# Common laboratory biomarker matching regex patterns
BIOMARKER_PATTERNS = [
    {
        "test_name": "Fasting Blood Glucose",
        "pattern": r"(?:fasting\s+)?(?:blood\s+)?glucose|fbg|fbs",
        "unit": "mg/dL",
        "default_ref": "70 - 99 mg/dL",
        "evaluate": lambda v: "Critical" if v >= 200 else ("Elevated" if v >= 126 else ("Impaired" if v >= 100 else ("Low" if v < 70 else "Normal")))
    },
    {
        "test_name": "Glycated Hemoglobin (HbA1c)",
        "pattern": r"hba1c|glycated\s+h(?:a)?emoglobin|a1c",
        "unit": "%",
        "default_ref": "< 5.7%",
        "evaluate": lambda v: "Critical" if v >= 9.0 else ("Elevated" if v >= 6.5 else ("Prediabetes" if v >= 5.7 else "Normal"))
    },
    {
        "test_name": "Blood Pressure (Systolic/Diastolic)",
        "pattern": r"(?:blood\s+pressure|bp)\s*[:=]?\s*(\d{2,3})\s*[/x-]\s*(\d{2,3})",
        "unit": "mmHg",
        "is_bp_special": True,
        "default_ref": "< 120 / < 80 mmHg"
    },
    {
        "test_name": "Serum Creatinine",
        "pattern": r"creatinine|serum\s+creatinine",
        "unit": "mg/dL",
        "default_ref": "0.7 - 1.2 mg/dL",
        "evaluate": lambda v: "Elevated" if v > 1.2 else ("Low" if v < 0.6 else "Normal")
    },
    {
        "test_name": "Estimated GFR (eGFR)",
        "pattern": r"egfr|estimated\s+gfr",
        "unit": "mL/min/1.73m²",
        "default_ref": "> 60 mL/min/1.73m²",
        "evaluate": lambda v: "Severely Decreased" if v < 30 else ("Decreased" if v < 60 else "Normal")
    },
    {
        "test_name": "Total Cholesterol",
        "pattern": r"total\s+cholesterol|cholesterol\s+total",
        "unit": "mg/dL",
        "default_ref": "< 200 mg/dL",
        "evaluate": lambda v: "Elevated" if v >= 240 else ("Borderline" if v >= 200 else "Normal")
    },
    {
        "test_name": "LDL Cholesterol",
        "pattern": r"ldl(?:\s*-\s*c)?|low\s+density\s+lipoprotein",
        "unit": "mg/dL",
        "default_ref": "< 100 mg/dL",
        "evaluate": lambda v: "High" if v >= 160 else ("Borderline" if v >= 100 else "Optimal")
    },
    {
        "test_name": "HDL Cholesterol",
        "pattern": r"hdl(?:\s*-\s*c)?|high\s+density\s+lipoprotein",
        "unit": "mg/dL",
        "default_ref": "> 40 mg/dL (M), > 50 mg/dL (F)",
        "evaluate": lambda v: "Low" if v < 40 else "Normal"
    },
    {
        "test_name": "Triglycerides",
        "pattern": r"triglycerides|serum\s+triglycerides",
        "unit": "mg/dL",
        "default_ref": "< 150 mg/dL",
        "evaluate": lambda v: "Very High" if v >= 500 else ("High" if v >= 200 else ("Borderline" if v >= 150 else "Normal"))
    },
    {
        "test_name": "Hemoglobin (Hb)",
        "pattern": r"(?:blood\s+)?h(?:a)?emoglobin\b|hgb\b",
        "unit": "g/dL",
        "default_ref": "12.0 - 16.0 g/dL",
        "evaluate": lambda v: "Severe Anemia" if v < 8.0 else ("Low / Anemia" if v < 12.0 else "Normal")
    },
    {
        "test_name": "Thyroid Stimulating Hormone (TSH)",
        "pattern": r"\btsh\b|thyroid\s+stimulating\s+hormone",
        "unit": "mIU/L",
        "default_ref": "0.4 - 4.0 mIU/L",
        "evaluate": lambda v: "Elevated (Hypothyroid)" if v > 4.5 else ("Suppressed (Hyperthyroid)" if v < 0.4 else "Normal")
    },
    {
        "test_name": "Resting Heart Rate",
        "pattern": r"resting\s+(?:heart\s+rate|pulse|hr)|heart\s+rate\s*[:=]",
        "unit": "bpm",
        "default_ref": "60 - 100 bpm",
        "evaluate": lambda v: "Tachycardia" if v > 100 else ("Bradycardia" if v < 60 else "Normal")
    },
    {
        "test_name": "Oxygen Saturation (SpO2)",
        "pattern": r"spo2|oxygen\s+saturation|pulse\s+ox",
        "unit": "%",
        "default_ref": "95 - 100 %",
        "evaluate": lambda v: "Critical Hypoxia" if v < 90 else ("Low" if v < 95 else "Normal")
    }
]

SYMPTOM_LEXICON = [
    ("irregular heartbeat", "Irregular heartbeat rhythm"),
    ("irregular pulse", "Irregular heartbeat rhythm"),
    ("uneven pulse", "Irregular heartbeat rhythm"),
    ("palpitation", "Heart palpitations"),
    ("fluttering", "Heart palpitations"),
    ("pounding heartbeat", "Heart palpitations"),
    ("rapid heartbeat", "Rapid heartbeat"),
    ("racing heartbeat", "Rapid heartbeat"),
    ("tachycardia", "Rapid heartbeat"),
    ("unusual fatigue", "Unusual fatigue or tiredness"),
    ("fatigue", "Unusual fatigue or tiredness"),
    ("tiredness", "Unusual fatigue or tiredness"),
    ("dizziness", "Dizziness or lightheadedness"),
    ("lightheadedness", "Dizziness or lightheadedness"),
    ("shortness of breath", "Shortness of breath"),
    ("dyspnea", "Shortness of breath"),
    ("chest discomfort", "Chest discomfort or tightness"),
    ("chest tightness", "Chest discomfort or tightness"),
    ("weakness", "General weakness"),
    ("general weakness", "General weakness"),
    ("reduced exercise tolerance", "Reduced exercise tolerance"),
    ("exercise intolerance", "Reduced exercise tolerance"),
    ("feeling faint", "Feeling faint or near-fainting"),
    ("faintness", "Feeling faint or near-fainting"),
    ("syncope", "Feeling faint or near-fainting"),
    ("anxiety", "Anxiety associated with noticeable heartbeat sensations"),
    ("frequent urination", "Frequent urination"),
    ("excessive thirst", "Excessive thirst"),
    ("swelling", "Peripheral edema or lower-extremity swelling"),
    ("edema", "Peripheral fluid retention / edema")
]

def extract_text_from_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Extracts raw text from PDF, Text, or image files."""
    text = ""
    lower_fn = filename.lower()

    if "pdf" in content_type or lower_fn.endswith(".pdf"):
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception as e:
            text = f"[PDF extraction notice: Document could not be fully parsed via text layer ({str(e)})]"

    elif any(img_ext in lower_fn for img_ext in [".png", ".jpg", ".jpeg", ".webp"]) or "image" in content_type:
        try:
            # Validate image with PIL
            img = Image.open(io.BytesIO(file_bytes))
            width, height = img.size
            format_name = img.format
            text = f"[Scanned Image Document: {filename} ({format_name}, {width}x{height}px)]\n"
            text += "Medical report image uploaded. Please verify or input key lab biomarkers in the review table below."
        except Exception as e:
            text = f"[Image inspection error: {str(e)}]"

    else:
        # Plain text, CSV, JSON, markdown
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = file_bytes.decode("latin-1")
            except Exception:
                text = "[Binary file content could not be converted to plain text]"

    return text.strip()

def parse_report_text_to_findings(raw_text: str) -> Dict[str, Any]:
    """Parses extracted text to identify biomarkers, suggested symptoms, and report metadata."""
    findings: List[Dict[str, Any]] = []
    lines = raw_text.splitlines()

    # 1. Special check for Blood Pressure (systolic/diastolic)
    bp_match = re.search(r"(?:bp|blood\s+pressure)\s*[:=]?\s*(\d{2,3})\s*[/x-]\s*(\d{2,3})\s*(?:mmhg)?", raw_text, re.IGNORECASE)
    if bp_match:
        sys = float(bp_match.group(1))
        dia = float(bp_match.group(2))
        status = "Critical" if sys >= 180 or dia >= 120 else ("Stage 2 High" if sys >= 140 or dia >= 90 else ("Stage 1 High" if sys >= 130 or dia >= 80 else "Normal"))
        findings.append({
            "test_name": "Blood Pressure (Systolic/Diastolic)",
            "value": f"{int(sys)}/{int(dia)}",
            "unit": "mmHg",
            "reference_range": "< 120 / < 80 mmHg",
            "status": status,
            "observation": f"Measured arterial pressure: {int(sys)} mmHg systolic, {int(dia)} mmHg diastolic."
        })

    # 1b. Check for ECG Rhythm Interpretation
    ecg_match = re.search(r"(?:ecg\s+(?:rhythm|interpretation|findings?)|rhythm\s*[:=]|holter\s+(?:rhythm|findings?))\s*[:=]?\s*([A-Za-z0-9\s,\.\(\)-]{4,60})", raw_text, re.IGNORECASE)
    if ecg_match:
        ecg_text = ecg_match.group(1).strip()
        is_afib = any(term in ecg_text.lower() for term in ["atrial fibrillation", "afib", "a-fib", "irregularly irregular"])
        status = "Abnormal / Diagnostic AFib" if is_afib else ("Normal Sinus" if "sinus" in ecg_text.lower() else "Abnormal Rhythm")
        findings.append({
            "test_name": "ECG Rhythm Finding",
            "value": ecg_text,
            "unit": "Rhythm",
            "reference_range": "Normal Sinus Rhythm",
            "status": status,
            "observation": f"Electrocardiogram rhythm documentation: {ecg_text}."
        })
    elif any(term in raw_text.lower() for term in ["atrial fibrillation", "afib"]):
        findings.append({
            "test_name": "ECG Rhythm Finding",
            "value": "Atrial Fibrillation documented in report",
            "unit": "Rhythm",
            "reference_range": "Normal Sinus Rhythm",
            "status": "Diagnostic ECG Finding",
            "observation": "Report text documents Atrial Fibrillation rhythm."
        })

    # 2. Match standard numerical biomarkers
    for item in BIOMARKER_PATTERNS:
        if item.get("is_bp_special"):
            continue

        pat = item["pattern"]
        # Search for pattern followed by colon/equals and a number
        # e.g. "Glucose: 138 mg/dL" or "HbA1c 6.8 %"
        regex = rf"(?:{pat})\s*[:=]?\s*([><]?\s*\d+(?:\.\d+)?)"
        match = re.search(regex, raw_text, re.IGNORECASE)
        if match:
            raw_val_str = match.group(1).replace("<", "").replace(">", "").strip()
            try:
                val = float(raw_val_str)
                eval_fn = item.get("evaluate")
                status = eval_fn(val) if eval_fn else "Normal"
                findings.append({
                    "test_name": item["test_name"],
                    "value": val,
                    "unit": item["unit"],
                    "reference_range": item["default_ref"],
                    "status": status,
                    "observation": f"Extracted value: {val} {item['unit']} ({status})."
                })
            except ValueError:
                pass

    # 3. Match clinical symptoms from text
    suggested_symptoms: List[str] = []
    lower_text = raw_text.lower()
    for keyword, canonical_name in SYMPTOM_LEXICON:
        if keyword in lower_text:
            if canonical_name not in suggested_symptoms:
                suggested_symptoms.append(canonical_name)

    # 4. Infer metadata
    category = "General Diagnostics"
    if any(k in lower_text for k in ["glucose", "hba1c", "diabetes", "metabolic"]):
        category = "Endocrinology & Metabolic"
    elif any(k in lower_text for k in ["cholesterol", "lipid", "cardio", "ecg", "troponin", "bp"]):
        category = "Cardiology"
    elif any(k in lower_text for k in ["creatinine", "egfr", "kidney", "renal", "bun"]):
        category = "Nephrology"
    elif any(k in lower_text for k in ["hemoglobin", "anemia", "platelet", "wbc", "cbc"]):
        category = "Hematology"
    elif any(k in lower_text for k in ["respiratory", "spo2", "fev1", "pulmonary", "copd"]):
        category = "Pulmonology"

    # Search for Healthcare Provider
    provider = None
    provider_match = re.search(r"(?:hospital|clinic|center|laboratory|lab|physician|dr\.)\s*[:=]?\s*([A-Za-z0-9\s,\.]{3,40})", raw_text, re.IGNORECASE)
    if provider_match:
        provider = provider_match.group(0).strip()[:48]

    # Search for Date
    report_date = None
    date_match = re.search(r"\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b", raw_text)
    if date_match:
        report_date = date_match.group(1)

    confidence_note = "Document scanned successfully. Please review extracted findings and adjust any values before confirming."
    if not findings and not suggested_symptoms:
        confidence_note = "No automated diagnostic biomarkers were detected in the text layer. Please use the review form below to manually transcribe key tests and values."

    return {
        "report_title": "Extracted Clinical Laboratory Report",
        "category": category,
        "healthcare_provider": provider or "Diagnostic Clinical Laboratory",
        "report_date": report_date or datetime.date.today().isoformat(),
        "raw_text": raw_text[:2000],
        "findings": findings,
        "suggested_symptoms": suggested_symptoms,
        "confidence_note": confidence_note
    }
