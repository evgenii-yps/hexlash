import * as fightService from "@/core/services/fightService.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {i18n} from "@/main.js";

const state = {
    currentFight: null,
    waitingFight: false,
    arenaSettings: {bet: 10, actions: 5, time: 10, isDisableFight: false},
    msgStatus:null
};

const getters = {
    getCurrentFight: (state) => () => {
        return state.currentFight;
    },
    getArenaSettings: (state) => () => {
        return state.arenaSettings;
    },
    isWaitingFight: (state) => () => {
        return state.waitingFight;
    },
    getMsgStatus: (state) => () => {
        return state.msgStatus;
    },
};

const mutations = {
    setCurrentFight(state, fight) {
        state.currentFight = fight;
    },
    setWaitingFight(state, waitingFight) {
        state.waitingFight = waitingFight;
    },
    setMsgStatus(state, msgStatus) {
        state.msgStatus = msgStatus;
    },
    setArenaSettings(state, initParams) {
        state.arenaSettings = initParams;
    }
};

const actions = {
    setArenaSettings({commit, rootGetters, dispatch}, initParams) {
        // Проверяем достаточно ли баланса у пользователя
        const master = rootGetters['master/getMaster'];
        const balance = master.getBalance();

        const isDisableFight = balance < initParams.bet;
        if (isDisableFight) {
            commit("setMsgStatus", i18n.global.t("arena.insufficientFunds"));
        } else {
            commit("setMsgStatus", i18n.global.t('arena.lblTestResolve'));
        }
        const bet = initParams.bet;

        commit('setArenaSettings', {...initParams, isDisableFight, bet});
    },
    async startFight({commit, rootGetters}) {

        // Запускаем ожидания боя
        commit('setWaitingFight', true);
        commit("setMsgStatus", i18n.global.t('arena.lblSearchOpponent'));

        // Проверяем достаточно ли баланса у пользователя
        const master = rootGetters['master/getMaster'];
        const balance = master.getBalance();

        if (balance < state.arenaSettings.bet) {
            commit('master/setInfoMessage',
                InfoMessageModel.withTimeout(i18n.global.t("arena.insufficientFunds"), 1500),
                {root: true});

            commit('setWaitingFight', false);
            return;
        }


        console.log(balance, state.arenaSettings.bet, state.arenaSettings.actions, state.arenaSettings.time);

        // Выставляем модель текущего боя после получения данных
        //commit('setCurrentFight', newFight);
    },
    async getFightById({commit, getters}, fightId) {
        try {
            let fight = await fightService.getFightFromLocalAndAPI(fightId);
            if (fight) {
                commit('setCurrentFight', fight);
            }
            return fight;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
