// core/services/webSocketClient.js

import store from "@/core/state/store.js";

class WebSocketClient {
    constructor(jwtToken) {
        this.url = `${__WEB_SOCKET_URL__}/ws`;  // URL WebSocket
        this.protocols = ["fcproto", jwtToken];  // JWT в качестве протокола
        this.socket = null;
        this.messageQueue = [];
        this.isConnecting = false;
        this.pingInterval = null;
    }

    connect() {

        if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
            console.log('WebSocket is already connecting or connected.');
            return;
        }

        this.isConnecting = true; // Устанавливаем флаг, что начинается процесс подключения

        this.socket = new WebSocket(this.url, this.protocols);

        this.socket.onopen = () => {
            console.log('WebSocket connected');

            // Отправляем все сообщения из очереди
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                this.sendMessage(message);
            }

            store.commit('webSocket/setConnected', true);
            store.commit('webSocket/clearReconnectInterval');

            this.isConnecting = false;

            this.setPingInterval(); // TODO удалить когда на сервере будет
        };

        this.socket.onmessage = async (event) => {
            try {
                console.log(event.data);
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

            console.log('WebSocket disconnected ', event);

            store.commit('webSocket/setConnected', false);

            if (event.code !== 1000) {  // 1000 — нормальное закрытие
                console.log('WebSocket disconnected unexpectedly. Attempting reconnection...');
                await store.dispatch('webSocket/attemptReconnect');
            } else {
                console.log('WebSocket closed normally. No reconnection attempt.');
            }

            this.clearPingInterval(); // TODO удалить когда на сервере будет
        };

    }

    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const msgSerialized = JSON.stringify(message)
            console.log("Message:", msgSerialized);
            this.socket.send(msgSerialized);
        } else {
            console.log("Queue message:", message);
            this.messageQueue.push(message);
            console.warn('WebSocket is not connected. Message queued.');
        }
    }

    close() {
        if (this.socket) {
            this.socket.close(1000, "Normal closure");
        }
        this.isConnecting = false;

        this.clearPingInterval(); // TODO удалить когда на сервере будет
    }


    // TODO удалить когда на сервере будет
    setPingInterval() {
        this.clearPingInterval();
        this.pingInterval = setInterval(() => {
            console.log('ping');
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({type: 'ping'}));
            }
        }, 30000); // 30 сек
    }

// TODO удалить когда на сервере будет
    clearPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}

export default WebSocketClient;
