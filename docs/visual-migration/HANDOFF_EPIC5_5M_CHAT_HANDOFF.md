# HANDOFF — Sub-Epic 5M (Pre-flight chat handoff)

> **Mode A strict.** Single PR target к `visual-v2`. Continue stack `claude/setup-5e-shop-mode-a-khIAi` (5E-5L-...).
> **Predecessor:** 5L ✅ CLOSED at commit `d9a387c` (Phase 9 — EPIC5_5L_FINAL_REPORT.md).
> **Audit progress:** 13/22 done (59%) — past halfway.

---

## §1 Где сейчас

- **Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued through 5E-5L stack — 6 sub-epics).
- **HEAD:** `d9a387c` — Phase 9 EPIC5_5L_FINAL_REPORT.md.
- **Tree:** clean.
- **Audit (§4.2):** **13/22 done (59%).** Past halfway. Remaining: 4 partial + 5 missing (per 5L final report §6).

### 5L headline

**8-streak без hot-fixes** (5E + 5F + 5G + 5H + 5I + 5J + 5K + 5L all clean). Polish batch closed cleanly.

- **Phase 5 ClanScene tweaks zero-catch** — 5D Step 5 false-trail pattern AVOIDED via lessons #19-21 applied as preventive (pre-edit verify of all 4 ТЗ assumptions before any edit).
- **11 cumulative recoveries** в 5L (10 mid-phase via lesson #11/#32 reflex + 1 sentinel-duplicate в Phase 9).
- **5-chunk sentinel split worked Phase 9** — but with 1 minor learning (Chunk 2c должен NOT add forward sentinel; otherwise duplicates downstream).

### Cumulative lesson tally

**33 lessons (UNCHANGED after 5L)** — 5L applied existing lessons preventively, не added new entries. Tally locked through 5K addition (#31/#32/#33).

### Investigation findings preserved для 5M+ pre-flight reuse

Inherited from 5K + 5L runs (do NOT re-discover):

- **Frontend ES modules / Backend CommonJS** split — convention discovered Phase 7 of 5K.
- **Component store split** — `useStore()` (5 HUDs precedent) vs direct import (2 HUDs) — mirror closest analog.
- **`node:test` API** (NOT Jest) — backend test convention discovered Phase 6 of 5K.
- **`master/setErrorMessage` + `ErrorMessageModel.withText()`** — error toast pattern (5L Phase 2 verified).
- **`master/setInfoMessage`** — info toast pattern (5K reward precedent).
- **Optimistic UI snapshot/rollback pattern** — 5L Phase 2, transferable к any write-action UX.
- **Per-user localStorage pattern** `hexlash_*` prefix — 5L Phase 1, transferable к banner-style UI state.
- **5-chunk sentinel split mandatory** для FINAL_REPORTs/HANDOFFs >250 lines.
- **Chunk 2c does NOT add forward sentinel** — 5L Phase 9 learning.
- **Lessons #19-21 mandatory** для 3D scene tweaks (exposure-aware tuning, single-tweak revertibility, no cascade).
- **ТЗ size estimates may overshoot** — 5L Phase 3 parent 388 vs ≤220 estimate. Accept reality vs force compliance.

---

## §2 Что прочитать (mandatory pre-flight reading order)

1. **`docs/visual-migration/EPIC5_5L_FINAL_REPORT.md`** — full read. Per-user localStorage pattern (Phase 1), optimistic UI snapshot/rollback (Phase 2), 5-chunk sentinel placement learning (Phase 9), ClanScene exposure-aware tweaks (Phase 5).
2. **`docs/visual-migration/EPIC5_5K_FINAL_REPORT.md`** — full read. 3 new lessons (#31/#32/#33), 5-chunk practice introduction, frontend/backend convention split.
3. **`CLAUDE.md`** — Sub-Epics 5A through 5L sections + lessons #1-33 review.
4. **This HANDOFF** — full read.
5. **`docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md`** — re-orient on overall plan + audit gap matrix §4.2.

---

## §3 Lessons 5L actionable для 5M+

### Validated working patterns

- **#11 verify shape с реальным data** — 11 cumulative recoveries в 5L (10 mid-phase + 1 sentinel duplicate). Reflex stable across 5E-5L. Apply at every grep / pre-edit step.
- **#18 STOP at structural mismatch** — Phase 0 Blocker A applied (branch slug mismatch — escalated to user, did not blind-fix). 5L Phase 5 also engineered to NOT repeat 5D Step 5 false-trail (preventive structural verify).
- **#19-21 Exposure baseline + tiny tweaks** — Phase 5 zero-catch validation. When touching 3D scene materials/lighting: verify exposure baseline FIRST, single-tweak independently revertible, no cascade tuning.
- **#30 Pattern reuse — semantic vs mechanical** — Phase 3 sort state decision (UI-only state stays in child; data state lifts to parent). Toolkit growth: "purely presentational" refinement.
- **#32 Convention discovery reflex** — applied across all 5L phases (15+ pre-edit catches). When adding new file in existing folder, read 1+ existing files first.

### 5L-introduced practice (transferable к 5M+)

- **Per-user localStorage pattern** для banner-style UI state — key prefix `hexlash_<feature>_<login>` prevents cross-account leak; `'guest'` fallback при auth pending; watcher re-инициализирует state on login change.
- **Optimistic UI snapshot/rollback pattern** — capture `{ state: [...], currentEntity: {...} }` snapshot before optimistic flip; on error commit `ROLLBACK_*` + toast; on success await server-truth refetch.
- **5-chunk sentinel split sentinel placement** — Chunk 1 places forward sentinels (`@@PART2@@` + `@@PART3@@`); Chunk 2c (last @@PART2*@@ → §5) does NOT append next sentinel; Chunk 1 already placed `@@PART3@@`.
- **ТЗ size estimates may overshoot** — 5L parent 388 vs ≤220 estimate. Accept reality vs force compliance — boundaries clean at component level matter more than line count.

### Anti-patterns avoided (preserve в 5M+)

- **0 hot-fix attempts** (8-streak preserved through 5L). Goal: 9-streak in 5M.
- **0 blind splits** — Phase 3 sort state decision via convention discovery, not rote ТЗ template.
- **0 fabricated solutions** — Phase 2 mutation namespacing verified against actual codebase (`master/setErrorMessage` not assumed `setInfoMessage`).
- **0 cascade tuning** — Phase 5 single-tweak revertibility (vs 5D Step 5 5-attempt cascade).

---

## §4 5M scope map — Feature options

**5M = next sub-epic. Decision REQUIRED FIRST в pre-flight Step 0.**

Recommended candidates ranked by risk/reward после 5L polish closure:

### ⚡ Option β — AutoFight toggle (M scope ~5-7 commits) — **RECOMMENDED**

- Single feature, well-scoped.
- Toggle в Profile settings card OR HudFighterDetail; dispatch к combatService / agent service.
- **Low risk** — leverages 5G captain switch precedent (toggle UX pattern).
- Existing optimistic pattern from 5L Phase 2 directly transferable.
- Audit gap matrix item **#22**.

### 📋 Option δ — Spectate flag (M scope ~5-7 commits) — also low risk

- Partial wiring already exists в legacy.
- Mostly UI polish + state refinement.
- Audit gap matrix item **#4**.

### 🎯 Option γ — AI Trainer (M scope ~5-7 commits)

- ResultOverlay augmentation post-fight.
- Recommendations based on combat data.
- New UX design needed.
- Audit gap matrix item **#12**.

### 🏆 Option ε — FightClub level + Morning Report (M scope ~5-7 commits)

- `MorningReport.vue` legacy exists — augmentation candidate.
- Daily login flow + level progression.
- Audit gap matrix item **#14**.

### 🔄 Option ζ — Retirement (M scope ~5-7 commits)

- `RetirementPanel.vue` legacy exists — augmentation candidate.
- Profile section integration + state machine.
- Audit gap matrix item **#15**.

### 🚀 Option η — Onboarding tour (L scope ~8-10 commits)

- Bigger scope — entry flow + tooltips + state persist.
- Audit gap matrix item **#21**.

### 🧪 Option θ — MoveTree + DeckBuilder (L scope ~10+ commits)

- Move tree visualization + DeckBuilder.
- **Largest remaining scope** в Эпике 5.
- Audit gap matrix item **#16**.

---

## §5 Open questions per chosen Path

**Decision REQUIRED FIRST в 5M pre-flight перед ТЗ writing.**

### For Option β (AutoFight) — recommended

- **Q1** — UI placement: Profile settings card vs HudFighterDetail?
- **Q2** — Toggle pattern: optimistic UI per 5L Phase 2 OR await-style?
- **Q3** — Backend: existing `/agent/:id/autofight` endpoint OR new endpoint required?

### For Option δ (Spectate)

- **Q1** — Existing wiring scope — what's done vs missing (legacy audit needed)?
- **Q2** — Spectate UX entry point (Hub plinth? Profile card? Friends list row?)?
- **Q3** — State sync pattern (real-time WS vs polling)?

### For Option γ (AI Trainer)

- **Q1** — Recommendation source — heuristic vs ML / Anthropic API?
- **Q2** — UI placement: ResultOverlay augmentation vs separate modal vs Profile card?
- **Q3** — Data structure для recommendations (fixed slots vs dynamic list)?

### For Option ε (FightClub level + Morning Report)

- **Q1** — Daily login detection mechanism (timestamp vs session flag vs cron)?
- **Q2** — `MorningReport.vue` legacy reuse via augmentation pattern OR rewrite?
- **Q3** — Level progression algorithm (XP-based linear vs tier-based)?

### For Option ζ (Retirement)

- **Q1** — `RetirementPanel.vue` legacy reuse via augmentation OR rewrite?
- **Q2** — Profile section integration (new card vs Settings sub-section)?
- **Q3** — State machine transitions (active → retiring → retired) — visualization needed?

---

## §6 Pre-flight sequence (mandatory)

```bash
# 1. Verify remote state
git ls-remote origin claude/setup-5e-shop-mode-a-khIAi

# 2. Fetch + checkout
git fetch origin claude/setup-5e-shop-mode-a-khIAi
git checkout claude/setup-5e-shop-mode-a-khIAi

# 3. Verify HEAD = Phase 10 commit (after this handoff lands)
git log --oneline | head -3
# Expected top: <phase 10 hash> epic5-5l: phase 10 — HANDOFF_EPIC5_5M_CHAT_HANDOFF.md
# Expected #2:  d9a387c epic5-5l: phase 9 — EPIC5_5L_FINAL_REPORT.md

# 4. Verify tree clean
git status

# 5. Read mandatory files (per §2 above)
# - docs/visual-migration/EPIC5_5L_FINAL_REPORT.md (full)
# - docs/visual-migration/EPIC5_5K_FINAL_REPORT.md (full)
# - CLAUDE.md (Sub-Epics 5A-5L sections + lessons #1-33)
# - This HANDOFF (full)
# - docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md

# 6. Step 0 pre-flight report
# Document what's read, branch state verified, audit progress recap

# 7. Decide 5M scope (β/δ/γ/ε/ζ/η/θ)
# β AutoFight OR δ Spectate recommended (low risk M scope)

# 8. Q1-Q3 questionnaire per chosen feature (per §5 above)
```

### Branch slug guidance

If new chat session arrives с harness slug ≠ `claude/setup-5e-shop-mode-a-khIAi` — **STOP**. Apply Lesson #18 + Blocker A precedent (5J/5K/5L/5L-Phase-10):

1. Report blocker to user (do NOT blind-switch).
2. Wait for explicit "Option B switch" permission.
3. Only then `git checkout claude/setup-5e-shop-mode-a-khIAi`.
4. Leave harness slug branch unused (no delete — 5J/5K/5L/5L-Phase-10 precedent).

---

## §7 Стартовое сообщение для нового чата

```
Start 5M. Mode A strict.

Predecessor: 5L ✅ CLOSED (commit <phase 10 hash> — HANDOFF_5M itself).
Audit: 13/22 done (59%) — past halfway.

CRITICAL: 5M starts с feature decision FIRST.
8 options ranked в HANDOFF §4. Recommended:
  β AutoFight (M ~5-7 commits) OR δ Spectate (M ~5-7 commits).
Both low risk, leverage 5L optimistic UI pattern.

Mandatory pre-flight (per HANDOFF §6):
1. git fetch + checkout claude/setup-5e-shop-mode-a-khIAi
2. Verify HEAD <phase 10 hash> + tree clean
3. Read EPIC5_5L_FINAL_REPORT.md (full) — per-user localStorage,
   optimistic UI, 5-chunk sentinel placement learning
4. Read EPIC5_5K_FINAL_REPORT.md (full) — 3 new lessons, 5-chunk practice
5. Read CLAUDE.md Sub-Epics 5A-5L + lessons #1-33
6. Read this HANDOFF полностью
7. Step 0 pre-flight report
8. Decide 5M scope (β/δ/γ/ε/ζ/η/θ)
9. Q1-Q3 questionnaire per chosen feature (per HANDOFF §5)

Critical patterns inherited from 5L:
- Per-user localStorage pattern hexlash_<feature>_<login> (5L Phase 1)
- Optimistic UI snapshot/rollback pattern (5L Phase 2)
- 5-chunk sentinel split — Chunk 1 places forward; Chunk 2c does NOT
  (5L Phase 9 learning)
- ТЗ size estimates may overshoot — accept reality vs force compliance
  (5L Phase 3)
- Lessons #19-21 для 3D scene work (exposure-aware tuning)
- Lesson #11/#32 reflex shifted-left (verify shape с реальным data,
  convention discovery в новых folders)

Branch context:
- Continue claude/setup-5e-shop-mode-a-khIAi (5E-5M stack)
- Single PR target к visual-v2 preserved
- 8-streak без hot-fixes (5E-5L), goal: 9-streak в 5M
- Cumulative tally: 33 lessons (no new entries from 5L,
  5L applied existing preventively)

Branch slug guidance: if harness assigns different slug,
apply Lesson #18 + Blocker A precedent — escalate to user, wait for
explicit switch permission, do NOT blind-checkout.
```

---

## §8 Handoff checklist

Pre-commit verify (Phase 10 self-check):

- [x] File created at `docs/visual-migration/HANDOFF_EPIC5_5M_CHAT_HANDOFF.md`.
- [x] 8 sections (§1 through §8) present.
- [x] 0 sentinel orphans (`@@PART*@@` markers all replaced).
- [x] Section §4 lists 7 ranked options with audit gap matrix item refs.
- [x] Section §5 lists Q1-Q3 per top-5 candidate features.
- [x] Section §7 startup message references HEAD commit + branch slug + pre-flight steps.
- [x] Audit progress quoted as **13/22 done (59%)**.
- [x] Hot-fix streak quoted as **8-streak**.
- [x] Cumulative lesson tally quoted as **33**.
- [x] Branch slug guidance section in §6 references Lesson #18 + Blocker A precedent.

After Phase 10 commit + push — **Sub-Epic 5L TRULY CLOSED.**
