// core/services/webSocketClient.js

import store from "@/core/state/store.js";

class WebSocketClient {
    constructor(jwtToken) {
        this.url = `${__WEB_SOCKET_URL__}/ws`;  // URL WebSocket
        this.protocols = ["fcproto", jwtToken];  // JWT в качестве протокола
        this.socket = null;
        this.messageQueue = [];
    }

    connect() {
        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
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
                await store.dispatch('webSocket/handleError', error);
            };

            this.socket.onclose = async (event) => {
                console.log('WebSocket disconnected');

                store.commit('webSocket/setConnected', false);
                await store.dispatch('webSocket/attemptReconnect')
            };
        }
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
            this.socket.close();
        }
    }
}

export default WebSocketClient;
