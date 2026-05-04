# EPIC 6 — SUB-EPIC 5 — PHASE 0 INVESTIGATION REPORT

**Date:** 2026-05-04
**Branch (actual):** `claude/investigate-matchmaking-2JlwO` (harness fresh-slug — NOT continue stack)
**Branch (expected per ТЗ):** `claude/investigate-retirement-authentication-zQeg4` continue stack
**HEAD:** `63d7f7d` ✅ matches ТЗ expected (Sub-epic 4b CL3 handoff)
**Working tree:** clean (`nothing to commit`)

---

## STEP 0 — Bootstrap branch state verification

```
git fetch  → ok (many remote branches refreshed)
git status -uno  → On branch claude/investigate-matchmaking-2JlwO; nothing to commit
git branch --show-current  → claude/investigate-matchmaking-2JlwO
git log --oneline -5:
  63d7f7d docs(4b): Sub-epic 5 handoff (CL3)
  49abd86 docs(4b): final report (CL2)
  bd7ca99 docs(4b): CLAUDE.md update — Sub-epic 4b closure (CL1)
  c90743f feat(pvp): NoConnection mount в AppV2 (Sub-epic 4b C9)
  07ff348 feat(pvp): HudFight surrender button + handler + CSS (Sub-epic 4b C8)
```

**Result:** SAME-SHA DIVERGENCE.

- Harness assigned fresh slug `claude/investigate-matchmaking-2JlwO`; ТЗ specified continue stack `claude/investigate-retirement-authentication-zQeg4`
- HEAD `63d7f7d` matches expected verbatim → **zero work-loss risk**
- Recovery pattern: 4th occurrence of bootstrap branch divergence (5U / Sub-epic 2 / Sub-epic 4a Phase 0 / Sub-epic 4b — Lesson #43 PROMOTED)
- 5th occurrence in this run — adds empirical weight to lesson but does not change tier classification (adaptation-tier per Lesson #35)
- **User authorized adaptation-tier proceed via explicit message** ("adaptation-tier proceed authorized... Recovery #79/#82/#84 precedent")
- Phase 0 is read-only — no commits or edits attempted
- **For Phase 1**: branch reconciliation decision required — either (a) `git checkout` to continue stack like Recovery #82/#84, OR (b) accept harness slug as 11-decision precedent break (5U-style designated branch precedent — 5J-5T continue stack = 9, 5U = designated, 6A-4b on continue stack = 10 sub-epics)

---

## Q1 — Existing matchmaking infrastructure inventory

### Q1.1 — FE WS routing

**File:** `src/core/state/modules/webSocketState.js:164-175`

```js
case 'MatchFoundMsg':
    window.dispatchEvent(new CustomEvent('matchmaking-match-found', { detail: message }));
    break;
case 'MatchmakingQueueMsg':
    window.dispatchEvent(new CustomEvent('matchmaking-queue-update', { detail: message }));
    break;
case 'MatchmakingCancelledMsg':
    window.dispatchEvent(new CustomEvent('matchmaking-cancelled', { detail: message }));
    break;
case 'matchmaking_timeout':
    window.dispatchEvent(new CustomEvent('matchmaking-timeout', { detail: message }));
    break;
```

**4 cases routed**, all REAL impl (forward as `CustomEvent` to window). Pattern: WS-message → window-event (mirrors PvP fall-through chain at lines 179-191). Consumers must `window.addEventListener('matchmaking-*', handler)`.

**Note:** No listener registered in v2 codebase for these events (see Q1.4 below).

### Q1.2 — BE matchmaking service

**File:** `backend/src/services/matchmaking.js` (147 lines, 4584 bytes)

REAL impl — full singleton service:

- `class MatchmakingService` with `queue: Map<odId, entry>` + `expandTimers: Map<odId, intervalId>`
- Exports: `addToQueue(player)`, `removeFromQueue(odId)`, `tryFindMatch(odId)`, `createMatch(p1, p2)`, `getQueueSize()`, `setSendToUser(fn)`
- Queue entry shape (line 31-39):
  ```js
  { odId, username, rating, skin, avatarUrl, searchRange, searchingSince }
  ```
- Constants (lines 8-12): `SEARCH_RANGE_INITIAL=300`, `SEARCH_RANGE_STEP=100`, `SEARCH_RANGE_MAX=1000`, `SEARCH_EXPAND_INTERVAL_MS=5000`, `SEARCH_TIMEOUT_MS=120000` (2 min)
- Calls `pvpMatchManager.createMatch(matchId, p1, p2)` on pair-found (line 119)
- Match ID generated as `match_${Date.now()}_${random36}` (line 112)

### Q1.3 — BE WS handler routing

**File:** `backend/src/websocket/handler.js`

Switch cases (lines 167-173):
```js
case 'MatchmakingStartMsg':
  handleMatchmakingStart(ws, userId, msg);
  break;
case 'MatchmakingCancelMsg':
  handleMatchmakingCancel(ws, userId);
  break;
```

**Handler implementations REAL:**

- `handleMatchmakingStart` (lines 605-632) — validates Captain exists via `getCaptainForCombat(userId)`, errors with `NO_CAPTAIN_SET` if absent, otherwise adds to queue with **authoritative ELO from Captain.elo (NOT client rating)**. Sends `MatchmakingQueueMsg` with `queueSize`. If immediate match → calls `notifyMatch(match)`.
- `handleMatchmakingCancel` (lines 634-639) — calls `matchmaking.removeFromQueue(userId)`, sends `MatchmakingCancelledMsg`.
- `notifyMatch(match)` (lines 642-673) — sends `MatchFoundMsg` to both players with `{ matchId, opponent: { odId, username, rating, skin, avatarUrl } }`.
- **Periodic re-pairing tick** (lines 676-694): `setInterval(3000)` snapshots queue keys, uses `matchedThisTick` Set guard (per CLAUDE.md P1-6 fix), calls `tryFindMatch(odId)` for each, calls `notifyMatch` on hit.

**Disconnect cleanup** (lines 115, 124): `matchmaking.removeFromQueue(userId)` called from both `close` and `error` handlers.

### Q1.4 — FE MatchmakingView

**TWO files exist — v1 and v2 are independent implementations.**

**v1 (`src/views/MatchmakingView.vue`, 645 lines):**

- Real WS integration — dispatches `MatchmakingStartMsg` (line 229-237), `MatchmakingCancelMsg` (line 281-283)
- Listens to 4 events on `window` (lines 202-205): `matchmaking-match-found`, `matchmaking-queue-update`, `matchmaking-timeout`, `match-cancelled`
- 3 phases: `searching` (timer + cancel button + queue/online stats), `found` (VS display + 5s countdown), `timeout` (retry/back buttons)
- Reads from `agent/currentCaptain` getter (lines 130-145) for player data
- Navigates via legacy `router.push({ path: '/fight', query: { mode: 'pvp', matchId } })` (line 271) — **legacy path, not /v2/fight**
- Calls `createPvPFight` action + `SET_PVP_MATCH` mutation with `isPlayer1: false` placeholder (server confirms in `fight_start`)
- Has 5s `countdown.value` timer between match-found and `startFight()` (lines 165-171) — **this IS the 3-2-1 countdown UI for v1, but it's only shown in MatchmakingView, not in FightView**

**v2 (`src/views-v2/MatchmakingView.vue`, 199 lines):**

- **Pure mock — ZERO BE integration.** Uses `mmCandidatesMock.js` Mulberry32 RNG (per CLAUDE.md 5C documentation)
- NO `MatchmakingStartMsg` dispatch (verified via grep — empty result)
- NO `matchmaking-*` event listeners (verified via grep — empty result)
- 2 phases: `'search'` (typeLog CRT animation) | `'results'` (candidate grid)
- Calls `setFightSetup(...)` + `router.push('/v2/fight')` directly with hardcoded captain stub (lines 116-122):
  ```js
  setFightSetup({
    leftName:  'YURII.VARVAROV',  // hardcoded per Epic 4 deferral
    leftArch:  'Captain · Warden',
    rightName: c.name.toUpperCase(),
    rightArch: c.arch.name,
  });
  router.push('/v2/fight');
  ```
- Uses local module-scoped `mmState` (`useMatchmakingState.js`) with `MY_ELO = 1247` constant — NOT real captain ELO

**Route registration:**
- v1: `{ path: '/matchmaking', name: 'Matchmaking', component: '/src/views/MatchmakingView.vue' }` (router/index.js:68)
- v2: `{ path: 'matchmaking', name: 'V2Matchmaking', component: '@/views-v2/MatchmakingView.vue' }` (router/index.js:108-111) — child of `/v2`, **in v2ProtectedNames** (line 77, Sub-epic 4a P1)

**Entry from PitView:** v2 `PitViewV2.vue:38-39` — click on `terminal` plinth → `router.push('/v2/matchmaking')`.

### Q1.5 — V1 matchmaking reference

**v1 fully wired** to BE matchmaking service. v1 file is the canonical pattern reference for:
- WS dispatch shape (MatchmakingStartMsg.matchmakingRequest = { username, rating, skin, avatarUrl })
- Event listener wiring (4 window events)
- 3-phase UI state machine
- Captain data sourcing (`agent/currentCaptain` getter)
- 5s countdown post-match-found
- Cancel + timeout cleanup logic
- Route navigation post-fight-start

**Sub-epic 5 = Path α-style "mock port to real":** v2 already has UI shell (HudMatchmaking + scene + CSS); needs to GUT mock-CRT/typeLog scaffold and WIRE BE WS like v1. Visual aesthetics differ (v1 = pink/dark, v2 = cyan-CRT terminal mood); STATE+EVENT machinery is the migration target.

---

## Q2 — Queue mechanics

### Q2.1 — Storage

**In-memory `Map`** (matchmaking.js:16): `this.queue = new Map()` — singleton service, process-local. NO Redis, NO DB persistence.

**Implication:** Queue does NOT survive server restart. Acceptable for matchmaking semantic (fresh queue on restart = lost waiting players, but BE auto-reconnects users via `clients.set(userId, ws)` and queue can be re-joined). For Sub-epic 5 scope this is non-blocking — pattern parity with v1.

### Q2.2 — Queue entry shape

```js
{
  odId: string,           // user ID
  username: string,       // captain name OR fallback to msg.username
  rating: number,         // captain.elo authoritative (line 619)
  skin: string|null,      // captain.skin OR msg.skin
  avatarUrl: string|null, // msg.avatarUrl
  searchRange: 300,       // expands +100 every 5s (line 52)
  searchingSince: number, // timestamp ms
}
```

### Q2.3 — Pairing logic

`tryFindMatch(odId)` (lines 82-108): **best-rating-proximity within search range**.

```js
let bestMatch = null;
let bestDiff = Infinity;
for (const [oppId, opponent] of this.queue) {
  if (oppId === odId) continue;
  const ratingDiff = Math.abs(player.rating - opponent.rating);
  const maxRange = Math.max(player.searchRange, opponent.searchRange);
  if (ratingDiff <= maxRange && ratingDiff < bestDiff) {
    bestMatch = opponent;
    bestDiff = ratingDiff;
  }
}
```

- Iterates ENTIRE queue per call — O(n) per match attempt; at queue size <100 negligible
- Uses `max(p1.searchRange, p2.searchRange)` so EITHER player's expansion is sufficient
- Returns closest-ELO match (smallest `ratingDiff`)

### Q2.4 — Tier separation

**SINGLE QUEUE.** No casual/ranked tier distinction in BE matchmaking. ALL matches go through ELO-proximity pairing → result PvP fight → ELO update via `pvpCombatEngine.calculateElo` (K=32, line 836).

**Implication for Path C (combined random+ranked):** would require new BE concept (`queueType` field on entry + separate Map per tier OR filter-on-pair). Not currently scaffolded.

---

## Q3 — ELO formula + integration

### Q3.1 — eloService.js inventory

**File:** `backend/src/services/eloService.js` (32 lines, 987 bytes)

```js
const { ELO_K_FACTOR, ELO_MIN, ELO_MAX } = require('../config');

function calculateElo(ratingA, ratingB, result) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  let actualA;
  if (result === 'victory') actualA = 1;
  else if (result === 'draw') actualA = 0.5;
  else actualA = 0;
  const changeA = Math.round(ELO_K_FACTOR * (actualA - expectedA));
  const changeB = -changeA;
  const newRatingA = Math.min(ELO_MAX, Math.max(ELO_MIN, ratingA + changeA));
  const newRatingB = Math.min(ELO_MAX, Math.max(ELO_MIN, ratingB + changeB));
  return { changeA, changeB, newRatingA, newRatingB };
}
module.exports = { calculateElo };
```

**Used by:** `agentFightService.js:10,278` (Captain Agent ranked fights — agent-vs-agent automation).

**NOT used by:** PvP `pvpCombatEngine.js`. PvP has its OWN inline ELO at lines 835-850 (also K=32 but **different return shape** — `{ winnerNew, loserNew }` vs `{ changeA, changeB, newRatingA, newRatingB }`).

```js
// pvpCombatEngine.js:835-850 — INLINE PvP ELO (K=32, no clamp)
calculateElo(winnerRating, loserRating, isDraw = false) {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  if (isDraw) {
    return {
      winnerNew: Math.round(winnerRating + K * (0.5 - expected)),
      loserNew: Math.round(loserRating + K * (0.5 - (1 - expected))),
    };
  }
  return {
    winnerNew: Math.round(winnerRating + K * (1 - expected)),
    loserNew: Math.round(loserRating + K * (0 - (1 - expected))),
  };
}
```

**DUPLICATION OBSERVATION:** Two parallel ELO impls — `eloService.calculateElo` (clamped, asymmetric returns) for agent-vs-agent + inline `pvpCombatEngine.calculateElo` (unclamped, symmetric returns) for PvP. Both K=32 — math equivalent but different APIs. Sub-epic 5 does NOT need to unify these (consolidation = polish carry-over candidate).

**Constants** (`backend/src/config.js`):
- `ELO_K_FACTOR = 32`
- `ELO_MIN = 100`
- `ELO_MAX = 3000`
- `ELO_MATCH_RANGE = 200` — **NOTE:** matchmaking.js uses ITS OWN constants `SEARCH_RANGE_INITIAL=300/STEP=100/MAX=1000`, NOT `ELO_MATCH_RANGE`. Likely legacy unused or for `rankedMatchmaker.js` (agent ranked fights).

### Q3.2 — ELO authoritative source

**Two ELO/rating fields in Prisma:**

1. **`User.rating`** (schema line 25): `Int @default(1000)` — frozen legacy per CLAUDE.md "Captain in Arena" section ("User stats (pveWins, pvpWins, **rating**) are frozen legacy — no longer updated").
2. **`Agent.elo`** (schema line 322): `Int @default(1000)` + index at line 363 — **authoritative for Captain Agents**.

**Captain ELO update on PvP fight end** (`pvpCombatEngine.js:723-747`):
```js
const elo = this.calculateElo(winnerCap.elo || 1000, loserCap.elo || 1000);
// Belt progression for winner...
await prisma.$transaction([
  prisma.agent.update({
    where: { id: winnerCap.id },
    data: { elo: elo.winnerNew, totalFights: ++, wins: ++, lastFightAt: new Date(), ...winnerBeltData },
  }),
  prisma.agent.update({
    where: { id: loserCap.id },
    data: { elo: elo.loserNew, totalFights: ++, losses: ++, lastFightAt: new Date() },
  }),
]);
```

**Captain authoritative throughout matchmaking flow** — `handleMatchmakingStart` reads `captain.elo` (line 619), passes as `rating` into queue entry, `pvpMatchManager.createMatch` uses captain data, fight end updates `captain.elo`.

### Q3.3 — Update trigger points

- **PvP fight end:** `pvpCombatEngine.saveFightResult` lines 723-766. Inside `$transaction` with belt + clan stats updates.
- **Agent ranked fight end:** `agentFightService.runRankedFight` calls `eloService.calculateElo` (line 278).
- **One-time ELO seed** on Captain swap: `captainService.setCaptain` (lines 95-103) — if new Captain has default elo=1000 AND owner has non-default User.rating → seeds Captain.elo from User.rating. Migration helper for legacy User rating → Captain.elo transfer per CLAUDE.md "Captain in Arena" section.

**NO update on User.rating during PvP** — frozen legacy.

### Q3.4 — Display

- **HudProfile (5B/5L) Identity card:** reads `master.userData.captain.elo` per CLAUDE.md "Captain in Public UI" pattern
- **HudRatings (Sub-epic 2 / 5C → Path D Hybrid):** Fighters tab reads from `userModel.captain.elo` field (added in Sub-epic 2 Recovery #83 UserModel extension)
- **Sticky your-row in HudRatings:** `master.userData.captain.elo`
- **v2 MatchmakingView mock:** `MY_ELO = 1247` constant (`useMatchmakingState.js:7`) — NOT real captain (TODO addressed by Sub-epic 5)
- **v1 MatchmakingView:** `playerRating` computed (line 137-139) reads `agent/currentCaptain.elo` OR fallback `pvp/getPvpStats.rating`

**Implication:** Sub-epic 5 visibility expectations — v2 must replace `MY_ELO=1247` constant with real captain ELO (mirror v1 computed pattern).

---

## Q4 — Matchmaking UI overlay infrastructure

### Q4.1 — Mount point

- **Entry:** click on terminal plinth in PitView → `router.push('/v2/matchmaking')` → `V2Matchmaking` route → renders `MatchmakingView.vue` → mounts `<HudMatchmaking>` + builds + activates `'matchmaking'` 3D scene
- Dedicated standalone view + HUD (NOT mounted inside FightView). Pattern parity with v2 ProfileView/RatingsView/ClanView (Pattern A scene-shared, lazy-mount).
- Search overlay = entire HudMatchmaking template (phase='search' shows `.mm-search` block; phase='results' shows candidate grid). NOT a teleport-to-body modal.

### Q4.2 — Existing overlay patterns

**Available v2 overlay primitives:**

- **`NoConnection.vue`** at `src/components/ui/NoConnection.vue` — mounted globally в `AppV2.vue:8` (Sub-epic 4b C9). Reusable.
- **ResultOverlay** at `src/components/hud/common/ResultOverlay.vue` — used in HudFight result phase
- **PrepOverlay** at `src/components/hud/common/PrepOverlay.vue` — used in HudFight prep phase
- **CoachPause** at `src/components/hud/common/CoachPause.vue` — Sub-epic 4a coach choice UI
- **PhModal** at `src/components/hud/common/PhModal.vue` — Sub-epic 5F removed but might still exist for legacy hub modals (verify before reuse)

**v2 mount + scoped CSS conventions** (Lesson #34):
- Root container `position: fixed; inset: 0; pointer-events: none;` (parent)
- Children with `pointer-events: auto;` for interactives (back-btn, cancel-btn, etc.)
- z-index: matchmaking.css uses `z-index: 50-60` for HUD elements (back-btn = 60)
- Backdrop blur via `backdrop-filter: blur(12px)` precedent

### Q4.3 — Layout/styling primitives

**`src/styles/v24/matchmaking.css`** EXISTS (port of prototype 2591-2885 per file header). Major class families:

```
.mm-back              — back button (top-left, fixed, z=60)
.mm-title             — title panel (top-center)
.mmt-kicker / .mmt-name  — kicker label + headline
.mm-filters           — left sidebar filters panel (240px, z=55)
.mmf-title / .mmf-block / .mmf-label
.mmf-range-values / .mmf-slider  — ELO slider
.mmf-chips / .mmf-chip           — filter chips (archetype, belt)
.mm-main              — main content panel (search/results)
.mm-search            — searching phase block
.mms-kicker / .mms-title         — "SEARCHING" headline
.mm-spinner           — animated CSS spinner
.mms-status / .mms-progress-text
.mms-cancel           — cancel button
.mm-candidates-header / .mm-candidates  — results phase grid
.mm-card              — single candidate card
.mmc-head / .mmc-avatar / .mmc-info
.mmc-name / .mmc-arch / .mmc-diff
.mmc-stats / .mmc-stat / .mmc-stat-val / .mmc-stat-label
.mm-actions / .mma-btn / .mma-btn.primary  — Rescan / Start Fight buttons
```

**Reusable patterns from existing fight CSS** (HudFight.vue):
- `.fight-back` (top-left back button) — already mirrors `.mm-back` shape
- `.surrender-btn` (top:90px, right corner, scoped) — Sub-epic 4b precedent for HUD overlay button с auto pointer-events
- `.fight-fighter.left` / `.fight-fighter.right` — VS-style fighter cards (positioned colored borders)
- HudFight uses `--bg-panel`, `--text-mid`, `--text-dim`, `--font-mono` design tokens — same as matchmaking.css

### Q4.4 — UI elements needed (current state)

| UI element | Mock present? | BE wiring present? |
|---|---|---|
| "Searching..." indicator | ✅ `.mm-search` block + `.mm-spinner` | ❌ no listener |
| Cancel button | ✅ `.mms-cancel` btn → `emit('cancel')` → `onCancel()` → `router.push('/v2')` | ❌ no `MatchmakingCancelMsg` dispatch |
| Queue position display | ❌ NOT in mock UI; v1 has "playersSearching: {queueSize}" | ❌ no listener for `MatchmakingQueueMsg` |
| ELO display | ✅ ELO slider shows `±delta` (mock); `MY_ELO=1247` constant | ❌ not from real captain |
| Opponent found notification | ❌ v2 mock skips this — fakes 3-6 candidate cards from RNG | ❌ no `MatchFoundMsg` listener |
| Online players count | ❌ NOT in mock UI; v1 has it via `getOnlinePlayersCount()` REST | ❌ — endpoint `/stats/online` exists |
| Search timer (mm:ss) | ❌ NOT in v2 mock (mock = instant CRT typeLog ~2s); v1 has formattedTime | ❌ — would need timer in v2 view |
| Search range indicator (±N) | ✅ shown in mock (`±{eloDelta}`) but USER-CONTROLLED slider; v1 BE-driven (auto-expanding) | ⚠️ v2 wires user-input filter, BE wires auto-expand — semantic mismatch |
| Match-found 3-2-1 countdown | ❌ NOT in v2 (carry-over #17); v1 has it (5-second `countdown` ref) | N/A |
| Bot opponent indicator | ❌ NOT present anywhere | ❌ no bot infrastructure for PvP |

**Critical gaps requiring scaffold:**
1. NO BE WS listener wiring in v2 `MatchmakingView.vue` (4 events to register: match-found, queue-update, timeout, cancelled)
2. NO `MatchmakingStartMsg` dispatch — v2 currently runs purely client-side
3. NO real captain ELO read — `MY_ELO=1247` hardcode in `useMatchmakingState.js:7` AND `mmCandidatesMock.js:6`
4. NO match-found → fight-start transition (current v2: select candidate + click "Start Fight" → `router.push('/v2/fight')` with `setFightSetup` mock data)
5. NO timer infrastructure (`searchTime` ref + `setInterval` per v1:117,239-254)
6. NO online count fetch infrastructure in v2 — `getOnlinePlayersCount()` exists but not called by v2
7. Filter chips (Archetype, Belt) in mock UI — **BE matchmaking does NOT support archetype/belt filters** (carry-over #11 friendsState analog: backend doesn't accept these as queue params)

---

## Q5 — Cancellation flow

### Q5.1 — Cancel mechanism

**BE-side** (`handler.js:634-639`, `matchmaking.js:71-79`):

```js
// handler.js
function handleMatchmakingCancel(ws, userId) {
  matchmaking.removeFromQueue(userId);
  sendMessage(ws, { type: 'MatchmakingCancelledMsg' });
}

// matchmaking.js
removeFromQueue(odId) {
  this.queue.delete(odId);
  const timer = this.expandTimers.get(odId);
  if (timer) {
    clearInterval(timer);
    this.expandTimers.delete(odId);
  }
}
```

- Removes user entry from queue Map
- Clears expand-timer interval (prevents memory leak from orphaned setInterval)
- Sends `MatchmakingCancelledMsg` ack — FE event `matchmaking-cancelled`

**Disconnect cleanup** (handler.js:115, 124): `ws.on('close')` AND `ws.on('error')` BOTH call `matchmaking.removeFromQueue(userId)`. Prevents queue leaks from disconnect.

### Q5.2 — FE cancel trigger

**v1 (working):** `cancelSearch()` (lines 274-278) → dispatches `MatchmakingCancelMsg` via WS → cleanup intervals → `router.push('/arena')`.

**v2 (gap):** `onCancel()` in MatchmakingView.vue (lines 94-104) cancels typeLog animation + clears resultsTimer + `router.push('/v2')`. **Does NOT dispatch `MatchmakingCancelMsg`** because no queue was ever joined.

**Sub-epic 5 wiring needed:** v2 onCancel must dispatch `MatchmakingCancelMsg` BEFORE router.push, mirror v1 `cancelMatchmakingOnServer()` (line 280-283).

---

## Q6 — Empty queue / no-opponent handling

### Q6.1 — Current behavior

Single user in queue with no peers → **expansion + timeout sequence**:

1. `searchRange` starts at 300, expands +100 every 5 seconds (matchmaking.js:44-65) up to 1000 max
2. Periodic `setInterval(3000)` re-runs `tryFindMatch` for all queued players (handler.js:676-694)
3. After `SEARCH_TIMEOUT_MS=120000` (2 min) elapsed since `searchingSince` → `_sendToUser(odId, { type: 'matchmaking_timeout', reason: 'search_timeout' })` then `removeFromQueue` (matchmaking.js:55-62)
4. FE receives `matchmaking_timeout` → window event `matchmaking-timeout` → v1 sets `status='timeout'` and shows retry/back UI

**No bot fallback** — if 2 minutes pass with no opponent, user gets timeout screen.

### Q6.2 — Bot opponent infrastructure

**EXISTS for agent-vs-bot training, NOT for PvP-vs-bot fallback.**

- **`backend/src/services/agentCombatEngine.js:597-644`** — `generatePveBot(agentElo)` returns `{ agent, tactics, progression }` shape (agent-shape, not user-shape)
- Used by `agentFightService.runPveTraining` → `_executeFight` (auto-fight scheduler)
- **Cannot be plugged into `pvpCombatEngine`** — pvpCombatEngine.PvPMatch class expects WebSocket-attached players (`player1.socket = ws`, sends emits via `ws.send`). Bot has no socket.
- Adapting for PvP-vs-bot would require new `BotMatch extends PvPMatch` class OR `simulateAgentVsBot()` synchronous function returning result without socket round-trip
- **Captain Agent pool reuse** for bot opponents possible in theory (`prisma.agent.findMany({ where: { isCaptain: false }, orderBy: { elo: ... } })`) but again — captains have no sockets

**Decision implication for Path D:** Bot-fallback PvP requires NEW infrastructure layer (bot adapter or socketless PvP match path). NOT simple reuse of existing `generatePveBot`. Estimate: +5-7 commits beyond Path A baseline.

---

## Q7 — Timeout behavior

### Q7.1 — Existing timeout patterns

**Matchmaking timeout:** `SEARCH_TIMEOUT_MS = 120000` (2 min) in matchmaking.js:12 — fires from inside the per-user expand timer interval (line 55-62).

**Cleanup discipline correct:**
- Timer is `setInterval` stored in `this.expandTimers` Map (matchmaking.js:65)
- Cleared on: `removeFromQueue` (line 75-77), timeout expiry itself (line 60), match creation (createMatch calls removeFromQueue line 115-116)
- `setSendToUser(fn)` callback registered in handler.js:15 to avoid circular dependency — clean architecture pattern

**Different from `MATCH_TIMEOUT_MS` (4b C1):** That is a wall-clock backstop on ACTIVE PvP match (10 min hard cap). Matchmaking 2-min timeout is for QUEUE wait, not ongoing fight.

### Q7.2 — Timeout UX

**v1 has UX:**
- `onMatchmakingTimeout()` (line 178-184) sets `status.value = 'timeout'`
- Renders `<.timeout-container>` block with icon + "No players found" title + retry button + back button
- v1 also has client-side timeout (lines 247-253): if `searchTime >= 120` → forces timeout state + dispatches `MatchmakingCancelMsg` (defensive double-cancel — server may have already removed)

**v2 has NO timeout UX path:**
- Mock typeLog runs ~2s → always shows results phase with 3-6 fake candidates (mmCandidatesMock.js:51 — `count = 3 + floor(rng() * 4)`)
- No `'timeout'` phase in `mmState.phase` enum (only `'search' | 'results'`)
- HudMatchmaking has no timeout-state template branch

**Sub-epic 5 scaffold needed:**
- Add `'timeout'` phase to `mmState.phase` enum in `useMatchmakingState.js`
- Add `<v-if mmState.phase === 'timeout'>` template branch in HudMatchmaking
- Wire `matchmaking-timeout` event listener in MatchmakingView → `enterTimeoutPhase()`
- Reuse v1 visual pattern OR redesign to match v2 cyan-CRT aesthetic (design-Claude decision)

---

## Q8 — Race conditions

### Q8.1 — Cancel-during-pair race

**No explicit guard in matchmaking.js for "user cancels during pair found".** Sequence analysis:

1. Periodic interval (handler.js:676-694) runs every 3s → `tryFindMatch(odId)` returns match
2. `createMatch(p1, p2)` calls `removeFromQueue(p1.odId)` AND `removeFromQueue(p2.odId)` (lines 115-116)
3. After step 2, match is registered in `pvpMatchManager` — both players LOCKED into match
4. `notifyMatch(match)` sends `MatchFoundMsg` to both — even if one had clicked Cancel between intervals, the cancel would have hit BEFORE step 1 (queue snapshot) OR AFTER step 4 (already in pvpMatchManager match)

**Race window:**
- Cancel hits between step 1 (snapshot) and step 2 (createMatch) — periodic uses `matchedThisTick` Set, but does NOT re-check `queue.has(odId)` after `tryFindMatch` returns the pair (uses `matchmaking.queue.has(odId)` at line 685 ONLY for outer iteration, not for the picked partner)
- **Verdict:** Theoretically possible — if user 1 cancels just before periodic interval picks user 1 as partner for user 2, user 2 still gets matched but user 1's queue was emptied → matchedThisTick lock on user 1 but match created with user 1's odId. After createMatch, removeFromQueue is no-op (already gone). User 1 receives both `MatchmakingCancelledMsg` AND `MatchFoundMsg`. ⚠️
- **Mitigation candidates** (Sub-epic 5 scope decision):
  - Option a: BE adds re-check `if (!queue.has(opponent.odId)) return null` inside tryFindMatch after pick
  - Option b: FE handles this race — if `MatchFoundMsg` arrives AFTER user clicked Cancel locally, ignore + send Cancel-Match (would need new BE-side `cancel_match` msg)
  - Option c: Document as known edge case, accept (matches existing handlePvPDisconnect pattern — match auto-ends if disconnected user fails pvp_ready)

### Q8.2 — Opponent disconnect during search

`ws.on('close')` (handler.js:115) calls `matchmaking.removeFromQueue(userId)`. Disconnected user's entry is purged → next `tryFindMatch` won't pick them. Good.

But... `_replaced` flag check (handler.js:113): if WS reconnected fresh, old socket close does NOT trigger removeFromQueue (replaced socket case). Could leave user in queue with stale socket reference? **Verify in subsection 4.** Looking at code: queue entry stores `odId`, `username`, `rating`, `skin`, `avatarUrl` — NOT socket. So stale socket isn't an issue; `notifyMatch` looks up CURRENT ws via `clients.get(odId)` (lines 643-644). Safe.

### Q8.3 — Double-queue (queue while in active fight)

**No guard.** `addToQueue` removes existing queue entry (line 29) but does NOT check if user is in active PvP match.

**Possible flow:**
1. User joins matchmaking queue (queueA)
2. User accepts friend-challenge → enters PvP match
3. Match in progress, user mid-fight
4. User opens new tab/window, navigates `/v2/matchmaking`, sends `MatchmakingStartMsg`
5. `getCaptainForCombat` succeeds (captain still exists), `addToQueue` adds entry (overwriting nothing — first time queueing)
6. Periodic interval finds another match, creates a SECOND PvP match for user
7. `pvpMatchManager.createMatch` may collide if matchId is unique but user is already player1 in another match → check `getMatchByPlayer` would return wrong match downstream

**Mitigation candidate:** `handleMatchmakingStart` should check `pvpMatchManager.getMatchByPlayer(userId)` BEFORE addToQueue. If user is in active match, reject with `ALREADY_IN_FIGHT` error.

**Captain `status='fighting'` field exists** (Prisma schema, agent line, cited at agent.status default 'idle'). Per CLAUDE.md "Club Mode Agent system" + captainService.js:30 (`if (newCaptain.status === 'fighting')` — used in setCaptain). Could check `captain.status !== 'idle'` in matchmaking start as defensive guard. **NOTE:** captain.status is for AUTO-FIGHT scheduling (idle/fighting/resting per CLAUDE.md ТЗ-01) — semantic for agent's auto-fight state, NOT manually-driven PvP fights. Investigation needed if PvP combat updates captain.status. Checking pvpCombatEngine... lines 723-747 update `wins`, `losses`, `elo`, `belt`, `qualifiedWins` but NOT `status`. **So captain.status is unreliable for "user is in PvP fight" check** — must use `pvpMatchManager.getMatchByPlayer` instead.

---

## Q9 — Match creation handoff

### Q9.1 — Pairing → match creation

`matchmaking.createMatch(p1, p2)` (lines 110-138) calls `pvpMatchManager.createMatch(matchId, ...)`:

```js
pvpMatchManager.createMatch(matchId, {
  odId: player1.odId,
  username: player1.username,
  skin: player1.skin || null,
  avatarUrl: player1.avatarUrl || null,
  deck: [],   // populated later via pvp_ready
}, {
  odId: player2.odId,
  username: player2.username,
  skin: player2.skin || null,
  avatarUrl: player2.avatarUrl || null,
  deck: [],
});
```

**Player ordering: FCFS (first-found in queue iteration order).**

Iteration order in `tryFindMatch` is determined by Map insertion order (`for (const [oppId, opponent] of this.queue)`). The CALLING player's `odId` becomes player1; the BEST-MATCH opponent becomes player2. This is **deterministic in queue insertion order**, but not always "earlier-queued user is player1" because the calling player drove the function.

**6th subsection candidate occurrence #2 likely:** Per Sub-epic 4b C10 STOP — `isPlayer1: false` in ChallengeNotification was semantically correct because "acceptor=player2 by friend-challenge convention". For matchmaking flow, neither user is "challenger/acceptor" — pairing is symmetric and player1/player2 assignment is whoever was iterated first. v2 FightView's `onPvPFightStart` uses `data.player1?.odId === myId` derivation (line 64-67) — that handles the symmetric case correctly.

### Q9.2 — Match notification

`notifyMatch(match)` (handler.js:642-673) sends `MatchFoundMsg` per player:

```js
{
  type: 'MatchFoundMsg',
  matchId,
  opponent: {
    odId: <other player>,
    username,
    rating,
    skin,
    avatarUrl,
  }
}
```

**Note:** Each player only gets opponent data (NOT both p1 and p2). FE must remember "I am the calling user" and treat opponent as the other side. v1 stores `foundOpponent.value = data.opponent` (line 161) and uses it for VS display.

After both players send `pvp_ready`, `match.start()` triggers `fight_start` emit (pvpCombatEngine.js:132-138) which CONTAINS BOTH `player1` and `player2` objects with `odId`s. v2 `onPvPFightStart` derives `isP1 = data.player1?.odId === myId` (FightView.vue:64-67) — symmetric handling.

### Q9.3 — Handoff к FightView

**v1 path** (MatchmakingView.vue:257-272):
1. `onMatchFound(e)` → `foundOpponent.value = data.opponent` + `status = 'found'` + 5s countdown starts
2. After countdown: `startFight(matchId)` → `pvp/createPvPFight` action + `pvp/SET_PVP_MATCH` mutation + `router.push({ path: '/fight', query: { mode: 'pvp', matchId } })`
3. FightView (CardFightView.vue) reads `route.query.mode === 'pvp'` (line 265) and dispatches `pvp_ready` via WS

**v2 path needed (Sub-epic 5):**
- Mock currently calls `setFightSetup({...})` + `router.push('/v2/fight')` — bypasses pvp/SET_PVP_MATCH entirely
- For real path: replace mock callback with: `pvp/SET_PVP_MATCH` mutation → `router.push('/v2/fight')` (no query param needed — v2 FightView uses `matchActive` computed `store.getters['pvp/getCurrentMatchId'] !== null` per FightView.vue:35)
- v2 FightView already wired (Sub-epic 4a):
  - Line 372: `if (matchActive.value) { ... }` branch
  - Line 395: dispatches `pvp_ready` with deck + modules
  - Line 412: registers `pvp-fight_start` listener → `onPvPFightStart`
  - Line 64-67: derives `isP1` from `data.player1?.odId === myId` (semantic-safe)

**No handoff infrastructure needed in v2 FightView** — Sub-epic 4a wired everything for `matchActive=true` path. Sub-epic 5 only needs to ensure `pvp/SET_PVP_MATCH` is committed BEFORE router.push (mirror v1 startFight pattern).

**Question for design-Claude:** keep 5s post-match-found countdown UI (v1 pattern) OR transition immediately (v2 mock currently goes direct to fight)? Carry-over #17 (3-2-1 countdown gap) most natural placement = matchmaking-found phase (post-match-found countdown), NOT pre-fight in FightView. Bundle decision recommendation in Path candidates section below.


---

## Subsection 1 — API contract verification

**WS message types (exact strings):**

| Message | Direction | Payload shape |
|---|---|---|
| `MatchmakingStartMsg` | FE→BE | `{ type, matchmakingRequest: { username, rating, skin, avatarUrl } }` — note BE only reads `username, skin, avatarUrl` from request, ignores client rating; uses captain.elo authoritatively |
| `MatchmakingCancelMsg` | FE→BE | `{ type }` — no body |
| `MatchmakingQueueMsg` | BE→FE | `{ type, queueSize: number }` |
| `MatchFoundMsg` | BE→FE | `{ type, matchId: string, opponent: { odId, username, rating, skin, avatarUrl } }` |
| `MatchmakingCancelledMsg` | BE→FE | `{ type }` — no body |
| `matchmaking_timeout` | BE→FE | `{ type, reason: 'search_timeout' }` — **lowercase_underscore type, distinguishes from PascalCase BE→FE convention** |
| `ErrorMsg` | BE→FE | `{ type, error: string, code: 'NO_CAPTAIN_SET' \| ... }` — emitted if captain missing |

**Notable inconsistency:** 4 of 5 BE→FE matchmaking msg types are PascalCase (`MatchFoundMsg`, etc.) but `matchmaking_timeout` is snake_case lowercase. **Reason**: per matchmaking.js:58 inline comment "Send timeout — remove after 2 minutes" — was added later, used PvP-msg-style snake_case. v2 webSocketState.js handles it correctly at line 173. NOT a Sub-epic 5 fix target (BE convention drift).

**Constants imports:**
- `SEARCH_RANGE_INITIAL=300, STEP=100, MAX=1000, EXPAND_INTERVAL_MS=5000, TIMEOUT_MS=120000` — defined in matchmaking.js, NOT in `config.js` (unlike PvP combat constants `MATCH_TIMEOUT_MS`, `COUNTDOWN_MS`, `ELO_K_FACTOR` which are in config.js). **Style inconsistency** — Sub-epic 5 may want to migrate to config.js for consistency (carry-over candidate, or bundle if cheap).

**Field names (id vs odId):**
- WS msgs use `odId` (e.g., `MatchFoundMsg.opponent.odId`, `pvp_ready.matchId`)
- Vuex `master.userData.id` is user ID — equivalent to `odId` (verified Sub-epic 4a Recovery context)
- v2 FightView line 64-67 uses `myId = master.userData.id` to compare against `data.player1.odId` — **field-name mismatch BUT semantically equivalent** (same UUID string, different name conventions)
- `pvpMatchManager.getMatchByPlayer(userId)` accepts userId param (NOT odId) — same value, different name
- Sub-epic 4a established convention: BE WS uses `odId`, FE state uses `id` — both are user UUID

**Getter paths:**
- `store.getters['agent/currentCaptain']` — returns Captain Agent OR null (Vuex agent module)
- `store.getters['master/getMaster']` — returns master object with `.userData`
- `store.getters['pvp/getCurrentMatchId']` — string|null
- `store.getters['pvp/getOpponentInfo']` — opponent obj with `{odId, username, rating, skin, avatarUrl}` (matches MatchFoundMsg.opponent shape)
- `store.getters['pvp/getIsPlayer1']` — boolean
- `store.getters['pvp/getPvpFightStatus']` — 'idle'|'ready'|'in_fight'|'finished'

**Mutation/action signatures:**
- `pvp/SET_PVP_MATCH({ matchId, opponent, isPlayer1 })` — sets match + status='ready'
- `pvp/RESET_PVP_FIGHT()` — clears all
- `pvp/createPvPFight({ opponent, isRanked = false })` — creates fight record + saves to localStorage
- `pvp/finishPvPFight(result)` — finalizes
- `webSocket/sendMessage(msgObj)` — dispatches via WS

**v1/v2 architecture deltas:**
- v1 navigates `/fight?mode=pvp&matchId=X` query string; FightView reads `route.query.mode === 'pvp'` (CardFightView.vue:265)
- v2 navigates `/v2/fight` plain; FightView checks `matchActive = pvp/getCurrentMatchId !== null` computed (FightView.vue:35) — relies on `pvp/SET_PVP_MATCH` having been committed BEFORE navigation
- **Sub-epic 5 implication:** v2 must commit `pvp/SET_PVP_MATCH` BEFORE `router.push('/v2/fight')`, mirror v1 startFight pattern lines 257-272 but adapt to query-less v2 routing

---

## Subsection 2 — Negative-space verification

**EXISTS:**

- ✅ `MatchmakingView.vue` v2 — at `src/views-v2/MatchmakingView.vue`, but mock-only
- ✅ `HudMatchmaking.vue` — full UI shell, scoped CSS, prototype 1:1 port
- ✅ `useMatchmakingState.js` — module-scoped reactive `mmState`
- ✅ `MatchmakingScene.js` — 3D scene
- ✅ `mmCandidatesMock.js` — Mulberry32 RNG (Sub-epic 5 must DELETE per 5C precedent of `ratingsMock.js` deletion in Sub-epic 2)
- ✅ `matchmaking.css` — scoped to `.app-v2`
- ✅ `backend/src/services/matchmaking.js` — full service
- ✅ `backend/src/services/eloService.js` — exists but UNUSED by PvP (only by agent ranked)
- ✅ BE `MatchmakingStartMsg` + `MatchmakingCancelMsg` handlers — full impl
- ✅ FE `webSocketState.js` 4 routing cases for matchmaking events
- ✅ Periodic re-pairing tick — `setInterval(3000)` in handler.js
- ✅ Cancel handler BE-side — `removeFromQueue` clears Map + interval
- ✅ Search timeout backstop — `SEARCH_TIMEOUT_MS` 120s wall-clock per-user
- ✅ Captain validation in matchmaking start — `getCaptainForCombat` precondition
- ✅ Search overlay component — `.mm-search` block in HudMatchmaking
- ✅ ELO range expansion — auto +100 every 5s up to 1000

**NOT FOUND (greps returned empty):**

- ❌ Bot opponent for PvP — `generatePveBot` exists but agent-shape; cannot socket-attach to PvPMatch class
- ❌ `pvp/cancel_match` handler for "user joined queue, then closed tab/disconnected during match-found notification" race
- ❌ `MatchmakingStartMsg` dispatch in v2 codebase (greped src/views-v2/, src/components/hud/ — empty)
- ❌ `matchmaking-match-found` listener in v2 codebase (greped — empty in v2 dirs)
- ❌ `matchmaking-queue-update` listener in v2 codebase
- ❌ `matchmaking-timeout` listener in v2 codebase
- ❌ Online players count fetch in v2 (greped `getOnlinePlayersCount` in views-v2/ — empty)
- ❌ Search timer (mm:ss display) in v2 — no `searchTime` ref equivalent in mmState
- ❌ Match-found 3-2-1 countdown in v2 — neither in MatchmakingView nor FightView (carry-over #17)
- ❌ Double-queue guard in handleMatchmakingStart — no `pvpMatchManager.getMatchByPlayer(userId)` precheck
- ❌ Tier-distinguished queue (random vs ranked) — single Map only
- ❌ Per-tier ELO updates (e.g., casual = no ELO change) — pvpCombatEngine ALWAYS updates ELO on PvP fight end
- ❌ Match cancel-during-pair guard (Q8.1 race) — periodic interval doesn't re-check `queue.has(opponent)` after pick
- ❌ Bot-fallback infrastructure — would require new BotMatch class OR socketless PvP simulation path

---

## Subsection 3 — Real CSS class taxonomy dump

**`src/styles/v24/matchmaking.css`** (verified file exists, head 120 lines read):

```
.app-v2 .mm-back              fixed top:14px left:14px z=60, var(--bg-panel), backdrop-blur 12px
.app-v2 .mm-back:hover        pink border tint
.app-v2 .mm-title             fixed top:14px left:50% center
.app-v2 .mm-title .mmt-kicker mono 9px letter-spacing 4px var(--text-dim)
.app-v2 .mm-title .mmt-name   display 22px letter-spacing 4px white
.app-v2 .mm-filters           fixed top:70px left:14px width:240px z=55, sidebar
.app-v2 .mmf-title / .mmf-block / .mmf-label
.app-v2 .mmf-range-values     gold (#FFD262) value display
.app-v2 .mmf-slider           4px height pink-thumb (var(--hex-primary)) glow
.app-v2 .mmf-chips / .mmf-chip       button row, chip selection
.app-v2 .mm-main              main panel
.app-v2 .mm-search            phase=search container
.app-v2 .mms-kicker / .mms-title / .mm-spinner
.app-v2 .mms-status / .mms-progress-text / .mms-cancel
.app-v2 .mm-candidates-header / .mm-candidates  (results phase)
.app-v2 .mm-card / .mm-card.selected
.app-v2 .mmc-head / .mmc-avatar / .mmc-info
.app-v2 .mmc-name / .mmc-arch / .mmc-diff
.app-v2 .mmc-stats / .mmc-stat / .mmc-stat-val / .mmc-stat-label
.app-v2 .mm-actions / .mma-btn / .mma-btn.primary
```

**Reusable patterns from neighbouring HUDs:**

- HudFight: `.fight-back`, `.surrender-btn` (top:90px corner, pointer-events: auto override)
- HudMatchmaking root scoped style block (lines 165-173): `position: fixed; inset: 0; pointer-events: none; z-index: 50; color: #fff;`
- Lesson #34 mandatory: `.app-v2 .matchmaking-hud { pointer-events: none }` + `.app-v2 .mm-back { pointer-events: auto }`

**Sub-epic 5 CSS implications:**
- 'timeout' phase needs new template branch — could reuse `.mms-cancel` style for "Try Again" button or introduce `.mm-timeout` namespace
- "Match Found" phase needs new VS-style block (carry-over #17 countdown bundle decision)
- Existing classes mostly reusable; net CSS additions estimated <50 lines

---

## Subsection 4 — UI infrastructure dependencies

For each handler that Sub-epic 5 will likely add, full chain check:

| Handler | UI element | State field | Dispatch wire | Listener wire | Status |
|---|---|---|---|---|---|
| Join queue (mount) | spinner + "SEARCHING" | `mmState.phase='search'` | `MatchmakingStartMsg` | — | UI ✅ / dispatch ❌ |
| Cancel search | `.mms-cancel` btn | — | `MatchmakingCancelMsg` | — | UI ✅ / dispatch ❌ |
| Queue update | "N opponents searching" | NEW field needed | — | `matchmaking-queue-update` | UI ❌ / listener ❌ |
| Match found | VS display | `pvp/SET_PVP_MATCH` | — | `matchmaking-match-found` | UI ❌ / listener ❌ |
| Match-found countdown | "Fight starts in 3s" | NEW field `mmState.countdown` | — | self-timer | UI ❌ (carry-over #17) |
| Timeout | "No players found" + retry | `mmState.phase='timeout'` (new enum value) | — | `matchmaking-timeout` | UI ❌ / listener ❌ |
| Timer (mm:ss) | "00:34" formatted | NEW field `mmState.searchTime` + `setInterval` | — | self-timer | UI ❌ (also v1-style — could delete from spec) |
| Online count | "23 players online" | NEW field `mmState.onlineCount` | REST `getOnlinePlayersCount()` | self-poll | UI ❌ + REST ✅ |
| Real ELO display | "1234 ±200" instead of mock 1247 | use `agent/currentCaptain.elo` getter | — | reactive | UI ✅ (binding to mock — needs swap) |

**Mock-removal scaffold gaps:**
- ❌ DELETE `mmCandidatesMock.js` (139 lines deletable per 5C ratingsMock.js precedent)
- ❌ DELETE typeLog CRT animation (`useMatchmakingScreen.js` ~127 lines) — OR keep as decorative? Design-Claude decision. Visually cool but irrelevant to real flow.
- ❌ DELETE `MY_ELO` constant from useMatchmakingState.js + mmCandidatesMock.js — replace with reactive captain getter
- ❌ Filter chips (Archetype, Belt) in HudMatchmaking — BE doesn't accept these as queue params. Either: hide entirely, OR keep as VISUAL filter applied client-side AFTER receiving `MatchFoundMsg` (defer-filter pattern), OR ship filters as 5W carry-over for backend extension. Current cleanest: hide / disable in Sub-epic 5, document as carry-over.

**4a precedent: dice handlers without UI = forced 8a/8b split.** Sub-epic 5 must surface ALL UI gaps upfront. Above table lists 9 handlers; 5 have UI gaps. Likely Phase 1 commit splits:
- Commit cluster A (mount + dispatch): 3-4 commits
- Commit cluster B (event listeners + state hydration): 4-5 commits
- Commit cluster C (timeout phase UI + countdown): 3-4 commits if bundling carry-over #17, else 1-2

---

## Subsection 5 — Vocabulary alignment audit

**Phase enum names:**

| Source | Values |
|---|---|
| v2 mmState (`useMatchmakingState.js:10`) | `'search' \| 'results'` |
| v1 status (`MatchmakingView.vue:116`) | `'searching' \| 'found' \| 'timeout'` |
| BE pvpFightStatus (`pvpState.js:94`) | `'idle' \| 'ready' \| 'in_fight' \| 'finished'` |

**Vocabulary mismatch:** v2 uses `'search'` (verb-stem), v1 uses `'searching'` (gerund). Sub-epic 5 may keep v2 terminology OR rename to `'searching' | 'found' | 'timeout' | 'results'`. v2's `'results'` is mock-specific (3-6 fake candidates) — once mock removed, only `'searching' | 'found' | 'timeout'` remain. **Decision needed:** drop `'results'` phase entirely (no candidate-grid in real flow — match is auto-paired) OR keep as "browser pre-Start" before pvp_ready.

**Match type / tier names:**

| Concept | FE | BE |
|---|---|---|
| "Random matchmaking" | `mmState` no tier | matchmaking.js no tier — single queue |
| "Ranked" | `pvpState.createPvPFight({isRanked: true})` (line 174) creates `type: 'pvp_ranked'` | NO ranked vs casual distinction in BE — ALL PvP fights update ELO |
| "Casual / Friendly" | `pvpState type: 'pvp_friendly'` from challenges | NO — friendly challenges ALSO update ELO via `pvpCombatEngine.saveFightResult` |

**CRITICAL ALIGNMENT GAP:** FE has casual/ranked distinction (`isRanked` flag in pvpState), but BE applies ELO updates UNIFORMLY on all PvP fights. Carry-over candidate: gate ELO update on `match.isRanked` flag — NOT in Sub-epic 5 unless Path C/B chosen.

**Field name: ELO/rating/MMR:**

| Context | Name | Type |
|---|---|---|
| Prisma | `User.rating` (legacy) + `Agent.elo` (Captain authoritative) | Int |
| BE matchmaking entry | `entry.rating` (from captain.elo) | Number |
| WS MatchFoundMsg | `opponent.rating` | Number |
| FE pvpStats | `pvpStats.rating` | Number |
| v2 mmState | `MY_ELO=1247` constant + `mmState.eloDelta` (filter param) | Number |
| Captain field | `captain.elo` (Agent shape) | Number |

**Design lint:** `rating` and `elo` used interchangeably for same numeric value depending on layer. NO MMR concept. Sub-epic 5 should standardize on `elo` for v2 (matches Captain field, matches CLAUDE.md "Captain in Public UI" pattern). Mock `MY_ELO` constant rename target → `myElo` computed from `agent/currentCaptain?.elo || 1000`.

**Difficulty labels (mock-only):**

| Mock label (mmCandidatesMock.js:86-89) | Threshold |
|---|---|
| `'Easier'` | `diff < -50` |
| `'Even'` | `-50 ≤ diff ≤ 50` |
| `'Harder'` | `diff > 50` |

**Real flow doesn't need these** — single match-found result, no comparison shopping. Eliminated when mock removed.

---

## Subsection 6 (TRACKING) — Semantic invariant + flow direction verification

**6th subsection candidate occurrence #2 surface check (1st was 4b C10):**

**Player ordering in random match (pairing semantic):**

`tryFindMatch(odId)` (matchmaking.js:82-108) — calling user's `odId` is fixed as `player.rating` reference; iterated opponents compete for "best diff". The CALLING USER's odId becomes player1 in `createMatch(player, bestMatch)` (line 103) → `pvpMatchManager.createMatch(matchId, player1=player, player2=bestMatch)`.

**Periodic interval** (handler.js:676-694) iterates `queuedIds` (Map insertion order) and calls `tryFindMatch(odId)` for each — first iterated user becomes player1 if their `tryFindMatch` returns a hit.

**Implication:** "Earlier-in-queue user becomes player1" is approximately true but NOT strictly — depends on iteration order + which user's `tryFindMatch` finds the match first. v2 FightView's symmetric `data.player1?.odId === myId` derivation handles this correctly without depending on player1/player2 semantic.

**HOWEVER:** If Sub-epic 5 introduces ANY derivation logic that assumes "I am player1 because I clicked Start" or "my opponent is always player2", that would be inverted in 50% of cases (deterministic but not user-controllable). **No such derivation surfaced in current codebase.** Risk only emerges if new code is added.

**Match ID generation:** `matchmaking.createMatch` (line 112) generates `matchId = match_${Date.now()}_${random36}`. Same matchId passed to `pvpMatchManager.createMatch`. Single source of truth — no collision risk.

**ELO update direction:** Symmetric K=32 — winner ratingDiff equal-magnitude opposite-sign loser ratingDiff. Higher-rated winner gets less; lower-rated winner gets more (standard ELO). No asymmetry hidden.

**Bot opponent ordering:** N/A unless Path D chosen.

**Queue position semantics:** `getQueueSize()` returns `Map.size` (count of waiting players). NOT exposed as per-user "you are #3 in queue" — would require sorted index lookup if Sub-epic 5 wants to display position. v1 only shows total queueSize as "playersSearching: N" (line 32). Sub-epic 5 inherits this — total count, not position.

**1st occurrence (4b C10) verdict:** ChallengeNotification `isPlayer1: false` was correct because of friend-challenge BE invariant (challenger=p1, acceptor=p2). For matchmaking flow, BE invariant differs (calling user=p1, paired opponent=p2 from THIS pair perspective; but periodic interval is symmetric over all queue users). **No 2nd occurrence detected in current investigation.** If Phase 1 introduces player-ordering derivation, must carefully verify against actual matchmaking.js semantics.

**Status:** **6th subsection candidate occurrence #2 NOT detected.** Promotion to mandatory subsection deferred — await 2nd actual surface event.

---

## Path candidates basis

### Path A — Random queue first (simplest)

**Status:** BE 100% complete. Pure FE wiring sub-epic.

| Aspect | Detail |
|---|---|
| Commits estimate | **8-10 functional commits** |
| BE files touched | NONE (matchmaking.js stable, ELO update path stable) |
| FE files touched | `src/views-v2/MatchmakingView.vue` (gut mock + add WS dispatch + 4 listeners) · `src/components/hud/HudMatchmaking.vue` (template additions: timeout phase, optional match-found phase + countdown) · `src/scene/interaction/useMatchmakingState.js` (extend phase enum; add searchTime/onlineCount/queueSize/countdown reactive fields; remove MY_ELO; switch to `agent/currentCaptain.elo` reactive read) · DELETE `mmCandidatesMock.js` · DELETE OR KEEP `useMatchmakingScreen.js` (typeLog CRT animation — design decision) |
| New components | None required (HudMatchmaking handles all 3 phases) |
| Risks | (a) mock-removal cascade — if something else imports MY_ELO it breaks · (b) typeLog animation cleanup — currently mounted; design-Claude decides keep-as-decoration vs remove · (c) filter chips disposition (Archetype/Belt) — hide / disable / defer · (d) carry-over #16 reclassification still applies — DO NOT add player1 derivations |

### Path B — Ranked queue first

**Status:** BE 100% complete (BE doesn't distinguish ranked vs casual — ALL PvP fights update ELO). Path B = Path A semantically; only naming/UI distinction.

| Aspect | Detail |
|---|---|
| Commits estimate | **8-10 functional commits** (same as Path A) |
| BE files touched | NONE — BE already always-ranked |
| FE files touched | Same as Path A + add "RANKED" label on title |
| New components | None |
| Risks | Misleading users: if BE always updates ELO, "Casual" mode UI would be a lie. Sub-epic 5 cannot ship "Casual" without BE work. Path B = Path A with ranked-only framing. |

### Path C — Combined random + ranked (largest)

**Status:** Requires BE distinction work.

| Aspect | Detail |
|---|---|
| Commits estimate | **15-20 functional commits** |
| BE files touched | matchmaking.js (add tier param OR separate Map per tier) · pvpCombatEngine.js or pvpMatchManager.js (add `match.isRanked` field to engine, gate ELO update) · handler.js (handleMatchmakingStart accept tier param) |
| FE files touched | Path A files + tier-switcher UI in HudMatchmaking entry · `pvp/SET_PVP_MATCH` should carry `isRanked` flag — already does in `createPvPFight({isRanked})` — needs to be threaded through |
| New components | Tier switcher (segment toggle: Random / Ranked) on matchmaking entry |
| Risks | BE schema change (Fight model has no tier field — would need migration) · Ranked progression visible in UI must reconcile with Captain ELO display · Lesson #33 deploy chain required (BE main merge cherry-pick) |

### Path D — Random + bot fallback (medium-complex)

**Status:** Requires NEW BE infrastructure (no socketless PvP engine path exists).

| Aspect | Detail |
|---|---|
| Commits estimate | **13-17 functional commits** |
| BE files touched | matchmaking.js (add bot-fallback timer per user — e.g. if no human in 30s, dispatch bot) · NEW `botMatch.js` OR extension of pvpCombatEngine to support socketless player2 · pvpMatchManager.js (handle bot match registration) · agentCombatEngine.js (potentially reuse `generatePveBot` agent shape, adapter to PvP shape) |
| FE files touched | Path A files + bot indicator UI ("matched with TitanBot") OR transparent (user not aware) |
| New components | Optional bot indicator badge |
| Risks | Q6.2 deep-dive: `generatePveBot` returns AGENT shape `{agent, tactics, progression}`; PvPMatch class expects `{odId, username, deck, modules, socket}` — adapter needed. Bot ELO impact unclear: should bot wins/losses count? Q3.3 indicates ELO ALWAYS updated — would inflate/deflate Captain ELO via bot fights, undesirable. Bot fight ELO gating is sub-decision. · Lesson #33 deploy chain required for BE work · Carry-over: bot pool seeding if using stored Agent records (for variety beyond procedural `generatePveBot`) |

**Recommendation factual basis (NOT recommendation — design-Claude decides):**
- Path A is fastest closure, leverages 100% BE work done
- Path B = Path A with rebranding only
- Path C extends BE significantly; opens future Casual/Ranked distinction door
- Path D adds bot fallback for empty-queue UX but introduces NEW socketless-PvP infra concept

---

## Carry-over #17 bundle candidate analysis

**Carry-over #17:** v2 countdown UI parity gap (3-2-1 pre-fight overlay).

**Transition flow confirmed:** `/v2/matchmaking` → `MatchFoundMsg` → handoff to `/v2/fight`. Yes, this transition is the natural placement.

**v1 has 5s countdown** between `match-found` event and `startFight()` (MatchmakingView.vue:165-171). Renders as "Fight starts in: 5...4...3..." with pulse animation in `<.fight-countdown>` block.

**v2 BE side already has 3-second countdown** in `pvpCombatEngine.start()` (line 140-142):
```js
this.roundTimer = setTimeout(() => {
  this.nextRound();
}, COUNTDOWN_MS);
```
where `COUNTDOWN_MS=3000`. But this is BE-only timer between fight_start emit and round 1 — FE has no UI for it currently.

**Bundle scope decision (design-Claude / user):**
- **Option a:** ship countdown as part of Sub-epic 5 (matchmaking-side, post-MatchFoundMsg). +1-2 commits. Visual: "Found! Fight starts in 3..." overlay before navigating to /v2/fight.
- **Option b:** ship countdown in /v2/fight (post-fight_start, pre-round-1). +1-2 commits. Mirrors BE COUNTDOWN_MS exactly. More technically correct.
- **Option c:** defer to future sub-epic (Sub-epic 7 or polish round). Honest about scope.

Recommendation factual basis: Option a wins on UX (user sees countdown BEFORE navigation, gives time to mentally prepare). Option b wins on architectural correctness (BE delay maps to FE countdown). Option c keeps Sub-epic 5 minimal (Path A clean closure path).

**Estimated bundle cost:** +1-2 commits regardless of option. Low risk if state-pure (timer + display field). LOW priority for streak-preservation reasons.

---

## Open issues / blockers / questions for design-Claude

1. **Branch reconciliation strategy.** Current: `claude/investigate-matchmaking-2JlwO` (harness fresh-slug, same SHA `63d7f7d`). 5U-style designated-branch precedent vs continue-stack restoration via `git checkout`. User authorized adaptation-tier proceed for Phase 0 read-only; Phase 1 needs explicit decision.

2. **Path selection.** Path A (random simplest, BE complete) vs Path B (ranked rebranding only) vs Path C (combined, BE work +Lesson #33) vs Path D (bot fallback, new BE infra). Factual basis above; user/design decision.

3. **typeLog CRT animation disposition.** `useMatchmakingScreen.js` is a 127-line decorative scaffold. Aesthetic value preserved vs scope-creep removed. NOT functional — purely visual.

4. **Filter chips (Archetype/Belt) disposition.** BE doesn't accept these as queue params. Hide / disable / preserve as future-extension placeholder (5W candidate)?

5. **Race condition Q8.1 (cancel-during-pair).** Mitigation choice: BE re-check (option a), FE handle (option b), document-and-accept (option c). Decision affects whether Sub-epic 5 touches BE.

6. **Double-queue Q8.3 (queue while in active fight).** Scaffold guard or accept theoretical edge case? Lesson #33 deploy chain required if BE touched.

7. **Carry-over #17 (3-2-1 countdown) bundle.** Bundle in Sub-epic 5 (matchmaking side OR fight side) vs defer.

8. **'results' phase disposition.** Mock-only candidate-grid phase. Real flow has no "browse opponents" step (auto-paired). Drop entirely OR repurpose as "match-found preview" (countdown phase 5b decision)?

9. **Mock keep/delete decisions.** `mmCandidatesMock.js` (delete) + `useMatchmakingScreen.js` (decorative — keep/delete) + `MY_ELO` constants (replace with reactive captain getter).

10. **i18n strategy.** v2 HUD inline-EN convention (per CLAUDE.md 5K-5M). Sub-epic 5 inherits — no new locale keys needed UNLESS user wants translations. Carry-over #7 (locale cleanup → English-only) progresses toward "no i18n needed for v2 HUD" eventually.

11. **ELO display location.** v2 HudMatchmaking title shows `MY_ELO=1247` constant — replace with real captain ELO. Live-update if captain ELO changes mid-search? Reactive Vuex getter handles this automatically.

12. **Lesson #43 5th occurrence.** Empirical confirmation (4 occurrences was promotion threshold, this is 5th). No new lesson needed; reinforces existing #43 ("STEP 0 mandatory bootstrap branch verification"). Future bootstraps will continue applying same reflex.

13. **Online players count fetch.** v2 currently doesn't show this; v1 does ("23 players online"). REST endpoint `/v1/stats/online` exists. Bundle into Sub-epic 5 search phase UI OR defer? +1 small commit.

---

## Summary

- **Existing matchmaking infrastructure: ~85% present.** BE 100% (matchmaking.js + handler.js + eloService) + WS routing 100% (webSocketState.js 4 cases) + UI shell ~80% (HudMatchmaking + scoped CSS); v2 wiring 0% (no MatchmakingStartMsg dispatch, no listeners, no real-data binding).
- **Path A** = pure FE wiring sub-epic, 8-10 functional commits, NO BE touch, lowest streak risk. Most factually-supported by Phase 0 findings.
- **Path B** = Path A with rebranding only (BE doesn't distinguish casual/ranked). Same scope.
- **Path C** = adds BE tier infrastructure, 15-20 commits, Lesson #33 deploy chain mandatory, opens Casual/Ranked door.
- **Path D** = adds BE bot infrastructure, 13-17 commits, requires socketless PvP engine layer OR bot adapter, Lesson #33 chain.
- **Estimated Phase 1 size for Path A:** 8-10 commits + 2 closure (FINAL + handoff) + optional 1-2 if bundling carry-over #17. Total 11-14 commits.
- **BE deploy chain expected:** Path A — NO. Path B — NO. Path C — YES (matchmaking.js + pvpCombatEngine.js changes). Path D — YES (new bot infra).
- **6th subsection candidate (semantic invariant + flow direction):** NOT detected occurrence #2 in current investigation. Promotion deferred. Continue tracking for next sub-epic with player-ordering derivations.
- **Lesson #43 5th occurrence** — empirical reinforcement, no candidate promotion. Lesson stays at promoted status from 4b.

**Mode A discipline reminder:** Phase 0 complete. STOP. Await new ТЗ from design-Claude with Path decision before Phase 1 begins. NO commits or edits attempted in Phase 0 (read-only investigation per Lesson #11 reflex applied 0 false-positive recoveries — pure code reads).

