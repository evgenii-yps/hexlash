// Epic 3A — Fighter Detail scene.
// Step 2: scaffold — floor, walls, podium. No fighter, columns, lights, dust yet.
// Source: prototype hexlash_v24.html lines 7370-7445.
//
// Populated across:
//   - Step 2: scaffold (this file).
//   - Step 3: lighting, dust, light shaft.
//   - Step 4: fighter on podium (setKey).
//   - Step 5: branch columns + floor discs.
//   - Step 6: orbit camera tick.
//   - Step 7: picker for columns.

import { makeConcreteTexture } from '../materials/concrete.js';
import {
  makeFighterLowPoly,
  registerIdleFighter,
  unregisterIdleFighter,
  tickIdleAnimations,
  addArchetypeGlow,
} from '../objects/fighterModel.js';
import { buildBranchColumn } from '../objects/branchColumn.js';
import { createPicker } from '../interaction/raycaster.js';

const FD_ROOM_R = 14;
const FD_ROOM_H = 8;

// Archetype glow colors under fighter's feet.
const GLOW_COLOR = {
  warden:   0xD4A843, // gold
  predator: 0xFF066F, // neon pink
};

// Branch pillars behind the podium. Fighter at z=+1.0, columns at z∈[-2.4,-1.6].
// Source: prototype 7462-7471.
const FD_BRANCHES = [
  { id: 'speed',     name: 'Speed',     color: 0x00E5FF, level: 6,  x: -3.0, z: -1.6 },
  { id: 'power',     name: 'Power',     color: 0xFF066F, level: 10, x:  0.0, z: -2.4 },
  { id: 'technique', name: 'Technique', color: 0xA855F7, level: 4,  x:  3.0, z: -1.6 },
];
const COL = { COL_R: 0.32, COL_BASE_H: 0.5, COL_PER_LVL: 0.18 };

export function buildFighterDetailScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);
  scene.fog = new THREE.FogExp2(0x070811, 0.035);

  const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 200);
  camera.position.set(0, 2.4, 7.0);
  camera.lookAt(0, 1.6, 0);

  // --- FLOOR (large, concrete) ---
  // Separate texture instance — repeat.set mutates shared state (see PATCH Step 6).
  const fdFloorTex = makeConcreteTexture(THREE);
  fdFloorTex.repeat.set(5, 5);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({
      map: fdFloorTex, color: 0x2c2c34, roughness: 0.95, metalness: 0.02,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- ROOM walls (octagonal, dim) ---
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x14141c, roughness: 0.95, metalness: 0.0,
  });
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2;
    const a2 = ((i + 1) / 8) * Math.PI * 2;
    const x1 = Math.cos(a1) * FD_ROOM_R, z1 = Math.sin(a1) * FD_ROOM_R;
    const x2 = Math.cos(a2) * FD_ROOM_R, z2 = Math.sin(a2) * FD_ROOM_R;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(wallLen, FD_ROOM_H),
      wallMat
    );
    wall.position.set((x1 + x2) / 2, FD_ROOM_H / 2, (z1 + z2) / 2);
    wall.lookAt(0, FD_ROOM_H / 2, 0);
    scene.add(wall);
  }

  // --- PODIUM (low concrete disc + metal ring) ---
  // Separate concrete texture — not the floor's (different repeat state).
  const fdPodiumTex = makeConcreteTexture(THREE);
  const podium = new THREE.Group();
  const podiumDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.5, 0.30, 32),
    new THREE.MeshStandardMaterial({
      map: fdPodiumTex, color: 0xa8a8b0, roughness: 0.9, metalness: 0.05,
    })
  );
  podiumDisc.position.y = 0.15;
  podiumDisc.receiveShadow = true;
  podiumDisc.castShadow = true;
  podium.add(podiumDisc);

  const podiumRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.022, 8, 64),
    new THREE.MeshStandardMaterial({
      color: 0x4a4d58, roughness: 0.4, metalness: 0.85,
    })
  );
  podiumRing.rotation.x = Math.PI / 2;
  podiumRing.position.y = 0.30;
  podium.add(podiumRing);

  podium.position.z = 1.0; // bring fighter forward of future columns
  scene.add(podium);

  // --- BRANCH COLUMNS (Step 5) ---
  // Source: prototype 7472-7543. Fighter is at z=+1.0; columns sit BEHIND him
  // at z∈[-2.4, -1.6]. From camera POV (z=+7) fighter is foreground, columns
  // mid-ground. Each column is a self-contained Group; its root carries
  // userData.branchId so the picker (Step 7) can resolve a click.
  const fdBranchColumns = [];
  for (const b of FD_BRANCHES) {
    const col = buildBranchColumn(THREE, b, COL);
    scene.add(col.group);
    fdBranchColumns.push({ group: col.group, branch: b, height: col.height });
  }
  const clickableTargets = fdBranchColumns.map((c) => c.group);
  // Step 7 — picker lives with the scene; CanvasLayer uses it via registry.
  const picker = createPicker(camera, clickableTargets, THREE);

  // --- LIGHTING (Step 3) ---
  // Source: prototype 7546-7565.
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.4));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));

  // Key spot — overhead, on fighter. renderer.shadowMap.enabled is set in
  // CanvasLayer (Epic 2 Step 3 hot-fix).
  const key = new THREE.SpotLight(0xfff0e8, 2.4, 14, Math.PI * 0.22, 0.6, 1.4);
  key.position.set(0, 7.5, 0);
  key.target.position.set(0, 1.2, 0);
  key.castShadow = true;
  key.shadow.mapSize.width = 1024;
  key.shadow.mapSize.height = 1024;
  scene.add(key);
  scene.add(key.target);

  // Front fill — soft cyan rim from camera side.
  const front = new THREE.SpotLight(0x4dd9ff, 0.5, 12, Math.PI * 0.5, 0.9, 1.4);
  front.position.set(0, 2.5, 7);
  front.target.position.set(0, 1.4, 0);
  scene.add(front);
  scene.add(front.target);

  // --- LIGHT SHAFT (volumetric fake, Step 3) ---
  // Source: prototype 7567-7577.
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 7, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff0e8, transparent: true, opacity: 0.05,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  shaft.position.set(0, 3.5, 0);
  scene.add(shaft);

  // --- DUST (Step 3) ---
  // Source: prototype 7579-7592. 80 particles, upward drift in tick.
  const dustCount = 80;
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3]     = (Math.random() - 0.5) * 10;
    dustPos[i * 3 + 1] = Math.random() * 4 + 0.3;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
    color: 0xffd9c8, size: 0.025, transparent: true, opacity: 0.45,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  // Step 4 — fighter swap state. Tracked in closure so tick() and setKey()
  // share a single source of truth; dispose() clears the idle registry entry.
  let currentFighter = null;
  let currentGlow = null;

  function disposeObject3D(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (m) {
        const mats = Array.isArray(m) ? m : [m];
        for (const mat of mats) {
          if (mat.map) mat.map.dispose();
          if (mat.dispose) mat.dispose();
        }
      }
    });
  }

  function setKey(key) {
    // Tear down previous fighter + glow (ТЗ Step 4).
    // unregisterIdleFighter must run BEFORE dispose so fighterModel's global
    // idle registry doesn't hold a reference to a disposed Group.
    if (currentFighter) {
      unregisterIdleFighter(podium);
      podium.remove(currentFighter);
      disposeObject3D(currentFighter);
      currentFighter = null;
    }
    if (currentGlow) {
      podium.remove(currentGlow);
      disposeObject3D(currentGlow);
      currentGlow = null;
    }

    // Build new fighter + glow.
    // Source: prototype 7441-7448.
    const fighter = makeFighterLowPoly(THREE, key);
    fighter.position.y = 0.30;
    podium.add(fighter);
    registerIdleFighter(podium, 0.7);

    const color = GLOW_COLOR[key] ?? GLOW_COLOR.warden;
    addArchetypeGlow(podium, THREE, color);

    currentFighter = fighter;
    // addArchetypeGlow tags the disc with userData.isArchGlow — find it to
    // keep a dispose handle for the next swap.
    currentGlow = podium.children.find((c) => c.userData && c.userData.isArchGlow) || null;
  }

  function tick(t) {
    // Dust drift — prototype 8040-8046. Linear upward, reset at y>4.
    const p = dustGeom.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      p[i * 3 + 1] += 0.002;
      if (p[i * 3 + 1] > 4) p[i * 3 + 1] = 0.3;
    }
    dustGeom.attributes.position.needsUpdate = true;

    // Outer fighter sway — prototype 8017-8021. Whole-body sway applied on
    // top of any per-part idle. Per-part idle is a no-op for the FD podium
    // wrapper (podium.children[0] is podiumDisc, not a fighter group), so the
    // prototype effectively relies on this outer sway as the sole motion.
    if (currentFighter) {
      currentFighter.position.y = 0.30 + Math.sin(t * 1.2) * 0.012;
      currentFighter.rotation.y = Math.sin(t * 0.5) * 0.06;
    }

    // Column emissive pulse — prototype 8030-8037. Only shafts visibly pulse
    // (other materials have no emissive or emissive=0).
    for (let i = 0; i < fdBranchColumns.length; i++) {
      const children = fdBranchColumns[i].group.children;
      for (const ch of children) {
        const m = ch.material;
        if (m && m.emissive !== undefined && m.emissiveIntensity !== undefined) {
          m.emissiveIntensity = 0.40 + Math.sin(t * 1.2 + i * 1.7) * 0.10;
        }
      }
    }

    // Column hover-scale lerp — prototype 8023-8029. CanvasLayer writes
    // userData.hoverScale (1.0 idle, 1.06 on hover), this lerps toward it.
    for (const c of fdBranchColumns) {
      const target = c.group.userData.hoverScale || 1.0;
      const cur = c.group.scale.x;
      const next = cur + (target - cur) * 0.15;
      c.group.scale.set(next, next, next);
    }

    // Advance the global idle registry. Harmless even when pit scene is
    // inactive — pit fighters' transforms update off-screen but don't render.
    tickIdleAnimations(t);
  }

  function dispose() {
    // Release idle registry entry for podium so fighterModel doesn't keep
    // the disposed Group alive across FD re-entries.
    if (currentFighter) {
      unregisterIdleFighter(podium);
      currentFighter = null;
      currentGlow = null;
    }
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
    setKey,
    dispose,
    picker,
    clickableTargets,
  };
}

export { FD_ROOM_R, FD_ROOM_H };
