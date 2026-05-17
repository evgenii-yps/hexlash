# Progression Silent Failure Investigation Report

**Date:** 2026-05-17
**Branch:** `claude/investigate-progression-silent-failure-bWSoe`
**HEAD SHA:** `2d6e285` (PR #383 Telegram retire merged — STEP 0 verified)
**Scope:** Read-only audit. No code changes. Single deliverable.
**Trigger:** Phase 7-pre-2 Part B (commit `bee213b`, 2026-05-15) parking item #8 (CLAUDE.md "Active parking list — forward к Эпик 7+ work"): "Product question: progression-restore/sync re-implement — функционал не работал на проде неизвестное время".

---

## TL;DR

Three "phantom dispatch" sites in `masterService.js` + `cardFightState.js` were silently no-ops because they referenced Vuex namespace `progressionState/` which never existed (real registered namespace was `progression`). The intents were: (a) restore taps/freeXP/moves/branchExp/totalTaps/totalFights/totalWins from server on login, (b) restore deck from server on login, (c) sync player modules + progression to backend after ModuleBuilder change. Of the three intents, **(a) is largely covered by other channels** (per-agent migration + scalar fields), **(b) was already shadow-dead** (only consumer was the also-retired `progressionState/getDeck`), and **(c) has a real but narrow functional gap**: User-level player-module choice no longer syncs to backend, so it doesn't survive logout/device-switch. However, **v2 combat (`/play/fight`) uses Captain Agent modules — not User-level modules — making the gap likely cosmetic only**. Owner judgement needed on whether v1 `PreparationView` ModuleBuilder is product-relevant; if yes, restore is required; if no, parking item can close as "vestigial, no impact". Production smoke required to confirm.

---

## What is "progression" in current Hexlash

Inventory built from Vuex modules in `src/core/state/modules/`, Prisma schema (`backend/prisma/schema.prisma`), backend routes in `backend/src/routes/`, and `localStorage` greps.

### User-level progression (legacy "trainer" data)

Stored on `User` row, returned in `GET /v1/user/me` response via `formatUserResponse` (`backend/src/utils/helpers.js:22-73`):

| Field | Type | Backend write path | Frontend read path | Status |
|---|---|---|---|---|
| `User.balance` (currency) | Int scalar | `handler.js:317-321` (`PunchBatch`), `task.js:113/138/221` (rewards), `auth.js:84-95` (referral) | `master.userData.balance` direct; `MasterModel.getBalance()` | **alive** [confirmed] |
| `User.totalTaps` (lifetime tap count) | Int scalar | `handler.js:321` (`PunchBatch.increment`), `auth.js:88-95` (referral), `researchGateService.js:425` (decrement on research) | `master.userData.totalTaps` — read by `ResearchTree.vue:148` | **alive** [confirmed] |
| `User.wonTokens` / `freeTokens` / `lostTokens` | Int scalars | various | `master.userData.*` direct | **alive** [confirmed] |
| `User.rating` (PvP ELO) | Int scalar | `pvpCombatEngine.saveFightResult` | `master.userData.rating` direct + `pvpState.restoreFromServer` | **alive** [confirmed] |
| `User.wins`/`losses`/`draws` + `pveWins/...` + `pvpWins/...` + `totalFights` | Int scalars | `fight.js`, `pvpCombatEngine`, `agentFightService` | `master.userData.*` direct | **alive** [confirmed] |
| `User.luckPercentage`, `invitedUsers`, `noSkipDays`, `referredBy` | scalars | misc backend | direct read | **alive** [confirmed] |
| `User.achievements` (via `UserAchievement[]` relation) | Relation | various `awardAchievement` calls | `master.userData.achievements: string[]` | **alive** [confirmed] |
| `User.progression` (Json blob) | Json? | (1) `userMigrationService.js:94` — one-time migration to Fighter #1 (marks legacy state); (2) `retirementService.js:117-121` — sets `retired: true` flag. **No other backend writers.** No frontend writer (the only one was retired `syncProgression`). | `masterService.restoreProgressionFromServer` reads `userData.progression.playerModules` only. Other sub-fields (`moves`/`branchExp`/`taps`/`freeXP`/etc) are returned in /me response but **not consumed by any FE store**. | **partially dead** [confirmed] |
| `User.progression.playerModules: string[3]` | sub-field | Only via lazy migration (one-time, copies from pre-migration value) + retirement marker. **No live write path.** | `restoreProgressionFromServer` → `fight/setPlayerModules` (in `cardFightState`) → also `localStorage['hexlash_player_modules']`. | **read-only** [confirmed] |
| `User.deck` (Json) | Json? | `PUT /v1/user/progression` endpoint accepts it (no FE caller though). Endpoint lives at `backend/src/routes/user.js:511-563`. | None. Returned in /me but no consumer. | **dead** [confirmed] |
| `User.settings` | Json? | `PUT /v1/user/settings` (no FE caller per Phase 10 comment line 567) | None | **dead** [confirmed — out of scope for #8] |

### Per-agent progression (modern "fighter" data)

Stored on `AgentProgression` row (1:1 with `Agent`), one row per agent (Fighter #1 = captain, plus other agents):

| Field | Type | Backend write path | Frontend read/write path | Status |
|---|---|---|---|---|
| `Agent.primaryModule` / `secondaryModule` / `tertiaryModule` | String? × 3 | `agent.js` CRUD endpoints (`POST /agent/create`, `PUT /agent/:id`, `setCaptain`) | `agentState.fetchAgents`/`fetchAgent` → `agents[]` + `currentAgent` | **alive** [confirmed] |
| `Agent.belt`, `qualifiedWins`, `isHexmaster`, `elo`, `wins/losses/draws`, `totalFights`, `xp`, `level`, `status`, `autoFight` | scalars | `agentFightService`, `beltService`, `captainService` | `agentState` reactive | **alive** [confirmed] |
| `AgentProgression.deck` (Json: `[moveId, ...]`) | Json | `PUT /v1/agent/:id/deck` + `researchGateService.executeResearchAction` + `agentFightService` | `agentState.updateAgentDeck` + `ResearchTree.vue` | **alive** [confirmed] |
| `AgentProgression.moves` (Json: `[{moveId, level}, ...]`) | Json | `agentFightService.executeResearchAction` (learn-move) + lazy migration | `ResearchTree.vue` via `agent/fetchAgent` | **alive** [confirmed] |
| `AgentProgression.research` (Json: `{moveId: {unlocked, level}}`) | Json | `researchGateService.executeResearchAction` (per-agent research tree) | `ResearchTree.vue` via `agent/fetchAvailableMoves` | **alive** [confirmed] |
| `AgentProgression.speedXp`/`powerXp`/`techniqueXp` | Int × 3 | `agentFightService.distributeXpByBranch` (auto on fight end) + `researchGateService.executeResearchAction` (decrement on upgrade) | `ResearchTree.vue` via `currentAgent.progression.*Xp` | **alive** [confirmed] |

### Other persistence layers

| Storage | Key | Owner | Lifecycle |
|---|---|---|---|
| **localStorage** | `hexlash_player_modules` | `cardFightState.setPlayerModules` (write) + `cardFightState.loadModules` (read) + `restoreProgressionFromServer` (write-overwrite from server). Cleared by `localStorage.clear()` in `masterService.js:367` (some destructive path — see Шаг 6). | Persists across reload, cleared on full localStorage.clear |
| **localStorage** | `hexlash_current_fight` | `cardFightState.saveFightState` (write per fight tick) + router restoration check (`router/index.js:260`) | Persists fight resume across reload |
| **localStorage** | `hexlash_pvp` | `pvpState.saveToStorage` (called by `restoreFromServer` + `finishPvPFight`) | Snapshot of PvP rating/stats |
| **localStorage** | `hexlash_referral_code` | `router/index.js:70` (write on `/r/:username`) + `masterService.register` (read+clear) | Single-use, cleared after register |
| **localStorage** | `hexlash_verify_banner_dismissed_<login>` | `VerifyEmailBanner.vue` (per-user dismiss flag) | Per-user banner state |
| **IndexedDB** (`hexlash` DB via `idb.js`) | `masters` store (key=MASTER_TAG) | `masterRepository.saveMasterToLocalDB` after every fresh `fetchMasterData` + sync on `updateMaster` mutation | Cache of `MasterModel`. Cleared on user switch (`masterService.js:99`) and `clearDatabase()`. Survives reload. |
| **sessionStorage** | — | none | `grep -rn "sessionStorage" src/` returns 0 hits |

### What the term "progression" historically meant (before retire)

From the retired `progressionState.js` (recovered from `bee213b~1` — see Шаг 3 below), the module owned this state shape:

```js
{
  taps: Int,                    // current tap currency
  freeXP: Int,                  // unallocated XP for branch upgrades
  branchExp: { speed, power, technique },  // per-branch XP
  moves: { moveId: { level, unlocked } },  // legacy move tree
  deck: string[],               // selected deck (3-5 items)
  totalTaps: Int,
  totalFights: Int,
  totalWins: Int,
}
```

All this was **per-User** (one trainer, one set of stats). The Phase 1 migration (Sub-epic P1-migration, CLAUDE.md §"P1-migration — User → Fighter #1") moved this concept to per-Agent: each Agent has its own `AgentProgression` row with its own moves/deck/research/xp. The User row's `progression` Json blob became a write-once snapshot used as migration input + retirement marker.

---

## Lifecycle of each progression element

Lifecycle = (WRITE — when/by-whom) → (PERSIST — where) → (READ — when/by-whom) → (RESTORE — what happens on next session).

### A. Currency: `User.balance` / `User.totalTaps` / `User.wonTokens` etc.

- **WRITE** — backend writes via various live paths:
  - `balance` ← `handler.js:317-321` on each tap batch (`PunchBatch` WS message), `task.js:113/138/221` (task rewards)
  - `totalTaps` ← `handler.js:321` on tap batch, `auth.js:88-95` on referral, `researchGateService.js:425` (decrement on research upgrade)
- **PERSIST** — PostgreSQL `User` row, scalar columns
- **READ** — frontend reads via `master.userData.balance` / `.totalTaps` directly (after `GET /v1/user/me` populates `MasterModel.userData`). `ResearchTree.vue:148` reads `userData.totalTaps`. `HudProfileWallet.vue:46` reads `userData.balance`.
- **RESTORE** — works correctly: `initializeMasterData` (`masterService.js:62, called from main.js:104`) → `fetchMasterData` → `apiClient.get('/user/me')` → `MasterModel.fromJSON` → values copied directly. **OK** [confirmed].

### B. Player modules (User-level): `User.progression.playerModules`

- **WRITE** — only TWO backend write paths exist:
  - **userMigrationService.js:43-58** — extracts pre-migration `progression.playerModules` into `Agent.primaryModule/secondaryModule/tertiaryModule`. Does NOT update `User.progression.playerModules` going forward (it's read-only after migration).
  - **retirementService.js:106-121** — wraps existing progression Json with `{ ...progression, retired: true }`. Does NOT touch playerModules field.
  - **No live FE→BE write path.** The retired `syncProgression` action was the only one; its consumers (`fight/setPlayerModules` in `cardFightState.js`) no longer dispatch it.
- **PERSIST** — PostgreSQL `User.progression` (Json blob) + frontend mirror in `localStorage['hexlash_player_modules']` (`MODULES_STORAGE_KEY`).
- **READ** — `restoreProgressionFromServer` (`masterService.js:19-31`) reads `userData.progression.playerModules`, copies to `fight/setPlayerModules` Vuex state + localStorage. `ModuleBuilder.vue:92` reads `fight/getPlayerModules`. `PreparationView.vue:101` calls `fight/loadModules` on mount, which reads back from localStorage.
- **RESTORE** — on next login, the playerModules array stored in `User.progression.playerModules` (whatever it was at migration time, or default `['predator', 'analyst', 'ghost']` if never set) is copied to Vuex + localStorage. Subsequent in-session changes via `ModuleBuilder` write **only** to Vuex + localStorage; they are **not** persisted to backend. On logout (clears localStorage via `masterService.js:367`) + re-login, the local edits are LOST and the (possibly stale, possibly migration-time) backend value re-loads. [confirmed by code reading, not verified in production].

### C. Player deck (User-level): `User.deck`

- **WRITE** — `PUT /v1/user/progression` endpoint accepts `deck` field (`backend/src/routes/user.js:542-547`) but **has zero frontend callers**. No other backend writer.
- **PERSIST** — PostgreSQL `User.deck` (Json), returned in `formatUserResponse`.
- **READ** — **None.** The retired `progressionState.getDeck` getter was the only consumer. No live FE component reads `userData.deck`.
- **RESTORE** — N/A — no consumer. Data is dead-on-arrival regardless of value. [confirmed].

### D. Per-agent progression (research, moves, deck, branch XP)

- **WRITE** — backend writes only:
  - `agentFightService.js:121/356/360` — `agentProgression.update` on fight end (XP distribution + win/loss stats)
  - `researchGateService.js:423` (`tx.user.update` for taps decrement) + `researchGateService.js` move/research updates
  - `agent.js` route — CRUD via `POST /agent/create`, `PUT /agent/:id`, `PUT /agent/:id/deck`, `POST /agent/:id/research` etc.
- **PERSIST** — PostgreSQL `AgentProgression` row (1:1 with Agent)
- **READ** — `agentState.fetchAgent` / `fetchAgents` populate `currentAgent` / `agents[]`. `ResearchTree.vue:160` reads `agent.progression.research`. `agentState.updateAgentDeck` (line 205+) writes via `PUT /agent/:id/deck`.
- **RESTORE** — works correctly: each `fetchAgent` call returns fresh server state. **OK** [confirmed]. This is the "modern" per-agent system from Phase 1.

### E. PvP rating (in `User.rating` + `pvpState`)

- **WRITE** — `pvpCombatEngine.saveFightResult` (backend) writes `User.rating` after each PvP fight.
- **PERSIST** — PostgreSQL `User.rating` + frontend mirror in `localStorage['hexlash_pvp']`.
- **READ** — `pvpState.restoreFromServer` action (`pvpState.js:118`, called by `restoreProgressionFromServer` line 30) copies server-side `userData.rating` / win-loss stats into pvpState.
- **RESTORE** — works correctly. **OK** [confirmed].

### F. Active fight resume (in-progress combat)

- **WRITE** — `cardFightState.saveFightState` writes every tick to `localStorage['hexlash_current_fight']`.
- **PERSIST** — localStorage only (no backend).
- **READ** — `router/index.js:260` checks for saved fight on route navigation.
- **RESTORE** — works for same-device same-browser session. Lost on logout / device-switch. [confirmed].

---

## What the three deleted functions used to do

Recovered from `bee213b~1:src/core/state/modules/progressionState.js`. Full pre-deletion code:

### Function 1 — `restoreProgression` (mutation)

```js
restoreProgression(state, data) {
  if (data.moves) state.moves = { ...state.moves, ...data.moves };
  if (data.branchExp) state.branchExp = { ...state.branchExp, ...data.branchExp };
  if (data.taps !== undefined) state.taps = data.taps;
  if (data.freeXP !== undefined) state.freeXP = data.freeXP;
  if (data.totalTaps !== undefined) state.totalTaps = data.totalTaps;
  if (data.totalFights !== undefined) state.totalFights = data.totalFights;
  if (data.totalWins !== undefined) state.totalWins = data.totalWins;
  saveProgress(state);  // also mirror to localStorage['hexlash_progression']
}
```

**Phantom dispatch site** (pre-Phase 7-pre-2): `masterService.js:19` —
```js
store.commit('progressionState/restoreProgression', userData.progression);
// effect: silent no-op (Vuex warning), namespace 'progressionState/' did not exist
```

**Intent** — when user logs in / fetches /me, copy ALL trainer progression fields (taps, freeXP, branchExp, moves, totalTaps, totalFights, totalWins) from `userData.progression` JSON blob into Vuex store + mirror to `localStorage['hexlash_progression']`.

### Function 2 — `restoreDeck` (mutation)

```js
restoreDeck(state, deck) {
  if (Array.isArray(deck) && deck.length > 0) {
    state.deck = deck;
    saveProgress(state);  // mirror to localStorage
  }
}
```

**Phantom dispatch site** (pre-Phase 7-pre-2): `masterService.js:28` —
```js
if (userData.deck) {
  store.commit('progressionState/restoreDeck', userData.deck);
  // silent no-op, namespace 'progressionState/' did not exist
}
```

**Intent** — on login, copy `User.deck` JSON array (legacy user-level deck) into `progressionState.deck` Vuex field + mirror to localStorage.

### Function 3 — `syncProgression` (action)

```js
syncProgression({ state, rootState }) {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await apiClient.put('/user/progression', {
        progression: {
          moves: state.moves,
          branchExp: state.branchExp,
          taps: state.taps,
          freeXP: state.freeXP,
          totalTaps: state.totalTaps,
          totalFights: state.totalFights,
          totalWins: state.totalWins,
          playerModules: rootState.fight?.playerModules || null,
        },
        deck: state.deck,
      }, { authRequired: true });
    } catch (error) {
      console.error('[SYNC] Failed to save progression:', error);
    }
  }, 3000);
}
```

**Phantom dispatch site** (pre-Phase 7-pre-2): `cardFightState.js:215` inside `setPlayerModules` action body —
```js
setPlayerModules({ commit, dispatch }, modules) {
  commit('setPlayerModules', modules);
  localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
  dispatch('progressionState/syncProgression', null, { root: true });
  // silent no-op, namespace 'progressionState/' did not exist
}
```

**Intent** — whenever user changes their selected modules (via `ModuleBuilder` on `PreparationView`), schedule a 3-second debounced PUT to `/v1/user/progression` to persist:
- all trainer progression (taps, freeXP, branchExp, moves, totalTaps, totalFights, totalWins)
- player modules (3 archetype choices)
- deck

to the server. Failure was silently logged to console.

### Context — When did the silent failure start?

`git log -S "syncProgression"` returns 7 commits, all in 2026-04-17 → 2026-05-15 range. The namespace mismatch (`progressionState/` vs `progression`) appears to have been present from at least the migration to v2 sometime in Эпик 5–6 era (exact commit not pinpointed in this audit — would require deeper `git blame` archaeology). What is certain: at the time of `bee213b` (2026-05-15, Phase 7-pre-2 Part B), all three sites were silent no-ops and had been so for a non-trivial period.

---

## Gap analysis

For each of the three deleted intents — is there a current mechanism that achieves the same outcome?

### Intent A — Restore taps/freeXP/branchExp/moves/totalTaps/totalFights/totalWins on login

| Sub-field | Currently restored? | Via what mechanism |
|---|---|---|
| `taps` | **N/A (semantic shift)** — User-level "current taps" concept retired with `progressionState`. The currency-style `totalTaps` (lifetime) is what's used now. | `master.userData.totalTaps` direct from /me [confirmed] |
| `freeXP` | **NO** — was a per-User unallocated XP pool. Migration moved XP to per-agent (`AgentProgression.speedXp/powerXp/techniqueXp`). No equivalent "free pool" exists on User any more. | none [confirmed] — but `freeXP` itself appears to be a retired concept, not a gap |
| `branchExp` | **NO at User level** — but **YES at agent level** via `AgentProgression.{speedXp,powerXp,techniqueXp}` reached through `agent/fetchAgent`. | per-agent restore [confirmed] |
| `moves` (legacy User-level move tree) | **NO at User level** — replaced by `AgentProgression.research` (per-agent). Migration copied old User moves to Fighter #1 once. | per-agent restore [confirmed] |
| `totalTaps` | **YES** — but via direct `User.totalTaps` scalar field on /me, not via `progression` JSON blob. The `progression.totalTaps` sub-field was an unused duplicate. | scalar field path [confirmed] |
| `totalFights` | **YES** — via `User.totalFights` scalar field on /me. `progression.totalFights` was duplicate. | scalar path [confirmed] |
| `totalWins` | **YES** — via `User.wins` scalar field. `progression.totalWins` was duplicate. | scalar path [confirmed] |
| `playerModules` (3 archetype choices, User-level) | **PARTIALLY** — read from `userData.progression.playerModules` by live `restoreProgressionFromServer` (`masterService.js:19-31`), commits to `fight/setPlayerModules`, writes to `localStorage['hexlash_player_modules']`. **BUT** since nothing writes back to `User.progression.playerModules` any more (Intent C is broken), the backend value is frozen at migration time and grows stale. | partial — read works, but reads stale data [confirmed] |

**Conclusion for Intent A**: most of the original payload was either duplicated by scalar fields (totalTaps, totalFights, totalWins → fine) or shifted to per-agent ownership (moves, branchExp → covered by AgentProgression chain). The narrow remainder — `freeXP` — was a retired concept. **No real functional gap from Intent A's loss, except for `playerModules`** which depends on Intent C.

### Intent B — Restore deck on login

`User.deck` Json is returned by /me but **has zero current consumers in FE**. The retired `progressionState.deck` getter was the only reader. Modern deck handling is **per-agent** via `AgentProgression.deck` (lookup via `agent/fetchAgent`).

**Conclusion**: no functional gap. `User.deck` is shadow-dead data on the backend. [confirmed].

### Intent C — Sync to backend after ModuleBuilder change

The dispatch was triggered from `cardFightState.setPlayerModules` action — called by `ModuleBuilder.vue:191` (`store.dispatch('fight/setPlayerModules', newModules)`) when the user picks archetypes on `PreparationView`.

**Current state after retire**: the action now only commits to Vuex + writes to `localStorage['hexlash_player_modules']`. **No backend sync.**

**User-visible consequences:**

1. **In-session**: changes work fine (Vuex reactive + localStorage mirror).
2. **Reload same browser**: changes restore from `localStorage['hexlash_player_modules']` via `cardFightState.loadModules` action on mount. **OK.**
3. **Logout**: `masterService.logout` → `masterState.clearAuthData` mutation → `localStorage.removeItem('selectedSkin')` and `masterService.js:367 localStorage.clear()` is called from some path (need verification of exact trigger). If `localStorage.clear()` fires, `hexlash_player_modules` is wiped.
4. **Re-login**: `restoreProgressionFromServer` reads `userData.progression.playerModules` (whatever value is frozen on backend) → re-populates Vuex + localStorage. **Result**: user's most recent ModuleBuilder choice is LOST; they see the value last written to backend (likely migration-time default or `['predator', 'analyst', 'ghost']` baseline).
5. **Device switch**: same as case 4 — chosen modules lost.

**BUT — crucial caveat**: `cardFightState.startFight` action (`cardFightState.js:218-278`) is the entry point for actual combat. **It explicitly overwrites `playerModules` with the Captain Agent's modules** (line 226: `const captainModules = [captain.primaryModule, captain.secondaryModule, captain.tertiaryModule]`; line 230: `commit('setPlayerModules', captainModules)`). The downstream router push goes to `/fight` which redirects to `/play/fight` (v2 Fight). V2 fight uses these captain-derived modules.

This means **ModuleBuilder selection on `PreparationView` is functionally shadowed by captain selection in actual combat**. The user-facing UI lets the user choose modules, but the choice has no effect on combat (Captain Agent modules drive everything). The only places where User-level `playerModules` is actually read in code are:
- `ModuleBuilder.vue:92` (display of current selection in build UI)
- `cardFightState` state initial value + `loadModules` action + `setPlayerModules` action

The ModuleBuilder selection therefore appears to be **dead UI** — it renders state, allows mutations, but the mutations have no real downstream consumer beyond their own UI display state.

**Conclusion for Intent C**: there IS a real persistence gap (User-level playerModules don't survive logout/device-switch), but the data being lost has **no observable gameplay effect** because Captain Agent modules override at fight start. The gap is **cosmetic at most** — user might be confused on next login to see `['predator', 'analyst', 'ghost']` default in ModuleBuilder UI instead of their last edit. Possibly not even cosmetic, if no one actually navigates to v1 `/arena/fight` PreparationView any more in normal flow. (See open questions.)

---

## Production reality

**Deferred — owner manual smoke required.** Investigation harness has no production DB / live test environment access. The behavior described above is inferred from static code reading. Recommended smoke (in priority order):

1. **Test the "shadowed module" claim** — on test environment:
   - log in as a test user
   - navigate to `/arena/fight` (PreparationView)
   - change modules in ModuleBuilder
   - click "Start fight"
   - observe: in actual combat (V2Fight), which modules drive the fighter's behavior? Captain's, or the ones picked in ModuleBuilder?
   - if Captain's → confirms Intent C gap is cosmetic only
   - if ModuleBuilder's → contradicts code reading, restore is functionally critical

2. **Test persistence loss** — on test environment:
   - log in, change modules in ModuleBuilder, observe localStorage `hexlash_player_modules` updated
   - log out, log back in
   - observe: are the changes persisted (visible in ModuleBuilder)? Expected: NO, default re-loads.

3. **Test stale-restore claim** — query backend test DB:
   - inspect `User.progression.playerModules` value for an active production user → matches their migration-time value? If yes, confirms backend is frozen at migration.

4. **Test reachability** — survey of how users access `PreparationView`:
   - is `/arena/fight` linked from anywhere in the v2 UI? Audit reveals `AgentCard.vue:79` (`goToFight = () => router.push('/arena/fight')`) is in the modern v2 club roster. So yes, real users do reach PreparationView.
   - but they fight via captain, not via the ModuleBuilder selection on PreparationView. Smoke can confirm.

---

## Cross-cutting findings

Items surfaced during this investigation, beyond the immediate three intents:

### F1. Backend `PUT /v1/user/progression` endpoint is orphan

`backend/src/routes/user.js:511-563` accepts taps/freeXP/totalTaps/deck/playerModules, strips moves+branchExp (commented as "now per-agent"), and writes to `User.progression` + `User.deck`. **Zero frontend callers** — `grep -rn "user/progression"` and `grep -rn "/progression'" src/` both return zero hits. The endpoint can be retired in a follow-up cleanup if no restore decision is made.

### F2. `User.progression` Json blob has only 2 writers, both one-shot

- `userMigrationService` — one-time per user, copies pre-migration value into Fighter #1
- `retirementService` — sets `retired: true` flag on retirement

Neither updates `playerModules`. So once Fighter #1 is created, `User.progression.playerModules` is **frozen forever** at whatever value was there at migration time.

### F3. Parking item #9 (review `startFight` progression dependency) — linked

`bee213b` commit message and Phase 7-pre-2 Part B report explicitly flag this:

> Cascade fix (Lesson #11 — would have crashed runtime):
> - cardFightState.js startFight: `rootState.progression || {}` nil-check added — after progression module retire, rootState.progression is undefined; buildPlayerFighter() was dereferencing .deck. Inline fallback to empty {} (buildPlayerFighter already handles empty defaults).

The defensive `|| {}` at `cardFightState.js:244` papers over the fact that `startFight` no longer has any real progression data to feed into `buildPlayerFighter`. `buildPlayerFighter(progressionState={}, captainModules)` returns `{ deck: [], cardLevels: {}, modules: captainModules, unlockedCards: [] }`. The `calculatePowerRating` call that follows therefore uses empty deck → power rating depends only on the modules array. This may be intentional (modules-based scaling for opponent generation) or a hidden behavior change masked by the nil-check.

**Connection**: if Intent C were restored AND the User-level deck were also restored (Intent B), `buildPlayerFighter` would have real data to work with. But since modern v2 combat uses Captain Agent's deck (line 224: `const captainDeck = Array.isArray(captainProg.deck) ? captainProg.deck : []`), the path through `buildPlayerFighter` may itself be dead/dying.

### F4. `localStorage.clear()` at `masterService.js:367` — needs verification

A `localStorage.clear()` call exists in `masterService.js`. Did not trace exact trigger in this audit; it's worth confirming the trigger (full logout? partial? error path?) when deciding on persistence strategy. Wide-blast `clear()` is the worst-case for any localStorage-only persistence claim.

### F5. Migration-time playerModules default

For users who registered AFTER P1-migration was active but never set modules explicitly, `User.progression.playerModules` would be either `null` or whatever default the migration extracted. `migrationHelpers.extractModules` (`migrationHelpers.js:30`) returns the array if valid, else fallback. Worth confirming the exact fallback for "fresh user, never opened ModuleBuilder" case.

### F6. Task progress + tutorial state — out of scope per ТЗ

CLAUDE.md mentions `UserDailyTask`, `UserSocialTask` models. Phase 5K (Daily Tasks backend) and Phase 6 (v1 training fragment retire) covered this. Not investigated here — flagged "связь с #11 (Phase 11 task-language retire candidate), не scope investigation".

### F7. Methodological note (from `bee213b` commit body, preserved)

> Future Phase 0 audits should grep all `commit('X/...')` / `dispatch('X/...')` patterns vs the set of registered Vuex namespaces. Cheap check, catches silent-failure-class bugs.

Sample bash:
```bash
# Build set of registered namespaces
grep -oP "(?<=^import )\w+(?= from)" src/core/state/store.js | sort -u

# Find all dispatch/commit namespace prefixes
grep -rohP "(commit|dispatch)\(['\"]\K[a-zA-Z]+(?=/)" src/ --include="*.js" --include="*.vue" | sort -u

# Diff manually
```

---

## Factors for owner decision

**No retire / restore recommendation here per ТЗ.** Only factors:

### If you decide "gap is real, restore"

What "full restore" would entail:

1. **Re-implement `syncProgression` action** under correct live namespace, OR add it to an existing module (e.g., `master/` or `cardFight/`). Body: debounced (3s) PUT to `/v1/user/progression` with `{ progression: { playerModules: rootState.fight.playerModules }, deck: rootState.fight.playerDeck }` (note: minus the retired moves/branchExp).
2. **Wire dispatch back into `cardFightState.setPlayerModules` action** (live entry point already exists from ModuleBuilder).
3. **Decide deck scope**: do you want User-level deck to come back? If yes, need new owner + Vuex state for User-level deck (current code has it nowhere). If no, omit deck from sync payload.
4. **Decide moves/branchExp**: backend endpoint strips them already (`user.js:522`), so even if FE sent them, they'd be ignored. This is fine.
5. **Smoke test** to verify modules survive logout / device-switch cycle.

Scope estimate: ~1 small sub-epic (1-3 commits), no schema change, low risk.

### If you decide "gap is not real, vestigial"

What "permanently close parking item #8" would entail:

1. **Retire orphan endpoint** `PUT /v1/user/progression` (`backend/src/routes/user.js:511-563`) — single endpoint, ~50 lines, plus its imports.
2. **Retire orphan fields** `User.deck` (Json, zero readers) and `User.progression.playerModules` write paths. Schema migration to drop `User.deck` column. `User.progression` blob retained for retirement marker.
3. **Retire `formatUserResponse` exposure** of `progression` + `deck` (helpers.js:50-51). Public response doesn't include them already (`formatUserPublicResponse`).
4. **Retire `restoreProgressionFromServer` playerModules block** + the `cardFightState.loadModules` action body that depends on `hexlash_player_modules` localStorage. If ModuleBuilder is also dead UI (smoke step 1+4 confirms), retire `ModuleBuilder.vue` + the v1 PreparationView module section entirely. Possibly entire v1 `/arena/fight` route given that v2 fight is captain-driven.

Scope estimate: 1 medium sub-epic (5-10 commits, 1 backend schema migration). Higher cleanup value but more touch points. Aligns with the v1 PreparationView retire question (currently deferred in CLAUDE.md §"Эпик 6 Sub-epic 8" carry-over).

### If you decide "partial restore — only player modules"

Hybrid:

1. Restore Intent C narrowly: sync **only** playerModules (not deck, not stale fields).
2. Backend endpoint keeps existing shape — strips moves/branchExp anyway; could narrow it further to playerModules-only.
3. Decide whether to also retire `User.deck` separately.

Scope: smaller than full restore, similar risk.

### Hidden risks to weigh

- **`buildPlayerFighter` dependency** (parking #9): if you restore Intent A in full (taps/freeXP/etc), revisit whether `startFight`'s `progressionState = rootState.progression || {}` should be tightened back to real data. If you don't restore but parking #9 isn't addressed separately, the nil-fallback masks a behavior question.
- **Multi-device sync expectations**: if product intent is "module choice should sync across devices like captain selection", full restore is needed. If product intent is "modules are an in-session ephemeral fight setup", retire is appropriate.
- **`localStorage.clear()` at `masterService.js:367`** (F4): if this is called more aggressively than logout-only, the localStorage mirror is even weaker than analyzed. Worth confirming before betting on localStorage as the persistence layer.

---

## Open questions

1. **Reachability of v1 `PreparationView`** — confirmed code paths reach it from `AgentCard.vue:79` (modern v2 FightClub). Is this a deliberate route, or transitional? CLAUDE.md notes `PreparationView` retire is deferred to "Эпик 7+ Phase C". This investigation cannot answer whether the deferred retire is just-not-yet-done or specifically held back.
2. **Captain-shadow claim** — smoke test required (production reality §1). If `ModuleBuilder` selection DOES affect combat (contrary to code reading), Intent C gap is functional not cosmetic.
3. **Exact `localStorage.clear()` trigger path** — at `masterService.js:367`. Reading this line + context will clarify F4.
4. **Per-fresh-user state of `User.progression.playerModules`** — F5. What does a brand-new user (post-P1-migration era) see on first login if they never opened ModuleBuilder? `null`? `['predator','analyst','ghost']`? Affects severity of "frozen at migration" claim.
5. **Was there a working version pre-Phase 7-pre-2?** — Yes, but only briefly: the namespace mismatch made the dispatches no-ops the entire time. There is no commit history evidence that the wrong namespace ever worked. The functional intent (sync to backend) appears to have been broken from at least the point the wrong namespace was introduced (not pinpointed in this audit; suggest `git log -S "progressionState/restoreProgression" --reverse` for earliest occurrence if needed).

---

## Appendix: git evidence + grep results

### A.1 — Phase 7-pre-2 Part B commit summary

```
$ git show --stat bee213b | head
commit bee213bfe2a05cc7e0af72287efcc3808dbadd3f
Author: Claude <noreply@anthropic.com>
Date:   Fri May 15 07:38:21 2026 +0000

    feat(legacy-cleanup): Phase 7-pre-2 Part B — Vuex module + service-layer retirement
```

Files touched related to progression: `src/core/state/modules/progressionState.js` (deleted), `src/core/state/store.js` (import drop), `src/core/services/masterService.js` (phantom commits drop + comment refresh), `src/core/state/modules/cardFightState.js` (phantom dispatch drop + nil-check add).

### A.2 — Phantom dispatch sites (pre-retire)

```
masterService.js:19  store.commit('progressionState/restoreProgression', userData.progression);
masterService.js:28  store.commit('progressionState/restoreDeck', userData.deck);
cardFightState.js:215 dispatch('progressionState/syncProgression', null, { root: true });
```

All three target namespace `progressionState/` which was never registered (real namespace was `progression`). Vuex logs a warning, returns no-op.

### A.3 — Current state confirmations

```
$ grep -rn "user/progression" src/
(no output)
```
→ confirmed zero frontend callers of `PUT /v1/user/progression`.

```
$ grep -rn "progressionState/\|'progression/" src/
(no output, except deliberate doc-comment per bee213b)
```
→ confirmed both broken namespace and live namespace fully retired from FE.

```
$ grep -rn "playerModules" src/ --include="*.js" --include="*.vue"
[live] ModuleBuilder.vue:191 — store.dispatch('fight/setPlayerModules', newModules)
[live] masterService.js:25 — store.commit('fight/setPlayerModules', userData.progression.playerModules)
[live] masterService.js:26 — localStorage.setItem('hexlash_player_modules', JSON.stringify(...))
[live] cardFightState.js:* — multiple read/write sites in actions + getters + state
[live] powerRating.js:135 — buildPlayerFighter signature
```

### A.4 — Backend write paths to `User.progression`

```
$ grep -rn "data: { progression\|progression: " backend/src/ | grep -v "test\|formatUser"
backend/src/services/userMigrationService.js:94  data: { progression: updatedProgression }  // one-time migration
backend/src/services/retirementService.js:119    data: { progression: updatedProgression }  // retire marker
backend/src/routes/user.js:533                   data.progression = { ...existing, ...safeProgression, ... }  // orphan endpoint
```

Endpoint at `user.js:533` is the only one that COULD write `playerModules`, but it has no callers. The other two never touch `playerModules` field.

### A.5 — Phase 7-pre-2 Part A audit confirming the silent failures

From `docs/legacy-cleanup/PHASE7_PRE_2_PART_A_REPORT.md` §B.1:

> **Lesson #11 catch — wrong-namespace dead writes:**
> 3 commit/dispatch sites in `src/` reference namespace `progressionState/` — which **DOES NOT EXIST** in the Vuex store. Actual registered namespace is `progression` (per `store.js:27`). These are silent no-ops (Vuex logs warning).

> **Implication:** `restoreProgression` + `restoreDeck` mutations were already orphan even before Part B started — the "callers" never actually called them. Same for `syncProgression` — its dispatch from `cardFightState.js:215` was already broken.

### A.6 — Connection to parking item #9

From `bee213b` commit body:

> Cascade fix (Lesson #11 — would have crashed runtime):
> - cardFightState.js startFight: `rootState.progression || {}` nil-check added — after progression module retire, rootState.progression is undefined; buildPlayerFighter() was dereferencing .deck.

Currently at `cardFightState.js:244`:

```js
// Calculate power for opponent scaling.
// Phase 7-pre-2 Part B cascade: progression module retired, so
// rootState.progression is undefined. buildPlayerFighter handles
// empty {} via its own defaults (.deck || [], .moves || {}).
const progressionState = rootState.progression || {};
```

### A.7 — Modern per-agent progression chain (the "alternative" that exists)

Backend write paths (live, working):
- `agentFightService.js:121/356/360` — `agentProgression.update` on fight conclusion
- `researchGateService.js:150/425` — research learn/upgrade + tap decrement
- `agent.js` routes — full CRUD via `POST /agent/create`, `PUT /agent/:id`, `PUT /agent/:id/deck`, `POST /agent/:id/research`

Frontend reads (live, working):
- `agentState.fetchAgents` — populate roster
- `agentState.fetchAgent` — populate `currentAgent`
- `ResearchTree.vue:160` — read agent research
- `agentState.updateAgentDeck` — write deck via API
- `agentState.fetchAvailableMoves` — read move tree

This is the active, healthy progression system. The dead User-level chain documented above co-exists alongside this and is fully shadowed by it for combat purposes.

---

**End of report.**
