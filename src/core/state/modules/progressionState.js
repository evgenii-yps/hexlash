import { allMoves } from '@/data/moves.js';
import { branches } from '@/data/branches.js';
import { levelUpRequirements, unlockRequirements } from '@/data/requirements.js';

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
    getBranchExp: state => state.branchExp,
    getMoves: state => state.moves,
    getDeck: state => state.deck,
    getStats: state => ({
      totalFights: state.totalFights,
      totalWins: state.totalWins
    }),
    getUnlockedMoves: state => Object.entries(state.moves)
      .filter(([, m]) => m.unlocked)
      .map(([id]) => id),

    canLevelUp: state => moveId => {
      const move = state.moves[moveId];
      if (!move || !move.unlocked || move.level >= 5) return false;
      const req = levelUpRequirements[move.level + 1];
      if (!req) return false;
      const branch = allMoves[moveId]?.branch;
      return state.taps >= req.taps && state.branchExp[branch] >= req.exp;
    },

    canUnlock: state => moveId => {
      const moveData = allMoves[moveId];
      if (!moveData) return false;
      const branch = moveData.branch;
      const branchMoves = branches[branch].moves;
      const moveIndex = branchMoves.indexOf(moveId);
      if (moveIndex <= 0) return false;
      const prevMoveId = branchMoves[moveIndex - 1];
      const prevMove = state.moves[prevMoveId];
      if (!prevMove?.unlocked || prevMove.level < 3) return false;
      const req = unlockRequirements[prevMove.level];
      if (!req) return false;
      return state.taps >= req.taps && state.branchExp[branch] >= req.exp;
    },

    getLevelUpCost: () => moveId => {
      const move_data = allMoves[moveId];
      if (!move_data) return null;
      return levelUpRequirements;
    },

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

    levelUpMove(state, moveId) {
      const move = state.moves[moveId];
      if (!move || move.level >= 5) return;
      const req = levelUpRequirements[move.level + 1];
      const branch = allMoves[moveId].branch;
      state.taps -= req.taps;
      state.branchExp[branch] -= req.exp;
      state.moves = {
        ...state.moves,
        [moveId]: { ...move, level: move.level + 1 }
      };
      saveProgress(state);
    },

    unlockMove(state, moveId) {
      const moveData = allMoves[moveId];
      const branch = moveData.branch;
      const branchMoves = branches[branch].moves;
      const moveIndex = branchMoves.indexOf(moveId);
      const prevMoveId = branchMoves[moveIndex - 1];
      const prevMove = state.moves[prevMoveId];
      const req = unlockRequirements[prevMove.level];
      state.taps -= req.taps;
      state.branchExp[branch] -= req.exp;
      state.moves = {
        ...state.moves,
        [moveId]: { level: 1, unlocked: true }
      };
      saveProgress(state);
    },

    addFreeXP(state, { amount, result }) {
      state.freeXP += amount;
      state.totalFights += 1;
      if (result === 'win') state.totalWins += 1;
      saveProgress(state);
    },

    allocateXP(state, { branch, amount }) {
      if (amount <= 0 || amount > state.freeXP) return;
      if (!state.branchExp.hasOwnProperty(branch)) return;
      state.freeXP -= amount;
      state.branchExp = { ...state.branchExp, [branch]: state.branchExp[branch] + amount };
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
    addTap({ commit }) {
      commit('addTap');
    },

    levelUpMove({ commit, getters }, moveId) {
      if (!getters.canLevelUp(moveId)) return false;
      commit('levelUpMove', moveId);
      return true;
    },

    unlockMove({ commit, getters }, moveId) {
      if (!getters.canUnlock(moveId)) return false;
      commit('unlockMove', moveId);
      return true;
    },

    onFightEnd({ commit }, { result }) {
      const amount = result === 'win' ? 10 : 5;
      commit('addFreeXP', { amount, result });
    },

    allocateXP({ commit, state }, { branch, amount }) {
      if (amount <= 0 || amount > state.freeXP) return false;
      commit('allocateXP', { branch, amount });
      return true;
    },

    toggleDeckMove({ commit }, moveId) {
      commit('toggleDeckMove', moveId);
    }
  }
};
