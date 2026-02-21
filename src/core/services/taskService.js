import {
    getAllDailyTasksFromLocalDB,
    getAllSocialTasksFromLocalDB, removeOldDailyTasksFromLocalDB, removeOldSocialTasksFromLocalDB,
    saveDailyTasksToLocalDB,
    saveSocialTasksToLocalDB
} from "@/core/database/taskRepository.js";

import store from "@/core/state/store.js";
import {SocialTaskModel} from "@/core/models/socialTaskModel.js";
import {DailyTaskModel} from "@/core/models/dailyTaskModel.js";
import apiClient from "@/core/api/apiClient.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {isMockMode} from "@/core/mock/mockData.js";


export const getAllSocialTasksFromLocalAndAPI = async (language) => {
    // Сначала берем данные из локальной базы данных
    let socialTasks = await getAllSocialTasksFromLocalDB();
    if (socialTasks) {
        store.commit('task/setSocialTasks', socialTasks);
    }
    getSocialTasksFromAPI(language);
    return socialTasks;
};

export const getSocialTasksFromAPI = (language) => {
    // Асинхронно обновляем данные из API
    fetchAllSocialTasks(language).then(async (loadedTasks) => {
        await removeOldSocialTasksFromLocalDB(loadedTasks);
        await saveSocialTasksToLocalDB(loadedTasks);
        store.commit('task/setSocialTasks', loadedTasks);
    }).catch((error) => {
        console.error('Failed to fetch tasks data from API:', error);
    });
};

export const fetchAllSocialTasks = async (language = 'en') => {
    if (isMockMode()) {
        return [];
    }

    try {
        const response = await apiClient.get(`/task/social/${language}`, {
            authRequired: true,
        });
        return response.data.map(task => SocialTaskModel.fromJSON(task));
    } catch (error) {
        throw new Error('Failed to fetch social tasks from server');
    }
};


export const getAllDailyTasksFromLocalAndAPI = async (language) => {
    // Сначала берем данные из локальной базы данных
    let dailyTasks = await getAllDailyTasksFromLocalDB();
    if (dailyTasks) {
        store.commit('task/setDailyTasks', dailyTasks);
    }
    getDailyTasksFromAPI(language);
    return dailyTasks;
};

export const getDailyTasksFromAPI = (language) => {
    // Асинхронно обновляем данные из API
    fetchAllDailyTasks(language).then(async (loadedTasks) => {
        await removeOldDailyTasksFromLocalDB(loadedTasks);
        await saveDailyTasksToLocalDB(loadedTasks);
        store.commit('task/setDailyTasks', loadedTasks);
    }).catch((error) => {
        console.error('Failed to fetch daily tasks data from API:', error);
    });
};

export const fetchAllDailyTasks = async (language = 'en') => {
    if (isMockMode()) {
        return [];
    }

    try {
        const response = await apiClient.get(`/task/daily/${language}`, {
            authRequired: true,
        });
        return response.data.map(task => DailyTaskModel.fromJSON(task));
    } catch (error) {
        throw new Error('Failed to fetch daily tasks from server');
    }
};

export const sendUpdateSocialTask = async (updatedTask) => {
    try {
        await completeTaskApiCall(updatedTask.id);

        await saveSocialTasksToLocalDB([updatedTask]);

    } catch (error) {
        console.error('Failed to update social task:', error);
    }
};

export const sendUpdateDailyTask = async (updatedTask) => {
    try {
        await completeTaskApiCall(updatedTask.id);

        await saveDailyTasksToLocalDB([updatedTask]);
    } catch (error) {
        console.error('Failed to update daily task:', error);
    }
};

export const localUpdateSocialTask = async (updatedTask) => {
    try {
        await saveSocialTasksToLocalDB([updatedTask]);
    } catch (error) {
        console.error('Failed to update social task:', error);
    }
};

export const localUpdateDailyTask = async (updatedTask) => {
    try {
        await saveDailyTasksToLocalDB([updatedTask]);
    } catch (error) {
        console.error('Failed to update daily task:', error);
    }
};

const completeTaskApiCall = async (taskId) => {
    if (isMockMode()) {
        console.log('[MOCK] Task completed:', taskId);
        return true;
    }

    const response = await apiClient.post(`/task/complete/${taskId}`,
        {},
        {authRequired: true}
    );

    if (!response.data) {
        const error = 'Failed to complete task ' + (response?.data?.error || '');
        store.commit('master/setInfoMessage',
            InfoMessageModel.withTimeout(error, 2000));
        throw new Error(error);
    }

    return response.data;
};
