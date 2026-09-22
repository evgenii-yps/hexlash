<template>
  <!-- РАСКЛАДКА «ВИХРЬ»: ядро в середине, кольца закручиваются вокруг него.
       Каждое следующее кольцо больше в 1.34 раза и повёрнуто ещё на 5°.

       ⚠️ Слой сам ничего не красит: цвет приходит наследованием, от родителя
       (currentColor). Так весь «Вихрь» перетекает одним свойством при смене
       раздела — а не шестью десятками узлов по отдельности.

       ⚠️ Размер и место правятся двумя числами родителя:
         --core-r  — половина стороны квадрата, в который вписано ядро
                     (радиус контура фигуры = 0.75 от него);
         --core-cy — середина «Вихря» по вертикали.
       Второго числа для размера нет: двинется --core-r — двинется всё. -->
  <div class="cv" :class="{ 'cv--auto': auto }" :style="fixedVars" aria-hidden="true">
    <!-- Коробка колец — квадрат в 20 --core-r: крайнее из семи колец
         (≈8.7) помещается с запасом. Толщина линии не растёт вместе с
         радиусом, за это отвечает vector-effect. -->
    <svg class="cv-rings" :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor">
        <polygon
          v-for="r in rings"
          :key="r.k"
          :class="`cv-ring cv-ring--${r.k}`"
          :points="r.points"
          :stroke-opacity="r.opacity"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </svg>

    <div class="cv-core">
      <HexCore :mode="mode" :flicker="flicker" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import HexCore from '@/components/core/HexCore.vue';
import { vortexRings, VORTEX } from '@/data/coreFigure.js';

const props = defineProps({
  /* full — цветные разделы, muted — дека, quiet — розовые разделы и вход. */
  mode: { type: String, default: 'full' },
  flicker: { type: Boolean, default: true },
  /* ⚠️ Три числа ниже задаются ТОЛЬКО служебной страницей /dev/core, где
     «Вихрь» показан макетами в рамках заданного размера: там ширина рамки не
     равна ширине окна, и размер по окну был бы враньём. На лендинге и деке
     они не передаются — размер и число колец ведёт ширина окна (стили ниже). */
  coreR: { type: Number, default: null },
  coreCy: { type: String, default: '' },
  ringCount: { type: Number, default: null },
});

/* Размер ведёт окно, пока сверху не передали конкретные числа. */
const auto = computed(() => props.coreR === null && !props.coreCy && props.ringCount === null);
const fixedVars = computed(() => {
  const v = {};
  if (props.coreR !== null) v['--core-r'] = `${props.coreR}px`;
  if (props.coreCy) v['--core-cy'] = props.coreCy;
  return Object.keys(v).length ? v : null;
});

/* Колец всегда семь. Лишнее на узком экране прячется стилем (.cv-ring--6):
   так число колец остаётся вопросом ширины окна, а не свойства. */
const rings = computed(
  () => vortexRings(props.ringCount ?? VORTEX.count.desktop, props.mode),
);
const half = VORTEX.span / 2;
const viewBox = `${-half} ${-half} ${VORTEX.span} ${VORTEX.span}`;
</script>

<style scoped>
.cv {
  position: absolute;
  inset: 0;

  /* ⚠️ ГЕОМЕТРИЯ «ВИХРЯ» ПРАВИТСЯ ЗДЕСЬ.
     Числа перенесены из эталона (docs/design-handoff/core_seal):
       телефон 390 — --core-r 104, середина на 338 из 844 (40%), 6 колец;
       компьютер 1440 — --core-r 250, середина на 430 из 900 (48%), 7 колец.
     Между этими ширинами размер идёт ровной прямой: 13.905vw + 49.77px даёт
     ровно 104 на 390 и ровно 250 на 1440. Шире 1440 держим 250 — фигура
     относительно экрана продолжает уменьшаться, как и задумано. */
  --core-r: clamp(104px, calc(13.905vw + 49.77px), 250px);
  --core-cy: 40%;
}

.cv-rings,
.cv-core {
  position: absolute;
  left: 50%;
  top: var(--core-cy);
  transform: translate(-50%, -50%);
  display: block;
  overflow: visible;
}

.cv-rings {
  width: calc(var(--core-r) * 20);
  height: calc(var(--core-r) * 20);
}

.cv-core {
  width: calc(var(--core-r) * 2);
  height: calc(var(--core-r) * 2);
}
.cv-core :deep(.hc) {
  width: 100%;
  height: 100%;
}

/* Седьмое кольцо — только на широком экране (эталон: телефон 6, компьютер 7).
   Правило работает, пока число колец ведёт окно: у макетов на /dev/core оно
   задано числом, и лишнее кольцо там просто не рисуется. */
.cv--auto .cv-ring--6 { display: none; }

@media (min-width: 860px) {
  .cv--auto { --core-cy: 48%; }
  .cv--auto .cv-ring--6 { display: block; }
}
</style>
