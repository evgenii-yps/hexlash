<template>
  <div class="tree-card-wrap">
    <div
        class="move-tree-card"
        :class="{
          locked: !move.unlocked,
          'can-unlock': canUnlock,
          'max-level': move.unlocked && move.level === 5
        }"
        @click="$emit('click', moveId)"
    >
      <div class="card-top">
        <span class="move-name">{{ t.gameData.moves[moveId].name }}</span>
        <span v-if="move.unlocked" class="move-level">{{ t.moves.lblLevel }}{{ move.level }}</span>
        <span v-else class="move-locked-badge">{{ t.moves.lblLocked }}</span>
      </div>

      <!-- Прогресс к следующему уровню (для открытых приёмов) -->
      <template v-if="move.unlocked && move.level < 5">
        <div class="progress-label">
          <span>{{ taps }}</span>
          <span class="progress-req">/ {{ nextReq.taps }} {{ t.moves.lblTapsUnit }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: Math.min(taps / nextReq.taps * 100, 100) + '%' }" />
        </div>
      </template>

      <div v-else-if="move.unlocked" class="max-badge">{{ t.moves.lblMax }}</div>

      <!-- Требования для открытия -->
      <div v-else-if="canUnlock" class="unlock-req">
        {{ unlockCost.taps }} {{ t.moves.lblTapsUnit }} + {{ unlockCost.exp }} XP
      </div>
    </div>

    <!-- Соединительная линия к следующему приёму -->
    <div v-if="!isLast" class="connector-line" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { allMoves } from '@/data/moves.js';
import { branches } from '@/data/branches.js';
import { levelUpRequirements, unlockRequirements } from '@/data/requirements.js';
import { t } from '@/locales/index.js';

const props = defineProps({
  moveId:    { type: String, required: true },
  move:      { type: Object, required: true },
  taps:      { type: Number, default: 0 },
  branchExp: { type: Number, default: 0 },
  canUnlock: { type: Boolean, default: false },
  allMoves:  { type: Object, default: () => ({}) },
  isLast:    { type: Boolean, default: false }
});

defineEmits(['click']);

const moveData = computed(() => allMoves[props.moveId] || {});

const nextReq = computed(() => {
  if (props.move.level >= 5 || !props.move.unlocked) return { taps: 1, exp: 1 };
  return levelUpRequirements[props.move.level + 1] || { taps: 1, exp: 1 };
});

const unlockCost = computed(() => {
  const branch = moveData.value.branch;
  if (!branch) return {};
  const branchMoves = branches[branch].moves;
  const idx = branchMoves.indexOf(props.moveId);
  if (idx <= 0) return {};
  const prevMove = props.allMoves[branchMoves[idx - 1]];
  if (!prevMove) return {};
  return unlockRequirements[prevMove.level] || {};
});
</script>

<style scoped>
.tree-card-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.move-tree-card {
  width: 100%;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: 4px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.move-tree-card:active {
  background: var(--hex-bg-light);
}

.move-tree-card.locked {
  opacity: 0.65;
}

.move-tree-card.can-unlock {
  border-color: var(--hex-border-strong);
}

.move-tree-card.max-level {
  border-color: var(--hex-success);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.move-locked-badge {
  font-size: 0.65rem;
  color: var(--hex-text-secondary);
  border: 1px solid var(--hex-border-default);
  border-radius: 3px;
  padding: 1px 5px;
}

.move-name {
  flex: 1;
  font-size: 0.95rem;
  color: var(--hex-text-primary);
}

.move-level {
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 0.85rem;
  color: var(--hex-text-primary);
}

.progress-label {
  display: flex;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--hex-text-muted);
  margin-bottom: 4px;
}

.progress-req {
  color: var(--hex-text-secondary);
}

.progress-bar {
  height: 3px;
  background: var(--hex-border-default);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--hex-text-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.max-badge {
  font-size: 0.7rem;
  color: var(--hex-text-primary);
}

.unlock-req {
  font-size: 0.7rem;
  color: var(--hex-text-secondary);
}

.connector-line {
  width: 2px;
  height: 12px;
  background: var(--hex-border-default);
}
</style>
