import { openDB } from 'idb';

const DB_NAME = 'fightClubDB';
const DB_VERSION = 1;

const initDB = async () => {

    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Миграция с версии 0 до 1
            if (oldVersion < 1) {
                db.createObjectStore('currentUser', { keyPath: 'id' });
                db.createObjectStore('users', { keyPath: 'id' });
                db.createObjectStore('wallets', { keyPath: 'id' });
                db.createObjectStore('params', { keyPath: 'id' });
                db.createObjectStore('clubs', { keyPath: 'id' });
            }
            // Миграция с версии 1 до 2
            // if (oldVersion < 2) {
            //     const fightsStore = transaction.objectStore('fights');
            //     fightsStore.createIndex('date', 'date');
            //     // Другие изменения схемы данных
            // }
            // Добавляйте последующие миграции здесь
        },

    });

    return db;
};

export const getFromDB = async (storeName, id) => {
    const db = await initDB();
    return await db.get(storeName, id);
};

export const saveToDB = async (storeName, data) => {
    const db = await initDB();
    await db.put(storeName, data);
};

export const getAllFromDB = async (storeName) => {
    const db = await initDB();
    return await db.getAll(storeName);
};

export const deleteFromDB = async (storeName, id) => {
    const db = await initDB();
    await db.delete(storeName, id);
};

// Функция для очистки базы данных
export const clearDatabase = async () => {
    const db = await initDB();
    const tx = db.transaction(['currentUser', 'users', 'wallets', 'params', 'clubs'], 'readwrite');
    await Promise.all([
        tx.objectStore('currentUser').clear(),
        tx.objectStore('users').clear(),
        tx.objectStore('wallets').clear(),
        tx.objectStore('params').clear(),
        tx.objectStore('clubs').clear()
    ]);
    await tx.done;
};
