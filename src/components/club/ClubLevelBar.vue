<template>
  <div class="club-level-bar">
    <div class="club-level-header">
      <span class="club-level-title">{{ t.club.lblClubLevel || 'CLUB LEVEL' }} {{ clubLevel.level }}</span>
      <span class="club-level-agents">{{ t.club.lblAgents || 'Agents' }}: {{ clubLevel.currentAgents }} / {{ clubLevel.maxAgents }}</span>
    </div>
    <HexProgress
      :value="clubLevel.progress || 0"
      :max="100"
      variant="generic"
      :color="'var(--hex-primary)'"
      size="sm"
      :show-percent="false"
    />
    <div class="club-level-xp">
      <template v-if="clubLevel.isMaxLevel">MAX LEVEL</template>
      <template v-else>{{ formatNum(xpProgress) }} / {{ formatNum(xpTotal) }} XP</template>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { t } from '@/locales/index.js'
import HexProgress from '@/components/ui/HexProgress.vue'

export default {
  name: 'ClubLevelBar',
  components: { HexProgress },
  props: {
    clubLevel: { type: Object, required: true },
  },
  setup(props) {
    const xpProgress = computed(() => {
      const cur = props.clubLevel.xpForCurrentLevel || 0;
      return props.clubLevel.xp - cur;
    });
    const xpTotal = computed(() => {
      const cur = props.clubLevel.xpForCurrentLevel || 0;
      const next = props.clubLevel.xpForNextLevel;
      return next ? next - cur : 0;
    });
    const formatNum = (n) => {
      if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      return String(n);
    };
    return { t, xpProgress, xpTotal, formatNum };
  },
};
</script>

<style scoped>
.club-level-bar {
  padding: 12px 16px;
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 10px;
  margin-bottom: 16px;
}
.club-level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.club-level-title {
  font-family: 'Anonymous', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-primary);
}
.club-level-agents {
  font-family: 'AnonymousBalance', monospace;
  font-size: 11px;
  color: var(--hex-text-muted);
}
.club-level-xp {
  margin-top: 4px;
  text-align: right;
  font-family: 'AnonymousBalance', monospace;
  font-size: 10px;
  color: var(--hex-text-muted);
}
</style>
