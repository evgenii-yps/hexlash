<template>
  <div class="background">
    <div class="fight-club-container">
      <button class="switch-mode-btn" @click="$router.push('/arena')">
        {{ t.arena.hub?.switchBack || '← Arena' }}
      </button>

      <div class="fc-header">
        <h2 class="fc-title">{{ t.club.lblMyFightClub || 'MY FIGHT CLUB' }}</h2>
      </div>

      <ClubLevelBar v-if="fightClubLevel" :clubLevel="fightClubLevel" />

      <MorningReport v-if="agents.length > 0" />

      <RetirementPanel />

      <AgentRoster
        :agents="agents"
        :maxAgents="fightClubLevel?.maxAgents || 2"
        :loading="loading"
        @create="$router.push('/arena/club/create')"
        @agent-click="(id) => $router.push(`/arena/club/${id}`)"
        @toggle-auto="onToggleAutoFight"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import ClubLevelBar from '@/components/club/ClubLevelBar.vue';
import MorningReport from '@/components/club/MorningReport.vue';
import RetirementPanel from '@/components/club/RetirementPanel.vue';
import AgentRoster from '@/components/club/AgentRoster.vue';

const agents = computed(() => store.getters['agent/agentsList']);
const loading = computed(() => store.state.agent.agentsLoading);
const fightClubLevel = computed(() => store.state.agent.clubLevel);

let refreshInterval = null;

const onToggleAutoFight = async (id, enabled) => {
  try {
    await store.dispatch('agent/toggleAutoFight', { id, enabled });
  } catch (err) {
    console.error('Toggle auto-fight error:', err);
  }
};

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
.fight-club-container {
  padding: 24px 16px;
  max-width: 600px;
  margin: 0 auto;
}
.fc-header { margin-bottom: 24px; }
.fc-title {
  font-family: 'Anonymous', monospace;
  font-size: 28px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--hex-primary);
  text-align: center;
  text-shadow: 0 0 24px rgba(255, 6, 111, 0.4);
}

.switch-mode-btn {
  background: none;
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  color: var(--hex-text-muted);
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 13px;
  letter-spacing: 1px;
  padding: 8px 16px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: color 0.2s, border-color 0.2s;
}

.switch-mode-btn:hover {
  color: var(--hex-text-primary);
  border-color: var(--hex-border-active);
}
</style>
