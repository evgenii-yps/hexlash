import {
    getAllDailyTasksFromLocalDB,
    getAllSocialTasksFromLocalDB,
    saveDailyTasksToLocalDB,
    saveSocialTasksToLocalDB
} from "@/core/database/taskRepository.js";

import store from "@/core/state/store.js";
import {SocialTaskModel} from "@/core/models/socialTaskModel.js";
import {DailyTaskModel} from "@/core/models/dailyTaskModel.js";

const testSocialTasks = [
    {
        "id": 1,
        "title": "Confirm Email",
        "description": "Confirm",
        "link": "/profile/account",
        "tokens": 10,
        "isCompleted": false,
        "category": "email"
    },
    {
        "id": 2,
        "title": "Subscribe",
        "description": "Subscribe",
        "link": "https://telegram.org",
        "tokens": 10,
        "isCompleted": false,
        "category": "telegram"
    },
    {
        "id": 3,
        "title": "Subscribe",
        "description": "Subscribe",
        "link": "https://x.com",
        "tokens": 20,
        "isCompleted": false,
        "category": "x"
    },
    {
        "id": 4,
        "title": "Subscribe",
        "description": "Subscribe",
        "link": "https://youtube.com",
        "tokens": 10,
        "isCompleted": false,
        "category": "youtube"
    },
    {
        "id": 5,
        "title": "Subscribe",
        "description": "Subscribe",
        "link": "https://discord.com",
        "tokens": 10,
        "isCompleted": false,
        "category": "discord"
    },
    {
        "id": 6,
        "title": "Subscribe",
        "description": "Subscribe",
        "link": "https://instagram.com",
        "tokens": 20,
        "isCompleted": false,
        "category": "instagram"
    }
];

const testDailyTasks = [
    {
        id: 1,
        description: 'Репост сообщения',
        tokens: 5,
        isCompleted: false,
        link: "https://instagram.com",
        category: 'social_media'
    },
    {
        id: 2,
        description: 'Комментарий в социальной сети',
        tokens: 3,
        link: "https://instagram.com",
        isCompleted: false,
        category: 'social_media'
    },
    {
        id: 3,
        description: 'Сделать 1000 ударов груши',
        value: 1000,
        tokens: 7,
        isCompleted: false,
        category: 'punch_bag_x_minutes'
    },
    {id: 4, description: 'Провести 5 боев', value: 5, tokens: 10, isCompleted: false, category: 'fight_x_battles'},
];

const fetchAllSocialTasks = async () => {
    try {
        // Добавляем задержку в 1 секунду для симуляции вызова API
        await new Promise(resolve => setTimeout(resolve, 2000));

        return testSocialTasks ?? [];
    } catch (error) {
        throw new Error('Failed to fetch social task data by id');
    }
};

const fetchSocialTaskById = async (id) => {
    try {
        // Добавляем задержку в 1 секунду для симуляции вызова API
        await new Promise(resolve => setTimeout(resolve, 1000));

        const task = testSocialTasks.find(t => t.id === id);
        if (task) {
            return new SocialTaskModel(task);
        } else {
            return null;
        }
    } catch (error) {
        throw new Error('Failed to fetch social task data by id');
    }
};

const fetchAllDailyTasks = async () => {
    try {
        // Добавляем задержку в 1 секунду для симуляции вызова API
        await new Promise(resolve => setTimeout(resolve, 1000));

        return testDailyTasks ?? [];
    } catch (error) {
        throw new Error('Failed to fetch social task data by id');
    }
};

const fetchDailyTaskById = async (id) => {
    try {
        // Добавляем задержку в 1 секунду для симуляции вызова API
        await new Promise(resolve => setTimeout(resolve, 1000));

        const task = testDailyTasks.find(t => t.id === id);
        if (task) {
            return new DailyTaskModel(task);
        } else {
            return null;
        }
    } catch (error) {
        throw new Error('Failed to fetch daily task data by id');
    }
};

export const getAllSocialTasksFromLocalAndAPI = async () => {
    let localData;
    try {
        // Сначала берем данные из локальной базы данных
        localData = await getAllSocialTasksFromLocalDB();
    } catch (error) {
        console.error('Failed to fetch local social tasks:', error);
    }

    // Возвращаем локальные данные, если они есть
    if (localData && localData.length > 0) {
        // Асинхронно обновляем данные из API
        fetchAllSocialTasks().then(async (loadedTasks) => {
            await saveSocialTasksToLocalDB(loadedTasks);
            store.commit('task/setSocialTasks', loadedTasks);
        }).catch((error) => {
            console.error('Failed to fetch social task data from API:', error);
        });

        store.commit('task/setSocialTasks', localData);

    } else {
        // Если данных нет в локальной базе, ждем данных от API
        try {
            const loadedSocialTasks = await fetchAllSocialTasks();
            if (loadedSocialTasks) {
                await saveSocialTasksToLocalDB(loadedSocialTasks);
                store.commit('task/setSocialTasks', loadedSocialTasks);
            }
        } catch (error) {
            console.error('Failed to fetch social task data:', error);
            return [];
        }
    }
};

export const updateSocialTask = async (updatedTask) => {
    try {

        /*
        await fetch('/api/social-tasks/' + updatedTask.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTask),
        });
        */

        // Обновляем локальную базу данных
        await saveSocialTasksToLocalDB([updatedTask]);

    } catch (error) {
        console.error('Failed to update social task:', error);
    }
};

export const updateDailyTask = async (updatedTask) => {
    try {

        /*
        await fetch('/api/daily-tasks/' + updatedTask.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTask),
        });
        */

        // Обновляем локальную базу данных
        await saveDailyTasksToLocalDB([updatedTask]);
    } catch (error) {
        console.error('Failed to update daily task:', error);
    }
};


export const getAllDailyTasksFromLocalAndAPI = async () => {
    let localData;
    try {
        // Сначала берем данные из локальной базы данных
        localData = await getAllDailyTasksFromLocalDB();
    } catch (error) {
        console.error('Failed to fetch local daily tasks:', error);
    }

    // Возвращаем локальные данные, если они есть
    if (localData && localData.length > 0) {
        // Асинхронно обновляем данные из API
        fetchAllDailyTasks().then(async (loadedTasks) => {
            await saveDailyTasksToLocalDB(loadedTasks);
            store.commit('task/setDailyTasks', loadedTasks);
        }).catch((error) => {
            console.error('Failed to fetch social task data from API:', error);
        });

        store.commit('task/setDailyTasks', localData);

    } else {
        // Если данных нет в локальной базе, ждем данных от API
        try {
            const loadedDailyTasks = await fetchAllDailyTasks();
            if (loadedDailyTasks) {
                await saveDailyTasksToLocalDB(loadedDailyTasks);
                store.commit('task/setDailyTasks', loadedDailyTasks);
            }
        } catch (error) {
            console.error('Failed to fetch social task data:', error);
            return [];
        }
    }
};
