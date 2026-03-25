const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET, COST_PER_CLICK, DECIMALS, PUNCH_MAX_PER_INTERVAL, PUNCH_MAX_PER_BATCH, PUNCH_INTERVAL_MS } = require('../config');
const clients = new Map(); // userId -> ws
const matchmaking = require('../services/matchmaking');
const pvpMatchManager = require('../services/pvpMatchManager');
const { handlePvPMessage, handlePvPDisconnect } = require('./pvpHandler');

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws, req) => {
    // Extract token from protocol
    const protocols = ws.protocol ? ws.protocol.split(',').map(p => p.trim()) : [];
    let token = null;

    for (const p of protocols) {
      if (p.startsWith('Bearer_')) {
        token = p.replace('Bearer_', '');
        break;
      }
    }

    // Also check from sec-websocket-protocol header
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

    // Register client
    clients.set(userId, ws);
    console.log(`WebSocket: user ${userId} connected. Total: ${clients.size}`);

    ws.on('message', async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        await handleMessage(ws, userId, msg);
      } catch (err) {
        console.error('WebSocket message error:', err);
        sendError(ws, 500, 'Failed to process message');
      }
    });

    ws.on('close', () => {
      clients.delete(userId);
      matchmaking.removeFromQueue(userId);
      handlePvPDisconnect(userId);
      console.log(`WebSocket: user ${userId} disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for user ${userId}:`, err.message);
      clients.delete(userId);
      matchmaking.removeFromQueue(userId);
      handlePvPDisconnect(userId);
    });
  });

  return wss;
}

async function handleMessage(ws, userId, msg) {
  const { type } = msg;
  console.log('[WS] Received:', type, 'from:', userId);

  switch (type) {
    case 'PunchInfoRequestMsg':
      await handlePunchInfoRequest(ws, userId);
      break;

    case 'PunchBatchRequestMsg':
      await handlePunchBatch(ws, userId, msg);
      break;

    case 'FightTicketMsg':
      await handleFightTicket(ws, userId, msg);
      break;

    case 'FightActionMsg':
      await handleFightAction(ws, userId, msg);
      break;

    case 'MatchmakingStartMsg':
      handleMatchmakingStart(ws, userId, msg);
      break;

    case 'MatchmakingCancelMsg':
      handleMatchmakingCancel(ws, userId);
      break;

    case 'pvp_ready':
    case 'dice_roll':
    case 'dice_choice':
    case 'coach_choice':
      handlePvPMessage(ws, msg, { odId: userId });
      break;

    case 'challenge_send':
      handleChallengeSend(ws, userId, msg);
      break;

    case 'challenge_accepted':
      handleChallengeAccepted(ws, userId, msg);
      break;

    case 'challenge_declined':
      handleChallengeDeclined(ws, userId, msg);
      break;

    default:
      sendError(ws, 400, `Unknown message type: ${type}`);
  }
}

async function handlePunchInfoRequest(ws, userId) {
  let punchInfo = await prisma.punchInfo.findUnique({ where: { userId } });

  if (!punchInfo) {
    punchInfo = await prisma.punchInfo.create({
      data: {
        userId,
        punchAmount: 0,
        punchCount: 0,
        intervalStartMs: BigInt(Date.now()),
        punchAmountMaxPerInterval: PUNCH_MAX_PER_INTERVAL,
        punchAmountMaxPerBatch: PUNCH_MAX_PER_BATCH,
        intervalWaitTimeMs: BigInt(PUNCH_INTERVAL_MS),
      },
    });
  }

  // Check if interval has passed, reset if so
  const now = Date.now();
  const intervalStart = Number(punchInfo.intervalStartMs);
  const intervalWait = Number(punchInfo.intervalWaitTimeMs);

  if (now - intervalStart > intervalWait) {
    punchInfo = await prisma.punchInfo.update({
      where: { userId },
      data: {
        punchAmount: 0,
        intervalStartMs: BigInt(now),
      },
    });
  }

  sendMessage(ws, {
    type: 'PunchInfoResponseMsg',
    punchInfoResponse: {
      intervalStartMs: Number(punchInfo.intervalStartMs),
      intervalWaitTimeMs: Number(punchInfo.intervalWaitTimeMs),
      punchAmount: punchInfo.punchAmount,
      punchAmountMaxPerInterval: punchInfo.punchAmountMaxPerInterval,
      punchAmountMaxPerBatch: punchInfo.punchAmountMaxPerBatch,
      punchCount: punchInfo.punchCount,
    },
  });
}

async function handlePunchBatch(ws, userId, msg) {
  const { punchBatchRequest } = msg;
  if (!punchBatchRequest) {
    sendError(ws, 400, 'Missing punchBatchRequest');
    return;
  }

  const { amount, count } = punchBatchRequest;

  let punchInfo = await prisma.punchInfo.findUnique({ where: { userId } });
  if (!punchInfo) {
    punchInfo = await prisma.punchInfo.create({
      data: {
        userId,
        punchAmount: 0,
        punchCount: 0,
        intervalStartMs: BigInt(Date.now()),
        punchAmountMaxPerInterval: PUNCH_MAX_PER_INTERVAL,
        punchAmountMaxPerBatch: PUNCH_MAX_PER_BATCH,
        intervalWaitTimeMs: BigInt(PUNCH_INTERVAL_MS),
      },
    });
  }

  // Check interval reset
  const now = Date.now();
  const intervalStart = Number(punchInfo.intervalStartMs);
  const intervalWait = Number(punchInfo.intervalWaitTimeMs);

  if (now - intervalStart > intervalWait) {
    punchInfo = await prisma.punchInfo.update({
      where: { userId },
      data: { punchAmount: 0, intervalStartMs: BigInt(now) },
    });
  }

  // Check limits
  if (punchInfo.punchAmount + count > punchInfo.punchAmountMaxPerInterval) {
    sendError(ws, 400, 'Punch interval limit reached');
    return;
  }

  if (count > punchInfo.punchAmountMaxPerBatch) {
    sendError(ws, 400, 'Punch batch limit exceeded');
    return;
  }

  // Update punch info and user balance
  const tokensEarned = count * COST_PER_CLICK;

  punchInfo = await prisma.punchInfo.update({
    where: { userId },
    data: {
      punchAmount: { increment: count },
      punchCount: { increment: count },
    },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      balance: { increment: tokensEarned },
      totalTaps: { increment: count },
    },
    include: { achievements: true },
  });

  // Send updated punch info
  sendMessage(ws, {
    type: 'PunchInfoResponseMsg',
    punchInfoResponse: {
      intervalStartMs: Number(punchInfo.intervalStartMs),
      intervalWaitTimeMs: Number(punchInfo.intervalWaitTimeMs),
      punchAmount: punchInfo.punchAmount,
      punchAmountMaxPerInterval: punchInfo.punchAmountMaxPerInterval,
      punchAmountMaxPerBatch: punchInfo.punchAmountMaxPerBatch,
      punchCount: punchInfo.punchCount,
    },
  });

  // Send updated user info
  const { formatUserResponse } = require('../utils/helpers');
  sendMessage(ws, {
    type: 'UserResponseMsg',
    userResponse: formatUserResponse(user),
  });

  // Check achievements after punching
  await checkPunchAchievements(ws, userId, punchInfo.punchCount);
}

async function handleFightTicket(ws, userId, msg) {
  const { fightTicketRequest } = msg;
  if (!fightTicketRequest) {
    sendError(ws, 400, 'Missing fightTicketRequest');
    return;
  }

  const { bet, actionsNum, durationSec } = fightTicketRequest;

  // Check user balance for bet
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.balance < bet) {
    sendError(ws, 400, 'Insufficient balance for bet');
    return;
  }

  // Create a fight record
  const fight = await prisma.fight.create({
    data: {
      fighterOneId: userId,
      bet,
      duration: durationSec,
      actions: actionsNum,
    },
  });

  // Send fight info back
  sendMessage(ws, {
    type: 'FightInfoMsg',
    fightInfo: {
      fightId: fight.id,
      fighterOneId: userId,
      fighterTwoId: null,
      fighterOneActions: [],
      fighterTwoActions: [],
      winnerId: null,
      bet: fight.bet,
      actionsNum: fight.actions,
      durationSec: fight.duration,
      finished: false,
      createdAt: fight.createdAt.toISOString(),
    },
  });
}

async function handleFightAction(ws, userId, msg) {
  const { fightActionRequest } = msg;
  if (!fightActionRequest) {
    sendError(ws, 400, 'Missing fightActionRequest');
    return;
  }

  // For now, acknowledge the action
  // Full PvP matchmaking would require more complex logic
  sendMessage(ws, {
    type: 'FightInfoMsg',
    fightInfo: {
      fightId: fightActionRequest.fightId,
      fighterOneId: userId,
      fighterTwoId: null,
      fighterOneActions: [fightActionRequest.fightAction],
      fighterTwoActions: [],
      winnerId: null,
      bet: 0,
      actionsNum: 0,
      durationSec: 0,
      finished: false,
      createdAt: new Date().toISOString(),
    },
  });
}

async function checkPunchAchievements(ws, userId, totalPunches) {
  const thresholds = [
    { punches: 100, type: 'CONNECTED_FIGHTER' },
    { punches: 1000, type: 'REGULAR_FIGHTER' },
    { punches: 5000, type: 'BATTLE_VETERAN' },
    { punches: 10000, type: 'FIGHT_MASTER' },
  ];

  for (const threshold of thresholds) {
    if (totalPunches >= threshold.punches) {
      const achievement = await prisma.achievement.findUnique({
        where: { type: threshold.type },
      });

      if (achievement) {
        const existing = await prisma.userAchievement.findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id,
            },
          },
        });

        if (!existing) {
          await prisma.userAchievement.create({
            data: { userId, achievementId: achievement.id },
          });

          sendMessage(ws, {
            type: 'AchievementResponseMsg',
            achievementResponse: {
              type: threshold.type,
              isCompleted: true,
              obtainedAt: Date.now(),
            },
          });
        }
      }
    }
  }
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

// Send message to a specific user by userId
function sendToUser(userId, data) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// ─── Challenges ─────────────────────────────────────────────────────────────

function handleChallengeSend(ws, userId, msg) {
  const { targetUserId, username, rating } = msg;
  const targetSocket = clients.get(targetUserId);

  console.log('[CHALLENGE] From:', userId, 'To:', targetUserId, 'Target online:', !!targetSocket);

  if (!targetSocket) {
    sendMessage(ws, {
      type: 'challenge_error',
      message: 'friend_offline',
    });
    return;
  }

  const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // Send challenge to target
  sendMessage(targetSocket, {
    type: 'challenge_received',
    from: {
      odId: userId,
      username: username || 'Player',
      rating: rating || 1000,
    },
    challengeId,
  });

  // Confirm to sender
  sendMessage(ws, {
    type: 'challenge_sent',
    targetUserId,
  });
}

function handleChallengeAccepted(ws, userId, msg) {
  const { challengerOdId, challengerUsername, challengerRating } = msg;
  const challengerSocket = clients.get(challengerOdId);

  if (!challengerSocket) {
    sendMessage(ws, {
      type: 'challenge_error',
      message: 'challenger_offline',
    });
    return;
  }

  // Fetch acceptor's username from DB
  prisma.user.findUnique({ where: { id: userId } }).then((acceptor) => {
    const acceptorUsername = acceptor?.name || acceptor?.login || 'Player';
    const acceptorRating = acceptor?.rating || 1000;

    // Create match
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    pvpMatchManager.createMatch(matchId, {
      odId: challengerOdId,
      username: challengerUsername || 'Player',
      deck: [],
    }, {
      odId: userId,
      username: acceptorUsername,
      deck: [],
    });

    // Notify challenger — fight starts
    sendMessage(challengerSocket, {
      type: 'challenge_start',
      matchId,
      opponent: {
        odId: userId,
        username: acceptorUsername,
        rating: acceptorRating,
      },
    });

    // Notify acceptor — fight starts
    sendMessage(ws, {
      type: 'challenge_start',
      matchId,
      opponent: {
        odId: challengerOdId,
        username: challengerUsername || 'Player',
        rating: challengerRating || 1000,
      },
    });

    console.log('[CHALLENGE] Match created:', matchId, 'between', challengerOdId, 'and', userId);
  }).catch((err) => {
    console.error('[CHALLENGE] Error creating match:', err);
    sendMessage(ws, {
      type: 'challenge_error',
      message: 'match_creation_failed',
    });
  });
}

function handleChallengeDeclined(ws, userId, msg) {
  const { challengerOdId } = msg;
  const challengerSocket = clients.get(challengerOdId);

  if (challengerSocket) {
    sendMessage(challengerSocket, {
      type: 'challenge_declined',
      declinedBy: userId,
    });
  }
}

// ─── Matchmaking ──────────────────────────────────────────────────────────────

function handleMatchmakingStart(ws, userId, msg) {
  const { username, rating, skin, avatarUrl } = msg.matchmakingRequest || {};
  console.log('[WS] start_matchmaking from:', userId, 'data:', JSON.stringify({ username, rating, skin }));

  const match = matchmaking.addToQueue({
    odId: userId,
    username: username || 'Player',
    rating: rating || 1000,
    skin: skin || null,
    avatarUrl: avatarUrl || null,
  });

  // Send queue update
  sendMessage(ws, {
    type: 'MatchmakingQueueMsg',
    queueSize: matchmaking.getQueueSize(),
  });

  if (match) {
    notifyMatch(match);
  }
}

function handleMatchmakingCancel(ws, userId) {
  matchmaking.removeFromQueue(userId);
  sendMessage(ws, {
    type: 'MatchmakingCancelledMsg',
  });
}

/** Notify both players that a match was found. */
function notifyMatch(match) {
  const ws1 = clients.get(match.player1.odId);
  const ws2 = clients.get(match.player2.odId);

  if (ws1) {
    sendMessage(ws1, {
      type: 'MatchFoundMsg',
      matchId: match.matchId,
      opponent: {
        odId: match.player2.odId,
        username: match.player2.username,
        rating: match.player2.rating,
        skin: match.player2.skin || null,
        avatarUrl: match.player2.avatarUrl || null,
      },
    });
  }

  if (ws2) {
    sendMessage(ws2, {
      type: 'MatchFoundMsg',
      matchId: match.matchId,
      opponent: {
        odId: match.player1.odId,
        username: match.player1.username,
        rating: match.player1.rating,
        skin: match.player1.skin || null,
        avatarUrl: match.player1.avatarUrl || null,
      },
    });
  }
}

// Periodically try to match queued players (in case expand timers find matches)
setInterval(() => {
  for (const [odId] of matchmaking.queue) {
    const match = matchmaking.tryFindMatch(odId);
    if (match) {
      notifyMatch(match);
    }
  }
}, 3000);

module.exports = { setupWebSocket, sendToUser, clients };
