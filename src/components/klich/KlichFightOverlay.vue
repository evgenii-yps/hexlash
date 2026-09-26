<!-- KlichFightOverlay — КЛИЧИ ПОВЕРХ БОЯ: ряд карт, значки над бойцами и
     подсветка целей.

     ЖИВЁТ СНАРУЖИ СЦЕНЫ, рядом с панелью баффов: защищённая арена про ряд не
     знает, ряд про арену — тоже. Между ними один файл правил —
     services/klich.js, — и всё, что здесь есть, оттуда читается.

     ⚠️ НИЧЕГО НЕ ПЕРЕКРЫВАЕТ. Слой не ловит палец вообще (pointer-events: none),
     кроме самих карт: иначе тап по бойцу уходил бы в пустоту поверх него, а не
     в сцену.

     ⚠️ РЯД СТОИТ НАД ПАНЕЛЬЮ БАФФОВ, И ВЫСОТА ПОДЪЁМА НЕ ЗАШИТА ЧИСЛОМ. Обе
     панели прижаты к низу экрана, каждая своим слоем, и зашитый отступ разошёлся
     бы с панелью баффов при первой же правке её размеров (а они меняются: на
     низком экране карты ужимаются своим правилом). Поэтому высота панели баффов
     измеряется на месте и ряд поднимается ровно на неё. Не нашлась — берётся
     запасное число, и ряд всё равно не ляжет на бойцов. -->
<template>
  <div v-if="s.active" class="kfo" aria-live="polite">
    <!-- Подсветка целей: кому можно крикнуть. Появляется только с выбранной
         картой и гаснет вместе с ней. -->
    <div
      v-for="m in s.marks" :key="m.key"
      class="kfo-mark"
      :style="{ left: `${m.x}px`, top: `${m.y}px` }"
    />

    <!-- Значки над бойцами. Слева — правая сторона у своего бойца занята
         значком баффа (правило «клич и бафф работают одновременно»). -->
    <div
      v-for="b in s.badges" :key="b.key"
      v-show="b.on"
      class="kfo-badge"
      :style="{ left: `${b.x}px`, top: `${b.y}px` }"
    >
      <KlichBadge :glyph="b.glyph" :ring="b.ring" />
    </div>

    <!-- Ряд карт. Поднят над панелью баффов на её измеренную высоту. -->
    <div class="kfo-bar" :style="{ bottom: `${lift}px` }">
      <p v-if="s.hint" class="kfo-hint">{{ t.klich[s.hint] }}</p>
      <div class="kfo-cards">
        <KlichCard
          v-for="c in s.cards" :key="c.key"
          :item="c" :state="c.state" :count="c.left"
          @pick="armKlichCard(c.key)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import KlichCard from './KlichCard.vue';
import KlichBadge from './KlichBadge.vue';
import { t } from '@/locales/index.js';
import { klichFightState as s, armKlichCard } from '@/services/klich.js';

/** Запасная высота на случай, если панель баффов не нашлась. */
const LIFT_FALLBACK = 118;

const lift = ref(LIFT_FALLBACK);
let ro = null;

/**
 * Измеряем панель баффов и поднимаемся ровно на её высоту. Наблюдатель, а не
 * одно измерение: панель ужимается на низком экране и при повороте телефона.
 */
function watchBuffBar() {
  const bar = document.querySelector('.bfo-bar');
  if (!bar) { lift.value = LIFT_FALLBACK; return; }
  const apply = () => { lift.value = Math.max(0, Math.round(bar.getBoundingClientRect().height)); };
  apply();
  ro = new ResizeObserver(apply);
  ro.observe(bar);
}

onMounted(() => {
  // Панель баффов монтируется рядом, порядок между соседями не гарантирован —
  // меряем в следующем кадре, когда оба слоя уже на месте.
  requestAnimationFrame(watchBuffBar);
});
onBeforeUnmount(() => { if (ro) { ro.disconnect(); ro = null; } });
</script>

<style scoped>
.kfo {
  position: fixed;
  inset: 0;
  z-index: 40;          /* тот же слой, что у баффов: над сценой, под итогом боя */
  pointer-events: none; /* слой сквозной: палец идёт в сцену, к бойцам */
}

/* --- Подсветка цели. Обводка, БЕЗ свечения: светится на арене один разлом.
       Форма отличается от метки баффа (квадрат против круга) — чтобы при двух
       выборах подряд было видно, чью цель подсвечивают. --- */
.kfo-mark {
  position: fixed;
  width: 54px;
  height: 54px;
  margin: -27px 0 0 -27px;
  border: 1px solid var(--pink);
  opacity: 0.85;
  animation: kfo-mark-pulse 1.4s ease-in-out infinite;
}
@keyframes kfo-mark-pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.12); opacity: 0.45; }
}

.kfo-badge {
  position: fixed;
  margin: -22px 0 0 -22px; /* значок 44×44 — ставим по его середине */
}

/* --- Ряд карт --- */
.kfo-bar {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-2) var(--sp-2) 0;
}
.kfo-hint {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
}
.kfo-cards {
  display: flex;
  gap: var(--sp-2);
  pointer-events: auto; /* единственное место слоя, которое ловит палец */
}

/* Телефон лёжа: высоты мало — ряд ужимается тем же приёмом и в тех же числах,
   что панель баффов, иначе два ряда рядом разъехались бы по размеру. */
@media (max-height: 460px) {
  .kfo-bar { padding: var(--sp-1) var(--sp-2) 0; }
  .kfo-cards { gap: var(--sp-1); }
  /* :deep — карта живёт своим файлом; здесь не переписывается вид, только
     ужимается место. */
  .kfo-cards :deep(.kc-card) { width: 64px; padding: var(--sp-1); gap: 2px; }
  .kfo-cards :deep(.kc-icon) { width: 26px; height: 26px; }
  .kfo-hint { display: none; }
}

/* С «уменьшить движение» петля не крутится — метка стоит в том же полном виде,
   что и первый кадр петли. */
@media (prefers-reduced-motion: reduce) {
  .kfo-mark { animation: none; }
}
</style>
