# PulseBridge Duo — 3D Device Preview & Telemetry Pairing Architecture

## 1. Overview of 3D Wearable Visualizations

PulseBridge Duo features browser-native 3D mechanical models built with Three.js. These models provide complete architectural transparency into the engineering design of both wearable devices:
1. **PulseBridge Smart Ring:** 11 addressable concept components (R01–R11), highlighting miniaturized components including titanium outer shell, epoxy resin liner, dual-wavelength optical PPG sensors, medical-grade charging pads, micro-battery, and Nordic nRF5340 BLE System-on-Chip.
2. **PulseBridge Smartwatch:** 15 addressable concept components (W01–W15), covering AMOLED display, optical PPG array, ECG electrode bezel, tactile side crown, haptic motor, micro-USB/magnetic charging interface, and lithium-polymer energy cell.

---

## 2. Technical Three.js Engineering Solutions

The 3D canvas implementations (`RingCanvas3D.tsx` and `WatchCanvas3D.tsx`) resolve critical Three.js and React integration challenges:

### 2.1 Drag vs. Click Raycast Discrimination
In standard OrbitControls, mouse movements used to pan or orbit the 3D model frequently register as click events, causing accidental component selection.
- **Solution:** Pointer tracking records the Euclidean distance between `pointerdown` and `pointerup` events:
  $$\Delta d = \sqrt{(x_{\text{up}} - x_{\text{down}})^2 + (y_{\text{up}} - y_{\text{down}})^2}$$
- Component raycasting executes **only** if $\Delta d < 5$ pixels, cleanly separating orbital camera drags from deliberate component selection clicks.

### 2.2 Stale Closure Prevention in Animation Loops
React function components re-render when props change, but Three.js animation loops (`requestAnimationFrame`) capture variables from their initial closure:
- **Solution:** Dynamic parameters (such as `autoRotate`) are mapped to mutable React refs (`autoRotateRef.current = autoRotate`). The render loop queries the ref on every frame, guaranteeing that toggling auto-rotation responds instantaneously without tearing down or reconstructing the WebGL scene.

### 2.3 Transparent Internal View via Material Opacity
Users can inspect internal circuitry through a dedicated "Internal Parts / Transparent Shell" toggle:
- **Solution:** A dedicated `useEffect` hook iterates over all mesh materials in the component hierarchy, setting `material.transparent = true` and toggling `material.opacity` between $1.0$ (opaque) and $0.25$ (translucent).

### 2.4 Responsive Canvas Scaling with Zero-Width Fallback
Three.js canvas containers dynamically adapt to screen size changes and split-screen layouts:
- **Solution:** A `ResizeObserver` monitors parent container dimensions and updates camera aspect ratios:
  $$\text{Aspect Ratio} = \frac{\max(\text{clientWidth}, 600)}{\max(\text{clientHeight}, 460)}$$
  The zero-width fallback prevents WebGL viewport collapse when containers mount before layout calculation.

---

## 3. Interactive Device Preview & Pairing Workflow

The **Devices Explorer** (`/devices`) includes an interactive **Telemetry Pairing Studio** that simulates the real-world Bluetooth Low Energy (BLE) pairing experience.

### 3.1 Wearable Selection Matrix
Users can choose their desired device pairing configuration:
- **Smart Ring (`PB-RING-01`):** Specializes in continuous microvascular PPG, resting heart rate, and overnight SpO2 stability.
- **Smartwatch (`PB-WATCH-01`):** Specializes in dynamic movement telemetry, ECG rhythm checks, and on-wrist haptic alarms.
- **Dual Wearable Configuration (Ring + Watch):** Activates concurrent multi-site sensing, enabling cross-correlation and artifact cancellation.

### 3.2 Simulated BLE Handshake Progression
1. **Advertising State:** Wearables enter low-power BLE advertising mode.
2. **Discovery & RSSI Evaluation:** The platform measures signal quality (e.g., RSSI $-58\text{ dBm}$, $96\%$ signal fidelity).
3. **Cryptographic Key Exchange:** Generates pairing confirmation with visual progress feedback.
4. **Active Telemetry Handshake:** Confirms streaming capability across heart rate, SpO2, skin temperature, and motion vectors.
5. **Connection Toggle:** Users can disconnect and reconnect devices at any time to test offline recovery handling.
