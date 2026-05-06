<!-- Epic 5 — Sub-Epic 5B Step 1.
     Profile view orchestrator — lazy sub-scene registration pattern from
     3Ba/3Bb/3Bc (Training / Matchmaking / Create). Step 1 ships the stub
     scene + HUD so the route is wired and regressions stay contained. Later
     steps fill in the room, lighting, podium, 4 HUD cards, and wallet modal.
     Source: prototype hexlash_v24.html lines 9335-9498 (openProfile + HUD). -->
<template>
  <div class="profile-view">
    <HudProfile @back="onBack" />
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
import { buildProfileScene } from '@/scene/scenes/ProfileScene.js';
import HudProfile from '@/components/hud/HudProfile.vue';

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
  sceneApi = buildProfileScene(THREE, aspect);
  registerScene('profile', {
    scene: sceneApi.scene,
    camera: sceneApi.camera,
    tick: sceneApi.tick,
  });
  activateScene('profile');
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
  // scene on its next tick (3Ba/3Bb/3Bc pattern).
  activateScene('pit');
  unregisterScene('profile');
  if (sceneApi) {
    sceneApi.dispose();
    sceneApi = null;
  }
});
</script>

<style scoped>
.profile-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
