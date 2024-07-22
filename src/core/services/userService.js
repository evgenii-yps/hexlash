import apiClient from '@/core/api/apiClient.js';
import {clearDatabase, getFromDB, saveToDB} from '@/core/database/idb.js';
import UserModel from "@/core/models/userModel.js";
import {jwtDecode} from "jwt-decode";
import {CurrentUserModel} from "@/core/models/currentUserModel.js";


export const getCurrentUserDataFromLocalDB = async () => {
    const data = await getFromDB('currentUser', 'currentUser');
    return data ? new UserModel(data) : null;
};

export const saveCurrentUserDataToLocalDB = async (userModel) => {
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

        const { jwtToken } = response.data;

        // Распарсить токен и извлечь ID пользователя
        const decodedToken = jwtDecode(jwtToken);
        const userId = decodedToken.sub;

        // Получите данные текущего пользователя
        const userData = await fetchMeData(jwtToken);

        // Преобразуем данные пользователя в модель и добавляем токен
        const userModel = new CurrentUserModel({ ...userData, jwtToken });

        // Проверяем пользователя в базе данных
        const existingUser = await getFromDB('currentUser', userId);

        if (existingUser && existingUser.id !== userModel.id) {
            // Удаляем данные старого пользователя, если он отличается от текущего
            await clearDatabase();
        }

        // Сохраняем данные пользователя в локальную базу данных
        await saveCurrentUserDataToLocalDB(userModel);

        return userModel;

    } catch (error) {
        throw error.response?.data?.message || error.message || 'Failed to login';
    }
};

// Функция для получения данных текущего пользователя
export const fetchMeData = async (token) => {
    try {
        const response = await apiClient.get('/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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
