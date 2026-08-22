// modePlates.js — the two MODE plates (PVE / PVP) that live in the SAME world as
// the player home, a long way off across the void. The home FIGHT button does not
// switch screens any more: the camera flies from the home slab out to these two
// plates (see transitionFlight.js), so both stages must coexist in one scene.
//
// COST DISCIPLINE — this is the whole reason the plates look the way they do.
// There are already three heavy 3D stages (home / pve / space) plus the arena; a
// fourth scene built at transition time would stall the exact moment the flight is
// supposed to be cinema. So the plates are built INTO the home scene at init and
// are deliberately cheap:
//   · NO buildFighter() anywhere near them,
//   · the PVE emblem is a plain faceted floating form (not a fighter, not the
//     legend from legendPresence.js),
//   · the PVP emblem is a ragged scar lying on the plate top — two thin ribbons,
//   · geometry/материал per plate is a handful of meshes, no shadows, no post.
//
// GLOW DISCIPLINE — at rest BOTH plates are matte: nothing glows on the mode
// stage. On hover/focus exactly ONE plate lights, in its own accent (PVE amber
// #FFB21D / PVP pink #FF0069), and the other sinks to `dimLevel`. Two lit plates
// at once is a bug, not a state — `setHover` can only ever light one.
//
// Materials come from the same shop as the arena slab (body 0x14182a, flat-shaded,
// the shared hex-grid top texture) so the plates read as siblings of the home, at
// MODE_PLATES.scale of its size.
//
// Exports: MODE_PLATES (the tuning block), buildModePlates.
import * as THREE from 'three';
import { makeHexGridTexture, makeRadialTexture, makeCoreBandTexture, makeHaloBandTexture } from './arenaTextures.js';

// ─────────────────────────────── Tuning ───────────────────────────────
// Every number the owner might want to feel out on preview lives here.
export const MODE_PLATES = {
  scale: 0.6,          // plate size as a fraction of the home slab (tuning band 0.55–0.65)
  chamfer: 0.34,       // corner cut on the plate outline — gives the facet read
  // Pair layout. Landscape lays the plates side by side across X; portrait stacks
  // them in depth (PVE far → reads as "top") so the pair keeps filling the frame
  // instead of shrinking to a thin strip — the 3D echo of the 2-col → 1-col grid.
  spreadX: 2.85,       // ±X of each plate (landscape)
  spreadZ: 2.9,        // ±Z of each plate (portrait) — wide enough that the far
                       // plate's caption falls in the GAP, not onto the near plate
  portraitAspect: 1.0, // aspect below this → portrait (depth) layout

  body: 0x14182a,      // arena plate body — same shop as the home slab
  rim: 0x7184b0,       // outline colour (matte here: the arena's own rim is lit, ours is not)
  rimOpacity: 0.2,
  hexTile: 5.0,        // world span of one hex-grid tile on the plate top

  // Accents. Never both lit — see setHover.
  amber: '#FFB21D',    // PVE
  pink: '#FF0069',     // PVP

  dimLevel: 0.55,      // the UNLIT plate's brightness while the other is lit
  litLerp: 6.5,        // 1/s easing of the lit/dim levels (soft, no snap)

  // PVE emblem — a lone faceted form floating over the plate.
  pve: {
    radius: 0.46,
    hover: 1.15,       // height above the plate top
    bob: 0.09,         // vertical bob amplitude
    bobSpeed: 0.9,
    spin: 0.16,        // idle rotation (rad/s)
    restEmissive: 0.1, // matte at rest — a dull amber form, no halo
    litEmissive: 1.5,
    halo: 1.9,         // additive halo sprite size when lit (0 opacity at rest)
    haloOpacity: 0.5,
  },

  // PVP emblem — a ragged scar torn across the plate top. Dark groove at rest.
  pvp: {
    // jagged centreline in plate-local XZ (normalised to the plate half-extents)
    path: [[-0.86, -0.30], [-0.42, 0.12], [-0.06, -0.16], [0.28, 0.22], [0.62, -0.08], [0.9, 0.26]],
    grooveWidth: 0.13, // matte dark groove — always visible, reads as a tear
    haloWidth: 0.3,    // wide additive halo (lit only)
    coreWidth: 0.1,    // narrow additive core (lit only)
    haloOpacity: 0.55,
    coreOpacity: 0.85,
  },

  // Touch has no hover, so the plate has to be lit some other way. false → a single
  // tap enters and the plate lights for the exit; true → first tap lights, second
  // tap enters. Owner flag: pick by feel on a real phone.
  touchTwoStep: false,

  // Caption anchor — where modePlateTags projects the 2D label to.
  captionAbove: false, // false → caption sits BELOW the plate (owner flag)
  captionLift: 1.6,    // world height of the anchor above the emblem (when above)
  captionDrop: 0.85,   // world depth toward the camera side, at plate-base height
                       // (when below) — far enough that the caption clears the
                       // plate's own front face instead of printing onto it
};

// ─────────────────────────────── Small builders ───────────────────────────────

// Flat ribbon between two rails (local, mirrors the arena's own strip helper —
// buildArena is a protected file, so this file carries its own copy rather than
// reaching into it). u runs along the length, v ACROSS the width, which is what
// the band textures expect (their gradient peaks at v = 0.5).
function stripGeometry(railA, railB) {
  const n = railA.length;
  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    pos[i * 6] = railA[i].x; pos[i * 6 + 1] = railA[i].y; pos[i * 6 + 2] = railA[i].z;
    pos[i * 6 + 3] = railB[i].x; pos[i * 6 + 4] = railB[i].y; pos[i * 6 + 5] = railB[i].z;
    uv[i * 4] = u; uv[i * 4 + 1] = 0;
    uv[i * 4 + 2] = u; uv[i * 4 + 3] = 1;
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2; const b = a + 1; const c = a + 2; const d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Chamfered rectangle outline (plate footprint), authored in XZ around (0,0).
function plateShape(halfW, halfD, chamfer) {
  const c = Math.min(chamfer, halfW * 0.8, halfD * 0.8);
  const pts = [
    [-halfW + c, -halfD], [halfW - c, -halfD], [halfW, -halfD + c],
    [halfW, halfD - c], [halfW - c, halfD], [-halfW + c, halfD],
    [-halfW, halfD - c], [-halfW, -halfD + c],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();
  return { shape, pts };
}

// One plate slab: faceted extruded body + the shared hex-grid top + a MATTE rim
// outline. Returns the meshes whose brightness the lit/dim level drives.
function buildSlab(halfW, halfD, height, hexTex, o) {
  const group = new THREE.Group();
  const { shape, pts } = plateShape(halfW, halfD, o.chamfer);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1 });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: o.body, flatShading: true, roughness: 0.82, metalness: 0.14, side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2;
  body.position.y = height / 2;
  group.add(body);

  // Hex top — equal world-scale UVs so the hexes stay regular (no bbox squash),
  // same trick the arena plate uses.
  const hexGeo = new THREE.ShapeGeometry(shape);
  const hp = hexGeo.attributes.position;
  const hu = hexGeo.attributes.uv;
  for (let i = 0; i < hp.count; i++) hu.setXY(i, hp.getX(i) / o.hexTile, hp.getY(i) / o.hexTile);
  hu.needsUpdate = true;
  const hexMat = new THREE.MeshBasicMaterial({
    map: hexTex, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide,
  });
  const hex = new THREE.Mesh(hexGeo, hexMat);
  hex.rotation.x = Math.PI / 2;
  hex.position.y = height / 2 + 0.002;
  group.add(hex);

  const rimPts = pts.map(([x, z]) => new THREE.Vector3(x, 0, z));
  rimPts.push(rimPts[0]);
  const rimMat = new THREE.LineBasicMaterial({ color: o.rim, transparent: true, opacity: o.rimOpacity });
  const rim = new THREE.Line(new THREE.BufferGeometry().setFromPoints(rimPts), rimMat);
  rim.position.y = height / 2 + 0.004;
  group.add(rim);

  const dispose = () => {
    bodyGeo.dispose(); bodyMat.dispose();
    hexGeo.dispose(); hexMat.dispose();
    rim.geometry.dispose(); rimMat.dispose();
  };
  return { group, bodyMat, hexMat, rimMat, topY: height / 2, dispose };
}

// PVE emblem — ONE lone faceted form floating over the plate. Deliberately not a
// fighter and not the legend: an octahedron in the arena material family, amber,
// matte at rest, with an additive halo that only exists while the plate is lit.
function buildPveEmblem(o, topY) {
  const group = new THREE.Group();
  const amber = new THREE.Color(o.amber);
  const geo = new THREE.OctahedronGeometry(o.pve.radius, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: amber.clone().multiplyScalar(0.42), // dull metal at rest, not a lamp
    emissive: amber, emissiveIntensity: o.pve.restEmissive,
    flatShading: true, roughness: 0.5, metalness: 0.35,
  });
  const form = new THREE.Mesh(geo, mat);
  form.position.y = topY + o.pve.hover;
  form.scale.set(1, 1.35, 1); // stretched — reads as a standing shard, not a ball
  group.add(form);

  const haloTex = makeRadialTexture('rgba(255,206,120,0.95)', 'rgba(255,178,29,0.18)', 0.36);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex, color: amber, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.position.copy(form.position);
  halo.scale.setScalar(o.pve.halo);
  group.add(halo);

  const baseY = form.position.y;
  const tick = (t, lit, presence) => {
    form.rotation.y = t * o.pve.spin;
    form.position.y = baseY + Math.sin(t * o.pve.bobSpeed) * o.pve.bob;
    halo.position.y = form.position.y;
    mat.color.copy(amber).multiplyScalar(0.42 * presence);
    mat.emissiveIntensity = THREE.MathUtils.lerp(o.pve.restEmissive, o.pve.litEmissive, lit) * presence;
    haloMat.opacity = o.pve.haloOpacity * lit * presence;
  };
  const still = () => { // reduced motion: hold the pose, keep the lit response
    form.rotation.y = 0;
    form.position.y = baseY;
    halo.position.y = baseY;
  };
  const dispose = () => { geo.dispose(); mat.dispose(); haloMat.dispose(); haloTex.dispose(); };
  return { group, tick, still, mat, haloMat, dispose };
}

// PVP emblem — a ragged scar torn across the plate top. Three ribbons over one
// jagged centreline: a MATTE dark groove that is always there (so at rest the
// plate reads as scarred, not as an unlit lamp), plus an additive halo + hot core
// that exist only while the plate is lit.
function buildPvpScar(o, halfW, halfD, topY) {
  const group = new THREE.Group();
  const pts = o.pvp.path.map(([u, v]) => new THREE.Vector3(u * halfW, 0, v * halfD));
  // Resample the jag through a curve so the ribbon has enough segments to read.
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
  const centre = curve.getPoints(48);

  const rails = (halfWidth) => {
    const a = []; const b = [];
    for (let i = 0; i < centre.length; i++) {
      const p = centre[i];
      const q = centre[Math.min(i + 1, centre.length - 1)];
      const r = centre[Math.max(i - 1, 0)];
      const dx = q.x - r.x; const dz = q.z - r.z;
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len; const nz = dx / len; // XZ normal
      a.push(new THREE.Vector3(p.x - nx * halfWidth, 0, p.z - nz * halfWidth));
      b.push(new THREE.Vector3(p.x + nx * halfWidth, 0, p.z + nz * halfWidth));
    }
    return [a, b];
  };

  const addRibbon = (halfWidth, y, mat) => {
    const [a, b] = rails(halfWidth);
    const mesh = new THREE.Mesh(stripGeometry(a, b), mat);
    mesh.position.y = y;
    group.add(mesh);
    return mesh;
  };

  const grooveMat = new THREE.MeshBasicMaterial({ color: 0x090c14, transparent: true, opacity: 0.9, depthWrite: false });
  addRibbon(o.pvp.grooveWidth, topY + 0.004, grooveMat);

  const haloTex = makeHaloBandTexture(o.pink);
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, side: THREE.DoubleSide,
  });
  addRibbon(o.pvp.haloWidth, topY + 0.007, haloMat);

  const coreTex = makeCoreBandTexture(o.pink);
  const coreMat = new THREE.MeshBasicMaterial({
    map: coreTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, side: THREE.DoubleSide,
  });
  addRibbon(o.pvp.coreWidth, topY + 0.01, coreMat);

  const tick = (_t, lit, presence) => {
    grooveMat.opacity = 0.9 * presence;
    haloMat.opacity = o.pvp.haloOpacity * lit * presence;
    coreMat.opacity = o.pvp.coreOpacity * lit * presence;
  };
  const dispose = () => {
    group.children.forEach((m) => m.geometry?.dispose());
    grooveMat.dispose(); haloMat.dispose(); coreMat.dispose();
    haloTex.dispose(); coreTex.dispose();
  };
  return { group, tick, still: () => {}, dispose };
}

// ─────────────────────────────── The pair ───────────────────────────────
/**
 * Build the two mode plates as ONE group the caller drops into the home scene.
 *
 * @param {object} opts
 *   maxAniso   — renderer.capabilities.getMaxAnisotropy() (for the hex texture)
 *   homeW      — the home slab width (arena.refs.W)      → plates are scale× this
 *   homeDepth  — the home slab depth (arena.refs.totalDepth)
 *   homeHeight — the home slab thickness
 *   reduced    — prefers-reduced-motion (emblems hold still, lit response kept)
 *
 * @returns {{ group, layout, bounds, setHover, hovered, update, captionAnchor,
 *             pickables, dispose }}
 *   layout(aspect)     — side-by-side (landscape) vs stacked-in-depth (portrait)
 *   bounds()           — { spanX, spanZ, topY, emblemTop } of the CURRENT layout
 *   setHover(id|null)  — light exactly one plate; the other sinks to dimLevel
 *   captionAnchor(id)  — world Vector3 the 2D caption is projected from
 *   pickables          — meshes to raycast against (whole plate = one hit box)
 */
export function buildModePlates(opts) {
  const o = MODE_PLATES;
  const group = new THREE.Group();
  const scale = o.scale;
  const halfW = (opts.homeW * scale) / 2;
  const halfD = (opts.homeDepth * scale) / 2;
  const height = (opts.homeHeight ?? 1) * scale;
  const hexTex = makeHexGridTexture(opts.maxAniso || 1);

  const make = (id) => {
    const root = new THREE.Group();
    const slab = buildSlab(halfW, halfD, height, hexTex, o);
    root.add(slab.group);
    const emblem = id === 'pve'
      ? buildPveEmblem(o, slab.topY)
      : buildPvpScar(o, halfW, halfD, slab.topY);
    root.add(emblem.group);
    group.add(root);

    // One invisible hit box per plate — a single cheap raycast target that also
    // covers the air the emblem floats in, so the whole plate is one affordance.
    const pickGeo = new THREE.BoxGeometry(halfW * 2, height + o.pve.hover + 0.8, halfD * 2);
    const pick = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.y = (height + o.pve.hover + 0.8) / 2;
    pick.userData.modePlate = id;
    root.add(pick);

    return {
      id, root, slab, emblem, pick, pickGeo,
      lit: 0,       // 0 … 1 — this plate's own light
      level: 1,     // 1 … dimLevel — how much the OTHER plate's light sinks it
      baseBody: new THREE.Color(o.body),
      baseRim: o.rimOpacity,
      baseHex: 0.55,
    };
  };

  const plates = { pve: make('pve'), pvp: make('pvp') };
  const pickables = [plates.pve.pick, plates.pvp.pick];

  let hovered = null;
  let portrait = false;

  // Lay the pair out for the current aspect. Landscape: side by side across X
  // (PVE left). Portrait: stacked in depth (PVE far → reads as the top card),
  // which is the 3D echo of the 2-col → 1-col grid the flat screen used.
  function layout(aspect) {
    portrait = aspect < o.portraitAspect;
    if (portrait) {
      plates.pve.root.position.set(0, 0, -o.spreadZ);
      plates.pvp.root.position.set(0, 0, o.spreadZ);
    } else {
      plates.pve.root.position.set(-o.spreadX, 0, 0);
      plates.pvp.root.position.set(o.spreadX, 0, 0);
    }
  }

  function bounds() {
    return {
      spanX: portrait ? halfW * 2 : o.spreadX * 2 + halfW * 2,
      spanZ: portrait ? o.spreadZ * 2 + halfD * 2 : halfD * 2,
      topY: height,
      emblemTop: height + o.pve.hover + o.pve.radius * 1.4,
    };
  }

  function setHover(id) {
    hovered = (id === 'pve' || id === 'pvp') ? id : null;
  }

  // World point the 2D caption hangs off. Below the plate (toward the camera side,
  // +Z) by default; MODE_PLATES.captionAbove flips it over the emblem.
  const _anchor = new THREE.Vector3();
  function captionAnchor(id) {
    const p = plates[id];
    if (!p) return _anchor.set(0, 0, 0);
    _anchor.copy(p.root.position);
    if (o.captionAbove) _anchor.y += height + o.pve.hover + o.pve.radius + o.captionLift;
    else _anchor.z += halfD + o.captionDrop; // stays at plate-base height → reads as ground

    return group.localToWorld(_anchor);
  }

  const _c = new THREE.Color();
  /**
   * @param active   the camera has landed at the mode stage (plates may respond)
   * @param presence 0 … 1 — how far down the corridor the camera is standing. From
   *   the home end the plates sink to a suggestion in the haze rather than being
   *   switched off: turning them off would tear a hole in the world the moment the
   *   player orbits at the home and looks this way.
   */
  function update(t, dt, active, presence = 1) {
    const k = 1 - Math.exp(-o.litLerp * Math.min(0.05, dt));
    const pres = THREE.MathUtils.clamp(presence, 0, 1);
    for (const id of ['pve', 'pvp']) {
      const p = plates[id];
      // Targets: the hovered plate lights; with ANY plate hovered the other sinks.
      const litTarget = active && hovered === id ? 1 : 0;
      const levelTarget = (active && hovered && hovered !== id) ? o.dimLevel : 1;
      p.lit += (litTarget - p.lit) * k;
      p.level += (levelTarget - p.level) * k;

      // Level rides the matte materials (body / hex / rim) so the unlit plate
      // recedes; `lit` rides ONLY the accent, so a dim plate never glows. Presence
      // rides everything — it is the whole plate stepping back into the distance.
      const m = p.level * pres;
      _c.copy(p.baseBody).multiplyScalar(m);
      p.slab.bodyMat.color.copy(_c);
      p.slab.hexMat.opacity = p.baseHex * m;
      p.slab.rimMat.opacity = p.baseRim * m;
      if (opts.reduced) p.emblem.still();
      p.emblem.tick(opts.reduced ? 0 : t, p.lit * (active ? 1 : 0), pres);
    }
  }

  function dispose() {
    for (const id of ['pve', 'pvp']) {
      const p = plates[id];
      p.slab.dispose();
      p.emblem.dispose();
      p.pickGeo.dispose();
      p.pick.material.dispose();
    }
    hexTex.dispose();
  }

  layout(1.6);

  return {
    group, layout, bounds, setHover, update, captionAnchor, pickables, dispose,
    get hovered() { return hovered; },
  };
}
