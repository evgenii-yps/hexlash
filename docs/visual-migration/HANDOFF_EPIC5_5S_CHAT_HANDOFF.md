# HANDOFF — Sub-Epic 5R closed → 5S start

**Date:** 2026-04-30
**From:** Sub-Epic 5R Q1 backend dedicated debug closure
**To:** Sub-Epic 5S start (option pending user decision)
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continue stack — 9th decision precedent maintained from 5J)
**HEAD:** `4ecd2d2` (5R Phase 7C FINAL_REPORT closure)

---

## 1. Where we are

**Sub-Epic 5R CLOSED.** Q1 carry-over (4-defer history 5N/5O/5P/5Q) terminated structurally.

**Progress: 19/22 (86%).** Three sub-epics remaining to Epic 5 closure.

**Hot-fix streak: 14** preserved (5E-5R clean).

**Cumulative metrics:**

- Lessons promoted: 35 (no promotion in 5R)
- Lesson candidates: 3 active
  - #36 — Incomplete rollback drift detection (PROMOTE pending 2nd test)
  - #37 — Sandbox capability empirical verification (pre-formal)
  - #38 — Multi-layer deploy environment awareness extension (pre-formal, sub-pattern of #33)
- Cumulative recoveries: 66+ (8 catches in 5R session, see 5R FINAL §7)

---

## 2. What 5R closed

Backend `/v1/agent/list` 500 root cause: **incomplete rollback drift**.

PR #350 (Apr 16-ish) rolled back code to 2026-04-14 snapshot — but DB migration `20260416_remove_is_captain_from_agent` was already applied to prod and stayed applied. Code described captain feature alive, prod DB described captain feature dropped.

Frontend graceful fallback (`userData?.captain || null`) masked bug as "No Captain Set" empty state. Bug invisible to users for 13 days.

**Fix shipped:** forward migration `20260429000000_restore_is_captain_to_agent` with `ADD COLUMN IF NOT EXISTS` guards. Idempotent across environments — prod restored column, test/dev no-op.

**Deploy path (atypical):** Phase 1 commit on continue stack `claude/setup-5e-shop-mode-a-khIAi` (`3f6e8dd`) → cherry-picked to new branch `fix/restore-agent-iscaptain-column` from main HEAD (`1257fe6`) → PR #353 to main → merged (`8ae36f0`) → empty trigger commit `da01369` to main (Railway queue incident workaround) → fresh deployment `fb8ed855` → migration applied → backend operational.

**Visual verified:** agent created in The Pit, AgentScheduler errors stopped.

---

## 3. 5S option matrix

| Option | Sub-epic candidate | Size | Streak risk | Notes |
|---|---|---|---|---|
| **γ** | AI Trainer | M | Medium | Viable feature, deferred from 5R Option Y. Requires Anthropic API integration check. |
| **Z** | Cleanup batch | S | Low | RetirementPanel.vue orphan + smaller items. Deferred from 5R. Streak-friendly. |
| ε | FightClub feature | M-L | High | Anti-rec from 5Q (scope ambiguity AI Lv1/2/3 tiering) |
| η | Onboarding | M | High | Anti-rec (design ambiguity) |
| θ | MoveTree | L | High | Anti-rec (size, less streak-friendly) |

**Recommended: γ AI Trainer OR Z Cleanup batch.**

Decision framework:

- If 14-streak preservation prioritized → **Z** (low surface area, mostly deletion + minor refactor)
- If feature progress prioritized → **γ** (real product value, M-size manageable)
- ε/η/θ remain anti-rec — defer until forced by Epic 5 closure pressure

---

## 4. Pre-flight Q-templates per option

### Option γ (AI Trainer) Q-templates

**Q1.** Backend `agentAITrainer` route/service location:

```bash
grep -rn "trainer\|aiTrainer\|train.*agent" backend/src/routes/ backend/src/services/
```

**Q2.** Anthropic SDK usage in backend (existing patterns):

```bash
grep -rn "anthropic\|@anthropic-ai" backend/src/ backend/package.json
```

**Q3.** Frontend AI Trainer modal/view existing scaffolding:

```bash
grep -rn "AITrainer\|aiTrainer" src/views/ src/components/
```

**Q4.** Result-overlay integration point (where AI Trainer surfaces):

```bash
grep -rn "result.*overlay\|ResultOverlay\|ResultModal" src/views/ src/components/
```

**Q5.** API contract from prototype:

- Look in `hexlash_v24.html` for AI Trainer dialogue UI
- Match against current `agentAITrainer` (if exists) for gap analysis

### Option Z (Cleanup batch) Q-templates

**Q1.** RetirementPanel.vue orphan verification:

```bash
grep -rn "RetirementPanel" src/
# Expected: only the file itself, no live imports (orphan confirmed)
```

**Q2.** Other orphan candidates from 5L-5Q sub-epic carry-overs:

```bash
ls src/views/ src/components/ | grep -i "punch3d\|rainview\|legacy"
grep -rn "Punch3D\|RainView" src/ --include="*.vue"
```

**Q3.** HudProfile card-creep — current card count + sources:

```bash
grep -B2 -A30 "profile-card" src/components/hud/HudProfile.vue | head -60
# Count discrete profile-card divs
```

**Q4.** i18n cross-section reuse — duplicated keys across sections:

```bash
ls src/i18n/locales/ | head -3
# Check first language file structure for cross-section duplicates
```

**Q5.** Build size impact baseline:

```bash
npm run build 2>&1 | tail -20
# Capture current bundle size for cleanup delta tracking
```

---

## 5. Carry-overs forward to 5S

Inherited from 5L-5Q + new from 5R:

1. **Animation для retirement** (5Q drop) — frontend animation pass когда retire button pressed
2. **Achievement badge для retirement** (5Q drop, requires backend extension) — separate achievement entity
3. **Legacy RetirementPanel.vue orphan cleanup** — likely absorbed in Option Z
4. **HudProfile card-creep observation** — 7+ cards in HudProfile, monitor for refactor trigger
5. **i18n cross-section reuse note** — formalize если pattern emerges in 5S+
6. **NEW from 5R:** Lesson #36 validation — await 2nd occurrence of incomplete rollback drift for promotion. Mitigation prototyping (CI healthcheck) candidate for Cleanup batch если scope allows.
7. **NEW from 5R:** Branch strategy formalization — backend fixes during visual migration epic should default to PR-to-main pattern, not continue stack accumulation. Document in CLAUDE.md когда updated в Phase 9.

---

## 6. Active disciplines reminder

**Mode A strict** — 1 commit per Phase, push, status report, wait ok.

**Branch:** continue stack `claude/setup-5e-shop-mode-a-khIAi` for visual migration work. Backend fixes (if any in 5S) — separate branch from main + PR.

**Sentinel split:**

- Single-write default per 5P clarification
- 5Q reactive split (5 timeouts)
- 5R preventive split (1 timeout, long-form deliverable) — minor variation, both valid

**Convention discovery reflex (Lesson #32):** mirror existing patterns, не invent. Backend conventions ≠ frontend conventions.

**Pre-edit verification reflex (Lesson #11):** running tally 66+ recoveries. Reflex valuable across both Claude Code and design-Claude sides.

**STOP triggers (Lesson #18):** any structural mismatch — escalate, не auto-fix.

**Investigation refines ТЗ:** triple precedent now (5O Q2 5→7 / 5Q 4 ТЗ assumptions / 5R 4+ pivots). Pre-investigation ТЗ всегда treated as draft.

---

## 7. Files for 5S start

When user starts 5S, design-Claude должен read:

1. **CLAUDE.md** — full source of truth (after Phase 9 update)
2. **`docs/visual-migration/EPIC5_5R_FINAL_REPORT.md`** — closure detail (atypical split 7A/7B/7C, recovery log)
3. **`docs/visual-migration/HANDOFF_EPIC5_5S_CHAT_HANDOFF.md`** — this file
4. **`docs/visual-migration/EPIC5_5Q_FINAL_REPORT.md`** — predecessor closure (recovery #57-58 framing, atypical split framework origin)
5. **`docs/visual-migration/VISUAL_MIGRATION_PLAN.md`** — overall plan

---

## 8. Recommended workflow для start of 5S

1. User attaches this HANDOFF to fresh design-Claude chat
2. Design-Claude reads file list per §7
3. Design-Claude presents 5S option matrix (γ vs Z) с user-side decision request
4. User picks γ or Z
5. Design-Claude prepares pre-flight Q-templates per chosen option (templates in §4)
6. Claude Code runs investigation (read-only)
7. Investigation matrix → ТЗ refinement → Phase-by-Phase execution

---

## 9. Closing

5R closes long-running Q1 carry-over. 19/22 milestone reached. Three sub-epics remaining for Epic 5 closure. 14-streak preserved.

Backend production state: `isCaptain` column restored, captain feature operational again (all rows start `isCaptain=false`, captain selection happens via existing 5G "Set as Captain" UI per user).

Ready for 5S start when user is.
