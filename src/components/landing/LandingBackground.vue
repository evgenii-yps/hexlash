<template>
  <!-- Общий фон лендинга и экрана входа. Рисунок — раскладка «Вихрь»:
       ядро-печать в середине, вокруг кольца, закрученные на 5° каждое.
       Внутри колец пусто — только линии.

       ⚠️ ВНУТРЬ КОЛЕЦ УЗОР НЕ ВОЗВРАЩАТЬ. Здесь была мелкая сотовая сетка
       (ячейка 24 точки) с радиальным затуханием — снята 20.09.2026 по
       решению владельца: внутри должны быть только линии.

       ⚠️ ВТОРОЙ ЭКЗЕМПЛЯР ЖИВЁТ В public/deckinvestors/index.html. Рисунок
       фигуры и колец туда ПИШЕТ СКРИПТ (scripts/sync-core-figure.mjs) из
       того же файла, что читает этот слой, — руками деку не править.

       ⚠️ ЦВЕТ МЕНЯЕТСЯ ПРИ ПРОКРУТКЕ — и это ЕДИНСТВЕННОЕ движение слоя
       (решение 21.09.2026). Ему добавлено мерцание сторон контура ядра
       (22.09.2026) — оно живёт внутри фигуры и ничего здесь не трогает.
       Форма, размер и место неподвижны: ни дыхания, ни вращения, ни пульса.

       ⚠️ НИЧЕГО БОЛЬШЕ НЕ ДВИЖЕТСЯ. Здесь были: реакция узора на курсор,
       дыхание подсветки и летящие частицы — сняты 20.09.2026. Полосы и зерно
       оставлены, это плёночная фактура, а не узор. Новые петли заводить
       нельзя. -->
  <div class="lp-bg" :class="{ 'is-shifting': shifting }" :style="bgVars" aria-hidden="true">
    <div class="lp-bg__base"></div>

    <div class="lp-bg__ink">
      <!-- Грани наливаются только в цветных разделах: на розовых и на входе
           по правилу горит одно сердце. Метка раздела перезапускает цикл. -->
      <CoreVortex :mode="mode" :fill="mode !== PINK_MODE" :cycle-key="core" />
    </div>

    <div class="lp-bg__vignette"></div>
    <div v-if="scanlines" class="lp-bg__scanlines"></div>
    <div v-if="grain" class="lp-bg__grain"></div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import CoreVortex from '@/components/core/CoreVortex.vue';
import { brandRgb } from '@/data/coreCycle.js';

const props = defineProps({
  /* Цвет по умолчанию читается из файла токенов, а не вписан числами:
     копий фирменного розового по коду было четыре. */
  accent: { type: Array, default: () => brandRgb() },
  scanlines: { type: Boolean, default: true },
  grain: { type: Boolean, default: true },
  /* Ядро раздела. null — розовый бренда: у ядер розового нет, это цвет
     главного действия и экономики, поэтому фигура уходит в «тихий» режим. */
  core: { type: String, default: null },
});

/* ⚠️ Режим яркости розового раздела — ОДНОЙ СТРОКОЙ. Сейчас 'quiet': горит
   почти только сердце. Запасной вариант 'muted' (вся фигура читается, но
   вполсилы) оставлен на случай, если первый экран покажется слишком тихим —
   поменять здесь, больше нигде. */
const PINK_MODE = 'quiet';

const mode = computed(() => (props.core ? 'full' : PINK_MODE));

/* Три числа вместо строки «r, g, b»: строка одним свойством плавно не
   меняется, а собранный из чисел rgb() — меняется. */
const bgVars = computed(() => ({
  '--lp-r': String(props.accent[0]),
  '--lp-g': String(props.accent[1]),
  '--lp-b': String(props.accent[2]),
}));

/* ⚠️ ПЕРЕХОД ЦВЕТА ВКЛЮЧАЕТСЯ ТОЛЬКО НА ВРЕМЯ СМЕНЫ. Объявленный постоянно,
   он стоит кадров: цвет наследуемый, от него зависит вся фигура ядра, и
   браузер держит поддерево «изменяемым», пересчитывая его при каждой
   прокрутке. Замер на медленном телефоне (шестикратное замедление):
   постоянный переход — середина кадра 19.8 мс, включаемый — 16.6 мс, вровень
   со страницей без фигуры.

   flush: 'pre' обязателен: класс обязан попасть в ту же перерисовку, что и
   новый цвет, иначе переход не за что зацепиться и цвет щёлкнет. */
const shifting = ref(false);
let shiftTimer = null;
watch(() => props.accent, () => {
  shifting.value = true;
  if (shiftTimer) clearTimeout(shiftTimer);
  /* Чуть дольше самого перехода (--d-panel = 420 мс), чтобы он успел
     доиграть до снятия класса. */
  shiftTimer = setTimeout(() => { shifting.value = false; }, 700);
}, { flush: 'pre' });
onBeforeUnmount(() => { if (shiftTimer) clearTimeout(shiftTimer); });
</script>

<style scoped>
/* ⚠️ ПЕРЕТЕКАЕТ ЦВЕТ, А НЕ ТРИ ЧИСЛА. Сначала было сделано наоборот:
   --lp-r/--lp-g/--lp-b объявлялись через @property и перетекали сами. Работало,
   но дорого: как только у наследуемого объявленного свойства есть переход,
   браузер считает всё поддерево изменяемым и пересчитывает его каждый кадр —
   а от этих трёх чисел зависит вся фигура ядра. Замер на медленном телефоне
   (шестикратное замедление): с переходом на числах середина кадра 20–22 мс,
   без него — 16.6 мс. Теперь числа статичны, а перетекает обычный `color` на
   одном элементе; кольца и ядро берут его через currentColor. */

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
}

/* Ровная подложка. Прежняя размывка carbon→void снята: рисунок задаёт глубину
   сам, а второй градиент под ним её только мылил. */
.lp-bg__base {
  position: absolute;
  inset: 0;
  background: var(--void);
}

/* Слой цвета. Кольца и ядро берут цвет отсюда наследованием — поэтому
   перетекание объявлено в одном месте. */
.lp-bg__ink {
  position: absolute;
  inset: 0;
  color: rgb(var(--lp-r) var(--lp-g) var(--lp-b));
}

/* Перетекание цвета — единственное движение самого слоя. Объявлено только на
   время смены (см. is-shifting в скрипте): постоянный переход на наследуемом
   цвете стоит кадров при прокрутке. */
.lp-bg.is-shifting .lp-bg__ink {
  transition: color var(--d-panel) var(--e-settle);
}
@media (prefers-reduced-motion: reduce) {
  /* Цвет меняется мгновенно. */
  .lp-bg.is-shifting .lp-bg__ink { transition: none; }
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
