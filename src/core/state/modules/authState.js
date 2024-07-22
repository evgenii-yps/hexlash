import { login as loginService } from '@/core/services/userService';
import UserModel from '@/core/models/userModel.js';

const state = {
    currentUser: null,
    authError: null,
    token: null,
};

const getters = {
    getCurrentUser: (state) => state.currentUser,
    getAuthError: (state) => state.authError,
    getToken: (state) => state.token,
};

const mutations = {
    setUser: (state, userData) => {
        state.currentUser = new UserModel(userData);
    },
    setAuthError: (state, error) => {
        state.authError = error;
    },
    setToken: (state, token) => {
        state.token = token;
    },
    clearAuthData: (state) => {
        state.currentUser = null;
        state.authError = null;
        state.token = null;
    },
};

const actions = {
    async login({ commit }, credentials) {
        try {
            const { token, user } = await loginService(credentials);
            commit('setUser', user);
            commit('setToken', token);
        } catch (error) {
            commit('setAuthError', error);
        }
    },
    logout({ commit }) {
        localStorage.removeItem('token');
        commit('clearAuthData');
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
