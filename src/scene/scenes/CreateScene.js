// Epic 3Bc — Create scene.
// Step 2: scaffold — fog + camera + floor + 8 octagonal walls.
// No lighting, podium, fighter, glow yet (Steps 3-6 populate).
// Source: prototype hexlash_v24.html lines 8857-8910.
//
// Pattern parity with 3Ba TrainingScene.js / 3Bb MatchmakingScene.js —
// same constants-at-top layout, same floor + walls construction, same
// dispose traversal ordering.

import { makeConcreteTexture } from '../materials/concrete.js';

const CR_ROOM_R = 14;
const CR_ROOM_H = 8;
const CR_WALL_SEGMENTS = 8;

const CR_FOG_COLOR = 0x070811;
const CR_FOG_DENSITY = 0.035;

const CR_CAMERA_FOV = 38;
const CR_CAMERA_POS = { x: -1.5, y: 2.4, z: 7.0 };
const CR_CAMERA_LOOKAT = { x: 0, y: 1.6, z: 0 };

const CR_FLOOR_RADIUS = 20;
const CR_FLOOR_SEGMENTS = 64;
const CR_FLOOR_REPEAT = 5;
const CR_FLOOR_COLOR = 0x2c2c34;

const CR_WALL_COLOR = 0x14141c;

export function buildCreateScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CR_FOG_COLOR);
  scene.fog = new THREE.FogExp2(CR_FOG_COLOR, CR_FOG_DENSITY);

  // Camera — off-centre angle so podium + holo fighter (Steps 4-5) read
  // dimensional. Prototype 8860-8862. No orbit — static breath-tick may
  // land in Step 5 if prototype has one.
  const camera = new THREE.PerspectiveCamera(CR_CAMERA_FOV, aspect, 0.1, 200);
  camera.position.set(CR_CAMERA_POS.x, CR_CAMERA_POS.y, CR_CAMERA_POS.z);
  camera.lookAt(CR_CAMERA_LOOKAT.x, CR_CAMERA_LOOKAT.y, CR_CAMERA_LOOKAT.z);

  // --- FLOOR (large concrete, prototype 8866-8880) ---
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(CR_FLOOR_REPEAT, CR_FLOOR_REPEAT);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(CR_FLOOR_RADIUS, CR_FLOOR_SEGMENTS),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      color: CR_FLOOR_COLOR,
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- 8 OCTAGONAL WALLS (prototype 8882-8906) ---
  // Shared material — 8 meshes reuse one MeshStandardMaterial.
  const wallMat = new THREE.MeshStandardMaterial({
    color: CR_WALL_COLOR,
    roughness: 0.95,
  });
  for (let i = 0; i < CR_WALL_SEGMENTS; i++) {
    const a1 = (i / CR_WALL_SEGMENTS) * Math.PI * 2;
    const a2 = ((i + 1) / CR_WALL_SEGMENTS) * Math.PI * 2;
    const x1 = Math.cos(a1) * CR_ROOM_R;
    const z1 = Math.sin(a1) * CR_ROOM_R;
    const x2 = Math.cos(a2) * CR_ROOM_R;
    const z2 = Math.sin(a2) * CR_ROOM_R;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(wallLen, CR_ROOM_H),
      wallMat,
    );
    wall.position.set((x1 + x2) / 2, CR_ROOM_H / 2, (z1 + z2) / 2);
    wall.lookAt(0, CR_ROOM_H / 2, 0);
    scene.add(wall);
  }

  // Step 2 tick = no-op. Step 3 adds dust drift; Step 5 adds holo fighter
  // breathing + sway. Signature kept stable so sceneRegistry.tickAll can
  // call it without conditional guards.
  function tick(/* t */) {}

  function dispose() {
    // Traverse-based disposal — pattern 3Ba/3Bb. Floor texture disposed
    // explicitly because CanvasTexture isn't always caught by mat.map
    // path (safer to keep the separate call).
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
    if (floorTex && floorTex.dispose) floorTex.dispose();
  }

  return { scene, camera, tick, dispose };
}

export { CR_ROOM_R, CR_ROOM_H };
