// Получить данные клуба из локальной базы данных
import {clearDatabase, CLUBS_TABLE, initDB} from "@/core/database/idb.js";
import ClubModel from "@/core/models/clubModel.js";

export const getClubDataFromLocalDB = async (clubId) => {

    const db = await initDB(); // Инициализируем базу данных
    const transaction = db.transaction(CLUBS_TABLE, 'readonly'); // Открываем транзакцию на чтение
    const store = transaction.objectStore(CLUBS_TABLE); // Получаем объект хранилища

    // Извлекаем данные по идентификатору ClubId
    const data = await store.get(clubId);

    await transaction.complete; // Завершаем транзакцию

    return data ? new ClubModel(data) : null;

};

// Сохранить данные клуба в локальную базу данных
export const saveClubDataToLocalDB = async (clubModel) => {
    const db = await initDB();
    await db.put(CLUBS_TABLE, {...clubModel, id: clubModel.id});
};

export const updateClubToLocalDB = async (updatedData) => {
    const db = await initDB();
    const transaction = db.transaction(CLUBS_TABLE, 'readwrite');
    const store = transaction.objectStore(CLUBS_TABLE);

    // Получаем текущий объект из базы данных
    const currentData = await store.get(updatedData.id);

    if (currentData) {
        // Обновляем необходимые поля в объекте
        for (const [key, value] of Object.entries(updatedData)) {
            if (key in currentData) {
                currentData[key] = value;
            }
        }

        // Сохраняем обновленный объект обратно в базу данных
        await store.put(currentData);
    }
    else {
        // Если объекта нет, создаём новую запись
        await store.put(updatedData);
    }

    await transaction.complete;
};

// Очистить данные клуба из локальной базы данных
export const clearClubDataFromLocalDB = async (clubId) => {
    await clearDatabase(CLUBS_TABLE, clubId);
};
