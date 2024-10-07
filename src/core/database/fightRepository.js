import {initDB, FIGHTS_TABLE} from "@/core/database/idb.js";
import {FightModel} from "@/core/models/fightModel.js";

export const getAllFightsFromLocalDB = async () => {
    const db = await initDB();
    const transaction = db.transaction(FIGHTS_TABLE, 'readonly');
    const tasksStore = transaction.objectStore(FIGHTS_TABLE);

    const fights = await tasksStore.getAll();

    await transaction.complete;

    if(fights) {
        return fights.map(fight => new FightModel(fight));
    }

    return null;
};

export const getFightByIdFromDB = async (id) => {
    const db = await initDB();
    const tx = db.transaction(FIGHTS_TABLE, 'readonly');
    const store = tx.objectStore(FIGHTS_TABLE);

    return await store.get(id);
};

export const saveFightDataToLocalDB = async (fightModel) => {
    const db = await initDB();
    await db.put(FIGHTS_TABLE, {...fightModel, id: fightModel.id});
};


export const updateFightToLocalDB = async (updatedData) => {
    const db = await initDB();
    const transaction = db.transaction(FIGHTS_TABLE, 'readwrite');
    const store = transaction.objectStore(FIGHTS_TABLE);

    // Получаем текущий объект из базы данных
    const currentData = await store.get(updatedData.id);

    if (currentData) {
        // Обновляем необходимые поля в объекте
        for (const [key, value] of Object.entries(updatedData)) {
            if (key in currentData) {
                currentData[key] = value;
            }
        }

        // Сохраняем обновленный объект обратно в базу данных
        await store.put(currentData);
    } else {
        // Если объекта нет, создаём новую запись
        await store.put(updatedData);
    }

    await transaction.complete;
};