import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RING_COMPONENTS, DeviceComponent } from '../types/deviceComponents';

interface RingCanvas3DProps {
  selectedComponentId?: string | null;
  onSelectComponent?: (component: DeviceComponent) => void;
  explodedProgress?: number; // 0 to 1
  autoRotate?: boolean;
  showLabels?: boolean;
  internalView?: boolean;
}

export const RingCanvas3D: React.FC<RingCanvas3DProps> = ({
  selectedComponentId,
  onSelectComponent,
  explodedProgress = 0,
  autoRotate = false,
  showLabels = true,
  internalView = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const componentMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // Deep slate background

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 6.5);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 2;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5); // Cyan-blue key light
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x14b8a6, 1.8); // Teal rim light
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 6. Build Procedural Ring Components
    const rootGroup = new THREE.Group();
    meshGroupRef.current = rootGroup;
    scene.add(rootGroup);

    const ringRadius = 1.6;
    const ringTubeRadius = 0.28;
    const ringWidth = 0.8;

    // Component R01: Outer Titanium Shell
    const outerGeo = new THREE.CylinderGeometry(ringRadius, ringRadius, ringWidth, 64, 1, true);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.88,
      roughness: 0.25,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: internalView ? 0.35 : 1.0
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.userData = { componentId: 'ring-enclosure', canonicalId: 'R01' };
    rootGroup.add(outerMesh);
    componentMeshesRef.current.set('ring-enclosure', outerMesh);

    // R01 Chamfered Edges (Torus rims)
    const rimGeo = new THREE.TorusGeometry(ringRadius, 0.04, 16, 64);
    const rimTop = new THREE.Mesh(rimGeo, outerMat);
    rimTop.rotation.x = Math.PI / 2;
    rimTop.position.y = ringWidth / 2;
    outerMesh.add(rimTop);

    const rimBottom = new THREE.Mesh(rimGeo, outerMat);
    rimBottom.rotation.x = Math.PI / 2;
    rimBottom.position.y = -ringWidth / 2;
    outerMesh.add(rimBottom);

    // Component R02: Inner Structural Resin Layer
    const innerGeo = new THREE.CylinderGeometry(ringRadius - 0.12, ringRadius - 0.12, ringWidth - 0.04, 64, 1, true);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.3,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.userData = { componentId: 'inner-structural-layer', canonicalId: 'R02' };
    rootGroup.add(innerMesh);
    componentMeshesRef.current.set('inner-structural-layer', innerMesh);

    // Component R03: Optical Sensor Window (Sapphire glass lens)
    const windowGeo = new THREE.BoxGeometry(0.35, 0.45, 0.08);
    const windowMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.7
    });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.position.set(0, -ringWidth * 0.1, ringRadius - 0.06);
    windowMesh.userData = { componentId: 'sensor-window', canonicalId: 'R03' };
    rootGroup.add(windowMesh);
    componentMeshesRef.current.set('sensor-window', windowMesh);

    // Component R04: Optical PPG Sensor Array (LEDs + photodiode)
    const ppgGroup = new THREE.Group();
    ppgGroup.position.set(0, -ringWidth * 0.1, ringRadius - 0.02);

    // Green LED (525nm)
    const greenLedGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16);
    const greenLedMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.8
    });
    const greenLed = new THREE.Mesh(greenLedGeo, greenLedMat);
    greenLed.rotation.x = Math.PI / 2;
    greenLed.position.set(-0.09, 0.08, 0);
    ppgGroup.add(greenLed);

    // Red LED (660nm)
    const redLedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8
    });
    const redLed = new THREE.Mesh(greenLedGeo, redLedMat);
    redLed.rotation.x = Math.PI / 2;
    redLed.position.set(-0.09, -0.08, 0);
    ppgGroup.add(redLed);

    // IR LED (940nm)
    const irLedMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 1.4
    });
    const irLed = new THREE.Mesh(greenLedGeo, irLedMat);
    irLed.rotation.x = Math.PI / 2;
    irLed.position.set(-0.09, 0, 0);
    ppgGroup.add(irLed);

    // Photodiode receiver
    const pdGeo = new THREE.BoxGeometry(0.1, 0.22, 0.03);
    const pdMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9, roughness: 0.2 });
    const pdMesh = new THREE.Mesh(pdGeo, pdMat);
    pdMesh.position.set(0.09, 0, 0);
    ppgGroup.add(pdMesh);

    ppgGroup.userData = { componentId: 'ppg-sensor', canonicalId: 'R04' };
    rootGroup.add(ppgGroup);
    componentMeshesRef.current.set('ppg-sensor', ppgGroup);

    // Component R05: Miniature Flexible PCB (Curved substrate band)
    const pcbGeo = new THREE.CylinderGeometry(ringRadius - 0.06, ringRadius - 0.06, ringWidth - 0.15, 48, 1, true, Math.PI * 0.1, Math.PI * 1.8);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide });
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.userData = { componentId: 'miniature-pcb', canonicalId: 'R05' };
    rootGroup.add(pcbMesh);
    componentMeshesRef.current.set('miniature-pcb', pcbMesh);

    // Component R06: Low-Power Microcontroller (Nordic MCU)
    const mcuGeo = new THREE.BoxGeometry(0.24, 0.24, 0.05);
    const mcuMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.4, roughness: 0.6 });
    const mcuMesh = new THREE.Mesh(mcuGeo, mcuMat);
    mcuMesh.position.set(0, 0, -ringRadius + 0.06);
    mcuMesh.userData = { componentId: 'mcu', canonicalId: 'R06' };
    rootGroup.add(mcuMesh);
    componentMeshesRef.current.set('mcu', mcuMesh);

    // Component R07: Rechargeable Curved Battery
    const batGeo = new THREE.CylinderGeometry(ringRadius - 0.07, ringRadius - 0.07, ringWidth - 0.18, 32, 1, true, -Math.PI * 0.4, Math.PI * 0.8);
    const batMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide });
    const batMesh = new THREE.Mesh(batGeo, batMat);
    batMesh.position.x = -0.05;
    batMesh.userData = { componentId: 'battery', canonicalId: 'R07' };
    rootGroup.add(batMesh);
    componentMeshesRef.current.set('battery', batMesh);

    // Component R08: Bluetooth Low Energy Subsystem
    const bleGeo = new THREE.BoxGeometry(0.18, 0.12, 0.04);
    const bleMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.4 });
    const bleMesh = new THREE.Mesh(bleGeo, bleMat);
    bleMesh.position.set(ringRadius - 0.08, 0.1, 0);
    bleMesh.rotation.y = Math.PI / 2;
    bleMesh.userData = { componentId: 'ble-module', canonicalId: 'R08' };
    rootGroup.add(bleMesh);
    componentMeshesRef.current.set('ble-module', bleMesh);

    // Component R09: 3-Axis Accelerometer / IMU
    const imuGeo = new THREE.BoxGeometry(0.12, 0.12, 0.04);
    const imuMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.5 });
    const imuMesh = new THREE.Mesh(imuGeo, imuMat);
    imuMesh.position.set(ringRadius - 0.08, -0.15, 0);
    imuMesh.rotation.y = Math.PI / 2;
    imuMesh.userData = { componentId: 'accelerometer', canonicalId: 'R09' };
    rootGroup.add(imuMesh);
    componentMeshesRef.current.set('accelerometer', imuMesh);

    // Component R10: Skin Temperature Sensor Contact
    const tempGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
    const tempMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const tempMesh = new THREE.Mesh(tempGeo, tempMat);
    tempMesh.position.set(0.35, 0, ringRadius - 0.08);
    tempMesh.rotation.x = Math.PI / 2;
    tempMesh.userData = { componentId: 'temp-sensor', canonicalId: 'R10' };
    rootGroup.add(tempMesh);
    componentMeshesRef.current.set('temp-sensor', tempMesh);

    // Component R11: Magnetic Charging Contacts (Dual pogo contacts)
    const chargeGroup = new THREE.Group();
    const pinGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.95, roughness: 0.15 });

    const pin1 = new THREE.Mesh(pinGeo, pinMat);
    pin1.rotation.x = Math.PI / 2;
    pin1.position.set(-0.35, 0.1, ringRadius - 0.08);
    chargeGroup.add(pin1);

    const pin2 = new THREE.Mesh(pinGeo, pinMat);
    pin2.rotation.x = Math.PI / 2;
    pin2.position.set(-0.35, -0.1, ringRadius - 0.08);
    chargeGroup.add(pin2);

    chargeGroup.userData = { componentId: 'charging-contacts', canonicalId: 'R11' };
    rootGroup.add(chargeGroup);
    componentMeshesRef.current.set('charging-contacts', chargeGroup);

    // 7. Mouse click raycasting for component selection
    const handlePointerDown = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(rootGroup.children, true);

      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && current !== rootGroup) {
          if (current.userData && current.userData.componentId) {
            const comp = RING_COMPONENTS.find(c => c.id === current?.userData.componentId);
            if (comp && onSelectComponent) {
              onSelectComponent(comp);
            }
            break;
          }
          current = current.parent;
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && rootGroup) {
        rootGroup.rotation.y += 0.008;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update exploded view offsets smoothly based on explodedProgress
  useEffect(() => {
    RING_COMPONENTS.forEach(comp => {
      const obj = componentMeshesRef.current.get(comp.id);
      if (obj) {
        const factor = explodedProgress;
        obj.position.x = comp.explosionVector[0] * factor;
        obj.position.y = comp.explosionVector[1] * factor;
        obj.position.z = comp.explosionVector[2] * factor;
      }
    });
  }, [explodedProgress]);

  // Update selection highlight
  useEffect(() => {
    componentMeshesRef.current.forEach((obj, compId) => {
      const isSelected = compId === selectedComponentId;
      obj.traverse(child => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (isSelected) {
            mat.emissive = new THREE.Color(0x38bdf8); // Cyan pulse
            mat.emissiveIntensity = 0.5;
          } else {
            // Restore default
            if (child.userData.defaultEmissive) {
              mat.emissive = child.userData.defaultEmissive;
              mat.emissiveIntensity = child.userData.defaultEmissiveIntensity || 1;
            } else {
              mat.emissive = new THREE.Color(0x000000);
              mat.emissiveIntensity = 0;
            }
          }
        }
      });
    });
  }, [selectedComponentId]);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {/* 3D Viewport Badges */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <span className="bg-slate-900/90 text-sky-400 border border-sky-500/30 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
          Three.js WebGL Engine
        </span>
        <span className="bg-slate-900/90 text-slate-300 border border-slate-700 text-xs px-2.5 py-1 rounded-full font-mono">
          R01-R11 Hierarchy
        </span>
      </div>
      {showLabels && selectedComponentId && (
        <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-sky-500/40 text-slate-100 text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none font-mono">
          Highlighted: <span className="text-sky-400 font-bold">{selectedComponentId}</span>
        </div>
      )}
    </div>
  );
};
