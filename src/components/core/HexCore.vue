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
          <line class="hc-wall hc-wall--hi" :x1="b.hiX1" :y1="b.hiY1" :x2="b.hiX2" :y2="b.hiY2" />
          <line class="hc-wall hc-wall--lo" :x1="b.loX1" :y1="b.loY1" :x2="b.loX2" :y2="b.loY2" />
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
      <circle class="hc-heart__glow" :cx="C" :cy="C" :r="cfg.heartGlow" :fill="`url(#hcGlow-${uid})`" />
      <polygon class="hc-heart__body" :points="heartOuter" />
      <g v-if="cfg.heartFacets !== 'none' && !simple" class="hc-heart__cuts">
        <polygon v-if="cfg.heartFacets === 'table'" class="hc-heart__table" :points="heartTable" />
        <line v-for="(l, i) in heartCuts" :key="`hc-${i}`" :x1="l[0]" :y1="l[1]" :x2="l[2]" :y2="l[3]" />
      </g>
      <!-- Знак манеры своего ядра. Рисунок берётся из нынешней иконки
           (coreFacets в upgradeGeometry) — второй копии координат нет. -->
      <g
        v-if="cfg.sigil && sigilInner && !simple"
        class="hc-sigil"
        :transform="sigilTransform"
        v-html="sigilInner"
      />
      <polygon v-if="cfg.heartSeed > 0" class="hc-heart__seed" :points="heartInner" />
    </g>

    <!-- 6 · КОНТУР. Тонкий, цветом ядра. У варианта «без рамки» его нет
         вовсе — силуэт собирают пластины и ветки. Толстой белой обводки и
         росчерков здесь не бывает: это знак, а не ядро. -->
    <polygon v-if="cfg.rim" class="hc-rim" :points="rimPoints" />
  </svg>
</template>

<script setup>
import { computed, useId } from 'vue';
import { coreStyleCfg, CORE_STYLE_IDS } from '@/data/coreStyles.js';
import { coreFacets } from '@/data/upgradeGeometry.js';

/* ── Каркас ─────────────────────────────────────────────────────────────
   Бокс 200×200, центр 100,100, внешний радиус 86. Шестиугольник вершиной
   вверх: вершины через 60°, лучи идут в каждую вторую — вверх (-90°),
   вправо-вниз (30°), влево-вниз (150°). Эти числа общие для всех вариантов;
   всё, что варианты меняют, лежит в src/data/coreStyles.js. */
const BOX = 200;
const C = 100;
const R = 86;

const RAY_DEG = { a: -90, b: 30, c: 150 };   // вверх · вправо-вниз · влево-вниз
const HEX_DEG = [-90, -30, 30, 90, 150, 210];
/* Знаки манеры нарисованы для бокса 200×200 с внешним гексом r=78. */
const SIGIL_SRC_R = 78;

const rad = (d) => (d * Math.PI) / 180;
const px = (v) => Math.round(v * 100) / 100;
const pt = (deg, r, cx = C, cy = C) => [cx + Math.cos(rad(deg)) * r, cy + Math.sin(rad(deg)) * r];
const poly = (pts) => pts.map((p) => `${px(p[0])},${px(p[1])}`).join(' ');
const hex = (r, cx = C, cy = C) => poly(HEX_DEG.map((d) => pt(d, r, cx, cy)));

/* Неровность огранки — стабильная, а не случайная: один и тот же кристалл
   обязан выглядеть одинаково между перерисовками. */
function wobble(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;   // −1..1
}

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
   AMBUSH был красный. Сплошной цвет (центр, контур, кристаллы) при этом был
   верный, что и маскировало дефект. */
const uid = useId();
const cfg = computed(() => coreStyleCfg(props.styleId));
const simple = computed(() => props.size < 48);

const lit = computed(() => ({
  a: Math.max(0, Math.min(5, Number(props.branches?.a) || 0)),
  b: Math.max(0, Math.min(5, Number(props.branches?.b) || 0)),
  c: Math.max(0, Math.min(5, Number(props.branches?.c) || 0)),
}));

/* Задействована ветка = в ней горит хотя бы одна грань.
   Ступеней четыре: 0 / 1 / 2 / 3 ветки. */
const engaged = computed(() => ['a', 'b', 'c'].filter((k) => lit.value[k] > 0).length);
const LUM = [0.1, 0.36, 0.64, 1];

/* У нейтральной фигуры (первый экран витрины) центр горит ВСЕГДА: розового
   у ядер нет, и показать бренд нечем, кроме ровного нейтрального света в
   сердцевине. Ветки при этом остаются тёмными — они просто не зажжены. */
const rootVars = computed(() => ({
  '--hc-hue': props.core ? `var(--core-${props.core})` : 'var(--ink)',
  '--hc-lum': String(props.core ? LUM[engaged.value] : 1),
  '--hc-beat': props.core ? `var(--d-pulse-${props.core})` : 'var(--d-loop)',
  '--hc-flow-w': `${cfg.value.flowW}`,
}));

const label = computed(() => {
  const n = lit.value.a + lit.value.b + lit.value.c;
  return `${props.core ? props.core.toUpperCase() : 'NEUTRAL'} core, ${n} of 5 facets lit`;
});

/* Ветка: тело канала, светящаяся жила, радиус обрезки света, пять граней. */
const branches3 = computed(() => {
  const k = cfg.value;
  return ['a', 'b', 'c'].map((id, bi) => {
    const deg = RAY_DEG[id];
    const dx = Math.cos(rad(deg));
    const dy = Math.sin(rad(deg));
    const nx = -dy;   // перпендикуляр
    const ny = dx;
    const n = lit.value[id];

    const tipR = R * k.tipFrac;
    const [tipX, tipY] = [C + dx * tipR, C + dy * tipR];

    /* Тело ветки: сужающийся кристалл (полуширина от chanW0 к chanW1). */
    const at = (t, w) => [C + dx * t + nx * w, C + dy * t + ny * w];
    const shard = poly([
      at(0, k.chanW0), at(tipR, k.chanW1), at(tipR, -k.chanW1), at(0, -k.chanW0),
    ]);
    /* Жила внутри кристалла — уже тела, той же формы. */
    const vw0 = Math.min(k.chanW0, k.flowW * 0.5 + 1.5);
    const vw1 = Math.min(k.chanW1, k.flowW * 0.28 + 0.6);
    const vein = poly([
      at(0, vw0), at(tipR, vw1), at(tipR, -vw1), at(0, -vw0),
    ]);

    const wallOff = k.chanW0;
    const wallA = 15;
    const wallB = R * 0.9;
    const wall = (sign) => ({
      x1: C + dx * wallA + nx * wallOff * sign,
      y1: C + dy * wallA + ny * wallOff * sign,
      x2: C + dx * wallB + nx * wallOff * sign,
      y2: C + dy * wallB + ny * wallOff * sign,
    });
    /* Освещена та стенка, что смотрит вверх-влево: свет в зале один и сверху. */
    const up = ny < 0 || (ny === 0 && nx < 0);
    const hi = wall(up ? 1 : -1);
    const lo = wall(up ? -1 : 1);

    const nodes = k.nodeT.map((t, i) => {
      const tip = i === k.nodeT.length - 1;
      const r = tip && simple.value ? k.tipRsimple : k.nodeR[i];
      const cx = C + dx * t * R;
      const cy = C + dy * t * R;
      const along = r * k.nodeLong;
      const across = r * 0.88;
      /* Четыре угла ромба; при nodeRough > 0 каждый угол чуть сбит — огранка
         перестаёт быть правильной, кристалл выглядит выращенным. */
      const w = (corner, amp) => 1 + wobble(bi * 17 + i * 5 + corner) * k.nodeRough * amp;
      const gem = (kx) => poly([
        [cx + dx * along * kx * w(0, 0.5), cy + dy * along * kx * w(0, 0.5)],
        [cx + nx * across * kx * w(1, 0.8), cy + ny * across * kx * w(1, 0.8)],
        [cx - dx * along * kx * w(2, 0.3), cy - dy * along * kx * w(2, 0.3)],
        [cx - nx * across * kx * w(3, 0.8), cy - ny * across * kx * w(3, 0.8)],
      ]);
      return { i: i + 1, lit: i < n, points: gem(1), inner: gem(0.46) };
    });

    /* Свет доходит до последней горящей грани и обнимает её. */
    const litR = n > 0 ? px(R * k.nodeT[n - 1] + k.nodeR[n - 1] * 0.9) : 0;

    return {
      id, lit: n, litR,
      tipX: px(tipX), tipY: px(tipY),
      shard, vein,
      hiX1: px(hi.x1), hiY1: px(hi.y1), hiX2: px(hi.x2), hiY2: px(hi.y2),
      loX1: px(lo.x1), loY1: px(lo.y1), loX2: px(lo.x2), loY2: px(lo.y2),
      nodes,
    };
  });
});

/* Зона = кит между двумя соседними лучами: центр → вершина → промежуточная
   вершина шестиугольника → вершина. Сила сплава = МЕНЬШАЯ из двух глубин:
   гибрид силён настолько, насколько вложена более слабая из пары. */
/* Ступени блика по пластинам: свет в зале один и сверху, поэтому верхняя
   левая пластина ловит его сильнее, нижняя почти не ловит. Внутренний ramp
   рисунка, палитру не расширяет. */
const TILT = {
  high: [0.14, 0.07, 0.025],
  mid:  [0.03, 0.085, 0.05],
  low:  [0.02, 0.045, 0.012],
};

const ZONE_DEF = [
  { id: 'ab', from: 'a', to: 'b', mid: -30, shade: 'mid',  cdeg: -30 },  // верх-право
  { id: 'bc', from: 'b', to: 'c', mid: 90,  shade: 'low',  cdeg: 90 },   // низ
  { id: 'ca', from: 'c', to: 'a', mid: 210, shade: 'high', cdeg: 210 },  // верх-лево
];

/* Кратчайшая разница углов, в градусах, в (−180, 180]. */
function angDelta(a, b) {
  let d = ((b - a + 540) % 360) - 180;
  return d;
}

const zones3 = computed(() => {
  const inset = cfg.value.plateInset;
  return ZONE_DEF.map((z) => {
    const [cxp, cyp] = pt(z.cdeg, R * 0.32);
    const aFrom = RAY_DEG[z.from];
    const aTo = RAY_DEG[z.to];
    const corners = [[C, C], pt(aFrom, R), pt(z.mid, R), pt(aTo, R)];

    /* Пластина. Внешний край ОСТАЁТСЯ на R — силуэт складывают сами
       пластины, внешней линии у этого варианта нет. Щели открываются там,
       где им место: вдоль лучей (края отведены от ветки) и у ступицы
       (внутренний угол вынесен наружу по биссектрисе), — сквозь них виден
       свет ядра. Прежний вариант сжимал пластину к её центру тяжести, и три
       плоские грани сходились в точку: получалась та самая коробка. */
    const da = inset > 0 ? (Math.atan2(inset, R) * 180) / Math.PI : 0;
    const eFrom = aFrom + Math.sign(angDelta(aFrom, z.mid)) * da;
    const eTo = aTo + Math.sign(angDelta(aTo, z.mid)) * da;
    const hub = pt(z.mid, inset * 1.9);
    const pFrom = pt(eFrom, R);
    const pTo = pt(eTo, R);
    const plate = poly([hub, pFrom, pt(z.mid, R), pTo]);

    return {
      id: z.id,
      shade: z.shade,
      strength: Math.min(lit.value[z.from], lit.value[z.to]),
      points: poly(corners),
      plate,
      /* Наклон пластины: блик идёт поперёк, от одного луча к другому.
         Разные концы у трёх пластин — разный наклон, плоскость перестаёт
         читаться гранью куба. */
      tx1: px(pFrom[0]), ty1: px(pFrom[1]), tx2: px(pTo[0]), ty2: px(pTo[1]),
      cx: px(cxp), cy: px(cyp), r: px(R * 0.82),
    };
  });
});

const rimPoints = computed(() => hex(R));
const heartOuter = computed(() => hex(cfg.value.heartR));
const heartInner = computed(() => hex(cfg.value.heartSeed));
/* Огранка сердцевины. Мелкому камню хватает трёх рёбер к вершинам; крупному
   нужна площадка — иначе три ребра продолжают ветки и камень читается кубиком
   внутри внешнего шестиугольника. */
const heartTable = computed(() => hex(cfg.value.heartR * 0.52));
const heartCuts = computed(() => {
  const r = cfg.value.heartR;
  if (cfg.value.heartFacets === 'table') {
    // шесть коротких рёбер от площадки к вершинам камня
    return HEX_DEG.map((d) => {
      const [x1, y1] = pt(d, r * 0.52);
      const [x2, y2] = pt(d, r);
      return [px(x1), px(y1), px(x2), px(y2)];
    });
  }
  return [-90, 30, 150].map((d) => {
    const [x, y] = pt(d, r);
    return [px(x), px(y), C, C];
  });
});

/* Знак манеры — разметка нынешней иконки ядра как есть, вписанная в сердце. */
const sigilInner = computed(() => (props.core ? coreFacets(props.core) : ''));
const sigilTransform = computed(() => {
  const s = cfg.value.heartR / SIGIL_SRC_R;
  return `translate(${px(C - C * s)} ${px(C - C * s)}) scale(${px(s)})`;
});
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

/* Нейтральная фигура: контур тёмный и едва заметный. Светлый контур читался
   белым шестиугольником и лез в глаза как логотип — а логотип единственный,
   у кого белая обводка. Горит только центр. */
.hc--neutral .hc-rim {
  stroke: var(--ink-off);
  stroke-opacity: .3;
  filter: none;
}
.hc--neutral .hc-shard { stroke-opacity: .07; }
.hc--neutral .hc-zone { fill-opacity: .02; }

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

.hc--background .hc-flow,
.hc--background .hc-vein,
.hc--background .hc-node.is-lit .hc-node__gem,
.hc--background .hc-heart__seed { filter: none; }
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
