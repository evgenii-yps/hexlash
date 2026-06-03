// Builds the floating arena platform — a thick low-poly block with a hex-grid
// top, a light top rim, the single glowing pink team-divider, and a soft dark
// contact shadow underneath (so the slab seats in the void). Pure procedural
// geometry, no external assets.
//
// Discipline: the ONLY glow on the scene is the divider; the under-slab pool is
// a dark contact shadow, not a second glow. The ONLY accent colour is #FF066F.
//
// Returns { group, dispose, refs }. refs expose the animatable materials for
// the presence layer. dispose() releases everything created here.
import * as THREE from 'three';
import { makeHexGridTexture, makeDividerGlowTexture, makeRadialTexture } from './arenaTextures.js';

export const PLATFORM = { width: 6, depth: 4, height: 1 }; // ratio 6 : 4 : 1
const PINK = 0xff066f;

export function buildArena(maxAniso = 1) {
  const group = new THREE.Group();
  const { width: W, depth: D, height: H } = PLATFORM;
  const topY = H / 2;

  // --- Platform block: thick, flat-shaded, sharp edges, very dark blue-grey.
  const bodyGeo = new THREE.BoxGeometry(W, H, D);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x14182a,
    flatShading: true,
    roughness: 0.82,
    metalness: 0.14,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // --- Hex-grid + micro-texture overlay on the top face (crisp via mipmaps).
  const hexTex = makeHexGridTexture(maxAniso);
  const hexGeo = new THREE.PlaneGeometry(W, D);
  const hexMat = new THREE.MeshBasicMaterial({
    map: hexTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.92,
  });
  const hex = new THREE.Mesh(hexGeo, hexMat);
  hex.rotation.x = -Math.PI / 2;
  hex.position.y = topY + 0.002;
  group.add(hex);

  // --- Light top rim: thin line loop around the top perimeter (sharp edge).
  const hx = W / 2;
  const hz = D / 2;
  const rimGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-hx, 0, -hz),
    new THREE.Vector3(hx, 0, -hz),
    new THREE.Vector3(hx, 0, hz),
    new THREE.Vector3(-hx, 0, hz),
    new THREE.Vector3(-hx, 0, -hz),
  ]);
  const rimMat = new THREE.LineBasicMaterial({ color: 0x7184b0, transparent: true, opacity: 0.85 });
  const rim = new THREE.Line(rimGeo, rimMat);
  rim.position.y = topY + 0.004;
  group.add(rim);

  // --- Divider: near-white sharp core. The single pink accent's bright heart.
  const coreGeo = new THREE.BoxGeometry(W, 0.05, 0.045);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffe3f0, transparent: true, opacity: 1, fog: false });
  const dividerCore = new THREE.Mesh(coreGeo, coreMat);
  dividerCore.position.y = topY + 0.024;
  group.add(dividerCore);

  // --- Divider halo: dense, SHORT pink band hugging the core (no wide cloud).
  const haloTex = makeDividerGlowTexture('#FF066F');
  const haloGeo = new THREE.PlaneGeometry(W, 0.24);
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    opacity: 0.9,
  });
  const dividerHalo = new THREE.Mesh(haloGeo, haloMat);
  dividerHalo.rotation.x = -Math.PI / 2;
  dividerHalo.position.y = topY + 0.014;
  group.add(dividerHalo);

  // --- Reflection bleed: very faint, slightly longer smear of the line on the
  //     polished top face. Reuses the halo texture at low opacity.
  const reflMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    opacity: 0.13,
  });
  const reflGeo = new THREE.PlaneGeometry(W, 0.85);
  const dividerReflection = new THREE.Mesh(reflGeo, reflMat);
  dividerReflection.rotation.x = -Math.PI / 2;
  dividerReflection.position.y = topY + 0.007;
  group.add(dividerReflection);

  // --- Contact shadow: soft dark pool under the slab (seats it, no glow).
  const shadowTex = makeRadialTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0.28)', 0.45);
  const shadowGeo = new THREE.PlaneGeometry(W * 1.35, D * 1.35);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    fog: false,
    opacity: 0.7,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -H / 2 - 0.05;
  group.add(contactShadow);

  const dispose = () => {
    const maps = new Set();
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      const mat = obj.material;
      if (mat) {
        if (mat.map) maps.add(mat.map);
        mat.dispose();
      }
    });
    maps.forEach((m) => m.dispose()); // dedup — halo texture is shared
  };

  const refs = {
    W,
    D,
    topY,
    hexTexture: hexTex,
    dividerCore,
    dividerHalo,
    dividerReflection,
    base: { core: 1, halo: 0.9, reflection: 0.13 },
  };

  return { group, dispose, refs };
}
