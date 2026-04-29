# HANDOFF — Sub-Epic 5R (Pre-flight chat handoff)

> **Mode A strict.** Single PR target к `visual-v2`. Continue stack `claude/setup-5e-shop-mode-a-khIAi` (5E-5Q-...).
> **Predecessor:** 5Q ✅ CLOSED (Phase 4 commits `345bbb1` + `8cfb0c4`; this handoff = Phase 5).
> **Audit progress:** **18/22 done (82%)** — **four-fifths milestone reached.**

> **Note on atypical splits in 5Q closure:** P4 (FINAL_REPORT) shipped в 2 commits `345bbb1` + `8cfb0c4`. P5 (this HANDOFF) shipping в 2 commits 5A + 5B. **Three Anthropic API stream idle timeouts в 5Q** (P4×2 in previous chat session, P5×1 in this session) confirm infrastructure pattern persistence. Sentinel splits adopted preventively for P5+P6 — infrastructure-driven recovery, NOT 5P file-size threshold violation. Mode A discipline preserved между sub-commits.

---

## §1 Где сейчас

**5Q = ζ Retirement (feature work).** 2 functional commits + 1 skipped + 4 docs (atypical split):

- **P1** HudRetirement.vue (NEW, 376 lines, pure-presentational) + masterState `fetchRetirementStatus` + `retire` actions — `04aca63`
- **P2** HudProfile integration (Settings-adjacent full-width card row, 5J SocialTasks pattern mirror) — `94bc82e`
- **P3** i18n conditional check — SKIPPED, 0 gaps confirmed via re-grep (10 unique keys × 11 locales)
- **P4** FINAL_REPORT (atypical split A+B due API timeout) — `345bbb1` + `8cfb0c4`
- **P5** HANDOFF_5R (atypical split A+B due API timeout) — this handoff

**Critical Lesson #18 STOP в P1:** Original ТЗ §2.5 recommended self-contained HudRetirement with direct apiClient (mirroring legacy `RetirementPanel.vue`). Pre-edit verification revealed HUD-v2 + apiClient direct = **NO precedent across 7+ HUD-v2 components.** Convention conflict escalated to design-Claude. Decision Option B confirmed: Vuex action wrappers + pure-presentational HUD per HUD-v2 mainstream convention. Recovery #57 logged. Saved 5Q from establishing wrong convention precedent.

**Audit §4.2 #16 (Retirement) closed.** Audit progress: 17/22 → 18/22 (82%) — four-fifths milestone.

**12-streak preserved entering 5R** (5E-5Q all clean). P4+P5 splits = planned infrastructure-driven recoveries, explicitly NOT counted as hot-fix events per design-Claude prep. Goal: **13-streak after P6** if P6 lands clean.

**Branch:** `claude/setup-5e-shop-mode-a-khIAi`. **HEAD entering this commit:** `8cfb0c4` (P4 4B closure). HEAD post-P5-5A: TBD this commit. HEAD post-P5-5B: TBD next commit. HEAD post-P6: 5Q final tip.

**Recoveries 55 → 57** (+2 architectural в 5Q):
- **#56** — Q1 prototype assumption empirically opposed (no retirement scene в prototype, design fresh per Hexlash design tokens)
- **#57** — refinement-time Lesson #30 sub-pattern mis-classification (escalated by Claude Code Lesson #18 STOP, Option B confirmed by design-Claude)

NOT counted as separate recoveries (tactical refinements per recovery transparency principle): Vuetify grep false-positive в P1, P1 i18n key count imprecision (9 vs 10) caught в P3 re-grep.

---

## §2 Lessons inherited (35 cumulative)

5Q added **0 new formal lessons.** One refinement remains pre-formal:

**Lesson #30 sub-pattern (still pre-formal, awaits second valid test):**
> When extracting component to mirror sibling decomposition, don't force prop/emit symmetry if child's data ownership model differs. Sibling shapes that lift state to parent (props-from-Vuex pattern) ≠ universal child shape — depends on whether child **consumes upstream data** (lift to parent, child = pure-presentational) OR **owns local state** (self-contained child, no parent state to lift).

5P P3 HudClanEmpty = first instance (UI-state self-containment). 5Q P1 HudRetirement attempted as second test but **FAILED scope match** (data-fetch self-containment ≠ UI-state self-containment, recovery #57). Pre-formal continues, awaits real second UI-state instance.

**Likely candidates for second test:** η Onboarding component split (if local tutorial state ownership) OR θ MoveTree extract (if local hover/selection state ownership without parent Vuex coupling).

**Lesson #35 second empirical validation completed in 5P** (setError × 9 + setInfo × 7 both held). Master state phantom mutation family CLOSED via proactive scope-boundary check — no future surface from this line.

**Possible future formalization (5Q meta-observation, NOT yet formal):** "ТЗ refinement may introduce false-positives — pre-edit verification reflex applies to refinement assumptions, not just original ТЗ assumptions." 5Q P1 demonstrated this empirically (refinement-time sub-pattern mis-classification). Awaits second instance before promotion to formal Lesson #36/37.

---

## §3 Carry-overs forward к 5R (6 items)

| # | Item | Source | Priority | Type |
|---|---|---|---|---|
| 1 | Backend `/v1/agent/list` 500 fix | 5M P4 → 5O Q1 → 5P Q1 → **5Q Q1 (4th consecutive defer)** | **HIGH — explicit decision required** | Strategy A/B/C/D framework verbatim в §4. Recommended: tackle dedicated в 5R. NOT "TBD per user preference" — 4th defer warrants explicit decision in 5R startup. |
| 2 | Animation для retirement confirmation | 5Q dropped (was Phase 5/6 pre-investigation scope) | Low | UX polish. Candidate 5R+ standalone or bundled with similar polish items. |
| 3 | Achievement badge для first retirement | 5Q dropped (was Phase 5/6 pre-investigation scope) | Low | Requires backend extension first (new achievement type). Pre-investigation needed. Candidate 5R+ with backend pre-flight. |
| 4 | Legacy `RetirementPanel.vue` orphan cleanup | 5Q legacy preservation (5L precedent applied) | Low | Explicit removal candidate 5R+. File untouched в 5Q. Single-file delete + import audit. |
| 5 | HudProfile card-creep observation | 5Q P2 surfaced | Architectural concern | 6 cards now (Identity/Performance/Friends/Settings/Retirement/SocialTasks). Future architecture concern (section grouping? subdivision?). NOT a blocker. Document для 5R+ awareness. |
| 6 | i18n cross-section key reuse | 5Q P3 surfaced | Minor finding | `t.clan.lblHasClan` reused в retirement context. Possible future i18n architecture decision (cross-section reuse vs duplication). Minor finding, not actionable in 5R startup. |

**Carry-over count drastically increased vs 5Q entry:** 1 entering 5Q → **6 leaving 5Q.** Most are Low priority (items 2/3/4/5/6 — polish/observation/minor). Only item 1 (Q1 backend) demands explicit 5R decision.

**Master state phantom mutation family — CLOSED in 5P** (Lesson #35 scope-boundary proactive check). No new defers from this line.

---

## §4 Q1 backend strategy options (4th-defer warrants explicit section)

**This is the 4th consecutive defer of Q1 backend `/v1/agent/list` 500.** 5M P4 → 5O Q1 → 5P Q1 → 5Q Q1. Continued passive defer creates indefinite drift risk. **5R MUST decide proactive strategy OR continue defer with explicit reasoning + acknowledged drift acceptance.**

Strategy framework transferred verbatim from HANDOFF_5Q (`1a7a820`):

### Strategy A — Wait for runtime access (passive)

User installs Vercel CLI / kubectl / configures production env vars. 5R simply re-checks pre-flight Q1; if access surfaced → proceed, otherwise 5th defer.

**Risk:** indefinite drift cycle. Each subsequent defer accumulates blind spot. **At 4th defer, drift acceptance becomes formal liability.**
**Effort:** zero (until access materializes).

### Strategy B — Backend instrumentation (proactive observability)

Add Sentry / datadog instrumentation в `backend/src/routes/agent.js` (specifically `GET /v1/agent/list` handler — currently logs to `console.error` only). Deploy via GitOps (test branch). Trigger 500 via real user actions, observe stack trace через deployed monitoring dashboard.

**Risk:** medium — requires Sentry/datadog account setup + deploy chain (Lesson #33). Adds dependency.
**Effort:** ~5-8 commits (instrumentation + deploy + observe + fix).

### Strategy C — Local backend stack reproduction

Claude Code reported `docker` present in 5P pre-flight Q1. `backend/.env.example` exists. Strategy: build local Postgres + backend stack via docker-compose, seed DB, hit `/v1/agent/list` locally, observe error.

**Risk:** medium-low — local repro may not match prod state (migration drift, data-specific edge cases). But 80%+ catches likely.
**Effort:** ~3-5 commits (stack setup + repro + diagnose + fix).

### Strategy D — Defensive blind fix (speculative)

Last touch to agent.js was `867a19e` (5H era) — added endpoints, not regression candidate. Other suspects:
- 5K Daily Tasks added `scope` field on DailyTask (manual SQL migration) — possible drift if not deployed
- Schema changes between 5K and now — verify migration log on prod

Strategy: Run `prisma migrate deploy` defensively + binary search recent backend commits + speculative fix per most-likely candidate.

**Risk:** medium — blind without observability, may worsen state.
**Effort:** ~2-4 commits (audit + speculative fix + monitor).

### Recommendation для 5R

**Strategy C** (local reproduction) preferred over D (blind) — reproducibility > speculation. **Same recommendation as 5Q (which was deferred again).**

Strategy B (instrumentation) is good long-term value but adds infrastructure dependency.

Strategy A (passive defer) **acceptable in 5R only with explicit "no more carry-over deferral, accept drift" acknowledgment** — at 4th defer, formal liability framing required to prevent indefinite drift.

**User decision required в 5R startup before pre-flight investigation.** Options X/Y/Z в §6 framed around this decision.

---
