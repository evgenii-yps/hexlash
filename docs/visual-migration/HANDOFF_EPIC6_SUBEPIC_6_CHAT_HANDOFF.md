# HANDOFF — Hexlash Visual Migration — Эпик 6 — Sub-epic 6 starting

**Date:** 2026-05-04
**Reason for handoff:** Sub-epic 5 closed clean (Real matchmaking — Path A pure FE wiring leveraging BE 100% complete). Fresh design-Claude session starting Sub-epic 6 (Real spectate finalization — M-L size).
**Predecessor:** `EPIC6_SUBEPIC_5_FINAL_REPORT.md` (CL2 commit `b56bdfc`)
**Next sub-epic:** Sub-epic 6 — Real spectate

---

## ROLE — design-Claude

Ты — design-Claude в Hexlash visual migration project. User не-технический, работает с Claude Code в IDE на отдельной branch. **Ты пишешь ТЗ** для Claude Code, Claude Code исполняет на branch.

User общается на русском, нужны простые объяснения. User часто отвечает короткими сообщениями ("a", "b", "c", "ok", "пиши", "go"). User выбирает буквы из вариантов. Не задавай слишком много вопросов сразу. Бери решения сам где можешь, спрашивай только critical decisions.

**Project files в /mnt/project/** — там лежат CLAUDE.md и handoff файлы.
**ТЗ files** сохраняются в /mnt/user-data/outputs/ для удобства copy-paste user'ом.

**Naming convention:** `EPIC6_SUBEPIC_<N>_*` для всех closure docs (established Sub-epic 2, applied through 5).

---

## CURRENT STATE

- **Branch:** `claude/investigate-matchmaking-2JlwO` (continue stack — Sub-epic 5 worked здесь after harness fresh-slug = continue stack same SHA Recovery #85 adaptation. Sub-epic 6 may continue OR Эпик 6 closure decision deferred)
- **HEAD entering Sub-epic 6:** CL3 SHA (Sub-epic 6 handoff) — current as of this commit
- **Streak:** **29** ✅ (clean через 13 sub-epics в Эпике 6 + 5E-5U предыдущей серии)
- **Эпик 6 progress:** **12/14 (86%)** — past 6/7 milestone reached (85.7%)
- **Recoveries cumulative:** **85+** (Sub-epic 5 added 1 — Recovery #85 bootstrap branch divergence adaptation-tier, Lesson #43 5th occurrence)
- **Lessons promoted:** **36** (Lesson #43 PROMOTED in 4b — bootstrap branch divergence reflex, 5-occurrence chain validated through Sub-epic 5)
- **Lesson candidates active:** 7 (#36/#37/#38/#39/#40/#41/#42); 6th Phase 0 subsection candidate tracking (semantic invariant + flow direction verification — 4b C10 1st occurrence; **occurrence #2 NOT detected в Sub-epic 5 through all 12 commits** — strong evidence pairing-symmetric flow doesn't trigger; tracking continues)
- **Closure shapes established (4):** standard linear (9 applications через Sub-epic 5) / deprecation-via-redirect / code-complete + deferred-verify (3 applications — 6B-3a-backend, Sub-epic 1, Sub-epic 4b) / scope-deferral-к-downstream
- **Sub-epic 5 metric:** **61 cumulative Lesson #11 catches pre-edit** — new ceiling для L-size sub-epic methodology (4b 38-catch ceiling exceeded 60%, consistent с Phase 0 prediction для new architectural area). 0 hot-fixes, 0 reactive splits, 0 STOP-tier через 12 functional commits.

---

## ЧТО ЗАКРЫТО В ЭПИКЕ 6 (12 sub-epics)

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
12. **Sub-epic 5 (was 6B-8)** — Real matchmaking `/v2/matchmaking` ← **только что закрыт**

---

## ЧТО ОСТАЛОСЬ (3 sub-epics до closure)

- **Sub-epic 6** — Real spectate (M-L) ← **СЕЙЧАС**
- **Sub-epic 7** — Visual polish round (carry-overs #18-#28 batch close + v2 NoConnection restyle + dice icons + modifiers bar + Auth+Wallet redesign #4 + Vuetify→v2 port #14-#15) (M-L)
- **Sub-epic 8** — Pre-cutover acceptance gate + v1→v2 cutover + Эпик 6 closure (L)

> **Note:** Sub-epic 5 visual polish carry-overs (#29-#33) folding into Sub-epic 7 likely. Final ordering decision deferred к Sub-epic 6 closure.

---

## SUB-EPIC 6 — SCOPE OUTLINE

### Что это

Real spectate finalization — replace 5N HUD-only mock spectate (`HudSpectate.vue` 494 lines с client-side `setInterval + Math.random` simulation per Path α discipline) с real BE WebSocket integration.

Currently в v2:
- ✅ `src/views-v2/SpectateView.vue` exists (route orchestrator — minimal scaffold)
- ✅ `src/components/hud/HudSpectate.vue` (494 lines) — full UI shell с client-side fight simulation (rounds, HP bars, fight log, dice indicators, coach pause, fight result)
- ❌ NO BE WS message types (`SpectateJoinMsg`, `SpectateLeaveMsg`, `SpectatorEventMsg`, `SpectatorListMsg`) — verified Phase 0 light grep
- ❌ NO `webSocketState.js` spectate routing
- ❌ NO BE spectate broadcast mechanism в `pvpCombatEngine` / `pvpMatchManager`

**Pattern parity с Sub-epic 5 matchmaking pre-state:** v2 had FE shell, mock-only, zero BE integration. Sub-epic 5 closed gap via Path A (BE 100% pre-existing); **Sub-epic 6 likely Path C/D pattern (BE work mandatory)**.

### Размер

- M-L (~15-20 commits estimated)
- Likely 1-2 sessions
- Backend touches: **YES** (very likely) — spectate broadcast mechanism may need pvpCombatEngine extension. Lesson #33 deploy chain awareness mandatory (cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md).

### Backend touches

**Investigation areas Phase 0 (pre-flight read-only):**

1. **Existing PvP event chain** — `pvpCombatEngine.emit()` calls (round_result, dice_rolled, dice_available, coach_pause, coach_result, fight_end, overdrive_start, fight_state_resume) — currently sent only к match.player1.socket / match.player2.socket via `sendToPlayer`. Spectator-broadcast extension needed.

2. **pvpMatchManager spectator tracking** — does it currently track spectators? Light grep'd: NO `spectators` field в match object. Sub-epic 6 likely adds `match.spectators: Set<userId>` + broadcast loop.

3. **WS message types для spectator subscribe/unsubscribe:**
   - `SpectateJoinMsg { type, matchId }` — FE→BE: subscribe к match events
   - `SpectateLeaveMsg { type }` — FE→BE: unsubscribe
   - `SpectatorListMsg { type, matchId, count }` — BE→FE: spectator count update
   - `SpectatorEventMsg` или existing event types broadcast verbatim — design decision

4. **Spectator authorization** — public matches OR friend-only restriction? Friends list integration? Per CLAUDE.md 5N "Friend Watch button" precedent — likely friend-only initially.

5. **Race conditions:**
   - User joins spectate, match ends mid-stream → cleanup
   - User disconnects mid-spectate → cleanup spectator set
   - Match starts AFTER user clicks Watch (race) → late-join handling

6. **Match finding / ID source** — how does FE discover spectatable matches?
   - From friends list (online + in_fight status — Sub-epic 4a precedent ChallengeNotification flow)
   - From hub leaderboard?
   - From general "live matches" feed?
   - Most likely: friends-only first (light scope), explore wider feed Sub-epic 7+ if needed.

### Phase 0 expected investigation areas (Q1-Qn baseline)

**Q1 — Existing infrastructure inventory:**
- Q1.1: FE WS routing (any spectate routing exists?)
- Q1.2: BE spectate service (exists? scaffold? none?)
- Q1.3: BE WS handler routing (SpectateJoin/Leave handlers?)
- Q1.4: FE SpectateView v2 status (5N mock vs real)
- Q1.5: V1 spectate reference pattern (если exists в /src/views/)

**Q2 — Spectator subscription mechanism:**
- Q2.1: How does FE subscribe к match events?
- Q2.2: Per-match Set<spectatorId> в match object?
- Q2.3: Pairing logic — who broadcasts (engine / manager / handler)?

**Q3 — PvP event chain reuse:**
- Q3.1: Existing emit calls (round_result, dice_rolled, etc) — sendable к spectators?
- Q3.2: Authoritative source — same event for player AND spectator OR separate?
- Q3.3: Rate limiting / spectator queue (10+ spectators amplification concern)

**Q4 — Spectator UI overlay infrastructure:**
- Q4.1: Mount point — `/v2/spectate/:fightId` route entry
- Q4.2: HudSpectate (5N) reuse vs refactor
- Q4.3: Layout / styling primitives — `.sp-*` namespace already established
- Q4.4: UI elements — round counter, HP bars, fight log, dice indicators, coach pause display, result overlay

**Q5 — Match finding / discovery:**
- Q5.1: Entry points — Friends list "Watch Live" button (5N had — verify wiring)
- Q5.2: Live matches feed / hub integration
- Q5.3: Direct URL access (/v2/spectate/:fightId с unknown match)

**Q6 — Authorization / access control:**
- Q6.1: Public matches vs friend-only
- Q6.2: BE-side validation (does requesting user have authority к watch match X)
- Q6.3: Privacy concerns — opponent visibility

**Q7 — Lifecycle & cleanup:**
- Q7.1: Match end handling — spectators auto-disconnect
- Q7.2: User disconnect mid-spectate — pvpMatchManager spectator set cleanup
- Q7.3: Late-join — replay events from match start? (state-replay mechanism? Sub-epic 4b `fight_state_resume` pattern reuse?)

**Q8 — Race conditions:**
- Q8.1: Spectator joins mid-fight transition (between rounds)
- Q8.2: Match ends just as user joins (FE shows briefly, then result overlay)
- Q8.3: Multiple tabs/spectator instances per user

**Q9 — Match handoff к /v2/spectate:**
- Q9.1: WS subscribe ordering (mount → SpectateJoinMsg → events flow)
- Q9.2: Handle SpectatorListMsg для spectator count display
- Q9.3: Hand-off /v2/spectate → /v2 cleanup (SpectateLeaveMsg + state reset)

### 5 mandatory Phase 0 subsections (per Sub-epic 4a/4b/5 precedent — 10 + 38 + 61 catches validated)

**Mandatory Phase 0 subsections (each requires explicit pre-edit dump):**

1. **API contract verification** — exact WS message types + field names + payload shapes для spectate flow. v1 reference pattern если exists.
2. **Negative-space verification** — что НЕ существует но Phase 1 ТЗ может предположить (spectate service / WS routing / spectator set / event broadcast chain).
3. **Real CSS class taxonomy dump** — `.sp-*` namespace existing (5N HudSpectate). Reusable patterns dump.
4. **UI infrastructure dependencies** — для каждого new handler чек full chain (button exists? state field for "is spectating"? handler wired? overlay mount?).
5. **Vocabulary alignment audit** — mock taxonomy ↔ BE taxonomy. 5N mock used setInterval + Math.random — replaced с real WS event chain. Convention verification mandatory.

### 6th Phase 0 subsection candidate (TRACKING — 1st occurrence из 4b C10)

**Semantic invariant + flow direction verification.** Phase 0 finding required для tracking. **Sub-epic 6 attention point:** spectate flow MAY surface player-ordering derivation if "self-perspective vs opponent-perspective" rendering needed (different semantic context от matchmaking pairing-symmetric flow). If 2nd occurrence detected → promote к mandatory subsection. If NOT detected (как Sub-epic 5) → continue tracking.

### Path candidates (стратегические для design-Claude после Phase 0)

- **Path α (FE-only mock-port — current 5N state)** — keep mock simulation, just polish UI. NOT real-feature path. Anti-rec для Sub-epic 6 closure (carry-over technical debt — defer to Эпик 7).
- **Path A (FE wiring — IF BE 100% complete)** — analogue к Sub-epic 5. Investigation Phase 0 must confirm BE event chain reusable. UNLIKELY given current grep findings (no spectate WS types).
- **Path B (BE extension minimal — broadcast existing events к spectators)** — extend pvpMatchManager с spectator Set, broadcast existing emit calls к spectators. FE wires SpectateJoin/Leave + listener routing. **Most likely path** для М-L scope.
- **Path C (BE extension comprehensive — separate spectator event types + state-replay для late-joiners)** — adds replay mechanism (mirror Sub-epic 4b `fight_state_resume`), spectator-specific message types. L scope expansion.
- **Path D (Friends-only spectate без feed)** — narrows scope: only friends-list "Watch Live" entry point, no general feed. Likely starting scope, later wider в Sub-epic 7+.

**Recommendation factual basis:** Path B + Path D combined likely. Phase 0 will verify.

### Сложности / риски

- BE deploy chain mandatory (Lesson #33 — 4th application after 6B-3a-backend / Sub-epic 1 / Sub-epic 4b). Cherry-pick → main → Railway PR flow.
- Spectator broadcast amplification concern (10+ spectators → 10× send overhead per event). Rate limiting or batching may need consideration.
- 5N HUD reuse vs refactor — current mock simulation logic (~250 lines внутри HudSpectate) needs gutting OR adaptation. Pattern parity с Sub-epic 5 mock-flow gut в C2.
- Late-join replay — design decision (mirror Sub-epic 4b `fight_state_resume` OR simpler "join in progress without history"). Affects Path B/C choice.
- Friends list integration — Watch Live button currently mock per 5N. Confirm Phase 0 wiring state.

### Pre-flight Phase 0 expected size

- ~10-15 questions Q1-Qn + 5 mandatory subsections + 6th candidate + path candidates basis
- ~600-1000 lines Phase 0 report (similar к Sub-epic 5 Phase 0 — 964 lines)
- Single-write attempt с 5Q-5U preventive split fallback ready (3-part split likely if API stream timeout)

---

## КЛЮЧЕВЫЕ ПАТТЕРНЫ ЭПИКА 6 (для applying в ТЗ)

### Mode A discipline (фундамент)

- 1 commit per step (атомарные)
- Build pass per commit (`npm run build`)
- Push after each commit (immediate)
- STOP-and-confirm после C1 (first commit gate)
- Audit-only mode C2+ (per 4a/4b/5 precedent)
- Lesson #11 reflex pre-edit + post-edit grep on every edit

### Investigation refines ТЗ inline (verify-gate workflow precedent)

- Phase 0 / mini-verification findings refine ТЗ during execution
- 4b reached 38 catches; Sub-epic 5 reached 61 catches — pattern fully validated
- Verify-gate refinements applied pre-edit, NOT classified as recoveries (Sub-epic 2/3/4a/4b/5 precedent)

### Lesson #32 (convention discovery)

- Mirror local convention wins over ТЗ literal
- ТЗ литерал может быть imprecise; код = source of truth
- Phase 0 file:line refs готовы для check
- Sub-epic 5 examples: module-scope `let` vs `ref`, `useStore` composition, CSS naming (.mm-found-* vs .mmf-* clash avoidance)

### Lesson #33 (deploy environment awareness — 4th application likely)

- Backend changes от designated branch НЕ auto-deploy
- Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md
- 3 prior applications: 6B-3a-backend / Sub-epic 1 / Sub-epic 4b. Sub-epic 6 likely 4th.

### Lesson #34 (HUD overlay convention)

- Root container `position: fixed; inset: 0; pointer-events: none;`
- Interactive children `pointer-events: auto;`
- z-index alignment с existing namespace
- 5N HudSpectate already follows pattern (verified line 1-22 header comment)

### Lesson #35 tier classification

- adaptation-tier (TZ assumption mismatch with codebase reality — fix within Phase as conscious deviation, NOT triggered Lesson #18, NOT hot-fix)
- bug-bundle-tier (additional callsites of same class — fix within Phase as expansion)
- scope-boundary-tier (different class requiring own pre-edit grep + import work — STOP within Phase, document carry-over forward, Lesson #18 IS triggered)

Sub-epic 5 result: 61 catches all adaptation-tier (or convention-discovery sub-tier per Lesson #32 reflex). 0 bug-bundle scope expansion. 0 STOP-tier. Streak preserved.

### Lesson #36 (HudProfile card-creep monitor — currently 6/7)

- Track Sub-epic 6 IF touches HudProfile (likely NOT — spectate is /v2/spectate/:fightId standalone view)
- Trigger refactor if 7th card added в 6/7/8

### Lesson #43 ACTIVE (PROMOTED — 4b, 5-occurrence chain validated через Sub-epic 5)

- Phase 0 STEP 0 mandatory bootstrap branch verification
- 5 occurrences chain: 5U / Sub-epic 2 / 4a Phase 0 / 4b Phase 0 / Sub-epic 5 Phase 0
- 6th occurrence likely в Sub-epic 6 — handle adaptation-tier per established pattern

### Bug-bundle-tier classification (Lesson #35 framework)

- Same edit class additions OK as bundle (e.g. import line update bundled with module rename)
- Different class scope expansion = STOP (sub-epic discipline)

### Closure shape choice

4 patterns established:
- **Standard linear** (9 applications в Эпике 6 включая Sub-epic 5) — single-thread closure, no BE deploy chain split
- **Code-complete + deferred-verify** (3 applications: 6B-3a-backend, Sub-epic 1, 4b) — used при cherry-pick → main → Railway flow needed
- **Deprecation-via-redirect** (1 application: 6B-2) — used при underlying feature retires conceptually
- **Scope-deferral-к-downstream** (1 application: 6B-3b) — used при scope integrates inline в later sub-epic

Sub-epic 6 likely **Code-complete + deferred-verify** (4th application) если BE work mandatory.

### Verify-gate workflow precedent

Phase 0 / mini-verification findings refine ТЗ inline. Cumulative pre-edit catches counts:
- Sub-epic 4a: 10 catches (M-L size)
- Sub-epic 4b: 38 catches (M-L size с BE chain)
- Sub-epic 5: 61 catches (L size — new architectural area, ceiling)

Sub-epic 6 expected: ~30-50 catches (mid-range; new area но similar scope-discipline).

---

## PHASE 0 ENHANCEMENT CANDIDATES (5 mandatory + 1 candidate)

**5 mandatory subsections** (validated через 4a/4b/5 — surfaced 10/38/61 catches respectively):

1. **API contract verification** — exact signatures, getter paths, mutation/action shapes, constants imports, exact field names
2. **Negative-space verification** — что НЕ существует (Sub-epic 6 likely surfaces multiple gaps — spectate service / spectator set / event broadcast chain)
3. **Real CSS class taxonomy dump** — `.sp-*` namespace existing
4. **UI infrastructure dependencies** — chain checks (button → state → handler)
5. **Vocabulary alignment audit** — mock vs BE comparisons (5N mock uses setInterval/Math.random; replace с real WS chain)

**6th subsection candidate (1st occurrence 4b C10, occurrence #2 NOT detected в Sub-epic 5):**

6. **Semantic invariant + flow direction verification** — Sub-epic 6 attention point if "self-perspective vs opponent-perspective" rendering OR player-ordering surface

---

## ACTIVE CARRY-OVERS (31 items entering Sub-epic 6)

**Inherited from prior sub-epics (15 items, untouched в Sub-epic 5):**

| # | Item | Source | Priority |
|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop, κ Path B | LOW |
| 2 | HudProfile card-creep monitor (6/7) | 5L+ → 5S Q1.3 | MONITOR (likely NOT triggered в 6 — spectate standalone view) |
| 3 | Lesson #36 validation track | 5R | LOW (await 2nd occurrence) |
| 4 | Auth + Wallet redesign | 6A user request | Sub-epic 7 |
| 5 | `/rules` → v2 port | 6B-1 Phase 0 | Sub-epic 8 cleanup |
| 6 | 3D models + devices system | 6B-2 user direction | Эпик 7+ |
| 7 | Locale cleanup (10 → English-only) | 6B-3a user direction | Эпик 7+ |
| 8 | `/user/search sortBy=balance` | 6B-3a Phase 1 | LOW (secondary leak) |
| 9 | Clan data integration audit | Sub-epic 1 surface | M-L sub-epic candidate |
| 10 | v2 cutover auth posture audit | Sub-epic 1 surface | Sub-epic 8 territory |
| 11 | friendsState.searchPlayers captain drop | Sub-epic 2 Commit 4 surface | Polish round / friends sub-epic |
| 12 | HudRatings 8-col CSS grid mismatch | Sub-epic 2 Commit 11 defer | Polish round |
| 13 | HudRatings keyboard a11y | Sub-epic 2 Commit 8 audit | Polish round |
| 14 | Switcher3DPunch SKIP | Sub-epic 3 Q-tactical-1 | Polish round / Sub-epic 7 absorb |
| 15 | Account/Wallet Vuetify → v2 design system port | Sub-epic 3 Q-tactical-Phase1-3/5 | Polish round / Sub-epic 7 absorb |

**Sub-epic 4a polish carry-overs (#18-#28 — all decoration/polish/non-functional, 11 items; #17 closed Sub-epic 5 C8):**

| # | Item | Sub-epic 6 Bundle Candidate? |
|---|---|---|
| 18 | Dodge/crit overlay title mechanism gap | NO — Sub-epic 7 |
| 19 | Shake animation gap | NO — Sub-epic 7 |
| 20 | Cumulative damage stats absent | NO — Sub-epic 7 |
| 21 | Log actor colors hardcoded | existing constraint, NO — Sub-epic 7 |
| 22 | v2 coach active boost UI | NO — Sub-epic 7 |
| 23 | v2 single coach overlay | NO — Sub-epic 7 |
| 24 | Per-type flash color mapping | NO — Sub-epic 7 |
| 25 | Dice icon assets | NO — Sub-epic 7 |
| 26 | Modifiers bar UI | NO — Sub-epic 7 |
| 27 | Dice cooldown countdown display | NO — Sub-epic 7 |
| 28 | XP earned display absent | NO — Sub-epic 7 |

**Sub-epic 5 polish carry-overs (#29-#33 — all polish/non-functional, 5 items):**

| # | Item | Source | Sub-epic 6 Bundle Candidate? |
|---|---|---|---|
| 29 | Filter chips (Archetype/Belt) BE extension | C3 hide v-if=false | NO — Sub-epic 7 OR future BE feature |
| 30 | ELO duplication consolidation | Phase 0 finding | NO — Sub-epic 7 OR refactor sub-epic |
| 31 | ErrorMsg shape mismatch BE→FE | C1 surface | Lesson #33 deploy chain candidate; **Sub-epic 6 likely touches BE — possible bundle ?** |
| 32 | `.mm-main left:270px` filters-hidden gap | C7 audit surface | NO — Sub-epic 7 (matchmaking-only CSS) |
| 33 | Captain vs opponent payload field name asymmetry | C8 surface | NO — Sub-epic 7 OR BE refactor |

**Closed in Sub-epic 5 (referenced для historical clarity):**
- #17 ✅ CLOSED (C8) — v2 countdown UI parity gap closed via matchmaking-side post-MatchFoundMsg 3-second countdown.

**Sub-epic 6 expected carry-over additions:** medium (spectate is new architectural area + BE work — likely 3-7 polish/edge case items surface during Phase 0 + execution).

---

## 🚨 IMPORTANT FORWARD NOTE — PRE-CUTOVER ACCEPTANCE GATE (Sub-epic 8)

**User direction (recorded в Sub-epic 3, reinforced 4a/4b/5):** Full /v2 visual + functional sweep across все routes — comprehensive acceptance gate before Sub-epic 8 cutover.

**Coverage required (consolidated through Sub-epic 5):**
- /v2/profile (own + guest variants)
- /v2/wallet (Sub-epic 3)
- /v2/account (Sub-epic 3)
- /v2/ratings (Sub-epic 2 Path D — 4 tabs real data)
- /v2/clan + /v2/clan/:id (5D + Sub-epic 1)
- /v2/user/:login (6B-3 guest)
- **/v2/fight (Sub-epic 4a happy path + 4b edge cases ✅ FUNCTIONAL)** — surrender / reconnect / timeout / connection-lost banner all covered
- **/v2/matchmaking (Sub-epic 5 real backend ✅ FUNCTIONAL)** — searching / found с countdown / timeout с retry / cancel paths all covered
- **/v2/spectate/:fightId (Sub-epic 6 real spectate)** — current scope
- /v2/training (existing)
- /v2/help (6B-1)
- /v2 (hub)
- All carry-overs #18-#28 + #29-#33 polish review (Sub-epic 7 batch)
- v2 cutover auth posture audit (carry-over #10)

**Action item для Sub-epic 8 design-Claude:** Comprehensive checklist build (mirror Sub-epic 2/3/4a/4b/5 visual verify gates pattern but covering ENTIRE /v2 surface). User-driven manual ratification before proceeding с cutover redirects.

---

## SUGGESTED STARTING POINT — FRESH SESSION

### Bootstrap message для нового чата (design-Claude)

```
Привет!

Перед началом любой работы — три обязательных шага:
1. Прочитать CLAUDE.md (source of truth по проекту, приложен).
2. Прочитать handoff HANDOFF_EPIC6_SUBEPIC_6_CHAT_HANDOFF.md
   (приложено).
3. (Optional) Прочитать EPIC6_SUBEPIC_5_FINAL_REPORT.md
   для historical context — 61 catches и Path A pure FE wiring approach.

[Стандартные правила Workflow / Mode A / агенты — как всегда]

Контекст: Sub-epic 5 (Real matchmaking) только что закрыт clean.
Streak 29, прогресс 12/14 (86%) — past 6/7 milestone. Recoveries
85+ (1 added в 5 — Recovery #85 bootstrap branch divergence
adaptation-tier, Lesson #43 5th occurrence). Lessons promoted 36
(no new promotions).

Начинаем Sub-epic 6 — Real spectate (M-L size, ~15-20 commits).
Phase 0 investigation первый шаг — Q1-Qn outline в handoff'е +
5 path candidates α/A/B/C/D.

В Phase 0 ТЗ обязательны 5 enhancement subsections:
1. API contract verification
2. Negative-space verification
3. Real CSS class taxonomy dump
4. UI infrastructure dependencies
5. Vocabulary alignment audit

6th candidate tracking (1st occurrence 4b C10, occurrence #2
NOT detected в Sub-epic 5 — strong evidence pairing-symmetric
flow doesn't trigger):
6. Semantic invariant + flow direction verification

Sub-epic 6 attention point: spectate flow MAY surface
player-ordering derivation if "self-perspective vs opponent-
perspective" rendering surfaces — different semantic context
от matchmaking pairing-symmetric flow.

Branch: claude/investigate-matchmaking-2JlwO (continue stack —
Sub-epic 5 worked здесь after harness fresh-slug = continue
stack same SHA per Recovery #85). Phase 0 STEP 0 mandatory
git verify первый шаг (6th occurrence Lesson #43 likely).

Lesson #43 ACTIVE — Phase 0 STEP 0 mandatory:
git fetch && git status -uno && git branch --show-current && git log --oneline -5

Lesson #33 — Sub-epic 6 ВЕРОЯТНО touch BE (spectate broadcast
mechanism — pvpCombatEngine extension OR pvpMatchManager
spectator Set + broadcast loop). Cherry-pick → main → Railway
PR flow per branch strategy в CLAUDE.md. 4th application Lesson #33
likely (after 6B-3a-backend / Sub-epic 1 / Sub-epic 4b).

Подтверди что понял правила.
```

### First task для свежей design-Claude

1. Read CLAUDE.md + this handoff (+ optional Sub-epic 5 final report)
2. Compose Phase 0 investigation request к Claude Code (Q1-Q9 outlined above + 5 mandatory enhancement subsections + 6th candidate tracking)
3. Wait Claude Code Phase 0 report
4. Take Path decision (α/A/B/C/D) или escalate user (likely needs user choice given Path B vs C scope variance)
5. Compose Phase 1 ТЗ для Sub-epic 6

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

---

## CRITICAL REMINDERS

- **Не выходи за рамки ТЗ.** Расхождения — в отчёт, не молча чинить.
- **Не доверяй памяти про факты проекта** — проверяй через CLAUDE.md и/или код.
- **"У меня локально работает" — не доказательство.** Visual verify gate strict (Sub-epic 6 acceptance gate before Sub-epic 8 cutover gate).
- **Расхождение с CLAUDE.md** — фиксировать, не молча править.
- **Surface conditions strict** — Pre-edit verify gates triggered → STOP, не fix-forward.
- **Streak 29 preservation** через Lesson #35 tiering — adaptation-tier OK, hot-fix avoid.
- **Backend changes deploy environment awareness** — Sub-epic 6 expected к touch BE substantially. Lesson #33 — backend changes от designated branch НЕ auto-deploy. Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md. 4th application likely.
- **Pre-cutover acceptance gate** — forward-record для Sub-epic 8 (full /v2 sweep before cutover, user-direction).
- **5 Phase 0 enhancement subsections mandatory** — derived from 38 (4b) + 61 (5) Lesson #11 catches, surface assumption mismatches pre-edit, save rework.
- **6th Phase 0 subsection candidate tracking** — semantic invariant + flow direction (4b C10 1st occurrence; occurrence #2 NOT detected в Sub-epic 5 — pairing-symmetric flow strong evidence). If 2nd occurrence в Sub-epic 6 → promote.
- **Lesson #43 ACTIVE** — bootstrap branch divergence reflex. Phase 0 STEP 0 mandatory git verify before any actions.
- **Carry-over #16 future-Claude warning** — `isPlayer1: false` hardcode в ChallengeNotification.vue:62 IS semantically correct (acceptor=player2 per BE invariant). Sub-epic 5 confirmed pattern (3 codebase placeholders all correct per BE-truth overwrite cascade). Do NOT "fix" к computed expression — would invert correct value. Reclassified в 4b C10 STOP.
- **Sub-epic 5 closure shape:** standard linear (9th application). Sub-epic 6 likely **code-complete + deferred-verify** (4th application) due к BE work expected.
- **Path A pure FE wiring lessons learned (Sub-epic 5):** when BE 100% complete, FE-only sub-epic feasible с tight scope. Sub-epic 6 unlikely к match — BE extension мandatory expected.

---

**Sub-Epic 5 — CLOSED clean ✅. Streak 29-streak achieved.**

Sub-Epic 6 — starting. Fresh design-Claude session welcomed.
