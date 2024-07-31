import { openDB } from 'idb';
import {MasterModel} from "@/core/models/masterModel.js";

const DB_NAME = 'fightClubDB';
const DB_VERSION = 1;

export const MASTER_TABLE = 'master';
export const USERS_TABLE = 'users';
export const CLUBS_TABLE = 'clubs';

let dbPromise;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (oldVersion < 1) {
                    const masterStore = db.createObjectStore(MASTER_TABLE, { keyPath: 'id' });
                    const usersStore = db.createObjectStore(USERS_TABLE, { keyPath: 'id' });
                    usersStore.createIndex('login', 'login', { unique: true });

                    db.createObjectStore(CLUBS_TABLE, { keyPath: 'id' });
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

export const clearDatabase = async () => {
    const db = await initDB();
    const tx = db.transaction(['master'], 'readwrite');
    await Promise.all([
        tx.objectStore('master').clear(),
    ]);
    await tx.done;
};
