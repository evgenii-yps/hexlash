<template>
  <div class="background background-log">
    <div class="log-container" @scroll="handleScroll">
      <div class="log-content-wrapper">

        <button class="back-btn" @click="goBack">&larr; {{ t.autoFight.lblBack }}</button>

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
            <span class="summary-value summary-xp">
              S:{{ totalExp.speed }} P:{{ totalExp.power }} T:{{ totalExp.technique }}
            </span>
          </div>
        </div>

        <!-- Fight entries -->
        <div v-if="fightLog.length === 0" class="no-fights">
          {{ t.autoFight.lblNoFights }}
        </div>

        <div v-for="fight in fightLog" :key="fight.id" class="fight-entry" :class="'entry-' + fight.result">
          <div class="entry-header">
            <span class="entry-time">{{ formatTime(fight.timestamp) }}</span>
            <span class="entry-vs">vs {{ fight.opponent }}</span>
            <span class="entry-result" :class="'result-' + fight.result">
              {{ resultLabel(fight.result) }}
            </span>
          </div>
          <div class="entry-details">
            <span class="entry-rounds">{{ t.autoFight.lblRounds }}: {{ fight.rounds }}</span>
            <span class="entry-xp">+{{ totalXp(fight.expGained) }} XP</span>
          </div>
        </div>

        <!-- Clear button -->
        <button v-if="fightLog.length > 0" class="clear-btn" @click="clearHistory">
          {{ t.autoFight.lblClearHistory }}
        </button>

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

const fightsToday = computed(() => store.getters['autoFight/getFightsToday']);
const wins = computed(() => store.getters['autoFight/getWins']);
const losses = computed(() => store.getters['autoFight/getLosses']);
const draws = computed(() => store.getters['autoFight/getDraws']);
const totalExp = computed(() => store.getters['autoFight/getTotalExpGained']);
const fightLog = computed(() => store.getters['autoFight/getFightLog']);

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
  return (exp.speed || 0) + (exp.power || 0) + (exp.technique || 0);
};

const goBack = async () => {
  await router.push('/arena');
};

const clearHistory = () => {
  store.dispatch('autoFight/clearHistory');
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
  max-width: 500px;
  margin: 0 auto;
  padding: 20px 16px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--gray2);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 12px;
}

.log-header {
  text-align: center;
  margin-bottom: 16px;
}

.log-title {
  font-family: Anonymous, sans-serif;
  font-size: 1rem;
  color: var(--primary-color);
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.3);
}

.log-summary {
  background: linear-gradient(135deg, rgba(9,9,9,0.9) 0%, rgba(26,26,46,0.6) 100%);
  border: 1px solid rgba(255, 6, 111, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: var(--gray2);
  padding: 3px 0;
}

.summary-value {
  font-family: AnonymousBalance, sans-serif;
  color: white;
}

.summary-win { color: #2ecc71; }
.summary-lose { color: #e74c3c; }
.summary-draw { color: #f1c40f; }
.summary-xp { color: var(--primary-color); }
.summary-sep { color: var(--gray2); font-size: 0.6rem; }

.no-fights {
  text-align: center;
  color: var(--gray2);
  font-size: 0.75rem;
  padding: 40px 0;
}

.fight-entry {
  background: linear-gradient(135deg, rgba(9,9,9,0.85) 0%, rgba(26,26,46,0.5) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 6px;
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
  gap: 8px;
  margin-bottom: 4px;
}

.entry-time {
  font-size: 0.65rem;
  color: var(--gray2);
  font-family: AnonymousBalance, sans-serif;
}

.entry-vs {
  font-size: 0.7rem;
  color: white;
  flex: 1;
}

.entry-result {
  font-size: 0.7rem;
  font-weight: bold;
  font-family: Anonymous, sans-serif;
  letter-spacing: 0.5px;
}

.result-win { color: #2ecc71; }
.result-lose { color: #e74c3c; }
.result-draw { color: #f1c40f; }

.entry-details {
  display: flex;
  gap: 12px;
  font-size: 0.6rem;
  color: var(--gray2);
}

.entry-xp {
  color: var(--primary-color);
  font-family: AnonymousBalance, sans-serif;
}

.clear-btn {
  display: block;
  margin: 16px auto 0;
  padding: 8px 24px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--gray2);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
