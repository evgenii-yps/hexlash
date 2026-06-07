<!-- /play/upgrade — Upgrade screen (Заход 2). 1:1 port of the Claude Design
     handoff (upgrade_handoff/) per its README contract:
       · CORES/CRYSTALS/RESOURCE + working tree (deep copy) → prefight store
       · hexPts/coreSVG/shardSVG/faceHex/radial → src/data/upgradeGeometry.js (as-is)
       · setLevel/openCrystal/toggleFace/goCore/goCrystals → methods below
       · data-level → reactive `level` (bound :data-level, CSS kept verbatim)
       · spentTotal/freePts → computed
     Drill-down ядро → кристалл → грань. Double limiter: shared core pool
     (RESOURCE) + per-crystal limit. The screen tints to the chosen core's hue
     via --core (from prefight.selectedCoreId); the only glow is the centre core.
     The demo core-switcher is NOT ported — the core is already chosen on /play.
     «В бой» → /play/arena (the chosen core reaches the arena fighter). -->
<template>
  <div class="scene" :style="coreVars">
    <div class="screen" :style="coreVars" :data-level="level" data-screen-label="Прокачка">

        <!-- назад + крошки + имя ядра -->
        <div class="s-top">
          <button class="back" aria-label="Назад" @click="onBack">
            <svg viewBox="0 0 24 24"><polyline points="15 5 8 12 15 19" /></svg>
          </button>
          <div class="crumb">
            <span :class="crumbCore">Ядро</span><span class="sep">·</span>
            <span :class="crumbCrystal">Кристалл</span><span class="sep">·</span>
            <span :class="crumbFace">Грань</span>
          </div>
          <div class="core-tag">
            <span class="nm">{{ core.name }}</span>
            <span class="ix">ЯДРО {{ core.ix }}</span>
          </div>
        </div>

        <!-- сцена глубины -->
        <div class="stage">
          <svg class="spokes" ref="spokesRef" preserveAspectRatio="none" :viewBox="spokes.viewBox">
            <line v-for="(ln, i) in spokes.lines" :key="i" :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2" />
          </svg>

          <!-- ЯДРО — единственное свечение -->
          <div
            class="core-node"
            role="button"
            tabindex="0"
            aria-label="Раскрыть кристаллы ядра"
            @click="onCoreClick"
            @keydown.enter.prevent="onCoreClick"
            @keydown.space.prevent="onCoreClick"
          >
            <div class="glow" />
            <div class="ring" />
            <div class="glyph" v-html="coreGlyph" />
          </div>
          <div class="core-hint">тап по ядру</div>

          <!-- КРИСТАЛЛЫ — по радиусу из центра -->
          <div class="crystals">
            <button
              v-for="(cr, i) in tree"
              :key="cr.id"
              class="crystal"
              :class="{ sel: selCrystal === cr.id }"
              :style="{ '--x': px(positions[i].x), '--y': px(positions[i].y) }"
              @click="openCrystal(cr.id)"
            >
              <span class="shard" v-html="shardHtml(cr)" />
              <span class="nm">{{ cr.name }}</span>
              <span class="ratio"><b>{{ litCount(cr) }}</b>/{{ cr.limit }}</span>
            </button>
          </div>
        </div>

        <!-- низ: общий пул очков ядра + «В БОЙ» -->
        <div class="s-bottom">
          <div class="pool">
            <div class="lbl">
              <span class="k">Очки ядра · общий пул</span>
              <span class="v"><b class="pool-free">{{ freePts }}</b> / <span class="pool-total">{{ RESOURCE }}</span> свободно</span>
            </div>
            <div class="pips">
              <span v-for="i in RESOURCE" :key="i" class="pip" :class="{ on: i <= spentTotal }" />
            </div>
          </div>
          <button class="tobattle" @click="toBattle">В бой <span class="arr">→</span></button>
        </div>

        <!-- ПАНЕЛЬ ГРАНЕЙ -->
        <div class="facepanel">
          <div class="fp-head">
            <div class="ttl"><small>Кристалл</small><span class="cr-name">{{ selCrystalObj ? selCrystalObj.name : '—' }}</span></div>
          </div>
          <div class="meter">
            <div class="cell">
              <span class="k">Зажжено · лимит кристалла</span>
              <span class="limit" :class="{ max: atLimit }">{{ selLit }}<small>/{{ selLimit }}</small></span>
            </div>
            <div class="cell">
              <span class="k">Очки ядра</span>
              <div class="pips">
                <span v-for="i in RESOURCE" :key="i" class="pip" :class="{ on: i <= spentTotal }" />
              </div>
              <span class="free" :class="{ none: freePts <= 0 }">{{ freePts }}<small> своб.</small></span>
            </div>
          </div>
          <div class="faces">
            <div
              v-for="f in selFaces"
              :key="f.id"
              class="face"
              :class="faceClass(f)"
              @click="toggleFace(f)"
            >
              <span class="fhex" v-html="faceHtml" />
              <span class="fl-nm">{{ f.name }}</span>
              <span class="fl-st">{{ faceLabel(f) }}</span>
            </div>
          </div>
          <div class="fp-foot">
            <span class="hint">зажёг одно — погаси другое</span>
            <span class="stub">эффекты — заглушки</span>
          </div>
        </div>

        <div class="wm">HEXLASH · контент — заглушки</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { coreSVG, shardSVG, faceHex, radial } from '@/data/upgradeGeometry.js';
import { CRYSTALS, RESOURCE, getCore } from '@/data/upgradeData.js';

const store = useStore();
const router = useRouter();

// --- Core context (id comes from the selection screen via the store) ---------
// One id contract end-to-end — the picked id (natisk / nalet / skala / zasada)
// looks up CORES directly; no select→handoff bridge anymore.
const coreId = computed(() => getCore(store.getters['prefight/selectedCoreId']).id);
const core = computed(() => getCore(coreId.value));
const coreVars = computed(() => ({ '--core': core.value.hue, '--core-sup': core.value.sup }));
const coreGlyph = computed(() => coreSVG(coreId.value, { seed: true }));
const faceHtml = faceHex(); // constant — same node markup for every face

// --- Working tree (deep copy of CRYSTALS for this core) lives in the store ----
store.dispatch('prefight/initUpgradeTree', CRYSTALS[coreId.value]);
const tree = computed(() => store.getters['prefight/upgradeTree'] || []);
const positions = computed(() => radial(tree.value.length, 124));

// --- Drill-down level + selected crystal -------------------------------------
const level = ref('core'); // 'core' | 'crystal' | 'face'
const selCrystal = ref(null);
const selCrystalObj = computed(() => tree.value.find((c) => c.id === selCrystal.value) || null);
const selFaces = computed(() => (selCrystalObj.value ? selCrystalObj.value.faces : []));
const selLimit = computed(() => (selCrystalObj.value ? selCrystalObj.value.limit : 0));
const selLit = computed(() => litCount(selCrystalObj.value));
const atLimit = computed(() => selLit.value >= selLimit.value);

// --- Resource (double limiter: shared pool + per-crystal limit) ---------------
function litCount(cr) {
  return cr ? cr.faces.filter((f) => f.state === 'lit').length : 0;
}
const spentTotal = computed(() => tree.value.reduce((n, cr) => n + litCount(cr), 0));
const freePts = computed(() => RESOURCE - spentTotal.value);

// --- SVG helpers (per-crystal shard uid = coreId-crystalId → unique clipPath) -
function shardHtml(cr) {
  return shardSVG(litCount(cr) / cr.limit, coreId.value + '-' + cr.id);
}
const px = (n) => n.toFixed(0) + 'px';

// --- Crumbs ------------------------------------------------------------------
const crumbCore = computed(() => 'lvl-core ' + (level.value === 'core' ? 'here' : 'on'));
const crumbCrystal = computed(
  () => 'lvl-crystal ' + (level.value === 'crystal' ? 'here' : level.value === 'face' ? 'on' : ''),
);
const crumbFace = computed(() => 'lvl-face ' + (level.value === 'face' ? 'here' : ''));

// --- Face state → class + label ----------------------------------------------
function faceClass(f) {
  const blocked = f.state === 'open' && (atLimit.value || spentTotal.value >= RESOURCE);
  return {
    lit: f.state === 'lit',
    open: f.state === 'open',
    locked: f.state === 'locked',
    blocked,
    shake: shakeFaceId.value === f.id,
  };
}
function faceLabel(f) {
  if (f.state === 'lit') return 'зажжена';
  if (f.state === 'locked') return 'недоступна';
  if (atLimit.value) return 'лимит';
  if (spentTotal.value >= RESOURCE) return 'нет очков';
  return 'доступна';
}

// --- Toggle a face with the double limiter -----------------------------------
const shakeFaceId = ref(null);
function deny(faceId) {
  // retrigger the shake even on the same face
  shakeFaceId.value = null;
  nextTick(() => {
    shakeFaceId.value = faceId;
    setTimeout(() => {
      if (shakeFaceId.value === faceId) shakeFaceId.value = null;
    }, 300);
  });
}
function setFace(crystalId, faceId, faceState) {
  store.dispatch('prefight/setFaceState', { crystalId, faceId, faceState });
}
function toggleFace(f) {
  const cr = selCrystalObj.value;
  if (!cr) return;
  if (f.state === 'locked') { deny(f.id); return; }
  if (f.state === 'lit') { setFace(cr.id, f.id, 'open'); return; } // give the point back
  if (litCount(cr) >= cr.limit || spentTotal.value >= RESOURCE) { deny(f.id); return; }
  setFace(cr.id, f.id, 'lit');
}

// --- Navigation --------------------------------------------------------------
function onCoreClick() {
  if (level.value === 'core') level.value = 'crystal';
}
function openCrystal(id) {
  selCrystal.value = id;
  level.value = 'face';
}
function onBack() {
  if (level.value === 'face') level.value = 'crystal';
  else if (level.value === 'crystal') { selCrystal.value = null; level.value = 'core'; }
}
function toBattle() {
  router.push({ name: 'V2Arena' });
}

// --- Spokes (ядро → кристалл) — measured centre so lines hit the crystals -----
const spokesRef = ref(null);
const spokes = ref({ viewBox: '0 0 386 674', lines: [] });
function computeSpokes() {
  const el = spokesRef.value;
  const w = (el && el.clientWidth) || 386;
  const h = (el && el.clientHeight) || 674;
  const pos = positions.value;
  spokes.value = {
    viewBox: `0 0 ${w} ${h}`,
    lines: pos.map((p) => ({
      x1: (w / 2).toFixed(0),
      y1: (h / 2).toFixed(0),
      x2: (w / 2 + p.x).toFixed(0),
      y2: (h / 2 + p.y).toFixed(0),
    })),
  };
}

// --- Spokes follow the live layout (full-viewport screen, no letterbox fit) ---
function onResize() {
  computeSpokes();
}

onMounted(() => {
  nextTick(computeSpokes);
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});
</script>

<style>
/* Fonts are global resources — Saira Condensed (display) + JetBrains Mono. */
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
</style>

<style scoped>
/* ============================================================
   HEXLASH — ЭКРАН ПРОКАЧКИ · стили (порт upgrade_handoff/styles.css)
   Дисциплина: тёмный фон · один акцент = --core · экран темится в --core ·
   одно свечение = ядро в центре (кристаллы/грани плоские) · минимализм.
   Токены вынесены из :root на .scene (корень компонента) — кастом-проперти
   наследуются вглубь. SVG из v-html таргетится через :deep().
   ============================================================ */
.scene * { box-sizing: border-box; margin: 0; padding: 0; }
.scene button {
  font: inherit; color: inherit; background: none; border: 0; cursor: pointer;
  -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent;
}

.scene {
  /* ground — нейтральные, чуть холодные чёрные */
  --bg-void: #08080a;
  --bg-0: #0c0c0f;
  --bg-1: #111114;
  --bg-2: #16161b;
  --bg-3: #1d1d23;
  /* ink — приглушённые офф-уайты */
  --ink-0: #ededf1;
  --ink-1: #9a9aa3;
  --ink-2: #5d5d66;
  --ink-3: #393940;
  /* хэйрлайны */
  --line: rgba(255, 255, 255, .07);
  --line-2: rgba(255, 255, 255, .13);

  --font-disp: 'Saira Condensed', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --ease: cubic-bezier(.4, .05, .1, 1);
  --ease-out: cubic-bezier(.16, 1, .3, 1);


  /* контекст-ядро по умолчанию (свопается :style на .scene и .screen) */
  --core: #2ED6B0;
  --core-sup: #5DD6E6;

  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(120% 70% at 50% 6%, color-mix(in srgb, var(--core, #2ED6B0) 7%, transparent), transparent 60%),
    radial-gradient(120% 60% at 50% 108%, color-mix(in srgb, var(--core, #2ED6B0) 9%, transparent), transparent 64%),
    var(--bg-void);
  color: var(--ink-0);
  font-family: var(--font-disp);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  transition: background .6s var(--ease);
  overflow: hidden;
}
/* тонкая дисциплина-сетка + виньетка по всей сцене */
.scene::before {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(120% 80% at 50% 36%, #000, transparent 72%);
  mask-image: radial-gradient(120% 80% at 50% 36%, #000, transparent 72%);
  opacity: .4;
}

/* ---------- экран — полноэкранный холст (без рамки-телефона / letterbox),
   темится в --core. Занимает весь вьюпорт на десктопе и мобиле. ---------- */
.screen {
  position: absolute; inset: 0; overflow: hidden;
  isolation: isolate;
  --core: #2ED6B0;
  --core-sup: #5DD6E6;
  --core-dim: color-mix(in srgb, var(--core) 55%, transparent);
  --core-faint: color-mix(in srgb, var(--core) 14%, transparent);
  --core-ghost: color-mix(in srgb, var(--core) 7%, transparent);
  --core-ink: color-mix(in srgb, var(--core) 62%, #fff);
  background:
    radial-gradient(72% 42% at 50% 30%, var(--core-faint), transparent 66%),
    radial-gradient(120% 50% at 50% 102%, var(--core-ghost), transparent 60%),
    radial-gradient(130% 78% at 50% 14%, #111118, #08080b 66%);
  transition: background .6s var(--ease);
}
.screen::after {
  content: ""; position: absolute; inset: 13px; border-radius: 0; z-index: 29; pointer-events: none;
  background:
    linear-gradient(var(--core-dim), var(--core-dim)) left 0 top 0/16px 1px no-repeat,
    linear-gradient(var(--core-dim), var(--core-dim)) left 0 top 0/1px 16px no-repeat,
    linear-gradient(var(--core-dim), var(--core-dim)) right 0 top 0/16px 1px no-repeat,
    linear-gradient(var(--core-dim), var(--core-dim)) right 0 top 0/1px 16px no-repeat,
    linear-gradient(var(--core-dim), var(--core-dim)) left 0 bottom 0/16px 1px no-repeat,
    linear-gradient(var(--core-dim), var(--core-dim)) left 0 bottom 0/1px 16px no-repeat,
    linear-gradient(var(--core-dim), var(--core-dim)) right 0 bottom 0/16px 1px no-repeat,
    linear-gradient(var(--core-dim), var(--core-dim)) right 0 bottom 0/1px 16px no-repeat;
  opacity: .5;
}

/* ---------- верх: назад + крошки + имя ядра ---------- */
.s-top {
  position: absolute; top: 58px; left: 0; right: 0; z-index: 30; padding: 0 22px;
  display: flex; align-items: center; gap: 14px; height: 44px;
}
.back {
  width: 38px; height: 38px; flex: none; border: 1px solid var(--line); border-radius: 10px; background: rgba(255, 255, 255, .03);
  color: var(--ink-1); display: grid; place-items: center; cursor: pointer;
  opacity: 0; pointer-events: none; transform: translateX(-4px);
  transition: opacity .3s, transform .3s, border-color .2s, color .2s;
}
.back svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.back:hover { border-color: var(--core-dim); color: var(--ink-0); }
.screen[data-level="crystal"] .back,
.screen[data-level="face"] .back { opacity: 1; pointer-events: auto; transform: none; }

.crumb { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; }
.crumb span { color: var(--ink-3); transition: color .3s; }
.crumb span.on { color: var(--ink-0); }
.crumb span.here { color: var(--core-ink); }
.crumb .sep { color: var(--ink-3) !important; }

.core-tag { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 1px; text-align: right; }
.core-tag .nm { font-size: 17px; font-weight: 700; text-transform: uppercase; letter-spacing: .01em; line-height: 1; color: var(--core-ink); }
.core-tag .ix { font-family: var(--font-mono); font-size: 9px; letter-spacing: .22em; color: var(--ink-2); }

/* ---------- сцена глубины ---------- */
.stage { position: absolute; left: 0; right: 0; top: 108px; bottom: 150px; z-index: 10; }

.spokes { position: absolute; inset: 0; z-index: 11; pointer-events: none; opacity: 0; transition: opacity .5s; }
.screen[data-level="crystal"] .spokes { opacity: 1; }
.spokes line { stroke: var(--core-dim); stroke-width: 1; stroke-dasharray: 2 5; opacity: .6; }

/* ---------- ЯДРО — единственный светящийся объект ---------- */
.core-node {
  position: absolute; top: 50%; left: 50%; width: 184px; height: 184px;
  transform: translate(-50%, -50%);
  display: grid; place-items: center; color: var(--ink-1); cursor: pointer; z-index: 20;
  transition: transform .7s var(--ease-out), filter .6s var(--ease), opacity .5s var(--ease);
  will-change: transform;
}
.core-node .glyph { width: 100%; height: 100%; display: grid; place-items: center; }
.core-node :deep(svg) { width: 100%; height: 100%; overflow: visible; position: relative; z-index: 2; }
.core-node :deep(.hex-line) { stroke: var(--core); fill: none; stroke-width: 1.6; }
.core-node :deep(.facet) { stroke: var(--core-dim); fill: none; stroke-width: 1.1; }
.core-node :deep(.seed) { fill: var(--core); }
.core-node .glow {
  position: absolute; inset: -58%; border-radius: 50%; z-index: 1; pointer-events: none;
  background:
    radial-gradient(circle at 50% 50%,
      color-mix(in srgb, var(--core) 52%, transparent) 0%,
      color-mix(in srgb, var(--core) 20%, transparent) 30%,
      transparent 62%),
    radial-gradient(circle at 38% 66%,
      color-mix(in srgb, var(--core-sup) 38%, transparent) 0%, transparent 50%);
  filter: blur(16px);
  animation: breathe 4.6s ease-in-out infinite;
}
.core-node .ring {
  position: absolute; inset: -6%; border: 1px solid var(--core-dim); border-radius: 50%; z-index: 1;
  opacity: 0; animation: ring 4.6s ease-out infinite;
}
@keyframes breathe { 0%, 100% { opacity: .72; transform: scale(.97); } 50% { opacity: 1; transform: scale(1.05); } }
@keyframes ring { 0% { transform: scale(.72); opacity: .45; } 70%, 100% { transform: scale(1.3); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .core-node .glow { animation: none; opacity: .85; }
  .core-node .ring { display: none; }
}
.core-node:hover .glyph { filter: brightness(1.08); }

.core-hint {
  position: absolute; left: 0; right: 0; bottom: 8%; text-align: center; z-index: 20;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .26em; text-transform: uppercase;
  color: var(--ink-2); animation: hintpulse 2.4s ease-in-out infinite; transition: opacity .4s;
}
@keyframes hintpulse { 0%, 100% { opacity: .35; } 50% { opacity: .85; } }

.screen[data-level="core"] .core-node { transform: translate(-50%, -50%) scale(1); }
.screen[data-level="crystal"] .core-node { transform: translate(-50%, -50%) scale(.52); }
.screen[data-level="crystal"] .core-node .glow { opacity: .66; }
.screen[data-level="face"] .core-node { transform: translate(-50%, -180px) scale(.3); filter: blur(1px); opacity: .32; }
.screen[data-level="crystal"] .core-hint,
.screen[data-level="face"] .core-hint { opacity: 0; pointer-events: none; animation: none; }
.screen[data-level="crystal"] .core-node .ring,
.screen[data-level="face"] .core-node .ring { display: none; }

/* ---------- КРИСТАЛЛЫ — по радиусу, без своего свечения ---------- */
.crystals { position: absolute; inset: 0; z-index: 15; pointer-events: none; }
.crystal {
  position: absolute; top: 50%; left: 50%; width: 104px;
  transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(.4);
  opacity: 0; pointer-events: none; cursor: pointer; text-align: center;
  transition: transform .55s var(--ease-out), opacity .4s var(--ease);
  -webkit-tap-highlight-color: transparent;
}
.screen[data-level="crystal"] .crystal {
  opacity: 1; pointer-events: auto;
  transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(1);
}
.screen[data-level="crystal"] .crystal:nth-child(1) { transition-delay: .04s; }
.screen[data-level="crystal"] .crystal:nth-child(2) { transition-delay: .09s; }
.screen[data-level="crystal"] .crystal:nth-child(3) { transition-delay: .14s; }
.screen[data-level="crystal"] .crystal:nth-child(4) { transition-delay: .19s; }
.crystal .shard { width: 78px; height: 78px; margin: 0 auto; position: relative; color: var(--ink-1); transition: color .3s, transform .3s var(--ease); }
.crystal:hover .shard { color: var(--ink-0); transform: translateY(-3px); }
.crystal .shard :deep(svg) { width: 100%; height: 100%; overflow: visible; }
.crystal .shard :deep(.fill) { fill: var(--bg-2); }
.crystal .shard :deep(.lit) { fill: var(--core-dim); }
.crystal .shard :deep(.hex-line) { stroke: color-mix(in srgb, var(--core) 30%, currentColor); fill: none; stroke-width: 1.4; }
.crystal .nm { font-family: var(--font-mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-1); margin-top: 9px; }
.crystal .ratio { font-family: var(--font-mono); font-size: 10px; color: var(--ink-2); margin-top: 3px; }
.crystal .ratio b { color: var(--core-ink); font-weight: 700; }
.screen[data-level="face"] .crystal { opacity: 0; pointer-events: none; transform: translate(-50%, -50%) scale(.3); }
.screen[data-level="face"] .crystal.sel { opacity: 1; transform: translate(-50%, -50%) translateY(-176px) scale(.8); }

/* ---------- общий пул очков ядра + «В БОЙ» ---------- */
.s-bottom {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 22; padding: 0 22px 22px;
  display: flex; flex-direction: column; gap: 13px; transition: opacity .4s, transform .45s var(--ease-out);
}
.screen[data-level="face"] .s-bottom { opacity: 0; transform: translateY(40px); pointer-events: none; }
.pool {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  border: 1px solid var(--line); border-radius: 11px; padding: 11px 15px; background: rgba(255, 255, 255, .02);
}
.pool .lbl { display: flex; flex-direction: column; gap: 3px; }
.pool .lbl .k { font-family: var(--font-mono); font-size: 9px; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-2); }
.pool .lbl .v { font-family: var(--font-disp); font-size: 15px; font-weight: 600; color: var(--ink-0); text-transform: uppercase; line-height: 1; }
.pool .lbl .v b { color: var(--core-ink); }
.pool .pips { display: flex; gap: 6px; }
.pool .pip { width: 16px; height: 9px; border-radius: 2px; border: 1px solid var(--line-2); background: transparent; transition: .25s; }
.pool .pip.on { background: var(--core); border-color: var(--core); }

.tobattle {
  width: 100%; border: 0; border-radius: 13px; cursor: pointer;
  background: var(--core); color: #0a0a0c;
  font-family: var(--font-disp); font-weight: 700; font-size: 23px; letter-spacing: .06em; text-transform: uppercase;
  padding: 17px 20px; display: flex; align-items: center; justify-content: center; gap: 14px;
  transition: filter .2s, transform .12s; position: relative; overflow: hidden;
}
.tobattle::before { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255, 255, 255, .18), transparent 42%); }
.tobattle .arr { font-family: var(--font-mono); font-weight: 700; font-size: 18px; position: relative; }
.tobattle:hover { filter: brightness(1.07); }
.tobattle:active { transform: scale(.985); }

/* ---------- панель граней ---------- */
.facepanel {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 24;
  background: linear-gradient(180deg, rgba(8, 8, 11, 0), #070709 20%);
  padding: 26px 22px calc(24px + env(safe-area-inset-bottom, 0px));
  transform: translateY(101%); transition: transform .55s var(--ease-out);
  border-top: 1px solid var(--line); border-radius: 30px 30px 38px 38px;
  max-height: 68%; display: flex; flex-direction: column;
}
.screen[data-level="face"] .facepanel { transform: translateY(0); }
.fp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
.fp-head .ttl { font-size: 25px; font-weight: 700; text-transform: uppercase; line-height: 1; }
.fp-head .ttl small { display: block; font-family: var(--font-mono); font-size: 9px; font-weight: 500; letter-spacing: .2em; color: var(--ink-2); margin-bottom: 3px; }

.meter { display: flex; align-items: stretch; gap: 12px; margin: 16px 0 16px; }
.meter .cell { flex: 1; border: 1px solid var(--line); border-radius: 10px; padding: 11px 13px; background: rgba(255, 255, 255, .02); display: flex; flex-direction: column; gap: 8px; }
.meter .k { font-family: var(--font-mono); font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-2); }
.meter .limit { font-family: var(--font-mono); font-weight: 700; font-size: 25px; color: var(--ink-0); line-height: 1; }
.meter .limit small { font-size: 14px; color: var(--ink-2); font-weight: 500; }
.meter .limit.max { color: var(--core-ink); }
.meter .pips { display: flex; gap: 5px; align-items: center; height: 25px; }
.meter .pip { width: 13px; height: 13px; border-radius: 3px; border: 1px solid var(--line-2); background: transparent; transition: .25s; }
.meter .pip.on { background: var(--core); border-color: var(--core); }
.meter .free { font-family: var(--font-mono); font-weight: 700; font-size: 25px; color: var(--ink-0); line-height: 1; }
.meter .free.none { color: var(--core-ink); }
.meter .free small { font-size: 11px; color: var(--ink-2); font-weight: 500; }

.faces { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; overflow-y: auto; padding: 2px; scrollbar-width: thin; }
.faces::-webkit-scrollbar { width: 4px; }
.faces::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 4px; }
.face {
  position: relative; border: 1px solid var(--line); border-radius: 11px; background: var(--bg-1);
  padding: 14px 8px 11px; display: flex; flex-direction: column; align-items: center; gap: 9px;
  cursor: pointer; transition: border-color .25s, background .25s, transform .12s;
  -webkit-tap-highlight-color: transparent;
}
.face:active { transform: scale(.96); }
.face .fhex { width: 40px; height: 40px; color: var(--ink-2); }
.face .fhex :deep(svg) { width: 100%; height: 100%; overflow: visible; }
.face .fhex :deep(.ln) { stroke: currentColor; fill: none; stroke-width: 1.5; }
.face .fhex :deep(.fl) { fill: transparent; }
.face .fl-nm { font-family: var(--font-mono); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-1); text-align: center; }
.face .fl-st { font-family: var(--font-mono); font-size: 8px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-2); }

.face.lit { border-color: var(--core-dim); background: var(--core-faint); }
.face.lit .fhex { color: var(--core); }
.face.lit .fhex :deep(.fl) { fill: var(--core); }
.face.lit .fl-nm { color: var(--ink-0); }
.face.lit .fl-st { color: var(--core-ink); }
.face.open:hover { border-color: var(--line-2); background: var(--bg-2); }
.face.locked { opacity: .42; cursor: not-allowed; border-style: dashed; }
.face.locked .fl-st { color: var(--ink-3); }
.face.blocked { cursor: not-allowed; }
.face.blocked .fl-st { color: var(--core-ink); }
@keyframes deny { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.face.shake { animation: deny .3s; }

.fp-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 13px; font-family: var(--font-mono); font-size: 10px; letter-spacing: .06em; color: var(--ink-2); }
.fp-foot .stub::before { content: "// "; color: var(--ink-3); }

.wm {
  position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; z-index: 31; pointer-events: none;
  font-family: var(--font-mono); font-size: 8px; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-3); opacity: .7;
}
</style>
