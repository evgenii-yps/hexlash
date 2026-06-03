// Builds the floating arena platform — a thick low-poly block with a hex-grid
// top, a light top rim, a single glowing pink team-divider, and a soft pink
// float-glow underneath. Pure procedural geometry, no external assets.
//
// Returns { group, dispose }. dispose() releases every geometry / material /
// texture created here.
import * as THREE from 'three';
import { makeHexGridTexture, makeGlowTexture, makeDividerGlowTexture } from './arenaTextures.js';

export const PLATFORM = { width: 6, depth: 4, height: 1 }; // ratio 6 : 4 : 1
const PINK = 0xff066f;

export function buildArena() {
  const group = new THREE.Group();
  const { width: W, depth: D, height: H } = PLATFORM;
  const topY = H / 2; // box centred at origin → top face here

  // --- Platform block: thick, flat-shaded, sharp edges, very dark blue-grey.
  const bodyGeo = new THREE.BoxGeometry(W, H, D);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x14182a,
    flatShading: true,
    roughness: 0.85,
    metalness: 0.12,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = false;
  body.receiveShadow = false;
  group.add(body);

  // --- Hex-grid overlay on the top face (thin lines, fade to far edge).
  const hexTex = makeHexGridTexture();
  const hexGeo = new THREE.PlaneGeometry(W, D);
  const hexMat = new THREE.MeshBasicMaterial({
    map: hexTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.9,
  });
  const hex = new THREE.Mesh(hexGeo, hexMat);
  hex.rotation.x = -Math.PI / 2; // lay flat, facing up
  hex.position.y = topY + 0.002;
  group.add(hex);

  // --- Light top rim: thin line loop around the top perimeter.
  const hx = W / 2;
  const hz = D / 2;
  const rimGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-hx, 0, -hz),
    new THREE.Vector3(hx, 0, -hz),
    new THREE.Vector3(hx, 0, hz),
    new THREE.Vector3(-hx, 0, hz),
    new THREE.Vector3(-hx, 0, -hz),
  ]);
  const rimMat = new THREE.LineBasicMaterial({ color: 0x6c7ea8, transparent: true, opacity: 0.8 });
  const rim = new THREE.Line(rimGeo, rimMat);
  rim.position.y = topY + 0.004;
  group.add(rim);

  // --- Centre divider: the single pink accent. Bright thin bar across the
  //     width at depth-centre (near half = player, far half = opponent).
  const divGeo = new THREE.BoxGeometry(W, 0.035, 0.05);
  const divMat = new THREE.MeshBasicMaterial({ color: PINK });
  const divider = new THREE.Mesh(divGeo, divMat);
  divider.position.y = topY + 0.02;
  group.add(divider);

  // --- Divider bloom: soft additive strip around the line (fakes glow).
  const divGlowTex = makeDividerGlowTexture('#FF066F');
  const divGlowGeo = new THREE.PlaneGeometry(W, 0.6);
  const divGlowMat = new THREE.MeshBasicMaterial({
    map: divGlowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.7,
  });
  const divGlow = new THREE.Mesh(divGlowGeo, divGlowMat);
  divGlow.rotation.x = -Math.PI / 2;
  divGlow.position.y = topY + 0.012;
  group.add(divGlow);

  // --- Float glow: soft pink radial pool below the slab → reads as "floating".
  const floatTex = makeGlowTexture('#FF066F');
  const floatGeo = new THREE.PlaneGeometry(W * 1.9, D * 1.9);
  const floatMat = new THREE.MeshBasicMaterial({
    map: floatTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.32,
  });
  const floatGlow = new THREE.Mesh(floatGeo, floatMat);
  floatGlow.rotation.x = -Math.PI / 2;
  floatGlow.position.y = -H / 2 - 0.6;
  group.add(floatGlow);

  const dispose = () => {
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      const mat = obj.material;
      if (mat) {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
    });
  };

  return { group, dispose };
}
