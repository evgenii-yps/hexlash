<template>
  <!-- Общий фон лендинга и экрана входа. Рисунок — «чистая волна»: семь
       вложенных шестиугольных колец из одной точки за словом HEXLASH.
       Внутри колец пусто — только линии.

       ⚠️ ВНУТРЬ КОЛЕЦ УЗОР НЕ ВОЗВРАЩАТЬ. Здесь была мелкая сотовая сетка
       (ячейка 24 точки) с радиальным затуханием — снята 20.09.2026 по
       решению владельца: внутри должны быть только линии. Если центр волны
       когда-нибудь покажется провалом, это лечится размером и силой
       подсветки, а не узором внутри колец.

       ⚠️ ВТОРОЙ ЭКЗЕМПЛЯР РИСУНКА ЖИВЁТ В public/deckinvestors/index.html
       (блок «ВОЛНА»). Менять парой. Общего источника быть не может: дека —
       статическая страница вне сборки, а общий файл означал бы новый сетевой
       запрос, который для обеих страниц запрещён.

       ⚠️ НИЧЕГО НЕ ДВИЖЕТСЯ. Здесь были: реакция узора на курсор, дыхание
       подсветки и летящие частицы — сняты 20.09.2026 по решению владельца.
       Волна — рисунок с центром; слой, который едет за курсором, превращает
       её в желе. Полосы и зерно оставлены — это плёночная фактура, а не узор.
       Новые петли заводить нельзя. -->
  <div class="lp-bg" :style="bgVars" aria-hidden="true">
    <div class="lp-bg__base"></div>

    <!-- Сила розового во всей волне — одним числом (--lp-wave-strength).
         Лендинг 1, дека 0.5. -->
    <div class="lp-bg__wave">
      <!-- Семь колец. viewBox в долях базового радиуса R (R = 100 единиц),
           центр 850,850. Толщина линии не растёт вместе с радиусом —
           за это отвечает vector-effect. -->
      <svg class="lp-bg__rings" viewBox="0 0 1700 1700" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" stroke="currentColor" vector-effect="non-scaling-stroke">
          <polygon points="850,750 763.4,800 763.4,900 850,950 936.6,900 936.6,800" stroke-opacity=".34" stroke-width="2" vector-effect="non-scaling-stroke"/>
          <polygon points="850,677 700.18,763.5 700.18,936.5 850,1023 999.82,936.5 999.82,763.5" stroke-opacity=".26" stroke-width="1.8" vector-effect="non-scaling-stroke"/>
          <polygon points="850,591 625.7,720.5 625.7,979.5 850,1109 1074.3,979.5 1074.3,720.5" stroke-opacity=".2" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
          <polygon points="850,486 534.77,668 534.77,1032 850,1214 1165.23,1032 1165.23,668" stroke-opacity=".15" stroke-width="1.4" vector-effect="non-scaling-stroke"/>
          <polygon points="850,355 421.32,602.5 421.32,1097.5 850,1345 1278.68,1097.5 1278.68,602.5" stroke-opacity=".11" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
          <polygon points="850,195 282.75,522.5 282.75,1177.5 850,1505 1417.25,1177.5 1417.25,522.5" stroke-opacity=".08" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
          <polygon points="850,5 118.21,427.5 118.21,1272.5 850,1695 1581.79,1272.5 1581.79,427.5" stroke-opacity=".055" stroke-width="1" vector-effect="non-scaling-stroke"/>
        </g>
      </svg>

      <div class="lp-bg__glow"></div>
    </div>

    <div class="lp-bg__vignette"></div>
    <div v-if="scanlines" class="lp-bg__scanlines"></div>
    <div v-if="grain" class="lp-bg__grain"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  accent: { type: Array, default: () => [255, 0, 105] },
  scanlines: { type: Boolean, default: true },
  grain: { type: Boolean, default: true },
});

// Один акцент → и линии волны, и подсветка.
const bgVars = computed(() => ({ '--lp-bg-accent': props.accent.join(', ') }));
</script>

<style scoped>
.lp-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* Высота — 100lvh, а не inset:0 / 100vh. На телефоне при прокрутке прячется
     и показывается адресная строка, от этого «живая» высота экрана меняется, и
     закреплённый слой дёргается вместе с ней. 100lvh эту строку игнорирует;
     100vh — запасной вариант для браузеров постарше. */
  height: 100vh;
  height: 100lvh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;

  /* ⚠️ ГЕОМЕТРИЯ ВОЛНЫ ПРАВИТСЯ ЗДЕСЬ.
     --lp-wave-r — базовый радиус R: 8.5% ширины окна, но не меньше 88 точек.
     --lp-wave-cy — центр волны по вертикали (46% высоты первого экрана).
     --lp-wave-strength — сила розового во всей волне одним числом. */
  --lp-wave-r: max(8.5vw, 88px);
  --lp-wave-cy: 46%;
  --lp-wave-strength: 1;
}

/* Ровная подложка. Прежняя размывка carbon→void снята: волна задаёт
   глубину сама, а второй градиент под ней её только мылил. */
.lp-bg__base {
  position: absolute;
  inset: 0;
  background: var(--void);
}

.lp-bg__wave {
  position: absolute;
  inset: 0;
  color: rgb(var(--lp-bg-accent));
  opacity: var(--lp-wave-strength);
}

/* Коробка колец — квадрат 17R, чтобы крайнее кольцо (8.45R) поместилось
   целиком. Центр коробки ставится на центр волны. */
.lp-bg__rings {
  position: absolute;
  left: 50%;
  top: var(--lp-wave-cy);
  width: calc(var(--lp-wave-r) * 17);
  height: calc(var(--lp-wave-r) * 17);
  transform: translate(-50%, -50%);
  display: block;
  overflow: visible;
}

.lp-bg__glow {
  position: absolute;
  left: 50%;
  top: 44%;
  width: 52%;
  height: 44%;
  transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(var(--lp-bg-accent), .16) 0%, rgba(var(--lp-bg-accent), 0) 72%);
}

.lp-bg__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 100% at 50% 48%,
    rgba(8, 8, 10, 0) 36%, rgba(8, 8, 10, .9) 100%);
}

.lp-bg__scanlines {
  position: absolute;
  inset: 0;
  opacity: .5;
  background: repeating-linear-gradient(to bottom, var(--fill-1) 0 1px, transparent 1px 3px);
  mix-blend-mode: overlay;
}
.lp-bg__grain {
  position: absolute;
  inset: -50%;
  opacity: .05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: lpbg-grain 1.2s steps(4) infinite;
}
@keyframes lpbg-grain {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-6%, 3%); }
  50% { transform: translate(4%, -5%); }
  75% { transform: translate(-3%, 6%); }
  100% { transform: translate(5%, 2%); }
}
</style>
