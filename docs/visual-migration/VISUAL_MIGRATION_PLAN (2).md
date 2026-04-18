# Visual Migration Plan — Hexlash → v24 Prototype

**Статус:** draft · Эпик 0
**Источники:** `hexlash_v24.html` (13 132 строки, standalone HTML + inline Three.js r128), текущий проект (Vue 3 SPA + Vuex + Router), `CLAUDE.md`, `HANDOFF_FIGHTER_MODEL.md`.
**Решение пользователя:** полный переезд на визуал прототипа. Все фичи прода остаются, недостающие в прототипе — встраиваются в 3D.

---

## 1. Ключевая идея прототипа

**Это не «сайт с 3D-вставками». Это 3D-игра с UI-оверлеями.**

- Всё приложение = 10 full-screen canvas-сцен, у каждой свой Three.js renderer/scene/camera.
- Навигация между сценами — переключение CSS-классов на `<body>` (`body.is-detail`, `body.is-fight`, `body.is-training` и т.д.).
- Неактивные сцены размываются (opacity 0.12, blur 8px), активная — opacity 1.
- Главный hub (`pit-view`) = комната с рингом в центре, вокруг расставлены **интерактивные 3D-объекты** (мешок, терминал, табло, банеры и т.д.). Клик по объекту → камера делает punch-zoom (подлёт к объекту) → переключение на соответствующую сцену.
- Поверх каждой сцены — HUD (DOM-элементы) с статистикой, кнопками, панелями.
- Три pointer-events оверлея поверх всего: `.grain` (film grain), `.scanlines`, `.vignette`.

**Дизайн-язык:** editorial/industrial. Шрифты Archivo Black (display), Space Grotesk (body), JetBrains Mono (mono), Instrument Serif (accent). Палитра: глубокий `#070811`, primary pink `#FF066F` (совпадает с текущим), acid yellow/cyan/pink для архетипов.

---

## 2. Инвентарь прототипа

### 2.1 10 сцен (canvas-ов)

| # | Сцена | Canvas | Функция-билдер | 3D-содержимое |
|---|---|---|---|---|
| 1 | **Pit (hub)** | `#scene` | строки 5040–6800 | Ринг 8-угольник, пол/потолок/стены, 4 балки, 3 лампы, толпа-силуэты, пыль, мешок, терминал, «+» постамент, табло, клан-баннер, locker, 2 бойца |
| 2 | **Fighter Detail** | `#sceneFD` | `openFighterDetail` 7958 | Подиум, один боец (warden/predator), 3 «колонны веток» (Speed/Power/Tech) вокруг — кликабельны |
| 3 | **Fight** | `#sceneFight` | `openFight` 8621 | Компактный ринг, 2 бойца, анимация punch/hit, 3 режима камеры (Pit/Side/Cinema) |
| 4 | **Create Fighter** | `#sceneCreate` | `openCreate` 9262 | Пустой подиум, «голографический» силуэт бойца, «материализация» при подтверждении |
| 5 | **Profile** | `#sceneProfile` | `openProfile` 9461 | Просто 3D-фон (ambient, ближе к статичному) + DOM-панели поверх |
| 6 | **Training** | `#sceneTraining` | `openTraining` 9972 | Крупный тяжёлый мешок в центре, физика маятника, click-to-hit, комбо |
| 7 | **Ratings** | `#sceneRatings` | `openRatings` 10325 | 3D-фон (минимальный), DOM-таблица leaderboard |
| 8 | **Matchmaking** | `#sceneMM` | `openMatchmaking` 10803 | Терминал в 3D, DOM-фильтры и результаты поиска |
| 9 | **Clan** | `#sceneClan` | `openClan` 11173 | Клановый баннер в 3D, DOM-панели с составом/статой |
| 10 | **Shop** | `#sceneShop` | `openShop` 12713 | Locker в 3D, DOM-сетка товаров + детали |

Общий паттерн: **3D-фон + DOM-HUD поверх**. Сложность 3D разная (от «просто ambient» в Ratings до полноценной боевой сцены в Fight).

### 2.2 Интерактивные 3D-объекты в hub (pit-view)

Все клики на hub — через raycasting, `userData.id` на объекте:

| Объект | `userData.id` | Действие при клике | Строка |
|---|---|---|---|
| Warden (боец #1) | — (проверка по container) | → Fighter Detail (warden) | 6706 |
| Predator (боец #2) | — (проверка по container) | → Fighter Detail (predator) | 6711 |
| Тяжёлый мешок | `training` | → Training | 5574 |
| Терминал | `matchmaking` | → Matchmaking | 5643 |
| «+» постамент | `create` | → Create Fighter | 5708 |
| Табло | `ratings` | → Ratings | 5807 |
| Клан-баннер | `clan` | → Clan | 5906 |
| Locker | `shop` | → Shop | 6013 |

**Всего 8 входов из hub.** Плюс аватар (`avatarBtn`) в HUD — DOM-кнопка, ведёт в Profile (строка 9471). Плюс notification (`notifBtn`) — открывает notification panel (DOM).

### 2.3 DOM-оверлеи (HUD), по каждой сцене

**Pit HUD:**
- Top-bar: Gold/Energy/ELO resources, Coach hint, Pit-title (kicker + «THE PIT» + meta), Siege card, Notification button, Avatar button.
- Bottom: logo «HEX**LASH**», hint «DRAG/SCROLL/CLICK».
- Right rail: zoom controls (+/−/↺/♪).
- Fighter badges — DOM, позиционируются над 3D-бойцами через `projectToScreen`.
- World-hint tooltip — при hover на кликабельном объекте.

**Detail HUD:** back-btn, fd-top (kicker/name/meta), fd-resources (Taps/Free XP), fd-stats (Fights/WR/ELO/ToYellow), 3 branch-label'а (Speed/Power/Tech) трекаются к 3D-колоннам, выезжающая справа branch-panel для прокачки.

**Fight HUD:** fight-top (2 бойца + имя/арх/HP/HP-num, round X/5), cam-switcher (Pit/Side/Cinema), back, spectate-badge, fight-log, coach-pause (aggressive/defensive/counter), prep-overlay (deck/strategy/stake/start), result-overlay (kicker/title/summary + rematch/exit).

**Create HUD:** back, stepper (Archetype→Name→Confirm), create-panel (контент по шагу).

**Profile HUD:** back, title, 4 карточки — Identity (avatar/handle/wallet/belt/clan/email), Performance (stats 6 чисел + achievements 5/16), Friends (search/+Add/tabs All/Online/Pending/list), Settings (Language 11 кнопок, Sound toggle, Build version, Logout).

**Training HUD:** back, counter (taps earned), energy-bar, 2 daily-tasks (hit 100, combo 5), combo-multiplier, hint.

**Ratings HUD:** back, title, season-tabs (Season1/AllTime), panel (filter-tabs Global/Friends/Clan/Country/Live + search + table Rank/Handle/Archetype/Belt/ELO/WL/WR/Streak) + sticky your-row.

**Matchmaking HUD:** back, title, filters (ELO range slider + archetype chips + belt chips), 2 phases: searching (spinner + status + cancel) vs results (candidates + rescan + fight).

**Clan HUD:** back, title, demo-toggle (noclan/inclan). Two states: no-clan (hero + create-btn + browse-grid), in-clan (header + level/XP bar + stats 4 шт + side panel About/Info/actions + roster table).

**Shop HUD:** back, title, balance-chips (Taps/XP/Base), tabs (All/Skins/Gloves/Boosts/Titles/Banners), grid + detail panel.

**Global overlays:** loader «Entering the pit», verify-email banner, notification panel (tabs All/Challenges/Clan/Friends), onboarding overlay (подсветка элементов), placeholder-modal (ph-modal для «coming soon»), backdrop.

### 2.4 CSS-система прототипа (4 194 строки)

**Токены (`:root`):**
- `--hex-primary: #FF066F` (совпадает с проектом)
- `--bg-deep: #070811`
- `--bg-panel: rgba(14,16,28,0.85)`
- `--text-dim`, `--text-mid`
- 4 шрифта: `--font-display` (Archivo Black), `--font-body` (Space Grotesk), `--font-mono` (JetBrains Mono), Instrument Serif упомянут в link, но в CSS не заведён.

**Глобальные эффекты:**
- `.grain` (SVG fractal noise, mix-blend-mode overlay, 3.5% opacity)
- `.vignette` (двойной radial-gradient)
- `.scanlines` (repeating linear gradient)
- `.hud` contract (fixed inset 0, z-index 50, pointer-events none с `> * { pointer-events: auto }`)
- `.view` transitions (opacity 0.55s + blur 10px)

**Компоненты:** `.res`, `.coach`, `.pit-title`, `.siege`, `.fighter-badge`, `.world-hint`, `.branch-label`, `.branch-panel`, `.fight-top`, `.cam-switcher`, `.coach-pause`, `.phase-overlay`, `.phase-card`, `.prep-deck-slots`, `.strat-card`, `.stake-btn`, `.fd-*`, `.create-stepper`, `.profile-card`, `.id-*`, `.fc-*`, `.training-*`, `.ratings-*`, `.rt-*`, `.mm-*`, `.mmf-*`, `.clan-*`, `.nc-*`, `.ic-*`, `.shop-*`, `.ph-modal`, `.notif-panel`, `.np-*`, `.verify-banner`, `.loader`, `.zoom-controls`, `.reveal` (анимация появления).

### 2.5 Структура Three.js-кода (175 функций)

**Общие хелперы:** `makeNoiseTexture`, `makeConcreteTexture`, `makeMetalTexture`, `makeBeam`, `makeHangingLamp`, `makeCrowdFigure`, `makeLightShaft`, `makeFighterLowPoly` (warden/predator), `registerIdleFighter`, `tickIdleAnimations`, `addArchetypeGlow`.

**Hub-специфичные:** `buildFighters`, `updateCam`, `setZoom`, `nudgeZoom`, `pickAt`, `onPointerMoveHover`, `openModal`, `handleClickAt`, `projectToScreen`, `buildAudio`, `setMuted`, `tick`, `revealHud`.

**Detail-специфичные:** `fdPick`, `fdHoverHandle`, `rebuildColumnHeight`, `spawnShockwave`, `renderBranchPanel`, `openBranchPanel`, `closeBranchPanel`, `openFighterDetail`, `closeFighterDetail`, `fdProjectToScreen`, `fdTick`, `fdLoop`.

**Fight-специфичные:** `getFighterParts`, `snapshotParts`, `playMove`, `applyAnim`, `tickAnims`, `setCamMode`, `updateFightCamera`, `logFight`, `flashHit`, `updateHpBars`, `updateRoundDisplay`, `doExchange`, `runRound`, `showCoachPause`, `openFight`, `openPrep`, прочее prep-management.

**Create:** open/close, holo-fighter materialize, step state machine, archetype data + name generator.

**Profile:** openProfile, HUD interactions, friends render.

**Training:** heavy-bag physics (pendulum sim), `tryHit`, combo tracking, energy mgmt, procedural hit sound, HUD sync, openTraining, tick/loop.

**Ratings:** data mock, render table, handlers (filter/search/sort), openRatings, tick/loop.

**Matchmaking:** filters, search logic (спиннер + поиск), candidates render, `fdPick` аналог, openMatchmaking.

**Clan:** state toggle (noclan/inclan), render grid/roster, openClan/closeClan.

**Shop:** render balance/grid/detail, purchase, categories, openShop/closeShop.

**Global utils:** loader, onboarding, notifications (emitMock, toast, chime, panel), spectate, live matches render, friends counts/render.

---

## 3. Инвентарь прода

### 3.1 20 views (Vue SFC)

| View | Route | Функция | 3D? |
|---|---|---|---|
| `RainView.vue` | `/auth/*`, `/` | Login/Signup/Reset/Telegram auth + 3D rain | ✅ (rain) |
| `ArenaHubView.vue` | `/arena` | Split: Fight (pink) vs Club (green) | ❌ |
| `PreparationView.vue` | `/arena/fight` | Mode selector + START FIGHT + Friends | ❌ |
| `FightClubView.vue` | `/arena/club` | Агенты клуба, роспись, morning report | ❌ |
| `CreateAgentView.vue` | `/arena/club/create` | 2-step wizard (name+skin → confirm) | ❌ |
| `AgentDetailView.vue` | `/arena/club/:agentId` | 4 tabs: Overview/Moves/Tactics/Fights | ❌ |
| `CardFightView.vue` | `/fight` | Основной бой PvE+PvP | ❌ (2D HP/dice/cards) |
| `TrainingView.vue` | `/training` | Мешок + taps + daily tasks | ✅ (punch bag) |
| `MoveTreeView.vue` | `/training/moves` | Дерево движений, 3 ветки × 6 | ❌ |
| `DeckBuilderView.vue` | `/training/deck` | Сборка колоды 4-8 движений | ❌ |
| `ProfileView.vue` | `/profile/*`, `/user/:login` | balance/wallet/account/skins | ❌ |
| `ClanView.vue` | `/clan/:id` | Clan page с табами Members/Activity/Settings | ❌ |
| `RatingsView.vue` | `/ratings/:type` | 4 таба: MyClub/Clubs/Fighters/Agents | ❌ |
| `FriendsView.vue` | `/friends` | Список, запросы, поиск | ❌ |
| `MatchmakingView.vue` | `/matchmaking` | Поиск PvP через WS | ❌ |
| `SpectateView.vue` | `/spectate/:odId` | Смотреть чужой бой | ❌ |
| `PageView.vue` | `/help`, `/rules` | Static v-html pages | ❌ |
| `AutoFightLogView.vue` | `/arena/autofight-log` | Лог серии auto fight + AI analysis | ❌ |

### 3.2 Критичные фичи, привязанные к views

- **Auth** (4 формы в RainView) + 3D rain background
- **Web3 кошелёк** (ProfileView/Wallet): Wagmi, WalletConnect, Coinbase, injected + ConnectWallet modal
- **Referral system** (QR + share) через `ReferralModal.vue` из ProfileView
- **Achievements** (16 штук, карточка в Profile)
- **Daily/Social tasks** (в Training)
- **AI Trainer** (пост-бой анализ через Claude) в CardFightView и AutoFightLogView
- **Notifications**: ChallengeNotification, ClubInviteNotification — top-of-screen тосты через WS
- **Club Mode Agent system** (4 view: FightClub + CreateAgent + AgentDetail + ClubLevelBar + RetirementPanel)
- **Belt system** (33 пояса + Hexmaster) — BeltBadge, UserCaptainBadge
- **11 языков** i18n (11 наборов строк)
- **Spectate** (смотреть чужой PvP)
- **Help/Rules** статические страницы

### 3.3 Vuex модули (13) — остаются как есть

`masterState`, `userState`, `cardFightState`, `progressionState`, `clanState`, `taskState`, `punchState`, `achievementState`, `contractState`, `webSocketState`, `pvpState`, `friendsState`, `agentState`.

**Все остаются.** Переезд визуала не трогает state/API/WS.

---

## 4. Gap Analysis

### 4.1 Прямой маппинг сцена прототипа → view прода

| Сцена прототипа | Прод view | Совпадение |
|---|---|---|
| Pit (hub) | ArenaHubView (split) | ❌ концепция другая. Hub прототипа заменит и ArenaHub и BottomMenu. |
| Fighter Detail | AgentDetailView или ProfileView | частичное — в AgentDetailView 4 таба, в прототипе только branch progression |
| Fight | CardFightView | частичное — combat engine совсем разный |
| Create Fighter | CreateAgentView | частичное — в прототипе 3 шага, в проде 2 |
| Profile | ProfileView | частичное — в прототипе 4 карточки, в проде 4 вкладки + больше полей |
| Training | TrainingView | частичное — есть 3D-мешок в обоих, но UI вокруг разный |
| Ratings | RatingsView | частичное — в проде 4 таба, в прототипе 5 фильтров |
| Matchmaking | MatchmakingView | близко |
| Clan | ClanView | близко (с расхождениями в полях) |
| Shop | нет | **новая view** — в проде shop отключён/удалён |

### 4.2 Что есть в проде и НЕТ в прототипе (требуют встраивания в 3D)

| Фича | Вариант встраивания |
|---|---|
| **Auth (Login/Signup/Reset/Telegram)** | Перед hub — отдельная 3D-сцена «вход в клуб»: тёмная дверь/замок, формы оверлеем. Остаётся RainView-стиль. |
| **Verify email banner** | Уже есть в прототипе (строка 4228) — переносим как есть. |
| **Help / Rules** | Books/тетрадь на столе администратора рядом с терминалом в hub? Или через settings в Profile. Предлагаю: **иконка «?» в top-bar HUD hub**, открывает оверлей с текстом (как ph-modal). |
| **Spectate** | В прототипе уже есть `.spectate-badge` в Fight HUD — значит, view `Spectate` = Fight-сцена в режиме «смотрю чужой». Интеграция — просто флаг на openFight. |
| **Friends** | В прототипе **уже есть** Friends card в Profile (строка 4667) + в Ratings фильтр `data-filter="friends"`. Достаточно. FriendsView как отдельная view удаляется. |
| **Challenges (PvP приглашения)** | В прототипе уже есть notification panel (`.notif-panel`) с табом Challenges. Используем. Top-of-screen challenge tost → встраивается как notification toast (`.notif-toast`, 4240). |
| **Web3 wallet / ConnectWallet** | В Profile Identity уже есть поле Wallet (клик → copy). **Добавить кнопку «Connect Wallet»** в Identity-карточку (в пустом состоянии поля). Модалка ConnectWallet становится DOM-overlay поверх Profile-сцены. |
| **Referral QR** | Иконка «share» в top-bar или в Profile Identity. Открывает модалку `ReferralModal`. |
| **Achievements 16** | В прототипе **уже есть** ach-grid в Performance карточке Profile. |
| **Daily tasks** | В прототипе уже есть в Training HUD (2 задачи). Добавить 3-4 по необходимости. |
| **Social tasks** | Вынести в отдельную карточку в Profile или в Training. Предлагаю: добавить третью карточку в Training HUD «Social Tasks» под «Daily Tasks». |
| **AI Trainer (пост-бой)** | В прототипе есть `resultOverlay` с resultSummary. Расширить: добавить кнопку «AI Analysis» которая загружает анализ Claude и показывает в расширенной секции phase-card. |
| **Club Mode Agents (весь Fight Club)** | **Это большая новая фича.** В прототипе 2 бойца в hub — это captain + первый юнит. Для Fight Club нужно: либо больше бойцов в hub (до maxAgents), либо отдельная сцена Fight Club = комната с ростером агентов. **Решение: расширить buildFighters в hub — показывать до 6 агентов вокруг ринга (зависит от Club level).** |
| **FightClub level progress / Morning Report** | DOM-карточка в hub HUD (вместо Siege card — «Fight Club · LVL 3»). Morning report = ежедневный toast через notification panel. |
| **Retirement (легенды клана)** | Кнопка «Retire Fighter» в Fighter Detail HUD. Оверлей ceremony. |
| **MoveTree / DeckBuilder** | В прототипе — это columns веток в Fighter Detail + prep-deck в Fight HUD. **MoveTree = sceneFD branch-panels** (уже есть). **DeckBuilder = prep-overlay deck slots** (уже есть). Отдельные views удаляются. |
| **Belt system (33 пояса + Hexmaster)** | В Profile Identity уже есть поле Belt, в Ratings — колонка Belt. Нужно добавить рендер SVG бейджа (BeltBadge) в 3 места. |
| **Captain system** | В Fighter Detail HUD уже `fd-kicker: «Captain · Warden»`. Нужен UI для смены капитана — кнопка в Fighter Detail. |
| **11 языков** | В прототипе `.lang-picker` уже есть в Settings (строка 4685). OK. |
| **Sound toggle** | В прототипе есть в Settings + в hud справа (`muteBtn`). OK. |
| **Onboarding** | В прототипе есть (`onbRoot` строка 4237) — подсветка элементов hub. Переносим логику. |
| **AutoFight** (toggle, series, scheduling) | В прототипе нет. Предлагаю: добавить в Fighter Detail tab «Tactics» (как в текущем AgentDetail). Или в Fight HUD prep — radio «Mode: manual / auto». |

### 4.3 Что есть в прототипе и НЕТ в проде

| Фича прототипа | Делать или пропустить |
|---|---|
| **Siege card** (top-right «CoC × HEXLASH») | **Пропустить** в v1. Позже — campaign/ивенты. |
| **Gold resource** | **Пропустить** — в проде есть только Taps/XP/Base (ETH). Gold в прототипе = те же Taps. |
| **Energy** | В проде есть? Если нет — добавить простую rate-limit систему позже. В v1 — не трогать, оставить UI в HUD но без backend. |
| **Shop / Locker** | **Пропустить в v1.** В CLAUDE.md: «BuyTokens temporarily disabled, preserved for Phase 2». Locker в hub делаем, но открывается `ph-modal` «Coming soon». |
| **Notifications panel с табами All/Challenges/Clan/Friends** | **Делать.** Есть в проде есть похожее (ChallengeNotification, ClubInviteNotification) — объединяем. |
| **Notification toast + sound** | Делать — объединяем текущие toasts в единый стиль. |
| **Country filter в Ratings** | Пропустить (в проде пока нет country в User). |
| **Season tabs в Ratings** | Пропустить (в проде нет season system). |

### 4.4 Продуктовые решения (зафиксированы)

Эти решения приняты пользователем и не пересматриваются без нового ТЗ:

1. **145 PNG-скинов.** В прототипе нет кастомных скинов — только 2 варианта 3D (warden/predator) + 6 архетипов. Решение: **все 145 PNG убираются из fighter-рендера** (низкоприоритетный debt), но остаются доступны как profile-avatar fallback. Архетипы (6) — каждый получает свой 3D-variant в `makeFighterLowPoly` (сейчас 2, нужно 4 новых). **Это отдельная задача в Эпике 4.**
2. **Mobile/Telegram WebApp.** 10 3D-сцен тяжёлые для webview на слабых Android. **Решение:** принять, что **v1 таргетит десктоп/современный мобильник**. Для слабых устройств — fallback на простой 2D UI позже (не в скоупе).
3. **Feature flag или hard-cutover.** Работа в отдельной ветке `visual-v2`, merge одним большим релизом после полной готовности. Альтернатива (query-param `?v=next`) — обсуждаема, но усложняет Vue Router.
4. **Three.js r128 vs проектная версия.** Прототип написан под r128 (CDN). В проекте нужно привести к единой версии. Решение будет в Эпике 1.

---

## 5. Маппинг 3D-объектов hub на существующие роуты

Текущий роутинг перестраивается. Таблица — как новая навигация ложится на старые роуты:

| 3D-объект в hub | Новая сцена | Заменяет роут(ы) |
|---|---|---|
| Captain (первый боец) клик | Fighter Detail (captain) | `/arena/club/:captainId` + частично `/training/moves` + `/training/deck` |
| Любой другой боец клик | Fighter Detail (agent N) | `/arena/club/:agentId` |
| Тяжёлый мешок | Training | `/training` |
| Терминал | Matchmaking | `/matchmaking`, `/arena/fight`, `/arena` |
| «+» постамент | Create Fighter | `/arena/club/create` |
| Табло | Ratings | `/ratings/*` |
| Клан-баннер | Clan | `/clan/:id`, `/arena/club` (FightClub merge в Clan и Hub) |
| Locker | Shop | (нет в проде — новый) |
| Avatar btn (HUD) | Profile | `/profile/*`, `/user/:login`, `/friends` (Friends в Profile card) |
| Notification btn (HUD) | Notification panel (оверлей) | — |
| Help «?» btn (HUD, добавить) | Help overlay | `/help`, `/rules` |

**Удаляемые views** (функционал поглощается другими): `ArenaHubView`, `PreparationView` (становится prep-overlay в Fight-сцене), `FightClubView` (сливается с Clan и hub), `MoveTreeView` (branch-panels в Fighter Detail), `DeckBuilderView` (prep-overlay в Fight), `FriendsView` (Friends card в Profile), `AutoFightLogView` (вкладка в Fighter Detail).

**Сохраняемые с рефакторингом:** `RainView` (auth), `CardFightView`, `TrainingView`, `ProfileView`, `ClanView`, `RatingsView`, `MatchmakingView`, `SpectateView`, `CreateAgentView`, `AgentDetailView`, `PageView` (help). Но каждая становится Vue-обёрткой вокруг `<ThreeScene>` компонента.

---

## 6. Целевая архитектура (proposed)

### 6.1 Общая схема

```
App.vue
├─ <CanvasLayer>      — единый Three.js renderer, renderLoop, fog, grain/scanlines/vignette
│   ├─ scenes: Map<sceneId, THREE.Scene>  — одна Three-сцена на view, активная переключается
│   └─ camera switcher — каждая view регистрирует свою камеру
├─ <router-view>      — DOM HUDs поверх canvas. Каждая view = HUD для своей сцены.
├─ <GlobalOverlays>   — grain, scanlines, vignette, loader, notif-panel, ph-modal, onboarding
└─ <GlobalToasts>     — challenge/clan-invite/info/error в едином стиле notif-toast
```

**Ключевая идея:** **один renderer, много сцен**. При смене роута — переключается активная `scene` и `camera`, renderer продолжает рисовать без reinit. Это даёт плавные переходы (как в прототипе через `body.is-*` классы + CSS blur transition).

### 6.2 Новые файлы/директории

```
/src
  scene/                 ← новая директория для 3D-слоя
    CanvasLayer.vue      — единый canvas + renderer + render loop
    sceneRegistry.js     — Map<sceneId, {scene, camera, onEnter, onLeave}>
    renderLoop.js        — global tick, вызывает registered tickers
    cameras.js           — preset camera configs per scene
    materials/
      concrete.js        — makeConcreteTexture (from prototype)
      metal.js           — makeMetalTexture
      noise.js           — makeNoiseTexture
    objects/
      fighterModel.js    — makeFighterLowPoly, registerIdleFighter, tickIdleAnimations, unregisterIdleFighter (из HANDOFF)
      arena.js           — buildArena (octagon ring + cage + platform)
      environment.js     — walls, ceiling, beams, lamps, crowd, dust
      heavyBag.js        — bag with pendulum physics
      terminal.js        — matchmaking terminal interactable
      plinth.js          — «+» create-new-fighter plinth
      scoreboard.js      — ratings scoreboard
      clanBanner.js      — clan-banner object
      shopLocker.js      — shop locker
      branchColumn.js    — 3 columns in Fighter Detail
      hologramFighter.js — создаваемый 3D fighter
    scenes/
      PitScene.js        — build() for hub
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
      raycaster.js       — pickAt, hoverTracking
      cameraController.js — drag/zoom/punch-zoom
      projectToScreen.js — DOM tracking over 3D objects

  components/hud/        ← новая директория для всех DOM-HUD
    HudPit.vue           — top-bar, bottom, zoom-controls, fighter-badges
    HudFighterDetail.vue — fd-top, fd-stats, branch-labels, branch-panel
    HudFight.vue         — fight-top, cam-switcher, fight-log, coach-pause, phase-overlays
    HudCreate.vue        — stepper, create-panel
    HudProfile.vue       — 4 cards (Identity/Performance/Friends/Settings)
    HudTraining.vue      — counter, energy, tasks, combo, hint
    HudRatings.vue       — title, season, tabs, table, your-row
    HudMatchmaking.vue   — filters, searching/results phases
    HudClan.vue          — noclan/inclan toggle, both states
    HudShop.vue          — balance, tabs, grid, detail
    (общие)
    TopBar.vue           — resources + coach + title + notif + avatar + siege (универсальный)
    WorldHint.vue        — tooltip over hover object
    NotificationPanel.vue — tabs + list + badge
    NotificationToast.vue — individual toast
    GlobalOverlays.vue   — grain + scanlines + vignette + loader + verify-banner
    Reveal.vue           — анимация `reveal` из прототипа

  styles/
    hexlash-v24.css      ← новая дизайн-система (замена hexlash-ui.css)
    tokens.css           — :root переменные (fonts, colors, spacing)
    effects.css          — grain/scanlines/vignette/blur/reveal
    components.css       — общие классы (.res, .phase-card, .ph-modal и т.д.)
```

**Удаляется:**
- `/src/styles/hexlash-ui.css` (заменяется на hexlash-v24.css)
- `/src/assets/colors.css` (legacy)
- `/src/components/ui/PixelIcon.vue`, `/src/data/pixelIcons.js` (45 pixel icons — не нужны, в прототипе нет pixel icons)
- `/src/components/ui/HexButton`, `HexCard`, `HexProgress`, `HexBadge`, `BeltBadge`, `UserCaptainBadge` (заменяются на новые классы/компоненты)
- `/src/components/Punch3D.vue` (перенести логику в `scene/scenes/TrainingScene.js`)
- `/src/components/Fighter.vue` (2D PNG) — заменяется 3D
- Views: `ArenaHubView`, `PreparationView`, `FightClubView`, `MoveTreeView`, `DeckBuilderView`, `FriendsView`, `AutoFightLogView`
- BottomMenu (полностью) — навигация через 3D-объекты и HUD-кнопки

**Обновляется:**
- `App.vue` — добавляется `<CanvasLayer>`, `<GlobalOverlays>`, удаляется BottomMenu
- `router/index.js` — удаляются роуты удалённых views, перенаправления на новые
- `main.js` — импорт новых стилей
- Остальные views становятся тонкими HUD-компонентами поверх своей 3D-сцены

### 6.3 Навигация

Vue Router **остаётся**. Каждая смена роута триггерит `sceneRegistry.activate(sceneId)` + CSS-класс на body (`is-detail`/`is-fight` и т.д.). Это сохраняет deep-links, back/forward кнопки, auth guards, fight state restore.

---

## 7. Декомпозиция на эпики

### Эпик 1 — Foundation (Three.js + дизайн-токены + CanvasLayer)
**Выход:** в App.vue отрисовывается единый canvas с Three.js, пустой hub-сцены (только фон + grain/scanlines/vignette). Токены v24 живут параллельно с hexlash-ui.css (оба работают). Старый UI не трогается.
- Апгрейд/фиксация версии Three.js
- Создать `hexlash-v24.css` (только tokens + effects, без компонентов)
- Создать `/src/scene/CanvasLayer.vue`, `sceneRegistry`, `renderLoop`
- Добавить `<CanvasLayer>` в App.vue за router-view с низким z-index
- Тестовая сцена `EmptyPitScene` — комната + fog, без интерактивов
- **Риск:** Three.js конфликт с Punch3D.vue и RainView.vue (они держат свои renderer'ы). Решение в эпике.

### Эпик 2 — Hub scene (pit-view) + интерактивные объекты
**Выход:** рабочий главный hub. Клик по объекту пока открывает placeholder-modal (ph-modal). HUD Pit работает. Старый ArenaHubView остаётся на роуте `/arena` — hub живёт на новом роуте `/hub` для изоляции.
- Перенести `scene/objects/`: arena, environment, lamps, crowd, dust
- Перенести `fighterModel.js` (HANDOFF)
- Перенести интерактивные объекты: heavyBag, terminal, plinth, scoreboard, clanBanner, shopLocker
- Перенести `interaction/raycaster.js`, `cameraController.js`
- HudPit.vue + TopBar + fighter badges + zoom-controls + world-hint
- **Риск:** производительность — 10 объектов + толпа + лампы + пыль.

### Эпик 3 — Sub-scenes (все 9 остальных сцен, только 3D-фон + каркас HUD)
**Выход:** клик по объекту в hub открывает реальную sub-сцену (пока с mock-данными). 3D каждой сцены готово, HUD в виде каркаса. Навигация работает full circle.
- Fighter Detail scene + branch columns + branch labels tracking
- Fight scene + 2 fighters + cam modes
- Create scene + holo fighter
- Training scene + heavy bag physics
- Ratings/Matchmaking/Clan/Shop — lite 3D + DOM HUD каркас
- Profile scene + DOM HUD каркас
- **Риск:** большой объём 3D-кода к портированию.

### Эпик 4 — Data binding + Vuex integration
**Выход:** все HUD-ы показывают РЕАЛЬНЫЕ данные из Vuex / API / WS. Моки удалены.
- Profile Identity / Performance / Friends / Settings — подключить к userState, achievementState, friendsState, masterState
- Fighter Detail — к agentState, progressionState
- Fight HUD — к cardFightState, combatEngine, pvpHandler
- Training — к taskState, progressionState, punchState
- Ratings — к /v1/ratings/*
- Matchmaking — к pvpState, WS pvpHandler
- Clan — к clanState
- Notification panel — agrego ChallengeNotification + ClubInviteNotification + WS events
- **Риск:** расхождение полей между mock прототипа и реальными API responses.

### Эпик 5 — Missing features встраивание
Всё из §4.2: Web3 wallet в Profile, AI Trainer в result-overlay, Spectate режим в Fight, Referral модалка, Verify email banner, onboarding, auth flow с 3D-door сценой, Help overlay, sound toggle, 11 языков i18n (все новые строки прототипа через `t.section.key`).

### Эпик 6 — Полировка + удаление старого
- Удалить старые CSS/компоненты/views (см. §6.2 «Удаляется»)
- Удалить роуты, которые больше не нужны
- Обновить CLAUDE.md под новую архитектуру
- Тестирование всех пользовательских сценариев
- Mobile/responsive проход
- Performance audit (FPS в hub и fight)
- AI Trainer, AutoFight, Club Mode end-to-end
- Production build + деплой test env

---

## 8. Риск-реестр

| # | Риск | Влияние | Митигация |
|---|---|---|---|
| R1 | Производительность Three.js в Telegram WebApp | High | В v1 десктоп-first. Добавить перф-монитор FPS. В Эпике 6 — fallback на простой бэк. |
| R2 | 10 3D-сцен × sharing renderer vs separate | High | Единый renderer (§6.1). Если не хватит FPS — дробить. |
| R3 | Миграция 145 PNG-скинов → архетипы | Medium | Решение принято (§4.4.1). Новая задача в Эпике 4 — 4 новых variant в `makeFighterLowPoly`. |
| R4 | Расхождение API полей vs mock прототипа | Medium | Эпик 4 — gap-matrix на каждую вью. |
| R5 | Конфликт Three.js в Punch3D/RainView во время миграции | Medium | Эпик 1 — один рендерер. Punch3D и RainView удаляются. |
| R6 | Vue Router vs body-class навигация | Medium | Router остаётся, body-class — вспомогательный для CSS-blur. |
| R7 | Объём работы: 6 эпиков × недели | High | Феча-фриз на прод во время миграции. Работа в ветке `visual-v2`. |
| R8 | i18n: все строки прототипа английский | Medium | Эпик 5 — вытащить всё в 11 локалей. Claude может делать переводы. |
| R9 | SEO / deep-links — сохранить? | Low | Router остаётся → URL-ы тоже. Меняется только рендер. |
| R10 | Прототип = r128, возможно баги с новыми Three.js версиями | Medium | Эпик 1 — проверить совместимость; либо закрепить r128, либо допилить под актуальную. |
| R11 | 175 функций прототипа → структурированный Vue-код | High | Эпик 3 — разбиение на модули по §6.2. |
| R12 | Удаление существующих views ломает все тесты | Medium | Эпик 6 — обновить тесты вместе с удалениями. |

---

## 9. Оценка объёма

Цифры — ориентировочные, не обязательство.

| Эпик | Масштаб | Оценка |
|---|---|---|
| 1 — Foundation | Низкий | 1-2 дня |
| 2 — Hub scene | Высокий | 4-7 дней |
| 3 — Sub-scenes (каркас) | Очень высокий | 10-15 дней |
| 4 — Data binding | Высокий | 5-8 дней |
| 5 — Missing features | Средний | 4-6 дней |
| 6 — Полировка + удаление старого | Средний | 3-5 дней |
| **Итого** | | **27-43 дня чистой работы** |

Это **5-8 недель** при нормальном темпе и **без неожиданностей**. Реальный срок с багфиксами, ревью и синхронизациями — **2-3 месяца**.

---

## 10. Что делать дальше

**Рекомендация:** утвердить документ и начать **Эпик 1**.

**Перед стартом Эпика 1 нужны ответы:**

1. **Ветка?** Создаю `visual-v2` от `main` и всю работу туда?
2. **Feature flag или hard-cutover?** Вариант с `?v=next` query-param обсуждаем?
3. **Shop** — в v1 делаем видимым (3D-locker в hub) с «Coming soon» оверлеем или скрываем локер до фазы 2?
4. **Club Mode мапинг.** Решение: captain = первый боец в hub, остальные агенты Fight Club = дополнительные фигуреры вокруг ринга (до 6 по уровню)? Подтверждаешь?
5. **Shop в v1:** оставляем объект в сцене с «Coming soon» или скрываем?
6. **Auth сцена.** Добавляем отдельную 3D-сцену для `/auth/*` (дверь/замок) или оставляем текущий RainView как есть?

После утверждения — стартую Эпик 1.

---

**История документа:**
- v0.1 (2026-04-19) — Эпик 0 draft, после глубокого чтения прототипа + инвентаря прода.
