# HANDOFF — Эпик 5 → Эпик 6 Cutover

## Section 1 — Header

- **Date:** 2026-04-30
- **From:** Sub-Epic 5U closure (κ Path A retirement animation, 17-streak achieved, 22/22 §4.2 milestone, Эпик 5 CLOSED ✅)
- **To:** Эпик 6 cutover initiation (fresh design-Claude chat audit kickoff)
- **Branch state:** `claude/investigate-retirement-animation-zQeg4` (5U designated divergence). 11-decision continue stack `claude/setup-5e-shop-mode-a-khIAi` (5J-5T) exists separately on remote — Эпик 6 must reconcile both branches alongside `main` cutover (see Phase 2b2 §8 investigation Q-templates).
- **HEAD:** `cd0ed8f` (post-P2a2). Will advance through P2b1.1 → P2b1.2 → P2b2 → P2c, final HEAD recorded в Phase 2c CLAUDE.md update.
- **Significance:** First handoff между эпохами в визуальной миграции. Эпик 5 = historic milestone (22/22 sub-epics закрыто, 17-streak преcerved, 79+ cumulative recoveries, 35 lessons promoted + 5 candidates active, methodology toolkit operational). Эпик 6 = final migration epic (routing cutover + legacy `/src` delete + 52-item parking list triage + branch reconciliation).

---

## Section 2 — Где мы сейчас (entering Эпик 6)

**Эпик 5 closure record:**

- **17-streak total** (5E + 5F + 5G + 5H + 5I + 5J + 5K + 5L + 5M + 5N + 5O + 5P + 5Q + 5R + 5S + 5T + 5U all clean) — gated на Phase 2c CLAUDE.md commit clean
- **79+ cumulative recoveries** (entering 5U 77+, plus #78 Phase 0 metadata catch + #79 bridge session lost branch context — adaptation-tier per Lesson #35)
- **35 lessons promoted, 5 candidates active** (#36 incomplete rollback drift detection / #37 sandbox capability empirical verification / #38 multi-layer deploy environment awareness / #39 callsite enumeration & generic-word scoping / #40 locale section-ordering variance)
- **22 sub-epics closed of 22 planned** в §4.2 (closer 5U via κ Path A — 3 retirement animations shipped to HudRetirement.vue: Vue Transition fade, buff-preview entrance stagger, legend ceremony glow pulse)

**v2 migration state at handoff:**

- `/v2/*` route tree fully populated (Pit hub + Auth + FighterDetail + Fight + Create + Profile + Training + Ratings + Matchmaking + Clan + Shop + Spectate)
- HUD components в `src/components/hud/` — 5J Social Tasks card, 5Q Retirement card (animation-polished в 5U), HudProfile composition with 6 cards (card-creep monitor active at 6/7 threshold)
- Three.js scenes registered through single renderer pattern (Эпик 1 foundation), 5A `buildOctagonalRoom` + `createDustField` helpers serve 7 consumers
- Custom i18n 11 locales — 5T orphan cleanup applied (22 deletions), residual debt documented (8+ broken EN placeholders + 31 × 2x dupes + cross-locale-fragmented keys + locale gaps) — NOT auto-Эпик 6 scope
- Visual System v1.0 compliance sustained across all v2 components
- Backend `isCaptain` column restored (5R Q1 forward migration), backend Achievement entity NOT extended (5Q κ Path B drop carry-over)

**Эпик 6 mission (high-level, NOT execution plan):**

1. **Routing cutover** — `/v2/*` becomes default route surface. `/v2` prefix removed. Old routes deprecated/redirected per migration strategy TBD.
2. **Legacy delete** — v1 components в `/src/views/` + `/src/components/` (non-hud) no longer referenced after cutover removed. HudProfile composition uses HUD v2 only; legacy views replaced by `views-v2/`.
3. **Parking list triage** — 52 items в `/docs/phase1-parking-list.md` classified (in-scope cutover / dedicated sub-epic / Эпик 7+ / drop). Classification deferred to Эпик 6 investigation, NOT pre-classified here.
4. **Continue stack reconciliation** — `claude/setup-5e-shop-mode-a-khIAi` (11-decision continue stack 5J-5T) merges to main alongside `claude/investigate-retirement-animation-zQeg4` (5U designated). Merge strategy TBD per investigation Q-Branch-1.

**This handoff scope:** **investigation kickoff support, NOT execution plan.** Fresh chat для Эпика 6 reads this document, opens Claude Code, formulates audit questions based on Section 6 phase skeleton (Phase 2b2 deliverable) + Section 7 investigation Q-templates (Phase 2b2 deliverable). Then drafts Эпик 6 ТЗ. Mitigation steps for risks below — Эпик 6 work, not 5U work.

---

## Section 3 — Risk register (12 known surfaces, no mitigation steps)

Known risk surfaces identified by 5U design-Claude based on 5E-5T accumulated context. Mitigation steps NOT prescribed here — это работа Эпика 6 после investigation. Each risk paired с investigation Q for audit kickoff.

| # | Risk | Surface | Investigation Q (audit kickoff) |
|---|---|---|---|
| R1 | Routing cutover ломает deep links | URL `/v2/profile` becoming `/profile` — bookmarks / external links / Telegram WebApp deep links break | **Q-Route-1:** какие routes есть в текущем `src/router/index.js`? Какие deep-link patterns используются (Telegram WebApp, external, internal)? Migration strategy options: hard cutover vs redirect map vs alias period? |
| R2 | Legacy `/src` delete задевает code used и в /v2 | Some v1 components могут быть imported by v2 components transitively (i18n helpers, ui primitives, services, store modules). Naive delete = build break | **Q-Delete-1:** какие v1 components imported by v2 components? `grep -rn "from '@/components/<v1-only>'" src/views-v2/ src/components/hud/`. Classification: v1-only / shared / v2-only |
| R3 | Bundle size после legacy delete | Main `index.js` 3.4 MB vendor + 111 kB app — legacy components занимают unknown chunk | **Q-Bundle-1:** pre-cutover baseline (`npm run build` всё включено) vs post-delete delta. Какие chunks shrink? Tree-shaking effectiveness validation |
| R4 | i18n хвосты неправильно handle | 5T residual: 8+ broken EN placeholders + 31 × 2x dupes + cross-locale-fragmented keys + locale gaps. Эпик 6 cutover может потребовать new strings (cutover banner, deprecation notice) requiring i18n discipline | **Q-i18n-1:** cutover потребует ли new strings? Если да — Path D ultra-strict scope discipline applies. If translation correctness ambiguous — defer to dedicated post-Эпик 6 i18n parity sub-epic |
| R5 | Continue stack vs designated branch reconciliation | 11-decision continue stack `claude/setup-5e-shop-mode-a-khIAi` (5J-5T) + designated `claude/investigate-retirement-animation-zQeg4` (5U) — both ahead of main. Merge order matters | **Q-Branch-1:** какой commit history разница между two branches? Какие commits unique к каждой? Merge strategy: cherry-pick / merge / rebase? Conflict surface estimate |
| R6 | Backend Achievement entity carry-over (κ Path B drop) | 5Q drop deferred achievement badge backend extension. Эпик 6 может surface'ить new achievement triggers (cutover badge, retirement achievement?), reactivating κ Path B requirement | **Q-Achievement-1:** какой текущий state Achievement entity в backend (Prisma schema, services, helpers)? Lesson #33 PR-to-main chain readiness if backend extension required |
| R7 | HudProfile card-creep — 6/7 threshold | 5L+ → 5S Q1.3 monitor. 6 cards present, 7th = trigger refactor. Cutover может add cards (preferences, migration confirmation, cutover settings) | **Q-CardCreep-1:** какие 6 cards present сейчас? 7th в Эпик 6 scope? If yes — refactor trigger condition met, plan refactor before/with cutover |
| R8 | Lesson #36 validation pending | Incomplete rollback drift detection — pending 2nd test occurrence для promotion. Эпик 6 cutover involves potential DB migrations + code changes — natural surface для validation | **Q-Lesson36-1:** какие DB migrations в Эпик 6 scope (если есть)? Rollback procedure existence? Post-deploy healthcheck (`prisma migrate status`) wired? |
| R9 | Parking list 52 items неизвестная сложность | `/docs/phase1-parking-list.md` 52 items — design-Claude этот файл NOT прочитал в 5U. Размер unknown (мелкие фиксы vs скрытая большая работа) | **Q-Parking-1:** classify 52 items по: trivial fix / medium task / complex investigation. Triage: in-scope cutover / dedicated sub-epic / Эпик 7+ / drop |
| R10 | Streak preservation under cutover risk | 17-streak entering Эпик 6. Cutover = high-risk operation (routing change + legacy delete touches many files simultaneously). Hot-fix probability elevated vs typical sub-epic | **Q-Streak-1:** scope partition strategy. Single-Phase cutover vs multi-Phase incremental. Mode A discipline preserved (1 commit per Phase). Rollback procedure pre-defined per R8 |
| R11 | Mobile / Telegram WebApp regression | v2 viewport tested на desktop. Cutover making /v2 default = mobile/Telegram WebApp users get v2 first time. Visual System v1.0 mobile compliance unverified at scale | **Q-Mobile-1:** existing mobile QA baseline для v2? Telegram WebApp viewport testing precedent (Эпик 0 §8 R1 risk)? Pre-cutover smoke test plan |
| R12 | Auth flow under cutover | `/v2/auth/*` → `/auth/*` route change. Auth guards в router-level. JWT / session preservation through cutover | **Q-Auth-1:** auth guard logic в `src/router/index.js`. Session persistence across route schema change. Re-login force vs session preservation policy decision |

---

## Section 4 — Carry-overs catalog (3 from 5U + 5 lesson candidates)

### 5U → Эпик 6 carry-overs (3 items)

| # | Item | Source | Status entering Эпик 6 |
|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop, κ Path B alternative | CARRY-OVER. Backend Achievement entity extension required (Prisma schema + service + endpoint + helper integration). Lesson #33 PR-to-main chain triggers. **Investigation:** Q-Achievement-1 (R6) |
| 2 | HudProfile card-creep monitor | 5L+ → 5S Q1.3 monitor | MONITOR-FORWARD. 6/7 threshold; refactor triggers if 7th card added. **Investigation:** Q-CardCreep-1 (R7) |
| 3 | Lesson #36 validation track | 5R | CARRY-OVER. Await 2nd occurrence of incomplete rollback drift. **Investigation:** Q-Lesson36-1 (R8) |

### Lesson candidates active (5)

| # | Title | Source | Promotion criteria | Эпик 6 N/A or applicable |
|---|---|---|---|---|
| #36 | Incomplete rollback drift detection | 5R | 2nd test occurrence (DB rollback without code rollback or vice versa) | Applicable if Эпик 6 includes DB migrations |
| #37 | Sandbox capability empirical verification | 5R | pre-formal → 2nd application | Applicable if Эпик 6 surface'ит new sandbox-capability questions |
| #38 | Multi-layer deploy environment awareness extension | 5R | pre-formal → 2nd application | Applicable to cutover (Vercel preview / production / Telegram WebApp distinct environments) |
| #39 | Pre-migration callsite enumeration / generic-word scoping | 5T | 2nd i18n-class application | N/A in cutover unless i18n parity in-scope |
| #40 | Locale section-ordering variance | 5T | 2nd occurrence | N/A in cutover unless i18n parity in-scope |

---

## Section 5 — Future i18n parity catalog (carry from 5T, NOT auto-Эпик 6)

5T FINAL_REPORT §8 documented these as future scope, NOT 5U scope. Эпик 6 may opt-in if cutover surface'ит cleanup opportunity, otherwise dedicated post-Эпик 6 i18n parity sub-epic candidate.

**Translation correctness debt (8+ items):**

- `club.lblBack` — broken EN placeholder в non-EN locales
- `pvp.wins` — broken EN placeholder
- `clan.tabMembers` — broken EN placeholder
- `clan.lblTotalFights` — broken EN placeholder
- `pvp.losses` — broken EN placeholder
- `club.lblMoves` — broken EN placeholder
- `fight.lblAiRetry` — broken EN placeholder
- `club.lblConfirmStep` — broken EN placeholder
- `club.lblNext` — broken EN placeholder

**Genuine context-divergent translations:**

- `name` — clan-entity vs person semantics
- `retry` — verbose vs short forms
- `wins` / `losses` — PvP-context shorter form vs general

**Structural debt:**

- 31 × 2x-only dupes (originally excluded from 5T per Path D scope discipline)
- 3 cross-locale-fragmented keys (today / yesterday / login)
- Pre-existing locale gaps (`profile.invite.btnLogin` × 9 locales, `club.lblToday` / `club.lblYesterday` × 10 locales)
- gameData.branches.{speed,power,technique}.name (semantic separation from UI labels — Lesson #32 boundary)
- club:184 / clan:126 internal restructuring (out-of-scope, Strategy 3 hybrid)

**Decision rule for Эпик 6:** opt-in i18n parity scope ONLY if cutover work natural-fits cleanup (e.g. cutover banner новые strings → discipline applies). Standalone i18n parity = post-Эпик 6 dedicated sub-epic per 5T λ anti-rec preserved.

---

## Section 6 — Phase skeleton для Эпика 6 (structural, NOT execution plan)

**Critical reminder:** это **skeleton**, не plan. Каждая Phase описывает **что эта Phase будет делать на high level + что investigation должен ответить ПЕРЕД этой Phase**. Detailed execution plan = работа Эпика 6 после investigation, не этого handoff.

### Phase 1 — Routing cutover (intent)

**What:** `/v2/*` becomes default route. `/v2` prefix removal. Old route deprecation strategy (hard cutover / redirect map / alias).

**Investigation must answer (pre-Phase 1):**
- Q-Route-1 (R1): route inventory + deep-link patterns + migration strategy choice
- Q-Auth-1 (R12): auth guard logic preservation through route schema change
- Q-Mobile-1 (R11): mobile / Telegram WebApp viewport baseline before cutover

**Risk profile:** HIGH (R1 + R10 + R11 + R12). Single-Phase cutover ломает много URL'ов одновременно. Multi-Phase incremental альтернатива (например staged route-by-route).

**Streak preservation:** Phase 1 ALONE может consume entire streak budget if hot-fix required. Investigation must surface partition strategy before commit.

### Phase 2 — Legacy delete (intent)

**What:** Remove `/src` v1 components no longer referenced after Phase 1 cutover.

**Investigation must answer (pre-Phase 2):**
- Q-Delete-1 (R2): legacy import classification (v1-only / shared / v2-only)
- Q-Bundle-1 (R3): pre-deletion baseline + post-deletion delta expectation

**Risk profile:** MEDIUM-HIGH (R2 + R3). Naive delete = build break. Pre-edit enumeration via Lesson #11 reflex critical.

**Strategy default:** atomic single-commit only after exhaustive callsite verification. Sequential file-by-file fallback if scope explodes.

### Phase 3 — Parking list triage + execution (intent)

**What:** Process 52 items в `/docs/phase1-parking-list.md`.

**Investigation must answer (pre-Phase 3):**
- Q-Parking-1 (R9): classification 52 items по trivial / medium / complex / drop
- Triage decision: какие items in-scope для Эпик 6 vs deferred

**Risk profile:** UNKNOWN. Размер 52 items unknown until classification. Could trigger Эпик 6 scope explosion if many items reveal complex investigation.

**Scope discipline:** Эпик 6 has bounded scope. Items classified complex should defer to Эпик 7+ или dedicated sub-epics, не absorb in Эпик 6.

### Phase 4 — Final QA + visual verification (intent)

**What:** End-to-end testing. Mobile / Telegram WebApp regression. Performance audit (FPS, bundle).

**Investigation must answer (pre-Phase 4):**
- Q-Mobile-1 (R11): test matrix (devices / browsers / Telegram versions)
- Bundle audit: chunk-size warning resolution status (1 pre-existing per CLAUDE.md, может surface other regressions post-cutover)

**Risk profile:** LOW-MEDIUM. QA Phase typically surface'ит bugs requiring iteration; not direct streak risk if Phase 4 itself produces no commits beyond test fixes.

### Phase 5 — Closure (intent)

**What:** Эпик 6 FINAL_REPORT + main merge + branch reconciliation + CLAUDE.md update declaring Эпик 6 CLOSED.

**Investigation must answer (pre-Phase 5):**
- Q-Branch-1 (R5): merge strategy для two ahead-of-main branches (continue stack 5J-5T + designated 5U)
- Final acceptance gate per Section 9

**Risk profile:** LOW. Documentation + merge mechanics. Closer slot disciplines apply.

---

## Section 7 — Investigation Q-templates для audit kickoff

Свежий design-Claude chat для Эпика 6 reads HANDOFF + opens Claude Code в IDE + runs Q-templates ниже (read-only) → returns answers → design-Claude formulates Эпик 6 ТЗ.

**Mirror 5U Phase 0 Q1-Q8 pattern.** Each Q produces structured answer feeding Эпик 6 scope refinement.

### Q-Route-1 — Route inventory + cutover strategy

```bash
# Q-Route-1.1 — Current route map
cat src/router/index.js
grep -nE "path: ['\"]" src/router/index.js | head -50

# Q-Route-1.2 — /v2/* sub-routes inventory
grep -nE "path: ['\"]/v2" src/router/index.js

# Q-Route-1.3 — Deep-link external usage
grep -rn "claude\.ai\|hexlash\.com\|telegram" src/ docs/ --include="*.md" --include="*.vue" --include="*.js" 2>/dev/null | head -20

# Q-Route-1.4 — Migration strategy options analysis
# Hard cutover: /v2/* → /* + redirect /v2/* → /* (legacy bookmark survival)
# Alias mode: keep both /v2/* AND /* working до окончательной legacy delete
# Staged: route-by-route migration (most invasive + most streak-friendly)
```

### Q-Delete-1 — Legacy import classification

```bash
# Q-Delete-1.1 — All v2 imports survey
grep -rn "from '@/components" src/views-v2/ src/components/hud/ src/AppV2.vue 2>/dev/null | sort -u

# Q-Delete-1.2 — Identify v1-only candidates (not imported by v2)
# For each src/components/<name>.vue не в hud/ subdirectory:
# grep -l "<ComponentName>" src/views-v2/ src/components/hud/ — if 0 hits, candidate v1-only

# Q-Delete-1.3 — Shared utilities (services / store / i18n / ui primitives)
# Should NOT delete если v2 uses
ls src/core/services/ src/core/state/modules/ src/components/ui/ src/locales/
```

### Q-Bundle-1 — Pre-cutover bundle baseline

```bash
# Q-Bundle-1.1 — Current bundle (everything included)
npm run build  # log output
ls -la dist/assets/ | head -30

# Q-Bundle-1.2 — Identify legacy chunks
# ProfileView-DArTQWjc.js (legacy) vs ProfileView-DHSPzq6k.js (v2) — duplicates indicate route-tree separation
# Post-deletion: legacy chunks should disappear from chunk manifest

# Q-Bundle-1.3 — Tree-shaking effectiveness
# Vite build output shows unused imports stripped — но dynamic imports могут survive
grep -rn "() => import(" src/router/ src/AppV2.vue
```

### Q-Parking-1 — Parking list classification

```bash
# Q-Parking-1.1 — Read parking list completely
cat docs/phase1-parking-list.md

# Q-Parking-1.2 — Initial triage по категориям:
# - trivial: < 30min, no code changes / single-file fix
# - medium: < 4hr, single sub-task scope
# - complex: > 4hr, requires investigation
# - drop: outdated / no longer relevant
```

### Q-Branch-1 — Branch reconciliation

```bash
# Q-Branch-1.1 — Diff continue stack vs designated
git log --oneline main..claude/setup-5e-shop-mode-a-khIAi
git log --oneline main..claude/investigate-retirement-animation-zQeg4

# Q-Branch-1.2 — Find common ancestor
git merge-base claude/setup-5e-shop-mode-a-khIAi claude/investigate-retirement-animation-zQeg4

# Q-Branch-1.3 — Merge strategy options:
# Strategy A: rebase designated onto continue stack tip → merge continue stack to main (single-PR закрытие)
# Strategy B: cherry-pick 5U commits onto continue stack → continue stack to main (linearizes 5U into 11-decision history)
# Strategy C: merge both branches separately к main (two PRs, two deploy waves)
```

### Q-Achievement-1 — Backend Achievement entity status (κ Path B carry-over)

```bash
# Q-Achievement-1.1 — Schema check
cat backend/prisma/schema.prisma | grep -A5 "model Achievement"

# Q-Achievement-1.2 — awardAchievement helper
cat backend/src/utils/helpers.js | head -50

# Q-Achievement-1.3 — Existing achievement triggers (PAPER_STREET / PROJECT_MAYHEM precedents)
grep -rn "awardAchievement" backend/src/ 2>/dev/null
```

### Q-CardCreep-1 — HudProfile composition status

```bash
# Q-CardCreep-1.1 — Current cards inventory
cat src/components/hud/HudProfile.vue | grep -E "<.*Card|<.*Panel|profile-card" | head -20

# Q-CardCreep-1.2 — 6/7 threshold confirm
# Cards expected (per CLAUDE.md Sub-Epic 5J/5L/5Q): Identity / Friends / Settings / Retirement / Social Tasks / [+1?]
```

### Q-Lesson36-1 — DB migrations + rollback procedure status

```bash
# Q-Lesson36-1.1 — Migration history
ls backend/prisma/migrations/

# Q-Lesson36-1.2 — Rollback procedure existence
grep -rn "rollback\|Rollback" backend/ docs/ 2>/dev/null | head -10

# Q-Lesson36-1.3 — Healthcheck post-deploy
grep -rn "migrate status\|prisma migrate" backend/ docs/ 2>/dev/null | head -10
```

---

## Section 8 — Rollback procedure skeleton

Skeleton, не runbook. Эпик 6 после investigation должен fill в detailed steps. Surface area identified, mitigation steps deferred.

### Rollback trigger conditions

- **Production regression on cutover** — `/` route renders broken UI / fails to load / breaks auth
- **Database migration failure** — Эпик 6 might include migrations (achievement entity, parking list backend changes); rollback drift risk per Lesson #36
- **Mobile / Telegram WebApp critical regression** — viewport / interaction / auth breakage on platforms previously working

### Rollback strategy options (Эпик 6 picks one после investigation)

**Option Roll-A — Branch revert + redeploy:**
1. `git revert <cutover-commit-range>` on main
2. Push к main → trigger deploy
3. Production reverts к pre-cutover state
4. Risk: incomplete rollback drift (Lesson #36) если DB migrations applied — code reverts, schema drift. **MUST verify migration state pre-revert.**

**Option Roll-B — Branch reset + force-push:**
1. `git reset --hard <pre-cutover-commit>` on main
2. Force-push (requires repo policy permission)
3. Risk: branch history rewrite. Other developers / CI broken. Avoid unless critical.

**Option Roll-C — Hotfix forward:**
1. Identify regression root cause
2. Forward-fix commit on main
3. Deploy fix
4. Risk: hotfix может surface another regression (cascading). **Lesson #18 STOP if regression compounds.**

### Rollback investigation triggers (per Lesson #36)

Pre-deploy:
- `prisma migrate status` healthcheck script proposed in 5R Lesson #36 candidate
- Backup `_prisma_migrations` table state pre-deploy
- Document migration ordering для potential reverse-application

Post-deploy:
- Smoke test critical paths (login / fight / profile / clan)
- 5-minute monitoring window после deploy для regression detection
- Rollback decision gate: if regression detected within window AND user impact > threshold → trigger rollback

**Эпик 6 must define:** thresholds (impact level / detection window / responder roles) + automation (auto-rollback or manual gate).

---

## Section 9 — Acceptance gate

Эпик 6 closure conditions. Mirror 5U FINAL_REPORT acceptance pattern.

### Functional acceptance

- [ ] `/v2/*` route prefix removed; `/` renders v2 visual by default
- [ ] All v2 views accessible at clean URLs (/profile, /fight, /clan, /shop, /pit, /training, /ratings, /matchmaking, /create, /auth, /fighter)
- [ ] Auth flow preserved (login / session / WS reconnect across cutover)
- [ ] Mobile / Telegram WebApp regression-free
- [ ] Bundle size delta within reasonable range (legacy delete should reduce size; investigate если increase)
- [ ] No new console errors / warnings beyond pre-existing baseline

### Process acceptance

- [ ] Continue stack `claude/setup-5e-shop-mode-a-khIAi` + designated `claude/investigate-retirement-animation-zQeg4` merged к main per chosen strategy (Strategy A/B/C per Q-Branch-1)
- [ ] Эпик 6 FINAL_REPORT generated per 5T/5U pattern (Sections 1-8)
- [ ] CLAUDE.md updated с Эпик 6 closure section + §4.x progress markers (если applicable) + Эпик 6 CLOSED declaration
- [ ] Parking list 52 items addressed per Q-Parking-1 triage classification (in-scope items closed; deferred items moved к dedicated future sub-epic candidates)
- [ ] Streak status reported (Эпик 6 entered with 17-streak from 5U closure; Эпик 6 closure clean = 18-streak)

### Documentation acceptance

- [ ] HANDOFF_EPIC7_<successor>.md created (если Эпик 7 planned) OR Эпик 6 declared as final migration epic с post-migration roadmap document
- [ ] Lesson candidates status updated (#36/#37/#38/#39/#40 — promoted / deferred / dropped per applicability)
- [ ] Recovery counter updated (Эпик 6 contributes new recoveries to ledger)
- [ ] Future i18n parity sub-epic decision recorded (in-scope Эпик 6 partial / dedicated post-Эпик 6 / drop)

### Streak / recovery final tally for Эпик 6

- Hot-fix metric: 0 expected. Target 18-streak (5E + 5F + ... + 5U + Эпик 6 = 18 sub-epics if Эпик 6 single sub-epic equivalent).
- Recoveries: cumulative 79+ entering. Эпик 6 will add new recoveries per session work.
- Lessons: 35 promoted entering Эпик 6. New promotions if criteria met (#36-#40 promotion candidates pending Эпик 6 surface).

---

**End HANDOFF_EPIC6_CUTOVER.md**
