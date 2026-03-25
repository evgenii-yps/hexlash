<template>
  <div class="background background-log">
    <div class="log-container" @scroll="handleScroll">
      <div class="log-content-wrapper">

        <div class="top-bar">
          <button class="back-btn" @click="goBack">&larr; {{ t.autoFight.lblBack }}</button>
          <span class="top-title">{{ t.autoFight.lblAiAnalysis }}</span>
        </div>

        <!-- Period selector -->
        <div class="period-selector">
          <button
            v-for="p in periods"
            :key="p.value"
            class="period-chip"
            :class="{ 'period-chip--active': selectedPeriod === p.value }"
            @click="selectPeriod(p.value)"
          >{{ p.label }}</button>
        </div>

        <!-- Analyze button -->
        <div class="analyze-row">
          <button
            class="analyze-btn"
            :disabled="!canAnalyze || aiLoading"
            @click="runAnalysis"
          >
            <span v-if="!aiLoading">{{ t.autoFight.lblAnalyze }}</span>
            <span v-else>{{ t.autoFight.lblAnalyzing }}</span>
          </button>
        </div>

        <!-- AI Analysis result -->
        <AutoFightAnalysis
          v-if="aiAnalysis || aiLoading || aiError"
          :loading="aiLoading"
          :analysis="aiAnalysis"
          :error="aiError"
          @retry="runAnalysis"
        />

        <!-- Fight Log section -->
        <div class="log-header">
          <span class="log-title">{{ t.autoFight.lblFightLog }}</span>
        </div>

        <!-- Summary -->
        <div class="log-summary">
          <div class="summary-row">
            <span>{{ t.autoFight.lblFightsToday }}:</span>
            <span class="summary-value">{{ fightsToday }}</span>
          </div>
          <div class="summary-row">
            <span>{{ t.autoFight.lblWins }}:</span>
            <span class="summary-value summary-win">{{ wins }}</span>
            <span class="summary-sep">|</span>
            <span>{{ t.autoFight.lblLosses }}:</span>
            <span class="summary-value summary-lose">{{ losses }}</span>
            <span class="summary-sep">|</span>
            <span>{{ t.autoFight.lblDraws }}:</span>
            <span class="summary-value summary-draw">{{ draws }}</span>
          </div>
          <div class="summary-row">
            <span>{{ t.autoFight.lblTotalXp }}:</span>
            <span class="summary-value summary-xp">{{ totalExp }} XP</span>
          </div>
        </div>

        <!-- Fight entries -->
        <div v-if="fightLog.length === 0" class="no-fights">
          {{ t.autoFight.lblNoFights }}
        </div>

        <div v-for="fight in fightLog" :key="fight.id" class="fight-entry" :class="'entry-' + fight.result">
          <div class="entry-header">
            <span class="entry-time">{{ formatTime(fight.timestamp) }}</span>
            <span class="entry-vs">{{ t.pvp.lblVs }} {{ fight.opponent }}</span>
            <span class="entry-result" :class="'result-' + fight.result">
              {{ resultLabel(fight.result) }}
            </span>
          </div>
          <div class="entry-details">
            <span class="entry-rounds">{{ t.autoFight.lblRounds }}: {{ fight.rounds }}</span>
            <span class="entry-xp">+{{ totalXp(fight.expGained) }} XP</span>
          </div>
        </div>

        <div class="scroll-gap"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';
import router from '@/router/index.js';
import { t } from '@/locales/index.js';
import AutoFightAnalysis from '@/components/AutoFightAnalysis.vue';

const fightsToday = computed(() => store.getters['autoFight/getFightsToday']);
const wins = computed(() => store.getters['autoFight/getWins']);
const losses = computed(() => store.getters['autoFight/getLosses']);
const draws = computed(() => store.getters['autoFight/getDraws']);
const totalExp = computed(() => store.getters['autoFight/getTotalExpGained']);
const fightLog = computed(() => store.getters['autoFight/getFightLog']);
const canAnalyze = computed(() => store.getters['autoFight/canAnalyze']);
const aiAnalysis = computed(() => store.getters['autoFight/getAiAnalysis']);
const aiLoading = computed(() => store.getters['autoFight/getAiAnalysisLoading']);
const aiError = computed(() => store.getters['autoFight/getAiAnalysisError']);
const selectedPeriod = computed(() => store.getters['autoFight/getAiAnalysisPeriod']);

const periods = computed(() => [
  { value: 'last_5', label: t.value.autoFight.lblLast5 },
  { value: 'last_10', label: t.value.autoFight.lblLast10 },
  { value: 'all', label: t.value.autoFight.lblAll },
]);

const selectPeriod = (period) => {
  store.commit('autoFight/setAiAnalysisPeriod', period);
  store.dispatch('autoFight/clearAnalysis');
};

const runAnalysis = () => {
  store.dispatch('autoFight/requestAnalysis');
};

const resultLabel = (result) => {
  if (result === 'win') return t.value.autoFight.lblWin;
  if (result === 'lose') return t.value.autoFight.lblLose;
  return t.value.autoFight.lblDraw;
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const totalXp = (exp) => {
  if (!exp) return 0;
  if (typeof exp === 'number') return exp;
  return (exp.speed || 0) + (exp.power || 0) + (exp.technique || 0);
};

const goBack = async () => {
  await router.push('/arena');
};

const emit = defineEmits(['scroll']);
const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};
</script>

<style scoped>
.background-log {
  background: url('@/assets/images/background_page.webp') no-repeat center center;
  background-size: cover;
}

.background-log::before {
  content: "";
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(9,9,9,0.75) 50%, rgba(0,0,0,0.95) 100%);
  z-index: 1;
}

.log-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .log-container { height: 100dvh; }
}

.log-content-wrapper {
  width: 100%;
  box-sizing: border-box;
  max-width: 700px;
  margin: 0 auto;
  padding: 80px 20px 20px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.back-btn {
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  color: var(--gray3);
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover { color: var(--white); }

.top-title {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 1.2rem;
  color: var(--primary-color);
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.3);
}

/* Period selector */
.period-selector {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.period-chip {
  background: rgba(9, 9, 9, 0.6);
  border: 1px solid var(--gray1);
  color: var(--gray3);
  border-radius: 16px;
  padding: 6px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.period-chip:hover {
  border-color: var(--pink);
  color: var(--white);
}

.period-chip--active {
  background: rgba(255, 6, 111, 0.15);
  border-color: var(--pink);
  color: var(--pink);
}

/* Analyze button */
.analyze-row {
  text-align: center;
  margin-bottom: 16px;
}

.analyze-btn {
  background: linear-gradient(135deg, var(--pink) 0%, var(--pinkDark) 100%);
  border: none;
  color: white;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 0.95rem;
  font-family: 'Anonymous', monospace;
  letter-spacing: 1px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.analyze-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Log header */
.log-header {
  text-align: center;
  margin-top: 24px;
  margin-bottom: 20px;
}

.log-title {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 1.2rem;
  color: var(--primary-color);
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.3);
}

.log-summary {
  background: linear-gradient(135deg, rgba(9,9,9,0.9) 0%, rgba(26,26,46,0.6) 100%);
  border: 1px solid rgba(255, 6, 111, 0.2);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--gray2);
  padding: 4px 0;
}

.summary-value {
  font-family: system-ui, sans-serif;
  font-weight: bold;
  color: white;
  font-size: 1rem;
}

.summary-win { color: #2ecc71; }
.summary-lose { color: #e74c3c; }
.summary-draw { color: #f1c40f; }
.summary-xp { color: var(--primary-color); }
.summary-sep { color: var(--gray2); font-size: 0.8rem; }

.no-fights {
  text-align: center;
  color: var(--gray2);
  font-size: 0.95rem;
  padding: 50px 0;
}

.fight-entry {
  background: linear-gradient(135deg, rgba(9,9,9,0.85) 0%, rgba(26,26,46,0.5) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
}

.fight-entry::before {
  content: "";
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
}

.entry-win::before { background: #2ecc71; }
.entry-lose::before { background: #e74c3c; }
.entry-draw::before { background: #f1c40f; }

.entry-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.entry-time {
  font-size: 0.85rem;
  color: var(--gray2);
  font-family: system-ui, sans-serif;
}

.entry-vs {
  font-size: 0.95rem;
  color: white;
  flex: 1;
}

.entry-result {
  font-size: 0.9rem;
  font-weight: bold;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  letter-spacing: 0.5px;
}

.result-win { color: #2ecc71; }
.result-lose { color: #e74c3c; }
.result-draw { color: #f1c40f; }

.entry-details {
  display: flex;
  gap: 14px;
  font-size: 0.8rem;
  color: var(--gray2);
}

.entry-xp {
  color: var(--primary-color);
  font-family: system-ui, sans-serif;
  font-weight: bold;
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
