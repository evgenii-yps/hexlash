<template>
  <div class="move-card" :class="{ locked: !move.unlocked, 'in-deck': isInDeck }">
    <div class="move-card-header">
      <span class="move-name">{{ moveData.name }}</span>
      <div class="move-levels">
        <span
            v-for="i in 5"
            :key="i"
            class="level-dot"
            :class="{ filled: i <= move.level }"
        />
      </div>
    </div>

    <p class="move-description">{{ moveData.description }}</p>

    <div class="move-stats">
      <span class="stat">
        <span class="stat-label">Урон</span>
        <span class="stat-value">{{ moveData.damage[Math.max(move.level - 1, 0)] }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">Скорость</span>
        <span class="stat-value">{{ moveData.speed[Math.max(move.level - 1, 0)] }}</span>
      </span>
    </div>

    <div v-if="move.unlocked" class="move-actions">
      <div v-if="move.level < 5" class="upgrade-cost">
        <span class="cost-item" :class="{ 'not-enough': !canLevelUp && taps < nextReq.taps }">
          {{ nextReq.taps }} тапов
        </span>
        <span class="cost-sep">+</span>
        <span class="cost-item" :class="{ 'not-enough': !canLevelUp && branchExp < nextReq.exp }">
          {{ nextReq.exp }} XP
        </span>
      </div>
      <div v-else class="max-level">MAX</div>

      <button
          v-if="move.level < 5"
          class="btn-upgrade"
          :class="{ available: canLevelUp }"
          :disabled="!canLevelUp"
          @click.stop="$emit('levelUp', moveData.id)"
      >
        Улучшить
      </button>
    </div>

    <div v-else class="move-locked-info">
      <div v-if="canUnlock" class="upgrade-cost">
        <span class="cost-item">{{ unlockCost.taps }} тапов</span>
        <span class="cost-sep">+</span>
        <span class="cost-item">{{ unlockCost.exp }} XP</span>
      </div>
      <div v-else class="locked-hint">{{ lockedHint }}</div>

      <button
          class="btn-upgrade"
          :class="{ available: canUnlock }"
          :disabled="!canUnlock"
          @click.stop="$emit('unlock', moveData.id)"
      >
        Открыть
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { allMoves } from '@/data/moves.js';
import { branches } from '@/data/branches.js';
import { levelUpRequirements, unlockRequirements } from '@/data/requirements.js';

const props = defineProps({
  moveId: { type: String, required: true },
  move: { type: Object, required: true },
  taps: { type: Number, default: 0 },
  branchExp: { type: Number, default: 0 },
  canLevelUp: { type: Boolean, default: false },
  canUnlock: { type: Boolean, default: false },
  allMoveStates: { type: Object, default: () => ({}) },
  isInDeck: { type: Boolean, default: false }
});

defineEmits(['levelUp', 'unlock']);

const moveData = computed(() => allMoves[props.moveId]);

const nextReq = computed(() => {
  if (props.move.level >= 5) return {};
  return levelUpRequirements[props.move.level + 1] || {};
});

const unlockCost = computed(() => {
  const branchId = moveData.value.branch;
  const branchMoves = branches[branchId].moves;
  const idx = branchMoves.indexOf(props.moveId);
  if (idx <= 0) return {};
  const prevMove = props.allMoveStates[branchMoves[idx - 1]];
  if (!prevMove) return {};
  return unlockRequirements[prevMove.level] || {};
});

const lockedHint = computed(() => {
  const branchId = moveData.value.branch;
  const branchMoves = branches[branchId].moves;
  const idx = branchMoves.indexOf(props.moveId);
  if (idx <= 0) return '';
  const prevMoveId = branchMoves[idx - 1];
  const prevMove = props.allMoveStates[prevMoveId];
  if (!prevMove?.unlocked) return `Сначала откройте ${allMoves[prevMoveId].name}`;
  if (prevMove.level < 3) return `Прокачайте ${allMoves[prevMoveId].name} до ур. 3`;
  return 'Недостаточно ресурсов';
});
</script>

<style scoped>
.move-card {
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 8px;
  transition: border-color 0.2s;
}

.move-card.locked {
  opacity: 0.7;
}

.move-card.in-deck {
  border-color: var(--pink);
}

.move-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.move-name {
  font-family: Anonymous, sans-serif;
  font-size: 1.05rem;
  color: var(--white);
}

.move-levels {
  display: flex;
  gap: 4px;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gray1);
  border: 1px solid var(--gray2);
}

.level-dot.filled {
  background: var(--pink);
  border-color: var(--pink);
}

.move-description {
  font-size: 0.8rem;
  color: var(--gray3);
  margin: 0 0 8px;
  line-height: 1.4;
}

.move-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--gray2);
  text-transform: uppercase;
}

.stat-value {
  font-size: 0.95rem;
  color: var(--white);
  font-family: AnonymousBalance, sans-serif;
}

.move-actions, .move-locked-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.upgrade-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.cost-item {
  font-size: 0.75rem;
  color: var(--gray3);
}

.cost-item.not-enough {
  color: #e05050;
}

.cost-sep {
  font-size: 0.75rem;
  color: var(--gray2);
}

.max-level {
  font-family: Anonymous, sans-serif;
  font-size: 0.85rem;
  color: var(--pink);
}

.locked-hint {
  font-size: 0.75rem;
  color: var(--gray2);
  flex: 1;
}

.btn-upgrade {
  padding: 6px 14px;
  border: 1px solid var(--gray2);
  border-radius: 4px;
  background: transparent;
  color: var(--gray2);
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-upgrade.available {
  border-color: var(--pink);
  color: var(--pink);
}

.btn-upgrade.available:hover {
  background: var(--pink);
  color: var(--white);
}

.btn-upgrade:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
