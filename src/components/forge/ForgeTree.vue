<!-- ForgeTree — the fighter's upgrade tree, as a PANEL inside the FORGE hall.

     The mechanic is the one that used to live on the pre-fight upgrade screen
     (UpgradeView): drill down CORE → CRYSTAL → FACET, tap a facet to light it,
     two guards (the crystal's own limit and the fighter's point pool). Same
     geometry helpers, same facet readout, same face states — the contract
     ('lit' | 'open' | 'locked') is unchanged.

     What is NOT carried over is that screen's furniture: it was a full-page
     composition (page background, headline, big stepper, bottom action bar) and
     none of it fits a panel that shares the screen with a 3D hall and a fighter
     card. So the chamber, the crystals and the facets are ported; the frame
     around them is new and smaller.

     Owns nothing: the tree, the core and the spend counter come in as props and
     every change leaves as an event. Whose tree it is, and where it is stored,
     is the hall's business (roster store → the fighter's own record). -->
<template>
  <div class="ftree" :style="coreVars" :data-level="level">

    <!-- head — where you are + what you have spent -->
    <div class="ft-head">
      <nav class="ft-rail" aria-label="Upgrade depth">
        <button
          v-for="(step, i) in STEPS" :key="step.id"
          type="button" class="ft-step"
          :class="{ here: levelIdx === i, on: levelIdx > i }"
          :disabled="i > levelIdx"
          :aria-current="levelIdx === i ? 'step' : 'false'"
          @click="onRail(step.id)"
        ><span class="dot"></span><span class="lb">{{ step.label }}</span></button>
      </nav>
      <span class="ft-pool">
        <b>{{ spent }}</b> / {{ resource }}
      </span>
    </div>

    <!-- chamber — the drill-down stage -->
    <section class="ft-depth" ref="depthRef">
      <svg class="ft-spokes" preserveAspectRatio="none" aria-hidden="true" :viewBox="spokes.viewBox">
        <line v-for="(ln, i) in spokes.lines" :key="i" :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2" />
      </svg>

      <!-- the core — the panel's one glowing thing -->
      <button type="button" class="ft-core" :aria-label="t.forge.openCrystals" @click="onCoreTap">
        <span class="glow" aria-hidden="true"></span>
        <span class="glyph" v-html="coreGlyph"></span>
      </button>

      <!-- ghost crystals — depth scaffold on CORE level -->
      <div class="ft-ghosts" aria-hidden="true">
        <span v-for="(cr, i) in tree" :key="cr.id" class="ft-ghost" :style="posStyle(ghostPos, i)">
          <span class="ghex"><svg viewBox="0 0 100 100"><polygon class="hl" :points="GHEX" /></svg></span>
          <span class="gn">{{ cr.name }}</span>
          <span class="gr"><b>{{ litCount(cr) }}</b>/{{ cr.limit }}</span>
        </span>
      </div>

      <!-- live crystals -->
      <div class="ft-crystals">
        <button
          v-for="(cr, i) in tree" :key="cr.id"
          type="button" class="ft-crystal"
          :class="{ full: litCount(cr) >= cr.limit, sel: selCrystal === cr.id }"
          :style="posStyle(crystalPos, i)"
          :aria-label="`${cr.name} · ${litCount(cr)} of ${cr.limit} lit`"
          @click="openCrystal(cr.id)"
        >
          <span class="shard" v-html="shardHtml(cr)"></span>
          <span class="nm">{{ cr.name }}</span>
          <span class="ratio"><b>{{ litCount(cr) }}</b>/{{ cr.limit }}</span>
        </button>
      </div>

      <!-- facets — replace the crystals in place -->
      <div class="ft-facets" :hidden="level !== 'face'">
        <div
          v-for="row in viewFaces" :key="row.f.id"
          class="ft-face" :class="faceClass(row.f)"
          tabindex="0" role="button" :aria-pressed="row.f.state === 'lit'"
          @click="onFace(row.f)"
          @keydown.enter.prevent="onFace(row.f)"
          @keydown.space.prevent="onFace(row.f)"
        >
          <span class="fhex" v-html="faceHtml"></span>
          <span class="fl-nm">{{ row.f.name }}</span>
          <template v-if="row.fx.length">
            <span class="fl-pct">{{ row.fx[0].sign }}{{ row.fx[0].pct }}%</span>
            <span class="fl-tag">{{ row.fx[0].phrase }}</span>
          </template>
          <span class="fl-st">{{ faceLabel(row.f) }}</span>
        </div>
      </div>

      <div class="ft-foot"><span class="hint">{{ footHint }}</span></div>
    </section>

    <!-- what this fighter is built out of -->
    <footer class="ft-build">
      <span class="k">{{ t.forge.build }}</span>
      <span class="names">
        <span v-if="!litNames.length" class="ph">{{ t.forge.buildEmpty }}</span>
        <template v-else><span v-for="(n, i) in litNames" :key="i" class="b">{{ n }}</span></template>
      </span>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { getCore } from '@/data/upgradeData.js';
import { facetEffects } from '@/data/facetReadout.js';
import { coreSVG, shardSVG, faceHex, hexPts, radial } from '@/data/upgradeGeometry.js';
import { t } from '@/locales/index.js';

const props = defineProps({
  coreId: { type: String, required: true },
  tree: { type: Array, default: () => [] },
  spent: { type: Number, default: 0 },
  resource: { type: Number, default: 5 },
});
const emit = defineEmits(['toggle']);

// --- core context (the tint the whole panel inherits) -------------------------
const core = computed(() => getCore(props.coreId));
const coreVars = computed(() => ({ '--core': core.value.hue, '--core-sup': core.value.sup }));
const coreGlyph = computed(() => coreSVG(core.value.id, { seed: true }));
const faceHtml = faceHex();
const GHEX = hexPts(50, 50, 42);

// --- drill-down ---------------------------------------------------------------
const STEPS = [
  { id: 'core', label: t.value.forge.stepCore },
  { id: 'crystal', label: t.value.forge.stepCrystal },
  { id: 'face', label: t.value.forge.stepFacet },
];
const level = ref('core');
const levelIdx = computed(() => STEPS.findIndex((s) => s.id === level.value));
const selCrystal = ref(null);
const selCrystalObj = computed(() => props.tree.find((c) => c.id === selCrystal.value) || null);
const viewFaces = computed(() => (selCrystalObj.value ? selCrystalObj.value.faces : [])
  .map((f) => ({ f, fx: facetEffects(f) })));

// A different fighter means a different tree: start at the top, forget the pick.
watch(() => props.coreId, () => { level.value = 'core'; selCrystal.value = null; });

function litCount(cr) { return cr ? cr.faces.filter((f) => f.state === 'lit').length : 0; }
const litNames = computed(() => {
  const out = [];
  props.tree.forEach((cr) => cr.faces.forEach((f) => { if (f.state === 'lit') out.push(f.name); }));
  return out;
});
function shardHtml(cr) { return shardSVG(litCount(cr) / cr.limit, props.coreId + '-' + cr.id); }

const footHint = computed(() =>
  level.value === 'core' ? t.value.forge.hintCore
    : level.value === 'crystal' ? t.value.forge.hintCrystal
      : t.value.forge.hintFacet);

// --- facet state → class + label (same rules as the old screen) ---------------
function faceClass(f) {
  const cr = selCrystalObj.value;
  const atLimit = cr ? litCount(cr) >= cr.limit : false;
  const noPts = props.spent >= props.resource;
  return {
    lit: f.state === 'lit',
    open: f.state === 'open',
    locked: f.state === 'locked',
    blocked: f.state === 'open' && (atLimit || noPts),
    shake: shakeFaceId.value === f.id,
  };
}
function faceLabel(f) {
  if (f.state === 'lit') return t.value.forge.stLit;
  if (f.state === 'locked') return t.value.forge.stLocked;
  const cr = selCrystalObj.value;
  if (cr && litCount(cr) >= cr.limit) return t.value.forge.stLimit;
  if (props.spent >= props.resource) return t.value.forge.stNoPts;
  return t.value.forge.stOpen;
}

// --- toggling — the panel asks, the owner of the tree decides ------------------
const shakeFaceId = ref(null);
function deny(faceId) {
  shakeFaceId.value = null;                       // retrigger on the same face
  nextTick(() => {
    shakeFaceId.value = faceId;
    setTimeout(() => { if (shakeFaceId.value === faceId) shakeFaceId.value = null; }, 320);
  });
}
function onFace(f) {
  const cr = selCrystalObj.value;
  if (!cr) return;
  if (f.state === 'locked') { deny(f.id); return; }
  const wasLit = f.state === 'lit';
  const atLimit = litCount(cr) >= cr.limit;
  const noPts = props.spent >= props.resource;
  if (!wasLit && (atLimit || noPts)) { deny(f.id); return; }
  emit('toggle', { crystalId: cr.id, faceId: f.id });
}

// --- navigation ---------------------------------------------------------------
function goCrystals() { level.value = 'crystal'; }
function goCore() { selCrystal.value = null; level.value = 'core'; }
function openCrystal(id) { selCrystal.value = id; level.value = 'face'; }
function onCoreTap() { if (level.value === 'core') goCrystals(); }
function onRail(step) {
  const i = STEPS.findIndex((s) => s.id === step);
  if (i > levelIdx.value || step === level.value) return;   // visited stops only
  if (step === 'core') goCore(); else if (step === 'crystal') goCrystals();
}
/** Esc walks back up one level; the hall handles Esc at the top. Returns true if used. */
function stepBack() {
  if (level.value === 'face') { goCrystals(); return true; }
  if (level.value === 'crystal') { goCore(); return true; }
  return false;
}
defineExpose({ stepBack });

// --- radial layout, measured against the chamber ------------------------------
const depthRef = ref(null);
const FALLBACK_R = 110;
const ghostPos = ref(radial(props.tree.length, FALLBACK_R));
const crystalPos = ref(radial(props.tree.length, FALLBACK_R));
const spokes = ref({ viewBox: '0 0 600 460', lines: [] });
const px = (n) => (typeof n === 'number' ? n.toFixed(0) : '0') + 'px';
// The template hands this the UNWRAPPED array (Vue unwraps refs in templates),
// so it takes a plain list — not the ref.
function posStyle(list, i) {
  const p = list && list[i];
  return { '--x': px(p ? p.x : 0), '--y': px(p ? p.y : 0) };
}
function computeGeom() {
  const el = depthRef.value;
  if (!el) return;
  const w = el.clientWidth, h = el.clientHeight, n = props.tree.length;
  ghostPos.value = radial(n, Math.min(w * 0.33, h * 0.33, 150));
  crystalPos.value = radial(n, Math.min(w * 0.31, h * 0.31, 150));
  spokes.value = {
    viewBox: `0 0 ${w} ${h}`,
    lines: crystalPos.value.map((p) => ({
      x1: (w / 2).toFixed(0), y1: (h / 2).toFixed(0),
      x2: (w / 2 + p.x).toFixed(0), y2: (h / 2 + p.y).toFixed(0),
    })),
  };
}
let raf = 0;
function onResize() { cancelAnimationFrame(raf); raf = requestAnimationFrame(computeGeom); }
onMounted(() => { nextTick(computeGeom); window.addEventListener('resize', onResize); });
onBeforeUnmount(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); });
watch(() => props.tree.length, () => nextTick(computeGeom));
</script>

<style scoped>
/* Ported from the pre-fight upgrade screen and re-cut for a panel: the chamber,
   the crystals and the facets keep their look and their sizes come down; the
   page furniture around them (background, headline, bottom action bar) is gone.
   Tokens are the hall's (forge.css) — nothing new is invented here. */
.ftree {
  --core-sup: color-mix(in srgb, var(--core) 55%, transparent);
  --core-ink: color-mix(in srgb, var(--core) 62%, var(--ink));
  display: flex; flex-direction: column; min-height: 0; height: 100%;
  font-family: var(--font-mono);
}
.ftree * { box-sizing: border-box; margin: 0; padding: 0; }
.ftree button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer;
  -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent; }

/* ── head: breadcrumb + this fighter's pool ───────────────────────────────── */
.ft-head { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
  padding-bottom: var(--sp-2); border-bottom: 1px solid var(--line); }
.ft-rail { display: flex; align-items: center; gap: var(--sp-1); }
.ft-step { display: inline-flex; align-items: center; gap: var(--sp-2); min-height: 44px; padding: 0 var(--sp-2);
  font-size: var(--t-micro); letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
  transition: color .2s; }
.ft-step .dot { width: 5px; height: 5px; border: 1px solid currentColor; transform: rotate(45deg); }
.ft-step[disabled] { cursor: default; }
.ft-step.on { color: var(--ink-off); }
.ft-step.on:hover { color: var(--ink); }
.ft-step.here { color: var(--ink); }
.ft-step.here .dot { background: var(--core); border-color: var(--core); }
.ft-step:focus-visible { outline: 1px solid var(--ink-off); outline-offset: 2px; }
.ft-pool { font-size: var(--t-xs); letter-spacing: var(--ls-title); color: var(--ink-off); font-variant-numeric: tabular-nums; }
.ft-pool b { color: var(--core-ink); font-weight: 700; }

/* ── chamber ──────────────────────────────────────────────────────────────── */
.ft-depth {
  /* A fixed-ish height, not "fill the panel": the chamber is a compact stage and
     stretching it to a tall panel leaves the crystals swimming in a void. */
  position: relative; flex: 0 1 auto; height: clamp(300px, 46vh, 460px); margin-top: var(--sp-2);
  isolation: isolate; overflow: hidden;
  border: 1px solid var(--line);
  background:
    radial-gradient(60% 50% at 50% 50%, color-mix(in srgb, var(--core) 6%, transparent), transparent 70%),
    linear-gradient(180deg, var(--fill-1), transparent 70%);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%);
}
.ft-spokes { position: absolute; inset: 0; z-index: 1; opacity: 0; transition: opacity .5s var(--e-weight); }
.ftree[data-level="crystal"] .ft-spokes { opacity: 1; }
.ft-spokes line { stroke: var(--core-sup); stroke-width: 1; stroke-dasharray: 2 5; opacity: .7; }

/* the core — the panel's ONE glow */
.ft-core {
  position: absolute; top: 50%; left: 50%; width: 140px; height: 140px;
  transform: translate(-50%, -50%); display: grid; place-items: center; z-index: 5;
  transition: transform .65s var(--e-settle), opacity .45s var(--e-weight);
}
.ft-core .glyph { width: 100%; height: 100%; display: grid; place-items: center; position: relative; z-index: 3; }
.ft-core :deep(svg) { width: 100%; height: 100%; overflow: visible; }
.ft-core :deep(.hex-line) { stroke: color-mix(in srgb, var(--core) 22%, var(--ink)); fill: none; stroke-width: 2;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--core) 55%, transparent)); }
.ft-core :deep(.facet) { stroke: color-mix(in srgb, var(--core) 30%, var(--ink)); fill: none; stroke-width: 1.4; }
.ft-core :deep(.seed) { fill: var(--ink); filter: drop-shadow(0 0 8px color-mix(in srgb, var(--core) 90%, transparent)); }
.ft-core .glow {
  position: absolute; inset: -30%; border-radius: var(--r-round); z-index: 1; pointer-events: none;
  background:
    radial-gradient(circle at 50% 50%,
      color-mix(in srgb, var(--core) 62%, transparent) 0%,
      color-mix(in srgb, var(--core) 24%, transparent) 28%,
      color-mix(in srgb, var(--core) 10%, transparent) 50%, transparent 66%),
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--core-sup) 28%, transparent) 0%, transparent 38%);
  /* No mix-blend-mode here (the upgrade screen could afford it — it had no live
     canvas under it). Over a running 3D hall, screen-blending a blurred layer
     across 60% of the viewport is recomposited every frame; on a dark backdrop
     it looks the same without it. */
  filter: blur(18px);
  /* Дыхание ядра дерева — атмосфера (Правка 1.2 §3), не ритм ядра: оно не
     сообщает характер, а просто оживляет экран. В токены не выносится. */
  animation: ftBreathe 4.6s ease-in-out infinite;
}
.ft-core:focus-visible { outline: 1px solid var(--core-sup); outline-offset: 4px; }
@keyframes ftBreathe { 0%,100% { opacity:.72; transform: scale(.97); } 50% { opacity:1; transform: scale(1.05); } }
.ftree[data-level="crystal"] .ft-core { transform: translate(-50%, -50%) scale(.5); cursor: default; }
.ftree[data-level="face"] .ft-core { transform: translate(-50%, calc(-50% - 74px)) scale(.2); opacity: .4; cursor: default; }
.ftree[data-level="crystal"] .ft-core .glow { opacity: .55; }
.ftree[data-level="face"] .ft-core .glow { opacity: .28; animation: none; }

/* ghosts — depth scaffold on CORE level */
.ft-ghosts { position: absolute; inset: 0; z-index: 2; pointer-events: none; transition: opacity .45s var(--e-weight); }
.ft-ghost { position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0));
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-1); text-align: center;
  width: 66px; opacity: .78; }
.ft-ghost .ghex { width: 34px; height: 34px; }
.ft-ghost .ghex svg { width: 100%; height: 100%; overflow: visible; }
.ft-ghost .ghex .hl { stroke: var(--core-sup); fill: none; stroke-width: 1; stroke-dasharray: 3 4; }
.ft-ghost .gn { font-size: var(--t-micro); font-weight: 600; letter-spacing: var(--ls-title); text-transform: uppercase;
  color: var(--ink-off); line-height: 1; }
.ft-ghost .gr { font-size: var(--t-micro); letter-spacing: var(--ls-title); color: var(--ink-off); line-height: 1; }
.ft-ghost .gr b { color: var(--core-ink); font-weight: 600; }
.ftree[data-level="crystal"] .ft-ghosts, .ftree[data-level="face"] .ft-ghosts { opacity: 0; }

/* crystals */
.ft-crystals { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.ft-crystal { position: absolute; top: 50%; left: 50%; width: 84px;
  transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(.4);
  opacity: 0; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-1); text-align: center;
  transition: transform .55s var(--e-settle), opacity .4s var(--e-weight); }
.ftree[data-level="crystal"] .ft-crystal, .ftree[data-level="face"] .ft-crystal.sel {
  opacity: 1; pointer-events: auto;
  transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(1); }
.ft-crystal .shard { width: 54px; height: 54px; position: relative; transition: transform .3s var(--e-weight); }
.ft-crystal:hover .shard { transform: translateY(-2px); }
.ft-crystal .shard :deep(svg) { width: 100%; height: 100%; overflow: visible; }
.ft-crystal .shard :deep(.fill) { fill: var(--carbon); }
.ft-crystal .shard :deep(.lit) { fill: color-mix(in srgb, var(--core) 55%, transparent); transition: fill .25s var(--e-weight); }
.ft-crystal .shard :deep(.hex-line) { stroke: color-mix(in srgb, var(--core) 50%, var(--ink-off));
  fill: none; stroke-width: 1.6; transition: stroke .25s var(--e-weight); }
.ft-crystal:hover .shard :deep(.hex-line) { stroke: var(--ink); }
.ft-crystal:focus-visible { outline: 1px solid var(--core-sup); outline-offset: 3px; }
.ft-crystal .nm { font-size: var(--t-micro); font-weight: 600; letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink); }
.ft-crystal .ratio { font-size: var(--t-micro); color: var(--ink-off); letter-spacing: var(--ls-title); }
.ft-crystal .ratio b { color: var(--core-ink); font-weight: 700; }
.ft-crystal.full .ratio b { color: var(--ink); }

/* facets */
.ft-facets[hidden] { display: none; }
.ft-facets { position: absolute; left: 0; right: 0; top: 54px; bottom: 38px; padding: var(--sp-1) var(--sp-3); z-index: 6;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: var(--sp-2);
  overflow-y: auto; scrollbar-width: thin; align-content: start; }
.ft-facets::-webkit-scrollbar { width: 4px; }
.ft-facets::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: var(--r-none); }
.ft-face { position: relative; border: 1px solid var(--line); background: var(--fill-1);
  padding: var(--sp-2) var(--sp-1) var(--sp-2); display: flex; flex-direction: column; align-items: center; gap: var(--sp-2);
  cursor: pointer; min-height: 44px;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%);
  transition: border-color .2s, background .2s, transform .12s;
  -webkit-tap-highlight-color: transparent; }
.ft-face:active { transform: scale(.96); }
.ft-face:focus-visible { outline: 1px solid var(--core-sup); outline-offset: 2px; }
.ft-face .fhex { width: 26px; height: 26px; color: var(--ink-off); transition: color .25s var(--e-weight); }
.ft-face .fhex :deep(svg) { width: 100%; height: 100%; overflow: visible; }
.ft-face .fhex :deep(.ln) { stroke: currentColor; fill: none; stroke-width: 1.5; }
.ft-face .fhex :deep(.fl) { fill: transparent; }
.ft-face .fl-nm { font-size: var(--t-micro); font-weight: 600; letter-spacing: var(--ls-title); text-transform: uppercase;
  color: var(--ink); text-align: center; }
.ft-face .fl-pct { font-size: var(--t-sm); font-weight: 700; line-height: 1; color: var(--core-ink); }
.ft-face .fl-tag { font-size: var(--t-micro); letter-spacing: var(--ls-tight); text-transform: uppercase; color: var(--ink-off);
  line-height: 1.15; text-align: center; }
.ft-face .fl-st { font-size: var(--t-micro); letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off); }
.ft-face.lit { border-color: var(--core-sup); background: color-mix(in srgb, var(--core) 10%, transparent); }
.ft-face.lit .fhex { color: var(--core); }
.ft-face.lit .fhex :deep(.fl) { fill: var(--core); }
.ft-face.lit .fl-pct, .ft-face.lit .fl-tag, .ft-face.lit .fl-st { color: var(--core-ink); }
.ft-face.lit .fl-pct { color: var(--core); }
.ft-face.open:hover { border-color: var(--line-strong); background: var(--fill-2); }
.ft-face.locked { opacity: .4; cursor: not-allowed; border-style: dashed; }
.ft-face.blocked { cursor: not-allowed; }
@keyframes ftDeny { 0%,100% { transform: translateX(0);} 20% { transform: translateX(-5px);} 40% { transform: translateX(5px);} 60% { transform: translateX(-3px);} 80% { transform: translateX(3px);} }
.ft-face.shake { animation: ftDeny .32s; }

/* foot hint */
.ft-foot { position: absolute; left: 0; right: 0; bottom: 0; z-index: 7;
  display: flex; align-items: center; justify-content: center; padding: var(--sp-2) var(--sp-3);
  font-size: var(--t-micro); letter-spacing: var(--ls-wide); text-transform: uppercase; color: var(--ink-off);
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, transparent 0%,
    color-mix(in srgb, var(--void) 82%, transparent) 60%,
    color-mix(in srgb, var(--void) 96%, transparent) 100%);
  pointer-events: none; }

/* build strip */
.ft-build { display: flex; align-items: baseline; gap: var(--sp-3); padding-top: var(--sp-3); margin-top: var(--sp-2);
  border-top: 1px solid var(--line); font-size: var(--t-micro); text-transform: uppercase; }
.ft-build .k { letter-spacing: var(--ls-wide); color: var(--ink-off); flex: none; }
.ft-build .names { display: flex; flex-wrap: wrap; gap: var(--sp-1) var(--sp-3); letter-spacing: var(--ls-title); }
.ft-build .names .b { color: var(--core-ink); font-weight: 700; white-space: nowrap; }
.ft-build .names .ph { color: var(--ink-off); }

@media (prefers-reduced-motion: reduce) {
  .ft-core, .ft-crystal, .ft-spokes, .ft-ghosts { transition: none; }
  .ft-core .glow { animation: none; opacity: .85; }
  .ft-face.shake { animation: none; }
}
@media (max-width: 1023px) {
  .ft-core { width: 108px; height: 108px; }
  .ft-facets { grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); top: 48px; }
  .ft-step .lb { display: none; }
  .ft-step { padding: 0 var(--sp-3); }
}
</style>
