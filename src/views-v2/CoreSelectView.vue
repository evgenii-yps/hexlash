<!-- /play — Core Select (pre-fight step 01). Stripped/minimal variant: the
     production handoff was ported 1:1, then the service chrome was removed per
     owner — on screen now: headline + 4 cards (icon + name) + CTA.

     Kept from the handoff (untouched): card flat/hover/selected states, siblings
     dimmed via .has-sel, per-core rhythms of light, --core tint + scene wash.

     Data — single source src/data/upgradeData.js (CORES: ids natisk/nalet/skala/
     zasada, our palette, EN names). Icon — coreSVG() reused from
     upgradeGeometry.js. Tint --core/--core-sup written on the scene root from
     prefight.selectedCoreId (same write-site/vars as the upgrade screen).
     Pick → store; CTA «TO ARENA» → /play/arena. It used to stop at an upgrade
     screen in between; that screen was retired (25.08.2026) when upgrading moved
     into the FORGE hall, where each fighter has their own tree. -->
<template>
  <div class="scene" :style="coreVars" data-screen-label="Core Select">

    <!-- centered composition column -->
    <main class="stage">
      <div class="col">

        <!-- HEADLINE -->
        <header class="headline">
          <div class="ttl">
            <h1>CHOOSE YOUR <em>CORE.</em></h1>
          </div>
        </header>

        <!-- GRID -->
        <div class="grid" :class="{ 'has-sel': !!selectedId }">
          <button
            v-for="core in cores"
            :key="core.id"
            type="button"
            class="core-card"
            :class="{ sel: selectedId === core.id }"
            :data-core="core.id"
            :style="{ '--c': core.hue, '--c-sup': core.sup }"
            :aria-pressed="selectedId === core.id"
            :aria-label="`Core ${core.ix} · ${core.name} · ${core.sig}`"
            @click="select(core)"
          >
            <span class="tick tl" aria-hidden="true"></span>
            <span class="tick tr" aria-hidden="true"></span>

            <div class="stage-i">
              <div class="halo" aria-hidden="true"></div>
              <div class="ring" aria-hidden="true"></div>
              <div class="icon" v-html="glyphs[core.id]"></div>
            </div>

            <div class="body">
              <div class="nm">{{ core.name }}</div>
            </div>

            <span class="bar" aria-hidden="true"></span>
          </button>
        </div>

        <!-- FOOT — primary CTA -->
        <footer class="foot">
          <button
            class="cta"
            :class="{ 'is-ready': selected }"
            :disabled="!selected"
            aria-label="Proceed to the arena"
            @click="toArena"
          >
            <span>TO ARENA</span>
            <span class="arr" aria-hidden="true">→</span>
          </button>
        </footer>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { CORES, getCore } from '@/data/upgradeData.js';
import { coreSVG } from '@/data/upgradeGeometry.js';

const store = useStore();
const router = useRouter();

const cores = CORES;

// Core icons — same silhouettes as the upgrade screen (reuse coreSVG, no dup).
// Pure strings, computed once; rendered via v-html (trusted source, no user input).
const glyphs = Object.fromEntries(CORES.map((c) => [c.id, coreSVG(c.id, { seed: true })]));

// --- Selection (exactly one card lit; siblings dim via .has-sel) --------------
// Seeded from the store so a refresh shows the core the player already picked
// (the pick itself survives a refresh — see prefightState / playerProgress).
const selectedId = ref(store.getters['prefight/selectedCoreId']);
const selected = computed(() => (selectedId.value ? getCore(selectedId.value) : null));

// Scene tint — same --core/--core-sup write-site + var names as the upgrade
// screen. Pre-select: no override, so the CSS default (brand-pink) keeps the
// chrome neutral; on pick the scene shifts to the core hue (flows to upgrade).
const coreVars = computed(() =>
  selected.value ? { '--core': selected.value.hue, '--core-sup': selected.value.sup } : {},
);

function select(core) {
  selectedId.value = core.id; // single glow — siblings dim via .has-sel
  store.dispatch('prefight/selectCore', core.id); // id → store (read by the arena)
}

// CTA «TO ARENA» — navigation contract: pick is already in the store, the
// route guard (requireCore) lets it through. Brief beat so the press reads.
let navigating = false;
function toArena() {
  if (!selected.value || navigating) return;
  navigating = true;
  setTimeout(() => router.push({ name: 'V2Arena' }), 180);
}
</script>

<style>
/* Fonts — shared resource: Saira Condensed (display) + JetBrains Mono (mono). */
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
</style>

<style scoped>
/* ============================================================
   HEXLASH — CORE SELECT · styles (port of select_handoff/styles.css, stripped of
   service chrome). Tokens on .scene (component root). SVG from v-html → :deep().
   ============================================================ */
.scene * { box-sizing: border-box; margin: 0; padding: 0; }
.scene button {
  font: inherit; color: inherit; background: none; border: 0; cursor: pointer;
  -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent;
}
.scene ::selection { background: var(--lash); color: #fff; }

/* ============================================================
   SCENE — fullscreen, faint pink-tinted void (neutral chrome).
   Tints subtly toward the picked core via --core-ghost.
   ============================================================ */
.scene {
  /* Brand Book — Color */
  --bg-void: #08080a;
  --bg-carbon: #0d0a0d;
  --bg-ember: #160a11;        /* faint pink-tinted wash */
  --ink-bone: #f6f4f6;
  --ink-ash: #6e6a72;
  --ink-line: rgba(255, 255, 255, .07);
  --ink-line-2: rgba(255, 255, 255, .13);
  --ink-3: #36343a;
  --ink-4: #1c1a1f;

  /* Brand primary — neutral chrome accent (NOT a core color) */
  --lash: #ff0069;
  --lash-dim: rgba(255, 0, 105, .42);
  --lash-faint: rgba(255, 0, 105, .14);

  /* Type */
  --font-disp: 'Saira Condensed', -apple-system, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Easing */
  --ease: cubic-bezier(.4, .05, .1, 1);
  --ease-out: cubic-bezier(.16, 1, .3, 1);

  /* Picked core (resolved once a card is selected via :style binding).
     Defaults to brand-pink — pre-select chrome reads as neutral. */
  --core: #ff0069;
  --core-sup: #ff4f8a;
  --core-dim: color-mix(in srgb, var(--core) 55%, transparent);
  --core-faint: color-mix(in srgb, var(--core) 14%, transparent);
  --core-ghost: color-mix(in srgb, var(--core) 7%, transparent);
  --core-ink: color-mix(in srgb, var(--core) 62%, #fff);

  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  /* layered void:
     · faint top wash in --core (subtle context, not loud)
     · brand-pink ember bottom wash (neutral baseline)
     · deep void radial */
  background:
    radial-gradient(110% 60% at 50% 0%,
      color-mix(in srgb, var(--core) 6%, transparent), transparent 60%),
    radial-gradient(110% 70% at 50% 100%,
      color-mix(in srgb, var(--lash) 5%, transparent), transparent 64%),
    radial-gradient(130% 80% at 50% 12%,
      var(--bg-ember) 0%, var(--bg-carbon) 38%, var(--bg-void) 78%);
  color: var(--ink-bone);
  font-family: var(--font-disp);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  transition: background .55s var(--ease);
  isolation: isolate;
}

/* faint discipline grid — viewport-wide, mask softens edges */
.scene::before {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(var(--ink-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--ink-line) 1px, transparent 1px);
  background-size: 64px 64px;
  -webkit-mask-image: radial-gradient(120% 90% at 50% 50%, #000, transparent 78%);
  mask-image: radial-gradient(120% 90% at 50% 50%, #000, transparent 78%);
  opacity: .32;
}

/* ============================================================
   STAGE — centered composition column
   ============================================================ */
.scene .stage {
  position: relative; z-index: 5;
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%;
  padding: clamp(56px, 7vh, 84px) 28px clamp(24px, 3.5vh, 40px);
  gap: clamp(14px, 2.2vh, 24px);
}
.col {
  width: 100%;
  max-width: min(760px, 100%);
  display: flex; flex-direction: column;
  gap: clamp(14px, 2vh, 22px);
}
@media (max-width: 640px) {
  .scene .stage { padding: 60px 18px 22px; }
}

/* ============================================================
   HEADLINE BLOCK
   ============================================================ */
.headline {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 16px 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ink-line);
}
.headline .ttl { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

.headline h1 {
  font-family: var(--font-disp); font-weight: 900;
  /* fluid scale: ~36px mobile → ~64px desktop */
  font-size: clamp(36px, 5.6vw, 64px);
  line-height: .88; letter-spacing: .005em;
  text-transform: uppercase; color: var(--ink-bone);
  text-wrap: balance;
  white-space: nowrap;          /* prevent stray YOUR/CORE break */
}
.headline h1 em { font-style: normal; color: #fff;
  text-shadow: 0 0 14px color-mix(in srgb, var(--lash) 30%, transparent); }

@media (max-width: 520px) {
  .headline { grid-template-columns: 1fr; gap: 14px; padding-bottom: 14px; }
  .headline h1 { font-size: clamp(34px, 10vw, 46px); white-space: normal; }
}

/* ============================================================
   GRID — 2×2 cores
   ============================================================ */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (min-width: 641px) {
  .grid { gap: 18px; }
}

/* ============================================================
   CORE CARD — weighty container, three distinguishable states
   ============================================================ */
.core-card {
  --c: #6e6a72;
  --c-dim: color-mix(in srgb, var(--c) 55%, transparent);
  --c-faint: color-mix(in srgb, var(--c) 12%, transparent);
  --c-ghost: color-mix(in srgb, var(--c) 6%, transparent);
  --c-ink: color-mix(in srgb, var(--c) 62%, #fff);

  position: relative; display: flex; flex-direction: column; align-items: stretch;
  text-align: left;
  /* fight-card chevron (Brand Book primary motif) */
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 16px),
                    calc(100% - 16px) 100%, 0 100%);
  background:
    linear-gradient(180deg,
      rgba(255, 255, 255, .025) 0%,
      rgba(255, 255, 255, .012) 100%),
    var(--bg-carbon);
  border: 1px solid var(--ink-line);
  padding: 16px 18px 0;
  min-height: clamp(184px, 25vh, 230px);
  cursor: pointer; overflow: hidden;
  transition:
    background .35s var(--ease),
    border-color .3s var(--ease),
    opacity .35s var(--ease),
    transform .15s var(--ease);
}
.core-card:hover { border-color: var(--ink-line-2); background:
  linear-gradient(180deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .018)), var(--bg-carbon); }
.core-card:active { transform: scale(.985); }
.core-card:focus-visible { outline: 1px solid var(--c-dim); outline-offset: 3px; }

/* corner ticks — subtle "tap target" hints */
.core-card .tick { position: absolute; width: 10px; height: 10px; pointer-events: none;
  border: 1px solid var(--ink-3); transition: border-color .3s var(--ease); }
.core-card .tick.tl { top: 9px; left: 9px; border-right: 0; border-bottom: 0; }
.core-card .tick.tr { top: 9px; right: 9px; border-left: 0; border-bottom: 0; }

/* ICON STAGE — backplate gives the icon a defined zone */
.core-card .stage-i {
  position: relative;
  flex: 1; display: grid; place-items: center;
  margin: 6px 0 8px;
  min-height: 96px;
}
/* subtle backplate hex behind icon, almost invisible by default */
.core-card .stage-i::before {
  content: ""; position: absolute;
  width: 118px; height: 104px;
  background:
    radial-gradient(60% 60% at 50% 50%,
      color-mix(in srgb, var(--c) 8%, transparent), transparent 70%);
  opacity: .7; transition: opacity .35s var(--ease);
}
.core-card .halo {
  position: absolute; inset: -12%; border-radius: 50%; z-index: 1; pointer-events: none;
  opacity: 0; transition: opacity .35s var(--ease);
  background:
    radial-gradient(circle at 50% 50%,
      color-mix(in srgb, var(--c) 48%, transparent) 0%,
      color-mix(in srgb, var(--c) 18%, transparent) 32%,
      transparent 62%),
    radial-gradient(circle at 38% 66%,
      color-mix(in srgb, var(--c-sup, var(--c)) 30%, transparent) 0%, transparent 50%);
  filter: blur(18px);
  mix-blend-mode: screen;
}
.core-card .ring {
  position: absolute; width: 128px; height: 128px; border: 1px solid var(--c-dim);
  border-radius: 50%; z-index: 1; opacity: 0;
}
.core-card .icon { width: 96px; height: 96px; position: relative; z-index: 2;
  transition: transform .4s var(--ease-out); }
.core-card .icon :deep(svg) { width: 100%; height: 100%; overflow: visible; }

/* FLAT-state strokes — muted, with a hint of hue so silhouettes
   stay distinguishable without lighting up */
.core-card .icon :deep(.hex-line) {
  stroke: color-mix(in srgb, var(--c) 30%, var(--ink-3));
  fill: none; stroke-width: 1.6; transition: stroke .35s var(--ease);
}
.core-card .icon :deep(.facet) {
  stroke: color-mix(in srgb, var(--c) 20%, var(--ink-3));
  fill: none; stroke-width: 1.1; transition: stroke .35s var(--ease);
}
.core-card .icon :deep(.seed) {
  fill: color-mix(in srgb, var(--c) 46%, var(--ink-3));
  transition: fill .35s var(--ease);
}

/* NAME */
.core-card .body {
  display: flex; flex-direction: column; align-items: flex-start; gap: 5px;
  position: relative; z-index: 3; padding-bottom: 12px;
}
.core-card .nm {
  font-family: var(--font-disp); font-weight: 800;
  font-size: clamp(20px, 2.4vw, 26px);
  letter-spacing: .015em; text-transform: uppercase; line-height: 1;
  color: var(--ink-bone); transition: color .35s var(--ease);
}

/* ACCENT BAR — anchors the card visually */
.core-card .bar {
  position: absolute; left: 0; right: 18px; bottom: 0; height: 3px;
  background: var(--ink-3);
  transform-origin: left center;
  transition: background .35s var(--ease), transform .35s var(--ease);
}

/* ---------- SELECTED ---------- */
.core-card.sel {
  border-color: var(--c-dim);
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--c) 8%, transparent) 0%,
      color-mix(in srgb, var(--c) 2%, transparent) 100%),
    var(--bg-carbon);
}
.core-card.sel .tick.tl, .core-card.sel .tick.tr { border-color: var(--c-dim); }
.core-card.sel .stage-i::before { opacity: 1; }
.core-card.sel .halo { opacity: .9; }
.core-card.sel .icon { transform: scale(1.06); }
/* selected strokes lift to near-white tinted with hue — stays crisp
   on top of the halo bloom instead of dissolving into it */
.core-card.sel .icon :deep(.hex-line) {
  stroke: color-mix(in srgb, var(--c) 18%, #fff);
  stroke-width: 1.9;
}
.core-card.sel .icon :deep(.facet) {
  stroke: color-mix(in srgb, var(--c) 30%, #fff);
  stroke-width: 1.4;
}
.core-card.sel .icon :deep(.seed) { fill: #fff;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 80%, transparent)); }
.core-card.sel .nm { color: #fff;
  text-shadow: 0 0 12px color-mix(in srgb, var(--c) 55%, transparent); }
.core-card.sel .bar { background: var(--c);
  box-shadow: 0 0 14px color-mix(in srgb, var(--c) 55%, transparent); }

/* ---------- DIMMED (siblings of selection) ---------- */
.grid.has-sel .core-card:not(.sel) { opacity: .5; }
.grid.has-sel .core-card:not(.sel):hover { opacity: .82; }

/* ============================================================
   RHYTHMS OF LIGHT — each picked core breathes with character.
   Active only on .sel — flat cards are silent.
   ============================================================ */
@media (prefers-reduced-motion: no-preference) {
  /* Onslaught — fast, steady pulse (pressure that never lets up) */
  .core-card.sel[data-core="natisk"] .halo { animation: rhythm-onslaught .95s ease-in-out infinite; }
  .core-card.sel[data-core="natisk"] .ring { animation: ring-onslaught .95s ease-out infinite; }

  /* Raider — ragged bursts (strike, drop, strike) */
  .core-card.sel[data-core="nalet"] .halo { animation: rhythm-raider 1.7s linear infinite; }
  .core-card.sel[data-core="nalet"] .ring { animation: ring-raider 1.7s linear infinite; }

  /* Bulwark — slow inhale (takes the hit, returns it later) */
  .core-card.sel[data-core="skala"] .halo { animation: rhythm-bulwark 4.6s ease-in-out infinite; }
  .core-card.sel[data-core="skala"] .ring { animation: ring-bulwark 4.6s ease-out infinite; }

  /* Ambush — long hold, single strike (silence, then payback) */
  .core-card.sel[data-core="zasada"] .halo { animation: rhythm-ambush 5.6s cubic-bezier(.7, 0, .2, 1) infinite; }
  .core-card.sel[data-core="zasada"] .ring { animation: ring-ambush 5.6s cubic-bezier(.7, 0, .2, 1) infinite; }
}

@keyframes rhythm-onslaught {
  0%, 100% { opacity: .8; transform: scale(.96); }
  50% { opacity: 1; transform: scale(1.06); }
}
@keyframes ring-onslaught {
  0% { transform: scale(.78); opacity: .5; }
  70%, 100% { transform: scale(1.25); opacity: 0; }
}
@keyframes rhythm-raider {
  0% { opacity: .48; transform: scale(.96); }
  8% { opacity: 1; transform: scale(1.07); }
  18% { opacity: .55; transform: scale(.99); }
  24% { opacity: .95; transform: scale(1.04); }
  32% { opacity: .42; transform: scale(.95); }
  100% { opacity: .42; transform: scale(.95); }
}
@keyframes ring-raider {
  0% { transform: scale(.74); opacity: .55; }
  18%, 100% { transform: scale(1.25); opacity: 0; }
}
@keyframes rhythm-bulwark {
  0%, 100% { opacity: .58; transform: scale(.97); }
  50% { opacity: 1; transform: scale(1.07); }
}
@keyframes ring-bulwark {
  0% { transform: scale(.85); opacity: .4; }
  90%, 100% { transform: scale(1.18); opacity: 0; }
}
@keyframes rhythm-ambush {
  0%, 68% { opacity: .34; transform: scale(.95); }
  78% { opacity: 1; transform: scale(1.1); }
  88% { opacity: .7; transform: scale(1.02); }
  100% { opacity: .34; transform: scale(.95); }
}
@keyframes ring-ambush {
  0%, 70% { transform: scale(.8); opacity: 0; }
  78% { transform: scale(.9); opacity: .55; }
  100% { transform: scale(1.3); opacity: 0; }
}

/* ============================================================
   FOOT — primary CTA (bold, big, notched)
   ============================================================ */
.foot {
  display: flex; flex-direction: column;
  gap: 14px;
}

/* CTA — notched primary, fight-card chevron. Disabled = ghost
   (dashed thin outline, muted). Ready = filled in core hue. */
.cta {
  position: relative; width: 100%;
  font-family: var(--font-disp); font-weight: 800;
  font-size: clamp(19px, 2vw, 23px);
  letter-spacing: .18em; text-transform: uppercase;
  padding: 18px 26px;
  display: flex; align-items: center; justify-content: center; gap: 22px;
  background: transparent; color: var(--ink-ash);
  cursor: not-allowed; opacity: .82;
  overflow: hidden;
  transition: filter .2s, transform .12s, opacity .2s, color .2s;
}
.cta::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  border: 1px dashed var(--ink-line-2);
  clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px),
                    calc(100% - 18px) 100%, 0 100%, 0 18px);
}
.cta .arr {
  font-family: var(--font-mono); font-weight: 700; font-size: 18px;
  letter-spacing: .05em;
  transition: transform .3s var(--ease); /* glides on hover (PLAY-style feel) */
}
.cta span { position: relative; z-index: 2; }

/* Ready — FLAT fill, notched, in core hue. No gloss/bevel, NO surrounding glow
   (one light on screen = the core). A narrow sheen sweeps ACROSS the fill like
   the landing PLAY button — a highlight ON the button, not a halo around it. */
.cta.is-ready {
  cursor: pointer; opacity: 1; color: #0a0a0c;
  background: var(--core);
  clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px),
                    calc(100% - 18px) 100%, 0 100%, 0 18px);
}
.cta.is-ready::after { display: none; }
/* sheen — skewed light band travelling across the fill, clipped to the notch
   (the base .cta is overflow:hidden). Mirrors PLAY; not a second glow source. */
.cta.is-ready::before {
  content: ""; position: absolute; top: 0; bottom: 0; left: -60%; width: 40%;
  pointer-events: none;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, .5), transparent);
  transform: skewX(-18deg);
  animation: cta-sheen 3.4s ease-in-out infinite;
}
.cta.is-ready:hover { filter: brightness(1.08); }
.cta.is-ready:active { transform: scale(.99); }
/* arrow glides right on hover — pointer devices only (static on touch). */
@media (hover: hover) {
  .cta.is-ready:hover .arr { transform: translateX(5px); }
}
@keyframes cta-sheen { 0% { left: -60%; } 45%, 100% { left: 140%; } }
@media (prefers-reduced-motion: reduce) {
  .cta.is-ready::before { animation: none; opacity: 0; }
  .cta .arr { transition: none; }                 /* no glide */
  .cta.is-ready:hover .arr { transform: none; }    /* arrow stays put */
}

/* ============================================================
   DESKTOP TUNING — give the grid more presence at >900px
   ============================================================ */
@media (min-width: 900px) and (min-height: 820px) {
  .col { max-width: 840px; }
  .core-card { min-height: 218px; padding: 20px 22px 0; }
  .core-card .icon { width: 108px; height: 108px; }
  .core-card .stage-i { min-height: 114px; }
  .core-card .stage-i::before { width: 132px; height: 118px; }
}
@media (min-width: 1200px) and (min-height: 920px) {
  .col { max-width: 900px; }
  .core-card { min-height: 240px; }
}

/* Short viewports: collapse to ultra-tight */
@media (max-height: 720px) {
  .core-card { min-height: 168px; padding: 14px 16px 0; }
  .core-card .icon { width: 84px; height: 84px; }
  .core-card .stage-i { min-height: 86px; margin: 4px 0 6px; }
  .core-card .body { padding-bottom: 10px; }
  .headline h1 { font-size: clamp(32px, 5vw, 52px); }
}
</style>
