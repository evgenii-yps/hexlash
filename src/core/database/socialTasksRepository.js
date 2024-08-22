import {initDB, SOCIAL_TASKS_TABLE} from "@/core/database/idb.js";


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

    return tasks;
};

/**
 * Сохраняет массив задач в локальную базу данных (IndexedDB).
 *
 * @param {Array} tasks - Массив задач для сохранения.
 * @returns {Promise<void>}
 */
export const saveTasksToLocalDB = async (tasks) => {
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
export const getTaskByIdFromLocalDB = async (id) => {
    const db = await initDB();
    const transaction = db.transaction(SOCIAL_TASKS_TABLE, 'readonly');
    const tasksStore = transaction.objectStore(SOCIAL_TASKS_TABLE);

    // Извлекаем задачу по её идентификатору
    const task = await tasksStore.get(id);

    // Завершаем транзакцию
    await transaction.complete;

    return task;
};