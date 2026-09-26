<!-- KlichCard — карта ряда кличей. Четыре состояния: normal / selected / empty /
     locked — те же, что у карты баффа.

     ⚠️ ПОЧЕМУ НЕ ПЕРЕИСПОЛЬЗОВАНА BuffCard, ХОТЯ ВИД У НИХ ОДИН. У той карты
     значок — картинка (`icon` = путь к снимку), а клич различается РИСОВАННЫМ
     значком, который красится от текста. Пропихивать svg в атрибут картинки
     пришлось бы строкой-данными — вид бы совпал, а править стало бы нельзя.
     Поэтому карта своя, но размеры, отступы и состояния взяты у баффов один в
     один: ряды стоят рядом и обязаны читаться одной семьёй.

     ТАЧ-ЗОНА. Карта заведомо выше порога (значок 36 + подписи + отступы ≈ 88
     точек), и порог продублирован явным min-height — чтобы будущая правка
     размеров не увела карту под 44 незаметно. У переключателя составов эта
     ошибка уже допущена (31 точка), второй раз её не повторяем. -->
<template>
  <button
    class="kc-card"
    :class="[`is-${state}`]"
    type="button"
    :disabled="state === 'empty'"
    :aria-pressed="state === 'selected'"
    :aria-label="`${item.name}, ${count} left`"
    @click="state !== 'empty' && $emit('pick')"
  >
    <div class="kc-icon"><KlichGlyph :glyph="item.glyph" /></div>
    <div class="kc-name">{{ item.name }}</div>
    <div class="kc-count">×{{ count }}</div>
    <div v-if="state === 'locked'" class="kc-lock">●</div>
  </button>
</template>

<script setup>
import KlichGlyph from './KlichGlyph.vue';

defineProps({
  item: { type: Object, required: true },
  state: { type: String, default: 'normal' },
  count: { type: Number, default: 3 },
});
defineEmits(['pick']);
</script>

<style scoped>
.kc-card {
  position: relative;
  font: inherit;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
  width: 84px;
  min-height: var(--h-btn-sm); /* порог тач-зоны, продублирован намеренно */
  padding: var(--sp-2);
  border: 1px solid var(--line-strong);
  background: var(--fill-1);
  color: var(--ink-dim);
  cursor: pointer;
}
.kc-card:disabled { cursor: default; }
.kc-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
/* Подпись держит МЕСТО ПОД ДВЕ СТРОКИ у всех карт. Без этого «FALL BACK»
   переносится, а односложные соседи — нет, и счётчики в ряду встают на разной
   высоте: ряд выглядит кривым, хотя карты одного размера. */
.kc-name {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  line-height: 1.15;
  min-height: 2.3em;
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
}
.kc-count { font-family: var(--font-mono); font-size: var(--t-xs); color: var(--ink-soft); font-variant-numeric: tabular-nums; }

/* Выбранная — единственное место, где карта берёт розовый: это главное
   действие в этот момент. Ровно как у карты баффа. */
.kc-card.is-selected { color: var(--pink); border-color: var(--pink); box-shadow: var(--glow-select); }
/* Заряды кончились: погашена и не нажимается — причина видна счётчиком ×0. */
.kc-card.is-empty { opacity: var(--o-dim); }
.kc-card.is-locked { border-color: var(--chrome-hi); }
.kc-lock {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: var(--t-micro);
  line-height: 1;
  color: var(--chrome-hi);
}

/* Отклик на палец: наведения на телефоне нет, поэтому нажатие обязано
   отвечать. Общий отклик снят глобально в tokens.css — здесь своя замена. */
.kc-card:not(:disabled):active { transform: scale(0.96); }
@media (prefers-reduced-motion: reduce) {
  /* Движение выключаем, ОТКЛИК — нет: он не украшение. */
  .kc-card:not(:disabled):active { transform: none; opacity: var(--o-dim); }
}
</style>
