<template>
  <div class="content-section">
    <h3>Game Cards</h3>
    <p class="section-desc">View and manage combat cards available in the game.</p>

    <div class="cards-grid">
      <div
        v-for="card in cards"
        :key="card.id"
        :class="['card-item', `rarity-${card.rarity}`]"
      >
        <div class="card-header">
          <span class="card-type-icon">{{ typeIcon(card.type) }}</span>
          <span :class="['rarity-badge', card.rarity]">{{ card.rarity }}</span>
        </div>
        <div class="card-name">{{ card.name }}</div>
        <div class="card-stats">
          <div class="card-stat">
            <span class="stat-label">Power</span>
            <span class="stat-val">{{ card.power }}</span>
          </div>
          <div class="card-stat">
            <span class="stat-label">Priority</span>
            <span class="stat-val">{{ card.priority }}</span>
          </div>
          <div class="card-stat">
            <span class="stat-label">Cooldown</span>
            <span class="stat-val">{{ card.cooldown }}</span>
          </div>
          <div class="card-stat">
            <span class="stat-label">Target</span>
            <span class="stat-val">{{ card.target }}</span>
          </div>
        </div>
        <div class="card-desc">{{ card.description }}</div>
        <div v-if="card.effect" class="card-effect">
          Effect: <strong>{{ card.effect }}</strong>
        </div>
        <div v-if="card.conditions && card.conditions.length" class="card-conditions">
          <div v-for="(cond, i) in card.conditions" :key="i" class="condition">
            {{ cond.type.replace('_', ' ') }}: {{ cond.threshold }}% → +{{ cond.priorityBoost }} priority
          </div>
        </div>
      </div>
    </div>

    <div class="game-constants">
      <h3>Game Constants</h3>
      <div class="constants-grid">
        <div class="const-item">
          <span class="const-label">Max HP</span>
          <span class="const-val">{{ MAX_HP }}</span>
        </div>
        <div class="const-item">
          <span class="const-label">Max Deck Size</span>
          <span class="const-val">{{ MAX_DECK_SIZE }}</span>
        </div>
        <div class="const-item">
          <span class="const-label">Min Deck Size</span>
          <span class="const-val">{{ MIN_DECK_SIZE }}</span>
        </div>
        <div class="const-item">
          <span class="const-label">Max Rounds</span>
          <span class="const-val">{{ MAX_ROUNDS }}</span>
        </div>
        <div class="const-item">
          <span class="const-label">Cost Per Click</span>
          <span class="const-val">{{ COST_PER_CLICK }}</span>
        </div>
        <div class="const-item">
          <span class="const-label">Create Club Cost</span>
          <span class="const-val">{{ COST_CREATE_CLUB }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import cardsData from '@/core/data/cards.json';
import {
  MAX_HP, MAX_DECK_SIZE, MIN_DECK_SIZE, MAX_ROUNDS,
  COST_PER_CLICK, COST_CREATE_CLUB
} from '@/core/constants.js';

const cards = cardsData;

function typeIcon(type) {
  switch (type) {
    case 'attack': return '⚔️';
    case 'defense': return '🛡️';
    case 'special': return '✨';
    default: return '❓';
  }
}
</script>

<style scoped>
.section-desc {
  color: #888;
  font-size: 14px;
  margin-bottom: 20px;
}

h3 {
  color: #ccc;
  font-size: 16px;
  margin: 0 0 8px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.card-item {
  background: #141414;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 16px;
  transition: border-color 0.15s;
}

.card-item.rarity-common { border-left: 3px solid #888; }
.card-item.rarity-rare { border-left: 3px solid #4a9eff; }
.card-item.rarity-epic { border-left: 3px solid #a855f7; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-type-icon {
  font-size: 20px;
}

.rarity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.rarity-badge.common {
  background: rgba(136, 136, 136, 0.15);
  color: #888;
}

.rarity-badge.rare {
  background: rgba(74, 158, 255, 0.15);
  color: #4a9eff;
}

.rarity-badge.epic {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 10px;
}

.card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 10px;
}

.card-stat {
  display: flex;
  justify-content: space-between;
  background: #1a1a1a;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
}

.stat-label { color: #666; }
.stat-val { color: #fff; font-weight: 600; }

.card-desc {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.card-effect {
  margin-top: 8px;
  font-size: 12px;
  color: #FF066F;
}

.card-conditions {
  margin-top: 6px;
}

.condition {
  font-size: 11px;
  color: #ffa500;
  background: rgba(255, 165, 0, 0.08);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.game-constants {
  background: #141414;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 20px;
}

.constants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.const-item {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.const-label {
  color: #888;
  font-size: 13px;
}

.const-val {
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}
</style>
