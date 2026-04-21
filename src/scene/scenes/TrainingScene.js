// Epic 3Ba — Training scene.
// Step 2: scaffold — fog + camera + floor + 8 octagonal walls.
// No bag, physics, lighting, particles yet (Steps 3-9 populate).
// Source: prototype hexlash_v24.html lines 9565-9614.

import { makeConcreteTexture } from '../materials/concrete.js';

const TR_ROOM_R = 14;
const TR_ROOM_H = 8;

export function buildTrainingScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);
  scene.fog = new THREE.FogExp2(0x070811, 0.035);

  // Camera — slight off-centre angle so bag (Step 4) reads dimensional.
  // Prototype 9585-9587.
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 200);
  camera.position.set(2.5, 2.0, 5.5);
  camera.lookAt(0, 1.7, 0);

  // --- FLOOR (large concrete) ---
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(5, 5);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({
      map: floorTex, color: 0x2c2c34, roughness: 0.95, metalness: 0.02,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- 8 OCTAGONAL WALLS ---
  // Shared material — 8 meshes reuse one MeshStandardMaterial.
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x14141c, roughness: 0.95,
  });
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2;
    const a2 = ((i + 1) / 8) * Math.PI * 2;
    const x1 = Math.cos(a1) * TR_ROOM_R, z1 = Math.sin(a1) * TR_ROOM_R;
    const x2 = Math.cos(a2) * TR_ROOM_R, z2 = Math.sin(a2) * TR_ROOM_R;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(wallLen, TR_ROOM_H),
      wallMat,
    );
    wall.position.set((x1 + x2) / 2, TR_ROOM_H / 2, (z1 + z2) / 2);
    wall.lookAt(0, TR_ROOM_H / 2, 0);
    scene.add(wall);
  }

  function tick(/* t */) {
    // Step 3 — dust drift here.
    // Step 5 — bagPhysics.applyTick.
    // Step 7a — energy regen.
    // Step 7b — combo timeout + hud sync + hitParticles.tick.
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

export { TR_ROOM_R, TR_ROOM_H };
