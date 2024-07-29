import apiClient from '@/core/api/apiClient.js';
import {initDB, clearDatabase, getFromDB, MASTER_TABLE} from '@/core/database/idb.js';
import {MasterModel} from "@/core/models/masterModel.js";

export const MASTER_TAG = "MASTER_TAG";

export const getMasterFromLocalDB = async () => {
    const data = await getFromDB(MASTER_TABLE, MASTER_TAG);
    return data ? new MasterModel(data) : null;
};

export const saveMasterToLocalDB = async (masterModel) => {
    const db = await initDB();
    await db.put(MASTER_TABLE, {...masterModel, id: MASTER_TAG});
};

export const updateMasterToLocalDB = async (updatedData) => {
    const db = await initDB();
    const transaction = db.transaction(MASTER_TABLE, 'readwrite');
    const store = transaction.objectStore(MASTER_TABLE);

    // Получаем текущий объект из базы данных
    const currentData = await store.get(MASTER_TAG);

    if (currentData) {
        // Обновляем необходимые поля в объекте
        for (const [key, value] of Object.entries(updatedData)) {
            if (key in currentData) {
                currentData[key] = value;
            } else if (key in currentData.userData) {
                currentData.userData[key] = value;
            }
        }

        // Сохраняем обновленный объект обратно в базу данных
        await store.put(currentData);
    }

    await transaction.complete;
};


export const getMasterFromLocalAndAPI = async () => {
    // Сначала берем данные из локальной базы данных
    const localData = await getMasterFromLocalDB();

    if (localData != null) {
        // Асинхронно обновляем данные из API
        fetchMasterData().then(async (apiData) => {
            const apiUserModel = MasterModel.fromJSON(apiData);
            await updateMasterToLocalDB(apiUserModel);
            return apiUserModel;
        }).catch((error) => {
            console.error('Failed to fetch user data from API:', error);
        });
    }

    return localData;
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
              "emailVerified": true,
              "achievements": [1, 3, 4, 5],
              "balance":199
        }`;


        // Преобразуем данные пользователя в модель и добавляем токен
        const masterModel = MasterModel.fromJSON(mockUser);
        masterModel.jwtToken = "JWT";

        // Проверяем пользователя в базе данных
        const existingUser = await getFromDB(MASTER_TABLE, MASTER_TAG);

        if (existingUser && new MasterModel(existingUser).getUuid() !== masterModel.getUuid()) {
            // Удаляем данные старого пользователя, если он отличается от текущего
            await clearDatabase();
        }

        // Сохраняем данные пользователя в локальную базу данных
        await saveMasterToLocalDB(masterModel);

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
        const existingUser = await getFromDB(MASTER_TABLE, MASTER_TAG);

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
export const fetchMasterData = async (token) => {
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
        const response = await apiClient.post('/users/logout', {}, {authRequired: true});

        return response.data;
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
