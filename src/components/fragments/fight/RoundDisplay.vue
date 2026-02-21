<template>
  <div class="round-display" v-if="round">
    <div class="round-number">{{ t('fight.lblRound', { n: round.roundNum }) }}</div>
    <div class="round-cards">
      <div class="round-card card-left" :class="cardTypeClass(round.card1)">
        <div class="card-label">{{ round.card1.name }}</div>
        <div class="card-dmg" v-if="round.damage2 > 0">-{{ round.damage2 }} HP</div>
        <div class="card-event" v-for="(evt, i) in leftEvents" :key="i">{{ evt }}</div>
      </div>
      <div class="vs-label">VS</div>
      <div class="round-card card-right" :class="cardTypeClass(round.card2)">
        <div class="card-label">{{ round.card2.name }}</div>
        <div class="card-dmg" v-if="round.damage1 > 0">-{{ round.damage1 }} HP</div>
        <div class="card-event" v-for="(evt, i) in rightEvents" :key="i">{{ evt }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'});

const props = defineProps({
  round: { type: Object, default: null },
});

const cardTypeClass = (card) => {
  if (!card) return '';
  return `round-card-${card.type}`;
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

const formatEvent = (evt) => {
  if (evt.type === 'block') return t('fight.lblBlocked');
  if (evt.type === 'heal') return t('fight.lblHealed', { n: evt.value });
  if (evt.type === 'buff') return t('fight.lblBuff');
  if (evt.type === 'counter') return t('fight.lblCounter');
  return evt.type;
};
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

.card-left { animation-name: cardSlideLeft; }
.card-right { animation-name: cardSlideRight; }

@keyframes cardSlideLeft {
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes cardSlideRight {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.round-card-attack { border-color: #e74c3c; }
.round-card-defense { border-color: #3498db; }
.round-card-special { border-color: #f39c12; }

.card-label {
  font-size: 0.7rem;
  color: white;
  margin-bottom: 4px;
}

.card-dmg {
  font-size: 0.85rem;
  color: #e74c3c;
  font-weight: bold;
}

.card-event {
  font-size: 0.55rem;
  color: #f39c12;
  margin-top: 2px;
}

.vs-label {
  font-size: 0.75rem;
  color: var(--gray2);
  font-weight: bold;
}
</style>
