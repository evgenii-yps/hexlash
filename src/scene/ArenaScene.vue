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
      <button type="button" @click="onApproach">APPROACH</button>
      <button type="button" @click="onPunch">PUNCH</button>
      <button type="button" @click="onCombo">COMBO</button>
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

let renderer, scene, camera, controls, arena, fighter, presence, resizeObserver, clock;
let onVisibility, onKeydown, onControlsStart, onControlsEnd;

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

// Dev action triggers (preview) — fighter ignores these under reduced-motion.
function onApproach() { fighter?.approach(); }
function onPunch() { fighter?.punch(); }
function onCombo() { fighter?.combo(); }

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

  // --- Fighter: one construct on the near (player) half, facing the rift. Its
  //     punch impact briefly flares the rift glow (same pink, no second colour).
  fighter = buildFighter(pink, { onImpact: () => presence.triggerFlash(0.55) });
  fighter.group.position.set(0, arena.refs.topY, 1.05);
  fighter.setReducedMotion(reducedMotion);
  scene.add(fighter.group);

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
    fighter.update(t);
    renderer.render(scene, camera);
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
    } else if (e.key === 'z') fighter.approach();
    else if (e.key === 'x') fighter.punch();
    else if (e.key === 'c') fighter.combo();
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
  gap: 6px;
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
</style>
