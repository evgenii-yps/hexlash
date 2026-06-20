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
import { INTENTION_IDS } from '@/data/intentions.js';
import { CORES, CRYSTALS, getCore } from '@/data/upgradeData.js';
import { resolveBehavior } from '@/data/behavior.js';

const PINK = '#FF0069';

// --- Movement registry (DATA). Intentions auto-derive from the source of truth so
//     a new intention upstream appears here for free. Techniques are one descriptor
//     line each; run(f) calls the EXISTING body API (no parallel motion code). Add a
//     future move (kick / layer-3) by adding one line once buildFighter exposes it.
const intentionMoves = INTENTION_IDS.map((id) => ({ id, label: id.toUpperCase(), kind: 'intention' }));
const techniqueMoves = [
  { id: 'punch',   label: 'PUNCH',   kind: 'clip',    run: (f) => f.punch() },
  { id: 'double',  label: 'DOUBLE',  kind: 'clip',    run: (f) => f.double() },
  { id: 'combo',   label: 'COMBO',   kind: 'clip',    run: (f) => f.combo() },
  { id: 'dodge',   label: 'DODGE',   kind: 'clip',    run: (f) => f.dodge() },
  { id: 'feint',   label: 'FEINT',   kind: 'clip',    run: (f) => f.feint() },
  { id: 'stagger', label: 'STAGGER', kind: 'clip',    run: (f) => f.stagger() },
  { id: 'block',   label: 'BLOCK',   kind: 'toggle',  run: (f) => f.toggleBlock() },
  { id: 'charge',  label: 'CHARGE',  kind: 'special', run: (f) => (f.getCharge01() < 0.999 ? f.fillCharge() : f.discharge()) },
];
const allMoves = [...intentionMoves, ...techniqueMoves];

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

const coreName = computed(() => getCore(coreId.value).name);
const speedLabel = computed(() => `${SPEEDS[speedIdx.value]}x`);
const activeLabel = computed(() => {
  const m = allMoves.find((x) => x.id === activeId.value);
  return m ? `${m.label} (${m.kind})` : '—';
});

// --- Three.js + sim state (non-reactive).
let renderer, scene, camera, controls, clock, fighter;
let floor = null, podium = null;
let dummyGroup = null, dummyMat = null;
let resizeObserver, onVisibility, onKeydown;
let vTime = 0;            // VIRTUAL clock fed to fighter.update — the transport drives this
let pendingStep = 0;      // virtual seconds to advance on a frame-step (while paused)
let dummyHitT = -1;       // vTime of the last strike on the dummy → contact flash
let camAnim = null;       // { t, dur, fromPos, toPos, fromTarget, toTarget } camera tween (real time)
const STEP_DT = 1 / 60;   // one frame of virtual time per STEP

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
function replay() { fireMove(allMoves.find((x) => x.id === activeId.value)); }

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
      const m = allMoves.find((x) => x.id === activeId.value);
      if (m && m.kind === 'clip') m.run(fighter);
    }

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
  if (renderer) renderer.setAnimationLoop(null);
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
</style>
