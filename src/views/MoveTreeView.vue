<template>
  <div class="background background-training">
    <div class="move-tree-container" @scroll="handleScroll">
      <div class="move-tree-wrapper">

        <div class="top-bar">
          <button class="btn-back" @click="goBack">
            <span class="back-arrow">←</span> Назад
          </button>
          <div class="resources">
            <span class="resource-item">
              <span class="resource-label">Тапы</span>
              <span class="resource-value">{{ taps }}</span>
            </span>
          </div>
        </div>

        <div class="branch-tabs">
          <button
              v-for="(branch, key) in branches"
              :key="key"
              class="branch-tab"
              :class="{ active: activeBranch === key }"
              @click="activeBranch = key"
          >
            <span>{{ branch.name }}</span>
            <span class="tab-xp">{{ branchExp[key] }} XP</span>
          </button>
        </div>

        <transition name="fade-tab" mode="out-in">
          <div :key="activeBranch" class="branch-cards">
            <MoveTreeCard
                v-for="(moveId, idx) in branches[activeBranch].moves"
                :key="moveId"
                :moveId="moveId"
                :move="moves[moveId] || { level: 0, unlocked: false }"
                :taps="taps"
                :branchExp="branchExp[activeBranch]"
                :canUnlock="canUnlockFor(moveId)"
                :allMoves="moves"
                :isLast="idx === branches[activeBranch].moves.length - 1"
                @click="openModal(moveId)"
            />
          </div>
        </transition>

        <div class="scroll-gap" />
      </div>
    </div>

    <MoveDetailsModal
        v-if="selectedMoveId"
        :moveId="selectedMoveId"
        :move="moves[selectedMoveId] || { level: 0, unlocked: false }"
        :taps="taps"
        :branchExp="branchExp[activeBranchOfSelected]"
        :canLevelUp="canLevelUpFor(selectedMoveId)"
        :canUnlock="canUnlockFor(selectedMoveId)"
        :allMoveStates="moves"
        @close="selectedMoveId = null"
        @levelUp="handleLevelUp"
        @unlock="handleUnlock"
        @train="goToTraining"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { branches as branchData } from '@/data/branches.js';
import { allMoves as movesData } from '@/data/moves.js';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
import MoveTreeCard from '@/components/fragments/training/MoveTreeCard.vue';
import MoveDetailsModal from '@/components/fragments/training/MoveDetailsModal.vue';

const router = useRouter();
const emit = defineEmits(['scroll']);

const branches = branchData;
const activeBranch = ref('speed');
const selectedMoveId = ref(null);

const taps = computed(() => store.getters['progression/getTaps']);
const branchExp = computed(() => store.getters['progression/getBranchExp']);
const moves = computed(() => store.getters['progression/getMoves']);

const canLevelUpFor = (moveId) => store.getters['progression/canLevelUp'](moveId);
const canUnlockFor  = (moveId) => store.getters['progression/canUnlock'](moveId);

const activeBranchOfSelected = computed(() => {
  if (!selectedMoveId.value) return activeBranch.value;
  return movesData[selectedMoveId.value]?.branch || activeBranch.value;
});

const openModal = (moveId) => {
  selectedMoveId.value = moveId;
  const branch = movesData[moveId]?.branch;
  if (branch) activeBranch.value = branch;
};

const handleLevelUp = async (moveId) => {
  const success = await store.dispatch('progression/levelUpMove', moveId);
  if (!success) {
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton('Недостаточно ресурсов!', 2000));
  } else {
    selectedMoveId.value = null;
  }
};

const handleUnlock = async (moveId) => {
  const success = await store.dispatch('progression/unlockMove', moveId);
  if (!success) {
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton('Недостаточно ресурсов!', 2000));
  } else {
    selectedMoveId.value = null;
  }
};

const goBack = () => router.push('/training');
const goToTraining = () => {
  selectedMoveId.value = null;
  router.push('/training');
};

const handleScroll = (e) => emit('scroll', e.target.scrollTop);
</script>

<style scoped>
.background-training {
  background: url('@/assets/images/background_trainings.webp') no-repeat center center;
  background-size: cover;
}

.background-training::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  background: linear-gradient(to top, black 0%, rgba(0,0,0,0.7) 100%);
  z-index: 1;
  width: 100vw;
  height: 100vh;
}

.move-tree-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  color: white;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .move-tree-container { height: 100dvh; }
}

.move-tree-wrapper {
  max-width: 480px;
  margin: 0 auto;
  padding: 80px 16px 0;
  box-sizing: border-box;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.btn-back {
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  color: var(--gray3);
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.btn-back:hover { color: var(--white); }
.back-arrow { font-size: 1.1rem; }
.resources { display: flex; gap: 16px; }

.resource-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  padding: 4px 12px;
}

.resource-label {
  font-size: 0.65rem;
  color: var(--gray2);
  text-transform: uppercase;
}

.resource-value {
  font-family: AnonymousBalance, sans-serif;
  font-size: 1rem;
  color: var(--pink);
}

.branch-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.branch-tab {
  flex: 1;
  padding: 8px 6px 6px;
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  color: var(--gray3);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.branch-tab.active {
  border-color: var(--pink);
  color: var(--pink);
  background: rgba(255, 6, 111, 0.08);
}

.tab-xp {
  font-size: 0.65rem;
  color: var(--gray2);
  font-family: AnonymousBalance, sans-serif;
}

.branch-tab.active .tab-xp { color: var(--pink); }

.branch-cards {
  display: flex;
  flex-direction: column;
}

.fade-tab-enter-active,
.fade-tab-leave-active { transition: opacity 0.15s; }

.fade-tab-enter-from,
.fade-tab-leave-to { opacity: 0; }

.scroll-gap { height: 100px; }
</style>
