import { getClubByIdFromLocalAndAPI, updateClubDataOnAPI } from '@/core/services/clubService';
import ClubModel from '@/core/models/clubModel.js';

// Состояние модуля
const state = {
    selectedClub: null, // Выбранный клуб, это не обязательно мой клуб, просто тот который сейчас выбран
};

// Геттеры для получения данных из состояния
const getters = {
    // Геттер для получения выбранного клуба
    getSelectedClub: (state) => state.selectedClub,

    // Проверка, является ли выбранный клуб клубом текущего пользователя
    isMyClub: (state, getters, rootState) => state.selectedClub && rootState.user.selectedUser && state.selectedClub.id === rootState.user.selectedUser.clubId,
};

// Мутации для изменения состояния
const mutations = {
    // Установка выбранного клуба
    setSelectedClub: (state, clubModel) => {
        state.selectedClub = clubModel;
    },

    // Обновление данных выбранного клуба
    updateSelectedClub: (state, updatedData) => {
        if (state.selectedClub) {
            Object.assign(state.selectedClub, updatedData);
        }
    },
};

// Действия для асинхронных операций и бизнес-логики
const actions = {
    // Действие для получения данных клуба по ID
    async fetchClubById({ commit }, clubId) {
        try {
            const localData = await getClubByIdFromLocalAndAPI(clubId); // Получение данных клуба из локального хранилища и API
            if (localData) {
                commit('setSelectedClub', new ClubModel(localData)); // Коммит мутации для установки данных клуба в состояние
            } else {
                console.error('No club data found');
            }
        } catch (error) {
            console.error('Failed to fetch club data:', error);
        }
    },

    // Действие для обновления данных выбранного клуба
    async updateSelectedClub({ commit, state }, updatedData) {
        try {
            commit('updateSelectedClub', updatedData); // Обновление локального состояния

            await updateClubDataOnAPI(state.selectedClub); // Отправка обновленных данных на сервер
        } catch (error) {
            console.error('Failed to update club data:', error);
        }
    },

    // Действие для загрузки аватара для выбранного клуба
    async uploadAvatarForSelectedClub({ commit, state }, { avatarDataUrl, onUploadProgress }) {
        try {
            // Симуляция загрузки на сервер
            for (let i = 0; i <= 100; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                onUploadProgress({ loaded: i, total: 100 }); // Обновление прогресса загрузки
            }

            // После успешной симуляции загрузки обновляем аватар в стейте
            commit('updateSelectedClub', { avatarUrl: avatarDataUrl });

            await updateClubDataOnAPI(state.selectedClub); // Отправка обновленных данных на сервер
        } catch (error) {
            console.error('Failed to upload avatar:', error);
        }
    },

    // Действие для проверки, является ли текущий пользователь владельцем клуба
    async isOwner({ dispatch, getters, rootGetters }, clubId) {
        await dispatch('fetchClubById', clubId); // Получение данных клуба
        const club = state.selectedClub;
        return club && club.isOwner(rootGetters['master/getMaster'].userData.id); // Проверка, является ли пользователь владельцем клуба
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
