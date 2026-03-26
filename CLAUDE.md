# HEXLASH — Project Memory

Full-stack Web3 fighting game. Vue 3 SPA + Express backend + PostgreSQL. Telegram WebApp compatible.

> **RULE: After every task, update this file.** Changed views/components → update descriptions. New components → add to Component Highlights. New data files → add to Project Structure. Changed architecture → update relevant sections. CLAUDE.md is the source of truth.

---

## Tech Stack

**Frontend:** Vue 3.5 · Vite 7 · Vuex 4 · Vue Router 4 · Vuetify 2 · Three.js · Howler.js · Ethers.js 6 · Vue-i18n 11 · Amplitude · Web3Modal

**Backend:** Express 4 · Prisma 5 (PostgreSQL) · JWT · WebSocket (ws) · Multer · bcryptjs · express-rate-limit · Anthropic SDK (AI Trainer)

---

## Project Structure

```
/src
  App.vue                  — Root: header (Logo), router-view, BottomMenu (hidden on PvP screens), Info/Error toasts, ChallengeNotification
  main.js                  — Entry: Vue + Vuetify + i18n + Vuex store init
  router/index.js          — Routes + auth guards + fight state restore
  views/                   — 17 page-level components
  components/              — 75+ reusable components
  core/
    state/store.js         — Vuex store
    state/modules/         — 13 Vuex modules
    models/                — 20 data models (internal, ws, etc.)
    services/              — 8 business logic services
    database/              — 7 LocalStorage/IDB repository files
    api/apiClient.js       — Axios HTTP client
    engine/                — Combat system (combatEngine, aiStrategy, opponentGenerator)
    constants.js           — Game constants
    websocket/             — WebSocket client
    mock/mockData.js       — Mock data for development
  data/
    branches.js            — 3 branches: speed, power, technique (numeric data only, names via i18n)
    moves.js               — 18 moves with damage/speed per level (numeric data only, names/desc via i18n)
    requirements.js        — Tap/XP costs for unlock/levelup
    cardPower.js           — Card/module power balance data
    pixelIcons.js          — 45 pixel icons (16×16 grid, flat array 256 values)
  utils/
    powerRating.js         — Power rating calculations
  styles/
    hexlash-ui.css         — Design system: CSS variables, component classes, animations
  assets/
    main.css               — Global styles
    colors.css             — CSS variables
    fonts/                 — Anonymous, AnonymousBalance
    images/                — Backgrounds, icons, achievements (40+ files)
    models/                — GLTF 3D models (punching bag, scene)
    sound/                 — punch_air.mp3, punch_hit.mp3, rain.mp3
    textures/              — Texture files
    abi/                   — Smart contract ABIs
  locales/                 — i18n: ru, en, de, es, fr, hi, ja, ko, pt, zh, ar
    pages/rules/           — 11 locale rule pages (JSON)
    pages/help/            — Help pages (en, ru)

/backend
  src/
    index.js               — Express server + WebSocket on same HTTP server
    config.js              — Constants (PORT, WS_PORT, JWT_SECRET, game balance)
    routes/                — auth, user, club, task, file, fight, stats, friends, ai
    middleware/            — auth.js (JWT guard), upload.js (Multer)
    websocket/handler.js   — Real-time message routing + challenge system
    websocket/pvpHandler.js — PvP fight message handling
    services/matchmaking.js — PvP matchmaking service
    services/pvpMatchManager.js — PvP match lifecycle management
    services/pvpCombatEngine.js — PvP combat engine
    utils/helpers.js
  prisma/
    schema.prisma          — 12 models: User, Club, Fight, Achievement, Task, PunchInfo, FriendRequest, Friendship...
    seed.js
    migrations/            — PostgreSQL migrations

/public
  images/skins/            — 145+ fighter skin images (skin_m_1..117.png, skin_w_1..26.png, vip_k1/k2/t1/t2.png)
  images/tgskins/          — Same skins (symlink/copy), legacy path

/skills/                   — 12 Claude Code skill files
  hexlash-dev/SKILL.md        — Core workflow, project structure, git
  hexlash-vue/SKILL.md        — Vue 3 frontend conventions
  hexlash-combat/SKILL.md     — Combat system (PvE, PvP, Auto Fight)
  hexlash-websocket/SKILL.md  — WebSocket protocol
  hexlash-deploy/SKILL.md     — Deploy & infrastructure
  hexlash-design/SKILL.md     — Design system (colors, fonts, UI)
  hexlash-api/SKILL.md        — Backend API (Express, Prisma, JWT)
  hexlash-testing/SKILL.md    — Testing & QA procedures
  hexlash-web3/SKILL.md       — Web3 integration (NFT, wallet, x402)
  hexlash-ai/SKILL.md         — AI system (Claude API, Trainer)
  hexlash-i18n/SKILL.md       — Localization (11 languages)
  hexlash-gamedesign/SKILL.md — Game design & balance
```

---

## Routes

| Path | View | Auth |
|------|------|------|
| `/auth/login` `/auth/signup` `/auth/reset` `/auth/telegram` | RainView | No |
| `/privacy` `/404` `/rules` `/verify-email` | Static | No |
| `/` | RainView (home) | Yes |
| `/help` | PageView | Yes |
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
| `/friends` | FriendsView | Yes |
| `/matchmaking` | MatchmakingView | Yes |
| `/spectate/:odId` | SpectateView | Yes |

---

## Vuex Modules (13)

| Module | Purpose |
|--------|---------|
| `masterState` | App init, auth status, info/error messages, language |
| `userState` | Current user profile, stats, avatar |
| `cardFightState` | Active fight: rounds, HP, dice, coach, playerModules, localStorage persist |
| `progressionState` | Moves unlocked/levels, taps, XP per branch, server sync (PUT /user/progression) |
| `clubState` | Club info, members, balance |
| `taskState` | Daily + social tasks |
| `punchState` | Punch/tap rate limiting, cooldown, 2D/3D punch toggle, sound mute toggle |
| `achievementState` | Achievements list + unlocking |
| `contractState` | Web3 wallet, token balance |
| `webSocketState` | WS connection, real-time messages |
| `autoFightState` | Auto fight: scheduling, offline simulation, fight log, push notifications, daily auto-reset, server sync (POST /fight/save), AI analysis (series analysis via Claude API) |
| `pvpState` | Real-time PvP matchmaking and fights |
| `friendsState` | Friends list, friend requests, challenges (WebSocket-based) |

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

## Design System — "Neon Discipline"

**Status:** Phase 1 (foundation) + Phase 2 (navigation) complete.

### UI Components (`/src/components/ui/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PixelIcon` | `PixelIcon.vue` | 16×16 canvas-based pixel icons. Props: name, size, color, glow, glowColor, glowSize, disabled. Resolves CSS vars for canvas fill. |
| `HexButton` | `HexButton.vue` | 5 variants: primary, secondary, ghost, danger, archetype. 3 sizes (sm/md/lg). Props: icon (PixelIcon), loading (CSS spinner), block, disabled, archetypeColor. |
| `HexCard` | `HexCard.vue` | 5 variants: default, elevated, archetype (left border), active (tinted bg), result (top border victory/defeat/draw). Slots: header, footer. Padding: none/sm/md/lg. |
| `HexProgress` | `HexProgress.vue` | Progress bar. 3 variants: hp (auto green/yellow/red by %), branch (speed/power/technique colors), generic. 3 sizes. Props: label, showValue, showPercent. |
| `HexBadge` | `HexBadge.vue` | Pill badge. 5 variants: archetype, branch, status (victory/defeat/draw/info), counter (circle/pill auto), custom. Props: icon (PixelIcon), pulse animation. |

### Pixel Icons (`/src/data/pixelIcons.js`)

45 icons across 9 categories. Each: 16×16 grid, flat array of 256 (0/1), row-major.

| Category | Icons | Count |
|----------|-------|-------|
| archetype | predator, sentinel, ghost, analyst, maverick, juggernaut | 6 |
| branch | speed, power, technique | 3 |
| nav | arena, training, ratings, profile | 4 |
| combat | hp, shield, dice, coach, damage, heal | 6 |
| dice | dice_heal, dice_adrenaline, dice_shield, dice_blind, dice_rage, dice_crit | 6 |
| mode | pve, pvp, auto | 3 |
| social | friends, club, challenge, search, online, spectate | 6 |
| progression | xp, taps, lock, unlock, star | 5 |
| ui | close, menu, settings, sound, wallet, back | 6 |

Optimal weight: 40–70 filled pixels (15–27%). Exception: `online` dot = 32px.

### CSS Variables (`/src/styles/hexlash-ui.css`)

All new components use `--hex-*` variables exclusively. Legacy `--pink`, `--dark`, `--gray*` still exist in `colors.css` for unconverted components.

Key variable groups: `--hex-primary`, `--hex-bg-{dark,medium,light}`, `--hex-text-{primary,secondary,muted}`, `--hex-border-{default,active,strong}`, `--hex-arch-{name}` (6 archetypes × 5 variants each), `--hex-branch-{name}`, `--hex-dice-{effect}`, `--hex-mode-{type}`, `--hex-victory/defeat/draw` + `-bg`.

### Archetype color → CSS var usage pattern

For components that accept archetype colors dynamically (HexButton archetype, HexCard active/archetype), pass the CSS var string as prop:
```vue
<HexButton variant="archetype" archetype-color="var(--hex-arch-predator)">Attack</HexButton>
<HexCard variant="active" archetype-color="var(--hex-arch-sentinel)">...</HexCard>
```
Internally uses `--_arch-color` CSS custom property for scoped styling.

### Test/demo files
- `test-icons.html` — all 45 pixel icons rendered at 48px, grouped by category
- `src/test-components.html` — HexButton, HexCard, HexProgress, HexBadge demos

---

## CSS Design System (legacy → migrating to --hex-*)

> **Active system:** `/src/styles/hexlash-ui.css` with `--hex-*` variables. All new/updated components use exclusively `--hex-*` vars.
> **Legacy:** `/src/assets/colors.css` with `--pink`, `--dark`, `--gray*`, `--white` etc. Still used by unconverted components. Do NOT use legacy vars in new code.

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
- System sans-serif (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`) — compact arena buttons (Mode, Friends)

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
ROUND_ANIMATION_MS = 1500

BASE_DAMAGE = 15
POSITION_BONUS = 5
DICE_COOLDOWN_ROUNDS = 3
EMERGENCY_HP_THRESHOLD = 30

COACH_MIN_ROUND = 6
COACH_TRIGGER_CHANCE = 1.0
COACH_BOOST_ROUNDS = 4

SPEED_MOVE_PUNCH_MS = 1500
BATCH_SEND_INTERVAL_MS = 11000
DECIMALS = 6             // token decimal places

AUTO_FIGHT_MIN_INTERVAL = 600000    // 10 min
AUTO_FIGHT_MAX_INTERVAL = 600000    // 10 min
AUTO_FIGHT_MAX_PER_DAY = 144
AUTO_FIGHT_MAX_PER_SESSION = 288

LISTING = 1783306800     // token listing timestamp
```

---

## Backend Config (`/backend/src/config.js`)

```js
PORT = 3000
WS_PORT = 444
JWT_SECRET = env              // REQUIRED — server crashes without it (no default)
FRONTEND_URL = 'http://localhost:5173'
UPLOAD_DIR = './uploads'
DECIMALS = 6
COST_PER_CLICK = 2
COST_CREATE_CLUB = 10000
PUNCH_MAX_PER_INTERVAL = 10000
PUNCH_MAX_PER_BATCH = 10000
PUNCH_INTERVAL_MS = 3600000   // 1 hour

// Telegram Auth
TELEGRAM_BOT_TOKEN = env      // for HMAC-SHA256 signature validation
TELEGRAM_AUTH_MAX_AGE_SEC = 300  // 5 min replay window

// PvP Combat
MAX_HP = 100
MAX_ROUNDS = 10
MAX_DECK_SIZE = 8
MIN_DECK_SIZE = 4
COUNTDOWN_MS = 3000
ROUND_ANIMATION_MS = 1500
BASE_DAMAGE = 15
POSITION_BONUS = 5
DICE_COOLDOWN_ROUNDS = 3
DICE_PAUSE_TIMEOUT_MS = 10000
EMERGENCY_HP_THRESHOLD = 30
COACH_MIN_ROUND = 6
COACH_BOOST_ROUNDS = 4
COACH_PAUSE_TIMEOUT_MS = 10000

// PvP Archetype Modifiers (passive per-archetype bonuses)
SLOT_WEIGHTS = [0.5, 0.3, 0.2]
ARCHETYPE_MODIFIERS = { predator, sentinel, ghost, analyst, maverick, juggernaut }

// AI Trainer
ANTHROPIC_API_KEY = env
ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'
AI_TRAINER_MAX_TOKENS = 300
AI_TRAINER_ENABLED = true
```

**Prisma:** Singleton via `backend/src/lib/prisma.js` — all routes and services use shared instance
**CORS:** Allows `hexlash.com`, `test.hexlash.com`, `hexlash.vercel.app` (no wildcard `*.vercel.app`)
**Health checks:** `GET /` and `GET /health`
**Body limits:** `express.json({ limit: '1mb' })`, `express.urlencoded({ limit: '1mb' })`

---

## Combat System

**Flow:** Build deck (4–8 modules) → Generate AI opponent → Simulate rounds → Dice mechanic → Coach advice → Save result

**Auto Fight:** Toggle on Arena screen → fights every 10 min offline → uses CombatEngine + ModuleAIStrategy → localStorage persist (`hexlash_autofight_state`, `hexlash_autofight_history`) → push notifications via Notification API → limits: 144/day, 288/session → auto-catches up missed fights on tab focus → daily auto-reset: on new day clears fight log, wins/losses/draws/XP counters (no manual clear button) → **offline auto fights sync results to server** via `POST /fight/save` (increments pveWins/pveLosses/pveDraws/pveTotalFights). Dice uses cooldown (every 3 rounds, multiple per fight). XP: win=10, draw=7, lose=5.

**Sound:** Howler.js for punch sounds (BottomMenu, TrainingView) and rain ambience (RainView). Mute toggle in Profile > Account (`SoundToggle.vue`), persisted in localStorage (`isMuted`), checked via `store.getters['punch/isMuted']`

**PvP:** Real-time matchmaking via WebSocket → friend challenges (WebSocket-based, 10s timer) → spectate mode → backend matchmaking service. BottomMenu hidden on all PvP screens (matchmaking, fight, spectate). Opponent Found screen shows actual fighter skins (from `/images/skins/`).

**Friend Challenge Flow:** Player A clicks ⚔️ → `challenge_send` via WS → server checks online → `challenge_received` → Player B sees ChallengeNotification (top-of-screen, 10s auto-decline) → accept → server creates match via pvpMatchManager → `challenge_start` → both navigate to `/fight?mode=pvp&matchId=...`

**Dice (unified PvE/PvP):** Available after round 1, cooldown 3 rounds. Random effect: Heal +15HP, Adrenaline x2 ATK (1 round), Shield full block (1 round), Blind guaranteed miss (1 round), Rage -20HP instant, Crit -30HP instant. Rage/Crit can kill. Disabled in Overdrive.
- **PvE:** Player clicks dice button on screen.
- **PvP:** Server-controlled. `dice_available` → player clicks → `dice_roll` via WS → `dice_rolled` response. Rage/Crit send `oppHp` + `killed` flag. If killed → `fight_end` immediately.

**PvE Coach Advice:** Triggers once per fight from round 6 (COACH_MIN_ROUND). Fight pauses, 15s timer. 3 options: Attack (+25 priority), Defense (+25 priority), Position (+25 priority). Boost lasts 4 rounds via aiStrategy.setCoachBoost(). Coach active bar shows remaining rounds.

**PvP Coach Advice:** Same UI as PvE (3 options: Attack/Defense/Position) but 10s timer. Fight pauses for both players. Each player picks independently. Backend applies effects: `coach_attack` (+25% dmg), `coach_defense` (-30% incoming), `coach_position` (+15% dmg & -15% incoming) for 4 rounds. After choosing → "Waiting for opponent..." until both decide or timer expires. No boost if player doesn't choose.

**AI Trainer:** Claude-powered post-fight analysis (PvE and PvP). Component `AiTrainerAnalysis.vue` renders on CardFightView results screen. Sends fight data (rounds, decks, result, dice/coach/emergency usage) to `POST /v1/ai/analyze-fight` → backend calls Anthropic Claude API → returns 4-section analysis: Fight Summary, What You Did Well, What Went Wrong, Advice. Feature flag: `AI_TRAINER_ENABLED`. Graceful degradation on error. i18n keys: `fight.lblAiTrainer`, `fight.lblAiLoading`, `fight.lblAiError`.

**AI Auto Fight Analysis:** Claude-powered analysis of auto fight series. Component `AutoFightAnalysis.vue` renders on AutoFightLogView screen. Player selects period (Last 5 / Last 10 / All) and clicks "Analyze" → sends fight series data to `POST /v1/ai/auto-fight-summary` → returns 4-section analysis: Session Overview, Strengths, Weaknesses, Recommendation. Model: `claude-haiku-4-5-20251001`, max_tokens: 400, rate limit: 5/min. Vuex state in `autoFightState` (aiAnalysis, aiAnalysisLoading, aiAnalysisError, aiAnalysisPeriod). Auto fight log entries now include: playerModules, opponentModules, diceUsed, diceEffect, coachUsed, coachChoice, emergencyUsed.

**Data Persistence:** Progression (moves, XP, taps, deck, playerModules) syncs to server via `PUT /v1/user/progression` (debounced 3s). Server is source of truth — restores all data on login via `GET /v1/user/me`. PlayerModules (fighter archetypes) included in progression JSON. Auto fight state/history is localStorage-only (not critical — fight results already synced via `POST /fight/save`). PvP fight state is cleared from localStorage on `fight_end` via `clearSavedFight` action to prevent stale restore on next visit.

**Known PvE vs PvP divergences (under review):**

| Mechanic | PvE (frontend) | PvP (backend) | Status |
|----------|---------------|---------------|--------|
| Archetypes | 6 archetypes via ModuleAIStrategy (weighted action priorities) | Passive modifiers: dmgBonus, incomingReduction, dodge, crit | Done |
| Actions | attack/defense/position each round | None — both always attack | Divergent (by design) |
| Dodge | 12% on position vs attack | Archetype-based (Ghost 8%, Analyst 2%, Maverick 4%) | Done |
| Crit | 10% chance x1.5 on attack | Archetype-based (Predator 8%, Juggernaut 3%, Analyst 2%) | Done |
| Dice | All 6 effects unified | Same as PvE (instant Rage/Crit, full Shield/Blind) | Unified |

**Files:**
- `combatEngine.js` — PvE round simulation (action-based: attack/defense/position, dodge/crit)
- `aiStrategy.js` — AI decision logic: archetype priorities (slot weights 50/30/20%), coach boost, dice preferences
- `archetypes.js` — 6 archetypes: Predator, Sentinel, Ghost, Analyst, Maverick, Juggernaut (priorities, dicePreferences)
- `opponentGenerator.js` — Random opponent creation
- `pvpCombatEngine.js` — PvP round simulation (no actions/archetypes, pure move damage + speed order), dice effects, coach effects
- `pvpMatchManager.js` — PvP match lifecycle
- `pvpHandler.js` — PvP WebSocket message handling (dice_roll, coach_choice)
- `AiTrainerAnalysis.vue` — AI Trainer post-fight analysis component
- `AutoFightAnalysis.vue` — AI auto fight series analysis component
- `backend/src/routes/ai.js` — AI Trainer + Auto Fight Summary API endpoints

---

## Key Views

| View | File | Notes |
|------|------|-------|
| Training | `TrainingView.vue` | 3D punch bag, taps, daily/social tasks, progression bar |
| Move Tree | `MoveTreeView.vue` | Branch sidebar (Speed/Power/Tech) + move cards. Sidebar buttons centered with `position:absolute; top:35%; transform:translateY(-50%)` |
| Fight | `CardFightView.vue` | Main combat (PvE + PvP), dice, coach advice, HP bars, AI Trainer (PvE results). PvP mode: no BottomMenu, no PvP badge, reduced padding. Fully migrated to --hex-* vars (Phase 3.2a): HexButton for results, PixelIcon for auto banner, dice/coach/victory/defeat/overdrive all use design system vars |
| Profile | `ProfileView.vue` | Tabs: balance, wallet, account, skins |
| Ratings | `RatingsView.vue` | Club and player leaderboards |
| Preparation | `PreparationView.vue` | Arena: action row (Mode + START FIGHT + Friends buttons), auto fight toggle/status. Friends button is text-only (no online indicator) |
| Friends | `FriendsView.vue` | Friends list, friend requests, search players |
| Matchmaking | `MatchmakingView.vue` | Real-time PvP matchmaking queue. Opponent Found shows fighter skins (not icons). No colored borders. 100dvh support. |
| Spectate | `SpectateView.vue` | Watch live PvP fights |

---

## i18n System

**Custom reactive i18n** (not vue-i18n): `locales/index.js` exports `t` (computed ref), `setLanguage()`, `interpolate()`

**11 locales:** en, ru, de, es, fr, pt, ar, hi, ja, ko, zh

**Key sections per locale:**
- UI labels: `menu`, `auth`, `profile`, `arena`, `fight`, `training`, `moves`, `deck`, `cards`, `rating`, `club`, `info`, `nav`, `autoFight`, `friends`, `pvp`, `spectate`, `xpAllocation`
- Game data translations: `gameData.branches[id].{name,description}`, `gameData.moves[id].{name,description}`
- Page content: `locales/pages/help/{lang}.json`, `locales/pages/rules/{lang}.json`

**Usage in templates:** `{{ t.section.key }}` (auto-unwrapped ref)
**Usage in script:** `t.value.section.key`
**Interpolation:** `interpolate(t.value.moves.lblUnlockFirst, { name: '...' })`

---

## Component Highlights

**Design System (`/src/components/ui/`):**
- `PixelIcon.vue` — Canvas-based 16×16 pixel icon renderer. Props: name, size, color, glow, glowColor, glowSize, disabled. Resolves CSS vars via `getComputedStyle`. Data in `pixelIcons.js` (45 icons).
- `HexButton.vue` — Button with 5 variants (primary/secondary/ghost/danger/archetype), 3 sizes (sm/md/lg). Supports: PixelIcon via `icon` prop, loading spinner, block width, archetypeColor via `--_arch-color` CSS custom property.
- `HexCard.vue` — Card with 5 variants (default/elevated/archetype/active/result). Archetype = left border accent, active = tinted bg + color border, result = top border (victory/defeat/draw). Slots: default, header, footer. Padding: none/sm/md/lg.
- `HexProgress.vue` — Progress bar with 3 variants: hp (auto green>60%/yellow>30%/red), branch (speed/power/technique colors), generic. Props: label, showValue, showPercent. 3 sizes.
- `HexBadge.vue` — Pill badge with 5 variants: archetype, branch, status (victory/defeat/draw/info), counter (auto circle<10/pill≥10), custom. Props: icon (PixelIcon), pulse animation.

**Navigation & Layout:**
- `Logo.vue` — header logo (Anonymous font, --hex-primary color + glow)
- `BottomMenu.vue` — bottom nav (Arena, Training, Ratings, Profile). Uses PixelIcon with glow for active tab. Solid bg `--hex-bg-medium`, no gradient. Hidden on PvP screens via `isPvPScreen` computed in App.vue
- `App.vue` header — gradient uses `--hex-bg-dark`, balance in AnonymousBalance font with `--hex-text-primary`

**Game Components:**
- `Info.vue` / `Error.vue` — toast notifications (text interpolation `{{ }}`, NOT v-html — XSS safe)
- `NewAchievement.vue` — achievement popup
- `Punch3D.vue` — Three.js punching bag
- `MoveTreeCard.vue` — move row in tree
- `MoveDetailsModal.vue` — move detail/unlock popup
- `AutoFightToggle.vue` — auto fight on/off button
- `AutoFightStatus.vue` — auto fight live status + countdown
- `SoundToggle.vue` — sound mute/unmute toggle (Profile > Account)
- `HPBar.vue` — fight health bar
- `Fighter.vue` — fighter display in combat
- `ModeSelector.vue` — arena mode selector (PvE/PvP/Auto), compact button with dropdown, system sans-serif font
- `FriendCard.vue` — friend display card
- `FriendRequestCard.vue` — incoming friend request
- `ChallengeModal.vue` — PvP challenge popup (legacy, kept as fallback)
- `ChallengeNotification.vue` — Top-of-screen challenge notification (global, z-index: 9999, 10s timer)
- `PlayerSearchResult.vue` — player search result item
- `XPAllocationModal.vue` — XP allocation modal
- `PvPStatsCard.vue` — PvP statistics display
- `AiTrainerAnalysis.vue` — Claude-powered post-fight analysis (PvE + PvP, results screen)
- `AutoFightAnalysis.vue` — Claude-powered auto fight series analysis (AutoFightLogView)

---

## API (backend)

Base: `/v1/`

| Route | File | Purpose |
|-------|------|---------|
| `/auth` | auth.js | login, signup, reset, telegram. Rate limited: login 5/15min, register 3/hr, telegram 10/15min |
| `/user` | user.js | profile, stats, avatar, achievements. Skin validated via regex. Delete uses $transaction with cascade |
| `/club` | club.js | create/edit club, members, balance |
| `/task` | task.js | daily + social tasks |
| `/file` | file.js | avatar/file upload |
| `/fight` | fight.js | fight creation, results, history |
| `/stats` | stats.js | player and game statistics |
| `/friends` | friends.js | friends list, requests, search players |
| `/ai` | ai.js | AI Trainer fight analysis (POST /analyze-fight), Auto fight summary (POST /auto-fight-summary) |

Auth guard: JWT Bearer token via `middleware/auth.js`
Telegram auth: HMAC-SHA256 signature validation via `validateTelegramPayload()` in auth.js
Password reset: Returns 501 (not implemented) — no fake success

### WebSocket Protocol

| Request Message | Response | Purpose |
|----------------|----------|---------|
| `PunchInfoRequestMsg` | `PunchInfoResponseMsg` | Get punch rate limit info |
| `PunchBatchRequestMsg` | `UserResponseMsg` | Submit batch of punches |
| `FightTicketMsg` | `FightInfoMsg` | Request new fight ticket |
| `FightActionMsg` | — | Send PvP fight action |
| `challenge_send` | `challenge_sent` / `challenge_error` | Send PvP challenge to friend |
| `challenge_accepted` | `challenge_start` | Accept incoming challenge → creates match |
| `challenge_declined` | `challenge_declined` | Decline incoming challenge |
| — | `challenge_received` | Incoming challenge notification |
| `MatchmakingStartMsg` | `MatchmakingQueueMsg` / `MatchFoundMsg` | Join matchmaking queue |
| `MatchmakingCancelMsg` | `MatchmakingCancelledMsg` | Leave matchmaking queue |
| `pvp_ready` | `fight_start` | Signal readiness + send deck |
| `dice_roll` | `dice_rolled` / `dice_error` | Roll dice in PvP (instant, no pause) |
| — | `dice_available` | Server notifies dice is off cooldown |
| `coach_choice` | — | Send coach advice choice `{ action: 'attack'\|'defense'\|'position' }` |
| — | `coach_pause` | Server pauses fight for coach advice (10s) |
| — | `coach_result` | Both players chose, fight resumes |
| — | `coach_opponent_ready` | Opponent already made their coach choice |
| — | `round_result` | Round simulation result with HP, damage, effects |
| — | `fight_end` | Fight finished with winner, reason, XP |
| — | `overdrive_start` | Overdrive phase started (rounds > MAX_ROUNDS) |
| — | `AchievementResponseMsg` | Auto-awarded achievement (punch milestones: 100, 1k, 5k, 10k) |
| — | `ErrorMsg` | Error response |

---

## Database Models (Prisma/PostgreSQL)

User, Club, Achievement, UserAchievement, SocialTask, UserSocialTask, DailyTask, UserDailyTask, Fight, PunchInfo, FriendRequest, Friendship

**Seed data:** 16 achievements (NEWBIE, CONNECTED_FIGHTER, REGULAR_FIGHTER, BATTLE_VETERAN, FIGHT_MASTER, COACH, RECRUITER, PROJECT_MAYHEM, MEATLOAF, TYLER, EXPERT, LUCKY_ONE, BOB, PAPER_STREET, MEETING_PARTICIPANT, GOLDEN_RULE) + social/daily tasks (en/ru)

---

## Build & Deploy

- **Frontend:** Vite + JS obfuscation + Brotli + image optimization (mozjpeg/pngquant/webp) + terser (drops console)
- **Deploy:** Vercel or Nginx reverse proxy via Docker (`nginx.prod.conf`, `nginx.test.conf`, `Dockerfile`)
- **Backend:** Node.js + PostgreSQL (local or Railway)
- **WebSocket:** Authenticated via JWT, same HTTP server as Express (shared port)
- **CI/CD:** GitHub Actions (`.github/workflows/gitops.yaml`)

---

## Skins System

**Storage:** `User.skin` field in Prisma (default: `"skin_m_1.png"`)
**Frontend:** `master.userData.skin` via masterState. Change: `store.dispatch('master/changeSkin', skinId)` → saves to localStorage + IndexedDB + server (`PUT /v1/user/skin`)
**Assets:** `/public/images/skins/` — 117 male (`skin_m_N.png`), 26 female (`skin_w_N.png`), 4 VIP (`vip_kN/tN.png`)
**Rendering:** `<v-img :src="/images/skins/${skin}"/>` or `<img :src="/images/skins/${skin}"/>`
**PvP:** Skin transmitted in `MatchmakingStartMsg` → stored in matchmaking queue → sent in `MatchFoundMsg` to opponent → displayed in Opponent Found and Fight screens

---

## Skills System

12 Claude Code skills in `/skills/` directory:

| Skill | Triggers On |
|-------|-------------|
| `hexlash-dev` | Any task start, project structure, git, workflow |
| `hexlash-vue` | Vue components, Vuex, Router, frontend |
| `hexlash-combat` | Fight logic, PvE/PvP, dice, coach, engine |
| `hexlash-websocket` | WebSocket, real-time, messages, matchmaking |
| `hexlash-deploy` | Build, Docker, Nginx, Vercel, CI/CD |
| `hexlash-design` | CSS, colors, fonts, UI, layout, responsive |
| `hexlash-api` | API endpoints, Prisma, JWT, backend |
| `hexlash-testing` | Testing, QA, regression, debug |
| `hexlash-web3` | Blockchain, NFT, wallet, ERC-1155, x402 |
| `hexlash-ai` | Claude API, AI Trainer, prompts |
| `hexlash-i18n` | Translations, locales, i18n keys |
| `hexlash-gamedesign` | Balance, archetypes, mechanics, formulas |

---

## Security Hardening (applied)

| Fix | File | Details |
|-----|------|---------|
| JWT no default secret | `config.js` | Server crashes on missing `JWT_SECRET` env var |
| Telegram HMAC-SHA256 | `auth.js` | `validateTelegramPayload()` with replay protection (5min) |
| Rate limiting | `auth.js` | login 5/15min, register 3/hr, telegram 10/15min via express-rate-limit |
| Crypto temp password | `auth.js` | `crypto.randomBytes(12)` instead of `Math.random()` |
| CORS wildcard removed | `index.js` | No more `*.vercel.app` — explicit origins only |
| Body size limit | `index.js` | `express.json({ limit: '1mb' })` |
| XSS in toasts | `Error.vue`, `Info.vue` | `v-html` replaced with `{{ }}` text interpolation |
| Skin validation | `user.js` | Regex whitelist: `skin_(m|w)_\d{1,3}.png` or `vip_(k|t)\d{1,2}.png` |
| Email verify auth | `user.js` | Now requires `authMiddleware`, uses `req.userId` |
| Password reset honest | `user.js` | Returns 501 instead of fake success |
| Cascade delete | `user.js` | `$transaction`: clubs, fights, friends, achievements, tasks, punch |
| Prisma singleton | `lib/prisma.js` | Single PrismaClient shared across all 8 backend files (was 9 instances) |

**v-html policy:** Only allowed for trusted i18n content (PageView, ClubView, Getstarted). Forbidden for user/error data.

---

## Branch (Git)

Development branch: `claude/add-pixel-icons-Hk6tn` (design system + UI redesign)
Previous branch: `claude/hexlash-full-audit-WvXMd` (security audit, completed)

### Redesign Progress

| Phase | Status | What |
|-------|--------|------|
| 1.1 | ✅ Done | CSS variables (`hexlash-ui.css`) |
| 1.2a | ✅ Done | 15 pixel icons (archetypes, branches, nav, ui) + `PixelIcon.vue` |
| 1.2b | ✅ Done | 30 pixel icons (combat, dice, modes, social, progression, ui) |
| 1.3a | ✅ Done | `HexButton.vue` + `HexCard.vue` |
| 1.3b | ✅ Done | `HexProgress.vue` + `HexBadge.vue` |
| 2.1 | ✅ Done | BottomMenu → PixelIcon with glow active state |
| 2.2 | ✅ Done | Header/Logo → `--hex-*` CSS variables |
| 3.1a | ✅ Done | Arena: PreparationView (HexButton, PixelIcon), ModeSelector (PixelIcon for pve/pvp/auto), AutoFightStatus (--hex-* vars) |
| 3.2a | ✅ Done | Fight: CardFightView — 117 color replacements, 0 hardcoded colors remain. VBtn→HexButton, SVG→PixelIcon, dice/coach/victory/defeat all on --hex-* vars |
| 3.1b | 🔲 Next | Arena visual polish (module cards, fight style card) |
| 3.2b | 🔲 | Fight visual polish (HP bars → HexProgress, layout improvements) |
