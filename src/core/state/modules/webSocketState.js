import WebSocketClient from "@/core/websocket/WebSocketClient.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import store from "@/core/state/store.js";
import {validateJwtToken} from "@/core/services/masterService.js";
import {isMockMode} from "@/core/mock/mockData.js";

// Game message routing removed in the game-cleanup reset. This module now
// keeps only the authenticated WebSocket connection scaffold (connect /
// disconnect / reconnect). Incoming messages are ignored until the new
// game layer wires its own handlers.

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
            return;
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
        if (state.socketClient) {
            state.socketClient.sendMessage(message);
        }
    },

    // Game message routing removed — incoming messages are ignored.
    async handleMessage(_ctx, _message) {
        // no-op until the new game layer registers handlers
    },

    async handleConnectionError({dispatch}, error) {
        console.error('WebSocket error:', error);
        await dispatch('attemptReconnect');
    },

    handleInternalError(_ctx, error) {
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
