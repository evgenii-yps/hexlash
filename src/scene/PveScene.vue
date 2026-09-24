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
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildBackdrop } from './hallBackdrop.js';
import { LAMPS as HALL_LAMPS, buildLamps } from './hallLamps.js';
import { buildForgeSlab } from './forgeSlab.js';
import { buildRoster, buildUpgrade, buildPunchBag, buildBuffShelf, buildCrossing } from './forgeProps.js';
import { makeRadialTexture } from './arenaTextures.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createLegendPresence } from './legendPresence.js';
import { createForgeWanderDirector } from './forgeWander.js';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { beginSceneLoad } from '@/services/sceneLoading.js';
import { DEV_MODE } from '@/services/devMode.js';
import { stateOf as trainingStateOf } from '@/services/training.js';
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
// ─────────── ВСТРАИВАНИЕ v1, шаг 1: соседний остров и предметы ───────────
// Числа перенесены из принятого макета /dev/forge как есть — это его эталон.
const TRAIN = {
  gap: 0.35,          // зазор между островами: дорога, а не пропасть
  rowMax: 5,          // груш в ряду; дальше второй ряд
  bagStep: 1.25,
  rowGap: 2.10,
  standAhead: 0.86,
  edge: 0.9,
};
// Переход между островами: насколько надпись на торце сдвинута от середины к
// тому краю, в сторону которого она ведёт. Доля полуширины острова.
const CROSS = {
  offset: 0.52,
  // Сколько горит розовым после нажатия. Не «пока палец на стекле»: у нажатия
  // пальцем между down и up бывает десяток миллисекунд, и разгорание, которое
  // идёт плавно, просто не успело бы начаться. Поэтому вспышка с фиксированным
  // сроком, дальше лужица гаснет сама своим же затуханием.
  flash: 0.35,
};

const CAM = {
  // ⚠️ РАКУРС ВЗЯТ С ДОМАШНЕГО ОСТРОВА (решение владельца 23.09.2026) и НЕ
  //    подбирается под композицию. Раньше здесь был свой угол и своя подгонка
  //    удаления под то, что лежит на полу; из-за подгонки зал стоял в лоб и
  //    слишком близко, а удаление ещё и разъезжалось между раскладками
  //    (замер: 0.61 ширины плиты в горизонтали против 2.15 в вертикали).
  //
  //    Откуда числа. Дома камера стоит в CAM_BASE (4.6, 5.2, 6.7) и смотрит на
  //    бойца в (0, topY + 1.1, 1.0), где topY = 0.5 (PLATFORM.height / 2).
  //    Смещение от цели — (4.6, 3.6, 5.7), длина 8.1615.
  //      подъём над горизонтом  atan2(3.6, 7.325) = 26.2°
  //      поворот от «в лоб»     atan2(4.6, 5.7)   = 38.9°
  //      удаление / ширина острова  8.1615 / 6 = 1.360
  //
  //    Сюда переносится НАПРАВЛЕНИЕ как есть (это чистые числа, угол один в
  //    один) и ПРОПОРЦИЯ удаления. Абсолютное домашнее число поставило бы
  //    камеру внутрь плиты: зал шире дома вдвое с лишним.
  dir: [4.6, 3.6, 5.7],     // то же смещение, что дома; сюда важно только направление
  distPerWidth: 8.1615 / 6, // удаление = столько ширин острова, сколько дома
  lookLift: 1.1,            // на сколько выше плиты смотрит камера — тоже домашнее
  moveSec: 0.55,            // how long the framing change takes (ТЗ: about half a second)
};
// How the rest of the hall sinks while one fighter's card and tree are open.
// СВОБОДНАЯ КАМЕРА (встраивание v1, ТЗ §1). Зал был фронтальным и закреплённым;
// теперь им крутят и приближают, как домашним островом.
//
// Числа коридора — ДОЛИ от подобранного стартового удаления, а не абсолютные.
// Урок с макета: там коридор строился от ширины плиты, подобранная поза уходила
// за его потолок, и controls.update() тут же дёргал камеру обратно — композиция
// разъезжалась. Доля этого не может по построению: старт всегда внутри коридора.
const ORBIT = {
  inFactor: 0.45,      // насколько близко пускаем относительно старта
  outFactor: 1.35,     // и насколько далеко
  polarMin: 0.30,      // под плиту не заглянуть
  polarMax: 1.40,
  damping: 0.08,
  returnDelay: 4.0,    // сколько стоять без рук, прежде чем вернуться в стартовую позу
  returnLerp: 1.6,
};

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

// ── Соседний остров: плита того же рода + груши. Из макета /dev/forge. ──
function bagLayout(n) {
  const rows = Math.ceil(n / TRAIN.rowMax);
  const per = Math.ceil(n / rows);
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / per);
    const inRow = Math.min(per, n - r * per);
    const k = i - r * per;
    out.push({ x: (k - (inRow - 1) / 2) * TRAIN.bagStep, z: (r - (rows - 1) / 2) * TRAIN.rowGap });
  }
  return {
    spots: out,
    width: (per - 1) * TRAIN.bagStep + 2 * (TRAIN.edge + 0.4),
    depth: (rows - 1) * TRAIN.rowGap + 2 * (TRAIN.edge + TRAIN.standAhead + 0.4),
  };
}

function buildNeighbourIsland(topY, count) {
  const lay = bagLayout(Math.max(1, count));
  trainSlab = buildForgeSlab({ width: lay.width, depth: lay.depth, height: SLAB.height });
  // Гасить разлом не надо: forgeSlab его не строит вовсе (см. его шапку).
  trainCx = compose.slab.width / 2 + TRAIN.gap + lay.width / 2;
  trainSlab.group.position.x = trainCx;
  scene.add(trainSlab.group);
  trainHalfW = lay.width / 2;
  trainHalfD = lay.depth / 2;
  // МЕСТА груш считаются сразу, САМИ ГРУШИ — нет. Плита пустая, пока никто не
  // занимается: десяток подвешенных тел с цепями висел в зале всегда, хотя
  // занятие — состояние редкое. Замер 23.09.2026: с пустыми грушами горизонталь
  // просела на 3.7 кадра против нынешнего зала, то есть за порог из ТЗ §5.
  bagTopY = topY;
  bagSpots = lay.spots.map((sp) => ({ x: trainCx + sp.x, z: sp.z }));
}

/**
 * Груши по числу ЗАНИМАЮЩИХСЯ, а не по числу мест.
 *
 * Вызывается оттуда же, откуда зал узнаёт о смене занятия (applyTraining), то
 * есть дважды за занятие, а не каждый кадр. Груша появляется, когда бойца на неё
 * отправили, и убирается, когда он закончил, — пустых висящих груш не бывает.
 */
function syncBags(busy) {
  for (const i of busy) {
    if (bags.has(i) || !bagSpots[i]) continue;
    const bag = buildPunchBag();
    bag.group.position.set(bagSpots[i].x, bagTopY, bagSpots[i].z);
    scene.add(bag.group);
    bags.set(i, bag);
  }
  for (const [i, bag] of bags) {
    if (busy.has(i)) continue;
    scene.remove(bag.group);
    bag.dispose?.();
    bags.delete(i);
  }
}

// ── ПЕРЕХОД МЕЖДУ ОСТРОВАМИ. По надписи на торце каждого: с главного — к
//    грушам, с тренировочного — обратно в зал.
//
//    ПОЧЕМУ НА ТОРЦЕ. Верх плиты занят: по нему бродят бойцы, на нём стоят
//    планшет, наковальня и полка. Торец — единственная поверхность зала, которую
//    ничто не может заслонить, и он смотрит ровно на камеру (подъём 26.2°).
//    Кнопка едет вместе с островом при свободном повороте камеры, потому что
//    она и есть часть острова, а не наклейка на экране.
function buildCrossings() {
  const face = (cx, halfW, halfD, key, label, side) => {
    const c = buildCrossing(label);
    // Торец — плоскость z = halfD; табличка выступает из неё вперёд сама.
    // По ширине она сдвинута к тому краю, в сторону которого ведёт: это
    // единственная подсказка направления, которая у надписи есть.
    c.group.position.set(cx + side * halfW * CROSS.offset, 0, halfD);
    c.key = key;
    c.pressUntil = 0;
    scene.add(c.group);
    propList.push({ key, obj: c });
    crossings.push(c);
  };
  face(0, compose.slab.width / 2, compose.slab.depth / 2, 'toTrain', t.value.forge.crossView, +1);
  if (trainHalfW > 0) face(trainCx, trainHalfW, trainHalfD, 'toHall', t.value.forge.crossHall, -1);
}

function buildForgeProps(topY) {
  const z = compose.slab.depth / 2 - 0.9;
  const spots = [
    { key: 'roster', make: buildRoster, x: -compose.slab.width * 0.05, z: z - 0.7 },
    { key: 'upgrade', make: buildUpgrade, x: compose.slab.width * 0.19, z: z - 1.6 },
    // Полка баффов — ЗАДЕЛ. Пустые ниши, класть в них нечего (решение 22.09.2026:
    // предметы баффов позже). Нажатие по ней ничего не открывает — и это
    // намеренно: пустая панель хуже, чем предмет, который пока молчит.
    { key: 'shelf', make: buildBuffShelf, x: -compose.slab.width * 0.28, z: z - 2.0 },
  ];
  for (const sp of spots) {
    const obj = sp.make();
    obj.group.position.set(sp.x, topY, sp.z);
    scene.add(obj.group);
    propList.push({ key: sp.key, obj });
  }
}

// ── ПОЗА КАМЕРЫ. Одна на зал, одна на соседний остров, обе по домашнему
//    правилу: домашнее направление плюс удаление, пропорциональное ширине
//    острова (см. CAM). Подбора под то, что лежит на полу, больше НЕТ — он и
//    был причиной чужого ракурса.
const _dirU = new THREE.Vector3();

/** Поза по домашнему рецепту: смотреть в (lookX, плита + lookLift, lookZ). */
function poseOver(lookX, lookZ, islandWidth) {
  _dirU.set(CAM.dir[0], CAM.dir[1], CAM.dir[2]).normalize();
  const dist = CAM.distPerWidth * islandWidth;
  const ly = (slab ? slab.refs.topY : 0) + CAM.lookLift;
  return {
    look: [lookX, ly, lookZ],
    pos: [lookX + _dirU.x * dist, ly + _dirU.y * dist, lookZ + _dirU.z * dist],
  };
}

/** Кадр зала. Аргумента больше нет: композиция одна и от выбора не зависит. */
function frameFor() {
  return poseOver(0, 0, compose ? compose.slab.width : 6);
}

// СТАТЫ БОЛЬШЕ НЕ ЛЕЖАТ НА ПЛИТЕ (решение владельца 24.09.2026). Здесь считалось
// место надписи — на шаг от бойца в сторону камеры. Надпись снята целиком: статы
// ушли в экранный слой (блок слева, см. ForgePanel section="stats"), потому что на
// полу их закрывало собственное тело бойца и половину — открытая панель.
/** Кадр соседнего острова — тем же домашним рецептом, от ЕГО ширины. */
function trainingFrame() {
  return trainHalfW > 0 ? poseOver(trainCx, 0, trainHalfW * 2) : frameFor();
}

// Set (or ease toward) one of the two framings. `snap` places the camera at once
// — used on build and whenever motion is reduced.
function applyCamera(frame, snap) {
  camPosTo.set(frame.pos[0], frame.pos[1], frame.pos[2]);
  camLookTo.set(frame.look[0], frame.look[1], frame.look[2]);
  // Стартовая поза — точка отсчёта и для свободной камеры: к ней она возвращается
  // после того, как игрок её отпустил, и от её удаления считается коридор.
  homePose = { pos: camPosTo.clone(), look: camLookTo.clone() };
  if (controls) {
    const d = camPosTo.distanceTo(camLookTo);
    controls.minDistance = d * ORBIT.inFactor;
    controls.maxDistance = d * ORBIT.outFactor;
    controls.target.copy(camLookTo);
  }
  if (snap) {
    camPos.copy(camPosTo); camLook.copy(camLookTo);
    if (camera) { camera.position.copy(camPos); camera.lookAt(camLook); }
    if (controls) { controls.target.copy(camLookTo); controls.update(); }
    camMoving = false;
  } else {
    camMoving = true;
  }
  idleSince = null; returning = false;
}

// Возврат в стартовую позу после простоя — как на домашнем острове. Пока игрок
// держит камеру, не вмешиваемся вовсе.
function idleReturn(dt) {
  if (!homePose || !controls || idleSince === null) return;
  if (!returning && (clock.getElapsedTime() - idleSince) < ORBIT.returnDelay) return;
  returning = true;
  const k = 1 - Math.exp(-ORBIT.returnLerp * Math.min(0.05, dt));
  camera.position.lerp(homePose.pos, k);
  controls.target.lerp(homePose.look, k);
  if (camera.position.distanceTo(homePose.pos) < 0.02) { returning = false; idleSince = null; }
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

/**
 * Качнуть грушу В МОМЕНТ УДАРА. Момент берётся из самого клипа бойца (`impacts` —
 * кадры касания, те же, по которым в бою проходит урон), а не по таймеру сцены:
 * иначе груша дёргалась бы отдельно от руки.
 *
 * ⚠️ Боя это не касается. Здесь только читается, где клип, — ни одного правила
 *    боя отсюда не вызывается и не меняется.
 */
function pushBag(i, fighter, spot) {
  const bag = bags.get(i);
  if (!bag) return;
  const info = fighter.getClipInfo?.();
  // Ничего не играет — или играет обманка, которая по мешку не проходит.
  if (!info || info.feint) { hitPrev.set(i, -1); return; }
  let prev = hitPrev.get(i);
  if (prev === undefined || info.elapsed < prev) prev = -1;   // начался новый клип
  for (const im of info.impacts) {
    if (prev < im && info.elapsed >= im) {
      const p = fighter.group.position;
      bag.hit(spot.x - p.x, spot.z - p.z, reduced);
      break;
    }
  }
  hitPrev.set(i, info.elapsed);
}

// ─────────────────────────────────── scene plumbing ───────────────────────────────────
// hover  — a body is under the pointer (or was just tapped): { id, callsign, x, y }, or null
// pick   — this fighter was chosen
// exit   — a tap landed on empty space while a fighter was picked
const emit = defineEmits(['hover', 'pick', 'exit', 'press']);

const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, slab, resizeObserver, clock;
// Встраивание v1, шаг 1 — соседний остров, груши и два предмета на плите.
let trainSlab = null;
let trainCx = 0, trainHalfW = 0, trainHalfD = 0;
const bags = new Map();          // номер места → груша; пустых не держим
// КТО СЕЙЧАС НА ТРЕНИРОВОЧНОМ ОСТРОВЕ. Два набора, а не один, потому что груша
// нужна дольше, чем идёт занятие: боец ещё возвращается с острова, и убрать её
// у него из-под рук значило бы погасить предмет на глазах.
//   atBags — занятие идёт: дошёл или идёт к груше
//   homing — занятие кончилось, тело идёт обратно на главный остров
const atBags = new Set();
const homing = new Set();
// Где клип бойца был в прошлом кадре — по этому числу ловится МОМЕНТ УДАРА
// (буквально кадр касания из самого клипа), чтобы груша качнулась от удара, а не
// от того, что боец просто что-то делает.
const hitPrev = new Map();
let bagSpots = [];               // где груши СТОЯЛИ БЫ — считается сразу
let bagTopY = 0;
const propList = [];
// Надписи-переходы на торцах островов. Держим отдельно от propList: их надо
// тикать (лужица нажатия гаснет сама) и убирать при разборке зала.
const crossings = [];
// Which shape of room we are in. Set from the canvas, never from the device: a
// wide phone lying down is a wide screen, and that is all this has to know.
let portrait = false;
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
let onPointerMove = null, onPointerDown = null, onPointerUp = null, onTouchEnd = null;
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
let stopTrainingWatch = null; // наблюдатель за состояниями занятий — снять при уходе
// ⚠️ ПЕРЕСКАЗАТЬ РЕЖИМЫ ПОСЛЕ КАЖДОГО attach. Режиссёр при attach собирает агентов
//    заново — и все занимавшиеся тела молча вернулись бы к прогулкам. Случается
//    на повороте экрана (см. applyPresence).
let applyTraining = null;
let mark = { x: 0, z: 0 };   // where the current fighter stands
let compose = null;          // which plate step, how big, where the arc stands on it
let rosterCount = 0;         // read once, at the moment the hall opens
const camPos = new THREE.Vector3();      // where the camera IS
const camLook = new THREE.Vector3();     // and what it looks at
const camPosTo = new THREE.Vector3();    // where it is going
const camLookTo = new THREE.Vector3();
let prevT = 0;
let reduced = false;
// Орбита и возврат в стартовую позу. homePose — та самая поза, которую считает
// frameFor: она остаётся точкой отсчёта, свободная камера её не отменяет.
let controls = null;
let camMoving = false;   // ведёт ли камеру САМ ЗАЛ прямо сейчас (смена кадрирования)
let homePose = null;
let idleSince = null;
let returning = false;
let lamps = null, backdrop = null;
let legend = null, legendPresence = null, legendParts = null;
// Счётчик кадров и время сборки тел — только для служебной линейки (__forgeProbe).
let fpsNow = 0, fpsFrames = 0, fpsSince = 0;
const buildMs = [];
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
  backdrop = buildBackdrop({ radius: 45, centerY: 1.6 });
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
  // Соседний остров с грушами + два предмета на главной плите. Шаг 1 встраивания:
  // ГЕОМЕТРИЯ ТОЛЬКО. Ни нажатий, ни перелёта, ни переноса занятия сюда — это
  // следующие шаги, и они не делаются, пока владелец не выбрал стартовую позу.
  buildNeighbourIsland(topY, members.length);
  buildForgeProps(topY);
  buildCrossings();

  // Имена осей берутся из САМОГО набора осей бойца, а не переписываются списком:
  // второй список рано или поздно разошёлся бы с первым.

  const spots = layoutRoster(members.length, compose.arcZ);
  director = createForgeWanderDirector();

  // The roster's RECORDS are made now; the BODIES are made when a screen that has
  // to show them asks for one (see ensureBody). Sideways that is everybody, at
  // once. Upright it is the picked fighter and nobody else — the hall shows one
  // man large there, and a body that is never in the picture is never built.
  spots.forEach((p, i) => {
    const m = members[i];
    roster.push({
      id: m.id,
      callsign: m.callsign,
      core: CORE_PALETTE.find((c) => c.id === m.core) || CORE_PALETTE[0],
      fighter: null,                   // ← built on demand
      glow: null,
      home: new THREE.Vector3(p.x, topY, p.z),   // the middle of his zone
      zone: zoneFor(p),
      parts: null,
      skin: null,
      lit: 0,                          // eased 0…1 core brightness
      dim: 0,                          // eased 0…1 "sunk into the dark"
    });
  });

  portrait = viewH >= viewW;
  applyPresence(true);                 // build + place whoever this screen needs
  load.stage('roster');

  // ── ЗАНЯТИЕ ВИДНО ТЕЛОМ — ради этого работа и делалась ───────────
  //
  // Три состояния — три разные вещи на плите, и ни одна из них не светится:
  //   свободен — строллит по своей зоне, как и раньше
  //   занят     — работает на месте: гоняет свои движения одно за другим
  //   готов     — стоит смирно лицом к игроку, пока все остальные ходят
  //
  // Метка «готов» в сцене — именно неподвижность, а не свечение: в зале горит
  // ровно одно ядро (выбранного) и одно тёплое облако (легенда), и третьего
  // свечения здесь быть не может. Среди десяти бродящих тел неподвижное
  // читается сразу и стоит ноль.
  //
  // Состояние спрашивается НЕ КАЖДЫЙ КАДР, а по изменению: за всё занятие оно
  // меняется дважды, и опрашивать хранилище шестьдесят раз в секунду не за чем.
  const trainingSig = computed(() => (store.getters['roster/fighters'] || [])
    .map((f) => f.id + ':' + trainingStateOf(f)).join('|'));

  applyTraining = () => {
    if (!director) return;
    const byId = new Map((store.getters['roster/fighters'] || []).map((f) => [f.id, f]));
    // ⚠️ НА СОСЕДНИЙ ОСТРОВ ТЕЛО ИДЁТ НЕ ВСЕГДА. Ходьбой владеет режиссёр, а он
    //    водит только тех, у кого ЕСТЬ тело. Стоя (портрет) тело в зале ровно
    //    одно, режиссёр не заведён вовсе; при системной «уменьшить движение» он
    //    заведён, но выключен. В обоих случаях боец остаётся на месте — и груша
    //    ему не ставится: иначе на пустом острове висел бы предмет, к которому
    //    никто не идёт, а убрать его было бы некому (замер 23.09.2026 —
    //    именно так и было).
    const canBag = !portrait && !reduced;
    for (let i = 0; i < roster.length; i++) {
      const st = trainingStateOf(byId.get(roster[i].id) || null);
      const spot = canBag ? bagSpots[i] : null;

      if (st === 'busy' && spot) {
        // НАЧАЛО ЗАНЯТИЯ. Груша ставится ПЕРВОЙ, потом тело идёт к ней: иначе
        // предмет появлялся бы под уже стоящим бойцом.
        if (!atBags.has(i)) {
          atBags.add(i);
          homing.delete(i);
          syncBags(new Set([...atBags, ...homing]));
          // Ходьба своя же, режиссёрская: дойти до точки перед грушей и встать.
          // `drill` поверх пути ничего не обрывает — путь всегда доходится.
          director.sendTo(i, spot.x, spot.z + TRAIN.standAhead);
          director.setMode(i, 'drill');
        }
        continue;
      }

      // КОНЕЦ ЗАНЯТИЯ (или его отмена). Тело возвращается на главный остров
      // своим ходом; груша держится, пока он не дошёл.
      if (atBags.has(i)) {
        atBags.delete(i);
        homing.add(i);
        hitPrev.delete(i);
        director.setMode(i, st === 'ready' ? 'still' : 'wander');
        // Выбранный возвращается НА МЕТКУ, остальные — в свою зону: иначе боец,
        // которого выбрали, пока он занимался, встал бы не там, где ему место.
        if (roster[i].id === currentId) director.sendTo(i, mark.x, mark.z);
        else director.sendHome(i);
        continue;
      }
      director.setMode(i, st === 'ready' ? 'still' : 'wander');
    }
    syncBags(new Set([...atBags, ...homing]));
  };
  stopTrainingWatch = watch(trainingSig, () => applyTraining?.());
  applyTraining();

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
  // Свободная камера. Заводится ДО первой позы, чтобы applyCamera сразу выставил
  // ей коридор и точку взгляда. Вращение по кругу не ограничено — ограничен только
  // наклон, чтобы нельзя было заглянуть под плиту.
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = ORBIT.damping;
  controls.enablePan = false;
  controls.minPolarAngle = ORBIT.polarMin;
  controls.maxPolarAngle = ORBIT.polarMax;
  // Руки игрока отменяют возврат; отпустил — пошёл отсчёт простоя.
  controls.addEventListener('start', () => { idleSince = null; returning = false; });
  controls.addEventListener('end', () => { idleSince = clock.getElapsedTime(); });
  // При «меньше движения» камера остаётся закреплённой: поездка ради поездки там
  // не нужна, а зал и без неё читается.
  controls.enabled = !reduced;

  applyCamera(frameFor(), true);

  // --- Pointer: hover lights ONE core and names it; a tap picks that fighter.
  //     Same shape as the mode islands (one hovered at a time, eased `lit`), but
  //     the light lives on the fighter, so it is driven in the loop below. ---
  const _ray = new THREE.Raycaster();
  const _ptr = new THREE.Vector2();
  let downAt = null;

  // ПОРЯДОК РАЗБОРА НАЖАТИЯ (ТЗ встраивания §2): предметы → боец → пол.
  // Предметы стоят первыми потому, что они маленькие и неподвижные: боец,
  // подошедший к наковальне, иначе перехватывал бы нажатие по ней собой.
  function pickAt(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    _ptr.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _ptr.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    _ray.setFromCamera(_ptr, camera);
    // ⚠️ ПОБЕЖДАЕТ БЛИЖАЙШИЙ, а не предмет. Раньше предметы проверялись первыми и
    //    выигрывали нажатие независимо от расстояния — а выбранный боец стоит на
    //    метке ровно перед планшетом, и по его телу было не попасть: луч задевал
    //    планшет ЗА ним, и открывался список вместо бойца.
    let best = null;
    for (const pr of propList) {
      if (!pr.obj.hit || !pr.obj.hit.length) continue;
      const h = _ray.intersectObjects(pr.obj.hit, true)[0];
      if (h && (!best || h.distance < best.d)) best = { d: h.distance, res: { kind: 'prop', key: pr.key } };
    }
    // Only bodies that are actually in the room can be hit — upright that is one.
    const live = roster.filter((r) => r.fighter && r.fighter.group.parent);
    const hit = _ray.intersectObjects(live.map((r) => r.fighter.group), true)[0];
    if (hit && (!best || hit.distance < best.d)) {
      let o = hit.object;
      while (o && !live.some((r) => r.fighter.group === o)) o = o.parent;
      const entry = o ? live.find((r) => r.fighter.group === o) : null;
      if (entry) best = { d: hit.distance, res: { kind: 'fighter', entry } };
    }
    return best ? best.res : null;
  }

  // Screen position of a body's head — where its callsign hangs.
  const _v = new THREE.Vector3();
  function tagPos(entry) {
    if (!entry.fighter) return null;
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
    const g = pickAt(e.clientX, e.clientY);
    emitHover(g && g.kind === 'fighter' ? g.entry : null);
  };
  onPointerDown = (e) => { downAt = { x: e.clientX, y: e.clientY, entry: pickAt(e.clientX, e.clientY) }; };
  onPointerUp = (e) => {
    const d = downAt; downAt = null;
    if (!d) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;   // a drag, not a tap
    if (d.entry && d.entry.kind === 'prop') {
      // ПЕРЕХОД МЕЖДУ ОСТРОВАМИ — единственный предмет, который зал отрабатывает
      // сам: он двигает камеру, а камера живёт здесь. Наружу всё равно уходит
      // сообщение о нажатии — по нему страница закрывает открытые блоки, ровно
      // как их закрывает любой другой предмет.
      crossTo(d.entry.key);
      emit('press', d.entry.key);
    } else if (d.entry && d.entry.kind === 'fighter') {
      // Touch has no hover, so light the core for a beat BEFORE the framing
      // changes — the finger has to see what it hit.
      emitHover(d.entry.entry);
      // ВТОРОЙ ДОВОД — «нажали по телу», и он здесь не косметика. Статы бойца
      // открывает ТОЛЬКО тело: строка в списке на планшете их не открывает,
      // иначе список и статы дрались бы за один и тот же угол экрана. Решает
      // это зал (PveView), поэтому отсюда уходит только сам факт.
      emit('pick', d.entry.entry.id, true);
    } else {
      // Нажатие по пустому месту. Раньше оно сообщалось только пока открыт боец —
      // больше нельзя: со встраиванием пустым местом ещё и закрывают то, что
      // открыл предмет, а предмет к этому моменту загорожен самой панелью.
      emit('exit');
    }
  };
  /* ⚠️ ПОЗДНИЙ КЛИК. На сенсорном экране браузер после касания досылает вдогонку
     обычный клик мышью — примерно через треть секунды. За эту треть секунды
     панель, которую открыло само касание, успевает встать ПОД ПАЛЕЦ, и клик
     попадает уже в неё. Замерено на этом зале: десять заходов из десяти, и в
     семи из них он попадал в кнопку TRAIN — боец уходил заниматься, хотя игрок
     всего лишь нажал по телу.

     Гасим его здесь, у источника: отменённое действие по концу касания —
     единственное, что браузер спрашивает перед тем, как этот клик выдумать.
     Залу обычный клик не нужен вовсе: и тела, и предметы он ловит событиями
     указателя, которые приходят раньше и от отмены не страдают. Прокрутку это
     не трогает — её на канвасе и так нет (её снимает сама орбита камеры).

     ⚠️ Слушателя нельзя вешать пассивным: пассивному браузер отменять не даёт. */
  const canvas = renderer.domElement;
  onTouchEnd = (e) => { e.preventDefault(); };
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
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

    // КАМЕРА. Пока идёт смена кадрирования (выбрали бойца, повернули экран) её
    // ведёт зал — это его поставленное движение. Когда доехали, камера переходит
    // игроку: орбита, приближение, и возврат в стартовую позу после простоя.
    // ⚠️ «Зал ведёт камеру» — это ОТДЕЛЬНЫЙ признак, а не сравнение позиции с
    //    целью. Сравнение здесь и стояло, и оно ломало вращение: камеру двигает
    //    игрок, позиция уезжает от цели, зал считает, что не доехал, и тянет её
    //    обратно. Со стороны это выглядит как «камера не вращается вовсе».
    if (camMoving) {
      const camK = reduced ? 1 : 1 - Math.exp(-(1 / (CAM.moveSec * 0.36)) * Math.min(0.05, dt));
      camPos.lerp(camPosTo, camK);
      camLook.lerp(camLookTo, camK);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      if (controls) controls.target.copy(camLook);
      if (camPos.distanceToSquared(camPosTo) < 1e-4) {
        camMoving = false;
        if (controls) { controls.target.copy(camLookTo); controls.update(); }
      }
    } else if (controls && !reduced) {
      idleReturn(dt);
      controls.update();
      camPos.copy(camera.position);
      camLook.copy(controls.target);
    }

    const dimK = reduced ? 1 : 1 - Math.exp(-4.0 * Math.min(0.05, dt));
    const glowK = reduced ? 1 : 1 - Math.exp(-CORE_LIGHT.lerp * Math.min(0.05, dt));
    const turnK = reduced ? 1 : 1 - Math.exp(-2.2 * Math.min(0.05, dt));

    // Strolls and errands: the director only moves each body's LURE — the walking
    // itself is the fighter's own locomotion, one frame later, inside update().
    // Идёт в ОБЕИХ раскладках: весь состав стоит в зале и бродит по плите.
    director?.update(t, dt);

    // Вспышка нажатия на надписях-переходах гаснет сама.
    for (const c of crossings) {
      if (c.pressUntil && t > c.pressUntil) { c.setPressed(false); c.pressUntil = 0; }
      c.tick(dt);
    }

    for (let i = 0; i < roster.length; i++) {
      const r = roster[i];
      // Not in the picture → not updated. Upright that is everyone but the
      // picked fighter, and they have no body to update in the first place.
      if (!r.fighter || !r.fighter.group.parent) continue;
      const isCurrent = r.id === currentId;

      r.fighter.update(t, camera);
      r.glow.follow(r.fighter.group.position);

      // A body that is walking steers itself; one that is standing is turned to
      // face the player — on the mark, and between strolls in his own zone.
      // ЗАНИМАЮЩИЙСЯ — исключение: он смотрит на грушу, а не на игрока. Пока он
      // ИДЁТ к ней, его не разворачивает никто: поворотом владеет его ходьба.
      const spot = atBags.has(i) ? bagSpots[i] : null;
      if (spot && director && !director.isWalking(i)) {
        turnTowards(r.fighter.group, spot.x, spot.z, turnK);
        pushBag(i, r.fighter, spot);
      } else if (!director || director.isStill(i)) {
        turnTowards(r.fighter.group, camPos.x, camPos.z, turnK);
      }

      // Вернулся с острова — груша больше не нужна.
      if (homing.has(i) && director && director.isStill(i)) {
        homing.delete(i);
        syncBags(new Set([...atBags, ...homing]));
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


    // Груши качаются только пока они есть — пустых в зале не висит.
    for (const [, bag] of bags) bag.tick(dt, reduced);

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
    if (DEV_MODE) {
      fpsFrames++;
      const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (ms - fpsSince >= 1000) { fpsNow = Math.round((fpsFrames * 1000) / (ms - fpsSince)); fpsFrames = 0; fpsSince = ms; }
    }
  };
  renderer.setAnimationLoop(loop);

  // ── ЦЕНА КАДРА (только в служебном режиме) ───────────────────────────────
  // Зал FORGE — самая тяжёлая из сцен с бойцами, и он служит МЕРКОЙ: ворота с
  // бойцами обязаны остаться легче него (иначе рушится основание, по которому
  // воротам вообще разрешили быть пятой сценой). Мерку нельзя брать из отчётов —
  // её надо мерить тем же способом, что и ворота: у самого отрисовщика.
  //
  // ⚠️ Признак служебного режима управляет ТОЛЬКО видимостью линейки. В игре
  // этой ветки нет вовсе.
  if (DEV_MODE) {
    // Что лежит под долей кадра. Отвечает ровно то же, что ответит настоящее
    // нажатие: проверка нажимаемости ведётся замером, а не «нажал и посмотрел».
    window.__pickAt = (sx, sy) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const e = pickAt(rect.left + sx * rect.width, rect.top + sy * rect.height);
      return e ? (e.kind === 'prop' ? 'предмет:' + e.key : 'боец:' + e.entry.id) : 'пусто';
    };
    window.__forgeProbe = () => {
      if (!renderer || !scene) return null;
      const r = renderer.info;
      let meshes = 0;
      scene.traverse((x) => { if (x.isMesh || x.isLine || x.isPoints) meshes++; });
      // Цена ОДНОГО бойца, посчитанная по его собственному поддереву, а не
      // вычитанием одного замера из другого: вычитание смешивает бойца с тем,
      // чем зал его украшает (подсветка под ногами — его, но не его тела), и
      // молчаливо зависит от отсечения невидимого. Треугольники берутся из
      // геометрии, поэтому не зависят от того, попал ли боец в кадр.
      const one = (root) => {
        let m = 0, t = 0;
        root.traverse((x) => {
          if (!x.isMesh && !x.isLine && !x.isPoints) return;
          m += (x.isInstancedMesh ? x.count : 1);
          const g = x.geometry;
          if (!g) return;
          const n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0);
          t += (n / 3) * (x.isInstancedMesh ? x.count : 1);
        });
        return { meshes: m, tris: Math.round(t) };
      };
      const partsOf = (root) => {
        const out = [];
        root.traverse((x) => {
          if (!x.isMesh && !x.isLine && !x.isPoints && !x.isSprite) return;
          const g = x.geometry;
          const n = g ? (g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0)) : 0;
          out.push(`${x.isSprite ? 'sprite' : x.type}${x.visible ? '' : '(скрыт)'} ${Math.round(n / 3)}т`);
        });
        return out;
      };
      const r0 = roster.find((x) => x.fighter);
      return {
        body: r0 ? one(r0.fighter.group) : null,      // боец сам по себе
        parts: r0 ? partsOf(r0.fighter.group) : null,
        buildMs: buildMs.slice(),
        lit: r0 ? Number((r0.lit ?? 0).toFixed(3)) : null,
        dim: r0 ? Number((r0.dim ?? 0).toFixed(3)) : null,
        halo: r0 && r0.glow ? one(r0.glow.mesh) : null, // подсветка зала под ним
        tris: r.render.triangles,
        calls: r.render.calls,
        meshes,
        geometries: r.memory.geometries,
        textures: r.memory.textures,
        fighters: roster.filter((x) => x.fighter).length,
        fps: fpsNow,
        // ЗАНЯТИЕ: где чьё тело и где стоят груши. Видно ли бойца у груши —
        // вопрос ракурса, а это числа, от ракурса не зависящие.
        train: roster.map((x, i) => (x.fighter ? {
          i,
          x: +x.fighter.group.position.x.toFixed(2),
          z: +x.fighter.group.position.z.toFixed(2),
          where: atBags.has(i) ? 'у груши' : homing.has(i) ? 'идёт домой' : 'в зале',
          bag: bags.has(i),
        } : null)).filter(Boolean),
        bagSpots: bagSpots.map((b) => ({ x: +b.x.toFixed(2), z: +b.z.toFixed(2) })),
        slab: compose ? { width: compose.slab.width, depth: compose.slab.depth, topY: slab ? +slab.refs.topY.toFixed(2) : null } : null,
        cam: camera && controls ? {
          pos: [camera.position.x, camera.position.y, camera.position.z].map((v) => +v.toFixed(2)),
          look: [controls.target.x, controls.target.y, controls.target.z].map((v) => +v.toFixed(2)),
          dist: +camera.position.distanceTo(controls.target).toFixed(2),
        } : null,
        // Куда НАЖИМАТЬ: доли кадра для каждого предмета и каждого тела. Нужны,
        // чтобы проверку можно было вести замером, а не угадыванием координат по
        // картинке — композиция в зале подвижная, и угадывание всё время врало.
        taps: (() => {
          const out = {};
          const at = (pos, lift) => {
            _v.copy(pos); _v.y += lift; _v.project(camera);
            return { sx: +(_v.x * 0.5 + 0.5).toFixed(3), sy: +(-_v.y * 0.5 + 0.5).toFixed(3) };
          };
          // Точка берётся у САМОГО нажимаемого меша, а не у начала группы: полка
          // низкая, наковальня высокая, и одна общая добавка по высоте мимо
          // низкого предмета промахивалась.
          const _c = new THREE.Vector3();
          for (const pr of propList) {
            const m = pr.obj.hit && pr.obj.hit[0];
            if (!m) continue;
            if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
            _c.copy(m.geometry.boundingSphere.center); m.localToWorld(_c);
            out[pr.key] = at(_c, 0);
          }
          roster.forEach((x, i) => { if (x.fighter?.group.parent) out['f' + i] = at(x.fighter.group.position, 1.0); });
          return out;
        })(),
      };
    };
    // Экранная коробка тела — чтобы сравнить ЯРКОСТЬ фигуры в зале и в воротах
    // по пикселям, а не на глаз. Считаем по мешам: табличка HP над головой —
    // спрайт огромного мирового габарита, и с ней коробка вдвое выше фигуры.
    const _bp = new THREE.Vector3();
    // `wantLit` — какого бойца мерить: подсвеченного (выбранного) или спокойного.
    // Сравнивать надо подобное с подобным: в воротах боец стоит в покое, и его
    // яркость нельзя сверять с ярко подсвеченным в зале.
    window.__forgeBodyBox = (wantLit = false) => {
      const r0 = roster.find((x) => x.fighter && (wantLit ? x.lit > 0.5 : x.lit <= 0.5))
        || roster.find((x) => x.fighter);
      if (!r0 || !camera) return null;
      const el2 = wrap.value;
      const cw = el2.clientWidth, ch = el2.clientHeight;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      r0.fighter.group.traverse((x) => {
        if (!x.isMesh || !x.geometry) return;
        if (!x.geometry.boundingBox) x.geometry.computeBoundingBox();
        const bb = x.geometry.boundingBox;
        for (let i = 0; i < 8; i++) {
          _bp.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
          _bp.applyMatrix4(x.matrixWorld).project(camera);
          const px = (_bp.x * 0.5 + 0.5) * cw, py = (-_bp.y * 0.5 + 0.5) * ch;
          minX = Math.min(minX, px); maxX = Math.max(maxX, px);
          minY = Math.min(minY, py); maxY = Math.max(maxY, py);
        }
      });
      return { left: minX, right: maxX, top: minY, bottom: maxY, lit: Number((r0.lit ?? 0).toFixed(2)) };
    };
  }

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

    // Поворот телефона БОЛЬШЕ НЕ МЕНЯЕТ СОСТАВ КОМНАТЫ: весь ростер стоит в зале
    // в обеих раскладках. Плита тоже не трогается — её размер решён один раз,
    // когда зал открылся. Значит, поворот не двигает никого, и пересобрать надо
    // только кадр. Ставим сразу, а не подводим плавно: это новый экран, а не ход.
    portrait = ch >= cw;
    applyCamera(frameFor(), true);
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

// ── Who exists, and who is in the picture ─────────────────────────────────
// ВЕСЬ СОСТАВ СТОИТ В ЗАЛЕ — в ОБЕИХ раскладках (решение владельца 24.09.2026).
//
// Раньше стоя (вертикальный экран) зал показывал одного бойца, а остальных не
// строил вовсе. Довод был про ширину: дуга из десяти занимает около четырнадцати
// единиц, а у телефона, поставленного вертикально, такой ширины нет. Довод
// оказался дороже пользы: зал выглядел пустым, круг «отправил — ушёл — вернулся»
// на телефоне не показывался вовсе (режиссёра стоя не заводили, значит и до груш
// никто не доходил), и половина работы зала была невидима ровно на том экране, с
// которого в него чаще всего заходят.
//
// Поэтому тела теперь строятся все и всегда. Кадр при этом НЕ подгоняется: правило
// удаления камеры — домашнее и не трогается (см. CAM), так что стоя края дуги
// уходят за рамку. Уводить их обратно — не задача этой правки: у камеры есть
// свободный поворот и отъезд, и зал целиком доступен руками.
//
// The plate does NOT follow. Its size is settled once, when the hall opens, from
// how many fighters the roster holds — turning the phone is not a reason to
// recount the ground, and ground that resizes under your feet reads as a fault
// rather than as growth.

/** Give this roster entry a real body, once. No-op if he already has one. */
function ensureBody(i) {
  const r = roster[i];
  if (!r || r.fighter) return;
  // Служебная линейка: сколько миллисекунд стоит сборка одного тела. Нужна,
  // чтобы знать, влезает ли сборка нескольких бойцов под занавес загрузки.
  const _t0 = DEV_MODE ? performance.now() : 0;
  const fighter = buildFighter(r.core.hue, {
    side: 'player',
    coreId: r.core.id,
    behavior: resolveBehavior(r.core.id, []),
    // РАМКА МИРА ДЛЯ ЭТОГО ТЕЛА. Раньше ею был край главной плиты. Теперь мир —
    // ДВА острова: боец уходит заниматься на соседний, и по старой рамке он
    // вставал ровно на краю главной плиты и до груши не доходил (замер 23.09.2026:
    // тело замирало на x = 4.6 при груше на x = 6.25).
    //
    // ⚠️ РАСХОЖДЕНИЕ, названное намеренно. Рамка у тела СИММЕТРИЧНА — задаётся
    //    одной полушириной вокруг нуля, — поэтому, раздвинув её вправо до острова,
    //    мы настолько же раздвинули её и влево, где ничего нет. Сделать её
    //    несимметричной можно только внутри `buildFighter`, а он защищён. Слева
    //    тело удерживает не рамка, а режиссёр: его личная зона и поводок. Если
    //    боец когда-нибудь окажется левее плиты — причина здесь.
    bounds: {
      x: Math.max(compose.slab.width / 2, trainCx + trainHalfW),
      z: Math.max(compose.slab.depth / 2, trainHalfD),
    },
    neutralColor: false,
    getFoePos: () => (director ? director.foePos(i) : null),
  });
  fighter.group.position.copy(r.home);
  fighter.setReducedMotion(reduced);
  // SUPPRESS the over-head HP plate (the only Sprite added DIRECTLY to the
  // group) — same external approach as the home.
  fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
  faceTowards(fighter.group, CAM.dir[0], CAM.dir[2]);

  r.fighter = fighter;
  r.glow = buildUnderGlow(r.core.hue, slab.refs.topY);
  r.glow.mesh.position.set(r.home.x, slab.refs.topY + GLOW.yLift, r.home.z);
  r.parts = coreParts(fighter);        // gem + halo, for the rest/lit brightness
  r.skin = skinOf(fighter);            // this body's own material (per-instance)
  if (DEV_MODE) buildMs.push(+(performance.now() - _t0).toFixed(1));
}

/**
 * Поставить содержимое зала в согласие с выбором. Тело есть у КАЖДОГО из состава
 * — отбора по экрану здесь больше нет (см. выше).
 * `place` also stands the picked fighter on the mark and the rest in their zones
 * — used on build and whenever the shape of the room changes under us.
 */
function applyPresence(place) {
  const topY = slab ? slab.refs.topY : 0;
  if (!roster.length) return;
  if (!currentId) currentId = roster[0].id;

  for (let i = 0; i < roster.length; i++) {
    const r = roster[i];
    ensureBody(i);
    if (!r.fighter.group.parent) { scene.add(r.fighter.group); scene.add(r.glow.mesh); }
    if (place) {
      const onMark = r.id === currentId;
      r.fighter.group.position.set(onMark ? mark.x : r.home.x, topY, onMark ? mark.z : r.home.z);
      r.glow.mesh.position.set(r.fighter.group.position.x, topY + GLOW.yLift, r.fighter.group.position.z);
      faceTowards(r.fighter.group, CAM.dir[0], CAM.dir[2]);
      r.lit = onMark ? 1 : 0;
    }
  }

  // The director only ever knows about bodies that exist. Upright there is one
  // man and he is standing on the mark, so there is nothing to stroll and the
  // director is left idle (see the loop).
  const built = roster.filter((r) => r.fighter);
  if (built.length === roster.length) {
    director.attach(roster.map((r) => ({ fighter: r.fighter, zone: r.zone })), { reduced });
    const cur = roster.findIndex((r) => r.id === currentId);
    if (cur >= 0) director.halt(cur);
    // attach собирает агентов с нуля — занятые и готовые обязаны
    // получить своё заново, иначе поворот экрана тихо обрывает занятие в сцене.
    // Память о том, кто где, тоже сбрасывается: агенты новые, а тела мог
    // переставить `place`, и старая запись отправила бы бойца к груше заново.
    atBags.clear(); homing.clear(); hitPrev.clear();
    applyTraining?.();
  }
}

// ЗАМЕНА ТЕЛА НА МЕСТЕ — СНЯТА (24.09.2026). Здесь жил «перевод стоя»: раз в
// вертикальной раскладке тело в зале было ровно одно, сменить выбранного можно
// было только подменив его на метке с растворением. Теперь в зале стоит весь
// состав в обеих раскладках, менять выбранного всегда есть кому и пешком — и
// подмена стала недостижимой. Вместе с ней ушла и прозрачность шкуры, ради
// которой тела попадали в сортируемый проход отрисовки.

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
  // ⚠️ ЗАНЯТИЕ СИЛЬНЕЕ МЕТКИ. Кого выбрали — обычно выходит на метку, а кого
  //    сменили — уходит в свою зону. Но тот, кто сейчас у груши, не делает ни
  //    того, ни другого: выбор не должен снимать бойца с занятия.
  if (prevIdx >= 0 && !atBags.has(prevIdx)) director?.sendHome(prevIdx);
  if (!atBags.has(idx)) director?.sendTo(idx, mark.x, mark.z);
}

// Нажали надпись на торце: перелёт к соседнему острову или обратно в зал.
// Перелёт — ТОТ ЖЕ, которым зал уводит камеру к занимающемуся (applyCamera по
// trainingFrame / frameFor), второго здесь не пишется. Во время перелёта
// нажатие не делает ничего: camMoving стоит ровно на это время.
function crossTo(key) {
  if (key !== 'toTrain' && key !== 'toHall') return;
  const c = crossings.find((x) => x.key === key);
  if (c) { c.setPressed(true); c.pressUntil = clock.getElapsedTime() + CROSS.flash; }
  if (camMoving) return;
  applyCamera(key === 'toTrain' ? trainingFrame() : frameFor(), reduced);
}

function select(id) {
  const idx = roster.findIndex((r) => r.id === id);
  if (idx < 0) { exitWork(); return; }
  makeCurrent(idx);
  workingId = id;
  hoveredId = null;
  // ЗАНИМАЮЩИЙСЯ — на соседнем острове, и туда летит камера. Вход сюда один и
  // тот же и у нажатия по телу, и у строки в списке на планшете, поэтому оба
  // ведут себя одинаково и разойтись не могут.
  //
  // Обратный переход НЕ трогаем: камера возвращается в зал тем же, чем и всегда —
  // нажатием по пустому месту (exitWork) или выбором того, кто в зале.
  applyCamera(atBags.has(idx) ? trainingFrame() : frameFor(), reduced);
}

function exitWork() {
  workingId = null;
  applyCamera(frameFor(), reduced);
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
    if (reduced && roster[cur].fighter) roster[cur].fighter.group.position.set(mark.x, topY, mark.z);
    else director?.sendTo(cur, mark.x, mark.z);
  }

  buildHallLamps();                        // the lamps go with the plate
  applyCamera(frameFor(), reduced);   // …and the camera moves, never cuts
  return true;
}

defineExpose({ select, exitWork, growTo });

onBeforeUnmount(() => {
  load?.dispose();   // left mid-load → drop the screen and the wait with us
  if (stopTrainingWatch) { stopTrainingWatch(); stopTrainingWatch = null; }
  applyTraining = null;
  if (DEV_MODE) { delete window.__forgeProbe; delete window.__forgeBodyBox; }
  if (controls) { controls.dispose(); controls = null; }
  if (resizeObserver) resizeObserver.disconnect();
  if (resizePending) { cancelAnimationFrame(resizePending); resizePending = 0; }
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (renderer) renderer.setAnimationLoop(null);
  if (renderer) {
    const c = renderer.domElement;
    if (onPointerMove) c.removeEventListener('pointermove', onPointerMove);
    if (onPointerDown) c.removeEventListener('pointerdown', onPointerDown);
    if (onPointerUp) c.removeEventListener('pointerup', onPointerUp);
    if (onTouchEnd) c.removeEventListener('touchend', onTouchEnd);
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
  // Соседний остров и груши на нём — убираются вместе с залом. Груш может не
  // быть вовсе (их строят по мере назначения занятия), поэтому просто обходим
  // то, что есть.
  for (const [, bag] of bags) { scene.remove(bag.group); bag.dispose?.(); }
  for (const c of crossings) { scene.remove(c.group); c.dispose(); }
  crossings.length = 0;
  bags.clear(); bagSpots = [];
  atBags.clear(); homing.clear(); hitPrev.clear();
  if (trainSlab) { scene.remove(trainSlab.group); trainSlab.dispose(); trainSlab = null; }
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
