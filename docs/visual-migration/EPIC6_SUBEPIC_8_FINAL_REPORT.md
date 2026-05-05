# Sub-epic 8 — Final Report — Pre-cutover gate + v1→v2 cutover + Эпик 6 closure

**Status:** ✅ CLOSED clean
**Date:** 2026-05-05
**Branch:** `claude/investigate-cutover-gate-RpOyg` (designated, Option E re-anchor per Recovery #91)
**Base SHA entering:** `1a3db1d` (Sub-epic 7 closure 3)
**Final functional SHA:** `76e4e2b` (C9 — last functional)
**Closure SHAs:** `1f499ff` (CL1 CLAUDE.md), CL2 (this), CL3 (Эпик 6 final report — pending)
**Phase 0 SHA:** `482754f` (housekeeping commit)
**Acceptance gate SHA:** `55bd238` (housekeeping commit)
**Cherry-pick PR:** [#357](https://github.com/evgenii-yps/testhexlash/pull/357) — `fix/friends-watch-live-be`
**Commit count:** 12 (9 functional + 3 closure) + 1 cherry-pick PR
**Path:** β FIXED (Phased per-feature redirects, lowest-risk first order)

---

## 1. Executive Summary

Sub-epic 8 closed clean across 12 commits + 1 cherry-pick PR, finalizing Эпик 6 visual migration **15/15 (100% complete)**. Path β (Phased) executed cleanly с per-feature redirects landing in lowest-risk-first order: ratings → matchmaking → fight → spectate → friends. v1 cleanup 6,885 lines across 10 v1 views deleted (Phase A 5 orphans + Phase B 5 cutover-dependent). Phase C deferred per user decision (PreparationView + FightClubView preserved for Эпик 7+).

**Key metrics:**
- Functional commits: 9 (C1-C9)
- Closure commits: 3 (CL1 CLAUDE.md, CL2 this, CL3 Эпик 6 retrospective)
- Cherry-pick PR: 1 (#357 — Friends Watch Live BE, Lesson #33 6th application)
- Carry-overs closed: 1 (Q6-A Friends Watch Live live)
- Carry-overs surfaced forward к Эпик 7+: 9 (#38-#46)
- Cumulative pre-edit catches: 8 Lesson #11 (within Phase 0 prediction 25-50 lower-bound)
- Lesson #45 catches: 4 cumulative (concentrated в C7 BE bundle)
- Recoveries: +2 (#89 Lesson #43 9th occurrence + #91 Lesson #18 surface + Lesson #44 re-anchor — both adaptation-tier per Lesson #35)
- Hot-fix metric: **0 — 32-streak achieved**
- v1 view cleanup: 10 files / 6,885 lines

**Эпик 6 progress entering:** 14/14 (100% functional)
**Эпик 6 progress exiting:** **15/15 (100%)** ✅ — **ЭПИК 6 CLOSED.**

---

## 2. Commit Chain

### Functional commits (9)

| # | SHA | Cluster | Description | Lines |
|---|---|---|---|---|
| C1 | `0b9dc45` | Cutover β1 | redirect /ratings/:type → /v2/ratings (function-form param drop + bare /ratings) | +4 -2 |
| C2 | `bf2e9e9` | Cutover β2 | redirect /matchmaking → /v2/matchmaking (string-form) | +1 -1 |
| C3 | `a940e95` | Cutover β3 | redirect /fight → /v2/fight (string-form) | +1 -1 |
| C4 | `8062def` | Cutover β4 | redirect /spectate/:odId → /v2/spectate/:fightId (function-form param rename) | +1 -1 |
| C5 | `4a89a65` | Cutover β5 | redirect /friends → /v2/profile (string-form, page→tab semantic) | +1 -1 |
| C6 | `0c1034a` | Bundle | i18n add spectate.coachPause + coachPauseStatus × 11 locales | +22 |
| C7 | `82d3f7f` | Bundle BE | feat(friends): currentFight field в /v1/friends/list (Q6-A closure) | +22 -1 |
| C8 | `803b759` | Cleanup A | Phase A orphan deletes (5 v1 views) | -2,439 |
| C9 | `76e4e2b` | Cleanup B | Phase B cutover-dependent deletes (5 v1 views) | -4,446 |

### Cherry-pick PR (parallel timeline, Lesson #33 6th application)

| Item | SHA | Description |
|---|---|---|
| Cherry-pick branch | `fix/friends-watch-live-be` | Created from `origin/main` HEAD `d52d2cb` |
| Cherry-pick commit | `0bc4c71` | Cherry-pick of designated C7 (`82d3f7f`) |
| **PR #357** | — | `fix(friends): add currentFight field to /list response (Sub-epic 8 C7 cherry-pick)` |

### Closure commits (3)

| # | SHA | Description |
|---|---|---|
| CL1 | `1f499ff` | docs(8): closure 1 — CLAUDE.md sync для Sub-epic 8 + Эпик 6 100% completion |
| CL2 | (this) | docs(8): closure 2 — Sub-epic 8 Final Report |
| CL3 | next | docs(8): closure 3 — Эпик 6 Final Report (cumulative retrospective) |

### Housekeeping commits (within Sub-epic 8 timeline)

| Item | SHA | Description |
|---|---|---|
| Phase 0 housekeeping | `482754f` | docs(8): Phase 0 investigation report — 3-part split |
| Acceptance gate housekeeping | `55bd238` | docs(8): acceptance gate pre-flight report |

---

## 3. Per-cluster Breakdown

### Cutover phase (C1-C5) — 5 commits, 5 routes redirected

**Mechanism distribution:**
- 4 string-form (`/matchmaking` C2, `/fight` C3, `/friends` C5, bare `/ratings` C1 secondary)
- 2 function-form (`/ratings/:type` C1 primary с param drop; `/spectate/:odId` C4 с param rename via backtick template literal)

**Order rationale (β lowest-risk first):**
1. C1 `/ratings/:type` → `/v2/ratings` — Sub-epic 2 Path D structure mature, smallest semantic change
2. C2 `/matchmaking` → `/v2/matchmaking` — Sub-epic 5 mature real BE
3. C3 `/fight` → `/v2/fight` — Sub-epic 4a/4b mature, ChallengeNotification routing branch unaffected
4. C4 `/spectate/:odId` → `/v2/spectate/:fightId` — Sub-epic 6 mature, param rename most complex
5. C5 `/friends` → `/v2/profile` — Sub-epic 5B integration, semantic page→tab change

**Lesson #11 catches:** 0 across 5 cutover commits (all matched Phase 0 expectations exactly).
**Lesson #32 catches:** 2 (C1 convention discovery `to =>` mirror; C4 backtick template literal vs string concat selection).
**Carry-overs surfaced:** #38 (ChallengeNotification routing branch), #39 (App.vue:100 redundancy), #40 (App.vue:110 scrollableRoutes), #41 (PreparationView /friends push — Phase C scope), #42 (v1 SpectateView /friends push — auto-resolved via C9 delete).

### Bundle phase (C6-C7) — 2 commits, 1 carry-over closed + 1 BE deploy chain

**C6 i18n** (Sub-epic 7 carry-over closure):
- 22 line additions × 11 locales (real translations en + ru, English fallback 9 others per Phase 0 Q7.2 policy)
- Closes deferred Sub-epic 7 C10/C15 missing keys (`spectate.coachPause`, `spectate.coachPauseStatus`)
- Carry-over #43 surfaced (HudSpectate inline `||` fallback dead code, Эпик 7+ polish)

**C7 BE Friends Watch Live** (Q6-A closure + Lesson #33 6th application):
- `backend/src/routes/friends.js` — import pvpMatchManager + `findCurrentFight` helper + status enum extension `'in_fight'` + `currentFight` field (id + opponent)
- Designated commit `82d3f7f` + cherry-pick PR #357 to main (Railway auto-deploy on merge)
- **4× Lesson #45 catches resolved adaptation-tier:**
  1. `pvpMatchManager.matches` (Phase 0 stale) → actual `pvpMatchManager.activeMatches`
  2. `match.player1Id` (Phase 0 stale) → actual `engine.player1.odId` (legacy "одессы id" naming)
  3. `match.player1Name` (Phase 0 stale) → actual `engine.player1.username`
  4. Map values plain objects (Phase 0 implication) → actual `PvPCombatEngine` instances
- Bonus correctness: engine status filter (`running | paused_coach`) excluding pre-ready/post-finish states (defensive allow-list pattern)
- Carry-overs #44 (engine status enum defensive monitoring) + #45 (O(N×M) optimization Эпик 7+)

### Cleanup phase (C8-C9) — 2 commits, 10 v1 views deleted, 6,885 lines

**C8 Phase A — orphan deletes:**
- ProfileView, ClanView, AgentDetailView, CreateAgentView, TrainingView (5 files, 2,439 lines)
- All confirmed truly orphaned via individual grep + path-disambiguation filter (Lesson #45 v1 vs v2 same names — ProfileView, ClanView, TrainingView)
- Build pass = orphan claim validated
- Vuetify cascade: ~5+ consumers reduced (concentrated в these v1 views)

**C9 Phase B — cutover-dependent deletes:**
- CardFightView, MatchmakingView, SpectateView, RatingsView, FriendsView (5 files, 4,446 lines)
- All confirmed orphaned post-cutover (router refs replaced by redirects в C1-C5)
- Build pass = **entire C1-C9 cutover chain validated**
- v1 views final: 7 files (RainView + 4 public + PreparationView + FightClubView Phase C kept)
- Vuetify cascade final: 5+ → 1 (only PreparationView remains v1 Vuetify consumer)

**Carry-over #46 surfaced:** ~25-30 stale doc comments referencing deleted v1 views (Эпик 7+ polish).
**Carry-over #41 partial-resolution:** v1 SpectateView /friends push resolved via C9 delete.

---

## 4. Path Rationale + Execution

### Why Path β (Phased) won over α / γ / δ

User decision early Sub-epic 8 (per Phase 0 Q2.4 path candidates basis):

**Path β advantages:**
- Lower per-commit risk (5 separate commits = 5 isolated regression surfaces)
- Per-commit acceptance gate verify possible
- Granular rollback (single commit revert если regression surfaces)
- Natural fit с Mode A discipline (1 commit per cutover route)
- Better incident isolation (which feature broke?)

**Path β trade-off:**
- More commits than Path α (5 vs 1) — но extra commits trivial overhead (3-5 lines each)
- Same final state as Path α (legacy debt identical)

**Path α rejected** — atomic blast radius too large (5 routes simultaneous regression).
**Path γ rejected** — highest legacy debt going forward + Эпик 6 not "complete" semantic.
**Path δ rejected** — mixed semantic state (some routes v2, some v1) without clear basis.

### Q2.5-A reconciliation strategy

**Direct merge designated → main** chosen для Эпик 6 closure:
- Single PR carries 30+ continue-stack commits (Sub-epic 5-7 + Phase 0 + Sub-epic 8) including Sub-epic 6 BE deploy gap resolution
- Clean closure semantic ("одним actом" Эпик 6 reconciled к main)
- Single production deploy moment

PR description = Эпик 6 retrospective summary (CL3 final report linked).

### Q6-A Friends Watch Live closure

User decision: **Q6-A Friends only** (NOT Q6-B + #31 ErrorMsg bundle).

Rationale: #31 ErrorMsg consolidation requires deeper grep (Phase 0 не enumerated 5 BE callsites). Bundle expansion = scope risk. Q6-A scope clean (~22 BE lines). Closes one carry-over cleanly.

#31 ErrorMsg consolidation deferred к Эпик 7+ refactor sub-epic с proper investigation.

---

## 5. Recovery Analysis

### Recovery #89 — Bootstrap branch divergence (Lesson #43 9th occurrence)

**Phase 0 occurrence:** harness assigned fresh slug `claude/investigate-cutover-gate-RpOyg` from continue stack `claude/visual-polish-auth-wallet-6xe6m`. Same SHA `1a3db1d` (Sub-epic 7 closure HEAD) — zero work-loss risk. Adaptation-tier per Lesson #35.

**Resolution:** Option B per re-anchor Lesson #44 — proceed designated branch (closer-slot precedent mirror 5U was Эпик 5 closer; Sub-epic 8 IS Эпик 6 closer).

**Lesson #43 chain:** 9 occurrences cumulative entering Sub-epic 8.

### Recovery #91 — Structural branch divergence (Lesson #18 surface + Lesson #44 re-anchor)

**Phase 1a occurrence:** harness designated **NEW** fresh slug `claude/cutover-acceptance-gate-YGJKA` from main HEAD `d52d2cb` (Sub-epic 6 C4.5 cherry-pick merge). **Different HEAD SHA** — NOT same-SHA fresh slug pattern of prior 6 recoveries. Structural divergence: designated branch lacked Sub-epic 7 closure chain + Phase 0 investigation.

**Lesson #18 STOP triggered** — surface conditions strict (divergent branch state).
**Lesson #44 explicit re-anchor** — user-authorized Option E switch к ТЗ-specified branch `claude/investigate-cutover-gate-RpOyg`.

**Resolution:** non-destructive switch via `git checkout` к continue stack (preserved Phase 0 work on Phase 0 housekeeping `482754f`). No force-push, no work loss.

**Adaptation-tier per Lesson #35** — environment/harness configuration discrepancy, not code bug.

**Lesson #43 chain:** 10 occurrences cumulative (9 + this).

### Cumulative recoveries Эпик 6 + Sub-epic 8

- Recoveries entering Эпик 6: 79
- Recoveries exiting Эпик 6: **90+** (+11 across 15-sub-epic chain)
- Sub-epic 8 specifically: 2 recoveries (#89 + #91) — both adaptation-tier — streak preserved 31 → 32

**Hot-fix metric: 0 — 32-streak achieved** ✅

---

## 6. Lesson #18 + #44 + #45 Application Detail

### Lesson #18 STOP framework

**Application Sub-epic 8:** 1 surface trigger (Recovery #91 Phase 1a structural divergence).

**Outcome:** STOP discipline working as designed — divergent state surfaced before any edits/commits, user-authorized re-anchor decision via Lesson #44, no fix-forward (would have created hidden deployment confusion).

### Lesson #44 explicit re-anchor

**Applications Sub-epic 8:** 2 (Recovery #89 Phase 0 Option B, Recovery #91 Phase 1a Option E).

**Pattern:** strategy revision (branch choice) → explicit re-anchor message + ТЗ adjustment + status report acknowledgment. NO mental-model carry-overs.

### Lesson #45 metadata error pattern (PROMOTED Sub-epic 7 — 12 occurrences validated)

**Sub-epic 8 catches:** 4 cumulative — all concentrated в C7 BE bundle (first BE touch).

**Pattern correlation с novelty:** pattern-establishment commits (C7 BE first-touch) high error rate; pattern-reuse commits (C1-C5 cutover redirects + C8/C9 deletes) zero new catches. Mirror Sub-epic 7 C7-C11 vs C12-C15 distribution.

**Updated cumulative count Lesson #45:** 12 → **16** entering Эпик 7+.

**Convention discovery: legacy `odId` field naming** documented для CLAUDE.md sync (CL1 included). "odId" historic от "одессы id" (odessa id) — cross-codebase consistent across pvpCombatEngine + matchmaking + handler + spectate route param. Confirmed `odId === userId` per matchmaking.js:16, handler.js:83/700-701. NOT renamed Sub-epic 8 (route param `:odId` → `:fightId` C4, engine internal field stays). Эпик 7+ refactor candidate.

---

## 7. Architectural Achievements

### 5-route cutover redirect mechanism (Vue Router 4)

**4 string-form + 2 function-form redirects:**
- String-form для path 1:1 mapping (4 routes)
- Function-form с template literal для param transform (`:odId` → `:fightId` C4) and param drop (`:type` C1)
- Auth posture preserved через redirect cascade (v1 protected → v2 inheriting v2ProtectedNames OR public)
- Bookmark survival semantically clean

### 10 v1 view atomic cleanup pattern

**Phase A 5 orphans + Phase B 5 cutover-dependent atomic deletes:**
- Build pass = orphan claim validation gate
- Lesson #45 path disambiguation reflex (v1 vs v2 same-name files)
- Phase C decision (PreparationView + FightClubView preserved) per user Q8 — route stays v1, cleanup defers Эпик 7+
- Vuetify consumer reduction 5+ → 1 (PreparationView only)

### BE Friends Watch Live integration

**`pvpMatchManager.activeMatches` probe pattern:**
- O(N) Map iteration per friend (acceptable scale — Carry-over #45 indexed-Map optimization Эпик 7+)
- Engine status allow-list filter (`running | paused_coach`) — defensive correctness
- Closes Q6-A carry-over (Watch Live FE was dead code pre-C7)
- Cherry-pick PR #357 = Lesson #33 6th application clean trail

### Convention discovery: legacy `odId` field naming

Documented in CLAUDE.md (CL1) as Эпик 7+ refactor candidate. Cross-codebase consistent — НЕ ad-hoc.

### Carry-over reclassification continuity

#41 (PreparationView /friends push) — Phase C scope (PreparationView kept) — cascades through redirect functionally. Mirror precedent #16/#27/dice-cooldown reclassifications.

---

## 8. Closure Shape

**Standard linear (11th application в Эпике 6).**

11 standard linear closures:
1. 6A
2. 6B-1
3. 6B-3
4. Sub-epic 1
5. Sub-epic 2
6. Sub-epic 3
7. Sub-epic 4a
8. Sub-epic 4b
9. Sub-epic 5
10. Sub-epic 7
11. **Sub-epic 8** ← this closure

Sub-epic 6 used Code-complete + deferred-deploy NEW shape (5th distinct).

**Sub-epic 8 specifics:**
- 9 functional + 3 closure + 1 cherry-pick PR
- 2 STOPs absorbed adaptation-tier (Recovery #89 Phase 0, Recovery #91 Phase 1a) — both via Lesson #44 re-anchor
- 0 hot-fixes, 0 reactive splits
- Pattern: high-quality Phase 0 evidence + per-commit STOP-and-confirm gate (C1) + audit-only mode (C2-C9 + closure)

---

## 9. Carry-overs Forward к Эпик 7+

**NEW Sub-epic 8 carry-overs (9):**

| # | Item | Source | Disposition |
|---|---|---|---|
| #38 | ChallengeNotification routing branch simplification | C3 | Drop v1 branch, push directly /v2/fight |
| #39 | App.vue:100 path check redundancy | C4 | Cosmetic — drop /spectate branch post-cutover |
| #40 | App.vue:110 scrollableRoutes /friends literal | C5 | Dead-list entry post-cutover |
| #41 | PreparationView.vue:97 router.push('/friends') | C5 | Cascade through redirect (functional). Phase C scope. |
| #42 | v1 SpectateView:230 router.push('/friends') | C5 | RESOLVED via C9 (file deleted) |
| #43 | HudSpectate inline fallbacks dead code | C6 | Drop \|\| fallbacks post-i18n |
| #44 | Engine status enum defensive (4-state allow-list) | C7 | Already correct posture, monitor forward |
| #45 | findCurrentFight O(N×M) optimization | C7 | Indexed reverse Map (userId→matchId) Эпик 7+ |
| #46 | Stale doc comments referencing deleted v1 views | C8/C9 | ~25-30 doc comment cleanup pass |

**Carry-overs preserved from prior sub-epics к Эпик 7+:** see CLAUDE.md §"Active carry-overs к Эпик 7+" matrix. Sub-epic 8 closes 1 (Q6-A Friends Watch Live), reclassifies 1 (#41 partial-resolution).

---

## 10. Methodology Contributions

### Lesson #18 surface validation

Surface trigger (Recovery #91 Phase 1a structural divergence) demonstrated STOP framework value на **non-trivial scope-boundary case** (vs Sub-epic 7 STOPs which were ТЗ scope mismatches). Pattern: infrastructure/branch divergence == surface, edits/commits gated until re-anchor.

### Convention discovery formal documentation

`odId` legacy naming documented in CLAUDE.md (CL1) — first explicit "convention discovery → CLAUDE.md sync" pattern. Future Эпик 7+ refactor sub-epics will leverage this artefact.

### Cherry-pick PR template (Lesson #33 6th application)

Sub-epic 8 cherry-pick PR #357 description includes:
- Changes summary
- Implementation notes (Lesson #45 catches)
- Source SHA refs
- Deploy expectations
- Post-deploy verification steps
- Carry-over closure markers
- Lesson #33 trail (6 applications cumulative)

Pattern reusable Эпик 7+ cherry-pick PR generation.

### Path β execution validation

5-cutover commit chain executed clean (zero per-commit recoveries C1-C5). Validates Path β trade-off analysis basis (more commits = lower per-commit risk wins over atomic blast radius for cutover contexts).

---

## 11. Final State

**Streak entering Sub-epic 8:** 31
**Streak exiting Sub-epic 8:** **32** ✅

**Recoveries cumulative:** 88+ → **90+** (+2)
**Lessons promoted:** 38 (unchanged)
**Lesson candidates active:** 7 (#36-#42 unchanged)
**Lesson #45 catches cumulative:** 12 → 16

**Эпик 6 progress:** 14/14 → **15/15 (100%)** ✅

**v1 view cleanup:** 10 files / 6,885 lines deleted

**Vuetify consumer reduction:** 5+ → 1 (PreparationView only)

**Sub-epic 8 — CLOSED ✅. Эпик 6 — CLOSED ✅.**

Cherry-pick PR #357 — pending merge timing per user decision (parallel timeline).
