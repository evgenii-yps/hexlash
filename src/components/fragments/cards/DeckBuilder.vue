<template>
  <div class="deck-builder">
    <div class="deck-section">
      <div class="section-label">{{ t('arena.lblDeck') }} ({{ equippedCards.length }}/{{ MAX_DECK_SIZE }})</div>
      <div class="deck-slots">
        <div
            v-for="i in MAX_DECK_SIZE"
            :key="'slot-' + i"
            class="deck-slot"
            :class="{ 'slot-empty': !equippedCards[i - 1] }"
            @click="equippedCards[i - 1] && unequip(equippedCards[i - 1].id)"
        >
          <CardItem
              v-if="equippedCards[i - 1]"
              :card="equippedCards[i - 1]"
              :equipped="true"
          />
          <div v-else class="slot-placeholder">+</div>
        </div>
      </div>
      <div class="deck-status" :class="{ 'deck-valid': isDeckValid, 'deck-invalid': !isDeckValid }">
        {{ isDeckValid ? t('arena.lblDeckReady') : t('arena.lblDeckTooSmall') }}
      </div>
    </div>

    <div class="available-section">
      <div class="section-label">{{ t('arena.lblAvailableCards') }}</div>
      <div class="cards-grid">
        <CardItem
            v-for="card in availableCards"
            :key="card.id"
            :card="card"
            :equipped="isEquipped(card.id)"
            :disabled="isEquipped(card.id) || equippedCards.length >= MAX_DECK_SIZE"
            @click="!isEquipped(card.id) && equip(card.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {useStore} from "vuex";
import {useI18n} from "vue-i18n";
import {MAX_DECK_SIZE} from "@/core/constants.js";
import CardItem from "@/components/fragments/cards/CardItem.vue";

const store = useStore();
const {t} = useI18n({useScope: 'global'});

const allCards = computed(() => store.getters['fight/getAllCards']);
const equippedCards = computed(() => store.getters['fight/getEquippedCards']);
const isDeckValid = computed(() => store.getters['fight/isDeckValid']);

const availableCards = computed(() => allCards.value);

const isEquipped = (cardId) => {
  return equippedCards.value.some(c => c.id === cardId);
};

const equip = (cardId) => {
  if (!isEquipped(cardId) && equippedCards.value.length < MAX_DECK_SIZE) {
    store.dispatch('fight/equipCard', cardId);
  }
};

const unequip = (cardId) => {
  store.dispatch('fight/unequipCard', cardId);
};
</script>

<style scoped>
.deck-builder {
  width: 100%;
}

.section-label {
  font-size: 0.75rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  text-align: center;
}

.deck-section {
  margin-bottom: 16px;
}

.deck-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.deck-slot {
  width: 80px;
  height: 100px;
}

.slot-empty {
  cursor: default;
}

.slot-placeholder {
  width: 80px;
  height: 100px;
  border-radius: 6px;
  border: 2px dashed var(--gray2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray2);
  font-size: 1.5rem;
  opacity: 0.4;
}

.deck-status {
  text-align: center;
  font-size: 0.7rem;
  margin-top: 8px;
  padding: 4px 8px;
}

.deck-valid {
  color: #2ecc71;
}

.deck-invalid {
  color: #e74c3c;
}

.available-section {
  margin-top: 12px;
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}
</style>
