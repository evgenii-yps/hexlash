import {initDB, USERS_TABLE} from "@/core/database/idb.js";

export const getUserByLoginFromDB = async (login) => {
    const db = await initDB();
    const tx = db.transaction(USERS_TABLE, 'readonly');
    const store = tx.objectStore(USERS_TABLE);
    const index = store.index('login');
    return await index.get(login);
};

export const getUserByIdFromDB = async (id) => {
    const db = await initDB();
    const tx = db.transaction(USERS_TABLE, 'readonly');
    const store = tx.objectStore(USERS_TABLE);
    return await store.get(id);
};

export const saveUserDataToLocalDB = async (userModel) => {
    const db = await initDB();
    const tx = db.transaction(USERS_TABLE, 'readwrite');
    const store = tx.objectStore(USERS_TABLE);
    const index = store.index('login');

    // Проверяем, существует ли уже пользователь с таким логином
    const existingUser = await index.get(userModel.login);

    if (existingUser) {
        // Обновляем существующую запись
        await store.put({...existingUser, ...userModel, id: existingUser.id});
    } else {
        // Вставляем новую запись
        await store.put({...userModel, id: userModel.id});
    }
};