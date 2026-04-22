<template>
  <canvas ref="canvasEl" class="canvas-layer" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import store from '@/core/state/store.js';
import { registerScene, activateScene, getActiveScene } from './sceneRegistry.js';
import { startRenderLoop, stopRenderLoop } from './renderLoop.js';
import { buildPitScene } from './scenes/PitScene.js';
import { attachOrbit } from './interaction/cameraController.js';
import { createPicker } from './interaction/raycaster.js';
import { useHoverState } from './interaction/useHoverState.js';
import { pickClick } from './interaction/useClickState.js';
import { setCanvasRef } from './interaction/useCanvasRef.js';

// Labels shown in the WorldHint under the pointer. Key = userData.id
// seeded on each clickable root in PitScene. Source: prototype 6887-6899.
const LABELS = {
  training:    'Training \u00b7 Heavy Bag',
  matchmaking: 'Matchmaking \u00b7 Terminal',
  create:      'Create New Fighter',
  ratings:     'Leaderboard',
  clan:        'Clan',
  shop:        'Locker \u00b7 Cosmetics',
  warden:      'View Warden',
  predator:    'View Predator',
};

const canvasEl = ref(null);
const hoverState = useHoverState();

let renderer = null;
let pit = null;
let orbit = null;
let picker = null;
let hoveredObj = null;
let onResize = null;
let onPointerMove = null;
let onPointerDown = null;
let onPointerUp = null;

onMounted(async () => {
  // Publish the canvas element so lazy scenes (FD, Fight) can attach their
  // own orbit/picker handlers without prop drilling. Epic 3A Step 6.
  setCanvasRef(canvasEl.value);

  // Epic 4 Step 2/3 — fetch agents BEFORE buildPitScene so slots 1+2 can
  // render the real captain + next agent. Failure is non-fatal (no auth,
  // offline, fresh install) — buildPitScene falls back to the legacy
  // warden+predator mocks when captain is null.
  //
  // Step 3 second-slot rule: secondAgent only fills when a real captain
  // exists. Without a captain the hub stays in full mock mode (both slots).
  // With captain + 0 other agents, slot 2 is intentionally empty — no
  // legacy predator mock alongside a real captain (looks dissonant).
  try {
    await store.dispatch('agent/fetchAgents');
  } catch (e) {
    console.warn('[CanvasLayer] agent/fetchAgents failed; falling back to mock fighters', e);
  }
  const captain = store.getters['agent/currentCaptain'] || null;
  const agentsList = store.getters['agent/agentsList'] || [];
  // agentsList is sorted captain-first (see agentState getters); the next
  // entry is the natural slot-2 candidate. Guarded to null when captain is
  // missing so the full-mock fallback path stays clean.
  const secondAgent = captain ? (agentsList[1] || null) : null;

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Epic 3A hot-fix — prototype enables ACES Filmic on all 5 renderers
  // (pit 5050, FD 7367, Fight 8091, Create 8872, Profile 9344). Missed in
  // Epic 2 scaffold. Without this, highlights clip and midtones compress —
  // the v2 pit visually diverges from the prototype reference.
  // Per prototype parity, `toneMapped: false` is set only on the shopLocker
  // display (and eventually the matchmaking screen in Epic 3B+). All other
  // emissive/additive materials go through ACES, matching the prototype.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Exposure raised from prototype 1.05 to 2.3 for visual parity
  // on target hardware. Tuned iteratively against Vercel preview
  // (Epic 3A hot-fix). Coherent across all v2 scenes (pit, FD, fight).
  // Revisit in Epic 5 polish.
  renderer.toneMappingExposure = 2.3;

  const aspect = window.innerWidth / window.innerHeight;
  pit = buildPitScene(THREE, aspect, { captain, secondAgent });

  // Orbit camera (Step 7) — drives camera.position/lookAt every frame.
  // tick(t) here MUST run before pit.tick / renderer.render — composed below.
  orbit = attachOrbit(pit.camera, canvasEl.value);

  // Epic 3A Step 7 — pointer handlers are generalized over the active scene.
  // Each scene registers its own picker + drag predicate + hover scale +
  // labels, and CanvasLayer simply forwards pointer events through whatever
  // the active entry declares. Pit exposes its own picker here; FD registers
  // its picker inside FighterDetailView.
  picker = createPicker(pit.camera, pit.clickableTargets, THREE);

  registerScene('pit', {
    scene: pit.scene,
    camera: pit.camera,
    tick: (t) => {
      orbit.tick(t);
      pit.tick(t);
    },
    picker,
    getIsDragging: () => orbit.getIsDragging(),
    hoverScale: 1.04,
    labels: LABELS,
  });
  // Guard: only activate 'pit' if no other scene has already been
  // activated. Protects against mount race — when entering /v2/fd/*
  // or /v2/fight directly, async View may activate its scene before
  // CanvasLayer mounts. Without guard CanvasLayer would overwrite it.
  // Alt: move activateScene('pit') out of CanvasLayer into PitViewV2
  // (Epic 5 polish — cleaner separation). Noted as deferred refactor.
  if (!getActiveScene()) activateScene('pit');
  startRenderLoop(renderer, THREE);

  onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    pit.camera.aspect = w / h;
    pit.camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // --- HOVER (Epic 2 Step 16; generalized in Epic 3A Step 7) ---
  // Uses whatever picker + drag predicate the ACTIVE scene registered. Hover
  // hints only show for scenes that provide a `labels` map. Prototype 6859-
  // 6913 (pit) + 7616-7629 (fd) — the paths are identical across scenes.
  onPointerMove = (e) => {
    const active = getActiveScene();
    if (!active || !active.picker) return;
    if (active.getIsDragging && active.getIsDragging()) return;
    const hit = active.picker.pickAt(e.clientX, e.clientY);
    if (hit !== hoveredObj) {
      if (hoveredObj) hoveredObj.userData.hoverScale = 1.0;
      hoveredObj = hit;
      if (hit) {
        hit.userData.hoverScale = active.hoverScale || 1.04;
        document.body.style.cursor = 'pointer';
        // Epic 4 Step 2 — labelOverride wins over the static labels map so
        // dynamic IDs (real agent UUIDs) can carry per-instance hint text.
        const label =
          hit.userData.labelOverride ||
          (active.labels ? active.labels[hit.userData.id] : '') ||
          '';
        hoverState.text = label;
        hoverState.visible = !!label;
      } else {
        document.body.style.cursor = '';
        hoverState.visible = false;
      }
    }
    if (hoveredObj && hoverState.visible) {
      hoverState.x = e.clientX;
      hoverState.y = e.clientY;
    }
  };
  canvasEl.value.addEventListener('pointermove', onPointerMove);

  // --- CLICK (Epic 2 Step 17; generalized in Epic 3A Step 7) ---
  // Click = pointerdown+pointerup pair with < 5px movement. Routes through
  // the active scene's picker and dispatches via useClickState.
  let downX = 0;
  let downY = 0;
  onPointerDown = (e) => {
    downX = e.clientX;
    downY = e.clientY;
  };
  onPointerUp = (e) => {
    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    if (Math.hypot(dx, dy) >= 5) return; // drag, not click
    const active = getActiveScene();
    if (!active || !active.picker) return;
    const hit = active.picker.pickAt(e.clientX, e.clientY);
    if (hit && hit.userData.id) pickClick(hit.userData.id);
  };
  canvasEl.value.addEventListener('pointerdown', onPointerDown);
  canvasEl.value.addEventListener('pointerup', onPointerUp);
});

function disposeScene(scene) {
  if (!scene) return;
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const m = obj.material;
    if (m) {
      const mats = Array.isArray(m) ? m : [m];
      mats.forEach((mat) => {
        if (mat.map) mat.map.dispose();
        if (mat.dispose) mat.dispose();
      });
    }
  });
}

onBeforeUnmount(() => {
  if (onResize) window.removeEventListener('resize', onResize);
  if (canvasEl.value) {
    if (onPointerMove) canvasEl.value.removeEventListener('pointermove', onPointerMove);
    if (onPointerDown) canvasEl.value.removeEventListener('pointerdown', onPointerDown);
    if (onPointerUp) canvasEl.value.removeEventListener('pointerup', onPointerUp);
  }
  // Reset body cursor + clear hover hint in case we're unmounted while hovering.
  document.body.style.cursor = '';
  hoverState.visible = false;
  hoverState.text = '';
  if (orbit) orbit.detach();
  stopRenderLoop();
  if (pit) {
    disposeScene(pit.scene);
    // Textures held by reference at PitScene level — dispose explicitly in case
    // they aren't reachable through scene.traverse (e.g. shared/aliased instances).
    if (pit.concreteTex) pit.concreteTex.dispose();
    if (pit.metalTex) pit.metalTex.dispose();
  }
  if (renderer) {
    renderer.dispose();
    if (renderer.forceContextLoss) renderer.forceContextLoss();
  }
  renderer = null;
  pit = null;
  orbit = null;
  picker = null;
  hoveredObj = null;
  onResize = null;
  onPointerMove = null;
  onPointerDown = null;
  onPointerUp = null;
  // Clear the published canvas reference so lazy scenes don't keep a stale
  // pointer across AppV2 remounts.
  setCanvasRef(null);
});
</script>

<style scoped>
.canvas-layer {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  display: block;
}
</style>
