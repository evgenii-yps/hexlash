<template>
  <div class="agent-roster">
    <div class="roster-header">
      <span class="roster-title">{{ t.club.lblRoster || 'ROSTER' }} ({{ agents.length }}/{{ maxAgents }})</span>
      <HexButton
        variant="primary"
        size="sm"
        :disabled="!canCreate"
        @click="$emit('create')"
      >+ {{ t.club.lblNewAgent || 'New Agent' }}</HexButton>
    </div>

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
        @toggle-auto="(id, enabled) => $emit('toggle-auto', id, enabled)"
      />

      <div
        v-for="i in emptySlots"
        :key="'empty-' + i"
        class="empty-slot hex-fade-in"
        @click="canCreate && $emit('create')"
      >
        <div class="empty-slot-inner" :class="{ 'empty-slot--disabled': !canCreate }">
          <span class="empty-slot-icon">+</span>
          <span class="empty-slot-text">{{ canCreate ? (t.club.lblCreateAgent || 'Create Agent') : (t.club.lblRosterFull || 'Roster Full') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { t } from '@/locales/index.js'
import HexButton from '@/components/ui/HexButton.vue'
import AgentCard from '@/components/club/AgentCard.vue'

export default {
  name: 'AgentRoster',
  components: { HexButton, AgentCard },
  props: {
    agents: { type: Array, default: () => [] },
    maxAgents: { type: Number, default: 2 },
    loading: { type: Boolean, default: false },
  },
  emits: ['create', 'agent-click', 'toggle-auto'],
  setup(props) {
    const canCreate = computed(() => props.agents.length < props.maxAgents);
    const emptySlots = computed(() => Math.max(0, props.maxAgents - props.agents.length));
    return { t, canCreate, emptySlots };
  },
};
</script>

<style scoped>
.agent-roster { margin-bottom: 24px; }

.roster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.roster-title {
  font-family: 'Anonymous', monospace;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--hex-text-muted);
}

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
  cursor: pointer;
}
.empty-slot-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border: 1px dashed var(--hex-border-default);
  border-radius: 12px;
  background: var(--hex-bg-dark);
  transition: border-color 0.2s;
}
.empty-slot-inner:hover { border-color: var(--hex-primary); }
.empty-slot--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.empty-slot--disabled:hover { border-color: var(--hex-border-default); }

.empty-slot-icon {
  font-size: 48px;
  color: var(--hex-text-muted);
  line-height: 1;
}
.empty-slot-text {
  margin-top: 10px;
  font-size: 15px;
  color: var(--hex-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
