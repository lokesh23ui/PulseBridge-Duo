# PulseBridge Duo — Hardware & Sensing Reference

## 1. PulseBridge Smart Ring Specification

### Physical Characteristics
- **Outer Shell**: Grade 5 Titanium with PVD scratch-resistant coating (Weight: 4.2g, Width: 7.9mm, Thickness: 2.5mm)
- **Inner Rim**: Medical-grade biocompatible resin with recessed optical window and charging contacts
- **Water Ingress Protection**: IP68 (50m water resistant)

### Subsystems & Component IDs
- **R01**: Ring Outer Enclosure (Titanium / PVD Ceramic)
- **R02**: Inner Structural Layer (Biocompatible Hypoallergenic Resin)
- **R03**: Optical Sensor Window (Curved Sapphire Crystal)
- **R04**: Optical PPG Sensor Array (Green 525nm, Red 660nm, IR 940nm + Photodiode)
- **R05**: Miniature Flexible PCB (6-layer rigid-flex interconnect)
- **R06**: Low-Power MCU (Nordic nRF5340 Dual-Core BLE SoC)
- **R07**: Rechargeable Battery (Curved 22 mAh Li-Po, 4–7 days typical endurance)
- **R08**: Bluetooth Low Energy Module (Integrated loop antenna, BLE 5.3)
- **R09**: 3-Axis Accelerometer (Bosch BMA400 ultra-low power)
- **R10**: Skin Temperature Sensor (High precision NTC thermistor ±0.1°C)
- **R11**: Magnetic Charging Contacts (Dual gold-plated pogo-pin landing pads)

---

## 2. PulseBridge Smartwatch Specification

### Physical Characteristics
- **Chassis**: CNC Aerospace Aluminum / Ceramic back plate (Diameter: 44mm, Thickness: 10.8mm)
- **Display**: 1.4" Circular AMOLED (454×454 px, 326 ppi, 1000 nits peak, Always-On support)
- **Strap**: 22mm Quick-release medical fluoroelastomer

### Subsystems & Component IDs
- **W01**: Front Display Glass (Sapphire Crystal with Anti-Fingerprint Oleophobic Coating)
- **W02**: AMOLED Touch Display Module (Round 1.4" capacitive touch panel)
- **W03**: Main Chassis Enclosure (Precision Machined Aluminum Housing)
- **W04**: Main System Motherboard (High-density multi-layer HDI PCB)
- **W05**: Application SoC & DSP (ARM Cortex-M33 Dual-Core with Biometric DSP)
- **W06**: Multi-Channel Biometric Optical PPG Sensor (Multi-wavelength circular LED cluster)
- **W07**: 3-Axis Accelerometer (High-G motion capture)
- **W08**: 3-Axis Gyroscope (Angular velocity orientation tracking)
- **W09**: Skin Temperature Thermistor Array (Multi-point contact sensor)
- **W10**: BLE 5.3 + Bluetooth Audio Subsystem (Long-range gateway & smartphone link)
- **W11**: Laser-Direct Structured Antenna (Omnidirectional LDS bezel integration)
- **W12**: Rechargeable Battery (300 mAh Lithium-ion, 24–36 hours runtime)
- **W13**: Qi Inductive Wireless Receiver & Fast Charging PMIC
- **W14**: Digital Crown & Optical Multi-Function Push Button
- **W15**: Medical-Grade Fluoroelastomer Strap

---

## 3. Physical Limitations & Clinical Truth in Engineering

1. **Optical PPG Blood Pressure & Glucose**: Standard optical PPG measures volumetric changes in microvascular tissue beds. While pulse transit time (PTT) and morphological pulse wave analysis are active research areas, consumer optical PPG does **not** directly or reliably replace arterial blood pressure cuffs or continuous enzymatic/microneedle glucose monitors (CGMs). All BP and Glucose readings in PulseBridge Duo are labelled as demonstration placeholders or secondary estimates.
2. **Skin vs Core Temperature**: The ring and watch measure skin surface temperature at the finger and wrist. Peripheral skin temperature is sensitive to ambient air temperature, vasoconstriction, and motion, and is distinct from core body temperature (typically measured tympanically, orally, or rectally).
3. **Motion Artifacts**: Vigorous wrist or finger movement introduces substantial optical baseline shifts. PulseBridge Duo's dual-device simulation demonstrates how signal quality degradation can be detected using concurrent accelerometer data.
