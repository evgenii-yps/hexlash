// homeProps.js — decor props for the player HOME stage. Faceted low-poly shapes
// in the arena material family (matte, flat-shaded, dark blue-grey), placed on
// the calm slab by normalized floor coords (u,v). The reference home_stage.jsx
// drew these as flat SVG on a flat floor; here they are real 3D meshes so they
// share the slab's perspective + key light.
//
// SCOPE: visual-stub decor only. A fixed default set per home state (empty /
// lived / arrange) — NOT player data, never persisted. No prop glows (the only
// scene glows are the fighter core + the FIGHT button, enforced by the caller).
//
// Exports: uvToWorld, PROP_KINDS, buildPropSet, buildSnapGrid, buildGhost,
//          disposeGroup.
import * as THREE from 'three';

export const PROP_KINDS = ['plinth', 'corePlinth', 'banner', 'crates', 'arch', 'dais'];

// Normalized floor coord → world position on the slab top.
//   u: 0 (left, -X)  → 1 (right, +X)
//   v: 0 (far, -Z)   → 1 (near, +Z, toward camera)
// refs = arena.refs ({ W, totalDepth, topY }). Returns { x, y, z } with y on the
// slab surface (prop builders author around a base-centre at local y=0).
export function uvToWorld(u, v, refs) {
  return {
    x: (u - 0.5) * refs.W,
    y: refs.topY,
    z: (v - 0.5) * refs.totalDepth,
  };
}

// One matte material family, shared by every prop. Flat shading + the scene's
// single key light do the facet read (top bright, sides dark) — no per-face
// colours needed. A touch lighter than the plates so props read against them.
function makeMatte() {
  return new THREE.MeshStandardMaterial({
    color: 0x2b3446,
    flatShading: true,
    roughness: 0.86,
    metalness: 0.12,
  });
}
// The "core slot" crystal on the core-plinth — darker, MATTE (does NOT glow:
// glow is reserved for the live fighter core + the FIGHT button).
function makeCrystalMatte() {
  return new THREE.MeshStandardMaterial({
    color: 0x1b2233,
    flatShading: true,
    roughness: 0.7,
    metalness: 0.2,
  });
}

const addBox = (parent, mat, w, h, d, x, y, z, ry = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (ry) m.rotation.y = ry;
  parent.add(m);
  return m;
};
// Hexagonal prism (6-sided cylinder) — the "hex" pedestal / dais silhouette.
const addHex = (parent, mat, r, h, y) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.04, h, 6), mat);
  m.position.set(0, y + h / 2, 0);
  m.rotation.y = Math.PI / 6;
  parent.add(m);
  return m;
};

// --- Prop builders. Each returns a Group authored around a base-centre at
//     local (0,0,0); the caller lifts it to the slab top.
function buildOne(kind, mat, crystalMat) {
  const g = new THREE.Group();
  g.userData.kind = kind;
  switch (kind) {
    case 'plinth': // low hex pedestal
      addHex(g, mat, 0.42, 0.52, 0);
      break;
    case 'corePlinth': // pedestal + matte core crystal in a slot
      addHex(g, mat, 0.4, 0.62, 0);
      {
        const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), crystalMat);
        cr.position.set(0, 0.84, 0);
        cr.rotation.y = Math.PI / 5;
        g.add(cr);
      }
      break;
    case 'banner': // base block + tall thin hanging slab
      addBox(g, mat, 0.5, 0.16, 0.5, 0, 0.08, 0);
      addBox(g, mat, 0.12, 1.55, 0.78, 0, 0.16 + 1.55 / 2, 0);
      break;
    case 'crates': // stacked supply blocks
      addBox(g, mat, 0.62, 0.6, 0.56, -0.18, 0.3, 0.06);
      addBox(g, mat, 0.5, 0.46, 0.46, 0.28, 0.23, -0.1);
      addBox(g, mat, 0.4, 0.36, 0.4, 0.04, 0.6 + 0.18, 0.06);
      break;
    case 'arch': // two posts + lintel (ward gate)
      addBox(g, mat, 0.18, 1.25, 0.22, -0.5, 0.625, 0);
      addBox(g, mat, 0.18, 1.25, 0.22, 0.5, 0.625, 0);
      addBox(g, mat, 1.26, 0.2, 0.26, 0, 1.25 + 0.1, 0);
      break;
    case 'dais': // wide low hex platform
    default:
      addHex(g, mat, 0.72, 0.2, 0);
      addHex(g, mat, 0.5, 0.06, 0.2);
      break;
  }
  return g;
}

// Build a set of placed props. placements = [{ kind, u, v }]. Returns a Group
// (positioned in world) ready to add to the scene.
export function buildPropSet(placements, refs) {
  const root = new THREE.Group();
  const mat = makeMatte();
  const crystalMat = makeCrystalMatte();
  root.userData.sharedMats = [mat, crystalMat];
  for (const p of placements || []) {
    const prop = buildOne(p.kind, mat, crystalMat);
    const w = uvToWorld(p.u, p.v, refs);
    prop.position.set(w.x, w.y, w.z);
    root.add(prop);
  }
  return root;
}

// Flat hexagon outline on the slab top (arrange snap-grid cell). active → pink
// (matte, NO glow); idle → cool grey line.
function hexOutline(r) {
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

// Arrange snap-grid: a hex outline per cell. cells = [{ u, v, active }].
export function buildSnapGrid(cells, refs, pink = '#FF0069') {
  const root = new THREE.Group();
  const idleMat = new THREE.LineBasicMaterial({ color: 0x55617e, transparent: true, opacity: 0.5 });
  // Active cell: canon pink, MATTE (no box-shadow/bloom equivalent — just the line).
  const activeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pink), transparent: true, opacity: 0.95 });
  root.userData.sharedMats = [idleMat, activeMat];
  for (const c of cells || []) {
    const line = new THREE.LineLoop(hexOutline(0.34), c.active ? activeMat : idleMat);
    const w = uvToWorld(c.u, c.v, refs);
    line.position.set(w.x, w.y + 0.012, w.z);
    root.add(line);
  }
  return root;
}

// Ghost prop being placed — translucent, pink-tinted, matte (no glow).
export function buildGhost(kind, cell, refs, pink = '#FF0069') {
  const ghostMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(pink),
    flatShading: true,
    roughness: 0.6,
    metalness: 0.1,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const g = buildOne(kind, ghostMat, ghostMat);
  const w = uvToWorld(cell.u, cell.v, refs);
  g.position.set(w.x, w.y, w.z);
  g.userData.sharedMats = [ghostMat];
  return g;
}

// Dispose a group built here (geometries + the shared materials stashed on it).
export function disposeGroup(group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
  });
  const mats = group.userData && group.userData.sharedMats;
  if (mats) mats.forEach((m) => m.dispose());
}
