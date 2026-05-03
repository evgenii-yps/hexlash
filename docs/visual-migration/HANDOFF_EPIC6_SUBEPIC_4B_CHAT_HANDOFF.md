# HANDOFF — Hexlash Visual Migration — Эпик 6 — Sub-epic 4b starting

**Date:** 2026-05-04
**Reason for handoff:** Sub-epic 4a closed clean (PvP в v2 + real backend WS — happy path end-to-end). Fresh design-Claude session starting Sub-epic 4b (PvP edge cases + safety + BE deploy chain — M size).

---

## ROLE — design-Claude

Ты — design-Claude в Hexlash visual migration project. User не-технический, работает с Claude Code в IDE на отдельной branch. **Ты пишешь ТЗ** для Claude Code, Claude Code исполняет на branch.

User общается на русском, нужны простые объяснения. User часто отвечает короткими сообщениями ("a", "b", "c", "ok", "пиши", "go"). User выбирает буквы из вариантов. Не задавай слишком много вопросов сразу. Бери решения сам где можешь, спрашивай только critical decisions.

**Project files в /mnt/project/** — там лежат CLAUDE.md и handoff файлы.
**ТЗ files** сохраняются в /mnt/user-data/outputs/ для удобства copy-paste user'ом.

**Naming convention:** `EPIC6_SUBEPIC_<N>_*` для всех closure docs (established Sub-epic 2, applied through 4a).

---

## CURRENT STATE

- **Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack — НЕ создавать новую)
- **HEAD entering Sub-epic 4b:** `c24c9bc` (Sub-epic 4a final report) → after Commit 13 push, HEAD будет 13's SHA. Sub-epic 4a commit chain: `9e3307b` (housekeeping) → `9b2705a` (Commit 9 final functional) → 11/12/13 closure.
- **Streak:** **27** ✅ (clean через 10 sub-epics в Эпике 6)
- **Эпик 6 progress:** **10/14 (71%)** — past two-thirds + into third-quarter zone
- **Recoveries cumulative:** **83+ stable** (0 added в 4a — verify-gate workflow design preserved streak без recovery events; 4a ran 10 Lesson #11 catches all pre-edit, all adapted in scope)
- **Closure shapes established (4):** standard linear (7 applications) / deprecation-via-redirect / code-complete + deferred-verify / scope-deferral-к-downstream

---

## ЧТО ЗАКРЫТО В ЭПИКЕ 6 (10 sub-epics)

1. **6A** — Лёгкий cutover (4 routes redirect)
2. **6B-1** — `/help` страница (HelpView Pattern B)
3. **6B-2** — `/profile/skins` deprecation-via-redirect
4. **6B-3a-backend** — Privacy fix (`formatUserPublicResponse`, code-complete + deferred-verify)
5. **6B-3** — `/v2/user/:login` Guest Profile (reactive split 7a/7b)
6. **6B-3b** — Friends entry point wiring (scope-deferral pattern)
7. **Sub-epic 1 (was 6B-4)** — `/v2/clan/:id` Guest Clan View
8. **Sub-epic 2 (was 6B-5)** — Ratings reconciliation Path D (4 tabs real data)
9. **Sub-epic 3 (was 6B-6)** — Profile sub-routes deep links Path A (/v2/wallet + /v2/account)
10. **Sub-epic 4a (was 6B-7 partial)** — PvP в v2 happy path end-to-end ← **только что закрыт**

---

## ЧТО ОСТАЛОСЬ (5 sub-epics)

- **Sub-epic 4b** — PvP edge cases + safety + BE deploy chain (M, ~10-15 commits) ← **СЕЙЧАС**
- **Sub-epic 5** — Real matchmaking (L)
- **Sub-epic 6** — Real spectate (M-L)
- **Sub-epic 7** — Auth + Wallet visual redesign (L)
- **Sub-epic 8** — Final cutover (M)

---

## SUB-EPIC 4B — SCOPE OUTLINE

### Что это

**PvP edge cases + safety для v2 PvP.** Дополняет happy path 4a в production-ready PvP flow. Stages 15-18 lifecycle (Phase 0 4a inventory): disconnect / reconnect / surrender / timeout. Plus optional polish carry-overs #17-#28 если bundled.

### Размер

**M (~10-15 commits).** Не split (single sub-epic) — все edge cases coherent scope.

### Backend touches

**ДА — Sub-epic 4b expected к touch BE.** Lesson #33 deploy environment awareness applies: designated branch не auto-deploy. Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md.

Likely backend additions:
- `pvp_surrender` handler (new WS message type)
- `fight_state_resume` BE→FE event для reconnect-replay (decision pending: minimum vs full DB persistence)

### Phase 0 expected investigation areas (Q1-Q10 baseline)

1. **Surrender — current state (BE + FE):**
   - BE: handler missing per Phase 0 4a Q3
   - FE: UI button missing
   - State transition: how match ends? Different from fight_end? Or normal fight_end с reason='surrender'?
   - Carry-over #16 (isPlayer1 hardcoded) — source-fix decision: 4b or polish round?

2. **Reconnect state-replay:**
   - Current rebind <30s works (Phase 0 4a Q10 partial)
   - Missing: round log replay
   - Decision: minimal "fight_state_resume" message (last N round results) OR full DB persistence (matches survive server restart)?

3. **Disconnect mid-fight:**
   - Current: winner notified (Phase 0 4a Q10 partial)
   - Missing: opponent-disconnect UI overlay (Q9 gap)
   - Edge: what if disconnect during coach pause? Dice cooldown?

4. **Connection-lost UI overlay:**
   - Frontend backoff handled, но "Reconnecting..." UI missing
   - Decision: blocking overlay vs subtle banner

5. **Match timeout (wall-clock):**
   - Phase 0 4a Q10: NOT IMPLEMENTED (only round-count limit ~22 min real)
   - BE addition needed if в scope
   - Decision: implement в 4b или accept current behavior?

6. **Round timeout:**
   - BE pacing only (ROUND_ANIMATION_MS=1500ms), no FE countdown UI
   - User awareness gap: "Why did round end?"
   - Decision: add countdown display или skip

7. **Server restart mid-match:**
   - Current: LOST (in-memory Map, no persistence)
   - Decision: out of scope (deferred к infrastructure work) OR minimal recovery (DB persistence prerequisite)?

8. **v2 PvP UI infrastructure gaps inherited from 4a:**
   - Carry-over #17 countdown UI parity (3-2-1 before fight)
   - Carry-over #18 dodge/crit overlay title
   - Carry-over #19 shake animation
   - Carry-overs #20-#28 (cumulative damage / log color taxonomy / coach active bar / overlay structure / flash colors / dice icons / modifiers bar / cooldown countdown / XP display)
   - Decision per item: include в 4b OR defer к polish round / Sub-epic 7

9. **ChallengeNotification carry-over #16 (isPlayer1 source-fix):**
   - Currently dead-write addressed via overwrite cascade (onPvPFightStart Commit 6b correctly derives + commits SET_PVP_MATCH с overwrite)
   - Decision: source-fix в 4b (clean code) OR defer (functionally fine)

10. **BE deploy chain (Lesson #33):**
    - Designated branch не auto-deploy
    - Cherry-pick → main → Railway PR flow
    - Plan: timing within 4b (early для testing infrastructure, OR batch к concluded — depends on number of BE changes)

### Path candidates (стратегические для design-Claude после Phase 0)

- **Path A — Surrender first** (high-value functional gap, BE touches isolated к single new handler)
- **Path B — Reconnect-replay first** (most architecturally complex, BE persistence decision drives scope)
- **Path C — UI overlays first** (frontend-only, defers Lesson #33 BE deploy chain timing)
- **Path D — Combined slim** (surrender minimal + reconnect minimum + critical UI overlays + carry-over polish bundling)

### Сложности / риски

- **WS state synchronization** — frontend Vuex vs backend match state. Reactive update flow during reconnect.
- **BE deploy chain timing** (Lesson #33) — when к merge cherry-pick PR? Affects test cycle.
- **Reconnect persistence architecture decision** — minimum vs full DB. Significant scope variance.
- **4a happy path regression risk** — если 4b changes touch shared code paths (CardFightView v1 OR FightView v2 OR webSocketState OR pvpHandler.js)

### Pre-flight Phase 0 expected size

**M-size, single session likely.** Could expand if reconnect persistence chosen (BE work).

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

Phase 0 / mini-verification findings refine Phase 1 ТЗ inline, NOT classified as recoveries. Sub-epic 4a established new ceiling: **10 catches в single sub-epic**, all pre-edit, all adapted in scope. 4b expected fewer due к narrower edge-case scope, но pattern stable.

### Lesson #32 (convention discovery)

Mirror local convention wins over ТЗ literal. Sub-epic 4a precedents:
- Flat fightState fields (NOT nested objects)
- ACTION_MAP layer для vocabulary translation
- Position-based actor classes (left/right, NOT archetype)
- ResultOverlay reuse (existing component, NO new scaffold)
- Direct mutations vs Vuex commits (cardFightState PvE-only path)
- Mock fallback path preservation (matchActive guard)

### Lesson #33 (deploy environment awareness)

**Sub-epic 4b will exercise this fully** — BE touches expected (surrender handler, possibly fight_state_resume). Designated branch не auto-deploy. Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md.

### Lesson #34 (HUD overlay convention)

HUD scoped style блок, namespaced classes, pointer-events reset (`.hud-X { pointer-events: none } > * { pointer-events: auto }`). Apply if 4b adds new overlays (disconnect / reconnecting / timeout).

### Lesson #35 tier classification

- **Hot-fix** → ломает streak (avoid at all costs)
- **Adaptation-tier** → preserves streak (env config, convention discovery, harness mismatch)
- **Reactive-split** → preserves streak (visual verify gate caught bug, fixed within phase)
- **Bug-bundle-tier** → preserves streak (same source file class, single-line adjacent fix). 4a precedent: overdrive_start WS routing fix bundled с functional Commit 9.

### Lesson #36 (HudProfile card-creep monitor — currently 6/7)

Sub-epic 4b likely doesn't touch HudProfile (PvP scene domain). Monitor preserved likely.

### Lesson #43 candidate (3rd occurrence validated в 4a)

Bootstrap branch divergence pattern caught + mitigated в 5U / Sub-epic 2 / Sub-epic 4a. Mitigation в Phase 1 Commit 0: `git fetch && git status -uno && git branch --show-current` ПЕРЕД любыми edits. Promotion decision pending.

### Bug-bundle-tier classification (Lesson #35 framework)

4a precedent: Commit 9 `overdrive_start` case в webSocketState — single-line addition к existing pvp-* case chain. Same source file, same class (WS message routing), addresses adjacent gap. Acceptable bundle per discipline.

Apply if 4b surfaces similar adjacent fixes (e.g. additional missing case в WS routing, or v1/v2 dual-path bug discovered during edge case investigation).

### Closure shape choice

Sub-epic 4b likely **standard linear** (8th application). **Code-complete + deferred-verify** if BE deploy chain timing dictates (precedent 6B-3a-backend). Sub-epic 4a methodology pattern (10 verify-gate catches) reinforced — 4b expected continues precedent.

### Verify-gate workflow precedent

Sub-epic 2/3 precedent (single-digit pre-edit catches) → Sub-epic 4a (10 catches new ceiling). Pattern fully validated. 4b expected fewer catches (narrower scope) но pre-edit reflex remains mandatory.

---

## PHASE 0 ENHANCEMENT CANDIDATES (5 patterns from 4a)

**Mandatory inclusion в 4b Phase 0 ТЗ** — derived from 10 Lesson #11 catches в Sub-epic 4a:

### 1. API contract verification subsection

Explicit signatures, getter paths, mutation parameters, getter return shapes, action argument shapes, v1/v2 architecture deltas (Vuex vs module-scoped state), constants imports, exact field names (id vs odId precedent), enum values (phase strings 'prep'|'fight'|'result' vs v1 'countdown'|'fighting' precedent).

### 2. Negative-space verification subsection

What DOESN'T exist that ТЗ might assume. 4a precedents:
- `pvp_move` (assumed BE handler, didn't exist — backend auto-cycles deck)
- `master/userData` getter (use `master/getMaster?.userData?.X`)
- `cardFightState/startFight` PvP path (PvE-only)
- `overdrive_start` case в webSocketState (pre-existing dead code)
- Dice infrastructure в v2 (button / state / emit all missing)
- Countdown component в v2 (missing entirely)

For 4b: explicitly verify surrender handler, fight_state_resume message type, disconnect overlay component, timeout countdown component, etc. — all might be assumed but missing.

### 3. Real CSS class taxonomy dump для visual concerns

Don't assume from mock or v1 reference. Dump real names from actual v2 component CSS scoped blocks. 4a precedent: HudFight `actor-warden / actor-predator / crit / miss / round / lt` — ТЗ proposed `opp / you / event-crit / event-dodge` все DON'T EXIST.

For 4b: if adding new overlays, verify CSS class taxonomy upfront. Reuse existing patterns where possible.

### 4. UI infrastructure dependencies subsection

For each handler in scope: confirm full chain exists (button → state field → handler) OR scaffold needed before handler real impl. 4a precedent: dice handlers wired без UI = dead code → forced 8a/8b split.

For 4b: surrender (button needed?) reconnect overlay (component needed?) timeout countdown (component needed?) — check infrastructure pre-edit.

### 5. Vocabulary alignment audit subsection

Mock taxonomy ↔ BE taxonomy. 4a precedents:
- Coach: mock 'aggressive/defensive/counter' vs BE 'attack/defense/position' → ACTION_MAP layer
- Dice: 1-to-1 match (no translation needed)

For 4b: if any new mock-to-BE wiring, audit vocabulary upfront.

---

## ACTIVE CARRY-OVERS (27 items entering Sub-epic 4b)

**Inherited from prior sub-epics (15 items, untouched в 4a):**

| # | Item | Source | Priority |
|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop, κ Path B | LOW |
| 2 | HudProfile card-creep monitor (6/7) | 5L+ → 5S Q1.3 | MONITOR (likely NOT triggered в 4b) |
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

**Sub-epic 4a polish carry-overs (NEW #16-#28 — all decoration/polish/non-functional):**

| # | Item | Source | 4b Decision Candidate |
|---|---|---|---|
| 16 | `isPlayer1: false` hardcoded в ChallengeNotification (dead-write addressed via overwrite cascade) | Commit 5/6b | Source-fix в 4b OR defer |
| 17 | v2 countdown UI parity gap (3-2-1 before fight) | Commit 6b | Bundle в 4b если scope permits |
| 18 | Dodge/crit overlay title mechanism gap | Commit 7 | 4b polish bundle candidate |
| 19 | Shake animation gap | Commit 7 | 4b polish bundle candidate |
| 20 | Cumulative damage stats absent | Commit 7 | Polish round |
| 21 | Log actor colors hardcoded warden/predator (existing v2 design constraint) | Commit 7 | Existing constraint, не regression |
| 22 | v2 coach active boost UI absent | Commit 8a | 4b polish bundle candidate |
| 23 | v2 single overlay vs v1 dual (workaround via reactive text) | Commit 8a | Polish round |
| 24 | Per-type flash color mapping | Commit 8b | Polish round |
| 25 | Dice icon assets | Commit 8b | Polish round |
| 26 | Modifiers bar UI | Commit 8b | Polish round |
| 27 | Dice cooldown countdown display | Commit 8b | Polish round |
| 28 | XP earned display absent в v2 finalists | Commit 9 | Polish round |

**Closed in Sub-epic 4a (referenced для historical clarity):**
- Sub-epic 5B-deferred ChallengeNotification visibility on v2 routes — closed Commit 5a (Option β mount в AppV2.vue)

**Sub-epic 4b expected carry-over additions:** minimal (4b is finalization scope, не expansion).

---

## 🚨 IMPORTANT FORWARD NOTE — PRE-CUTOVER ACCEPTANCE GATE (Sub-epic 8)

**User direction (recorded в Sub-epic 3, reinforced 4a):** Full /v2 visual + functional sweep across все routes — comprehensive acceptance gate before Sub-epic 8 cutover.

**Coverage required (consolidated through 4a):**
- /v2/profile (own + guest variants)
- /v2/wallet (Sub-epic 3)
- /v2/account (Sub-epic 3)
- /v2/ratings (Sub-epic 2 Path D — 4 tabs real data)
- /v2/clan + /v2/clan/:id (5D + Sub-epic 1)
- /v2/user/:login (6B-3 guest)
- /v2/fight (Sub-epic 4a happy path + 4b edge cases)
- /v2/matchmaking (Sub-epic 5 real backend)
- /v2/spectate/:fightId (Sub-epic 6 real spectate)
- /v2/training (existing)
- /v2/help (6B-1)
- /v2 (hub)
- All carry-overs #16-#28 polish review

**Action item для Sub-epic 8 design-Claude:** Comprehensive checklist build (mirror Sub-epic 2/3/4a visual verify gates pattern but covering ENTIRE /v2 surface). User-driven manual ratification before proceeding с cutover redirects.

---

## SUGGESTED STARTING POINT — FRESH SESSION

### Bootstrap message для нового чата (design-Claude)

```
Привет!

Перед началом любой работы — два обязательных шага:
1. Прочитать CLAUDE.md (source of truth по проекту, приложен).
2. Прочитать handoff HANDOFF_EPIC6_SUBEPIC_4B_CHAT_HANDOFF.md
   (приложено).

[Стандартные правила Workflow / Mode A / агенты — как всегда]

Контекст: Sub-epic 4a (PvP в v2 happy path end-to-end) только
что закрыт clean. Streak 27, прогресс 10/14 (71%). Recoveries
83+ stable (0 added в 4a — verify-gate workflow design preserved
streak без recovery events).

Начинаем Sub-epic 4b — PvP edge cases + safety + BE deploy
chain (M size, ~10-15 commits). Phase 0 investigation первый
шаг — 10 questions outlined в handoff'е + 4 path candidates
A/B/C/D.

В Phase 0 ТЗ обязательны 5 enhancement subsections (derived
from 10 Lesson #11 catches в 4a):
1. API contract verification
2. Negative-space verification
3. Real CSS class taxonomy dump
4. UI infrastructure dependencies
5. Vocabulary alignment audit

Branch: claude/investigate-retirement-animation-zQeg4 (continue
stack, НЕ создавай новую).

Lesson #33 — Sub-epic 4b expected к touch BE (surrender handler,
possibly fight_state_resume). Cherry-pick → main → Railway PR
flow per branch strategy.

Подтверди что понял правила.
```

### First task для свежей design-Claude

1. Read CLAUDE.md + this handoff
2. Compose Phase 0 investigation request к Claude Code (Q1-Q10 outlined above + 5 mandatory enhancement subsections)
3. Wait Claude Code Phase 0 report
4. Take Path decision (A/B/C/D) или escalate user (likely needs user choice given BE persistence decision)
5. Compose Phase 1 ТЗ для Sub-epic 4b

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
- **"У меня локально работает" — не доказательство.** Visual verify gate strict (4b acceptance gate в Sub-epic 8).
- **Расхождение с CLAUDE.md** — фиксировать, не молча править.
- **Surface conditions strict** — Pre-edit verify gates triggered → STOP, не fix-forward.
- **Streak 27 preservation** через Lesson #35 tiering — adaptation-tier OK, hot-fix avoid.
- **Backend changes deploy environment awareness** — Sub-epic 4b expected к touch BE (surrender handler + possibly fight_state_resume). Lesson #33 — backend changes от designated branch НЕ auto-deploy. Cherry-pick → main → Railway PR flow per branch strategy в CLAUDE.md.
- **Pre-cutover acceptance gate** — forward-record для Sub-epic 8 (full /v2 sweep before cutover, user-direction).
- **5 Phase 0 enhancement subsections mandatory** — derived from 10 Lesson #11 catches в 4a, surface assumption mismatches pre-edit, save rework.

---

## END HANDOFF

Streak 27. Эпик 6: 10/14 (71%). Sub-epic 4a closed clean. Sub-epic 4b starting — PvP edge cases + safety + BE deploy chain (M size).

Готов к Phase 0 investigation kick-off в свежей session.
