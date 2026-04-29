# Sub-Epic 5O — Carry-overs Polish Batch (Option ψ) — FINAL REPORT

**Status:** ✅ CLOSED 2026-04-29.
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continue 5E-5N stack, single PR target к `visual-v2`).
**HEAD before:** `8f08639` (Phase 9 of 5N closure — HANDOFF_5O delivered).
**HEAD after P3:** `ca1b924`.
**Predecessor:** 5N ✅ CLOSED.
**Audit ref:** §4.2 closes carry-overs from 5M (#22 partial) + 5N (#4 partial) + accumulated debt от 5K/5L; не adds new audit items.

---

## 1. Scope summary

**Shipped (3 functional commits):**

| # | Item | Source | Commit |
|---|---|---|---|
| P1 | i18n `spectate.watch` key + HudProfile wire | 5N Phase 2 carry-over | `a3bb83b` |
| P2 | AutoFight mobile responsive (HudFighterDetail @media) | 5M Phase 2 fix carry-over | `1d0ba58` |
| P3 | `master/setError` phantom mutation × 9 → `setErrorMessage` + `ErrorMessageModel.withText()` | 5M Phase 3 carry-over | `ca1b924` |

**Dropped (Q1):** Backend `/v1/agent/list` 500 — root cause unobservable from frontend grep, requires runtime logs (Vercel/kubectl/DB inspect). Lesson #33 deploy-environment risk + speculative-fix risk would jeopardize 10-streak. Forward-deferred к dedicated backend-debugging sub-epic.

**Skipped optional (item 5):** HudClan no-clan branch splitting — not requested mid-batch, defer к 5G-style polish.

**Predicted: 3 functional + 3 finals = 6 total.** ✅ Matched.

---

## 2. Phase-by-phase log

### Phase 1 — i18n `spectate.watch` (commit `a3bb83b`)

**Files changed:** 12 (11 locales + HudProfile.vue), +12/-1.

**Pre-edit findings:**
- 11 locales had `spectate:` block (per 5N Phase 4 Case B closing); only `watch:` sub-key missing across all
- HudProfile inline `>Watch<` button text at line 155
- `t` reactive ref already imported via `@/locales/index.js` line 237 (no new import)

**Convention applied (#32):**
- Template syntax `{{ t.spectate.watch }}` — reused от HudSpectate precedent (8 existing usages)
- aria-label `"Watch live fight"` preserved as descriptive accessibility string (different semantic scope from action verb — carry-over forward)

**Decisions:**
- en `'Watch'`, ru `'Смотреть'`, 9 fallback `'Watch'` (5N convention)
- Insert position: between `leave:` and `},` (semantic action grouping)

**Streak after:** 11 candidate.

### Phase 2 — AutoFight mobile responsive (commit `1d0ba58`)

**Files changed:** 1 (HudFighterDetail.vue), +8/-0.

**Pre-edit Lesson #11 catches (3 false-positives surfaced):**

| Item | ТЗ assumption | Reality | Action |
|---|---|---|---|
| Selector | `.auto-label` | `.autofight-label` (594) + `.autofight-desc` (599) + `.autofight-info` wrapper (585) | Adapted; rule omitted (#3 below) |
| Breakpoint | 720px (per profile.css) | **820px existing in same file** at line 526 covering `.set-captain-btn` + `.captain-badge` | Used 820px (file convention) |
| Label base size | 12px (implied by ТЗ "12→10") | Already 10px | Rule omitted (no-op, dead code) |

**Decision rationale:**
- Extended existing 820px @media block (single @media discipline), not parallel 720px block
- Sibling pair logic: `.autofight-row` bottom-left + `.set-captain-btn` / `.captain-badge` top-right — same component domain, deserve same breakpoint trigger
- Local file convention strictly trumps cross-file precedent (5N English fallback principle generalized)

**Edit shape:**
- `padding: 10px 14px → 8px 10px`
- `gap: 12px → 8px`
- Position rules untouched (`bottom: 16px; left: 14px` preserved)
- Skipped `.autofight-label` rule (no-op per current 10px base)

**Streak after:** 11 candidate.

### Phase 3 — `master/setError` × 9 callsites replace (commit `ca1b924`)

**Files changed:** 3 (AgentDetailView.vue / RetirementPanel.vue / ResearchTree.vue), +12/-9.

**Pre-edit findings:**
- 9 callsites confirmed exact (matches investigation matrix)
- All uniform: `store.commit('master/setError', { text: <expr> })` — no try/catch wrapping, no extra payload fields
- Lesson #18 STOP triggers absent → mechanical 1:1 replacement

**5O-surfaced carry-over (Lesson #11 + #18):**
- `master/setInfo` is **also a phantom mutation** — real mutation is `setInfoMessage` at masterState.js:87
- 5 callsites: AgentDetailView lines 381/394/407/432 + RetirementPanel line 101
- **Decision:** scope-boundary STOP — different model class (`InfoMessageModel` vs `ErrorMessageModel`), parallel concern, not bug-bundle expansion
- Documented как HANDOFF_5P carry-over

**Edit pattern (per callsite):**
```js
// Before
store.commit('master/setError', { text: err?.response?.data?.error || 'X' });
// After
store.commit('master/setErrorMessage', ErrorMessageModel.withText(err?.response?.data?.error || 'X'));
```

**Imports added (3 files):**
- AgentDetailView.vue + ResearchTree.vue: `import { ErrorMessageModel } from '@/core/models/internal/errorMessageModel.js';` (with semicolon)
- RetirementPanel.vue: same path, no semicolon (matches file convention #32)

**Streak after:** 11 candidate.

---

## 3. Lessons applied (validated)

- **#11 verify shape с реальным data** — running tally **+4 cumulative recoveries в 5O** (3 в Phase 2 selector/breakpoint/label + 1 в Phase 3 setInfo discovery). Reflex stable across 11 sub-epics now.
- **#18 STOP at structural mismatch** — Phase 3 `master/setInfo` discovery treated as scope-boundary STOP (not bug-bundle expansion). Conservative scope discipline preserved. Distinction validated: bug-bundle = same-class same-pattern expansion; scope-boundary = different model/factory pair = separate carry-over.
- **#22 HUD scoped selector match** — Phase 2 `.autofight-row` direct selector matched scoped convention (no `.app-v2` prefix per file count = 0).
- **#32 convention discovery reflex** — Phase 1 `{{ t.section.key }}` reuse от HudSpectate; Phase 2 820px breakpoint reuse от sibling rule; Phase 3 import path canonicalized via agentState.js + semicolon style per file. Three distinct applications в one sub-epic.
- **#33 deploy-environment awareness** — Q1 backend dropped specifically because backend touch + visual verify chain elevates risk. Frontend-only batch preserved Vercel preview sufficiency.
- **#34 HUD overlay layout convention** — Phase 2 sibling positioning verified pre-edit (captain-btn top-right vs autofight-row bottom-left, no conflict).

---

## 4. Lesson ADDED — 5O introduced 1 new entry

**Lesson #35 — Lesson #11 reflex catch tiering: adaptation / bug-bundle / scope-boundary.**

When Lesson #11 pre-edit re-grep surfaces issues mid-Phase, classify the discovery before deciding action:

1. **Adaptation-tier** — TZ assumption mismatch with codebase reality (selector name, breakpoint, base size, import path style). Fix within current Phase as conscious deviation. Document в commit msg + status report. Lesson #18 NOT triggered. Examples: Phase 2 selector `.auto-label` → `.autofight-label`, breakpoint 720px → 820px (file convention).
2. **Bug-bundle-tier** — additional callsites of **same class, same mutation/factory pair** missed during investigation. Fix within current Phase as expansion (5L Phase 2 + 5M Phase 1 precedent). Document в status report. Lesson #18 NOT triggered.
3. **Scope-boundary-tier** — **different class, different model, different mutation/factory pair** that requires its own pre-edit grep + import work. STOP within current Phase. Document как carry-over forward. Lesson #18 IS triggered. Example: Phase 3 `master/setInfo` × 5 phantom (different model `InfoMessageModel` vs `ErrorMessageModel`, different factory `withText` overload).

Distinction matters because all three tiers technically "fix issues mid-Phase" but only adaptation + bug-bundle preserve hot-fix-streak discipline. Scope-boundary-tier mixed into either creates expanding scope creep cycle (Lesson #18 anti-pattern). Triage decision lives between Lesson #11 catch (factual finding) and action selection (defensive scope choice).

**Cumulative lesson tally:** 34 → **35** (+1 от 5O).

---

## 5. Cumulative metrics update

| Metric | Before 5O | After 5O |
|---|---|---|
| Sub-epics done | 15/22 (68%) | **16/22 (73%)** ← three-quarters approached |
| Hot-fix streak | 10 (5E-5N) | **11 (5E-5O)** |
| Lessons cumulative | 34 | **35** (+1: Lesson #35 reflex catch tiering) |
| Cumulative recoveries | 50 (5E-5N) | **54** (+4 в 5O: 3 Phase 2 + 1 Phase 3) |

**Hot-fix metric:** **0 hot-fix attempts на ложной траектории.** Continues 5E-5N precedent — **11-streak achieved.** All conscious decisions documented in commit messages + status reports.

---

## 6. Carry-overs forward (4 items, priority-ordered)

| # | Item | Source | Priority | Recommended target |
|---|---|---|---|---|
| 1 | Backend `/v1/agent/list` 500 | 5M Phase 4 → 5O Q1 dropped | **HIGH** | Dedicated backend-debugging sub-epic with prod log access (Lesson #33) |
| 2 | `master/setInfo` × 5 phantom mutation | **5O Phase 3 surfaced** | Medium | Next polish sub-epic — same class fix as 5O setError, different model `InfoMessageModel` |
| 3 | aria-label `"Watch live fight"` i18n | 5O Phase 1 surfaced | Low | Accessibility i18n pass (5U candidate scope) |
| 4 | HudClan no-clan branch split | 5L → 5O item 5 optional skipped | Low | Polish sub-epic |

**Predicted next sub-epic** (5P): TBD per HANDOFF_5P assessment. Carry-overs #1 (backend) + #2 (setInfo phantom) priority candidates.

---

## 7. Sub-Epic 5O — CLOSED

✅ All acceptance criteria met:
- [x] 3 functional commits landed на `claude/setup-5e-shop-mode-a-khIAi` (`a3bb83b` / `1d0ba58` / `ca1b924`)
- [x] Q1 backend deferred с documented reasoning
- [x] Item 5 HudClan optional skipped с documented reasoning
- [x] No hot-fix events
- [x] Q1 carry-over forward documented (this report §6 priority 1)
- [x] 5O-surfaced `master/setInfo` carry-over documented (this report §6 priority 2)
- [x] Lesson #35 added cumulative

**Route table `/v2/*` UNCHANGED** — 5O closes carry-overs from existing routes, не adds new routes.

**11-streak preserved.** Past three-quarters milestone approached (16/22 = 72.7%).

**Closing note:** 5O demonstrates that mechanical-batch sub-epics can extract maximum value from Lesson #11 reflex when phases are ordered low-risk-first (P1 i18n → P2 CSS → P3 state mutation). Each phase pre-edit grep surfaced findings that informed subsequent phases — recoveries compounded rather than hot-fixed. Lesson #35 formalizes the triage discipline that made this possible.
