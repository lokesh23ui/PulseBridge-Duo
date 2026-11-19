# PulseBridge Duo — Controlled Telemetry & Sample Reading Generation

## 1. Controlled Telemetry Architecture

To enable thorough clinical and technical testing without requiring physical human vitals in extreme distress, PulseBridge Duo features an integrated **Controlled Telemetry Ingestion Engine**. This subsystem allows users, QA engineers, and clinical evaluators to generate physiologically plausible sensor payloads across a variety of test scenarios.

```
+-----------------------------------------------------------------------------------+
|                        CONTROLLED INGESTION PIPELINE                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Scenario Selector]                                                              |
|  (STABLE, HIGH_HR, LOW_SPO2, HIGH_BP, MIXED)                                      |
|          │                                                                        |
|          ▼                                                                        |
|  Dynamic Gaussian Jitter Generator                                               |
|  (Applies micro-variations to prevent identical static values)                   |
|          │                                                                        |
|          ▼                                                                        |
|  Unique Event ID Generator (PB-EVT-XXXX) + ISO-8601 Timestamp                     |
|          │                                                                        |
|          ▼                                                                        |
|  Dual Ingestion Path:                                                             |
|    Path A: REST API Ingestion (`POST /api/patients/{id}/controlled-reading`)      |
|    Path B: Wokwi ESP32 Hardware Emulation (`POST /api/sensor-data`)               |
|          │                                                                        |
|          ▼                                                                        |
|  Threshold Evaluation & Alert Generation Engine                                   |
|          │                                                                        |
|          ▼                                                                        |
|  Real-Time Caregiver WebSocket Broadcast & Database Audit Log                     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Dynamic Reading Scenarios

Users can trigger one of five physiological scenarios via the **"Generate Sample Reading"** control:

| Scenario Code | Target Parameters | Expected Clinical Significance | Threshold Outcome |
| :--- | :--- | :--- | :--- |
| `STABLE` | HR: $72 \pm 4\text{ bpm}$, SpO2: $98 \pm 1\%$, BP: $120/78\text{ mmHg}$ | Healthy resting baseline equilibrium. | Normal / No Alert |
| `ELEVATED_HR` | HR: $126 \pm 5\text{ bpm}$, SpO2: $97\%$, BP: $128/82\text{ mmHg}$ | Paroxysmal supraventricular tachycardia / exertion. | Warning / Critical HR Alert |
| `LOW_SPO2` | HR: $88\text{ bpm}$, SpO2: $87 \pm 1\%$, BP: $118/74\text{ mmHg}$ | Acute respiratory hypoxemia / desaturation. | Critical SpO2 Alert |
| `HIGH_BP` | HR: $82\text{ bpm}$, SpO2: $96\%$, BP: $168/104\text{ mmHg}$ | Stage 2 hypertensive urgency. | Warning BP Alert |
| `MIXED` | HR: $118\text{ bpm}$, SpO2: $89\%$, BP: $148/94\text{ mmHg}$ | Multi-system cardiopulmonary decompensation. | Multiple Concurrent Alerts |

---

## 3. Dynamic Telemetry Payload Structure

Each generated reading contains randomized micro-jitter to accurately reflect biological continuous time-series fluctuations, avoiding static or duplicate payloads:

```json
{
  "event_id": "PB-EVT-7842",
  "device_id": "PB-DUO-VIRTUAL-01",
  "source": "ring_watch_fused",
  "timestamp": "2026-11-19T06:45:12.384Z",
  "heart_rate_bpm": 126.4,
  "spo2_percent": 97.2,
  "bp_systolic_mmhg": 128.0,
  "bp_diastolic_mmhg": 82.5,
  "temperature_c": 36.8,
  "glucose_mg_dl": 104.2,
  "activity_percent": 18.0,
  "signal_quality": 0.94,
  "is_simulated": true,
  "disclosure": "Illustrative telemetry for evaluation purposes"
}
```

---

## 4. Dual-Path Architecture: Software Simulation vs. Wokwi ESP32 Emulation

PulseBridge Duo supports two parallel ingestion pipelines:
1. **Software Synthesis Pipeline:** Runs entirely inside the frontend and backend microservices, allowing quick evaluation of alert triggers, caregiver push notifications, and UI reactions without requiring external runtime dependencies.
2. **Wokwi ESP32 Hardware Emulation:** An authentic C++ firmware simulation (`sketch.ino`) executing inside an emulated ESP32 microcontroller with a simulated MAX30102 optical sensor. The firmware serializes readings into JSON and dispatches them via HTTP POST to the backend ingest router (`/api/sensor-data`).

Both paths flow through the same backend validation and alert engine, guaranteeing identical safety checks and notification routing.
