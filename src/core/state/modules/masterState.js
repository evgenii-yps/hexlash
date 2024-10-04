import router from "@/router/index.js";
import {updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {LoginStateModel} from "@/core/models/internal/loginStateModel.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {PasswordResetStateModel} from "@/core/models/internal/passwordResetStateModel.js";
import {SignupStateModel} from "@/core/models/internal/signupStateModel.js";
import {i18n} from '@/main.js';
import * as masterService from "@/core/services/masterService.js";


const state = {
    master: null,
    jwtToken: masterService.getJwtToken(),
    loginState: new LoginStateModel(),
    signupState: new SignupStateModel(),
    resetState: new PasswordResetStateModel(),
    infoMessage: new InfoMessageModel(),
};

const getters = {
    getMaster: (state) => state.master,
    getJwtToken: (state) => state.jwtToken,
    getLoginState: (state) => state.loginState,
    getSignupState: (state) => state.signupState,
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
    setLoginState: (state, authState) => {
        state.loginState = authState;
    },
    setSignupState: (state, payload) => {
        Object.assign(state.signupState, payload);
    },
    clearAuthData: (state) => {
        state.master = null;
        state.loginState = {isAuthenticated: false, authError: null};
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
        try {
            await masterService.login(credentials);

            await this.dispatch('master/initGetStarted');

          //  await this.dispatch('webSocket/connectWebSocket');

            await router.push('/');

        } catch (error) {
            commit('setLoginState', {isAuthenticated: false, authError: error.message});
        }
    },
    async logout({commit}) {

        this.dispatch('webSocket/disconnectWebSocket');

        await masterService.logout();

        commit('clearAuthData');

        await router.push('/');
    },
    async sendInvite({commit}, inviteCode) {
        try {
            const {login, temporaryPassword} = await masterService.sendInvite(inviteCode);

            // Сначала полностью очистить всю базу с компьютера
            await masterService.resetClient();

            // Записываем временный пароль, который мы рекомендуем ему поставить
            commit('setSignupState', {
                generatedPassword: temporaryPassword,
            });

            // Авторизуемся под временными данными
            this.dispatch('master/login', {
                login: login,
                password: temporaryPassword
            });

        } catch (error) {
            commit('setSignupState', {errorMessage: error.message});
        }
    },
    async sendCheckLoginAvailable({commit}, login) {
        try {
            const isAvailable = await masterService.sendCheckLoginAvailable(login);
            if(!isAvailable && login === state.master.getLogin()) {
                return true;
            }

            return isAvailable;
        } catch (error) {
            commit('setInfoMessage', InfoMessageModel.withText(error.message));
        }

        return false;
    },
    async initGetStarted({commit}) {
        // Если первый вход в приложение
        if (state.master && !state.master.initialVerified) {
            commit('setSignupState', {
                generatedLogin: state.master.getLogin(),
                generatedPassword: state.signupState.generatedPassword,
                loading: false,
                errorMessage: null
            });
        }
    },
    async sendVerifyEmail({commit, state}, code) {
        try {
            // Отправка обновленных данных на сервер
            const isVerifyEmail = await masterService.sendVerifyEmail(code);

            if (isVerifyEmail) {
                if(state.master != null) {
                    commit('updateMaster', {emailVerified: true})
                }
                return;
            }

        } catch (error) {
            commit('setInfoMessage', InfoMessageModel.withText('Failed to verify email:', error.message));
        }

        throw new Error("Failed to verify email");
    },
    async updateMaster({commit, state}, updatedData) {
        try {

            // Отправка обновленных данных на сервер
            const response = await masterService.changeProfile(updatedData);

            // Обновление состояния
            commit('updateMaster', updatedData);

            await updateMasterToLocalDB(updatedData);

            return true;

        } catch (error) {
            commit('setInfoMessage', InfoMessageModel.withText(error.message));
        }
    },

    async changeSkin({commit, state}, skinId) {
        try {
            // Обновление скина
            this.dispatch('master/updateMaster', {skin: skinId});

        } catch (error) {
            commit('setInfoMessage', InfoMessageModel.withText(error.message));
        }
    },
    async setLanguage({commit, state}, language) {
        this.dispatch('master/updateMaster', {language: language});

        i18n.global.locale.value = language
    },
    async uploadMasterAvatar({commit}, {formData, onUploadProgress}) {
        try {
            const avatarUrl = await masterService.uploadAvatar(formData, onUploadProgress);

            commit('updateMaster', { avatarUrl });

            return avatarUrl;

        } catch (error) {
            console.error('Failed to upload avatar:', error);
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
    async deleteAccount({commit, state}) {
        try {

            this.dispatch('webSocket/disconnectWebSocket');

            // Отправка обновленных данных на сервер
            const response = await masterService.deleteAccount();

            commit('clearAuthData');

            await router.push('/');

        } catch (error) {
            commit('setInfoMessage', InfoMessageModel.withText(error.message));
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
