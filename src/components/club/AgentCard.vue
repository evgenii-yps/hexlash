<template>
  <div class="agent-card" :class="{ 'agent-card--fighting': agent.status === 'fighting', 'agent-card--auto': agent.autoFight }" @click="$emit('click', agent.id)">
    <HexCard variant="default" padding="md" clickable>
      <div class="agent-card-top">
        <img class="agent-skin" :src="`/images/skins/${agent.skin}`" :alt="agent.name" />
        <div class="agent-info">
          <div class="agent-name">{{ agent.name }}</div>
          <div class="agent-archetype-row">
            <HexBadge variant="archetype" :archetype="agent.primaryModule" size="sm">{{ shortArch(agent.primaryModule) }}</HexBadge>
            <HexBadge variant="archetype" :archetype="agent.secondaryModule" size="sm">{{ shortArch(agent.secondaryModule) }}</HexBadge>
            <HexBadge variant="archetype" :archetype="agent.tertiaryModule" size="sm">{{ shortArch(agent.tertiaryModule) }}</HexBadge>
          </div>
          <div class="agent-stats">
            <span class="stat-win">W:{{ agent.wins }}</span>
            <span class="stat-lose">L:{{ agent.losses }}</span>
            <span class="stat-draw">D:{{ agent.draws }}</span>
          </div>
        </div>
        <div class="agent-elo" :class="eloClass">{{ agent.elo }}</div>
      </div>

      <div class="agent-card-bottom">
        <div class="agent-status-row">
          <HexBadge v-if="agent.status === 'idle'" variant="custom" color="var(--hex-text-muted)" bg-color="var(--hex-bg-light)">{{ t.club.lblIdle || 'Idle' }}</HexBadge>
          <HexBadge v-else-if="agent.status === 'fighting'" variant="custom" color="var(--hex-primary)" bg-color="var(--hex-primary-bg, rgba(255,6,111,0.15))" :pulse="true">{{ t.club.lblFighting || 'Fighting...' }}</HexBadge>
          <HexBadge v-else-if="agent.status === 'resting'" variant="custom" color="var(--hex-draw)" bg-color="var(--hex-draw-bg)">{{ restingText }}</HexBadge>

          <label class="auto-toggle" @click.stop>
            <input type="checkbox" :checked="agent.autoFight" @change="$emit('toggle-auto', agent.id, $event.target.checked)" />
            <span class="auto-toggle-label">{{ t.club.lblAutoFight || 'Auto' }}</span>
          </label>
        </div>
      </div>
    </HexCard>
  </div>
</template>

<script>
import { computed } from 'vue'
import { t } from '@/locales/index.js'
import HexCard from '@/components/ui/HexCard.vue'
import HexBadge from '@/components/ui/HexBadge.vue'

export default {
  name: 'AgentCard',
  components: { HexCard, HexBadge },
  props: {
    agent: { type: Object, required: true },
  },
  emits: ['click', 'toggle-auto'],
  setup(props) {
    const eloClass = computed(() => {
      if (props.agent.elo < 900) return 'elo-low';
      if (props.agent.elo > 1100) return 'elo-high';
      return 'elo-mid';
    });

    const restingText = computed(() => {
      if (!props.agent.nextFightAt) return t.value.club.lblResting || 'Resting';
      const diff = new Date(props.agent.nextFightAt).getTime() - Date.now();
      if (diff <= 0) return t.value.club.lblIdle || 'Idle';
      const min = Math.ceil(diff / 60000);
      return `${min}m`;
    });

    const shortArch = (name) => {
      if (!name) return '';
      return name.slice(0, 3).toUpperCase();
    };

    return { t, eloClass, restingText, shortArch };
  },
};
</script>

<style scoped>
.agent-card { cursor: pointer; }
.agent-card--fighting :deep(.hex-card) { box-shadow: 0 0 12px rgba(255, 6, 111, 0.3); }
.agent-card--auto :deep(.hex-card) { border-color: var(--hex-border-active); }

.agent-card-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.agent-skin {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--hex-border-default);
  flex-shrink: 0;
}

.agent-info { flex: 1; min-width: 0; }

.agent-name {
  font-family: 'Anonymous', monospace;
  font-size: 13px;
  color: var(--hex-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-archetype-row {
  display: flex;
  gap: 3px;
  margin-top: 4px;
}

.agent-stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-family: 'AnonymousBalance', monospace;
  font-size: 11px;
}
.stat-win { color: var(--hex-victory); }
.stat-lose { color: var(--hex-defeat); }
.stat-draw { color: var(--hex-draw); }

.agent-elo {
  font-family: 'AnonymousBalance', monospace;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
  margin-left: auto;
}
.elo-low { color: var(--hex-defeat); }
.elo-mid { color: var(--hex-text-secondary); }
.elo-high { color: var(--hex-victory); }

.agent-card-bottom {
  margin-top: 10px;
}

.agent-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auto-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.auto-toggle input {
  width: 14px;
  height: 14px;
  accent-color: var(--hex-primary);
  cursor: pointer;
}
.auto-toggle-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--hex-text-muted);
}
</style>
