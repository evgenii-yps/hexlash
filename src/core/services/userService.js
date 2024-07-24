import apiClient from '@/core/api/apiClient.js';
import {clearDatabase, CLUBS_TABLE, getFromDB, initDB, USERS_TABLE} from '@/core/database/idb.js';
import UserModel from "@/core/models/userModel.js";
import {MASTER_TAG} from "@/core/services/masterService.js";


export const getUserDataFromLocalDB = async (userId) => {
    const data = await getFromDB(USERS_TABLE, userId);
    return data ? new UserModel(data) : null;
};

export const saveUserDataToLocalDB = async (userModel) => {
    const db = await initDB();
    await db.put(USERS_TABLE, {...userModel, id: userModel.id});
};


// Взять пользователя по ID
export const fetchUserById = async (userId) => {
    try {
        const response = await apiClient.get(`/users?id=${userId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch user data by ID');
    }
};

// Взять пользователя по Login
export const fetchUserByLogin = async (login) => {
    try {
        const response = await apiClient.get(`/users?login=${login}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch user data by login');
    }
};



