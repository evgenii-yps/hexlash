import {
    getMasterFromLocalAndAPI,
    login as loginService,
    testLogin, updateMasterToLocalDB
} from '@/core/services/masterService.js';
import {MasterModel} from "@/core/models/masterModel.js";
import router from "@/router/index.js";

const state = {
    master: null,
    authError: null,
    isAuthenticated: false
};

const getters = {
    getMaster: (state) => state.master,
    getAuthError: (state) => state.authError,
    isAuthenticated: state => state.isAuthenticated,
};

const mutations = {
    setMaster: (state, masterData) => {
        state.master = masterData;
    },
    updateMaster(state, updatedMasterData) {
        if (state.master) {
            for (const [key, value] of Object.entries(updatedMasterData)) {
                if (key in state.master) {
                    state.master[key] = value;
                } else if (key in state.master.userData) {
                    state.master.userData[key] = value;
                }
            }
        }
    },
    setAuthError: (state, error) => {
        state.authError = error;
    },
    setAuthenticated: (state, isAuthenticated) => {
        state.isAuthenticated = isAuthenticated;
    },
    clearAuthData: (state) => {
        state.master = null;
        state.authError = null;
        state.isAuthenticated = false;
    },
};

const actions = {
    async login({ commit }, credentials) {
        try {
            const master = await testLogin(credentials);

            commit('setMaster', master);
            commit('setAuthenticated', true);

            await router.push('/profile');
        } catch (error) {
            commit('setAuthError', error);
        }
    },
    logout({ commit }) {
        // TODO Logout
        commit('clearAuthData');
    },
    async fetchMaster({ commit }) {
        try {
            const localData = await getMasterFromLocalAndAPI();
            if (localData) {
                commit('setMaster', new MasterModel(localData));
                commit('setAuthenticated', true);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    },
    async updateMaster({ commit, state }, updatedData) {
        try {
            // Обновление состояния
            commit('updateMaster', updatedData);

            // Отправка обновленных данных на сервер
            // await updateUserOnAPI(state.currentUser);

            await updateMasterToLocalDB(updatedData);

        } catch (error) {
            console.error('Failed to update user data:', error);
        }
    },
    async uploadMasterAvatar({ commit }, { avatarDataUrl, onUploadProgress }) {
        try {
            // Симуляция загрузки на сервер
            for (let i = 0; i <= 100; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                onUploadProgress({ loaded: i, total: 100 });
            }

            // После успешной симуляции загрузки обновляем аватар в стейте
            this.dispatch('master/updateMaster', { avatarUrl: avatarDataUrl });

            // await updateUserOnAPI(state.currentUser);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
        }
    },
    async changeSkin({ commit, state }, skinId) {
        try {
            // Обновление скина
            this.dispatch('master/updateMaster', { skin: skinId });

            // Отправка обновленных данных на сервер
            // await updateSkinOnAPI(state.currentUser);

        } catch (error) {
            console.error('Failed to update user data:', error);
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
