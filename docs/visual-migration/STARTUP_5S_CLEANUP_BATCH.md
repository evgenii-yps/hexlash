# Старт Sub-Epic 5S — Z Cleanup batch (Option Z, S-size)

**Mode A strict.** После каждого Phase → commit + push + status report → wait ok.

5S = 19th sub-epic в Эпике 5. Goal: 15-streak, carry-over reduction 7 → 3-4.

---

## 🌳 Branch — обязательно continue (9th decision precedent)

```bash
# Pre-flight verify
git branch --show-current
# Expected: claude/setup-5e-shop-mode-a-khIAi

git log --oneline -5
# Expected top: 70a310d (5R Phase 9 [CLAUDE.md](http://CLAUDE.md) update)

git status
# Expected: clean

ls docs/visual-migration/ | grep -E "5R|5S"
# Expected: HANDOFF_EPIC5_5R_CHAT_[HANDOFF.md](http://HANDOFF.md), EPIC5_5R_FINAL_[REPORT.md](http://REPORT.md), HANDOFF_EPIC5_5S_CHAT_[HANDOFF.md](http://HANDOFF.md), STARTUP_5S_CLEANUP_[BATCH.md](http://BATCH.md)
```

**Если pre-flight FAIL** (harness fresh slug — 5J-5R precedent, 9 consecutive continue-stack decisions):
```bash
git ls-remote origin | grep "claude/setup-5e-shop-mode-a-khIAi"
git fetch origin claude/setup-5e-shop-mode-a-khIAi
git checkout claude/setup-5e-shop-mode-a-khIAi
```

Harness slug — leave unused.

---

## 📍 Контекст проекта

Hexlash — PvP fighting game. Vue 3 + Vuex + Three.js + Vite frontend, Express + Prisma + PostgreSQL backend (Docker deploy via Railway).

**Visual migration:** prototype `hexlash_v24.html` → v2 architecture (`/v2/*` routes).

**Эпик 5 — Missing features встраивание.** Progress: **19/22 done (86%)** — Q1 closed in 5R.

**14-streak без hot-fixes** (5E-5R all clean).

**Cumulative lessons: 35.** No promotion in 5R. 3 candidates active:
- #36 — Incomplete rollback drift detection (PROMOTE pending 2nd test)
- #37 — Sandbox capability empirical verification (pre-formal)
- #38 — Multi-layer deploy environment awareness extension (pre-formal)

**Cumulative recoveries: 66+** entering 5S (8 catches в 5R session).

**Carry-overs entering 5S: 7** (5 from 5L-5Q + 2 new from 5R).

---

## 🎯 5S Scope — Z Cleanup batch (S-size)

**Estimated: 1 docs P0 + 0 investigation + 3-5 functional + 3 finals = 7-9 commits total.**

### Why Z chosen (vs γ AI Trainer)

- 14-streak preservation prioritized — S-size с минимальной surface area
- After 5R extended session (8 recoveries), recovery momentum через clean short sub-epic
- Carry-over ledger reduction — Z absorbs multiple inherited items
- γ AI Trainer (M-size feature) deferred to 5T когда streak будет 15+

### Anti-recommendations (continue from 5R)
- ε FightClub feature (scope ambiguity AI Lv1/2/3 tiering)
- η Onboarding (design ambiguity)
- θ MoveTree (L-size, less streak-friendly)

### Scope items (pre-investigation — refine after Q1.1-Q1.5)

| # | Item | Size | Tier (predicted) |
|---|---|---|---|
| 1 | Legacy `RetirementPanel.vue` orphan removal | XS | Adaptation-tier |
| 2 | `Punch3D.vue` / `RainView.vue` orphan check + removal if confirmed unused | XS | Adaptation-tier |
| 3 | HudProfile card-creep — observation OR refactor (per investigation) | XS-S | Conditional |
| 4 | i18n cross-section reuse — formalize OR defer (per investigation) | XS | Conditional |
| 5 | Other small carry-overs surfaced during investigation | varies | Conditional |

**Goal:** 15-streak preserved, carry-over ledger reduction 7 → 3-4.

---

## 📋 PHASE 0 — Handoff package retroactive commit

**Why P0 exists:** В предыдущей сессии 5R этот файл был запланирован как final commit, но chat закрылся раньше выполнения. HEAD остался на `70a310d`. Создаём ретроактивно.

**Scope:** ONE file (preventively split into P0a + P0b due to 1st stream idle timeout — 5R precedent).

**File:** `docs/visual-migration/STARTUP_5S_CLEANUP_[BATCH.md](http://BATCH.md)`

**`HANDOFF_TO_NEW_CHAT_[5S.md](http://5S.md)`** — design-Claude letter — **SKIPPED.** Design-Claude уже в context'е нового chat'а, repo-копия не нужна.

**P0a commit message:**
```
docs(5S): P0a — handoff package retroactive part 1 (preventive split)

P0 catches up missed final commit from prior 5R session. 1st stream idle
timeout on monolithic write — preventive split per 5R framework
(reactive 5Q after 5 timeouts vs preventive 5R after 1; both valid).

P0a = sections 1-4 (Branch / Контекст / Scope / PHASE 0 spec).
P0b will append sections 5-8 (Investigation / Workflow / Lessons / Acceptance).

NOT hot-fix — infrastructure-driven recovery, not code-side issue.
14-streak preserved.
```

**P0b commit message:**
```
docs(5S): P0b — handoff package retroactive part 2 (atypical split)

Appends sections 5-8 to STARTUP_5S_CLEANUP_[BATCH.md](http://BATCH.md) per P0a split plan.
File complete after this commit. Total 2 commits for P0 due to preventive
atypical split (1st timeout, long-form deliverable, 5R framework).
```
