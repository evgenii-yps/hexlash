# Handoff — Эпик 8 Marketing Site (NEW direction)

**Status:** Awaiting fresh chat session for Phase 0 investigation
**Predecessor:** Sub-epic 1b ✅ CLOSED on `claude/investigate-auth-views-redesign-rFAwk` (final commits: `dbff6d2` CL1 + `6d89065` CL2 + this CL3). Final continue stack PR pending user merge.
**Branch:** Эпик 8 starts on **fresh branch from main** post-1b merge (mirror 1a→1b transition pattern)
**Type:** Major scope shift — full marketing landing site replacing minimal Sub-epic 1a LandingView

---

## 1. Decision Context

**User product-pivot during/after Sub-epic 1b execution:**

Sub-epic 1a (closed earlier 2026-05-06, PR #360) shipped a **minimal MVP landing card** — centered hero (logo + tagline + single CTA "Start Fighting") + 5 social links + thin footer. Adequate for "anonymous users see something before sign-up" goal.

**Post-1a user feedback:** "не так круто как концепт" (during 1b G2 visual review). User then directed product expansion to **full long-form marketing site** matching reference style (clashofcoins.com — 8-10 sections, gameplay screenshots/video, roadmap, partner logos, token info, subscribe form).

**Эпик 8 mandate:** REPLACE `src/views/LandingView.vue` (current 238-line MVP) with new long-form marketing experience. NOT extend. NOT polish. Full rewrite under same `/` route, same `beforeEnter` cascade pattern (anonymous → see site, authed → redirect to `/v2`).

---

## 2. Scope — 8-10 Sections

Reference: clashofcoins.com style. Sections envisioned:

| # | Section | Content (TBD per user inputs) |
|---|---|---|
| 1 | Hero | Logo + main tagline + primary CTA → `/auth/signup`. Background hero visual (image or video poster). Maybe wallet connect secondary CTA |
| 2 | About | "What is Hexlash" — 2-3 paragraphs + key features (3-5 bullets) |
| 3 | Token | "HXL token" — placeholder "Coming soon" if token name + Base contract address not finalized. When ready: tokenomics summary, contract link, listing date countdown |
| 4 | Gameplay | Screenshots and/or embedded video showcase. PvE / PvP / Club Mode / Training previews |
| 5 | Roadmap | Phased milestones (placeholder "Coming soon" if not finalized — design wireframe with TBD content) |
| 6 | Partners | Partner/integration logos (placeholder "Coming soon" if no partners yet — wireframe grid) |
| 7 | Subscribe | Email subscribe form (placeholder backend — could integrate Stream 5 if email infra exists, OR mailchimp/substack iframe, OR plain "Coming soon") |
| 8 | Community | Social channels (existing 5 socials from 1a + maybe Discord embed widget) |
| 9 | FAQ (optional) | 5-10 common questions accordion |
| 10 | Footer | Privacy / Rules / Help links + copyright + maybe sitemap |

**Final section count flexible** — Phase 0 should narrow scope based on available content + user priority.

---

## 3. Required from User Before Phase 0

User inputs needed to unblock Phase 0:

**3.1 Visual assets:**
- [ ] Hero visual (image OR video — if video, also poster image for mobile fallback)
- [ ] Gameplay screenshots (3-5 minimum) — PvE fight, PvP fight, training (heavy bag), club roster, agent detail
- [ ] OPTIONAL: Gameplay video (60-120 sec demo reel — youtube embed or self-hosted .mp4)
- [ ] Partner logos (if any partners ready — otherwise wireframe placeholder)

**3.2 Copy:**
- [ ] **Tagline confirmation** — current is "The underground Web3 arena" (1a Landing). KEEP or replace?
- [ ] About section copy (2-3 paragraphs)
- [ ] Key features (3-5 bullets — e.g., "Card-based combat", "AI Coach", "Web3 native", "Cross-platform mobile + Telegram WebApp + Web", "ELO ranked PvP")
- [ ] FAQ Q&A (if FAQ section included)
- [ ] OR delegate copywriting to design-Claude with user review

**3.3 Token info (decision blocker):**
- [ ] Token name (e.g., "HXL", "HEX")
- [ ] Base contract address (when deployed) — OR confirm placeholder "Coming soon" for v1
- [ ] Listing date / countdown timer target

**3.4 Social URLs:**
- [ ] Discord invite URL (current Landing 1a uses placeholder `#`)
- [ ] X (Twitter) profile URL
- [ ] Telegram channel URL (current `https://t.me/hexlash` — confirm or update)
- [ ] YouTube channel URL
- [ ] Instagram URL
- [ ] OPTIONAL: Reddit, Medium, etc.

**3.5 Roadmap (optional in v1 — placeholder OK):**
- [ ] Q1 2026 milestones
- [ ] Q2 2026
- [ ] Q3 2026
- [ ] Q4 2026
- OR placeholder wireframe with "Coming soon" labels

**3.6 Subscribe backend (decision):**
- [ ] Plain Mailchimp/Substack iframe?
- [ ] Custom backend `POST /v1/subscribe` (would need Stream 3-style BE work)?
- [ ] Or "Coming soon" placeholder for v1?

---

## 4. Phase 0 Investigation Plan (when user provides inputs)

**Mandatory subsections per Эпик 6 retrospective convention:**

1. **API Contract Verification** — any new endpoints (subscribe form? token data API?), reuse existing where possible
2. **Negative-Space Verification** — what doesn't exist (no carousel component? no video player?), confirm assumed primitives
3. **CSS Class Taxonomy** — `.landing-*` namespace from 1a — extend OR new `.marketing-*` prefix? Reuse `.hex-*` design tokens. Mobile breakpoints (current 1a has `@media max-width: 480px`)
4. **UI Infrastructure Dependencies** — Vue 3 ecosystem (transitions, scrolling, intersection observer for fade-in animations?). Vuetify out of scope (KEEP). Routing unchanged (`/` already wired)
5. **Vocabulary Alignment Audit** — "Marketing site" vs "Landing site" — naming drift; "Hero", "About", "Token" — section anchors for nav? scroll-to-section IDs
6. **Semantic Invariant + Flow Direction** — anonymous-only render (existing 1a beforeEnter cascade preserved); CTA flows (Hero CTA → /auth/signup, Subscribe form → backend or 3rd party); responsive behavior (mobile-first vs desktop-first)
7. **NEW for Эпик 8 — Asset Pipeline Verification** — image optimization (mozjpeg/pngquant per existing Vite config), video poster fallback, lazy-load strategy for heavy assets (intersection observer threshold), bundle size impact target (warn if main bundle grows back >2MB)

---

## 5. Architectural Pre-Decisions (suggested for design-Claude)

**Likely locked decisions for fresh chat session:**

| # | Topic | Recommendation |
|---|---|---|
| A | Replace LandingView OR new file | Replace `src/views/LandingView.vue` — same route, same `beforeEnter`, new content. Old 238-line MVP becomes git history reference |
| B | Component structure | Single `LandingView.vue` (long-form scroll) OR section components (`HeroSection.vue` + `AboutSection.vue` etc.)? **Recommend: section components** for maintainability if >5 sections |
| C | CSS namespace | Extend `.landing-*` BEM (1a precedent) OR new `.marketing-*` prefix? **Recommend: extend `.landing-*`** — same surface, evolved scope |
| D | Animations | Vue Transition + intersection observer fade-in OR plain (no animation)? **Recommend: subtle fade-in on scroll** (Vue Transition + IntersectionObserver composable) |
| E | i18n | Inline EN per 1a precedent OR full 11-locale? **Recommend: inline EN for v1** (marketing copy localization is separate workstream) |
| F | Mobile-first vs desktop-first | Current 1a has mobile breakpoint `@media max-width: 480px`. **Recommend: mobile-first** (clamp-based responsive) |
| G | Performance budget | Main bundle SHOULD NOT grow back above 2MB raw post-Эпик 8. Lazy-load gameplay images via intersection observer |
| H | Token section placeholder vs real | If token info not finalized → placeholder section "Token launch coming soon — subscribe for updates". If finalized → tokenomics + contract link + countdown |
| I | Subscribe backend | If user wants real subscribe → Stream 3 integration. Otherwise placeholder or 3rd-party iframe |
| J | SEO meta tags | Add `<title>`, `<meta description>`, `<meta og:image>` etc. Currently 1a has none — Эпик 8 adds at minimum title + description for social sharing |

---

## 6. Streak Carry-In

**Streak: 2** (1a: 1, 1b: 2). Эпик 8 starts at 2.

**Lessons inherited:**
- #11 pre-edit + post-edit grep reflex
- #18 STOP-tier at structural mismatch
- #32 convention discovery (mirror existing patterns where they exist)
- #33 cherry-pick chain — likely N/A for Эпик 8 (FE-only sub-epic, no BE Telegram-style cross-stack work expected unless subscribe form has BE component)
- #43 STEP 0 bootstrap branch verify
- #45 Phase 0 metadata triple-verify

**Hot-fixes counter: 0.** Эпик 8 Phase 0 + Phase 1 should preserve 0-hot-fix track.

---

## 7. Carry-Overs from 1b (NOT Эпик 8 scope but must coexist)

When Эпик 8 work begins, these remain open in parallel streams:

| Stream | Item |
|---|---|
| Stream 1 cleanup | `master/resetPassword` orphan chain (Vuex action + service function with broken locale refs + getter/mutations + PasswordResetStateModel) |
| Stream 1 cleanup | `master/saveTelegramFlag` + `setIsTelegram` phantom mutation |
| Stream 1 cleanup | `fix/remove-telegram-auth-be` stale remote branch (manual GitHub UI delete) |
| Stream 3 BE | Password reset full backend (email-based, needs SMTP infra) |
| Stream 4 Visual Polish | Auth refinement (concept screenshot match — could overlap with Эпик 8 if visual style alignment desired) |
| Stream 6 Web3 | Connect Wallet real backend (SIWE) |
| Production env | `TELEGRAM_BOT_TOKEN` env var removal from Railway (manual post-deploy cleanup, no urgency) |

**Coordination note:** Stream 4 Auth Polish + Эпик 8 Marketing Site share visual direction. Recommend Эпик 8 lock visual concept first, then Stream 4 aligns auth surface to match.

---

## 8. Files Inherited (post-1b state, post-final-merge)

### Live (do not modify in Эпик 8 unless scope says so)
- `src/views/LandingView.vue` — 238 lines, 1a MVP (Эпик 8 REPLACES)
- `src/views/AuthLayoutView.vue` — 1b shell
- `src/views/auth/LoginView.vue` + `SignupView.vue` — 1b forms
- `src/router/index.js` — `/` beforeEnter cascade (1a)
- `src/App.vue` — `isMarketingRoute` covers `/` + `/auth/*` (1b interrupt fix; if Эпик 8 keeps `/` as marketing surface, no change needed)
- `src/styles/hexlash-ui.css` — `--hex-*` design tokens

### Deleted (1b — context for Эпик 8 not to recreate)
- `src/views/RainView.vue` (1212 lines)
- 4 legacy auth fragments (Login.vue, Signup.vue, Reset.vue, TelegramLogin.vue)
- 11+ RainView assets
- 3 npm packages (kokomi.js, postprocessing, gsap)

---

## 9. Phase 0 Entry Conditions

**Before starting Эпик 8 Phase 0:**

1. [ ] User merges final 1b continue stack PR (small-scope: C9+C10+CL1+CL2+CL3) to main
2. [ ] User provides minimum required inputs (§3.1 visual assets + §3.2 tagline + §3.4 social URLs at least)
3. [ ] User confirms decision matrix (§5 A-J recommendations OR overrides)
4. [ ] User decides on token section approach (§3.3 — real or placeholder)
5. [ ] Fresh chat session opened with this handoff doc as context
6. [ ] New branch created from latest main (mirror 1a→1b pattern: `claude/<harness-suffix>-marketing-site` or similar)

---

## 10. Quick Reference — Sub-epic 1b SHA Chain

For reference when reviewing 1b history or confirming what's on main:

```
965d3c2  docs: Phase 0 investigation report
34b96ef  C1: AuthLayoutView wrapper component
a4e4969  C2: Wire /auth/* routes to AuthLayoutView                [G1]
ab9a805  C3: Migrate Login form to new design
b67c9a9  C4: Migrate Signup form to new design
e65ecfc  C5: Remove /auth/reset route and Reset form              [G2]
547e6ff  fix: hide App.vue Logo on /auth/* routes                 [interrupt]
316fd7b  refactor: re-wire isTelegram flag setter to App.vue      [interrupt]
c3eee1b  C6: Remove Telegram login route and views (FE)
0c77ce9  C7: Remove Telegram auth locale keys (i18n)
b76aa07  C8: Remove Telegram auth endpoints and helpers (BE)      [G3]
00daa63  C9: Delete RainView.vue and unused packages
bcbf6a8  C10: Remove orphan locale keys + final cleanup sweep     [G4]
dbff6d2  CL1: CLAUDE.md sync — Sub-epic 1b closure
6d89065  CL2: Final report
<TBD>    CL3: Handoff to Эпик 8 Marketing Site                    [this commit]
```

**Merged via 2 PRs to main:**
- PR #361 (commit `59179e6` on main, 2026-05-06T10:49Z) — C1-C5
- PR #362 (TBD commit) — interrupt fixes + C6+C7+C8 (after G3 + Railway smoke test)
- Final small-scope PR (TBD) — C9+C10+CL1+CL2+CL3

---

**END OF HANDOFF.**

Fresh chat session: load this doc as context, gather user inputs §3, lock decisions §5, run Phase 0 investigation §4, then proceed to Phase 1 ТЗ.
