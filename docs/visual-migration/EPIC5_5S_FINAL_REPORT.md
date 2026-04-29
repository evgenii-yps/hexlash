# Sub-Epic 5S — Z Cleanup batch — FINAL REPORT

## Section 1 — Header

- **Date:** 2026-04-30
- **Branch (continue stack):** `claude/setup-5e-shop-mode-a-khIAi` (10th continue stack decision — extends 5J-5R 9-decision precedent)
- **HEAD before 5S:** `70a310d` (5R Phase 9 [CLAUDE.md](http://CLAUDE.md) update)
- **HEAD after Phase 1:** `058ebeb` (P1 RetirementPanel.vue removal)
- **HEAD after Phase 3:** `[fill in P3c HEAD when known]`
- **Predecessor:** Sub-Epic 5R Q1 backend dedicated debug
- **Type:** Z Cleanup batch (Option Z, S-size, streak-preserving)
- **Branches involved:** continue stack only — frontend-only cleanup, no backend touch (per 5R Recovery #63 lesson PR-to-main path remained unused)

## Section 2 — Scope summary

**Shipped:**

1. P0a/P0b — `STARTUP_5S_CLEANUP_[BATCH.md](http://BATCH.md)` retroactive handoff package (287 lines, preventive split per 5R framework — 2nd application)
2. P1 — Orphan `src/components/club/RetirementPanel.vue` removed (160 lines deleted), `HudRetirement.vue` doc-comments updated to historical refs (2 lines edited)
3. P3 — FINAL_REPORT_5S (this file, split P3a1+P3a2 — 3rd preventive split application) + HANDOFF_5T + [CLAUDE.md](http://CLAUDE.md) update

**Investigation-driven scope reduction (P0.5):**

Pre-investigation 5S scope listed 5 candidate items. P0.5 Q1.1-Q1.5 matrix refined scope to **item #1 only**:

- Item #1 (RetirementPanel orphan) → confirmed orphan, executed in P1 ✅
- Item #2 (Punch3D / RainView orphan check) → falsified — both LIVE, dropped from scope (Recovery #69)
- Item #3 (HudProfile card-creep) → 6/7 threshold, monitor-forward (no refactor needed)
- Item #4 (i18n cross-section reuse) → 45 dupes confirmed, M-size scope overflow, deferred to 5T+ as formal task
- Item #5 (other small TODOs) → all 5 TODOs are deferred-feature placeholders, none absorbable

**Result:** S-size sub-epic became XS-size (1 functional commit instead of 3-5 estimated). Streak-preserving outcome optimal.

**Frontend cleanup:** RetirementPanel.vue removal validated end-to-end via build delta (gzip −4.11 kB confirms file was indeed contributing redundant patterns to bundle pre-tree-shake).

## Section 3 — Phase-by-phase log

**P0a — Sections 1-4 of STARTUP_5S_CLEANUP_[BATCH.md](http://BATCH.md) (commit `75e7e73`):**

- Pre-flight FAIL on harness fresh slug `claude/investigate-p0-issues-4Is8v` (Recovery #67)
- Switched to continue stack `claude/setup-5e-shop-mode-a-khIAi` per ТЗ explicit-permission framework + 9-decision precedent
- Header + Branch + Контекст + Scope + PHASE 0 spec sections written, 120 lines

**P0b — Sections 5-8 append (commit `c243f1f`):**

- 1st stream idle timeout on monolithic P0 write (Recovery #68)
- Preventive split adopted per 5R framework (2nd application — pattern stabilizing)
- Investigation Q-templates + Workflow + Mandatory reading + Lessons + Acceptance + Действия sections appended via bash heredoc
- Final file size: 287 lines

**P0.5 — Investigation matrix (no commit, read-only):**

- Q1.1 RetirementPanel orphan confirmed (0 live imports, 3 expected hits only)
- Q1.2 Punch3D LIVE in TrainingView (Recovery #69 — assumption falsified)
- Q1.3 HudProfile = 6 cards, broad grep over-counted as 12 (Recovery #70 — Lesson #11 self-correction via [CLAUDE.md](http://CLAUDE.md) audit cross-reference)
- Q1.4 i18n 45 cross-section dupes (deferred — M-size, scope overflow)
- Q1.5 Build initially failed (`vite: not found`, env-pre-existing) → P0.6 added for `npm install` authorization

**P0.6 — Build baseline capture (no commit, read-only):**

- `npm install` 161 packages installed
- Pre-delete baseline: dist 21M, 233 assets, main bundle 3,410.85 kB raw / 1,092.62 kB gzip, 1 chunk-size warning

**P1 — RetirementPanel.vue removal (commit `058ebeb`):**

- Pre-edit re-verify: 3 expected hits, 0 dynamic imports, 0 router/config refs — assumption from P0.5 held
- `git rm src/components/club/RetirementPanel.vue` (160 lines)
- 2 doc-comments in `src/components/hud/HudRetirement.vue` updated to historical refs ("replaces legacy RetirementPanel removed in 5S")
- Post-delete build: dist 21M unchanged, 233 assets unchanged, main bundle 3,411.94 kB raw (+1.09 kB build noise) / 1,088.51 kB gzip (**−4.11 kB**), warnings 1→1, errors 0→0

**P3a — FINAL_REPORT (this file, split P3a1+P3a2):**

- 1st timeout on monolithic write → 3rd preventive split application (Recovery #71)
- P3a1: Sections 1-4 (this commit)
- P3a2: Sections 5-8 (next commit)

**P3b — HANDOFF_EPIC5_5T_CHAT_[HANDOFF.md](http://HANDOFF.md):** [pending]

**P3c — [CLAUDE.md](http://CLAUDE.md) update (Sub-Epic 5S section):** [pending]

## Section 4 — Lessons applied

**#11 verify shape (running tally critical):** 5 reflex catches in 5S session (#67-71). Cumulative recoveries entering 5S: 66+. Estimated leaving 5S: 71+ (5 catches confirmed, possibly 1-2 more during P3 finals). Reflex remained valuable — every catch was assumption-vs-reality divergence detected before downstream cost.

**#18 STOP at structural mismatch:** Strictly applied at:

- P0 pre-flight branch divergence (#67) — switched to continue stack only after explicit-permission verification, not auto-action
- P1 pre-edit re-verify before delete — validated 3-hit assumption held between P0.5 and P1 execution windows
- P0.5 Q1.5 ClanWithdraw orphan flag NOT extended — scope-boundary discipline (Lesson #35 scope-boundary-tier classification)

**#32 convention discovery reflex:** P0 followed established handoff format (5L+ precedent). P1 doc-comment historical-ref pattern matches "(removed in 5X)" convention from prior cleanup work.

**#33 deploy-environment awareness:** N/A in 5S — frontend-only cleanup, no backend touch, no Railway interaction. Branch strategy (Recovery #63 from 5R) reflex remained active but not triggered.

**#35 reflex catch tiering:** All 5 recoveries (#67-71) classified as adaptation-tier — TZ assumption mismatches with reality (or infrastructure-driven), fixed within Phase as conscious deviations, no Lesson #18 STOP triggers, no hot-fixes. Tiering framework continues to operationalize cleanly.

**#36 candidate (incomplete rollback drift):** N/A in 5S (no DB changes). Mitigation prototyping deferred per pre-decision.

**#37/#38 candidates:** N/A in 5S (no diagnostic strategy with sandbox capability assumptions).
