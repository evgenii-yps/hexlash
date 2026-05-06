# Handoff — Sub-epic 8c: Marketing Site Cluster B (Gameplay + Token + Roadmap + Partners + Subscribe)

**Status:** Awaiting fresh chat session for Phase 0 investigation
**Predecessor:** Sub-epic 8b ✅ CLOSED on `claude/investigate-marketing-site-rIC7v` (final commits: `c228585` CL1 + `9c987dc` CL2 + this CL3). Final continue stack PR pending user merge.
**Branch:** Sub-epic 8c starts on **fresh branch from main** post-8b merge (mirror 1a→1b→8a→8b transition pattern — 12th Lesson #43 STEP 0 occurrence anticipated)
**Type:** Marketing site Phase 2 — 5 remaining sections + section nav + scroll anchor URLs (optional)

---

## 1. Decision Context

**Эпик 8 product pivot recap** (carried from 1b CL3 + 8a CL3 + 8b CL3):

User directed product expansion from minimal MVP landing (Sub-epic 1a) to full long-form marketing site matching reference style (clashofcoins.com — 8-10 sections).

**Sub-epic 8a (closed)** prepared URL space (`/play/*` for game, `/` free for marketing).

**Sub-epic 8b (just closed)** delivered Marketing Cluster A — first 3 sections + scaffold:
- Hero (logo + Play CTA + animated hex pattern + glow)
- About (NEVER GIVE UP + fade-in)
- Footer (5 socials + Privacy/Rules/Help)
- + `useDocumentMeta` composable for SEO meta tags
- + `.marketing-*` BEM CSS namespace established
- + Inline single-file MarketingView pattern (470 lines)

**Sub-epic 8c mandate:** ADD 5 remaining sections to MarketingView between About and Footer:
- Gameplay (screenshots/video showcase)
- Token (HXL token info OR Coming soon placeholder)
- Roadmap (phased milestones OR placeholder)
- Partners (partner logos OR placeholder)
- Subscribe (email form OR Coming soon)

**Why split 8b/8c:** Marketing site is large scope (~10 sections × ~80-150 lines each + responsive + animations + assets). Single sub-epic risked streak break. Cluster-by-cluster delivery preserves G gate discipline. 8b validated architectural pattern; 8c repeats pattern for 5 more sections with content variability.

---

## 2. Sub-epic 8c Scope

**5 sections + optional nav scaffolding:**

| Cluster | Section | Content (depends on user inputs §3) | Visual treatment |
|---|---|---|---|
| **A** | Gameplay | Screenshots OR video. PvE / PvP / Club Mode / Training previews | Image grid OR video player + IntersectionObserver fade-in |
| **B** | Token | "HXL token" — placeholder "Coming soon — subscribe for updates" if not finalized; tokenomics + contract link if finalized | Centered text + optional countdown timer |
| **C** | Roadmap | Phased milestones (Q1/Q2/Q3/Q4 2026) — placeholder OR real | Timeline visual (vertical or horizontal cards) |
| **D** | Partners | Partner/integration logos — placeholder grid OR real | Logo grid with desaturated → color hover |
| **E** | Subscribe | Email subscribe form — Mailchimp/Substack iframe OR Coming soon placeholder OR custom backend | Form + "Coming soon" fallback |
| **F (optional)** | Section nav | Scroll-to-section anchor URLs (`/#hero`, `/#about`, `/#gameplay`, etc.) + sticky top nav menu | If user wants navigation between sections |

**Out of 8c scope:**
- FAQ section (optional in original 8b plan, defer if user wants)
- Token launch countdown UI (defer if token not finalized)
- Subscribe backend implementation (Stream 3 if custom BE chosen)
- Refactor MarketingView.vue to separated section components (only if line count > 700)

---

## 3. Required from User Before 8c Phase 0

**3.1 Visual assets:**

- [ ] **Gameplay screenshots** — 5-10 minimum. Suggested:
  - PvE fight screenshot (CardFightView in action)
  - PvP fight screenshot (matchmaking + fight)
  - Hub view (`/play` PitViewV2 — agents in ring)
  - Training (heavy bag + tasks)
  - Profile / Stats page
  - Club Mode (agent roster)
  - Fighter Detail (research tree + stats)
- [ ] OPTIONAL: Gameplay video (30-60 sec demo reel — youtube embed or self-hosted .mp4)
- [ ] Partner logos — if any partners ready (PNG/SVG, ~120×60 each)
- [ ] OPTIONAL: Hero ring screenshot — could replace 8b hex pattern bg if user prefers (carry-over from 8b decision #6)

**3.2 Copy:**

- [ ] **Gameplay section caption** — short text per screenshot/feature
- [ ] **Token section copy** — if not finalized: just placeholder text "Token launch — Coming soon. Subscribe for updates." If finalized: token name + Base contract address + tokenomics summary (supply, distribution, etc.)
- [ ] **Roadmap content** — Q1-Q4 2026 milestones OR "Roadmap — Coming soon" placeholder
- [ ] **Partners introduction** — "Partnered with..." OR "Partnerships — Coming soon"
- [ ] **Subscribe copy** — "Get notified" / "Stay updated" / etc.

**3.3 Backend / 3rd-party decisions:**

- [ ] **Token info finalized?** If YES: token name, Base contract address. If NO: placeholder OK for v1
- [ ] **Roadmap content?** Real milestones OR placeholder
- [ ] **Subscribe backend:**
  - (a) Mailchimp form embed (iframe — no BE work)
  - (b) Substack newsletter embed (iframe — no BE work)
  - (c) Custom backend `POST /v1/subscribe` (Stream 3 BE work — requires SMTP infra decision: SendGrid/Postmark/etc.)
  - (d) Plain "Coming soon" placeholder (no form submission, just promise)

**3.4 Section nav decision:**

- [ ] Add sticky top nav menu (Hero / About / Gameplay / Token / Roadmap / Partners / Subscribe) with anchor URL scroll? OR keep current single-page-natural-scroll?
- If yes: requires section anchor IDs + scroll-to logic + smooth-scroll polyfill verification
- Recommendation: defer to user feedback after 8c Cluster A-E delivery — see if natural scroll is sufficient

**3.5 og:image upgrade (Stream 4 Polish carry-over from 8b):**

- [ ] Provide proper 1200×630 banner image (Open Graph aspect ratio best practice). Currently `hexlash-logo.jpg` 1024² square is placeholder
- Could be composed during 8c if user provides ring screenshot or other hero visual

---

## 4. Phase 0 Investigation Plan (when user provides inputs)

**Mandatory subsections per Эпик 6 retrospective + 7 sub-epic precedent + NEW Asset Pipeline (8b):**

1. **API Contract Verification** — Subscribe form backend? token data API? image/video CDN? IntersectionObserver patterns inherited from 8b About section
2. **Negative-Space Verification** — what doesn't exist (image carousel? video player component? scroll-anchor library? sticky nav primitive?)
3. **CSS Class Taxonomy** — `.marketing-*` namespace from 8b extension. Section-specific classes (`.marketing-gameplay`, `.marketing-token`, etc.). Animation reuse (existing `marketing-glow-pulse` keyframe from 8b — could reuse for new sections)
4. **UI Infrastructure Dependencies** — Vue 3 ecosystem: existing IntersectionObserver pattern from 8b About (extend OR refactor to composable). Vuetify out of scope.
5. **Vocabulary Alignment Audit** — section anchor IDs (`#hero`, `#about`, `#gameplay`, `#token`, etc.) if nav menu added. CSS class semantic match with section names.
6. **Semantic Invariant + Flow Direction** — anonymous-only render preserved (1a beforeEnter cascade). New sections render in scroll order: Hero → About → Gameplay → Token → Roadmap → Partners → Subscribe → Footer.
7. **NEW for Эпик 8 — Asset Pipeline Verification** — image optimization (existing Vite mozjpeg/pngquant config), video poster fallback strategy, lazy-load via IntersectionObserver per section, bundle size impact target (warn if main bundle grows back >2MB raw post-1b reduction).

---

## 5. Architectural Pre-Decisions (suggested for design-Claude review)

**Inherited from 8b (architectural pattern established):**

| # | Topic | 8b convention | 8c default |
|---|---|---|---|
| A | File structure | Inline single-file `MarketingView.vue` | KEEP inline if total < 700 lines; refactor to `src/components/marketing/Section*.vue` if > 700 |
| B | CSS namespace | `.marketing-*` BEM-like | EXTEND to new sections (`.marketing-gameplay-*`, etc.) |
| C | Animations | Pure CSS (transforms + opacity, GPU-accelerated, slow tempo) | KEEP — no Three.js, no animation library |
| D | Section visibility | IntersectionObserver fade-in (one-shot, 30% threshold) | KEEP — extract to composable if 5+ sections need it (`useFadeInOnScroll`?) |
| E | SEO management | `useDocumentMeta` composable | KEEP — single-route SEO sufficient |
| F | i18n | Inline EN | KEEP for v1 (8c+); localization deferred |
| G | Mobile-first | clamp + `@media (max-width: 480px)` | KEEP per existing 8b conventions |

**New decisions for 8c:**

| # | Topic | Recommendation |
|---|---|---|
| H | Gameplay layout | Image grid (2x3 or 3x3 depending on screenshot count) — responsive, lazy-load via IntersectionObserver |
| I | Video player | If user provides video: `<video>` element with `<source>` (MP4 + WebM) + poster fallback. NO YouTube embed (privacy/perf). Lazy-load video file (preload="none") |
| J | Token section layout | Centered single-column text, max-width 700px. If token finalized: 3-card grid (Supply / Contract / Listing date). If placeholder: just "Coming soon — subscribe below" with arrow → Subscribe section |
| K | Roadmap layout | Vertical timeline (mobile-friendly) with date markers + content cards. Or horizontal cards on desktop / vertical on mobile (responsive flip). |
| L | Partners layout | Logo grid (auto-fit minmax 120px), grayscale → color on hover, opacity transitions |
| M | Subscribe form | If iframe (Mailchimp/Substack): minimal styling overrides. If custom: input + button row + success message OR "Coming soon" placeholder |
| N | Section anchor URLs | Defer to 8c closure decision (UX feedback after cluster A-E delivery) |
| O | IntersectionObserver composable | Refactor 8b About logic to `src/composables/useFadeInOnScroll.js` if 5+ sections need it. Saves 6× duplicate observer setup |

---

## 6. Streak Carry-In

**Streak: 4** (1a: 1, 1b: 2, 8a: 3, 8b: 4). 8c starts at 4.

**Lessons inherited:**

- #11 pre-edit + post-edit grep reflex
- #18 STOP-tier at structural mismatch
- #32 convention discovery (mirror existing 8b `.marketing-*` BEM where applicable)
- #33 cherry-pick chain — likely N/A for 8c (FE-only sub-epic; if Subscribe form chooses custom BE, becomes Stream 3 separate)
- #43 STEP 0 bootstrap branch verify (12th occurrence expected — formalization carry-over still pending)
- #45 Phase 0 metadata triple-verify

**Hot-fixes counter: 0.** 8c Phase 0 + Phase 1 should preserve 0-hot-fix track.

---

## 7. Carry-Overs from 8b (NOT 8c scope but coexist)

When 8c work begins, these remain open in parallel streams:

| Stream | Item |
|---|---|
| Stream 4 Visual Polish | Proper og:image banner (1200×630 vs current 1024² square logo placeholder) |
| Stream 4 Visual Polish | Hero hex pattern tempo / opacity tuning if user feedback during 8c |
| Stream 4 Visual Polish | Hero ring screenshot — could replace hex pattern bg if user prefers (8b decision #6 carry) |
| Stream 1 cleanup | Help anonymous-access UX (`/help` cascades through `/play/help` which auth-gates anonymous users — defer fix per 8b decision #5) |
| Stream 1 cleanup | **Lesson #43 STEP 0 formalization** — recurring 11-occurrence pattern, formalize as automatic bootstrap procedure in CLAUDE.md methodology section |
| Stream 1 cleanup | `src/AppV2.vue:24` stale comment from 8a interrupt fix territory |
| Stream 1 cleanup | `master/resetPassword` orphan chain (1b inheritance) |
| Stream 1 cleanup | `master/saveTelegramFlag` + `setIsTelegram` phantom mutation (1b inheritance) |
| Stream 3 BE | Password reset full backend (1b carry) |
| Stream 4 Visual Polish | Auth refinement to match concept screenshot (could overlap with 8c if visual style alignment desired) |
| Stream 6 Web3 | Connect Wallet real backend SIWE (1b carry) |
| Production env | `TELEGRAM_BOT_TOKEN` Railway cleanup (1b carry, manual post-deploy) |

**Coordination note:** 8c may add new image assets (gameplay screenshots, partner logos). Verify Vite asset pipeline (mozjpeg/pngquant/webp) is enabled for new images per Phase 0 §7 NEW asset pipeline subsection.

---

## 8. Files Inherited (post-8b state, post-final-merge)

### Live (modify or extend in 8c)

- `src/views/MarketingView.vue` — 470 lines (Hero + About + Footer). 8c ADDS 5 sections between About and Footer.
- `src/composables/useDocumentMeta.js` — 70 lines. 8c may use if title/description changes per scroll position; otherwise stays unchanged.
- `src/router/index.js` — `/` route mounts MarketingView (8b). 8c likely no router changes.
- `src/App.vue` — 8a `isPlayRoute` + `isMarketingRoute` covers `/`. No changes needed.

### NEW assets to add in 8c

- `src/assets/images/gameplay/<screenshot>.jpg` (× 5-10) — gameplay screenshots
- `src/assets/images/partners/<logo>.svg` (× N) — partner logos (if user provides)
- OPTIONAL: `src/assets/videos/demo.mp4` + `src/assets/videos/demo-poster.jpg` — gameplay video

### Deleted (1a/1b context — for 8c not to recreate)

- `src/views/LandingView.vue` (1a, 238 lines, deleted in 8b C5)
- `src/views/RainView.vue` (1b, 1212 lines, deleted in 1b C9)
- 4 legacy auth fragments + 11+ RainView assets (1b inheritance)
- 3 npm packages (kokomi.js, postprocessing, gsap — 1b inheritance)

---

## 9. Phase 0 Entry Conditions

**Before starting 8c Phase 0:**

1. [ ] User merges final 8b continue stack PR (10 commits — Phase 0 + 5 functional + 1 interrupt + 3 closure) to main
2. [ ] User provides minimum required inputs (§3.1 gameplay screenshots + §3.3 token + roadmap + subscribe decisions at minimum)
3. [ ] User confirms architectural pre-decisions (§5 H-O recommendations OR overrides)
4. [ ] User decides on optional Cluster F (section nav) — defer or include
5. [ ] Fresh chat session opened with this handoff doc as context
6. [ ] New branch created from latest main (mirror 1a→1b→8a→8b pattern: harness slug `claude/investigate-marketing-site-cluster-b-<suffix>` or similar)

**Lesson #43 reminder (12 prior occurrences):** harness will likely assign fresh slug; if not, manual branch switch required at Step 0. User-authorized procedure documented (Stream 1 formalization pending).

---

## 10. Quick Reference — Sub-epic 8b SHA Chain

For reference when reviewing 8b history or confirming what's on main:

```
b81145c  docs(8b): Phase 0 investigation report
c24cda1  C1: feat(marketing): MarketingView scaffold + useDocumentMeta composable
5b3fbc4  C2: feat(marketing): Hero section with logo + Play CTA + animated hex pattern    [G1 deferred to G2]
e81bf46  C3: feat(marketing): About section with NEVER GIVE UP + fade-in
a14d711  C4: feat(marketing): Footer + SEO meta tags
292aab5  C5: feat(routing): swap / route to MarketingView + DELETE LandingView.vue
35ab94c  fix: remove scroll hint arrow from Hero (G2 user feedback)                       [G2]
c228585  CL1: docs(8b): CLAUDE.md sync — Sub-epic 8b Marketing Cluster A closure
9c987dc  CL2: docs(8b): final report
<TBD>    CL3: docs(8b): handoff to Sub-epic 8c                                             [this commit]
```

**Continue stack:** `claude/investigate-marketing-site-rIC7v` (10 commits ahead of main at CL3 push). Final continue stack PR pending user merge.

---

**END OF HANDOFF.**

Fresh chat session: load this doc as context, gather user inputs §3, lock decisions §5 (incl. NEW H-O), run Phase 0 investigation §4 (7 mandatory subsections), then proceed to Phase 1 ТЗ (estimated 6-9 functional commits + 3 closure for 8c Cluster A-F scope = 5 sections + optional section nav refactor).
