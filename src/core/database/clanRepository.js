// IndexedDB store name kept as 'clubs' for data compatibility, see #P1-migration
import {clearDatabase, CLANS_TABLE, initDB} from "@/core/database/idb.js";
import ClanModel from "@/core/models/clanModel.js";

export const getClanDataFromLocalDB = async (clanId) => {

    const db = await initDB();
    const transaction = db.transaction(CLANS_TABLE, 'readonly');
    const store = transaction.objectStore(CLANS_TABLE);

    const data = await store.get(clanId);

    await transaction.complete;

    return data ? new ClanModel(data) : null;

};

export const saveClanDataToLocalDB = async (clanModel) => {
    const db = await initDB();
    await db.put(CLANS_TABLE, {...clanModel, id: clanModel.id});
};

export const updateClanToLocalDB = async (updatedData) => {
    const db = await initDB();
    const transaction = db.transaction(CLANS_TABLE, 'readwrite');
    const store = transaction.objectStore(CLANS_TABLE);

    const currentData = await store.get(updatedData.id);

    if (currentData) {
        for (const [key, value] of Object.entries(updatedData)) {
            if (key in currentData) {
                currentData[key] = value;
            }
        }

        await store.put(currentData);
    }
    else {
        await store.put(updatedData);
    }

    await transaction.complete;
};

export const clearClanDataFromLocalDB = async (clanId) => {
    await clearDatabase(CLANS_TABLE, clanId);
};
