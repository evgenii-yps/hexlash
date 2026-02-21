<template>
  <div class="card-item" :class="[typeClass, rarityClass, { 'card-equipped': equipped, 'card-disabled': disabled }]" @click="$emit('click')">
    <div class="card-rarity-bar"></div>
    <div class="card-name">{{ card.name }}</div>
    <div class="card-power">{{ card.power }}</div>
    <div class="card-type-label">{{ typeLabel }}</div>
    <div class="card-target" v-if="card.target && card.target !== 'self'">{{ card.target }}</div>
    <div class="card-cooldown" v-if="card.cooldown > 0 && card.cooldown < 99">CD: {{ card.cooldown }}</div>
  </div>
</template>

<script setup>
import {computed} from "vue";

const props = defineProps({
  card: { type: Object, required: true },
  equipped: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

defineEmits(['click']);

const typeClass = computed(() => `card-type-${props.card.type}`);
const rarityClass = computed(() => `card-rarity-${props.card.rarity}`);

const typeLabel = computed(() => {
  const labels = { attack: 'ATK', defense: 'DEF', special: 'SPL' };
  return labels[props.card.type] || props.card.type;
});
</script>

<style scoped>
.card-item {
  position: relative;
  width: 80px;
  height: 100px;
  border-radius: 6px;
  background-color: var(--black-opacity-80);
  border: 2px solid var(--gray2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.card-item:active {
  transform: scale(0.95);
}

.card-rarity-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.card-type-attack { border-color: #e74c3c; }
.card-type-defense { border-color: #3498db; }
.card-type-special { border-color: #f39c12; }

.card-type-attack .card-rarity-bar { background-color: #e74c3c; }
.card-type-defense .card-rarity-bar { background-color: #3498db; }
.card-type-special .card-rarity-bar { background-color: #f39c12; }

.card-rarity-rare {
  box-shadow: 0 0 6px rgba(52, 152, 219, 0.4);
}
.card-rarity-epic {
  box-shadow: 0 0 8px rgba(155, 89, 182, 0.5);
  border-color: #9b59b6 !important;
}
.card-rarity-epic .card-rarity-bar { background-color: #9b59b6; }

.card-equipped {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 10px rgba(var(--primary-color-rgb, 255, 77, 77), 0.5);
}

.card-disabled {
  opacity: 0.4;
  pointer-events: none;
}

.card-name {
  font-size: 0.6rem;
  text-align: center;
  color: white;
  padding: 0 4px;
  margin-top: 6px;
  line-height: 1.1;
}

.card-power {
  font-size: 1.4rem;
  font-weight: bold;
  color: white;
  margin: 2px 0;
}

.card-type-label {
  font-size: 0.5rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-target {
  font-size: 0.5rem;
  color: var(--gray3);
  text-transform: uppercase;
}

.card-cooldown {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.45rem;
  color: var(--gray3);
}
</style>
