import {getClubByIdFromLocalAndAPI, updateClubDataOnAPI} from '@/core/services/clubService';

// Состояние модуля
const state = {
    clubs: [],
};

// Геттеры для получения данных из состояния
const getters = {
    // Геттер для получения выбранного клуба
    getClubById: (state) => (clubId) => {
        return state.clubs.find(club => club.id === clubId);
    },
};

// Мутации для изменения состояния
const mutations = {
    setClub(state, club) {
        const index = state.clubs.findIndex(c => c.id === c.id);
        if (index !== -1) {
            // Обновляем существующий клуб
            state.clubs.splice(index, 1, club);
        } else {
            // Добавляем новый клуб
            state.clubs.push(club);
        }
    },
};

// Действия для асинхронных операций и бизнес-логики
const actions = {
    async getClubById({commit, getters}, clubId) {
        let club = getters.getClubById(clubId);
        if (club) {
            return club;
        }
        try {
            club = await getClubByIdFromLocalAndAPI(clubId);
            if (club) {
                commit('setClub', club);
            }
            return club;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },


    // Действие для загрузки аватара для выбранного клуба
    async uploadAvatarForSelectedClub({commit, state}, {avatarDataUrl, onUploadProgress}) {
        try {
            // Симуляция загрузки на сервер
            for (let i = 0; i <= 100; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                onUploadProgress({loaded: i, total: 100}); // Обновление прогресса загрузки
            }

            // После успешной симуляции загрузки обновляем аватар в стейте
            commit('updateSelectedClub', {avatarUrl: avatarDataUrl});

            await updateClubDataOnAPI(state.selectedClub); // Отправка обновленных данных на сервер
        } catch (error) {
            console.error('Failed to upload avatar:', error);
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
