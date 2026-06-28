<!-- ModeSelectView — the PVE / PVP fork (/play/mode). Sits between the home FIGHT
     button and the existing flows: PVE → /play/training (stub), PVP → /play (core
     select). Ported from the Claude Design handoff (docs/design-handoff/mode_select)
     onto the real shell: the shared persistent .hs-strip (home.css) is reused
     verbatim (brand LogoMark 40px + HEXLASH + SHOP + cabinet chip), not a bare
     prototype bar; no SEASON 0.

     Discipline: one accent per door (PVE amber #FFB21D / PVP pink #FF0069, never
     together, never a core colour); the scene's pink glow lives only on the PVP
     door + the system chrome (top ember); at rest the screen is calm — no bloom,
     accent bars are #2a2a31; the top strip is matte. The prototype's watermark,
     HUD corners, SEASON 0, bare 26px brand and its hex.prefight.mode localStorage
     stub are intentionally NOT ported — real navigation replaces the stub. -->
<template>
  <div class="mode-root">
    <div class="mode-bg-ember" aria-hidden="true"></div>
    <div class="mode-bg-grid" aria-hidden="true"></div>

    <!-- real shared chrome: brand → home, shop → home (the shop toggle lives on
         /play/home), cabinet → the player drawer mounted below -->
    <div class="hs-strip">
      <button type="button" class="hs-brandblock" @click="goHome" :aria-label="`${t.home.brand} — home`">
        <LogoMark /><span class="wm">{{ t.home.brand }}</span>
      </button>
      <div class="hs-cluster">
        <button type="button" class="seg hs-seg-shop" @click="goHome">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
          <span class="txt"><span class="n">{{ t.home.shop }}</span><span class="s">{{ t.home.shopSub }}</span></span>
        </button>
        <button type="button" class="seg hs-seg-cab" @click="cabinetOpen = true">
          <span class="av"><span /></span>
          <span class="txt"><span class="hand">{{ t.cabinet.chipHandle }}</span><span class="sub">{{ t.cabinet.chipOpen }}</span></span>
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
    </div>

    <main class="mode-stage">
      <button type="button" class="mode-back" @click="goHome">← Back</button>

      <header class="mode-head">
        <h1 class="mode-title">Choose your <em>mode.</em></h1>
        <div class="mode-divider" aria-hidden="true"></div>
      </header>

      <div class="panels">
        <!-- ───────── PVE — amber, floating legend over a slab ───────── -->
        <button type="button" class="door is-pve" :class="{ 'is-armed': armed === 'pve' }" @click="pickPve">
          <span class="door-bloom" aria-hidden="true"></span>
          <span class="door-eyebrow">TRAINING</span>
          <span class="door-emblem" aria-hidden="true">
            <svg viewBox="0 0 120 120" fill="none">
              <!-- slab -->
              <polygon class="em-slab" points="34,92 86,92 98,104 22,104" />
              <polygon class="em-slab-top" points="40,86 80,86 86,92 34,92" />
              <!-- roster marks on the slab -->
              <g class="em-roster">
                <rect x="46" y="96" width="3" height="6" /><rect x="54" y="96" width="3" height="6" />
                <rect x="62" y="96" width="3" height="6" /><rect x="70" y="96" width="3" height="6" />
              </g>
              <!-- floating legend (crest + figure) -->
              <g class="legend">
                <ellipse class="em-shadow" cx="60" cy="84" rx="16" ry="3.2" />
                <polygon class="em-legend" points="60,30 74,44 60,74 46,44" />
                <polygon class="em-legend-in" points="60,40 67,47 60,64 53,47" />
                <circle class="em-spark" cx="60" cy="26" r="2.4" />
              </g>
            </svg>
          </span>
          <span class="door-title">PVE</span>
          <span class="door-sub">Your legend raises the club.</span>
          <span class="door-foot">Passive <i>·</i> watch or walk away</span>
          <span class="door-accent" aria-hidden="true"></span>
        </button>

        <!-- ───────── PVP — pink, a ragged rift ───────── -->
        <button type="button" class="door is-pvp" :class="{ 'is-armed': armed === 'pvp' }" @click="pickPvp">
          <span class="door-bloom" aria-hidden="true"></span>
          <span class="door-eyebrow">ARENA</span>
          <span class="door-emblem" aria-hidden="true">
            <svg viewBox="0 0 120 120" fill="none">
              <g class="rift">
                <polygon class="em-rift" points="58,18 66,40 56,52 68,66 54,80 64,102 60,102 50,80 62,66 50,52 60,40 54,18" />
                <polyline class="em-rift-spur" points="66,40 80,46" />
                <polyline class="em-rift-spur" points="50,52 36,60" />
                <polyline class="em-rift-spur" points="64,66 78,74" />
              </g>
            </svg>
          </span>
          <span class="door-title">PVP</span>
          <span class="door-sub">Pick a core. Step in.</span>
          <span class="door-foot">Core select <i>·</i> arena</span>
          <span class="door-accent" aria-hidden="true"></span>
        </button>
      </div>
    </main>

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
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import { LogoMark } from '@/components/landing/icons.js';
import '@/styles/home.css';     // the shared .hs-strip chrome
import '@/styles/cabinet.css';  // the PlayerCabinet drawer

const router = useRouter();

const cabinetOpen = ref(false);
const armed = ref(null); // 'pve' | 'pvp' — brief committed state before navigating

// Cabinet card data (mirrors HomeView): default fighter until a core is picked.
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreName = computed(() => core.value?.name || 'ONSLAUGHT');
const coreSig = computed(() => core.value?.sig || 'PRESSURE');
const balance = '2,480';

function goHome() { router.push('/play/home'); }

// Our navigation contract (NOT the prototype's localStorage stub): arm the door
// for a beat (commit feedback), then route. PVE → training stub, PVP → core select.
function pickPve() { if (armed.value) return; armed.value = 'pve'; setTimeout(() => router.push('/play/training'), 190); }
function pickPvp() { if (armed.value) return; armed.value = 'pvp'; setTimeout(() => router.push('/play'), 190); }
</script>

<style scoped>
/* Tokens the reused .hs-strip needs (it is coded against .home-root) — same values,
   provided here so the real strip is portable to this route without editing home.css.
   Plus this screen's own palette. */
.mode-root {
  --void: #08080a; --panel: #16161b; --ink: #ededf1; --ink-dim: #5d5d66;
  --lash: #ff0069; --amber: #ffb21d; --accent-rest: #2a2a31;
  --line: rgba(255, 255, 255, 0.09);
  /* strip tokens (mirror .home-root) */
  --line2: rgba(255, 255, 255, 0.16);
  --bone: #f6f4f6; --ash: #6e6a72;
  --hs-disp: "Saira Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif;
  --hs-mono: "JetBrains Mono", ui-monospace, monospace;

  position: absolute; inset: 0; overflow: hidden;
  background: var(--void); color: var(--ink);
  font-family: var(--hs-disp); -webkit-font-smoothing: antialiased;
}
.mode-root * { box-sizing: border-box; }

/* ── background: void + top ember halo + edge-masked discipline grid ── */
.mode-bg-ember { position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: radial-gradient(95% 52% at 50% -6%, rgba(255, 0, 105, 0.10), transparent 58%); }
.mode-bg-grid { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.28;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 58px 58px;
  -webkit-mask: radial-gradient(120% 92% at 50% 28%, #000 38%, transparent 80%);
          mask: radial-gradient(120% 92% at 50% 28%, #000 38%, transparent 80%); }

/* ── working zone (sits below the 74px strip) ── */
.mode-stage {
  position: absolute; inset: 0; z-index: 1;
  container-type: inline-size;
  display: flex; flex-direction: column;
  padding: 96px 28px 36px;
}
.mode-back {
  align-self: flex-start; margin-bottom: 14px;
  font-family: var(--hs-mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-dim); background: none; border: 0; cursor: pointer; padding: 6px 4px;
  transition: color 0.15s;
}
.mode-back:hover { color: var(--ink); }
.mode-back:focus-visible { outline: 2px solid var(--bone); outline-offset: 3px; color: var(--ink); }

.mode-head { flex: 0 0 auto; }
.mode-title {
  margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: 0.01em;
  line-height: 0.88; font-size: clamp(34px, 6cqi, 62px); color: var(--ink);
}
.mode-title em { font-style: normal; color: var(--ink); text-shadow: 0 0 18px rgba(255, 0, 105, 0.45); }
.mode-divider { height: 1px; margin-top: 18px; background: var(--line); }

/* ── the two doors ── */
.panels {
  flex: 1 1 auto; min-height: 0; margin-top: 22px;
  display: grid; grid-template-columns: 1fr; gap: 16px;
}
@container (min-width: 760px) { .panels { grid-template-columns: 1fr 1fr; } }

.door {
  --accent: var(--accent-rest);
  position: relative; height: 100%; min-height: 0; overflow: hidden;
  display: flex; flex-direction: column; align-items: flex-start; text-align: left;
  padding: 26px 26px 30px; cursor: pointer;
  background: var(--panel); border: 1px solid var(--line); color: var(--ink);
  font-family: var(--hs-disp);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  transition: border-color 0.2s, transform 0.12s, background 0.2s;
}
.door.is-pve { --accent: #ffb21d; }
.door.is-pvp { --accent: #ff0069; }

.door:hover { border-color: rgba(255, 255, 255, 0.18); transform: translateY(-2px); }
.door:active { transform: scale(0.992); }
.door:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.door.is-armed { border-color: var(--accent); }

/* one bloom per door — only on hover / armed */
.door-bloom {
  position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(70% 52% at 50% 42%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%);
  transition: opacity 0.25s;
}
.door:hover .door-bloom, .door.is-armed .door-bloom { opacity: 1; }

.door > :not(.door-bloom) { position: relative; z-index: 1; }

.door-eyebrow {
  font-family: var(--hs-mono); font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--ink-dim);
}
.door-emblem {
  flex: 1 1 auto; align-self: stretch; min-height: 0;
  display: flex; align-items: center; justify-content: center;
  color: #44444d; /* matte at rest */ transition: color 0.25s;
}
.door:hover .door-emblem, .door.is-armed .door-emblem { color: var(--accent); }
.door-emblem svg { width: clamp(96px, 26cqi, 168px); height: auto; }

.em-slab { fill: #26262d; }
.em-slab-top { fill: #2f2f37; }
.em-roster rect { fill: currentColor; opacity: 0.85; }
.em-shadow { fill: #000; opacity: 0.35; }
.em-legend { fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linejoin: round; }
.em-legend-in { fill: currentColor; opacity: 0.85; }
.em-spark { fill: currentColor; }
.em-rift { fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linejoin: round; }
.em-rift-spur { stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; opacity: 0.8; }

.door-title {
  font-weight: 900; text-transform: uppercase; letter-spacing: 0.01em; line-height: 0.9;
  font-size: clamp(34px, 8cqi, 56px); color: var(--ink); margin-top: 6px;
}
.door-sub {
  margin-top: 8px; font-size: clamp(15px, 2.4cqi, 19px); letter-spacing: 0.01em; color: var(--ink);
}
.door-foot {
  margin-top: 14px; font-family: var(--hs-mono); font-size: 11px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-dim);
}
.door-foot i { font-style: normal; margin: 0 4px; }

.door-accent {
  position: absolute; left: 0; right: 0; bottom: 0; height: 3px; z-index: 1;
  background: var(--accent-rest); transition: background 0.25s;
}
.door:hover .door-accent, .door.is-armed .door-accent { background: var(--accent); }

/* ── signature idle motion (calm; matte at rest) ── */
@media (prefers-reduced-motion: no-preference) {
  .is-pve .legend { animation: mode-float 2.6s ease-in-out infinite; transform-origin: center; }
  .is-pvp .rift { animation: mode-riftPulse 1.6s ease-in-out infinite; transform-origin: 60px 60px; }
}
@keyframes mode-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes mode-riftPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

/* ≤560px — tighter working zone, doors stack tall. (Media query, not @container:
   .mode-stage is itself the query container, so it can't be styled by its own
   container query — only its descendants can.) */
@media (max-width: 560px) {
  .mode-stage { padding: 78px 18px 30px; }
}
</style>
