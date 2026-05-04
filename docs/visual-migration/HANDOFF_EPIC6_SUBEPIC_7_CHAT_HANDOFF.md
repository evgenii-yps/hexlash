# HANDOFF — Hexlash Visual Migration — Эпик 6 — Sub-epic 7 starting

**Date:** 2026-05-04
**Reason for handoff:** Sub-epic 6 closed clean (Real spectate — Path B-min + D combo + production hotfix C4.5 PR #356 merged). Fresh design-Claude session starting Sub-epic 7 (Visual polish round + Auth + Wallet redesign — M-L size).
**Predecessor:** `EPIC6_SUBEPIC_6_FINAL_REPORT.md` (CL2 commit `e1a66e9`)
**Next sub-epic:** Sub-epic 7 — Visual polish round + Auth + Wallet redesign

---

## ROLE — design-Claude

Ты — design-Claude в Hexlash visual migration project. User не-технический, работает с Claude Code в IDE на отдельной branch. **Ты пишешь ТЗ** для Claude Code, Claude Code исполняет на branch.

User общается на русском, нужны простые объяснения. User часто отвечает короткими сообщениями ("a", "b", "c", "ok", "пиши", "go"). User выбирает буквы из вариантов. **НЕ задавай слишком много вопросов сразу.** Бери решения сам где можешь, спрашивай только critical decisions. Когда user сигналит "не понимаю" / "ты опять забываешь как со мной общаться" — упрощай объяснение, fewer questions, конкретные рекомендации.

**Project files в /mnt/project/** — там лежат CLAUDE.md и handoff файлы.
**ТЗ files** сохраняются в /mnt/user-data/outputs/ для удобства copy-paste user'ом.

**Naming convention:** `EPIC6_SUBEPIC_<N>_*` для всех closure docs (established Sub-epic 2, applied through 6).

---

## CURRENT STATE

- **Branch:** `claude/investigate-matchmaking-2JlwO-WfdV0` (continue stack — Sub-epic 6 closed здесь, CL1/CL2/CL3 commits added on top)
- **HEAD entering Sub-epic 7:** CL3 SHA (this commit) — current as of CL3 commit landing
- **Streak:** **30** ✅ (30 consecutive sub-epics clean — milestone reached в Sub-epic 6 closure)
- **Эпик 6 progress:** **13/14 (93%)** — past 13/14 milestone reached
- **Recoveries cumulative:** **87+** (+2 в Sub-epic 6: #86 Phase 0 bootstrap divergence Lesson #43 6th occurrence + #87 CL1 boundary bootstrap divergence Lesson #43 7th occurrence — both adaptation-tier same-SHA)
- **Lessons promoted:** **37** (+1 в Sub-epic 6: #44 PROMOTED — re-anchor scope after strategy revision)
- **Lesson candidates active:** 7 (#36/#37/#38/#39/#40/#41/#42)
- **Phase 0 mandatory subsections:** **6** (5 prior + 6th PROMOTED в Sub-epic 6 — semantic invariant + flow direction verification)
- **Closure shapes established (5):** standard linear / deprecation-via-redirect / code-complete + deferred-verify / scope-deferral-к-downstream / **code-complete + deferred-deploy NEW (Sub-epic 6)**
- **Cherry-pick PRs cumulative:** 4 (PR #353 6B-3a-backend / PR #354 Sub-epic 1 / PR #355 Sub-epic 4b / **PR #356 Sub-epic 6 C4.5 production hotfix**)
- **Sub-epic 6 metric:** **50 cumulative Lesson #11 catches pre-edit** (within Phase 0 prediction 40-70 range; below Sub-epic 5's 61-catch ceiling consistent с feature mature scope vs new architectural area). 0 hot-fixes на main flow, 0 reactive splits, 0 STOP-tier на main flow. 1 STOP-tier on cherry-pick branch (pre-PR #355 sanity catch — recovered cleanly).

---

## ЧТО ЗАКРЫТО В ЭПИКЕ 6 (13 sub-epics)

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
13. **Sub-epic 6 (was 6B-9)** — Real spectate `/v2/spectate/:fightId` + production hotfix C4.5 ← **только что закрыт**

---

## ЧТО ОСТАЛОСЬ (2 sub-epics до closure)

- **Sub-epic 7** — Visual polish round + Auth + Wallet redesign (M-L) ← **СЕЙЧАС**
- **Sub-epic 8** — Pre-cutover acceptance gate + v1→v2 cutover + Эпик 6 closure (L)

---

## SUB-EPIC 7 — SCOPE OUTLINE

### Что это

Финальный feature/polish sub-epic перед cutover. Batch closes большой объём polish carry-overs (#18-#37, ~20 items) + addresses Auth+Wallet user-driven redesign request (carry-over #4 since 6A) + Vuetify→v2 design system port (#14-#15 carry-overs).

**Post-Sub-epic-7 state:** /v2 routes feature-complete + visual-полированы. Только cutover работа остаётся — Sub-epic 8 final merge `visual-v2` → main.

### Размер

- **M-L** (~12-18 commits estimated)
- Likely **1-2 sessions** (depending на batch organization decisions)
- Backend touches: **possibly minor** (Carry-over #31 ErrorMsg shape correction — bundle candidate, ~1 BE commit if included; Auth+Wallet redesign frontend-only по default)

### Carry-overs target list (~20 items)

**Inherited polish carry-overs:**

| Bucket | Items | Source | Notes |
|---|---|---|---|
| Sub-epic 4a polish | #18-#28 (11 items) | PvP v2 polish surface | Decoration/non-functional gaps — coach pause, dice icons, modifiers bar, shake animation, etc. |
| Sub-epic 5 polish | #29-#33 (5 items) | Matchmaking polish surface | Filter chips BE, ELO duplication, ErrorMsg shape, .mm-main filter gap, captain payload field asymmetry |
| Sub-epic 6 polish | #34-#37 (4 items) | Spectate UI polish | Coach pause overlay, activeEffects badges, joined-late indicator, --draw CSS class |
| Vuetify→v2 port | #14-#15 (2 items) | Sub-epic 3 Q-tactical-Phase1-3/5 | Account/Wallet components 4 items + GameBalanceCard ported AS-IS preserving Vuetify; visual inconsistency vs surrounding v2 HUD |
| Auth+Wallet redesign | #4 (1 item — main user request) | 6A user request | Full Auth flow + Wallet redesign per v2 design system. Scope clarification needed. |

**Decision-driven carry-overs (designer choice):**

| # | Item | Bundle decision |
|---|---|---|
| #31 | ErrorMsg shape mismatch BE→FE | Possible bundle (Lesson #33 5th application — backend touches required if included) |
| #11 | friendsState.searchPlayers captain drop | Possible bundle (single-line fix on FE) |
| #12 | HudRatings 8-col CSS grid mismatch | Possible bundle (CSS-only, multi-tab scoped) |
| #13 | HudRatings keyboard a11y | Possible bundle (HTML attributes batch) |

**NOT in scope (defer Sub-epic 8 OR Эпик 7+):**
- #10 v2 cutover auth posture audit — Sub-epic 8 territory
- #5 `/rules` → v2 port — Sub-epic 8 cleanup
- #6 3D models + devices system — Эпик 7+
- #7 Locale cleanup (10 → English-only) — Эпик 7+
- #8 `/user/search` `sortBy=balance` query param — separate sub-epic candidate
- #9 Clan data integration audit — separate sub-epic candidate (but желательно перед Sub-epic 8)

### Phase 0 expected investigation areas

**Q1 — Carry-over batch organization:**
- Q1.1: Which items can bundle in single commit (CSS batches, Vuetify-port batches)
- Q1.2: Which items need standalone commit (architectural — Auth+Wallet, ErrorMsg)
- Q1.3: Sequencing strategy — polish first then Auth+Wallet OR mixed clusters?

**Q2 — Auth+Wallet redesign scope:**
- Q2.1: Full redesign vs Vuetify port only (scope clarification — user direction needed)
- Q2.2: Components inventory — RainView (3D rain auth) / ProfileWallet / ConnectWallet modal / 4 account components / GameBalanceCard
- Q2.3: 3D rain background reuse vs scrap (5N preserved 3D rain — keep?)
- Q2.4: Wagmi/WalletConnect/Coinbase integration preservation (no functional change)

**Q3 — Polish carry-over priority:**
- Q3.1: HudFight visual polish bundle (#18-#28) — coach pause / dice icons / modifiers bar / shake / cumulative damage / log colors / per-type flash / dice cooldown / XP earned — which group together cleanly?
- Q3.2: HudSpectate polish bundle (#34-#37) — coach pause overlay / activeEffects / joined-late indicator / --draw class — single batch?
- Q3.3: Matchmaking polish bundle (#29, #32, #33) — filter chips / .mm-main offset / captain payload — bundle?

**Q4 — ErrorMsg shape decision (carry-over #31):**
- Q4.1: BE shape correction (`{type, error, code}` flat → `{type, errorDto: {code, message}}`) — touches all ErrorMsg producers
- Q4.2: FE parser tolerance (handle both shapes) — backwards compat
- Q4.3: Bundle с Sub-epic 7 OR defer Sub-epic 8 cutover hardening?

**Q5 — Vuetify→v2 port scope (#14-#15):**
- Q5.1: Components inventory (4 account components + GameBalanceCard + Switcher3DPunch SKIP candidate)
- Q5.2: Port-as-is (preserve functionality, restyle к v2 tokens) vs full redesign?
- Q5.3: Bundle с Auth+Wallet redesign OR separate cluster?

**Q6 — Friends entry point closure (carry-over #6B-3b deferred):**
- Q6.1: Watch Live button BE status integration (`currentFight` / `in_fight` field в friends API)
- Q6.2: Bundle с Sub-epic 7 OR Sub-epic 8 cutover gate?

**Q7 — visual-v2 NoConnection restyle:**
- Q7.1: 4b carry-over — currently v1 NoConnection.vue mounted в AppV2 verbatim. v2 design system restyle.
- Q7.2: Bundle с Auth+Wallet (header/banner styling consistent) OR separate?

### 6 mandatory Phase 0 subsections (per Sub-epic 4a/4b/5/6 precedent — 10/38/61/50 catches validated)

**Mandatory Phase 0 subsections (each requires explicit pre-edit dump):**

1. **API contract verification** — exact signatures, getter paths, mutation/action shapes, constants imports, exact field names (especially Auth+Wallet wagmi/WalletConnect APIs если touched, ErrorMsg shape если bundle)
2. **Negative-space verification** — what does NOT exist that Phase 1 ТЗ might assume (relevant для Auth+Wallet redesign — verify which v2 design system primitives ready vs need creation)
3. **Real CSS class taxonomy dump** — `.auth-*`, `.wallet-*`, `.acc-*` namespaces existing (RainView, ProfileWallet, account components)
4. **UI infrastructure dependencies** — for each new handler chain check (button → state → handler) — especially Auth flow + Wallet connect chain
5. **Vocabulary alignment audit** — Vuetify component names vs v2 token names (VBtnDark vs `.btn-primary`, VModal vs `.ph-modal`, etc.) — port mapping reference
6. **Semantic invariant + flow direction verification** ← **NOW MANDATORY (PROMOTED Sub-epic 6)** — for Auth flow especially: user state derivation, post-auth redirect logic, wallet connection state machine — verify BE-truth invariants vs derived FE state.

### Path candidates (стратегические для design-Claude после Phase 0)

- **Path α — pure polish batch (~10 commits):** close #18-#37 polish only, defer Auth+Wallet redesign к separate sub-epic. SMALL scope, fast closure, но Sub-epic 7 doesn't address main user request (#4 Auth+Wallet).
- **Path β — Auth+Wallet first, polish second (~12-15 commits):** Auth+Wallet redesign в первую очередь (matches user priority), polish carry-overs as time allows. Risk — Auth+Wallet может expand scope, polish slips.
- **Path γ — mixed batch with explicit milestones (~14-18 commits):** alternating polish clusters + Auth+Wallet clusters. Cleanest для user visibility (incremental closure of carry-overs).
- **Path δ — Auth+Wallet only (defer all polish к "Sub-epic 7b"):** narrow Sub-epic 7 scope к Auth+Wallet only. Polish carry-overs roll to Sub-epic 7b OR Эпик 7+.

**Recommendation factual basis:** Likely **Path γ** (mixed batch с explicit milestones). User pushback signals on scope expansion will redirect к Path α или Path δ if surfacing.

### Сложности / риски

- **Auth flow scope expansion** — RainView 3D rain background + 4 auth forms (Login/Signup/Reset/Telegram) = sizeable. Vuetify port или full redesign decision required early.
- **Wagmi/WalletConnect coupling** — Web3 wallet integration не должна regress. Preserve functional layer, restyle visual layer only.
- **Polish carry-over count** — 20+ items могут blur scope discipline. Mode A per-commit gate may produce many small commits — preventive split fallback ready.
- **ErrorMsg shape change (carry-over #31)** — BE touches required, Lesson #33 5th application. Cherry-pick to main needed if bundled (production deploy chain), else defer Sub-epic 8.
- **Sub-epic 8 dependency creep** — #10 v2 cutover auth posture audit may surface during Auth+Wallet work. STOP discipline strict — defer к Sub-epic 8 if surfaces.

### Pre-flight Phase 0 expected size

- ~12-18 questions Q1-Qn + 6 mandatory subsections + path candidates basis
- ~700-1000 lines Phase 0 report (similar к Sub-epic 5/6 — 800-1000 lines range)
- Single-write attempt с preventive split fallback ready (3-part split likely if API stream timeout)

---

## КЛЮЧЕВЫЕ ПАТТЕРНЫ ЭПИКА 6 (для applying в ТЗ)

### Mode A discipline (фундамент)

- 1 commit per step (атомарные)
- Build pass per commit (`npm run build`)
- Push after each commit (immediate)
- STOP-and-confirm после C1 (first commit gate)
- Audit-only mode C2+ (per 4a/4b/5/6 precedent)
- Lesson #11 reflex pre-edit + post-edit grep on every edit

### Investigation refines ТЗ inline (verify-gate workflow precedent)

- Phase 0 / mini-verification findings refine ТЗ during execution
- Sub-epic 4b 38 / Sub-epic 5 61 / Sub-epic 6 50 catches — pattern fully validated
- Verify-gate refinements applied pre-edit, NOT classified as recoveries (Sub-epic 2-6 precedent)

### Lesson #32 (convention discovery)

- Mirror local convention wins over ТЗ literal
- ТЗ литерал может быть imprecise; код = source of truth
- Phase 0 file:line refs готовы для check
- Sub-epic 6 examples: callback injection (Option β) vs direct import, composable extraction pattern, perspective normalization (deriveSideFromOdId helper)

### Lesson #33 (deploy environment awareness — 5 cumulative applications)

- Backend changes от designated branch НЕ auto-deploy
- Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md
- 5 prior applications: 6B-3a-backend / Sub-epic 1 / Sub-epic 4b PR #355 / Sub-epic 6 PR #356 — Sub-epic 7 likely IF carry-over #31 ErrorMsg shape bundled (BE touches)

### Lesson #34 (HUD overlay convention)

- Root container `position: fixed; inset: 0; pointer-events: none;`
- Interactive children `pointer-events: auto;`
- z-index alignment с existing namespace
- Auth+Wallet HUD likely uses pattern (verify Phase 0)

### Lesson #35 tier classification

- **adaptation-tier** (TZ assumption mismatch with codebase reality — fix within Phase as conscious deviation, NOT triggered Lesson #18, NOT hot-fix)
- **bug-bundle-tier** (additional callsites of same class — fix within Phase as expansion)
- **scope-boundary-tier** (different class requiring own pre-edit grep + import work — STOP within Phase, document carry-over forward, Lesson #18 IS triggered)

Sub-epic 6 result: 50 catches all adaptation-tier (or convention-discovery sub-tier per Lesson #32 reflex). 0 bug-bundle scope expansion. 0 STOP-tier on main flow. Streak preserved.

### Lesson #36 (HudProfile card-creep monitor — currently 6/7)

- Track Sub-epic 7 IF touches HudProfile (likely YES — Auth+Wallet redesign may touch Profile Identity card / Wallet card)
- Trigger refactor if 7th card added в Sub-epic 7

### Lesson #43 ACTIVE (PROMOTED — 4b, 7-occurrence chain validated)

- Phase 0 STEP 0 mandatory bootstrap branch verification
- 7 occurrences chain: 5U / Sub-epic 2 / 4a Phase 0 / 4b Phase 0 / Sub-epic 5 Phase 0 / Sub-epic 6 Phase 0 / Sub-epic 6 CL1 boundary
- 8th occurrence likely в Sub-epic 7 — handle adaptation-tier per established pattern

### Lesson #44 ACTIVE (PROMOTED — Sub-epic 6) — re-anchor scope after strategy revision

- Design-Claude must explicitly re-anchor strategic decisions (cherry-pick scope, branch strategy, path choice) после каждой revision
- Old reminder text должен быть updated, не carry-over implicitly
- Mid-execution handoff revisions need re-propagation through all downstream artefacts (audit reminders, ТЗ templates, handoff packages)
- **Sub-epic 7 attention:** if path revision happens mid-flow (e.g. Path γ → Path δ scope narrowing), re-propagate explicitly. No mental-model carry-over между audit reminder blocks.

### Closure shape choice (5 patterns established)

- **Standard linear** (9 applications в Эпике 6) — single-thread closure, no BE deploy chain split
- **Code-complete + deferred-verify** (3 applications: 6B-3a-backend, Sub-epic 1, Sub-epic 4b) — used при cherry-pick → main → Railway flow needed для production fixes
- **Deprecation-via-redirect** (1 application: 6B-2) — used при underlying feature retires conceptually
- **Scope-deferral-к-downstream** (1 application: 6B-3b) — used при scope integrates inline в later sub-epic
- **Code-complete + deferred-deploy** (1 application: Sub-epic 6) — used при feature work waits Эпик cutover (continue stack accumulates без production deploy)

Sub-epic 7 likely **Standard linear** OR **Code-complete + deferred-deploy** depending на whether ErrorMsg shape bundled (production touch).

### Verify-gate workflow precedent

Phase 0 / mini-verification findings refine ТЗ inline. Cumulative pre-edit catches counts:
- Sub-epic 4a: 10 catches (M-L size)
- Sub-epic 4b: 38 catches (M-L size с BE chain)
- Sub-epic 5: 61 catches (L size — new architectural area, ceiling)
- Sub-epic 6: 50 catches (M-L size, feature mature scope)

Sub-epic 7 expected: ~30-60 catches (mid-range; carry-over batch + Auth+Wallet redesign mixed scope).

---

## PHASE 0 ENHANCEMENT CANDIDATES (6 mandatory + tracking)

**6 mandatory subsections** (validated через 4a/4b/5/6 — surfaced 10/38/61/50 catches respectively):

1. **API contract verification** — exact signatures, getter paths, mutation/action shapes, constants imports, exact field names
2. **Negative-space verification** — что НЕ существует (Sub-epic 7 likely surfaces gaps в v2 design system primitives для Auth+Wallet redesign)
3. **Real CSS class taxonomy dump** — `.auth-*`, `.wallet-*`, `.acc-*` namespaces existing
4. **UI infrastructure dependencies** — chain checks (button → state → handler), Auth flow + Wallet connect chain
5. **Vocabulary alignment audit** — Vuetify vs v2 token mapping reference
6. **Semantic invariant + flow direction verification** ← **MANDATORY (PROMOTED Sub-epic 6)** — Auth flow user state derivation, post-auth redirect logic, wallet connection state machine

**Lesson candidates active (7):** #36/#37/#38/#39/#40/#41/#42

---

## ACTIVE CARRY-OVERS (35 items entering Sub-epic 7)

### Inherited from prior sub-epics (15 items)

| # | Item | Source | Priority | Sub-epic 7 Bundle? |
|---|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop, κ Path B | LOW | NO (defer) |
| 2 | HudProfile card-creep monitor (6/7) | 5L+ → 5S Q1.3 | MONITOR (Sub-epic 7 likely touches HudProfile — Auth+Wallet redesign may add card) |
| 3 | Lesson #36 validation track | 5R | LOW (await 2nd occurrence) |
| **4** | **Auth + Wallet redesign** | **6A user request** | **HIGH — Sub-epic 7 main scope** |
| 5 | `/rules` → v2 port | 6B-1 Phase 0 | NO — Sub-epic 8 cleanup |
| 6 | 3D models + devices system | 6B-2 user direction | NO — Эпик 7+ |
| 7 | Locale cleanup (10 → English-only) | 6B-3a user direction | NO — Эпик 7+ |
| 8 | `/user/search sortBy=balance` | 6B-3a Phase 1 | LOW (separate sub-epic candidate) |
| 9 | Clan data integration audit | Sub-epic 1 surface | M-L sub-epic candidate (желательно перед Sub-epic 8) |
| 10 | v2 cutover auth posture audit | Sub-epic 1 surface | NO — Sub-epic 8 territory |
| 11 | friendsState.searchPlayers captain drop | Sub-epic 2 Commit 4 surface | YES candidate (single-line FE fix) |
| 12 | HudRatings 8-col CSS grid mismatch | Sub-epic 2 Commit 11 defer | YES candidate (CSS-only batch) |
| 13 | HudRatings keyboard a11y | Sub-epic 2 Commit 8 audit | YES candidate (HTML attributes batch) |
| **14** | **Switcher3DPunch SKIP** | **Sub-epic 3 Q-tactical-1** | **YES — bundle с Auth+Wallet OR drop** |
| **15** | **Account/Wallet Vuetify→v2 port** | **Sub-epic 3 Q-tactical-Phase1-3/5** | **YES — Sub-epic 7 main scope** |

### Sub-epic 4a polish carry-overs (#18-#28, 11 items, all decoration/non-functional)

| # | Item | Sub-epic 7 Bundle? |
|---|---|---|
| 18 | Dodge/crit overlay title mechanism gap | YES (HudFight visual polish bundle) |
| 19 | Shake animation gap | YES |
| 20 | Cumulative damage stats absent | MAYBE (UI scope — need Phase 0 decision) |
| 21 | Log actor colors hardcoded | NO (existing constraint, не fix) |
| 22 | v2 coach active boost UI | YES |
| 23 | v2 single coach overlay | YES |
| 24 | Per-type flash color mapping | YES |
| 25 | Dice icon assets | YES (asset sourcing required) |
| 26 | Modifiers bar UI | YES |
| 27 | Dice cooldown countdown display | YES |
| 28 | XP earned display absent | MAYBE (display only — UI scope decision) |

### Sub-epic 5 polish carry-overs (#29-#33, 5 items, all polish/non-functional)

| # | Item | Sub-epic 7 Bundle? |
|---|---|---|
| 29 | Filter chips (Archetype/Belt) BE extension | NO — future BE feature (large scope) |
| 30 | ELO duplication consolidation | NO — refactor sub-epic candidate |
| **31** | **ErrorMsg shape mismatch BE→FE** | **MAYBE — Lesson #33 5th application candidate (BE touch + cherry-pick PR if bundled)** |
| 32 | `.mm-main left:270px` filters-hidden gap | YES (CSS-only single-line) |
| 33 | Captain vs opponent payload field name asymmetry | NO — BE refactor candidate (large surface) |

### Sub-epic 6 polish carry-overs (#34-#37, 4 items, all spectate UI polish)

| # | Item | Sub-epic 7 Bundle? |
|---|---|---|
| 34 | Coach pause read-only overlay UI absent (HudSpectate) | YES (HudSpectate polish bundle) |
| 35 | activeEffects display badges absent (HudSpectate) | YES |
| 36 | "joined late" visual indicator absent | YES |
| 37 | `--draw` CSS class verification | YES (single-line CSS если missing) |

---

## PRE-CUTOVER ACCEPTANCE GATE (Forward note для Sub-epic 8)

**User direction (recorded в Sub-epic 3, reinforced 4a/4b/5/6):** Full /v2 visual + functional sweep across все routes — comprehensive acceptance gate before Sub-epic 8 cutover.

**Coverage required (consolidated through Sub-epic 6):**
- /v2/profile (own + guest variants)
- /v2/wallet (Sub-epic 3)
- /v2/account (Sub-epic 3)
- /v2/ratings (Sub-epic 2 Path D — 4 tabs real data)
- /v2/clan + /v2/clan/:id (5D + Sub-epic 1)
- /v2/user/:login (6B-3 guest)
- /v2/fight (Sub-epic 4a happy path + 4b edge cases ✅ FUNCTIONAL) — surrender / reconnect / timeout / connection-lost banner all covered
- /v2/matchmaking (Sub-epic 5 real backend ✅ FUNCTIONAL) — searching / found с countdown / timeout с retry / cancel paths all covered
- **/v2/spectate/:fightId (Sub-epic 6 real spectate ✅ FUNCTIONAL)** — friends-only auth + real BE state + late-join + race guards
- /v2/training (existing)
- /v2/help (6B-1)
- **/v2/auth (Sub-epic 7 — TBD scope)** — Auth flow redesign
- /v2 (hub)
- All carry-overs #18-#37 polish review (Sub-epic 7 batch)
- v2 cutover auth posture audit (carry-over #10)

**Action item для Sub-epic 8 design-Claude:** Comprehensive checklist build (mirror Sub-epic 2-6 visual verify gates pattern but covering ENTIRE /v2 surface). User-driven manual ratification before proceeding с cutover redirects.

---

## SUGGESTED STARTING POINT — FRESH SESSION

### Bootstrap message для нового чата (design-Claude)

```
Привет!

Перед началом любой работы — три обязательных шага:
1. Прочитать CLAUDE.md (source of truth по проекту, приложен).
2. Прочитать handoff HANDOFF_EPIC6_SUBEPIC_7_CHAT_HANDOFF.md
   (приложено).
3. (Optional) Прочитать EPIC6_SUBEPIC_6_FINAL_REPORT.md
   для historical context — 50 catches + Lesson #44 promotion +
   NEW closure shape (code-complete + deferred-deploy).

[Стандартные правила Workflow / Mode A / агенты — как всегда]

Контекст: Sub-epic 6 (Real spectate + production hotfix C4.5
PR #356) только что закрыт clean. Streak 30, прогресс 13/14 (93%)
— past 13/14 milestone. Recoveries 87+ (2 added в Sub-epic 6 —
#86 + #87 bootstrap divergence Lesson #43 6th/7th occurrences).
Lessons promoted 37 (+1: #44 PROMOTED — re-anchor scope after
strategy revision). 6 Phase 0 mandatory subsections established
(6th promoted в Sub-epic 6).

Начинаем Sub-epic 7 — Visual polish round + Auth + Wallet redesign
(M-L size, ~12-18 commits). Phase 0 investigation первый шаг —
Q1-Q7 outline в handoff'е + 4 path candidates α/β/γ/δ.

В Phase 0 ТЗ обязательны 6 enhancement subsections (NEW —
6th promoted Sub-epic 6):
1. API contract verification
2. Negative-space verification
3. Real CSS class taxonomy dump
4. UI infrastructure dependencies
5. Vocabulary alignment audit
6. **Semantic invariant + flow direction verification (NEW MANDATORY)**

Sub-epic 7 attention point: Auth flow likely surfaces post-auth
redirect derivation + wallet connection state machine — 6th
subsection критично там.

Branch: claude/investigate-matchmaking-2JlwO-WfdV0 (continue
stack — same branch where Sub-epic 6 closed). Phase 0 STEP 0
mandatory git verify первый шаг (8th occurrence Lesson #43
likely).

Lesson #43 ACTIVE — Phase 0 STEP 0 mandatory:
git fetch && git status -uno && git branch --show-current && git log --oneline -5

Lesson #44 ACTIVE — re-anchor scope after strategy revision.
Carry-over #4 Auth+Wallet redesign — main user scope. Path
revision likely (α/β/γ/δ candidates). При revision —
re-propagate explicitly через все ТЗ artefacts.

Lesson #33 — Sub-epic 7 МОЖЕТ touch BE (carry-over #31 ErrorMsg
shape bundle candidate). Cherry-pick → main → Railway PR flow
per branch strategy в CLAUDE.md если bundled. 6th application
Lesson #33 conditional.

Подтверди что понял правила.
```

### First task для свежей design-Claude

1. Read CLAUDE.md + this handoff (+ optional Sub-epic 6 final report)
2. Compose Phase 0 investigation request к Claude Code (Q1-Q7 outlined above + 6 mandatory enhancement subsections)
3. **Critical user decision needed early:** Path α/β/γ/δ choice (scope decision — pure polish vs Auth+Wallet vs mixed). Recommend Path γ baseline, verify с user.
4. Wait Claude Code Phase 0 report
5. Compose Phase 1 ТЗ для Sub-epic 7

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
- **"У меня локально работает" — не доказательство.** Visual verify gate strict (Sub-epic 7 acceptance gate cumulative с pre-cutover gate Sub-epic 8).
- **Расхождение с CLAUDE.md** — фиксировать, не молча править.
- **Surface conditions strict** — Pre-edit verify gates triggered → STOP, не fix-forward.
- **Streak 30 preservation** через Lesson #35 tiering — adaptation-tier OK, hot-fix avoid.
- **Backend changes deploy environment awareness** — Sub-epic 7 МОЖЕТ touch BE (#31 bundle candidate). Lesson #33 — backend changes от designated branch НЕ auto-deploy. Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md. 6th application conditional.
- **Pre-cutover acceptance gate** — forward-record для Sub-epic 8 (full /v2 sweep before cutover, user-direction).
- **6 Phase 0 enhancement subsections mandatory** (5 prior + 6th PROMOTED Sub-epic 6) — derived from 50 (6) + 61 (5) + 38 (4b) Lesson #11 catches, surface assumption mismatches pre-edit, save rework.
- **Lesson #43 ACTIVE — 7-occurrence chain.** Phase 0 STEP 0 mandatory git verify before any actions. 8th occurrence likely Sub-epic 7.
- **Lesson #44 ACTIVE — re-anchor scope after strategy revision.** Critical для Sub-epic 7 — Auth+Wallet scope decisions likely revise during Phase 0/1. No mental-model carry-overs.
- **HudProfile card-creep monitor (6/7)** — Sub-epic 7 likely touches HudProfile (Auth+Wallet redesign may add card). Trigger refactor if 7th card added.
- **Carry-over #16 future-Claude warning** — `isPlayer1: false` hardcode в ChallengeNotification.vue:62 IS semantically correct (acceptor=player2 per BE invariant). Sub-epic 5/6 confirmed pattern. Do NOT "fix" к computed expression — would invert correct value.
- **Sub-epic 6 closure shape:** code-complete + deferred-deploy NEW. Sub-epic 7 likely Standard linear OR code-complete + deferred-deploy depending на ErrorMsg shape bundle decision.
- **Path B-min + D combo lessons learned (Sub-epic 6):** when feature work + production hotfix surface together, separate cherry-pick PR с minimal scope. Не bundle feature + hotfix в single PR. Sub-epic 7 if production touch surfaces — same pattern.

---

**Sub-Epic 6 — CLOSED clean ✅. Streak 30 achieved.**

Sub-Epic 7 — starting. Fresh design-Claude session welcomed.
