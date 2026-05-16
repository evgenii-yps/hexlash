# Phase 7-pre — Part A Report (Vuex Orphan-Action Sweep)

**Branch:** `claude/hexlash-design-setup-wbwFA`
**HEAD SHA:** `1312bcb` (Phase 6)
**Date:** 2026-05-14
**Scope:** Discovery only. No code edits.

---

## STEP 0 (Lesson #43)

- Branch: `claude/hexlash-design-setup-wbwFA` ✅
- HEAD SHA: `1312bcb` ✅ matches expected (Phase 6)
- Clean working tree, in sync with origin
- Variant: continue stack (post-Phase-6)
- Decision: proceed

---

## Methodology

**Step 1 — Inventory.** 13 Vuex modules registered in `src/core/state/store.js`. Note: `cardFightState.js` mounts as namespace **`fight`** (not `cardFight`). Total: ~95 actions, ~80 mutations.

**Step 2 — Action dispatcher check.** For each action `module/name`:
- External dispatchers: `dispatch('module/name')` or `dispatch("module/name")` across `src/` excluding the module file itself.
- Intra-module dispatchers: `dispatch('name')` inside the module's own file (action-to-action calls).
- Second-pass broadening: `mapActions`, getter-string form `getters['module/name']`, store-reference variants.

**Step 3 — Mutation commit check.** Mutations committed only by dead actions (or only by no-longer-existing components) → cascade-dead. Full per-mutation grep not exhaustively run for Part A; mutations will be handled in Part B based on which actions retire.

**Step 4 — Cross-check known queue.** `master/sendShare` (Phase 4 cascade) and `task/updateDailyTask` (Phase 6 cascade) **must** appear in dead list. Both confirmed present ✅ — methodology validated.

---

## Findings summary

**38 candidate-dead actions** (zero dispatchers external + intra) across 9 modules. Plus **2 special cases** (action/getter name conflicts in `userState.js`).

The dead actions group into 5 distinct clusters by domain. Each cluster has different risk/blast-radius character — owner should review cluster by cluster.

---

## Cluster 1 — Confirmed cascade from Phases 1–6 (known queue)

These two were predicted to die by sub-epic cascade logic. Their presence in the list validates the sweep methodology.

| Action | Last dispatcher (now deleted) | Phase |
|---|---|---|
| `master/sendShare` | `ProfileInvite.vue:88` | Phase 4 |
| `task/updateDailyTask` | `DailyTasks.vue:102` | Phase 6 |

**Recommendation:** retire both. Cascade trail in commit messages from those phases.

---

## Cluster 2 — `fight` module (v1 PvE fight engine actions)

v1 PvE fight system. `CardFightView.vue` (the v1 fight view) was deleted in Эпик 6 Sub-epic 8 cutover (per CLAUDE.md). v2 fight scene `FightView.vue` reads `fightState` directly via composable, **bypasses Vuex `fight/*` actions entirely** (per Sub-epic 4a/4b architecture lessons). These are v1-orchestrator actions left behind.

| Action | Notes |
|---|---|
| `fight/computeNextRound` | round simulation orchestrator |
| `fight/rollDiceManual` | dice manual roll |
| `fight/applyCoachAdvice` | coach choice applier |
| `fight/skipCoachAdvice` | coach skip |
| `fight/initFromStorage` | localStorage restore |
| `fight/resumeMissedRounds` | round resync |
| `fight/resetToPreparation` | fight reset |
| `fight/fightAgain` | rematch |

**8 actions, all 0/0 dispatchers.** Live `fight/*` actions remaining: `loadModules`, `setPlayerModules`, `setEmergencyProtocol`, `startFight` (verified — these still have live consumers in v2 prep flow per CLAUDE.md). Module **NOT** wholesale dead — only the v1 PvE orchestration tail.

**Recommendation:** retire all 8. Their commit-only mutations may cascade-die (e.g., `setRoundNum`, `addRoundToLog`, `clearRoundLog`, `setLiveHP1/2`, `addStats`, `resetStats`, `setEventTitle`, `clearEventTitle`, `setEmergencyUsed`, `setXpEarned`, `setXpAwarded`) — exact mutation list verified during Part B retirement when isolating each action body.

---

## Cluster 3 — `punch` module (v1 punch system, entirely bypassed in v2)

**Whole module's action layer is dead.** Per CLAUDE.md, v2 training scene uses `useClickToHit` composable that talks to backend WS messages directly. Vuex `punch/*` actions were the v1 PuncherView orchestration.

| Action | Notes |
|---|---|
| `punch/startPunchTimer` | timer setup |
| `punch/stopPunchTimer` | timer teardown |
| `punch/handlePunch` | individual punch dispatch |
| `punch/synchronizePunchInfo` | sync info from server |

**4 actions, all 0/0 dispatchers.** Module getters (`getPunchInfo`, `isMuted`) are still live — `isMuted` consumed by HudFight per audit history. So state + mutations + getters stay; **only actions retire**.

**Recommendation:** retire all 4. Some mutations may also cascade-die (e.g., `setPunchInfo`, `setPunchTimer`, `setIsTrainingBlock`) — verify in Part B. Live mutation: `setMuted` (committed from punch getter integration / Sub-epic 5B SoundToggle / HudProfile Settings card).

---

## Cluster 4 — `progression` module (legacy User-progression tail)

Per CLAUDE.md, User-level progression was lazy-migrated к per-agent (Fighter #1) в Phase 1 / P1-migration. `progressionState.js` was the v1 trainer-only state.

| Action | Notes |
|---|---|
| `progression/addTap` | single-tap counter increment |
| `progression/onFightEnd` | post-fight XP grant |
| `progression/toggleDeckMove` | v1 deck builder toggle |

**3 actions, all 0/0 dispatchers.** Live action: `syncProgression` (2 intra-module dispatches). Module getters/mutations status not exhaustively audited for Part A — likely mostly dead.

**Recommendation:** retire all 3. `syncProgression` stays. Verify cascade in Part B.

---

## Cluster 5 — Frontend orphan tails (v1 component deletes left behind)

Mostly v1 component-tied actions. Each requires owner sanity-check.

| Action | Suspected reason for death |
|---|---|
| `agent/deleteAgent` | v1 AgentDetailView delete-button — that view is gone |
| `agent/refreshAgentStatus` | v1 list polling — replaced by `fetchAgents` |
| `agent/updateAgent` | v1 edit modal — replaced by v2 HUD |
| `agent/updateTactics` | v1 tactics editor |
| `agent/learnMove` | v1 ResearchTree learn-move handler |
| `agent/updateDeck` | v1 deck builder |
| `agent/fetchFightHistory` | v1 fights tab |
| `agent/trainAgent` | v1 PvE training button |
| `clan/loadClanById` | v1 ClanView component loader (replaced by `getClanById` + `getGuestClanById` in v2) |
| `clan/changeClan` | v1 join/leave clan handler |
| `friends/searchPlayers` | v1 friends search input |
| `friends/sendFriendRequest` | v1 add-friend button |
| `friends/cancelChallenge` | v1 challenge UI |
| `friends/acceptIncomingChallenge` | v1 ChallengeNotification accept (replaced by direct WS dispatch in v2) |
| `friends/declineIncomingChallenge` | v1 ChallengeNotification decline (same) |
| `master/initGetStarted` | v1 onboarding (Эпик 9 auth-redesign moved logic) |
| `master/changeSkin` | v1 ProfileSkins (deleted Phase 3) |
| `master/uploadMasterAvatar` | v1 avatar uploader |
| `pvp/createPvPFight` | v1 PvP fight orchestrator — Sub-epic 4a/4b moved logic to module-scoped `fightState` |
| `pvp/clearCurrentFight` | same lineage |
| `webSocket/handleInternalError` | v1 error router fallback |

**21 actions, all 0/0 dispatchers.** Some of these have many committed mutations — cascade preview deferred к Part B retirement.

**Recommendation:** retire all 21 (subject to owner sanity-check below).

---

## Special case — action/getter name conflicts (`userState.js`)

| Name | Getter status | Action status | Action body comment |
|---|---|---|---|
| `getUserByLogin` | LIVE (HudUserProfile.vue:5, 192) | dead (0 dispatchers) | line 115: "Existing getUserByLogin action remains untouched for legacy v1 callsites" |
| `getUserById` | LIVE | dead (0 dispatchers) | same legacy carryover |

**Special handling required in Part B:** retire the **action only**, leave the **getter intact**. Cannot just delete the function — must delete the action entry from `actions: {}` block, leave the getter entry in `getters: {}` block.

These are listed separately from Cluster 5 because the file naming overlap means simple "delete the function" approach is wrong here.

---

## Cascade preview (rough, exact in Part B)

For each dead action, the mutations it committed will need to be re-checked: are they committed by any other live action or directly committed from any live component? Initial scan suggests:

- **Agent dead actions** commit `SET_AVAILABLE_MOVES*`, `SET_FIGHT_HISTORY*`, `SET_TRAIN_*`, `setAgentRankings`, `updateAgentRankingsState`, `SET_CURRENT_AGENT*`, `UPDATE_AGENT`, `REMOVE_AGENT`. Some are committed by live actions (`UPDATE_AGENT` is committed in `setCaptain`, `toggleAutoFight`); others may cascade-die.
- **Fight dead actions** commit fight-engine mutations (`setRoundNum`, `addRoundToLog`, `setLiveHP1/2`, `setEventTitle`, etc.) — these are v1-engine surface; most likely cascade-die.
- **Punch dead actions** commit `setPunchInfo`, `setPunchTimer`, `setIsTrainingBlock`, `setIsLoadingPunchInfo` — most likely cascade-die. `setMuted` stays live (separate path).
- **PvP dead actions** commit `setCurrentPvPFight`, `setStatus`, `clearCurrentPvPFight` — verify against v2 path (some live mutations may share names).
- **Friends dead actions** commit `addFriend`, `addOutgoingRequest`, `removeFriend`, `removeIncomingRequest`, `removeOutgoingRequest` — `removeFriend` is also committed by **live** `friends/removeFriend` action; others may cascade-die.

Exact mutation cascade resolved during Part B per-action retirement.

---

## i18n cascade preview (owner heads-up — actual key list comes in Part B)

When dead actions retire, i18n keys read inside them become orphan. Known sample from Phase 4:
- `t.profile.invite.inviteText` was held alive by `master/sendShare`. After retirement → orphan, queues to Phase 7 i18n sweep.

Other dead actions reference very few i18n keys directly (most are pure orchestration). Final list emitted during Part B execution.

---

## Cross-check ✅ Methodology validation

Known queue items both present in dead-actions list:
- `master/sendShare` ✅ (Phase 4 prediction)
- `task/updateDailyTask` ✅ (Phase 6 prediction)

If methodology had missed something, one of these would not appear. Both surfaced. Sweep is honest.

---

## Retire-list summary (for owner review)

**38 actions across 9 modules**, grouped:

1. **Confirmed cascade (2):** `master/sendShare`, `task/updateDailyTask`
2. **Fight v1 tail (8):** `fight/{computeNextRound, rollDiceManual, applyCoachAdvice, skipCoachAdvice, initFromStorage, resumeMissedRounds, resetToPreparation, fightAgain}`
3. **Punch v1 (4):** `punch/{startPunchTimer, stopPunchTimer, handlePunch, synchronizePunchInfo}`
4. **Progression v1 (3):** `progression/{addTap, onFightEnd, toggleDeckMove}`
5. **Frontend orphan tails (21):** agent (8) + clan (2) + friends (5) + master (3) + pvp (2) + webSocket (1)

Special case:
- `user/getUserByLogin` action — retire (getter stays)
- `user/getUserById` action — retire (getter stays)

**No `preserve` self-labels found in any of the 40 candidates.** Two action bodies (`user/getUserByLogin`, `user/getUserById`) carry comments referencing "legacy v1 callsites" but those callsites are no longer present in `src/`.

---

## Open questions for owner STOP gate

Before Part B execution, please confirm:

1. **Whole retire list (40 entries) — approve or carve out?** Anything to preserve?
2. **`pvp/createPvPFight` + `pvp/clearCurrentFight` — these are 2 of 5 PvP actions.** Per CLAUDE.md Sub-epic 4a, PvP logic was moved to module-scoped `fightState` composable bypassing Vuex. The remaining 3 pvp actions (`init`, `restoreFromServer`, `finishPvPFight`) are live. Confirm OK to drop these 2.
3. **`master/initGetStarted` — onboarding action.** Per CLAUDE.md Эпик 9 auth-redesign moved provider selection logic. Confirm OK to drop (no onboarding fallback path needed).
4. **`master/uploadMasterAvatar` — avatar uploader.** v2 may or may not have its own avatar upload flow. If avatar upload is currently broken/missing in v2 and you plan to revive it, retiring this leaves the Vuex action unavailable. Confirm OK.
5. **`webSocket/handleInternalError` — error router fallback.** This is a generic catch-all. Confirm zero callers means it really is dead and not a defensive handler waiting to be wired.

Defaults if no answer: retire all 40 entries based on grep evidence.

---

## STOP gate

Wait for owner sign-off before Part B retirement.
