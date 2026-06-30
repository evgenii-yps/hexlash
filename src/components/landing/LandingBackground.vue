<template>
  <!-- Shared landing background: opaque base wash + mouse-reactive HexGrid canvas
       + ambient pink glow (breathe) + vignette + optional scanlines/grain.
       Extracted from MarketingView's inline .bg-fixed so the auth screen reuses
       the exact same look + behaviour. Accent is a prop (landing 255,0,105;
       auth 255,0,105 = #FF0069) — drives both the canvas and the glow. -->
  <div class="lp-bg" :style="bgVars" aria-hidden="true">
    <div class="lp-bg__base"></div>
    <HexGrid :accent="accent" :intensity="intensity" :shape="shape" />
    <div class="lp-bg__glow"></div>
    <div class="lp-bg__vignette"></div>
    <div v-if="scanlines" class="lp-bg__scanlines"></div>
    <div v-if="grain" class="lp-bg__grain"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import HexGrid from './HexGrid.vue';

const props = defineProps({
  accent: { type: Array, default: () => [255, 0, 105] },
  intensity: { type: Number, default: 8 },
  shape: { type: String, default: 'shard' },
  scanlines: { type: Boolean, default: true },
  grain: { type: Boolean, default: true },
});

// One accent → both the canvas (prop) and the CSS glow (custom property).
const bgVars = computed(() => ({ '--lp-bg-accent': props.accent.join(', ') }));
</script>

<style scoped>
.lp-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* Pin to the LARGE viewport height (100lvh) rather than inset:0 / 100vh, which
     resolve against the *dynamic* viewport. On iOS Safari + Android Chrome the
     URL bar shows/hides during scroll, changing that height and making the
     background (and its canvas) resize + visibly jump on every scroll. 100lvh is
     a stable value that ignores the URL bar. 100vh is the fallback for browsers
     without lvh support. */
  height: 100vh;
  height: 100lvh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  --lp-bg-base: #08080a;
}
.lp-bg__base {
  position: absolute;
  inset: 0;
  background: radial-gradient(140% 90% at 50% 30%, #160a11 0%, #0b070a 46%, var(--lp-bg-base) 80%);
}
.lp-bg__glow {
  position: absolute;
  left: 50%;
  top: 42%;
  width: min(60vw, 820px);
  height: min(60vw, 820px);
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(var(--lp-bg-accent), 0.14) 0%, rgba(var(--lp-bg-accent), 0.04) 40%, transparent 68%);
  filter: blur(8px);
  animation: lpbg-breathe 6s ease-in-out infinite;
}
@keyframes lpbg-breathe {
  0%, 100% { opacity: .55; transform: translate(-50%, -50%) scale(.92); }
  50% { opacity: .9; transform: translate(-50%, -50%) scale(1.06); }
}
.lp-bg__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 50% 50%, transparent 50%, rgba(0, 0, 0, .55) 100%);
  box-shadow: inset 0 0 220px 60px rgba(0, 0, 0, .7);
}
.lp-bg__scanlines {
  position: absolute;
  inset: 0;
  opacity: .5;
  background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, .018) 0 1px, transparent 1px 3px);
  mix-blend-mode: overlay;
}
.lp-bg__grain {
  position: absolute;
  inset: -50%;
  opacity: .05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: lpbg-grain 1.2s steps(4) infinite;
}
@keyframes lpbg-grain {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-6%, 3%); }
  50% { transform: translate(4%, -5%); }
  75% { transform: translate(-3%, 6%); }
  100% { transform: translate(5%, 2%); }
}
</style>
