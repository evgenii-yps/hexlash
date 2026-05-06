# EPIC 6 — Sub-Epic 5 — Final Report

**Status:** CLOSED clean ✅
**Type:** Real matchmaking — Path A pure FE wiring (BE 100% complete per Phase 0)
**Branch:** `claude/investigate-matchmaking-2JlwO` (harness fresh-slug, same SHA as continue stack — Recovery #85 adaptation-tier per Lesson #43 5th occurrence)
**Predecessor:** Sub-epic 4b ✅ CLOSED (commit `bd7ca99` CL1)
**Phase 0 report:** `EPIC6_SUBEPIC_5_PHASE_0_REPORT.md` (commit `fa8baba`)
**Closure date:** 2026-05-04

---

## TL;DR

Sub-epic 5 closes 9th Эпик 6 coverage gap (real matchmaking) с pure FE wiring sub-epic. BE matchmaking 100% pre-existing per Phase 0 — service (`matchmaking.js` 147 lines FCFS+ELO-proximity), eloService (K=32), 4 WS routing cases в `webSocketState.js`, 3s periodic re-pair tick, public `/v1/stats/online` endpoint. v2 `MatchmakingView` was mock-only (Mulberry32 RNG, hardcoded `MY_ELO=1247`); replaced с real BE handshake.

12 functional commits + 3 closure across 4 clusters: state infrastructure (C1-C3), BE wiring (C4-C7), UX bundle (C8-C10), edge case guards (C11-C12). Carry-over #17 (3-2-1 countdown UI parity gap) closed C8 via matchmaking-side post-MatchFoundMsg countdown. 5 NEW carry-overs surfaced (#29-#33 — all polish/non-functional).

**61 cumulative Lesson #11 catches pre-edit** — 4b 38-catch ceiling exceeded by 60% (consistent с Phase 0 prediction для L size + new architectural area). 1 recovery #85 adaptation-tier (bootstrap branch divergence, Lesson #43 5th occurrence). 6th Phase 0 subsection candidate occurrence #2 NOT detected through all 12 commits — pairing-symmetric flow doesn't trigger semantic invariant catches (pattern strong evidence). 0 hot-fixes, 0 reactive splits, 0 STOP-tier. **Streak 28 → 29 ✅. Эпик 6 progress 11/14 → 12/14 (86%) — past 6/7 milestone.**

---

## What user sees

### Mount /v2/matchmaking flow

1. **C11 double-queue guard:** if user already в active PvP match (pvp/getCurrentMatchId !== null), `router.replace('/v2/fight')` skip matchmaking entirely
2. **C4 captain pre-check:** if no captain, info toast "No Captain set. Create a fighter first." (3s) + `router.replace('/v2')`
3. **MatchmakingStartMsg dispatch** — Captain-authoritative ELO + skin (BE ignores client rating, uses captain.elo per Phase 0 Q3.2)
4. **searchTime timer starts** (1Hz)
5. **Online players count REST fetch** — fire-and-forget, single mount fetch (no repoll)
6. **4 WS event listeners registered** — match-found / queue-update / cancelled / timeout

### Searching phase

- 3D matchmaking scene в background (CRT terminal aesthetic preserved Sub-epic 3Bb)
- HUD overlay: spinner pulse + "SEARCHING" headline (Anonymous font 26px) + `mm:ss` timer (e.g. "00:34") + "{N} in queue · {M} online" subordinate text + "Cancel Search" button
- Filter sidebar (Archetype/Belt chips + ELO slider) hidden via `v-if="false"` — markup + CSS preserved для future BE work (carry-over #29)

### Match found phase

- Spinner stops, phase transition к 'found'
- VS display: own captain (left) + opponent (right) — each side shows avatar (88px skin img) + name + ELO с gold accent
- Center "VS" divider в Anonymous font 22px
- "Fight starts in: {countdown}" с pulsing animation (mmCountdownPulse keyframe — scale 1→1.15 1Hz)
- 3 → 2 → 1 → navigate `router.push('/v2/fight')`
- FightView matchActive computed = true (pvp/getCurrentMatchId !== null) → enters PvP mode → pvp_ready dispatch chain (Sub-epic 4a wiring) → BE fight_start broadcast → fight begins

### Timeout phase (after 2 min без match)

- Spinner stops, phase transition к 'timeout'
- HUD displays: "Search timeout" kicker + "NO PLAYERS FOUND" headline + descriptive text + 2 buttons:
  - "Back to Hub" (transparent border, hover white tint) → `router.push('/v2')`
  - "Retry Search" (pink primary border, hover pink glow) → re-dispatch `MatchmakingStartMsg` + reset state via `enterSearchPhase()` + restart searchTimer

### Cancel/Back/Esc paths

- C12 race Q8.1 flag set BEFORE dispatch → if MatchFoundMsg arrives during cancel window, onMatchFound guard fires `console.warn` + `router.replace('/v2')`
- `dispatchMatchmakingCancel()` sends `MatchmakingCancelMsg` (only if queueDispatched=true)
- `stopSearchTimer()` + `stopCountdownTimer()` cleanup (idempotent)
- `pvp/RESET_PVP_FIGHT` defensive cleanup (cancel-during-found-phase)
- `router.push('/v2')`

---

## Commit chain — branch `claude/investigate-matchmaking-2JlwO` (12 functional + 3 closure)

### Cluster A — state infrastructure (3 commits)

| # | SHA | Description |
|---|---|---|
| C1 | `12adfb1` | useMatchmakingState — phase enum migration ('search\|results' → 'searching\|found\|timeout') + reactive captain ELO (myElo computed) + 5 new fields |
| C2 | `3dcb0d7` | DELETE mmCandidatesMock.js (102 lines) + useMatchmakingScreen.js (127 lines) + gut MatchmakingView mock-flow |
| C3 | `5c1e7e4` | HudMatchmaking template restructure — phase enum align + drop 'results' branch + hide filter sidebar (v-if="false") + add found/timeout placeholders + emit chain reduction |

### Cluster B — BE wiring (4 commits)

| # | SHA | Description |
|---|---|---|
| C4 | `88b63dd` | MatchmakingStartMsg + Cancel dispatch + searchTime timer + captain pre-check guard (audit decision option c) |
| C5 | `7e6bb55` | 4 BE WS event listeners (match-found/queue-update/cancelled/timeout) с named refs + handler stubs |
| C6 | `ac17ccf` | Match-found handler — pvp/SET_PVP_MATCH commit + enterFoundPhase + isPlayer1 placeholder per Carry-over #16 reclassification |
| C7 | `d6b08cb` | Timeout phase UI fill + retry/back wiring + DRY startMatchmakingSearch helper extraction + ~70 lines .mm-timeout CSS |

### Cluster C — UX bundle (3 commits)

| # | SHA | Description |
|---|---|---|
| C8 | `6db8c4e` | VS display + 3s countdown + /v2/fight navigate (carry-over #17 closure) — ~100 lines .mm-found CSS + 6 computed bindings |
| C9 | `42249c2` | Search timer mm:ss + queue size display + drop static ELO range orphan + myElo orphan import cleanup |
| C10 | `02ac9e7` | Online players REST fetch (fire-and-forget) + inline "N in queue · M online" display |

### Cluster D — edge case guards (2 commits)

| # | SHA | Description |
|---|---|---|
| C11 | `45c6348` | Double-queue FE redirect guard (Phase 0 Q8.3) |
| C12 | `68f7793` | Race Q8.1 cancel-during-pair localCancelPending guard |

### Closure (3 commits)

| # | SHA | Description |
|---|---|---|
| CL1 | `45e899d` | CLAUDE.md update — Sub-epic 5 closure (139 insertions/-11) |
| CL2 | this commit | Final report (this file) |
| CL3 | next | Sub-epic 6 handoff |

---

## Files inventory

### MODIFIED Frontend (4 files)

- `src/views-v2/MatchmakingView.vue` — orchestrator: WS dispatch + 4 listeners + match-found phase transition + countdown logic + REST fetch + 2 mount-time guards (double-queue C11 + captain pre-check C4) + race Q8.1 mitigation. Helper extractions: `dispatchMatchmakingCancel`, `stopSearchTimer`, `stopCountdownTimer`, `resetPvpState`, `startMatchmakingSearch` (DRY mount + retry).
- `src/components/hud/HudMatchmaking.vue` — phase enum alignment + filter sidebar hide + 3 phase template branches (searching/found/timeout) + 6 computed bindings normalising captain vs opponent field name asymmetry + emit chain reduction (5→3).
- `src/scene/interaction/useMatchmakingState.js` — phase enum migration + reactive captain ELO via myElo computed + 5 new reactive fields + 2 new helpers (enterFoundPhase/enterTimeoutPhase) + orphan field cleanup.
- `src/styles/v24/matchmaking.css` — `.mm-timeout-*` block (C7, ~70 lines, 9 rules) + `.mm-found-*` block (C8, ~100 lines, 13 rules + mmCountdownPulse keyframe).

### MODIFIED Documentation (1 file)

- `CLAUDE.md` — Sub-epic 5 closure section + Эпик 6 metrics propagation (3 progress refs / 2 streak refs / 4 recovery refs all updated) + carry-overs delta (1 closed #17 + 5 NEW #29-#33).

### NEW Documentation (2 files)

- `docs/visual-migration/EPIC6_SUBEPIC_5_PHASE_0_REPORT.md` — Phase 0 investigation (964 lines, 3-part preventive split per 5Q-5U precedent — single-write blocked, splits succeeded)
- `docs/visual-migration/EPIC6_SUBEPIC_5_FINAL_REPORT.md` — this file (CL2 closure)

### DELETED (2 files — mock removal C2)

- `src/scene/interaction/mmCandidatesMock.js` (102 lines, Mulberry32 RNG candidate generator)
- `src/scene/interaction/useMatchmakingScreen.js` (127 lines, CRT typeLog animation + screen renderer)

**Net delta:** 4 modified frontend files + 2 deleted + 2 new docs + 1 modified docs. Approx +400 lines code added (HUD VS + countdown + timeout + listeners) / -380 lines removed (mock files + ELO range static + orphan handlers) / +139 lines docs.

---

## Path A scope discipline — no BE touch

**Sub-epic 5 = pure FE wiring sub-epic.** BE matchmaking infrastructure 100% pre-existing per Phase 0 verification:

- `backend/src/services/matchmaking.js` (147 lines) — singleton MatchmakingService с in-memory queue Map, FCFS+ELO-proximity pairing, auto-expand search range 300→1000, 2-min wall-clock timeout
- `backend/src/services/eloService.js` (32 lines) — K=32 ELO calc (used by agent ranked, NOT PvP — PvP has inline duplicate per carry-over #30)
- `backend/src/websocket/handler.js` — `MatchmakingStartMsg` + `MatchmakingCancelMsg` handlers + `notifyMatch` broadcast + 3s periodic re-pair `setInterval`
- `backend/src/routes/stats.js` — `/v1/stats/online` public endpoint (reads `clients.size` Map)
- `src/core/state/modules/webSocketState.js:164-175` — 4 BE→FE routing cases (PascalCase `MatchFoundMsg`/`MatchmakingQueueMsg`/`MatchmakingCancelledMsg` + lowercase `matchmaking_timeout` BE convention drift documented)

**Lesson #33 (deploy environment awareness) — N/A** for Sub-epic 5. No cherry-pick → main → Railway flow needed. All changes ship together при Эпик 6 closure (visual-v2 → main merge).

**Phase 0 estimate vs actual:**

| Metric | Phase 0 estimate | Actual |
|---|---|---|
| Commits | 8-10 | 12 (slight overshoot — bundles С8/C9/C10 holistic rework) |
| BE touch | 0 | 0 ✅ |
| Streak risk | lowest | preserved 28 → 29 ✅ |
| BE work leverage | 100% | 100% confirmed ✅ |

---

## Verify-gate refinements (61 catches surfaced pre-edit)

Cumulative breakdown per commit (all adaptation-tier per Lesson #35):

| Commit | Catches | Notable catches |
|---|---|---|
| C1 | 6 | Helper functions phase migration / getEloRange orphan / Vuex import convention (useTrainingState precedent) / HudMatchmaking import bundle / ErrorMsg shape mismatch forward к C5 / **Rollup strict export post-edit recovery** |
| C2 | 6 | Mock importers enumeration / typeLog scope / legacy stub callers / lifecycle structure refactor scope / orphan emit bindings / phase enum mismatch acceptable transient |
| C3 | 5 | myElo title task already C1-bundled / ELO range display preservation transient / .mms-progress-text orphan drop / emit chain auto-cleanup / `v-if="false"` hide strategy |
| C4 | 4 | userData.username → userData.name (UserModel reality) / store import convention split / sendMessage signature / InfoMessageModel path lowercase 'i' |
| C5 | 5 | Event names verbatim Phase 0 Q1.1 / `match-cancelled` (4a) vs `matchmaking-cancelled` disambiguation / timer stop bundle / handler naming / listener cleanup discipline named refs |
| C6 | 5 | pvp/SET_PVP_MATCH signature / Carry-over #16 reclassification verified / 6th subsection candidate watch — NOT detected / enterFoundPhase import bundle / queueDispatched flag preservation для C12 |
| C7 | 5 | enterSearchPhase helper exists / .mm-search visual card reference / CSS naming clash watch (.mmt-* used by .mm-title) / .mm-main filters-hidden gap deferred / DRY refactor opportunity |
| C8 | 6 | CSS naming clash CONFIRMED (.mmf-* filter sidebar) / captain shape from master.userData.captain / **field name asymmetry normalization** / pvp reset path discipline (NOT in onBeforeUnmount) / countdown timer state pattern / skin URL pattern v1 precedent |
| C9 | 5 | ELO range orphan drop holistic / v1 formattedTime padStart pattern / CSS classes reuse (.mms-status + .mms-progress-text existing) / queue verbiage "N in queue" / myElo orphan import cleanup |
| C10 | 5 | Endpoint discovery (statsService precedent) / BE endpoint public no auth / SKIP repoll per ТЗ scope / "N online" verbiage parity / inline middle-dot separator |
| C11 | 4 | getCurrentMatchId getter signature / router.replace convention parity 3 precedents / hook placement decision (TOP of onMounted) / lifecycle cleanup safety on uninitialized state |
| C12 | 5 | Module-scope `let` (NOT ref) per queueDispatched precedent / no console.warn precedent acceptable / **set BEFORE dispatch order critical** / module-scope persistence across remounts requires explicit reset / bundle to onCancel + onBack |

**Cumulative: 61 catches surfaced pre-edit.** All adaptation-tier (or convention-discovery sub-tier per Lesson #32 reflex). **0 hot-fixes. 0 reactive splits. 0 STOP-tier.** 4b's 10-catch ceiling per commit not exceeded в any single commit (highest C1 + C2 + C8 = 6 each); cumulative 4b 38 vs Sub-epic 5 61 = 60% higher density consistent с Phase 0 prediction (L size + new architectural area).

---

## Recovery log (1 catch)

- **Recovery #85 — Phase 0 STEP 0 bootstrap branch divergence:** Harness assigned fresh slug `claude/investigate-matchmaking-2JlwO` instead of continue stack `claude/investigate-retirement-animation-zQeg4`. Same SHA `63d7f7d` (Sub-epic 4b CL3 handoff) — zero work-loss risk. User-authorized adaptation-tier proceed via explicit message ("adaptation-tier proceed authorized... Recovery #79/#82/#84 precedent"). **5th occurrence Lesson #43** (chain: 5U / Sub-epic 2 / 4a Phase 0 / 4b Phase 0 / Sub-epic 5 Phase 0). Pattern stable, no candidate promotion needed (Lesson #43 already PROMOTED in 4b — 4-occurrence chain previously validated, 5th adds empirical reinforcement).

**Tier:** adaptation-tier per Lesson #35 (environment/harness configuration discrepancy, not code bug). Streak preserved.

---

## Carry-overs delta

### Closed (-1)

- **#17 ✅ CLOSED (Sub-epic 5 C8)** — v2 countdown UI parity gap closed via matchmaking-side post-MatchFoundMsg 3-second countdown с pulsing animation + VS display covers full prep transition. v1 had 5s overlay в MatchmakingView; v2 ships 3s в same conceptual location for tighter UX + visual parity с BE COUNTDOWN_MS=3000.

### NEW carry-overs surfaced (+5)

- **#29 (C3 surface)** — Filter chips (Archetype/Belt) BE extension. UI markup + matchmaking.css preserved hidden via `v-if="false"` in HudMatchmaking.vue; revival path = remove v-if when BE accepts archetype/belt/eloDelta queue params. BE matchmaking.js currently only ELO-proximity FCFS.
- **#30 (Phase 0 finding)** — ELO duplication consolidation. `eloService.calculateElo` (asymmetric `{changeA, changeB, newRatingA, newRatingB}`) used by `agentFightService.js` (agent ranked); inline `pvpCombatEngine.calculateElo` (symmetric `{winnerNew, loserNew}`) used for PvP fight ELO updates. Math equivalent K=32 — different APIs. Polish/refactor candidate.
- **#31 (C1 surface)** — ErrorMsg shape mismatch BE→FE. BE `handleMatchmakingStart` sends `{type: 'ErrorMsg', error, code}` flat shape; FE `webSocketState.js:142-144` parser reads `message.errorDto` (different shape, expects `{code, message}`). Pre-existing bug, NOT created by Sub-epic 5. Captain pre-check (C4 audit decision option c) obviated specific NO_CAPTAIN_SET path; other ErrorMsg consumers still affected. Lesson #33 deploy chain candidate (BE shape correction OR FE parser tolerance).
- **#32 (C7 audit surface)** — `.mm-main left:270px` filters-hidden layout gap. C3 hid filter sidebar via `v-if="false"`; CSS `.mm-main` rule still reserves 270px space (was filter sidebar width via `position: fixed; left: 14px` + `width: 240px` = right edge 254px). Cosmetic spacing offset on left side of mm-main panel. Polish round candidate (1-line CSS adjustment + comment marker для filter revival path).
- **#33 (C8 surface)** — Captain vs opponent payload field name asymmetry. `master.userData.captain.{name, elo}` vs MatchFoundMsg `opponent.{username, rating}` — same semantic fields different names. C8 normalized FE-side via 6 computed wrappers (HudMatchmaking VS display). BE-side consolidation (CAPTAIN_PUBLIC_SELECT field naming alignment с MatchFoundMsg.opponent shape) candidate. Polish/Sub-epic 7.

### Active entering Sub-epic 6 (31 items total)

Per CLAUDE.md Эпик 6 overview (lines 5316-5355) — 27 entering Sub-epic 5 (Sub-epic 4b carry-overs) -1 closed (#17) +5 NEW = **31 items entering Sub-epic 6**.

---

## Methodology applied

- **Mode A strict per-commit discipline** — 12 functional commits + STOP-and-confirm gate after C1 + audit-only mode C2 onward. Build pass per commit. Lesson #11 reflex pre-edit + post-edit on every edit.
- **Lesson #11 reflex** — 61 cumulative catches pre-edit (vs 38 в 4b — 60% higher density consistent с Phase 0 prediction для L size + new architectural area). All adaptation-tier per Lesson #35.
- **Lesson #18 STOP** — applied 0 times (no semantic invariant violations surfaced — 6th Phase 0 subsection candidate occurrence #2 NOT detected through all 12 commits).
- **Lesson #32 convention discovery** — multiple applications: module-scope `let` vs `ref` (queueDispatched precedent — module-scope vars used only in handlers, no template binding); `useStore` composition (FightView precedent — most-similar PvP-flow view); CSS naming clash avoidance (`.mm-found-*` + `.mm-timeout-*` full prefixes vs existing `.mmf-*` filter sidebar classes); v1 `formattedTime` padStart pattern reuse; captain getter shape decision (`master.userData.captain` lighter sub-object vs `agent/currentCaptain` full Agent object).
- **Lesson #33 deploy environment awareness** — N/A (Path A FE-only scope discipline).
- **Lesson #34 HUD overlay convention** — applied к `.mm-timeout-btn` (`pointer-events: auto` override on parent's `pointer-events: none`) + `.mm-found` (`pointer-events: auto` card layout).
- **Lesson #35 reflex catch tiering** — 61 catches all adaptation-tier. 1 recovery (#85) adaptation-tier. 0 bug-bundle-tier surface scope expansion. 0 STOP-tier triggered.
- **Lesson #43 STEP 0 bootstrap branch verification** — applied at Phase 0 + each commit. **5th occurrence pattern reinforcement** (chain: 5U / Sub-epic 2 / 4a / 4b / 5).

---

## 6th Phase 0 subsection candidate (track, not yet promoted)

**Status:** Occurrence #2 NOT DETECTED через all 12 commits Sub-epic 5.

**Watch maintained explicitly:**
- C6 `pvp/SET_PVP_MATCH` commit — natural opportunity для player-ordering derivation logic. **No derivation introduced** — placeholder `isPlayer1: false` per Carry-over #16 reclassification verified Phase 0 Subsection 6.
- C8 VS display rendering — natural opportunity для self-vs-opponent semantic. **No derivation introduced** — pure side-by-side display (own captain left, opponent right), no logical "I am player1/2".

**Carry-over #16 reclassification holds:** matchmaking flow uses placeholder `isPlayer1: false` per BE-truth overwrite cascade pattern. Pattern verified stable through 3 codebase locations (ChallengeNotification.vue:62 / v1 MatchmakingView.vue:267 / v2 MatchmakingView.vue:122 — all semantically correct per BE invariant).

**Strong evidence pairing-symmetric flow doesn't trigger semantic invariant catches.** Tracking continues для Sub-epic 6+ (player-ordering surfaces возможны там при spectate flow — different semantic context).

---

## Cumulative metrics

| Metric | Entering Sub-epic 5 | Exiting Sub-epic 5 | Delta |
|---|---|---|---|
| Streak | 28 | **29** | +1 ✅ |
| Recoveries | 84+ | **85+** | +1 (#85 adaptation-tier) |
| Эпик 6 progress | 11/14 (78%) | **12/14 (86%)** | +1 sub-epic |
| Sub-epics closed in Эпик 6 | 11 | **12** | +1 |
| Lessons promoted | 36 | 36 | UNCHANGED |
| Lesson candidates active | 7 | 7 | UNCHANGED |
| 6th subsection occurrences | 1 (4b C10) | 1 | UNCHANGED (occurrence #2 NOT detected) |
| Carry-overs (Эпик 6 active) | 27 | **31** | -1 closed (#17) +5 NEW (#29-#33) |
| Cumulative Lesson #11 catches (Эпик 6) | unspecified | +61 from Sub-epic 5 | new ceiling для L-size sub-epic |
| Hot-fix metric | 28-streak clean | **29-streak clean** | preserved |
| Reactive splits | 0 (4b) | 0 | preserved (Path A scope held intact) |

---

## Closure shape: standard linear (9th application)

Sub-epic 5 closes Эпик 6 cumulative tally:

1. 6A — Лёгкий cutover (4 FULL coverage routes)
2. 6B-1 — `/help` страница (port-and-replace)
3. 6B-3 — `/user/:userLogin` guest profile (reactive split applied 7a/7b — only Эпик 6 reactive split так far)
4. Sub-epic 1 — `/v2/clan/:id` GuestClanView
5. Sub-epic 2 — Ratings reconciliation Path D Hybrid
6. Sub-epic 3 — Profile sub-routes deep links
7. Sub-epic 4a — PvP в v2 happy path
8. Sub-epic 4b — PvP edge cases + safety + BE deploy chain (code-complete + deferred-verify shape — 4th application)
9. **Sub-epic 5 — Real matchmaking** ← this sub-epic

**Standard linear** distinct from:
- "Code-complete + deferred-verify" (4 applications: 6B-3a-backend / Sub-epic 1 / Sub-epic 4b — used when BE deploy chain through main merge separates from designated branch)
- "Deprecation-via-redirect" (1 application: 6B-2 — used when underlying feature retires conceptually)
- "Scope-deferral-к-downstream" (1 application: 6B-3b — used when scope integrates inline в later sub-epic)

Sub-epic 5 reinforces standard linear baseline closure shape для Эпик 6 — most common pattern (60% of closures) when scope discipline holds + no BE touch + no reactive splits.

---

## Notes для Sub-epic 6 design-Claude (handoff prep)

CL3 will produce `HANDOFF_EPIC6_SUBEPIC_6_CHAT_HANDOFF.md` mirroring 4b → 5 transition format. Key forward signals:

- **31 carry-overs entering Sub-epic 6** (Эпик 6 cumulative, не Sub-epic 5-specific). All polish/non-functional. 5 NEW from Sub-epic 5 + 26 inherited from prior sub-epics.
- **Sub-epic 6 scope:** Real spectate finalization (M-L size). Replaces 5N HUD-only mock spectate с real BE WebSocket integration (live fight observation via existing pvpCombatEngine event chain — round_result, dice_rolled, coach_pause, fight_end).
- **Phase 0 focus areas:**
  - Spectate-mode WS subscription mechanism (per-match ID watchers OR global FightView listener mode-gate)
  - Live HUD reuse vs mock-port refactor decision (current 5N component уже existing)
  - FightView mode-gate logic (currently route-based per Sub-epic 4a — `route.name === 'V2Spectate'`; verify how PvP rounds + dice + coach + fight_end all should be consumed in spectate-only mode)
  - Friends entry point wiring closure (carry-over deferred 6B-3b — Friends list "Watch Live" buttons activate spectate)
  - Possible BE additions if pvpMatchManager doesn't currently broadcast к spectators (verify Phase 0 — Lesson #33 candidate)
- **5 mandatory Phase 0 subsections** + 6th candidate tracking continues (player-ordering may surface в spectate flow if "self-perspective vs opponent-perspective" rendering needed — different semantic context от matchmaking pairing-symmetric flow).
- **Lesson #43 ACTIVE** — Phase 0 STEP 0 mandatory bootstrap branch verification. 5-occurrence chain validated; 6th occurrence likely (continue stack vs harness fresh-slug reconciliation routine).
- **Lesson #33 deploy environment awareness** — verify Phase 0 if Sub-epic 6 touches BE (spectate broadcast mechanism may need pvpMatchManager extension); cherry-pick → main → Railway PR flow per branch strategy.
- **Pre-cutover acceptance gate (Sub-epic 8)** forward note preserved — full /v2 visual + functional sweep across all routes before final cutover.

---

**Sub-Epic 5 — CLOSED clean ✅. Streak 29-streak achieved.**

12 functional commits + 3 closure = 15 commits total. 0 hot-fixes, 0 reactive splits, 0 STOP applications. Path A scope discipline held intact through all 12 commits. 61 cumulative Lesson #11 catches established new L-size sub-epic methodology ceiling. Carry-over #17 (3-2-1 countdown UI parity gap) closed C8. 5 NEW carry-overs surfaced (#29-#33 — all polish/non-functional).

**Эпик 6 progress:** 12/14 (86%) — past 6/7 milestone reached. 3 sub-epics remaining (6/7/8) к Эпик 6 cutover.
