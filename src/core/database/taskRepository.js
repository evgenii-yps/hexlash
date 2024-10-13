import {initDB, SOCIAL_TASKS_TABLE, DAILY_TASKS_TABLE} from "@/core/database/idb.js";
import {SocialTaskModel} from "@/core/models/socialTaskModel.js";
import {DailyTaskModel} from "@/core/models/dailyTaskModel.js";


/**
 * Получает все задачи из локальной базы данных (IndexedDB).
 *
 * @returns {Promise<Array>} Массив всех задач, хранящихся в базе данных.
 */
export const getAllSocialTasksFromLocalDB = async () => {
    const db = await initDB();
    const transaction = db.transaction(SOCIAL_TASKS_TABLE, 'readonly');
    const tasksStore = transaction.objectStore(SOCIAL_TASKS_TABLE);

    const tasks = await tasksStore.getAll();

    await transaction.complete;

    if(tasks) {
        return tasks.map(task => new SocialTaskModel(task));
    }
    return null;
};

/**
 * Сохраняет массив задач в локальную базу данных (IndexedDB).
 *
 * @param {Array} tasks - Массив задач для сохранения.
 * @returns {Promise<void>}
 */
export const saveSocialTasksToLocalDB = async (tasks) => {
    const db = await initDB();
    const transaction = db.transaction(SOCIAL_TASKS_TABLE, 'readwrite');
    const tasksStore = transaction.objectStore(SOCIAL_TASKS_TABLE);


    for (let task of tasks) {
        await tasksStore.put({ ...task, id: task.id });
    }

    await transaction.complete;
};

/**
 * Получает задачу из локальной базы данных (IndexedDB) по её идентификатору.
 *
 * @param {string|number} id - Идентификатор задачи.
 * @returns {Promise<Object|null>} Объект задачи, если она найдена, или null.
 */
export const getSocialTaskByIdFromLocalDB = async (id) => {
    const db = await initDB();
    const transaction = db.transaction(SOCIAL_TASKS_TABLE, 'readonly');
    const tasksStore = transaction.objectStore(SOCIAL_TASKS_TABLE);

    // Извлекаем задачу по её идентификатору
    const task = await tasksStore.get(id);

    // Завершаем транзакцию
    await transaction.complete;

    if (task) {
        return new SocialTaskModel(task);
    } else {
        return null;
    }
};


/**
 * Получает все ежедневные задачи из локальной базы данных (IndexedDB).
 *
 * @returns {Promise<Array>} Массив всех ежедневных задач, хранящихся в базе данных.
 */
export const getAllDailyTasksFromLocalDB = async () => {
    const db = await initDB();
    const transaction = db.transaction(DAILY_TASKS_TABLE, 'readonly');
    const tasksStore = transaction.objectStore(DAILY_TASKS_TABLE);

    const tasks = await tasksStore.getAll();

    await transaction.complete;

    if(tasks) {
        return tasks.map(task => new DailyTaskModel(task));
    }
    return null;
};

/**
 * Сохраняет массив ежедневных задач в локальную базу данных (IndexedDB).
 *
 * @param {Array} tasks - Массив задач для сохранения.
 * @returns {Promise<void>}
 */
export const saveDailyTasksToLocalDB = async (tasks) => {
    const db = await initDB();
    const transaction = db.transaction(DAILY_TASKS_TABLE, 'readwrite');
    const tasksStore = transaction.objectStore(DAILY_TASKS_TABLE);

    for (let task of tasks) {
        await tasksStore.put({ ...task, id: task.id });
    }

    await transaction.complete;
};

/**
 * Получает ежедневную задачу из локальной базы данных (IndexedDB) по её идентификатору.
 *
 * @param {string|number} id - Идентификатор задачи.
 * @returns {Promise<Object|null>} Объект задачи, если она найдена, или null.
 */
export const getDailyTaskByIdFromLocalDB = async (id) => {
    const db = await initDB();
    const transaction = db.transaction(DAILY_TASKS_TABLE, 'readonly');
    const tasksStore = transaction.objectStore(DAILY_TASKS_TABLE);

    // Извлекаем задачу по её идентификатору
    const task = await tasksStore.get(id);

    // Завершаем транзакцию
    await transaction.complete;

    if (task) {
        return new DailyTaskModel(task);
    } else {
        return null;
    }
};

/**
 * Удаляет задачи из локальной базы данных (IndexedDB), айди которых нет в массиве новых задач.
 *
 * @param {Array} newTasks - Массив задач, полученных с сервера.
 * @returns {Promise<void>}
 */
export const removeOldSocialTasksFromLocalDB = async (newTasks) => {
    const db = await initDB();
    const transaction = db.transaction(SOCIAL_TASKS_TABLE, 'readwrite');
    const tasksStore = transaction.objectStore(SOCIAL_TASKS_TABLE);

    // Получаем все текущие задачи
    const currentTasks = await tasksStore.getAll();

    // Извлекаем все id задач, пришедших с сервера
    const newTaskIds = newTasks.map(task => task.id);

    // Фильтруем задачи, которых нет среди новых задач
    const tasksToDelete = currentTasks.filter(task => !newTaskIds.includes(task.id));

    // Удаляем старые задачи
    for (let task of tasksToDelete) {
        await tasksStore.delete(task.id);
    }

    await transaction.complete;
};

/**
 * Удаляет ежедневные задачи из локальной базы данных (IndexedDB), айди которых нет в массиве новых задач.
 *
 * @param {Array} newTasks - Массив задач, полученных с сервера.
 * @returns {Promise<void>}
 */
export const removeOldDailyTasksFromLocalDB = async (newTasks) => {
    const db = await initDB();
    const transaction = db.transaction(DAILY_TASKS_TABLE, 'readwrite');
    const tasksStore = transaction.objectStore(DAILY_TASKS_TABLE);

    // Получаем все текущие задачи
    const currentTasks = await tasksStore.getAll();

    // Извлекаем все id задач, пришедших с сервера
    const newTaskIds = newTasks.map(task => task.id);

    // Фильтруем задачи, которых нет среди новых задач
    const tasksToDelete = currentTasks.filter(task => !newTaskIds.includes(task.id));

    // Удаляем старые задачи
    for (let task of tasksToDelete) {
        await tasksStore.delete(task.id);
    }

    await transaction.complete;
};

