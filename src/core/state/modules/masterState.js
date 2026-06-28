import router from "@/router/index.js";
import {updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {LoginStateModel} from "@/core/models/internal/loginStateModel.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import * as masterService from "@/core/services/masterService.js";
import {ErrorMessageModel} from "@/core/models/internal/errorMessageModel.js";


const state = {
    master: null,
    jwtToken: masterService.getJwtToken(),
    loginState: new LoginStateModel(),
    infoMessage: new InfoMessageModel(),
    errorMessage: new ErrorMessageModel(),
};

const getters = {
    getMaster: (state) => state.master,
    getJwtToken: (state) => state.jwtToken,
    getLoginState: (state) => state.loginState,
    getInfoMessage(state) {
        return state.infoMessage;
    },
    getErrorMessage(state) {
        return state.errorMessage;
    }
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
                } else {
                    state.master.userData[key] = value;
                }
            }
        }
    },
    setLoginState: (state, authState) => {
        state.loginState = authState;
    },
    clearAuthData: (state) => {
        state.master = null;
        state.loginState = {isAuthenticated: false, authError: null};
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
};

const actions = {
    async initializeMasterData() {
        try {
            await masterService.initializeMasterData();
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    },
    async login({commit}, credentials) {
        try {
            await masterService.login(credentials);

            // Post-login landing → the player home (/play/home), not the marketing
            // root. Pushing straight here bypasses the '/' authed-redirect guard,
            // which is left untouched for users who open the landing directly.
            await router.push('/play/home');

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
    async register({commit}, credentials) {
        try {
            await masterService.register(credentials);

            // Email Auth Phase 5.5 — signup-with-email shows "Check your inbox"
            // success screen instead of immediate redirect. Caller passes
            // skipRedirect: true to opt out of auto-redirect; default behavior
            // (no-email signup) preserved.
            if (!credentials.skipRedirect) {
                // Post-registration landing → the player home (/play/home).
                await router.push('/play/home');
            }

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
    // Email Auth Phase 5 — verify email by token from email link.
    async verifyEmail({commit, state}, { token }) {
        try {
            const ok = await masterService.verifyEmail(token);
            if (ok) {
                if (state.master != null) {
                    commit('updateMaster', { emailVerified: true });
                }
                return;
            }
        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText('Failed to verify email:', error.message));
        }
        throw new Error('Failed to verify email');
    },

    // Email Auth Phase 5 — request password reset email.
    async requestPasswordReset({commit}, email) {
        return await masterService.forgotPassword(email);
    },

    // Email Auth Phase 5 — complete password reset + auto-login.
    async confirmPasswordReset({commit}, { token, newPassword }) {
        try {
            return await masterService.resetPassword(token, newPassword);
        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText(error.message));
            throw error;
        }
    },

    // Email Auth Phase 5 — request a fresh verify email (VerifyEmailBanner).
    async resendVerification({commit}) {
        const result = await masterService.resendVerification();
        if (!result.ok) {
            commit('setErrorMessage', ErrorMessageModel.withText(result.error || 'Failed to send verification email'));
        }
        return result;
    },

    async updateMaster({commit, state}, updatedData) {
        try {

            const response = await masterService.changeProfile(updatedData);

            commit('updateMaster', updatedData);

            await updateMasterToLocalDB(updatedData);

            return true;

        } catch (error) {

            commit('setInfoMessage', ErrorMessageModel.withText(error.message));
        }
    },
    async updateMasterFromSocket({commit, state}, updatedData) {
        try {

            commit('updateMaster', updatedData);

            await updateMasterToLocalDB(updatedData);

            return true;

        } catch (error) {
            commit('setInfoMessage', InfoMessageModel.withText(error.message));
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
    async deleteAccount({commit, state}) {
        try {

            this.dispatch('webSocket/disconnectWebSocket');

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
