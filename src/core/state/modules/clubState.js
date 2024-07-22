import { getClubByIdFromLocalAndAPI, updateClubDataOnAPI } from '@/core/services/clubService';
import ClubModel from '@/core/models/clubModel.js';

const state = {
    selectedClub: null, // Выбранный клуб
};

const getters = {
    getSelectedClub: (state) => state.selectedClub,
    isMyClub: (state, getters, rootState) => state.selectedClub && rootState.user.currentUser && state.selectedClub.id === rootState.user.currentUser.clubId,
};

const mutations = {
    setSelectedClub: (state, clubModel) => {
        state.selectedClub = clubModel;
    },
    updateSelectedClub: (state, updatedData) => {
        if (state.selectedClub) {
            Object.assign(state.selectedClub, updatedData);
        }
    },
};

const actions = {
    async fetchClubById({ commit }, clubId) {
        try {
            const localData = await getClubByIdFromLocalAndAPI(clubId);
            if (localData) {
                commit('setSelectedClub', new ClubModel(localData));
            } else {
                console.error('No club data found');
            }
        } catch (error) {
            console.error('Failed to fetch club data:', error);
        }
    },
    async updateSelectedClub({ commit, state }, updatedData) {
        try {
            // Обновление локального состояния
            commit('updateSelectedClub', updatedData);

            // Отправка обновленных данных на сервер
            await updateClubDataOnAPI(state.selectedClub);
        } catch (error) {
            console.error('Failed to update club data:', error);
        }
    },
    async uploadAvatarForSelectedClub({ commit, state }, { avatarDataUrl, onUploadProgress }) {
        try {
            // Симуляция загрузки на сервер
            for (let i = 0; i <= 100; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                onUploadProgress({ loaded: i, total: 100 });
            }

            // После успешной симуляции загрузки обновляем аватар в стейте
            commit('updateSelectedClub', { avatarUrl: avatarDataUrl });

            await updateClubDataOnAPI(state.selectedClub);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
        }
    },
    async isOwner({ dispatch, getters, rootGetters }, clubId) {
        await dispatch('fetchClubById', clubId);
        const club = state.selectedClub;
        return club && String(club.owner) === String(rootGetters['user/getCurrentUser'].id);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
