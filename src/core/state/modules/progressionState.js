/**
 * progressionState — TRAINER progression module.
 * Holds the player's "school": tap count, freeXP, deck, legacy moves/branchExp.
 *
 * Research (moves unlock/upgrade) is now per-agent via ResearchTree.
 * This module remains for: taps (TrainingView), freeXP display, deck (legacy),
 * syncProgression to server, and data restore on login.
 */

import { allMoves } from '@/data/moves.js';
import apiClient from '@/core/api/apiClient.js';

let syncTimeout = null;

const STORAGE_KEY = 'hexlash_progression';
const STARTER_MOVES = ["jab", "straight", "block_strike"];

function createInitialProgress() {
  const moves = {};
  Object.keys(allMoves).forEach(moveId => {
    moves[moveId] = {
      level: STARTER_MOVES.includes(moveId) ? 1 : 0,
      unlocked: STARTER_MOVES.includes(moveId)
    };
  });
  return {
    taps: 0,
    freeXP: 0,
    branchExp: { speed: 0, power: 0, technique: 0 },
    moves,
    deck: [...STARTER_MOVES],
    totalTaps: 0,
    totalFights: 0,
    totalWins: 0
  };
}

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      const initial = createInitialProgress();
      return {
        ...initial,
        ...data,
        freeXP: data.freeXP || 0,
        moves: { ...initial.moves, ...(data.moves || {}) },
        branchExp: { ...initial.branchExp, ...(data.branchExp || {}) }
      };
    }
  } catch (e) {
    console.error('Failed to load progression:', e);
  }
  return createInitialProgress();
}

function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      taps: state.taps,
      freeXP: state.freeXP,
      branchExp: state.branchExp,
      moves: state.moves,
      deck: state.deck,
      totalTaps: state.totalTaps,
      totalFights: state.totalFights,
      totalWins: state.totalWins
    }));
  } catch (e) {
    console.error('Failed to save progression:', e);
  }
}

export default {
  namespaced: true,

  state: () => loadProgress(),

  getters: {
    getTaps: state => state.taps,
    getTotalTaps: state => state.totalTaps,
    getFreeXP: state => state.freeXP,
    getMoves: state => state.moves,
    getDeck: state => state.deck,
    getStats: state => ({
      totalFights: state.totalFights,
      totalWins: state.totalWins
    }),
    getUnlockedMoves: state => Object.entries(state.moves)
      .filter(([, m]) => m.unlocked)
      .map(([id]) => id),

    isDeckValid: state => {
      const { deck, moves } = state;
      if (deck.length < 3 || deck.length > 5) return false;
      return deck.every(id => moves[id]?.unlocked);
    }
  },

  mutations: {
    addTap(state) {
      state.taps += 1;
      state.totalTaps += 1;
      saveProgress(state);
    },

    addFreeXP(state, { amount, result }) {
      state.freeXP += amount;
      state.totalFights += 1;
      if (result === 'win') state.totalWins += 1;
      saveProgress(state);
    },

    restoreProgression(state, data) {
      if (data.moves) state.moves = { ...state.moves, ...data.moves };
      if (data.branchExp) state.branchExp = { ...state.branchExp, ...data.branchExp };
      if (data.taps !== undefined) state.taps = data.taps;
      if (data.freeXP !== undefined) state.freeXP = data.freeXP;
      if (data.totalTaps !== undefined) state.totalTaps = data.totalTaps;
      if (data.totalFights !== undefined) state.totalFights = data.totalFights;
      if (data.totalWins !== undefined) state.totalWins = data.totalWins;
      saveProgress(state);
    },

    restoreDeck(state, deck) {
      if (Array.isArray(deck) && deck.length > 0) {
        state.deck = deck;
        saveProgress(state);
      }
    },

    toggleDeckMove(state, moveId) {
      const deck = [...state.deck];
      const idx = deck.indexOf(moveId);
      if (idx !== -1) {
        // Always allow removal — button validation handles minimum
        deck.splice(idx, 1);
      } else {
        if (deck.length < 5) {
          deck.push(moveId);
        }
      }
      state.deck = deck;
      saveProgress(state);
    }
  },

  actions: {
    syncProgression({ state, rootState }) {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(async () => {
        try {
          await apiClient.put('/user/progression', {
            progression: {
              moves: state.moves,
              branchExp: state.branchExp,
              taps: state.taps,
              freeXP: state.freeXP,
              totalTaps: state.totalTaps,
              totalFights: state.totalFights,
              totalWins: state.totalWins,
              playerModules: rootState.fight?.playerModules || null,
            },
            deck: state.deck,
          }, { authRequired: true });
        } catch (error) {
          console.error('[SYNC] Failed to save progression:', error);
        }
      }, 3000);
    },

    addTap({ commit }) {
      commit('addTap');
    },

    onFightEnd({ commit, dispatch }, { result }) {
      const amount = result === 'win' ? 10 : result === 'draw' ? 7 : 5;
      commit('addFreeXP', { amount, result });
      dispatch('syncProgression');
    },

    toggleDeckMove({ commit, dispatch }, moveId) {
      commit('toggleDeckMove', moveId);
      dispatch('syncProgression');
    }
  }
};
