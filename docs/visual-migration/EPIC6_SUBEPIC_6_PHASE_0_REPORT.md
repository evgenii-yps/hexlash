# Sub-Epic 6 — Phase 0 Investigation Report

**Date:** 2026-05-04
**Sub-epic:** 6 — Real Spectate (replace 5N HudSpectate.vue mock simulation with real BE WebSocket integration)
**Predecessor:** Sub-epic 5 ✅ CLOSED clean (HEAD `018d09e` — CL3 handoff commit)
**Branch entering Phase 0:** `claude/investigate-matchmaking-2JlwO-WfdV0` (fresh-slug variant)
**Streak entering:** 29 ✅ / Эпик 6 progress: 12/14 (86%) / 3 sub-epics к closure
**Cumulative recoveries entering:** 85+ / Lessons promoted: 36

**Investigation discipline:** Read-only. No source file edits. No backend service changes. Phase 0 report file + housekeeping commit only.

**Write strategy:** Preventive split (5R/5T precedent). 3 parts: Part 1 (Header + STEP 0 + Q1-Q5) / Part 2 (Q6-Q9 + 5 mandatory subsections) / Part 3 (6th candidate + Path basis + risks + carry-overs + catch tally). Each part committed + pushed independently. No content loss — split structural only.

---

## STEP 0 — Bootstrap Branch Verification (Lesson #43 ACTIVE)

**Lesson #43 PROMOTED in 4b — 5-occurrence chain validated** (5U / Sub-epic 2 / 4a Phase 0 / 4b Phase 0 / 5 Phase 0). Sub-epic 6 Phase 0 = **6th occurrence** — pattern stable.

**Bootstrap commands executed:**

```
git fetch && git status -uno && git branch --show-current && git log --oneline -5
```

**Output:**

```
On branch claude/investigate-matchmaking-2JlwO-WfdV0
nothing to commit (use -u to show untracked files)
claude/investigate-matchmaking-2JlwO-WfdV0
018d09e docs(sub-epic-5): Sub-epic 6 handoff (CL3 — final closure)
b56bdfc docs(sub-epic-5): final report (CL2)
45e899d docs(sub-epic-5): CLAUDE.md update — Sub-epic 5 closure (CL1)
68f7793 feat(matchmaking): race Q8.1 cancel-during-pair guard (Sub-epic 5 C12)
45c6348 feat(matchmaking): double-queue FE redirect guard (Sub-epic 5 C11)
```

**Decision applied:** **Pre-emptive auth (Recovery #85 precedent — adaptation-tier)**.

| Field | Expected (per ТЗ) | Actual | Match |
|---|---|---|---|
| Branch name | `claude/investigate-matchmaking-2JlwO` | `claude/investigate-matchmaking-2JlwO-WfdV0` | Fresh-slug variant (suffix `-WfdV0`) |
| HEAD SHA | `018d09e` | `018d09e` | ✅ EXACT |
| Working tree | clean | clean | ✅ |
| Top of log | CL3 Sub-epic 6 handoff | `docs(sub-epic-5): Sub-epic 6 handoff (CL3 — final closure)` | ✅ |

**Same SHA, fresh-slug branch variant.** Recovery #85 precedent (Sub-epic 5 Phase 0) — proceed without surface, document as adaptation-tier per Lesson #35. NO surface needed.

**Lesson #43 6th occurrence confirmed.** Pattern continues stable through Эпик 6 sub-epic chain. No promotion needed (already PROMOTED in 4b).

---

## Q1 — Existing Infrastructure Inventory

### Q1.1 — FE WebSocket routing для spectate

**File:** `src/core/state/modules/webSocketState.js` (switch-case lines 133-191)

**Grep result:** **COMPLETELY ABSENT.**

```
grep -n "spectate\|Spectator\|spectator\|SpectateJoin\|SpectateLeave" \
  src/core/state/modules/webSocketState.js
# (empty output)
```

**Existing routing inventory (lines 164-191):**
- `MatchFoundMsg`
- `fight_start`
- `round_result`
- `dice_available`
- `dice_rolled`
- `dice_error`
- `coach_pause`
- `coach_result`
- `coach_opponent_ready`
- `fight_end`
- `overdrive_start`
- `fight_state_resume`

**Document:** NO spectate routing case, stub, or comment. Phase 1 ТЗ must add new case(s) к switch (file:line ~191 — pre-default fallthrough).

---

### Q1.2 — BE spectate service / handler существование

**Command:** `grep -rni "spectator\|spectate" backend/src/ --include="*.js" -l`

**Result:** **COMPLETELY ABSENT** (empty output).

**Document:** Zero BE files match. No service file, no stub, no comment, no different feature. Greenfield BE addition required for any real spectate path.

---

### Q1.3 — BE WS message routing для spectate

**File 1:** `backend/src/websocket/handler.js` switch-case в `handleMessage()` (lines 150-196)

| Line | Message type |
|---|---|
| 151 | `PunchInfoRequestMsg` |
| 155 | `PunchBatchRequestMsg` |
| 159 | `FightTicketMsg` |
| 163 | `FightActionMsg` |
| 167 | `MatchmakingStartMsg` |
| 171 | `MatchmakingCancelMsg` |
| 175 | `pvp_ready` |
| 176 | `dice_roll` |
| 177 | `coach_choice` |
| 181 | `challenge_send` |
| 185 | `challenge_accepted` |
| 189 | `challenge_declined` |

**File 2:** `backend/src/websocket/pvpHandler.js` switch в `handlePvPMessage()` (lines 18-133)

| Line | Message type |
|---|---|
| 20 | `pvp_ready` |
| 77 | `dice_roll` |
| 100 | `pvp_surrender` |
| 114 | `coach_choice` |

**Document:** New spectate-subscribe cases (`SpectateJoinMsg` / `SpectateLeaveMsg`) would plug into either:
- `handleMessage()` в handler.js (top-level pre-default before line 196), OR
- New file `backend/src/websocket/spectateHandler.js` mirroring pvpHandler.js pattern (preferred per separation of concerns).

**No dedicated spectator branch yet.** Convention discovery: pvpHandler.js delegation pattern from handler.js (line 175-177) is precedent для spectateHandler.js delegation.

---

### Q1.4 — FE SpectateView.vue v2 current state

**File:** `src/views-v2/SpectateView.vue`

**Verified line count:** **44 lines** (agent reported 45, off-by-one — actual `wc -l` returns 44).

**Contents:**
- Lines 1-7: comment block (5N marker + Path α discipline note)
- Line 9: `<HudSpectate />` mount (HUD-only Pattern B per 5N — no 3D scene register)
- Lines 29-31: `onMounted` hook adds `keydown` listener (Esc handler)
- Lines 33-35: `onBeforeUnmount` removes `keydown` listener

**Route param access:** `route.params.fightId` NOT directly read in v2 view; passed implicitly to HudSpectate child (which reads via own `useRoute`).

**Document:** v2 SpectateView is pure orchestrator (HUD-only Pattern B per 5N precedent). 44 lines minimal. Phase 1 may need to extend onMounted with WS dispatch + listener registration (mirror Sub-epic 5 MatchmakingView pattern), OR keep orchestrator minimal and concentrate logic в HudSpectate (verify в Q4).

---

### Q1.5 — V1 spectate reference pattern (legacy)

**File:** `src/views/SpectateView.vue`

**Verified line count:** **572 lines** (agent's "243 + style 245-572" decomposition confirmed: template 1-79 / script 81-243 / style 245-572).

**WS subscribe/unsubscribe pattern:** **MOCK-ONLY — NO BE INTEGRATION.**

**Mock simulation evidence:**
- Line 94: reads `route.params.odId` (friend ID — NOT match ID per current 5N pattern)
- Line 95: reads `route.query.odName` (opponent name passed via URL query)
- Lines 134-241: `simulateRound()` + `endFight()` mock logic
- Line 236: `setInterval(simulateRound, ...)` mock tick driver

**No** WS event listeners. **No** BE subscribe/unsubscribe. **No** `webSocket/sendMessage` dispatches.

**Document:** Both v1 (572 lines) and v2 (44 lines + HudSpectate 494 lines) are 100% mock — greenfield для real BE integration. v1 not usable as integration template; both will need new infrastructure.

---

### Q1.6 — pixelIcons.js spectate icon

**File:** `src/data/pixelIcons.js` (lines 984-1006)

**Definition:**
- Icon name: `spectate`
- Category: `social`
- Default color: `var(--hex-arch-ghost)` (cyan/ghost variant)
- 16×16 grid pixel data

**Render verification:** Per CLAUDE.md 5N notes ("spectate icon defined, not yet rendered"). HudSpectate.vue currently uses inline emoji-free design — icon NOT rendered.

**Document:** Icon defined, ready for use, not currently rendered. Phase 1 candidate (cosmetic) для optional integration в HudSpectate header. Likely defer к polish round if не bundled naturally.

---

## Q2 — Spectator Subscription Mechanism

### Q2.1 — How does FE subscribe к match events (existing PvP precedents)

**Precedent 1: `challenge_send` dispatch**
- File: `backend/src/websocket/handler.js` lines 481-515
- FE→BE shape: `{ targetUserId, username, rating, challengerSkin, challengerAvatarUrl }` (challenger fills self meta)
- BE response: dispatches `challenge_received` к target user with `from` field (lines 499-508)

**Precedent 2: `MatchmakingStartMsg` dispatch (Sub-epic 5 baseline)**
- File: `backend/src/websocket/handler.js` lines 605-632
- FE→BE shape: `{ matchmakingRequest: { username, skin, avatarUrl } }`
- BE response chain: `MatchmakingQueueMsg` (line 625) on enqueue → `MatchFoundMsg` (lines 648-671) on pair found

**Precedent 3: `pvp_surrender` dispatch (Sub-epic 4b)**
- File: `backend/src/websocket/pvpHandler.js` line 100
- FE→BE shape: `{ type: 'pvp_surrender' }` (no payload — match resolved via socket→userId lookup)

**Document:** **Proposed `SpectateJoinMsg` shape:** `{ type: 'SpectateJoinMsg', matchId }`. **Proposed `SpectateLeaveMsg` shape:** `{ type: 'SpectateLeaveMsg', matchId }` (or implicit on socket disconnect — see Q7.2).

**FE WS dispatcher:** `webSocket/sendMessage` action (Sub-epic 4a/4b/5 baseline). Reused verbatim — no new dispatcher needed.

**Auth identity:** BE retrieves spectator userId via `clients` Map lookup (handler.js line 472-477 sendToUser pattern), authenticated via JWT-validated socket. NO need for client to pass userId in payload.

---

### Q2.2 — `match.spectators` Set tracking

**File:** `backend/src/services/pvpMatchManager.js` (lines 1-57)

**Match storage:** `activeMatches: Map<matchId, engine>` (line 12).

**Match object IS engine** (PvPCombatEngine instance — NOT nested `.engine` property per CLAUDE.md "match IS engine, no .engine property — 3x BE confirmation").

**Engine constructor (pvpCombatEngine.js lines 75-119) inventory:**

| Field | Purpose |
|---|---|
| `matchId` | Match identifier |
| `player1` | `{odId, username, skin, avatarUrl, socket, ...}` |
| `player2` | `{odId, username, skin, avatarUrl, socket, ...}` |
| `currentRound` | Round counter |
| `maxRounds` | Round limit |
| `status` | enum: waiting/running/paused_coach/finished |
| `roundResults` | Array of round outcomes |
| `pauseTimer` | Coach pause timeout handle |
| `roundTimer` | Inter-round timeout handle |
| `pendingChoices` | Coach choice tracking |

**`spectators` field:** **ABSENT.** Not in constructor.

**Plug-in location:** Line 119 (after `pendingChoices` initialization) — propose `this.spectators = new Map();` (Map<userId, socket> mirror of `clients` Map shape).

**Pattern parity check:**
- `match.player1` / `match.player2` use plain object shape `{odId, username, skin, avatarUrl, socket, ...}`
- `clients` Map в handler.js uses `Map<userId, socket>` shape
- Decision factor для design-Claude: spectators Set<userId> vs Map<userId, socket> — Map preferred (avoids second clients Map lookup on broadcast iteration)

---

### Q2.3 — Pairing logic — who broadcasts

**File:** `backend/src/services/pvpCombatEngine.js` (lines 892-902)

**Existing broadcast helpers:**

```javascript
// Line 892
emit(type, data) {
  const msg = JSON.stringify({ type, ...data });
  try { this.player1.socket?.send(msg); } catch (e) { /* ... */ }
  try { this.player2.socket?.send(msg); } catch (e) { /* ... */ }
}

// Line 898
sendToPlayer(player, type, data) {
  try {
    player.socket?.send(JSON.stringify({ type, ...data }));
  } catch (_) { /* socket closed */ }
}
```

**Patterns:**
- `emit()` — broadcast to BOTH players (dual `socket?.send`)
- `sendToPlayer(player, ...)` — targeted single player

**Proposed `sendToSpectators(type, data)` extension:**

```javascript
sendToSpectators(type, data) {
  const msg = JSON.stringify({ type, ...data });
  for (const socket of this.spectators.values()) {
    try { socket?.send(msg); } catch (_) { /* socket closed */ }
  }
}
```

**emit() extension option:**
- Modify existing `emit()` to also iterate spectators (single-call broadcast to both players + all spectators)
- Trade-off: tighter coupling, но смотри Q3.2 — most events identical для spectators, so emit-extension viable for those events
- Differentiated events (`dice_rolled`, `fight_end` per-player form, `coach_pause` per-player form) require separate `sendToSpectators` logic

**Document:** Two options для design-Claude:
- **Option α:** Extend `emit()` to also broadcast to spectators (covers identical events). Add separate `sendToSpectators` для differentiated events.
- **Option β:** Keep `emit()` unchanged, add explicit `sendToSpectators` calls после every emit/sendToPlayer pair for spectator-relevant events.

Option α more concise но adds implicit behavior; option β more explicit but larger surface area для Phase 1 ТЗ. Decision basis для design-Claude.

---

## Q3 — PvP Event Chain Reuse

### Q3.1 — Existing emit calls inventory

**File:** `backend/src/services/pvpCombatEngine.js`

**Grep result (`emit\|sendToPlayer`):**

| Line | Call type | Event |
|---|---|---|
| 132 | emit | `fight_start` |
| 174 | emit | `overdrive_start` |
| 184 | sendToPlayer (player1) | `dice_available` |
| 187 | sendToPlayer (player2) | `dice_available` |
| 330 | emit | `round_result` |
| 433 | sendToPlayer | `dice_error` |
| 443 | sendToPlayer | `dice_rolled` |
| 463 | sendToPlayer (player1) | `coach_pause` |
| 468 | sendToPlayer (player2) | `coach_pause` |
| 488 | sendToPlayer (otherPlayer) | `coach_opponent_ready` |
| 512 | emit | `coach_result` |
| 568 | emit | `fight_end` |
| 594 | sendToPlayer (winner) | `fight_end` (per-player surrender form) |
| 633 | sendToPlayer (surrenderer) | `fight_end` (surrender form) |
| 636 | sendToPlayer (winner) | `fight_end` (opponent_surrendered form) |
| 680 | emit | `fight_end` (timeout form) |

**All 9 ТЗ-required events verified present:**
- ✅ `fight_start` (line 132)
- ✅ `round_result` (line 330)
- ✅ `dice_available` (line 184, 187 — split per-player)
- ✅ `dice_rolled` (line 443)
- ✅ `coach_pause` (line 463, 468 — split per-player)
- ✅ `coach_result` (line 512)
- ✅ `coach_opponent_ready` (line 488)
- ✅ `fight_end` (lines 568, 594, 633, 636, 680 — multiple forms)
- ✅ `overdrive_start` (line 174)

**Bonus events (not in original ТЗ list):**
- `dice_error` (line 433 — error response к single dice-roller)
- `fight_state_resume` (handler.js line 89, NOT pvpCombatEngine — see Q7.3)

**Document:** ALL events present. Spectator broadcast реuse straightforward — extend existing emit/sendToPlayer call sites OR centralize via `sendToSpectators` helper.

---

### Q3.2 — Authoritative source — identical vs differentiated

**Per-event audit:**

#### `fight_start` (line 132-138) — IDENTICAL
```javascript
{
  matchId,
  player1: { odId, username, skin, avatarUrl, ... },
  player2: { odId, username, skin, avatarUrl, ... },
  maxRounds,
  overdriveStartRound
}
```
Both players receive same payload. Spectator-safe ✅.

#### `round_result` (line 306-330) — IDENTICAL (via emit)
```javascript
{
  round,
  isOverdrive,
  firstAttacker,
  player1: { module, damage, hp, effects, dodged, critted },
  player2: { module, damage, hp, effects, dodged, critted }
}
```
Same payload to both. Spectator-safe ✅.

#### `dice_available` (line 184/187) — IDENTICAL but SPLIT-DELIVERED
```javascript
{ round: currentRound }
```
Sent to both via 2 sendToPlayer calls. Spectator broadcast: needs separate iteration OR consolidate to emit() (would require unifying delivery into single broadcast).

#### `dice_rolled` (line 443-448) — DIFFERENTIATED (per-player perspective)
```javascript
{
  effect,
  hp,                    // rolling player's hp
  oppHp (conditional),   // only for Rage/Crit damage events
  killed (conditional)   // only when oppHp drops to 0
}
```
Only the rolling player gets `hp` field (their own); oppHp/killed conditional. **Spectator perspective concern:** spectator needs BOTH player HP — current shape ambiguous (which player is "self"?).

**Spectator-broadcast adaptation:** Either:
- Spectator receives separate event `dice_rolled_spectator` with `{ rollerId, effect, p1Hp, p2Hp, killed }`
- OR keep same shape but accompany with rollerId field disambiguating

#### `coach_pause` (line 463-470) — IDENTICAL but SPLIT-DELIVERED
```javascript
{ round, timeLimit }
```
Sent to both via 2 sendToPlayer calls. Spectator-safe (single broadcast viable).

#### `coach_opponent_ready` (line 488) — MINIMAL `{}`
Sent only to non-choosing player. Spectator broadcast: questionable utility (spectator doesn't need to know who's "ready first") — may skip OR unify into round_result extension.

#### `coach_result` (line 512-515) — IDENTICAL
```javascript
{
  player1: { action },
  player2: { action }
}
```
Same payload to both. Spectator-safe ✅.

#### `overdrive_start` (line 174) — IDENTICAL
Empty/minimal payload. Spectator-safe ✅.

#### `fight_end` — MULTIPLE FORMS

**Form 1 (line 568) — emit (normal end):** IDENTICAL
```javascript
{
  matchId,
  winner,
  rounds,
  xp,
  player1: { odId, username, finalHp },
  player2: { odId, username, finalHp },
  roundLog
}
```

**Form 2 (line 594, 633, 636) — sendToPlayer (surrender forms):** DIFFERENTIATED
- Includes per-player `reason` field (`'surrender'` vs `'opponent_surrendered'`)
- Spectator perspective: should see neutral event (e.g., `reason: 'surrender'`, `surrenderer: <userId>`) — needs adaptation

**Form 3 (line 680) — emit (match_timeout):** IDENTICAL `{reason: 'match_timeout', winner: 'draw'}`

#### `dice_error` (line 433) — TARGETED (only к dice roller)
Spectator broadcast: skip — error is client-side concern, not match-state event.

**Per-player perspective summary:**

| Event | Identical? | Spectator broadcast viable? |
|---|---|---|
| fight_start | ✅ | ✅ direct |
| round_result | ✅ | ✅ direct |
| dice_available | ✅ (split delivery) | ⚠ need consolidation |
| dice_rolled | ❌ per-player | ⚠ need adaptation (add rollerId, both HPs) |
| coach_pause | ✅ (split delivery) | ⚠ need consolidation |
| coach_opponent_ready | ⚠ targeted-only | ⚠ skip OR redesign |
| coach_result | ✅ | ✅ direct |
| overdrive_start | ✅ | ✅ direct |
| fight_end (normal) | ✅ | ✅ direct |
| fight_end (surrender) | ❌ per-player | ⚠ need neutral spectator form |
| dice_error | ⚠ targeted-only | ⏭ skip |

**Decision factor для design-Claude:**
- **Option α (Path B — broadcast existing events to spectators):** Most events viable directly; differentiated events need adaptation layer (4 events: dice_rolled, fight_end-surrender, optional consolidation для dice_available, coach_pause).
- **Option β (Path C — separate spectator types):** Cleaner separation but L-scope expansion. Add `round_result_spectator`, `dice_rolled_spectator`, `fight_end_spectator` event types with normalized neutral payload shape.

Option α likely viable for Sub-epic 6 closure scope (4 differentiated events have clear minimal adaptation). Option β over-engineering for current sub-epic.

---

### Q3.3 — Rate limiting / spectator queue

**File 1:** `backend/src/websocket/pvpHandler.js`

**Existing rate limits:**
- Line 5: `DICE_ROLL_COOLDOWN_MS = 2000` (max 1 per 2s per player) — Sub-epic 4a P3-1
- Line 8: `coachChoiceSent` Map (one choice per pause session per player) — Sub-epic 4a P3-2
- Lines 79-85: dice_roll cooldown enforcement (lastDiceRoll Map check)
- Lines 119-122: coach_choice rate limit (coachChoiceSent Map check)

**File 2:** `backend/src/services/pvpCombatEngine.js`

**Round-level rate limits:**
- Line 180: `(currentRound - diceUsedRound) >= DICE_COOLDOWN_ROUNDS` (3-round dice cooldown per CLAUDE.md)
- Lines 481-494: `onCoachChoice` guard against double-choice per pause

**Spectator-side rate limiting concern:**

**Amplification math:**
- 10 spectators × ~5-10 events per round × ~10-12 rounds (incl. overdrive) = ~500-1200 socket sends per match
- Single-fight peak burst ≤ 50 messages/sec (round_result + dice_rolled + coach_pause overlapping)
- For typical match volume (few concurrent matches), insignificant

**Existing precedent для spectator throttling:** **NONE.** Codebase has player-action rate limits but не spectator-broadcast throttling.

**Decision factor для design-Claude:**
- **Option A:** No spectator-side throttling (spectators are passive observers, BE just broadcasts verbatim). Acceptable for typical scale (≤10 spectators per match, ≤10 concurrent matches).
- **Option B:** Add per-spectator rate limit / debounce (защита от broadcast amplification at scale). Premature optimization at current scale.

**Document:** Decision deferred к design-Claude. Factual basis: existing rate limits cover player-action surface; spectator broadcast adds passive volume but unlikely к bottleneck at current scale.

---

## Q4 — Spectator UI Overlay Infrastructure

### Q4.1 — HudSpectate.vue current contents

**File:** `src/components/hud/HudSpectate.vue`

**Verified line count:** **494 lines total** (agent reported "223" was script-end, not file-end — discrepancy caught pre-report. **Pre-edit catch #1.**).

**Structure breakdown:**
- Lines 1-12: comment header (5N marker + Path α discipline note)
- Lines 13-75: `<template>` block (63 lines)
- Lines 77-223: `<script setup>` block (147 lines)
- Lines 225-494: `<style scoped>` block (270 lines)

**`<template>` structure (lines 13-75):**

| Element | Lines | Purpose |
|---|---|---|
| `.sp-back` button | 15 | Leave action (← Back) |
| `.sp-header` | 17-23 | Title + spectator count with animated dot |
| `.sp-round-badge` | 25-27 | "ROUND X / 10" badge |
| `.sp-fighters` | 29-47 | Friend + opponent cards with HP bars |
| `.sp-log` | 49-68 | Fight log scrollable list + empty state |
| `.sp-result` (conditional) | 71-73 | Win/Loss result overlay |

**`<script setup>` (lines 77-223):**

**Constants (lines 83-85):**
- `MAX_HP = 100`
- `MAX_ROUNDS = 10`
- `TICK_MS = 2000`

**Reactive state (lines 102-108):**
- `friendHp` (ref Number)
- `opponentHp` (ref Number)
- `currentRound` (ref Number)
- `fightLog` (ref Array<entry>)
- `fightOver` (ref Boolean)
- `winner` (ref String — 'friend' | 'opponent' | null)
- `spectatorCount` (ref Number — mocked random 2-10)

**Mock simulation logic (lines 133-217):**

| Lines | Function | Purpose |
|---|---|---|
| 133-157 | `applyExchange()` | Damage calc + crit check (Math.random 15%) + log entry construction |
| 159-186 | `simulateRound()` | Main loop — increments round, applies damage, drifts spectator count |
| 188-207 | `endFight()` | Resolves winner, sets fightOver flag |
| 213-217 | `onMounted` setup | `setTimeout(1s) → setInterval(simulateRound, TICK_MS)` |
| 220-222 | `onBeforeUnmount` cleanup | `clearInterval(simInterval)` |

**Key fact:** Mock simulation drives ALL state transitions. No external (BE) data input. Phase 1 must replace lines 159-217 entirely (gut), keeping endFight semantic (lines 188-207) — but rebound to BE `fight_end` event payload.

---

### Q4.2 — Mock simulation logic boundary (Phase 1 gut target)

**Boundaries identified:**

| Block | Lines | Phase 1 fate |
|---|---|---|
| `applyExchange()` | 133-157 | **DELETE** — replaced by parsing BE `round_result` payload |
| `simulateRound()` | 159-186 | **DELETE** — replaced by WS event handler `onRoundResult` |
| `endFight()` | 188-207 | **ADAPT** — keep semantic (sets fightOver/winner refs), rebind input from BE `fight_end` payload |
| `onMounted` mock setup | 213-217 | **DELETE** — replaced by `WS dispatch SpectateJoinMsg + listener registration` |
| `onBeforeUnmount` | 220-222 | **ADAPT** — replace `clearInterval` with `WS dispatch SpectateLeaveMsg + listener cleanup` |

**Mirror precedent:** Sub-epic 5 C2 mock-flow gut (`mmCandidatesMock.js` 102 lines + `useMatchmakingScreen.js` 127 lines = 229 lines deleted; replaced with real WS dispatcher chain).

**Sub-epic 6 estimated gut:** ~85 lines deleted (133-157, 159-186, 213-217 = 25+28+5=58 lines, plus mock state init in 102-108 +5 if rebound to fresh refs). Replaced with WS event handler chain (~60-80 new lines) + onMounted/onBeforeUnmount discipline (~20 lines).

---

### Q4.3 — `.sp-*` CSS namespace dump

**Grep targets:**

```bash
grep -n "\.sp-" src/components/hud/HudSpectate.vue        # scoped <style>
grep -rn "\.sp-" src/styles/v24/                          # global v24 styles
```

**HudSpectate.vue scoped classes (29 total):**

| Class | Line | Purpose |
|---|---|---|
| `.spectate-hud` | 228 | Container (root) |
| `.sp-back` | 237 | Back button (top-left) |
| `.sp-header` | 260 | Title + spectator count cluster |
| `.sp-kicker` | 268 | Title kicker text |
| `.sp-spec-count` | 276 | Spectator count display |
| `.sp-spec-dot` | 285 | Animated pulsing dot |
| `.sp-round-badge` | 298 | Round counter badge |
| `.sp-fighters` | 312 | Fighters container (flex row) |
| `.sp-fighter` | 323 | Individual fighter card |
| `.sp-fighter--friend` | 331 | Modifier for friend (left) |
| `.sp-fighter--opponent` | 332 | Modifier for opponent (right) |
| `.sp-fname` | 334 | Fighter name |
| `.sp-hp-bar` | 341 | HP bar container |
| `.sp-hp-fill` | 348 | HP bar fill |
| `.sp-hp-fill--friend` | 353 | Green fill (friend) |
| `.sp-hp-fill--opponent` | 357 | Red fill (opponent) |
| `.sp-hp-num` | 361 | HP numeric value |
| `.sp-vs` | 369 | "VS" divider |
| `.sp-log` | 376 | Fight log container |
| `.sp-log-header` | 390 | Log header bar |
| `.sp-log-list` | 398 | Log entries scrollable list |
| `.sp-log-entry` | 411 | Individual log entry |
| `.sp-log-round` | 421 | Round number cell в entry |
| `.sp-log-actor` | 426 | Actor name cell |
| `.sp-actor--friend` | 427 | Modifier (green) |
| `.sp-actor--opp` | 428 | Modifier (red) |
| `.sp-log-action` | 430 | Action description cell |
| `.sp-log-damage` | 432 | Damage number cell |
| `.sp-log-crit-badge` | 437 | Crit indicator |
| `.sp-log-crit` | 447 | Modifier для crit entries |
| `.sp-log-empty` | 405 | Empty state placeholder |
| `.sp-result` | 449 | Result overlay container |
| `.sp-result-text` | 466 | Result text |
| `.sp-result--win` | 475 | Modifier (green) |
| `.sp-result--loss` | 481 | Modifier (red) |

**`src/styles/v24/` external references:** **ZERO** (grep returns empty).

**Document:** All 29 `.sp-*` classes scoped within HudSpectate.vue — self-contained. No external `src/styles/v24/spectate.css` exists. Phase 1 ТЗ does NOT need to touch v24 styles directory.

---

### Q4.4 — UI elements alignment с real BE chain

**Mapping table:**

| UI element | HudSpectate line | BE event source | Alignment notes |
|---|---|---|---|
| `.sp-round-badge` | 26 | `round_result.round` + `fight_start.maxRounds` | Direct binding ✅ |
| `.sp-fighters` HP (friend) | 32-43 | `round_result.player1.hp` OR `fight_state_resume.player1.hp` | Direct ✅ — but spectator perspective: who is "friend"? See ⚠ below |
| `.sp-fighters` HP (opponent) | 32-43 | `round_result.player2.hp` | Direct ✅ — same perspective concern |
| `.sp-log-entry` | 52-66 | Constructed from `round_result` payload (round, actor, damage, crit) | Adapt — current mock entry shape `{round, actor, action, damage, crit}` largely compatible с round_result fields |
| `.sp-result` | 71-73 | `fight_end.winner` field | Direct ✅ |
| `.sp-spec-count` | 21 | **NO BE EVENT EXISTS** (mocked Math.random) | ⚠ Needs new SpectatorListMsg or similar |

**Spectator perspective concern (KEY QUESTION для design-Claude):**

Mock simulation labels `friendHp` / `opponentHp` (left = friend, right = opponent). Real spectator is third-party — neither player1 nor player2.

**Possible derivation conventions:**

| Option | Rule | Pro | Con |
|---|---|---|---|
| α | `match.player1` always left, `match.player2` always right (BE-truth deterministic) | Simplest | "Friend" terminology в UI breaks (no relationship context) |
| β | Friend (если present in spectator's friends list) on left, other on right | Semantic — preserves "friend" UI | Requires friendship lookup at FE OR BE-side join enrichment |
| γ | "Favorite" (higher ELO) on left | Skill-based ordering | Arbitrary — doesn't preserve "friend" semantic |
| δ | Spectator's chosen perspective (preference toggle) | User control | UX complexity — adds toggle button |

**Document:** Convention discovery basis для design-Claude. Current mock UI assumes friend-context (left=friend), but real spectate may target non-friend matches (live feed Path B+ scope). **Option α with relabeling (`player1Hp` / `player2Hp` neutral naming) likely safest для closure scope.** Friend-perspective enhancement deferrable к polish.

**6th Phase 0 subsection candidate:** **THIS IS THE TRIGGER for occurrence #2.** Spectator-as-third-party perspective requires player-ordering convention derivation. See dedicated section in Part 3.

---

### Q4.5 — Spectator-specific UI

**Existing in mock:**

- **Spectator count display:** YES (line 19-22 template)
  - Binding: `{{ spectatorCount }} {{ t.spectate.spectators }}`
  - Mock source: `Math.floor(Math.random() * 8) + 2` initial + `Math.random()`-based drift в simulateRound (line 184)
  - Real BE source: **ABSENT** — needs new SpectatorListMsg or extension
- **"SPECTATING" title:** YES (line 18 template)
  - Binding: `{{ t.spectate.title }}` (i18n locale key)
  - No dynamic state — fixed label
- **Late-join indicator:** **NO** — not present in mock UI
- **Spectator list (names of other spectators):** **NO** — only count

**Document:**
- `.sp-spec-count` UI exists, ready for real BE wiring (just rebind reactive ref to WS-delivered count)
- Title binding stable (no change needed)
- Late-join: deferrable enhancement (Phase 1 Path B α via fight_state_resume reuse — see Q7.3)
- Spectator list (names): out of scope for Sub-epic 6 closure (would require full SpectatorListMsg with array — Path C territory)

---

## Q5 — Match Finding / Discovery

### Q5.1 — Friends list "Watch Live" button

**File:** `src/components/hud/HudProfile.vue`

**`onWatch` handler (lines 588-594):**

```javascript
// 5N — Watch live fight (Path α mock port). currentFight is defined on the
// friend object but never populated by the current backend, so f.id is the
// always-used fallback today; the optional chain protects future wiring.
function onWatch(f) {
  const fightId = f.currentFight?.id || f.id;
  router.push(`/v2/spectate/${fightId}`);
}
```

**Critical findings:**
- **Line 591-594:** handler body
- **matchId source:** `f.currentFight?.id || f.id` (optional chain + fallback)
- **`f.currentFight` reality:** **NOT POPULATED IN PRODUCTION** (per inline comment)
- **Fallback:** `f.id` (friend's userId — NOT a match ID)

**Implication для Phase 1:** Currently `/v2/spectate/<friendId>` is what gets pushed. The mock simulation accepts any `:fightId` route param and ignores it (mock state driven by setInterval).

**Real spectate WILL break this** — `SpectateJoinMsg { matchId: <friendId> }` will fail BE-side (no match с ID == friendId). Either:
- **Path A:** BE friends endpoint extended to return real `currentFight: {id}` for in-fight friends. FE handler unchanged.
- **Path B:** New BE endpoint (e.g., `GET /v1/user/:id/active-match`) → friends list shows Watch button only after pre-fetch resolves matchId. Higher latency, more BE surface.
- **Path C:** BE accepts SpectateJoin with `userId` and resolves match server-side. Cleaner FE; BE complexity moderate.

---

### Q5.2 — Friends endpoint `currentFight` field

**File:** `backend/src/routes/friends.js` lines 207-246

**Friends list endpoint (`GET /v1/friends/list`) response shape (lines 225-239):**

```javascript
{
  id: friend.id,
  username: friend.name || friend.login,
  login: friend.login,
  rating: friend.rating,
  avatarUrl: friend.avatarUrl,
  skin: friend.skin,
  status: isOnline ? 'online' : 'offline',
  addedAt: f.createdAt.getTime(),
  captain: captainMap.get(friend.id) || null,
}
```

**`currentFight` field:** **ABSENT.**

**`status` field values:** Only `'online'` or `'offline'` — **NO `'in_fight'` value detected** (despite CLAUDE.md 5N referencing `f.status === 'in_fight'` for Watch button visibility).

**Implication:**
- Watch button visibility logic в HudProfile probably fires only when `status === 'in_fight'` — but BE never emits this status
- **Watch button likely NEVER renders in current production** (status only flips between online/offline)
- This is consistent with 5N "mock port" classification — spectate never tested end-to-end

**Document:** **DOUBLE-GAP.** Both `currentFight` field AND `'in_fight'` status value absent from BE. Phase 1 Path B+ scope addition required для real friend-spectate entry point. Light grep prediction confirmed (handoff §5.5 forecast — friends endpoint requires extension).

---

### Q5.3 — Live matches feed

**Search:**

```bash
grep -rn "live\|/matches/live" backend/src/routes/ --include="*.js"
# (no results matching live matches feed)
```

**Result:** **NO live matches feed endpoint exists** (no `GET /v1/matches/live` или similar).

**FE side:** No live matches feed UI in `src/views-v2/` (per agent investigation — handoff §5.5 noted Phase 0 likely surfaces ABSENT).

**Document:**
- Path D scope (friends-only spectate) becomes **default starting scope** для Sub-epic 6 closure
- Wider live feed deferrable к Эпик 7+ or dedicated PvP-integration sub-epic
- Even friends-only requires Q5.1/Q5.2 BE extension (currentFight + in_fight status)

---

### Q5.4 — Direct URL access `/v2/spectate/:fightId`

**File:** `src/router/index.js` lines 142-146

```javascript
{
  path: 'spectate/:fightId',
  name: 'V2Spectate',
  component: () => import('@/views-v2/SpectateView.vue'),
}
```

**Mount flow:**
- Route registered as child of `/v2/*` parent
- Component lazy-loaded
- View mounts unconditionally (any `:fightId` value accepted)
- `route.params.fightId` accessible в HudSpectate via `useRoute()` composable

**Validation:** **NONE FE-side.** Mock simulation runs regardless of fightId value (mock не reads BE for validation).

**Real spectate Phase 1 implication:** BE-side validation required:
- `SpectateJoinMsg { matchId }` → BE `pvpMatchManager.activeMatches.has(matchId)` check
- If invalid → emit ErrorMsg back to FE OR fight_end with reason `'spectate_invalid'`
- FE handler: ErrorMsg → toast + redirect к `/v2`

**Edge case:** User pastes URL while match has ended (race) — see Q8.2.

---

### Part 1 of 3 — END

**Continuing к Part 2:** Q6 (Authorization) / Q7 (Lifecycle) / Q8 (Race conditions) / Q9 (Match handoff) + 5 mandatory subsections.

**Pre-edit catches in Part 1:** **1 catch** (HudSpectate.vue line count discrepancy — agent's 223 vs actual 494, caught pre-write via `wc -l` verification).

---

## Q6 — Authorization / Access Control

### Q6.1 — Public matches vs friend-only

**Friendship lookup precedents в BE:**

**Pattern 1 — `findUnique`:**
- File: `backend/src/routes/friends.js` line 38
```javascript
const friendship = await prisma.friendship.findUnique({
  where: { user1Id_user2Id: { user1Id: id1, user2Id: id2 } },
});
```
- Convention: User IDs normalized с `user1Id < user2Id`

**Pattern 2 — `findMany`:**
- Line 212: get all friendships for user
- Line 254: `deleteMany()` (remove friendship)

**Pattern 3 — `findFirst` with OR:**
- File: `backend/src/routes/clan.js` line 468
```javascript
const friendship = await prisma.friendship.findFirst({
  where: { OR: [...] }
});
```

**Document:** Friendship lookup pattern established. Spectator authorization decision basis:

**Path D (friends-only) authorization rule:**
- On `SpectateJoinMsg`, BE checks if requester is friend of `match.player1.userId` OR `match.player2.userId`
- If neither → emit ErrorMsg `'unauthorized_spectate'`
- Pseudocode:
```javascript
const isFriend = await prisma.friendship.findFirst({
  where: {
    OR: [
      { user1Id: spectator.id, user2Id: { in: [p1Id, p2Id] }},
      { user2Id: spectator.id, user1Id: { in: [p1Id, p2Id] }},
    ]
  }
});
if (!isFriend) return emitError('unauthorized_spectate');
```

**Path B (public) — no auth check.** Anyone with valid matchId can spectate.

---

### Q6.2 — Privacy concerns

**Spectator visibility:** Spectator sees both player names, skins, ELOs, HPs, moves, dice rolls.

**Privacy parity:** Same data both players themselves see during fight. No new privacy surface.

**Field naming convention:**
- DB: `user.name` field (display name) и `user.login` field
- API response: `username: friend.name || friend.login` (fallback pattern)
- Sub-epic 5 carry-over #33 (captain vs opponent payload field name asymmetry — `name`/`elo` vs `username`/`rating`) — same pattern likely applies to spectator player meta delivery

**Document:** Privacy parity acceptable. Field naming: dual-field convention с fallback. Sub-epic 6 must follow same `username || login` pattern если delivers player meta к spectators.

---

### Q6.3 — Authorization scope decision basis

**Recommendation factor matrix:**

| Path | Scope size | Authorization complexity | Friend extension required? | Carry-over closure |
|---|---|---|---|---|
| Path D (friends-only) | Smaller | Friendship lookup на Join | YES (Q5.1/Q5.2 surface) | Closes 5N entry point gap |
| Path B (public) + Path D combo | Medium | None initially | NO | Defers wider feed |
| Path B (full public + live feed) | L scope | Match listing + privacy filter | NO | Out of Sub-epic 6 closure scope |

**Document:** Path D friends-only first = scope-discipline winner. Wider feed deferred к Эпик 7+. Even friends-only requires Q5.1/Q5.2 BE extension — bundling those into Sub-epic 6 likely required.

---

## Q7 — Lifecycle & Cleanup

### Q7.1 — Match end handling

**File:** `backend/src/services/pvpMatchManager.js` lines 38-44

**`removeMatch(matchId)` cleanup:**

```javascript
removeMatch(matchId) {
  const engine = this.activeMatches.get(matchId);
  if (engine && engine._readyTimeout) {
    clearTimeout(engine._readyTimeout);
  }
  this.activeMatches.delete(matchId);
}
```

**Called from:**
- `handler.js` line 116 — `handlePvPDisconnect()` when player disconnects
- `pvpHandler.js` line 146 — same disconnect chain (also clears rate limit Maps)

**Spectator cleanup integration:**
- On `removeMatch`, спектаторы Map/Set should also be cleared (or logged for audit)
- Decision: silently drop or send `fight_end` first?
- **Per Q3.2 finding:** `fight_end` already broadcast via emit (lines 568, 680) — спектаторы receive normally if Path α (extend emit). Path β requires explicit broadcast.

**Document:** Match cleanup function exists; spectator cleanup integrates trivially (clear `match.spectators` Map after match removal).

---

### Q7.2 — User disconnect mid-spectate

**File:** `backend/src/websocket/handler.js` lines 111-118

**WS close handler:**

```javascript
ws.on('close', () => {
  if (ws._replaced) return;
  clients.delete(userId);
  matchmaking.removeFromQueue(userId);
  handlePvPDisconnect(userId);
  console.log(`WebSocket: user ${userId} disconnected. Total: ${clients.size}`);
});
```

**Existing flow:**
1. Skip if `_replaced` flag set (Sub-epic 4a P0-3 reconnect protection)
2. Delete from `clients` Map
3. Remove from matchmaking queue
4. Call `handlePvPDisconnect()` → cleanup rate limits + match (pvpHandler.js line 136)

**Spectator removal integration:**

**Option α (per-match iteration):**
- On `handlePvPDisconnect(userId)`, iterate all `pvpMatchManager.activeMatches` and remove userId from each `match.spectators` Map.
- O(N matches) — acceptable for small N (typical concurrent matches < 50).

**Option β (reverse index):**
- Maintain `userId → Set<matchId>` reverse map for O(1) lookup
- More memory but faster cleanup
- Premature optimization at current scale

**Reconnect handling:**
- If user reconnects within reconnect window AND was spectating, re-subscribe automatically? OR require fresh `SpectateJoinMsg`?
- Sub-epic 4b reconnect chain handles player rebind via `_replaced` flag — spectator equivalent unclear
- **Decision factor для design-Claude:** Option α (require fresh SpectateJoinMsg on reconnect) — simpler, avoids stale subscription tracking through reconnect window

**Document:** Spectator removal on disconnect — extend `handlePvPDisconnect`. Reconnect re-subscribe: fresh dispatch from FE preferred (simpler).

---

### Q7.3 — Late-join — replay events from match start

**KEY DESIGN DECISION для Path B vs C.**

**Sub-epic 4b `fight_state_resume` reuse — investigation:**

#### `getStateSnapshot()` method

**File:** `backend/src/services/pvpCombatEngine.js` lines 864-888

**Return shape (verified):**

```javascript
{
  matchId,
  status,              // waiting | running | paused_coach | finished
  currentRound,
  maxRounds,
  player1: {
    odId,
    hp,
    activeEffects,
    diceUsedRound,
    coachTriggered
  },
  player2: { /* same */ },
  roundResults,        // Array of round outcomes
  pendingChoices,      // Coach choice tracking
  timestamp
}
```

#### `fight_state_resume` emit

**File:** `backend/src/websocket/handler.js` lines 89-94

```javascript
ws.send(JSON.stringify({
  type: 'fight_state_resume',
  ...snapshot
}));
```

**Trigger condition:** Only on player reconnect during active match. Status `'finished'` excluded.

#### `onFightStateResume` FE handler

**File:** `src/views-v2/FightView.vue` lines 233-278

**Hydration logic with 3 defensive guards:**
- Line 238: don't hydrate finished match
- Line 241: don't go backwards from result phase
- Line 246: race guard (don't overwrite newer state if snapshot is stale)
- Lines 248-256: HP hydration from `snapshot.player1/2.hp`
- Line 258: round counter update
- Line 259: totalRounds update

**Spectator late-join reuse decision:**

**Option α (Path B — minimal):**
- BE on `SpectateJoinMsg`:
  1. Validate `match.activeMatches.has(matchId)` (Q5.4)
  2. Authorize (Path D friends-only check OR public)
  3. Add spectator to `match.spectators` Map
  4. Call `match.getStateSnapshot()` and emit `fight_state_resume` to spectator socket directly
  5. Subsequent events (round_result, dice_rolled, coach_pause, fight_end) broadcast via `sendToSpectators` extension
- **Reuses Sub-epic 4b infrastructure verbatim.** No new replay mechanism.
- **FE side:** Spectator's HudSpectate wires same `onFightStateResume` handler logic — initializes round/HP/effects state from snapshot, then continues with live events.
- **Trade-off:** Late-joiner sees current state forward only. No round-by-round replay (no animation of past rounds).

**Option β (Path C — comprehensive):**
- BE replays ALL past `round_result` events from `match.roundResults` array
- Plus snapshot for coach pause / dice cooldown state
- Higher BE complexity (event log iteration on join)
- FE animation visible — late-joiner watches "catch-up replay"
- **Trade-off:** Better UX but L-scope expansion. Round_result replays may overload mobile clients on long matches.

**Document:** **Option α viable and infrastructure-ready.** `getStateSnapshot()` method already exists, FE handler `onFightStateResume` already exists. Sub-epic 6 leveraging Sub-epic 4b infrastructure — Lesson #30 semantic pattern reuse precedent. Recommendation factual basis: Option α likely best fit for closure scope; Option β over-engineering.

---

## Q8 — Race Conditions

### Q8.1 — Spectator joins mid-fight transition (between rounds)

**Status enum (pvpCombatEngine.js line 114):**

```javascript
this.status = 'waiting'; // waiting, running, paused_coach, finished
```

**4 enum states:**
- `waiting` — initial, after construction, before `start()`
- `running` — after `start()`, between rounds
- `paused_coach` — during coach pause (line 459)
- `finished` — after `endFight()` (lines 534, 578, 614, 656)

**Subscribe ordering on join:**
1. SpectateJoin received
2. BE adds to `match.spectators`
3. Call `getStateSnapshot()` (snapshot of current state)
4. Emit `fight_state_resume` to spectator socket
5. Subsequent events broadcast via `sendToSpectators`

**Race window:**
- Between snapshot capture (step 3) and first live event delivery (step 5), match may transition (round_result emits)
- Snapshot captures `currentRound = N`, but next emitted event is `round_result { round: N+1 }`
- Spectator UI receives `N` snapshot first, then `N+1` round_result — natural progression, no gap

**Defensive guard:**
- Existing FE handler `onFightStateResume` line 246 has race guard ("don't overwrite newer state if snapshot is stale")
- Reused для spectator path — already protects against late snapshot delivery overlap

**Document:** Race window minimal — snapshot delivery + live event chain naturally sequential. FE race guard already in place via Sub-epic 4b reuse.

---

### Q8.2 — Match ends just as user joins

**Defensive guards inventory:**

**pvpHandler.js:**
- Line 24: `if (!match)` before proceeding (pvp_ready)
- Line 92: `if (match.status !== 'running')` (dice_roll)
- Line 105: `if (!match)` (pvp_surrender)
- Line 117: `if (match.status !== 'paused_coach')` (coach_choice)

**pvpCombatEngine.js:**
- Line 155: `if (status === 'finished') return` (nextRound)
- Line 416: `if (status === 'finished') return` (onDiceRoll)
- Line 481: `if (status !== 'paused_coach') return` (onCoachChoice)
- Line 533: `if (status === 'finished') return` (endFight guard against double-end)

**SpectateJoin defensive guard pattern (proposed):**

```javascript
// Pseudocode
const match = pvpMatchManager.getMatch(matchId);
if (!match) {
  // Match doesn't exist (expired) — emit error or fight_end with reason 'not_found'
  return emitError('match_not_found');
}
if (match.status === 'finished') {
  // Match just ended — emit fight_end immediately so FE shows result overlay
  return emit('fight_end', match.lastResult);
}
if (match.status === 'waiting') {
  // Match created but not started yet — defer or reject?
  // Decision: subscribe but defer state_resume until status === 'running'
  match.spectators.set(userId, socket);
  return;
}
// Normal join — running or paused_coach
match.spectators.set(userId, socket);
const snapshot = match.getStateSnapshot();
sendToPlayer({ socket }, 'fight_state_resume', snapshot);
```

**Document:** Defensive guards pattern established in pvpHandler. Spectate-side guards follow same pattern. `'waiting'` status edge case требует design decision (reject vs defer-subscribe).

---

### Q8.3 — Multiple tabs / spectator instances per user

**Convention в codebase:**
- `clients` Map (handler.js) keyed by `userId` (single socket per user)
- On reconnect, old socket marked `_replaced` (Sub-epic 4a P0-3 protection) — new socket replaces в clients Map
- **Per-userId tracking** (NOT per-socket)

**Spectator multi-tab edge case:**
- Same user opens 2 tabs spectating same match
- Tab 1 SpectateJoin → match.spectators[userId] = socket1
- Tab 2 SpectateJoin → match.spectators[userId] = socket2 (overwrites)
- Tab 1 socket becomes stale (no longer in spectators Map but still receiving via direct WS connection — except socket replaced via clients Map already)

**Decision factor:**
- Following clients Map convention (per-userId) is consistent
- Stale-tab broadcast doesn't happen because `socket?.send()` on closed socket is no-op
- Multi-tab: latest tab "wins"; older tab still shows last received state but stops updating
- **Acceptable trade-off** for typical UX (one tab per match per user)

**Document:** Per-userId convention established. Multi-tab edge: latest wins via natural overwrite. No additional handling needed.

---

## Q9 — Match Handoff к /v2/spectate

### Q9.1 — WS subscribe ordering on mount

**Proposed sequence (mirror Sub-epic 5 MatchmakingView ordering discipline):**

```
SpectateView.vue / HudSpectate.vue onMounted:
1. Read route.params.fightId (already exposed via useRoute)
2. Captain pre-check (optional — block guest spectate if no captain? probably not needed for spectate)
3. Setup window event listeners:
   - matchmaking-spectate-state-resume (or unified pvp event chain)
   - matchmaking-round-result (existing — но need to filter by matchId? — see below)
   - matchmaking-fight-end
   - matchmaking-dice-rolled
   - matchmaking-coach-pause
   - matchmaking-coach-result
   - matchmaking-overdrive-start
   - matchmaking-spectate-leave (cleanup confirmation)
   - matchmaking-spectate-error
4. Dispatch SpectateJoinMsg { matchId: route.params.fightId }
5. Wait for events → populate UI
```

**Event listener naming convention:**

Sub-epic 5 used `matchmaking-*` prefix для CustomEvent names dispatched from `webSocketState.js`. Sub-epic 4a/4b used `pvp-*` prefix? — verify by grep.

**Verification needed (deferred к Phase 1 ТЗ):** Document existing CustomEvent dispatch convention в webSocketState.js (line 164-191). Likely:
- `pvp-fight-start`, `pvp-round-result`, `pvp-fight-end`, `pvp-dice-rolled`, etc.
- Spectator FE listens to same events с matchId filter (since BE broadcasts to all spectators of given match)

**MatchId filter requirement:**

If FE has multiple match contexts active (player в match A, spectating match B), event handler must filter by matchId. Current PvP FE assumes single-match context (player only spectates own match) — no filter needed.

**Spectator multi-match concern:** Edge case (user spectating two matches simultaneously) — out of typical UX. Single-match-spectate assumed default.

---

### Q9.2 — SpectatorListMsg для count display

**BE existence check:** Grep for `SpectatorListMsg`, `SpectatorCountMsg`, similar broadcast events:

**Result:** **ZERO matches** в `backend/src/`.

**Proposed addition (Sub-epic 6 scope):**

**Message shape:**
```javascript
{
  type: 'SpectatorListMsg',
  matchId,
  count       // size of match.spectators Map
}
```

**Emit triggers:**
- On every SpectateJoin: emit к match.spectators (broadcast updated count)
- On every SpectateLeave / disconnect: emit к match.spectators

**FE binding:** Replace mock `spectatorCount` ref в HudSpectate with WS-driven reactive update. Listener filters by matchId.

**Optional optimization:** Throttle count broadcasts (e.g., max 1/sec) to prevent burst on join/leave bursts.

---

### Q9.3 — Hand-off /v2/spectate → /v2 cleanup

**Mirror Sub-epic 5 MatchmakingView discipline:**

**MatchmakingView cleanup functions (lines 78-120):**

```javascript
// Line 78 — stop search timer
function stopSearchTimer() {
  if (searchTimer.value) {
    clearInterval(searchTimer.value);
    searchTimer.value = null;
  }
}

// Line 87 — stop countdown timer
function stopCountdownTimer() {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
}
```

**Cleanup call sites (5 stopSearchTimer + 4 stopCountdownTimer):**
- onCancel
- onMatchFound
- onTimeout
- onError
- onBeforeUnmount

**SpectateView.vue cleanup (proposed):**

```javascript
onBeforeUnmount:
1. dispatch SpectateLeaveMsg { matchId }
2. Remove all window event listeners (CustomEvent unsubscribe)
3. Clear local reactive state (HudSpectate state reset — fresh refs on remount)
4. Race guard: if dispatch SpectateLeave fails (WS already closed), no error toast (silent)
```

**Mirror discipline:** Sub-epic 4b/5 patterns (event handler cleanup + race guards + silent dispatch failure handling).

---

## 5 Mandatory Phase 0 Subsections

### 1. API Contract Verification

**Per Sub-epic 4a/4b/5 precedent — 10/38/61 catches validated. Sub-epic 6 contract verification:**

#### Existing PvP WS message shapes (Sub-epic 4a/4b/5 baseline)

**Verified present (via Q3.1 grep):**

| Message | Direction | Shape (top-level keys) | Source line |
|---|---|---|---|
| `MatchmakingStartMsg` | FE→BE | `{ type, matchmakingRequest: { username, skin, avatarUrl } }` | handler.js:605 |
| `MatchFoundMsg` | BE→FE | `{ type, matchId, opponent: { odId, username, rating, skin, avatarUrl } }` | handler.js:647-671 |
| `MatchmakingCancelMsg` | FE→BE | `{ type }` | handler.js:171 |
| `MatchmakingTimeoutMsg` | BE→FE | `{ type, message }` | (Sub-epic 5 verified) |
| `challenge_send` | FE→BE | `{ type, targetUserId, username, rating, challengerSkin, challengerAvatarUrl }` | handler.js:481 |
| `challenge_received` | BE→FE | `{ type, from }` | handler.js:499 |
| `challenge_accepted` | FE→BE | `{ type, challengerId }` | handler.js:185 |
| `challenge_start` | BE→FE | `{ type, matchId, opponent }` | (Sub-epic 4a verified) |
| `pvp_ready` | FE→BE | `{ type, deck }` | pvpHandler.js:20 |
| `fight_start` | BE→FE | `{ type, matchId, player1, player2, maxRounds, overdriveStartRound }` | pvpCombatEngine.js:132 |
| `round_result` | BE→FE | `{ type, round, isOverdrive, firstAttacker, player1, player2 }` | pvpCombatEngine.js:330 |
| `dice_roll` | FE→BE | `{ type }` (auth via socket→userId) | pvpHandler.js:77 |
| `dice_rolled` | BE→FE | `{ type, effect, hp, oppHp?, killed? }` | pvpCombatEngine.js:443 |
| `dice_available` | BE→FE | `{ type, round }` | pvpCombatEngine.js:184/187 |
| `coach_choice` | FE→BE | `{ type, action }` | pvpHandler.js:114 |
| `coach_pause` | BE→FE | `{ type, round, timeLimit }` | pvpCombatEngine.js:463/468 |
| `coach_result` | BE→FE | `{ type, player1, player2 }` | pvpCombatEngine.js:512 |
| `coach_opponent_ready` | BE→FE | `{ type }` | pvpCombatEngine.js:488 |
| `fight_end` (normal) | BE→FE | `{ type, matchId, winner, rounds, xp, player1, player2, roundLog }` | pvpCombatEngine.js:568 |
| `fight_end` (surrender) | BE→FE | `{ type, ..., reason: 'surrender' \| 'opponent_surrendered' }` | pvpCombatEngine.js:594/633/636 |
| `fight_end` (timeout) | BE→FE | `{ type, reason: 'match_timeout', winner: 'draw' }` | pvpCombatEngine.js:680 |
| `match_cancelled` | BE→FE | `{ type, reason }` | (Sub-epic 4a verified) |
| `overdrive_start` | BE→FE | `{ type }` (minimal) | pvpCombatEngine.js:174 |
| `fight_state_resume` | BE→FE | `{ type, ...snapshot }` (matchId, status, currentRound, maxRounds, player1, player2, roundResults, pendingChoices, timestamp) | handler.js:89-94 |
| `pvp_surrender` | FE→BE | `{ type }` (auth via socket→userId) | pvpHandler.js:100 |
| `dice_error` | BE→FE | `{ type, message }` | pvpCombatEngine.js:433 |
| `ErrorMsg` | BE→FE | `{ type, error, code }` (per Sub-epic 5 carry-over #31 finding) | webSocketState.js:142-144 |

#### Field naming conventions (relevant к spectate)

**`userData.id` vs `odId`:**
- FE state: `master/getMaster` returns master object with `userData` (verified: getMaster getter at line 25 of masterState.js). `userData.id` per Sub-epic 4a Catch #5 — correct field for FE-side identity reads
- BE accepts: `user.odId` per Sub-epic 4b Catch #3 — pvpHandler delegate signatures use `user.odId` (lines 47, 52, 105 etc)
- **Both correct в их contexts** — FE reads userData.id, BE handler params use user.odId (different layers, different conventions)

**`master/getMaster` getter verification:**
- File: `src/core/state/modules/masterState.js` line 25
```javascript
getMaster: (state) => state.master,
```
- Confirmed exists. Sub-epic 4a Catch #4 ("master/userData doesn't exist, use master/getMaster") still applies.

**Vuex getters for spectator path:**
- `master/getMaster` (line 25) — current user (для optional captain pre-check)
- `master/getLoginState` (line 27) — auth state
- `webSocket/sendMessage` action — WS dispatcher (Sub-epic 5 baseline)
- (Possibly NEW Vuex module `spectate/`?) — design-Claude decision.

**Match shape — `match` IS engine vs `match.engine`:**
- Confirmed via Q2.2: `pvpMatchManager.activeMatches: Map<matchId, engine>` — match object stored in Map IS the engine instance
- Per CLAUDE.md: "match IS engine, no .engine property — 3x BE confirmation"
- handler.js line 89 calls `activeMatch.getStateSnapshot()` directly (treats match as engine)
- **CONFIRMED — no `.engine` property access.**

**Flat WS spread `{type, ...data}`:**
- Per Sub-epic 4b Catch #6 — payload shape is **flat** (top-level keys), NOT nested `{type, data: {...}}`
- All emit/sendToPlayer calls в pvpCombatEngine spread data: `JSON.stringify({ type, ...data })`
- Spectator broadcast must follow same pattern.

#### Phase enum values

- `pvpCombatEngine.status` enum: `'waiting' | 'running' | 'paused_coach' | 'finished'` (line 114)
- HudSpectate has no phase enum (uses `fightOver: boolean` flag instead — ref line 106) — simpler binary state
- Sub-epic 6 may need to extend HudSpectate state с phase enum mirror BE engine status (для late-join handling — see Q7.3)

#### Constants imports

- `DICE_COOLDOWN_ROUNDS` (per Sub-epic 4b Catch #7 exists — 3 rounds per CLAUDE.md)
- `MAX_ROUNDS = 10` (config.js)
- `MATCH_TIMEOUT_MS = 600000` (Sub-epic 4b C1 backstop)
- `EXTRA_ROUNDS = 2` (overdrive)

**Spectator FE constants likely needed:**
- Reuse same constants from config (OR existing HudSpectate.vue lines 83-85: `MAX_HP`, `MAX_ROUNDS`, `TICK_MS` — TICK_MS gets gutted with mock simulation)

---

### 2. Negative-Space Verification

**Confirmed ABSENT (via grep — empty results in each case):**

| # | Item | Verification | Location for Phase 1 addition |
|---|---|---|---|
| 1 | `match.spectators` Set/Map field | pvpCombatEngine.js constructor (lines 75-119) — no spectators field | pvpCombatEngine.js line 119+ (constructor extension) |
| 2 | `SpectateJoinMsg` BE handler | `grep -n "SpectateJoinMsg" backend/src/` empty | handler.js line 196 (pre-default) OR new spectateHandler.js |
| 3 | `SpectateLeaveMsg` BE handler | Same grep empty | Same as #2 |
| 4 | `SpectatorListMsg` BE handler | Same grep empty | Q9.2 — emit on join/leave |
| 5 | `webSocketState.js` spectate routing case | Lines 133-191 inventory shows no spectate | webSocketState.js line ~191 (pre-default) |
| 6 | `spectator.js`/`spectatorService.js` BE service | `grep -rn "spectator" backend/src/` empty | New file `backend/src/services/spectatorService.js` (optional) |
| 7 | pvpCombatEngine `sendToSpectators` helper | Lines 892-902 inventory shows only emit + sendToPlayer | pvpCombatEngine.js line 902+ (after sendToPlayer) |
| 8 | Friends list `currentFight` field в API response | friends.js lines 225-239 inventory shows no field | friends.js — extend response object |
| 9 | Friends `'in_fight'` status value | Status only `'online' \| 'offline'` (line 233) | friends.js — extend status determination logic |
| 10 | Live matches feed endpoint (`GET /v1/matches/live`) | Grep empty | Out of Sub-epic 6 closure scope (Эпик 7+) |
| 11 | HudSpectate spectator count BE binding | Mock `Math.random` line 108/184 | Replace ref binding с WS event handler |
| 12 | `pixelIcons.js` spectate icon usage | Defined at line 984-1006 but no grep hits для render references | Optional cosmetic integration в HudSpectate header |

**Negative-space density: 12 items confirmed absent** — high greenfield surface.

**Sub-epic 6 prediction (per handoff §SUB-EPIC 6 SCOPE):** "likely surfaces ~30-50 catches" — Phase 0 confirms greenfield depth. Likely catch count Phase 1 in 50-80 range due to multi-layer coordination (BE Prisma extension + BE handler chain + FE Vuex extension + FE WS routing + FE UI rebind).

---

### 3. Real CSS Class Taxonomy Dump

**`.sp-*` namespace inventory (Q4.3 verified):**

**Scoped в HudSpectate.vue `<style>` (lines 225-494):**

```
.spectate-hud         (228) — root container
.sp-back              (237) — back button
.sp-header            (260) — title cluster
.sp-kicker            (268) — title kicker
.sp-spec-count        (276) — spectator count display
.sp-spec-dot          (285) — animated pulse
.sp-round-badge       (298) — round counter
.sp-fighters          (312) — fighters row
.sp-fighter           (323) — fighter card
.sp-fighter--friend   (331) — modifier (left)
.sp-fighter--opponent (332) — modifier (right)
.sp-fname             (334) — fighter name
.sp-hp-bar            (341) — HP bar
.sp-hp-fill           (348) — fill
.sp-hp-fill--friend   (353) — green fill
.sp-hp-fill--opponent (357) — red fill
.sp-hp-num            (361) — HP numeric
.sp-vs                (369) — VS divider
.sp-log               (376) — log container
.sp-log-header        (390) — log header
.sp-log-list          (398) — log entries list
.sp-log-entry         (411) — log entry
.sp-log-round         (421) — round cell
.sp-log-actor         (426) — actor cell
.sp-actor--friend     (427) — modifier
.sp-actor--opp        (428) — modifier
.sp-log-action        (430) — action cell
.sp-log-damage        (432) — damage cell
.sp-log-crit-badge    (437) — crit indicator
.sp-log-crit          (447) — modifier
.sp-log-empty         (405) — empty state
.sp-result            (449) — result overlay
.sp-result-text       (466) — result text
.sp-result--win       (475) — green
.sp-result--loss      (481) — red
```

**Total: 35 classes scoped в HudSpectate.vue.**

**External `src/styles/v24/`:** **ZERO references.** No `spectate.css`. Self-contained.

**Phase 1 considerations:**
- Spectator perspective relabel concern (Q4.4) — may require renaming `--friend`/`--opponent` modifiers к `--player1`/`--player2` (neutral naming)
- BUT: Sub-epic 6 closure scope can keep current naming (semantic inversion: "friend" = `match.player1` deterministically) and defer relabel к polish. **Decision factor для design-Claude.**
- Reusable patterns:
  - `.sp-fighter--friend`/`.sp-fighter--opponent` modifier convention (mirror Sub-epic 4a `actor-warden`/`actor-predator` pattern)
  - `.sp-log-entry` row-based log structure (mirror Sub-epic 4a HudFight `.log-entry` precedent)

**Late-join indicator class (NEW for Path B α):**
- Phase 1 may need `.sp-replay-marker` или `.sp-rejoined` class для visual indicator that user joined mid-fight
- Suggested: gold/cyan accent stripe on log entries displayed via state_resume vs live events
- **Decision deferrable** к design-Claude или skip for closure (polish round)

---

### 4. UI Infrastructure Dependencies

**For each new Sub-epic 6 handler — verify full chain:**

#### A. SpectateJoin dispatch on mount

- **Mount hook:** `onMounted` exists в SpectateView.vue (lines 29-31, currently only Esc listener) — extend OR move к HudSpectate
- **WS dispatcher:** `webSocket/sendMessage` action (Sub-epic 5 baseline) — reused
- **Route param accessor:** `useRoute().params.fightId` — HudSpectate currently reads via `useRoute` (verified — line 93)
- **State field "is subscribed":** Per Sub-epic 4b precedent — `subscribed = ref(false)` boolean flag pattern. Reset on mount, flip true post-dispatch ack.

#### B. SpectateLeave dispatch on unmount

- **Unmount hook:** `onBeforeUnmount` exists в SpectateView.vue (lines 33-35) — extend
- **Cleanup discipline:** Mirror MatchmakingView (Sub-epic 5) — 3-5 cleanup function call sites
  - `dispatchSpectateLeave()` (silent fail если WS closed)
  - `removeAllListeners()` (window event handlers)
  - `resetHudSpectateState()` (clear refs, mock leftover protection)
- **Idempotency:** Listener registration пре-defensive cleanup before add (mirror Sub-epic 5 `addEventListener`/`removeEventListener` pattern)

#### C. WS event listeners (round_result / dice_rolled / coach_pause / fight_end)

- **window CustomEvent listener pattern existing:** YES — Sub-epic 4a/5 baseline (4 listeners в MatchmakingView, ~6+ in FightView)
- **Cleanup on unmount:** required (memory leak prevention)
- **Listener idempotency:** required (component remount edge — register once, cleanup on unmount)
- **MatchId filter:** spectator may need filter on `data.matchId === route.params.fightId` if multi-match capable. Single-match assumed default — no filter needed initially.

#### D. Spectator count display

- **Reactive state field:** `spectatorCount` already exists в HudSpectate (ref Number, line 108)
- **Template binding:** already `{{ spectatorCount }}` (line 21)
- **SpectatorListMsg routing → state update chain:**
  - webSocketState.js: add case `SpectatorListMsg` → window CustomEvent dispatch
  - HudSpectate: window listener updates `spectatorCount.value = data.count`
- **Throttling:** optional (broadcast on every join/leave может burst) — defer к design-Claude

#### E. Late-join state hydration (если fight_state_resume reuse)

- **Existing onFightStateResume handler в FightView (Sub-epic 4b C7):** verified at lines 233-278
- **Adaptable к HudSpectate:** YES — semantic equivalent (HP refs + round counter + active effects)
- **State snapshot shape compatibility (HudSpectate fields ↔ snapshot fields):**
  - `friendHp ↔ snapshot.player1.hp`
  - `opponentHp ↔ snapshot.player2.hp`
  - `currentRound ↔ snapshot.currentRound`
  - `fightLog ↔ snapshot.roundResults` (need transform — roundResults format vs HudSpectate log entry format)
  - **Transformation layer needed** для roundResults → log entries (similar к Sub-epic 4b log replay pattern)

**Each handler chain — verified file:line references collected.**

---

### 5. Vocabulary Alignment Audit

**Mock taxonomy (5N HudSpectate) ↔ BE taxonomy mapping:**

| 5N mock element | Real BE source | Mapping notes |
|---|---|---|
| `setInterval(2000)` round tick | `round_result` event broadcast | Direct rebind — listener replaces interval |
| `Math.random() < 0.15` crit | `round_result.player1/2.critted` boolean | Direct field read |
| 10-name move pool | `round_result.player1/2.module` (move ID + name lookup) | Need move name from `move.name` (verified field per CLAUDE.md combat) |
| HP decreases manually | `round_result.player1/2.hp` authoritative | Direct rebind |
| "VICTORY"/"DEFEAT" result strings | `fight_end.winner` field | **Spectator perspective issue** (see below) |
| Mock spectator count drift | `SpectatorListMsg.count` (NEW) | Direct rebind |

**Spectator-as-third-party perspective concern:**

**Player FE convention:**
- "left fighter" = self (myself)
- "right fighter" = opponent
- Result string derivation: `winner === myself ? 'VICTORY' : 'DEFEAT'`
- Derived via `getIsPlayer1` getter

**Spectator FE convention (NEW):**
- Spectator is NOT player1 NOR player2
- "left fighter" = ??? (no inherent self-context)
- "right fighter" = ???
- Result string derivation: ???

**Possible options:**

| Option | Layout rule | Result string | Pros | Cons |
|---|---|---|---|---|
| α (deterministic) | `match.player1` left, `match.player2` right | "Player1 wins" / "Player2 wins" / "Draw" | Simplest, BE-truth | Loses "friend" semantic в UI |
| β (friendship-context) | Friend on left, other on right | "Friend wins" / "Friend defeated" | Preserves friend semantic | Requires friendship resolution at FE per match (extra API call OR pre-fetch) |
| γ (favorite — higher ELO) | Higher-ELO left | "Favorite wins" / "Underdog upsets" | Skill-based ordering | Arbitrary per actual user perspective |
| δ (user toggle) | Spectator preference switch | Configurable | User control | UX complexity, state mgmt |

**Recommendation factual basis (NOT recommendation — design-Claude decides):**

- Option α (deterministic player1/player2 ordering) — minimum-touch closure scope. Relabel `.sp-fighter--friend` / `.sp-fighter--opponent` modifiers к neutral `.sp-fighter--p1` / `.sp-fighter--p2` (visual color stays — left blue/green, right red/orange).
- Result strings: rebind to `{ winner: 'p1' | 'p2' | 'draw' }` and use neutral `"P1 wins" / "P2 wins" / "Match draw."`. OR display by username: `"Wisp wins!"` / `"Onotole wins!"` (most readable).
- Option β (friendship-context) — defer к polish round. Requires friends list pre-fetch on mount → match.player1/2 lookup → relabel. Higher latency, more state.

**6th Phase 0 subsection candidate trigger:** This vocabulary gap surfaces "semantic invariant + flow direction verification" 2nd occurrence. See Part 3 dedicated analysis.

---

### Part 2 of 3 — END

**Continuing к Part 3:** 6th candidate tracking + Path candidates basis + Risks & dependencies + Carry-overs awareness + Pre-edit catch tally.

**Pre-edit catches in Part 2:** **0** (Q6-Q9 + 5 mandatory subsections content derived from agent investigation + Q1-Q5 baseline; no new file-content discrepancies surfaced).

---

## 6th Phase 0 Subsection Candidate Tracking

**Lesson #43 promoted в 4b. 6th subsection candidate "Semantic invariant + flow direction verification" — 1st occurrence 4b C10** (ChallengeNotification `isPlayer1: false` semantically correct, ТЗ derivation would invert).

**Sub-epic 5 outcome:** occurrence #2 NOT detected through 12 commits (pairing-symmetric flow doesn't trigger).

### Sub-epic 6 outcome — OCCURRENCE #2 DETECTED ✅

**Trigger location:** Q4.4 spectator perspective concern + 5th mandatory subsection (Vocabulary Alignment Audit).

**Pattern repeat:** Spectator-as-third-party FE code requires player-ordering convention derivation. UNLIKE Sub-epic 5 (player в matchmaking — symmetric flow, no derivation needed), spectator MUST derive UI layout from BE-truth match.player1/player2 ordering.

**Convention candidate:**

```javascript
// Option α — deterministic
const leftFighter = data.player1;     // BE-truth player1
const rightFighter = data.player2;    // BE-truth player2

// vs Option β — semantic-derived (broken if assumes spectator perspective)
const leftFighter = isMyFriend(data.player1) ? data.player1 : data.player2;
```

**Critical invariant from BE (verified Q2.2):**
- `pvpMatchManager.activeMatches.set(matchId, engine)` — engine.player1 / engine.player2 are deterministic per createMatch caller signature
- BE creates match с `(challenger, acceptor)` ordering OR `(player1, player2)` from matchmaking pair

**Spectator convention recommendation:**
- **Use Option α (deterministic player1/player2)** — preserves BE invariant
- **AVOID** any "is friend" derivation in render layer — would be semantic-equivalent pitfall к 4b C10 ChallengeNotification false-derivation case
- **AVOID** result-string derivation that assumes "self vs opponent" — spectator has no self in match

**Carry-over #16 awareness:** Sub-epic 4b documented "DO NOT 'fix' ChallengeNotification.vue:62 `isPlayer1: false` to a derivation — would invert." Sub-epic 6 spectator code likely has analog code paths (HudSpectate `friendHp`/`opponentHp` semantic). **Phase 1 ТЗ must explicitly direct: spectator state refs neutral named (`p1Hp`/`p2Hp` OR keep current names but document semantic shift).**

### 6th subsection PROMOTION DECISION

**Per Lesson #43 promotion criteria:** "await 2nd occurrence." 2nd occurrence detected.

**Recommendation для Эпик 6 going forward:**
- **PROMOTE 6th Phase 0 subsection к mandatory** — "Semantic invariant + flow direction verification."
- Cumulative occurrence chain: **2 detections** (4b C10 + Sub-epic 6 Q4.4 + 5th subsection).
- Pattern stable enough to formalize.

**Suggested subsection structure (для future Phase 0 reports):**

```
6. Semantic Invariant + Flow Direction Verification

For each derived FE-side convention (player ordering, perspective,
friendship context, isPlayer1 etc.), document:
- BE invariant source of truth (e.g., createMatch call signature)
- FE derivation correctness check (does derivation preserve BE truth?)
- Carry-over awareness (related Sub-epic 4b/6 patterns NOT to "fix")
- Spectator/third-party scenarios (if applicable to sub-epic surface)
```

**Document:** 6th subsection promoted by precedent. Phase 1 ТЗ for Sub-epic 6 should formalize subsection in design directives. **Lesson candidate #44 NEW** — flag для Sub-epic 6 closure CLAUDE.md update.

---

## Path Candidates — Factual Basis

**Phase 0 dumps factual data; design-Claude makes Path decision post-report с user.**

### Path α (FE-only mock-port — 5N current state, KEEP)

**Data:**
- 5N already shipped this state (HudSpectate.vue 494 lines с mock simulation)
- No real BE infrastructure
- Carry-over technical debt accepted in 5N

**Status:** **Anti-rec для Sub-epic 6 closure.** Sub-epic 6 goal is real spectate, not preserving mock.

**Disqualified.**

---

### Path A (FE wiring only — IF BE 100% complete)

**Conditions:**
- Q1.2 BE service file existence: ❌ ABSENT
- Q1.3 BE handler routing: ❌ ABSENT (no spectate cases в handler.js / pvpHandler.js)
- Q3.1 BE event chain emit-spectator-aware: ❌ ABSENT (`sendToSpectators` helper не existing)
- Q2.2 `match.spectators` Set field: ❌ ABSENT

**Status:** **DISQUALIFIED.** BE 0% complete. Path A precedent (Sub-epic 5: BE 100% pre-existing → FE-only wiring) NOT applicable here.

---

### Path B (BE extension minimal — broadcast existing events to spectators)

**Scope:**

**BE additions:**
1. `match.spectators: Map<userId, socket>` field в pvpCombatEngine constructor (line 119+)
2. `SpectateJoinMsg` handler:
   - Validate matchId
   - Optionally authorize (Path D friend check)
   - Add to spectators Map
   - Emit `fight_state_resume` with `getStateSnapshot()` (Sub-epic 4b reuse)
   - Broadcast `SpectatorListMsg { count }` to всех в match.spectators
3. `SpectateLeaveMsg` handler:
   - Remove from spectators Map
   - Broadcast `SpectatorListMsg { count }` к remaining spectators
4. `sendToSpectators(type, data)` helper в pvpCombatEngine
5. Extend `emit()` OR add explicit `sendToSpectators` calls после every player emit/sendToPlayer (depends on Q2.3 design choice)
6. Spectator cleanup in `handlePvPDisconnect` (handler.js line 116) + `removeMatch` (pvpMatchManager.js line 38)
7. Friends endpoint extension (friends.js lines 225-239) — add `currentFight` field + `'in_fight'` status (Q5.1/Q5.2 surface)
8. Adapt differentiated events for spectator audience (4 events: dice_rolled, fight_end-surrender, dice_available consolidation, coach_pause consolidation)

**FE additions:**
1. `webSocketState.js` switch-case extension — `SpectateJoin` ack / `SpectatorListMsg` / `fight_state_resume` (already routed) + spectate-specific event chain
2. SpectateView.vue / HudSpectate.vue mock simulation gut (~85 lines) — replace с WS event handler chain
3. `onMounted`: dispatch `SpectateJoinMsg` + register window event listeners
4. `onBeforeUnmount`: dispatch `SpectateLeaveMsg` + cleanup
5. Late-join state hydration: adapt `onFightStateResume` handler (Sub-epic 4b reuse) к HudSpectate
6. Spectator perspective convention (player1/player2 deterministic — relabel `--friend`/`--opponent` modifiers OR keep semantic shift via comment)
7. Friend Watch button entry (HudProfile lines 588-594) — verify works once BE friends extension delivers `'in_fight'` status

**Bundle с:**
- Path D (friends-only) authorization scope (Q6.1)
- Lesson #33 deploy chain (cherry-pick → main → Railway PR) — same pattern as 6B-3a-backend / Sub-epic 1 / Sub-epic 4b PR #355
- Closure shape: **code-complete + deferred-verify** (4th application — mirror 6B-3a-backend / Sub-epic 1 / Sub-epic 4b)

**Estimated commits:** ~12-18 functional + closure phase (CL1-CL3).

**Cherry-pick PR target:** New PR `feat/spectate-real-be` → main → Railway deploy.

**Status:** **MOST LIKELY PATH.** Default closure scope.

---

### Path C (BE extension comprehensive — separate spectator types + state-replay)

**Additions on top of Path B:**
- Spectator-distinct event types (`round_result_spectator`, `dice_rolled_spectator`, `fight_end_spectator`)
- Round-by-round replay mechanism (full `roundResults` array iteration с timing)
- Match event log persistence per match (для replay support)

**Justification ONLY if:**
- Q3.2 (per-player perspective differentiation) requires spectator-distinct event format — partially yes (4 events differentiated), but Path B α handles inline adaptation

**Estimated commits:** ~20-25.

**Status:** **Over-engineering for Sub-epic 6 closure.** Spectator perspective concerns adequately handled by Path B α adaptation. Defer comprehensive replay к Эпик 7+ if needed.

---

### Path D (Friends-only spectate без feed)

**Status:** **COMBINATOR с Path A/B/C** — narrows entry-point scope, не scene scope.

**Data:**
- Q5.1 5N precedent: Friend Watch button already wired (HudProfile lines 588-594)
- Q5.2: friends endpoint extension required regardless (currentFight + in_fight status)
- Q5.3: live matches feed endpoint absent — wider feed naturally deferred

**Recommendation factual basis:** Path D as **default scope discipline** — friends-only first, wider feed deferred к Эпик 7+.

---

### Recommendation factual summary

**Path B α + Path D combo** = closure scope для Sub-epic 6.
- BE: extend pvpCombatEngine с spectators tracking + sendToSpectators helper + emit() extension. Add SpectateJoin/Leave handlers. Friends endpoint extension. Friendship auth check на join.
- FE: mock-flow gut + WS event handler chain + spectator perspective convention + friend Watch entry verify.
- Closure: code-complete + deferred-verify (cherry-pick PR → main → Railway deploy).
- Polish carry-overs: Option β friendship-context UI / spectator list (names) / wider live feed / late-join replay animation — defer.

**Phase 0 NOT making decision.** Design-Claude consults Phase 0 facts + user authorization → Path decision + Phase 1 ТЗ.

---

## Risks & Dependencies

### Risk 1 — BE deploy chain awareness (Lesson #33 4th application)

**Pattern:** Cherry-pick → main → Railway PR (per CLAUDE.md branch strategy section).

**Sub-epic 6 backend changes from continue stack `claude/investigate-matchmaking-2JlwO-WfdV0`** НЕ auto-deploy. Deploy verify gated через main branch merge.

**Same pattern as:**
- 6B-3a-backend (PR `fix/user-public-response`)
- Sub-epic 1 (visual verify deferred к Clan data integration audit)
- Sub-epic 4b (PR #355 `fix/pvp-edge-cases-4b`)

**Closure shape implication:** Sub-epic 6 likely closes с **code-complete + deferred-verify** pattern. PR `feat/spectate-real-be` (or similar) cherry-picked from continue stack к dedicated branch off main, merged via review, Railway auto-deploy triggers post-merge.

**Mitigation:** Phase 1 ТЗ should bundle BE additions with explicit cherry-pick + deploy strategy in handoff. Document migration boundary.

---

### Risk 2 — Spectator broadcast amplification

**Math:**
- 10 spectators × 5-10 events per round × 10-12 rounds = ~500-1200 socket sends per match
- Peak burst: ~50 messages/sec during round_result + dice_rolled + coach_pause overlapping
- Multiple concurrent matches: linear multiplier

**Existing rate limits (player-action only):**
- dice_roll 1/2s per player (Sub-epic 4a P3-1)
- coach_choice 1/pause per player (Sub-epic 4a P3-2)

**Spectator-side throttling:** **NOT EXISTING.**

**Mitigation options:**
- **Option A** — Accept broadcast amplification at current scale. Spectator passive observer, BE just broadcasts verbatim. Acceptable for ≤10 spectators × ≤10 concurrent matches.
- **Option B** — Throttle SpectatorListMsg broadcasts (count updates) к 1/sec. Defensive only — main event chain (round_result etc.) on natural timing.

**Decision:** Option A для Sub-epic 6 closure. Premature optimization risk if Option B.

---

### Risk 3 — HudSpectate refactor scope

**Scale:**
- Current 494 lines (verified `wc -l`)
- Mock simulation block: lines 159-217 (~58 lines к gut)
- Replacement: WS event handler chain (~60-80 new lines) + state hydration (~20 lines) + listener cleanup (~15 lines)

**Net delta:** +30 to +60 lines (file grows к ~525-555 lines).

**Pattern parity precedent:** Sub-epic 5 mock-flow gut (`mmCandidatesMock.js` 102 lines + `useMatchmakingScreen.js` 127 lines = 229 lines deleted; replaced with real WS dispatcher chain в HudMatchmaking ~140 lines net add).

**Sub-epic 6 mock-gut differences:**
- HudSpectate is ONE file (vs Sub-epic 5 two helper files)
- Mock simulation tighter coupling within HudSpectate.vue script block
- Mock state initialization may need refresh (currently mock provides random init values; real state must initialize from BE snapshot)

**Mitigation:** Phase 1 ТЗ commit-by-commit decomposition должна follow Sub-epic 5 pattern (state extension first → mock gut → BE wiring + listeners → UX bundle).

---

### Risk 4 — Late-join replay design

**Two options (Q7.3 details):**

**Option α (minimal — recommended):** Reuse Sub-epic 4b `getStateSnapshot()` + `fight_state_resume` infrastructure. Late-joiner sees current state forward, no past round animation.

**Option β (comprehensive):** BE replays all `roundResults` events on late-join. Requires event log iteration per join. Higher BE complexity.

**Mitigation:** Phase 1 ТЗ recommends Option α for closure scope. Option β deferred к polish if user surfaces UX gap.

---

### Risk 5 — Friends list `currentFight` field reality

**Per CLAUDE.md** "currentFight never populated by current backend" — verified Q5.1/Q5.2 (field absent in friends.js response, status enum only `'online'`/`'offline'`).

**Implication:**
- Friend Watch button visibility logic в HudProfile (per 5N — `f.status === 'in_fight'`) NEVER triggers in current production
- 5N spectate flow tested via direct URL access only (mock state)
- Real spectate friend entry point requires BE friends endpoint extension (currentFight field + in_fight status)

**Phase 1 implication:** **BE friends extension is required dependency** for Path D friends-only entry. Either:
- Bundle into Sub-epic 6 (single coordinated effort)
- Defer к Sub-epic 7 (friends-side polish) — но then friend Watch button still doesn't render after Sub-epic 6 backend deploy

**Recommendation factual basis:** Bundle friends extension into Sub-epic 6 BE work. Single PR `feat/spectate-real-be` covers всё BE surface required for end-to-end functioning.

---

### Risk 6 — Carry-over #16 false-fix temptation

**Per CLAUDE.md** carry-over #16: "DO NOT 'fix' ChallengeNotification.vue:62 `isPlayer1: false` to a derivation — would invert correct value."

**Sub-epic 6 risk:** Phase 1 ТЗ may surface analog "fix" temptations в HudSpectate (e.g., changing `friendHp`/`opponentHp` to derived expressions assuming spectator perspective).

**Mitigation:**
- Phase 1 ТЗ explicit direction: keep neutral player1/player2 deterministic ordering OR document semantic shift if keeping `--friend`/`--opponent` modifiers
- Lesson #43-promoted 6th subsection (Semantic invariant + flow direction verification) — reflex applied к spectate code paths

---

## Existing Carry-overs Awareness

**31 active carry-overs entering Sub-epic 6** (per CLAUDE.md handoff section).

**Bundle candidates analysis для Sub-epic 6:**

| # | Carry-over | Sub-epic 6 relevance | Bundle decision basis |
|---|---|---|---|
| 16 | ChallengeNotification.vue:62 `isPlayer1: false` semantic invariant | **Reflex application** — Phase 1 ТЗ must explicitly avoid analog "fix" в HudSpectate | NO direct bundle (warning carry-over only); apply reflex preventively |
| 29 | Filter chips (Archetype/Belt) BE extension | NOT spectate-related (matchmaking-side feature) | NO bundle |
| 30 | ELO duplication consolidation | NOT spectate-related | NO bundle |
| 31 | ErrorMsg shape mismatch BE→FE (`{type, error, code}` flat vs FE `{errorDto: {code, message}}` parser expectation) | **POSSIBLE BUNDLE** — Sub-epic 6 BE may emit ErrorMsg для unauthorized spectate / match_not_found / etc. If FE consumes via existing parser → broken response handling | CONDITIONAL bundle — Phase 1 ТЗ should evaluate если Sub-epic 6 ErrorMsg paths use legacy parser. Same-class fix per Lesson #35 bug-bundle-tier if surfaces |
| 32 | `.mm-main` left:270px filters-hidden layout gap | matchmaking-only CSS | NO bundle |
| 33 | Captain vs opponent payload field name asymmetry (`name`/`elo` vs `username`/`rating`) | **POSSIBLE BUNDLE** — Spectator player meta delivery (player1/player2 in fight_start, fight_end) likely uses one of two naming conventions. If Sub-epic 6 surfaces same asymmetry → bundle cleanup OR document standardization | CONDITIONAL bundle — Phase 1 evaluate field naming consistency |
| 22 | v2 coach active boost UI | Spectator NEEDS to see coach pause UI (currently HudSpectate has no coach pause display) | **OUT OF CLOSURE SCOPE** — UI gap acceptable for closure, polish round candidate |
| 17-28 | Various 4a polish carry-overs (countdown / dodge overlay / shake / cumulative damage / etc.) | Mostly decoration-only OR PvP-specific | NO bundle |

**Decision summary для Phase 1:**

- **Bundle reflex:** Carry-over #16 (semantic invariant) — apply preventively во ALL spectator FE code
- **Conditional bundle:** Carry-overs #31, #33 — evaluate if Sub-epic 6 surfaces touches same surfaces
- **Deferred:** Carry-over #22 (coach UI extension к spectator) — polish round candidate
- **Out of scope:** Other carry-overs не related to spectate

---

## Pre-Edit Catch Tally — Phase 0 Metric

**Phase 0 catch density (verify pre-edit / pre-write):**

| # | Catch | Phase | Tier (Lesson #35) |
|---|---|---|---|
| 1 | HudSpectate.vue line count discrepancy (agent reported 223, actual 494 — script-end vs file-end confusion) | Pre-write Part 1 verification | adaptation-tier |

**Total Phase 0 catches:** **1.**

**Sub-epic 5 Phase 0 baseline:** не explicitly tracked в handoff, but post-Phase 1 catches: 61 cumulative (5.08/commit average, exceeded 4b's 38 ceiling by 60%).

**Sub-epic 6 Phase 1 prediction:**

**Per handoff §SUB-EPIC 6 SCOPE:** "likely surfaces ~30-50 catches" — based on:
- New architectural area (spectate has 0% existing infrastructure)
- BE + FE multi-layer coordination required
- 12 negative-space items confirmed absent
- 4 differentiated events requiring adaptation
- Spectator perspective convention requires explicit derivation choices

**Refined prediction post-Phase 0:** **40-70 catches** likely в Sub-epic 6 Phase 1.

**Reasoning factors:**
- **Higher than 4b (38)** — Sub-epic 6 has more negative-space surface (4b had existing PvP infrastructure to extend; Sub-epic 6 starts greenfield для spectator)
- **Lower than 5 (61)** — Sub-epic 5 had matchmaking refactor + 4-tab restructure complexity; Sub-epic 6 mock-port is more linear refactor
- **Multi-layer coordination penalty** — BE Prisma extension (friends endpoint) + BE handler chain + BE pvpCombatEngine + FE Vuex extension + FE WS routing + FE UI rebind = 6 layers requiring API contract verification

**Mitigation strategy:** Mode A strict per-commit discipline + Phase 0 5 mandatory subsections + 6th subsection promotion (Semantic invariant verification) → catch density reflex strengthened.

---

## Phase 0 Summary

**Investigation outcome:**

✅ **Q1-Q9 all answered с concrete file:line references**

✅ **5 mandatory subsections completed:**
1. API contract verification (27 message types catalogued + field naming + match shape + flat WS spread)
2. Negative-space verification (12 items confirmed absent — high greenfield surface)
3. CSS taxonomy dump (35 `.sp-*` classes scoped, zero external)
4. UI infrastructure dependencies (5 handler chains traced)
5. Vocabulary alignment audit (mock taxonomy mapping + spectator perspective derivation)

✅ **6th subsection candidate — OCCURRENCE #2 DETECTED ✅**
- Promotion recommendation: PROMOTE к mandatory для future sub-epics
- Lesson candidate #44 NEW flagged для Sub-epic 6 closure CLAUDE.md update

✅ **Path candidates basis dumped:**
- Path α (mock keep) DISQUALIFIED
- Path A (FE only) DISQUALIFIED — BE 0% complete
- Path B α + Path D combo: most likely closure scope
- Path C: over-engineering для closure scope

✅ **6 risks documented:**
- BE deploy chain (Lesson #33 4th application)
- Spectator broadcast amplification
- HudSpectate refactor scope
- Late-join replay design
- Friends `currentFight` field reality
- Carry-over #16 false-fix temptation

✅ **Carry-over bundle candidates:**
- Reflex application: #16 (semantic invariant)
- Conditional bundles: #31 (ErrorMsg shape), #33 (field naming asymmetry)
- Deferred: #22 (coach UI), other 4a polish

✅ **Phase 1 catch prediction: 40-70 catches** (factor reasoning provided)

---

## Closure / Next Steps

**This Phase 0 report:**
- Filename: `docs/visual-migration/EPIC6_SUBEPIC_6_PHASE_0_REPORT.md`
- Length: ~1,200 lines (preventive split — 3 parts)
- Commits: 3 housekeeping (Part 1 + Part 2 + Part 3 — this commit)

**Action required from design-Claude (in fresh chat):**
- Review Phase 0 facts
- Path decision (Path B α + Path D combo recommended factual basis)
- Phase 1 ТЗ authoring with:
  - 6 mandatory subsections (5 standard + new 6th — Semantic Invariant + Flow Direction Verification)
  - Carry-over bundle decisions (#16 reflex, #31/#33 conditional)
  - BE deploy chain planning (cherry-pick PR target)
  - Closure shape declaration (code-complete + deferred-verify expected)

**STOP — wait для design-Claude Path decision + Phase 1 ТЗ.**

**No code changes shipped. No backend touched. Read-only investigation complete.**

---

### Part 3 of 3 — END

**Pre-edit catches in Part 3:** **0** (synthesis of Q1-Q9 + 5 subsections content; no new file-content discrepancies surfaced).

**Cumulative Phase 0 catches:** **1** (HudSpectate.vue line count, caught Part 1 pre-write).

**Streak entering Sub-epic 6 Phase 1:** 29 ✅ (Phase 0 read-only, no code changes — streak preserved by definition).

---

**End of report.**
