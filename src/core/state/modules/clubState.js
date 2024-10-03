import {
    fetchClubData,
    getClubByIdFromLocalAndAPI,
    updateClubDataOnAPI,
} from '@/core/services/clubService';

import store from "@/core/state/store.js";
import {updateClubToLocalDB} from "@/core/database/clubRepository.js";
import * as clubService from "@/core/services/clubService.js";

const state = {
    clubs: [],
    clubRatings: {
        items: [],
        limitReached: false,
        pageSize: 20,
    },
};

const getters = {
    getClubById: (state) => (clubId) => {
        return state.clubs.find(club => club.id === clubId);
    },
    getClubRatingsList: (state) => {
        return state.clubRatings.items;
    },
    isLimitReached: (state) => {
        return state.clubRatings.limitReached;
    },
};

const mutations = {
    setClub(state, club) {
        const index = state.clubs.findIndex(c => c.id === club.id);
        if (index !== -1) {
            state.clubs.splice(index, 1, club);
        } else {
            state.clubs.push(club);
        }
    },
    updateClub(state, updatedClubData) {
        const club = state.clubs.find(c => c.id === updatedClubData.id);
        if (club) {
            // Обновляем только необходимые данные клуба
            Object.assign(club, updatedClubData);
        }
    },
    setClubRatings(state, clubs) {
        state.clubRatings.items.push(...clubs);
    },
    resetClubRatings(state) {
        state.clubRatings.items = [];
        state.clubRatings.limitReached = false;
    },
    updateClubRatingsState(state, { field, value }) {
        if (state.clubRatings.hasOwnProperty(field)) {
            state.clubRatings[field] = value;
        }
    },
};


const actions = {
    async getClubById({commit, getters}, clubId) {
        let club = getters.getClubById(clubId);

        if (club) {
            return club;
        }
        try {
            club = await fetchClubData(clubId);
            if (club) {
                commit('setClub', club);
            }
            return club;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },
    async loadClubById({commit, getters}, clubId) {
        try {
            const club = await getClubByIdFromLocalAndAPI(clubId);
            if (club) {
                commit('setClub', club);
            }
            return club;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },
    async updateClubData({commit}, updatedClubData) {
        try {
            // Обновляем данные на сервере
            await updateClubDataOnAPI(updatedClubData);

            await updateClubToLocalDB(updatedClubData);

            // Если успешно, обновляем данные в состоянии
            commit('updateClub', updatedClubData);
        } catch (error) {
            console.error('Failed to update club data:', error);
            throw error;
        }
    },
    async createClub({commit}, newClubData) {
        try {

            const newClubModel = await clubService.createClub(newClubData);

            await store.dispatch('master/updateMaster', {clubId: newClubModel.id});

            return newClubModel;

        } catch (error) {
            console.error('Failed to update club data:', error);
            throw error;
        }
    },
    // Действие для загрузки аватара для выбранного клуба
    async uploadClubAvatar({ commit }, { formData, onUploadProgress }) {
        try {
            const avatarUrl = await clubService.uploadClubAvatar(formData, onUploadProgress);

            // После успешной симуляции загрузки обновляем аватар в стейте
            commit('updateClub', { avatarUrl });

            return avatarUrl;
        } catch (error) {
            console.error('Failed to upload avatar:', error);
        }
    },
    async loadClubRatings({ commit, state }, { search, sortBy, page }) {

        console.log(page);
        const newClubs = await clubService.searchClubs({
            name: search,
            sortBy: sortBy,
            page: page,
            size: state.clubRatings.pageSize,
        });

        if (newClubs.length < state.clubRatings.pageSize) {
            commit('updateClubRatingsState', { field: 'limitReached', value: true });
        }

        commit('setClubRatings', newClubs);

    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
