import router from "@/router/index.js";
import {FightModel} from "@/core/models/fightModel.js";
import store from "@/core/state/store.js";
import {getFightByIdFromDB, saveFightDataToLocalDB} from "@/core/database/fightRepository.js";

const testFights = [];

// Взять пользователя по Login
const fetchFightById = async (id) => {
    try {
        //  const response = await apiClient.get(`/users?login=${login}`);
        //  return response.data;

        // Добавляем задержку в 1 секунду
        await new Promise(resolve => setTimeout(resolve, 1000));
        const fight = testFights.find(f => f.id === id);
        if (fight) {
            return fight;
        } else {
            await router.push('/404'); // Перенаправляем на страницу 404
        }
    } catch (error) {
        throw new Error('Failed to fetch user data by login');
    }
};


// Функция для получения и обновления данных пользователя из локальной базы данных и API
export const getFightFromLocalAndAPI = async (id) => {
    let localData;
    try {
        // Сначала берем данные из локальной базы данных
        localData = await getFightByIdFromDB(id);
    } catch (error) {
        console.error('Failed to fetch locales fight data:', error);
    }

    // Возвращаем локальные данные, если они есть
    if (localData) {
        // Асинхронно обновляем данные из API
        fetchFightById(id).then(async (apiData) => {
            const apiUserModel = new FightModel.FromJSON(apiData);

            await saveFightDataToLocalDB(apiUserModel);

            await store.dispatch('fight/updateFight', apiUserModel);

        }).catch((error) => {
            console.error('Failed to fetch fight data from API:', error);
        });
        return localData;
    } else {
        // Если данных нет в локальной базе, ждем данных от API
        try {
            const apiData = await fetchFightById(id);
            if (apiData) {
                const apiUserModel = new FightModel(apiData);
                await saveFightDataToLocalDB(apiUserModel);
                await store.dispatch('fight/updateFight', apiUserModel);
                return apiUserModel;
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    }
};







