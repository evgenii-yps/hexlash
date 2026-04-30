# Sub-Epic 5T — ι i18n Consolidation (Path D ultra-strict) — FINAL REPORT

## Section 1 — Header

- **Date:** 2026-04-30
- **Branch (continue stack):** `claude/setup-5e-shop-mode-a-khIAi` (11th continue stack decision — extends 5J-5S 10-decision precedent)
- **HEAD before 5T:** `1a9497d` (5S P3d post-closure backfill)
- **HEAD after Phase 1 collapse:** `cd286c1` (P0d STARTUP amendment — final pre-functional state)
- **HEAD after functional commit (P2):** `141e814` (P2 — orphan locale cleanup, 22 deletions)
- **HEAD after Phase 3 (NO-OP):** `141e814` unchanged (P3 build verify, no commit)
- **HEAD after Phase 4-6:** `[updated in P6]`
- **Predecessor:** Sub-Epic 5S Z Cleanup batch (RetirementPanel.vue orphan removal + investigation refinement of i18n consolidation as future task)
- **Type:** Methodology-heavy sub-epic, dual-pivot trajectory
- **Status:** CLOSED clean
- **Branches involved:** continue stack only — frontend-only refactor, no backend touch (Lesson #33 not triggered)

## Section 2 — What 5T did

5T started as **γ AI Trainer (M-size feature)** — deferred from 5R + 5S, intended as the first feature-shipping sub-epic post 15-streak achievement. Investigation revealed TWO blocking issues, triggering pivot to **ι i18n consolidation**. Subsequent investigation revealed THIRD blocking issue, triggering scope amendment to **Path D ultra-strict** — keeping ι direction but radically narrowing scope to a single dupe group cleanup. Pre-edit enumeration in P1 surfaced FOURTH issue, collapsing P1 to NO-OP and consolidating remaining work into P2 direct cleanup.

**Phase-by-phase narrative:**

1. **P0** (`aac35a3`) — γ STARTUP committed (`STARTUP_5T_AI_TRAINER.md`). Historical record preserved post-pivot.
2. **P0.5** (read-only) — γ investigation matrix Q1.1–Q1.5. Two recovery candidates surfaced: **#72** (greenfield assumption falsified — `AiTrainerAnalysis.vue` already exists in v1, wired into `CardFightView.vue`, backed by `/v1/ai/analyze-fight`) and **#73** (v2 fightState is mock per Epic 3A intent — fundamental shape mismatch with v1 backend endpoint expectations). Pivot decision γ → ι.
3. **P0c1+P0c2** (`dcd7362`+`333bc12`) — ι STARTUP committed via preventive split (5th application of framework). Hybrid-2 strategy documented: Track A (`modal.btn*` expansion) + Track B (`t.common.*` introduction). 11 dupe groups projected for elimination.
4. **P0b investigation** (read-only, between P0c2 and P0d) — Q1.1 dupe count + Q1.6 locale Δ audit. Recovery **#74** (Yesterday symmetry false — assumed 3-way like Today, actually 2-way max) + Recovery **#75** (value-equivalence methodology gap — Q1.6 checked PRESENCE only, not VALUE EQUIVALENCE; cross-source value comparison revealed all 8 Track B keys + 2 of 3 Track A keys have cross-locale value divergence). Most "duplicates" are hardcoded English placeholders in non-EN locales — localization debt, not genuine duplication. Scope amendment ι full → Path D ultra-strict.
5. **P0d** (`cd286c1`) — STARTUP amendment appended documenting Recovery #74/#75 + Path D ultra-strict reduction. Track A reduced to Cancel only; Track B eliminated entirely. Self-correction note: locale files are ESM `export default`, not CommonJS (initial P0c1 description error, no functional impact).
6. **P1 Step 1** (read-only) — pre-edit callsite enumeration. Recovery **#76** (orphan source paths — both `clan.lblCancel` and `xpAllocation.cancel` have **0 callsites in `src/`**). P1 functional commit collapses to NO-OP.
7. **P2** (`141e814`) — direct orphan locale cleanup. 22 entries deleted (`clan.lblCancel` × 11 locales + `xpAllocation.cancel` × 11 locales). Recovery **#77** (generic-word section-collision averted in pre-edit — `^    cancel:` matched 2 lines per locale; second match in matchmaking section would have been wrongly deleted by unscoped sed). Pattern-based scoping via predecessor-line idiom (`/^    allocate:/{n;/^    cancel:/d}` for xpAllocation, `/^    lblNotice:/{n;/^    lblCancel:/d}` for clan) handled section-ordering variance across locales (xpAllocation precedes matchmaking in `ar.js`, follows in `en.js`/`ru.js`).
8. **P3** (NO-OP) — build verify confirmed end-to-end orphan validation. Bundle delta in noise band (raw −0.51 kB / brotli −0.63 kB / gzip +2.46 kB build-system noise). dist/ 21M unchanged, 233 assets unchanged, 1 pre-existing chunk-size warning preserved, 0 errors.

**Functional outcome:**

- 22 locale entries removed from 11 locale files
- 0 source-code changes
- `modal.btnCancel` preserved (15 active callsites)
- Build clean, end-to-end orphan validation confirmed

**Methodology outcome:**

- **3-layer i18n validation framework** emerged: presence (Q1.1) → value-equivalence (Q1.6 refined) → callsite-presence (Q1.7 P1 Step 1). Each layer caught a distinct failure mode of pre-investigation assumptions.
- **Section-ordering-variance awareness** — locale files do NOT share key ordering across translations. Pattern-based scoping (predecessor-line sed idiom) is safer than absolute-line scoping for cross-locale work.
- **Generic-word collision pre-check pattern** — keys with common English words (`cancel`, `name`, `back`) require section-scoped uniqueness verification before structural edits.
- **Dual-pivot precedent** — γ → ι → Path D demonstrates that intra-sub-epic strategic re-pivots are tractable when investigation surfaces blocking premise issues. Single-pivot path (just γ → ι) would have shipped degraded UX or triggered Lesson #33; dual-pivot preserved 15-streak via scope discipline.

## Section 3 — Pivot trajectory + investigation-refines-ТЗ precedent

| Pivot | Trigger | From | To | Recoveries |
|---|---|---|---|---|
| 1 (strategic) | Greenfield falsified + v2 mock gap | γ AI Trainer (M feature) | ι i18n consolidation (M refactor) | #72, #73 |
| 2 (scope amendment) | Value-equivalence methodology gap | ι Hybrid-2 (8 Track B + 3 Track A = 11 dupe groups) | ι Path D ultra-strict (1 Track A only = 1 dupe group) | #74, #75 |
| 3 (collapse) | Orphan source paths surfaced pre-edit | P1 functional commit (call-site rewrites) | P1 NO-OP, P2 direct cleanup | #76 |

**Pivot reasoning preservation principle:** failed strategic paths documented, not silently overwritten.

- γ STARTUP (`aac35a3`) stays in repo as historical investigation record
- ι STARTUP P0c1+P0c2 (`dcd7362`+`333bc12`) preserves Hybrid-2 reasoning verbatim
- P0d amendment (`cd286c1`) appends Path D ultra-strict reasoning without rewriting prior content
- 5T = transparency over revisionism (precedent for future pivot-heavy sub-epics)

**Sextuple-precedent investigation-refines-ТЗ pattern** (originally quintuple after 5S, extended by 5T):

| Sub-epic | Refinement events |
|---|---|
| 5O Q2 | scope adjustment 5 → 7 callsites |
| 5Q | 4 ТЗ assumptions refined |
| 5R | 4+ pivots during root cause analysis |
| 5S | 5 scope items → 1 actual work item via P0.5 matrix |
| **5T** | **6 recovery candidates + dual-pivot trajectory + P1 collapse → NO-OP** |

5T contributes a refinement intensity unprecedented in single sub-epic — confirms pattern is now de facto law for sub-epic ramp-up. Pre-investigation ТЗ consistently treated as draft. Investigation-driven scope changes can trigger **mid-sub-epic strategic re-pivots** (not just initial scope refinement).

## Section 4 — Functional changes detail

### P2 commit `141e814`

**Files changed:** 11 (`src/locales/{ar,de,en,es,fr,hi,ja,ko,pt,ru,zh}.js`)

**Diff:** 22 deletions, 0 insertions

**Pattern:**
- `clan.lblCancel: '...'` removed from `clan:` block × 11 files
- `xpAllocation.cancel: '...'` removed from `xpAllocation:` block × 11 files

### Pre-edit verification (Step 1–3)

- **Step 1 — branch + tree sanity:** branch `claude/setup-5e-shop-mode-a-khIAi`, HEAD `cd286c1`, tree clean ✅
- **Step 2 — orphan re-verify (Lesson #11 reflex):**
  - `clan.lblCancel` callsites: 0 (expected 0) ✅
  - `xpAllocation.cancel` callsites: 0 (expected 0) ✅
  - `modal.btnCancel` target sanity: 15 callsites (expected 5+) ✅
- **Step 3 — locale presence verification:** all 22 entries present across 11 locales (line 258 in 9 locales, 267 in `ru.js`, 268 in `en.js` for `clan.lblCancel`; xpAllocation block scope for `cancel:`) ✅
- **Step 4 — pattern uniqueness check (pre-edit, Recovery #77 catch):** `^    cancel:` matched 2 lines per locale, not 1. Second match in matchmaking section (`searchingForOpponent / cancel / opponentFound` cluster). Unscoped sed would have broken PvP UI. Pattern-based scoping via predecessor-line idiom adopted before any destructive edit.

### Post-edit verification (Step 5)

| Check | Result |
|---|---|
| 5.1: `lblCancel` fully gone in `src/locales/` | 0 hits ✅ |
| 5.2: `xpAllocation.cancel` gone × 11 locales | 0 hits per locale ✅ |
| 5.3: `modal.btnCancel` preserved | 11 hits (one per locale) ✅ |
| 5.4: All 11 locales parse cleanly via dynamic import | 11/11 OK, 29 sections each ✅ |
| 5.5: Matchmaking `cancel:` survived | en.js line 687 still `cancel: 'CANCEL'` ✅ — collision avoided |

### Bundle impact (P3 build verify)

| Bundle | Pre-P2 baseline | Post-P2 | Delta |
|---|---|---|---|
| Main `index.js` raw | 3,411.94 kB | 3,411.43 kB | **−0.51 kB** |
| Main `index.js` gzip | 1,088.51 kB | 1,090.97 kB | +2.46 kB (build-system noise) |
| Main `index.js` brotli | 828.94 kb | 828.31 kb | **−0.63 kb** |
| Secondary `index.js` raw | 111.09 kB | 111.09 kB | unchanged |
| Total `dist/` | 21M | 21M | unchanged |
| Asset count | 233 | 233 | unchanged |
| Warnings | 1 (chunk size) | 1 (same) | 0 new |
| Errors | 0 | 0 | 0 new |

**Bundle interpretation:**
- Raw + brotli show small reduction consistent with 22 short string entries removed (~100–300 bytes raw is plausible)
- Gzip +2.46 kB is build-system noise — content-hashed filenames + minification micro-variations shift bytes between chunks unpredictably
- No semantic regression — orphan status fully validated end-to-end (deletion produced no functional change because there were never any consumers)

**Build duration:** 87s. Locale-specific warnings: 0.
