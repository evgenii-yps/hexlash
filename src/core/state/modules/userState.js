import * as userService from "@/core/services/userService.js";

const state = {
    users: [], // Массив пользователей
    participantRatings: {
        items: [],
        limitReached: false,
        pageSize: 20,
    },
};

const getters = {
    getUserByLogin: (state) => (login) => {
        return state.users.find(user => user.login === login);
    },
    getUserById: (state) => (userId) => {
        return state.users.find(user => user.id === userId);
    },
    getParticipantRatingsList: (state) => {
        return state.participantRatings.items;
    },
    isLimitReached: (state) => {
        return state.participantRatings.limitReached;
    },
};

const mutations = {
    setUser(state, user) {
        const index = state.users.findIndex(u => u.login === user.login);
        if (index !== -1) {
            // Обновляем существующего пользователя
            state.users.splice(index, 1, user);
        } else {
            // Добавляем нового пользователя
            state.users.push(user);
        }
    },
    setParticipantRatings(state, participants) {
        state.participantRatings.items.push(...participants);
    },
    resetParticipantRatings(state) {
        state.participantRatings.items = [];
        state.participantRatings.limitReached = false;
    },
    updateParticipantRatingsState(state, { field, value }) {
        if (state.participantRatings.hasOwnProperty(field)) {
            state.participantRatings[field] = value;
        }
    },
};

const actions = {
    async getUserByLogin({commit, getters}, userLogin) {
        let user = getters.getUserByLogin(userLogin);

        try {
            user = await userService.getUserByLoginFromLocalAndAPI(userLogin);
            if (user) {
                commit('setUser', user);
            }else{
                // Пользователя нет совсем, нужно загрузить и подождать
                user = await userService.fetchUserByLogin(userLogin);
            }
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
            //throw error;
        }

        if (user) {
            return user;
        }
    },
    async getUserById({commit, getters}, userId) {
        let user = getters.getUserById(userId);

        try {
            user = await userService.getUserByIdFromLocalAndAPI(userId);
            if (user) {
                commit('setUser', user);
            }else{
                // Пользователя нет совсем, нужно загрузить и подождать
                user = await userService.fetchUserById(userId);
            }
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
            //throw error;
        }

        if (user) {
            return user;
        }
    },
    async updateUser({commit}, user) {
        commit('setUser', user);
    },
    async loadParticipantRatings({ commit, state }, { search, sortBy, page, clanId }) {
        const newResult = await userService.searchParticipants({
            name: search,
            sortBy: sortBy,
            page: page,
            size: state.participantRatings.pageSize,
            clanId: clanId,
        });

        commit('setParticipantRatings', newResult);

        if (newResult.length < state.participantRatings.pageSize) {
            commit('updateParticipantRatingsState', { field: 'limitReached', value: true });
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
