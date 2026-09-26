<!-- KlichGlyph — ЗНАЧОК КЛИЧА. Одна отрисовка на карту и на значок над бойцом:
     вторая копия разошлась бы с первой молча.

     ⚠️ КЛИЧИ РАЗЛИЧАЮТСЯ ЗНАЧКОМ, А НЕ ЦВЕТОМ (ТЗ). Поэтому здесь только форма,
     а цвет берётся снаружи через currentColor: карта сама решает, каким тоном
     себя рисовать, и на арене не заводится ни одного нового цвета.

     Формы читаются без подписи: вперёд — стрелка вперёд, отход — стрелка назад,
     держать — щит. -->
<template>
  <svg class="kg" viewBox="0 0 24 24" aria-hidden="true">
    <!-- ВПЕРЁД: клин, идущий вперёд -->
    <g v-if="glyph === 'forward'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
      <path d="M12 4 V17" />
      <path d="M6 12 L12 18 L18 12" />
    </g>
    <!-- ОТХОД: клин, идущий назад -->
    <g v-else-if="glyph === 'back'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
      <path d="M12 20 V7" />
      <path d="M6 12 L12 6 L18 12" />
    </g>
    <!-- ДЕРЖАТЬ: щит. НЕ стрелка намеренно: первая отрисовка была клином вниз
         с поперечиной, и на снимке экрана она читалась как «вперёд» — две
         стрелки вниз рядом не различались. Щит не спутать ни с одной из них. -->
    <g v-else fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
      <path d="M12 3.5 L19.5 6.5 V12 C19.5 16.5 12 20.5 12 20.5 C12 20.5 4.5 16.5 4.5 12 V6.5 Z" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  // 'forward' | 'back' | 'anchor' — см. KLICH_META в data/klichBalance.js
  glyph: { type: String, default: 'anchor' },
});
</script>

<style scoped>
.kg { width: 100%; height: 100%; display: block; }
</style>
