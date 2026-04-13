<template>
  <div class="agent-roster">
    <div v-if="loading" class="roster-loading">
      <v-progress-circular size="28" indeterminate />
    </div>

    <div v-else class="roster-grid">
      <AgentCard
        v-for="agent in agents"
        :key="agent.id"
        :agent="agent"
        class="hex-fade-in"
        @click="$emit('agent-click', $event)"
      />

      <div
        v-for="i in emptySlots"
        :key="'empty-' + i"
        class="empty-slot hex-fade-in"
        :class="{ 'empty-slot--disabled': !canCreate }"
        @click="canCreate && $emit('create')"
      >
        <div class="empty-plus">+</div>
        <div class="empty-label">{{ canCreate ? (t.club.lblCreateAgent || 'Create Agent') : (t.club.lblRosterFull || 'Roster Full') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { t } from '@/locales/index.js'
import AgentCard from '@/components/club/AgentCard.vue'

export default {
  name: 'AgentRoster',
  components: { AgentCard },
  props: {
    agents: { type: Array, default: () => [] },
    maxAgents: { type: Number, default: 2 },
    loading: { type: Boolean, default: false },
  },
  emits: ['create', 'agent-click'],
  setup(props) {
    const canCreate = computed(() => props.agents.length < props.maxAgents);
    const emptySlots = computed(() => Math.max(0, props.maxAgents - props.agents.length));
    return { t, canCreate, emptySlots };
  },
};
</script>

<style scoped>
.agent-roster { margin-bottom: 24px; }

.roster-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.roster-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 360px) {
  .roster-grid { grid-template-columns: 1fr; }
}

.empty-slot {
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md, 8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  min-height: 180px;
  cursor: pointer;
  transition: border-color 150ms, background 150ms;
}
.empty-slot:hover { background: var(--hex-bg-medium); }
.empty-slot--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.empty-slot--disabled:hover { background: var(--hex-bg-light); border-color: var(--hex-border-default); }

.empty-plus {
  font-size: 24px;
  color: var(--hex-text-muted);
  margin-bottom: 6px;
  line-height: 1;
}
.empty-label {
  font-size: 10px;
  color: var(--hex-text-muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
}

@media (min-width: 1024px) {
  .agent-roster { margin-bottom: 32px; }
  .roster-grid { gap: 20px; }
  .empty-slot { padding: 20px; min-height: 260px; border-radius: 10px; }
  .empty-plus { font-size: 40px; margin-bottom: 10px; }
  .empty-label { font-size: 13px; letter-spacing: 2.5px; }
}
</style>
