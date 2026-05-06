# Phase 0 Report — Sub-epic 4b (PvP edge cases + safety + BE deploy chain)

**Date:** 2026-05-04
**Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack, HEAD `978b7ff`)
**Type:** READ-ONLY investigation — no edits, no commits
**Scope:** Q1-Q10 + 5 mandatory enhancement subsections

---

## STEP 0 — Branch state

```
Bootstrap branch:        claude/investigate-pvp-safety-mDJjV (harness fresh-slug)
Switched to:             claude/investigate-retirement-animation-zQeg4 (continue stack)
HEAD SHA:                978b7ff (Sub-epic 4b handoff)
Working tree:            clean
Up to date with remote:  yes
```

**Recovery #84 logged** (adaptation-tier per Lesson #35 — environment/harness configuration discrepancy, not code bug). User-authorized switch via Option A. Lesson #43 candidate **4th occurrence validated** (5U / Sub-epic 2 / 4a / 4b) — promotion-ready.

---

## Q1-Q10 FINDINGS

### Q1 SURRENDER

- **BE handler:** **MISSING.** Zero hits for `surrender` in entire backend tree.
- **FE UI button:** **MISSING.** Zero hits in v2 (HudFight.vue / FightView.vue) AND v1 (CardFightView.vue / src/components/). Surrender feature не существовал ни в v1, ни в v2.
- **Match end mechanism:** `pvpCombatEngine.js:559` emits `fight_end` event; payload includes `reason` field.
- **`fight_end` reasons currently supported (3):**
  - `'normal'` — default at fight resolution (pvpCombatEngine.js:613, `result.reason || 'normal'`)
  - `'disconnect'` — set in `onPlayerDisconnect` payload (pvpCombatEngine.js:578) for losing player + DB persistence
  - `'opponent_disconnected'` — set ONLY for surviving player notification (pvpCombatEngine.js:586) via `sendToPlayer(winner, 'fight_end', {..., reason: 'opponent_disconnected'})`
- **Carry-over #16 status:** ChallengeNotification.vue:62 hardcodes `isPlayer1: false`. FightView.vue:62-73 `onPvPFightStart` correctly derives `isP1 = data.player1?.odId === myId` and overwrites via `pvp/SET_PVP_MATCH`. **Functionally fine via overwrite cascade** — single-line source-fix viable but не required.

**State transition for surrender (proposed):** new BE method `engine.surrender(odId)` → status='finished' → emit `fight_end` with `reason: 'surrender'` to loser + `reason: 'opponent_surrendered'` to winner (mirror disconnect dual-reason pattern). DB `Fight.reason` already `String` (no migration needed).

---

### Q2 RECONNECT

- **Current rebind <30s:** WORKS via socket-level mechanism in `handler.js:57-85`:
  - New connection → existing socket marked `_replaced = true` → close handler short-circuits (line 101: `if (ws._replaced) return`)
  - `pvpMatchManager.getMatchByPlayer(userId)` → if active match, `match.player1.socket = ws` (line 78-82) rebinds
  - Match status preserved (status check guards `=== 'finished'`)
- **Round history storage:** **IN-MEMORY ONLY** (`pvpCombatEngine.js:114` `this.roundResults = []`). Persisted к DB ONLY at fight end via `saveFightResult` → `prisma.fight.create({ ..., roundLog: result.roundLog || [] })`.
- **DB persistence current state:** `Fight` model EXISTS (prisma/schema.prisma) with PvP fields: `mode`, `matchId`, `player1Id`, `player2Id`, `player1Hp`, `player2Hp`, `winner`, `reason`, `rounds`, `roundLog Json?`. **But populated ONLY at fight end.** Mid-fight match state (engine instance, current HP, current round, dice cooldowns, coach state, active effects, etc.) lives ONLY in `pvpMatchManager.activeMatches` Map.
- **`fight_state_resume` / `state_resume` / `resume_fight` message types:** **MISSING** entirely. Zero hits backend + frontend (only `replay` matches found are x402 tx-replay protection — unrelated).
- **FE backoff logic:** EXISTS in `webSocketState.js:17-19` — `RECONNECT_BASE_MS = 10000` → max `RECONNECT_MAX_MS = 300000` (5 min), ±20% jitter (`RECONNECT_JITTER = 0.2`). Reset on success (`resetReconnectDelay`).

**Architectural gap для replay:** socket rebinds, но FE `fightState` is stale. No mechanism to send "current match snapshot" to reconnected client. Need either:
- **Option α (minimal):** new `fight_state_resume` BE→FE message с current snapshot {round, leftHp, rightHp, last N round results, status, pause state}, sent immediately после rebind in `handler.js:75-85` block. Pure in-memory read from `engine`, no DB work.
- **Option β (full DB):** persist match state к new `MatchInProgress` Prisma model (or extend Fight with `isCompleted=false` rows) on every state change. Survives server restart. Significant infra.

---

### Q3 DISCONNECT

- **BE detection:** `ws.on('close')` in `handler.js:99-106` → `handlePvPDisconnect(userId)` → `match.onPlayerDisconnect(odId)` → emit `fight_end`.
- **Winner notification msg:** `fight_end` with `reason: 'opponent_disconnected'` sent ONLY to surviving player (loser получает `reason: 'disconnect'` через regular emit chain to BOTH if alive, but disconnected player won't receive). Different reasons for different recipients — already differentiated.
- **FE handling current state:**
  - **v1 CardFightView.vue:1085** — handles `data.reason === 'opponent_disconnected'`
  - **v2 FightView.vue:186, 199** — handles `data.reason === 'opponent_disconnected'`, ResultOverlay shows "Opponent disconnected." summary
- **FE separate disconnect overlay:** **MISSING** — folded into ResultOverlay flow. No transient "opponent left" banner before result. **OK — единая UX path через ResultOverlay приемлема.**
- **Edge cases handling:**
  - Disconnect during `paused_coach` — `onPlayerDisconnect` runs unconditionally (only guard is `status === 'finished'` → return). `clearTimeout(this.pauseTimer)` + `clearTimeout(this.roundTimer)` (lines 570-571) clears all pending timers correctly. ✓
  - Disconnect during dice cooldown — no special state, just `roundTimer` running. Cleared. ✓
  - Mid-round (between roundResult emit и nextRound setTimeout) — roundTimer cleared, status=finished. ✓
- **Race condition on reconnect (≤30s):** old ws.close fires → `_replaced` flag set → close handler short-circuits → no `handlePvPDisconnect` call. ✓ Race-safe.

---

### Q4 CONNECTION LOST UI

- **Backoff logic:** EXISTS (Q2 above).
- **UI feedback v1:** `NoConnection.vue` — fixed-position banner at `bottom: 12vh`, semi-transparent danger color, 5s timer before show, "No connection to server. Please check your internet connection." + Vuetify v-progress-circular spinner. i18n key: `t.connection` (en/ru exist).
- **NoConnection mounted:** **ONLY in App.vue:30** inside `<template v-if="!isV2Route">` block (line 19). **NOT mounted in AppV2.vue** — confirmed by `grep`. Banner is HIDDEN на /v2/* routes.
- **Vuex flag:** `webSocket/isConnected` getter — reactive boolean. Available globally.
- **Decision space:**
  - Mount existing NoConnection в AppV2.vue (cheapest — single-line addition; reuses existing logic + i18n)
  - Build v2-styled overlay (HUD aesthetic match — full-screen modal with backdrop blur OR subtle top banner like VerifyEmailBanner)
  - Recommendation: minimal first iteration — mount NoConnection в AppV2.vue. Polish-tier overlay restyle deferred.

---

### Q5 MATCH TIMEOUT

- **Wall-clock timeout:** **MISSING.** No global match-end timer. No `MATCH_TIMEOUT_MS` constant. No "kill stuck match after N min" mechanism.
- **Existing timeouts:**
  - `MAX_ROUNDS = 10`, `EXTRA_ROUNDS = 2`, `TOTAL_ROUNDS = 12` (round-count limit)
  - `COUNTDOWN_MS = 3000` (pre-fight buffer between fight_start emit и first round)
  - `ROUND_ANIMATION_MS = 1500` (between rounds)
  - `COACH_PAUSE_TIMEOUT_MS = 10000` (coach choice timer)
  - `DICE_PAUSE_TIMEOUT_MS = 10000`
  - `PVP_READY_TIMEOUT_MS = 15000` (cancel match if both players not ready)
  - `WS_PONG_TIMEOUT_MS = 10000`
- **Real time per match worst case (corrected estimate):** ~30-60 seconds active path. 12 rounds × 1500ms = 18s round transitions + ~10s coach pause max + minor dice/move time. **NOT 22 minutes** as handoff section §57-104 estimated. Match auto-completes via round count OR HP-zero before any practical wall-clock concern.
- **Stuck-state risk:** if `onPlayerDisconnect` fails to trigger (e.g. client process crashes без TCP RST) AND ping/pong heartbeat fails — match could remain `running` forever in `activeMatches` Map. Heartbeat (30s ping, 10s pong timeout = 40s total) catches most cases. Wall-clock timeout = defensive backstop.

---

### Q6 ROUND TIMEOUT FE

- **BE pacing constants:** `ROUND_ANIMATION_MS = 1500`, `COUNTDOWN_MS = 3000`.
- **FE countdown component (during round flow):** **NEITHER v1 NOR v2 has it.** Both rely on BE pacing — when round_result arrives, FE renders + waits for next round_result. No "round ending in X seconds" cue.
- **FE countdown component (pre-fight 3-2-1):** EXISTS в v1 (CardFightView.vue:15-20) — `<transition-group class="countdown">` with `countdownValue` ref decrementing from `COUNTDOWN`. FE timer synced с BE COUNTDOWN_MS. **Carry-over #17 directly = THIS gap в v2** (no countdown overlay).
- **v2 PrepOverlay:** zero hits for `countdown` — does NOT render 3-2-1.
- **Decision:**
  - Q6 (round-flow countdown) ≠ carry-over #17 (pre-fight 3-2-1). Both exist as separate concerns.
  - Round-flow countdown — DROP. No precedent в v1, low value.
  - Pre-fight 3-2-1 — bundle с carry-over #17 if visual parity desired.

---

### Q7 SERVER RESTART

- **Match storage:** `pvpMatchManager.js:6` — `this.activeMatches = new Map()` IN-MEMORY ONLY.
- **Restart behavior:** ALL active matches LOST. SIGTERM handler (`backend/src/index.js:127-131`) calls `stopScheduler() + stopDailyTaskCron() + server.close()`. Does NOT notify active match players or persist state.
- **DB schema match table:** `Fight` model ONLY for completed matches (`isCompleted: true`). No `MatchInProgress` model. **Active in-flight match has zero DB representation.**
- **Recovery feasibility:**
  - **Trivial:** ✗ Not possible without schema work.
  - **Requires schema work:** Need `MatchInProgress` model with `engineState Json` field (full engine state serialization), `playersPivot`, `currentRound`, etc. Plus engine deserialization logic (`PvPCombatEngine.fromState()` factory). Plus restart hook in server init to load active matches.
  - **Significant infra:** YES.
- **Recommendation: Sub-epic 4b OUT OF SCOPE.** Defer к dedicated infrastructure work.

---

### Q8 CARRY-OVERS BUNDLE ASSESSMENT

| # | Item | 4b decision | Rationale |
|---|---|---|---|
| #17 | v2 countdown UI parity (3-2-1 pre-fight) | **Bundle candidate** | Direct match с carry-over scope (timing-aware UX); single component (FightCountdown), small scope. **Note:** v2 PrepOverlay must be dismissed first — countdown comes after Start Fight click, before fight_start emit. |
| #18 | Dodge/crit overlay title | **Polish round** | Decoration-only. v1 mechanism = `eventTitle` ref + 1200ms display. v2 merges into log entries (cleaner pattern arguably). Skip. |
| #19 | Shake animation | **Polish round** | Decoration-only. Hits 400ms animation classes `fighter-shake` в v1. v2 has scope to add but не safety-tier. Skip. |
| #20 | Cumulative damage stats | **Polish round** | Stats-display only via `fight/addStats` v1 mutation. Fight result XP/stats already from BE. Skip. |
| #21 | Log actor colors hardcoded warden/predator | **Skip — existing constraint** | Not regression. v2 design constraint accepted. |
| #22 | v2 coach active boost UI | **Polish round** | BE applies effect (4-round duration), UI just doesn't render visible active-boost bar. Skip. |
| #23 | v2 single overlay vs v1 dual coach overlay | **Polish round** | Workaround в текущем v2 (reactive `coachPauseText` mutation handles both states). UX adequate. Skip. |
| #24 | Per-type flash color mapping | **Polish round** | Decoration. Skip. |
| #25 | Dice icon assets | **Polish round** | Cosmetic. v2 currently uses "🎲 ROLL" text. Skip. |
| #26 | Modifiers bar UI | **Polish round** | Skip. |
| #27 | Dice cooldown countdown display | **Skip** | v2 binary ready/not-ready; v1 had cooldownLeft. Polish. |
| #28 | XP earned display absent | **Polish round** | Stats display. BE persists, FE display gap. Skip. |

**Recommended bundle scope (1 item from polish carry-overs):**
- #17 v2 countdown UI parity — IF Path D includes UI work + scope budget allows. Otherwise defer all.

**Recommended defer (12/12):** All carry-overs #17-#28 to polish round / Sub-epic 7. Sub-epic 4b stays focused на functional safety/edge cases.

---

### Q9 CARRY-OVER #16

- **Source-fix scope:** SINGLE-LINE edit in `ChallengeNotification.vue:62` — replace `isPlayer1: false` с derived value `isPlayer1: data.opponent?.odId !== myId` (need access to `master/getMaster?.userData?.id`).
- **Risk:** TRIVIAL. Overwrite cascade in FightView.vue:62-73 already corrects + commits SET_PVP_MATCH. Source-fix removes dead-write only. No functional behavior change.
- **Recommendation:** **Bundle in Sub-epic 4b как scope-trivial cleanup** — Lesson #35 same-file class adjacent fix (similar к 4a's overdrive_start bundle). ИЛИ defer if 4b scope already saturated. Either acceptable.

---

### Q10 BE DEPLOY CHAIN

- **Branch strategy CONFIRMED in CLAUDE.md §"Branch (Git)" lines 764-770:**
  > Backend fixes during visual migration epic (5R-formalized convention): backend code fixes (database, API, services) require separate branch path from visual migration continue stack. Continue stack `claude/setup-5e-shop-mode-a-khIAi` is frontend visual migration work, merges to main only at Epic 6 closure. Backend fixes that need to reach production should: (1) be developed on continue stack first for visual-migration epic record-keeping, (2) be cherry-picked to a new branch from main HEAD (`fix/<short-description>`), (3) PR'd to main → merged → backend auto-deploy via testhexlash service webhook.

- **6B-3a-backend precedent:** PR `fix/user-public-response` → main → Railway auto-deploy. Code-complete + deferred-verify closure shape.
- **5R precedent:** PR #353 `fix/restore-agent-iscaptain-column` → main → empty trigger commit `da01369` (Railway queue workaround).
- **Expected BE files в 4b:**
  - `backend/src/services/pvpCombatEngine.js` — new `surrender(odId)` method, possibly `getStateSnapshot()` для replay
  - `backend/src/websocket/pvpHandler.js` — new `case 'pvp_surrender':` routing + handler logic
  - `backend/src/websocket/handler.js` — extend reconnect block (line 75-85) to emit `fight_state_resume` after socket rebind
  - `backend/src/config.js` — possibly new `MATCH_TIMEOUT_MS` constant if wall-clock timeout in scope
- **Cherry-pick timing recommendation:** **Batch к concluded.** BE changes for surrender + reconnect-replay are coherent set. Single PR `fix/pvp-edge-cases-4b` after all 4b BE work на continue stack. Mirrors 6B-3a-backend pattern (code-complete + deferred-verify). Frontend changes can ship alongside (visual-v2 will merge с main at Эпик 6 closure).
- **GitOps:** `.github/workflows/gitops.yaml` builds на push к `test`/`main` (line 4-7). Frontend Docker image only — backend service self-deploys via separate Railway webhook.

---

## STEP 2 — 5 MANDATORY ENHANCEMENT SUBSECTIONS

### 2.1 API CONTRACT VERIFICATION

#### WS routing (FE side, `webSocketState.js:170-220`)

PvP-related cases that emit CustomEvent (with `pvp-` prefix unless noted):

| BE message type | FE event name | Notes |
|---|---|---|
| `matchmaking_timeout` | `matchmaking-timeout` | (unprefixed) |
| `match_cancelled` | `match-cancelled` | (unprefixed) |
| `fight_start` | `pvp-fight_start` | |
| `round_result` | `pvp-round_result` | |
| `dice_available` | `pvp-dice_available` | |
| `dice_rolled` | `pvp-dice_rolled` | |
| `dice_error` | `pvp-dice_error` | |
| `coach_pause` | `pvp-coach_pause` | |
| `coach_result` | `pvp-coach_result` | |
| `coach_opponent_ready` | `pvp-coach_opponent_ready` | |
| `fight_end` | `pvp-fight_end` | |
| `overdrive_start` | `pvp-overdrive_start` | added в 4a Commit 9 |
| `challenge_received` | `challenge-received` | (unprefixed) + Vuex commit |
| `challenge_sent` | `challenge-sent` | (unprefixed) |
| `challenge_declined` | `challenge-declined-response` | (unprefixed) + Vuex commit |
| `challenge_error` | `challenge-error` | (unprefixed) + Vuex commit |
| `challenge_start` | `challenge-start` | (unprefixed) + 2 Vuex commits |
| `clan_invite` | `clan-invite-received` | (unprefixed) |
| `clan_invite_accepted` | `clan-invite-accepted` | (unprefixed) |

**Default case:** `console.warn('Unknown message type received: ${messageType}')` — **silently logs, не routes.**

**For Sub-epic 4b NEW message types**, FE WS routing must be extended in switch statement BEFORE handler can fire. Convention: pvp-prefixed для match-flow events.

#### `pvpState.js` exact contracts

**State (all fields):**
```js
currentPvPFight: null,
pvpStats: { rating: 1000, wins: 0, losses: 0, draws: 0 },
status: 'idle',                  // 'idle' | 'searching' | 'in_fight' | 'finished'
currentMatchId: null,
pvpFightStatus: 'idle',          // 'idle' | 'ready' | 'fighting' | 'paused' | 'finished'
opponentInfo: null,
isPlayer1: false,
```

**Getters used в Sub-epic 4a + likely 4b:**
- `pvp/getCurrentPvPFight: (s) => s.currentPvPFight`
- `pvp/getCurrentMatchId: (s) => s.currentMatchId`
- `pvp/getPvpFightStatus: (s) => s.pvpFightStatus`
- `pvp/getOpponentInfo: (s) => s.opponentInfo`
- `pvp/getIsPlayer1: (s) => s.isPlayer1`

**Mutations:**
- `pvp/SET_PVP_MATCH(s, { matchId, opponent, isPlayer1 })` — sets currentMatchId, opponentInfo, isPlayer1, pvpFightStatus='ready'
- `pvp/RESET_PVP_FIGHT(s)` — resets all to defaults
- `pvp/setStatus(s, status)` / `pvp/setPvpStats(s, stats)` / `pvp/updateStatsWin/Loss/Draw` / `pvp/setRating(s, rating)`

**Actions:**
- `pvp/finishPvPFight({ commit, state }, result)` — result: 'win' | 'lose' | 'draw'. Updates currentPvPFight.status='finished', stats inc, optional ELO update.

#### Module-scoped `fightState` (NOT Vuex — `useFightSimulation.js:20-41`)

```js
fightState = reactive({
  phase: 'prep',                 // 'prep' | 'fight' | 'result' (NOT 'countdown'/'fighting' as v1 enum)
  round: 0, totalRounds: 5,
  leftHp: 100, leftMaxHp: 100,
  rightHp: 100, rightMaxHp: 100,
  timer: null,
  coachShown: false,
  coachStrategy: 'balanced',     // 'balanced' | 'aggressive' | 'defensive' | 'counter' (mock vocabulary)
  leftName: 'FIGHTER #1', leftArch: 'Captain · Warden',
  rightName: 'FIGHTER #2', rightArch: 'Predator',
  coachPauseOpen: false, coachPauseText: '',
  resultWon: false, resultSummary: '',
  diceReady: false,              // 4a Commit 8b
  diceActiveType: null,          // 4a Commit 8b
});
```

**Phase transitions during PvP:**
- `'prep'` → `'fight'` (in `onPvPFightStart`, FightView.vue:78)
- `'fight'` → `'result'` (in `onPvPFightEnd`, FightView.vue:203)

**For 4b: any new fields** (e.g. `disconnectOverlayOpen`, `reconnectingOverlayOpen`, `surrenderConfirmOpen`, `disconnectGraceTimerSeconds`) follow flat-field convention — NOT nested objects.

#### Backend constants from `config.js`

```js
MAX_ROUNDS: 10,
EXTRA_ROUNDS: 2,
TOTAL_ROUNDS: 12,
COUNTDOWN_MS: 3000,
ROUND_ANIMATION_MS: 1500,
COACH_PAUSE_TIMEOUT_MS: 10000,
DICE_PAUSE_TIMEOUT_MS: 10000,
WS_PING_INTERVAL_MS: ?,        // (used in handler.js heartbeat, line 118)
WS_PONG_TIMEOUT_MS: 10000,
PVP_READY_TIMEOUT_MS: 15000,
```

**For 4b NEW constants potentially:**
- `OPPONENT_DISCONNECT_GRACE_MS` — if grace period before fight_end emit (e.g. 30s wait для reconnect attempt)
- `MATCH_TIMEOUT_MS` — wall-clock match-end backstop

#### Helper / getter paths

- `master/getMaster` returns full master object (UserModel-like). Access `master/getMaster?.userData?.id` for current user ID.
- `master/setInfoMessage` — commit (NOT dispatch). Used FightView.vue:214: `store.commit('master/setInfoMessage', { text: 'Match cancelled', timeout: 3000 })`. Plain `{text, timeout}` shape — InfoMessageModel wrapping optional but accepted.
- `master/setErrorMessage` — same pattern, для destructive feedback. Requires `ErrorMessageModel.withText()` per CLAUDE.md 5L Phase 2 precedent.
- `agent/currentCaptain` — getter `(state) => state.agents.find(a => a.isCaptain) || null`. FightView reads captain progression for `pvp_ready` deck transmission.
- `webSocket/sendMessage` — dispatch (NOT commit). Used FightView.vue:272 for `pvp_ready` emit.

---

### 2.2 NEGATIVE-SPACE VERIFICATION

| Item | Status |
|---|---|
| `pvp_surrender` BE handler | **MISSING** |
| `pvp_surrender` FE message emit | **MISSING** |
| `surrender` button в HudFight v2 | **MISSING** |
| `surrender` button в HudFight v1 (CardFightView) | **MISSING** (zero precedent) |
| `fight_state_resume` BE→FE message | **MISSING** |
| `fight_state_resume` FE WS routing case | **MISSING** |
| `match_timeout` BE handler / wall-clock timer | **MISSING** |
| `opponent_disconnect_grace` mechanism | **MISSING** (immediate disconnect=loss) |
| DisconnectOverlay component (separate from ResultOverlay) | **MISSING** (folded into Result) |
| ReconnectingOverlay component | **MISSING** (NoConnection v1-only, not on /v2) |
| TimeoutOverlay component | **MISSING** |
| SurrenderConfirm modal | **MISSING** |
| FightCountdown component (pre-fight 3-2-1 в v2) | **MISSING** (carry-over #17 = same gap) |
| `MatchInProgress` Prisma model | **MISSING** (only `Fight` for completed) |
| Server restart match-recovery hook | **MISSING** |
| Vuex state for "connection-lost UI" (separate from `webSocket/isConnected`) | **MISSING** (existing flag adequate) |
| `connection_lost` / `reconnecting` WS state | **MISSING** as message types (FE backoff is internal) |
| i18n key `t.fight.surrender` / `t.connection.opponentDisconnected` | **MISSING in v2 scope** (existing `t.connection`, `t.spectate.*`, `t.pvp.*` partial; new strings expected EN-only по 6B-3a/5N convention) |

**Critical inventory of missing infrastructure for 4b:**

If 4b chooses **Path A (Surrender)**:
- BE: new `pvp_surrender` handler в pvpHandler.js + new `engine.surrender(odId)` method + new emit event
- FE: SurrenderButton element в HudFight, optional SurrenderConfirm modal, new message emit handler
- WS routing: extend FE switch для new fight_end variant if needed

If 4b chooses **Path B (Reconnect-replay)**:
- BE: new `engine.getStateSnapshot()` method + extend `handler.js:75-85` reconnect block to emit `fight_state_resume`
- FE: extend webSocketState switch + new event handler in FightView (`onFightStateResume`) + state-replay UI logic

If 4b chooses **Path C (UI overlays first)**:
- FE-only: mount NoConnection в AppV2.vue OR new overlay component, optionally style restyle к v2 aesthetic

---

### 2.3 REAL CSS CLASS TAXONOMY DUMP

#### `src/styles/v24/fight-overlays.css` (scoped к `.app-v2`)

Phase overlays (PrepOverlay / ResultOverlay):
- `.phase-overlay`, `.phase-overlay.show`
- `.phase-card`, `.phase-card.victory`, `.phase-card.defeat`, `.phase-card.prep-card`
- `.pc-kicker`, `.pc-title`, `.pc-sub`, `.pc-vs`, `.pc-vs-sep`
- `.pc-side`, `.pc-side.left`, `.pc-side.right`, `.pcs-name`, `.pcs-arch`
- `.pc-btn`, `.pc-btn-secondary`, `.pc-btn:hover`, `.pc-btn-secondary:hover`
- `.pc-footer`, `.pc-footer-actions`

Strategy cards (PrepOverlay):
- `.prep-section`, `.prep-section-title`, `.prep-strategies`
- `.strat-card`, `.strat-card.selected`, `.strat-card:hover`
- `.sc-name`, `.sc-eff`, `.ef-plus`, `.ef-minus`

Coach pause overlay:
- `.coach-pause`, `.coach-pause.show`
- `.cp-kicker`, `.cp-text`, `.cp-actions`, `.cp-action`, `.cp-action:hover`

Status colors:
- `.phase-card.victory .pc-kicker { color: #2ee07f }` (green)
- `.phase-card.defeat .pc-kicker { color: #ff4444 }` (red)
- `.ef-plus { color: #2ee07f }` / `.ef-minus { color: #ff8888 }`

#### `src/components/hud/HudFight.vue` `<style scoped>`

Layout containers:
- `.fight-hud` (root)
- `.fight-top`, `.fight-fighter`, `.fight-fighter.left`, `.fight-fighter.right`
- `.cam-switcher`, `.cam-switcher button`, `.cam-switcher button.active`
- `.fight-back`, `.fight-back:hover`
- `.spectate-badge`, `.sb-dot`
- `.fight-log`, `.dice-area`

Fighter cards:
- `.ff-name`, `.ff-arch` (left=#D4A843 gold, right=`var(--hex-primary)` pink)
- `.ff-hp`, `.ff-hp-fill`, `.ff-hp-num`
- `.fight-fighter.left { border-left: 3px solid #D4A843 }` (gold)
- `.fight-fighter.right { border-right: 3px solid var(--hex-primary) }` (pink)

Round indicator:
- `.fight-round`, `.fr-kicker`, `.fr-num`

Log entries (CRITICAL — these were 4a Lesson #11 catch #7):
- `.log-line` (base)
- `.log-line.actor-warden` (left=gold) — `:deep(.ln) { color: #D4A843 }`
- `.log-line.actor-predator` (right=pink) — `:deep(.ln) { color: var(--hex-primary) }`
- `.log-line.miss` — `color: var(--text-dim)` (dimmed)
- `.log-line.crit` — `color: #ff4488; font-weight: 500`
- `.log-line.round` — `color: #fff; margin-top: 6px; letter-spacing: 1.5px`
- `.log-line :deep(.lt)` — round indicator pill

Hit flash:
- `.hit-flash`, `.hit-flash.flash`

Dice (added в 4a Commit 8b):
- `.dice-area`, `.dice-button`, `.dice-button:hover`, `.dice-button:active`
- `.dice-active-pill`

**For Sub-epic 4b NEW overlays:**

Reuse pattern: extend `fight-overlays.css` scoped к `.app-v2` namespace. Mirror `.coach-pause` overlay structure for any new modal-style overlays (disconnect / reconnect / surrender).

Suggested namespace для new overlays:
- `.disconnect-overlay`, `.reconnect-overlay`, `.surrender-confirm`, `.fight-countdown`
- Internal classes: `.do-text`, `.ro-spinner`, `.sc-actions`, `.sc-btn`, `.sc-btn-cancel` (mirror `.cp-*` pattern)
- For status: reuse existing `.victory/.defeat` color palette OR introduce `.warning` (orange/amber) for grace-period messaging

---

### 2.4 UI INFRASTRUCTURE DEPENDENCIES

**For each Sub-epic 4b feature candidate** — full chain mapping (button → state field → handler → WS emit → BE response → state mutation → UI re-render):

#### Surrender flow

| Link | Status | Notes |
|---|---|---|
| Surrender button в HudFight.vue | **MISSING** | Need: `<button class="surrender-btn" @click="onSurrender">` near `.fight-back` corner |
| Click handler `onSurrender` | **MISSING** | New function в HudFight `<script>` block |
| Optional confirm modal trigger | **MISSING** | If decided: new `surrenderConfirmOpen` flag в fightState + SurrenderConfirm component |
| WS emit: `webSocket/sendMessage` `{type: 'pvp_surrender', matchId}` | Channel ready | dispatch chain works (4a Commit 8b precedent) |
| BE handler `case 'pvp_surrender':` в pvpHandler.js | **MISSING** | New handler — get match, validate ownership, call `engine.surrender(odId)` |
| BE engine method `surrender(odId)` | **MISSING** | New method on PvPCombatEngine — set status='finished', clearTimers, emit fight_end with new reason |
| `fight_end` reason='surrender' / 'opponent_surrendered' | **MISSING in payload reasons** | Reuse existing `fight_end` event channel — only string differs |
| FE `onPvPFightEnd` reason branching | EXISTS | Lines 184-194 — already differentiates `opponent_disconnected`. Add `surrender` / `opponent_surrendered` cases |
| ResultOverlay binding для surrender summary | EXISTS | `fightState.resultSummary` line 198 — extend ternary for new reasons |

**Verdict:** Single connected chain. ~3-4 BE additions + ~3-4 FE additions. Coherent scope.

#### Reconnect overlay (own connection lost while in fight)

| Link | Status | Notes |
|---|---|---|
| `webSocket/isConnected` reactive flag | EXISTS | Vuex getter, global reactive |
| Vue watcher `watch(isConnected)` | Pattern exists в NoConnection.vue | Need duplication для v2 OR mount existing component |
| 5s grace timer before show | Pattern exists (NoConnection logic) | Mirror or reuse |
| Overlay component (HUD aesthetic) | **MISSING for v2** | New ReconnectingOverlay.vue OR mount NoConnection в AppV2 |
| Hide-on-reconnect logic | EXISTS в NoConnection | Mirror or reuse |

**Verdict:** Cheapest = mount existing NoConnection в AppV2.vue (1-line). Polish-tier = new v2-styled component.

#### Opponent disconnect overlay (currently folded into ResultOverlay)

| Link | Status | Notes |
|---|---|---|
| BE detection | EXISTS | `handlePvPDisconnect` |
| BE notification message | EXISTS | `fight_end` reason='opponent_disconnected' |
| FE handler | EXISTS | FightView.vue:186 |
| Separate transient overlay (banner) | **MISSING** | Decision: keep ResultOverlay-only OR add transient "Opponent disconnected — you win" before ResultOverlay (1-2s display before phase='result') |

**Verdict:** Folded-into-ResultOverlay path acceptable. Optional polish: 1-2s transient banner для drama (carry-over polish if scope permits).

#### Pre-fight 3-2-1 countdown (carry-over #17)

| Link | Status | Notes |
|---|---|---|
| BE COUNTDOWN_MS constant | EXISTS (3000ms) | Used after fight_start emit before nextRound |
| FE timer synced с BE COUNTDOWN_MS | **MISSING in v2** | Need ref countdown + setInterval pattern (v1 mirror) |
| Countdown overlay component | **MISSING in v2** | New FightCountdown.vue OR inline в HudFight with phase=='countdown' branch |
| Phase transition prep→countdown→fight | **MISSING (current: prep→fight direct)** | Extend phase enum OR add countdownActive flag |

**Verdict:** Standalone mini-feature. Bundle with 4b only if polish carry-overs included.

#### Match timeout (wall-clock backstop)

| Link | Status | Notes |
|---|---|---|
| BE config constant | **MISSING** | Add `MATCH_TIMEOUT_MS` |
| BE engine timer | **MISSING** | New `this.matchTimeout = setTimeout(..., MATCH_TIMEOUT_MS)` в `start()`, cleared в endFight/disconnect/etc |
| BE timeout handler | **MISSING** | New method emits `fight_end` reason='timeout' с draw OR forfeit |
| FE handler в `onPvPFightEnd` | EXISTS | Just need new reason case |

**Verdict:** Defensive; trivial scope. Optional inclusion в 4b.

---

### 2.5 VOCABULARY ALIGNMENT AUDIT

#### Existing alignments (known)

| Concept | FE mock vocabulary | BE vocabulary | Translation layer |
|---|---|---|---|
| Coach choice | `aggressive` / `defensive` / `counter` | `attack` / `defense` / `position` | `ACTION_MAP` в HudFight.vue:123 |
| Dice effects | `heal` / `adrenaline` / `shield` / `blind` / `rage` / `crit` | Same (1-to-1) | None needed |
| Fight result | `win` / `lose` / `draw` | Same | None needed |
| Phase | `prep` / `fight` / `result` (v2) | n/a (BE doesn't use phase enum) | None |

#### New vocabulary candidates для Sub-epic 4b

**Surrender:**
- v1 reference: NONE (not implemented)
- BE expected term: `surrender` (suggests one-word, all lowercase per WS msg type convention `pvp_surrender`)
- FE term: `surrender` (Russian: "сдаться" if i18n но 4b will defer i18n per English-only convention)
- `fight_end` reason flag: `surrender` для loser, `opponent_surrendered` для winner (mirror disconnect dual-reason pattern в pvpCombatEngine.js:578-587)
- **Verdict:** No translation layer needed. Direct alignment.

**Disconnect:**
- BE: `opponent_disconnected` (winner notification), `disconnect` (loser/general)
- FE: same — already aligned
- **Verdict:** Aligned.

**Reconnect:**
- Possible FE concept: "Reconnecting...", "Connection lost"
- BE possible event: `fight_state_resume` (event sent после rebind)
- **Verdict:** No mock layer existed. Suggested term: `fight_state_resume` для message type (consistent с existing `fight_start`/`fight_end` pattern, descriptive ofresume action).

**Timeout:**
- BE possible reason: `match_timeout`, `time_up`, `timeout`
- Existing precedent в codebase: `matchmaking_timeout` (matchmaking layer), `ready_timeout` (PVP_READY_TIMEOUT)
- **Recommended:** `match_timeout` для consistency с existing `*_timeout` naming.

**Connection states:**
- Existing FE Vuex state: `webSocket/isConnected: boolean`
- For UI feedback: existing language `Reconnecting` / `connection` (i18n key) / `offline`/`online`
- **Verdict:** Aligned. Reuse existing i18n key `t.connection` (en/ru exist).

#### Recommended new BE message type vocabulary

| Direction | Type | Use |
|---|---|---|
| FE→BE | `pvp_surrender` | New surrender request |
| BE→FE | `fight_end` (reason='surrender') | Existing event, new reason flag |
| BE→FE | `fight_end` (reason='opponent_surrendered') | Existing event, new reason flag |
| BE→FE | `fight_end` (reason='match_timeout') | Existing event, new reason flag |
| BE→FE | `fight_state_resume` | New event для reconnect-replay |
| BE→FE | `opponent_grace_active` (optional) | If grace period implemented |
| BE→FE | `opponent_grace_expired` (optional) | If grace period implemented |

---

## STEP 3 — RECOMMENDATIONS

### Path candidate ranking (post-investigation)

| Path | Scope | BE work | FE work | Streak risk | Recommended |
|---|---|---|---|---|---|
| **Path A (Surrender first)** | Surrender flow + carry-over #16 source-fix + ResultOverlay reason extensions | Moderate (3 files: pvpHandler / pvpCombatEngine / config optional) | Moderate (HudFight button + handler + reason cases в FightView) | LOW (coherent isolated scope) | **★ Top candidate** |
| **Path B (Reconnect-replay)** | `fight_state_resume` BE→FE + reconnect overlay UI + state hydration | Moderate (handler.js extend + new engine method `getStateSnapshot()`) | High (state replay logic + overlay) | MEDIUM (state-sync edge cases) | Strong second |
| **Path C (UI overlays only)** | Mount NoConnection в AppV2 + opponent-disconnect transient banner | None | Low | LOW | Cheapest, but defers core safety gaps |
| **Path D (Combined slim)** | Surrender + reconnect-minimal + connection-lost UI overlay + wall-clock timeout backstop + carry-over #16 | Moderate-high | Moderate-high | MEDIUM | Best value if user wants comprehensive 4b в single sub-epic |

**Recommendation:** **Path D combined slim** if M-size budget (10-15 commits) is firm. Includes most safety-tier improvements without scope explosion. Excludes server-restart recovery (Sub-epic infrastructure work) and most polish carry-overs (#17-#28).

**Conservative alternative:** Path A surrender-first; defer reconnect-replay к Sub-epic 4c if needed (split — but handoff explicitly says "Не split" так что Path D предпочтительнее).

### Critical decision points для user

1. **Reconnect persistence depth:**
   - **Option α (in-memory snapshot via `fight_state_resume` event)** — small scope, BE in-memory read only, no schema work. ✓ Recommended.
   - **Option β (full DB persistence with restart recovery)** — major scope, schema migration, defer к dedicated infra work.

2. **Wall-clock match timeout:**
   - Include as defensive backstop в 4b? — trivial implementation (~1 const + 1 timer), low risk. ✓ Recommended IF Path D.
   - Skip? — current heartbeat (40s ping/pong) catches most stuck states. Acceptable.

3. **Carry-over #16 source-fix bundle:**
   - Bundle (single-line edit, scope-trivial)? ✓ Recommended.
   - Defer (current overwrite cascade fully addresses functional concern)? Acceptable.

4. **Carry-overs #17-#28 (polish):**
   - Bundle #17 (countdown UI) only if Path D scope budget permits? Marginal value.
   - Defer ALL polish к Sub-epic 7 / dedicated polish round? ✓ Strongly recommended (keeps 4b focus tight).

5. **BE deploy chain timing:**
   - Single PR `fix/pvp-edge-cases-4b` after all 4b BE work на continue stack ✓ Recommended (mirror 6B-3a-backend code-complete + deferred-verify pattern).
   - Per-feature PRs (one for surrender, one for reconnect)? More PR overhead, less coherent batch.

### Surfaces / risks discovered during investigation

- **Race-safe reconnect mechanism EXISTS** (`_replaced` flag pattern в handler.js) — better starting point than expected. Reduces Path B BE scope.
- **DB Fight model already accepts `reason` String + `roundLog Json`** — surrender / timeout reasons require zero schema migration.
- **In-memory match state accessible via `pvpMatchManager.getMatchByPlayer(odId).engine`** — `getStateSnapshot()` method addition trivial.
- **Reactive split risk medium** для Path B — state-replay UI hydration has timing-sensitive edge cases (round_result emit during reconnect window? Engine status during paused_coach reconnect?). Pre-edit verify mandatory.
- **NoConnection v1 component reusable on /v2** — single-line addition в AppV2.vue mounts existing component. Polish-tier restyle deferred.
- **Coach + dice ACTION_MAP layer already established** — pattern reuse for any new vocabulary translations (likely none needed in 4b since `surrender`/`fight_state_resume` align с BE directly).
- **Heartbeat covers most stuck states** (40s ping/pong) — wall-clock match timeout is defensive backstop only, не critical urgency.

### Lesson #11 catches surfaced (pre-edit, no fix-forward)

1. **Wall-clock match timeout estimate corrected** — handoff §57-104 stated "~22 minutes worst case", actual is ~30-60s. (Adaptation-tier note for ТЗ correction.)
2. **`fight_end` reason field already differentiates** disconnect-loser vs opponent-disconnect-winner via `sendToPlayer` + `emit` dual path — already-elegant pattern для surrender mirror.
3. **NoConnection.vue exists already** — initial assumption was "FE has no connection-lost UI". Reality: exists but not mounted в v2.
4. **Carry-over #16 source-fix scope = 1 line** — initial assumption "may require multiple changes". Reality: derive `isPlayer1` from `data.opponent?.odId !== myId`, single line.

### Methodology notes для Phase 1 ТЗ

**Lesson #43 candidate** — promote post-4b closure (4th occurrence validated this session).

**Reactive-split risk profile (vs 4a's 10 catches):** Sub-epic 4b expected fewer catches because:
- Edge-case scope narrower than happy-path 4a (which spanned matchmaking → ready → rounds → coach → dice → end)
- Major architectural patterns established в 4a (flat fightState, ACTION_MAP, position-based actor classes)
- BE message routing pattern proven (overdrive_start case extension precedent)

**Mode A discipline preserved.** Pre-edit + post-edit grep mandatory per Lesson #11. Convention discovery (Lesson #32) reflex applied.

**Closure shape candidates:**
- **Standard linear** (8th application) — if all functional commits land on continue stack + cherry-pick PR resolves successfully
- **Code-complete + deferred-verify** (3rd application after 6B-3a-backend) — if BE PR merge timing dictates frontend tests-via-fallback

### Open questions (для user decision before Phase 1 ТЗ)

1. **Path A / B / C / D selection** (most critical decision)
2. **Reconnect persistence depth** (Option α minimal vs β full DB) — only relevant if Path B/D selected
3. **Wall-clock match timeout** (include in 4b? recommended yes if Path D)
4. **Carry-over #16 bundle** (yes/no)
5. **BE deploy chain timing** (single PR after 4b complete vs per-feature PRs)
6. **Polish carry-overs scope** (defer ALL #17-#28 vs bundle #17 countdown UI)

---

## END PHASE 0 REPORT

**Branch:** clean, ready for Phase 1.
**Streak:** 27 preserved.
**Recovery #84 logged** (adaptation-tier).
**Lesson #43:** 4th occurrence validated — ready for promotion в 4b closure.
**No edits, no commits.** Read-only investigation completed.

Awaiting design-Claude Path decision (A/B/C/D) + answers к 6 open questions before Phase 1 ТЗ composition.
