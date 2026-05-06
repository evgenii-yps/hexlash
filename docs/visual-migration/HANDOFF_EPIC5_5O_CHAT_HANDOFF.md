# HANDOFF — Sub-Epic 5O (Pre-flight chat handoff)

> **Mode A strict.** Single PR target к `visual-v2`. Continue stack `claude/setup-5e-shop-mode-a-khIAi` (5E-5N-...).
> **Predecessor:** 5N ✅ CLOSED (Phase 9 commit — this handoff).
> **Audit progress:** 15/22 done (68%) — past two-thirds milestone.

---

## §1 Где сейчас

- **Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued through 5E-5N stack — 8 sub-epics).
- **HEAD:** Phase 9 commit (this file). Predecessor commit chain Phase 1 `5a78676` → Phase 8 `f2eb44e`.
- **Tree:** clean.
- **Audit (§4.2):** **15/22 done (68%).** Past two-thirds milestone achieved. Remaining: 4 partial + 3 missing.

### 5N headline

**10-streak без hot-fixes** (5E + 5F + 5G + 5H + 5I + 5J + 5K + 5L + 5M + 5N all clean). Pure-frontend Spectate mock port.

- **Lesson #34 (HUD overlay convention) first real test PASSED** — applied preventively pre-edit, NOT 5M Phase 2 mistake repeated. Transferability confirmed.
- **Phase 4 i18n Case B handled per ТЗ flow** — Phase 1 status false-positive ("11 locales spectate" → reality 3) caught via pre-edit re-grep, anticipated single-fix commit.
- **1 cumulative recovery в 5N** (Lesson #11 self-correction, running total **49 → 50**).
- **Path α discipline preserved** — backend integration deferred 4th time mentioned в CLAUDE.md (5C #1, 5C #11, 5J/5K HANDOFF, 5N).

### Cumulative lesson tally

**34 (UNCHANGED).** 5N applied existing lessons (#11/#18/#22/#30/#32/#34) preventively + reactively. Lesson #34 first real test confirmed transferability.

### Investigation findings preserved (для 5O+ pre-flight reuse)

Inherited from 5K + 5L + 5M + 5N runs (do NOT re-discover):

- **Frontend ES modules / Backend CommonJS** split — convention discovered Phase 7 of 5K.
- **Component store split** — `useStore()` (5 HUDs precedent) vs direct import (2 HUDs) — mirror closest analog.
- **`node:test` API** (NOT Jest) — backend test convention discovered Phase 6 of 5K.
- **`master/setErrorMessage` + `ErrorMessageModel.withText()`** — error toast pattern (5L Phase 2 + 5M Phase 1 + 5N verified).
- **`master/setInfoMessage`** — info toast pattern (5K reward precedent).
- **Optimistic UI snapshot/rollback pattern** — 5L Phase 2 + 5M Phase 1 transferable to any write-action UX. 5M-introduced refinement: per-agent `ROLLBACK_*` for single-field changes.
- **Per-user localStorage pattern** `hexlash_*` prefix — 5L Phase 1, transferable к banner-style UI state.
- **HUD overlay convention (Lesson #34)** — every fixed-overlay child uses `position: fixed` + explicit corner coordinates; `pointer-events: auto` opt-in to override parent's `none` cascade. **5N Phase 1 confirmed preventive application possible at design time** (16 hits position/pointer-events).
- **5-chunk sentinel split** mandatory для FINAL_REPORTs/HANDOFFs >250 lines. **Chunk 2c does NOT add forward sentinel** (5L Phase 9 + 5M Phase 7 + 5N Phase 8 all confirmed).
- **`master/setError` is phantom mutation** — 8 carry-over callsites in `AgentDetailView.vue` (5) + `ResearchTree.vue` (2) + `RetirementPanel.vue` (1). Use `master/setErrorMessage` + `ErrorMessageModel.withText()`.
- **Lessons #19-21** mandatory для 3D scene tweaks (exposure-aware tuning, single-tweak revertibility, no cascade).
- **`aria-pressed` accessibility extension** для toggle buttons (5M Phase 2).
- **ТЗ size estimates may overshoot** — 5L Phase 3 parent 388 vs ≤220 estimate; 5N FINAL 351 vs ~200-250 estimate. Accept reality vs force compliance.
- **5N-introduced — Pre-edit re-verification of prior status claims** — status reports CAN contain false-positives, re-grep prior claims at decision points before action (Phase 4 caught Phase 1 false-positive at zero-commit cost).
- **5N-introduced — Mock port discipline (Path α)** — explicit boundary: NO backend, NO new Vuex, NO 3D scene registration when goal = pure frontend port. Transferable к future deferred-integration scenarios.
- **5N-introduced — English fallback convention для i18n** — literal English values copied к non-English locales per `de.js` precedent until dedicated localization pass (carry-over к 5U).
- **5N-introduced — Path α/β/γ scope discipline** — backend integration deferral pattern: α mock-only, β polling, γ WS broadcast. ТЗ choice = scope-control mechanism.
- **`src/views-v2/` directory structure** — v2 views live there, NOT `src/views/v2/`. v2 routes are children of `/v2` parent (V2Spectate as 11th child of `v2Routes.children`).

---

## §2 Что прочитать (mandatory pre-flight reading order)

1. **`docs/visual-migration/EPIC5_5N_FINAL_REPORT.md`** — full read. Lesson #34 first real test (§3.2), mock port discipline (§3.1), Phase 4 i18n Case B + Phase 1 false-positive recovery (§3.10-3.11), English fallback convention (§3.11), 5N-introduced practice (§6).
2. **`docs/visual-migration/EPIC5_5M_FINAL_REPORT.md`** — full read. Lesson #34 source (Phase 2 fix narrative §3.6), optimistic UI mirror 5L Phase 2 (§3.1-3.5), phantom mutation discovery + surgical scope discipline (§3.10-3.11), Phase 4 backend gating (§3.12).
3. **`docs/visual-migration/EPIC5_5L_FINAL_REPORT.md`** — full read. Per-user localStorage pattern (Phase 1), optimistic UI snapshot/rollback (Phase 2), 5-chunk sentinel placement learning (Phase 9), ClanScene exposure-aware tweaks (Phase 5).
4. **`docs/visual-migration/EPIC5_5K_FINAL_REPORT.md`** — full read. 3 lessons (#31/#32/#33), 5-chunk practice introduction, frontend/backend convention split.
5. **`CLAUDE.md`** — Sub-Epics 5A through 5N sections + lessons #1-34 review.
6. **This HANDOFF** — full read.
7. **`docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md`** — re-orient on overall plan + audit gap matrix §4.2.

---

## §3 Lessons 5N actionable для 5O+

### Validated working patterns

- **#11 verify shape с реальным data** — 1 catch в 5N (Phase 4 self-correction of Phase 1 status false-positive "11 locales spectate" → reality 3 locales). Cumulative running tally: 49 → **50**. Pattern stable across 5E-5N runs.
- **#18 STOP at structural mismatch** — Phase 4 Case A → Case B escalation per ТЗ flow (NOT scope creep). Anticipated decision-tree branch.
- **#22 HUD scoped selector match** — `.spectate-hud` template root matches scoped style root (Phase 1). N/A for Phase 2/3 (global CSS / template-only edits).
- **#30 Pattern reuse — semantic vs mechanical** — `de.js` "English fallback" convention extended к 8 locales semantically (literal English values), NOT mechanical `null` / empty strings.
- **#32 Convention discovery reflex** — applied во всех 5N phases: `src/views-v2/` directory pattern, `.fc-action-btn` CSS file location, `useRoute` import sibling pattern, route name `V2Spectate` re-verify, `xpAllocation:` anchor uniformity, `de.js` English fallback precedent.
- **#34 (NEW от 5M) HUD overlay layout convention** — **first real test PASSED.** HudSpectate `.spectate-hud` overlay convention applied **preventively** pre-edit (16 hits position/pointer-events). NOT 5M Phase 2 mistake (where `.autofight-row` rendered hidden under back-btn) repeated. Transferability confirmed.

### 5N-introduced practice (transferable к 5O+)

- **Pre-edit re-verification of prior status claims** — Phase 4 caught Phase 1 false-positive. Toolkit refinement к Lesson #11: "при new dependent operation re-grep prior claims вместо trust status as ground truth". Specialization #11 для multi-phase runs.
- **Mock port discipline (Path α)** — explicit boundary (no backend, no new Vuex, no 3D scene registration). Transferable к future deferred-integration scenarios where pure-frontend port = scope discipline.
- **English fallback convention для i18n** — literal English values copied к non-English locales per `de.js` precedent until dedicated localization pass.
- **Path α/β/γ scope discipline** — backend integration deferral pattern. Choosing α/β/γ = scope-control mechanism в ТЗ writing.

### Anti-patterns avoided (preserve в 5O+)

- **0 hot-fix attempts** (10-streak preserved through 5N). Goal: 11-streak in 5O.
- **0 scope creep** — Phase 3 same-file bundled fix only, NOT 9-callsite phantom mutation expansion.
- **0 fabricated solutions** — i18n English fallback follows `de.js` precedent verbatim.
- **0 missed pre-edit reverification** — Phase 4 caught Phase 1 false-positive at decision point.

---

## §4 5O scope map — Feature options

**5O = next sub-epic. Decision REQUIRED FIRST в pre-flight Step 0.**

Recommended candidates ranked по risk/reward после 5N closure:

### 🛠 Option ψ — Carry-overs polish batch (S-M scope ~3-5 commits) — **RECOMMENDED**

Bundle accumulated carry-overs from 5K/5L/5M/5N:

- **Backend `/v1/agent/list` 500 fix (5M Phase 4 carry-over)** — UNBLOCKS 5M visual verify. Highest priority.
- **`master/setError` phantom mutation 8 callsites cleanup (5M Phase 3 carry-over)** — `AgentDetailView.vue` (5) + `ResearchTree.vue` (2) + `RetirementPanel.vue` (1). XS, mechanical replace `master/setError` → `master/setErrorMessage` + `ErrorMessageModel.withText()`.
- **AutoFight mobile responsive `.autofight-row` `@media @820px` (5M Phase 2 fix carry-over)** — XS.
- **`spectate.watch` i18n key для 11 locales (5N Phase 2 carry-over)** — XS, but dependent on Phase 4 i18n carry-over decision (real localization vs literal EN fallback).
- **Real localization для 8 fallback locales spectate keys (5N Phase 4 carry-over)** — depends on translator availability OR English fallback maintenance.
- **HudClan further splitting (5L carry-over)** — S, presentational refactor.
- **`trState` removal entirely (5K Q6 carry-over)** — S, mechanical removal.
- **ClanScene further mood iteration (5L carry-over)** — S, requires user visual sign-off.

**Why recommended:** unblocks 5M visual verify, mechanical fixes preserve 10-streak, easy clean-up между larger features. Each carry-over independent — bundled commits OR phased per ТЗ writer preference.

### 🎯 Option γ — AI Trainer (#12) (M scope ~5-7 commits)

- ResultOverlay augmentation post-fight.
- Recommendations based on combat data (heuristic — combat patterns / rounds outcomes).
- New UX design needed.
- Backend Anthropic SDK already integrated (`AI_TRAINER_ENABLED` config flag, `POST /v1/ai/analyze-fight` endpoint exists per CLAUDE.md).
- v2 needs `<AiTrainerAnalysis>` component port + ResultOverlay integration.
- Audit gap matrix item **#12**.

### 🏆 Option ε — FightClub level + Morning Report (#14) (M scope ~5-7 commits)

- `MorningReport.vue` legacy exists — augmentation candidate (5B/5H pattern).
- Daily login flow + level progression.
- Backend `morningReportService.js` already exists (per CLAUDE.md).
- v2 needs HudFightClub + HudMorningReport components.
- Audit gap matrix item **#14**.

### 🔄 Option ζ — Retirement (#15) (M scope ~5-7 commits)

- `RetirementPanel.vue` legacy exists — augmentation candidate.
- Profile section integration (new card vs Settings sub-section).
- State machine transitions (active → retiring → retired) — visualization needed.
- Backend `retirementService.js` exists.
- Audit gap matrix item **#15**.

### 🚀 Option η — Onboarding tour (#21) (L scope ~8-10 commits)

- Bigger scope — entry flow + tooltips + state persist.
- New UX design from scratch (no legacy precedent).
- **Defer recommended.**
- Audit gap matrix item **#21**.

### 🧪 Option θ — MoveTree + DeckBuilder (#16) (L scope ~10+ commits)

- Move tree visualization + DeckBuilder.
- **Largest remaining scope** в Эпике 5. Defer.
- Audit gap matrix item **#16**.

---

## §5 Open questions per chosen Path

**Decision REQUIRED FIRST в 5O pre-flight перед ТЗ writing.**

### For Option ψ (Carry-overs polish) — recommended

- **Q1** — Order priority — backend `/v1/agent/list` 500 first (unblocks 5M visual verify)? phantom mutation cleanup (most callsites)? OR group by file?
- **Q2** — Each carry-over as separate phase OR bundled commits per file/scope?
- **Q3** — Backend `/v1/agent/list` 500 — investigate root cause first (read-only diagnostics) OR fix-as-found (apply hypothesis)?
- **Q4** — `spectate.watch` i18n key + 8-locale real localization — bundle с polish OR defer к dedicated 5U i18n sub-epic?

### For Option γ (AI Trainer)

- **Q1** — Recommendation source — heuristic (rule-based on rounds/HP/dice usage) vs ML (Anthropic API)?
- **Q2** — UI placement: ResultOverlay augmentation vs separate modal vs Profile card?
- **Q3** — Data structure для recommendations (fixed slots vs dynamic list)?

### For Option ε (FightClub level + Morning Report)

- **Q1** — Daily login detection mechanism (timestamp vs session flag vs cron)?
- **Q2** — `MorningReport.vue` legacy reuse via augmentation pattern (5B/5H precedent) OR rewrite?
- **Q3** — Level progression algorithm (XP-based linear vs tier-based)?

### For Option ζ (Retirement)

- **Q1** — `RetirementPanel.vue` legacy reuse via augmentation OR rewrite?
- **Q2** — Profile section integration (new card vs Settings sub-section)?
- **Q3** — State machine transitions (active → retiring → retired) — visualization needed?



## §6 Pre-flight sequence (mandatory)

```bash
# 1. Verify remote state
git ls-remote origin claude/setup-5e-shop-mode-a-khIAi

# 2. Fetch + checkout
git fetch origin claude/setup-5e-shop-mode-a-khIAi
git checkout claude/setup-5e-shop-mode-a-khIAi

# 3. Verify HEAD = Phase 9 commit (this handoff)
git log --oneline | head -3
# Expected top: <phase 9 hash> epic5-5n: phase 9 — HANDOFF_EPIC5_5O_CHAT_HANDOFF.md
# Expected #2:  f2eb44e epic5-5n: phase 8 — EPIC5_5N_FINAL_REPORT.md

# 4. Verify tree clean
git status

# 5. Read mandatory files (per §2 above)
# - docs/visual-migration/EPIC5_5N_FINAL_REPORT.md (full)
# - docs/visual-migration/EPIC5_5M_FINAL_REPORT.md (full)
# - docs/visual-migration/EPIC5_5L_FINAL_REPORT.md (full)
# - docs/visual-migration/EPIC5_5K_FINAL_REPORT.md (full)
# - CLAUDE.md (Sub-Epics 5A-5N sections + lessons #1-34)
# - This HANDOFF (full)
# - docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md

# 6. Step 0 pre-flight report
# Document what's read, branch state verified, audit progress recap

# 7. Decide 5O scope (ψ/γ/ε/ζ/η/θ)
# ψ Carry-overs polish — RECOMMENDED (low risk S-M, unblocks 5M visual verify)
# γ AI Trainer — alternative M scope (new UX work)

# 8. Q1-Q3 questionnaire per chosen feature (per §5 above)
```

### Branch slug guidance

If new chat session arrives с harness slug ≠ `claude/setup-5e-shop-mode-a-khIAi` — **STOP**. Apply Lesson #18 + Blocker A precedent (5J/5K/5L/5M/5N):

1. Report blocker to user (do NOT blind-switch).
2. Wait for explicit "Option B switch" permission OR pre-authorization in ТЗ template.
3. Only then `git checkout claude/setup-5e-shop-mode-a-khIAi`.
4. Leave harness slug branch unused (no delete — established precedent).

5N Phase 0 confirmed pre-authorization in ТЗ template = sufficient permission (harness slug `claude/setup-FJboo` switched via ТЗ explicit command flow при initial pre-flight verify).

---

## §7 Стартовое сообщение для нового чата

```
Start 5O. Mode A strict.

Predecessor: 5N ✅ CLOSED (commit <phase 9 hash> — HANDOFF_5O itself).
Audit: 15/22 done (68%) — past two-thirds milestone achieved.

CRITICAL: 5O starts с feature decision FIRST.
6 options ranked в HANDOFF §4. Recommended:
  ψ Carry-overs polish (S-M ~3-5 commits) — UNBLOCKS 5M visual verify, mechanical
                                             fixes preserve 10-streak, easy clean-up.
  γ AI Trainer (M ~5-7 commits) — alternative new UX work.

Mandatory pre-flight (per HANDOFF §6):
1. git fetch + checkout claude/setup-5e-shop-mode-a-khIAi
2. Verify HEAD <phase 9 hash> + tree clean
3. Read EPIC5_5N_FINAL_REPORT.md (full) — Lesson #34 first real test, mock port
   discipline, English fallback convention, Phase 4 false-positive recovery
4. Read EPIC5_5M_FINAL_REPORT.md (full) — Lesson #34 source, optimistic UI mirror,
   phantom mutation surgical scope, Phase 4 backend gating
5. Read EPIC5_5L_FINAL_REPORT.md (full) — per-user localStorage, optimistic UI,
   5-chunk sentinel placement
6. Read EPIC5_5K_FINAL_REPORT.md (full) — 3 lessons, 5-chunk practice
7. Read CLAUDE.md Sub-Epics 5A-5N + lessons #1-34
8. Read this HANDOFF полностью
9. Step 0 pre-flight report
10. Decide 5O scope (ψ/γ/ε/ζ/η/θ)
11. Q1-Q3 questionnaire per chosen feature (per HANDOFF §5)

Critical patterns inherited from 5N:
- Lesson #34 — HUD overlay convention validated in 5N preventive application
  (apply preventively pre-edit, не 5M Phase 2 mistake repeated)
- Pre-edit re-verification of prior status claims (5N Phase 4 — status reports
  may have false-positives, re-grep before action)
- Mock port discipline (Path α explicit boundary — no backend, no Vuex, no scene)
- English fallback convention для i18n (literal English values until 5U)
- Path α/β/γ scope discipline (backend integration deferral mechanism)
- Optimistic UI snapshot/rollback pattern (5L Phase 2 + 5M Phase 1 transferable)
- Per-user localStorage pattern hexlash_<feature>_<login> (5L Phase 1)
- ROLLBACK_* per-agent (light snapshot for single-field changes — 5M Phase 1)
- aria-pressed accessibility extension для toggle buttons (5M Phase 2)
- Phase fix vs hot-fix distinction (visual sign-off discovery within same Phase
  = bundled fix, NOT hot-fix recovery — 5M Phase 2 fix precedent)
- Surgical scope discipline (carry-overs documented, not "fix while there"
  — 5M Phase 3 precedent, 5N Phase 3 same-file bundle)
- 5-chunk sentinel split — Chunk 1 places forward sentinels @@PART2@@/@@PART3@@;
  Chunks 2a/2b add forward; Chunk 2c does NOT (5L Phase 9 + 5M Phase 7 + 5N
  Phase 8 all confirmed)
- Lesson #11/#22/#32/#34 reflex shifted-left

Branch context:
- Continue claude/setup-5e-shop-mode-a-khIAi (5E-5O stack)
- Single PR target к visual-v2 preserved
- 10-streak без hot-fixes (5E-5N), goal: 11-streak в 5O
- Cumulative tally: 34 lessons (5N applied preventively, no new entries)

Carry-overs accumulated (priority ordered for Option ψ):
1. Backend /v1/agent/list 500 fix (5M Phase 4) — UNBLOCKS visual verify
2. master/setError phantom mutation 8 callsites cleanup (5M Phase 3)
   — AgentDetailView.vue (5) + ResearchTree.vue (2) + RetirementPanel.vue (1)
3. AutoFight mobile responsive .autofight-row @media @820px (5M Phase 2 fix)
4. spectate.watch i18n key для 11 locales (5N Phase 2)
5. Real localization 8 fallback locales spectate keys (5N Phase 4)
6. HudClan further splitting (5L)
7. ClanScene further mood iteration (5L)
8. trState removal entirely (5K Q6)
9. Backend PvP-integration sub-epic (mentioned 4 times) — Path γ for real spectate WS

Branch slug guidance: if harness assigns different slug,
apply Lesson #18 + Blocker A precedent — escalate to user OR rely on ТЗ template
pre-authorization (5N precedent), do NOT blind-checkout without authorization signal.
```

---

## §8 Handoff checklist

Pre-commit verify (Phase 9 self-check):

- [x] File created at `docs/visual-migration/HANDOFF_EPIC5_5O_CHAT_HANDOFF.md`.
- [x] 8 sections (§1 through §8) present.
- [x] 0 unreplaced HTML-comment sentinels (`<!-- @@PART... -->`).
- [x] Section §4 lists 6 ranked options with audit gap matrix item refs.
- [x] Section §5 lists Q1-Q3 per top-4 candidate features (incl. ψ Q1-Q4).
- [x] Section §7 startup message references HEAD commit + branch slug + pre-flight steps.
- [x] Audit progress quoted as **15/22 done (68%)**.
- [x] Hot-fix streak quoted as **10-streak**.
- [x] Cumulative lesson tally quoted as **34** (UNCHANGED — 5N preventive application).
- [x] Lesson #34 cross-referenced in §1 (investigation findings) + §3 (validated patterns) + §7 (startup critical patterns).
- [x] Carry-overs accumulated list in §7 startup message (Option ψ priority-ordered scope hint).
- [x] Branch slug guidance section in §6 references Lesson #18 + Blocker A precedent + 5N pre-authorization mode.
- [x] 5N-introduced practices (4 patterns) added к investigation findings preservation.

After Phase 9 commit + push — **Sub-Epic 5N TRULY CLOSED.** ✅

10-streak headline locked. 15/22 (68%) past two-thirds. Cumulative 34 lessons.

