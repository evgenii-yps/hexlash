<!-- SpaceView — the /play/space route: the standalone Space 3D preview (SpaceScene)
     under a thin 2D layer. Since Ground Select was removed (24.08.2026) nothing in
     the app links here — it is a direct-URL route, kept because the scene is finished
     work even though space stopped being a ground. Same shell as PveView: the shared
     .hs-strip (home.css) WITHOUT the brand block — only SHOP + cabinet chip (matte);
     top-left ‹ Back (matte chrome) → /play/mode. NO FIGHT, no match — visual only.
     A matte "mode coming soon" note sits over the scene — honest, no second glow.
     Strip + note tokens are mirrored on the root so the shared chrome resolves here
     without editing home.css.

     The Back target matters more here than it looks: this route has no referrer any
     more, so whoever lands on it arrived cold. Sending them anywhere that no longer
     exists would leave the only exit from the scene pointing at a 404. -->
<template>
  <div class="space-root">
    <SpaceScene />

    <!-- shared chrome (brand removed): ← BACK left, SHOP + cabinet right -->
    <div class="hs-strip">
      <button type="button" class="hs-chrome space-back" @click="goMode" :aria-label="t.home.back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        <span class="n">{{ t.home.back }}</span>
      </button>
      <div class="hs-cluster">
        <button type="button" class="hs-chrome hs-seg-shop" @click="goHome" :aria-label="t.home.shop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
          <span class="n">{{ t.home.shop }}</span>
        </button>
        <button type="button" class="hs-chrome hs-seg-cab" @click="cabinetOpen = true" :aria-label="t.cabinet.chipOpen">
          <span class="av" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <!-- honest "mode coming soon" note — matte chrome, no second glow; the SOON mark
         the honest SOON mark for the mode -->
    <div class="space-note" role="note">
      <span class="space-note-soon">SOON</span>
      <p class="space-note-text">{{ t.space.previewNote }}</p>
    </div>

    <PlayerCabinet
      :open="cabinetOpen"
      :balance="balance"
      :core-name="coreName"
      :core-sig="coreSig"
      @close="cabinetOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import SpaceScene from '@/scene/SpaceScene.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import '@/styles/home.css';     // the shared .hs-strip chrome
import '@/styles/cabinet.css';  // the PlayerCabinet drawer

const router = useRouter();
const cabinetOpen = ref(false);

// Cabinet card data (mirrors PveView / HomeView): default until a core is picked.
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreName = computed(() => core.value?.name || 'ONSLAUGHT');
const coreSig = computed(() => core.value?.sig || 'PRESSURE');
const balance = '2,480';

function goHome() { router.push('/play/home'); }
// Ground Select is gone — the way back out of the preview is the mode stage.
function goMode() { router.push('/play/mode'); }
</script>

<style scoped>
/* Копия палитры home.css отсюда удалена — см. тот же комментарий в PveView:
   .hs-chrome теперь читает глобальные токены, повторять их незачем. */
.space-root {
  position: absolute; inset: 0; overflow: hidden;
  background: var(--void); color: var(--ink);
  font-family: var(--font-display);
}

/* brand removed → pin the SHOP/cabinet cluster to the right (scoped to Space —
   home.css stays shared/untouched). */
.hs-cluster { margin-left: auto; }

/* honest "mode coming soon" note — bottom-centre, matte chrome, no glow, no pink.
   Same family as the mode-stage captions (mono label + INK-DIM copy on glass). */
.space-note {
  position: absolute; left: 50%; bottom: clamp(20px, 5vh, 40px); transform: translateX(-50%);
  z-index: 6; max-width: min(90vw, 460px);
  display: flex; align-items: center; gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-4);
  background: color-mix(in srgb, var(--panel) 62%, transparent); border: 1px solid var(--line);
  backdrop-filter: blur(var(--blur-glass));
  pointer-events: none;
}
.space-note-soon {
  flex: 0 0 auto;
  font-family: var(--font-mono); font-size: var(--t-micro); font-weight: 700; letter-spacing: var(--ls-wide); text-transform: uppercase;
  color: var(--ink-soft); padding: var(--sp-1) var(--sp-3);
  background: linear-gradient(180deg, var(--line), var(--fill-1));
  border: 1px solid var(--line-strong);
}
.space-note-text {
  margin: 0; font-family: var(--font-mono); font-size: var(--t-xs); line-height: 1.5; letter-spacing: var(--ls-tight);
  color: var(--ink-dim); text-transform: uppercase;
}
@media (max-width: 560px) {
  .space-note { flex-direction: column; align-items: flex-start; gap: var(--sp-2); padding: var(--sp-3) var(--sp-4); }
  .space-note-text { font-size: var(--t-micro); letter-spacing: var(--ls-tight); }
}
</style>
