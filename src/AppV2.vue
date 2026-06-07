<template>
  <div class="app-v2">
    <router-view />
    <VerifyEmailBanner />
  </div>
</template>

<script setup>
// Game-cleanup reset: the 3D CanvasLayer, ChallengeNotification and
// GlobalOverlays (grain/scanlines/vignette) were removed with the game.
// /play now renders its child views (stub / profile stub / account / wallet)
// directly. The .app-v2 namespace + hexlash-v24.css are kept so the account/
// wallet HUD styling tokens (--text-*, --font-*, --hex-*) still resolve.
//
// NoConnection (red "No connection to server" banner) is NOT mounted here: the
// pre-fight flow (select / upgrade / arena) does no server round-trips, so the
// WS-disconnected banner was pure noise overlapping the screen.
import VerifyEmailBanner from '@/components/hud/VerifyEmailBanner.vue';
import '@/styles/hexlash-v24.css';
</script>

<style scoped>
.app-v2 {
  position: fixed;
  inset: 0;
  overflow: hidden;
}
</style>
