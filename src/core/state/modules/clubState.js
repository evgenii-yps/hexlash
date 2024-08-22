import {
    getClubByIdFromLocalAndAPI,
    updateClubDataOnAPI,
} from '@/core/services/clubService';

import ClubModel from "@/core/models/clubModel.js";
import store from "@/core/state/store.js";
import {COST_CREATE_CLUB} from "@/core/constants.js";
import {saveClubDataToLocalDB, updateClubToLocalDB} from "@/core/database/clubRepository.js";

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
    updateClub(state, updatedClubData) {
        const club = state.clubs.find(c => c.id === updatedClubData.id);
        if (club) {
            // Обновляем только необходимые данные клуба
            Object.assign(club, updatedClubData);
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

    async updateClubData({commit}, updatedClubData) {
        try {
            // Обновляем данные на сервере
            //await updateClubDataOnAPI(updatedClubData);

            await updateClubToLocalDB(updatedClubData);

            // Если успешно, обновляем данные в состоянии
            commit('updateClub', updatedClubData);
        } catch (error) {
            console.error('Failed to update club data:', error);
            throw error;
        }
    },

    async createClub({commit}, title, description) {
        try {

            //await createClubOnAPI(updatedClubData);

            const masterData = store.getters['master/getMaster'].userData;

            // TODO Get Model From API
            const newClubModel = new ClubModel({
                id: 'uid-' + Math.random().toString(36).substr(2, 9),
                name: title,
                description: description,
                avatarUrl: "",
                owner: masterData.id,
                balance: 0,
                battles: 0,
                wins: 0,
                isPublic: true,
                members: 0
            });

            await saveClubDataToLocalDB(newClubModel);

            // Если успешно, обновляем данные в состоянии
            commit('setClub', newClubModel);

            // Обновить в модели мастера текущий клуб
            await store.dispatch('master/updateMaster', {clubId: newClubModel.id, balance: masterData.balance - COST_CREATE_CLUB});

            // TODO перезагрузка данных, взятие нового баланса и группы текущей
            // Синхронизируем с сервером
            await store.dispatch('master/syncMaster');

            return newClubModel;

        } catch (error) {
            console.error('Failed to update club data:', error);
            throw error;
        }
    },

    // Действие для загрузки аватара для выбранного клуба
    async uploadClubAvatar({ commit }, { clubData, onUploadProgress }) {
        console.log("clubData");
        console.log(clubData);
        try {
            // Симуляция загрузки на сервер
            for (let i = 0; i <= 100; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                onUploadProgress({loaded: i, total: 100});
            }

            // TODO
            // После успешной симуляции загрузки обновляем аватар в стейте
            commit('updateClub', clubData);

            // await updateUserOnAPI(state.currentUser);
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
