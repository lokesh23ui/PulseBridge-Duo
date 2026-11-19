# PULSEBRIDGE DUO
### One Intelligent Healthcare Platform. Two Wearable Experiences. Connected Family Care.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2F%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20WebGL-black.svg?logo=three.js)](https://threejs.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Prototype Status](https://img.shields.io/badge/Status-Connected%20Healthcare%20Platform-emerald.svg)](#prototype-transparency--ethical-guardrails)

PulseBridge Duo is an intelligent wearable healthcare monitoring and early risk alert platform that unifies two complementary wearable form factors—the minimalist **PulseBridge Smart Ring** and the interactive **PulseBridge Smartwatch**—into a single, high-fidelity healthcare analytics ecosystem, bridging patients with authorized family caregivers through privacy-first connected care.

---

## 🌟 Key Highlights & Engineering Features

1. **Dual-Wearable Form Factor**:
   - **PulseBridge Smart Ring**: Grade 5 Titanium screenless ring designed for 24/7 continuous wear, nocturnal sleep architecture, and finger microvascular optical sensing.
   - **PulseBridge Smartwatch**: Aerospace aluminum smartwatch featuring a 1.4" AMOLED touchscreen, 6-axis IMU (gyroscope + accelerometer), and digital crown for active daytime wear.
   - **Synchronized Dual Operation**: Correlates concurrent streams, detects motion artifacts, evaluates signal quality, and handles single-device dropout with graceful fallback.

2. **Connected Patient–Caregiver Platform (Privacy-First)**:
   - **Independent User Roles**: Separate `patient` and `caregiver` accounts with isolated authentication, JWT sessions, and personalized views.
   - **Cryptographic Invitations**: Patients generate secure, time-limited single-use invitation tokens (`PBD-XXXX-XXXX`) to invite trusted family members.
   - **7 Granular Access Permissions**: Patients control exactly what each caregiver can see (`view_live_readings`, `view_historical_readings`, `view_medical_reports`, `view_health_trends`, `create_manage_alert_rules`, `acknowledge_alerts`, `view_device_status`).
   - **In-App Real-Time Notification Bell**: Unread badge counter, live WebSocket notification dispatch, and cooldown mechanisms preventing alert fatigue.
   - **Personalized Alert Thresholds**: Caregivers configure custom rules (e.g. Eleanor's COPD threshold: SpO2 < 92%) evaluated in real time.
   - **Medical Reports Vault**: Secure diagnostic summary repository with HIPAA-grade permission enforcement.

3. **Interactive 3D Mechanical Models (Three.js WebGL)**:
   - Standalone procedural WebGL engineering models for both devices.
   - **PulseBridge Ring**: 11 canonical addressable concept components (`R01`–`R11`).
   - **PulseBridge Watch**: 15 canonical addressable concept components (`W01`–`W15`).
   - **Radial & Axial Exploded Views**: Interactive expansion slider (0% to 100%), play/pause animation, component selection highlighting, 3D pins, and internal transparency mode.

4. **Dedicated Simulation Studio (4 Discrete Modes)**:
   - **Mode 1: Smart Ring Simulator**: Virtual ring telemetry at 1 Hz with real-time **Synthetic PPG Waveform oscilloscope** (systolic peaks, dicrotic notch, and motion noise).
   - **Mode 2: Smartwatch Simulator**: Virtual AMOLED screen simulation with interactive side crown button cycling through Clock, Vitals, Activity Rings, and Alert notifications.
   - **Mode 3: Dual Wearable Simulator**: Side-by-side independent execution, delta divergence computation (e.g. Ring HR 78 vs Watch HR 81 bpm), and sensor dropout testing.
   - **Mode 4: Wokwi ESP32 Emulation**: JSON payload paste panel, syntax validator, and direct FastAPI ingestion.

5. **Controlled Telemetry Test Injector for Judges**:
   - Integrated into the Caregiver Dashboard (`/patient-monitor/:patientId`) to inject acute vital events (e.g. Acute Hypoxia: SpO2 87%, HR 145 bpm) on demand to instantly verify caregiver alert delivery and in-app notifications.

6. **Preserved Wokwi Phase 1 Hardware Contract**:
   - Accepts the canonical ESP32 + DHT22 JSON data contract (`PB-ESP32-01`) without modification.

---

## 👥 Pre-Seeded Judge Demo Accounts

For immediate testing, two pre-configured demo accounts are seeded into the local SQLite database on startup:

| Role | Name & Details | Email | Password | Quick Access |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | **Eleanor Vance** (Age 72, Nocturnal Arrhythmia) | `patient@pulsebridge.demo` | `PulsePass123!` | Click **"Demo Patient"** in Header or Login |
| **Caregiver** | **Marcus Vance** (Son & Authorized Caregiver) | `caregiver@pulsebridge.demo` | `PulsePass123!` | Click **"Demo Caregiver"** in Header or Login |

*Pre-configured relationship: Marcus Vance is pre-approved by Eleanor with active telemetry monitoring, custom alert rules, and sample cardiology reports.*

---

## 🏗️ System Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                      PULSEBRIDGE DUO CLIENT                                       |
|                                                                                                   |
|  +---------------------+  +-----------------------+  +---------------------+  +----------------+  |
|  |  Device 3D Models   |  |  Simulation Studio    |  |  Live Monitoring    |  | Family Care &  |  |
|  |  - Ring (R01-R11)   |  |  - 4 Simulation Modes |  |  - 8 Vital Cards    |  | Shared Portal  |  |
|  |  - Watch (W01-W15)  |  |  - 10 Preset Scenarios|  |  - Alert Feed & Ack |  | - 7 Permissions|  |
|  |  - Exploded Views   |  |  - Synthetic PPG      |  |  - Bézier History   |  | - Notif Bell   |  |
|  +---------------------+  +-----------------------+  +---------------------+  +----------------+  |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST / WebSocket
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                      FASTAPI BACKEND SERVICE                                      |
|                                                                                                   |
|  +--------------------+  +----------------------+  +--------------------+  +-------------------+  |
|  |  Auth & JWT Core   |  | Family Care Service  |  | Alert Rule Engine  |  | Ingestion Service |  |
|  |  - Bcrypt Hashing  |  | - PBD-XXXX-XXXX Inv. |  | - Global Thresh.   |  | - Wokwi ESP32     |  |
|  |  - Role Middleware |  | - 7 Granular Perms   |  | - Custom Patient   |  | - Ring / Watch    |  |
|  |  - Token Expiry    |  | - Instant Revocation |  | - Cooldown Guard   |  | - Test Injector   |  |
|  +--------------------+  +----------------------+  +--------------------+  +-------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             SQLAlchemy 2.0 ORM + SQLite Storage                             |  |
|  |  Tables: users, patient_profiles, caregiver_profiles, caregiver_invitations,               |  |
|  |          patient_caregiver_relationships, access_permissions, alert_rules, notifications,   |  |
|  |          medical_reports, audit_logs, sensor_readings, health_alerts, devices               |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- **Node.js**: v18+ (tested on v26.13)
- **Python**: 3.10+ (tested on 3.13)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/lokesh23ui/PulseBridge-Duo.git
cd PulseBridge-Duo
```

### 2. Backend Setup & Automated Tests
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run complete 10-test automated verification suite
python -m pytest backend/tests/ -v

# Start FastAPI backend server on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation is available at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup & Startup
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Build production bundle (tsc -b && vite build)
npm run build

# Start preview server on port 5173
npm run preview -- --port 5173 --host 127.0.0.1
```
Open your browser at: `http://127.0.0.1:5173/`

---

## 🧭 Navigation & Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | Product showcase, dual 3D hero model, 6 platform capabilities, live status |
| `/login` | **Sign In** | Secure authentication with 1-click **Demo Patient** & **Demo Caregiver** shortcuts |
| `/register` | **Registration** | Separate registration flows for Patients and Caregivers |
| `/family` | **Family Care Hub** | Manage caregiver invitations, toggle 7 granular permissions, or view connected patients |
| `/patient-monitor/:id` | **Shared Patient Dashboard** | Live vitals, custom alert rule management, authorized medical reports, test injector |
| `/reports` | **Medical Reports Vault** | Patient upload and management of clinical health records and diagnostic summaries |
| `/devices` | **Device Explorer** | 3-way configuration selector (`Ring only`, `Watch only`, `Both`), comparative matrix |
| `/devices/ring` | **Smart Ring 3D** | Interactive 3D ring, exploded view slider, 11 components (`R01`–`R11`), detail inspector |
| `/devices/watch` | **Smartwatch 3D** | Interactive 3D watch, exploded view slider, 15 components (`W01`–`W15`), detail inspector |
| `/simulation` | **Simulation Studio** | 4 simulation modes (Ring, Watch, Dual, Wokwi), synthetic PPG canvas, 10 scenarios |
| `/monitor` | **Live Dashboard** | 8 vital metric cards, sparklines, alert feed with acknowledge action, Wokwi injection |
| `/insights` | **Health Insights** | 6 Bézier spline historical charts, time range filters (`1h`, `6h`, `24h`, `7d`), telemetry log |
| `/technology` | **Technology Architecture** | Clickable 6-layer architecture stack, Wokwi payload schema, REST/WS contracts |
| `/about` | **About & Transparency** | Problem statement, 6-tier Transparency Matrix, target beneficiaries, medical guardrails |

---

## ⏱️ 5-Minute Judge Demonstration Flow

1. **One-Click Patient Login & Caregiver Management (0:00 - 1:15)**:
   - Open `http://127.0.0.1:5173/login`. Click **"Demo Patient (Eleanor Vance)"**.
   - Navigate to **Family Care** (`/family`). Observe active caregiver **Marcus Vance (Son)**.
   - Click **"Customize Permissions"**. Toggle on/off the 7 granular permissions (e.g. `Medical Reports: Locked`).
   - Click **"Invite Caregiver"** to generate a cryptographic code (e.g. `PBD-7K92-AX51`). Show 1-click copy and 48-hour expiration timer.
2. **Switch to Caregiver & Test Permission Isolation (1:15 - 2:30)**:
   - Click Logout, then click **"Demo Caregiver (Marcus Vance)"**.
   - Navigate to **My Patients** (`/family`). Observe Eleanor Vance's live vitals card (Heart Rate, SpO2, active alerts).
   - Click **"Open Live Care Dashboard"** (`/patient-monitor/1`).
   - Observe real-time vitals. Scroll to **Medical Reports**: if permission is off, observe the privacy lock card explaining that Eleanor has restricted access.
3. **Controlled Telemetry Injection & Real-Time Alert (2:30 - 3:45)**:
   - On Eleanor's monitoring page, look at the **Interactive Hackathon Alert Trigger**.
   - Click **"Preset: Acute Hypoxia & Tachycardia"** (HR: 145 bpm, SpO2: 87%).
   - Click **"Inject Telemetry & Trigger Caregiver Alert"**.
   - Watch the Notification Bell in the header immediately update with an unread badge!
   - Click the Notification Bell to inspect the incoming alert: `Critical SpO2 alert for Eleanor Vance`.
4. **3D Hardware Engineering & PPG Oscilloscope (3:45 - 5:00)**:
   - Navigate to `/devices/ring`. Drag the **Exploded View slider** to 100% to view components `R01`–`R11`.
   - Navigate to `/simulation`. Observe the live **Synthetic PPG Waveform oscilloscope** rendering systolic peaks and dicrotic notches in real time.

---

## ⚖️ Prototype Transparency & Ethical Guardrails

- **Optical PPG Constraints**: Standard consumer optical PPG measures volumetric changes in microvascular tissue beds. It does **not** directly or reliably replace arterial blood pressure cuffs or continuous enzymatic/microneedle glucose monitors (CGMs). All blood pressure and glucose metrics in this prototype are labelled as demonstration placeholders or secondary estimates.
- **Skin vs Core Temperature**: Finger and wrist sensors measure peripheral dermal temperature, which differs physiologically from core body temperature.
- **DHT22 Scope**: The DHT22 sensor in the Wokwi hardware emulation measures ambient room temperature and humidity, not bodily temperature.
- **Regulatory Status**: PulseBridge Duo is a software and simulation engineering prototype developed for demonstration. It has not received FDA 510(k), CE mark, or medical device certification and must not be used for clinical diagnosis or treatment.

---

## 📂 Documentation Index

- [`docs/PATIENT_CAREGIVER_ARCHITECTURE.md`](docs/PATIENT_CAREGIVER_ARCHITECTURE.md): Full architectural specification of roles, family model, and data isolation.
- [`docs/FAMILY_CONNECTION_FLOW.md`](docs/FAMILY_CONNECTION_FLOW.md): Step-by-step cryptographic invitation, redemption, and approval lifecycle.
- [`docs/ROLE_PERMISSIONS.md`](docs/ROLE_PERMISSIONS.md): Matrix of the 7 granular access permissions and server-side enforcement.
- [`docs/SHARED_MONITORING.md`](docs/SHARED_MONITORING.md): Dual-view monitoring, WebSocket telemetry distribution, and test injector.
- [`docs/IN_APP_NOTIFICATIONS.md`](docs/IN_APP_NOTIFICATIONS.md): In-app notification engine, cooldown controls, and notification bell.
- [`docs/SECURITY_AND_PRIVACY.md`](docs/SECURITY_AND_PRIVACY.md): Data sovereignty, bcrypt hashing, JWT validation, and audit logging.
- [`docs/PATIENT_CAREGIVER_TEST_REPORT.md`](docs/PATIENT_CAREGIVER_TEST_REPORT.md): Automated test execution report with 100% pass rate.
- [`docs/REFERENCE_AUDIT.md`](docs/REFERENCE_AUDIT.md): Comprehensive audit of the Base44 reference deployment.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Complete 6-layer architecture and data flow specification.
- [`docs/API.md`](docs/API.md): REST and WebSocket API contracts and request/response schemas.
- [`docs/HARDWARE.md`](docs/HARDWARE.md): Physical hardware specifications for Ring (`R01`–`R11`) and Watch (`W01`–`W15`).
- [`docs/SIMULATION_GUIDE.md`](docs/SIMULATION_GUIDE.md): Guide to the 4 simulation modes and 10 demonstration scenarios.
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md): Step-by-step 5-minute walkthrough script for judges and reviewers.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
