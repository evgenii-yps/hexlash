# Старт Sub-Epic 5T — γ AI Trainer (Option γ, M-size feature)

**Mode A strict.** После каждого Phase → commit + push + status report → wait ok.

5T = 21st sub-epic в Эпике 5. Goal: 16-streak, feature delivery (AI Trainer post-fight analysis).

---

## 🌳 Branch — обязательно continue (10th decision precedent в 5S, extends to 11th в 5T)

```bash
# Pre-flight verify
git branch --show-current
# Expected: claude/setup-5e-shop-mode-a-khIAi

git log --oneline -5
# Expected top: <5T P0 commit>, just below 1a9497d (5S P3d post-closure docs backfill)
# Then: 85bd545 (P3c — CLAUDE.md update 5S CLOSURE) / 95e30cd (P3b2) / b168b77 (P3b1)

git status
# Expected: clean

ls docs/visual-migration/ | grep -E "5S|5T"
# Expected: STARTUP_5S_CLEANUP_BATCH.md, EPIC5_5S_FINAL_REPORT.md, HANDOFF_EPIC5_5T_CHAT_HANDOFF.md, STARTUP_5T_AI_TRAINER.md
# NOT expected: EPIC5_5T_FINAL_REPORT.md
```

**Если pre-flight FAIL** (harness fresh slug — 5J-5S precedent, 10 consecutive continue-stack decisions):

```bash
git ls-remote origin | grep "claude/setup-5e-shop-mode-a-khIAi"
git fetch origin claude/setup-5e-shop-mode-a-khIAi
git checkout claude/setup-5e-shop-mode-a-khIAi
```

Harness slug — leave unused.

**Pre-flight FAIL по другим причинам** (HEAD неожиданный, dirty tree, missing 5S docs) — STOP, status report, wait ok. НЕ proceed.

---

## 📍 Контекст проекта

Hexlash — PvP fighting game. Vue 3 + Vuex + Three.js + Vite frontend, Express + Prisma + PostgreSQL backend (Docker deploy via Railway).

**Visual migration:** prototype `hexlash_v24.html` → v2 architecture (`/v2/*` routes).

**Эпик 5 — Missing features встраивание.** Progress: **20/22 done (91%)** — 5S CLOSED.

**15-streak без hot-fixes** (5E-5S all clean). Goal для 5T: **16-streak**.

**Cumulative lessons: 35.** Candidates active: #36 (PROMOTE pending), #37/#38 (pre-formal).

**Cumulative recoveries: 71+** entering 5T.

**Carry-overs entering 5T: 5** (animation/badge for retirement, HudProfile monitor, i18n promoted M-task, Lesson #36 validation).

---

## 🎯 5T Scope — γ AI Trainer (M-size feature)

**Estimated: 4-7 functional commits + 3-4 finals = 8-11 base commits.**

**Note on commit count:** Backend route addition = 2-4 commits (continue stack record-keeping + cherry-pick branch + PR-to-main + optional Railway trigger commit per 5R Recovery #65/#66 precedent). Frontend work continues on continue stack normally. **Total estimate refined after investigation: 10-13 commits.**

AI Trainer = post-fight AI analysis feature. Anthropic SDK уже в backend (per CLAUDE.md line 13). Existing precedent: `morningReportService.js` (CLAUDE.md line 89) — Claude AI usage pattern уже в проекте.

### Pre-investigation scope items (refine после Q1.1-Q1.5)

1. **Backend route** — `/agent/aiTrainer` (или existing extension). Anthropic SDK call, prompt template, response parsing.
2. **Frontend modal/integration** — result-overlay extension OR separate modal. Show AI analysis после fight result. Loading state + error fallback.
3. **API contract** — request/response shape (fight context → AI analysis text).
4. **i18n** — UI strings (~5-10 keys × 11 locales).
5. **Prototype reference** — `hexlash_v24.html` resultOverlay для UX baseline.

**Goal:** 16-streak preserved, AI Trainer feature shipped to /v2/ flow.

---

## ❓ Phase 0.5 — Investigation Q1.1-Q1.5 (READ-ONLY — no commits, no edits)

Запусти все 5 grep blocks ниже. Output как text reply (markdown matrix). После результатов — design-Claude review ТЗ против matrix → refine if needed.

**Не пиши код, не делай commits до ТЗ confirmation.**

### Q1.1 — Backend AI Trainer route/service location

```bash
# Existing routes
grep -rn "trainer\|aiTrainer\|train.*agent" backend/src/routes/ backend/src/services/ 2>/dev/null
ls backend/src/routes/ai* 2>/dev/null
ls backend/src/routes/agent* 2>/dev/null
ls backend/src/services/ | grep -iE "ai|trainer|claude"

# Check if route already wired
grep -rn "aiTrainer\|ai-trainer\|ai_trainer" backend/src/index.js backend/src/routes/ 2>/dev/null
```

**Output expected:**
- Existing route file path (если есть) OR confirmation of greenfield
- Service file location pattern
- Existing Anthropic patterns

### Q1.2 — Anthropic SDK usage in backend (existing pattern)

```bash
# SDK presence
grep -rn "anthropic\|@anthropic-ai" backend/src/ backend/package.json | head -30
cat backend/package.json | grep -A2 anthropic

# Existing Claude AI usage — morningReportService precedent (CLAUDE.md line 89)
ls backend/src/services/morningReportService.js
wc -l backend/src/services/morningReportService.js
head -100 backend/src/services/morningReportService.js
```

**Output expected:**
- SDK version из package.json
- Import pattern (`import Anthropic from '@anthropic-ai/sdk'` etc.)
- Existing prompt template style
- Token/model conventions (model name, max_tokens, temperature)
- Auth pattern (env var name)

### Q1.3 — Frontend AI Trainer scaffolding (existing?)

```bash
# v1 components
grep -rn "AITrainer\|aiTrainer\|ai-trainer\|AiTrainer" src/views/ src/components/ 2>/dev/null
ls src/components/ | grep -iE "ai|trainer"

# v2 components — different convention domain
ls src/views-v2/ 2>/dev/null
ls src/components/hud/ 2>/dev/null
grep -rn "AITrainer\|aiTrainer\|ai-trainer" src/views-v2/ src/components/hud/ 2>/dev/null

# Vuex module presence
grep -rn "aiTrainer\|trainerState" src/core/state/modules/ 2>/dev/null
```

**Output expected:**
- Existing scaffolding (если есть) OR greenfield confirmation
- Naming convention precedent (PascalCase component, kebab-case file?)
- HUD-v2 vs legacy components-v1 status (v2 is target per migration)

### Q1.4 — Result-overlay integration point (где AI Trainer surfaces)

```bash
# Result display components
grep -rn "result.*overlay\|ResultOverlay\|HudResult\|fight.*end\|fightEnd" src/views/ src/components/ src/views-v2/ 2>/dev/null | head -30
ls src/components/hud/ 2>/dev/null | grep -iE "result|end"

# Where fight-end shown в /v2 flow
grep -rn "fight_end\|fightEnd\|onFightEnd" src/views-v2/ src/components/hud/ src/views/ 2>/dev/null | head -20

# Existing modal/overlay precedent в HUD-v2
ls src/components/hud/ 2>/dev/null
grep -l "Modal\|Overlay" src/components/hud/*.vue 2>/dev/null
```

**Output expected:**
- Current result display component(s) в /v2 flow
- Integration point candidate (extend existing OR new modal)
- Modal/overlay precedent name + location
- How fight-end event reaches the result component

### Q1.5 — API contract from prototype

```bash
# Prototype location — verify
ls docs/visual-migration/hexlash_v24.html

# AI Trainer markers
grep -n "ai-trainer\|aiTrainer\|AI Trainer\|trainer-\|AIAnalysis\|ai_trainer" docs/visual-migration/hexlash_v24.html | head -30

# resultOverlay context
grep -B2 -A40 "resultOverlay\|result-overlay\|fight-result" docs/visual-migration/hexlash_v24.html | head -100

# Если AI Trainer triggered кнопкой
grep -B5 -A20 "trainer\|analyze\|analysis" docs/visual-migration/hexlash_v24.html | head -80
```

**Output expected:**
- AI Trainer dialogue UI structure в prototype
- Trigger pattern (button click? auto-show after result?)
- Content structure (plain text? sections — strengths/weaknesses/advice?)
- Visual styling hints (modal? inline panel? overlay?)
- API contract inference (what fight context goes in, what analysis comes out)

---

## 📋 Workflow Step 0 — Investigation execution

1. Run Q1.1-Q1.5 read-only (5 grep blocks, no commits, no edits)
2. **Output investigation matrix как text reply в этом chat** (не в repo file). Design-Claude refines ТЗ в conversation per 5O/5Q/5R/5S quadruple precedent (no repo artifact для refinement step) → передаст Phase 1 ТЗ → Claude Code executes.
3. **Не пиши код, не делай commits до ТЗ confirmation.**

---

## 🛠 Mandatory pre-flight reading

1. `CLAUDE.md` — full source of truth (3975 lines, after 5S Phase 9)
2. `docs/visual-migration/HANDOFF_EPIC5_5T_CHAT_HANDOFF.md` — main handoff for 5T (option matrix + Q-templates §4 Option γ)
3. `docs/visual-migration/EPIC5_5S_FINAL_REPORT.md` — 5S closure (5 recoveries, 15-streak)
4. `docs/visual-migration/EPIC5_5R_FINAL_REPORT.md` — 5R (8 recoveries, branch strategy formalization)
5. `docs/visual-migration/VISUAL_MIGRATION_PLAN.md` — overall plan

---

## 🧠 Critical lessons applied (5R + 5S inheritances)

- **#11 verify shape** — running tally **71+ recoveries**. Pre-edit grep before edits.
- **#18 STOP at structural mismatch** — backend route additions / Anthropic SDK pattern / frontend modal pattern — convention discovery first, code action after
- **#32 convention discovery reflex** — backend Anthropic SDK (morningReportService precedent) + frontend HUD-v2 — two distinct convention domains
- **#33 deploy-environment awareness** — backend code changes ALWAYS go via PR-to-main pattern (cherry-pick from main HEAD → separate `fix/<short>` branch → PR → merge → Railway auto-deploy via webhook). НЕ continue stack accumulation. Если P1 surfaces backend route addition — applicable обязательно, не "if". Per 5R Recovery #63 lesson formalized в CLAUDE.md `## Branch (Git)`.
- **#35 reflex catch tiering** — adaptation/bug-bundle/scope-boundary classification active

### 5R-5S introduced practices (transferable)

- **Branch strategy** — backend changes via PR-to-main from main HEAD (cherry-pick from continue stack), не accumulate в continue stack
- **Atypical split** — long-form docs deliverables default split-from-start (4-application precedent)
- **Pre-edit verification reflex** strict apply
- **Investigation-driven scope refinement** — quadruple precedent

---

## 🎯 Hot-fix streak

**15-streak** entering 5T (5E-5S all clean). Goal для 5T: **16-streak**.

---

## 🚀 Действия сейчас

1. **Pre-flight branch verify** (branch + HEAD recent + clean tree + docs files)
2. **Read mandatory files** (CLAUDE.md + HANDOFF_5T + 5S FINAL + 5R FINAL + PLAN)
3. **Run Q1.1-Q1.5 investigation** (5 grep blocks — read-only, no commits)
4. **Output investigation matrix как text reply в этом chat** (per Workflow Step 0 #2)
5. **Wait для ТЗ refinement от design-Claude в conversation** (no repo artifact для refinement step)
6. **No code, no commits до ТЗ confirmation**

---

**Поехали.**
