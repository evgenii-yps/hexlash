<template>
  <!-- ЯДРО HEXLASH — прототип новой формы (ТЗ 21.09.2026).
       НЕ подключено ни к лендингу, ни к деке, ни к игре. Живёт только на
       скрытой странице /dev/core до выбора владельца.

       Форма: шестиугольник вершиной вверх. Из центра к трём вершинам —
       вверх, влево-вниз, вправо-вниз — три луча (ветки развития). На каждом
       луче пять узлов (грани ветки), растущих от центра к краю. Между лучами
       три ромбовидные зоны.

       ⚠️ Цвет ядра НЕ объявляется здесь. Он приходит из src/styles/tokens.css
       выражением var(--core-<id>) и ставится на корень как --hc-hue. Второе
       объявление цвета — ошибка независимо от совпадения значений.

       ⚠️ Отрисовок две, порог один — 48 точек (как у знака). Ниже 48 узлы 1-4,
       огранка центра и свет зон убираются. Упрощённая ВЫВОДИТСЯ из полной
       через v-if, отдельного рисунка нет. -->
  <svg
    class="hc"
    :class="[`hc--${variant}`, { 'hc--simple': simple, 'hc--breathe': breathe }]"
    :style="rootVars"
    :viewBox="`0 0 ${BOX} ${BOX}`"
    :width="size"
    :height="size"
    role="img"
    :aria-label="label"
  >
    <defs>
      <!-- Свечение центра. Сила — --hc-lum, четыре ступени по числу
           задействованных веток. -->
      <radialGradient :id="`hcGlow-${uid}`" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="currentColor" stop-opacity=".55" />
        <stop offset="45%"  stop-color="currentColor" stop-opacity=".18" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </radialGradient>
      <!-- Свет, текущий по каналу: у центра ярче, к последней горящей грани гаснет. -->
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
      <!-- Свет зоны-сплава: изнутри камня, не заливкой. -->
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

    <!-- 1 · ТЕЛО. Три зоны между лучами. Освещены по-разному — это объём
         фигуры, он есть всегда, при обоих видах зон. Опорность ramp'а
         внутренняя для рисунка (как у колец волны), палитру не расширяет. -->
    <g class="hc-body">
      <polygon v-for="z in zones3" :key="`body-${z.id}`" :points="z.points" :class="`hc-zone hc-zone--${z.shade}`" />
    </g>

    <!-- 2 · СВЕТ ЗОН-СПЛАВОВ. Зона горит, когда задействованы ОБЕ соседние
         ветки; сила = меньшая из двух глубин. Вид «чистые грани» его не
         рисует вовсе. -->
    <g v-if="zoneMode === 'fusion' && !simple" class="hc-fusion">
      <polygon
        v-for="z in zones3" :key="`fus-${z.id}`"
        v-show="z.strength > 0"
        :points="z.points"
        :fill="`url(#hcZone-${uid}-${z.id})`"
        :style="{ opacity: 0.3 + (z.strength / 5) * 0.7 }"
        class="hc-fusion__zone"
      />
    </g>

    <!-- 3 · КАНАЛЫ (ветки). Паз в камне: тёмное дно + две стенки разной
         освещённости. Поверх — свет, текущий от центра до ПОСЛЕДНЕЙ горящей
         грани и не дальше. -->
    <g class="hc-channels">
      <template v-for="b in branches3" :key="`ch-${b.id}`">
        <line class="hc-groove"     :x1="C" :y1="C" :x2="b.tipX" :y2="b.tipY" />
        <line class="hc-wall hc-wall--hi" :x1="b.hiX1" :y1="b.hiY1" :x2="b.hiX2" :y2="b.hiY2" />
        <line class="hc-wall hc-wall--lo" :x1="b.loX1" :y1="b.loY1" :x2="b.loX2" :y2="b.loY2" />
        <line
          class="hc-flow"
          :x1="C" :y1="C" :x2="b.tipX" :y2="b.tipY"
          :stroke="`url(#hcFlow-${uid}-${b.id})`"
          :stroke-dasharray="b.rayLen"
          :stroke-dashoffset="b.rayLen - b.flowLen"
          :style="{ opacity: b.lit > 0 ? 1 : 0 }"
        />
      </template>
    </g>

    <!-- 4 · УЗЛЫ (грани). Огранённые кристаллы, растут от центра к вершине.
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

    <!-- 5 · ЦЕНТР. Самая яркая точка. Чем больше веток задействовано, тем
         ярче — четыре ступени в --hc-lum. -->
    <g class="hc-heart">
      <circle class="hc-heart__glow" :cx="C" :cy="C" :r="HEART_GLOW" :fill="`url(#hcGlow-${uid})`" />
      <polygon class="hc-heart__body"  :points="heartOuter" />
      <g v-if="!simple" class="hc-heart__cuts">
        <line v-for="(l, i) in heartCuts" :key="`hc-${i}`" :x1="l[0]" :y1="l[1]" :x2="l[2]" :y2="l[3]" />
      </g>
      <polygon class="hc-heart__seed" :points="heartInner" />
    </g>

    <!-- 6 · КОНТУР. Тонкий, цветом ядра. Толстой белой обводки и росчерков
         здесь нет и быть не может — это знак, а не ядро. -->
    <polygon class="hc-rim" :points="rimPoints" />
  </svg>
</template>

<script setup>
import { computed, useId } from 'vue';

/* ── Геометрия ──────────────────────────────────────────────────────────
   Бокс 200×200, центр 100,100, внешний радиус 86. Шестиугольник вершиной
   вверх: вершины через 60°, лучи идут в каждую вторую — вверх (-90°),
   вправо-вниз (30°), влево-вниз (150°). */
const BOX = 200;
const C = 100;
const R = 86;
const HEART_R = 17;      // огранённая сердцевина
const HEART_SEED = 7.5;  // самая яркая точка внутри
const HEART_GLOW = 46;   // радиус ореола центра

/* Узлы: доля радиуса и размер. Лесенка подобрана так, чтобы соседние
   кристаллы НЕ КАСАЛИСЬ: при прежних числах узлы 3-4-5 наезжали друг на друга
   и путь читался сплошной цепью, а не пятью ступенями. Зазоры по лучу (в
   единицах бокса): 5.8 · 4.2 · 2.7 · 0.7 — сужаются к краю, так и задумано,
   вершина ветки подходит к соседке вплотную. Пятый упирается в контур:
   0.915·86 + 7.0·1.12 = 86.5 при радиусе 86. */
const NODE_T = [0.275, 0.43, 0.585, 0.745, 0.915];
const NODE_R = [3.0, 3.7, 4.5, 5.4, 7.0];
const NODE_LONG = 1.12;   // вытянутость кристалла вдоль луча
/* Ниже 48 точек от ветки остаётся одна вершина, и на 24 точках кристалл в 7
   единиц — полпикселя. Упрощённая отрисовка берёт ту же форму, только тяжелее:
   одно число, не второй рисунок. */
const TIP_R_SIMPLE = 11;

const RAY_DEG = { a: -90, b: 30, c: 150 };   // вверх · вправо-вниз · влево-вниз
const HEX_DEG = [-90, -30, 30, 90, 150, 210];

const rad = (d) => (d * Math.PI) / 180;
const px = (v) => Math.round(v * 100) / 100;
const pt = (deg, r, cx = C, cy = C) => [cx + Math.cos(rad(deg)) * r, cy + Math.sin(rad(deg)) * r];
const poly = (pts) => pts.map((p) => `${px(p[0])},${px(p[1])}`).join(' ');
const hex = (r, cx = C, cy = C) => poly(HEX_DEG.map((d) => pt(d, r, cx, cy)));

const props = defineProps({
  /* Идентификатор ядра. null — нейтральное состояние: центр горит ровным
     светом --ink, цвета ядра у фигуры нет (розовый первый экран витрины). */
  core: { type: String, default: null },
  /* Горящие грани по веткам: { a: 0..5, b: 0..5, c: 0..5 }. */
  branches: { type: Object, default: () => ({ a: 0, b: 0, c: 0 }) },
  /* Вид зон между лучами: 'fusion' — сплав двух веток светится;
     'plain' — чистые грани объёма, не светятся никогда. */
  zoneMode: { type: String, default: 'fusion' },
  size: { type: Number, default: 128 },
  breathe: { type: Boolean, default: false },
  /* normal · muted (без свечения) · selected · foe (тусклее) · background */
  variant: { type: String, default: 'normal' },
});

/* ⚠️ Ключ для id градиентов обязан быть УНИКАЛЬНЫМ НА ДОКУМЕНТ.
   Здесь стоял счётчик `let _uid = 0` рядом с props — и это была ошибка:
   в <script setup> всё, кроме импортов, компилируется ВНУТРЬ setup(), то есть
   счётчик заводился заново на каждый экземпляр и все получали «1». Браузер
   на одинаковый url(#…) берёт ПЕРВЫЙ такой элемент в документе, поэтому на
   листе все тридцать два ядра красились градиентами первого — свет в каналах
   у BULWARK и AMBUSH был красный. Сплошной цвет (центр, контур, кристаллы)
   при этом был верный, что и маскировало дефект. */
const uid = useId();
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
}));

const label = computed(() => {
  const n = lit.value.a + lit.value.b + lit.value.c;
  return `${props.core ? props.core.toUpperCase() : 'NEUTRAL'} core, ${n} of 5 facets lit`;
});

/* Ветка: канал, стенки, свет до последней горящей грани, пять узлов. */
const branches3 = computed(() =>
  ['a', 'b', 'c'].map((id) => {
    const deg = RAY_DEG[id];
    const dx = Math.cos(rad(deg));
    const dy = Math.sin(rad(deg));
    const nx = -dy;   // перпендикуляр
    const ny = dx;
    const n = lit.value[id];

    const tipR = R * 0.935;
    const [tipX, tipY] = [C + dx * tipR, C + dy * tipR];
    /* Свет доходит РОВНО до последней горящей грани и не дальше. */
    const flowR = n > 0 ? R * NODE_T[n - 1] : 0;

    const wallOff = 10.4;
    const wallA = 15;             // стенка начинается за сердцевиной
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

    const nodes = NODE_T.map((t, i) => {
      const tip = i === NODE_T.length - 1;
      const r = tip && simple.value ? TIP_R_SIMPLE : NODE_R[i];
      const cx = C + dx * t * R;
      const cy = C + dy * t * R;
      const along = r * NODE_LONG;
      const across = r * 0.88;
      const gem = (kx) => poly([
        [cx + dx * along * kx, cy + dy * along * kx],
        [cx + nx * across * kx, cy + ny * across * kx],
        [cx - dx * along * kx, cy - dy * along * kx],
        [cx - nx * across * kx, cy - ny * across * kx],
      ]);
      return { i: i + 1, lit: i < n, points: gem(1), inner: gem(0.46) };
    });

    return {
      id,
      lit: n,
      tipX: px(tipX), tipY: px(tipY),
      rayLen: px(tipR),
      flowLen: px(flowR),
      hiX1: px(hi.x1), hiY1: px(hi.y1), hiX2: px(hi.x2), hiY2: px(hi.y2),
      loX1: px(lo.x1), loY1: px(lo.y1), loX2: px(lo.x2), loY2: px(lo.y2),
      nodes,
    };
  }),
);

/* Зона = кит между двумя соседними лучами: центр → вершина → промежуточная
   вершина шестиугольника → вершина. Сила сплава = МЕНЬШАЯ из двух глубин:
   гибрид силён настолько, насколько вложена более слабая из пары. */
const ZONE_DEF = [
  { id: 'ab', from: 'a', to: 'b', mid: -30, shade: 'mid',  cdeg: -30 },  // верх-право
  { id: 'bc', from: 'b', to: 'c', mid: 90,  shade: 'low',  cdeg: 90 },   // низ
  { id: 'ca', from: 'c', to: 'a', mid: 210, shade: 'high', cdeg: 210 },  // верх-лево
];

const zones3 = computed(() =>
  ZONE_DEF.map((z) => {
    const [cxp, cyp] = pt(z.cdeg, R * 0.32);
    return {
      id: z.id,
      shade: z.shade,
      strength: Math.min(lit.value[z.from], lit.value[z.to]),
      points: poly([[C, C], pt(RAY_DEG[z.from], R), pt(z.mid, R), pt(RAY_DEG[z.to], R)]),
      cx: px(cxp), cy: px(cyp), r: px(R * 0.82),
    };
  }),
);

const rimPoints = computed(() => hex(R));
const heartOuter = computed(() => hex(HEART_R));
const heartInner = computed(() => hex(HEART_SEED));
/* Огранка сердцевины — три ребра от вершин к центру: свет преломляется,
   а не лежит плоским кругом. */
const heartCuts = computed(() =>
  [-90, 30, 150].map((d) => {
    const [x, y] = pt(d, HEART_R);
    return [px(x), px(y), C, C];
  }),
);
</script>

<style scoped>
.hc {
  display: block;
  color: var(--hc-hue);
  overflow: visible;
}

/* ── Тело: три зоны, три ступени освещённости ───────────────────────────
   Ramp внутренний для рисунка — такой же, как ступени прозрачности у колец
   волны. Палитру он не расширяет: цвет один, --ink. */
.hc-zone        { fill: var(--ink); stroke: none; }
.hc-zone--high  { fill-opacity: .10; }
.hc-zone--mid   { fill-opacity: .062; }
.hc-zone--low   { fill-opacity: .032; }

/* ── Каналы ─────────────────────────────────────────────────────────── */
.hc-groove {
  stroke: var(--void);
  stroke-width: 21;
  stroke-linecap: round;
}
.hc-wall { stroke-width: 1.2; stroke-linecap: round; }
.hc-wall--hi { stroke: var(--ink); stroke-opacity: .22; }
.hc-wall--lo { stroke: var(--ink); stroke-opacity: .07; }
.hc-flow {
  stroke-width: 13;
  stroke-linecap: round;
  filter: drop-shadow(0 0 5px currentColor);
  transition: stroke-dashoffset var(--d-panel) var(--e-settle),
              opacity var(--d-fast);
}

/* ── Узлы ───────────────────────────────────────────────────────────── */
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
.hc-heart__seed {
  fill: currentColor;
  fill-opacity: calc(.24 + var(--hc-lum) * .76);
  filter: drop-shadow(0 0 calc(2px + var(--hc-lum) * 7px) currentColor);
}

/* ── Контур ─────────────────────────────────────────────────────────── */
.hc-fusion__zone { transition: opacity var(--d-panel) var(--e-settle); }

.hc-rim {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-opacity: .5;
  filter: drop-shadow(0 0 3px color-mix(in srgb, currentColor 55%, transparent));
}

/* ── Состояния ──────────────────────────────────────────────────────── */
/* Приглушённое: свечения нет вовсе, плоский цвет — для полок, где ядер много.
   Свет зон-сплавов тоже гаснет: он такое же свечение, как остальные. */
.hc--muted .hc-fusion { display: none; }
.hc--muted .hc-flow,
.hc--muted .hc-node.is-lit .hc-node__gem,
.hc--muted .hc-heart__seed,
.hc--muted .hc-rim { filter: none; }
.hc--muted .hc-heart__glow { display: none; }

.hc--foe { opacity: .55; }

.hc--selected .hc-rim { stroke-opacity: 1; stroke-width: 2; }

.hc--background .hc-flow,
.hc--background .hc-node.is-lit .hc-node__gem,
.hc--background .hc-heart__seed { filter: none; }
.hc--background { opacity: .5; }

/* ── Дыхание центра в ритме ядра ────────────────────────────────────── */
/* Кадры 0% и 100% одинаковы — при «уменьшить движение» петля встаёт в покой. */
.hc--breathe .hc-heart__glow,
.hc--breathe .hc-heart__seed {
  animation: hc-beat var(--hc-beat) var(--e-settle) infinite;
}
@keyframes hc-beat {
  0%   { opacity: var(--hc-lum); }
  50%  { opacity: calc(var(--hc-lum) * .62); }
  100% { opacity: var(--hc-lum); }
}
.hc--breathe .hc-heart__seed { animation-name: hc-beat-seed; }
@keyframes hc-beat-seed {
  0%   { transform: scale(1); }
  50%  { transform: scale(.88); }
  100% { transform: scale(1); }
}
.hc--breathe .hc-heart__seed { transform-origin: 100px 100px; }
</style>
