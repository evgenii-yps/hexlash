<template>
  <div class="round-display" v-if="round">
    <div class="round-number">{{ t('fight.lblRound', { n: round.roundNum }) }}</div>
    <div class="round-cards">
      <div class="round-card card-left" :class="cardTypeClass(round.card1)">
        <div class="card-label">{{ round.card1.name }}</div>
        <div class="card-dmg dmg-red" v-if="round.damage2 > 0">-{{ round.damage2 }} HP</div>
        <div
            v-for="(evt, i) in leftEvents"
            :key="i"
            class="card-event"
            :class="eventClass(evt)"
        >{{ evt.text }}</div>
      </div>

      <div class="vs-label">VS</div>

      <div class="round-card card-right" :class="cardTypeClass(round.card2)">
        <div class="card-label">{{ round.card2.name }}</div>
        <div class="card-dmg dmg-red" v-if="round.damage1 > 0">-{{ round.damage1 }} HP</div>
        <div
            v-for="(evt, i) in rightEvents"
            :key="i"
            class="card-event"
            :class="eventClass(evt)"
        >{{ evt.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'});

const props = defineProps({
  round: {type: Object, default: null},
});

const cardTypeClass = (card) => card ? `round-card-${card.type}` : '';

const formatEvent = (evt) => {
  switch (evt.type) {
    case 'block':   return {text: t('fight.lblBlocked'),                cls: 'event-block'};
    case 'dodge':   return {text: t('fight.lblDodged'),                 cls: 'event-dodge'};
    case 'crit':    return {text: t('fight.lblCrit'),                   cls: 'event-crit'};
    case 'shield':  return {text: t('fight.lblShield'),                 cls: 'event-shield'};
    case 'missed':  return {text: t('fight.lblMissed'),                 cls: 'event-miss'};
    case 'heal':    return {text: t('fight.lblHealed', {n: evt.value}), cls: 'event-heal'};
    case 'buff':    return {text: t('fight.lblBuff'),                   cls: 'event-buff'};
    case 'counter': return {text: t('fight.lblCounter'),                cls: 'event-counter'};
    default:        return {text: evt.type,                             cls: ''};
  }
};

const eventClass = (evt) => evt.cls;

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

.round-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.round-card {
  flex: 1;
  max-width: 140px;
  padding: 8px;
  border-radius: 6px;
  background-color: var(--black-opacity-80);
  border: 2px solid var(--gray2);
  text-align: center;
  animation: cardSlideIn 0.4s ease-out;
}

.card-left  { animation-name: cardSlideLeft;  }
.card-right { animation-name: cardSlideRight; }

@keyframes cardSlideLeft  { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes cardSlideRight { from { transform: translateX(30px);  opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.round-card-attack  { border-color: #e74c3c; }
.round-card-defense { border-color: #3498db; }
.round-card-special { border-color: #f39c12; }

.card-label { font-size: 0.7rem; color: white; margin-bottom: 4px; }
.card-dmg   { font-size: 0.85rem; font-weight: bold; margin-top: 2px; }
.dmg-red    { color: #e74c3c; }

.card-event { font-size: 0.6rem; margin-top: 3px; font-weight: bold; }

.event-block   { color: #3498db; }
.event-dodge   { color: #9b59b6; }
.event-crit    { color: #FFD600; }
.event-shield  { color: #448AFF; }
.event-miss    { color: #7f8c8d; }
.event-heal    { color: #2ecc71; }
.event-buff    { color: #FF9100; }
.event-counter { color: #e74c3c; }

.vs-label { font-size: 0.75rem; color: var(--gray2); font-weight: bold; }
</style>
