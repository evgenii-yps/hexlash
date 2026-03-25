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
- **Description:** `saveFightResult()` creates `new PrismaClient()` every time a PvP fight ends. This leaks database connections and will crash the server under load. Also: `$disconnect()` is called on success but NOT on error (catch block on line 563 just logs), so errors leak connections too.
- **Fix:** Import the shared Prisma instance instead of creating new ones.

### GAME-04. PvP combat completely ignores player archetypes
- **File:** `backend/src/services/pvpCombatEngine.js:127-200`
- **Description:** PvP has NO action system (attack/defense/position). Both players simply deal their move's damage every round. Speed only determines knockout order. The archetype modules (predator, sentinel, ghost, analyst, maverick, juggernaut) that players carefully select are **completely ignored** in PvP — they are never consulted by the PvP engine. PvE uses a full action-based system with `ModuleAIStrategy` where archetypes drive behavior (dodge, crit, blocking, positioning). This means the core character-building mechanic has zero impact in PvP.
- **Impact:** Major gameplay inconsistency. Players invest in archetype selection that only matters in PvE. PvP fights are purely deterministic based on deck composition + dice/coach RNG.

### GAME-05. Auto Fight collapses draw to 'lose' for XP progression
- **File:** `src/core/state/modules/autoFightState.js:514-516`
- **Description:** Auto fight dispatches `progression/onFightEnd` with result mapped as `win` or `lose` — draws are collapsed into `lose` (`fightData.result === 'win' ? 'win' : 'lose'`). Draws give the same XP as losses in auto fight progression.
- **Impact:** Players get penalized for draws in auto fight mode.

### GAME-06. Auto Fight dice only used once per fight
- **File:** `src/core/state/modules/autoFightState.js:129`
- **Description:** Auto fight dice simulation uses `diceUsed` as a boolean that becomes true after first use and never resets. In live PvE, players can use dice multiple times (with cooldown). Auto fights are slightly weaker than manual play.

### SEC-09. User delete leaves dangling foreign keys
- **File:** `backend/src/routes/user.js:93-106`
- **Description:** `POST /v1/user/delete` deletes UserAchievement, UserSocialTask, UserDailyTask, PunchInfo, and User, but does NOT delete: Fights (fighterOneId/fighterTwoId/winnerId become dangling), FriendRequests, Friendships, or owned Clubs. This will cause foreign key constraint violations or orphaned data.
- **Fix:** Delete or nullify all related records before deleting the User, or use cascading deletes in Prisma schema.

### SEC-10. Skin value not validated against allowed filenames
- **File:** `backend/src/routes/user.js:237-253`
- **Description:** `PUT /v1/user/skin` accepts any string as skin value with no validation against allowed skin filenames. A user could set their skin to `../../etc/passwd` or an XSS payload that gets rendered in another user's browser via `<img :src="...">`.
- **Fix:** Validate skin value against a whitelist of allowed skin filenames.

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

### BE-08. WebSocket reconnect overwrites without closing old socket
- **File:** `backend/src/websocket/handler.js:57`
- **Description:** When a user reconnects, the old WebSocket reference is silently overwritten: `clients.set(userId, ws)`. The previous socket is not closed. If the old socket is still alive, its `close` event will fire later and remove the NEW valid connection from the `clients` map, leaving the user disconnected.
- **Fix:** Close the old socket before replacing: `if (clients.has(userId)) clients.get(userId).close();`

### BE-09. PvP match stuck in 'waiting' forever if one player never readies
- **File:** `backend/src/services/pvpMatchManager.js`
- **Description:** No timeout for matches stuck in `waiting` state. If one player sends `pvp_ready` but the other never does (disconnect, close tab), the match object stays in `activeMatches` forever (memory leak). No overall match timeout exists.
- **Fix:** Add a 30s timeout after match creation; if both players haven't readied, cancel the match.

### BE-10. No helmet middleware for security headers
- **File:** `backend/src/index.js`
- **Description:** No `helmet` middleware is installed. Missing security headers: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, X-XSS-Protection, etc.
- **Fix:** `npm install helmet` and `app.use(helmet())`.

### BE-11. Friends error response leaks internal details
- **File:** `backend/src/routes/friends.js:88`
- **Description:** Error response includes `details: error.message` which can expose Prisma errors, stack traces, and internal DB schema to the client.
- **Fix:** Remove `details` from error responses; log internally only.

### BE-12. CLAUDE.md documents stale AI config values
- **File:** `CLAUDE.md` vs `backend/src/config.js:37-38`
- **Description:** CLAUDE.md states `ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'` and `AI_TRAINER_MAX_TOKENS = 500`, but actual code uses `'claude-haiku-4-5-20251001'` and `300`. Documentation is stale.

### BE-13. Matchmaking O(n^2) polling with excessive logging
- **File:** `backend/src/websocket/handler.js:590-597`, `backend/src/services/matchmaking.js:94`
- **Description:** Matchmaking poll (every 3s) iterates all queued players and for each calls `tryFindMatch` which iterates the entire queue — O(n^2) per tick. Each comparison logs to console (line 94), creating massive log volume under load.
- **Fix:** Use event-driven matching instead of polling, or at minimum remove per-comparison logging.

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
| Critical | 16 |
| Important | 17 |
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
6. **SEC-09**: Fix user delete dangling foreign keys
7. **SEC-10**: Validate skin value against whitelist
8. **BE-08**: Fix WebSocket reconnect overwrite race condition
9. **GAME-04**: Decide on PvP archetype system -- implement or document as intentional

### Short-term (this sprint):
1. **SEC-03**: Fix email verification endpoint
2. **BE-01**: Consolidate PrismaClient to singleton
3. **BE-02**: Add matchmaking timeout notification
4. **BE-03**: Implement WebSocket heartbeat
5. **BE-09**: Add PvP match ready timeout
6. **BE-10**: Add helmet security headers
7. **BE-11**: Stop leaking error details to client
8. **GAME-01**: Document or unify PvE/PvP dice effects
9. **GAME-05**: Fix auto fight draw-to-lose XP collapse

### Medium-term (backlog):
1. **FE-01**: Remove 9 unused components
2. **FE-04/BE-06**: Replace console.log with structured logger
3. **SEC-04**: Implement actual password reset
4. **GAME-02**: Document PvE/PvP combat differences
5. **FE-02**: Remove unused models
6. **BE-13**: Optimize matchmaking from O(n^2) polling
7. **GAME-06**: Fix auto fight dice single-use limitation
