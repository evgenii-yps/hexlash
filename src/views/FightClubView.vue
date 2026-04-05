<template>
  <div class="background">
    <div class="fight-club-container">
      <div class="fc-header-row">
        <button class="back-link" @click="$router.push('/arena')">
          {{ t.arena.hub?.switchBack || '← Arena' }}
        </button>
        <h2 class="fc-title">{{ t.club.lblMyFightClub || 'MY FIGHT CLUB' }}</h2>
        <span class="fc-header-spacer"></span>
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
.fc-header-row {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.fc-header-spacer {
  min-width: 80px;
}
.back-link {
  font-size: 16px;
  color: var(--hex-primary);
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Anonymous', monospace;
  letter-spacing: 0.5px;
  padding: 6px 0;
  transition: opacity 0.2s;
  white-space: nowrap;
  min-width: 80px;
}
.back-link:hover {
  opacity: 0.7;
}
.fc-title {
  font-family: 'Anonymous', monospace;
  font-size: 24px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--hex-primary);
  text-align: center;
  text-shadow: 0 0 24px rgba(255, 6, 111, 0.4);
  flex: 1;
}
</style>
