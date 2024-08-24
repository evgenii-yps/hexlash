import {initDB, PUNCH_LIMIT_TABLE} from "@/core/database/idb.js";
import {PunchInfoModel} from "@/core/models/punchInfoModel.js";

/**
 * Извлекает параметры лимита времени из локальной базы данных
 */
export const getPunchLimitsFromLocalDB = async () => {
    const db = await initDB();
    const transaction = db.transaction(PUNCH_LIMIT_TABLE, 'readonly');
    const limitsStore = transaction.objectStore(PUNCH_LIMIT_TABLE);

    const limitData = await limitsStore.get('limits');

    await transaction.complete;

    if (limitData) {
        return new PunchInfoModel(limitData);
    } else {
        return null;
    }
};

/**
 * Сохраняет параметры лимита времени в локальную базу данных
 */
export const savePunchLimitsToLocalDB = async (punchBatch) => {
    const db = await initDB();
    const transaction = db.transaction(PUNCH_LIMIT_TABLE, 'readwrite');
    const limitsStore = transaction.objectStore(PUNCH_LIMIT_TABLE);

    const limitData = {
        id: 'limits',  // используем фиксированный ID для хранения лимита времени
        ...punchBatch
    };

    await limitsStore.put(limitData);

    await transaction.complete;
};