import store from "@/core/state/store.js";
import {savePunchLimitsToLocalDB} from "@/core/database/punchRepository.js";

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

function checkPunchTime(punchResetTime) {
    const currentTime = Math.floor(Date.now());
    return punchResetTime > currentTime;
}
