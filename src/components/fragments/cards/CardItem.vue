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
  background-color: var(--hex-bg-card);
  border: 2px solid var(--hex-border-active);
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

.card-type-attack { border-color: var(--hex-action-attack); }
.card-type-defense { border-color: var(--hex-action-defense); }
.card-type-special { border-color: var(--hex-warning); }

.card-type-attack .card-rarity-bar { background-color: var(--hex-action-attack); }
.card-type-defense .card-rarity-bar { background-color: var(--hex-action-defense); }
.card-type-special .card-rarity-bar { background-color: var(--hex-warning); }

.card-rarity-rare {
  box-shadow: 0 0 6px color-mix(in srgb, var(--hex-action-defense) 40%, transparent);
}
.card-rarity-epic {
  box-shadow: 0 0 8px color-mix(in srgb, var(--hex-action-position) 50%, transparent);
  border-color: var(--hex-action-position) !important;
}
.card-rarity-epic .card-rarity-bar { background-color: var(--hex-action-position); }

.card-equipped {
  border-color: var(--hex-primary) !important;
  box-shadow: 0 0 10px color-mix(in srgb, var(--hex-primary) 50%, transparent);
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
  color: var(--hex-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-target {
  font-size: 0.5rem;
  color: var(--hex-text-muted);
  text-transform: uppercase;
}

.card-cooldown {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.45rem;
  color: var(--hex-text-muted);
}
</style>
