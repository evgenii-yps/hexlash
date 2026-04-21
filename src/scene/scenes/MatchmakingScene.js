// Epic 3Bb — Matchmaking scene.
// Step 2: scaffold — fog + camera + floor + 8 octagonal walls.
// No terminal, lighting, dust yet (Steps 3-5 populate).
// Source: prototype hexlash_v24.html lines 10385-10426.

import { makeConcreteTexture } from '../materials/concrete.js';

const MM_ROOM_R = 14;
const MM_ROOM_H = 8;

export function buildMatchmakingScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);
  scene.fog = new THREE.FogExp2(0x070811, 0.06);

  // Camera — close-up to the terminal. Step 3 adds slow breath tick.
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 200);
  camera.position.set(0, 1.8, 4.5);
  camera.lookAt(0, 1.5, 0);

  // --- FLOOR (darker than Training/FD — prototype color 0x1a1a20) ---
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(4, 4);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 64),
    new THREE.MeshStandardMaterial({
      map: floorTex, color: 0x1a1a20, roughness: 0.95, metalness: 0.02,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // --- 8 OCTAGONAL WALLS (darker than other sub-scenes — 0x0a0a12) ---
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12, roughness: 0.95,
  });
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2;
    const a2 = ((i + 1) / 8) * Math.PI * 2;
    const x1 = Math.cos(a1) * MM_ROOM_R, z1 = Math.sin(a1) * MM_ROOM_R;
    const x2 = Math.cos(a2) * MM_ROOM_R, z2 = Math.sin(a2) * MM_ROOM_R;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(wallLen, MM_ROOM_H),
      wallMat,
    );
    wall.position.set((x1 + x2) / 2, MM_ROOM_H / 2, (z1 + z2) / 2);
    wall.lookAt(0, MM_ROOM_H / 2, 0);
    scene.add(wall);
  }

  function tick(/* t */) {
    // Step 3 — slow camera breath + dust drift.
    // Step 4 — terminal added.
    // Step 5 — screen texture needsUpdate on content change.
  }

  function dispose() {
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

  return { scene, camera, tick, dispose };
}

export { MM_ROOM_R, MM_ROOM_H };
