# PulseBridge Duo — Patient–Caregiver Workflow & Permission Matrix

## 1. Connected Healthcare Paradigm

PulseBridge Duo redefines remote patient monitoring by placing patient consent and data privacy at the center of the architecture. Rather than treating patient telemetry as an open data stream accessible to anyone with a link, the platform establishes a cryptographically secure, invitation-based link between patients and their caregivers.

```
+-----------------------------------------------------------------------------------+
|                            PATIENT CONSENT LIFECYCLE                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Patient Dashboard]                                                             |
|          │                                                                        |
|          ▼                                                                        |
|  Generate Secure Code ────► "PBD-XXXX-XXXX" (48h TTL)                            |
|                                    │                                              |
|                                    ▼                                              |
|                           Caregiver Redeems Code                                  |
|                                    │                                              |
|                                    ▼                                              |
|                         [Pending Authorization]                                   |
|                                    │                                              |
|          ┌─────────────────────────┴─────────────────────────┐                    |
|          ▼                                                   ▼                    |
|  Patient Approves                                    Patient Rejects              |
|  (Selects from 7 Permissions)                                │                    |
|          │                                                   ▼                    |
|          ▼                                             Access Denied              |
|  Active Relationship Link                                                         |
|  (Live Telemetry & Notifications)                                                 |
|          │                                                                        |
|          ▼                                                                        |
|  Patient Can Modify Permissions                                                   |
|  or Revoke Access at Any Time                                                     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Secure Invitation Workflow

### 2.1 Code Generation
- The patient navigates to the **Family Care Portal** (`/family`) and clicks **"Generate New Caregiver Invitation"**.
- The backend generates a cryptographically random 8-character alphanumeric string formatted as `PBD-XXXX-XXXX` (e.g., `PBD-7A9K-M2X4`).
- **Validity:** Each code has a strict 48-hour Time-to-Live (TTL).
- **Single-Use:** Once redeemed, the invitation code is permanently marked as used and cannot be reused by third parties.

### 2.2 Caregiver Redemption
- An authorized caregiver enters the code into the **"Redeem Patient Invitation"** modal along with their relationship label (e.g., "Daughter", "Visiting Nurse").
- Upon submission, the request enters a `PENDING` state. The caregiver cannot access any patient telemetry or medical records until explicit consent is granted.

### 2.3 Patient Approval & Granular Consent
- The patient receives an in-app notification of the pending connection request.
- The patient reviews the caregiver's identity and customizes permissions before approving the link.

---

## 3. The Seven Granular Consent Permissions

Patients maintain granular control over their health data. Each of the seven permissions can be independently granted, updated, or revoked without severing the overall caregiver relationship:

| Permission Flag | Clinical Scope | Enforcement Behavior |
| :--- | :--- | :--- |
| `view_vitals` | Summary Vitals | Grants access to patient baseline metrics, last recorded heart rate, and current wellness status. |
| `view_realtime` | Live Telemetry Streams | Enables live WebSocket streaming of continuous PPG, real-time heart rate, and pulse oximetry. |
| `view_history` | Longitudinal Analytics | Unlocks historical time-series queries (1h, 6h, 24h, 7d trends) and trend analytics. |
| `view_medical_reports` | Diagnostic Vault | Authorizes viewing and downloading of uploaded clinical summaries, cardiology reports, and physician notes. |
| `receive_alerts` | Automated Notifications | Routes immediate in-app notifications to the caregiver when patient thresholds are breached. |
| `configure_rules` | Personalized Thresholds | Allows the caregiver to define custom patient-specific alert rules (e.g., HR > 115 bpm for grandma). |
| `export_data` | Telemetry Portability | Authorizes exporting longitudinal telemetry datasets as structured CSV/JSON clinical logs. |

---

## 4. Live Permission Modification & Instant Revocation

- **Live Updating:** Patients can toggle any of the 7 permissions on or off at any moment in the Family Care dashboard. Modifications take effect immediately across all active API sessions.
- **Instant Revocation:** Clicking **"Revoke Access"** terminates the caregiver relationship. All future API requests from the caregiver to `/api/patients/{id}/*` return an immediate HTTP `403 Forbidden` response.
