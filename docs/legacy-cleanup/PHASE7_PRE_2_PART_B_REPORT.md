# Phase 7-pre-2 — Part B Report (retirement)

**Branch:** `claude/hexlash-design-setup-wbwFA`
**HEAD SHA before:** `5e4f017` (Part A audit report)
**Date:** 2026-05-14

## STEP 0 (Lesson #43)

- Branch: `claude/hexlash-design-setup-wbwFA` ✅
- HEAD SHA: `5e4f017` ✅ matches expected (Part A)
- Clean working tree
- Decision: proceed

---

## Final tally

| Group | Approved | Retired | HALT | Notes |
|---|---|---|---|---|
| **A** (2 actions + cascade helper) | 2 | **2** + `clearFightState` helper | 0 | ✅ |
| **B progressionState** (whole module) | 1 module | **1 module** + registration + 3 broken-namespace lines + 1 empty if-block + 1 doc-comment | 0 | ✅ |
| **B punchState** (partial: 5 entries) | 5 | **5** | 0 | ✅ |
| **C pvpState** (6 getters) | 6 | **6** | 0 | ✅ |
| **C agentState** (3 confirmed + 2 audit-and-drop) | 3 + 2 | **5** | 0 | trainResult/trainLoading audit confirmed 0 readers, dropped |
| **C cardFight** | 0 (preserve) | 0 | 0 | not touched per Part A decision |
| **D** (10 service-methods) | 10 | **10** | 0 | ✅ |
| **Q5 nftMintService** | carve out | 0 | n/a | parking list |
| **Q6 CLAUDE.md note** | yes | **1 update** | 0 | ✅ contract-subsystem dependency flagged at BuyTokens entry |
| **Cascade fix (Lesson #11)** | n/a | **1 runtime fix** | 0 | startFight `rootState.progression || {}` nil-check |

**Total Vuex/service items retired:** 28 (2 actions + helper + module + 5 punch entries + 6 pvp getters + 5 agent state fields + 10 service-methods). Plus 6 cascade items (broken-namespace cleanups + helper + empty-block + doc-comment).

---

## Silent-failure findings (separate section per ТЗ)

Part A discovered three places in code that committed/dispatched to Vuex namespace `progressionState/`, which **does not exist** (actual registered namespace was `progression`). Vuex logs warnings and silently no-ops on unknown namespaces.

**The three sites:**
1. `masterService.js:19` — `store.commit('progressionState/restoreProgression', userData.progression)`
2. `masterService.js:28` — `store.commit('progressionState/restoreDeck', userData.deck)`
3. `cardFightState.js:215` (now :211) — `dispatch('progressionState/syncProgression', null, { root: true })` inside live `setPlayerModules` action

**Functional impact (what the developer probably intended):**
- (1) + (2): "Restore player progression (moves/branchExp/taps/deck) from server data on app init/login". Calls fired from `restoreProgressionFromServer` in masterService — itself called 4 times: from `initializeMasterData`, `login` success, `register` success, `getMasterFromAPI` success. Every login/registration/init flow was supposed to push server-side progression data into Vuex. **Has not happened in production for unknown duration.**
- (3): "Sync player modules to server when player updates them in module builder". After user selects new modules in ModuleBuilder, the dispatch should have triggered `progressionState/syncProgression` which calls `PUT /user/progression`. **Has not happened in production either.**

**Why this didn't crash the app:**
- Vuex `store.commit('unknown-namespace/...')` and `store.dispatch('unknown-namespace/...')` only log a console.error and return — they don't throw.
- The functions calling these commits had no return-value contract on the commit succeeding.
- Other commits in the same function (`fight/setPlayerModules`, `pvp/restoreFromServer`) WERE live and DID succeed, so the function "worked enough" to look fine in dev.

**Why dropping these in Part B is safe:**
- They were silent no-ops — the functional intent was already broken. Dropping the lines does not regress runtime behavior. It only stops the misleading warning logs.

**Action taken in Part B:**
- All 3 broken lines dropped.
- `masterService.js` doc-comment updated to historical-record form (reflects what the function did vs what was retired).
- Empty `if (userData.deck) { ... }` block removed (became empty after `restoreDeck` line dropped).

**Carry-over to parking list (product-level question, not for this series):**

> **PROGRESSION-RESTORE / SYNC FUNCTIONALITY** — does it need to exist?
>
> Two functional intents have been silently broken in production for an unknown period:
> 1. On login/init/register: restore server-side progression (moves, branchExp, taps, freeXP, deck) into a frontend Vuex store
> 2. On ModuleBuilder change: sync player modules + progression to server via `PUT /user/progression`
>
> Since P1-migration moved per-user progression to per-agent (Fighter #1), the User-level `progressionState` Vuex module was redundant anyway — captain agent's data + agent endpoints handle this. The broken commits attempted to populate a vestigial store nobody read.
>
> **Owner decision needed:** is there still a functional path that needs server↔Vuex sync, OR is captain-agent-based progression complete coverage? If the former, re-implement on live namespace + add tests. If the latter, the parking item closes as "no action — broken intent was vestigial".

---

## Methodological note (for future Phase 0 audits)

A class of bugs that this serial discovered late: **silently-broken namespace references in Vuex commits/dispatches.**

A typo in a namespace string (`progressionState/x` instead of `progression/x`) doesn't fail loudly. Vuex logs a console.error and continues. The function body keeps executing past the silent no-op. UI doesn't crash. Tests (if no integration coverage) don't catch it.

**Recommended addition to future Phase 0 audit checklists:**

> **Grep for unknown Vuex namespaces.** Build a set of registered namespaces from `store.js` (or wherever `createStore` is called). Then grep all `commit('X/...')` and `dispatch('X/...')` patterns across `src/`. Every X must be in the registered set.
>
> Sample grep pattern:
> ```
> # Get all registered namespaces:
> grep -oE "^\s+[a-z]+:" src/core/state/store.js  # or however your store registers
>
> # Then for every namespace used in code:
> grep -rnoE "(commit|dispatch)\(['\"]([a-zA-Z]+)/" src/ \
>   | awk -F"['\"]" '{print $2}' | awk -F'/' '{print $1}' | sort -u
>
> # Diff the two lists.
> ```
>
> Cost: ~5 minutes per Phase 0. Catches: silent-failure-class bugs.

---

## Cascade items dropped (intra-Vuex / intra-service only)

### Group A cascade
- helper `clearFightState` in cardFightState.js (cardFightState.js:63-65) — was held alone by retired `clearSavedFight`. Dropped.

### Group B progressionState cascade
- file `src/core/state/modules/progressionState.js` (whole file deletion)
- root store import `import progression from "@/core/state/modules/progressionState.js"` (store.js:11)
- root store registration `progression,` (store.js:27)
- broken commits `progressionState/restoreProgression` and `progressionState/restoreDeck` (masterService.js:19, :28)
- broken dispatch `progressionState/syncProgression` (cardFightState.js:215, now :211, inside `setPlayerModules` action — action body simplified accordingly)
- empty `if (userData.deck) {}` block in `restoreProgressionFromServer` (became empty after sole content removed)
- function doc-comment updated to reflect actual current behavior

### Group B punchState partial
- mutation `set2DPunch`
- getter `is2DPunchEnabled`
- getter `getPunchInfo`
- state fields `is2DPunch`, `batchHitPunchAmount`, `batchHitPunchCount`
- imports/helpers: none cascade-dead (file already imports nothing extra after Part B)

### Group C agentState
- state fields `fightHistory`, `fightHistoryTotal`, `fightHistoryLoading`
- state fields `trainResult`, `trainLoading` (audit-and-drop — confirmed zero readers)

### Group D service-methods + sub-cascade
- `taskService.sendUpdateDailyTask`
- `clanService.changeClan`
- `userService.{getUserByIdFromLocalAndAPI, getUserDataByIdFromAPI, fetchUserById}` chain
- `userService` import: `getUserByIdFromDB` dropped from `@/core/database/userRepository.js` named import (only used by retired methods)
- `punchService.{getPunchLimitsFromLocalAndSocket, sendPunchBatch, stopPunchBatch}`
- `punchService` imports: dropped `getPunchLimitsFromLocalDB`, `PunchBatchRequestMsg`, `PunchInfoRequestMsg`, `DECIMALS`, `isMockMode` (used only by retired methods)
- `masterService.{showFightRulesReminder, showTrainingRulesReminder}`
- `masterService` imports: none cascade-dead (the imports are used by other live functions)

---

## Cascade fix — `startFight` runtime nil-check (Lesson #11)

After dropping the `progression` Vuex module, `rootState.progression` becomes `undefined`. `startFight` action in cardFightState.js reads `rootState.progression` and passes it to `buildPlayerFighter(progressionState, ...)`, which dereferences `.deck` — would crash at runtime on any v1 PvE fight launch from PreparationView.

**Fix:** inline nil-check at the call site (cardFightState.js, `startFight` body):
```js
const progressionState = rootState.progression || {};
const playerFighter = buildPlayerFighter(progressionState, captainModules);
```

`buildPlayerFighter` already handles empty `{}` via its own defaults (`.deck || []`, `.moves || {}`). The fix avoids runtime crash on v1 PreparationView fight launch (which is preserved per Sub-epic 8 Phase C decision).

**Per ТЗ "build clean, runtime не сломан":** this fix is mandatory cascade for Group B retire approval. Documented in the affected lines via inline comment.

---

## NOT touched (per ТЗ)

- **`nftMintService.js` whole file** — Q5 carve out, preserve semantic (mirror BuyTokens L5). Parking list.
- **`uploadMasterAvatar` action** + **`webSocket/handleInternalError`** — Part B 7-pre Group 3 carve out. Parking list.
- **Contract subsystem** (`contract/*` Vuex, `contractService`, `contractState`, `contractABI`) — preserve celiком, live only via L5 BuyTokens.vue. Architectural note added to CLAUDE.md.
- **cardFight deeper hooks** — gated on PreparationView retirement (Эпик 7+).
- **i18n keys** — Phase 7.
- **Components** (.vue files) — not in scope.
- **Backend** — Phase 10.

---

## Out-of-scope findings (carry-over)

1. **`userRepository.getUserByIdFromDB`** — orphan after `userService.getUserByIdFromLocalAndAPI` retire. Database-layer cleanup is its own concern (not Vuex, not service). Add to follow-up backlog: "DB repository cleanup pass".

2. **`punchService` reduced to single live function** — only `receivePunchBatch` remains (called by webSocketState). File is small (~20 lines after retires) but not empty. Don't auto-delete. Eventually could be folded into webSocketState directly if punch system gets a structural review.

3. **`taskService.sendUpdateDailyTask` etc. service-method retires didn't shrink any files to empty** — all source service files still have multiple live exports. No empty-file findings this round.

4. **`progressionState` retire surface findings beyond Vuex layer:**
   - `STARTER_MOVES` constant (3 items, was inside the deleted file) — was only used inside `createInitialProgress` (also deleted). Truly contained, no external escape.
   - `STORAGE_KEY = 'hexlash_progression'` localStorage key — was only used inside the deleted save/load helpers. After file deletion, the localStorage entry on existing users' machines becomes orphan-data. Doesn't break anything (browser ignores; eventually expires per browser policy). No action needed.

5. **`masterService.restoreProgressionFromServer` function name now misleading** — function no longer restores progression (only player modules + pvp stats). Rename candidate: `restoreUserStateFromServer` or similar. Out of scope of Vuex retire; cosmetic cleanup for future pass.

---

## i18n cascade for Phase 7

No new i18n keys orphaned by Phase 7-pre-2 Part B retirements. The retired Vuex actions/mutations/getters/state-fields had no direct i18n key references in their bodies (verified during edits). Service-methods that were retired (`showFightRulesReminder`, `showTrainingRulesReminder`) accept `text` parameter from caller — caller side has been retired earlier in this series, so any keys passed to them are already orphan via that earlier retire.

---

## Build verification

`npm run build` clean. Main bundle dropped from 1352kb → **1343kb** (-9kb additional this commit on top of Part B's -18kb). Cumulative since Phase 7-pre Part A baseline (1370kb): **-27kb** = full Vuex retirement footprint.

---

## CLAUDE.md update (Q6)

Added inline note in Component Highlights section, attached to existing `BuyTokens.vue` entry (line 613). Note flags that BuyTokens.vue is the SOLE consumer of the contract subsystem (Vuex `contract/*`, `contractService`, `contractState`, `contractABI` + parallel-preserve `nftMintService`). If BuyTokens retires, this becomes a domino retire → schedule as separate "contract-subsystem-removal" series, not a single-file cleanup.

Placement rationale: existing Legacy Cleanup Backlog list in CLAUDE.md doesn't exist as a formalized section header. The BuyTokens entry in Component Highlights is the place a future developer touching BuyTokens will land — exactly where the warning belongs.

---

## Final grep verification

Per ТЗ Step 7: confirmed zero hits for retired namespaces/methods across `src/`:
- `progression/` namespace: 0 hits ✅
- `progressionState/` broken namespace: 1 hit (deliberate doc-comment narrating history in masterService.js:16) ✅
- 10 retired service-methods: 0 hits each ✅
- 6 retired pvpState getters (`pvp/getCurrentPvPFight` etc.): 0 hits each ✅
- 5 retired punch entries (`set2DPunch`, `is2DPunchEnabled`, `getPunchInfo`, `is2DPunch`, `batch*`): 0 hits each ✅

---

## STOP gate

Wait for owner sign-off before Phase 7 (i18n sweep).

Parking list after series — pending items:
- `uploadMasterAvatar` action (Part B 7-pre Group 3 carve out)
- `webSocket/handleInternalError` (Part B 7-pre Group 3 carve out)
- `nftMintService.js` whole file (Q5 carve out)
- Product-question: progression-restore/sync re-implement OR confirm as vestigial (silent-failure finding)
- `userRepository.getUserByIdFromDB` (database-layer follow-up)
- `restoreProgressionFromServer` rename candidate (cosmetic)
