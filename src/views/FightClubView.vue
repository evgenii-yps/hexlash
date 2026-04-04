<template>
  <div class="background">
    <div class="fight-club-container">
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
  padding: 16px;
  max-width: 520px;
  margin: 0 auto;
}
.fc-header { margin-bottom: 16px; }
.fc-title {
  font-family: 'Anonymous', monospace;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--hex-primary);
  text-align: center;
}
</style>
