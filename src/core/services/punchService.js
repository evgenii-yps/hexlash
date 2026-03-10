import store from "@/core/state/store.js";
import {getPunchLimitsFromLocalDB, savePunchLimitsToLocalDB} from "@/core/database/punchRepository.js";
import {PunchBatchRequestMsg, PunchInfoRequestMsg} from "@/core/models/ws/req/PunchBatchRequestMsg.js";
import {DECIMALS} from "@/core/constants.js";
import {isMockMode} from "@/core/mock/mockData.js";

/**
 * Извлекает параметры лимита времени из локальной базы данных или обновляет их с сервера
 */
export const getPunchLimitsFromLocalAndSocket = async () => {
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

    }

    // Отправляем запрос в сокет за свежими данными
    await store.dispatch('webSocket/sendMessage', new PunchInfoRequestMsg());

};


export const sendPunchBatch = async (punchInfo, totalValue, count) => {
    if (isMockMode()) {
        console.log('[MOCK] Punch batch sent:', {totalValue, count});
        store.commit('master/increaseBalance', {add: Math.round((totalValue / 100) * Math.pow(10, DECIMALS))});
        return;
    }

    try {

        const amount = (totalValue / 100) * Math.pow(10, DECIMALS);
        const msg = new PunchBatchRequestMsg(amount, count);

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
}

function checkPunchTime(punchResetTime) {
    const currentTime = Math.floor(Date.now());
    return punchResetTime > currentTime;
}