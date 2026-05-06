# EPIC 1 — FINAL REPORT

**Дата закрытия:** 2026-04-19
**Ветка:** `visual-v2`
**Статус:** ЗАКРЫТ. Визуально подтверждён пользователем на Vercel preview.

---

## Шаги и коммиты

| # | Что сделано | Коммит |
|---|-------------|--------|
| 1 | Ветка `visual-v2` от `main`, 5 документов в `docs/visual-migration/` | `a807597` |
| 2 | `CLAUDE.md` — новая секция `## v2 Migration` → `### Three.js` (r167 vs r128 прототипа) | `ef7cb9a` |
| 3 | Feature flag `/v2` в роутере + `isV2Route` в `App.vue`, скрыты 9 блоков старого UI | `bb850f1` |
| 4 | `AppV2.vue` skeleton + `GlobalOverlays.vue` + пустой `hexlash-v24.css` | `bacc817` |
| 5 | `hexlash-v24.css` + `v24/tokens.css` + `v24/effects.css` | `acdeb52` |
| fix | Router: `/src/AppV2.vue` → `@/AppV2.vue` (Rollup не резолвил абсолютный путь) | `e39e180` |
| fix | Stub `src/scene/CanvasLayer.vue` — разблокировать prod-билд до Шага 6 | `6b95e34` |
| 6 | `CanvasLayer.vue` — полноценный Three.js renderer: WebGLRenderer + Scene + fog + Camera + свет + пол + 4 стены + resize + cleanup | `b05d31f` |
| 7 | `sceneRegistry.js` + `renderLoop.js`. CanvasLayer регистрирует `'empty'`, активирует, запускает `startRenderLoop` | `89368b5` |
| 8 | `PitViewV2.vue` + child-роут + обновление `CLAUDE.md` | `ce8d5d6` |

**Всего коммитов:** 10 (8 шагов ТЗ + 2 hot-fix).

---

## Файлы

**Созданы (11):**
- `docs/visual-migration/` — 5 handoff-документов + `.gitkeep`
- `src/AppV2.vue`
- `src/components/hud/common/GlobalOverlays.vue`
- `src/styles/hexlash-v24.css`, `src/styles/v24/tokens.css`, `src/styles/v24/effects.css`
- `src/scene/CanvasLayer.vue`, `src/scene/sceneRegistry.js`, `src/scene/renderLoop.js`
- `src/views-v2/PitViewV2.vue`

**Изменены (3):**
- `src/router/index.js` — массив `v2Routes` с парой `/v2` → `AppV2` → `PitViewV2`
- `src/App.vue` — computed `isV2Route`, `v-if="!isV2Route"` на 9 блоках
- `CLAUDE.md` — секция `## v2 Migration` (полная), актуализация `## Branch (Git)`

---

## Технические детали

### Роутинг
- В `src/router/index.js` — массив `v2Routes` с родителем `/v2` → динамический импорт `@/AppV2.vue`, дочерний `''` → `PitViewV2`. Подключён в общий `routes` перед catch-all. Auth-guard его не трогает.

### App.vue
- Computed `isV2Route` = `route.path.startsWith('/v2')`.
- Скрыто 9 блоков через `v-if="!isV2Route"`: `<header>`, `<Info>`, `<Error>`, `<NoConnection>`, `<NewAchievement>`, `<ChallengeNotification>`, `<ClanInviteNotification>`, `<footer>` (+ ещё один глобальный overlay). `<main><RouterView/></main>` не трогали — через него рендерится AppV2.

### AppV2.vue
- `.app-v2` root: `position: fixed; inset: 0; overflow: hidden`.
- Внутри: `<CanvasLayer>` (async) + `<router-view>` + `<GlobalOverlays>`.
- Импорт `@/styles/hexlash-v24.css` — только в AppV2.

### Стили (изоляция от старого)
- Токены (`--hex-primary`, `--bg-deep`, `--bg-panel`, `--text-dim`, `--text-mid`, `--font-display`, `--font-body`, `--font-mono`) — под селектором `.app-v2`, не `:root`.
- `@import` Google Fonts (Archivo Black / Space Grotesk / JetBrains Mono) — на уровне файла.
- Эффекты (`.grain` / `.scanlines` / `.vignette`) префиксованы `.app-v2 .X`.
- Z-index по прототипу: grain (200) > scanlines (160) > vignette (150) > UI (50). Все три — `pointer-events: none`.
- SVG fractal noise и два радиал-градиента скопированы из прототипа 1-в-1 (строки 32–53).

### Three.js scene
- Renderer: `WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })`.
- `setPixelRatio(min(dpr, 2))`, `setSize(innerWidth, innerHeight)`.
- Scene background `0x070811`, `Fog(0x070811, 5, 25)`.
- PerspectiveCamera(50°, aspect, 0.1, 100), позиция `(0, 2, 8)`, `lookAt(0, 1, 0)`.
- Свет: `AmbientLight(0x14141c, 0.4)` + `HemisphereLight(0x1c1820, 0x06060c, 0.3)`.
- Пол: `BoxGeometry(20, 0.2, 20)`, `MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.9 })`, `y = -0.1`.
- 4 стены: `PlaneGeometry(20, 10)`, материал `0x12131a roughness: 1.0 DoubleSide`, `y = 5`.
- Resize listener обновляет `camera.aspect` + `renderer.setSize`.
- `beforeUnmount`: `stopRenderLoop()` → listener off → `renderer.dispose()` → `forceContextLoss()`.

### Scene Registry
- `src/scene/sceneRegistry.js`: `Map<sceneId, { scene, camera, onEnter?, onLeave?, tick? }>`. API: `registerScene`, `activateScene` (вызывает `onLeave` у предыдущей и `onEnter` у новой), `getActiveScene`, `tickAll`.
- `src/scene/renderLoop.js`: `startRenderLoop(renderer, THREE)` создаёт `THREE.Clock()`, запускает `setAnimationLoop(tick)`; `tick` вызывает `tickAll(t)` + `renderer.render(active.scene, active.camera)`. `stopRenderLoop` — чистый останов.
- В Эпике 1 зарегистрирована одна сцена `'empty'`.

---

## Проверки

- [x] `npm run build` локально зелёный на каждом из шагов 2-8 (4726 modules, ~36s)
- [x] Vercel зелёный на `b05d31f` (Шаг 6) — подтверждено пользователем
- [x] Vercel зелёный на `ce8d5d6` (Шаг 8) — подтверждено пользователем (зелёная галочка рядом с коммитом на GitHub)
- [x] Визуальная проверка в браузере на Vercel-preview `testhexlash-9f8gewl8s-evgeniis-projects-97f58a87.vercel.app/v2`:
  - `/v2 works` в левом верхнем углу шрифтом Archivo Black ✓
  - Тёмная 3D-комната с туманом ✓
  - Виньетка по углам ✓
  - Старая шапка HEXLASH / нижнее меню отсутствуют ✓
- [x] Корень preview (`/`) — старый сайт работает (экран логина с дождём и Fight Club) ✓

---

## Уточнения / расхождения к ТЗ (5 штук)

1. **Prod-vs-dev разрыв.** Динамические импорты должны использовать `@/` алиас (не `/src/`), и все целевые файлы должны существовать на момент билда (Rollup статически разбирает граф). Два hot-fix-коммита между шагами 5 и 6. Правило на всю миграцию: `npm run build` локально перед каждым коммитом.

2. **Stub CanvasLayer.** Между Шагами 4 и 6 `AppV2.vue` ссылался на несуществующий `CanvasLayer.vue`. Решено отдельным коммитом-стабом, перезаписано в Шаге 6. На Эпик 2+: если ТЗ создаёт разрыв между шагами — останавливаться и спрашивать, не пушить «by design ТЗ».

3. **Z-index эффектов.** ТЗ Шаг 5: `grain < scanlines < vignette < UI`. Прототип: `grain (200) > scanlines (160) > vignette (150) > HUD (50)`. Следуем прототипу (подтверждено пользователем). Все три — `pointer-events: none`.

4. **Скрываемые блоки в App.vue.** ТЗ Шаг 3 перечислял 7, по факту скрыто 9 (добавлены `NoConnection` и `NewAchievement`). Подтверждено.

5. **`<main>` / класс `.v2-host`.** Не потребовался: `.content` в `App.vue` закомментирован, глобальных правил нет, `.app-v2` = `position: fixed` — выходит из потока `<main>`. Проверка пройдена логически + подтверждена визуально (канвас на весь экран).

---

## Про CLAUDE.md

- Запись `Vue-i18n 11` в Tech Stack — в текущем `CLAUDE.md` уже стоит «Custom i18n (11 locales)» (строка 11) и «Custom reactive i18n (not vue-i18n)» (строка 545). Правка не потребовалась — **устаревшим был handoff-документ**, не CLAUDE.md.
- Старая dev-ветка `claude/hexlash-project-setup-WYkbK` и «Club Mode 109 commits ahead» — заменены на актуальное: `visual-v2` от `main`, Club Mode Phase 1 помечен `COMPLETE`.

---

## Что перенести в Эпик 2 как уроки

1. **`npm run build` локально перед каждым коммитом** — обязательно.
2. **Динамические импорты только через `@/`**.
3. **Если ТЗ создаёт разрыв между файлами** (A импортирует B, B будет позже) — **стаб сразу**, не "by design ТЗ".
4. **Vercel статус подтверждает пользователь** — Claude Code не имеет доступа к Vercel API.
5. **CLAUDE.md — источник правды**. При расхождении с handoff-документами — код/CLAUDE.md правы, handoff устарел.

---

**Конец отчёта.**
