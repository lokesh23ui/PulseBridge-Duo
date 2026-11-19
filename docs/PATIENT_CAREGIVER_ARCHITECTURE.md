# PULSEBRIDGE DUO — PATIENT & CAREGIVER CONNECTED HEALTHCARE PLATFORM ARCHITECTURE

**Date:** November 19, 2026  
**Document Status:** Complete Architecture & Implementation Blueprint  
**Specification Version:** 2.0.0  

---

## 1. System Vision & Architecture Summary

PulseBridge Duo extends its real-time IoT healthcare monitoring ecosystem into a **two-sided patient–caregiver collaboration platform**:

1. **PATIENT**: The monitored individual who generates vital telemetry (via PulseBridge Smart Ring, Smartwatch, or Wokwi gateway), owns their health data, and maintains exclusive authorization over who can view it.
2. **CAREGIVER**: A family member (son, daughter, spouse, relative) or authorized helper who monitors connected patients, reviews approved telemetry, configures personalized safety rules, and receives real-time alerts.

```
+---------------------------------------------------------------------------------------------------------+
|                                        PULSEBRIDGE DUO PLATFORM                                         |
|                                                                                                         |
|    +----------------------------------+                   +----------------------------------+          |
|    |      PATIENT WORKSPACE           |                   |      CAREGIVER WORKSPACE         |          |
|    |  - Owns health telemetry         |                   |  - Monitors approved patients    |          |
|    |  - Generates invitation tokens   |  Cryptographic    |  - Redeems invitation tokens     |          |
|    |  - Sets granular permissions     |  Connection Flow  |  - Configures alert rules        |          |
|    |  - Uploads medical reports       |<=================>|  - Views approved reports        |          |
|    |  - Revokes access at will        |                   |  - Receives in-app notifications |          |
|    +----------------------------------+                   +----------------------------------+          |
|                      \                                     /                                            |
|                       \                                   /                                             |
|                        v                                 v                                              |
|    +-----------------------------------------------------------------------------------------------+    |
|    |                                FASTAPI BACKEND & SECURITY LAYER                                |    |
|    |                                                                                               |    |
|    |   +--------------------------+  +--------------------------+  +---------------------------+   |    |
|    |   |  JWT Auth & Password     |  |  Granular RBAC & Access  |  |  Sensor Stream Ingestion  |   |    |
|    |   |  Hashing (Bcrypt / JWT)  |  |  Permission Evaluator    |  |  (Ring / Watch / Wokwi)   |   |    |
|    |   +--------------------------+  +--------------------------+  +---------------------------+   |    |
|    |                 |                             |                             |                 |    |
|    |                 v                             v                             v                 |    |
|    |   +---------------------------------------------------------------------------------------+   |    |
|    |   |                 Personalized Rule Engine (Cooldown, Persistence, Recovery)            |   |    |
|    |   +---------------------------------------------------------------------------------------+   |    |
|    |                 |                                                           |                 |    |
|    |                 v                                                           v                 |    |
|    |   +--------------------------+                             +------------------------------+   |    |
|    |   |  In-App Notifications    |                             |  WebSocket Event Broker      |   |    |
|    |   |  (Persistence + Read/Ack)|                             |  (Live Readings & Alerts)    |   |    |
|    |   +--------------------------+                             +------------------------------+   |    |
|    +-----------------------------------------------------------------------------------------------+    |
|                                                    |                                                    |
|                                                    v                                                    |
|    +-----------------------------------------------------------------------------------------------+    |
|    |                                  SQLITE DATABASE SCHEMA                                       |    |
|    |  - users                     - patient_profiles              - caregiver_profiles             |    |
|    |  - caregiver_invitations     - patient_caregiver_relations   - access_permissions             |    |
|    |  - alert_rules               - alert_events                  - notifications                  |    |
|    |  - medical_reports           - audit_logs                    - sensor_readings                |    |
|    +-----------------------------------------------------------------------------------------------+    |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Existing Infrastructure Inspection & Reuse Strategy

| Existing Component | Current Role | Patient–Caregiver Extension |
|---|---|---|
| **FastAPI Backend (`backend/app/main.py`)** | Ingestion, REST endpoints, WebSocket | Add Auth Router, Family Router, Patient Caregiver Router, Notification Router |
| **Database (`backend/app/database/connection.py`)** | SQLite with SQLAlchemy 2.0 ORM | Extend entities with `User`, `PatientProfile`, `CaregiverProfile`, `Relationship`, `Permission`, `AlertRule`, `Notification`, `MedicalReport` |
| **Sensor Ingestion (`POST /api/sensor-data`)** | Normalizes Ring, Watch, Wokwi, Demo streams | Associate sensor stream with patient identity; evaluate patient-specific alert rules |
| **Alert Engine (`backend/app/services/alert_engine.py`)** | Prototype threshold evaluation | Enhance with patient-specific rules, persistence, cooldowns, and caregiver notification delivery |
| **WebSocket (`ws://localhost:8000/ws/monitoring`)** | Broadcasts telemetry frames | Add user-authenticated channels: dispatch notifications directly to connected caregiver sockets |
| **Frontend Routing (`frontend/src/App.tsx`)** | Public routes (Home, Devices, Sim, Monitor) | Add Auth Context, Login/Register pages, Role-based Dashboard routing, Family Care page, Notifications |
| **3D Engineering Models & Simulators** | Ring (R01-R11), Watch (W01-W15), Wokwi | Preserved 100% unchanged; simulators can publish readings under patient accounts |

---

## 3. Database Entity Relational Model

### 3.1 Core Users & Profiles
- `users`:
  - `id` (Integer PK)
  - `email` (String unique, index)
  - `password_hash` (String)
  - `role` (Enum: `patient`, `caregiver`)
  - `full_name` (String)
  - `created_at` (DateTime)
- `patient_profiles`:
  - `id` (Integer PK)
  - `user_id` (Integer FK -> users.id, unique)
  - `age` (Integer, optional)
  - `emergency_contact_name` (String, optional)
  - `emergency_contact_phone` (String, optional)
  - `blood_type` (String, optional)
  - `medical_conditions` (Text, optional)
- `caregiver_profiles`:
  - `id` (Integer PK)
  - `user_id` (Integer FK -> users.id, unique)
  - `relationship_type` (String, e.g. "Son", "Daughter", "Spouse", "Nurse")
  - `phone_number` (String, optional)

### 3.2 Family Connections & Granular Permissions
- `caregiver_invitations`:
  - `id` (Integer PK)
  - `patient_id` (Integer FK -> users.id)
  - `invitation_code` (String, e.g. `PBD-7K92-AX51`, unique)
  - `invitation_token_hash` (String)
  - `expires_at` (DateTime, 48 hours expiry)
  - `used_at` (DateTime, nullable)
  - `status` (Enum: `active`, `used`, `expired`, `cancelled`)
- `patient_caregiver_relationships`:
  - `id` (Integer PK)
  - `patient_id` (Integer FK -> users.id, index)
  - `caregiver_id` (Integer FK -> users.id, index)
  - `relationship_label` (String, e.g. "Father", "Daughter")
  - `status` (Enum: `pending_approval`, `active`, `rejected`, `revoked`)
  - `created_at` (DateTime)
  - `approved_at` (DateTime, nullable)
  - `revoked_at` (DateTime, nullable)
- `access_permissions`:
  - `id` (Integer PK)
  - `relationship_id` (Integer FK -> patient_caregiver_relationships.id, index)
  - `view_live_readings` (Boolean, default: True)
  - `view_historical_readings` (Boolean, default: True)
  - `view_medical_reports` (Boolean, default: False)
  - `view_health_trends` (Boolean, default: True)
  - `create_manage_alert_rules` (Boolean, default: False)
  - `acknowledge_alerts` (Boolean, default: True)
  - `view_device_status` (Boolean, default: True)
  - `updated_at` (DateTime)

### 3.3 Personalized Alert Rules & Notifications
- `alert_rules`:
  - `id` (Integer PK)
  - `patient_id` (Integer FK -> users.id, index)
  - `created_by_user_id` (Integer FK -> users.id)
  - `parameter` (Enum: `heart_rate_bpm`, `spo2_percent`, `bp_systolic_mmhg`, `bp_diastolic_mmhg`, `glucose_mg_dl`, `temperature_c`)
  - `condition` (Enum: `greater_than`, `less_than`, `equal_to`, `outside_range`)
  - `threshold` (Float)
  - `lower_limit` (Float, optional for outside_range)
  - `upper_limit` (Float, optional for outside_range)
  - `severity` (Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `persistence_seconds` (Integer, default: 0)
  - `cooldown_seconds` (Integer, default: 300)
  - `enabled` (Boolean, default: True)
  - `last_triggered_at` (DateTime, nullable)
  - `created_at` (DateTime)
- `notifications`:
  - `id` (Integer PK)
  - `recipient_user_id` (Integer FK -> users.id, index)
  - `patient_id` (Integer FK -> users.id, index)
  - `title` (String)
  - `message` (Text)
  - `severity` (Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `parameter` (String)
  - `value` (Float)
  - `unit` (String)
  - `alert_id` (String)
  - `is_read` (Boolean, default: False)
  - `read_at` (DateTime, nullable)
  - `created_at` (DateTime)
- `medical_reports`:
  - `id` (Integer PK)
  - `patient_id` (Integer FK -> users.id, index)
  - `report_title` (String)
  - `category` (String, e.g. "Cardiology", "Bloodwork", "General Checkup")
  - `report_date` (DateTime)
  - `healthcare_provider` (String, optional)
  - `patient_notes` (Text, optional)
  - `extracted_summary` (JSON, optional)
  - `file_path` (String, optional)
  - `created_at` (DateTime)
- `audit_logs`:
  - `id` (Integer PK)
  - `actor_user_id` (Integer FK -> users.id)
  - `target_patient_id` (Integer FK -> users.id)
  - `action` (String, e.g. "INVITATION_CREATED", "ACCESS_APPROVED", "PERMISSION_UPDATED", "ACCESS_REVOKED")
  - `details` (JSON)
  - `timestamp` (DateTime)

---

## 4. Permission Matrix

| Capability | Patient Default | Caregiver (Default) | Caregiver (If Granted) |
|---|---|---|---|
| View own live telemetry | Yes | N/A | N/A |
| View connected patient live telemetry | N/A | Yes (`view_live_readings`) | Configurable by patient |
| View historical trends | Yes | Yes (`view_health_trends`) | Configurable by patient |
| View medical reports | Yes | No (`view_medical_reports`) | Only if explicitly enabled |
| Create & manage alert rules | Yes | No (`create_manage_alert_rules`)| Only if explicitly enabled |
| Acknowledge alerts | Yes | Yes (`acknowledge_alerts`) | Configurable by patient |
| Revoke caregiver access | Yes (instant) | No (can only unlink self) | Exclusively patient |

---

## 5. Implementation Roadmap

1. **Authentication Core (`backend/app/core/auth.py` & `/api/auth`)**: JWT generation, Bcrypt password hashing, `get_current_user`, `require_role`.
2. **Family Care Service & Endpoints (`/api/family`)**: Unique code generator (`PBD-XXXX-XXXX`), invitation validation, approval workflow, granular permission updates, and immediate revocation.
3. **Patient Data Scoping (`/api/patients/{id}/...`)**: Enforces active relationship and granular permissions before returning live readings, history, or medical reports.
4. **Personalized Alert Rules & Ingestion Trigger (`/api/alerts/rules`)**: Multi-rule evaluation engine supporting cooldowns, persistence, recovery events, and automatic in-app notification creation.
5. **Real-Time Notification Bell & WebSocket Dispatch (`/api/notifications`)**: Persistent notification inbox with unread counts, mark-as-read, and real-time WebSocket push events.
6. **Frontend State & Navigation**: `AuthContext.tsx`, Login/Register modals or pages, Patient Dashboard (`/patient/*`), Caregiver Dashboard (`/caregiver/*`), and Family Care Hub (`/family`).
7. **Demo Seeding & Automated Tests**: Demo Patient and Demo Caregiver seeded on startup with full test suite verifying permission isolation.
