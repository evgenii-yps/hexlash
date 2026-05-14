const state = {
    punchInfo: null,
    isTrainingBlocked: false,
    batchHitPunchAmount: [],
    batchHitPunchCount: 0,
    is2DPunch: localStorage.getItem('is2DPunch') === 'true', // Если у нас 2д режим
    isMuted: localStorage.getItem('isMuted') === 'true',
};

const getters = {
    getPunchInfo: (state) => {
        return state.punchInfo;
    },
    is2DPunchEnabled: (state) => state.is2DPunch,
    isMuted: (state) => state.isMuted,
};

const mutations = {
    setIsTrainingBlock(state, isTrainingBlocked) {
        state.isTrainingBlocked = isTrainingBlocked;
    },
    setPunchInfo(state, info) {
        state.punchInfo = info;
    },
    set2DPunch(state, isEnabled) {  // Мутация для изменения флага
        state.is2DPunch = isEnabled;
        localStorage.setItem('is2DPunch', isEnabled); // Обновляем localStorage
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
