import {initDB, MASTER_TABLE} from '@/core/database/idb.js';
import {MasterModel} from "@/core/models/masterModel.js";

export const MASTER_TAG = "MASTER_TAG";

/**
 * Получает данные MasterModel из локальной базы данных (IndexedDB).
 *
 * @returns {Promise<MasterModel|null>} Возвращает объект MasterModel, если данные существуют, или null.
 */
export const getMasterFromLocalDB = async () => {
    const db = await initDB(); // Инициализируем базу данных
    const transaction = db.transaction(MASTER_TABLE, 'readonly'); // Открываем транзакцию на чтение
    const store = transaction.objectStore(MASTER_TABLE); // Получаем объект хранилища

    // Извлекаем данные по идентификатору MASTER_TAG
    const data = await store.get(MASTER_TAG);

    await transaction.complete; // Завершаем транзакцию

    // Если данные найдены, возвращаем новый экземпляр MasterModel, иначе возвращаем null
    return data ? new MasterModel(data) : null;
};


/**
 * Сохраняет данные MasterModel в локальную базу данных (IndexedDB).
 *
 * @param {MasterModel} masterModel - Объект MasterModel, который нужно сохранить.
 * @returns {Promise<void>}
 */
export const saveMasterToLocalDB = async (masterModel) => {
    const db = await initDB();
    await db.put(MASTER_TABLE, {...masterModel, id: MASTER_TAG});
};

/**
 * Обновляет существующие данные MasterModel в локальной базе данных (IndexedDB).
 *
 * @param {Object} updatedData - Объект с новыми данными, которые нужно обновить.
 * @returns {Promise<void>}
 */
export const updateMasterToLocalDB = async (updatedData) => {
    const db = await initDB();
    const transaction = db.transaction(MASTER_TABLE, 'readwrite');
    const store = transaction.objectStore(MASTER_TABLE);

    // Получаем текущий объект из базы данных
    const currentData = await store.get(MASTER_TAG);

    if (currentData) {
        // Обновляем необходимые поля в объекте
        for (const [key, value] of Object.entries(updatedData)) {
            if (key in currentData) {
                currentData[key] = value;
            } else if (key in currentData.userData) {
                currentData.userData[key] = value;
            }
        }
        // Сохраняем обновленный объект обратно в базу данных
        await store.put(currentData);
    }

    await transaction.complete;
};
