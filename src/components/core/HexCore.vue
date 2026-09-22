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
import { computed, useId } from 'vue';
import { coreFigure, MODES } from '@/data/coreFigure.js';
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
});

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

const rootStyle = computed(() => (props.hue ? { color: props.hue } : null));
</script>

<style scoped>
.hc {
  display: block;
  overflow: visible;
}
</style>
