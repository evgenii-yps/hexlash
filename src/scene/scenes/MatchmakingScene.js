// Epic 3Bb — Matchmaking scene.
// Step 2: scaffold — fog + camera + floor + 8 octagonal walls.
// No terminal, lighting, dust yet (Steps 3-5 populate).
// Source: prototype hexlash_v24.html lines 10385-10426.

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildMatchmakingTerminal } from '../objects/matchmakingTerminal.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';

const MM_ROOM_R = 14;
const MM_ROOM_H = 8;

export function buildMatchmakingScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);

  // Camera — close-up to the terminal. Step 3 adds slow breath tick.
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 200);
  camera.position.set(0, 1.8, 4.5);
  camera.lookAt(0, 1.5, 0);

  // --- FLOOR + WALLS + FOG via shared helper (Sub-Epic 5A Step 2) ---
  // Darker than Training/FD (floor 0x1a1a20, walls 0x0a0a12) and thicker
  // fog (0.06 vs 0.035) for the cyber-terminal mood. Scene-owned materials:
  // concrete-texture repeat is shared state per materials/concrete.js note.
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(4, 4);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTex, color: 0x1a1a20, roughness: 0.95, metalness: 0.02,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a12, roughness: 0.95,
  });
  buildOctagonalRoom(THREE, scene, {
    R: MM_ROOM_R, H: MM_ROOM_H,
    floorRadius: 18,
    floorMaterial, wallMaterial,
    fogDensity: 0.06,
  });

  // --- LIGHTING (Step 3, prototype 10499-10512) ---
  // Note: key is CYAN, not warm — terminal/monitor-glow aesthetic.
  // No shaft here (prototype has none). No castShadow on key (prototype
  // doesn't set it either — do not copy from Training).
  scene.add(new THREE.AmbientLight(0x141420, 0.4));

  const key = new THREE.SpotLight(0x00E5C8, 1.8, 10, Math.PI * 0.35, 0.7, 1.4);
  key.position.set(0, 4, 2.5);
  key.target.position.set(0, 1.5, 0);
  scene.add(key);
  scene.add(key.target);

  const rimL = new THREE.SpotLight(0xff066f, 0.45, 10, Math.PI * 0.4, 0.8, 1.6);
  rimL.position.set(-4, 2, 0);
  rimL.target.position.set(0, 1.4, 0);
  scene.add(rimL);
  scene.add(rimL.target);

  const rimR = new THREE.SpotLight(0xD4A843, 0.35, 10, Math.PI * 0.4, 0.8, 1.6);
  rimR.position.set(4, 2, 0);
  rimR.target.position.set(0, 1.4, 0);
  scene.add(rimR);
  scene.add(rimR.target);

  // --- DUST (prototype 10514-10528) ---
  // 40 cyan particles (half of training's 80), 8×6 distribution, z shifted
  // back by 1. Slower drift than Training (0.0015 vs 0.002), reset at y>3.5.
  const dustCount = 40;
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3]     = (Math.random() - 0.5) * 8;
    dustPos[i * 3 + 1] = Math.random() * 3 + 0.3;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
    color: 0x00E5C8, size: 0.025, transparent: true, opacity: 0.35,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  // --- TERMINAL (Step 4) ---
  // Exposes screenCanvas/screenCtx/screenTex so Step 5's useMatchmakingScreen
  // can draw the typeLog animation into the CRT surface.
  const terminal = buildMatchmakingTerminal(THREE);
  scene.add(terminal.group);

  function tick(t) {
    // Slow camera breath — prototype 10835-10838. Tiny sin-based drift so
    // the terminal feels alive without an orbit.
    camera.position.x = Math.sin(t * 0.1) * 0.15;
    camera.position.y = 1.7 + Math.sin(t * 0.2) * 0.03;
    camera.position.z = 4.4 + Math.sin(t * 0.08) * 0.15;
    camera.lookAt(0, 1.5, 0);

    // Dust drift — prototype 10841-10846. Linear upward, reset at y>3.5.
    const p = dustGeom.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      p[i * 3 + 1] += 0.0015;
      if (p[i * 3 + 1] > 3.5) p[i * 3 + 1] = 0.3;
    }
    dustGeom.attributes.position.needsUpdate = true;

    // Step 4 — terminal (no per-frame work beyond dust+breath).
    // Step 5 — screen texture needsUpdate handled in state watchers.
  }

  function dispose() {
    // CanvasTexture isn't always caught by scene.traverse (shared across
    // materials, rebuilt lazily). Dispose explicitly first — pattern
    // symmetric to Training.dispose with hitParticles.dispose().
    if (terminal.screenTex) terminal.screenTex.dispose();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      const m = obj.material;
      if (m) {
        const mats = Array.isArray(m) ? m : [m];
        for (const mat of mats) {
          if (mat.map) mat.map.dispose();
          if (mat.dispose) mat.dispose();
        }
      }
    });
  }

  return {
    scene, camera, tick, dispose,
    screenCanvas: terminal.screenCanvas,
    screenCtx: terminal.screenCtx,
    screenTex: terminal.screenTex,
  };
}

export { MM_ROOM_R, MM_ROOM_H };
