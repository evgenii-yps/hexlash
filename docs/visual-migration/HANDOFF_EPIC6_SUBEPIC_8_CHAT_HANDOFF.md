# HANDOFF — Hexlash Visual Migration — Эпик 6 — Sub-epic 8 starting

**Date:** 2026-05-05
**Reason for handoff:** Sub-epic 7 closed clean (Visual polish round + Auth + Wallet redesign). Fresh design-Claude session starting Sub-epic 8 (Pre-cutover gate + v1→v2 cutover + Эпик 6 closure — L size).
**Predecessor:** `EPIC6_SUBEPIC_7_FINAL_REPORT.md` (CL2 commit `3c6e248`)
**Next sub-epic:** Sub-epic 8 — Pre-cutover gate + cutover + Эпик 6 closure (FINAL Эпик 6 sub-epic)

---

## ROLE — design-Claude

Ты — design-Claude в Hexlash visual migration project. User не-технический, работает с Claude Code в IDE на отдельной branch. **Ты пишешь ТЗ** для Claude Code, Claude Code исполняет на branch.

User общается на русском, нужны простые объяснения. User часто отвечает короткими сообщениями ("a", "b", "c", "ok", "пиши", "go"). User выбирает буквы из вариантов. **НЕ задавай слишком много вопросов сразу.** Бери решения сам где можешь, спрашивай только critical decisions. Когда user сигналит "не понимаю" / "ты опять забываешь как со мной общаться" — упрощай объяснение, fewer questions, конкретные рекомендации.

**Project files в /mnt/project/** — там лежат CLAUDE.md и handoff файлы.
**ТЗ files** сохраняются в /mnt/user-data/outputs/ для удобства copy-paste user'ом.

**Naming convention:** `EPIC6_SUBEPIC_<N>_*` для всех closure docs (established Sub-epic 2, applied through 7).

---

## CURRENT STATE

- **Branch:** `claude/visual-polish-auth-wallet-6xe6m` (continue stack — Sub-epic 7 closed здесь, CL1/CL2/CL3 commits added on top)
- **HEAD entering Sub-epic 8:** C18 SHA (this commit) — current as of CL3 commit landing
- **Streak:** **31** ✅ (31 consecutive sub-epics clean — milestone reached в Sub-epic 7 closure)
- **Эпик 6 progress:** **14/14 (100% functional)** — only Sub-epic 8 cutover remaining
- **Recoveries cumulative:** **88+** (+1 в Sub-epic 7: #88 Lesson #43 8th occurrence — bootstrap branch divergence harness fresh-slug, adaptation-tier same-SHA)
- **Lessons promoted:** **38** (+1 в Sub-epic 7: #45 PROMOTED — Phase 0 metadata error pattern, validated via 11 occurrences)
- **Lesson candidates active:** 7 (#36/#37/#38/#39/#40/#41/#42)
- **Phase 0 mandatory subsections:** **6** (5 prior + 6th PROMOTED в Sub-epic 6 — semantic invariant + flow direction verification)
- **Closure shapes established (5):** standard linear / deprecation-via-redirect / code-complete + deferred-verify / scope-deferral-к-downstream / code-complete + deferred-deploy
- **Cherry-pick PRs cumulative:** 4 (PR #353 6B-3a-backend / PR #354 Sub-epic 1 / PR #355 Sub-epic 4b / PR #356 Sub-epic 6 C4.5)
- **Sub-epic 7 metric:** **30 cumulative Lesson #11 catches pre-edit** (within Phase 0 prediction 30-60 mid-range; consistent с mixed scope batch). 0 hot-fixes, 0 reactive splits, 0 STOP-tier на main flow. **2 STOPs (C5 + C11 first attempts)** recovered cleanly via revised ТЗ workflow — not classified as recoveries (Mode A discipline working as designed).

---

## ЧТО ЗАКРЫТО В ЭПИКЕ 6 (14 sub-epics — все functional кроме Sub-epic 8)

1. **6A** — Лёгкий cutover (4 routes redirect)
2. **6B-1** — `/help` страница (HelpView Pattern B)
3. **6B-2** — `/profile/skins` deprecation-via-redirect
4. **6B-3a-backend** — Privacy fix (`formatUserPublicResponse`, code-complete + deferred-verify)
5. **6B-3** — `/v2/user/:login` Guest Profile (reactive split 7a/7b)
6. **6B-3b** — Friends entry point wiring (scope-deferral pattern)
7. **Sub-epic 1 (was 6B-4)** — `/v2/clan/:id` Guest Clan View
8. **Sub-epic 2 (was 6B-5)** — Ratings reconciliation Path D (4 tabs real data)
9. **Sub-epic 3 (was 6B-6)** — Profile sub-routes deep links Path A (/v2/wallet + /v2/account)
10. **Sub-epic 4a (was 6B-7 partial)** — PvP в v2 happy path end-to-end
11. **Sub-epic 4b (was 6B-7 partial)** — PvP edge cases + safety + BE deploy chain
12. **Sub-epic 5 (was 6B-8)** — Real matchmaking `/v2/matchmaking`
13. **Sub-epic 6 (was 6B-9)** — Real spectate `/v2/spectate/:fightId` + production hotfix C4.5
14. **Sub-epic 7 (was 6B-10)** — Visual polish round + Auth + Wallet redesign ← **только что закрыт**

---

## ЧТО ОСТАЛОСЬ (1 sub-epic до Эпик 6 closure)

- **Sub-epic 8** — Pre-cutover acceptance gate + v1→v2 cutover + Эпик 6 closure (L) ← **СЕЙЧАС**

После Sub-epic 8 — **Эпик 6 visual migration COMPLETE.** Эпик 7+ начинается (separate scope — post-migration features / refactors / deferred carry-overs).

---

## SUB-EPIC 8 — SCOPE OUTLINE

### Что это

Финальный Эпик 6 sub-epic. **Cutover + closure**:
- Pre-cutover acceptance gate (full /v2 sweep — user-driven manual ratification)
- v1→v2 routing cutover (старые routes redirect к новым OR removed)
- Legacy file removal (CardFightView, deprecated v1 components, Vuetify dependency cleanup possibility)
- Friends "Watch Live" closure (deferred Sub-epic 7 — BE touch needed)
- i18n cleanup (deferred keys)
- Эпик 6 closure documentation (cumulative retrospective)

**Post-Sub-epic-8 state:** /v2 default routing live, legacy /v1 removed (or deferred к Эпик 7+), Эпик 6 visual migration COMPLETE.

### Размер

- **L** (~10-15 commits estimated)
- Likely **1-2 sessions** (depending on cutover path decision + acceptance gate findings)
- Backend touches: **possibly minor** (Friends "Watch Live" needs `currentFight` field в `/v1/friends`; ErrorMsg #31 BE consolidation если bundled). Lesson #33 6th application possibility.

### Carry-overs forward (entering Sub-epic 8)

**Critical для Sub-epic 8 closure:**

| Item | Source | Disposition |
|---|---|---|
| Friends "Watch Live" closure | Sub-epic 7 Q6 deferred | BE touch needed (`currentFight` field) — bundle с #31 ErrorMsg cleanup possibility |
| i18n keys polish | Sub-epic 7 C10/C15 | `spectate.coachPause`, `spectate.coachPauseStatus`, `spectate.watchLive`, etc. — deferred bundle |
| HudSpectate myclan tab a11y | Sub-epic 7 minor | Polish round candidate |
| ErrorMsg BE shape consolidation | Sub-epic 7 #31 known debt | 5 BE callsites bypass `sendError` helper — Lesson #33 candidate |

**Likely deferred к Эпик 7+:**

| # | Item | Reason |
|---|---|---|
| #14 | Switcher3DPunch | PRESERVE per user — preserved Sub-epic 7 |
| #20 | Cumulative damage stats | Out of scope per user decision |
| #21 | Log actor colors | Existing constraint |
| #22 | Coach active boost UI | BE-truth integration concern |
| #23 | Single coach overlay | Intentional architecture (CoachPause SFC) |
| #28 | XP earned display | Out of scope per user |
| #29 | Filter chips BE extension | Large BE feature (separate sub-epic) |
| #30 | ELO duplication consolidation | Refactor sub-epic candidate |
| #33 | Captain payload field name asymmetry | BE refactor candidate |

See Sub-epic 7 Final Report §8 для full carry-over matrix.

### Phase 0 expected investigation areas

**Q1 — Pre-cutover acceptance gate scope:**
- Q1.1: Full /v2 sweep checklist (5 functional areas — auth/wallet/account/HUD spectator/HUD fight)
- Q1.2: User-facing test scenarios per area (login flow, wallet connect, etc.)
- Q1.3: Pass/fail criteria + recovery path если fail

**Q2 — v1→v2 routing cutover strategy:**
- Q2.1: Old route → new route mappings inventory
- Q2.2: Redirect mechanism choice (301/302/server-side rewrite)
- Q2.3: Backwards compat period (если needed)
- Q2.4: 4 path candidates strategic decision

**Q3 — Legacy file removal scope:**
- Q3.1: v1 components к delete (CardFightView, legacy auth views, ProfileWallet legacy v1, etc.)
- Q3.2: Vuetify dependency removal possibility (after all consumers migrated)
- Q3.3: Asset cleanup (unused images, deprecated icons)
- Q3.4: CSS cleanup (legacy styles, Vuetify imports)

**Q4 — Final smoke test plan:**
- Q4.1: Pre-merge checklist (all routes verified working)
- Q4.2: BE compatibility verification
- Q4.3: Mobile responsive sanity check
- Q4.4: Production deploy plan

**Q5 — Эпик 6 closure documentation:**
- Q5.1: Эпик 6 final report (full migration retrospective across 14 sub-epics)
- Q5.2: Lessons learned cumulative
- Q5.3: Streak final metric (32 expected after Sub-epic 8 clean)
- Q5.4: Hand off к Эпик 7+ planning

**Q6 — Friends "Watch Live" closure (carry-over deferred Sub-epic 7):**
- Q6.1: BE `currentFight` field в `/v1/friends` response shape
- Q6.2: BE touch coordination — bundle с #31 ErrorMsg cleanup OR separate
- Q6.3: Cherry-pick PR planning (Lesson #33 6th application possibility)

**Q7 — i18n cleanup (deferred):**
- Q7.1: Inventory of deferred i18n keys (spectate.coachPause/coachPauseStatus/watchLive/etc.)
- Q7.2: Locale file structure verification
- Q7.3: Bundle scope decision (Sub-epic 8 OR Эпик 7+)

### 6 mandatory Phase 0 subsections (per Sub-epic 4a/4b/5/6/7 precedent — 10/38/61/50/30 catches validated)

**Mandatory Phase 0 subsections (each requires explicit pre-edit dump):**

1. **API contract verification** — exact signatures, getter paths, mutation/action shapes, constants imports, exact field names (especially BE Friends API `currentFight` field, ErrorMsg shape consolidation если bundled)
2. **Negative-space verification** — что НЕ существует (legacy routes? deprecated components? unused assets?)
3. **Real CSS class taxonomy dump** — `.v-*` legacy classes still in use? `.app-v2 ` prefix consistency check? Vuetify-only stylesheets remaining?
4. **UI infrastructure dependencies** — for cutover strategy: routing redirects + 5 functional areas verification chain
5. **Vocabulary alignment audit** — old v1 → new v2 path mappings, route names, etc.
6. **Semantic invariant + flow direction verification** ← **MANDATORY (PROMOTED Sub-epic 6)** — для cutover specifically: route resolution, redirect cascade, BE-truth invariants vs derived FE state в migration boundaries

### Path candidates (стратегические для design-Claude после Phase 0)

**Path α — Atomic cutover (single-commit redirect):**
- Single commit redirects all `/v1/*` к `/v2/*`
- Fast execution, but high-risk if regression surfaces
- Best when ALL /v2 routes verified working pre-cutover (acceptance gate passed completely)

**Path β — Phased cutover (per-feature redirect):**
- Cutover per functional area (auth → fight → spectate → wallet → account)
- Lower risk per commit
- More commits, longer Sub-epic 8

**Path γ — Soft cutover (default route change + v1 fallback):**
- New default = /v2, but /v1 routes preserved для backwards compat period
- Easiest rollback if regression
- Complicates legacy file removal (legacy code remains)

**Path δ — Hybrid (atomic redirect + selective v1 preservation):**
- Most routes atomic redirect
- Critical routes (e.g. wallet integration testing) preserved /v1 temporarily
- Hybrid risk profile

**Recommendation factual basis:** Likely **Path α** if acceptance gate passes cleanly (lowest legacy debt going forward). **Path γ** if user wants safer rollback option. User decision needed early Sub-epic 8.

### Сложности / риски

- **Acceptance gate failure** — если пользователь surfaces regression в /v2 что-то — STOP, fix-forward или rollback decision needed
- **Legacy file removal scope** — может expand (Vuetify dependency removal? main.scss legacy styles? icons?) — needs careful scoping
- **BE touch для Friends Watch Live** — Lesson #33 6th application — cherry-pick PR coordination overhead
- **i18n consistency** — multiple deferred keys — bundle scope decision
- **Production deploy plan** — final cutover affects production users — coordination critical
- **Эпик 6 closure documentation scope** — comprehensive retrospective across 14 sub-epics может balloon

### Pre-flight Phase 0 expected size

- ~12-15 questions Q1-Qn + 6 mandatory subsections + path candidates basis
- ~700-1000 lines Phase 0 report (similar к Sub-epic 5/6/7 — 800-1000 lines range)
- Single-write attempt с preventive split fallback ready (3-part split likely if API stream timeout)

---

## КЛЮЧЕВЫЕ ПАТТЕРНЫ ЭПИКА 6 (для applying в ТЗ)

### Mode A discipline (фундамент)

- 1 commit per step (атомарные)
- Build pass per commit (`npm run build`)
- Push after each commit (immediate)
- STOP-and-confirm после C1 (first commit gate)
- Audit-only mode C2+ (per established precedent)
- Lesson #11 reflex pre-edit + post-edit grep on every edit

### Investigation refines ТЗ inline (verify-gate workflow precedent)

- Phase 0 / mini-verification findings refine ТЗ during execution
- Sub-epic 4b 38 / Sub-epic 5 61 / Sub-epic 6 50 / Sub-epic 7 30 catches — pattern fully validated
- Verify-gate refinements applied pre-edit, NOT classified as recoveries
- Pattern reuse commits historically lower error rate (Sub-epic 7 C13/C14 had 0 catches)

### Lesson #32 (convention discovery)

- Mirror local convention wins over ТЗ literal
- ТЗ литерал может быть imprecise; код = source of truth
- Phase 0 file:line refs готовы для check
- Sub-epic 7 examples: HudFight scoped vs fight-overlays.css convention split, BE-truth field naming player1/player2 vs ТЗ p1/p2, hybrid canonical-modifier C11 ConnectWallet

### Lesson #33 (deploy environment awareness — 5 cumulative applications)

- Backend changes от designated branch НЕ auto-deploy
- Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md
- 5 prior applications: 6B-3a-backend / Sub-epic 1 / Sub-epic 4b PR #355 / Sub-epic 6 PR #356 / (Sub-epic 7 had 0 BE touches)
- **Sub-epic 8 likely IF Friends Watch Live + #31 ErrorMsg bundled** (BE touches → 6th application)

### Lesson #34 (HUD overlay convention)

- Root container `position: fixed; inset: 0; pointer-events: none;`
- Interactive children `pointer-events: auto;`
- z-index alignment с existing namespace
- Sub-epic 7 validated cross-component (fight + spectate)

### Lesson #35 tier classification

- **adaptation-tier** (ТЗ assumption mismatch с codebase reality — fix within Phase as conscious deviation, NOT triggered Lesson #18, NOT hot-fix)
- **bug-bundle-tier** (additional callsites of same class — fix within Phase as expansion)
- **scope-boundary-tier** (different class requiring own pre-edit grep + import work — STOP within Phase, document carry-over forward, Lesson #18 IS triggered)

Sub-epic 7 result: 30 catches all adaptation-tier or convention-discovery sub-tier. 0 bug-bundle scope expansion. 0 STOP-tier on main flow. 2 STOPs recovered cleanly via revised ТЗ.

### Lesson #36 (HudProfile card-creep monitor — currently 6/7)

- Track Sub-epic 8 IF touches HudProfile (cutover may consolidate v1 cards)
- Trigger refactor if 7th card added в Sub-epic 8

### Lesson #43 ACTIVE (PROMOTED — 4b, 8-occurrence chain validated)

- Phase 0 STEP 0 mandatory bootstrap branch verification
- 8 occurrences chain: 5U / Sub-epic 2 / 4a Phase 0 / 4b Phase 0 / Sub-epic 5 Phase 0 / Sub-epic 6 Phase 0 / Sub-epic 6 CL1 boundary / **Sub-epic 7 Phase 0 (Recovery #88)**
- 9th occurrence likely в Sub-epic 8 — handle adaptation-tier per established pattern

### Lesson #44 ACTIVE (PROMOTED — Sub-epic 6) — re-anchor scope after strategy revision

- Design-Claude must explicitly re-anchor strategic decisions (path choice, branch strategy, scope) после каждой revision
- Old reminder text должен быть updated, не carry-over implicitly
- **Sub-epic 8 attention:** if cutover path revision happens mid-flow (e.g. α → β scope expansion), re-propagate explicitly. No mental-model carry-over между audit reminder blocks.

### Lesson #45 ACTIVE (PROMOTED — Sub-epic 7) — Phase 0 metadata error pattern

**11 occurrences validated в Sub-epic 7.** Phase 0 hypothesis может ошибочно extrapolate v1 mechanism / file structure / API shape / SFC architecture к v2 без investigating actual current code.

**Mitigation:** pre-edit verification step count scales с commit complexity (3-9 steps).

**Verify pre-edit BEFORE writing edit code:**
- File existence + actual paths (Phase 0 may use legacy paths)
- Actual primitive counts via grep (Phase 0 systematically undercounts)
- BE event payload shapes (don't assume Phase 0 derivation)
- Taxonomy availability в global CSS (verify before assuming)
- Vuex action names (don't trust Phase 0 — grep verify)

**NEVER assume Phase 0 evidence == current code reality without grep verification.**

Pattern correlates с novelty: pattern-establishment commits high error rate, pattern-reuse low error rate. Sub-epic 7 C13/C14 validation: pattern-reuse commits had 0 metadata errors.

### Closure shape choice (5 patterns established)

- **Standard linear** (10 applications в Эпике 6: 6A + 6B-1 + 6B-3 + Sub-epic 1 + Sub-epic 2 + Sub-epic 3 + Sub-epic 4a + Sub-epic 4b + Sub-epic 5 + **Sub-epic 7**) — single-thread closure, no BE deploy chain split
- **Code-complete + deferred-verify** (3 applications: 6B-3a-backend, Sub-epic 1, Sub-epic 4b) — used при cherry-pick → main → Railway flow needed для production fixes
- **Deprecation-via-redirect** (1 application: 6B-2) — used при underlying feature retires conceptually
- **Scope-deferral-к-downstream** (1 application: 6B-3b) — used при scope integrates inline в later sub-epic
- **Code-complete + deferred-deploy** (1 application: Sub-epic 6) — used при feature work waits Эпик cutover (continue stack accumulates без production deploy)

Sub-epic 8 likely **Standard linear** (cutover + cleanup) OR **Code-complete + deferred-deploy** (если significant continue stack work waits final merge к main).

### Verify-gate workflow precedent

Phase 0 / mini-verification findings refine ТЗ inline. Cumulative pre-edit catches counts:
- Sub-epic 4a: 10 catches (M-L size)
- Sub-epic 4b: 38 catches (M-L size с BE chain)
- Sub-epic 5: 61 catches (L size — new architectural area, ceiling)
- Sub-epic 6: 50 catches (M-L size, feature mature scope)
- Sub-epic 7: 30 catches (M-L size, mixed scope batch — пользователь pattern-establishment vs reuse)

Sub-epic 8 expected: ~25-50 catches (L size — cutover novelty + acceptance gate verification + legacy removal).

---

## PHASE 0 ENHANCEMENT CANDIDATES (6 mandatory + tracking)

**6 mandatory subsections** (validated через 4a/4b/5/6/7 — surfaced 10/38/61/50/30 catches respectively):

1. **API contract verification** — exact signatures, getter paths, mutation/action shapes, constants imports, exact field names (especially BE Friends API consolidation если bundled)
2. **Negative-space verification** — что НЕ существует (deprecated components / unused assets / legacy routes — Sub-epic 8 surface)
3. **Real CSS class taxonomy dump** — Vuetify legacy stylesheets remaining? `.app-v2 ` prefix consistency? Migration completeness verification
4. **UI infrastructure dependencies** — cutover redirect chain (route → redirect → new route resolution); acceptance gate verification chain (5 functional areas)
5. **Vocabulary alignment audit** — old v1 path → new v2 path mapping, route names, asset paths (Sub-epic 8 specifically — final inventory)
6. **Semantic invariant + flow direction verification** ← **MANDATORY (PROMOTED Sub-epic 6)** — для cutover: route resolution semantics, redirect cascade behavior, post-cutover state machine (no BE-truth derivation conflicts)

**Lesson candidates active (7):** #36/#37/#38/#39/#40/#41/#42

---

## ACTIVE CARRY-OVERS (entering Sub-epic 8 — ~20 items, see Sub-epic 7 Final Report §8 для full matrix)

### Critical for Sub-epic 8

| # | Item | Source | Sub-epic 8 disposition |
|---|---|---|---|
| Friends "Watch Live" | Sub-epic 7 Q6 | YES — BE touch (Lesson #33 6th application possibility) |
| i18n keys polish | Sub-epic 7 C10/C15 | YES — bundle если scope allows |
| ErrorMsg BE consolidation | Sub-epic 7 #31 | MAYBE — bundle с Friends Watch Live |
| HudSpectate myclan tab a11y | Sub-epic 7 minor | LOW priority polish |

### Likely Эпик 7+

(See Sub-epic 7 Final Report §8 — 9 items: #14 Switcher3DPunch / #20 cumulative damage / #21 log actor colors / #22 coach boost / #23 single coach overlay / #28 XP earned / #29 filter chips BE / #30 ELO duplication / #33 captain field naming asymmetry)

---

## PRE-CUTOVER ACCEPTANCE GATE — MANDATORY VERIFICATION

**5 functional areas — all must pass before cutover commits:**

### 1. Auth flows (RainView 3D rain backdrop)
- `/auth/login` Login form (HexButton + Vuex login + redirect)
- `/auth/signup` Signup form (3× InputField + register + redirect)
- `/auth/reset` Reset password (2-state flow)
- `/auth/telegram` TelegramLogin (Telegram WebApp auto-login — needs actual Telegram client + bot setup для full test)

### 2. Wallet flows
- `/v2/profile/wallet` ProfileWallet renders
- ConnectWallet modal (canonical .hex-modal-* taxonomy)
- Wagmi composables functional (useAccount/useConnect/useDisconnect/useConnectors)
- GameBalanceCard renders с HexCard

### 3. Account flows (4 modals)
- ConfirmEmail (HexButton swap)
- ChangeLogin (canonical modal + dispatch)
- ChangePassword (3× InputField + cancel/confirm)
- DeleteAccount (danger variant + confirmation flow)

### 4. HUD spectator (HudSpectate)
- Active effects badges per fighter side (.mod-badge*)
- Coach pause read-only overlay (.hex-modal-overlay)
- Replay marker для joined-late entries (.sp-log-replayed)
- 8-col grid taxonomy в Ratings (per-tab modifier classes)

### 5. HUD fight (HudFight)
- Event titles (DODGE / CRITICAL!) с titlePop animation
- Shake animation (per victim side)
- Per-type flash colors (8-color FLASH_COLORS map)
- Dice icons + modifiers bar (3 effect badges)

**User-driven manual ratification gate.** Если acceptance gate fails — STOP, fix-forward или rollback decision needed.

---

## SUGGESTED STARTING POINT — FRESH SESSION

### Bootstrap message для нового чата (design-Claude)

```
Привет!

Перед началом любой работы — три обязательных шага:
1. Прочитать CLAUDE.md (source of truth по проекту, приложен).
2. Прочитать handoff HANDOFF_EPIC6_SUBEPIC_8_CHAT_HANDOFF.md
   (приложено).
3. (Optional) Прочитать EPIC6_SUBEPIC_7_FINAL_REPORT.md
   для historical context — Sub-epic 7 retrospective + 11
   Lesson #45 occurrences detailed.

[Стандартные правила Workflow / Mode A / агенты — как всегда]

Контекст: Sub-epic 7 (Visual polish + Auth + Wallet redesign)
только что закрыт clean. Streak 31, прогресс 14/14 (100%
functional) — only Sub-epic 8 cutover remaining до Эпик 6
closure. Recoveries 88+ (1 added в Sub-epic 7 — #88 bootstrap
divergence Lesson #43 8th occurrence). Lessons promoted 38
(+1: #45 PROMOTED — Phase 0 metadata error pattern, 11 occurrences
validated). 6 Phase 0 mandatory subsections established.

Carry-over #4 (Auth+Wallet redesign — main user request from 6A)
CLOSED FULLY через 4 commits. RainView 3D rain UNTOUCHED.

Начинаем Sub-epic 8 — Pre-cutover gate + v1→v2 cutover + Эпик 6 closure
(L size, ~10-15 commits). Phase 0 investigation первый шаг —
Q1-Q7 outline в handoff'е + 4 path candidates α/β/γ/δ для cutover.

В Phase 0 ТЗ обязательны 6 enhancement subsections:
1. API contract verification
2. Negative-space verification
3. Real CSS class taxonomy dump (Vuetify legacy remnants)
4. UI infrastructure dependencies (cutover redirect chains)
5. Vocabulary alignment audit (v1 path → v2 path mappings)
6. Semantic invariant + flow direction verification (MANDATORY)

Sub-epic 8 attention point: cutover affects production users —
acceptance gate user-driven manual ratification critical.

Branch: claude/visual-polish-auth-wallet-6xe6m (continue stack —
same branch where Sub-epic 7 closed). Phase 0 STEP 0 mandatory
git verify первый шаг (9th occurrence Lesson #43 likely).

Lesson #43 ACTIVE (8 occurrences) — Phase 0 STEP 0 mandatory:
git fetch && git status -uno && git branch --show-current && git log --oneline -5

Lesson #44 ACTIVE — re-anchor scope after strategy revision.
Cutover path 4 candidates (α/β/γ/δ) — likely revision mid-flow.
При revision — re-propagate explicitly через все ТЗ artefacts.

Lesson #45 ACTIVE (PROMOTED Sub-epic 7 — 11 occurrences) — Phase 0
metadata error pattern. Triple-verify everything pre-edit. NEVER
assume Phase 0 evidence == current code reality без grep verification.

Lesson #33 conditional — Sub-epic 8 МОЖЕТ touch BE (Friends "Watch
Live" carry-over needs `currentFight` field; #31 ErrorMsg BE
consolidation candidate). Cherry-pick → main → Railway PR flow per
branch strategy в CLAUDE.md если bundled. 6th application conditional.

Подтверди что понял правила.
```

### First task для свежей design-Claude

1. Read CLAUDE.md + this handoff (+ optional Sub-epic 7 final report)
2. Compose Phase 0 investigation request к Claude Code (Q1-Q7 outlined above + 6 mandatory enhancement subsections)
3. **Critical user decision needed early:** Cutover path α/β/γ/δ choice. Recommend Path α (atomic, lowest legacy debt) если acceptance gate passes; Path γ (soft с v1 fallback) для safer rollback option. User decision determines remaining commit structure.
4. Wait Claude Code Phase 0 report
5. Compose Phase 1 ТЗ для Sub-epic 8 (acceptance gate verification first)

---

## FILES TO ATTACH В NEW CHAT

1. **CLAUDE.md** (synced C16 — `0aba5bb`)
2. **HANDOFF_EPIC6_SUBEPIC_8_CHAT_HANDOFF.md** (this file C18)
3. **EPIC6_SUBEPIC_7_FINAL_REPORT.md** (C17 — `3c6e248` — historical context, optional but recommended)

---

## TONE / COMMUNICATION STYLE

- Russian language
- Short, structured responses (без воды)
- One question at a time when possible (max 3)
- Take decisions yourself when reasonable, ask only critical
- Don't apologize excessively
- "По-простому" explanations для technical concepts
- File-based ТЗ (save в /mnt/user-data/outputs/) для copy-paste convenience
- Mode A discipline + STOP-and-confirm pattern (audit-only после first per-commit gate)
- Honest reporting — fix-forward forbidden, разногласия фиксируются
- При truncation в Claude Code messages — generate separate file в outputs, прикладывать как attachment вместо inline templates
- **Lesson #44 active:** при любой strategy revision (path / scope / branch) — explicit re-anchor, никаких mental-model carry-overs между audit reminder blocks. Mid-execution revisions re-propagate через все downstream artefacts.

---

## CRITICAL REMINDERS

- **Не выходи за рамки ТЗ.** Расхождения — в отчёт, не молча чинить.
- **Не доверяй памяти про факты проекта** — проверяй через CLAUDE.md и/или код.
- **"У меня локально работает" — не доказательство.** Visual verify gate strict (Sub-epic 8 acceptance gate user-driven manual ratification).
- **Расхождение с CLAUDE.md** — фиксировать, не молча править.
- **Surface conditions strict** — Pre-edit verify gates triggered → STOP, не fix-forward.
- **Streak 31 preservation** через Lesson #35 tiering — adaptation-tier OK, hot-fix avoid.
- **Backend changes deploy environment awareness** — Sub-epic 8 МОЖЕТ touch BE (Friends Watch Live + ErrorMsg #31 candidates). Lesson #33 — backend changes от designated branch НЕ auto-deploy. Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md. 6th application conditional.
- **Pre-cutover acceptance gate** — user-driven manual ratification (5 functional areas — Auth/Wallet/Account/HUD spectator/HUD fight). Acceptance gate failure surfaces → STOP escalate.
- **6 Phase 0 enhancement subsections mandatory** (5 prior + 6th PROMOTED Sub-epic 6) — derived from 30+30+50+61+38+10 cumulative Lesson #11 catches across Sub-epic 4a/4b/5/6/7, surface assumption mismatches pre-edit.
- **Lesson #43 ACTIVE — 8-occurrence chain.** Phase 0 STEP 0 mandatory git verify before any actions. 9th occurrence likely Sub-epic 8.
- **Lesson #44 ACTIVE — re-anchor scope after strategy revision.** Critical для Sub-epic 8 — cutover path decisions likely revise during Phase 0/1. No mental-model carry-overs.
- **Lesson #45 ACTIVE (PROMOTED Sub-epic 7 — 11 occurrences)** — Phase 0 metadata error pattern. Triple-verify everything pre-edit.
- **HudProfile card-creep monitor (6/7)** — Sub-epic 8 МОЖЕТ touch HudProfile (cutover может consolidate v1 cards). Trigger refactor if 7th card added.
- **Carry-over #16 future-Claude warning** — `isPlayer1: false` hardcode в ChallengeNotification.vue:62 IS semantically correct (acceptor=player2 per BE invariant). Sub-epic 5/6 confirmed pattern. Do NOT "fix" к computed expression — would invert correct value.
- **#27 Dice cooldown reclassification** — v1 FE round-counter NOT portable к v2 BE-truth dice model. Future BE protocol extension required (`cooldownRemaining` field). Mirror precedent #16. Do NOT "implement #27" via FE round counter.
- **RainView 3D rain UNTOUCHED** — preserved across all Sub-epic 7 AW1 commits. Sub-epic 8 cutover should preserve unless explicit user decision к replace.

---

## FINAL STATE SUB-EPIC 7

**Commits:** 18 total (15 functional + 1 STOP recovered + 3 closure)
**Carry-overs decided:** 17 (16 closed + 1 reclassified #27)
**Streak:** 30 → **31** ✅
**Recoveries:** 87 → **88+** (+ Recovery #88)
**Lessons promoted:** 37 → **38** (+#45)
**Эпик 6 progress:** 13/14 → **14/14 (100% functional)**
**Branch:** `claude/visual-polish-auth-wallet-6xe6m` (continue stack)
**Working tree:** clean (after C18 commit + push)

**Sub-Epic 7 — CLOSED clean ✅. Streak 31 achieved.**

---

Sub-Epic 8 — starting. Fresh design-Claude session welcomed. **Last sub-epic Эпик 6.**

After Sub-epic 8 → Эпик 6 visual migration COMPLETE. Эпик 7+ planning begins.
