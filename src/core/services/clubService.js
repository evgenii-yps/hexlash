import apiClient from '@/core/api/apiClient.js';
import {clearDatabase, CLUBS_TABLE, getFromDB, initDB} from '@/core/database/idb.js';
import ClubModel from "@/core/models/clubModel.js";
import {MASTER_TAG} from "@/core/services/masterService.js";

// Получить данные клуба из локальной базы данных
export const getClubDataFromLocalDB = async (clubId) => {
    const data = await getFromDB(CLUBS_TABLE, clubId);
    return data ? new ClubModel(data) : null;
};

// Сохранить данные клуба в локальную базу данных
export const saveClubDataToLocalDB = async (clubModel) => {
    const db = await initDB();
    await db.put(CLUBS_TABLE, {...clubModel, id: clubModel.id});
};

// Получить данные клуба из API
export const getClubDataFromAPI = async (clubId) => {
    // Заглушка для API вызова
    // Пример: const response = await apiClient.get(`/clubs/${clubId}`);
    // const data = response.data;
    const data = {id: clubId, name: 'Example Club', avatarUrl: '', owner: 'user123'}; // Заглушка
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
        saveClubDataToLocalDB(clubData).catch((error) => {
            console.error('Ошибка при сохранении данных в локальную базу:', error);
        });
    }

    return clubData;
};

// Очистить данные клуба из локальной базы данных
export const clearClubDataFromLocalDB = async (clubId) => {
    await clearDatabase(CLUBS_TABLE, clubId);
};
