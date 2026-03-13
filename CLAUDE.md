# HEXLASH — Project Memory

Full-stack Web3 fighting game. Vue 3 SPA + Express backend + PostgreSQL. Telegram WebApp compatible.

---

## Tech Stack

**Frontend:** Vue 3.5 · Vite 7 · Vuex 4 · Vue Router 4 · Vuetify 2 · Three.js · Howler.js · Ethers.js 6 · Vue-i18n 11 · Amplitude

**Backend:** Express 4 · Prisma 5 (PostgreSQL) · JWT · WebSocket (ws) · Multer · bcryptjs

---

## Project Structure

```
/src
  App.vue                  — Root: header (Logo), router-view, BottomMenu, Info/Error toasts
  main.js                  — Entry: Vue + Vuetify + i18n + Vuex store init
  router/index.js          — Routes + auth guards + fight state restore
  views/                   — 14 page-level components
  components/              — 68 reusable components
  core/
    state/store.js         — Vuex store
    state/modules/         — 11 Vuex modules
    models/                — Data models
    services/              — Business logic
    database/              — LocalStorage/IDB persistence
    api/apiClient.js       — Axios HTTP client
    engine/                — Combat system (combatEngine, aiStrategy, opponentGenerator)
    constants.js           — Game constants
    websocket/             — WebSocket client
    models/                — 19+ data models (internal UI state, WS messages, game entities)
    models/internal/       — errorMessageModel, infoMessageModel, loginStateModel, etc.
    models/ws/             — WebSocket message models (WsBase, req/, res/)
    mock/                  — Mock data for testing
  data/
    branches.js            — 3 branches: speed, power, technique (numeric data only, names via i18n)
    moves.js               — 18 moves with damage/speed per level (numeric data only, names/desc via i18n)
    requirements.js        — Tap/XP costs for unlock/levelup
  assets/
    main.css               — Global styles
    colors.css             — CSS variables
    fonts/                 — Anonymous, AnonymousBalance
    images/                — Backgrounds, icons, achievements (23 types)
    models/                — GLTF 3D models (punching bag, scene)
    sound/                 — punch_air.mp3, punch_hit.mp3, rain.mp3
    abi/                   — Smart contract ABI files (Web3)
    textures/              — 3D textures for Three.js
  locales/                 — i18n: ru, en, de, es, fr, hi, ja, ko, pt, zh, ar
  locales/pages/           — help/ and rules/ JSON pages per locale

/backend
  src/
    index.js               — Express server + WebSocket on same HTTP server
    config.js              — Constants (PORT, JWT_SECRET, game balance)
    routes/                — auth, user, club, task, file, fight
    middleware/            — auth.js (JWT guard), upload.js (Multer)
    websocket/handler.js   — Real-time message routing
    utils/helpers.js
  prisma/
    schema.prisma          — 10 models (PostgreSQL): User, Club, Fight, Achievement, Task, PunchInfo...
    migrations/            — PostgreSQL migration files
    seed.js                — Seeds 16 achievements + social/daily tasks (upsert)
```

---

## Routes

| Path | View | Auth |
|------|------|------|
| `/auth/login` `/auth/signup` `/auth/reset` `/auth/telegram` | RainView | No |
| `/privacy` `/404` `/rules` `/verify-email` | Static | No |
| `/` | RainView (home) | Yes |
| `/arena` | PreparationView | Yes |
| `/arena/autofight-log` | AutoFightLogView | Yes |
| `/fight` | CardFightView | Yes |
| `/training` | TrainingView | Yes |
| `/training/moves` | MoveTreeView | Yes |
| `/training/deck` | DeckBuilderView | Yes |
| `/profile` `/profile/balance` `/profile/wallet` `/profile/account` `/profile/skins` | ProfileView | Yes |
| `/club/:id` | ClubView | Yes |
| `/ratings/:type` | RatingsView | Yes |
| `/user/:userLogin` | ProfileView | Yes |

---

## Vuex Modules (11)

| Module | Purpose |
|--------|---------|
| `masterState` | App init, auth status, info/error messages, language |
| `userState` | Current user profile, stats, avatar |
| `cardFightState` | Active fight: rounds, HP, dice, coach, localStorage persist |
| `progressionState` | Moves unlocked/levels, taps, XP per branch |
| `clubState` | Club info, members, balance |
| `taskState` | Daily + social tasks |
| `punchState` | Punch/tap rate limiting, cooldown |
| `achievementState` | Achievements list + unlocking |
| `contractState` | Web3 wallet, token balance |
| `webSocketState` | WS connection, real-time messages |
| `autoFightState` | Auto fight: scheduling, offline simulation, fight log, push notifications |

---

## Game Data

### Branches (`/src/data/branches.js`)
- `speed` — Скорость: jab, double_jab, rapid_fire, combo_strike, flurry, hurricane
- `power` — Сила: straight, hook, uppercut, haymaker, hammer_fist, knockout_blow
- `technique` — Техника: block_strike, counter_jab, feint_cross, parry_punish, slip_counter, precision_strike

### Moves (`/src/data/moves.js`)
18 moves, each: `{ id, name, branch, description, damage[5], speed[5] }`
- damage and speed arrays = values per level (1–5)
- `name` and `description` are legacy Russian fallbacks; UI uses `t.gameData.moves[id].name/description` from i18n

### Requirements (`/src/data/requirements.js`)
```js
levelUpRequirements: { 2: {taps:100, exp:50}, 3: {taps:200, exp:100}, 4: {taps:350, exp:200}, 5: {taps:500, exp:350} }
unlockRequirements:  { 3: {taps:300, exp:150}, 4: {taps:250, exp:120}, 5: {taps:200, exp:100} }
```

---

## CSS Design System

**Colors** (`/src/assets/colors.css`):
```css
--pink: #FF066F          /* primary accent - neon pink */
--pinkDark: #a50344
--dark: #090909
--gray1: #3F3F3F66       /* semi-transparent */
--gray2: #808080
--gray3: #A0A0A0
--white: #FFFFFF
--black-opacity: #0000005c
--black-opacity-80: #090909CC
--primary-color: var(--pink)
```

**Fonts:**
- `Anonymous` — special UI elements, titles
- `AnonymousBalance` — numeric values (taps, XP, balance)

**Design language:** Dark theme, neon pink accents, semi-transparent backgrounds, thin gray borders.

---

## Game Constants (`/src/core/constants.js`)

```js
COST_CREATE_CLUB = 10000
COST_PER_CLICK = 2
MULTIPLAYER_EXACT_CLICK = 3

MAX_HP = 100
MAX_ROUNDS = 10
MAX_DECK_SIZE = 8
MIN_DECK_SIZE = 4
COUNTDOWN = 3            // seconds before fight

BASE_DAMAGE = 15
POSITION_BONUS = 5
DICE_COOLDOWN_ROUNDS = 3
EMERGENCY_HP_THRESHOLD = 30

COACH_MIN_ROUND = 6
COACH_TRIGGER_CHANCE = 1.0
COACH_BOOST_ROUNDS = 4

SPEED_MOVE_PUNCH_MS = 1500
ROUND_ANIMATION_MS = 1500
BATCH_SEND_INTERVAL_MS = 11000
DECIMALS = 6             // token decimal places
LISTING = 1783306800     // token listing timestamp

AUTO_FIGHT_MIN_INTERVAL = 1800000   // 30 min
AUTO_FIGHT_MAX_INTERVAL = 3600000   // 60 min
AUTO_FIGHT_MAX_PER_DAY = 24
AUTO_FIGHT_MAX_PER_SESSION = 48
```

---

## Backend Config (`/backend/src/config.js`)

```js
PORT = 3000
WS_PORT = 444
PUNCH_MAX_PER_INTERVAL = 10000
PUNCH_MAX_PER_BATCH = 10000
PUNCH_INTERVAL_MS = 3600000   // 1 hour
COST_PER_CLICK = 2
COST_CREATE_CLUB = 10000
```

**CORS:** Allows `hexlash.com`, `test.hexlash.com`, `hexlash.vercel.app`, `*.vercel.app`
**Health checks:** `GET /` and `GET /health`

---

## Combat System

**Flow:** Build deck (4–8 modules) → Generate AI opponent → Simulate rounds → Dice mechanic → Coach advice → Save result

**Auto Fight:** Toggle on Arena screen → fights every 30–60 min offline → uses CombatEngine + ModuleAIStrategy → localStorage persist (`hexlash_autofight_state`, `hexlash_autofight_history`) → push notifications via Notification API → limits: 24/day, 48/session → auto-catches up missed fights on tab focus

**Dice effects:** Heal, Adrenaline, Shield, Blind, Rage, Crit

**Files:**
- `combatEngine.js` — Round simulation
- `aiStrategy.js` — AI decision logic
- `opponentGenerator.js` — Random opponent creation
- `archetypes.js` — Speed/Power/Technique archetypes

---

## Key Views

| View | File | Notes |
|------|------|-------|
| Training | `TrainingView.vue` | 3D punch bag, taps, daily/social tasks, progression bar |
| Move Tree | `MoveTreeView.vue` | Branch sidebar (Speed/Power/Tech) + move cards. Sidebar buttons centered with `position:absolute; top:35%; transform:translateY(-50%)` |
| Fight | `CardFightView.vue` | Main combat, dice, coach advice, HP bars |
| Profile | `ProfileView.vue` | Tabs: balance, wallet, account, skins |
| Ratings | `RatingsView.vue` | Club and player leaderboards |
| Preparation | `PreparationView.vue` | Arena bet + opponent selection + auto fight toggle/status |

---

## i18n System

**Custom reactive i18n** (not vue-i18n): `locales/index.js` exports `t` (computed ref), `setLanguage()`, `interpolate()`

**11 locales:** en, ru, de, es, fr, pt, ar, hi, ja, ko, zh

**Key sections per locale:**
- UI labels: `menu`, `auth`, `profile`, `arena`, `fight`, `training`, `moves`, `deck`, `cards`, `rating`, `club`, `info`, `nav`, `autoFight`
- Game data translations: `gameData.branches[id].{name,description}`, `gameData.moves[id].{name,description}`
- Page content: `locales/pages/help/{lang}.json`, `locales/pages/rules/{lang}.json`

**Usage in templates:** `{{ t.section.key }}` (auto-unwrapped ref)
**Usage in script:** `t.value.section.key`
**Interpolation:** `interpolate(t.value.moves.lblUnlockFirst, { name: '...' })`

---

## Component Highlights

- `Logo.vue` — header logo
- `BottomMenu.vue` — bottom nav (Arena, Training, Ratings, Profile)
- `Info.vue` / `Error.vue` — toast notifications
- `NewAchievement.vue` — achievement popup
- `Punch3D.vue` — Three.js punching bag
- `MoveTreeCard.vue` — move row in tree
- `MoveDetailsModal.vue` — move detail/unlock popup
- `AutoFightToggle.vue` — auto fight on/off button
- `AutoFightStatus.vue` — auto fight live status + countdown
- `HPBar.vue` — fight health bar
- `Fighter.vue` — fighter display in combat

---

## API (backend)

Base: `/v1/`

| Route | File | Purpose |
|-------|------|---------|
| `/auth` | auth.js | login, signup, reset, telegram |
| `/user` | user.js | profile, stats, avatar, achievements |
| `/club` | club.js | create/edit club, members, balance |
| `/task` | task.js | daily + social tasks |
| `/file` | file.js | avatar/file upload |
| `/fight` | fight.js | save fight results, update win/loss/draw stats |

Auth guard: JWT Bearer token via `middleware/auth.js`

### WebSocket Protocol

| Request Message | Response | Purpose |
|----------------|----------|---------|
| `PunchInfoRequestMsg` | `PunchInfoResponseMsg` | Get punch rate limit info |
| `PunchBatchRequestMsg` | `UserResponseMsg` | Submit batch of punches |
| `FightTicketMsg` | `FightInfoMsg` | Request new fight ticket |
| `FightActionMsg` | — | Send PvP fight action |
| — | `AchievementResponseMsg` | Auto-awarded achievement (punch milestones: 100, 1k, 5k, 10k) |
| — | `ErrorMsg` | Error response |

---

## Database Models (Prisma/PostgreSQL)

User, Club, Achievement, UserAchievement, SocialTask, UserSocialTask, DailyTask, UserDailyTask, Fight, PunchInfo

**Seed data:** 16 achievements (NEWBIE, CONNECTED_FIGHTER, REGULAR_FIGHTER, BATTLE_VETERAN, FIGHT_MASTER, COACH, RECRUITER, PROJECT_MAYHEM, MEATLOAF, TYLER, EXPERT, LUCKY_ONE, BOB, PAPER_STREET, MEETING_PARTICIPANT, GOLDEN_RULE) + social/daily tasks (en/ru)

---

## Build & Deploy

- **Frontend:** Vite + JS obfuscation + Brotli + image optimization (mozjpeg/pngquant/webp) + terser (drops console)
- **Deploy:** Vercel or Nginx reverse proxy via Docker
- **Backend:** Node.js + PostgreSQL (Railway or local)
- **WebSocket:** Authenticated via JWT, same HTTP server as Express

---

## Branch (Git)

Development branch: `claude/fix-language-system-PPpvI`
Push: `git push -u origin claude/fix-language-system-PPpvI`
