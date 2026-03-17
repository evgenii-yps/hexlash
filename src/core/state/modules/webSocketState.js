import WebSocketClient from "@/core/websocket/WebSocketClient.js";
import {PunchInfoModel} from "@/core/models/punchInfoModel.js";
import * as punchService from "@/core/services/punchService.js";
import * as fightService from "@/core/services/fightService.js";
import {FightModel} from "@/core/models/fightModel.js";
import {ErrorSocketResponse} from "@/core/models/ws/res/ErrorSocket.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import store from "@/core/state/store.js";
import {MasterModel} from "@/core/models/masterModel.js";
import {SocialTaskModel} from "@/core/models/socialTaskModel.js";
import {DailyTaskModel} from "@/core/models/dailyTaskModel.js";
import {AchievementModel} from "@/core/models/achievementModel.js";
import {validateJwtToken} from "@/core/services/masterService.js";
import router from "@/router/index.js";
import {isMockMode} from "@/core/mock/mockData.js";

const state = {
    isConnected: false,
    socketClient: null,
    reconnectInterval: null, // Интервал для повторных попыток подключения
    reconnectTimeout: 10000,  // Интервал времени между попытками
};

const getters = {
    isConnected: (state) => state.isConnected,
};

const mutations = {
    setConnected(state, isConnected) {
        state.isConnected = isConnected;
    },
    setSocketClient(state, client) {
        state.socketClient = client;
    },
    setReconnectInterval(state, interval) {
        state.reconnectInterval = interval;
    },
    clearReconnectInterval(state) {
        if (state.reconnectInterval) {
            clearInterval(state.reconnectInterval);
            state.reconnectInterval = null;
        }
    },
};

const actions = {
    connectWebSocket({commit, state, rootGetters}) {
        if (isMockMode()) {
            console.log('[MOCK] WebSocket connection skipped');
            commit('setConnected', true);
            return;
        }

        console.log('Attempting to connect to WebSocket...');

        if (state.isConnected) {
            console.log('WebSocket is already connected. No need to reconnect.');
            return; // Если уже подключен, выходим из функции
        }

        if (!state.socketClient) {
            const jwtToken = rootGetters['master/getJwtToken'];

            if (!jwtToken || !validateJwtToken(jwtToken)) {
                console.log('Jwt token is missing');

                store.dispatch('master/logout')
                    .then(() => {
                        console.error('Token is invalid or missing');
                    });

                return;
            }

            const socketClient = new WebSocketClient("Bearer_" + jwtToken);

            commit('setSocketClient', socketClient);
        }

        state.socketClient.connect();
    },

    disconnectWebSocket({commit, state}) {
        if (state.socketClient) {
            state.socketClient.close();
            commit('setConnected', false);
            commit('clearReconnectInterval');

            state.socketClient = null;
        }
    },

    attemptReconnect({commit, state, rootGetters}) {
        if (rootGetters['master/getLoginState'].isAuthenticated && !state.isConnected && !state.reconnectInterval) {
            state.socketClient = null;

            console.log('Attempting to reconnect to WebSocket in 10 seconds...');
            const interval = setInterval(async () => {
                try {
                    console.log('Reconnecting...');
                    await store.dispatch('webSocket/connectWebSocket');
                } catch (error) {
                    console.error('Reconnect failed:', error);
                }
            }, state.reconnectTimeout);

            commit('setReconnectInterval', interval);
        }
    },

    sendMessage({state}, message) {
        if (isMockMode()) {
            console.log('[MOCK] WebSocket message:', message);
            return;
        }
        state.socketClient.sendMessage(message);
    },

    async handleMessage({commit}, message) {
        console.log('Received WebSocket message', message);

        const messageType = message.type;

        switch (messageType) {
            case PunchInfoModel.TYPE_NAME:
                const punchInfoModel = PunchInfoModel.fromJSON(message.punchInfoResponse)
                await punchService.receivePunchBatch(punchInfoModel);
                break;
            case FightModel.TYPE_NAME:
                const fightInfoModel = FightModel.fromJSON(message.fightInfo)
                await fightService.receiveFightInfo(fightInfoModel);
                break;
            case ErrorSocketResponse.TYPE_NAME:
                const errorSocketModel = ErrorSocketResponse.fromJSON(message.errorDto)
                await store.dispatch('webSocket/handleInternalError', errorSocketModel);
                break;
            case MasterModel.TYPE_NAME:
                const masterModel = MasterModel.fromJSON(message.userResponse)
                await store.dispatch('master/updateMasterFromSocket', masterModel);
                break;
            case SocialTaskModel.TYPE_NAME:
                let taskModel;
                if (message.taskResponse.type === 'SOCIAL') {
                    taskModel = SocialTaskModel.fromJSON(message.taskResponse)
                    await store.dispatch('task/receivedSocialTask', taskModel);
                } else if (message.taskResponse.type === 'DAILY') {
                    taskModel = DailyTaskModel.fromJSON(message.taskResponse)
                    await store.dispatch('task/receivedDailyTask', taskModel);
                }
                break;
            case AchievementModel.TYPE_NAME:
                const achievementModel = AchievementModel.fromJSON(message.achievementResponse)
                await store.dispatch('achievement/receivedAchievement', achievementModel);
                break;
            case 'MatchFoundMsg':
                window.dispatchEvent(new CustomEvent('matchmaking-match-found', { detail: message }));
                break;
            case 'MatchmakingQueueMsg':
                window.dispatchEvent(new CustomEvent('matchmaking-queue-update', { detail: message }));
                break;
            case 'MatchmakingCancelledMsg':
                window.dispatchEvent(new CustomEvent('matchmaking-cancelled', { detail: message }));
                break;
            case 'fight_start':
            case 'round_result':
            case 'dice_pause':
            case 'dice_result':
            case 'coach_pause':
            case 'coach_result':
            case 'fight_end':
                window.dispatchEvent(new CustomEvent('pvp-' + messageType, { detail: message }));
                break;
            // ─── Challenge messages ─────────────────────────────────────
            case 'challenge_received':
                store.commit('friends/setIncomingChallenge', message.from);
                window.dispatchEvent(new CustomEvent('challenge-received', { detail: message }));
                break;
            case 'challenge_sent':
                window.dispatchEvent(new CustomEvent('challenge-sent', { detail: message }));
                break;
            case 'challenge_declined':
                store.commit('friends/clearOutgoingChallenge');
                window.dispatchEvent(new CustomEvent('challenge-declined-response', { detail: message }));
                break;
            case 'challenge_error':
                store.commit('friends/clearOutgoingChallenge');
                window.dispatchEvent(new CustomEvent('challenge-error', { detail: message }));
                break;
            case 'challenge_start':
                store.commit('friends/clearOutgoingChallenge');
                store.commit('friends/clearIncomingChallenge');
                window.dispatchEvent(new CustomEvent('challenge-start', { detail: message }));
                break;
            default:
                console.warn(`Unknown message type received: ${messageType}`);
                break;
        }
    },
    async handleConnectionError({commit, dispatch}, error) {
        // Обработка ошибок соединения
        console.error('WebSocket error:', error);

        await dispatch('attemptReconnect')
    },
    handleInternalError({commit}, error) {
        const socketError = InfoMessageModel.withTimeout(error.message, 3000);
        store.commit('master/setErrorMessage', socketError);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
