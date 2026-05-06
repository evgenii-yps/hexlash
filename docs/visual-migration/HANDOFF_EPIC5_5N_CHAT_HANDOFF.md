# HANDOFF — Sub-Epic 5N (Pre-flight chat handoff)

> **Mode A strict.** Single PR target к `visual-v2`. Continue stack `claude/setup-5e-shop-mode-a-khIAi` (5E-5M-...).
> **Predecessor:** 5M ✅ CLOSED (Phase 8 commit — this handoff).
> **Audit progress:** 14/22 done (64%) — past two-thirds in sight.

---

## §1 Где сейчас

- **Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued through 5E-5M stack — 7 sub-epics).
- **HEAD:** Phase 8 commit (this file). Predecessor commit chain Phase 1 `13425bf` → Phase 7 `083209a`.
- **Tree:** clean.
- **Audit (§4.2):** **14/22 done (64%).** Past two-thirds in sight. Remaining: 4 partial + 4 missing.

### 5M headline

**9-streak без hot-fixes** (5E + 5F + 5G + 5H + 5I + 5J + 5K + 5L + 5M all clean). Pure-frontend AutoFight wiring.

- **Phase 2 fix HUD overlay convention surfaced** + **Lesson #34 added** — `.autofight-row` initial inline placement → rendered hidden under back-btn → Phase 2 fix `position: fixed` + `pointer-events: auto`.
- **Phase 3 phantom `master/setError` discovery** — 9 callsites pre-existing legacy bug; surgical 5M-scope fix only (1 site), 8 carry-overs documented.
- **Phase 4 visual sign-off gated by backend `/v1/agent/list` 500** — pre-existing bug surfaced during visual verify, NOT 5M regression.
- **4 cumulative recoveries** в 5M (lessons #11/#22/#32 reflex pattern stable).

### Cumulative lesson tally

**33 → 34 (+1 от 5M).** Lesson #34 — HUD overlay layout convention.

### Investigation findings preserved для 5N+ pre-flight reuse

Inherited from 5K + 5L + 5M runs (do NOT re-discover):

- **Frontend ES modules / Backend CommonJS** split — convention discovered Phase 7 of 5K.
- **Component store split** — `useStore()` (5 HUDs precedent) vs direct import (2 HUDs) — mirror closest analog.
- **`node:test` API** (NOT Jest) — backend test convention discovered Phase 6 of 5K.
- **`master/setErrorMessage` + `ErrorMessageModel.withText()`** — error toast pattern (5L Phase 2 + 5M Phase 1 verified).
- **`master/setInfoMessage`** — info toast pattern (5K reward precedent).
- **Optimistic UI snapshot/rollback pattern** — 5L Phase 2 + 5M Phase 1 transferable to any write-action UX. 5M-introduced refinement: per-agent `ROLLBACK_*` for single-field changes (lighter than full snapshot).
- **Per-user localStorage pattern** `hexlash_*` prefix — 5L Phase 1, transferable к banner-style UI state.
- **HUD overlay convention (Lesson #34)** — every `.detail-hud` child uses `position: fixed` + explicit corner coordinates; `pointer-events: auto` opt-in to override parent's `none` cascade.
- **5-chunk sentinel split** mandatory для FINAL_REPORTs/HANDOFFs >250 lines. **Chunk 2c does NOT add forward sentinel** (5L Phase 9 + 5M Phase 7 confirmed).
- **`master/setError` is phantom mutation** — 8 carry-over callsites in `AgentDetailView.vue` (5) + `ResearchTree.vue` (2) + `RetirementPanel.vue` (1). Use `master/setErrorMessage` + `ErrorMessageModel.withText()`.
- **Lessons #19-21** mandatory для 3D scene tweaks (exposure-aware tuning, single-tweak revertibility, no cascade).
- **`aria-pressed` accessibility extension** для toggle buttons (5M Phase 2 — transferable).
- **ТЗ size estimates may overshoot** — 5L Phase 3 parent 388 vs ≤220 estimate. Accept reality vs force compliance.

---

## §2 Что прочитать (mandatory pre-flight reading order)

1. **`docs/visual-migration/EPIC5_5M_FINAL_REPORT.md`** — full read. Lesson #34 HUD overlay convention case study (Phase 2 fix narrative §3.6), optimistic UI mirror 5L Phase 2 (§3.1-3.5), phantom mutation discovery + surgical scope discipline (§3.10-3.11), Phase 4 backend gating (§3.12).
2. **`docs/visual-migration/EPIC5_5L_FINAL_REPORT.md`** — full read. Per-user localStorage pattern (Phase 1), optimistic UI snapshot/rollback (Phase 2), 5-chunk sentinel placement learning (Phase 9), ClanScene exposure-aware tweaks (Phase 5).
3. **`docs/visual-migration/EPIC5_5K_FINAL_REPORT.md`** — full read. 3 lessons (#31/#32/#33), 5-chunk practice introduction, frontend/backend convention split.
4. **`CLAUDE.md`** — Sub-Epics 5A through 5M sections + lessons #1-34 review.
5. **This HANDOFF** — full read.
6. **`docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md`** — re-orient on overall plan + audit gap matrix §4.2.

---

## §3 Lessons 5M actionable для 5N+

### Validated working patterns

- **#11 verify shape с реальным data** — 4 cumulative recoveries в 5M (path mismatch / phantom mutation / verify-time false-positive / placement convention). Reflex stable across 5E-5M.
- **#18 STOP at structural mismatch** — Phase 3 phantom discovery escalated before scope-creep into 9-callsite cleanup; surgical 5M-scope fix applied. Phase 2 fix converted visual sign-off failure into bundled correction within Phase rather than retroactive hot-fix.
- **#22 HUD scoped selector match** — applied + extended к layout architecture (became seed для #34).
- **#30 Pattern reuse — semantic vs mechanical** — 5L Phase 2 optimistic UI direct mirror with semantic adaptation (`ROLLBACK_AUTO_FIGHT` per-agent vs full snapshot — different lifecycle, different cleanup).
- **#32 Convention discovery reflex** — applied во всех phases. Read existing CSS source before adding new, but extend scope to layout architecture per #34.
- **#34 (NEW от 5M) HUD overlay layout convention** — when adding new elements к fixed-overlay container (parent `position: fixed` + `pointer-events: none`), verify ALL sibling positioning approach pre-edit, не just CSS selector source location or visual styling tokens.

### 5M-introduced practice (transferable к 5N+)

- **`ROLLBACK_*` per-agent optimization** — lighter than full snapshot when only one field changes. Pattern: optimistic mutation flips one field; rollback accepts `{ agentId, prev<Field> }` parameters and reverts only that field. Transferable к other single-field optimistic toggles.
- **`aria-pressed` accessibility extension** для toggle buttons — `<button type="button" :aria-pressed="!!state">` better than `<input type="checkbox">` for binary action with visual indicator. Transferable к other toggle UI.
- **Surgical scope discipline** — when investigation reveals broader pre-existing issues (e.g. phantom mutation 9 callsites), surgically fix only the in-scope callsite + flag carry-overs. Pattern: don't sprawl into adjacent cleanup ("fix while there"). Lesson #18 framework applied.
- **Phase fix vs hot-fix distinction** — visual sign-off discovery during same Phase = bundled fix within Phase scope (5G precedent). NOT cascade tuning failure. Pattern: same-Phase correction preserves hot-fix streak; later-Phase correction breaks it.

### Anti-patterns avoided (preserve в 5N+)

- **0 hot-fix attempts** (9-streak preserved through 5M). Goal: 10-streak in 5N.
- **0 scope creep** — Phase 3 surgical (1 site fixed, 8 carry-over).
- **0 fabricated solutions** — Phase 4 backend gating documented as separate issue, не "force fix".
- **0 abandoned scope** — Phase 4 gated → Phase 5 grep verified code shipped correctly.

---

## §4 5N scope map — Feature options

**5N = next sub-epic. Decision REQUIRED FIRST в pre-flight Step 0.**

Recommended candidates ranked по risk/reward после 5M closure:

### 📋 Option δ — Spectate flag (M scope ~5-7 commits) — **RECOMMENDED**

- Partial wiring already exists в codebase.
- Mostly UI polish + state refinement.
- **Low risk** — builds on existing scaffold.
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

### 🛠 Option ψ — Carry-overs polish batch (S-M scope ~3-5 commits) — alternative

Bundle accumulated carry-overs from 5K/5L/5M:
- Backend `/v1/agent/list` 500 fix (5M Phase 4 gating)
- `master/setError` phantom mutation 8 callsites cleanup (5M Phase 3 carry-over) — `AgentDetailView.vue` 5 sites + `ResearchTree.vue` 2 + `RetirementPanel.vue` 1
- AutoFight mobile responsive `.autofight-row` `@media @820px` (5M Phase 2 fix carry-over)
- HudClan further splitting (5L carry-over)
- ClanScene further mood iteration (5L carry-over)
- `trState` removal entirely (5K Q6 carry-over)

**Easy clean-up между larger features.** Single commit per item OR bundled.

### 🚀 Option η — Onboarding tour (L scope ~8-10 commits)

- Bigger scope — entry flow + tooltips + state persist.
- **Defer recommended.**
- Audit gap matrix item **#21**.

### 🧪 Option θ — MoveTree + DeckBuilder (L scope ~10+ commits)

- Move tree visualization + DeckBuilder.
- **Largest remaining scope** в Эпике 5. Defer.
- Audit gap matrix item **#16**.

---

## §5 Open questions per chosen Path

**Decision REQUIRED FIRST в 5N pre-flight перед ТЗ writing.**

### For Option δ (Spectate) — recommended

- **Q1** — Existing wiring scope — what's done vs missing (legacy + v2 audit)?
- **Q2** — Spectate UX entry point (Hub plinth? Profile card? Match details? Friends list row?)?
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

### For Option ψ (Carry-overs polish batch)

- **Q1** — Order priority — backend `/v1/agent/list` 500 first (unblocks visual verify) OR phantom mutation cleanup (most callsites)?
- **Q2** — Each carry-over as separate phase OR bundled commits per scope?

---

## §6 Pre-flight sequence (mandatory)

```bash
# 1. Verify remote state
git ls-remote origin claude/setup-5e-shop-mode-a-khIAi

# 2. Fetch + checkout
git fetch origin claude/setup-5e-shop-mode-a-khIAi
git checkout claude/setup-5e-shop-mode-a-khIAi

# 3. Verify HEAD = Phase 8 commit (this handoff)
git log --oneline | head -3
# Expected top: <phase 8 hash> epic5-5m: phase 8 — HANDOFF_EPIC5_5N_CHAT_HANDOFF.md
# Expected #2:  083209a epic5-5m: phase 7 — EPIC5_5M_FINAL_REPORT.md

# 4. Verify tree clean
git status

# 5. Read mandatory files (per §2 above)
# - docs/visual-migration/EPIC5_5M_FINAL_REPORT.md (full)
# - docs/visual-migration/EPIC5_5L_FINAL_REPORT.md (full)
# - docs/visual-migration/EPIC5_5K_FINAL_REPORT.md (full)
# - CLAUDE.md (Sub-Epics 5A-5M sections + lessons #1-34)
# - This HANDOFF (full)
# - docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md

# 6. Step 0 pre-flight report
# Document what's read, branch state verified, audit progress recap

# 7. Decide 5N scope (δ/γ/ε/ζ/ψ/η/θ)
# δ Spectate recommended (low risk M scope, existing wiring leverage)
# ψ Carry-overs polish — alternative (clean-up between larger features)

# 8. Q1-Q3 questionnaire per chosen feature (per §5 above)
```

### Branch slug guidance

If new chat session arrives с harness slug ≠ `claude/setup-5e-shop-mode-a-khIAi` — **STOP**. Apply Lesson #18 + Blocker A precedent (5J/5K/5L/5L-Phase-10/5M-Phase-10):

1. Report blocker to user (do NOT blind-switch).
2. Wait for explicit "Option B switch" permission.
3. Only then `git checkout claude/setup-5e-shop-mode-a-khIAi`.
4. Leave harness slug branch unused (no delete — established precedent).

---

## §7 Стартовое сообщение для нового чата

```
Start 5N. Mode A strict.

Predecessor: 5M ✅ CLOSED (commit <phase 8 hash> — HANDOFF_5N itself).
Audit: 14/22 done (64%) — past two-thirds in sight.

CRITICAL: 5N starts с feature decision FIRST.
7 options ranked в HANDOFF §4. Recommended:
  δ Spectate (M ~5-7 commits) — low risk, existing wiring leverage.
  ψ Carry-overs polish — alternative S-M batch (backend 500 + phantom mutation
                                                 cleanup + AutoFight mobile + etc).

Mandatory pre-flight (per HANDOFF §6):
1. git fetch + checkout claude/setup-5e-shop-mode-a-khIAi
2. Verify HEAD <phase 8 hash> + tree clean
3. Read EPIC5_5M_FINAL_REPORT.md (full) — Lesson #34 HUD overlay convention,
   optimistic UI mirror, phantom mutation discovery, Phase 4 backend gating
4. Read EPIC5_5L_FINAL_REPORT.md (full) — per-user localStorage, optimistic UI,
   5-chunk sentinel placement learning
5. Read EPIC5_5K_FINAL_REPORT.md (full) — 3 lessons, 5-chunk practice
6. Read CLAUDE.md Sub-Epics 5A-5M + lessons #1-34
7. Read this HANDOFF полностью
8. Step 0 pre-flight report
9. Decide 5N scope (δ/γ/ε/ζ/ψ/η/θ)
10. Q1-Q3 questionnaire per chosen feature (per HANDOFF §5)

Critical patterns inherited from 5M:
- Lesson #34 — HUD overlay layout convention (verify ALL sibling positioning
  approach pre-edit; not just CSS source location)
- Optimistic UI snapshot/rollback pattern (5L Phase 2 + 5M Phase 1 transferable)
- Per-user localStorage pattern hexlash_<feature>_<login> (5L Phase 1)
- ROLLBACK_* per-agent (light snapshot for single-field changes — 5M Phase 1)
- aria-pressed accessibility extension для toggle buttons (5M Phase 2)
- Phase fix vs hot-fix distinction (visual sign-off discovery within same Phase
  = bundled fix, NOT hot-fix recovery — 5M Phase 2 fix precedent)
- Surgical scope discipline (carry-overs documented, not "fix while there"
  — 5M Phase 3 precedent)
- 5-chunk sentinel split — Chunk 1 places forward; Chunk 2c does NOT
  (5L Phase 9 + 5M Phase 7 confirmed)
- Lesson #11/#22/#32 reflex shifted-left

Branch context:
- Continue claude/setup-5e-shop-mode-a-khIAi (5E-5N stack)
- Single PR target к visual-v2 preserved
- 9-streak без hot-fixes (5E-5M), goal: 10-streak в 5N
- Cumulative tally: 34 lessons (5M added Lesson #34)

Carry-overs accumulated (если Option ψ chosen):
- Backend /v1/agent/list 500 fix (5M Phase 4 gating)
- master/setError phantom mutation 8 callsites cleanup (5M Phase 3)
  — AgentDetailView.vue (5) + ResearchTree.vue (2) + RetirementPanel.vue (1)
- AutoFight mobile responsive .autofight-row @media @820px (5M Phase 2 fix)
- HudClan further splitting (5L)
- ClanScene further mood iteration (5L)
- trState removal entirely (5K Q6)

Branch slug guidance: if harness assigns different slug,
apply Lesson #18 + Blocker A precedent — escalate to user, wait for
explicit switch permission, do NOT blind-checkout.
```

---

## §8 Handoff checklist

Pre-commit verify (Phase 8 self-check):

- [x] File created at `docs/visual-migration/HANDOFF_EPIC5_5N_CHAT_HANDOFF.md`.
- [x] 8 sections (§1 through §8) present.
- [x] 0 unreplaced HTML-comment sentinels (`<!-- @@PART... -->`).
- [x] Section §4 lists 7 ranked options with audit gap matrix item refs.
- [x] Section §5 lists Q1-Q3 per top-5 candidate features (incl. ψ alternative).
- [x] Section §7 startup message references HEAD commit + branch slug + pre-flight steps.
- [x] Audit progress quoted as **14/22 done (64%)**.
- [x] Hot-fix streak quoted as **9-streak**.
- [x] Cumulative lesson tally quoted as **34** (Lesson #34 added by 5M).
- [x] Lesson #34 cross-referenced in §1 (investigation findings) + §3 (validated patterns) + §7 (startup critical patterns).
- [x] Carry-overs accumulated list in §7 startup message (Option ψ scope hint).
- [x] Branch slug guidance section in §6 references Lesson #18 + Blocker A precedent.

After Phase 8 commit + push — **Sub-Epic 5M TRULY CLOSED.** ✅

9-streak headline locked. 14/22 (64%). Cumulative 34 lessons.
