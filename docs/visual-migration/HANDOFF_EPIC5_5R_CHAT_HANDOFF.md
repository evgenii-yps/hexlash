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

## §5 Feature options ranked

С 6 carry-overs entering 5R (1 HIGH gated на Q1 strategy + 5 Low items), feature work путь viable но требует Q1 decision FIRST.

### Option Y — Feature γ AI Trainer (post-fight overlay)

Post-fight scene с AI-generated commentary on player performance. Audit §4.2 candidate.

**Why:** accumulated demand since pre-Epic 5 plan. Adds visible value. Backend has Claude API integration (CLAUDE.md AI Trainer §, ТЗ-18/19/20 era).
**Risk:** medium. Requires fight integration + new HUD + new Vuex state (post-fight context).
**Size:** M (~6-8 commits).
**Streak risk:** moderate — new HUD pattern, new Vuex slice, fight result hook.

### Option E — Feature ε FightClub level + Morning Report

FightClub UI surface (level bar, Morning Report card). Backend ready (ТЗ-18/19/20 in CLAUDE.md).

**Why:** backend already implemented. Frontend wiring pending.
**Risk:** **medium-high. AI integration + scope ambiguity (Lv1/Lv2/Lv3 tiering).**
**Size:** M-L (~7-10 commits).
**Streak risk:** **HIGH** — scope ambiguity makes this anti-recommendation for streak-focused 5R.

### Option F — Feature η Onboarding (first-time user)

New user flow / tutorial. UX gap currently.

**Why:** UX gap. Player onboarding currently absent.
**Risk:** **medium. Design ambiguity, scope creep candidate.**
**Size:** M (~6-8 commits).
**Streak risk:** medium-high — design ambiguity.
**Note:** η is candidate for Lesson #30 sub-pattern second test if local tutorial state ownership pattern emerges.

### Option G — Feature θ MoveTree (deeper progression)

Move research depth. Completes per-agent progression UX (5K Daily Tasks closed adjacent system).

**Why:** Research Gate backend ready (CLAUDE.md ТЗ-04). Frontend incomplete.
**Risk:** **medium-high. Major UX rework.**
**Size:** L (~8-12 commits).
**Streak risk:** **HIGH** — L-size, deeper UX rework, less streak-friendly.
**Note:** θ is candidate for Lesson #30 sub-pattern second test if MoveTree extract pattern emerges with local hover/selection state ownership.

### Option Z — Cleanup batch

5R-tier polish/orphan cleanup. Bundles items 4 (RetirementPanel orphan removal), possibly item 5 (HudProfile card-creep architectural action), and any small i18n/aria-label residuals.

**Why:** mechanical-batch sub-epic precedent (5O/5P pattern). Streak-friendly. Removes legacy debt.
**Risk:** low (mechanical) per 5O/5P precedent.
**Size:** S (~3-4 commits).
**Streak risk:** **LOW.**

### Option X — Q1 backend dedicated (Strategy C from §4)

Address 4th-defer carry-over via local repro + diagnosis.

**Why:** unblocks 5M visual verify, removes single-item HIGH carry-over. **Strategy C alignment from §4** — local docker-compose repro per Claude Code Q1 finding (`docker` present + `.env.example` exists).
**Risk:** medium per Strategy C (lower than Strategy D blind speculation).
**Size:** S-M (~3-5 commits per Strategy C).
**Streak risk:** medium — backend touch (Lesson #33 deploy-environment awareness applies). Repro work may not commit-yield linearly.

---

## §6 Recommended next sub-epic

**Three strong candidates** (user decision required, depending on Q1 strategy choice from §4):

### Recommendation 1 — Option X (Q1 backend dedicated, Strategy C)

**Why:** **4th defer warrants action.** Strategy C local repro + diagnose. Closes single HIGH carry-over. Aligns with §4 recommendation.

**Trade-off:** medium streak risk (backend touch), but breaks the defer cycle.

### Recommendation 2 — Option Y (γ AI Trainer)

**Why:** clean ledger achieved on Low priority items, backend infrastructure ready (Claude API integrated). Feature work that doesn't introduce infrastructure dependencies. Streak-friendly (M sub-epic, well-scoped if HUD pattern aligned with 5L-5Q precedent).

**Trade-off:** if user chooses passive Q1 defer (Strategy A с formal drift acceptance), this becomes default primary path.

### Recommendation 3 — Option Z (Cleanup batch)

**Why:** S-size, LOW streak risk, mechanical-batch precedent (5O/5P pattern). Closes RetirementPanel orphan + HudProfile card-creep + minor i18n residuals в один coherent batch. **Streak-protective if user prefers low-risk path entering 5R.**

**Trade-off:** doesn't address Q1 (still passive defer); doesn't add visible feature value.

**Anti-recommendations:**
- **Option E (ε FightClub)** — scope ambiguity (AI Lv1/Lv2/Lv3 tiering) elevates 12→13-streak risk. Defer.
- **Option F (η Onboarding)** — design ambiguity, scope creep candidate. Defer until design framework solidified.
- **Option G (θ MoveTree)** — L-size, deeper UX rework, less streak-friendly. Defer.

**Decision tree для 5R startup:**
1. User chooses Q1 strategy (A/B/C/D from §4) FIRST.
2. If Strategy C/D (active) → Option X primary.
3. If Strategy A passive (with formal drift acceptance) OR Strategy B (long-term parallel) → Option Y or Z primary.

---

## §7 Pre-flight Q1-Q3 templates per option

### Option X pre-flight (Q1 backend Strategy C — local repro)

```bash
# Q1 — docker-compose presence
ls docker-compose*.yml backend/docker-compose*.yml 2>/dev/null

# Q2 — backend startup deps (Postgres, Prisma generate)
cat backend/package.json | grep -A20 "scripts"

# Q3 — .env.example shape
cat backend/.env.example

# Q4 — recent migrations log (drift suspect)
ls backend/prisma/migrations/ | tail -10

# Q5 — agent.js GET /list handler shape
grep -A20 "router.get.*['\"]/list['\"]" backend/src/routes/agent.js
```

### Option Y pre-flight (γ AI Trainer)

```bash
# Q1 — backend Claude API integration shape
grep -rn "anthropic\|claude" backend/src/services/ backend/src/routes/ 2>/dev/null | head -10

# Q2 — frontend AI Trainer scope (legacy AiTrainerAnalysis.vue)
grep -rn "AiTrainer\|aiTrainer" src/components/ src/views/ src/views-v2/ 2>/dev/null | head -10

# Q3 — fight result hook (where to insert post-fight AI overlay)
grep -n "fight_end\|fightEnd\|onFightEnd" src/scene/scenes/ src/views-v2/FightView.vue 2>/dev/null | head -10

# Q4 — Claude API config
grep -A5 "ANTHROPIC\|CLAUDE_API" backend/src/config.js
```

### Option Z pre-flight (Cleanup batch)

```bash
# Q1 — RetirementPanel.vue orphan check (consumers)
grep -rn "RetirementPanel" src/ 2>/dev/null

# Q2 — HudProfile.vue card-creep current state
grep -c "profile-card" src/components/hud/HudProfile.vue
ls -la src/styles/v24/profile.css

# Q3 — minor i18n residuals (cross-section reuse points)
grep -rn "t\.clan\.lblHasClan\|cross-section" src/components/hud/ 2>/dev/null | head -5
```

### Options E/F/G pre-flight

Defer detailed templates until user prioritizes (anti-recommendations). Each requires fresh investigation pass.

---

## §8 Startup checklist для Claude Code

1. **Pre-flight branch verify** — `git branch --show-current` should be `claude/setup-5e-shop-mode-a-khIAi`. If harness slug fresh-spawn → Blocker A precedent (5J-5Q): report blocker, escalate decision, wait approval before switch. **8 consecutive continue-stack decisions** is established convention; expect same for 5R.
2. **Verify HEAD** — should match P6 CLAUDE.md commit SHA (5Q closes with P6 architectural sync, expected to land via split A+B per infrastructure pattern). Post-P6 SHA TBD; check `git log --oneline | head -5` (expect commits 6A + 6B + 5B + 5A trail).
3. **Tree clean check** — `git status --short` empty.
4. **Read mandatory files:**
   - `CLAUDE.md` — Sub-Epic 5Q section (added in P6)
   - `docs/visual-migration/EPIC5_5Q_FINAL_REPORT.md` — full closure (split shipped 4A `345bbb1` + 4B `8cfb0c4`)
   - `docs/visual-migration/HANDOFF_EPIC5_5R_CHAT_HANDOFF.md` — this file (split shipped 5A `825a5fd` + 5B post-this-commit)
   - `docs/visual-migration/VISUAL_MIGRATION_PLAN.md` — overall plan
   - 1-2 prior FINAL_REPORTs (5O/5P) for fresh context if extended absence
5. **Lessons review** — focus on **#30 sub-pattern (still pre-formal)** + #35 (validated 5O+5P) + #11/#18/#32/#33/#34 stable. Possible future Lesson #36/37 candidate: "ТЗ refinement-time false-positives" (5Q meta-observation, awaits second instance).
6. **User decision required FIRST** — **Q1 strategy choice (A/B/C/D от §4)** before feature option. 4th-defer warrants explicit decision; passive Strategy A only with formal drift acceptance.
7. **Then user chooses option** (X/Y/Z от §5/§6) per Q1 strategy decision tree (§6 tail).
8. **Run pre-flight Q1-Q3-Q5 (per chosen option)** — read-only, no commits, output as text reply.
9. **Wait for ТЗ from design-Claude** — no code, no commits before ТЗ.

---

## §9 Closing

5Q closed clean. **Four-fifths milestone reached** (18/22 = 81.8%). **12-streak preserved entering 5R** (P4+P5 splits = planned infrastructure-driven recoveries, NOT hot-fix events).

**Carry-over count: 6** (1 HIGH Q1 backend + 5 Low polish/observation items). Inverted from 5P closure (1 entering 5Q → 6 leaving 5Q = mostly Low items dropped from 5Q scope).

**Q1 backend at 4th defer.** Continued passive defer creates formal liability. 5R MUST decide Strategy A (passive с explicit drift acceptance), B (instrumentation), C (local repro recommended), or D (defensive blind fix).

**Lesson #18 STOP в 5Q P1 demonstrated value of pre-edit verification reflex** — saved sub-epic from establishing wrong convention precedent (HUD-v2 + apiClient direct). Recovery #57 documented as teachable moment about refinement-time false-positives.

**Lesson #30 sub-pattern still pre-formal** — 5Q P1 attempted second test but failed scope match (data-fetch ≠ UI-state self-containment). Awaits real second instance (η Onboarding or θ MoveTree as future candidates if their UI patterns surface local-state self-containment shape).

**Lesson #35 toolkit empirically robust** — 2 successful tests (5O setError + 5P setInfo), master state phantom mutation family CLOSED.

**Atypical splits in 5Q closure** (P4 + P5 due API stream timeouts) documented as infrastructure-driven recoveries in commit messages, FINAL_REPORT body, AND this handoff. **NOT 5P file-size threshold violation precedent.** P6 CLAUDE.md update will likely also split preventively per same infrastructure pattern.

**4 sub-epics remaining до Эпик 6 cutover** (5R + 5S + 5T + 5U if all small/medium). Lessons stable at 35. Recoveries cumulative 57.

**Goal для 5R:** **13-streak** (after P6 of 5Q + clean 5R run).
