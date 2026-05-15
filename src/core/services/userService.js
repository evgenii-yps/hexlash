import UserModel from "@/core/models/userModel.js";
import store from "@/core/state/store.js";
import {getUserByLoginFromDB, saveUserDataToLocalDB} from "@/core/database/userRepository.js";
import apiClient from "@/core/api/apiClient.js";
import {isMockMode, MOCK_USER_DATA} from "@/core/mock/mockData.js";


export const getUserByLoginFromLocalAndAPI = async (login) => {
    // Сначала берем данные из локальной базы данных
    let userData = await getUserByLoginFromDB(login);
    if (userData) {
        await store.dispatch('user/updateUser', userData);
    }
    getUserDataByLoginFromAPI(login);
    return userData;
};


export const getUserDataByLoginFromAPI = (login) => {
    // Асинхронно обновляем данные из API
    fetchUserByLogin(login).then(async (userData) => {
        await saveUserDataToLocalDB(userData);
        await store.dispatch('user/updateUser', userData);
    }).catch((error) => {
        console.error('Failed to fetch user data from API by login:', error);
    });
};

export const fetchUserByLogin = async (login) => {
    if (isMockMode()) {
        return UserModel.fromJSON({...MOCK_USER_DATA, login});
    }

    try {
        const response = await apiClient.get(`/user/login/${login}`, {authRequired: true});
        return UserModel.fromJSON(response.data);
    } catch (error) {
        const wrapped = new Error('Failed to fetch user from server');
        wrapped.status = error?.response?.status;
        wrapped.response = error?.response;
        throw wrapped;
    }
};

export const searchParticipants = async ({ name = '', sortBy = 'battles', page = 0, size = 10, clanId = null, sortDirection = 'DESC' }) => {
    if (isMockMode()) {
        return [];
    }

    try {

        const response = await apiClient.get('/user/search', {
            params: {
                name,
                sortBy,
                sortDirection,
                page,
                size,
                clanId
            },
            authRequired: true,
        });

        return response.data.map(user => UserModel.fromJSON(user));
    } catch (error) {
        throw new Error('Failed to search users: ' + (error.response?.data?.error || error.message));
    }
};




