// Builds the floating arena — TORN-RIFT (pass 3 + fix): two torn plate-blocks
// split along ONE shared jagged rift line through a narrow constant slit, with
// the rift glowing as the single light of the scene.
//
// Both plates are cut from the SAME seeded centreline: the near inner edge is
// centreline + slitHalf, the far inner edge is centreline − slitHalf, so the two
// torn edges meet across a narrow constant gap like two halves of one tear.
// The glow is built as ribbons/curtains that FOLLOW that centreline and sit in
// the crack (the plates' own depth occludes any glow that strays onto them, so
// it reads as light from inside the rift, not a bar floating above it):
//   • far-wall curtain — vertical, follows the far torn edge, hot at the bottom
//   • core ribbon — narrow near-white scar along the centreline, in the slit
//   • halo ribbon — short pink halo hugging the centreline
//   • near-ridge highlight — thin SOFT low-contrast strip (no white marker)
//   • sparks rising out of the slit
// All pulse as one (driven in arenaPresence). Pink is --pink (passed in).
//
// Returns { group, dispose, refs }. refs.riftGlow / refs.sparks feed the pulse.
import * as THREE from 'three';
import {
  makeHexGridTexture,
  makeRadialTexture,
  makeCoreBandTexture,
  makeHaloBandTexture,
  makeWallGlowTexture,
} from './arenaTextures.js';
// Материал плиты — тот же объект, что и материал бойца (Документ А 3.1).
import { MATERIALS } from '../data/sceneTokens.js';

export const PLATFORM = { width: 6, height: 1, outerZ: 2.0, slitHalf: 0.12, amp: 0.42 };

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pinkRgba(pink, a) {
  const n = parseInt(pink.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// ONE jagged rift centreline (wanders around z=0): mostly tight with occasional
// sharp teeth either way. Seeded → identical between reloads. x runs +W/2 → −W/2.
function riftCenterline(seed, x0, x1, n, amp) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = THREE.MathUtils.lerp(x0, x1, i / n);
    let z = (rng() - 0.5) * 0.14; // fine jitter
    if (rng() < 0.32) z += (rng() < 0.5 ? -1 : 1) * (0.2 + rng() * amp); // sharp tooth
    pts.push({ x, z: THREE.MathUtils.clamp(z, -amp, amp) });
  }
  return pts;
}

// Triangle-strip ribbon between two rails (arrays of Vector3). v = 0 on railA,
// v = 1 on railB; u runs along the length.
function stripGeometry(railA, railB) {
  const n = railA.length;
  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  for (let i = 0; i < n; i++) {
    pos[i * 6] = railA[i].x; pos[i * 6 + 1] = railA[i].y; pos[i * 6 + 2] = railA[i].z;
    pos[i * 6 + 3] = railB[i].x; pos[i * 6 + 4] = railB[i].y; pos[i * 6 + 5] = railB[i].z;
    const u = i / (n - 1);
    uv[i * 4] = u; uv[i * 4 + 1] = 0;
    uv[i * 4 + 2] = u; uv[i * 4 + 3] = 1;
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

export function buildArena(maxAniso = 1, pink = '#FF0069') {
  const group = new THREE.Group();
  const { width: W, height: H, outerZ, slitHalf: g, amp } = PLATFORM;
  const topY = H / 2;
  const totalDepth = outerZ * 2;

  const hexTex = makeHexGridTexture(maxAniso);

  // Shared rift line → both inner edges are this line offset by ±g.
  const centre = riftCenterline(2026, W / 2, -W / 2, 24, amp);
  const nearInner = centre.map((p) => [p.x, p.z + g]);
  const farInner = centre.map((p) => [p.x, p.z - g]);

  // One plate: extruded torn block (inner edge = offset centreline), hex top
  // clipped to the tear, light rim.
  const buildPlate = (plateOuterZ, innerPts) => {
    const outline = [[-W / 2, plateOuterZ], [W / 2, plateOuterZ], ...innerPts];
    const shape = new THREE.Shape();
    shape.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
    shape.closePath();

    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, steps: 1 });
    // Плита и боец сделаны из ОДНОГО материала (Документ А 3.1): числа берутся
    // из одного места, а не повторяются здесь литералами. `side` — единственное,
    // что здесь своё: у плиты видно и низ, у бойца — нет.
    const bodyMat = new THREE.MeshStandardMaterial({
      ...MATERIALS.slab, side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = topY;
    group.add(body);

    const hexGeo = new THREE.ShapeGeometry(shape);
    // Equal world-scale UVs → regular hexagons (no bbox squash). Per-vertex
    // alpha fades the grid toward the far edge of the arena.
    const D = 6.5; // world span of one texture tile (controls density)
    const hpos = hexGeo.attributes.position;
    const huv = hexGeo.attributes.uv;
    const hcol = new Float32Array(hpos.count * 4);
    for (let i = 0; i < hpos.count; i++) {
      const x = hpos.getX(i);
      const z = hpos.getY(i); // shape y = world Z
      huv.setXY(i, x / D, z / D);
      const t = THREE.MathUtils.clamp((z + outerZ) / (2 * outerZ), 0, 1); // 0 far … 1 near
      hcol[i * 4] = 1;
      hcol[i * 4 + 1] = 1;
      hcol[i * 4 + 2] = 1;
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

    const rimPts = outline.map(([x, z]) => new THREE.Vector3(x, 0, z));
    rimPts.push(rimPts[0]);
    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPts);
    const rimMat = new THREE.LineBasicMaterial({ color: 0x7184b0, transparent: true, opacity: 0.85 });
    const rim = new THREE.Line(rimGeo, rimMat);
    rim.position.y = topY + 0.004;
    group.add(rim);
  };

  buildPlate(outerZ, nearInner); // near (player)
  buildPlate(-outerZ, farInner); // far (opponent)

  // --- Rift glow (single light). Additive, fog off, depthWrite off but depth
  //     TEST on, so the plates clip the glow to the slit → light from the crack.
  const riftGlow = [];

  // Flat ribbon following the centreline (lies just inside the slit, glows up).
  const addFlatRibbon = ({ offset = 0, halfW, y, tex, base }) => {
    const railA = centre.map((p) => new THREE.Vector3(p.x, 0, p.z + offset - halfW));
    const railB = centre.map((p) => new THREE.Vector3(p.x, 0, p.z + offset + halfW));
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, fog: false, side: THREE.DoubleSide, opacity: base,
    });
    const mesh = new THREE.Mesh(stripGeometry(railA, railB), mat);
    mesh.position.y = y;
    group.add(mesh);
    riftGlow.push({ mat, base });
    return mat;
  };

  // Far wall lit from below — vertical curtain following the far torn edge.
  const wallTex = makeWallGlowTexture(pink);
  wallTex.flipY = false; // v=0 top (transparent) … v=1 bottom (hot)
  const railTop = centre.map((p) => new THREE.Vector3(p.x, topY, p.z - g + 0.02));
  const railBot = centre.map((p) => new THREE.Vector3(p.x, topY - 0.7, p.z - g + 0.02));
  const wallMat = new THREE.MeshBasicMaterial({
    map: wallTex, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, side: THREE.DoubleSide, opacity: 0.85,
  });
  const wall = new THREE.Mesh(stripGeometry(railTop, railBot), wallMat);
  group.add(wall);
  riftGlow.push({ mat: wallMat, base: 0.85 });

  // Pink halo hugging the centreline + hot near-white core, in the slit.
  addFlatRibbon({ halfW: 0.13, y: topY - 0.06, tex: makeHaloBandTexture(pink), base: 0.8 });
  addFlatRibbon({ halfW: 0.07, y: topY - 0.02, tex: makeCoreBandTexture(pink), base: 0.95 });

  // Near torn ridge — thin SOFT low-contrast highlight (not a white outline).
  const ridgeMat = addFlatRibbon({
    offset: g, halfW: 0.05, y: topY + 0.006, tex: makeHaloBandTexture(pink), base: 0.3,
  });
  ridgeMat.color = new THREE.Color(0xffd9e6); // soft pink-white, low opacity → subtle blic

  // Sparks rising out of the slit (positions animated in presence).
  const sCount = 12;
  const sRng = mulberry32(4242);
  const sx = [];
  const sz = [];
  const sSpeed = [];
  const sPhase = [];
  const yMin = -0.25;
  const span = 1.05; // top at ~0.8
  const sPos = new Float32Array(sCount * 3);
  for (let i = 0; i < sCount; i++) {
    const idx = Math.floor(sRng() * centre.length);
    sx.push(centre[idx].x + (sRng() - 0.5) * 0.15);
    sz.push(centre[idx].z + (sRng() - 0.5) * 0.1);
    sSpeed.push(0.12 + sRng() * 0.3);
    sPhase.push(sRng() * span);
    sPos[i * 3] = sx[i];
    sPos[i * 3 + 1] = yMin;
    sPos[i * 3 + 2] = sz[i];
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    size: 0.06, map: makeRadialTexture('rgba(255,250,252,0.95)', pinkRgba(pink, 0.55), 0.4),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    opacity: 0.8, sizeAttenuation: true,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  group.add(sparks);
  riftGlow.push({ mat: sparkMat, base: 0.8 });

  // Dark contact shadow under both plates (seats them, no pink glow).
  const shadowTex = makeRadialTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0.28)', 0.45);
  const shadowGeo = new THREE.PlaneGeometry(W * 1.3, totalDepth * 1.25);
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
      if (mat) {
        if (mat.map) maps.add(mat.map);
        mat.dispose();
      }
    });
    maps.forEach((m) => m.dispose());
  };

  const refs = {
    W,
    totalDepth,
    topY,
    gapHalf: g,
    hexTexture: hexTex,
    riftGlow,
    sparks: { points: sparks, position: sPos, count: sCount, sx, sz, sSpeed, sPhase, yMin, span },
  };

  return { group, dispose, refs };
}
