import router from "@/router/index.js";
import {updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {AuthStateModel} from "@/core/models/internal/authStateModel.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {PasswordResetStateModel} from "@/core/models/internal/passwordResetStateModel.js";
import {InviteStateModel} from "@/core/models/internal/inviteStateModel.js";
import {i18n} from '@/main.js';
import * as masterService from "@/core/services/masterService.js";



const state = {
    master: null,
    jwtToken: masterService.getJwtToken(),
    authState: new AuthStateModel(),
    inviteState: new InviteStateModel(),
    resetState: new PasswordResetStateModel(),
    infoMessage: new InfoMessageModel(),
};

const getters = {
    getMaster: (state) => state.master,
    getJwtToken: (state) => state.jwtToken,
    getAuthState: (state) => state.authState,
    getInviteState: (state) => state.inviteState,
    getResetState: (state) => state.resetState,
    getLanguage: (state) => state.master?.language,
    getInfoMessage(state) {
        return state.infoMessage;
    },
};

const mutations = {
    setMaster: (state, masterData) => {
        state.master = masterData;
    },
    setJwtToken(state, token) {
        state.jwtToken = token;
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
    setInviteState: (state, payload) => {
        Object.assign(state.inviteState, payload);
    },
    setInfoMessage(state, message) {
        state.infoMessage = message;
    },
    clearInfoMessage(state) {
        state.infoMessage = new InfoMessageModel();
    },
    setResetState: (state, resetState) => {
        state.resetState = resetState;
    },
    clearResetState: (state) => {
        state.resetState = PasswordResetStateModel.Reset();
    }
};

const actions = {
    async initializeMasterData({commit}) {
        try {
            await masterService.initializeMasterData();
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    },
    async login({commit}, credentials) {
        await masterService.login(credentials);

        await this.dispatch('master/initInitialize');

        await router.push('/');
    },
    async logout({commit}) {

        await masterService.logout();

        commit('clearAuthData');

        await router.push('/');
    },
    /*syncMaster({commit}) {
        try {
           getMasterFromAPI();
        } catch (error) {
            console.error('Failed to sync master data:', error);
        }
    },*/
    async sendInvite({commit}, inviteCode) {
        commit('setInviteState', { loading: true });
        try {
            const response = await masterService.sendInvite(inviteCode);

            // Сначала полностью очистить всю базу с компьютера
            await masterService.fullReset();

            // Авторизуемся под временными данными
            this.dispatch('master/login', {
                login: response.data.login,
                password: response.data.tempPassword
            });

        } catch (error) {
            commit('setInviteState', { errorMessage: error.message, loading: false });
        }
    },
    async initInitialize({commit}) {
        // Если первый вход в приложение
        if(!state.master.initialVerified) {
            const master = state.master;

            commit('setInviteState', {
                generatedLogin: master.getLogin(),
                generatedPassword: master.tempPassword,
                loading: false,
                errorMessage: null
            });
        }
    },
    async sendInitialize({commit, dispatch}, payload) {
        try {
            // TODO Еще отправляем язык пользователя, чтобы хранить его

            // await someApiCall(payload);

            // Обновляем мастера


        } catch (error) {
            throw error; // Исключение будет поймано в компоненте
        }
    },
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
    async setLanguage({commit, state}, language) {
        this.dispatch('master/updateMaster', {language: language});

        i18n.global.locale.value = language
    },
    async resetPassword({commit}, email) {
        commit('setResetState', PasswordResetStateModel.Loading(true));
        try {
            const response = await masterService.resetPassword(email);
            commit('setResetState', PasswordResetStateModel.Success(response.message));
        } catch (error) {
            commit('setResetState', PasswordResetStateModel.Error(error.message));
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
