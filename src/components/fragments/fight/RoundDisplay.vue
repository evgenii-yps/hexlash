<template>
  <div class="round-display" v-if="round">
    <div class="round-number">{{ t('fight.lblRound', { n: round.roundNum }) }}</div>
    <div class="round-actions">
      <div class="round-action action-left" :class="actionClass(round.action1)">
        <img :src="actionImage(round.action1)" class="action-icon-img" alt=""/>
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
        <img :src="actionImage(round.action2)" class="action-icon-img" alt=""/>
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
import iconAttack   from '@/assets/images/icons/attack.svg';
import iconDefense  from '@/assets/images/icons/defense.svg';
import iconPosition from '@/assets/images/icons/position.svg';

const { t } = useI18n({ useScope: 'global' });

const props = defineProps({
  round: { type: Object, default: null },
});

const ACTION_CONFIG = {
  attack:   { image: iconAttack,   name: 'Атака',  cls: 'round-action-attack' },
  defense:  { image: iconDefense,  name: 'Защита', cls: 'round-action-defense' },
  position: { image: iconPosition, name: 'Позиция', cls: 'round-action-position' },
};

const actionClass = (action) => ACTION_CONFIG[action]?.cls || '';
const actionImage = (action) => ACTION_CONFIG[action]?.image || '';
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
  font-size: 0.7rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 2px;
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
  padding: 10px 8px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.85) 0%, rgba(26, 26, 46, 0.5) 100%);
  border: 2px solid var(--gray2);
  text-align: center;
  animation: cardSlideIn 0.4s ease-out;
}

.action-left  { animation-name: cardSlideLeft;  }
.action-right { animation-name: cardSlideRight; }

@keyframes cardSlideLeft  { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes cardSlideRight { from { transform: translateX(30px);  opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.round-action-attack {
  border-color: #e74c3c;
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.15);
}
.round-action-defense {
  border-color: #3498db;
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.15);
}
.round-action-position {
  border-color: #9b59b6;
  box-shadow: 0 0 10px rgba(155, 89, 182, 0.15);
}

.action-icon-img {
  width: 28px; height: 28px; margin-bottom: 2px;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.2));
}
.action-label {
  font-size: 0.65rem; color: white;
  margin-bottom: 4px; font-weight: bold;
  letter-spacing: 0.5px;
}
.action-dmg {
  font-size: 0.85rem; font-weight: bold;
  margin-top: 2px;
}
.dmg-red {
  color: #e74c3c;
  text-shadow: 0 0 6px rgba(231, 76, 60, 0.3);
}

.action-event {
  font-size: 0.6rem; margin-top: 3px;
  font-weight: bold; letter-spacing: 0.3px;
}

.event-block    { color: #3498db; }
.event-dodge    { color: #9b59b6; }
.event-crit     { color: #FFD600; text-shadow: 0 0 6px rgba(255, 214, 0, 0.3); }
.event-shield   { color: #448AFF; }
.event-miss     { color: #7f8c8d; }
.event-position { color: #9b59b6; }

.vs-label {
  font-size: 0.8rem; color: var(--primary-color);
  font-weight: 900; letter-spacing: 1px;
}
</style>
