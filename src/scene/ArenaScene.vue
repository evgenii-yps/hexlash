<!-- ArenaScene — Three.js arena, the foundation for future combat. Two slabs
     with torn jagged inner edges split by a wide gap, the rift glowing as the
     single light (torn-rift pass 3/3), floating in dark void; orbit-drag + zoom,
     default 3/4 top view. Sharp render (full DPR, mipmapped hex). Single
     presence state — restrained whole-rift breathing ("clean platform"); manual
     orbit only.
     One idle fighter-construct stands on the near (player) half; no combat, no
     HUD, no controls (separate stages).

     Discipline: one pink accent (#FF0069 from --hex-primary) + one glow (the
     rift — pulses as a whole, no running beam); nothing else glows, no pink
     under the plates. Throttled when idle/hidden, respects prefers-reduced-motion. -->
<template>
  <div ref="wrap" class="arena-wrap">
    <canvas ref="canvasEl" class="arena-canvas" />
    <div class="arena-vignette" />
    <!-- Player combat-call HUD — shown during a bout. Tap a call → arm → tap the
         (highlighted) player fighter → apply. UI + feedback only this pass. -->
    <KlichBar v-if="combatActive" :levers="levers" :pool="klichPool" :armed-id="armedId" @arm="armLever" />
    <!-- Always-on dev-panel show/hide toggle (small corner). The panel auto-hides
         when a bout starts (clean player view) + returns when it ends; in the SIG
         auto-cycle the bout never ends, so this is the only way back. -->
    <button type="button" class="arena-panel-toggle" :class="{ on: panelVisible }" @click="panelVisible = !panelVisible" :aria-pressed="panelVisible" title="Toggle dev panel">DEV</button>
    <!-- Dev readability stand (preview only): FIGHT + the L/R signature A/B stand
         + GRAY. Hidden during a bout; brought back via the DEV corner toggle. -->
    <div v-if="panelVisible" class="arena-actions">
      <button type="button" class="tgt" @click="onFight">FIGHT</button>
      <button type="button" class="tgt" @click="cycleSig('left')">L:{{ sigTag(sigLeft) }}</button>
      <button type="button" class="tgt" @click="cycleSig('right')">R:{{ sigTag(sigRight) }}</button>
      <button type="button" class="tgt" @click="onSigFight">SIG FIGHT</button>
      <button type="button" class="tgt" :class="{ on: neutralColor }" @click="onNeutralColor">GRAY: {{ neutralColor ? 'ON' : 'OFF' }}</button>
      <button type="button" class="tgt" :class="{ on: brainMode === 'model' }" @click="onBrain">BRAIN: {{ brainMode === 'model' ? 'MODEL' : 'SPINAL' }}</button>
      <button type="button" class="tgt" :class="{ on: lockedIntention }" @click="onLockCycle">LOCK: {{ LOCK_ORDER[lockIdx].toUpperCase() }}</button>
      <button type="button" class="tgt" :class="{ on: blockDev }" @click="onBlockToggle">BLOCK: {{ blockDev ? 'ON' : 'OFF' }}</button>
      <button type="button" class="tgt" @click="onDevFeint">FEINT</button>
      <button type="button" class="tgt" @click="onDevStagger">STAGGER</button>
      <button type="button" class="tgt" @click="onDevCharge">CHARGE</button>
    </div>
    <!-- Dev stamina (силы) + charge (заряд) readout for both fighters — live. -->
    <div v-if="panelVisible" class="arena-readout">{{ staReadout }}<br>{{ chgReadout }}<br>{{ intReadout }}<br>{{ mdlReadout }}</div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildArena } from './buildArena.js';
import { buildFighter } from './buildFighter.js';
import { createArenaPresence } from './arenaPresence.js';
import store from '@/core/state/store.js';
import { getCore, CORES, CRYSTALS } from '@/data/upgradeData.js';
import { resolveBehavior } from '@/data/behavior.js';
import { facetPhrase } from '@/data/facetReadout.js';
import { SIG_PRESETS, SIG_ORDER, presetBehavior } from '@/data/behaviorPresets.js';
import { COMBAT_BALANCE } from '@/data/combatBalance.js';
import apiClient from '@/core/api/apiClient.js';
import KlichBar from './KlichBar.vue';

// Model-brain request (hybrid intention layer). Injected into each fighter; it
// POSTs the WORD context to the backend on a fight break and resolves to
// { intention, read }. The API key never touches the client — this only calls our
// own endpoint. Rejection (timeout / error) is handled in buildFighter (→ spinal).
const requestModelIntention = (payload) => apiClient.requestFighterIntention(payload);

const wrap = ref(null);
const canvasEl = ref(null);
// Dev-panel visibility — true at rest, auto-hidden during a bout, flipped by the
// always-on DEV corner toggle (the only way back during the SIG auto-cycle).
const panelVisible = ref(true);
// Dev readout — both fighters' stamina (силы) + charge (заряд), refreshed live
// (throttled) in the loop so the spend / recover can be watched. Temporary.
const staReadout = ref('STA  P —  ·  O —');
const chgReadout = ref('CHG  P —  ·  O —');
// Current intention of each fighter — so it's VISIBLE that differently-raised
// builds lean to different intentions. Refreshed (throttled) in the loop.
const intReadout = ref('INT  P —  ·  O —');
// Brain strategy ('spinal' = deterministic default; 'model' = hybrid Claude wake
// on fight breaks). Dev toggle only — prod default is spinal (OFF). The MDL readout
// shows model wakes/bout + last read so it's visible breaks stay ~5–10, not 80.
const brainMode = ref('spinal');
const mdlReadout = ref('MDL  off');
// Dev toggle: flip both fighters between spinal and model brain live. Wrapped so
// the toggle itself can never throw + eject from the arena (the model path degrades
// to spinal on any endpoint outcome — see apiClient.requestFighterIntention).
const onBrain = () => {
  try {
    brainMode.value = brainMode.value === 'model' ? 'spinal' : 'model';
    fighter?.setBrain?.(brainMode.value);
    opponent?.setBrain?.(brainMode.value);
  } catch (e) {
    console.warn('[arena] brain toggle failed — staying on spinal', e);
    brainMode.value = 'spinal';
  }
};

// DEV: lock BOTH fighters to one intention to inspect its body signature in
// isolation (cycles OFF → the 7 → OFF). Re-applied across respawns in spawn*().
const LOCK_ORDER = ['off', 'press', 'strike', 'sting', 'hold', 'catch', 'break', 'breathe'];
const lockIdx = ref(0);
const lockedIntention = ref(null); // null = off; else an intention id
const onLockCycle = () => {
  lockIdx.value = (lockIdx.value + 1) % LOCK_ORDER.length;
  const id = LOCK_ORDER[lockIdx.value];
  lockedIntention.value = id === 'off' ? null : id;
  fighter?.setIntentionLock?.(lockedIntention.value);
  opponent?.setIntentionLock?.(lockedIntention.value);
};

// --- Behaviour A/B dev stand (preview only). Pick a signature preset for the
//     LEFT (player slot) and RIGHT (opponent slot) fighter, run an autonomous
//     bout on the existing FIGHT pipeline, and auto-cycle (re-run at full HP) on
//     each KO so successive bouts can be watched without reloading. NEUTRAL
//     COLOUR greys both + kills the core glow so the read is movement-only. None
//     of this touches the real play → upgrade → arena flow (random opponent core
//     intact) — the presets only apply while a SIG bout is running (sigCycle).
const sigLeft = ref('onslaught');
const sigRight = ref('raider');
const neutralColor = ref(false);

// --- Klich (combat call) — the player's combat lever. UI + FEEDBACK ONLY this
//     pass: NO behaviour effect (the axis-shift hooks the applyKlich seam in a
//     separate ТЗ). Three calls; each has a per-bout charge counter (NOT a
//     cooldown) that resets on a new fight. Charges are reactive so the HUD badge
//     updates live. armedId / the arm→target→apply flow below is deliberately
//     GENERIC (a lever id + a fighter), so future buffs reuse it without a klich
//     hardcode. combatActive gates HUD visibility (shown during a FIGHT / SIG bout).
const KLICH_POOL = 3; // SHARED charge pool per bout — any call spends 1. Per-BOUT,
// NOT a cooldown, so the longer ~40-50s bout does NOT grant extra klich uses —
// the economy is length-independent (count deliberately unchanged this pass).
const levers = ref([
  { id: 'forward', label: 'ВПЕРЁД' },
  { id: 'retreat', label: 'ОТХОД' },
  { id: 'hold', label: 'ДЕРЖАТЬ' },
]);
const klichPool = ref(KLICH_POOL); // remaining shared charges (reactive → HUD badge)
const armedId = ref(null); // currently-armed lever id (targeting), or null at rest
const combatActive = ref(false); // HUD shown during a bout

let renderer, scene, camera, controls, arena, fighter, opponent, presence, resizeObserver, clock;
let onVisibility, onKeydown, onPointerDown, onPointerUp;
// Pre-load readiness: emit once after the first frame is rendered so the
// bootstrap splash (#hx-load) can fade out on real arena readiness.
let firstFrameEmitted = false;

// Autonomous-behaviour intent per side (kept across respawns so a KO doesn't
// stop the loop). Set by the FIGHT / SIG FIGHT bouts.
let aiPlayer = false;
let aiOpponent = false;
// Full self-running fight (key F / FIGHT button). runFight is assigned in
// onMounted (needs the scene); fightActive gates the win-and-freeze behaviour.
let fightActive = false;
let runFight = null;
// SIG dev stand: sigCycle owns the auto-restart-on-KO loop (distinct from the
// normal FIGHT win-and-freeze). runSigFight assigned in onMounted. sigRestartAt
// is loop time the next bout fires; lastFrameT is the live loop time (so an
// elimination handler can schedule the restart).
let sigCycle = false;
let sigRestartAt = 0;
let lastFrameT = 0;
let lastStaReadout = 0; // throttle clock for the dev stamina readout
let runSigFight = null;
// Loop time the current bout started — drives the fight-length safeguard
// (escalating damage). 0 = no bout running (multiplier stays 1). Set on every
// FIGHT / SIG bout, so a SIG auto-cycle re-arms it per re-run.
let fightStartT = 0;
const SIG_RESTART_DELAY = 1.4; // seconds after a KO before the next bout (~ the dissolve)

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

function onFight() { runFight?.(); }

// --- SIG dev-stand controls (preview only). Cancel the auto-cycle (a normal
//     FIGHT / AI / DEMO takes over from the A/B loop).
function cancelSig() { sigCycle = false; sigRestartAt = 0; combatActive.value = false; cancelArm(); }
const sigTag = (id) => SIG_PRESETS[id]?.tag || '—';
// Step a slot through the five presets (L = player slot, R = opponent slot).
function cycleSig(which) {
  const slot = which === 'left' ? sigLeft : sigRight;
  const i = SIG_ORDER.indexOf(slot.value);
  slot.value = SIG_ORDER[(i + 1) % SIG_ORDER.length];
}
function onSigFight() { runSigFight?.(); }
// NEUTRAL COLOUR toggle — grey both fighters + kill the core glow live (and
// re-applied on every respawn via the build option). Fighters only; the rift +
// arena are untouched.
function onNeutralColor() {
  neutralColor.value = !neutralColor.value;
  fighter?.setNeutralColor(neutralColor.value);
  opponent?.setNeutralColor(neutralColor.value);
}
// BLOCK dev toggle (key B / button) — manually raise / drop the player fighter's
// block stance to inspect the guard pose + damage softening without waiting for
// the reflex. Manual hold (Infinity) until toggled off.
const blockDev = ref(false);
function onBlockToggle() {
  blockDev.value = !blockDev.value;
  fighter?.setBlock(blockDev.value);
}
// FEINT dev trigger (key V / button) — throw the player fighter's feint once to
// see the fake + check the payoff. (F is already FIGHT, so feint is on V.)
function onDevFeint() { fighter?.feint(); }
// STAGGER dev trigger (key G / button) — play the player's interrupt reaction clip
// to see the new movement without timing an actual interrupt.
function onDevStagger() { fighter?.stagger(); }
// CHARGE dev trigger (key C / button) — first press fills the player's charge to
// full; once full, the next press throws the empowered strike (see the readout
// drop + the harder, guard-piercing hit).
function onDevCharge() {
  if (!fighter) return;
  if (fighter.getCharge01() < 0.999) fighter.fillCharge();
  else fighter.discharge();
}

// --- Generic arm → pick-fighter → apply flow (reusable by future buffs, NOT
//     klich-specific). Tap a lever → armed (targeting); own fighters light up;
//     tap an own fighter → apply (confirm pulse + charge −1); re-tap the lever or
//     tap a miss → cancel (no charge spent). The opponent is never an own fighter
//     and never highlights. The actual fighter pick (raycast on tap) is wired in
//     onMounted; these drive the state + visual feedback.
function ownFighters() { return fighter ? [fighter] : []; } // player side only
function setOwnHighlight(on) { for (const f of ownFighters()) f.setHighlight(on); }
function armLever(id) {
  if (klichPool.value <= 0) return; // shared pool empty → all calls inert
  if (!levers.value.some((l) => l.id === id)) return;
  if (armedId.value === id) { cancelArm(); return; } // re-tap the armed lever → cancel
  armedId.value = id;
  setOwnHighlight(true); // own fighters glow as selectable
}
function cancelArm() {
  armedId.value = null;
  setOwnHighlight(false);
}
function applyToFighter(targetFighter) {
  const id = armedId.value;
  if (!id || !targetFighter || klichPool.value <= 0) { cancelArm(); return; }
  klichPool.value -= 1; // spend 1 from the SHARED pool (HUD badge updates reactively)
  targetFighter.confirmPulse(); // visual confirm — bright flash on the fighter
  applyKlich(targetFighter, id); // the call's real effect (temporary axis bump)
  cancelArm(); // panel returns to rest
}
function resetKlich() { klichPool.value = KLICH_POOL; cancelArm(); }

// The player's call applied to one fighter — a TEMPORARY behaviour-axis bump
// (KLICH_PROFILES; smoothly applied + reverted in buildFighter, base untouched).
// Signature kept generic (fighter + call id) so future buffs reuse the same
// arm → target → apply flow.
function applyKlich(targetFighter, klichId) {
  targetFighter.applyKlich(klichId);
}

// Fight-length safeguard — escalating damage. The attacker hands its raw strike
// damage (сила удара × множитель приёма × джиттер, computed in buildFighter) to
// onImpact; this scales it by a multiplier that grows once a bout passes
// COMBAT_BALANCE.escalateStartSec, so a STALLING fight is guaranteed to finish
// past the ~40-50s target (applied to BOTH sides — same clock); a normal bout
// ends on its own before escalation bites.
const escalationMult = () => {
  if (!fightStartT) return 1; // no bout running → no escalation
  const elapsed = lastFrameT - fightStartT;
  if (elapsed <= COMBAT_BALANCE.escalateStartSec) return 1;
  const grown = 1 + (elapsed - COMBAT_BALANCE.escalateStartSec) * COMBAT_BALANCE.escalateGrowthPerSec;
  return Math.min(COMBAT_BALANCE.escalateMax, grown);
};

onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const targetFPS = coarse ? 30 : 60;

  // --- Renderer. Transparent so the CSS void shows behind the WebGL. Full
  //     device resolution (DPR capped — 2 desktop, 1.5 on low-power phones) so
  //     nothing is upscaled / blurry.
  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const maxDPR = lowPowerDevice() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  // Atmospheric haze — far edge of the slab dissolves into the void (depth +
  // hides far-half aliasing). Additive glows opt out via material.fog = false.
  scene.fog = new THREE.FogExp2(0x070811, 0.03);

  // --- Camera: perspective, 3/4 view from above (~56° tilt from vertical).
  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(5.5, 6.2, 7.5);

  // --- Lighting: one key directional from top-front (bright top, dark sides,
  //     sharp face boundaries via flat shading) + low cool fill.
  const key = new THREE.DirectionalLight(0xfff2e8, 2.3);
  key.position.set(4, 10, 6);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x2a3550, 0.5));
  scene.add(new THREE.HemisphereLight(0x44506e, 0x05060c, 0.4));

  // --- Arena + presence. Pink comes from the --hex-primary token (the scene
  //     inherits it via .app-v2), never hard-coded — one canonical pink.
  const pink = getComputedStyle(el).getPropertyValue('--hex-primary').trim() || '#FF0069';
  // Player's core (Заход 3): the chosen core glows its own hue on the player
  // fighter. The opponent + the rift stay canon pink — one glow source + a clean
  // friend/foe read. coreId is carried whole (not just the colour) so future
  // core→fight-style behaviour can hook onto the same id without rewiring. The
  // route guard normally blocks reaching the arena without a pick; canon-pink
  // fallback keeps the scene sane otherwise.
  // getCore() always resolves (falls back to Скала), so gate on the raw pick to
  // keep the canon-pink fallback when nothing was chosen.
  const pickedId = store.getters['prefight/selectedCoreId'];
  const selectedCore = pickedId ? getCore(pickedId) : null;
  const playerColor = selectedCore ? selectedCore.hue : pink;
  const playerCoreId = selectedCore ? selectedCore.id : null;

  // --- Behaviour resolve (data-каркас). Each fighter's profile = its core start
  //     profile + lit-facet shifts (empty shifts this pass → just the core). The
  //     player resolves from the picked core + the working upgrade tree's lit
  //     faces; the opponent is assigned its OWN random core (lit from that core's
  //     CRYSTALS defaults) so it fights by a different profile, never a mirror of
  //     the player. buildFighter maps these 8 levers onto its move / AI knobs.
  const collectLit = (crystals) => {
    const lit = [];
    for (const cr of crystals || []) for (const f of cr.faces || []) if (f.state === 'lit') lit.push(f);
    return lit;
  };
  // Player lit faces: the live working tree if present, else the picked core's
  // CRYSTALS defaults (so the arena reflects the build even without a tree).
  const playerTree = store.getters['prefight/upgradeTree'] || (playerCoreId ? CRYSTALS[playerCoreId] : null);
  const playerBehavior = resolveBehavior(playerCoreId, collectLit(playerTree));
  // Opponent: a random one of the four cores, lit from its own CRYSTALS defaults.
  const opponentCoreId = CORES[Math.floor(Math.random() * CORES.length)].id;
  const opponentBehavior = resolveBehavior(opponentCoreId, collectLit(CRYSTALS[opponentCoreId]));

  // Behaviour for a side: during a SIG dev bout the chosen signature preset
  // (L = player, R = opponent) overrides the core-derived profile; otherwise the
  // real core behaviour stands (so page load + the normal FIGHT button are the
  // genuine preview, opponent random core intact).
  const behaviorFor = (side) => {
    if (sigCycle) {
      const pb = presetBehavior(side === 'player' ? sigLeft.value : sigRight.value);
      if (pb) return pb;
    }
    return side === 'player' ? playerBehavior : opponentBehavior;
  };
  // Character PORTRAIT in WORDS for the model brain: the core's manner line + each
  // lit facet's manner-phrase (facetReadout) — NO raw axis numbers. Built where the
  // core + facet data lives; the backend just wraps it into the prompt. During a SIG
  // dev bout (no core/facets) a coarse preset label stands in.
  const portraitFor = (side) => {
    if (sigCycle) {
      const id = side === 'player' ? sigLeft.value : sigRight.value;
      return [`${String(id).toUpperCase()} signature fighter`];
    }
    const coreId = side === 'player' ? playerCoreId : opponentCoreId;
    const core = coreId ? getCore(coreId) : null;
    const lit = side === 'player' ? collectLit(playerTree) : collectLit(CRYSTALS[opponentCoreId]);
    const out = [];
    if (core) out.push(`${core.name} — ${core.manner}`);
    const seen = new Set();
    for (const f of lit) {
      const ph = facetPhrase(f);
      if (ph && !seen.has(ph)) { seen.add(ph); out.push(ph); }
    }
    return out;
  };
  arena = buildArena(renderer.capabilities.getMaxAnisotropy(), pink);
  scene.add(arena.group);
  presence = createArenaPresence(scene, arena.refs);
  presence.setReducedMotion(reducedMotion);

  // --- Fighters: spawned on opposite sides, then free to roam the whole plate —
  //     they navigate toward each other, manoeuvre at range and turn to face the
  //     moving target (the rift is no longer a barrier). A strike connecting in
  //     range damages the other; the hit signal lives ON the fighters (defender
  //     recoils + core flash), NOT on the rift — the rift stays ambient, so
  //     there's only one glow on screen. Elimination ends a FIGHT (winner idles);
  //     outside a fight it respawns (dev loop / re-preview).
  //
  // Plate bounds for navigation: half-extents minus a margin so feet stay on the
  // slab. The whole plate (both sides) is walkable.
  const NAV_MARGIN = 0.5;
  const navBounds = {
    x: arena.refs.W / 2 - NAV_MARGIN,
    z: arena.refs.totalDepth / 2 - NAV_MARGIN,
  };
  const endFight = () => {
    fightActive = false;
    aiPlayer = false;
    aiOpponent = false;
    fighter?.setAI(false); // winner stops attacking → settles to idle
    opponent?.setAI(false);
    combatActive.value = false; // hide the klich HUD when the bout ends
    panelVisible.value = true; // bout over → bring the dev panel back
    cancelArm();
  };
  const spawnFighter = () => {
    fighter = buildFighter(playerColor, {
      side: 'player',
      coreId: playerCoreId,
      behavior: behaviorFor('player'),
      bounds: navBounds,
      neutralColor: neutralColor.value,
      getFoePos: () => (opponent ? opponent.group.position : null),
      onImpact: (raw, pen, intr) => { opponent?.takeDamage(raw * escalationMult(), pen, intr); }, // attacker's strike damage × time safeguard; foe softens by toughness / block (pen = our block-pierce, intr = our ВОЛНОЛОМ interrupt-catch bonus)
      onAttackStart: () => opponent?.noteIncomingAttack?.(), // in-range attack incoming → the foe's block reflex
      onMiss: () => opponent?.noteFoeMissed?.(), // our strike went wide → the foe's КАПКАН counter window
      getFoeReacting: () => !!(opponent && (opponent.isBlocking?.() || opponent.isDodging?.())), // foe took the bait? (feint payoff)
      getFightContext: () => ({ escalation: escalationMult(), elapsed: fightStartT ? lastFrameT - fightStartT : 0 }), // shared context for the intention picker (escalation phase)
      getFoeStamina: () => (opponent ? opponent.getStamina01() : null), // foe wind (break detector + word memory)
      getFoeHp01: () => (opponent ? opponent.getHp() / opponent.maxHp : null), // foe health (break detector)
      brain: brainMode.value, // 'spinal' (default) | 'model' — dev toggle, prod is spinal
      portrait: portraitFor('player'), // character in words for the model brain
      requestModelIntention, // async backend call (model brain) — key stays server-side
      onEliminated: () => {
        scene.remove(fighter.group);
        fighter.dispose();
        fighter = null;
        if (sigCycle) { if (!sigRestartAt) sigRestartAt = lastFrameT + SIG_RESTART_DELAY; } // A/B auto-cycle
        else if (fightActive) endFight(); // opponent wins; freeze
        else spawnFighter(); // dev respawn
      },
    });
    fighter.group.position.set(0.45, arena.refs.topY, 1.3); // off-centre, asymmetric to the opponent
    fighter.setReducedMotion(reducedMotion);
    fighter.setAI(aiPlayer); // keep AI on across respawn
    if (lockedIntention.value) fighter.setIntentionLock(lockedIntention.value); // keep dev intention lock across respawn
    if (blockDev.value) fighter.setBlock(true); // keep a dev block stance across respawn
    scene.add(fighter.group);
  };
  const spawnOpponent = () => {
    opponent = buildFighter(pink, {
      side: 'opponent',
      coreId: opponentCoreId,
      behavior: behaviorFor('opponent'),
      bounds: navBounds,
      neutralColor: neutralColor.value,
      getFoePos: () => (fighter ? fighter.group.position : null),
      onImpact: (raw, pen, intr) => { fighter?.takeDamage(raw * escalationMult(), pen, intr); }, // attacker's strike damage × time safeguard; foe softens by toughness / block (pen = our block-pierce, intr = our ВОЛНОЛОМ interrupt-catch bonus)
      onAttackStart: () => fighter?.noteIncomingAttack?.(), // in-range attack incoming → the foe's block reflex
      onMiss: () => fighter?.noteFoeMissed?.(), // our strike went wide → the foe's КАПКАН counter window
      getFoeReacting: () => !!(fighter && (fighter.isBlocking?.() || fighter.isDodging?.())), // foe took the bait? (feint payoff)
      getFightContext: () => ({ escalation: escalationMult(), elapsed: fightStartT ? lastFrameT - fightStartT : 0 }), // shared context for the intention picker (escalation phase)
      getFoeStamina: () => (fighter ? fighter.getStamina01() : null), // foe wind (break detector + word memory)
      getFoeHp01: () => (fighter ? fighter.getHp() / fighter.maxHp : null), // foe health (break detector)
      brain: brainMode.value, // 'spinal' (default) | 'model' — dev toggle, prod is spinal
      portrait: portraitFor('opponent'), // character in words for the model brain
      requestModelIntention, // async backend call (model brain) — key stays server-side
      onEliminated: () => {
        scene.remove(opponent.group);
        opponent.dispose();
        opponent = null;
        if (sigCycle) { if (!sigRestartAt) sigRestartAt = lastFrameT + SIG_RESTART_DELAY; } // A/B auto-cycle
        else if (fightActive) endFight(); // player wins; freeze
        else spawnOpponent(); // dev respawn
      },
    });
    opponent.group.position.set(-0.65, arena.refs.topY, -1.4); // off-centre, not a mirror of the player
    opponent.setReducedMotion(reducedMotion);
    opponent.setAI(aiOpponent); // keep AI on across respawn
    if (lockedIntention.value) opponent.setIntentionLock(lockedIntention.value); // keep dev intention lock across respawn
    scene.add(opponent.group);
  };
  spawnFighter();
  spawnOpponent();

  // FIGHT (key F / button): clean re-run — dispose both, respawn fresh at full
  // HP + neutral, then both fight autonomously until one is eliminated.
  runFight = () => {
    cancelSig(); // a normal bout uses core behaviour, not the A/B presets
    if (fighter) { scene.remove(fighter.group); fighter.dispose(); fighter = null; }
    if (opponent) { scene.remove(opponent.group); opponent.dispose(); opponent = null; }
    aiPlayer = true;
    aiOpponent = true;
    fightActive = true;
    fightStartT = lastFrameT; // arm the fight-length safeguard clock
    spawnFighter();
    spawnOpponent();
    resetKlich(); // fresh charges for the new bout
    combatActive.value = true; // show the klich HUD
    panelVisible.value = false; // bout started → hide the dev panel (clean view)
  };

  // SIG dev bout (SIG FIGHT button): same clean re-run as FIGHT but the two
  // fighters take the chosen LEFT / RIGHT signature presets, and on each KO the
  // bout auto-restarts (sigCycle) at full HP so successive runs can be watched
  // back-to-back. fightActive stays off — sigCycle owns the end-handling
  // (auto-cycle), not the win-and-freeze path.
  runSigFight = () => {
    if (fighter) { scene.remove(fighter.group); fighter.dispose(); fighter = null; }
    if (opponent) { scene.remove(opponent.group); opponent.dispose(); opponent = null; }
    sigCycle = true;
    fightActive = false;
    sigRestartAt = 0;
    fightStartT = lastFrameT; // arm the fight-length safeguard clock (re-armed each auto-cycle re-run)
    aiPlayer = true;
    aiOpponent = true;
    spawnFighter();
    spawnOpponent();
    resetKlich(); // fresh charges for the new bout
    combatActive.value = true; // show the klich HUD
    panelVisible.value = false; // bout started → hide the dev panel (clean view)
  };

  // --- Orbit controls — drag to rotate, wheel / pinch zoom; centred, no pan.
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 18;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.45; // ~83°, never dip under the slab
  controls.update();

  // --- Klich targeting pick. Only while a lever is armed: a TAP (not a drag) on
  //     the player fighter applies the armed call; a tap that misses cancels the
  //     arming (no charge spent). Tap = pointerdown→up with little movement, so
  //     orbit-drag is untouched (a drag just rotates the camera). Raycast targets
  //     ONLY fighter.group (player) — the opponent is never selectable.
  const klichRay = new THREE.Raycaster();
  const klichNdc = new THREE.Vector2();
  let tapX = 0; let tapY = 0; let tapAt = 0;
  onPointerDown = (e) => { tapX = e.clientX; tapY = e.clientY; tapAt = performance.now(); };
  onPointerUp = (e) => {
    if (!armedId.value) return; // not armed → orbit owns the gesture
    const moved = Math.hypot(e.clientX - tapX, e.clientY - tapY);
    if (moved > 6 || performance.now() - tapAt > 700) return; // drag / long-press → not a tap
    const rect = renderer.domElement.getBoundingClientRect();
    klichNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    klichNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    klichRay.setFromCamera(klichNdc, camera);
    const hitPlayer = !!(fighter && klichRay.intersectObject(fighter.group, true).length);
    if (hitPlayer) applyToFighter(fighter); // tap on player fighter → apply
    else cancelArm(); // tap miss → cancel
  };
  canvasEl.value.addEventListener('pointerdown', onPointerDown);
  canvasEl.value.addEventListener('pointerup', onPointerUp);

  // --- Render loop. FPS-capped (30 mobile / 60 desktop), elapsed time drives
  //     presence so skipped frames don't desync the breathing.
  clock = new THREE.Clock();
  const interval = 1000 / targetFPS;
  let lastFrame = 0;

  const loop = (time) => {
    if (time - lastFrame < interval) return;
    lastFrame = time;
    const t = clock.getElapsedTime();
    lastFrameT = t; // live loop time — used to schedule the SIG auto-cycle restart

    controls.update();
    presence.update(t);
    fighter?.update(t, camera); // may be null after a fight ends, until next FIGHT
    opponent?.update(t, camera);

    // Dev readout (throttled ~5/s) — live stamina + charge of both fighters.
    if (panelVisible.value && t - lastStaReadout > 0.2) {
      lastStaReadout = t;
      const sta = (fr) => (fr ? Math.round(fr.getStamina01() * 100) : '—');
      const chg = (fr) => (fr ? Math.round(fr.getCharge01() * 100) : '—');
      const intn = (fr) => (fr && fr.getIntention ? fr.getIntention().toUpperCase() : '—');
      staReadout.value = `STA  P ${sta(fighter)}  ·  O ${sta(opponent)}`;
      chgReadout.value = `CHG  P ${chg(fighter)}  ·  O ${chg(opponent)}`;
      intReadout.value = `INT  P ${intn(fighter)}  ·  O ${intn(opponent)}`;
      // Model brain: wakes-per-bout counter (confirm ~5–10, not 80) + last "read".
      if (brainMode.value === 'model') {
        const cnt = (fr) => (fr && fr.getModelRequestCount ? fr.getModelRequestCount() : 0);
        const rd = (fr) => ((fr && fr.getModelRead && fr.getModelRead()) || '—').slice(0, 18);
        mdlReadout.value = `MDL  P ${cnt(fighter)} "${rd(fighter)}"  ·  O ${cnt(opponent)} "${rd(opponent)}"`;
      } else {
        mdlReadout.value = 'MDL  off (spinal)';
      }
    }

    // SIG A/B auto-cycle — a KO scheduled a restart; fire it (full HP, fresh
    // presets) so consecutive bouts run back-to-back without a reload.
    if (sigCycle && sigRestartAt && t >= sigRestartAt) {
      sigRestartAt = 0;
      runSigFight();
    }

    renderer.render(scene, camera);

    // First frame is on screen — signal pre-load readiness once (latch + event
    // so the bootstrap catches it regardless of listener-attach timing).
    if (!firstFrameEmitted) {
      firstFrameEmitted = true;
      window.__hexArenaReady = true;
      window.dispatchEvent(new CustomEvent('hexlash:arena-ready'));
    }
  };
  renderer.setAnimationLoop(loop);

  // --- Pause entirely when the tab is hidden.
  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else renderer.setAnimationLoop(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  // --- Dev keys on preview: F = FIGHT · B = block · V = feint · G = stagger ·
  //     C = charge (fill, then discharge). (F is FIGHT, so feint is on V.)
  onKeydown = (e) => {
    if (e.key === 'f') onFight();
    else if (e.key === 'b') onBlockToggle();
    else if (e.key === 'v') onDevFeint();
    else if (e.key === 'g') onDevStagger();
    else if (e.key === 'c') onDevCharge();
  };
  window.addEventListener('keydown', onKeydown);

  // --- Responsive to the container box (embedded + resize/rotate).
  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth;
    const ch = el.clientHeight;
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
  if (canvasEl.value) {
    if (onPointerDown) canvasEl.value.removeEventListener('pointerdown', onPointerDown);
    if (onPointerUp) canvasEl.value.removeEventListener('pointerup', onPointerUp);
  }
  if (renderer) renderer.setAnimationLoop(null);
  if (controls) controls.dispose();
  if (presence) presence.dispose();
  if (fighter) fighter.dispose();
  if (opponent) opponent.dispose();
  if (arena) arena.dispose();
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.arena-wrap {
  position: fixed;
  inset: 0;
  /* Near-black void with a faint radial lift toward the slab. */
  background: radial-gradient(
    ellipse 70% 60% at 50% 42%,
    #0d0f1c 0%,
    #070811 55%,
    #030308 100%
  );
}
.arena-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
/* Cheap vignette (no postprocess) — darkens the frame edges. */
.arena-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 75% 75% at 50% 48%,
    transparent 55%,
    rgba(3, 3, 8, 0.55) 100%
  );
}
/* Temporary dev stamina readout (preview only). */
.arena-readout {
  position: absolute;
  right: 14px;
  bottom: 44px;
  pointer-events: none;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(8, 10, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  padding: 4px 8px;
}
/* Temporary dev action triggers (preview only). */
.arena-actions {
  position: absolute;
  right: 14px;
  bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 60%;
}
.arena-actions button {
  pointer-events: auto;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.55);
  background: rgba(8, 10, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  padding: 5px 9px;
  cursor: pointer;
}
.arena-actions button:hover {
  color: #fff;
  border-color: var(--hex-primary, #ff0069);
}
.arena-actions button.tgt {
  color: var(--hex-primary, #ff0069);
  border-color: var(--hex-primary, #ff0069);
}
/* Active state for a toggle button (e.g. GRAY: ON). */
.arena-actions button.on {
  color: #fff;
  background: var(--hex-primary, #ff0069);
  border-color: var(--hex-primary, #ff0069);
}
/* Always-on dev-panel show/hide toggle — small, unobtrusive, top-right corner.
   Stays visible during a bout (incl. the SIG auto-cycle) so the panel is always
   recoverable. */
.arena-panel-toggle {
  position: absolute;
  top: 12px;
  right: 14px;
  pointer-events: auto;
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(8, 10, 18, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 4px 7px;
  cursor: pointer;
  opacity: 0.6;
}
.arena-panel-toggle:hover {
  opacity: 1;
  color: #fff;
  border-color: var(--hex-primary, #ff0069);
}
.arena-panel-toggle.on {
  color: var(--hex-primary, #ff0069);
  border-color: var(--hex-primary, #ff0069);
  opacity: 0.9;
}
</style>
