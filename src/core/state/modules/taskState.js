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
    // 5K — partial update for daily task progress (training scope live increments via POST /daily/:id/progress)
    updateDailyTaskProgress(state, { taskId, progress, isCompleted }) {
        const task = state.dailyTasks.find(t => t.id === taskId);
        if (task) {
            task.progress = progress;
            if (isCompleted) task.isCompleted = true;
        }
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
            await taskService.sendUpdateSocialTask(task);
            commit('addSocialTask', task);
        } catch (error) {
            console.error('Error updating social task:', error);
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
    // 5K — increment training-scope daily task progress (called from useClickToHit + session timer)
    // kind ∈ { 'tap', 'combo', 'energy_full', 'session_time', 'earn_taps_threshold' }
    // Silent fail per Q6 — backend down does NOT break UI (HudTraining falls back to trState)
    async incrementDailyProgress({commit, state}, { kind, amount = 1 }) {
        const categoryByKind = {
            tap: 'HIT_BAG_X_TIMES',
            combo: 'LAND_X_COMBOS',
            energy_full: 'SPEND_FULL_ENERGY',
            session_time: 'TRAIN_X_MINUTES',
            earn_taps_threshold: 'EARN_X_TAPS',
        };
        const category = categoryByKind[kind];
        if (!category) return;

        const task = state.dailyTasks.find(
            t => t.category === category && t.scope === 'training' && !t.isCompleted
        );
        if (!task) return; // task missing (not loaded yet, already completed today, or scope filter)

        try {
            const result = await taskService.incrementDailyProgress(task.id, amount);
            if (!result) return; // mock mode returns null

            commit('updateDailyTaskProgress', {
                taskId: task.id,
                progress: result.progress,
                isCompleted: result.isCompleted,
            });

            if (result.isCompleted && result.rewardGranted > 0) {
                store.commit('master/increaseBalance', { add: result.rewardGranted });
                const info = InfoMessageModel.withTimeout(t.value.training.successCompleteTask, 5000);
                store.commit('master/setInfoMessage', info);
            }
        } catch (error) {
            console.error('[task/incrementDailyProgress] failed:', error);
            // Silent — UI continues с trState fallback (Q6)
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
