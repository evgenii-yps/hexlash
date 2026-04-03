import apiClient from '@/core/api/apiClient.js';

const state = {
  agents: [],
  agentsLoading: false,
  agentError: null,
  clubLevel: null,
  clubLevelLoading: false,
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
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
