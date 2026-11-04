import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MonsterType, Monster } from '../game/types';
import { createMonster, updateMonsterAnimation, flashMonsterHit } from '../game/monsters';
import { RotateCw, Sparkles, Eye, ShieldAlert } from 'lucide-react';

interface Enemy3DViewerProps {
  monsterType: MonsterType;
  className?: string;
}

export const Enemy3DViewer: React.FC<Enemy3DViewerProps> = ({ monsterType, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const monsterRef = useRef<Monster | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const previousPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const modelYaw = useRef<number>(0);
  const modelPitch = useRef<number>(0);

  // Trigger hit reaction
  const handleTriggerHit = useCallback(() => {
    if (monsterRef.current) {
      flashMonsterHit(monsterRef.current);
    }
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Studio Environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Camera adjusted for monster height
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    
    // Balanced 3-point lighting
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc084fc, 1.6);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xe0e7ff, 0x1e1b4b, 1.0);
    scene.add(hemiLight);

    // Soft grounded circular shadow pedestal beneath monster
    const shadowGeo = new THREE.CircleGeometry(2.4, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.01;
    scene.add(shadowMesh);

    // Decorative icy base ring
    const ringGeo = new THREE.RingGeometry(1.9, 2.05, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.02;
    scene.add(ringMesh);

    // Create target monster composite model
    const monster = createMonster('preview_' + monsterType, monsterType, new THREE.Vector3(0, 0, 0));
    monsterRef.current = monster;
    scene.add(monster.group);

    // Frame camera based on monster size
    const isBoss = monsterType === 'boss';
    const isGolem = monsterType === 'golem';
    const targetY = isBoss ? 2.2 : isGolem ? 1.5 : 1.1;
    const camDist = isBoss ? 7.5 : isGolem ? 5.2 : 4.0;
    camera.position.set(0, targetY + 0.4, camDist);
    camera.lookAt(0, targetY, 0);

    // Animation & Render Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    const render = () => {
      frameId = requestAnimationFrame(render);
      const delta = Math.min(0.1, clock.getDelta());

      // Update procedural walk/stomp/flapping animation
      updateMonsterAnimation(monster, delta);

      // Handle auto-rotation
      if (autoRotate && !isDragging) {
        modelYaw.current += delta * 0.7;
      }

      // Apply rotation to monster group
      monster.group.rotation.y = modelYaw.current;
      monster.group.rotation.x = modelPitch.current;

      renderer.render(scene, camera);
    };

    render();

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      scene.remove(monster.group);
      shadowGeo.dispose();
      shadowMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [monsterType, autoRotate, isDragging]);

  // Pointer drag to spin 360°
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    previousPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousPointer.current.x;
    const deltaY = e.clientY - previousPointer.current.y;
    previousPointer.current = { x: e.clientX, y: e.clientY };

    modelYaw.current += deltaX * 0.015;
    modelPitch.current = Math.max(-0.35, Math.min(0.35, modelPitch.current + deltaY * 0.008));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full min-h-[280px] md:min-h-[360px] cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Turntable Action Overlay Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
        {/* Drag Hint */}
        <div className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/60 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 shadow-md">
          <Eye className="w-3 h-3 text-cyan-400" />
          <span>DRAG TO ROTATE 360°</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Test Hit Animation */}
          <button
            onClick={handleTriggerHit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-[11px] font-mono font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            title="Preview snowball impact reaction"
          >
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>HIT REACTION</span>
          </button>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg border text-[11px] font-mono transition-all shadow-sm cursor-pointer ${
              autoRotate
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={autoRotate ? 'Pause Turntable' : 'Resume Auto-Rotate'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin [animation-duration:6s]' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
