# HEXLASH Full Audit Report

**Date:** 2026-03-25
**Branch:** `claude/hexlash-full-audit-WvXMd`
**Scope:** Frontend, Backend, Game Logic, WebSocket, i18n, Data/Models, Assets, Security

---

## CRITICAL (Breaks functionality / Security risk)

### SEC-01. JWT_SECRET fallback to hardcoded 'default-secret'
- **File:** `backend/src/config.js:6`
- **Description:** `JWT_SECRET: process.env.JWT_SECRET || 'default-secret'` — if the env var is not set, all JWTs are signed with a publicly known secret. Any attacker can forge valid tokens.
- **Fix:** Remove fallback, crash on startup if JWT_SECRET is missing.

### SEC-02. Telegram auth has no signature validation
- **File:** `backend/src/routes/auth.js:93-131`
- **Description:** The `/v1/auth/telegram` endpoint accepts any `payload` object without verifying Telegram's `hash` signature. An attacker can create accounts as any Telegram user by sending a crafted payload with arbitrary `id` and `first_name`.
- **Fix:** Validate Telegram WebApp `initData` hash using the bot token per [Telegram docs](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).

### SEC-03. Email verification accepts any code without auth
- **File:** `backend/src/routes/user.js:109-127`
- **Description:** `POST /v1/user/verify-email` has no auth middleware and accepts any `code` + `userId` — anyone can mark any user's email as verified by guessing/knowing the userId.
- **Fix:** Add auth middleware, or implement actual verification token validation.

### SEC-04. Password reset is a no-op
- **File:** `backend/src/routes/user.js:70-89`
- **Description:** `POST /v1/user/reset` accepts email but does nothing (comment says "In production, send a password reset email here"). This is dead functionality that misleads users into thinking their password was reset.
- **Fix:** Implement actual password reset flow or remove the endpoint and disable the UI button.

### SEC-05. No rate limiting on auth endpoints
- **File:** `backend/src/routes/auth.js`
- **Description:** `/v1/auth/login` and `/v1/auth/register` have no rate limiting. Brute-force attacks on login and mass account creation are possible. Only AI endpoints have rate limiting (5/min).
- **Fix:** Add rate limiting (e.g., 5 login attempts per minute per IP).

### SEC-06. No body size limit on express.json()
- **File:** `backend/src/index.js:60`
- **Description:** `app.use(express.json())` uses the default 100KB limit, but there's no explicit limit set. Large JSON payloads could be used for DoS. More critically, WebSocket messages have no size validation at all.
- **Fix:** Set explicit limit: `express.json({ limit: '100kb' })`. Add WebSocket message size validation.

### SEC-07. CORS allows any *.vercel.app subdomain
- **File:** `backend/src/index.js:45`
- **Description:** `/\.vercel\.app$/.test(origin)` allows ANY Vercel-hosted app to make authenticated requests to the API. An attacker can deploy a malicious app on Vercel and steal user data.
- **Fix:** Restrict to specific Vercel domains (e.g., `hexlash*.vercel.app`).

### SEC-08. XSS risk via v-html with i18n content
- **Files:** `src/views/PageView.vue:15`, `src/components/Error.vue:7`, `src/components/Info.vue:7`, `src/views/ClubView.vue:36`, `src/components/fragments/auth/Getstarted.vue:7,20,38`
- **Description:** Multiple uses of `v-html` to render content. If locale files or user input contain malicious HTML/JS, XSS is possible. PageView renders help/rules content with `v-html`.
- **Risk:** Medium — locale files are developer-controlled, but ClubView's `formattedMembers` could contain user-supplied data.

### GAME-01. PvE vs PvP dice effects are fundamentally different
- **Files:** `src/core/state/modules/cardFightState.js:450-477` (PvE) vs `backend/src/services/pvpCombatEngine.js:278-296` (PvP)
- **Description:** Dice effects have completely different mechanics between PvE and PvP, not just different values:

| Effect | PvE (frontend) | PvP (backend) |
|--------|----------------|---------------|
| Heal | +15 HP (instant) | +20 HP (instant) |
| Adrenaline | 2x damage multiplier (1 round) | +30% damage (2 rounds) |
| Shield | Block next attack (1 round) | -50% incoming damage (2 rounds) |
| Blind | Enemy misses next attack (1 round) | 50% miss chance (2 rounds) |
| Rage | Instant -20 HP to enemy | +50% damage (2 rounds) |
| Crit | Instant -30 HP to enemy | x2 damage (1 round) |

- **Impact:** Players learn dice effects in PvE that behave completely differently in PvP. Rage/Crit are instant damage in PvE but buff-based in PvP. This is confusing and undocumented.

### GAME-02. PvE combat has dodge/crit mechanics that PvP lacks
- **File:** `src/core/engine/combatEngine.js:6-8`
- **Description:** PvE has `DODGE_CHANCE = 0.12` and `CRIT_CHANCE = 0.10` with `CRIT_MULT = 1.5` built into the action-based combat. PvP has no such mechanics — it uses a completely different damage model (direct move damage, no dodge/crit on base attacks).
- **Impact:** PvE and PvP feel like different games. Players trained on PvE dodge/crit will find PvP confusing.

### GAME-03. PvP creates new PrismaClient on every fight end
- **File:** `backend/src/services/pvpCombatEngine.js:480-481`
- **Description:** `saveFightResult()` creates `new PrismaClient()` every time a PvP fight ends. This leaks database connections and will crash the server under load.
- **Fix:** Import the shared Prisma instance instead of creating new ones.

---

## IMPORTANT (Affects quality / Could break)

### BE-01. 9 separate PrismaClient instances instead of singleton
- **Files:** `backend/src/routes/auth.js:7`, `club.js:9`, `fight.js:6`, `task.js:6`, `friends.js:4`, `user.js:9`, `handler.js:7`, `pvpCombatEngine.js:481`
- **Description:** Each route file and the WebSocket handler create their own `new PrismaClient()`. This creates unnecessary connection pool overhead (each instance opens its own pool).
- **Fix:** Create a single shared `prisma` instance in a `db.js` module.

### BE-02. Matchmaking timeout silently removes player
- **File:** `backend/src/services/matchmaking.js:52-54`
- **Description:** When a player times out after 2 minutes in the matchmaking queue, they are silently removed. No `MatchmakingTimeoutMsg` is sent to the client — the player just waits forever on the UI.
- **Fix:** Send a timeout notification via WebSocket when removing a player from the queue.

### BE-03. No WebSocket heartbeat/ping-pong
- **File:** `backend/src/websocket/handler.js`
- **Description:** No ping/pong mechanism to detect stale connections. Dead connections will remain in the `clients` Map until the TCP timeout (can be minutes). Stale connections in matchmaking queue or active PvP matches won't be detected quickly.
- **Fix:** Implement ping/pong every 30s, close connections that don't respond.

### BE-04. `dice_choice` message type handled but never sent by frontend
- **File:** `backend/src/websocket/handler.js:119`
- **Description:** The handler routes `dice_choice` to pvpHandler, but the frontend never sends this message type. The pvpHandler also doesn't handle `dice_choice` (only `dice_roll` and `coach_choice`). This is dead code.

### BE-05. File serve endpoint has no auth
- **File:** `backend/src/routes/file.js:9`
- **Description:** `GET /v1/file/get/:filename` serves uploaded files without authentication. While it has directory traversal protection (`path.basename`), anyone can access uploaded avatars if they know/guess the UUID filename.
- **Risk:** Low — filenames are UUIDs, but still violates principle of least privilege.

### FE-01. 9 unused Vue components
- **Files:**
  - `src/components/pvp/ChallengeModal.vue` — legacy, replaced by ChallengeNotification
  - `src/components/fragments/fight/AutoFightToggle.vue` — not imported anywhere
  - `src/components/fragments/fight/Fighter.vue` — not imported
  - `src/components/fragments/auth/Getstarted.vue` — not imported
  - `src/components/fragments/training/PunchingBag.vue` — not imported (replaced by Punch3D?)
  - `src/components/fragments/training/BranchColumn.vue` — not imported
  - `src/components/fragments/profile/account/ChangeSkin.vue` — not imported
  - `src/components/fragments/profile/wallet/WalletBalanceCard.vue` — not imported
  - `src/components/fragments/cards/DeckBuilder.vue` — not imported (view exists as DeckBuilderView)
- **Impact:** Dead code bloat, increases bundle size.

### FE-02. 2 unused data models
- **Files:** `src/core/models/deckModel.js`, `src/core/models/cardModel.js`
- **Description:** These model files are never imported anywhere in the codebase.

### FE-03. Coach advice mechanics differ between PvE and PvP
- **PvE** (`src/core/engine/aiStrategy.js`): Coach boost applies +25 to action priority via `setCoachBoost()`. This affects AI action selection, not damage directly.
- **PvP** (`backend/src/services/pvpCombatEngine.js:401-405`): Coach applies percentage-based effects — `coach_attack` (+25% dmg), `coach_defense` (-30% incoming), `coach_position` (+15% dmg & -15% incoming) for 4 rounds.
- **Impact:** Coach advice has completely different effects between modes. PvE coach changes AI behavior, PvP coach modifies damage values.

### FE-04. 139 console.log/warn/error statements in frontend
- **Top offenders:** `webSocketState.js` (12), `WebSocketClient.js` (9), `cardFightState.js` (8), `friendsState.js` (8), `taskState.js` (6), `clubState.js` (6), `contractState.js` (6)
- **Impact:** Leaks internal state to browser console in production. Vite build config with terser drops console, but only if configured correctly.

### BE-06. 80+ console.log statements in backend
- **Top offenders:** `pvpCombatEngine.js` (12), `matchmaking.js` (11), `friends.js` (10), `handler.js` (8), `pvpHandler.js` (5)
- **Impact:** Excessive logging in production. Should use structured logger with log levels.

### BE-07. Password reset endpoint has no auth but is a no-op
- **File:** `backend/src/routes/user.js:70`
- **Description:** `POST /v1/user/reset` has no auth middleware. While currently harmless (no-op), if someone adds reset logic later, it could be exploited to reset any user's password.

---

## MINOR (Dead code, style, TODO)

### MINOR-01. TODO comment in ClubWithdraw
- **File:** `src/components/fragments/club/ClubWithdraw.vue:106`
- **Content:** `// TODO Сделать заявки на вывод` (Make withdrawal requests)

### MINOR-02. Duplicate localStorage language keys
- **Description:** Both `hexlash-language` and `preferredLanguage` are used for language storage. Potential confusion about which is authoritative.

### MINOR-03. `getPreviousRoute` comment mismatch
- **File:** `src/router/index.js:66`
- **Description:** Comment says "Возвращаем предпоследний маршрут" (return second-to-last route) but code returns `routeHistory[routeHistory.length - 1]` (the last route).

### MINOR-04. Telegram auth creates weak temp password
- **File:** `backend/src/routes/auth.js:108`
- **Description:** `Math.random().toString(36).slice(-8)` generates a weak 8-char password. While temporary, it's returned in the API response (`tempPassword`), which could be intercepted.

### MINOR-05. Locale top-level keys are consistent
- All 11 locales (en, ru, de, es, fr, pt, ar, hi, ja, ko, zh) have matching top-level key structure. Deep key comparison may reveal missing nested keys but top-level structure is sound.

### MINOR-06. All sound files are used
- `punch_air.mp3`, `punch_hit.mp3`, `rain.mp3` — all referenced in code (BottomMenu, TrainingView, RainView).

### MINOR-07. All 3D models are used
- `punching-bags.gltf`, `punching-bags.bin`, `scene.glb` — referenced in Punch3D.vue.

### MINOR-08. `combatResultModel.js` only imported in 1 file
- **File:** `src/core/models/combatResultModel.js`
- **Description:** Only imported by `combatEngine.js`. Consider if the model abstraction is needed or if it could be inlined.

---

## STATISTICS

| Category | Count |
|----------|-------|
| Critical | 11 |
| Important | 10 |
| Minor | 8 |
| Frontend files checked | 96 (.vue) + 40+ (.js) |
| Backend files checked | 15+ |
| Total console.log/warn/error (frontend) | 139 across 40 files |
| Total console.log/warn/error (backend) | 80+ across 15 files |
| Unused Vue components | 9 |
| Unused data models | 2 |
| TODO/FIXME comments | 1 |
| Prisma models defined | 12 |
| PrismaClient instances | 9 (should be 1) |
| Locale languages | 11 (all structurally consistent) |
| Routes without auth that should have it | 2 (verify-email, reset) |

---

## Priority Recommendations

### Immediate (do now):
1. **SEC-01**: Remove JWT_SECRET fallback
2. **SEC-02**: Add Telegram auth signature validation
3. **SEC-05**: Add rate limiting to auth endpoints
4. **SEC-07**: Restrict CORS to specific Vercel domains
5. **GAME-03**: Fix PrismaClient leak in pvpCombatEngine

### Short-term (this sprint):
1. **SEC-03**: Fix email verification endpoint
2. **BE-01**: Consolidate PrismaClient to singleton
3. **BE-02**: Add matchmaking timeout notification
4. **BE-03**: Implement WebSocket heartbeat
5. **GAME-01**: Document or unify PvE/PvP dice effects

### Medium-term (backlog):
1. **FE-01**: Remove 9 unused components
2. **FE-04/BE-06**: Replace console.log with structured logger
3. **SEC-04**: Implement actual password reset
4. **GAME-02**: Document PvE/PvP combat differences
5. **FE-02**: Remove unused models
