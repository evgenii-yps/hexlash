<template>
  <div class="round-display" v-if="round">
    <div class="round-number">{{ interpolate(t.fight.lblRound, { n: round.roundNum }) }}</div>
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
import {t, interpolate} from "@/locales/index.js";
import iconAttack   from '@/assets/images/icons/attack.svg';
import iconDefense  from '@/assets/images/icons/defense.svg';
import iconPosition from '@/assets/images/icons/position.svg';

const props = defineProps({
  round: { type: Object, default: null },
});

const ACTION_CONFIG = {
  attack:   { image: iconAttack,   key: 'lblActionAttack',   cls: 'round-action-attack' },
  defense:  { image: iconDefense,  key: 'lblActionDefense',  cls: 'round-action-defense' },
  position: { image: iconPosition, key: 'lblActionPosition', cls: 'round-action-position' },
};

const actionClass = (action) => ACTION_CONFIG[action]?.cls || '';
const actionImage = (action) => ACTION_CONFIG[action]?.image || '';
const actionName  = (action) => t.value.fight[ACTION_CONFIG[action]?.key] || action;

const formatEvent = (evt) => {
  switch (evt.type) {
    case 'block':    return { text: t.value.fight.lblBlocked,               cls: 'event-block' };
    case 'dodge':    return { text: t.value.fight.lblDodged,                cls: 'event-dodge' };
    case 'crit':     return { text: t.value.fight.lblCrit,                  cls: 'event-crit' };
    case 'shield':   return { text: t.value.fight.lblShield,                cls: 'event-shield' };
    case 'missed':   return { text: t.value.fight.lblMissed,                cls: 'event-miss' };
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
  color: var(--hex-text-secondary);
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
  background: linear-gradient(135deg, var(--hex-bg-card) 0%, rgba(26, 26, 46, 0.5) 100%); /* gradient base, no var equivalent */
  border: 2px solid var(--hex-border-active);
  text-align: center;
  animation: cardSlideIn 0.4s ease-out;
}

.action-left  { animation-name: cardSlideLeft;  }
.action-right { animation-name: cardSlideRight; }

@keyframes cardSlideLeft  { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes cardSlideRight { from { transform: translateX(30px);  opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.round-action-attack {
  border-color: var(--hex-action-attack);
  box-shadow: 0 0 10px color-mix(in srgb, var(--hex-action-attack) 15%, transparent);
}
.round-action-defense {
  border-color: var(--hex-action-defense);
  box-shadow: 0 0 10px color-mix(in srgb, var(--hex-action-defense) 15%, transparent);
}
.round-action-position {
  border-color: var(--hex-action-position);
  box-shadow: 0 0 10px color-mix(in srgb, var(--hex-action-position) 15%, transparent);
}

.action-icon-img {
  width: 28px; height: 28px; margin-bottom: 2px;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.2)); /* subtle highlight on action icon */
}
.action-label {
  font-size: 0.65rem; color: var(--hex-text-primary);
  margin-bottom: 4px; font-weight: bold;
  letter-spacing: 0.5px;
}
.action-dmg {
  font-size: 0.85rem; font-weight: bold;
  margin-top: 2px;
}
.dmg-red {
  color: var(--hex-action-attack);
  text-shadow: 0 0 6px color-mix(in srgb, var(--hex-action-attack) 30%, transparent);
}

.action-event {
  font-size: 0.6rem; margin-top: 3px;
  font-weight: bold; letter-spacing: 0.3px;
}

.event-block    { color: var(--hex-action-defense); }
.event-dodge    { color: var(--hex-action-position); }
.event-crit     { color: var(--hex-dice-crit); text-shadow: 0 0 6px color-mix(in srgb, var(--hex-dice-crit) 30%, transparent); }
.event-shield   { color: var(--hex-dice-shield); }
.event-miss     { color: var(--hex-text-muted); }
.event-position { color: var(--hex-action-position); }

.vs-label {
  font-family: var(--hex-font-mono);
  font-size: 0.8rem; color: var(--hex-text-secondary);
  font-weight: 900; letter-spacing: 1px;
}
</style>
