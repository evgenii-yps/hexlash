# HANDOFF — Sub-Epic 5J — Chat Handoff

**From:** 5I ✅ CLOSED (commit `b4a6c01` FINAL_REPORT, Step 7 этот handoff `<step 7>`)
**To:** Sub-Epic 5J — **CRITICAL: Path 1/2/3 decision required FIRST** (no ТЗ written yet, decision blocking)

---

## §1 Где мы сейчас

### Эпик 5 §4.2 progress — past halfway

```
After 5A-5E: 6/22 (27%)
After 5F:    9/22 (41%) +3
After 5G:   10/22 (45%) +1
After 5H:   11/22 (50%) +1 (halfway milestone)
After 5I:   12/22 (55%) +1 — Social tasks ✅

Remaining: 10/22 features (5 partial + 5 missing) +5 polish carry-overs
```

### Route table `/v2/*` (unchanged from 5G/5H/5I)

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 + 5G | ✅ FD |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba + **5I** (HudSocialTasks panel) | ✅ |
| `/v2/matchmaking` | 3Bb | ✅ |
| `/v2/create` | 3Bc + 4 | ✅ |
| `/v2/profile` | 5B + 5H | ✅ |
| `/v2/ratings` | 5C | ✅ |
| `/v2/clan` | 5D | ✅ |
| `/v2/shop` | 5E | ✅ |

5I additions: HudSocialTasks panel в `/v2/training` (top-right below Daily Tasks) + SubscribeModal augmentation для lazy mount.

### Branch state

- Current `claude/setup-5e-shop-mode-a-khIAi` — continues 5E + 5F + 5G + 5H + 5I stack. Single PR target к visual-v2.
- Investigation findings preserved для 5J (Backend infra / Vuex unified / Profile placement / trState architectural)

### Investigation findings preserved для 5J pre-flight

From 5I Phase 0 investigation (read-only, no commits):

- **Backend stack:** `/backend/` directory — Prisma 5.22 + PostgreSQL + Express + Docker (`backend/Dockerfile`) + GitOps (`.github/workflows/gitops.yaml`)
- **Cron infrastructure:** No `node-cron` dep. **`agentScheduler.js` setInterval precedent** exists (proves backend persistent-process model works). Vercel cron NOT configured (vercel.json frontend-only).
- **task.js route** existing pattern via `/v1/task/social/:language` endpoint — extension point для daily endpoints.
- **Vuex `task/*` module** ALREADY manages BOTH socialTasks + dailyTasks — no fragmentation needed.
- **Profile layout:** HudProfile.vue 670 lines, 4 cards в `.profile-grid` (Identity / Performance / Friends / Settings) — 5th card placement candidate after Performance.
- **trState architectural finding:** existing 2 Daily Tasks (`taskHits` / `taskCombos`) are session-scoped (NOT really daily). True daily semantics require backend `UserDailyTask` + cron reset.

## §2 Что прочитать в новом чате

Пользователь должен загрузить в новый чат:
1. **CLAUDE.md** (full) — особенно §Sub-Epic 5A-5I sections + lessons #1-30
2. **EPIC5_5I_FINAL_REPORT.md** (commit `b4a6c01`) — особенно §3 Option A→B narrative + §6 lesson refinement framework + §8 Path 1/2 transition guidance
3. **EPIC5_5H_FINAL_REPORT.md** (commit `867a19e`) — для 5B precedent / lazy mount / augmentation reuse rules (key reference if Path 2 chosen)
4. **Path 1/2/3 decision context** — this HANDOFF §3-§4 в первую очередь
5. **Audit gap matrix** (text artifact от earlier chats) — 22 features classification per §4.2
6. **VISUAL_MIGRATION_PLAN.md** — sequence decisions
7. **hexlash_v24.html** — prototype (если visual area touched)

Если пользователь не загрузил — попроси загрузить **до** ответа на любой вопрос про 5J.

## §3 Уроки 5I — actionable для 5J+

### Validated working patterns (5I)

- **#11 verify shape с реальным data** — 10th cumulative recovery (Phase 2 SubscribeModal grep). Pattern reflex-stable across 5 sub-epic streak. Continues working as **dual-mode**: preventive (Step 0 catch) + reactive (Step N recover).
- **#18 STOP tuning + START structural inspection** — **applied at Step 3 visual sign-off** after Step 1 + Step 2 both visually failed. Triggered Phase 1 revert decision instead of attempting third CSS tweak. Lesson framework prevented wasted third commit. **Critical insight:** lesson #18 applied as **intentional decision-maker** — conscious escalation criteria, не retroactive panic.
- **#22 HUD scoped selector match** — applied для `.training-social-panel` + descendant selectors (`.tsp-*` namespace).
- **#30 Pattern reuse — semantic vs mechanical** — **TOOLKIT REFINEMENT** (not new entry). 5I uncovered exception: inline component category from 5H toolkit НЕ guaranteed minimum-touch.

### 5I-introduced refinement (within #30, NOT new lesson #31)

> **Inline component category из lesson #30 toolkit (5H-introduced) НЕ guaranteed minimum-touch.** Visual context (HUD aesthetic vs document-flow legacy) can force re-implementation. Taxonomy categorical, not predictive — first-attempt approach (direct embed OR CSS override) can fail per visual mismatch detection. **Escalation path:** Option A (direct reuse) → Option A.5 (CSS override) → Option B (v2-native re-implementation). **Lesson #18 reflex** determines когда escalate.

### Knowledge capture meta-pattern

5I added 0 new lessons + 1 toolkit refinement. Validates that **не каждый sub-epic produces new lessons**. Sometimes refinement existing lessons through real edge cases more valuable than inflate counter. Lesson tally remains **30** after 5I run (no change from 5H).

### Anti-patterns avoided в 5I (stay vigilant в 5J)

- **0 fabricated solutions** при Option A failure — lesson #18 triggered structural analysis (escalation), не blind tuning attempts
- **0 force-overwrite reverts** — single revert commit (`9fbc52f`) preserves Step 1 + Step 2 commits в git history через revert pattern. Re-traceable for future reference.
- **0 abandoned scope mid-run** — Option A → B clean escalation (Phase 1 revert + Phase 2 re-implementation), не partial-state failure leaving codebase inconsistent.
- **0 unnecessary edits** на main legacy `SocialTasks.vue` — augmentation precise: only nested `SubscribeModal.vue` (2 lines code), main legacy untouched весь run.

### Patterns to apply в 5J+

- **Pre-flight Step 0 mandatory** — каждый ТЗ assumption verified против real codebase data (running tally: 7+ corrections caught в 5F+5G+5H + 1 в 5I)
- **Visual context pre-check** — для inline components, assess HUD aesthetic match upfront (5I-introduced — visual fit pre-check on relocation)
- **Investigation-driven scope expansion** — pre-spec investigation drives ТЗ scope (5G/5H validated, 5I edge case)
- **Lesson #18 as decision framework** — 2 failed visual fixes → conscious escalation, not third tuning attempt

## §4 Карта Sub-Epic 5J — CRITICAL DECISION REQUIRED FIRST

5J is **first sub-epic в Эпике 5 что requires architectural decision before pre-flight**.

**Background:** Mid-5I user requested expanded scope (Profile move + Daily Tasks expand + backend integration). 5I closed на base scope (HudSocialTasks panel в /v2/training). Expanded scope deferred к 5J. **No ТЗ written yet** — Path decision must come first.

### Path 1 — Daily Tasks Backend (L sub-epic, ~10-13 commits)

**Architectural correctness focus.** Move daily tasks tracking from session-scoped trState to backend persistent storage with cron reset.

Components:
- New Prisma model `DailyTask` + `UserDailyTask` (likely partial exists per task.js precedent — verify via Step 0 schema grep)
- Backend route extensions — `task.js` daily endpoints (`/v1/task/daily/:language`, `POST /v1/task/daily/:id/progress`, etc.)
- Daily reset cron — **setInterval reuse** (agentScheduler.js precedent) OR **node-cron dep**
- Frontend Vuex swap — drop trState daily tracking, replace with `task/dailyTasks` real API consumption (existing module already supports)
- HudTraining: expand 2 → 5 tasks с real backend-tracked progress
- Frontend dispatch — progress updates on tap milestones / combo / energy / time / total taps
- Backend test coverage — extend existing tests/ patterns

**Spec'd 5 tasks (если Path 1 chosen):**
1. Hit the bag — 200 taps milestone
2. Land 5 combos (×3+) — combo counter
3. Spend full energy — 60/60 spent в session
4. Train 5 minutes — session duration ≥300s
5. Earn 500 taps — session total taps

**Estimated:** 10-13 commits (backend 5-8 + frontend 3-5 + finals 2). **L scope** — closer к 5D territory.

### Path 2 — Profile Move (S sub-epic, ~3-4 commits)

**Visual placement focus.** Move HudSocialTasks display target from `/v2/training` to `/v2/profile`.

Components:
- Move `<HudSocialTasks />` mount from HudTraining → HudProfile
- New 5th card в `.profile-grid` (after Performance, before Friends)
- HudTraining: remove `<HudSocialTasks />` embed (revert 5I Step 1 mount-line)
- HudProfile: integrate component as Profile card
- CSS adjustments для Profile card context vs current top-right HUD overlay
- May require second variant component (`HudSocialTasksProfile`) if Profile context needs distinct visuals

**Estimated:** 3-4 commits (relocate + Profile integration + CSS + finals). **S scope.**

**5I-pattern lesson application:** if Path 2 chosen, run **visual fit pre-check** ДО Step 1 commit (5I §7 Deferred #6). Profile card context may surface same legacy-vs-HUD visual mismatch as 5I Step 1 did. Visual context detection upfront avoids Phase 1 revert escalation.

### Path 3 — Hybrid (XL sub-epic, ~13-17 commits)

Both Path 1 + Path 2 в одном run. **NOT recommended:**
- Mode A strict под угрозой (большой scope)
- Splits cleaner на отдельные sub-epics 5J + 5K
- Hybrid loses focus — backend changes have different review/test rhythm than frontend visual moves

### Recommended

**Path 2 (Profile Move) FIRST** as 5J — small/safe close of audit gap, validates visual relocation pattern.
**Path 1 (Daily Tasks Backend) NEXT** as 5K — separate run with own ТЗ + investigation, allows backend-focused review.

This sequencing preserves Mode A strict pacing + lets 5I lessons settle before architectural shift.

## §5 Открытые вопросы для 5J pre-flight

### Path 1/2/3 decision (BLOCKING)

**Q1 — какой Path?** (1 / 2 / 3) — recommendation: **Path 2** as 5J.

### If Path 1 (Backend Daily Tasks)

- **Q2 — Cron strategy:** α (setInterval reuse, agentScheduler precedent — no new dep) vs β (node-cron new dep)? Recommend α.
- **Q3 — Existing `dailyTask` Prisma table state?** Pre-flight Step 0 grep `prisma/schema.prisma` для DailyTask + UserDailyTask. May be partial.
- **Q4 — Migration strategy** если existing dailyTask schema есть — overlay new fields vs new migration. Verify before write.
- **Q5 — Backend test coverage pattern** — existing `tests/` directory pattern (read existing test files для reuse).
- **Q6 — Frontend dispatch trigger points** — где tap/combo/energy/time/totalTaps events fire? Investigation grep на trState mutations.

### If Path 2 (Profile Move)

- **Q1 — Profile card visual:** mirror existing Identity/Performance/Friends pattern OR distinct design (mirror current HUD overlay)?
- **Q2 — HudSocialTasks reuse vs new variant:** single component с Profile mode prop OR new `HudSocialTasksProfile` variant component?
- **Q3 — Layout adjustments** — Profile context (cards в grid, document flow) vs current HUD context (fixed-position top-right overlay).
- **Q4 — HudTraining removal:** drop HudSocialTasks из HudTraining entirely OR keep both renderings (training + profile)?

### If Path 3 (Hybrid — not recommended)

- Q1 — confirm scope acceptance (10+ commits под Mode A strict)
- All Path 1 + Path 2 questions combined

## §6 Что делать новому чату в первом сообщении

Standard pre-flight sequence (read-only):

```bash
# 1. Branch slug verification
git branch --show-current
# Expected: claude/setup-5e-shop-mode-a-khIAi (continue 5E+5F+5G+5H+5I stack) либо новый slug per harness.

# 2. 5I finals reachable
git log --oneline | head -5
# Expected: <step 7 = this commit hash> + b4a6c01 (Step 6 FINAL_REPORT) +
#   4719417 (Step 5 CLAUDE.md) + 71d8593 (Phase 2 functional) reachable.

# 3. node_modules
ls node_modules/ | head -3
# If empty → npm install.

# 4. Files loaded check (chat-side, не git)
# CLAUDE.md / EPIC5_5I_FINAL_REPORT.md / EPIC5_5H_FINAL_REPORT.md /
#   audit gap matrix / VISUAL_MIGRATION_PLAN.md / hexlash_v24.html

# 5. Path 1/2/3 DECISION FIRST — see HANDOFF §4. NO investigation OR ТЗ
#    work proceeds until Path locked.

# 6. Path-dependent investigation:
#    Path 1 (Backend Daily Tasks):
#      - Verify Prisma schema for DailyTask + UserDailyTask current state
#      - Check task.js route для existing daily endpoints (likely partial)
#      - agentScheduler.js setInterval precedent verify (proven works)
#      - Migration workflow check (db:setup script semantics)
#      - Frontend dispatch trigger points (trState mutations source)
#    Path 2 (Profile Move):
#      - HudProfile.vue layout grid — verify 4 cards / .profile-grid pattern
#      - Existing card style (.profile-card) для mirror analysis
#      - HudSocialTasks reuse feasibility OR variant component need
#      - Visual fit pre-check (5I lesson — for inline component relocation)

# 7. Step 0 questionnaire — Q1-Q4/Q6 per chosen Path (HANDOFF §5)
```

## §7 Стартовое сообщение для нового чата

```
Start 5J. Mode A strict.

Predecessor: 5I ✅ CLOSED (commit `<step 7 hash>` HANDOFF, `b4a6c01` FINAL_REPORT).
Эпик 5 §4.2 progress: 12/22 done (55%) — past halfway.

CRITICAL: 5J starts with Path 1/2/3 architectural decision. NO ТЗ written yet.
NO code work proceeds until Path locked. See HANDOFF §4 for decision matrix.

Mandatory pre-flight перед Step 0:
1. git branch --show-current — note slug.
2. git log --oneline | head -5 — verify 5I finals reachable (b4a6c01 + 4719417 + 71d8593).
3. ls node_modules → if empty, npm install.
4. Read EPIC5_5I_FINAL_REPORT.md полностью (Option A→B narrative + lesson #30 refinement + Path 1/2 transition).
5. Read EPIC5_5H_FINAL_REPORT.md (5B precedent / lazy mount / augmentation rules).
6. Read CLAUDE.md Sub-Epics 5A-5I + lessons #1-30.
7. Read audit gap matrix (text artifact от prev chat).

Path 1/2/3 decision required FIRST → user picks → Path-dependent investigation.

After Path locked:
- Path 1 (Backend Daily Tasks, L scope): investigate Prisma schema + task.js + agentScheduler precedent
- Path 2 (Profile Move, S scope): investigate HudProfile layout + HudSocialTasks reuse feasibility + visual fit pre-check
- Path 3 (Hybrid, XL scope): NOT recommended

Q1-Q6 questionnaire per chosen Path → ТЗ writing → Step 1+ implementation.

Critical patterns applied (5I validated):
- Pre-flight Step 0 catches ТЗ assumptions at zero-commit cost (cumulative tally 7+ corrections в 5F+5G+5H + 1 в 5I)
- Lesson #18 reflex — STOP tuning + START structural inspection at first sign of mismatch (intentional decision-maker, NOT retroactive panic)
- Lesson #30 refinement (5I) — inline component category НЕ guaranteed minimum-touch; visual context detection upfront
- 0-line legacy touch preferred (5H), 1-line augmentation acceptable (5B), 2-line augmentation precise targeting (5I — only nested SubscribeModal)
- Pattern reuse semantic-vs-mechanical (lesson #30 + 5I refinement)
- Knowledge capture meta-pattern — refinement existing lessons valid, не каждый sub-epic produces new entry

Branch context:
- Continue claude/setup-5e-shop-mode-a-khIAi (5E+5F+5G+5H+5I stack)
- Single PR target к visual-v2 (covers all sub-epics through 5J + further)
- Эпик 5 §4.2 progress: 12/22 done (55%); 10 features remaining + 5 polish carry-overs (5D/5F/5G/5H/5I deferred items)
```

## §8 Чеклист самого handoff'а

- [✅] Файлы 5I final state перечислены (HudSocialTasks.vue / SubscribeModal.vue augment / HudTraining.vue embed)
- [✅] Branch state explained (continue vs new slug decision)
- [✅] 5-streak hot-fix metric noted
- [✅] Эпик 5 §4.2 features progress tracker (12/22 = 55%, past halfway)
- [✅] Уроки 5I distilled (4 validated + 1 toolkit refinement + meta-pattern + anti-patterns avoided)
- [✅] **Path 1/2/3 decision matrix** with scope estimates + rationale + Path 2 recommendation
- [✅] Open questions Q1-Q6 listed per chosen Path (Path 1: backend questions, Path 2: visual questions)
- [✅] Pre-flight sequence с **Path-dependent investigation** guidance
- [✅] Стартовое сообщение copy-paste ready с **Path decision blocking** flag
- [✅] Self-reference `<step 7>` для Step 7 hash placeholder
- [✅] Investigation findings preserved (Backend infra ready / Vuex unified / Profile placement candidate / trState architectural finding / agentScheduler precedent)

**End of HANDOFF_EPIC5_5J_CHAT_HANDOFF.md**

**Sub-Epic 5I — TRULY CLOSED.** ✅
