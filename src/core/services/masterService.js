import apiClient from '@/core/api/apiClient.js';
import {clearDatabase} from '@/core/database/idb.js';
import {getMasterFromLocalDB, saveMasterToLocalDB, updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {MasterModel} from "@/core/models/masterModel.js";
import store from "@/core/state/store.js";
import {AuthStateModel} from "@/core/models/AuthStateModel.js";
import {jwtDecode} from "jwt-decode";

export const getMasterFromLocalAndAPI = async () => {
    // Сначала берем данные из локальной базы данных
    const localData = await getMasterFromLocalDB();

    if (localData) {

        store.commit('master/setMaster', localData);
        store.commit('master/setAuthState', AuthStateModel.Authenticated(true));

        // TODO включить когда будет jwt токен
        // if (localData.jwtToken) {
        //     try {
        //         const decodedToken = jwtDecode(localData.jwtToken);
        //         const currentTime = Math.floor(Date.now() / 1000); // Текущее время в секундах
        //
        //         if (decodedToken.exp && currentTime < decodedToken.exp) {
        //             store.commit('master/setAuthState', AuthStateModel.Authenticated(true));
        //         } else {
        //             store.commit('master/setAuthState', AuthStateModel.Authenticated(false));
        //         }
        //     } catch (error) {
        //         // Если токен не валиден или не может быть декодирован, устанавливаем флаг в false
        //         store.commit('master/setAuthState', AuthStateModel.Authenticated(false));
        //     }
        // } else {
        //     store.commit('master/setAuthState', AuthStateModel.Authenticated(false));
        // }

        // Асинхронно обновляем данные из API
        getMasterFromAPI();
    }

};

export const getMasterFromAPI = () => {
    // Асинхронно обновляем данные из API
    fetchMasterData().then(async (apiUserModel) => {
        await updateMasterToLocalDB(apiUserModel);
        store.commit('master/setMaster', apiUserModel);
    }).catch((error) => {
        console.error('Failed to fetch user data from API:', error);
    });
};


// Метод логина
export const login = async (credentials) => {
    try {
        //const response = await apiClient.post('/auth/login', credentials);
        //const {jwtToken} = response.data;
        // // Получите данные текущего пользователя
        // const userData = await fetchMasterData(jwtToken);

        const userData = `{
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
              "skin":"skin_w_20.png"
        }`;


        // Преобразуем данные пользователя в модель и добавляем токен
        const masterModel = MasterModel.fromJSON(userData);
        masterModel.jwtToken = "JWT";

        // Проверяем пользователя в базе данных
        const existingUser = await getMasterFromLocalDB();

        if (existingUser && existingUser.getUuid() !== masterModel.getUuid()) {
            // Удаляем данные старого пользователя, если он отличается от текущего
            await clearDatabase();
        }

        // Сохраняем данные пользователя в локальную базу данных
        await saveMasterToLocalDB(masterModel);

        store.commit('master/setMaster', masterModel);
        store.commit('master/setAuthState', AuthStateModel.Authenticated(true));

    } catch (error) {
        const errorStr = error.response?.data?.message || error.message || 'Failed to login';
        store.commit('master/setAuthState', AuthStateModel.Error(errorStr));
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
        return MasterModel.fromJSON(response.data);
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
