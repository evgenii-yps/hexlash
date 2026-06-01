const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, WS_PING_INTERVAL_MS } = require('../config');

// Game-cleanup reset: all game WebSocket message handling (punch, fight,
// matchmaking, PvP, challenges, spectate) was removed. This keeps only the
// authenticated connection scaffold — JWT handshake, client registry,
// heartbeat (ping/pong), connect/disconnect lifecycle. Incoming messages are
// acknowledged-as-unknown until the new game layer registers handlers.

const clients = new Map(); // userId -> ws

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws, req) => {
    // Extract JWT from the WebSocket subprotocol ("Bearer_<token>").
    const protocols = ws.protocol ? ws.protocol.split(',').map(p => p.trim()) : [];
    let token = null;

    for (const p of protocols) {
      if (p.startsWith('Bearer_')) {
        token = p.replace('Bearer_', '');
        break;
      }
    }

    if (!token) {
      const protocolHeader = req.headers['sec-websocket-protocol'];
      if (protocolHeader) {
        const parts = protocolHeader.split(',').map(p => p.trim());
        for (const p of parts) {
          if (p.startsWith('Bearer_')) {
            token = p.replace('Bearer_', '');
            break;
          }
        }
      }
    }

    if (!token) {
      ws.close(4001, 'No auth token');
      return;
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      ws.close(4001, 'Invalid token');
      return;
    }

    // Close existing connection if user reconnects
    const existingWs = clients.get(userId);
    if (existingWs && existingWs !== ws) {
      existingWs._replaced = true;
      if (existingWs.readyState === existingWs.OPEN) {
        existingWs.close(4000, 'Replaced by new connection');
      }
    }

    clients.set(userId, ws);
    ws.isAlive = true;
    console.log(`WebSocket: user ${userId} connected. Total: ${clients.size}`);

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        handleMessage(ws, userId, msg);
      } catch (err) {
        console.error('WebSocket message error:', err);
        sendError(ws, 500, 'Failed to process message');
      }
    });

    ws.on('close', () => {
      if (ws._replaced) return;
      clients.delete(userId);
      console.log(`WebSocket: user ${userId} disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for user ${userId}:`, err.message);
      if (ws._replaced) return;
      clients.delete(userId);
    });
  });

  // Heartbeat: ping every WS_PING_INTERVAL_MS, terminate if no pong.
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, WS_PING_INTERVAL_MS);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}

function handleMessage(ws, userId, msg) {
  // No game message types are handled after the reset.
  sendError(ws, 400, `Unknown message type: ${msg && msg.type}`);
}

function sendMessage(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendError(ws, code, message) {
  sendMessage(ws, {
    type: 'ErrorMsg',
    errorDto: { code, message },
  });
}

// Send a message to a specific user by userId (kept for the new game layer).
function sendToUser(userId, data) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

module.exports = { setupWebSocket, sendToUser, clients };
