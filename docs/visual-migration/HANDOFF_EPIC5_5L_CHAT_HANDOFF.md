# HANDOFF — Sub-Epic 5L Chat Handoff

**Predecessor:** 5K ✅ CLOSED (commit `<phase 14 hash>` — this handoff is the final 5K commit)
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued through 5E-5K stack)
**Date written:** 2026-04-28

## §1 Где сейчас

```
Эпик 5 §4.2 Progress: 13/22 done (59%) — past halfway, accelerating
Branch: claude/setup-5e-shop-mode-a-khIAi (continued 5E-5K stack)

5L = next sub-epic. Decision REQUIRED FIRST per HANDOFF §4 (8 options ranked).

5K headline: 7-streak без hot-fixes (5E-5K all clean), +3 new lessons
(#31 unique key migration audit, #32 convention discovery reflex, #33 deploy-environment awareness),
cumulative tally 30 → 33.

22-23 cumulative shifted-left recoveries в 5K alone (50% all-time tally).
Backend phases concentrate ~6 catches; frontend phases ~14 catches (Phase 7-9).
Implication: budget more pre-edit reads для frontend Vue/Vuex phases.
```

**Investigation findings preserved (для 5L pre-flight reuse без re-discovery):**

- **Frontend ES modules / Backend CommonJS split** — `export const X = async ...` (frontend) vs `module.exports = {...}` (backend). Wrong syntax breaks Vite or Node.
- **Component store pattern split** — `useStore()` from 'vuex' (5 HUDs) vs direct `import store from '@/core/state/store.js'` (2 HUDs incl. HudSocialTasks 5I + HudTraining 5K). Mirror closest analog rule.
- **`node:test` API (NOT Jest)** — backend test convention. `describe + it + assert` from `node:test` + `node:assert/strict`. Pure unit/pattern simulations. captainService.test.js explicit comment: "Integration tests require running PostgreSQL ... run via manual smoke test."
- **Reward UX precedent** — `master/increaseBalance` mutation (`{add}` payload) + `master/setInfoMessage` info toast (mirror receivedDailyTask action pattern).
- **Manual SQL migration pattern** (no-DB-sandbox) — mirror existing migration files (e.g., `20260330000000_add_clan_level_xp/migration.sql`). Production deploy via Dockerfile CMD applies SQL transparently.
- **Singleton Prisma client via `lib/prisma`** — 9+ services precedent. Avoid `new PrismaClient()` (connection pool fragmentation).
- **Test isolation zero-config** — tests don't import index.js, only individual service modules. Cron/scheduler bootstraps via `server.listen()` callback only. No NODE_ENV guard needed.
- **Backend deploy gating** — GitOps workflow triggers on push к `test`/`main` only. Branch preview frontend ahead of backend → Q6 fallback shows. Visual verify deferred к post-merge для full-stack changes (Lesson #33).

## §2 Что прочитать перед стартом 5L

Mandatory reading order:

1. **EPIC5_5K_FINAL_REPORT.md** (NEW от 5K) — 343 lines, 8 sections. Particularly:
   - §3 Технические детали (20 sub-sections — Strategy A migration / lazy allocation / Phase 6 architectural redirect / convention splits)
   - §6 Уроки — 3 new lessons (#31/#32/#33) с source/pattern/mitigation
   - §5 Расхождения (16 conscious deviations from ТЗ)

2. **EPIC5_5J_FINAL_REPORT.md** — Path D invert default + sentinel split rationale

3. **EPIC5_5I_FINAL_REPORT.md** — Option A→B escalation + lesson #18 application + 5 tasks spec discussion (carryover context)

4. **CLAUDE.md** Sub-Epics 5A-5K sections + lessons #1-33

5. **This HANDOFF** полностью (§1-§8)

If chosen scope touches backend (Options β/γ/ε/ζ/η):
6. `/backend/prisma/schema.prisma` — current models reference
7. `/backend/src/services/agentScheduler.js` — setInterval cron precedent (Option β AutoFight може reuse)
8. `/backend/src/services/dailyTaskCron.js` (NEW от 5K) — cleanest cron service example (midnight UTC alignment)
9. `/backend/src/routes/task.js` (heavily modified в 5K) — endpoint patterns + idempotent POST + scope filter

If chosen scope is Polish (Option α):
6. `/src/components/hud/HudClan.vue` (430 lines, splitting candidate per 5D #11)
7. `/src/scene/scenes/ClanScene.js` (mood polish per 5D #4)
8. `/src/components/fragments/clan/ClanActivityFeed.vue` (integration carryover)

## §3 Уроки 5K actionable для 5L+

### Validated working patterns

- **#11 verify shape, not raw count** — **22-23 cumulative recoveries в 5K alone** (50% all-time tally). Frontend phases concentrate convention catches (Phase 7-9 = 14 catches; backend phases = 6). Pre-edit reads budget: 4-6 для backend phase, 6-10 для frontend phase.
- **#18 STOP at structural mismatch** — applied во всех 5K phases. Phase 6 architectural redirect (Jest → node:test) — best example of "STOP and rethink, не blind code-write".
- **#30 Pattern reuse — semantic vs mechanical** — toolkit growth от 5J Path D. 5K validated в Q1-Q3 + D1-D5 architectural decisions.
- **#32 Convention discovery reflex** — applied Phase 6/7/8/9. Single biggest preventer in 5K (14+ catches).

### 5K-introduced lessons (3 NEW)

**#31 — Schema unique key migrations → findUnique callsite audit.** При schema constraint change (`@@unique([a, b])` → `@@unique([a, b, c])`), Prisma client exposes new compound key name. All existing `findUnique({where: {a_b: ...}})` callers silently broken until runtime. Pattern: mandatory `grep -rn "findUnique.*<old_key>"` across codebase + audit each caller.

**#32 — Convention discovery reflex.** When adding new file in existing folder, read 1+ existing files first. Mirror conventions, don't import external assumptions. Phase 6 prevented entire wrong implementation (Jest assumption vs `node:test` reality). Phase 7-9 prevented 14+ catches (path / module syntax / mutation namespacing / component store pattern).

**#33 — Deploy-environment awareness for full-stack changes.** Vercel preview deploys frontend per-branch automatically. Backend deploys gated on `test`/`main` push (GitOps). For sub-epics с backend changes — visual verify требует test/main merge OR manual backend deploy. Branch preview shows fallback behavior (Q6 buffer), NOT actual backend integration.

### 5K-introduced practice

- **Manual SQL migration pattern** для no-DB-sandbox scenarios — mirror existing migration file format. Production deploy applies via `prisma migrate deploy` in Dockerfile CMD.
- **Phase bundled fix as conscious decision** (Lesson #18 framework) — НЕ hot-fix recovery. Cohesive: "endpoint changes + related fixes = single coherent commit".
- **Frontend phases concentrate convention catches** — Phase 7-9 = 14 catches; backend phases = 6. Implication для future templates: more pre-edit reads для frontend Vue/Vuex phases.
- **5-chunk sentinel split для FINAL_REPORT** при API timeout pressure (Phase 13 5K precedent). Progressive subdivision: 3 → 5 → N. **Sentinel split mandatory для FINAL_REPORTs >280 lines** (5J Step 8 + 5K Phase 13 confirmation).
- **Branch fetch + checkout pattern** — when harness fresh slug + existing remote branch needed (5J Blocker A precedent). User explicit permission required перед actual checkout.

### Anti-patterns avoided в 5K

- 0 fabricated solutions при Phase 6 Jest assumption — architectural redirect via Lesson #11 + #32
- 0 blind callsite changes при Phase 4 regression — intentional bundled fix
- 0 missed cross-phase dependencies (Phase 7 bundled DailyTaskModel update для Phase 9 coherence)
- 0 abandoned scope mid-run despite 22-23 catches
- 0 hot-fix accumulation — all caught shifted-left, none retroactive

### Cumulative lesson tally

**33** (was 30 before 5K, +3 от 5K — #31 / #32 / #33).

## §4 5L scope map — Feature options

5L = next sub-epic. **Decision REQUIRED FIRST** перед ТЗ writing OR code work.

8 candidates ranked by risk/reward после large 5K backend run:

### 🔥 Option α — Polish batch (M scope ~6-8 commits) — RECOMMENDED

- HudClan splitting (5D #11, 430 lines → ~300)
- ClanScene mood polish (5D #4)
- ClanActivityFeed integration
- 5G optimistic UI improvements
- 5F banner persistence polish
- Less risky после большого 5K, leverages existing precedents
- Audit gap matrix items #11/#4/#19/#3 partial

### ⚡ Option β — AutoFight toggle (M scope ~5-7 commits)

- Single feature, well-scoped
- Toggle in Profile settings + dispatch к combatService
- Low risk, leverages 5G captain switch precedent (toggle-style UX)
- Backend: agentScheduler.js setInterval pattern reuse (already exists)
- Audit gap matrix item #22

### 🎯 Option γ — AI Trainer (M scope ~5-7 commits)

- ResultOverlay augmentation post-fight
- Recommendations based on combat data
- New feature, requires UX design
- Backend: Anthropic SDK already in deps + existing AI services (`morningReportService.js` precedent)
- Audit gap matrix item #12

### 📋 Option δ — Spectate flag (M scope ~5-7 commits)

- Partial wiring already exists
- Mostly UI polish + state refinement
- Low risk, builds on existing scaffold
- Audit gap matrix item #4

### 🏆 Option ε — FightClub level + Morning Report (M scope ~5-7 commits)

- MorningReport.vue legacy component exists
- Daily login flow + level progression
- Backend: morningReportService.js exists, AI integration ready
- Audit gap matrix item #14

### 🔄 Option ζ — Retirement (M scope ~5-7 commits)

- RetirementPanel.vue legacy component exists
- Profile section + state machine
- Backend: retirementService.js exists
- Audit gap matrix item #15

### 🚀 Option η — Onboarding tour (L scope ~8-10 commits)

- Bigger scope — entry flow + tooltips + state persist
- Visual-heavy work, leverages 5F HelpModal precedent
- Audit gap matrix item #21

### 🧪 Option θ — MoveTree (L scope ~10+ commits)

- Move tree visualization + DeckBuilder restoration
- Largest remaining scope
- Frontend-heavy: tree rendering + drag-drop UX
- Audit gap matrix item #16

### Recommendation matrix

| Option | Scope | Risk | Backend? | Reuse leverage | Recommended for 5L? |
|---|---|---|---|---|---|
| α Polish | M | Low | No | High (5D/5G/5F) | ✅ **First choice** |
| β AutoFight | M | Low | Yes | Med (5G + agentScheduler) | ✅ Good second |
| δ Spectate | M | Low | Partial | High (existing wiring) | ✅ Good second |
| γ AI Trainer | M | Med | Yes | Med (AI services exist) | After polish |
| ε FightClub level | M | Med | Yes | Med (legacy component) | After polish |
| ζ Retirement | M | Med | Yes | Med (legacy component) | After polish |
| η Onboarding | L | Med | No | Med (5F precedent) | Later |
| θ MoveTree | L | High | No | Low (new UX) | Last |

**Rationale:** post-large-backend-run (5K), prefer Polish OR low-risk single feature. Avoid stacking large scope (5K + L next = compounded API timeout risk).

## §5 Open questions per chosen Path

### Universal Q1-Q3 template (apply to chosen feature)

- **Q1 — Visual context** — где живёт UI element (HUD overlay vs Profile card vs Modal vs new view)?
- **Q2 — State management** — Vuex extend vs new module vs local component state?
- **Q3 — Backend integration** — frontend-only OR backend changes required? Если backend → Lesson #33 deploy awareness applies (visual verify deferred к post-merge).

### If Polish batch (Option α)

- Q1 — Order priority? HudClan splitting first для cleanup, или ClanScene visual first?
- Q2 — Testing strategy для polish — visual regression vs functional preservation?
- Q3 — How many sub-tasks bundled в single 5L vs split к 5L+5M?

### If AutoFight toggle (Option β) OR FightClub/Retirement (ε/ζ)

- Q1 — Schema migration needed? Apply Lesson #31 callsite audit if `findUnique` keys touched.
- Q2 — Cron / scheduled jobs? Apply 5K dailyTaskCron precedent (setInterval midnight UTC pattern, idempotent start, lib/prisma singleton).
- Q3 — Backend test coverage? Apply Lesson #32 — read existing service test первые before adding new.

### If AI Trainer (Option γ)

- Q1 — Trigger point — post-fight overlay only, или persistent UI shadow?
- Q2 — Anthropic API integration — reuse `morningReportService.js` pattern OR new service?
- Q3 — Caching strategy — analysis per fight vs aggregate session?

### If Spectate (Option δ)

- Q1 — Existing wiring scope — что already implemented vs missing?
- Q2 — UI placement — fight overlay vs separate spectate view?

### If Onboarding (Option η)

- Q1 — Entry trigger — first-time user only, или persistent help button?
- Q2 — State persistence — localStorage vs backend user.onboardingComplete flag?

### Decision flow

**Path decision REQUIRED FIRST в 5L pre-flight перед ТЗ writing OR code work.** Once chosen, Q1-Q3 specific to chosen feature — answer in pre-flight investigation.



## §6 Pre-flight sequence для 5L

### Standard pre-flight (с branch fetch pattern из 5J Blocker A precedent)

```bash
# 1. Verify branch exists on remote
git ls-remote origin | grep "claude/setup-5e-shop-mode-a-khIAi"
# Expected: <phase 14 hash> (this commit) at tip

# 2. Fetch + checkout (if not local)
git fetch origin claude/setup-5e-shop-mode-a-khIAi
git checkout claude/setup-5e-shop-mode-a-khIAi

# 3. Verify HEAD
git log --oneline | head -3
# Expected top: <phase 14 hash> epic5-5k: phase 14 — HANDOFF_EPIC5_5L

# 4. Clean tree
git status
# Expected: clean

# 5. Docs present
ls docs/visual-migration/ | grep -E "EPIC5_5(J|K)_FINAL"
# Expected: 2 files (5J + 5K reports)

# 6. Optional npm install (5C/5K precedent — sandbox fresh slug может lack node_modules)
ls node_modules 2>/dev/null || npm install
ls backend/node_modules 2>/dev/null || (cd backend && npm install && cd ..)
```

### 5L-specific pre-flight (depends on chosen Path)

#### Polish batch (Option α)

```bash
# HudClan current size + structure
wc -l src/components/hud/HudClan.vue

# ClanScene current state
wc -l src/scene/scenes/ClanScene.js

# ClanActivityFeed integration points
grep -n "ClanActivityFeed" src/components/fragments/clan/*.vue src/views-v2/*.vue

# Banner persistence (5F)
grep -n "VerifyEmailBanner" src/AppV2.vue src/components/hud/
```

#### AutoFight (Option β)

```bash
# Existing toggle precedents
grep -rn "isMuted\|toggle" src/components/hud/HudProfile.vue | head -10

# agentScheduler reuse points
grep -B2 -A5 "function.*Scheduler\|setInterval" backend/src/services/agentScheduler.js | head -30

# combat dispatch precedents
grep -rn "combatService\|combatEngine" src/scene/ src/composables/ | head -10
```

#### AI Trainer (Option γ) OR FightClub level (ε)

```bash
# Existing AI services
ls backend/src/services/ | grep -i "ai\|trainer\|morning"
cat backend/src/services/morningReportService.js | head -40

# ResultOverlay augmentation point
grep -n "ResultOverlay\|fight-result" src/components/hud/

# Anthropic SDK config
grep -rn "anthropic\|Anthropic" backend/src/ | head -5
```

#### Spectate (Option δ)

```bash
# Existing spectate wiring
grep -rn "spectate\|Spectate\|SPECTATE" src/ | head -20
grep -rn "spectate" backend/src/ | head -10
```

#### Retirement (Option ζ)

```bash
# Legacy component
test -f src/components/club/RetirementPanel.vue && wc -l src/components/club/RetirementPanel.vue

# Backend service
test -f backend/src/services/retirementService.js && wc -l backend/src/services/retirementService.js
```

## §7 Стартовое сообщение для нового чата

```
Start 5L. Mode A strict.

Predecessor: 5K ✅ CLOSED (commit <phase 14 hash>). 13/22 done (59%) — past halfway.

CRITICAL: 5L starts с feature decision FIRST (8 options ranked в HANDOFF §4). NO ТЗ written yet.

Mandatory pre-flight (per HANDOFF §6):
1. git ls-remote → fetch → checkout claude/setup-5e-shop-mode-a-khIAi
2. Verify HEAD <phase 14 hash>
3. Read EPIC5_5K_FINAL_REPORT.md полностью (3 new lessons + 5-chunk practice)
4. Read EPIC5_5J_FINAL_REPORT.md (Path D invert default + sentinel split)
5. Read CLAUDE.md Sub-Epics 5A-5K + lessons #1-33
6. Read this HANDOFF полностью
7. Step 0 pre-flight report
8. Decide 5L scope (α/β/γ/δ/ε/ζ/η/θ — see §4)
9. Q1-Q3 questionnaire per chosen feature (§5)

Critical patterns (5K inheritances):
- Lesson #31 — Schema unique key migrations → findUnique callsite audit
- Lesson #32 — Convention discovery reflex (read existing before adding new)
- Lesson #33 — Deploy-environment awareness for full-stack changes
- 5-chunk sentinel split для FINAL_REPORT (Phase 13 5K precedent)
- Sentinel split mandatory для FINAL_REPORTs >280 lines (5J Step 8 + 5K Phase 13)
- Branch fetch + checkout pattern (5J Blocker A precedent)
- Phase bundled fix as conscious decision (not hot-fix recovery)

Branch context:
- Continue claude/setup-5e-shop-mode-a-khIAi (5E-5L stack)
- Single PR target к visual-v2
- 7-streak без hot-fixes (5E-5K), goal 8-streak
- Cumulative tally: 33 lessons, 50% all-time recoveries в 5K alone

Recommended option: α Polish batch (low risk after large 5K backend run).
Alt low-risk: β AutoFight OR δ Spectate (existing wiring leverage).
Avoid stacking another L scope immediately after 5K.
```

## §8 Чеклист самого handoff'а

- [✅] 5K final state перечислен (13/22 done, 7-streak, +3 lessons)
- [✅] Branch state explained + fetch pattern для harness scenarios
- [✅] Уроки 5K distilled (#31/#32/#33 actionable + practice notes)
- [✅] **8 options ranked** с risk/reward matrix для 5L
- [✅] Q1-Q3 questionnaire templates per chosen Path
- [✅] Pre-flight sequence с feature-specific investigation
- [✅] Стартовое сообщение copy-paste ready
- [✅] **Investigation findings preserved** (frontend ES vs backend CommonJS, store pattern split, node:test convention, manual SQL precedent, etc.)
- [✅] Self-reference `<phase 14 hash>` placeholder (will resolve after commit)

---

**End of HANDOFF_EPIC5_5L_CHAT_HANDOFF. Sub-Epic 5K — TRULY CLOSED после commit + push.**

