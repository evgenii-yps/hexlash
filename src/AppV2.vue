<template>
  <div class="app-v2">
    <CanvasLayer />
    <router-view />
    <VerifyEmailBanner />
    <ChallengeNotification />
    <GlobalOverlays />
    <NoConnection />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';
import GlobalOverlays from '@/components/hud/common/GlobalOverlays.vue';
import VerifyEmailBanner from '@/components/hud/VerifyEmailBanner.vue';
import ChallengeNotification from '@/components/pvp/ChallengeNotification.vue';
import NoConnection from '@/components/ui/NoConnection.vue';
import '@/styles/hexlash-v24.css';

// CanvasLayer грузится лениво — сам файл появится в Шаге 6.
const CanvasLayer = defineAsyncComponent(() => import('@/scene/CanvasLayer.vue'));

// Sub-epic 4a Commit 5a — ChallengeNotification mounted в v2 layout per
// D1 decision (Option β). App.vue v1 mount gated via `!isV2Route` block,
// so v1 + v2 mounts are mutually exclusive — no double-toast risk.
// Component self-guards via internal `challenge` ref (only renders когда
// `challenge-received` WS event fires). Closes carry-over #1 (5B deferred).
</script>

<style scoped>
.app-v2 {
  position: fixed;
  inset: 0;
  overflow: hidden;
}
</style>
