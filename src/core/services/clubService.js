import ClubModel from "@/core/models/clubModel.js";
import {getClubDataFromLocalDB, saveClubDataToLocalDB} from "@/core/database/clubRepository.js";


// Получить данные клуба из API
export const getClubDataFromAPI = async (clubId) => {
    // Заглушка для API вызова
    // Пример: const response = await apiClient.get(`/clubs/${clubId}`);
    // const data = response.data;
    const data = [
        new ClubModel({
            id: 'club123',
            name: 'Awesome Club',
            description: 'A club for awesome people.',
            avatarUrl: '',
            owner: 'user123',
            balance: 100,
            battles: 10,
            wins: 7,
            isPublic: true,
            members: 50,
        }),
        new ClubModel({
            id: 'club2',
            name: 'Chill Club',
            description: 'Relax and enjoy in this club.',
            avatarUrl: '',
            owner: 'user456',
            balance: 200,
            battles: 20,
            wins: 15,
            isPublic: false,
            members: 100,
        }),
        new ClubModel({
            id: 'club3',
            name: 'Gaming Club',
            description: 'For passionate gamers.',
            avatarUrl: '',
            owner: 'user789',
            balance: 500,
            battles: 50,
            wins: 45,
            isPublic: true,
            members: 200,
        }),
        new ClubModel({
            id: 'club4',
            name: 'Music Lovers',
            description: 'Club for those who live and breathe music.',
            avatarUrl: '',
            owner: 'user321',
            balance: 300,
            battles: 30,
            wins: 20,
            isPublic: false,
            members: 150,
        }),
        new ClubModel({
            id: 'club5',
            name: 'Adventure Club',
            description: 'For thrill-seekers and adventurers.',
            avatarUrl: '',
            owner: 'user654',
            balance: 400,
            battles: 40,
            wins: 35,
            isPublic: true,
            members: 250,
        }),
    ];
    return data.find(club => club.id === clubId);
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

