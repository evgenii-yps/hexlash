import router from "@/router/index.js";
import {updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {LoginStateModel} from "@/core/models/internal/loginStateModel.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {PasswordResetStateModel} from "@/core/models/internal/passwordResetStateModel.js";
import {SignupStateModel} from "@/core/models/internal/signupStateModel.js";
import {t, setLanguage as setLocaleLanguage} from '@/locales/index.js';
import * as masterService from "@/core/services/masterService.js";
import {ErrorMessageModel} from "@/core/models/internal/errorMessageModel.js";
import {setTelegram, updateJwtToken} from "@/core/services/masterService.js";


const state = {
    master: null,
    jwtToken: masterService.getJwtToken(),
    loginState: new LoginStateModel(),
    signupState: new SignupStateModel(),
    resetState: new PasswordResetStateModel(),
    infoMessage: new InfoMessageModel(),
    errorMessage: new ErrorMessageModel()
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
    getErrorMessage(state) {
        return state.errorMessage;
    }
};

const mutations = {
    setMaster: (state, masterData) => {
        // Восстанавливаем локально сохранённый скин, если сервер его не хранит
        const savedSkin = localStorage.getItem('selectedSkin');
        if (savedSkin && masterData?.userData) {
            masterData.userData.skin = savedSkin;
        }
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
                } else {
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
    decreaseBalance(state, sub) {
        if (state.master && state.master.userData.balance !== undefined) {
            state.master.userData.balance -= sub;
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
        localStorage.removeItem('selectedSkin');
    },
    setInfoMessage(state, message) {
        state.infoMessage = message;
    },
    setErrorMessage(state, message) {
        state.errorMessage = message;
    },
    clearInfoMessage(state) {
        state.infoMessage = new InfoMessageModel();
    },
    clearErrorMessage(state) {
        state.errorMessage = new ErrorMessageModel();
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

            await router.push('/');

        } catch (error) {
            commit('setLoginState', {isAuthenticated: false, authError: error.message});
        }
    },
    async telegram({commit}, payload) {
        try {
            await masterService.telegram(payload);

            await this.dispatch('master/initGetStarted');

            await router.push('/');

        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText(error.message));
        }
    },
    async saveTelegramFlag({}) {
        masterService.setTelegram();
    },
    async logout({commit}) {

        this.dispatch('webSocket/disconnectWebSocket');

        await masterService.logout();

        commit('clearAuthData');

        await router.push('/');
    },
    async register({commit}, credentials) {
        try {
            await masterService.register(credentials);

            await this.dispatch('master/initGetStarted');

            await router.push('/');

        } catch (error) {
            throw error;
        }
    },
    async sendCheckLoginAvailable({commit}, login) {
        try {
            const isAvailable = await masterService.sendCheckLoginAvailable(login);
            if (!isAvailable && login === state.master.getLogin()) {
                return true;
            }

            return isAvailable;
        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText(error.message));

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
                if (state.master != null) {
                    commit('updateMaster', {emailVerified: true})
                }
                return;
            }

        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText('Failed to verify email:', error.message));
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

            commit('setInfoMessage', ErrorMessageModel.withText(error.message));
        }
    },
    async updateMasterFromSocket({commit, state}, updatedData) {
        try {

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
            localStorage.setItem('selectedSkin', skinId);
            commit('updateMaster', {skin: skinId});
            await updateMasterToLocalDB({skin: skinId});
        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText(error.message));
        }
    },
    async setLanguage({commit, state}, language) {
        setLocaleLanguage(language);
        commit('updateMaster', { language });
        await updateMasterToLocalDB({ language });
        // Sync to backend silently — language is already saved locally
        try {
            await masterService.changeProfile({ language });
        } catch {
            // Ignore backend errors for language sync — locally already persisted
        }
    },
    async uploadMasterAvatar({commit}, {formData, onUploadProgress}) {
        try {
            const avatarUrl = await masterService.uploadAvatar(formData, onUploadProgress);

            commit('updateMaster', {avatarUrl});

            return avatarUrl;

        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText('Failed to upload avatar:', error.message));

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
    async sendShare({commit, state}) {
        try {
            const inviteId = state.master.inviteId;

            const inviteText = t.value.profile.invite.inviteText;

            const inviteLink = `https://t.me/share/url?url=https://t.me/hexlashbot?start=${inviteId}&text=${encodeURIComponent(inviteText)}`;

            window.open(inviteLink, '_blank');
        } catch (error) {
            commit('setInfoMessage', InfoMessageModel.withText(error.message));
        }
    }
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
