<template>
  <!-- ЯДРО HEXLASH — прототип новой формы (ТЗ 21.09.2026, правка 2).
       НЕ подключено ни к лендингу, ни к деке, ни к игре. Живёт только на
       скрытой странице /dev/core до выбора владельца.

       Каркас один на все варианты: шестиугольник вершиной вверх; из центра к
       трём вершинам — вверх, влево-вниз, вправо-вниз — три ветки; на каждой
       пять граней; свет идёт от центра до последней горящей и не дальше;
       между двумя задействованными ветками светится зона-сплав.

       ОФОРМЛЕНИЕ каркаса задаётся вариантом (prop styleId), числа варианта —
       в src/data/coreStyles.js. Данные (ветки, грани, лимит) у всех вариантов
       одни, из src/data/upgradeData.js.

       ⚠️ Цвет ядра НЕ объявляется здесь. Он приходит из src/styles/tokens.css
       выражением var(--core-<id>) и ставится на корень как --hc-hue.

       ⚠️ Отрисовок две, порог один — 48 точек (как у знака). Ниже 48 узлы 1-4,
       огранка центра и свет зон убираются. Упрощённая ВЫВОДИТСЯ из полной
       через v-if, отдельного рисунка нет. -->
  <svg
    class="hc"
    :class="[`hc--${variant}`, `hc-s--${styleId}`, { 'hc--simple': simple, 'hc--breathe': breathe, 'hc--neutral': !core }]"
    :style="rootVars"
    :viewBox="`0 0 ${BOX} ${BOX}`"
    :width="size"
    :height="size"
    role="img"
    :aria-label="label"
  >
    <defs>
      <!-- Ореол центра. Сила — --hc-lum, четыре ступени по числу
           задействованных веток. -->
      <radialGradient :id="`hcGlow-${uid}`" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="currentColor" stop-opacity=".55" />
        <stop offset="45%"  stop-color="currentColor" stop-opacity=".18" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </radialGradient>

      <!-- Свет изнутри камня — для вариантов, где плоских граней куба нет. -->
      <radialGradient :id="`hcInner-${uid}`" gradientUnits="userSpaceOnUse" :cx="C" :cy="C" :r="R">
        <stop offset="0%"   stop-color="currentColor" stop-opacity=".16" />
        <stop offset="55%"  stop-color="currentColor" stop-opacity=".05" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </radialGradient>

      <!-- Свет по ветке: у центра ярче, к краю гаснет. -->
      <linearGradient
        v-for="b in branches3" :key="`g-${b.id}`"
        :id="`hcFlow-${uid}-${b.id}`"
        gradientUnits="userSpaceOnUse"
        :x1="C" :y1="C" :x2="b.tipX" :y2="b.tipY"
      >
        <stop offset="0%"   stop-color="currentColor" stop-opacity=".95" />
        <stop offset="70%"  stop-color="currentColor" stop-opacity=".70" />
        <stop offset="100%" stop-color="currentColor" stop-opacity=".30" />
      </linearGradient>

      <!-- Свет доходит РОВНО до последней горящей грани: круг от центра
           растёт по радиусу. Один механизм на любую форму канала. -->
      <clipPath v-for="b in branches3" :key="`c-${b.id}`" :id="`hcLit-${uid}-${b.id}`">
        <circle class="hc-lit-clip" :cx="C" :cy="C" :r="b.litR" />
      </clipPath>

      <!-- Наклон пластины — свой у каждой: блик поперёк камня. -->
      <linearGradient
        v-for="z in zones3" :key="`tg-${z.id}`"
        :id="`hcTilt-${uid}-${z.id}`"
        gradientUnits="userSpaceOnUse"
        :x1="z.tx1" :y1="z.ty1" :x2="z.tx2" :y2="z.ty2"
      >
        <stop offset="0%"   stop-color="var(--ink)" :stop-opacity="TILT[z.shade][0]" />
        <stop offset="45%"  stop-color="var(--ink)" :stop-opacity="TILT[z.shade][1]" />
        <stop offset="100%" stop-color="var(--ink)" :stop-opacity="TILT[z.shade][2]" />
      </linearGradient>

      <!-- Свет зоны-сплава: изнутри камня, из места, где ветки сходятся. -->
      <radialGradient
        v-for="z in zones3" :key="`zg-${z.id}`"
        :id="`hcZone-${uid}-${z.id}`"
        gradientUnits="userSpaceOnUse"
        :cx="z.cx" :cy="z.cy" :r="z.r"
      >
        <stop offset="0%"   stop-color="currentColor" stop-opacity=".9" />
        <stop offset="40%"  stop-color="currentColor" stop-opacity=".38" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 1 · ТЕЛО. Три зоны между лучами. У «плоских граней» они освещены
         по-разному и дают объём куба; у «мягкого» тела почти не видны, а
         глубину даёт свет изнутри; у «пластин» они раздвинуты и между ними
         щели. -->
    <g class="hc-body">
      <polygon
        v-for="z in zones3" :key="`body-${z.id}`"
        :points="cfg.zones === 'plates' ? z.plate : z.points"
        :class="['hc-zone', `hc-zone--${z.shade}`]"
        :style="cfg.zones === 'plates' ? { fill: `url(#hcTilt-${uid}-${z.id})` } : null"
      />
      <polygon v-if="cfg.zones !== 'flat'" class="hc-inner" :points="rimPoints" :fill="`url(#hcInner-${uid})`" />
    </g>

    <!-- 2 · СВЕТ ЗОН-СПЛАВОВ. Зона горит, когда задействованы ОБЕ соседние
         ветки; сила — по меньшей из двух глубин. -->
    <g v-if="zoneMode === 'fusion' && !simple" class="hc-fusion">
      <polygon
        v-for="z in zones3" :key="`fus-${z.id}`"
        v-show="z.strength > 0"
        :points="cfg.zones === 'plates' ? z.plate : z.points"
        :fill="`url(#hcZone-${uid}-${z.id})`"
        :style="{ opacity: 0.3 + (z.strength / 5) * 0.7 }"
        class="hc-fusion__zone"
      />
    </g>

    <!-- 3 · ВЕТКИ. Паз в камне ровной ширины ИЛИ кристалл, растущий из ядра:
         толстый у центра, сходящий на нет к краю. Поверх — светящаяся жила,
         обрезанная по последней горящей грани. -->
    <g class="hc-channels">
      <template v-for="b in branches3" :key="`ch-${b.id}`">
        <line v-if="cfg.channel === 'groove'" class="hc-groove" :x1="C" :y1="C" :x2="b.tipX" :y2="b.tipY" />
        <polygon v-else class="hc-shard" :points="b.shard" />

        <template v-if="cfg.walls">
          <line class="hc-wall hc-wall--hi" :x1="b.hi.x1" :y1="b.hi.y1" :x2="b.hi.x2" :y2="b.hi.y2" />
          <line class="hc-wall hc-wall--lo" :x1="b.lo.x1" :y1="b.lo.y1" :x2="b.lo.x2" :y2="b.lo.y2" />
        </template>

        <g :clip-path="`url(#hcLit-${uid}-${b.id})`" :style="{ opacity: b.lit > 0 ? 1 : 0 }" class="hc-flowwrap">
          <line
            v-if="cfg.channel === 'groove'"
            class="hc-flow"
            :x1="C" :y1="C" :x2="b.tipX" :y2="b.tipY"
            :stroke="`url(#hcFlow-${uid}-${b.id})`"
          />
          <polygon v-else class="hc-vein" :points="b.vein" :fill="`url(#hcFlow-${uid}-${b.id})`" />
        </g>
      </template>
    </g>

    <!-- 4 · ГРАНИ. Огранённые кристаллы, растущие от центра к вершине.
         Ниже 48 точек остаётся только вершина ветки. -->
    <g class="hc-nodes">
      <template v-for="b in branches3" :key="`nd-${b.id}`">
        <g
          v-for="n in b.nodes" :key="`${b.id}-${n.i}`"
          v-show="!simple || n.i === 5"
          :class="['hc-node', n.lit ? 'is-lit' : 'is-dark']"
        >
          <polygon class="hc-node__gem" :points="n.points" />
          <polygon v-if="n.lit && !simple" class="hc-node__facet" :points="n.inner" />
        </g>
      </template>
    </g>

    <!-- 5 · ЦЕНТР. Самая яркая точка фигуры. Ярче — чем больше веток
         задействовано, четыре ступени в --hc-lum. -->
    <g class="hc-heart">
      <circle class="hc-heart__glow" :cx="C" :cy="C" :r="heart.glowR" :fill="`url(#hcGlow-${uid})`" />
      <polygon class="hc-heart__body" :points="heart.outer" />
      <g v-if="cfg.heartFacets !== 'none' && !simple" class="hc-heart__cuts">
        <polygon v-if="cfg.heartFacets === 'table'" class="hc-heart__table" :points="heart.table" />
        <line v-for="(l, i) in heart.cuts" :key="`hc-${i}`" :x1="l[0]" :y1="l[1]" :x2="l[2]" :y2="l[3]" />
      </g>
      <!-- Знак манеры своего ядра. Рисунок берётся из нынешней иконки
           (coreFacets в upgradeGeometry) — второй копии координат нет. -->
      <g
        v-if="cfg.sigil && sigilInner && !simple"
        class="hc-sigil"
        :transform="sigilTransform"
        v-html="sigilInner"
      />
      <polygon v-if="heart.seed" class="hc-heart__seed" :points="heart.seed" />
    </g>

    <!-- 6 · КОНТУР. Тонкий, цветом ядра. У варианта «без рамки» его нет
         вовсе — силуэт собирают пластины и ветки. Толстой белой обводки и
         росчерков здесь не бывает: это знак, а не ядро. -->
    <polygon v-if="cfg.rim" class="hc-rim" :points="rimPoints" />
  </svg>
</template>

<script setup>
import { computed, useId } from 'vue';
import { CORE_STYLE_IDS } from '@/data/coreStyles.js';
import { coreFigure, TILT } from '@/data/coreFigure.js';
import { coreFacets } from '@/data/upgradeGeometry.js';

/* ⚠️ Координат фигуры ЗДЕСЬ НЕТ. Вся математика — в src/data/coreFigure.js,
   и она же питает деку (статическую страницу вне сборки) через
   scripts/sync-core-figure.mjs. Этот файл только рисует и красит. */

const props = defineProps({
  /* Идентификатор ядра. null — нейтральное состояние: центр горит ровным
     светом --ink, цвета ядра у фигуры нет (розовый первый экран витрины). */
  core: { type: String, default: null },
  /* Горящие грани по веткам: { a: 0..5, b: 0..5, c: 0..5 }. */
  branches: { type: Object, default: () => ({ a: 0, b: 0, c: 0 }) },
  /* Вид зон между лучами: 'fusion' — сплав двух веток светится;
     'plain' — чистые грани объёма, не светятся никогда. */
  zoneMode: { type: String, default: 'fusion' },
  /* Вариант ОФОРМЛЕНИЯ каркаса — см. src/data/coreStyles.js. */
  styleId: { type: String, default: 'origin', validator: (v) => CORE_STYLE_IDS.includes(v) },
  /* Готовое значение цвета вместо цвета ядра. Нужно фону витрины: там цвет
     перетекает между разделами, и фигура обязана течь вместе с кольцами, а не
     перещёлкиваться. Пусто — цвет берётся из ядра, как обычно. */
  hue: { type: String, default: '' },
  size: { type: Number, default: 128 },
  breathe: { type: Boolean, default: false },
  /* normal · muted (без свечения) · selected · foe (тусклее) · background */
  variant: { type: String, default: 'normal' },
});

/* ⚠️ Ключ для id градиентов и обрезок обязан быть УНИКАЛЬНЫМ НА ДОКУМЕНТ.
   Здесь стоял счётчик `let _uid = 0` рядом с props — и это была ошибка:
   в <script setup> всё, кроме импортов, компилируется ВНУТРЬ setup(), то есть
   счётчик заводился заново на каждый экземпляр и все получали «1». Браузер
   на одинаковый url(#…) берёт ПЕРВЫЙ такой элемент в документе, поэтому на
   листе все ядра красились градиентами первого — свет в каналах у BULWARK и
   AMBUSH был красный. */
const uid = useId();
const simple = computed(() => props.size < 48);

const fig = computed(() => coreFigure({
  styleId: props.styleId,
  branches: props.branches,
  simple: simple.value,
}));

const BOX = computed(() => fig.value.box);
const C = computed(() => fig.value.c);
const R = computed(() => fig.value.r);
const cfg = computed(() => fig.value.cfg);
const branches3 = computed(() => fig.value.branches);
const zones3 = computed(() => fig.value.zones);
const rimPoints = computed(() => fig.value.rim);
const heart = computed(() => fig.value.heart);

/* У нейтральной фигуры (первый экран витрины) центр горит ВСЕГДА: розового
   у ядер нет, и показать бренд нечем, кроме ровного нейтрального света в
   сердцевине. Ветки при этом остаются тёмными — они просто не зажжены. */
const rootVars = computed(() => ({
  '--hc-hue': props.hue || (props.core ? `var(--core-${props.core})` : 'var(--ink)'),
  '--hc-lum': String(props.core ? fig.value.lum : 1),
  '--hc-beat': props.core ? `var(--d-pulse-${props.core})` : 'var(--d-loop)',
  '--hc-flow-w': `${cfg.value.flowW}`,
}));

const label = computed(() => {
  const l = fig.value.lit;
  const n = l.a + l.b + l.c;
  return `${props.core ? props.core.toUpperCase() : 'NEUTRAL'} core, ${n} of 5 facets lit`;
});

/* Знак манеры — разметка нынешней иконки ядра как есть, вписанная в сердце. */
const sigilInner = computed(() => (props.core ? coreFacets(props.core) : ''));
const sigilTransform = computed(() => fig.value.sigilTransform);
</script>

<style scoped>
.hc {
  display: block;
  color: var(--hc-hue);
  overflow: visible;
}

/* ── Тело ───────────────────────────────────────────────────────────────
   Три ступени освещённости — ramp внутренний для рисунка, такой же, как
   ступени прозрачности у колец волны. Палитру он не расширяет: цвет один. */
.hc-zone        { fill: var(--ink); stroke: none; }
.hc-zone--high  { fill-opacity: .10; }
.hc-zone--mid   { fill-opacity: .062; }
.hc-zone--low   { fill-opacity: .032; }

/* Мягкое тело: плоские грани куба почти погашены, глубину даёт свет изнутри.
   Именно ровные три грани и читались «коробкой». */
.hc-s--crystal .hc-zone--high,
.hc-s--heart   .hc-zone--high,
.hc-s--sigil   .hc-zone--high  { fill-opacity: .045; }
.hc-s--crystal .hc-zone--mid,
.hc-s--heart   .hc-zone--mid,
.hc-s--sigil   .hc-zone--mid   { fill-opacity: .028; }
.hc-s--crystal .hc-zone--low,
.hc-s--heart   .hc-zone--low,
.hc-s--sigil   .hc-zone--low   { fill-opacity: .014; }

/* Крупное сердце главное: плоские грани почти сняты, объём держит свет
   изнутри камня. Иначе внешний шестиугольник с тремя гранями даёт куб. */
.hc-s--heart .hc-zone--high,
.hc-s--sigil .hc-zone--high { fill-opacity: .022; }
.hc-s--heart .hc-zone--mid,
.hc-s--sigil .hc-zone--mid  { fill-opacity: .013; }
.hc-s--heart .hc-zone--low,
.hc-s--sigil .hc-zone--low  { fill-opacity: .006; }

/* Пластины: заливка приходит градиентом наклона (см. hcTilt) и ставится
   ВСТРОЕННЫМ стилем — презентационный атрибут fill проигрывает правилу
   класса ниже по каскаду, и пластины заливались сплошным светлым.
   Плоские ступени здесь сняты: они и делали из трёх зон грани куба. */
.hc-s--frameless .hc-zone {
  fill-opacity: 1;
  stroke: var(--ink);
  stroke-opacity: .09;
  stroke-width: 1;
  stroke-linejoin: round;
}

.hc-inner { stroke: none; opacity: calc(.35 + var(--hc-lum) * .65); }

/* ── Ветки ──────────────────────────────────────────────────────────── */
.hc-groove {
  stroke: var(--void);
  stroke-width: 21;
  stroke-linecap: round;
}
/* Кристалл, растущий из ядра: тело темнее камня, с тонкой гранью по краю. */
.hc-shard {
  fill: var(--void);
  fill-opacity: .9;
  stroke: var(--ink);
  stroke-opacity: .13;
  stroke-width: 1;
  stroke-linejoin: miter;
}
.hc-wall { stroke-width: 1.2; stroke-linecap: round; }
.hc-wall--hi { stroke: var(--ink); stroke-opacity: .22; }
.hc-wall--lo { stroke: var(--ink); stroke-opacity: .07; }

.hc-flowwrap { transition: opacity var(--d-fast); }
.hc-lit-clip { transition: r var(--d-panel) var(--e-settle); }

.hc-flow {
  stroke-width: calc(var(--hc-flow-w) * 1px);
  stroke-linecap: round;
  filter: drop-shadow(0 0 5px currentColor);
}
.hc-vein {
  stroke: none;
  filter: drop-shadow(0 0 6px currentColor);
}

/* ── Грани ──────────────────────────────────────────────────────────── */
.hc-node__gem {
  stroke-width: 1;
  transition: fill var(--d-panel) var(--e-settle),
              fill-opacity var(--d-panel) var(--e-settle),
              stroke var(--d-panel) var(--e-settle),
              stroke-opacity var(--d-panel) var(--e-settle);
}

.hc-node.is-dark .hc-node__gem {
  fill: var(--void);
  stroke: var(--ink);
  stroke-opacity: .17;
}

.hc-node.is-lit .hc-node__gem {
  fill: currentColor;
  fill-opacity: .9;
  stroke: currentColor;
  filter: drop-shadow(0 0 5px currentColor);
}
/* Огранка горящего — внутренняя площадка, а не поперечная насечка:
   насечка сцепляла соседние узлы в зигзаг и читалась как цепь. */
.hc-node__facet { fill: var(--ink); fill-opacity: .52; stroke: none; }

/* ── Центр ──────────────────────────────────────────────────────────── */
.hc-heart__glow { opacity: var(--hc-lum); transition: opacity var(--d-panel) var(--e-settle); }
.hc-heart__body {
  fill: var(--void);
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-opacity: calc(.28 + var(--hc-lum) * .62);
}
.hc-heart__cuts line { stroke: currentColor; stroke-width: .9; stroke-opacity: calc(.18 + var(--hc-lum) * .42); }
.hc-heart__table { fill: none; stroke: currentColor; stroke-width: 1; stroke-opacity: calc(.22 + var(--hc-lum) * .5); }
.hc-heart__seed {
  fill: currentColor;
  fill-opacity: calc(.24 + var(--hc-lum) * .76);
  filter: drop-shadow(0 0 calc(2px + var(--hc-lum) * 7px) currentColor);
}

/* Знак манеры внутри сердца. Разметка пришла из нынешней иконки ядра через
   v-html, поэтому её классы достаются только через :deep(). */
.hc-sigil :deep(.facet) {
  fill: none;
  stroke: currentColor;
  stroke-width: 4;
  stroke-opacity: calc(.35 + var(--hc-lum) * .6);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.hc-sigil :deep(.seed) {
  fill: currentColor;
  stroke: none;
  fill-opacity: calc(.4 + var(--hc-lum) * .6);
}
.hc-sigil { filter: drop-shadow(0 0 calc(1px + var(--hc-lum) * 5px) currentColor); }

/* ── Контур ─────────────────────────────────────────────────────────── */
.hc-rim {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-opacity: .5;
  filter: drop-shadow(0 0 3px color-mix(in srgb, currentColor 55%, transparent));
}

/* Нейтральная фигура (розовый раздел витрины): ГОРИТ ТОЛЬКО ЦЕНТР, всё
   остальное уходит в тень. Светлый контур читался белым шестиугольником и
   лез в глаза как логотип — а логотип единственный, у кого белая обводка.
   Ветки, грани и огранка тоже приглушены: на первом экране лендинга фигура
   стоит прямо под подзаголовком, и светлый каркас спорил с текстом. */
.hc--neutral .hc-rim {
  stroke: var(--ink-off);
  stroke-opacity: .26;
  filter: none;
}
.hc--neutral .hc-shard { stroke-opacity: .05; fill-opacity: .95; }
.hc--neutral .hc-groove { opacity: .95; }
.hc--neutral .hc-zone { fill-opacity: .014; }
.hc--neutral .hc-inner { opacity: .18; }
.hc--neutral .hc-node.is-dark .hc-node__gem { stroke-opacity: .06; }
.hc--neutral .hc-heart__body { stroke-opacity: .34; }
.hc--neutral .hc-heart__cuts line,
.hc--neutral .hc-heart__table { stroke-opacity: .22; }

/* ── Состояния ──────────────────────────────────────────────────────── */
/* Приглушённое: свечения нет вовсе, плоский цвет — для полок, где ядер много.
   Свет зон-сплавов тоже гаснет: он такое же свечение, как остальные. */
.hc--muted .hc-fusion { display: none; }
.hc--muted .hc-flow,
.hc--muted .hc-vein,
.hc--muted .hc-sigil,
.hc--muted .hc-node.is-lit .hc-node__gem,
.hc--muted .hc-heart__seed,
.hc--muted .hc-rim { filter: none; }
.hc--muted .hc-heart__glow { display: none; }

.hc--foe { opacity: .55; }

.hc--selected .hc-rim { stroke-opacity: 1; stroke-width: 2; }
/* У варианта без рамки выделять нечего — берём на себя кромку пластин. */
.hc--selected .hc-s--frameless .hc-zone,
.hc-s--frameless.hc--selected .hc-zone { stroke-opacity: .3; }

/* На фоне СНЯТЫ ВСЕ размытия — включая свечение контура. Слой волны
   закреплён относительно окна, и при прокрутке браузер пересобирает его
   каждый кадр; размытие внутри закреплённого слоя он закэшировать не может.
   Замер на медленном телефоне (шестикратное замедление): с размытиями
   середина кадра 22.3 мс, без них — вровень со страницей без фигуры.
   Сама фигура от этого не тускнеет: свет несут заливки, а не ореолы. */
.hc--background .hc-flow,
.hc--background .hc-vein,
.hc--background .hc-node.is-lit .hc-node__gem,
.hc--background .hc-rim,
.hc--background .hc-sigil,
.hc--background .hc-heart__seed { filter: none; }
/* Ореол центра на фоне приглушён отдельно от остальной фигуры. Сам он света
   не несёт — это мягкое пятно, и именно оно размывало строку текста, которая
   проходит ровно через середину. Каркас (ветки, грани, контур) остаётся в
   полную силу: фигура должна быть заметной, размывать её целиком нельзя. */
.hc--background .hc-heart__glow { opacity: calc(var(--hc-lum) * .42); }
.hc--background { opacity: .5; }

.hc-fusion__zone { transition: opacity var(--d-panel) var(--e-settle); }

/* ── Дыхание центра в ритме ядра ────────────────────────────────────── */
/* Кадры 0% и 100% одинаковы — при «уменьшить движение» петля встаёт в покой. */
.hc--breathe .hc-heart__glow {
  animation: hc-beat var(--hc-beat) var(--e-settle) infinite;
}
@keyframes hc-beat {
  0%   { opacity: var(--hc-lum); }
  50%  { opacity: calc(var(--hc-lum) * .62); }
  100% { opacity: var(--hc-lum); }
}
.hc--breathe .hc-heart__seed {
  animation: hc-beat-seed var(--hc-beat) var(--e-settle) infinite;
  transform-origin: 100px 100px;
}
@keyframes hc-beat-seed {
  0%   { transform: scale(1); }
  50%  { transform: scale(.88); }
  100% { transform: scale(1); }
}
</style>
