<template>
  <div v-if="isEnabled" class="clubmode-status">
    <div class="status-header">
      <span class="status-icon">&#x1F504;</span>
      <span class="status-title">{{ t.clubMode.lblClubModeActive }}</span>
    </div>

    <div class="status-rows">
      <div class="status-row">
        <span class="status-label">{{ t.clubMode.lblNextFightIn }}:</span>
        <span class="status-value">{{ timeDisplay }}</span>
      </div>
      <div class="status-row">
        <span class="status-label">{{ t.clubMode.lblFightsToday }}:</span>
        <span class="status-value">{{ fightsToday }}</span>
      </div>
      <div class="status-row">
        <span class="status-label">{{ t.clubMode.lblWins }}:</span>
        <span class="status-value status-win">{{ wins }}</span>
        <span class="status-separator">|</span>
        <span class="status-label">{{ t.clubMode.lblLosses }}:</span>
        <span class="status-value status-lose">{{ losses }}</span>
      </div>
    </div>

    <div v-if="isStopping" class="status-stopping">
      {{ t.clubMode.lblStopping }}
    </div>

    <div class="status-buttons">
      <button class="status-btn status-btn-log" @click="viewLog">
        {{ t.clubMode.lblAnalysis }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import { t } from '@/locales/index.js';

const isEnabled = computed(() => store.getters['clubMode/isEnabled']);
const fightsToday = computed(() => store.getters['clubMode/getFightsToday']);
const wins = computed(() => store.getters['clubMode/getWins']);
const losses = computed(() => store.getters['clubMode/getLosses']);
const isStopping = computed(() => store.getters['clubMode/isStoppingAfterCurrent']);

const nextFightAt = computed(() => store.state.clubMode.nextFightAt);
const now = ref(Date.now());
let timerInterval = null;
let fightTriggered = false;

onMounted(() => {
  // Run pending check immediately on mount
  if (isEnabled.value) {
    store.dispatch('clubMode/checkAndRunPending');
  }

  timerInterval = setInterval(() => {
    now.value = Date.now();

    // Trigger club mode fight when timer reaches 0
    if (isEnabled.value && nextFightAt.value && now.value >= nextFightAt.value && !fightTriggered) {
      fightTriggered = true;
      store.dispatch('clubMode/checkAndRunPending')
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

const stopClubMode = () => {
  store.dispatch('clubMode/disable');
};

const viewLog = async () => {
  await router.push('/arena/club-mode-log');
};
</script>

<style scoped>
.clubmode-status {
  width: 100%;
  background: linear-gradient(135deg, var(--hex-bg-dark) 0%, var(--hex-bg-light) 100%);
  border: 1px solid color-mix(in srgb, var(--hex-primary) 30%, transparent);
  border-radius: var(--hex-radius-lg);
  padding: 14px 16px;
  position: relative;
  overflow: hidden;
}

.clubmode-status::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--hex-primary), transparent);
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
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 0.8rem;
  color: var(--hex-primary);
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 10px var(--hex-primary-glow);
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
  color: var(--hex-text-muted);
}

.status-value {
  color: var(--hex-text-primary);
  font-family: system-ui, sans-serif;
  font-weight: bold;
}

.status-win {
  color: var(--hex-victory);
}

.status-lose {
  color: var(--hex-defeat);
}

.status-separator {
  color: var(--hex-text-muted);
  font-size: 0.6rem;
}

.status-stopping {
  font-size: 0.65rem;
  color: var(--hex-warning);
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
  background: color-mix(in srgb, var(--hex-danger) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--hex-danger) 50%, transparent);
  color: var(--hex-danger);
}

.status-btn-stop:active {
  background: color-mix(in srgb, var(--hex-danger) 30%, transparent);
}

.status-btn-log {
  background: color-mix(in srgb, var(--hex-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--hex-primary) 40%, transparent);
  color: var(--hex-primary);
}

.status-btn-log:active {
  background: color-mix(in srgb, var(--hex-primary) 25%, transparent);
}
</style>
