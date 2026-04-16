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
  App.vue                  — Root: header (Logo), <AppShell /> mount, BottomMenu (hidden on PvP/Pit screens), Info/Error toasts, ChallengeNotification
  main.js                  — Entry: Vue + Vuetify + i18n + Vuex + WagmiPlugin + VueQueryPlugin init
  router/index.js          — Routes + auth guards + fight state restore (incl. v2-suffixed visual redesign routes)
  views/                   — 19 page-level components (incl. FightClubView, CreateAgentView, AgentDetailView)
  views/new/               — 9 v2 visual-redesign views (PitView, ProfileViewV2, TrainingViewV2, RatingsViewV2, ClanViewV2, MatchmakingViewV2, CreateFighterViewV2, FighterDetailViewV2, PreparationViewV2). CardFightViewV2 pending (Phase 3.10).
  composables/             — Vue composables. `useActiveView.js` — derives view name from route.name, syncs `<body class="is-{name}">`.
  three/                   — Three.js modules for v2 visual redesign
    helpers/               — atmosphereScene, audioEngine, crowdSilhouette, fighterLowPoly, textures (pure JS, reused across scenes)
    scenes/                — pitScene, pitArena, pitEnvironment, fighterDetailScene (each exports init…Scene(canvas,opts))
  components/              — 75+ reusable components
  components/shell/        — AppShell.vue (single router-view mount + atmosphere layers + view-fade transition)
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
    atmosphere.css         — Global atmosphere layers: .grain (noise, z-200), .vignette (radial dim, z-150), .scanlines (CRT, z-175, opt-in)
    view-layers.css        — HUD pointer-events pattern (`.hud` + `.{view}-hud > *`) + `.scene-canvas` utility for Three.js canvases
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
    calibrate-belts.js     — Belt calibration utility
    cleanup-agents.js      — Agent data cleanup
    migrate-all-users.js   — Batch User→Fighter migration
  tests/
    userMigrationService.test.js — User→Fighter migration tests (14 tests)
    beltService.test.js    — Belt system: qualifying wins, belt calc, hexmaster
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
| — | **Visual Redesign v2 routes (Phase 3, not in main)** | — |
| `/arena/pit` | PitView | Yes |
| `/arena/fight-v2` | PreparationViewV2 | Yes |
| `/arena/club/create-v2` | CreateFighterViewV2 | Yes |
| `/arena/club/:agentId/v2` | FighterDetailViewV2 | Yes |
| `/profile-v2` | ProfileViewV2 | Yes |
| `/clan-v2/:id?` | ClanViewV2 | Yes |
| `/ratings-v2` | RatingsViewV2 | Yes |
| `/training-v2` | TrainingViewV2 | Yes |
| `/matchmaking-v2` | MatchmakingViewV2 | Yes |

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
| `agentState` | Agent roster: CRUD, auto-fight toggle, Fight Club level, 30s auto-refresh. `agentsList` sorted by isHexmaster → belt → qualifiedWins. Getter `activeAgent` (first by `createdAt` ASC). |

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

**Agent fields:** `belt` (Int, 0-32), `qualifiedWins` (Int), `isHexmaster` (Boolean). Backfill scripts: `backend/scripts/backfill-belts.js`.

**Active agent in arena:** PvE/PvP fights use the first agent (by `createdAt` ASC) via `fightClubService.getActiveAgent()`. User stats (pveWins, pvpWins, rating) are frozen legacy — no longer updated. Belt progression applies to active agent. `progressionState` is trainer-only (TrainingView, MoveTree, DeckBuilder).

---

## Design System — "Neon Discipline"

**Status:** v1.0 — Visual System established.
**Full visual guide:** Hexlash_Visual_System.pdf v1.0 (file not in repo — source of truth is hexlash-design/SKILL.md)
**Operational reference:** /skills/hexlash-design/SKILL.md
**Key rules:** 1) one pink accent per screen, 2) display font (Archivo Black via `--hex-font-display`) only for titles/impact moments, 3) archetype colors only in fighter icons/active context, 4) backgrounds = atmosphere (stylized underground), UI = function.

### UI Components (`/src/components/ui/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PixelIcon` | `PixelIcon.vue` | 16×16 canvas-based pixel icons. **Currently unused** — preserved but not referenced by any app file. Props: name, size, color, glow, glowColor, glowSize, disabled. |
| `HexButton` | `HexButton.vue` | 5 variants: primary, secondary, ghost, danger, archetype. 3 sizes (sm/md/lg). Props: icon (PixelIcon, **unused by app**), loading (CSS spinner), block, disabled, archetypeColor. |
| `HexCard` | `HexCard.vue` | 5 variants: default, elevated, archetype (left border), active (tinted bg), result (top border victory/defeat/draw). Slots: header, footer. Padding: none/sm/md/lg. |
| `HexProgress` | `HexProgress.vue` | Progress bar. 3 variants: hp (auto green/yellow/red by %), branch (speed/power/technique colors), generic. 3 sizes. Props: label, showValue, showPercent. |
| `HexBadge` | `HexBadge.vue` | Pill badge. 5 variants: archetype, branch, status (victory/defeat/draw/info), counter (circle/pill auto), custom. Props: icon (PixelIcon), pulse animation. |
| `BeltBadge` | `BeltBadge.vue` | SVG belt badge for 33 grades + Hexmaster. Line-style: rect body, buckle, stripes. 3 sizes: sm (16×6), md (40×14), lg (120×40). Props: grade (0-32), isHexmaster, size. |

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

Key variable groups: `--hex-primary`, `--hex-bg-{deep,dark,medium,light,card}`, `--hex-text-{primary,secondary,muted}`, `--hex-border-{default,active,strong}`, `--hex-arch-{name}` (6 archetypes × 5 variants each + warden alias), `--hex-branch-{name}`, `--hex-dice-{effect}`, `--hex-mode-{type}`, `--hex-victory/defeat/draw` + `-bg`.

**v23 palette overrides (applied by Visual Redesign Phase 1):**

| Token | Value | Notes |
|-------|-------|-------|
| `--hex-bg-deep` | `#070811` | Deepest surface (body bg) — new in v23 |
| `--hex-bg-card` | `rgba(14,16,28,0.85)` | Translucent card surface over 3D scenes |
| `--hex-arch-predator` | `#FF066F` | = `--hex-primary` (shared source) |
| `--hex-arch-sentinel` | `#2ee07f` | Emerald green |
| `--hex-arch-ghost` | `#A855F7` | Violet |
| `--hex-arch-analyst` | `#4dd9ff` | Cyan |
| `--hex-arch-maverick` | `#FFA133` | Amber |
| `--hex-arch-juggernaut` | `#D4A843` | Burnished gold |
| `--hex-arch-warden` | `var(--hex-arch-juggernaut)` | Lore alias — same color as juggernaut |
| `--hex-font-display` | `'Archivo Black'` (Google Fonts) | — |
| `--hex-font-body` | `'Space Grotesk'` (Google Fonts) | — |
| `--hex-font-mono` | `'JetBrains Mono'` (Google Fonts) | — |

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

**Fonts:** (Phase 1, v23)
- `--hex-font-display` → **Archivo Black** (Google Fonts) — titles, impact moments (HEXLASH, START FIGHT, VICTORY, OVERDRIVE)
- `--hex-font-body` → **Space Grotesk** (Google Fonts) — body text, labels
- `--hex-font-mono` → **JetBrains Mono** (Google Fonts) — numbers (HP, taps, XP), stats, timers
- System sans-serif (`-apple-system, ...`) — compact arena buttons (ModeSelector, Friends) — legacy pattern, preserved

**Removed in Phase 1:** Anonymous, AnonymousBalance, Inter, Impact, Roboto @font-face declarations. Font files in `src/assets/fonts/` preserved until cleanup.

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
| Fight Club | `FightClubView.vue` | `/arena/club` (also reachable via `/arena` redirect). Agent roster, Club Level bar, Morning Report, Retirement Panel. "← Arena" switch button in header. Active agent's AgentCard has primary FIGHT button (navigates to PreparationView, disabled when fighting/resting). Background: `background_arena.webp` with gradient overlay (shared visual identity with PreparationView) |
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

**Navigation & Layout:**
- `Logo.vue` — header logo (Archivo Black via --hex-font-display, --hex-primary color + glow). Visual System v1.0 compliant: display font for brand, subtle glow, --hex-text-primary
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

Current dev branch: `claude/setup-project-initialization-KyxUY`
Visual Redesign (Phase 1–3.9): **IN PROGRESS** — not in main. Phase 1 (tokens/fonts/atmosphere ✅), Phase 2 (AppShell + view layering ✅), Phase 3 Screen Port 9 of 10 v2 views ✅. Phase 3.10 (CardFightViewV2) = next. See "Visual Redesign — Roadmap & Branch State" below.
Phase −1 (Captain System Removal): merged separately.
Club Mode prototype: **IN PROGRESS** — 109 commits ahead of main, ~6000 lines, deepdive complete (#1a-#1i), Phase 1 work starting.
Road 1 (Neon Discipline visual migration): **COMPLETE**. See `/docs/road1-final-report.md` and `/docs/road2-parking-list.md`.
Previous branches: `claude/hexlash-project-setup-WYkbK`, `claude/hexlash-project-setup-X2K7i` (Road 1), `claude/review-hexlash-guidelines-vxdZD`, `claude/add-club-mode-agents-lmXTI`, `claude/club-mode-navigation-571kx`, `claude/rename-autofight-club-mode-o2bIJ`, `claude/update-claude-md-XVzH6`, `claude/add-pixel-icons-Hk6tn`, `claude/hexlash-full-audit-WvXMd`

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
- `ensureResearch(agentId, userId)` — lazy migration: agent with empty research gets User.progression.moves
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

**Lazy migration:** Agent with empty research → copies User.progression.moves to AgentProgression.research + branchExp to agent xp (if 0). Triggered on GET /agent/:id, GET /available-moves, POST /research.

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
- `src/components/club/` — AgentCard (active agent has FIGHT button → PreparationView, disabled when fighting/resting), ClubLevelBar, AgentRoster, MorningReport, SkinPicker, ArchetypeSelector
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
| Активный боец для PvP | First Agent by createdAt | Active Agent | Определяется автоматически, не через UI |

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
4. ~~**Captain real-time:**~~ *REMOVED in Phase −1.* Captain system deleted entirely. Active agent = first by createdAt ASC.
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
| P1-captain-1 | Captain как поле + базовая логика + создание из Fighter №1 | REVERTED (Phase −1) | После migration |
| P1-captain-2 | Adapt Arena flow под Captain | REVERTED (Phase −1) | После captain-1 |
| P1-captain-3 | Adapt Profile/Ratings под Captain | REVERTED (Phase −1) | Параллельно с captain-2 |

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

### Phase −1 — Captain System Removal — ✅ COMPLETE

Captain system completely removed. Active agent for combat = first agent by `createdAt` ASC via `fightClubService.getActiveAgent()`.

**Backend changes:**
- Helper `getActiveAgent(userId)` in `fightClubService.js` — replaces `getCaptainForCombat`
- `Agent.isCaptain` field dropped (migration `20260416000000_remove_is_captain_from_agent`)
- Deleted: `captainService.js`, `PUT /v1/agent/:id/captain` endpoint, `captainService.test.js`, `captainArenaFlow.test.js`, `backfill-captains.js`
- API responses: `captain` sub-object removed from `/v1/user/me`, `/v1/user/login/:login`, `/v1/user/id/:id`, `/v1/user/search`, `/v1/friends/list`
- `researchGateService.migrateResearchForCaptain` → `migrateAgentResearch` (no longer gated by captain flag)

**Frontend changes:**
- Deleted `UserCaptainBadge.vue`, all 5 usages replaced
- `agentState`: `currentCaptain` getter → `activeAgent`, `setCaptain` action removed, sort no longer uses `isCaptain`
- `ProfileView`: Captain Layer section removed
- `AgentDetailView`: "Make Captain" button + confirm dialog removed
- `AgentCard`: `isCaptain` prop → `isActive`, FIGHT button now on active agent
- `PreparationView`: `currentCaptain` → `activeAgent`, error key `errNoCaptain` → `errNoActiveAgent`
- `CardFightView`, `cardFightState`: captain vars renamed to agent vars
- `MatchmakingView`, `FriendCard`, `PlayerSearchResult`, `ChallengeNotification`, `RatingsView`: removed UserCaptainBadge

**i18n:** 15 captain keys removed × 11 locales = 165 deletions. 1 new key `fight.errNoActiveAgent` in all 11 locales.

**Rationale:** Captain concept added complexity without clear UX benefit. First-by-createdAt rule is deterministic, requires no UI for user action, and matches actual behavior (Fighter #1 was always the default captain anyway).

### Visual Redesign — Roadmap & Branch State

Visual rebrand to v23 palette. **Current dev branch:** `claude/setup-project-initialization-KyxUY`. **Not in main.** Captain Removal (Phase −1, above) merged separately.

**Done (local):** Phase −1 (Captain Removal ✅), Phase 1 (Visual Foundation ✅), Phase 2 (AppShell + View Layering ✅), Phase 3.1–3.9 (Screen Port, 9 of 10 v2 views landed).

**Not done:** Phase 3.10 (CardFightViewV2), Phase 4 (decorative → real-data wiring: stake, strategy, energy, wagmi wallet), Phase 5 (i18n full pass across 11 locales), Phase 6 (cutover of non-v2 views + cleanup of suffixed routes).

See subsections below for details — do not duplicate content here.

### Phase 1 — Visual Rebrand Foundation — ✅ COMPLETE

Tokens + fonts + atmosphere migrated to v23 palette.

**Backgrounds:** `--hex-bg-deep: #070811`, `--hex-bg-card: rgba(14, 16, 28, 0.85)`.

**Archetypes repalette:** all 6 archetypes to v23 values (predator #FF066F, sentinel #2ee07f, ghost #A855F7, analyst #4dd9ff, maverick #FFA133, juggernaut #D4A843). New `--hex-arch-warden` alias = juggernaut.

**Fonts:** Anonymous/AnonymousBalance/Inter/Impact/Roboto removed. Google Fonts: Archivo Black (display), Space Grotesk (body), JetBrains Mono (mono).

**Atmosphere:** new `src/styles/atmosphere.css` with `.grain`, `.vignette`, `.scanlines` classes. Not yet applied to any view — Phase 2 (AppShell) will wire them.

**Known risks (to verify in Phase 3 smoke):**
- Sentinel (green) visually close to `--hex-success` — possible conflict on screens with both
- Analyst (cyan) visually close to `--hex-branch-speed` — possible conflict on Fighter Detail
- Predator = `--hex-primary` — "one pink source per screen" rule updated: when predator context is active on a screen, primary pink CTA yields the accent

**Not in Phase 1:** view layering, AppShell, screen port, component removal. Those are Phase 2+.

### Phase 2 — AppShell + View Layering — ✅ COMPLETE

Foundation for v23 visual port. Existing views unchanged, infrastructure ready for Phase 3.

**Added:**
- `src/composables/useActiveView.js` — derives view name from route, syncs `<body class="is-{name}">`
- `src/components/shell/AppShell.vue` — wraps `<router-view>` with atmosphere layers + view-fade transition (opacity + blur, 400ms)
- `src/styles/view-layers.css` — HUD pointer-events pattern + canvas fix utility classes

**App.vue updated:** dual `<RouterView>` replaced with `<AppShell />`. Header/BottomMenu/toasts/notifications preserved. `isScrollableComponent` computed removed. Scroll events forwarded via `@scroll` emit.

**Body class mapping** (for scoped styles):
- `is-pit` (ArenaFightClub), `is-preparation` (ArenaFight), `is-fight` (Fight), `is-detail` (AgentDetail), `is-create` (CreateAgent), `is-profile` (Profile/Balance/Wallet/Account/Skins/UserProfile), `is-training`, `is-mm` (Matchmaking), `is-ratings`, `is-clan`, `is-friends`, `is-spectate`, `is-home`, `is-auth` (Login/Signup/Reset/TelegramLogin), `is-default`

**View transitions:** Approach A (Router-based). Each route change = component unmount + remount with fade-blur. Transition key = `activeView` (not `route.fullPath`) so Profile sub-routes don't remount.

**Scene canvas rule:** All Three.js `<canvas>` elements must use class `.scene-canvas` (position: fixed; inset: 0; w/h 100%; display: block). Enforced in Phase 3 port.

**HUD pattern:** Container class `.hud` + view-specific modifier (e.g. `.pit-hud`) + `> *` pointer-events auto. Off-view children get pointer-events: none via `body:not(.is-pit) .pit-hud > *`. Prevents ghost clicks during fade transitions.

### Phase 3 — Screen Port (9 of 10 done)

All v2 views live in `src/views/new/` alongside originals. Legacy views untouched — routes use `-v2` suffix for A/B coexistence until Phase 6 cutover.

| # | View file | Route | Route name | Notes |
|---|-----------|-------|------------|-------|
| 3.1 | `PitView.vue` | `/arena/pit` | `ArenaPit` | 3D pit scene (Three.js) + HUD overlays. Entry hub to Club Mode. BottomMenu hidden (immersive). |
| 3.2 | `ProfileViewV2.vue` | `/profile-v2` | `ProfileV2` | Tabs: Identity, Performance, Friends, Settings. Wagmi wallet placeholder. |
| 3.3 | `TrainingViewV2.vue` | `/training-v2` | `TrainingV2` | Heavy-bag (3D), taps, daily. Energy bar is decorative (stub 100%). |
| 3.4 | `RatingsViewV2.vue` | `/ratings-v2` | `RatingsV2` | Tabs: Global, Friends, Clan, Country, Live. Country/Live = "coming soon". |
| 3.5 | `ClanViewV2.vue` | `/clan-v2/:id?` | `ClanV2` | Separate route (own view file), not a sub-component of ClanView. |
| 3.6 | `MatchmakingViewV2.vue` | `/matchmaking-v2` | `MatchmakingV2` | PvP queue + Opponent Found card. BottomMenu hidden. |
| 3.7 | `CreateFighterViewV2.vue` | `/arena/club/create-v2` | `CreateAgentV2` | 3-step wizard: archetype → name → confirm. |
| 3.8 | `FighterDetailViewV2.vue` | `/arena/club/:agentId/v2` | `AgentDetailV2` | 4 tabs: Overview, Moves, Tactics, Fights. 3D fighter scene. |
| 3.9 | `PreparationViewV2.vue` | `/arena/fight-v2` | `ArenaFightV2` | Deck builder (5 slots, 3 branches pool) + decorative strategy/stake. After fix: `agent/updateDeck` syncs `state.agents[]`. |
| 3.10 | CardFightViewV2 | NOT YET | NOT YET | TODO — next sub-ТЗ (3D fight scene). |

**Decorative elements in V2 views** (no backend support, render-only until Phase 4): Preparation strategy + stake, Training energy bar, Ratings Country/Live tabs, Profile wagmi wallet connect.

### Phase 3 — Three.js Structure (`src/three/`)

```
src/three/
  helpers/
    atmosphereScene.js     — shared sky/fog/light atmosphere setup
    audioEngine.js         — audio playback helper (not wired to any view yet)
    crowdSilhouette.js     — background crowd silhouettes
    fighterLowPoly.js      — low-poly fighter mesh generator
    textures.js            — shared texture loaders/caches
  scenes/
    pitScene.js            — aggregator for PitView 3D scene
    pitArena.js            — arena ring geometry
    pitEnvironment.js      — environment lights/props
    fighterDetailScene.js  — scene for FighterDetailViewV2
```

Scenes are pure JS modules (no Vue). Each scene module exports an `init…Scene(canvas, opts)` that mounts the scene to a canvas and returns `{ scene, camera, renderer, cleanup }`. Helpers reused across scenes.

### Phase 3 — i18n Status

7 `*.v2` subsections exist in `en.js` + 1 new top-level section:

| i18n path | Used by | Note |
|-----------|---------|------|
| `profile.v2` | ProfileViewV2 | |
| `training.v2` | TrainingViewV2 | |
| `rating.v2` | RatingsViewV2 | tabGlobal/Friends/Clan/Country/Live + lblSearch |
| `preparation.v2` | PreparationViewV2 | |
| `fighter.v2` | FighterDetailViewV2 | |
| `create.v2` | CreateFighterViewV2 | |
| `xpAllocation.v2` | FighterDetailViewV2 | lblFilters, lblSearch |
| `pit` (top-level) | PitView | **Not** a `.v2` subsection — Pit has no legacy counterpart. |

**No new keys added** (reuse existing): ClanViewV2 uses `t.clan.*` (lblNotFound, lblBrowse, lblJoin, lblClanPrivate, lblClanFull); MatchmakingViewV2 uses `t.pvp.*` (cancel, opponentFound, fightStartsIn, noPlayersFound, tryAgain, backToArena). Same labels as originals, so no `.v2` subsection added.

**Known i18n debt:** MatchmakingViewV2 also references `t.pvp.v2.lblFilters` / `t.pvp.v2.lblSearch` (lines 26, 41), but `pvp.v2` subsection does not exist in `en.js` — fallback to inline strings "FILTERS" / "SEARCH" works, but key path is dead. Park: either add `pvp.v2` or re-point to `xpAllocation.v2.lblFilters`.

Phase 1 i18n policy applies: en + ru are source of truth; 9 other locales inherit EN fallback for v2 subsections until Phase 5.

### Phase 3 — What's Deferred to Later Phases

- **CardFightViewV2** — Phase 3.10 (next)
- **Backend wiring** for decorative UI: Preparation stake (currency bet), Preparation strategy (AI behavior override), Training energy system (currently stub 100%), Profile wallet (wagmi connect placeholder) — Phase 4
- **Live matches feed + country rankings** in RatingsViewV2 — Phase 4
- **Sound** in TrainingViewV2 (helper `audioEngine.js` exists, not wired) — Phase 4
- **Full i18n pass** across 11 locales for all `*.v2` subsections + ClanV2/MMV2 reused keys audit — Phase 5
- **Cutover:** remove `-v2` route suffixes, delete legacy views, delete legacy components — Phase 6
