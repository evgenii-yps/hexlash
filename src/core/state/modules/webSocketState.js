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

const RECONNECT_BASE_MS = 10000;   // initial delay: 10s
const RECONNECT_MAX_MS = 300000;   // max delay: 5 min
const RECONNECT_JITTER = 0.2;      // ±20% jitter

const state = {
    isConnected: false,
    socketClient: null,
    reconnectTimer: null,
    reconnectDelay: RECONNECT_BASE_MS,
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
    setReconnectTimer(state, timer) {
        state.reconnectTimer = timer;
    },
    clearReconnectTimer(state) {
        if (state.reconnectTimer) {
            clearTimeout(state.reconnectTimer);
            state.reconnectTimer = null;
        }
    },
    resetReconnectDelay(state) {
        state.reconnectDelay = RECONNECT_BASE_MS;
    },
};

const actions = {
    connectWebSocket({commit, state, rootGetters}) {
        if (isMockMode()) {
            commit('setConnected', true);
            return;
        }

        if (state.isConnected) {
            return; // Если уже подключен, выходим из функции
        }

        if (!state.socketClient) {
            const jwtToken = rootGetters['master/getJwtToken'];

            if (!jwtToken || !validateJwtToken(jwtToken)) {
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
            commit('clearReconnectTimer');
            commit('resetReconnectDelay');

            state.socketClient = null;
        }
    },

    attemptReconnect({commit, state, rootGetters}) {
        if (!rootGetters['master/getLoginState'].isAuthenticated || state.isConnected || state.reconnectTimer) {
            return;
        }

        state.socketClient = null;

        // Apply jitter: delay ± 20%
        const jitter = 1 + (Math.random() * 2 - 1) * RECONNECT_JITTER;
        const delay = Math.round(state.reconnectDelay * jitter);

        const timer = setTimeout(async () => {
            commit('setReconnectTimer', null);
            try {
                await store.dispatch('webSocket/connectWebSocket');
            } catch (error) {
                console.error('Reconnect failed:', error);
            }
            // If still not connected after attempt, schedule next with doubled delay
            if (!state.isConnected) {
                state.reconnectDelay = Math.min(state.reconnectDelay * 2, RECONNECT_MAX_MS);
                store.dispatch('webSocket/attemptReconnect');
            }
        }, delay);

        commit('setReconnectTimer', timer);
    },

    sendMessage({state}, message) {
        if (isMockMode()) {
            return;
        }
        state.socketClient.sendMessage(message);
    },

    async handleMessage({commit}, message) {
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
            case 'matchmaking_timeout':
                window.dispatchEvent(new CustomEvent('matchmaking-timeout', { detail: message }));
                break;
            case 'match_cancelled':
                window.dispatchEvent(new CustomEvent('match-cancelled', { detail: message }));
                break;
            case 'fight_start':
            case 'round_result':
            case 'dice_available':
            case 'dice_rolled':
            case 'dice_error':
            case 'coach_pause':
            case 'coach_result':
            case 'coach_opponent_ready':
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
            // ─── Clan invite messages ────────────────────────────────────
            case 'clan_invite':
                window.dispatchEvent(new CustomEvent('clan-invite-received', { detail: message }));
                break;
            case 'clan_invite_accepted':
                window.dispatchEvent(new CustomEvent('clan-invite-accepted', { detail: message }));
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
