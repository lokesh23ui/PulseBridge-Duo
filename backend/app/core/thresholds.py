from backend.app.schemas.telemetry import ThresholdConfigSchema

DEFAULT_THRESHOLDS = ThresholdConfigSchema()

CLINICAL_VERIFICATION_ADVICE = {
    "spo2_hypoxia": (
        "Hypoxia demonstration triggered. Verify finger sensor placement. "
        "Ensure warm extremities and confirm with a calibrated clinical pulse oximeter."
    ),
    "tachycardia": (
        "Elevated resting heart rate observed. Verify user is at rest. "
        "Check for physical exertion, fever, stress, or caffeine before clinical escalation."
    ),
    "bradycardia": (
        "Low resting heart rate detected. Check user alertness and verify sensor contact. "
        "Athletes often have low resting rates; seek clinical advice if accompanied by dizziness."
    ),
    "hypertension_est": (
        "Elevated blood pressure estimate. Note: Optical wearable estimates are unvalidated. "
        "Confirm reading with an automated arm cuff sphygmomanometer."
    ),
    "hyperglycemia_est": (
        "Elevated blood glucose estimate. Note: Optical wearables cannot measure glucose directly. "
        "Confirm with an enzymatic fingerstick glucometer or validated CGM."
    ),
    "hyperthermia": (
        "Elevated skin temperature detected. Peripheral skin temperature differs from core body temperature. "
        "Confirm core temperature using an oral or tympanic thermometer."
    ),
    "ambient_heat": (
        "High ambient environmental temperature detected via external sensor (DHT22). "
        "Ensure hydration and adequate ventilation."
    ),
    "signal_degraded": (
        "Degraded optical sensor signal quality detected. Readings are uncertain and may be corrupted by motion. "
        "Please reposition the device snugly and remain still."
    )
}
