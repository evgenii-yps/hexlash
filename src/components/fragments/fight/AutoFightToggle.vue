<template>
  <div class="autofight-toggle-wrapper">
    <button
        class="autofight-toggle"
        :class="{ 'autofight-active': isEnabled }"
        :disabled="!canToggle"
        @click="toggle"
    >
      <span class="autofight-icon">&#x1F504;</span>
      <span class="autofight-label">{{ t.autoFight.lblAutoFight }}:</span>
      <span class="autofight-state">{{ isEnabled ? t.autoFight.lblAutoFightOn : t.autoFight.lblAutoFightOff }}</span>
    </button>
    <div v-if="!isEnabled" class="autofight-tooltip">{{ t.autoFight.lblEnableTooltip }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';

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
.autofight-toggle-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.autofight-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 24px;
  border: 1px solid var(--gray2);
  background: var(--black-opacity-80);
  color: var(--gray2);
  font-size: 0.8rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.autofight-toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

.autofight-icon {
  font-size: 1.1rem;
}

.autofight-label {
  font-size: 0.75rem;
}

.autofight-state {
  font-family: Anonymous, sans-serif;
  font-size: 0.85rem;
}

.autofight-tooltip {
  font-size: 0.6rem;
  color: var(--gray2);
  text-align: center;
  max-width: 240px;
  line-height: 1.3;
}
</style>
