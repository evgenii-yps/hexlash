<!-- Epic 5 — Sub-Epic 5D Step 5.
     Clan view orchestrator — lazy sub-scene registration pattern from
     3Ba/3Bb/3Bc/5B/5C (Training / Matchmaking / Create / Profile / Ratings).
     Step 5 wires the scene build + registry + activation + teardown. Step 6
     fills the 2-state HUD skeleton + CSS port. Step 7 wires the no-clan
     browse + CreateClan lazy reuse. Step 8 wires the in-clan roster + XP
     bar + ClanEdit lazy + Leave confirm.
     Source: prototype hexlash_v24.html lines 10860-10998 (openClan + HUD). -->
<template>
  <div class="clan-view">
    <HudClan @back="onBack" />
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
import { buildClanScene } from '@/scene/scenes/ClanScene.js';
import HudClan from '@/components/hud/HudClan.vue';

const router = useRouter();

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

onMounted(() => {
  const aspect = window.innerWidth / window.innerHeight;
  sceneApi = buildClanScene(THREE, aspect);
  registerScene('clan', {
    scene: sceneApi.scene,
    camera: sceneApi.camera,
    tick: sceneApi.tick,
  });
  activateScene('clan');
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
  // scene on its next tick (3Ba/3Bb/3Bc/5B/5C pattern).
  activateScene('pit');
  unregisterScene('clan');
  if (sceneApi) {
    sceneApi.dispose();
    sceneApi = null;
  }
});
</script>

<style scoped>
.clan-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
