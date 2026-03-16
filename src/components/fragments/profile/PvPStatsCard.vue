<template>
  <div class="pvp-stats-card">

    <!-- Section Header -->
    <div class="section-header">
      <span class="header-icon">&#x2694;&#xFE0F;</span>
      {{ sectionTitle }}
    </div>

    <!-- League Display -->
    <div class="league-display">
      <div class="league-icon">{{ league.icon }}</div>
      <div class="league-name" :style="{ color: league.color }">{{ league.name }}</div>
      <div class="rating-value">{{ rating }}</div>
    </div>

    <!-- Rating Progress to next league -->
    <div class="league-progress" v-if="nextLeague">
      <div class="progress-label">
        {{ nextLeagueText }}: {{ nextLeague.name }} ({{ nextLeague.min }})
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-box wins">
        <div class="stat-value">{{ wins }}</div>
        <div class="stat-label">{{ winsText }}</div>
      </div>

      <div class="stat-box losses">
        <div class="stat-value">{{ losses }}</div>
        <div class="stat-label">{{ lossesText }}</div>
      </div>

      <div class="stat-box winrate">
        <div class="stat-value">{{ winRate }}%</div>
        <div class="stat-label">{{ winRateText }}</div>
      </div>
    </div>

    <!-- Total Fights -->
    <div class="total-fights">
      {{ totalFightsText }}: {{ totalFights }}
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';

defineProps({
  sectionTitle: { type: String, default: 'PVP STATS' },
  winsText: { type: String, default: 'Wins' },
  lossesText: { type: String, default: 'Losses' },
  winRateText: { type: String, default: 'Win Rate' },
  totalFightsText: { type: String, default: 'Total Fights' },
  nextLeagueText: { type: String, default: 'Next league' },
});

// PvP data from store
const pvpStats = computed(() => store.getters['pvp/getPvpStats']);
const rating = computed(() => pvpStats.value.rating);
const wins = computed(() => pvpStats.value.wins);
const losses = computed(() => pvpStats.value.losses);
const winRate = computed(() => store.getters['pvp/winRate']);
const league = computed(() => store.getters['pvp/league']);
const totalFights = computed(() => wins.value + losses.value + (pvpStats.value.draws || 0));

// Leagues data for progress calculation
const leagues = [
  { name: 'Bronze', min: 0, max: 999, icon: '\u{1F949}', color: '#CD7F32' },
  { name: 'Silver', min: 1000, max: 1499, icon: '\u{1F948}', color: '#C0C0C0' },
  { name: 'Gold', min: 1500, max: 1999, icon: '\u{1F947}', color: '#FFD700' },
  { name: 'Platinum', min: 2000, max: 2499, icon: '\u{1F48E}', color: '#00CED1' },
  { name: 'Diamond', min: 2500, max: 2999, icon: '\u{1F4A0}', color: '#00BFFF' },
  { name: 'Champion', min: 3000, max: Infinity, icon: '\u{1F451}', color: '#FFD700' },
];

const currentLeagueIndex = computed(() => {
  return leagues.findIndex(l => rating.value >= l.min && rating.value <= l.max);
});

const nextLeague = computed(() => {
  const nextIndex = currentLeagueIndex.value + 1;
  if (nextIndex < leagues.length) {
    return leagues[nextIndex];
  }
  return null;
});

const progressPercent = computed(() => {
  if (!nextLeague.value) return 100;

  const currentLeague = leagues[currentLeagueIndex.value];
  const rangeStart = currentLeague.min;
  const rangeEnd = nextLeague.value.min;
  const progress = rating.value - rangeStart;
  const total = rangeEnd - rangeStart;

  return Math.min(100, Math.round((progress / total) * 100));
});
</script>

<style scoped>
.pvp-stats-card {
  background: rgba(20, 20, 30, 0.8);
  border: 1px solid rgba(255, 6, 111, 0.3);
  border-radius: 16px;
  padding: 20px 16px;
  margin: 16px 15px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: Anonymous, sans-serif;
  font-size: 16px;
  color: #FF066F;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(255, 6, 111, 0.4);
}

.header-icon {
  font-size: 20px;
}

/* ── League Display ───────────────────────────────────────────── */
.league-display {
  text-align: center;
  margin-bottom: 20px;
}

.league-icon {
  font-size: 48px;
  margin-bottom: 6px;
}

.league-name {
  font-family: Anonymous, sans-serif;
  font-size: 22px;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 4px;
  font-weight: bold;
}

.rating-value {
  font-family: AnonymousBalance, sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

/* ── League Progress ──────────────────────────────────────────── */
.league-progress {
  margin-bottom: 20px;
}

.progress-label {
  font-size: 11px;
  color: var(--gray2);
  text-align: center;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF066F, #FFB800);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* ── Stats Grid ───────────────────────────────────────────────── */
.stats-grid {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.stat-box {
  flex: 1;
  background: rgba(30, 30, 40, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
}

.stat-value {
  font-family: AnonymousBalance, sans-serif;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-box.wins .stat-value {
  color: #00FF88;
}

.stat-box.losses .stat-value {
  color: #FF3333;
}

.stat-box.winrate .stat-value {
  color: #FFB800;
}

.stat-label {
  font-size: 10px;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ── Total Fights ─────────────────────────────────────────────── */
.total-fights {
  text-align: center;
  font-size: 12px;
  color: var(--gray2);
}
</style>
