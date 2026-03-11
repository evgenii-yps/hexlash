<template>
  <div class="background background-training">
    <div class="deck-container" @scroll="handleScroll">
      <div class="deck-wrapper">

        <div class="top-bar">
          <button class="btn-back" @click="goBack">
            <span class="back-arrow">←</span> {{ t.deck.lblBack }}
          </button>
          <div class="deck-title">{{ t.deck.lblTitle }}</div>
          <button class="btn-tree" @click="goToTree">{{ t.deck.lblMoves }}</button>
        </div>

        <!-- Слоты колоды -->
        <div class="deck-slots-section">
          <div class="section-label">{{ interpolate(t.deck.lblCurrentDeck, { n: deck.length }) }}</div>
          <div class="deck-slots">
            <div
                v-for="moveId in deck"
                :key="moveId"
                class="deck-slot filled"
                @click="toggleMove(moveId)"
                v-ripple
            >
              <span class="slot-name">{{ t.gameData.moves[moveId]?.name }}</span>
              <span class="slot-level">{{ t.deck.lblLevel }}{{ moves[moveId]?.level }}</span>
              <span class="slot-remove">✕</span>
            </div>
            <div
                v-for="i in (5 - deck.length)"
                :key="'empty-' + i"
                class="deck-slot empty"
            >
              <span class="slot-empty-label">—</span>
            </div>
          </div>

          <div class="deck-valid-hint" :class="{ valid: isDeckValid, invalid: !isDeckValid }">
            {{ isDeckValid ? t.deck.lblReady : t.deck.lblNeedMoves }}
          </div>
        </div>

        <!-- Доступные приёмы -->
        <div class="available-section">
          <div class="section-label">{{ t.deck.lblAvailableMoves }}</div>

          <div v-for="branchKey in ['speed', 'power', 'technique']" :key="branchKey" class="branch-group">
            <div class="branch-group-title">{{ t.gameData.branches[branchKey].name }}</div>
            <div
                v-for="moveId in branches[branchKey].moves.filter(id => moves[id]?.unlocked)"
                :key="moveId"
                class="available-move"
                :class="{ 'in-deck': deck.includes(moveId), 'cant-add': !deck.includes(moveId) && deck.length >= 5 }"
                @click="toggleMove(moveId)"
                v-ripple
            >
              <div class="available-move-info">
                <span class="available-move-name">{{ t.gameData.moves[moveId]?.name }}</span>
                <span class="available-move-level">{{ t.deck.lblLevel }} {{ moves[moveId]?.level }}</span>
              </div>
              <div class="available-move-stats">
                <span class="mini-stat">{{ t.deck.lblDamage }} {{ allMoves[moveId]?.damage[moves[moveId]?.level - 1] }}</span>
              </div>
              <span class="deck-indicator">{{ deck.includes(moveId) ? '✓' : '+' }}</span>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <button
              class="btn-fight"
              :disabled="!isDeckValid"
              @click="goToArena"
          >
            {{ t.deck.lblToArena }}
          </button>
        </div>

        <div class="scroll-gap" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { t, interpolate } from '@/locales/index.js';
import store from '@/core/state/store.js';
import { allMoves } from '@/data/moves.js';
import { branches } from '@/data/branches.js';

const router = useRouter();
const emit = defineEmits(['scroll']);

const moves = computed(() => store.getters['progression/getMoves']);
const deck = computed(() => store.getters['progression/getDeck']);
const isDeckValid = computed(() => store.getters['progression/isDeckValid']);

const toggleMove = (moveId) => {
  store.dispatch('progression/toggleDeckMove', moveId);
};

const goBack = () => router.push('/training');
const goToTree = () => router.push('/training/moves');
const goToArena = () => {
  if (isDeckValid.value) router.push('/arena');
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
  background: linear-gradient(to top, black 0%, rgba(0,0,0,0.75) 100%);
  z-index: 1;
  width: 100vw;
  height: 100vh;
}

.deck-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  color: white;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .deck-container {
    height: 100dvh;
  }
}

.deck-wrapper {
  max-width: 600px;
  margin: 0 auto;
  padding: 80px 16px 0;
  box-sizing: border-box;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.btn-tree {
  background: transparent;
  border: 1px solid rgba(255, 6, 111, 0.4);
  color: var(--gray3);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-tree:hover {
  border-color: var(--pink);
  color: var(--pink);
}

.deck-title {
  font-family: Anonymous, sans-serif;
  font-size: 1.4rem;
  color: var(--white);
}

.section-label {
  font-size: 0.75rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.deck-slots-section {
  margin-bottom: 24px;
}

.deck-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.deck-slot {
  flex: 1 1 calc(33% - 8px);
  min-width: 90px;
  padding: 10px 8px;
  border-radius: 4px;
  border: 1px solid var(--gray1);
  background: var(--black-opacity-80);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  position: relative;
  transition: border-color 0.2s;
}

.deck-slot.filled {
  border-color: var(--pink);
}

.deck-slot.empty {
  cursor: default;
  opacity: 0.4;
}

.slot-name {
  font-size: 0.8rem;
  color: var(--white);
  text-align: center;
}

.slot-level {
  font-size: 0.7rem;
  color: var(--pink);
}

.slot-remove {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 0.65rem;
  color: var(--gray2);
}

.slot-empty-label {
  font-size: 1.2rem;
  color: var(--gray2);
}

.deck-valid-hint {
  font-size: 0.8rem;
  padding: 6px 0;
}

.deck-valid-hint.valid {
  color: #50c878;
}

.deck-valid-hint.invalid {
  color: var(--gray2);
}

.available-section {
  margin-bottom: 80px;
}

.branch-group {
  margin-bottom: 16px;
}

.branch-group-title {
  font-family: Anonymous, sans-serif;
  font-size: 0.95rem;
  color: var(--gray3);
  border-bottom: 1px solid var(--gray1);
  padding-bottom: 4px;
  margin-bottom: 8px;
}

.available-move {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--black-opacity-80);
  border: 1px solid var(--gray1);
  border-radius: 4px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.available-move.in-deck {
  border-color: var(--pink);
  background: rgba(255, 6, 111, 0.06);
}

.available-move.cant-add {
  opacity: 0.5;
  cursor: not-allowed;
}

.available-move-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.available-move-name {
  font-size: 0.9rem;
  color: var(--white);
}

.available-move-level {
  font-size: 0.7rem;
  color: var(--gray3);
}

.available-move-stats {
  display: flex;
  gap: 8px;
}

.mini-stat {
  font-size: 0.75rem;
  color: var(--gray2);
}

.deck-indicator {
  font-size: 1rem;
  color: var(--pink);
  width: 20px;
  text-align: center;
}

.action-bar {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.btn-fight {
  padding: 14px 48px;
  background: var(--pink);
  border: none;
  border-radius: 4px;
  color: var(--white);
  font-family: Anonymous, sans-serif;
  font-size: 1.1rem;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.4);
}

.btn-fight:disabled {
  background: var(--gray2);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.5;
}

.scroll-gap {
  height: 120px;
}
</style>
