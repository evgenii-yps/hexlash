# Phase 0 Report — Sub-epic 7 — Visual polish + Auth/Wallet redesign — PART 3A

**Continued from PART 1 + PART 2.** This part covers Subsections 1-3 of the 6 mandatory enhancement subsections.

---

## Subsection 1 — API contract verification

Phase 0 mandate: exact signatures, getter paths, mutation/action shapes, constants imports, exact field names. Below — factual reference table for Phase 1 ТЗ. Anything not listed here = NOT verified.

### Vuex actions/mutations/getters (relevant к Sub-epic 7 surface)

| Path | Type | Signature | File:line |
|---|---|---|---|
| `master/getMaster` | getter | computed ref returning UserModel instance | `src/core/state/modules/masterState.js` (verified via 6B-3 + Sub-epic 5B usage) |
| `master/getLoginState` | getter | returns object with `{ isAuthenticated: boolean, authError: string }` | `src/router/index.js:222` (`isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false`) |
| `master/getResetState` | getter | returns `{ loading, errorMessage, successMessage }` | `src/components/fragments/auth/Reset.vue:52` |
| `master/login` | action | dispatch payload `{ login, password }` | `src/components/fragments/auth/Login.vue:99` |
| `master/register` | action | dispatch payload `{ login, password }` | `src/components/fragments/auth/Signup.vue:130` (signature: `{ login, password }` only — no `referralCode` in current FE call; backend supports referralCode but not surfaced via this dispatch) |
| `master/resetPassword` | action | dispatch payload `email: string` | `src/components/fragments/auth/Reset.vue:55` |
| `master/telegram` | action | dispatch payload `{ chatId, initData, hash, inviteCode }` | `src/components/fragments/auth/TelegramLogin.vue:80+` |
| `master/updateMaster` | action | dispatch payload `{ walletAddress }` (wallet sync); other call patterns include `{ language }`, `{ skin }` | `src/components/fragments/profile/wallet/ProfileWallet.vue:43`; `src/components/hud/HudProfile.vue:385`; per CLAUDE.md walletAddress sync convention |
| `master/setLanguage` | action | dispatch language code string | per CLAUDE.md 5B Sub-epic — 4-step Vuex action (legacy ChangeLanguage.vue parity) |
| `master/setInfoMessage` | mutation | commit payload `InfoMessageModel` instance | per CLAUDE.md 5L precedent + 5O bug-bundle |
| `master/setErrorMessage` | mutation | commit payload `ErrorMessageModel` instance | per CLAUDE.md 5L Phase 2 + 5O P3 bug-bundle |
| `master/deleteAccount` | action | (no payload? — internal-only — verify before AW3 ChangePassword commit edits) | `src/components/fragments/profile/account/DeleteAccount.vue` (consumed by HudProfileAccount.vue) |
| `master/sendCheckLoginAvailable` | action | debounce check (signature TBD — verify before AW3 ChangeLogin commit) | `src/components/fragments/profile/account/ChangeLogin.vue` |
| `punch/setMuted` | mutation | commit boolean | per CLAUDE.md 5B `SoundToggle` |
| `punch/isMuted` | getter | returns boolean | per CLAUDE.md 5B |
| `punch/set2DPunch` | mutation | commit boolean (Switcher3DPunch consumer) | `src/components/fragments/profile/account/Switcher3DPunch.vue:29-31` |
| `punch/is2DPunchEnabled` | getter | returns boolean | `src/components/fragments/profile/account/Switcher3DPunch.vue:27` |
| `friends/searchPlayers` | action | reshapes API response — currently DROPS captain field (carry-over #11) | `src/core/state/modules/friendsState.js:133-141` |
| `friends/sendChallenge` | action | WS dispatch via `webSocket/sendMessage` | per CLAUDE.md 5B HudProfile Friends card |
| `friends/hasPendingChallenge` | getter | 10s cooldown guard | per CLAUDE.md 5B |
| `webSocket/handleInternalError` | action | called from ErrorMsg case parser | `src/core/state/modules/webSocketState.js:144` |
| `webSocket/sendMessage` | action | WS message dispatch | per CLAUDE.md WS protocol |

### UserModel field shape (relevant к Auth/Wallet/Profile)

Per CLAUDE.md "Captain in Public UI" + Sub-epic 2 Recovery #83 + 6B-3a-backend:
- Top-level fields read by Sub-epic 7 surface: `id`, `login`, `name`, `email` (top-level via UserModel.fromJSON peel), `walletAddress`, `skin`, `clanId`, `clanRole`, `rating`, `wins`, `losses` (FLAT, NOT `.stats`), `totalTaps`, `freeTokens`, `wonTokens`, `lostTokens`, `balance`, `language`, `emailVerified`, `referredBy`, `invitedUsers`, `progression`, `deck`, `settings`, `achievements`
- Nested: `userData.captain` (optional) — `{ id, name, belt, isHexmaster, elo, primaryModule, ... }` per CAPTAIN_PUBLIC_SELECT
- Methods: `getBalance()` (returns formatted balance / 10^DECIMALS as fixed-point string)
- **Confirmed shape mismatch carry-overs:** Sub-epic 2 had to extend constructor + fromJSON to extract `captain` + `rating` (Recovery #83); Sub-epic 5 surfaced field naming asymmetry (`master.userData.captain.{name, elo}` vs MatchFoundMsg `opponent.{username, rating}` — carry-over #33).

### Wagmi composable signatures (relevant к Wallet)

Per `src/components/fragments/profile/wallet/ConnectWallet.vue:84-92`:
- `useAccount()` → `{ address, isConnected, chain }` — `address` is reactive string ref `0x...`; `isConnected` boolean ref; `chain` object ref
- `useConnect()` → `{ connect }` — `connect({ connector })` async
- `useDisconnect()` → `{ disconnect }` — `disconnect()` async
- `useConnectors()` → `connectors` array of connector objects (each has `id`, `name`, `icon`?, `type`)

Wagmi config exports `config` from `src/core/web3/wagmiConfig.js`. Imported в `main.js` via WagmiPlugin.

### InfoMessageModel / ErrorMessageModel (relevant к Toasts)

- `InfoMessageModel.withTimeout(text: string, durationMs: number) → InfoMessageModel` — factory
- `ErrorMessageModel.withText(text: string) → ErrorMessageModel` — factory (per agentState.js precedent + 5L/5O P3 cleanup)
- File paths: `src/core/models/internal/infoMessageModel.js` (named export) + `src/core/models/internal/errorMessageModel.js` (named export)
- Usage convention: `store.commit('master/setInfoMessage', InfoMessageModel.withTimeout('text', 2000))` — NOT dispatch.

### Constants

- `DECIMALS = 6` — token decimals; used by `UserModel.getBalance()` formatting
- `__APP_VERSION__`, `__IS_PROD__` — Vite compile-time defines (NOT `import.meta.env`)
- WS constants: `WS_PING_INTERVAL_MS=30000`, `WS_PONG_TIMEOUT_MS=10000`, `PVP_READY_TIMEOUT_MS=15000` per backend config

### Router contract

- `protectedRoutes` array — checked by `router.beforeEach` guard
- `v2ProtectedNames = ['V2Fight', 'V2Matchmaking', 'V2Spectate']` (line 77) — explicit v2 child route auth marker (only 3 of 14 v2 children currently flagged — carry-over #10 systematic audit territory)
- `authRoutes` (line 9-14) — `/auth/login`, `/auth/signup`, `/auth/reset`, `/auth/telegram` — guest-only by design (NOT in protectedRoutes)
- Guard logic: `protectedRoutes.some(route => route.name === to.name || route.path === to.path) || v2ProtectedNames.includes(to.name)` (line 224-225)
- Unauthenticated redirect: `next({name: 'Login'})` (line 236)

### CSS variable groups (hexlash-ui.css)

Per agent A inventory, grouped at `:root`:
- Colors: `--hex-primary`, `--hex-primary-light`, `--hex-primary-dark`, `--hex-primary-glow`
- Backgrounds: `--hex-bg-deep`, `--hex-bg-dark`, `--hex-bg-medium`, `--hex-bg-light`, `--hex-bg-card`
- Text: `--hex-text-primary`, `--hex-text-secondary`, `--hex-text-muted`
- Status: `--hex-success`, `--hex-danger`, `--hex-warning`
- Borders: `--hex-border-default`, `--hex-border-active`, `--hex-border-strong`, `--hex-border-width`
- Spacing: `--hex-spacing-xs/sm/md/lg/xl/xxl` (4/8/16/24/32/48 px)
- Radius: `--hex-radius-sm/md/lg/xl/round` (4/8/12/16/50%)
- Fonts: `--hex-font-display` (Impact), `--hex-font-body` (Inter), `--hex-font-mono` (JetBrains Mono)
- Font sizes: `--hex-font-size-xs` (10px) through `--hex-font-size-huge` (48px)
- Glow: `--hex-glow-sm/md/lg`
- Shadows: `--hex-shadow-card/elevated/modal`
- Blur: `--hex-blur-sm/md/lg`
- Transitions: `--hex-transition-fast/normal/slow`
- Archetype variants × 6 (predator/sentinel/ghost/analyst/maverick/juggernaut, each with -dark/-light/-bg/-glow)
- Branch variants × 3 (speed/power/technique)
- Action variants × 3 (attack/defense/position)
- Dice effect variants × 6 (heal/adrenaline/shield/blind/rage/crit)
- Rank colors × 5 (bronze/silver/gold/platinum/diamond)
- Belt system: white/yellow/orange/green/blue/purple/brown/red/black/HexMaster/Stripe/Outline

---

## Subsection 2 — Negative-space verification

Phase 0 mandate: what does NOT exist that Phase 1 ТЗ might assume.

### Critical Negative-space findings

| Item | Status | Finding | Phase 1 implication |
|---|---|---|---|
| **`Modal.vue` SFC primitive в `src/components/ui/`** | ❌ Missing (CRITICAL) | **`.hex-modal-overlay` + `.hex-modal` + `.hex-modal-title` CSS classes ARE defined в `hexlash-ui.css:440-478`** ✅ — но dedicated SFC wrapper component does NOT exist. PhModal.vue (`src/components/hud/common/`) uses `.v2-ph-*` namespace specific к Epic 2 hub coming-soon scaffold, NOT generic. ConnectWallet.vue uses inline Teleport without primitive. HelpModal.vue inline Teleport. ChangePassword/ChangeLogin/DeleteAccount use Vuetify `<VModal>`. | AW3 modal swap = **inline Teleport pattern (Option a)** OR create new `Modal.vue` primitive (Option b). Recommendation Option a per Q5. |
| **`auth.css` / `wallet.css` в `src/styles/v24/`** | ❌ Missing | No dedicated v2 stylesheet for auth or wallet routes. RainView.vue uses scoped CSS only. ProfileWallet.vue / HudProfileWallet.vue use scoped CSS. | AW1/AW2 commits will likely add 2 new v24 files (`auth.css` + `wallet.css`) OR extend `profile.css` if styling is profile-adjacent. Recommendation: separate files for AW1 (auth-specific RainView + form styling) and embed wallet-specific in `profile.css` (since wallet IS sub-route of profile). |
| **Generic CSS spinner primitive** | ⚠️ Partial | No shared `.hex-spinner` class в `hexlash-ui.css`. Per-view custom spinners exist (`.tsp-spinner` в training.css, `.mm-spinner` в matchmaking.css). Vuetify `<v-progress-circular>` used в auth forms (Login/Signup/Reset) + account components (ChangeLogin/ChangePassword) + NoConnection.vue. | AW1 + AW3 + B5 (NoConnection bundle) all need spinner replacement. Two options: (a) replicate `.tsp-spinner` per consumer (duplication acceptable per CLAUDE.md 5I precedent), (b) extract `.hex-spinner` к `hexlash-ui.css` first commit. Recommendation: (a) for Sub-epic 7 scope discipline; defer (b) к Эпик 7+ if value emerges. |
| **`useAuthFlow` composable** | ❌ Missing | No dedicated composable wrapping login/signup/reset/telegram dispatch logic. Each form component handles dispatch directly. | AW1 commit edits don't need composable extraction — restyle scope only, preserve dispatch logic per Q2.2. |
| **`useWalletConnect` composable** | ❌ Missing | No abstraction over wagmi composables. Each consumer (HudProfile, ProfileWallet, HudProfileWallet) directly imports `useAccount()` + `watch(address)`. | AW2 doesn't need composable extraction — preserve existing watch-and-dispatch pattern per Q2.2. |
| **`/v2/auth*` routes** | ❌ Missing | No v2-equivalent routes for `/auth/login`, `/auth/signup`, `/auth/reset`, `/auth/telegram`. RainView.vue remains v1 mounted. | AW1 has 2 paths: (1) restyle RainView внутри (no new routes — preserves bookmark survival, single source), (2) create parallel `/v2/auth/*` view with redirect from v1 (more work, route table expansion). Recommendation: (1) — AW1 restyle in-place. v1 `/auth/*` route paths preserved but visual layer aligned к v2 design system. |
| **`/v2/spectate` watch trigger from friends** | ⚠️ Wired but non-functional | Watch Live button code present (HudProfile.vue:150-155) + handler (591-593) — but `f.status === 'in_fight'` never true (BE doesn't populate per Q6). Also `f.currentFight?.id || f.id` fallback to friend ID (not match ID). | Q6 recommendation DEFER к Sub-epic 8. |
| **Backend `currentFight` field в /v1/friends response** | ❌ Missing | `backend/src/routes/friends.js:225-239` returns 9 fields, no `currentFight`, no `'in_fight'` status. | Per Q6 — DEFER к Sub-epic 8. |
| **Backend `sendError()` consistency across all ErrorMsg producers** | ❌ Inconsistent | 5 callsites bypass `sendError` helper (lines 628/683/689/695/715). FE expects nested `errorDto`. | Per Q4 — Recommendation Option B (FE tolerant parser). |
| **Dice icon imports в HudFight.vue** | ❌ Missing | HudFight.vue uses emoji "🎲 ROLL". Asset files exist в `src/assets/images/icons/` (dice.svg, adrenaline.svg, shield.svg, blind.svg, heal.svg). | B3 commit adds imports + replaces emoji. |
| **`.sp-result--draw` CSS class** | ❌ Missing | HudSpectate.vue:116-122 computed sets `'sp-result--draw'` for draw winner. Lines 405-415 only define `.sp-result--win` and `.sp-result--loss`. | B1a commit adds rule. Recommendation: warm gold palette (`var(--hex-warning)` per draw convention). |
| **`replayed` field on fightLog entries** | ❌ Missing | useSpectateState.js:248-272 (`onSpectateFightStateResume`) appends roundResults identical к live entries. | B1b commit adds flag + `.sp-log-replayed` CSS rule. |
| **`shake` keyframes в fight-overlays.css** | ❌ Missing | No shake animation defined. v1 CardFightView.vue:1320-1327 has `@keyframes shake`. | B2 commit ports v1 keyframes к fight-overlays.css. |
| **`event-title` overlay в HudFight** | ❌ Missing | No event title display mechanism. v1 has `.event-title` template + Vuex commit + 1200ms timeout pattern. | B2 commit adds template + state field + CSS. |
| **`coachActive` / `coachRoundsLeft` fields** | ❌ Missing | useFightSimulation.js doesn't track coach boost duration. | B4 commit adds fields + decrement logic. |
| **`activeEffects` field в spectateState** | ❌ Missing | useSpectateState.js:31-55 doesn't store player1/player2 active effects. BE event payload may include them (verify before B5 commit). | B5 commit adds fields + onSpectateRoundResult parsing. |
| **Per-tab grid modifier classes (ratings)** | ❌ Missing | ratings.css single 8-col rule. | B1a adds `--clans/--agents/--fighters` modifiers. |
| **Generic `.connection-banner` CSS** | ❌ Missing | NoConnection.vue uses scoped `.no-connection` class. No shared banner primitive in v24/ для verify-email banner / connection-lost banner unification. | Q7 minor restyle keeps scoped pattern; future Эпик 7+ unification could extract `.banner-*` primitive. |

### Non-critical missing items (verified)

- No animation utility classes for fight UI beyond `hex-fade` / `hex-slide-up` / `hex-pulse` / `hex-glow-pulse` / `hex-float-up` (per CLAUDE.md 5.2 inventory). Shake / titlePop / specific @keyframes per-feature scoped.
- No v2 prefix conversion for `font-family: 'AnonymousBalance'` references (still raw font-family in places per HudFight HUD usage — expected).

---

## Subsection 3 — Real CSS class taxonomy dump

Phase 0 mandate: existing namespaces (grep results), Phase 1 ТЗ should reuse not invent.

### `.auth-*` namespace

**Status:** Sparse — only RainView + auth forms have scattered `.auth-btn`, `.auth-form` patterns.

| Selector | File | Notes |
|---|---|---|
| `.auth-btn` | Login.vue scoped, Signup.vue scoped, Reset.vue scoped | Per-form duplicate; `background-color: var(--hex-primary) !important; width: 100%; height: 50px; box-shadow: 0 0 8px rgba(255, 6, 111, 0.5)` |
| `.signup`, `.reset-password` | Login.vue | Text links via `ButtonText` component |
| `.eye-btn` | Login.vue, Signup.vue | Password visibility toggle |
| `.form-wrapper` | Reset.vue | Centers form `width: 240px` |

**No shared `.auth-form-base` or `.auth-container` selectors.** Each auth form has own scoped block. AW1 commits should consider extracting к v2 `auth.css` if patterns repeat.

### `.wallet-*` namespace

**Status:** Per-component scoped, no shared base.

| Selector | File | Notes |
|---|---|---|
| `.wallet-modal-overlay` | ConnectWallet.vue scoped | Custom Teleport modal overlay |
| `.wallet-modal` | ConnectWallet.vue scoped | Bottom-sheet style modal |
| `.connectors-list` | ConnectWallet.vue scoped | Grid of wallet options |
| `.connector-btn` | ConnectWallet.vue scoped | Individual connector button |
| `.connector-icon` | ConnectWallet.vue scoped | Wallet icon 48×48 |

### `.acc-*` / `.account-*` namespace

**Status:** No `.acc-*` namespace found. Account components use Vuetify primitives directly (no custom v2 namespace). Sub-epic 3 HUD wrapper introduces `.profile-account-*`.

| Selector | File | Notes |
|---|---|---|
| `.confirm-btn` | ChangePassword.vue scoped | Custom button styling |
| `.confirm-delete-btn` | DeleteAccount.vue scoped | `background-color: var(--hex-danger)` |
| `.profile-account-back` | HudProfileAccount.vue scoped | Sub-epic 3 wrapper back button |
| `.profile-account-title` | HudProfileAccount.vue scoped | Sub-epic 3 wrapper title |
| `.profile-account-content` | HudProfileAccount.vue scoped | Sub-epic 3 wrapper scroll area |
| `.hud-profile-account` | HudProfileAccount.vue scoped | Lesson #34 HUD overlay root |

### `.btn-*` v2 namespace (HexButton)

**Internal `.hex-button--*` modifier classes** generated by HexButton.vue:
- `.hex-button--primary`, `.hex-button--secondary`, `.hex-button--ghost`, `.hex-button--danger`, `.hex-button--archetype`
- `.hex-button--sm`, `.hex-button--md`, `.hex-button--lg`
- `.hex-button--block`, `.hex-button--has-icon`

**Legacy `.hex-btn` shorthand** from `hexlash-ui.css`:
- `.hex-btn`, `.hex-btn-primary`, `.hex-btn-secondary`, `.hex-btn-ghost`, `.hex-btn-sm`, `.hex-btn-lg`, `.hex-btn-full`

### `.modal-*` / `.ph-modal-*` v2 namespaces

**`.hex-modal-*` (CSS only — exists in hexlash-ui.css:440-478):**
- `.hex-modal-overlay` — fixed full-screen, `rgba(0,0,0,0.85)`, `backdrop-filter: var(--hex-blur-sm)`, z-index: 1000
- `.hex-modal` — `var(--hex-bg-medium)` bg, primary color border, radius `--hex-radius-xl`, `min-width: min(320px, 90vw)`
- `.hex-modal-title` — display font 24px, primary color, uppercase, glow

**`.v2-ph-*` (PhModal.vue scoped, Epic 2 hub coming-soon):**
- `.v2-ph-modal`, `.v2-ph-backdrop`, `.v2-ph-close`, `.v2-ph-kicker`, `.v2-ph-title`, `.v2-ph-desc`, `.v2-ph-soon`

**`.help-*` (HelpModal.vue):** Teleport-based, separate namespace per CLAUDE.md 5F.

**Vuetify `VModal`** consumers (16 callsites per agent B census) — to migrate AW3.

### `.input-*` v2 namespace

**`.input-*` (InputField.vue scoped):**
- `.input-field`, `.input-label`, `.input-wrapper`, `.input-element`, `.slot-container`

**`.hex-input-*` (hexlash-ui.css:484-511):**
- `.hex-input` — full input styling
- `.hex-input-number` — center-aligned mono variant

### `.hud-*` namespaces (HUD overlay convention)

Per Lesson #34 + CLAUDE.md 5B-5Q:
- `.hud-profile`, `.hud-profile-wallet`, `.hud-profile-account`
- `.hud-fight`, `.hud-spectate`, `.hud-matchmaking`, `.hud-create`, `.hud-clan`, `.hud-pit`, `.hud-ratings`, `.hud-fighter-detail`, `.hud-training`, `.hud-shop`, `.hud-help`, `.hud-user-profile`
- All follow root pattern `position: absolute; inset: 0; pointer-events: none;` + interactive children `pointer-events: auto;`

### `.mm-*` namespace (matchmaking)

Per `src/styles/v24/matchmaking.css`:
- `.mm-back`, `.mm-title`, `.mm-filters` (hidden via `v-if="false"`), `.mm-main` (the `left: 270px` gap), `.mmf-slider`, `.mmf-chip`, `.mm-results`, `.mmr-card`, `.mm-diff-badge`
- Sub-epic 5 additions: `.mm-found-*` (VS display + countdown), `.mm-timeout-*` (timeout phase)

### `.rt-*` / `.ratings-*` namespace (Ratings)

Per `src/styles/v24/ratings.css`:
- `.ratings-thead`, `.rt-row`, `.rt-tab`, `.rt-row.clickable`, `.col-arch`, `.col-belt`, `.col-wl`, `.num`
- Per-tab modifiers needed (B1a addition): `.ratings-thead--clans`, `.ratings-thead--agents`, `.ratings-thead--fighters` + corresponding `.rt-row--*`

### `.sp-*` namespace (HudSpectate)

Per HudSpectate.vue scoped style:
- `.sp-back`, `.sp-fighters`, `.sp-fighter`, `.sp-hp-bar`, `.sp-log`, `.sp-log-entry`, `.sp-log-crit`, `.sp-result`, `.sp-result-text`
- Variant modifiers: `.sp-result--win`, `.sp-result--loss`, `.sp-result--draw` (MISSING — B1a addition)
- Pending additions B1b: `.sp-log-replayed` (joined-late indicator)
- Pending additions B5: `.spectate-coach-pause`, `.sp-effect-badge`, `.sp-effect-badge--adrenaline/--shield/--blind`

### `.fight-*` / `.event-*` namespace (HudFight)

Per HudFight.vue scoped + `src/styles/v24/fight-overlays.css`:
- `.fight-hud`, `.fight-fighter`, `.fight-back`, `.surrender-btn` (Sub-epic 4b), `.fight-log`, `.fight-actor-warden`, `.fight-actor-predator`, `.dice-area`, `.dice-button`, `.dice-active-pill`, `.hit-flash`
- Pending additions B2: `.event-title`, `.event-title--dodge`, `.event-title--crit`, `.event-title--damage`, `.fight-fighter.shake`, `.dice-cooldown`
- Pending additions B3: `.modifiers-bar`, `.mod-badge`, `.mod-badge--adrenaline/--shield/--blind`, `.dice-icon-asset`
- Pending additions B4: `.coach-active-bar`, `.coach-active-icon`, `.coach-active-label`, `.coach-active-rounds`

### Existing v2 generic primitives (hexlash-ui.css)

- `.hex-title-giant`, `.hex-title-large`, `.hex-title-medium`, `.hex-title-small`
- `.hex-text`, `.hex-text-small`, `.hex-text-accent`, `.hex-number`
- `.hex-card`, `.hex-card-interactive`, `.hex-card-selected`, `.hex-card-locked`
- `.hex-progress`, `.hex-progress-fill`, `.hex-hp-bar`
- `.hex-badge`, `.hex-badge-outline`, `.hex-badge-success`, `.hex-badge-danger`
- `.hex-nav-bottom`, `.hex-nav-item`
- `.hex-pill`
- Animation keyframes: `hex-fade-in`, `hex-scale-in`, `hex-pulse`, `hex-pulse-opacity`, `hex-glow-pulse`, `hex-float-up`

### Phase 1 ТЗ implication (CSS)

When writing Phase 1 ТЗ for any commit:
1. **Always check existing namespace** before introducing new selectors — Lesson #32 convention discovery
2. **Reuse `--hex-*` tokens** — never hardcode colors/sizes that have token equivalents
3. **HUD overlay convention** (Lesson #34) — `.hud-*-*` root must specify `pointer-events: none/auto` discipline
4. **Per-feature additions** acceptable (e.g., `.sp-log-replayed` scoped к HudSpectate.vue) — no need to extract к global until 2nd consumer surfaces
5. **Avoid `.app-v2 .` prefix in scoped blocks** — only needed для global v24/*.css files; scoped blocks scope themselves

---

**END OF PART 3A.**

Continued in PART 3B — Subsections 4-6 + Lesson #36 status + Recoveries log + Phase 0 catches log + Final summary.
