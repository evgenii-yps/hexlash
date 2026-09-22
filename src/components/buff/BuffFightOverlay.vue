<!-- BuffFightOverlay — БАФФЫ ПОВЕРХ БОЯ: нижняя панель карточек, значки над
     бойцами и подсветка целей.

     ЖИВЁТ СНАРУЖИ СЦЕНЫ, рядом с итогом боя и панелями режимов (см. шапку
     PlayStubView.vue): защищённая арена про панель не знает, панель про арену —
     тоже. Между ними один файл правил — services/buffs.js, — и всё, что здесь
     есть, оттуда читается.

     ⚠️ НИЧЕГО НЕ ПЕРЕКРЫВАЕТ. Слой не ловит палец вообще (pointer-events: none),
     кроме самих карточек: иначе тап по бойцу уходил бы в пустоту поверх него, а
     не в сцену. Панель прижата к низу и не залезает на плашки здоровья — они
     живут над головами бойцов. -->
<template>
  <div v-if="s.active" class="bfo" aria-live="polite">
    <!-- Подсветка целей: где можно бросить. Появляется только с выбранной
         карточкой и гаснет вместе с ней. -->
    <div
      v-for="m in s.marks" :key="m.key"
      class="bfo-mark"
      :style="{ left: `${m.x}px`, top: `${m.y}px` }"
    />

    <!-- Значки над бойцами. Свой и чужой различаются яркостью — чтобы игрок
         сразу отличал «моё» от «на меня бросили». -->
    <div
      v-for="b in s.badges" :key="b.key"
      v-show="b.on"
      class="bfo-badge"
      :style="{ left: `${b.x}px`, top: `${b.y}px` }"
    >
      <BuffBadge :icon="ICONS[b.id]" :mono="b.mono" :own="b.own" :face="b.face" :ring="b.ring" />
    </div>

    <!-- Нижняя панель. Три карточки в ряд, на каждой — сколько осталось. -->
    <div class="bfo-bar">
      <p v-if="s.hint" class="bfo-hint">{{ s.hint }}</p>
      <div class="bfo-cards">
        <BuffCard
          v-for="c in s.cards" :key="c.key"
          :item="c" :icon="ICONS[c.id]" :state="c.state" :count="c.left"
          clickable
          @pick="armBuffCard(c.key)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import BuffCard from './BuffCard.vue';
import BuffBadge from './BuffBadge.vue';
import { buffFightState as s, armBuffCard } from '@/services/buffs.js';
// Те же три снимка, что владелец принял на странице-макете. Своих иконок у боя
// нет намеренно: вторая копия разошлась бы с принятой.
import towel from '@/assets/images/buff_towel.png';
import bucket from '@/assets/images/buff_bucket.png';
import dice from '@/assets/images/buff_dice.png';

const ICONS = { towel, bucket, dice };
</script>

<style scoped>
.bfo {
  position: fixed;
  inset: 0;
  z-index: 40;          /* над сценой, под итогом боя и панелями режимов */
  pointer-events: none; /* слой сквозной: палец идёт в сцену, к бойцам */
}

/* --- Подсветка цели. Обводка, БЕЗ свечения: светится на арене один разлом, и
       второго источника здесь не заводится. --- */
.bfo-mark {
  position: fixed;
  width: 54px;
  height: 54px;
  margin: -27px 0 0 -27px;
  border: 1px solid var(--pink);
  border-radius: var(--r-round);
  opacity: 0.85;
  animation: bfo-mark-pulse 1.4s ease-in-out infinite;
}
@keyframes bfo-mark-pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.12); opacity: 0.45; }
}

.bfo-badge {
  position: fixed;
  margin: -22px 0 0 -22px; /* значок 44×44 — ставим по его середине */
}

/* --- Нижняя панель --- */
.bfo-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-2) var(--sp-2) calc(var(--sp-3) + env(safe-area-inset-bottom, 0px));
}
.bfo-hint {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
}
.bfo-cards {
  display: flex;
  gap: var(--sp-2);
  pointer-events: auto; /* единственное место слоя, которое ловит палец */
}

/* Телефон лёжа: высоты мало, панель прижимается и ужимается, чтобы не налезать
   на бойцов. */
@media (max-height: 460px) {
  .bfo-bar { padding: var(--sp-1) var(--sp-2) var(--sp-1); }
  .bfo-cards { gap: var(--sp-1); }
}

/* Правило движения: с «уменьшить движение» петля не крутится — метка просто
   стоит на месте, в том же полном виде, что и первый кадр петли. */
@media (prefers-reduced-motion: reduce) {
  .bfo-mark { animation: none; }
}
</style>
