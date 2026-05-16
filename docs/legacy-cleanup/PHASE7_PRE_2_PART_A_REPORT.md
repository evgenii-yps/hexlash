# Phase 7-pre-2 — Part A Report (discovery)

**Branch:** `claude/hexlash-design-setup-wbwFA`
**HEAD SHA:** `f771d5b` (Phase 7-pre Part B)
**Date:** 2026-05-14
**Scope:** Discovery only. No code edits.

---

## STEP 0 (Lesson #43)

- Branch: `claude/hexlash-design-setup-wbwFA` ✅
- HEAD SHA: `f771d5b` ✅ matches expected (Part B)
- Clean working tree, in sync with origin
- Decision: proceed

---

## Group A — 2 actions left over from Part B (verify)

| Action | dispatchers (current SHA) | Status |
|---|---|---|
| `fight/clearSavedFight` | 0 | confirmed dead ✅ |
| `progression/syncProgression` | 0 | confirmed dead ✅ |

**Drop list:** 2 actions.

**Cascade:**
- `clearSavedFight` body just calls `clearFightState()` helper. `clearFightState` is also called by `resetToPreparation` (retired Part B). After dropping `clearSavedFight`: `clearFightState` helper itself has zero callers. **Cascade-dead.**
- `syncProgression` body calls `apiClient.put('/user/progression', ...)` — no commit/dispatch. Body alone, no helpers.

---

## Group B — Whole-module retirement audit

### B.1 — `progressionState.js`

**Inventory after Part B:**
- state: `loadProgress()` returns object with `taps`, `freeXP`, `branchExp`, `moves`, `deck`, `totalTaps`, `totalFights`, `totalWins`
- helpers: `createInitialProgress`, `loadProgress`, `saveProgress`
- getters: 8 (`getTaps`, `getTotalTaps`, `getFreeXP`, `getMoves`, `getDeck`, `getStats`, `getUnlockedMoves`, `isDeckValid`)
- mutations: 2 (`restoreProgression`, `restoreDeck`)
- actions: 1 (`syncProgression` — already in Group A)

**External usage scan (`progression/` namespace across `src/`):** **0 hits.** The 5 grep matches were unrelated (`category: 'progression'` in `pixelIcons.js`).

**Module imports outside store.js:** **0.** The only hit is a doc-comment line in `masterService.js:12`.

**Lesson #11 catch — wrong-namespace dead writes:**
3 commit/dispatch sites in `src/` reference namespace `progressionState/` — which **DOES NOT EXIST** in the Vuex store. Actual registered namespace is `progression` (per `store.js:27`). These are silent no-ops (Vuex logs warning):

| File | Line | Code | Effect |
|---|---|---|---|
| `masterService.js` | 19 | `store.commit('progressionState/restoreProgression', userData.progression)` | silent no-op |
| `masterService.js` | 28 | `store.commit('progressionState/restoreDeck', userData.deck)` | silent no-op |
| `cardFightState.js` | 215 | `dispatch('progressionState/syncProgression', null, { root: true })` | silent no-op (inside live `setPlayerModules` action) |

**Implication:** `restoreProgression` + `restoreDeck` mutations were already orphan even before Part B started — the "callers" never actually called them. Same for `syncProgression` — its dispatch from `cardFightState.js:215` was already broken.

**Verdict:** `progressionState.js` is **dead celiком**. Module retire:
- Delete file
- Delete `import progression from '@/core/state/modules/progressionState.js'` + `progression,` registration in `store.js` (lines 11 + 27)
- Clean up 3 broken-namespace silent-no-op commits in masterService.js + cardFightState.js (cascade — leaving them in is a code smell pointing to a deleted namespace)
- Drop `progressionState` doc-comment in masterService.js:12 (refers to removed surface)

### B.2 — `punchState.js`

**Inventory after Part B:**
- state: `punchInfo`, `isTrainingBlocked`, `batchHitPunchAmount`, `batchHitPunchCount`, `is2DPunch`, `isMuted`
- getters: 3 (`getPunchInfo`, `is2DPunchEnabled`, `isMuted`)
- mutations: 4 (`setIsTrainingBlock`, `setPunchInfo`, `set2DPunch`, `setMuted`)
- actions: `{}` (empty, after Part B)

**External namespace usage (`punch/` across `src/`):**

LIVE consumers (3 files):
| File | Line | Code |
|---|---|---|
| `HudProfile.vue` | 644 | `store.getters['punch/isMuted']` |
| `HudProfile.vue` | 646 | `store.commit('punch/setMuted', soundOn.value)` |
| `BottomMenu.vue` | 38 | `store.getters['punch/isMuted']` |
| `punchService.js` | 24, 58, 67 | `store.commit('punch/setPunchInfo', ...)` ×3 |
| `punchService.js` | 25, 59 | `store.commit('punch/setIsTrainingBlock', ...)` ×2 |

**Verdict:** Module is **partially live**. Retire only:
- mutation `set2DPunch` (0 live commits anywhere)
- getter `is2DPunchEnabled` (0 live consumers)
- getter `getPunchInfo` (0 live consumers)
- state field `is2DPunch` (no external readers)
- state field `batchHitPunchAmount` + `batchHitPunchCount` (no external readers, no remaining internal writers — were used by retired actions only)

Keep live: `setMuted`, `setPunchInfo`, `setIsTrainingBlock`, `isMuted` getter, state fields `punchInfo`, `isTrainingBlocked`, `isMuted`.

Module file + registration: **keep** (partial).

---

## Group C — Legacy tails in live modules

### C.1 — cardFightState.js

After Part B, mutations still committed inside live actions (`loadModules`, `setPlayerModules`, `setEmergencyProtocol`, `startFight`, `checkEmergencyProtocol`, `clearSavedFight`):

| mutation | committed by | external readers (state field) |
|---|---|---|
| `clearDice` | startFight | — |
| `clearEventTitle` | startFight | — |
| `clearRoundLog` | startFight | — |
| `resetCoachAdvice` | startFight | — |
| `resetPlayerModifiers` | startFight | — |
| `resetStats` | startFight | — |
| `setEmergencyProtocol` | loadModules/setEmergencyProtocol | — |
| `setEmergencyUsed` | startFight + checkEmergencyProtocol | — |
| `setEventTitle` | checkEmergencyProtocol | — |
| `setFightPhase` | loadModules + startFight | — |
| `setOpponent` | startFight | — |
| `setOpponentDeck` | startFight | — |
| `setPlayerDeck` | startFight | — |
| `setPlayerModifiers` | startFight + checkEmergencyProtocol | — |
| `setPlayerModules` | startFight (+ loadModules + setPlayerModules action) | — |
| `setRoundNum` | startFight | — |
| `setXpAwarded` | startFight | — |
| `setXpEarned` | startFight | — |

**External `fight/*` consumers (live):**
- `PreparationView.vue` (kept v1, Sub-epic 8 Phase C deferred): `fight/isBuildValid` getter, `fight/startFight` action, `fight/loadModules` action
- `ModuleBuilder.vue`: `fight/getPlayerModules` getter, `fight/getEmergencyProtocol` getter, `fight/setPlayerModules` action, `fight/setEmergencyProtocol` action
- `masterService.js:23`: `fight/setPlayerModules` mutation commit

**Verdict:** cardFight module is **alive** via v1 PreparationView preserve. Deeper mutation cascade is gated on PreparationView's eventual retirement (Эпик 7+). **No orphan-entries to drop in 7-pre-2.**

### C.2 — pvpState.js

Getters audit (0 = no consumers):

| getter | external consumers |
|---|---|
| `getCurrentPvPFight` | **0** ← dead |
| `getPvpStats` | **0** ← dead |
| `getStatus` | **0** ← dead |
| `isPvPFight` | **0** ← dead |
| `winRate` | **0** ← dead |
| `league` | **0** ← dead |
| `getCurrentMatchId` | live (v2) |
| `getPvpFightStatus` | live (v2) |
| `getOpponentInfo` | live (v2) |
| `getIsPlayer1` | live (v2) |

**6 dead getters** confirmed. Companion state fields `currentPvPFight`, `pvpStats`, `status` are likely orphan-read too (the dead getters were their only readers). After dropping getters: state fields can also drop, BUT they're written by remaining live actions (`restoreFromServer` commits `setPvpStats`, `finishPvPFight` commits `setStatus`, `setRating`, `setRatingChange`). So state writes still happen — orphan-write situation. Per ТЗ conservative: drop only getters in 7-pre-2; mutations and state fields cascade is a follow-up.

Also: helpers `saveToStorage`, `loadFromStorage` still called by live actions (`restoreFromServer`, `finishPvPFight`). Keep.

**Verdict:** 6 dead getters in pvpState — drop.

### C.3 — agentState.js

State fields after Part B mutation drops (REMOVE_AGENT + SET_FIGHT_HISTORY* + SET_TRAIN_*):

| state field | external readers |
|---|---|
| `fightHistory` | **0** ← orphan |
| `fightHistoryTotal` | **0** ← orphan |
| `fightHistoryLoading` | **0** ← orphan |
| `trainResult` | check |
| `trainLoading` | check |

Initial: 3 confirmed orphan (`fightHistory*`). `trainResult` + `trainLoading` — were written by dropped `SET_TRAIN_*` mutations; consumers need verification before dropping.

**Verdict:** drop state fields `fightHistory`, `fightHistoryTotal`, `fightHistoryLoading`. Verify `trainResult`/`trainLoading` consumers before dropping.

---

## Group D — Service-layer mirror sweep

Inventory: 9 service files. Per-method caller scan (broad-pattern grep).

**Confirmed dead service-methods (zero callers other than self-export):**

| Service | Method | Reason for death |
|---|---|---|
| `taskService` | `sendUpdateDailyTask` | sole caller was retired `task/updateDailyTask` (Phase 6 + Part B) |
| `clanService` | `changeClan` | sole caller was retired `clan/changeClan` (Part B) |
| `userService` | `getUserByIdFromLocalAndAPI` | sole caller was retired `user/getUserById` action (Part B) |
| `userService` | `getUserDataByIdFromAPI` | cascade — only called by getUserByIdFromLocalAndAPI (dying) |
| `userService` | `fetchUserById` | cascade — only called by getUserDataByIdFromAPI + cascade-orphan internal at line 41 |
| `punchService` | `getPunchLimitsFromLocalAndSocket` | sole caller was retired `punch/synchronizePunchInfo` |
| `punchService` | `sendPunchBatch` | sole caller was retired `punch/startPunchTimer` |
| `punchService` | `stopPunchBatch` | sole caller was retired `punch/handlePunch` |
| `masterService` | `showFightRulesReminder` | 0 callers anywhere |
| `masterService` | `showTrainingRulesReminder` | 0 callers anywhere |

**10 service-methods** to retire.

**Cross-check from Part B parking list:** `taskService.sendUpdateDailyTask` ✅ + `clanService.changeClan` ✅ both surfaced. Methodology validated.

**LIVE (verified, not retiring):**
- `punchService.receivePunchBatch` — called by webSocketState.js:140
- `userService.fetchUserByLogin` — called by userState.js (live `getGuestUserByLogin` action)
- `userService.getUserByLoginFromLocalAndAPI` — same
- `userService.getUserDataByLoginFromAPI` — same chain
- `clanService.leaveClan`, `createClan`, `deleteClan`, etc. — many live callers
- `fightService.receiveFightInfo` — called by webSocketState.js:140

**Preserve candidates (carve out per architecture pattern — feature-flagged off, mirror of BuyTokens L5):**
- **`nftMintService.js` (whole file)** — all 5 exports (`isNftMintingEnabled`, `getAgentNftBalance`, `getMintPrice`, `getMintInfo`, `mintAgentNft`) have **zero external callers**. Internal: `getMintPrice` calls `isNftMintingEnabled`. NFT minting is feature-flag-off per CLAUDE.md (parallel to BuyTokens L5 preserve). **NOT retiring** in 7-pre-2 — same preserve semantic as L5. Add to parking list as "feature-flagged subsystem held by preserve doctrine".

**Architectural finding — contract subsystem on a thread:**
All 6 `contract/*` Vuex actions + entire `contractService.js` + `contractState.js` + `contractABI` are alive **solely via** `BuyTokens.vue` (L5 preserve). If BuyTokens ever retires, this whole chain becomes a domino retire candidate. **No action in 7-pre-2** (preserve respected) — flagged as observation.

---

## Cascade preview (mutations + helpers + i18n)

### Group A retires
- `clearFightState` helper in cardFightState.js — cascade-dead after `clearSavedFight` drop (was its only caller post Part B)
- `syncTimeout` module-scope let in progressionState.js — cascade-dead (only used by syncProgression body)
- `apiClient` import unused after syncProgression drop — cleanup candidate

### Group B retires (progressionState whole-module)
- Module file deletion drops all 8 getters, 2 mutations, 1 action (already in Group A), all helpers
- 3 broken-namespace silent no-ops in masterService.js + cardFightState.js — clean up cascade

### Group C
- pvpState: drop 6 dead getters; state fields stay (still written by live actions — orphan-write state acceptable for now)
- agentState: drop 3 state fields (fightHistory*); after dropping `trainResult`/`trainLoading` (if their consumers verified zero), maybe drop those too

### Group D
- 10 service-methods retire — no further cascade (these are leaves)
- Service files (taskService, clanService, userService, punchService, masterService) all stay — partial retirements

### i18n cascade for Phase 7
- No new orphan i18n keys identified in 7-pre-2 audit. Part B's `t.profile.invite.inviteText` already queued.

---

## Open questions for owner STOP gate

1. **Group B `progressionState.js` whole-module retire** — verdict is "dead целиком", confirm full retire (file + registration + 3 broken commits + cardFightState doc-comment line)?
2. **Group B `punchState.js` partial retire** — drop set2DPunch / is2DPunchEnabled / getPunchInfo / state fields (is2DPunch + batch* + isLoadingPunchInfo if leftover)?
3. **Group C agentState** — `trainResult` + `trainLoading` state fields not yet checked for readers. Audit during Part B, drop if zero?
4. **Group D 10 service-methods** — drop all 10?
5. **`nftMintService` whole-file** — preserve semantic (feature-flagged) like BuyTokens — confirm carve-out to parking list, NOT retire in 7-pre-2?
6. **Contract subsystem architectural finding** — flag-only or owner wants explicit handling note in CLAUDE.md?

**Defaults if owner approves blanket:**
- Retire Group A (2) + Group B (whole module progression + 5 partial entries punch) + Group C (6 pvpState getters + 3 agentState state fields) + Group D (10 service-methods)
- Carve out nftMintService whole-file as preserve
- Flag contract subsystem dependency in CLAUDE.md update at series wrap

---

## STOP gate

Wait for owner sign-off before Part B retirement.
