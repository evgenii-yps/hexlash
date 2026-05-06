<!-- Sub-Epic 6B-3 — Guest Profile View.
     Mirror Pattern A (scene-registered) from v2 ProfileView (5B). Shares
     scene id 'profile' with own ProfileView (per Phase 0 MV-4 finding —
     ProfileScene has no owner-specific elements, captain showcase is HUD-side).
     Guest mode adaptations:
       — useRoute().params.userLogin drives the fetch
       — Watcher dispatches user/getGuestUserByLogin (new action, Path C)
         on route enter / param change
       — Self-redirect: if :userLogin matches current user's login, replace
         to /v2/profile (own profile view) -->
<template>
  <div class="profile-view">
    <HudUserProfile @back="onBack" />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import * as THREE from 'three';
import {
  registerScene,
  unregisterScene,
  activateScene,
} from '@/scene/sceneRegistry.js';
import { buildProfileScene } from '@/scene/scenes/ProfileScene.js';
import HudUserProfile from '@/components/hud/HudUserProfile.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();

let sceneApi = null;
let onResize = null;

const currentUserLogin = computed(
  () => store.getters['master/getMaster']?.userData?.login || null,
);

function handleResize() {
  if (!sceneApi) return;
  sceneApi.camera.aspect = window.innerWidth / window.innerHeight;
  sceneApi.camera.updateProjectionMatrix();
}

function onBack() {
  router.back();
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

// Watch :userLogin — handle self-redirect + dispatch guest fetch.
// Self-redirect (Decision 4 = A): visiting your own login → /v2/profile.
// Guards against missing param (router edge cases) before dispatch.
watch(
  () => route.params.userLogin,
  (userLogin) => {
    if (!userLogin) return;
    if (currentUserLogin.value && currentUserLogin.value === userLogin) {
      router.replace('/play/profile');
      return;
    }
    store.dispatch('user/getGuestUserByLogin', userLogin);
  },
  { immediate: true },
);

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
