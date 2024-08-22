import { openDB } from 'idb';
import {MasterModel} from "@/core/models/masterModel.js";

const DB_NAME = 'fightClubDB';
const DB_VERSION = 1;

export const MASTER_TABLE = 'master';
export const USERS_TABLE = 'users';
export const CLUBS_TABLE = 'clubs';
export const SOCIAL_TASKS_TABLE = 'social_tasks';
export const DAILY_TASKS_TABLE = 'daily_tasks';

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
                    db.createObjectStore(SOCIAL_TASKS_TABLE, { keyPath: 'id' });
                    db.createObjectStore(DAILY_TASKS_TABLE, { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};


export const clearDatabase = async () => {
    const db = await initDB();
    const tx = db.transaction([MASTER_TABLE], 'readwrite');
    const tx2 = db.transaction([SOCIAL_TASKS_TABLE], 'readwrite');
    await Promise.all([
        tx.objectStore(MASTER_TABLE).clear(),
        tx2.objectStore(SOCIAL_TASKS_TABLE).clear(),
    ]);
    await tx.done;
};
