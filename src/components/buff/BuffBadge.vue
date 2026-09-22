<!-- BuffBadge — значок баффа над бойцом, свой / чужой. Отдельный SFC-файл — см.
     пояснение в BuffCard.vue (тот же приём), и та же причина держать ОДНУ копию
     на макет и на бой.

     КОЛЬЦО. Без `ring` оно убывает само, петлёй — так значок показывают на
     макете, где никакого баффа на самом деле нет. В бою `ring` передают числом
     от 1 до 0: у полотенца и ведра это оставшееся время, у кубика — оставшиеся
     заряженные удары. -->
<template>
  <div class="bb-badge" :class="own ? 'is-own' : 'is-foe'">
    <svg class="bb-ring" viewBox="0 0 44 44">
      <circle class="bb-ring__bg" cx="22" cy="22" r="19" />
      <circle
        class="bb-ring__fg"
        :class="{ 'is-driven': ring !== null }"
        cx="22" cy="22" r="19"
        :style="ring !== null ? { strokeDashoffset: RING_LEN * (1 - Math.max(0, Math.min(1, ring))) } : null"
      />
    </svg>
    <div class="bb-icon">
      <img v-if="icon" :src="icon" alt="" />
      <span v-else class="bb-ph">{{ mono }}</span>
    </div>
    <div v-if="face" class="bb-face">{{ face }}</div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: null },
  mono: { type: String, default: '?' },
  own: { type: Boolean, default: true },
  face: { type: Number, default: null },
  // 1 — только что бросили, 0 — кончилось. Не передан — кольцо крутится само
  // (показ на макете). Число здесь и длина окружности ниже — одно и то же 2π·19.
  ring: { type: Number, default: null },
});
const RING_LEN = 119.4;
</script>

<style scoped>
.bb-badge {
  position: relative;
  width: 44px;
  height: 44px;
}
/* Тёмная подложка под кольцом — без неё тёмная иконка на тёмном фоне сцены
   сливается в пятно. Не свечение, просто контраст. */
.bb-badge::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: var(--r-round);
  background: var(--carbon);
}

.bb-ring { position: absolute; inset: 0; transform: rotate(-90deg); }
.bb-ring__bg, .bb-ring__fg {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}
.bb-ring__bg { stroke: var(--line-strong); }
.bb-ring__fg {
  stroke-dasharray: 119.4; /* 2π·19 */
  stroke-dashoffset: 0;
  animation: bb-ring-deplete 6s linear infinite;
}
/* Кольцом правят снаружи — своя петля не нужна, иначе две подачи спорили бы. */
.bb-ring__fg.is-driven { animation: none; }
/* Правило движения (§6 hexlash-design): у петли одинаковые кадры 0% и 100% —
   при «уменьшить движение» кольцо встаёт в полное (только что применённый
   бафф), не в середину убывания. */
@keyframes bb-ring-deplete {
  0%   { stroke-dashoffset: 0; }
  92%  { stroke-dashoffset: 119.4; }
  100% { stroke-dashoffset: 0; }
}
.bb-badge.is-own .bb-ring__fg { stroke: var(--pink); }
.bb-badge.is-foe .bb-ring__fg { stroke: var(--ink-off); }
.bb-badge.is-foe { opacity: var(--o-dim); }

.bb-icon {
  position: absolute;
  inset: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bb-icon img { width: 100%; height: 100%; object-fit: contain; }
.bb-ph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--ink-off);
  font-family: var(--font-mono);
  font-size: var(--t-xs);
}
.bb-face {
  position: absolute;
  right: -6px;
  bottom: -4px;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-round);
  background: var(--panel);
  border: 1px solid var(--line-strong);
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
</style>
