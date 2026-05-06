# HANDOFF — Sub-Epic 5P (Pre-flight chat handoff)

> **Mode A strict.** Single PR target к `visual-v2`. Continue stack `claude/setup-5e-shop-mode-a-khIAi` (5E-5N-5O-...).
> **Predecessor:** 5O ✅ CLOSED (Phase 4 commit — `15b5877`; this handoff = Phase 5).
> **Audit progress:** **16/22 done (73%)** — three-quarters milestone approached.

---

## §1 Где сейчас

5O = Carry-overs Polish Batch (Option ψ). Mechanical-batch sub-epic, 3 functional commits + 3 docs:

- **P1 i18n** `spectate.watch` key + HudProfile wire (11 locales) — `a3bb83b`
- **P2 mobile responsive** AutoFight @820px (file convention) — `1d0ba58`
- **P3 phantom mutation** `master/setError` × 9 → `setErrorMessage` + `ErrorMessageModel.withText()` — `ca1b924`
- **P4 FINAL_REPORT** — `15b5877` (this handoff = P5)

**Q1 backend `/v1/agent/list` 500 dropped** (root cause unobservable from frontend grep, requires runtime logs — Lesson #33).
**Item 5 HudClan no-clan branch split** optional skipped.

**11-streak achieved** (5E-5O all clean). Recoveries 50 → 54 (+4 в 5O: 3 Phase 2 + 1 Phase 3).

**Branch:** `claude/setup-5e-shop-mode-a-khIAi`. **HEAD:** `15b5877` (P5 commit will append; P6 CLAUDE.md commit progresses HEAD further). Confirm post-P6 SHA before 5P startup.

---

## §2 Lessons inherited (35 cumulative)

5O introduced **Lesson #35** (formalized triage discipline):

> **#35 — Lesson #11 reflex catch tiering: adaptation / bug-bundle / scope-boundary.**
>
> When pre-edit re-grep surfaces issues mid-Phase, classify:
> 1. **Adaptation-tier** — TZ assumption mismatch with codebase reality (selector name, breakpoint, base size, import style). Fix within Phase as conscious deviation. #18 NOT triggered.
> 2. **Bug-bundle-tier** — additional callsites of **same class, same mutation/factory pair** missed during investigation. Fix within Phase as expansion (5L Phase 2 + 5M Phase 1 precedent). #18 NOT triggered.
> 3. **Scope-boundary-tier** — **different class, different model, different mutation/factory pair** requiring its own pre-edit grep + import work. STOP within Phase. Carry-over forward. #18 IS triggered.

5O empirically grounded: Phase 2 = 3 adaptation-tier (selector/breakpoint/label no-op), Phase 3 = 1 scope-boundary-tier (`master/setInfo` phantom). Both behaviors matched tier prediction.

**Other lessons stable (5E-5N validated):**
- #11 verify shape — 54 cumulative recoveries
- #18 STOP at structural mismatch — operationalized via #35 tiering
- #19/20/21 exposure-aware tuning (preventive, 5L Phase 5 precedent)
- #22 HUD scoped selector match
- #30 pattern reuse semantic vs mechanical (toolkit growth: Path D invert default)
- #31 schema unique-key migrations require findUnique callsite audit
- #32 convention discovery reflex
- #33 deploy-environment awareness (frontend vs backend chain)
- #34 HUD overlay layout convention

---

## §3 Carry-overs (priority-ordered, 4 items)

| # | Item | Source | Size | Priority |
|---|---|---|---|---|
| 1 | Backend `/v1/agent/list` 500 fix | 5M P4 → 5O Q1 dropped | M | **HIGH** — unblocks 5M visual verify, requires runtime logs (Lesson #33) |
| 2 | `master/setInfo` × 5 phantom mutation | **5O P3 surfaced** | XS | Medium — same-class fix as 5O setError, different model `InfoMessageModel` |
| 3 | aria-label `"Watch live fight"` i18n | 5O P1 surfaced | XS | Low — accessibility scope |
| 4 | HudClan no-clan branch split | 5L → 5O optional | S | Low — polish |

**Recovery candidates beyond carry-overs** — observed in 5K-5N investigations, not yet actioned:
- 5K Daily Tasks visual verify still gated on backend deploy (test/main merge required) — Lesson #33
- Sub-360px viewport polish (no precedent codebase-wide) — defer к global mobile polish pass

---

## §4 Feature options ranked

### Option A — ψ-2 Continue carry-overs cleanup (RECOMMENDED if frontend-only preference)

Items 2 + 3 + 4 from §3 carry-overs. **XS + XS + S = predicted ~3-4 functional commits + 3 finals.**

**Why:** mechanical batch preserves 11-streak. Items 2 (setInfo) follows 5O setError pattern verbatim — `master/setInfoMessage` + `InfoMessageModel.withText()` (parallel structure already proven). Item 3 + 4 small.

**Risk:** low. ~5O-class scope.

### Option B — Q1 dedicated backend debugging

Just item 1: backend `/v1/agent/list` 500 fix. **Requires runtime log access** (Vercel/kubectl/DB inspect).

**Why:** unblocks 5M visual verify (medium-impact carry-over since 5M close).

**Risk:** medium. Backend touch + GitOps deploy + visual verify chain (Lesson #33). If logs reveal Prisma migration drift → may chain to 5K backfill issue.

**Pre-flight requires:** access to backend logs OR willingness to run `prisma migrate deploy` defensively.

### Option C — Feature γ AI Trainer (post-fight overlay)

5G/5H-class feature. Audit §4.2 #X (verify ranking). Post-fight scene с AI-generated commentary.

**Why:** accumulated since pre-Epic 5 plan. Adds visible value.

**Risk:** medium. Requires fight integration + new HUD + likely new Vuex state.

### Option D — Feature ζ Retirement

Agent retirement flow + UI. Audit §4.2 (verify ranking).

**Why:** existing legend/buff backend infra (per CLAUDE.md retirement service §). Frontend-side largely missing.

**Risk:** medium. UI + state + flow design.

### Option E — Feature ε FightClub level + Morning Report

FightClub UI surface (level bar, Morning Report card).

**Why:** backend already implemented. Frontend wiring pending.

**Risk:** medium-high. AI integration + scope ambiguity (Lv1/Lv2/Lv3 tiering).

### Option F — Feature η Onboarding (first-time user)

New user flow / tutorial.

**Why:** UX gap. Player onboarding currently absent.

**Risk:** medium. Design ambiguity, scope creep candidate.

### Option G — Feature θ MoveTree (deeper progression)

Move research depth.

**Why:** completes per-agent progression UX (5K Daily Tasks closed adjacent system).

**Risk:** L. Major UX rework.

---

## §5 Recommended next sub-epic

**Recommendation: Option A (ψ-2 carry-overs cleanup).**

Reasoning:
1. **11-streak preservation candidate** — mechanical batch low-risk
2. **Carry-over accumulation reaches 4 items** — risk of drift if не addressed in next sub-epic
3. **Item 2 (setInfo) is verbatim 5O Phase 3 pattern** — proven, mechanical, predicted clean
4. Items 3+4 small completions
5. **Q1 (Option B) blocked on log access** — if user has access, alternate priority

**Alternative: Option B (Q1 backend)** if backend logs accessible. Higher impact but higher risk.

**Skip Options C-G in 5P** — feature work needs fresh investigation pass, larger scope, distinct from polish discipline. Defer until carry-overs cleared OR until user explicitly prioritizes feature.

---

## §6 Pre-flight Q1-Q3 templates per option

### Option A pre-flight (ψ-2 carry-overs cleanup)

```bash
# Q1 — verify setInfo callsite count + shape
grep -rn "master/setInfo\b\|master/setInfo'" src/ | grep -v "setInfoMessage"

# Q2 — verify InfoMessageModel availability + factory
grep -n "InfoMessageModel\|setInfoMessage" src/core/state/modules/masterState.js
grep -B2 -A6 "withText" src/core/models/internal/infoMessageModel.js 2>/dev/null

# Q3 — verify aria-label "Watch live fight" location + i18n strategy decision
grep -n "Watch live fight" src/components/hud/HudProfile.vue

# Q4 — HudClan no-clan branch shape (verify split feasibility)
grep -n "no-clan\|noClan\|ClanCreate\|ClanBrowse" src/components/hud/HudClan.vue 2>/dev/null
```

Decision points:
- (Q1) **expected = 5** per 5O Phase 3 finding. If grep returns >5 → bug-bundle expansion (per Lesson #35 tier #2). If returns same model class only → mechanical 1:1 replacement.
- (Q2) verify `InfoMessageModel` exists + factory shape. If missing → may need to use `ErrorMessageModel` as parallel OR new model creation.
- (Q3) decision: add `spectate.watchLive` key OR skip i18n за рамок (out-of-scope accessibility task)
- (Q4) HudClan size now? Splittable rows present?

### Option B pre-flight (Q1 backend)

```bash
# Q1 — backend log access verify
# Check Vercel logs / Railway / kubectl for /v1/agent/list 500 stack trace

# Q2 — Prisma migration drift check
ls backend/prisma/migrations/ | tail -10

# Q3 — Schema vs deployed state
# Compare backend/prisma/schema.prisma vs prod DB schema
```

Decision points:
- (Q1) actual error stack trace identifies root cause (Prisma column missing? Auth failure? DB conn?)
- (Q2) recent migrations applied? `20260428000000_add_daily_*` (5K) deployed?
- (Q3) prod DB schema vs current Prisma schema — drift exists?

### Options C-G pre-flight

Defer detailed templates until user prioritizes specific feature. Each requires fresh investigation pass (audit §4.2 row + UX requirements gather + state design).

---

## §7 Startup checklist для Claude Code

1. **Pre-flight branch verify** — `git branch --show-current` should be `claude/setup-5e-shop-mode-a-khIAi`. If harness slug fresh-spawn → switch (5J/5K/5L/5M/5N/5O Blocker A precedent: report blocker, escalate, wait approval before switch).
2. **Verify HEAD** — should match P6 CLAUDE.md commit SHA (5O closes with P6 architectural sync). Post-P6 SHA TBD; check `git log --oneline | head -3`.
3. **Tree clean check** — `git status --short` empty.
4. **Read mandatory files:**
   - `CLAUDE.md` — Sub-Epic 5O section (added in P6)
   - `docs/visual-migration/EPIC5_5O_FINAL_REPORT.md` — full closure
   - `docs/visual-migration/HANDOFF_EPIC5_5P_CHAT_HANDOFF.md` — this file
   - `docs/visual-migration/VISUAL_MIGRATION_PLAN.md` — overall plan
   - 1-2 prior FINAL_REPORTs (5L/5M/5N) for fresh context if extended absence
5. **Lessons review** — focus on **#35 (new)** + #11/#18 (operationalized via #35 tiering).
6. **Run pre-flight Q1-Q3 (per chosen option)** — read-only, no commits, output as text reply.
7. **Wait for ТЗ from design-Claude** — no code, no commits before ТЗ.

---

## §8 Closing

5O closed clean. **11-streak achieved.** Three-quarters milestone (16/22 = 72.7%) approached.

5P decision deferred к user / design-Claude assessment. Default recommendation: **Option A (ψ-2 carry-overs)** unless backend log access available (then Option B Q1) или feature priority shift.

Lessons stable at 35. Recoveries cumulative 54 — Lesson #11 reflex doing real work across all sub-epics.

**Goal для 5P: 12-streak.**
