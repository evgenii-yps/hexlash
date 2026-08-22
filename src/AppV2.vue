<template>
  <div class="app-v2">
    <!-- /play/home and /play/mode are two FRAMINGS of one live 3D scene, not two
         screens: they render the same component, and keying them together makes Vue
         reuse the instance instead of remounting it — which is what keeps the WebGL
         scene (and the camera flying through it) alive across the hop. Every other
         route is left unkeyed, i.e. exactly the behaviour it had before. -->
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="stageKey(route)" />
    </router-view>
    <VerifyEmailBanner />
    <SceneTransitionOverlay />
    <RotateHint />
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
import SceneTransitionOverlay from '@/views-v2/SceneTransitionOverlay.vue';
import RotateHint from '@/views-v2/RotateHint.vue';
import { HOME_STAGE_PATHS } from '@/router/index.js';
import '@/styles/hexlash-v24.css';

// undefined ⇒ no key ⇒ the default behaviour for every route but the home stage.
const stageKey = (route) => (HOME_STAGE_PATHS.includes(route.path) ? 'home-stage' : undefined);
</script>

<style scoped>
.app-v2 {
  position: fixed;
  inset: 0;
  overflow: hidden;
}
</style>
