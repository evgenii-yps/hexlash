// Builds the first arena fighter — a procedural low-poly humanoid construct in
// the Hexlash material (faceted dark blue-grey "skin", one glowing #FF0069 core
// in the chest). Pure box primitives, flat-shaded — no GLTF / external assets.
//
// The body is a JOINT HIERARCHY so future passes can articulate it:
//   root → hips → torso → { head, core, shoulderL/R → elbowL/R → forearm }
//        → hips → thighL/R (hip pivot) → kneeL/R → shin + foot
// Rotating a pivot group rotates everything below it. This pass: idle only —
// heavy slow breathing + a quiet core pulse. No combat, no walk, no hits.
//
// Returns { group, update, setReducedMotion, dispose }. Caller places group.
import * as THREE from 'three';
import { makeRadialTexture } from './arenaTextures.js';

function pinkRgba(pink, a) {
  const n = parseInt(pink.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function buildFighter(pink = '#FF0069') {
  const group = new THREE.Group();

  // Shared faceted "skin" — same workshop as the plates, a touch lighter so the
  // construct reads against them.
  const skin = new THREE.MeshStandardMaterial({
    color: 0x1c2233,
    flatShading: true,
    roughness: 0.8,
    metalness: 0.18,
  });

  // box(parent, w, h, d, x, y, z) → adds a flat-shaded skin box, returns mesh.
  const box = (parent, w, h, d, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skin);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const pivot = (parent, x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  const HIP_Y = 0.93; // hip-joint height above the feet

  // --- Hips (pelvis) — the breathing root of the upper body. Front faces -Z
  //     (toward the rift): toes, chest core all point -Z.
  const hips = pivot(group, 0, HIP_Y, 0);
  box(hips, 0.42, 0.18, 0.26, 0, 0.07, 0); // pelvis

  // --- Torso + head + arms.
  const torso = pivot(hips, 0, 0, 0);
  const chest = box(torso, 0.5, 0.46, 0.3, 0, 0.4, 0); // y 1.10..1.56
  box(torso, 0.16, 0.08, 0.16, 0, 0.66, 0); // neck
  box(torso, 0.26, 0.24, 0.24, 0, 0.8, 0); // head

  const arm = (side) => {
    // shoulder pivot → upper arm hangs down → elbow pivot → forearm
    const shoulder = pivot(torso, side * 0.31, 0.57, 0);
    box(shoulder, 0.16, 0.34, 0.16, 0, -0.17, 0); // upper arm
    const elbow = pivot(shoulder, 0, -0.34, 0);
    box(elbow, 0.14, 0.32, 0.14, 0, -0.16, 0); // forearm
    return { shoulder, elbow };
  };
  const armL = arm(1);
  const armR = arm(-1);

  // --- Legs (hip pivots) → knee pivots → shin + foot. Feet planted, apart.
  const leg = (side) => {
    const hip = pivot(hips, side * 0.16, 0, 0);
    box(hip, 0.2, 0.43, 0.2, 0, -0.215, 0); // thigh (knee at -0.43)
    const knee = pivot(hip, 0, -0.43, 0);
    box(knee, 0.18, 0.41, 0.18, 0, -0.205, 0); // shin (ankle at -0.41)
    box(knee, 0.18, 0.09, 0.26, 0, -0.455, -0.05); // foot (toes toward -Z)
    return { hip, knee };
  };
  const legL = leg(1);
  const legR = leg(-1);

  // --- Core: single faceted #FF0069 gem in the chest front + a soft additive
  //     halo sprite. The fighter's only glow.
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pink) });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), coreMat);
  core.position.set(0, 0.4, -0.16); // chest front (-Z)
  torso.add(core);

  const haloTex = makeRadialTexture('rgba(255,235,243,0.95)', pinkRgba(pink, 0.5), 0.4);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.8,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(0.34, 0.34, 0.34);
  halo.position.copy(core.position);
  torso.add(halo);

  // --- Contact shadow under the feet (dark, no pink). Lives on root so it
  //     stays put while the body breathes.
  const shadowTex = makeRadialTexture('rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 0.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex, transparent: true, depthWrite: false, fog: false, opacity: 0.6,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  group.add(shadow);

  // --- Idle: heavy slow breathing (hips settle + chest expand) + core pulse.
  const hipsBaseY = hips.position.y;
  const wBreath = (Math.PI * 2) / 3.8; // ~3.8s
  const wCore = (Math.PI * 2) / 2.6; // ~2.6s
  let reduced = false;
  const setReducedMotion = (b) => { reduced = b; };

  const update = (t) => {
    if (reduced) {
      hips.position.y = hipsBaseY;
      chest.scale.set(1, 1, 1);
      core.scale.setScalar(1);
      haloMat.opacity = 0.8;
      return;
    }
    const s = Math.sin(t * wBreath);
    hips.position.y = hipsBaseY + s * 0.012; // settle
    chest.scale.set(1 + s * 0.02, 1 + s * 0.03, 1 + s * 0.02); // breathe
    const c = 0.5 + 0.5 * Math.sin(t * wCore);
    core.scale.setScalar(1 + c * 0.22);
    haloMat.opacity = 0.55 + 0.4 * c;
  };

  const dispose = () => {
    const geos = new Set();
    const mats = new Set();
    const maps = new Set();
    group.traverse((obj) => {
      if (obj.geometry) geos.add(obj.geometry);
      if (obj.material) {
        mats.add(obj.material);
        if (obj.material.map) maps.add(obj.material.map);
      }
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    maps.forEach((m) => m.dispose());
  };

  return { group, update, setReducedMotion, dispose, joints: { hips, torso, armL, armR, legL, legR } };
}
