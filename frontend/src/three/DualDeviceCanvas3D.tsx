import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface DualDeviceCanvas3DProps {
  autoRotate?: boolean;
}

export const DualDeviceCanvas3D: React.FC<DualDeviceCanvas3DProps> = ({ autoRotate = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b132b); // Deep dark navy

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 3;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keyLight.position.set(6, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 2.0);
    rimLight.position.set(-6, -4, -4);
    scene.add(rimLight);

    // Root Group
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // 1. SMART RING (Left position: x = -2.2)
    const ringGroup = new THREE.Group();
    ringGroup.position.set(-2.2, 0.2, 0);
    ringGroup.rotation.x = 0.35;
    ringGroup.rotation.y = -0.4;

    const ringRadius = 1.3;
    const ringGeo = new THREE.CylinderGeometry(ringRadius, ringRadius, 0.65, 48, 1, true);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.22,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringGroup.add(ringMesh);

    // Inner resin
    const ringInnerGeo = new THREE.CylinderGeometry(ringRadius - 0.08, ringRadius - 0.08, 0.62, 48, 1, true);
    const ringInnerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const ringInner = new THREE.Mesh(ringInnerGeo, ringInnerMat);
    ringGroup.add(ringInner);

    // Sensor jewel glow
    const ringLedGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const ringLedMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 2.2
    });
    const ringLed = new THREE.Mesh(ringLedGeo, ringLedMat);
    ringLed.position.set(0, 0, ringRadius - 0.05);
    ringGroup.add(ringLed);

    stageGroup.add(ringGroup);

    // 2. SMARTWATCH (Right position: x = 2.0)
    const watchGroup = new THREE.Group();
    watchGroup.position.set(1.9, 0, 0);
    watchGroup.rotation.x = 0.25;
    watchGroup.rotation.y = 0.3;

    // Watch Chassis
    const watchCaseGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.45, 48);
    const watchCaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
    const watchCase = new THREE.Mesh(watchCaseGeo, watchCaseMat);
    watchGroup.add(watchCase);

    // Watch Face Display
    const watchFaceGeo = new THREE.CircleGeometry(1.48, 48);
    const watchFaceMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.1
    });
    const watchFace = new THREE.Mesh(watchFaceGeo, watchFaceMat);
    watchFace.rotation.x = -Math.PI / 2;
    watchFace.position.y = 0.23;
    watchGroup.add(watchFace);

    // Crown
    const crownGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(1.7, 0.05, 0.3);
    watchGroup.add(crown);

    // Watch Straps
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const strapGeo = new THREE.BoxGeometry(1.2, 0.12, 1.6);
    const topStrap = new THREE.Mesh(strapGeo, strapMat);
    topStrap.position.set(0, -0.05, 1.8);
    watchGroup.add(topStrap);

    const botStrap = new THREE.Mesh(strapGeo, strapMat);
    botStrap.position.set(0, -0.05, -1.8);
    watchGroup.add(botStrap);

    stageGroup.add(watchGroup);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (autoRotate) {
        ringGroup.rotation.y = -0.4 + Math.sin(elapsed * 0.8) * 0.2;
        ringGroup.position.y = 0.2 + Math.sin(elapsed * 1.2) * 0.08;

        watchGroup.rotation.y = 0.3 + Math.cos(elapsed * 0.8) * 0.2;
        watchGroup.position.y = Math.cos(elapsed * 1.2) * 0.08;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [autoRotate]);

  return (
    <div className="relative w-full h-[440px] md:h-[500px] rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-4 left-6 flex items-center gap-2 pointer-events-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
        <span className="text-xs font-mono font-semibold tracking-wider text-sky-400 uppercase">
          Dual Wearable 3D Engineering Preview
        </span>
      </div>
      <div className="absolute bottom-4 inset-x-6 flex justify-between items-center text-xs text-slate-400 font-mono pointer-events-none">
        <span>LEFT: PulseBridge Ring (Titanium / Optical PPG)</span>
        <span>RIGHT: PulseBridge Watch (1.4" AMOLED / 6-Axis IMU)</span>
      </div>
    </div>
  );
};
