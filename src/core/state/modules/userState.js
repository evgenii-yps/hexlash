import UserModel from '@/core/models/userModel.js';
import * as userService from "@/core/services/userService.js";

const state = {

};

const getters = {

};

const mutations = {

};

const actions = {
    async getUserByLogin({ commit, getters }, userLogin) {
        try {
            const userData = await userService.fetchUserByLogin(userLogin);
            return new UserModel(userData);

        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
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
