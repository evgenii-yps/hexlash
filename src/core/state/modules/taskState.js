import * as taskService from "@/core/services/taskService.js";

const state = {
    socialTasks: [],
    dailyTasks: [],
    isLoadingSocialTasks: false, // Состояние загрузки социальных задач
    isLoadingDailyTasks: false,  // Состояние загрузки ежедневных задач
};

const getters = {
    getSocialTaskById: (state) => (id) => {
        return state.socialTasks.find(task => task.id === id);
    },
    getDailyTaskById: (state) => (id) => {
        return state.dailyTasks.find(task => task.id === id);
    },
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
    async fetchAllSocialTasks({commit}) {
        commit('setIsLoadingSocialTasks', true);
        try {
            await taskService.getAllSocialTasksFromLocalAndAPI();
        } catch (error) {
            console.error('Error fetching social tasks:', error);
        } finally {
            commit('setIsLoadingSocialTasks', false);
        }
    },
    async fetchAllDailyTasks({commit}) {
        commit('setIsLoadingDailyTasks', true);
        try {
            await taskService.getAllDailyTasksFromLocalAndAPI();
        } catch (error) {
            console.error('Error fetching daily tasks:', error);
        } finally {
            commit('setIsLoadingDailyTasks', false);
        }
    },
    async updateSocialTask({commit}, task) {
        try {
            await taskService.updateSocialTask(task);
            commit('addSocialTask', task);
        } catch (error) {
            console.error('Error updating social task:', error);
        }
    },
    async updateDailyTask({commit}, task) {
        try {
            await taskService.updateDailyTask(task);
            commit('addDailyTask', task);
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
