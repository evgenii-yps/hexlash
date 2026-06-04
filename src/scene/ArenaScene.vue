<!-- ArenaScene — Three.js arena, the foundation for future combat. Two slabs
     with torn jagged inner edges split by a wide gap, the rift glowing as the
     single light (torn-rift pass 3/3), floating in dark void; orbit-drag + zoom,
     default 3/4 top view. Sharp render (full DPR, mipmapped hex) with switchable
     presence "moods" (?mood=A|B|C or keys 1/2/3) the owner picks on preview.
     One idle fighter-construct stands on the near (player) half; no combat, no
     HUD, no controls (separate stages).

     Discipline: one pink accent (#FF0069 from --hex-primary) + one glow (the
     rift — pulses as a whole, no running beam); nothing else glows, no pink
     under the plates. Throttled when idle/hidden, respects prefers-reduced-motion. -->
<template>
  <div ref="wrap" class="arena-wrap">
    <canvas ref="canvasEl" class="arena-canvas" />
    <div class="arena-vignette" />
    <div class="arena-hint">MOOD {{ variant }} · 1 / 2 / 3</div>
    <!-- Temporary dev triggers (preview only) — mirror the keys Z / X / C. -->
    <div class="arena-actions">
      <button type="button" class="tgt" @click="toggleTarget">TGT: {{ target === 'player' ? 'P1' : 'P2' }}</button>
      <button type="button" @click="onApproach">APPROACH</button>
      <button type="button" @click="onPunch">PUNCH</button>
      <button type="button" @click="onCombo">COMBO</button>
      <button type="button" @click="onDouble">DOUBLE</button>
      <button type="button" @click="onWalk">WALK</button>
      <button type="button" @click="onRun">RUN</button>
      <button type="button" @click="onHurt">HURT</button>
      <button type="button" @click="onOut">OUT</button>
      <button type="button" class="tgt" @click="onDemo">DEMO</button>
      <button type="button" class="tgt" @click="onAITarget">AI</button>
      <button type="button" class="tgt" @click="onAIBoth">AI×2</button>
      <button type="button" class="tgt" @click="onFight">FIGHT</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildArena } from './buildArena.js';
import { buildFighter } from './buildFighter.js';
import { createArenaPresence } from './arenaPresence.js';

const wrap = ref(null);
const canvasEl = ref(null);
const variant = ref('A');
const target = ref('player'); // which fighter the dev triggers act on

let renderer, scene, camera, controls, arena, fighter, opponent, presence, resizeObserver, clock;
let onVisibility, onKeydown, onControlsStart, onControlsEnd;
// Pre-load readiness: emit once after the first frame is rendered so the
// bootstrap splash (#hx-load) can fade out on real arena readiness.
let firstFrameEmitted = false;

// Dev demo (key G) — a readable open-arena exchange: both fighters go autonomous
// (approach, trade blows wherever they meet, reposition), then settle back to
// idle after a few seconds. Not a real bout (no win-freeze) — just a preview of
// the open model. Runs on a small timed window via the loop.
let demo = null; // { start, events:[{t, fn, done}] } while running
let demoPending = false;
// Autonomous-behaviour intent per side (kept across respawns so a KO doesn't
// stop the loop). Toggled via key A (current target) / the AI buttons.
let aiPlayer = false;
let aiOpponent = false;
// Full self-running fight (key F / FIGHT button). runFight is assigned in
// onMounted (needs the scene); fightActive gates the win-and-freeze behaviour.
let fightActive = false;
let runFight = null;

// idle-drift bookkeeping (variant B)
let userActive = false;
let lastEnd = 0;
let wasIdle = false;
let baseAz = 0;
let basePolar = 0;
let driftStart = 0;

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

// Dev action triggers (preview) — act on the selected fighter; toggle with P /
// the TGT button. Each fighter ignores triggers under reduced-motion.
const curFighter = () => (target.value === 'opponent' ? opponent : fighter);
function toggleTarget() { target.value = target.value === 'player' ? 'opponent' : 'player'; }
function onApproach() { curFighter()?.approach(); }
function onPunch() { curFighter()?.punch(); }
function onCombo() { curFighter()?.combo(); }
function onDouble() { curFighter()?.double(); }
function onWalk() { curFighter()?.walk(); }
function onRun() { curFighter()?.run(); }
function onHurt() { curFighter()?.hurt(); }
function onOut() { curFighter()?.eliminate(); }

// Open-arena exchange: turn both fighters autonomous so they close in and trade
// wherever they meet (the autonomous nav + radius-strike resolves the clash —
// the attacker's onImpact damages whoever is in reach; the defender recoils +
// flashes its core). Settle back to idle after a short window.
const DEMO_DUR = 8; // seconds of autonomous sparring, then idle
function setBothAI(on) {
  aiPlayer = on;
  aiOpponent = on;
  fighter?.setAI(on);
  opponent?.setAI(on);
}
function buildDemoEvents() {
  return [
    { t: 0, fn: () => setBothAI(true) }, // approach + trade
    { t: DEMO_DUR, fn: () => setBothAI(false) }, // settle to idle
  ];
}
function onDemo() { if (!demo) demoPending = true; }
// Toggle autonomous behaviour: A / AI button = current target; AI×2 = both.
function onAITarget() {
  if (target.value === 'opponent') { aiOpponent = !aiOpponent; opponent?.setAI(aiOpponent); }
  else { aiPlayer = !aiPlayer; fighter?.setAI(aiPlayer); }
}
function onAIBoth() {
  setBothAI(!(aiPlayer && aiOpponent));
}
function onFight() { runFight?.(); }

// Damage per clean hit (tunable, slight variance per blow) → ~5-6 hits to OUT.
const rollDamage = () => 18 + Math.round(Math.random() * 6 - 3);

function normalizeVariant(v) {
  const u = String(v || '').toUpperCase();
  return ['A', 'B', 'C'].includes(u) ? u : 'A';
}

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
  arena = buildArena(renderer.capabilities.getMaxAnisotropy(), pink);
  scene.add(arena.group);
  presence = createArenaPresence(scene, arena.refs);
  presence.setReducedMotion(reducedMotion);
  variant.value = normalizeVariant(new URLSearchParams(window.location.search).get('mood'));
  presence.setVariant(variant.value);

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
  };
  const spawnFighter = () => {
    fighter = buildFighter(pink, {
      side: 'player',
      bounds: navBounds,
      getFoePos: () => (opponent ? opponent.group.position : null),
      onImpact: () => { opponent?.takeDamage(rollDamage()); }, // hit signal is on the foe (recoil + core)
      onEliminated: () => {
        scene.remove(fighter.group);
        fighter.dispose();
        fighter = null;
        if (fightActive) endFight(); // opponent wins; freeze
        else spawnFighter(); // dev respawn
      },
    });
    fighter.group.position.set(0.45, arena.refs.topY, 1.3); // off-centre, asymmetric to the opponent
    fighter.setReducedMotion(reducedMotion);
    fighter.setAI(aiPlayer); // keep AI on across respawn
    scene.add(fighter.group);
  };
  const spawnOpponent = () => {
    opponent = buildFighter(pink, {
      side: 'opponent',
      bounds: navBounds,
      getFoePos: () => (fighter ? fighter.group.position : null),
      onImpact: () => { fighter?.takeDamage(rollDamage()); }, // hit signal is on the foe (recoil + core)
      onEliminated: () => {
        scene.remove(opponent.group);
        opponent.dispose();
        opponent = null;
        if (fightActive) endFight(); // player wins; freeze
        else spawnOpponent(); // dev respawn
      },
    });
    opponent.group.position.set(-0.65, arena.refs.topY, -1.4); // off-centre, not a mirror of the player
    opponent.setReducedMotion(reducedMotion);
    opponent.setAI(aiOpponent); // keep AI on across respawn
    scene.add(opponent.group);
  };
  spawnFighter();
  spawnOpponent();

  // FIGHT (key F / button): clean re-run — dispose both, respawn fresh at full
  // HP + neutral, then both fight autonomously until one is eliminated.
  runFight = () => {
    if (fighter) { scene.remove(fighter.group); fighter.dispose(); fighter = null; }
    if (opponent) { scene.remove(opponent.group); opponent.dispose(); opponent = null; }
    aiPlayer = true;
    aiOpponent = true;
    fightActive = true;
    spawnFighter();
    spawnOpponent();
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

  onControlsStart = () => { userActive = true; wasIdle = false; };
  onControlsEnd = () => { userActive = false; lastEnd = performance.now(); };
  controls.addEventListener('start', onControlsStart);
  controls.addEventListener('end', onControlsEnd);

  // --- Render loop. FPS-capped (30 mobile / 60 desktop), elapsed time drives
  //     presence so skipped frames don't desync the breathing.
  clock = new THREE.Clock();
  const interval = 1000 / targetFPS;
  let lastFrame = 0;

  const loop = (time) => {
    if (time - lastFrame < interval) return;
    lastFrame = time;
    const t = clock.getElapsedTime();

    // Idle camera drift — only variant B, only when the user isn't touching.
    if (variant.value === 'B' && !reducedMotion) {
      const idle = !userActive && performance.now() - lastEnd > 2500;
      if (idle && !wasIdle) {
        baseAz = controls.getAzimuthalAngle();
        basePolar = controls.getPolarAngle();
        driftStart = t;
      }
      if (idle) {
        const d = t - driftStart;
        controls.setAzimuthalAngle(baseAz + Math.sin(d * 0.16) * 0.045);
        controls.setPolarAngle(
          THREE.MathUtils.clamp(basePolar + Math.sin(d * 0.11) * 0.022, 0.25, 1.45),
        );
      }
      wasIdle = idle;
    }

    controls.update();
    presence.update(t);
    fighter?.update(t); // may be null after a fight ends, until next FIGHT
    opponent?.update(t);

    // Dev demo exchange — fire scheduled events on loop time (paused with the
    // loop when hidden; skipped under reduced-motion).
    if (demoPending) {
      demoPending = false;
      if (!reducedMotion) demo = { start: t, events: buildDemoEvents() };
    }
    if (demo) {
      const dt = t - demo.start;
      for (const e of demo.events) { if (!e.done && dt >= e.t) { e.done = true; e.fn(); } }
      if (demo.events.every((e) => e.done)) demo = null;
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

  // --- Dev triggers on preview: 1/2/3 = presence moods, Z/X/C = fighter actions.
  onKeydown = (e) => {
    const map = { 1: 'A', 2: 'B', 3: 'C' };
    if (map[e.key]) {
      variant.value = map[e.key];
      presence.setVariant(variant.value);
    } else if (e.key === 'p') toggleTarget();
    else if (e.key === 'z') curFighter()?.approach();
    else if (e.key === 'x') curFighter()?.punch();
    else if (e.key === 'c') curFighter()?.combo();
    else if (e.key === 'v') curFighter()?.double();
    else if (e.key === 'b') curFighter()?.walk();
    else if (e.key === 'n') curFighter()?.run();
    else if (e.key === 'h') curFighter()?.hurt();
    else if (e.key === 'k') curFighter()?.eliminate();
    else if (e.key === 'g') onDemo();
    else if (e.key === 'a') onAITarget();
    else if (e.key === 'f') onFight();
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
  if (controls) {
    if (onControlsStart) controls.removeEventListener('start', onControlsStart);
    if (onControlsEnd) controls.removeEventListener('end', onControlsEnd);
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
.arena-hint {
  position: absolute;
  left: 14px;
  bottom: 12px;
  pointer-events: none;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.32);
  user-select: none;
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
</style>
