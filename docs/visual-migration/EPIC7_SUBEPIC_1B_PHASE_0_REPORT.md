# Sub-epic 1b Phase 0 Report — Auth Views Redesign + RainView Removal + Telegram Excision

**Status:** Phase 0 — investigation only, READ-ONLY
**Branch:** `claude/investigate-auth-views-redesign-rFAwk` (created from main HEAD `7aaf9be` post-1a merge — Lesson #43 verified, 0 ahead / 0 behind origin/main)
**Predecessor:** Sub-epic 1a CLOSED ✅ (PR #360 merge commit `7aaf9be`)
**Date:** 2026-05-06

---

## 1. API Contract Verification

### 1.1 Frontend auth endpoints currently used

| Endpoint | Method | Path | Frontend caller | Payload | Response |
|---|---|---|---|---|---|
| Login | POST | `/auth/login` | `masterService.login` (line 90) | `{ login, password }` | `{ data: { jwtToken } }` |
| Signup | POST | `/auth/register` | `masterService.register` (line 199) | `{ login, password, referralCode? }` | `{ data: { jwtToken } }` |
| Login availability | GET | `/auth/login-available/:login` | `masterService.sendCheckLoginAvailable` (line 180) | — | `{ data: { available: bool } }` |
| Reset request | POST | `/user/reset` | `masterService.resetPassword` (line 245) | `{ email }` | `{ data: ... }` (currently 501 — see §6) |
| **Telegram (REMOVE)** | POST | `/auth/telegram` | `masterService.telegram` (line 133) | `{ payload, referralCode? }` | `{ data: { jwtToken, tempPassword?, name? } }` |

### 1.2 Backend auth route inventory (`backend/src/routes/auth.js`, 246 lines)

All endpoints under `/v1/auth/*`:

| Line | Method | Path | Limiter | Status |
|---|---|---|---|---|
| 68 | POST | `/login` | `loginLimiter` (5/15min) | KEEP |
| 101 | POST | `/register` | `registerLimiter` (3/hr) | KEEP |
| **179** | **POST** | **`/telegram`** | **`telegramLimiter` (10/15min)** | **REMOVE** |
| 233 | GET | `/login-available/:login` | none | KEEP |

**Telegram-specific code to remove from `auth.js`:**
- Lines 6 (config import: `TELEGRAM_BOT_TOKEN, TELEGRAM_AUTH_MAX_AGE_SEC`)
- Lines 29-35 (`telegramLimiter`)
- Lines 153-176 (`validateTelegramPayload` HMAC-SHA256 helper)
- Lines 178-230 (POST `/telegram` handler)
- Net removal: ~85 lines from auth.js

### 1.3 Backend Telegram dependencies

- **Packages in `package.json` (root + `backend/`):** None. Verified via `grep -i "telegram\|tg-" package.json backend/package.json` → 0 hits.
- **Helper modules:** None standalone. Telegram logic lives entirely inline in `backend/src/routes/auth.js` lines 153-230. No `backend/src/services/telegram*.js`, no `backend/src/lib/telegram*.js`.
- **Env vars:** `TELEGRAM_BOT_TOKEN` declared in `backend/src/config.js:105`, `TELEGRAM_AUTH_MAX_AGE_SEC = 300` in `backend/src/config.js:106`. NOT in `backend/.env.example` (verified via `cat backend/.env.example`). No production `.env` exposure check needed (env-only, no committed values).
- **Non-auth usage of Telegram modules:** **NONE.** `crypto.createHash` in `validateTelegramPayload` is auth-only. No Telegram bot code, no notification module, no marketing webhook.

### 1.4 Wagmi state

- **Setup:** `src/main.js:39-41,122` (`WagmiPlugin` registered globally with `wagmiConfig` from `src/core/web3/wagmiConfig.js`)
- **Existing Connect Wallet handler:** `src/components/fragments/profile/wallet/ConnectWallet.vue` (227 lines). Uses `useAccount`, `useConnect`, `useDisconnect`, `useConnectors` from `@wagmi/vue`. Contains `defineExpose({ openModal })` (Sub-Epic 5B Step 10) so external callers can trigger the modal.
- **Reuse strategy for 1b (decision #1):** Connect Wallet on Login/Signup → button visible, click → "Coming soon" toast (NO Wagmi connect call). Wagmi composables work but should NOT be invoked from auth views per decision #1 (backend SIWE flow deferred to Stream 6). **Recommendation:** Use a simple HexButton variant=secondary/ghost styled like prototype + on-click dispatches `master/setInfoMessage` toast. Do NOT mount `ConnectWallet.vue` component on auth views — coupling-free.

---

## 2. Negative-Space Verification

### 2.1 AuthLayoutView name collision

- `src/views/AuthLayoutView.vue` — does NOT exist.
- `src/views-v2/AuthLayoutView.vue` — does NOT exist.
- Layout-style precedent: NONE in `src/views/` or `src/views-v2/`. `find src -iname "*layout*" -o -iname "*shell*"` returns 0 hits. Auth pattern in this codebase is RainView (single-component-with-router-driven-children).
- **Recommendation:** `src/views/AuthLayoutView.vue` (matches `*View.vue` convention). Vue Router 4 supports nested children where parent component contains `<router-view>` slot — documented pattern.

### 2.2 Auth form components

- **Directory:** `src/components/fragments/auth/` exists with 4 files:
  - `Login.vue` (192 lines) — already migrated to HexButton + .hex-spinner (Sub-epic 7 AW1)
  - `Signup.vue` (224 lines) — already migrated
  - `Reset.vue` (126 lines) — already migrated
  - `TelegramLogin.vue` (137 lines) — TO REMOVE
- **Standalone:** YES, each is a self-contained SFC; `RainView.vue:30-33` imports them and renders one based on route.
- **Coupling to RainView chrome:** Minimal. Each form component uses `position: absolute; bottom: 10vh; left: 50%; transform: translateX(-50%)` (positioning relative to the viewport, NOT to RainView container). This means they're SELF-POSITIONING for floating-over-3D-rain. **In 1b they need re-positioning** to fit a centered card layout. Form internals (InputField + HexButton + state mgmt + Vuex dispatches) are clean and reusable verbatim — only the wrapper `position: absolute; bottom: 10vh` block needs rewriting.

### 2.3 Toast system

- **Library/pattern:** Vuex commit `master/setInfoMessage` (or `master/setErrorMessage`) with payload `InfoMessageModel.withTimeout(message, ms)`. The InfoMessage is rendered globally via `Info.vue` toast (mounted in App.vue / AppV2.vue).
- **Import:** `import { InfoMessageModel } from "@/core/models/internal/infoMessageModel.js";`
- **Usage example (verified — Sub-epic 5B / 5K precedent):**
  ```js
  import { InfoMessageModel } from "@/core/models/internal/infoMessageModel.js";
  const msg = InfoMessageModel.withTimeout(t.value.info.withdrawAfterListing, 3000);
  store.commit('master/setInfoMessage', msg);
  ```
  See `src/components/hud/HudProfileWallet.vue:53-54` for verbatim pattern. `MatchmakingView.vue:144`, `SpectateView.vue:73`, `FightView.vue:345` are alternative reference points.

### 2.4 Connect Wallet button

- **Existing component:** `ConnectWallet.vue` (227 lines) at `src/components/fragments/profile/wallet/ConnectWallet.vue`. Uses Wagmi composables + canonical `.hex-modal-*` taxonomy with `.cw-*` modifier overrides. Has `defineExpose({ openModal })`.
- **Reusable for auth views:** **NOT recommended verbatim.** Importing this component on auth views activates Wagmi `useConnect()` actually triggering wallet popups. Per decision #1, we want UI presence only with toast feedback — NOT real connect flow until backend SIWE in Stream 6. **Recommendation:** Render a styled `HexButton` (variant=secondary, with optional emoji/SVG glyph) on auth view → click handler dispatches "Coming soon" toast. ZERO ConnectWallet.vue import on auth surface.

### 2.5 Vuetify in auth

- **Current state:** `src/components/fragments/auth/*.vue` — all 4 files have ZERO actual Vuetify tag usage. Verified via `grep -E "<v-btn|<VBtn|<VBtnDark|<VModal|<v-text-field|<v-form|<VCard"` → 0 hits.
- **Stale comments referring to Vuetify:** present (B-AW1 migration history). Cosmetic, can stay or be removed in 1b cleanup.
- **Conclusion:** **Vuetify is ALREADY OUT** of auth views (Sub-epic 7 AW1 completed). Sub-epic 1b does NOT need to do Vuetify removal in auth scope — it just rewires the wrapping chrome (RainView → AuthLayoutView).
- **Vuetify removal — full project scope (out of 1b):** Many other consumers remain (40+ files: VerifyEmailView, Info, Error, NewAchievement, BottomMenu, ProfileButtons, ReferralModal, SubscribeModal, BuyTokens, GameBalanceCard, CreateClan, ClanEdit, etc.). **Out of 1b scope.** Эпик 7+ deferred per CLAUDE.md "Vuetify phase-out" intent.

### 2.6 Form validation

- **Library:** NONE. `grep -i "vuelidate\|vee-validate\|joi\|yup\|zod" package.json` → 0 hits.
- **Existing pattern:** Custom inline validation. Example `Signup.vue:124-139`:
  ```js
  if (!login.value || !password.value || !confirmPassword.value) {
    errorMessage.value = t.value.auth.signup.errorAllFields;
    return;
  }
  if (password.value.length < 8) { ... }
  if (password.value !== confirmPassword.value) { ... }
  ```
- **Recommendation for 1b:** Preserve existing custom validation logic verbatim — works, no need to introduce a library.

---

## 3. CSS Class Taxonomy

### 3.1 Form tokens available in `--hex-*`

From `src/styles/hexlash-ui.css :root` (lines 13-130):

| Token group | Available | Notes |
|---|---|---|
| Primary CTA | `--hex-primary: #FF066F`, `--hex-primary-light: #FF3D8E`, `--hex-primary-dark: #A50344`, `--hex-primary-glow: rgba(255, 6, 111, 0.5)` | Decision #6 confirmed — primary CTA = pink |
| Bg surfaces | `--hex-bg-deep: #050507` (Landing background), `--hex-bg-dark: #090909`, `--hex-bg-medium: #111111`, `--hex-bg-light: #1A1A1A`, `--hex-bg-card: rgba(17, 17, 17, 0.85)` | Card background candidate: `--hex-bg-card` |
| Text | `--hex-text-primary: #FFFFFF`, `--hex-text-secondary: rgba(255, 255, 255, 0.6)`, `--hex-text-muted: rgba(255, 255, 255, 0.35)` | Sufficient |
| Status | `--hex-success`, `--hex-danger`, `--hex-warning` | Error message color: `--hex-danger` |
| Borders | `--hex-border-default`, `--hex-border-active`, `--hex-border-strong`, `--hex-border-color` | Sufficient |
| **Missing tokens** | None — all needed tokens exist | No additions required |

### 3.2 Existing form classes globally available

From `hexlash-ui.css` (verified line ranges):

| Class | Line | Purpose |
|---|---|---|
| `.hex-input` | 579-590 | Form input — bg `--hex-bg-light`, border `--hex-text-muted`, padding md, radius md |
| `.hex-input:focus` | 592-595 | Border `--hex-primary`, glow shadow |
| `.hex-input::placeholder` | 597-599 | Color `--hex-text-muted` |
| `.hex-btn`, `.hex-btn-primary`, `.hex-btn-secondary`, `.hex-btn-ghost`, `.hex-btn-sm`, `.hex-btn-lg`, `.hex-btn-full` | 318-396 | Full button taxonomy |
| `.hex-card`, `.hex-card-interactive`, `.hex-card-selected`, `.hex-card-locked` | 404-440 | Card backgrounds |
| `.hex-modal-overlay`, `.hex-modal`, `.hex-modal-title`, `.hex-modal-body`, `.hex-modal-actions`, `.hex-modal-close` | 440-525 | Modal taxonomy (post-Sub-epic 7 C9) |
| `.hex-spinner` + `@keyframes hex-spin` | 525+ | Canonical spinner |
| `.hex-text-*`, `.hex-title-*`, `.hex-number` | 230-310 | Typography |

**Notable:** Auth fragments currently use `<InputField>` SFC (custom wrapper, NOT raw `<input class="hex-input">`). Decision for 1b: **keep `InputField`** — it works, supports password show/hide via slot. No need to swap to raw `.hex-input`.

### 3.3 Auth class prefix

- **Collision check:** `grep -rn "^\.auth-\|^\.al-" src/styles/ src/views/ src/views-v2/ src/components/` → 7 hits, all in `src/components/fragments/auth/*.vue` scoped blocks (`.auth-btn`, `.auth-loader`). Scoped, not global.
- **Recommendation:** `.auth-*` (matches existing local convention in fragments). For AuthLayoutView itself, suggest `.auth-layout` / `.auth-layout__*` BEM-light naming, mirroring Landing's `.landing__*` pattern (Sub-epic 1a precedent).
- **No global `.auth-*` exists** → safe.

### 3.4 Card styles

- `--hex-bg-elevated`: NOT defined. Closest analog: `--hex-bg-card: rgba(17, 17, 17, 0.85)` (semi-transparent dark) or `--hex-bg-medium: #111111` (solid).
- `.hex-card` class exists (lines 404-413). Bg is internally tied to `--hex-bg-card`. Default styling for elevated card with border-radius and 1px border.
- **Recommendation:** **Reuse `.hex-card`** as outer card wrapper around the form. Or build custom `.auth-layout__card` if specific aesthetic (e.g. wider, taller, different shadow) is required. Decision #8 (center card layout) → use `.hex-card` extended with `.auth-layout__card { max-width: 360px; padding: 32px; ... }`.

---

## 4. UI Infrastructure Dependencies

### 4.1 Vuex bindings

| Action | Path | Purpose |
|---|---|---|
| Login | `master/login` (`masterState.js:115`) | Dispatches `masterService.login(credentials)`, sets `loginState` on success/error, calls `router.push('/')` (cascades to `/v2` via 1a beforeEnter) |
| Signup | `master/register` (`masterState.js:152`) | Same flow, registers user |
| **Telegram (REMOVE)** | `master/telegram` (`masterState.js:127`) | Will be deleted |
| **`saveTelegramFlag` (REMOVE-AUTH)** | `master/saveTelegramFlag` (`masterState.js:139`) | See Subsection 7 — non-auth Mini App detection. Probably should stay if app supports TG Mini App webview, but flag for design-Claude |
| Reset | `master/resetPassword` (`masterState.js:?`) | Backend returns 501; frontend shows error message |
| Loading state | per-component local `loading` ref | NOT centralized in store. Each form has `const loading = ref(false)` |
| Error state — login | `master/getLoginState.authError` (computed) | Set via `setLoginState({ isAuthenticated, authError })` mutation |
| Error state — signup | local component `errorMessage` ref | NOT in store (Sub-epic 7 AW1 left it local) |
| Error state — reset | `master/getResetState` | `PasswordResetStateModel` — `{ loading, errorMessage, successMessage }` |

### 4.2 Composables / utilities

- `useRouter` from `vue-router` — already used in all 4 auth fragments + Landing
- i18n: inline EN per Sub-epic 1a precedent (decision #9). Auth fragments currently use `t.auth.login.*`, `t.auth.signup.*`, `t.auth.reset.*` keys — **already 11-locale localized**. **Recommendation:** keep using existing i18n keys (NO regression to inline EN) since they're already in all 11 locales and consumed by reactive `t` ref.
- Form validation: custom inline (Subsection 2.6).

### 4.3 Vuetify removal scope

- **Auth-only removal:** ALREADY DONE in Sub-epic 7 AW1. Auth fragments contain ZERO Vuetify tag usage (verified §2.5).
- **Full project removal:** out of 1b scope (40+ consumers across views/HUDs/fragments). Defer to Эпик 7+.
- **Recommendation for 1b:** No Vuetify-related work needed in auth surface. AuthLayoutView itself should NOT use Vuetify (use `<router-view>` raw + scoped CSS).

### 4.4 Image assets

- **Logo:** `src/assets/images/hexlash-logo.jpg` ✅ (added 1a, reuse for AuthLayoutView header)
- **Wallet icon:** No existing icon. `src/assets/images/achievement_wallet.png` exists but is 256x256 achievement art. **Recommendation:** Use a simple SVG inline OR text-only "Connect Wallet" button. Decision deferred to design-Claude — minimal-effort options:
  - (a) Inline SVG glyph (e.g. wallet emoji `👛` text-styled or simple Lucide-style wallet icon)
  - (b) No icon — text only "Connect Wallet" + secondary variant button
- **Telegram icon (KEEP):** `src/assets/images/icon_telega.svg` — used by `LandingView.vue:68` (community footer link) and `socialTaskModel.js:3` (subscribe task). DO NOT delete.

---

## 5. Vocabulary Alignment Audit

### 5.1 AuthLayoutView name

- **Recommendation:** `AuthLayoutView` (matches `*View.vue` convention used everywhere in `src/views/` and `src/views-v2/`).
- Precedent for layout-as-view: `AppV2.vue` (root for `/v2/*` with `<router-view>` for child routes — `src/router/index.js:99`). `AuthLayoutView.vue` for `/auth/*` mirrors this pattern.

### 5.2 Form view names

- **Current:** Forms are NOT views — they're SFCs in `src/components/fragments/auth/` (Login.vue, Signup.vue, Reset.vue, TelegramLogin.vue). RainView dispatches between them based on `route.path`.
- **Recommendation for new structure:** Convert each to a proper child route view. Two options:
  - **Option A (mirror AppV2 nested children):** Define `/auth/*` as parent with `AuthLayoutView` and 3 children (`login`, `signup`, `reset`). Each child is its own component (could be the existing Login.vue / Signup.vue / Reset.vue moved to a `views-auth/` directory or kept in place). `AuthLayoutView` renders chrome + `<router-view>`.
  - **Option B (preserve current dispatch logic):** AuthLayoutView mounts and uses `route.path` to render `<Login />` / `<Signup />` / `<Reset />` from existing fragments directly (no router children, single route per existing setup).
  - **Recommendation: Option A** — cleaner, allows route-based transitions, matches AppV2 pattern. Migrate fragments to `src/views/auth/LoginView.vue` etc. or keep paths but register as child routes.

### 5.3 Route names preserved

| Path | Current `name:` | Action |
|---|---|---|
| `/auth/login` | `'Login'` | KEEP (used by router guard `next({name: 'Login'})` for unauth redirect) |
| `/auth/signup` | `'Signup'` | KEEP (used by `Referral` redirect) |
| `/auth/reset` | `'Reset'` | KEEP |
| **`/auth/telegram`** | `'TelegramLogin'` | **REMOVE** route + name |

**Critical:** `/auth/login` route name `'Login'` is used at `src/router/index.js:250` in router guard:
```js
next({name: 'Login'});
```
when an unauthenticated user hits a protected route. MUST preserve this name.

### 5.4 Telegram remnants — full inventory

**Frontend files (16 hits):**

| File | Line(s) | Purpose | Disposition |
|---|---|---|---|
| `src/components/fragments/auth/TelegramLogin.vue` | 1-137 | Telegram auth form | **DELETE FILE** |
| `src/views/RainView.vue` | 33, 49-51 | imports + dispatches TelegramLogin | RainView **DELETED** entirely in 1b |
| `src/router/index.js` | 3, 13, 43 | Imports RainView, registers `/auth/telegram` route, uses RainView for `/r/:username` redirect | RainView import removed, `/auth/telegram` route removed, `/r/:username` redirect kept (uses any component or none — beforeEnter redirects before render) |
| `src/core/state/modules/masterState.js` | 10, 127-141 | `setTelegram` import; `telegram`, `saveTelegramFlag` actions | REMOVE `telegram` action; `saveTelegramFlag` flag for design-Claude (TG Mini App detection — not auth) |
| `src/core/services/masterService.js` | 119-172, 443-451 | `telegram()` API call; `getTelegram()` / `setTelegram()` localStorage flag | REMOVE `telegram()` (auth); KEEP or REMOVE `getTelegram/setTelegram` (TG Mini App flag — non-auth) |
| `src/core/api/apiClient.js` | 56 | Comment mentions telegram in auth-route exclusion list | Comment update only |
| `src/App.vue` | 199-202 | `window.Telegram.WebApp.expand()` + `disableVerticalSwipes()` | TG Mini App webview integration — **NOT auth.** Flag for design-Claude |
| `src/components/fragments/profile/ProfileButtons.vue` | 3, 74, 85 | `v-if="!isTelegram"` to hide Wallet button | TG Mini App UX gating — NOT auth. Same flag as App.vue |
| `src/views/LandingView.vue` | 27, 68 | Telegram icon + import (community footer link) | **KEEP** (per decision: marketing/community presence) |
| `src/core/models/socialTaskModel.js` | 3, 11 | Telegram icon for `SUBSCRIBE_TELEGRAM` social task | **KEEP** (per decision: marketing) |
| `src/locales/{en,ru,de,es,fr,pt,ar,hi,ja,ko,zh}.js` (11 files) | 43-46 (en) — same in others | `auth.telegram: { lblAuth, retry }` keys | **REMOVE** (orphan after auth flow removal) |
| `src/locales/*.js` (also) | line 162 (en/ru), variable | `confirmInviteFriend` text mentions "via Telegram" | **REVIEW** — clan invite via Telegram-share is a UX feature (Web Share API path), not auth. Likely KEEP message text intact, but if Telegram-share invite is also being deprecated, update string. Defer to design-Claude. |

**Backend files:**

| File | Line(s) | Purpose | Disposition |
|---|---|---|---|
| `backend/src/routes/auth.js` | 6, 29-35, 153-176, 178-230 | Telegram limiter + validation helper + POST /telegram handler | **REMOVE** (~85 lines net) |
| `backend/src/config.js` | 104-106 | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_AUTH_MAX_AGE_SEC` constants | **REMOVE** |
| `backend/prisma/seed.js` | 38, 44 | `SUBSCRIBE_TELEGRAM` social task seed (en + ru) | **KEEP** (marketing per decision) |
| `backend/prisma/schema.prisma` | — | NO `telegramId` / `telegramUsername` field on User | DB schema unchanged — see 7.3 |

- **Vuex actions/getters to remove:** `master/telegram` action (auth). `master/saveTelegramFlag` action (TG Mini App detection — flag for design-Claude).
- **Backend routes to remove:** POST `/v1/auth/telegram` only.
- **Backend helpers to remove:** `validateTelegramPayload` function (inline in auth.js, no separate module).
- **Env vars to remove:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_AUTH_MAX_AGE_SEC` from `config.js`. Not in `.env.example`. Production env (Railway etc) should have value cleared or var removed manually post-deploy.
- **Total LOC affected (rough):**
  - Frontend removed: TelegramLogin.vue (137) + RainView.vue (1212) + masterState `telegram` action (~12 lines) + masterService `telegram` (~55 lines) + locale `auth.telegram:` blocks (~3 lines × 11 locales = 33 lines) + router `/auth/telegram` (1 line) + import (1 line) ≈ **~1450 lines deleted/removed**
  - Backend removed: ~85 lines from auth.js + 3 lines from config.js ≈ **~88 lines**
  - Total: ~1538 lines reduction

---

## 6. Semantic Invariant + Flow Direction Verification

### 6.1 Login success redirect

- **Action:** `master/login` (`masterState.js:115-126`)
- **Success target:** `await router.push('/')` (line 121)
- **1a beforeEnter cascade:** ✅ Verified. `/` route has `beforeEnter` at `index.js:21-30`: if `isAuthenticated` → `next('/v2')`, else `next()` (LandingView). Authenticated user lands on `/v2` hub correctly.
- **Tested in 1a:** Implicitly — Sub-epic 1a's CL flow tested authenticated `/` redirect explicitly.

### 6.2 Signup success redirect

- **Action:** `master/register` (`masterState.js:152-162`)
- **Success target:** Same — `await router.push('/')` → cascade to `/v2`.
- **Email verification step:** Optional, via `/verify-email` route. New users get `User.emailVerified = false` (default in Prisma `User` model, line 15). `VerifyEmailView.vue` handles the verify-email flow but is NOT a hard gate on login (users can use the app pre-verification per `initialVerified` boolean default `true` line 16). **VerifyEmailBanner** (Sub-epic 5F) shows on `/v2/*` if `userData.emailVerified === false`. Out of 1b auth scope. Auth signup flow does NOT trigger email send (no verification email sent; `User.email` defaults to empty string).

### 6.3 Reset password flow

- **Step 1 (request):** `Reset.vue` form submits → `store.dispatch('master/resetPassword', email)` → `masterService.resetPassword` → `apiClient.post('/user/reset', { email })` → backend `backend/src/routes/user.js:84` returns **HTTP 501 "Password reset is not yet implemented"**.
- **Step 2 (confirm via URL token):** Does not exist — no email is sent because backend is 501.
- **Conclusion:** Reset password has **NEVER worked in production.** UI is cosmetic.
- **1b decision needed:** Visual redesign of a non-functional form is fine, but flag for design-Claude:
  - Option (a) Keep Reset.vue + AuthLayoutView routing (cosmetic; backend stays 501; "Send reset link" → 501 response → user sees error message)
  - Option (b) Remove Reset link from Login view + remove Reset route entirely (honest UX)
  - Option (c) Implement backend reset (out of 1b scope — Эпик 7+ feature)
- **Recommendation:** Option (a) — minimal scope, preserves /auth/reset URL for future.

### 6.4 Telegram-only user impact

**Critical finding:** Prisma `User` model has NO dedicated `telegramId` field (verified `backend/prisma/schema.prisma:10-91`). Telegram-bound users are identified by **`login: 'tg_<telegramId>'` prefix convention** (see `backend/src/routes/auth.js:198`).

- **DB schema impact:** **NONE** — no columns to drop. `tg_<telegramId>` users are just regular users with `login` matching that prefix.
- **Email required at signup:** **NO.** `User.email` defaults to empty string (`@default("")` line 14). User can exist without email.
- **TG-only users password situation:** When a TG user is created (auth.js:202-213), backend generates `tempPassword` (12 random bytes base64url) + bcrypt-hashes it. The plaintext `tempPassword` is returned ONCE in the API response (line 220). Frontend captures it via `setSignupState({ generatedPassword: tempPassword })` (`masterService.js:142-145`). User is shown this temp password in the "get started" UI flow. **If user did not save it, they can't log in via password** — they'd need email reset (which is currently 501).
- **Lockout risk:** **YES, REAL.** Existing TG-only users who never saved their tempPassword AND have no email set → cannot log in after `/auth/telegram` is removed.
- **Mitigation options for design-Claude:**
  - (a) **Accept the risk** — "Telegram users must reset password" → but reset is broken (501) → effectively locked out
  - (b) **One-time data-recovery script** — backend: find all `User.login LIKE 'tg_%'`, set them a known temp password, email them (impossible — no email), or display in admin tool. Out of 1b scope.
  - (c) **Defer Telegram excision to a coordinated milestone** with email reset implementation first. Significantly expands scope.
  - (d) **Audit** — query prod DB for `SELECT COUNT(*) FROM "User" WHERE login LIKE 'tg_%'` to scope the impact. If count is very small / zero, risk is moot.
- **Recommendation:** **Surface to user (you) for explicit decision before Phase 1.** Add to "Open questions" in the Summary.

### 6.5 Toast message for Connect Wallet "Coming soon"

- **Existing toast patterns (verified):**
  ```js
  store.commit('master/setInfoMessage', InfoMessageModel.withTimeout('Wallet login coming soon', 3000));
  ```
- **Recommended text:** `"Wallet sign-in coming soon"` or `"Connect Wallet — coming soon"`. Inline EN per 1a precedent (no i18n key needed for ephemeral microcopy).
- **Toast duration:** 3000ms (mirror existing 5B / 5K pattern — `withdrawAfterListing`, `'No Captain set...'`).

### 6.6 Login↔Signup links

- **Implementation pattern:** `<router-link>` or `useRouter().push('/auth/...')`. Both work; existing fragments use `useRouter` programmatic navigation.
- **Existing i18n keys:**
  - From login → signup: `t.auth.login.questionSignup` ("No account?") + `t.auth.login.btnSignup` ("Sign up") (Login.vue:68-71)
  - From login → reset: `t.auth.login.lblOrPass` (" or password") + `t.auth.login.btnReset` ("reset") (Login.vue:74-79)
  - From signup → login: `t.auth.signup.question` ("Already have an account?") + `t.auth.signup.btnLogin` ("Login") (Signup.vue:95-99)
  - From reset → login: same `t.auth.signup.question` + `t.auth.signup.btnLogin` (Reset.vue:36-40)
- **Router guards on `/auth/*`:** None blocking. Routes are in `authRoutes` array (separate from `protectedRoutes`), so `beforeEach` guard skips. Direct transitions work.
- **Recommendation:** preserve existing keys + navigation handlers verbatim in 1b. Visual restyle only (placement in card footer, link styling).

---

## 7. Telegram Excision Completeness Audit

### 7.1 Frontend Telegram files (classified)

**AUTH-related (REMOVE):**
- `src/components/fragments/auth/TelegramLogin.vue` (137 lines) — DELETE FILE
- `src/views/RainView.vue:33` `import TelegramLogin` — file deleted
- `src/views/RainView.vue:49-51` route-to-component branch — file deleted
- `src/router/index.js:13` `/auth/telegram` route — REMOVE
- `src/core/state/modules/masterState.js:10` `setTelegram` import — REMOVE if `setTelegram` itself removed (see #flag)
- `src/core/state/modules/masterState.js:127-138` `telegram` action — REMOVE
- `src/core/services/masterService.js:119-172` `telegram()` function — REMOVE
- `src/locales/*.js` (×11) `auth.telegram: { lblAuth, retry }` — REMOVE
- `src/core/api/apiClient.js:56` comment update — minor

**SOCIAL-related (KEEP):**
- `src/views/LandingView.vue:27, 68` Telegram social link icon (community footer)
- `src/core/models/socialTaskModel.js:3, 11` SUBSCRIBE_TELEGRAM social task icon
- `src/assets/images/icon_telega.svg` — keep file
- `backend/prisma/seed.js:38, 44` SUBSCRIBE_TELEGRAM seed entries
- `src/locales/*.js` clan-invite-via-Telegram message text (line 162 area) — review but likely keep

**OTHER (FLAG for design-Claude):**
- `src/App.vue:199-202` `window.Telegram.WebApp.expand()` + `disableVerticalSwipes()` — TG Mini App webview integration. NOT auth. Defensive code (no-ops if not in TG webview). **Decision:** keep unless dropping TG Mini App support entirely.
- `src/components/fragments/profile/ProfileButtons.vue:3, 74, 85` `v-if="!isTelegram"` — hides Wallet button in TG webview. Probably tied to TG Mini App rules (no external wallet links allowed). **Decision:** keep if App.vue line 199-202 stays.
- `src/core/services/masterService.js:443-451` `getTelegram()` / `setTelegram()` localStorage flag — non-auth (Mini App detection). **Decision:** keep if App.vue / ProfileButtons stay.
- `src/core/state/modules/masterState.js:139-141` `saveTelegramFlag` action — **calls `store.commit('master/setIsTelegram', true)` but `setIsTelegram` mutation does NOT exist in masterState.js.** This is a phantom mutation (silent no-op + Vuex warning). Same Lesson #11 / #35 pattern as 5O setError × 9 / 5P setInfo × 7. **Surface as bonus carry-over** — fix-bundle candidate or independent polish, not 1b scope unless removing.
- `src/core/api/apiClient.js:56` comment — cosmetic; update only if removing Telegram references throughout.

### 7.2 Backend Telegram files (classified)

**AUTH-related (REMOVE):**
- `backend/src/routes/auth.js:6` `TELEGRAM_BOT_TOKEN, TELEGRAM_AUTH_MAX_AGE_SEC` import
- `backend/src/routes/auth.js:29-35` `telegramLimiter`
- `backend/src/routes/auth.js:153-176` `validateTelegramPayload` helper function
- `backend/src/routes/auth.js:178-230` POST `/telegram` route handler
- `backend/src/config.js:104-106` `TELEGRAM_BOT_TOKEN` + `TELEGRAM_AUTH_MAX_AGE_SEC` exports

**Non-auth (KEEP):**
- `backend/prisma/seed.js:38, 44` SUBSCRIBE_TELEGRAM social tasks (en + ru)

**OTHER (no flags):**
- None. Backend Telegram footprint is exclusively in `auth.js` + `config.js`.

### 7.3 DB schema (User model)

- **Telegram fields found on User:** **NONE.** `backend/prisma/schema.prisma:10-91` audit:
  - No `telegramId`, `telegramUsername`, `telegramPhoto` columns
  - Telegram-linked users identified by `login: 'tg_<id>'` convention (auth.js:198)
- **Recommendation:** **No DB migration needed.** Schema is clean.
- **Caveat:** Existing prod users with `login LIKE 'tg_%'` remain valid User records. They're just rebranded as "regular login + password" users post-excision. Login still works **IF** they know their tempPassword (see §6.4 lockout risk).

### 7.4 Locale Telegram keys

**Files affected (11):** `src/locales/en.js`, `ru.js`, `de.js`, `es.js`, `fr.js`, `pt.js`, `ar.js`, `hi.js`, `ja.js`, `ko.js`, `zh.js`

**Keys to remove (verified all 11 locales):**
- `auth.telegram.lblAuth`
- `auth.telegram.retry`

The entire `auth.telegram: { ... }` block (lines 43-46 in en.js, mirror in others — 4 lines per locale). Total removal: ~44 lines across 11 files.

**Other Telegram references in locales (KEEP):**
- `clan.confirmInviteFriend` (en line 162, ru line 162) — clan invite via Telegram-share text. Defer review to design-Claude.

### 7.5 Env vars

- **Found:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_AUTH_MAX_AGE_SEC` (in `config.js` only, NOT in `.env.example`)
- **Recommendation:** REMOVE from `config.js`. Document in 1b commit message that production deploy needs to remove the env var from Railway/Vercel env config (post-deploy manual cleanup).

### 7.6 Package.json

- **Telegram deps:** **NONE.** Verified — no `node-telegram-bot-api`, no `@telegram-bot/*`, no `telegraf`, no `grammy`. Pure HMAC-SHA256 verification using built-in `crypto` module.
- **Action:** No package removal needed.

### 7.7 Tests

- **Test files affected:** **NONE.** `grep -i "telegram" backend/tests/` → 0 hits. No telegram test files.
- **Action:** No test removal needed.

### 7.8 Total scope estimate

| Category | Files modify | Files delete | LOC removed |
|---|---|---|---|
| Frontend auth flow | 7 | 1 (TelegramLogin.vue) + 1 (RainView.vue) | ~1450 |
| Frontend i18n | 11 | 0 | ~44 |
| Backend | 2 (auth.js, config.js) | 0 | ~88 |
| Routing | 1 (router/index.js) | 0 | ~3 |
| **Total** | **~21 modified** | **2 deleted** | **~1585 LOC** |

---

## SUMMARY — Readiness Assessment

### Сложность ТЗ
**M-L** — combined frontend redesign + RainView removal + Telegram excision (FE + BE). Multi-cluster with explicit milestones. Larger than 1a (S-M, single Landing view), smaller than 5T (i18n consolidation methodology-heavy) due to clean scope (no Vuetify removal needed in auth — already done in Sub-epic 7 AW1).

### Estimated functional commits
**8-12 functional + 3 closure** (CL1 CLAUDE.md, CL2 final report, CL3 handoff). Suggested cluster ordering for Mode A discipline:

| Cluster | Commits | Purpose |
|---|---|---|
| **A — RainView removal prep** | 1-2 | Create AuthLayoutView scaffold + new route registration + redirect prep |
| **B — Form view migration** | 3-5 | Move Login/Signup/Reset to child routes (or AuthLayoutView dispatch) + visual restyle (centered card + logo + Connect Wallet button + login↔signup link) + Connect Wallet "Coming soon" toast |
| **C — Telegram excision FE** | 1-2 | Remove TelegramLogin.vue + masterService.telegram + masterState.telegram action + locale auth.telegram blocks (11 locales) + router /auth/telegram entry + RainView import everywhere |
| **D — Telegram excision BE** | 1 | Remove auth.js telegram handler + validateTelegramPayload + telegramLimiter + config.js TG constants. Cherry-pick PR to main per Lesson #33 |
| **E — RainView delete + cleanup** | 1 | Delete RainView.vue + remove kokomi.js usage references + dead asset cleanup if any (check rain texture files) |

### Open questions for design-Claude

1. **TG-only user lockout (§6.4):** Critical. Need user input before 1b Phase 1.
   - Audit prod DB count of `User.login LIKE 'tg_%'` users to scope impact?
   - Acceptable risk vs. blocker?
   - If blocker → defer 1b until email reset is implemented.

2. **App.vue:199-202 `window.Telegram.WebApp.expand()` + `ProfileButtons.vue:3 v-if="!isTelegram"` (§7.1 OTHER):** Keep TG Mini App webview integration, OR remove entirely?
   - Per ТЗ decision #2: "Telegram fully excised."
   - But these calls are NOT auth — they're webview UX (expand to full screen, hide wallet button per TG store rules).
   - **Recommendation:** keep (defensive no-ops if not in TG webview). Surface for explicit user decision.

3. **`master/saveTelegramFlag` action + `getTelegram/setTelegram` localStorage flag (§7.1 OTHER):** Same flag as above.

4. **`master/saveTelegramFlag` phantom mutation `setIsTelegram` (§7.1 OTHER):** Bonus carry-over discovery — `store.commit('master/setIsTelegram', true)` but mutation doesn't exist (silent no-op). Lesson #11 / #35 phantom-mutation pattern (parallel to 5O / 5P precedent). Bundle into 1b OR carry-over for separate cleanup.

5. **Reset password 501 (§6.3):** Backend has never implemented password reset. Cosmetic Reset view in 1b OR remove `/auth/reset` route entirely?

6. **Form view migration approach (§5.2 Option A vs B):** Nested router children (cleaner) vs. RainView-style dispatch (simpler 1-step migration)?

7. **i18n strategy:** Keep existing `t.auth.login.*` / `t.auth.signup.*` / `t.auth.reset.*` keys (already 11 locales) OR inline EN per 1a precedent? **Recommendation:** keep i18n keys (regression to inline EN would lose Russian etc translations).

8. **Connect Wallet button glyph:** Inline SVG, emoji, or text-only?

### Risks identified

| Risk | Severity | Mitigation |
|---|---|---|
| TG-only user lockout (§6.4) | **HIGH** | Audit prod DB; defer if count > 0 OR accept risk |
| Backend cherry-pick deploy chain (§7.2) | MEDIUM | Lesson #33 — PR `fix/telegram-removal` → main → Railway. Coordinate with FE merge |
| RainView delete cascade — third-party libs (kokomi.js, postprocessing, gsap, three.js) used elsewhere? | LOW | Verify via grep before deletion. If only used by RainView → libs can stay in `package.json` (no functional impact, just unused) |
| /r/:username referral redirect uses RainView component reference (router/index.js:43) | LOW | beforeEnter redirects before render — RainView never mounts. Replace with placeholder component (or remove `component:` field if Vue Router 4 allows redirect-only route) |
| Reset password is 501 (§6.3) | LOW | Cosmetic — UX shows error after submit. Already broken pre-1b |
| `setIsTelegram` phantom mutation (§7.1) | LOW | Pre-existing silent bug; bundle into 1b cleanup or polish |
| Lesson #45 Phase 0 metadata error pattern | LOW | All Phase 0 file paths + line numbers verified twice via grep + cat |

### Pre-edit blockers

- **NONE.** All structural baselines verified, all paths confirmed exist.
- **Soft blocker:** Q1 (TG-only user lockout) needs user authorization before Phase 1 commits begin (touches user auth flow with possible production lockout).

### Telegram-only user data risk (Subsection 6.4)
**🔴 FLAGGED.** Production DB count of `User.login LIKE 'tg_%'` unknown. If count > 0, removing Telegram-as-login locks them out (no working password reset). Recommend audit or decision before Phase 1.

---

## Bonus findings (not in 7-subsection scope)

1. **`auth.telegram.lblAuth` localizations are DIFFERENT per locale** (verified all 11) — proper translations exist (Russian "Авторизация через телеграмм...", Arabic "التفويض عبر تيليجرام...", etc). Removing these orphan keys is safe but loses ~33 lines of localized strings.

2. **`/r/:username` Referral redirect** uses `component: RainView` even though `beforeEnter` redirects before render. Post-1b, after RainView is deleted, `component:` field needs replacing OR removal (Vue Router 4 supports redirect-only routes via `redirect: '/auth/signup'` instead of `beforeEnter`+`component:`).

3. **kokomi.js + postprocessing + gsap + three.js + Howl (rain audio) deps** — used exclusively by RainView. After RainView deletion, these can be removed from package.json for bundle savings (post-1b polish — confirm usage via grep first).

4. **`src/assets/textures/brick-normal2.jpg`, `floor-normal.webp`, `rain-normal.png`, `door/*`, models/scene.glb, sound/rain.mp3** — RainView-only assets. Post-1b cleanup candidate for bundle reduction (~MB-scale savings).

5. **Stale `<style>` block in `RainView.vue:1124-1212`** — `.beta-text`, `.timer-listing-container`, `.timer-overlay`, `.text-pages-link`, `.btn-text-page` all dead after RainView delete.

6. **HexButton primary CTA glow (`box-shadow: 0 0 8px var(--hex-primary-glow)`)** — currently applied via local `.auth-btn` class. Could be promoted to a `HexButton` variant prop in a polish pass, but not in 1b scope.
