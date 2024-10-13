import {BATCH_SEND_INTERVAL_MS, DECIMALS} from "@/core/constants.js";
import * as punchService from "@/core/services/punchService.js";
import store from "@/core/state/store.js";


const state = {
    punchInfo: null,
    isLoadingPunchInfo: false,  // Состояние загрузки информации о груше
    isTrainingBlocked: false,
    punchTimerId: null,
    batchHitPunchAmount: [],
    is2DPunch: localStorage.getItem('is2DPunch') === 'true', // Если у нас 2д режим
};

const getters = {
    getPunchInfo: (state) => {
        return state.punchInfo;
    },
    is2DPunchEnabled: (state) => state.is2DPunch,
};

const mutations = {
    setIsLoadingPunchInfo(state, isLoading) {
        state.isLoadingPunchInfo = isLoading;
    },
    setIsTrainingBlock(state, isTrainingBlocked) {
        state.isTrainingBlocked = isTrainingBlocked;
    },
    setPunchInfo(state, info) {
        state.punchInfo = info;
    },
    setPunchTimer(state, timerId) {
        state.punchTimerId = timerId;
    },
    clearPunchTimer(state) {
        if (state.punchTimerId) {
            clearInterval(state.punchTimerId);
            state.punchTimerId = null;
        }
    },
    set2DPunch(state, isEnabled) {  // Мутация для изменения флага
        state.is2DPunch = isEnabled;
        localStorage.setItem('is2DPunch', isEnabled); // Обновляем localStorage
    },
};

const actions = {
    startPunchTimer({commit, state}) {
        // Если таймер уже существует, не запускаем его снова
        if (state.punchTimerId) return;

        const timerId = setInterval(async() => {
            // Считаем общее число
            let totalValue = state.batchHitPunchAmount.reduce((sum, num) => sum + num, 0);

            // Сохраняем и отправляем
            if(totalValue > 0) {
                if(totalValue > 3000000/*state.punchInfo.batchHitPunchAmount*/) {
                    // TODO брать из модели
                    totalValue = 2999999
                }
                await punchService.sendPunchBatch(state.punchInfo, totalValue);
            }

            // Очищаем массив
            state.batchHitPunchAmount = [];

        }, BATCH_SEND_INTERVAL_MS);

        commit('setPunchTimer', timerId);
    },
    stopPunchTimer({commit}) {
        commit('clearPunchTimer');
    },
    async handlePunch({commit, dispatch}, value) {
        if (state.punchInfo.isLimitReach) {
            await punchService.stopPunchBatch(state.punchInfo);
            return;
        }
        state.batchHitPunchAmount.push(value);
        state.punchInfo.punchCounter++;

        // Увеличиваем баланс
        const amount = (value / 100) * Math.pow(10, DECIMALS);
        store.commit('master/increaseBalance', {add: amount})
    },
    async synchronizePunchInfo({commit}) {
        try {
            commit('setIsLoadingPunchInfo', true);
            await punchService.getPunchLimitsFromLocalAndSocket();
        } catch (error) {
            console.error('Error synchronizing punch reset time:', error);
        }
        commit('setIsLoadingPunchInfo', false);
    },

};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
