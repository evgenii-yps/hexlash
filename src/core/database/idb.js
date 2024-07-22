import { openDB } from 'idb';

const DB_NAME = 'fightClubDB';
const DB_VERSION = 1;

let dbPromise;

const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (oldVersion < 1) {
                    db.createObjectStore('currentUser', { keyPath: 'id' });
                    db.createObjectStore('users', { keyPath: 'id' });
                    db.createObjectStore('wallets', { keyPath: 'id' });
                    db.createObjectStore('params', { keyPath: 'id' });
                    db.createObjectStore('clubs', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
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
