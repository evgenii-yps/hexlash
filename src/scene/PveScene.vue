<!-- PveScene — the FORGE hall, the 3D stage of the club. A self-contained sibling of
     HomeScene.vue (the home is live on prod — this never reuses it by a flag and never
     touches it): the SAME arena slab with the combat rift SUPPRESSED from outside
     (rift-glow opacity 0, sparks off, presence never created, the bright slab outline
     Lines hidden), the SAME warm dim lamp room-fill (no haze halos, no dust on PVE) —
     but here the plate holds the player's ROSTER (buildFighter xN), standing STILL and
     FACING the player in a deterministic formation (an arc up to five, two staggered
     rows beyond), and above the plate centre a trainer-LEGEND floats in a warm amber
     cloud, continuously drifting (legendPresence).

     The camera is frontal and FIXED (no orbit): an overview frame for the hall, and a
     closer work frame it glides to when a fighter is picked — the picked one steps to
     the left and stays lit, the rest sink into shadow. Roster cores are MATTE at rest;
     hover lights exactly one. All of that is driven from OUTSIDE: brightness is written
     onto the core gem / halo reached through joints.torso AFTER fighter.update(), and
     bodies are dimmed through their own per-instance skin material — buildFighter and
     buildFighter is only INSTANCED, never edited.

     Discipline: dark room; the legend's warm amber cloud is the ONE glow; roster cores
     are light, not a second accent; NO pink anywhere (the FIGHT pink lives on the home,
     never here); no HP plates; no FIGHT. All tuning knobs are in the CONFIG / CAM / WORK
     / CORE_LIGHT / LEGEND blocks at the top. Respects prefers-reduced-motion + tab pause. -->
<template>
  <div ref="wrap" class="pve-scene-wrap">
    <canvas ref="canvasEl" class="pve-scene-canvas" />
    <div class="pve-scene-vignette" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { buildBackdrop } from './hallBackdrop.js';
import { LAMPS as HALL_LAMPS, buildLamps } from './hallLamps.js';
import { buildForgeSlab } from './forgeSlab.js';
import { makeRadialTexture } from './arenaTextures.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createLegendPresence } from './legendPresence.js';
import { createForgeWanderDirector } from './forgeWander.js';
import store from '@/core/state/store.js';
import { beginSceneLoad } from '@/services/sceneLoading.js';
import { CORE_HUE, AMBER, LIGHTING, FOG_COLOR, FOG, FOV, CAMERA } from '@/data/sceneTokens.js';;

// ───────────────────────────── CONFIG (tune on preview) ─────────────────────────────
// THE PLATE. The hall has ONE ground and it is a plate — the same torn, hex-topped
// plate the rest of the world is made of, built here at the size this hall needs
// (see forgeSlab.js for why it is a copy and not the combat plate itself).
//
// It comes in three STEPS, because a plate sized for ten under a roster of two is
// a parade ground with two people on it. The step is decided ONCE, when the hall
// opens — never while the player is standing on it.
//
// The sizes are NOT typed here. They are worked out from what has to fit: the arc
// of zones for the biggest roster the step must hold, the mark in front of it, and
// a clear margin all round (see slabFor). All that is typed is the shape of the
// plate and how much bare ground to leave at its edge.
const SLAB = {
  steps: [4, 7, 10],   // a roster up to 4 / up to 7 / up to 10 gets the 1st / 2nd / 3rd plate
  // width : depth. ONE shape for every step, so the plate never turns from oblong
  // to square and back as the roster changes — and 1.5 is the combat plate's own
  // 6 : 4, so the hall is the same plate the rest of the world is made of.
  //
  // It is also, measured, the best this can be. What has to fit grows almost
  // entirely SIDEWAYS as the roster grows (the arc widens from 4 units to 12) while
  // its depth barely moves (6 to 7, most of it zone depth and the walk out to the
  // mark). Holding one shape therefore always buys some bare plate: squarer than
  // this and the big plate turns into a field with a row across the middle;
  // flatter, and the three steps come out nearly the same size and stop being
  // steps at all. At 1.5 the plate grows 63% from the small step to the large one
  // and never carries more than ~38% of ground it does not need.
  aspect: 1.5,
  edge: 0.8,           // bare ground between the outermost thing on the plate and its
                       // rim — more than a fighter's stride, so nobody stands on the brink
  height: 1.0,         // plate thickness; the walkable top ends up at half of this
};

// THE ARC. Every fighter owns a spot on ONE arc that faces the player: its centre
// stands FURTHEST from the camera and its ends come FORWARD, so nobody is behind
// anybody. Spots are DETERMINISTIC — the n-th fighter is always n-th — so a fighter
// keeps his place between visits and across a rotation.
//
// The two numbers that matter and why:
//   `step` is measured ALONG the arc, not across the screen, so the gap between
//   neighbours is the same at the ends as in the middle. It has to clear a body
//   (0.73 wide, measured — see BODY) plus both their zones plus air — see ZONE.
//   `radius` is how gently the arc bows. It cannot be tightened much: the tighter
//   the bow, the more of the step goes into DEPTH instead of sideways, and two
//   fighters separated only by depth are exactly the "one behind the other" the
//   composition must not have.
const ARC = {
  // 1.4 is not a taste: a body MEASURES 0.73 wide (Box3 on a built fighter), the
  // zones add 2 × ZONE.halfX, and what is left over is the air between two
  // silhouettes at their worst case — about 0.35, a third of a body. Tightening
  // this is what makes the arc overlap; widening it is what pushes the camera so
  // far back the hall goes dark.
  step: 1.4,           // spacing between neighbours, measured along the arc
  radius: 16,          // bow radius — bigger = flatter arc
  maxCount: 10,        // the hall is built for this many; ROSTER_MAX matches it
  // Where the middle of the arc stands is NOT typed: it is placed so the arc and
  // the mark together sit centred on their plate (see composeFor).
};

// A fighter's PERSONAL ZONE — the patch he strolls on. Deliberately narrow across
// the arc and deep along the view: depth costs almost no screen width, so he can
// walk a real distance without ever closing on a neighbour. Worst case, two
// neighbours at their facing zone edges still stand ARC.step − 2·halfX apart,
// which is wider than a body — that is the no-overlap guarantee, and it is
// geometric, not a hope.
const ZONE = {
  halfX: 0.15,         // half-width across the arc
  halfZ: 0.70,         // half-depth along the view
};
// What a body actually MEASURES (Box3 on a built fighter), not a guess: the
// framing used to pad this to 1.24 × 2.25 and the camera backed off half the hall
// to keep the padding on screen. A little headroom is kept for the idle bob and
// for arms that swing while walking.
const BODY = { halfW: 0.40, height: 1.95 };

// THE FOUR LAMPS' REACH, quoted for the SMALLEST plate. Four lamps is the rule (no
// new light sources), so the bigger steps are lit by making these same four carry
// further — see lampReach(): intensity rises with the square of the plate's growth,
// the cutoff radius with the growth itself, which is exactly what a 1/r² falloff
// costs to hold the floor at one brightness across all three plates.
const LAMP_REACH = {
  intensity: 30,       // at the small plate; scaled by k² on the bigger ones
  distance: 26,        // cutoff radius at the small plate; scaled by k
  hangLift: 1.2,       // lift the shades up out of the frame, above the heads
};

// THE MARK — the spot the picked fighter walks out to, in front of the whole arc
// and on its centre line. Kept clear of every zone by construction.
const MARK = {
  // Far enough forward that the man on it clears the row ON SCREEN, not just in the
  // world: the camera looks down, so depth is what lifts the row clear of his head.
  // But no further — every unit here is also a unit of bare ground between the row
  // and the mark, and a plate deep enough to hold it.
  //
  // This started at 3.9, which left a gap you could park in. The floor was found by
  // hiding every body but one, photographing it alone, and comparing that silhouette
  // with what is actually visible of it in the full scene: at 2.6 every body still
  // showed 100% of itself at every roster size and screen shape. 2.9 is that floor
  // plus room for the fact that the bodies WANDER — they are not standing where the
  // measurement caught them.
  ahead: 2.9,          // how far in FRONT of the arc's foremost spot the mark sits
};

// The hall's camera. Frontal and FIXED: no orbit, no auto-rotate — this is a
// workplace, not a viewing platform (owner's call, 24.08). Two framings only.
const CAM = {
  // Not fixed points: the DIRECTION the camera looks from, and a starting guess at
  // the distance. Where it ends up is measured against what is actually on the
  // floor — see frameFor().
  // The angle is load-bearing, not taste. Seen from almost level (the old 1.65 : 9.6,
  // about ten degrees down) the hall has no depth to spend: the fighter out on the
  // mark and the fighter standing two units behind him land on the same band of
  // screen, and one covers the other. Looking further down turns depth into screen
  // height, which is what separates the mark from the row — and what lets the row
  // itself read as an arc rather than a line.
  dir: [0, 3.5, 9.0],    // camera offset from its look point (its length = the guess)
  moveSec: 0.55,         // how long the framing change takes (ТЗ: about half a second)

  // The slice of the screen the composition has to land in, as fractions of the
  // canvas. OVERVIEW owns nearly the whole frame. WORK keeps clear of the panels:
  // upright they take the bottom of the screen, sideways the right of it, and the
  // fighter being worked on must not end up behind them.
  rect: {
    overviewPortrait:  { x0: 0.05, x1: 0.95, y0: 0.12, y1: 0.84 },
    overviewLandscape: { x0: 0.05, x1: 0.95, y0: 0.14, y1: 0.90 },
    // WORK has to dodge TWO panels, not one. The tree takes the right of a wide
    // screen (the bottom of a tall one), and the fighter's card sits in the bottom
    // corner on top of that — so the clear ground is the band ABOVE the card and
    // BESIDE the tree. Framing into the whole left half put his legs behind the
    // card; these rectangles are that band.
    workPortrait:      { x0: 0.10, x1: 0.90, y0: 0.06, y1: 0.46 },
    workLandscape:     { x0: 0.06, x1: 0.52, y0: 0.08, y1: 0.68 },
  },
  minDist: 4.5,
  maxDist: 90,           // ten on one arc is wide — the fit must be allowed to back off
};
// How the rest of the hall sinks while one fighter's card and tree are open.
const WORK = {
  dimSkin: 0.72,         // how far the others' bodies fade toward the room (0..1)
  dimGlow: 0.25,         // …and their floor pools
};
// Core brightness. Exactly ONE core burns in this hall — the picked fighter's.
// Everyone else's is OUT: `rest` is low enough to read as a dark facet in the
// chest, not as a lamp, which is what "все горят" looked like at 0.14.
const CORE_LIGHT = {
  rest: 0.05,            // multiplier on the gem colour / halo for everyone but the pick
  lerp: 7.0,             // 1/s easing toward the target — the light moves, never snaps
};
// The legend trainer floating over the plate centre. Lifted clear of the arc: his
// feet must hang well above the tallest head, or he reads as standing among them.
const LEGEND = {
  height: 4.7,         // plate-top → legend feet. Heads reach 1.77, but height alone
                       // is not the test: seen from a camera that looks DOWN, depth
                       // also reads as screen height, so he has to clear the row on
                       // SCREEN, not just in the world. At 4.7 his pedestal sits a
                       // clear body's width above the tallest head in the arc.
  driftSpeed: 0.5,     // Lissajous glide rate (never static)
  driftRadius: 0.7,    // horizontal glide half-extent
  bobAmplitude: 0.18,  // vertical bob
  hazeDensity: 90,     // warm cloud particle count
};
// Палитра ядер — из общих токенов. RAIDER здесь раньше горел #FFD930: это
// ВТОРОЙ тон, а не основной, и в зале боец светился не тем цветом, что в
// магазине. Отменено (Документ А 2.3): читаемость под янтарными лампами
// вытягивается силой свечения, а не подменой цвета.
const CORE_PALETTE = [
  { id: 'natisk', hue: CORE_HUE.natisk },
  { id: 'nalet',  hue: CORE_HUE.nalet  },
  { id: 'skala',  hue: CORE_HUE.skala  },
  { id: 'zasada', hue: CORE_HUE.zasada },
];
const LEGEND_HUE = AMBER;   // янтарь HEXARCH — единственный тёплый якорь зала

// ─────────────────────────── Ambient dust — REMOVED on PVE ───────────────────────────
// The drifting amber dust (home recipe) was dropped from this scene per design — no
// floating particles on the PVE stage. (HomeScene keeps its own dust untouched.)

// ── Per-fighter under-glow (home GLOW recipe, own copy) — tinted to THE fighter's
//    COLD core hue (NOT amber), so every member stands in a faint pool of its own
//    core light and the legend's amber stays the only warm anchor. ──
const GLOW = { radius: 1.3, opacity: 0.16, follow: 0.08, yLift: 0.02 };
function buildUnderGlow(colorHex, topY) {
  const tex = makeRadialTexture('rgba(255,255,255,0.85)', 'rgba(255,255,255,0.12)', 0.5);
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(colorHex), transparent: true, opacity: GLOW.opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(GLOW.radius * 2, GLOW.radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = topY + GLOW.yLift;
  const follow = (pos) => {
    mesh.position.x += (pos.x - mesh.position.x) * GLOW.follow;
    mesh.position.z += (pos.z - mesh.position.z) * GLOW.follow;
  };
  const dispose = () => { mesh.geometry.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, follow, dispose };
}
// Lamp-haze halos REMOVED on PVE: the floating additive amber sprites that hung
// around each shade are gone — the lamps now read as lit from inside the dish (the
// visible bulb + the PointLight), with no blurry orange blobs in the air.

// ── How big the arc is, for a given number of fighters ──────────────────────
// Fighters are spaced by ARC.step ALONG the arc, which is then wrapped onto a
// circle of ARC.radius whose near side faces the player: the middle spot sits
// furthest away, the ends come forward. That is the shape the hall wants, and it
// is also what makes the composition legible — because every spot differs from its
// neighbour ACROSS the screen and not only in depth, no fighter stands behind
// another.
const halfAngle = (n) => (n <= 1 ? 0 : (ARC.step * (n - 1)) / 2 / ARC.radius);
const arcHalfWidth = (n) => ARC.radius * Math.sin(halfAngle(n));      // how far the ends reach sideways
const arcBow = (n) => ARC.radius * (1 - Math.cos(halfAngle(n)));      // how far forward they come

// ── The plate, worked out rather than typed ─────────────────────────────────
// For the biggest roster a step must hold, measure what has to sit on the plate:
// the back of the deepest zone, the front of the mark, the outermost body, and
// SLAB.edge of bare ground all round. Then take the smallest plate OF THE FIXED
// SHAPE that contains it — so every step is the same plate, only bigger.
function slabFor(maxCount) {
  const backRel = -(ZONE.halfZ + BODY.halfW);                       // deepest point, from the arc's centre
  const frontRel = arcBow(maxCount) + MARK.ahead + BODY.halfW;      // the mark's front edge
  const needHalfW = arcHalfWidth(maxCount) + ZONE.halfX + BODY.halfW + SLAB.edge;
  const needHalfD = (frontRel - backRel) / 2 + SLAB.edge;
  // One shape, scaled until both fit: a unit plate is SLAB.aspect wide by 1 deep.
  const scale = Math.max((2 * needHalfW) / SLAB.aspect, 2 * needHalfD);
  return { width: SLAB.aspect * scale, depth: scale };
}

// Which step a roster falls into, and the biggest roster that step must hold.
function stepFor(count) {
  const n = Math.max(0, count);
  for (let i = 0; i < SLAB.steps.length; i++) if (n <= SLAB.steps[i]) return i;
  return SLAB.steps.length - 1;
}

// Everything the hall's geometry needs, derived together so it cannot disagree
// with itself: which plate, how big, where the arc stands on it, where the mark is.
//
// The arc is placed so that the composition — its deepest zone through to the front
// of the mark — sits CENTRED on the plate. That is what puts an equal margin of
// bare ground behind the row and in front of the mark, and it is computed for the
// step's MAXIMUM roster so the row does not slide about as fighters are added.
function composeFor(count) {
  const step = stepFor(count);
  const maxCount = SLAB.steps[step];
  const slab = slabFor(maxCount);
  const backRel = -(ZONE.halfZ + BODY.halfW);
  const frontRel = arcBow(maxCount) + MARK.ahead + BODY.halfW;
  const arcZ = -(frontRel + backRel) / 2;
  return { step, maxCount, slab, arcZ };
}

// ── Roster layout — ONE arc, DETERMINISTIC, so a fighter keeps his place between
//    visits and across a rotation. Fewer fighters do not leave holes at the ends:
//    the arc is always centred, so a short roster closes toward the middle.
function layoutRoster(count, arcZ) {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 0, z: arcZ }];
  const R = ARC.radius;
  const half = halfAngle(count);
  const spots = [];
  for (let i = 0; i < count; i++) {
    const a = -half + (2 * half * i) / (count - 1);
    spots.push({ x: R * Math.sin(a), z: arcZ + R * (1 - Math.cos(a)) });
  }
  return spots;
}

// The personal zone around a spot — what the wander director may walk him inside.
// Axis-aligned because that is what the director takes; narrow across the arc, deep
// along the view (see ZONE).
function zoneFor(spot) {
  return {
    xMin: spot.x - ZONE.halfX, xMax: spot.x + ZONE.halfX,
    zMin: spot.z - ZONE.halfZ, zMax: spot.z + ZONE.halfZ,
  };
}

// Where the four lamps hang. Two out over the ends of the arc, two over the mark,
// their spread taken from the plate rather than typed — a table written for one
// plate leaves the ends of a bigger one in the dark. Still FOUR: the count, the
// colour and the no-shadow rule are untouched, so the phone's bill does not move.
function lampPositions() {
  const endX = arcHalfWidth(compose ? compose.maxCount : ARC.maxCount) * 0.80;
  const arcRowZ = (compose ? compose.arcZ : 0) - 0.4;
  const markZ = mark ? mark.z : 2;
  return [
    { x: -endX, z: arcRowZ, drop: 0.0 },
    { x: endX, z: arcRowZ, drop: 0.7 },
    { x: -ARC.step * 1.2, z: markZ, drop: 0.3 },
    { x: ARC.step * 1.35, z: markZ, drop: 1.0 },
  ];
}

// Build (or rebuild) the hall's four lamps over the CURRENT plate. The same four
// lamps as every other hall — spread, not multiplied: the count, the colour and the
// no-shadow rule are untouched, so the phone's bill does not move. What changed is
// the room — a lamp tuned to carry across a 6-unit plate does not reach the ends of
// a 13-unit arc, and the fighters out there came out as black cut-outs.
//
// REACH FOLLOWS THE PLATE. Four lamps is the rule, so a bigger room cannot be paid
// for with more of them — it is paid for by each of the four carrying further. A
// point light falls off as the square of the distance, so when the plate grows by k
// the lamp has to reach k further and burn k² brighter just to hold the SAME lit
// level on the floor. Without this the large step came out visibly darker than the
// small one (measured: plate luminance 24 → 17, peak 36 → 18) and the far bodies
// read as black cut-outs on a phone held upright.
function lampReach() {
  const base = slabFor(SLAB.steps[0]).width;     // the smallest plate — the level we hold
  const k = Math.max(1, (compose ? compose.slab.width : base) / base);
  return { intensity: LAMP_REACH.intensity * k * k, distance: LAMP_REACH.distance * k };
}

function buildHallLamps() {
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); }
  const reach = lampReach();
  lamps = buildLamps({
    ...HALL_LAMPS,
    hangLift: LAMP_REACH.hangLift,
    light: { ...HALL_LAMPS.light, intensity: reach.intensity, distance: reach.distance },
    positions: lampPositions(),
  }, reduced);
  scene.add(lamps.group);
}

// Where the picked fighter stands: in FRONT of the arc's foremost spot, clear of
// every zone, and — this is the part that is easy to get wrong — in the GAP between
// the two middle spots rather than dead on the centre line. With an odd roster the
// centre line has a fighter standing on it, and the man out on the mark then covers
// him. Half a step across puts the mark exactly as far from its nearest neighbour
// as the arc's own neighbours are from each other. With an even roster the centre
// line IS the gap, so the mark stays dead centre.
function markFor(count, arcZ) {
  const spots = layoutRoster(count, arcZ);
  let frontZ = arcZ;
  for (const sp of spots) if (sp.z > frontZ) frontZ = sp.z;
  const offCentre = count >= 3 && count % 2 === 1 ? -ARC.step / 2 : 0;
  return { x: offCentre, z: frontZ + MARK.ahead };
}

// ── Reaching INTO a fighter from outside (the sanctioned pattern — the combat
//    file itself is never edited). buildFighter exposes its joints, and the core
//    gem + halo hang on the torso, so they can be found and driven from here.
//
//    One condition, and it is the whole trick: the fighter's own update() writes
//    the halo's opacity every frame, so these brightnesses must be applied AFTER
//    fighter.update() in the same frame. The gem's COLOUR and the body material
//    are not touched per frame (only by the dev grey toggle and the death
//    dissolve, neither of which happens in this hall), so those hold on their own.
function coreParts(fighter) {
  const torso = fighter.joints && fighter.joints.torso;
  if (!torso) return null;
  let gem = null, halo = null;
  for (const o of torso.children) {
    if (!halo && o.isSprite) halo = o;
    else if (!gem && o.isMesh && o.geometry && o.geometry.type === 'OctahedronGeometry') gem = o;
  }
  if (!gem && !halo) return null;
  return { gem, halo, gemBase: gem ? gem.material.color.clone() : null };
}

// The body material: one MeshStandardMaterial per fighter (buildFighter makes it
// per call), shared by all of THAT body's boxes — exactly the handle needed to
// sink one fighter into the dark without touching the others.
function skinOf(fighter) {
  let mat = null;
  fighter.group.traverse((o) => {
    if (!mat && o.isMesh && o.material && o.material.isMeshStandardMaterial) mat = o.material;
  });
  return mat ? { mat, base: mat.color.clone() } : null;
}

// ── Framing: measured, not guessed ─────────────────────────────────────────
// The hall has to sit in a given slice of the screen (CAM.rect) whatever shape
// the screen is and whoever is standing on the plate. Rather than model that —
// the camera looks down a few degrees, the bodies stand at different depths and
// scales, and the row's width depends on how many there are — build a pose, look
// at where it actually puts things, and correct. Three or four passes settle it.
// This runs on build, on resize and when the framing changes; never per frame.
const _fitCam = new THREE.PerspectiveCamera();
const _fitV = new THREE.Vector3();
const _fitDir = new THREE.Vector3();

// The corners the framing has to keep on screen, in world space.
//
// Measured against the STANDING SPOTS and the MARK, never against where the bodies
// happen to be this frame: everyone is always easing somewhere (a stroll inside a
// zone, a walk out to the mark or back), and a framing measured off live positions
// would breathe along with them. The zone half-extents are added on, so a body that
// wanders to the edge of its patch is still inside the frame.
function framePoints(working) {
  const pts = [];
  const topY = slab ? slab.refs.topY : 0;
  const body = (x, z, padX, padZ) => {
    pts.push([x - BODY.halfW - padX, topY, z + padZ], [x + BODY.halfW + padX, topY + BODY.height, z - padZ]);
  };

  if (working) {
    // Him on the mark, plus a margin of air — and all of it at HIS depth. A patch
    // of floor spanning several units of depth was tried and pulled the framing
    // right back: at this camera's shallow angle depth reads as a lot of screen
    // height, so the floor drove the fit and the fighter it was meant to frame came
    // out small.
    const m = mark;
    body(m.x, m.z, 0.30, 0);
    pts.push([m.x - 0.80, topY - 0.30, m.z], [m.x + 0.80, topY + BODY.height + 0.45, m.z]);
    return pts;
  }

  // The whole arc — every spot with its zone around it — and the mark, which is
  // part of the composition whether or not anybody is standing on it.
  for (const r of roster) body(r.home.x, r.home.z, ZONE.halfX, ZONE.halfZ);
  body(mark.x, mark.z, 0.2, 0.2);

  // The plate itself is part of the composition now that it is the hall's only
  // ground: its far corners and its near rim have to be on screen, or the floor
  // runs off the bottom of the picture and the hall loses its edges.
  if (compose) {
    const hw = compose.slab.width / 2;
    const hd = compose.slab.depth / 2;
    for (const x of [-hw, hw]) for (const z of [-hd, hd]) pts.push([x, topY, z]);
  }

  // The trainer is the hall: he is in frame whether or not anyone else is, and his
  // drift is included so the fit does not breathe with him.
  const feet = topY + LEGEND.height;
  pts.push(
    [-LEGEND.driftRadius - 0.85, feet - 0.55, 0],
    [LEGEND.driftRadius + 0.85, feet + 2.35, 0],
  );

  // Nobody on the floor: keep enough of the empty hall in frame that the room still
  // reads as a place with nobody in it, not as a crop.
  if (!roster.length) {
    for (const x of [-2.6, 2.6]) for (const z of [compose ? compose.arcZ : 0, mark.z]) pts.push([x, topY, z]);
  }
  return pts;
}

// Build the pose for a framing. Returns { pos, look } in the shape applyCamera wants.
function frameFor(working) {
  const portrait = viewH >= viewW;
  const r = working
    ? (portrait ? CAM.rect.workPortrait : CAM.rect.workLandscape)
    : (portrait ? CAM.rect.overviewPortrait : CAM.rect.overviewLandscape);
  _fitDir.set(CAM.dir[0], CAM.dir[1], CAM.dir[2]);
  let dist = _fitDir.length();
  _fitDir.normalize();

  const pts = framePoints(working);
  const look = new THREE.Vector3(0, (slab ? slab.refs.topY : 0) + 1.5, 0);
  const pose = () => ({
    look: [look.x, look.y, look.z],
    pos: [look.x + _fitDir.x * dist, look.y + _fitDir.y * dist, look.z + _fitDir.z * dist],
  });
  if (!pts.length || !viewW || !viewH || !camera) return pose();

  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tx = (r.x0 + r.x1) / 2 * viewW; const ty = (r.y0 + r.y1) / 2 * viewH;
  const tw = (r.x1 - r.x0) * viewW; const th = (r.y1 - r.y0) * viewH;

  for (let pass = 0; pass < 5; pass++) {
    const p = pose();
    _fitCam.fov = camera.fov; _fitCam.aspect = camera.aspect;
    _fitCam.near = camera.near; _fitCam.far = camera.far;
    _fitCam.position.set(p.pos[0], p.pos[1], p.pos[2]);
    _fitCam.up.copy(camera.up);
    _fitCam.lookAt(look);
    _fitCam.updateProjectionMatrix();
    _fitCam.updateMatrixWorld(true);

    let left = Infinity; let right = -Infinity; let top = Infinity; let bottom = -Infinity;
    for (const [x, y, z] of pts) {
      _fitV.set(x, y, z).project(_fitCam);
      const px = (_fitV.x * 0.5 + 0.5) * viewW;
      const py = (-_fitV.y * 0.5 + 0.5) * viewH;
      if (px < left) left = px; if (px > right) right = px;
      if (py < top) top = py; if (py > bottom) bottom = py;
    }
    if (!Number.isFinite(left) || !Number.isFinite(top)) break;

    // Fit — grows AND shrinks, so a tall narrow screen stops cropping the row and
    // a wide one stops leaving half the frame empty.
    if (pass < 4) {
      dist = THREE.MathUtils.clamp(dist * Math.max((right - left) / tw, (bottom - top) / th),
        CAM.minDist, CAM.maxDist);
    }
    // Centre on the target rect. Moving the look point translates the camera with
    // it (the offset is fixed), so this is a straight pan — no tilt is introduced
    // and the hall stays frontal.
    const perPx = (2 * dist * tanV) / viewH;
    look.x += ((left + right) / 2 - tx) * perPx;
    look.y -= ((top + bottom) / 2 - ty) * perPx;
  }
  return pose();
}

// The arc does not depend on the screen's shape: bowing it harder to save width
// would put fighters behind one another, which is the one thing the composition
// may not do. So a rotation moves nobody — only the camera re-fits. (There used to
// be a relayout() here that re-packed the row for portrait; it is gone with the
// two-row formation it served.)

// Set (or ease toward) one of the two framings. `snap` places the camera at once
// — used on build and whenever motion is reduced.
function applyCamera(frame, snap) {
  camPosTo.set(frame.pos[0], frame.pos[1], frame.pos[2]);
  camLookTo.set(frame.look[0], frame.look[1], frame.look[2]);
  if (snap) {
    camPos.copy(camPosTo); camLook.copy(camLookTo);
    if (camera) { camera.position.copy(camPos); camera.lookAt(camLook); }
  }
}

// Rest → lit for one body's core, and normal → sunk into the dark for its skin.
// Called every frame AFTER fighter.update() (see coreParts).
const _lightC = new THREE.Color();
function applyFighterLight(r) {
  const glow = CORE_LIGHT.rest + (1 - CORE_LIGHT.rest) * r.lit;
  if (r.parts) {
    if (r.parts.gem && r.parts.gemBase) {
      r.parts.gem.material.color.copy(r.parts.gemBase).multiplyScalar(glow);
    }
    if (r.parts.halo) r.parts.halo.material.opacity *= glow;
  }
  if (r.skin) {
    r.skin.mat.color.copy(r.skin.base).lerp(_lightC.setHex(0x0b0d14), WORK.dimSkin * r.dim);
  }
  if (r.glow && r.glow.mesh && r.glow.mesh.material) {
    const m = r.glow.mesh.material;
    if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
    m.opacity = m.userData.baseOpacity * (1 - (1 - WORK.dimGlow) * r.dim) * (0.16 + 0.84 * r.lit);
  }
}

// Point a body at (x, z). The model faces −Z at rotation 0 (see buildFighter).
function faceTowards(group, x, z) {
  group.rotation.y = Math.atan2(-(x - group.position.x), -(z - group.position.z));
}

// Ease a standing body around to face (x, z). While a fighter is WALKING the
// locomotion owns his rotation and this is not called — turning him then would
// fight his own footwork.
function turnTowards(group, x, z, k) {
  const want = Math.atan2(-(x - group.position.x), -(z - group.position.z));
  let d = (want - group.rotation.y) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  group.rotation.y += d * k;
}

// ─────────────────────────────────── scene plumbing ───────────────────────────────────
// hover  — a body is under the pointer (or was just tapped): { id, callsign, x, y }, or null
// pick   — this fighter was chosen
// exit   — a tap landed on empty space while a fighter was picked
const emit = defineEmits(['hover', 'pick', 'exit']);

const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, slab, resizeObserver, clock;
let viewW = 0, viewH = 0;   // canvas CSS size — the framing is measured in these
let resizePending = 0;      // coalescing frame for the resize observer
// Pre-load readiness: emit once after the first frame is rendered so the
// bootstrap splash (page-load) and the SPA transition cover can lift on real
// pve-scene readiness. Per-mount (script-setup local) so it re-fires on every
// fresh mount, not just the first of the session.
// Loading-screen handle — see services/sceneLoading.js. The hall lifts the screen
// on its declared stages plus three settled frames, not on the first frame drawn.
let load = null;
let onVisibility;
let onPointerMove = null, onPointerDown = null, onPointerUp = null;
let hoveredId = null;        // whose core the pointer is over (overview only)
// WHO IS CURRENT vs WHO IS BEING WORKED ON — two different things, deliberately:
//   currentId — the fighter standing on the MARK, and the ONE core alight in the
//               hall. Always set while the roster is not empty, including on
//               arrival, so the player never meets a room of eight lit chests.
//   workingId — whose card and tree are open. That, and only that, changes the
//               framing and sinks the rest of the hall into the dark. Keeping them
//               apart is what lets the hall have a lit pick without the panels
//               springing open by themselves.
let currentId = null;
let workingId = null;
let director = null;         // the wander / errand director (forgeWander.js)
let mark = { x: 0, z: 0 };   // where the current fighter stands
let compose = null;          // which plate step, how big, where the arc stands on it
let rosterCount = 0;         // read once, at the moment the hall opens
const camPos = new THREE.Vector3();      // where the camera IS
const camLook = new THREE.Vector3();     // and what it looks at
const camPosTo = new THREE.Vector3();    // where it is going
const camLookTo = new THREE.Vector3();
let prevT = 0;
let reduced = false;
let lamps = null, backdrop = null;
let legend = null, legendPresence = null, legendParts = null;
// [{ id, callsign, fighter, glow, home, scale, parts, skin, lit, dim }]
const roster = [];


function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

onMounted(() => {
  // Build stages, in the order they happen below.
  load = beginSceneLoad(['renderer', 'slab', 'atmosphere', 'roster', 'legend']);

  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const targetFPS = coarse ? 30 : 60;

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const maxDPR = lowPowerDevice() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  // The hall's OWN fog, not the arena's. It was reading FOG.arena — a borrowed
  // knob, and the borrowing was silent because the two numbers happen to be
  // equal today (both 0.03), so nothing looked wrong. It matters anyway: the
  // hall is the one room whose camera has to retreat as the plate grows, and
  // the day its haze needs its own number, turning it must not touch the fight.
  // Tone comes from FOG_COLOR (= --void, the same ground the backdrop is
  // painted on) so distance dissolves objects instead of lighting them.
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG.forge.density);

  viewW = w; viewH = h;   // the framing is measured in canvas pixels — have them before the first fit
  camera = new THREE.PerspectiveCamera(FOV.forge, w / h, CAMERA.near, CAMERA.far.forge);

  // Lighting — same recipe as the arena/home (one warm key + cool fill).
  const key = new THREE.DirectionalLight(LIGHTING.key.color, LIGHTING.key.intensity);
  key.position.set(...LIGHTING.key.position);
  scene.add(key);
  scene.add(new THREE.AmbientLight(LIGHTING.amb.color, LIGHTING.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHTING.hemi.sky, LIGHTING.hemi.ground, LIGHTING.hemi.intensity));

  load.stage('renderer');

  // The roster is read ONCE, here, at the moment the hall opens — and everything
  // downstream (which plate, how big, where the arc stands) follows from this one
  // number. Nothing re-reads it while the player is inside: the roster is edited in
  // the shop, on another route, so arriving here always rebuilds the hall. That is
  // also what makes "the plate never shrinks under you" true by construction.
  const members = (store.getters['roster/fighters'] || []).slice(0, ARC.maxCount);
  rosterCount = members.length;

  // --- The plate. ONE ground: the hall's own plate, built at the size this roster
  //     needs (forgeSlab.js). The combat plate is not used here — it cannot be
  //     given a size without opening a protected file — and there is no second
  //     floor around it any more: everything in the hall stands on this. ---
  compose = composeFor(rosterCount);
  mark = markFor(rosterCount, compose.arcZ);   // the lamps need it, and they hang before the bodies stand
  slab = buildForgeSlab({
    width: compose.slab.width,
    depth: compose.slab.depth,
    height: SLAB.height,
    maxAniso: renderer.capabilities.getMaxAnisotropy(),
  });
  scene.add(slab.group);
  const topY = slab.refs.topY;
  load.stage('slab');

  // Atmosphere / depth — warm dim lamp room-fill + a background dome (warm/dark FILL,
  // no pink, no new accent). PVE drops the home's lamp-haze halos and drifting dust.
  // hangLift поднимает плафоны над бойцами / из кадра. Параметры самого света
  // (цвет, яркость, дальность, затухание) те же, что в остальных залах.
  // The SAME four lamps as every other hall — spread wider, not multiplied. Their
  // stock positions (±1.9 X) hang over the slab, which was the whole hall when the
  // roster stood on it; the arc now reaches ±6, and four lamps bunched in the
  // middle left its ends in the dark. Spreading them is a position override from
  // outside — the shared lamp file is untouched and the count is unchanged, so the
  // phone pays for four PointLights exactly as before.
  buildHallLamps();
  backdrop = buildBackdrop({ radius: 45, centerY: 1.6 }, renderer.capabilities.getMaxAnisotropy());
  scene.add(backdrop.mesh);
  load.stage('atmosphere');

  // --- Roster: the player's OWN fighters, one body each, on their own spot on the
  //     arc. They LIVE here: each owns a personal zone and strolls inside it on his
  //     own footwork, driven from outside by the wander director (forgeWander.js) —
  //     the combat file is only instanced, never edited, and nothing in this hall
  //     moves a body by writing its position.
  //     The record carries only a core id; the hue comes from this scene's own
  //     palette. Read once at build time — the roster is edited in the shop, on
  //     another route, so arriving here always rebuilds the scene. ---
  const spots = layoutRoster(members.length, compose.arcZ);
  director = createForgeWanderDirector();

  spots.forEach((p, i) => {
    const m = members[i];
    const core = CORE_PALETTE.find((c) => c.id === m.core) || CORE_PALETTE[0];
    const behavior = resolveBehavior(core.id, []);

    const idx = i;   // captured for this body's own getFoePos
    const fighter = buildFighter(core.hue, {
      side: 'player',
      coreId: core.id,
      behavior,
      // The plate is the world here — a body may not be walked off its edge.
      bounds: { x: compose.slab.width / 2, z: compose.slab.depth / 2 },
      neutralColor: false,
      getFoePos: () => (director ? director.foePos(idx) : null),
    });
    fighter.group.position.set(p.x, topY, p.z);
    fighter.setReducedMotion(reduced);
    // SUPPRESS the over-head HP plate (the only Sprite added DIRECTLY to the
    // group) — same external approach as the home.
    fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
    scene.add(fighter.group);

    const glow = buildUnderGlow(core.hue, topY);
    glow.mesh.position.set(p.x, topY + GLOW.yLift, p.z);
    scene.add(glow.mesh);

    roster.push({
      id: m.id,
      callsign: m.callsign,
      fighter,
      glow,
      home: new THREE.Vector3(p.x, topY, p.z),   // the middle of his zone
      zone: zoneFor(p),
      parts: coreParts(fighter),       // gem + halo, for the rest/lit brightness
      skin: skinOf(fighter),           // this body's own material (per-instance)
      lit: 0,                          // eased 0…1 core brightness
      dim: 0,                          // eased 0…1 "sunk into the dark"
    });
  });

  // Everyone faces the player to start with. Aim at the overview camera spot rather
  // than straight ahead, so the arc ends turn slightly inward and the row reads as
  // gathered rather than as a firing line.
  for (const r of roster) faceTowards(r.fighter.group, CAM.dir[0], CAM.dir[2]);

  director.attach(roster.map((r) => ({ fighter: r.fighter, zone: r.zone })), { reduced });

  // The hall always has a current fighter: the first of the roster stands ON the
  // mark from the moment the room opens (ТЗ — one fighter is on the mark and picked;
  // a refresh restores him there at once, with no walk-up). His card is NOT opened
  // by this: that is `workingId`, and it stays null until the player taps.
  if (roster.length) {
    currentId = roster[0].id;
    roster[0].fighter.group.position.set(mark.x, topY, mark.z);
    roster[0].lit = 1;
    if (director) director.halt(0);
    faceTowards(roster[0].fighter.group, CAM.dir[0], CAM.dir[2]);
  }
  load.stage('roster');

  // --- Legend: a buildFighter body with the amber core, idle only (NEVER added to
  //     the wander), floating LEGEND.height over the plate centre, drifting forever
  //     inside its warm cloud (legendPresence).
  //     He hangs HIGH — feet well above the tallest head — and over the open floor
  //     between the arc and the mark, so he presides over the hall instead of
  //     standing behind the row's shoulders, and his cloud crosses nobody's zone. ---
  const legendBehavior = resolveBehavior(null, []);
  legend = buildFighter(LEGEND_HUE, { side: 'player', coreId: null, behavior: legendBehavior, bounds: { x: 1, z: 1 }, neutralColor: false, getFoePos: () => null });
  legend.setReducedMotion(reduced);
  legend.group.children.forEach((o) => { if (o.isSprite) o.visible = false; }); // no HP plate
  scene.add(legend.group);
  legendPresence = createLegendPresence({
    baseX: 0, baseZ: 0, floorY: topY,
    driftSpeed: LEGEND.driftSpeed, driftRadius: LEGEND.driftRadius,
    bobAmplitude: LEGEND.bobAmplitude, hazeDensity: LEGEND.hazeDensity,
    hazeOpacity: LEGEND.hazeOpacity,
    PEDESTAL: { glow: LEGEND.pedestalGlow },
    SMOKE: { opacity: LEGEND.smokeOpacity },
    ORBIT: { highAboveTop: LEGEND.height }, // feet height at the high/centre phase = LEGEND.height
    reduced,
  });
  // …and his own core, held under the pick's. Same handle the roster cores use,
  // applied after his update() for the same reason: update() rewrites the halo.
  legendParts = coreParts(legend);
  legend.group.position.copy(legendPresence.position);
  scene.add(legendPresence.group);
  scene.add(legendPresence.trail); // world-space descent smoke wisps
  load.stage('legend');

  // --- Camera: FIXED and frontal. No orbit, no auto-rotate (owner's call): the
  //     hall is a workplace. Two framings — the whole row, and closer-in with the
  //     picked fighter on the left — eased toward, never cut to. ---
  applyCamera(frameFor(false), true);

  // --- Pointer: hover lights ONE core and names it; a tap picks that fighter.
  //     Same shape as the mode islands (one hovered at a time, eased `lit`), but
  //     the light lives on the fighter, so it is driven in the loop below. ---
  const _ray = new THREE.Raycaster();
  const _ptr = new THREE.Vector2();
  let downAt = null;

  function pickAt(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    _ptr.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _ptr.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    _ray.setFromCamera(_ptr, camera);
    const hit = _ray.intersectObjects(roster.map((r) => r.fighter.group), true)[0];
    if (!hit) return null;
    let o = hit.object;
    while (o && !roster.some((r) => r.fighter.group === o)) o = o.parent;
    return o ? roster.find((r) => r.fighter.group === o) : null;
  }

  // Screen position of a body's head — where its callsign hangs.
  const _v = new THREE.Vector3();
  function tagPos(entry) {
    const rect = renderer.domElement.getBoundingClientRect();
    _v.copy(entry.fighter.group.position);
    _v.y += 2.0;
    _v.project(camera);
    return { x: rect.left + (_v.x * 0.5 + 0.5) * rect.width, y: rect.top + (-_v.y * 0.5 + 0.5) * rect.height };
  }

  function emitHover(entry) {
    hoveredId = entry ? entry.id : null;
    if (!entry) { emit('hover', null); return; }
    const p = tagPos(entry);
    emit('hover', { id: entry.id, callsign: entry.callsign, x: p.x, y: p.y });
  }

  onPointerMove = (e) => {
    if (workingId || e.pointerType === 'touch') return;   // no hover while working / on touch
    emitHover(pickAt(e.clientX, e.clientY));
  };
  onPointerDown = (e) => { downAt = { x: e.clientX, y: e.clientY, entry: pickAt(e.clientX, e.clientY) }; };
  onPointerUp = (e) => {
    const d = downAt; downAt = null;
    if (!d) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;   // a drag, not a tap
    if (d.entry) {
      // Touch has no hover, so light the core for a beat BEFORE the framing
      // changes — the finger has to see what it hit.
      emitHover(d.entry);
      emit('pick', d.entry.id);
    } else if (workingId) {
      emit('exit');                                                  // tap on empty space
    }
  };
  const canvas = renderer.domElement;
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  // --- Render loop. FPS-capped; elapsed time drives wander + idle + drift. ---
  clock = new THREE.Clock();
  prevT = 0;
  const interval = 1000 / targetFPS;
  let lastFrame = 0;
  const _camDir = new THREE.Vector3();
  const loop = (time) => {
    // While a fighter's card and tree are open, the hall is a backdrop: one body
    // idling behind two opaque panels. Half the frames are plenty there, and the
    // panels are what actually costs on a phone.
    const iv = workingId ? Math.max(interval, 1000 / 30) : interval;
    if (time - lastFrame < iv) return;
    lastFrame = time;
    const t = clock.getElapsedTime();
    const dt = t - prevT;
    prevT = t;

    // Camera eases toward the current framing (snap when motion is reduced).
    const camK = reduced ? 1 : 1 - Math.exp(-(1 / (CAM.moveSec * 0.36)) * Math.min(0.05, dt));
    camPos.lerp(camPosTo, camK);
    camLook.lerp(camLookTo, camK);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    const dimK = reduced ? 1 : 1 - Math.exp(-4.0 * Math.min(0.05, dt));
    const glowK = reduced ? 1 : 1 - Math.exp(-CORE_LIGHT.lerp * Math.min(0.05, dt));
    const turnK = reduced ? 1 : 1 - Math.exp(-2.2 * Math.min(0.05, dt));

    // Strolls and errands: the director only moves each body's LURE — the walking
    // itself is the fighter's own locomotion, one frame later, inside update().
    director?.update(t, dt);

    for (let i = 0; i < roster.length; i++) {
      const r = roster[i];
      const isCurrent = r.id === currentId;

      r.fighter.update(t, camera);
      r.glow.follow(r.fighter.group.position);

      // A body that is walking steers itself; one that is standing is turned to
      // face the player — on the mark, and between strolls in his own zone.
      if (!director || director.isStill(i)) {
        turnTowards(r.fighter.group, camPos.x, camPos.z, turnK);
      }

      // …and only NOW the brightnesses, because update() rewrites the halo.
      // ONE core burns: the current fighter's. Hover only previews, and only while
      // no card is open.
      const litTarget = isCurrent ? 1 : (!workingId && r.id === hoveredId ? 0.55 : 0);
      const dimTarget = workingId && r.id !== workingId ? 1 : 0;
      r.lit += (litTarget - r.lit) * glowK;
      r.dim += (dimTarget - r.dim) * dimK;
      applyFighterLight(r);
    }

    // Legend: idle body, ride the drift, and slowly face the camera (presiding).
    legend?.update(t, camera);
    if (legendParts) {
      if (legendParts.gem && legendParts.gemBase) {
        legendParts.gem.material.color.copy(legendParts.gemBase).multiplyScalar(LEGEND.coreLevel);
      }
      if (legendParts.halo) legendParts.halo.material.opacity *= LEGEND.coreLevel;
    }
    if (legendPresence) {
      legendPresence.tick(t, dt);
      legend.group.position.copy(legendPresence.position);
      if (!reduced) {
        _camDir.set(camera.position.x - legend.group.position.x, 0, camera.position.z - legend.group.position.z);
        const desired = Math.atan2(-_camDir.x, -_camDir.z);
        let d = (desired - legend.group.rotation.y) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
        legend.group.rotation.y += d * (1 - Math.exp(-1.5 * Math.min(0.05, dt)));
      }
    }

    lamps?.tick?.(t);

    renderer.render(scene, camera);

    // One settled frame toward readiness — counted only once every stage above is
    // in, and reset by any re-fit (see applyResize).
    load.frame();
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else renderer.setAnimationLoop(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  const applyResize = () => {
    resizePending = 0;
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    viewW = cw; viewH = ch;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
    // The arc itself does not change with the screen's shape (see above), so a
    // rotation moves nobody — only the framing is rebuilt. Snap rather than ease:
    // this is a new screen, not a move.
    applyCamera(frameFor(!!workingId), true);
    // A new composition under ourselves — start the settled-frame count again.
    load?.unsettle();
  };
  resizeObserver = new ResizeObserver(() => {
    if (resizePending) return;
    resizePending = requestAnimationFrame(applyResize);
  });
  resizeObserver.observe(el);
});

// ── What the hall drives from outside ──────────────────────────────────────
// select(id) — make this fighter the current one: he WALKS out to the mark, whoever
//              was there WALKS back to his own zone, and the light moves to him at
//              once (the moment he sets off, not when he arrives). Also opens the
//              working framing, since the panels come up with it.
//              Unknown id → back to the overview, which is what happens if he was
//              deleted in another tab while his card was open.
// exitWork()  — close the panels. The current fighter STAYS on the mark and stays
//               lit: he is still the one the player picked.

// Send a fighter out to the mark, and whoever is standing there back home. Both
// leave at the same moment — neither waits for the other. Called with the roster
// INDEX, because that is what the director knows bodies by.
function makeCurrent(idx) {
  const entry = roster[idx];
  if (!entry || entry.id === currentId) return;   // already his: never restart the walk
  const prevIdx = roster.findIndex((r) => r.id === currentId);

  currentId = entry.id;    // the light moves NOW — the hall answers the tap at once

  if (reduced) {
    // Motion is reduced: no walking. Place them, do not slide them.
    const topY = slab ? slab.refs.topY : 0;
    if (prevIdx >= 0) roster[prevIdx].fighter.group.position.set(roster[prevIdx].home.x, topY, roster[prevIdx].home.z);
    entry.fighter.group.position.set(mark.x, topY, mark.z);
    return;
  }
  if (prevIdx >= 0) director?.sendHome(prevIdx);
  director?.sendTo(idx, mark.x, mark.z);
}

function select(id) {
  const idx = roster.findIndex((r) => r.id === id);
  if (idx < 0) { exitWork(); return; }
  makeCurrent(idx);
  workingId = id;
  hoveredId = null;
  applyCamera(frameFor(true), reduced);
}

function exitWork() {
  workingId = null;
  applyCamera(frameFor(false), reduced);
}

// growTo(count) — take the hall up to the plate a bigger roster needs, WITHOUT
// leaving and coming back.
//
// Two rules live here, both from the brief. The plate only ever GROWS inside one
// visit: a roster that got smaller keeps the bigger plate until the player next
// opens the hall, so the ground never shrinks under his feet. And the change is a
// MOVE, not a cut — the plate is swapped, everyone walks to their new place on
// their own legs (the director is handed their new zones; the man on the mark is
// sent to the new mark), and the camera EASES onto the new frame instead of
// jumping to it. Under reduced motion it places instead, like every other move.
//
// Nothing calls this today: the roster is edited in the shop, on another route, so
// in practice the step is settled once when the hall opens. It exists because the
// hall is the screen where owning more fighters will eventually show, and because
// growing had to be a move rather than a cut whenever it does happen.
function growTo(count) {
  if (!compose || !slab || !scene) return false;
  const next = composeFor(count);
  if (next.step <= compose.step) return false;   // same plate, or a smaller one — never shrink here
  compose = next;

  scene.remove(slab.group);
  slab.dispose();
  slab = buildForgeSlab({
    width: compose.slab.width,
    depth: compose.slab.depth,
    height: SLAB.height,
    maxAniso: renderer.capabilities.getMaxAnisotropy(),
  });
  scene.add(slab.group);

  // New places on the new plate. Writing the homes is the whole job: the director
  // walks each body to its new zone, so the row re-forms on foot.
  const topY = slab.refs.topY;
  const spots = layoutRoster(roster.length, compose.arcZ);
  mark = markFor(roster.length, compose.arcZ);
  roster.forEach((r, i) => {
    const sp = spots[i];
    if (!sp) return;
    r.home.set(sp.x, topY, sp.z);
    r.zone = zoneFor(sp);
    director?.setZone(i, r.zone);
  });
  const cur = roster.findIndex((r) => r.id === currentId);
  if (cur >= 0) {
    if (reduced) roster[cur].fighter.group.position.set(mark.x, topY, mark.z);
    else director?.sendTo(cur, mark.x, mark.z);
  }

  buildHallLamps();                        // the lamps go with the plate
  applyCamera(frameFor(!!workingId), reduced);   // …and the camera moves, never cuts
  return true;
}

defineExpose({ select, exitWork, growTo });

onBeforeUnmount(() => {
  load?.dispose();   // left mid-load → drop the screen and the wait with us
  if (resizeObserver) resizeObserver.disconnect();
  if (resizePending) { cancelAnimationFrame(resizePending); resizePending = 0; }
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (renderer) renderer.setAnimationLoop(null);
  if (renderer) {
    const c = renderer.domElement;
    if (onPointerMove) c.removeEventListener('pointermove', onPointerMove);
    if (onPointerDown) c.removeEventListener('pointerdown', onPointerDown);
    if (onPointerUp) c.removeEventListener('pointerup', onPointerUp);
  }
  if (director) { director.dispose(); director = null; }
  for (const r of roster) {
    if (r.glow) { scene.remove(r.glow.mesh); r.glow.dispose(); }
    if (r.fighter) r.fighter.dispose();
  }
  roster.length = 0;
  if (legendPresence) { scene.remove(legendPresence.group); scene.remove(legendPresence.trail); legendPresence.dispose(); }
  if (legend) legend.dispose();
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); }
  if (backdrop) { scene.remove(backdrop.mesh); backdrop.dispose(); }
  if (slab) { scene.remove(slab.group); slab.dispose(); slab = null; }
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.pve-scene-wrap {
  position: absolute;
  inset: 0;
  background: var(--scene-backdrop);
}
.pve-scene-canvas { display: block; width: 100%; height: 100%; }
.pve-scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--scene-vignette);
}
</style>
