<!-- SceneLoadingOverlay — the loading screen, in-app half.
     ONE visual for every heavy 3D entry. The old two-mode cover (a light dim for
     home/pve, a full card for the arena) is gone: a light dim carried no progress
     and no explanation, so the player just got a dark rectangle and a guess.

     Its twin is #hx-load in index.html, which paints the very first load before
     this bundle exists. Both render the SAME state (loadingState) and the same
     picture — same void/pink literals, same lockup / number / creed / footer,
     same 200ms leave — so the game has one loading look, not two.

     Mounted once in AppV2 over the router-view. While up it blocks input.
     Discipline: this screen is the documented brandbook carve-out from the
     one-pink / one-glow rule (see CLAUDE.md). -->
<template>
  <Transition name="hxo">
    <div v-if="show" class="hx-loading" aria-hidden="true">
      <div class="hxo-hud"><i class="tl" /><i class="tr" /><i class="bl" /><i class="br" /></div>

      <header class="hxo-top">
        <div class="hxo-lock"><span class="hxo-word">HEXLASH</span></div>
      </header>

      <div class="hxo-mid">
        <div class="hxo-num"><span class="hxo-num-v">{{ pct }}</span><sup>%</sup></div>
        <!-- eslint-disable-next-line vue/no-v-html -- literal constants below, no user data -->
        <div class="hxo-creed" v-html="creed"></div>
      </div>

      <div class="hxo-foot">
        <div class="hxo-bar"><i class="hxo-fill" :style="{ width: loadingState.progress + '%' }" /></div>
        <div class="hxo-tip">
          <span class="hxo-tag">{{ tag }}</span>
          <span class="hxo-line">{{ line }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { loadingState } from '@/services/sceneLoading.js';

// The splash owns the first load; this owns every hop after it. Rendering only
// our own surface is what keeps them from ever stacking.
const show = computed(() => loadingState.active && loadingState.surface === 'overlay');

const pct = computed(() => {
  const n = Math.round(loadingState.progress || 0);
  return n < 10 ? '0' + n : '' + n;
});

// Field notes — same copy and same 3.2s cadence as the page-load splash, so a
// player who sees both surfaces in one session reads one screen, not two.
const TIPS = [
  'THE BELL IS ABOUT TO RING.',
  'RESPECT THE GRIND. NOTHING IS HANDED OUT.',
  'READ YOUR OPPONENT. THEN STRIKE.',
  'STEP IN. THE ARENA IS WAITING.',
];
const LOADING_CREED = 'NEVER <b>GIVE UP.</b>';
const READY_CREED = 'STEP <b>IN.</b>';

const tipIndex = ref(0);
const creed = computed(() => (loadingState.progress >= 100 ? READY_CREED : LOADING_CREED));
const tag = computed(() => (loadingState.progress >= 100 ? 'ARENA READY' : 'FIELD NOTE'));
const line = computed(() =>
  loadingState.progress >= 100 ? 'PRESS TO ENTER THE CAGE.' : TIPS[tipIndex.value % TIPS.length],
);

// Rotate only while the screen is actually up; a timer running behind a lifted
// cover is pure waste.
let tipTimer = null;
function stopTips() { if (tipTimer) { clearInterval(tipTimer); tipTimer = null; } }
watch(show, (up) => {
  stopTips();
  if (!up) return;
  tipIndex.value = 0;
  tipTimer = setInterval(() => { tipIndex.value += 1; }, 3200);
}, { immediate: true });
onBeforeUnmount(stopTips);
</script>

<style scoped>
/* Self-contained literals (the same ones #hx-load inlines) so the look is
   guaranteed even before --hex-* tokens or the brand faces resolve. */
.hx-loading {
  --accent: #ff0069;
  --accent-rgb: 255, 0, 105;
  --void: #08080a;
  --bone: #f6f4f6;
  --impact: "Saira Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif;
  --tele: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  position: fixed;
  inset: 0;
  z-index: 2147483000;
  overflow: hidden;
  color: var(--bone);
  font-family: var(--tele);
  -webkit-font-smoothing: antialiased;
  user-select: none;
  pointer-events: auto; /* block input under the cover while it is up */
  background: radial-gradient(130% 80% at 50% 120%, #1a0010 0%, #0b060a 46%, var(--void) 82%);
}
.hx-loading * { box-sizing: border-box; margin: 0; }

/* HUD corner brackets */
.hxo-hud i { position: absolute; width: 5vmin; height: 5vmin; border: 0 solid rgba(var(--accent-rgb), .55); }
.hxo-hud i.tl { top: 4vmin; left: 4vmin; border-left-width: 1.6px; border-top-width: 1.6px; }
.hxo-hud i.tr { top: 4vmin; right: 4vmin; border-right-width: 1.6px; border-top-width: 1.6px; }
.hxo-hud i.bl { bottom: 4vmin; left: 4vmin; border-left-width: 1.6px; border-bottom-width: 1.6px; }
.hxo-hud i.br { bottom: 4vmin; right: 4vmin; border-right-width: 1.6px; border-bottom-width: 1.6px; }

/* Top lockup: wordmark */
.hxo-top { position: absolute; top: 8vmin; left: 0; right: 0;
  display: flex; flex-direction: column; align-items: center; gap: 2vmin; }
.hxo-lock { display: flex; align-items: center; gap: 2.4vmin; }
.hxo-word { font-family: var(--impact); font-weight: 900; text-transform: uppercase;
  font-size: 8vmin; letter-spacing: .02em; }

/* Centerpiece: hero percent + creed */
.hxo-mid { position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1vmin; }
.hxo-num { font-family: var(--impact); font-weight: 900; line-height: .84;
  font-size: 38vmin; letter-spacing: -.01em; color: #fff;
  text-shadow: 0 0 5vmin rgba(var(--accent-rgb), .35); font-variant-numeric: tabular-nums; }
.hxo-num sup { font-size: .26em; color: var(--accent); vertical-align: .9em; margin-left: .06em;
  text-shadow: 0 0 2vmin rgba(var(--accent-rgb), .8); }
.hxo-creed { font-family: var(--impact); font-weight: 800; text-transform: uppercase;
  font-size: 6.4vmin; letter-spacing: .04em; color: var(--bone); white-space: nowrap; }
.hxo-creed :deep(b) { color: #fff; text-shadow: 0 0 1vmin rgba(var(--accent-rgb), .7), 0 0 4vmin rgba(var(--accent-rgb), .6); }

/* Footer: progress bar + field note */
.hxo-foot { position: absolute; left: 0; right: 0; bottom: 8.5vmin;
  display: flex; flex-direction: column; align-items: center; gap: 3vmin; padding: 0 6vmin; }
.hxo-bar { position: relative; width: 54vmin; max-width: 560px; height: 3px; background: rgba(255, 255, 255, .10);
  clip-path: polygon(2vmin 0, 100% 0, calc(100% - 2vmin) 100%, 0 100%); }
.hxo-fill { position: absolute; inset: 0; background: var(--accent);
  box-shadow: 0 0 9px rgba(var(--accent-rgb), .9); transition: width .35s ease; }
.hxo-tip { display: flex; align-items: center; gap: 2.4vmin; max-width: 90vw; text-align: center; }
.hxo-tag { flex: none; font-size: 2.3vmin; letter-spacing: .2em; color: var(--accent);
  border: 1px solid rgba(var(--accent-rgb), .4); padding: .8vmin 1.6vmin; text-transform: uppercase; }
.hxo-line { font-size: 2.6vmin; letter-spacing: .12em; color: #bdb9c2; text-transform: uppercase; }

/* Leave — opacity only. Must match LOADING.FADE_OUT_MS in sceneLoading.js. */
.hxo-enter-active, .hxo-leave-active { transition: opacity .2s ease; }
.hxo-enter-from, .hxo-leave-to { opacity: 0; }

/* Portrait / mobile — mirrors the page-load splash breakpoint. */
@media (max-aspect-ratio: 1/1) {
  .hxo-num { font-size: 30vmin; }
  .hxo-bar { width: 70vmin; }
  .hxo-hud i { width: 6vmin; height: 6vmin; }
  .hxo-word { font-size: 10vmin; }
  .hxo-creed { font-size: 8vmin; }
  .hxo-tag { font-size: 3vmin; }
  .hxo-line { font-size: 3.2vmin; }
}

/* Reduced motion: the percent still updates and the bar still fills — that is
   information, not decoration. What goes is the SLIDE (the bar steps instead)
   and nothing else; the leave stays an opacity fade, because vanishing on the
   frame is the jerk the setting exists to prevent. */
@media (prefers-reduced-motion: reduce) {
  .hxo-fill { transition: none; }
}
</style>
