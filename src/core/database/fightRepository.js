import {initDB, FIGHTS_TABLE} from "@/core/database/idb.js";

export const getAllFightsFromLocalDB = async () => {
    const db = await initDB();
    const transaction = db.transaction(FIGHTS_TABLE, 'readonly');
    const tasksStore = transaction.objectStore(FIGHTS_TABLE);

    const fights = await tasksStore.getAll();

    await transaction.complete;

    if(fights) {
        return fights.map(fight => new FIGHTS_TABLE(fight));
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