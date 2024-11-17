import {BATCH_SEND_INTERVAL_MS, DECIMALS} from "@/core/constants.js";
import * as punchService from "@/core/services/punchService.js";
import store from "@/core/state/store.js";
import {ampli} from "@/amplitude.js";


const state = {
    punchInfo: null,
    isLoadingPunchInfo: false,  // Состояние загрузки информации о груше
    isTrainingBlocked: false,
    punchTimerId: null,
    batchHitPunchAmount: [],
    batchHitPunchCount: 0,
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
                if(totalValue > state.punchInfo.punchAmountMaxPerBatch) {
                    totalValue = state.punchInfo.punchAmountMaxPerBatch
                }

                await punchService.sendPunchBatch(state.punchInfo, totalValue, state.batchHitPunchCount);

                // Amplitude
                ampli.logEvent('SendPunch', state.punchInfo);
            }

            // Очищаем массив
            state.batchHitPunchAmount = [];
            state.batchHitPunchCount = 0;

        }, BATCH_SEND_INTERVAL_MS);

        commit('setPunchTimer', timerId);
    },
    async stopPunchTimer({commit}) {
        if (state.punchTimerId) {
            clearInterval(state.punchTimerId);
            commit('setPunchTimer', null);
        }
    },
    async handlePunch({commit, dispatch}, value) {
        if (state.punchInfo.isLimitReach) {
            await punchService.stopPunchBatch(state.punchInfo);
            return;
        }
        state.batchHitPunchAmount.push(value);
        state.batchHitPunchCount++;

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
