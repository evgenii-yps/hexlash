import {
    getMasterFromAPI,
    getMasterFromLocalAndAPI,
    login as loginAPI,
    logout as logoutService,
} from '@/core/services/masterService.js';
import router from "@/router/index.js";
import {updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {AuthStateModel} from "@/core/models/internal/authStateModel.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {i18n} from '@/main.js';


const state = {
    master: null,
    authState: new AuthStateModel(),
    infoMessage: new InfoMessageModel(),
};

const getters = {
    getMaster: (state) => state.master,
    getAuthState: (state) => state.authState,
    getLanguage: (state) => {
        return state.master && state.master.language ? state.master.language : 'en';
    },
    getInfoMessage(state) {
        return state.infoMessage;
    },
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
    increaseBalance(state, {add}) {
        if (state.master && state.master.userData.balance !== undefined) {
            state.master.userData.balance += add;
        }
    },
    setAuthState: (state, authState) => {
        state.authState = authState;
    },
    clearAuthData: (state) => {
        state.master = null;
        state.authState = new AuthStateModel();
    },
    setInfoMessage(state, message) {
        state.infoMessage = message;
    },
    clearInfoMessage(state) {
        state.infoMessage = new InfoMessageModel();
    },
};

const actions = {
    async login({commit}, credentials) {
        await loginAPI(credentials);
        await router.push('/profile');
    },
    async logout({commit}) {

        await logoutService();

        commit('clearAuthData');

        await router.push('/');
    },
    async fetchMaster({commit}) {
        try {
            await getMasterFromLocalAndAPI();
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    },
    /*syncMaster({commit}) {
        try {
           getMasterFromAPI();
        } catch (error) {
            console.error('Failed to sync master data:', error);
        }
    },*/
    async updateMaster({commit, state}, updatedData) {
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
    async uploadMasterAvatar({commit}, {avatarDataUrl, onUploadProgress}) {
        try {
            // Симуляция загрузки на сервер
            for (let i = 0; i <= 100; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                onUploadProgress({loaded: i, total: 100});
            }

            // После успешной симуляции загрузки обновляем аватар в стейте
            this.dispatch('master/updateMaster', {avatarUrl: avatarDataUrl});

            // await updateUserOnAPI(state.currentUser);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
        }
    },
    async changeSkin({commit, state}, skinId) {
        try {
            // Обновление скина
            this.dispatch('master/updateMaster', {skin: skinId});

            // Отправка обновленных данных на сервер
            // await updateSkinOnAPI(state.currentUser);

        } catch (error) {
            console.error('Failed to update user data:', error);
        }
    },
    async setLanguage({commit, dispatch, state}, language) {
        dispatch('updateMaster', {language: language});

        i18n.global.locale.value = language
        //i18n.global.locale = language;

        console.log(i18n.global.locale.value)
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
