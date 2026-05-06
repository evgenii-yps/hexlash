# HANDOFF — Hexlash Visual Migration — Эпик 6 — Sub-epic 5 starting

**Date:** 2026-05-04
**Reason for handoff:** Sub-epic 4b closed clean (PvP edge cases + safety + BE deploy chain — Path D combined slim). Fresh design-Claude session starting Sub-epic 5 (Real matchmaking — L size).
**Predecessor:** `EPIC6_SUBEPIC_4B_FINAL_REPORT.md` (CL2 commit `49abd86`)
**Next sub-epic:** Sub-epic 5 — Real matchmaking

---

## ROLE — design-Claude

Ты — design-Claude в Hexlash visual migration project. User не-технический, работает с Claude Code в IDE на отдельной branch. **Ты пишешь ТЗ** для Claude Code, Claude Code исполняет на branch.

User общается на русском, нужны простые объяснения. User часто отвечает короткими сообщениями ("a", "b", "c", "ok", "пиши", "go"). User выбирает буквы из вариантов. Не задавай слишком много вопросов сразу. Бери решения сам где можешь, спрашивай только critical decisions.

**Project files в /mnt/project/** — там лежат CLAUDE.md и handoff файлы.
**ТЗ files** сохраняются в /mnt/user-data/outputs/ для удобства copy-paste user'ом.

**Naming convention:** `EPIC6_SUBEPIC_<N>_*` для всех closure docs (established Sub-epic 2, applied through 4b).

---

## CURRENT STATE

- **Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack — НЕ создавать новую; Sub-epic 5 may continue OR Эпик 6 closure decision deferred)
- **HEAD entering Sub-epic 5:** CL3 SHA (Sub-epic 5 handoff) — current as of this commit
- **Streak:** **28** ✅ (clean через 12 sub-epics в Эпике 6 + 5E-5U предыдущей серии)
- **Эпик 6 progress:** **11/14 (78%)** — past three-quarters milestone
- **Recoveries cumulative:** **84+** (Sub-epic 4b added 1 — Recovery #84 bootstrap branch divergence adaptation-tier)
- **Lessons promoted:** **36** (Lesson #43 PROMOTED in 4b — bootstrap branch divergence reflex, 4-occurrence chain validated)
- **Lesson candidates active:** 7 (#36/#37/#38/#39/#40/#41/#42); 6th Phase 0 subsection candidate tracking (semantic invariant + flow direction verification — 4b C10 1st occurrence)
- **Closure shapes established (4):** standard linear (8 applications) / deprecation-via-redirect / code-complete + deferred-verify (3 applications — 6B-3a-backend, Sub-epic 1, Sub-epic 4b) / scope-deferral-к-downstream
- **PR #355 status:** open, awaiting review/merge → Railway auto-deploy. Functional verify deferred к post-merge (mirrors 6B-3a-backend pattern). Closure NOT blocked.

---

## ЧТО ЗАКРЫТО В ЭПИКЕ 6 (11 sub-epics)

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
11. **Sub-epic 4b (was 6B-7 partial)** — PvP edge cases + safety + BE deploy chain ← **только что закрыт**

---

## ЧТО ОСТАЛОСЬ (3 sub-epics до closure)

- **Sub-epic 5** — Real matchmaking (L, ~15-20 commits) ← **СЕЙЧАС**
- **Sub-epic 6** — Spectate finalization + remaining v2 routes (M-L)
- **Sub-epic 7** — Visual polish round (carry-overs #17-#28 batch close + v2 NoConnection restyle + dice icons + modifiers bar) (M)
- **Sub-epic 8** — Pre-cutover acceptance gate + v1→v2 cutover + Эпик 6 closure (L)

> **Note:** original 14-slot plan had Sub-epic 7 = Auth+Wallet redesign и Sub-epic 8 = final cutover. Visual polish carry-overs likely fold into Sub-epic 7 OR added as Sub-epic 7-bis. Final ordering decision deferred к Sub-epic 6 closure.

---

## SUB-EPIC 5 — SCOPE OUTLINE

### Что это

**Real matchmaking — random/ranked queue replacing client-side mock с real backend integration.** Currently в v2: friend-challenge only (4a happy path) + carry-over #17 polish gaps. Sub-epic 5 adds queue mechanics + matchmaking UI overlay + ELO calibration на match outcomes.

### Размер

**L (~15-20 commits, 1-2 sessions).** Likely largest sub-epic remaining в Эпике 6 due к BE matchmaking service integration + FE UI flow + ELO formula wiring + edge cases (cancel / timeout / empty queue / opponent disconnect during search).

### Backend touches

**ДА — Sub-epic 5 expected к touch BE substantially.** Lesson #33 deploy chain — cherry-pick → main → Railway PR per branch strategy в CLAUDE.md. Likely files:
- `backend/src/services/matchmaking.js` — extend existing matchmaking service (currently friend-only)
- `backend/src/websocket/handler.js` — `MatchmakingStartMsg` / `MatchmakingCancelMsg` / `MatchFoundMsg` already routed (per webSocketState.js:164-172) but may need extension
- `backend/src/services/eloService.js` — possibly extend для ranked match ELO updates
- `backend/src/config.js` — possibly new constants (MATCHMAKING_TIMEOUT_MS / ELO_RANGE / etc)

### Phase 0 expected investigation areas (Q1-Qn baseline)

1. **Existing matchmaking service inventory:**
   - `MatchmakingStartMsg` / `MatchmakingCancelMsg` / `MatchFoundMsg` — what's already routed (FE webSocketState.js shows these cases exist)
   - `backend/src/services/matchmaking.js` current state — friend-only OR partial queue support
   - `MatchmakingView.vue` (per CLAUDE.md routing) — current state, what mock exists
2. **Queue mechanics:**
   - In-memory Map vs Redis vs DB? (mirror pvpMatchManager pattern likely — in-memory)
   - Single-tier (random) OR multi-tier (random + ranked)?
   - ELO range filter for ranked? Match within ±N ELO points?
3. **ELO formula + integration:**
   - Existing `eloService.js` (used by Captain Agent ranked fights per CLAUDE.md) — reuse for PvP user-level too OR separate?
   - Update on win / loss / draw? K-factor?
   - Where stored — User.rating field? Captain Agent.elo? Both?
4. **Matchmaking UI overlay:**
   - HudFight has matchActive guard — где matchmaking-search UI mounts? FightView entry from /v2/matchmaking? Separate view?
   - "Searching..." indicator + cancel button + ELO display + queue position (if shown)?
5. **Cancellation flow:**
   - User cancels → server cleanup → opponent (if matched in race) handling
6. **Empty queue handling:**
   - Bot opponent fallback OR true "no opponents available" state?
   - Per CLAUDE.md mention of "agent ranked fights" — possibly bot opponents from Captain Agent pool?
7. **Timeout:**
   - User waits N seconds → auto-cancel? Notify "no match found"?
   - Server-side max queue time?
8. **Race conditions:**
   - User cancels while server matching → handle gracefully
   - Opponent disconnects during search → re-queue OR fail?
9. **Carry-overs bundle:**
   - #17 v2 countdown UI parity — bundle if Sub-epic 5 touches /v2/matchmaking → /v2/fight transition?
   - Other polish items remain в Sub-epic 7

### 5 mandatory Phase 0 subsections (per Sub-epic 4a precedent — all validated)

1. **API contract verification** — explicit signatures, getter paths, message types, field names (id vs odId), enum values
2. **Negative-space verification** — what DOESN'T exist that ТЗ might assume (4b precedents: pvp_surrender / fight_state_resume / DisconnectOverlay missing — caught 4 of 5 Sub-epic 5 verify points)
3. **Real CSS class taxonomy dump** — для visual concerns (matchmaking UI new CSS classes likely needed)
4. **UI infrastructure dependencies** — for each handler: button → state field → handler chain (4a Commit 8 split decision precedent — dice UI absent forced 8a/8b split)
5. **Vocabulary alignment audit** — mock taxonomy ↔ BE taxonomy

### 6th Phase 0 subsection candidate (TRACKING — 1st occurrence из 4b C10)

**Semantic invariant + flow direction verification** — beyond API contracts (subsection 1), verify BE conventions about player ordering / role assignment / flow side that FE code derivations depend on. **Sub-epic 5 tracking candidate** — if matchmaking flow surfaces semantic invariant catches (e.g. who's player1 in random match? alphabetical? queue order? FCFS?), this would be 2nd occurrence → promote к 6th mandatory subsection.

### Path candidates (стратегические для design-Claude после Phase 0)

- **Path A — Random queue first** (BE simplest — Map of waiting users, FCFS pairing, no ELO range)
- **Path B — Ranked queue first** (ELO range filter, more complex BE)
- **Path C — Combined** (random + ranked tiers, separate queues, FE tab switcher)
- **Path D — Random + bot fallback** (random queue, if no opponent in N seconds — bot opponent from agent pool)

### Сложности / риски

- **WS message routing** — FE matchmaking events already routed (line 164-172 webSocketState.js) but may need extension
- **ELO calibration** — User.rating vs Captain.elo authoritative source for PvP user-level matches
- **Match creation handoff** — matchmaking → pvpMatchManager.createMatch — same flow as challenge (Sub-epic 4a precedent for player1=challenger, player2=acceptor — может потребовать adaptation для random match player ordering)
- **Cancel race conditions** — user cancels while server pairs → need handlePvPDisconnect-like cleanup
- **Bot opponent integration (if Path D)** — Captain Agent pool integration, archetype handling, fight result attribution

### Pre-flight Phase 0 expected size

**M-size, single session likely.** Could expand if Path C (combined tiers) chosen — extra BE work for separate queue management.

---

## КЛЮЧЕВЫЕ ПАТТЕРНЫ ЭПИКА 6 (для applying в ТЗ)

### Mode A discipline (фундамент)

- Один commit на step
- Build pass per commit
- Status report после каждого commit
- STOP + wait confirmation между commits (audit-only после Sub-epic 4a Commit 4 onward — user policy adjustment)
- Push после каждого commit
- Pre-edit grep + post-edit grep на КАЖДЫЙ edit (Lesson #11)

### Investigation refines ТЗ inline (verify-gate workflow precedent)

Phase 0 / mini-verification findings refine Phase 1 ТЗ inline, NOT classified as recoveries. Sub-epic 4a established 10-catch ceiling; **Sub-epic 4b reached 38 catches** — 4a 3.8x exceeded. 4b expected fewer due к narrower edge-case scope, но pattern continued. Sub-epic 5 expected:
- Higher catch density due к L size + new architectural area (matchmaking)
- 5 mandatory Phase 0 subsections continue (Lesson #11 reflex universal)
- Adaptation-tier dominates (95%+); STOP-tier rare (4b had 1 в 38)

### Lesson #32 (convention discovery)

Mirror local convention wins over ТЗ literal. 4b precedents (universal в codebase):
- `match` IS engine (no `.engine` property — confirmed 4x в C3/C4/C5/cherry-pick)
- Flat WS spread `{type, ...data}` (NOT nested `{type, data}`)
- `user.odId` param convention (NOT raw `userId`)
- `winner: 'draw'` string convention (NOT null per ТЗ pseudocode)
- Per-player `{odId, finalHp}` shape для disconnect-style emits (vs endFight `{odId, username, finalHp}`)
- Position-based actor classes (`actor-warden`/`actor-predator`)
- Sub-epic 5 likely surfaces matchmaking-specific conventions (queue field shapes, player ordering, ELO storage) — Phase 0 enumeration mandatory

### Lesson #33 (deploy environment awareness — 3rd application)

**Sub-epic 5 will exercise this fully** — BE touches expected (matchmaking service extension + possible ELO updates). Designated branch не auto-deploy. Cherry-pick → `fix/<short-description>` → main → Railway PR flow per branch strategy в CLAUDE.md.

PR #355 (Sub-epic 4b BE) is current example — code-complete + deferred-verify shape. Sub-epic 5 may follow same pattern OR ship BE changes incrementally if scope permits.

### Lesson #34 (HUD overlay convention)

HUD scoped style блок, namespaced classes, pointer-events reset (`.hud-X { pointer-events: none } > * { pointer-events: auto }`). Apply if Sub-epic 5 adds new overlays (matchmaking-search UI / cancel button / opponent-found notification).

### Lesson #35 tier classification

- **Hot-fix** → ломает streak (avoid at all costs)
- **Adaptation-tier** → preserves streak (env config, convention discovery, harness mismatch). 4b had 35 of 38 catches adaptation-tier
- **Reactive-split** → preserves streak (visual verify gate caught bug, fixed within phase). 4b had 0
- **Bug-bundle-tier** → preserves streak (same source file class, single-line adjacent fix). 4b had 0 (но C10 STOP technically same-class but skipped per Lesson #18)
- **STOP-tier** → preserves streak (Lesson #18 framework, surfaces, не fixed). 4b had 1 (C10 carry-over #16 reclassification)

### Lesson #36 (HudProfile card-creep monitor — currently 6/7)

Sub-epic 5 likely doesn't touch HudProfile (matchmaking domain — separate UI surface). Monitor preserved likely.

### Lesson #43 ACTIVE (PROMOTED — 4b)

Bootstrap branch divergence reflex. **Mandatory Phase 0 STEP 0:**

```bash
git fetch
git status -uno
git branch --show-current
git log --oneline -5
```

If divergence detected → STOP, surface findings, ждать user authorization для switch (mirror Recovery #79/#82/#84 precedents). Same SHA = adaptation-tier switch (zero work-loss risk).

### Bug-bundle-tier classification (Lesson #35 framework)

4a precedent: Commit 9 `overdrive_start` case в webSocketState — single-line addition к existing pvp-* case chain. 4b had no such case (Path D scope discipline maintained). Sub-epic 5 may surface adjacent fixes — same source file, same class — acceptable bundle per discipline.

### Closure shape choice

Sub-epic 5 likely **standard linear** (9th application) OR **code-complete + deferred-verify** (4th application) если BE deploy chain timing dictates. Given matchmaking is core game flow, expect functional verify pre-closure preferred — visual + manual matchmaking flow test before final closure.

### Verify-gate workflow precedent

Sub-epic 2/3 precedent (single-digit pre-edit catches) → Sub-epic 4a (10 catches) → **Sub-epic 4b (38 catches)**. Pattern fully validated. Sub-epic 5 expected similar или higher density (L size + new area). Pre-edit reflex remains mandatory.

---

## PHASE 0 ENHANCEMENT CANDIDATES (5 mandatory + 1 candidate)

**5 mandatory Phase 0 subsections** (validated через Sub-epics 4a/4b — surface assumption mismatches pre-edit, save rework):

1. **API contract verification** — explicit signatures, getter paths, mutation parameters, action argument shapes, v1/v2 architecture deltas, constants imports, exact field names (id vs odId), enum values
2. **Negative-space verification** — what DOESN'T exist that ТЗ might assume (4b precedents 100% surfaced via this subsection: pvp_surrender BE missing, fight_state_resume missing, DisconnectOverlay missing, FightCountdown missing, etc.)
3. **Real CSS class taxonomy dump** — don't assume from mock or v1 reference. Dump real names from actual v2 component CSS scoped blocks. 4b precedent: `.surrender-btn` placed at top:90px (mirror `.fight-back`, NOT top:12px per ТЗ pseudo)
4. **UI infrastructure dependencies** — for each handler in scope: confirm full chain exists (button → state field → handler) OR scaffold needed before handler real impl. 4a precedent: dice handlers wired без UI = dead code → forced 8a/8b split
5. **Vocabulary alignment audit** — mock taxonomy ↔ BE taxonomy. 4a precedent: Coach mock 'aggressive/defensive/counter' vs BE 'attack/defense/position' → ACTION_MAP layer

**6th candidate (TRACKING — 1st occurrence 4b C10):**

6. **Semantic invariant + flow direction verification** — verify BE conventions about player ordering / role assignment / flow side that FE code derivations depend on. **Sub-epic 5 candidate for 2nd occurrence** — if matchmaking flow surfaces semantic invariant catches, promote к mandatory.

---

## ACTIVE CARRY-OVERS (26 items entering Sub-epic 5)

**Inherited from prior sub-epics (15 items, untouched в 4b):**

| # | Item | Source | Priority |
|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop, κ Path B | LOW |
| 2 | HudProfile card-creep monitor (6/7) | 5L+ → 5S Q1.3 | MONITOR (likely NOT triggered в 5) |
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

**Sub-epic 4a polish carry-overs (#17-#28 — all decoration/polish/non-functional, 12 items):**

| # | Item | 4b Decision | Sub-epic 5 Bundle Candidate? |
|---|---|---|---|
| 17 | v2 countdown UI parity gap (3-2-1 pre-fight) | deferred | **CANDIDATE** if Sub-epic 5 touches /v2/matchmaking → /v2/fight transition |
| 18 | Dodge/crit overlay title mechanism gap | deferred | NO — Sub-epic 7 |
| 19 | Shake animation gap | deferred | NO — Sub-epic 7 |
| 20 | Cumulative damage stats absent | deferred | NO — Sub-epic 7 |
| 21 | Log actor colors hardcoded | existing constraint | NO — Sub-epic 7 |
| 22 | v2 coach active boost UI | deferred | NO — Sub-epic 7 |
| 23 | v2 single coach overlay | deferred | NO — Sub-epic 7 |
| 24 | Per-type flash color mapping | deferred | NO — Sub-epic 7 |
| 25 | Dice icon assets | deferred | NO — Sub-epic 7 |
| 26 | Modifiers bar UI | deferred | NO — Sub-epic 7 |
| 27 | Dice cooldown countdown display | deferred | NO — Sub-epic 7 |
| 28 | XP earned display absent | deferred | NO — Sub-epic 7 |

**Closed in Sub-epic 4b (referenced для historical clarity):**
- #16 RECLASSIFIED (C10 STOP) — `isPlayer1: false` hardcode in ChallengeNotification.vue:62 verified semantically correct per BE invariant. **Future Claude warning:** do NOT "fix" к computed expression — would invert correct value.

**Sub-epic 5 expected carry-over additions:** medium (matchmaking is new architectural area — likely 2-5 polish/edge case items surface during Phase 0 + execution).

---

## 🚨 IMPORTANT FORWARD NOTE — PRE-CUTOVER ACCEPTANCE GATE (Sub-epic 8)

**User direction (recorded в Sub-epic 3, reinforced 4a/4b):** Full /v2 visual + functional sweep across все routes — comprehensive acceptance gate before Sub-epic 8 cutover.

**Coverage required (consolidated through 4b):**
- /v2/profile (own + guest variants)
- /v2/wallet (Sub-epic 3)
- /v2/account (Sub-epic 3)
- /v2/ratings (Sub-epic 2 Path D — 4 tabs real data)
- /v2/clan + /v2/clan/:id (5D + Sub-epic 1)
- /v2/user/:login (6B-3 guest)
- **/v2/fight (Sub-epic 4a happy path + 4b edge cases ✅ FUNCTIONAL)** — surrender / reconnect / timeout / connection-lost banner all covered
- **/v2/matchmaking (Sub-epic 5 real backend)** — current scope
- /v2/spectate/:fightId (Sub-epic 6 real spectate)
- /v2/training (existing)
- /v2/help (6B-1)
- /v2 (hub)
- All carry-overs #17-#28 polish review (Sub-epic 7 batch)
- v2 cutover auth posture audit (carry-over #10)

**Action item для Sub-epic 8 design-Claude:** Comprehensive checklist build (mirror Sub-epic 2/3/4a/4b visual verify gates pattern but covering ENTIRE /v2 surface). User-driven manual ratification before proceeding с cutover redirects.

---

## SUGGESTED STARTING POINT — FRESH SESSION

### Bootstrap message для нового чата (design-Claude)

```
Привет!

Перед началом любой работы — три обязательных шага:
1. Прочитать CLAUDE.md (source of truth по проекту, приложен).
2. Прочитать handoff HANDOFF_EPIC6_SUBEPIC_5_CHAT_HANDOFF.md
   (приложено).
3. (Optional) Прочитать EPIC6_SUBEPIC_4B_FINAL_REPORT.md
   для historical context — 38 catches и Lesson #43 promotion.

[Стандартные правила Workflow / Mode A / агенты — как всегда]

Контекст: Sub-epic 4b (PvP edge cases + safety) только
что закрыт clean. Streak 28, прогресс 11/14 (78%). Recoveries
84+ (1 added в 4b — bootstrap branch divergence adaptation-tier).
Lessons promoted 36 (Lesson #43 PROMOTED).

Начинаем Sub-epic 5 — Real matchmaking (L size, ~15-20 commits).
Phase 0 investigation первый шаг — Q1-Qn outline в handoff'е +
4 path candidates A/B/C/D.

В Phase 0 ТЗ обязательны 5 enhancement subsections:
1. API contract verification
2. Negative-space verification
3. Real CSS class taxonomy dump
4. UI infrastructure dependencies
5. Vocabulary alignment audit

6th candidate tracking (1st occurrence 4b C10):
6. Semantic invariant + flow direction verification

Branch: claude/investigate-retirement-animation-zQeg4 (continue
stack, НЕ создавай новую).

Lesson #43 ACTIVE — Phase 0 STEP 0 mandatory:
git fetch && git status -uno && git branch --show-current && git log --oneline -5

Lesson #33 — Sub-epic 5 expected к touch BE (matchmaking service
extension + possibly ELO updates). Cherry-pick → main → Railway
PR flow per branch strategy.

Подтверди что понял правила.
```

### First task для свежей design-Claude

1. Read CLAUDE.md + this handoff (+ optional Sub-epic 4b final report)
2. Compose Phase 0 investigation request к Claude Code (Q1-Qn outlined above + 5 mandatory enhancement subsections + 6th candidate tracking)
3. Wait Claude Code Phase 0 report
4. Take Path decision (A/B/C/D) или escalate user (likely needs user choice given Path A vs C scope variance)
5. Compose Phase 1 ТЗ для Sub-epic 5

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
- **"У меня локально работает" — не доказательство.** Visual verify gate strict (Sub-epic 5 acceptance gate before Sub-epic 8 cutover gate).
- **Расхождение с CLAUDE.md** — фиксировать, не молча править.
- **Surface conditions strict** — Pre-edit verify gates triggered → STOP, не fix-forward.
- **Streak 28 preservation** через Lesson #35 tiering — adaptation-tier OK, hot-fix avoid.
- **Backend changes deploy environment awareness** — Sub-epic 5 expected к touch BE substantially. Lesson #33 — backend changes от designated branch НЕ auto-deploy. Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md.
- **Pre-cutover acceptance gate** — forward-record для Sub-epic 8 (full /v2 sweep before cutover, user-direction).
- **5 Phase 0 enhancement subsections mandatory** — derived from 38 Lesson #11 catches в 4b, surface assumption mismatches pre-edit, save rework.
- **6th Phase 0 subsection candidate tracking** — semantic invariant + flow direction (4b C10 1st occurrence). If 2nd occurrence в Sub-epic 5 → promote.
- **Lesson #43 ACTIVE** — bootstrap branch divergence reflex. Phase 0 STEP 0 mandatory git verify before any actions.
- **Carry-over #16 future-Claude warning** — `isPlayer1: false` hardcode в ChallengeNotification.vue:62 IS semantically correct (acceptor=player2 per BE invariant). Do NOT "fix" к computed expression — would invert correct value. Reclassified в 4b C10 STOP.

---

## END HANDOFF

Streak 28. Эпик 6: 11/14 (78%). Sub-epic 4b closed clean. Sub-epic 5 starting — Real matchmaking (L size).

Готов к Phase 0 investigation kick-off в свежей session.
