// Builds the floating arena — TORN-RIFT PASS 3 of 3 (rift glow):
// two torn plate-blocks split by a wide dark gap, with the rift glowing as the
// single light of the scene — a hot near-white core + tight pink halo at the
// chasm bottom, the far wall lit from below, a near-white contour along the
// near torn ridge, and a few rising sparks. The whole glow pulses as one
// (driven in arenaPresence). The pink accent comes from --hex-primary (passed
// in), never hard-coded. No full-screen bloom — cheap additive geometry only.
//
// Kept from passes 1–2: split geometry + jagged edges, plate thickness, sharp
// flat-shaded edges, light rim, float, dark contact shadow (no pink under it).
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

export const PLATFORM = { width: 6, height: 1, plateDepth: 1.6, gap: 1.2 };

// Deterministic RNG → torn shape + sparks identical between reloads.
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

// Jagged inner-edge profile across the gap length. Teeth poke toward the gap
// centre by `sign`; big peaks + fine noise; tips clamped to their own side.
function jaggedEdge(seed, x0, x1, n, baseZ, sign, maxTooth) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = THREE.MathUtils.lerp(x0, x1, i / n);
    let tooth = rng() * 0.06;
    if (rng() < 0.28) tooth += 0.16 + rng() * 0.3;
    tooth = Math.min(tooth, maxTooth);
    pts.push([x, baseZ + sign * tooth]);
  }
  return pts;
}

// Remap a ShapeGeometry's UVs into [0,1] over its bbox so the hex texture maps
// once across the plate and is clipped to the torn outline.
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

export function buildArena(maxAniso = 1, pink = '#FF0069') {
  const group = new THREE.Group();
  const { width: W, height: H, plateDepth: Dp, gap: G } = PLATFORM;
  const topY = H / 2;
  const gapHalf = G / 2;
  const totalDepth = Dp * 2 + G;
  const maxTooth = gapHalf - 0.14;

  const hexTex = makeHexGridTexture(maxAniso);

  // Torn edge profiles (different seeds → teeth oppose, not a parallel zipper).
  const jagNear = jaggedEdge(1337, W / 2, -W / 2, 26, gapHalf, -1, maxTooth);
  const jagFar = jaggedEdge(9001, W / 2, -W / 2, 26, -gapHalf, 1, maxTooth);

  // One plate: extruded torn block, hex top clipped to the tear, light rim.
  const buildPlate = (outerZ, jag, hexOpacity) => {
    const outline = [[-W / 2, outerZ], [W / 2, outerZ], ...jag];

    const shape = new THREE.Shape();
    shape.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
    shape.closePath();

    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, steps: 1 });
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x14182a,
      flatShading: true,
      roughness: 0.82,
      metalness: 0.14,
      side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = topY;
    group.add(body);

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

    const rimPts = outline.map(([x, z]) => new THREE.Vector3(x, 0, z));
    rimPts.push(rimPts[0]);
    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPts);
    const rimMat = new THREE.LineBasicMaterial({ color: 0x7184b0, transparent: true, opacity: 0.85 });
    const rim = new THREE.Line(rimGeo, rimMat);
    rim.position.y = topY + 0.004;
    group.add(rim);
  };

  buildPlate(gapHalf + Dp, jagNear, 0.9); // near (player)
  buildPlate(-(gapHalf + Dp), jagFar, 0.72); // far (opponent)

  // --- Rift glow (the single light). All additive, fog off, no depth write.
  const riftGlow = [];
  const addFlat = (z, y, depth, tex, base) => {
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      opacity: base,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, depth), mat);
    mesh.rotation.x = -Math.PI / 2; // lie flat in the gap, glow upward
    mesh.position.set(0, y, z);
    group.add(mesh);
    riftGlow.push({ mat, base });
  };

  // Hot core + tight pink halo at the chasm bottom (light rising from below).
  addFlat(0, -0.3, 0.28, makeCoreBandTexture(pink), 0.95);
  addFlat(0, -0.18, 0.55, makeHaloBandTexture(pink), 0.85);
  // Pink bloom hugging gap-ward of the near torn ridge.
  addFlat(gapHalf - 0.18, topY - 0.06, 0.3, makeHaloBandTexture(pink), 0.45);

  // Far plate inner wall lit from below (vertical, faces the camera).
  const wallMat = new THREE.MeshBasicMaterial({
    map: makeWallGlowTexture(pink),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
    opacity: 0.85,
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.9), wallMat);
  wall.position.set(0, 0, -0.45);
  group.add(wall);
  riftGlow.push({ mat: wallMat, base: 0.85 });

  // Near torn ridge contour — thin near-white line tracing the teeth.
  const edgePts = jagNear.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePts);
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0xffe3f0,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    opacity: 0.9,
  });
  const edgeLine = new THREE.Line(edgeGeo, edgeMat);
  edgeLine.position.y = topY + 0.012;
  group.add(edgeLine);
  riftGlow.push({ mat: edgeMat, base: 0.9 });

  // A few sparks rising out of the chasm (positions animated in presence).
  const sCount = 12;
  const sRng = mulberry32(4242);
  const sx = [];
  const sz = [];
  const sSpeed = [];
  const sPhase = [];
  const yMin = -0.42;
  const span = 1.27; // → top at ~0.85
  const sPos = new Float32Array(sCount * 3);
  for (let i = 0; i < sCount; i++) {
    sx.push((sRng() - 0.5) * W * 0.92);
    sz.push((sRng() - 0.5) * 0.22);
    sSpeed.push(0.12 + sRng() * 0.3);
    sPhase.push(sRng() * span);
    sPos[i * 3] = sx[i];
    sPos[i * 3 + 1] = yMin;
    sPos[i * 3 + 2] = sz[i];
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    size: 0.07,
    map: makeRadialTexture('rgba(255,250,252,0.95)', pinkRgba(pink, 0.55), 0.4),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    opacity: 0.8,
    sizeAttenuation: true,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  group.add(sparks);
  riftGlow.push({ mat: sparkMat, base: 0.8 });

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
    maps.forEach((m) => m.dispose());
  };

  const refs = {
    W,
    totalDepth,
    topY,
    gapHalf,
    hexTexture: hexTex,
    riftGlow,
    sparks: { points: sparks, position: sPos, count: sCount, sx, sz, sSpeed, sPhase, yMin, span },
  };

  return { group, dispose, refs };
}
