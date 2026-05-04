const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET, COST_PER_CLICK, DECIMALS, PUNCH_MAX_PER_INTERVAL, PUNCH_MAX_PER_BATCH, PUNCH_INTERVAL_MS, WS_PING_INTERVAL_MS, WS_PONG_TIMEOUT_MS, CLAN_TAP_SHARE } = require('../config');
const clients = new Map(); // userId -> ws
const matchmaking = require('../services/matchmaking');
const pvpMatchManager = require('../services/pvpMatchManager');
const PvPCombatEngine = require('../services/pvpCombatEngine');
const { handlePvPMessage, handlePvPDisconnect } = require('./pvpHandler');

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  // Register sendToUser callback in matchmaking to avoid circular dependency
  matchmaking.setSendToUser(sendToUser);

  // Sub-epic 6 C4 — wire spectator socket lookup for pvpCombatEngine.sendToSpectators (C2 helper).
  // Mirrors matchmaking.setSendToUser pattern above. Avoids engine→handler.js circular dep.
  PvPCombatEngine.setSocketLookup((userId) => clients.get(userId));

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

    // Close existing connection if user reconnects
    const existingWs = clients.get(userId);
    let isReconnect = false;
    if (existingWs && existingWs !== ws) {
      isReconnect = true;
      // Mark old socket as replaced so its close handler won't trigger PvP disconnect
      existingWs._replaced = true;
      if (existingWs.readyState === existingWs.OPEN) {
        existingWs.close(4000, 'Replaced by new connection');
      }
    }

    // Register client
    clients.set(userId, ws);
    ws.isAlive = true;
    console.log(`WebSocket: user ${userId} connected. Total: ${clients.size}`);

    // Re-bind socket to active PvP match on reconnect
    if (isReconnect) {
      const activeMatch = pvpMatchManager.getMatchByPlayer(userId);
      if (activeMatch && activeMatch.status !== 'finished') {
        if (activeMatch.player1.odId === userId) {
          activeMatch.player1.socket = ws;
        } else if (activeMatch.player2.odId === userId) {
          activeMatch.player2.socket = ws;
        }
        // Sub-epic 4b — emit state snapshot for FE state-replay (Option α minimal).
        // match IS engine instance (no .engine property — C3/C4 precedent).
        // Status guard above ensures no emit for finished matches (FE already
        // received fight_end). Snapshot includes pendingChoices so FE can
        // re-render coach pause overlay if reconnect during paused_coach state.
        // Flat WS shape per engine.emit / sendToPlayer convention.
        const snapshot = activeMatch.getStateSnapshot();
        try {
          ws.send(JSON.stringify({ type: 'fight_state_resume', ...snapshot }));
        } catch (e) {
          console.error('[PVP] Failed to send fight_state_resume:', e.message);
        }
        console.log(`[PVP] Reconnected player ${userId} to match ${activeMatch.matchId}`);
      }
    }

    ws.on('pong', () => { ws.isAlive = true; });

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
      // If this socket was replaced by a new connection, don't trigger PvP disconnect
      if (ws._replaced) return;
      clients.delete(userId);
      matchmaking.removeFromQueue(userId);
      handlePvPDisconnect(userId);
      console.log(`WebSocket: user ${userId} disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for user ${userId}:`, err.message);
      if (ws._replaced) return;
      clients.delete(userId);
      matchmaking.removeFromQueue(userId);
      handlePvPDisconnect(userId);
    });
  });

  // ─── Heartbeat: ping every WS_PING_INTERVAL_MS, kill if no pong ───────────
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

async function handleMessage(ws, userId, msg) {
  const { type } = msg;

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

    case 'SpectateJoinMsg':
      await handleSpectateJoin(ws, userId, msg);
      break;

    case 'SpectateLeaveMsg':
      handleSpectateLeave(ws, userId);
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

  // Credit 5% of taps to clan treasury
  if (user.clanId && count >= 20) {
    const clanShare = Math.max(1, Math.floor(count * CLAN_TAP_SHARE));
    prisma.clan.update({
      where: { id: user.clanId },
      data: { balance: { increment: clanShare } },
    }).catch(e => console.error('Clan balance error:', e.message));
  }

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
  const { targetUserId, username, rating, challengerSkin, challengerAvatarUrl } = msg;
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
      skin: challengerSkin || null,
      avatarUrl: challengerAvatarUrl || null,
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
  const { challengerSkin, challengerAvatarUrl } = msg;

  prisma.user.findUnique({ where: { id: userId } }).then((acceptor) => {
    const acceptorUsername = acceptor?.name || acceptor?.login || 'Player';
    const acceptorRating = acceptor?.rating || 1000;
    const acceptorSkin = acceptor?.skin || null;
    const acceptorAvatarUrl = acceptor?.avatarUrl || null;

    // Create match
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    pvpMatchManager.createMatch(matchId, {
      odId: challengerOdId,
      username: challengerUsername || 'Player',
      skin: challengerSkin || null,
      avatarUrl: challengerAvatarUrl || null,
      deck: [],
    }, {
      odId: userId,
      username: acceptorUsername,
      skin: acceptorSkin,
      avatarUrl: acceptorAvatarUrl,
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
        skin: acceptorSkin,
        avatarUrl: acceptorAvatarUrl,
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
        skin: challengerSkin || null,
        avatarUrl: challengerAvatarUrl || null,
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

async function handleMatchmakingStart(ws, userId, msg) {
  const { getCaptainForCombat } = require('../services/captainService');
  const { username, skin, avatarUrl } = msg.matchmakingRequest || {};

  // Validate Captain exists + use authoritative ELO from DB
  const captain = await getCaptainForCombat(userId);
  if (!captain) {
    sendMessage(ws, { type: 'ErrorMsg', error: 'No Captain set. Create a fighter in Club Mode first.', code: 'NO_CAPTAIN_SET' });
    return;
  }

  const match = matchmaking.addToQueue({
    odId: userId,
    username: captain.name || username || 'Player',
    rating: captain.elo || 1000, // Authoritative from DB, not client
    skin: captain.skin || skin || null,
    avatarUrl: avatarUrl || null,
  });

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

// ── SUB-EPIC 6 — SPECTATE HANDLERS ────────────────────────────────────────

/**
 * SpectateJoinMsg handler — Path B-min + D combo.
 *
 * Validates matchId + auth + self-spectate guard, adds spectator userId
 * to match.spectators (C1 field), emits initial fight_state_resume snapshot
 * (Sub-epic 4b reuse — Option α late-join), and broadcasts SpectatorListMsg
 * to entire audience.
 *
 * Auth: friendship-based (Path D). Spectator must be friend of player1
 * OR player2. Friendship lookup via prisma findFirst with normalized
 * user1Id/user2Id pairs (existing convention per friends.js:38).
 *
 * ErrorMsg shape: BE flat {type, error, code} per Sub-epic 5 carry-over
 * #31 finding (FE parser is the broken side — fix deferred к Sub-epic 7).
 *
 * Self-spectate guard: player can't spectate own match (defensive — would
 * conflict with player WS routing for own match events).
 *
 * 6th subsection #2 occurrence application: spectators stored as Set<userId>
 * (NOT socket refs — sockets replace on reconnect; userId is stable identity).
 */
async function handleSpectateJoin(ws, userId, msg) {
  const { matchId } = msg;
  if (!matchId || typeof matchId !== 'string') {
    ws.send(JSON.stringify({ type: 'ErrorMsg', error: 'INVALID_MATCH_ID', code: 400 }));
    return;
  }

  const match = pvpMatchManager.getMatch(matchId);
  if (!match) {
    ws.send(JSON.stringify({ type: 'ErrorMsg', error: 'MATCH_NOT_FOUND', code: 404 }));
    return;
  }

  // Self-spectate guard
  if (userId === match.player1.odId || userId === match.player2.odId) {
    ws.send(JSON.stringify({ type: 'ErrorMsg', error: 'CANNOT_SPECTATE_OWN_MATCH', code: 403 }));
    return;
  }

  // Friendship check (Path D — friends-only spectate)
  const p1Id = match.player1.odId;
  const p2Id = match.player2.odId;
  const [u1a, u2a] = userId < p1Id ? [userId, p1Id] : [p1Id, userId];
  const [u1b, u2b] = userId < p2Id ? [userId, p2Id] : [p2Id, userId];

  const isFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: u1a, user2Id: u2a },
        { user1Id: u1b, user2Id: u2b },
      ],
    },
  });

  if (!isFriend) {
    ws.send(JSON.stringify({ type: 'ErrorMsg', error: 'NOT_AUTHORIZED', code: 403 }));
    return;
  }

  // Add to spectators Set (C1 field)
  match.spectators.add(userId);

  // Emit initial fight_state_resume snapshot (Sub-epic 4b reuse — Option α late-join).
  // Spectator FE hydrates HudSpectate state from snapshot, then receives live events
  // via C3 sendToSpectators broadcast chain.
  try {
    const snapshot = match.getStateSnapshot();
    ws.send(JSON.stringify({ type: 'fight_state_resume', ...snapshot }));
  } catch (e) {
    console.error('[SPECTATE] Failed to send fight_state_resume:', e.message);
  }

  // Broadcast SpectatorListMsg to entire audience (player1, player2, all spectators
  // including new). Uses engine.emit (players) + engine.sendToSpectators (spectators).
  const listPayload = { matchId, count: match.spectators.size };
  match.emit('SpectatorListMsg', listPayload);
  match.sendToSpectators('SpectatorListMsg', listPayload);

  console.log(`[SPECTATE] User ${userId} joined match ${matchId}. Spectators: ${match.spectators.size}`);
}

/**
 * SpectateLeaveMsg handler.
 *
 * No matchId in payload (mirrors MatchmakingCancelMsg pattern — server-state
 * derivation). Iterates active matches finding userId in spectators. Direct
 * iteration acceptable for typical scale (matches < 50). Encapsulation method
 * (getMatchBySpectator) deferrable к C5 if cleaner.
 *
 * On miss (user not spectating any match): silent no-op — likely stale unmount
 * after match already cleaned up.
 */
function handleSpectateLeave(ws, userId) {
  let foundMatch = null;
  for (const match of pvpMatchManager.activeMatches.values()) {
    if (match.spectators.has(userId)) {
      foundMatch = match;
      break;
    }
  }

  if (!foundMatch) return; // silent no-op — not spectating any match

  foundMatch.spectators.delete(userId);

  const listPayload = { matchId: foundMatch.matchId, count: foundMatch.spectators.size };
  foundMatch.emit('SpectatorListMsg', listPayload);
  foundMatch.sendToSpectators('SpectatorListMsg', listPayload);

  console.log(`[SPECTATE] User ${userId} left match ${foundMatch.matchId}. Spectators: ${foundMatch.spectators.size}`);
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
  // Snapshot queue keys to avoid issues with Map modification during iteration
  const queuedIds = [...matchmaking.queue.keys()];
  const matchedThisTick = new Set();

  for (const odId of queuedIds) {
    // Skip players already matched in this tick
    if (matchedThisTick.has(odId)) continue;
    // Skip players no longer in queue (removed by a prior match in this tick)
    if (!matchmaking.queue.has(odId)) continue;

    const match = matchmaking.tryFindMatch(odId);
    if (match) {
      matchedThisTick.add(match.player1.odId);
      matchedThisTick.add(match.player2.odId);
      notifyMatch(match);
    }
  }
}, 3000);

module.exports = { setupWebSocket, sendToUser, clients };
