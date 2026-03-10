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

/* ── Floating delta ───────────────────────────────────────────────── */
.hp-float {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.85rem;
  font-weight: 900;
  font-family: AnonymousBalance, Anonymous, sans-serif;
  pointer-events: none;
  white-space: nowrap;
}

.hp-float-damage {
  color: #e74c3c;
  text-shadow: 0 0 8px rgba(231, 76, 60, 0.7);
}

.hp-float-heal {
  color: #2ecc71;
  text-shadow: 0 0 8px rgba(46, 204, 113, 0.7);
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
