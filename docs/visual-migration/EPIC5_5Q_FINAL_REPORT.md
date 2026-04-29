# Sub-Epic 5Q — ζ Retirement (Feature work) — FINAL REPORT

**Status:** ✅ CLOSED 2026-04-29.
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continue 5E-5P stack, single PR target к `visual-v2`).
**HEAD before:** `f95555e` (5P Phase 6 closure tip).
**HEAD after P2:** `94bc82e`.
**HEAD after P4:** TBD (this commit + 4B).
**Predecessor:** 5P ✅ CLOSED.
**Audit ref:** §4.2 #16 (🔴 Missing → ✅ Done после 5Q). Four-fifths milestone reached.

> **Note on atypical split:** This FINAL_REPORT shipped в **2 sentinel-marker commits (4A + 4B)** due к Anthropic API stream idle timeout × 2 в previous chat session blocking single-write attempts. Infrastructure-driven recovery, **NOT 5P file-size threshold violation** (per 5P clarification: sentinel split = process discipline для multi-step incremental construction, not size-gated). Mode A discipline preserved между 4A и 4B (commit → push → status → ok → next commit). This split does NOT count against the hot-fix metric — planned recovery, not retroactive fix.

---

## 1. Scope summary

**Shipped (2 functional commits):**

| # | Item | Source | Tier (#35) | Commit |
|---|---|---|---|---|
| P1 | HudRetirement.vue (NEW, pure-presentational) + masterState `fetchRetirementStatus` + `retire` actions | Audit §4.2 #16 missing | Adaptation + Lesson #18 STOP escalation | `04aca63` |
| P2 | HudProfile integration (Settings-adjacent full-width card row, mirror 5J SocialTasks pattern) | Audit §4.2 #16 missing | Adaptation | `94bc82e` |

**Skipped (1):**

| # | Item | Reason | Commit |
|---|---|---|---|
| P3 | i18n conditional check | 10 unique keys × 11 locales → 0 gaps confirmed via re-grep (Lesson #11 reflex). Skip-and-documented per Mode A discipline. | NO COMMIT |

**Dropped (originally Phase 5/6 pre-investigation, carry-over к 5R+):**

- Animation для retirement confirmation — UX polish, candidate 5R+
- Achievement badge для first retirement — requires backend extension first (new achievement type), candidate 5R+ with backend pre-investigation

**No-op (originally Phase 3 pre-investigation):**

- Vuex state plumbing assumed needed by original ТЗ — Option B preserved Vuex pattern (action wrappers, NOT direct apiClient as original ТЗ assumed). Pre-existing pattern infrastructure sufficient. No state slice needed (retirement is one-shot fetch + one-shot action, not persistent UI state).

**Investigation findings overturned ТЗ pre-investigation assumptions:**

- **Q1 prototype check** — NO retirement scene в prototype. Design fresh per Hexlash design tokens (recovery #56).
- **Q2.5 retirement scope** — Per-USER retirement (User.progression-driven), NOT per-Agent as ТЗ initially framed.
- **Q3 entry point** — HudProfile (semantic match for irreversible user-level action), NOT HudFighterDetail (per-agent context wrong fit).
- **Q2.3 fetch convention** — Vuex action wrappers per HUD-v2 mainstream convention (Lesson #32 strict), NOT direct apiClient as original ТЗ §2.5 recommended (recovery #57 — escalated by Lesson #18 STOP в P1).

**Predicted: 2 functional + P3 skip + 2 split FINAL_REPORT + P5 + P6 = 6 phases / 6 total commits.** ✅ Matched.

---

## 2. Phase-by-phase log

### P1 — HudRetirement scaffold + masterState actions (commit `04aca63`)

**Pre-edit verification:** 7 grep blocks per ТЗ §2.3 — apiClient direct usage в HUD-v2 components, RetirementPanel.vue legacy patterns, masterState.js existing actions, errorMessageModel/infoMessageModel factory shapes, retirement API endpoints, t.* i18n keys, Vuetify usage в HUD-v2.

**Lesson #18 STOP triggered (architectural):**
- **Original ТЗ §2.5 recommendation:** Self-contained HudRetirement with direct apiClient calls (mirroring legacy `RetirementPanel.vue` в `components/club/`).
- **Pre-edit verification revealed:** HUD-v2 + apiClient direct = **NO precedent across 7+ HUD-v2 components.** All HUD-v2 files use Vuex action wrappers exclusively (`store.dispatch(...)`).
- **Convention conflict escalated to design-Claude.** Decision Option B confirmed: Vuex action wrappers + pure-presentational HUD per HUD-v2 mainstream convention (Lesson #32 strict apply).
- **Recovery #57 logged:** ТЗ refinement-time mis-classification of Lesson #30 sub-pattern. Refinement framed HudRetirement self-containment as second test of #30 sub-pattern from 5P P3 HudClanEmpty. Reality: different pattern scope. 5P P3 = local UI state ownership без API calls. 5Q P1 candidate = data fetch self-containment. Different pattern scope → second test invalid, pre-formal #30 continues, awaits real second UI-state instance.

**Tactical Lesson #11 catches (NOT counted as architectural recoveries):**
- Vuetify grep returned 1 false-positive match (comment text containing "Vuetify"). Tightened verify (raw count vs context-aware). Tactical refinement only.
- Empty-body POST clarification: backend resolves primaryModule from User.progression — original ТЗ §2.1 assumed body payload. Tactical refinement of API call shape.

**Implementation:**
- `src/core/state/modules/masterState.js` (+24 lines):
  - `fetchRetirementStatus` action: GET `/v1/user/retirement-status` via apiClient. Errors → `setErrorMessage` + `ErrorMessageModel.withText()` (5P P2 factory). Returns response data.
  - `retire` action: POST `/v1/user/retire` with **empty body** (backend resolves primaryModule). Errors → `setErrorMessage` + `ErrorMessageModel`. Success → `setInfoMessage` + `InfoMessageModel.withText()` toast.
  - **No optimistic UI** — retirement irreversible, snapshot/rollback not applicable (5L Phase 2 captain switch precedent does NOT extend here).
- `src/components/hud/HudRetirement.vue` (NEW, 376 lines):
  - Pure-presentational, dispatch-based via `store.dispatch('master/...')`.
  - 3 template branches: `loading` (spinner) / `legend` (already retired display) / `progress` (eligibility + retire button).
  - Native `<button>` (no Vuetify per HUD-v2 convention). `.hr-spinner` CSS keyframes mirroring `.tsp-spinner` (HudSocialTasks 5I) and `.mm-spinner` (HudMatchmaking 5C) precedents.
  - 9 i18n keys reused from existing `t.club.*` and `t.clan.*` sections (no new keys created).
  - Lesson #22 verified post-edit: scoped `<style>` root selector `.hr-panel` matches template root class.

### P2 — HudProfile integration (commit `94bc82e`)

**Pre-edit verification:** 3 grep blocks per ТЗ §3.3 — HudProfile card grid layout, profile.css grid template + media query breakpoints, HudSocialTasks 5J integration pattern (mount + grid extend).

**Decision rationale:** ТЗ §3.4 framed dual options ("Identity или Settings recommended" + "adjacent card or merge into existing"). Resolved per **5J Social Tasks precedent** — full-width card row (NOT merge into existing card). Settings-adjacent semantic placement chosen for destructive-action lineage alignment (Settings card holds Logout button, Retirement card holds equally destructive but rarer action).

**Lesson #34 (HUD overlay layout convention) preserved:**
- Identity / Performance / Friends / Settings keep grid positions unchanged.
- Retirement new row 4 (between Settings row 3 and SocialTasks).
- SocialTasks auto-flows row 4 → 5 (row addition ≠ disturbance, grid cells re-flow naturally).
- Mobile @720px: grid extends 5 → 6 stacked single-column rows (parallel desktop adjustment).

**Implementation:**
- `src/components/hud/HudProfile.vue` (+9 lines): `import HudRetirement` + `<HudRetirement />` mount in new card slot между Settings card и SocialTasks card.
- `src/styles/v24/profile.css` (+20/-4):
  - Desktop grid: `grid-template-rows: repeat(4, ...)` → `repeat(5, ...)`.
  - Mobile @720px grid: `repeat(5, ...)` → `repeat(6, ...)`.
  - `.retirement-card` rule (mirror `.social-tasks-card` per 5J pattern): `grid-column: 1 / -1; max-height: 360px;`.

**Lifecycle clean:**
- Unconditional render → single `onMounted` dispatch in HudRetirement (no double-mount risk).
- HudProfile parent остаётся unchanged in lifecycle behavior (HudRetirement self-manages its own data fetch via Vuex action).

### P3 — i18n conditional check (SKIPPED, no commit)

**Re-grep mandatory per Lesson #11 reflex** (NOT trust P1 observation verbatim).

- **P1 observation:** "9 i18n keys reused" — imprecise count surfaced via P3 re-grep. Actual unique key count: **10** (9 in HudRetirement template + 1 in masterState.js `retire` success toast). Conclusion preserved (still 0 gaps), but count corrected. Tactical recovery, NOT counted as architectural recovery (count imprecision ≠ assumption failure).
- **All 10 keys cross-referenced × 11 locales:** **0 gaps.**
- **Spot-check:** en real translations, ru real translations, 9 fallback English (5N convention — literal English values в non-English locales until dedicated localization pass).

**Skip-and-documented per Mode A discipline.** No commit produced. P3 phase logged in this FINAL_REPORT as null operation.

### P4 — FINAL_REPORT (this commit + 4B, atypical sentinel split)

**Stream idle timeout × 2 in previous chat session** blocked single-write attempts on full FINAL_REPORT body. New session strategy adopted per design-Claude P4 prep:

- **Commit 4A:** sections 1-4 (Header / Scope / Phase log / Lessons applied) — this commit.
- **Commit 4B:** sections 5-8 (Lessons new / Cumulative / Carry-overs / Closing) — next commit.

**Infrastructure-driven recovery, NOT 5P file-size threshold violation.** Per 5P clarification (CLAUDE.md §Sub-Epic 5P): sentinel split is process discipline for multi-step incremental construction, not size-gated. P4 atypical split documented explicitly here AND in commit messages to avoid future misreading as a 5P violation precedent.

**Mode A discipline preserved между 4A и 4B** — push 4A → status → wait ok → push 4B → status → wait ok.

---

## 3. Files changed (P1 + P2 cumulative)

| File | Change | Lines | Phase |
|---|---|---|---|
| `src/core/state/modules/masterState.js` | modified | +24 | P1 |
| `src/components/hud/HudRetirement.vue` | NEW | 376 | P1 |
| `src/components/hud/HudProfile.vue` | modified | +9 | P2 |
| `src/styles/v24/profile.css` | modified | +20/-4 | P2 |

**No file deletions.** Legacy `src/components/club/RetirementPanel.vue` preserved (5L precedent — legacy preservation until explicit cleanup sub-epic; carry-over к 5R+).

---

## 4. Lessons applied

- **#11 verify shape** — multiple tactical recoveries в 5Q (Vuetify grep false-positive в P1, P1 i18n key count imprecision caught в P3 re-grep). **Both NOT counted as architectural recoveries** (tactical refinements, не assumption-level corrections). Recovery transparency in §6.
- **#18 STOP at structural mismatch** — **strong application**: P1 Option A vs B convention escalation. Pre-edit verification revealed HUD-v2 + apiClient direct = NO precedent. Saved 5Q from establishing wrong convention precedent. Single most valuable Lesson application in this sub-epic.
- **#22 HUD scoped selector match** — P1 verified post-edit. Template root `.hr-panel` matches scoped style root selector. N/A для P2 (HudProfile integration touches global profile.css, не scoped block).
- **#30 sub-pattern (pre-formal)** — second test **NOT materialized.** Different pattern scope:
  - 5P P3 HudClanEmpty = local UI state ownership без API calls (sort/scroll state).
  - 5Q P1 candidate (HudRetirement self-contained-with-apiClient) = data fetch self-containment.
  - Different scope → invalid second test. Pre-formal #30 continues, awaits real second UI-state instance.
- **#32 convention discovery reflex** — strong application:
  - P1: HUD-v2 Vuex action convention (7+ component evidence).
  - P1: factory pattern (`InfoMessageModel`/`ErrorMessageModel.withText()` shape).
  - P1: native button + CSS spinner convention (`.tsp-spinner`/`.mm-spinner` precedent).
  - P2: 5J SocialTasks card pattern (full-width row, NOT merge into existing card).
  - P3: 5N English fallback convention (verification step, no edit).
- **#33 deploy-environment awareness** — backend ✅ ready (Q2.4 investigation in 5Q pre-flight confirmed `/v1/user/retirement-status` and `/v1/user/retire` endpoints exist в `backend/src/routes/user.js`). No defer required для retirement endpoints. Q1 `/v1/agent/list` 500 stays separate concern (4th defer warning, carry-over к 5R).
- **#34 HUD overlay layout convention** — P2 sibling card positioning preserved. Identity/Performance/Friends/Settings keep grid positions; Retirement new row 4; SocialTasks auto-flow row 4→5. Row addition ≠ disturbance. Mobile @720px grid extended 5→6 in parallel.
- **#35 reflex catch tiering** — P1 bug-bundle-tier (masterState extension + HudRetirement component pair = same architectural class). Fits Phase 1 без scope-boundary STOP (different from 5O P3 setError → 5P P2 setInfo phantom mutation case which crossed model class boundary).

---
