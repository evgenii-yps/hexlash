<template>
  <div v-if="isEnabled" class="autofight-status">
    <div class="status-header">
      <span class="status-icon">&#x1F504;</span>
      <span class="status-title">{{ t.autoFight.lblAutoFightActive }}</span>
    </div>

    <div class="status-rows">
      <div class="status-row">
        <span class="status-label">{{ t.autoFight.lblNextFightIn }}:</span>
        <span class="status-value">{{ timeDisplay }}</span>
      </div>
      <div class="status-row">
        <span class="status-label">{{ t.autoFight.lblFightsToday }}:</span>
        <span class="status-value">{{ fightsToday }}</span>
      </div>
      <div class="status-row">
        <span class="status-label">{{ t.autoFight.lblWins }}:</span>
        <span class="status-value status-win">{{ wins }}</span>
        <span class="status-separator">|</span>
        <span class="status-label">{{ t.autoFight.lblLosses }}:</span>
        <span class="status-value status-lose">{{ losses }}</span>
      </div>
    </div>

    <div v-if="isStopping" class="status-stopping">
      {{ t.autoFight.lblStopping }}
    </div>

    <div class="status-buttons">
      <button class="status-btn status-btn-log" @click="viewLog">
        {{ t.autoFight.lblViewFightLog }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import { t } from '@/locales/index.js';

const isEnabled = computed(() => store.getters['autoFight/isEnabled']);
const fightsToday = computed(() => store.getters['autoFight/getFightsToday']);
const wins = computed(() => store.getters['autoFight/getWins']);
const losses = computed(() => store.getters['autoFight/getLosses']);
const isStopping = computed(() => store.getters['autoFight/isStoppingAfterCurrent']);

const nextFightAt = computed(() => store.state.autoFight.nextFightAt);
const now = ref(Date.now());
let timerInterval = null;
let fightTriggered = false;

onMounted(() => {
  // Run pending check immediately on mount
  if (isEnabled.value) {
    store.dispatch('autoFight/checkAndRunPending');
  }

  timerInterval = setInterval(() => {
    now.value = Date.now();

    // Trigger auto fight when timer reaches 0
    if (isEnabled.value && nextFightAt.value && now.value >= nextFightAt.value && !fightTriggered) {
      fightTriggered = true;
      store.dispatch('autoFight/checkAndRunPending')
        .then(() => { fightTriggered = false; })
        .catch(() => { fightTriggered = false; });
    }
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timerInterval);
});

// Reset trigger flag when nextFightAt changes (new fight scheduled)
watch(nextFightAt, () => {
  fightTriggered = false;
});

const timeDisplay = computed(() => {
  if (!nextFightAt.value) return '--:--';
  const diff = Math.max(0, Math.ceil((nextFightAt.value - now.value) / 1000));
  if (diff <= 0) return '--:--';
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

const stopAutoFight = () => {
  store.dispatch('autoFight/disable');
};

const viewLog = async () => {
  await router.push('/arena/autofight-log');
};
</script>

<style scoped>
.autofight-status {
  width: 100%;
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.9) 0%, rgba(26, 26, 46, 0.6) 100%);
  border: 1px solid rgba(255, 6, 111, 0.3);
  border-radius: 12px;
  padding: 14px 16px;
  position: relative;
  overflow: hidden;
}

.autofight-status::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  animation: statusGlow 3s ease-in-out infinite;
}

@keyframes statusGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.status-icon {
  font-size: 1.1rem;
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-title {
  font-family: Anonymous, sans-serif;
  font-size: 0.8rem;
  color: var(--primary-color);
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.3);
}

.status-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
}

.status-label {
  color: var(--gray2);
}

.status-value {
  color: white;
  font-family: system-ui, sans-serif;
  font-weight: bold;
}

.status-win {
  color: #2ecc71;
}

.status-lose {
  color: #e74c3c;
}

.status-separator {
  color: var(--gray2);
  font-size: 0.6rem;
}

.status-stopping {
  font-size: 0.65rem;
  color: #f1c40f;
  text-align: center;
  margin-bottom: 8px;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-buttons {
  display: flex;
  gap: 8px;
}

.status-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
}

.status-btn-stop {
  background: rgba(231, 76, 60, 0.15);
  border: 1px solid rgba(231, 76, 60, 0.5);
  color: #e74c3c;
}

.status-btn-stop:active {
  background: rgba(231, 76, 60, 0.3);
}

.status-btn-log {
  background: rgba(255, 6, 111, 0.1);
  border: 1px solid rgba(255, 6, 111, 0.4);
  color: var(--primary-color);
}

.status-btn-log:active {
  background: rgba(255, 6, 111, 0.25);
}
</style>
