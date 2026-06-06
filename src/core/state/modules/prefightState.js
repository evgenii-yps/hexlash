// Pre-fight selection state (Stage 1 visualization, temporary).
// Holds the core the player picked on /play (selection screen) so the upgrade
// screen and the arena can read it within the SPA session. Not persisted — a
// hard refresh on /play/upgrade or /play/arena drops the pick, and the route
// guards bounce back to the selection screen (see router/index.js).
const state = {
    selectedCoreId: null,
};

const getters = {
    selectedCoreId: (s) => s.selectedCoreId,
};

const mutations = {
    SET_CORE(s, id) {
        s.selectedCoreId = id;
    },
    CLEAR_CORE(s) {
        s.selectedCoreId = null;
    },
};

const actions = {
    selectCore({commit}, id) {
        commit('SET_CORE', id);
    },
    clearCore({commit}) {
        commit('CLEAR_CORE');
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
