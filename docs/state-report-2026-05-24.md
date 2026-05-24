# Hexlash — State Inventory Report

```
generated_at: 2026-05-24 (UTC), branch claude/hexlash-state-inventory-H0pXG
main_head: 460585a5dabff05db76a0429c662e86a145ef401 (origin/main, "Merge pull request #395 from evgenii-yps/test", 2026-05-24 02:51:31 +0300, evgenii-yps)
branch: claude/hexlash-state-inventory-H0pXG (= origin/main; local `main` ref is STALE at #383 / 2026-05-17)
node_version: v22.22.2 (npm 10.9.7)
total_files_scanned: 934 (git-tracked files)
```

> Чисто инвентаризация. Без рекомендаций, без gap-анализа. Где данные получить не удалось — пометка `[не удалось получить: причина]`.
> Дисклеймер по CLAUDE.md: ряд утверждений CLAUDE.md разошёлся с кодом (Vuetify 2→3, 11 локалей→только en, AI Trainer и т.д.) — в репорте фиксируется состояние **кода**, расхождения помечены.

---

## Раздел 1. Структура проекта

### Дерево верхнего уровня (3 уровня, без node_modules/dist/.git)

```
/ (repo root)
├── .github/workflows/        — CI (gitops.yaml)
├── backend/                  — Express + Prisma + ws backend
│   ├── prisma/
│   │   └── migrations/       — 27 migration dirs (init 20260312 … 20260518)
│   ├── scripts/              — backfill/cleanup/migration scripts (6 файлов)
│   ├── src/
│   │   ├── data/             — backend-копии game data (archetypes/branches/cardPower/moves)
│   │   ├── lib/              — prisma singleton
│   │   ├── middleware/       — auth, upload, x402
│   │   ├── routes/           — 10 Express route-файлов
│   │   ├── services/         — 19 бизнес-сервисов + templates/
│   │   ├── utils/            — helpers, clanEvents, clanLevel, migrationHelpers
│   │   └── websocket/        — handler.js, pvpHandler.js
│   └── tests/                — 8 node:test файлов
├── contracts/                — HexlashAgents.sol (ERC-1155 NFT агентов)
├── docs/                     — отчёты миграции, legacy-cleanup, investigations
├── public/                   — статика (images/skins и т.д.)
├── scripts/smoke-test/       — Playwright smoke (smoke.spec.js)
├── skills/                   — 12 Claude Code skill-папок
├── src/                      — Vue 3 фронтенд
│   ├── assets/               — abi/, brand/, fonts/, images/, models/, sound/, textures/
│   ├── components/           — переиспользуемые компоненты (по подпапкам)
│   ├── composables/          — useDocumentMeta, useScrollFadeIn
│   ├── core/                 — api/, data/, database/, engine/, mock/, models/, services/, state/, web3/, websocket/
│   ├── data/                 — game data (branches, moves, requirements, clanMock и т.д.)
│   ├── locales/              — i18n (en.js + index.js + pages/)
│   ├── router/               — index.js
│   ├── scene/                — Three.js слой: interaction/, materials/, objects/, scenes/
│   ├── styles/               — hexlash-ui.css + v24/
│   ├── utils/                — powerRating, beltDisplay и т.д.
│   ├── views/                — v1 page-компоненты + auth/
│   └── views-v2/             — 17 v2 page-компонентов (основной геймплей под /play)
└── (корневые конфиги)        — package.json, vite.config.js, jsconfig.json, index.html, Dockerfile, nginx.*.conf, vercel.json
```

### Точки входа

| Слой | Файл | Что делает |
|---|---|---|
| Фронт — entry | `src/main.js` | createApp + Vuetify (createVuetify) + router + Vuex store + WagmiPlugin + VueQueryPlugin |
| Фронт — router root | `src/router/index.js` (320 строк) | роуты + auth-guards + cascade-редиректы legacy→/play |
| Бэк — server entry | `backend/src/index.js` | Express + helmet + cors + http.createServer + setupWebSocket(server) + startScheduler() + startDailyTaskCron() |
| Бэк — route registration | `backend/src/index.js:90-99` | 10 роутеров на `/v1/{auth,user,clan,task,file,fight,stats,friends,ai,agent}` |

HTTP и WebSocket — на одном `http.Server` (shared port). Health-чеки: `GET /` и `GET /health`.

---

## Раздел 2. Стек и зависимости

### Версии (из package.json / lock)

| Пакет | Версия (declared) | Примечание |
|---|---|---|
| Node | v22.22.2 | runtime среды |
| Vue | ^3.5.27 | |
| Vuex | ^4.1.0 | |
| Vue Router | ^4.6.4 | |
| **Vuetify** | `>=3` (resolved в lock) | **CLAUDE.md говорит «Vuetify 2» — расхождение.** В package.json прямой зависимости `vuetify` НЕТ, только `vite-plugin-vuetify ^2.1.3` (devDep). `createVuetify` импортируется в `main.js` из `vuetify` (transitive/peer). |
| Express | ^4.21.1 | |
| Prisma / @prisma/client | ^5.22.0 | |
| ws | ^8.18.0 | |
| ethers | ^6.16.0 | legacy web3 |
| @wagmi/vue | ^0.5.1 | + @wagmi/core ^3.4.1 |
| @reown/appkit + adapter-wagmi | ^1.8.19 | WalletConnect AppKit — **в CLAUDE.md не описан** |
| viem | ^2.47.6 | |
| Three.js | ^0.167.1 | |
| Howler | ^2.2.4 | |
| Anthropic SDK | ^0.80.0 (backend) | |
| Tailwind / CSS-фреймворк | **отсутствует** | Tailwind не установлен. CSS — кастомный (`hexlash-ui.css` + `v24/`) |

### Production-зависимости — фронт (package.json)

`@amplitude/analytics-browser ^2.11.9`, `@coinbase/wallet-sdk ^4.1.0`, `@reown/appkit ^1.8.19`, `@reown/appkit-adapter-wagmi ^1.8.19`, `@tanstack/vue-query ^5.95.2`, `@vueuse/core ^14.1.0`, `@wagmi/core ^3.4.1`, `@wagmi/vue ^0.5.1`, `axios 1.12.0` (pinned), `debounce ^2.2.0`, `ethers ^6.16.0`, `howler ^2.2.4`, `idb ^8.0.3`, `jwt-decode ^4.0.0`, `lucide-vue-next ^0.453.0`, `qrcode ^1.5.4`, `three ^0.167.1`, `viem ^2.47.6`, `vue ^3.5.27`, `vue-router ^4.6.4`, `vuex ^4.1.0`

### Production-зависимости — бэк (backend/package.json)

`@anthropic-ai/sdk ^0.80.0`, `@prisma/client ^5.22.0`, `bcryptjs ^2.4.3`, `cors ^2.8.5`, `dotenv ^16.4.5`, `express ^4.21.1`, `express-rate-limit ^8.3.1`, `helmet ^8.1.0`, `jsonwebtoken ^9.0.2`, `multer ^1.4.5-lts.1`, `prisma ^5.22.0`, `resend ^6.12.3`, `uuid ^10.0.0`, `ws ^8.18.0`

### Dev-зависимости (фронт; бэк dev-deps отсутствуют)

`@vheemstra/vite-plugin-imagemin ^2.2.1`, `@vitejs/plugin-vue ^6.0.3`, `imagemin-mozjpeg ^10.0.0`, `imagemin-pngquant ^10.0.0`, `imagemin-webp ^8.0.0`, `javascript-obfuscator ^5.1.0`, `rollup-plugin-obfuscator ^1.1.0`, `terser ^5.46.0`, `vite 7.1.11` (pinned), `vite-plugin-compression ^0.5.1`, `vite-plugin-javascript-obfuscator ^3.1.0`, `vite-plugin-optimize-css-modules ^1.3.0`, `vite-plugin-static-copy 3.1.6` (pinned), `vite-plugin-vuetify ^2.1.3`

### Deprecated / устаревшее (из lock-файлов)

| Пакет | Среда | Тип | Заметка из lock |
|---|---|---|---|
| **multer 1.x** | backend | **прямая зависимость** | "Multer 1.x is impacted by a number of vulnerabilities" — `^1.4.5-lts.1` |
| uuid (<7) | frontend (transitive) | deprecated | "Please upgrade to version 7 or higher" |
| glob (old) | frontend (transitive) | deprecated | "Old versions of glob are not supported" |
| inflight | frontend (transitive) | deprecated | "leaks memory. Do not use it" |
| rimraf (<4) | frontend (transitive) | deprecated | "Rimraf versions prior to v4 are no longer supported" |

`multer` — единственный deprecated пакет, являющийся **прямой** зависимостью (бэк). Остальные — транзитивные у фронта.

### Lock-файлы

- `package-lock.json` (фронт, корень) + `backend/package-lock.json` (бэк) — **два раздельных** lockfile, отдельные деревья зависимостей (monorepo с двумя package.json).
- yarn.lock / pnpm-lock.yaml — отсутствуют.
- Расхождения фронт↔бэк по версиям общих пакетов: общих прямых зависимостей у фронта и бэка нет (разные стеки), сравнение неприменимо.

---

## Раздел 3. Фронт — что реализовано

### Vuex-модули (`src/core/state/modules/`, store root `store.js`)

| Модуль | Назначение | Строк | Last commit |
|---|---|---|---|
| `masterState.js` | App init, auth, info/error toasts, профиль-обёртка | 393 | 2026-05-23 |
| `cardFightState.js` | Активный бой PvE/PvP: раунды, HP, dice, coach, localStorage persist | 328 | 2026-05-15 |
| `clanState.js` | Кланы: инфо, участники, роли, гостевой клан, события | 275 | 2026-05-14 |
| `agentState.js` | Ростер агентов: CRUD, captain, auto-fight, fight-club level | 254 | 2026-05-15 |
| `webSocketState.js` | WS-соединение, маршрутизация real-time сообщений | 252 | 2026-05-05 |
| `friendsState.js` | Друзья, заявки, challenge (WS) | 210 | 2026-05-14 |
| `taskState.js` | Daily + social tasks | 176 | 2026-05-15 |
| `pvpState.js` | Real-time PvP matchmaking/бой | 168 | 2026-05-15 |
| `contractState.js` | Web3 кошелёк, баланс токена (TODO: миграция на wagmi) | 168 | 2026-04-17 |
| `userState.js` | Профиль текущего пользователя/стат/аватар | 121 | 2026-05-14 |
| `achievementState.js` | Список достижений + анлок | 53 | 2026-04-17 |
| `punchState.js` | Rate limit панчей, 2D/3D toggle, mute | 32 | 2026-05-15 |

12 модулей (CLAUDE.md упоминает «13» — расхождение: `progressionState` ретайрнут в legacy-cleanup Phase 7-pre-2).

### Views (page-level)

**v1 — `src/views/`:**

| View | Маршрут(ы) |
|---|---|
| `MarketingView.vue` | `/` (Home, анонимный лендинг; authed → /play через beforeEnter) |
| `AuthLayoutView.vue` | `/auth` (родитель login/signup) |
| `auth/AuthSelectorView.vue` | `/auth/login` (Login), `/auth/signup` (Signup) |
| `PrivacyView.vue` | `/privacy` |
| `NotFoundView.vue` | `/404`, `/:pathMatch(.*)*` |
| `VerifyEmailView.vue` | `/verify-email` |
| `ResetPasswordView.vue` | `/reset-password` |
| `PreparationView.vue` | `/arena/fight` (ArenaFight) |
| `FightClubView.vue` | `/arena/club` (ArenaFightClub) |

**v2 — `src/views-v2/` (17 файлов), все дети `/play` (V2Root → AppV2.vue):**

| View | Маршрут (имя) |
|---|---|
| `PitViewV2.vue` | `/play` (V2Pit) |
| `FighterDetailView.vue` | `/play/fd/:key` (V2FighterDetail) |
| `FightView.vue` | `/play/fight` (V2Fight) |
| `TrainingView.vue` | `/play/training` (V2Training) |
| `MatchmakingView.vue` | `/play/matchmaking` (V2Matchmaking) |
| `CreateView.vue` | `/play/create` (V2Create) |
| `ProfileView.vue` | `/play/profile` (V2Profile) |
| `RatingsView.vue` | `/play/ratings` (V2Ratings) |
| `ClanView.vue` | `/play/clan` (V2Clan) |
| `GuestClanView.vue` | `/play/clan/:id` (V2GuestClan) |
| `ShopView.vue` | `/play/shop` (V2Shop) |
| `SpectateView.vue` | `/play/spectate/:fightId` (V2Spectate) |
| `HelpView.vue` | `/play/help` (V2Help) |
| `RulesView.vue` | `/play/rules` (V2Rules) |
| `UserProfileView.vue` | `/play/user/:userLogin` (V2UserProfile) |
| `WalletView.vue` | `/play/wallet` (V2Wallet) |
| `AccountView.vue` | `/play/account` (V2Account) |

Большая часть legacy-путей (`/profile`, `/ratings/:type`, `/v2/*`, `/fight`, `/training`, `/matchmaking`, `/spectate/:odId`, `/clan/:id`, `/user/:userLogin` и т.д.) — cascade-редиректы на `/play/*`.

### Компоненты `src/components/` (по подпапкам)

| Подпапка | .vue | Назначение |
|---|---|---|
| `components/` (корень) | 5 | Глобальные: Info/Error toasts, NewAchievement, AiTrainerAnalysis (orphan), Punch3D и т.п. |
| `components/arena/` | 1 | Arena-виджеты (ModeSelector) |
| `components/auth/` | 9 | Auth-формы/экраны: EmailForm, ForgotPasswordScreen, ReferralOverlay, GuestArchetypeSelect и т.д. |
| `components/clan/` | 1 | ClanInviteNotification (social) |
| `components/club/` | 6 | Club Mode: AgentCard, AgentRoster, ClubLevelBar, MorningReport + 2 orphan (SkinPicker, ResearchTree, ArchetypeSelector — см. Раздел 5) |
| `components/fragments/clan/` | 9 | Клановые фрагменты (CreateClan, ClanEdit, ClanStats, ClanActivityFeed, ClanWithdraw[orphan] и т.д.) |
| `components/fragments/modules/` | 1 | ModuleBuilder |
| `components/fragments/profile/` | 3 | ReferralModal + др. |
| `components/fragments/profile/account/` | 4 | ConfirmEmail, ChangeLogin, ChangePassword, DeleteAccount |
| `components/fragments/profile/wallet/` | 3 | ConnectWallet, GameBalanceCard, BuyTokens |
| `components/fragments/training/` | 1 | SubscribeModal |
| `components/hud/` | 23 | v2 HUD-слой (HudPit, HudFight, HudProfile, HudRatings, HudClan, HudSpectate, HudMatchmaking, HudCreate, HudFighterDetail, HudTraining, HudShop, HudRetirement, VerifyEmailBanner и т.д.) |
| `components/hud/common/` | 7 | TopBar, PhModal, WorldHint, GlobalOverlays, BranchPanel и др. |
| `components/menu/` | 1 | BottomMenu |
| `components/pvp/` | 1 | ChallengeNotification |
| `components/ui/` | 7 | Дизайн-система: HexButton, HexCard, HexProgress, HexBadge, BeltBadge, UserCaptainBadge, PixelIcon |

Итого ~82 .vue в `components/` (+ 9 v1 views + 17 v2 views).

### Composables / hooks (`use*.js`)

| Файл | Назначение |
|---|---|
| `composables/useDocumentMeta.js` | Ручное управление SEO meta-тегами с restore-on-unmount |
| `composables/useScrollFadeIn.js` | IntersectionObserver one-shot fade-in |
| `components/hud/common/useFightLog.js` | Reactive лог боя (auto-trim) |
| `components/hud/common/useFightSimulation.js` | Состояние/симуляция мок-боя v2 |
| `components/hud/common/useFlashHit.js` | Flash-эффект на хите |
| `scene/scenes/useFightSceneApi.js` | Reactive API к FightScene |
| `scene/interaction/useCanvasRef.js` | Singleton canvas ref |
| `scene/interaction/useClickState.js` | Cross-sibling click state |
| `scene/interaction/useClickToHit.js` | Raycast→impulse (training bag) |
| `scene/interaction/useCreateNames.js` | Генератор имён бойца |
| `scene/interaction/useCreateState.js` | Состояние создания агента |
| `scene/interaction/useCreatedFighter.js` | One-shot cross-view cache нового агента |
| `scene/interaction/useFdLabels.js` | DOM-лейблы веток (FD) |
| `scene/interaction/useFightSetup.js` | One-shot setup оппонента → FightView |
| `scene/interaction/useHitSound.js` | Процедурный WebAudio звук удара |
| `scene/interaction/useHoverState.js` | Shared hover state |
| `scene/interaction/useMatchmakingState.js` | Состояние matchmaking |
| `scene/interaction/useSpectateState.js` | Состояние spectate (real BE binding) |
| `scene/interaction/useTrainingState.js` | Состояние тренировки (combo/energy/tasks) |

(Файлы `userModel.js`/`userService.js`/`userState.js`/`userRepository.js` — НЕ composables, попадают под glob `use*` ложно.)

### Кастомный i18n

- Где: `src/locales/index.js` (40 строк) экспортирует `t` (computed ref) + `interpolate()`. Источник: `src/locales/en.js` (454 строки) + injected `pages/help/en.json` + `pages/rules/en.json`.
- Поддерживаемые локали: **только `en`**. Мультиязычные файлы (ru/de/es/fr/pt/ar/hi/ja/ko/zh) **удалены** (в hot-files за 90 дней видно, что они правились по 8 раз — затем вырезаны).
- **CLAUDE.md и skill `hexlash-i18n` всё ещё говорят про «11 языков» — расхождение с кодом.**
- Расхождение ключей между локалями: неприменимо (одна локаль).

### 3D / Three.js (`src/scene/`)

- **Модель бойца:** `objects/fighterModel.js` — `makeFighterLowPoly(THREE, variant)`. Реализованы **только 2 варианта**: `'warden'` (default) и `'predator'` (`fighterModel.js:96-101`). Архетипы analyst/ghost/sentinel/maverick/juggernaut **визуально не реализованы** — мапятся на warden mesh + только цвет glow (подтверждает заметку CLAUDE.md Эпик 4 deferred).
- **Объекты сцены (22):** arena, environment, branchColumn, clanBanner, clanFlag, createPodium/Hologram/ArchetypeGlow, dustField, fightAnimations, heavyBag, matchmakingTerminal, octagonalRoom, plinth, scoreboard, shopLocker, terminal, trainingBag(+Physics+HitParticles), archetypeColors.
- **Сцены (10):** PitScene, FighterDetailScene, FightScene, TrainingScene, MatchmakingScene, CreateScene, ProfileScene, RatingsScene, ClanScene, ShopScene. Код арены: `objects/arena.js` + per-scene сборка.
- **GLTF-модели:** `src/assets/models/` — только `punching-bags.gltf` + `.bin`. (RainView scene.glb удалён в Эпик 7+ 1b.)
- Битых импортов на отсутствующие модели — **0** (см. Раздел 6).

### Web3 на фронте

- Инициализация: `src/main.js` подключает `WagmiPlugin` (config из `src/core/web3/wagmiConfig.js`) + `VueQueryPlugin`.
- `wagmiConfig.js`: `createConfig` для chain `base`, connectors `injected / coinbaseWallet(smartWalletOnly) / walletConnect`. `projectId` берётся из `import.meta.env.VITE_WALLETCONNECT_PROJECT_ID` **с захардкоженным fallback-значением**.
- Connect Wallet: `components/fragments/profile/wallet/ConnectWallet.vue` (Teleport-модалка, `@wagmi/vue` useConnect/useDisconnect/useConnectors). Завязаны на кошелёк: `HudProfile.vue`, `HudProfileWallet.vue`, `WalletView`, `GameBalanceCard.vue`, `BuyTokens.vue`.
- Legacy ethers-цепочка: `contractService.js` + `contractState.js` (TODO миграции на wagmi) + `nftMintService.js`. **SIWE-авторизация не реализована** — кнопка Connect Wallet в auth-флоу показывает «coming soon» toast.

---

## Раздел 4. Бэк — что реализовано

### Endpoints Express (METHOD /path → файл:строка)

**auth.js** (`/v1/auth`)
| | | |
|---|---|---|
| POST `/login` | auth.js:111 | |
| POST `/register` | auth.js:158 | |
| GET `/login-available/:login` | auth.js:256 | |
| POST `/forgot-password` | auth.js:277 | |
| POST `/reset-password` | auth.js:337 | |

**user.js** (`/v1/user`)
| | |
|---|---|
| GET `/me` | user.js:56 |
| POST `/edit` | user.js:90 |
| POST `/delete` | user.js:217 |
| POST `/verify-email` | user.js:286 |
| POST `/resend-verification` | user.js:332 |
| POST `/put-avatar` | user.js:379 |
| GET `/login/:login` | user.js:399 |
| GET `/id/:id` | user.js:419 |
| GET `/search` | user.js:439 |
| PUT `/skin` | user.js:492 |
| PUT `/progression` | user.js:515 |
| PUT `/settings` | user.js:569 |
| GET `/referrals` | user.js:593 |
| GET `/retirement-status` | user.js:629 |
| POST `/retire` | user.js:658 |

**clan.js** (`/v1/clan`): GET `/id/:clanId` (12), POST `/add` (31), POST `/edit` (89), POST `/put-avatar` (129), POST `/change` (159), GET `/search` (220), POST `/set-role` (268), POST `/transfer-ownership` (322), POST `/kick` (378), POST `/invite` (433), GET `/invites` (536), POST `/invite/respond` (580), GET `/:clanId/events` (656), DELETE `/` (714)

**agent.js** (`/v1/agent`): GET `/fight-club` (44), GET `/rankings` (59), GET `/list` (102), GET `/:id` (119), POST `/create` (147), PUT `/:id` (223), DELETE `/:id` (289), PUT `/:id/captain` (319), PUT `/:id/tactics` (339), GET `/:id/fights` (413), POST `/:id/train` (456), PUT `/:id/auto-fight` (470), GET `/:id/auto-fight-status` (510), GET `/:id/available-moves` (544), POST `/:id/learn-move` (568), PUT `/:id/deck` (649), POST `/:id/research` (711), POST `/:id/allocate-xp` (748)

**ai.js** (`/v1/ai`): POST `/analyze-fight` (136), POST `/build-description` (293), POST `/morning-report` (382), POST `/premium-report` (508)

**friends.js** (`/v1/friends`): POST `/request` (28), GET `/requests` (109), GET `/requests/outgoing` (140), POST `/accept` (171), POST `/decline` (205), GET `/list` (227), POST `/remove` (270)

**task.js** (`/v1/task`): GET `/social/:language` (12), GET `/daily/:language` (44), POST `/complete/:taskId` (99), POST `/daily/:id/progress` (160)

**fight.js** (`/v1/fight`): POST `/save` (12)
**stats.js** (`/v1/stats`): GET `/online` (7)
**file.js** (`/v1/file`): GET `/get/:filename` (9)

Итого: **63 endpoint** в 10 роут-файлах.

### Prisma-модели (`prisma/schema.prisma`, 441 строка, 19 моделей)

| Модель | ~Полей (вкл. relations) | Строка |
|---|---|---|
| User | 62 | 10 |
| Clan | 18 | 103 |
| ClanEvent | 8 | 124 |
| ClanInvite | 10 | 137 |
| Achievement | 6 | 153 |
| UserAchievement | 6 | 162 |
| SocialTask | 7 | 173 |
| UserSocialTask | 6 | 183 |
| DailyTask | 9 | 194 |
| UserDailyTask | 8 | 206 |
| Fight | 24 | 219 |
| FriendRequest | 7 | 256 |
| Friendship | 6 | 271 |
| PunchInfo | 9 | 285 |
| FightClub | 12 | 297 |
| Agent | 30 | 319 |
| AgentTactics | 9 | 376 |
| AgentProgression | 9 | 390 |
| AgentFightLog | 15 | 411 |

(Счёт полей — приблизительный, по строкам внутри `model {}`; включает скалярные поля и relation-поля.)

### Middleware (`backend/src/middleware/`)

| Файл | Назначение |
|---|---|
| `auth.js` | JWT Bearer guard |
| `upload.js` | Multer (загрузка файлов/аватаров) |
| `x402.js` | x402 micropayment gate (feature-flagged, off; on-chain verify = TODO) |

Глобально в `index.js`: `helmet()`, `cors(corsOptions)`, `express.json({limit:'1mb'})`, `express.urlencoded({limit:'1mb'})`, кастомный error-handler (500).

### WebSocket

- Инициализация: `backend/src/websocket/handler.js` → `setupWebSocket(server)` (тот же http.Server). PvP — `pvpHandler.js`.
- Обрабатываемые **входящие** типы (`handler.js` switch): `PunchInfoRequestMsg`, `PunchBatchRequestMsg`, `FightTicketMsg`, `FightActionMsg`, `MatchmakingStartMsg`, `MatchmakingCancelMsg`, `pvp_ready`, `dice_roll`, `coach_choice`, `pvp_surrender`, `challenge_send`, `challenge_accepted`, `challenge_declined`, `SpectateJoinMsg`, `SpectateLeaveMsg`.
- **Исходящие** типы (выборка): `PunchInfoResponseMsg`, `UserResponseMsg`, `FightInfoMsg`, `AchievementResponseMsg`, `ErrorMsg`, `challenge_received/sent/start/declined/error`, `MatchmakingQueueMsg/CancelledMsg`, `MatchFoundMsg`, `fight_state_resume`, achievement-типы (CONNECTED_FIGHTER/REGULAR_FIGHTER/BATTLE_VETERAN/FIGHT_MASTER).
- pvpHandler доп.: `pvp_ready`, `dice_roll`, `coach_choice`, `pvp_surrender`; ответы `dice_error`, `error`.
- Reconnect/heartbeat: реализованы (ping/pong + reconnect rebind с пометкой `_replaced`, `fight_state_resume` для late-join) — детали в `handler.js`.

### Интеграции

| Интеграция | Где | Детали |
|---|---|---|
| Claude API | `services/morningReportService.js`, `metaAnalysisService.js`, route `ai.js` | Модель `claude-haiku-4-5-20251001` (config.js:111). Промпты собираются в сервисах (morning/premium report, analyze-fight, build-description). Версионирование промптов: отдельного механизма нет. |
| Multer | `middleware/upload.js` | Загрузка аватаров/файлов (`file.js`, `put-avatar`). ⚠️ multer 1.x deprecated/уязвим. |
| JWT | `middleware/auth.js` | Bearer-валидация; WS — через protocol header `Bearer_<token>`. JWT_SECRET обязателен (сервер падает без него). |
| Почта | `services/emailService.js` + `templates/{resetPassword,verifyEmail}.js` | Провайдер **Resend** (`resend ^6.12.3`). Verify email + reset password. |

### Скрипты (`backend/scripts/` + prisma)

| Скрипт | Назначение |
|---|---|
| `prisma/seed.js` | Сид: достижения + social/daily tasks |
| `scripts/backfill-belts.js` | Пересчёт поясов агентов |
| `scripts/backfill-captains.js` | Назначение isCaptain первым агентам |
| `scripts/calibrate-belts.js` | Калибровка поясов |
| `scripts/cleanup-agents.js` | Очистка данных агентов |
| `scripts/migrate-all-users.js` | Батч-миграция User→Fighter #1 |
| `scripts/check-email-cleanup-counts.js` | Проверка счётчиков email-cleanup |
| Cron: `services/agentScheduler.js` | Авто-бои агентов (30s tick) — стартует в index.js |
| Cron: `services/dailyTaskCron.js` | Сброс daily tasks (midnight UTC) — стартует в index.js |

---

## Раздел 5. Что начато, но не закончено

### TODO/FIXME/XXX/HACK/WIP (12 совпадений, файл:строка)

| Файл:строка | Текст |
|---|---|
| `src/components/NewAchievement.vue:48` | TODO: Replace VModal/VCard with custom modal for dramatic 600ms animation |
| `src/components/club/MorningReport.vue:152` | TODO: read from config endpoint (x402Enabled = ref(false)) |
| `src/components/club/MorningReport.vue:195` | TODO: when x402Enabled, do USDC payment first and set X-Payment-Tx header |
| `src/components/fragments/clan/ClanWithdraw.vue:107` | TODO Сделать заявки на вывод |
| `src/components/fragments/clan/CreateClan.vue:147` | TODO: full v2 clan management migration → revisit this conditional |
| `src/views/auth/AuthSelectorView.vue:89` | (комментарий-ссылка на TODO в EmailForm.vue) |
| `src/core/state/modules/contractState.js:1` | TODO: Phase 2 — migrate to wagmi composables |
| `src/views-v2/SpectateView.vue:11` | (комментарий: «Stub handlers (console.debug + TODO)» — описание прошлого этапа) |
| `backend/src/middleware/x402.js:42` | TODO: Verify tx on-chain via Base RPC when x402 fully enabled |
| `backend/src/routes/user.js:448` | TODO #P1-rename-3: remove clubId alias after frontend rename |
| `src/components/auth/ReferralOverlay.vue:28` | (placeholder `HEX-XXXX-XXXX` — не TODO, ложное срабатывание на XXXX) |
| `src/components/hud/HudRetirement.vue:401` | (упоминание чужого «600ms TODO comment» — описательное) |

Авторство/давность по каждому TODO — `[не удалось получить: не запускалось git blame на каждую строку; основная масса TODO в файлах с last-commit в апреле–мае 2026 по данным Раздела 9]`.

### Закомментированный код блоками ≥5 строк

Эвристика (≥5 подряд `//`-строк, похожих на код) дала **~85 совпадений**, но спот-проверка (напр. `src/views-v2/CreateView.vue:73-85`, `src/scene/scenes/*` заголовки) показывает: **подавляющее большинство — пояснительные header/JSDoc-комментарии** в стиле v2-миграции (пошаговые описания логики), **не** заброшенный код. Genuine закомментированного «мёртвого кода» эвристикой **не выявлено**. Помечается как «вероятно НЕ заброшенные попытки — это документация».

### Файлы с суффиксами .old/.bak/.draft/_copy/_v2/_new

**Не найдено.** Два ложных совпадения по glob: `src/assets/images/achievement_newbie.png` (`_new`), `src/assets/images/icon_copy.svg` (`_copy`) — это нормальные ассеты.

### Мёртвые компоненты (0 импорт-ссылок в `src/`)

| Файл | Заметка |
|---|---|
| `src/components/AiTrainerAnalysis.vue` | Вызывает `/ai/analyze-fight` (бэк-endpoint жив), но сам компонент не импортируется нигде — **AI Trainer выпилен из v2 UI**. |
| `src/components/club/SkinPicker.vue` | orphan |
| `src/components/club/ResearchTree.vue` | orphan (CLAUDE.md описывает как «used в AgentDetailView Moves tab», но AgentDetailView v1 удалён в Эпик 6 cutover) |
| `src/components/club/ArchetypeSelector.vue` | orphan |
| `src/components/fragments/clan/ClanWithdraw.vue` | orphan (+ содержит TODO про заявки на вывод) |
| `src/components/fragments/clan/ClanPageContent.vue` | orphan |

(Проверено: для каждого `grep -rl <basename>` по `src/` (исключая сам файл) вернул 0.)

### Экспорты, ни разу не импортируемые

`[не удалось получить полностью: исчерпывающий dead-export анализ требует статического инструмента (нет TypeScript/ts-prune). Выполнена только проверка мёртвых .vue-компонентов выше. Анализ неиспользуемых именованных экспортов в .js — не проводился.]`

### Endpoints, возвращающие 501 / not implemented

**Нет.** Единственное совпадение по «501» — комментарий `backend/src/routes/user.js:212` о том, что 501-заглушка `POST /v1/user/reset` была **удалена** в Email-Auth Phase 4. Действующих 501 / `throw new Error('not implemented')` в бэке нет.

### Vue-компоненты с пустым `<template>` / «Coming Soon» / placeholder

Заглушек с пустым template нет. «Coming soon» / placeholder-контент (намеренный, продуктовый):
| Файл:строка | Контент |
|---|---|
| `src/views/MarketingView.vue:98` | «VIDEO INCOMING» (gameplay-плейсхолдер) |
| `src/views/MarketingView.vue:110` | Token секция «Coming Soon» |
| `src/views/MarketingView.vue:122-137` | Roadmap 4 карточки «Coming soon» |
| `src/views/auth/AuthSelectorView.vue:105,152,162` | «coming soon» toast для google/x/web3/farcaster/discord логина (бэк не готов) |
| `src/components/hud/HudRatings.vue:296` | комментарий «Per-tab content panels are placeholders until Commits 4-7» (исторический; вкладки реально завязаны на данные) |

### Feature flags / env-переключатели целых кусков

| Flag | Где определён (config.js) | Дефолт | Использование |
|---|---|---|---|
| `AI_TRAINER_ENABLED` | `config.js:114` (`!== 'false'`) | **true** | route `ai.js` (analyze-fight) — но фронт-компонент AiTrainerAnalysis.vue orphan |
| `X402_ENABLED` | `config.js:119` (`=== 'true'`) | **false** | `middleware/x402.js` (premium-report gate); фронт MorningReport.vue x402Enabled=ref(false) hardcoded |
| `NFT_MINTING_ENABLED` | `config.js:125` (`=== 'true'`) | **false** | `services/nftService.js` (mint requirement check) |
| `MIGRATION_ENABLED` | `config.js:130` (`!== 'false'`) | **true** | lazy User→Fighter #1 миграция на `/me` |

Значения в `.env.example`: **ни один из этих флагов не присутствует в `backend/.env.example`** (см. Раздел 6).

---

## Раздел 6. Что отсутствует (по сигналам в коде)

### Битые импорты (несуществующие локальные файлы)

**0.** Скан всех `import`/`from`/`require` с `@/` и относительными путями по `src/` и `backend/src/` (резолв `.js/.vue/.json/.ts/index.js`) — битых импортов не найдено.

### Env-переменные, используемые в коде, но отсутствующие в `.env.example`

`.env.example` существует **только для бэка** (`backend/.env.example`); фронтового нет.

**Бэк — `process.env.*` используется, но НЕ в `backend/.env.example`:**
| Переменная | Где используется |
|---|---|
| `AGENT_NFT_CONTRACT` | nftService / config |
| `BASE_RPC_URL` | nftService / config |
| `NFT_MINTING_ENABLED` | config:125 |
| `X402_ENABLED` | config:119 |
| `PAYMENT_RECEIVER_ADDRESS` | x402 / config |
| `AI_TRAINER_ENABLED` | config:114 |
| `AI_BUILD_DESCRIPTION_MAX_TOKENS` | config (AI) |
| `MIGRATION_ENABLED` | config:130 |

(Многие читаются с дефолтами в config.js — функционально опциональны, но в `.env.example` не задокументированы.)

**Фронт — `import.meta.env.VITE_*` используется, `.env.example` отсутствует вовсе:**
- `VITE_WALLETCONNECT_PROJECT_ID` (есть hardcoded fallback в wagmiConfig.js)
- `VITE_AGENT_NFT_CONTRACT`
- `VITE_NFT_MINTING_ENABLED`

Compile-time defines (vite.config.js:81-87, не env): `__APP_VERSION__`, `__API_SERVER_URL__`, `__WEB_SOCKET_URL__`, `__IS_PROD__`, `__MOCK_MODE__`.

### Вызовы функций/методов, которых нет в коде

`[не удалось получить: исчерпывающий анализ «вызовы несуществующих функций» не проводился — требует резолва символов/статанализа. Косвенный сигнал отсутствует: битых импортов 0, бэк-тесты зелёные. Известный исторический пример (фантомные dispatch `master/setError`, `progressionState/*`) уже устранён по данным CLAUDE.md.]`

### Упоминания фич в комментариях/JSDoc без реализации

| Сигнал | Файл |
|---|---|
| x402 on-chain verification | `middleware/x402.js:42` (TODO — принимает любой tx, on-chain verify не реализован) |
| x402 USDC payment во фронте | `MorningReport.vue:195` (TODO — платёж не реализован, free preview) |
| wagmi-миграция contract-слоя | `contractState.js:1` (TODO Phase 2 — всё ещё на ethers) |
| Клановые заявки на вывод | `ClanWithdraw.vue:107` (TODO — компонент orphan) |
| SIWE / wallet-auth | `AuthSelectorView.vue` — кнопка web3-логина = «coming soon» toast (бэк-эндпоинта нет) |

---

## Раздел 7. Тесты

### Фреймворк

- **Бэк:** встроенный `node --test` (node:test + node:assert). Скрипт `npm test` = `node --test tests/**/*.test.js`.
- **Фронт:** unit-фреймворк **отсутствует** (в package.json нет `test`-скрипта, нет vitest/jest). Есть только Playwright smoke в `scripts/smoke-test/smoke.spec.js` (E2E против деплоя).

### Количество тест-файлов

- Бэк: **8** (`backend/tests/`): auth, beltService, captainArenaFlow, captainService, dailyTaskService, emailService, helpers, userMigrationService.
- Фронт unit: **0**.
- E2E (Playwright): **1** файл (`scripts/smoke-test/smoke.spec.js`).

### Реальный прогон (бэк)

Установлены `backend/node_modules`, запуск `JWT_SECRET=test-secret npm test`:

```
# tests 105
# suites 28
# pass 105
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 420.7
```

**105 pass / 0 fail / 0 skipped** (28 suites). Coverage-репорт не настроен (флаг coverage не используется) → процент покрытия `[не удалось получить: coverage не сконфигурирован]`.

Фронт-тесты не запускались — `[не удалось получить: нет test-скрипта и unit-фреймворка во фронте]`.

### E2E-сценарии (по `smoke.spec.js`, без запуска)

Playwright smoke (`scripts/smoke-test/`) — проверка деплоя; на момент legacy-cleanup wrap-up прогон был заблокирован Vercel Deployment Protection (SSO gate) — см. `docs/legacy-cleanup/WRAP_UP_SMOKE_REPORT.md`. Точный список сценариев — `[не удалось получить: файл не открывался построчно в этой инвентаризации; имя указывает на общий smoke загрузки страниц]`.

### CI: запускаются ли тесты

**Нет.** `.github/workflows/gitops.yaml` — единственный workflow: триггер только `push` в ветку `test`, шаги — Docker build + push в Docker Hub + обновление K8s deployment YAML. **Шага запуска тестов (npm test) в CI нет.** На `pull_request` workflow не срабатывает.

---

## Раздел 8. Документация и конфиги

### README

| Файл | Last commit | Актуальность |
|---|---|---|
| `backend/README.md` | 2026-05-12 | В целом актуален (Express 4 + Prisma 5 + Resend + Railway). Перечисляет env-переменные, ссылается на CLAUDE.md. |
| `scripts/smoke-test/README.md` | 2026-05-15 | Документация smoke-теста. |
| Фронтовый README | — | **Отсутствует.** |

Явно устаревших упоминаний удалённых зависимостей в backend/README не обнаружено (в рамках беглой проверки header-блока).

### CLAUDE.md

Есть. Размер: **6500 строк / ~613 KB**. (Содержит ряд расхождений с текущим кодом — см. дисклеймер сверху: Vuetify 2 vs 3, 11 локалей vs en-only, «13 Vuex модулей» vs 12, ResearchTree «used» vs orphan.)

### Skills (`/skills/`, 12 штук)

| Skill | Назначение (из frontmatter) |
|---|---|
| `hexlash-dev` | Базовый операционный скилл, грузится первым; структура/git/воркфлоу/кодстайл |
| `hexlash-vue` | Фронтенд-конвенции: Vue/Vuex/Router/components/views |
| `hexlash-combat` | Боевая система: PvE/PvP/AutoFight, dice/coach/архетипы/engine |
| `hexlash-websocket` | WS-протокол: matchmaking/challenge/dice_roll/spectate/reconnect |
| `hexlash-deploy` | Deploy/infra/env/CI-CD/rollout (test+prod, Railway, миграции) |
| `hexlash-design` | Дизайн-система «Neon Discipline»: CSS/цвета/шрифты/--hex |
| `hexlash-api` | Backend API: Express/Prisma/JWT/migrations/middleware/security |
| `hexlash-testing` | Тесты/QA/регрессия/smoke/E2E/релизный чеклист |
| `hexlash-web3` | Web3: Base/кошелёк/NFT ERC-1155/x402/ethers/wagmi/viem |
| `hexlash-ai` | AI: Anthropic Claude API/промпты/analyze-fight/reports |
| `hexlash-i18n` | Локализация — **frontmatter говорит «11 языков», код en-only (устарел)** |
| `hexlash-gamedesign` | Геймдизайн/баланс: формулы урона/архетипы/прокачка/ELO/экономика |

### Конфиги (одна строка «что настраивает»)

| Конфиг | Что настраивает |
|---|---|
| `vite.config.js` | Сборка Vite 7: vue-плагин, vuetify, обфускация, brotli-сжатие, imagemin, terser, compile-time defines (`__API_SERVER_URL__` и т.д.) |
| `jsconfig.json` | JS path-алиасы (`@/*` → src) для IDE/резолва |
| `tsconfig.json` | **Отсутствует** (проект на чистом JS) |
| `tailwind.config.js` | **Отсутствует** (Tailwind не используется) |
| `backend/prisma/schema.prisma` | 19 моделей PostgreSQL + datasource + generator (441 строка) |

### `.env.example` (только `backend/.env.example`), группировка

- **db:** `DATABASE_URL`
- **auth:** `JWT_SECRET`
- **server/other:** `PORT`, `WS_PORT`, `FRONTEND_URL`, `UPLOAD_DIR`
- **ai:** `ANTHROPIC_API_KEY`
- **email:** `RESEND_API_KEY`, `EMAIL_FROM_DOMAIN`, `APP_URL`
- **web3 / x402 / nft / feature-flags:** **отсутствуют** (хотя используются в коде — см. Раздел 6).

Фронтового `.env.example` нет (хотя используются `VITE_*` переменные).

---

## Раздел 9. Git-метаданные

### Текущая HEAD (origin/main)

```
460585a5dabff05db76a0429c662e86a145ef401
"Merge pull request #395 from evgenii-yps/test"
2026-05-24 02:51:31 +0300 — evgenii-yps
```
⚠️ Локальный ref `main` устарел (указывает на #383 / 2026-05-17). Текущая ветка инвентаризации = origin/main.

### Ветки (кроме main/test)

Удалённых веток всего **2**: `origin/main` и `origin/claude/hexlash-state-inventory-H0pXG` (эта инвентаризация, ответвлена от #395). **Отдельной удалённой ветки `test` нет.** Других feature/claude-веток на remote нет.

- Ветки старше 30 дней без активности: **нет** (единственная не-main ветка создана сегодня).

### Последние 30 коммитов в main (origin/main)

| Дата | Автор | Сообщение | Зона |
|---|---|---|---|
| 2026-05-24 | evgenii-yps | Merge PR #395 from test | фронт (guest mode) |
| 2026-05-24 | evgenii-yps | Merge PR #394 (blissful-turing) | фронт |
| 2026-05-23 | Claude | fix(fight): "Exit to Pit" routes to Pit for all | фронт |
| 2026-05-23 | Claude | fix(guest): PvE fight Back returns guests to Pit | фронт |
| 2026-05-23 | Claude | feat(guest): PvE play, session UI, conversion + gating | фронт |
| 2026-05-23 | Claude | feat(guest): session foundation — entry, archetype, routing | фронт |
| 2026-05-24 | evgenii-yps | Merge PR #393 (revert/pr-392-landing-redesign) | фронт |
| 2026-05-23 | Claude | Revert "Merge PR #392 landing redesign" | фронт |
| 2026-05-22 | evgenii-yps | Merge PR #392 (redesign landing) | фронт |
| 2026-05-22 | evgenii-yps | Merge branch main into redesign-landing | merge |
| 2026-05-22 | evgenii-yps | Merge PR #391 (fervent-hopper) | фронт |
| 2026-05-22 | Claude | feat(brand): replace logo (favicon/PWA/Apple/OG) | фронт/ассеты |
| 2026-05-22 | evgenii-yps | Add files via upload | ассеты |
| 2026-05-22 | evgenii-yps | Merge PR #390: header enlarge + hero trim + GAMEPLAY | фронт |
| 2026-05-21 | Claude | feat(landing): polish GAMEPLAY block | фронт |
| 2026-05-21 | Claude | fix(landing): bump header logo | фронт |
| 2026-05-21 | Claude | fix(landing): bigger header + smaller hero title | фронт |
| 2026-05-21 | Claude | feat(landing): enlarge header elements | фронт |
| 2026-05-21 | evgenii-yps | Merge PR #389: sticky header + hero title | фронт |
| 2026-05-21 | Claude | feat(landing): sticky header + hero title | фронт |
| 2026-05-21 | Claude | refactor(landing): drop Anonymous pixel font | фронт |
| 2026-05-21 | Claude | fix(landing): hero polish (4 issues) | фронт |
| 2026-05-21 | Claude | feat(landing): redesign per Neon Discipline | фронт |
| 2026-05-21 | evgenii-yps | Merge PR #371 (audit-email-auth) | бэк/доки |
| 2026-05-21 | evgenii-yps | Merge PR #387 (investigate-task-language) | доки |
| 2026-05-20 | evgenii-yps | Merge PR #388 (task-language-retire) | бэк/Prisma |
| 2026-05-19 | Claude | feat(phase-11): retire SocialTask/DailyTask.language | бэк/Prisma |
| 2026-05-18 | Claude | docs(audit): Task-language Gate 2 | доки |
| 2026-05-18 | Claude | docs(audit): Task-language Gate 1 | доки |
| 2026-05-18 | evgenii-yps | Merge PR #386 (parking-8-closure) | доки |

Доминирующая зона последних 30 коммитов: **фронт (лендинг-редизайн + guest mode)**, далее бэк/Prisma (task-language retire) и доки.

### «Горячие» файлы (по числу коммитов за 90 дней, src + backend/src) — top 15

| # коммитов | Файл |
|---|---|
| 24 | `src/router/index.js` |
| 22 | `src/views/MarketingView.vue` |
| 12 | `src/locales/en.js` |
| 12 | `src/core/state/modules/masterState.js` |
| 10 | `src/App.vue` |
| 8 | `src/views/auth/AuthSelectorView.vue` |
| 8 | `src/locales/zh.js` *(файл с тех пор удалён)* |
| 8 | `src/locales/ru.js` *(удалён)* |
| 8 | `src/locales/pt.js` *(удалён)* |
| 8 | `src/locales/ko.js` *(удалён)* |
| 8 | `src/locales/ja.js` *(удалён)* |
| 8 | `src/locales/hi.js` *(удалён)* |
| 8 | `src/locales/fr.js` *(удалён)* |
| 8 | `src/locales/es.js` *(удалён)* |
| 8 | `src/locales/de.js` *(удалён)* |

### Файлы старше 180 дней в активных директориях

**Нет.** Вся история репозитория укладывается в ~73 дня (init-миграция `20260312000000`, текущая дата 2026-05-24). Файлов с last-commit старше 180 дней не существует.

### Статус PR из Notion-списка

| PR | Статус | Дата | Заметка |
|---|---|---|---|
| #395 | **merged** | 2026-05-24 | = текущий HEAD; из ветки `test` (guest mode) |
| #394 | **merged** | 2026-05-24 | guest session foundation |
| #393 | **merged** | 2026-05-24 | revert PR #392 (landing redesign) |
| #392 | **merged → затем REVERTED** | 2026-05-22 (revert 2026-05-24) | landing redesign, откатан #393 |
| #390 | **merged** | 2026-05-22 | header enlarge + GAMEPLAY polish |
| #389 | **merged** | 2026-05-21 | sticky header + hero title |
| #396 | **не найден в истории main** | — | `[в merged-историю main не входит → вероятно open или ещё не создан; через gh не проверялось]` |

---

## Раздел 10. Известные проблемы из кода

Только то, что разработчик сам оставил в коде. Маркеров `// known issue`, `// race condition`, `// fix later`, `console.warn` с описанием проблемы — при сквозном grep по `src` и `backend/src` **не найдено**.

Что есть из явных «оставленных себе» пометок (TODO-класс, уже перечислены в Разделе 5, дублируются здесь как «оставлено разработчиком»):

| Файл:строка | Самооставленная заметка |
|---|---|
| `backend/src/middleware/x402.js:42` | on-chain верификация tx не реализована (принимается любой tx) |
| `backend/src/routes/user.js:448` | clubId alias оставлен до завершения rename на фронте |
| `src/core/state/modules/contractState.js:1` | contract-слой не мигрирован на wagmi (всё ещё ethers) |
| `src/components/club/MorningReport.vue:152,195` | x402 платёж/конфиг не подключены (hardcoded false) |
| `src/components/fragments/clan/ClanWithdraw.vue:107` | механизм заявок на вывод не сделан (+ компонент orphan) |
| `src/components/fragments/clan/CreateClan.vue:147` | условная ветка ждёт полной v2-миграции управления кланом |
| `src/components/NewAchievement.vue:48` | VModal/VCard не заменены на кастомную модалку |

Маркеры `HACK`/`XXX` как обозначение проблемы кода — отсутствуют (единственный `XXXX` — placeholder `HEX-XXXX-XXXX` в ReferralOverlay, не проблема).

---

*Конец отчёта. Изменения в коде не вносились — только чтение и запись `docs/state-report-2026-05-24.md`.*
