<!-- FighterLabScene — DEV "лаборатория бойца". One fighter on a plain podium,
     orbit camera all the way around, and a side panel that plays ANY movement
     or technique through the EXACT same body driver the arena/fight uses
     (buildFighter.update) — never a parallel animation system. What you tune and
     watch here plays one-to-one in a real bout.

     Playback transport drives a VIRTUAL clock fed to update(t): the body derives
     its frame dt from (t − lastT) and keys every timer / breath off it, so:
       pause       → stop advancing virtual time  (true freeze, dt = 0)
       slow 1/2,1/4→ advance virtual time scaled  (everything slows together)
       frame-step  → advance virtual time one frame on pause
       loop a clip → re-call its trigger each frame (play() no-ops while busy, so
                     it re-fires only when the previous clip ends → seamless)

     Movements are DATA: intentions auto-derive from intentions.js; techniques are
     one descriptor line each (a new move — kick, layer-3 — is one line here once
     buildFighter exposes its trigger). The panel markup never changes.

     This is a standalone dev scene (no rift / arena slabs / .app-v2 namespace).
     The protected arena files (buildArena / arenaTextures / arenaPresence) are not
     touched; buildFighter + the intention/motion data are CALLED, never edited. -->
<template>
  <div ref="wrap" class="lab-wrap">
    <canvas ref="canvasEl" class="lab-canvas" />

    <!-- Side panel: core selector + movement triggers + dummy toggle. -->
    <aside class="lab-panel">
      <div class="lab-title">FIGHTER LAB</div>

      <div class="lab-group">
        <div class="lab-label">CORE</div>
        <div class="lab-row">
          <button
            v-for="c in cores"
            :key="c.id"
            type="button"
            class="lab-btn"
            :class="{ on: coreId === c.id }"
            :style="coreId === c.id ? { borderColor: c.hue, color: c.hue } : null"
            @click="selectCore(c.id)"
          >{{ c.name }}</button>
        </div>
      </div>

      <div class="lab-group">
        <div class="lab-label">INTENTIONS (намерения)</div>
        <div class="lab-row">
          <button
            v-for="m in intentionMoves"
            :key="m.id"
            type="button"
            class="lab-btn"
            :class="{ on: activeId === m.id }"
            @click="selectMove(m)"
          >{{ m.label }}</button>
        </div>
      </div>

      <div class="lab-group">
        <div class="lab-label">TECHNIQUES (приёмы)</div>
        <div class="lab-row">
          <button
            v-for="m in techniqueMoves"
            :key="m.id"
            type="button"
            class="lab-btn"
            :class="{ on: activeId === m.id }"
            @click="selectMove(m)"
          >{{ m.label }}</button>
        </div>
      </div>

      <div class="lab-group">
        <div class="lab-label">TARGET</div>
        <div class="lab-row">
          <button
            type="button"
            class="lab-btn"
            :class="{ on: dummyOn }"
            @click="toggleDummy"
          >МАНЕКЕН: {{ dummyOn ? 'ON' : 'OFF' }}</button>
        </div>
      </div>

      <div class="lab-group">
        <div class="lab-label">DISPLAY</div>
        <div class="lab-row">
          <button type="button" class="lab-btn" :class="{ on: trailOn }" @click="toggleTrail">СЛЕД: {{ trailOn ? 'ON' : 'OFF' }}</button>
          <button type="button" class="lab-btn" :class="{ on: stopOnContact }" @click="toggleStopOnContact">СТОП НА КОНТАКТЕ: {{ stopOnContact ? 'ON' : 'OFF' }}</button>
        </div>
      </div>

      <!-- Manner description — shown while a (continuous) intention is selected. -->
      <div v-if="mannerLines" class="lab-group lab-manner">
        <div class="lab-label">МАНЕРА — {{ activeMove?.label }}</div>
        <div v-for="(ln, i) in mannerLines" :key="i" class="lab-manner-row">
          <span class="lmr-k">{{ ln[0] }}</span><span class="lmr-v">{{ ln[1] }}</span>
        </div>
      </div>
    </aside>

    <!-- Camera snap buttons (top-right). -->
    <div class="lab-views">
      <button type="button" class="lab-btn" :class="{ on: viewKey === 'front' }" @click="snapView('front')">FRONT</button>
      <button type="button" class="lab-btn" :class="{ on: viewKey === '3q' }" @click="snapView('3q')">3/4</button>
      <button type="button" class="lab-btn" :class="{ on: viewKey === 'side' }" @click="snapView('side')">SIDE</button>
    </div>

    <!-- Playback transport (bottom). -->
    <div class="lab-transport">
      <button type="button" class="lab-btn wide" @click="togglePlay">{{ playing ? '❚❚ PAUSE' : '▶ PLAY' }}</button>
      <button type="button" class="lab-btn" @click="stepFrame">▶| STEP</button>
      <button type="button" class="lab-btn" @click="cycleSpeed">SPEED {{ speedLabel }}</button>
      <button type="button" class="lab-btn" :class="{ on: loopOn }" @click="toggleLoop">{{ loopOn ? 'LOOP' : 'ONCE' }}</button>
      <button type="button" class="lab-btn" @click="replay">↺ REPLAY</button>
    </div>

    <!-- Clip time-bar: three phases (замах / контакт / возврат), contact ticks, a
         draggable playhead, and a frame counter. Shown only for a technique clip;
         hidden for (continuous) intentions. Drag the playhead to scrub on pause. -->
    <div v-if="clipState" class="lab-timebar">
      <div class="ltb-meta">
        <span>кадр {{ clipState.frame }} / {{ clipState.frames }}</span>
        <span>{{ clipState.elapsed.toFixed(2) }} / {{ clipState.dur.toFixed(2) }}s</span>
        <span v-if="clipState.feint" class="ltb-feint">ФИНТ</span>
      </div>
      <div ref="barEl" class="ltb-track" @pointerdown="scrubStart">
        <div class="ltb-seg s-windup" :style="{ left: '0%', width: clipState.windupPct + '%' }" />
        <div class="ltb-seg s-contact" :style="{ left: clipState.contactLeftPct + '%', width: clipState.contactWPct + '%' }" />
        <div class="ltb-seg s-return" :style="{ left: clipState.returnLeftPct + '%', width: clipState.returnWPct + '%' }" />
        <div v-for="(tk, i) in clipState.ticksPct" :key="i" class="ltb-tick" :style="{ left: tk + '%' }" />
        <div class="ltb-head" :style="{ left: clipState.headPct + '%' }" />
      </div>
      <div class="ltb-phases">
        <span>замах</span><span>контакт</span><span>возврат</span>
      </div>
    </div>

    <!-- On-screen readout: what movement + which camera angle is being inspected. -->
    <div class="lab-readout">
      <div>MOVE&nbsp;&nbsp;{{ activeLabel }}</div>
      <div>VIEW&nbsp;&nbsp;{{ viewLabel }}</div>
      <div>CORE&nbsp;&nbsp;{{ coreName }}</div>
      <div>STATE&nbsp;{{ playing ? 'play' : 'paused' }} · {{ speedLabel }}</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildFighter } from './buildFighter.js';
import { INTENTION_IDS, intentionProfile } from '@/data/intentions.js';
import { motionFor } from '@/data/intentionMotion.js';
import { CORES, CRYSTALS, getCore } from '@/data/upgradeData.js';
import { resolveBehavior } from '@/data/behavior.js';

const PINK = '#FF0069';
const PINK_RGB = [1, 0, 0.412]; // #FF0069 normalized — trail colour

// --- Movement registry (DATA). Intentions auto-derive from the source of truth so
//     a new intention upstream appears here for free. Techniques are one descriptor
//     line each; run(f) calls the EXISTING body API (no parallel motion code). Add a
//     future move (kick / layer-3) by adding one line once buildFighter exposes it.
const intentionMoves = INTENTION_IDS.map((id) => ({ id, label: id.toUpperCase(), kind: 'intention' }));
// `limb` (optional) names the striking limb so the lab can trail its tip — punch /
// combo / feint lead with the left arm, double leads left; a future kick is one
// more line ({ ... limb: 'legL' }) — the tip map (LIMB_TIP) already covers legs.
const techniqueMoves = [
  { id: 'punch',     label: 'PUNCH',      kind: 'clip',    run: (f) => f.punch(),     limb: 'armL' },
  { id: 'double',    label: 'DOUBLE',     kind: 'clip',    run: (f) => f.double(),    limb: 'armL' },
  { id: 'combo',     label: 'COMBO',      kind: 'clip',    run: (f) => f.combo(),     limb: 'armL' },
  { id: 'frontKick', label: 'ФРОНТ-КИК', kind: 'clip',    run: (f) => f.frontKick(), limb: 'legR' },
  { id: 'teep',      label: 'ТИП',        kind: 'clip',    run: (f) => f.teep(),      limb: 'legR' },
  { id: 'knee',      label: 'КОЛЕНО',     kind: 'clip',    run: (f) => f.knee(),      limb: 'legR' },
  { id: 'dodge',     label: 'DODGE',      kind: 'clip',    run: (f) => f.dodge() },
  { id: 'feint',     label: 'FEINT',      kind: 'clip',    run: (f) => f.feint(),     limb: 'armL' },
  { id: 'stagger',   label: 'STAGGER',    kind: 'clip',    run: (f) => f.stagger() },
  { id: 'block',     label: 'BLOCK',      kind: 'toggle',  run: (f) => f.toggleBlock() },
  { id: 'charge',    label: 'CHARGE',     kind: 'special', run: (f) => (f.getCharge01() < 0.999 ? f.fillCharge() : f.discharge()) },
];
const allMoves = [...intentionMoves, ...techniqueMoves];

// Tip of a striking limb in its joint's local space → the lab samples this point's
// WORLD position each frame for the motion trail (read-only; no driver change). Arm
// tip = end of the forearm under the elbow; leg tip = end of the shin under the knee.
const LIMB_TIP = {
  armL: { node: (j) => j.armL.elbow, off: [0, -0.34, 0] },
  armR: { node: (j) => j.armR.elbow, off: [0, -0.34, 0] },
  legL: { node: (j) => j.legL.knee,  off: [0, -0.5, -0.05] },
  legR: { node: (j) => j.legR.knee,  off: [0, -0.5, -0.05] },
};

// --- Intention MANNER description (read from the existing motion + intention data,
//     not a copy): what the manner DOES — direction / distance / tempo / drive /
//     strike / guard — so doводка sees the parameters behind the pose, not just it.
function describeIntention(id) {
  const p = intentionProfile(id); // { axes:{distance,initiative,tempo,stick}, attack, guard, charge }
  const m = motionFor(id);        // { speedMul, style, brace?, stance }
  const ax = p.axes || {};
  const dirByStyle = {
    press: 'идёт на врага', strike: 'бьёт у дистанции', sting: 'отскок-тычок',
    plant: m.brace === 'back' ? 'держит, отступя' : 'держит, давит вперёд',
    retreat: 'отходит назад',
  };
  const speedWord = m.speedMul <= 0.7 ? 'медленно' : m.speedMul >= 1.2 ? 'быстро' : 'ровно';
  const distWord = (ax.distance || 0) < 0 ? 'сближается' : (ax.distance || 0) > 0 ? 'разрывает' : 'держит';
  const tempoWord = (ax.tempo || 0) > 0 ? 'чаще' : (ax.tempo || 0) < 0 ? 'реже' : 'ровно';
  const driveWord = (ax.initiative || 0) > 0 ? 'наступает' : (ax.initiative || 0) < 0 ? 'выжидает' : 'ровно';
  const atkMap = { free: 'свой стиль', light: 'лёгкие', heavy: 'тяжёлые', none: 'не бьёт' };
  const guardWord = (p.guard || 0) > 0 ? 'выше' : (p.guard || 0) < 0 ? 'ниже' : 'обычная';
  return [
    ['НАПРАВЛ', dirByStyle[m.style] || m.style],
    ['ДИСТ', distWord],
    ['ТЕМП', `${speedWord} · ${tempoWord}`],
    ['НАСТУП', driveWord],
    ['УДАР', atkMap[p.attack] || p.attack],
    ['ЗАЩИТА', guardWord],
  ];
}

// --- Camera snap poses (position + a shared look target). Front looks at the
//     fighter's face (it faces local −Z); 3/4 is the default; side is a clean
//     profile. The dummy (when shown) sits at −Z, so the default 3/4 / side keep it
//     out of the way and front shows it in front (as a strike reference).
const VIEWS = {
  front: { pos: new THREE.Vector3(0, 1.65, -8.6), label: 'FRONT' },
  '3q':  { pos: new THREE.Vector3(6.2, 4.4, 6.6), label: '3/4' },
  side:  { pos: new THREE.Vector3(8.6, 1.75, 0),  label: 'SIDE' },
};
const LOOK = new THREE.Vector3(0, 0.95, 0);

const cores = CORES;

// --- Reactive UI state.
const wrap = ref(null);
const canvasEl = ref(null);
const coreId = ref('natisk');
const activeId = ref(null);
const dummyOn = ref(false);
const playing = ref(true);
const loopOn = ref(true);
const speedIdx = ref(0);
const SPEEDS = [1, 0.5, 0.25];
const viewKey = ref('3q');
const viewLabel = ref('3/4');
// Display tools.
const stopOnContact = ref(false); // auto-pause a playing clip on its contact frame
const trailOn = ref(true);        // motion trail behind the striking limb
const clipState = ref(null);      // live clip time-bar state (null when not a technique clip)

const activeMove = computed(() => allMoves.find((x) => x.id === activeId.value) || null);
const coreName = computed(() => getCore(coreId.value).name);
const speedLabel = computed(() => `${SPEEDS[speedIdx.value]}x`);
const activeLabel = computed(() => (activeMove.value ? `${activeMove.value.label} (${activeMove.value.kind})` : '—'));
// Manner description — only for a selected intention (continuous manner).
const mannerLines = computed(() => (activeMove.value && activeMove.value.kind === 'intention' ? describeIntention(activeMove.value.id) : null));

// --- Three.js + sim state (non-reactive).
let renderer, scene, camera, controls, clock, fighter;
let floor = null, podium = null;
let dummyGroup = null, dummyMat = null;
let resizeObserver, onVisibility, onKeydown;
let vTime = 0;            // VIRTUAL clock fed to fighter.update — the transport drives this
let pendingStep = 0;      // virtual seconds to advance on a frame-step (while paused)
let dummyHitT = -1;       // vTime of the last strike on the dummy → contact flash
let camAnim = null;       // { t, dur, fromPos, toPos, fromTarget, toTarget } camera tween (real time)
const STEP_DT = 1 / 60;   // one frame of virtual time per STEP (the frame-counter unit)

// --- Clip-bar + auto-pause-on-contact tracking (non-reactive).
const barEl = ref(null);  // the time-bar track element (for scrub geometry)
let clipActive = false;   // a one-shot clip is currently playing
let clipStartV = 0;       // vTime at which the active clip started (= vTime − elapsed; constant per clip)
let clipDur = 0;          // active clip duration (s) — captured for the scrubber
let prevElapsed = 0;      // last frame's clip elapsed (s) — for the contact-crossing detector
let scrubbing = false;    // user is dragging the playhead

// --- Motion trail (non-reactive). The lab samples the striking limb's tip world
//     position each playing frame and draws a fading polyline — no driver change.
const TRAIL_LIFE = 0.5;   // seconds a trail point lingers (then fades out)
const TRAIL_MAX = 64;     // max sampled points
let trailLine = null, trailGeo = null, trailMat = null;
let trailPts = [];        // [{ x, y, z, t }] recent tip samples
const _v = new THREE.Vector3(); // scratch

// Persistent foe reference: the fighter ALWAYS has a foe so intentions express
// their manner (navigate needs a foe — without one the body just idles). The
// "манекен" toggle only shows/hides the visible болванка at this spot; the body
// behaves the same whether it's visible or not (default off → clean view, but
// PRESS still chases, STRIKE still loads, etc — exactly as in a real bout).
const foeTarget = new THREE.Vector3(0, 0, -1.45);
const getFoePos = () => foeTarget;

function buildDummy() {
  const g = new THREE.Group();
  dummyMat = new THREE.MeshStandardMaterial({ color: 0x2a2e38, flatShading: true, roughness: 0.85, metalness: 0.1 });
  const box = (w, h, d, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dummyMat);
    m.position.set(0, y, 0);
    g.add(m);
  };
  // Coarse training-dummy silhouette: a post on a base + a head — something to
  // read a strike landing against, not a fighter.
  box(0.12, 0.5, 0.12, 0.25); // foot post
  box(0.46, 0.66, 0.34, 0.85); // torso block
  box(0.26, 0.24, 0.24, 1.32); // head
  g.position.copy(foeTarget);
  g.rotation.y = Math.PI; // face back toward the fighter
  g.visible = dummyOn.value;
  return g;
}

function makeBehavior(id) {
  // Same resolve the arena uses: the core start-profile + that core's CRYSTALS
  // default lit facets, so the lab fighter moves with the core's full signature.
  const collectLit = (crystals) => {
    const lit = [];
    for (const cr of crystals || []) for (const f of cr.faces || []) if (f.state === 'lit') lit.push(f);
    return lit;
  };
  return resolveBehavior(id, collectLit(CRYSTALS[id]));
}

function spawnFighter() {
  if (fighter) { scene.remove(fighter.group); fighter.dispose(); fighter = null; }
  const hue = getCore(coreId.value).hue || PINK;
  fighter = buildFighter(hue, {
    side: 'player',
    coreId: coreId.value,
    behavior: makeBehavior(coreId.value),
    bounds: { x: 2.3, z: 2.3 },
    getFoePos,
    // Contact flash on the dummy so a strike reads "by contact" (the lab's only
    // hit hook — no HP / damage bookkeeping is needed here).
    onImpact: () => { dummyHitT = vTime; },
  });
  fighter.setReducedMotion(false); // a MOTION-debugging tool must always animate
  fighter.group.position.set(0, 0, 0);
  scene.add(fighter.group);
  applyActive(); // re-assert the selected movement onto the fresh body
}

// Make the selected movement active on the body. Intentions → lock + AI on (the
// mode drives navigate/attack exactly as in a fight). Discrete techniques → drop
// the intention mode + AI so the clip plays in isolation, then fire it.
function applyActive() {
  if (!fighter) return;
  fighter.group.position.set(0, 0, 0); // re-centre so each selection starts framed
  const m = allMoves.find((x) => x.id === activeId.value);
  if (!m) { fighter.setIntentionLock(null); fighter.setAI(false); return; }
  if (m.kind === 'intention') {
    fighter.setIntentionLock(m.id);
    fighter.setAI(true);
  } else {
    fighter.setIntentionLock(null);
    fighter.setAI(false);
    fireMove(m);
  }
}

function fireMove(m) {
  if (!fighter || !m) return;
  if (m.kind === 'intention') { fighter.setIntentionLock(m.id); fighter.setAI(true); return; }
  m.run(fighter);
}

// --- Panel handlers.
function selectMove(m) {
  activeId.value = m.id;
  applyActive();
}
function selectCore(id) {
  if (coreId.value === id) return;
  coreId.value = id;
  spawnFighter(); // rebuild with the new core's motor/behaviour
}
function toggleDummy() {
  dummyOn.value = !dummyOn.value;
  if (dummyGroup) dummyGroup.visible = dummyOn.value;
}

// --- Transport handlers.
function togglePlay() { playing.value = !playing.value; }
function stepFrame() { playing.value = false; pendingStep += STEP_DT; }
function cycleSpeed() { speedIdx.value = (speedIdx.value + 1) % SPEEDS.length; }
function toggleLoop() { loopOn.value = !loopOn.value; }
function replay() { fireMove(activeMove.value); }
function toggleStopOnContact() { stopOnContact.value = !stopOnContact.value; }
function toggleTrail() { trailOn.value = !trailOn.value; }

// --- Scrub the clip by dragging the playhead. Works on PAUSE through the same
//     virtual clock: set vTime = clipStart + (fraction × dur), so update(vTime)
//     renders that exact moment (the pose is a pure function of clip time).
function scrubFromEvent(e) {
  const el = barEl.value;
  if (!el || !clipActive || clipDur <= 0) return;
  const r = el.getBoundingClientRect();
  let frac = r.width ? (e.clientX - r.left) / r.width : 0;
  frac = Math.max(0, Math.min(1, frac));
  const ct = Math.min(frac * clipDur, clipDur - 0.001); // never scrub past the end (would end the clip)
  vTime = clipStartV + ct;
}
function scrubMove(e) { if (scrubbing) scrubFromEvent(e); }
function scrubEnd() {
  scrubbing = false;
  window.removeEventListener('pointermove', scrubMove);
  window.removeEventListener('pointerup', scrubEnd);
}
function scrubStart(e) {
  if (!clipActive) return;
  scrubbing = true;
  playing.value = false; // scrubbing implies pause
  scrubFromEvent(e);
  window.addEventListener('pointermove', scrubMove);
  window.addEventListener('pointerup', scrubEnd);
}

// --- Per-frame display processing (called after fighter.update). Reads the clip
//     timing via the read-only getClipInfo getter; builds the time-bar state, runs
//     auto-pause-on-contact, and tracks the clip start for the scrubber. Only a
//     selected TECHNIQUE clip drives the bar — intentions (continuous) keep it hidden
//     even when their AI happens to throw a strike.
function processClipDisplay() {
  const info = fighter?.getClipInfo?.();
  const isClipMove = activeMove.value && activeMove.value.kind === 'clip';
  if (!info || !isClipMove) {
    if (clipActive) { clipActive = false; clearTrail(); }
    if (clipState.value !== null) clipState.value = null;
    return;
  }
  if (!clipActive) { clipActive = true; prevElapsed = info.elapsed; clearTrail(); }
  // Driver clip-start, exact: update() sets lastT = vTime, so info.elapsed =
  // vTime − clipStart ⇒ clipStartV = vTime − elapsed. Recomputed every frame so the
  // scrubber stays correct across loop restarts (a re-fired clip has a new start).
  clipStartV = vTime - info.elapsed;
  clipDur = info.dur;
  // A loop restart (or a backward scrub) drops elapsed → re-arm contact detection +
  // clear the previous rep's trail.
  if (info.elapsed + 1e-4 < prevElapsed) { prevElapsed = 0; clearTrail(); }
  // Auto-pause on the contact frame: stop the moment a contact time is crossed and
  // snap exactly onto it.
  if (stopOnContact.value && playing.value) {
    for (const imp of info.impacts) {
      if (prevElapsed < imp && info.elapsed >= imp) { playing.value = false; vTime = clipStartV + imp; break; }
    }
  }
  prevElapsed = info.elapsed;
  // Bar fractions: windup [0..wEnd], contact band [wEnd..rStart] + ticks, return
  // [rStart..1]. No-contact clips (feint / dodge / hurt / stagger) fall back to the
  // windup boundary (or a single span).
  const dur = info.dur || 1;
  const frames = Math.max(1, Math.round(dur / STEP_DT));
  const wEnd = info.impacts.length ? info.impacts[0] / dur : (info.windup > 0 ? info.windup / dur : 0);
  const rStart = info.impacts.length ? info.impacts[info.impacts.length - 1] / dur : (info.windup > 0 ? info.windup / dur : 1);
  // Pre-compute percentages here (templates can't call Math).
  clipState.value = {
    dur,
    elapsed: info.elapsed,
    frame: Math.min(frames, Math.floor(info.elapsed / STEP_DT) + 1),
    frames,
    feint: info.feint,
    headPct: Math.max(0, Math.min(1, info.elapsed / dur)) * 100,
    ticksPct: info.impacts.map((t) => (t / dur) * 100),
    windupPct: wEnd * 100,
    contactLeftPct: wEnd * 100,
    contactWPct: Math.max(0, rStart - wEnd) * 100,
    returnLeftPct: rStart * 100,
    returnWPct: Math.max(0, 1 - rStart) * 100,
  };
}

// --- Motion trail: sample the striking limb's tip world position each playing
//     frame, age points out over TRAIL_LIFE, redraw the fading polyline. Read-only
//     (samples joints exposed by buildFighter) — the driver is untouched.
function sampleTrail() {
  const m = activeMove.value;
  if (trailOn.value && clipActive && playing.value && fighter && m && m.kind === 'clip' && m.limb) {
    const spec = LIMB_TIP[m.limb];
    const j = fighter.joints;
    const node = spec && j ? spec.node(j) : null;
    if (node) {
      node.updateWorldMatrix(true, false); // fresh world matrix for this frame's pose
      _v.set(spec.off[0], spec.off[1], spec.off[2]);
      node.localToWorld(_v);
      trailPts.push({ x: _v.x, y: _v.y, z: _v.z, t: vTime });
      if (trailPts.length > TRAIL_MAX) trailPts.shift();
    }
  }
  // Drop points older than the lifetime (and, on a backward scrub, future points).
  while (trailPts.length && (vTime - trailPts[0].t > TRAIL_LIFE || vTime - trailPts[0].t < 0)) trailPts.shift();
  updateTrailLine();
}
function updateTrailLine() {
  if (!trailLine) return;
  const n = trailPts.length;
  if (n < 2) { trailLine.visible = false; return; }
  const pos = trailGeo.attributes.position.array;
  const col = trailGeo.attributes.color.array;
  for (let i = 0; i < n; i++) {
    const pt = trailPts[i];
    pos[i * 3] = pt.x; pos[i * 3 + 1] = pt.y; pos[i * 3 + 2] = pt.z;
    const b = 1 - Math.max(0, Math.min(1, (vTime - pt.t) / TRAIL_LIFE)); // head bright → tail dim
    col[i * 3] = PINK_RGB[0] * b; col[i * 3 + 1] = PINK_RGB[1] * b; col[i * 3 + 2] = PINK_RGB[2] * b;
  }
  trailGeo.attributes.position.needsUpdate = true;
  trailGeo.attributes.color.needsUpdate = true;
  trailGeo.setDrawRange(0, n);
  trailLine.visible = true;
}
function clearTrail() {
  trailPts = [];
  if (trailLine) trailLine.visible = false;
}

// --- Camera snap (smooth doezzhaet over ~0.55s, cancelled by a manual drag).
function snapView(key) {
  const v = VIEWS[key];
  if (!v || !camera || !controls) return;
  viewKey.value = key;
  viewLabel.value = v.label;
  camAnim = {
    t: 0, dur: 0.55,
    fromPos: camera.position.clone(), toPos: v.pos.clone(),
    fromTarget: controls.target.clone(), toTarget: LOOK.clone(),
  };
}

onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0e14); // dark neutral

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.copy(VIEWS['3q'].pos);

  // --- Even technical light: a key + a back-fill so the silhouette reads from
  //     every orbit angle (the camera goes all the way around), plus soft ambient.
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(4, 8, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8fa0c0, 0.7);
  fill.position.set(-5, 4, -5);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x3a4256, 0.75));
  scene.add(new THREE.HemisphereLight(0x586a90, 0x0d0f16, 0.55));

  // --- Plain podium: a low disc the fighter stands on, top at y = 0.
  floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 1, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.151;
  scene.add(floor);
  podium = new THREE.Mesh(
    new THREE.CylinderGeometry(2.55, 2.7, 0.3, 56),
    new THREE.MeshStandardMaterial({ color: 0x161a22, flatShading: true, roughness: 0.9, metalness: 0.05 }),
  );
  podium.position.y = -0.15;
  scene.add(podium);

  dummyGroup = buildDummy();
  scene.add(dummyGroup);

  // --- Motion-trail line (vertex-coloured polyline, fades head→tail). Preallocated
  //     to TRAIL_MAX points; positions / colours rewritten each frame.
  trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: true });
  trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3));
  trailGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3));
  trailGeo.setDrawRange(0, 0);
  trailLine = new THREE.Line(trailGeo, trailMat);
  trailLine.frustumCulled = false;
  trailLine.visible = false;
  scene.add(trailLine);

  spawnFighter();

  // --- Orbit camera: drag to rotate all the way around, wheel/pinch zoom.
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(LOOK);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 20;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = 1.5;
  controls.update();
  // A manual drag cancels a running snap tween and marks the view FREE.
  controls.addEventListener('start', () => { camAnim = null; viewKey.value = null; viewLabel.value = 'FREE'; });

  clock = new THREE.Clock();

  const loop = () => {
    const real = Math.min(0.05, clock.getDelta()); // capped (tab-switch / hitch safe)

    // Advance the VIRTUAL clock per the transport: playing → real·speed; paused →
    // only a queued frame-step. Everything in the body keys off this t.
    if (playing.value) vTime += real * SPEEDS[speedIdx.value];
    else if (pendingStep > 0) { vTime += pendingStep; pendingStep = 0; }

    // Camera snap tween runs in REAL time so it works while paused.
    if (camAnim) {
      camAnim.t = Math.min(camAnim.dur, camAnim.t + real);
      const u = camAnim.t / camAnim.dur;
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; // smoothstep
      camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, e);
      controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, e);
      if (u >= 1) camAnim = null;
    }
    controls.update();

    fighter?.update(vTime, camera);

    // Loop a clip-type movement: re-call its trigger each playing frame. play()
    // no-ops while a clip runs, so it re-fires only once the previous one ends —
    // a seamless loop at the real clip duration, no body changes needed.
    if (playing.value && loopOn.value && fighter) {
      const m = activeMove.value;
      if (m && m.kind === 'clip') m.run(fighter);
    }

    // Display tools: clip time-bar + frame counter + auto-pause-on-contact, then
    // the striking-limb motion trail. Both read-only (getClipInfo + joints).
    processClipDisplay();
    sampleTrail();

    // Dummy contact flash (reads a strike landing).
    if (dummyGroup && dummyMat) {
      const since = vTime - dummyHitT;
      const flash = dummyHitT >= 0 && since >= 0 && since < 0.25 ? 1 - since / 0.25 : 0;
      dummyMat.emissive.setRGB(flash * 0.9, flash * 0.1, flash * 0.25);
      dummyGroup.scale.setScalar(1 + flash * 0.06);
    }

    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else { clock.getDelta(); renderer.setAnimationLoop(loop); } // drop the hidden gap
  };
  document.addEventListener('visibilitychange', onVisibility);

  // Keyboard shortcuts: Space play/pause · . step · arrows nothing.
  onKeydown = (e) => {
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    else if (e.key === '.') stepFrame();
    else if (e.key === 'l') toggleLoop();
  };
  window.addEventListener('keydown', onKeydown);

  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (onKeydown) window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('pointermove', scrubMove);
  window.removeEventListener('pointerup', scrubEnd);
  if (renderer) renderer.setAnimationLoop(null);
  if (trailGeo) trailGeo.dispose();
  if (trailMat) trailMat.dispose();
  if (controls) controls.dispose();
  if (fighter) fighter.dispose();
  if (dummyGroup) {
    dummyGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    if (dummyMat) dummyMat.dispose();
  }
  for (const m of [floor, podium]) {
    if (!m) continue;
    if (m.geometry) m.geometry.dispose();
    if (m.material) m.material.dispose();
  }
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.lab-wrap {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 45%, #11141d 0%, #0a0c12 60%, #050608 100%);
  font-family: var(--font-mono, monospace);
  color: #fff;
}
.lab-canvas { display: block; width: 100%; height: 100%; }

/* Side panel. */
.lab-panel {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 230px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px;
  background: rgba(8, 10, 18, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
}
.lab-title {
  font-size: 12px;
  letter-spacing: 0.18em;
  color: #ff0069;
}
.lab-group { display: flex; flex-direction: column; gap: 6px; }
.lab-label {
  font-size: 9px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.45);
}
.lab-row { display: flex; flex-wrap: wrap; gap: 5px; }

/* Shared button (panel + transport + views). */
.lab-btn {
  pointer-events: auto;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(14, 17, 26, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  padding: 5px 9px;
  cursor: pointer;
}
.lab-btn:hover { color: #fff; border-color: #ff0069; }
.lab-btn.on { color: #fff; background: #ff0069; border-color: #ff0069; }
.lab-btn.wide { min-width: 86px; }

/* Camera snaps (top-right). */
.lab-views {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 6px;
}

/* Transport (bottom-centre). */
.lab-transport {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  padding: 8px;
  background: rgba(8, 10, 18, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
}

/* On-screen readout (bottom-right). */
.lab-readout {
  position: absolute;
  right: 14px;
  bottom: 64px;
  pointer-events: none;
  font-size: 10px;
  letter-spacing: 0.08em;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.62);
  background: rgba(8, 10, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  padding: 5px 9px;
}

/* Manner description (in-panel, while an intention is selected). */
.lab-manner-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  letter-spacing: 0.06em;
  line-height: 1.6;
}
.lmr-k { color: rgba(255, 255, 255, 0.42); }
.lmr-v { color: rgba(255, 255, 255, 0.85); text-align: right; }

/* Clip time-bar (bottom-centre, above the transport). */
.lab-timebar {
  position: absolute;
  bottom: 66px;
  left: 50%;
  transform: translateX(-50%);
  width: min(460px, 70vw);
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 10px;
  background: rgba(8, 10, 18, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
}
.ltb-meta {
  display: flex;
  gap: 12px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
}
.ltb-feint { color: #ff0069; }
.ltb-track {
  position: relative;
  height: 14px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  cursor: ew-resize;
  overflow: hidden;
  touch-action: none;
}
.ltb-seg {
  position: absolute;
  top: 0;
  bottom: 0;
}
.s-windup { background: rgba(120, 160, 255, 0.22); }   /* замах */
.s-contact { background: rgba(255, 6, 105, 0.32); }    /* контакт */
.s-return { background: rgba(120, 255, 180, 0.16); }   /* возврат */
.ltb-tick {
  position: absolute;
  top: -1px;
  bottom: -1px;
  width: 2px;
  margin-left: -1px;
  background: #ff0069;
  box-shadow: 0 0 4px rgba(255, 6, 105, 0.8);
}
.ltb-head {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 3px;
  margin-left: -1.5px;
  background: #fff;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.85);
  pointer-events: none;
}
.ltb-phases {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.4);
}
</style>
