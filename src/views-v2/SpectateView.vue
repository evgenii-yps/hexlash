<!-- Sub-Epic 5N — Spectate Flag (Path α Mock Port).
     v2 view orchestrator for /v2/spectate/:fightId. HUD-only mount —
     deliberately does NOT register a 3D scene. Whatever scene was active
     prior (profile / pit / etc) stays as the visual backdrop, behind the
     HUD overlay. CanvasLayer's onMounted fallback (`if (!getActiveScene())
     activateScene('pit')`) covers direct-URL access. -->
<template>
  <div class="spectate-view">
    <HudSpectate />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import HudSpectate from '@/components/hud/HudSpectate.vue';

function onKeyDown(e) {
  // Escape leaves spectate; HudSpectate's own back button handles router push.
  // We dispatch the same router.push via the back button click programmatically
  // by deferring to HudSpectate. Here we just intercept Esc as alias.
  if (e.key === 'Escape') {
    // Lazy import not needed — useRouter would re-trigger SSR concerns.
    // Cleanest: emit a synthetic click on the back button if present.
    const btn = document.querySelector('.spectate-hud .sp-back');
    if (btn) btn.click();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped>
.spectate-view {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
