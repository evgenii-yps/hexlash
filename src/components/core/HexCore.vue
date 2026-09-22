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
    :data-core-five="fillFive ? '1' : null"
    :data-core-swap="swapping ? '1' : null"
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
           приходят переменными, расписание — в src/styles/core-facets.css.
           ⚠️ ОДИН НА ВСЕ ВЕТКИ С ОДИНАКОВЫМ ХОДОМ. Печать симметрична, свет
           расходится из середины кругом — трём веткам основного хода нужна
           одна обрезка, а не три одинаковых. Три анимации вместо одной стоили
           лишнего времени кадра на медленном телефоне. -->
      <template v-if="showFacets">
        <clipPath v-for="c in litClips" :key="`cp${c.key}`" :id="id('flow-' + c.key)">
          <circle cx="0" cy="0" r="1" :data-core-flow="c.flow" :style="c.stopVars" />
        </clipPath>
      </template>
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

    <!-- Зоны сплава. Проявляются по мере заполнения веток.
         ⚠️ Прозрачность ведёт ГРУППА, а не каждая зона: анимаций три было,
         стала одна. Своей прозрачности у зон внутри нет — её целиком задаёт
         расписание (--zone-max). -->
    <g v-if="showFacets && m.zone > 0" class="hc-facets">
      <g :data-core-zone="zoneTrack">
        <polygon
          v-for="z in litZones"
          :key="`lz${z.id}`"
          :points="z.points"
          :fill="url('zone')"
        />
      </g>
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

    <!-- Горящая часть ветки. Одна сплошная полоса без делений: пятью её
         делает не рисунок, а остановки растущего круга-обрезки. -->
    <g v-if="showFacets" class="hc-facets">
      <!-- ⚠️ Общая жизнь слоя (держится — гаснет — пауза) ведёт ГРУППА:
           анимаций было по одной на ветку, стала одна на все. -->
      <g :data-core-lit="1">
        <g
          v-for="b in litBranches"
          :key="`lit${b.id}`"
          :clip-path="`url(#${id('flow-' + b.clipKey)})`"
        >
          <polygon :points="b.strip" fill="currentColor" :fill-opacity="m.facet" />
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
    <g v-if="showFacets" class="hc-facets">
      <circle
        :data-core-heart="fillFive ? 'pair' : 'all'"
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
import { coreFigure, MODES, FACETS } from '@/data/coreFigure.js';
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
  /* ⚠️ ЗАПАСНОЙ РЕЖИМ, ПО УМОЛЧАНИЮ ВЫКЛЮЧЕН. false — основной ход: все три
     ветки идут одновременно и доходят до вершины, горят все пятнадцать
     граней. true — прежнее правило «не больше пяти, как в игре»: три на
     первой ветке, две на второй, третья не участвует. Владелец просил
     оставить его наготове; переключается этим одним свойством.
     ⚠️ В САМОЙ ИГРЕ правило «не больше пяти» не меняется — это только фон. */
  fillFive: { type: Boolean, default: false },
  /* Метка раздела. Сменилась — горящие грани гаснут вместе со сменой цвета,
     и цикл стартует заново в новом цвете. */
  cycleKey: { type: [String, Number, null], default: null },
});

/* Сколько граней зажигает каждая ветка и по какой дорожке кадров идёт.
   Порядок веток — верхняя, правая нижняя, левая нижняя.
   Основной ход: все три одновременно, до вершины.
   Запасной «3 + 2»: первая и вторая по очереди, третья не участвует. */
const RUN_ALL = [{ lit: FACETS, flow: 1 }, { lit: FACETS, flow: 1 }, { lit: FACETS, flow: 1 }];
const RUN_FIVE = [{ lit: 3, flow: 1 }, { lit: 2, flow: 2 }, { lit: 0, flow: 1 }];

/* Насколько ярче становится сердце. Приглушённый режим поднимает мягче —
   доли те же, масштаб от m.facet. */
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

const run = computed(() => (props.fillFive ? RUN_FIVE : RUN_ALL));

/* Ветки, которые участвуют в цикле, с их местом в очереди и радиусами
   остановок. Ветке, которая зажигает меньше пяти частей, лишние остановки
   приходят равными последней: шаг проходит, а радиус не меняется — на экране
   ничего не происходит. */
const litBranches = computed(() => fig.value.branches
  .map((b, i) => {
    const { lit, flow } = run.value[i];
    return { ...b, flow, lit, clipKey: `${flow}-${lit}` };
  })
  .filter((b) => b.lit > 0));

/* Обрезки. Ветки с одинаковой дорожкой и одинаковым числом частей идут
   след в след, и обрезка им нужна одна: у основного хода — одна на все три,
   у запасного «3 + 2» — две. */
const litClips = computed(() => {
  const seen = new Map();
  for (const b of litBranches.value) {
    if (seen.has(b.clipKey)) continue;
    const stopVars = {};
    for (let k = 0; k <= FACETS; k++) {
      stopVars[`--f${k}`] = String(b.stops[Math.min(k, b.lit)]);
    }
    /* Конечное состояние — для «уменьшить движение». */
    stopVars['--f-final'] = String(b.stops[b.lit]);
    seen.set(b.clipKey, { key: b.clipKey, flow: b.flow, stopVars });
  }
  return [...seen.values()];
});

/* Зоны сплава. Основной ход: все три проявляются по мере заполнения.
   Запасной «3 + 2»: одна, между двумя работающими ветками. */
const litZones = computed(() => (props.fillFive ? [fig.value.zones[0]] : fig.value.zones));
const zoneTrack = computed(() => (props.fillFive ? '2' : 'all'));

const liftVars = computed(() => {
  const k = m.value.facet / MODES.full.facet;
  const v = LIFT.map((x) => (x * k).toFixed(3));
  const max = props.fillFive ? v[1] : v[2];
  return {
    '--lift1': v[0], '--lift2': v[1], '--lift-max': max,
    /* Конечное состояние — для «уменьшить движение». */
    '--lift-final': max,
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

/* --core-c читают кадры анимации: середина фигуры одна, а координат в
   таблице стилей нет ни одной. */
const rootStyle = computed(() => ({
  '--core-c': `${fig.value.c}px`,
  /* Докуда доходит зона сплава. В приглушённом режиме мягче — доля та же,
     что у неподвижных зон под ней. */
  '--zone-max': (m.value.zone / MODES.full.zone).toFixed(3),
  ...(props.hue ? { color: props.hue } : null),
}));
</script>

<style scoped>
.hc {
  display: block;
  overflow: visible;
}
</style>
