# Sub-epic 1a Phase 0 Report — Landing /

**Date:** 2026-05-06
**Sub-epic:** Эпик 7 Sub-epic 1a — Landing `/` Redesign (anonymous marketing page + authed redirect)
**Investigation type:** READ-ONLY Phase 0
**Investigator:** Claude Code (Phase 0 agent)

---

## 1. API Contract Verification

### 1.1 Auth state detection

**Canonical getter:** `store.getters['master/getLoginState'].isAuthenticated`

Source: `src/core/state/modules/masterState.js:27` — `getLoginState: (state) => state.loginState`. State shape: `loginState = new LoginStateModel()` (ln 17), with `isAuthenticated` boolean field set in mutations `setLoginState` (ln 76) and `clearAuthData` (ln 84).

Used in:
- `src/router/index.js:222` — `const isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false`
- `src/App.vue:91-93` — `const isAuth = computed(() => store.getters['master/getLoginState'].isAuthenticated)`

**Alternate getter (NOT for auth check):** `master/getMaster` (`masterState.js:25`) returns user data object — `null` when unauthed but truthy state ≠ authenticated state (race during init). DO NOT use for landing redirect logic. Use `getLoginState.isAuthenticated`.

### 1.2 Router guard

`src/router/index.js:214-252` — `router.beforeEach(async (to, from, next) => {...})`.

Logic:
- Computes `isAuthenticated` (line 222) from canonical getter (Subsection 1.1).
- Computes `isProtectedRoute` (line 223-225) by membership check in `protectedRoutes[]` array OR `v2ProtectedNames[]` (Sub-epic 4a marker pattern).
- If protected AND not authenticated:
  - Special exemption (line 231): if `to.name !== 'Home'`, fires "Access denied" info toast (2s timeout). The `Home` exemption exists because RainView at `/` IS the auth gateway — no toast needed.
  - `next({name: 'Login'})` (line 236) — redirects to `/auth/login`.
- If authenticated AND protected: passes through, with one nested check (line 239-244): if navigating to `/arena/fight` or `/arena` with a saved fight in localStorage, redirects to `/fight`.
- Otherwise: `next()` (line 250).

**Implication for landing:** Currently `/` is in `protectedRoutes` (line 33). For landing, `/` should be PUBLIC (anonymous accessible). Need to:
- Remove `{path: '/', name: 'Home', component: RainView}` from `protectedRoutes`
- Add to `publicRoutes` OR create new top-level entry, with `beforeEnter` for authed-redirect

### 1.3 Existing redirect mechanisms

Sub-epic 8 redirects (verified via Read of `src/router/index.js`):
- **String form:** `{path: '/training', redirect: '/v2/training'}` (line 65), `/fight` → `/v2/fight` (66), `/friends` → `/v2/profile` (67), `/matchmaking` → `/v2/matchmaking` (68), `/ratings` → `/v2/ratings` (63)
- **Function form (param transform):** `{path: '/ratings/:type', redirect: to => '/v2/ratings'}` (62), `/spectate/:odId` → backtick template (69), `/clan/:id` → object form `{name: 'V2GuestClan', params: {id: to.params.id}}` (54-56), `/user/:userLogin` → object form (44-46), `/club/:id` → string concat (57)

**Conditional redirect (component vs redirect)?**
Vue Router 4 supports redirect as function — can return `null`/`undefined` to fall through to component, OR a path/object to redirect. NOT direct precedent in codebase, but the `beforeEnter` referral pattern (line 24-27) demonstrates conditional `next()` calls. **Recommended landing pattern:** route entry `{path: '/', name: 'Home', component: LandingView, beforeEnter: (to, from, next) => { isAuth ? next('/v2') : next() }}` — clean, before-mount (no flash).

---

## 2. Negative-Space Verification

### 2.1 Conditional component rendering at route level

**Vue Router 4:** route `redirect` accepts function `to => string | RouteLocation | undefined`. If function returns `undefined`/`null`, Vue Router treats as no-redirect and falls through to the component. **NOT used in current codebase** — all existing redirects unconditionally return target. **`beforeEnter` is the cleaner precedent** (line 24-27 — referral redirect chain).

**Recommendation:** Use `beforeEnter` over `redirect` function for landing, because:
1. Existing precedent (referral pattern).
2. Reads naturally as auth-gate logic.
3. Vue Router 4 `redirect` function signature is less ergonomic for boolean conditions.

### 2.2 Landing-style components precedent

**None found.** Searched `src/views/` (RainView is auth gateway with 3D rain — NOT marketing landing) and `src/views-v2/` (16 v2 views, all logged-in flows). No `LandingView.vue`, `HomeView.vue`, `SplashView.vue`, `MarketingView.vue` exist anywhere.

### 2.3 Footer component precedent

**No reusable footer component exists.** Searched `src/components/` and `src/components/hud/common/`:
- `src/App.vue:38-42` has `<footer class="footer">` wrapping `BottomMenu` for legacy nav — NOT a content footer.
- PrivacyView, PageView, HelpView checked — no shared footer chrome.

**Implication:** Landing footer (Privacy/Rules/Help links) needs to be inline inside `LandingView.vue`. Future extraction to `<LandingFooter>` component possible but out of scope for 1a (single-consumer).

### 2.4 Social icons precedent

**5/5 social icon assets EXIST in `src/assets/images/`:**
- `icon_telega.svg` (Telegram) — verified ls
- `icon_x.svg` (X/Twitter)
- `icon_yout.svg` (YouTube) — note short name, not `icon_youtube`
- `icon_disc.svg` (Discord)
- `icon_insta.svg` (Instagram)

**Existing consumer:** `src/core/models/socialTaskModel.js:3-7` — imports all 5 with aliases `iTelegram`, `iX`, `iYoutube`, `iDiscord`, `iInsta`. `HudSocialTasks.vue:43` consumes via `task.getIcon()`.

**Implication:** Landing can import same icon assets directly. No new asset creation needed. Recommended import aliases: match `socialTaskModel.js` convention (`iTelegram`/`iX`/`iYoutube`/`iDiscord`/`iInsta`) for codebase consistency.

### 2.5 Logo.vue render

**`src/components/Logo.vue` (1-35):** renders `<span class="logo-text" @click="goToHome">HEXLASH</span>` — **CSS text only**, no img/SVG. Uses `Anonymous` font (pixel-style), `var(--hex-primary)` color, glow shadow. Click → `router.push('/')`.

**Props accepted:** NONE (no `defineProps`). Single-shape component.

**Implication for landing:**
- Can reuse `<Logo />` AS-IS for landing brand.
- Logo's click `router.push('/')` is fine (already on `/`, no navigation).
- HOWEVER: `App.vue:3` already mounts `<Logo />` in `<header v-if="!isV2Route">`. Landing at `/` is NOT a v2 route → header shows by default → **logo would double-render** unless landing extends `isV2Route` exclusion OR landing intentionally hides App.vue header.

**ACTION REQUIRED for design-Claude:** decide landing chrome strategy:
- (A) Extend App.vue `v-if="!isV2Route && !isLandingRoute"` → landing renders own logo bigger, with tagline
- (B) Keep App.vue header (small Logo top-left), landing-specific hero is below
- (C) Conditional via `route.name === 'Home'` shortcut

Recommendation: **Option A** — landing should be a full-bleed marketing page with controlled chrome, not a normal app page. Aligns with v2 pattern.

---

## 3. CSS Class Taxonomy

### 3.1 Available `--hex-*` tokens (global at `:root`)

Verified `src/styles/hexlash-ui.css:9-223`. Defined under `:root` selector — **GLOBALLY AVAILABLE** (not scoped to `.app-v2`):

- **Primary brand:** `--hex-primary` (`#FF066F` neon pink), `--hex-primary-light`, `--hex-primary-dark`, `--hex-primary-glow`
- **Backgrounds:** `--hex-bg-deep` (`#050507`), `--hex-bg-dark`, `--hex-bg-medium`, `--hex-bg-light`, `--hex-bg-card`
- **Text:** `--hex-text-primary` (`#FFFFFF`), `--hex-text-secondary` (60% opacity), `--hex-text-muted` (35% opacity)
- **Status:** `--hex-success`, `--hex-danger`, `--hex-warning`
- **Borders:** `--hex-border-default`, `--hex-border-active`, `--hex-border-strong`, `--hex-border-hi`
- **Fonts (line 166-168):** `--hex-font-display: 'Impact', 'Anton', 'Bebas Neue'`, `--hex-font-body: 'Inter', 'Roboto', 'SF Pro'`, `--hex-font-mono: 'JetBrains Mono'`
- **Sizes (line 171-178):** `--hex-font-size-xs/sm/md/lg/xl/xxl/giant/huge` (10/12/14/16/20/24/32/48px)

### 3.2 Existing `.hex-*` component classes (global)

Verified via grep on `src/styles/hexlash-ui.css`. **Globally usable** (not `.app-v2`-scoped):

- **Typography:** `.hex-title-giant` (line 230), `.hex-title-large` (244), `.hex-title-medium`, `.hex-title-small`, `.hex-text`, `.hex-text-small`, `.hex-number`, `.hex-text-accent/success/danger/warning`
- **Buttons:** `.hex-btn` (318), `.hex-btn-primary` (341), `.hex-btn-secondary`, `.hex-btn-ghost`, `.hex-btn-sm/lg/full`
- **Cards:** `.hex-card`, `.hex-card-interactive`, `.hex-card-selected`, `.hex-card-locked`
- **Modal:** `.hex-modal-overlay/modal/title/body/actions/close` (canonical taxonomy from Эпик 6 Sub-epic 7 C9 expansion)
- **Other:** `.hex-spinner`, `.hex-input`, `.hex-progress`, `.hex-hp-bar`, `.hex-badge*`, `.hex-pill`, `.hex-animate-*`, `.hex-fade-enter-*`, `.hex-slide-up-enter-*`

**Implication for landing:** can use `.hex-btn-primary` for "Start Fighting" CTA verbatim (no need for new class). `.hex-title-giant` for HEXLASH title. `.hex-text-accent` for tagline accent.

### 3.3 v24 design tokens

**Files in `src/styles/v24/`:**
clan.css, create.css, effects.css, fight-overlays.css, help.css, matchmaking.css, profile.css, ratings.css, shop.css, tokens.css, training.css, verify.css

**`src/styles/v24/tokens.css:5-22`:**
```css
.app-v2 {
  --hex-primary: #FF066F;
  --bg-deep: #070811;
  --bg-panel: rgba(14, 16, 28, 0.85);
  --text-dim: rgba(255, 255, 255, 0.5);
  --text-mid: rgba(255, 255, 255, 0.75);
  --font-display: 'Archivo Black', system-ui, sans-serif;
  --font-body: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  background: var(--bg-deep);
  color: #fff;
  font-family: var(--font-body);
}
```

**Google Fonts imported (line 5):** `Archivo+Black`, `Space+Grotesk:wght@400;500;600;700`, `JetBrains+Mono:wght@400;500`.

**`src/styles/v24/effects.css`:** all 3 overlay effects (`.grain`, `.scanlines`, `.vignette`) scoped to `.app-v2 .grain` etc. NOT available outside v2 namespace.

**`src/styles/hexlash-v24.css:1-17`:** entry point that imports all v24/* files. Comment line 2-3: "Импортируется ТОЛЬКО в src/AppV2.vue, не в main.js. Стили scoped под .app-v2".

**CRITICAL FINDING:** v24 tokens (Archivo Black, Space Grotesk, --bg-deep, --bg-panel) are SCOPED to `.app-v2` and the entire v24 stylesheet is loaded ONLY by `src/AppV2.vue:18` (`import '@/styles/hexlash-v24.css'`).

**Implication for landing at `/` (NOT under .app-v2):**
- Landing is OUTSIDE `.app-v2` — cannot use v24 vars (`--bg-deep`, `--font-display`, `.grain`, `.scanlines`, `.vignette`) directly.
- Two paths:
  - **(A) Use legacy `--hex-*` tokens** (global at `:root`, `Impact`/`Inter` fonts). Visually MATCHES App.vue header + RainView legacy aesthetic.
  - **(B) Mimic v24 by adding new tokens** OR loading hexlash-v24.css in landing scope by wrapping landing in `<div class="app-v2">` (semantic abuse — `.app-v2` implies v2 routes).
  - **(C) Refactor v24 tokens to global** OR add explicit `.landing` scoped duplicate — adds new design system for one view.

**Recommendation:** **Option A** for 1a (use existing `:root` `--hex-*` + `Anonymous` font for HEXLASH brand match with Logo.vue + system sans for body). Defer v24-aesthetic alignment to Sub-epic 1b (Auth views redesign) where the entire auth flow gets visual treatment together.

### 3.4 Typography precedents

**Marketing-tier titles in v2:**
- `src/components/Logo.vue:26` — `font-family: 'Anonymous', 'Courier New', Consolas, monospace` (pixel font, used for HEXLASH brand mark — App.vue header).
- `src/views-v2/HelpView.vue` (per CLAUDE.md 6B-1) — uses v24 stack via `.app-v2` namespace. Not directly comparable.
- `src/components/hud/common/TopBar.vue` (per CLAUDE.md Эпик 2) — pixel-font for "THE PIT" title impact.

**Body text in v2 HUD components:** v24 stack uses `Space Grotesk` (`tokens.css:15`), legacy uses `Inter` (`hexlash-ui.css:167`).

**Recommendation for landing:**
- HEXLASH brand title: `Anonymous` font (matches Logo.vue + brand identity)
- "The underground Web3 arena" tagline: `system-ui, sans-serif` OR `Inter` (--hex-font-body)
- "Start Fighting" CTA: use `.hex-btn-primary` (Inter via --hex-font-body)
- Footer links: `--hex-font-body` (Inter)

---

## 4. UI Infrastructure Dependencies

### 4.1 Vuex bindings landing needs

Minimal:
- `store.getters['master/getLoginState'].isAuthenticated` for `beforeEnter` redirect (Subsection 1) — read at router level, not component
- `t` reactive ref from `@/locales/index.js` IF i18n keys used (see Subsection 5.3 for inline-vs-key decision)

**No actions/mutations** for landing — pure presentation + 2 nav clicks (CTA + footer).

### 4.2 Composables

- `useRouter()` from `vue-router` for CTA click (`router.push('/auth/signup')`) and footer link clicks
- That's it. No `useRoute` needed (no params/query). No store dispatches.

### 4.3 Image asset convention

**Convention:** import statement → bind via `:src`. Verified examples:
- `src/components/hud/HudFight.vue:148` — `import iconDice from '@/assets/images/icons/dice.svg';` then `<img :src="iconDice" />`
- `src/core/models/socialTaskModel.js:3-7` — `import iTelegram from "@/assets/images/icon_telega.svg";` etc.

**For landing social icons, recommended pattern (mirror socialTaskModel):**
```js
import iTelegram from '@/assets/images/icon_telega.svg';
import iX from '@/assets/images/icon_x.svg';
import iYoutube from '@/assets/images/icon_yout.svg';
import iDiscord from '@/assets/images/icon_disc.svg';
import iInsta from '@/assets/images/icon_insta.svg';
```

Or define inline in `<script setup>` array:
```js
const socials = [
  { name: 'Telegram', icon: iTelegram, url: '#' },
  ...
];
```

### 4.4 External CSS strategy

**Two CSS chains:**
- **Legacy / global:** `src/styles/hexlash-ui.css` — globally available (per `src/main.js` import — confirmed via 1.1 since `--hex-*` and `.hex-*` work outside `.app-v2`).
- **v2 scoped:** `src/styles/hexlash-v24.css` → loaded only by `src/AppV2.vue:18`, scoped to `.app-v2` namespace.

**Recommendation for landing:** **scoped Vue style block in `LandingView.vue`**. Rationale:
- Landing has unique single-consumer styles (hero layout, social row, footer).
- Adding `src/styles/v24/landing.css` would imply v24 namespace usage (it doesn't — Subsection 3.3 critical finding).
- Scoped block keeps styles co-located with template, no cross-route leak.
- Use `.hex-btn-primary` from global hexlash-ui.css for CTA (no duplication).
- Custom prefix `.landing-*` for layout/hero/social/footer (collision-free per Subsection 5.4).

If landing-specific styles grow beyond ~150 lines, extract to `src/styles/landing.css` and import in `src/main.js` (NOT `hexlash-v24.css` chain).

---

## 5. Vocabulary Alignment Audit

### 5.1 View name collision

Searched: `LandingView.vue`, `HomeView.vue`, `SplashView.vue`, `MarketingView.vue` in `src/views/` and `src/views-v2/`. **None exist.**

**Recommendation:** `src/views/LandingView.vue` (legacy `/src/views/` dir, since landing lives at root `/` — NOT under `/v2/*` so NOT in views-v2/).

### 5.2 Route name collision

Current `/` route name: `'Home'` (`src/router/index.js:33`).

Searched for routes named `Home`, `Landing`, `Index`, `Root`. **`'Home'` is the only existing one** (RainView). Will be reused/replaced when landing replaces RainView at `/`.

**Two options:**
- **(A) Reuse `'Home'`** — minimal diff, naming history continuity
- **(B) Rename to `'Landing'`** — semantic clarity, signals scope change

**Recommendation: keep `'Home'`** — `getPreviousRoute()` (line 184-191) defaults to `'Home'` as fallback. Renaming triggers wider grep + carry-over risk. Lesson #11 reflex.

**ACTION:** Confirm with design-Claude — if rename desired, also grep `'Home'` callsites (router.beforeEach line 231 special exemption + getPreviousRoute fallback).

### 5.3 i18n key strategy

**Per CLAUDE.md Sub-epic 5T English-only fallback decision + v2 HUD inline EN convention** (HudCreate/HudMatchmaking/HudTraining/HudFighterDetail/HudFight/HudClan/HudShop/HudGuestClan/HudUserProfile all inline EN per Эпик 5 carry-over #7):

**Recommendation: HARDCODE INLINE EN** for 1a, mirror v2 HUD precedent.

Rationale:
- Marketing copy ("The underground Web3 arena", "Start Fighting") needs translation polish before locale rollout — premature i18n key creation forces lock-in.
- Landing is anonymous flow — unauthed user's browser language detection less reliable.
- Locale cleanup (10 → English-only) is carry-over #7 forward к Эпик 7+ — landing copy can ship under that initiative.
- `t` import + reactive ref overhead disproportionate for ~5-7 short strings.

**ACTION:** Document in commit message that strings are inline-EN per 5T English-only convention. Carry-over: `landing.*` i18n keys creation deferred to comprehensive locale audit sub-epic (Эпик 7+ candidate).

### 5.4 CSS class prefix

Searched `grep -rn "\.landing-\|\.lp-" /home/user/testhexlash/src/`. **NO collisions.**

**Recommendation:** `.landing-*` prefix (e.g., `.landing-root`, `.landing-hero`, `.landing-cta`, `.landing-socials`, `.landing-footer`). Reads naturally, matches existing convention pattern (`.fc-*` for FriendCard, `.tsp-*` for TrainingSocialPanel, `.mm-*` for matchmaking, `.fd-*` for FighterDetail, etc.).

---

## 6. Semantic Invariant + Flow Direction

### 6.1 Post-signup redirect target

**Current:** `src/core/state/modules/masterState.js:158` — after successful `register` action: `await router.push('/')`. Same pattern for `login` (line 121), `telegram` (line 133), `setTelegram` callback (line 150), `confirmEmail` end (line 298).

**Implication:**
- All auth flows currently land back on `/` (RainView).
- For landing flow: post-signup user IS authed → `beforeEach` (or new `beforeEnter` on `/` — Subsection 6.3) sees authed → redirects to `/v2`.
- **No change required** in `masterState.js` — `router.push('/')` cascades through landing's authed-redirect to `/v2` automatically.

**ALTERNATIVE (cleaner UX, no extra hop):** change `masterState.js` post-auth `push('/')` → `push('/v2')` directly. But this expands 1a scope to touch auth state module. Recommendation: keep `push('/')` and let landing redirect handle it (zero-touch on auth module — preserves Lesson #34 scope discipline).

### 6.2 Authed user → / redirect mechanism

**`router.replace('/v2')` not `push`.** Verified convention via grep:
- `src/views-v2/GuestClanView.vue:63` — `router.replace('/v2/clan')` (own-clan self-redirect)
- `src/views-v2/UserProfileView.vue:63` — `router.replace('/v2/profile')` (own-profile self-redirect)
- `src/views-v2/MatchmakingView.vue:146,210` — `router.replace('/v2')` (cancel/back)
- `src/views-v2/MatchmakingView.vue:283` — `router.replace('/v2/fight')` (match-found)

`router.replace` does NOT add to history — back button skips landing. Critical UX (don't trap authed user in landing → /v2 → back → landing loop).

For `beforeEnter` style: use `next('/v2')` or equivalently `next({path: '/v2', replace: true})`. In Vue Router 4 inside `beforeEnter`, `next('/v2')` already replaces the current pending nav (no history pollution).

### 6.3 Redirect placement

**Two options:**

**(A) `beforeEnter` in route definition** — runs before component mount, no flash:
```js
{
  path: '/',
  name: 'Home',
  component: () => import('@/views/LandingView.vue'),
  beforeEnter: (to, from, next) => {
    const isAuth = store.getters['master/getLoginState']?.isAuthenticated || false;
    if (isAuth) next('/v2');
    else next();
  }
}
```

**(B) `onMounted` in `LandingView.vue`** — landing renders briefly, then `router.replace('/v2')`. Visible flash.

**Recommendation: Option A (`beforeEnter`).** Rationale:
- No flash → cleaner UX
- Existing precedent (referral pattern, line 24-27)
- Auth state available at router level (synchronous getter, no async wait needed)
- Composes cleanly with existing `beforeEach` guard — `beforeEach` runs first (does nothing for `Home` since landing should NOT be in `protectedRoutes`), then `beforeEnter` runs the auth-redirect

**Note on `/` removal from `protectedRoutes`:** must remove `{path: '/', name: 'Home', component: RainView}` from protectedRoutes array (currently line 33). Otherwise unauthed visit to `/` triggers Login redirect via guard line 236, defeating landing purpose. New entry should be in `publicRoutes` OR placed at top of `routes` array as standalone.

**Tiny risk to verify:** `beforeEach` line 231 has special exemption `if (to.name !== 'Home')` — this controls whether "Access denied" toast fires. With `Home` removed from `protectedRoutes`, the entire `if (isProtectedRoute)` branch (line 228) skips for `/` → no toast risk. Safe.

### 6.4 Carry-over to surface

**SEO meta tags for landing** — out of 1a scope, future polish carry-over. Landing needs:
- `<title>HEXLASH — The Underground Web3 Arena</title>` (or similar — translation pending Эпик 7+ locale cleanup)
- Meta description, Open Graph tags (og:image, og:title, og:description), Twitter Card tags
- Canonical URL

Likely Vue plugin needed (`@vueuse/head` or similar) — not currently in dependencies (verify via `grep "@vueuse/head" package.json` in Phase 1 if scope expands).

**Carry-over for Эпик 7+ Stream 4 Polish:** SEO meta tags + sitemap.xml + robots.txt audit для landing.

---

## SUMMARY — readiness assessment

- **Сложность ТЗ:** **S-M** (single new view, ~150-200 lines template+style, 1 router edit, 0 new Vuex, 0 backend, 5 social asset imports, 1 logo reuse, 1 conditional redirect)

- **Estimated commits:** **3-4 functional**
  - C1: Create `src/views/LandingView.vue` with hero + CTA + socials + footer (template + script + scoped style)
  - C2: Router rewire — remove `/` from `protectedRoutes`, add new top-level route with `beforeEnter` auth-redirect, point to LandingView
  - C3: App.vue chrome adjustment — extend `v-if="!isV2Route"` to also exclude landing OR add landing-specific chrome handling (decide pattern in Phase 1 design)
  - C4 (optional, IF visual gap): polish pass for any visual issue surfaced by Phase 4 visual verify

- **Open questions for design-Claude:**
  1. **Chrome strategy** — App.vue header+footer behavior on landing route (full hide via Option A from Subsection 2.5, vs keep small Logo via Option B). Recommend Option A.
  2. **Design system** — legacy `--hex-*`+`Anonymous` vs v24 `Archivo Black`+`--bg-deep` (Subsection 3.3 critical finding). Recommend Option A (legacy `--hex-*`) for 1a scope; defer v24 aesthetic to Sub-epic 1b auth redesign.
  3. **Route name** — keep `'Home'` (recommended — preserves `getPreviousRoute()` fallback) vs rename to `'Landing'`.
  4. **Post-auth redirect target** — preserve `push('/')` cascade through landing redirect (recommended — scope discipline) vs change auth module to `push('/v2')` directly.
  5. **Footer links targets** — `/privacy`, `/rules`, `/help` confirmed exist. `/help` redirects to `/v2/help` (CLAUDE.md 6B-1). Should landing link to `/help` (cascades) or `/v2/help` direct? Recommend `/help` (legacy URL = stable bookmark).
  6. **i18n strategy** — inline EN (recommended per 5T) vs t.landing.* keys.
  7. **Layout proportions** — full-bleed hero with vertical stack (logo + tagline + CTA centered, socials + footer at bottom)? Or split layout? Phase 1 design call.
  8. **Background** — solid `--hex-bg-deep`? Add subtle visual element (gradient, optional reused background asset like `background_arena.webp`)? Phase 1 visual call.

- **Risks identified:**
  1. **Logo double-render risk** (Subsection 2.5) — App.vue header mounts `<Logo />` for non-v2 routes; landing must coordinate chrome (Option A recommended).
  2. **CSS scope mismatch** (Subsection 3.3) — v24 effects (`grain/scanlines/vignette`) and v24 fonts (`Archivo Black`) NOT available at `/` outside `.app-v2`. Landing uses legacy `--hex-*` tokens. Acceptable trade-off; visual identity slightly differs from v2 hub.
  3. **Auth flow downstream** (Subsection 6.1) — `masterState.js` post-auth uses `router.push('/')` 5 times. After landing, this means: register → push('/') → beforeEnter sees authed → redirect /v2 → user lands on hub. Single hop, low risk, but flash possible if browser slow. Mitigate with `replace: true` semantics on `next()` if needed.
  4. **`Home` route name reuse** (Subsection 5.2) — `getPreviousRoute()` (router.js:189) defaults to `'Home'` as fallback. If rename chosen, must update fallback. Recommendation: keep `'Home'`.
  5. **Bundle size** — 5 social SVG imports + LandingView lazy chunk. Estimate ~3-5 KB raw / ~1-2 KB brotli. Negligible.
  6. **Marketing copy approval** — "The underground Web3 arena" tagline is prototype text. Final copy may differ — confirm with user before C1.

- **Pre-edit blockers:** **NONE.**
  - All 5 social icons exist (verified)
  - Auth getter canonical (verified)
  - Router beforeEnter precedent exists (verified)
  - CSS taxonomy global at `:root` (verified)
  - View name + route name + CSS prefix collision-free (verified)
  - Logo + i18n + asset import conventions documented (verified)
  - All 6 critical questions for design-Claude resolved with recommendations

**Readiness:** Phase 1 can begin once design-Claude reviews the 8 open questions and confirms recommendations (especially Q1 chrome + Q2 design system).

**Files to be touched in Phase 1:**
- NEW: `src/views/LandingView.vue` (~200 lines)
- MODIFIED: `src/router/index.js` (~5-10 lines: remove old `/` from protectedRoutes, add new entry with beforeEnter)
- MODIFIED: `src/App.vue` (~3-5 lines: extend `isV2Route` check to also exclude landing, OR introduce `isChromeHidden` computed)

**Files NOT touched (out of scope per ТЗ):**
- `src/views/RainView.vue` — Sub-epic 1b removal candidate
- `src/components/fragments/auth/*` — Sub-epic 1b auth redesign
- `src/core/state/modules/masterState.js` — preserves `push('/')` cascade
- All v2 views and HUD components — landing is at `/`, separate scope
