<template>
  <div class="app-v2">
    <router-view />
    <VerifyEmailBanner />
    <NoConnection />
  </div>
</template>

<script setup>
// Game-cleanup reset: the 3D CanvasLayer, ChallengeNotification and
// GlobalOverlays (grain/scanlines/vignette) were removed with the game.
// /play now renders its child views (stub / profile stub / account / wallet)
// directly. The .app-v2 namespace + hexlash-v24.css are kept so the account/
// wallet HUD styling tokens (--text-*, --font-*, --hex-*) still resolve.
import VerifyEmailBanner from '@/components/hud/VerifyEmailBanner.vue';
import NoConnection from '@/components/ui/NoConnection.vue';
import '@/styles/hexlash-v24.css';
</script>

<style scoped>
.app-v2 {
  position: fixed;
  inset: 0;
  overflow: hidden;
}
</style>
