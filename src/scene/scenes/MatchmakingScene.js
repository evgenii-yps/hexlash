// Epic 3Bb — Matchmaking scene.
// Step 2: scaffold — fog + camera + floor + 8 octagonal walls.
// No terminal, lighting, dust yet (Steps 3-5 populate).
// Source: prototype hexlash_v24.html lines 10385-10426.

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildMatchmakingTerminal } from '../objects/matchmakingTerminal.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';
import { createDustField } from '../objects/dustField.js';

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

  // --- DUST via shared helper (Sub-Epic 5A Step 5) ---
  // 40 cyan particles (half of Training's 80), asymmetric 8×6 distribution
  // (xRadius=4 / zRadius=3) with z shifted back by 1 to live behind the
  // CRT terminal. Slower drift than Training (0.0015 vs 0.002), reset at
  // y>3.5. yInitSpread=3 preserved explicitly (default yMax-yMin=3.2
  // would cost 0.2 units of initial Y range).
  const dust = createDustField(THREE, {
    count: 40,
    xRadius: 4,
    zRadius: 3,
    zOffset: -1,
    yMax: 3.5,
    yInitSpread: 3,
    driftSpeed: 0.0015,
    color: 0x00E5C8,
    size: 0.025,
    opacity: 0.35,
  });
  scene.add(dust.group);

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

    // Dust drift — delegated to helper (prototype 10841-10846 equivalent).
    dust.tick();

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
