import store from "@/core/state/store.js";
import {getPunchLimitsFromLocalDB, savePunchLimitsToLocalDB} from "@/core/database/punchRepository.js";
import {PunchBatchRequestMsg, PunchInfoRequestMsg} from "@/core/models/ws/req/PunchBatchRequestMsg.js";

/**
 * Извлекает параметры лимита времени из локальной базы данных или обновляет их с сервера
 */
export const getPunchLimitsFromLocalAndAPI = async () => {
    let localData;
    try {
        // Сначала берем данные из локальной базы данных
        localData = await getPunchLimitsFromLocalDB();
    } catch (error) {
        console.error('Failed to fetch locales limit time:', error);
    }

    // Возвращаем локальные данные, если они есть
    if (localData) {

        // Отправляем запрос в сокет за свежими данными

        await store.commit('punch/setPunchInfo', localData);
        await store.commit('punch/setIsTrainingBlock', checkPunchTime(localData.intervalStartMs));

    } else {
        console.error('get from socket');
        // Отправляем запрос в сокет за свежими данными
        await store.dispatch('webSocket/sendMessage', new PunchInfoRequestMsg());
    }
};


export const sendPunchBatch = async (punchInfo, totalValue) => {
    try {

        console.log(`Sending ${totalValue}`);

        const msg = new PunchBatchRequestMsg(totalValue);

        await store.dispatch('webSocket/sendMessage', msg);

    } catch (error) {
        console.error('Failed to fetch limit time from server:', error);
    }
};

export const receivePunchBatch = async (punchInfo) => {
    try {
        // Обновляем локальную базу данных
        await savePunchLimitsToLocalDB(punchInfo);

        await store.commit('punch/setPunchInfo', punchInfo);
        await store.commit('punch/setIsTrainingBlock', checkPunchTime(punchInfo.intervalStartMs));

    } catch (error) {
        console.error('Failed to fetch limit time from server:', error);
    }
};

export const stopPunchBatch = async (punchInfo) => {
    await store.commit('punch/setPunchInfo', punchInfo);

    await sendPunchBatch(punchInfo);

    //store.commit('punch/setIsTrainingBlock', true);

}

function checkPunchTime(punchResetTime) {
    const currentTime = Math.floor(Date.now() / 1000);
    return punchResetTime > currentTime;
}