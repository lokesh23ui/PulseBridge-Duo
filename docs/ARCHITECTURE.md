# PulseBridge Duo — System Architecture

## 1. Architectural Overview

PulseBridge Duo is built around a modern, decoupled client-server architecture:
- **Frontend Presentation & 3D Simulation Client**: React 18, TypeScript, Vite, Tailwind CSS, Lucide-React, Three.js / React Three Fiber / Drei, and Recharts.
- **High-Performance Ingestion & Processing Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM, SQLite database, and WebSockets.
- **IoT & Hardware Simulation Subsystem**: Virtual Smart Ring Simulator, Virtual Smartwatch Simulator, Dual-Device Correlation Simulator, and Wokwi ESP32 JSON Gateway Bridge.

```
+-----------------------------------------------------------------------------------+
|                              PULSEBRIDGE DUO CLIENT                                |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |  Device 3D Models  |  |  Simulation Studio   |  |  Live Monitoring & Alerts |  |
|  |  - Ring (R01-R11)  |  |  - Ring Simulator    |  |  - 6 Vital Metric Cards   |  |
|  |  - Watch (W01-W15) |  |  - Watch Simulator   |  |  - Health Alert Engine    |  |
|  |  - Exploded Views  |  |  - Dual Simulator    |  |  - Historical Bézier Plots|  |
|  |  - Three.js WebGL  |  |  - Synthetic PPG     |  |  - Acknowledge Workflow   |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          | REST / WebSocket
                                          v
+-----------------------------------------------------------------------------------+
|                              FASTAPI BACKEND SERVICE                              |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |  API Endpoints     |  |  Ingestion Adapters  |  |  Rule Alert Engine        |  |
|  |  - /api/health     |  |  - Wokwi Gateway     |  |  - Configurable Thresholds|  |
|  |  - /api/sensor-data|  |  - Ring Simulator    |  |  - Multi-severity Rules   |  |
|  |  - /api/latest     |  |  - Watch Simulator   |  |  - Verification Guidance  |  |
|  |  - /api/history    |  |  - Dual Correlator   |  |  - Deduplication & Ack    |  |
|  |  - /api/alerts     |  |  - Normalization     |  |                           |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |             SQLAlchemy 2.0 ORM + SQLite Persistent Data Storage             |  |
|  |  Tables: Device, SensorReading, HealthAlert, SimulationSession, SystemConfig |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. 6-Layer Architecture Details

### Layer 1: Sensor & Hardware Layer (Proposed Wearables + Wokwi Emulation)
- **PulseBridge Ring**: Photoplethysmography (PPG) triple-wavelength LED array (525nm Green, 660nm Red, 940nm IR), skin temperature thermistor (±0.1°C), 3-axis MEMS accelerometer, titanium enclosure.
- **PulseBridge Watch**: Multi-channel optical PPG cluster, 6-axis IMU (3-axis accelerometer + 3-axis gyroscope), contact temperature array, 1.4" AMOLED display, side crown.
- **Wokwi Phase 1 Hardware**: ESP32 DevKit V1, DHT22 (ambient temp + humidity), six analog potentiometers (HR, SpO2, Systolic, Diastolic, Glucose, Activity).

### Layer 2: Firmware & Communication Layer
- **Protocols**: Bluetooth Low Energy (BLE 5.3) GATT services for physical devices, UART/Serial JSON output for physical ESP32, and HTTPS/WSS for web simulation.
- **Packet Structure**: Normalized payload packets containing device timestamp, sequence counter, raw sensor ADCs, and connection telemetry.

### Layer 3: Normalization & Processing Layer
- **Payload Ingestion**: Robust JSON schema parsing and normalization via Pydantic models.
- **Signal Quality Metric**: Signal-to-noise ratio estimation and motion-artifact penalty (0.0 to 1.0).
- **Dual-Device Correlation**: Independent timestamping, reading divergence calculation (e.g. Ring HR vs Watch HR), and sensor-dropout tolerance.

### Layer 4: Storage & State Persistence Layer
- **Database Engine**: SQLite 3 with WAL mode for concurrent read/write performance.
- **Entities**:
  - `Device`: Registered device metadata and configuration status.
  - `SensorReading`: Normalized biometric and environmental telemetry.
  - `HealthAlert`: Generated clinical advisory alerts with severity and acknowledgement state.
  - `SystemConfig`: User-configurable threshold values.

### Layer 5: Visualization & Dashboard Layer
- **Rendering**: React 18 with Tailwind CSS styling and responsive layout.
- **Visual Analytics**: Interactive 3D WebGL models (Three.js), synthetic PPG waveform oscilloscope, SVG sparklines, and Recharts historical trends.
- **Accessibility & Guardrails**: Prominent prototype badges, medical disclaimers, clear distinction between skin vs ambient temp, and estimated placeholder indicators.

### Layer 6: Alert & Notification Engine
- **Evaluation**: Real-time evaluation of sensor readings against active threshold rules.
- **Severities**:
  - `CRITICAL`: Immediate physiological risk (e.g. SpO2 < 90%).
  - `WARNING`: Significant physiological excursion (e.g. HR > 115 bpm).
  - `ATTENTION`: Moderate deviation (e.g. BP systolic > 140 mmHg, Glucose > 180 mg/dL).
  - `NORMAL`: All parameters within standard bounds.
- **Workflow**: Timestamping, rationale generation, clinical action recommendations, and interactive acknowledgement.
