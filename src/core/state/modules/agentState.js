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
  // Sub-epic 2 — Ratings tab AGENTS data (Path A Vuex extension).
  // REPLACE semantics on setAgentRankings (preempts F3 stale-rows risk).
  // Mirrors clanRatings/participantRatings shape but with replace, not append.
  agentRankings: {
    items: [],
    total: 0,
    limitReached: false,
    pageSize: 20,
  },
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
  getAgentRankings: (state) => state.agentRankings.items,
};

const mutations = {
  SET_AGENTS(state, agents) { state.agents = agents; },
  SET_AGENTS_LOADING(state, val) { state.agentsLoading = val; },
  SET_AGENT_ERROR(state, val) { state.agentError = val; },
  ADD_AGENT(state, agent) { state.agents.push(agent); },
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
  // Sub-Epic 5M Phase 1 — optimistic auto-fight toggle (mirror 5L Phase 2 pattern).
  // Flips both state.agents AND state.currentAgent when the open detail view
  // matches. ROLLBACK_AUTO_FIGHT restores prevEnabled per-agent (lighter than
  // full ROLLBACK_AGENTS snapshot — single boolean revert).
  OPTIMISTIC_TOGGLE_AUTO_FIGHT(state, { agentId, enabled }) {
    state.agents = state.agents.map(a =>
      a.id === agentId ? { ...a, autoFight: enabled } : a
    );
    if (state.currentAgent && state.currentAgent.id === agentId) {
      state.currentAgent = { ...state.currentAgent, autoFight: enabled };
    }
  },
  ROLLBACK_AUTO_FIGHT(state, { agentId, prevEnabled }) {
    state.agents = state.agents.map(a =>
      a.id === agentId ? { ...a, autoFight: prevEnabled } : a
    );
    if (state.currentAgent && state.currentAgent.id === agentId) {
      state.currentAgent = { ...state.currentAgent, autoFight: prevEnabled };
    }
  },
  SET_FIGHT_CLUB_LEVEL(state, data) { state.fightClubLevel = data; },
  SET_FIGHT_CLUB_LEVEL_LOADING(state, val) { state.fightClubLevelLoading = val; },
  // Detail
  SET_CURRENT_AGENT(state, agent) { state.currentAgent = agent; },
  SET_CURRENT_AGENT_LOADING(state, val) { state.currentAgentLoading = val; },
  SET_AVAILABLE_MOVES(state, moves) { state.availableMoves = moves; },
  SET_AVAILABLE_MOVES_LOADING(state, val) { state.availableMovesLoading = val; },
  // Sub-epic 2 — AGENTS rankings. REPLACE (not append, unlike clanState
  // setClanRatings / userState setParticipantRatings — deliberate, preempts
  // F3 stale-rows risk for AGENTS tab refetch idempotency).
  setAgentRankings(state, { items, total }) {
    state.agentRankings.items = items;
    state.agentRankings.total = total;
  },
  updateAgentRankingsState(state, { field, value }) {
    if (Object.prototype.hasOwnProperty.call(state.agentRankings, field)) {
      state.agentRankings[field] = value;
    }
  },
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

  // Sub-Epic 5M Phase 1 — optimistic UI + rollback toast on error.
  // UI flips immediately via OPTIMISTIC_TOGGLE_AUTO_FIGHT; on success
  // UPDATE_AGENT syncs server-computed fields (status, nextFightAt) without
  // overwriting the already-flipped autoFight. On error, ROLLBACK_AUTO_FIGHT
  // reverts the optimistic flip and master/setErrorMessage surfaces a toast.
  async toggleAutoFight({ commit, state }, { id, enabled }) {
    const agent = state.agents.find(a => a.id === id);
    const prevEnabled = agent ? agent.autoFight : false;
    commit('OPTIMISTIC_TOGGLE_AUTO_FIGHT', { agentId: id, enabled });
    try {
      const res = await apiClient.put(`/agent/${id}/auto-fight`, { enabled }, { authRequired: true });
      commit('UPDATE_AGENT', {
        id,
        autoFight: res.agent.autoFight,
        status: res.agent.status,
        nextFightAt: res.agent.nextFightAt,
      });
    } catch (err) {
      commit('ROLLBACK_AUTO_FIGHT', { agentId: id, prevEnabled });
      commit(
        'master/setErrorMessage',
        ErrorMessageModel.withText('Failed to toggle auto-fight'),
        { root: true }
      );
      throw err;
    }
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

  // Sub-epic 2 — AGENTS tab data fetch.
  // Direct apiClient (no service layer — mirrors agent module convention,
  // not service-layer convention used by clanState/userState).
  // Offset-based pagination per /v1/agent/rankings backend (Q11).
  async loadAgentRankings({ commit, state }, { offset = 0, limit = state.agentRankings.pageSize } = {}) {
    const res = await apiClient.get('/agent/rankings', {
      params: { offset, limit },
      authRequired: true,
    });
    const items = res.rankings || [];
    commit('setAgentRankings', { items, total: res.total || 0 });
    commit('updateAgentRankingsState', { field: 'limitReached', value: items.length < limit });
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
