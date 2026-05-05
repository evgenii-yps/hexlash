# HANDOFF — Hexlash Visual Migration — Эпик 7+ Planning

**Date:** 2026-05-05
**Reason for handoff:** Эпик 6 closed clean (visual migration v1 → v2 COMPLETE — 15/15 sub-epics). Fresh design-Claude session starts Эпик 7+ planning.
**Predecessor:** `EPIC_6_FINAL_REPORT.md` (CL3 commit — companion file)
**Next phase:** Эпик 7+ — post-migration features / refactors / deferred carry-overs

---

## ROLE — design-Claude

Ты — design-Claude в Hexlash post-migration project. User не-технический, работает с Claude Code в IDE на отдельной branch. **Ты пишешь ТЗ** для Claude Code, Claude Code исполняет на branch.

User общается на русском, нужны простые объяснения. User часто отвечает короткими сообщениями ("a", "b", "c", "ok", "пиши", "go"). User выбирает буквы из вариантов. **НЕ задавай слишком много вопросов сразу.** Бери решения сам где можешь, спрашивай только critical decisions. Когда user сигналит "не понимаю" / "ты опять забываешь как со мной общаться" — упрощай объяснение, fewer questions, конкретные рекомендации.

**Project files в /mnt/project/** — там лежат CLAUDE.md и handoff файлы.
**ТЗ files** сохраняются в /mnt/user-data/outputs/ для удобства copy-paste user'ом.

**Naming convention:** TBD для Эпик 7+ (`EPIC7_SUBEPIC_<N>_*` likely, mirror Эпик 6 pattern).

---

## CURRENT STATE — Эпик 7+ entry

- **Branch:** `main` (post-merge target — Эпик 6 cutover deployed)
- **Streak:** **32** ✅
- **Эпик 6 progress:** 15/15 (100%) — CLOSED
- **Recoveries cumulative:** 90+
- **Lessons promoted:** 38
- **Lesson candidates active:** 7 (#36-#42)
- **Cherry-pick PRs cumulative:** 5 (#353/#354/#355/#356/#357)
- **Phase 0 mandatory subsections:** 6
- **Closure shapes established:** 5

---

## ЧТО ЗАКРЫТО В ЭПИКЕ 6 (15 sub-epics — full chain summary)

| # | Sub-epic | Streak exit |
|---|---|---|
| 1 | 6A — Лёгкий cutover (4 routes redirect) | 18 |
| 2 | 6B-1 — `/help` page | 19 |
| 3 | 6B-2 — `/profile/skins` deprecation-via-redirect | 20 |
| 4 | 6B-3a-backend — privacy fix | 21 |
| 5 | 6B-3 — `/v2/user/:login` Guest Profile | 22 |
| 6 | 6B-3b — Friends entry point wiring | 23 |
| 7 | Sub-epic 1 — `/v2/clan/:id` Guest Clan View | 24 |
| 8 | Sub-epic 2 — Ratings Path D (4 tabs) | 25 |
| 9 | Sub-epic 3 — Profile sub-routes Path A | 26 |
| 10 | Sub-epic 4a — PvP в v2 happy path | 27 |
| 11 | Sub-epic 4b — PvP edge cases + safety | 28 |
| 12 | Sub-epic 5 — Real matchmaking | 29 |
| 13 | Sub-epic 6 — Real spectate (NEW closure shape) | 30 |
| 14 | Sub-epic 7 — Visual polish + Auth + Wallet redesign | 31 |
| 15 | **Sub-epic 8 — cutover + Эпик 6 closure** | **32** |

---

## ЧТО ОСТАЛОСЬ FORWARD (Эпик 7+ scope)

### Active carry-overs к Эпик 7+ (~30+ items, 6 streams categorized)

#### Stream 1 — Refactor / Cleanup (~10 items)

| # | Item | Source |
|---|---|---|
| #14 | Switcher3DPunch SKIP | Sub-epic 3 |
| #38 | ChallengeNotification routing branch simplification | Sub-epic 8 |
| #39 | App.vue:100 path check redundancy | Sub-epic 8 |
| #40 | App.vue:110 scrollableRoutes /friends literal | Sub-epic 8 |
| #41 | PreparationView.vue:97 router.push('/friends') | Sub-epic 8 |
| #43 | HudSpectate inline fallbacks dead code | Sub-epic 8 |
| #46 | Stale doc comments referencing deleted v1 views | Sub-epic 8 |
| Vuetify removal | PreparationView v1 Vuetify consumer | Sub-epic 8 |
| Locale cleanup | 9 fallback locales English-only per user direction | Sub-epic 5T |
| Asset audit | Unused images/icons | Sub-epic 8 |

#### Stream 2 — Backend Consolidation (~5 items)

| # | Item | Source |
|---|---|---|
| #30 | ELO duplication consolidation (eloService vs inline pvpCombatEngine) | Sub-epic 5 |
| #31 | ErrorMsg BE shape consolidation (5 callsites bypass sendError) | Sub-epic 7 |
| #33 | Captain payload field naming asymmetry | Sub-epic 5 |
| #44 | Engine status enum defensive monitoring | Sub-epic 8 |
| #45 | findCurrentFight O(N×M) optimization | Sub-epic 8 |

#### Stream 3 — Feature Work (~7 items)

| # | Item | Source |
|---|---|---|
| #6 | 3D models + devices system | early Эпик 6 |
| #2 | Achievement badge для retirement | Sub-epic 5 (Эпик 5 carry-forward) |
| #28 | XP earned display absent в v2 finalists | Sub-epic 4a |
| #20 | Cumulative damage stats | Sub-epic 4a |
| #22 | v2 coach active boost UI | Sub-epic 4a |
| #29 | Filter chips BE extension (matchmaking) | Sub-epic 5 |
| Friends FriendsView v2 port | TBD | Sub-epic 8 user decision |

#### Stream 4 — Visual Polish (~4 items)

| # | Item | Source |
|---|---|---|
| #21 | Log actor colors hardcoded | Sub-epic 4a |
| #23 | Single coach overlay vs dual | Sub-epic 4a |
| HudProfile card-creep monitor 6/7 | если 7th card added | Эпик 6 carry-forward |
| Spectate UI gaps post-MVP | (multiple items) | Sub-epic 7 |

#### Stream 5 — PvP Enhancements (~3 items)

| # | Item | Source |
|---|---|---|
| Cooldown countdown protocol | BE protocol extension | Sub-epic 7 #27 reclassification |
| Reconnect-replay enhancements | BE evolution | Sub-epic 4b |
| Spectate UI gaps | post-MVP polish | Sub-epic 7 |

#### Stream 6 — Web3 Integration (~5 items)

| # | Item | Source |
|---|---|---|
| Wagmi composables expansion | beyond connect | Эпик 6 |
| NFT mint v2 UI | feature flag disabled | Эпик 6 |
| Token withdrawal post-listing | (deferred) | Эпик 6 |
| x402 micropayment activation | (premium reports) | Эпик 6 |
| Smart contract ABIs review | abi/ directory | Эпик 6 |

### Эпик 7+ scope estimate

- **Sub-epic count:** 8-15 (similar к Эпик 6 range)
- **Duration estimate:** ~30-60 days (rough — depends on scope decisions)
- **Path planning:** stream prioritization needed early Эпик 7

---

## EPIC 7+ — STARTING POINT

### Bootstrap message для нового чата (design-Claude)

```
Привет!

Перед началом любой работы — три обязательных шага:

1. Прочитать CLAUDE.md (source of truth по проекту, приложен).
2. Прочитать handoff HANDOFF_EPIC_7_CHAT_HANDOFF.md (приложено).
3. (Optional) Прочитать EPIC_6_FINAL_REPORT.md для historical context.

[Стандартные правила Workflow / Mode A / агенты — как всегда]

Контекст: Эпик 6 закрыт clean — visual migration v1 → v2 COMPLETE 15/15. Streak 32, recoveries 90+, lessons promoted 38, 5 cherry-pick PRs cumulative, 6 mandatory Phase 0 subsections, 5 distinct closure shapes.

Эпик 7+ scope: post-migration features / refactors / deferred carry-overs (~30+ items across 6 streams). User decision needed early — какой stream prioritize first.

Подтверди что понял правила.
```

### First task для свежей design-Claude

1. Read CLAUDE.md + this handoff (+ optional Эпик 6 final report)
2. **Critical user decision early Эпик 7+:** Stream prioritization — какой sub-stream open first?
   - Stream 2 (Backend consolidation) — safest, refactor-only
   - Stream 1 (Refactor/cleanup) — clean Эпик 6 leftovers
   - Stream 3 (Feature work) — user-visible new functionality
   - Mixed approach — multiple streams parallel
3. Compose Phase 0 для chosen stream's first sub-epic
4. Wait Phase 0 report
5. Phase 1 ТЗ generation

---

## TONE / COMMUNICATION STYLE

- Russian language for user-facing communication
- Mode A discipline (1 commit per step, build pass, push, STOP-and-confirm gate)
- File-based ТЗ artefacts (output к /mnt/user-data/outputs/)
- STOP-and-confirm pattern (Lesson #18 surfaces)
- Honest reporting (Lesson #11 catches, Recovery candidates, Carry-overs)
- Status report after each commit (audit-only mode после first STOP-and-confirm gate consumed)

---

## CRITICAL REMINDERS — Эпик 7+ context

- **Не выходи за рамки ТЗ.** Расхождения — в отчёт, не молча чинить.
- **Не доверяй памяти про факты проекта** — проверяй через CLAUDE.md и/или код.
- **"У меня локально работает" — не доказательство.**
- **Расхождение с CLAUDE.md** — фиксировать, не молча править.
- **Streak 32 preservation** — first hot-fix breaks chain. Adaptation-tier OK, hot-fix avoid.
- **Active lessons (12-16-occurrence chains):**
  - **Lesson #43** STEP 0 mandatory — 10 occurrences exiting Эпик 6
  - **Lesson #44** re-anchor explicit — applied 2× Sub-epic 8
  - **Lesson #45** Phase 0 metadata triple-verify — 16 occurrences exiting Эпик 6
- **Lesson candidates active 7** (#36-#42) — Эпик 7 may surface 2nd occurrences (promotion candidates)
- **Cherry-pick PR pattern** — Lesson #33 6 prior applications. Эпик 7+ BE work = 7th application candidate.
- **Carry-over reclassifications** — preserve future-Claude warnings (#16 isPlayer1, #27 dice cooldown, #41 PreparationView /friends push)
- **HudProfile card-creep monitor 6/7** — refactor trigger if 7th card added Эпик 7+

---

## FILES TO ATTACH В NEW CHAT

1. **CLAUDE.md** (synced CL1 — `1f499ff`)
2. **HANDOFF_EPIC_7_CHAT_HANDOFF.md** (this file CL3)
3. **EPIC_6_FINAL_REPORT.md** (CL3 — historical context, optional but recommended)

---

## FINAL STATE EPIC 6

**Эпик 6 — CLOSED ✅ — 15/15 (100%) ✅**

Streak: 32 ✅
Recoveries: 90+
Lessons promoted: 38
Cherry-pick PRs: 5
Phase 0 mandatory subsections: 6
Closure shapes: 5

**v1 → v2 visual migration COMPLETE.**

**Эпик 7+ planning begins.**
