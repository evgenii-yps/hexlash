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
