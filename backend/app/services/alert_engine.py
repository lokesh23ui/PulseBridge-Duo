import uuid
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.entities import (
    SensorReading, HealthAlert, AlertRule, Notification, 
    PatientCaregiverRelationship, User, utc_now
)
from backend.app.schemas.telemetry import ThresholdConfigSchema
from backend.app.core.thresholds import DEFAULT_THRESHOLDS, CLINICAL_VERIFICATION_ADVICE

PARAMETER_UNITS = {
    "heart_rate_bpm": "bpm",
    "spo2_percent": "%",
    "bp_systolic_mmhg": "mmHg",
    "bp_diastolic_mmhg": "mmHg",
    "glucose_mg_dl": "mg/dL",
    "temperature_c": "°C",
    "activity_percent": "%"
}

PARAMETER_LABELS = {
    "heart_rate_bpm": "Heart Rate",
    "spo2_percent": "Oxygen Saturation (SpO2)",
    "bp_systolic_mmhg": "Systolic Blood Pressure",
    "bp_diastolic_mmhg": "Diastolic Blood Pressure",
    "glucose_mg_dl": "Blood Glucose",
    "temperature_c": "Temperature",
    "activity_percent": "Activity Score"
}

def evaluate_reading_alerts(
    reading: SensorReading,
    thresholds: ThresholdConfigSchema = DEFAULT_THRESHOLDS
) -> List[HealthAlert]:
    alerts: List[HealthAlert] = []
    sig_q = reading.signal_quality or 1.0

    # 1. Signal Quality Warning (Prevents false clinical certainty)
    if sig_q < thresholds.min_signal_quality_threshold:
        alerts.append(
            HealthAlert(
                alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                reading_id=reading.reading_id,
                patient_id=reading.patient_id,
                parameter="Signal Quality",
                value=round(sig_q * 100, 1),
                unit="%",
                rule_triggered=f"Signal quality {round(sig_q*100,1)}% is below reliable threshold ({round(thresholds.min_signal_quality_threshold*100,1)}%)",
                severity="WARNING",
                timestamp=reading.timestamp,
                source=reading.source,
                device_id=reading.device_id,
                signal_quality=sig_q,
                verification_instruction=CLINICAL_VERIFICATION_ADVICE["signal_degraded"],
                acknowledged=False
            )
        )
        return alerts

    # 2. SpO2 Oxygen Saturation Evaluation
    if reading.spo2_percent is not None:
        if reading.spo2_percent < thresholds.spo2_low_critical:
            alerts.append(
                HealthAlert(
                    alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                    reading_id=reading.reading_id,
                    patient_id=reading.patient_id,
                    parameter="Oxygen Saturation (SpO2)",
                    value=reading.spo2_percent,
                    unit="%",
                    rule_triggered=f"SpO2 {reading.spo2_percent}% < Critical Threshold ({thresholds.spo2_low_critical}%)",
                    severity="CRITICAL",
                    timestamp=reading.timestamp,
                    source=reading.source,
                    device_id=reading.device_id,
                    signal_quality=sig_q,
                    verification_instruction=CLINICAL_VERIFICATION_ADVICE["spo2_hypoxia"],
                    acknowledged=False
                )
            )
        elif reading.spo2_percent < thresholds.spo2_low_warning:
            alerts.append(
                HealthAlert(
                    alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                    reading_id=reading.reading_id,
                    patient_id=reading.patient_id,
                    parameter="Oxygen Saturation (SpO2)",
                    value=reading.spo2_percent,
                    unit="%",
                    rule_triggered=f"SpO2 {reading.spo2_percent}% < Warning Threshold ({thresholds.spo2_low_warning}%)",
                    severity="WARNING",
                    timestamp=reading.timestamp,
                    source=reading.source,
                    device_id=reading.device_id,
                    signal_quality=sig_q,
                    verification_instruction=CLINICAL_VERIFICATION_ADVICE["spo2_hypoxia"],
                    acknowledged=False
                )
            )

    # 3. Heart Rate Evaluation
    if reading.heart_rate_bpm is not None:
        if reading.heart_rate_bpm > thresholds.hr_high_critical:
            alerts.append(
                HealthAlert(
                    alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                    reading_id=reading.reading_id,
                    patient_id=reading.patient_id,
                    parameter="Heart Rate",
                    value=reading.heart_rate_bpm,
                    unit="bpm",
                    rule_triggered=f"Heart Rate {reading.heart_rate_bpm} bpm > Critical Threshold ({thresholds.hr_high_critical} bpm)",
                    severity="CRITICAL",
                    timestamp=reading.timestamp,
                    source=reading.source,
                    device_id=reading.device_id,
                    signal_quality=sig_q,
                    verification_instruction=CLINICAL_VERIFICATION_ADVICE["tachycardia"],
                    acknowledged=False
                )
            )
        elif reading.heart_rate_bpm > thresholds.hr_high_warning:
            alerts.append(
                HealthAlert(
                    alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                    reading_id=reading.reading_id,
                    patient_id=reading.patient_id,
                    parameter="Heart Rate",
                    value=reading.heart_rate_bpm,
                    unit="bpm",
                    rule_triggered=f"Heart Rate {reading.heart_rate_bpm} bpm > Warning Threshold ({thresholds.hr_high_warning} bpm)",
                    severity="WARNING",
                    timestamp=reading.timestamp,
                    source=reading.source,
                    device_id=reading.device_id,
                    signal_quality=sig_q,
                    verification_instruction=CLINICAL_VERIFICATION_ADVICE["tachycardia"],
                    acknowledged=False
                )
            )
        elif reading.heart_rate_bpm < thresholds.hr_low:
            alerts.append(
                HealthAlert(
                    alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                    reading_id=reading.reading_id,
                    patient_id=reading.patient_id,
                    parameter="Heart Rate",
                    value=reading.heart_rate_bpm,
                    unit="bpm",
                    rule_triggered=f"Heart Rate {reading.heart_rate_bpm} bpm < Low Threshold ({thresholds.hr_low} bpm)",
                    severity="ATTENTION",
                    timestamp=reading.timestamp,
                    source=reading.source,
                    device_id=reading.device_id,
                    signal_quality=sig_q,
                    verification_instruction=CLINICAL_VERIFICATION_ADVICE["bradycardia"],
                    acknowledged=False
                )
            )

    # 4. Blood Pressure Estimate Evaluation
    if reading.bp_systolic_mmhg is not None:
        if reading.bp_systolic_mmhg > thresholds.bp_systolic_warning:
            alerts.append(
                HealthAlert(
                    alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                    reading_id=reading.reading_id,
                    patient_id=reading.patient_id,
                    parameter="Systolic Blood Pressure (Est.)",
                    value=reading.bp_systolic_mmhg,
                    unit="mmHg",
                    rule_triggered=f"Estimated Systolic BP {reading.bp_systolic_mmhg} > {thresholds.bp_systolic_warning} mmHg",
                    severity="WARNING",
                    timestamp=reading.timestamp,
                    source=reading.source,
                    device_id=reading.device_id,
                    signal_quality=sig_q,
                    verification_instruction=CLINICAL_VERIFICATION_ADVICE["hypertension_est"],
                    acknowledged=False
                )
            )

    # 5. Glucose Estimate Evaluation
    if reading.glucose_mg_dl is not None:
        if reading.glucose_mg_dl > thresholds.glucose_warning:
            alerts.append(
                HealthAlert(
                    alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                    reading_id=reading.reading_id,
                    patient_id=reading.patient_id,
                    parameter="Blood Glucose (Est.)",
                    value=reading.glucose_mg_dl,
                    unit="mg/dL",
                    rule_triggered=f"Estimated Glucose {reading.glucose_mg_dl} > {thresholds.glucose_warning} mg/dL",
                    severity="WARNING",
                    timestamp=reading.timestamp,
                    source=reading.source,
                    device_id=reading.device_id,
                    signal_quality=sig_q,
                    verification_instruction=CLINICAL_VERIFICATION_ADVICE["hyperglycemia_est"],
                    acknowledged=False
                )
            )

    # 6. Temperature Evaluation
    if reading.temperature_c is not None:
        if reading.temperature_source == "ambient":
            if reading.temperature_c > thresholds.temp_ambient_attention:
                alerts.append(
                    HealthAlert(
                        alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                        reading_id=reading.reading_id,
                        patient_id=reading.patient_id,
                        parameter="Ambient Temperature",
                        value=reading.temperature_c,
                        unit="°C",
                        rule_triggered=f"Ambient temp {reading.temperature_c}°C > {thresholds.temp_ambient_attention}°C",
                        severity="ATTENTION",
                        timestamp=reading.timestamp,
                        source=reading.source,
                        device_id=reading.device_id,
                        signal_quality=sig_q,
                        verification_instruction=CLINICAL_VERIFICATION_ADVICE["ambient_heat"],
                        acknowledged=False
                    )
                )
        else: # Skin temp
            if reading.temperature_c > thresholds.temp_skin_warning:
                alerts.append(
                    HealthAlert(
                        alert_id=f"alert-{uuid.uuid4().hex[:8]}",
                        reading_id=reading.reading_id,
                        patient_id=reading.patient_id,
                        parameter="Skin Temperature",
                        value=reading.temperature_c,
                        unit="°C",
                        rule_triggered=f"Skin temp {reading.temperature_c}°C > {thresholds.temp_skin_warning}°C",
                        severity="WARNING",
                        timestamp=reading.timestamp,
                        source=reading.source,
                        device_id=reading.device_id,
                        signal_quality=sig_q,
                        verification_instruction=CLINICAL_VERIFICATION_ADVICE["hyperthermia"],
                        acknowledged=False
                    )
                )

    return alerts

def evaluate_personalized_rules(
    db: Session,
    reading: SensorReading
) -> tuple[List[HealthAlert], List[Notification]]:
    """
    Evaluates patient-specific alert rules, checks cooldowns, creates alerts
    and generates persistent in-app notifications for connected caregivers.
    """
    alerts: List[HealthAlert] = []
    notifications: List[Notification] = []

    if not reading.patient_id:
        return alerts, notifications

    patient = db.query(User).filter(User.id == reading.patient_id).first()
    patient_name = patient.full_name if patient else "Patient"

    # Fetch active rules for this patient
    rules = db.query(AlertRule).filter(
        AlertRule.patient_id == reading.patient_id,
        AlertRule.enabled == True
    ).all()

    now = reading.timestamp or utc_now()

    for rule in rules:
        val = getattr(reading, rule.parameter, None)
        if val is None:
            continue

        # Cooldown check
        if rule.last_triggered_at:
            delta_sec = (now - rule.last_triggered_at).total_seconds()
            if delta_sec < rule.cooldown_seconds:
                continue

        # Evaluate condition
        triggered = False
        rule_desc = ""

        if rule.condition == "greater_than" and val > rule.threshold:
            triggered = True
            rule_desc = f"{PARAMETER_LABELS.get(rule.parameter, rule.parameter)} {val} > {rule.threshold} {PARAMETER_UNITS.get(rule.parameter, '')}"
        elif rule.condition == "less_than" and val < rule.threshold:
            triggered = True
            rule_desc = f"{PARAMETER_LABELS.get(rule.parameter, rule.parameter)} {val} < {rule.threshold} {PARAMETER_UNITS.get(rule.parameter, '')}"
        elif rule.condition == "equal_to" and abs(val - rule.threshold) < 0.01:
            triggered = True
            rule_desc = f"{PARAMETER_LABELS.get(rule.parameter, rule.parameter)} {val} == {rule.threshold} {PARAMETER_UNITS.get(rule.parameter, '')}"
        elif rule.condition == "outside_range" and rule.lower_limit is not None and rule.upper_limit is not None:
            if val < rule.lower_limit or val > rule.upper_limit:
                triggered = True
                rule_desc = f"{PARAMETER_LABELS.get(rule.parameter, rule.parameter)} {val} outside safe range [{rule.lower_limit} - {rule.upper_limit}] {PARAMETER_UNITS.get(rule.parameter, '')}"

        if triggered:
            rule.last_triggered_at = now
            alert_id = f"alert-{uuid.uuid4().hex[:8]}"

            # 1. Create HealthAlert
            alert = HealthAlert(
                alert_id=alert_id,
                reading_id=reading.reading_id,
                patient_id=reading.patient_id,
                parameter=PARAMETER_LABELS.get(rule.parameter, rule.parameter),
                value=float(val),
                unit=PARAMETER_UNITS.get(rule.parameter, ""),
                rule_triggered=rule_desc,
                severity=rule.severity,
                timestamp=now,
                source=reading.source,
                device_id=reading.device_id,
                signal_quality=reading.signal_quality or 1.0,
                verification_instruction=f"Configured threshold alert. Review recent monitoring trend and follow care plan.",
                acknowledged=False
            )
            alerts.append(alert)
            db.add(alert)

            # 2. Find connected active caregivers
            relationships = db.query(PatientCaregiverRelationship).filter(
                PatientCaregiverRelationship.patient_id == reading.patient_id,
                PatientCaregiverRelationship.status == "active"
            ).all()

            # Create notification for caregivers
            for rel in relationships:
                notif = Notification(
                    recipient_user_id=rel.caregiver_id,
                    patient_id=reading.patient_id,
                    title=f"Health Alert: {patient_name}",
                    message=f"{patient_name}'s {PARAMETER_LABELS.get(rule.parameter, rule.parameter)} reached {val} {PARAMETER_UNITS.get(rule.parameter, '')}. ({rule_desc})",
                    severity=rule.severity,
                    parameter=rule.parameter,
                    value=float(val),
                    unit=PARAMETER_UNITS.get(rule.parameter, ""),
                    alert_id=alert_id,
                    is_read=False,
                    created_at=now
                )
                notifications.append(notif)
                db.add(notif)

            # Also notify patient
            patient_notif = Notification(
                recipient_user_id=reading.patient_id,
                patient_id=reading.patient_id,
                title="Personal Vital Alert",
                message=f"Your {PARAMETER_LABELS.get(rule.parameter, rule.parameter)} was recorded at {val} {PARAMETER_UNITS.get(rule.parameter, '')}. ({rule_desc})",
                severity=rule.severity,
                parameter=rule.parameter,
                value=float(val),
                unit=PARAMETER_UNITS.get(rule.parameter, ""),
                alert_id=alert_id,
                is_read=False,
                created_at=now
            )
            notifications.append(patient_notif)
            db.add(patient_notif)

    return alerts, notifications
