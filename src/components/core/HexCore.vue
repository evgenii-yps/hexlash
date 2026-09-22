<template>
  <!-- ЯДРО «ПЕЧАТЬ». Рисунок целиком выведен из src/data/coreFigure.js —
       здесь только раскладка. Своих координат в этом файле нет.

       ⚠️ Цвет фигура берёт наследованием (currentColor). Родитель ставит
       `color`, и вся фигура перетекает вместе с ним одним свойством — так
       устроен фон лендинга. Прописывать цвет по узлам нельзя: тогда при смене
       раздела браузер пересчитывает шесть десятков узлов вместо одного.

       ⚠️ Порядок слоёв снизу вверх: ореол · пластина · зоны · ветки · контур ·
       внутренний контур · сердце. Это порядок эталона, менять нельзя. -->
  <svg
    class="hc"
    :class="`hc--${mode}`"
    :viewBox="`0 0 ${fig.box} ${fig.box}`"
    :width="size || undefined"
    :height="size || undefined"
    :style="rootStyle"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <radialGradient :id="id('plate')">
        <stop offset="0" stop-color="#191420" stop-opacity=".95" />
        <stop offset="1" stop-color="#0d0b11" stop-opacity=".55" />
      </radialGradient>
      <radialGradient :id="id('glow')">
        <stop offset="0" stop-color="currentColor" :stop-opacity="m.glow" />
        <stop offset=".45" stop-color="currentColor" :stop-opacity="m.glow * .4" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="id('zone')">
        <stop offset="0" stop-color="currentColor" stop-opacity=".55" />
        <stop offset="1" stop-color="currentColor" stop-opacity=".04" />
      </radialGradient>
      <radialGradient :id="id('gem')" cx=".45" cy=".4">
        <stop offset="0" stop-color="currentColor" stop-opacity="1" />
        <stop offset="1" stop-color="currentColor" stop-opacity=".55" />
      </radialGradient>
      <radialGradient :id="id('gemglow')">
        <stop offset="0" stop-color="currentColor" stop-opacity=".5" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </radialGradient>

      <!-- Круг-заполнитель: стоит в середине ядра, растёт наружу. Радиусы
           приходят переменными, расписание — в src/styles/core-facets.css. -->
      <clipPath v-for="b in litBranches" :key="`cp${b.id}`" :id="id('flow-' + b.id)">
        <circle
          cx="0" cy="0" r="1"
          :data-core-flow="b.slot"
          :style="{ '--facet-from': String(b.flowStart), '--facet-to': String(b.flowTo) }"
        />
      </clipPath>
    </defs>

    <!-- Ореол вокруг фигуры. -->
    <circle :cx="fig.c" :cy="fig.c" :r="fig.haloR" :fill="url('glow')" />
    <!-- Пластина. -->
    <polygon :points="fig.plate" :fill="url('plate')" />

    <!-- Зоны между ветками. В тихом режиме не рисуются вовсе. -->
    <template v-if="m.zone > 0">
      <polygon
        v-for="z in fig.zones"
        :key="`z${z.id}`"
        :points="z.points"
        :opacity="m.zone"
        :fill="url('zone')"
      />
    </template>

    <!-- Зона сплава. Проявляется, когда включается соседняя ветка. -->
    <g v-if="showFacets && m.zone > 0" :class="facetClass">
      <polygon
        v-for="z in litZones"
        :key="`lz${z.id}`"
        :data-core-zone="z.slot"
        :points="z.points"
        :opacity="m.zone"
        :fill="url('zone')"
      />
    </g>

    <!-- Три ветки-клина. Без шипов, кристаллов и узоров внутри. -->
    <polygon
      v-for="b in fig.branches"
      :key="`b${b.id}`"
      :points="b.points"
      fill="#120f17"
      stroke="currentColor"
      :stroke-opacity="m.branch"
      stroke-width="1.3"
      stroke-linejoin="round"
    />

    <!-- Разрезы между гранями. Видны и когда грань погасла: ветка читается
         цельным клином, но поделённым на пять. -->
    <g :stroke="CUT_COLOR" :stroke-width="CUT_WIDTH" stroke-linecap="butt">
      <line
        v-for="(c, i) in allCuts"
        :key="`cut${i}`"
        :x1="c.x1" :y1="c.y1" :x2="c.x2" :y2="c.y2"
      />
    </g>

    <!-- Горящие грани. Каждая ветка обрезана своим кругом, который растёт из
         середины наружу: цвет втекает в грань от края, ближнего к сердцу. -->
    <g v-if="showFacets" :class="facetClass">
      <g
        v-for="b in litBranches"
        :key="`lit${b.id}`"
        :clip-path="`url(#${id('flow-' + b.id)})`"
      >
        <g :data-core-lit="1">
          <polygon
            v-for="f in b.facets"
            :key="`f${b.id}${f.i}`"
            :points="f.points"
            fill="currentColor"
            :fill-opacity="m.facet"
          />
        </g>
      </g>
    </g>

    <!-- Контур. Шесть сторон по отдельности, каждая мерцает своим ритмом:
         широкая полупрозрачная обводка даёт свечение, чёткая — линию.
         Размытия здесь нет намеренно, см. src/data/coreFigure.js. -->
    <g
      v-for="(s, i) in fig.sides"
      :key="`s${i}`"
      :data-core-flick="flicker ? '1' : null"
      :style="flicker ? { '--core-flick-dur': `${s.dur}s`, '--core-flick-del': `${s.del}s` } : null"
    >
      <line
        :x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2"
        stroke="currentColor"
        :stroke-opacity="m.contour * .18"
        :stroke-width="fig.gw"
        stroke-linecap="round"
      />
      <line
        :x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2"
        stroke="currentColor"
        :stroke-opacity="m.contour"
        :stroke-width="fig.cw"
        stroke-linecap="square"
      />
    </g>

    <!-- Внутренний контур. Не мерцает. -->
    <polygon
      :points="fig.inner"
      fill="none"
      stroke="currentColor"
      :stroke-opacity="m.contour * .35"
      stroke-width="1.2"
    />

    <!-- Сердце. -->
    <circle :cx="fig.c" :cy="fig.c" :r="fig.heart.glowR" :fill="url('gemglow')" />
    <!-- Сердце ярче с каждой задействованной веткой. -->
    <g v-if="showFacets" :class="facetClass">
      <circle
        :data-core-heart="1"
        :cx="fig.c" :cy="fig.c" :r="fig.heart.glowR"
        :fill="url('gemglow')"
        :style="liftVars"
      />
    </g>
    <polygon
      :points="fig.heart.frame"
      fill="#0b0910"
      stroke="currentColor"
      :stroke-opacity="m.heart"
      :stroke-width="fig.heart.frameW"
      stroke-linejoin="round"
    />
    <polygon
      :points="fig.heart.ring"
      fill="none"
      stroke="currentColor"
      :stroke-opacity="m.heart * .35"
      stroke-width="1"
    />
    <polygon :points="fig.heart.gem" :fill="url('gem')" />
  </svg>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount, useId } from 'vue';
import { coreFigure, MODES, CUT_COLOR, CUT_WIDTH, FACETS } from '@/data/coreFigure.js';
/* Стоп-кадры мерцания — src/styles/core-flicker.css, подключён глобально
   в src/main.js (отсюда сборка выносила его отдельным файлом и добавляла
   лендингу лишний сетевой запрос). Тот же файл переносится в деку. */

const props = defineProps({
  /* Режим яркости: full — цветные разделы, muted — дека, quiet — розовые
     разделы лендинга и экран входа. */
  mode: { type: String, default: 'full' },
  /* Цвет фигуры. Пусто — берётся у родителя (currentColor): так фон лендинга
     перетекает одним свойством. Строка — ставится на корень. */
  hue: { type: String, default: '' },
  /* Мерцание контура. */
  flicker: { type: Boolean, default: true },
  /* Размер в точках. Пусто — фигура занимает бокс родителя. */
  size: { type: Number, default: null },
  /* Медленное заполнение граней. На розовых разделах и на входе выключено:
     там по правилу горит только сердце. */
  fill: { type: Boolean, default: true },
  /* ⚠️ ЗАПАСНОЙ РЕЖИМ, ПО УМОЛЧАНИЮ ВЫКЛЮЧЕН. false — как в игре: горит не
     больше пяти граней (3 на первой ветке + 2 на второй), боец дорос до
     потолка и стал гибридом. true — загораются все пятнадцать. Владелец
     просил оставить второй вариант наготове; переключается этим одним
     свойством. */
  fillAll: { type: Boolean, default: false },
  /* Метка раздела. Сменилась — горящие грани гаснут вместе со сменой цвета,
     и цикл стартует заново в новом цвете. */
  cycleKey: { type: [String, Number, null], default: null },
});

/* Сколько граней зажигает каждая ветка. Порядок веток — верхняя, правая
   нижняя, левая нижняя: он же порядок заполнения. */
const LIT_DEFAULT = [3, 2, 0];
const LIT_ALL = [FACETS, FACETS, FACETS];

/* Насколько ярче становится сердце с каждой задействованной веткой.
   Приглушённый режим поднимает мягче — доли те же, масштаб от m.facet. */
const LIFT = [0.40, 0.75, 1.0];

/* ⚠️ useId, а не свой счётчик. Счётчик, объявленный на верхнем уровне
   <script setup>, попадает ВНУТРЬ setup() и у каждого экземпляра начинается
   заново — все ядра на странице получают одинаковые номера, браузер
   подставляет первый попавшийся градиент, и вся страница красится чужим
   цветом. Ровно это и случилось 21.09.2026. */
const uid = useId();
const id = (name) => `hc-${name}-${uid}`;
const url = (name) => `url(#${id(name)})`;

const fig = computed(() => coreFigure(props.mode));
const m = computed(() => MODES[props.mode] || MODES.full);

/* Заполнение имеет смысл только там, где грани вообще видны. */
const showFacets = computed(() => props.fill && m.value.facet > 0);

const litCounts = computed(() => (props.fillAll ? LIT_ALL : LIT_DEFAULT));

/* Ветки, которые участвуют в цикле, с их местом в очереди и радиусом, до
   которого дорастёт круг-заполнитель. */
const litBranches = computed(() => fig.value.branches
  .map((b, i) => ({
    ...b,
    slot: i + 1,
    lit: litCounts.value[i],
    flowTo: b.flowEnd(litCounts.value[i]),
  }))
  .filter((b) => b.lit > 0));

/* Зоны сплава: между первой и второй веткой, а в запасном режиме — ещё и
   между второй и третьей. Номер — место ветки, с приходом которой зона
   проявляется. */
const litZones = computed(() => {
  const out = [{ ...fig.value.zones[0], slot: 2 }];
  if (props.fillAll) out.push({ ...fig.value.zones[1], slot: 3 });
  return out;
});

const allCuts = computed(() => fig.value.branches.flatMap((b) => b.cuts));

const liftVars = computed(() => {
  const k = m.value.facet / MODES.full.facet;
  const n = props.fillAll ? 3 : 2;
  const v = LIFT.map((x) => (x * k).toFixed(3));
  return {
    '--lift1': v[0], '--lift2': v[1], '--lift3': v[2],
    /* Конечное состояние — для «уменьшить движение». */
    '--lift-final': v[n - 1],
  };
});

/* Смена раздела посреди цикла. Класс гасит горящие грани вместе со сменой
   цвета и снимает анимацию; когда класс уходит, цикл начинается с нуля. */
const swapping = ref(false);
let swapTimer = null;
watch(() => props.cycleKey, () => {
  if (!showFacets.value) return;
  swapping.value = true;
  if (swapTimer) clearTimeout(swapTimer);
  swapTimer = setTimeout(() => { swapping.value = false; }, 440);
});
onBeforeUnmount(() => { if (swapTimer) clearTimeout(swapTimer); });

const facetClass = computed(() => ['hc-facets', {
  'is-swap': swapping.value,
  'hc-facets--all': props.fillAll,
}]);

/* --core-c читают кадры анимации: середина фигуры одна, а координат в
   таблице стилей нет ни одной. */
const rootStyle = computed(() => ({
  '--core-c': `${fig.value.c}px`,
  ...(props.hue ? { color: props.hue } : null),
}));
</script>

<style scoped>
.hc {
  display: block;
  overflow: visible;
}
</style>
