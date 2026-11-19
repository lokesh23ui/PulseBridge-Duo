# PulseBridge Duo — Judge Demonstration Script (5-Minute Tour)

This script provides an exact, step-by-step walk-through for judging panels or technical reviewers to experience the full PulseBridge Duo platform in under 5 minutes.

---

## Step 1: Ecosystem Overview (0:00 - 0:45)
1. Navigate to `http://localhost:5173/` (Homepage).
2. **Key Talking Point**: "PulseBridge Duo addresses remote patient monitoring by combining two complementary wearable form factors—a minimalist smart ring and an interactive smartwatch—into one unified, transparent healthcare analytics platform."
3. Highlight the Hero section with 3D product renders, the 6 core platform capabilities, and the end-to-end data pipeline.

---

## Step 2: 3D Hardware Engineering Exploration (0:45 - 1:45)
1. Click **"Explore Devices"** or navigate to `/devices`.
2. Toggle the 3-way device configuration selector: `Ring only` -> `Watch only` -> `Ring + Watch`. Show how the interface adapts.
3. Click into **"PulseBridge Ring"** (`/devices/ring`).
   - Rotate the ring 360° with mouse drag; zoom into the inner sapphire optical window.
   - Click **"Exploded View"** to animate all 11 internal components (`R01`–`R11`) expanding outward.
   - Click component **`R04` (Optical PPG Sensor)** to display its technical specifications, wavelengths (525nm/660nm/940nm), and clinical measurement role in the right-hand panel.
4. Jump to **"PulseBridge Watch"** (`/devices/watch`).
   - Click **"Exploded View"** to reveal the 15 smartwatch layers (`W01`–`W15`), including the AMOLED display, chassis, main PCB, and rear optical cluster.

---

## Step 3: Virtual Simulation Studio & Waveforms (1:45 - 3:00)
1. Navigate to **"Simulation Studio"** (`/simulation`).
2. Select **"Smart Ring Simulator"**:
   - Click **Start Simulation**.
   - Observe the live **Synthetic PPG Waveform oscilloscope** rendering real-time systolic peaks, dicrotic notch, and diastolic decay.
   - Adjust the **Heart Rate Slider** from 70 to 120 bpm; note how waveform frequency scales instantaneously.
3. Select **"Smartwatch Simulator"**:
   - Click the interactive **Side Crown Button** to cycle the virtual AMOLED watch face between Clock, Vitals, and Activity screens.
4. Select **"Dual Wearable Simulator"** (The Core Technical Feature):
   - Click **Start Dual Stream**.
   - Point out independent readings: Ring HR (e.g. 78 bpm) vs Watch HR (e.g. 81 bpm).
   - Point out the divergence indicator: "Δ 3 bpm — Compatible readings with high dual-signal confidence."
   - Click **"Disconnect Ring"** to demonstrate fault tolerance: the watch stream seamlessly continues, and the platform handles the missing ring stream without crashing.

---

## Step 4: Scenario Ingestion & Health Risk Alerting (3:00 - 4:00)
1. In the Simulation Studio, select **Scenario 3: "Low SpO2 (Hypoxia Demo)"**.
2. Navigate to **"Live Monitoring"** (`/monitor`):
   - Notice the SpO2 card transition to 86% with a vivid **CRITICAL** warning badge.
   - Observe the Health Alert Feed displaying: *"Critical Hypoxia Demonstration: SpO2 at 86% (<90% threshold). Suggestion: Re-seat sensor and verify with calibrated pulse oximeter."*
   - Click the **"Acknowledge"** button; note the status change to "✓ Acknowledged".
3. Select the **Wokwi Mode** tab on the dashboard:
   - Click **"Inject Existing Wokwi Payload"** (`PB-ESP32-01`).
   - Demonstrate the JSON payload being ingested into the local FastAPI backend and updating the DHT22 ambient temperature and humidity cards.

---

## Step 5: Health Insights & Ethical Transparency (4:00 - 5:00)
1. Navigate to **"Health Insights"** (`/insights`):
   - Review the 6 Bézier trend charts across time ranges (`1h`, `6h`, `24h`, `7d`).
   - Inspect the historical telemetry log table with device origin tags.
2. Navigate to **"About"** (`/about`):
   - Walk through the **Transparency Matrix** showing clearly what is implemented in software, simulated in browser, emulated in Wokwi, and proposed for physical production.
   - Conclude with the ethical engineering statement: prototype demonstration only, no false claims of direct optical glucose/BP measurement.
