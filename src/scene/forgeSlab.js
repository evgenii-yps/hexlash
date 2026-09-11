// forgeSlab.js — the FORGE hall's own plate.
//
// WHY THIS FILE EXISTS. The hall needs a plate that GROWS with the roster, and the
// combat plate cannot give it one: buildArena takes (maxAniso, pink) and nothing
// else — its size lives in the module constant PLATFORM inside that file, which is
// protected. So this is the sanctioned alternative: the same recipe, copied, with
// a size on the front of it. The combat plate is not touched, not imported and not
// parameterised from outside.
//
// WHAT IS COPIED, AND WHAT IS DELIBERATELY NOT:
//   • copied — the torn pair of plates split along ONE seeded jagged rift, the
//     extruded body, the hex top, the contact shadow, and above all the MATERIAL:
//     MATERIALS.slab, the same object the fighter is made of. That shared material
//     is what makes plate and body read as one world, so it is never re-typed here
//     as literals.
//   • NOT copied — the rift's glow (curtain, ribbons, sparks) and the bright rim
//     outline. The hall's rift is extinguished by design, and the home does that by
//     switching the glow off after the fact. Here it is simply never built: nothing
//     to switch off, nothing to pay for.
//
// THE TWO RULES THE PLATE MUST OBEY WHEN IT GROWS (and how they are kept):
//   1. The hex cell is the SAME SIZE on every plate. It is not a repeat count: the
//      UVs are world position divided by CELL_SPAN, so a bigger plate simply holds
//      more cells. This is the original recipe's own trick, kept verbatim.
//   2. The rift gets LONGER, never THICKER. Its half-gap and its wander amplitude
//      are fixed; only the number of segments follows the width, so the teeth stay
//      the same size instead of being stretched.
//
// The plate is REBUILT to change size. It is never scaled — scaling is what would
// blow the hexes up and break rule 1.
import * as THREE from 'three';
import { makeHexGridTexture, makeRadialTexture } from './arenaTextures.js';
import { MATERIALS } from '../data/sceneTokens.js';

// World span of one hex texture tile. THE number that keeps the cell constant
// across sizes — it is a length, not a count. Same value the combat plate uses, so
// the two floors are the same floor.
const CELL_SPAN = 6.5;

const RIFT = {
  slitHalf: 0.12,     // half-width of the crack — FIXED, or the tear reads as a canyon
  amp: 0.42,          // how far the tear wanders off centre — FIXED, keeps the teeth
  segPerUnit: 4,      // segments per world unit of width → tooth size stays constant
  seed: 2026,         // same seed as the combat plate: the same tear, just longer
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ONE jagged rift centreline wandering around z = 0: mostly tight, with the odd
// sharp tooth either way. Seeded, so the same plate comes back identical between
// visits; the segment COUNT follows the width so the teeth keep their size.
function riftCenterline(x0, x1, n) {
  const rng = mulberry32(RIFT.seed);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = THREE.MathUtils.lerp(x0, x1, i / n);
    let z = (rng() - 0.5) * 0.14;
    if (rng() < 0.32) z += (rng() < 0.5 ? -1 : 1) * (0.2 + rng() * RIFT.amp);
    pts.push({ x, z: THREE.MathUtils.clamp(z, -RIFT.amp, RIFT.amp) });
  }
  return pts;
}

/**
 * Build a hall plate.
 * @param {object} o
 * @param {number} o.width  plate width in world units (X)
 * @param {number} o.depth  plate depth in world units (Z) — outer edge to outer edge
 * @param {number} o.height plate thickness; the walkable top ends up at height / 2
 * @param {number} o.maxAniso renderer anisotropy
 * @returns {{ group, dispose, refs: { W, totalDepth, topY, gapHalf } }}
 */
export function buildForgeSlab({ width, depth, height = 1, maxAniso = 1 }) {
  const group = new THREE.Group();
  const W = width;
  const H = height;
  const outerZ = depth / 2;
  const topY = H / 2;
  const g = RIFT.slitHalf;

  const hexTex = makeHexGridTexture(maxAniso);

  const segs = Math.max(12, Math.round(W * RIFT.segPerUnit));
  const centre = riftCenterline(W / 2, -W / 2, segs);
  const nearInner = centre.map((p) => [p.x, p.z + g]);
  const farInner = centre.map((p) => [p.x, p.z - g]);

  // One plate: extruded torn block (inner edge = the offset centreline) with a hex
  // top clipped to the tear.
  const buildPlate = (plateOuterZ, innerPts) => {
    const outline = [[-W / 2, plateOuterZ], [W / 2, plateOuterZ], ...innerPts];
    const shape = new THREE.Shape();
    shape.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
    shape.closePath();

    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, steps: 1 });
    // The plate and the fighter are made of ONE material (Документ А 3.1) — taken
    // from the one place that holds it, never re-typed as numbers. `side` is the
    // only thing of our own: a plate shows its underside, a body does not.
    const bodyMat = new THREE.MeshStandardMaterial({ ...MATERIALS.slab, side: THREE.DoubleSide });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = topY;
    group.add(body);

    const hexGeo = new THREE.ShapeGeometry(shape);
    // Equal WORLD-scale UVs → regular hexagons of a constant size whatever the
    // plate measures (rule 1). Per-vertex alpha fades the grid toward the far edge.
    const hpos = hexGeo.attributes.position;
    const huv = hexGeo.attributes.uv;
    const hcol = new Float32Array(hpos.count * 4);
    for (let i = 0; i < hpos.count; i++) {
      const x = hpos.getX(i);
      const z = hpos.getY(i); // shape y = world Z
      huv.setXY(i, x / CELL_SPAN, z / CELL_SPAN);
      const t = THREE.MathUtils.clamp((z + outerZ) / (2 * outerZ), 0, 1); // 0 far … 1 near
      hcol[i * 4] = 1; hcol[i * 4 + 1] = 1; hcol[i * 4 + 2] = 1;
      hcol[i * 4 + 3] = 0.3 + 0.6 * t;
    }
    huv.needsUpdate = true;
    hexGeo.setAttribute('color', new THREE.BufferAttribute(hcol, 4));
    const hexMat = new THREE.MeshBasicMaterial({
      map: hexTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexColors: true,
    });
    const hex = new THREE.Mesh(hexGeo, hexMat);
    hex.rotation.x = Math.PI / 2;
    hex.position.y = topY + 0.002;
    group.add(hex);
  };

  buildPlate(outerZ, nearInner);   // near half
  buildPlate(-outerZ, farInner);   // far half

  // The rift, extinguished: a dark filler laid in the slit so the tear reads as a
  // seam in one calm platform instead of a hole into the light. It follows the
  // plate's width, so a longer tear stays filled end to end.
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x0c1018 });
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, RIFT.amp * 2 + 0.5), seamMat);
  seam.rotation.x = -Math.PI / 2;
  seam.position.y = topY - 0.06;
  group.add(seam);

  // Dark contact shadow under the plates — seats them, no glow.
  const shadowTex = makeRadialTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0.28)', 0.45);
  const shadowGeo = new THREE.PlaneGeometry(W * 1.3, depth * 1.25);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex, transparent: true, depthWrite: false, fog: false, opacity: 0.7,
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
      if (mat) { if (mat.map) maps.add(mat.map); mat.dispose(); }
    });
    maps.forEach((m) => m.dispose());
  };

  return { group, dispose, refs: { W, totalDepth: depth, topY, gapHalf: g } };
}
