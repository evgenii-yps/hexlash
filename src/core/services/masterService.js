import apiClient from '@/core/api/apiClient.js';
import {clearDatabase} from '@/core/database/idb.js';
import {getMasterFromLocalDB, saveMasterToLocalDB, updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {MasterModel} from "@/core/models/masterModel.js";
import {saveTasksToLocalDB} from "@/core/database/socialTasksRepository.js";

export const getMasterFromLocalAndAPI = async () => {
    // Сначала берем данные из локальной базы данных
    const localData = await getMasterFromLocalDB();

    if (localData != null) {
        // Асинхронно обновляем данные из API
        getMasterFromAPI();
    }

    return localData;
};

export const getMasterFromAPI = () => {
    // Асинхронно обновляем данные из API
    fetchMasterData().then(async (apiData) => {
        const apiUserModel = MasterModel.fromJSON(apiData);
        await updateMasterToLocalDB(apiUserModel);
        return apiUserModel;
    }).catch((error) => {
        console.error('Failed to fetch user data from API:', error);
    });
};

// Метод логина
export const testLogin = async (credentials) => {
    try {

        const mockUser = `{
              "id": "user123",
              "login": "userLogin",
              "name": "John Doe",
              "avatarUrl": "",
              "isBlocked": false,
              "createdAt": "2024-07-23T10:00:00Z",
              "updatedAt": "2024-07-23T10:00:00Z",
              "clubId": "club123",
              "walletAddress": "walletAddress123",
              "walletType": "IMPORTED",
              "totalFights": 100,
              "wins": 50,
              "losses": 30,
              "draws": 20,
              "luckPercentage": 75,
              "wonTokens": 1000,
              "freeTokens": 500,
              "lostTokens": 200,
              "invitedUsers": 10,
              "daysInClub": 365,
              "noSkipDays": 365,
              "inviteId": "invite123",
              "email": "johndoe@example.com",
              "achievements": [1, 3, 4, 5],
              "balance":199,
              "skin":"skin_w_20.png",
              "socialTasks": [
                    {"id": 1, "title": "Confirm Email", "description": "Confirm", "link":"/profile/account", "tokens": 10, "isCompleted": false, "category": "email"},
                    {"id": 2, "title": "Subscribe", "description": "Subscribe",  "link":"https://telegram.org",  "tokens": 10, "isCompleted": false, "category": "telegram"},
                    {"id": 3, "title": "Subscribe","description": "Subscribe",   "link":"https://x.com",  "tokens": 20, "isCompleted": false, "category": "x"},
                    {"id": 4, "title": "Subscribe", "description": "Subscribe",  "link":"https://youtube.com",  "tokens": 10, "isCompleted": true, "category": "youtube"},
                    {"id": 5, "title": "Subscribe", "description": "Subscribe",  "link":"https://discord.com",  "tokens": 10, "isCompleted": false, "category": "discord"},
                    {"id": 6, "title": "Subscribe", "description": "Subscribe",  "link":"https://instagram.com",  "tokens": 20, "isCompleted": false, "category": "instagram"}
                ]
        }`;


        // Преобразуем данные пользователя в модель и добавляем токен
        const { masterModel, socialTasks } = MasterModel.fromJSON(mockUser);
        masterModel.jwtToken = "JWT";

        // Проверяем пользователя в базе данных
        const existingUser = await getMasterFromLocalDB();

        if (existingUser && new MasterModel(existingUser).getUuid() !== masterModel.getUuid()) {
            // Удаляем данные старого пользователя, если он отличается от текущего
            await clearDatabase();
        }

        // Сохраняем данные пользователя в локальную базу данных
        await saveMasterToLocalDB(masterModel);

        if(socialTasks && socialTasks.length > 0) {
            await saveTasksToLocalDB(socialTasks);
        }

        return masterModel;

    } catch (error) {
        throw error.response?.data?.message || error.message || 'Failed to login';
    }
};

// Метод логина
export const login = async (credentials) => {
    try {
        const response = await apiClient.post('/auth/login', credentials);

        const {jwtToken} = response.data;

        // Получите данные текущего пользователя
        const userData = await fetchMasterData(jwtToken);

        // Преобразуем данные пользователя в модель и добавляем токен
        const currentUserModel = new MasterModel({...userData, jwtToken});

        // Проверяем пользователя в базе данных
        const existingUser = await getMasterFromLocalDB();

        if (existingUser && existingUser.getUuid() !== currentUserModel.getUuid()) {
            // Удаляем данные старого пользователя, если он отличается от текущего
            await clearDatabase();
        }

        // Сохраняем данные пользователя в локальную базу данных
        await saveMasterToLocalDB(currentUserModel);

        return currentUserModel;

    } catch (error) {
        throw error.response?.data?.message || error.message || 'Failed to login';
    }
};

// Функция для получения данных текущего пользователя
const fetchMasterData = async (token) => {
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

// Изменить профиль
export const changeProfile = async (profileData) => {
    try {
        const response = await apiClient.put('/users/edit', profileData, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error('Failed to change profile');
    }
};

// Изменить пароль
export const changePassword = async (passwordData) => {
    try {
        const response = await apiClient.put('/users/password', passwordData, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error('Failed to change password');
    }
};

// Выйти из системы
export const logout = async () => {
    try {
        // const response = await apiClient.post('/users/logout', {}, {authRequired: true});

        await clearDatabase();

        return true;
        // return response.data;
    } catch (error) {
        throw new Error('Failed to logout');
    }
};

// Верифицировать пользователя
export const verifyUser = async (verifyData) => {
    try {
        const response = await apiClient.post('/users/verify-user', verifyData, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error('Failed to verify user');
    }
};

// Отправить запрос на верификацию почты
export const sendVerifyEmail = async () => {
    try {
        const response = await apiClient.post('/users/send-verify-email', {}, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error('Failed to send verify email');
    }
};
