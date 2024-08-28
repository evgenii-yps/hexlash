import {initDB, USERS_TABLE} from "@/core/database/idb.js";

export const getUserByLoginFromDB = async (login) => {
    const db = await initDB();
    const tx = db.transaction(USERS_TABLE, 'readonly');
    const store = tx.objectStore(USERS_TABLE);
    const index = store.index('login');
    return await index.get(login);
};

export const saveUserDataToLocalDB = async (userModel) => {
    const db = await initDB();
    await db.put(USERS_TABLE, {...userModel, id: userModel.id});
};