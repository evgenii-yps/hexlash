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

---

## 📋 PHASE 0.5 — Investigation Q1.1-Q1.5 (read-only, NO commits)

**Запускать ТОЛЬКО после P0a + P0b commit + push + design-Claude "ok".**

**Read-only investigation.** No file edits, no git changes. Output как text reply (markdown matrix).

После P0.5 results — design-Claude refines ТЗ для real Phase 1 (Cleanup work).

### Q1.1 — RetirementPanel.vue orphan verification

```bash
grep -rn "RetirementPanel" src/
# Expected: only the file itself (src/components/club/RetirementPanel.vue per [CLAUDE.md](http://CLAUDE.md) line 26)
# If grep shows live imports — NOT orphan, escalate

ls src/components/club/ | grep -i "retirement"
ls src/components/hud/ | grep -i "retirement"
# HudRetirement (5Q) is live; RetirementPanel (legacy) is orphan candidate

git log --oneline --all -- "src/components/club/RetirementPanel.vue" | head -5
```

**Output:** file path + line count / orphan vs live confirmation / sibling files inventory.

### Q1.2 — Punch3D / RainView orphan check

Per [CLAUDE.md](http://CLAUDE.md) line 147: `RainView` is live (auth/home view). Punch3D — verify.

```bash
grep -rn "Punch3D" src/ --include="*.vue" --include="*.js"
grep -rn "import.*RainView" src/
grep -rn "import.*Punch3D" src/
ls src/views/ | grep -iE "punch|rain"
ls src/components/ | grep -iE "punch|rain"
```

**Output:** Punch3D live/orphan / RainView confirm live / removal scope если orphan.

### Q1.3 — HudProfile card-creep observation

```bash
wc -l src/components/hud/HudProfile.vue
grep -cE "<[A-Z][a-zA-Z]+ |class=\"profile-card|profile-card-row" src/components/hud/HudProfile.vue
grep -nE "<!-- .* card |^\s*<(Hud|Profile)" src/components/hud/HudProfile.vue | head -30
```

**Output:** line count / card count / decision rec (monitor если <7 cards / extract если 7+).

### Q1.4 — i18n cross-section reuse pattern

```bash
ls src/locales/ | head -15
head -80 src/locales/en.js

node -e "
const data = require('./src/locales/en.js').default || require('./src/locales/en.js');
const keys = [];
function walk(o, prefix='') {
  if (typeof o !== 'object' || o === null) return;
  Object.entries(o).forEach(([k,v]) => {
    if (typeof v === 'object' && v !== null) walk(v, prefix+k+'.');
    else if (typeof v === 'string') keys.push({path: prefix+k, value: v});
  });
}
walk(data);
const dupes = {};
keys.forEach(k => { if(!dupes[k.value]) dupes[k.value] = []; dupes[k.value].push(k.path); });
const significant = Object.entries(dupes).filter(([_,v]) => v.length > 1 && v[0].split('.')[0] !== v[1].split('.')[0]);
console.log('Cross-section dupes:', significant.length);
significant.slice(0,10).forEach(([val,paths]) => console.log(JSON.stringify(val), '→', paths.join(', ')));
" 2>&1 | head -20
```

If en.js fails via require — `cat src/locales/en.js | head -80` and report structure manually.

**Output:** locale format / top dupes / decision rec (formalize / defer).

### Q1.5 — Build size baseline + other small carry-overs

```bash
npm run build 2>&1 | tail -40
ls src/components/ | wc -l
ls src/components/hud/ | wc -l
git log --oneline --since="3 weeks ago" | grep -iE "TODO|FIXME|cleanup|orphan" | head -10
grep -rn "// TODO\|// FIXME\|<!-- TODO\|<!-- FIXME" src/ --include="*.vue" --include="*.js" 2>/dev/null | head -20
```

**Output:** bundle size / warning count / component counts / TODO inventory / recent cleanup commits.

---

## 📋 Workflow

1. **P0a** (✅ done) — header + sections 1-4 → commit + push → status → ok
2. **P0b** (current) — sections 5-8 append → commit + push → status → ok
3. **P0.5** — run all 5 grep blocks (read-only) → output как text matrix → wait ok
4. **Wait для ТЗ refinement** от design-Claude (matrix → real Phase 1 ТЗ)
5. **Don't write code, don't commit до Phase 1 ТЗ confirmation**

---

## 🛠 Mandatory pre-flight reading

1. `[CLAUDE.md](http://CLAUDE.md)` — full source of truth (после 5R Phase 9 update)
2. `docs/visual-migration/HANDOFF_EPIC5_5S_CHAT_[HANDOFF.md](http://HANDOFF.md)` — main handoff (option matrix + Q-templates §4 Option Z)
3. `docs/visual-migration/EPIC5_5R_FINAL_[REPORT.md](http://REPORT.md)` — 5R closure (8 recoveries, 3 lesson candidates, branch strategy formalization)
4. `docs/visual-migration/VISUAL_MIGRATION_[PLAN.md](http://PLAN.md)` — overall plan

---

## 🧠 Critical lessons applied (5R inheritances)

- **#11 verify shape** — running tally **66+ recoveries** entering 5S (now 68+ after 5S P0 catches #67-68)
- **#18 STOP at structural mismatch** — Cleanup batch deletions могут surface unexpected live dependencies. Pre-edit grep ALL imports before delete. **Особо строгий apply в 5S — deletions невозможно undo дёшево.**
- **#32 convention discovery reflex** — mirror existing component/file structure, не invent
- **#33 deploy-environment awareness** — likely N/A для 5S (frontend-only cleanup)
- **#35 reflex catch tiering** — adaptation-tier / bug-bundle-tier / scope-boundary-tier classification active
- **#36 candidate (incomplete rollback drift)** — likely N/A для 5S (no DB changes). Mitigation prototyping deferred.
- **#37/#38 candidates** — sandbox capability + multi-layer awareness — keep in mind для investigation tooling

### 5R-introduced practices (transferable)

- **Branch strategy** — Cleanup batch = frontend-only, continue stack OK. Если surface'нется backend cleanup item → STOP, separate PR-to-main path per Recovery #63 (formalized в [CLAUDE.md](http://CLAUDE.md) `## Branch (Git)`).
- **Atypical split** — preventive variation valid если long-form deliverable + first timeout (5R precedent now applied **2nd time** в 5S P0 — pattern stabilizing)
- **Pre-edit verification reflex** strict apply — Cleanup batch = deletions, ошибка дороже чем в feature work

---

## 🎯 Hot-fix streak

**14-streak без unplanned hot-fixes** (5E-5R all clean). Goal для 5S: **15-streak.**

Recovery #67 (branch divergence) + Recovery #68 (preventive split adoption) — both adaptation-tier per Lesson #35, NOT hot-fixes. Streak intact.

---

## ✅ Acceptance criteria for P0 + P0.5

**P0 (split into P0a + P0b):**
- [x] Pre-flight verified (branch + HEAD `70a310d` + clean tree + docs files)
- [x] P0a: sections 1-4 written, single commit, pushed
- [ ] P0b: sections 5-8 appended, single commit, pushed
- [ ] Status report для P0b: HEAD before/after, total file line count

**P0.5:**
- [ ] All 5 grep blocks executed (read-only)
- [ ] Output как markdown matrix в text reply
- [ ] No file edits, no commits
- [ ] Output covers: Q1.1 RetirementPanel orphan / Q1.2 Punch3D-Rain orphan / Q1.3 HudProfile card count + decision / Q1.4 i18n duplicates + decision / Q1.5 build baseline + TODO inventory

---

## 🚀 Действия сейчас (post-P0b)

1. ✅ Pre-flight branch verify
2. ✅ Read mandatory files
3. ✅ PHASE 0a — sections 1-4 → commit + push → status → ok
4. **PHASE 0b** (current) — sections 5-8 append → commit + push → status → wait ok
5. After ok — **PHASE 0.5** — Q1.1-Q1.5 investigation → output matrix → wait ok
6. No real Phase 1 code, no commits до ТЗ confirmation

---

**P0a + P0b закроют handoff package retroactive. Поехали.**
