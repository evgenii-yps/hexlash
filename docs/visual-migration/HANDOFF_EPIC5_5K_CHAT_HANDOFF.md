# HANDOFF — Sub-Epic 5K Chat Handoff

**Predecessor:** 5J ✅ CLOSED (commit `<step 9 hash>` — this handoff is the final 5J commit)
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued through 5E-5J stack)
**Date written:** 2026-04-28

## §3 Уроки 5J actionable для 5K+

### Validated working patterns
- **#11 verify shape, not raw count** — 12 cumulative recoveries (5J added 2: Step 1 awk between-braces vs raw grep -A8 + Step 8 semantic match `Hot-fix metric:** 0`)
- **#18 STOP at structural mismatch** — applied at pre-flight Blocker A (harness directive vs ТЗ branch divergence, no blind git ops, user permission required)
- **#22** — N/A в 5J (no specificity conflicts encountered)
- **#30 Pattern reuse — semantic vs mechanical** — TOOLKIT GROWTH (Path D invert default sub-pattern)

### 5J-introduced patterns (для 5K reuse)

1. **Path D invert default** (within #30 toolkit) — when component visited multiple contexts, default к most-natural shape; opt-in modifier для special contexts. Drop fixed-position from base когда card-context = natural; add `.is-overlay` modifier для overlay reuse.

2. **Shifted-left recovery** — Step 1 awk between-braces verify pre-empts Step 6 checklist false-positive. Lesson #11 reflex shifted earlier в pipeline вместо waiting until verify-only step.

3. **Sentinel split-write mandatory для long FINAL_REPORTs (>~250 lines)** — Step 8 API timeout × 2 in previous session → 3-chunk recovery (Write header + sentinels, Edit replace sentinel × 2). 5K must use same pattern для FINAL_REPORT + this HANDOFF.

4. **Branch fetch + checkout pattern** — when harness fresh slug + existing remote branch needed (Blocker A pattern). `git ls-remote origin | grep <branch>` → `git fetch origin <branch>` → `git checkout <branch>`. User explicit permission required перед actual checkout.

### Anti-patterns avoided в 5J
- 0 blind git ops при Blocker A (user permission required)
- 0 mechanical pattern application (Path D semantic > Path C minimum-touch)
- 0 single-Write attempts > 280 lines (sentinel split early)
- 0 fabricated CSS rules (existing tokens reused)
- 0 abandoned scope (Step 1 unstyled intermediate state was deliberate, communicated in advance)

### Cumulative lesson tally
**30 (UNCHANGED).** 5J = refinement of existing toolkit, no new entries.

## §4 5K scope — Path 1 Daily Tasks Backend

**Recommended: Path 1 — Daily Tasks Backend.**

Estimated scope: **L (~10-13 commits)**. Biggest sub-epic в Эпике 5 после 5D.

### Components needed для Path 1

1. **Backend Prisma model** — DailyTask + UserDailyTask (verify existing schema first per 5I investigation; may already exist partially)
2. **Backend routes** — extend task.js pattern для daily endpoints (list, progress, complete, claim)
3. **Backend cron** — daily reset midnight UTC (setInterval agentScheduler precedent OR add node-cron)
4. **Frontend Vuex swap** — task/dailyTasks real API (existing module ready, just needs action wiring)
5. **HudTraining expand** — 2 → 5 tasks display
6. **Frontend dispatch** — progress events on tap/combo/energy/session/total milestones
7. **trState architectural shift** — drop session-scoped, replace с backend-tracked

### Estimated commit breakdown
- **Backend (5-7 commits):** Prisma migrate + endpoints + cron + tests
- **Frontend (3-5 commits):** HudTraining expand + Vuex swap + progress dispatch + trState removal
- **Closing (3 commits):** CLAUDE.md + FINAL_REPORT (sentinel split) + HANDOFF_5L (sentinel split)

### Alternative recommendations если 5K не Path 1

- **AutoFight toggle (#22)** — M, ~5-7 commits
- **AI Trainer (#12)** — M, ~5-7 commits, ResultOverlay augmentation
- **Spectate flag (#4)** — M, ~5-7 commits, partial wiring exists
- **FightClub level + Morning Report (#14)** — M, ~5-7 commits, MorningReport.vue legacy exists
- **Retirement (#15)** — M, ~5-7 commits, RetirementPanel.vue legacy exists
- **Polish batch** (HudClan splitting + ClanScene mood + ClanActivityFeed) — M, ~6-8 commits

## §5 Open questions — для 5K opening

### If Path 1 (Daily Tasks Backend) chosen

- **Q1 — Cron strategy:** α (setInterval reuse agentScheduler.js pattern) vs β (new `node-cron` dep)?
- **Q2 — Existing dailyTask Prisma table state?** Verify migrations workflow — preserve если exists, extend если partial
- **Q3 — Migration strategy** если existing dailyTask schema есть (preserve, не override)
- **Q4 — Backend test coverage pattern** — existing `/backend/tests/` structure, Jest precedent
- **Q5 — Frontend dispatch trigger points** — где tap/combo/energy events fire (composables, Vuex actions)
- **Q6 — trState removal phasing** — drop entirely OR keep for fallback?

### If alternative (AutoFight / AI Trainer / Spectate / etc) chosen

- Q1-Q3 specific to chosen feature

**Path decision REQUIRED FIRST в 5K pre-flight перед ТЗ writing OR code work.**

## §6 Pre-flight sequence для 5K

### Standard pre-flight (с branch fetch pattern из 5J Blocker A)

```bash
# 1. Verify branch exists on remote
git ls-remote origin | grep "claude/setup-5e-shop-mode-a-khIAi"
# Expected: <step 9 hash> (this commit) at tip

# 2. Fetch + checkout (if not local)
git fetch origin claude/setup-5e-shop-mode-a-khIAi
git checkout claude/setup-5e-shop-mode-a-khIAi

# 3. Verify HEAD
git log --oneline | head -3
# Expected top: <step 9 hash> epic5-5j: step 9 — HANDOFF_EPIC5_5K_CHAT_HANDOFF.md

# 4. Clean tree
git status
# Expected: clean

# 5. Docs present
ls docs/visual-migration/ | grep -E "EPIC5_5(I|J)_FINAL"
# Expected: 2 files (5I + 5J reports)

# 6. Optional npm install (if backend tests planned)
ls node_modules 2>/dev/null || npm install
```

### 5K-specific pre-flight (Path 1 backend)

```bash
# 7. Prisma schema state
grep -E "model (Daily|UserDaily)Task" backend/prisma/schema.prisma
# Verify: existing fields, indexes, relations

# 8. Routes existing daily endpoints
grep -n "daily\|Daily" backend/src/routes/task.js
# Identify: GET /daily, POST /complete-daily etc.

# 9. Cron precedent
grep -n "setInterval\|setTimeout" backend/src/services/agentScheduler.js
# Verify: agentScheduler tick pattern для cron reuse

# 10. Vuex daily tasks wiring
grep -n "daily\|Daily" src/core/state/modules/taskState.js
# Identify: existing actions, mutations, getters
```

### If alternative scope chosen — adapt steps 7-10 к chosen feature

## §7 Стартовое сообщение для нового чата

```
Start 5K. Mode A strict.

Predecessor: 5J ✅ CLOSED (commit `<step 9 hash>`). 12/22 done (55%) — UNCHANGED от 5J relocation.

CRITICAL: 5K starts with Path 1/Alternative decision FIRST. Investigation findings preserved (from 5I + 5J pre-flights).

Mandatory pre-flight (per ТЗ §6):
1. git ls-remote → fetch → checkout claude/setup-5e-shop-mode-a-khIAi
2. Verify HEAD <step 9 hash>
3. Read EPIC5_5J_FINAL_REPORT.md (lesson #30 toolkit growth + Path D invert default)
4. Read EPIC5_5I_FINAL_REPORT.md (Option A→B escalation + lesson #18 application)
5. Read CLAUDE.md Sub-Epics 5A-5J + lessons #1-30
6. Read this HANDOFF полностью
7. Step 0 pre-flight report
8. Decide 5K scope: Path 1 (recommended ~10-13 commits) OR alternative
9. Q1-Q6 questionnaire per chosen Path

Critical patterns (5J inheritances):
- Sentinel split-write mandatory для FINAL_REPORTs >280 lines (5J Step 8 timeout precedent)
- Branch fetch + checkout pattern (5J Blocker A precedent)
- Lesson #11 reflex shifted-left (5J Step 1 awk verify precedent)
- Lesson #18 STOP at structural mismatch (5J Blocker A precedent)
- Lesson #30 Path D invert default (5J semantic decision precedent)

Branch context:
- Continue claude/setup-5e-shop-mode-a-khIAi (5E-5K stack)
- Single PR target к visual-v2
- 6-streak без hot-fixes (5E + 5F + 5G + 5H + 5I + 5J — half Эпика 5)
```

## §8 Чеклист самого handoff'а

- [✅] 5J final state перечислен (12/22 done UNCHANGED, 6-streak)
- [✅] Branch state explained + fetch pattern для harness scenarios
- [✅] Уроки 5J distilled (Path D + shifted-left + sentinel split + branch fetch patterns)
- [✅] **Path 1 vs alternative decision matrix** для 5K
- [✅] Open questions Q1-Q6 listed per Path 1
- [✅] Pre-flight sequence с backend-specific investigation
- [✅] Стартовое сообщение copy-paste ready
- [✅] **Investigation findings preserved** (backend infra ready, agentScheduler precedent, 5 tasks spec, trState architectural shift)
- [✅] Self-reference `<step 9 hash>` placeholder

---

**End of HANDOFF_EPIC5_5K_CHAT_HANDOFF. Sub-Epic 5J — TRULY CLOSED после commit + push.**

## §1 Где сейчас

```
Эпик 5 §4.2 Progress: 12/22 done (55%) — UNCHANGED от 5J
5J relocation, не new feature
Branch: claude/setup-5e-shop-mode-a-khIAi (continued through 5E-5J stack)

5K = Path 1 — Daily Tasks Backend (L scope ~10-13 commits, recommended)

Investigation findings preserved (от 5I/5J pre-flights):
- Backend: Prisma 5.22 + PostgreSQL + Express + Docker (full stack ready)
- Routes pattern: /backend/src/routes/task.js (existing socialTask precedent для DailyTask)
- Cron viable: setInterval reuse (agentScheduler.js precedent) OR add node-cron
- Vuex: task/* module already manages BOTH socialTasks + dailyTasks (no fragmentation)
- trState architectural finding: existing 2 Daily Tasks session-scoped, NOT really daily
  — Path 1 fixes: backend UserDailyTask + cron reset
- 5 tasks spec confirmed (от 5I expanded scope discussion):
  1. Hit the bag — 200 taps
  2. Land 5 combos (×3+)
  3. Spend full energy — 60/60
  4. Train 5 minutes — session ≥300s
  5. Earn 500 taps — session total
- Cron strategy Q2: α (server-side cron) viable per agentScheduler precedent
- Profile placement из 5I deferred — Path 1 не reuses Profile context, Daily Tasks display в HudTraining (existing 2-task slot expanded)
```

**5J highlights:**
- Hot-fix metric: 0 → **6-streak** (5E + 5F + 5G + 5H + 5I + 5J — half Эпика 5 в clean run)
- Bundle: ~22.53kb CSS gzip stable
- Lesson #30 toolkit growth (Path D invert default sub-pattern)
- Sentinel split-write pattern established (Step 8 API timeout × 2 → 3-chunk recovery)
- Branch fetch + checkout pattern (Blocker A — harness fresh slug vs ТЗ existing branch)

## §2 Что прочитать перед стартом 5K

Mandatory reading order:
1. **EPIC5_5J_FINAL_REPORT.md** — Path D invert default, lesson #30 toolkit growth, sentinel split rationale
2. **EPIC5_5I_FINAL_REPORT.md** — Option A→B escalation, lesson #18 application, 5 tasks spec discussion
3. **EPIC5_5H_FINAL_REPORT.md** — base context for Settings card pattern
4. **EPIC5_5G_FINAL_REPORT.md** — Profile baseline reference
5. **CLAUDE.md** Sub-Epics 5A-5J sections + lessons #1-30
6. **This HANDOFF** полностью (§1-§8)

If Path 1 (Daily Tasks Backend):
7. `/backend/prisma/schema.prisma` — current DailyTask + UserDailyTask state
8. `/backend/src/routes/task.js` — existing daily endpoints (likely partial)
9. `/backend/src/services/agentScheduler.js` — setInterval pattern для cron reuse
10. `src/core/state/modules/taskState.js` — existing dailyTasks Vuex action wiring
