# HEXLASH — Project Memory

Full-stack Web3 fighting game. Vue 3 SPA + Express backend + PostgreSQL. Telegram WebApp compatible.

> **RULE: After every task, update this file.** Changed views/components → update descriptions. New components → add to Component Highlights. New data files → add to Project Structure. Changed architecture → update relevant sections. CLAUDE.md is the source of truth.

---

## Tech Stack

**Frontend:** Vue 3.5 · Vite 7 · Vuex 4 · Vue Router 4 · Vuetify 2 · Three.js · Howler.js · Ethers.js 6 · @wagmi/vue · viem · @tanstack/vue-query · Vue-i18n 11 · Amplitude

**Backend:** Express 4 · Prisma 5 (PostgreSQL) · JWT · WebSocket (ws) · Multer · bcryptjs · express-rate-limit · Anthropic SDK (AI Trainer)

---

## Project Structure

```
/src
  App.vue                  — Root: header (Logo), router-view, BottomMenu (hidden on PvP screens), Info/Error toasts, ChallengeNotification
  main.js                  — Entry: Vue + Vuetify + i18n + Vuex + WagmiPlugin + VueQueryPlugin init
  router/index.js          — Routes + auth guards + fight state restore
  views/                   — 17 page-level components
  components/              — 75+ reusable components
  core/
    state/store.js         — Vuex store
    state/modules/         — 14 Vuex modules
    models/                — 20+ data models (internal, ws, etc.)
    services/              — 8 business logic services
    database/              — 7 LocalStorage/IDB repository files
    api/apiClient.js       — Axios HTTP client
    engine/                — Combat system (combatEngine, aiStrategy, opponentGenerator)
    constants.js           — Game constants
    websocket/             — WebSocket client
    web3/wagmiConfig.js    — Wagmi config (Base chain, connectors: injected, coinbaseWallet, walletConnect)
    mock/mockData.js       — Mock data for development
  data/
    branches.js            — 3 branches: speed, power, technique (numeric data only, names via i18n)
    moves.js               — 18 moves with damage/speed per level (numeric data only, names/desc via i18n)
    requirements.js        — Tap/XP costs for unlock/levelup
    cardPower.js           — Card/module power balance data
    clanLevels.js          — Clan level config (10 levels, XP thresholds, member limits, XP bonuses) + getClanLevelProgress()
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
    routes/                — auth, user, club, task, file, fight, stats, friends, ai, agent
    middleware/            — auth.js (JWT guard), upload.js (Multer)
    websocket/handler.js   — Real-time message routing + challenge system
    websocket/pvpHandler.js — PvP fight message handling
    services/matchmaking.js — PvP matchmaking service
    services/pvpMatchManager.js — PvP match lifecycle management
    services/pvpCombatEngine.js — PvP combat engine
    services/clubLevelService.js — Club level system (calculateLevel, getLevelInfo, addClubXp, getFightXpReward)
    services/researchGateService.js — Research Gate: controls agent move learning based on player progression
    services/agentCombatEngine.js — Agent fight simulation (action-based + archetype modifiers, dice, coach, emergency)
    services/agentFightService.js — Agent fight orchestrator (PvE training, XP distribution, fight logging)
    services/agentScheduler.js — Auto-fight scheduler (30s tick, resting/idle cycle, daily limit 50)
    services/eloService.js — ELO rating calculation (K=32, clamp 100-3000)
    services/rankedMatchmaker.js — Ranked matchmaking (ELO range ±200, rematch cooldown, different owners)
    utils/helpers.js
  prisma/
    schema.prisma          — 18 models: User, Club, Agent, AgentTactics, AgentProgression, AgentFightLog, Fight, Achievement, Task, PunchInfo, FriendRequest, Friendship...
    seed.js
    migrations/            — PostgreSQL migrations

/public
  images/skins/            — 145+ fighter skin images (skin_m_1..117.png, skin_w_1..26.png, vip_k1/k2/t1/t2.png)
  images/tgskins/          — Same skins (symlink/copy), legacy path

/skills/                   — 12 Claude Code skill files
  hexlash-dev/SKILL.md        — Core workflow, project structure, git
  hexlash-vue/SKILL.md        — Vue 3 frontend conventions
  hexlash-combat/SKILL.md     — Combat system (PvE, PvP, Club Mode)
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
| `/r/:username` | Referral redirect → `/auth/signup` | No |
| `/privacy` `/404` `/rules` `/verify-email` | Static | No |
| `/` | RainView (home) | Yes |
| `/help` | PageView | Yes |
| `/arena` | PreparationView | Yes |
| `/arena/club-mode-log` | ClubModeLogView | Yes |
| `/fight` | CardFightView | Yes |
| `/training` | TrainingView | Yes |
| `/training/moves` | MoveTreeView | Yes |
| `/training/deck` | DeckBuilderView | Yes |
| `/profile` `/profile/balance` `/profile/wallet` `/profile/account` `/profile/skins` | ProfileView | Yes |
| `/club/:id` | ClubView | Yes |
| `/club/agent/create` | CreateAgentView | Yes |
| `/club/agent/:agentId` | AgentDetailView | Yes |
| `/ratings/:type` | RatingsView | Yes |
| `/user/:userLogin` | ProfileView | Yes |
| `/friends` | FriendsView | Yes |
| `/matchmaking` | MatchmakingView | Yes |
| `/spectate/:odId` | SpectateView | Yes |

---

## Vuex Modules (14)

| Module | Purpose |
|--------|---------|
| `masterState` | App init, auth status, info/error messages, language |
| `userState` | Current user profile, stats, avatar |
| `cardFightState` | Active fight: rounds, HP, dice, coach, playerModules, localStorage persist |
| `progressionState` | Moves unlocked/levels, taps, XP per branch, server sync (PUT /user/progression) |
| `clubState` | Club info, members, balance, roles (set-role, transfer-ownership, kick) |
| `taskState` | Daily + social tasks |
| `punchState` | Punch/tap rate limiting, cooldown, 2D/3D punch toggle, sound mute toggle |
| `achievementState` | Achievements list + unlocking |
| `contractState` | Web3 wallet, token balance |
| `webSocketState` | WS connection, real-time messages |
| `clubModeState` | Club mode: scheduling, offline simulation, fight log, push notifications, daily auto-reset, server sync (POST /fight/save), AI analysis (series analysis via Claude API) |
| `pvpState` | Real-time PvP matchmaking and fights |
| `friendsState` | Friends list, friend requests, challenges (WebSocket-based) |
| `agentState` | Agent roster: CRUD, auto-fight toggle, club level, 30s auto-refresh |

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
| `PixelIcon` | `PixelIcon.vue` | 16×16 canvas-based pixel icons. **Currently unused** — preserved but not referenced by any app file. Props: name, size, color, glow, glowColor, glowSize, disabled. |
| `HexButton` | `HexButton.vue` | 5 variants: primary, secondary, ghost, danger, archetype. 3 sizes (sm/md/lg). Props: icon (PixelIcon, **unused by app**), loading (CSS spinner), block, disabled, archetypeColor. |
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

All components use `--hex-*` variables exclusively. Legacy `--pink`, `--dark`, `--gray*` in `colors.css` only referenced by PrivacyView (auto-generated legal HTML).

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

> **Active system:** `/src/styles/hexlash-ui.css` with `--hex-*` variables. ALL components use exclusively `--hex-*` vars (Phase 5.1 complete).
> **Legacy:** `/src/assets/colors.css` — only referenced by PrivacyView.vue (auto-generated legal HTML with inline styles). Do NOT use legacy vars in new code.

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

CLUB_MODE_MIN_INTERVAL = 600000    // 10 min
CLUB_MODE_MAX_INTERVAL = 600000    // 10 min
CLUB_MODE_MAX_PER_DAY = 144
CLUB_MODE_MAX_PER_SESSION = 288

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

// Referral
REFERRAL_REWARD_TAPS = 500    // taps awarded to both referrer and referred

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

// Clan Level System
CLAN_LEVEL_CONFIG = { 1..10: { xpRequired, maxMembers, xpBonus } }
CLAN_XP_REWARDS = { win: 10, draw: 5, lose: 3 }
CLAN_TAP_SHARE = 0.05              // 5% of member taps → clan treasury

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

**Club Mode:** Toggle on Arena screen → fights every 10 min offline → uses CombatEngine + ModuleAIStrategy → localStorage persist (`hexlash_clubmode_state`, `hexlash_clubmode_history`) → push notifications via Notification API → limits: 144/day, 288/session → auto-catches up missed fights on tab focus → daily auto-reset: on new day clears fight log, wins/losses/draws/XP counters (no manual clear button) → **offline club mode fights sync results to server** via `POST /fight/save` (increments pveWins/pveLosses/pveDraws/pveTotalFights). Dice uses cooldown (every 3 rounds, multiple per fight). XP: win=10, draw=7, lose=5.

**Sound:** Howler.js for punch sounds (BottomMenu, TrainingView) and rain ambience (RainView). Mute toggle in Profile > Account (`SoundToggle.vue`), persisted in localStorage (`isMuted`), checked via `store.getters['punch/isMuted']`

**PvP:** Real-time matchmaking via WebSocket → friend challenges (WebSocket-based, 10s timer) → spectate mode → backend matchmaking service. BottomMenu hidden on all PvP screens (matchmaking, fight, spectate). Opponent Found screen shows actual fighter skins (from `/images/skins/`).

**Friend Challenge Flow:** Player A clicks ⚔️ → `challenge_send` via WS → server checks online → `challenge_received` → Player B sees ChallengeNotification (top-of-screen, 10s auto-decline) → accept → server creates match via pvpMatchManager → `challenge_start` → both navigate to `/fight?mode=pvp&matchId=...`

**Dice (unified PvE/PvP):** Available after round 1, cooldown 3 rounds. Random effect: Heal +15HP, Adrenaline x2 ATK (1 round), Shield full block (1 round), Blind guaranteed miss (1 round), Rage -20HP instant, Crit -30HP instant. Rage/Crit can kill. Disabled in Overdrive.
- **PvE:** Player clicks dice button on screen.
- **PvP:** Server-controlled. `dice_available` → player clicks → `dice_roll` via WS → `dice_rolled` response. Rage/Crit send `oppHp` + `killed` flag. If killed → `fight_end` immediately.

**PvE Coach Advice:** Triggers once per fight from round 6 (COACH_MIN_ROUND). Fight pauses, 15s timer. 3 options: Attack (+25 priority), Defense (+25 priority), Position (+25 priority). Boost lasts 4 rounds via aiStrategy.setCoachBoost(). Coach active bar shows remaining rounds.

**PvP Coach Advice:** Same UI as PvE (3 options: Attack/Defense/Position) but 10s timer. Fight pauses for both players. Each player picks independently. Backend applies effects: `coach_attack` (+25% dmg), `coach_defense` (-30% incoming), `coach_position` (+15% dmg & -15% incoming) for 4 rounds. After choosing → "Waiting for opponent..." until both decide or timer expires. No boost if player doesn't choose.

**AI Trainer:** Claude-powered post-fight analysis (PvE and PvP). Component `AiTrainerAnalysis.vue` renders on CardFightView results screen. Sends fight data (rounds, decks, result, dice/coach/emergency usage) to `POST /v1/ai/analyze-fight` → backend calls Anthropic Claude API → returns 4-section analysis: Fight Summary, What You Did Well, What Went Wrong, Advice. Feature flag: `AI_TRAINER_ENABLED`. Graceful degradation on error. i18n keys: `fight.lblAiTrainer`, `fight.lblAiLoading`, `fight.lblAiError`.

**AI Club Mode Analysis:** Claude-powered analysis of club mode fight series. Component `ClubModeAnalysis.vue` renders on ClubModeLogView screen. Player selects period (Last 5 / Last 10 / All) and clicks "Analyze" → sends fight series data to `POST /v1/ai/club-mode-summary` → returns 4-section analysis: Session Overview, Strengths, Weaknesses, Recommendation. Model: `claude-haiku-4-5-20251001`, max_tokens: 400, rate limit: 5/min. Vuex state in `clubModeState` (aiAnalysis, aiAnalysisLoading, aiAnalysisError, aiAnalysisPeriod). Club mode log entries now include: playerModules, opponentModules, diceUsed, diceEffect, coachUsed, coachChoice, emergencyUsed.

**Club Stats:** When a fight result is saved (PvE via `POST /fight/save`, PvP via `pvpCombatEngine.saveFightResult`), if the player has a `clubId`, `Club.battles` is incremented by 1; if the player won, `Club.wins` is also incremented. Club Mode fights go through `/fight/save` so they increment too.

**Data Persistence:** Progression (moves, XP, taps, deck, playerModules) syncs to server via `PUT /v1/user/progression` (debounced 3s). Server is source of truth — restores all data on login via `GET /v1/user/me`. PlayerModules (fighter archetypes) included in progression JSON. Club mode state/history is localStorage-only (not critical — fight results already synced via `POST /fight/save`). PvP fight state is cleared from localStorage on `fight_end` via `clearSavedFight` action to prevent stale restore on next visit.

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
- `agentCombatEngine.js` — Agent fight simulation: hybrid PvE (action-based) + PvP (archetype modifiers). Tactics drive decisions. Includes PvE bot generator
- `backend/src/data/archetypes.js` — Backend copy of archetype priorities + dicePreferences (keep in sync with frontend)
- `pvpMatchManager.js` — PvP match lifecycle
- `pvpHandler.js` — PvP WebSocket message handling (dice_roll, coach_choice)
- `AiTrainerAnalysis.vue` — AI Trainer post-fight analysis component
- `ClubModeAnalysis.vue` — AI club mode fight series analysis component
- `backend/src/routes/ai.js` — AI Trainer + Club Mode Summary API endpoints

---

## Key Views

| View | File | Notes |
|------|------|-------|
| Training | `TrainingView.vue` | 3D punch bag, taps, daily/social tasks, progression bar |
| Move Tree | `MoveTreeView.vue` | Branch sidebar (Speed/Power/Tech) + move cards. Sidebar buttons centered with `position:absolute; top:35%; transform:translateY(-50%)` |
| Fight | `CardFightView.vue` | Main combat (PvE + PvP), dice, coach advice, HP bars, AI Trainer (PvE results). PvP mode: no BottomMenu, no PvP badge, reduced padding. Fully migrated to --hex-* vars: HexButton for results, inline SVGs, dice/coach/victory/defeat/overdrive all use design system vars |
| Profile | `ProfileView.vue` | Tabs: balance, wallet, account, skins |
| Ratings (League) | `RatingsView.vue` | 3 tabs: My Club, Clubs (leaderboard), Fighters (leaderboard). Default tab: My Club. URL: `/ratings/:type` (myclub/clubs/fighters). My Club tab: `MyClubTab.vue` component — redesigned clan header (avatar 64px with --hex-primary glow, name in Anonymous font, italic description, LVL badge, member count, level progress bar), stats grid (4 cards: Members/Wins/Losses/Win Rate with colored values), win rate bar, members top-5, role badges owner/deputy, action menus. No-clan state: ⚔ icon hero, CREATE/BROWSE buttons, pending invites banners, suggested clans with stats |
| Preparation | `PreparationView.vue` | Arena: action row (Mode + START FIGHT + Friends buttons), club mode toggle/status. Friends button is text-only (no online indicator) |
| Friends | `FriendsView.vue` | Friends list, friend requests, search players |
| Matchmaking | `MatchmakingView.vue` | Real-time PvP matchmaking queue. Opponent Found shows fighter skins (not icons). No colored borders. 100dvh support. |
| Clan | `ClubView.vue` | Redesigned clan page: header with avatar (64px, --hex-primary border + glow, 12px radius), name (Anonymous font), italic description, meta row (LVL badge, member count), level progress bar (6px gradient fill), stats grid via `ClubStats.vue` (4 cards + win rate bar), owner controls. Visitor view: top-5 members (no action menu), "+ N more members", JOIN/private/full action bar |
| Spectate | `SpectateView.vue` | Watch live PvP fights |
| Create Agent | `CreateAgentView.vue` | 3-step wizard: name+skin → archetype build → confirm+create |
| Agent Detail | `AgentDetailView.vue` | 4-tab agent management: Overview (stats, deck, XP, train), Moves (Research Gate tree), Tactics (fight mode, aggression, dice, coach, emergency, rest), Fights (history with filter+pagination). Edit modal (name/skin/build), deck editor, delete |

---

## i18n System

**Custom reactive i18n** (not vue-i18n): `locales/index.js` exports `t` (computed ref), `setLanguage()`, `interpolate()`

**11 locales:** en, ru, de, es, fr, pt, ar, hi, ja, ko, zh

**Key sections per locale:**
- UI labels: `menu`, `auth`, `profile`, `arena`, `fight`, `training`, `moves`, `deck`, `cards`, `rating`, `club`, `info`, `nav`, `clubMode`, `friends`, `pvp`, `spectate`, `xpAllocation`, `referral`
- Game data translations: `gameData.branches[id].{name,description}`, `gameData.moves[id].{name,description}`
- Page content: `locales/pages/help/{lang}.json`, `locales/pages/rules/{lang}.json`

**Usage in templates:** `{{ t.section.key }}` (auto-unwrapped ref)
**Usage in script:** `t.value.section.key`
**Interpolation:** `interpolate(t.value.moves.lblUnlockFirst, { name: '...' })`

---

## Component Highlights

**Design System (`/src/components/ui/`):**
- `PixelIcon.vue` — Canvas-based 16×16 pixel icon renderer. **Currently unused** — preserved but no app file imports it. Data in `pixelIcons.js` (45 icons).
- `HexButton.vue` — Button with 5 variants (primary/secondary/ghost/danger/archetype), 3 sizes (sm/md/lg). Supports: loading spinner, block width, archetypeColor via `--_arch-color` CSS custom property. Icon prop exists but unused by app.
- `HexCard.vue` — Card with 5 variants (default/elevated/archetype/active/result). Archetype = left border accent, active = tinted bg + color border, result = top border (victory/defeat/draw). Slots: default, header, footer. Padding: none/sm/md/lg.
- `HexProgress.vue` — Progress bar with 3 variants: hp (auto green>60%/yellow>30%/red), branch (speed/power/technique colors), generic. Props: label, showValue, showPercent. 3 sizes.
- `HexBadge.vue` — Pill badge with 5 variants: archetype, branch, status (victory/defeat/draw/info), counter (auto circle<10/pill≥10), custom. Props: icon (PixelIcon), pulse animation.

**Navigation & Layout:**
- `Logo.vue` — header logo (Anonymous font, --hex-primary color + glow)
- `BottomMenu.vue` — bottom nav (Arena, Training, Ratings, Profile). Uses SVG background-image icons with filter-based active state. Solid bg `--hex-bg-medium`, no gradient. Hidden on PvP screens via `isPvPScreen` computed in App.vue
- `App.vue` header — gradient uses `--hex-bg-dark`, balance in AnonymousBalance font with `--hex-text-primary`

**Game Components:**
- `Info.vue` / `Error.vue` — toast notifications (text interpolation `{{ }}`, NOT v-html — XSS safe)
- `NewAchievement.vue` — achievement popup
- `Punch3D.vue` — Three.js punching bag
- `MoveTreeCard.vue` — move row in tree
- `MoveDetailsModal.vue` — move detail/unlock popup
- `ClubModeToggle.vue` — club mode on/off button
- `ClubModeStatus.vue` — club mode live status + countdown
- `SoundToggle.vue` — sound mute/unmute toggle (Profile > Account)
- `HPBar.vue` — fight health bar
- `Fighter.vue` — fighter display in combat
- `ModeSelector.vue` — arena mode selector (PvE/PvP/Club), compact button with dropdown, system sans-serif font
- `FriendCard.vue` — friend display card
- `FriendRequestCard.vue` — incoming friend request
- `ChallengeModal.vue` — PvP challenge popup (legacy, kept as fallback)
- `ChallengeNotification.vue` — Top-of-screen challenge notification (global, z-index: 9999, 10s timer)
- `ClubInviteNotification.vue` — Top-of-screen club invitation notification (global, z-index: 9998, 30s timer, accept/decline via WS)
- `PlayerSearchResult.vue` — player search result item
- `XPAllocationModal.vue` — XP allocation modal
- `PvPStatsCard.vue` — PvP statistics display (league, rating, progress, wins/losses/winrate). Shown in Fighters tab of RatingsView
- `AiTrainerAnalysis.vue` — Claude-powered post-fight analysis (PvE + PvP, results screen)
- `ClubModeAnalysis.vue` — Claude-powered club mode fight series analysis (ClubModeLogView)
- `ProfileWallet.vue` — Wallet page: uses @wagmi/vue useAccount(), shows ConnectWallet + GameBalanceCard + HexCard placeholder. BuyTokens/WalletInfo removed from render
- `ConnectWallet.vue` — Full wallet modal: Teleport modal with connector list (icons, dedup, rename Injected→Browser Wallet), connecting spinner, connected state (short address + chain + disconnect). Uses @wagmi/vue useConnect/useDisconnect/useConnectors. z-index 9000, Escape/overlay close, hex-fade/hex-slide-up transitions. 360px responsive
- `WalletInfo.vue` — **Unused** — functionality moved into ConnectWallet connected state. File preserved
- `BuyTokens.vue` — Token purchase modal. **Temporarily disabled** — not rendered in ProfileWallet, file preserved for Phase 2 (Base contract)
- `GameBalanceCard.vue` — Game balance display with withdraw button (shows "after listing" message)
- `ReferralModal.vue` — Referral program modal: QR code (qrcode lib), copy link (clipboard API), share (Web Share API with fallback), referral stats + list. Opens from ProfileView button
- `ClanPageContent.vue` — Shared clan page content component (header, stats, tabs Members/Activity/Settings, leaderboard with action menu, confirm modals, invite modal). Used by ClubView (member view) and MyClubTab (has-clan state). Props: clubData, clubId. Events: club-left, club-deleted
- `ClanActivityFeed.vue` — Activity feed for clan page. Real data from `GET /v1/club/:clubId/events`. Events grouped by day, color-coded dots (fight_win/lose/draw, member_join/leave/kick, role_change, level_up). Props: clubId. Cursor pagination via "Load more" button. Vuex state in clubState (clanEvents, clanEventsLoading, clanEventsHasMore)

---

## API (backend)

Base: `/v1/`

| Route | File | Purpose |
|-------|------|---------|
| `/auth` | auth.js | login, signup, reset, telegram. Rate limited: login 5/15min, register 3/hr, telegram 10/15min. Register + telegram accept `referralCode` — rewards both users +500 taps |
| `/user` | user.js | profile, stats, avatar, achievements, referrals. Skin validated via regex. Delete uses $transaction with cascade. GET /referrals returns referral stats + list |
| `/club` | club.js | create/edit/delete club, avatar, members, balance, roles (set-role, transfer-ownership, kick, invite), level info. maxMembers=50, roles: owner/deputy/member. DELETE / dissolves club (owner-only, clears all members + invites). Invite: DB-persisted (48h), GET /invites, POST /invite/respond. Events: GET /:clubId/events (members only, cursor pagination) |
| `/task` | task.js | daily + social tasks |
| `/file` | file.js | avatar/file upload |
| `/fight` | fight.js | fight creation, results, history |
| `/stats` | stats.js | player and game statistics |
| `/friends` | friends.js | friends list, requests, search players |
| `/ai` | ai.js | AI Trainer fight analysis (POST /analyze-fight), Club mode summary (POST /club-mode-summary) |
| `/agent` | agent.js | CRUD agents (list, get, create, update, delete), tactics update, fight history, Research Gate (available-moves, learn-move, deck), PvE training (train) |

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
| — | `match_cancelled` | Match cancelled (reason: ready_timeout) — handled by MatchmakingView + CardFightView |
| — | `overdrive_start` | Overdrive phase started (rounds > MAX_ROUNDS) |
| — | `AchievementResponseMsg` | Auto-awarded achievement (punch milestones: 100, 1k, 5k, 10k) |
| — | `club_invite` | Club invitation notification (inviterName, clubName) |
| `club_invite_accept` | `club_invite_accepted` | Accept club invitation → joins club |
| `club_invite_decline` | `club_invite_declined` | Decline club invitation |
| — | `ErrorMsg` | Error response |

---

## Database Models (Prisma/PostgreSQL)

User, Club, ClubInvite, ClanEvent, Achievement, UserAchievement, SocialTask, UserSocialTask, DailyTask, UserDailyTask, Fight, PunchInfo, FriendRequest, Friendship, Agent, AgentTactics, AgentProgression, AgentFightLog

**Club system fields:** User.clubRole (`owner`/`deputy`/`member`/null), Club.maxMembers (default 20, grows with level), Club.maxAgents (default 2, grows with level: 1→2, 2→3, 3→4, 4→5, 5+→6), Club.legendSkin/legendArchetype/legendBuff (retired fighter legend system), Club.battles/wins (auto-incremented on fight save). Max 3 deputies per club. Owner can set roles, transfer ownership, kick anyone, invite friends, dissolve club. Deputies can kick members only, invite friends. Club creation costs `COST_CREATE_CLUB` (10000) taps — deducted from `User.totalTaps` in $transaction. Club name: 3-30 chars, unicode letters/digits/spaces (`\p{L}\p{N}`), no emoji. Achievements: `PAPER_STREET` on create, `PROJECT_MAYHEM` on join (idempotent via `awardAchievement()` in helpers.js).

**Club invite system:** `ClubInvite` model — `id`, `clubId` → Club, `inviterId` → User, `inviteeId` → User, `status` (pending/accepted/declined/expired), `createdAt`, `expiresAt` (48h). Persisted in DB + real-time WS notification. Endpoints: `POST /club/invite` (creates DB record + WS), `GET /club/invites` (pending for current user), `POST /club/invite/respond` (accept/decline by inviteId). Auto-expire on query (no cron). Frontend: `ClubInviteNotification.vue` loads pending invites on mount, shows queue one by one.

**Clan event system:** `ClanEvent` model — `id` (uuid), `clubId` → Club (cascade delete), `type` (String), `actorId` (String?), `targetId` (String?), `data` (Json?), `createdAt`. Index on `[clubId, createdAt]`. Types: `fight_win`, `fight_lose`, `fight_draw`, `member_join`, `member_leave`, `member_kick`, `role_change`, `level_up`. Helper: `createClanEvent()` in `backend/src/utils/clanEvents.js` — silent try/catch, fire-and-forget. Events recorded in: fight.js (PvE), pvpCombatEngine.js (PvP both players), club.js (join/leave/kick/set-role, invite accept), clanLevel.js (level_up). API: `GET /v1/club/:clubId/events?limit=30&before=timestamp` — members only, cursor pagination, includes actor/target `{id, login, skin}`.

**Referral system fields:** User.referredBy (String?, login of referrer), User.invitedUsers (Int, referral count). On register/telegram with referralCode: both users get +500 taps (REFERRAL_REWARD_TAPS), invitedUsers incremented. Self-referral and non-existent referrer silently ignored.

**Club Mode Agent system:** 4 new models for autonomous clan fighters.
- `Agent` — clan fighter unit. Fields: name (2-20 chars), skin, 3 modules (primaryModule/secondaryModule/tertiaryModule — one of 6 archetypes each), elo (default 1000), wins/losses/draws/totalFights, xp, level, status (idle|fighting|resting), lastFightAt/nextFightAt. Relations: Club (cascade), User owner (cascade). Indexes: clubId, ownerId, elo, status.
- `AgentTactics` — 1:1 with Agent. Behavior settings: aggression (cautious|balanced|aggressive), dicePolicy (always|smart|never), coachPreference (attack|defense|position|auto), emergencyThreshold (30|20|0), restPeriod (ms: 600000|1800000|3600000). Cascade delete.
- `AgentProgression` — 1:1 with Agent. XP per branch (speedXp/powerXp/techniqueXp), moves (JSON [{moveId, level}]), deck (JSON [moveId...] 4-8 items). Cascade delete.
- `AgentFightLog` — N:1 with Agent. Fight history: mode (pve_training|ranked|free_arena), result (victory|defeat|draw), opponent info, rounds/HP/xpEarned/eloChange, fightData (full JSON for AI analysis). Indexes: agentId, createdAt, mode. Cascade delete.
- Validation (app-level, not Prisma): name 2-20 chars no special chars, skin regex, modules from 6 archetypes, agents count ≤ club.maxAgents, deck 4-8 moveId.
- Migration: `20260402000000_add_club_mode_agents`

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

Development branch: `claude/add-club-mode-agents-lmXTI`
Previous branches: `claude/rename-autofight-club-mode-o2bIJ`, `claude/update-claude-md-XVzH6`, `claude/add-pixel-icons-Hk6tn` (design system + UI redesign, completed & merged), `claude/hexlash-full-audit-WvXMd` (security audit, completed & merged)

### PvP System Audit — P0+P1 Fixes — ✅ COMPLETE

Full audit of PvP chain (matchmaking → ready → rounds → dice/coach → fight end). Found and fixed critical issues:

**P0 — Critical (PvP was non-functional):**
- **P0-1:** Added `coach_opponent_ready` event handler in CardFightView — was completely missing, coach UI hung forever when opponent chose first
- **P0-2:** Added `match_cancelled` event handler in MatchmakingView + CardFightView — server sent it on ready_timeout but neither view handled it, players saw frozen screen
- **P0-3:** Fixed WS reconnect killing PvP fights — old socket's `close` event triggered `handlePvPDisconnect` ending the match. Now: mark replaced sockets with `_replaced` flag, skip disconnect handler; re-bind new socket to active match engine on reconnect
- **P0-4:** Verified coach round counting — was actually correct (round incremented in `nextRound()` before `pauseForCoach()` call), added clarifying comment

**P1 — Serious bugs:**
- **P1-5:** Fixed dice `endFight` race condition — dice rage/crit could end fight while `setTimeout(nextRound)` was pending, causing double `endFight()`. Now: save `roundTimer` ref, `clearTimeout` in `endFight()` and `onPlayerDisconnect()`
- **P1-6:** Fixed matchmaking race condition — periodic 3s interval could match same player twice. Now: snapshot queue keys before iteration, track `matchedThisTick` Set
- **P1-7:** Added deck validation in `pvp_ready` handler — validates array, length (MIN_PVP_DECK_SIZE..MAX_DECK_SIZE), each entry has id + level (1-5). Recalculates archetype modifiers after binding modules
- **P1-8:** Added coach_choice validation — action must be `attack|defense|position` or null

**Files changed:**
- `src/views/CardFightView.vue` — P0-1, P0-2 (event handlers)
- `src/views/MatchmakingView.vue` — P0-2 (event handler)
- `backend/src/websocket/handler.js` — P0-3 (reconnect), P1-6 (matchmaking race)
- `backend/src/websocket/pvpHandler.js` — P1-7 (deck validation), P1-8 (coach validation)
- `backend/src/services/pvpCombatEngine.js` — P1-5 (roundTimer), exported `calculateArchetypeModifiers`

**P1-hotfix:** Fixed deck validation rejecting new players — default deck has 3 moves but validation required MIN_DECK_SIZE (4). Added `MIN_PVP_DECK_SIZE = 3` in config.

**P2 — Stability improvements (✅ COMPLETE):**
- **P2-1:** ELO update wrapped in `prisma.$transaction([])` — both players' ratings update atomically
- **P2-2:** WS reconnect with exponential backoff — 10s → 20s → 40s → ... → max 300s, ±20% jitter, reset on success
- **P2-3:** Frontend `fight_start` timeout — 30s after `pvp_ready`, if no response → toast + navigate to `/arena`
- **P2-4:** `dice_error` UX — show event title instead of permanent disable, re-enable dice after 2s debounce
- **P2-5:** `MIN_PVP_DECK_SIZE = 3` in config, used in pvpHandler validation (separate from PvE `MIN_DECK_SIZE = 4`)
- **P2-6:** Defensive validation: `dice_roll` checks match exists + status `running`; `coach_choice` checks status `paused_coach`

**P3 — Final improvements (✅ COMPLETE):**
- **P3-1:** Rate limit `dice_roll` — max 1 per 2s per player via `lastDiceRoll` Map in pvpHandler
- **P3-2:** Rate limit `coach_choice` — max 1 per pause session via `coachChoiceSent` Map, cleaned up on disconnect
- **P3-3:** `overdrive_start` UI — shows "OVERDRIVE" event title with `--hex-primary` glow + 2s display, CSS class `event-overdrive`
- **P3-4:** PvP refresh recovery — if page refreshed during PvP fight (no opponent context in store), shows toast + redirects to `/arena` instead of hanging

**P4 — Skin bug fix (✅ COMPLETE):**
- **P4-1:** Opponent skin not displaying in PvP — `fight_start` message didn't include `skin`/`avatarUrl`, and `onPvPFightStart` overwrote correct data from MatchFoundMsg with incomplete data
- **Fix (matchmaking flow):** `matchmaking.createMatch()` passes skin/avatarUrl → `pvpCombatEngine` constructor stores them → `fight_start` emission includes skin/avatarUrl for both players
- **Fix (challenge flow):** `challenge_send` now includes `challengerSkin`/`challengerAvatarUrl` → `challenge_received` passes skin to target → `challenge_accepted` echoes back → `handleChallengeAccepted` stores skin in match + sends in `challenge_start`
- **Fix (frontend):** `onPvPFightStart` uses skin from `fight_start` data, falls back to existing store opponent data

**Files changed:**
- `backend/src/services/pvpCombatEngine.js` — skin/avatarUrl in constructor + fight_start emission
- `backend/src/services/matchmaking.js` — passes skin/avatarUrl to pvpMatchManager.createMatch
- `backend/src/websocket/handler.js` — challenge flow: skin in challenge_received, challenge_start, createMatch
- `src/views/CardFightView.vue` — onPvPFightStart preserves existing skin as fallback
- `src/core/state/modules/friendsState.js` — sends skin in challenge_send
- `src/components/pvp/ChallengeNotification.vue` — passes skin in challenge_accepted

### Club System — Этап 1: Backend фиксы (✅ COMPLETE)

- **1. Списание тапов при создании клана:** `POST /club/add` проверяет `totalTaps >= COST_CREATE_CLUB (10000)`, списывает в $transaction. Frontend: стоимость в CreateClub.vue, disabled кнопка если не хватает.
- **2. Achievements за клуб:** `awardAchievement()` helper (idempotent). `PAPER_STREET` при создании, `PROJECT_MAYHEM` при вступлении (change + invite/respond).
- **3. Pending invites в БД:** `ClubInvite` модель (Prisma), 3 новых endpoint: `GET /club/invites`, `POST /club/invite/respond`, обновлён `POST /club/invite`. 48h expiry, auto-expire on query. Frontend: ClubInviteNotification загружает pending на mount, очередь показа.
- **4. Unicode в названии клана:** regex `\p{L}\p{N}` вместо `a-zA-Z0-9`, min 3 / max 30, sanitize множественных пробелов. i18n обновлён (en + ru).

**Files changed:**
- `backend/src/routes/club.js` — taps deduction, achievements, invite persistence, new endpoints, unicode regex
- `backend/src/utils/helpers.js` — `awardAchievement()` utility
- `backend/prisma/schema.prisma` — `ClubInvite` model + relations
- `src/components/fragments/club/CreateClub.vue` — cost display, canAfford, unicode validation
- `src/components/fragments/club/ClubEdit.vue` — unicode validation
- `src/components/club/ClubInviteNotification.vue` — REST API accept/decline, pending invites on mount
- `src/core/services/clubService.js` — `getPendingInvites()`, `respondToInvite()`
- `src/locales/en.js`, `src/locales/ru.js` — updated validation messages

### AutoFight → Club Mode Rename + Club System Audit — ✅ COMPLETE

- **ТЗ 1-5:** Renamed AutoFight → Club Mode across entire codebase (constants, Vuex, components, views, router, i18n ×11, backend API, CLAUDE.md)
- **Club 1/3:** Fixed 3 critical bugs (imageUrl phantom field, setError mutation mismatch, shared pagination counter) + 2 bonus fixes (case-insensitive search, 404 UI)
- **Club 2/3:** Added DELETE /v1/club endpoint (dissolve club), club stats auto-increment (already working), removed unused `User.daysInClub` field + Prisma migration
- **Club 3/3:** E2E code review, fixed stale state on club delete, CLAUDE.md update

### Referral System — ✅ COMPLETE

- **Referral 1/3:** Backend — User.referredBy field, processReferral() in auth.js (register + telegram), GET /user/referrals, REFERRAL_REWARD_TAPS=500, formatUserResponse updated
- **Referral 2/3:** Frontend — /r/:username route, referralCode in localStorage → register/telegram, ReferralModal.vue (QR, copy, share, stats), ProfileView button, i18n ×11
- **Referral 3/3:** E2E code review (all 9 steps verified), CLAUDE.md update

### "Neon Discipline" Redesign — ✅ COMPLETE

All phases finished and merged to main. Summary of work done:
- **Phase 1:** CSS variables foundation (`hexlash-ui.css`), 45 pixel icons, 4 UI components (HexButton, HexCard, HexProgress, HexBadge)
- **Phase 2:** Navigation migration (BottomMenu, Header/Logo → `--hex-*` vars)
- **Phase 3:** Core screens migration (Arena, Fight, Training, MoveTree, Profile, DeckBuilder) — 260+ color replacements
- **Phase 4:** Secondary screens — 280 color replacements across 11 files
- **Phase P0:** PixelIcon revert — restored original SVG/img icons, PixelIcon preserved but unused
- **Phase 5.1:** Final sweep — 330 legacy var replacements across 53 files, 0 legacy vars remain
- **Phase 5.2:** Animation utilities (10 classes: transitions, hover, press, pulse, glow-pulse, float-up, Vue fade/slide-up)
- **Phase 5.3:** Responsive fixes — 320px min-width, @media 360px breakpoints

### Club → Clan UI Rename — ✅ COMPLETE

Renamed all user-visible "Club" strings to "Clan" across the entire UI. Backend unchanged (API routes, Prisma models, DB fields, Vuex module names, file names, JS variables all remain "club").

**i18n replacements (11 locales):**
| Locale | File | Replacement | Approx. count |
|--------|------|-------------|---------------|
| en | en.js | Club → Clan | ~40 |
| ru | ru.js | клуб → клан (all grammatical forms) | ~40 |
| de | de.js | Club/Klub → Clan | ~35 |
| es | es.js | club → clan | ~35 |
| fr | fr.js | club → clan | ~35 |
| pt | pt.js | clube → clã | ~35 |
| ar | ar.js | النادي → العشيرة | ~35 |
| hi | hi.js | क्लब → क्लैन | ~34 |
| ja | ja.js | クラブ → クラン | ~38 |
| ko | ko.js | 클럽 → 클랜 | ~37 |
| zh | zh.js | 俱乐部 → 战队 | ~37 |

**Component fixes:**
- `ClubView.vue` — fallback strings "Club not found" → "Clan not found" (×2)
- `ClubAvatar.vue` — alt text "Club Avatar" → "Clan Avatar"
- `ClubOwnerAvatar.vue` — alt text "Club Avatar" → "Clan Avatar"

**Not changed (by design):** i18n keys (`lblClub`, `clubMode`, etc.), Vuex module names (`clubState`, `clubModeState`), file names, API routes, Prisma schema, DB fields

### Clan Page Redesign — ТЗ A: Header + Stats — ✅ COMPLETE

Redesigned ClubView.vue and MyClubTab.vue upper sections. "Neon Discipline" style.

**Clan Header (both views):**
- Avatar: 64px, border-radius 12px, 2px `--hex-primary` border, `box-shadow` glow
- Name: Anonymous font, `--hex-text-primary`
- Description: italic, `--hex-text-muted`, 2-line clamp
- Meta row: LVL badge (`--hex-primary` bg, AnonymousBalance font), member count "N / 50 Members"
- Background: gradient `--hex-bg-medium` → `--hex-bg-dark` with subtle radial `--hex-primary` glow

**Level Progress Bar:**
- "LEVEL 1 → 2" left (Anonymous, `--hex-primary`), "0 / 1,000 XP" right (AnonymousBalance, `--hex-text-muted`)
- 6px bar, gradient fill `--hex-primary` → `#FF3399`, glow
- Static mock data: Level 1, 0/1000 XP (real system in separate ТЗ)

**Stats Grid (ClubStats.vue rewritten):**
- 4 cards: Members, Wins, Losses, Win Rate
- `--hex-bg-card` bg, `--hex-border-default`, AnonymousBalance font
- Colors: wins=`--hex-victory`, losses=`--hex-defeat`, win rate=`--hex-draw`
- Labels: 9px uppercase, `--hex-text-muted`
- Win Rate = `Math.round(wins / battles * 100)` or 0

**Win Rate Bar:**
- 4px under stats grid
- Green wins% + red losses%, opacity 0.5, border-radius 2px

**Removed from ClubView header:** old plain-text stats layout, old btnToMembers button with icon

**Files changed:**
- `src/views/ClubView.vue` — complete header redesign
- `src/components/fragments/club/MyClubTab.vue` — matching header + ClubStats integration
- `src/components/fragments/club/ClubStats.vue` — rewritten: 4-card grid + win rate bar

### Clan Page Redesign — ТЗ B: Tabs + Members + Activity — ✅ COMPLETE

Added tab navigation, members leaderboard, and activity feed to ClubView.vue.

**Tab Navigation:**
- 3 tabs: Members | Activity | Settings
- `--hex-bg-medium` background, Anonymous font 11px uppercase, letter-spacing 1px
- Active: `--hex-primary` color + border-bottom 2px
- Activity tab: badge with event count (`--hex-primary` bg, 9px)
- Sticky top on scroll, z-index 50
- Tabs shown only for clan members (`isMyClub`); visitors see members list directly

**Members Tab (default):**
- "CLAN LEADERBOARD" section label (10px uppercase, `--hex-text-muted`)
- Member rows: rank (Anonymous font, top-1,2 = `--hex-draw`) | avatar (38px, border-radius 8px) | name + role badge + online dot | wins + fights | ⋯ menu
- Role badges: OWNER = `--hex-primary` bg, DEPUTY = `--hex-draw` with opacity
- Online dot: 6px green with glow
- Stats: wins in `--hex-victory`, total fights in `--hex-text-muted`
- Sorted by wins DESC, loads up to 50 members
- Invite Friend button for owner/deputy

**Action Menu (⋯):**
- Teleported to body, positioned absolutely near trigger button
- `--hex-bg-card` bg, `--hex-border-active` border, border-radius 8px, backdrop-filter blur
- Owner on deputy: Transfer Ownership, Demote to Member, Kick (red)
- Owner on member: Promote to Deputy, Kick (red)
- Deputy on member: Kick only (red)
- Click outside or Escape closes menu
- Kick + Transfer use `confirm()` dialog (full modal in ТЗ C)

**Activity Feed (`ClanActivityFeed.vue`):**
- Events grouped by day ("Today", "Yesterday", date)
- Each event: colored dot (8px) | text with bold names | time
- Event types: fight_win (green glow), fight_lose (red), member_join (pink glow), member_leave (gray), member_kick (red), role_change (blue), achievement (gold glow)
- Mock data: generates events from members list (join dates, win/loss stats)
- Real Activity Feed API (ClanEvent table) — separate ТЗ

**Settings Tab:** 3 sections (Clan Info, Level Bonuses, Treasury) with settings rows + action buttons (Edit/Disband for owner, Leave for member)

**i18n keys added (all 11 locales):**
- `tabMembers`, `tabActivity`, `tabSettings`, `lblLeaderboard`, `lblFights`
- `lblToday`, `lblYesterday`, `lblWonPvP`, `lblWonPvE`, `lblLostPvP`, `lblLostPvE`
- `lblJoinedClan`, `lblLeftClan`, `lblWasKicked`, `lblPromotedTo`, `lblToDeputy`, `lblReachedMilestone`, `lblNoActivity`
- en + ru translated, other 9 locales use English values

**Files changed:**
- `src/views/ClubView.vue` — tabs, members leaderboard, action menu, activity/settings tabs
- `src/components/fragments/club/ClanActivityFeed.vue` — new component
- `src/locales/*.js` — 18 new i18n keys in all 11 locales

### Clan Page Redesign — ТЗ C1: Settings Tab — ✅ COMPLETE

Replaced Settings tab placeholder with full settings UI.

**Clan Info section:** Name, Description, Type (Public/Private), Created date — settings rows with labels and values.
**Level Bonuses section:** Max members (green + muted hint), XP bonus (+0% mock), Next unlock (--hex-draw color).
**Treasury section:** Balance in AnonymousBalance font (--hex-draw), Income description.
**Actions:** Owner sees Edit Clan + Disband Clan (danger). Member sees Leave Clan (danger). All dangerous actions use ClanConfirmModal (C3).

Removed old placeholder with VBtnDark/VSwitch/ClubWithdraw from settings. Cleaned up dead code (showToolTip, btnIsPublic, club-switcher-public CSS).

**i18n keys added (en + ru, 9 locales via background agent):**
- `lblClanInfo`, `lblLevelBonuses`, `lblTreasury`, `lblIncome`, `lblMaxMembers`, `lblXpBonus`, `lblNextUnlock`, `lblFromLevel`, `lblCreated`, `lblType`, `btnEdit`, `btnDisband`
- Plus C2/C3 keys pre-added: `lblNoClan`, `lblNoClanDesc`, `lblCreateCost`, `lblBrowseClans`, `lblSuggestedClans`, `lblJoinClan`, `lblClanPrivate`, `lblMoreMembers`, confirm modal keys

**Files changed:**
- `src/views/ClubView.vue` — settings tab rewrite, dead code cleanup
- `src/locales/en.js`, `src/locales/ru.js` — new i18n keys

### Clan Page Redesign — ТЗ C2: No Clan State + Visitor View — ✅ COMPLETE

**Part 1: No Clan State (MyClubTab.vue)**

Redesigned the "no clan" state shown in RatingsView > My Club tab when player has no clan:
- Hero section: ⚔ icon (48px, opacity 0.6), "NO CLAN YET" (Anonymous 18px), description (13px `--hex-text-muted`)
- Actions: "CREATE CLAN" btn-primary block + "Cost: 10,000 taps" (11px muted) + "BROWSE CLANS" btn-secondary block (switches to Clubs tab)
- Pending invites: loads from `GET /v1/club/invites` on mount, gradient banners with ✉ icon, clan name in `--hex-primary`, members + expiry, Accept/Decline buttons
- Suggested clans: label "SUGGESTED CLANS" (11px uppercase muted), avatar (40px, first letter), name + LVL badge, "N members · N wins · N% WR", JOIN button

**Part 2: Visitor View (ClubView.vue)**

When visiting `/club/:id` as non-member:
- Header + stats shown as before (ТЗ A)
- No tab navigation (tabs only for members)
- Top-5 members without action menu (⋯)
- "+ N more members" text below list (`--hex-text-muted`, centered)
- Full-width action bar: "JOIN [CLAN NAME]" btn-primary
- Private clan: button disabled, text "This clan is private"
- Full clan (members >= maxMembers): button disabled, text "Clan is full"

**i18n:** Added `lblClanFull` to all 11 locales (en: "Clan is full", ru: "Клан заполнен")

**Files changed:**
- `src/components/fragments/club/MyClubTab.vue` — complete no-clan state redesign, pending invites, enhanced suggested clans
- `src/views/ClubView.vue` — visitor view with top-5 members, more-members text, join/private/full action bar
- `src/locales/*.js` — `lblClanFull` added to all 11 locales

### Clan Page Redesign — ТЗ C3: Confirmation Modals — ✅ COMPLETE

Replaced all `confirm()` calls with `ClanConfirmModal.vue` (created in C1) for dangerous actions in ClubView.vue.

**4 actions migrated:**
1. **Kick member** — danger modal, title from `lblKickTitle`, desc with `<strong>{name}</strong>` from `lblKickDesc`
2. **Leave clan** (settings tab) — danger modal, `lblLeaveTitle` / `lblLeaveDesc`
3. **Disband clan** — danger modal, `lblDisbandTitle` / `lblDisbandDesc`
4. **Transfer ownership** — non-danger (primary) modal, `lblTransferTitle` / `lblTransferDesc` with `<strong>{name}</strong>`

**Implementation:** Reactive `confirmModal` state object (`show`, `title`, `description`, `confirmText`, `danger`, `onConfirm`). Helper functions `openConfirmModal()`, `closeConfirmModal()`, `handleConfirm()`. Single `<ClanConfirmModal>` instance in template with bound props.

**i18n:** All keys already existed from C1 pre-add (`lblKickTitle`, `lblKickDesc`, `lblLeaveTitle`, `lblLeaveDesc`, `lblDisbandTitle`, `lblDisbandDesc`, `lblTransferTitle`, `lblTransferDesc`) in all 11 locales.

**Files changed:**
- `src/views/ClubView.vue` — replaced 4× `confirm()` with ClanConfirmModal, added import + reactive state

### MyClubTab → Full Clan Page + Browse Clans — ✅ COMPLETE

Refactored MyClubTab to show full clan page (not abbreviated) and browse/search clans when no clan.

**Shared component: `ClanPageContent.vue`**
Extracted all shared clan page content (header, stats, tabs, members leaderboard, activity feed, settings, action menu, confirm modals, invite modal) into a reusable component. Used by both ClubView (member view) and MyClubTab (has clan state). Props: `clubData`, `clubId`. Events: `club-left`, `club-deleted`.

**Has clan state (MyClubTab):**
- Renders `<ClanPageContent>` with full tabs/members/activity/settings
- Handles `club-left` / `club-deleted` events to reset and reload

**No clan state (MyClubTab):**
- Pending invites at top (from `GET /v1/club/invites`)
- CREATE CLAN button
- Search input with 300ms debounce
- Clan list: avatar (40px, first letter), name + LVL badge, "N members · N wins · N% WR", JOIN button (public) or "Private" label
- Click row → navigate to `/club/:id`
- Load more pagination (15 per page)

**ClubView refactored:**
- Member view (isMyClub) → `<ClanPageContent>`
- Visitor view unchanged (header, top-5 members, join/private/full bar)
- Removed ~500 lines of duplicated member management code

**Files changed:**
- `src/components/fragments/club/ClanPageContent.vue` — **new** shared component
- `src/views/ClubView.vue` — refactored to use ClanPageContent for member view
- `src/components/fragments/club/MyClubTab.vue` — full rewrite: ClanPageContent for has-clan, browse/search for no-clan

### Clan Level + XP System — Backend (ТЗ D1) — ✅ COMPLETE

Added clan XP + level progression system. Fights award XP to clans, clans level up and unlock higher member limits + XP bonuses.

**Prisma schema:** Added `level` (Int, default 1) and `xp` (Int, default 0) to Club model. Default `maxMembers` changed from 50 to 20 (level 1 default). Migration: `20260330000000_add_clan_level_xp`.

**Config (`config.js`):**
- `CLAN_LEVEL_CONFIG` — 10 levels: xpRequired (0→120,000), maxMembers (20→50), maxAgents (2→6), xpBonus (0→20%)
- `CLAN_XP_REWARDS` — player: win 10, draw 5, lose 3; agent: win 10, draw 5, lose 2; agent_ranked: win 20, draw 10, lose 5

**Helper (`utils/clanLevel.js`):**
- `getClanLevelInfo(level, xp)` — returns level info for display (level, xp, xpRequired, maxMembers, xpBonus, isMaxLevel)
- `awardClanXP(clubId, result)` — increments XP, checks for level-up, updates maxMembers on promotion

**XP awarded on:**
- PvE fights: `POST /v1/fight/save` → `awardClanXP()` (async, non-blocking)
- PvP fights: `pvpCombatEngine.saveFightResult()` → each player awards XP to their clan (win/draw/lose based on individual result)

**API responses:** `formatClubResponse()` now includes `level` and `xp` fields. Search supports `sortBy: 'level'`.

**maxMembers enforcement:** `club.maxMembers` is updated on level-up by `awardClanXP()`, existing join checks (`/change`, `/invite/respond`) use this field — no changes needed.

**Files changed:**
- `backend/prisma/schema.prisma` — level + xp fields on Club
- `backend/prisma/migrations/20260330000000_add_clan_level_xp/` — SQL migration
- `backend/src/config.js` — CLAN_LEVEL_CONFIG, CLAN_XP_REWARDS
- `backend/src/utils/clanLevel.js` — **new** helper
- `backend/src/utils/helpers.js` — formatClubResponse includes level/xp
- `backend/src/routes/fight.js` — PvE clan XP
- `backend/src/routes/club.js` — search sortBy level
- `backend/src/services/pvpCombatEngine.js` — PvP clan XP

### Clan Level + XP System — Frontend (ТЗ D2) — ✅ COMPLETE

Replaced all mock level/XP data with real values from API. Backend already returns `level` and `xp` in Club responses.

**ClubModel:** Added `level` (default 1) and `xp` (default 0) to constructor + `fromJSON`. Default `maxMembers` changed from 50 to 20.

**`src/data/clanLevels.js` (NEW):** Frontend copy of `CLAN_LEVEL_CONFIG` (10 levels) + `getClanLevelProgress(level, xp)` helper that calculates progress between current and next threshold (progressXP, progressMax, percent, isMaxLevel, maxMembers, xpBonus).

**ClanPageContent.vue:**
- Level badge: `LVL {club.level}` from API
- Level label: `LEVEL N → N+1` or `LEVEL 10 — MAX`
- XP bar: progress between current and next threshold (e.g. level 5, xp=14500 → 4,500 / 10,000 XP, 45%)
- Members count: `N / {config.maxMembers}` from level config
- Settings > Level Bonuses: real maxMembers, real xpBonus, next unlock text (shows what next level gives)

**ClubView.vue (visitor):** Same level/XP logic as ClanPageContent — real data from API.

**MyClubTab.vue:** LVL badge in clan list shows `club.level` from API instead of hardcoded "LVL 1".

**Files changed:**
- `src/core/models/clubModel.js` — added level, xp fields
- `src/data/clanLevels.js` — **new** frontend level config + helper
- `src/components/fragments/club/ClanPageContent.vue` — real level/XP/bonuses/members
- `src/views/ClubView.vue` — real level/XP for visitor view
- `src/components/fragments/club/MyClubTab.vue` — real LVL badge

### ClanEvent Model + Helper + Event Recording (ТЗ E1) — ✅ COMPLETE

Added ClanEvent Prisma model, helper, event recording in 7 backend locations, and API endpoint.

**1. Prisma model `ClanEvent`:**
- Fields: id (uuid), clubId → Club (cascade), type (String), actorId (String?), targetId (String?), data (Json?), createdAt
- Index: `[clubId, createdAt]`
- Types: `fight_win`, `fight_lose`, `fight_draw`, `member_join`, `member_leave`, `member_kick`, `role_change`, `level_up`
- Migration: `20260330100000_add_clan_events`

**2. Helper `backend/src/utils/clanEvents.js`:**
- `createClanEvent(clubId, type, actorId, targetId, data)` — silent try/catch, returns null on error

**3. Events recorded in:**
- `fight.js` POST /save — fight_win/lose/draw (PvE, data: opponentName, playerHp, opponentHp, mode: 'pve')
- `pvpCombatEngine.js` saveFightResult — fight_win/lose/draw for both players (data: opponentName, playerHp, opponentHp, mode: 'pvp')
- `club.js` POST /change join — member_join
- `club.js` POST /change leave — member_leave
- `club.js` POST /kick — member_kick (actorId=kicker, targetId=kicked)
- `club.js` POST /set-role — role_change (data: { role })
- `club.js` POST /invite/respond accept — member_join
- `clanLevel.js` awardClanXP — level_up (data: { level: newLevel })

**4. API endpoint:**
- `GET /v1/club/:clubId/events?limit=30&before=timestamp` — members only, cursor pagination, batch user lookup for actor/target {id, login, skin}

**Files changed:**
- `backend/prisma/schema.prisma` — ClanEvent model + Club.events relation
- `backend/prisma/migrations/20260330100000_add_clan_events/` — SQL migration
- `backend/src/utils/clanEvents.js` — **new** helper
- `backend/src/utils/clanLevel.js` — level_up event on level-up
- `backend/src/routes/fight.js` — PvE fight events
- `backend/src/routes/club.js` — join/leave/kick/set-role/invite-accept events + GET events endpoint
- `backend/src/services/pvpCombatEngine.js` — PvP fight events for both players

### Activity Feed Frontend (ТЗ E2) — ✅ COMPLETE

Replaced mock data in ClanActivityFeed.vue with real API data from `GET /v1/club/:clubId/events`.

**1. API + Vuex:**
- `clubService.js` — `getClanEvents(clubId, limit, before)` API call
- `clubState.js` — state: `clanEvents`, `clanEventsLoading`, `clanEventsHasMore`. Mutations: `setClanEvents`, `appendClanEvents`, `resetClanEvents`. Action: `fetchClanEvents` with pagination support

**2. ClanActivityFeed.vue rewrite:**
- Props changed: `members`+`clubData` → `clubId` only
- Fetches real events on mount via Vuex action
- Renders 8 event types with color-coded dots and formatted text
- "Load more" button with cursor pagination (`before` = last event's `createdAt`)
- Loading + empty states

**3. i18n keys added (all 11 locales):**
- `lblDrewMatch`, `lblWasKickedBy`, `lblToRole`, `lblClanReachedLevel`, `lblLoadMore`, `lblLoading`
- en + ru translated, other 9 locales use English values

**Files changed:**
- `src/components/fragments/club/ClanActivityFeed.vue` — full rewrite to real API data
- `src/components/fragments/club/ClanPageContent.vue` — updated ClanActivityFeed props
- `src/core/services/clubService.js` — `getClanEvents()` API call
- `src/core/state/modules/clubState.js` — clanEvents state + fetchClanEvents action
- `src/locales/en.js`, `src/locales/ru.js` + 9 other locales — new i18n keys

### Clan Balance — 5% Taps to Treasury (ТЗ E3) — ✅ COMPLETE

Added automatic 5% tap share from member punches to clan treasury balance.

**1. Config:** `CLAN_TAP_SHARE = 0.05` in `backend/src/config.js`

**2. Backend:** In `handler.js` `handlePunchBatch()`, after user taps are credited: if user has `clubId` and batch >= 20 taps → `Math.max(1, Math.floor(count * 0.05))` credited to `Club.balance` via fire-and-forget `.catch()`.

**3. Frontend:** No changes — Treasury in Settings already displays `club.balance`.

**Files changed:**
- `backend/src/config.js` — `CLAN_TAP_SHARE` constant
- `backend/src/websocket/handler.js` — clan balance increment in handlePunchBatch

### Club Mode Agents — Prisma Models (ТЗ-01) — ✅ COMPLETE

Added 4 new Prisma models for Club Mode agent system + extended Club model.

**Club model — new fields:**
- `maxAgents` (Int, default 2) — max agents per clan, grows with level (1→2, 2→3, 3→4, 4→5, 5+→6)
- `legendSkin` (String?) — retired fighter skin
- `legendArchetype` (String?) — retired fighter archetype
- `legendBuff` (Json?) — legend buff {xpBonus, dmgBonus, archetype}

**New models:**
- `Agent` — clan fighter: name, skin, 3 archetype modules, elo/stats, xp/level, status (idle|fighting|resting), relations to Club + User (both cascade). Indexes: clubId, ownerId, elo, status
- `AgentTactics` — 1:1 with Agent: aggression, dicePolicy, coachPreference, emergencyThreshold, restPeriod
- `AgentProgression` — 1:1 with Agent: speedXp/powerXp/techniqueXp, moves JSON, deck JSON
- `AgentFightLog` — N:1 with Agent: mode, result, opponent info, rounds/HP, xpEarned/eloChange, fightData JSON

**User model:** added `agents Agent[]` reverse relation
**Club model:** added `agents Agent[]` reverse relation

**Migration:** `20260402000000_add_club_mode_agents`

**Files changed:**
- `backend/prisma/schema.prisma` — 4 new models, Club + User extended
- `backend/prisma/migrations/20260402000000_add_club_mode_agents/migration.sql` — SQL migration

### Club Mode Agents — CRUD API (ТЗ-02) — ✅ COMPLETE

Added REST API for agent management with full validation and rate limiting.

**Endpoints (all require auth):**
- `GET /v1/agent/list` — list all agents for current user (includes tactics + progression)
- `GET /v1/agent/:id` — get single agent (ownership check)
- `POST /v1/agent/create` — create agent ($transaction: Agent + Tactics + Progression). Rate limit: 10/hr. Validates: club membership, roster limit (maxAgents), name regex, skin regex, archetypes whitelist
- `PUT /v1/agent/:id` — update agent (name/skin/modules). Cannot change modules while fighting
- `DELETE /v1/agent/:id` — delete agent (cascade). Cannot delete while fighting
- `PUT /v1/agent/:id/tactics` — update tactics (aggression, dicePolicy, coachPreference, emergencyThreshold, restPeriod). Each field validated against whitelist
- `GET /v1/agent/:id/fights` — fight history with mode filter, pagination (limit/offset), sorted by createdAt DESC

**Files changed:**
- `backend/src/routes/agent.js` — **new** route file (7 endpoints)
- `backend/src/index.js` — added agent route import + mount at `/v1/agent`

### Club Level System for Agents (ТЗ-03) — ✅ COMPLETE

Extended existing clan level system with agent support. Single unified level system — no parallel configs.

**Config changes (`config.js`):**
- `CLAN_LEVEL_CONFIG` — added `maxAgents` field per level (2→6, caps at level 5)
- `CLAN_XP_REWARDS` — added agent-specific rewards: `agent_win/draw/lose` (10/5/2), `agent_ranked_win/draw/lose` (20/10/5)

**New service (`services/clubLevelService.js`):**
- `calculateLevel(xp)` — derive level 1-10 from total XP
- `calculateMaxAgents(level)` — get maxAgents for level
- `getLevelInfo(xp)` — full level info with progress%, maxAgents, maxMembers, xpBonus, isMaxLevel
- `addClubXp(clubId, xpAmount)` — increment XP + auto level-up (updates level, maxMembers, maxAgents, fires level_up event)
- `getFightXpReward(result, mode)` — map fight result + mode to XP reward amount

**Endpoint:** `GET /v1/club/:id/level` — level info + currentAgents count (public, any authenticated user)

**Updated:** `awardClanXP()` in `clanLevel.js` — now also updates `maxAgents` on level-up

**Sync utility:** `backend/src/utils/syncClubLevels.js` — one-time script to recalculate level/maxMembers/maxAgents for all clubs

**Frontend:** `src/data/clanLevels.js` — added `maxAgents` to all levels

**Files changed:**
- `backend/src/config.js` — CLAN_LEVEL_CONFIG + CLAN_XP_REWARDS extended
- `backend/src/services/clubLevelService.js` — **new** service
- `backend/src/utils/clanLevel.js` — maxAgents in level-up
- `backend/src/routes/club.js` — GET /:id/level endpoint
- `backend/src/utils/syncClubLevels.js` — **new** sync script
- `src/data/clanLevels.js` — maxAgents added

### Research Gate — Agent Move Learning (ТЗ-04) — ✅ COMPLETE

Implemented Research Gate: agents can only learn moves the player has researched, up to the player's level.

**New service (`services/researchGateService.js`):**
- `MOVE_BRANCHES` — backend copy of move→branch mapping (18 moves)
- `LEVEL_UP_XP_COST` — XP cost per level: Lv1=free, Lv2=50, Lv3=100, Lv4=200, Lv5=350
- `getPlayerResearch(userId)` — extract unlocked moves from User.progression JSON
- `canAgentLearnMove(userId, moveId, targetLevel)` — Research Gate check
- `validateAgentDeck(userId, deck, agentMoves)` — validate entire deck against Research Gate
- `getAvailableMovesForAgent(userId, agentId)` — list moves agent can learn with current/max levels

**New endpoints in agent.js:**
- `GET /v1/agent/:id/available-moves` — moves available to agent (maxLevel from player, agentCurrentLevel, canUpgrade, xpCost)
- `POST /v1/agent/:id/learn-move` — agent learns/upgrades a move (Research Gate + XP deduction from branch)
- `PUT /v1/agent/:id/deck` — update agent deck (4-8 moves, all learned, no duplicates, Research Gate validated)

**Research Gate rules:**
- Agent can learn move only if player has it unlocked
- Agent level for a move cannot exceed player's level for that move
- Level 1 is free, levels 2-5 cost branch XP (same costs as player)
- Cannot learn or change deck while agent status is 'fighting'

**Files changed:**
- `backend/src/services/researchGateService.js` — **new** service
- `backend/src/routes/agent.js` — 3 new endpoints + researchGateService import

### Agent Combat Engine (ТЗ-05) — ✅ COMPLETE

Server-side fight simulation for clan agents. Hybrid of PvE action-based combat + PvP archetype passive modifiers.

**New files:**
- `backend/src/services/agentCombatEngine.js` — `simulateAgentFight()` (synchronous, no Prisma) + `generatePveBot()`
- `backend/src/data/archetypes.js` — backend copy of archetype priorities + dicePreferences

**How agents fight:**
- Action selection: archetype priorities (50/30/20% slot weights) + aggression modifier (cautious/balanced/aggressive) + emergency override + coach boost
- Move selection: from deck — best damage for attack, best speed for defense, cycle for position
- Damage: move-based + archetype passive modifiers (dmgBonus, incomingReduction, dodge, crit from ARCHETYPE_MODIFIERS)
- Speed-based KO: both attacking → faster hits first, can KO before counter
- Dice: policy-driven (always/smart/never), cooldown 3 rounds, 6 effects
- Coach: preference-driven (attack/defense/position/auto), once per fight from round 6
- Emergency: threshold-based (30/20/0 HP%), switches to permanent defense
- Overdrive: after round 10, +5HP drain/round, dice disabled, attack bias
- PvE bot generator: scales by ELO (weak <900, medium 900-1100, strong >1100)

**Files changed:**
- `backend/src/services/agentCombatEngine.js` — **new** fight engine
- `backend/src/data/archetypes.js` — **new** backend archetype data

### PvE Training Mode (ТЗ-06) — ✅ COMPLETE

Agent PvE Training: fight a bot on demand, earn XP (70%), no ELO change.

**New service (`services/agentFightService.js`):**
- `runPveTraining(agentId, userId)` — full fight orchestration: validate → set fighting → simulate → distribute XP → log → update stats → set idle
- `distributeXpByBranch(roundLog, totalXp)` — proportional XP distribution across speed/power/technique based on moves used
- XP multipliers: pve_training 70%, ranked 100%, free_arena 80%
- Base XP: victory 20, defeat 8, draw 14
- 10s cooldown between manual fights

**New endpoint:**
- `POST /v1/agent/:id/train` — run PvE training fight. Rate limit: 30/hr. Returns fight result + updated agent stats + progression + club XP

**Flow:** idle → fighting → simulate → XP to agent branches + XP to club → fight log → idle

**Files changed:**
- `backend/src/services/agentFightService.js` — **new** fight orchestrator
- `backend/src/routes/agent.js` — POST /:id/train endpoint + import

### Agent Auto-Fight Scheduler (ТЗ-07) — ✅ COMPLETE

Server-side scheduler: agents fight PvE bots automatically based on restPeriod. Player wakes up to results.

**Schema:** Added `autoFight` (Boolean, default false) to Agent model. Migration: `20260403000000_add_agent_auto_fight`.

**New service (`services/agentScheduler.js`):**
- `startScheduler()` — starts 30s interval, first tick immediately on boot
- `stopScheduler()` — graceful shutdown
- `tick()` — recover stuck agents → wake resting → find ready → run fights (max 10/tick)
- Stuck recovery: agents in 'fighting' > 5min reset to 'idle'
- Daily limit: 50 fights/agent/day (counted via AgentFightLog.createdAt)

**Refactored `agentFightService.js`:**
- Extracted `_executeFight()` — shared core logic
- `runPveTraining()` — manual (cooldown 10s, status→idle)
- `runAutoFight()` — scheduler (no cooldown, scheduler sets resting+nextFightAt)

**New endpoints in agent.js:**
- `PUT /v1/agent/:id/auto-fight` — toggle auto-fight (validates deck≥4, sets nextFightAt=now)
- `GET /v1/agent/:id/auto-fight-status` — auto-fight status (todayFights, nextFightAt, lastResult)

**Config:** `AGENT_SCHEDULER_TICK_MS=30000`, `AGENT_MAX_FIGHTS_PER_TICK=10`, `AGENT_MAX_FIGHTS_PER_DAY=50`, `AGENT_STUCK_TIMEOUT_MS=300000`

**Status flow:**
- Manual: `idle → fighting → idle`
- Auto: `idle (autoFight=true) → fighting → resting → idle → ...`
- Disable: `any → idle (autoFight=false, nextFightAt=null)`

**Files changed:**
- `backend/prisma/schema.prisma` — autoFight field on Agent
- `backend/prisma/migrations/20260403000000_add_agent_auto_fight/` — SQL migration
- `backend/src/config.js` — scheduler constants
- `backend/src/services/agentScheduler.js` — **new** scheduler
- `backend/src/services/agentFightService.js` — refactored: _executeFight + runAutoFight
- `backend/src/routes/agent.js` — 2 new endpoints (auto-fight, auto-fight-status)
- `backend/src/index.js` — startScheduler on boot + graceful shutdown

### Ranked Mode — Agent vs Agent with ELO (ТЗ-08) — ✅ COMPLETE

Ranked fights: agent vs agent from different owners. ELO rating, matchmaking by proximity, 100% XP.

**Schema:** Added `fightMode` (String, default 'pve_training') to AgentTactics. Migration: `20260403100000_add_agent_fight_mode`.

**New services:**
- `eloService.js` — `calculateElo(ratingA, ratingB, result)`: K=32, clamp 100-3000, standard ELO formula
- `rankedMatchmaker.js` — `findRankedPairs()`: ELO range ±200, different owners, rematch cooldown (last 5 fights), max 5 pairs/tick

**Extended `agentFightService.js`:**
- `runRankedFight(agent1Id, agent2Id)` — full ranked fight: simulate → ELO calc → XP 100% both agents → fight logs both → club XP both → atomic $transaction (8 operations)
- Inverted result for agent2 (victory↔defeat, draw=draw)

**Extended `agentScheduler.js`:**
- tick() now splits: PvE agents (fightMode='pve_training') vs Ranked agents (fightMode='ranked')
- Ranked: findRankedPairs() → runRankedFight() → set both resting

**New endpoint:**
- `GET /v1/agent/rankings` — leaderboard sorted by ELO DESC, wins DESC. Min 5 fights to appear. Includes owner info. Pagination.

**Updated endpoint:**
- `PUT /v1/agent/:id/tactics` — now accepts `fightMode` ('pve_training'|'ranked')

**Config:** `ELO_K_FACTOR=32`, `ELO_MIN=100`, `ELO_MAX=3000`, `ELO_MATCH_RANGE=200`, `RANKED_REMATCH_COOLDOWN=5`, `RANKED_MAX_PAIRS_PER_TICK=5`, `RANKED_MIN_FIGHTS_FOR_RANKING=5`

**Files changed:**
- `backend/prisma/schema.prisma` — fightMode in AgentTactics
- `backend/prisma/migrations/20260403100000_add_agent_fight_mode/` — SQL migration
- `backend/src/config.js` — ELO + ranked constants
- `backend/src/services/eloService.js` — **new** ELO calculator
- `backend/src/services/rankedMatchmaker.js` — **new** matchmaker
- `backend/src/services/agentFightService.js` — runRankedFight + eloService import
- `backend/src/services/agentScheduler.js` — ranked flow in tick + imports
- `backend/src/routes/agent.js` — rankings endpoint + fightMode in tactics

### Free Arena Mode (ТЗ-09) — ✅ COMPLETE

Free Arena: agent vs agent, random matchmaking, no ELO change, 80% XP. For testing builds without rating risk.

**Refactored `agentFightService.js`:**
- Extracted `_executeAgentVsAgentFight(a1Id, a2Id, options)` — shared core for ranked + free arena
- `runRankedFight()` → wrapper: `{ mode: 'ranked', applyElo: true, xpMultiplier: 1.0 }`
- `runFreeArenaFight()` → wrapper: `{ mode: 'free_arena', applyElo: false, xpMultiplier: 0.8 }`

**Extended `rankedMatchmaker.js`:**
- `findFreeArenaPairs()` — no ELO range, no rematch cooldown, random shuffle, different owners only

**Extended `agentScheduler.js`:**
- tick() now has 3 modes: PvE → Ranked → Free Arena

**Config:** `FREE_ARENA_MAX_PAIRS_PER_TICK=5`

**Files changed:**
- `backend/src/config.js` — FREE_ARENA_MAX_PAIRS_PER_TICK
- `backend/src/services/agentFightService.js` — refactored: _executeAgentVsAgentFight + runFreeArenaFight
- `backend/src/services/rankedMatchmaker.js` — findFreeArenaPairs
- `backend/src/services/agentScheduler.js` — free arena flow in tick
- `backend/src/routes/agent.js` — 'free_arena' in VALID_FIGHT_MODE

### Club Mode UI + Create Agent + Agent Detail (ТЗ-13/14/15) — ✅ COMPLETE

Frontend for Club Mode agents. See Views table for details.

- `src/core/state/modules/agentState.js` — Vuex module (14th): agents CRUD, club level, detail actions (fetch/update/train/moves/deck/tactics/fights)
- `src/components/club/` — AgentCard, ClubLevelBar, AgentRoster, MorningReport, SkinPicker, ArchetypeSelector
- `src/views/CreateAgentView.vue` — 3-step wizard (name+skin → build → confirm)
- `src/views/AgentDetailView.vue` — 4-tab management (overview, moves, tactics, fights) + edit/deck/delete modals
- `src/utils/fightStylePreview.js` — template-based fight style description generator

### Morning Report Lv1 (ТЗ-18) — ✅ COMPLETE

Claude AI daily club report: stats + 4-section analysis (summary, highlights, concerns, recommendation).

**New service (`services/morningReportService.js`):**
- `gatherClubStats(clubId, period)` — aggregates AgentFightLog per agent for period
- `buildMorningReportPrompt()` — formats club data for Claude prompt

**New endpoint:** `POST /v1/ai/morning-report` — period (today/yesterday/last_7d), rate limit 3/hr, 30min cache

**New component:** `MorningReport.vue` — period selector, stats bar, 4 AI analysis sections, generate button

**Files changed:**
- `backend/src/services/morningReportService.js` — **new** stats gathering + prompt builder
- `backend/src/routes/ai.js` — morning-report endpoint with cache + rate limit
- `src/components/club/MorningReport.vue` — **new** frontend component
- `src/components/fragments/club/ClanPageContent.vue` — integrated MorningReport

### Morning Report Lv2 — Per-Agent Analysis (ТЗ-19) — ✅ COMPLETE

Extended Morning Report with per-agent individual analysis: assessment, tactics advice, build advice.

**Extended `morningReportService.js`:**
- `gatherClubStats()` now returns enriched agentStats: skin, elo change, tactics, build, recentResults, avgRounds, dice/coach/emergency rates
- `buildMorningReportPrompt()` includes per-agent details in prompt, requests `agents[]` in JSON response

**Extended endpoint:**
- Dynamic max_tokens: 400 + 150 per active agent (cap 1200)
- Response includes `stats.agentStats[]` (per-agent stats) + `analysis.agents[]` (per-agent AI text)

**Extended `MorningReport.vue`:**
- Agent accordion section below club analysis
- Each agent: header (skin, name, ELO change, W/L) → expandable body (recent results, assessment, tactics advice, build advice)
- Sorted by winRate DESC, matched to AI analysis by agent name

**Files changed:**
- `backend/src/services/morningReportService.js` — enriched stats + Lv2 prompt
- `backend/src/routes/ai.js` — dynamic tokens + agentStats in response
- `src/components/club/MorningReport.vue` — agent accordion UI

### Morning Report Lv3 — Deep Meta Analysis + x402 (ТЗ-20) — ✅ COMPLETE

Premium deep analysis: global meta comparison, optimal builds, training plan, ELO forecast. x402 micropayment (feature flag, disabled by default).

**New service (`services/metaAnalysisService.js`):**
- `gatherMetaStats()` — global ELO distribution, top builds, archetype win rates, best tactics
- `getClubRanking(clubId)` — club position vs all clubs (rank, percentile)

**New middleware (`middleware/x402.js`):**
- Payment verification with feature flag (`X402_ENABLED`). When disabled: bypasses payment. When enabled: requires `X-Payment-Tx` header with USDC tx hash.

**Extended `morningReportService.js`:**
- `buildLv3Prompt()` — includes meta stats, club ranking, per-agent meta position

**New endpoint:** `POST /v1/ai/premium-report` — deep analysis (2000 tokens), x402 payment, 10/day rate limit

**Extended `MorningReport.vue`:**
- "Deep Analysis" section below Lv2. Free preview button (when x402 disabled) or unlock button ($0.02 USDC)
- Renders: meta position, strength, weakness, training plan, forecast

**Config:** `PREMIUM_REPORT_MAX_TOKENS=2000`, `X402_ENABLED`, `X402_PREMIUM_REPORT_PRICE=20000`, `USDC_CONTRACT_BASE`

**Files changed:**
- `backend/src/config.js` — x402 + premium constants
- `backend/src/services/metaAnalysisService.js` — **new** global meta stats
- `backend/src/middleware/x402.js` — **new** payment middleware (feature flag)
- `backend/src/services/morningReportService.js` — buildLv3Prompt
- `backend/src/routes/ai.js` — premium-report endpoint
- `src/components/club/MorningReport.vue` — deep analysis UI

### Retirement + Legacy System (ТЗ-21) — ✅ COMPLETE

Fighter retirement: fully trained fighter becomes a Legend, grants passive buffs to all clan agents.

**New service (`services/retirementService.js`):**
- `checkRetirementEligibility(userId)` — checks all 5 requirements (18 moves unlocked, 12 at Lv3+, 3 at Lv5, has club, no existing legend)
- `calculateRetirementProgress(progression)` — weighted progress 0-100%
- `calculateLegendBuff(progression, primaryModule)` — xpBonus (5%+1%/Lv5 move), dmgBonus (2%+0.5%/Lv4+ move), archetype match ×1.5
- `retireFighter(userId, primaryModule)` — sets Club.legendSkin/legendArchetype/legendBuff, marks User.progression.retired=true
- `getClubLegendBuff(clubId)` — quick lookup for combat engine

**New endpoints in user.js:**
- `GET /v1/user/retirement-status` — progress, requirements, legend info, buff preview
- `POST /v1/user/retire` — execute retirement (irreversible)

**Legend buff in combat:**
- `agentCombatEngine.js` — legendDmgMult applied to base damage in resolveRound
- `agentFightService.js` — legend xpBonus applied to earned XP in _executeFight + _executeAgentVsAgentFight
- Archetype match: if agent's primaryModule === legend archetype → buff × 1.5

**New component:** `RetirementPanel.vue` — progress/requirements display, buff preview, retire button, legend display

**Files changed:**
- `backend/src/services/retirementService.js` — **new** retirement logic
- `backend/src/routes/user.js` — 2 new endpoints
- `backend/src/services/agentCombatEngine.js` — legendDmgMult in damage calc
- `backend/src/services/agentFightService.js` — legend XP buff + getClubLegendBuff import
- `src/components/club/RetirementPanel.vue` — **new** frontend component
- `src/components/fragments/club/ClanPageContent.vue` — integrated RetirementPanel

### Agent Rankings + Leagues (ТЗ-26) — ✅ COMPLETE

Agent leaderboard with 6 league tiers, integrated into RatingsView as 4th tab.

**Leagues:** Bronze (0-899), Silver (900-1099), Gold (1100-1299), Platinum (1300-1499), Diamond (1500-1799), Champion (1800+)

**New files:**
- `src/utils/leagues.js` — league constants, `getLeague(elo)`, `getLeagueColor(elo)`
- `src/components/ratings/LeagueBadge.vue` — ELO-based colored league badge
- `src/components/ratings/AgentLeaderboard.vue` — full leaderboard with league filter, "Your Agents" section, pagination

**Extended `RatingsView.vue`:** Added 4th tab "Agents" with `AgentLeaderboard` component

**Files changed:**
- `src/utils/leagues.js` — **new** league utility
- `src/components/ratings/LeagueBadge.vue` — **new** component
- `src/components/ratings/AgentLeaderboard.vue` — **new** component
- `src/views/RatingsView.vue` — AGENTS tab + import
- `src/locales/*.js` — rating.* agent keys (15 new)

### NFT Mint Agents — ERC-1155 on Base (ТЗ-23) — ✅ COMPLETE

Agent NFT minting: first agent free, additional require ERC-1155 NFT on Base. Feature flag disabled by default.

**Smart contract:** `contracts/HexlashAgents.sol` — ERC-1155, mint with ETH, owner mint, max supply/per-wallet limits
**ABI:** `src/assets/abi/HexlashAgents.json` — human-readable for ethers.js

**Backend:**
- `services/nftService.js` — `getAgentNftBalance()`, `checkMintRequirement()` (feature flag bypass)
- `routes/agent.js` — NFT check in POST /agent/create (after roster limit, before validation)
- `config.js` — `NFT_MINTING_ENABLED`, `AGENT_NFT_CONTRACT`, `BASE_RPC_URL`

**Frontend:**
- `core/services/nftMintService.js` — `getAgentNftBalance()`, `getMintInfo()`, `mintAgentNft()`
- `CreateAgentView.vue` — conditional NFT mint section on step 3

**Feature flag:** `NFT_MINTING_ENABLED=false` → all agents free. `true` → first free, 2+ require NFT.

**Files changed:**
- `contracts/HexlashAgents.sol` — **new** ERC-1155 contract
- `src/assets/abi/HexlashAgents.json` — **new** ABI
- `backend/src/services/nftService.js` — **new** on-chain verification
- `backend/src/routes/agent.js` — NFT check in create
- `backend/src/config.js` — NFT constants
- `src/core/services/nftMintService.js` — **new** frontend mint helpers
- `src/views/CreateAgentView.vue` — NFT mint UI
