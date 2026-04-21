// Epic 3Bc — Create scene.
// Step 2: scaffold — fog + camera + floor + 8 octagonal walls.
// No lighting, podium, fighter, glow yet (Steps 3-6 populate).
// Source: prototype hexlash_v24.html lines 8857-8910.
//
// Pattern parity with 3Ba TrainingScene.js / 3Bb MatchmakingScene.js —
// same constants-at-top layout, same floor + walls construction, same
// dispose traversal ordering.

import { makeConcreteTexture } from '../materials/concrete.js';
import { createPodium } from '../objects/createPodium.js';

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

// --- LIGHTING (prototype 8986-8999) ---
const CR_AMBIENT_COLOR = 0x1a1a28;
const CR_AMBIENT_INTENSITY = 0.4;
const CR_HEMI_SKY = 0x2a2638;
const CR_HEMI_GROUND = 0x0a0a12;
const CR_HEMI_INTENSITY = 0.4;
// Key — overhead warm spot, casts shadows onto podium.
const CR_KEY_COLOR = 0xfff0e8;
const CR_KEY_INTENSITY = 2.2;
const CR_KEY_DISTANCE = 14;
const CR_KEY_ANGLE = Math.PI * 0.22;
const CR_KEY_PENUMBRA = 0.55;
const CR_KEY_DECAY = 1.4;
const CR_KEY_POS = { x: 0, y: 7.5, z: 0 };
const CR_KEY_TARGET = { x: 0, y: 1.2, z: 0 };
const CR_KEY_SHADOW_SIZE = 1024;
// Front — cyan fill from camera side, rounds out the fighter front face.
const CR_FRONT_COLOR = 0x4dd9ff;
const CR_FRONT_INTENSITY = 0.4;
const CR_FRONT_DISTANCE = 12;
const CR_FRONT_ANGLE = Math.PI * 0.5;
const CR_FRONT_PENUMBRA = 0.9;
const CR_FRONT_DECAY = 1.4;
const CR_FRONT_POS = { x: 0, y: 2.5, z: 7 };
const CR_FRONT_TARGET = { x: 0, y: 1.4, z: 0 };
// NOTE: prototype 8986-8999 has NO rim-right spot. Unlike Training (which
// adds pink rimL + cyan rimR) Create uses Key+Front only. Confirmed by
// direct grep — no additional SpotLight between crFront and crShaft.

// --- SHAFT (volumetric fake, prototype 9001-9011) ---
const CR_SHAFT_RADIUS = 1.5;
const CR_SHAFT_HEIGHT = 7;
const CR_SHAFT_SEGMENTS = 24;
const CR_SHAFT_OPACITY = 0.05;
const CR_SHAFT_POS = { x: 0, y: 3.5, z: 0 };

// --- DUST (prototype 9013-9027, tick 9309-9314) ---
const CR_DUST_COUNT = 80;
const CR_DUST_XZ_BOUND = 10;    // (rand-0.5) * 10 → ±5 spread
const CR_DUST_Y_RANGE = 4;      // rand * 4 + 0.3
const CR_DUST_Y_BASE = 0.3;
const CR_DUST_Y_CEIL = 4;       // reset threshold
const CR_DUST_COLOR = 0xffd9c8;
const CR_DUST_SIZE = 0.03;
const CR_DUST_OPACITY = 0.45;
const CR_DUST_DRIFT = 0.002;

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

  // --- LIGHTING (prototype 8986-8999) ---
  scene.add(new THREE.AmbientLight(CR_AMBIENT_COLOR, CR_AMBIENT_INTENSITY));
  scene.add(new THREE.HemisphereLight(
    CR_HEMI_SKY, CR_HEMI_GROUND, CR_HEMI_INTENSITY,
  ));

  const key = new THREE.SpotLight(
    CR_KEY_COLOR, CR_KEY_INTENSITY, CR_KEY_DISTANCE,
    CR_KEY_ANGLE, CR_KEY_PENUMBRA, CR_KEY_DECAY,
  );
  key.position.set(CR_KEY_POS.x, CR_KEY_POS.y, CR_KEY_POS.z);
  key.target.position.set(CR_KEY_TARGET.x, CR_KEY_TARGET.y, CR_KEY_TARGET.z);
  key.castShadow = true;
  key.shadow.mapSize.width = CR_KEY_SHADOW_SIZE;
  key.shadow.mapSize.height = CR_KEY_SHADOW_SIZE;
  scene.add(key);
  scene.add(key.target);

  const front = new THREE.SpotLight(
    CR_FRONT_COLOR, CR_FRONT_INTENSITY, CR_FRONT_DISTANCE,
    CR_FRONT_ANGLE, CR_FRONT_PENUMBRA, CR_FRONT_DECAY,
  );
  front.position.set(CR_FRONT_POS.x, CR_FRONT_POS.y, CR_FRONT_POS.z);
  front.target.position.set(
    CR_FRONT_TARGET.x, CR_FRONT_TARGET.y, CR_FRONT_TARGET.z,
  );
  scene.add(front);
  scene.add(front.target);

  // --- SHAFT (volumetric fake, prototype 9001-9011) ---
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(
      CR_SHAFT_RADIUS, CR_SHAFT_HEIGHT, CR_SHAFT_SEGMENTS, 1, true,
    ),
    new THREE.MeshBasicMaterial({
      color: CR_KEY_COLOR,
      transparent: true,
      opacity: CR_SHAFT_OPACITY,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  shaft.position.set(CR_SHAFT_POS.x, CR_SHAFT_POS.y, CR_SHAFT_POS.z);
  scene.add(shaft);

  // --- PODIUM (prototype 8912-8931) ---
  // Solid concrete-textured disc + brushed metal ring. Kept in closure so
  // Step 5 can parent the holo fighter to it and Step 6 can attach the
  // archetype glow disc + PointLight under it.
  const podium = createPodium(THREE);
  scene.add(podium);

  // --- DUST (prototype 9013-9027) ---
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(CR_DUST_COUNT * 3);
  for (let i = 0; i < CR_DUST_COUNT; i++) {
    dustPos[i * 3]     = (Math.random() - 0.5) * CR_DUST_XZ_BOUND;
    dustPos[i * 3 + 1] = Math.random() * CR_DUST_Y_RANGE + CR_DUST_Y_BASE;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * CR_DUST_XZ_BOUND;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
    color: CR_DUST_COLOR,
    size: CR_DUST_SIZE,
    transparent: true,
    opacity: CR_DUST_OPACITY,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  // Step 3 tick — dust drift (prototype 9309-9314). Linear upward drift,
  // reset to base Y when a particle exits the ceiling. X/Z preserved so
  // the column of motes stays visually consistent within the shaft beam.
  function tick(/* t */) {
    const p = dustGeom.attributes.position.array;
    for (let i = 0; i < CR_DUST_COUNT; i++) {
      p[i * 3 + 1] += CR_DUST_DRIFT;
      if (p[i * 3 + 1] > CR_DUST_Y_CEIL) p[i * 3 + 1] = CR_DUST_Y_BASE;
    }
    dustGeom.attributes.position.needsUpdate = true;
  }

  function dispose() {
    // Traverse-based disposal — pattern 3Ba/3Bb. Covers walls, floor,
    // shaft (Mesh), dust (Points — also has geometry+material). Explicit
    // extras below for defensive clarity (symmetric to 3Bb screenTex).
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
    // Floor texture (CanvasTexture shared via mat.map) — traverse already
    // handles it via `if (mat.map)`, but kept explicit since concrete is
    // a procedurally generated canvas that can drift off the mesh path.
    if (floorTex && floorTex.dispose) floorTex.dispose();
    // Dust geometry/material — already disposed by traverse (Points has
    // both), listed here so future edits to tick/materialize can't leak.
    if (dustGeom && dustGeom.dispose) dustGeom.dispose();
    if (dust && dust.material && dust.material.dispose) dust.material.dispose();
  }

  return {
    scene,
    camera,
    tick,
    dispose,
    // Exposed for Steps 5-6: holo fighter parents to podium, archetype
    // glow disc + PointLight attach under it. Underscore prefix keeps
    // the public surface (scene/camera/tick/dispose) distinct from
    // internal refs.
    _podium: podium,
  };
}

export { CR_ROOM_R, CR_ROOM_H };
