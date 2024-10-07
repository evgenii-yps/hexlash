import * as fightService from "@/core/services/fightService.js";
import {i18n} from "@/main.js";
import router from "@/router/index.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";

const state = {
    arenaSettings: {bet: 10, actions: 5, time: 10, isDisableFight: false},
    waitingFight: false,
    msgStatus: null,
    currentFight: null,
    fighterOne: null,
    fighterTwo: null,
    isFightActive: false,
};

const getters = {
    getCurrentFight: (state) => () => state.currentFight,
    getArenaSettings: (state) => () => state.arenaSettings,
    isWaitingFight: (state) => () => state.waitingFight,
    getMsgStatus: (state) => () => state.msgStatus,
    getFighterOne: (state) => state.fighterOne,
    getFighterTwo: (state) => state.fighterTwo,
    isFightActive: (state) => state.isFightActive,
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
    },
    setFightActive(state, isActive) {
        state.isFightActive = isActive;
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

        commit('setCurrentFight', null);
        commit('setFighterOne', null);
        commit('setFighterTwo', null);

        // Проверяем достаточно ли баланса у пользователя
        const master = rootGetters['master/getMaster'];
        const balance = master.getBalance();

        if (balance < state.arenaSettings.bet) {
            commit('master/setInfoMessage',
                InfoMessageModel.withTimeout(i18n.global.t("arena.insufficientFunds"), 1500),
                {root: true});

            commit('setWaitingFight', false);

            await router.push("/arena");

            return;
        }

        try {
            await fightService.sendFightRequest(state.arenaSettings)
        } catch (error) {
            commit("setMsgStatus", error);
        }

    },
    async receiveUpdateFightInfo({commit, dispatch}, fightInfo) {
        commit('setWaitingFight', false);

        // Выставляем модель текущего боя после получения данных
        commit('setCurrentFight', fightInfo);

        // Проверяем, идет ли бой
        if (!this.state.isFightActive) {
            // Если бой не идет, это первое сообщение, загружаем бойцов
            commit('setCurrentFight', fightInfo);

            const fighterPromises = [];

            // Проверяем, есть ли ID бойцов и добавляем их в массив промисов
            if (fightInfo.fighterOne != null) {
                fighterPromises.push(this.dispatch('fight/loadFighter', fightInfo.fighterOne));
            }
            if (fightInfo.fighterTwo != null) {
                fighterPromises.push(this.dispatch('fight/loadFighter', fightInfo.fighterTwo));
            }

            const [fighterOne, fighterTwo] = await Promise.all(fighterPromises);

            // Устанавливаем бойцов в состояние
            commit('setFighterOne', fighterOne);
            commit('setFighterTwo', fighterTwo);

            // Устанавливаем флаг боя в true
            commit('setFightActive', true);

            // Навигируем к экрану боя
            await router.push(`/fight/${fightInfo.id}`);
        } else if (fightInfo.isCompleted) {
            commit('setFightActive', false);
        } else {
            commit('setCurrentFight', fightInfo);
        }

    },
    async sendFightAction({commit}, payload) {
        await fightService.sendFightAction(payload.fightId, payload.fightAction)
    },
    async getFightById({commit, dispatch, getters}, fightId) {
        try {
            let fight = getters.getCurrentFight();

            // Проверяем, нужно ли загружать бой заново
            if (!fight || fight.id !== fightId) {
                fight = await fightService.getFightFromLocalAndAPI(fightId);
                if (fight) {
                    commit('setCurrentFight', fight);
                }
            }

            if (!getters.getFighterOne || !getters.getFighterTwo) {

                const fighterPromises = [];

                if (fight.fighterOne != null) {
                    fighterPromises.push(this.dispatch('fight/loadFighter', fight.fighterOne));
                }
                if (fight.fighterTwo != null) {
                    fighterPromises.push(this.dispatch('fight/loadFighter', fight.fighterTwo));
                }

                const [fighterOne, fighterTwo] = await Promise.all(fighterPromises);

                commit('setFighterOne', fighterOne);
                commit('setFighterTwo', fighterTwo);
            }
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
            fighter = this.dispatch('user/getUserById', fighterId);
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
