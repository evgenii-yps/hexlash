<template>
  <div class="round-display" v-if="round">
    <div class="round-number">{{ t('fight.lblRound', { n: round.roundNum }) }}</div>
    <div class="round-actions">
      <div class="round-action action-left" :class="actionClass(round.action1)">
        <div class="action-icon">{{ actionIcon(round.action1) }}</div>
        <div class="action-label">{{ actionName(round.action1) }}</div>
        <div class="action-dmg dmg-red" v-if="round.damage2 > 0">-{{ round.damage2 }} HP</div>
        <div
            v-for="(evt, i) in leftEvents"
            :key="i"
            class="action-event"
            :class="evt.cls"
        >{{ evt.text }}</div>
      </div>

      <div class="vs-label">VS</div>

      <div class="round-action action-right" :class="actionClass(round.action2)">
        <div class="action-icon">{{ actionIcon(round.action2) }}</div>
        <div class="action-label">{{ actionName(round.action2) }}</div>
        <div class="action-dmg dmg-red" v-if="round.damage1 > 0">-{{ round.damage1 }} HP</div>
        <div
            v-for="(evt, i) in rightEvents"
            :key="i"
            class="action-event"
            :class="evt.cls"
        >{{ evt.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

const props = defineProps({
  round: { type: Object, default: null },
});

const ACTION_CONFIG = {
  attack:   { icon: '⚔️', name: 'Атака',  cls: 'round-action-attack' },
  defense:  { icon: '🛡️', name: 'Защита', cls: 'round-action-defense' },
  position: { icon: '👣', name: 'Позиция', cls: 'round-action-position' },
};

const actionClass = (action) => ACTION_CONFIG[action]?.cls || '';
const actionIcon  = (action) => ACTION_CONFIG[action]?.icon || '❓';
const actionName  = (action) => ACTION_CONFIG[action]?.name || action;

const formatEvent = (evt) => {
  switch (evt.type) {
    case 'block':    return { text: t('fight.lblBlocked'),                cls: 'event-block' };
    case 'dodge':    return { text: t('fight.lblDodged'),                 cls: 'event-dodge' };
    case 'crit':     return { text: t('fight.lblCrit'),                   cls: 'event-crit' };
    case 'shield':   return { text: t('fight.lblShield'),                 cls: 'event-shield' };
    case 'missed':   return { text: t('fight.lblMissed'),                 cls: 'event-miss' };
    case 'position': return { text: `+${evt.value} ATK`,                  cls: 'event-position' };
    default:         return { text: evt.type,                             cls: '' };
  }
};

const leftEvents = computed(() => {
  if (!props.round) return [];
  return props.round.events
      .filter(e => e.fighter === 1 && e.type !== 'damage')
      .map(formatEvent);
});

const rightEvents = computed(() => {
  if (!props.round) return [];
  return props.round.events
      .filter(e => e.fighter === 2 && e.type !== 'damage')
      .map(formatEvent);
});
</script>

<style scoped>
.round-display {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.round-number {
  text-align: center;
  font-size: 0.75rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.round-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.round-action {
  flex: 1;
  max-width: 140px;
  padding: 8px;
  border-radius: 6px;
  background-color: var(--black-opacity-80);
  border: 2px solid var(--gray2);
  text-align: center;
  animation: cardSlideIn 0.4s ease-out;
}

.action-left  { animation-name: cardSlideLeft;  }
.action-right { animation-name: cardSlideRight; }

@keyframes cardSlideLeft  { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes cardSlideRight { from { transform: translateX(30px);  opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.round-action-attack   { border-color: #e74c3c; }
.round-action-defense  { border-color: #3498db; }
.round-action-position { border-color: #9b59b6; }

.action-icon  { font-size: 1.2rem; margin-bottom: 2px; }
.action-label { font-size: 0.65rem; color: white; margin-bottom: 4px; }
.action-dmg   { font-size: 0.85rem; font-weight: bold; margin-top: 2px; }
.dmg-red      { color: #e74c3c; }

.action-event { font-size: 0.6rem; margin-top: 3px; font-weight: bold; }

.event-block    { color: #3498db; }
.event-dodge    { color: #9b59b6; }
.event-crit     { color: #FFD600; }
.event-shield   { color: #448AFF; }
.event-miss     { color: #7f8c8d; }
.event-position { color: #9b59b6; }

.vs-label { font-size: 0.75rem; color: var(--gray2); font-weight: bold; }
</style>
