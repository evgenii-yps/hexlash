import store from "@/core/state/store.js";
import {PunchInfoModel} from "@/core/models/punchInfoModel.js";
import {getPunchLimitsFromLocalDB, savePunchLimitsToLocalDB} from "@/core/database/punchRepository.js";

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
        // Асинхронно обновляем данные из API
        fetchPunchLimits().then(async (limitData) => {
            await savePunchLimitsToLocalDB(limitData);

            await store.commit('punch/setPunchInfo', limitData);
            await store.commit('punch/setIsTrainingBlock', checkPunchTime(limitData.unixTimeStart));


        }).catch((error) => {
            console.error('Failed to fetch limit time from server:', error);
        });

        await store.commit('punch/setPunchInfo', localData);
        await store.commit('punch/setIsTrainingBlock', checkPunchTime(localData.unixTimeStart));

    } else {
        // Если данных нет в локальной базе, ждем данных от API
        try {

            const limitData = await fetchPunchLimits();
            if (limitData) {

                await savePunchLimitsToLocalDB(limitData);
                await store.commit('punch/setPunchInfo', limitData);
                await store.commit('punch/setIsTrainingBlock', checkPunchTime(limitData.unixTimeStart));
            }
        } catch (error) {
            console.error('Failed to fetch limit time from server:', error);
        }
    }
};

export const fetchPunchLimits = async () => {
    try {
        // Добавляем задержку для имитации сетевого запроса
        await new Promise(resolve => setTimeout(resolve, 1000));

        const limitTime = 1624560255;

        return new PunchInfoModel({
            unixTimeStart: limitTime,
            waitRateIntervalTime: 28800,
            punchCounter: 0,
            punchCounterMaxPerRate: 10000
        });
    } catch (error) {
        throw new Error('Failed to fetch server limit time');
    }
};


export const sendPunchBatch = async (punchInfo, totalValue) => {
    try {

        /*
        await fetch('/api/daily-tasks/' + updatedTask.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTask),
        });
        */

        const punchInfo = new PunchInfoModel({
            unixTimeStart: 1624560255,//1794560255,
            waitRateIntervalTime: 28800,
            punchCounter: 1,
            punchCounterMaxPerRate: 10000
        });

        // Обновляем локальную базу данных
        await savePunchLimitsToLocalDB(punchInfo);

        await store.commit('punch/setPunchInfo', punchInfo);
        await store.commit('punch/setIsTrainingBlock', checkPunchTime(punchInfo.unixTimeStart));

    } catch (error) {
        throw new Error('Failed to fetch server limit time');
    }
};

export const stopPunchBatch = async (punchInfo) => {
    //const punchInfo = await fetchPunchLimits();  // TODO поменять на это
    await store.commit('punch/setPunchInfo', punchInfo);

    await sendPunchBatch(punchInfo);
    store.commit('punch/setIsTrainingBlock', true);

}


function checkPunchTime(punchResetTime) {
    const currentTime = Math.floor(Date.now() / 1000);
    return punchResetTime > currentTime;
}