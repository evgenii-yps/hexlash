<!-- BuffKitSlots — ТРИ КАРТОЧКИ «В БОЙ» на шаге выбора бойца в воротах ARENA.

     ⚠️ ЭТО ВИТРИНА, А НЕ ОРГАН УПРАВЛЕНИЯ (ТЗ 27.09.2026). Карточки только
     показывают, что игрок берёт в бой, — и это всегда одно и то же: по одному
     TOWEL, BUCKET и DICE. Выбирать нечего, поэтому и нажимать не на что.

     ЧТО ОТСЮДА УБРАНО И ПОЧЕМУ. Была строка «TAKE INTO THE FIGHT · N LASH» и
     перебор предметов по кругу тапом: набор собирался из КУПЛЕННОГО запаса.
     Решение 22.09 «баффы покупаются в домашнем магазине за LASH» отменено
     владельцем до балансировки всех систем после демо 30.09 — вместе с ним ушли
     заголовок, счёт монет, чтение запаса и запись набора в прогресс.
     Ровно здесь же лежала половина дефекта «два полотенца и ни одного кубика»:
     см. разбор в шапке buffStartFight (services/buffs.js).

     ⚠️ МАТОВЫЙ, КАК ВЕСЬ ХРОМ ЭТОГО ЭКРАНА. Ни розового, ни свечения: в воротах
     светятся острова выбора, а не органы над ними. -->
<template>
  <div class="bks" :class="{ 'is-stacked': stacked }" role="list" :aria-label="t.gate.buffKit">
    <div class="bks-row">
      <div v-for="id in BUFF_IDS" :key="id" class="bks-slot" role="listitem">
        <img class="bks-icon" :src="ICONS[id]" alt="" aria-hidden="true" />
        <span class="bks-name">{{ BUFF_META[id].name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { t } from '@/locales/index.js';
import { BUFF_IDS, BUFF_META } from '@/data/buffBalance.js';
import towel from '@/assets/images/buff_towel.png';
import bucket from '@/assets/images/buff_bucket.png';
import dice from '@/assets/images/buff_dice.png';

defineProps({
  // Над рядом стоит выбор размера состава? Тогда ряд опускается под него.
  // У дуэли такого выбора нет вовсе, и ряд встаёт на его место.
  stacked: { type: Boolean, default: false },
});

const ICONS = { towel, bucket, dice };
</script>

<style scoped>
/* ⚠️ РЯД СТОИТ СВЕРХУ, А НЕ СНИЗУ. Снизу он налезал на кнопку боя и на имя
   выбранного бойца — поймано снимком экрана. Сверху свободно: там только полоса
   «назад» и выбор размера состава, то есть ровно те же решения перед боем.
   Строки заголовка над рядом больше нет, но сам отступ сверху не меняем: ряд
   стоит на том же месте, где игрок привык его видеть. */
.bks {
  position: fixed; left: 50%; transform: translateX(-50%);
  top: calc(var(--sp-6) + 44px);
  z-index: 10; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-1);
}
/* Командный бой: сверху уже стоит выбор размера состава — опускаемся под него. */
.bks.is-stacked { top: calc(var(--sp-6) + 44px + 52px); }
.bks-row { display: flex; gap: var(--sp-2); }
.bks-slot {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--sp-1);
  width: 72px; height: 72px;
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: 1px solid var(--line);
}
.bks-icon { width: 30px; height: 30px; object-fit: contain; }
.bks-name {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-dim);
}

/* Телефон лёжа: высоты мало — ряд ужимается, чтобы не наезжать на кнопку боя. */
@media (max-height: 460px) {
  .bks { top: calc(var(--sp-3) + 38px); gap: 0; }
  .bks.is-stacked { top: calc(var(--sp-3) + 38px + 44px); }
  .bks-slot { width: 56px; height: 56px; }
  .bks-icon { width: 22px; height: 22px; }
}
</style>
