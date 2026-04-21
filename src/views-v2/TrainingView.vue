<!-- Epic 3Ba Step 6 — Training view orchestrator + HUD + energy-flash.
     Lazy scene registration pattern from Epic 3A FighterDetailView /
     FightView. Click-to-hit wiring arrives in Step 7a. -->
<template>
  <div class="training-view">
    <div class="energy-flash" :class="{ flash: energyFlashing }"></div>
    <HudTraining @back="onBack" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildTrainingScene } from '@/scene/scenes/TrainingScene.js';
import {
  startTrainingSession,
  resetTrainingState,
} from '@/scene/interaction/useTrainingState.js';
import HudTraining from '@/components/hud/HudTraining.vue';

const router = useRouter();
const energyFlashing = ref(false);

let sceneApi = null;
let onResize = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.push('/v2');
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

// Placeholder — invoked by Step 7a's click-to-hit when energy is 0.
// eslint-disable-next-line no-unused-vars
function triggerEnergyFlash() {
  energyFlashing.value = false;
  requestAnimationFrame(() => { energyFlashing.value = true; });
  setTimeout(() => { energyFlashing.value = false; }, 400);
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
  startTrainingSession();
  onResize = handleResize;
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (onResize) {
    window.removeEventListener('resize', onResize);
    onResize = null;
  }
  resetTrainingState();
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

/* Energy-depleted flash (prototype 2312-2322). Scoped here since it's tied
   to the view's overlay, not reused elsewhere. */
.energy-flash {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: rgba(255, 68, 68, 0);
  z-index: 4;
}
.energy-flash.flash { animation: energyFlash 0.4s ease-out; }
@keyframes energyFlash {
  0%   { background: rgba(255, 68, 68, 0.3); }
  100% { background: rgba(255, 68, 68, 0); }
}
</style>
