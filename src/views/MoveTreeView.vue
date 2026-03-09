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
            {{ branch.name }}
          </button>
        </div>

        <transition name="fade-tab" mode="out-in">
          <BranchColumn
              :key="activeBranch"
              :branch="branches[activeBranch]"
              :moves="moves"
              :taps="taps"
              :branchExp="branchExp[activeBranch]"
              :canLevelUpFn="canLevelUpFor"
              :canUnlockFn="canUnlockFor"
              :deck="deck"
              @levelUp="handleLevelUp"
              @unlock="handleUnlock"
          />
        </transition>

        <div class="scroll-gap" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { branches as branchData } from '@/data/branches.js';
import BranchColumn from '@/components/fragments/training/BranchColumn.vue';

const router = useRouter();
const emit = defineEmits(['scroll']);

const branches = branchData;
const activeBranch = ref('speed');

const taps = computed(() => store.getters['progression/getTaps']);
const branchExp = computed(() => store.getters['progression/getBranchExp']);
const moves = computed(() => store.getters['progression/getMoves']);
const deck = computed(() => store.getters['progression/getDeck']);

const canLevelUpFor = (moveId) => store.getters['progression/canLevelUp'](moveId);
const canUnlockFor = (moveId) => store.getters['progression/canUnlock'](moveId);

const handleLevelUp = async (moveId) => {
  const success = await store.dispatch('progression/levelUpMove', moveId);
  if (!success) {
    store.commit('master/setInfoMessage', { text: 'Недостаточно ресурсов!', timeout: 2000, showButton: false });
  }
};

const handleUnlock = async (moveId) => {
  const success = await store.dispatch('progression/unlockMove', moveId);
  if (!success) {
    store.commit('master/setInfoMessage', { text: 'Недостаточно ресурсов!', timeout: 2000, showButton: false });
  }
};

const goBack = () => router.push('/training');

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
  .move-tree-container {
    height: 100dvh;
  }
}

.move-tree-wrapper {
  max-width: 600px;
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

.btn-back:hover {
  color: var(--white);
}

.back-arrow {
  font-size: 1.1rem;
}

.resources {
  display: flex;
  gap: 16px;
}

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
  padding: 10px 8px;
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  color: var(--gray3);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.branch-tab.active {
  border-color: var(--pink);
  color: var(--pink);
  background: rgba(255, 6, 111, 0.08);
}

.fade-tab-enter-active,
.fade-tab-leave-active {
  transition: opacity 0.15s;
}

.fade-tab-enter-from,
.fade-tab-leave-to {
  opacity: 0;
}

.scroll-gap {
  height: 100px;
}
</style>
