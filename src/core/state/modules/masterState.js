import router from "@/router/index.js";
import {updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {LoginStateModel} from "@/core/models/internal/loginStateModel.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {SignupStateModel} from "@/core/models/internal/signupStateModel.js";
import {t} from '@/locales/index.js';
import * as masterService from "@/core/services/masterService.js";
import {ErrorMessageModel} from "@/core/models/internal/errorMessageModel.js";
import {updateJwtToken} from "@/core/services/masterService.js";
import apiClient from "@/core/api/apiClient.js";
import * as guestService from "@/core/services/guestService.js";


const state = {
    master: null,
    jwtToken: masterService.getJwtToken(),
    loginState: new LoginStateModel(),
    signupState: new SignupStateModel(),
    infoMessage: new InfoMessageModel(),
    errorMessage: new ErrorMessageModel(),
    // Guest mode — ephemeral, localStorage-only, no DB/JWT. See guestService.js.
    isGuest: false,
    guestSession: null,
};

const getters = {
    getMaster: (state) => state.master,
    getJwtToken: (state) => state.jwtToken,
    getLoginState: (state) => state.loginState,
    getIsGuest: (state) => state.isGuest,
    getGuestSession: (state) => state.guestSession,
    getInfoMessage(state) {
        return state.infoMessage;
    },
    getErrorMessage(state) {
        return state.errorMessage;
    }
};

const mutations = {
    setMaster: (state, masterData) => {
        // Server skin takes priority; use localStorage only as fallback for new accounts
        if (masterData?.userData) {
            const savedSkin = localStorage.getItem('selectedSkin');
            if (!masterData.userData.skin && savedSkin) {
                masterData.userData.skin = savedSkin;
            } else if (masterData.userData.skin) {
                localStorage.setItem('selectedSkin', masterData.userData.skin);
            }
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
    // Guest mode mutations.
    setGuestSession(state, session) {
        state.guestSession = session;
        state.isGuest = true;
        state.master = guestService.buildGuestMaster(session);
    },
    updateGuestSession(state, patch) {
        if (!state.guestSession) return;
        state.guestSession = {...state.guestSession, ...patch};
    },
    // Clears the guest flag/session WITHOUT touching master — used when a guest
    // converts (login/register sets a real master right after).
    clearGuestFlag(state) {
        state.isGuest = false;
        state.guestSession = null;
    }
};

const actions = {
    async initializeMasterData({commit, dispatch, state}) {
        try {
            await masterService.initializeMasterData();
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
        // Guest restore — only when no real auth session was established above.
        // Survives page reload; lost on localStorage clear (ephemeral by design).
        if (!state.master && !state.loginState?.isAuthenticated) {
            dispatch('restoreGuestSession');
        }
    },
    async login({commit}, credentials) {
        try {
            await masterService.login(credentials);

            // Converting from guest — drop the ephemeral guest session.
            guestService.clearGuestSession();
            commit('clearGuestFlag');

            await this.dispatch('master/initGetStarted');

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
    async register({commit}, credentials) {
        try {
            await masterService.register(credentials);

            // Converting from guest — drop the ephemeral guest session.
            guestService.clearGuestSession();
            commit('clearGuestFlag');

            await this.dispatch('master/initGetStarted');

            // Email Auth Phase 5.5 — signup-with-email shows "Check your inbox"
            // success screen instead of immediate redirect. Caller passes
            // skipRedirect: true to opt out of auto-redirect; default behavior
            // (no-email signup) preserved.
            if (!credentials.skipRedirect) {
                await router.push('/');
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
    // Renamed from sendVerifyEmail (1b artifact). New shape: receives
    // { token } object (was: raw code). Backend POST /v1/user/verify-email
    // accepts { token } and is public (no JWT).
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
    // Always returns { ok: true } unless format error (400) — backend's
    // generic-200 design prevents email enumeration; caller displays
    // generic success message regardless of actual outcome.
    async requestPasswordReset({commit}, email) {
        return await masterService.forgotPassword(email);
    },

    // Email Auth Phase 5 — complete password reset + auto-login.
    // Service performs JWT save + master data fetch + auth state commits
    // (mirrors login action's post-success flow). Returns { ok: true } on
    // success, throws on failure (expired/invalid token).
    async confirmPasswordReset({commit}, { token, newPassword }) {
        try {
            return await masterService.resetPassword(token, newPassword);
        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText(error.message));
            throw error;
        }
    },

    // Email Auth Phase 5 — request a fresh verify email.
    // Used by VerifyEmailBanner "Resend" button. Auth-required (apiClient
    // adds JWT). Backend throttles 1/5min per user.
    async resendVerification({commit}) {
        const result = await masterService.resendVerification();
        if (!result.ok) {
            commit('setErrorMessage', ErrorMessageModel.withText(result.error || 'Failed to send verification email'));
        }
        return result;
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
    // Phase 1.5c — setLanguage action removed (English-only).
    // User.language backend column retired in legacy-cleanup Phase 10 Stage A.
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

            // Отправка обновленных данных на сервер
            const response = await masterService.deleteAccount();

            commit('clearAuthData');

            await router.push('/');

        } catch (error) {
            commit('setInfoMessage', InfoMessageModel.withText(error.message));
        }
    },
    // 5Q Phase 1 — Retirement actions. Backend (POST /user/retire) resolves
    // primaryModule server-side from user.progression — frontend posts empty
    // body. Per ТЗ §Decision: no caching state, no optimistic UI (retirement
    // irreversible). HUD-v2 convention via Vuex action wrappers (Lesson #32),
    // mirrors masterState factory pattern lineage from 5O P3 / 5P P2.
    async fetchRetirementStatus({commit}) {
        try {
            const {data: res} = await apiClient.get('/user/retirement-status', {authRequired: true});
            return res;
        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText(error?.response?.data?.error || error.message || 'Failed to load retirement status'));
            return null;
        }
    },
    async retire({commit}) {
        try {
            const {data: res} = await apiClient.post('/user/retire', {}, {authRequired: true});
            commit('setInfoMessage', InfoMessageModel.withText(res.message || t.value.club?.lblRetireSuccess || 'Retired!'));
            return true;
        } catch (error) {
            commit('setErrorMessage', ErrorMessageModel.withText(error?.response?.data?.error || error.message || 'Retirement failed'));
            return false;
        }
    },

    // ── Guest mode actions ─────────────────────────────────────────────────
    // Ephemeral, localStorage-only. No backend calls, no DB rows, no JWT.
    async loginAsGuest({commit}, {archetypeId}) {
        const session = guestService.createGuestSession(archetypeId);
        guestService.saveGuestSession(session);
        commit('setGuestSession', session);
        await router.push('/play');
    },
    // Boot restore (called from initializeMasterData when no real auth present).
    restoreGuestSession({commit}) {
        const session = guestService.loadGuestSession();
        if (session) {
            commit('setGuestSession', session);
            return true;
        }
        return false;
    },
    recordGuestWin({commit, state}) {
        if (!state.guestSession) return;
        commit('updateGuestSession', {
            wins: (state.guestSession.wins || 0) + 1,
            streak: (state.guestSession.streak || 0) + 1,
        });
        guestService.saveGuestSession(state.guestSession);
    },
    recordGuestLoss({commit, state}) {
        if (!state.guestSession) return;
        commit('updateGuestSession', {streak: 0});
        guestService.saveGuestSession(state.guestSession);
    },
    markGuestSignupPromptShown({commit, state}) {
        if (!state.guestSession) return;
        commit('updateGuestSession', {signupPromptShown: true});
        guestService.saveGuestSession(state.guestSession);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
