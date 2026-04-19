// Epic 3A — Fight scene.
// Step 9: scaffold — ring platform + outer floor + octagonal walls.
// No posts, ropes, lights, shaft or fighters yet (those arrive in Steps 10-11).
// playMove / setCamMode / getState / resetFight are stubbed out; filled in
// Steps 12-16 (animation system, camera modes, state machine).
//
// Source: prototype hexlash_v24.html lines 8082-8140 (scaffold + platform +
// floor), 8181-8198 (walls).

import { makeConcreteTexture } from '../materials/concrete.js';
import { makeMetalTexture } from '../materials/metal.js';

const FT_RING_R = 3.6;
const FT_RING_H = 0.5;
const FT_POST_H = 2.3;
const FT_ROOM_R = 14;
const FT_ROOM_H = 8;
const FT_ROPE_HS = [0.55, 1.15, 1.75];

export function buildFightScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);
  scene.fog = new THREE.FogExp2(0x070811, 0.030);

  // Camera position is driven by updateFightCamera from Step 13 (pit/side/
  // cinema modes). Until then this default keeps the empty ring framed.
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 200);
  camera.position.set(0, 4, 9);
  camera.lookAt(0, 1, 0);

  // --- RING VERTICES ---
  // Shared with posts (Step 10) + rope segments (Step 10) — kept in closure
  // so those steps don't have to recompute vertices.
  const ftVerts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    ftVerts.push(new THREE.Vector2(Math.cos(a) * FT_RING_R, Math.sin(a) * FT_RING_R));
  }

  // --- RING PLATFORM (extruded octagon with bevel) ---
  const platformShape = new THREE.Shape();
  ftVerts.forEach((v, i) => {
    if (i === 0) platformShape.moveTo(v.x, v.y);
    else platformShape.lineTo(v.x, v.y);
  });
  platformShape.closePath();
  const platformGeom = new THREE.ExtrudeGeometry(platformShape, {
    depth: FT_RING_H,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  platformGeom.rotateX(-Math.PI / 2);

  const ftPlatformTex = makeConcreteTexture(THREE);
  const platform = new THREE.Mesh(
    platformGeom,
    new THREE.MeshStandardMaterial({
      map: ftPlatformTex, color: 0xb8b8c0, roughness: 0.92, metalness: 0.05,
    })
  );
  platform.receiveShadow = true;
  scene.add(platform);

  // --- OUTER FLOOR ---
  // Separate texture instance — repeat mutates shared state (PATCH Epic 2).
  const ftFloorTex = makeConcreteTexture(THREE);
  ftFloorTex.repeat.set(4, 4);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(16, 64),
    new THREE.MeshStandardMaterial({
      map: ftFloorTex, color: 0x2c2c34, roughness: 0.95, metalness: 0.02,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- ROOM WALLS (octagonal, dim) ---
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x14141c, roughness: 0.95,
  });
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2;
    const a2 = ((i + 1) / 8) * Math.PI * 2;
    const x1 = Math.cos(a1) * FT_ROOM_R, z1 = Math.sin(a1) * FT_ROOM_R;
    const x2 = Math.cos(a2) * FT_ROOM_R, z2 = Math.sin(a2) * FT_ROOM_R;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(wallLen, FT_ROOM_H),
      wallMat
    );
    wall.position.set((x1 + x2) / 2, FT_ROOM_H / 2, (z1 + z2) / 2);
    wall.lookAt(0, FT_ROOM_H / 2, 0);
    scene.add(wall);
  }

  // --- POSTS + CAPS (prototype 8142-8162) ---
  // Cap material is matte — metal (post) picks up pink rim which looked wrong
  // on the spherical cap, so it gets its own non-metallic material.
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x4a4d58, roughness: 0.4, metalness: 0.85,
    map: makeMetalTexture(THREE),
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22, roughness: 0.95, metalness: 0.0,
  });
  for (const v of ftVerts) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, FT_POST_H, 16),
      postMat
    );
    post.position.set(v.x, FT_RING_H + FT_POST_H / 2, v.y);
    post.castShadow = true;
    scene.add(post);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.10, 16, 12),
      capMat
    );
    cap.position.set(v.x, FT_RING_H + FT_POST_H, v.y);
    scene.add(cap);
  }

  // --- ROPES (3 levels × 8 sides = 24 segments, prototype 8163-8179) ---
  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22, roughness: 0.6, metalness: 0.3,
  });
  for (let i = 0; i < 8; i++) {
    const a = ftVerts[i];
    const b = ftVerts[(i + 1) % 8];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    for (const h of FT_ROPE_HS) {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, len, 8),
        ropeMat
      );
      rope.position.set((a.x + b.x) / 2, FT_RING_H + h, (a.y + b.y) / 2);
      rope.lookAt(b.x, FT_RING_H + h, b.y);
      rope.rotateX(Math.PI / 2);
      scene.add(rope);
    }
  }

  // --- LIGHTING (prototype 8200-8220) ---
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.40));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));

  const key = new THREE.SpotLight(0xfff0e8, 2.4, 16, Math.PI * 0.25, 0.55, 1.4);
  key.position.set(0, 8, 0);
  key.target.position.set(0, 1.2, 0);
  key.castShadow = true;
  key.shadow.mapSize.width = 1024;
  key.shadow.mapSize.height = 1024;
  scene.add(key);
  scene.add(key.target);

  const rimL = new THREE.SpotLight(0xff066f, 0.9, 14, Math.PI * 0.4, 0.8, 1.6);
  rimL.position.set(-7, 3, -2);
  rimL.target.position.set(0, 1.5, 0);
  scene.add(rimL);
  scene.add(rimL.target);

  const rimR = new THREE.SpotLight(0xD4A843, 0.6, 14, Math.PI * 0.4, 0.8, 1.6);
  rimR.position.set(7, 3, 2);
  rimR.target.position.set(0, 1.5, 0);
  scene.add(rimR);
  scene.add(rimR.target);

  // --- LIGHT SHAFT (volumetric fake, prototype 8223-8232) ---
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 8, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff0e8, transparent: true, opacity: 0.05,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  shaft.position.set(0, 4, 0);
  scene.add(shaft);

  function tick(/* t */) {
    // Step 13 — updateFightCamera(t) here (pit/side/cinema modes).
    // Step 12 — tickAnims(); idle fallback via tickIdleAnimations when idle.
    // Step 11 — fighters added; register idle via fighterModel.
  }

  // Stubs — filled in later steps.
  function playMove(/* side, type */) {}
  function setCamMode(/* mode */) {}
  function getState() { return null; }
  function resetFight() {}

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
    scene,
    camera,
    tick,
    playMove,
    setCamMode,
    getState,
    resetFight,
    dispose,
    // Shared with posts/ropes in Step 10.
    ftVerts,
  };
}

export { FT_RING_R, FT_RING_H, FT_POST_H, FT_ROOM_R, FT_ROOM_H };
