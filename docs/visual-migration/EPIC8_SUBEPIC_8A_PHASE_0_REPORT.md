# Sub-epic 8a Phase 0 Report — Migration `/v2` → `/play`

**Status:** Phase 0 — investigation only, READ-ONLY
**Branch:** `claude/investigate-v2-to-play-migration-UNlMW` (created from main HEAD `05d33db` post 1b PR #363 merge — Lesson #43 STEP 0 verified, 0 ahead / 0 behind origin/main)
**Predecessor:** Sub-epic 1b CLOSED (PR #363 merge commit `05d33db`)
**Date:** 2026-05-06

---

## 1. Routes Inventory

### 1.1 Router `/v2` routes (count: 17 = 1 parent + 16 children)

All under `src/router/index.js:118-205` (`v2Routes` array):

| Path | Name | Component |
|---|---|---|
| `/v2` (parent) | `V2Root` | `@/AppV2.vue` |
| `''` (default child) | `V2Pit` | `@/views-v2/PitViewV2.vue` |
| `fd/:key` | `V2FighterDetail` | `@/views-v2/FighterDetailView.vue` |
| `fight` | `V2Fight` | `@/views-v2/FightView.vue` |
| `training` | `V2Training` | `@/views-v2/TrainingView.vue` |
| `matchmaking` | `V2Matchmaking` | `@/views-v2/MatchmakingView.vue` |
| `create` | `V2Create` | `@/views-v2/CreateView.vue` |
| `profile` | `V2Profile` | `@/views-v2/ProfileView.vue` |
| `ratings` | `V2Ratings` | `@/views-v2/RatingsView.vue` |
| `clan` | `V2Clan` | `@/views-v2/ClanView.vue` |
| `clan/:id` | `V2GuestClan` | `@/views-v2/GuestClanView.vue` |
| `shop` | `V2Shop` | `@/views-v2/ShopView.vue` |
| `spectate/:fightId` | `V2Spectate` | `@/views-v2/SpectateView.vue` |
| `help` | `V2Help` | `@/views-v2/HelpView.vue` |
| `user/:userLogin` | `V2UserProfile` | `@/views-v2/UserProfileView.vue` |
| `wallet` | `V2Wallet` | `@/views-v2/WalletView.vue` |
| `account` | `V2Account` | `@/views-v2/AccountView.vue` |

`v2ProtectedNames = ['V2Fight', 'V2Matchmaking', 'V2Spectate']` — auth-protected names array (router/index.js:114).

### 1.2 Frontend `/v2` occurrences (count: 116 hits in src/, excl. router)

**Code execution paths (~50-60 hits, NOT comments):**

| File | Lines | Pattern |
|---|---|---|
| `src/App.vue` | 106 | `isV2Route = computed(() => route.path.startsWith('/v2'))` |
| `src/components/pvp/ChallengeNotification.vue` | 67-68 | `if (...path.startsWith('/v2'))` + `router.push('/v2/fight')` |
| `src/components/hud/HudRatings.vue` | 346, 353, 411-413, 453-455, 507-509 | 10× `$router.push('/v2/...')` for clan/fighter/user navigation |
| `src/components/hud/HudSpectate.vue` | 202 | `router.push('/v2')` |
| `src/components/hud/HudClan.vue` | 239 | `router.push('/v2')` |
| `src/components/hud/HudFighterDetail.vue` | 276, 305 | `router.push('/v2')` (back + Esc) |
| `src/components/hud/HudFight.vue` | 212, 240, 252 | `path.startsWith('/v2/spectate')` + 2× `router.push('/v2/fd/warden')` |
| `src/components/hud/HudProfile.vue` | 593, 602 | `router.push(\`/v2/spectate/${...}\`)`, `router.push(\`/v2/user/${...}\`)` |
| `src/components/fragments/clan/CreateClan.vue` | 150 | `if (currentPath !== '/v2/clan')` |
| `src/components/fragments/clan/ClanEdit.vue` | 168 | Same pattern |
| `src/views-v2/WalletView.vue` | 41 | `router.push('/v2/profile')` |
| `src/views-v2/AccountView.vue` | 42 | `router.push('/v2/profile')` |
| `src/views-v2/ProfileView.vue` | 37 | `router.push('/v2')` |
| `src/views-v2/TrainingView.vue` | 42 | `router.push('/v2')` |
| `src/views-v2/SpectateView.vue` | 74, 85 | 2× `router.push('/v2')` |
| `src/views-v2/ShopView.vue` | 18 | `router.push('/v2')` |
| `src/views-v2/GuestClanView.vue` | 63 | `router.replace('/v2/clan')` |
| `src/views-v2/ClanView.vue` | 39 | `router.push('/v2')` |
| `src/views-v2/RatingsView.vue` | 38 | `router.push('/v2')` |
| `src/views-v2/FighterDetailView.vue` | 161, 186 | `router.push('/v2')` |
| `src/views-v2/CreateView.vue` | 60, 135, 146 | `router.push('/v2')` + 2× `router.push('/v2/fd/' + agent.id)` |
| `src/views-v2/MatchmakingView.vue` | 111, 121, 146, 210, 245, 283 | 6× `router.push/.replace('/v2*')` (back, cancel, captain redirect, double-queue, fight nav) |
| `src/views-v2/PitViewV2.vue` | 35-64 | 7× `router.push('/v2/...')` for plinth click handlers |

**Total non-comment code execution sites: ~50-60 explicit `/v2` push-targets.**

**Comments mentioning `/v2`:** 60+ (in `src/views-v2/*.vue`, `src/components/hud/*.vue`, `src/scene/interaction/*.js`, `src/core/state/modules/*.js`) — mostly inert documentation, won't affect runtime.

### 1.3 CSS `.app-v2` namespace

**Total `.app-v2` references in src/: 604 hits** (very high coupling).

**Declaration:**
- `src/AppV2.vue:31` — scoped style declaration
- `src/styles/v24/tokens.css:7` — global CSS custom property declaration

**Application:**
- `src/AppV2.vue:2` — `<div class="app-v2">` wrapper around all `/v2/*` content

**Class prefix usage in 12 CSS files (`src/styles/v24/*.css`):**

| File | `.app-v2` rule prefixes |
|---|---|
| `clan.css` | 94 |
| `profile.css` | 95 |
| `matchmaking.css` | 78 |
| `shop.css` | 68 |
| `create.css` | 56 |
| `ratings.css` | 55 |
| `fight-overlays.css` | 51 |
| `training.css` | 36 |
| `verify.css` | 7 |
| `effects.css` | 3 |
| `help.css` | 3 |
| `tokens.css` | 1 |
| **Total** | **~547 rule prefixes** |

**JS coupling to class name:**
- `src/scene/interaction/useClickToHit.js:27` — `document.querySelector('.app-v2')` for DOM-based click handler attachment

**Critical scale finding:** Renaming `.app-v2` → `.app-play` would touch 12 CSS files + AppV2.vue template + JS query selector = **~550+ line edits MINIMUM**. Out of 8a scope per ТЗ "S-M size".

**Recommendation: KEEP `.app-v2` class name unchanged.** Class is the visual migration namespace (architecture identity), NOT URL-coupled. Per ТЗ Subsection 5 lock: "v2 stays as architecture name, only URL `/play` is user-facing". Decoupling is correct — class name stays, URL changes.

### 1.4 Backend `/v2` references

**ZERO** — clean separation. Backend uses `/api/v1/*`, no FE URL coupling.

```bash
$ grep -rn "/v2\|app-v2" backend/src/  # → 0 hits
```

### 1.5 Total touch sites

| Category | Count |
|---|---|
| Router config (route paths + parent) | 17 routes |
| Existing protectedRoutes redirects pointing to `/v2/*` | 14 |
| App.vue `isV2Route` + use sites | 1 def + 2 uses |
| Code execution `/v2` push targets | ~50-60 |
| CSS `.app-v2` class coupling | 547+ rules (KEEP per recommendation) |
| Vuex / composables hardcoded `/v2` | 0 |
| i18n `/v2` references | 0 |
| Backend `/v2` references | 0 |

### 1.6 Migration complexity estimate

**S-M** (small-to-medium). All grunt work concentrated in:
- 1 router file (path renames + cascade redirect block)
- 1 App.vue (rename `isV2Route`)
- ~25-30 source files (text replacement of `/v2` → `/play` in code paths)
- 0 CSS changes (`.app-v2` decoupled per recommendation)
- 0 backend changes
- 0 Vuex changes
- 0 i18n changes

---

## 2. Route Name vs Path Coupling

### 2.1 Name-based router.push references

Total: **2 sites only** (both v1 legacy code, NOT `/v2/*` names):

| File:Line | Pattern |
|---|---|
| `src/components/ui/BackButton.vue:29` | `router.push({ name: props.defaultRoute })` (dynamic) |
| `src/components/fragments/profile/ProfileButtons.vue:77` | `router.push({name: route})` (dynamic, called with `'Wallet'`/`'Account'`/etc.) |

Both pass dynamic name from caller. Names referenced are v1 legacy (`'Wallet'`, `'Account'`, `'Help'`) — not `/v2/*` names. Per decision #3 (keep names verbatim), `V2Profile`, `V2Pit`, etc. survive — name-based navigation NOT a refactor concern.

`<router-link to="{ name: 'X' }">` pattern: **0 sites in src/.**

### 2.2 Path-based fallbacks

**0 sites** with hardcoded path fallback to `/v2/*` (everything that uses fallback uses dynamic name parameter).

`getPreviousRoute()` + `backRef()` (router/index.js:221, 230) used by 4 v1 components (ProfileSkins, ProfileAccount, ProfileWallet, PageView) — all pass dynamic route name to BackButton. NOT coupled to `/v2/*` paths.

### 2.3 beforeEnter `next('/v2*')` calls in router

**Single site to update:**

| File:Line | Current | Update to |
|---|---|---|
| `src/router/index.js:47` | `next('/v2');` (Sub-epic 1a authed cascade in Home `/` beforeEnter) | `next('/play');` |

Other `next()` calls in router:
- Line 250: `next({name: 'Login'})` — name-based, no change
- Line 256: `next('/fight')` — legacy redirect chain, cascades through `/fight` → `/v2/fight` → `/play/fight` post-8a (defensive, no immediate change required)

---

## 3. Backward Compat Redirect Strategy

### 3.1 Existing redirect syntax precedents

**String-form (most common):**
```js
{path: '/help', redirect: '/v2/help'},
{path: '/profile', redirect: '/v2/profile'},
{path: '', redirect: '/auth/login'},  // nested child
```

**Function-form param transform:**
```js
{path: '/fighter/:key', redirect: to => `/v2/fd/${to.params.key}`},
{path: '/spectate/:odId', redirect: to => `/v2/spectate/${to.params.odId}`},
```

**Function-form named-route target:**
```js
{path: '/clan/:id', redirect: to => ({ name: 'V2GuestClan', params: { id: to.params.id } })},
```

**Function-form with side-effect (Sub-epic 1b C9 precedent):**
```js
{
  path: '/r/:username',
  redirect: to => {
    localStorage.setItem('hexlash_referral_code', to.params.username);
    return '/auth/signup';
  },
},
```

### 3.2 Cascade catch-all `/v2/:pathMatch(.*)*` → `/play/{pathMatch}`

**Vue Router 4 supports this pattern.** Already used elsewhere in codebase:
```js
// router/index.js:215 — 404 catch-all (existing precedent)
{path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
```

**Recommended implementation:**
```js
// Backward compat cascade — /v2/* → /play/* (Sub-epic 8a)
{path: '/v2', redirect: '/play'},
{
  path: '/v2/:pathMatch(.*)*',
  redirect: to => {
    const tail = Array.isArray(to.params.pathMatch)
      ? to.params.pathMatch.join('/')
      : (to.params.pathMatch || '');
    return tail ? `/play/${tail}` : '/play';
  },
},
```

**Note:** Vue Router 4 `(.*)*` matcher returns `pathMatch` as an array (asterisk repeater). Defensive code handles both array and string — array.join logic preserves nested paths like `/v2/clan/abc` → `/play/clan/abc`.

### 3.3 Эпик 6 cutover redirects (need update?)

**14 existing redirects** in `protectedRoutes` (router/index.js:71-106) point to `/v2/*`:

| Legacy path | Current target | Recommended 8a target |
|---|---|---|
| `/help` | `/v2/help` | `/play/help` |
| `/create-fighter` | `/v2/create` | `/play/create` |
| `/fighter/:key` | `/v2/fd/:key` | `/play/fd/:key` |
| `/profile` | `/v2/profile` | `/play/profile` |
| `/profile/balance` | `/v2/profile` | `/play/profile` |
| `/profile/wallet` | `/v2/wallet` | `/play/wallet` |
| `/profile/account` | `/v2/account` | `/play/account` |
| `/profile/skins` | `/v2/profile` | `/play/profile` |
| `/clan/:id` | `V2GuestClan` (named) | `V2GuestClan` (named, KEEP — name-based survives) |
| `/ratings/:type` | `/v2/ratings` | `/play/ratings` |
| `/ratings` | `/v2/ratings` | `/play/ratings` |
| `/training` | `/v2/training` | `/play/training` |
| `/fight` | `/v2/fight` | `/play/fight` |
| `/friends` | `/v2/profile` | `/play/profile` |
| `/matchmaking` | `/v2/matchmaking` | `/play/matchmaking` |
| `/spectate/:odId` | `/v2/spectate/:fightId` | `/play/spectate/:fightId` |
| `/user/:userLogin` | `V2UserProfile` (named) | `V2UserProfile` (named, KEEP) |

**Recommendation per ТЗ §3.3: Update directly to `/play/*` (single-hop).** Two of them use named-route form — those survive automatically since route names stay verbatim per decision #3.

Cleaner browser history (single redirect instead of legacy `/profile` → `/v2/profile` → cascade catch-all → `/play/profile`).

---

## 4. UI Infrastructure Dependencies

### 4.1 App.vue `isV2Route`

**Current state (post 1b interrupt fix):**
```js
// src/App.vue:106
const isV2Route = computed(() => route.path.startsWith('/v2'));

// src/App.vue:111
const isMarketingRoute = computed(() =>
  route.path === '/' || route.path.startsWith('/auth')
);
```

**Use sites:**
- Line 3: `<header v-if="!isV2Route && !isMarketingRoute">` — hide v1 header chrome on v2 + marketing
- Line 19: `<template v-if="!isV2Route">` — hide v1 toasts/menu/notifications on v2

**Post-8a recommendation:** **Rename to `isPlayRoute`** mirroring 1b precedent (`isLandingRoute` → `isMarketingRoute`):
```js
const isPlayRoute = computed(() => route.path.startsWith('/play'));
```

**Rationale:** Vue Router 4 redirects resolve BEFORE route matching, so `route.path` after cascade is `/play/*` (not `/v2/*`). Computed checking `/v2` would never match. Renaming preserves the intent (hide v1 chrome on game routes) with correct path prefix.

Update both use sites accordingly.

**Alternative: extend computed temporarily** during transition (`/v2` OR `/play`) — but Vue Router redirect cascade handles this transparently, so extension is unnecessary. Clean rename is preferred.

### 4.2 `.app-v2` CSS namespace

**Current coupling: 547+ rule prefixes across 12 CSS files + 1 JS query selector.**

**Post-8a recommendation: KEEP `.app-v2` class name.**

**Rationale:**
- Class name represents visual migration architecture (`v2` epic identity), NOT URL prefix
- Per ТЗ Subsection 5 lock: "v2 stays as architecture name, only URL `/play` is user-facing"
- Renaming would touch ~550+ lines across 12 CSS files + JS — out of 8a scope (S-M size)
- Decoupling correct: directory `src/views-v2/`, CSS `.app-v2`, JS `AppV2.vue` ALL stay; only URL `/play` user-facing
- Documentation in CLAUDE.md needed to explain class:path independence post-8a

### 4.3 Vuex / composables hardcoded `/v2` paths

**ZERO hardcoded `/v2` paths** in `src/core/`. Clean separation. State paths are name-based or use store getter chains, not URL strings.

### 4.4 i18n `/v2` references

**ZERO `/v2` references** in `src/locales/*.js`. Clean.

---

## 5. Vocabulary Alignment Audit

### 5.1 `/play` route collision

**No collision.** `grep "'/play\|\"/play\|path: */play" src/ backend/src/` returns 0 hits.

**localStorage `play*` key collision:** None. False-positive grep matches: `isPlayer1` (PvP terminology), `playerModules`, `setPlayerModules` — all related to player1/player2/playerModules concept, NOT URL "play".

### 5.2 Existing /v2 route names (preserve in 8a)

| Original `/v2` name | Path post-8a | Name post-8a |
|---|---|---|
| `V2Root` | `/play` | `V2Root` (preserve) |
| `V2Pit` | `/play` (default child `''`) | `V2Pit` (preserve) |
| `V2FighterDetail` | `/play/fd/:key` | `V2FighterDetail` (preserve) |
| (all others) | `/play/<segment>` | (all preserved) |

**Per decision #3:** Keep route names verbatim. Only path strings change.

### 5.3 Codebase "v2" terminology

**Decision: KEEP "v2" as internal architecture name.**

Out of 8a scope:
- `src/views-v2/` directory (16 files)
- `src/styles/v24/` subdirectory
- `src/AppV2.vue` filename
- `.app-v2` CSS class
- Route names `V2Root`, `V2Pit`, `V2Profile`, etc. (16 names)
- `v2Routes`, `v2ProtectedNames` arrays in router
- Comments referring to "v2" in 30+ files

Renaming all this would be MASSIVE refactor — out of 8a scope.

### 5.4 Directory rename `src/views-v2/`?

**Recommendation: NO — keep directory name.**

Rationale:
- Directory = implementation, URL = user-facing
- Decoupling correct
- Renaming = file moves across 16 files + every import path update + git history fragmentation
- Out of 8a scope per S-M sizing

---

## 6. Semantic Invariant + Flow Direction

### 6.1 Anonymous → Game flow

**Current (Sub-epic 1a):**
```js
// src/router/index.js:42-50 — / Home beforeEnter
beforeEnter: (to, from, next) => {
    const isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false;
    if (isAuthenticated) {
        next('/v2');  // ← UPDATE to '/play'
    } else {
        next();
    }
},
```

**Single update site for 8a.** Anonymous user sees LandingView; authed user redirects to `/play`.

### 6.2 Authed direct URL flow

Same as 6.1 — handled by `/` beforeEnter cascade.

### 6.3 Bookmark cascade verify

**Coverage:**
- Old `/v2/*` bookmarks → cascade redirect → `/play/*` ✓ (via `/v2/:pathMatch(.*)*` catch-all)
- Friend-Watch links (e.g. `/v2/spectate/:fightId`) — explicit path-based via `router.push` in HudProfile.vue:593, will be updated to `/play/spectate/:fightId` directly
- Shared external links to old URLs continue to work via redirect

### 6.4 Internal navigation `/v2` push sites

**Update strategy: each `/v2` literal becomes `/play` literal.**

**Sites grouped by file (final list — 25 files × ~50 push targets):**

| File | Push targets |
|---|---|
| `App.vue` | `isV2Route` computed |
| `ChallengeNotification.vue` | path check + push |
| `HudRatings.vue` | 10 push sites |
| `HudSpectate.vue`, `HudClan.vue`, `HudFighterDetail.vue` (×2), `HudFight.vue` (×2), `HudProfile.vue` (×2) | back/Esc/spectate/user navigation |
| `CreateClan.vue`, `ClanEdit.vue` | path check |
| `views-v2/*.vue` (15 files) | back/Esc handlers + internal navigation |

### 6.5 Post-login redirect verification

**LoginView/SignupView pattern:**
```js
// src/views/auth/LoginView.vue:107
// On success, action calls router.push('/') internally — beforeEnter on '/'
// cascade to /v2 if authed (Sub-epic 1a).
```

LoginView dispatches `master/login` → action `await router.push('/')` (masterState.js:121).
SignupView dispatches `master/register` → same `await router.push('/')` (masterState.js:158).

**Vuex `master/login` and `master/register` redirect target = `/`** (NOT hardcoded `/v2`). Cascade through `/` beforeEnter (which itself updates to `/play` per 6.1). **No additional updates needed in Vuex.**

**ChallengeNotification PvP routing branch (Sub-epic 4a precedent):**
```js
// src/components/pvp/ChallengeNotification.vue:67-68
if (router.currentRoute.value.path.startsWith('/v2')) {
    router.push('/v2/fight');
} else {
    router.push({ path: '/fight', query: { mode: 'pvp', matchId: data.matchId } });
}
```

Update to:
```js
if (router.currentRoute.value.path.startsWith('/play')) {
    router.push('/play/fight');
} else {
    router.push({ path: '/fight', query: { mode: 'pvp', matchId: data.matchId } });
}
```

`/fight` else-branch stays for legacy route entry (cascades through `/fight` → `/play/fight` redirect).

---

## SUMMARY — Readiness Assessment

### Сложность ТЗ
**S-M** (small-to-medium). Concentrated edits in:
- 1 router file (path renames + redirect block)
- 1 App.vue (rename `isV2Route` → `isPlayRoute`)
- ~25-30 source files (text replacement `/v2` → `/play` in code paths)

Out of scope (KEEP per decisions/recommendations):
- 0 CSS changes (`.app-v2` decoupled — class is architecture, not URL)
- 0 backend changes
- 0 Vuex changes
- 0 i18n changes
- 0 directory renames
- 0 file renames (`AppV2.vue`, `views-v2/*`, `styles/v24/*` stay)

### Estimated functional commits
**3-5 functional + 3 closure.**

Suggested cluster ordering:

| Cluster | Commits | Purpose |
|---|---|---|
| **A — Router restructure** | 1 | Rename `/v2/*` paths to `/play/*` in v2Routes block + add `/v2/*` cascade redirect catch-all + update `/` beforeEnter `next('/v2')` → `next('/play')` + update 14 existing protectedRoutes redirect targets |
| **B — App.vue computed** | 1 | Rename `isV2Route` → `isPlayRoute` (path startsWith `/play`) + update 2 use sites |
| **C — Code paths sweep** | 1-2 | Text replacement `/v2` → `/play` across ~25 files (HUD components + views-v2 back-buttons + PitViewV2 plinth handlers + MatchmakingView nav + ChallengeNotification path check + CreateClan/ClanEdit path checks) |
| **D — Comment refresh (optional)** | 0-1 | Update `/v2/*` comments referencing routes — could defer to future polish |

### Open questions for design-Claude

1. **Cluster split granularity** — 1 commit per Cluster (A/B/C/D), or finer-grained (A1 router rename + A2 cascade redirect, etc.)?
2. **Comment updates in-scope or deferred?** ~60+ `/v2/*` mentions in JSDoc/comments. Functional-only commits OR include comment refresh?
3. **`isV2Route` rename name** — `isPlayRoute` (recommended), `isGameRoute` (semantic), or other?
4. **Test the redirect catch-all** — recommend manual smoke test post-Cluster A (visit `/v2/profile` → confirm redirects to `/play/profile`)? Add as G1 STOP gate?
5. **Continue stack vs harness branch convention** — continue using `claude/investigate-v2-to-play-migration-UNlMW`, or expect harness fresh slug? (Resolved at Step 0 — proceed with current.)

### Risks identified

| Risk | Severity | Mitigation |
|---|---|---|
| Cascade redirect catch-all `(.*)*` syntax glitch | LOW | Vue Router 4 supports + existing 404 catch-all precedent (`'/:pathMatch(.*)*'`) |
| `pathMatch` array vs string handling | LOW | Defensive `Array.isArray(...) ? .join('/') : (...)` pattern |
| `isV2Route` rename — find/update both use sites | LOW | Pre-edit grep confirms 2 use sites at App.vue lines 3 and 19 |
| Missed `/v2` push site → broken navigation post-8a | MEDIUM | Comprehensive grep + post-edit verify (Lesson #11 reflex on each Cluster) |
| `.app-v2` class confusion (URL `/play` vs class `.app-v2`) | LOW | Documentation in CLAUDE.md + commit message context |
| ChallengeNotification path check logic | LOW | Update both `startsWith('/v2')` and `/v2/fight` push target in one edit |
| 1a `next('/v2')` cascade target | LOW | Single line update at router/index.js:47 |
| Friend-Watch link bookmarks | LOW | Cascade catch-all redirect handles transparently |

### Pre-edit blockers

**NONE.** All structural baselines verified, all paths confirmed exist, all decisions locked pre-Phase-1.

### Major decisions for design-Claude review

1. **`.app-v2` CSS namespace strategy** — KEEP (recommended) per S4.2. ~547 rule prefixes preserved as architecture identity, decoupled from URL.
2. **`isV2Route` computed strategy** — RENAME to `isPlayRoute` (recommended) per S4.1. Mirror 1b interrupt fix pattern (`isLandingRoute` → `isMarketingRoute`).
3. **Эпик 6 cutover redirect chain handling** — UPDATE DIRECTLY to `/play/*` (recommended) per S3.3. Single-hop preferable to chain through `/v2/*` cascade.
4. **Catch-all redirect implementation** — function-form with array→string handling (recommended) per S3.2. Defensive pattern.

---

## Bonus Findings (not in 6-subsection scope)

1. **Total `/v2` mentions in src/ = 116 hits.** Of those, ~50-60 are code execution paths; ~60+ are comments. Comment refresh is optional polish.

2. **`ChallengeNotification.vue:67-68` v2-aware split** (Sub-epic 4a precedent) — increasingly vestigial post-8a since `/fight` redirect cascade now goes `/fight` → `/play/fight` (via Эпик 6 redirect updated to `/play/*`). The else-branch effectively never runs after Эпик 6 cutover but stays defensive. No functional issue, just acknowledged as orphan-ish.

3. **`useClickToHit.js:27`** — `document.querySelector('.app-v2')` is the ONLY JS coupling to class name. Per recommendation (KEEP `.app-v2`), no change needed.

4. **GuestClanView self-redirect at `views-v2/GuestClanView.vue:63`** — `router.replace('/v2/clan')` for own clan. Update to `/play/clan`.

5. **Stream 1 cleanup carry-over (from 1b)** noted: Lesson #43 STEP 0 reflex sufficient pattern (10 occurrences) — formalize as bootstrap auto-procedure (per user note in this session). Out of 8a scope. Track as Stream 1 cleanup.
