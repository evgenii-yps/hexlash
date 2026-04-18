<template>
  <div class="app-v2">
    <CanvasLayer />
    <router-view />
    <GlobalOverlays />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';
import GlobalOverlays from '@/components/hud/common/GlobalOverlays.vue';
import '@/styles/hexlash-v24.css';

// CanvasLayer грузится лениво — сам файл появится в Шаге 6.
const CanvasLayer = defineAsyncComponent(() => import('@/scene/CanvasLayer.vue'));
</script>

<style scoped>
.app-v2 {
  position: fixed;
  inset: 0;
  overflow: hidden;
}
</style>
