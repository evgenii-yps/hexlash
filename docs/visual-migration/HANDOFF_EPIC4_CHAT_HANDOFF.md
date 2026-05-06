# HANDOFF — Переход из Эпика 3B (CLOSED) в Epic 4

**Дата:** 2026-04-21
**Источник:** завершение Эпика 3Bc (Create Fighter) + FD cleanup → закрытие всего Эпика 3B.
**Цель:** ввод нового чата Claude Code в контекст Epic 4 (backend integration / 3D variants / polish — выбор варианта за пользователем).

---

## 1. Где мы сейчас

**Эпик 3B — ✅ CLOSED.** Все 3 sub-эпика + FD cleanup завершены:
- **3Ba Training** (`/v2/training`) — heavy bag + physics + combo + procedural sound.
- **3Bb Matchmaking** (`/v2/matchmaking`) — CRT typeLog + filters + candidates grid + Start Fight.
- **3Bc Create Fighter** (`/v2/create`) — archetype (6) → name (input + roll + chips) → confirm → materialize → hub.
- **Step 11 FD cleanup** — удалена временная FIGHT-кнопка из Epic 3A, `fd-resources right: 14px` restored.

**Ветка разработки:** `visual-v2`. Последний коммит на момент написания этого handoff — `92deed3` (`epic3bc: final part 2 — EPIC3Bc_FINAL_REPORT.md`). После final part 3 (этот коммит) — Epic 3B полностью закрыт.

**Что работает на Vercel preview `/v2`:**

| Route | Sub-эпик | Что делает |
|-------|----------|------------|
| `/v2` | Эпик 2 (hub) | Октагональная pit-комната, 8 кликабельных интерактивов, orbit camera, 2 бойца с idle sway |
| `/v2/fd/warden`, `/v2/fd/predator` | Эпик 3A | Fighter Detail: podium, 3 branch columns, stats. **Без FIGHT-кнопки** (Step 11 3Bc) |
| `/v2/fight` | 3A + 3Bb | Ring, 2 fighters, PrepOverlay → exchanges → CoachPause → Result. Принимает opponent setup через `useFightSetup` |
| `/v2/training` | 3Ba | Heavy bag, click-to-hit, combo, daily tasks, WebAudio |
| `/v2/matchmaking` | 3Bb | CRT typeLog, ELO/archetype/belt filters, candidates grid, Start Fight → opponent setup + router.push |
| `/v2/create` | **3Bc (NEW)** | Archetype carousel → name + roll + chips → confirm summary → materialize opacity lerp → hub |

**Единственный путь в Fight:** hub → terminal click → `/v2/matchmaking` → typeLog → select candidate → Start Fight. Статически подтверждено grep'ом (`router.push('/v2/fight')` = 1 match, MatchmakingView:122).

**Следующий эпик:** **Epic 4** (название условное, финал — за пользователем). См. §4 «Карта Epic 4 — варианты».

---

## 2. Что прочитать в новом чате

Прикрепить к сообщению нового чата в этом порядке:

1. **`HANDOFF_EPIC4_CHAT_HANDOFF.md`** (этот файл) — читать первым.
2. **`EPIC3Bc_FINAL_REPORT.md`** — свежий опыт Create + FD cleanup. Особенно:
   - §6.1 (ТЗ неточности, peer-review handoff нашёл 3 расхождения до старта).
   - §6.2 (prototype-parity overrides — podium 32 segments, no rim-right).
   - §6.3 (2 hot-fix'а с root causes).
   - §7 (8 уроков — дублируются в §3 этого handoff).
3. **`EPIC3Bb_FINAL_REPORT.md`** — Matchmaking, `useFightSetup` one-shot consumption, `animHandle` cancel pattern. **Критично** если Epic 4 Вариант A (новые cross-view state passings).
4. **`EPIC3Ba_FINAL_REPORT.md`** — Training, per-object module pattern (trainingBag vs hub heavyBag), WebAudio, module-scoped reactive state reset.
5. **`EPIC3A_FINAL_REPORT.md`** — FighterDetail + Fight, `makeFighterLowPoly` integration. **Критично** если Epic 4 Вариант B (4 fighter variants).
6. **`EPIC2_FINAL_REPORT.md`**, **`EPIC1_FINAL_REPORT.md`** — hub + foundation, базовый контекст.
7. **`HANDOFF_VISUAL_MIGRATION.md`**, **`VISUAL_MIGRATION_PLAN.md`** — полный контекст миграции, §145 про skins, Epic 5-6 видение.
8. **`HANDOFF_FIGHTER_MODEL.md`** — **КРИТИЧНО** для Epic 4 Вариант B. 22-индексный контракт `makeFighterLowPoly`, accessories, `P` object с per-variant proportions.
9. **`PROMPT_EPIC3B_a_TRAINING_FOR_CLAUDE_CODE.md`** — референс формата ТЗ (структура шагов, DoD, commit template).
10. **`hexlash_v24.html`** — прототип. Фокус-окрестности по выбранному варианту (см. §4).

### ⚠️ Про `CLAUDE.md` в project knowledge

**Пользователь обновляет project knowledge вручную** через `Project settings → Knowledge` после каждого merge `visual-v2`. **Прецедент 3Bc:** project knowledge CLAUDE.md был stale (не содержал подсекций 3Ba/3Bb), Claude Code работал по handoff'ам + коду на диске.

**Перед Epic 4:** пользователь должен обновить CLAUDE.md в project knowledge (актуальная версия с подсекцией 3Bc на диске в корне репо). Если забыл — **источник правды = код на диске + handoff'ы**, не `project_knowledge_search`.

---

## 3. Уроки 3Bc — обязательны к учёту в Epic 4

8 уроков из 3Bc (`EPIC3Bc_FINAL_REPORT.md §7`), каждый с прямым actionable для Epic 4.

1. **Peer-review handoff работает.** 3Bc handoff написан предыдущим чатом, текущий чат нашёл **3 расхождения до старта ТЗ** (6 vs 2 архетипа, 3 vs 2 механизма name, CLAUDE.md stale). **Для Epic 4:** первое действие нового чата — прогнать этот handoff через peer-review, сверить с прототипом/кодом, зафиксировать расхождения до Step 1.

2. **Step 1 «stubs + route» pattern требует активации scene.** Hot-fix `809c63f` — общий CanvasLayer renderer не имеет «empty» default scene. **Для Epic 4:** любой Step 1 новой `/v2/*` view = stub factory + `registerScene(id, emptyScene)` + `activateScene(id)`. Не откладывать на Step 2 под предлогом «stub минимум».

3. **Module-scoped reactive singleton требует explicit reset point.** Hot-fix `cbc074a` — Vue не reset'ит module-level reactive'ы на re-mount. **Для Epic 4:** `useCreatedFighter`, `useMatchResult`, любые new cross-view state'ы — всегда с reset hook'ом в `onMounted` first line.

4. **Cancel handle + teardown first line.** Паттерн 3Bb `animHandle` → 3Bc `matHandle` переносится. Любая rAF/setTimeout animation возвращает `{ cancel() }`, view owns handle, `onBeforeUnmount` первой строкой вызывает cancel. **Для Epic 4:** все backend API calls с optimistic UI — cancelable через `AbortController` с тем же паттерном.

5. **Prop-drilling Вариант A > module-scoped API setter.** `HudCreate ← getHoloFighter/getFlashEl + emit('materialize-start', handle)` — симметрично 3Bb, Vue idiomatic, unit-testable HUD. **Для Epic 4:** новые HUD↔Scene wiring'и начинать с Variant A, переходить на B только если truly shared между 3+ components.

6. **Split-final + preemptive micro-Edit'ы.** Прецедент 3Bb (3 timeout'а на monolithic Write → split решение). В 3Bc применено preemptive с первого финала — **0 timeout'ов** на 17 Edit'ах final part 2. **Для Epic 4:** каждый финал = split на 3 коммита + ≤50 строк за Edit.

7. **Prototype-parity > ТЗ (правило 0.3.4).** Повторяется каждый эпик. ТЗ 3Bc Step 4 указал podium segments=48 + metal material; прототип 32 + concrete — применён прототип. **Для Epic 4:** если ТЗ расходится с прототипом, прототип побеждает, отчёт в step commit message.

8. **CLAUDE.md project knowledge — recurring risk.** Пользователь обновляет вручную после merge. **Для Epic 4 handoff §6 first action:** явно проверить что CLAUDE.md в project knowledge актуален; если нет — работать по диску, попросить пользователя обновить.

---

## 4. Карта Epic 4 — варианты

Скоуп Epic 4 **не зафиксирован** — пользователь решает по результатам peer-review handoff. 3 варианта ниже, каждый с оценкой сложности и зависимостями.

### Вариант A — Backend integration (классический)

**Цель:** подключить реальные backend endpoints + Vuex вместо моков. Frontend готов, это про wiring data sources.

**Sub-эпики (условно 4A-4D):**
- **4A Matchmaking API:** replace `mmCandidatesMock.generateCandidates` на HTTP/WS call к серверу. Структура candidate уже совпадает с ожидаемым API response (name/arch/belt/elo/wins/losses/streak/diffLabel).
- **4B Captain data real:** warden/predator в hub → подтянуть из `agentState` Vuex module. Реальный captain первым. Club Mode: до 6 agents вокруг ринга по club level.
- **4C Create persistence + переход в FD нового бойца:** POST `/v1/agents/create` на materialize complete → response `newFighterId` → `router.push('/v2/fd/' + newFighterId)`. Требует:
  - Dynamic FD scene registration (не hardcoded `/v2/fd/warden|predator`).
  - `useCreatedFighter` composable (one-shot consumption паттерн 3Bb `useFightSetup`).
  - `FighterDetailView.onMounted` обработка new fighter.
- **4D Training progression:** task rewards real (не visual-only). Binding с `progressionState` Vuex. FD stats из `agentState + progressionState` вместо mocks.
- **4E Fight combatEngine:** replace mock exchanges на real `combatEngine.js` + `pvpHandler.js` WebSocket.

**Сложность:** ⚠️ **Высокая** — 15-25 функциональных шагов, 5 sub-эпиков. Зависит от готовности backend API (нужен аудит `/v1/*` endpoints).

**Prerequisite:** функциональный `/v1/*` API + `pvpHandler` WebSocket + `agentState` / `progressionState` Vuex modules (существующие по CLAUDE.md, проверить статус).

### Вариант B — 4 недостающих 3D fighter variants

**Цель:** дорисовка analyst / ghost / sentinel / maverick / juggernaut в `makeFighterLowPoly`. Сейчас все 6 archetypeId'ов отображаются как warden mesh (только glow меняет цвет).

**Что делать:**
- Extend `P` object в `fighterModel.js` с per-variant proportions (shoulders, reach, stance, skin tone).
- Добавить `variant` параметр в `makeFighterLowPoly(THREE, variantId)`.
- В `useCreateState.onArchetypeChange` — добавить `setVariant(id)` call через DI:
  ```js
  if (a && setVariant) setVariant(id);
  ```
- Connect `CreateScene.setArchetypeVariant` → `makeHoloFighter` swap с dispose + setHologram re-apply.

**Визуальные характеристики per variant** (из `HANDOFF_FIGHTER_MODEL.md` + прототип-references):
- **Predator:** агрессивный боец, боевая стойка, warm skin.
- **Analyst:** worn-out look, медлительный, cool grey skin.
- **Ghost:** evasive, узкие плечи, dark skin.
- **Sentinel:** mass, широкие плечи, defensive stance.
- **Maverick:** wildcard, asymmetrical proportions.
- **Juggernaut:** heavy, maximum mass, slow stance.

**Сложность:** 🟡 **Средняя** — 6-8 функциональных шагов, относительно изолированный скоуп. Не требует backend.

**Prerequisite:** прочитать `HANDOFF_FIGHTER_MODEL.md` целиком (22-index contract + accessories).

### Вариант C — Polish + missing v2 screens (Epic 5 из VISUAL_MIGRATION_PLAN)

**Цель:** финальная полировка + перенос оставшихся экранов старого UI на v2. Перед Epic 6 (удаление старого кода) нужно завершить визуальную миграцию всех экранов.

**Sub-эпики (примерно 4C1-4C4):**
- **Views миграция на v2:**
  - Profile view → `/v2/profile` (balance, wallet, account, skins tabs).
  - Ratings view → `/v2/ratings/:type` (My Club / Clubs / Fighters / Agents).
  - Clan view → `/v2/clan/:id` (header, stats, members, activity, settings).
  - Shop view → `/v2/shop` (cosmetics locker, replace PhModal).
  - Onboarding, AI Trainer, Spectate, Referral, Verify screens.
- **i18n completion:** 11 locales для Create/Training/Matchmaking strings (сейчас `EN-only` в v2 sub-scenes).
- **DRY refactors:**
  - `buildOctagonalRoom()` helper (Create/Training/Matchmaking идентичная комната, ~40 строк повтора каждая).
  - Fighter idle animation tick — extract из 3 sub-scenes.
- **Cross-cutting polish:**
  - Touch events support (mobile, mousedown → pointerdown).
  - Global audio infrastructure (rumble + mute toggle, WebAudio shared context).
  - Cleanup carry-over (HudPit dead MODAL_CONTENT entries, Step 11 comment).
  - Punch-zoom / blur-fade transitions между scenes (3A deferred).

**Сложность:** 🟡 **Высокая cumulative, но каждый screen изолирован.** 20-30 шагов, но can be prioritised incrementally.

**Prerequisite:** старый UI views готовы как reference (Profile/Ratings/Clan работают на legacy, задача — перенос визуала + reuse бизнес-логики).

### Рекомендация по выбору

- **A** если backend API готов/в близкой готовности — frontend `/v2` полностью готов принять real data, задержка только в wiring.
- **B** как чёткий visual gap — прототип имеет 6 differentiated fighters, v2 показывает только warden. Quick win, изолированный scope, ценный для demo.
- **C** как финальная полировка перед Epic 6 (удаление старого). Самый большой scope, но делимый.

**Наиболее вероятная последовательность (consensus Epic 1-3 pattern):** B → A → C. **B первым** как quick win + unblocker для визуальной презентации. **A затем** когда backend готов. **C последним** как финальный clean slate перед удалением.

Финальное решение **за пользователем** — новый чат должен ответить на §5 Q1 в первом сообщении.

---

## 5. Открытые вопросы на момент передачи

6 вопросов, каждый с рекомендацией. Новый чат должен ответить в первом сообщении **до старта ТЗ**.

### 5.1 Какой вариант Epic 4?

A (backend integration) / B (3D variants) / C (polish + missing screens).

- **Рекомендация:** **B первым** — quick win, изолированный scope, closes visual gap с прототипом. A после backend readiness. C последним перед Epic 6.
- **Альтернатива:** если backend API готов и нет пока релизных дедлайнов на demo — можно начать с A, тогда каждый новый экран сразу с real data.
- **Решение:** за пользователем.

### 5.2 `buildOctagonalRoom()` helper — в Epic 4 или отложить на Epic 5?

Create/Training/Matchmaking scenes имеют ~40 строк идентичного кода (fog + 8 walls + concrete floor). DRY-рефактор.

- **Рекомендация:** **Epic 5** (с другими polish refactorings). В Epic 4 — не трогать, сохранить stability. Premature abstraction риск: если Epic 4 Вариант A меняет room geometry per-scene (например, Matchmaking получает больше ламп при real API), preemptive helper может пришлось бы разрывать.

### 5.3 Create → FD нового бойца — в Epic 4 скоуп?

Прототип делает `closeCreate → hub` (1-в-1 поведение 3Bc). Расширение: Create → `/v2/fd/:newKey` нового бойца.

- **Рекомендация:** **часть Epic 4 Вариант A 4C** (Create persistence). Без backend persistence расширение преждевременно (некому persist'ить newFighterId). Требует:
  - Dynamic FD scene registration.
  - `useCreatedFighter` one-shot consumption composable.
  - `FighterDetailView.onMounted` new fighter handling.
- **В Вариантах B и C** — не входит, Create остаётся 1-в-1 прототип.

### 5.4 `HudPit.vue:56-67` dead MODAL_CONTENT entries

`MODAL_CONTENT.warden` / `.predator` — unreachable (PitViewV2 watcher early-return через FD_IDS). Carry-over с Epic 3A.

- **Рекомендация:** **Epic 5 polish** вместе с другим cleanup (Step 11 inline comment `HudFighterDetail.vue:218`, create.css TODO comment'ы). Trivial удаление, но не блокирует Epic 4.

### 5.5 CLAUDE.md project knowledge update

Пользователь обновляет вручную через Project settings → Knowledge. Прецедент 3Bc: stale при старте, Claude Code работал по диску.

- **Рекомендация:** **перед Epic 4 Step 1** пользователь обновляет CLAUDE.md в project knowledge (актуальная версия в корне репо после merge). Новый чат в первом сообщении **явно проверяет** через `project_knowledge_search('Эпик 3Bc')` — если пусто, напомнить пользователю обновить.

### 5.6 Merge стратегия `visual-v2` → `main`

После Epic 3B CLOSED: ветка `visual-v2` содержит ~100+ коммитов от Epic 1. Когда мёрджить в `main`?

- **Рекомендация:** **после Epic 4 + Epic 5** (или хотя бы после стабильного state с real data). Premature merge в `main` заморозит legacy UI рядом с v2 — лишний tech debt. Либо — если Epic 4 занимает 2+ месяца — можно мёрджить `visual-v2` в `main` как intermediate milestone с feature flag (чтобы `/v2/*` был опционально доступен прод-пользователям для beta testing).
- **Альтернатива:** держать `visual-v2` до Epic 6 (удаление старого UI) → один большой merge в конце миграции.
- **Решение:** за пользователем, выходит за scope handoff'а.

---

## 6. Что делать новому чату в первом сообщении

Новый чат **НЕ стартует ТЗ сразу.** Первый ответ — ровно следующее:

1. **Прочитать `HANDOFF_EPIC4_CHAT_HANDOFF.md`** (этот файл) целиком.
2. **Прочитать `EPIC3Bc_FINAL_REPORT.md`** — свежий опыт (особенно §6 расхождения + §7 уроки).
3. **Бегло** предыдущие EPIC*_FINAL_REPORT.md, `HANDOFF_VISUAL_MIGRATION.md`, `VISUAL_MIGRATION_PLAN.md`.
4. **Внимательно** `HANDOFF_FIGHTER_MODEL.md` если выбран Вариант B (3D variants).
5. **Проверить CLAUDE.md project knowledge** через `project_knowledge_search('Эпик 3Bc Create Fighter')`:
   - Если вернуло содержательный match — project knowledge актуален, работать с ним.
   - Если пусто/устарело — попросить пользователя обновить CLAUDE.md через Project settings → Knowledge, в любом случае **источник правды = код + handoff'ы на диске**.
6. **Подтвердить прочитанное** — 2-3 предложения: «прочитал X, Y, Z, понял текущее состояние, Эпик 3B CLOSED».
7. **Peer-review handoff** — прогнать утверждения этого документа через прототип/код. Если найдены расхождения (как 3Bc chat нашёл 3 в handoff 3Bc) — зафиксировать явно: «handoff §X.Y сказал Z, прототип/код показывает W, применю W».
8. **Ответить на 6 открытых вопросов §5** — свои рекомендации + уточнить у пользователя. Особенно Q1 (вариант Epic 4) — это ключевое решение, определяющее весь скоуп.
9. **НЕ начинать писать ТЗ или код** до подтверждения пользователя по Q1 (вариант) и Q5 (project knowledge updated).
10. Режим работы — **Режим А** (строгий step-by-step): СТОП после каждого шага, отчёт, ждать «ок». Прецедент 3Ba/3Bb/3Bc.

---

## 7. Стартовое сообщение для нового чата

Готовый текст для копи-паста пользователем в новый чат на claude.ai. Скопировать целиком начиная от `---` до следующего `---`:

---

Привет. Начинаем **Epic 4** визуальной миграции Hexlash. Проект на ветке `visual-v2`.

**Эпик 3B (полностью) CLOSED.** Все 3 sub-эпика + FD cleanup завершены:
- `/v2/training` (heavy bag + physics + combo).
- `/v2/matchmaking` (CRT typeLog + filters + Start Fight).
- `/v2/create` (archetype → name → confirm → materialize).
- FD FIGHT-кнопка удалена, единственный путь в Fight — через Matchmaking.

Работает на Vercel preview `/v2/*` — все 5 routes готовы.

**Прикрепил ключевые документы:**
- `HANDOFF_EPIC4_CHAT_HANDOFF.md` — читай первым. Там: статус, что прочитать, уроки 3Bc, карта Epic 4 (3 варианта A/B/C), 6 открытых вопросов.
- `EPIC3Bc_FINAL_REPORT.md` — свежий отчёт Create + FD cleanup (§6 расхождения, §7 уроки).
- `EPIC3Bb/3Ba/3A/2/1_FINAL_REPORT.md` — контекст предыдущих.
- `HANDOFF_FIGHTER_MODEL.md` — **критично** если выберем Вариант B (3D variants).
- `HANDOFF_VISUAL_MIGRATION.md`, `VISUAL_MIGRATION_PLAN.md` — полный контекст.
- `hexlash_v24.html` — прототип.

**CLAUDE.md в project knowledge** — проверь актуальность через `project_knowledge_search('Эпик 3Bc Create Fighter')`. Если пусто/устарело — напомни мне обновить через Project settings → Knowledge. Источник правды = код + handoff'ы на диске.

**Что сделать в первом ответе:**
1. Прочитай документы выше в указанном порядке.
2. Проверь CLAUDE.md project knowledge статус.
3. Подтверди что понял текущее состояние (Эпик 3B CLOSED).
4. **Peer-review handoff** — прогони утверждения через прототип/код, зафиксируй расхождения (прецедент 3Bc: 3 неточности найдены до старта ТЗ).
5. Ответь на **6 открытых вопросов §5** — свои рекомендации + уточнения. **Особенно важен Q1 (вариант A/B/C)** — это определяет весь скоуп Epic 4. Handoff рекомендует **B → A → C** последовательность.
6. **Не пиши ТЗ и не начинай код** до моего подтверждения по Q1 + Q5 (CLAUDE.md status).

Режим работы — **Режим А**: СТОП после каждого шага, отчёт, жди «ок». Прецедент 3Ba/3Bb/3Bc.

Поехали.

---

**Примечание для пользователя (не копировать в новый чат):** если Claude Code в новом чате начнёт ТЗ/код до обсуждения §5 — остановить его явно. Handoff специально требует consult-first. Механизм peer-review подтверждён в 3Bc (3 неточности найдены до старта) — Epic 4 handoff может содержать свои неточности, peer-review обязателен.

---

## 8. Чеклист самого handoff'а

Валидация полноты этого документа перед push'ем:

- [x] §1 Статус Эпика 3B CLOSED зафиксирован. Таблица 6 routes `/v2/*` с их sub-эпиками. Последний коммит `92deed3` указан.
- [x] §2 Список 10 документов для прикрепления + explicit section про CLAUDE.md project knowledge risk.
- [x] §3 Уроки 3Bc — **8 пунктов** с прямым actionable для Epic 4 (peer-review, Step 1 scene activation, module reset, cancel+teardown, Variant A, split-final, prototype-parity, CLAUDE.md risk).
- [x] §4 Карта Epic 4 — **3 варианта** (A backend / B variants / C polish) с оценкой сложности и prerequisites + рекомендация порядка B→A→C.
- [x] §5 Открытые вопросы — **6 штук** с рекомендацией по каждому: вариант, room helper, Create→FD nav, dead MODAL_CONTENT, CLAUDE.md update, merge стратегия.
- [x] §6 Первое действие нового чата — 10 пунктов (добавлен peer-review step + CLAUDE.md check + Q1/Q5 gate).
- [x] §7 Стартовое сообщение готово к копи-пасту + примечание для пользователя.
- [x] §8 Этот чеклист.

**Meta-note:** если новый чат обнаружит неточности в этом handoff'е через peer-review (§6 п.7) — это ожидаемое поведение, прецедент 3Bc. Зафиксировать расхождения в EPIC4_FINAL_REPORT §6.1 (template из 3Bc). Механизм работает — не спор, а sanity-check.

---

**Конец handoff'а.**
