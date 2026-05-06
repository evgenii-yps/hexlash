<!-- Epic 5 — Sub-Epic 5C Step 5.
     Ratings view orchestrator — lazy sub-scene registration pattern from
     3Ba/3Bb/3Bc/5B (Training / Matchmaking / Create / Profile). Step 5 wires
     the scene build + registry + activation + teardown. Later steps fill in
     the HUD skeleton (Step 6), scope tabs + search + mock data (Step 7),
     sticky your-row (Step 8), season polish (Step 9), mobile (Step 10).
     Source: prototype hexlash_v24.html lines 10060-10200 (openRatings + HUD). -->
<template>
  <div class="ratings-view">
    <HudRatings @back="onBack" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildRatingsScene } from '@/scene/scenes/RatingsScene.js';
import HudRatings from '@/components/hud/HudRatings.vue';

const router = useRouter();

let sceneApi = null;
let onResize = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.push('/play');
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

onMounted(() => {
  const aspect = window.innerWidth / window.innerHeight;
  sceneApi = buildRatingsScene(THREE, aspect);
  registerScene('ratings', {
    scene: sceneApi.scene,
    camera: sceneApi.camera,
    tick: sceneApi.tick,
  });
  activateScene('ratings');
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
  // Swap back to pit BEFORE disposing so renderLoop doesn't touch a freed
  // scene on its next tick (3Ba/3Bb/3Bc/5B pattern).
  activateScene('pit');
  unregisterScene('ratings');
  if (sceneApi) {
    sceneApi.dispose();
    sceneApi = null;
  }
});
</script>

<style scoped>
.ratings-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
