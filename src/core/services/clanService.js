import {getClanDataFromLocalDB, updateClanToLocalDB} from "@/core/database/clanRepository.js";
import apiClient from "@/core/api/apiClient.js";
import store from "@/core/state/store.js";
import ClanModel from "@/core/models/clanModel.js";
import {updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {isMockMode} from "@/core/mock/mockData.js";

export const getClanByIdFromLocalAndAPI = async (clanId) => {
    let clanData = await getClanDataFromLocalDB(clanId);
    if (clanData) {
        store.commit('clan/setClan', clanData);
        getClanDataFromAPI(clanId);
        return clanData;
    }
    const apiClanModel = await fetchClanData(clanId);
    if (apiClanModel) {
        await updateClanToLocalDB(apiClanModel);
        store.commit('clan/setClan', apiClanModel);
    }
    return apiClanModel;
};


export const getClanDataFromAPI = (clanId) => {
    fetchClanData(clanId).then(async (apiClanModel) => {
        await updateClanToLocalDB(apiClanModel);
        store.commit('clan/setClan', apiClanModel);
    }).catch((error) => {
        console.error('Failed to fetch clan data from API:', error);
    });
};

export const fetchClanData = async (clanId) => {
    try {
        const response = await apiClient.get(`/clan/id/${clanId}`, {authRequired: true});
        return ClanModel.fromJSON(response.data);
    } catch (error) {
        const wrapped = new Error('Failed to fetch clan data from server');
        wrapped.status = error?.response?.status;
        wrapped.response = error?.response;
        throw wrapped;
    }
};

export const updateClanDataOnAPI = async (clanModel) => {
    try {
        const editedData = {
            clanId: clanModel.id,
            name: clanModel.name,
            description: clanModel.description,
            isPublic: clanModel.isPublic,
        };

        const response = await apiClient.post(`/clan/edit`, editedData, {authRequired: true});
        return ClanModel.fromJSON(response.data);
    } catch (error) {
        throw new Error('Failed to update clan data on server');
    }
};

export const uploadClanAvatar = async (formData, onUploadProgress) => {
    try {
        const response = await apiClient.post('/clan/put-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            authRequired: true,
            onUploadProgress,
        });

        await updateClanToLocalDB({id: response.data.id, avatarUrl: response.data.avatarUrl});

        return response.data.avatarUrl;

    } catch (error) {
        throw new Error('Failed to upload avatar ' + (error.response?.data?.error || error.message));
    }
};

export const createClan = async (clanData) => {
    try {

        const response = await apiClient.post(`/clan/add`, {clanData}, {authRequired: true});

        const createdClanModel = ClanModel.fromJSON(response.data);
        await updateClanToLocalDB(createdClanModel);
        store.commit('clan/setClan', createdClanModel);

        return createdClanModel;
    } catch (error) {
        throw new Error('Failed to create clan: ' + (error.response?.data?.error || error.message));
    }
};


export const leaveClan = async () => {
    try {
        await apiClient.post(`/clan/change`, {clanId: null}, {authRequired: true});
    } catch (error) {
        throw new Error('Failed to leave clan: ' + (error.response?.data?.error || error.message));
    }
};

export const deleteClan = async () => {
    try {
        await apiClient.delete(`/clan`, {authRequired: true});
    } catch (error) {
        throw new Error('Failed to delete clan: ' + (error.response?.data?.error || error.message));
    }
};

export const setMemberRole = async (userId, role) => {
    try {
        const response = await apiClient.post('/clan/set-role', {userId, role}, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to set role');
    }
};

export const transferOwnership = async (newOwnerId) => {
    try {
        const response = await apiClient.post('/clan/transfer-ownership', {newOwnerId}, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to transfer ownership');
    }
};

export const kickMember = async (userId) => {
    try {
        const response = await apiClient.post('/clan/kick', {userId}, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to kick member');
    }
};

export const inviteToClan = async (userId) => {
    try {
        const response = await apiClient.post('/clan/invite', {userId}, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to send invite');
    }
};

export const getPendingInvites = async () => {
    try {
        const response = await apiClient.get('/clan/invites', {authRequired: true});
        return response.data || [];
    } catch (error) {
        console.error('Failed to get pending invites:', error);
        return [];
    }
};

export const respondToInvite = async (inviteId, action) => {
    try {
        const response = await apiClient.post('/clan/invite/respond', {inviteId, action}, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to respond to invite');
    }
};

export const getClanEvents = async (clanId, limit = 30, before = null) => {
    try {
        const params = { limit };
        if (before) params.before = before;
        const response = await apiClient.get(`/clan/${clanId}/events`, { params, authRequired: true });
        return response.data || [];
    } catch (error) {
        console.error('Failed to get clan events:', error);
        return [];
    }
};

export const searchClans = async ({name = '', sortBy = 'battles', page = 0, size = 10, sortDirection = 'DESC'}) => {
    if (isMockMode()) {
        return [];
    }

    try {
        const response = await apiClient.get('/clan/search', {
            params: {
                name,
                sortBy,
                sortDirection,
                page,
                size,
            },
            authRequired: true,
        });

        return response.data.map(clan => ClanModel.fromJSON(clan));
    } catch (error) {
        throw new Error('Failed to search clans: ' + (error.response?.data?.error || error.message));
    }
};
