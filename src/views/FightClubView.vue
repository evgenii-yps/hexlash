<template>
  <div class="background background-arena">
    <div class="fight-club-container">
      <!-- Header -->
      <div class="pit-header">
        <h1 class="pit-title">{{ t.club.lblThePit || 'THE PIT' }}</h1>
        <div v-if="fightClubLevel" class="pit-subtitle">
          {{ interpolate(t.club.lblLevelAgents || 'Level {level} · {current} / {max} agents', { level: fightClubLevel.level, current: fightClubLevel.currentAgents, max: fightClubLevel.maxAgents }) }}
        </div>
      </div>

      <!-- XP bar -->
      <div v-if="fightClubLevel" class="pit-xp">
        <div class="pit-xp-bar">
          <div class="pit-xp-fill" :style="{ width: xpPercent + '%' }"></div>
        </div>
        <div class="pit-xp-meta">
          <span>{{ formatXp(xpProgress) }} / {{ formatXp(xpTotal) }} XP</span>
          <span v-if="!fightClubLevel.isMaxLevel">{{ interpolate(t.club.lblNextLevel || 'next: Lv {n}', { n: fightClubLevel.level + 1 }) }}</span>
          <span v-else>{{ t.club.lblMaxLevelFull || 'Max Level' }}</span>
        </div>
      </div>

      <!-- Roster -->
      <AgentRoster
        :agents="agents"
        :maxAgents="fightClubLevel?.maxAgents || 2"
        :loading="loading"
        @create="$router.push('/arena/club/create')"
        @agent-click="(id) => $router.push(`/arena/club/${id}`)"
      />

      <!-- Report -->
      <MorningReport v-if="agents.length > 0" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import store from '@/core/state/store.js';
import { t, interpolate } from '@/locales/index.js';
import MorningReport from '@/components/club/MorningReport.vue';
import AgentRoster from '@/components/club/AgentRoster.vue';

const agents = computed(() => store.getters['agent/agentsList']);
const loading = computed(() => store.state.agent.agentsLoading);
const fightClubLevel = computed(() => store.state.agent.fightClubLevel);

const xpProgress = computed(() => {
  const fl = fightClubLevel.value;
  if (!fl) return 0;
  return fl.xp - (fl.xpForCurrentLevel || 0);
});
const xpTotal = computed(() => {
  const fl = fightClubLevel.value;
  if (!fl || !fl.xpForNextLevel) return 0;
  return fl.xpForNextLevel - (fl.xpForCurrentLevel || 0);
});
const xpPercent = computed(() => {
  if (!xpTotal.value) return 0;
  return Math.min(100, Math.round((xpProgress.value / xpTotal.value) * 100));
});
const formatXp = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
};

let refreshInterval = null;

onMounted(() => {
  store.dispatch('agent/fetchAgents');
  store.dispatch('agent/fetchFightClubLevel');
  refreshInterval = setInterval(() => {
    store.dispatch('agent/fetchAgents');
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.background-arena {
  background: url('@/assets/images/background_arena.webp') no-repeat center center;
}

.background-arena::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right bottom, var(--hex-bg-dark) 25%, transparent 75%);
  z-index: 1;
  pointer-events: none;
}

.background-arena::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--hex-bg-dark);
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
  pointer-events: none;
}

@keyframes fadeOut {
  to { opacity: 0; }
}

.fight-club-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
  padding: 80px 16px 120px;
  max-width: 600px;
  margin: 0 auto;
}

@supports (height: 100dvh) {
  .fight-club-container {
    height: 100dvh;
  }
}

/* Header */
.pit-header { text-align: center; margin-bottom: 6px; }
.pit-title {
  font-family: 'Anonymous', monospace;
  font-size: 32px;
  letter-spacing: 6px;
  color: var(--hex-primary);
  text-shadow: 0 0 24px var(--hex-primary-glow);
  line-height: 1;
  margin: 0;
  text-transform: uppercase;
}
.pit-subtitle {
  font-size: 10px;
  color: var(--hex-text-muted);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 8px;
}

/* XP bar */
.pit-xp { margin-bottom: 22px; }
.pit-xp-bar {
  height: 3px;
  background: var(--hex-bg-light);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}
.pit-xp-fill {
  height: 100%;
  background: var(--hex-text-muted);
  border-radius: 2px;
  transition: width 300ms;
}
.pit-xp-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--hex-text-muted);
}

@media (min-width: 1024px) {
  .fight-club-container {
    max-width: 1200px;
    padding: 100px 24px 120px;
  }
  .pit-title {
    font-size: 56px;
    letter-spacing: 12px;
    text-shadow: 0 0 40px var(--hex-primary-glow), 0 0 80px var(--hex-primary-glow);
  }
  .pit-subtitle {
    font-size: 13px;
    letter-spacing: 4px;
    margin-top: 12px;
  }
  .pit-xp { margin-bottom: 36px; }
  .pit-xp-bar { height: 4px; margin-bottom: 6px; }
  .pit-xp-meta { font-size: 12px; }
}
</style>
