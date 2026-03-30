// core/services/webSocketClient.js

import store from "@/core/state/store.js";

class WebSocketClient {
    constructor(jwtToken) {
        this.url = `${__WEB_SOCKET_URL__}/ws`;  // URL WebSocket
        this.protocols = ["fcproto", jwtToken];  // JWT в качестве протокола
        this.socket = null;
        this.messageQueue = [];
        this.isConnecting = false;
    }

    connect() {

        if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
            return;
        }

        this.isConnecting = true; // Устанавливаем флаг, что начинается процесс подключения

        this.socket = new WebSocket(this.url, this.protocols);

        this.socket.onopen = () => {
            // Отправляем все сообщения из очереди
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                this.sendMessage(message);
            }

            store.commit('webSocket/setConnected', true);
            store.commit('webSocket/clearReconnectTimer');
            store.commit('webSocket/resetReconnectDelay');

            this.isConnecting = false;

        };

        this.socket.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                await store.dispatch('webSocket/handleMessage', message);
            } catch (err) {
                console.error('Error processing WebSocket message:', err);
            }
        };


        this.socket.onerror = async (error) => {
            this.isConnecting = false;
            await store.dispatch('webSocket/handleConnectionError', error);
        };

        this.socket.onclose = async (event) => {
            this.isConnecting = false;

            store.commit('webSocket/setConnected', false);

            if (event.code !== 1000) {  // 1000 — нормальное закрытие
                await store.dispatch('webSocket/attemptReconnect');
            }
        };

    }

    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const msgSerialized = JSON.stringify(message)
            this.socket.send(msgSerialized);
        } else {
            this.messageQueue.push(message);
            console.warn('WebSocket is not connected. Message queued.');
        }
    }

    close() {
        if (this.socket) {
            this.socket.close(1000, "Normal closure");
        }
        this.isConnecting = false;
    }





}

export default WebSocketClient;
