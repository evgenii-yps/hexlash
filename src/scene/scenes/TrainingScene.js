// Epic 3Ba — Training scene.
// Step 2: scaffold — fog + camera + floor + 8 octagonal walls.
// No bag, physics, lighting, particles yet (Steps 3-9 populate).
// Source: prototype hexlash_v24.html lines 9565-9614.

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildTrainingBag } from '../objects/trainingBag.js';
import { createBagPhysics } from '../objects/trainingBagPhysics.js';
import { trState } from '../interaction/useTrainingState.js';

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

  // --- LIGHTING (Step 3, prototype 9688-9708) ---
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.45));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));

  // Key spot — overhead onto bag position. renderer.shadowMap.enabled is
  // already set in CanvasLayer (Epic 2 Step 3 hot-fix).
  const key = new THREE.SpotLight(0xfff0e8, 2.6, 14, Math.PI * 0.22, 0.55, 1.4);
  key.position.set(0, 7.5, 0);
  key.target.position.set(0, 1.8, 0);
  key.castShadow = true;
  key.shadow.mapSize.width = 1024;
  key.shadow.mapSize.height = 1024;
  scene.add(key);
  scene.add(key.target);

  // Pink rim from the left.
  const rimL = new THREE.SpotLight(0xff066f, 0.7, 14, Math.PI * 0.4, 0.8, 1.6);
  rimL.position.set(-6, 3, 1);
  rimL.target.position.set(0, 1.5, 0);
  scene.add(rimL);
  scene.add(rimL.target);

  // Cyan rim from the right.
  const rimR = new THREE.SpotLight(0x4dd9ff, 0.4, 14, Math.PI * 0.4, 0.8, 1.6);
  rimR.position.set(6, 3, 1);
  rimR.target.position.set(0, 1.5, 0);
  scene.add(rimR);
  scene.add(rimR.target);

  // --- LIGHT SHAFT (volumetric fake, prototype 9710-9720) ---
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 7, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff0e8, transparent: true, opacity: 0.05,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  shaft.position.set(0, 3.5, 0);
  scene.add(shaft);

  // --- DUST (prototype 9722-9736) ---
  // Training-specific distribution (10×10 square, small warm particles) —
  // distinct from pit/environment.js settings (22×22, cool larger particles).
  const dustCount = 80;
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3]     = (Math.random() - 0.5) * 10;
    dustPos[i * 3 + 1] = Math.random() * 4 + 0.3;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
    color: 0xffd9c8, size: 0.03, transparent: true, opacity: 0.45,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  // --- HEAVY BAG (Step 4) ---
  const bag = buildTrainingBag(THREE);
  scene.add(bag);

  // --- BAG PHYSICS (Step 5) ---
  // Impulse surfaces through the scene API so Step 7a's click-to-hit can
  // push the bag without reaching into physics internals directly.
  const bagPhysics = createBagPhysics(bag);

  function tick(/* t */) {
    const now = performance.now();

    // Energy regen — prototype 10009-10016. `lastEnergyTick` lives in
    // trState so reset/start can seed it; we always update it to keep dt
    // correct even when `active` is false between session restarts.
    const dt = (now - trState.lastEnergyTick) / 1000;
    trState.lastEnergyTick = now;
    if (trState.active && trState.energy < trState.energyMax) {
      trState.energy = Math.min(
        trState.energyMax,
        trState.energy + trState.energyRegen * dt,
      );
    }

    // Dust drift — prototype 10036-10042. Linear upward, reset at y>4.
    const p = dustGeom.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      p[i * 3 + 1] += 0.002;
      if (p[i * 3 + 1] > 4) p[i * 3 + 1] = 0.3;
    }
    dustGeom.attributes.position.needsUpdate = true;

    // Bag pendulum sim — runs every frame, no-op until an impulse lands.
    bagPhysics.applyTick();

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

  return {
    scene, camera, tick, dispose,
    bag,
    applyImpulse: bagPhysics.applyImpulse,
  };
}

export { TR_ROOM_R, TR_ROOM_H };
