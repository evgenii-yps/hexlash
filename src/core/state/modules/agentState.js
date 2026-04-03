import apiClient from '@/core/api/apiClient.js';

const state = {
  agents: [],
  agentsLoading: false,
  agentError: null,
  clubLevel: null,
  clubLevelLoading: false,
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
  agentsList: (state) => [...state.agents].sort((a, b) => b.elo - a.elo),
  agentById: (state) => (id) => state.agents.find(a => a.id === id),
  canCreateAgent: (state) => {
    if (!state.clubLevel) return false;
    return state.clubLevel.currentAgents < state.clubLevel.maxAgents;
  },
  activeAgents: (state) => state.agents.filter(a => a.autoFight),
  idleAgents: (state) => state.agents.filter(a => a.status === 'idle'),
  fightingAgents: (state) => state.agents.filter(a => a.status === 'fighting'),
  restingAgents: (state) => state.agents.filter(a => a.status === 'resting'),
  clubProgress: (state) => state.clubLevel,
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
  SET_CLUB_LEVEL(state, data) { state.clubLevel = data; },
  SET_CLUB_LEVEL_LOADING(state, val) { state.clubLevelLoading = val; },
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
      const { data } = await apiClient.get('/agent/list', { authRequired: true });
      commit('SET_AGENTS', data.agents || []);
    } catch (err) {
      commit('SET_AGENT_ERROR', err.message);
    } finally {
      commit('SET_AGENTS_LOADING', false);
    }
  },

  async fetchClubLevel({ commit }, clubId) {
    commit('SET_CLUB_LEVEL_LOADING', true);
    try {
      const { data } = await apiClient.get(`/club/${clubId}/level`, { authRequired: true });
      commit('SET_CLUB_LEVEL', data.data || data);
    } catch (err) {
      console.error('Failed to fetch club level:', err);
    } finally {
      commit('SET_CLUB_LEVEL_LOADING', false);
    }
  },

  async createAgent({ commit }, agentData) {
    const { data } = await apiClient.post('/agent/create', agentData, { authRequired: true });
    commit('ADD_AGENT', data.agent);
    return data.agent;
  },

  async deleteAgent({ commit }, id) {
    await apiClient.delete(`/agent/${id}`, { authRequired: true });
    commit('REMOVE_AGENT', id);
  },

  async toggleAutoFight({ commit }, { id, enabled }) {
    const { data } = await apiClient.put(`/agent/${id}/auto-fight`, { enabled }, { authRequired: true });
    commit('UPDATE_AGENT', { id, autoFight: data.agent.autoFight, status: data.agent.status, nextFightAt: data.agent.nextFightAt });
  },

  async refreshAgentStatus({ commit }, id) {
    const { data } = await apiClient.get(`/agent/${id}/auto-fight-status`, { authRequired: true });
    commit('UPDATE_AGENT', { id, autoFight: data.autoFight, status: data.status, nextFightAt: data.nextFightAt });
  },

  // Detail view actions
  async fetchAgent({ commit }, agentId) {
    commit('SET_CURRENT_AGENT_LOADING', true);
    try {
      const { data } = await apiClient.get(`/agent/${agentId}`, { authRequired: true });
      commit('SET_CURRENT_AGENT', data.agent);
    } catch (err) {
      console.error('Failed to fetch agent:', err);
    } finally {
      commit('SET_CURRENT_AGENT_LOADING', false);
    }
  },

  async updateAgent({ commit }, { id, ...data }) {
    const res = await apiClient.put(`/agent/${id}`, data, { authRequired: true });
    commit('SET_CURRENT_AGENT', res.data.agent);
    commit('UPDATE_AGENT', res.data.agent);
    return res.data.agent;
  },

  async updateTactics({ commit, state: s }, { id, ...data }) {
    const res = await apiClient.put(`/agent/${id}/tactics`, data, { authRequired: true });
    if (s.currentAgent && s.currentAgent.id === id) {
      commit('SET_CURRENT_AGENT', { ...s.currentAgent, tactics: res.data.tactics });
    }
    return res.data.tactics;
  },

  async fetchAvailableMoves({ commit }, agentId) {
    commit('SET_AVAILABLE_MOVES_LOADING', true);
    try {
      const { data } = await apiClient.get(`/agent/${agentId}/available-moves`, { authRequired: true });
      commit('SET_AVAILABLE_MOVES', data.moves || []);
    } catch (err) {
      console.error('Failed to fetch available moves:', err);
    } finally {
      commit('SET_AVAILABLE_MOVES_LOADING', false);
    }
  },

  async learnMove({ commit, dispatch, state: s }, { agentId, moveId, targetLevel }) {
    const res = await apiClient.post(`/agent/${agentId}/learn-move`, { moveId, targetLevel }, { authRequired: true });
    if (s.currentAgent && s.currentAgent.id === agentId) {
      commit('SET_CURRENT_AGENT', { ...s.currentAgent, progression: res.data.progression });
    }
    await dispatch('fetchAvailableMoves', agentId);
    return res.data;
  },

  async updateDeck({ commit, state: s }, { agentId, deck }) {
    const res = await apiClient.put(`/agent/${agentId}/deck`, { deck }, { authRequired: true });
    if (s.currentAgent && s.currentAgent.id === agentId) {
      commit('SET_CURRENT_AGENT', { ...s.currentAgent, progression: res.data.progression });
    }
    return res.data;
  },

  async fetchFightHistory({ commit }, { agentId, mode, limit = 20, offset = 0, append = false }) {
    commit('SET_FIGHT_HISTORY_LOADING', true);
    try {
      const params = { limit, offset };
      if (mode) params.mode = mode;
      const { data } = await apiClient.get(`/agent/${agentId}/fights`, { params, authRequired: true });
      commit('SET_FIGHT_HISTORY', { fights: data.fights || [], total: data.total || 0, append });
    } catch (err) {
      console.error('Failed to fetch fight history:', err);
    } finally {
      commit('SET_FIGHT_HISTORY_LOADING', false);
    }
  },

  async trainAgent({ commit, dispatch }, agentId) {
    commit('SET_TRAIN_LOADING', true);
    commit('SET_TRAIN_RESULT', null);
    try {
      const { data } = await apiClient.post(`/agent/${agentId}/train`, {}, { authRequired: true });
      commit('SET_TRAIN_RESULT', data);
      await dispatch('fetchAgent', agentId);
      return data;
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
