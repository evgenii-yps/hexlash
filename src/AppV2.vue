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
    <SceneLoadingOverlay />
    <RotateHint />
  </div>
</template>

<script setup>
// .app-v2 — пространство имён игровой оболочки. Раньше вместе с ним грузился
// hexlash-v24.css: свой набор переменных плюс блокирующая загрузка Archivo Black
// и Space Grotesk, которыми никто не пользовался. Набор и оба шрифта удалены
// (ТЗ-01 §7): значения приходят из src/styles/tokens.css, шрифтов в Hexlash два.
// Осталась только плашка «подтвердите почту» — она висит поверх всех экранов.
//
// NoConnection (red "No connection to server" banner) is NOT mounted here: the
// pre-fight flow (select / upgrade / arena) does no server round-trips, so the
// WS-disconnected banner was pure noise overlapping the screen.
import VerifyEmailBanner from '@/components/hud/VerifyEmailBanner.vue';
import SceneLoadingOverlay from '@/views-v2/SceneLoadingOverlay.vue';
import RotateHint from '@/views-v2/RotateHint.vue';
import { HOME_STAGE_PATHS } from '@/router/index.js';
import '@/styles/verify.css';

// undefined ⇒ no key ⇒ the default behaviour for every route but the home stage.
const stageKey = (route) => (HOME_STAGE_PATHS.includes(route.path) ? 'home-stage' : undefined);
</script>

<style scoped>
.app-v2 {
  position: fixed;
  inset: 0;
  overflow: hidden;
  /* Базовый шрифт оболочки. Раньше сюда наследовался Space Grotesk — он удалён
     вместе со всем набором v24 (ТЗ-01 §7). Заголовки и кнопки набираются
     display'ем, поэтому база — он; телеметрия переключается на mono явно. */
  font-family: var(--font-display);
  background: var(--void);
  color: var(--ink);
}
</style>
