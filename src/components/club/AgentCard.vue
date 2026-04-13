<template>
  <div class="agent-card" @click="$emit('click', agent.id)">
    <HexCard variant="default" padding="md" clickable>
      <!-- Header row -->
      <div class="card-header">
        <div class="card-header-left">
          <img class="card-skin" :src="`/images/skins/${agent.skin}`" :alt="agent.name" />
          <div class="card-identity">
            <div class="card-name">
              <span v-if="agent.isCaptain" class="captain-star">★</span>
              {{ agent.name }}
            </div>
            <div class="card-meta">
              {{ beltName }} · {{ agent.wins }}-{{ agent.losses }}-{{ agent.draws }}
            </div>
          </div>
        </div>
        <span class="card-status">{{ statusText }}</span>
      </div>

      <!-- Divider + Meta row (archetypes) -->
      <div class="card-divider"></div>
      <div v-if="agent.primaryModule" class="card-archetypes">
        <span class="arch-abbr" :style="{ color: `var(--hex-arch-${agent.primaryModule})` }">{{ shortArch(agent.primaryModule) }}</span>
        <span class="arch-dot">·</span>
        <span class="arch-abbr" :style="{ color: `var(--hex-arch-${agent.secondaryModule})` }">{{ shortArch(agent.secondaryModule) }}</span>
        <span class="arch-dot">·</span>
        <span class="arch-abbr" :style="{ color: `var(--hex-arch-${agent.tertiaryModule})` }">{{ shortArch(agent.tertiaryModule) }}</span>
      </div>
      <div v-else class="card-no-modules">{{ t.club.lblNoModules || 'No modules set' }}</div>

      <!-- Fight button (captain only) -->
      <template v-if="agent.isCaptain">
        <div class="card-divider"></div>
        <div class="card-fight" @click.stop>
          <HexButton variant="primary" block :disabled="agent.status !== 'idle'" @click="goToFight" class="fight-btn">
            {{ t.club.lblFight || 'FIGHT' }}
          </HexButton>
        </div>
      </template>
    </HexCard>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/locales/index.js'
import { getBeltDisplay } from '@/utils/beltDisplay.js'
import HexCard from '@/components/ui/HexCard.vue'
import HexButton from '@/components/ui/HexButton.vue'

export default {
  name: 'AgentCard',
  components: { HexCard, HexButton },
  props: {
    agent: { type: Object, required: true },
  },
  emits: ['click'],
  setup(props) {
    const router = useRouter();

    const beltName = computed(() => {
      const d = getBeltDisplay(props.agent.belt || 0);
      return t.value.belts?.[d.color] || d.color;
    });

    const statusText = computed(() => {
      if (props.agent.status === 'fighting') return t.value.club.lblFighting || 'Fighting';
      if (props.agent.status === 'resting') {
        if (!props.agent.nextFightAt) return t.value.club.lblResting || 'Resting';
        const diff = new Date(props.agent.nextFightAt).getTime() - Date.now();
        if (diff <= 0) return t.value.club.lblIdle || 'Idle';
        return `${Math.ceil(diff / 60000)}m`;
      }
      return t.value.club.lblIdle || 'Idle';
    });

    const shortArch = (name) => name ? name.slice(0, 3).toUpperCase() : '';

    const goToFight = () => router.push('/arena/fight');

    return { t, beltName, statusText, shortArch, goToFight };
  },
};
</script>

<style scoped>
.agent-card { cursor: pointer; }

/* Header */
.card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.card-header-left { display: flex; gap: 12px; align-items: center; min-width: 0; }

.card-skin {
  width: 56px;
  height: 56px;
  border-radius: var(--hex-radius-md, 8px);
  object-fit: cover;
  object-position: top;
  border: 1px solid var(--hex-border-default);
  flex-shrink: 0;
}

.card-identity { min-width: 0; }

.card-name {
  font-family: 'Anonymous', monospace;
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--hex-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}

.captain-star { color: var(--hex-primary); font-size: 11px; }

.card-meta {
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--hex-text-muted);
  margin-top: 4px;
}

.card-status {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--hex-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 2px;
}

/* Divider */
.card-divider {
  border-top: 1px solid var(--hex-border-default);
  margin: 8px 0;
}

/* Archetypes */
.card-archetypes { display: flex; gap: 6px; align-items: center; }
.arch-abbr { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }
.arch-dot { color: var(--hex-text-muted); font-size: 10px; }
.card-no-modules { font-size: 11px; color: var(--hex-text-muted); font-style: italic; }

/* Fight button */
.card-fight { padding-top: 0; }
.fight-btn[disabled] { background: transparent; border: 1px solid var(--hex-border-default); }
</style>
