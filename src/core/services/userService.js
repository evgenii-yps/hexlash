import UserModel from "@/core/models/userModel.js";
import store from "@/core/state/store.js";
import router from "@/router/index.js";
import {getUserByLoginFromDB, saveUserDataToLocalDB} from "@/core/database/userRepository.js";


const testUsers = [
    {
        id: "user1",
        login: "login1",
        name: "Alice TEST",
        avatarUrl: "",
        isBlocked: false,
        createdAt: "2024-07-23T10:00:00Z",
        updatedAt: "2024-07-23T10:00:00Z",
        clubId: "club1",
        walletAddress: "walletAddress1",
        walletType: "IMPORTED",
        totalFights: 50,
        wins: 32,
        losses: 15,
        draws: 5,
        luckPercentage: 60,
        wonTokens: 200,
        freeTokens: 100,
        lostTokens: 50,
        invitedUsers: 5,
        daysInClub: 180,
        noSkipDays: 180,
        achievements: [1, 2],
        balance: 150
    },
    {
        id: "user2",
        login: "login2",
        name: "Bob",
        avatarUrl: "",
        isBlocked: false,
        createdAt: "2024-07-23T10:00:00Z",
        updatedAt: "2024-07-23T10:00:00Z",
        clubId: "club2",
        walletAddress: "walletAddress2",
        walletType: "GENERATED",
        totalFights: 75,
        wins: 45,
        losses: 25,
        draws: 5,
        luckPercentage: 70,
        wonTokens: 300,
        freeTokens: 150,
        lostTokens: 75,
        invitedUsers: 10,
        daysInClub: 200,
        noSkipDays: 200,
        achievements: [3, 4],
        balance: 250
    },
    {
        id: "user3",
        login: "login3",
        name: "",
        avatarUrl: "https://img.freepik.com/free-photo/cute-cat-with-blue-eyes-on-couch_23-2149078356.jpg?w=900&t=st=1722446541~exp=1722447141~hmac=b0a3510d5b1e7b6b3ce536dc585ee4bc6f0cc59480e7c00d4cbd7ea99a3c29ee",
        isBlocked: false,
        createdAt: "2024-07-23T10:00:00Z",
        updatedAt: "2024-07-23T10:00:00Z",
        clubId: "club3",
        walletAddress: "walletAddress3",
        walletType: "IMPORTED",
        totalFights: 100,
        wins: 62,
        losses: 30,
        draws: 10,
        luckPercentage: 75,
        wonTokens: 500,
        freeTokens: 200,
        lostTokens: 100,
        invitedUsers: 20,
        daysInClub: 365,
        noSkipDays: 365,
        achievements: [5, 6],
        balance: 350
    }
];

// Взять пользователя по Login
const fetchUserByLogin = async (login) => {
    try {
        //  const response = await apiClient.get(`/users?login=${login}`);
        //  return response.data;

        // Добавляем задержку в 1 секунду
        await new Promise(resolve => setTimeout(resolve, 1000));
        const user = testUsers.find(u => u.login === login);
        if (user) {
            return user;
        } else {
            await router.push('/404'); // Перенаправляем на страницу 404
        }
    } catch (error) {
        throw new Error('Failed to fetch user data by login');
    }
};


// Функция для получения и обновления данных пользователя из локальной базы данных и API
export const getUserFromLocalAndAPI = async (userLogin) => {
    let localData;
    try {
        // Сначала берем данные из локальной базы данных
        localData = await getUserByLoginFromDB(userLogin);
    } catch (error) {
        console.error('Failed to fetch locales user data:', error);
    }

    // Возвращаем локальные данные, если они есть
    if (localData) {
        // Асинхронно обновляем данные из API
        fetchUserByLogin(userLogin).then(async (apiData) => {
            const apiUserModel = new UserModel(apiData);

            await saveUserDataToLocalDB(apiUserModel);

            await store.dispatch('user/updateUser', apiUserModel);

        }).catch((error) => {
            console.error('Failed to fetch user data from API:', error);
        });
        return localData;
    } else {
        // Если данных нет в локальной базе, ждем данных от API
        try {
            const apiData = await fetchUserByLogin(userLogin);
            if (apiData) {
                const apiUserModel = new UserModel(apiData);
                await saveUserDataToLocalDB(apiUserModel);
                await store.dispatch('user/updateUser', apiUserModel);
                return apiUserModel;
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    }
};




