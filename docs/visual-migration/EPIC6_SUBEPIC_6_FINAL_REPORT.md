# EPIC 6 — Sub-Epic 6 — Real Spectate — FINAL REPORT

**Closed:** 2026-05-04
**Branch:** continue stack `claude/investigate-matchmaking-2JlwO-WfdV0`
**Commit range:** `ffc8166` (C1) → `c488192` (C12) — functional. CL1 = `709e692`. CL2/CL3 next.
**Cherry-pick PR:** [#356](https://github.com/evgenii-yps/testhexlash/pull/356) (`fix/pvp-surrender-routing`) — production hotfix only, merged `d52d2cb`
**Sub-epic position:** 13/14 (93%) — past 13/14 milestone reached
**Streak:** 29 → **30** ✅

---

## 1. Executive Summary

Sub-epic 6 завершает coverage gap для real spectate в v2: replaces 5N HUD-only mock simulation (setInterval + Math.random) с real BE WebSocket integration. End-to-end live spectate доступен в production после Sub-epic 8 cutover.

**Path B-min + D combo** (per Phase 0 decision):
- **Path B-min** — BE minimal extension (broadcast existing PvP events к match.spectators set, no separate spectator event types, no replay mechanism — reuses `fight_state_resume` Sub-epic 4b precedent)
- **Path D** — friends-only auth + direct URL access (`/v2/spectate/:fightId` с auth check: must be friend of player1 OR player2)

**Outcome:**
- 13 functional commits на continue stack (BE Foundation 7 + FE Wiring 4 + Lifecycle/Race 3) wait Sub-epic 8 cutover
- 1 production hotfix C4.5 (`pvp_surrender` routing) cherry-picked separately к main as PR #356
- 50 cumulative Lesson #11 catches pre-edit + 1 retroactive production bug catch (C4.5 surrender routing miss surviving PR #355 review)
- 0 hot-fixes (Sub-epic 6 main flow), 0 reactive splits, 0 STOP-tier на main flow
- 1 Lesson #18 STOP applied на cherry-pick branch (pre-PR #355 state finding) — recovered cleanly

**NEW closure shape:** **Code-complete + deferred-deploy** — distinguished от code-complete + deferred-verify (3 prior applications). Spectate feature work waits Sub-epic 8 cutover; only C4.5 production hotfix cherry-picked separately. 5th distinct closure shape в Эпике 6.

---

## 2. Commit Chain

### Functional commits (continue stack — wait Sub-epic 8 cutover)

| # | SHA | Cluster | Description |
|---|---|---|---|
| C1 | `ffc8166` | A — BE Foundation | feat(spectate): match.spectators Set field |
| C2 | `5d3f8f1` | A | feat(spectate): sendToSpectators helper + setSocketLookup setter |
| C3 | `a382546` | A | feat(spectate): broadcast 7 PvP events to match.spectators |
| C4 | `fb476eb` | A | feat(spectate): SpectateJoin/SpectateLeave WS handlers + auth |
| **C4.5** | `31028ef` | A — production hotfix | **fix(pvp): route pvp_surrender to pvpHandler (Sub-epic 4b post-fix)** |
| C5 | `349e574` | A | feat(spectate): cleanup on match end + spectator disconnect |
| C6 | `69603b2` | B — FE Wiring | feat(spectate): webSocketState routing для SpectatorListMsg |
| C7 | `cd852df` | B | feat(spectate): SpectateView.vue subscribe/unsubscribe lifecycle |
| C8 | `7371553` | B | feat(spectate): gut HudSpectate.vue mock simulation |
| C9 | `e392aec` | B | feat(spectate): wire HudSpectate to real BE state via WS events |
| C9.5 | `0d90bcd` | A | feat(spectate): extend getStateSnapshot с player meta (Sub-epic 6 BE bundle) |
| C10 | `e672a45` | C — Lifecycle/Race | feat(spectate): late-join state hydration via fight_state_resume reuse |
| C11 | `996d40f` | C | feat(spectate): race guards (Q8.1-Q8.3) |
| C12 | `c488192` | C | feat(spectate): cleanup discipline + leave handlers |

### Cherry-pick PR (production hotfix only)

| # | SHA | Description |
|---|---|---|
| C4.5 cherry | `25d43fd` | re-authored на `fix/pvp-surrender-routing` from main HEAD `b34ab5e` |
| **PR #356** | merged `d52d2cb` | cherry-pick C4.5 → main → Railway auto-deploy |

### Closure commits

| # | SHA | Description |
|---|---|---|
| CL1 | `709e692` | docs(6): CLAUDE.md update — Sub-epic 6 closure |
| CL2 | next | docs(6): final report — Sub-epic 6 |
| CL3 | next | docs(6): Sub-epic 7 chat handoff |

**Total:** 13 functional + 1 cherry-pick PR + 3 closure = 17 commits + 1 separate-branch PR.

---

## 3. Files Changed

### Backend (modified, 2)

- **`backend/src/services/pvpCombatEngine.js`** (~+150 lines net):
  - `match.spectators: Set<userId>` field initialization
  - `sendToSpectators(matchId, payload)` helper (callback injection via static setter)
  - `setSocketLookup(callback)` static setter (Option β — mirror `matchmaking.setSendToUser` precedent)
  - Spectator broadcast across **11 emit sites** (7 events): `round_result`, `dice_rolled`, `dice_available`, `coach_pause`, `coach_result`, `fight_end`, `overdrive_start` (8th `fight_state_resume` reused для late-join hydration via Sub-epic 4b precedent)
  - Cleanup on match end + `match.spectators.clear()` discipline
  - `getStateSnapshot()` extension с player meta (`username`, `skin`, `avatarUrl`) для late-join consistency с `fight_start` payload

- **`backend/src/websocket/handler.js`** (~+90 lines net):
  - `SpectateJoin` handler с auth check (friends-only — verify requesting user is friend of player1 OR player2; self-spectate guard ENABLED)
  - `SpectateLeave` handler (idempotent — safe multi-call)
  - `setSocketLookup` wire (callback injection on init)
  - `SpectatorListMsg` emit (count broadcast к watching peers on join/leave)
  - **`case 'pvp_surrender':` routing fix (C4.5)** — fall-through к `handlePvPMessage(ws, msg, { odId: userId })` consistent с `pvp_ready` / `dice_roll` / `coach_choice` pattern

### Frontend (new, 1)

- **`src/scene/interaction/useSpectateState.js`** (283 lines composable — mirror Sub-epic 5 `useMatchmakingState.js` pattern):
  - Module-scoped reactive state (player1/player2 meta, HP, round, log, dice indicators, coach pause state, fight result, late-join hydration buffer)
  - 3 clusters of helpers: subscribe/unsubscribe, event handlers (per-event update functions), cleanup
  - `deriveSideFromOdId(odId)` helper deterministic via `player1Hp/player2Hp` BE-truth fields (no self-anchored derivation per 6th Phase 0 subsection)

### Frontend (modified, 3)

- **`src/views-v2/SpectateView.vue`** (44 → 102 lines):
  - Mount → SpectateJoin dispatch → event listeners attach
  - Unmount → SpectateLeave dispatch → cleanup
  - `route.params.fightId` extraction + WS auth coordination

- **`src/components/hud/HudSpectate.vue`** (494 → 437 lines):
  - **Removed** ~250 lines mock simulation (setInterval-driven Math.random fight progression — 5N Path α residue)
  - Replaced с real BE state binding via `useSpectateState` composable
  - Template preserved (round counter, HP bars, fight log, dice indicators, result overlay) — wiring switched к composable getters

- **`src/core/state/modules/webSocketState.js`** (single case add):
  - `case 'SpectatorListMsg':` к routing chain → window CustomEvent dispatch (`spectator-list-update`)

### Documentation (new, 3)

- `docs/visual-migration/EPIC6_SUBEPIC_6_PHASE_0_REPORT.md` (Phase 0 investigation, committed early)
- `docs/visual-migration/EPIC6_SUBEPIC_6_FINAL_REPORT.md` (this file, CL2)
- `docs/visual-migration/HANDOFF_EPIC6_SUBEPIC_7_CHAT_HANDOFF.md` (CL3)

---

## 4. Architectural Decisions

### Path B-min + D combo (Phase 0 path decision)

Phase 0 surfaced 5 path candidates (α/A/B/C/D). Decided **B-min + D combo:**

- **Path B-min** chosen over Path C (comprehensive separate spectator event types + replay mechanism) because:
  - Existing 7 PvP events fully suitable для spectator consumption (no fundamental shape difference)
  - Sub-epic 4b `fight_state_resume` reusable для late-join (no new replay mechanism required)
  - Smaller scope, fewer moving parts
- **Path D** (friends-only) chosen over public spectate because:
  - Privacy-first default (matches CLAUDE.md 5N "Friend Watch button" precedent)
  - Wider feed (general live matches) deferred к Sub-epic 7+ if user demand surfaces
  - Auth surface minimal (reuse existing friend graph)
- **NOT Path A** (FE-only mock-port) — would defer real spectate, technical debt
- **NOT Path C** (BE comprehensive) — over-scope для closure
- **NOT Path α** (keep mock) — anti-pattern для closure

### Callback injection (Option β) — `setSocketLookup` static setter

Spectator broadcast needs socket-by-userId lookup. Two options surfaced:
- **Option α** — direct import `pvpCombatEngine.js` ← `handler.js` (creates circular dep risk)
- **Option β** — callback injection: `handler.js` calls `PvPCombatEngine.setSocketLookup(socketByUserId)` on init; engine uses callback when broadcasting

Chose **Option β** (mirror `matchmaking.setSendToUser` precedent — Sub-epic 5 pattern). No circular dep, testable in isolation, conventional.

### Composable extraction — `useSpectateState.js`

State management for spectate UI was previously inline в HudSpectate (mock simulation logic). Sub-epic 6 extracted к standalone composable per Sub-epic 5 `useMatchmakingState.js` precedent:
- Module-scoped reactive state (one instance per spectate session, not per HudSpectate mount)
- Decouples WS event handling от UI rendering
- Mirrors precedent — convention preserved (Lesson #32 reflex)

### Perspective normalization — `player1Hp/player2Hp` BE-truth fields

Spectator UI shows two players (left/right rendering). Initial assumption (4b carry-over): use `myHp`/`opponentHp` shape from player perspective. **Rejected** at C9 audit per 6th Phase 0 subsection (semantic invariant + flow direction):
- Spectator has no "self" — both players are "other"
- Self-anchored derivation (`opponent.odId !== userData.id`) breaks для spectators
- **Solution:** BE sends absolute `player1Hp/player2Hp/player1Odid/player2Odid` fields. FE uses `deriveSideFromOdId(odId)` helper deterministically — independent of spectator's own identity
- Visual labels --friend/--opp preserved as LEFT/RIGHT colors (CSS-only mapping, не semantic invariant)

### Late-join — `fight_state_resume` reuse

Late-joiners need current state on mount. Two options:
- **Option A** — new replay event type `spectator_history_replay` (events from match start)
- **Option B** — single snapshot via existing `fight_state_resume` (Sub-epic 4b precedent)

Chose **Option B**:
- No new event type
- `fight_state_resume` already extended via C9.5 с player meta
- Matches Sub-epic 4b reconnect-replay pattern (consistent UX)
- Replay log = current round events only (sufficient for live UX, full history out-of-scope per Path B-min)

### Friends-only auth — `match.player1` OR `match.player2` friendship check

Sub-epic 4 audit determined auth at SpectateJoin handler:
- Verify requesting user has friendship edge с player1 OR player2 (existing friends graph)
- Self-spectate guard ENABLED — player can't spectate own match (redirect к `/v2/fight`)
- BE-side validation — FE cannot bypass через direct WS dispatch
- Wider feed (general live matches) deferred Sub-epic 7+

---

## 5. Phase 0 → Phase 1 Mapping

Phase 0 outlined Q1-Q9 (questions) + 5 mandatory subsections + 6th candidate. Phase 1 commits resolved:

| Phase 0 Q | Resolved | Phase 1 commit |
|---|---|---|
| Q1 — Existing infrastructure inventory | Empty (NO BE spectate, NO FE WS routing) | C1-C6 build from scratch |
| Q2 — Spectator subscription mechanism | Per-match `Set<userId>` + sendToSpectators helper | C1, C2 |
| Q3 — PvP event chain reuse | All 7 events broadcast verbatim к spectators | C3 (11 sites) |
| Q4 — Spectator UI overlay | HudSpectate 5N reused, mock gutted | C7, C8, C9 |
| Q5 — Match finding/discovery | Direct URL `/v2/spectate/:fightId` (Friends list "Watch" wiring deferred к Sub-epic 7) | C7 |
| Q6 — Authorization | Friends-only check at SpectateJoin handler | C4 |
| Q7 — Lifecycle & cleanup | Match end auto-cleanup + disconnect handler | C5, C12 |
| Q8 — Race conditions | Q8.1-Q8.3 race guards | C11 |
| Q9 — Match handoff | SpectatorListMsg + onUnmounted cleanup | C6, C7, C12 |

### 5 mandatory Phase 0 subsections — applied

1. **API contract verification** — exact WS message types + field names verified pre-edit (SpectateJoin/Leave/SpectatorListMsg)
2. **Negative-space verification** — confirmed BE spectate service + FE WS routing absent (no surprises)
3. **Real CSS class taxonomy dump** — `.sp-*` namespace existing 5N HudSpectate, preserved
4. **UI infrastructure dependencies** — full chain checks (route → view → composable → handlers → template)
5. **Vocabulary alignment audit** — mock vs real WS chain (5N setInterval/Math.random ↔ real BE event chain) — replacement scope identified

### 6th Phase 0 subsection — PROMOTED к mandatory

**Semantic invariant + flow direction verification.** Occurrence #1 (4b C10 — semantic contradiction caught при ChallengeNotification source-fix attempt). **Occurrence #2 (Sub-epic 6 multi-commit application):**

- **C3** — perspective normalization для 4 differentiated events (rollerId/playerOdId disambig)
- **C9** — state field rename `player1Hp/player2Hp` (BE-truth deterministic) + `deriveSideFromOdId` helper
- **C9.5** — getStateSnapshot extension consistent с `fight_start` payload shape
- **C10** — winner derivation HP-based (no `isPlayer1` self-anchored derivation)
- **C11** — race guards no self-anchored derivation patterns

**Promotion criteria met:** 2-occurrence pattern emerged (1st was reactive STOP catch — 4b C10; 2nd was proactive design-pattern application — Sub-epic 6 C3/C9/C9.5/C10/C11). Future Phase 0 reports include 6 mandatory subsections going forward.

---

## 6. 50 Catches Inventory

Lesson #11 reflex caught 50 cumulative pre-edit issues across 13 commits + 1 retroactive production bug catch. All adaptation-tier OR alignment-tier per Lesson #35 framework. **0 hot-fixes, 0 reactive splits, 0 STOP-tier на main flow.**

| Commit | Catches | Tier | Notable |
|---|---|---|---|
| C1 | 3 | adaptation | Set vs Array choice, Map sentinel, init position |
| C2 | 4 | adaptation | callback injection vs direct import (Option β), lookup signature, error handling |
| C3 | 5 | adaptation | per-event differentiation analysis (basePayload + spread), broadcast loop placement, getMatch vs match var, context-aware variants |
| C4 | 5+1 | adaptation + **bug** | auth chain ordering, friendship lookup, **+ retroactive production bug catch C4.5 surrender routing miss** |
| C4.5 | — | hotfix | (separate cherry-pick scope, no audit catches counted) |
| C5 | 4 | adaptation | cleanup ordering, set deletion vs clear, disconnect callback chain, finished status guard |
| C6 | 2 | alignment | fall-through chain extension, message detail propagation |
| C7 | 4 | adaptation | mount lifecycle ordering, dispatch before subscribe, Vue3 onUnmounted, navigation guards |
| C8 | 3 | adaptation | mock removal scope boundary (~250 lines), leave shell intact, no setInterval cleanup needed since gutted entirely |
| C9 | 5 | adaptation | composable extraction shape, deriveSideFromOdId helper, perspective normalization, label vs internal, watcher cleanup |
| C9.5 | 4 | adaptation | player meta consistent с fight_start, snapshot field naming, late-join window |
| C10 | 5 | adaptation | fight_state_resume reuse vs separate event, hp/round/log replay ordering, snapshot freshness, scroll restore, log-clear-then-replay |
| C11 | 3 | adaptation | race guard placement, Q8.1 round transition lock, Q8.3 user-scoped Set semantics |
| C12 | 3 | adaptation | cleanup invariants, scroll-restore timing, leave handler idempotency |

**Total: 50 catches** (within Phase 0 prediction 40-70 range; below Sub-epic 5's 61-catch ceiling ~18% — consistent с feature mature scope vs new architectural area).

**Plus 1 retroactive production bug catch (C4.5):** Lesson #11 reflex applied to `handler.js handleMessage` switch during C4 audit. Surface check of switch contents revealed missing `case 'pvp_surrender':` survived PR #355 review. C4.5 commit added route — verified production gap via `git show origin/main:backend/src/websocket/handler.js | grep pvp_surrender` → empty pre-PR-#355-merge.

---

## 7. Recoveries

### Recovery #86 — Phase 0 STEP 0 bootstrap branch verification

**Type:** adaptation-tier per Lesson #35 (same SHA, harness fresh-slug carry-over).

**Detail:** Sub-epic 5 closure CL2 `b56bdfc` shipped on `claude/investigate-matchmaking-2JlwO-WfdV0` (harness fresh-slug from Sub-epic 5 Recovery #85). Sub-epic 6 Phase 0 inherited same branch — STEP 0 git verify confirmed continue stack continuation, zero work-loss risk.

**Lesson #43 chain extension:** 6th occurrence (5U / Sub-epic 2 / 4a / 4b / Sub-epic 5 / **Sub-epic 6 Phase 0**). Pattern stable, no candidate promotion (already PROMOTED in 4b).

### Recovery #87 — CL1 boundary bootstrap branch divergence

**Type:** adaptation-tier per Lesson #35 (same SHA, harness re-assignment).

**Detail:** Closure phase fresh chat boundary — harness assigned new slug `claude/fix-surrender-bug-S7LfH` (semantically related к PR #356 review task, but CL1 scope = Sub-epic 6 closure docs). Same SHA `c488192` as continue stack. User-authorized switch back к continue stack `claude/investigate-matchmaking-2JlwO-WfdV0` per 6-prior-occurrence precedent (Recoveries #82/#85/#86 pattern).

**Branch `claude/fix-surrender-bug-S7LfH`:** abandoned (0 commits, never pushed).

**Lesson #43 chain extension:** 7th occurrence (added к prior 6 list). Pattern: same SHA + semantic branch name mismatch к task scope (closure docs continue feature commits, not surrender bug work). 7-occurrence chain validated.

---

## 8. Methodology Applied

### Mode A strict per-commit discipline

- 13 functional commits + STOP-and-confirm gate after C1 + audit-only mode C2 onward
- Build pass per commit (`npm run build` mandatory per Эпик 1 Lesson 1)
- Push immediate after each commit
- Lesson #11 reflex pre-edit + post-edit grep on every edit

### Lesson #11 reflex (pre-edit + post-edit grep)

50 cumulative catches pre-edit + 1 retroactive production bug catch (C4.5). All adaptation-tier per Lesson #35. Surface assumption gaps before commit, не fix-forward.

### Lesson #18 STOP applied — cherry-pick branch sanity finding

Single application during C4.5 cherry-pick PR creation phase. STEP 1 sanity re-verify on refreshed `fix/pvp-surrender-routing` branch surfaced **wider scope:** entire Sub-epic 4b PR #355 absent от `origin/main` pre-merge. Original ТЗ premise ("missing routing line") expanded к "entire 4b BE infrastructure missing." Per Lesson #18 — STOP, не blind-execute when underlying assumption invalidated mid-flow.

**Recovery:** User merged PR #355 manually mid-flow. Post-merge re-verify confirmed gap restored к narrow original scope (only `handler.js handleMessage` routing line still missing). Resumed cherry-pick valid. Streak preserved (catch + recover, не hot-fix).

### Lesson #32 convention discovery

Multiple applications:
- **Callback injection vs direct import** (`setSocketLookup` static setter mirror `matchmaking.setSendToUser` precedent — Option β)
- **Composable extraction pattern** (mirror `useMatchmakingState.js` Sub-epic 5)
- **Perspective normalization** (`deriveSideFromOdId` helper deterministic via BE-truth `player1Hp/player2Hp` fields, no self-anchored derivation)
- **Late-join via `fight_state_resume` reuse** (Sub-epic 4b precedent — no new event type)

### Lesson #33 deploy environment awareness — 5th application

Cherry-pick → main → Railway flow per CLAUDE.md branch strategy (~line 770). Prior 4 applications: 6B-3a-backend / Sub-epic 1 / Sub-epic 4b PR #355 / **PR #356 (Sub-epic 6 C4.5 production hotfix)**.

### Lesson #34 HUD overlay convention

HudSpectate template existing 5N pattern preserved (root `position: fixed; inset: 0; pointer-events: none;` + interactive children `pointer-events: auto;`).

### Lesson #35 reflex catch tiering

50 catches all adaptation-tier. 2 recoveries (#86, #87) adaptation-tier. 0 bug-bundle-tier surface scope expansion. 0 STOP-tier on main flow. 1 STOP-tier on cherry-pick branch (pre-PR #355 sanity catch — recovered cleanly).

### Lesson #43 STEP 0 bootstrap branch verification — 7-occurrence chain

Applied at Phase 0 + each commit + closure phase boundary. **7 occurrences** validated:
1. 5U
2. Sub-epic 2 Phase 0
3. Sub-epic 4a Phase 0
4. Sub-epic 4b Phase 0
5. Sub-epic 5 Phase 0 (Recovery #85)
6. Sub-epic 6 Phase 0 (Recovery #86)
7. Sub-epic 6 CL1 boundary (Recovery #87)

Pattern stable, no further candidate promotion (already PROMOTED in 4b).

### Lesson #44 PROMOTED — re-anchor scope after strategy revision

**NEW lesson promotion this Sub-epic.** Surfaced during closure phase mid-execution handoff revision episode.

**Episode narrative:** Initial Phase 1 ТЗ assumed 7-commit cherry-pick PR (C1-C5 + C4.5 + C9.5 — mirror Sub-epic 4b PR #355 5-commit pattern). After user pushback on branch strategy ("зачем нам мержить все в main у нас же еще несколько саб эпиков"), strategy revised к minimal cherry-pick (C4.5 only — production bug fix only, остальные wait Sub-epic 8 cutover). However, design-Claude carried old "7-commit cherry-pick" mental model в later audit reminder blocks (C5/C9.5/C12 audits referenced bundled scope inconsistent с revised plan). **Caught by fresh design-Claude session at handoff review boundary.**

**Lesson:** Design-Claude must explicitly re-anchor cherry-pick scope (and other strategic decisions) после каждой strategy revision. Old reminder text должен быть updated, не carry-over implicitly через subsequent reminder blocks. Mid-execution handoff revisions need re-propagation through all downstream artefacts (audit reminders, ТЗ templates, handoff packages).

**Promotion:** Lesson #44 PROMOTED first-occurrence with explicit catch evidence (handoff review caught inconsistency before bad ТЗ generation propagated к IDE). Tally: 36 → **37 lessons promoted**.

---

## 9. NEW Closure Shape — Code-Complete + Deferred-Deploy

**5th distinct closure shape в Эпике 6:**

1. **Standard linear** — 9 prior applications (single-thread closure, no BE deploy chain split)
2. **Deprecation-via-redirect** — 1 application (6B-2)
3. **Code-complete + deferred-verify** — 3 applications (6B-3a-backend, Sub-epic 1, Sub-epic 4b)
4. **Scope-deferral-к-downstream** — 1 application (6B-3b)
5. **Code-complete + deferred-deploy — NEW (Sub-epic 6)** — distinguished от code-complete + deferred-verify

### Distinction

**Code-complete + deferred-verify** (3 prior):
- Cherry-pick PR opens immediately at closure
- User verifies merge + Railway deploy + smoke test
- All sub-epic deliverables ship together via cherry-pick

**Code-complete + deferred-deploy (Sub-epic 6):**
- Spectate feature (BE C1-C5, C9.5 + FE C6-C12) **NOT cherry-picked at all**
- Continue stack accumulates feature commits without production deploy
- Only C4.5 production hotfix cherry-picked separately (out-of-scope catch, not feature work)
- Feature deploy waits Sub-epic 8 cutover (visual-v2 → main final merge)

### When to apply

- Sub-epic primary scope = feature work for v2 migration (not production bug fix)
- Branch strategy CLAUDE.md ~line 770 — feature commits accumulate на continue stack until Эпик cutover
- Production hotfixes captured during sub-epic execution cherry-pick separately с minimal scope (per fix, not bundle)

### Pattern reinforced

Branch strategy clarified through this episode:
- **Continue stack** = feature work, ships at Эпик cutover
- **Cherry-pick PRs** = production bug fixes only, minimal scope per fix
- **NOT bundling** feature work с production fixes (avoids early-deploy of incomplete features)

---

## 10. Production Hotfix Narrative — C4.5 + PR #356

### Catch

During C4 audit (Cluster A — SpectateJoin/SpectateLeave handlers + setSocketLookup wire), pre-edit verify of `handler.js handleMessage` switch surfaced missing `case 'pvp_surrender':` route. Sub-epic 4b C3 (`pvp_surrender` WS handler routing — `feat(pvp): pvp_surrender WS handler routing` `2cf4a2e`) added downstream `case 'pvp_surrender':` в `pvpHandler.js` + `engine.surrender(odId)` method, но missed upstream dispatch routing в `handler.js`.

**Production state since Sub-epic 4b deploy:** client `pvp_surrender` messages hit `default` case в `handler.js handleMessage` switch → "Unknown message type" error → never reach `pvpHandler.surrender()`. **Surrender feature broken в production ~2 days.**

### Cherry-pick episode

Initial cherry-pick PR creation flow surfaced **wider scope finding via Lesson #18 STOP:** STEP 1 sanity re-verify on refreshed branch revealed entire Sub-epic 4b PR #355 absent от `origin/main` (entire 4b BE infrastructure missing — not just routing line). Original ТЗ premise invalidated.

**Resolution:** User merged PR #355 manually mid-flow (PR #355 status: opened 2026-05-04 as part of Sub-epic 4b closure code-complete + deferred-verify shape; merge happened during Sub-epic 6 closure phase, не at Sub-epic 4b closure). Post-merge re-verify confirmed gap restored к narrow original scope. Cherry-pick C4.5 (`31028ef`) к refreshed `fix/pvp-surrender-routing` from `b34ab5e` (post-PR #355 merge HEAD). Single-commit cherry-pick clean (no conflicts despite "Auto-merging" log — git resolved automatically since adjacent context exists).

### PR #356

- **Branch:** `fix/pvp-surrender-routing` from `origin/main` HEAD `b34ab5e`
- **Commit:** `25d43fd` (re-authored cherry-pick of `31028ef`)
- **Single insertion:** `case 'pvp_surrender':` к `handler.js handleMessage` switch (~line 178), fall-through к `handlePvPMessage(ws, msg, { odId: userId })`
- **Build:** ✅ FE Vite + BE syntax pass
- **Merged:** `d52d2cb` (~2 minutes after open)
- **Railway deploy:** ✅ auto-deploy via testhexlash service webhook
- **Independent post-merge review:** approved (separate Claude Code session — fix корректный, downstream chain validated, minimal risk surface)

### Smoke test

Skipped — surrender UI существует только в v2 frontend (`HudFight.vue` Sub-epic 4b C8). v2 НЕ в production main (waits Sub-epic 8 cutover). Production main UI имеет only v1 routes (`/arena`/`/fight`) without surrender button. End-to-end smoke test deferred к visual-v2 preview deployments OR post-Sub-epic-8 cutover.

**Backend hotfix verified via:** post-merge `git show origin/main:backend/src/websocket/handler.js | grep pvp_surrender` returns hit (case present). Downstream chain (pvpHandler case + engine method) confirmed present via independent review.

---

## 11. Strategy Revision — Honest Disclosure

### Episode

Mid-execution closure phase had a strategy revision episode that needs documentation:

**Initial state (Phase 1 ТЗ):** Cherry-pick PR scope assumed 7 commits — C1, C2, C3, C4, C4.5, C5, C9.5 (mirror Sub-epic 4b PR #355 5-commit + 2 additional spectate BE commits).

**User pushback (mid-Phase 1):** "зачем нам мержить все в main у нас же еще несколько саб эпиков" — user surfaced branch strategy violation. CLAUDE.md ~line 770 confirms continue stack feature commits ship at Эпик cutover, not piecemeal cherry-picks per sub-epic.

**Revision (mid-Phase 1):** Cherry-pick scope reduced к C4.5 only (production bug fix only). 6 BE commits (C1, C2, C3, C4, C5, C9.5) stay на continue stack для Sub-epic 8 cutover.

**Mistake (later audit reminders):** Design-Claude (predecessor session) carried OLD "7-commit cherry-pick" mental model в later audit reminder blocks (C5/C9.5/C12 audits referenced bundled scope inconsistent с revised plan). Bad mental model persisted across reminder boundaries.

**Catch (closure phase fresh chat):** Fresh design-Claude session reading mid-execution handoff caught inconsistency between "revised cherry-pick scope" stated in handoff TL;DR + later "7-commit cherry-pick" assumption embedded в C4.5 PR ТЗ template. STOP'd for verification before generating bad ТЗ к IDE.

### Why this is OK to disclose

- Streak 30 preserved — catch + recover pattern, не hot-fix (no broken commits, no reverts)
- Methodology integrity served by transparency — Lesson #44 promotion captures pattern для future prevention
- User pushback was correct first-time — branch strategy violation caught at strategic level before ТЗ propagation к IDE

### Lesson #44 promotion outcome

Design-Claude must re-anchor strategic decisions (cherry-pick scope, branch strategy, path choice) после каждой revision. Old reminder text должен быть updated explicitly, не carry-over implicitly. See Section 8 — Methodology Applied — Lesson #44.

---

## 12. Carry-Overs Surfaced

### NEW carry-overs from Sub-epic 6 (#34-#37, all polish/non-functional)

- **#34 NEW** — Coach pause read-only overlay UI absent в HudSpectate template. Spectate users currently не видят when player активирует coach pause (BE event broadcasted, FE composable parses, но template не renders для spectate mode). Decoration-only gap. Polish round candidate (Sub-epic 7).
- **#35 NEW** — activeEffects display badges absent в HudSpectate template. Spectate users не видят active effects (adrenaline/shield/blind etc.) — BE provides данные, FE composable parses, но template не renders. Decoration-only gap. Polish round candidate (Sub-epic 7).
- **#36 NEW** — "joined late" visual indicator absent. Late-joiners receive replayed events via `fight_state_resume` snapshot, но replay events styled identically к live events. UX polish — distinct log styling (italic / dim / "[REPLAY]" prefix) would help users orient. Polish round candidate (Sub-epic 7).
- **#37 NEW** — `--draw` CSS class для resultClass may not exist в `hexlash-v24.css`. HudSpectate result overlay sets `class="result-${resultClass}"` где `resultClass` может быть `'win'/'loss'/'draw'`. C10 verified `--win` and `--loss` exist; `--draw` not surfaced (acceptable fallback к base styling). Polish round candidate — verify + add if missing (Sub-epic 7).

### Carry-over #31 (ErrorMsg shape mismatch BE→FE) STILL DEFERRED

Sub-epic 6 expected к bundle but no surface during Path B-min execution (no ErrorMsg consumers touched). Bundle candidate Sub-epic 7 OR Sub-epic 8 cutover hardening.

### Polish carry-overs cumulative — entering Sub-epic 7

**35 active carry-overs entering Sub-epic 7:**
- 15 inherited (#1-#15) — none closed Sub-epic 6
- 11 from Sub-epic 4a polish (#18-#28) — defer Sub-epic 7
- 5 from Sub-epic 5 (#29-#33) — defer Sub-epic 7
- **4 NEW from Sub-epic 6 (#34-#37)** — defer Sub-epic 7

(#16 reclassified 4b C10, #17 closed Sub-epic 5 C8 — not in active list)

---

## 13. Production State Summary

### Backend (Railway production)

- ✅ **Surrender routing fix** — LIVE (PR #356 merged 2026-05-04 → `d52d2cb` → Railway auto-deploy)
- ⚪ **Spectate BE infrastructure** (C1-C5, C9.5) — NOT deployed, waits Sub-epic 8 cutover
- ✅ **Sub-epic 4b BE** (timeout / surrender method / state snapshot / fight_state_resume / reconnect emit) — LIVE (PR #355 merged 2026-05-04 mid-Sub-epic-6-closure → `b34ab5e`)

### Frontend

- ✅ **Spectate UI** (composable + view + HUD) — live на visual-v2 preview deployments (continue stack `claude/investigate-matchmaking-2JlwO-WfdV0`)
- ⚪ **v2 production main** — Sub-epic 4-6 frontend NOT в production main (waits Sub-epic 8 cutover)
- ✅ **v1 production main** — unchanged, surrender button only existed в v2 (no v1 surrender feature)

### End-to-end live spectate

- ✅ **visual-v2 preview** — full end-to-end works (frontend + backend on continue stack preview env)
- ⚪ **production main** — available после Sub-epic 8 cutover

---

## 14. Cumulative Эпик 6 Methodology Contributions

### NEW contributions Sub-epic 6

- **Code-complete + deferred-deploy** closure shape (5th distinct в Эпике 6)
- **Lesson #44** PROMOTED — re-anchor scope after strategy revision (handoff review catch)
- **6th Phase 0 subsection PROMOTED** к mandatory — semantic invariant + flow direction verification
- **Lesson #43 7-occurrence chain** validated (most-applied lesson Эпика 6)

### Contributions across Эпик 6 (sub-epics 6A through 6)

- **Investigation-refines-ТЗ pattern** (validated quintuple-precedent Эпик 5, sustained Эпик 6)
- **Closure shapes framework** — 5 distinct shapes mapped (standard linear / deprecation-via-redirect / code-complete + deferred-verify / scope-deferral-к-downstream / code-complete + deferred-deploy)
- **Lesson #11 reflex pre-edit** — sustained 50+/sub-epic catches (10 → 38 → 61 → 50 across 4a/4b/5/6)
- **Lesson #18 STOP discipline** — applied at structural mismatches (4b C10, Sub-epic 6 cherry-pick branch sanity)
- **Lesson #32 convention discovery reflex** — universally applied
- **Lesson #33 deploy environment awareness** — 5 cumulative applications (6B-3a-backend / Sub-epic 1 / Sub-epic 4b PR #355 / Sub-epic 6 PR #356)
- **Lesson #35 reflex catch tiering** — adaptation / bug-bundle / scope-boundary framework sustained
- **Lesson #43 PROMOTED + 7-occurrence chain** — mandatory Phase 0 STEP 0 bootstrap branch verify
- **6 mandatory Phase 0 subsections** — full set established (after Sub-epic 6 6th promotion)

---

## 15. Cumulative Metrics Snapshot

| Metric | Pre-Sub-epic-6 | Post-Sub-epic-6 | Δ |
|---|---|---|---|
| Streak | 29 | **30** ✅ | +1 |
| Эпик 6 progress | 12/14 (86%) | **13/14 (93%)** | +1 |
| Sub-epics closed Эпик 6 | 12 | **13** | +1 |
| Recoveries cumulative | 85+ | **87+** | +2 (#86, #87) |
| Lessons promoted | 36 | **37** | +1 (#44) |
| Lesson candidates active | 7 | 7 | 0 |
| Phase 0 mandatory subsections | 5 | **6** | +1 (semantic invariant + flow direction PROMOTED) |
| Hot-fixes (Эпик 6 cumulative) | 0 | **0** | 0 |
| Cherry-pick PRs cumulative | 3 (PR #353, #354, #355) | **4** (+ PR #356) | +1 |

---

## 16. Closing Statement

Sub-epic 6 closes 10th coverage gap в Эпике 6 cleanly. **Streak 30** ✅ achieved via 30 consecutive sub-epics без hot-fix metric. Spectate feature production-ready, waits Sub-epic 8 cutover. Production surrender bug closed via dedicated cherry-pick PR #356. Methodology framework reinforced — 5 closure shapes mapped, 6 mandatory Phase 0 subsections established, Lesson #43 7-occurrence chain stable, Lesson #44 promoted.

**Эпик 6 progress 13/14 (93%).** 2 sub-epics remaining: Sub-epic 7 (Visual polish round + Auth + Wallet redesign) + Sub-epic 8 (final cutover — visual-v2 → main merge + Эпик closure).

**Sub-epic 6 — CLOSED ✅.**

---

**Конец Final Report.**
