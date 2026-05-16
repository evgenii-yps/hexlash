const state = {
    punchInfo: null,
    isTrainingBlocked: false,
    isMuted: localStorage.getItem('isMuted') === 'true',
};

const getters = {
    isMuted: (state) => state.isMuted,
};

const mutations = {
    setIsTrainingBlock(state, isTrainingBlocked) {
        state.isTrainingBlocked = isTrainingBlocked;
    },
    setPunchInfo(state, info) {
        state.punchInfo = info;
    },
    setMuted(state, isMuted) {
        state.isMuted = isMuted;
        localStorage.setItem('isMuted', isMuted);
    },
};

const actions = {};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
