import { getCurrentUserFromLocalAndAPI } from '@/core/services/userService';
import UserModel from '@/core/models/user.js';

const state = {
    currentUser: null,
};

const getters = {
    getCurrentUser: (state) => state.currentUser
};

const mutations = {
    setUser: (state, userData) => {
        state.user = new UserModel(userData);
    }
};

const actions = {

    async fetchCurrentUser({ commit }) {
        try {
            const localData = await getCurrentUserFromLocalAndAPI();
            if (localData) {
                commit('setUser', localData);
            }

        } catch (error) {
            console.error('Failed to fetch user data:', error);
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
