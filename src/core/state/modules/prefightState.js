// Pre-fight state (Stage 1 visualization, temporary).
// Holds the core the player picked on /play (selection screen) so the upgrade
// screen and the arena can read it within the SPA session, plus the upgrade
// screen's working face-tree (deep copy of CRYSTALS — the README port contract
// puts this "state" in the store). Not persisted — a hard refresh on
// /play/upgrade or /play/arena drops the pick, and the route guards bounce back
// to the selection screen (see router/index.js).
const state = {
    selectedCoreId: null,
    // Working copy of the active core's crystals/faces ([{ id, name, limit,
    // faces:[{ id, name, state }] }]). Built lazily on the upgrade screen; reset
    // whenever a new core is picked so each pick starts fresh.
    upgradeTree: null,
};

const getters = {
    selectedCoreId: (s) => s.selectedCoreId,
    upgradeTree: (s) => s.upgradeTree,
};

const mutations = {
    SET_CORE(s, id) {
        s.selectedCoreId = id;
        s.upgradeTree = null; // a fresh pick starts a fresh tree
    },
    CLEAR_CORE(s) {
        s.selectedCoreId = null;
        s.upgradeTree = null;
    },
    SET_UPGRADE_TREE(s, tree) {
        s.upgradeTree = tree;
    },
    SET_FACE_STATE(s, {crystalId, faceId, faceState}) {
        if (!s.upgradeTree) return;
        const cr = s.upgradeTree.find((c) => c.id === crystalId);
        const f = cr && cr.faces.find((x) => x.id === faceId);
        if (f) f.state = faceState;
    },
};

const actions = {
    selectCore({commit}, id) {
        commit('SET_CORE', id);
    },
    clearCore({commit}) {
        commit('CLEAR_CORE');
    },
    // Build the working tree from the given crystals once (deep copy). No-op if
    // already present (so back-navigation from the arena keeps lit faces).
    initUpgradeTree({state: s, commit}, crystals) {
        if (!s.upgradeTree) commit('SET_UPGRADE_TREE', JSON.parse(JSON.stringify(crystals)));
    },
    setFaceState({commit}, payload) {
        commit('SET_FACE_STATE', payload);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
