import {getClubDataFromLocalDB, updateClubToLocalDB} from "@/core/database/clubRepository.js";
import apiClient from "@/core/api/apiClient.js";
import store from "@/core/state/store.js";
import ClubModel from "@/core/models/clubModel.js";
import {updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {COST_CREATE_CLUB, DECIMALS} from "@/core/constants.js";
import {isMockMode} from "@/core/mock/mockData.js";

// Получить данные клуба из локальной базы данных или из API
export const getClubByIdFromLocalAndAPI = async (clubId) => {
    // Сначала берем данные из локальной базы данных
    let clubData = await getClubDataFromLocalDB(clubId);
    if (clubData) {
        store.commit('club/setClub', clubData);
        // Обновляем из API в фоне
        getClubDataFromAPI(clubId);
        return clubData;
    }
    // Нет кэша — ждём API
    const apiClubModel = await fetchClubData(clubId);
    if (apiClubModel) {
        await updateClubToLocalDB(apiClubModel);
        store.commit('club/setClub', apiClubModel);
    }
    return apiClubModel;
};


export const getClubDataFromAPI = (clubId) => {
    // Асинхронно обновляем данные из API
    fetchClubData(clubId).then(async (apiClubModel) => {
        await updateClubToLocalDB(apiClubModel);
        store.commit('club/setClub', apiClubModel);
    }).catch((error) => {
        console.error('Failed to fetch user data from API:', error);
    });
};

export const fetchClubData = async (clubId) => {
    try {
        const response = await apiClient.get(`/club/id/${clubId}`, {authRequired: true});
        return ClubModel.fromJSON(response.data);
    } catch (error) {
        throw new Error('Failed to fetch club data from server');
    }
};

export const updateClubDataOnAPI = async (clubModel) => {
    try {
        const editedData = {
            clubId: clubModel.id,
            name: clubModel.name,
            description: clubModel.description,
            imageUrl: clubModel.imageUrl,
            isPublic: clubModel.isPublic,
        };

        const response = await apiClient.post(`/club/edit`, editedData, {authRequired: true});
        return ClubModel.fromJSON(response.data);
    } catch (error) {
        throw new Error('Failed to fetch club data from server');
    }
};

export const uploadClubAvatar = async (formData, onUploadProgress) => {
    try {
        const response = await apiClient.post('/club/put-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            authRequired: true,
            onUploadProgress, // Обработчик для прогресса загрузки
        });

        // Сохраняем в базу данных
        await updateClubToLocalDB({id: response.data.id, avatarUrl: response.data.avatarUrl});

        return response.data.avatarUrl;

    } catch (error) {
        throw new Error('Failed to upload avatar ' + (error.response?.data?.error || error.message));
    }
};

export const createClub = async (clubData) => {
    try {

        const response = await apiClient.post(`/club/add`, {clubData}, {authRequired: true});

        const createdClubModel = ClubModel.fromJSON(response.data);
        await updateClubToLocalDB(createdClubModel);
        store.commit('club/setClub', createdClubModel);

        store.commit('master/decreaseBalance', COST_CREATE_CLUB * (10 ** DECIMALS));

        return createdClubModel;
    } catch (error) {
        throw new Error('Failed to create club: ' + (error.response?.data?.error || error.message));
    }
};


export const changeClub = async (clubId) => {
    try {

        const response = await apiClient.post(`/club/change`, {clubId: clubId}, {authRequired: true});

        const newClubClubModel = ClubModel.fromJSON(response.data);
        await updateClubToLocalDB(newClubClubModel);
        store.commit('club/setClub', newClubClubModel);

        return newClubClubModel;
    } catch (error) {
        throw new Error('Failed to change club: ' + (error.response?.data?.error || error.message));
    }
};


export const searchClubs = async ({name = '', sortBy = 'battles', page = 0, size = 10, sortDirection = 'DESC'}) => {
    if (isMockMode()) {
        return [];
    }

    try {
        const response = await apiClient.get('/club/search', {
            params: {
                name,
                sortBy,
                sortDirection,
                page,
                size,
            },
            authRequired: true,
        });

        return response.data.map(club => ClubModel.fromJSON(club));
    } catch (error) {
        throw new Error('Failed to search clubs: ' + (error.response?.data?.error || error.message));
    }
};


