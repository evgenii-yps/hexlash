import { getCurrentUserFromLocalAndAPI } from '@/core/services/userService';
import UserModel from '@/core/models/user.js';
import {CurrentUserModel} from "@/core/models/currentUser.js";

const state = {
    currentUser: null,
};

const getters = {
    getCurrentUser: (state) => state.currentUser,
};

const mutations = {
    setUser: (state, userModel) => {
        state.currentUser = userModel;
    },
    updateUser: (state, updatedData) => {
        if (state.currentUser) {
            Object.assign(state.currentUser, updatedData);
        }
    },
};

const actions = {

    async fetchCurrentUser({ commit }) {
        try {
            const localData = await getCurrentUserFromLocalAndAPI();
            if (localData) {
                commit('setUser', new CurrentUserModel(localData));
            }else {
                //TODO temp
                commit('setUser', new CurrentUserModel());
            }

        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    },
    async updateCurrentUser({ commit, state }, updatedData) {
        try {
            // Обновление локального состояния
            commit('updateUser', updatedData);

            // Отправка обновленных данных на сервер
           // await updateUserOnAPI(state.currentUser);

        } catch (error) {
            console.error('Failed to update user data:', error);
        }
    },
    async uploadAvatar({ commit }, { avatarDataUrl, onUploadProgress }) {
        try {
            // Симуляция загрузки на сервер
            for (let i = 0; i <= 100; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                onUploadProgress({ loaded: i, total: 100 });
            }

            // После успешной симуляции загрузки обновляем аватар в стейте
            commit('updateUser', { avatar: avatarDataUrl });

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
