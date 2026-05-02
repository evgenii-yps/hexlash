# HANDOFF — Hexlash Visual Migration — Эпик 6 — Sub-epic 3 starting

**Date:** 2026-05-03
**Reason for handoff:** Sub-epic 2 closed clean. Fresh design-Claude session starting Sub-epic 3 (Profile sub-routes deep links).

---

## ROLE — design-Claude

Ты — design-Claude в Hexlash visual migration project. User не-технический, работает с Claude Code в IDE на отдельной branch. **Ты пишешь ТЗ** для Claude Code, Claude Code исполняет на branch.

User общается на русском, нужны простые объяснения. User часто отвечает короткими сообщениями ("a", "b", "c", "ok", "пиши", "go"). User выбирает буквы из вариантов. Не задавай слишком много вопросов сразу — был случай "пошёл нахуй" на excessive details. Бери решения сам где можешь, спрашивай только critical decisions.

**Project files в /mnt/project/** — там лежат CLAUDE.md и handoff файлы.
**ТЗ files** сохраняются в /mnt/user-data/outputs/ для удобства copy-paste user'ом.

---

## CURRENT STATE

- **Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack — НЕ создавать новую)
- **HEAD entering Sub-epic 3:** последний commit Sub-epic 2 closure (Commit 15 этот handoff). Sub-epic 2 commit chain: `4546b8e` → `21c36ea` → `9d80ce8` (Commit 13 docs) → `06d11a0` (Commit 14 final report) → этот commit.
- **Streak:** **25** ✅ (clean через 8 sub-epics в Эпике 6)
- **Эпик 6 progress:** **8/14 (57%)** — past half-way mark
- **Recoveries cumulative:** **83+** (3 added в Sub-epic 2: #81/#82/#83 all adaptation-tier)
- **Closure shapes established (4):** standard linear (5 applications) / deprecation-via-redirect / code-complete + deferred-verify / scope-deferral-к-downstream

---

## ЧТО ЗАКРЫТО В ЭПИКЕ 6 (8 sub-epics)

1. **6A** — Лёгкий cutover (4 routes redirect)
2. **6B-1** — `/help` страница (HelpView Pattern B)
3. **6B-2** — `/profile/skins` deprecation-via-redirect
4. **6B-3a-backend** — Privacy fix (`formatUserPublicResponse`, code-complete + deferred-verify)
5. **6B-3** — `/v2/user/:login` Guest Profile (reactive split 7a/7b)
6. **6B-3b** — Friends entry point wiring (scope-deferral pattern)
7. **Sub-epic 1 (was 6B-4)** — `/v2/clan/:id` Guest Clan View
8. **Sub-epic 2 (was 6B-5)** — Ratings reconciliation Path D (4 tabs real data) ← **только что закрыт**

---

## ЧТО ОСТАЛОСЬ (6 sub-epics + carry-over candidates)

- **Sub-epic 3 (was 6B-6)** — Profile sub-routes deep links (S-M, ~6-8 commits) ← **СЕЙЧАС**
- **Sub-epic 4 (was 6B-7)** — PvP в v2 + real backend WS (L, может разбиться)
- **Sub-epic 5 (was 6B-8)** — Real matchmaking (L)
- **Sub-epic 6 (was 6B-9)** — Real spectate (M-L)
- **Sub-epic 7 (was 6B-10)** — Auth + Wallet visual redesign (L)
- **Sub-epic 8 (was 6C)** — Final cutover (M)

**Carry-over candidates** (могут стать sub-epics или закрываться внутри будущих):
- Clan data integration audit (M-L, surfaced from Sub-epic 1)
- v2 cutover auth posture audit (Sub-epic 8 territory)

---

## SUB-EPIC 3 — SCOPE OUTLINE

### Что это

**Profile sub-routes deep links.** Per CLAUDE.md route table, v1 Profile имеет sub-routes:
- `/profile/balance` (own balance view)
- `/profile/wallet` (wallet management)
- `/profile/account` (account settings)

V2 ProfileView (5B + 6B-3 era) handles top-level `/v2/user/:login` (own + guest) but sub-routes для own profile (balance/wallet/account) **не ported в v2**.

Sub-epic 3 closes 5th coverage gap (own-profile sub-routes deep links → v2 paths or unified own-profile view).

### Phase 0 expected investigation areas

**Q1-Q10 baseline для Phase 0 (нужно verify в свежей session):**

1. **Что именно есть в v1 sub-routes** — `/profile/balance` / `/profile/wallet` / `/profile/account` files / sub-views / deep-link entry points (URL-direct, navigation links, button clicks)?
2. **Backend dependencies** — какие endpoints используют эти views? (`/v1/balance/...` / `/v1/wallet/...` / `/v1/account/...`)
3. **V2 ProfileView state** — что уже есть в `/v2/user/:login` для own user? Tabs? Sections? Or только public profile fields?
4. **Mental model выбор** — port sub-routes как `/v2/user/:login/balance` / `/v2/user/:login/wallet` / `/v2/user/:login/account`? Или unified single-page own-profile с tabs/sections (one URL, internal tabs)?
5. **Auth requirements** — sub-routes только для own user (auth required, login match). Guests НЕ должны видеть.
6. **Wallet integration** — Web3/wagmi specific? Touches contractService? Может быть L-size если deeply integrated.
7. **Existing v2 sub-routes pattern** — есть ли precedent в v2 для deep links к own-only routes? (5B Profile only had top-level ProfileView per CLAUDE.md.)
8. **Click entry points** — где в текущем v2 UI есть buttons / links к balance/wallet/account?
9. **Backend redirect needs** — Sub-epic 1 had redirects for old top-level routes. Need ли redirects for `/profile/*` → `/v2/...`?
10. **Locale dependencies** — какие i18n keys нужны для sub-routes labels?

### Path candidates (стратегические для design-Claude после Phase 0)

- **Path A — Per-sub-route v2 ports** — `/v2/user/:login/balance` etc. Maintains v1 mental model, more URLs.
- **Path B — Unified own-profile с internal tabs** — single `/v2/profile` (own only) с balance/wallet/account tabs (similar к Sub-epic 2 4-tab pattern). One URL, cleaner.
- **Path C — Mix** — keep public `/v2/user/:login` для guest+own basic, add `/v2/profile/balance` etc. для own-private deep links.
- **Path D — Sub-routes via /v2/user/:login redirect logic** — `/profile/balance` → `/v2/user/:ownLogin/balance` if logged in. Inherits Sub-epic 2 click wiring patterns.

### Сложности / риски (рaнее)

- **Wallet sub-route** может быть L-complexity если глубоко завязан на wagmi config + Web3 connectors. Possible split в свой sub-epic.
- **Balance sub-route** может включать transaction history, withdrawals — deep CRUD UI.
- **Auth posture** — own-only routes должны иметь redirect / 403 для guest access. Lesson #34-style HUD overlay convention applicable?

### Pre-flight Phase 0 expected size

S-M если Path B (unified) chosen with simple tab pattern. M-L если Path A с full per-route v2 ports + wallet integration deep.

---

## КЛЮЧЕВЫЕ ПАТТЕРНЫ ЭПИКА 6 (для applying в ТЗ)

### Mode A discipline (фундамент)
- Один commit на step
- Build pass per commit
- Status report после каждого commit
- STOP + wait confirmation между commits
- Push после каждого commit
- Pre-edit grep + post-edit grep на КАЖДЫЙ edit (Lesson #11)

### Investigation refines ТЗ inline (precedent)
Phase 0 / mini-verification findings refine Phase 1 ТЗ inline, не считается pivot. Pre-edit verify gates встроены в первые commits Phase 1.

### Lesson #32 (convention discovery)
Mirror local convention wins over ТЗ literal. Multiple precedents Sub-epic 2 (#81 agent module, div-grid pattern, `master.userData?.clanId` path mirror).

### Lesson #35 tier classification
- **Hot-fix** → ломает streak (avoid at all costs)
- **Adaptation-tier** → preserves streak (env config, convention discovery, harness mismatch)
- **Reactive-split** → preserves streak (visual verify gate caught bug, fixed within phase)

### Lesson #36 (HudProfile card-creep monitor — currently 6/7)
Sub-epic 3 МОЖЕТ trigger monitor если sub-routes integrate в HudProfile. Watch carefully. Если ProfileView + own-profile sub-routes adds 7th card → monitor saturates.

### Closure shape choice
Sub-epic 3 likely **standard linear** (~6-8 commits). Reactive-split fallback если visual verify ловит bugs. Code-complete + deferred-verify если backend changes (avoid если possible).

### F3-style mitigation pattern
For any tab/list-based UI с APPEND mutations — reset → load atomic. Sub-epic 2 established this pattern across clan/user actions.

### Bootstrap branch awareness (Recovery #79 + #82 — 2 occurrences)
Harness может bootstrap fresh-slug branch. Если 3rd occurrence — promote к full lesson. Mitigation: первая команда Claude Code в Phase 1 = `git checkout {target_branch}` explicit before "прочитай CLAUDE.md".

---

## ACTIVE CARRY-OVERS (13 items entering Sub-epic 3)

| # | Item | Source | Priority |
|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop | LOW |
| 2 | HudProfile card-creep monitor (6/7) | 5L+ → 5S Q1.3 | **MONITOR** в Sub-epic 3 |
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

---

## NAMING CONVENTION NOTE (forward)

Sub-epic 1 final report использовал `EPIC6B4_FINAL_REPORT.md` (transitional). Sub-epic 2 начал new convention: `EPIC6_SUBEPIC_2_FINAL_REPORT.md`. **Sub-epic 3 final report should follow:** `EPIC6_SUBEPIC_3_FINAL_REPORT.md`. Same для handoff: `HANDOFF_EPIC6_SUBEPIC_4_CHAT_HANDOFF.md`.

---

## SUGGESTED STARTING POINT — FRESH SESSION

### Bootstrap message для нового чата (design-Claude)

```
Привет!

Перед началом любой работы — два обязательных шага:
1. Прочитать CLAUDE.md (source of truth по проекту, приложен).
2. Прочитать handoff HANDOFF_EPIC6_SUBEPIC_3_CHAT_HANDOFF.md
   (приложено).

[Стандартные правила Workflow / Mode A / агенты — как всегда]

Контекст: Sub-epic 2 (Ratings reconciliation) только что закрыт
clean. Streak 25, прогресс 8/14 (57%). Recoveries 83+.

Начинаем Sub-epic 3 — Profile sub-routes deep links (S-M size,
~6-8 commits estimated). Phase 0 investigation первый шаг —
4 path candidates outlined в handoff (A/B/C/D).

Branch: claude/investigate-retirement-animation-zQeg4 (continue
stack, НЕ создавай новую).

Подтверди что понял правила.
```

### First task для свежей design-Claude

1. Read CLAUDE.md + this handoff
2. Compose Phase 0 investigation request к Claude Code (Q1-Q10 outlined above)
3. Wait Claude Code Phase 0 report
4. Take Path decision (A/B/C/D) или ask user
5. Compose Phase 1 ТЗ для Sub-epic 3

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

---

## END HANDOFF

Streak 25. Эпик 6: 8/14 (57%). Sub-epic 2 closed. Sub-epic 3 starting — Profile sub-routes deep links.

Готов к Phase 0 investigation kick-off в свежей session.
