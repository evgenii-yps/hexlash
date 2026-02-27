<template>
  <div class="hp-bar-container">
    <div class="hp-bar-label">{{ name }}</div>
    <div class="hp-bar-track">
      <div class="hp-bar-fill" :style="{ width: hpPercent + '%' }" :class="hpColorClass"></div>
    </div>
    <div class="hp-bar-text">{{ currentHP }} / {{ maxHP }}</div>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {MAX_HP} from "@/core/constants.js";

const props = defineProps({
  currentHP: { type: Number, required: true },
  maxHP: { type: Number, default: MAX_HP },
  name: { type: String, default: '' },
});

const hpPercent = computed(() => Math.max(0, (props.currentHP / props.maxHP) * 100));

const hpColorClass = computed(() => {
  const pct = hpPercent.value;
  if (pct > 50) return 'hp-green';
  if (pct > 25) return 'hp-yellow';
  return 'hp-red';
});
</script>

<style scoped>
.hp-bar-container {
  width: 100%;
}

.hp-bar-label {
  font-size: 0.55rem;
  color: var(--gray2);
  margin-bottom: 2px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hp-bar-track {
  height: 10px;
  background: rgba(9, 9, 9, 0.8);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid rgba(255, 6, 111, 0.2);
}

.hp-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s ease, background-color 0.3s ease;
}

.hp-green {
  background: linear-gradient(90deg, #1a8a4a, #2ecc71);
  box-shadow: 0 0 8px rgba(46, 204, 113, 0.3);
}
.hp-yellow {
  background: linear-gradient(90deg, #c49b0a, #f1c40f);
  box-shadow: 0 0 8px rgba(241, 196, 15, 0.3);
}
.hp-red {
  background: linear-gradient(90deg, #a33025, #e74c3c);
  box-shadow: 0 0 8px rgba(231, 76, 60, 0.4);
}

.hp-bar-text {
  font-size: 0.6rem;
  color: var(--gray3);
  text-align: center;
  margin-top: 2px;
  font-weight: bold;
}
</style>
