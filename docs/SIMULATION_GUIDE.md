# PulseBridge Duo — Simulation Studio & Scenario Guide

## 1. Overview
The **PulseBridge Simulation Studio** is a technical virtual testbed engineered to demonstrate multi-device wearable sensing, signal quality assessment, dual-stream correlation, sensor dropout, and rule-based risk alerting without requiring physical hardware.

---

## 2. Four Simulation Modes

### Mode 1: Smart Ring Simulator
- Virtual ring telemetry stream at 1.0 Hz.
- Realistic synthetic PPG waveform oscilloscope with adjustable pulse rate (50–140 bpm), systolic peak, dicrotic notch, and motion artifact noise.
- Skin temperature drift and 3-axis accelerometer tilt calculation.
- Live battery drain and connection status toggling.

### Mode 2: Smartwatch Simulator
- Interactive smartwatch canvas with simulated AMOLED UI display.
- Interactive side button / digital crown: cycles through Time, Vitals, Activity, and Alert screens.
- Optical PPG sensor activity, 6-axis IMU acceleration and gyroscope metrics.
- Simulated battery charging and connection state controls.

### Mode 3: Dual Wearable Simulator
- Side-by-side simultaneous execution of Ring and Watch streams.
- Separate timestamps, separate sampling rates, and distinct signal-quality metrics.
- Compatible reading comparison (e.g. Ring HR vs Watch HR) showing numerical delta and confidence level.
- Single-device disconnect and sensor dropout simulations to demonstrate unified platform fault tolerance.

### Mode 4: Wokwi ESP32 Hardware Emulation
- Preserves the existing Wokwi Phase 1 ESP32 project payload schema.
- Interactive JSON paste panel with syntax validation and one-click ingestion into the FastAPI backend.
- Displays parsed metrics, origin metadata, and resulting rule-based alerts.

---

## 3. The 10 Pre-Programmed Demonstration Scenarios

| Scenario | Name | Key Parameter Targets | Expected Behavior & Alerts |
|---|---|---|---|
| `1` | **Resting Baseline** | HR: 68-72 bpm, SpO2: 98%, Temp: 36.6°C, Signal: 0.98 | Status NORMAL. Clean dicrotic notch on synthetic PPG. |
| `2` | **Increased Activity** | HR: 125 bpm, Activity: 85%, Temp: 37.1°C, Accel: high | Status ATTENTION. Elevated HR correlated with high physical motion score. |
| `3` | **Low SpO2 (Hypoxia Demo)** | HR: 88 bpm, SpO2: 86%, BP: 120/80 mmHg | Status **CRITICAL**. Alert triggered: "Demonstration Low SpO2 (<90%)". Immediate verification prompt. |
| `4` | **Tachycardia / Elevated HR** | HR: 142 bpm, Activity: 15% (resting), SpO2: 97% | Status **WARNING**. Alert triggered: "Elevated Resting Heart Rate (>115 bpm)". |
| `5` | **Poor Sensor Contact** | Signal Quality: 0.22, High optical noise, erratic peaks | Status UNRELIABLE. Alert engine flags reading uncertainty rather than issuing false alarm. |
| `6` | **Device Disconnected** | Ring disconnects; Watch continues streaming | Platform maintains watch telemetry, marks ring offline, demonstrates single-device fallback. |
| `7` | **Low Battery State** | Ring Battery: 8%, Watch Battery: 12% | Power-saving warning banners triggered; non-essential polling throttled. |
| `8` | **Environmental Shift** | Ambient Temp: 38.5°C, Humidity: 82% (DHT22) | Environmental advisory displayed; clear distinction from skin temp. |
| `9` | **Sensor Dropout** | SpO2 stream drops to null while HR continues | Dashboard gracefully renders "No data" badge rather than reporting 0%. |
| `10` | **Full Dual-Device Demo** | Both devices active; minor HR divergence (Ring 78 vs Watch 81 bpm) | Coordinated collection demonstrated; dual comparison badges active; alert pipeline tested. |
