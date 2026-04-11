<template>
  <div class="pvp-stats-card">

    <!-- Section Header -->
    <div class="section-header">
      <svg class="header-icon" viewBox="0 0 24 24" width="20" height="20">
        <path d="M6 4l4 4-6 6 2 2 6-6 4 4V4H6z" fill="currentColor"/>
        <path d="M18 20l-4-4 6-6-2-2-6 6-4-4v10h10z" fill="currentColor"/>
      </svg>
      {{ sectionTitle }}
    </div>

    <!-- League Display -->
    <div class="league-display">
      <div class="league-icon-wrapper">
        <svg class="league-svg" viewBox="0 0 24 24" width="56" height="56">
          <path d="M7 2l3 6H4l3-6z" :style="{ fill: league.color }"/>
          <path d="M17 2l-3 6h6l-3-6z" :style="{ fill: league.color }"/>
          <circle cx="12" cy="15" r="7" :style="{ fill: league.color }" opacity="0.2"/>
          <circle cx="12" cy="15" r="7" :style="{ stroke: league.color }" stroke-width="2" fill="none"/>
          <path d="M12 10l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5z" :style="{ fill: league.color }"/>
        </svg>
      </div>
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
  { name: 'Bronze', min: 0, max: 999, color: 'var(--hex-rank-bronze)' },
  { name: 'Silver', min: 1000, max: 1499, color: 'var(--hex-rank-silver)' },
  { name: 'Gold', min: 1500, max: 1999, color: 'var(--hex-rank-gold)' },
  { name: 'Platinum', min: 2000, max: 2499, color: 'var(--hex-rank-platinum)' },
  { name: 'Diamond', min: 2500, max: 2999, color: 'var(--hex-rank-diamond)' },
  { name: 'Champion', min: 3000, max: Infinity, color: 'var(--hex-rank-gold)' },
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
  background: transparent;
  border: 1px solid var(--hex-border-default);
  border-radius: 16px;
  padding: 20px 16px;
  margin: 16px 15px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  font-size: 16px;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.header-icon {
  color: var(--hex-text-secondary);
  flex-shrink: 0;
}

/* ── League Display ───────────────────────────────────────────── */
.league-display {
  text-align: center;
  margin-bottom: 20px;
}

.league-icon-wrapper {
  display: inline-block;
  margin-bottom: 6px;
}

.league-svg {
  filter: drop-shadow(0 0 8px currentColor);
}

.league-name {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  font-size: 22px;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 4px;
  font-weight: bold;
  text-shadow: 0 0 15px currentColor;
}

.rating-value {
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 32px;
  font-weight: 700;
  color: var(--hex-text-primary);
}

/* ── League Progress ──────────────────────────────────────────── */
.league-progress {
  margin-bottom: 20px;
}

.progress-label {
  font-size: 11px;
  color: var(--hex-text-secondary);
  text-align: center;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--hex-border-default);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--hex-success), var(--hex-draw));
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
  background: transparent;
  border: 1px solid var(--hex-border-active);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
}

.stat-value {
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-box.wins .stat-value {
  color: var(--hex-victory);
}

.stat-box.losses .stat-value {
  color: var(--hex-defeat);
}

.stat-box.winrate .stat-value {
  color: var(--hex-draw);
}

.stat-label {
  font-size: 10px;
  color: var(--hex-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ── Total Fights ─────────────────────────────────────────────── */
.total-fights {
  text-align: center;
  font-size: 12px;
  color: var(--hex-text-secondary);
}
</style>
