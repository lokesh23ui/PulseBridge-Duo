# PulseBridge Duo — AI Support Assistant Architecture

## 1. Overview & Purpose

The **PulseBridge AI Support Assistant** is an always-accessible, floating clinical and technical guidance interface embedded directly into the application. Positioned at the bottom-right corner of every screen, the assistant helps patients and caregivers navigate the platform, understand wearable capabilities, troubleshoot connection states, and interpret physiological alerts.

```
+-----------------------------------------------------------------------------------+
|                        PULSEBRIDGE ASSISTANT ARCHITECTURE                         |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Floating Action Button] (Bottom-Right, Pulse Indicator)                         |
|          │                                                                        |
|          ▼                                                                        |
|  Slide-Over Conversation Drawer (High-Contrast Clean Light Surface)              |
|          │                                                                        |
|          ├── Quick Suggestion Chips (Pre-built high-frequency queries)            |
|          │     ├── "How do I pair both wearables?"                                │
|          │     ├── "How do I invite a family caregiver?"                          |
|          │     ├── "What do heart rate alerts mean?"                              |
|          │     └── "What are the 7 access permissions?"                           |
|          │                                                                        |
|          ▼                                                                        |
|  Interactive Natural Language Query Parser                                        |
|          │                                                                        |
|          ▼                                                                        |
|  Curated Clinical & Operational Knowledge Engine                                  |
|          │                                                                        |
|          ├── In-App Deep Links (One-click navigation to `/devices`, `/family`, etc)|
|          └── Medical Disclaimer & Non-Diagnostic Guardrail Enforcement             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Interactive Features & Ergonomics

### 2.1 Floating Access & Unobtrusive Footprint
- **Launcher:** Fixed position at `bottom-6 right-6 z-40`, featuring a medical blue button (`bg-blue-600 hover:bg-blue-700`) with a subtle pulse indicator.
- **Drawer Animation:** Slides into view with a smooth scale-in transition (`animate-in fade-in zoom-in-95`), occupying an optimal $400\text{ px}$ width on desktop and full width on mobile viewports.
- **Reset Chat:** Includes a trash icon button allowing users to clear previous conversation history and return to the primary menu.

### 2.2 Quick Prompt Chips
First-time users can immediately click high-frequency question chips without manual typing:
- *"How do I connect Ring & Watch?"*
- *"How to invite a caregiver?"*
- *"Explain alert thresholds"*
- *"What are the 7 permissions?"*

---

## 3. Curated Clinical Knowledge Base

The assistant incorporates a structured clinical and technical knowledge base:

| Topic Area | Covered Capabilities | Integrated Action Link |
| :--- | :--- | :--- |
| **Dual Wearable Pairing** | Explains the complementary roles of the Smart Ring (microvascular optical PPG) and Smartwatch (wrist kinematics & display). | Link to [Devices Explorer](/devices) |
| **Family Care & Invitations** | Steps to generate secure `PBD-XXXX-XXXX` codes and approve incoming requests. | Link to [Family Care Portal](/family) |
| **Personalized Alerts** | Explains threshold violations, severity rankings (Critical, Warning, Attention), and recovery notifications. | Link to [Live Monitoring](/monitoring) |
| **Permission Controls** | Details the 7 granular permissions (vitals, realtime, history, reports, alerts, rules, export). | Link to [Family Care Portal](/family) |
| **Simulation Studio** | Explains how to test the 10 clinical scenarios and Wokwi ESP32 emulation. | Link to [Simulation Studio](/simulation) |

---

## 4. Medical Safety Guardrails & Disclaimers

The assistant includes prominent, non-dismissible safety disclaimers:
1. **Header Advisory:** *"AI Health Assistant · Non-Clinical Guidance"*.
2. **Footer Guardrail:** *"The PulseBridge Assistant provides navigational and educational information. It is not a clinical diagnostic tool or medical emergency service. If experiencing a medical emergency, call your local emergency services (e.g. 911 / 112) immediately."*
3. **Emergency Detection:** Queries containing acute distress keywords (e.g., "chest pain", "can't breathe", "loss of consciousness") return an urgent prompt advising the user to contact emergency services immediately.
