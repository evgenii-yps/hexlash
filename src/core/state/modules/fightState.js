import * as fightService from "@/core/services/fightService.js";
import {i18n} from "@/main.js";
import router from "@/router/index.js";
import * as userService from "@/core/services/userService.js";

const state = {
    arenaSettings: {bet: 10, actions: 5, time: 10, isDisableFight: false},
    waitingFight: false,
    msgStatus: null,
    currentFight: null,
    fighterOne: null,
    fighterTwo: null,
};

const getters = {
    getCurrentFight: (state) => () => state.currentFight,
    getArenaSettings: (state) => () => state.arenaSettings,
    isWaitingFight: (state) => () => state.waitingFight,
    getMsgStatus: (state) => () => state.msgStatus,
    getFighterOne: (state) => state.fighterOne,
    getFighterTwo: (state) => state.fighterTwo,
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
    },
    setFighterOne(state, fighter) {
        state.fighterOne = fighter;
    },
    setFighterTwo(state, fighter) {
        state.fighterTwo = fighter;
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
    async startFight({commit, dispatch}) {

        // Запускаем ожидания боя
        commit('setWaitingFight', true);
        commit("setMsgStatus", i18n.global.t('arena.lblSearchOpponent'));

        try {
            const newFight = await fightService.createFight(state.arenaSettings)

            // Выставляем модель текущего боя после получения данных
            commit('setCurrentFight', newFight);

            // Используем экшен для загрузки бойцов
            const [fighterOne, fighterTwo] = await Promise.all([
                dispatch('loadFighter', newFight.fighterOne),
                dispatch('loadFighter', newFight.fighterTwo)
            ]);

            // Устанавливаем бойцов в состояние
            commit('setFighterOne', fighterOne);
            commit('setFighterTwo', fighterTwo);

            await router.push(`/fight/${newFight.id}`)

        } catch (error) {
            commit("setMsgStatus", error);
        }

        commit('setWaitingFight', false);
    },
    async endFight({commit, dispatch}) {
        console.log('endFight');
        // Подсчет результатов,
    },
    async getFightById({ commit, dispatch, getters }, fightId) {
        try {
            let fight = getters.getCurrentFight();

            // Проверяем, нужно ли загружать бой заново
            if (!fight || fight.id !== fightId) {
                fight = await fightService.getFightFromLocalAndAPI(fightId);
                if (fight) {
                    commit('setCurrentFight', fight);
                }
            }

            if(!getters.getFighterOne || !getters.getFighterTwo) {
                // Загружаем бойцов
                const [fighterOne, fighterTwo] = await Promise.all([
                    dispatch('loadFighter', fight.fighterOne),
                    dispatch('loadFighter', fight.fighterTwo)
                ]);

                commit('setFighterOne', fighterOne);
                commit('setFighterTwo', fighterTwo);
            }

            return fight;
        } catch (error) {
            console.error('Error fetching fight:', error);
            throw error;
        }
    },
    async loadFighter({commit, rootGetters}, fighterId) {
        const master = rootGetters['master/getMaster'];

        let fighter;
        if (fighterId === master.userData.id) {
            fighter = master.userData;
        } else {
            fighter = await userService.getUserFromLocalAndAPI(fighterId);
        }

        return fighter;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
