# Sub-epic 8b Final Report — Marketing Site Cluster A

**Status:** ✅ CLOSED
**Branch:** `claude/investigate-marketing-site-rIC7v`
**Type:** New MarketingView replacing 1a LandingView, M size
**Date opened:** 2026-05-06 (post 8a PR #364 merge, same session as 8a closure)
**Date closed:** 2026-05-06 (CL1+CL2+CL3, same day)
**Streak target:** 3 → 4 ✅ achieved (zero hot-fixes, G2 approved with one interrupt fix)

---

## 1. Executive Summary

Replaced 1a LandingView (minimal MVP — logo + tagline + Play + 5 socials) with **long-form MarketingView Cluster A** (Hero + About + Footer + scaffold) per Эпик 8 product pivot to clashofcoins-style marketing site.

**Cluster A scope (8b):** 3 sections + scaffold + SEO composable.
**Cluster B (8c):** 5 remaining sections (Gameplay/Token/Roadmap/Partners/Subscribe).

**Architectural establishment:**
- Inline single-file pattern preserved (Lesson #32 mirror 1a precedent)
- `.marketing-*` BEM CSS namespace adopts `.landing__*` 1a convention
- Pure CSS-SVG hex pattern animation (no Three.js, GPU-accelerated)
- Manual `useDocumentMeta` composable (no `@vueuse/head` dep) — sufficient for single-route SEO

**Hot-fixes:** 0. Streak 3 → 4.

**Notable:** G1 STOP gate deferred to G2 per user direction (atomic visual review at end). Interrupt fix during G2 review removed scroll hint arrow from Hero (user feedback, scope refinement).

---

## 2. Commit Chain

10 commits total (1 Phase 0 + 5 functional + 1 interrupt + 3 closure).

| # | SHA | Type | Description | Gate |
|---|---|---|---|---|
| 0 | `b81145c` | docs | Phase 0 investigation report (6 subsections) | — |
| 1 | `c24cda1` | feat | C1 — MarketingView scaffold + useDocumentMeta composable | — |
| 2 | `5b3fbc4` | feat | C2 — Hero section (logo + Play CTA + hex pattern + glow + scroll hint) | **G1** ✓ deferred |
| 3 | `e81bf46` | feat | C3 — About section (NEVER GIVE UP + IntersectionObserver fade-in) | — |
| 4 | `a14d711` | feat | C4 — Footer (5 socials + links + SEO meta verify) | — |
| 5 | `292aab5` | feat | C5 — router swap (LandingView → MarketingView) + DELETE LandingView.vue | — |
| 6 | `35ab94c` | fix | Interrupt fix — remove scroll hint arrow from Hero (user G2 feedback) | **G2** ✓ |
| 7 | `c228585` | docs | CL1 — CLAUDE.md sync | — |
| 8 | (this) | docs | CL2 — Final report | — |
| 9 | (next) | docs | CL3 — Handoff to Sub-epic 8c | — |

**Merge timeline:** Continue stack `claude/investigate-marketing-site-rIC7v` 8 commits ahead of main (excl. closure docs). Final continue stack PR pending user merge after CL3.

---

## 3. Files

### 3.1 NEW (2)

- `src/views/MarketingView.vue` — 470 lines, inline single-file with 3 sections (Hero + About + Footer) + scoped `<style>` block (~280 lines CSS) + `<script setup>` (~70 lines script + IntersectionObserver logic)
- `src/composables/useDocumentMeta.js` — 70 lines, manual SEO meta tag manipulation. Sets title + description + og:* + twitter:* on mount; restores prev title + removes added tags on unmount. No external dependency

### 3.2 MODIFIED (1)

- `src/router/index.js` — single-line component swap (`LandingView.vue` → `MarketingView.vue`) + 1 inline comment refresh (`Anonymous users see LandingView (1a)` → `Anonymous users see MarketingView (8b — replaces 1a LandingView)`)

### 3.3 DELETED (1)

- `src/views/LandingView.vue` — 238 lines, 1a MVP. Replaced by MarketingView.

### 3.4 Counts

| Metric | Value |
|---|---|
| Files created | 2 (MarketingView.vue + useDocumentMeta.js) |
| Files modified | 1 (router/index.js) |
| Files deleted | 1 (LandingView.vue) |
| Total unique files touched | 4 |
| Lines added | 510 (470 MarketingView + 70 useDocumentMeta − 30 net script imports) |
| Lines deleted | 275 (238 LandingView + 37 interrupt fix scroll hint removal) |
| Net delta | +235 lines source code |
| Active `/v2` push targets renamed | 0 (8a scope) |
| CSS files touched | 0 (`.app-v2` global namespace untouched) |
| Backend files touched | 0 |
| Vuex/composable files touched | 0 (composable created in `src/composables/` is NEW dir, not Vuex) |
| i18n files touched | 0 (inline EN per decision) |

---

## 4. Architectural Decisions (12 locked pre-Phase-1)

| # | Topic | Decision | Outcome |
|---|---|---|---|
| 1 | Component name | `MarketingView.vue` | ✓ created, no collision |
| 2 | og:image asset | `hexlash-logo.jpg` placeholder (1024² square) | ✓ wired, proper banner deferred to Stream 4 |
| 3 | og:description | "Hexlash — Web3 fighting game. Train your AI agent. Fight in the underground octagon." (~98 chars) | ✓ under 155 char limit |
| 4 | Hex pattern animation tempo | Slow 60s loop (atmospheric) | ✓ implemented |
| 5 | Help anonymous UX | Preserve 1a behavior (defer fix to Stream 1 if blocking) | ✓ preserved |
| 6 | Hero scaffold depth | Logo + Play CTA + animated scroll hint arrow | Refined during G2 — scroll hint REMOVED via interrupt fix per user feedback |
| 7 | Cluster ordering | A → B → C → D → E (5 clusters), G1 + G2 STOP gates | G1 deferred to G2 (user direction) |
| 8 | Hex pattern technology | Pure CSS animated SVG | ✓ implemented (no Three.js, GPU-accelerated) |
| 9 | Section component pattern | Inline single-file (no separated components) | ✓ implemented |
| 10 | SEO meta library | Manual `useDocumentMeta` composable (no new dep) | ✓ implemented (~70 lines) |
| 11 | Play CTA strategy | Option A — preserve 1a pattern (`router.push('/auth/signup')`) | ✓ implemented |
| 12 | LandingView fate | DELETE in C5 after MarketingView mounted | ✓ deleted |

---

## 5. Architectural Pattern — Marketing Surface

**Established conventions for future 8c expansion:**

| Layer | Convention | Notes |
|---|---|---|
| Component file | `src/views/MarketingView.vue` (single-file inline) | Refactor to `src/components/marketing/Section*.vue` files in 8c if scope warrants |
| CSS namespace | `.marketing-*` (BEM-like, scoped style) | Mirror `.landing__*` from 1a (Lesson #32 convention discovery) |
| Animation tempo | Slow + atmospheric (60s+ loops, subtle pulses) | Decision #4 — non-distracting from Play CTA focus |
| Animation tech | Pure CSS (transforms + opacity, GPU-accelerated) | No Three.js, no animation library — keep bundle lean |
| Section visibility | IntersectionObserver fade-in (one-shot, 30% threshold) | Native API per decision (no `@vueuse/core useIntersectionObserver` for explicit control) |
| SEO management | `useDocumentMeta` composable | Manual approach for single-route SEO; expand if Эпик 8 adds more routes |
| Asset reuse | Logo + 5 social icons inherited from 1a | No new image assets in 8b |
| Auth flow | Preserve 1a beforeEnter cascade (component-level CTA = single push to `/auth/signup`) | Option A per Phase 0 §1.4 |

---

## 6. Lessons Applied

### 6.1 Lesson #11 — pre-edit + post-edit grep on every commit

**5+ catches across C1-C5 + interrupt fix:**

1. **C1 — composables/ directory missing.** Pre-edit `ls -d src/composables/` returned not-found. Created via `mkdir -p src/composables/` before Write. Adaptation-tier per Lesson #35.

2. **C2 — keyframe naming collision risk.** Initial keyframe names `hex-glow-pulse` and `scroll-hint-bounce` would collide with global definitions in `hexlash-ui.css` (Phase 0 §2.2 inventory). Renamed to `marketing-glow-pulse` and `marketing-scroll-bounce` (kept `hex-drift` as it's unique). Lesson #11 + Lesson #32 namespace-isolation pattern.

3. **C3 — IntersectionObserver vs @vueuse/core decision.** ТЗ explicitly chose native API (not `@vueuse/core useIntersectionObserver`). Verified `@vueuse/core` IS in `package.json` but not used in 8b (deferred for clarity per design-Claude direction).

4. **C4 — All 5 social icon assets verified existing.** Pre-edit `ls` confirmed `icon_telega.svg`, `icon_x.svg`, `icon_yout.svg`, `icon_disc.svg`, `icon_insta.svg`. Inherited from 1a (no new assets needed).

5. **C5 — orphan grep after LandingView delete.** Post-edit `grep -rn "LandingView" src/` returned 1 match = own comment marker narrating "...replaces 1a LandingView". False-positive (historical reference, not active code coupling). Lesson #11 false-positive recognition pattern (precedent: 1b/8a similar own-marker matches).

6. **Interrupt fix — scroll hint full removal.** Pre-edit grep identified 5 distinct sites (template div + closing tag + scrollToAbout function + 2 CSS classes + keyframe). Post-edit grep returned 0 orphan refs. `aboutRef` preservation verified (4 references — section binding + script declaration + 2 IntersectionObserver use sites).

### 6.2 Lesson #18 — STOP gates

- **G1 deferred to G2** per user direction (atomic visual review at end, scope discipline preserved)
- **G2 final visual + smoke gate** triggered interrupt fix request (scroll hint removal). Resolved cleanly without scope creep — single-purpose fix commit.

No structural mismatch surfaces, no STOP-tier escalations needed.

### 6.3 Lesson #32 — convention discovery

**Mirror existing patterns where applicable:**

- `.marketing-*` BEM CSS prefix mirrors `.landing__*` 1a precedent (single-section scoped style + BEM modifier convention)
- Inline single-file MarketingView mirrors 1a LandingView pattern (~470 lines vs 1a 238 lines for expanded scope)
- Scroll smooth via native CSS / `scrollIntoView({ behavior: 'smooth' })` — no library
- Keyframe namespace prefix (`marketing-glow-pulse` vs global `hex-glow-pulse`) mirrors namespace-isolation pattern from 1b precedent
- Image asset import via `import logoSrc from '@/assets/...'` mirrors 1a pattern (Vite asset handling)

### 6.4 Lesson #43 — STEP 0 bootstrap branch verify

**11th cumulative occurrence** (5U / 5S / Sub-epic 2 / 4a / 4b / Sub-epic 5 / 6 / 7 / Sub-epic 1b / 8a / 8b). Pattern fully validated. User-authorized Option A switch documented in this session.

**Carry-over to Stream 1 (NOT bundled in 8b per scope discipline):** formalize Lesson #43 as automatic bootstrap procedure in CLAUDE.md methodology section (per user note during 8a Phase 0).

### 6.5 Lesson #45 — Phase 0 metadata triple-verify

Phase 0 inventory cross-checked at every Cluster pre-edit. **No false-positive inventory issues** — Phase 0 §1-§6 findings all matched fresh-grep reality during execution.

Notable: Phase 0 §2.2 keyframe inventory (7 reusable hex-* keyframes in `hexlash-ui.css`) drove C2 namespace-isolation decision (`marketing-*` prefix on new keyframes). Lesson #45 prevented mid-cluster keyframe collision discovery.

---

## 7. Carry-Overs

### 7.1 Sub-epic 8c — Marketing Site Cluster B (NEXT)

**Scope:** 5 remaining sections to complete long-form marketing site.

| Section | Content | Required user input |
|---|---|---|
| Gameplay | Screenshots/video showcase (PvE / PvP / Club Mode / Training previews) | Gameplay screenshots (5-10), optional video |
| Token | "HXL token" — Coming soon placeholder OR tokenomics if finalized | Token name + Base contract address (or placeholder OK) |
| Roadmap | Phased milestones (placeholder OR real) | Roadmap content decision (Coming soon / generic / real) |
| Partners | Partner/integration logos (placeholder OR real) | Partner logos list (or placeholder OK) |
| Subscribe | Email subscribe form | Backend decision (Mailchimp/SendGrid/none) |

**Architectural inheritance from 8b:**
- Inline single-file (refactor to `src/components/marketing/Section*.vue` if section count + complexity warrants)
- `.marketing-*` BEM prefix
- IntersectionObserver fade-in pattern from About
- `useDocumentMeta` composable (already wired in MarketingView script — no changes needed for 8c if title/description stays same)

CL3 handoff documents Phase 0 entry conditions for fresh chat session.

### 7.2 Stream 4 Visual Polish

| Item | Source | Severity |
|---|---|---|
| Proper og:image banner (1200×630 dimensions per Open Graph best practice — currently 1024² square logo placeholder) | Decision #2 + Phase 0 §6.5 | Medium (SEO social-card aesthetics) |
| Hero hex pattern tempo / opacity tuning if user feedback during 8c | Decision #4 acceptance pending real-world feedback | Low |
| Hero ring screenshot (deferred from 8b — could replace hex pattern bg if user prefers) | Decision (Hero replace?) | Low |

### 7.3 Stream 1 cleanup

| Item | Source | Severity |
|---|---|---|
| Help anonymous-access UX caveat (`/help` cascades through `/play/help` which auth-gates anonymous users) | Phase 0 §6.4 + decision #5 | Low (1a inherited behavior, not 8b regression) |
| Lesson #43 STEP 0 formalization — recurring 11-occurrence pattern, formalize as automatic bootstrap procedure in CLAUDE.md methodology section | 1b/8a/8b carry-over | Methodology |
| AppV2.vue:24 stale comment from 8a interrupt fix territory | 8a CL1 carry-over | Cosmetic |
| `master/resetPassword` orphan chain (1b inheritance) | 1b carry-over | Cosmetic |
| `master/saveTelegramFlag` + `setIsTelegram` phantom mutation (1b inheritance) | 1b carry-over | Cosmetic |

### 7.4 Production environment

- `TELEGRAM_BOT_TOKEN` Railway env cleanup (1b inheritance, manual post-deploy)
- `fix/remove-telegram-auth-be` stale remote branch (1b inheritance, sandbox blocked deletion)

---

## 8. SEO Verification Audit

### 8.1 Tags managed by useDocumentMeta on `/` mount

```
title: Hexlash
meta[name="description"]: Hexlash — Web3 fighting game. Train your AI agent. Fight in the underground octagon.
meta[property="og:title"]: Hexlash
meta[property="og:description"]: <same as description>
meta[property="og:image"]: hexlash-logo.jpg (lazy resolved by Vite)
meta[property="og:type"]: website
meta[name="twitter:card"]: summary_large_image
meta[name="twitter:title"]: Hexlash
meta[name="twitter:description"]: <same as description>
meta[name="twitter:image"]: hexlash-logo.jpg
```

### 8.2 Cleanup verification (Lesson #11 risk audit per Phase 0)

- onBeforeUnmount restores prev `document.title` (from index.html static "Hexlash")
- onBeforeUnmount removes only tags created by useDocumentMeta (not pre-existing tags from index.html)
- Navigation `/` → `/auth/signup` → unmount triggers cleanup → `<head>` restored to pre-marketing state
- No leak verified manually pre-G2

### 8.3 Open Graph dimension caveat (carry-over)

Current `og:image` is `hexlash-logo.jpg` (1024² square). Open Graph best practice = 1200×630 (1.91:1 aspect ratio) for optimal social-card display. Logo will display in social cards but not optimally cropped. **Stream 4 polish target:** replace with proper composed banner asset.

---

## 9. Backward Compat Audit

### 9.1 Anonymous flow (verified preserved)

```
hexlash.com/ → MarketingView renders (Hero + About + Footer)
            → Click Play → router.push('/auth/signup')
            → SignupView (1b) → master/register success
            → router.push('/') → / beforeEnter → /play (8a cascade)
            → V2Pit hub
```

### 9.2 Authed direct URL flow (verified preserved)

```
hexlash.com/ (authed) → / beforeEnter → /play (8a cascade)
                     → V2Pit hub
                     → MarketingView NEVER renders for authed users
```

### 9.3 Footer link cascade (verified)

| Link | Target | Current behavior |
|---|---|---|
| Privacy | `/privacy` → PrivacyView | ✓ public, renders |
| Rules | `/rules` → PageView (i18n rules page) | ✓ public, renders |
| Help | `/help` → cascade redirect → `/play/help` | ⚠️ anonymous user hits auth gate, redirect to Login (1a inherited UX, not 8b regression — decision #5 defer fix) |
| 5 socials | `href="#"` placeholder | ✓ no nav, no console error |

### 9.4 Risk surfaces (none materialized)

| Risk | Severity | Status |
|---|---|---|
| Hex pattern CSS perf on low-end mobile | LOW | ✓ GPU-accelerated transform-only animation |
| og:image dimensions (1024² vs 1200×630 ideal) | LOW | ✓ placeholder acceptable, defer to Stream 4 polish |
| MarketingView.vue file size if >400 lines | LOW | ✓ 470 lines acceptable for 8b single-file scope |
| `useDocumentMeta` cleanup on unmount | MEDIUM | ✓ verified — onBeforeUnmount restores prev title + removes added tags |
| Help anonymous-access UX confusion | LOW | ✓ pre-existing 1a behavior, not 8b regression |
| Scroll hint redundant (G2 user feedback) | — | ✓ removed via interrupt fix `35ab94c` (clean — 0 orphan refs) |

---

## 10. Metrics

| Metric | Value |
|---|---|
| Functional commits | 5 (C1-C5) |
| Interrupt fixes | 1 (`35ab94c` scroll hint removal) |
| Closure commits | 3 (CL1/CL2/CL3) |
| Phase 0 commits | 1 |
| Total commits | 10 |
| STOP gates triggered | 1 (G2 final smoke; G1 deferred to G2 per user direction) |
| Lesson #11 catches | 5+ (composables/ dir missing, keyframe collision, native vs library, asset verify, orphan grep, interrupt fix scope) |
| Lesson #18 STOP-tier triggers | 0 (G2 manual smoke triggered scope refinement, not regression) |
| Lesson #45 metadata discrepancies | 0 (Phase 0 inventory matched fresh-grep reality) |
| **Hot-fixes** | **0** ✅ |
| Streak | 3 → **4** ✅ |
| Files modified/created/deleted | 4 unique (2 NEW + 1 MODIFIED + 1 DELETED) |
| Lines added | 510 (NEW files) + 100 (CLAUDE.md) |
| Lines deleted | 275 (LandingView + interrupt fix scroll hint) |
| Net delta source | +235 lines |
| Net delta with docs | +335 lines |
| CSS files touched | 0 (`.app-v2` decoupled per 8a) |
| Backend files touched | 0 |
| Vuex files touched | 0 |
| i18n files touched | 0 |
| Bundle impact | ~neutral (MarketingView lazy chunk replaces LandingView lazy chunk) |
| Production deploy mechanism | Continue stack PR merge (incremental pattern from 1b workflow); backend untouched, no Railway redeploy concerns |

---

## 11. Closure Notes

**Sub-epic 8b ✅ CLOSED.**

All 12 architectural decisions honored, all carry-overs documented, G2 final smoke approved (with one clean interrupt fix during review).

**Architectural pattern established:** Marketing Surface conventions (BEM + inline single-file + pure CSS animation + `useDocumentMeta` SEO + IntersectionObserver fade-in) — future Sub-epic 8c (and any further marketing surface work) inherit this pattern as design baseline.

**Production deploy:** Continue stack `claude/investigate-marketing-site-rIC7v` ahead of main. User merges via standard PR (incremental continue stack pattern from 1b workflow). Backend untouched — no Railway redeploy concerns. Frontend Vercel preview validated at G2.

**Next:** Sub-epic 8c — Marketing Site Cluster B (Gameplay + Token + Roadmap + Partners + Subscribe). CL3 handoff documents required user inputs and Phase 0 entry conditions.

**Branch state:** `claude/investigate-marketing-site-rIC7v` HEAD = CL2 commit (this report). Ready for CL3 handoff push, then final continue stack PR merge to main at user convenience.
