<template>
  <div class="clan-stats" v-if="clanData">
    <!-- Stats Grid: 4 cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ clanData.members }}</span>
        <span class="stat-label">{{ t.rating.members }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-wins">{{ formatNumber(clanData.wins || 0) }}</span>
        <span class="stat-label">{{ t.rating.wins }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-losses">{{ formatNumber(losses) }}</span>
        <span class="stat-label">{{ t.rating.losses }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-winrate">{{ winRate }}%</span>
        <span class="stat-label">{{ t.pvp?.winRate || 'Win Rate' }}</span>
      </div>
    </div>

    <!-- Win Rate Bar -->
    <div v-if="totalFights > 0" class="winrate-bar">
      <div class="winrate-fill-wins" :style="{ width: winRate + '%' }"></div>
      <div class="winrate-fill-losses" :style="{ width: (100 - winRate) + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { t } from "@/locales/index.js";
import { formatNumber } from "@/core/constants.js";

const props = defineProps({
  clanData: {
    type: Object,
    required: true,
    default: () => ({})
  },
});

const totalFights = computed(() => props.clanData?.battles || 0);
const losses = computed(() => totalFights.value - (props.clanData?.wins || 0));
const winRate = computed(() => {
  if (totalFights.value === 0) return 0;
  return Math.round((props.clanData.wins || 0) / totalFights.value * 100);
});
</script>

<style scoped>
.clan-stats {
  margin: 12px 16px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  background: var(--hex-bg-card);
  border: 0.5px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  font-family: var(--hex-font-mono);
  color: var(--hex-text-primary);
}

.stat-wins { color: var(--hex-victory); }
.stat-losses { color: var(--hex-defeat); }
.stat-winrate { color: var(--hex-draw); }

.stat-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--hex-text-muted);
  margin-top: 2px;
}

/* Win Rate Bar */
.winrate-bar {
  display: flex;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
}

.winrate-fill-wins {
  height: 100%;
  background: var(--hex-victory);
  opacity: 0.5;
  transition: width 0.4s ease;
}

.winrate-fill-losses {
  height: 100%;
  background: var(--hex-defeat);
  opacity: 0.5;
  transition: width 0.4s ease;
}
</style>
