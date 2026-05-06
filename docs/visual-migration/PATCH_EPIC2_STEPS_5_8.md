# PATCH — уточнения к ТЗ Эпика 2, Шаги 5/6/7/8

**Когда применять:** перед Шагом 4. Шаг 4 идёт без изменений.
**Источник:** аудит прототипа `hexlash_v24.html` после Шага 3.
**Причина:** в исходном ТЗ (`PROMPT_EPIC2_FOR_CLAUDE_CODE.md`) параметры были указаны по памяти/приблизительно, прототип даёт точные значения.

Все патчи — **заменяют** соответствующие блоки исходного ТЗ. Остальные требования Шагов не меняются.

---

## Патч к Шагу 5 — Ground fog и crowd

**Заменить** блок про ground fog:

> Ground fog — 80 точек с `PointsMaterial`, дрейф вверх в tick
> `BufferGeometry` с `Float32Array(80*3)`
> Точки рандомно раскинуты в радиусе 12 от центра, Y от 0.3 до 7.5

**На:**

> **Ground fog** (прототип строки 6016-6031):
> - Count: 80
> - Распределение: `x = (random-0.5)*22`, `y = random()*0.6`, `z = (random-0.5)*22` (квадрат 22×22, Y почти на полу, создаёт стелющийся пыльный слой, не колонну)
> - `BufferGeometry` + `Float32Array(80*3)` + `setAttribute('position', ...)`
> - Material: `PointsMaterial({ color: 0x665570, size: 0.25, transparent: true, opacity: 0.35, depthWrite: false, blending: NormalBlending })`
> - Вернуть `{ dustGeom, points }` для tick
>
> **Drift в tick** (прототип 7241-7246):
> - `positions[i*3+1] += 0.003 + Math.sin(t + i) * 0.001`
> - Reset: `if (positions[i*3+1] > 7.5) positions[i*3+1] = 0.3`
> - `dustGeom.attributes.position.needsUpdate = true`

**Остальное в Шаге 5 — как в исходном ТЗ** (crowd breathing, rim pulse — те формулы были верные).

---

## Патч к Шагу 6 — Arena, две concrete-текстуры

**Заменить** в блоке «В `PitScene.js`»:

> Создать материалы заранее: `const concreteTex = makeConcreteTexture(THREE); concreteTex.repeat.set(1,1);` — передать в arena
> Floor уже был в Шаге 3 — **убрать оттуда**, теперь floor из arena.js

**На:**

> **Две разные concrete-текстуры** (прототип 5192 и 5206 — делает `makeConcreteTexture()` дважды):
> - `platformTex = makeConcreteTexture(THREE)` — `repeat.set(1, 1)`, для платформы ринга (single-tile mapping)
> - `floorTex = makeConcreteTexture(THREE)` — `repeat.set(6, 6)`, для бетонного пола комнаты (тайлинг 6×6)
>
> **НЕ переиспользовать одну текстуру с разным `repeat`** — `repeat` меняет глобальное состояние текстуры, она будет применяться к обоим объектам. Если создавать одну текстуру — её нужно `.clone()` перед сменой repeat.
>
> **Подход:** создавать обе текстуры в `PitScene.js`, передавать в `buildArena(scene, THREE, { platformTex, floorTex })`.
>
> Floor из Шага 3 — удалить из `PitScene.js`, теперь floor — внутри `arena.js` с `floorTex`.
>
> Для Шагов 12 (plinth), 14 (clanBanner) — им тоже нужна `concrete`-текстура для базы/плинта. Варианты:
> - Переиспользовать `platformTex` (repeat 1,1) — визуально подходит для небольших баз
> - Создавать новую текстуру в каждом объекте
>
> **Решение:** переиспользовать `platformTex`. В `PitScene.js` хранить её и прокидывать в `buildPlinth(THREE, concreteTex)` / `buildClanBanner(THREE, concreteTex)`.

---

## Патч к Шагу 7 — Orbit camera (drag + wheel)

**Критичный шаг — заменить весь блок `interaction/cameraController.js`.**

**Заменить:**

> `interaction/cameraController.js`:
>   - `export function attachOrbit(camera, canvas)` → возвращает `{ detach, tick }`
>   - State: `camAngle`, `camTarget`, `zoomDist`, `zoomTarget`, `isDragging`
>   - Константы: `ZOOM_DEFAULT = Math.sqrt(11*11 + 16*16)` (≈19.4), `ZOOM_MIN = 7`, `ZOOM_MAX = 32`
>   - Pointer events на canvas:
>     - `pointerdown` → `isDragging = true`, сохранить startX
>     - `pointermove` → если dragging, `camTarget -= dx * 0.005`
>     - `pointerup`/`pointerleave` → `isDragging = false`
>   - Wheel event: `zoomTarget = clamp(zoomTarget + e.deltaY * 0.02, ZOOM_MIN, ZOOM_MAX)`, `preventDefault`
>   - `tick(t)`:
>     - `camAngle += (camTarget - camAngle) * 0.06`
>     - Если не drag: `camTarget += Math.sin(t * 0.15) * 0.0008` (лёгкое автоколыхание)
>     - `zoomDist += (zoomTarget - zoomDist) * 0.08`
>     - ...
>     - `camera.lookAt(0, 1.5, 0)`

**На (всё по прототипу 6800-6850 + 7037-7059):**

> `interaction/cameraController.js`:
>   - `export function attachOrbit(camera, canvas)` → возвращает `{ detach, tick, getIsDragging }`
>   - State: `camAngle = 0`, `camTarget = 0`, `zoomDist = ZOOM_DEFAULT`, `zoomTarget = ZOOM_DEFAULT`, `isDragging = false`, `dragStartX = 0`, `dragStartY = 0`, `dragStartAngle = 0`, `dragMoved = false`
>   - Константы: `ZOOM_DEFAULT = Math.sqrt(11*11 + 16*16)` (≈19.4), `ZOOM_MIN = 7`, `ZOOM_MAX = 32`
>
>   **Drag handlers** (прототип 7037-7059):
>   - `mousedown` **на canvas**:
>     ```
>     isDragging = true;
>     dragStartX = e.clientX;
>     dragStartY = e.clientY;
>     dragStartAngle = camTarget;
>     dragMoved = false;
>     ```
>   - `mousemove` **на window** (не canvas — чтобы drag не ломался при выходе за границы):
>     ```
>     if (isDragging) {
>       const dx = e.clientX - dragStartX;
>       const dy = e.clientY - dragStartY;
>       if (Math.hypot(dx, dy) > 5) dragMoved = true;
>       camTarget = dragStartAngle + (dx / window.innerWidth) * Math.PI * 0.6;
>     }
>     // else-ветка (hover) — делается в Шаге 16
>     ```
>   - `mouseup` **на window**:
>     ```
>     // click-detection (dragMoved=false + isDragging=true) — делается в Шаге 17
>     isDragging = false;
>     ```
>
>   **Wheel zoom** на canvas (прототип 6840-6846):
>   ```
>   canvas.addEventListener('wheel', (e) => {
>     e.preventDefault();
>     const dir = Math.sign(e.deltaY);
>     const step = e.shiftKey ? 0.5 : 1.4;
>     zoomTarget = clamp(zoomTarget + dir * step, ZOOM_MIN, ZOOM_MAX);
>   }, { passive: false });
>   ```
>   **Не** `e.deltaY * 0.02` — разные устройства дают разные масштабы дельты (трекпад vs мышь), нормализация через `Math.sign` обязательна.
>
>   **`tick(t)` — точно по прототипу 6817-6830 + 7222-7228**:
>   ```
>   // smooth angle lerp
>   camAngle += (camTarget - camAngle) * 0.06;
>   // idle auto-drift when not dragging
>   if (!isDragging) camTarget += Math.sin(t * 0.15) * 0.0008;
>   // smooth zoom lerp
>   zoomDist += (zoomTarget - zoomDist) * 0.10;  // <-- 0.10, не 0.08
>   const r = zoomDist;
>   camera.position.x = Math.sin(camAngle) * r;
>   camera.position.z = Math.cos(camAngle) * r;
>   // height scales with zoom
>   const heightRatio = (r - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
>   camera.position.y = 2.2 + heightRatio * 4.5 + Math.sin(camAngle * 2) * 0.3;
>   // look-at also lifts with zoom
>   const lookY = 1.6 + heightRatio * 0.6;
>   camera.lookAt(0, lookY, 0);
>   ```
>
>   `getIsDragging()` — возвращает текущий `isDragging` (нужно в Шаге 16 чтобы hover не срабатывал во время drag).
>
>   `detach` — снять все listeners (canvas и window).

**Touch / pinch zoom** — **не делаем в Эпике 2**. Это Эпик 5 (mobile support).

---

## Патч к Шагу 8 — FighterModel

**Две мелкие поправки:**

### 1. `addArchetypeGlow` — canvas-градиент, не эмиссивный круг

**Заменить:**

> `export function addArchetypeGlow(fighterGroup, THREE, hexColor)` — диск под бойцом, emissive, `CircleGeometry(0.8, 32)` или как в прототипе 6643-6680

**На:**

> `export function addArchetypeGlow(fighterGroup, THREE, hexColor)` — диск под бойцом через canvas-градиент, **точно по прототипу 6643-6667**:
> - Canvas 256×256
> - Radial gradient от центра: `rgba(r,g,b, 0.7)` → 0.35 `rgba(r,g,b, 0.3)` → 1.0 прозрачный
> - `CanvasTexture`, `MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide })`
> - `PlaneGeometry(0.85, 0.85)`, `rotation.x = -π/2`, `position.y = 0.01`
> - `disc.userData.isArchGlow = true` (для возможного удаления в будущем)
> - Добавить в `fighterGroup.add(disc)`

### 2. Drift-bag уже починен в прототипе

**В моём ТЗ Шага 8 было предостережение:**

> `export function registerIdleFighter(group, phaseOffset)` — но с **модифицированным idle**: НЕ `+=`, а **сначала snapshot базовых позиций**...

**Уточнение:**

Прототип строк 6420-6485 уже делает snapshot через `entry.base` **правильно** (через `=` не `+=`). Drift-баг, описанный в HANDOFF_FIGHTER_MODEL.md, в прототипе уже устранён. **Переносить идеально 1-в-1 из прототипа** — никаких «модификаций», ничего доделывать не нужно.

Проверка всё равно остаётся: после Шага 9 оставить `/v2` на 2+ минуты и убедиться, что кулаки не уплывают. Если улетели — значит где-то ошибка при переносе (пропущена строка с `entry.base.X + offset`, стоит `+=`).

---

## Патч к Шагу 9 — бойцы добавляются в `arena` группу

**Уточнение, не замена.**

В прототипе (строка 6682):
```
arena.add(wardenContainer);
arena.add(predatorContainer);
```

Контейнеры — **в группе `arena`**, не прямо в `scene`. Это связано с тем, что в прототипе `arena` = `THREE.Group` созданная в начале `buildArena`.

**Как делать у нас:** в `buildPitScene` создаётся один общий root (можно прямо `scene`). `buildArena` добавляет свою группу в переданный scene. Бойцы добавляются в `scene` напрямую (упрощение, визуально эквивалентно).

Или, если хотим быть точными к прототипу — `buildArena` возвращает `arenaGroup`, и бойцы добавляются в неё: `arenaGroup.add(wardenContainer)`.

**Решение:** как проще. Визуально это неотличимо, влияет только на порядок traversal при dispose. Claude Code выбирает сам.

---

## Итог патча

| Шаг | Что меняется |
|-----|-------------|
| 4 | Ничего, идёт как в исходном ТЗ |
| 5 | Ground fog: распределение X/Z 22×22, Y 0..0.6, параметры `PointsMaterial` добавлены |
| 6 | Две отдельные concrete-текстуры (`platformTex`, `floorTex`), Floor перенесён в arena.js |
| 7 | Drag: абсолютная формула от `dragStartAngle`. LookAt: `lookY = 1.6 + hr*0.6`. Zoom lerp: 0.10. Wheel: нормализованный `sign * step`. Listeners на window. |
| 8 | `addArchetypeGlow` = canvas-градиент. Idle loop переносить 1-в-1 из прототипа (уже починен). |
| 9 | Бойцы — в `arena` group или в `scene`, на выбор. |

**Touch/pinch zoom** — не в Эпике 2.

**Начинать Шаг 4 без изменений**, применить патч перед Шагами 5, 6, 7, 8, 9.
