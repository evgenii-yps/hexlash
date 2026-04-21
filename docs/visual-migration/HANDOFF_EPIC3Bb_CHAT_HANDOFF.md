# HANDOFF — Эпик 3Bb (Matchmaking)

**Создан:** 2026-04-21 (финал Эпика 3Ba)
**Для:** следующего чата Claude Code
**Ветка:** `visual-v2`, последний коммит финала 3Ba = `epic3ba: final — CLAUDE.md update + handoff 3Bb + final report`
**Скоуп:** вторая из трёх sub-scenes Эпика 3B — Matchmaking. Клик по terminal в hub (`/v2`) открывает `/v2/matchmaking`.

---

## 1. Где мы сейчас

**Эпик 3Ba закрыт.** Training sub-scene работает:
- Heavy bag в hub → `/v2/training`.
- Октагональная комната с мешком, pendulum physics, click-to-hit с combo/energy/tasks/particles/sound.
- HUD 1-в-1 прототипа, `trState` reactive store.
- Back / Esc → `/v2`.

Инфраструктура **готова к 3Bb**:
- `sceneRegistry.unregisterScene` API.
- `useCanvasRef` composable.
- Race-guard `if (!getActiveScene()) activateScene('pit')` (3A).
- Toll Material / CSS патерн (scoped под `.app-v2`).
- Паттерн lazy scene registration в View (FighterDetail, Fight, Training).

**Осталось в 3B:**
- 3Bb — Matchmaking (этот чат).
- 3Bc — Create Fighter + финал: удаление временной FIGHT-кнопки из FD, финальный CLAUDE.md update на весь Эпик 3B.

---

## 2. Что прочитать новому чату (в порядке)

1. **Этот handoff** — целиком. Даёт текущее состояние, карту 3Bb, открытые вопросы, режим работы.
2. **`docs/visual-migration/EPIC3Ba_FINAL_REPORT.md`** — что было в 3Ba, какие паттерны и расхождения закрепились. Источник уроков 3Ba для 3Bb.
3. **`CLAUDE.md`** — секция `## v2 Migration` → подсекции `### Эпик 3Ba — Training (✅ COMPLETE)` и выше.
4. **`docs/visual-migration/EPIC3A_FINAL_REPORT.md`** — FD/Fight контекст, особенно публичные контракты API и паттерн scene registration в View.
5. **`docs/visual-migration/EPIC2_FINAL_REPORT.md`** — hub контекст, orbit camera, raycaster Variant A, Pit interactables (есть `terminal.js` в `objects/` — референс для 3Bb decision).
6. **`docs/visual-migration/EPIC1_FINAL_REPORT.md`** — foundation, `useCanvasRef`, `sceneRegistry` API.
7. **`docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md`** — общая стратегия миграции, feature flag `/v2`, принципы.
8. **`docs/visual-migration/VISUAL_MIGRATION_PLAN.md`** — детальный план.
9. **`docs/visual-migration/hexlash_v24.html`** — прототип (источник правды).

**НЕ нужно для 3Bb (но пригодится для 3Bc):**
- `HANDOFF_FIGHTER_MODEL.md` — про 3D-модель бойца, в 3Bb не актуально.

**Фокус-окрестность прототипа для 3Bb:**
- `openMatchmaking` — строка 10803.
- `closeMatchmaking` — после 10803.
- Terminal в 3D (scene setup, CRT-screen canvas-texture) — ~10379–10472.
- `mmState` (state matchmaking) — ~10616.
- `enterSearchPhase` / `enterResultsPhase` — ~10670–10800.
- `typeLog` animation (setTimeout 340мс) — в searchPhase, ~10682–10734.
- HUD HTML matchmaking — grep `id="mmHud"` или `matchmaking-hud`.
- CSS `.matchmaking-*` / `.mm-*` / `.candidate-*` — grep в CSS блоке прототипа.
- `toneMapped: false` второй случай в прототипе (строка 10469) — для matchmaking CRT-screen. **1-в-1 применить.**

---

## 3. Уроки 3Ba для 3Bb

1. **Статическая верификация — потолок Claude Code.** Browser access отсутствует. В 3Bb ожидай что-то вроде 14-пунктного регресс-теста в финале, который делает пользователь визуально.
2. **Константы вместо magic numbers** — в каждом модуле выносить все пороги/timings в именованные const в начале.
3. **Pre-allocated THREE.* в closure для hot-path** (raycaster, Vector3 для label tracking, impulse direction etc.). GC-friendly.
4. **Прототип-parity выше буквы ТЗ** (правило 0.3.4). Если ТЗ упрощает то, что в прототипе есть — делать по прототипу, отмечать в отчёте шага.
5. **`unregisterScene` + `dispose` first-line для array-backed systems** — particles, candidate meshes etc. Массивы ссылок не покрываются `scene.traverse`.
6. **Защитный white-list** — если ТЗ говорит добавить `toneMapped:false` на X — не добавлять на Y,Z. Если ТЗ меняет click watcher для id='matchmaking' — не трогать другие id (warden/predator/training/ratings/clan/shop/avatar).
7. **Lazy scene registration в View + race-guard** — проверено на FD/Fight/Training. Для matchmaking то же: `onMounted` build + register + activate + session, `onBeforeUnmount` handle.detach + reset + activateScene('pit') + unregister + dispose.

---

## 4. Карта 3Bb — Matchmaking

### 4.1 Что делаем

Клик по terminal в hub → `/v2/matchmaking`. Новая sub-scene:
- **3D:** стойка с CRT-экраном в центре комнаты. На экране анимированный лог поиска (typeLog).
- **HUD:** фильтры (ELO range slider + archetype chips + belt chips), 2 фазы (search / results), кнопки (cancel / rescan / fight).
- **Flow:** mount → фильтры → Start Search → searchPhase (typeLog анимация ~3 сек) → resultsPhase (candidates grid) → Click candidate → `/v2/fight` с параметрами.
- **Back:** cancel в любой фазе → `/v2`.

### 4.2 Что НЕ делаем в 3Bb

- **Удаление временной FIGHT-кнопки из FighterDetailView** — НЕ в 3Bb, а в финале 3Bc (когда все три sub-scenes рабочие). В 3Bb FD FIGHT-кнопка остаётся.
- **`fd-resources right: 150px → 14px`** — тоже в 3Bc.
- **Real backend integration** — в 3Bb только моки 1-в-1 из прототипа (правило 3A.4).

### 4.3 Предполагаемая структура файлов (черновик, уточнять в ТЗ)

```
src/scene/scenes/MatchmakingScene.js         — scene + camera + terminal + CRT-screen + tick
src/scene/objects/matchmakingTerminal.js     — OR параметризовать existing terminal.js из Эпика 2 (см. §5)
src/scene/interaction/useMatchmakingState.js — reactive mmState + search/results phase + candidates
src/views-v2/MatchmakingView.vue             — orchestrate
src/components/hud/HudMatchmaking.vue        — filters + search animation + results + buttons
src/components/hud/common/CandidateCard.vue  — one candidate tile (name, ELO, belt, archetype)
src/styles/v24/matchmaking.css               — shared CSS under .app-v2
```

### 4.4 Ключевые флоу

- **Search phase:** typeLog пишет в CRT-screen текст типа "scanning... ELO 1200±100... 3 candidates found". Каждая строка через `setTimeout(340мс)`. После ~3 сек → resultsPhase.
- **Results phase:** grid из N candidates (моки из прототипа). Hover → highlight. Click → передать candidate props в `/v2/fight` (left = captain, right = candidate).
- **Rescan:** возврат в searchPhase.
- **Cancel:** `/v2`.

### 4.5 Integration points

- **PitViewV2.vue watcher:** добавить ветку `if (click.id === 'matchmaking') router.push('/v2/matchmaking')`. Удалить `matchmaking` из `HudPit.MODAL_CONTENT`. Паттерн 3Ba.
- **sceneRegistry:** use existing `unregisterScene` API.
- **CanvasLayer:** не трогать. Race-guard держит.
- **Fight params passing:** `/v2/fight?left=warden&right=predator-12-a` или через query, или через Vuex-like store (выбрать в ТЗ 3Bb).

---

## 5. Открытые вопросы для 3Bb

### 5.1 Matchmaking candidates mock

**Вопрос:** переносить candidates 1-в-1 из прототипа или упрощать?
**Ответ на старте (my recommendation):** 1-в-1, по правилу 3A.4. Если прототип генерирует procedurally (random ELO/archetype/belt), — воспроизвести формулу. Если массив hardcoded — скопировать массив.
**Жду подтверждения.**

### 5.2 TypeLog CRT-screen animation

**Вопрос:** переносить `setTimeout 340мс` step-by-step animation 1-в-1 (прототип 10682–10734), или упростить через CSS-animation / requestAnimationFrame?
**Ответ на старте (my recommendation):** 1-в-1 через setTimeout. Паттерн прототипа, предсказуемые tick'и, hosted в `useMatchmakingState.js` state machine.
**Жду подтверждения.**

### 5.3 ELO range slider

**Вопрос:** custom компонент или native `<input type="range">`?
**Ответ на старте (my recommendation):** native `<input type="range">` + custom CSS скин (webkit-slider-thumb / moz-range-thumb) — меньше кода, consistent-behaviour. Custom нужен только если прототип требует bi-directional slider (two thumbs для range). Проверить в прототипе.
**Жду подтверждения + проверки прототипа.**

### 5.4 Terminal 3D: отдельный модуль или параметризация?

**Вопрос:** `src/scene/objects/terminal.js` уже есть из Эпика 2 (hub-terminal). Для 3Bb нужен matchmaking-terminal — другой: больше, центрированный, с canvas-texture screen вместо procedural.
- Вариант A: отдельный модуль `matchmakingTerminal.js` (паттерн 3Ba: один объект = один модуль).
- Вариант B: параметризовать `terminal.js` флагом `{ variant: 'hub' | 'matchmaking' }`.
**Ответ на старте (my recommendation):** A (отдельный модуль). Паттерн 3Ba `heavyBag.js` vs `trainingBag.js`. Конфиг-монстр — anti-pattern, поскольку размеры/позиция/screen-logic различаются существенно.
**Жду подтверждения или смены курса.**

### 5.5 Fight params passing

**Вопрос:** как передать candidate в `/v2/fight`?
- Вариант A: query params `/v2/fight?right=candidate-id`.
- Вариант B: router params.
- Вариант C: module-scoped store (импорт в Fight scene).
**Ответ на старте:** обсудить в ТЗ 3Bb. Fight Scene currently hard-codes warden vs predator; 3Bb добавит реальный pairing.

---

## 6. Первое действие нового чата

1. **Прочитать** этот handoff целиком.
2. **Прочитать** EPIC3Ba_FINAL_REPORT, CLAUDE.md, EPIC3A/2/1_FINAL_REPORT.
3. **Ответить на вопросы §5** (5.1 — 5.5). По умолчанию — мои recommendation'ы выше.
4. **Сформулировать ТЗ 3Bb** по формату `PROMPT_EPIC3Ba_TRAINING_FOR_CLAUDE_CODE.md` (если он в репо) или по формату из 3A/3Ba (11 шагов, режим A, защитные правила).
5. **Получить «ок» от пользователя на ТЗ.**
6. **Не начинать работу** до утверждения ТЗ.

**Режим А — строго.** После каждого коммита — СТОП, отчёт, ждать «ок».

---

## 7. Стартовое сообщение для нового чата (шаблон)

Скопировать-вставить в новый чат:

```
Привет. Начинаем Эпик 3Bb — Matchmaking sub-scene (2-я из 3 в Epic 3B).

Ветка: visual-v2. Последний коммит: финал Эпика 3Ba.

Первое действие — прочитать в порядке:
1. docs/visual-migration/HANDOFF_EPIC3Bb_CHAT_HANDOFF.md
2. docs/visual-migration/EPIC3Ba_FINAL_REPORT.md
3. CLAUDE.md (секция ## v2 Migration)
4. docs/visual-migration/EPIC3A_FINAL_REPORT.md
5. docs/visual-migration/EPIC2/1_FINAL_REPORT.md
6. docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md
7. docs/visual-migration/hexlash_v24.html — прототип (фокус: openMatchmaking 10803, terminal в 3D 10379-10472, typeLog 10682-10734, mmState 10616, toneMapped:false 10469)

После прочтения — ответить на §5 открытых вопросов handoff'а и сформулировать ТЗ 3Bb.

Режим А — строго: после каждого коммита СТОП, ждать «ок».

Не начинай работу до утверждения ТЗ.
```

---

**Конец HANDOFF 3Bb.**
