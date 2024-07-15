import apiClient from '@/core/api/apiClient.js';
import { getFromDB, saveToDB } from '@/core/database/idb.js';
import UserModel from "@/core/models/user.js";


export const getCurrentUserDataFromLocalDB = async () => {
    const data = await getFromDB('currentUser', 'currentUser');
    return data ? new UserModel(data) : null;
};

export const saveCurrentUserDataToLocalDB = async (userData) => {
    const userModel = new UserModel(userData);
    await saveToDB('currentUser', { ...userModel, id: 'currentUser' });
};

export const getCurrentUserFromLocalAndAPI = async () => {
    // Сначала берем данные из локальной базы данных
    const localData = await getCurrentUserDataFromLocalDB();

    // Асинхронно обновляем данные из API
    fetchMeData().then(async (apiData) => {
        const apiUserModel = new UserModel(apiData);
        await saveCurrentUserDataToLocalDB(apiUserModel);
        return apiUserModel;
    }).catch((error) => {
        console.error('Failed to fetch user data from API:', error);
    });

    return localData;
};


// Метод логина
export const login = async (credentials) => {
    try {
        const response = await apiClient.post('/auth/login', credentials);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to login');
        }

        const { token, user } = response.data;

        // Преобразуем данные пользователя в модель
        const userModel = new UserModel(user);

        // Сохраняем данные пользователя в локальную базу данных
        await saveCurrentUserDataToLocalDB(userModel);

        return userModel;

    } catch (error) {
        throw error.response?.data?.message || error.message || 'Failed to login';
    }
};

// Взять мои данные
export const fetchMeData = async () => {
    try {
        const response = await apiClient.get('/users/me', { authRequired: true });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch user data from server');
    }
};

// Взять пользователя по ID
export const fetchUserById = async (id) => {
    try {
        const response = await apiClient.get(`/users?id=${id}`);
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

// Изменить профиль
export const changeProfile = async (profileData) => {
    try {
        const response = await apiClient.put('/users/edit', profileData, { authRequired: true });
        return response.data;
    } catch (error) {
        throw new Error('Failed to change profile');
    }
};

// Изменить пароль
export const changePassword = async (passwordData) => {
    try {
        const response = await apiClient.put('/users/password', passwordData, { authRequired: true });
        return response.data;
    } catch (error) {
        throw new Error('Failed to change password');
    }
};

// Выйти из системы
export const logout = async () => {
    try {
        const response = await apiClient.post('/users/logout', {}, { authRequired: true });

        return response.data;
    } catch (error) {
        throw new Error('Failed to logout');
    }
};

// Верифицировать пользователя
export const verifyUser = async (verifyData) => {
    try {
        const response = await apiClient.post('/users/verify-user', verifyData, { authRequired: true });
        return response.data;
    } catch (error) {
        throw new Error('Failed to verify user');
    }
};

// Отправить запрос на верификацию почты
export const sendVerifyEmail = async () => {
    try {
        const response = await apiClient.post('/users/send-verify-email', {}, { authRequired: true });
        return response.data;
    } catch (error) {
        throw new Error('Failed to send verify email');
    }
};
