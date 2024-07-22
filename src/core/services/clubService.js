import apiClient from '@/core/api/apiClient.js';
import { clearDatabase, getFromDB, saveToDB } from '@/core/database/idb.js';
import ClubModel from "@/core/models/clubModel.js";

// Получить данные клуба из локальной базы данных
export const getClubDataFromLocalDB = async (clubId) => {
    const data = await getFromDB('clubs', clubId);
    return data ? new ClubModel(data) : null;
};

// Сохранить данные клуба в локальную базу данных
export const saveClubDataToLocalDB = async (clubModel) => {
    await saveToDB('clubs', clubModel);
};

// Получить данные клуба из API
export const getClubDataFromAPI = async (clubId) => {
    // Заглушка для API вызова
    // Пример: const response = await apiClient.get(`/clubs/${clubId}`);
    // const data = response.data;
    const data = { id: clubId, name: 'Example Club', avatarUrl: '', owner: 'user123' }; // Заглушка
    return new ClubModel(data);
};

// Обновить данные клуба через API
export const updateClubDataOnAPI = async (clubModel) => {
    // Заглушка для API вызова
    // Пример: await apiClient.put(`/clubs/${clubModel.id}`, clubModel);
};

// Получить данные клуба из локальной базы данных или из API
export const getClubByIdFromLocalAndAPI = async (clubId) => {
    // Сначала берем данные из локальной базы данных
    let clubData = await getClubDataFromLocalDB(clubId);

    // Если данных нет, берем их из API
    if (!clubData) {
        clubData = await getClubDataFromAPI(clubId);
        // Сохраняем данные в локальную базу данных
        await saveClubDataToLocalDB(clubData);
    }

    return clubData;
};

// Очистить данные клуба из локальной базы данных
export const clearClubDataFromLocalDB = async (clubId) => {
    await clearDatabase('clubs', clubId);
};
