# PulseBridge Duo — Development Roadmap & Production Pathway

## Phase 1: Prototype Foundation & Interactive Simulation (Completed)
- [x] Reference application audit (`docs/REFERENCE_AUDIT.md`)
- [x] High-fidelity React 18 + TypeScript frontend with Tailwind CSS design system
- [x] Procedural Three.js 3D models for Ring (R01–R11) and Watch (W01–W15) with animated exploded views
- [x] Simulation Studio with 4 discrete modes (Ring, Watch, Dual-Device, and Wokwi)
- [x] Synthetic PPG waveform engine with adjustable rate, amplitude, and noise
- [x] 10 pre-configured demonstration scenarios covering resting, tachycardia, hypoxia, motion noise, and dropout
- [x] FastAPI REST backend + SQLite database + WebSocket streaming
- [x] Preserved Wokwi ESP32 payload ingestion adapter
- [x] Rule-based health alert engine with acknowledgement workflow
- [x] Historical insights with multi-interval Bézier spline charts

---

## Phase 2: Embedded Firmware & Hardware Proof of Concept (Next Step)
- [ ] Port ESP32 Wokwi firmware to physical ESP32-S3 DevKit
- [ ] Integrate physical MAX30102 / MAX30105 optical pulse oximetry sensor via I2C
- [ ] Connect physical skin-contact NTC thermistor via ADC
- [ ] Implement local Bluetooth Low Energy (BLE) Heart Rate Service (GATT 0x180D) and Health Thermometer Service (0x1809)
- [ ] Build desktop Web Bluetooth API bridge in frontend for direct browser pairing with ESP32

---

## Phase 3: Advanced Sensor Fusion & Biomarkers (Future Integration)
- [ ] Implement dual-stream Kalman filter to fuse concurrent ring and watch photoplethysmography
- [ ] Incorporate motion-artifact rejection algorithms using synchronized 6-axis IMU data
- [ ] Explore non-invasive Pulse Transit Time (PTT) estimation using simultaneous finger-to-wrist pulse wave timing
- [ ] Design custom FreeCAD parametric mechanical housings and export optimized GLTF/GLB models for injection molding

---

## Phase 4: Regulatory Pathway & Clinical Validation (Commercialization)
- [ ] Design History File (DHF) compliance according to ISO 13485
- [ ] Software as a Medical Device (SaMD) validation according to IEC 62304
- [ ] Clinical comparative validation studies against FDA-cleared reference pulse oximeters and blood pressure cuffs
- [ ] HIPAA / GDPR compliant end-to-end encrypted cloud storage with FHIR interoperability
