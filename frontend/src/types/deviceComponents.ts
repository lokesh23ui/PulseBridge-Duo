export interface DeviceComponent {
  id: string;
  canonicalId: string; // e.g. R01, W01
  name: string;
  category: 'Structural' | 'Optical' | 'Electronics' | 'Compute' | 'Power' | 'Sensors' | 'Interface';
  status: 'Proposed' | 'Simulated' | 'Implemented';
  purpose: string;
  technicalDescription: string;
  physicalLocation: string;
  supportedReadings: string[];
  explosionVector: [number, number, number]; // [x, y, z] direction for exploded view
}

export const RING_COMPONENTS: DeviceComponent[] = [
  {
    id: 'ring-enclosure',
    canonicalId: 'R01',
    name: 'Ring Outer Enclosure',
    category: 'Structural',
    status: 'Proposed',
    purpose: 'Provides rigid structural integrity, environmental protection, and hypoallergenic external skin contact.',
    technicalDescription: 'CNC-machined Grade 5 Aerospace Titanium with Physical Vapor Deposition (PVD) ceramic coating. Provides IP68 water resistance up to 50 meters depth.',
    physicalLocation: 'Outer circumferential band of the ring assembly.',
    supportedReadings: ['Environmental impact protection', 'Water sealing'],
    explosionVector: [0, 0, 1.8]
  },
  {
    id: 'inner-structural-layer',
    canonicalId: 'R02',
    name: 'Inner Structural Layer',
    category: 'Structural',
    status: 'Proposed',
    purpose: 'Hypoallergenic biocompatible resin interface directly contacting the user finger dermis.',
    technicalDescription: 'Medical-grade ISO 10993 certified epoxy polymer engineered with ergonomic contoured ridges to minimize rotation and motion artifacts on digital arteries.',
    physicalLocation: 'Inner diameter liner conforming to the finger circumference.',
    supportedReadings: ['Sensor optical coupling', 'Dermal contact stability'],
    explosionVector: [0, 0, -1.5]
  },
  {
    id: 'sensor-window',
    canonicalId: 'R03',
    name: 'Optical Sensor Window',
    category: 'Optical',
    status: 'Proposed',
    purpose: 'Transmits optical emitter and receiver wavelengths with zero optical aberration and high scratch resistance.',
    technicalDescription: 'Curved sapphire crystal window with anti-reflective dual-sided optical coating, optimized for 525nm, 660nm, and 940nm transmission.',
    physicalLocation: 'Palmar-facing inner surface, positioned directly above palmar digital arteries.',
    supportedReadings: ['Optical transmission', 'Photoplethysmography'],
    explosionVector: [0, -1.8, 0]
  },
  {
    id: 'ppg-sensor',
    canonicalId: 'R04',
    name: 'Optical PPG Sensor Array',
    category: 'Sensors',
    status: 'Simulated',
    purpose: 'Captures continuous microvascular blood volume pulsations for heart rate and SpO2 estimation.',
    technicalDescription: 'Triple-wavelength micro-LED cluster: Green (525nm) for high-contrast resting heart rate, Red (660nm) and Infrared (940nm) for blood oxygen saturation ratio-of-ratios analysis.',
    physicalLocation: 'Directly behind the optical sapphire window on the flexible PCB.',
    supportedReadings: ['Heart Rate (bpm)', 'SpO2 (%)', 'Pulse Transit Time'],
    explosionVector: [0, -2.4, 0]
  },
  {
    id: 'miniature-pcb',
    canonicalId: 'R05',
    name: 'Miniature Flexible Rigid-Flex PCB',
    category: 'Electronics',
    status: 'Proposed',
    purpose: 'Interconnects low-power microcontroller, power management, memory, and sensor subsystems in a curved ring profile.',
    technicalDescription: 'High-density interconnect (HDI) 6-layer rigid-flex polyimide substrate, contoured to fit the 18mm ring circumference with 25-micron trace clearances.',
    physicalLocation: 'Sandwiched between outer titanium shell and inner resin liner.',
    supportedReadings: ['Power distribution', 'Bus routing'],
    explosionVector: [1.2, 0, 0]
  },
  {
    id: 'mcu',
    canonicalId: 'R06',
    name: 'Low-Power Microcontroller',
    category: 'Compute',
    status: 'Proposed',
    purpose: 'Manages on-device digital signal processing (DSP), BLE advertising, and power-saving sleep cycles.',
    technicalDescription: 'Nordic Semiconductor nRF5340 Dual-Core ARM Cortex-M33 SoC (128 MHz application core + 64 MHz network core) with hardware floating point unit.',
    physicalLocation: 'Mounted on the dorsal rigid section of the flexible PCB.',
    supportedReadings: ['Sample filtering', 'Peak detection algorithms'],
    explosionVector: [0, 1.8, 0]
  },
  {
    id: 'battery',
    canonicalId: 'R07',
    name: 'Rechargeable Curved Battery',
    category: 'Power',
    status: 'Proposed',
    purpose: 'Supplies continuous uninterrupted electrical power for 4 to 7 days of 24/7 continuous health tracking.',
    technicalDescription: 'Curved solid-state / lithium-polymer pouch cell (nominal voltage 3.85V, capacity 22 mAh) engineered to endure over 800 charge cycles.',
    physicalLocation: 'Conforms to lateral curvature opposite the sensor cluster.',
    supportedReadings: ['Battery Percentage (%)', 'Power Telemetry'],
    explosionVector: [-1.8, 0, 0]
  },
  {
    id: 'ble-module',
    canonicalId: 'R08',
    name: 'Bluetooth Low Energy Subsystem',
    category: 'Electronics',
    status: 'Proposed',
    purpose: 'Transmits encrypted biometric packets to smartphone or gateway bridge with minimal power consumption.',
    technicalDescription: 'Integrated 2.4 GHz RF circuit supporting BLE 5.3 Long Range PHY with custom embedded planar inverted-F antenna (PIFA).',
    physicalLocation: 'Adjacent to microcontroller on the flexible PCB.',
    supportedReadings: ['RSSI', 'Connection State', 'Packet Acknowledgment'],
    explosionVector: [1.5, 1.5, 0]
  },
  {
    id: 'accelerometer',
    canonicalId: 'R09',
    name: '3-Axis MEMS Accelerometer',
    category: 'Sensors',
    status: 'Simulated',
    purpose: 'Tracks movement, step activity, sleep stages, and estimates motion artifacts to dynamically adjust optical filter weights.',
    technicalDescription: 'Ultra-low power Bosch BMA400 3-axis accelerometer consuming less than 4 microamperes at full 100 Hz output data rate.',
    physicalLocation: 'Lateral section of the flexible PCB.',
    supportedReadings: ['Activity Score (%)', 'Step Count', 'Motion Artifact Index'],
    explosionVector: [-1.5, 1.5, 0]
  },
  {
    id: 'temp-sensor',
    canonicalId: 'R10',
    name: 'Skin Temperature Sensor',
    category: 'Sensors',
    status: 'Simulated',
    purpose: 'Measures high-resolution peripheral skin surface temperature trends for circadian rhythm and recovery assessment.',
    technicalDescription: 'High-precision negative temperature coefficient (NTC) digital thermistor calibrated to ±0.1°C accuracy in the 32°C to 42°C human dermal range.',
    physicalLocation: 'Thermal contact pad on the inner resin surface.',
    supportedReadings: ['Skin Temperature (°C)'],
    explosionVector: [0, -1.2, -1.2]
  },
  {
    id: 'charging-contacts',
    canonicalId: 'R11',
    name: 'Magnetic Charging Contacts',
    category: 'Interface',
    status: 'Proposed',
    purpose: 'Mates with magnetic charging dock for high-efficiency DC power delivery without piercing outer water seal.',
    technicalDescription: 'Dual gold-plated nickel pogo-pin contact pads with neodymium magnetic alignment guides.',
    physicalLocation: 'Inner circumference, lateral edge.',
    supportedReadings: ['Charge Status', 'Dock Engagement'],
    explosionVector: [0, -1.5, 1.5]
  }
];

export const WATCH_COMPONENTS: DeviceComponent[] = [
  {
    id: 'front-glass',
    canonicalId: 'W01',
    name: 'Front Display Glass',
    category: 'Structural',
    status: 'Proposed',
    purpose: 'Scratch-resistant front lens shielding the AMOLED display while maintaining high optical clarity.',
    technicalDescription: '2.5D curved sapphire crystal with oleophobic anti-fingerprint and anti-reflective nanocoating.',
    physicalLocation: 'Topmost layer of the smartwatch assembly.',
    supportedReadings: ['Touch input', 'Visual interface'],
    explosionVector: [0, 0, 3.2]
  },
  {
    id: 'display-module',
    canonicalId: 'W02',
    name: 'AMOLED Touch Display Module',
    category: 'Interface',
    status: 'Simulated',
    purpose: 'Displays real-time vital graphs, time, notifications, and urgent health alerts with high contrast in bright daylight.',
    technicalDescription: '1.4-inch circular AMOLED display (454x454 resolution, 326 PPI, 1000 nits peak brightness, 60 Hz refresh rate).',
    physicalLocation: 'Directly beneath sapphire front glass.',
    supportedReadings: ['Local UI Rendering', 'Alert Notifications'],
    explosionVector: [0, 0, 2.4]
  },
  {
    id: 'chassis-enclosure',
    canonicalId: 'W03',
    name: 'Main Chassis Enclosure',
    category: 'Structural',
    status: 'Proposed',
    purpose: 'Structural core housing all electronics, providing impact protection and hermetic sealing.',
    technicalDescription: 'CNC-machined 6000-series aerospace aluminum alloy with precision bead-blasted anodized finish and 5 ATM water resistance.',
    physicalLocation: 'Central body enclosing internal electronics.',
    supportedReadings: ['Mechanical integrity', 'Thermal dissipation'],
    explosionVector: [0, 0, 1.2]
  },
  {
    id: 'main-pcb',
    canonicalId: 'W04',
    name: 'Main Motherboard PCB',
    category: 'Electronics',
    status: 'Proposed',
    purpose: 'Hosts central processing unit, power management IC, memory, and sensor bus bridges.',
    technicalDescription: '10-layer High Density Interconnect (HDI) motherboard with micro-vias and shielded RF zones.',
    physicalLocation: 'Centered within aluminum chassis.',
    supportedReadings: ['System telemetry', 'Bus communication'],
    explosionVector: [0, 0, 0.4]
  },
  {
    id: 'main-mcu',
    canonicalId: 'W05',
    name: 'Main Application SoC & DSP',
    category: 'Compute',
    status: 'Proposed',
    purpose: 'Executes operating system, sensor fusion algorithms, local alert evaluation, and graphic engine.',
    technicalDescription: 'Dual-core ARM Cortex-M33 processor (up to 200 MHz) with specialized CMSIS-DSP instruction set and 2D hardware graphics accelerator.',
    physicalLocation: 'Mounted on primary motherboard surface.',
    supportedReadings: ['Sensor fusion', 'Algorithm execution'],
    explosionVector: [0, 1.4, 0.4]
  },
  {
    id: 'watch-ppg-sensor',
    canonicalId: 'W06',
    name: 'Multi-Channel Biometric Optical PPG Sensor',
    category: 'Sensors',
    status: 'Simulated',
    purpose: 'Provides wrist-based photoplethysmography with multi-LED spatial diversity to reduce motion sensitivity.',
    technicalDescription: 'Multi-wavelength circular LED cluster (4 Green, 2 Red, 2 IR) coupled with dual large-area photodiodes and 24-bit analog front-end (AFE).',
    physicalLocation: 'Embedded in rear ceramic backplate directly contacting the dorsal wrist.',
    supportedReadings: ['Heart Rate (bpm)', 'SpO2 (%)', 'Pulse Variability'],
    explosionVector: [0, 0, -2.2]
  },
  {
    id: 'watch-accelerometer',
    canonicalId: 'W07',
    name: '3-Axis High-G Accelerometer',
    category: 'Sensors',
    status: 'Simulated',
    purpose: 'Measures wrist acceleration, arm swing velocity, fall detection, and high-frequency motion artifacts.',
    technicalDescription: 'Low-noise 16-bit 3-axis MEMS accelerometer with programmable range (±2g to ±16g) and integrated step-counting state machine.',
    physicalLocation: 'Motherboard periphery.',
    supportedReadings: ['Activity (%)', 'Step Count', 'Fall Dynamics'],
    explosionVector: [-1.4, 0, 0.4]
  },
  {
    id: 'gyroscope',
    canonicalId: 'W08',
    name: '3-Axis Gyroscope',
    category: 'Sensors',
    status: 'Simulated',
    purpose: 'Measures angular rotation velocity for wrist-flick gesture recognition and spatial orientation tracking.',
    technicalDescription: '3-axis MEMS gyroscope with low zero-rate drift (<1 deg/s) and high sensitivity (up to 2000 dps).',
    physicalLocation: 'Co-packaged with accelerometer on motherboard.',
    supportedReadings: ['Angular Velocity', 'Wrist Wake Gesture'],
    explosionVector: [1.4, 0, 0.4]
  },
  {
    id: 'watch-temp-sensor',
    canonicalId: 'W09',
    name: 'Wrist Skin Temperature Sensor',
    category: 'Sensors',
    status: 'Simulated',
    purpose: 'Monitors wrist dermal temperature trends and correlates with ring temperature readings.',
    technicalDescription: 'Thermally isolated contact sensor array embedded in rear ceramic crystal.',
    physicalLocation: 'Rear casing, perimeter of optical module.',
    supportedReadings: ['Skin Temperature (°C)'],
    explosionVector: [0, -1.4, -2.0]
  },
  {
    id: 'watch-ble-module',
    canonicalId: 'W10',
    name: 'BLE 5.3 + Bluetooth Audio Subsystem',
    category: 'Electronics',
    status: 'Proposed',
    purpose: 'High-throughput wireless link to smartphone, cloud gateway, and local Bluetooth audio peripherals.',
    technicalDescription: 'Integrated 2.4 GHz transceiver supporting Bluetooth 5.3 with 2 Mbps PHY, Coded PHY, and LE Audio broadcasting.',
    physicalLocation: 'Motherboard RF section.',
    supportedReadings: ['Signal Strength (RSSI)', 'Throughput'],
    explosionVector: [1.6, 1.4, 0]
  },
  {
    id: 'antenna',
    canonicalId: 'W11',
    name: 'LDS Molded Bezel Antenna',
    category: 'Electronics',
    status: 'Proposed',
    purpose: 'Radiates RF energy efficiently around the metal chassis to prevent hand detuning.',
    technicalDescription: 'Laser Direct Structuring (LDS) antenna integrated into internal plastic structural bezel.',
    physicalLocation: 'Upper perimeter beneath display bezel.',
    supportedReadings: ['RF Efficiency', 'Link Budget'],
    explosionVector: [0, 2.2, 1.2]
  },
  {
    id: 'watch-battery',
    canonicalId: 'W12',
    name: 'Rechargeable High-Capacity Battery',
    category: 'Power',
    status: 'Simulated',
    purpose: 'Supplies system power for 24 to 36 hours of active display and multi-sensor operation.',
    technicalDescription: 'High energy-density lithium-ion pouch cell (3.87V, 300 mAh capacity) with integrated protection circuit module (PCM).',
    physicalLocation: 'Between motherboard and rear sensor assembly.',
    supportedReadings: ['Battery Percentage (%)', 'Charge Cycle Count'],
    explosionVector: [0, 0, -1.0]
  },
  {
    id: 'charging-circuit',
    canonicalId: 'W13',
    name: 'Qi Wireless Charging Coil & PMIC',
    category: 'Power',
    status: 'Proposed',
    purpose: 'Enables convenient magnetic wireless charging dock compatibility.',
    technicalDescription: 'Integrated planar wire-wound copper induction coil with ferrite shielding and Qi-compliant fast charging PMIC.',
    physicalLocation: 'Rear ceramic cover, surrounding optical pod.',
    supportedReadings: ['Wireless Charge Status', 'Current Draw'],
    explosionVector: [0, 0, -1.6]
  },
  {
    id: 'side-button',
    canonicalId: 'W14',
    name: 'Digital Crown & Multi-Function Button',
    category: 'Interface',
    status: 'Simulated',
    purpose: 'Provides physical rotational scroll and tactile button click for gloved or wet-hand operation.',
    technicalDescription: 'Optical rotary encoder coupled with tactile micro-switch with 60 gf actuation force.',
    physicalLocation: 'Right lateral edge of aluminum chassis.',
    supportedReadings: ['Rotary Scroll', 'Button Press'],
    explosionVector: [2.6, 0, 0]
  },
  {
    id: 'strap',
    canonicalId: 'W15',
    name: 'Fluoroelastomer Ergonomic Strap',
    category: 'Structural',
    status: 'Proposed',
    purpose: 'Secures watch firmly against wrist with controlled tension for optimal optical biometric sensing.',
    technicalDescription: '22mm high-performance fluoroelastomer with molded ventilation channels and 316L stainless steel pin buckle.',
    physicalLocation: 'Attached to top and bottom chassis lugs.',
    supportedReadings: ['Ergonomic fit', 'Tension stability'],
    explosionVector: [0, -3.2, 0]
  }
];
