# HANDOFF — Hexlash Visual Migration v2

Документ для старта работы в новом чате. Содержит весь контекст, принятые решения, план, правила работы и первое ТЗ.

**Создан:** 2026-04-19
**Источник:** Эпик 0 завершён, см. `VISUAL_MIGRATION_PLAN.md`
**Текущее состояние:** план утверждён, ответы на все вопросы получены, готовы стартовать Эпик 1.

---

## 1. Контекст задачи

### Что хотим сделать

Полный переезд визуала Hexlash на концепцию из прототипа `hexlash_v24.html`. Прототип — 13 132 строки standalone HTML + inline Three.js r128, который представляет собой **3D-игру с UI-оверлеями**, где:

- Главный экран (hub) — 3D-комната с рингом в центре, вокруг расставлены интерактивные 3D-объекты (мешок, терминал, табло, банер клана, locker, 2 бойца).
- Клик по 3D-объекту → камера делает punch-zoom → открывается другая сцена (Training, Matchmaking, Ratings, Clan, Shop, Fighter Detail).
- Всего 10 canvas-сцен, переключаются через CSS-классы на `<body>`.
- Поверх каждой сцены — DOM HUD с информацией и контролами.
- Эффекты: film grain, scanlines, vignette, fog, blur-переходы между сценами.

Все существующие фичи прода (Auth, Wallet, Friends, AI Trainer, Challenges, Achievements, 11 языков, Belt system, Club Mode, Referral, Spectate и т.д.) **остаются** и встраиваются в эту новую 3D-концепцию.

### Решения пользователя (зафиксированы, не пересматриваются)

| # | Вопрос | Решение |
|---|---|---|
| 1 | Ветка для работы | `visual-v2` от `main` |
| 2 | Стратегия выката | **Feature flag `/v2`** — параллельно живут старый и новый визуал, пользователь заходит на `hexlash.com/v2` чтобы увидеть новое. Когда всё готово — убираем флаг, `/v2` становится дефолтом. |
| 3 | Shop в v1 | Объект (locker) видимый в hub, клик открывает «Coming soon» оверлей |
| 4 | Club Mode маппинг | Captain = первый боец в hub, остальные агенты Fight Club = дополнительные фигуреры вокруг ринга (до 6 по Club level) |
| 5 | (дубль 3) | — |
| 6 | Auth | Отдельная 3D-сцена для `/auth/*` (концепция «дверь/замок»), RainView удаляется |

### 145 PNG-скинов (решение из §4.4.1 плана)

Убираются из fighter-рендера. Остаются как profile-avatar fallback. Каждый из 6 архетипов (Predator/Sentinel/Ghost/Analyst/Maverick/Juggernaut) получит свой 3D-variant в `makeFighterLowPoly`. Сейчас есть 2 (warden/predator) — нужно дорисовать 4 новых. Это задача Эпика 4.

### Mobile / Telegram WebApp

v1 таргетит desktop + современный мобильник. Для слабых устройств fallback на простой 2D UI — не в скоупе, это Эпик 7+ или позже.

---

## 2. Стратегия feature flag `/v2`

**Как это работает:**

- Пользователь открывает `hexlash.com` → старый визуал (как сейчас).
- Пользователь открывает `hexlash.com/v2` → новый визуал (то, что строим).
- Оба живут параллельно в одной кодовой базе, в ветке `visual-v2`.
- Переключение — через роутинг: префикс `/v2` в URL активирует новый визуал.
- Весь новый код изолирован: новые views, компоненты, стили, scene-слой — отдельная параллельная структура.
- Когда всё готово — префикс `/v2` убирается, новый визуал становится дефолтом, старый удаляется.

**Что это даёт:**

- Прод продолжает работать, пока пишем новое.
- Можно мерджить частичный прогресс в `main` — он не затронет пользователей без `/v2`.
- Лёгкий rollback при проблемах: просто не даём ссылку на `/v2`.
- Тестирование на реальных данных без риска сломать прод.

**Реализация (детали для Эпика 1):**

- В `router/index.js` добавить префикс-guard: если URL начинается с `/v2`, монтируется `AppV2.vue` вместо `App.vue`. Либо все v2-роуты регистрируются отдельно с префиксом `/v2/*`.
- Старый `App.vue` остаётся нетронутым.
- Новый `AppV2.vue` — без BottomMenu, без старого header, с `<CanvasLayer>` и новым HUD.
- Все новые компоненты/views в отдельных директориях (см. §4), чтобы не конфликтовали со старыми.

---

## 3. Архитектура (целевая)

```
App.vue (старый, остаётся как есть)
  ├─ Logo + header
  ├─ router-view (старые views)
  ├─ BottomMenu
  └─ toasts

AppV2.vue (новый, для /v2/*)
  ├─ <CanvasLayer>        ← единый Three.js renderer, все 10 сцен переключаются
  │   ├─ sceneRegistry: Map<sceneId, {scene, camera, onEnter, onLeave}>
  │   └─ render loop
  ├─ <router-view>         ← DOM HUD'ы поверх canvas
  ├─ <GlobalOverlays>     ← grain, scanlines, vignette, loader, notif-panel, ph-modal
  └─ <GlobalToasts>       ← challenges, clan invites, info, error
```

**Ключевая идея:** один renderer, много сцен. При смене роута переключается активная scene+camera, renderer продолжает рисовать без reinit. Это даёт плавные blur-переходы как в прототипе.

---

## 4. Структура новых файлов

```
/src
  AppV2.vue                       — новый root для /v2/*
  router/v2.js                    — отдельные v2-роуты

  scene/                          ← 3D-слой
    CanvasLayer.vue               — единый canvas + renderer + render loop
    sceneRegistry.js              — Map всех сцен, активация/деактивация
    renderLoop.js                 — global tick
    cameras.js                    — preset camera configs

    materials/
      concrete.js                 — makeConcreteTexture
      metal.js                    — makeMetalTexture
      noise.js                    — makeNoiseTexture

    objects/
      fighterModel.js             — makeFighterLowPoly, registerIdleFighter, tickIdleAnimations, unregisterIdleFighter
      arena.js                    — ring + cage
      environment.js              — walls, ceiling, beams, lamps, crowd, dust
      heavyBag.js                 — interactable bag + pendulum physics
      terminal.js                 — matchmaking terminal
      plinth.js                   — create-new-fighter plinth
      scoreboard.js               — ratings scoreboard
      clanBanner.js               — clan banner
      shopLocker.js               — shop locker
      branchColumn.js             — Speed/Power/Tech columns in Fighter Detail
      hologramFighter.js          — translucent fighter for Create scene
      authDoor.js                 — дверь/замок для auth сцены

    scenes/
      AuthScene.js
      PitScene.js                 — hub
      FighterDetailScene.js
      FightScene.js
      CreateScene.js
      TrainingScene.js
      ProfileScene.js
      RatingsScene.js
      MatchmakingScene.js
      ClanScene.js
      ShopScene.js

    interaction/
      raycaster.js                — pickAt, hover tracking
      cameraController.js         — drag, zoom, punch-zoom
      projectToScreen.js          — DOM label tracking over 3D objects

  components/hud/                 ← DOM HUD'ы (new)
    HudAuth.vue
    HudPit.vue
    HudFighterDetail.vue
    HudFight.vue
    HudCreate.vue
    HudProfile.vue
    HudTraining.vue
    HudRatings.vue
    HudMatchmaking.vue
    HudClan.vue
    HudShop.vue

    common/
      TopBar.vue                  — resources + coach + title + notif + avatar
      WorldHint.vue               — tooltip over hover 3D object
      NotificationPanel.vue       — tabs All/Challenges/Clan/Friends
      NotificationToast.vue
      PhModal.vue                 — placeholder-modal (Coming soon)
      GlobalOverlays.vue          — grain + scanlines + vignette + loader + verify-banner
      Reveal.vue                  — fade-in animation wrapper

  views-v2/                       ← тонкие views, каждая = HUD + регистрация сцены
    AuthViewV2.vue
    PitViewV2.vue
    FighterDetailViewV2.vue
    FightViewV2.vue
    CreateViewV2.vue
    ProfileViewV2.vue
    TrainingViewV2.vue
    RatingsViewV2.vue
    MatchmakingViewV2.vue
    ClanViewV2.vue
    ShopViewV2.vue

  styles/
    hexlash-v24.css               — новая дизайн-система (только для /v2)
    v24/
      tokens.css                  — :root переменные (fonts, colors, spacing)
      effects.css                 — grain/scanlines/vignette/blur/reveal
      components.css              — .res, .phase-card, .ph-modal, .notif-panel и т.д.
```

**Ничего из текущего `/src` не удаляется в течение Эпиков 1-5.** Удаление старого — только в финальном Эпике 6, когда `/v2` становится дефолтом.

---

## 5. Правила работы (от пользователя)

Скопированы из первого сообщения пользователя. Соблюдать строго.

### Источник правды
- Код > CLAUDE.md
- При расхождении — CLAUDE.md устарел. Фиксируй и обновляй, не работай по устаревшим данным.

### Воркфлоу задачи

**1. ПОЛУЧИЛ ТЗ:**
- Прочитать `CLAUDE.md`
- Прочитать файлы из ТЗ и связанные
- Запустить агентов для незнакомых областей
- Дать краткий отчёт: как понял задачу / план шагами / риски
- **Ждать подтверждения. Без подтверждения не начинать.**

**2. ВЫПОЛНЕНИЕ:**
- Маленькими шагами, по одному
- После каждого шага — короткий статус
- Если вылезает что-то не покрытое ТЗ → СТОП. Зафиксировать, ждать решения. Не «чинить по дороге».
- Расхождение с CLAUDE.md — фиксировать в отчёте, не молча править.

**3. ПОСЛЕ ВЫПОЛНЕНИЯ:**
- Краткий отчёт: что сделано / какие файлы изменены / что проверить вручную / расхождения с CLAUDE.md
- Обновить CLAUDE.md, если задеты архитектурные части. Это часть задачи, не отдельный шаг.

### Агенты — когда запускать

Обязательно для:
- Поиск/grep по >5 файлам
- Аудит/сверка нескольких файлов
- Чтение незнакомой области кода
- Любая задача с >10 ожидаемыми tool calls
- Параллельные независимые подзадачи (в одном сообщении)

Не нужен для:
- Точечная правка одного известного файла
- Простой ответ на вопрос
- Линейная задача из 2-3 шагов

### Формат отчётов
- Кратко, по пунктам, без воды
- Без «конечно, я с радостью», «великолепная задача», «надеюсь поможет»
- Если что-то пошло не так — честно, не прятать
- **Простой язык.** Никаких рассуждений «feature flag vs hard-cutover» без пояснения что это.

### Критические правила
- Не выходи за рамки ТЗ
- Не доверяй памяти — проверяй через код или CLAUDE.md
- «Локально работает» — не доказательство
- Расхождения — фиксировать, не молча править

---

## 6. Текущее состояние проекта (ключевые факты)

**Стек:**
- Frontend: Vue 3.5, Vite 7, Vuex 4, Vue Router 4, Vuetify 2, Three.js, Howler.js, Ethers.js 6, кастомный i18n (11 языков), Amplitude
- Backend: Express 4, Prisma 5 (PostgreSQL), JWT, ws, Anthropic SDK
- Web3: Wagmi, WalletConnect, Coinbase Wallet, Base chain

**Текущий визуал (старый):**
- Дизайн-система `--hex-*` в `/src/styles/hexlash-ui.css`
- Шрифты: Anonymous, AnonymousBalance
- 45 pixel icons в `/src/data/pixelIcons.js` (Currently unused — не референсятся)
- 5 Hex* UI-компонентов (HexButton/HexCard/HexProgress/HexBadge + BeltBadge/UserCaptainBadge)
- 20 views, 75+ компонентов
- BottomMenu (Arena/Training/Ratings/Profile)
- 145+ PNG-скинов в `/public/images/skins/`
- Three.js используется только в Punch3D.vue (мешок) и RainView.vue (дождь)
- Бойцы в бою/меню — PNG через `Fighter.vue`

**Что сохраняется после миграции** (после удаления старого в Эпике 6):
- Все Vuex модули (13)
- Backend API (не трогаем)
- WebSocket протокол (не трогаем)
- Prisma schema (не трогаем)
- i18n инфраструктура (добавятся новые ключи)
- Combat engine (PvE + PvP)
- AI Trainer (Claude API)
- Deep-links / роутинг с auth guards

---

## 7. Прототип — ключевые факты

**Файл:** `hexlash_v24.html` (в project knowledge + uploaded)
**Размер:** 13 132 строки (4194 CSS + остальное HTML+JS)
**Three.js:** r128 (через CDN). **НЕ r150+ как в HANDOFF_FIGHTER_MODEL.md** — там ошибка.

**10 сцен (canvas-ов):**

| # | Сцена | Canvas | Билдер (строка) |
|---|---|---|---|
| 1 | Pit (hub) | `#scene` | 5040 |
| 2 | Fighter Detail | `#sceneFD` | 7958 (openFighterDetail) |
| 3 | Fight | `#sceneFight` | 8621 (openFight) |
| 4 | Create | `#sceneCreate` | 9262 (openCreate) |
| 5 | Profile | `#sceneProfile` | 9461 (openProfile) |
| 6 | Training | `#sceneTraining` | 9972 (openTraining) |
| 7 | Ratings | `#sceneRatings` | 10325 (openRatings) |
| 8 | Matchmaking | `#sceneMM` | 10803 (openMatchmaking) |
| 9 | Clan | `#sceneClan` | 11173 (openClan) |
| 10 | Shop | `#sceneShop` | 12713 (openShop) |

**8 интерактивных 3D-объектов в hub:**
- Warden (боец #1) → Fighter Detail
- Predator (боец #2) → Fighter Detail
- Heavy bag (`userData.id = 'training'`) → Training — строка 5574
- Terminal (`matchmaking`) → Matchmaking — 5643
- Plinth «+» (`create`) → Create — 5708
- Scoreboard (`ratings`) → Ratings — 5807
- Clan banner (`clan`) → Clan — 5906
- Shop locker (`shop`) → Shop — 6013

**CSS-система прототипа:**

```css
:root {
  --hex-primary: #FF066F;  /* совпадает с проектом */
  --bg-deep: #070811;
  --bg-panel: rgba(14,16,28,0.85);
  --text-dim: rgba(255,255,255,0.5);
  --text-mid: rgba(255,255,255,0.75);
  --font-display: 'Archivo Black', system-ui, sans-serif;
  --font-body: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Глобальные эффекты:** `.grain` (SVG fractal noise overlay), `.vignette` (radial-gradient), `.scanlines` (repeating linear), `.view` transitions (opacity 0.55s + blur 10px).

**Bug warning из HANDOFF_FIGHTER_MODEL.md:**
1. В idle loop fighterModel — не `+=` а `=` для fist/forearm/shoulder/knee позиций, иначе drift через ~20 сек.
2. `torsoGeo.scale(1, 1, 0.60)` — без этого спина выпирает.
3. Перчатки тёмные (`0x2a2d34`), не цвет архетипа.
4. `MeshStandardMaterial` везде, никакого `flatShading: true`.
5. Контракт 22 children в fighter group — порядок `g.add(...)` менять нельзя.

---

## 8. План эпиков (утверждён)

### Эпик 1 — Foundation
**Задача:** каркас для всей миграции. Новый визуал пока не виден пользователю.

**Шаги:**
1. Создать ветку `visual-v2` от `main`.
2. Проверить версию Three.js в `package.json`, зафиксировать рабочую.
3. Реализовать feature flag `/v2`:
   - Добавить в `router/index.js` префикс-guard или отдельные v2-роуты.
   - Создать `AppV2.vue` (пустой пока).
4. Создать `/src/styles/hexlash-v24.css` (токены из §7 + эффекты grain/scanlines/vignette). Подключать только в AppV2.
5. Создать `/src/scene/CanvasLayer.vue` — единый Three.js canvas с пустой сценой (просто пол + стены + fog для проверки).
6. Создать `/src/scene/sceneRegistry.js` и `/src/scene/renderLoop.js` — каркас.
7. Смонтировать `<CanvasLayer>` в `AppV2.vue`.
8. Тестовый роут `/v2` — показывает пустую комнату с туманом.

**Выход Эпика 1:** пользователь открывает `hexlash.com/v2` → пустая 3D-комната с туманом + grain/scanlines. Ничего не кликается, HUD нет. Старый `hexlash.com` работает как обычно. Основа готова.

**Что НЕ делаем в Эпике 1:**
- Не удаляем старый UI, BottomMenu, Punch3D, Fighter.vue
- Не трогаем старый App.vue и роуты
- Не переносим бойцов, ринг, интерактивные объекты (это Эпик 2)

### Эпик 2 — Hub scene
Главный экран с рингом, бойцами, интерактивными объектами. HUD Pit. Клик по объекту открывает ph-modal «Coming soon».

### Эпик 3 — Sub-scenes (каркас)
Все 9 остальных сцен — 3D-фон + каркас HUD с моками. Навигация работает full circle.

### Эпик 4 — Data binding
Все HUD подключаются к реальным Vuex/API/WS. Моки удалены. Тут же — 4 новых variant в `makeFighterLowPoly` для остальных архетипов.

### Эпик 5 — Missing features
Web3 wallet в Profile, AI Trainer в result-overlay, Spectate режим в Fight, Referral модалка, Verify email banner, onboarding, 3D auth сцена (дверь/замок), Help overlay, sound toggle, i18n всех новых строк в 11 языках.

### Эпик 6 — Финал
Убираем префикс `/v2` (новый визуал становится дефолтом). Удаляем старый UI, views, CSS, компоненты, BottomMenu, Punch3D, Fighter.vue. Обновляем CLAUDE.md. Тестирование, mobile/responsive, performance audit, deploy.

**Оценка:** 27-43 рабочих дня чистой работы, реально 2-3 месяца с багфиксами и ревью.

---

## 9. Риск-реестр (12 пунктов)

| # | Риск | Влияние | Митигация |
|---|---|---|---|
| R1 | Три.js перф в Telegram WebApp | High | v1 desktop-first, fallback позже |
| R2 | 10 сцен × один renderer — хватит FPS? | High | Единый renderer, дробить при проблемах |
| R3 | 145 PNG → 6 архетипов | Medium | Эпик 4: 4 новых variant в fighterModel |
| R4 | Расхождение API полей vs mock | Medium | Эпик 4: gap-matrix по каждой view |
| R5 | Конфликт Three.js Punch3D/RainView | Medium | Эпик 1: один renderer, старые удаляются в Эпике 6 |
| R6 | Vue Router vs body-class навигация | Medium | Router остаётся, body-class вспомогательный |
| R7 | Объём: 6 эпиков × недели | High | Работа в ветке `visual-v2`, feature flag |
| R8 | i18n: все строки прототипа EN | Medium | Эпик 5: вытащить в 11 локалей |
| R9 | SEO / deep-links | Low | Router остаётся → URL тоже |
| R10 | Прототип r128 vs актуальный Three.js | Medium | Эпик 1: проверить совместимость |
| R11 | 175 функций прототипа → Vue | High | Эпик 3: разбиение по §4 |
| R12 | Удаление старого ломает тесты | Medium | Эпик 6: обновить тесты |

---

## 10. Первое ТЗ (Эпик 1) — для стартового сообщения в новом чате

```
ТЗ: Эпик 1 — Foundation для визуальной миграции на v24.

Предпосылки:
- Весь контекст, план, решения — в /mnt/user-data/uploads/HANDOFF_VISUAL_MIGRATION.md
- План в /mnt/user-data/uploads/VISUAL_MIGRATION_PLAN.md
- Прототип в /mnt/user-data/uploads/hexlash_v24.html
- Все решения пользователя утверждены, НЕ пересматривать

Задача Эпика 1:
1. Создать ветку visual-v2 от main (или убедиться, что она уже создана — проверить)
2. Проверить версию Three.js в package.json, зафиксировать рабочую
3. Реализовать feature flag /v2 — новые роуты с префиксом /v2/*
4. Создать AppV2.vue (минимальный — только CanvasLayer)
5. Создать /src/styles/hexlash-v24.css — токены (fonts, colors) + эффекты
   (grain, scanlines, vignette). Подключается ТОЛЬКО в AppV2
6. Создать /src/scene/CanvasLayer.vue — единый Three.js canvas, пустая
   комната (пол + стены + fog)
7. Создать /src/scene/sceneRegistry.js + /src/scene/renderLoop.js — каркас
8. Тестовый роут /v2 — открывается, показывает пустую 3D-комнату

Критерии готовности:
- hexlash.com/ — старый визуал работает как обычно (ничего не сломано)
- hexlash.com/v2 — пустая 3D-комната с туманом + grain/scanlines поверх
- Ничего из существующего кода не удалено
- CLAUDE.md обновлён: новая секция "v2 Migration" с описанием структуры

Правила работы — в HANDOFF, секция 5. Строго соблюдать.

Стартуй с краткого отчёта (как понял / план шагов / риски) и жди подтверждения.
```

---

## 11. Инструкции для Claude в новом чате

**Первое действие:** прочитать этот HANDOFF полностью. Второе — прочитать `VISUAL_MIGRATION_PLAN.md` для деталей. Третье — прочитать `CLAUDE.md` из проекта.

**Что важно понимать:**

- Пользователь общается на **простом языке**. Никаких англицизмов без пояснения. Если использую термин — сразу объяснить.
- Пользователь **утверждает** шаги, а не пишет код сам. Мой отчёт должен быть понятен без дополнительных пояснений.
- Вопросов в каждом шаге — **минимум**. Только критичное для принятия решения. Если я могу решить сам по плану — решаю сам.
- Работаю **маленькими шагами**. После каждого шага — короткий статус. Не ломлюсь вперёд на весь эпик.
- **Не выхожу за рамки ТЗ.** Если во время работы вижу что-то постороннее — фиксирую, но не чиню.
- Документ плана (`VISUAL_MIGRATION_PLAN.md`) и этот HANDOFF — **источник правды** для миграции v2. При расхождении с CLAUDE.md — приоритет у плана (пока миграция не завершена).

**Что НЕ делать:**

- Не пересматривать решения пользователя из §1 и §2 без явного запроса.
- Не начинать кодить без подтверждения плана шагов.
- Не обещать сроки.
- Не галлюцинировать факты о проекте — проверять через `project_knowledge_search` или чтение кода.
- Не писать длинные рассуждения — по делу, по пунктам.

---

## 12. Ссылки на документы для следующего чата

В начале нового чата пользователь должен прикрепить:

1. **`HANDOFF_VISUAL_MIGRATION.md`** — этот документ (контекст, решения, правила)
2. **`VISUAL_MIGRATION_PLAN.md`** — детальный план миграции (из Эпика 0)
3. **`hexlash_v24.html`** — прототип (исходник визуала)
4. **`HANDOFF_FIGHTER_MODEL.md`** — спека на fighter model (пригодится в Эпике 2-4)

Плюс будет доступ к project knowledge проекта Hexlash — там CLAUDE.md, все skill-файлы, код.

---

## 13. Стартовое сообщение для нового чата

Скопировать-вставить:

```
Привет. Начинаем Эпик 1 визуальной миграции Hexlash на концепцию v24.

Прикладываю 4 документа:
- HANDOFF_VISUAL_MIGRATION.md — полный контекст, решения, правила
- VISUAL_MIGRATION_PLAN.md — детальный план миграции
- hexlash_v24.html — прототип визуала (источник)
- HANDOFF_FIGHTER_MODEL.md — спека на 3D-модель бойца

Первое действие — прочитай HANDOFF_VISUAL_MIGRATION.md целиком.
Затем прочитай VISUAL_MIGRATION_PLAN.md и CLAUDE.md из проекта.

После этого возьми ТЗ Эпика 1 (секция 10 в HANDOFF) и дай отчёт:
- как понял задачу
- план шагов
- риски/расхождения

Жди подтверждения, не начинай кодить.

Говори простым языком. Если используешь технический термин — поясняй.
```

---

**Конец HANDOFF.**
