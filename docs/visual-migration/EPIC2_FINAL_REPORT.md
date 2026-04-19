# EPIC 2 — FINAL REPORT

**Дата закрытия:** 2026-04-19
**Ветка:** `visual-v2`
**Статус:** ЗАКРЫТ. Функционально подтверждён пользователем на Vercel preview.

---

## Шаги и коммиты

| # | Что сделано | Коммит |
|---|-------------|--------|
| pre | `chore: add PATCH_EPIC2_STEPS_5_8.md (spec corrections for steps 5-9)` | `a326156` |
| 1 | Stubs для всех 20 новых файлов | `4454244` |
| 2 | Процедурные текстуры (concrete / metal / noise) | `c83d585` |
| 3 | PitScene scaffold, октагональная комната, полное освещение (6 источников) | `a395418` |
| fix | FOV 45°, FogExp2, shadowMap enabled (Step 3 spec corrections) | `e651ed3` |
| 4 | Environment (beams, lamps, drain grate) | `a185d83` |
| 5 | Environment (crowd, ground fog, rim pulse) [PATCH applied] | `8aacb2b` |
| 6 | Arena (platform + posts + ropes + cage) [PATCH applied] | `b32e7fb` |
| 7 | Orbit camera (drag + wheel zoom) [PATCH critical, 5 правок] | `c32f2e7` |
| debug | Debug logs для orbit camera | `79fe615` |
| cleanup | Cleanup orbit debug logs | `65dad37` |
| chore | `EPIC1_FINAL_REPORT.md` загружен пользователем через GitHub UI | `029b664` |
| 8 | `fighterModel.js` (полный перенос из прототипа, 585 строк) — **вручную через GitHub UI** из-за Stream timeout | `ab1d431` |
| 9 | Integrate fighters in pit scene (warden + predator + glow + idle + bob) | `f924059` |
| 10 | HeavyBag (training interactable) | `76690e8` |
| 11 | Terminal (matchmaking, blinking cursor, CRT) | `e6db098` |
| 12 | Plinth «+» (create interactable) | `ec0b288` |
| fix | Plinth shaft should not rotate (confused с light shaft прототипа) | `63f4994` |
| 13 | Scoreboard (ratings interactable, leaderboard canvas) | `e94a9e2` |
| 14 | ClanBanner (clan interactable) | `1301699` |
| 15 | ShopLocker (shop interactable, cosmetics display) | `ae27d4b` |
| 16 | Raycaster + hover + WorldHint | `09e2d03` |
| 17 | HUD Pit (TopBar + PhModal + click handlers) | `4ca8f2e` |

**Всего:** 17 шагов ТЗ + 4 hot-fix/cleanup + 2 chore (patch + EPIC1 upload) + 1 manual (fighterModel) = **24 коммита**.

---

## Файлы

### Созданы

**Scene layer (13):**
- `src/scene/materials/noise.js` (~20 строк)
- `src/scene/materials/concrete.js` (~55 строк)
- `src/scene/materials/metal.js` (~25 строк)
- `src/scene/objects/fighterModel.js` (585 строк) — `makeFighterLowPoly`, `registerIdleFighter`, `tickIdleAnimations`, `unregisterIdleFighter`, `addArchetypeGlow`, `COL` палитра, 22-child contract
- `src/scene/objects/arena.js` (~120 строк) — `buildArena`, constants `RING_RADIUS=4.2`, `RING_HEIGHT=0.6`, `POST_HEIGHT=2.4`, `ROPE_HEIGHTS=[0.55, 1.15, 1.75]`
- `src/scene/objects/environment.js` (~150 строк) — `buildEnvironment`, inner `makeBeam` / `makeHangingLamp` / `makeCrowdFigure`, ground fog particles
- `src/scene/objects/heavyBag.js` (~79 строк)
- `src/scene/objects/terminal.js` (~100 строк) — возвращает `{ group, tickScreen(t) }` для blink курсора
- `src/scene/objects/plinth.js` (~85 строк) — возвращает `{ group, shaft }`
- `src/scene/objects/scoreboard.js` (~90 строк) — `lookAt(0, 2.2, 0)` внутри builder'а до return
- `src/scene/objects/clanBanner.js` (~85 строк)
- `src/scene/objects/shopLocker.js` (~95 строк)
- `src/scene/scenes/PitScene.js` — собирает всё: fog, camera, lights, arena, environment, 2 fighters, 6 interactables, `clickableTargets`, tick-loop

**Interaction (4):**
- `src/scene/interaction/raycaster.js` — `createPicker(camera, targets, THREE)` с walk-up parent chain
- `src/scene/interaction/cameraController.js` — `attachOrbit(camera, canvas)` → `{ tick, detach, getIsDragging }`, drag formula от `dragStartAngle`, wheel normalized
- `src/scene/interaction/useHoverState.js` — module-scoped reactive store для siblings CanvasLayer ↔ PitViewV2
- `src/scene/interaction/useClickState.js` — reactive `{ id, seq }` + `pickClick(id)`, `seq` counter для повторных кликов

**HUD (4):**
- `src/components/hud/HudPit.vue` — собирает TopBar + WorldHint + PhModal, `MODAL_CONTENT` (9 ключей: 8 объектов + avatar)
- `src/components/hud/common/TopBar.vue` — 3 ресурса / THE PIT / аватар YV
- `src/components/hud/common/PhModal.vue` — Teleport to body, backdrop + modal + Esc/close, ×/backdrop/Esc закрывают
- `src/components/hud/common/WorldHint.vue` — floating DOM-ярлык с `pointer-events: none`

**Docs (2):**
- `docs/visual-migration/PATCH_EPIC2_STEPS_5_8.md` (223 строки) — уточнения к ТЗ Шагов 5-9
- `docs/visual-migration/EPIC2_FINAL_REPORT.md` (этот файл)

**Stub (1, не заполнен в Эпике 2):**
- `src/components/hud/common/FighterBadge.vue` — создан в Шаге 1, помечен как «не для Эпика 2», заполнится в Эпике 3/4

### Изменены

- `src/scene/CanvasLayer.vue` — убран хардкод Эпика 1 (floor + walls), переключение на `PitScene`, `shadowMap.enabled`, orbit + picker + hover/click listeners, dispose ресурсов через Set уникальных текстур
- `src/views-v2/PitViewV2.vue` — полная перезапись: убран маркер «/v2 works», рендерит `<HudPit ref>` + watch на `useClickState.seq` → `openPhModal`
- `CLAUDE.md` — секция `## v2 Migration` обновлена (Эпик 2 COMPLETE)

---

## Технические детали

### PitScene архитектура

- `buildPitScene(THREE, aspect)` возвращает `{ scene, camera, tick, clickableTargets, platformTex, floorTex, metalTex, rimL, ... }`.
- Fog: `FogExp2(0x070811, 0.028)` — экспоненциальный, плавное растворение в глубину (Шаг 3 hot-fix исправил линейный туман Эпика 1).
- Camera: `PerspectiveCamera(45°, aspect, 0.1, 100)` (Шаг 3 hot-fix: было 50°, стало 45° по прототипу).
- 6 источников света: Ambient, Hemisphere, Key SpotLight (castShadow, 1024×1024), rimL (pink), rimR (cyan), fill PointLight, + 3 hanging lamp spots + bagLight spot + экран-glow point lights.
- Октагональная комната: 8 `PlaneGeometry` стен радиуса 18, высота 9, octagonal ceiling.
- 2 отдельные concrete-текстуры: `platformTex` (repeat 1,1 для платформы ринга, plinth base, clanBanner base) + `floorTex` (repeat 6,6 для пола комнаты). Отдельные instance — нельзя reuse с разным repeat.

### CanvasLayer архитектура

- Создаёт `WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })`.
- `setPixelRatio(min(dpr, 2))`, `shadowMap.enabled = true`, `shadowMap.type = PCFSoftShadowMap` (Шаг 3 hot-fix).
- Регистрирует PitScene под id `'pit'` в sceneRegistry, вызывает `activateScene('pit')`, запускает render loop.
- Tick composition: `(t) => { orbit.tick(t); pit.tick(t); renderer.render(scene, camera); }`.
- Обрабатывает resize (aspect + setSize), pointermove (для hover — в хоть одном из режимов: не при drag), pointerdown/pointerup (click detection — dist < 5px).
- `beforeUnmount`: детач orbit, cleanup listeners, dispose через `scene.traverse` с Set уникальных материалов и текстур, `renderer.dispose()`, `forceContextLoss()`.

### fighterModel

- **22 children в фиксированном порядке** (head/neck/torso/shoulders/upper/elbow/fore/fist/hip/thigh/knee/shin/foot — см. JSDoc в файле). Порядок критичен — idle loop индексирует детей по номеру (`children[11]` = fistL и т.д.).
- **`torsoGeo.scale(1, 1, 0.60)`** — сплющивает торс по Z, без этого «спина выпирает как тыква».
- **Перчатки `0x2a2d34`** — тёмный серый, не цвет архетипа.
- Везде `MeshStandardMaterial` с гладкими нормалями, **нет `flatShading: true`**.
- **Idle loop** через `entry.base` snapshot: позиции SETятся как `base + offset` каждый кадр, не `+=`. Drift-баг из HANDOFF_FIGHTER_MODEL.md в прототипе уже починен, перенос 1-в-1.
- `addArchetypeGlow` — **canvas-радиальный градиент** 256×256 (`rgba(r,g,b,0.7→0.3→0)`), `PlaneGeometry(0.85, 0.85)`, `AdditiveBlending`, `userData.isArchGlow = true`. Не путать с эмиссивным `CircleGeometry` (было неточностью в исходном ТЗ, зафиксировано в PATCH).
- `unregisterIdleFighter` — через `splice` по ссылке на group. В прототипе не было, добавлено по ТЗ.

### Camera orbit

- По прототипу 6811-6830 + 7037-7059 (после PATCH-правок).
- `ZOOM_DEFAULT = √(11²+16²) ≈ 19.42`, `ZOOM_MIN = 7`, `ZOOM_MAX = 32`.
- **Drag formula:** `camTarget = dragStartAngle + (dx / window.innerWidth) * Math.PI * 0.6` — АБСОЛЮТНАЯ от `dragStartAngle`, не накопительная. Нормализованная на ширину окна: drag на полэкрана = поворот на 0.6π ≈ 108°.
- `mousedown` на canvas, `mousemove`/`mouseup` на window (drag не ломается при выходе курсора за canvas).
- **Wheel normalized:** `dir = Math.sign(e.deltaY); step = e.shiftKey ? 0.5 : 1.4; zoomTarget += dir * step` — не `deltaY * 0.02` (это ломалось на трекпадах с мелкой дельтой).
- **LookAt dynamic:** `lookY = 1.6 + heightRatio * 0.6` — взгляд приподнимается при отдалении.
- **Camera height dynamic:** `y = 2.2 + heightRatio * 4.5 + sin(angle * 2) * 0.3` — выше на дальнем зуме.
- **Idle auto-drift:** при отсутствии drag — `camTarget += sin(t * 0.15) * 0.0008` (лёгкое колыхание).
- `zoomDist` lerp factor: 0.10 (было 0.08 в исходном ТЗ, PATCH исправил по прототипу).
- `getIsDragging()` expose — используется в hover listener для блокировки hover во время drag.

### Raycaster + hover

- `createPicker(camera, targets, THREE)` создаётся один раз на scene. `pickAt(clientX, clientY)` возвращает объект из `targets` или null, поднимается по parent chain до target root.
- 8 clickable targets: heavyBag, terminal.group, wardenContainer, predatorContainer, plinth.group, scoreboard, clanBanner, shopLocker.
- Hover-scale lerp в PitScene.tick: `scale += (target - scale) * 0.15`, `userData.hoverScale = 1.04` при hover, `1.0` при уходе.
- Listener `pointermove` на canvas (не window — drag уже на window, hover за пределами canvas не нужен). Early-return при `orbit.getIsDragging()`.
- Labels словарь (8 ключей): training, matchmaking, create, ratings, clan, shop, warden, predator.

### HUD + click → PhModal

- `useHoverState` — shared reactive state для CanvasLayer (пишет) и PitViewV2 (читает). Идиома Vue 3 для siblings-топологии — альтернатива emit через common parent.
- `useClickState` — аналогично для кликов. Поле `seq` (counter) — чтобы `watch` срабатывал на повторный клик того же объекта (id может не меняться).
- `CanvasLayer.pointerdown` → сохраняет позицию. `pointerup` → если `dist < 5px` от down (= click, не drag) → `picker.pickAt` → `pickClick(id)`.
- `PitViewV2.vue` имеет `watch` на `click.seq` → `hud.value.openPhModal(id)`.
- `HudPit.vue` хранит `MODAL_CONTENT` (9 ключей: 8 объектов + avatar), `defineExpose({ openPhModal })`.
- `PhModal.vue` использует `Teleport to="body"` (чтобы z-index не зависел от родителя), слушает Esc через `window.addEventListener` на watch(`open`).

---

## Проверки

- [x] `npm run build` зелёный на каждом из 17 шагов + 4 hot-fix (4726 → 4749 modules, ~40s каждый билд)
- [x] Vercel зелёный после каждого коммита (подтверждено пользователем)
- [x] Drift test на fighter idle: 2+ минуты на `/v2`, кулаки не уплывают — подтверждено пользователем после Шага 9
- [x] Визуальная проверка полной сцены: ринг, 2 бойца, 6 интерактивов, толпа, пыль, балки, лампы, тени — подтверждено пользователем
- [x] Функциональная проверка Шага 7: drag, wheel zoom, auto-drift работают — подтверждено
- [x] Функциональная проверка Шага 16: hover + scale + WorldHint на 8 объектах — подтверждено
- [x] Функциональная проверка Шага 17: клик по всем 8 объектам открывает PhModal с правильными текстами, ×/Esc/backdrop закрывают, drag не триггерит click — подтверждено

---

## Расхождения с ТЗ — все осознанные

Всё зафиксировано в ходе работы, ничего не «молча чинилось».

### Hot-fixes после моих (пользователя) неточностей в ТЗ

1. **FOV 50° → 45°** (Шаг 3). В прототипе 45° (строка 5056). В ТЗ было «50°» по памяти. Hot-fix `e651ed3`.
2. **Fog: `Fog(0x070811, 5, 25)` → `FogExp2(0x070811, 0.028)`** (Шаг 3). В прототипе FogExp2 (экспоненциальный). В ТЗ было Fog (линейный) — скопировано из Эпика 1, в Эпике 1 само было неточно. Hot-fix заодно починил долг Эпика 1. `e651ed3`.
3. **`renderer.shadowMap.enabled = true` + `PCFSoftShadowMap`** (Шаг 3). Без этого `castShadow` на key-свете давал ничто. В ТЗ Шага 3 не оговорил. Hot-fix `e651ed3`.
4. **Plinth shaft НЕ должен вращаться** (Шаг 12). В ТЗ было «shaft.rotation.y = t * 0.05» — я перепутал с `shaftPink.rotation.y = t * 0.05` из прототипа, но `shaftPink` — это volumetric light shaft из 6774-6778, совсем другой объект. Plinth shaft в прототипе статичен. Hot-fix `63f4994`. **Claude Code поймал это сам**, честно отметил в отчёте.

### Патч Шагов 5-9 (подготовлен превентивно после аудита)

После Шага 3 Claude Code самостоятельно отметил 3 неточности ТЗ → пользователь заказал превентивный аудит Шагов 4-9 → собрано 9 неточностей в `PATCH_EPIC2_STEPS_5_8.md`:
- Шаг 5: ground fog X/Z разброс (22×22, не «радиус 12»), Y `random*0.6` (не 0.3-7.5), параметры PointsMaterial (color/size/opacity/blending)
- Шаг 6: 2 отдельные concrete-текстуры (platformTex repeat 1,1 + floorTex repeat 6,6), нельзя reuse одну
- Шаг 7: drag formula от `dragStartAngle` (не -= dx*0.005), `lookY = 1.6 + hr*0.6` (не статично 1.5), zoom lerp 0.10 (не 0.08), wheel `sign * step` (не deltaY * 0.02), listeners на window (не canvas)
- Шаг 8: `addArchetypeGlow` через canvas-градиент (не emissive CircleGeometry), idle loop в прототипе уже починен (`=`, не `+=`)
- Шаг 9: fighters в arena group (или scene — эквивалентно)

### Архитектурные решения Claude Code (разумные)

- **`useHoverState` + `useClickState` composables вместо `emit`** (Шаги 16, 17). CanvasLayer и PitViewV2 — siblings в AppV2, стандартный emit требовал бы 3 прыжка через AppV2. Vue 3 идиома. **Принято**.
- **`pointermove` на canvas, не window** (Шаг 16). Drag уже на window (Шаг 7), hover за пределами canvas бессмыслен. **Принято**.
- **6 интерактивных объектов в `scene.add`, не `arena.add`** (Шаги 10-15). В прототипе они в `env.add` (environment group), у нас все в scene напрямую — логически объекты вне ринга, arena dispose их не затрагивает. **Принято**.
- **MODAL_CONTENT расширен на avatar** (Шаг 17). Если пользователь кликнет YV в TopBar — откроется модалка «Profile coming soon» вместо мёртвого клика. **Принято**.
- **`scoreboard.lookAt(0, 2.2, 0)` внутри `buildScoreboard` до return** (Шаг 13). Group можно добавлять куда угодно без 2-шаговой инициализации. **Принято**.

### Процессные расхождения

- **Шаг 8 (fighterModel) закоммичен пользователем вручную через GitHub UI** из-за трёх последовательных Stream timeout на Claude Code при попытке Write файла 585 строк. Коммит `ab1d431` от пользователя (имя коммита — «Update fighterModel.js», не по формату `epic2: step8 — ...`). Файл — точный перенос из прототипа 6051-6414 + 6420-6486 + 6643-6667, собранный в Claude.ai.
- **`EPIC1_FINAL_REPORT.md` загружен пользователем** вручную через GitHub UI (коммит `029b664`), потому что в Эпике 1 он был только в чате, не в репо.

---

## Уроки для Эпика 3

1. **Большие файлы (400+ строк) — разбивать на подшаги или готовить заранее через пользователя.** Stream timeout срабатывает на одиночном Write > ~400 строк. `fighterModel.js` в Эпике 2 решён пользователем через GitHub UI — это штатный обход. В Эпике 3 заранее оценивать размер каждого нового файла и, если большой, либо дробить на подшаги (создать skeleton → наполнять блоками через Edit), либо готовить через Claude.ai + GitHub UI.

2. **Аудит ТЗ перед стартом шагов.** В Эпике 2 после Шага 3 вылезли 3 неточности ТЗ, и был проведён превентивный аудит Шагов 4-9 → ещё 9 неточностей найдено и записано в PATCH_. Без аудита — было бы 12 hot-fix коммитов, с аудитом — 4. В Эпике 3 аудит ТЗ каждых 5-7 шагов **обязателен** до старта.

3. **Композаблы (shared reactive state) — штатный паттерн для siblings-топологии.** CanvasLayer ↔ PitViewV2 не в parent-child отношениях. В Эпике 3 любой новый сценарий коммуникации между компонентами вне иерархии — сразу через composable, не через emit через common parent.

4. **Claude Code не доверять слепо своим наблюдениям о прототипе.** Случай с plinth shaft: Claude Code сам поймал что plinth shaft в прототипе статичен, и правильно указал на мою ошибку. Но в других случаях (если бы не поймал) — грозит молчаливое расхождение. Для любого «в прототипе делают X» — проверять через grep с точным именем переменной.

5. **`npm run build` локально перед каждым коммитом** — правило из Эпика 1, в Эпике 2 соблюдалось 24/24. Ни одного красного Vercel-билда.

6. **Vercel статус подтверждает пользователь** — правило из Эпика 1, в Эпике 2 соблюдалось. Claude Code не имеет доступа к Vercel API.

7. **`@/` алиас для динамических импортов** — правило из Эпика 1, в Эпике 2 не понадобилось (все импорты в fighterModel/PitScene/и др. — относительные `../objects/`, `./common/`, static).

8. **Осознанные архитектурные отклонения — в отчёт, не молча.** В Эпике 2 Claude Code 5+ раз отмечал отклонение в отчёте своего шага: композаблы, scene vs arena add, lookAt внутри builder'а и т.д. Правильная практика, продолжать в Эпике 3.

---

**Конец отчёта.**
