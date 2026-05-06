<!-- Sub-Epic 3 — Account View (Path A per-sub-route v2 port).
     Mirror Pattern A (scene-registered) from v2 ProfileView (5B) /
     UserProfileView (6B-3) / GuestClanView (Sub-epic 1) / WalletView
     (Sub-epic 3 Commit 1). Shares scene id 'profile' with own ProfileView
     — visual continuity for own-profile sub-routes (account is
     conceptually part of own profile).
     Lifecycle:
       — onMounted: build scene → register('profile') → activate('profile')
       — onBeforeUnmount: activateScene('pit') → unregisterScene → dispose
         (strict teardown order — renderLoop must not touch freed scene)
       — Escape key + back button → router.push('/v2/profile') -->
<template>
  <div class="account-view">
    <HudProfileAccount @back="onBack" />
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
import HudProfileAccount from '@/components/hud/HudProfileAccount.vue';

const router = useRouter();

let sceneApi = null;
let onResize = null;

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.push('/v2/profile');
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
  // scene on its next tick (3Ba/3Bb/3Bc/6B-3/Sub-epic 1/Sub-epic 3 pattern).
  activateScene('pit');
  unregisterScene('profile');
  if (sceneApi) {
    sceneApi.dispose();
    sceneApi = null;
  }
});
</script>

<style scoped>
.account-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
