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
    authState: new AuthStateModel(),
    inviteState: new InviteStateModel(),
    resetState: new PasswordResetStateModel(),
    infoMessage: new InfoMessageModel(),
};

const getters = {
    getMaster: (state) => state.master,
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
    setInviteState: (state, inviteState) => {
        state.inviteState = inviteState;
    },
    clearInviteState: (state) => {
        state.inviteState = InviteStateModel.Reset();
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
    async login({commit}, credentials) {
        await masterService.login(credentials);
        //await router.push('/profile');
    },
    async logout({commit}) {

        await masterService.logout();

        commit('clearAuthData');

        await router.push('/');
    },
    async fetchMaster({commit}) {
        try {
            await masterService.getMasterFromLocalAndAPI();
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

        console.log(i18n.global.locale.value)
    },
    async sendInvite({commit}, inviteCode) {
        commit('setInviteState', InviteStateModel.Loading(true));
        try {
            const response = await masterService.sendInvite(inviteCode);

            // Сначала полностью очистить всю базу с компьютера
            await masterService.fullReset();

            commit('setInviteState', InviteStateModel.Success(
                "jwt",
                "generatedLogin",
                "generatedPass")
            );

            await masterService.login(response);
            await router.push('/');

        } catch (error) {
            commit('setInviteState', InviteStateModel.Error(error.message));
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
