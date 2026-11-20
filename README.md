# PULSEBRIDGE DUO
### One Intelligent Healthcare Platform. Two Wearable Experiences. Connected Family Care & Atrial Fibrillation Intelligence.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2F%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20WebGL-black.svg?logo=three.js)](https://threejs.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Automated Tests](https://img.shields.io/badge/Backend%20Tests-30%2F30%20Passing-success.svg?logo=pytest&logoColor=white)](backend/tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Regulatory Status](https://img.shields.io/badge/Regulatory-Investigational%20Prototype-amber.svg)](#-prototype-transparency--ethical-guardrails)

PulseBridge Duo is an intelligent connected wearable healthcare monitoring and early cardiac alert platform. It unifies two complementary form factors—the minimalist **PulseBridge Smart Ring** and the interactive **PulseBridge Smartwatch**—into a single synchronized analytics ecosystem. It connects patients with authorized family caregivers through privacy-first connected care and provides dedicated clinical intelligence for **Atrial Fibrillation (AFib)** risk detection.

---

## 🌟 Key Engineering Highlights

### 1. Dual-Wearable Form Factor
- **PulseBridge Smart Ring**: Grade 5 Titanium screenless ring designed for 24/7 continuous wear, nocturnal sleep architecture tracking, and finger microvascular optical sensing.
- **PulseBridge Smartwatch**: Aerospace aluminum smartwatch featuring a 1.4" AMOLED touchscreen, 6-axis IMU (gyroscope + accelerometer), and digital crown for active daytime wear.
- **Synchronized Dual Operation**: Correlates concurrent streams, detects motion artifacts, evaluates signal quality, and handles single-device dropout with graceful fallback.

### 2. Connected Patient–Caregiver Platform (Privacy-First)
- **Independent User Roles**: Separate `patient` and `caregiver` accounts with isolated authentication, JWT sessions, and personalized views.
- **Cryptographic Invitations**: Patients generate secure, time-limited single-use invitation tokens (`PBD-XXXX-XXXX`) to invite trusted family members.
- **7 Granular Access Permissions**: Patients maintain full data sovereignty, controlling access to:
  1. `view_live_readings` — Real-time vital metrics streaming.
  2. `view_historical_readings` — Historical trendlines and log telemetry.
  3. `view_medical_reports` — Clinical diagnostic reports and summaries.
  4. `view_health_trends` — Longitudinal statistical charts.
  5. `create_manage_alert_rules` — Personalized caregiver threshold triggers.
  6. `acknowledge_alerts` — Triage and dismiss active alerts.
  7. `view_device_status` — Battery, firmware, and connectivity status.
- **In-App Real-Time Notification Bell**: Unread badge counter, live WebSocket notification dispatch, and cooldown mechanisms preventing alert fatigue.
- **Personalized Alert Thresholds**: Caregivers configure custom rules (e.g., SpO2 < 92%, Heart Rate > 120 bpm) evaluated in real time.

### 3. Atrial Fibrillation (AFib) Clinical Intelligence
- **Single-Disease Clinical Knowledge Base** (`/diseases/atrial-fibrillation`): In-depth clinical literature on pathophysiology, risk factors (CHA2DS2-VASc), diagnostic criteria, and warning signs.
- **Patient-Based AFib Analysis Engine** (`/disease-analysis`): Intelligent multi-factor evaluation combining real-time sensor metrics, patient demographics, documented symptoms, and uploaded ECG findings.
- **4 Core Clinical Parameters**: Strictly bounded to scientifically validated AFib markers:
  1. **Heart Rhythm / Electrocardiogram (ECG Lead I / Lead II)**: Sinus Rhythm, Atrial Fibrillation, Inconclusive.
  2. **Heart Rate (BPM)**: Continuous pulse rate (30 – 220 bpm).
  3. **Heart Rate Variability (HRV)**: RMSSD and SDNN in milliseconds, evaluating autonomic tone and RR interval irregularity.
  4. **Blood Oxygen Saturation (SpO2 %)**: Dual-wavelength photoplethysmography (70 – 100%).
  *(Note: Unvalidated secondary estimates such as blood pressure or blood glucose have been retired from clinical AFib assessment to avoid diagnostic noise).*

### 4. PulseBridge Admin Console v2.0 (`/admin`)
A unified administrative and governance command center with 11 dedicated modules:
- **System Dashboard**: High-level platform health, user tallies, active alerts, and telemetry throughput.
- **Patient Management**: Inspect patient profiles, active wearable bindings, and account states (active/suspended).
- **Caregiver Directory**: Audit family connections, active invitation tokens, and caregiver relationships.
- **AFib Knowledge Base**: Manage clinical disease literature, guidance notes, and risk calculators.
- **Symptom Directory**: Curate recognized clinical symptoms, severity scores, and reporting criteria.
- **Health Parameter Controls**: Configure baseline clinical bounds exclusively for the 4 core parameters.
- **Medical Report Metadata**: Audit uploaded clinical document metadata with HIPAA-compliant in-memory parsing.
- **System Announcements**: Broadcast platform-wide alerts and maintenance notices to active users.
- **Application Settings**: Manage feature flags, simulation parameters, and registration policies.
- **Audit Logs**: Cryptographic, immutable, append-only security logs of all administrative and access events.
- **Security & Integrations Status**: Live secrets hygiene scanner and integration status dashboard displaying `Configured`, `Missing configuration`, or `Optional integration disabled` without exposing private keys.

### 5. Interactive 3D Mechanical Models (Three.js WebGL)
- Standalone procedural WebGL engineering models for both devices.
- **PulseBridge Ring**: 11 canonical addressable concept components (`R01`–`R11`).
- **PulseBridge Watch**: 15 canonical addressable concept components (`W01`–`W15`).
- **Radial & Axial Exploded Views**: Interactive expansion slider (0% to 100%), play/pause animation, component selection highlighting, 3D pins, and internal transparency mode.

### 6. Dedicated Simulation Studio (4 Discrete Modes)
- **Mode 1: Smart Ring Simulator**: Virtual ring telemetry at 1 Hz with real-time **Synthetic PPG Waveform oscilloscope** (systolic peaks, dicrotic notch, and motion noise).
- **Mode 2: Smartwatch Simulator**: Virtual AMOLED screen simulation with interactive side crown button cycling through Clock, Vitals, Activity Rings, and Alert notifications.
- **Mode 3: Dual Wearable Simulator**: Side-by-side independent execution, delta divergence computation (e.g. Ring HR 78 vs Watch HR 81 bpm), and sensor dropout testing.
- **Mode 4: Wokwi ESP32 Emulation**: JSON payload paste panel, syntax validator, and direct FastAPI ingestion.

### 7. Controlled Telemetry Test Injector for Reviewers
- Integrated into the Shared Patient Dashboard (`/patient-monitor/:patientId`) to inject acute vital events (e.g. Acute Hypoxia: SpO2 87%, HR 145 bpm) on demand to instantly verify caregiver alert delivery and in-app notifications.

---

## 👥 Pre-Seeded Demonstration Accounts

For immediate testing, three pre-configured demo accounts are seeded into the database on startup:

| Role | Name & Details | Email | Password | Quick Access |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | **Eleanor Vance** (Age 72, Nocturnal Arrhythmia) | `patient@pulsebridge.demo` | `PulsePass123!` | Click **"Demo Patient"** on Login |
| **Caregiver** | **Marcus Vance** (Son & Authorized Caregiver) | `caregiver@pulsebridge.demo` | `PulsePass123!` | Click **"Demo Caregiver"** on Login |
| **Administrator** | **System Administrator** (Console Operator) | `admin@pulsebridge.demo` | `PulseAdmin123!` | Login with Admin credentials |

*Pre-configured relationship: Marcus Vance is pre-approved by Eleanor with active telemetry monitoring, custom alert rules, and sample cardiology reports.*

---

## 🏗️ System Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                      PULSEBRIDGE DUO CLIENT                                       |
|                                                                                                   |
|  +---------------------+  +-----------------------+  +---------------------+  +----------------+  |
|  |  Device 3D Models   |  |  Simulation Studio    |  |  Live Monitoring    |  | Family Care &  |  |
|  |  - Ring (R01-R11)   |  |  - 4 Simulation Modes |  |  - 4 AFib Vitals    |  | Shared Portal  |  |
|  |  - Watch (W01-W15)  |  |  - Synthetic PPG      |  |  - Alert Feed & Ack |  | - 7 Perms      |  |
|  |  - Exploded Views   |  |  - Wokwi ESP32 Bridge |  |  - Bézier History   |  | - Notif Bell   |  |
|  +---------------------+  +-----------------------+  +---------------------+  +----------------+  |
|  |  AFib Knowledge &   |  |  AFib Risk Analysis   |  |  Reports Vault      |  | Admin Console  |  |
|  |  Clinical Center    |  |  - Demographics + ECG |  |  - HIPAA Parse Mode |  | - 11 Modules   |  |
|  |  - Pathophysiology  |  |  - HRV / Rhythm Score |  |  - Permission Guard |  | - Zero Secrets |  |
|  +---------------------+  +-----------------------+  +---------------------+  +----------------+  |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST / WebSocket
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                      FASTAPI BACKEND SERVICE                                      |
|                                                                                                   |
|  +--------------------+  +----------------------+  +--------------------+  +-------------------+  |
|  |  Auth & JWT Core   |  | Family Care Service  |  | Alert Rule Engine  |  | Ingestion Service |  |
|  |  - Bcrypt (12 Rds) |  | - PBD-XXXX-XXXX Inv. |  | - 4 Vital Bounds   |  | - Wokwi ESP32     |  |
|  |  - Role RBAC       |  | - 7 Granular Perms   |  | - Custom Patient   |  | - Ring / Watch    |  |
|  |  - Token Expiry    |  | - Instant Revocation |  | - Cooldown Guard   |  | - Test Injector   |  |
|  +--------------------+  +----------------------+  +--------------------+  +-------------------+  |
|  |  AFib Analyzer     |  | Clinical Reports     |  | Audit Trail Engine |  | Admin Router      |  |
|  |  - Risk Scoring    |  | - In-Memory Parsing  |  | - Immutable Log    |  | - System Control  |  |
|  |  - Multi-Factor    |  | - Metadata Indexing  |  | - Access Events    |  | - Hygiene Scanner |  |
|  +--------------------+  +----------------------+  +--------------------+  +-------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  |                       SQLAlchemy 2.0 ORM + SQLite / PostgreSQL Storage                      |  |
|  |  Tables: users, patient_profiles, caregiver_profiles, caregiver_invitations,               |  |
|  |          patient_caregiver_relationships, access_permissions, alert_rules, notifications,   |  |
|  |          medical_reports, audit_logs, sensor_readings, health_alerts, devices,             |  |
|  |          disease_knowledge, disease_symptoms, health_parameters, app_settings,             |  |
|  |          announcements                                                                      |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 🔌 API Configuration & Secrets Showcase

PulseBridge Duo follows strict **zero-trust secrets management**. Configuration settings and third-party integrations are defined in `.env.example` with descriptive placeholders. Server secrets are exclusively read by the FastAPI backend and never forwarded to client bundles.

### Environment Variable Blueprint (`.env.example`)

```bash
# Server & Environment
ENVIRONMENT=development
PORT=8000
HOST=127.0.0.1

# Security & Authentication
JWT_SECRET_KEY=YOUR_SECURE_JWT_SECRET_KEY_HERE_MIN_32_CHARS
JWT_SECRET=YOUR_SECURE_JWT_SECRET_KEY_HERE_MIN_32_CHARS
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Engine
DATABASE_URL=sqlite:///./pulsebridge.db

# Administrative Provisioning
ADMIN_EMAIL=admin@pulsebridge.demo
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD_HERE

# Optional AI & Cloud Integrations (Gracefully Degraded When Unset)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL_HERE
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID_HERE
```

For complete integration guides, verification matrices, and production deployment checklists, consult [`docs/API_CONFIGURATION.md`](docs/API_CONFIGURATION.md).

---

## 📁 Repository Directory Structure

```
PulseBridge-Duo/
├── .env.example                     # Environment template with showcase placeholders
├── .gitignore                       # Strict exclusion rules (.env, .db, uploads, builds)
├── README.md                        # Master repository showcase and technical documentation
├── LICENSE                          # MIT License
│
├── backend/                         # FastAPI Python Backend Application
│   ├── app/
│   │   ├── api/                     # REST & WebSocket route controllers
│   │   │   ├── admin_router.py      # Admin Console endpoints (11 modules + hygiene)
│   │   │   ├── disease_router.py    # AFib knowledge base & analysis endpoints
│   │   │   ├── family_router.py     # Invitations, permissions, relationships
│   │   │   ├── telemetry_router.py  # Ingestion, sensor queries, alert triage
│   │   │   └── auth_router.py       # Registration, login, profile management
│   │   ├── core/                    # Core security and configuration
│   │   │   ├── auth.py              # Bcrypt hashing, JWT generation, RBAC dependencies
│   │   │   └── config.py            # Pydantic environment settings
│   │   ├── database/                # Database engine and ORM models
│   │   │   ├── connection.py        # SQLAlchemy engine, session maker, schema auto-migration
│   │   │   └── models.py            # Complete entity schemas (users, vitals, AFib, admin)
│   │   ├── schemas/                 # Pydantic request & response models
│   │   └── services/                # Business logic engines
│   │       ├── afib_service.py      # AFib risk calculation and multi-factor evaluation
│   │       ├── alert_service.py     # Threshold evaluation, cooldown, WebSocket dispatch
│   │       └── report_service.py    # In-memory document parsing and extraction
│   ├── tests/                       # 30-Test Pytest automated verification suite
│   └── requirements.txt             # Backend Python dependencies
│
├── frontend/                        # React 18 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/              # Reusable UI widgets, navigation, layout
│   │   │   ├── layout/              # Header, footer, navigation bar, notifications
│   │   │   └── three/               # Three.js 3D Ring & Watch WebGL models
│   │   ├── pages/                   # Application view controllers
│   │   │   ├── admin/               # 11 Admin Console pages (Dashboard, Patients, etc.)
│   │   │   ├── diseases/            # AFib Knowledge Base & Patient Analysis pages
│   │   │   ├── devices/             # 3D interactive hardware explorers
│   │   │   ├── simulation/          # 4-mode wearable simulation studio
│   │   │   ├── FamilyCarePage.tsx   # Cryptographic invitations & permission manager
│   │   │   └── LiveMonitorPage.tsx  # Real-time telemetry dashboard & test injector
│   │   ├── services/                # Axios API client bindings
│   │   └── types/                   # TypeScript interface definitions
│   ├── package.json                 # Node.js dependencies and scripts
│   ├── vite.config.ts               # Vite build configuration
│   └── tailwind.config.js           # Tailwind CSS theme and design tokens
│
├── docs/                            # Architectural and operational documentation
│   ├── API_CONFIGURATION.md         # Comprehensive API integration and env setup guide
│   ├── PATIENT_CAREGIVER_ARCHITECTURE.md # Roles, invitations, permission isolation
│   ├── ROLE_PERMISSIONS.md          # 7 Granular permissions enforcement matrix
│   ├── SECURITY_AND_PRIVACY.md      # Data sovereignty, bcrypt hashing, audit trail
│   ├── HARDWARE.md                  # Physical specifications for Ring & Watch
│   └── SIMULATION_GUIDE.md          # Guide to 4 simulation modes & PPG oscilloscope
│
└── wokwi/                           # Embedded hardware emulation blueprints
    └── esp32-sensor-contract.json   # Canonical Wokwi ESP32 + DHT22 JSON schema
```

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- **Node.js**: v18+ (tested on v26.x)
- **Python**: 3.10+ (tested on 3.13)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/lokesh23ui/PulseBridge-Duo.git
cd PulseBridge-Duo
```

### 2. Backend Setup & Automated Test Suite
```bash
# Optional: Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Run complete 30-test automated verification suite
python -m pytest backend/tests/ -v

# Start FastAPI backend server on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Interactive Swagger API documentation is available at: `http://127.0.0.1:8000/docs`*

### 3. Frontend Setup & Startup
In a separate terminal:
```bash
cd frontend

# Install Node dependencies
npm install

# Verify production bundle build
npm run build

# Start local development server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```
*Open your browser at: `http://127.0.0.1:5173/`*

---

## 🧭 Navigation & Application Routes

| Route | View | Description & Core Capabilities |
| :--- | :--- | :--- |
| `/` | **Home** | Product showcase, dual 3D hero model, 6 platform capabilities, live status |
| `/login` | **Sign In** | Secure authentication with 1-click **Demo Patient** & **Demo Caregiver** shortcuts |
| `/register` | **Registration** | Separate registration flows for Patients and Caregivers |
| `/family` | **Family Care Hub** | Manage caregiver invitations, toggle 7 granular permissions, view connected family |
| `/patient-monitor/:id` | **Shared Patient Dashboard** | Live vitals, custom alert rule management, authorized medical reports, test injector |
| `/reports` | **Medical Reports Vault** | Patient upload and management of clinical health records and diagnostic summaries |
| `/diseases/atrial-fibrillation`| **AFib Knowledge Center** | Clinical pathophysiology, CHA2DS2-VASc risk factors, diagnostic criteria, warning signs |
| `/disease-analysis` | **Patient AFib Analysis** | Multi-factor risk assessment combining vitals, symptoms, reports, and ECG findings |
| `/devices` | **Device Explorer** | 3-way configuration selector (`Ring only`, `Watch only`, `Both`), comparative matrix |
| `/devices/ring` | **Smart Ring 3D** | Interactive 3D ring, exploded view slider, 11 components (`R01`–`R11`), detail inspector |
| `/devices/watch` | **Smartwatch 3D** | Interactive 3D watch, exploded view slider, 15 components (`W01`–`W15`), detail inspector |
| `/simulation` | **Simulation Studio** | 4 simulation modes (Ring, Watch, Dual, Wokwi), synthetic PPG canvas, 10 scenarios |
| `/monitor` | **Live Dashboard** | 4 vital metric cards, sparklines, alert feed with acknowledge action, Wokwi injection |
| `/insights` | **Health Insights** | Historical charts, time range filters (`1h`, `6h`, `24h`, `7d`), telemetry log |
| `/technology` | **Technology Architecture** | Clickable 6-layer architecture stack, Wokwi payload schema, REST/WS contracts |
| `/about` | **About & Transparency** | Problem statement, 6-tier Transparency Matrix, target beneficiaries, medical guardrails |
| `/admin` | **Admin Dashboard** | High-level platform statistics, active user counts, alert tallies, system health |
| `/admin/patients` | **Patient Management** | Patient directory, active wearable status, account activation/suspension |
| `/admin/caregivers` | **Caregiver Directory** | Caregiver connections, active invitation tokens, relationship audits |
| `/admin/afib-knowledge` | **AFib Knowledge Admin** | Clinical literature management, educational reference curation |
| `/admin/symptoms` | **Symptom Directory** | Clinical symptom registry, severity levels, indicator flags |
| `/admin/parameters` | **Parameter Controls** | Clinical threshold configuration for the 4 core parameters |
| `/admin/reports` | **Report Metadata** | Diagnostic report indexing, document status audit, HIPAA compliance check |
| `/admin/announcements` | **Broadcast Notices** | System-wide banner announcements and maintenance notices |
| `/admin/settings` | **App Settings** | Global platform flags, simulation tuning, registration controls |
| `/admin/audit-logs` | **Security Audit Logs** | Immutable, append-only security log of all administrative and access events |
| `/admin/security` | **Security Hygiene** | Zero-leakage verification of credentials, database status, and API configurations |

---

## ⏱️ 5-Minute Demonstration Walkthrough for Reviewers

1. **Patient Login & Family Delegation (0:00 – 1:15)**:
   - Navigate to `http://127.0.0.1:5173/login` and click **"Demo Patient (Eleanor Vance)"**.
   - Navigate to **Family Care** (`/family`). View Eleanor's active caregiver **Marcus Vance (Son)**.
   - Click **"Customize Permissions"**. Toggle on/off any of the 7 granular permissions (e.g. `Medical Reports: Locked`).
   - Click **"Invite Caregiver"** to generate a cryptographic code (e.g. `PBD-7K92-AX51`). Observe 1-click copy and 48-hour expiration timer.
2. **Caregiver Experience & Permission Isolation (1:15 – 2:30)**:
   - Click Logout, then click **"Demo Caregiver (Marcus Vance)"**.
   - Navigate to **My Patients** (`/family`). Observe Eleanor Vance's live vitals card (Heart Rate, SpO2, active alerts).
   - Click **"Open Live Care Dashboard"** (`/patient-monitor/1`).
   - Observe real-time vitals. Scroll to **Medical Reports**: if permission is off, observe the privacy lock card explaining that Eleanor has restricted access.
3. **Controlled Telemetry Injection & Real-Time Alert (2:30 – 3:30)**:
   - On Eleanor's monitoring page, locate the **Interactive Hackathon Alert Trigger**.
   - Select **"Preset: Acute Hypoxia & Tachycardia"** (HR: 145 bpm, SpO2: 87%).
   - Click **"Inject Telemetry & Trigger Caregiver Alert"**.
   - Watch the Notification Bell in the header immediately update with an unread badge!
   - Click the Notification Bell to inspect the incoming alert: `Critical SpO2 alert for Eleanor Vance`.
4. **Atrial Fibrillation Clinical Intelligence (3:30 – 4:15)**:
   - Navigate to **AFib Analysis** (`/disease-analysis`).
   - Click **"Run AFib Risk Analysis"**. Observe the comprehensive score calculation incorporating Eleanor's age (72), tachycardia episode, documented flutter symptoms, and cardiology reports.
   - Click **"AFib Knowledge Center"** (`/diseases/atrial-fibrillation`) to review clinical pathophysiology, CHA2DS2-VASc scoring, and clinical guideline notes.
5. **Admin Console & Security Hygiene (4:15 – 5:00)**:
   - Log in as `admin@pulsebridge.demo` / `PulseAdmin123!`.
   - Access `/admin` to view the unified governance dashboard.
   - Visit `/admin/security` to inspect live secrets hygiene, verifying 0 leaked credentials and non-sensitive API integration status badges.

---

## ⚖️ Prototype Transparency & Ethical Guardrails

- **Optical Photoplethysmography (PPG) Scope**: Optical PPG measures volumetric changes in microvascular tissue beds. It provides indicative pulse rate, rhythm irregularity, and blood oxygen trends. It does **not** replace hospital-grade multi-lead electrocardiography (12-lead ECG) or invasive arterial monitoring.
- **Focused Clinical Parameter Policy**: Secondary estimates (e.g. optical blood pressure, blood glucose, echocardiogram approximations) have been explicitly excluded from this platform to avoid unvalidated clinical claims.
- **Ambient vs Physiological Temperature**: The DHT22 sensor in the Wokwi hardware emulation captures ambient environmental temperature and humidity, which must not be conflated with core or dermal body temperature.
- **Regulatory Status**: PulseBridge Duo is a software and simulation engineering prototype developed for demonstration, research, and hackathon evaluation. It has not been cleared or approved by the FDA, CE, or any medical regulatory authority and must not be used for emergency medical diagnosis, prevention, or treatment.

---

## 📂 Documentation Index

- [`docs/API_CONFIGURATION.md`](docs/API_CONFIGURATION.md): Comprehensive guide to API credentials, env variables, and deployment architecture.
- [`docs/PATIENT_CAREGIVER_ARCHITECTURE.md`](docs/PATIENT_CAREGIVER_ARCHITECTURE.md): Full architectural specification of roles, family model, and data isolation.
- [`docs/FAMILY_CONNECTION_FLOW.md`](docs/FAMILY_CONNECTION_FLOW.md): Step-by-step cryptographic invitation, redemption, and approval lifecycle.
- [`docs/ROLE_PERMISSIONS.md`](docs/ROLE_PERMISSIONS.md): Matrix of the 7 granular access permissions and server-side enforcement.
- [`docs/SECURITY_AND_PRIVACY.md`](docs/SECURITY_AND_PRIVACY.md): Data sovereignty, bcrypt hashing, JWT validation, and audit logging.
- [`docs/HARDWARE.md`](docs/HARDWARE.md): Physical hardware specifications for Ring (`R01`–`R11`) and Watch (`W01`–`W15`).
- [`docs/SIMULATION_GUIDE.md`](docs/SIMULATION_GUIDE.md): Guide to the 4 simulation modes and synthetic PPG oscilloscope.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
