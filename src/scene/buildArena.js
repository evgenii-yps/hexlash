// Builds the floating arena — TORN-RIFT PASS 1 of 3 (geometry only):
// the field is split into TWO separate plate-blocks (near = player half, far =
// opponent half) with a wide dark gap between them. Each plate's inner box face
// is the vertical wall dropping into the void (you look into the chasm, no
// bottom — the transparent canvas shows the dark void behind the gap).
//
// This pass: STRAIGHT gap edges (jagged edges = pass 2), NO rift glow (the old
// pink divider line is removed; its glow replacement = pass 3). Hex top, plate
// thickness, sharp edges, light top rim, float, dark contact shadow all kept.
//
// Returns { group, dispose, refs }. dispose() releases everything created here.
import * as THREE from 'three';
import { makeHexGridTexture, makeRadialTexture } from './arenaTextures.js';

// Total footprint stays close to the approved 6 : ~4 : 1 — two plates + gap.
export const PLATFORM = { width: 6, height: 1, plateDepth: 1.6, gap: 1.2 };

export function buildArena(maxAniso = 1) {
  const group = new THREE.Group();
  const { width: W, height: H, plateDepth: Dp, gap: G } = PLATFORM;
  const topY = H / 2;
  const gapHalf = G / 2;
  const totalDepth = Dp * 2 + G;

  // Shared hex/micro-texture overlay (crisp via mipmaps + anisotropy).
  const hexTex = makeHexGridTexture(maxAniso);

  // One plate-block: dark flat-shaded body (its inner side face is the chasm
  // wall), hex top, light top rim. centerZ places it either side of the gap.
  const makePlate = (centerZ) => {
    const plate = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(W, H, Dp);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x14182a,
      flatShading: true,
      roughness: 0.82,
      metalness: 0.14,
    });
    plate.add(new THREE.Mesh(bodyGeo, bodyMat));

    const hexGeo = new THREE.PlaneGeometry(W, Dp);
    const hexMat = new THREE.MeshBasicMaterial({
      map: hexTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    });
    const hex = new THREE.Mesh(hexGeo, hexMat);
    hex.rotation.x = -Math.PI / 2;
    hex.position.y = topY + 0.002;
    plate.add(hex);

    const hx = W / 2;
    const hz = Dp / 2;
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
    plate.add(rim);

    plate.position.z = centerZ;
    return plate;
  };

  const offset = gapHalf + Dp / 2;
  group.add(makePlate(offset)); // near — player half (toward camera, +z)
  group.add(makePlate(-offset)); // far — opponent half

  // Dark contact shadow under both plates (seats them, no pink glow).
  const shadowTex = makeRadialTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0.28)', 0.45);
  const shadowGeo = new THREE.PlaneGeometry(W * 1.3, totalDepth * 1.25);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    fog: false,
    opacity: 0.7,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -H / 2 - 0.05;
  group.add(shadow);

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
    maps.forEach((m) => m.dispose()); // dedup — hex texture shared by both plates
  };

  const refs = { W, totalDepth, topY, gapHalf, hexTexture: hexTex };

  return { group, dispose, refs };
}
