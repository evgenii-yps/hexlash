import * as userService from "@/core/services/userService.js";

const state = {
    users: [], // Массив пользователей
    participantRatings: {
        items: [],
        limitReached: false,
        pageSize: 20,
    },
    // Guest profile state — used by /v2/user/:login (Sub-Epic 6B-3).
    // Tracks loading/error around getGuestUserByLogin action; the fetched
    // user itself is stored in `users` cache via setUser (existing path).
    loadingGuest: false,
    errorGuest: null,
};

const getters = {
    getUserByLogin: (state) => (login) => {
        return state.users.find(user => user.login === login);
    },
    getParticipantRatingsList: (state) => {
        return state.participantRatings.items;
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
    setLoadingGuest(state, loading) {
        state.loadingGuest = loading;
    },
    setErrorGuest(state, error) {
        state.errorGuest = error;
    },
};

const actions = {
    async updateUser({commit}, user) {
        commit('setUser', user);
    },
    /**
     * Fetch user by login for guest profile view (Sub-Epic 6B-3).
     * Wraps existing service path with explicit loading/error state tracking.
     * Result cached via setUser (existing `users` array); read in component
     * via getters.getUserByLogin(login).
     */
    async getGuestUserByLogin({commit}, userLogin) {
        commit('setLoadingGuest', true);
        commit('setErrorGuest', null);
        try {
            // Try local-first then network refresh (returns cached if present);
            // fall back to direct fetch if cache miss.
            let user = await userService.getUserByLoginFromLocalAndAPI(userLogin);
            if (!user) {
                user = await userService.fetchUserByLogin(userLogin);
            }
            if (user) {
                commit('setUser', user);
            }
            commit('setLoadingGuest', false);
            return user;
        } catch (error) {
            const status = error?.response?.status || 0;
            const message = error?.response?.data?.error || error?.message || 'Failed to fetch user';
            commit('setErrorGuest', { status, message });
            commit('setLoadingGuest', false);
            console.error('[user/getGuestUserByLogin]', userLogin, status, message);
            return null;
        }
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
