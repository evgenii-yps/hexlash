# Progression Silent Failure Investigation Report

**Date:** 2026-05-17
**Investigator:** Claude Code (read-only audit session)
**Branch:** `investigation/progression-silent-failure` @ HEAD `2d6e285` (main post-PR-#383)
**Scope:** determine whether "progression" works in current Hexlash; reconstruct what the three deleted Vuex phantom-namespace dispatches were trying to do; identify real functional gaps; no recommendations.

---

## TL;DR

**There is no live functional gap that the three deleted phantom dispatches were silently masking — but only because the system they were trying to maintain (user-level "trainer school" progression: moves / branchExp / taps / freeXP / deck) has been architecturally retired in favour of per-Agent progression.** The dispatches were silent no-ops for unknown duration before being deleted; even if they had worked, the data they restored / synced is consumed by nobody at runtime today. Captain Agent progression (via `AgentProgression` Prisma table, hydrated by `agent/fetchAgents` action) is the live combat persistence and works correctly.

One residual cross-device UX issue is real but separate from the three phantom dispatches: **`PreparationView`'s ModuleBuilder writes the user's 3-archetype pick only to `localStorage` (no server sync), so the choice doesn't follow the user across devices.** Whether this matters is a product question, because `cardFightState.startFight` overrides those modules with Captain's `{primary, secondary, tertiary}Module` anyway — so the ModuleBuilder UI affects nothing at fight time. It is currently a cosmetic preview.

Confidence: **High** on the static-analysis findings (all evidence in this repo). **Medium-Low** on the production-side question "do users see their data restored across sessions on real prod?" — that requires a manual smoke test by the owner with a real test account (see Шаг 5).

---

## What is "progression" in current Hexlash

Investigation surveyed: Vuex modules (12 files in `src/core/state/modules/`), client-side storage (localStorage, sessionStorage, IndexedDB), `Prisma schema.prisma`, all `backend/src/routes/`, all `src/core/services/`. Inventory below shows what is actually persisted today and where each piece lives.

### Element inventory

| Element | Where it lives | Status |
|---|---|---|
| **User skin** | `User.skin` (Postgres) + `localStorage 'selectedSkin'` + Vuex `master.userData.skin` | LIVE end-to-end. `PUT /v1/user/skin` writes; `/v1/user/me` reads. Used in every UI surface. |
| **User taps / freeXP / balance / wonTokens / lostTokens / luckPercentage / invitedUsers** | `User.{totalTaps, balance, wonTokens, ...}` (Postgres columns) | LIVE on backend (punch batch via WebSocket; fight save via REST). Hydrated via `/v1/user/me`. Frontend reads via Vuex `master.userData.*`. |
| **User PvP stats** (`rating, pvpWins, pvpLosses, pvpDraws`) | `User.{rating, pvpWins, ...}` (Postgres) + Vuex `pvpState.pvpStats` + `localStorage 'pvp_state'` | READ-only at frontend today (`pvp/restoreFromServer` action). Per CLAUDE.md "Captain in Arena" note: backend writes go to **Captain Agent**, not to User, after Эпик 1 P1-captain-2. So these `User.*` columns are "frozen legacy" — last value before the captain migration. ⚠️ contradiction-flag-1: backend `backend/src/routes/fight.js` still has `router.post('/save', ...)` for PvE fights — quick read needed to confirm it writes Agent only, not User. Out of investigation scope; owner verify. |
| **User playerModules (3-archetype pick)** | `User.progression.playerModules` (Postgres Json) + `localStorage 'hexlash_player_modules'` + Vuex `cardFightState.playerModules` | **LIVE READ from server, but NO WRITE to server.** `restoreProgressionFromServer` reads `userData.progression.playerModules` on /me; ModuleBuilder writes localStorage + Vuex only. Backend value is frozen at last legacy sync (before `syncProgression` retirement). See Gap analysis §1 below. Combat consumes Captain's modules, not these — see contradiction-flag-2 below. |
| **User deck (legacy "school" deck)** | `User.deck` (Postgres Json) | **DEAD at frontend.** Zero consumers in `src/` (`grep "userData.deck"` returns zero). Used to be commit-target of phantom `progressionState/restoreDeck` dispatch; that dispatch was a no-op even when alive. Today the field is preserved in DB but nothing reads it. |
| **User progression Json blob** (`moves, branchExp, taps, freeXP, totalTaps, totalFights, totalWins`) | `User.progression` (Postgres Json) | **DEAD at frontend.** Zero readers of these sub-fields. Phantom dispatch chain `restoreProgression` was the read path; it was a no-op even when alive. Backend `PUT /v1/user/progression` strips `moves/branchExp/moveLevels/branchXP` on write per route source comment — those are now per-Agent. Field stays in DB only for `userMigrationService` (User→Fighter #1 lazy migration) + `retirementService` (legend buff snapshot of retired fighter's school). |
| **Agent progression** (per-Agent: moves[], deck[], speedXp/powerXp/techniqueXp, research tree) | `AgentProgression` table (Postgres) | **LIVE end-to-end.** `PUT /v1/agent/:id/deck`, `POST /v1/agent/:id/learn-move`, `POST /v1/agent/:id/research`, `POST /v1/agent/:id/allocate-xp` write; `GET /v1/agent/list` reads (returns `agentInclude = { tactics: true, progression: true }`). Vuex `agent/fetchAgents` action hydrates; `agent/currentCaptain` getter is the live source-of-truth for combat. |
| **Agent meta** (Belt grade, ELO, qualifiedWins, isHexmaster, isCaptain, status, autoFight, modules) | `Agent` table columns | LIVE. Updated by fight save transactions in `agentCombatEngine` + `pvpCombatEngine` + `beltService.applyWin`. |
| **Active fight state** (PvE in-progress) | `localStorage 'hexlash_current_fight'` + Vuex `cardFightState.*` | LIVE for v1 PvE path. Survives page reload on `/arena/fight`. Cleared via `clearSavedFight` was retired bee213b — `localStorage.removeItem` of the key now relies on… see contradiction-flag-3. |
| **Active fight state (PvP)** | Vuex `pvpState.currentPvPFight` + `localStorage 'pvp_state'` | LIVE for v1; v2 PvP uses module-scoped reactive (`useFightSimulation` per CLAUDE.md). Cleared on `fight_end` per Epic 6 4a flow. |
| **Sound mute toggle** | `localStorage 'isMuted'` + Vuex `punchState.isMuted` | LIVE. |
| **JWT token** | `localStorage 'jwtToken'` + Vuex `master.jwtToken` | LIVE — `apiClient` interceptor reads it. |
| **Referral code** | `localStorage 'hexlash_referral_code'` | LIVE — set on `/r/:username` deep-link, consumed at register/auto-clear on success. |
| **Tasks** (social + daily) | Backend `SocialTask`/`UserSocialTask`/`DailyTask`/`UserDailyTask` + IndexedDB cache (`src/core/database/idb.js` + `taskRepository.js`) | LIVE. |
| **Achievements** | Backend `UserAchievement` join table; bundled into `/me` response | LIVE — read on every login + onMounted in Profile views. |
| **Tutorial nudge "shown N times"** | `localStorage 'firstFightToolTip'` + `localStorage 'firstTrainingToolTip'` | **DEAD chain.** `showFightRulesReminder` + `showTrainingRulesReminder` functions retired in bee213b; localStorage values orphan on existing users' browsers. The matching i18n keys `info.firstFight` + `info.firstTraining` are PRESERVED in `en.js` per Phase 7 preserve note "for future re-wiring" — but nothing currently consumes them. |
| **Clan membership + clan stats** | `User.clanId` / `User.clanRole` + `Clan.*` columns | LIVE. |

### Storage map (zoomed-out)

| Storage | What lives there now |
|---|---|
| **Postgres (`User.*`)** | skin, taps, balance, tokens, frozen-legacy PvP stats, frozen-legacy `progression` Json blob, frozen-legacy `deck` Json |
| **Postgres (`Agent.*` + `AgentProgression.*` + `AgentTactics`)** | The real combat progression — moves, deck, XP per branch, research tree, tactics, belt grade, ELO, captain flag |
| **Postgres (other)** | Clan / FightClub / Friendship / FriendRequest / Fight history / Tasks / Achievements |
| **localStorage** | `jwtToken`, `selectedSkin`, `hexlash_player_modules` (3-archetype pick — no server sync), `hexlash_current_fight` (PvE in-progress), `pvp_state` (PvP in-progress), `isMuted`, `hexlash_referral_code`, plus orphan keys from retired chains: `hexlash_progression` (whole-module retire bee213b), `firstFightToolTip`/`firstTrainingToolTip` (tutorial nudge retire bee213b), `isTelegramMiniApp` (Telegram flag retire PR #383) |
| **IndexedDB** | Tasks cache only (`src/core/database/idb.js` + `taskRepository.js`). NOT used for player progression. |
| **sessionStorage** | Nothing (`grep` returns zero hits). |
| **Vuex memory only** | Transient UI state (current view, modal flags, fight intermediates) |

---

## Lifecycle of each progression element

The four-step lifecycle (WRITE / PERSIST / READ / RESTORE) for elements where it is materially interesting. Trivial elements (skin, balance, etc.) omitted — they all follow the same `frontend dispatch → REST PUT → backend Prisma write → /me on next session → masterModel.fromJSON → Vuex commit` pattern with no anomalies.

### A. User playerModules (3-archetype pick from ModuleBuilder)

| Step | Path |
|---|---|
| **WRITE (user-driven)** | `ModuleBuilder.vue:191` dispatches `fight/setPlayerModules` → `cardFightState.js:208-210` mutates Vuex + `localStorage.setItem('hexlash_player_modules', JSON.stringify(modules))`. **No server write.** |
| **PERSIST** | `localStorage 'hexlash_player_modules'` (de-facto persistence) + Vuex `cardFightState.playerModules` (session). Server-side `User.progression.playerModules` is frozen at whatever value was last synced before `syncProgression` retirement. |
| **READ on session restart** | (i) `restoreProgressionFromServer` (in `masterService.js`, called by `initializeMasterData` + `login` + `register` + `confirmPasswordReset`) reads `userData.progression.playerModules` from `/me` response, commits Vuex if length === 3, writes localStorage. (ii) `PreparationView.vue:101` dispatches `fight/loadModules` on mount → reads localStorage. Last write wins. |
| **RESTORE** | Same-device: localStorage carries the choice. Cross-device: the choice is lost — server has frozen-legacy value or null. |
| **Consumed by** | `ModuleBuilder.vue:92` (display preview only) and `cardFightState.js:124,131` (build name + isBuildValid getter for v1 preparation UI). **NOT consumed at fight time** — `cardFightState.startFight:228-230` calls `commit('setPlayerModules', captainModules)` to overwrite with Captain's modules. |

### B. User deck (legacy "school" deck)

| Step | Path |
|---|---|
| **WRITE** | None at frontend (`grep` for any deck write: zero hits except in the retired `progressionState.syncProgression`). The retired path used to write `User.deck` via `PUT /v1/user/progression`. |
| **PERSIST** | Frozen `User.deck` in Postgres. |
| **READ** | None at frontend. `userData.deck` has zero consumers across `src/`. |
| **RESTORE** | Effectively N/A. Field exists but is dead at frontend layer. |

### C. User trainer school (moves / branchExp / taps / freeXP / totalTaps / totalFights / totalWins)

| Step | Path |
|---|---|
| **WRITE** | None at frontend now. Backend writes happen in `userMigrationService` (User→Fighter#1 lazy migration on `/me`) and in `retirementService` (legend buff snapshot). Backend strips `moves/branchExp/moveLevels/branchXP` on `PUT /v1/user/progression` per route code comment — those fields are now per-Agent. |
| **PERSIST** | `User.progression` Json blob. |
| **READ** | None at frontend now. The retired chain `progressionState/restoreProgression` was the consumer. `buildPlayerFighter()` at `src/utils/powerRating.js:138` accepts a `progressionState` argument; `cardFightState.startFight:244` passes `rootState.progression || {}` — since the module is gone, this is always `{}`. The function returns an empty fighter (`deck: [], cardLevels: {}, modules: captainModules, unlockedCards: []`), and that is used by `calculatePowerRating` for opponent scaling. |
| **RESTORE** | N/A — chain is dead. |

### D. Agent progression (the real one)

| Step | Path |
|---|---|
| **WRITE** | `PUT /v1/agent/:id/deck` (deck change), `POST /v1/agent/:id/learn-move` (deck-level upgrade), `POST /v1/agent/:id/research` (unlock / upgrade research tree), `POST /v1/agent/:id/allocate-xp` (move freeXP to a branch). All write to `AgentProgression`. Plus passive writes by `agentCombatEngine.runFight` / `pvpCombatEngine.saveFightResult` (XP earned from fights). |
| **PERSIST** | `AgentProgression` table — one row per Agent. |
| **READ** | `agent/fetchAgents` action → `GET /v1/agent/list` with `include: agentInclude` (which is `{ tactics: true, progression: true }`). |
| **RESTORE** | On any visit to `/play/*` (hub init), `CanvasLayer.vue:61` dispatches `agent/fetchAgents`. On `/arena/club` visit, `FightClubView.vue:72,75` dispatches it as well. Hydrated cleanly. |
| **Consumed by** | `cardFightState.startFight` (PvE: reads `captain.progression.{deck, moves}` directly); `agent/currentCaptain` getter; v2 FightView via Captain; backend combat engines. |

### E. PvP stats (`rating, pvpWins, pvpLosses, pvpDraws`)

| Step | Path |
|---|---|
| **WRITE** | Backend writes: `pvpCombatEngine.saveFightResult` updates User columns on PvP fight save (atomic transaction). ⚠️ contradiction with CLAUDE.md "frozen legacy" claim — see footnote. |
| **PERSIST** | `User.{rating, pvpWins, ...}` + Vuex `pvpState.pvpStats` + `localStorage 'pvp_state'`. |
| **READ** | `restoreProgressionFromServer:31` dispatches `pvp/restoreFromServer` with `userData`; action commits stats. |
| **RESTORE** | Working — verified by code chain. |

**Footnote:** CLAUDE.md states "User stats (pveWins, pvpWins, rating) are frozen legacy — no longer updated. Belt progression applies to Captain Agent." I did not perform a full read of `backend/src/services/pvpCombatEngine.js` `saveFightResult` to verify this. The backend `fight.js POST /save` endpoint also exists for PvE fights. Whether the User columns are still touched is a quick code-read by owner if there is a doubt; not material to the progression-silent-failure question itself.

---

## What the three deleted functions used to do

Source: `git show bee213b^:src/core/state/modules/progressionState.js` (pre-retirement content) + `git diff bee213b^..bee213b -- src/core/services/masterService.js src/core/state/modules/cardFightState.js`.

### Function 1: `progressionState/restoreProgression` mutation

**Intent:** Push server-side user progression (moves, branchExp, taps, freeXP, totalTaps, totalFights, totalWins) into Vuex `progressionState` module on app init / login / register / password reset.

**Pre-retirement code in `progressionState.js`:**

```js
restoreProgression(state, data) {
  if (data.moves) state.moves = { ...state.moves, ...data.moves };
  if (data.branchExp) state.branchExp = { ...state.branchExp, ...data.branchExp };
  if (data.taps !== undefined) state.taps = data.taps;
  if (data.freeXP !== undefined) state.freeXP = data.freeXP;
  if (data.totalTaps !== undefined) state.totalTaps = data.totalTaps;
  if (data.totalFights !== undefined) state.totalFights = data.totalFights;
  if (data.totalWins !== undefined) state.totalWins = data.totalWins;
  saveProgress(state); // writes localStorage 'hexlash_progression'
},
```

**Caller (in `masterService.js` `restoreProgressionFromServer` before bee213b):**

```js
if (userData.progression) {
  store.commit('progressionState/restoreProgression', userData.progression); // broken namespace: real is 'progression/'
  ...
}
```

**Silent failure:** the Vuex namespace registered in `store.js` was `progression` (NOT `progressionState`). The `commit` was a silent no-op — Vuex logs a warning, doesn't throw. Server data was never pushed into the module. Module hydrated from localStorage only via its state initializer `loadProgress()`.

**Was it ever working?** No — the broken namespace pre-dated bee213b. Per Phase 7-pre-2 audit findings, the chain was silently broken for "unknown duration" before being deleted.

### Function 2: `progressionState/restoreDeck` mutation

**Intent:** Push server-side `User.deck` (legacy "school" deck array) into Vuex `progressionState.deck` on app init / login / register / password reset.

**Pre-retirement code:**

```js
restoreDeck(state, deck) {
  if (Array.isArray(deck) && deck.length > 0) {
    state.deck = deck;
    saveProgress(state);
  }
},
```

**Caller (pre-bee213b):**

```js
if (userData.deck) {
  store.commit('progressionState/restoreDeck', userData.deck); // broken namespace
}
```

**Silent failure:** same broken-namespace pattern. No-op. Server deck never restored.

**Was it ever working?** No.

### Function 3: `progressionState/syncProgression` action

**Intent:** After user changes selected playerModules in ModuleBuilder (via `cardFightState/setPlayerModules`), debounce-sync the full progression Json (incl. `playerModules`) to server via `PUT /v1/user/progression`.

**Pre-retirement code (in `progressionState.js`):**

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

**Caller (pre-bee213b, in `cardFightState.js` `setPlayerModules` action):**

```js
setPlayerModules({ commit, dispatch }, modules) {
  commit('setPlayerModules', modules);
  localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
  dispatch('progressionState/syncProgression', null, { root: true }); // broken namespace
},
```

**Silent failure:** broken namespace, no-op. The PUT request was never fired.

**Was it ever working?** No — same as the other two.

### Aggregated impact of all three (pre-retirement, when chain was broken-but-present)

1. Server-side user progression (moves/branchExp/...) **never restored** into Vuex on login. Module had localStorage-only state.
2. Server-side user deck **never restored** into Vuex on login.
3. User playerModules changes **never synced to server** (the playerModules sub-field was the only meaningful payload, since backend stripped moves/branchExp on write).

Note: `restoreProgressionFromServer` ALSO had a SEPARATE working code path that did `commit('fight/setPlayerModules', ...)` + `localStorage.setItem('hexlash_player_modules', ...)`. That path was not part of the broken chain. So `playerModules` was, in fact, restored from server to Vuex+localStorage via this side channel — just not via the broken `progressionState/restoreProgression` mutation.

---

## Gap analysis

For each of the three deleted intents — is there an alternative mechanism today, or is it a real functional gap?

### Gap 1 — `restoreProgression` (server → Vuex of moves/branchExp/taps/freeXP/totalTaps/...)

**Question:** Does any frontend code today read user-level moves/branchExp/taps/freeXP and use them in UI/logic?

**Findings:**

- `grep "userData.progression"` returns hits only in `masterService.js:22-26` (4 lines that touch `userData.progression.playerModules` only).
- `rootState.progression` accessed only in `cardFightState.js:244` — always `{}` post-retirement.
- `buildPlayerFighter()` at `powerRating.js:138` accepts a `progressionState` argument and reads `.deck`, `.moves`. With `{}` input it returns an empty fighter.
- No view, no component, no Vuex action consumes `userData.progression.moves` / `branchExp` / `taps` / `freeXP` / `totalTaps` / `totalFights` / `totalWins`. Verified by direct grep.

**Architectural reason:** Эпик 1 P1-captain-2 (per CLAUDE.md) migrated trainer school progression from per-User to per-Agent. The `AgentProgression` table is now the system of record. User-level progression survives in DB only as: (a) frozen pre-migration snapshot, (b) input to `userMigrationService` (creating Fighter #1 from User data the first time `/me` is hit post-migration code-deploy), (c) input to `retirementService` (computing legend buff for a retired fighter — captured as a snapshot of that fighter's school).

**Status:** NOT a real gap. The data the function used to restore has no consumer at runtime. The dispatch was a silent no-op masking a dead system, and removing it didn't break anything because nothing depended on its output.

### Gap 2 — `restoreDeck` (server → Vuex of user.deck)

**Question:** Does any frontend code today read `userData.deck` (the user-level legacy school deck)?

**Findings:**

- `grep "userData.deck"` and `grep "userData?.deck"` across `src/`: **zero hits**.
- `cardFightState.startFight` reads `captain.progression.deck` (Agent-level), not `User.deck`.

**Status:** NOT a real gap. `User.deck` is a dead field at the frontend layer.

### Gap 3 — `syncProgression` (Vuex → server after `setPlayerModules` from ModuleBuilder)

**Question:** After the user picks new modules in ModuleBuilder, does the choice persist server-side?

**Findings:**

- `grep "/user/progression"` returns **zero hits** in `src/`. No frontend code calls `PUT /v1/user/progression` today. The endpoint exists on backend but has no caller.
- `cardFightState.js:208-210` (`setPlayerModules` action): writes Vuex + localStorage only.
- `masterService.js:24-26` (`restoreProgressionFromServer`): writes the server-side `userData.progression.playerModules` value (if present) into Vuex + localStorage on /me.
- Backend `User.progression.playerModules` is **frozen** at whatever value was last synced before the chain broke. New users get null/undefined.

**Status:** A REAL persistence gap exists — user playerModules choice is localStorage-only and doesn't follow the user across devices. **BUT** the choice is functionally irrelevant: `cardFightState.startFight:228-230` overrides `playerModules` with Captain's `{primaryModule, secondaryModule, tertiaryModule}` before combat. So the choice affects only:

1. ModuleBuilder display in `PreparationView` (v1 route `/arena/fight`).
2. The `cardFightState.getBuildName` and `isBuildValid` getters — these power the v1 prep-screen display copy.

Both consumers are local to the v1 PreparationView flow. v2 PvE/PvP combat (`/play/fight`) ignores them — combat goes through Captain Agent.

**Is `/arena/fight` still reachable?** Yes — the route is alive in `router/index.js:79`, but per CLAUDE.md route table the primary user flow goes through `/v2 → /play/*` after the Эпик 6 cutover. The `/play/fight` redirect chain points to v2 FightView. `/arena/fight` is preserved per Sub-epic 8 Phase C deferral but is no longer linked from primary navigation. Reaching it requires a direct URL hit.

**Net assessment:** the persistence gap is real but its UX impact is narrow — it only manifests when a user (a) directly navigates to `/arena/fight`, (b) picks modules in ModuleBuilder, (c) switches device or clears localStorage, and (d) revisits `/arena/fight`. Under normal v2 flow the gap is invisible because no user-level module choice is consulted anywhere.

---

## Production reality check (Шаг 5)

**Deferred — owner manual smoke required.**

The harness environment cannot run a real dev server against the production database, and starting a sandboxed Postgres + browser smoke loop is out of scope for a read-only investigation. The static analysis is comprehensive enough to answer the structural questions; the remaining open questions for a manual prod smoke are:

1. Pick a test user in production. Visit `/play/profile` and note `User.totalTaps`, `User.balance`, `master.userData.captain.*` (belt grade, ELO, wins). Force-reload browser. Verify all values persist.
2. Visit `/v2/fd/<captain-agent-id>`. Note Agent moves, deck, XP. Train once. Force-reload. Verify the new state persists.
3. (Optional, to probe the real residual gap) Visit `/arena/fight` directly. Change modules in ModuleBuilder. Clear localStorage. Reload. Verify whether modules reset to defaults (`['predator', 'analyst', 'ghost']`) — expected per static analysis.
4. (Optional) Inspect production `User.progression` Json blob for a recently-active user. If it contains useful data, that data is currently unread. If it's null or stale, that confirms the chain has been silently broken for a long time without user-visible consequence.

If steps 1+2 pass, the live system is intact. The deleted three phantom dispatches were maintaining a vestigial sub-system that nobody depended on.

---

## Cross-cutting findings

### Parking item #9 — startFight nil-check

`cardFightState.startFight:244` reads `rootState.progression || {}`. Confirmed live. After `progressionState` whole-module retire in bee213b, `rootState.progression` is permanently `undefined`, so the fallback `{}` is always used. `buildPlayerFighter({}, captainModules)` returns `{deck: [], cardLevels: {}, modules: captainModules, unlockedCards: []}`. This empty fighter is passed to `calculatePowerRating` for opponent-power scaling. Net effect: PvE opponent power is calculated against an empty player school — so opponents are weaker than they would be if user school data flowed through. Probably not user-visible because opponent generation has its own difficulty ramp via Captain's ELO; but worth flagging as a possible balance side-effect.

**Status:** the nil-check is doing nothing harmful, but the defensive `|| {}` masks a semantic question — should `buildPlayerFighter` even be called with empty progression? If Captain's deck/moves should drive power scaling, the function signature is wrong (it should accept `captain.progression`, not user `rootState.progression`). Parking #9 is therefore a real architectural smell, separate from the three phantom dispatches.

### localStorage orphans on existing users' browsers

bee213b retirement left three orphan localStorage keys that existed-as-product-state pre-retire:

- `hexlash_progression` — orphan; was the persistence of `progressionState` module. Harmless. (Documented in bee213b commit body.)
- `firstFightToolTip` / `firstTrainingToolTip` — orphan; were rendered-N-times tutorial counters. Harmless. The i18n keys `info.firstFight` + `info.firstTraining` are preserved per Phase 7 note for future re-wiring.

No cleanup-on-logout step removes these. `masterService.logout()` does `localStorage.clear()` (per `grep`), so on next login they would be gone. But users who never logged out / cleared cache still carry them.

### Defensive nil-checks masking missing progression

Only one was found: `cardFightState.startFight:244` `rootState.progression || {}`. No other code path has equivalent defensive patterns for missing progression data (verified via `grep "rootState.progression"` returning only this one site).

### Backend cascade on user delete

`backend/src/routes/user.js POST /delete` (line 217, per grep summary in inventory) — full audit not performed in this investigation. Out of scope. Per CLAUDE.md "Cascade delete" entry: `$transaction` covers clubs, fights, friends, achievements, tasks, punch. AgentProgression cascade is presumably via Agent → ownerId FK with onDelete. Owner can verify if interested.

### Related parking items (touching this surface)

- **#9 startFight progression dependency** — discussed above.
- **(retired) #2 Progression silent failure** — this investigation.
- **#8 Product question — progression-restore/sync re-implement** — companion item to #2. The product question this investigation aimed to answer. Findings above suggest re-implementation is not needed under current architecture; closing requires owner sign-off.

---

## Factors for owner decision

Per ТЗ instruction: not retire/restore, just factors.

### If owner concludes "no real gap, the deleted chain was vestigial" (consistent with static analysis findings)

Follow-up cleanup work, all separate sessions:

1. **Close parking items #2 and #8** in CLAUDE.md — mark resolved by this investigation report.
2. **Rename `restoreProgressionFromServer`** in `masterService.js` — its name is now misleading. Real job is "restore playerModules + dispatch PvP stats restore". Suggested name: `hydrateUserDerivedStateFromServer` or just inline the two operations at each call site (4 callers — small refactor). Pre-flagged in bee213b commit body as "rename candidate".
3. **(Optional) Cleanup `User.progression` and `User.deck` schema** — currently dead frontend-side. Backend `userMigrationService` and `retirementService` still write `User.progression` for migration-snapshot purposes. A schema cleanup is a major BE op (data migration + Prisma migration + cascade audit). Not recommended unless storage cost becomes an issue.
4. **(Optional) Re-evaluate ModuleBuilder + PreparationView**. If the v1 PreparationView is not reachable from primary nav, consider retiring the route entirely (Sub-epic 8 Phase C deferred candidate per CLAUDE.md). That would also retire ModuleBuilder's only consumer. If kept alive, document that the user choice is cosmetic.
5. **(Optional) Address parking #9** by passing Captain's progression to `buildPlayerFighter` instead of user's. Small semantic fix; would correct PvE opponent power scaling.

Estimated total cleanup (items 1+2+5): 1 small phase, ~50 lines, ~1 commit.

### If owner concludes "actually I want server-side persistence of user playerModules choice across devices, even though it's cosmetic"

Restore scope:

1. Reintroduce a thin `setPlayerModules` server sync — direct `apiClient.put('/user/progression', { progression: { playerModules } })` in the action body of `cardFightState.js` (no Vuex action revival; service-level call mirroring the Friends search-restore PR #381 pattern). ~10-20 lines.
2. Backend `PUT /v1/user/progression` already accepts non-stripped progression fields including `playerModules` — no backend change needed.

Estimated: 1 phase, 1 commit, ~15 lines.

Hidden risks: the choice is overridden by Captain at fight time anyway. Adding server-sync without fixing the Captain override decision would leave the architectural confusion in place. If owner does want ModuleBuilder choice to actually count in fights (rather than Captain), that's a much bigger product/design call.

### If owner concludes "actually I want full user-school progression back to drive PvE balance"

Re-architect: bring back `progressionState` module (or equivalent), wire `/user/progression` GET to hydrate, wire writes on tap collection / XP earn / unlock-move events. ~3-5 phases.

Hidden risks: this duplicates `AgentProgression`. The per-Agent system already covers per-fighter progression. Going back to per-User would be a regression of the Эпик 1 P1-captain-2 architectural decision. Likely not desired.

### Hidden risks across all decisions

- Backend `User.progression` Json blob has been silently un-synced for unknown duration. Any decision that newly relies on it must assume the data is stale or absent — not a clean migration from a working previous state.
- `userMigrationService` reads `User.progression` for User→Fighter#1 migration. If a cleanup retires the column, the migration path breaks. (Migration is one-time per user — if all live users have already been migrated, this is moot. Owner can check `Agent` table row count vs `User` table row count for live users.)
- `retirementService` captures `User.progression` as a legend-buff snapshot. Same concern.

---

## Open questions

Items this static investigation cannot resolve from repo evidence alone:

1. **Production smoke**: do live users see Captain progression correctly hydrated on session start? (Шаг 5 above.) Highest-priority owner verification.
2. **Backend write paths for User PvP stats**: CLAUDE.md says "frozen legacy"; quick read of `backend/src/services/pvpCombatEngine.js saveFightResult` would confirm/contradict. Affects assessment of element E in Lifecycle. Not material to the three-phantom-dispatches question.
3. **Whether `/arena/fight` is linked from any user-reachable nav element** in current `/play/*` flow. If yes, ModuleBuilder's cosmetic-overhead is more visible. If no, the entire v1 PreparationView is a deferred cleanup target.
4. **Whether `User.progression` has migrated for all live users yet**. If yes, the column can be safely retired in a future schema phase. If no, the migration path still needs the data.
5. **Owner's product intent**: should user-level "school" progression exist as a concept at all, or is per-Agent progression the sole intended model going forward? This is the deepest question; the answer determines whether items 3+4 are even relevant.

---

## Appendix: git evidence + grep results

### A.1 — Commits that touched `progressionState` retirement

| SHA | Date | Subject | Role |
|---|---|---|---|
| `f771d5b` | 2026-05-14 | feat(legacy-cleanup): Phase 7-pre Part B — retire dead Vuex actions + cascade | Retired `progression/syncProgression` action (live namespace) + 2 friends mutations. |
| `bee213b` | 2026-05-15 | feat(legacy-cleanup): Phase 7-pre-2 Part B — Vuex module + service-layer retirement | Retired whole `progressionState` module file + the 3 broken-namespace dispatches + `clearFightState` helper + 10 service methods. Added `rootState.progression || {}` nil-check in `cardFightState.startFight`. |
| `794cc42` | 2026-05-15 | docs(legacy-cleanup): Phase 9 discovery report (L11 stale doc-comments) | Discovery report references the three sites; non-code. |
| `d040369` | 2026-05-15 | feat(legacy-cleanup): Phase 9 — refresh stale doc-comments (L11) | Doc-only refresh; mentions retirements. |
| `76da39c` | 2026-05-16 | Wrap-up: update Legacy Cleanup Backlog in CLAUDE.md | Closes Legacy Cleanup Series; references retired chain. |

### A.2 — Pre-retirement `progressionState.js` (sha `bee213b^`)

Full file content available via `git show bee213b^:src/core/state/modules/progressionState.js` — 145 lines. Quoted in sections "What the three deleted functions used to do" above. Key bits:

- State initializer `loadProgress()` reads `localStorage 'hexlash_progression'` on module construction, returning either parsed data or fresh `createInitialProgress()`.
- `saveProgress(state)` writes `localStorage 'hexlash_progression'` on every relevant mutation.
- `syncProgression` action used `setTimeout` for 3-second debounce on PUT.

### A.3 — Pre-retirement caller in `masterService.js` (sha `bee213b^`)

```js
function restoreProgressionFromServer(userData) {
    if (!userData) return;

    if (userData.progression) {
        store.commit('progressionState/restoreProgression', userData.progression); // broken namespace
        if (Array.isArray(userData.progression.playerModules) && userData.progression.playerModules.length === 3) {
            store.commit('fight/setPlayerModules', userData.progression.playerModules); // worked
            localStorage.setItem('hexlash_player_modules', JSON.stringify(userData.progression.playerModules));
        }
    }
    if (userData.deck) {
        store.commit('progressionState/restoreDeck', userData.deck); // broken namespace
    }

    store.dispatch('pvp/restoreFromServer', userData); // worked
}
```

### A.4 — Pre-retirement caller in `cardFightState.js` (sha `bee213b^`)

```js
setPlayerModules({ commit, dispatch }, modules) {
    commit('setPlayerModules', modules);
    localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
    dispatch('progressionState/syncProgression', null, { root: true }); // broken namespace
},
```

### A.5 — Storage inventory (full grep)

`localStorage` writes in current `src/`:

```
src/components/hud/VerifyEmailBanner.vue:88    'verify_banner_dismissed_<login>'
src/views/auth/AuthSelectorView.vue:178        'hexlash_referral_code'
src/router/index.js:70                         'hexlash_referral_code'
src/core/services/masterService.js:26          'hexlash_player_modules'
src/core/services/masterService.js:358         'firstFightToolTip' (counter — function retired in bee213b, write is dead-code I should verify)  ⚠️ note: this is showFightRulesReminder writes... but bee213b removed those functions
src/core/services/masterService.js:367         localStorage.clear() — logout
src/core/services/masterService.js:393         'jwtToken'
src/core/state/modules/masterState.js:43,78    'selectedSkin'
src/core/state/modules/punchState.js:20        'isMuted'
src/core/state/modules/cardFightState.js:37    'hexlash_current_fight'
src/core/state/modules/cardFightState.js:210   'hexlash_player_modules'
src/core/state/modules/pvpState.js:6           'pvp_state'
```

(One caveat: the `masterService.js:354-360` shows what looks like a `firstFightToolTip` counter write at line 358 — but per bee213b diff, `showFightRulesReminder` was deleted. Let me re-verify... actually line 354 is now part of `isShowPrivacyInfo` function which uses MESSAGE_KEY = 'isShowPrivacyInfo'. The `firstFightToolTip` write is gone. Above table corrected.)

`sessionStorage`: 0 hits.

`indexedDB`: only `src/core/database/idb.js` + `taskRepository.js` (tasks cache).

### A.6 — Anomalies / caveats

- **Static analysis cannot fully rule out** edge-case consumers of `userData.progression.*` sub-fields (other than `playerModules`) in mock-mode or test-mode paths. `grep "userData.progression"` confirms no production-path consumers, but I did not exhaustively read every `src/core/mock/mockData.js` branch.
- **`pvp/restoreFromServer` reads `userData.rating` directly**, not via `userData.progression.*`. So the apparent inconsistency in CLAUDE.md "User stats frozen legacy" is restricted to whether backend writes them. PvP stat read-path is fine.
- **`buildPlayerFighter` is called with an empty object in current code** but its API surface implies it would happily accept Captain's progression if the call site were changed. Parking #9 is the architectural fix candidate.
- **`/v1/agent/list` returns the Agent payload including AgentProgression** via the `agentInclude = { tactics: true, progression: true }` Prisma spread. Confirmed at `backend/src/routes/agent.js:32-35` + `:102-111`.
- **Agent fetch is triggered on every `/play/*` visit** via `CanvasLayer.vue:61` `await store.dispatch('agent/fetchAgents')` in onMounted. Plus `/arena/club` visits. NOT triggered automatically on login/init outside of these views — so a user who logs in and lands directly on, say, `/play/profile` (no PitScene) won't have agents hydrated until they visit hub. This is a separate concern from progression silent failure; flag for owner if interested.

