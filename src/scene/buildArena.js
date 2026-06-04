// Builds the floating arena — TORN-RIFT PASS 2 of 3 (jagged edges):
// two separate plate-blocks (near = player half, far = opponent half) split by a
// wide dark gap, with TORN inner edges facing the chasm. Each plate is an
// extruded shape whose inner edge is a seeded jagged polyline, so the side wall
// (the chasm face) follows the tear down into the void. The hex top is clipped
// to the same torn outline (no grid hanging over the gap); the light rim traces
// the full torn top edge.
//
// Still NO rift glow (the pink glow returns in pass 3). Kept from pass 1: plate
// thickness, sharp flat-shaded edges, float, dark contact shadow, no pink.
//
// Returns { group, dispose, refs }. dispose() releases everything created here.
import * as THREE from 'three';
import { makeHexGridTexture, makeRadialTexture } from './arenaTextures.js';

// Total footprint stays close to the approved 6 : ~4 : 1 — two plates + gap.
export const PLATFORM = { width: 6, height: 1, plateDepth: 1.6, gap: 1.2 };

// Deterministic RNG → the torn shape is identical between reloads (no jitter).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Jagged inner-edge profile across the gap length (shape coords: x = world X,
// z = world Z). Teeth poke toward the gap centre (z = 0) by `sign`; large peaks
// interleaved with small noise; tips clamped to stay on the plate's own side.
function jaggedEdge(seed, x0, x1, n, baseZ, sign, maxTooth) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = THREE.MathUtils.lerp(x0, x1, i / n);
    let tooth = rng() * 0.06; // fine noise everywhere
    if (rng() < 0.28) tooth += 0.16 + rng() * 0.3; // occasional big peaks
    tooth = Math.min(tooth, maxTooth);
    pts.push([x, baseZ + sign * tooth]);
  }
  return pts;
}

// Remap a ShapeGeometry's UVs into [0,1] over its bounding box so the hex
// texture maps once across the plate and is clipped to the torn outline.
function remapBboxUV(geo) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const sx = bb.max.x - bb.min.x || 1;
  const sy = bb.max.y - bb.min.y || 1;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / sx, (pos.getY(i) - bb.min.y) / sy);
  }
  uv.needsUpdate = true;
}

export function buildArena(maxAniso = 1) {
  const group = new THREE.Group();
  const { width: W, height: H, plateDepth: Dp, gap: G } = PLATFORM;
  const topY = H / 2;
  const gapHalf = G / 2;
  const totalDepth = Dp * 2 + G;
  const maxTooth = gapHalf - 0.14; // keep tooth tips clear of the gap centre

  const hexTex = makeHexGridTexture(maxAniso);

  // One plate: extruded torn block (inner edge jagged), hex top clipped to the
  // tear, light rim along the full top outline. Built in world coords; the
  // shape's z is mapped straight to world Z via a +90° X rotation.
  const buildPlate = ({ outerZ, innerBaseZ, sign, seed, hexOpacity }) => {
    const jag = jaggedEdge(seed, W / 2, -W / 2, 26, innerBaseZ, sign, maxTooth);
    const outline = [[-W / 2, outerZ], [W / 2, outerZ], ...jag];

    const shape = new THREE.Shape();
    shape.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
    shape.closePath();

    // Block body — torn inner wall follows the tear, drops into the void.
    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, steps: 1 });
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x14182a,
      flatShading: true,
      roughness: 0.82,
      metalness: 0.14,
      side: THREE.DoubleSide, // guarantees the top cap renders regardless of winding
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = topY;
    group.add(body);

    // Hex overlay — clipped to the torn outline (no hexes over the gap).
    const hexGeo = new THREE.ShapeGeometry(shape);
    remapBboxUV(hexGeo);
    const hexMat = new THREE.MeshBasicMaterial({
      map: hexTex,
      transparent: true,
      depthWrite: false,
      opacity: hexOpacity,
      side: THREE.DoubleSide,
    });
    const hex = new THREE.Mesh(hexGeo, hexMat);
    hex.rotation.x = Math.PI / 2;
    hex.position.y = topY + 0.002;
    group.add(hex);

    // Light top rim along the full outline, including the torn ridge.
    const rimPts = outline.map(([x, z]) => new THREE.Vector3(x, 0, z));
    rimPts.push(rimPts[0]);
    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPts);
    const rimMat = new THREE.LineBasicMaterial({ color: 0x7184b0, transparent: true, opacity: 0.85 });
    const rim = new THREE.Line(rimGeo, rimMat);
    rim.position.y = topY + 0.004;
    group.add(rim);
  };

  buildPlate({ outerZ: gapHalf + Dp, innerBaseZ: gapHalf, sign: -1, seed: 1337, hexOpacity: 0.9 }); // near (player)
  buildPlate({ outerZ: -(gapHalf + Dp), innerBaseZ: -gapHalf, sign: 1, seed: 9001, hexOpacity: 0.72 }); // far (opponent)

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
