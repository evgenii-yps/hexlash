import * as userService from "@/core/services/userService.js";

const state = {
    users: [], // Массив пользователей
};

const getters = {
    getUserByLogin: (state) => (login) => {
        return state.users.find(user => user.login === login);
    },
};

const mutations = {
    SetUser(state, user) {
        const index = state.users.findIndex(u => u.login === user.login);
        if (index !== -1) {
            // Обновляем существующего пользователя
            state.users.splice(index, 1, user);
        } else {
            // Добавляем нового пользователя
            state.users.push(user);
        }
    },
};

const actions = {
    async getUserByLogin({commit, getters}, userLogin) {
        let user = getters.getUserByLogin(userLogin);
        if (user) {
            return user;
        }
        try {
            user = await userService.getUserFromLocalAndAPI(userLogin);
            if (user) {
                commit('SetUser', user);
            }
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },
    async updateUser({commit}, user) {
        commit('SetUser', user);
    },

};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
