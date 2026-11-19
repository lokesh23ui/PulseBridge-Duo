# PulseBridge Duo — Product Experience & Interface Specification

## 1. Executive Summary & Design Vision

PulseBridge Duo is a unified connected healthcare and wearable telemetry platform designed to bridge the physiological and observational gap between patients and their authorized caregivers. Built around a dual-wearable paradigm—combining the microvascular optical precision of the PulseBridge Smart Ring with the continuous multi-sensor tracking and on-wrist haptics of the PulseBridge Smartwatch—the system provides synchronized, multi-site biological monitoring.

The user experience has been intentionally elevated from initial exploratory prototypes into a high-contrast, clinical-grade medical software interface. Every element balances immediate diagnostic clarity for lay caregivers and patients with the rigorous engineering capabilities required by clinical researchers, medical device engineers, and systems integrators.

---

## 2. Design Language & Clinical Aesthetics

The design architecture follows modern clinical ergonomics, adhering to WCAG 2.1 AA accessibility standards for contrast, readability, and immediate cognitive recognition during alert scenarios.

### 2.1 Palette Hierarchy
- **Canvas Base (`slate-50`, `#f8fafc`):** Clean, sterile white-to-light-grey foundational background that minimizes eye strain and mirrors hospital monitoring workstations.
- **Card Surfaces (`white`, `#ffffff`):** Crisp white elevated containers bounded by subtle hairline borders (`border-slate-200`) and soft shadows (`shadow-sm` / `shadow-md`), creating clean visual grouping.
- **Primary Clinical Blue (`blue-600`, `#2563eb`):** Symbolizes clinical trust, diagnostic focus, and interactive primary actions (buttons, active tabs, primary vital readouts).
- **Secondary Medical Teal (`teal-600` / `teal-700`, `#0d9488`):** Represents biological equilibrium, peripheral wellness, and successful telemetry transmission.
- **Deep Navy Typography (`slate-900`, `#0f172a`):** Maximum typographic contrast for primary metrics, clinical labels, and critical numbers.
- **Muted Clinical Slate (`slate-600` / `slate-500`, `#475569`):** Secondary contextual metadata, timestamps, units of measure, and sensor hardware identifiers.

### 2.2 Criticality & Alert System States
- **Normal / Equilibrium (`emerald-600` / `bg-emerald-50`):** Indicates stable physiological parameters safely within personalized baseline limits.
- **Attention / Caution (`amber-600` / `bg-amber-50`):** Early boundary excursions that warrant caregiver observation before escalating into acute episodes.
- **Warning (`orange-600` / `bg-orange-50`):** Pronounced deviations requiring verification or patient inquiry.
- **Critical / Emergency (`rose-600` / `bg-rose-50`):** Severe physiological breaches (e.g., ventricular tachycardia, acute arterial desaturation) requiring immediate alert escalation and clinical triage.

---

## 3. Platform Navigation Architecture

The global application header provides intuitive, role-aware routing across all primary operational zones:

| Section | Route | Target Audience | Primary Function |
| :--- | :--- | :--- | :--- |
| **Home** | `/` | All Users | Product introduction, dual wearable architecture, interactive quick evaluation access. |
| **Devices Explorer** | `/devices` | All Users | Interactive 3D mechanical breakdown & Telemetry Pairing Studio for Ring and Watch. |
| **Simulation Studio** | `/simulation` | Engineers / Clinicians | Comprehensive virtual testbed supporting 10 clinical scenarios and Wokwi ESP32 emulation. |
| **Live Monitoring** | `/monitoring` | All Users | Real-time multi-vital dashboard with Bézier waveform display and sample reading generator. |
| **Health Trends** | `/insights` | Patients / Caregivers | Longitudinal time-series analytics across 1h, 6h, 24h, and 7d historical intervals. |
| **Medical Reports** | `/reports` | Patients / Caregivers | Secure diagnostic repository for cardiology reports, lab results, and provider notes. |
| **Family Care** | `/family` | Patients | Invitation generation, access approval, and granular permission management for caregivers. |
| **Patient Monitor** | `/patients/:id` | Caregivers | Comprehensive remote patient cockpit with personalized rules and controlled telemetry testing. |
| **About Platform** | `/about` | Public / Clinicians | Product purpose, wearable independence, caregiver connectivity, and safety guardrails. |

---

## 4. Elimination of Development Jargon

To ensure the platform presents as a cohesive commercial-grade medical system, development-centric phrasing has been systematically replaced with production healthcare terminology:
- *“Hackathon Alert”* $\rightarrow$ **“Controlled Telemetry Injector”**
- *“Demo Mode / Demo Patient”* $\rightarrow$ **“Illustrative Evaluation Profile / Patient Account”**
- *“Inject Sample Wokwi Payload”* $\rightarrow$ **“Generate Sample Reading”**
- *“Demonstration Settings”* $\rightarrow$ **“Platform Threshold Settings”**
- *“Sample Dashboard”* $\rightarrow$ **“Remote Caregiver Monitoring Cockpit”**

All telemetry streams are accompanied by responsible, non-invasive disclaimers clarifying that synthesized data serves remote monitoring and algorithm evaluation purposes rather than primary diagnostic triage.

---

## 5. Accessibility & Responsive Engineering

1. **Fluid Grid Layouts:** Built on CSS Grid and Tailwind breakpoints (`sm`, `md`, `lg`, `xl`), ensuring full functional parity on desktop diagnostic monitors, tablet rounds, and mobile caregiver viewports.
2. **Keyboard Navigability & Screen Contrast:** Form inputs, buttons, and modal dialogs maintain visible focus rings (`focus:ring-2 focus:ring-blue-500`) and high contrast ratios ($> 4.5:1$).
3. **Responsive 3D Canvas Scaling:** Three.js viewports employ active `ResizeObserver` listeners to adapt canvas pixel ratios and aspect ratios dynamically to window resizing without layout tearing or CPU thrashing.
