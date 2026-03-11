<template>
  <div class="branch-column">
    <div class="branch-header">
      <span class="branch-name">{{ t.gameData.branches[branch.id].name }}</span>
      <span class="branch-xp">{{ branchExp }} XP</span>
    </div>
    <p class="branch-desc">{{ t.gameData.branches[branch.id].description }}</p>

    <MoveCard
        v-for="moveId in branch.moves"
        :key="moveId"
        :moveId="moveId"
        :move="moves[moveId]"
        :taps="taps"
        :branchExp="branchExp"
        :canLevelUp="canLevelUpFn(moveId)"
        :canUnlock="canUnlockFn(moveId)"
        :allMoveStates="moves"
        :isInDeck="deck.includes(moveId)"
        @levelUp="$emit('levelUp', $event)"
        @unlock="$emit('unlock', $event)"
    />
  </div>
</template>

<script setup>
import MoveCard from './MoveCard.vue';
import { t } from '@/locales/index.js';

const props = defineProps({
  branch: { type: Object, required: true },
  moves: { type: Object, required: true },
  taps: { type: Number, default: 0 },
  branchExp: { type: Number, default: 0 },
  canLevelUpFn: { type: Function, required: true },
  canUnlockFn: { type: Function, required: true },
  deck: { type: Array, default: () => [] }
});

defineEmits(['levelUp', 'unlock']);
</script>

<style scoped>
.branch-column {
  width: 100%;
}

.branch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 4px;
  border-bottom: 1px solid var(--gray1);
  margin-bottom: 8px;
}

.branch-name {
  font-family: Anonymous, sans-serif;
  font-size: 1.2rem;
  color: var(--white);
}

.branch-xp {
  font-family: AnonymousBalance, sans-serif;
  font-size: 0.9rem;
  color: var(--pink);
}

.branch-desc {
  font-size: 0.8rem;
  color: var(--gray2);
  margin: 0 0 12px;
}
</style>
