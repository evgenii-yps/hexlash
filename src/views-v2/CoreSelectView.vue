<!-- /play — Экран выбора ядра (Заход 1, шаг 1 предбоевого окна). Полноэкранный,
     sibling экрана прокачки: тот же coreSVG(), те же id ядер, единый источник
     CORES (src/data/upgradeData.js), нотч-CTA. Декор превью (рамка-телефон,
     статус-бар, HUD-уголки, футер) снят — это игровой экран, не мокап.

     Дисциплина (Neon Discipline · четыре ядра рядом): каждое ядро по умолчанию
     ПЛОСКОЕ, без свечения; экран темится в --core выбранного. Свечение глоу —
     на наведении (только указатель) и на выбранном (плашка + ритм пульса).
     У каждого ядра свой ритм пульса (натиск — частый, налётчик — рваный, скала —
     медленный вдох, засада — долгая выдержка), под prefers-reduced-motion.

     Выбор → prefight.selectedCoreId (этот же id читают прокачка и арена) →
     CTA «К ПРОКАЧКЕ» уводит на /play/upgrade. -->
<template>
  <div class="scene" :style="coreVars">
    <div class="screen" :style="coreVars" data-screen-label="Core Select">

        <!-- header + title + counter -->
        <div class="s-top">
          <div class="ttl">
            <h1>CHOOSE YOUR<br /><b>CORE</b></h1>
          </div>
          <div class="counter">
            <span class="k">Pick</span>
            <span class="v"><b class="picked">1</b> OF 4</span>
          </div>
        </div>

        <!-- 2×2 core grid -->
        <div class="grid">
          <button
            v-for="core in cores"
            :key="core.id"
            class="core-card"
            :class="{ sel: selectedId === core.id }"
            :data-core="core.id"
            :style="{ '--c': core.hue, '--c-sup': core.sup }"
            :aria-pressed="selectedId === core.id"
            :aria-label="'Core · ' + core.name"
            @click="select(core)"
          >
            <div class="halo"></div>
            <div class="ring"></div>
            <div class="stage">
              <div class="icon" v-html="glyphs[core.id]"></div>
            </div>
            <div class="nm">{{ core.name }}</div>
          </button>
        </div>

        <!-- reader + notched CTA -->
        <div class="s-bottom">
          <div class="read">
            <div class="lbl">
              <span class="k">Core</span>
              <span class="v">
                <b class="readname">
                  <span v-if="!selected" class="dash">— NONE SELECTED —</span>
                  <template v-else>{{ selected.name }}</template>
                </b>
              </span>
            </div>
            <span class="sig readsig" :class="{ on: selected }">
              {{ selected ? selected.sig : 'TAP A CORE' }}
            </span>
          </div>
          <button
            class="cta"
            :class="{ 'is-ready': selected }"
            :disabled="!selected"
            @click="toUpgrade"
          >
            <span>TO UPGRADE</span>
          </button>
        </div>
    </div>
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

// SVG ядер — те же силуэты, что на прокачке (переиспользуем coreSVG, не дублируем).
// Чистые строки, считаются один раз; рендерятся через v-html (источник доверенный).
const glyphs = Object.fromEntries(CORES.map((c) => [c.id, coreSVG(c.id, { seed: true })]));

// --- Выбор (ровно одно ядро светится; остальные плоские) ---------------------
const selectedId = ref(null);
const selected = computed(() => (selectedId.value ? getCore(selectedId.value) : null));

// Экран темится в --core выбранного; пока пусто — нейтральный серый (всё плоское).
// Та же переменная, что читает прокачка → тинт перетекает выбор → прокачка.
const MUTED = '#6e6a72';
const coreVars = computed(() =>
  selected.value
    ? { '--core': selected.value.hue, '--core-sup': selected.value.sup }
    : { '--core': MUTED, '--core-sup': MUTED },
);

function select(core) {
  selectedId.value = core.id; // единственное свечение — остальные остаются плоскими
  store.dispatch('prefight/selectCore', core.id); // id уходит в стор (читают прокачка/арена)
}

// CTA «К ПРОКАЧКЕ» — навигационный контракт: выбор уже в сторе, страж маршрута
// (requireCore) пропускает. Короткая пауза, чтобы прочиталось нажатие.
let navigating = false;
function toUpgrade() {
  if (!selected.value || navigating) return;
  navigating = true;
  setTimeout(() => router.push({ name: 'PrefightUpgrade' }), 160);
}
</script>

<style>
/* Шрифты — общий ресурс: Saira Condensed (дисплей) + JetBrains Mono (телеметрия).
   Тот же @import, что на экране прокачки — браузер дедуплицирует. */
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
</style>

<style scoped>
/* ============================================================
   HEXLASH — ЭКРАН ВЫБОРА ЯДРА · стили (порт select_handoff/styles.css)
   Дисциплина: тёмный фон · один акцент = --core · плоские по умолчанию ·
   светится максимум одно (выбранное) · ритмы пульса на ядро.
   Токены вынесены из :root на .scene (корень компонента). SVG из v-html
   таргетится через :deep().
   ============================================================ */
.scene * { box-sizing: border-box; margin: 0; padding: 0; }
.scene button {
  font: inherit; color: inherit; background: none; border: 0; cursor: pointer;
  -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent;
}

.scene {
  /* Color (Brand Book) */
  --bg-void: #08080a;       /* Void */
  --bg-carbon: #0d0a0d;     /* Carbon */
  --bg-ember: #160a11;      /* Ember (только подложка свечения) */
  --ink-bone: #f6f4f6;      /* Bone */
  --ink-ash: #6e6a72;       /* Ash */
  --ink-line: rgba(255, 255, 255, .08);
  --ink-line-2: rgba(255, 255, 255, .14);
  --ink-3: #39363a;

  --font-disp: 'Saira Condensed', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --ease: cubic-bezier(.4, .05, .1, 1);
  --ease-out: cubic-bezier(.16, 1, .3, 1);

  /* выбранное ядро (свопается :style на .scene и .screen) */
  --core: #6e6a72;
  --core-sup: #6e6a72;

  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(120% 70% at 50% 6%, color-mix(in srgb, var(--core) 7%, transparent), transparent 60%),
    radial-gradient(120% 60% at 50% 108%, color-mix(in srgb, var(--core) 9%, transparent), transparent 64%),
    radial-gradient(120% 80% at 50% -10%, var(--bg-ember) 0%, var(--bg-carbon) 42%, var(--bg-void) 78%);
  color: var(--ink-bone);
  font-family: var(--font-disp);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  transition: background .6s var(--ease);
}
/* слабая дисциплинарная сетка */
.scene::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(var(--ink-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--ink-line) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(120% 80% at 50% 36%, #000, transparent 72%);
  mask-image: radial-gradient(120% 80% at 50% 36%, #000, transparent 72%);
  opacity: .35;
}

/* экран — полноэкранный холст (никакой рамки-телефона / letterbox), темится в
   --core при выборе. Занимает весь вьюпорт на десктопе и мобиле. */
.screen {
  position: absolute; inset: 0; overflow: hidden;
  isolation: isolate;
  --core-dim: color-mix(in srgb, var(--core) 55%, transparent);
  --core-faint: color-mix(in srgb, var(--core) 14%, transparent);
  --core-ghost: color-mix(in srgb, var(--core) 7%, transparent);
  --core-ink: color-mix(in srgb, var(--core) 62%, #fff);
  background:
    radial-gradient(72% 42% at 50% 30%, var(--core-faint), transparent 66%),
    radial-gradient(120% 50% at 50% 102%, var(--core-ghost), transparent 60%),
    radial-gradient(130% 78% at 50% 14%, var(--bg-carbon), var(--bg-void) 66%);
  transition: background .6s var(--ease);
}

/* надзаголовок + заголовок + счётчик — по центру экрана */
.s-top {
  position: absolute; top: 60px; left: 0; right: 0; z-index: 30; padding: 0 24px;
  display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center;
}
.s-top .ttl { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.s-top .ttl h1 {
  font-family: var(--font-disp); font-weight: 900; font-size: 38px; line-height: .88;
  letter-spacing: .005em; text-transform: uppercase; color: var(--ink-bone);
}
.s-top .ttl h1 b {
  font-weight: 900; color: #fff;
  text-shadow:
    0 0 12px color-mix(in srgb, var(--core) 60%, transparent),
    0 0 38px color-mix(in srgb, var(--core) 45%, transparent);
  transition: text-shadow .4s var(--ease);
}
.s-top .counter { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.s-top .counter .k {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: .24em;
  text-transform: uppercase; color: var(--ink-ash);
}
.s-top .counter .v {
  font-family: var(--font-mono); font-size: 14px; font-weight: 600;
  color: var(--ink-ash); letter-spacing: .06em;
}
.s-top .counter .v b { color: var(--core-ink); font-weight: 700; transition: color .4s var(--ease); }

/* сетка 2×2 */
.grid {
  position: absolute; left: 0; right: 0; top: 188px; bottom: 204px;
  padding: 0 24px; z-index: 20;
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; grid-auto-rows: 1fr;
}

/* карточка ядра (плоская по умолчанию · единственное свечение при .sel) */
.core-card {
  position: relative; display: flex; flex-direction: column; align-items: stretch;
  border: 1px solid var(--ink-line);
  background: rgba(255, 255, 255, .018);
  padding: 16px 14px 14px; cursor: pointer; overflow: hidden;
  /* нотч fight-card — фирменный мотив */
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%);
  transition: border-color .3s var(--ease), background .3s var(--ease), transform .15s var(--ease);
  /* инжектится инлайн по data-core */
  --c: #6e6a72;
  --c-dim: color-mix(in srgb, var(--c) 55%, transparent);
  --c-faint: color-mix(in srgb, var(--c) 12%, transparent);
  --c-ink: color-mix(in srgb, var(--c) 62%, #fff);
}
.core-card:active { transform: scale(.985); }
.core-card:hover { border-color: var(--ink-line-2); }

/* сцена иконки с гало */
.core-card .stage {
  position: relative; flex: 1; display: grid; place-items: center;
  margin: 6px 0 4px; min-height: 96px;
}
.core-card .halo {
  position: absolute; inset: -8%; border-radius: 50%; z-index: 1; pointer-events: none;
  opacity: 0; transition: opacity .35s var(--ease);
  background:
    radial-gradient(circle at 50% 50%,
      color-mix(in srgb, var(--c) 56%, transparent) 0%,
      color-mix(in srgb, var(--c) 22%, transparent) 30%,
      transparent 62%),
    radial-gradient(circle at 38% 66%,
      color-mix(in srgb, var(--c) 36%, transparent) 0%, transparent 50%);
  filter: blur(14px);
}
.core-card .ring {
  position: absolute; inset: 14%; border: 1px solid var(--c-dim); border-radius: 50%;
  z-index: 1; opacity: 0;
}

.core-card .icon { width: 96px; height: 96px; position: relative; z-index: 2; transition: transform .4s var(--ease-out); }
.core-card .icon :deep(svg) { width: 100%; height: 100%; overflow: visible; }
/* плоское состояние — приглушённые штрихи с намёком на цвет ядра, чтобы силуэты
   различались, не зажигаясь */
.core-card .icon :deep(.hex-line) {
  stroke: color-mix(in srgb, var(--c) 28%, var(--ink-3));
  fill: none; stroke-width: 1.6; transition: stroke .35s var(--ease);
}
.core-card .icon :deep(.facet) {
  stroke: color-mix(in srgb, var(--c) 18%, var(--ink-3));
  fill: none; stroke-width: 1.1; transition: stroke .35s var(--ease);
}
.core-card .icon :deep(.seed) {
  fill: color-mix(in srgb, var(--c) 42%, var(--ink-3));
  transition: fill .35s var(--ease);
}

/* имя ядра */
.core-card .nm {
  font-family: var(--font-disp); font-weight: 800; font-size: 22px;
  letter-spacing: .02em; text-transform: uppercase; line-height: 1;
  color: var(--ink-bone); text-align: center; margin-top: 6px;
  transition: color .35s var(--ease);
}

/* выбранное — единственное свечение экрана */
.core-card.sel { border-color: var(--c-dim); background: var(--c-faint); }
.core-card.sel .icon { transform: scale(1.05); }
.core-card.sel .icon :deep(.hex-line) { stroke: var(--c); }
.core-card.sel .icon :deep(.facet) { stroke: var(--c-dim); }
.core-card.sel .icon :deep(.seed) { fill: var(--c); }
.core-card.sel .nm { color: #fff; text-shadow: 0 0 12px color-mix(in srgb, var(--c) 55%, transparent); }
.core-card.sel .halo { opacity: 1; }

/* наведение (только указатель) — ядро светится глоу своим цветом, БЕЗ плашки-
   заливки: зажигаем halo + штрихи иконки, но НЕ трогаем фон/рамку (это остаётся
   признаком выбранного). На тач-устройствах media false → tap просто выбирает,
   hover не липнет. Дисциплина: один указатель = одно наведённое свечение. */
@media (hover: hover) and (pointer: fine) {
  .core-card:hover .halo { opacity: 1; }
  .core-card:hover .icon { transform: scale(1.05); }
  .core-card:hover .icon :deep(.hex-line) { stroke: var(--c); }
  .core-card:hover .icon :deep(.facet) { stroke: var(--c-dim); }
  .core-card:hover .icon :deep(.seed) { fill: var(--c); }
  .core-card:hover .nm { color: #fff; text-shadow: 0 0 12px color-mix(in srgb, var(--c) 55%, transparent); }
}

/* ============================================================
   РИТМЫ СВЕТА — каждое ядро дышит по-своему. Активны только на .sel —
   плоские карточки молчат. Это и отличает четвёрку за пределами цвета/имени.
   ============================================================ */
@media (prefers-reduced-motion: no-preference) {
  /* Натиск — частый ровный пульс (давление без передышки) */
  .core-card.sel[data-core="natisk"] .halo { animation: rhythm-natisk .95s ease-in-out infinite; }
  .core-card.sel[data-core="natisk"] .ring { animation: ring-natisk .95s ease-out infinite; }

  /* Налётчик — рваные всплески (налёт, отрыв, снова) */
  .core-card.sel[data-core="nalet"] .halo { animation: rhythm-nalet 1.7s linear infinite; }
  .core-card.sel[data-core="nalet"] .ring { animation: ring-nalet 1.7s linear infinite; }

  /* Скала — медленный вдох (держит удар, отдаёт позже) */
  .core-card.sel[data-core="skala"] .halo { animation: rhythm-skala 4.6s ease-in-out infinite; }
  .core-card.sel[data-core="skala"] .ring { animation: ring-skala 4.6s ease-out infinite; }

  /* Засада — долгая выдержка, один удар (тишина, затем расплата) */
  .core-card.sel[data-core="zasada"] .halo { animation: rhythm-zasada 5.6s cubic-bezier(.7, 0, .2, 1) infinite; }
  .core-card.sel[data-core="zasada"] .ring { animation: ring-zasada 5.6s cubic-bezier(.7, 0, .2, 1) infinite; }
}

@keyframes rhythm-natisk {
  0%, 100% { opacity: .8; transform: scale(.96); }
  50% { opacity: 1; transform: scale(1.06); }
}
@keyframes ring-natisk {
  0% { transform: scale(.78); opacity: .5; }
  70%, 100% { transform: scale(1.25); opacity: 0; }
}
@keyframes rhythm-nalet {
  0% { opacity: .48; transform: scale(.96); }
  8% { opacity: 1; transform: scale(1.07); }
  18% { opacity: .55; transform: scale(.99); }
  24% { opacity: .95; transform: scale(1.04); }
  32% { opacity: .42; transform: scale(.95); }
  100% { opacity: .42; transform: scale(.95); }
}
@keyframes ring-nalet {
  0% { transform: scale(.74); opacity: .55; }
  18%, 100% { transform: scale(1.25); opacity: 0; }
}
@keyframes rhythm-skala {
  0%, 100% { opacity: .58; transform: scale(.97); }
  50% { opacity: 1; transform: scale(1.07); }
}
@keyframes ring-skala {
  0% { transform: scale(.85); opacity: .4; }
  90%, 100% { transform: scale(1.18); opacity: 0; }
}
@keyframes rhythm-zasada {
  0%, 68% { opacity: .34; transform: scale(.95); }
  78% { opacity: 1; transform: scale(1.1); }
  88% { opacity: .7; transform: scale(1.02); }
  100% { opacity: .34; transform: scale(.95); }
}
@keyframes ring-zasada {
  0%, 70% { transform: scale(.8); opacity: 0; }
  78% { transform: scale(.9); opacity: .55; }
  100% { transform: scale(1.3); opacity: 0; }
}

/* читалка-итог + нотч-CTA */
.s-bottom {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 22; padding: 0 24px 26px;
  display: flex; flex-direction: column; gap: 14px;
}
.read {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  border: 1px solid var(--ink-line);
  background: rgba(255, 255, 255, .025);
  padding: 13px 16px;
}
.read .lbl { display: flex; flex-direction: column; gap: 4px; flex: 1 1 auto; }
.read .lbl .k {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: .24em;
  text-transform: uppercase; color: var(--ink-ash);
}
.read .lbl .v {
  font-family: var(--font-disp); font-size: 18px; font-weight: 800;
  text-transform: uppercase; color: var(--ink-bone); line-height: 1; letter-spacing: .02em;
  white-space: nowrap;
}
.read .lbl .v b { color: var(--core-ink); font-weight: 800; transition: color .4s var(--ease); }
.read .lbl .v .dash { color: var(--ink-3); font-weight: 500; }
.read .sig {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: .2em;
  text-transform: uppercase; color: var(--ink-ash); text-align: right; line-height: 1.4;
  flex: none;
}
.read .sig.on { color: var(--core-ink); }

/* нотч-CTA — фирменный chevron. По умолчанию ghost (ничего не выбрано);
   .is-ready заливает его в --core. Класс переключаем отдельно от [disabled],
   чтобы заливка/тень менялись чётко, а не через прозрачность. */
.cta {
  width: 100%; border: 0; cursor: not-allowed;
  background: transparent; color: var(--ink-ash);
  font-family: var(--font-disp); font-weight: 800; font-size: 20px; letter-spacing: .18em;
  text-transform: uppercase; opacity: .75;
  padding: 18px 22px; display: flex; align-items: center; justify-content: center; gap: 18px;
  position: relative; overflow: hidden;
  transition: filter .2s, transform .12s, opacity .2s;
}
.cta::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  border: 1px dashed var(--ink-line-2);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
}
.cta span { position: relative; z-index: 2; }

/* выбрано → залитый нотч-primary */
.cta.is-ready {
  cursor: pointer; opacity: 1;
  background: var(--core); color: #0a0a0c;
  box-shadow: 0 0 26px color-mix(in srgb, var(--core) 50%, transparent);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
}
.cta.is-ready::after { display: none; }
.cta.is-ready::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, .18), transparent 42%);
}
.cta.is-ready:hover { filter: brightness(1.08); }
.cta.is-ready:active { transform: scale(.985); }
</style>
