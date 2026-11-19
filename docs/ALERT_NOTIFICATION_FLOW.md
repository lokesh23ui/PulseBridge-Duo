# PulseBridge Duo — Alert Engine & Caregiver Notification Flow

## 1. Personalized Alert Engine Architecture

The PulseBridge Duo Alert Engine evaluates incoming sensor telemetry against both platform-wide default thresholds and patient-specific personalized alert rules.

```
+-----------------------------------------------------------------------------------+
|                           ALERT EVALUATION PIPELINE                               |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  Incoming Sensor Reading                                                          |
|  (HR, SpO2, Systolic BP, Diastolic BP, Glucose, Temp)                             |
|          │                                                                        |
|          ▼                                                                        |
|  Evaluate Threshold Conditions                                                    |
|  (e.g., HR > 105 bpm or SpO2 < 92%)                                               |
|          │                                                                        |
|          ├── Condition Met ────────────────────────┐                              |
|          │                                         │ Condition Cleared            |
|          ▼                                         ▼                              |
|  Check Cooldown Duration                     Was Parameter Previously In Alarm?   |
|  (Is now - last_alert_time < cooldown?)            │                              |
|          │                                         ├── Yes ──────────────────────┐|
|          ├── No (Cooldown Elapsed)                 │                             │|
|          │                                         ▼                             ▼|
|          ▼                                  Ignore (Normal)             Generate RECOVERY |
|  Create Alert Record (CRITICAL / WARNING)                               Notification      |
|          │                                                                       │|
|          ▼                                                                       ▼|
|  Identify Approved Caregivers with `receive_alerts` Permission                   │|
|          │                                                                       │|
|          ▼                                                                       │|
|  Dispatch In-App Notifications & Real-Time WebSocket Alerts ◄────────────────────┘|
+-----------------------------------------------------------------------------------+
```

---

## 2. Threshold Evaluation & Severity Hierarchy

Alert rules are ranked by severity, driving visual styles and audio-visual escalation in the UI:

| Severity Level | Color Coding | Clinical Significance | Example Rule |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Crimson (`bg-rose-500`) | Life-threatening acute event requiring urgent intervention. | SpO2 $< 90\%$ or HR $> 130\text{ bpm}$ |
| **WARNING** | Amber-Orange (`bg-orange-500`) | Abnormal physiological trend requiring immediate caregiver attention. | HR $> 105\text{ bpm}$ or Systolic BP $> 160\text{ mmHg}$ |
| **ATTENTION** | Yellow (`bg-amber-400`) | Moderate deviation from personalized baseline. | Systolic BP $> 140\text{ mmHg}$ or Temp $> 37.8^\circ\text{C}$ |
| **INFO / RECOVERY**| Emerald (`bg-emerald-500`) | Resolution of prior alert state back to normal equilibrium. | HR normalized to $< 100\text{ bpm}$ |

---

## 3. Cooldown & Duplicate Prevention

To avoid notification storms—where a persistent high heart rate generates dozens of identical notifications every second—the alert engine enforces configurable cooldown timers:
- **Default Cooldown:** 120 seconds per parameter.
- **Rule-Specific Cooldown:** Configurable between 30 and 3600 seconds when creating personalized rules.
- **Deduplication:** Subsequent readings that violate the same threshold during an active cooldown are recorded in the telemetry history but do **not** trigger redundant notifications.

---

## 4. Recovery Detection Flow

When a patient's vitals return to normal levels following an active alert state, the system automatically detects physiological normalization:
1. The engine checks if the parameter had an active unrecovered alert.
2. If the new reading satisfies normal criteria (e.g., HR dropped from $128\text{ bpm}$ to $74\text{ bpm}$), the engine dispatches a **`RECOVERY`** notification.
3. The notification text reads: *"Resolved: Patient vital has returned to normal range (74 bpm)."*
4. Both the patient and authorized caregivers receive immediate reassurance that the acute episode has subsided.

---

## 5. In-App Notification Center & Acknowledgement Lifecycle

The top navigation header contains an interactive **Notification Bell** with real-time state:
- **Unread Badge:** Displays a bold crimson pill with the count of pending unread alerts.
- **Notification Drawer:** Clicking the bell opens a slide-over panel displaying the notification feed with severity indicators, parameter readouts, and timestamps.
- **Mark as Read:** Clicking any notification marks it as read, updating the server via `PUT /api/notifications/{id}/read`.
- **Mark All Read:** Clears all unread badges across the platform via `POST /api/notifications/read-all`.
- **Alert Acknowledgement:** On monitoring screens, caregivers can click **"Acknowledge"** on active alerts, permanently recording their acknowledgement timestamp in the database audit log.
