---
name: hexlash-websocket
description: Hexlash WebSocket protocol — real-time communication between client and server. Use this skill when working on WebSocket messages, real-time features, PvP communication, matchmaking queue, friend challenges, punch batches, spectate mode, online status, or any WS-related code. Triggers on mentions of WebSocket, WS, real-time, realtime, socket, messages, matchmaking, challenge, spectate, punch batch, online, connection, reconnect, ws handler, pvp messages, fight messages.
---

# Hexlash WebSocket Protocol

## Architecture

- WebSocket runs on the same HTTP server as Express (shared port)
- Authentication: JWT token sent on connection
- Messages: JSON with `type` field for routing
- Client: Vuex `webSocketState` module handles connection, reconnection, message dispatch
- Server: `websocket/handler.js` routes messages, `websocket/pvpHandler.js` handles PvP

## Message Protocol

### Client → Server

| Message Type | Payload | Purpose |
|-------------|---------|---------|
| `PunchInfoRequestMsg` | — | Get punch rate limit info |
| `PunchBatchRequestMsg` | `{ punches }` | Submit batch of punches |
| `FightTicketMsg` | — | Request new fight ticket |
| `FightActionMsg` | `{ action }` | Send PvP fight action |
| `challenge_send` | `{ targetUserId }` | Send PvP challenge to friend |
| `challenge_accepted` | `{ challengeId }` | Accept incoming challenge |
| `challenge_declined` | `{ challengeId }` | Decline incoming challenge |
| `MatchmakingStartMsg` | `{ deck, skin }` | Join matchmaking queue |
| `MatchmakingCancelMsg` | — | Leave matchmaking queue |
| `pvp_ready` | `{ matchId, deck }` | Signal readiness + send deck |
| `dice_roll` | `{ matchId }` | Roll dice in PvP |
| `coach_choice` | `{ matchId, action }` | Coach advice choice (attack/defense/position) |

### Server → Client

| Message Type | Payload | Purpose |
|-------------|---------|---------|
| `PunchInfoResponseMsg` | `{ limit, remaining }` | Punch rate limit info |
| `UserResponseMsg` | `{ user }` | Updated user data after punches |
| `FightInfoMsg` | `{ fight }` | Fight ticket data |
| `challenge_sent` | `{ challengeId }` | Challenge sent confirmation |
| `challenge_error` | `{ error }` | Challenge failed (offline, etc.) |
| `challenge_received` | `{ from, challengeId }` | Incoming challenge notification |
| `challenge_start` | `{ matchId }` | Challenge accepted, match created |
| `challenge_declined` | `{ challengeId }` | Challenge was declined |
| `MatchmakingQueueMsg` | `{ position }` | Queue position update |
| `MatchFoundMsg` | `{ matchId, opponent, skin }` | Match found |
| `MatchmakingCancelledMsg` | — | Left queue confirmation |
| `fight_start` | `{ matchId, players }` | PvP fight begins |
| `dice_available` | `{ matchId }` | Dice off cooldown |
| `dice_rolled` | `{ matchId, effect }` | Dice roll result |
| `dice_error` | `{ error }` | Dice roll failed |
| `coach_pause` | `{ matchId }` | Fight paused for coach advice (10s) |
| `coach_result` | `{ matchId, effects }` | Both chose, fight resumes |
| `coach_opponent_ready` | `{ matchId }` | Opponent made coach choice |
| `round_result` | `{ round, hp, damage, effects }` | Round simulation result |
| `fight_end` | `{ winner, reason, xp }` | Fight finished |
| `overdrive_start` | `{ matchId }` | Overdrive phase (sudden death) |
| `AchievementResponseMsg` | `{ achievement }` | Auto-awarded achievement |
| `ErrorMsg` | `{ error }` | Error response |

## Friend Challenge Flow

```
Player A                    Server                    Player B
    |                         |                         |
    |-- challenge_send ------>|                         |
    |                         |-- (check online) ------>|
    |<-- challenge_sent ------|                         |
    |                         |-- challenge_received -->|
    |                         |                         |
    |                         |     (10s auto-decline)  |
    |                         |                         |
    |                         |<-- challenge_accepted --|
    |                         |                         |
    |                         |-- (create match via     |
    |                         |    pvpMatchManager)     |
    |                         |                         |
    |<-- challenge_start -----|-- challenge_start ----->|
    |                         |                         |
    | (navigate to /fight?mode=pvp&matchId=...)         |
```

## PvP Match Flow

```
1. MatchmakingStartMsg  → Server adds to queue with deck + skin
2. MatchFoundMsg         ← Server finds match, sends opponent info
3. pvp_ready             → Both players signal ready with deck
4. fight_start           ← Server starts match
5. round_result          ← Each round result sent to both
6. dice_available        ← Server notifies dice ready (cooldown 3 rounds)
7. dice_roll             → Player rolls dice
8. dice_rolled           ← Server sends effect
9. coach_pause           ← Fight pauses for coach (from round 6)
10. coach_choice         → Player sends choice
11. coach_result         ← Both chose, resume
12. overdrive_start      ← If rounds > MAX_ROUNDS
13. fight_end            ← Winner, XP, reason
```

## Implementation Details

### Client Side
- `webSocketState` Vuex module manages connection lifecycle
- Auto-reconnection on disconnect
- Messages are JSON stringified/parsed
- Punch batches sent every 11s (BATCH_SEND_INTERVAL_MS)

### Server Side
- `handler.js` — Main message router, challenge system
- `pvpHandler.js` — PvP-specific messages (dice_roll, coach_choice, round flow)
- `matchmaking.js` — Queue management, match pairing
- `pvpMatchManager.js` — Match lifecycle (create, start, end)

### Timeouts
- Dice pause: 10s (DICE_PAUSE_TIMEOUT_MS)
- Coach pause: 10s (COACH_PAUSE_TIMEOUT_MS)
- Punch batch interval: 11s (BATCH_SEND_INTERVAL_MS)
- Challenge auto-decline: 10s

## Key Files

| File | Location |
|------|----------|
| `webSocketState.js` | `/src/core/state/modules/` |
| `handler.js` | `/backend/src/websocket/` |
| `pvpHandler.js` | `/backend/src/websocket/` |
| `matchmaking.js` | `/backend/src/services/` |
| `pvpMatchManager.js` | `/backend/src/services/` |
