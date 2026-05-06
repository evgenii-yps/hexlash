# Sub-epic 8b Phase 0 Report — Marketing Site Cluster A

**Status:** Phase 0 — investigation only, READ-ONLY
**Branch:** `claude/investigate-marketing-site-rIC7v` (created from main HEAD `a7dfeb5` post 8a PR #364 merge — Lesson #43 STEP 0 verified, 0 ahead / 0 behind origin/main)
**Predecessor:** Sub-epic 8a CLOSED (PR #364 merge commit `a7dfeb5`)
**Date:** 2026-05-06

---

## 1. API Contract Verification

### 1.1 Auth state getter post-1b/8a

**Path verified:** `store.getters["master/getLoginState"]?.isAuthenticated || false`

Used at:
- `src/router/index.js:45` — `/` Home `beforeEnter` (Sub-epic 1a authed cascade target updated to `/play` in 8a)
- `src/router/index.js:282` — main `router.beforeEach` guard for protected routes

**Path is stable post-1b/8a refactor.** No changes from auth excision (Telegram removal in 1b did not touch `getLoginState` getter).

### 1.2 Current `/` Home beforeEnter

```js
// src/router/index.js:38-52
{
    path: '/',
    name: 'Home',
    component: () => import("/src/views/LandingView.vue"),
    beforeEnter: (to, from, next) => {
        // Authed users skip landing — go straight to /play hub.
        // Anonymous users see LandingView (Sub-epic 1a).
        const isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false;
        if (isAuthenticated) {
            next('/play');
        } else {
            next();
        }
    },
},
```

### 1.3 1a Play CTA implementation reference

```js
// src/views/LandingView.vue:76-78
function onCtaClick() {
  router.push('/auth/signup');
}
```

**Critical observation:** 1a CTA does NOT check auth — always pushes to `/auth/signup`. Why? Because authed users **never reach the CTA** — the `/` beforeEnter already cascades them to `/play` BEFORE LandingView mounts. So single-target push is sufficient.

### 1.4 Play CTA recommendation for 8b

**Option A (preserve 1a pattern, RECOMMENDED):**
- MarketingView renders only for anonymous users (beforeEnter cascade for authed)
- Play CTA → `router.push('/auth/signup')` — single target, no auth check needed in component
- Component stays mostly static + visual; no Vuex coupling

**Option B (defensive smart-CTA):**
- `if (isAuthed) router.push('/play') else router.push('/auth/signup')`
- Redundant — beforeEnter already gates
- Adds Vuex import + getter check in marketing surface

**Recommendation: Option A.** Rationale:
- Mirrors 1a precedent exactly
- Marketing surface stays simple (mostly static)
- No duplicate auth check (single source of truth: `/` beforeEnter)
- Lesson #32 convention discovery — preserve existing pattern

---

## 2. Negative-Space Verification

### 2.1 MarketingView name collision

**No collision.** Verified:
- `src/views/MarketingView.vue` does NOT exist
- `src/views-v2/MarketingView.vue` does NOT exist
- No `*Marketing*.vue` anywhere in `src/`

### 2.2 Hex pattern animation

**Existing CSS hex patterns:** NONE in codebase. `src/styles/v24/effects.css` and `src/styles/v24/tokens.css` checked — no hex-pattern definitions. Need to build from scratch in 8b.

**Three.js status post-1b:** Still in `package.json` (`"three": "^0.167.1"`) — kept because 3 active consumers (Punch3D + CanvasLayer + TrainingView) per 1b C9 audit.

**Existing `--hex-*` keyframes in `hexlash-ui.css`:**
| Keyframe | Line | Purpose |
|---|---|---|
| `hex-spin` | 534 | spinner rotation |
| `hex-fade-in` | 746 | fade in |
| `hex-scale-in` | 751 | scale in |
| `hex-pulse` | 756 | scale pulse |
| `hex-pulse-opacity` | 761 | opacity pulse |
| `hex-glow-pulse` | 766 | glow box-shadow pulse |
| `hex-float-up` | 771 | translate-Y float |

`hex-pulse`, `hex-glow-pulse`, `hex-float-up` are reusable for marketing fade-in/glow effects.

**Recommendation: pure CSS animated SVG hex pattern** — lighter than Three.js, GPU-accelerated transform/opacity, easier to maintain via DevTools. Implementation:
- SVG `<pattern>` with hexagon polygon paths repeating across viewport
- CSS animation: subtle pan + opacity pulse on the SVG layer
- Pink glow accent overlay (radial gradient) for depth
- ~50-80 lines CSS total. No JS overhead.

Three.js for hex pattern would be overkill (60 FPS animation achievable pure CSS). Three.js stays for game scenes only.

### 2.3 Section component pattern

**Existing pattern:** No "section" component pattern in codebase. 1a LandingView is a single-file approach (all hero + footer markup inline within `LandingView.vue` template).

**Recommendation: inline single-file for 8b** (Option A from Subsection 5). 3 sections (Hero + About + Footer) ~300-400 lines total in single `MarketingView.vue`. Easier review, simpler commit history.

If 8c expansion adds 5+ more sections (Token, Gameplay, Roadmap, Partners, Subscribe, Community, FAQ), refactor to separate `src/components/marketing/Section*.vue` files at that point.

### 2.4 Smooth scroll precedent

**No existing `scroll-behavior: smooth` or `scrollIntoView({ behavior: 'smooth' })` usage** in `src/`.

`overscroll-behavior-y: none` exists in PreparationView.vue + FightClubView.vue (different concept — overscroll, not smooth scroll).

**Recommendation:** native CSS `scroll-behavior: smooth` on `html` element (or scoped to `.marketing` root). Section nav + scroll-to-section deferred to 8c when nav menu exists.

### 2.5 IntersectionObserver precedent

**No existing IntersectionObserver usage** in `src/`.

**`@vueuse/core` package** — installed (`"@vueuse/core": "^14.1.0"` in package.json). Provides `useIntersectionObserver` composable. Standard, well-tested.

**Recommendation:** use `useIntersectionObserver` from `@vueuse/core` — saves ~15 lines of native API boilerplate, no new dependency (already installed).

### 2.6 SEO meta tag management

**Current state in `index.html`:**
- Static `<title>Hexlash</title>`
- Viewport, mobile-web-app, theme-color, charset meta tags
- **NO Open Graph, NO Twitter card, NO meta description**
- Favicon present (`favicon.ico` + `favicon.svg`)

**No `useHead` / `@vueuse/head` / `vue-meta` package installed.** Note: `@vueuse/core` (installed) ≠ `@vueuse/head` (NOT installed).

**Recommendation:** Two options:

| Option | Pros | Cons |
|---|---|---|
| A — Install `@vueuse/head` (~5KB) | Vue 3 native, declarative `useHead({...})`, multi-route support | Adds dependency |
| B — Manual `document.title` + `document.head.querySelector('meta')` manipulation in `onMounted`/`onBeforeUnmount` | No new dep | ~30-50 lines composable |

For 8b (single marketing route), Option B is sufficient. Build inline `useDocumentMeta()` composable in `src/composables/useDocumentMeta.js` (~30-line). Defer Option A install if/when more routes need per-route meta management.

**Recommendation: Option B inline composable.**

---

## 3. CSS Class Taxonomy

### 3.1 Available `--hex-*` tokens (all needed exist)

| Token | Value | Use |
|---|---|---|
| `--hex-primary` | `#FF066F` | Pink CTA, accents |
| `--hex-primary-light` | `#FF3D8E` | Hover states |
| `--hex-primary-dark` | `#A50344` | Active states |
| `--hex-primary-glow` | `rgba(255, 6, 111, 0.5)` | CTA glow shadow, hex pattern accent |
| `--hex-bg-deep` | `#050507` | Background |
| `--hex-bg-dark` | `#090909` | Background |
| `--hex-text-primary` | `#FFFFFF` | Headings, body |
| `--hex-text-muted` | `rgba(255, 255, 255, 0.35)` | Subtitles, footer text |
| `--hex-border-default` | `rgba(255, 255, 255, 0.08)` | Footer divider |

**All needed tokens exist.** No additions required.

### 3.2 Existing `.hex-btn-*` classes (reuse vs custom)

**Available globally** (`src/styles/hexlash-ui.css:318-395`):
- `.hex-btn` (base) + `.hex-btn-primary`/`secondary`/`ghost` variants
- `.hex-btn-sm`/`lg` size modifiers

**1a precedent:** LandingView used custom `.landing__cta` class (NOT `.hex-btn-primary`) for fine-grained control over hover transform, box-shadow glow, transitions.

**Recommendation: custom `.marketing__cta`** (mirror 1a `.landing__cta` pattern, Lesson #32 convention discovery). ~25-30 lines CSS. Prevents tight coupling to global button system, allows marketing-specific glow/animation.

### 3.3 Marketing class prefix

**1a used `.landing__*`** (BEM with double-underscore: `.landing__hero`, `.landing__cta`, `.landing__footer`, etc.).

**Decision: `.marketing__*` BEM-double-underscore** (semantic match with `MarketingView` component name, mirrors 1a pattern).

**Collision check:** `grep -rn "^\.marketing-\|^\.landing-" src/styles/ src/views/` returns NONE outside LandingView's scoped style. Safe prefix.

**Examples:**
- `.marketing` (root)
- `.marketing__hero`, `.marketing__about`, `.marketing__footer` (sections)
- `.marketing__cta`, `.marketing__logo`, `.marketing__heading`, `.marketing__subtitle`
- `.marketing__hex-pattern`, `.marketing__glow`
- `.marketing__socials`, `.marketing__social-icon`
- `.marketing__footer-link`, `.marketing__footer-sep`

### 3.4 Section block sizing

**Recommendation:**
- **Hero:** `min-height: 100vh` (or `100dvh` for mobile correct viewport) — immersive landing
- **About:** natural-flow content height (~400-500px) — content-driven
- **Footer:** natural-flow (~150-200px) — minimal

Total page height: ~1.4-1.6 viewports of scrollable content. Smooth scroll between Hero and About via natural overflow.

---

## 4. UI Infrastructure Dependencies

### 4.1 Vuex bindings

| Item | Path | Notes |
|---|---|---|
| Auth getter | `master/getLoginState` (verified S1.1) | NOT needed in 8b component if Option A (beforeEnter handles) |
| Other state | NONE | Marketing surface mostly static |

### 4.2 Composables

| Composable | Source | Use |
|---|---|---|
| `useRouter` | `vue-router` | Play CTA push to `/auth/signup` |
| `useStore` | `vuex` | NOT needed if Option A (no in-component auth check) |
| `useDocumentMeta` | inline in `src/composables/useDocumentMeta.js` (NEW) | SEO meta tags onMount/onUnmount |
| `useIntersectionObserver` | `@vueuse/core` (installed) | Fade-in on scroll for About/Footer sections |

### 4.3 Asset dependencies

| Asset | Path | Status |
|---|---|---|
| Logo | `src/assets/images/hexlash-logo.jpg` | ✓ exists (1a inheritance) |
| Telegram icon | `src/assets/images/icon_telega.svg` | ✓ exists |
| X (Twitter) icon | `src/assets/images/icon_x.svg` | ✓ exists |
| YouTube icon | `src/assets/images/icon_yout.svg` | ✓ exists |
| Discord icon | `src/assets/images/icon_disc.svg` | ✓ exists |
| Instagram icon | `src/assets/images/icon_insta.svg` | ✓ exists |
| Hex pattern | pure CSS — no asset | Decision #5 |
| Ring screenshot | NOT in 8b — deferred to 8c | Decision (out of scope) |
| Favicon | `public/favicon.ico` + `public/favicon.svg` | ✓ exists |
| og:image | use logo or composed banner (TBD) | Phase 1 decision |

### 4.4 Routing change

| File:Line | Current | Post-8b |
|---|---|---|
| `src/router/index.js:42` | `component: () => import("/src/views/LandingView.vue")` | `component: () => import("/src/views/MarketingView.vue")` |
| `src/router/index.js:43-50` | beforeEnter (cascade authed → /play) | UNCHANGED (preserved verbatim) |
| Route name | `'Home'` | UNCHANGED (decision #1 mandate, mirrors 8a route name preservation pattern) |

**Single line edit in router.** Plus deletion of LandingView.vue per decision #13.

---

## 5. Vocabulary Alignment Audit

### 5.1 Component name

**`MarketingView.vue`** ✓ (decision #1).

**Collision check:** No existing `*Marketing*` files. Safe.

### 5.2 Section components — inline vs separated

**Recommendation: Inline single-file for 8b.**

Rationale:
- 8b scope is 3 sections (Hero + About + Footer), ~300-400 lines total
- 1a precedent: single `LandingView.vue` file with all content (238 lines)
- Easier review + simpler commit history
- No file scaffolding overhead
- Refactor to separated components in 8c if/when complexity warrants (5+ more sections)

### 5.3 CSS class naming

`.marketing__*` BEM-double-underscore (matches 1a `.landing__*` pattern).

Full taxonomy:
- Root: `.marketing`
- Glow accent: `.marketing__glow`
- Hex pattern: `.marketing__hex-pattern`, `.marketing__hex-pattern-svg`
- Hero: `.marketing__hero`, `.marketing__logo`, `.marketing__cta`
- About: `.marketing__about`, `.marketing__heading` ("NEVER GIVE UP"), `.marketing__subtitle` ("Train. Fight. Rise.")
- Footer: `.marketing__footer`, `.marketing__footer-link`, `.marketing__footer-sep`, `.marketing__socials`, `.marketing__socials a`, `.marketing__social-icon`

### 5.4 Route name preserved

`Home` — unchanged from 1a. Only `component:` field changes. Per decision and route name preservation pattern (8a precedent).

---

## 6. Semantic Invariant + Flow Direction

### 6.1 Anonymous → Game flow

```
/ → MarketingView renders (Hero + About + Footer)
  → Play CTA click → router.push('/auth/signup')
  → SignupView (1b) → master/register success
  → router.push('/') → / beforeEnter → /play (8a cascade)
  → V2Pit hub
```

**Verified preserved.** Same as 1a behavior — only Hero rendering changes (logo + Play CTA + hex pattern instead of logo + tagline + Play + 5 socials).

### 6.2 Authed direct URL flow

```
hexlash.com/ (authed) → / beforeEnter → /play (8a cascade)
  → V2Pit hub
```

**MarketingView NEVER renders for authed users** (beforeEnter intercepts). Same as 1a. Preserved.

### 6.3 Mid-scroll Play repeat

**Decision: Play CTA in Hero ONLY (top of page).**

Rationale:
- Per ТЗ decision #2: "Logo + Play CTA only — NO tagline text" → Hero is laser-focused on Play
- About section purely "NEVER GIVE UP" + "Train. Fight. Rise." text — no CTA (decision #3 explicit content)
- Footer has only social/legal links (decision #4) — no Play CTA repetition
- Users scrolling past Hero who want to play scroll back up OR click logo (smooth-scroll to top via native CSS)
- **Intentional UX:** minimal CTA repetition, single conversion target = focus

### 6.4 Footer link targets

| Link | Target route | Status |
|---|---|---|
| Privacy | `/privacy` → PrivacyView | ✓ exists, public, unchanged |
| Rules | `/rules` → PageView (i18n rules page) | ✓ exists, public, unchanged |
| Help | `/help` → cascade redirect → `/play/help` (post-8a) | ⚠️ `/help` is in `protectedRoutes` — anonymous users hit auth gate, redirect to `/auth/login` |
| 5 social icons | `href="#"` placeholder | ✓ decision #4 |

**Help link UX caveat:** Footer Help link clicked by anonymous user → cascade through protectedRoutes → unauth → redirect to Login. Slightly clunky UX (user expected info page, gets login form). Same as 1a behavior — NOT a 8b regression.

If user wants better UX (Help accessible to anonymous), refactor needed:
- Option (a) Move `/help` from protectedRoutes to publicRoutes (Stream 1 cleanup or Stream 4 polish)
- Option (b) Keep current behavior (8b honors decision #4 "footer links unchanged from 1a")

**Recommendation: Option (b)** — preserve 1a behavior verbatim. Help-anonymous-access refactor is separate scope.

### 6.5 SEO meta tags

**Recommended set for MarketingView:**

```html
<!-- Title (visible in browser tab + Google SERP) -->
<title>Hexlash — The Underground Web3 Arena</title>

<!-- Meta description (Google SERP snippet) -->
<meta name="description" content="Train your AI agent. Fight in the underground octagon. Card-based combat meets Web3.">

<!-- Open Graph (Facebook, LinkedIn, Telegram, Discord cards) -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://hexlash.com/">
<meta property="og:title" content="Hexlash — The Underground Web3 Arena">
<meta property="og:description" content="Train your AI agent. Fight in the underground octagon. Card-based combat meets Web3.">
<meta property="og:image" content="https://hexlash.com/<og-image-path>">

<!-- Twitter card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://hexlash.com/">
<meta name="twitter:title" content="Hexlash — The Underground Web3 Arena">
<meta name="twitter:description" content="Train your AI agent. Fight in the underground octagon. Card-based combat meets Web3.">
<meta name="twitter:image" content="https://hexlash.com/<og-image-path>">

<!-- Canonical URL -->
<link rel="canonical" href="https://hexlash.com/">
```

**Decision needed for design-Claude (Phase 1 ТЗ):**

| Question | Options |
|---|---|
| Title text | "Hexlash — The Underground Web3 Arena" (recommended) OR alternative |
| Description | Above suggested text OR alternative (max 160 chars for Google snippet best practice) |
| og:image | (a) Use `hexlash-logo.jpg` directly (current 1a inheritance — but typically ~1024x1024 logo, not optimal 1200x630 OG dimensions) (b) Use composed banner image (NEW asset needed from user) |

**Recommendation:** title + description ✅ above values. og:image: defer to Phase 1 — either accept logo as placeholder OR request user to provide 1200x630 banner asset.

---

## SUMMARY — Readiness Assessment

### Сложность ТЗ
**M** (medium). Concentrated in:
- 1 NEW component file (`src/views/MarketingView.vue`, ~350-450 lines incl. styles)
- 1 NEW composable (`src/composables/useDocumentMeta.js`, ~30-50 lines)
- 1 router file (single line edit)
- 1 file to delete (`src/views/LandingView.vue`, 238 lines)
- ~0 backend changes
- ~0 Vuex changes
- ~0 i18n changes (inline EN per decision)

### Estimated functional commits
**5-6 functional + 3 closure.**

Suggested cluster ordering:

| Cluster | Commits | Purpose |
|---|---|---|
| **A — Scaffold + composable** | 1-2 | NEW `MarketingView.vue` skeleton (template + script setup, basic 3-section layout) + `useDocumentMeta.js` composable |
| **B — Hero section** | 1 | Logo + Play CTA + hex pattern animation (CSS SVG) + pink glow accent + `min-height: 100vh` |
| **C — About section** | 1 | "NEVER GIVE UP" heading + "Train. Fight. Rise." subtitle + IntersectionObserver fade-in |
| **D — Footer section** | 1 | Privacy / Rules / Help links + 5 social icons + `useDocumentMeta` SEO tags wired |
| **E — Router + cleanup** | 1 | router/index.js single line edit (LandingView → MarketingView) + DELETE LandingView.vue + final smoke verify |

### Open questions for design-Claude

1. **Component organization** — inline single-file (recommended) OR section components from start? (Phase 0 §5.2 Option A vs B)
2. **og:image asset** — use `hexlash-logo.jpg` placeholder OR request 1200x630 banner asset from user?
3. **og:description copy** — "Train your AI agent. Fight in the underground octagon." OR alternative?
4. **Hex pattern animation tempo** — subtle (0.05 opacity at peak, 8-12s pulse) OR more visible (0.15 opacity, 4-6s pulse)?
5. **Footer Help anonymous-access UX** — preserve 1a clunky behavior (recommend) OR refactor `/help` to publicRoutes (out of 8b scope)?
6. **Hero CSS implementation depth** — full hex pattern + glow + animations in 8b OR scaffold-only-with-static-bg (Phase 1 hero is heaviest commit)?
7. **Cluster ordering** — A/B/C/D/E as above OR finer/coarser split?

### Risks identified

| Risk | Severity | Mitigation |
|---|---|---|
| Hex pattern CSS performance on low-end mobile | LOW | Pure CSS animations are GPU-accelerated; subtle opacity/transform only; no JS overhead |
| og:image dimensions (logo 1024x1024 vs ideal 1200x630) | LOW | Placeholder acceptable — image still displays in social cards, just not optimally cropped. User can provide proper banner later. |
| MarketingView.vue file size (>400 lines if all 3 sections + styles inline) | LOW | Acceptable for 8b scope. Refactor to components in 8c if needed. |
| `useDocumentMeta` composable cleanup on unmount | MEDIUM | Critical: must restore previous title + remove added meta tags onBeforeUnmount, otherwise navigation away from `/` leaves stale Hexlash meta tags on game routes. Test verify in Phase 1. |
| `@vueuse/core useIntersectionObserver` cleanup | LOW | `useIntersectionObserver` returns `stop()` function; auto-cleanup on unmount via Vue lifecycle. Safe pattern. |
| Lesson #43 STEP 0 — already triggered (11th occurrence) | RESOLVED | User authorized branch switch; Stream 1 formalization deferred per scope discipline |
| Help anonymous-access UX confusion | LOW | Pre-existing 1a behavior, not 8b regression |

### Pre-edit blockers

**NONE.** All paths verified, all assets present, all decisions locked pre-Phase-1.

### Major decisions for design-Claude review

1. **Hex pattern animation approach (CSS / Three.js / SVG)** — RECOMMEND **pure CSS animated SVG pattern** (Phase 0 §2.2). Lighter, GPU-accelerated, easier to maintain.
2. **Section component pattern (inline / separated)** — RECOMMEND **inline single-file MarketingView.vue** for 8b scope (Phase 0 §2.3 + §5.2). Refactor to separated in 8c if needed.
3. **SEO meta tag library decision** — RECOMMEND **Option B (manual `useDocumentMeta` composable, ~30-50 lines)** — no new dependency, sufficient for single-route SEO (Phase 0 §2.6).
4. **Play CTA strategy** — RECOMMEND **Option A (preserve 1a pattern, single push to /auth/signup)** — beforeEnter handles authed cascade, no in-component auth check needed (Phase 0 §1.4).

---

## Bonus Findings (not in 6-subsection scope)

1. **`@vueuse/core` package** is installed. Has `useIntersectionObserver` standard composable. Use it for fade-in on scroll instead of building native IO wrapper.

2. **Existing keyframes reusable for marketing fade-in:** `hex-fade-in`, `hex-pulse-opacity`, `hex-glow-pulse`, `hex-float-up` — defined globally in `hexlash-ui.css`. Marketing surface can reference these via `animation: hex-fade-in 0.6s ease-out;` syntax.

3. **No `<meta property="og:*">` or `<meta name="twitter:*">` in `index.html`.** Currently bare title + viewport only. 8b adds full SEO + OG + Twitter card via `useDocumentMeta` composable.

4. **`document.title` static "Hexlash"** at index.html:32 — composable will dynamically replace this on `/` mount, restore on unmount.

5. **1a LandingView.vue:** 238 lines, scoped style with `.landing__*` BEM, Vue 3 composition API. Per decision #13, DELETE in 8b after MarketingView replaces. Git history preserves 1a for reference.

6. **Phase 1 cluster sizing assumption:** Hero is heaviest (~150 lines: hex pattern SVG + animation + Play CTA glow + responsive). About is medium (~80 lines: heading + subtitle + IntersectionObserver fade-in). Footer is lightest (~70 lines: 3 legal links + 5 socials + responsive). Total ~300-400 lines incl. inline styles.

7. **Stream 1 carry-over from 8a (Lesson #43 formalization)** — confirmed deferred per user direction in this session. NOT bundled into 8b scope. Tracked as separate Stream 1 cleanup item.
