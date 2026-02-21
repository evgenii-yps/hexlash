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
  font-size: 0.6rem;
  color: var(--gray2);
  margin-bottom: 2px;
  text-align: center;
}

.hp-bar-track {
  height: 8px;
  background-color: var(--black-opacity-80);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--gray2);
}

.hp-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease, background-color 0.3s ease;
}

.hp-green { background-color: #2ecc71; }
.hp-yellow { background-color: #f1c40f; }
.hp-red { background-color: #e74c3c; }

.hp-bar-text {
  font-size: 0.6rem;
  color: var(--gray3);
  text-align: center;
  margin-top: 2px;
}
</style>
