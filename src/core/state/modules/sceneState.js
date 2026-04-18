const VALID_SCENES = ['pit', 'profile', 'training', 'ratings', 'clan', 'mm', 'shop', 'detail', 'fight', 'create'];

export default {
    namespaced: true,
    state: () => ({
        current: 'pit',
        params: {},
        history: [],
    }),
    getters: {
        current: (s) => s.current,
        params: (s) => s.params,
        isImmersive: (s, g, rs, rg) => {
            if (s.current === 'pit') return true;
            if (s.current === 'mm') return true;
            if (s.current === 'fight') {
                return !!rg['pvp/getCurrentMatchId'];
            }
            return false;
        },
    },
    mutations: {
        SET_SCENE(s, { scene, params = {} }) {
            if (!VALID_SCENES.includes(scene)) return;
            if (s.current !== scene) s.history.push(s.current);
            if (s.history.length > 20) s.history.shift();
            s.current = scene;
            s.params = params;
        },
        POP_SCENE(s) {
            if (s.history.length === 0) return;
            s.current = s.history.pop();
            s.params = {};
        },
        RESET(s) {
            s.current = 'pit';
            s.params = {};
            s.history = [];
        },
    },
    actions: {
        setScene({ commit }, payload) {
            const p = typeof payload === 'string' ? { scene: payload } : payload;
            commit('SET_SCENE', p);
        },
        back({ commit }) {
            commit('POP_SCENE');
        },
    },
};
