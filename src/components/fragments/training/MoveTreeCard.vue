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
        <span class="move-name">{{ moveData.name }}</span>
        <span v-if="move.unlocked" class="move-level">Ур.{{ move.level }}</span>
        <span v-else class="move-locked-badge">закрыт</span>
      </div>

      <!-- Прогресс к следующему уровню (для открытых приёмов) -->
      <template v-if="move.unlocked && move.level < 5">
        <div class="progress-label">
          <span>{{ taps }}</span>
          <span class="progress-req">/ {{ nextReq.taps }} тапов</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: Math.min(taps / nextReq.taps * 100, 100) + '%' }" />
        </div>
      </template>

      <div v-else-if="move.unlocked" class="max-badge">MAX</div>

      <!-- Требования для открытия -->
      <div v-else-if="canUnlock" class="unlock-req">
        {{ unlockCost.taps }} тапов + {{ unlockCost.exp }} XP
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
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.move-tree-card:active {
  background: rgba(255, 6, 111, 0.07);
}

.move-tree-card.locked {
  opacity: 0.65;
}

.move-tree-card.can-unlock {
  border-color: rgba(255, 6, 111, 0.5);
}

.move-tree-card.max-level {
  border-color: rgba(255, 6, 111, 0.8);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.move-locked-badge {
  font-size: 0.65rem;
  color: var(--gray2);
  border: 1px solid var(--gray1);
  border-radius: 3px;
  padding: 1px 5px;
}

.move-name {
  flex: 1;
  font-family: Anonymous, sans-serif;
  font-size: 0.95rem;
  color: var(--white);
}

.move-level {
  font-family: AnonymousBalance, sans-serif;
  font-size: 0.85rem;
  color: var(--pink);
}

.progress-label {
  display: flex;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--gray3);
  margin-bottom: 4px;
}

.progress-req {
  color: var(--gray2);
}

.progress-bar {
  height: 3px;
  background: var(--gray1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--pink);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.max-badge {
  font-size: 0.7rem;
  color: var(--pink);
  font-family: Anonymous, sans-serif;
}

.unlock-req {
  font-size: 0.7rem;
  color: var(--gray2);
}

.connector-line {
  width: 2px;
  height: 12px;
  background: var(--gray1);
}
</style>
