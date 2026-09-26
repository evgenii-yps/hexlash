<!-- KlichBadge — значок клича над бойцом. Кольцо убывает по остатку сдвига.
     Форма и размеры взяты у значка баффа: на одном бойце они стоят рядом
     (бафф справа, клич слева) и обязаны читаться одной семьёй.

     Без свечения: на арене светится один разлом. -->
<template>
  <div class="kb-badge">
    <svg class="kb-ring" viewBox="0 0 44 44">
      <circle class="kb-ring__bg" cx="22" cy="22" r="19" />
      <circle
        class="kb-ring__fg"
        cx="22" cy="22" r="19"
        :style="{ strokeDashoffset: RING_LEN * (1 - Math.max(0, Math.min(1, ring))) }"
      />
    </svg>
    <div class="kb-icon"><KlichGlyph :glyph="glyph" /></div>
  </div>
</template>

<script setup>
import KlichGlyph from './KlichGlyph.vue';

defineProps({
  glyph: { type: String, default: 'anchor' },
  // 1 — только что крикнули, 0 — сдвиг сошёл на нет.
  ring: { type: Number, default: 1 },
});
// Длина окружности 2π·19 — то же число, что в разметке выше.
const RING_LEN = 119.4;
</script>

<style scoped>
.kb-badge {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-dim);
}
.kb-ring { position: absolute; inset: 0; transform: rotate(-90deg); }
.kb-ring__bg { fill: var(--fill-1); stroke: var(--line-strong); stroke-width: 2; }
.kb-ring__fg {
  fill: none;
  stroke: var(--ink-dim);
  stroke-width: 2;
  stroke-dasharray: 119.4;
}
.kb-icon { position: relative; width: 20px; height: 20px; }
</style>
