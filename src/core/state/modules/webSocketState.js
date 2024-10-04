import WebSocketClient from "@/core/websocket/WebSocketClient.js";
import {PunchInfoModel} from "@/core/models/punchInfoModel.js";
import * as punchService from "@/core/services/punchService.js";

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
        console.log('Attempting to connect to WebSocket...');

        if (state.isConnected) {
            console.log('WebSocket is already connected. No need to reconnect.');
            return; // Если уже подключен, выходим из функции
        }

        if (!state.socketClient) {
            const jwtToken = rootGetters['master/getJwtToken'];
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
        }
    },

    attemptReconnect({commit, state, dispatch, rootGetters}) {
        if (rootGetters['master/getLoginState'].isAuthenticated && !state.isConnected && !state.reconnectInterval) {
            console.log('Attempting to reconnect to WebSocket in 10 seconds...');
            const interval = setInterval(() => {
                console.log('Reconnecting...');
                dispatch('connectWebSocket');
            }, state.reconnectTimeout);

            commit('setReconnectInterval', interval);
        }
    },

    sendMessage({state}, message) {
        state.socketClient.sendMessage(message);
    },

    async handleMessage({commit}, message) {
        console.log('Received WebSocket message:', message);

        const messageType = message.type;

        switch (messageType) {
            case PunchInfoModel.TYPE_NAME:
                const punchInfoModel = PunchInfoModel.fromJSON(message.punchInfoResponse)
                console.log('PunchInfo:', punchInfoModel);
                await punchService.receivePunchBatch(punchInfoModel);
                break;
            default:
                console.warn(`Unknown message type received: ${messageType}`);
                break;
        }
    },

    handleError({commit}, error) {
        // Обработка ошибок
        console.error('WebSocket error:', error.message);

        this.dispatch('webSocket/attemptReconnect')
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
