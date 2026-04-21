<!-- Epic 3Ba Step 2 — Training view orchestrator.
     Lazy scene registration pattern from Epic 3A FighterDetailView /
     FightView: build on mount, activate, reverse on unmount. HUD +
     energy-flash arrive in Step 6. -->
<template>
  <div class="training-view"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildTrainingScene } from '@/scene/scenes/TrainingScene.js';

let sceneApi = null;
let onResize = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

onMounted(() => {
  const aspect = window.innerWidth / window.innerHeight;
  sceneApi = buildTrainingScene(THREE, aspect);
  registerScene('training', {
    scene: sceneApi.scene,
    camera: sceneApi.camera,
    tick: sceneApi.tick,
  });
  activateScene('training');
  onResize = handleResize;
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  // Switch back to pit BEFORE disposing, so renderLoop doesn't touch a
  // freed scene on its next tick.
  activateScene('pit');
  unregisterScene('training');
  if (sceneApi) {
    sceneApi.dispose();
    sceneApi = null;
  }
});
</script>

<style scoped>
.training-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
