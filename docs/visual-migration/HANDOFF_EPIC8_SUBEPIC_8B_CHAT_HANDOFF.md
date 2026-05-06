# Handoff — Sub-epic 8b: Marketing Site Cluster A (Hero + About + Footer + scaffold)

**Status:** Awaiting fresh chat session for Phase 0 investigation
**Predecessor:** Sub-epic 8a ✅ CLOSED on `claude/investigate-v2-to-play-migration-UNlMW` (final commits: `6786e39` CL1 + `7d067bb` CL2 + this CL3). Final continue stack PR pending user merge.
**Branch:** Sub-epic 8b starts on **fresh branch from main** post-8a merge (mirror 1a→1b→8a transition pattern)
**Type:** Marketing site Phase 1 — initial scaffold + first 3 sections (Hero, About, Footer)

---

## 1. Decision Context

**Эпик 8 product pivot** (recap from 1b CL3 + 8a Phase 0):

User directed product expansion from minimal MVP landing (Sub-epic 1a) to full long-form marketing site matching reference style (clashofcoins.com — 8-10 sections, gameplay, roadmap, partners, token info, subscribe form).

**Sub-epic 8a (just closed)** prepared the URL space:
- `/play/*` is now the game
- `/` is now free for the marketing site (currently 1a LandingView MVP — to be replaced by 8b/8c)

**Sub-epic 8b mandate:** REPLACE `src/views/LandingView.vue` (current 238-line MVP) with new long-form marketing experience scaffold + first 3 sections (Hero, About, Footer). Subsequent sub-epics (8c, etc.) add remaining 5-7 sections (Token, Gameplay, Roadmap, Partners, Subscribe, Community, optional FAQ).

**Why split 8b/8c:** marketing site is large scope (~10 sections × ~50-100 lines each + responsive + animations + assets). Single sub-epic risks streak break. Cluster-by-cluster delivery preserves G gate discipline.

---

## 2. Sub-epic 8b Scope

**3 sections + scaffold:**

| Cluster | Section | Content (TBD per user inputs) |
|---|---|---|
| **A — Scaffold** | Layout shell + design tokens | Section components architecture decision (single LandingView.vue OR `src/components/marketing/HeroSection.vue` + `AboutSection.vue` etc.). Mobile-first responsive. Smooth scroll between sections. Background visual treatment. |
| **B — Hero** | Top-of-page hero | Hero visual (image OR video poster), main tagline, primary CTA → `/auth/signup`. Maybe wallet connect secondary CTA. |
| **C — About** | "What is Hexlash" | 2-3 paragraphs + key features (3-5 bullets). Possibly visual/icon per feature. |
| **D — Footer** | Page footer | Privacy / Rules / Help links + social icons + copyright. Likely sitemap if multi-section nav from Hero used. |

**Other 5-7 sections deferred to 8c:** Token (Coming soon placeholder if not finalized), Gameplay (screenshots/video), Roadmap (Coming soon placeholder), Partners (Coming soon placeholder), Subscribe (form OR placeholder), optional FAQ, Community (social channels, possibly Discord embed).

**Out of 8b scope:**
- Section anchors / nav menu (defer until all sections exist)
- Token info finalized content (placeholder OK)
- Subscribe backend (placeholder OR Mailchimp/Substack iframe — defer decision)
- Animations beyond Vue Transition fade-in (sophistication adds in 8c+)

---

## 3. Required from User Before 8b Phase 0

**3.1 Visual assets:**
- [ ] **Hero visual** — image OR short video. If video: poster image for mobile fallback. Per 1b G2 review user feedback: "background blur fighters image" was concept reference. Surface decision: provide blurred fighters image OR alternative hero visual?
- [ ] OPTIONAL: hero video (30-60 sec demo reel — youtube embed or self-hosted .mp4)

**3.2 Copy:**
- [ ] **Tagline confirmation** — current 1a LandingView uses "The underground Web3 arena". KEEP or replace?
- [ ] **About section copy** — 2-3 paragraphs answering "What is Hexlash?". Tone: gritty / underground vibe per 1a aesthetic.
- [ ] **Key features (3-5 bullets)** — examples:
  - "Card-based combat — strategy meets reflex"
  - "AI Coach (Claude) post-fight analysis"
  - "Web3 native — Base chain, ERC-1155 NFT agents"
  - "Cross-platform — Web + Telegram WebApp + Mobile"
  - "ELO-ranked PvP + auto-fighting agents (Club Mode)"

OR delegate copywriting to design-Claude with user review at G gates.

**3.3 Social URLs:**

Current 1a LandingView uses `href="#"` placeholders for all 5 social icons. For 8b Footer:
- [ ] Telegram channel URL (current placeholder; community channel separate from auth removal in 1b)
- [ ] X (Twitter) profile URL
- [ ] YouTube channel URL
- [ ] Discord invite URL
- [ ] Instagram URL

If real URLs not ready → keep placeholder `#` for 8b, update in 8c when ready.

**3.4 Visual concept refinement (carry-over from 1b G2 review):**
- [ ] Layout proportions tighter than 1a MVP (per user feedback "не так круто как концепт")
- [ ] Possible red CTA color variant instead of pink
- [ ] Background blur fighters image as hero
- [ ] OR alternative concept screenshot reference (provide image)

---

## 4. Phase 0 Investigation Plan (when user provides inputs)

**Mandatory subsections per Эпик 6 retrospective + 7 sub-epic precedent (5 prior + 6th NEW for asset pipeline):**

1. **API Contract Verification** — Subscribe form backend? (defer to 8c) / token data API? / image/video CDN?
2. **Negative-Space Verification** — what doesn't exist (carousel? video player? scroll-anchor library? IntersectionObserver utility?)
3. **CSS Class Taxonomy** — `.landing-*` namespace from 1a — extend OR new `.marketing-*` prefix? `.app-v2` decoupling pattern from 8a applies here too (CSS class != URL).
4. **UI Infrastructure Dependencies** — Vue 3 ecosystem (Transition + IntersectionObserver composable). Vuetify out of scope. Routing: `/` route reuses 1a `beforeEnter` (anonymous → render, authed → cascade to `/play` per 8a).
5. **Vocabulary Alignment Audit** — "Marketing site" vs "Landing page" — consistent naming. Section anchor IDs (e.g. `#hero`, `#about`).
6. **Semantic Invariant + Flow Direction** — anonymous-only render (1a beforeEnter cascade preserved post-8a → `/play`). Hero CTA → `/auth/signup`. Footer Privacy/Rules/Help links → existing legacy paths.
7. **NEW for Эпик 8 — Asset Pipeline Verification** — image optimization (existing Vite mozjpeg/pngquant config), video poster fallback strategy, lazy-load via IntersectionObserver, bundle size impact target (warn if main bundle grows back >2MB raw post-1b reduction).

---

## 5. Architectural Pre-Decisions (suggested for design-Claude review)

| # | Topic | Recommendation |
|---|---|---|
| A | Replace LandingView OR new file | **Replace** `src/views/LandingView.vue` — same route, same `beforeEnter`, new content. Old 238-line MVP → git history reference. |
| B | Component structure | **Section components** (`src/components/marketing/HeroSection.vue` + `AboutSection.vue` + `FooterSection.vue` etc.) — easier maintenance for future 8c additions |
| C | CSS namespace | **Extend `.landing-*`** BEM (1a precedent) — same surface, evolved scope. `.landing__hero`, `.landing__about`, `.landing__footer` etc. |
| D | Animations | **Subtle fade-in on scroll** via Vue Transition + IntersectionObserver composable. Defer sophistication to 8c+. |
| E | i18n | **Inline EN for v1** (1a precedent — marketing copy localization is separate workstream) |
| F | Mobile-first vs desktop-first | **Mobile-first** (clamp-based responsive, existing 1a `@media max-width: 480px` breakpoint pattern preserved) |
| G | Performance budget | **Main bundle SHOULD NOT grow >2.0MB raw / >480KB brotli** (post-1b RainView delete reduced to ~1.82MB / ~479KB). Lazy-load gameplay assets via IntersectionObserver in 8c. |
| H | SEO meta tags | Add `<title>`, `<meta description>`, `<meta og:image>` etc. via Vue Router meta + `useHead` composable OR vue-meta. Currently 1a has none. |
| I | Section anchor URLs | Skip in 8b (defer to 8c when nav menu exists). `/` stays single-route. |
| J | Asset pipeline | Hero image: WebP + JPEG fallback. Video: lazy-load with poster image. Mozjpeg/pngquant pipeline already configured in Vite. |

---

## 6. Streak Carry-In

**Streak: 3** (1a: 1, 1b: 2, 8a: 3). 8b starts at 3.

**Lessons inherited:**
- #11 pre-edit + post-edit grep reflex
- #18 STOP-tier at structural mismatch
- #32 convention discovery (mirror existing 1a `.landing-*` BEM where applicable)
- #33 cherry-pick chain — likely N/A for 8b (FE-only sub-epic, no BE expected unless subscribe form has BE component — defer to 8c regardless)
- #43 STEP 0 bootstrap branch verify (11th occurrence expected — formalization carry-over still pending)
- #45 Phase 0 metadata triple-verify

**Hot-fixes counter: 0.** 8b Phase 0 + Phase 1 should preserve 0-hot-fix track.

---

## 7. Carry-Overs from 8a (NOT 8b scope but coexist)

When 8b work begins, these remain open in parallel streams:

| Stream | Item |
|---|---|
| Stream 1 cleanup | `src/AppV2.vue:24` stale comment ("App.vue v1 mount gated via `!isV2Route` block" — should be `!isPlayRoute` post 8a) |
| Stream 1 cleanup | Comment side-effects in 6 files during 8a C3 sed sweep — collateral correction documented (no debt left, but flag if user wants strict revert) |
| Stream 1 cleanup | **Lesson #43 STEP 0 formalization** — recurring 10-occurrence pattern, formalize as automatic bootstrap procedure in CLAUDE.md methodology section |
| Stream 1 cleanup | `master/resetPassword` orphan chain (1b carry) |
| Stream 1 cleanup | `master/saveTelegramFlag` + `setIsTelegram` phantom mutation (1b carry) |
| Stream 1 cleanup | `fix/remove-telegram-auth-be` stale remote branch (1b carry — sandbox blocked deletion) |
| Stream 3 BE | Password reset full backend (1b carry) |
| Stream 4 Visual Polish | Auth refinement to match concept screenshot (could overlap with 8b if visual style alignment desired — recommend 8b lock visual concept first, then Stream 4 aligns auth surface) |
| Stream 6 Web3 | Connect Wallet real backend SIWE (1b carry) |
| Production env | `TELEGRAM_BOT_TOKEN` Railway cleanup (1b carry, manual post-deploy) |

**Coordination note:** Stream 4 Auth Polish + 8b Marketing Site share visual direction. Recommend 8b lock visual concept first, then Stream 4 aligns.

---

## 8. Files Inherited (post-8a state, post-final-merge)

### Live (DO NOT modify in 8b unless scope says so)
- `src/views/LandingView.vue` — 238 lines, 1a MVP (8b REPLACES)
- `src/views/AuthLayoutView.vue` — 1b shell (no change)
- `src/views/auth/LoginView.vue` + `SignupView.vue` — 1b forms (no change)
- `src/router/index.js` — 8a routing (`/play/*` paths + cascade redirect block, `/` beforeEnter cascade target `/play`)
- `src/App.vue` — 8a `isPlayRoute` computed (no change), `isMarketingRoute` covers `/` + `/auth/*` (1b interrupt fix preserved)
- `src/styles/hexlash-ui.css` — `--hex-*` design tokens

### Existing Landing assets (1a)
- `src/assets/images/hexlash-logo.jpg` (logo for hero)
- `src/assets/images/icon_telega.svg`, `icon_x.svg`, `icon_yout.svg`, `icon_disc.svg`, `icon_insta.svg` (5 social icons)

### Deleted (1b context — for 8b not to recreate)
- `src/views/RainView.vue` (1212 lines)
- 4 legacy auth fragments
- 11+ RainView assets
- 3 npm packages (kokomi.js, postprocessing, gsap)

---

## 9. Phase 0 Entry Conditions

**Before starting 8b Phase 0:**

1. [ ] User merges final 8a continue stack PR (small-scope: 8a 3 functional + 3 closure commits) to main
2. [ ] User provides minimum required inputs (§3.1 hero visual + §3.2 tagline confirmation at minimum)
3. [ ] User confirms decision matrix (§5 A-J recommendations OR overrides)
4. [ ] User decides on Stream 4 coordination (8b first OR Stream 4 first OR concurrent)
5. [ ] Fresh chat session opened with this handoff doc as context
6. [ ] New branch created from latest main (mirror 1a→1b→8a pattern: `claude/investigate-marketing-site-<suffix>` or similar harness slug)

**Lesson #43 reminder (10 prior occurrences):** harness will likely assign fresh slug; if not, manual branch switch required at Step 0. User-authorized procedure documented in CLAUDE.md Stream 1 carry-over (formalization pending).

---

## 10. Quick Reference — Sub-epic 8a SHA Chain

For reference when reviewing 8a history or confirming what's on main:

```
662bc1a  docs(8a): Phase 0 investigation report
9f3ecc9  C1: feat(routing): rename /v2/* paths to /play/* + cascade redirect    [G1]
30c618f  C2: refactor(app): rename isV2Route computed to isPlayRoute            [G2]
f26bf1b  C3: refactor(routing): update internal /v2 push sites to /play         [G3]
6786e39  CL1: docs(8a): CLAUDE.md sync — Sub-epic 8a Migration closure
7d067bb  CL2: docs(8a): final report
<TBD>    CL3: docs(8a): handoff to Sub-epic 8b                                  [this commit]
```

**Continue stack:** `claude/investigate-v2-to-play-migration-UNlMW` (7 commits ahead of main at CL3 push). Final continue stack PR pending user merge.

---

**END OF HANDOFF.**

Fresh chat session: load this doc as context, gather user inputs §3, lock decisions §5, run Phase 0 investigation §4 (7 mandatory subsections incl. NEW Asset Pipeline), then proceed to Phase 1 ТЗ (estimated 4-6 functional commits + 3 closure for 8b Cluster A scope = scaffold + Hero + About + Footer).
