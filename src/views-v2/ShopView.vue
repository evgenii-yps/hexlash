<template>
  <div class="shop-view">
    <HudShop @back="goBack" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import HudShop from '@/components/hud/HudShop.vue';
import { registerScene, activateScene, unregisterScene } from '@/scene/sceneRegistry.js';
import { buildShopScene } from '@/scene/scenes/ShopScene.js';

const router = useRouter();
let sceneObj = null;

function goBack() { router.push('/v2'); }
function onKeyDown(e) { if (e.key === 'Escape') goBack(); }

onMounted(() => {
  const aspect = window.innerWidth / window.innerHeight;
  sceneObj = buildShopScene(THREE, aspect);
  registerScene('shop', sceneObj);
  activateScene('shop');
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  // Strict teardown order (5B/5C/5D parity):
  activateScene('pit');
  unregisterScene('shop');
  if (sceneObj?.dispose) sceneObj.dispose();
  sceneObj = null;
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped>
.shop-view { position: absolute; inset: 0; pointer-events: none; }
</style>
