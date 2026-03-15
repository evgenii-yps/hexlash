<template>
  <div class="background background-training">
    <div class="move-tree-container">

      <!-- Хедер -->
      <div class="top-bar">
        <button class="btn-back" @click="goBack">
          <span class="back-arrow">←</span> {{ t.moves.lblBack }}
        </button>
        <div class="resource-panel">
          <div class="resource-taps">
            <span class="resource-label">{{ t.moves.lblTaps }}</span>
            <span class="resource-value">{{ taps }}</span>
          </div>
          <div class="resource-divider"></div>
          <div class="resource-free-xp">
            <span class="resource-label">{{ t.xpAllocation.freeXP }}</span>
            <span class="resource-value free-xp-value">{{ freeXP }}</span>
          </div>
        </div>
      </div>

      <!-- Основной layout: ветки слева + приёмы справа -->
      <div class="tree-layout">

        <!-- Левая колонка: ветки -->
        <div class="branches-sidebar">
          <div class="branches-center">
            <div v-for="(branch, key) in branches" :key="key" class="branch-group">
              <button
                  class="branch-btn"
                  :class="{ active: activeBranch === key }"
                  @click="activeBranch = key"
              >
                <span class="branch-btn-name">{{ t.gameData.branches[key].name }}</span>
                <span class="branch-xp-val">{{ branchExp[key] }} XP</span>
              </button>
              <button
                  v-if="freeXP > 0"
                  class="branch-add-xp-btn"
                  @click.stop="openXPModal(key)"
              >
                + XP
              </button>
            </div>
          </div>
        </div>

        <!-- Правая колонка: приёмы -->
        <div class="moves-list" ref="movesListRef">
          <transition name="fade-tab" mode="out-in">
            <div :key="activeBranch" class="moves-inner">
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
        </div>

      </div>
    </div>

    <!-- Модалка распределения XP -->
    <XPAllocationModal
        :branch="xpModalBranch"
        :branchName="xpModalBranchName"
        :freeXP="freeXP"
        :visible="xpModalVisible"
        @allocate="handleAllocateXP"
        @close="xpModalVisible = false"
    />

    <!-- Модалка деталей приёма -->
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
import { t } from '@/locales/index.js';
import store from '@/core/state/store.js';
import { branches as branchData } from '@/data/branches.js';
import { allMoves as movesData } from '@/data/moves.js';
import { InfoMessageModel } from '@/core/models/internal/infoMessageModel.js';
import MoveTreeCard from '@/components/fragments/training/MoveTreeCard.vue';
import MoveDetailsModal from '@/components/fragments/training/MoveDetailsModal.vue';
import XPAllocationModal from '@/components/XPAllocationModal.vue';

const router = useRouter();
const emit = defineEmits(['scroll']);


const branches = branchData;
const activeBranch = ref('speed');
const selectedMoveId = ref(null);
const movesListRef = ref(null);

const taps = computed(() => store.getters['progression/getTaps']);
const freeXP = computed(() => store.getters['progression/getFreeXP']);
const branchExp = computed(() => store.getters['progression/getBranchExp']);
const moves = computed(() => store.getters['progression/getMoves']);

// XP allocation modal
const xpModalVisible = ref(false);
const xpModalBranch = ref('speed');
const xpModalBranchName = computed(() => {
  return t.value.gameData.branches[xpModalBranch.value]?.name || xpModalBranch.value;
});

const openXPModal = (branch) => {
  xpModalBranch.value = branch;
  xpModalVisible.value = true;
};

const handleAllocateXP = async (branch, amount) => {
  await store.dispatch('progression/allocateXP', { branch, amount });
  xpModalVisible.value = false;
};

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
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(t.value.moves.lblInsufficientResources, 2000));
  } else {
    selectedMoveId.value = null;
  }
};

const handleUnlock = async (moveId) => {
  const success = await store.dispatch('progression/unlockMove', moveId);
  if (!success) {
    store.commit('master/setInfoMessage', InfoMessageModel.withoutButton(t.value.moves.lblInsufficientResources, 2000));
  } else {
    selectedMoveId.value = null;
  }
};

const goBack = () => router.push('/training');
const goToTraining = () => {
  selectedMoveId.value = null;
  router.push('/training');
};
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
  background: linear-gradient(to top, black 0%, rgba(0,0,0,0.72) 100%);
  z-index: 1;
  width: 100vw;
  height: 100vh;
}

.move-tree-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1024px;
  margin: 0 auto;
  color: white;
  box-sizing: border-box;
}

@supports (height: 100dvh) {
  .move-tree-container { height: 100dvh; }
}

/* ── Хедер ── */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 10px;
  flex-shrink: 0;
  margin-top: 60px;
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

.resource-panel {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 6px;
  overflow: hidden;
}

.resource-taps {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
}

.resource-label {
  font-size: 0.6rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.resource-value {
  font-family: AnonymousBalance, sans-serif;
  font-size: 1.5rem;
  color: var(--pink);
  line-height: 1.1;
}

.resource-divider {
  width: 1px;
  background: var(--gray1);
  margin: 6px 0;
}

.resource-free-xp {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
}

.free-xp-value {
  color: var(--pink) !important;
  text-shadow: 0 0 8px rgba(255, 6, 111, 0.4);
}

/* ── Основной layout ── */
.tree-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  padding: 0 0 80px;
}

/* ── Левая колонка с ветками ── */
.branches-sidebar {
  position: relative;
  width: 110px;
  flex-shrink: 0;
}

.branches-center {
  position: absolute;
  top: 35%;
  left: 16px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: calc(100% - 16px);
}

.branch-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 6px;
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  color: var(--gray3);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.branch-btn.active {
  border-color: var(--pink);
  color: var(--pink);
  background: rgba(255, 6, 111, 0.1);
}

.branch-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.branch-btn-name {
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.branch-xp-val {
  font-family: AnonymousBalance, sans-serif;
  font-size: 0.7rem;
  color: var(--pink);
  opacity: 0.8;
}

.branch-add-xp-btn {
  background: rgba(255, 6, 111, 0.1);
  border: 1px solid rgba(255, 6, 111, 0.4);
  border-radius: 4px;
  color: var(--pink);
  font-size: 0.7rem;
  font-weight: bold;
  padding: 4px 6px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.branch-add-xp-btn:active {
  background: rgba(255, 6, 111, 0.25);
  box-shadow: 0 0 10px rgba(255, 6, 111, 0.3);
}

/* ── Правая колонка с приёмами ── */
.moves-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 8px 12px;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

.moves-inner {
  display: flex;
  flex-direction: column;
}

/* Анимация смены ветки */
.fade-tab-enter-active,
.fade-tab-leave-active { transition: opacity 0.15s; }
.fade-tab-enter-from,
.fade-tab-leave-to { opacity: 0; }
</style>
