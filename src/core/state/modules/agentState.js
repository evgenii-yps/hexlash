import apiClient from '@/core/api/apiClient.js';
import { ErrorMessageModel } from '@/core/models/internal/errorMessageModel.js';

const state = {
  agents: [],
  agentsLoading: false,
  agentError: null,
  fightClubLevel: null,
  fightClubLevelLoading: false,
  // Detail view state
  currentAgent: null,
  currentAgentLoading: false,
  availableMoves: [],
  availableMovesLoading: false,
  fightHistory: [],
  fightHistoryTotal: 0,
  fightHistoryLoading: false,
  trainResult: null,
  trainLoading: false,
};

const getters = {
  agentsList: (state) => [...state.agents].sort((a, b) => {
    if (a.isCaptain !== b.isCaptain) return a.isCaptain ? -1 : 1;
    if (a.isHexmaster !== b.isHexmaster) return a.isHexmaster ? -1 : 1;
    if (b.belt !== a.belt) return b.belt - a.belt;
    return (b.qualifiedWins || 0) - (a.qualifiedWins || 0);
  }),
  agentById: (state) => (id) => state.agents.find(a => a.id === id),
  currentCaptain: (state) => state.agents.find(a => a.isCaptain) || null,
  canCreateAgent: (state) => {
    if (!state.fightClubLevel) return false;
    return state.fightClubLevel.currentAgents < state.fightClubLevel.maxAgents;
  },
  activeAgents: (state) => state.agents.filter(a => a.autoFight),
  idleAgents: (state) => state.agents.filter(a => a.status === 'idle'),
  fightingAgents: (state) => state.agents.filter(a => a.status === 'fighting'),
  restingAgents: (state) => state.agents.filter(a => a.status === 'resting'),
  fightClubProgress: (state) => state.fightClubLevel,
};

const mutations = {
  SET_AGENTS(state, agents) { state.agents = agents; },
  SET_AGENTS_LOADING(state, val) { state.agentsLoading = val; },
  SET_AGENT_ERROR(state, val) { state.agentError = val; },
  ADD_AGENT(state, agent) { state.agents.push(agent); },
  REMOVE_AGENT(state, id) { state.agents = state.agents.filter(a => a.id !== id); },
  UPDATE_AGENT(state, updated) {
    const idx = state.agents.findIndex(a => a.id === updated.id);
    if (idx !== -1) state.agents.splice(idx, 1, { ...state.agents[idx], ...updated });
  },
  // Sub-Epic 5L Phase 2 — optimistic captain swap.
  OPTIMISTIC_SET_CAPTAIN(state, agentId) {
    state.agents = state.agents.map(a => ({ ...a, isCaptain: a.id === agentId }));
    if (state.currentAgent) {
      state.currentAgent = { ...state.currentAgent, isCaptain: state.currentAgent.id === agentId };
    }
  },
  ROLLBACK_AGENTS(state, snapshot) {
    state.agents = snapshot.agents;
    state.currentAgent = snapshot.currentAgent;
  },
  SET_FIGHT_CLUB_LEVEL(state, data) { state.fightClubLevel = data; },
  SET_FIGHT_CLUB_LEVEL_LOADING(state, val) { state.fightClubLevelLoading = val; },
  // Detail
  SET_CURRENT_AGENT(state, agent) { state.currentAgent = agent; },
  SET_CURRENT_AGENT_LOADING(state, val) { state.currentAgentLoading = val; },
  SET_AVAILABLE_MOVES(state, moves) { state.availableMoves = moves; },
  SET_AVAILABLE_MOVES_LOADING(state, val) { state.availableMovesLoading = val; },
  SET_FIGHT_HISTORY(state, { fights, total, append }) {
    if (append) state.fightHistory.push(...fights);
    else state.fightHistory = fights;
    state.fightHistoryTotal = total;
  },
  SET_FIGHT_HISTORY_LOADING(state, val) { state.fightHistoryLoading = val; },
  SET_TRAIN_RESULT(state, val) { state.trainResult = val; },
  SET_TRAIN_LOADING(state, val) { state.trainLoading = val; },
};

const actions = {
  async fetchAgents({ commit }) {
    commit('SET_AGENTS_LOADING', true);
    commit('SET_AGENT_ERROR', null);
    try {
      const res = await apiClient.get('/agent/list', { authRequired: true });
      commit('SET_AGENTS', res.agents || []);
    } catch (err) {
      commit('SET_AGENT_ERROR', err.message);
    } finally {
      commit('SET_AGENTS_LOADING', false);
    }
  },

  async fetchFightClubLevel({ commit }) {
    commit('SET_FIGHT_CLUB_LEVEL_LOADING', true);
    try {
      const res = await apiClient.get('/agent/fight-club', { authRequired: true });
      commit('SET_FIGHT_CLUB_LEVEL', res.data || res);
    } catch (err) {
      console.error('Failed to fetch fight club level:', err);
    } finally {
      commit('SET_FIGHT_CLUB_LEVEL_LOADING', false);
    }
  },

  async createAgent({ commit }, agentData) {
    const res = await apiClient.post('/agent/create', agentData, { authRequired: true });
    commit('ADD_AGENT', res.agent);
    return res.agent;
  },

  async deleteAgent({ commit }, id) {
    await apiClient.delete(`/agent/${id}`, { authRequired: true });
    commit('REMOVE_AGENT', id);
  },

  async toggleAutoFight({ commit }, { id, enabled }) {
    const res = await apiClient.put(`/agent/${id}/auto-fight`, { enabled }, { authRequired: true });
    commit('UPDATE_AGENT', { id, autoFight: res.agent.autoFight, status: res.agent.status, nextFightAt: res.agent.nextFightAt });
  },

  // Sub-Epic 5L Phase 2 — optimistic update + rollback toast on error.
  // UI flips immediately via OPTIMISTIC_SET_CAPTAIN; fetchAgents syncs
  // server-truth on success. On error, ROLLBACK_AGENTS restores snapshot
  // and master/setErrorMessage surfaces a toast.
  async setCaptain({ commit, dispatch, state }, agentId) {
    const snapshot = {
      agents: state.agents.map(a => ({ ...a })),
      currentAgent: state.currentAgent ? { ...state.currentAgent } : null,
    };
    commit('OPTIMISTIC_SET_CAPTAIN', agentId);
    try {
      await apiClient.put(`/agent/${agentId}/captain`, {}, { authRequired: true });
      await dispatch('fetchAgents');
    } catch (err) {
      commit('ROLLBACK_AGENTS', snapshot);
      commit(
        'master/setErrorMessage',
        ErrorMessageModel.withText('Failed to set captain'),
        { root: true }
      );
      throw err;
    }
  },

  async refreshAgentStatus({ commit }, id) {
    const res = await apiClient.get(`/agent/${id}/auto-fight-status`, { authRequired: true });
    commit('UPDATE_AGENT', { id, autoFight: res.autoFight, status: res.status, nextFightAt: res.nextFightAt });
  },

  // Detail view actions
  async fetchAgent({ commit }, agentId) {
    commit('SET_CURRENT_AGENT_LOADING', true);
    try {
      const res = await apiClient.get(`/agent/${agentId}`, { authRequired: true });
      commit('SET_CURRENT_AGENT', res.agent);
    } catch (err) {
      console.error('Failed to fetch agent:', err);
    } finally {
      commit('SET_CURRENT_AGENT_LOADING', false);
    }
  },

  async updateAgent({ commit }, { id, ...payload }) {
    const res = await apiClient.put(`/agent/${id}`, payload, { authRequired: true });
    commit('SET_CURRENT_AGENT', res.agent);
    commit('UPDATE_AGENT', res.agent);
    return res.agent;
  },

  async updateTactics({ commit, state: s }, { id, ...payload }) {
    const res = await apiClient.put(`/agent/${id}/tactics`, payload, { authRequired: true });
    if (s.currentAgent && s.currentAgent.id === id) {
      commit('SET_CURRENT_AGENT', { ...s.currentAgent, tactics: res.tactics });
    }
    return res.tactics;
  },

  async fetchAvailableMoves({ commit }, agentId) {
    commit('SET_AVAILABLE_MOVES_LOADING', true);
    try {
      const res = await apiClient.get(`/agent/${agentId}/available-moves`, { authRequired: true });
      commit('SET_AVAILABLE_MOVES', res.moves || []);
    } catch (err) {
      console.error('Failed to fetch available moves:', err);
    } finally {
      commit('SET_AVAILABLE_MOVES_LOADING', false);
    }
  },

  async learnMove({ commit, dispatch, state: s }, { agentId, moveId, targetLevel }) {
    const res = await apiClient.post(`/agent/${agentId}/learn-move`, { moveId, targetLevel }, { authRequired: true });
    if (s.currentAgent && s.currentAgent.id === agentId) {
      commit('SET_CURRENT_AGENT', { ...s.currentAgent, progression: res.progression });
    }
    await dispatch('fetchAvailableMoves', agentId);
    return res;
  },

  async updateDeck({ commit, state: s }, { agentId, deck }) {
    const res = await apiClient.put(`/agent/${agentId}/deck`, { deck }, { authRequired: true });
    if (s.currentAgent && s.currentAgent.id === agentId) {
      commit('SET_CURRENT_AGENT', { ...s.currentAgent, progression: res.progression });
    }
    return res;
  },

  async fetchFightHistory({ commit }, { agentId, mode, limit = 20, offset = 0, append = false }) {
    commit('SET_FIGHT_HISTORY_LOADING', true);
    try {
      const params = { limit, offset };
      if (mode) params.mode = mode;
      const res = await apiClient.get(`/agent/${agentId}/fights`, { params, authRequired: true });
      commit('SET_FIGHT_HISTORY', { fights: res.fights || [], total: res.total || 0, append });
    } catch (err) {
      console.error('Failed to fetch fight history:', err);
    } finally {
      commit('SET_FIGHT_HISTORY_LOADING', false);
    }
  },

  async researchAction({ commit, state: s }, { agentId, action, moveId }) {
    const res = await apiClient.post(`/agent/${agentId}/research`, { action, moveId }, { authRequired: true });
    if (s.currentAgent && s.currentAgent.id === agentId) {
      commit('SET_CURRENT_AGENT', { ...s.currentAgent, progression: res.progression });
    }
    return res;
  },

  async allocateXp({ commit, state: s }, { agentId, branch, amount }) {
    const res = await apiClient.post(`/agent/${agentId}/allocate-xp`, { branch, amount }, { authRequired: true });
    if (s.currentAgent && s.currentAgent.id === agentId) {
      commit('SET_CURRENT_AGENT', { ...s.currentAgent, progression: res.progression });
    }
    return res;
  },

  async trainAgent({ commit, dispatch }, agentId) {
    commit('SET_TRAIN_LOADING', true);
    commit('SET_TRAIN_RESULT', null);
    try {
      const res = await apiClient.post(`/agent/${agentId}/train`, {}, { authRequired: true });
      commit('SET_TRAIN_RESULT', res);
      await dispatch('fetchAgent', agentId);
      return res;
    } catch (err) {
      throw err;
    } finally {
      commit('SET_TRAIN_LOADING', false);
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
