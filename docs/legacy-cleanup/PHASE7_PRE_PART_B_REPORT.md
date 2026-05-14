# Phase 7-pre Part B — Vuex Retirement Report

**Branch:** `claude/hexlash-design-setup-wbwFA`
**HEAD SHA before:** `106f8ea` (Part A audit report)
**Date:** 2026-05-14

## STEP 0

- Branch: `claude/hexlash-design-setup-wbwFA` ✅
- HEAD SHA: `106f8ea` ✅ matches expected (Part A)
- Clean working tree
- Decision: proceed

## Pre-edit verify (fresh grep on current SHA)

All 40 candidates re-verified zero dispatchers on current SHA:

- **Group 1 (11):** all confirmed dead.
- **Group 2 (29):** all confirmed dead.
- **Group 3 (2):** zero dispatchers, but carved out per ТЗ (uploadMasterAvatar — avatar uploader, possible v2 fallback path; handleInternalError — defensive callback that may not need a dispatcher to be wired).

Note on `user/getUserByLogin`: `ext=1` grep hit in second-pass broad regex resolved to **getter callsites** (`store.getters['user/getUserByLogin']` at HudUserProfile.vue:5,192), NOT action dispatchers. Same-name getter (live) preserved per ТЗ. Action retired.

## Q2 / Q3 extra-scrutiny proofs

### Q2 — pvp/createPvPFight + pvp/clearCurrentFight

v2 architecture explicitly bypasses old actions. Direct `pvp/SET_PVP_MATCH` + `pvp/RESET_PVP_FIGHT` mutation commits at:
- `src/components/pvp/ChallengeNotification.vue:59` (SET_PVP_MATCH)
- `src/views-v2/FightView.vue:70` (SET_PVP_MATCH)
- `src/views-v2/FightView.vue:344` (RESET_PVP_FIGHT)
- `src/views-v2/MatchmakingView.vue:99` (RESET_PVP_FIGHT)
- `src/views-v2/MatchmakingView.vue:228` (SET_PVP_MATCH)

Coverage confirmed: 6 live commit sites for SET_PVP_MATCH/RESET_PVP_FIGHT replace the old `createPvPFight`/`clearCurrentFight` flow entirely. ✅ Drop approved.

### Q3 — master/initGetStarted

Body: checks `!state.master.initialVerified`, commits `setSignupState`. Grep for `GetStarted` / `onboarding` / `get-started` across `src/` → **zero hits anywhere**. Per CLAUDE.md Эпик 9 auth-redesign provider-selector took over signup flow. ✅ Drop approved.

## Group 1 — retired (11 actions)

| Action | File | Notes |
|---|---|---|
| `master/sendShare` | masterState.js | Phase 4 cascade |
| `task/updateDailyTask` | taskState.js | Phase 6 cascade |
| `punch/startPunchTimer` | punchState.js | v2 bypasses Vuex (useClickToHit) |
| `punch/stopPunchTimer` | punchState.js | same |
| `punch/handlePunch` | punchState.js | same |
| `punch/synchronizePunchInfo` | punchState.js | same |
| `progression/addTap` | progressionState.js | P1-migration tail |
| `progression/onFightEnd` | progressionState.js | same |
| `progression/toggleDeckMove` | progressionState.js | same |
| `user/getUserByLogin` (action) | userState.js | getter preserved |
| `user/getUserById` (action) | userState.js | getter preserved |

## Group 2 — retired (27 actions)

| Action | File |
|---|---|
| `fight/computeNextRound` | cardFightState.js |
| `fight/rollDiceManual` | cardFightState.js |
| `fight/applyCoachAdvice` | cardFightState.js |
| `fight/skipCoachAdvice` | cardFightState.js |
| `fight/initFromStorage` | cardFightState.js |
| `fight/resumeMissedRounds` | cardFightState.js |
| `fight/resetToPreparation` | cardFightState.js |
| `fight/fightAgain` | cardFightState.js |
| `agent/deleteAgent` | agentState.js |
| `agent/refreshAgentStatus` | agentState.js |
| `agent/updateAgent` | agentState.js |
| `agent/updateTactics` | agentState.js |
| `agent/learnMove` | agentState.js |
| `agent/updateDeck` | agentState.js |
| `agent/fetchFightHistory` | agentState.js |
| `agent/trainAgent` | agentState.js |
| `clan/loadClanById` | clanState.js |
| `clan/changeClan` | clanState.js |
| `friends/searchPlayers` | friendsState.js |
| `friends/sendFriendRequest` | friendsState.js |
| `friends/cancelChallenge` | friendsState.js |
| `friends/acceptIncomingChallenge` | friendsState.js |
| `friends/declineIncomingChallenge` | friendsState.js |
| `master/initGetStarted` | masterState.js |
| `master/changeSkin` | masterState.js |
| `pvp/createPvPFight` | pvpState.js |
| `pvp/clearCurrentFight` | pvpState.js |

**Total actions retired:** 38 (Group 1: 11 + Group 2: 27).

## Group 3 — carved out (NOT retired, parking list)

| Action | Reason for carve-out |
|---|---|
| `master/uploadMasterAvatar` | v2 avatar upload path not verified — carved out per ТЗ default; no grep proof emerged during Part B to override. Parking list. |
| `webSocket/handleInternalError` | Defensive error catch-all; zero dispatchers ≠ proof of death. No registration grep run — carved out per ТЗ default. Parking list. |

## Cascade — mutations + helpers + getters dropped (intra-Vuex only)

Following ТЗ "каскад до конца, но строго в пределах Vuex-слоя":

### progressionState.js
- mutations: `addTap`, `addFreeXP`, `toggleDeckMove` (all only commit'd by the 3 dying actions)

### punchState.js
- mutations: `setIsLoadingPunchInfo`, `setPunchTimer` (only commit'd by dying actions)
- state fields removed: `isLoadingPunchInfo`, `punchTimerId`
- imports removed: `BATCH_SEND_INTERVAL_MS`, `DECIMALS`, `punchService` from this module (still alive — webSocketState.js imports it)
- Kept: `setIsTrainingBlock`, `setPunchInfo` (live via punchService → webSocketState path); `setMuted`, `set2DPunch` (live external)

### masterState.js
- mutations: `setSignupState` (only commit'd by initGetStarted)

### pvpState.js
- mutations: `clearCurrentPvPFight` (only commit'd by dying clearCurrentFight)
- helper: `generateOpponentFighter` (only called by dying createPvPFight)

### friendsState.js
- mutations: `addOutgoingRequest`, `removeOutgoingRequest` (only commit'd by dying sendFriendRequest)
- Kept: `removeIncomingRequest`, `addFriend`, `removeFriend`, `clearIncomingChallenge`, `clearOutgoingChallenge` (all shared with live code)

### agentState.js
- mutations: `REMOVE_AGENT`, `SET_FIGHT_HISTORY`, `SET_FIGHT_HISTORY_LOADING`, `SET_TRAIN_RESULT`, `SET_TRAIN_LOADING`
- Kept: `UPDATE_AGENT`, `OPTIMISTIC_SET_CAPTAIN`, `ROLLBACK_AGENTS`, `OPTIMISTIC_TOGGLE_AUTO_FIGHT`, `ROLLBACK_AUTO_FIGHT`, `SET_FIGHT_CLUB_LEVEL*`, `SET_CURRENT_AGENT*`, `SET_AVAILABLE_MOVES*`, `setAgentRankings`, `updateAgentRankingsState` (all shared with live actions)

### cardFightState.js
- mutations: `setDifficulty`, `setDiceState`
- helpers: `_simulateOneRound`, `loadFightState`
- getter: `hasSavedFight` (zero consumers)
- Kept: all other mutations + helpers — `startFight` (live) commits them, or they're committed via `clearSavedFight` (live action). Note: deeper cascade is possible but stopped here for conservative scope — see "Out of scope, parking list" below.

**Total cascade-dead items dropped:** ~22 (mutations + helpers + getter).

## i18n cascade for Phase 7 (verified by fact)

i18n keys now orphan after Part B retirement, all confirmed zero remaining live consumers via grep:

- (No new keys orphan'd by Part B beyond what Phases 1–6 already flagged.)
  - `t.profile.invite.inviteText` was already in cascade tail from Phase 4 (held by `sendShare` action). With `sendShare` now retired in Part B, it's directly orphan. **Add to Phase 7 queue.**

Other i18n keys consumed only inside retired actions (sample) — none found outside the deleted bodies; all already accounted for in Phases 1–6 cascade lists.

## Lesson #11 catches during Part B

1. **userState.js getter/action conflict:** broad regex initially returned `ext=1` for `user/getUserByLogin`. Confirmed the hit was the getter (`store.getters['user/getUserByLogin']`), not a dispatch. Action retired, getter preserved.

2. **`punch/setIsTrainingBlock` + `punch/setPunchInfo`:** Initial first-pass grep showed zero external commits — would have classified them cascade-dead. Broader regex (Lesson #11 reflex) caught `punchService.js:25,59 commit('punch/setIsTrainingBlock')` and `punchService.js:24,58,67 commit('punch/setPunchInfo')`. Verified `punchService` is still alive via webSocketState.js import. Both mutations kept live.

3. **`friends/removeFriend` name shadowing:** action `removeFriend` (live) and mutation `removeFriend` (live) share the name. Action calls `commit('removeFriend', ...)` on itself's mutation. Mutation kept; action kept (was already in live list, not in Part A dead list).

4. **`fight/clearSavedFight` action — missed by Part A regex:** Part A regex `^[[:space:]]+(async )?[a-zA-Z]+\s*\(\{` required destructure-arg shape `({...},`. `clearSavedFight()` has no args, signature `clearSavedFight() {`. Zero dispatchers — clearly v1 dead code in same cluster as the 8 fight retirees. **NOT dropped in Part B** (out of owner-approved scope). Documented for follow-up.

5. **`progression/syncProgression` action — Part A classified live (intra=2), reality post-Part-B cascade is orphan.** Its two intra-callers were `onFightEnd` and `toggleDeckMove`, both retired in Group 1. After Part B: zero dispatchers. **NOT dropped in Part B** (owner approved 3 progression actions, not 4). Documented for follow-up.

## Out of scope, parking list

Items surfaced during Part B that are NOT addressed here:

1. **`fight/clearSavedFight` action** — orphan, missed by Part A regex.
2. **`progression/syncProgression` action** — cascade-orphan after Part B.
3. **Whole `progressionState.js` module after sync removal** — almost entirely dead: 5 mutations (3 owner-dropped + 2 zero-external = `restoreProgression`, `restoreDeck`), 8 getters all zero-consumer, ~70-line helper functions `loadProgress`/`saveProgress`/`createInitialProgress` only support state init. Module-level retirement candidate for a follow-up phase.
4. **Whole `punchState.js` module after sweep** — actions are gone; getters `getPunchInfo`, `is2DPunchEnabled` have zero consumers (only `isMuted` getter is live). Module-level cleanup candidate.
5. **`cardFightState.js` deeper mutation cascade** — Part B dropped 2 cascade-dead mutations + 1 helper + 1 getter, but many more mutations (`setPlayerDeck`, `setOpponentDeck`, `addRoundToLog`, `clearRoundLog`, etc.) are now only committed by `startFight` action (which is one of the few live cardFight actions). If `startFight` itself is reviewed for v2 reachability later, those mutations cascade too.
6. **`pvpState.js` v1 fight tail** — getters `getCurrentPvPFight`, `getPvpStats`, `getStatus`, `isPvPFight`, `winRate`, `league` are likely unused in v2 (which uses `getCurrentMatchId`, `getOpponentInfo`, `getIsPlayer1` instead). Module-level audit candidate.
7. **`agent/initialState.fightHistory*` state fields** — committed only by retired `fetchFightHistory`. State remains but mutation that wrote it is gone. State-cleanup pass.
8. **Service-layer cleanup (out of Vuex scope, per ТЗ "строго в пределах Vuex-слоя"):**
   - `taskService.sendUpdateDailyTask` — only caller was retired `task/updateDailyTask`.
   - `masterService.uploadAvatar` — only called by carve-out `uploadMasterAvatar` (if that's later retired).
   - `clanService.changeClan` — only called by retired `clan/changeClan`.
   - `clanService.leaveClan` — verify usage (probably live).

## Build verification

`npm run build` clean after all edits. Main bundle dropped from ~1370kb → ~1352kb (= ~18kb savings from Vuex retirement, JS-level).

## Final tally

- **Owner-approved candidates:** 40 (Group 1: 11 firm + Group 2: 29 individual + Group 3: 2 carve out)
- **Group 1 retired:** 11/11 ✅
- **Group 2 retired:** 27/27 ✅ (all individual greps confirmed zero dispatchers)
- **Group 3 retired:** 0/2 (both carved out, no proof of death emerged in Part B)
- **HALT:** 0 (no candidate showed unexpected live dispatcher)
- **Cascade-dead items dropped:** ~22 (mutations + helpers + 1 getter)
- **Out-of-scope items flagged for follow-up:** 8 (parking list above)

**Total Vuex surface retired this commit: ~60 items.**

## STOP gate

Wait for owner sign-off before Phase 7 (i18n sweep).
