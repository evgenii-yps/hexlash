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

<!-- Sections 6-9 forthcoming в Phase 2b2 -->
