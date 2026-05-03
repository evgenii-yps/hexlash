# Epic 6 — Sub-epic 4 — Phase 0 Investigation Findings

**Date:** 2026-05-03
**Type:** Read-only investigation, NO edits, NO commits
**Scope:** PvP в v2 + real backend WS integration baseline
**Method:** 5 parallel Explore agents (Q1+Q5 / Q2+Q9 / Q3+Q4+Q6 / Q7+Q8 / Q10+Q11+Q12) + main-Claude cross-verification

---

## Bootstrap Branch Verify

- **Branch confirmed:** `claude/investigate-retirement-animation-zQeg4` (continue stack)
- **HEAD:** `cb84e9d` "docs(epic6): Sub-epic 4 handoff — PvP в v2 + real backend WS (L size, possibly split)"
- **Working tree:** clean entering investigation; **1 new untracked file expected at end** (this findings doc)
- **Lesson #43 candidate noted:** 3rd occurrence of bootstrap branch divergence (Recovery #79 5U + #82 Sub-epic 2 + this Phase 0). Initial harness slug was `claude/read-project-docs-OjlN3`, switched per ТЗ authorization. Local branch was 28 commits behind origin, fast-forwarded via `git pull --ff-only`.

---

## Executive Summary — Path-Candidate Readiness

**Investigation reveals a stark architectural binary:**

- **v1 PvP path** — Real backend WS, fully wired end-to-end (with documented gaps: surrender, server-restart recovery, reconnect-replay).
- **v2 PvP path** — 100% mock simulation. Zero WS subscriptions, zero Vuex pvpState consumption, three independent module-scoped state stores.

**Sub-epic 4 target = bridge v2 scenes to existing v1 backend.** Backend is production-ready; frontend v2 needs WS wiring rebuild on top of preserved v2 visual scaffold (PrepOverlay / HudFight phases / coach pause / animations).

**Path readiness:** All 4 paths (A/B/C/D) are now scoped enough for design-Claude decision. Key tradeoffs:
- Path A (sequential WS-first): backend already done — main work = frontend rewire.
- Path B (visual-first then WS): rework risk if shape diverges; visual scaffold already exists.
- Path C (combined slim split: happy path / edge cases): natural split point given gap inventory.
- Path D (single L): risky for streak; ~20-30 commit estimate plausible.

**Cross-cutting decisions surfaced for design-Claude:**
1. Surrender flow — implement in 4 or defer (currently MISSING entirely)
2. Spectate — defer entirely к Sub-epic 6 (Path α mock 5N preserved, zero backend infra)
3. Matchmaking — defer real wiring к Sub-epic 5 (mmCandidatesMock seeded RNG); BUT Sub-epic 4 needs entry point — fixture/short-circuit to backend `MatchFoundMsg`?
4. Reconnect state replay — backend currently does no replay; full DB persistence = scope creep, but minimum "fight_state_resume" message would be safer than current
5. v2 PvP route auth posture — carry-over #10 territory but if 4 wires real WS, unprotected nav к `/v2/fight` becomes immediate UX gap

---

## Q1 — V1 PvP File Inventory

### Views (4 files in `src/views/`)

| File | Purpose |
|---|---|
| `CardFightView.vue` | Main PvP/training fight battle UI — dual fighters, HP bars, round counter, overdrive, countdown overlay, dice, coach modal, results screen |
| `MatchmakingView.vue` | Ranked PvP matchmaking queue UI — search timer, queue size, online count, player rating, search range, cancel |
| `SpectateView.vue` | Live fight spectator mode — two fighters, HP, round counter, spectator count |
| `PreparationView.vue` | Pre-fight setup arena — mode selector, captain selection, fight start, friends panel |

### Components

**PvP-specific (`src/components/pvp/`, 4 files):**
- `ChallengeNotification.vue` — challenge invite with accept/decline + countdown
- `FriendCard.vue` — friend status (online/in-fight) + captain badge + challenge/watch/remove
- `PlayerSearchResult.vue` — search result + captain badge + add-to-friends
- `FriendRequestCard.vue` — friend request + rating + accept/decline

**Fight UI (`src/components/fragments/fight/`, 2 files):**
- `HPBar.vue` — shared HP bar с damage/heal float anims
- `RoundDisplay.vue` — round summary с both moves, damage, event icons (crit, blind)

### Vuex modules (PvP-relevant)

**`pvpState.js`** (245 lines):
- State: `currentPvPFight`, `pvpStats` (rating, wins, losses, draws), `pvpFightStatus` (idle/searching/in_fight/finished), `currentMatchId`, `opponentInfo`, `isPlayer1`
- Mutations: `setCurrentPvPFight`, `setStatus`, `updateStatsWin/Loss/Draw`, `setRating`, `SET_PVP_MATCH`, `RESET_PVP_FIGHT`
- Actions: `init`, `restoreFromServer`, `createPvPFight`, `finishPvPFight`, `clearCurrentFight`
- Includes `calculateRatingChange` (line 40, ELO-style)
- **Mock function `generateOpponentFighter`** (lines 22-37) — generates fake opponent с randomized modules + 3 placeholder cards (Jab/Cross/Hook). Used in `createPvPFight` action (line 181).
- localStorage key: `hexlash_pvp`

**`cardFightState.js`** (638 lines):
- Player/opponent modules, decks, live HP, round log, dice state, coach advice, fight phase (idle/prep/fighting/coach/results), xpEarned/xpAwarded
- Dice system: 6 effects (heal, adrenaline, shield, blind, rage, crit) с cooldown
- Actions: `startFight`, `computeNextRound`, `rollDiceManual`, `applyCoachAdvice`, `resumeMissedRounds`, `resetToPreparation`
- localStorage key: `hexlash_current_fight`
- Auto-simulates missed rounds on tab visibility restore

**`webSocketState.js`** (242 lines):
- State: `isConnected`, `socketClient`, `reconnectTimer`, `reconnectDelay`
- Actions: `connectWebSocket`, `disconnectWebSocket`, `attemptReconnect` (exponential backoff base 10s → max 300s ±20% jitter), `sendMessage`, `handleMessage`, `handleConnectionError`
- Routes ALL incoming via custom window events (e.g., `pvp-fight_start`, `matchmaking-match-found`, `challenge-received`)
- Mock-mode short-circuit (line 55, 124): skips WS connect + `sendMessage` no-op

### Services

- `src/core/services/fightService.js` (23 lines) — minimal, only `receiveFightInfo()` for legacy fight WS validation. **No PvP-specific service.** PvP logic lives in cardFightState + pvpState directly.
- Other services (userService, masterService, punchService, clanService, taskService) consume `isMockMode()` to short-circuit к mock data.

### WS client

- `src/core/websocket/WebSocketClient.js` (90 lines):
  - Constructs URL from `__WEB_SOCKET_URL__` build-time global
  - **JWT in protocol array** (NOT header — `["fcproto", "Bearer_<token>"]`)
  - Message queue if socket not OPEN, flushed on `onopen`
  - Auto-reconnect on close (code ≠ 1000)
  - Delegates message parsing к `store.dispatch('webSocket/handleMessage', ...)`

### Total: ~25+ files identified в v1 PvP scope

---

## Q2 — V2 PvP Scenes Current State

### Files Identified

**V2 Views (`src/views-v2/`):**
| File | Mount route | Lines |
|---|---|---|
| `FightView.vue` | `/v2/fight` | confirmed exists |
| `MatchmakingView.vue` | `/v2/matchmaking` | confirmed exists |
| `SpectateView.vue` | `/v2/spectate/:fightId` | 37 |

**HUD Overlays (`src/components/hud/`):**
- `HudFight.vue` — fight phase (prep/fight/result), HP bars, log, camera selector, dice, coach pause
- `HudMatchmaking.vue` — search/results phases, filter UI, candidate grid
- `HudSpectate.vue` — read-only spectate, HP tracking, log simulation

### Wiring State — ALL MOCK

| View | Route | Data Source | WS Integration | State Machine |
|---|---|---|---|---|
| **FightView** | `/v2/fight` | `useFightSimulation.js` (module-scoped) | **NONE** | prep → fighting → result (mock timers) |
| **MatchmakingView** | `/v2/matchmaking` | `useMatchmakingState.js` + `mmCandidatesMock.js` (seeded Mulberry32) | **NONE** | search → results (mock candidates) |
| **SpectateView** | `/v2/spectate/:fightId` | inline `HudSpectate` mock (setInterval + Math.random) | **NONE** | watching (mock damage rolls) |

**Cross-verified by main Claude:** `grep -n "pvp-\|webSocket\|fight_start\|round_result" src/views-v2/FightView.vue src/components/hud/HudFight.vue` → **0 results.** Confirmed v2 PvP scenes do NOT subscribe to backend WS events.

### Mock Architecture

**`useFightSimulation.js`** (module-scoped reactive store):
- Fields: `phase`, `round`, `leftHp/rightHp`, `coachStrategy`, `resultWon`, `coachPauseOpen`
- MOVES array [jab, cross, hook] с hardcoded dmg ranges
- Hit-chance tables; 220ms exchange window per `doExchange()`
- **No Vuex dispatch** — fightState directly mutated

**`useMatchmakingState.js`**:
- Fields: `phase` ('search' | 'results'), `eloDelta`, `archFilter`, `beltFilter`, `candidates`, `selected`
- `mmCandidatesMock.generateCandidates()` uses seeded Mulberry32 (`mmSeed = Date.now() & 0xffffff`) — rescans within same millisecond return identical picks
- Candidates have random stats (elo, wins/losses, streak)

**`HudSpectate.vue`** (per CLAUDE.md 5N Path α mock port):
- Local refs per instance — `friendHp`, `opponentHp`, `currentRound`, `fightLog`
- `simInterval` ticks every 2000ms → `simulateRound()` → `rollDamage()` (8-23) → `rollCrit()` (15%) → mutates HP directly
- Constants: `MAX_HP=100`, `MAX_ROUNDS=10`, `TICK_MS=2000`
- Comment line 4: "NO backend wiring — pure mock simulation via setInterval + Math.random per Path α discipline"

### pvpState NOT consumed by v2

`src/core/state/modules/pvpState.js` defines real WS state but v2 views don't dispatch/commit к it. Only v1 `CardFightView` consumes pvpState.

---

## Q3 — Backend WS Coverage

### Incoming message types (client → server)

**Top-level router (`backend/src/websocket/handler.js:135-184`):**

- `PunchInfoRequestMsg`, `PunchBatchRequestMsg`
- `FightTicketMsg`, `FightActionMsg` (legacy fight)
- `MatchmakingStartMsg`, `MatchmakingCancelMsg`
- `pvp_ready` (line 20 pvpHandler) — deck + modules submission
- `dice_roll` (line 77 pvpHandler) — rate-limited 1/2s
- `coach_choice` (line 100 pvpHandler) — validated action ∈ {attack, defense, position, null}
- `challenge_send`, `challenge_accepted`, `challenge_declined`

### Outgoing message types (server → client)

**Broadcast (`emit()` in pvpCombatEngine.js):**
- `fight_start` (line 131) — `{matchId, player1/2 {odId, username, skin, avatarUrl, deck, modules}, maxRounds, overdriveStartRound}`
- `round_result` (line 322) — `{round, isOverdrive, firstAttacker, player1/2 {module, damage, hp, effects, dodged, critted}}`
- `coach_result` (line 504) — `{player1/2 {action}}`
- `fight_end` (line 559) — `{matchId, winner, rounds, xp, player1/2 {odId, username, finalHp}, roundLog}`
- `overdrive_start` (line 166) — `{round}`

**Unicast (`sendToPlayer()`):**
- `dice_available` (line 176) — `{round}`
- `dice_rolled` (line 435) — `{effect, hp, oppHp, killed}`
- `dice_error` (line 425) — `{message: 'dice_on_cooldown' | 'no_active_match' | 'fight_not_running'}`
- `coach_pause` (line 455) — `{round, timeLimit}`
- `coach_opponent_ready` (line 480) — `{}` (notify other player chose)

**Unicast initiator (`sendMessage()` in handler.js):**
- `MatchmakingQueueMsg` (line 613) — `{queueSize}`
- `MatchFoundMsg` (line 636) — `{matchId, opponent {odId, username, rating, skin, avatarUrl}}`
- `match_cancelled` (line 17 pvpMatchManager) — `{matchId, reason: 'ready_timeout'}`
- `challenge_received` (line 487) — `{from {...}, challengeId}`
- `challenge_sent` (line 500) — `{targetUserId}`
- `challenge_start` (line 545, 558) — `{matchId, opponent}`
- `challenge_error` (line 477, 512) — `{message: 'friend_offline' | 'challenger_offline'}`
- `challenge_declined` (line 585) — `{declinedBy}`
- `matchmaking_timeout` (line 58 matchmaking.js) — `{reason: 'search_timeout'}`
- `MatchmakingCancelledMsg` — `{}`

### Match lifecycle stages coverage

| Stage | File:line | Status |
|---|---|---|
| Matchmaking start | handler.js:593 → matchmaking.addToQueue | full |
| Match found (3s tick) | handler.js:664 periodic loop | full |
| Match created | matchmaking.js:111 → pvpMatchManager.createMatch | full |
| Ready timeout | pvpMatchManager.js:14, fires PVP_READY_TIMEOUT_MS | full |
| pvp_ready (deck submit) | pvpHandler.js:20 validates, binds socket | full |
| Both ready → start | pvpHandler.js:71 calls match.start() | full |
| Countdown (30s COUNTDOWN_MS) | pvpCombatEngine.js:139 setTimeout(nextRound) | full |
| Round start | pvpCombatEngine.js:146 nextRound() | full |
| Dice roll | pvpHandler.js:77 → engine.onDiceRoll() | full |
| Coach trigger (round ≥ COACH_MIN_ROUND=3) | pvpCombatEngine.js:184 pauseForCoach() | full |
| Coach choice | pvpHandler.js:100 → engine.onCoachChoice() | full |
| Coach resolve (both chose or 10s timeout) | pvpCombatEngine.js:482 resolveCoachPause() | full |
| Round simulate | pvpCombatEngine.js:192 simulateRound() | full |
| Overdrive (round > MAX_ROUNDS=10) | pvpCombatEngine.js:165 isOverdrive | full |
| Fight end (HP≤0 or maxRounds exceeded) | pvpCombatEngine.js:524 endFight() → saveFightResult() | full |
| Disconnect mid-fight | handler.js:99 → engine.onPlayerDisconnect() | partial (no replay on reconnect) |
| Reconnect rebind | handler.js:74-84 rebind socket | partial (state catch-up implicit) |
| **Surrender** | — | **MISSING** |
| Matchmaking timeout (2min) | handler.js:622 + matchmaking.js:58 | full |

### TODO / FIXME / mock markers
**No explicit TODO/FIXME** in core WS files. Backend is production-grade.

Notable safety patterns:
- `lastDiceRoll` Map per player (pvpHandler.js:5), cleared on disconnect (line 126)
- `coachChoiceSent` Map per matchId:odId (line 8), prevents double-submit
- `ws._replaced` flag (handler.js:63) prevents orphaned disconnect handlers
- Heartbeat ping/pong every WS_PING_INTERVAL_MS (~30s default), terminate if no pong WS_PONG_TIMEOUT_MS (~10s)

---

## Q4 — Frontend WS Integration

### WS client architecture

**`src/core/websocket/WebSocketClient.js`:**
- Auth: Bearer token in protocol array (`["fcproto", "Bearer_<JWT>"]`) — backend parses from `ws.protocol` (handler.js:19-40)
- Retry: exponential backoff via Vuex (RECONNECT_BASE_MS=10s → RECONNECT_MAX_MS=300s, doubled)
- Message queue if socket not OPEN → flushed on `onopen`
- **No explicit client-side heartbeat** — relies on browser ws.onpong

### Message handlers (incoming)

**Vuex `webSocketState.handleMessage` (lines 130-221) routes via custom window events:**

| Backend type | Frontend handling |
|---|---|
| PunchInfoResponseMsg | punchService.receivePunchBatch |
| FightInfoMsg | fightService.receiveFightInfo (legacy) |
| MasterResponseMsg | master/updateMasterFromSocket |
| **MatchFoundMsg** | window.dispatchEvent('matchmaking-match-found') |
| **MatchmakingQueueMsg** | window.dispatchEvent('matchmaking-queue-update') |
| MatchmakingCancelledMsg | window.dispatchEvent('matchmaking-cancelled') |
| matchmaking_timeout | window.dispatchEvent('matchmaking-timeout') |
| match_cancelled | window.dispatchEvent('match-cancelled') |
| **fight_start, round_result, dice_*, coach_***, **fight_end**, overdrive_start | window.dispatchEvent('pvp-' + type) |
| challenge_received | friends/setIncomingChallenge + event |
| challenge_sent / challenge_start / challenge_declined / challenge_error | friends/* + event |
| clan_invite* | window.dispatchEvent('clan-invite-*') |

### Vuex shapes

**webSocketState:** `{isConnected, socketClient, reconnectTimer, reconnectDelay}`

**pvpState:** `{currentMatchId, opponentInfo {odId, username, rating, skin, avatarUrl}, isPlayer1, pvpFightStatus, pvpStats {rating, wins, losses, draws}}`

### Mismatches with Q3

**All backend events have v1 frontend listeners** (CardFightView.vue:768-777 listens to `pvp-fight_start`, `pvp-round_result`, `pvp-dice_available`, `pvp-dice_rolled`, `pvp-coach_pause`, `pvp-coach_result`, `pvp-coach_opponent_ready`, `pvp-fight_end`, `pvp-overdrive_start`, `match-cancelled`).

**v2 has ZERO listeners** for any `pvp-*` window events. This is the integration gap Sub-epic 4 must close.

**No surrender** — bidirectional gap (frontend has no UI, backend has no handler).

---

## Q6 — Match Lifecycle End-to-End

| # | Stage | FE emit | BE handler | BE emit | FE listener | Status |
|---|---|---|---|---|---|---|
| 1 | MM start | `MatchmakingStartMsg` | handler.js:593 addToQueue → tryFindMatch | `MatchmakingQueueMsg` | v1 MatchmakingView:202 'matchmaking-queue-update' | **FULL (v1)** / **MISSING (v2)** |
| 2 | Opponent found (3s tick) | (auto) | handler.js:664 periodic match loop | `MatchFoundMsg` | v1 MatchmakingView:202 'matchmaking-match-found' → startFight() | **FULL (v1)** / **MISSING (v2)** |
| 3 | Match created | (auto) | matchmaking.js:111 createMatch | (internal) | (none) | full |
| 4 | Ready timeout (60s) | (passive) | pvpMatchManager.js:14 _readyTimeout | `match_cancelled` | v1 CardFightView:778 'match-cancelled' | **FULL (v1)** / **MISSING (v2)** |
| 5 | pvp_ready | `pvp_ready {matchId, deck, modules}` | pvpHandler.js:20 validates, binds socket | (none if 1 ready) | (internal both required) | **FULL (v1)** / **MISSING (v2)** |
| 6 | Both ready → start | (auto) | pvpHandler.js:71 match.start() | `fight_start` | v1 CardFightView:768 → showCountdown=true | **FULL (v1)** / **MISSING (v2)** |
| 7 | Countdown (30s) | (passive UI) | pvpCombatEngine.js:139 setTimeout(nextRound) | (none) | v1 CardFightView countdown overlay | **FULL (v1)** / **MISSING (v2)** |
| 8 | Round start | (auto) | pvpCombatEngine.js:146 nextRound() | `dice_available` | v1 CardFightView:770 'pvp-dice_available' | **FULL (v1)** / **MISSING (v2)** |
| 9a | Dice roll | `dice_roll` | pvpHandler.js:77 → engine.onDiceRoll | `dice_rolled` / `dice_error` | v1 CardFightView:771 'pvp-dice_rolled' | **FULL (v1)** / **MISSING (v2)** |
| 9b | Coach trigger (round ≥ 3) | (auto, both alive) | pvpCombatEngine.js:184 pauseForCoach() | `coach_pause {round, timeLimit:10s}` | v1 CardFightView:773 → showCoachChoice=true | **FULL (v1)** / **MISSING (v2)** |
| 10 | Coach choice | `coach_choice {action}` | pvpHandler.js:100 → engine.onCoachChoice | `coach_opponent_ready` | v1 CardFightView:775 'pvp-coach_opponent_ready' | **FULL (v1)** / **MISSING (v2)** |
| 11 | Coach resolve (both / 10s) | (auto) | pvpCombatEngine.js:482 resolveCoachPause | `coach_result` | v1 CardFightView:774 'pvp-coach_result' | **FULL (v1)** / **MISSING (v2)** |
| 12 | Round simulate | (auto) | pvpCombatEngine.js:192 simulateRound | `round_result` | v1 CardFightView:769 'pvp-round_result' | **FULL (v1)** / **MISSING (v2)** |
| 13 | Overdrive (round > 10) | (auto) | pvpCombatEngine.js:165 isOverdrive | `overdrive_start` | v1 CardFightView:777 'pvp-overdrive_start' | **FULL (v1)** / **MISSING (v2)** |
| 14 | Fight end | (auto) | pvpCombatEngine.js:524 endFight + saveFightResult | `fight_end` | v1 CardFightView:776 'pvp-fight_end' | **FULL (v1)** / **MISSING (v2)** |
| 15 | Disconnect mid-fight | (socket close) | handler.js:99 → engine.onPlayerDisconnect | `fight_end {reason:'opponent_disconnected'}` (only winner) | (only winner gets fight_end; loser ws closed) | **PARTIAL** |
| 16 | Reconnect | (new ws) | handler.js:74-84 rebind socket if status≠finished | (no replay) | (state catch-up implicit on next event) | **PARTIAL** |
| 17 | **Surrender** | (NOT IMPL) | (NO HANDLER) | (NONE) | (NO LISTENER) | **MISSING** |
| 18 | MM timeout (2min) | `MatchmakingCancelMsg` (or auto) | handler.js:622 removeFromQueue / matchmaking.js:58 | `matchmaking_timeout` | v1 MatchmakingView:204 'matchmaking-timeout' | **FULL (v1)** / **MISSING (v2)** |

### Gaps identified

**Critical:**
- **No surrender** — players trapped until disconnect or HP/round end
- **No reconnect replay** — frontend stuck at stale HP/round until next backend emit (~3s lag worst case if round about to finish)

**Minor:**
- Match cancel doesn't notify offline player (delivered only к open sockets; no DB persistence of cancel reason)
- Coach pause timeout silent (server proceeds, client assumes null choice — UX opaque)

---

## Q5 — Mock Data Sources

### `src/core/mock/mockData.js` (47 lines)

| Export | Purpose |
|---|---|
| `MOCK_JWT_TOKEN` | Hardcoded JWT for mock auth |
| `MOCK_USER_DATA` | Mock player stats (rating, fights, wins/losses/draws, balance 50M, skin) |
| `createMockMaster()` | Factory returning MasterModel с mock user data |
| `isMockMode()` | Checks `__MOCK_MODE__` build-time global |

**No PvP-specific mock data** in mockData.js. Only auth + user stats.

### Inline mocks

**`pvpState.js:22-37`** — `generateOpponentFighter(opponent)` shuffles 6 archetype pool, picks 3, returns hardcoded 3-card deck (Jab/Cross/Hook). Local mock, no API. Called from `createPvPFight` action (line 181).

**`webSocketState.js:55, 124`** — `if (isMockMode())` short-circuits real WS connection + sends.

**`mmCandidatesMock.js`** (v2 matchmaking) — Mulberry32 seeded RNG, 30-name pool, generates 3-6 candidates. Comment: "Real backend API заменит в Epic 4."

**`HudSpectate.vue:159-206`** (v2 spectate) — `simulateRound()` rolls damage 8-23, crit 15%, mutates HP locally. Comment line 4: "Path α discipline."

**`useFightSimulation.js`** (v2 fight) — local MOVES array + doExchange() с hardcoded ranges.

### Vuex actions returning mock vs real

| Module / action | File:line | State |
|---|---|---|
| pvpState/createPvPFight | pvpState.js:171 | uses `generateOpponentFighter()` — local mock |
| pvpState/finishPvPFight | pvpState.js:199 | local rating calc, no API |
| pvpState/restoreFromServer | pvpState.js:160 | accepts real backend data |
| cardFightState/startFight | cardFightState.js:306 | real captain from Vuex, OpponentGenerator engine (not mock) |
| cardFightState/computeNextRound | cardFightState.js:369 | real CombatEngine, no mock |
| webSocketState/connectWebSocket | webSocketState.js:54 | early-return in mock mode |
| webSocketState/sendMessage | webSocketState.js:123 | no-op in mock mode |

---

## Q9 — Visual States Audit

### FightView / HudFight states

**Handled:**
- ✅ Prep phase — `PrepOverlay` v-if `fightState.phase === 'prep'` — VS block + 3 strategy cards (aggressive/balanced/defensive) + Start/Cancel
- ✅ Fighting phase — `phase === 'fight'` — HP bars reactive (`leftHpPct`, `rightHpPct`), fight log appends, hit-flash overlay
- ✅ Result phase — `ResultOverlay` v-if `phase === 'result'` — VICTORY/DEFEAT, summary, Rematch/Exit
- ✅ Coach pause — `CoachPause` v-if `coachPauseOpen` — strategy modal

**Missing:**
- ❌ Connection lost — no error overlay, no WS reconnect UI
- ❌ Opponent disconnect / reconnecting — no "waiting for opponent" state
- ❌ Round transition explicit overlay — only log line ("Round X begins"), no countdown
- ❌ Match expired / timeout — no timer UI
- ❌ Spectate-specific UI — `.spectate-badge` mode-gated на `/v2/spectate/:id` (5N), but fight logic identical

### MatchmakingView / HudMatchmaking states

**Handled:**
- ✅ Search phase — `mmState.phase === 'search'` — title, mm-spinner, status, progress, cancel
- ✅ Results phase — `phase === 'results'` — candidates grid, archetype/ELO/W-L/WR/streak, selected highlight, Start Fight disabled until pick

**Missing:**
- ❌ Connection lost during search
- ❌ Search timeout (max-wait timer)
- ❌ Zero candidates (mmCandidatesMock always generates 3-6)
- ❌ Opponent unavailable when starting fight
- ❌ Progress feedback ETA

### SpectateView / HudSpectate states

**Handled:**
- ✅ Round progress badge
- ✅ Fighter HP bars reactive
- ✅ Fight log с auto-scroll
- ✅ Result banner (`fightOver` v-if)
- ✅ Spectator count drift

**Missing:**
- ❌ Connection lost к WS
- ❌ Server-side fight already ended on mount
- ❌ Invalid fightId / 404 overlay
- ❌ Friend left fight (unspectate)
- ❌ Real-time spectator list

### Global gaps (all v2 PvP scenes)

1. No error boundary
2. No loading skeleton
3. No timeout UX
4. No pause/resume for matchmaking
5. No player disconnection handling
6. No rematch queue (Rematch button local reset only)
7. No draft/stake selection in prep (Epic 4 deferred)
8. No modal Z-index safety race protection on phase transition

---

## Q7 — Spectate Integration Overlap (Sub-epic 6 territory)

### Files

- v1: `src/views/SpectateView.vue` (572 lines) — fully client-side mock simulation
- v2: `src/views-v2/SpectateView.vue` (37 lines) — minimal orchestrator
- v2 HUD: `src/components/hud/HudSpectate.vue` (495 lines) — ports legacy mock 1:1, line 4 "NO backend wiring"
- **Backend: ZERO spectator handlers** — main-Claude verified `grep -rn "spectat" backend/src/websocket/ backend/src/services/` returns 0 hits

### Architectural pattern observed

- WS message types shared с PvP fighter? **NO** (would require new types: `spectate_subscribe`, `spectate_update`, etc — none exist)
- Spectator state shape — undefined (no `spectatorState.js` Vuex module)
- Multiple spectators per match — unsupported (no list / counter / management)

### Overlap with Sub-epic 4 scope

**Decision recommendation:** Hand off entirely к Sub-epic 6.

**Current state:** NOT WIRED at all. Backend infrastructure absent. v2 mock preserved per CLAUDE.md 5N Path α discipline.

**Path options for design-Claude:**
- **Option A (Tight coupling — NOT recommended):** Sub-epic 4 adds spectator WS to pvpHandler + spectatorState Vuex. Mixes concerns.
- **Option B (Loose coupling — recommended):** Sub-epic 4 documents spectator API contract в CLAUDE.md → Sub-epic 6 implements.
- **Option C (Defer completely):** Mark spectate blocked pending Sub-epic 6. Leave v2 mock as-is.

---

## Q8 — Matchmaking Integration Overlap (Sub-epic 5 territory)

### Files

- v1: `src/views/MatchmakingView.vue` — wired к real backend (consumes `MatchFoundMsg` etc)
- v2: `src/views-v2/MatchmakingView.vue` (190 lines) — orchestrator + `mmCandidatesMock.js` (seeded Mulberry32)
- v2 HUD: `src/components/hud/HudMatchmaking.vue` (150+ lines) — filter UI, phase switching
- **Backend matchmaking PRODUCTION-READY:**
  - `backend/src/services/matchmaking.js` (145 lines) — `MatchmakingService` с queue Map, expandTimers, rating-based pairing
  - `backend/src/services/rankedMatchmaker.js` — separate ranked impl per CLAUDE.md
  - `handler.js:593-682` — `handleMatchmakingStart`, `notifyMatch`, periodic 3s loop, `handleMatchmakingCancel`

### Trigger flow

1. FE emits `MatchmakingStartMsg` → BE `addToQueue(player)` (handler.js:604)
2. Periodic 3s tick → `tryFindMatch(odId)` per queued player (handler.js:664)
3. Match found → `notifyMatch(match)` → `MatchFoundMsg` к both players (handler.js:635, 649)
4. `matchmaking.createMatch(matchId, player1, player2)` (matchmaking.js:111) → instantiates `pvpMatchManager.createMatch()` → arms ready-timeout

**No separate stream.** Same flow. matchmaking service directly triggers pvpMatchManager. No event bus indirection.

### Queueing types

| Type | Status |
|---|---|
| Ranked | ✅ Implemented (rating-based pairing in matchmaking.js, ELO from `captain.elo`) |
| Free Arena | ⚠️ Separate `rankedMatchmaker.js` exists per CLAUDE.md, but not wired к v2 MM UI |
| Friend Challenge | ⚠️ Separate path in handler.js (challenge system), not matchmaking queue |

### Overlap with Sub-epic 4 scope

**Sub-epic 4 needs working matchmaking to test PvP end-to-end.** Two options:

- **Option 1 (Sub-epic 4 mocks matchmaking trigger — recommended):** Sub-epic 4 wires v2 FightView к real WS. Uses fixture / direct nav with hardcoded matchId for testing OR friend-challenge as entry point. Sub-epic 5 wires v2 MatchmakingView к real backend.
- **Option 2 (Sub-epic 4 wires both — combines 4 + 5):** Higher risk for streak; ~30 commit estimate. NOT recommended.

**Critical observation:** v2 MatchmakingView's `setFightSetup()` → `/v2/fight` flow currently passes mock candidate data to FightView. If Sub-epic 4 rewires FightView к real WS, FightView either:
- (a) rejects mock setup and routes back к hub (entry only via real `MatchFoundMsg`)
- (b) accepts setup as fixture for testing (developer mode), real path via real WS

Design-Claude must decide.

---

## Q10 — Edge Cases Coverage

| # | Edge case | BE handling | FE handling | Status |
|---|---|---|---|---|
| 1 | Player disconnect mid-fight | handler.js:99 → engine.onPlayerDisconnect — auto-resolves, sends `fight_end {reason:'opponent_disconnected'}` к winner, saves DB result, cleans rate-limit Maps | WebSocketClient.js:54 onclose → exponential backoff reconnect (10s → 300s) | **Handled** (winner notified; loser ws closed; no resume on reconnect) |
| 2 | Player reconnect | handler.js:74-84 detects `isReconnect`, rebinds old socket, reassigns player1/2.socket if match active | WebSocketClient retry; pvpState localStorage persists matchId but NOT live round data | **Partial** (rebind works <30s; no log replay; stale HP/round until next emit) |
| 3 | Opponent surrender | **NO HANDLER** | **NO UI** | **MISSING** |
| 4 | Round timeout (auto-move) | `roundTimer = setTimeout(nextRound, ROUND_ANIMATION_MS=1500ms)` (pvpCombatEngine.js:324). `COUNTDOWN_MS=3000` for fight start. | No per-round countdown UI. Coach pause has 10s timer (`coachTimerPvP`). Round transitions implicit via log. | **Partial** (BE enforces pacing; FE no countdown UX for normal rounds) |
| 5 | Match timeout (server max duration) | `TOTAL_ROUNDS=12` ends fight at round 13 (pvpCombatEngine.js:153). **NO wall-clock timeout.** Max ~22.5min real. | No wall-clock UI. | **Partial** (soft round limit only) |
| 6 | WS connection loss | Heartbeat: ping every WS_PING_INTERVAL_MS=30s, kill if no pong WS_PONG_TIMEOUT_MS=10s | `attemptReconnect()` exponential backoff 10s base × 2 capped 300s, ±20% jitter. **No "Reconnecting…" UI** | **Handled silently** (no user feedback) |
| 7 | Server restart mid-match | All matches in-memory `pvpMatchManager.activeMatches` Map. On restart: **all matches lost.** Prisma fight saved only on `endFight()`. | onclose → reconnect → returns к lobby (no match context) | **Lost** (no crash recovery, no replay) |

### Critical gaps

1. **No surrender route** — players trapped until disconnect / round timeout
2. **No match-state replay on reconnect** — stale UI until next emit
3. **No server restart recovery** — in-progress matches silently lost
4. **No wall-clock timeout** — runaway coach-pause loops theoretically possible
5. **No "Reconnecting…" feedback** — silent backoff confuses players

---

## Q11 — Performance

### WS frequency

- `round_result` 1 / round (paced by `ROUND_ANIMATION_MS=1500ms`)
- `dice_rolled` / `coach_*` instant, no throttle
- **Estimated per match: ~15-20 BE→FE messages over ~30-40min**
- **No throttle / debounce** detected — engine emits synchronously

### Animation framerate

- No explicit 60fps lock
- Vue reactivity on next tick (microtask) per WS message
- HP bar CSS `transition` for fill width, no per-frame loop
- **Performance impact: low** — ~15-20 DOM updates / match

### Mobile

- No `touchstart`/`touchend` handlers in CardFightView (only `@click`)
- 0 mobile media queries found in fight CSS
- Fight HUD responsive via flexbox; coach modal `min(90vw, 420px)` adequate
- **Minimal mobile-specific code**

### Console logging

- pvpCombatEngine: 7 console logs (mostly error path)
- handler: connect/disconnect, MM events
- WebSocketClient: 1 warn (queued msg), error handlers
- **Sparse, production-appropriate**

---

## Q12 — Auth Posture

### V1 PvP routes

| Path | In `protectedRoutes`? | Source |
|---|---|---|
| `/fight` | ✅ YES | router.js:66 |
| `/matchmaking` | ✅ YES | router.js:68 |
| `/spectate/:odId` | ✅ YES | router.js:69 |

Guard: `router.beforeEach` (line 217) checks `protectedRoutes.some(route => route.name === to.name || route.path === to.path)` → unauthenticated redirect к `/auth/login`.

### V2 PvP routes

| Path | In `protectedRoutes`? | Source |
|---|---|---|
| `/v2/fight` | ❌ NO (in `v2Routes` lines 91-95) | router.js:93 |
| `/v2/matchmaking` | ❌ NO (in `v2Routes` lines 101-105) | router.js:103 |
| `/v2/spectate/:fightId` | ❌ NO (in `v2Routes` lines 136-140) | router.js:138 |

**Cross-verified by main Claude:** `protectedRoutes` array ends at line 71; `v2Routes` separate array (lines 75-163); both spread into `routes` (line 168, 169). Guard `protectedRoutes.some(...)` never matches v2 route names.

**Result:** Unauthenticated user can navigate directly к `/v2/fight` etc. Component renders. WS connect will fail (`Bearer_<token>` requires JWT) but UI breaks silently.

### Backend WS auth

- **Connection-level:** Token from protocol array `["fcproto", "Bearer_<token>"]` (handler.js:18-46). JWT verified; invalid → close(4001 'Invalid token'); no token → close(4001 'No auth token')
- **Per-message:** **NO re-check.** `userId` cached after handshake. `pvp_ready`, `dice_roll`, `coach_choice` trust connection auth.
- **Rate-limit:** `dice_roll` 1/2s per player; `coach_choice` 1/pause per player. Use `odId` from WS context.

### Mismatches / risks

| Risk | Severity | Detail |
|---|---|---|
| V2 routes unprotected | **P1** | `/v2/fight`, `/v2/matchmaking`, `/v2/spectate/:id` no router guard. WS will block, but UX gap. |
| No per-message auth | P2 | If session token revoked mid-match, player can still act until heartbeat fails. |
| No deck ownership re-verify | P3 | BE assumes player requesting `pvp_ready` owns deck/captain. No cross-check. |
| Router vs WS auth mismatch | **P1** | Unauth nav к `/v2/fight` → blank page / broken HUD, no clear error. |
| Reconnect doesn't validate match membership | P2 | Socket rebind without re-verify of player ownership of matchId. |

**Carry-over context:** Per CLAUDE.md, this is "Sub-epic 1 Path A decision, carry-over #10 audit territory" (group-level guard на v2Routes parent vs per-route protectedRoutes entries — Sub-epic 8 territory).

**Sub-epic 4 implication:** If 4 wires real WS to v2 PvP, the unprotected route problem becomes immediate UX gap. Design-Claude options:
- (a) Add v2 PvP routes к protectedRoutes within Sub-epic 4 scope (small lift)
- (b) Defer к Sub-epic 8 cutover, accept silent WS-deny UX в interim

---

## Surface Conditions Encountered

**None.** Investigation was clean. No edits attempted. No build runs. No tests run. No lint warnings raised. Only:

- Bootstrap branch divergence (3rd occurrence — Lesson #43 candidate already noted в ТЗ; resolved per ТЗ explicit authorization)
- Local branch was 28 commits behind origin — fast-forwarded via `git pull --ff-only` (read-only operation, no working tree mutation)

**Working tree state:** Clean except for this one new file `docs/visual-migration/EPIC6_SUBEPIC_4_PHASE_0_FINDINGS.md` (uncommitted, untracked, per ТЗ instruction).

---

## Path-Candidate Readiness Assessment

All 4 paths have sufficient baseline to make decision. Key data points:

### Path A — Sequential WS-first then visual
**Readiness: HIGH.** Backend already complete (Q3). All BE→FE messages have v1 listeners (Q4). Sub-epic 4a = build new v2 listener layer + Vuex bindings к existing infra. Sub-epic 4b = swap mock state machines (`useFightSimulation`, `mmCandidatesMock`, HudSpectate inline) for real Vuex/event consumers, preserving visual scaffold.

### Path B — Visual-first then WS
**Readiness: HIGH.** Visual scaffold already exists в v2 (Q2). 4a = refactor mock state stores к expected real-data shape (mock decks/HP/round backend message format). 4b = wire real WS, replace mock dispatch с real subscriptions.

**Caveat:** Risk if backend message shape diverges from mock format chosen в 4a.

### Path C — Combined slim split
**Readiness: HIGH.** Natural split given gap inventory:
- 4a = happy path (matchmaking → fight start → rounds → fight end, with coach + dice but no edge cases)
- 4b = edge cases (disconnect, reconnect replay strategy, surrender new feature, error UI)

**Recommended split point:** End of round simulation works without disconnect handling. Surrender + reconnect-replay = scope-creep candidates suitable for 4b separate sub-epic.

### Path D — Single L sub-epic
**Readiness: MEDIUM.** Estimate: 20-30 commits if surrender + reconnect-replay included, ~15-20 if those deferred. Risk: streak preservation over 25+ commits.

### Recommendation surface (for design-Claude review)

1. **Default suggestion: Path C** — Aligns with established Эпик 6 closure-shape variety (sub-epic 4a + 4b precedent matches 6B-3a/6B-3 split structure).
2. **Sub-epic 4a scope** — Real WS happy path: matchmaking-found event → pvp_ready → fight_start → rounds (with coach + dice) → fight_end. Fixture matchmaking entry (or friend challenge), defer real MM to Sub-epic 5.
3. **Sub-epic 4b scope** — Edge cases: disconnect handling UX, reconnect state-replay (decision required: scope DB persistence or accept partial), surrender feature (new BE message type + FE UI).
4. **Spectate** — Defer entirely к Sub-epic 6. Document API contract в CLAUDE.md if helpful.
5. **Auth posture for v2 PvP** — Either bundle `protectedRoutes` addition в 4a (small lift, prevents UX gap) or defer к Sub-epic 8 with explicit silent-fail acceptance.
6. **Backend changes** — Sub-epic 4 likely touches backend (surrender new message, possibly reconnect-replay). Lesson #33 deploy environment awareness applies — code-complete + deferred-verify pattern (precedent 6B-3a-backend).

---

## Recommendations / Observations

### Architectural

1. **v1 → v2 PvP requires module rebuild, not refactor.** v2 has zero WS subscription. The v1 → v2 path is "build fresh" not "incrementally migrate." Phase 1 ТЗ should treat this as new feature wiring, not refactor.

2. **pvpState Vuex module is well-positioned** as v2 source of truth for match-level state (matchId, opponent, isPlayer1, status). v2 should adopt it as Vuex source instead of module-scoped reactive (which `useFightSimulation` uses).

3. **Two-tier state separation pattern** observed in v1 (pvpState = match metadata; cardFightState = round-level live state). Sub-epic 4 should preserve this separation in v2 (HudFight could use cardFightState directly, OR introduce `v2FightState` Vuex module if separation desired).

4. **Window event bus pattern** (handler.js:130-221 dispatches `pvp-*` window events) — works for v1 but couples to global window scope. v2 architecturally cleaner if Vuex actions/mutations consumed directly. Decision for design-Claude: preserve event bus (less rewrite) or move to Vuex-direct (cleaner v2 architecture).

### Streak / methodology

5. **Lesson #43 candidate (3rd occurrence of bootstrap branch divergence)** — promote in Sub-epic 4 closure if final tally surfaces same pattern. Mitigation already standardized в ТЗ (`git status && git branch --show-current` first step).

6. **Backend changes deploy chain** — Sub-epic 4 likely needs surrender message + possibly reconnect-replay. Lesson #33: backend changes от designated branch don't auto-deploy. Cherry-pick → main → Railway PR flow per branch strategy section в CLAUDE.md.

7. **Visual verify gate** — v2 PvP scenes have multiple states (Q9 audit). Verify gates per phase (prep → fight → result) recommended; expect reactive splits if backend message shape surprises during integration.

### Documentation

8. **PvP audit P0+P1+P2+P3+P4 history** documented in CLAUDE.md is comprehensive. Sub-epic 4 visual integration shouldn't regress those fixes (e.g., P0-1 coach_opponent_ready, P0-3 reconnect kill-fight bug, P1-5 dice race condition).

9. **Skin / avatarUrl propagation** preserved in BE (P4 fix history) — fight_start includes skin/avatarUrl per player. v2 listener layer should consume.

10. **5N Path α discipline для spectate** — explicit CLAUDE.md decision to defer real WS. Sub-epic 4 should NOT touch spectate code (preserve mock until Sub-epic 6).

---

## Verifications Cross-Checked by Main Claude

1. ✅ **v2 FightView/HudFight has zero WS event listeners** — `grep -n "pvp-\|webSocket\|fight_start\|round_result" src/views-v2/FightView.vue src/components/hud/HudFight.vue` returned 0 lines.
2. ✅ **v2 PvP routes (V2Fight/V2Matchmaking/V2Spectate) NOT in protectedRoutes** — direct read of router/index.js lines 30-170 confirmed two separate arrays (`protectedRoutes` lines 32-71 + `v2Routes` lines 75-163), independent guard logic.
3. ✅ **No spectator backend handlers** — `grep -rn "spectat" backend/src/websocket/ backend/src/services/` returned 0 hits.
4. ✅ **Bootstrap branch fast-forward** — `git pull --ff-only` succeeded, HEAD `cb84e9d` matches expected Sub-epic 4 handoff commit per ТЗ.

Total tool calls during investigation: ~10 (1 bootstrap + 1 branch switch + 1 fast-forward + 1 spot-grep verification + 1 router read + 5 agent dispatches + 1 file write).

---

## Total File Inventory Touched (Read-Only)

**Read by agents (estimate):** ~45-60 files (v1 PvP scope, v2 PvP scope, backend WS, frontend WS, Vuex modules, mock data, router).

**Read by main Claude:** 1 file (router/index.js lines 30-200 for verification).

**Created:** 1 file (this findings doc).

**Modified:** 0 files.

---

## End of Phase 0 Findings

Path decision (A/B/C/D) is design-Claude's call. All baseline data assembled. No surface conditions blocking. Streak 26 ✅ preserved.
