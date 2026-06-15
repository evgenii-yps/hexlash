<!-- /play/upgrade — Upgrade (pre-fight step 02). 1:1 port of the Claude Design
     handoff (upgrade_handoff/ rebuild v3) per its README. Drill-down through the
     fighter: CORE → CRYSTAL → FACET, then ship to battle.

     Composition: framed depth chamber (core never floats in void), ghost
     crystals with names + lit/limit on CORE level, depth rail + chamber tag +
     back button + action strip, BUILD READOUT band, unified notched foot
     (pool + pips left, TO BATTLE right). One light = the core in the centre;
     crystals/ghosts/facets are flat. §sup-discipline: outer halo uses --core
     (low alpha), --core-sup only seasons the inner highlight — bloom never
     drifts into a neighbour's hue.

     Data — single source src/data/upgradeData.js (CORES + CRYSTALS + RESOURCE;
     ids natisk/nalet/skala/zasada + face states lit/open/locked are contract).
     Geometry — pure fns reused from upgradeGeometry.js (coreSVG shared with the
     arena/select). Working face-tree lives in the prefight store (survives a
     trip to the arena and back). Tint --core/--core-sup written on the scene
     root from prefight.selectedCoreId — same write-site as Core Select. CTA
     «TO BATTLE» is available at every level (Q1 = A, freedom) → /play/arena.
     Demo core-switcher + localStorage seed are NOT ported. -->
<template>
  <div class="scene" :style="coreVars" :data-level="level" data-screen-label="Upgrade">

    <!-- centered composition column -->
    <main class="stage">
      <div class="col">

        <!-- HEADLINE -->
        <header class="headline">
          <div class="ttl">
            <h1>TUNE YOUR <em>CORE.</em></h1>
          </div>
          <button
            type="button" class="core-tag"
            aria-label="Change core — back to core select"
            @click="changeCore"
          >
            <span class="lead"><span class="chev" aria-hidden="true">‹</span><span class="ix">CORE</span></span>
            <span class="nm">{{ core.name }}</span>
          </button>
        </header>

        <!-- DEPTH RAIL — permanent drill-down ladder -->
        <nav class="rail" aria-label="Upgrade depth">
          <button
            type="button" class="step"
            :class="{ here: levelIdx === 0, on: levelIdx > 0 }"
            :disabled="levelIdx < 0"
            :aria-current="levelIdx === 0 ? 'step' : 'false'"
            @click="onRail('core')"
          >
            <span class="dot"></span><span class="ix">01</span><span class="lb">CORE</span>
          </button>
          <span class="link" :class="{ lit: levelIdx > 0 }"></span>
          <button
            type="button" class="step"
            :class="{ here: levelIdx === 1, on: levelIdx > 1 }"
            :disabled="levelIdx < 1"
            :aria-current="levelIdx === 1 ? 'step' : 'false'"
            @click="onRail('crystal')"
          >
            <span class="dot"></span><span class="ix">02</span><span class="lb">CRYSTAL</span>
          </button>
          <span class="link" :class="{ lit: levelIdx > 1 }"></span>
          <button
            type="button" class="step"
            :class="{ here: levelIdx === 2, on: levelIdx > 2 }"
            :disabled="levelIdx < 2"
            :aria-current="levelIdx === 2 ? 'step' : 'false'"
            @click="onRail('face')"
          >
            <span class="dot"></span><span class="ix">03</span><span class="lb">FACET</span>
          </button>
        </nav>

        <!-- DEPTH CHAMBER — one framed stage; level controls what's lit -->
        <section class="depth" ref="depthRef">

          <!-- spokes from core to each crystal (CRYSTAL level) -->
          <svg class="spokes" preserveAspectRatio="none" aria-hidden="true" :viewBox="spokes.viewBox">
            <line v-for="(ln, i) in spokes.lines" :key="i" :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2" />
          </svg>

          <!-- THE core — single glowing object on screen -->
          <button type="button" class="core-node" aria-label="Open crystals" @click="onCoreTap">
            <span class="glow" aria-hidden="true"></span>
            <span class="ring" aria-hidden="true"></span>
            <span class="glyph" v-html="coreGlyph"></span>
            <span class="tap-cue" aria-hidden="true">
              <span class="tap-ring"></span>
              <span class="tap-ring d2"></span>
            </span>
          </button>

          <!-- ghost crystals — depth scaffold on CORE level (names + lit/limit) -->
          <div class="ghosts" aria-hidden="true">
            <span v-for="(cr, i) in tree" :key="cr.id" class="ghost" :style="ghostStyle(i)">
              <span class="ghex">
                <svg viewBox="0 0 100 100" aria-hidden="true"><polygon class="hl" :points="GHEX" /></svg>
              </span>
              <span class="gn">{{ cr.name }}</span>
              <span class="gr"><b>{{ litCount(cr) }}</b>/{{ cr.limit }}</span>
            </span>
          </div>

          <!-- live crystals (CRYSTAL + FACET levels) -->
          <div class="crystals">
            <button
              v-for="(cr, i) in tree"
              :key="cr.id"
              type="button"
              class="crystal"
              :class="{ full: litCount(cr) >= cr.limit, sel: selCrystal === cr.id }"
              :style="crystalStyle(i)"
              :aria-label="`${cr.name} · ${litCount(cr)} of ${cr.limit} lit`"
              @click="openCrystal(cr.id)"
            >
              <span class="shard" v-html="shardHtml(cr)"></span>
              <span class="nm">{{ cr.name }}</span>
              <span class="ratio"><b>{{ litCount(cr) }}</b>/{{ cr.limit }}</span>
            </button>
          </div>

          <!-- facet grid (FACET level) — replaces crystals in place -->
          <div class="facets" :hidden="level !== 'face'">
            <div
              v-for="row in viewFaces"
              :key="row.f.id"
              class="face"
              :class="faceClass(row.f)"
              tabindex="0"
              role="button"
              :aria-pressed="row.f.state === 'lit'"
              @click="toggleFace(row.f)"
              @keydown.enter.prevent="toggleFace(row.f)"
              @keydown.space.prevent="toggleFace(row.f)"
            >
              <span class="fhex" v-html="faceHtml"></span>
              <span class="fl-nm">{{ row.f.name }}</span>
              <!-- Full readout: primary effect (signed percent + word plate),
                   then every secondary effect quieter beneath. Same format for
                   hard + behaviour. Dims with the card on locked/blocked. -->
              <template v-if="row.fx.length">
                <span class="fl-pct">{{ row.fx[0].sign }}{{ row.fx[0].pct }}%</span>
                <span class="fl-tag">{{ row.fx[0].phrase }}</span>
                <span v-if="row.fx.length > 1" class="fl-sub">
                  <span v-for="(fx, k) in row.fx.slice(1)" :key="k"><b>{{ fx.sign }}{{ fx.pct }}%</b> {{ fx.phrase }}</span>
                </span>
              </template>
              <span class="fl-st">{{ faceLabel(row.f) }}</span>
            </div>
          </div>

          <!-- CHAMBER FOOT — actionable strip -->
          <div class="cham-foot">
            <span class="hint">{{ chamFootHint }}</span>
            <span class="caret" aria-hidden="true">{{ chamFootCaret }}</span>
          </div>
        </section>

        <!-- BUILD READOUT — names every lit facet right now -->
        <div class="build-readout" :class="{ full: litNames.length >= RESOURCE }">
          <span class="k">BUILD</span>
          <span class="v" :class="{ empty: !litNames.length }">
            <template v-if="!litNames.length">NO FACETS LIT — TAP IN</template>
            <template v-else>
              <template v-for="(n, i) in litNames" :key="i"><span v-if="i" class="sep">·</span><span class="b">{{ n }}</span></template>
            </template>
          </span>
          <span class="ct">{{ litNames.length }} LIT</span>
        </div>

        <!-- UNIFIED FOOT — pool + pips + bold CTA in one notched container.
             TO BATTLE enabled at every level (Q1 = A, freedom). -->
        <footer class="foot">
          <div class="foot-l">
            <div class="lbl">
              <span class="k">CORE POINTS</span>
              <span class="v" :class="{ depleted: spentTotal >= RESOURCE }"><b>{{ freePts }}</b>&nbsp;/&nbsp;{{ RESOURCE }}&nbsp;FREE</span>
            </div>
            <div class="pips" aria-hidden="true">
              <span v-for="i in RESOURCE" :key="i" class="pip" :class="{ on: i <= spentTotal }"></span>
            </div>
          </div>
          <button type="button" class="cta is-ready" aria-label="Proceed to battle" @click="toBattle">
            <span>TO BATTLE</span>
            <span class="arr" aria-hidden="true">→</span>
          </button>
        </footer>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { CRYSTALS, RESOURCE, getCore } from '@/data/upgradeData.js';
import { facetEffects } from '@/data/facetReadout.js';
import { coreSVG, shardSVG, faceHex, hexPts, radial } from '@/data/upgradeGeometry.js';

const store = useStore();
const router = useRouter();

// --- Core context (picked on the previous screen, read from the store) --------
const coreId = computed(() => getCore(store.getters['prefight/selectedCoreId']).id);
const core = computed(() => getCore(coreId.value));
const coreVars = computed(() => ({ '--core': core.value.hue, '--core-sup': core.value.sup }));
const coreGlyph = computed(() => coreSVG(coreId.value, { seed: true }));
const faceHtml = faceHex();               // constant node markup for every facet
const GHEX = hexPts(50, 50, 42);          // ghost crystal hex outline

// --- Working face-tree (deep copy of CRYSTALS for this core) lives in store ----
store.dispatch('prefight/initUpgradeTree', CRYSTALS[coreId.value]);
const tree = computed(() => store.getters['prefight/upgradeTree'] || []);

// --- Drill-down level + selected crystal --------------------------------------
const level = ref('core'); // 'core' | 'crystal' | 'face'
const levelIdx = computed(() => ['core', 'crystal', 'face'].indexOf(level.value));
const selCrystal = ref(null);
const selCrystalObj = computed(() => tree.value.find((c) => c.id === selCrystal.value) || null);
const selFaces = computed(() => (selCrystalObj.value ? selCrystalObj.value.faces : []));
// Display model for the facet grid — augments each face with its FULL ordered
// effect list (primary first, secondaries quieter). `f` stays the live store
// object, so toggle / class / label keep working off the same reference.
const viewFaces = computed(() => selFaces.value.map((f) => ({
  f,
  fx: facetEffects(f),
})));

// --- Pool accounting (double-clamp: per-crystal limit + global RESOURCE) -------
function litCount(cr) {
  return cr ? cr.faces.filter((f) => f.state === 'lit').length : 0;
}
const spentTotal = computed(() => tree.value.reduce((n, cr) => n + litCount(cr), 0));
const freePts = computed(() => RESOURCE - spentTotal.value);
const litNames = computed(() => {
  const out = [];
  tree.value.forEach((cr) => cr.faces.forEach((f) => { if (f.state === 'lit') out.push(f.name); }));
  return out;
});

// --- SVG helpers (shard uid = coreId-crystalId → unique clipPath key) ---------
function shardHtml(cr) {
  return shardSVG(litCount(cr) / cr.limit, coreId.value + '-' + cr.id);
}

// --- Chamber foot — level-aware copy ------------------------------------------
const chamFootHint = computed(() =>
  level.value === 'core' ? 'TAP THE CORE TO ENTER THE TREE'
    : level.value === 'crystal' ? 'PICK A CRYSTAL'
      : 'LIGHT ONE — QUENCH ANOTHER',
);
const chamFootCaret = computed(() => (level.value === 'core' ? '↓' : ''));

// --- Facet grid — class + label per face --------------------------------------
function faceClass(f) {
  const cr = selCrystalObj.value;
  const atLimit = cr ? litCount(cr) >= cr.limit : false;
  const noPts = spentTotal.value >= RESOURCE;
  return {
    lit: f.state === 'lit',
    open: f.state === 'open',
    locked: f.state === 'locked',
    blocked: f.state === 'open' && (atLimit || noPts),
    shake: shakeFaceId.value === f.id,
  };
}
function faceLabel(f) {
  if (f.state === 'lit') return 'LIT';
  if (f.state === 'locked') return 'LOCKED';
  const cr = selCrystalObj.value;
  if (cr && litCount(cr) >= cr.limit) return 'LIMIT';
  if (spentTotal.value >= RESOURCE) return 'NO PTS';
  return 'OPEN';
}

// --- Toggle a facet — guarded by per-crystal limit + global pool; shake on no --
const shakeFaceId = ref(null);
function setFace(crystalId, faceId, faceState) {
  store.dispatch('prefight/setFaceState', { crystalId, faceId, faceState });
}
function deny(faceId) {
  shakeFaceId.value = null; // retrigger even on the same face
  nextTick(() => {
    shakeFaceId.value = faceId;
    setTimeout(() => { if (shakeFaceId.value === faceId) shakeFaceId.value = null; }, 320);
  });
}
function toggleFace(f) {
  const cr = selCrystalObj.value;
  if (!cr) return;
  if (f.state === 'locked') { deny(f.id); return; }
  if (f.state === 'lit') { setFace(cr.id, f.id, 'open'); return; } // give the point back
  if (litCount(cr) >= cr.limit || spentTotal.value >= RESOURCE) { deny(f.id); return; }
  setFace(cr.id, f.id, 'lit');
}

// --- Navigation ---------------------------------------------------------------
function setLevel(l) { level.value = l; }
function goCrystals() { setLevel('crystal'); }
function openCrystal(id) { selCrystal.value = id; setLevel('face'); }
function goCore() { selCrystal.value = null; setLevel('core'); }
function goBack() {
  if (level.value === 'face') goCrystals();
  else if (level.value === 'crystal') goCore();
}
function onCoreTap() { if (level.value === 'core') goCrystals(); }
function onRail(step) {
  if (step === level.value) return;
  const order = ['core', 'crystal', 'face'];
  if (order.indexOf(step) > levelIdx.value) return; // earlier/visited stops only
  if (step === 'core') goCore();
  else if (step === 'crystal') goCrystals();
}
function toBattle() {
  router.push({ name: 'V2Arena' });
}
// Core tag (top-right) is the single way back to core select — change the core
// wholesale (the BACK button is gone; the stepper handles within-tree nav).
function changeCore() {
  router.push({ name: 'PrefightSelect' });
}

// --- Geometry — radial layout of ghosts/crystals measured against the chamber -
const depthRef = ref(null);
const FALLBACK_R = 150;
const ghostPos = ref(radial(tree.value.length, FALLBACK_R));
const crystalPos = ref(radial(tree.value.length, FALLBACK_R));
const spokes = ref({ viewBox: '0 0 600 460', lines: [] });
const px = (n) => (typeof n === 'number' ? n.toFixed(0) : '0') + 'px';
function ghostStyle(i) {
  const p = ghostPos.value[i];
  return { '--x': px(p ? p.x : 0), '--y': px(p ? p.y : 0) };
}
function crystalStyle(i) {
  const p = crystalPos.value[i];
  return { '--x': px(p ? p.x : 0), '--y': px(p ? p.y : 0) };
}
function computeGeom() {
  const el = depthRef.value;
  if (!el) return;
  const w = el.clientWidth;
  const h = el.clientHeight;
  const n = tree.value.length;
  ghostPos.value = radial(n, Math.min(w * 0.36, h * 0.36, 200));
  crystalPos.value = radial(n, Math.min(w * 0.34, h * 0.34, 200));
  const cp = crystalPos.value;
  spokes.value = {
    viewBox: `0 0 ${w} ${h}`,
    lines: cp.map((p) => ({
      x1: (w / 2).toFixed(0), y1: (h / 2).toFixed(0),
      x2: (w / 2 + p.x).toFixed(0), y2: (h / 2 + p.y).toFixed(0),
    })),
  };
}

let raf = 0;
function onResize() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(computeGeom);
}
function onKeydown(e) {
  if (e.key === 'Escape' && level.value !== 'core') { e.preventDefault(); goBack(); }
}

onMounted(() => {
  nextTick(computeGeom);
  window.addEventListener('resize', onResize);
  document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('resize', onResize);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style>
/* Fonts — shared resource: Saira Condensed (display) + JetBrains Mono (mono).
   Same @import as Core Select — the browser dedupes. */
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
</style>

<style scoped>
/* ============================================================
   HEXLASH — UPGRADE · styles (1:1 port of upgrade_handoff/styles.css, v3).
   Tokens on .scene (component root). SVG from v-html → :deep().
   ============================================================ */
.scene * { box-sizing: border-box; margin: 0; padding: 0; }
.scene button {
  font: inherit; color: inherit; background: none; border: 0; cursor: pointer;
  -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent;
}
.scene ::selection { background: var(--lash); color: #fff; }

/* ============================================================
   SCENE — full viewport. --core top wash + --lash baseline + deep void.
   ============================================================ */
.scene {
  /* Brand Book — Color */
  --bg-void: #08080a;
  --bg-carbon: #0d0a0d;
  --bg-ember: #160a11;          /* faint pink-tinted wash */
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

  /* Picked core context — defaults to Bulwark (visually quiet).
     :style binding swaps --core / --core-sup from prefight.selectedCoreId. */
  --core: #2ED6B0;
  --core-sup: #7AE6D0;
  --core-dim: color-mix(in srgb, var(--core) 55%, transparent);
  --core-faint: color-mix(in srgb, var(--core) 14%, transparent);
  --core-ghost: color-mix(in srgb, var(--core) 7%, transparent);
  --core-ink: color-mix(in srgb, var(--core) 62%, #fff);

  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  background:
    radial-gradient(110% 60% at 50% 0%,
      color-mix(in srgb, var(--core) 9%, transparent), transparent 60%),
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
  padding: clamp(52px, 6vh, 80px) 28px clamp(20px, 3vh, 36px);
  gap: clamp(12px, 1.8vh, 18px);
}
.col {
  width: 100%;
  max-width: min(780px, 100%);
  display: flex; flex-direction: column;
  gap: clamp(12px, 1.4vh, 16px);
}
@media (max-width: 640px) {
  .scene .stage { padding: 56px 18px 18px; }
}

/* ============================================================
   HEADLINE
   ============================================================ */
.headline {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 16px 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ink-line);
}
.headline .ttl { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

.headline h1 {
  font-family: var(--font-disp); font-weight: 900;
  font-size: clamp(36px, 5.6vw, 60px);
  line-height: .88; letter-spacing: .005em;
  text-transform: uppercase; color: var(--ink-bone);
  text-wrap: balance;
  white-space: nowrap;
}
.headline h1 em { font-style: normal; color: #fff;
  text-shadow: 0 0 14px color-mix(in srgb, var(--core) 38%, transparent); }

/* CORE TAG (right meta) — which core is in context. Clickable: the single way
   back to core select (changes the core wholesale). Chevron + hover affordance. */
.core-tag {
  display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
  font-family: var(--font-mono); text-align: right;
  padding: 4px 2px 6px 10px; line-height: 1;
  cursor: pointer;
}
.core-tag .lead { display: inline-flex; align-items: center; gap: 6px; }
.core-tag .chev { font-family: var(--font-disp); font-weight: 800; font-size: 15px;
  line-height: 1; color: var(--ink-ash);
  transition: transform .2s var(--ease), color .2s var(--ease); }
.core-tag .ix { font-size: 10px; letter-spacing: .26em;
  text-transform: uppercase; color: var(--ink-ash); transition: color .2s var(--ease); }
.core-tag .nm { font-family: var(--font-disp); font-weight: 800; font-size: 30px;
  letter-spacing: .02em; text-transform: uppercase; line-height: .92; color: var(--ink-bone);
  text-shadow: 0 0 14px color-mix(in srgb, var(--core) 35%, transparent);
  transition: color .2s var(--ease); }
.core-tag:hover .chev { transform: translateX(-3px); color: var(--core-ink); }
.core-tag:hover .ix { color: var(--core-ink); }
.core-tag:hover .nm { color: #fff; }
.core-tag:focus-visible { outline: 1px solid var(--core-dim); outline-offset: 4px; }

@media (max-width: 520px) {
  .headline { grid-template-columns: 1fr; gap: 10px; padding-bottom: 10px; }
  .headline h1 { font-size: clamp(34px, 10vw, 46px); white-space: normal; }
  /* core tag → ONE cohesive chip: ‹ CORE NAME on a single baseline, tight (no
     gap orphaning the label), hugged by a thin core-tinted border + faint fill
     (flat, no glow). Hugs its content at the grid's left edge under «TUNE YOUR
     CORE.»; name is the accent but stays under the headline size. Tap → /play. */
  .core-tag {
    justify-self: start;
    flex-direction: row; align-items: baseline; justify-content: flex-start;
    text-align: left; gap: 7px;
    padding: 7px 12px;
    background: color-mix(in srgb, var(--core) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--core) 28%, transparent);
    transition: background .2s var(--ease), border-color .2s var(--ease);
  }
  .core-tag .lead { align-items: baseline; gap: 6px; }
  .core-tag .chev { font-size: 14px; }
  .core-tag .ix { font-size: 11px; }
  .core-tag .nm { font-size: 22px; line-height: 1; }
  .core-tag:hover { background: color-mix(in srgb, var(--core) 14%, transparent);
    border-color: var(--core-dim); }
}

/* ============================================================
   DEPTH RAIL — permanent drill-down ladder
   ============================================================ */
.rail {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  align-items: center;
  gap: 0;
  padding: 6px 4px 4px;
}
.rail .step {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 8px;                       /* finger-comfortable hit zone */
  font-family: var(--font-mono);
  cursor: pointer;
  color: var(--ink-3);                     /* future levels — dim, not yet reachable */
  transition: color .25s var(--ease);
}
.rail .step .ix { font-size: 12px; letter-spacing: .22em; font-weight: 700; }
.rail .step .lb { font-size: 13px; letter-spacing: .26em; font-weight: 700; text-transform: uppercase; }
.rail .step .dot {
  width: 12px; height: 12px; border: 1.5px solid currentColor; border-radius: 50%;
  background: transparent;
  transition: background .25s var(--ease), box-shadow .25s var(--ease), border-color .25s var(--ease);
}
.rail .step[disabled] { cursor: default; }
.rail .step.on { color: var(--ink-bone); } /* visited — bright + clickable (step back) */
.rail .step.on:hover { color: #fff; }
.rail .step.on .dot { background: var(--ink-ash); border-color: var(--ink-ash); }
.rail .step.on:hover .dot { background: #fff; border-color: #fff; }
.rail .step.here { color: #fff; }          /* current — pink filled dot */
.rail .step.here .dot {
  background: var(--core); border-color: var(--core);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--core) 22%, transparent),
              0 0 12px color-mix(in srgb, var(--core) 65%, transparent);
}
.rail .step.here .lb { color: #fff; }
.rail .link {
  height: 2px; background: linear-gradient(90deg, var(--ink-line), var(--ink-line-2), var(--ink-line));
  margin: 0 6px; position: relative; overflow: hidden;
}
.rail .link.lit { background: linear-gradient(90deg, var(--core-dim), var(--core), var(--core-dim)); }

@media (max-width: 520px) {
  /* keep the words (CORE / CRYSTAL / FACET) — drop the numbers + tighten so all
     three fit; levels stay clickable with finger-comfortable hit zones. */
  .rail { gap: 0; padding: 4px 6px; }
  .rail .step { gap: 7px; padding: 10px 4px; }
  .rail .step .ix { display: none; }
  .rail .step .lb { display: inline; font-size: 10.5px; letter-spacing: .06em; }
  .rail .step .dot { width: 10px; height: 10px; }
  .rail .link { margin: 0 4px; }
}

/* ============================================================
   DEPTH CHAMBER — one framed stage; level controls what's lit.
   ============================================================ */
.depth {
  position: relative; width: 100%;
  height: clamp(340px, 46vh, 480px);
  isolation: isolate;
  border: 1px solid var(--ink-line-2);
  background:
    radial-gradient(60% 50% at 50% 50%,
      color-mix(in srgb, var(--core) 6%, transparent), transparent 70%),
    linear-gradient(180deg,
      rgba(255, 255, 255, .014),
      rgba(255, 255, 255, 0) 70%);
  /* fight-card chevron corner (Brand Book primary motif) */
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 16px),
                    calc(100% - 16px) 100%, 0 100%);
  overflow: hidden;
}

/* spokes from core to each crystal — visible on CRYSTAL level */
.spokes { position: absolute; inset: 0; z-index: 1; opacity: 0;
  transition: opacity .5s var(--ease); }
.scene[data-level="crystal"] .spokes { opacity: 1; }
.spokes line {
  stroke: var(--core-dim); stroke-width: 1;
  stroke-dasharray: 2 5; opacity: .7;
}

/* ---------- CORE — the only glowing thing on screen ---------- */
.core-node {
  position: absolute; top: 50%; left: 50%;
  width: 200px; height: 200px;
  transform: translate(-50%, -50%);
  display: grid; place-items: center;
  cursor: pointer; z-index: 5;
  transition: transform .65s var(--ease-out),
             filter .5s var(--ease),
             opacity .45s var(--ease);
  will-change: transform;
}
.core-node:focus-visible { outline: none; }
.core-node:focus-visible .ring { opacity: 1; border-color: var(--core); }
.core-node .glyph { width: 100%; height: 100%; display: grid; place-items: center; position: relative; z-index: 3; }
.core-node :deep(svg) { width: 100%; height: 100%; overflow: visible; }
.core-node :deep(.hex-line) {
  stroke: color-mix(in srgb, var(--core) 22%, #fff);
  fill: none; stroke-width: 2;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--core) 55%, transparent));
}
.core-node :deep(.facet) {
  stroke: color-mix(in srgb, var(--core) 30%, #fff);
  fill: none; stroke-width: 1.4;
}
.core-node :deep(.seed) {
  fill: #fff;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--core) 90%, transparent));
}

/* THE glow — outer halo from --core (low alpha), inner highlight seasons with
   --core-sup (§sup-discipline) so the bloom can't drift into a neighbour hue. */
.core-node .glow {
  position: absolute; inset: -32%; border-radius: 50%; z-index: 1; pointer-events: none;
  background:
    radial-gradient(circle at 50% 50%,
      color-mix(in srgb, var(--core) 62%, transparent) 0%,
      color-mix(in srgb, var(--core) 24%, transparent) 28%,
      color-mix(in srgb, var(--core) 10%, transparent) 50%,
      transparent 66%),
    radial-gradient(circle at 50% 42%,
      color-mix(in srgb, var(--core-sup) 28%, transparent) 0%,
      transparent 38%);
  filter: blur(22px);
  mix-blend-mode: screen;
  animation: breathe 4.6s ease-in-out infinite;
}
.core-node .ring {
  position: absolute; inset: -6%; border: 1px solid var(--core-dim); border-radius: 50%;
  z-index: 2; opacity: 0;
  animation: ring 4.6s ease-out infinite;
}

/* tap cue — two thin pulse rings ONLY on CORE level */
.core-node .tap-cue {
  position: absolute; inset: -12%; z-index: 2; pointer-events: none; opacity: 0;
  display: grid; place-items: center;
  transition: opacity .35s var(--ease);
}
.scene[data-level="core"] .core-node .tap-cue { opacity: 1; }
.core-node .tap-ring {
  position: absolute; inset: 0; border: 1px solid color-mix(in srgb, var(--core) 75%, transparent);
  border-radius: 50%;
  animation: tapring 2.2s ease-out infinite;
}
.core-node .tap-ring.d2 { animation-delay: 1.1s; }

@keyframes breathe {
  0%, 100% { opacity: .72; transform: scale(.97); }
  50% { opacity: 1; transform: scale(1.05); }
}
@keyframes ring {
  0% { transform: scale(.74); opacity: .45; }
  70%, 100% { transform: scale(1.28); opacity: 0; }
}
@keyframes tapring {
  0% { transform: scale(.8); opacity: .55; }
  80%, 100% { transform: scale(1.35); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .core-node .glow { animation: none; opacity: .85; }
  .core-node .ring, .core-node .tap-cue { display: none; }
}

/* level positions for the core */
.scene[data-level="core"] .core-node { transform: translate(-50%, -50%) scale(1); }
.scene[data-level="crystal"] .core-node { transform: translate(-50%, -50%) scale(.5); cursor: default; }
.scene[data-level="face"] .core-node {
  transform: translate(calc(-50% + 0px), calc(-50% - 100px)) scale(.22);
  opacity: .4; filter: blur(.4px); cursor: default;
}
.scene[data-level="crystal"] .core-node .glow { opacity: .55; }
.scene[data-level="face"] .core-node .glow { opacity: .28; animation: none; }
.scene[data-level="crystal"] .core-node .ring,
.scene[data-level="face"] .core-node .ring { display: none; }

/* ---------- GHOST CRYSTALS — depth scaffold on CORE level ---------- */
.ghosts { position: absolute; inset: 0; z-index: 2; pointer-events: none;
  transition: opacity .45s var(--ease); }
.ghost {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0));
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  text-align: center; width: 78px;
  opacity: .78;
}
.ghost .ghex { width: 42px; height: 42px; display: grid; place-items: center; }
.ghost .ghex svg { width: 100%; height: 100%; overflow: visible; }
.ghost .ghex .hl { stroke: var(--core-dim); fill: none; stroke-width: 1; stroke-dasharray: 3 4; }
.ghost .gn { font-family: var(--font-mono); font-size: 9px; font-weight: 600;
  letter-spacing: .14em; text-transform: uppercase; color: var(--ink-ash); line-height: 1; }
.ghost .gr { font-family: var(--font-mono); font-size: 8.5px;
  letter-spacing: .08em; color: var(--ink-3); line-height: 1; }
.ghost .gr b { color: var(--core-ink); font-weight: 600; }
.scene[data-level="crystal"] .ghosts,
.scene[data-level="face"] .ghosts { opacity: 0; }

/* ---------- CRYSTALS ---------- */
.crystals { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.crystal {
  position: absolute; top: 50%; left: 50%;
  width: 96px;
  transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(.4);
  opacity: 0; pointer-events: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  text-align: center;
  transition: transform .55s var(--ease-out),
             opacity .4s var(--ease),
             filter .3s var(--ease);
}
.scene[data-level="crystal"] .crystal,
.scene[data-level="face"] .crystal.sel {
  opacity: 1; pointer-events: auto;
  transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(1);
}
.scene[data-level="crystal"] .crystal:nth-child(1) { transition-delay: .04s; }
.scene[data-level="crystal"] .crystal:nth-child(2) { transition-delay: .09s; }
.scene[data-level="crystal"] .crystal:nth-child(3) { transition-delay: .14s; }
.scene[data-level="crystal"] .crystal:nth-child(4) { transition-delay: .19s; }
.crystal .shard {
  width: 62px; height: 62px; position: relative;
  transition: transform .3s var(--ease);
}
.crystal:hover .shard { transform: translateY(-2px); }
.crystal .shard :deep(svg) { width: 100%; height: 100%; overflow: visible; }
.crystal .shard :deep(.fill) { fill: var(--bg-carbon); }
.crystal .shard :deep(.lit) {
  fill: color-mix(in srgb, var(--core) 55%, transparent);
  transition: fill .25s var(--ease);
}
.crystal .shard :deep(.hex-line) {
  stroke: color-mix(in srgb, var(--core) 50%, var(--ink-ash));
  fill: none; stroke-width: 1.6;
  transition: stroke .25s var(--ease);
}
.crystal:hover .shard :deep(.hex-line) { stroke: #fff; }
.crystal .nm { font-family: var(--font-mono); font-size: 10px; font-weight: 600;
  letter-spacing: .16em; text-transform: uppercase; color: var(--ink-bone); }
.crystal .ratio { font-family: var(--font-mono); font-size: 10px; color: var(--ink-ash);
  letter-spacing: .08em; }
.crystal .ratio b { color: var(--core-ink); font-weight: 700; }
.crystal.full .ratio b { color: #fff; }
.crystal.full .shard::after {
  content: ""; position: absolute; inset: -3px; border: 1px dashed var(--core-dim);
  pointer-events: none;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
}

/* ============================================================
   FACETS — appear in place of crystals on FACET level.
   ============================================================ */
.facets[hidden] { display: none; }
.facets {
  position: absolute; left: 0; right: 0;
  top: 62px; bottom: 46px;
  padding: 6px 18px 6px;
  z-index: 6;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
  gap: 8px;
  overflow-y: auto; scrollbar-width: thin;
  align-content: start;
}
.facets::-webkit-scrollbar { width: 4px; }
.facets::-webkit-scrollbar-thumb { background: var(--ink-line-2); border-radius: 4px; }

.face {
  position: relative;
  border: 1px solid var(--ink-line);
  background: rgba(255, 255, 255, .018);
  padding: 10px 6px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 7px;
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px),
                    calc(100% - 8px) 100%, 0 100%);
  transition: border-color .2s, background .2s, transform .12s;
  -webkit-tap-highlight-color: transparent;
  opacity: 0; transform: translateY(6px);
}
.scene[data-level="face"] .face {
  opacity: 1; transform: translateY(0);
  transition: opacity .3s var(--ease-out), transform .3s var(--ease-out),
             border-color .2s, background .2s;
}
.scene[data-level="face"] .face:nth-child(1) { transition-delay: .02s; }
.scene[data-level="face"] .face:nth-child(2) { transition-delay: .05s; }
.scene[data-level="face"] .face:nth-child(3) { transition-delay: .08s; }
.scene[data-level="face"] .face:nth-child(4) { transition-delay: .11s; }
.scene[data-level="face"] .face:nth-child(5) { transition-delay: .14s; }
.scene[data-level="face"] .face:nth-child(6) { transition-delay: .17s; }
.face:active { transform: scale(.96); }
.face .fhex { width: 30px; height: 30px; color: var(--ink-ash); transition: color .25s var(--ease); }
.face .fhex :deep(svg) { width: 100%; height: 100%; overflow: visible; }
.face .fhex :deep(.ln) { stroke: currentColor; fill: none; stroke-width: 1.5; }
.face .fhex :deep(.fl) { fill: transparent; }
.face .fl-nm { font-family: var(--font-mono); font-size: 9px; font-weight: 600;
  letter-spacing: .12em; text-transform: uppercase; color: var(--ink-bone); text-align: center; }
.face .fl-st { font-family: var(--font-mono); font-size: 8px;
  letter-spacing: .18em; text-transform: uppercase; color: var(--ink-ash); }

/* Two-layer readout — uniform for hard + behaviour facets. The percent is the
   accent (core hue, §one-glow: a flat tint, no second colour); the phrase plate
   is a quiet word line under it. lit/open/locked dimming rides on the card. */
.face .fl-pct { font-family: var(--font-mono); font-size: 13px; font-weight: 700;
  letter-spacing: .02em; line-height: 1; color: var(--core-ink); }
.face .fl-tag { font-family: var(--font-mono); font-size: 8px; font-weight: 500;
  letter-spacing: .04em; text-transform: uppercase; color: var(--ink-ash);
  line-height: 1.15; text-align: center; }
.face.lit .fl-pct { color: var(--core); }
.face.lit .fl-tag { color: var(--core-ink); }

/* SECONDARY effects — smaller + quieter than the primary, one per line. Same
   ink greys (no new colour, no glow); the signed number is a touch brighter than
   its phrase so it reads at a glance without competing with the headline. */
.face .fl-sub { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.face .fl-sub span {
  font-family: var(--font-mono); font-size: 7.5px; font-weight: 500;
  letter-spacing: .03em; text-transform: uppercase; color: var(--ink-3);
  line-height: 1.25; text-align: center;
}
.face .fl-sub b { color: var(--ink-ash); font-weight: 700; }
.face.lit .fl-sub b { color: var(--core-ink); }

/* face states — FLAT colour, no glow (glow is the core's job) */
.face.lit {
  border-color: var(--core-dim);
  background: color-mix(in srgb, var(--core) 10%, transparent);
}
.face.lit .fhex { color: var(--core); }
.face.lit .fhex :deep(.fl) { fill: var(--core); }
.face.lit .fl-st { color: var(--core-ink); }
.face.open:hover { border-color: var(--ink-line-2); background: rgba(255, 255, 255, .04); }
.face.locked { opacity: .4; cursor: not-allowed; border-style: dashed; }
.face.locked .fl-st { color: var(--ink-3); }
.face.blocked { cursor: not-allowed; }
.face.blocked .fl-st { color: var(--core-ink); }
@keyframes deny {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
.face.shake { animation: deny .32s; }

/* ============================================================
   CHAMBER FOOT — actionable strip pinned to bottom of chamber
   ============================================================ */
.cham-foot {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 7;
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 10px 18px;
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .26em;
  text-transform: uppercase; color: var(--core-ink);
  border-top: 1px solid var(--ink-line);
  background:
    linear-gradient(180deg,
      transparent 0%,
      color-mix(in srgb, var(--bg-void) 70%, #000) 60%,
      var(--bg-void) 100%);
  pointer-events: none;
}
.cham-foot .hint { color: #fff; font-weight: 600; }
.cham-foot .caret {
  font-family: var(--font-mono); color: var(--core); font-weight: 700;
  animation: caretpulse 1.6s ease-in-out infinite;
}
.scene[data-level="crystal"] .cham-foot .caret,
.scene[data-level="face"] .cham-foot .caret { display: none; }
@keyframes caretpulse {
  0%, 100% { transform: translateY(0); opacity: .5; }
  50% { transform: translateY(-3px); opacity: 1; }
}

/* ============================================================
   BUILD READOUT — one-line manifest of currently lit facets
   ============================================================ */
.build-readout {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: center; gap: 14px;
  padding: 8px 12px;
  border: 1px solid var(--ink-line);
  background: rgba(255, 255, 255, .013);
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: .18em; text-transform: uppercase; line-height: 1.2;
}
.build-readout .k { color: var(--ink-ash); font-weight: 500; letter-spacing: .24em; }
.build-readout .v { color: var(--ink-bone); font-weight: 500; letter-spacing: .16em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.build-readout .v.empty { color: var(--ink-3); }
.build-readout .v .b { color: var(--core-ink); font-weight: 700; }
.build-readout .v .sep { color: var(--ink-3); margin: 0 6px; }
.build-readout .ct { color: var(--core-ink); font-weight: 700; letter-spacing: .18em;
  font-size: 10.5px; white-space: nowrap; }
.build-readout.full .ct { color: #fff; }
@media (max-width: 520px) {
  .build-readout { font-size: 10px; gap: 10px; padding: 8px 12px; }
  .build-readout .k { display: none; }
}

/* ============================================================
   UNIFIED FOOT — pool + pips + bold CTA in ONE container
   ============================================================ */
.foot {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: stretch;
  gap: 14px;
  padding-top: 4px;
}
.foot-l {
  display: flex; flex-direction: column; justify-content: center; gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--ink-line);
  background: rgba(255, 255, 255, .013);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px),
                    calc(100% - 12px) 100%, 0 100%);
  min-width: 0;
}
.foot-l .lbl {
  display: flex; align-items: baseline; gap: 12px;
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: .18em; text-transform: uppercase; line-height: 1;
  min-width: 0;
}
.foot-l .lbl .k { color: var(--ink-ash); font-weight: 500; letter-spacing: .24em; }
.foot-l .lbl .v {
  font-family: var(--font-disp); font-weight: 800; font-size: 18px;
  letter-spacing: .04em; color: var(--ink-bone); line-height: 1;
  white-space: nowrap;
}
.foot-l .lbl .v b { color: var(--core-ink); }
.foot-l .lbl .v.depleted b { color: var(--lash);
  text-shadow: 0 0 8px var(--lash-dim); }
.foot-l .pips { display: flex; gap: 6px; }
.foot-l .pip {
  flex: 1; height: 8px;
  border: 1px solid var(--ink-line-2); background: transparent;
  transition: .2s var(--ease);
}
.foot-l .pip.on { background: var(--core); border-color: var(--core);
  box-shadow: 0 0 6px color-mix(in srgb, var(--core) 60%, transparent); }
.foot-l .pip.over {
  background: transparent; border-color: var(--core-dim);
  border-style: dashed;
}

/* CTA — angular notch, always enabled (Q1 = A). Resting state is DARK in the
   core's gamma; on hover (pointer devices) it fills with the core colour — a
   flat colour shift, NOT a surrounding glow (one light on screen = the core).
   A narrow sheen sweeps ACROSS it (PLAY-style) regardless of state. */
.cta {
  position: relative;
  font-family: var(--font-disp); font-weight: 800;
  font-size: clamp(18px, 1.9vw, 22px);
  letter-spacing: .18em; text-transform: uppercase;
  padding: 0 32px; min-height: 60px;
  display: flex; align-items: center; justify-content: center; gap: 22px;
  background: color-mix(in srgb, var(--core) 16%, #0a0a0c); /* dark, faint core gamma */
  color: var(--ink-bone);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--core) 30%, transparent); /* crisp edge, no blur */
  cursor: pointer;
  overflow: hidden;
  clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px),
                    calc(100% - 18px) 100%, 0 100%, 0 18px);
  transition: background .25s var(--ease), color .25s var(--ease),
              box-shadow .25s var(--ease), transform .12s;
  min-width: 240px;
}
/* sheen — narrow skewed light band travelling across the button, clipped to the
   notch via overflow:hidden. Mirrors the PLAY button; not a second glow source. */
.cta::before {
  content: ""; position: absolute; top: 0; bottom: 0; left: -60%; width: 40%;
  pointer-events: none;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, .4), transparent);
  transform: skewX(-18deg);
  animation: cta-sheen 3.4s ease-in-out infinite;
}
.cta span { position: relative; z-index: 2; white-space: nowrap; }
.cta .arr { font-family: var(--font-mono); font-weight: 700; font-size: 18px; letter-spacing: .05em;
  transition: transform .3s var(--ease); } /* glides on hover (PLAY-style feel) */
/* hover → fill in the core hue (flat shift, no glow) + the arrow glides right.
   Pointer devices only, so touch screens keep the dark resting look + a static
   arrow (mirrors Core Select's hover gate). */
@media (hover: hover) {
  .cta:hover {
    background: var(--core); color: #0a0a0c;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--core) 60%, transparent);
  }
  .cta:hover .arr { transform: translateX(5px); }
}
.cta:active { transform: scale(.99); }
@keyframes cta-sheen { 0% { left: -60%; } 45%, 100% { left: 140%; } }
@media (prefers-reduced-motion: reduce) {
  .cta { transition: none; }                /* hover snaps to its final state */
  .cta::before { animation: none; opacity: 0; }
  .cta .arr { transition: none; }           /* no glide */
  .cta:hover .arr { transform: none; }       /* arrow stays put */
}
.cta:focus-visible { outline: 1px solid #fff; outline-offset: 3px; }

@media (max-width: 520px) {
  /* Mobile layout — tighter vertical rhythm, diagram inset off the frame,
     single-column foot with a tidy CORE POINTS panel. Wide view is untouched. */
  /* Scrollable screen on mobile: the base scene is position:fixed inset:0 +
     overflow:hidden, so its bottom is pinned under iOS Safari's floating bar and
     TO BATTLE gets clipped. Here: release the bottom anchor, size to the DYNAMIC
     viewport (100dvh, 100vh fallback) so the floating bar is accounted for, and
     let the screen scroll so the (in-flow, non-sticky) CTA is always reachable. */
  .scene {
    inset: 0 0 auto 0;        /* top/left/right pinned, bottom released */
    height: 100vh;            /* fallback for browsers without dvh */
    height: 100dvh;           /* dynamic — excludes the floating browser bar */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  /* Bottom buffer = home-indicator safe area + slack for the floating bar, so
     the CTA fully clears the system panels when scrolled to the end. */
  .scene .stage { padding: 40px 16px calc(28px + env(safe-area-inset-bottom)); }
  .col { gap: 10px; }                          /* pull the sections together */
  .core-node { width: 168px; height: 168px; }  /* central hex breathes in-frame */
  /* Pull the radial ring (branch labels on CORE, crystals + spokes on CRYSTAL)
     inward off the edges — scale the three co-centred layers together so the
     spokes stay aligned to the crystals and labels/crystals clear the frame. */
  .ghosts, .crystals, .spokes { transform: scale(.82); transform-origin: 50% 50%; }
  .foot { grid-template-columns: 1fr; gap: 10px; }
  .cta { min-width: 0; width: 100%; min-height: 54px; }
  /* CORE POINTS — content sits inside the panel (12px gutter, matching BUILD);
     pips even, not edge-jammed. */
  .foot-l { padding: 11px 12px; gap: 9px; }
  .foot-l .lbl { gap: 10px; }
  .foot-l .pips { gap: 5px; }
}

/* ============================================================
   DESKTOP TUNING — column gets more presence at >900px
   ============================================================ */
@media (min-width: 900px) and (min-height: 820px) {
  .col { max-width: 860px; }
  .depth { height: clamp(420px, 52vh, 520px); }
  .core-node { width: 230px; height: 230px; }
  .crystal { width: 108px; }
  .crystal .shard { width: 72px; height: 72px; }
  .ghost { width: 88px; }
  .ghost .ghex { width: 48px; height: 48px; }
}
@media (min-width: 1200px) and (min-height: 920px) {
  .col { max-width: 920px; }
}

/* short viewports: tighten the chamber so the foot stays visible */
@media (max-height: 720px) {
  .depth { height: 330px; }
  .core-node { width: 160px; height: 160px; }
  .crystal { width: 84px; }
  .crystal .shard { width: 54px; height: 54px; }
  .headline h1 { font-size: clamp(32px, 5vw, 46px); }
}
@media (max-height: 620px) {
  .depth { height: 280px; }
  .core-node { width: 140px; height: 140px; }
  .ghost { width: 64px; }
  .ghost .ghex { width: 36px; height: 36px; }
}
</style>
