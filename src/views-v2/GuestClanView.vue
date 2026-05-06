<!-- Sub-Epic 1 — Guest Clan View.
     Mirror Pattern A (scene-registered) from v2 ClanView (5D). Shares
     scene id 'clan' with own ClanView (no clan-owner-specific scene elements,
     visitor adaptations live in HUD).
     Guest mode adaptations:
       — useRoute().params.id drives the fetch
       — Watcher dispatches clan/getGuestClanById (new action, Path C from Commit 1)
         on route enter / param change
       — Self-redirect: if :id matches current user's clanId, replace
         to /v2/clan (own clan view) -->
<template>
  <div class="clan-view">
    <HudGuestClan @back="onBack" />
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
import { buildClanScene } from '@/scene/scenes/ClanScene.js';
import HudGuestClan from '@/components/hud/HudGuestClan.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();

let sceneApi = null;
let onResize = null;

const currentClanId = computed(
  () => store.getters['master/getMaster']?.userData?.clanId || null,
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

// Watch :id — handle self-redirect + dispatch guest fetch.
// Self-redirect: visiting your own clan → /v2/clan (own clan view).
// Guards against missing param (router edge cases) before dispatch.
watch(
  () => route.params.id,
  (id) => {
    if (!id) return;
    if (currentClanId.value && currentClanId.value === id) {
      router.replace('/play/clan');
      return;
    }
    store.dispatch('clan/getGuestClanById', id);
  },
  { immediate: true },
);

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
  // scene on its next tick (3Ba/3Bb/3Bc/5B/5C/5D pattern).
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
