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
//   · NO buildFighter() anywhere near them — every figure here is a simplified
//     silhouette sharing ONE merged buffer,
//   · the FORGE emblem (plate id 'pve') is the hexarch on a floating pedestal with a
//     ring of five small students under him — the legendPresence.js pedestal recipe
//     without its orbit, haze cloud or descent smoke,
//   · the ARENA emblem (plate id 'pvp') is a pair of faceted gloves floating over a
//     ragged rift torn across the plate top,
//   · geometry/материал per plate is a handful of meshes, no shadows, no post.
//
// NAMING — the plate ids stay 'pve' / 'pvp' because they are wired through
// modePlateTags, HomeView's MODE_DOORS and HomeScene's picking; the NAMES the player
// sees are ARENA ('pvp') and FORGE ('pve'), and the words PVE/PVP appear nowhere on
// screen. Renaming the ids is a separate, wider change.
//
// GLOW DISCIPLINE — at rest BOTH plates are matte: nothing glows on the mode
// stage. On hover/focus exactly ONE plate lights, in its own accent (FORGE amber
// #FFB21D / ARENA pink #FF0069), and the other sinks to `dimLevel`. Two lit plates
// at once is a bug, not a state — `setHover` can only ever light one. Each island
// lights exactly ONE thing: the hexarch's core on FORGE, the rift on ARENA. The
// colours never cross: no amber on the ARENA plate, no pink on the FORGE plate.
//
// FOG — the plates stand 30 units down -Z and the home end of the corridor buries
// them past the fog's `far` (see transitionFlight). Fog is applied AFTER the
// material, so anything with `fog: false` ignores it and would show through the haze
// as a bright cut-out however dark its material is. Every unfogged material here is
// additive AND multiplied by `lit`, which is zero unless the camera has landed at
// this stage and the plate is hovered — that is what keeps them invisible from home.
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
  amber: '#FFB21D',    // FORGE (plate id 'pve')
  pink: '#FF0069',     // ARENA (plate id 'pvp')

  dimLevel: 0.55,      // the UNLIT plate's brightness while the other is lit
  litLerp: 6.5,        // 1/s easing of the lit/dim levels (soft, no snap)

  // ── FORGE emblem (plate id 'pve') — the hexarch teaching his roster ──
  // A figure on a floating faceted pedestal with an amber core, and a ring of five
  // small dark figures standing on the plate below, facing up at him. The ring
  // figures are simplified silhouettes, NOT buildFighter constructs: five jointed
  // fighters on a plate that exists only to be flown past is a phone-killer, and the
  // read the island needs ("he is above them, they are looking at him") is a
  // silhouette read, not an animation read.
  forge: {
    hover: 1.15,        // the hexarch's FEET above the plate top
    hexScale: 0.84,     // hexarch height (the shared figure geometry is 1 unit tall)
    ringScale: 0.66,    // ring figure height
    ringCount: 5,
    ringRadius: 0.78,   // ring radius on the plate top — wide enough that the ring
                        // is not hiding under the pedestal from a shallow camera
    ringTilt: 0.35,     // rotate the whole ring off the plate axis so it reads as a
                        // gathered group, not as a drawing
    bob: 0.05,          // hexarch vertical drift amplitude
    bobPeriod: 6.0,     // seconds per cycle (slow — this is a door, not a scene)

    // Tones. The students are the homeProps prop tone EXACTLY, and for the reason
    // homeProps gives for picking it: a touch lighter than the plate, so a standing
    // figure reads as a figure and not as a stain on the hex grid. Their faces are
    // vertical and the key light is overhead, so anything darker than the plate
    // disappears into it — dark here means "does not glow", not "invisible".
    body: 0x2b3446,     // ring figures: matte, in the homeProps prop family
    hexBody: 0x4a5a78,  // the hexarch stands clear of both his students and the plate
    core: 0.1,          // amber core emissive at rest (matte — nothing glows at rest)
    coreLit: 1.7,       // …and while the plate is lit. This is the island's ONE glow.
    coreR: 0.085,       // core crystal radius, in figure-height units

    // the pedestal, the legendPresence recipe cut down to what a door needs (no
    // orbit, no haze, no smoke — those belong to the PVE scene, not to a doorway)
    pedR: 0.34,
    pedThick: 0.11,
    pedGap: 0.03,
    pedEdge: 0.22,      // amber facet-edge opacity (fogged — see the fog note below)
    pedGlow: 0.5,       // amber contact-glow disc on the pedestal top (LIT only)
  },

  // ── ARENA emblem (plate id 'pvp') — gloves floating over a torn rift ──
  // The rift is the island's ONE glow. The gloves are matte and never light up on
  // their own: their underside carries the rift's pink as BAKED VERTEX COLOUR, which
  // is bounce light off the plate, not a lamp — and, unlike an additive sprite, it is
  // fogged like any other surface, so it cannot poke out of the haze from the home end.
  arena: {
    // jagged centreline in plate-local XZ (normalised to the plate half-extents)
    path: [[-0.86, -0.30], [-0.42, 0.12], [-0.06, -0.16], [0.28, 0.22], [0.62, -0.08], [0.9, 0.26]],
    grooveWidth: 0.13, // matte dark groove — always visible, reads as a tear
    haloWidth: 0.3,    // wide additive halo (lit only)
    coreWidth: 0.1,    // narrow additive core (lit only)
    // Lit vs AT REST. The rift used to be `opacity * lit`, i.e. flat zero unless the
    // pointer was over the plate — and a phone has no pointer, so on a phone it was
    // never lit at all and the island's one glow simply did not exist. FORGE never
    // had that hole (its amber core rests at `core` and rises to `coreLit`), which is
    // the whole reason one door explained itself and the other did not.
    haloRest: 0.22, haloOpacity: 0.55,
    coreRest: 0.46, coreOpacity: 0.85,

    gloveR: 0.35,       // fist radius
    gloveGap: 0.36,     // ±X of each glove from the pair centre — a guard, so the
                        // two hands sit close without touching
    gloveHover: 0.86,   // pair centre above the plate top (chest height of a figure
                        // the size of the ones standing on the FORGE plate). Trimmed
                        // from 1.05 to pay for the cuff now hanging below the fist,
                        // for a bigger hand, and for the quarter-turn that puts the
                        // glove in profile — all three make the pair taller. The
                        // composition must NOT grow upwards (that would push the
                        // arrival camera back and re-open the framing question), so
                        // every bit of it is taken off the hover: measured, the pair's
                        // highest point is 1.369 over the plate against 1.374 before.
                        // The hands end up nearer the rift, which is also where the
                        // light on their undersides is supposed to be coming from.
    gloveBob: 0.045,    // vertical drift — barely there, and no spin (ТЗ)
    gloveBobPeriod: 5.2,// seconds per cycle (owner band 4–6)
    gloveTop: 0x262f42, // top faces: the matte prop family, unchanged
    gloveUnder: 0x8e1a4a, // underside: the same tone with the rift's pink mixed in
    gloveLitBoost: 0.22, // how much the pair warms while the rift under it blazes.
                        // It lifts the whole hand, not only the underside — a brighter
                        // plate throws more bounce — so keep it small: at this value
                        // the dark tops do not visibly move and the pink does.
  },

  // Touch has no hover, so the plate has to be lit some other way. false → a single
  // tap enters and the plate lights for the exit; true → first tap lights, second
  // tap enters. Owner flag: pick by feel on a real phone.
  touchTwoStep: false,

  // ── Caption anchoring ──
  // 'plate'  — the caption hangs off the plate's own SILHOUETTE, recomputed every
  //            frame from wherever the camera is standing: it sits under the lowest
  //            point of the shape the player can actually see, so it can never climb
  //            onto the plate however far round they orbit. This is the default.
  // 'screen' — the captions are pinned to fixed slots on the screen and stay there
  //            while the plates move behind them. The slots themselves are fixed;
  //            which plate gets which is decided by the pair's current order on
  //            screen (left→right, or top→bottom in portrait) so a label can never
  //            end up naming the wrong plate. For the owner to compare against 'plate'.
  //
  // A world-space anchor (what this used to be) cannot do the job: any fixed offset
  // is an offset in some FIXED direction, and the moment the camera swings past that
  // direction the "in front of the plate" point is behind it, and the caption prints
  // over the plate top.
  captionAnchor: 'plate',
  captionGap: 14,      // px between the bottom of the plate's silhouette and the
                       // caption — a SCREEN distance, so it does not shrink with zoom
  captionFloor: 58,    // …but never further down than this many px from the bottom of
                       // the canvas. Only bites when the plate itself is running off
                       // the frame, where the choice is between a caption sitting low
                       // over a plate that is half gone and no caption at all.
                       // It clamps the caption's TOP, so it has to clear the card's
                       // OWN height (~45px) too — at the old 30 the guard fired and
                       // the card still hung off the bottom edge.
  captionSlots: {      // 'screen' mode, as fractions of the viewport
    landscape: [[0.26, 0.84], [0.74, 0.84]], // [left slot, right slot]
    portrait: [[0.5, 0.30], [0.5, 0.80]],    // [upper slot, lower slot]
  },
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

// ─────────────────────────── Shared figure geometry ───────────────────────────
// Merge a handful of transformed boxes into ONE non-indexed geometry. three ships
// BufferGeometryUtils for this, but it lives in examples/ — and these plates already
// carry their own stripGeometry rather than reach into the protected arena builder,
// so they carry this too. Twenty lines is cheaper than a dependency.
function mergeBoxes(parts) {
  const geos = parts.map(({ w, h, d, x, y, z, ry = 0 }) => {
    const src = new THREE.BoxGeometry(w, h, d);
    src.applyMatrix4(new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z));
    const g = src.toNonIndexed();
    src.dispose();
    return g;
  });
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  let at = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, at * 3);
    nor.set(g.attributes.normal.array, at * 3);
    at += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

// One standing FIGURE as a single merged buffer: a faceted silhouette in the
// homeProps family (legs / hips / torso / arms / shoulders / head), authored with the
// feet at local y = 0, ONE unit tall, facing +Z. Every figure on the FORGE plate —
// the five students and the hexarch — is this same buffer at a different scale, so
// six figures cost six draw calls and one geometry.
//
// Deliberately NOT buildFighter: that construct carries joints, an animation driver
// and an HP plate, and it would be assembled at home-scene init just to stand still
// on a plate 30 units away. The silhouette is the whole job here.
function figureGeometry() {
  return mergeBoxes([
    { w: 0.11, h: 0.44, d: 0.13, x: -0.09, y: 0.22, z: 0 },   // left leg
    { w: 0.11, h: 0.44, d: 0.13, x: 0.09, y: 0.22, z: 0 },    // right leg
    { w: 0.30, h: 0.10, d: 0.17, x: 0, y: 0.49, z: 0 },       // hips
    { w: 0.34, h: 0.28, d: 0.19, x: 0, y: 0.68, z: 0 },       // torso
    { w: 0.08, h: 0.30, d: 0.10, x: -0.24, y: 0.68, z: 0 },   // left arm
    { w: 0.08, h: 0.30, d: 0.10, x: 0.24, y: 0.68, z: 0 },    // right arm
    { w: 0.46, h: 0.09, d: 0.18, x: 0, y: 0.865, z: 0 },      // shoulders
    { w: 0.15, h: 0.15, d: 0.15, x: 0, y: 0.99, z: 0 },       // head
  ]);
}
const FIGURE_H = 1.065; // head top of figureGeometry(), for framing maths

// ─────────────────────────── FORGE emblem ───────────────────────────
// The hexarch on his floating pedestal with a ring of students underneath. The
// pedestal is the legendPresence.js recipe cut down to a doorway's needs — hex slab,
// amber facet edges, amber contact disc — WITHOUT the orbit, the haze cloud and the
// descent smoke, which belong to the PVE scene proper. legendPresence itself is not
// imported: it builds a moving island for a live stage and would drag ~130 particles
// per plate into a scene that only has to read from a passing camera.
//
// GLOW: the hexarch's amber core is the island's only lit thing, and only while the
// plate is lit. The contact disc is additive + fog:false, so it MUST ride `lit` (it
// is zero at rest); everything else here is fogged like any other surface.
function buildForgeEmblem(o, topY) {
  const f = o.forge;
  const group = new THREE.Group();
  const amber = new THREE.Color(o.amber);
  const owned = []; // geometries this emblem must dispose (shared ones counted once)

  const figGeo = figureGeometry();
  owned.push(figGeo);

  // — the ring of students, on the plate top, faces turned in toward the centre —
  const ringMat = new THREE.MeshStandardMaterial({
    color: f.body, flatShading: true, roughness: 0.88, metalness: 0.1,
  });
  // deterministic wobble: a ring drawn on a compass reads as a diagram, not a group
  const rJit = [0.06, -0.05, 0.03, -0.08, 0.04];
  const aJit = [0.10, -0.13, 0.06, 0.12, -0.08];
  for (let i = 0; i < f.ringCount; i++) {
    const a = (i / f.ringCount) * Math.PI * 2 + f.ringTilt;
    const r = f.ringRadius * (1 + (rJit[i % rJit.length] || 0));
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const m = new THREE.Mesh(figGeo, ringMat);
    m.position.set(x, topY, z);
    m.scale.setScalar(f.ringScale);
    // figureGeometry faces +Z; turn that toward the ring centre
    m.rotation.y = Math.atan2(-x, -z) + (aJit[i % aJit.length] || 0);
    group.add(m);
  }

  // — the pedestal (feet anchor at y = 0 of this sub-group) —
  const rise = new THREE.Group();
  rise.position.set(0, topY + f.hover, 0);
  group.add(rise);

  const pedGeo = new THREE.CylinderGeometry(f.pedR, f.pedR * 0.88, f.pedThick, 6, 1);
  const pedMat = new THREE.MeshStandardMaterial({
    color: 0x1b2433, flatShading: true, roughness: 0.92, metalness: 0.12,
  });
  const pedestal = new THREE.Mesh(pedGeo, pedMat);
  pedestal.position.y = -(f.pedGap + f.pedThick / 2);
  rise.add(pedestal);
  owned.push(pedGeo);

  // faceted amber edges — FOGGED (no fog:false here). An unfogged line at 30 units
  // draws at full strength through the haze and the island would show as a wire cage
  // from the home end; the fog is applied after the material, so dimming alone would
  // not have hidden it (see the fog note in transitionFlight).
  const pedEdgeGeo = new THREE.EdgesGeometry(pedGeo);
  const pedEdgeMat = new THREE.LineBasicMaterial({
    color: amber, transparent: true, opacity: f.pedEdge, depthWrite: false,
  });
  const pedLines = new THREE.LineSegments(pedEdgeGeo, pedEdgeMat);
  pedLines.position.copy(pedestal.position);
  rise.add(pedLines);
  owned.push(pedEdgeGeo);

  // amber contact disc lying on the pedestal top — additive, so LIT-only
  const discTex = makeRadialTexture('rgba(255,205,140,0.95)', 'rgba(255,178,90,0.0)', 0.5);
  const discMat = new THREE.MeshBasicMaterial({
    map: discTex, color: amber, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const discGeo = new THREE.PlaneGeometry(f.pedR * 2.3, f.pedR * 2.3);
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -f.pedGap + 0.008;
  rise.add(disc);
  owned.push(discGeo);

  // — the hexarch himself, standing on the pedestal —
  const hexMat = new THREE.MeshStandardMaterial({
    color: f.hexBody, flatShading: true, roughness: 0.8, metalness: 0.16,
  });
  const hexarch = new THREE.Mesh(figGeo, hexMat);
  hexarch.scale.setScalar(f.hexScale);
  rise.add(hexarch);

  // his amber core, at chest height on the torso front
  const coreGeo = new THREE.OctahedronGeometry(f.coreR * f.hexScale, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color: amber.clone().multiplyScalar(0.45),
    emissive: amber, emissiveIntensity: f.core,
    flatShading: true, roughness: 0.45, metalness: 0.3,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 0.7 * f.hexScale, 0.12 * f.hexScale);
  rise.add(core);
  owned.push(coreGeo);

  const baseY = rise.position.y;
  const bobW = (Math.PI * 2) / f.bobPeriod;
  const tick = (t, lit, presence) => {
    rise.position.y = baseY + Math.sin(t * bobW) * f.bob;
    ringMat.color.setHex(f.body).multiplyScalar(presence);
    hexMat.color.setHex(f.hexBody).multiplyScalar(presence);
    pedMat.color.setHex(0x1b2433).multiplyScalar(presence);
    pedEdgeMat.opacity = f.pedEdge * presence;
    coreMat.color.copy(amber).multiplyScalar(0.45 * presence);
    coreMat.emissiveIntensity = THREE.MathUtils.lerp(f.core, f.coreLit, lit) * presence;
    discMat.opacity = f.pedGlow * lit * presence;
  };
  const still = () => { rise.position.y = baseY; };
  const dispose = () => {
    owned.forEach((g) => g.dispose());
    ringMat.dispose(); hexMat.dispose(); pedMat.dispose();
    pedEdgeMat.dispose(); discMat.dispose(); discTex.dispose(); coreMat.dispose();
  };
  return { group, tick, still, dispose };
}

// ─────────────────────────── ARENA emblem ───────────────────────────
// A pair of boxing gloves floating over the ragged rift that is torn across the
// plate top. The rift is unchanged from the old fork screen: three ribbons over one
// jagged centreline — a MATTE dark groove that is always there (so at rest the plate
// reads as scarred, not as an unlit lamp) plus an additive halo + hot core that exist
// only while the plate is lit.
//
// THE GLOVES are the only object in the game that comes from the real world, so they
// are built the way every other prop here is built and NOT the way a boxing glove is
// usually built: faceted, low-poly, matte, no leather, no lacing, no seams. A mitt, a
// thumb and a hex cuff, three shared buffers between the two hands.
//
// They do not glow. The pink on their undersides is BAKED VERTEX COLOUR (see
// tintFromBelow) — the rift's light bouncing off the plate onto the shape above it.
// A vertex-coloured MeshStandardMaterial is fogged like any other surface, which is
// exactly what an additive halo would not have been.
function tintFromBelow(geo, topHex, underHex) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const span = Math.max(1e-4, bb.max.y - bb.min.y);
  const pos = geo.attributes.position;
  const top = new THREE.Color(topHex);
  const under = new THREE.Color(underHex);
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    // 0 at the lowest vertex, 1 at the highest. The curve is deliberately STEEP at
    // the bottom (pow < 1): a straight lerp — and, worse, a squared one — carries the
    // pink halfway up the hand and the glove reads as a pink object lit from nowhere.
    // At 0.45 the top three quarters are the matte prop tone and the pink stays a
    // rim of bounce along the underside, which is what light off the plate does.
    const s = (pos.getY(i) - bb.min.y) / span;
    c.copy(under).lerp(top, Math.pow(s, 0.45));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function buildArenaEmblem(o, halfW, halfD, topY) {
  const a = o.arena;
  const group = new THREE.Group();
  const owned = [];

  // ── the rift ──
  const pts = a.path.map(([u, v]) => new THREE.Vector3(u * halfW, 0, v * halfD));
  // Resample the jag through a curve so the ribbon has enough segments to read.
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
  const centre = curve.getPoints(48);

  const rails = (halfWidth) => {
    const ra = []; const rb = [];
    for (let i = 0; i < centre.length; i++) {
      const p = centre[i];
      const q = centre[Math.min(i + 1, centre.length - 1)];
      const r = centre[Math.max(i - 1, 0)];
      const dx = q.x - r.x; const dz = q.z - r.z;
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len; const nz = dx / len; // XZ normal
      ra.push(new THREE.Vector3(p.x - nx * halfWidth, 0, p.z - nz * halfWidth));
      rb.push(new THREE.Vector3(p.x + nx * halfWidth, 0, p.z + nz * halfWidth));
    }
    return [ra, rb];
  };
  const addRibbon = (halfWidth, y, mat) => {
    const [ra, rb] = rails(halfWidth);
    const geo = stripGeometry(ra, rb);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = y;
    group.add(mesh);
    owned.push(geo);
    return mesh;
  };

  const grooveMat = new THREE.MeshBasicMaterial({ color: 0x090c14, transparent: true, opacity: 0.9, depthWrite: false });
  addRibbon(a.grooveWidth, topY + 0.004, grooveMat);

  const haloTex = makeHaloBandTexture(o.pink);
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, side: THREE.DoubleSide,
  });
  addRibbon(a.haloWidth, topY + 0.007, haloMat);

  const coreTex = makeCoreBandTexture(o.pink);
  const coreMat = new THREE.MeshBasicMaterial({
    map: coreTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, side: THREE.DoubleSide,
  });
  addRibbon(a.coreWidth, topY + 0.01, coreMat);

  // ── the gloves ──
  // Built STANDING UP: cuff at the bottom, fist at the top, thumb out to the side.
  // The old pair lay on its side with the cuff tucked in behind the mitt, so of the
  // three shapes that say "boxing glove" — round fist, split thumb, tapering cuff —
  // the silhouette carried only the first, and a lone faceted ball is a stone. Stood
  // up, the read also survives the free orbit at this stage: turning the camera round
  // changes which side of the fist you see, never whether there is a cuff under it.
  const R = a.gloveR;

  // The fist. A low-segment sphere pushed into a fist: narrowed at the wrist end,
  // carried forward and full at the knuckles. Faceted on purpose — 8x6 is a handful
  // of planes, not a ball.
  const fistGeo = new THREE.SphereGeometry(R, 8, 6);
  {
    const pos = fistGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
      const u = (y + R) / (2 * R);                        // 0 at the wrist, 1 at the top
      const taper = 0.62 + 0.38 * Math.min(1, u * 1.15);  // the wrist end draws in
      const knuckle = z > 0 ? 1 + 0.30 * u : 1 - 0.12 * u; // full at the knuckles, flat behind
      pos.setXYZ(i, x * taper * 0.90, y * 0.98, z * taper * knuckle * 1.04);
    }
    pos.needsUpdate = true;
  }
  tintFromBelow(fistGeo, a.gloveTop, a.gloveUnder);

  // The thumb — its own lobe, stretched along its length so it reads as a thumb and
  // not as a wart. Tinted on its own axis: it is tilted when it is placed, but only
  // far enough to point up and out, so its pink rim stays underneath.
  const thumbGeo = new THREE.SphereGeometry(R * 0.40, 5, 4);
  thumbGeo.scale(0.95, 1.30, 1.0);
  tintFromBelow(thumbGeo, a.gloveTop, a.gloveUnder);

  // The cuff. Stands upright under the fist, so — unlike the old one — it needs no
  // pre-rotation before tinting and its pink rim lands where the rift is.
  const cuffGeo = new THREE.CylinderGeometry(R * 0.72, R * 0.60, R * 0.80, 8);
  tintFromBelow(cuffGeo, a.gloveTop, a.gloveUnder);
  owned.push(fistGeo, thumbGeo, cuffGeo);

  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0.1,
  });

  // One hand. `side` mirrors the thumb; the caller turns and lifts each one
  // differently so the pair never reads as one icon printed twice.
  const makeGlove = (side) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(fistGeo, gloveMat));
    // Pushed clear of the fist on purpose: buried, the thumb is a bump and the hand
    // is a ball again. The notch between the two is the one line that says "glove"
    // at the distance the camera parks at.
    const thumb = new THREE.Mesh(thumbGeo, gloveMat);
    thumb.position.set(side * R * 0.62, R * 0.10, R * 0.34);
    thumb.rotation.set(-0.16, 0, side * -1.02);
    g.add(thumb);
    const cuff = new THREE.Mesh(cuffGeo, gloveMat);
    cuff.position.set(0, -R * 0.80, -R * 0.05);
    cuff.rotation.set(0.14, 0, side * 0.06);
    g.add(cuff);
    return g;
  };

  const pair = new THREE.Group();
  pair.position.set(0, topY + a.gloveHover, 0);
  group.add(pair);

  // Held like a guard, and turned about a quarter-turn so the camera gets the glove
  // in PROFILE. This is the whole reason the pair reads: head-on, a fist on a cuff
  // is a lump on a stalk from any distance, while from the side the outline runs
  // cuff → wrist → fist and there is nothing else it can be. The tilt puts each
  // fist up and INWARD and each cuff down and OUTWARD, so the two hands meet the way
  // a fighter's do, and it drops the thumb on the OUTER side of each fist, where it
  // breaks the round outline against empty background instead of hiding in the gap
  // between the hands.
  const left = makeGlove(-1);
  left.position.set(-a.gloveGap, 0.05, 0.05);
  left.rotation.set(-0.10, 0.40, -0.78);
  pair.add(left);

  const right = makeGlove(1);
  right.position.set(a.gloveGap, -0.04, -0.03);
  right.rotation.set(-0.16, -0.46, 0.82);
  pair.add(right);

  const baseY = pair.position.y;
  const leftY = left.position.y;
  const rightY = right.position.y;
  const bobW = (Math.PI * 2) / a.gloveBobPeriod;
  const tick = (t, lit, presence) => {
    grooveMat.opacity = 0.9 * presence;
    // Rest → lit, never zero. `presence` still takes it away at the home end, so a
    // rift that burns at rest cannot poke out of the corridor haze.
    haloMat.opacity = THREE.MathUtils.lerp(a.haloRest, a.haloOpacity, lit) * presence;
    coreMat.opacity = THREE.MathUtils.lerp(a.coreRest, a.coreOpacity, lit) * presence;
    // No spin (ТЗ) — only a long, shallow vertical drift, out of phase per hand.
    left.position.y = leftY + Math.sin(t * bobW) * a.gloveBob;
    right.position.y = rightY + Math.sin(t * bobW + 1.9) * a.gloveBob * 0.85;
    // Presence dims the pair with the rest of the island; `lit` only warms the
    // underside a little, because the rift under them is burning brighter — the
    // gloves themselves never become a light source.
    gloveMat.color.setScalar(presence * (1 + a.gloveLitBoost * lit));
  };
  const still = () => {
    pair.position.y = baseY;
    left.position.y = leftY;
    right.position.y = rightY;
  };
  const dispose = () => {
    owned.forEach((g) => g.dispose());
    grooveMat.dispose(); haloMat.dispose(); coreMat.dispose();
    haloTex.dispose(); coreTex.dispose(); gloveMat.dispose();
  };
  return { group, tick, still, dispose };
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
 * @returns {{ group, layout, bounds, setHover, hovered, update, captionScreen,
 *             captionSlots, pickables, dispose }}
 *   layout(aspect)     — side-by-side (landscape) vs stacked-in-depth (portrait)
 *   bounds()           — { spanX, spanZ, topY, emblemTop } of the CURRENT layout
 *   setHover(id|null)  — light exactly one plate; the other sinks to dimLevel
 *   captionScreen(id, camera, w, h) — CSS-pixel anchor under the plate's silhouette
 *   captionSlots(camera, w, h)      — the same, pinned to fixed screen slots
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
  // How much air the tallest emblem needs above the plate top — drives BOTH the
  // shared hit box and the camera framing (bounds().emblemTop), so a taller hexarch
  // pulls the camera back by itself instead of being cropped.
  const emblemAir = Math.max(
    o.forge.hover + o.forge.hexScale * FIGURE_H,
    o.arena.gloveHover + o.arena.gloveR * 1.3,
  ) + 0.5;

  const make = (id) => {
    const root = new THREE.Group();
    const slab = buildSlab(halfW, halfD, height, hexTex, o);
    root.add(slab.group);
    const emblem = id === 'pve'
      ? buildForgeEmblem(o, slab.topY)                  // FORGE — hexarch + ring
      : buildArenaEmblem(o, halfW, halfD, slab.topY);   // ARENA — rift + gloves
    root.add(emblem.group);
    group.add(root);

    // One invisible hit box per plate — a single cheap raycast target that also
    // covers the air the emblem floats in, so the whole plate is one affordance.
    // `emblemAir` is the taller of the two islands, so both plates keep the same
    // affordance and a hover cannot depend on which emblem happens to stand there.
    const pickH = height + emblemAir;
    const pickGeo = new THREE.BoxGeometry(halfW * 2, pickH, halfD * 2);
    const pick = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.y = pickH / 2;
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
      emblemTop: height + emblemAir,
    };
  }

  function setHover(id) {
    hovered = (id === 'pve' || id === 'pvp') ? id : null;
  }

  // ── Caption placement ──
  // Screen-space, not world-space, and recomputed every frame. The caption has to
  // stand clear of the plate's NEAR edge and under its silhouette from any angle,
  // which is a question about the projected shape, not about a point in the world —
  // so it is answered where the projection happens.
  //
  // The eight corners of the plate body are projected and the LOWEST one on screen
  // is taken: that is the bottom of the shape the player is looking at, whatever they
  // are looking at it from. The caption hangs a fixed number of PIXELS below it, so
  // it keeps the same visual gap at every zoom, and the gap grows by itself as the
  // plate turns edge-on and its silhouette reaches further down the screen.
  //
  // The horizontal anchor follows the plate's CENTRE rather than the lowest corner,
  // so the caption does not hop sideways as the orbit hands the "lowest" role from
  // one corner to the next; only its height tracks the silhouette.
  const _v = new THREE.Vector3();
  // Local corners of the plate body (the emblem floats ABOVE, so it never sets the
  // bottom of the silhouette and is left out).
  const plateCorners = [];
  for (const sx of [-1, 1]) for (const sy of [0, 1]) for (const sz of [-1, 1]) {
    plateCorners.push(new THREE.Vector3(sx * halfW, sy * height, sz * halfD));
  }

  const _out = { x: 0, y: 0, visible: false };
  /**
   * @param id      'pve' | 'pvp'
   * @param camera  the live camera — the silhouette is only meaningful against one
   * @param viewW/H CSS pixels of the canvas
   * @returns {{x, y, visible}} top-centre of the caption block, in CSS pixels
   */
  function captionScreen(id, camera, viewW, viewH) {
    const p = plates[id];
    _out.visible = false;
    if (!p) return _out;

    // Plate centre → the caption's horizontal anchor, and the front/behind test.
    _v.set(0, height * 0.5, 0);
    p.root.localToWorld(_v); // root sits under `group`, so this is already world space
    _v.project(camera);
    if (_v.z >= 1) return _out;      // behind the camera: nothing to label
    const cx = (_v.x * 0.5 + 0.5) * viewW;

    // Lowest projected corner = the bottom of the visible silhouette.
    let low = -Infinity;
    for (const c of plateCorners) {
      _v.copy(c);
      p.root.localToWorld(_v);
      _v.project(camera);
      if (_v.z >= 1) continue;       // that corner is behind us; the others still say enough
      const sy = (-_v.y * 0.5 + 0.5) * viewH;
      if (sy > low) low = sy;
    }
    if (low === -Infinity) return _out;

    _out.x = cx;
    _out.y = Math.min(low + o.captionGap, viewH - o.captionFloor);
    _out.visible = true;
    return _out;
  }

  // 'screen' mode: fixed slots, handed out by which plate is currently further left
  // (landscape) or further up (portrait) so a label never ends up on the wrong plate.
  const _slotA = new THREE.Vector3(); const _slotB = new THREE.Vector3();
  function captionSlots(camera, viewW, viewH) {
    const proj = (p, v) => { v.set(0, height * 0.5, 0); p.root.localToWorld(v); v.project(camera); return v; };
    proj(plates.pve, _slotA); proj(plates.pvp, _slotB);
    const slots = portrait ? o.captionSlots.portrait : o.captionSlots.landscape;
    // Portrait slots run top→bottom on screen, and projected y runs the other way,
    // so the plate with the HIGHER projected y is the one in the first (upper) slot.
    const pveFirst = portrait ? _slotA.y > _slotB.y : _slotA.x < _slotB.x;
    const put = (v, slot) => ({ x: slot[0] * viewW, y: slot[1] * viewH, visible: v.z < 1 });
    return pveFirst
      ? { pve: put(_slotA, slots[0]), pvp: put(_slotB, slots[1]) }
      : { pve: put(_slotA, slots[1]), pvp: put(_slotB, slots[0]) };
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
    group, layout, bounds, setHover, update, captionScreen, captionSlots, pickables, dispose,
    get hovered() { return hovered; },
  };
}
