<template>
  <div class="hp-bar-container">
    <div class="hp-bar-label">{{ name }}</div>
    <div class="hp-bar-track">
      <div class="hp-bar-fill" :style="{ width: hpPercent + '%' }" :class="hpColorClass"></div>
    </div>
    <div class="hp-bar-text">{{ currentHP }} / {{ maxHP }}</div>

    <transition name="float-pop">
      <div
        v-if="floatVisible"
        class="hp-float"
        :class="floatDelta > 0 ? 'hp-float-heal' : 'hp-float-damage'"
      >{{ floatDelta > 0 ? '+' : '' }}{{ floatDelta }}</div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { MAX_HP } from '@/core/constants.js';

const props = defineProps({
  currentHP: { type: Number, required: true },
  maxHP:     { type: Number, default: MAX_HP },
  name:      { type: String, default: '' },
});

const hpPercent  = computed(() => Math.max(0, (props.currentHP / props.maxHP) * 100));
const hpColorClass = computed(() => {
  const pct = hpPercent.value;
  if (pct > 50) return 'hp-green';
  if (pct > 25) return 'hp-yellow';
  return 'hp-red';
});

const floatVisible = ref(false);
const floatDelta   = ref(0);
let floatTimer = null;

watch(() => props.currentHP, (newVal, oldVal) => {
  const delta = newVal - oldVal;
  if (delta === 0) return;
  floatDelta.value = delta;
  floatVisible.value = false;
  clearTimeout(floatTimer);
  // next tick trick to re-trigger transition
  setTimeout(() => {
    floatVisible.value = true;
    floatTimer = setTimeout(() => { floatVisible.value = false; }, 900);
  }, 20);
});
</script>

<style scoped>
.hp-bar-container {
  width: 100%;
  position: relative;
}

.hp-bar-label {
  font-size: 0.55rem;
  color: var(--hex-text-secondary);
  margin-bottom: 2px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hp-bar-track {
  height: 10px;
  background: var(--hex-bg-card);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid var(--hex-border-default);
}

.hp-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s ease, background-color 0.3s ease;
}

.hp-green {
  background: linear-gradient(90deg, color-mix(in srgb, var(--hex-success) 60%, black), var(--hex-success));
  box-shadow: 0 0 8px color-mix(in srgb, var(--hex-success) 30%, transparent);
}
.hp-yellow {
  background: linear-gradient(90deg, color-mix(in srgb, var(--hex-warning) 60%, black), var(--hex-warning));
  box-shadow: 0 0 8px color-mix(in srgb, var(--hex-warning) 30%, transparent);
}
.hp-red {
  background: linear-gradient(90deg, color-mix(in srgb, var(--hex-danger) 60%, black), var(--hex-danger));
  box-shadow: 0 0 8px color-mix(in srgb, var(--hex-danger) 40%, transparent);
}

.hp-bar-text {
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 0.6rem;
  color: var(--hex-text-muted);
  text-align: center;
  margin-top: 2px;
  font-weight: bold;
}

/* ── Floating delta ───────────────────────────────────────────────── */
.hp-float {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.85rem;
  font-weight: 900;
  font-family: 'AnonymousBalance', 'Anonymous', 'Courier New', Consolas, monospace;
  pointer-events: none;
  white-space: nowrap;
}

.hp-float-damage {
  color: var(--hex-danger);
  text-shadow: 0 0 8px color-mix(in srgb, var(--hex-danger) 70%, transparent);
}

.hp-float-heal {
  color: var(--hex-success);
  text-shadow: 0 0 8px color-mix(in srgb, var(--hex-success) 70%, transparent);
}

.float-pop-enter-active {
  animation: floatUp 0.9s ease-out forwards;
}
.float-pop-leave-active {
  display: none;
}

@keyframes floatUp {
  0%   { opacity: 1;   transform: translateX(-50%) translateY(0);    }
  70%  { opacity: 1;   transform: translateX(-50%) translateY(-18px); }
  100% { opacity: 0;   transform: translateX(-50%) translateY(-26px); }
}
</style>
