import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WATCH_COMPONENTS, DeviceComponent } from '../types/deviceComponents';

interface WatchCanvas3DProps {
  selectedComponentId?: string | null;
  onSelectComponent?: (component: DeviceComponent) => void;
  explodedProgress?: number; // 0 to 1
  autoRotate?: boolean;
  showLabels?: boolean;
  internalView?: boolean;
}

export const WatchCanvas3D: React.FC<WatchCanvas3DProps> = ({
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

  // Function to create a live procedural watch face canvas texture
  const createWatchFaceTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark AMOLED background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 512, 512);

      // Outer bezel ticks
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      for (let i = 0; i < 60; i++) {
        const angle = (i * Math.PI) / 30;
        const x1 = 256 + Math.cos(angle) * 230;
        const y1 = 256 + Math.sin(angle) * 230;
        const x2 = 256 + Math.cos(angle) * (i % 5 === 0 ? 210 : 220);
        const y2 = 256 + Math.sin(angle) * (i % 5 === 0 ? 210 : 220);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Progress rings (Activity, HR, Battery)
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';

      // Cyan Heart Rate Arc
      ctx.strokeStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(256, 256, 185, -Math.PI / 2, Math.PI * 0.4);
      ctx.stroke();

      // Teal Activity Arc
      ctx.strokeStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(256, 256, 165, -Math.PI / 2, Math.PI * 0.7);
      ctx.stroke();

      // Digital Clock Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 74px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('10:42', 256, 240);

      // Date & Vital metric readout
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 28px Inter, sans-serif';
      ctx.fillText('♥ 74 BPM  ·  98% SpO2', 256, 290);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText('MON, NOV 16 · 8,420 STEPS', 256, 335);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 7.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 18;
    controls.minDistance = 2;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.4);
    dirLight1.position.set(6, 10, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x14b8a6, 1.6);
    dirLight2.position.set(-6, -4, -6);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.0, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // 6. Root group
    const rootGroup = new THREE.Group();
    meshGroupRef.current = rootGroup;
    scene.add(rootGroup);

    const caseRadius = 2.0;
    const caseDepth = 0.55;

    // Component W01: Front Display Glass (Sapphire crystal lens)
    const glassGeo = new THREE.CylinderGeometry(caseRadius - 0.05, caseRadius - 0.05, 0.06, 64);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      transparent: true,
      opacity: 0.65
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.y = caseDepth / 2 + 0.05;
    glassMesh.userData = { componentId: 'front-glass', canonicalId: 'W01' };
    rootGroup.add(glassMesh);
    componentMeshesRef.current.set('front-glass', glassMesh);

    // Component W02: AMOLED Display Module (Interactive screen face)
    const displayGeo = new THREE.CircleGeometry(caseRadius - 0.12, 64);
    const displayTex = createWatchFaceTexture();
    const displayMat = new THREE.MeshBasicMaterial({ map: displayTex, side: THREE.DoubleSide });
    const displayMesh = new THREE.Mesh(displayGeo, displayMat);
    displayMesh.rotation.x = -Math.PI / 2;
    displayMesh.position.y = caseDepth / 2 + 0.01;
    displayMesh.userData = { componentId: 'display-module', canonicalId: 'W02' };
    rootGroup.add(displayMesh);
    componentMeshesRef.current.set('display-module', displayMesh);

    // Component W03: Main Chassis Enclosure (CNC aerospace aluminum body)
    const chassisGroup = new THREE.Group();
    const chassisGeo = new THREE.CylinderGeometry(caseRadius, caseRadius, caseDepth, 64);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.28,
      transparent: true,
      opacity: internalView ? 0.4 : 1.0
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisGroup.add(chassisMesh);

    // Chassis Lugs (Top and Bottom)
    const lugGeo = new THREE.BoxGeometry(0.35, caseDepth * 0.9, 0.65);
    const lugTL = new THREE.Mesh(lugGeo, chassisMat);
    lugTL.position.set(-0.9, 0, caseRadius + 0.2);
    chassisGroup.add(lugTL);

    const lugTR = new THREE.Mesh(lugGeo, chassisMat);
    lugTR.position.set(0.9, 0, caseRadius + 0.2);
    chassisGroup.add(lugTR);

    const lugBL = new THREE.Mesh(lugGeo, chassisMat);
    lugBL.position.set(-0.9, 0, -caseRadius - 0.2);
    chassisGroup.add(lugBL);

    const lugBR = new THREE.Mesh(lugGeo, chassisMat);
    lugBR.position.set(0.9, 0, -caseRadius - 0.2);
    chassisGroup.add(lugBR);

    chassisGroup.userData = { componentId: 'chassis-enclosure', canonicalId: 'W03' };
    rootGroup.add(chassisGroup);
    componentMeshesRef.current.set('chassis-enclosure', chassisGroup);

    // Component W04: Main Motherboard PCB
    const pcbGeo = new THREE.CylinderGeometry(caseRadius - 0.2, caseRadius - 0.2, 0.05, 48);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.6, roughness: 0.4 });
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.position.y = 0.05;
    pcbMesh.userData = { componentId: 'main-pcb', canonicalId: 'W04' };
    rootGroup.add(pcbMesh);
    componentMeshesRef.current.set('main-pcb', pcbMesh);

    // Component W05: Main MCU / Processor
    const mcuGeo = new THREE.BoxGeometry(0.5, 0.06, 0.5);
    const mcuMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.6 });
    const mcuMesh = new THREE.Mesh(mcuGeo, mcuMat);
    mcuMesh.position.set(0, 0.1, 0);
    mcuMesh.userData = { componentId: 'main-mcu', canonicalId: 'W05' };
    rootGroup.add(mcuMesh);
    componentMeshesRef.current.set('main-mcu', mcuMesh);

    // Component W06: Multi-Channel Optical PPG Sensor Cluster
    const ppgGroup = new THREE.Group();
    ppgGroup.position.set(0, -caseDepth / 2 - 0.05, 0);

    const rearGlassGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.06, 32);
    const rearGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const rearGlass = new THREE.Mesh(rearGlassGeo, rearGlassMat);
    ppgGroup.add(rearGlass);

    // Circular multi-LED biometric array
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const ledGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
      const ledMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x22c55e : 0xef4444,
        emissive: i % 2 === 0 ? 0x22c55e : 0xef4444,
        emissiveIntensity: 1.8
      });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(Math.cos(angle) * 0.5, -0.04, Math.sin(angle) * 0.5);
      ppgGroup.add(led);
    }

    ppgGroup.userData = { componentId: 'watch-ppg-sensor', canonicalId: 'W06' };
    rootGroup.add(ppgGroup);
    componentMeshesRef.current.set('watch-ppg-sensor', ppgGroup);

    // Component W07: 3-Axis Accelerometer
    const accelGeo = new THREE.BoxGeometry(0.18, 0.05, 0.18);
    const accelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 });
    const accelMesh = new THREE.Mesh(accelGeo, accelMat);
    accelMesh.position.set(-0.7, 0.1, -0.4);
    accelMesh.userData = { componentId: 'watch-accelerometer', canonicalId: 'W07' };
    rootGroup.add(accelMesh);
    componentMeshesRef.current.set('watch-accelerometer', accelMesh);

    // Component W08: 3-Axis Gyroscope
    const gyroMesh = new THREE.Mesh(accelGeo, accelMat);
    gyroMesh.position.set(0.7, 0.1, -0.4);
    gyroMesh.userData = { componentId: 'gyroscope', canonicalId: 'W08' };
    rootGroup.add(gyroMesh);
    componentMeshesRef.current.set('gyroscope', gyroMesh);

    // Component W09: Skin Temperature Sensor Contact
    const tempContactGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    const tempContactMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const tempContactMesh = new THREE.Mesh(tempContactGeo, tempContactMat);
    tempContactMesh.position.set(0, -caseDepth / 2 - 0.08, 0.65);
    tempContactMesh.userData = { componentId: 'watch-temp-sensor', canonicalId: 'W09' };
    rootGroup.add(tempContactMesh);
    componentMeshesRef.current.set('watch-temp-sensor', tempContactMesh);

    // Component W10: BLE Module
    const bleGeo = new THREE.BoxGeometry(0.35, 0.05, 0.25);
    const bleMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.4 });
    const bleMesh = new THREE.Mesh(bleGeo, bleMat);
    bleMesh.position.set(-0.6, 0.1, 0.6);
    bleMesh.userData = { componentId: 'watch-ble-module', canonicalId: 'W10' };
    rootGroup.add(bleMesh);
    componentMeshesRef.current.set('watch-ble-module', bleMesh);

    // Component W11: LDS Molded Antenna
    const antGeo = new THREE.TorusGeometry(caseRadius - 0.08, 0.03, 16, 64, Math.PI * 1.5);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.3 });
    const antMesh = new THREE.Mesh(antGeo, antMat);
    antMesh.rotation.x = Math.PI / 2;
    antMesh.position.y = 0.15;
    antMesh.userData = { componentId: 'antenna', canonicalId: 'W11' };
    rootGroup.add(antMesh);
    componentMeshesRef.current.set('antenna', antMesh);

    // Component W12: Rechargeable Battery Pouch (300mAh)
    const batGeo = new THREE.BoxGeometry(1.4, 0.14, 1.4);
    const batMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.3 });
    const batMesh = new THREE.Mesh(batGeo, batMat);
    batMesh.position.set(0, -0.1, 0);
    batMesh.userData = { componentId: 'watch-battery', canonicalId: 'W12' };
    rootGroup.add(batMesh);
    componentMeshesRef.current.set('watch-battery', batMesh);

    // Component W13: Qi Wireless Charging Coil
    const coilGeo = new THREE.TorusGeometry(0.7, 0.05, 16, 48);
    const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 });
    const coilMesh = new THREE.Mesh(coilGeo, coilMat);
    coilMesh.rotation.x = Math.PI / 2;
    coilMesh.position.set(0, -caseDepth / 2 - 0.02, 0);
    coilMesh.userData = { componentId: 'charging-circuit', canonicalId: 'W13' };
    rootGroup.add(coilMesh);
    componentMeshesRef.current.set('charging-circuit', coilMesh);

    // Component W14: Digital Crown & Multi-Function Side Button
    const crownGroup = new THREE.Group();
    const crownGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.28, 24);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(caseRadius + 0.12, 0.08, 0.4);
    crownGroup.add(crown);

    const buttonGeo = new THREE.BoxGeometry(0.12, 0.18, 0.45);
    const button = new THREE.Mesh(buttonGeo, crownMat);
    button.position.set(caseRadius + 0.04, 0.08, -0.4);
    crownGroup.add(button);

    crownGroup.userData = { componentId: 'side-button', canonicalId: 'W14' };
    rootGroup.add(crownGroup);
    componentMeshesRef.current.set('side-button', crownGroup);

    // Component W15: Silicone Fluoroelastomer Strap (Top & Bottom)
    const strapGroup = new THREE.Group();
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.1 });

    const topStrapGeo = new THREE.BoxGeometry(1.6, 0.16, 2.2);
    const topStrap = new THREE.Mesh(topStrapGeo, strapMat);
    topStrap.position.set(0, -0.05, caseRadius + 1.2);
    strapGroup.add(topStrap);

    const botStrap = new THREE.Mesh(topStrapGeo, strapMat);
    botStrap.position.set(0, -0.05, -caseRadius - 1.2);
    strapGroup.add(botStrap);

    strapGroup.userData = { componentId: 'strap', canonicalId: 'W15' };
    rootGroup.add(strapGroup);
    componentMeshesRef.current.set('strap', strapGroup);

    // 7. Click raycasting for selection
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
            const comp = WATCH_COMPONENTS.find(c => c.id === current?.userData.componentId);
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
        rootGroup.rotation.y += 0.006;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Listener
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

  // Update exploded view positions smoothly based on explodedProgress
  useEffect(() => {
    WATCH_COMPONENTS.forEach(comp => {
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
            mat.emissive = new THREE.Color(0x38bdf8);
            mat.emissiveIntensity = 0.55;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });
    });
  }, [selectedComponentId]);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <span className="bg-slate-900/90 text-sky-400 border border-sky-500/30 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
          Three.js WebGL Engine
        </span>
        <span className="bg-slate-900/90 text-slate-300 border border-slate-700 text-xs px-2.5 py-1 rounded-full font-mono">
          W01-W15 Architecture
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
