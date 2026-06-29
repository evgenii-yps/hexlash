<!-- SceneTransitionOverlay — SPA scene-transition cover, driven by the
     sceneTransition controller. Two visuals share one element:
       fade      → a quick translucent void dim (masks a scene "click" swap)
       fightcard → the full "Fight Card" splash (entering the arena)
     The fightcard styling mirrors the page-load splash (#hx-load in index.html)
     1:1 — same void/pink (#FF0069) literals, same lockup/number/creed/footer —
     so the game has ONE loading look, not two. Discipline: one pink, one glow.

     Mounted once in AppV2 over the router-view. While visible it blocks input.
     The element stays mounted through the leave (controller flips `visible`
     false first, holds `mode` until the CSS leave finishes) so the fightcard
     fades out gracefully instead of popping. -->
<template>
  <Transition name="st">
    <div
      v-if="t.visible"
      class="scene-transition"
      :class="t.mode === 'fightcard' ? 'st-card' : 'st-dim'"
      aria-hidden="true"
    >
      <template v-if="t.mode === 'fightcard'">
        <div class="st-hud"><i class="tl" /><i class="tr" /><i class="bl" /><i class="br" /></div>

        <header class="st-top">
          <div class="st-lock"><span class="st-word">HEXLASH</span></div>
        </header>

        <div class="st-mid">
          <div class="st-num"><span class="st-num-v">{{ pct }}</span><sup>%</sup></div>
          <div class="st-creed">NEVER <b>GIVE UP.</b></div>
        </div>

        <div class="st-foot">
          <div class="st-bar"><i class="st-fill" :style="{ width: t.progress + '%' }" /></div>
          <div class="st-tip">
            <span class="st-tag">FIELD NOTE</span>
            <span class="st-line">THE BELL IS ABOUT TO RING.</span>
          </div>
        </div>
      </template>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import { transitionState as t } from '@/services/sceneTransition.js';

const pct = computed(() => {
  const n = Math.round(t.progress || 0);
  return n < 10 ? '0' + n : '' + n;
});
</script>

<style scoped>
/* Self-contained literals (same as #hx-load) so the look is guaranteed even
   before --hex-* tokens or brand faces resolve. */
.scene-transition {
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
  pointer-events: auto; /* block input under the cover while active */
}
.scene-transition * { box-sizing: border-box; margin: 0; }

/* fade — translucent void dim, no text/counter. */
.st-dim { background: rgba(8, 8, 10, 0.86); }

/* fightcard — opaque splash, same backdrop as the page-load #hx-load. */
.st-card { background: radial-gradient(130% 80% at 50% 120%, #1a0010 0%, #0b060a 46%, var(--void) 82%); }

/* HUD corner brackets */
.st-hud i { position: absolute; width: 5vmin; height: 5vmin; border: 0 solid rgba(var(--accent-rgb), .55); }
.st-hud i.tl { top: 4vmin; left: 4vmin; border-left-width: 1.6px; border-top-width: 1.6px; }
.st-hud i.tr { top: 4vmin; right: 4vmin; border-right-width: 1.6px; border-top-width: 1.6px; }
.st-hud i.bl { bottom: 4vmin; left: 4vmin; border-left-width: 1.6px; border-bottom-width: 1.6px; }
.st-hud i.br { bottom: 4vmin; right: 4vmin; border-right-width: 1.6px; border-bottom-width: 1.6px; }

/* Top lockup: wordmark */
.st-top { position: absolute; top: 8vmin; left: 0; right: 0;
  display: flex; flex-direction: column; align-items: center; gap: 2vmin; }
.st-lock { display: flex; align-items: center; gap: 2.4vmin; }
.st-word { font-family: var(--impact); font-weight: 900; text-transform: uppercase;
  font-size: 8vmin; letter-spacing: .02em; }

/* Centerpiece: hero percent + creed */
.st-mid { position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1vmin; }
.st-num { font-family: var(--impact); font-weight: 900; line-height: .84;
  font-size: 38vmin; letter-spacing: -.01em; color: #fff;
  text-shadow: 0 0 5vmin rgba(var(--accent-rgb), .35); font-variant-numeric: tabular-nums; }
.st-num sup { font-size: .26em; color: var(--accent); vertical-align: .9em; margin-left: .06em;
  text-shadow: 0 0 2vmin rgba(var(--accent-rgb), .8); }
.st-creed { font-family: var(--impact); font-weight: 800; text-transform: uppercase;
  font-size: 6.4vmin; letter-spacing: .04em; color: var(--bone); white-space: nowrap; }
.st-creed b { color: #fff; text-shadow: 0 0 1vmin rgba(var(--accent-rgb), .7), 0 0 4vmin rgba(var(--accent-rgb), .6); }

/* Footer: progress bar + field note */
.st-foot { position: absolute; left: 0; right: 0; bottom: 8.5vmin;
  display: flex; flex-direction: column; align-items: center; gap: 3vmin; padding: 0 6vmin; }
.st-bar { position: relative; width: 54vmin; max-width: 560px; height: 3px; background: rgba(255, 255, 255, .10);
  clip-path: polygon(2vmin 0, 100% 0, calc(100% - 2vmin) 100%, 0 100%); }
.st-fill { position: absolute; inset: 0; background: var(--accent);
  box-shadow: 0 0 9px rgba(var(--accent-rgb), .9); transition: width .35s ease; }
.st-tip { display: flex; align-items: center; gap: 2.4vmin; max-width: 90vw; text-align: center; }
.st-tag { flex: none; font-size: 2.3vmin; letter-spacing: .2em; color: var(--accent);
  border: 1px solid rgba(var(--accent-rgb), .4); padding: .8vmin 1.6vmin; text-transform: uppercase; }
.st-line { font-size: 2.6vmin; letter-spacing: .12em; color: #bdb9c2; text-transform: uppercase; }

/* Enter / leave — ~200ms opacity, shared by both modes. */
.st-enter-active, .st-leave-active { transition: opacity .2s ease; }
.st-enter-from, .st-leave-to { opacity: 0; }

/* Portrait / mobile — mirror the page-load splash breakpoint. */
@media (max-aspect-ratio: 1/1) {
  .st-num { font-size: 30vmin; }
  .st-bar { width: 70vmin; }
  .st-hud i { width: 6vmin; height: 6vmin; }
  .st-word { font-size: 10vmin; }
  .st-creed { font-size: 8vmin; }
  .st-tag { font-size: 3vmin; }
  .st-line { font-size: 3.2vmin; }
}

@media (prefers-reduced-motion: reduce) {
  .st-enter-active, .st-leave-active { transition: none; }
  .st-fill { transition: none; }
}
</style>
