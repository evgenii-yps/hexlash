<template>
  <canvas ref="canvasEl" class="canvas-layer" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { registerScene, activateScene } from './sceneRegistry.js';
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

onMounted(() => {
  // Publish the canvas element so lazy scenes (FD, Fight) can attach their
  // own orbit/picker handlers without prop drilling. Epic 3A Step 6.
  setCanvasRef(canvasEl.value);

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

  const aspect = window.innerWidth / window.innerHeight;
  pit = buildPitScene(THREE, aspect);

  // Orbit camera (Step 7) — drives camera.position/lookAt every frame.
  // tick(t) here MUST run before pit.tick / renderer.render — composed below.
  orbit = attachOrbit(pit.camera, canvasEl.value);

  registerScene('pit', {
    scene: pit.scene,
    camera: pit.camera,
    tick: (t) => {
      orbit.tick(t);
      pit.tick(t);
    },
  });
  activateScene('pit');
  startRenderLoop(renderer, THREE);

  onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    pit.camera.aspect = w / h;
    pit.camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // --- HOVER (Step 16) ---
  // Raycaster over clickable roots. Skipped while orbit drag is active so
  // the user can sweep past objects without flicker. Prototype 6859-6913.
  picker = createPicker(pit.camera, pit.clickableTargets, THREE);

  onPointerMove = (e) => {
    if (orbit.getIsDragging()) return;
    const hit = picker.pickAt(e.clientX, e.clientY);
    if (hit !== hoveredObj) {
      if (hoveredObj) hoveredObj.userData.hoverScale = 1.0;
      hoveredObj = hit;
      if (hit) {
        hit.userData.hoverScale = 1.04;
        document.body.style.cursor = 'pointer';
        hoverState.text = LABELS[hit.userData.id] || '';
        hoverState.visible = hoverState.text !== '';
      } else {
        document.body.style.cursor = '';
        hoverState.visible = false;
      }
    }
    // Keep the hint pinned to the pointer while hovered.
    if (hoveredObj && hoverState.visible) {
      hoverState.x = e.clientX;
      hoverState.y = e.clientY;
    }
  };
  canvasEl.value.addEventListener('pointermove', onPointerMove);

  // --- CLICK (Step 17) ---
  // A click is a pointerdown+pointerup pair with < 5px movement. Anything
  // larger is treated as orbit drag and ignored. Prototype uses the same
  // dragMoved=false heuristic (cameraController tracks its own dragMoved).
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
    const hit = picker.pickAt(e.clientX, e.clientY);
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
