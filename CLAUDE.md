# HEXLASH — Project Memory

Full-stack Web3 fighting game. Vue 3 SPA + Express backend + PostgreSQL. Telegram WebApp compatible.

> **RULE: After every task, update this file.** Changed views/components → update descriptions. New components → add to Component Highlights. New data files → add to Project Structure. Changed architecture → update relevant sections. CLAUDE.md is the source of truth.

---

## Tech Stack

**Frontend:** Vue 3.5 · Vite 7 · Vuex 4 · Vue Router 4 · Vuetify 2 · Three.js · Howler.js · Ethers.js 6 (legacy, wagmi migration planned) · @wagmi/vue · viem · @tanstack/vue-query · Custom i18n (11 locales) · Amplitude

**Backend:** Express 4 · Prisma 5 (PostgreSQL) · JWT · WebSocket (ws) · Multer · bcryptjs · express-rate-limit · Anthropic SDK (AI Trainer)

---

## Project Structure

```
/src
  App.vue                  — Root: header (Logo), router-view, BottomMenu (hidden on PvP screens), Info/Error toasts, ChallengeNotification
  main.js                  — Entry: Vue + Vuetify + i18n + Vuex + WagmiPlugin + VueQueryPlugin init
  router/index.js          — Routes + auth guards + fight state restore
  views/                   — 19 page-level components (incl. FightClubView, CreateAgentView, AgentDetailView)
  components/              — 75+ reusable components
  components/club/         — 8 Club Mode components (AgentRoster, AgentCard, ClubLevelBar, MorningReport, RetirementPanel, SkinPicker, ArchetypeSelector, ResearchTree)
  components/clan/         — 1 Clan social component (ClanInviteNotification)
  components/fragments/clan/ — 10 Clan social fragments (ClanPageContent, ClanActivityFeed, ClanEdit, ClanStats, ClanAvatar, ClanOwnerAvatar, ClanWithdraw, ClanConfirmModal, CreateClan, MyClanTab)
  components/ratings/      — AgentLeaderboard
  core/
    state/store.js         — Vuex store
    state/modules/         — 13 Vuex modules (incl. agentState for Fight Club, clanState for social clans)
    models/                — 20+ data models (internal, ws, etc.)
    services/              — 9 business logic services (clanService, contractService, fightService, masterService, nftMintService, punchService, statsService, taskService, userService)
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
    beltDisplay.js         — Belt display helpers (BELT_THRESHOLDS, getBeltDisplay, getNextThreshold, getBeltProgressPercent)
    fightStylePreview.js   — Template-based fight style description (DEAD CODE — not imported)
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
    routes/                — auth, user, clan, task, file, fight, stats, friends, ai, agent
    middleware/            — auth.js (JWT guard), upload.js (Multer)
    websocket/handler.js   — Real-time message routing + challenge system
    websocket/pvpHandler.js — PvP fight message handling
    services/matchmaking.js — PvP matchmaking service
    services/pvpMatchManager.js — PvP match lifecycle management
    services/pvpCombatEngine.js — PvP combat engine
    services/agentCombatEngine.js — Agent fight simulation (action-based + archetype modifiers, dice, coach, emergency)
    services/agentFightService.js — Agent fight orchestrator (PvE training, ranked, free arena, XP distribution)
    services/agentScheduler.js — Auto-fight scheduler (30s tick, resting/idle cycle, daily limit 50)
    services/eloService.js — ELO rating calculation (K=32, clamp 100-3000)
    services/rankedMatchmaker.js — Ranked + free arena matchmaking (ELO range ±200, rematch cooldown)
    services/fightClubService.js — Personal FightClub management (getOrCreate, addXp, getLegendBuff)
    services/beltService.js — Belt system (isQualifyingWin, calculateBelt, checkHexmaster, applyWin)
    services/captainService.js — Captain Agent management (setCaptain, atomic swap)
    services/retirementService.js — Fighter retirement + legend buff
    services/researchGateService.js — Research Gate: per-agent research tree (unlock/upgrade moves, lazy migration)
    services/morningReportService.js — Claude AI morning report stats + prompts
    services/metaAnalysisService.js — Global meta statistics for premium reports
    services/nftService.js — NFT minting verification (feature flag off)
    services/userMigrationService.js — Lazy User→Fighter #1 migration on /me
    utils/helpers.js       — awardAchievement, formatClubResponse, formatUserResponse
    utils/clanEvents.js    — createClanEvent helper (fire-and-forget)
    utils/clanLevel.js     — getClanLevelInfo, awardClanXP
    utils/migrationHelpers.js — transformMoves, extractModules, calculateBranchXp
    data/archetypes.js     — Backend copy of archetype priorities + dicePreferences
    data/branches.js       — Branch definitions (backend copy)
    data/cardPower.js      — Card power balance (backend copy)
    data/moves.js          — Move definitions (backend copy)
  scripts/
    backfill-belts.js      — Recalculate belts for all agents
    backfill-captains.js   — Set isCaptain for first agents
    calibrate-belts.js     — Belt calibration utility
    cleanup-agents.js      — Agent data cleanup
    migrate-all-users.js   — Batch User→Fighter migration
  tests/
    userMigrationService.test.js — User→Fighter migration tests (14 tests)
    beltService.test.js    — Belt system: qualifying wins, belt calc, hexmaster
    captainService.test.js — Captain: setCaptain, atomic swap
    captainArenaFlow.test.js — Captain in arena: PvE/PvP flow
  prisma/
    schema.prisma          — 19 models: User, Clan, ClanInvite, ClanEvent, FightClub, Achievement, UserAchievement, SocialTask, UserSocialTask, DailyTask, UserDailyTask, Fight, PunchInfo, FriendRequest, Friendship, Agent, AgentTactics, AgentProgression, AgentFightLog
    seed.js
    migrations/            — PostgreSQL migrations

/docs
  phase1-parking-list.md   — 52 technical debts from deepdive #1a-#1i
  road1-final-report.md    — Road 1 completion report
  road2-parking-list.md    — Road 2 parking list

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
| `/arena` | Redirect → `/arena/club` | Yes |
| `/arena/fight` | PreparationView | Yes |
| `/arena/club` | FightClubView | Yes |
| `/arena/club/create` | CreateAgentView | Yes |
| `/arena/club/:agentId` | AgentDetailView | Yes |
| `/fight` | CardFightView | Yes |
| `/training` | TrainingView | Yes |
| `/training/moves` | *Deleted* — research moved to AgentDetailView Moves tab | — |
| `/training/deck` | *Deleted* — deck editing in AgentDetailView | — |
| `/profile` `/profile/balance` `/profile/wallet` `/profile/account` `/profile/skins` | ProfileView | Yes |
| `/clan/:id` | ClanView | Yes |
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
| `progressionState` | Taps, freeXP, legacy deck/moves, server sync (PUT /user/progression). Research moved per-agent. |
| `clanState` | Clan info, members, balance, roles (set-role, transfer-ownership, kick). Namespace `clan/`. File: `clanState.js` |
| `taskState` | Daily + social tasks |
| `punchState` | Punch/tap rate limiting, cooldown, 2D/3D punch toggle, sound mute toggle |
| `achievementState` | Achievements list + unlocking |
| `contractState` | Web3 wallet, token balance |
| `webSocketState` | WS connection, real-time messages |
| `pvpState` | Real-time PvP matchmaking and fights |
| `friendsState` | Friends list, friend requests, challenges (WebSocket-based) |
| `agentState` | Agent roster: CRUD, auto-fight toggle, Fight Club level, 30s auto-refresh. `agentsList` sorted by isCaptain → isHexmaster → belt → qualifiedWins. Getter `currentCaptain`. Action `setCaptain`. |

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

## Belt System

**Replaces:** ELO-based League System (LeagueBadge, leagues.js — deleted). ELO remains as hidden matchmaking score in `rankedMatchmaker.js` and `eloService.js`.

**33 grades:** 9 colors × 4 stripes (0-3) + Black (0 stripes) = grades 0-32. Count-based progression via `qualifiedWins`.

**Colors:** White (0-3), Yellow (4-7), Orange (8-11), Green (12-15), Blue (16-19), Purple (20-23), Brown (24-27), Red (28-31), Black (32).

**Quality filter:** From grade 8 (Orange-0), only wins vs opponents at belt grade ≥ agent-1 count. PvE bots treated as belt 0.

**Hexmaster:** Separate boolean flag, requires 4000 qualified wins. Terminal — once earned, never lost.

**Frontend:** `BeltBadge.vue` (3 sizes), `beltDisplay.js` (BELT_THRESHOLDS mirror + getBeltDisplay/getNextThreshold/getBeltProgressPercent).

**Backend:** `beltService.js` (isQualifyingWin, calculateBelt, checkHexmaster, applyWin). Belt updated atomically in same $transaction as fight stats.

**Agent fields:** `belt` (Int, 0-32), `qualifiedWins` (Int), `isHexmaster` (Boolean), `isCaptain` (Boolean). Backfill scripts: `backend/scripts/backfill-belts.js`, `backend/scripts/backfill-captains.js`.

**Captain:** One Agent per FightClub with `isCaptain=true`. PvP representative. Atomic swap via `captainService.setCaptain()`. Cannot delete captain if other agents exist. `PUT /v1/agent/:id/captain` endpoint. Migration creates Fighter #1 as captain.

**Captain in Arena:** After #P1-captain-2, PvE and PvP fights use Captain Agent data (deck, moves, modules, skin, ELO). User stats (pveWins, pvpWins, rating) are frozen legacy — no longer updated. Belt progression applies to Captain Agent. `progressionState` is trainer-only (TrainingView, MoveTree, DeckBuilder).

**Captain in Public UI:** After #P1-captain-3, all public views show `UserCaptainBadge` (BeltBadge + captain name) instead of User.rating. API responses include `captain` sub-object via `getCaptainPublicInfo`/`getCaptainsForUsers` (bulk, no N+1). ProfileView has two layers: Trainer (User) + Captain (Agent).

---

## Design System — "Neon Discipline"

**Status:** v1.0 — Visual System established.
**Full visual guide:** Hexlash_Visual_System.pdf v1.0 (file not in repo — source of truth is hexlash-design/SKILL.md)
**Operational reference:** /skills/hexlash-design/SKILL.md
**Key rules:** 1) one pink accent per screen, 2) pixel-font (Anonymous) only for titles/impact moments (exception: splash screens use two pixel-font blocks — HEXLASH + NEVER GIVE UP), 3) archetype colors only in fighter icons/active context, 4) backgrounds = atmosphere (stylized underground), UI = function.

### UI Components (`/src/components/ui/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PixelIcon` | `PixelIcon.vue` | 16×16 canvas-based pixel icons. **Currently unused** — preserved but not referenced by any app file. Props: name, size, color, glow, glowColor, glowSize, disabled. |
| `HexButton` | `HexButton.vue` | 5 variants: primary, secondary, ghost, danger, archetype. 3 sizes (sm/md/lg). Props: icon (PixelIcon, **unused by app**), loading (CSS spinner), block, disabled, archetypeColor. |
| `HexCard` | `HexCard.vue` | 5 variants: default, elevated, archetype (left border), active (tinted bg), result (top border victory/defeat/draw). Slots: header, footer. Padding: none/sm/md/lg. |
| `HexProgress` | `HexProgress.vue` | Progress bar. 3 variants: hp (auto green/yellow/red by %), branch (speed/power/technique colors), generic. 3 sizes. Props: label, showValue, showPercent. |
| `HexBadge` | `HexBadge.vue` | Pill badge. 5 variants: archetype, branch, status (victory/defeat/draw/info), counter (circle/pill auto), custom. Props: icon (PixelIcon), pulse animation. |
| `BeltBadge` | `BeltBadge.vue` | SVG belt badge for 33 grades + Hexmaster. Line-style: rect body, buckle, stripes. 3 sizes: sm (16×6), md (40×14), lg (120×40). Props: grade (0-32), isHexmaster, size. |
| `UserCaptainBadge` | `UserCaptainBadge.vue` | Composite badge: BeltBadge + optional captain name. Sizes xs/sm/md. Shows "—" when no captain. |

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

> **Visual System v1.0** — operational reference in /skills/hexlash-design/SKILL.md (Hexlash_Visual_System.pdf not in repo). Key rules: one pink accent per screen, pixel-font only for titles/impact, archetype colors only in fighter icons/active context, backgrounds = atmosphere (stylized underground), UI = function.

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

**Scrollable View Pattern:** `.background` in `main.css` is `position: fixed; overflow: hidden; height: 100vh` — it does NOT scroll. Every view must have its own scrollable inner container with: `position: relative; z-index: 10; overflow-y: auto; height: 100vh` (+ `@supports (height: 100dvh)`), `-webkit-overflow-scrolling: auto; overscroll-behavior-y: none`. BottomMenu is `position: fixed; ~72-96px` tall — views need sufficient `padding-bottom` (arena-views use 120px) or spacer elements (Profile/Training use `.scroll-gap`). Technical debt: two scroll placement patterns exist — PreparationView applies scroll on outer `.arena-container` (like Profile/Training), while FightClubView/AgentDetailView/CreateAgentView apply scroll directly on their content container. Two BottomMenu compensation patterns (padding-bottom vs `.scroll-gap`) also coexist. Unification is a future task.

**Desktop Scaling (first desktop optimization):** `@media (min-width: 1024px)` in `main.css` sets `html { font-size: 18px }` (mobile default 16px). View containers expand to `max-width: 1024px` on desktop via scoped media queries in each view. Updated: FightClub, AgentDetail, CreateAgent, Preparation, DeckBuilder, Friends, Spectate, Ratings. Excluded: CardFightView, MatchmakingView (specialized combat layout — keep narrow). Already 1024px: Profile, Training, Clan, MoveTree. Technical debt: ~2519 px-based values vs ~245 rem — converting key design tokens to rem for proportional scaling is a separate task. No existing desktop breakpoints existed before this change.

---

## Game Constants (`/src/core/constants.js`)

```js
COST_CREATE_CLUB = 10000
COST_PER_CLICK = 2
MULTIPLAYER_EXACT_CLICK = 3

MAX_HP = 100
MAX_ROUNDS = 10
EXTRA_ROUNDS = 2
EXTRA_ROUND_DAMAGE_MULTIPLIER = 2
TOTAL_ROUNDS = 12        // MAX_ROUNDS + EXTRA_ROUNDS
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
EXTRA_ROUNDS = 2
EXTRA_ROUND_DAMAGE_MULTIPLIER = 2
TOTAL_ROUNDS = 12
MAX_DECK_SIZE = 8
MIN_DECK_SIZE = 4
MIN_PVP_DECK_SIZE = 3     // PvP allows starter deck (3 moves)
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

// WebSocket
WS_PING_INTERVAL_MS = 30000    // server ping every 30s
WS_PONG_TIMEOUT_MS = 10000     // kill connection if no pong in 10s
PVP_READY_TIMEOUT_MS = 15000   // cancel match if player not ready in 15s

// PvP Archetype Modifiers (passive per-archetype bonuses)
SLOT_WEIGHTS = [0.5, 0.3, 0.2]
ARCHETYPE_MODIFIERS = { predator, sentinel, ghost, analyst, maverick, juggernaut }

// Clan Level System
CLAN_LEVEL_CONFIG = { 1..10: { xpRequired, maxMembers, maxAgents, xpBonus } }
CLAN_XP_REWARDS = { win: 10, draw: 5, lose: 3, agent_win: 10, agent_draw: 5, agent_lose: 2, agent_ranked_win: 20, agent_ranked_draw: 10, agent_ranked_lose: 5 }
CLAN_TAP_SHARE = 0.05              // 5% of member taps → clan treasury

// Agent Scheduler
AGENT_SCHEDULER_TICK_MS = 30000       // 30 seconds
AGENT_MAX_FIGHTS_PER_TICK = 10
AGENT_MAX_FIGHTS_PER_DAY = 50
AGENT_STUCK_TIMEOUT_MS = 300000       // 5 minutes

// ELO System
ELO_K_FACTOR = 32
ELO_MIN = 100
ELO_MAX = 3000
ELO_MATCH_RANGE = 200

// Ranked
RANKED_REMATCH_COOLDOWN = 5
RANKED_MAX_PAIRS_PER_TICK = 5
RANKED_MIN_FIGHTS_FOR_RANKING = 5
FREE_ARENA_MAX_PAIRS_PER_TICK = 5

// AI Trainer
ANTHROPIC_API_KEY = env
ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'
AI_TRAINER_MAX_TOKENS = 300
AI_BUILD_DESCRIPTION_MAX_TOKENS = 60
AI_TRAINER_ENABLED = true

// Premium Report (Lv3)
PREMIUM_REPORT_MAX_TOKENS = 2000
X402_ENABLED = false               // feature flag, disabled by default
X402_PREMIUM_REPORT_PRICE = 20000  // 0.02 USDC (6 decimals)
USDC_CONTRACT_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// NFT Minting
NFT_MINTING_ENABLED = false        // feature flag, disabled by default
AGENT_NFT_CONTRACT = env
BASE_RPC_URL = 'https://mainnet.base.org'

// Migration
MIGRATION_ENABLED = true           // lazy User→Fighter #1 on /me
```

**Prisma:** Singleton via `backend/src/lib/prisma.js` — all routes and services use shared instance
**CORS:** Allows `hexlash.com`, `www.hexlash.com`, `test.hexlash.com`, `hexlash.vercel.app` + FRONTEND_URL (no wildcard)
**Health checks:** `GET /` and `GET /health`
**Body limits:** `express.json({ limit: '1mb' })`, `express.urlencoded({ limit: '1mb' })`

---

## Combat System

**Flow:** Build deck (4–8 modules) → Generate AI opponent → Simulate rounds → Dice mechanic → Coach advice → Save result

**Club Mode (Agents):** Backend-driven via `agentScheduler.js` (30s tick). Agents fight PvE bots or each other (ranked/free arena) automatically based on `AgentTactics.restPeriod`. No frontend localStorage — all state in Prisma (Agent, AgentTactics, AgentProgression, AgentFightLog). Fight results saved atomically in $transaction. Daily limit: 50 fights/agent/day. Three modes: `pve_training` (70% XP, no ELO), `ranked` (100% XP, ELO change), `free_arena` (80% XP, no ELO). XP distributed per branch proportionally to moves used.

**Sound:** Howler.js for punch sounds (BottomMenu, TrainingView) and rain ambience (RainView). Mute toggle in Profile > Account (`SoundToggle.vue`), persisted in localStorage (`isMuted`), checked via `store.getters['punch/isMuted']`

**PvP:** Real-time matchmaking via WebSocket → friend challenges (WebSocket-based, 10s timer) → spectate mode → backend matchmaking service. BottomMenu hidden on all PvP screens (matchmaking, fight, spectate). Opponent Found screen shows actual fighter skins (from `/images/skins/`).

**Friend Challenge Flow:** Player A clicks ⚔️ → `challenge_send` via WS → server checks online → `challenge_received` → Player B sees ChallengeNotification (top-of-screen, 10s auto-decline) → accept → server creates match via pvpMatchManager → `challenge_start` → both navigate to `/fight?mode=pvp&matchId=...`

**Dice (unified PvE/PvP):** Available after round 1, cooldown 3 rounds. Random effect: Heal +15HP, Adrenaline x2 ATK (1 round), Shield full block (1 round), Blind guaranteed miss (1 round), Rage -20HP instant, Crit -30HP instant. Rage/Crit can kill. Disabled in Overdrive.
- **PvE:** Player clicks dice button on screen.
- **PvP:** Server-controlled. `dice_available` → player clicks → `dice_roll` via WS → `dice_rolled` response. Rage/Crit send `oppHp` + `killed` flag. If killed → `fight_end` immediately.

**PvE Coach Advice:** Triggers once per fight from round 6 (COACH_MIN_ROUND). Fight pauses, 15s timer. 3 options: Attack (+25 priority), Defense (+25 priority), Position (+25 priority). Boost lasts 4 rounds via aiStrategy.setCoachBoost(). Coach active bar shows remaining rounds.

**PvP Coach Advice:** Same UI as PvE (3 options: Attack/Defense/Position) but 10s timer. Fight pauses for both players. Each player picks independently. Backend applies effects: `coach_attack` (+25% dmg), `coach_defense` (-30% incoming), `coach_position` (+15% dmg & -15% incoming) for 4 rounds. After choosing → "Waiting for opponent..." until both decide or timer expires. No boost if player doesn't choose.

**AI Trainer:** Claude-powered post-fight analysis (PvE and PvP). Component `AiTrainerAnalysis.vue` renders on CardFightView results screen. Sends fight data (rounds, decks, result, dice/coach/emergency usage) to `POST /v1/ai/analyze-fight` → backend calls Anthropic Claude API → returns 4-section analysis: Fight Summary, What You Did Well, What Went Wrong, Advice. Feature flag: `AI_TRAINER_ENABLED`. Graceful degradation on error. i18n keys: `fight.lblAiTrainer`, `fight.lblAiLoading`, `fight.lblAiError`.

**AI Club Reports:** Morning Report (`POST /v1/ai/morning-report`) and Premium Report (`POST /v1/ai/premium-report`) provide AI analysis of FightClub stats. Frontend: `MorningReport.vue` in `FightClubView`. Legacy `club-mode-summary` endpoint removed.

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
- `backend/src/routes/ai.js` — AI Trainer + Club Mode Summary API endpoints

---

## Key Views

| View | File | Notes |
|------|------|-------|
| Training | `TrainingView.vue` | 3D punch bag, taps, daily/social tasks, progression bar. Visual System v1.0 compliant: neutral UI overlay, AnonymousBalance for taps/XP numbers, system sans for labels, 3D not touched, XP Allocate = primary CTA |
| Move Tree | *Deleted* (`MoveTreeView.vue`) | Research moved per-agent to AgentDetailView → Moves tab (ResearchTree.vue) |
| Deck Builder | *Deleted* (`DeckBuilderView.vue`) | Deck editing via AgentDetailView deck editor modal |
| Fight | `CardFightView.vue` | Main combat (PvE + PvP), dice, coach advice, HP bars, AI Trainer (PvE results). Loading splash: HEXLASH in Anonymous pixel-font with --hex-primary + glow (matches Logo.vue style, same as index.html pre-app splash). PvP mode: no BottomMenu, no PvP badge, reduced padding. Fully migrated to --hex-* vars: HexButton for results, inline SVGs, dice/coach/victory/defeat/overdrive all use design system vars. Visual System v1.0 compliant: pink only on CTA buttons (dice, Fight Again), VICTORY/DEFEAT/DRAW + OVERDRIVE pixel-font, HP in AnonymousBalance, dice effects in characteristic colors, coach buttons in action-specific colors |
| Profile | `ProfileView.vue` | Tabs: balance, wallet, account, skins. Visual System v1.0 compliant: AnonymousBalance for numerical values, neutral header (no pink), 0-1 pink accent per tab, toggles green (success), delete btn danger |
| Ratings (League) | `RatingsView.vue` | 3 tabs: My Club, Clubs (leaderboard), Fighters (leaderboard). Default tab: My Club. URL: `/ratings/:type` (myclub/clubs/fighters). My Club tab: `MyClubTab.vue` component — redesigned clan header (avatar 64px with --hex-primary glow, name in Anonymous font, italic description, LVL badge, member count, level progress bar), stats grid (4 cards: Members/Wins/Losses/Win Rate with colored values), win rate bar, members top-5, role badges owner/deputy, action menus. No-clan state: ⚔ icon hero, CREATE/BROWSE buttons, pending invites banners, suggested clans with stats |
| Fight Club | `FightClubView.vue` | `/arena/club` (also reachable via `/arena` redirect). Agent roster, Club Level bar, Morning Report, Retirement Panel. "← Arena" switch button in header. Captain's AgentCard has primary FIGHT button (navigates to PreparationView, disabled when fighting/resting). Background: `background_arena.webp` with gradient overlay (shared visual identity with PreparationView) |
| Preparation | `PreparationView.vue` | `/arena/fight`: action row (Mode + START FIGHT + Friends buttons). Friends button is text-only (no online indicator). "← Arena" switch button in header. Visual System v1.0 compliant: single pink accent (START FIGHT), ModeSelector neutral, AnonymousBalance where needed |
| Friends | `FriendsView.vue` | Friends list, friend requests, search players. Visual System v1.0 compliant: neutral cards, online indicator hex-success, Accept=green/Decline=danger, Add friend=primary CTA, system sans |
| Matchmaking | `MatchmakingView.vue` | Real-time PvP matchmaking queue. Opponent Found shows actual fighter skins (from `/images/skins/`). No colored borders. 100dvh support. Visual System v1.0 compliant: neutral spinner in search, OPPONENT FOUND pixel-font (impact), AnonymousBalance for timer/rating/countdown, retry btn = sole pink CTA in timeout |
| Clan | `ClanView.vue` | Redesigned clan page: header with avatar (64px, --hex-primary border + glow, 12px radius), name (Anonymous font), italic description, meta row (LVL badge, member count), level progress bar (6px gradient fill), stats grid via `ClanStats.vue` (4 cards + win rate bar), owner controls. Visitor view: top-5 members (no action menu), "+ N more members", JOIN/private/full action bar. Route: `/clan/:id` (redirect from `/club/:id`). Visual System v1.0 compliant. |
| Spectate | `SpectateView.vue` | Watch live PvP fights. Visual System v1.0 compliant: 0 pink, friend side=hex-victory (green), opponent=hex-action-defense (blue), LIVE dot=hex-defeat (red) with pulse, AnonymousBalance for numbers, system sans for all text |
| RainView (Auth) | `RainView.vue` | 3D rain scene + auth forms (Login, Signup, Reset, TelegramLogin). Visual System v1.0 compliant: 3D untouched, submit btns = primary CTA per form, links neutral (white via ButtonText), errors hex-danger, InputField shared fix |
| PageView | `PageView.vue` | Static help/rules pages via v-html from i18n. Visual System v1.0 compliant: 0 full pink, spans/link-hover use hex-primary-light (PINK_DIM), white underlined links, v-html preserved for trusted i18n |
| Create Agent | `CreateAgentView.vue` | 2-step wizard: name+skin → confirm+create. Modules configured after creation in AgentDetailView edit modal |
| Agent Detail | `AgentDetailView.vue` | 4-tab agent management: Overview (stats, deck, XP, train), Moves (per-agent ResearchTree component — unlock/upgrade/allocate XP), Tactics (fight mode, aggression, dice, coach, emergency, rest), Fights (history with filter+pagination). Edit modal (name/skin/build), deck editor, delete |

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
- `BeltBadge.vue` — SVG belt badge for 33 grades + Hexmaster. Line-style: rect body, buckle, stripes. 3 sizes: sm (16×6), md (40×14), lg (120×40). Hexmaster pulse glow md/lg, static glow sm. Props: grade (0-32), isHexmaster, size. CSS vars: `--hex-belt-*`. Stripes hidden on sm. White/black enhanced outlines.
- `UserCaptainBadge.vue` — Composite badge: BeltBadge + optional captain name. Sizes xs/sm/md. Shows "—" when no captain. Used in FriendCard, PlayerSearchResult, ChallengeNotification, RatingsView Players tab, MatchmakingView.

**Navigation & Layout:**
- `Logo.vue` — header logo (Anonymous font, --hex-primary color + glow). Visual System v1.0 compliant: pixel-font for brand, subtle glow, --hex-text-primary
- `BottomMenu.vue` — bottom nav (Arena, Training, Ratings, Profile). Uses SVG background-image icons with filter-based active state. Semi-transparent bg with backdrop-blur. Hidden on PvP screens via `isPvPScreen` computed in App.vue. Visual System v1.0 compliant: line-icons, system sans for labels, active tab = single pink accent in zone
- `App.vue` header — scroll-dependent gradient uses `--hex-bg-dark`, balance in AnonymousBalance font with `--hex-text-primary`. Visual System v1.0 compliant: --hex-bg-dark, AnonymousBalance for balance, no decorative gradients

**Game Components:**
- `Info.vue` / `Error.vue` — toast notifications (text interpolation `{{ }}`, NOT v-html — XSS safe). Visual System v1.0 compliant: bg-card neutral, hex-success/hex-danger accent, text via {{ }} (XSS safe)
- `NewAchievement.vue` — achievement popup. Visual System v1.0 compliant: pixel-font title, hex-bg-card + hex-border-strong via :deep(), VBtn styled as primary. TODO: replace VModal with custom modal for dramatic 600ms animation
- `Punch3D.vue` — Three.js punching bag
- `MoveTreeCard.vue` — *Deleted* (was move row in tree)
- `MoveDetailsModal.vue` — *Deleted* (was move detail/unlock popup)
- `SoundToggle.vue` — sound mute/unmute toggle (Profile > Account). Visual System v1.0 compliant: success green on-state, no pink
- `HPBar.vue` — fight health bar. Visual System v1.0 compliant: status colors (success/warning/danger), AnonymousBalance HP numbers, no pink
- `ModeSelector.vue` — arena mode selector (PvE/PvP), compact button with dropdown, system sans-serif font. Visual System v1.0 compliant: neutral compact btn (no mode-specific colors), neutral dropdown (no glow), system sans labels, touch-targets ≥44px
- `ModuleBuilder.vue` — fighter module slots (3 slots: primary/secondary/tertiary), build preview with AI description, emergency protocol selector, archetype selection modal. Visual System v1.0 compliant: neutral slots (no pink), archetype icons via `<img>` (no dynamic arch colors yet — TODO: inline SVG for var(--hex-arch-*)), system sans, no glow
- `FriendCard.vue` — friend display card
- `FriendRequestCard.vue` — incoming friend request
- `ChallengeNotification.vue` — Top-of-screen challenge notification (global, z-index: 9999, 10s timer). Visual System v1.0 compliant: primary border-bottom accent, slide-down 300ms, name via {{ }} (XSS safe)
- `ClubInviteNotification.vue` — Top-of-screen club invitation notification (global, z-index: 9998, 30s timer, accept/decline via WS)
- `PlayerSearchResult.vue` — player search result item
- `XPAllocationModal.vue` — *Deleted* (XP allocation now via ResearchTree +10 XP buttons)
- `PvPStatsCard.vue` — PvP statistics display (league, rating, progress, wins/losses/winrate). Shown in Fighters tab of RatingsView. Visual System v1.0 compliant: 0 pink, league colors preserved (brand identity), AnonymousBalance for numbers, system sans for labels
- `AiTrainerAnalysis.vue` — Claude-powered post-fight analysis (PvE + PvP, results screen). Visual System v1.0 compliant: neutral card, system sans, no pink, no Anonymous font
- `ProfileWallet.vue` — Wallet page: uses @wagmi/vue useAccount(), shows ConnectWallet + GameBalanceCard + HexCard placeholder. BuyTokens removed from render, WalletInfo deleted
- `ConnectWallet.vue` — Full wallet modal: Teleport modal with connector list (icons, dedup, rename Injected→Browser Wallet), connecting spinner, connected state (short address + chain + disconnect). Uses @wagmi/vue useConnect/useDisconnect/useConnectors. z-index 9000, Escape/overlay close, hex-fade/hex-slide-up transitions. 360px responsive
- `WalletInfo.vue` — **Deleted** (Дорога 1 ТЗ #18b) — functionality moved into ConnectWallet connected state
- `BuyTokens.vue` — Token purchase modal. **Temporarily disabled** — not rendered in ProfileWallet, file preserved for Phase 2 (Base contract)
- `GameBalanceCard.vue` — Game balance display with withdraw button (shows "after listing" message)
- `ReferralModal.vue` — Referral program modal: QR code (qrcode lib), copy link (clipboard API), share (Web Share API with fallback), referral stats + list. Opens from ProfileView button
- `ClanPageContent.vue` — Shared clan page content component (header, stats, tabs Members/Activity/Settings, leaderboard with action menu, confirm modals, invite modal). Used by ClanView (member view) and MyClubTab (has-clan state). Props: clubData, clubId. Events: club-left, club-deleted
- `ClanActivityFeed.vue` — Activity feed for clan page. Real data from `GET /v1/club/:clubId/events`. Events grouped by day, color-coded dots (fight_win/lose/draw, member_join/leave/kick, role_change, level_up). Props: clubId. Cursor pagination via "Load more" button. Vuex state in clubState (clanEvents, clanEventsLoading, clanEventsHasMore)

---

## API (backend)

Base: `/v1/`

| Route | File | Purpose |
|-------|------|---------|
| `/auth` | auth.js | login, signup, reset, telegram. Rate limited: login 5/15min, register 3/hr, telegram 10/15min. Register + telegram accept `referralCode` — rewards both users +500 taps |
| `/user` | user.js | profile, stats, avatar, achievements, referrals. Skin validated via regex. Delete uses $transaction with cascade. GET /referrals returns referral stats + list |
| `/clan` | clan.js | create/edit/delete clan, avatar, members, balance, roles (set-role, transfer-ownership, kick, invite), level info. maxMembers=50, roles: owner/deputy/member. DELETE / dissolves clan (owner-only, clears all members + invites). Invite: DB-persisted (48h), GET /invites, POST /invite/respond. Events: GET /:clanId/events (members only, cursor pagination). Frontend uses `/v1/clan/*` exclusively. |
| `/task` | task.js | daily + social tasks |
| `/file` | file.js | avatar/file upload |
| `/fight` | fight.js | fight creation, results, history |
| `/stats` | stats.js | player and game statistics |
| `/friends` | friends.js | friends list, requests, search players |
| `/ai` | ai.js | AI Trainer fight analysis (POST /analyze-fight), build description (POST /build-description), morning report (POST /morning-report), premium report (POST /premium-report) |
| `/agent` | agent.js | 18 endpoints: CRUD agents, tactics, fight history, Research Gate (available-moves, learn-move, deck, research, allocate-xp), PvE training (train), auto-fight toggle/status, rankings, fight-club level |

Auth guard: JWT Bearer token via `middleware/auth.js`
Telegram auth: HMAC-SHA256 signature validation via `validateTelegramPayload()` in auth.js
Password reset: Returns 501 (not implemented) — no fake success

### WebSocket Protocol

**Auth:** JWT передаётся через WebSocket protocol header в формате `Bearer_<token>` (не query param — избегаем утечки токена в access-логи). Валидируется до регистрации клиента. Без валидного токена — connection закрыт с кодом 4001.

**Heartbeat:** Сервер ping каждые `WS_PING_INTERVAL_MS` (30s), клиент должен ответить pong в течение `WS_PONG_TIMEOUT_MS` (10s). Без pong — сервер закрывает соединение.

**Reconnect:** Клиент использует exponential backoff (10s → 20s → 40s → ... → max 300s, ±20% jitter, reset on success). При reconnect старый socket помечается `_replaced` (close handler не триггерит PvP disconnect), новый socket ре-биндится к активному матчу если есть.

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
| — | `ErrorMsg` | Error response |

---

## Database Models (Prisma/PostgreSQL)

User, Clan, ClanInvite, ClanEvent, FightClub, Achievement, UserAchievement, SocialTask, UserSocialTask, DailyTask, UserDailyTask, Fight, PunchInfo, FriendRequest, Friendship, Agent, AgentTactics, AgentProgression, AgentFightLog

**Club system fields:** User.clubRole (`owner`/`deputy`/`member`/null), Club.maxMembers (default 20, grows with level), Club.maxAgents (default 2, grows with level: 1→2, 2→3, 3→4, 4→5, 5+→6), Club.legendSkin/legendArchetype/legendBuff (retired fighter legend system), Club.battles/wins (auto-incremented on fight save). Max 3 deputies per club. Owner can set roles, transfer ownership, kick anyone, invite friends, dissolve club. Deputies can kick members only, invite friends. Club creation costs `COST_CREATE_CLUB` (10000) taps — deducted from `User.totalTaps` in $transaction. Club name: 3-30 chars, unicode letters/digits/spaces (`\p{L}\p{N}`), no emoji. Achievements: `PAPER_STREET` on create, `PROJECT_MAYHEM` on join (idempotent via `awardAchievement()` in helpers.js).

**Club invite system:** `ClubInvite` model — `id`, `clubId` → Club, `inviterId` → User, `inviteeId` → User, `status` (pending/accepted/declined/expired), `createdAt`, `expiresAt` (48h). Persisted in DB + real-time WS notification. Endpoints: `POST /club/invite` (creates DB record + WS), `GET /club/invites` (pending for current user), `POST /club/invite/respond` (accept/decline by inviteId). Auto-expire on query (no cron). Frontend: `ClubInviteNotification.vue` loads pending invites on mount, shows queue one by one.

**Clan event system:** `ClanEvent` model — `id` (uuid), `clubId` → Club (cascade delete), `type` (String), `actorId` (String?), `targetId` (String?), `data` (Json?), `createdAt`. Index on `[clubId, createdAt]`. Types: `fight_win`, `fight_lose`, `fight_draw`, `member_join`, `member_leave`, `member_kick`, `role_change`, `level_up`. Helper: `createClanEvent()` in `backend/src/utils/clanEvents.js` — silent try/catch, fire-and-forget. Events recorded in: fight.js (PvE), pvpCombatEngine.js (PvP both players), club.js (join/leave/kick/set-role, invite accept), clanLevel.js (level_up). API: `GET /v1/club/:clubId/events?limit=30&before=timestamp` — members only, cursor pagination, includes actor/target `{id, login, skin}`.

**Referral system fields:** User.referredBy (String?, login of referrer), User.invitedUsers (Int, referral count). On register/telegram with referralCode: both users get +500 taps (REFERRAL_REWARD_TAPS), invitedUsers incremented. Self-referral and non-existent referrer silently ignored.

**FightClub (personal agent container):** `FightClub` model — 1:1 with User (ownerId @unique, cascade delete). Fields: level (1-10), xp, maxAgents (2-6, grows with level), legendSkin/legendArchetype/legendBuff (from fighter retirement). Auto-created on first access via `getOrCreateFightClub()`. Uses `CLAN_LEVEL_CONFIG` from config.js for level thresholds.

**Club Mode Agent system:** 4 new models for autonomous clan fighters.
- `Agent` — clan fighter unit. Fields: name (2-20 chars), skin, 3 modules (primaryModule/secondaryModule/tertiaryModule — one of 6 archetypes each, nullable), elo (default 1000), wins/losses/draws/totalFights, xp, level, status (idle|fighting|resting), autoFight (boolean), lastFightAt/nextFightAt. Relations: FightClub (cascade), User owner (cascade). Indexes: fightClubId, ownerId, elo, status.
- `AgentTactics` — 1:1 with Agent. Behavior settings: aggression (cautious|balanced|aggressive), dicePolicy (always|smart|never), coachPreference (attack|defense|position|auto), emergencyThreshold (30|20|0), restPeriod (ms: 600000|1800000|3600000). Cascade delete.
- `AgentProgression` — 1:1 with Agent. XP per branch (speedXp/powerXp/techniqueXp), moves (JSON [{moveId, level}]), deck (JSON [moveId...] 4-8 items). Cascade delete.
- `AgentFightLog` — N:1 with Agent. Fight history: mode (pve_training|ranked|free_arena), result (victory|defeat|draw), opponent info, rounds/HP/xpEarned/eloChange, fightData (full JSON for AI analysis). Indexes: agentId, createdAt, mode. Cascade delete.
- Validation (app-level, not Prisma): name 2-20 chars no special chars, skin regex, modules from 6 archetypes, agents count ≤ club.maxAgents, deck 4-8 moveId.
- Migration: `20260402000000_add_club_mode_agents`

**Seed data:** 16 achievements (NEWBIE, CONNECTED_FIGHTER, REGULAR_FIGHTER, BATTLE_VETERAN, FIGHT_MASTER, COACH, RECRUITER, PROJECT_MAYHEM, MEATLOAF, TYLER, EXPERT, LUCKY_ONE, BOB, PAPER_STREET, MEETING_PARTICIPANT, GOLDEN_RULE) + social/daily tasks (en/ru)

---

## Build & Deploy

- **Frontend:** Vite 7 + JS obfuscation + Brotli + image optimization (mozjpeg/pngquant/webp) + terser (drops console). Compile-time defines `__API_SERVER_URL__`, `__WEB_SOCKET_URL__`, `__IS_PROD__`, `__MOCK_MODE__`, `__APP_VERSION__` (NOT `import.meta.env`).
- **Deploy frontend:** Vercel (`vercel.json` SPA rewrites) **or** Docker+Nginx (`Dockerfile` multi-stage Node→Nginx, `nginx.prod.conf`, `nginx.test.conf`). Nginx serves static only (NOT reverse proxy) — backend runs separately at `api.hexlash.com` / `apitest.hexlash.com`.
- **Deploy backend:** `backend/Dockerfile` (Node 20 + Prisma). Railway or VPS.
- **WebSocket:** Authenticated via JWT protocol header, same HTTP server as Express (shared port)
- **CI/CD:** GitHub Actions GitOps (`.github/workflows/gitops.yaml`) — push to `test`/`main` → Docker build → push Docker Hub → update K8s deployment YAML in DevOps repo
- **Nginx ports:** 8080 (HTTP→HTTPS redirect), 8443 (SSL). Certs at `/etc/certs/hexlash.com.*`

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

**v-html policy:** Only allowed for trusted i18n content (PageView, ClanView, Getstarted). Forbidden for user/error data.

---

## FightClub Naming Policy

- **Internal (code, Prisma, Vuex, files):** `FightClub` / `fightClub` / `fightClubId`. Единый префикс, исключает путаницу с Clan (social).
- **User-facing:** "Fight Club" — имя собственное, английскими буквами во всех 11 локалях (как "iPhone").
- **Technical mode label:** "CLUB MODE" — только рядом с PvE/PvP/Auto как обозначение режима.
- **Route path:** `/arena/club` — исторически, не меняется.
- **Route name:** `ArenaFightClub`.
- **Vuex state:** `fightClubLevel`, `fightClubLevelLoading`, `fightClubProgress`, mutations `SET_FIGHT_CLUB_LEVEL*`, action `fetchFightClubLevel`.
- **Prisma:** `FightClub` model, `fightClubId` FK on Agent.
- **FightClub ≠ Clan.** FightClub = Fight Club (агенты, ростер, `/arena/club`). Clan = социальная группа игроков (`/clan/:id`).

---

## Branch (Git)

Development branch: `visual-v2` (от `main`) — визуальная миграция v24, см. секцию `## v2 Migration`.
Club Mode + Phase 1 (Captain, Belt System, User→Fighter migration, Morning Report, Retirement, Ranked, Free Arena, NFT Agents): **COMPLETE** — залито в `main`.
Road 1 (Neon Discipline visual migration): **COMPLETE**. See `/docs/road1-final-report.md` and `/docs/road2-parking-list.md`.

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
- **P3-3:** `overdrive_start` UI — shows "OVERDRIVE" event title with `--hex-warning` glow + 2s display, CSS class `event-overdrive`
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

### Research Gate — Per-Agent Research Tree (ТЗ-04, refactored) — ✅ COMPLETE

Research tree is now per-agent (AgentProgression.research) instead of per-account (User.progression.moves). Each agent has its own research tree that gates what moves it can learn. TAPS and freeXP remain on User. Branch XP is per-agent only (User.progression.branchExp is legacy, no longer written to).

**AgentProgression.research format:** `{ moveId: { unlocked: bool, level: 1-5 } }`

**Service (`services/researchGateService.js`):**
- `MOVE_BRANCHES` — backend copy of move→branch mapping (18 moves)
- `BRANCH_MOVES` — ordered moves per branch (for gating: prev move at Lv3+ to unlock next)
- `LEVEL_UP_REQUIREMENTS` — taps + exp per research level-up: `{2: {taps:100, exp:50}, ...5: {taps:500, exp:350}}`
- `UNLOCK_REQUIREMENTS` — taps + exp per research unlock (key=prev move level): `{3: {taps:300, exp:150}, ...5: {taps:200, exp:100}}`
- `LEVEL_UP_XP_COST` — legacy XP-only costs (used by learn-move)
- `ensureResearch(agentId, userId)` — lazy migration: captain with empty research gets User.progression.moves
- `getAgentResearch(agentId)` — read agent's research tree
- `canAgentLearnMove(agentId, moveId, targetLevel)` — gate by agent's own research level
- `validateAgentDeck(agentId, deck, agentMoves)` — validate deck against agent's research
- `getAvailableMovesForAgent(agentId)` — all 18 moves with research + learn status + costs
- `calculateResearchCost(action, moveId, research)` — cost calculator
- `executeResearchAction(agentId, userId, action, moveId)` — transactional unlock/upgrade (deducts User.totalTaps + Agent branchXp)

**Endpoints in agent.js:**
- `GET /v1/agent/:id/available-moves` — per-agent research tree (researchLevel, locked, unlockable, learnedLevel, researchCost, learnXpCost)
- `POST /v1/agent/:id/learn-move` — agent learns move (gated by agent research, deducts agent branch XP)
- `PUT /v1/agent/:id/deck` — validate deck against agent's research
- `POST /v1/agent/:id/research` — **new** unlock/upgrade move in research tree (deducts User.totalTaps + Agent branchXp, $transaction)
- `POST /v1/agent/:id/allocate-xp` — **new** transfer User.progression.freeXP → Agent branchXp ($transaction)

**Lazy migration:** Captain with empty research → copies User.progression.moves to AgentProgression.research + branchExp to agent xp (if 0). Triggered on GET /agent/:id, GET /available-moves, POST /research.

**PUT /user/progression:** Strips moves/branchExp from incoming data. Legacy values preserved in DB but no longer written to.

**Research Gate rules (per-agent):**
- First move in branch: free unlock (no prerequisite)
- Subsequent moves: previous move at Lv3+ required to unlock
- Unlock cost depends on prerequisite level (higher = cheaper)
- Research level caps agent's learn level
- Agent branch XP used for both research and learning

**Files changed:**
- `backend/prisma/schema.prisma` — `research` Json field on AgentProgression
- `backend/prisma/migrations/20260414000000_add_agent_research/` — SQL migration
- `backend/src/services/researchGateService.js` — full rewrite for per-agent
- `backend/src/routes/agent.js` — 2 new endpoints + modified existing
- `backend/src/routes/user.js` — PUT /progression strips research data
- `backend/src/services/userMigrationService.js` — includes research in Fighter #1
- `backend/src/utils/migrationHelpers.js` — `transformResearch()` helper

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
- `GET /v1/agent/rankings` — leaderboard sorted by isHexmaster DESC, belt DESC, qualifiedWins DESC. Min 5 fights to appear. Includes owner info + belt/qualifiedWins/isHexmaster. Pagination.

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

- `src/core/state/modules/agentState.js` — Vuex module (14th): agents CRUD, Fight Club level (`fightClubLevel`, `SET_FIGHT_CLUB_LEVEL`, `fetchFightClubLevel`), detail actions (fetch/update/train/moves/deck/tactics/fights)
- `src/components/club/` — AgentCard (captain has FIGHT button → PreparationView, disabled when fighting/resting), ClubLevelBar, AgentRoster, MorningReport, SkinPicker, ArchetypeSelector
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

**Legend buff in combat:** Each FightClub can have one Legend (retired fighter) with passive buff `{ xpBonus, dmgBonus, archetype }`. Buff applied separately per fighter:
- **PvE** (`_executeFight`): player gets their club's buff as `legendBuff1`, bot gets `null`
- **Agent vs Agent** (`_executeAgentVsAgentFight`): both agents get their own FightClub's buff via `Promise.all` → `legendBuff1` / `legendBuff2`
- **Engine** (`simulateAgentFight`): accepts `options.legendBuff1` + `options.legendBuff2`, applies each only to its fighter's `legendDmgMult`
- **Archetype synergy:** if fighter's primaryModule === legend archetype → dmgBonus and xpBonus × 1.5
- **XP bonus:** applied in service layer (not engine) — multiplies earned XP by `(1 + xpBonus)` with archetype synergy

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
- `src/components/ratings/AgentLeaderboard.vue` — full leaderboard with BeltBadge, "Your Agents" section, pagination. LeagueBadge/leagues.js deleted — Belt System replaced League System

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

### Refactor: Decouple Club Mode from Clan (ТЗ-R1) — ✅ COMPLETE

Club Mode (agents) now independent from Clan. Personal FightClub per user, auto-created.

**New Prisma model `FightClub`:** 1:1 with User. Fields: level, xp, maxAgents, legendSkin/Archetype/Buff. Auto-created on first access.

**Agent.clubId → Agent.fightClubId:** Agents belong to FightClub, not Club.

**Club model cleaned:** Removed maxAgents, legendSkin, legendArchetype, legendBuff, agents relation.

**New service `fightClubService.js`:** getOrCreateFightClub, addFightClubXp, getFightClubLegendBuff, getFightXpReward, getLevelInfo.

**New view `FightClubView.vue`:** All Club Mode UI (level bar, morning report, retirement, roster) moved from ClanPageContent to standalone `/arena/club` route (`/arena` redirects here, `/fight-club` also redirects here).

**Files changed (16):**
- `backend/prisma/schema.prisma` — FightClub model, Agent.fightClubId, Club cleaned
- `backend/prisma/migrations/20260404000000_refactor_fight_club/` — data migration SQL
- `backend/src/services/fightClubService.js` — **new** FightClub service
- `backend/src/services/agentFightService.js` — club→fightClub references
- `backend/src/services/retirementService.js` — Club→FightClub for legend
- `backend/src/services/morningReportService.js` — fightClubId queries
- `backend/src/services/metaAnalysisService.js` — FightClub ranking
- `backend/src/routes/agent.js` — getOrCreateFightClub, fightClubId, GET /agent/fight-club
- `backend/src/routes/ai.js` — fightClub for reports
- `backend/src/routes/club.js` — removed GET /:id/level (moved to agent)
- `backend/src/routes/user.js` — FightClub for retirement
- `src/views/FightClubView.vue` — **new** standalone Club Mode view
- `src/core/state/modules/agentState.js` — fetchFightClubLevel
- `src/components/fragments/club/ClanPageContent.vue` — removed Club Mode UI
- `src/router/index.js` — /fight-club route

### Road 1 — Complete

**Status:** Finished 2026-04-08
**Scope:** Визуальная миграция всех экранов к дизайн-системе Neon Discipline.
**Duration:** 53 коммитов, 2026-03-15 — 2026-04-08

**Финальные документы:**
- `/docs/road1-final-report.md` — полный отчёт с статистикой
- `/docs/road2-parking-list.md` — парковочный список для Phase 1

**Инварианты подтверждены:**
- 0 legacy `--pink`/`--dark` вне PrivacyView (документированное исключение)
- i18n: 0 изменений в locale файлах от Road 1 коммитов (чисто визуальная миграция)
- backend: 0 изменений в `/backend/` от Road 1 коммитов
- CLAUDE.md <> код <> Visual System PDF v1.1 синхронизированы

**Следующее ТЗ:** Phase 1 — Club Mode Foundation (см. секцию Phase 1 ниже)

---

## Club Mode (Phase 1 in progress)

Prototype Club Mode — система автономных бойцов (агентов) под управлением игрока. ~6000 строк кода, 109 коммитов впереди main, не залит. Полностью задокументирован после deepdive серии #1a-#1i (9 апреля 2026).

### Словарь Phase 1

| Концепция | В коде (Prisma/backend) | В UI и i18n | Что это |
|-----------|------------------------|-------------|---------|
| Социальная клановая система | Club → Clan (after rename) | Clan | Объединение игроков (существующая система) |
| Команда бойцов одного игрока | FightClub (остаётся) | Club | Ядро Phase 1 — персональный контейнер |
| Один боец | Agent | Fighter | Сущность которая дерётся |
| Лицо клуба для PvP | Agent.isCaptain (новое) | Captain | Один Agent с флагом, идёт в PvP |

### Архитектура

**Prisma модели (5+1):** FightClub (1:1 User), Agent (N:1 FightClub), AgentTactics (1:1 Agent), AgentProgression (1:1 Agent), AgentFightLog (N:1 Agent). Плюс ClanEvent для социальной системы.

**API:** 16 эндпоинтов на `/v1/agent/*` — CRUD, tactics, fight history, Research Gate (available-moves, learn-move, deck), PvE training, auto-fight, rankings, fight-club level. Плюс AI эндпоинты: morning-report, premium-report в `/v1/ai/*`.

**Backend сервисы (6):** agentCombatEngine (643 строки, чистая sync функция), agentFightService (366 строк, orchestrator), agentScheduler (204 строки, 30s tick), eloService (31 строка), rankedMatchmaker (149 строк), fightClubService (111 строк). Плюс: retirementService, morningReportService, metaAnalysisService, nftService.

**Frontend:** 3 view (FightClubView 106, CreateAgentView 329, AgentDetailView 563 строк), 7 компонентов в `components/club/`, agentState Vuex модуль (202 строки, 14 actions, 7 getters).

### Agent Combat Engine

Гибрид PvE (action-based: attack/defense/position с архетипными приоритетами) и PvP (passive archetype modifiers: dmgBonus, dodge, crit из ARCHETYPE_MODIFIERS). Чистая синхронная функция без Prisma/WebSocket. Тактика (aggression, dicePolicy, coachPreference, emergencyThreshold) управляет решениями AI. Не унифицируем с PvE/PvP combat engines — control flow принципиально разный.

### Lifecycle боя

Scheduler tick (30s) → recoverStuck → wakeResting → getReady → matchmaker (ranked/free_arena пары) → fightService (`_executeFight` / `_executeAgentVsAgentFight`) → combat engine simulation → $transaction (Agent stats + AgentProgression XP + AgentFightLog + optional ELO) → status transitions (fighting → idle → resting) → club XP (fire-and-forget).

### Две параллельные системы прогрессии

- **User progression** — школа тренера. Vuex `progressionState`, frontend-driven (taps → freeXP → allocate → branchExp → unlock/levelup moves). Сохраняется в `User.progression` Json blob через `PUT /user/progression`. Формат moves: `{ moveId: { level, unlocked } }`.
- **Agent progression** — ученики. `AgentProgression` Prisma table, backend-validated. Branch XP зарабатывается в боях автоматически (`distributeXpByBranch`). Формат moves: `[{ moveId, level }]`.
- **Research Gate** соединяет: Agent не может выучить мув, не разлоченный игроком. Max level агента ≤ level мува игрока. Работающая механика с полным циклом (available-moves → learn-move → validate-deck).
- **НЕ выпиливаем** User progression в Phase 1 — обе системы остаются параллельно.

### x402 / Premium

Feature flag `X402_ENABLED=false` на проде. On-chain verification = TODO (принимает любой tx hash). Premium report = free preview.

### Известные баги

52 пункта в `docs/phase1-parking-list.md`. Критичные: ~~legend buff на обоих бойцах (#1)~~ **FIXED**, race condition scheduler vs train (#2), /user/progression доверяет фронтенду (#3). 11 из 52 фиксятся в Phase 1.

---

## Phase 1 — Club Mode Foundation

**Цель:** Переход от "один боец" к "клуб бойцов". Игрок становится тренером. Текущая прогрессия User мигрирует в Fighter №1 (Agent).

### Архитектурные решения (зафиксированы 9 апреля 2026)

1. **freeXP миграция:** `User.freeXP` делится поровну на 3 ветки Agent при миграции в Fighter №1. `floor()` округление, остаток теряется (max 2 XP).
2. **Deck size unification:** min deck = 3 для всех систем (User, Agent, PvP). Backend: `MIN_AGENT_DECK_SIZE` 4→3. Закрывает несоответствие трёх разных policies.
3. **FightClub naming:** FightClub остаётся FightClub в коде. В UI и i18n — "Club". Только Prisma `Club → Clan` rename для социальной системы. Phase 2 может сделать FightClub→Club отдельно.
4. **Captain real-time:** polling в AgentDetailView каждые 15 сек, с pause при `document.hidden` (Page Visibility API). WebSocket push отложен на Phase 2.
5. **Belt System семантика:** count-based с фильтром качества. Победы над равным или выше поясом копятся на нашивку. 10 поясов × 3 нашивки + Hexmaster = 31 ступень. Поражения не штрафуют. Точные числа добиваются в #P1-belt-1.

### Карта ТЗ Phase 1

| # | ТЗ | Описание | Зависимости |
|---|-----|----------|-------------|
| P1-doc | Документация | Текущий ТЗ — CLAUDE.md + parking list | — |
| P1-design-migration | Дизайн-документ миграции | БЛОКИРУЕТ всё | После doc |
| P1-rename-1 | Prisma migration: Club→Clan + ClubInvite→ClanInvite | | После design |
| P1-rename-2 | Backend rename: routes, services, config | | После rename-1 |
| P1-rename-3a | Backend alias /v1/club + WS clubId backward-compat | ✅ DONE | После rename-2 |
| P1-rename-3b | Frontend core: Vuex clan/, clanService, clanRepository, ClanModel, dispatches | ✅ DONE | После rename-3a |
| P1-rename-3c | Frontend UI: .vue files, dirs, props, CSS, router /clan/:id, template bindings | ✅ DONE | После rename-3b |
| P1-rename-4 | i18n split club:→clan:+club: (120 Clan keys × 11 locales, call-sites) | ✅ DONE | После rename-3c |
| P1-cleanup | Удаление мёртвого кода (fightStylePreview, nftMintService, HexlashAgents.sol+ABI, clubLevelService.addClubXp) | | После rename-4 |
| P1-club-name | Add FightClub.name поле + миграция + default из User.login | | После cleanup |
| P1-fix-legend | Фикс legend buff (раздельно f1/f2 в engine) | ✅ DONE | До belt-2 |
| P1-belt-1 | Belt data model + beltService | | После club-name |
| P1-belt-2 | Замена ELO в core gameplay | | После belt-1 |
| P1-belt-3 | BeltBadge frontend + замена ELO display | | После belt-2 |
| P1-belt-4a | Замена ELO→Belt в AI services (механическая) | | После belt-2 |
| P1-belt-4b | Redesign AI prompts под Belt semantics | | После belt-4a |
| P1-migration | Миграция User.progression → Fighter №1 + hide retirement UI | ✅ DONE | После belt-1 |
| P1-captain-1 | Captain как поле + базовая логика + создание из Fighter №1 | ✅ DONE | После migration |
| P1-captain-2 | Adapt Arena flow под Captain | ✅ DONE | После captain-1 |
| P1-captain-3 | Adapt Profile/Ratings под Captain | ✅ DONE | Параллельно с captain-2 |

### P1-migration — User → Fighter #1 — ✅ COMPLETE

Lazy per-user migration on `GET /v1/user/me`. Creates Agent "Fighter #1" from User.progression data.

**Service:** `backend/src/services/userMigrationService.js` — `migrateUserToFighter(userId)`
**Helpers:** `backend/src/utils/migrationHelpers.js` — `transformMoves`, `extractModules`, `calculateBranchXp`
**Trigger:** `GET /v1/user/me` (non-blocking try/catch, failure doesn't break `/me`)
**Feature flag:** `MIGRATION_ENABLED` env var (default true)
**Backfill:** `backend/scripts/migrate-all-users.js` — manual prod rollout tool

**What migrates:**
- `User.progression.moves` (object) → `AgentProgression.moves` (array) — filter unlocked + level > 0
- `User.progression.branchExp` + `floor(freeXP/3)` → `AgentProgression.speedXp/powerXp/techniqueXp`
- `User.progression.playerModules[0,1,2]` → `Agent.primaryModule/secondaryModule/tertiaryModule`
- `User.deck` → `AgentProgression.deck`
- `User.skin` → `Agent.skin`

**What does NOT migrate:** wins/losses/draws (belt starts at 0), ELO (starts at 1000).

**Files changed:**
- `backend/src/services/userMigrationService.js` — **new**
- `backend/src/utils/migrationHelpers.js` — **new**
- `backend/src/routes/user.js` — trigger in `/me`
- `backend/src/config.js` — `MIGRATION_ENABLED`
- `backend/tests/userMigrationService.test.js` — **new** (14 tests)
- `backend/scripts/migrate-all-users.js` — **new**

### i18n политика Phase 1

9 локалей (de, es, fr, pt, ar, hi, ja, ko, zh) находятся в English fallback для Club Mode подсекций (134 ключа). Phase 1 ТЗ добавляют новые ключи обязательно в en + ru, остальные 9 = English fallback. Это соответствует существующей практике Club Mode раздела.

### Парковочный список

52 пункта долгов в `docs/phase1-parking-list.md`. 11 фиксятся в Phase 1, 41 — в Дороге 2 после deploy.

---

## v2 Migration

Визуальная миграция на концепцию прототипа `docs/visual-migration/hexlash_v24.html`. Живёт параллельно старому визуалу через feature flag `/v2`. Источник правды по миграции — `docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md`. Ветка разработки — `visual-v2` от `main`.

### Эпик 1 — Foundation (✅ COMPLETE)

Каркас второй версии визуала. Пользователь открывает `/v2` → пустая 3D-комната с туманом + film grain / scanlines / vignette + маркер «/v2 works». Старый `/` продолжает работать без изменений. Ничего из старого кода не удалено.

### Three.js

Project Three.js version: r167 (from `package.json` — `three: ^0.167.1`). Прототип написан под r128 (CDN). Разрыв 39 версий зафиксирован как риск на Эпик 2+ (makeFighterLowPoly, геометрии ринга). В Эпике 1 используется только базовый API (WebGLRenderer, Scene, Fog, PerspectiveCamera, AmbientLight, HemisphereLight, BoxGeometry, PlaneGeometry, MeshStandardMaterial, setAnimationLoop) — несовместимостей не выявлено.

### Feature flag /v2

- В `src/router/index.js` добавлен массив `v2Routes`: родитель `/v2` → `AppV2.vue`, дочерний index-роут `''` → `PitViewV2.vue`. Все будущие v2-роуты — дети `/v2/*`.
- В `src/App.vue` добавлен computed `isV2Route` (`route.path.startsWith('/v2')`). Под `v-if="!isV2Route"` скрыты 9 блоков старого UI: `<header>` (Logo + balance), `<Info>`, `<Error>`, `<NoConnection>`, `<NewAchievement>`, `<ChallengeNotification>`, `<ClanInviteNotification>`, `<footer>` (BottomMenu).
- `<main class="content">` не трогается — через него `<RouterView>` монтирует `AppV2`. `.app-v2` сам `position: fixed; inset: 0` — не зависит от `<main>`.
- Auth-guard v2-роутов не трогает (не в `protectedRoutes`).

### Структура

```
/src
  AppV2.vue                         — root для /v2/*. Монтирует CanvasLayer + <router-view> + GlobalOverlays.
                                      Импортирует hexlash-v24.css (только здесь).
  scene/                            — 3D-слой, единый для всех будущих сцен
    CanvasLayer.vue                 — Three.js canvas + renderer + resize/cleanup.
                                      В Эпике 1 регистрирует сцену 'empty' (пол + 4 стены + свет + fog).
    sceneRegistry.js                — Map<sceneId, {scene, camera, onEnter?, onLeave?, tick?}>.
                                      API: registerScene, activateScene, getActiveScene, tickAll.
    renderLoop.js                   — единый tick через THREE.Clock + setAnimationLoop.
                                      API: startRenderLoop(renderer, THREE), stopRenderLoop.
  views-v2/
    PitViewV2.vue                   — тестовый HUD с маркером «/v2 works». В Эпике 2 заменится реальным HUD Pit.
  components/hud/common/
    GlobalOverlays.vue              — три div'а: .grain / .scanlines / .vignette
  styles/
    hexlash-v24.css                 — entry point, импортирует v24/tokens.css и v24/effects.css
    v24/
      tokens.css                    — @import Google Fonts (Archivo Black, Space Grotesk, JetBrains Mono) +
                                      CSS-переменные (--hex-primary, --bg-deep, --bg-panel, --text-dim,
                                      --text-mid, --font-display, --font-body, --font-mono) scoped под .app-v2
      effects.css                   — .app-v2 .grain (SVG fractal noise, z-index 200) /
                                      .scanlines (z-index 160) / .vignette (z-index 150).
                                      Все — pointer-events: none, клики проходят сквозь.
```

### Известные расхождения с ТЗ (зафиксированы в Эпике 1)

- **Z-index порядок.** ТЗ предписывал `grain < scanlines < vignette < UI`, прототип реально использует `grain (200) > scanlines (160) > vignette (150) > HUD (50)`. Решение подтверждено пользователем: следуем прототипу.
- **Скрытие старого UI на /v2.** ТЗ Шаг 3 упоминал 7 блоков. По факту скрыто 9 (добавлены `NoConnection` и `NewAchievement` — они глобальные overlay'ы, пересекаются с новым HUD). Подтверждено пользователем.
- **Prod-билд vs dev.** Между Шагами 3–5 prod-сборка падала: (а) `import('/src/AppV2.vue')` в роутере — Rollup не резолвит абсолютный слэш-путь, заменено на `@/AppV2.vue`; (б) `defineAsyncComponent(() => import('@/scene/CanvasLayer.vue'))` в `AppV2.vue` — Rollup статически разбирает граф динамических импортов, потребовал файл на момент билда. Временный пустой стаб создан отдельным коммитом (`epic1: fix — stub CanvasLayer to unblock prod build`), заменён полноценным renderer-ом в Шаге 6. Правило на остаток миграции: `npm run build` локально перед каждым коммитом.

---

### Эпик 2 — Pit Hub Scene (✅ COMPLETE)

Завершён 2026-04-19. Визуально подтверждён пользователем на Vercel preview. Полный отчёт — `docs/visual-migration/EPIC2_FINAL_REPORT.md`.

**Что видит пользователь на `/v2`:**
- Октагональная бетонная комната с лучами, лампами, толпой, ground fog.
- В центре — восьмиугольный ринг (платформа + 8 стоек + 3 уровня канатов + клетка).
- Два бойца в ринге: Warden (коренастый, золотой glow) и Predator (жилистый, розовый glow), idle-анимация (дыхание / sway / fist bob) без drift.
- Вокруг ринга 6 интерактивных объектов: heavy bag, CRT terminal с блинкающим курсором, «+» plinth, scoreboard, clan banner, shop locker.
- Orbit-камера: drag по горизонтали, wheel zoom, idle auto-drift, высота и lookY зависят от zoom.
- Hover на любой из 8 кликабельных целей → scale 1.04 + cursor pointer + WorldHint ярлык под курсором.
- Click (drag < 5px) → PhModal «coming soon» с kicker/title/desc из словаря.
- TopBar: Gold / Energy / ELO карточки слева, «THE PIT» центр, аватар `YV` справа (кликабелен).
- Film grain / scanlines / vignette из Эпика 1 поверх всего.

### Структура (после Эпика 2)

```
/src
  AppV2.vue                         — root для /v2/*. Монтирует CanvasLayer + <router-view> + GlobalOverlays.
  scene/
    CanvasLayer.vue                 — Three.js renderer + resize/cleanup. Создаёт picker, pointermove/down/up
                                      listeners, пишет в useHoverState / pickClick при валидном клике.
    sceneRegistry.js                — Map<sceneId, {scene, camera, onEnter?, onLeave?, tick?}>. API: registerScene,
                                      activateScene, getActiveScene, tickAll.
    renderLoop.js                   — startRenderLoop(renderer, THREE) / stopRenderLoop.
    materials/
      concrete.js                   — makeConcreteTexture(THREE) — procedural noise, применяется с разным repeat
                                      для платформы (1×1) и пола (6×6). ВНИМАНИЕ: repeat — глобальное состояние,
                                      две текстуры создаются отдельно, не `.clone()`.
      metal.js                      — makeMetalTexture(THREE) — brushed steel, для стоек ринга и shop locker.
      noise.js                      — общий helper для texture-генераторов.
    objects/
      fighterModel.js               — makeFighterLowPoly / registerIdleFighter / tickIdleAnimations /
                                      unregisterIdleFighter / addArchetypeGlow.
      arena.js                      — buildArena(scene, THREE, { platformTex, floorTex, metalTex }) → { arena, vertices }.
                                      Константы RING_RADIUS, RING_HEIGHT, POST_HEIGHT, ROPE_HEIGHTS.
      environment.js                — buildEnvironment(scene, THREE) → { crowdGroup, dustGeom }. Стены / балки /
                                      лампы / решётки / толпа силуэтов / ground fog particles.
      heavyBag.js                   — buildHeavyBag(THREE) → Group. Training interactable, userData.id='training'.
      terminal.js                   — buildTerminal(THREE) → { group, tickScreen(t) }. Matchmaking, blinking cursor.
      plinth.js                     — buildPlinth(THREE, concreteTex) → { group, shaft }. Create, static cone.
      scoreboard.js                 — buildScoreboard(THREE) → Group. Ratings, top-5 leaderboard на canvas.
      clanBanner.js                 — buildClanBanner(THREE, concreteTex) → Group. Clan, вертикальный canvas-баннер.
      shopLocker.js                 — buildShopLocker(THREE, metalTex) → Group. Shop, 2×3 grid cosmetic slots,
                                      toneMapped:false на дисплее.
    scenes/
      PitScene.js                   — buildPitScene(THREE, aspect). Сборщик hub-сцены. ROOM_RADIUS=18, ROOM_WALL_HEIGHT=9.
    interaction/
      cameraController.js           — attachOrbit(camera, canvas) → { tick, detach, getIsDragging }. Drag-absolute
                                      formula от dragStartAngle, wheel normalization через Math.sign, zoom lerp 0.10.
                                      Listeners: mousedown на canvas, mousemove/mouseup на window (иначе drag ломается
                                      за границей viewport'а).
      raycaster.js                  — createPicker(camera, targets, THREE) → { pickAt(x, y) }. Walk-up parent chain
                                      до registered root.
      useHoverState.js              — module-scoped reactive { text, x, y, visible }. CanvasLayer пишет, PitViewV2
                                      читает. Composable для siblings-топологии (вместо emit через AppV2).
      useClickState.js              — module-scoped reactive { id, seq }. pickClick(id) инкрементирует seq, чтобы
                                      watch срабатывал на повторный клик по тому же объекту.
  views-v2/
    PitViewV2.vue                   — рендерит <HudPit ref>, watch на click.seq → hud.openPhModal(click.id).
  components/hud/
    HudPit.vue                      — композиция TopBar + WorldHint + PhModal. MODAL_CONTENT словарь (8 id + avatar),
                                      defineExpose({ openPhModal }).
    common/
      TopBar.vue                    — три зоны (resources / title / avatar). pointer-events: none на контейнере,
                                      auto на кликабельных. emit('avatar-click').
      PhModal.vue                   — Teleport в body, backdrop + modal, close через × / backdrop / Escape.
                                      Стили не-scoped (Teleport выносит из SFC).
      WorldHint.vue                 — floating pointer-anchored ярлык, fixed + translate(-50%, -100%).
      GlobalOverlays.vue            — .grain / .scanlines / .vignette (из Эпика 1).
      FighterBadge.vue              — stub, заполнится в Эпике 3 (Fighter Detail scene).
  styles/
    hexlash-v24.css + v24/          — из Эпика 1, не менялось.
```

### Публичные контракты (Эпик 2)

- **`buildPitScene(THREE, aspect)`** → `{ scene, camera, tick, rimL, concreteTex, metalTex, roomHeight, roomRadius, clickableTargets }`. `clickableTargets` — массив из 8 корневых Group'ов в порядке прототипа (heavyBag, terminal.group, wardenContainer, predatorContainer, plinth.group, scoreboard, clanBanner, shopLocker). `tick(t)` анимирует crowd / dust / rim pulse / fighter idle / container bob / heavy bag sway / terminal cursor / hover-scale lerp.
- **`makeFighterLowPoly(THREE, variant?)`** → `THREE.Group` с **22 прямыми детьми в фиксированном порядке** (индексы 0-21). Контракт задокументирован в JSDoc файла. Аксессуары (belt/tail/wraps) идут после индекса 21 и хранятся в `g.userData.accessories` (`visible=false`). variant: `'warden'` (default) / `'predator'`.
- **`registerIdleFighter(group, phaseOffset)`** — регистрирует wrapper-group, где `children[0]` = результат `makeFighterLowPoly`. phaseOffset в секундах десинхронизирует нескольких бойцов.
- **`tickIdleAnimations(t)`** — вызывать раз за кадр. Snapshot `entry.base` делается при первом тике, все дальнейшие обновления — **set** от base + offset, не `+=` (иначе кулаки дрейфуют).
- **`unregisterIdleFighter(group)`** — splice по ссылке. No-op если не найдено.
- **`addArchetypeGlow(fighterGroup, THREE, hexColor)`** — canvas-gradient диск (`PlaneGeometry 0.85×0.85`, `AdditiveBlending`), добавляется в переданный wrapper как `children[1]` (при условии, что fighter уже добавлен `children[0]`). Помечен `userData.isArchGlow=true`.
- **`createPicker(camera, targets, THREE)`** → `{ pickAt(clientX, clientY) }`. Raycaster + walk-up parent chain до одного из targets. Null если промах.
- **`attachOrbit(camera, canvas)`** → `{ tick, detach, getIsDragging }`. Константы `ZOOM_DEFAULT = √(11²+16²) ≈ 19.42`, `ZOOM_MIN = 7`, `ZOOM_MAX = 32`. Formula drag: `camTarget = dragStartAngle + (dx / innerWidth) * π * 0.6`. lookY динамический: `1.6 + heightRatio * 0.6`.
- **`useHoverState()`** → shared reactive `{ text, x, y, visible }`. CanvasLayer пишет, PitViewV2 читает через `<WorldHint :text :x :y :visible>`.
- **`useClickState()`** → shared reactive `{ id, seq }`. `pickClick(id)` инкрементирует seq. Consumer: `watch(() => click.seq, () => hud.openPhModal(click.id))`.

### Известные расхождения с ТЗ (Эпик 2, архитектурные решения)

- **Composables вместо emit для siblings.** CanvasLayer и PitViewV2 — siblings внутри AppV2, не parent-child. `emit/props` не подключает их напрямую. Вместо цепочки через AppV2 используем module-scoped reactive (`useHoverState` / `useClickState`) — стандартный Vue 3 паттерн для transient cross-sibling state.
- **pointermove/down/up на canvas, не window.** Orbit drag уже использует `window.mousemove/up` чтобы не ломаться за границей viewport. Hover и click — на canvas, поскольку вне canvas в пределах `/v2` только overlays с `pointer-events: none`.
- **Interactables в `scene`, не в `arena` group.** Heavy bag, terminal, plinth, scoreboard, clan banner, shop locker — добавлены прямо в `scene`, а не в `arena`-Group. Они вне ринга концептуально. Бойцы — в `arena.add(...)` (по прототипу 6682/6687, в зоне ринга). PATCH документирует это как «на выбор, визуально эквивалентно».
- **`MODAL_CONTENT` расширен на `avatar`.** В прототипе клик по аватару открывал Profile scene (сейчас её нет). Добавлена 9-я запись `avatar` с описанием «YOUR PROFILE / Coming soon» — PhModal реюзается.
- **Hot-fixes после неточностей ТЗ.** (1) Шаг 3: `FOV 45°` не `50°`, `FogExp2` не линейный `Fog`, `renderer.shadowMap.enabled=true` — все три правки внесены отдельным fix-коммитом после аудита прототипа. (2) Шаг 12: plinth light shaft не вращается — спутано с volumetric light shaft'ами (прототип 6759-6778), конус plinth статичен. Откачено в отдельном коммите.
- **Шаг 8 закоммичен пользователем через GitHub UI.** `fighterModel.js` — 585 строк, перенос 1-в-1 из прототипа. Claude Code уходил в Stream timeout при записи файла такого размера через Write. Решение: пользователь приложил готовый файл, Claude Code запустил сборку + push.
- **Prod-билд обязателен перед каждым коммитом.** Унаследовано из Эпика 1, подтверждено на 22 коммитах — ни одного падения на Vercel за весь Эпик 2.

### Эпик 3A — Fighter Detail + Fight (✅ COMPLETE)

Завершён 2026-04-21. Вторая и третья сцены миграции. Клик по warden/predator в Pit переключает на FD, временная кнопка FIGHT в FD переключает на Fight.

**Что видит пользователь:**

- `/v2/fd/:key` (key=warden|predator) — FD сцена:
  - Октагональная комната (FD_ROOM_R=14, H=8) с подиумом в центре, боец стоит на подиуме, 3 branch columns сзади (speed cyan `0x00E5FF` / power pink `0xFF066F` / technique violet `0xA855F7`).
  - Drag-to-rotate камера (CAM_R=7.0, CAM_Y=2.4, LOOK_Y=1.6), клампинг ±π/3.
  - 3 DOM branch-labels трекаются над колоннами через fdProjectToScreen.
  - Hover на колонку → scale 1.06, click → BranchPanel (slide-in справа) с kicker/title/level/5 moves.
  - Upgrade кнопки (`.bp-move-up +`, `.bp-upgrade Level Up Branch`) **всегда disabled** с title "Upgrade — Epic 4".
  - Шапка: kicker ("Captain · Warden" / "Predator"), name, meta (Belt · W-L-D · ELO). fd-resources (Taps/XP), fd-stats (4 карточки). Временная розовая кнопка FIGHT → (top-right).
  - Back (← или Esc) → `/v2`.

- `/v2/fight` — Fight сцена:
  - Октагональный ринг (FT_RING_R=3.6, FT_RING_H=0.5), 8 post+cap, 24 rope segments (3 уровня × 8 сторон), свет (Ambient/Hemisphere/Key/RimL-pink/RimR-gold) + light shaft.
  - 2 бойца: warden (x=-1.2, золотой glow), predator (x=+1.2, розовый glow), idle-breathing.
  - 3 camera modes: pit (slow auto-orbit), side (static profile), cinema (tracks active attacker).
  - Fight HUD: 2 fighter-карточки (name/arch/HP bar/HP num), round counter, cam-switcher, Back, Spectate-badge (pulse).
  - Simulation: prep → fight → result.
    - PrepOverlay: VS block + 3 strategy cards (aggressive/balanced/defensive) + Start/Cancel. **Без deck builder и stakes — упрощение от прототипа (Epic 4+).**
    - runRound: 3-5 exchanges alternating attackers, mid-round coach pause.
    - CoachPause: contextual text по HP diff (3 ветки), 3 strategy buttons (Push Pace / Defend / Counter).
    - doExchange: hit chance с strategy modifier, crit 12% (×1.6), 220ms delay для синка с playMove анимацией, white flash на hit.
    - ResultOverlay: VICTORY (green border) / DEFEAT (red border) + summary, Rematch → reset/prep, Exit → `/v2/fd/warden`.
  - fight-log: HTML rows с actor colors, 50-lines auto-trim, auto-scroll.
  - hit-flash overlay: 0.18s белая вспышка.
  - Back → `/v2/fd/warden`.

### Структура новых файлов Эпика 3A

```
src/scene/
  scenes/
    FighterDetailScene.js      — FD сцена: floor + walls + podium + lights + shaft + dust + fighter (setKey) + 3 branch columns + picker + label tracking в tick
    FightScene.js              — Fight сцена: ring platform + floor + walls + posts+ropes + lights + shaft + 2 fighters + part refs + animSystem binding + 3 camera modes
    useFightSceneApi.js        — reactive { setCamMode, playMove, getState, resetFight } + bind/unbind

  interaction/
    fdCameraController.js      — attachFdOrbit(camera, canvas) → { tick, detach, getIsDragging }; mouse-only drag clamp ±π/3
    fdProjectToScreen.js       — fdProjectToScreen(obj3d, addY, camera, THREE) → { x, y, visible }
    useFdLabels.js             — fdLabels reactive { speed, power, technique: {x,y,visible} } + updateFdLabel(id, pos)
    useCanvasRef.js            — set/getCanvasRef singleton (CanvasLayer publishes, lazy Views read)

  objects/
    branchColumn.js            — buildBranchColumn(THREE, branch, opts) → { group, height }: base + shaft + cap + accent + disc + point light
    fightAnimations.js         — createAnimationSystem(leftParts, rightParts, leftBase, rightBase) → { playMove, tickAnims, getAnims }; 6 types (jab/cross/hook/block/dodge/hit)

src/views-v2/
  FighterDetailView.vue        — заполнен: onMounted buildFD + registerScene + activateScene + orbit attach + setKey; resize listener; click watcher → openBranchPanel
  FightView.vue                — заполнен: onMounted buildFight + registerScene + activateScene + resetFight + phase='prep'; resize; onBeforeUnmount resetFight→dispose

src/components/hud/
  HudFighterDetail.vue         — back, FIGHT btn, fd-top (kicker/name/meta), fd-resources, fd-stats (4), 3 branch-labels, BranchPanel
  HudFight.vue                 — back, spectate-badge, fight-top (2 fighter cards + round), cam-switcher (3 btns), fight-log (auto-scroll), hit-flash, PrepOverlay + CoachPause + ResultOverlay
  common/
    BranchPanel.vue            — slide-in panel, kicker/title/level/moves + disabled upgrade btns
    fdBranchData.js            — FD_BRANCH_DATA (3 branches × 5 moves)
    PrepOverlay.vue            — VS block + 3 strategy cards + Start/Cancel (no CSS, uses v24/fight-overlays.css)
    ResultOverlay.vue          — VICTORY/DEFEAT + summary + Rematch/Exit
    CoachPause.vue             — coach text + 3 strategy btns
    useFightLog.js             — fightLog reactive + logFight/clearFightLog (auto-trim 50)
    useFlashHit.js             — flashing ref + triggerFlash (180ms CSS animation, reflow-restart)
    useFightSimulation.js      — fightState reactive + startFight/resetFight/setCoachStrategy; MOVES + rng/pick; runRound/doExchange/showCoachPause/endFight with phase guards

src/styles/v24/
  fight-overlays.css           — shared .phase-overlay/.phase-card/.pc-*/.prep-*/.strat-*/.sc-*/.ef-*/.pc-footer/.pc-btn/.coach-pause/.cp-* scoped to .app-v2
```

### Изменённые файлы Эпика 3A

- `src/router/index.js` — routes `V2FighterDetail` (`/v2/fd/:key`) и `V2Fight` (`/v2/fight`) как дети `/v2`.
- `src/views-v2/PitViewV2.vue` — click watcher для warden/predator → `router.push('/v2/fd/:key')`, остальные id как в Эпике 2 (PhModal).
- `src/scene/CanvasLayer.vue` — `setCanvasRef` publish на mount, `renderer.toneMapping = ACESFilmicToneMapping`, `toneMappingExposure = 2.3`, `getActiveScene` guard для `activateScene('pit')` (защита от mount race), generalized pointer-handlers через active-scene picker/getIsDragging/hoverScale/labels.
- `src/scene/objects/arena.js` — pit floor color `0x2c2c34` → `0x6e6e7a` (прототип-deviation для target hardware, только pit; FD/Fight unchanged).
- `src/scene/objects/{terminal,scoreboard,clanBanner,plinth,shopLocker,branchColumn,fighterModel}.js` — **trans toneMapped:false added and reverted** (see «Расхождения»).
- `src/styles/hexlash-v24.css` — `@import './v24/fight-overlays.css'`.
- `CLAUDE.md` — эта секция.

### Публичные контракты API

- **`buildFighterDetailScene(THREE, aspect)`** → `{ scene, camera, tick, clickableTargets, dispose, setKey, picker }`. `setKey(key)` swap'ит fighter + glow; `tick(t)` включает dust drift, outer sway, emissive pulse, hover lerp, tickIdleAnimations, label tracking.
- **`buildFightScene(THREE, aspect)`** → `{ scene, camera, tick, playMove, setCamMode, getState, resetFight, dispose, ftVerts }`. `tick(t)` включает updateFightCamera, tickAnims, guarded tickIdleAnimations.
- **`attachFdOrbit(camera, canvas)`** → `{ tick, detach, getIsDragging }`. Константы: CAM_R=7.0, CAM_Y=2.4, LOOK_Y=1.6, ROT_CLAMP=π/3. mousedown на canvas, mousemove/mouseup на window.
- **`fdProjectToScreen(obj3d, addY, camera, THREE)`** → `{ x, y, visible }`. Переиспользуемый `_v = new THREE.Vector3()`.
- **Composables** (module-scoped reactive): `useCanvasRef` (set/get), `useFdLabels` (fdLabels + updateFdLabel), `useFightSceneApi` (fightSceneApi + bind/unbindFightSceneApi), `useFightLog` (fightLog + logFight/clearFightLog), `useFlashHit` (flashing + triggerFlash), `useFightSimulation` (fightState + startFight/resetFight/setCoachStrategy).
- **`createAnimationSystem(leftParts, rightParts, leftBase, rightBase)`** → `{ playMove(side,type), tickAnims(), getAnims() }`. Types: jab/cross/hook/block/dodge/hit. Duration: 400ms (block/dodge) или 500ms (остальные).
- **`buildBranchColumn(THREE, branch, opts)`** → `{ group, height }`. branch = `{ id, name, color, level, x, z }`, opts = `{ COL_R, COL_BASE_H, COL_PER_LVL }`.

### Известные расхождения с прототипом / ТЗ (осознанные)

- **Branch-panel upgrade buttons** — disabled, title="Upgrade — Epic 4". Логика апгрейда = Эпик 4 (taps/xp spend, rebuildColumnHeight, spawnShockwave).
- **PrepOverlay упрощённый** — только VS + 3 strategy cards + Start/Cancel. Без deck builder (5 moves) и stakes. Полный prep = Эпик 4+.
- **Touch events в FD camera** — нет. Эпик 5 (mobile).
- **Punch-zoom и blur/fade транзишны** между сценами — нет. Эпик 5 polish.
- **Fighter badges** в Pit (DOM над 3D бойцами) — stub `FighterBadge.vue` не заполнен. Эпик 3 поздние фазы / Эпик 4.
- **FD per-part idle не работает.** Подиум wrapper имеет `children[0] = podiumDisc` (Cylinder), а не fighter. `tickIdleAnimations` early-return'ит на контракте `children.length >= 22`. Прототип-parity — outer body sway в FD.tick единственная анимация. Исправление = Эпик 5 polish (переделать структуру wrapper).
- **renderer.toneMapping = ACESFilmicToneMapping** с `toneMappingExposure = 2.3`. Прототип использует `1.05`. Подобрано итеративно против Vercel preview на target hardware. Revisit в Эпике 5 polish.
- **Pit floor color `0x6e6e7a`** — прототип `0x2c2c34`. Только pit floor; FD/Fight floor остались прототип-parity. Revisit в Эпике 5.
- **spectate-badge всегда видим** в HudFight. Прототип gating через `body.fight-readonly`. Условие появится в Эпике 4 (own match vs spectate режим).
- **Shared CSS `fight-overlays.css`** вместо per-component scoped (ТЗ описывал scoped). Причина: 60%+ классов общие у Prep/Result; pattern parity с `tokens.css`/`effects.css` Эпика 1.
- **HP clamp to 0** при damage display в `useFightSimulation.doExchange` (`Math.max(0, ...)`). Прототип не clamp'ит (HP может уйти в `-3 / 100`). Минорное улучшение, не меняет `endFight` comparison.
- **fd-resources `right: 150px`** вместо прототипа `right: 14px`. Временно — чтобы не пересекаться с FIGHT-кнопкой. В Эпике 3B при удалении FIGHT-кнопки — вернуть 14px.
- **`HudFight.vue` 411 строк** (над soft-300). Splitting на HudFight + HudFightOverlays wrapper возможно в Эпик 5 polish.

### Исторические hot-fixes Эпика 3A

- **Activation race (Step 11-12).** При hard-refresh `/v2/fd/*` или `/v2/fight` CanvasLayer (async) мог смонтироваться ПОСЛЕ View (async) и перезаписать `activeId`. Fix: `if (!getActiveScene()) activateScene('pit')` в CanvasLayer.onMounted.
- **toneMapping (Step 9).** Прототип включает ACES на всех renderer'ах, Эпик 2 scaffold пропустил. Exposure тюнинг 1.05 → 1.7 → 2.3 итеративно.
- **toneMapped:false на 9 материалах.** Изначально добавлено, потом отка́чено к прототип-parity (только shopLocker display сохраняет `toneMapped:false`).
- **Pit floor color** 0x2c2c34 → 0x4a4a56 → 0x6e6e7a итеративно.

### Step 17 (coach-pause) — closed as EMPTY

Функциональность coach-pause полностью реализована в Step 16 (CoachPause.vue + useFightSimulation.showCoachPause + setCoachStrategy). Отдельный коммит для Step 17 не создавался. Step 18 → `epic3a: final`.

### Deferred to Epic 5 (polish)

- Punch-zoom transition hub → sub-scene.
- Blur + fade transitions между сценами.
- Touch events support (FD camera drag, mobile в целом).
- Exposure / floor color тюнинг (final visual parity).
- Per-part idle в FD (переделка podium структуры).
- HudFight.vue splitting (~410 → 2-3 файла).
- spectate-badge gating (own vs spectate).

### Deferred to Epic 3B

- FIGHT-кнопка в FD убирается — Matchmaking становится входом в Fight.
- fd-resources возврат на `right: 14px`.

**Следующий эпик:** Эпик 3B — Matchmaking + Training + Create сцены. План в `docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md` §8.

### Эпик 3Ba — Training (✅ COMPLETE)

Завершён 2026-04-21. Первая sub-scene Эпика 3B. Клик по heavy bag в hub → `/v2/training`.

**Что видит пользователь:**
- Октагональная комната (TR_ROOM_R=14, H=8) с тяжёлым мешком в центре, подвешенным на 6-звенной цепи.
- Click по мешку → pendulum swing (spring 0.06, damping 0.94, impulse 0.025), earns taps, procedural hit sound (WebAudio noise burst, lowpass filter 1200+mult·250 Hz).
- Быстрые клики → combo multiplier ×2/×3/×5 (5/12/25 подряд в пределах 700мс; expire 800мс после последнего).
- HUD: back-кнопка, counter taps + session time, energy bar (42/60 init, auto-regen 0.4/sec), 2 daily tasks (Hit 100 / Land 5 combos ×3+), combo indicator (bottom-center, розовый glow ≥×3), hint внизу.
- Energy=0 → красный flash overlay, клик ignored.
- 6 additive spark particles на каждый hit (life decay 0.04, fade + GC).
- Tap-pop floating `+N` DOM (crit = pink, больший размер).
- Back / Esc → `/v2`.

**Дерево новых файлов:**
```
src/views-v2/TrainingView.vue                     — 129 строк — orchestrate: build scene + register + activate + click-to-hit bind + Esc/Back
src/scene/scenes/TrainingScene.js                 — 210 — fog + camera + floor + walls + lighting + shaft + dust + bag + physics + hitParticles + tick
src/scene/objects/trainingBag.js                  — 72  — 6-chain + body cylinder + top/bot hemispheres + 2 straps
src/scene/objects/trainingBagPhysics.js           — 42  — 2-axis spring+damping pendulum; applyTick + applyImpulse
src/scene/objects/trainingHitParticles.js         — 59  — 6 additive sphere particles per hit + fade + GC
src/scene/interaction/useTrainingState.js         — 71  — reactive trState + reset + startTrainingSession + multiplierForCombo
src/scene/interaction/useClickToHit.js            — 115 — canvas mousedown → raycast → impulse + combo + gain/tasks + tap-pop + particles + sound
src/scene/interaction/useHitSound.js              — 69  — lazy WebAudio context + playHitSound (noise burst + lowpass + envelope)
src/components/hud/HudTraining.vue                — 95  — back + counter + energy + 2 tasks + combo + hint (tighter than estimate 250)
src/styles/v24/training.css                       — 254 — 13 HUD classes + .tap-pop + @keyframes tapPopAnim, scoped .app-v2
```

**Изменены:**
- `src/router/index.js` — route `V2Training` (`/v2/training`).
- `src/views-v2/PitViewV2.vue` — click watcher: `id === 'training'` → `/v2/training`.
- `src/components/hud/HudPit.vue` — MODAL_CONTENT.training убран (9 → 8 ключей).
- `src/scene/sceneRegistry.js` — добавлена `unregisterScene(id)` (lazy sub-scenes требуют).
- `src/styles/hexlash-v24.css` — `@import './v24/training.css'`.

**Паттерны:**
- `heavyBag.js` (hub, малый, side-position) vs `trainingBag.js` (большой, центральный, visible chain) — **один объект = один модуль.** Не параметризуем. Ссылочно для 3Bb Matchmaking terminal и 3Bc Create podium — если их training-версия отличается, создавать отдельные модули.
- Все пороги/timings как именованные константы (ENERGY_INITIAL/MAX/REGEN, COMBO_WINDOW_MS/COMBO_SHOW_MS, CRIT_MULT_THRESHOLD, SPARKS_PER_HIT, LIFE_DECAY) — в начале модуля. Паттерн Эпика 2/3A.
- Pre-allocated `raycaster/pointer/localDir` в closure `useClickToHit` — no per-click allocations.
- `spawnTapPop` — module-level pure function (no state → no closure).
- `useTrainingState` следует паттерну `useFightSimulation` 3A (reactive store + named exports, не `ref`, не provide/inject).

**Расхождения с прототипом (осознанные):**
- Touch events (`touchstart`) — не перенесено, Epic 5 mobile.
- Task rewards — декоративный текст без привязки к профилю (Epic 4).
- CSS `position: absolute → fixed` на 13 HUD-классах — Claude Code унифицировал на `.app-v2` container. Визуально эквивалентно, пересмотреть в Epic 5 polish.
- `_state` экспонирован в return `createBagPhysics` — debug-only, не используется.

**Deferred:**
- Epic 4: task rewards profile binding.
- Epic 5: global audio infrastructure (rumble + mute toggle + volume slider), touch support, CSS fixed→absolute pass.

**Шаги и коммиты (10 + Step 8 closed-empty + Step 10 no-commit):**
| # | Commit | Что |
|---|--------|-----|
| 1 | `13894f6` | stubs + route + redirect heavy bag |
| 2 | `7aea6b1` | scaffold (fog+camera+floor+walls) + unregisterScene API |
| 3 | `6c4f4b3` | lighting + shaft + dust |
| 4 | `4e2ffe1` | training bag mesh |
| 5 | `b38ca7a` | bag physics |
| 6 | `aa3ae6c` | HudTraining + trState + training.css |
| 7a | `be58000` | click-to-hit raycaster + impulse + energy |
| 7b | `d3a0361` | combo + tasks + tap-pop + hit particles |
| 8 | — | closed empty (merged into 7b) |
| 9 | `e7d019a` | procedural hit sound |
| 10 | — | regression test passed, no commit |
| 11 | this | CLAUDE.md + handoff 3Bb + final report |

**Следующий суб-эпик:** 3Bb — Matchmaking. См. `docs/visual-migration/HANDOFF_EPIC3Bb_CHAT_HANDOFF.md`.

### Эпик 3Bb — Matchmaking (✅ COMPLETE)

Завершён 2026-04-21. Вторая sub-scene Эпика 3B. Клик по CRT terminal в hub → `/v2/matchmaking`.

**Что видит пользователь:**
- Октагональная тёмная комната (MM_ROOM_R=14, H=8, цвет пола 0x1a1a20, стен 0x0a0a12) — cyan-mood, без волюметрического shaft'а.
- В центре — напольный стенд (base + pole + top) с CRT-терминалом (1.6×1.2×1.0), фронтальный экран рисуется через canvas texture (512×320).
- Освещение: cyan key spot (0x00E5C8), pink rimL (0xff066f), gold rimR (0xD4A843). 40 cyan dust particles (половина от Training), медленный drift 0.0015/frame.
- Камера статичная с медленным breath (sin-based drift по x/y/z, не orbit — drag отсутствует).
- На CRT анимируется typeLog (setTimeout-driven, 6 канонических строк: init matchmaker → pinging arena nodes [...] → querying eligibility → filtering by elo_range → filtering by archetype → collecting candidates → summary "> N candidates matched. ready."). Анимированные точки в "pinging" шаге. Каждый step имеет 35% шанс инкрементировать searchProgress.
- HUD `search` phase (слева): кнопка ← Back, заголовок "Matchmaking / FIND OPPONENT", filters panel (ELO slider ±25..±400 step 25, Archetype chips Any + 6 архетипов, Belt chips Any + 4 пояса), Cancel button.
- По завершении typeLog (~6 шагов × 340мс + финальная pause 600мс) → генерируется 3-6 candidates (deterministic seeded RNG от Date.now() & 0xffffff, mulberry32), HUD флипается в `results` phase.
- HUD `results` phase: grid карточек кандидатов (name/initials/archetype color/belt/ELO/W-L/WR%/streak/Difficulty badge Easier|Even|Harder), кнопка Rescan, кнопка Start Fight (активна при выборе).
- Изменения фильтров → watcher репейнтит CRT filters-line (без перезапуска typeLog).
- Start Fight → сохраняем `{ leftName, leftArch, rightName, rightArch }` в `useFightSetup` → `router.push('/v2/fight')` → FightView считывает setup на mount через `getFightSetup()` + сразу `clearFightSetup()` (one-shot consumption).
- Cancel / ← Back / Esc → `/v2`.

**Дерево новых файлов:**
```
src/views-v2/MatchmakingView.vue                  — 199 строк — orchestrate: build scene + register + activate + lifecycle (startSearch/onSearchComplete/onCancel/onRescan/onFight) + resize + Esc + filter watcher
src/scene/scenes/MatchmakingScene.js              — 147  — fog + camera + floor + 8 walls + lighting (ambient + cyan key + pink rim + gold rim) + 40 cyan dust + terminal mount + camera breath tick + dispose
src/scene/objects/matchmakingTerminal.js          — 88   — stand (base + pole + top) + CRT body + canvas texture screen plane (512×320, toneMapped:false)
src/scene/interaction/useMatchmakingState.js      — 54   — reactive mmState { phase, eloDelta, archFilter, beltFilter, candidates, selected, searchProgress, searchLog } + resetMmState + enterSearchPhase + enterResultsPhase + getEloRange + MY_ELO=1247
src/scene/interaction/useMatchmakingScreen.js     — 127  — refreshScreen(ctx, tex) = BG + scan lines + title + filters summary + up to 14 log lines + tex.needsUpdate; startSearchLogAnimation(ctx, tex, onComplete) = setTimeout-driven typeLog, returns cancel handle
src/scene/interaction/mmCandidatesMock.js         — 102  — generateCandidates(mmState) = mulberry32 seeded RNG, 3-6 cards, unique names, obeys filters, Difficulty thresholds ±50, sorted DESC by ELO. MM_POOL_NAMES (30), MM_ARCHS (6), MM_BELTS (4)
src/scene/interaction/useFightSetup.js            — 40   — module-scoped reactive { current } + setFightSetup / getFightSetup / clearFightSetup. Defaults fallback (Captain Warden vs Predator). Semantic: one-shot consumption
src/components/hud/HudMatchmaking.vue             — 173  — Back + title + filters panel (ELO slider + archetype chips + belt chips) + Cancel + results grid (candidate cards) + Rescan + Start Fight. v-if on mmState.phase
src/styles/v24/matchmaking.css                    — 391  — 40+ HUD classes (.mm-back, .mm-title, .mm-filters, .mmf-slider, .mmf-chip, .mm-results, .mmr-card, .mm-diff-badge, phase transitions), scoped .app-v2
```

**Изменены:**
- `src/router/index.js` — добавлен route `V2Matchmaking` (`/v2/matchmaking`), child of `/v2`.
- `src/views-v2/PitViewV2.vue` — click watcher: `id === 'matchmaking'` → `router.push('/v2/matchmaking')`.
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.matchmaking` удалён (8 → 7 ключей для PhModal, только create/ratings/clan/shop + avatar остаются на PhModal до 3Bc + Epic 4).
- `src/styles/hexlash-v24.css` — `@import './v24/matchmaking.css'`.
- `src/views-v2/FightView.vue` — на mount: `const setup = getFightSetup(); clearFightSetup(); fightState.leftName/leftArch/rightName/rightArch = setup.*`. `resetFight()` намеренно не трогает эти 4 поля, поэтому setup применяется после reset без field-clash. Step 10 hot-fix (`c644f1b`) добавил `clearFightSetup()` после read — one-shot consumption.

**Паттерны:**
- **One-shot consumption shared state.** `useFightSetup` — новый composable для cross-sub-scene параметров. Pipeline: producer (Matchmaking) вызывает `setFightSetup(...)` перед `router.push`; consumer (FightView) на mount делает `getFightSetup() + clearFightSetup() + apply`. Clear сразу после read — гарантирует, что следующий прямой заход (например, FD → временная FIGHT-кнопка) не унаследует предыдущего противника. Rematch работает потому что setup уже применён в `fightState`, а `resetFight()` на последующих round-reset'ах не трогает name/arch поля. Refresh на `/v2/fight` → defaults (acceptable, Epic 4 заменит на real match state).
- **Один объект = один модуль.** `matchmakingTerminal.js` — отдельный модуль, НЕ параметрический вариант hub'ового `terminal.js`. Другие размеры, позиция, screen pipeline (canvas texture с dynamic drawing против procedural CRT blink). Прецедент из 3Ba (trainingBag vs heavyBag), подтверждён дважды. Применять тот же принцип в 3Bc для Create podium.
- **TypeLog через canvas texture, не DOM.** Строки рисуются на 512×320 canvas, который используется как `THREE.CanvasTexture` на фронтальной плоскости CRT — часть 3D-сцены, а не HUD overlay. `tex.needsUpdate = true` после каждого draw. Плюс: совпадает с прототипом 1-в-1, не нужен отдельный DOM-слой, не ломается при `transform`/zoom камеры. `toneMapped: false` на screen plane — второй и последний легитимный случай в v2 codebase после shopLocker display (white-list rule).
- **Module-scoped reactive как shared state.** `mmState` (useMatchmakingState) и `useFightSetup` следуют паттерну 3A/3Ba (useFightSimulation, useTrainingState) — reactive store + named exports, не `ref`, не `provide/inject`.
- **Seeded RNG для candidates.** `mmSeed(Date.now() & 0xffffff)` + mulberry32 → rescans в пределах одной миллисекунды возвращают идентичные picks. Прототип-parity, не баг. Real backend API заменит в Epic 4.
- **Cancel handle от `startSearchLogAnimation`.** Возвращает `{ cancel() }`. View обязан вызвать на unmount + при onCancel + при onRescan — иначе stale setTimeout мутирует mmState / рисует в disposed ctx. Параллельно хранится `resultsTimer` (600мс между CRT summary и phase flip) — освобождается в тех же трёх местах.

**Расхождения с прототипом / ТЗ (осознанные):**
- **Drag/orbit камера** — не перенесено. Matchmaking-сцена статичная с breath-drift'ом (по прототипу). FD orbit / hub orbit остаются своим режимом.
- **Touch events** — отсутствуют. Epic 5 mobile.
- **Real backend API** для candidates / filters — mock с seeded RNG. Epic 4.
- **Captain data статична** — всегда `{ leftName: 'YURII.VARVAROV', leftArch: 'Captain · Warden' }` в `onFight`. Epic 4 прочитает реального captain'а из profile store.
- **Refresh на `/v2/fight`** теряет `useFightSetup.current` — применяются DEFAULT_SETUP. Задокументировано в хедере файла, acceptable для 3Bb.
- **FIGHT-кнопка в FD** — временная, до сих пор существует. Удаление вынесено в финал Эпика 3Bc (после Create — весь Эпик 3B закроется этим шагом).

**Critical fix history (Step 10 hot-fix `c644f1b`):**
Stale-state bug был **предсказан статически** в 3Ba Шаге 10 и передан в handoff 3Bb как открытый вопрос §5.5. Воспроизведён визуально в 3Bb regression test (Matchmaking → Fight → Rematch → Back → FD → FIGHT → старый opponent наследовался). Починен fix-вариантом 1: `clearFightSetup()` вызывается в `FightView.onMounted` сразу после `getFightSetup()`. Rematch продолжает работать потому что setup уже записан в `fightState.rightName/rightArch` к моменту clear'а; `resetFight()` эти поля не трогает. Прецедент подтвердил что критические риски через §5 handoff передаются корректно.

**Deferred:**
- Epic 3Bc: удаление временной FIGHT-кнопки из FD, возврат fd-resources `right: 14px`.
- Epic 4: real backend matchmaking API (replace mmCandidatesMock), real captain data в onFight, match state persistence через refresh (replace useFightSetup fallback).
- Epic 5: touch events, mobile polish.

**Шаги и коммиты (10 + Step 10 hot-fix + final):**
| # | Commit | Что |
|---|--------|-----|
| 1 | `95b326e` | stubs + route `/v2/matchmaking` + redirect terminal click |
| 2 | `9832f6a` | MatchmakingScene scaffold (floor, walls, camera) |
| 3 | `99aafea` | lighting + dust + camera breath |
| 4 | `6c5ba06` | matchmakingTerminal (stand + CRT + canvas screen) |
| 5 | `21e3afb` | screen texture rendering + typeLog animation |
| 6 | `a8aa12b` | HudMatchmaking skeleton + matchmaking.css + state minimum |
| 7 | `59f144e` | filters wiring + phase transitions + cancel |
| 8 | `6cc4cb3` | candidates mock + enterResults + rescan |
| 9 | `4ac5ace` | useFightSetup + FightView integration + Start Fight wiring |
| 10 | — | regression test → stale-state bug обнаружен (no commit) |
| 10 fix | `c644f1b` | stale fight setup via clearFightSetup on mount |
| 11 | this | CLAUDE.md + final report + handoff 3Bc |

**Следующий суб-эпик:** 3Bc — Create Fighter. См. `docs/visual-migration/HANDOFF_EPIC3Bc_CHAT_HANDOFF.md`.

### Эпик 3Bc — Create Fighter (✅ COMPLETE)

Завершён 2026-04-21. Третья и последняя sub-scene Эпика 3B. Клик «+» plinth в hub → `/v2/create`. **С 3Bc Эпик 3B закрыт полностью** (все 3 sub-эпика + FD FIGHT button cleanup).

**Commit range:** `b6bd5af` (Step 1) → `e7d79ea` (Step 10) + 2 hot-fix'а (`809c63f` scene activation, `cbc074a` state reset) + `88618b4` (Step 11 FD cleanup) + 3 финальных коммита (13.1/13.2/13.3).

**Что видит пользователь:**
- Октагональная комната (CR_ROOM_R=14, H=8) с concrete-textured подиумом в центре.
- На подиуме — полупрозрачный warden (opacity 0.35), лёгкое breathing + sway.
- Под ногами — серый glow disc + PointLight (initial grey `0x6e6e7a`).
- Volumetric shaft сверху, 80 dust particles медленно поднимаются.
- Камера статична под углом (-1.5, 2.4, 7.0), без orbit.
- HUD: Back button (top-left), 3-step stepper (top-center), Create panel (right, 320px).
- **Step 1 Archetype:** 6 карточек (predator/analyst/ghost/sentinel/maverick/juggernaut) с colored icon (tinted bg/text/border), name, tagline, 3 stat bars (AGG/PAT/RIS). Click → glow меняет цвет + `.selected` border-left + Next enabled.
- **Step 2 Name:** text input maxlength=16 + 🎲 roll button + 5 suggestion chips (regenerate on entry). Pool 16×10=160 комбинаций. Next enabled на non-empty trim.
- **Step 3 Confirm:** 4 rows — Name / Archetype (colored) / Belt (White Belt) / Starting ELO (1000) + Create Fighter button.
- **Materialize:** click → DOM flash pink pulse (1.2s CSS) + fighter opacity lerp 0.35→1.0 за 1.2s → 700ms pause → `router.push('/v2')`.
- Back между шагами работает, state persists в сессии; Back в hub / Esc → full state reset on re-entry.

**Дерево новых файлов:**
```
src/views-v2/CreateView.vue                       — 134 строки — orchestrator: resetCreateState + buildCreateScene + register/activate + HudCreate prop wiring + matHandle cancel on unmount
src/scene/scenes/CreateScene.js                   — 300  — fog + camera + floor + 8 walls + lighting (Ambient+Hemi+Key+Front, NO rim right) + shaft + 80 dust + podium + holoFighter + archetypeGlow + tick + dispose
src/scene/objects/createPodium.js                 — 82   — CylinderGeometry(1.4,1.5,0.30,32) concrete disc + TorusGeometry(1.42,0.022,8,64) metal ring
src/scene/objects/createHologram.js               — 88   — setHologram (transparent+opacity ONLY, array material guard) + makeHoloFighter (warden default) + startMaterializeAnimation (rAF lerp + cancel handle)
src/scene/objects/createArchetypeGlow.js          — 116  — createArchetypeGlow(THREE, podium) → { setColor, dispose }. CanvasTexture radial gradient + PlaneGeometry disc + PointLight, rebuild on setColor
src/scene/interaction/useCreateState.js           — 71   — reactive createState + ARCHETYPES (6 archetypes 1-to-1 prototype 9030-9067) + resetCreateState + onArchetypeChange с DI
src/scene/interaction/useCreateNames.js           — 24   — NAME_PARTS_A×16 + NAME_PARTS_B×10 + randomName + generateSuggestions (own pool, not MM_POOL_NAMES)
src/components/hud/HudCreate.vue                  — 294  — Back + 3-step stepper + 3 panel templates (archetype cards / name input+roll+chips / confirm summary) + Create materialize wiring
src/styles/v24/create.css                         — 380  — 10 blocks: back/stepper/panel/headers/archetype/name/chips/confirm/nav/flash + 6 arch-tag colours. Scoped .app-v2
```

**Изменены (6):**
- `src/router/index.js` — добавлен `V2Create` route (`/v2/create`) в `v2Routes.children`.
- `src/views-v2/PitViewV2.vue` — click watcher: `click.id === 'create'` → `/v2/create`.
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.create` убран (7 → 6 ключей; warden/predator dead entries остались — см. EPIC3Bc_FINAL_REPORT §5.6 Epic 5 candidate).
- `src/styles/hexlash-v24.css` — `@import './v24/create.css'`.
- `src/components/hud/HudFighterDetail.vue` (Step 11) — удалены `.fd-fight-btn` template + handler + CSS block (26 строк). `.fd-resources right: 150px → 14px` (прототип-parity).
- `src/scene/sceneRegistry.js` — **НЕ изменён** (unregisterScene уже добавлена в 3Ba Step 2).

**Ключевые паттерны:**
- **Holo material = `transparent + opacity` ONLY** (прототип 8937-8945). NO emissive / fresnel / rim-shader. Handoff §5.4 был ошибочен — зафиксирован correction в EPIC3Bb_FINAL_REPORT §5.2. Array material check (`!Array.isArray`) обязателен — accessories (belt/tail/wraps) несут `Array<material>`, traverse упал бы на `transparent` assignment.
- **Archetype glow = canvas-texture rebuild.** Factory `createArchetypeGlow(THREE, podium)` → `{ setColor, dispose }`. setColor каждый call: `disposeCurrent()` → canvas 256×256 radial gradient 3 stops → CanvasTexture + PlaneGeometry disc (y=0.31 выше ring'а) + PointLight. Idempotent dispose. Защита от CanvasTexture leaks при rapid carousel clicks.
- **Materialize animation = rAF lerp + linear easing + cancel handle.** `startMaterializeAnimation(group, from, to, durationMs, {onDone})` → `{ cancel() }`. Прототип 9242 `0.35 + (1.0 - 0.35) * t` (NOT ease-in-out). 700ms pause перед onDone (прототип 9247). Cancel idempotent (rAF + setTimeout оба). Паттерн 3Bb `startSearchLogAnimation`.
- **One object = one module.** `createPodium.js` отдельный модуль, НЕ variant hub `plinth.js`. Hub plinth — стеклянная плита с «+»; Create podium — concrete disc + metal ring. Прецедент 3Ba (`trainingBag` vs `heavyBag`) + 3Bb (`matchmakingTerminal` vs hub `terminal`) подтверждён трижды.
- **State reset on mount.** `createState` — module-scoped reactive singleton (паттерн 3A `fightState` / 3Ba `trState` / 3Bb `mmState`). Persists через Vue unmount. Прототип 9266-9269 (`openCreate`) сбрасывает state на каждое открытие; v2 эквивалент — `resetCreateState()` **первой строкой** в `CreateView.onMounted` (hot-fix `cbc074a`). Без этого user попадает на последний step с persisted данными.
- **Wiring HUD↔Scene — Variant A (prop-drilling).** `CreateView` передаёт `handleArchetypeColor` + `getHoloFighter` + `getFlashEl` callbacks в `HudCreate` через props. HUD emit'ит `materialize-start` с cancel handle; `CreateView` owns matHandle lifecycle. Симметрично 3Ba/3Bb. Альтернатива (module-scoped composable) отвергнута — extra module state без выгод.
- **Teardown ordering:** `matHandle.cancel()` → `removeEventListener` → `activateScene('pit')` → `unregisterScene('create')` → `sceneApi.dispose()`. `matHandle.cancel` первой строкой — late rAF/setTimeout не должен вызвать `onDone → emit('back') → router.push` после unmount view.
- **6 archetypes в UI, 1 visual variant (warden default).** `makeFighterLowPoly` поддерживает только warden/predator visual variants; archetypeId влияет ТОЛЬКО на `setArchetypeGlow(color)`. Дорисовка недостающих 4 variants (analyst/ghost/sentinel/maverick/juggernaut) — Epic 4. Расширение point: `onArchetypeChange(id, { setGlow })` — добавить `setVariant` в DI объект без изменения сигнатуры.

**Step 11 — FD FIGHT button removal (Epic 3A deferred closed):**
Временная `.fd-fight-btn` в `HudFighterDetail.vue` удалена (прямой вход `/v2/fight` из FD в обход Matchmaking). `.fd-resources right: 150px → 14px` (прототип 648 parity). Единственный путь в Fight теперь: hub → click terminal → `/v2/matchmaking` → typeLog → select candidate → Start Fight → `/v2/fight` с opponent setup через `useFightSetup` one-shot consumption. Закрывает `EPIC3A_FINAL_REPORT §Deferred`.

**Шаги и коммиты:**
| # | Commit | Что |
|---|--------|-----|
| 1 | `b6bd5af` | stubs + route `/v2/create` + plinth redirect |
| 1 hot-fix | `809c63f` | pointer-events on back + activate scene on create view |
| 2 | `a56a693` | CreateScene scaffold (fog/camera/floor/walls) |
| 3 | `7c81dbe` | lighting + shaft + dust |
| 4 | `04492f0` | create podium |
| 5 | `d4e60f7` | holo fighter + setHologram |
| 6 | `8a6068e` | archetype glow + useCreateState wiring |
| 7 | `78ea542` | HUD scaffold + create.css |
| 8 | `019b957` | step 1 archetype cards |
| 9 | `ee5fc9e` | step 2 name + useCreateNames |
| 9 hot-fix | `cbc074a` | reset createState on CreateView mount |
| 10 | `e7d79ea` | step 3 confirm + materialize |
| 11 | `88618b4` | FD cleanup (remove temp fight button) |
| 12 | — | regression test no-commit (static trace 16 пунктов + user visual verify) |
| 13 | this | CLAUDE.md + final report + handoff Epic 4 |

**Эпик 3B — CLOSED.** Все 3 sub-эпика завершены:
- **3Ba Training** (`/v2/training`) — heavy bag, physics, combo, tasks, procedural sound.
- **3Bb Matchmaking** (`/v2/matchmaking`) — CRT typeLog, filters, candidate grid, Start Fight → opponent setup.
- **3Bc Create Fighter** (`/v2/create`) — archetype cards → name → confirm → materialize → hub. FD FIGHT button cleanup в финале.

Переход к **Эпику 4 — Backend Integration**. План в `docs/visual-migration/HANDOFF_EPIC4_CHAT_HANDOFF.md`.

### Эпик 4 — Captain Bind + Create Persistence + Dynamic FD (✅ COMPLETE)

Завершён 2026-04-22. Привязка hub к реальным Vuex `agentState`, persist'анс Create → backend → navigation в FD нового бойца, динамический FD для любого agent id. Скоуп был зафиксирован как три цели (Captain Bind / Create Persistence / Dynamic FD); в середине эпика обнаружен критический bug (hub fighters не обновлялись in-session из-за CanvasLayer singleton) — добавлен Step 5.5 расширением скоупа.

**Commit range:** `e20bb36` (Step 1) → `09a9112` (Step 6) + `4c31592` (Step 5.5 extension) + 3 финальных коммита (8.1/8.2/8.3).

**Что видит пользователь:**
- Hub slot 1 (левый ring-pos) → `agent/currentCaptain` (real backend), glow по `captain.primaryModule` (6 backend archetypes). Fallback legacy warden mock если captain=null.
- Hub slot 2 → `agentsList[1]` (первый non-captain из sorted list) либо **полностью пусто** если у captain'а нет peer'ов. Full-mock fallback (predator) только при captain=null.
- `+` plinth → `/v2/create`. Name + archetype (6) + Confirm → click Create Fighter → loading `'Creating…'` → backend persist → materialize animation → `router.push('/v2/fd/:newId)`.
- Sad path create (roster full / validation fail): inline pink `.cp-error` под кнопкой, button re-enabled, form preserved (archetype + name) для retry без data loss.
- `/v2/fd/:key` accept: legacy `'warden' | 'predator'` (mocks) OR real agent UUID. Dynamic path: сначала `useCreatedFighter` cache (one-shot), затем `fetchAgent`, при failure — redirect `/v2`.
- Hub auto-refresh при любой мутации `agentsList` (Create success, delete, setCaptain, etc.) — без full-page reload.

**Дерево новых файлов (2):**

```
src/scene/interaction/useCreatedFighter.js    — 32 строки — cross-view setup для just-created агента. Producer
                                                (CreateView после backend success) вызывает setCreatedFighter;
                                                consumer (FighterDetailView.onMounted) делает getCreatedFighter +
                                                clearCreatedFighter (one-shot). Паттерн 3Bb useFightSetup.
src/scene/objects/archetypeColors.js          — 26 — shared pickFighterColor(archetypeId) + LEGACY_ARCHETYPE_COLORS.
                                                Resolution: legacy warden/predator → 6 backend archetypes из
                                                ARCHETYPES (useCreateState) → warden gold fallback. Reuse в
                                                PitScene (captain glow) + FighterDetailScene (FD podium glow).
```

**Изменены (9):**

- `src/scene/scenes/PitScene.js` — `buildPitScene(THREE, aspect, opts)` 3-й параметр `{ captain, secondAgent }`. `firstContainer`/`secondContainer` → `let` для swap. Helpers `disposeContainerInPlace(c)` + `applyFighters(cap, second)` — single source of truth для slot rules. Mutable `clickableTargets` + `rebuildClickableTargets()`. Public `refreshFighters({captain, secondAgent})` с no-op short-circuit на `(oldId1, oldId2) === (newId1, newId2)`.
- `src/scene/CanvasLayer.vue` — `onMounted` теперь async: `await dispatch('agent/fetchAgents')` → captain + secondAgent → передача в buildPitScene. `watch(() => store.getters['agent/agentsList'])` после build → `pit.refreshFighters` на каждый mutation. Handle stopped в `onBeforeUnmount`. Hover handler поддерживает `userData.labelOverride` для динамических UUID.
- `src/views-v2/PitViewV2.vue` — click watcher reorganised: `PH_MODAL_IDS = ['ratings','clan','shop','avatar']` whitelist → PhModal; training/matchmaking/create → sub-scene routes; **всё остальное** (legacy warden/predator + real UUID) → `/v2/fd/:id` default.
- `src/views-v2/FighterDetailView.vue` — `resolveFighter(key)` async helper с тремя ветками (legacy mock / `useCreatedFighter` cache one-shot / `fetchAgent` state-check). `agentData` ref реактивно передаётся в HUD. `hudKeyProp` computed для legacy fallback. `watch(route.params.key)` async — route swap без remount.
- `src/components/hud/HudFighterDetail.vue` — prop `agent: Object`. Computeds `kicker`/`name`/`meta`/`stats`/`resources`/`levels` branch на agent presence. `beltLabel(grade)` helper через `getBeltDisplay` из `beltDisplay.js`. Real agents → levels зафиксированы `{speed:0, power:0, technique:0}` до real progression wiring.
- `src/scene/scenes/FighterDetailScene.js` — `setKey(key)` → `setFighter({key, archetype})`. Glow через `pickFighterColor(archetype)` shared helper. Удалён local `GLOW_COLOR` table.
- `src/scene/interaction/useCreateState.js` — добавлены `creating: false`, `error: null` в state; оба сбрасываются в `resetCreateState`.
- `src/views-v2/CreateView.vue` — `onCreatePersist(payload)` async handler: creating=true → await dispatch → setCreatedFighter → materialize → navigate. Materialize-логика (DOM flash + `startMaterializeAnimation`) переехала из HudCreate сюда (orchestrator уже владел sceneApi + flashRef + matHandle).
- `src/components/hud/HudCreate.vue` — pure-presentation. `onCreate` собирает payload и emit'ит `create-persist`. Удалены props `getHoloFighter`/`getFlashEl` и emit `materialize-start`. Button disabled на `creating || materializing`, label `'Creating…'` на `creating`. Inline `<.cp-error>` под кнопкой при `createState.error`.
- `src/styles/v24/create.css` — добавлены 7 правил `.app-v2 .cp-error` (pink-tinted bg/border, mono font, ~12px).

**Ключевые паттерны:**

- **Cross-view state через module-scoped reactive + one-shot consumption.** `useCreatedFighter` повторяет 3Bb `useFightSetup`: producer (CreateView) вызывает setter, consumer (FighterDetailView.onMounted) читает + **сразу clear'ит**. Clear гарантирует: второй визит на `/v2/fd/:sameId` через клик в hub пойдёт через `fetchAgent` (cache empty), а не вернёт stale synthetic.
- **`agentsList` getter spread-sort как reactivity trigger.** `(state) => [...state.agents].sort(...)` возвращает новый array reference на каждый recompute → shallow watch в CanvasLayer срабатывает без `deep: true`. Сортировка и reactivity — один и тот же механизм, не hack.
- **`refreshFighters` atomic rebuild + no-op short-circuit.** Сравнение `(oldFirstId, oldSecondId) === (newFirstId, newSecondId)` отсекает spurious fires (Vuex getter recomputes на любой mutation state.agents, даже когда slot identity не изменился). При реальном diff — dispose обоих + applyFighters заново. Per-slot granularity — deferred в Epic 5 polish.
- **Default skin hardcoded, не picker.** `'skin_m_1.png'` satisfies backend `SKIN_REGEX = /^(skin_(m|w)_\d{1,3}|vip_(k|t)\d{1,2})\.png$/`. Совпадает с Prisma `User.skin` default. Real skin picker (UI + validation) — Epic 5 scope.
- **Backend `VALID_ARCHETYPES` 1-в-1 с v2 `ARCHETYPES`.** Step 0 pre-flight check верифицировал 6 ids (predator/sentinel/ghost/analyst/maverick/juggernaut). Payload в `agent/createAgent` отправляет `createState.archetypeId` напрямую как `primaryModule` — без mapping helper.
- **FD `setFighter({ key, archetype })` contract.** `key` управляет 3D mesh variant (warden | predator) — все 6 backend archetypes пока mapped на warden mesh (predator mesh для legacy). `archetype` управляет glow color через `pickFighterColor` и принимает любой из 6 ids OR legacy key. Per-archetype 3D variants — Epic 5+ (см. `HANDOFF_FIGHTER_MODEL.md`).
- **`pickFighterColor` shared helper.** Extracted в `archetypeColors.js` — reuse в PitScene (captain + secondAgent glow) + FighterDetailScene (FD podium glow). Без хакерских local duplicates.
- **HUD↔orchestrator boundary (ownership shift).** Materialize-логика в Epic 4 переехала HudCreate → CreateView, симметрично паттерну 3Bb HudMatchmaking / MatchmakingView. HUD становится pure-presentation; orchestrator владеет scene + animation cancel handle. Pattern: HUD шлёт payload event, orchestrator решает side-effects.
- **`fetchAgent` state-check вместо throw.** Action глушит ошибки (`catch` без re-throw) — legacy AgentDetailView и trainAgent полагаются на этот контракт. Dynamic FD после await проверяет `store.state.agent.currentAgent?.id === key`; mismatch → redirect. Zero risk для legacy consumers.

**Расхождения с прототипом / ТЗ (осознанные):**

- **Step 5.5 добавлен за пределами initial ТЗ.** CanvasLayer строит PitScene один раз на AppV2 mount; `/v2/fd/:id` — child route, возврат не перестраивает сцену. Без Step 5.5 Create flow ломался на step «возврат в hub» — новый агент невидим до hard refresh. Static trace в Step 7 обнаружил баг; добавлен `refreshFighters` public API + watcher в CanvasLayer. Прецедент 3Ba Step 2 (тоже добавляли `unregisterScene` API вне initial ТЗ).
- **HudPit captain name bind — skipped.** ТЗ Step 2 §6 ссылался на `<span class="hp-name">YURII.VARVAROV</span>` в HudPit, в реальности этого элемента нет (v2 TopBar = Resources / PIT title / avatar). UI slot под captain name в hub требует design решения; отложен в Epic 5 polish.
- **`fetchAgents` в CanvasLayer, не PitViewV2.** ТЗ предполагал dispatch в PitViewV2, но scene строится в CanvasLayer; PitViewV2 держит только HUD. Перемещение правильнее семантически + CanvasLayer уже зависит от cross-sibling state через `useCanvasRef`/`useHoverState`.
- **`refreshFighters` atomic rebuild обоих slots.** Per-slot diff откладывается на Epic 5 polish. В текущей реализации captain disposes+rebuilds даже когда меняется только slot 2 — minor visual hiccup (idle phase reset). Refresh происходит пока pit невидим (user в CreateView/FD), так что пользователь hiccup не видит.
- **Duplicate name не enforce на backend.** Prisma schema не имеет `@@unique([ownerId, name])`. Step 3 sad path verify через roster overflow (достижимый 400). Name uniqueness — backend concern, carry-over в Epic 5.
- **Auto-promote first agent to captain.** Backend `POST /agent/create` не делает auto-captain (`captainService.setCaptain` вызывается только из `PUT /agent/:id/captain`). User Migration (`userMigrationService.js`) создаёт Fighter #1 с captain=true (lazy на `/me`) — покрывает реальных пользователей. Hypothetical 0-agent accounts остаются в edge case: новый агент не показывается в slot 2 (gate `captain ? agentsList[1] : null`). Fallback: legacy AgentDetail → Set as Captain → watcher → hub refresh.

**Deferred:**

- **4 недостающих fighter 3D variants** (analyst / ghost / sentinel / maverick / juggernaut). Все 6 archetype ids отображаются как warden mesh + meta-дифференциация через glow color. Per-variant proportions (shoulders / reach / stance / skin tone) — Epic 5+. Extension point в `makeFighterLowPoly(THREE, variantId)` + `onArchetypeChange` DI объект подготовлены.
- **Matchmaking real API filters.** Backend `matchmaking.js` не передаёт archetype/belt в очередях — только ELO rating. 3 фильтра в v2 HudMatchmaking (ELO delta / archetype / belt chips) не доедают до сервера. Требует backend changes, не v2-миграции.
- **Club Mode 1-6 agents вокруг ринга.** Прототип hardcode'ит 2 fighters; в Club Mode нужна новая абстракция на несколько containers + позиционирование. Не прототипировано.
- **Auto-promote first agent to captain для 0-agent accounts.** См. расхождение выше.
- **Branch columns real progression.** Dynamic agents сейчас рендерят mock level 0. Требует `agentProgression` endpoint audit + wiring в `HudFighterDetail.levels` computed.
- **Training task rewards persistence.** Сейчас декоративный текст без привязки к профилю (carry-over Epic 3Ba).
- **i18n для v2 HUD'ов.** `HudCreate`, `HudMatchmaking`, `HudTraining`, `HudFighterDetail` — английский inline без `t.*`. Пропашка на 11 локалей — Epic 5.
- **DRY рефакторы.** `buildOctagonalRoom(THREE, opts)` helper (Training/Matchmaking/Create scenes дублируют ~40 строк каждая), `createDustField()`, shared lighting setup.
- **Per-slot `refreshFighters` diff** (atomic rebuild smoothing). Сейчас оба slots rebuild'ятся при любом изменении.
- **HudPit captain name UI slot** + cleanup dead `MODAL_CONTENT.warden/predator` entries.

**Шаги и коммиты:**

| # | Commit | Что |
|---|--------|-----|
| 0 | — | pre-flight check (read-only) — verified backend VALID_ARCHETYPES 1-в-1 с v2 |
| 1 | `e20bb36` | useCreatedFighter composable stub |
| 2 | `3ca870a` | hub captain bind (slot 1) |
| 3 | `1e92456` | hub second agent slot |
| 4 | — | createAgent action verification (read-only, no commit) |
| 5 | `942641f` | create persistence + inline error |
| 5.5 | `4c31592` | hub fighters refresh on agentsList change (scope extension — Step 7 trace обнаружил критический bug) |
| 6 | `09a9112` | dynamic FD for any agent id |
| 7 | — | E2E regression (static trace, no commit) |
| 8 | this | CLAUDE.md + final report + handoff Epic 5 |

**Эпик 4 — CLOSED.** Route table `/v2` дополнена dynamic FD:

| Route | Epic | Статус |
|-------|------|--------|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + auto-refresh on mutations |
| `/v2/fd/warden` / `/v2/fd/predator` | 3A | ✅ legacy mocks сохранены |
| `/v2/fd/:uuid` | **4** | ✅ dynamic — cache one-shot OR fetchAgent with state-check |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ unchanged |
| `/v2/matchmaking` | 3Bb | ✅ filters still client-side mock (backend не поддерживает) |
| `/v2/create` | 3Bc + **4** | ✅ backend persist + inline error + navigation в new FD |

**Следующий эпик:** Epic 5 — план в `docs/visual-migration/HANDOFF_EPIC5_CHAT_HANDOFF.md`. Карта вариантов: polish (DRY + i18n + 4 fighter variants + UX edge fixes) / missing screens (Profile / Ratings / Clan / Shop на `/v2/*`) / matchmaking backend integration.

### Эпик 5 — Sub-Epic 5A — DRY helpers (✅ COMPLETE)

Завершён 2026-04-23. Первый sub-эпик Epic 5, база для 5B-5E. Extracted дублирующуюся логику из TrainingScene / MatchmakingScene / CreateScene в 2 shared helpers. 6 functional commits + 1 CORS infra commit + 1 backfill commit (final report + эта секция, created 2026-04-24 после 5B close — 5A изначально закрылся без final commits).

**Commit range:** `8e739ae` (Step 1) → `748b6ad` (Step 6) + `c8aba35` (CORS infra) + backfill commit (this).

**Что migrated:**
- `src/scene/objects/octagonalRoom.js` (54 строки) — `buildOctagonalRoom(THREE, scene, opts)` → `{ floor, walls }`. Floor disc + 8 planar walls + optional FogExp2. Scene owns material creation (concrete-texture `repeat` — shared Texture state). Params: `R=14, H=8, floorRadius, floorMaterial, wallMaterial, wallSegments=8, fogColor=0x070811, fogDensity, receiveShadow=true`.
- `src/scene/objects/dustField.js` (60 строк) — `createDustField(THREE, opts)` → `{ group, tick() }`. Zero per-tick allocations (positions Float32Array reused, только Y channel мутируется). Params: `count, xRadius, zRadius=xRadius, xOffset=0, zOffset=0, yMin=0.3, yMax, yInitSpread=yMax-yMin, driftSpeed, color, size=0.03, opacity=0.45`.

**Signature evolution:** original 5A plan имел scalar `xzRadius`. Step 4 surfaced Matchmaking asymmetric pattern (`xRadius=4 / zRadius=3` + `zOffset=-1` behind-terminal) + decoupled `yInitSpread`. Extended signature accepted в Step 4 с backward-compat defaults.

**Consumer inventory (4 sub-scenes):**

| Consumer | buildOctagonalRoom? | createDustField? | Источник |
|----------|---------------------|-------------------|----------|
| TrainingScene | ✅ Step 1 | ✅ Step 4 | 5A |
| MatchmakingScene | ✅ Step 2 | ✅ Step 5 (full extended signature) | 5A |
| CreateScene | ✅ Step 3 | ✅ Step 6 | 5A |
| ProfileScene | ✅ | ✅ | 5B (4-й consumer, подтвердил reuse ROI) |

PitScene — **permanent out-of-scope.** Ceiling + volumetric shafts + cage columns не соответствуют current helper contract.

**CORS infra (`c8aba35`):** `VERCEL_PREVIEW_RE = /^https:\/\/testhexlash-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$/` regex check в CORS origin callback. Unblock'ил 5A visual verify (preview URL'ы раньше не были в whitelist). Anchored + project-specific prefix — не generic wildcard. Применимо для всех Epic 5+ sub-эпиков.

**Bundle impact:** оба helper'а в shared ~2.71kb gzipped chunk, lazy-loaded для всех 4 consumers. Zero duplicate code, zero extra requests.

**Шаги и коммиты:**

| # | Commit | Что |
|---|--------|-----|
| 1 | `8e739ae` | add buildOctagonalRoom + migrate TrainingScene |
| 2 | `5d259b5` | migrate MatchmakingScene to buildOctagonalRoom |
| 3 | `ded72f2` | migrate CreateScene to buildOctagonalRoom |
| 4 | `c71903f` | add createDustField + migrate TrainingScene |
| 5 | `8333dc7` | migrate MatchmakingScene to createDustField |
| 6 | `748b6ad` | migrate CreateScene to createDustField |
| infra | `c8aba35` | CORS regex allowlist для Vercel previews |
| backfill | this | EPIC5_5A_FINAL_REPORT.md + CLAUDE.md section |

**Files changed:**
- `src/scene/objects/octagonalRoom.js` — **new** (54 строки)
- `src/scene/objects/dustField.js` — **new** (60 строк)
- `src/scene/scenes/TrainingScene.js` — −34 lines net (fog/floor/walls/dust inline blocks replaced)
- `src/scene/scenes/MatchmakingScene.js` — migrated (asymmetric params validation)
- `src/scene/scenes/CreateScene.js` — migrated (default-path parity)
- `backend/src/index.js` — VERCEL_PREVIEW_RE regex check (infra)

**Детали:** `docs/visual-migration/EPIC5_5A_FINAL_REPORT.md` (8 секций, включая §3 Technical details с full helper signatures + params matrices).

### Эпик 5 — Sub-Epic 5B — Profile (✅ COMPLETE)

Завершён 2026-04-23. Первая views-миграция Эпика 5 после 5A (DRY helpers). Клик по avatar-btn в hub TopBar → `/v2/profile` с 4-card HUD (Identity / Performance / Friends / Settings) поверх минимальной ProfileScene. Визуальный паритет с прототипом 4595-4715 (HUD) + 9335-9458 (3D scene). 10 функциональных + 2 hot-fix + 3 финальных коммита.

**Commit range:** `9d69473` (Step 1) → `ee977cb` (hot-fix 10.2).

**Что видит пользователь:**
- Click по avatar-btn в hub top-bar (правый верхний угол) → навигация на `/v2/profile`. Initials аватара — реальные `login.slice(0,2).toUpperCase()` из `master.userData` (hot-fix 10.2 убрал hardcoded 'YV').
- Октагональная тёмная комната (R=14, H=8) с пустым бетонным подиумом в центре, розовой волюметрической шахтой сверху, розовым additive-glow диском у основания, 70 тёплыми пылевыми частицами. Камера статичная (0, 2.6, 8) → (0, 1.4, 0) (без auto-orbit из прототипа 9537-9542 — user-confirmed).
- HUD: back btn + "Player / PROFILE" title + 2×3 grid 4 карточек:
  - **Identity** (top-left): avatar-initials 64px pink circle (2 chars из login), handle, meta "Joined MMM YYYY · N fights" из userData, 4 id-fields — Wallet (click: connected → copy в clipboard + "Copied!" 1.2s feedback, disconnected → ConnectWallet modal), Belt (BeltBadge sm + "{Color} Belt" / "Hexmaster"), Clan (name из `clan/getClanById` или "No Clan" / "In Clan" fallback), Email (master.email).
  - **Performance** (top-right): 6-cell stats-grid (Fights / Wins / Winrate% / ELO / Peak / Streak — последние два = 0 т.к. не трекаются) + "Achievements · N / 16" + 4×4 grid 16 achievement tiles с 3-letter abbrev (NEW/CON/REG/VET/COA/MST/REC/MAY/MTL/TYL/EXP/LCK/BOB/PPS/MEET/GRL), unlocked → pink-tint + pink border + hover glow.
  - **Friends** (row 2, spans both): search по handle + "+ Add" btn (stub до 5G) + 3 tabs (All / Online / Pending с live counts). Rows: avatar-initials + status-dot (online=green / in_fight=pink / offline=gray) + handle + "ELO N · Status" + actions. Pending → Accept/Decline; All/Online → Challenge (WS `challenge_send`, 10s cooldown, disabled if offline или pending) + Remove (confirm).
  - **Settings** (row 3, spans both): 11-lang picker (EN/RU/DE/ES/FR/PT/AR/HI/JA/KO/ZH) → `master/setLanguage` dispatch (4-step Vuex action per hot-fix 10.2); Sound toggle ↔ `punch/isMuted` commit; Build version через `__APP_VERSION__` / `__IS_PROD__`; Logout → `master/logout` (auto-disconnect WS + auth clear + router.push).
- Wallet modal: disconnected click → lazy-load ConnectWallet (8.7kb shared chunk, dynamic import) → `openModal()` via defineExpose → Teleport backdrop + connector list. После успешного connect → `useAccount(address)` watch → `master/updateMaster({ walletAddress })` → Wallet id-field flip'ается на short-address (clickable для copy).
- Mobile (`@media max-width: 720px`): 1-column stack, Settings blocks тоже стекаются.
- Back / Esc → `/v2`.

**Дерево новых файлов (4):**

```
src/views-v2/ProfileView.vue                     —  82 строки — orchestrator: lazy registerScene('profile') + activateScene + Back/Esc + resize. Teardown order: activateScene('pit') → unregisterScene → dispose (3Ba/3Bb/3Bc parity).
src/scene/scenes/ProfileScene.js                 — 164  — минимальная сцена: buildOctagonalRoom (5A helper, R=14 H=8 fogDensity=0.045) + lighting (Ambient + Hemi + warm key spot с castShadow + pink rim spot) + pink shaft (ConeGeometry 1.4×7 additive) + canvas-radial-gradient floor disc (PlaneGeometry 2.6×2.6 additive) + concrete podium (CylinderGeometry 1.0/1.1/0.20/32 castShadow) + createDustField (5A helper, 70 warm particles).
src/components/hud/HudProfile.vue                — 615 — 4-card HUD: Identity / Performance / Friends (с полной WS challenge интеграцией) / Settings. Бóльшая часть логики живёт здесь (store bindings, friends polling, lazy ConnectWallet mount, wagmi watch). **Candidate для splitting** в 5G polish (над soft-300 limit).
src/styles/v24/profile.css                       — 552 — 1-to-1 port прототипа 1667-2105, scoped `.app-v2`. 80+ правил: layout / Identity / Stats / Achievements / Friends (включая 1667-1819 диапазон для `.fc-*`) / Settings / mobile-stack. Hot-fix добавил `.fc-action-btn:disabled` + `.fc-add-notice` + `.ifv.wallet.disabled` + `.ifv.belt-value`.
```

**Изменены (3):**

- `src/router/index.js` — route `V2Profile` (`/v2/profile`) добавлен в `v2Routes.children`.
- `src/views-v2/PitViewV2.vue` — `click.id === 'avatar'` → `/v2/profile` (defensive, реально avatar-click через TopBar→HudPit не через useClickState).
- `src/components/hud/HudPit.vue` — (a) Step 1 убрал `MODAL_CONTENT.avatar`, (b) hot-fix 10.1 переключил `<TopBar @avatar-click>` с `openPhModal('avatar')` (no-op после удаления контента) на прямой `router.push('/v2/profile')`.
- `src/components/hud/common/TopBar.vue` — hot-fix 10.2 заменил hardcoded `<span>YV</span>` на реактивный `{{ avatarInitials }}` из `master.userData.login`.
- `src/components/fragments/profile/wallet/ConnectWallet.vue` — **+1 line** `defineExpose({ openModal })`. Additive augmentation — legacy ProfileWallet.vue consumers не затронуты (они не используют ref-доступ).
- `src/styles/hexlash-v24.css` — `@import './v24/profile.css'` после create.css.

**Ключевые паттерны:**

- **Lazy sub-scene** симметрично Training / Matchmaking / Create: CanvasLayer singleton построен в AppV2 mount; `/v2/profile` входит — `buildProfileScene` + `registerScene('profile')` + `activateScene('profile')`. Unmount — `activateScene('pit')` ДО dispose, затем `unregisterScene` + `dispose`. Без этого порядка renderLoop тронет freed scene.
- **5A helper reuse — 4-й consumer** для обоих `buildOctagonalRoom` и `createDustField`. Profile — первая миграция после 5A CLOSED, валидирует что helpers работают с новыми параметрами (`fogDensity: 0.045`, `count: 70`, `color: 0xffd9c8`, `opacity: 0.4` override). Vite объединил оба helper'а в один 2.71kb shared chunk для 4 consumer'ов.
- **Captain belt public UI** — Identity card читает `userData.captain.belt` + `userData.captain.isHexmaster` (per CLAUDE.md §Captain in Public UI). Fallback `0` / `false` если captain отсутствует. Совместимо с существующим `getCaptainPublicInfo` / `getCaptainsForUsers` bulk API.
- **i18n через Vuex action `master/setLanguage`** (hot-fix 10.2, legacy `ChangeLanguage.vue` parity). Action делает 4 шага: `setLocaleLanguage` (currentLanguage ref + localStorage) + `commit('updateMaster', { language })` + `updateMasterToLocalDB` + `masterService.changeProfile` (backend sync). Direct `setLanguage()` call обновлял только шаг 1, оставляя Vuex-derived getters stale. Bug проявлялся как "language switch требует logout/login".
- **Wagmi `useAccount()` watch** для master.walletAddress sync. Легаси `ProfileWallet.vue:41-47` делает это, но mounted только на `/profile/wallet`. V2 user connecting из `/v2/profile` без этого watcher'а остался бы с stale walletAddress. Паттерн: `watch(wagmiAddress, () => dispatch('master/updateMaster', { walletAddress }))` с `current === next` guard против no-op dispatches.
- **Lazy modal reuse verbatim** — `ConnectWallet.vue` загружается через dynamic `import()` + `shallowRef` + `markRaw`. `defineExpose({ openModal })` в ConnectWallet (1-line augmentation) экспонирует метод модалки. Source layout рендерится с `style="display: none"` — модалка через Teleport в `body` работает как задумано. Bundle benefit: Legacy ProfileView chunk **−11.21kb** (ConnectWallet extracted в shared 8.7kb chunk, shared с v2).
- **Realtime friend status poll** — 5s интервал (легаси делал 1s, ослабил). Опирается на WS push `friend_status` как primary source, poll как safety net.
- **Hardcoded 16 ACHIEVEMENT_TILES** с маппингом `type → abbr` per прототип 4647-4662. Не использую `store.getters['achievement/getAllAchievements']` для display — только для unlocked-state mapping через `userData.achievements` (проще чем legacy ProfileAchievements.vue с его carousel/v-tooltip/sort logic).

**Store reuse (17 paths, 0 new Vuex actions):**

| Feature | Store path | Mechanism |
|---|---|---|
| Current user | `master/getMaster` | computed ref |
| Email | `master.email` (top-level, не userData) | masterModel.fromJSON peels это из /me response |
| Wallet sync | `master/updateMaster` | action, legacy ProfileWallet parity |
| Language switch | `master/setLanguage` | 4-step action (hot-fix 10.2) |
| Logout | `master/logout` | WS disconnect + clearAuth + router.push |
| Clan name lookup | `clan/getClanById(id)` | cached lookup с API fallback |
| Friends list | `friends/getFriends`, `friends/onlineFriendsCount` | getters |
| Friend requests | `friends/getIncomingRequests` | getter |
| Init / polling | `friends/init`, `friends/loadFriends`, `friends/loadIncomingRequests` | REST actions |
| Accept/Decline | `friends/acceptFriendRequest`, `friends/declineFriendRequest` | REST actions |
| Remove friend | `friends/removeFriend` | REST action |
| Challenge send | `friends/sendChallenge` | WS `challenge_send` через `webSocket/sendMessage` |
| Challenge cooldown | `friends/hasPendingChallenge` | getter (10s timeout guard) |
| Sound toggle | `punch/isMuted` getter + `punch/setMuted` mutation | direct commit |
| Achievement unlock state | `userData.achievements[].isCompleted` (inline из /me) | set-based lookup |

**Deferred (carry-over items, не закрываются в 5B):**

| # | Item | Target | Severity |
|---|---|---|---|
| 1 | **ChallengeNotification widget скрыт на `/v2/*`** (App.vue line 35 `v-if="!isV2Route"`). V2 users не видят incoming challenge toast. Step 8 только **sends** challenges. | Отдельный **PvP-integration sub-epic** (НЕ 5G polish) — cross-wire legacy global notifications в v2 HUD | Functional |
| 2 | **`challenge_start` routing** → legacy `/fight?mode=pvp` в `pvpHandler`. V2 sender после accept приземляется на legacy Fight view. | Тот же PvP-integration sub-epic | Functional |
| 3 | **Disconnect UI не в v2** — ConnectWallet в v2 показывает только modal с connector list (disconnected state). Для disconnect юзер идёт в legacy `/profile/wallet`. | 5G polish либо Step 10.5 follow-up | UX |
| 4 | **ELO source** = `userData.rating` (frozen legacy per CLAUDE.md §Captain in Arena). Правильнее `userData.captain.elo` (актуальное). | 5G polish | Data accuracy |
| 5 | **"+ Add" full player-search UI** — сейчас stub с ephemeral notice "Full player search lands in Sub-Epic 5G" 3s. | 5G polish | UX |
| 6 | **Referral shortcut** (share-иконка в Identity card) — pre-deferred Step 6. | 5G polish | UX |
| 7 | **Skins tab** в Profile — отсутствует в прототипе. | Sub-Epic 5E `/v2/shop` | Feature |
| 8 | **Account management** (email / password / login change, delete account) — отсутствует в прототипе. | Skip permanently | Scope |
| 9 | **Guest profile** `/v2/profile/:login` — только own profile в v2, legacy `/user/:login` остаётся для чужих. | Polish if needed | Scope |
| 10 | **i18n для v2 HUD** — inline EN строки в HudProfile / HudPit / HudTraining / HudMatchmaking / HudCreate / HudFighterDetail / HudFight. Language switch НЕ влияет на v2 визуально до 5F. | **Sub-Epic 5F** (documented Step 0 correction) | Feature |
| 11 | **HudProfile.vue 615 строк** (над soft-300). Candidate для splitting в 4 sub-components (ProfileIdentity / ProfilePerformance / ProfileFriends / ProfileSettings). | 5G polish | Code quality |

**Bugs fixed in hot-fixes 10.1 + 10.2:**

- **10.1-1** Avatar click → `/v2/profile` не работал. Step 1 удалил `MODAL_CONTENT.avatar` но оставил TopBar binding на `openPhModal('avatar')` → no-op early-return. Fix: `<TopBar @avatar-click="onAvatarClick" />` → `router.push('/v2/profile')` в HudPit напрямую. PitViewV2 click watcher остался как defensive fallthrough (не триггерится — avatar не 3D-pickable).
- **10.1-2** Joined date rendered as raw ISO string. `masterModel.fromJSON` не оборачивает userData через UserModel constructor (`createdAt = new Date(...)`), `master.userData.createdAt` — raw string. `String.prototype.toLocaleString(locale, opts)` игнорирует opts. Fix: explicit `new Date(raw)` + NaN guard в `joinedText` computed.
- **10.2-1** Hub avatar hardcoded "YV". Epic 2 era placeholder в TopBar.vue. Fix: `avatarInitials` computed из `master.userData.login` — симметрично Identity card Step 6 initials logic.
- **10.2-2** Language switch требовал logout/login. Legacy `ChangeLanguage.vue:29-30` диспатчит Vuex `master/setLanguage` (4-step atomic action). Step 9 v2 код вызывал `setLanguage()` direct — обновлял только `currentLanguage` ref + localStorage (шаг 1 из 4). Vuex-derived `master/getLanguage` getter оставался stale, backend не уведомлён. Fix: `store.dispatch('master/setLanguage', code)` — все 4 шага через action. `setLanguage` direct-import удалён из HudProfile.

**Шаги и коммиты:**

| # | Commit | Что |
|---|---|---|
| 1 | `9d69473` | stubs + route /v2/profile + avatar redirect |
| 2 | `2143540` | ProfileScene scaffold (fog/room via 5A helper) |
| 3 | `30fdc0e` | lighting + pink shaft + disc + dust field |
| 4 | `806e00b` | empty podium (3D layer complete) |
| 5 | `bbc9f5b` | HudProfile skeleton + profile.css (512 lines) |
| 6 | `133deb3` | Identity card (avatar + handle + meta + 4 id-fields) |
| 7 | `e6436dc` | Performance card + 16 achievements grid |
| 8 | `2a81f00` | Friends card with WS challenge integration |
| 9 | `1e9e65f` | Settings card (lang / sound / build / logout) |
| 10 | `3813738` | ConnectWallet modal integration (lazy + wagmi sync) |
| hot-fix 10.1 | `d17fc9e` | avatar click routing + joined date format |
| hot-fix 10.2 | `ee977cb` | hub avatar initials + language switch Vuex action |
| 11 | — | regression test (no commit) |
| 12 | this | CLAUDE.md Sub-Epic 5B section |
| 13 | next | EPIC5_5B_FINAL_REPORT.md |
| 14 | next | HANDOFF_EPIC5_5C_CHAT_HANDOFF.md |

**Sub-Epic 5B — CLOSED.** Route table `/v2/*` обновлена:

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + auto-refresh on mutations |
| `/v2/fd/warden` / `/v2/fd/predator` | 3A | ✅ legacy mocks сохранены |
| `/v2/fd/:uuid` | 4 | ✅ dynamic — cache one-shot OR fetchAgent with state-check |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ (5A migrated to `buildOctagonalRoom` + `createDustField`) |
| `/v2/matchmaking` | 3Bb | ✅ filters still client-side mock (5A migrated) |
| `/v2/create` | 3Bc + 4 | ✅ backend persist + inline error (5A migrated) |
| `/v2/profile` | **5B** | ✅ 4-card HUD + lazy ConnectWallet + WS friend challenges |

**Bundle bonus** (positive side-effect, не scope): Legacy `ProfileView.js` chunk **−11.21kb** (69.60 → 58.39kb) — ConnectWallet extracted в shared lazy chunk (8.70kb), работает для обоих `/profile/wallet` (legacy) и `/v2/profile` (new). Infrastructure cleanup без намеренной работы.

**Следующий sub-epic:** 5C — `/v2/ratings` (per HANDOFF_EPIC5 §4 Вариант B list: Profile → Ratings → Clan → Shop). Pre-flight готов в handoff: ~693 строк legacy `RatingsView.vue`, 4 таба (MyClub/Clubs/Fighters/Agents).

### Эпик 5 — Sub-Epic 5C — Ratings (✅ COMPLETE)

Завершён 2026-04-24. Вторая views-миграция Эпика 5. Клик по ratings plinth в hub → `/v2/ratings` с unified leaderboard HUD (5 scope tabs + season toggle + search + sticky your-row) поверх lazy RatingsScene. Визуальный паритет с прототипом 4767-4819 (HUD) + 10060-10200 (3D scene). 10 functional + 2 follow-up + 1 hot-fix + 2 skipped (no-op) + 3 финальных коммита.

**Commit range:** `8d25c14` (Step 1) → `e8ab71c` (hot-fix 10.1). Designated branch `claude/implement-ratings-endpoint-4BPEk` (run-local). Predecessor — ветка `claude/hexlash-visual-migration-epic5-DV1oX` (5A+5B run). Merge target — `visual-v2` (в конце Epic 5).

**Что видит пользователь:**
- Click на ratings plinth в hub → navigate `/v2/ratings`.
- Октагональная тёмная комната (R=16, H=9, fogDensity=0.055, floor 0x1c1c24, walls 0x0e0e16) — темнее Profile ("tomb of rankings" mood). В глубине на z=-3 octagonal ring silhouette (ExtrudeGeometry 8-vertex shape, raR=2.5, depth 0.25, bevel 0.04) с 8 brushed-steel posts (CylinderGeometry 0.05/0.06/1.6) по вершинам.
- 3 spotlights (warm key 1.4, pink rim left 1.2, gold rim right 0.9 — rims удвоены от prototype per user visual verify), volumetric shaft (ConeGeometry 2.0×6 additive opacity 0.045), 60 dust particles (warm 0xffd9c8, opacity 0.3, zOffset -2 toward ring). Camera static (0,3,9) → (0,1.6,0), no auto-orbit (5B parity).
- HUD: back btn + title "Hexlash / LEADERBOARD" + season tabs Season 1 / All Time (top-right) + central panel:
  - Toolbar: 5 scope tabs (Global / Friends / Clan / Country / Live) с active pink border + search input (debounced 200ms).
  - Table: thead (8 cols: # / Handle / Archetype / Belt / ELO / W/L / WR / Streak) + tbody rows.
  - Rows: rank с gold/silver/bronze для #1-3, archetype colored per `arch-tag-{shortId}` (reuse из create.css), belt name, ELO с toLocaleString, W/L, WR good (≥60 green) / bad (<45 red), Streak hot (≥5W pink glow) / dash.
- Sticky your-row pre-footer: captain data из `master.userData.captain.{elo,belt,primaryModule}` + `userData.login` + flat `userData.wins`/`losses`. Null-safe: hidden если captain отсутствует. Streak всегда `—` (не трекается в UserModel).
- "Next rank: +N ELO to reach top M" computed. Если myRank ≤ 10 — "Top 10 reached". Structured `{ kind, eloDiff, targetRank }` вместо regex-string split.
- Scope/season/search — client-side mock (10 datasets = 5 scopes × 2 seasons, Mulberry32 seedable RNG).
- Mobile (`@media max-width: 720px`): drop cols arch/belt/wl/streak, toolbar column-stack.
- Back / Esc → `/v2`.

**Дерево новых файлов (4):**

```
src/views-v2/RatingsView.vue            —  83 строки — orchestrator: lazy scene + listeners + strict teardown (5B parity). Identical structure + size to 5B ProfileView.
src/scene/scenes/RatingsScene.js        — 193 — octagonal room (R=16 H=9 via 5A buildOctagonalRoom — 5th consumer) + 3 spotlights + shaft + ring silhouette (ExtrudeGeometry) + 8 posts + 60 dust particles (via 5A createDustField — 5th consumer). Local consts RA_ROOM_R=16 / RA_ROOM_H=9 (internal only, re-exports removed Step 4 cleanup).
src/components/hud/HudRatings.vue       — 300 — HUD + 5 scope tabs + 2 season tabs + debounced search (200ms) + v-for rows + sticky your-row bound to master.userData.captain. Includes archetypeIdShort + archetypeName + beltLabelShort helpers inline. Scoped `<style>` block added in hot-fix 10.1.
src/styles/v24/ratings.css              — 386 — 1-to-1 port прототипа 2326-2590 scoped `.app-v2`, 12 sections. `.arch-tag-{id}` skipped — reuse из create.css (Correction 3 from Step 0 pre-flight).
src/data/ratingsMock.js                 —  91 — Mulberry32 seedable RNG + 10 datasets (5 scopes × 2 seasons × generateLeaderboard). Client-side mock до PvP-integration sub-epic.
```

**Изменены (4):**

- `src/router/index.js` — `V2Ratings` route (`/v2/ratings`) в `v2Routes.children`.
- `src/views-v2/PitViewV2.vue` — `PH_MODAL_IDS` стал `['clan', 'shop']`; explicit branch `click.id === 'ratings' → router.push('/v2/ratings')` добавлен в click watcher (перед PhModal fallback, после training/matchmaking/create/avatar).
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.ratings` entry удалён. Остались entries: `clan`, `shop`, `warden`, `predator` (последние два — legacy mock fallthrough, status unclear — deferred #10 для 5G).
- `src/styles/hexlash-v24.css` — `@import './v24/ratings.css'` после `./v24/profile.css`.

**Store reuse (0 new Vuex modules, 0 new actions):**

| Feature | Store path | Mechanism |
|---|---|---|
| Current user | `master/getMaster` | computed ref |
| Captain data | `master.userData.captain.*` | direct (belt, isHexmaster, elo, primaryModule) per §Captain in Public UI |
| Handle | `master.userData.login` | direct |
| W/L totals | `master.userData.wins` / `master.userData.losses` | **flat** (not `.stats` — ТЗ §11.3 shape error, see §5 Расхождения) |
| Belt display | `getBeltDisplay(grade)` from `@/utils/beltDisplay.js` | utility reuse (5B precedent) |

**Ключевые паттерны:**

- **Lazy sub-scene симметрично 5B Profile.** `buildRatingsScene` + `registerScene('ratings')` + `activateScene('ratings')` в `onMounted`. Teardown — `activateScene('pit')` → `unregisterScene` → `dispose` (строгий порядок). RatingsView.vue 83 lines identical size to 5B ProfileView.vue.
- **5A helpers — 5-й consumer** для обоих `buildOctagonalRoom` и `createDustField`. Validate reuse pattern за пределами 4 consumer'ов 5A+5B. Helpers stable.
- **Path A (prototype-first).** Legacy RatingsView табовая структура (MyClub/Clubs/Fighters/Agents) НЕ переносится в v2. Новая ментальная модель — unified leaderboard + 5 scope filters per prototype 4767-4819. Legacy `/ratings/*` route остаётся параллельно (693 строк, не тронут).
- **Client-side mock data (Mulberry32).** `src/data/ratingsMock.js` — seedable RNG + 10 pre-generated datasets. Prototype 10218-10272 verbatim port. Real API wiring → PvP-integration sub-epic. Rationale: 5C scope — визуал, API wiring отвлекает.
- **Short-ID vs full-name archetype bridge.** Mock data hardcodes short IDs (`'pre'`, `'ana'`, ...) matching `arch-tag-{id}` CSS classes в create.css (Correction 3 reuse). Real `master.userData.captain.primaryModule` — full name (`'predator'`). `archetypeIdShort()` / `archetypeName()` helpers inline в HudRatings.vue (Correction 4 from Step 0) bridge обе directions.
- **Null-safe your-row.** `v-if="yourRow"` — hide entirely если `master.userData.captain` отсутствует (0-agent accounts / lazy User→Fighter migration not yet run). 99% accounts имеют captain через Fighter #1 migration. 0-agent UX не broken — leaderboard сверху остаётся.
- **DOM MODAL_CONTENT vs 3D raycast — оба path обработаны** (урок 5B #2 применён). Step 0 pre-flight grep'нул оба. Step 1 edit'ы закрыли оба path одним коммитом.
- **Structured `nextRankHint`.** Original ТЗ §11.3 использовал `{ text: string }` + regex split в template (`String.match(/\+(\d+)/)?.[1]`) — уродливо. Финал: structured `{ kind: 'top10' | 'climb', eloDiff, targetRank }`, template branch по `kind`. Clean Vue idiom.

**Расхождения — осознанные:**

- **5.1 Path A decision** — legacy табовая структура не переносится, новая модель. Legacy `/ratings/*` остаётся параллельно.
- **5.2 Client-side mock** — real API wiring отложен в PvP-integration. 10 datasets (5 scopes × 2 seasons) Mulberry32 seeded.
- **5.3 Rim intensity bump от prototype.** Prototype 10142-10158 использует pink 0.6 + gold 0.45 — на target hardware на Vercel preview они почти не читаются на dark backdrop (wall `0x0e0e16` + fog 0.055 + low intensity × wide beam angle). Удвоены до 1.2 / 0.9 по user visual verify (Step 5 follow-up `0d237a8`). Аналогично precedent'у Epic 3A toneMapping tuning — prototype values откалиброваны под другую scene density, target hardware требует adjustment.
- **5.4 ТЗ §11.3 shape error.** Prompt spec'ал `master.userData.stats.{wins, losses, streak}` — factual UserModel shape: flat `userData.wins` / `userData.losses` (no nested `.stats`, no `.streak` tracking). Pre-verified через grep HudProfile 5B pattern + UserModel. Null streak → `—` display fallback. Real streak tracking → PvP-integration sub-epic.
- **5.5 Streak inconsistency mock vs real.** Leaderboard rows содержат streak (Mulberry32 генерит 0-8W/L), your-row всегда `—`. Subtle visual inconsistency ("у всех есть, у меня нет") — не bug, honest UI state: UserModel не трекает streak. Correction → PvP-integration.
- **5.6 Hot-fix 10.1 — HUD pointer-events missing.** HudRatings.vue shipped без `<style scoped>` block (Step 6 markup port skipped it — not in TZ §9.3 spec). All clicks broken + sticky row mis-anchored к `.ratings-view`. Fix: 2-rule scoped block (`.ratings-hud { position: absolute; inset: 0; pointer-events: none; } > * { pointer-events: auto }`) — identical к 5B HudProfile line 618 pattern. Single commit `e8ab71c`. See also: HANDOFF 5D urok #12.
- **5.7 Steps 9 + 10 skipped — no-op.** Step 9 (season polish): Step 7 уже реализовал reactive season toggle корректно, verify'фильтр прошёл без code changes. Step 10 (mobile + polish): Step 6 CSS port уже включил `@media max-width: 720px` block + rank-1/2/3 highlights + WR good/bad + streak hot + rt-empty — все edge cases prototype-correct. Traceable step numbering сохраняется.
- **5.8 Local `npm install` в Step 1.** node_modules отсутствовали в designated branch initial state. Package-lock.json не менялся, новых зависимостей не добавлено. Environmental concern, не scope — будущий 5D run на новой ветке, возможно, потребует повторить.

**Bugs fixed (hot-fix 10.1):** HudRatings.vue `<style scoped>` pointer-events block + root positioning. Single commit. Verified через grep + user visual verify → клики + sticky row восстановлены.

**Deferred (carry-over, не закрываются в 5C):**

| # | Item | Target | Severity |
|---|---|---|---|
| 1 | Real ratings API wiring (5 scope filters, season data, backend search) — сейчас client-side mock | PvP-integration sub-epic (после 5G) | Functional |
| 2 | `AgentLeaderboard.vue` dead code cleanup (Step 0 подтвердил только docs refs + one src file unused в current flow) + stale CLAUDE.md "Agent Rankings + Leagues (ТЗ-26)" секция | 5G polish | Cleanup |
| 3 | Live tab realtime indicator (pulsing dot) — если WS push `ratings_live` доступен | PvP-integration или 5G | UX |
| 4 | "Next rank" logic beyond decile (current: naive "top M threshold - my ELO") — real tier progression (Bronze/Silver/.../Champion) | 5G polish | UX |
| 5 | HudRatings.vue 300 lines > soft-300 — splitting candidate (script/template/style split или component extract) | 5G polish | Code quality |
| 6 | LocalStorage persist season/scope choice между навигациями | 5G polish | UX |
| 7 | i18n inline EN strings (scope tab labels, season labels, "Next rank", placeholders) | 5F i18n pass | Feature |
| 8 | MyClubTab.vue — нет src-ссылок (только docs/handoff) — подозрение на dead code; подтвердить extended grep в 5G | 5G polish | Cleanup |
| 9 | Unused const re-exports в ProfileScene.js (`PR_ROOM_R` / `PR_ROOM_H`) — dead surface inherited from 5B | 5G polish | Cleanup |
| 10 | `MODAL_CONTENT.warden` + `.predator` в HudPit — status unclear. Found during Step 11 regression. Если stale (Epic 2-3 artifacts) — cleanup candidate. Если active (hub показывает PhModal на plinth click) — не трогать | 5G polish | Cleanup candidate |
| 11 | Real streak tracking (UserModel не имеет `.streak` — your-row всегда `—`) | PvP-integration | Feature |

**Шаги и коммиты (10 functional + 2 follow-up + 1 hot-fix + 2 skipped + 3 final):**

| # | Commit | Что |
|---|---|---|
| 1 | `8d25c14` | route + entry switch + stubs |
| 1 follow-up | `5008af3` | Esc listener in RatingsView stub (UX gap Steps 1-5) |
| 2 | `fcdfe4f` | RatingsScene scaffold (5A buildOctagonalRoom — 5th consumer) |
| 3 | `69a317a` | lighting + shaft + dust (5A createDustField — 5th consumer) |
| 4 | `fd082bc` | distant ring silhouette + 8 posts + cleanup RA_ROOM_R/H re-exports |
| 5 | `4dd4bc9` | view orchestrator with lazy scene lifecycle |
| 5 follow-up | `0d237a8` | bump rim intensities (pink 0.6→1.2, gold 0.45→0.9) |
| 6 | `39d1d6e` | HUD skeleton + ratings.css port (386 lines, `.arch-tag-*` reuse from create.css) |
| 7 | `f06f7e4` | scope tabs + search + mock leaderboard (ratingsMock.js + reactive state) |
| 8 | `57d77ca` | sticky your-row bound to captain data (null-safe, shape corrections applied) |
| 9 | — skipped | season polish no-op (verified post-Step 7, no code change) |
| 10 | — skipped | mobile + polish no-op (all edge cases ported in Step 6) |
| hot-fix 10.1 | `e8ab71c` | HUD pointer-events + root positioning (missing `<style scoped>` block) |
| 13 | this | CLAUDE.md Sub-Epic 5C section |
| 14 | next | EPIC5_5C_FINAL_REPORT.md |
| 15 | next | HANDOFF_EPIC5_5D_CHAT_HANDOFF.md |

**Sub-Epic 5C — CLOSED.** Route table `/v2/*` обновлена:

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + auto-refresh |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ FD (legacy mocks + dynamic) |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ (5A migrated) |
| `/v2/matchmaking` | 3Bb | ✅ (5A migrated) |
| `/v2/create` | 3Bc + 4 | ✅ backend persist |
| `/v2/profile` | 5B | ✅ 4-card HUD + lazy ConnectWallet + WS friends |
| `/v2/ratings` | **5C** | ✅ unified leaderboard (5 scope × 2 season mocks) + sticky your-row + lazy RatingsScene + 5A 5-й consumer both helpers |

**Следующий sub-epic:** 5D — CLOSED (см. ниже).

### Эпик 5 — Sub-Epic 5D — Clan View (✅ COMPLETE)

Завершён 2026-04-25. Третья views-миграция Эпика 5 после 5B (Profile) + 5C (Ratings). Клик по clan plinth в hub → `/v2/clan` с 2-state HUD (no-clan browse + Create CTA / in-clan header + roster + actions) поверх lazy ClanScene. Визуальный паритет с прототипом 4887-4981 (HUD) + 10860-10998 (3D scene). Step 5 потребовал 5 hot-fix attempts на ложной траектории (lighting tuning) перед prototype port + exposure 2.3 retune фикс на правильной; финальный Step 5 hot-fix #5 emissive accents revert via `git checkout e287a3f -- file` (atomic single-file checkout вместо sequential `git revert × 6` который сломался на overlapping conflicts).

**Commit range:** `ecedd20` (Step 1) → `4b5e105` (Step 8). Plus 11 mid-epic hot-fix / augmentation commits задокументированы в `docs/visual-migration/EPIC5_5D_FINAL_REPORT.md`.

**Routes:** `/v2/clan` (HudClan + ClanScene). Legacy `/clan/:id` retained — fragments reused without duplication.

**Files (new):**
- `src/views-v2/ClanView.vue` — 80 строк orchestrator (lazy scene + HudClan, 5B/5C parity).
- `src/components/hud/HudClan.vue` — ~410 строк, 2-state HUD (no-clan / in-clan).
- `src/scene/scenes/ClanScene.js` — 145 строк, 3D scene (octagonal hall, 3 flag totems, dust).
- `src/scene/objects/clanFlag.js` — 86 строк, flag totem factory (pole + cloth canvas texture, no colorSpace override per codebase convention).
- `src/styles/v24/clan.css` — 473 строки, scoped `.app-v2`, port prototype 2899-3392 в 3 commits.
- `src/data/clanMock.js` — 36 строк, BROWSABLE_CLANS (6) + MY_CLAN_MEMBERS (14) — port prototype 11001-11024 verbatim.

**Reused legacy (augmented, не duplicated):**
- `src/components/fragments/clan/CreateClan.vue` — `defineExpose({ openModal })` + v2-aware navigation (`path !== '/v2/clan'` conditional перед `router.push('/clan/:id')`).
- `src/components/fragments/clan/ClanEdit.vue` — same pattern + dissolve flow v2-aware.
- `src/components/fragments/clan/ClanConfirmModal.vue` — used as-is (controlled-props, defineExpose не нужен).

**Vuex:** namespaced `clan/` module — getters `getClanById`, `getClanRatingsList`; actions `getClanById`, `createClan`, `leaveClan` (no args — uses current user's clan), `deleteClan` (no args).

**Camera + lighting (5D specific, prototype port + exposure 2.3 compensation):**
- FOV **42** (prototype-first per Q1, diverges Profile FOV 40 / Ratings FOV 44), pos `(0, 2.6, 7.5)`, `lookAt(0, 1.6, 0)`, orbit sin sway в tick.
- Floor `0x20202a`, walls `0x0e0e18`, fog 0.05 — все verbatim prototype.
- Key spot `0xfff0e8 × 1.2` (retuned from prototype 1.6 для exposure 2.3) at `(0, 7, 2)` → target `(0, 2.5, 0)`; cone **π*0.35** (widened from prototype π*0.25 для outer flag readability — lesson #21).
- **2 rim spots** — pink left (`0xff066f × 0.25`) + gold right (`0xD4A843 × 0.2`). Clan identity = 2 rims, не 1 как Profile.
- Dust 60 particles, xRadius 5, zRadius 4, yMax 4.3, color `0xffd9c8`, opacity 0.3.
- 3 flag totems via `makeClanFlag` factory: PRED pink `#ff066f` @ x=-3.5 / IRW gold `#D4A843` @ x=0 / ANA cyan `#4dd9ff` @ x=+3.5.

**Step 5 hot-fix narrative (false trail → correct port):**
Visual readability в Step 5 потребовал 5 sequential hot-fix attempts (`f68846c` follow-up → `4ba9ee0` ambient/hemi/rim → `b424c2b` light targets → `824198c` Profile-clone lighting → `032f74e` camera tilt + floor/wall colors → `be0e563` emissive accents) — all chased wrong target (lighting / material / camera tuning). Diagnostic `debug/5d-h1-emissive` (commit `dd05fbe`, branch since deleted) confirmed H1: composition issue, не lighting. После atomic revert (`51c3752` via `git checkout e287a3f -- file` — sequential `git revert --no-commit × 6` failed на overlapping conflicts), correct port применён (`f26d53f`): prototype values verbatim, intensities ~50% retune для exposure 2.3 compensation. Plus `f88fbf7` fine-tune key cone π*0.25 → π*0.35 + intensity 0.8 → 1.2 + ambient 0.3 → 0.4 для outer flag readability.

**Hot-fixes Step 7+8:**
- `702b341` — display:none gotcha на lazy CreateClan host. Vuetify VModal Teleport visibility cascade блокируется ancestor display:none **despite** markup teleporting к body. Lesson #23.
- `1255898` — CreateClan v2-aware navigation conditional (`router.push('/clan/:id')` теперь skip'ится когда `currentRoute.path === '/v2/clan'`). Lesson #24.
- `21949f8` — ClanEdit prep — defineExpose + v2-aware dissolve conditional (`router.push('/ratings/clans')` same skip).
- `4b5e105` — in-clan body (header + side + roster) + ClanEdit lazy reuse + Leave confirm via ClanConfirmModal + MY_CLAN_MEMBERS.

**Lessons added (#19-24):**

- **#19** Exposure compensation FIRST. При port'е prototype scenes в v2 — сравнить `renderer.toneMappingExposure` prototype vs v2 (1.05 vs 2.3 в нашем случае) перед любой lighting tune. Prototype values verbatim + exposure compensation = single source of truth, не "Profile parity tune". Frankenstein-mode (Step 5 hot-fix series) cost 5 commits + 5 visual verifies до того как корректный port был обнаружен.
- **#20** Renderer settings delta как primary diagnostic. Exposure / tonemapping / colorspace mismatches accountfor major fraction of "не выглядит как prototype" issues. При visual readability ambiguity — first compare prototype renderer vs v2 CanvasLayer settings, не tune lighting blindly.
- **#21** Cone-angle adjustments belong в exposure compensation toolkit вместе с intensity scaling. Exposure boost изменяет light falloff geometry для off-axis geometry (multiple posts / fighters / pillars away from origin) — cone width должна следовать boost иначе off-cone geometry падает в ambient-only lighting.
- **#22** Pre-commit grep для HUD scoped style должен включать **literal selector ↔ template root class match check**, не только `<style scoped>` block existence. Sample bash:
  ```
  root_class=$(grep -oP 'class="hud \K[^"]+' src/components/hud/HudX.vue)
  grep "\.${root_class} {" src/components/hud/HudX.vue || echo "MISMATCH"
  ```
  Step 1 stub `ecedd20` shipped scoped target `.hud-clan` ≠ template `.clan-hud` (typo) — formally passed "block exists" check, functionally broken (pointer-events never applied). Caught Part 4 pre-commit gate.
- **#23** 5B ConnectWallet `display: none` на lazy `<component :is>` host pattern требует legacy template having inline trigger button to hide. Pure-modal legacy (только VModal в template) doesn't need it. Vuetify VModal Teleport visibility cascade блокируется ancestor display:none **despite** markup teleporting к body. Pre-copy verify: read legacy template — has inline btn or pure modal?
- **#24** При reuse legacy components в v2 через augmentation (defineExpose / ConnectWallet pattern), **обязательный** pre-augmentation grep `router\.push|this\.\$router` внутри legacy file. Conditional на `router.currentRoute.value.path` = minimal additive fix:
  ```js
  const currentPath = router.currentRoute.value.path;
  if (currentPath !== '/v2/<area>') {
    router.push('/<legacy-path>');
  }
  ```
  Confirmed twice (CreateClan + ClanEdit). Full v2-flow refactor — separate scope (deferred §7).

**Sub-Epic 5D — CLOSED.** Route table `/v2/*` обновлена:

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + auto-refresh on mutations |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ FD (legacy mocks + dynamic) |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ (5A migrated) |
| `/v2/matchmaking` | 3Bb | ✅ (5A migrated) |
| `/v2/create` | 3Bc + 4 | ✅ backend persist |
| `/v2/profile` | 5B | ✅ 4-card HUD + lazy ConnectWallet + WS friends |
| `/v2/ratings` | 5C | ✅ unified leaderboard (5 scope × 2 season mocks) |
| `/v2/clan` | **5D** | ✅ 2-state HUD (no-clan browse / in-clan body) + lazy CreateClan/ClanEdit reuse + 6th 5A consumer both helpers |

**Следующий sub-epic:** 5E — TBD (Settings или Shop per VISUAL_MIGRATION plan). Pre-flight в `docs/visual-migration/HANDOFF_EPIC5_5E_CHAT_HANDOFF.md` (Step 15).

### Эпик 5 — Sub-Epic 5E — Shop (✅ COMPLETE)

Завершён 2026-04-27. Четвёртая views-миграция Эпика 5 после 5B (Profile) + 5C (Ratings) + 5D (Clan). Клик по shop locker plinth в hub → `/v2/shop` с cosmetics catalog HUD (6 tabs / 18 items / 4 rarities / mock purchase flow) поверх lazy ShopScene. Визуальный паритет с прототипом 3643-4013 (HUD CSS) + 12379-12530 (3D scene) + 12534-12772 (catalog + handlers). 5 functional + 0 hot-fix + 3 финальных коммита.

**Commit range:** `f5aeacc` (Step 1) → `<step 11>` (Step 11 HANDOFF). Branch `claude/setup-5e-shop-mode-a-khIAi`. Predecessor 5D tip `5f246eb`.

**Что видит пользователь:**
- Click на shop locker plinth в hub → navigate `/v2/shop`.
- Октагональная тёмная комната (R=14, H=9, fogDensity=0.05, floor 0x1e1e26, walls 0x0e0e18) с центральным concrete podium (CylinderGeometry 1.2/1.3 × 0.28, makeConcreteTexture map, color 0x8c8c96) и floating gloved hand silhouette (Group: warm gold semi-transparent BoxGeometry stack — main 0.7×0.55×0.9 + thumb 0.3×0.3×0.35 offset (0.3, 0.25, 0.55) + wrist strap 0.72×0.15×0.92, all opacity 0.6 transparent), warm gold light shaft (ConeGeometry 1.3×6 additive opacity 0.05) + floor disc (canvas radial gradient, PlaneGeometry 2.6×2.6 additive), 60 dust particles (5A `createDustField` 7-й consumer, count 60, xRadius 5, zRadius 4, yMin 0.3, yMax 4, color 0xffd9c8). Camera slow orbit (period ~63s) + Y bob.
- HUD: back btn + title "Hexlash / LOCKER" + 3-chip balance bar (Taps 12,480 / XP 340 / Base 0.128Ξ) + 6 category tabs + 2-col grid (item grid + detail panel).
- Items: 5 skins / 3 gloves / 4 boosts / 3 titles / 3 banners. 4 rarities (common gray / rare cyan / epic purple / legendary gold) с distinct colors. 'Bandage Wraps' + 'Newborn' pre-owned для demo.
- Selection → detail panel с big preview + name + desc + effect + price + Purchase btn.
- Purchase: insufficient → button disabled + 350ms shake (`fail` class); sufficient → 900ms gold flash (`flash` class) + balance deduct + ownedSet update via `new Set([...])` re-create + 'OWNED' badge + detail flips к "Owned" green.
- Mobile (`@media max-width: 820px`): tabs scroll, detail panel `display: none` by default, click item → `mobileShowDetail = true` → grid hidden + detail visible + `← Items` mobile back btn (5E addition vs prototype) → click back → grid restored.
- Back / Esc → `/v2`.

**Дерево новых файлов (5):**

```
src/views-v2/ShopView.vue            —  41 строки — orchestrator (lazy registerScene + activateScene + Esc + strict teardown). 5B/5C/5D parity.
src/scene/scenes/ShopScene.js        — 222 — octagonal room (5A buildOctagonalRoom 7-й consumer) + key+rim spotlights + warm shaft + floor disc + concrete podium + floating gloved hand (Group, 3 Box parts) + 60 dust particles (5A createDustField 7-й consumer). All intensities ~50-67% retuned + cones ~1.4x widened для exposure 2.3 compensation (lessons #19-21 absorbed FIRST).
src/components/hud/HudShop.vue       — 220 — full HUD: title / balance chips / 6 tabs / 18-item grid / detail panel / mobile show-detail toggle / purchase flow с reactivity-correct Set re-create. Conditional spans для price (no v-html — safer). Scoped style с pointer-events reset (`.shop-hud` root).
src/styles/v24/shop.css              — 419 — 1-to-1 port prototype 3643-4013 scoped `.app-v2` (68 prefixed rules, 2 keyframes, 1 @media block). Includes `.empty-cat` + `.sd-mobile-back` additions (5E specific).
src/data/shopMock.js                 —  39 — SHOP_ITEMS (18) + SHOP_OWNED_INIT + INITIAL_BALANCE. Verbatim port prototype 12534-12572.
```

**Изменены (4):**

- `src/router/index.js` — `V2Shop` route (`/v2/shop`) в `v2Routes.children`. Без `:id` per 5C/5D precedent.
- `src/views-v2/PitViewV2.vue` — `'shop'` убран из `PH_MODAL_IDS` (теперь `[]`); explicit branch `click.id === 'shop' → router.push('/v2/shop')` после `clan` branch, перед PhModal fallback.
- `src/components/hud/HudPit.vue` — `MODAL_CONTENT.shop` entry удалён (replaced с comment marker).
- `src/styles/hexlash-v24.css` — `@import './v24/shop.css'` после `./v24/clan.css`.

**Store reuse (0 new Vuex modules, 0 new actions):**

| Feature | Source | Rationale |
|---|---|---|
| Balance | local `INITIAL_BALANCE` constant | Q3 mock-only, real source deferred к backend purchase sub-epic |
| Owned | local `SHOP_OWNED_INIT` Set | Same |
| Catalog | static `SHOP_ITEMS` array | Same |
| `master/changeSkin` | **НЕ used** в 5E | Q4 Variant A — taxonomy mismatch с legacy `skin_m_N.png` numeric, hybrid mapping creates accidental coupling |

**Ключевые паттерны:**
- Lazy sub-scene 5B/5C/5D parity. ShopView 41 lines minimal orchestrator.
- 5A helpers — 7-й consumer обоих (`buildOctagonalRoom` + `createDustField`). Validate stable reuse beyond 6 prior consumers.
- Path A pure (4-й precedent в Epic 5 после 5B/5C/5D). Никаких legacy reuse.
- Mock-only purchase flow (Q3). Real backend `POST /v1/shop/buy` deferred.
- Pure cosmetic catalog (Q4 A). No coupling с `master/changeSkin` — taxonomy mismatch с legacy skin_m_N.png.
- **Exposure compensation full apply из 5D lessons #19/20/21** — prototype intensities × ~0.55 + cone angles × ~1.4 (key cone π×0.25 → π×0.35; rim cone π×0.4 → π×0.45). **Pre-tuned в ТЗ §2 table до Step 2 write — НЕ потребовалось visual hot-fix series как в 5D Step 5.**
- Conditional spans для price вместо v-html — safer (no XSS surface), idiomatic Vue 3.
- Vue 3 reactivity на Set: `ownedSet.value = new Set([...ownedSet.value, id])` re-create требует, иначе grid не обновляется после purchase.
- Sentinel-marker split-write pattern (`@@PART2@@` etc) — 5E-introduced practice для split-write больших SFC и CSS файлов (per урок #9). Используется для shop.css (4 chunks) и HudShop.vue (5 chunks); incremental verify possibility (если chunk N сломал бы что-то, видно сразу).

**Расхождения — осознанные:**
1. Path A pure (Q2). Legacy BuyTokens.vue disabled с Phase 1, не reused.
2. Mock-only purchase flow (Q3). Real backend `POST /v1/shop/buy` + Prisma `UserCosmetic` deferred.
3. No coupling с master/changeSkin (Q4 A). Catalog taxonomy mismatch.
4. Intensities ~55-67% + cones ~1.4x retuned per exposure 2.3 compensation (lessons #19-21).
5. Vue 3 Set reactivity workaround — `new Set([...])` re-create.
6. Conditional spans вместо v-html для price rendering (safer).
7. `.sd-mobile-back` btn addition vs prototype (UX gap fill — prototype полагается на browser back).
8. Floor concrete texture dropped — 5A `buildOctagonalRoom` floorMat color-only (no map). Prototype 12403 имел texture с repeat(5,5). Symmetric с 5D ClanScene helper usage. Visually equivalent под fog 0.05 + exposure 2.3.
9. Dust yMax 4 vs prototype 4.3 — 5A helper signature bound. Minor visual delta.
10. Hemi retune × 0.30 (vs prototype × 0.40) — 75% factor (less aggressive than key/rim ~55%) для fill light, side-face readability.
11. Sentinel-marker split-write pattern для shop.css + HudShop.vue — 5E-introduced approach beyond simple Edit appends (см. Ключевые паттерны).

**Lessons added:** none new. 5E successfully **applied** lessons #19/20/21 — НЕ потребовалось visual hot-fix series как в 5D Step 5. Hot-fix metric: **0 attempts на ложной траектории** (compare 5D Step 5: 5 attempts).

**Sub-Epic 5E — CLOSED.** Route table `/v2/*` обновлена:

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + auto-refresh |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ FD |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ (5A migrated) |
| `/v2/matchmaking` | 3Bb | ✅ (5A migrated) |
| `/v2/create` | 3Bc + 4 | ✅ backend persist |
| `/v2/profile` | 5B | ✅ 4-card HUD + lazy ConnectWallet + WS friends |
| `/v2/ratings` | 5C | ✅ unified leaderboard (5 scope × 2 season mocks) |
| `/v2/clan` | 5D | ✅ 2-state HUD + lazy CreateClan/ClanEdit reuse |
| `/v2/shop` | **5E** | ✅ 6-tab cosmetics catalog (18 items × 4 rarities) + mock purchase flow + lazy ShopScene |

**Bundle impact:** ShopView lazy chunk 14.32kB (gzip 5.78kB / brotli 4.95kB). shop.css inlined в main index.css chunk (~10kB raw, через `@import` Vite не chunk-splits). HudShop scoped style 0.26kB. Net 5E addition: ~25kB raw / ~6kB gzip к user-fetched payload при первом visit `/v2/shop`.

**Следующий sub-epic:** 5F (i18n pass) или 5G (polish) per VISUAL_MIGRATION plan. Pre-flight в `docs/visual-migration/HANDOFF_EPIC5_5F_CHAT_HANDOFF.md` (Step 11).

### Эпик 5 — Sub-Epic 5F — Triple Small Batch (✅ COMPLETE)

Завершён 2026-04-28. Six-th sub-epic в Эпике 5 — 3 isolated small features в одном run для cleanup + missing features delivery.

**Commit range:** `a4808d4` (Step 1) → `<step 10>` (Step 10 HANDOFF).
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued from 5E — same harness slug, single PR target к visual-v2 closes 5E + 5F + later sub-epics).
**Predecessor:** 5E ✅ CLOSED (`929986d`).

**Что делает 5F:**
1. **MODAL_CONTENT cleanup** (XS) — closes 3-sub-epic carry-over (5C/5D §14, 5E §9). Удалил `warden:` + `predator:` entries из HudPit MODAL_CONTENT, плюс кaskade dead code: PhModal import + 4 refs (modalOpen/Kicker/Title/Desc) + openPhModal/closeModal + defineExpose + PH_MODAL_IDS array + hudRef в PitViewV2. Net −66 lines. Подтверждено что в prototype самом это dead code (line 6948 — early return на openFighterDetail).
2. **VerifyEmailBanner** (S) — port prototype 3395-3445 (CSS) + 12790-12810 (JS handlers, adapted to Vue). Self-positioned `position: fixed` сверху, conditional на `master.userData.emailVerified === false`. "Verify Now" btn → `router.push('/verify-email')` (legacy route reuse). Push HUD top-bar 12px → 48px (preserves prototype +36px delta) через `body.verify-shown` class.
3. **HelpModal** (S) — **новый pattern** (prototype не имеет dedicated help — only Onboarding). "?" icon в HudPit top-bar (44px circle, paired со styling avatar btn) → modal с 6 sections inline EN rules text. Teleport-to-body для z-index escape (PhModal precedent), backdrop blur, Esc/×/backdrop close.

**Что видит пользователь:**
- (banner) Если `emailVerified === false`: top of screen — orange→gold gradient banner "Verify your email...". "Verify Now" btn → /verify-email. Dismiss × → banner slides up out (state local, refresh restores). HUD top-bar push'нут 36px вниз. Banner persistent across all `/v2/*` routes (mounted в AppV2.vue, не per-view).
- (help) "?" icon в TopBar right cluster (рядом с avatar, paired styling). Click → backdrop blur + modal pop-in c 6 sections (basics / hub navigation / training / pvp / clans / shop). Esc / × / backdrop close → modal unmounts (lazy `v-if`).
- (cleanup) Никаких visible изменений — fighter clicks still → /v2/fd/* (была dead code path never reached).

**Дерево новых файлов (3):**

```
src/components/hud/VerifyEmailBanner.vue  — 71 lines — banner + Vue Transition slide + body.verify-shown class sync
src/components/hud/HelpModal.vue           — 73 lines — Teleport-to-body modal с 6 sections + Esc handler + backdrop close
src/styles/v24/help.css                    — 151 lines — `.app-v2 .tb-help-btn` (scoped) + `.help-*` global (Teleported) + @keyframes helpFadeIn + mobile @820px
```

**Изменены (5):**

- `src/components/hud/HudPit.vue` (−75 / +20) — MODAL_CONTENT + PhModal infrastructure removal + helpOpen ref + HelpModal lazy mount + TopBar @help-click binding
- `src/views-v2/PitViewV2.vue` (−45 / +9) — PH_MODAL_IDS array + hudRef + dead branch removal
- `src/AppV2.vue` (+2) — VerifyEmailBanner mount (global для всех /v2/*)
- `src/components/hud/common/TopBar.vue` (+10 / −3) — `.v2-topbar__right` flex wrapper + `?` btn + `help-click` emit
- `src/styles/v24/verify.css` (+73, new) — port prototype 3395-3445 + body push-down rule
- `src/styles/hexlash-v24.css` (+2) — `@import './v24/verify.css'` + `@import './v24/help.css'`

**Reused (1):**
- `master.userData.emailVerified` field (existing) — used for banner conditional

**Ключевые паттерны:**
- **Lesson #11 as reflex** — 5 false-positive grep recoveries в run (MODAL_CONTENT × 2 в Step 1 + 7, PhModal в Step 1, остальные в pre-flight). Pattern: при unexpected grep hit — first verify где именно matched (comment / code / string), не just count.
- **TZ self-correction via pre-flight** — original ТЗ had 2 assumption errors (`verified` → `emailVerified` field rename; `master/sendVerifyEmail` действие — это submit-code, не resend-link). Pre-flight Step 0 caught both, ТЗ adjusted before Step 2 write.
- **Teleport-to-body для overlays** (PhModal precedent) — global non-scoped CSS для Teleported elements, scoped CSS для in-DOM trigger button.
- **Vue Transition вместо CSS class toggle** — VerifyEmailBanner uses Vue 3 `<Transition>` для slide-in/out (idiomatic Vue 3, equivalent visual prototype CSS class).
- **Wrapper-based button cluster** — TopBar `.v2-topbar__right` flex group для right-side cluster (avatar + help). Future-extensible (e.g. notif btn).
- **Delta preservation для adaptation** — banner push-down 12px → 48px preserves prototype +36px delta поверх codebase baseline 12px (vs prototype baseline 0px). Pattern для intent-preservation при adaptation.

**Расхождения — осознанные:**
1. HelpModal не из prototype — created с нуля per plan §4.2 #3 recommendation (prototype only имеет Onboarding).
2. Help content — inline EN strings (i18n defer last per plan §R8).
3. Banner dismiss state — НЕ persisted (refresh показывает снова). Persist в 5G polish если decided.
4. Banner btn label "Verify Now" (router.push '/verify-email') vs prototype "Resend Link" (toast confirm). Reason: no `resendVerifyEmail` Vuex action existed — reuse existing legacy verify flow вместо создания нового endpoint. Real `resend` endpoint deferred к backend sub-epic.
5. Banner mounted в AppV2.vue (global) vs original ТЗ §Step 2 (PitViewV2.vue per-view). ТЗ §Visual verify expectation specified "persists across views" — resolved per stated intent (global). Documented в FINAL §5.
6. `emailVerified` field (codebase) vs original ТЗ `verified` (assumed name). TZ self-correction via pre-flight Step 0.
7. `master/sendVerifyEmail` — это submit-code action, не resend-link. TZ assumption corrected — banner Verify Now btn navigates to legacy `/verify-email` view вместо dispatch'а несуществующего resend.
8. Selector scope split в help.css — `.tb-help-btn` scoped с `.app-v2`, `.help-*` global (Teleport-aware). Document в CSS header comment + FINAL §5.
9. `.top-bar` (prototype) → `.v2-topbar` (codebase namespace) для CSS rules.
10. `.notif-panel` push-down rule dropped — нет v2 NotificationPanel (audit confirmed missing, defer к PvP-integration).
11. Banner default visible (no initial `translateY(-100%)`); Vue Transition handles enter/leave вместо prototype CSS class toggle.

**Lessons applied (validated):**
- #5 strict teardown order — VerifyEmailBanner `onBeforeUnmount` removes body class
- #9 split-write — N/A для 5F (все файлы <200 lines, single write OK)
- #11 verify shape с реальным data — applied 5+ times в run
- #12 pointer-events — N/A для Teleported HelpModal (PhModal precedent)
- #18 STOP tuning + START structural inspection — N/A (run had no visual mismatches)
- #22 HUD scoped selector match — `.shop-hud` parity holds для VerifyEmailBanner (`.verify-banner` root) + `.tb-help-btn` (in-DOM trigger). HelpModal Teleport — exception explicitly documented.
- Path A для banner; new pattern для HelpModal (documented).

**Hot-fix metric:** **0 hot-fix attempts на ложной траектории.** Continues 5E precedent. 6 functional commits + 3 closing = 9 commits total. Compare 5D: 5 hot-fix attempts Step 5 alone.

**Sub-Epic 5F — CLOSED.** ✅ Route table `/v2/*` остаётся unchanged (5F не добавляет new routes — global features overlay существующие).

**Bundle impact:** TBD из Step 8 build report.

**Следующий sub-epic:** 5G TBD per HANDOFF — single medium feature (Captain switch / AutoFight / Spectate / Social tasks / AI Trainer / Challenges) либо polish batch (HudClan split + ClanScene mood + ClanActivityFeed).

### Эпик 5 — Sub-Epic 5G — Captain Switch UI (✅ COMPLETE)

Завершён 2026-04-28. Seventh sub-epic в Эпике 5. Closes captain-system gap (audit §4.2 #18 🟡 Partial → ✅ Done) plus 1-line kicker bug fix bundled.

**Commit range:** `d0bcbed` (Step 1) → `<step 7>` (Step 7 HANDOFF).
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued from 5E/5F).
**Predecessor:** 5F ✅ CLOSED (`fb3b370`).

**Что делает 5G:**
1. **Kicker bug fix** — `HudFighterDetail.vue` kicker computed респектил `isCaptain` flag, до 5G каждый real agent showed "Captain · ..." regardless. 1-line conditional fix bundled с 5G scope (investigation found, не deferred к polish).
2. **Set-as-Captain btn** — sibling `.back-btn` (direct child `.detail-hud`), positioned `fixed top:14px right:14px z-index:60` (mirrors back-btn convention exactly). Styled matching v2 design (dark bg + white border, hover pink, active scale(0.97), busy state opacity 0.6). Click → `agent/setCaptain` dispatch → hub auto-refreshes via CanvasLayer watcher (Epic 4 Step 5.5).
3. **Captain badge** — replaces btn for already-captain agent. Pink-tinted "✓ Captain" non-clickable indicator (rgba(255,6,111,0.12) bg + pink border + `--hex-primary` text + `user-select: none`).
4. **Legacy mocks excluded** — template `v-if="props.agent"` hides both btn и badge для warden/predator inline mocks (no real id для dispatch).

**Что видит пользователь:**
- Open `/v2/fd/<real-agent-uuid>`:
  - If captain → "✓ Captain" pink badge top-right + kicker "Captain · <Archetype>"
  - If not captain → "Set as Captain" btn top-right (dark bg, white border) + kicker "<Archetype>" only
  - Click btn → opacity drops to 0.6 (busy state) → ~300-500ms dispatch → btn replaces с pink badge
  - Back to /v2 → hub captain swapped (3D scene fighters re-render via CanvasLayer watcher)
- `/v2/fd/warden` / `/v2/fd/predator` (legacy mocks, agent === null) — никакой btn ни badge

**Дерево (1 modified):**

```
src/components/hud/HudFighterDetail.vue       — modified +102/-1 — kicker fix + btn/badge template + onSetCaptain handler + scoped CSS rules
```

5G не создаёт новых файлов — feature implementation в existing HudFighterDetail.vue полностью (template + script + scoped style block).

**Reused as-is (3):**
- `agent/setCaptain` Vuex action — `apiClient.put('/agent/:id/captain')` + auto-refetch (no service file abstraction; direct apiClient call в action body)
- CanvasLayer watcher (Epic 4 Step 5.5) — `watch(() => store.getters['agent/agentsList'], (newList) => pit.refreshFighters(...))` auto-fires on dispatch cascade
- `agentData` prop binding (FighterDetailView line 5) — already exposes `isCaptain` flag through real agent data

**Ключевые паттерны:**
- **Bug-bundle pattern** — investigation выявил kicker bug → bundle с 5G scope (1-line fix), не deferred к polish run отдельным commit'ом. Pattern: when investigation finds adjacent bug в same file/scope, bundle if low-risk single-line.
- **Template `v-if` guard для legacy mocks** — `v-if="props.agent"` presence-check без assumption на data shape. Closes Q3 decision cleanly.
- **Non-clickable status badge vs disabled btn** — UX preference (Q2 decision) для already-captain state. Badge передаёт state visually + semantically (pink-tinted = primary brand) vs disabled-ugly btn.
- **Direct dispatch без ConfirmModal** — reversible action (Q4 decision), distinguishes от destructive 5D ClanLeave precedent. ConfirmModal reserved для irreversible operations.
- **Cascade Epic 4 reuse** — Epic 4 Step 5.5 wired hub auto-refresh via CanvasLayer watcher. 5G dispatches и эта infra picks up automatically. No manual refreshFighters call.
- **Mirror existing convention** — `.set-captain-btn` + `.captain-badge` styled `position: fixed; top:14px; z-index:60` (mirror `.back-btn` opposite corner). Pattern: when adding new HUD element, mirror existing pattern verbatim для visual consistency.

**Расхождения — осознанные:**
1. Kicker bug fix bundled (not separate sub-epic) — single-line, scope-related (HudFighterDetail.vue same file as 5G feature). Bug-bundle pattern.
2. No ConfirmModal — Q4 direct dispatch (vs 5D destructive precedent).
3. No optimistic UI — Q7 await before badge change (simpler, polish optional later).
4. No toast notification on success — no toast system в v2 (audit confirmed).
5. No spinner during dispatch — opacity 0.6 fade (~300-500ms call too short для spinner UX).
6. Legacy mocks (warden/predator) не support set-captain — no real id для dispatch endpoint.
7. CSS positioning `position: fixed` (not `absolute` как было в ТЗ §Step 2 reminder) — pre-edit grep показал `.back-btn` использует `fixed`, mirror real convention. Lesson #11 reflex applied — verify shape вместо follow user phrasing literally.
8. ТЗ §Step 1 (b) markup assumed `<div class="fd-top-bar">` wrapper — pre-flight grep показал no such wrapper. `.back-btn` is direct child `.detail-hud` (positioned `fixed`). 5G btn/badge added as same-level sibling. ТЗ self-correction via pre-flight Step 0 (lesson #11 reflex).
9. ТЗ §Step 2 referenced `src/styles/v24/fighterDetail.css` — pre-flight verify: no such file. CSS lives inline в HudFighterDetail.vue scoped style block (where `.back-btn` already styled). 5G rules added к scoped block. Drop hexlash-v24.css `@import` (not needed). ТЗ self-correction.

**Lessons applied:**
- **#11 verify shape с реальным data** — investigation pre-write caught kicker bug + setCaptain signature; pre-flight Step 0 caught 2 ТЗ assumption errors (`.fd-top-bar` wrapper / fd CSS file). 9th false-positive recovery в 5E+5F+5G run (1 в 5G на Step 4 grep).
- **#22 HUD scoped selector match** — `.set-captain-btn` + `.captain-badge` scoped в HudFighterDetail.vue style block (file-scoped style, applies через `.app-v2` parent in DOM hierarchy). Validated.

**Lessons added:**
- **Bug-bundle in scope** — investigation findings (e.g. kicker bug в case 5G) могут быть scope-extended если изначальный focus area touches the file. Single-line fix bundled с 5G — не deferred к polish run отдельным commit'ом. Pattern для future investigation-driven sub-epics.
- **Mirror real convention** — when ТЗ phrasing differs from codebase reality (e.g. ТЗ said `absolute`, codebase uses `fixed`), pre-edit grep wins. Verify shape реальной реализации, не trust ТЗ verbatim. Lesson #11 specialization для CSS/markup conventions.

**Hot-fix metric:** **0 hot-fix attempts на ложной траектории.** Continues 5E/5F precedent — third consecutive sub-epic в Epic 5 без unplanned hot-fixes. Pre-flight Step 0 caught 2 ТЗ assumption errors at zero-commit cost.

**Эпик 5 §4.2 progress:** **10/22 done** (+1 from 5G: Captain switch #18). Remaining: 5/22 partial + 7/22 missing.

**Sub-Epic 5G — CLOSED.** ✅ Route table `/v2/*` остаётся unchanged (5G modifies HudFighterDetail in-place; no new routes).

**Bundle impact:** TBD из Step 7 build report (only HudFighterDetail.vue affected, expected delta minimal — ~3-4kB to FighterDetailView lazy chunk).

**Следующий sub-epic:** 5H TBD per HANDOFF — single feature pick (AutoFight toggle / Spectate flag / Social tasks / AI Trainer / Challenges / Referral QR) либо polish batch (HudClan split + ClanActivityFeed + carry-overs).

### Эпик 5 — Sub-Epic 5H — Referral QR (✅ COMPLETE)

Завершён 2026-04-28. Eighth sub-epic в Эпике 5. Augmentation pattern для legacy `ReferralModal.vue` — derived from 5B ConnectWallet precedent но **simplified per Correction A** (mount-on-demand vs long-lived component lifecycle).

**Commit range:** `7933105` (Step 2 — only functional commit) → `<step 7>` (Step 7 HANDOFF).
**Branch:** continued `claude/setup-5e-shop-mode-a-khIAi` (5E/5F/5G/5H stack).
**Predecessor:** 5G ✅ CLOSED (`e58f2be`).

**Что делает 5H:**
1. **Identity card 5th row "Referral"** — link text `hexlash.com/r/{login}` (truncated to 24 chars + `…`), pink color + cursor pointer + hover underline. Mirrors `.ifv.wallet` clickable pattern.
2. **Lazy ReferralModal mount-on-demand** — `<component v-if="referralMounted" :is="ReferralComp" @close="...">` host. Click row → `loadReferralModal()` (dynamic import + markRaw) → `referralMounted = true` → modal mounts → contents visible immediately (no ref method call needed).
3. **CSS mirror** — `.ifv.referral` rule добавлена в `src/styles/v24/profile.css` рядом с `.ifv.wallet` (consistency через file location vs scoped block).
4. **Legacy ReferralModal untouched** — file zero modifications. Mount-on-demand pattern uses `<Teleport to="body">` already present + `emit('close')` API as-is.

**Что видит пользователь:**
- Open `/v2/profile` → Identity card has 5 rows: Wallet / Belt / Clan / Email / **Referral**
- Referral row text: `hexlash.com/r/<login>` truncated to 24 chars (long logins get `…`)
- Hover row → text underline appears
- Click row → ~100-200ms lazy chunk fetch (first time) → modal pops в (Teleport to body) с QR code (200×200 transparent bg) + referral link + Copy/Share btns + invited friends list
- Close (× / backdrop click) → modal unmounts (`referralMounted = false`)
- Reopen → fresh fetch (`apiClient.getReferrals()`) + fresh QR generation (mount-on-demand)

**Дерево (2 modified, 0 new):**

```
src/components/hud/HudProfile.vue   — modified +40 — lazy host (script + template) + Identity 5th row + onReferralClick + referralLinkText computed
src/styles/v24/profile.css          — modified +6  — .ifv.referral base + :hover (mirror .ifv.wallet pattern)
```

5H = **smallest sub-epic в Эпике 5** (4 commits total: Step 2 functional + Steps 5/6/7 closing).

**Reused as-is (4):**
- `apiClient.getReferrals()` endpoint (`src/core/api/apiClient.js` — GET /user/referrals)
- `qrcode` library (^1.5.4 в package.json, used inside modal)
- `navigator.clipboard` / `navigator.share` API patterns (used inside modal)
- ReferralModal full body (288 lines) — **zero augmentation** per Correction A

**Ключевые паттерны:**
- **5B augmentation pattern — semantic reuse не mechanical mirror** — lazy import + dynamic component host + markRaw — **core principle preserved**. Dropped: defineExpose ceremony + `await nextTick × 2 → ref.openModal()` chain — **not needed для mount-on-demand lifecycle**. Pattern adapted to semantic intent.
- **Mount-on-demand vs long-lived modal lifecycle** — ConnectWallet caches state across opens (wallet connector list), needs internal show/hide flag. ReferralModal fetches data fresh per open (QR + referrals API), mount = visible = correct. No internal state needed.
- **Lazy chunk delivery** — DevTools Network confirms ReferralModal-*.js fetched only on first click; subsequent opens reuse cached module via Vue's module cache.
- **shallowRef для component instance refs** — Vue 3 best practice (avoid deep reactivity overhead on Component objects). Self-applied vs ТЗ-spec, validates 5B precedent matches (CWComp also uses shallowRef).
- **Closes 5B-deferred item** — symmetric с 5F's MODAL_CONTENT closure (3-sub-epic carry-over closing pattern).

**Расхождения — осознанные:**
1. Vuetify `<v-progress-circular>` сохранён в legacy modal (Q3 augmentation reuse rule — don't touch unless visual breaks).
2. Hardcoded `https://hexlash.com/r/{login}` URL в legacy modal (Q4 — out of 5H scope; env-var refactor separate concern).
3. Truncate logic для long logins (24 chars + `…`) — UX consistency с Wallet row (long addresses already truncate similarly via parent layout).
4. **ReferralModal `defineExpose` skip** (vs ТЗ §Step 1 augmentation plan) — Pre-flight Correction A. Mount-on-demand pattern (data fetched fresh per open) ≠ ConnectWallet long-lived pattern. Validates lesson: 5B precedent применять **semantically** (lazy import + lazy mount), не **mechanically** (defineExpose-must-be-there). 5H-introduced refinement.
5. **CSS rule в `src/styles/v24/profile.css`** (vs ТЗ assumed scoped style block в HudProfile.vue) — Pre-flight Correction B. `.ifv.wallet` rule found в profile.css, mirror там же per consistency. ТЗ self-correction via lesson #11 reflex.
6. **`shallowRef` для `ReferralComp`** (vs `ref` в ТЗ template) — Vue 3 best practice для component instance refs, избегает deep reactivity overhead. Self-applied as improvement matching 5B (`CWComp = shallowRef(null)`), не divergence — alignment with precedent.

**Lessons applied:**
- **#11 verify shape с реальным data** — Pre-flight Step 0 caught 2 ТЗ corrections (defineExpose unnecessary + CSS file location). Step 4 validated clean state — first sub-epic в running tally **без** false-positive recovery (means lesson works as preventive, not just reactive).
- **#22 HUD scoped selector match** — `.ifv.referral` scoped через `.app-v2 .id-field` ancestor chain в profile.css (not Vue scoped block — global file but namespaced).
- **5B augmentation pattern semantic reuse** — 1st application of pattern adaptation across precedent.

**Lessons added (1 new — #30):**
- **#30 Pattern reuse — semantic vs mechanical** — when reusing precedent pattern (e.g., 5B ConnectWallet → 5H ReferralModal), distinguish core principle (lazy import + lazy mount) from ceremonial details (defineExpose + nextTick × 2 + ref method). Adapt to target component's actual lifecycle. Mechanical mirror leads к dead code (e.g., no-op `openModal` just for symmetry); semantic adaptation respects component's real needs. Lesson #11 specialization для cross-sub-epic pattern reuse.

**Hot-fix metric:** **0 hot-fix attempts на ложной траектории.** Continues 5E/5F/5G precedent — **4-streak** (5E + 5F + 5G + 5H all 0 hot-fix). Pre-flight Step 0 caught 2 corrections at zero-commit cost; Step 4 verify clean. Pattern reflex stable across 4 consecutive sub-epics.

**Эпик 5 §4.2 progress:** **11/22 done** (+1 from 5H: Referral QR #8). Remaining: 5/22 partial + 6/22 missing.

**Sub-Epic 5H — CLOSED.** ✅ Route table `/v2/*` остаётся unchanged (5H modifies HudProfile in-place; no new routes).

**Bundle impact:** ReferralModal lazy chunk (~5-8kB raw / ~2kB gzip post-minification) fetched on-demand. HudProfile chunk grows ~1kB raw from added imports + handler code.

**Следующий sub-epic:** 5I TBD per HANDOFF — single feature pick (AutoFight / Spectate / Social tasks / AI Trainer / Challenges / FightClub level / Retirement) либо polish batch.


