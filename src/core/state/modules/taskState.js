import * as taskService from "@/core/services/taskService.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

const state = {
    socialTasks: [],
    dailyTasks: [],
    isLoadingSocialTasks: false, // Состояние загрузки социальных задач
    isLoadingDailyTasks: false,  // Состояние загрузки ежедневных задач
};

const getters = {
    getAllSocialTasks: (state) => {
        return state.socialTasks;
    },
    getAllDailyTasks: (state) => {
        return state.dailyTasks;
    },
    hasIncompleteSocialTasks: (state) => {
        return state.socialTasks.some(task => !task.isCompleted);
    },
    hasIncompleteDailyTasks: (state) => {
        return state.dailyTasks.some(task => !task.isCompleted);
    },
};

const mutations = {
    setIsLoadingSocialTasks(state, isLoading) {
        state.isLoadingSocialTasks = isLoading;
    },
    setIsLoadingDailyTasks(state, isLoading) {
        state.isLoadingDailyTasks = isLoading;
    },
    addSocialTask(state, task) {
        const index = state.socialTasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            // Обновляем существующую задачу
            state.socialTasks.splice(index, 1, task);
        } else {
            // Добавляем новую задачу
            state.socialTasks.push(task);
        }
    },
    addDailyTask(state, task) {
        const index = state.dailyTasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            // Обновляем существующую задачу
            state.dailyTasks.splice(index, 1, task);
        } else {
            // Добавляем новую задачу
            state.dailyTasks.push(task);
        }
    },
    setSocialTasks(state, tasks) {
        state.socialTasks = tasks;
    },
    setDailyTasks(state, tasks) {
        state.dailyTasks = tasks;
    },
};

const actions = {
    async fetchAllSocialTasks({commit, rootGetters}) {
        const language = rootGetters['master/getMaster'].language;

        commit('setIsLoadingSocialTasks', true);
        try {
            await taskService.getAllSocialTasksFromLocalAndAPI(language);
        } catch (error) {
            console.error('Error fetching social tasks:', error);
        } finally {
            commit('setIsLoadingSocialTasks', false);
        }
    },
    async fetchAllDailyTasks({commit, rootGetters}) {
        const language = rootGetters['master/getMaster'].language;

        commit('setIsLoadingDailyTasks', true);
        try {
            await taskService.getAllDailyTasksFromLocalAndAPI(language);
        } catch (error) {
            console.error('Error fetching daily tasks:', error);
        } finally {
            commit('setIsLoadingDailyTasks', false);
        }
    },
    async updateSocialTask({commit}, task) {
        try {
            await taskService.sendUpdateSocialTask(task);
            commit('addSocialTask', task);
        } catch (error) {
            console.error('Error updating social task:', error);
        }
    },
    async updateDailyTask({commit}, task) {
        try {
            await taskService.sendUpdateDailyTask(task);
            commit('addDailyTask', task);

        } catch (error) {
            console.error('Error updating daily tasks:', error);
        }
    },
    async receivedSocialTask({commit}, task) {
        try {
            await taskService.localUpdateSocialTask(task);
            commit('addSocialTask', task);

            if(task.isCompleted) {
                const info = InfoMessageModel.withTimeout(t.value.training.successCompleteTask, 5000);
                store.commit('master/setInfoMessage', info);
            }

        } catch (error) {
            console.error('Error updating social task:', error);
        }
    },
    async receivedDailyTask({commit}, task) {
        try {
            await taskService.localUpdateDailyTask(task);
            commit('addDailyTask', task);

            if(task.isCompleted) {
                const info = InfoMessageModel.withTimeout(t.value.training.successCompleteTask, 5000);
                store.commit('master/setInfoMessage', info);
            }

        } catch (error) {
            console.error('Error updating daily tasks:', error);
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
