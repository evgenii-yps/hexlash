<template>
  <canvas ref="canvasEl" class="canvas-layer" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { registerScene, activateScene } from './sceneRegistry.js';
import { startRenderLoop, stopRenderLoop } from './renderLoop.js';
import { buildPitScene } from './scenes/PitScene.js';

const canvasEl = ref(null);

let renderer = null;
let pit = null;
let onResize = null;

onMounted(() => {
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

  registerScene('pit', { scene: pit.scene, camera: pit.camera, tick: pit.tick });
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
  stopRenderLoop();
  if (pit) {
    disposeScene(pit.scene);
    if (pit.concreteTex) pit.concreteTex.dispose();
  }
  if (renderer) {
    renderer.dispose();
    if (renderer.forceContextLoss) renderer.forceContextLoss();
  }
  renderer = null;
  pit = null;
  onResize = null;
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
