<template>
  <button
      class="autofight-toggle"
      :class="{ 'autofight-active': isEnabled }"
      :disabled="!canToggle"
      @click="toggle"
  >
    <span class="icon">&#x1F504;</span>
    AUTO FIGHT
  </button>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';

const isEnabled = computed(() => store.getters['autoFight/isEnabled']);
const isBuildValid = computed(() => store.getters['fight/isBuildValid']);
const canToggle = computed(() => isBuildValid.value);

const toggle = () => {
  if (isEnabled.value) {
    store.dispatch('autoFight/disable');
  } else {
    store.dispatch('autoFight/enable');
  }
};
</script>

<style scoped>
.autofight-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 160px;
  padding: 14px 24px;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255, 6, 111, 0.6);
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.autofight-toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.autofight-toggle:hover {
  border-color: #FF066F;
  background: rgba(255, 6, 111, 0.15);
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.3);
}

.autofight-active {
  border-color: var(--primary-color);
  color: var(--primary-color);
  box-shadow: 0 0 16px rgba(255, 6, 111, 0.4);
  animation: autofightPulse 2s ease-in-out infinite;
}

@keyframes autofightPulse {
  0%, 100% { box-shadow: 0 0 16px rgba(255, 6, 111, 0.4); }
  50% { box-shadow: 0 0 28px rgba(255, 6, 111, 0.7); }
}

.icon {
  font-size: 18px;
}
</style>
