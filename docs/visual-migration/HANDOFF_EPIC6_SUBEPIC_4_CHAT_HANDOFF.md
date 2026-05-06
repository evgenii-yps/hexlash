# HANDOFF — Hexlash Visual Migration — Эпик 6 — Sub-epic 4 starting

**Date:** 2026-05-03
**Reason for handoff:** Sub-epic 3 closed clean. Fresh design-Claude session starting Sub-epic 4 (PvP в v2 + real backend WS — L size, may split).

---

## ROLE — design-Claude

Ты — design-Claude в Hexlash visual migration project. User не-технический, работает с Claude Code в IDE на отдельной branch. **Ты пишешь ТЗ** для Claude Code, Claude Code исполняет на branch.

User общается на русском, нужны простые объяснения. User часто отвечает короткими сообщениями ("a", "b", "c", "ok", "пиши", "go"). User выбирает буквы из вариантов. Не задавай слишком много вопросов сразу — был случай "пошёл нахуй" на excessive details. Бери решения сам где можешь, спрашивай только critical decisions.

**Project files в /mnt/project/** — там лежат CLAUDE.md и handoff файлы.
**ТЗ files** сохраняются в /mnt/user-data/outputs/ для удобства copy-paste user'ом.

**Naming convention forward:** `EPIC6_SUBEPIC_<N>_*` для всех future closure docs (established в Sub-epic 2, applied в Sub-epic 3).

---

## CURRENT STATE

- **Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack — НЕ создавать новую)
- **HEAD entering Sub-epic 4:** последний commit Sub-epic 3 closure (Commit 12 Sub-epic 4 handoff). Sub-epic 3 commit chain: `8e3d8ce` → `5353e42` (Commit 8 functional) → 10/11/12 closure.
- **Streak:** **26** ✅ (clean через 9 sub-epics в Эпике 6)
- **Эпик 6 progress:** **9/14 (64%)** — past two-thirds milestone
- **Recoveries cumulative:** **83+** (0 added в Sub-epic 3 — verify-gate workflow design preserved streak без recovery events)
- **Closure shapes established (4):** standard linear (6 applications) / deprecation-via-redirect / code-complete + deferred-verify / scope-deferral-к-downstream

---

## ЧТО ЗАКРЫТО В ЭПИКЕ 6 (9 sub-epics)

1. **6A** — Лёгкий cutover (4 routes redirect)
2. **6B-1** — `/help` страница (HelpView Pattern B)
3. **6B-2** — `/profile/skins` deprecation-via-redirect
4. **6B-3a-backend** — Privacy fix (`formatUserPublicResponse`, code-complete + deferred-verify)
5. **6B-3** — `/v2/user/:login` Guest Profile (reactive split 7a/7b)
6. **6B-3b** — Friends entry point wiring (scope-deferral pattern)
7. **Sub-epic 1 (was 6B-4)** — `/v2/clan/:id` Guest Clan View
8. **Sub-epic 2 (was 6B-5)** — Ratings reconciliation Path D (4 tabs real data)
9. **Sub-epic 3 (was 6B-6)** — Profile sub-routes deep links Path A (/v2/wallet + /v2/account + 3 redirects) ← **только что закрыт**

---

## ЧТО ОСТАЛОСЬ (5 sub-epics)

- **Sub-epic 4 (was 6B-7)** — PvP в v2 + real backend WS (L, может разбиться на 4a/4b) ← **СЕЙЧАС**
- **Sub-epic 5 (was 6B-8)** — Real matchmaking (L)
- **Sub-epic 6 (was 6B-9)** — Real spectate (M-L)
- **Sub-epic 7 (was 6B-10)** — Auth + Wallet visual redesign (L)
- **Sub-epic 8 (was 6C)** — Final cutover (M)

---

## SUB-EPIC 4 — SCOPE OUTLINE

### Что это

**PvP в v2 + real backend WS integration.** На текущий момент v2 PvP scenes (CardFightView, MatchmakingView, etc) могут работать на mock data или partially-wired WS. Sub-epic 4 cleanup'ит это: реальный WS backend + v2 PvP flow end-to-end.

**Высокая сложность.** Possible split:
- **Sub-epic 4a** — WS backend wiring + real PvP match handling
- **Sub-epic 4b** — Visual integration в v2 PvP screens (CardFightView, MatchmakingView, finalists)

### Phase 0 expected investigation areas

**Q1-Q12 baseline для Phase 0:**

1. **Что именно есть в v1 PvP** — files / WS handlers / Vuex modules / scenes
2. **V2 PvP state** — что уже в v2 (CardFightView, MatchmakingView, FighterDetailView)
3. **Backend WS handlers** — `backend/src/websocket/pvpHandler.js` + `services/pvpMatchManager.js` + `services/pvpCombatEngine.js`. Что покрывает, что mock?
4. **Frontend WS integration** — `src/core/websocket/` client + Vuex `websocket/*` actions/mutations
5. **Mock data sources** — какие PvP screens используют mock?
6. **Match lifecycle** — match started / round / move / finished — все этапы wire'нуты?
7. **Spectate integration** — relationship to Sub-epic 6 (Real spectate) — overlap?
8. **Matchmaking integration** — relationship to Sub-epic 5 (Real matchmaking) — overlap?
9. **Visual states** — loading / waiting opponent / round transition / finalists / error
10. **Edge cases** — disconnect / reconnect / opponent surrender / timeout
11. **Performance** — WS message frequency, animation frame cost, mobile device
12. **Auth posture** — PvP requires auth, how guarded?

### Path candidates (стратегические для design-Claude после Phase 0)

- **Path A — Sequential WS-first then visual** — 4a wires backend WS end-to-end with real match → 4b refactors visual to consume real data. Clean separation but visual может не тестировать без WS.
- **Path B — Visual-first then WS** — 4a refactors v2 PvP к expected real-data shape (still mock) → 4b wires WS to feed it. Visual tests in isolation, but rework risk if backend shape differs.
- **Path C — Combined slim split** — 4a covers happy path (start → finish) end-to-end + 4b covers edge cases (disconnect/reconnect/timeout). Both have visual + backend together.
- **Path D — Single L sub-epic** — no split, one big sub-epic ~20 commits. Risky for streak.

### Сложности / риски

- **WS state synchronization** — frontend Vuex vs backend match state. Reactive update flow.
- **Animation framerate** — 60fps vs WS message frequency. Throttle / debounce / interpolate.
- **Disconnect/reconnect** — backend `pvpMatchManager.js` reconnect logic. Frontend resume state.
- **Spectate overlap (Sub-epic 6)** — spectator joins live match. Architecture decision: spectate as separate flow OR PvP+spectate unified WS message types?
- **Matchmaking overlap (Sub-epic 5)** — match start trigger. Architecture decision: matchmaking-found event creates match OR separate "create match" backend flow?

### Pre-flight Phase 0 expected size

Likely **L-size, multi-session.** Split scenario probable. Anchor с full investigation Phase 0 first to scope properly.

---

## КЛЮЧЕВЫЕ ПАТТЕРНЫ ЭПИКА 6 (для applying в ТЗ)

### Mode A discipline (фундамент)
- Один commit на step
- Build pass per commit
- Status report после каждого commit
- STOP + wait confirmation между commits
- Push после каждого commit
- Pre-edit grep + post-edit grep на КАЖДЫЙ edit (Lesson #11)

### Investigation refines ТЗ inline (precedent — verify-gate workflow)
Phase 0 / mini-verification findings refine Phase 1 ТЗ inline, NOT classified as recoveries (Sub-epic 3 precedent demonstrated 0 recoveries despite 8 verify-gate adjustments). Pre-edit verify gates встроены в первые commits Phase 1.

### Lesson #32 (convention discovery)
Mirror local convention wins over ТЗ literal. Multiple precedents.

### Lesson #34 (HUD overlay convention)
HUD scoped style блок, namespaced classes, pointer-events reset (`.hud-X { pointer-events: none } > * { pointer-events: auto }`).

### Lesson #35 tier classification
- **Hot-fix** → ломает streak (avoid at all costs)
- **Adaptation-tier** → preserves streak (env config, convention discovery, harness mismatch)
- **Reactive-split** → preserves streak (visual verify gate caught bug, fixed within phase)

### Lesson #36 (HudProfile card-creep monitor — currently 6/7)
Sub-epic 4 likely doesn't touch HudProfile (PvP scene domain). Monitor preserved likely.

### Closure shape choice
Sub-epic 4 likely **standard linear с possible split** (~10-15 commits если 4a, ~10-15 4b). Reactive-split fallback если visual verify ловит bugs. Code-complete + deferred-verify если backend changes (Lesson #33 deploy environment awareness — backend touches require Railway PR flow).

### Bootstrap branch awareness (Recovery #79 + #82 — 2 occurrences)
Если 3rd occurrence — promote к full lesson. Mitigation в Phase 1 Commit 0: `git status && git branch --show-current` verify ПЕРЕД любыми edits.

---

## ACTIVE CARRY-OVERS (15 items entering Sub-epic 4)

| # | Item | Source | Priority |
|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop | LOW |
| 2 | HudProfile card-creep monitor (6/7) | 5L+ → 5S Q1.3 | MONITOR (likely NOT triggered) |
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
| **14** | **Switcher3DPunch SKIP** (Sub-epic 3 NEW) | Q-tactical-1 Sub-epic 3 | **Polish round / Sub-epic 7 absorb** |
| **15** | **Account/Wallet Vuetify → v2 design system port** (Sub-epic 3 NEW) | Q-tactical-Phase1-3/5 Sub-epic 3 | **Polish round / Sub-epic 7 absorb** |

---

## 🚨 IMPORTANT FORWARD NOTE — PRE-CUTOVER ACCEPTANCE GATE (Sub-epic 8)

**User direction (recorded в Sub-epic 3):** When approaching final migration cutover, user wants a **full /v2 visual + functional sweep** across все routes — comprehensive acceptance gate before Sub-epic 8 cutover.

**Coverage required (planned Sub-epic 8 acceptance gate):**
- /v2/profile (own + guest variants)
- /v2/wallet (Sub-epic 3)
- /v2/account (Sub-epic 3)
- /v2/ratings (Sub-epic 2 Path D — 4 tabs real data)
- /v2/clan + /v2/clan/:id (5D + Sub-epic 1)
- /v2/user/:login (6B-3 guest)
- /v2/fight + /v2/fd/:id (Epic 4 V2FighterDetail)
- /v2/training (existing)
- /v2/matchmaking (Sub-epic 5)
- /v2/spectate (Sub-epic 6)
- /v2/help (6B-1)
- /v2 (hub)

**Action item для Sub-epic 8 design-Claude:** Build comprehensive checklist (mirror Sub-epic 2/3 visual verify gates pattern but covering ENTIRE /v2 surface). User-driven manual ratification before proceeding с cutover redirects.

---

## SUGGESTED STARTING POINT — FRESH SESSION

### Bootstrap message для нового чата (design-Claude)

```
Привет!

Перед началом любой работы — два обязательных шага:
1. Прочитать CLAUDE.md (source of truth по проекту, приложен).
2. Прочитать handoff HANDOFF_EPIC6_SUBEPIC_4_CHAT_HANDOFF.md
   (приложено).

[Стандартные правила Workflow / Mode A / агенты — как всегда]

Контекст: Sub-epic 3 (Profile sub-routes deep links) только
что закрыт clean. Streak 26, прогресс 9/14 (64%). Recoveries
83+ (0 added in Sub-epic 3 — verify-gate workflow design
preserved streak без recovery events).

Начинаем Sub-epic 4 — PvP в v2 + real backend WS (L size,
may split into 4a/4b). Phase 0 investigation первый шаг —
12 questions outlined в handoff'е + 4 path candidates A/B/C/D.

Branch: claude/investigate-retirement-animation-zQeg4 (continue
stack, НЕ создавай новую).

Подтверди что понял правила.
```

### First task для свежей design-Claude

1. Read CLAUDE.md + this handoff
2. Compose Phase 0 investigation request к Claude Code (Q1-Q12 outlined above)
3. Wait Claude Code Phase 0 report
4. Take Path decision (A/B/C/D) или escalate user (likely needs user choice given L scope)
5. Compose Phase 1 ТЗ для Sub-epic 4 (или 4a if split chosen)

---

## TONE / COMMUNICATION STYLE

- Russian language
- Short, structured responses (без воды)
- One question at a time when possible (max 3)
- Take decisions yourself when reasonable, ask only critical
- Don't apologize excessively
- "По-простому" explanations для technical concepts
- File-based ТЗ (save в /mnt/user-data/outputs/) для copy-paste convenience
- Mode A discipline + STOP-and-confirm pattern
- Honest reporting — fix-forward forbidden, разногласия фиксируются
- При truncation в Claude Code messages — generate separate file в outputs, прикладывать как attachment вместо inline templates

---

## CRITICAL REMINDERS

- **Не выходи за рамки ТЗ.** Расхождения — в отчёт, не молча чинить.
- **Не доверяй памяти про факты проекта** — проверяй через CLAUDE.md и/или код.
- **"У меня локально работает" — не доказательство.** Visual verify gate strict.
- **Расхождение с CLAUDE.md** — фиксировать, не молча править.
- **Surface conditions strict** — Pre-edit verify gates triggered → STOP, не fix-forward.
- **Streak preservation** через Lesson #35 tiering — adaptation-tier OK, hot-fix avoid.
- **Backend changes deploy environment awareness** — Sub-epic 4 likely touches backend (WS handlers). Lesson #33 — backend changes от designated branch НЕ auto-deploy. Cherry-pick → main → Railway PR flow.
- **Pre-cutover acceptance gate** — forward-record для Sub-epic 8 (full /v2 sweep before cutover, user-direction).

---

## END HANDOFF

Streak 26. Эпик 6: 9/14 (64%). Sub-epic 3 closed clean. Sub-epic 4 starting — PvP в v2 + real backend WS (L size, may split).

Готов к Phase 0 investigation kick-off в свежей session.
