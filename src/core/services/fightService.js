import router from "@/router/index.js";
import {FightModel} from "@/core/models/fightModel.js";
import store from "@/core/state/store.js";
import {getFightByIdFromDB, saveFightDataToLocalDB} from "@/core/database/fightRepository.js";
import {i18n} from '@/main.js';
import {DECIMALS} from "@/core/constants.js";
import * as userService from "@/core/services/userService.js";

const testFights = [
    {
        "id": "fight1",
        "fighterOne": "user123",
        "fighterTwo": "user2",
        "fighterOneActions": ["HH", "BD", "BH", "HD", "HH"],
        "fighterTwoActions": ["HD", "HH", "BD", "BH", "BD"],
        "winnerId": "user123",
        "fightDate": "2024-08-31T10:23:09.123Z",
        "bet": 1000,
        "actions": 5,
        "isCompleted": true
    },
    {
        "id": "fight2",
        "fighterOne": "user2",
        "fighterTwo": "user3",
        "fighterOneActions": ["BD", "HH", "BH", "HD", "BD"],
        "fighterTwoActions": ["HH", "BD", "HD", "HH", "BH"],
        "winnerId": "user2",
        "fightDate": "2024-08-30T15:47:36.543Z",
        "bet": 2000,
        "actions": 5,
        "isCompleted": true
    },
    {
        "id": "fight3",
        "fighterOne": "user1",
        "fighterTwo": "user3",
        "fighterOneActions": ["HH", "BH", "BD", "HH", "HD"],
        "fighterTwoActions": ["BD", "HD", "HH", "BD", "BH"],
        "winnerId": "",
        "fightDate": "2024-08-29T12:34:56.789Z",
        "bet": 1500,
        "actions": 5,
        "isCompleted": true
    }
];


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
            const apiUserModel = FightModel.FromJSON(apiData);

            await saveFightDataToLocalDB(apiUserModel);

            await store.commit('fight/setCurrentFight', apiUserModel);

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
                await store.commit('fight/setCurrentFight', apiUserModel);
                return apiUserModel;
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    }
};

export const createFight = async (arenaSettings) => {

    const fightModel = await mockServerRequest(arenaSettings);

    // Проверяем чтобы я был участником боя
    const master = store.getters['master/getMaster'];
    if (![fightModel.fighterOne, fightModel.fighterTwo].includes(master.userData.id)) {
        throw new Error('You are not a participant in this fight');
    }

    // Проверяем достаточно ли баланса у пользователя
    const balance = master.userData.balance;
    if (balance < fightModel.bet) {
        throw new Error(i18n.global.t("arena.insufficientFunds"));
    }

    const newBalance = balance - (fightModel.bet * (10 ** DECIMALS));
    // Отнимаем ставку от баланса и сохраняем изменения через dispatch
    await store.dispatch('master/updateMaster', {balance: newBalance});

    // Сохраним временный бой в локальную базу данных
    await saveFightDataToLocalDB(fightModel);

    return fightModel;
}

// Тестовая функция эмуляции запроса на сервер
export const mockServerRequest = async (arenaSettings) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const randomId = `fight-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            // Здесь мы эмулируем получение данных с сервера
            const testFightModel = new FightModel({
                id: `fight-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                fighterOne: 'user123',
                fighterTwo: 'user1',
                fighterOneActions: [],
                fighterTwoActions: [],
                winnerId: null,
                fightDate: new Date(Date.now() + 3000),
                bet: arenaSettings.bet,
                duration: arenaSettings.time,
                actions: arenaSettings.actions,
                isCompleted: false
            });
            resolve(testFightModel);
        }, 1000); // Задержка в 1 секунду
    });
};







