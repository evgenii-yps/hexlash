<!-- BuffKitSlots — ТРИ СЛОТА «В БОЙ» на шаге выбора бойца в воротах ARENA.
     Макет — блок 5 страницы /dev/buffs, принятый владельцем.

     Тап по слоту переключает бафф: по кругу, из того, что ЕСТЬ В ЗАПАСЕ, плюс
     «пусто». Одинаковые брать можно — но не больше, чем лежит в запасе: слот не
     предложит третье полотенце, если полотенец два.

     ⚠️ МАТОВЫЙ, КАК ВЕСЬ ХРОМ ЭТОГО ЭКРАНА. Ни розового, ни свечения: в воротах
     светятся острова выбора, а не органы над ними. То же правило, по которому
     матовые переключатель размера состава и кнопка «в бой» рядом.

     ⚠️ ПУСТОЙ ЗАПАС — НЕ ПОМЕХА. Ряд показывается пустым, бой начинается как
     обычно. Ничего не блокируется: магазина ещё нет (работа 3), и запереть
     игрока за баффами было бы нечестно. -->
<template>
  <div class="bks" :class="{ 'is-stacked': stacked }" role="group" :aria-label="t.gate.buffKit">
    <span class="bks-label">{{ t.gate.buffKit }}</span>
    <div class="bks-row">
      <button
        v-for="(slot, i) in slots" :key="i"
        type="button"
        class="bks-slot"
        :class="{ 'is-empty': slot === null }"
        :disabled="!hasAny"
        @click="cycle(i)"
      >
        <template v-if="slot">
          <img class="bks-icon" :src="ICONS[slot]" :alt="BUFF_META[slot].name" />
          <span class="bks-name">{{ BUFF_META[slot].name }}</span>
        </template>
        <span v-else class="bks-name bks-name--empty">{{ t.gate.buffEmpty }}</span>
      </button>
    </div>
    <span v-if="!hasAny" class="bks-note">{{ t.gate.buffNone }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { t } from '@/locales/index.js';
import { BUFF_IDS, BUFF_META, BUFF_BALANCE } from '@/data/buffBalance.js';
import { readStock, readKit, writeKit, defaultKitFrom, ensureStarterStock } from '@/services/buffStock.js';
import towel from '@/assets/images/buff_towel.png';
import bucket from '@/assets/images/buff_bucket.png';
import dice from '@/assets/images/buff_dice.png';

defineProps({
  // Над рядом стоит выбор размера состава? Тогда ряд опускается под него.
  // У дуэли такого выбора нет вовсе, и ряд встаёт на его место.
  stacked: { type: Boolean, default: false },
});

const ICONS = { towel, bucket, dice };

const stock = ref({});
const slots = ref(Array(BUFF_BALANCE.kitSlots).fill(null));
const hasAny = computed(() => BUFF_IDS.some((id) => (stock.value[id] || 0) > 0));

onMounted(() => {
  // Стартовый подарок выдаётся здесь, при первом же заходе на выбор бойца: это
  // первое место, где игрок вообще может увидеть свои баффы.
  ensureStarterStock();
  stock.value = readStock();
  const saved = readKit();
  slots.value = saved.some((x) => x) ? saved : defaultKitFrom(stock.value);
  writeKit(slots.value); // запомнить сразу — в бой уйдёт ровно то, что видно
});

/** Сколько ещё штук этого вида можно поставить, кроме слота i. */
function freeFor(id, i) {
  const used = slots.value.filter((x, k) => k !== i && x === id).length;
  return (stock.value[id] || 0) - used;
}

/** Тап: следующий бафф по кругу, пропуская то, чего не хватит. */
function cycle(i) {
  const order = [...BUFF_IDS, null];
  let k = order.indexOf(slots.value[i]);
  for (let step = 0; step < order.length; step++) {
    k = (k + 1) % order.length;
    const next = order[k];
    if (next === null || freeFor(next, i) > 0) {
      slots.value[i] = next;
      writeKit(slots.value);
      return;
    }
  }
}
</script>

<style scoped>
/* ⚠️ РЯД СТОИТ СВЕРХУ, А НЕ СНИЗУ. Снизу он налезал на кнопку боя и на имя
   выбранного бойца — поймано снимком экрана. Сверху свободно: там только полоса
   «назад» и выбор размера состава, то есть ровно те же решения перед боем. */
.bks {
  position: fixed; left: 50%; transform: translateX(-50%);
  top: calc(var(--sp-6) + 44px);
  z-index: 10; pointer-events: auto;
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-1);
}
/* Командный бой: сверху уже стоит выбор размера состава — опускаемся под него. */
.bks.is-stacked { top: calc(var(--sp-6) + 44px + 52px); }
.bks-label, .bks-note {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-title); text-transform: uppercase;
  color: var(--ink-off);
}
.bks-row { display: flex; gap: var(--sp-2); }
.bks-slot {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--sp-1);
  width: 72px; height: 72px;
  font: inherit; cursor: pointer;
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: 1px solid var(--line);
  transition: color var(--d-hover) var(--e-weight), border-color var(--d-hover) var(--e-weight);
}
.bks-slot:hover:not(:disabled) { border-color: var(--line-strong); }
.bks-slot:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }
.bks-slot:disabled { cursor: default; opacity: var(--o-dim); }
.bks-slot.is-empty { border-style: dashed; }
.bks-icon { width: 30px; height: 30px; object-fit: contain; }
.bks-name {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-dim);
}
.bks-name--empty { color: var(--ink-off); }

/* Телефон лёжа: высоты мало — ряд ужимается, чтобы не наезжать на кнопку боя. */
@media (max-height: 460px) {
  .bks { top: calc(var(--sp-3) + 38px); gap: 0; }
  .bks.is-stacked { top: calc(var(--sp-3) + 38px + 44px); }
  .bks-slot { width: 56px; height: 56px; }
  .bks-icon { width: 22px; height: 22px; }
  .bks-label { display: none; }
}
</style>
