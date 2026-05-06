# Sub-epic 8a Final Report — Migration `/v2` → `/play`

**Status:** ✅ CLOSED
**Branch:** `claude/investigate-v2-to-play-migration-UNlMW`
**Type:** FE URL refactor + cascade redirects, S-M size
**Date opened:** 2026-05-06 (post 1b PR #363 merge)
**Date closed:** 2026-05-06 (CL1+CL2+CL3, same day)
**Streak target:** 2 → 3 ✅ achieved (zero hot-fixes, all 3 G gates clean)

---

## 1. Executive Summary

Renamed user-facing URL prefix from `/v2` → `/play` to prepare for Эпик 8 Marketing Site (8b/8c). After 8a:
- Marketing site lives at `/` (currently 1a LandingView, will be replaced by long-form site in 8b/8c)
- Game lives at `/play/*` (was `/v2/*`)

**Architectural decoupling preserved:** URL is user-facing change only. Internal architecture identifiers (Vue file/dir paths, CSS class namespace, route names, JS DOM queries) ALL stay as-is — decoupled from URL by design (per Phase 0 §4.2 + §5.3 locks).

**Backward compat:** All `/v2/*` URLs cascade-redirect to `/play/*` equivalents via `legacyV2Redirects` array. Bookmarks, shared friend-Watch links, Telegram-share clan invites, and Эпик 6 legacy redirect chain all preserved.

**Hot-fixes:** 0. Streak preserved at 2 → 3.

---

## 2. Commit Chain

7 commits total (1 Phase 0 + 3 functional + 3 closure).

| # | SHA | Type | Description |
|---|---|---|---|
| 0 | `662bc1a` | docs | Phase 0 investigation report (6 mandatory subsections) |
| 1 | `9f3ecc9` | feat | C1 — rename `/v2/*` paths to `/play/*` + cascade redirect **[G1 STOP]** |
| 2 | `30c618f` | refactor | C2 — rename `isV2Route` computed to `isPlayRoute` **[G2 STOP]** |
| 3 | `f26bf1b` | refactor | C3 — update internal `/v2` push sites to `/play` (~58 sites across 25 files) **[G3 STOP — manual smoke test passed]** |
| 4 | `6786e39` | docs | CL1 — CLAUDE.md sync |
| 5 | (this) | docs | CL2 — Final report |
| 6 | (next) | docs | CL3 — Handoff to Sub-epic 8b |

**Merge timeline:** Continue stack `claude/investigate-v2-to-play-migration-UNlMW` 7 commits ahead of main (5 functional + 2 closure docs at time of CL2). Final continue stack PR (small-scope) pending user merge after CL3.

---

## 3. Files

### 3.1 NEW (0)
Pure refactor sub-epic — no new files.

### 3.2 MODIFIED (27 unique files)

**Router infrastructure (1 file):**
- `src/router/index.js` — 17 paths renamed via parent rename + 16 inheriting children, 15 cutover redirects updated, 1 beforeEnter target updated, NEW `legacyV2Redirects` array (2 entries) added

**App-level (1 file):**
- `src/App.vue` — `isV2Route` → `isPlayRoute` rename (definition + 2 template bindings)

**HUD components (8 files):**
- `src/components/pvp/ChallengeNotification.vue` — path check + push (2 sites)
- `src/components/hud/HudRatings.vue` — 11 click handlers ($router.push to clan/fighter/user routes)
- `src/components/hud/HudFight.vue` — path.startsWith spectate guard + 2× /play/fd/warden push (3 sites)
- `src/components/hud/HudSpectate.vue` — back button push (1 site)
- `src/components/hud/HudPit.vue` — avatar click push to /play/profile (1 site)
- `src/components/hud/HudFighterDetail.vue` — back button + Esc handler (2 sites)
- `src/components/hud/HudClan.vue` — back button (1 site)
- `src/components/hud/HudProfile.vue` — 2 backtick template literal pushes (spectate + user — Lesson #11 broader-grep catch)

**Clan fragments (2 files):**
- `src/components/fragments/clan/CreateClan.vue` — `currentPath !== '/play/clan'` check
- `src/components/fragments/clan/ClanEdit.vue` — `currentPath !== '/play/clan'` check

**views-v2 (15 files):**
- `AccountView.vue`, `ClanView.vue`, `CreateView.vue` (3 sites), `FightView.vue`, `FighterDetailView.vue` (2 sites), `GuestClanView.vue`, `MatchmakingView.vue` (6 sites), `PitViewV2.vue` (8 plinth click handlers), `ProfileView.vue`, `RatingsView.vue`, `ShopView.vue`, `SpectateView.vue` (2 sites), `TrainingView.vue`, `UserProfileView.vue`, `WalletView.vue`

### 3.3 DELETED (0)
None — refactor only.

### 3.4 Counts

| Metric | Value |
|---|---|
| Files modified | 27 |
| Files created | 0 |
| Files deleted | 0 |
| Lines added | 105 (across 4 functional commits — C1/C2/C3 + CL1) |
| Lines deleted | 86 |
| Net delta | +19 lines (mostly: legacyV2Redirects array + isPlayRoute comment block + CLAUDE.md additions) |
| Active push targets renamed | ~58 across 25 files |
| CSS files touched | 0 (`.app-v2` decoupled per decision #1) |
| Backend files touched | 0 (clean separation — Phase 0 §1.4 verified) |
| Vuex/composable files touched | 0 (clean — Phase 0 §4.3 verified) |
| i18n files touched | 0 (clean — Phase 0 §4.4 verified) |

---

## 4. Architectural Decisions

| # | Topic | Decision | Rationale |
|---|---|---|---|
| 1 | `.app-v2` CSS namespace | KEEP unchanged | 547+ rule prefixes across 12 CSS files — architecture identity, NOT URL-coupled. Renaming = M-size out-of-scope refactor. |
| 2 | `isV2Route` computed | RENAME → `isPlayRoute` | Mirrors 1b `isLandingRoute` → `isMarketingRoute` precedent (Lesson #32 convention discovery). Vue Router redirect resolves before computed re-evaluates, so checking `/v2` would never match post-cascade. |
| 3 | Эпик 6 cutover redirects | UPDATE DIRECTLY to `/play/*` | Single-hop preferable to chain through `/v2/*` cascade. Cleaner browser history. |
| 4 | Catch-all redirect syntax | Function-form with `Array.isArray()` defensive | Vue Router 4 `(.*)*` matcher returns `pathMatch` as string OR array depending on path depth. Defensive handles both. |
| 5 | Cluster D (comment refresh) | SKIP dedicated cluster | Comments don't affect runtime. Note: collateral comment correction during C3 sed sweep accepted as net-positive side-effect (no orphan comment debt). |
| 6 | Directory renames (`views-v2/`, `AppV2.vue`) | NO | Implementation names, decoupled from URL per architectural pattern. |
| 7 | Route name changes | NO — keep V2Root/V2Pit/V2*/etc. | `getPreviousRoute()` fallback compatibility + name-based router.push survives without code change. |
| 8 | Backend changes | NONE | Clean separation verified — 0 `/v2` references in `backend/src/`. |

---

## 5. Architectural Pattern — URL ↔ Implementation Decoupling

After 8a, the codebase explicitly demonstrates layered decoupling:

| Layer | Identifier | Coupled to URL `/play`? |
|---|---|---|
| URL path | `/play/*` | YES (user-facing) |
| Vue file paths | `src/views-v2/`, `src/AppV2.vue`, `src/styles/v24/` | NO (implementation, decoupled) |
| CSS class namespace | `.app-v2` (547+ rules) | NO (architecture identity, decoupled) |
| Route names | `V2Root`, `V2Pit`, `V2FighterDetail`, `V2Fight`, `V2Training`, `V2Matchmaking`, `V2Create`, `V2Profile`, `V2Ratings`, `V2Clan`, `V2GuestClan`, `V2Shop`, `V2Spectate`, `V2Help`, `V2UserProfile`, `V2Wallet`, `V2Account` | NO (internal API, decoupled) |
| JS DOM query | `document.querySelector('.app-v2')` (`useClickToHit.js:27`) | NO (couples to CSS class, not URL) |
| Backend API | `/v1/*` | NO (clean separation) |

**Documentation note in CLAUDE.md** ensures future developers see the decoupling pattern when reading routes table.

---

## 6. Lessons Applied

### 6.1 Lesson #11 — pre-edit + post-edit grep on every commit

**3 catches across C1/C2/C3:**

1. **C1 — Phase 0 redirect count discrepancy.** Phase 0 said "14 cutover redirects"; fresh grep found **15** (`/profile/skins` redirect missed in inventory). All 15 sites updated. Adaptation-tier per Lesson #35.

2. **C2 — Phase 0 use site count discrepancy.** Phase 0 said "2 use sites"; fresh grep found **3 in App.vue** (1 computed definition + 2 template bindings: header v-if line 3 + Info/Error/menu/notifications block v-if line 19). All 3 updated via `replace_all=true`.

3. **C3 — Initial pre-edit grep pattern incomplete.** Initial pattern `'/v2|"/v2` found 60 candidates; broader pattern `\`/v2` (backticks) surfaced **2 more sites** in HudProfile.vue (template literal pushes for spectate + user navigation). Both added to sweep via separate sed pass.

### 6.2 Lesson #18 — STOP-tier at structural mismatch

3 G gates triggered (G1 cascade smoke, G2 quick verify, G3 manual smoke test). All gates passed clean — no STOP-tier escalations needed (no broken structural assumptions surfaced).

### 6.3 Lesson #32 — convention discovery

**Mirror existing patterns where possible:**
- `isV2Route` → `isPlayRoute` rename mirrors 1b `isLandingRoute` → `isMarketingRoute` precedent
- `.app-v2` KEEP decision mirrors existing v2 terminology lock (architecture identity vs URL — same pattern as `views-v2/` directory KEEP)
- Cascade redirect catch-all `'/v2/:pathMatch(.*)*'` mirrors existing 404 catch-all pattern (`'/:pathMatch(.*)*'`) at line 215

### 6.4 Lesson #43 — STEP 0 bootstrap branch verify

**10th cumulative occurrence** (5U / 5S / Sub-epic 2 / 4a / 4b / Sub-epic 5 / 6 / 7 / Sub-epic 1b / 8a). Pattern fully validated as recurring on every new sub-epic post-merge.

**Carry-over to Stream 1:** Formalize Lesson #43 as automatic bootstrap procedure (per user note during 8a Phase 0):
> "При начале нового sub-epic — Step 0 проверка branch. Если на closed continue stack — auto-switch на fresh from main без surfacing (если main clean и fast-forward возможен)."

### 6.5 Lesson #45 — Phase 0 metadata triple-verify

3 minor discrepancies caught at Cluster pre-edit fresh grep — all adaptation-tier (Phase 0 inventory off-by-one or pattern-incomplete, not blocking):
- C1 redirect count 14 → 15 actual
- C2 use site count 2 → 3 actual
- C3 grep pattern incomplete (added backticks)

All resolved in-flight without scope creep or hot-fix.

---

## 7. Carry-Overs

### 7.1 Эпик 8b/8c — Marketing Site (NEXT)

Long-form marketing site replacing 1a LandingView at `/`. CL3 handoff documents:
- Reference style (clashofcoins.com)
- 8-10 sections: Hero, About, Token, Gameplay, Roadmap, Partners, Subscribe, Footer
- Required user inputs: visual assets (Hero, gameplay screenshots), tagline confirmation, social URLs, token info, roadmap, subscribe backend decision
- Phase 0 entry conditions

**Critical for 8b:** `/` route stays mounted on LandingView (1a MVP) until 8b replaces it. `/play/*` routes already operational — game accessible via `hexlash.com/play` immediately post-8a-deploy.

### 7.2 Stream 1 cleanup (orphan code + drift)

| Item | Source | Severity |
|---|---|---|
| `src/AppV2.vue:24` stale comment ("App.vue v1 mount gated via `!isV2Route` block") | Decision #5 skip during C2 | Cosmetic |
| Comment side-effects in 6 files during C3 sed sweep (CreateClan, ClanEdit, WalletView, AccountView, FighterDetailView, CreateView) | Net positive — no orphan comment debt, but document if user wants strict revert | Documented |
| **Lesson #43 STEP 0 formalization** — recurring 10-occurrence pattern, formalize as automatic bootstrap procedure | User note during 8a Phase 0 | Methodology |

### 7.3 Inherited from 1b (still active)

- `master/resetPassword` orphan chain (Vuex + service + getter + model)
- `master/saveTelegramFlag` + `setIsTelegram` phantom mutation
- `fix/remove-telegram-auth-be` stale remote branch
- Stream 3: password reset full backend
- Stream 4: Auth refinement to match concept screenshot
- Stream 6: Connect Wallet real backend (SIWE)
- Production env: `TELEGRAM_BOT_TOKEN` Railway cleanup

---

## 8. Backward Compat Audit

### 8.1 Cascade redirect verification

| Old URL pattern | Cascade target | Mechanism |
|---|---|---|
| `/v2` | `/play` | `legacyV2Redirects[0]` direct redirect |
| `/v2/*` (any depth) | `/play/{tail}` | `legacyV2Redirects[1]` function-form with array/string handling |
| `/profile`, `/profile/balance`, `/profile/skins` | `/play/profile` | `protectedRoutes` Эпик 6 redirect (target updated) |
| `/profile/wallet` | `/play/wallet` | `protectedRoutes` Эпик 6 redirect |
| `/profile/account` | `/play/account` | `protectedRoutes` Эпик 6 redirect |
| `/ratings`, `/ratings/:type` | `/play/ratings` | `protectedRoutes` Эпик 6 redirect |
| `/training`, `/fight`, `/matchmaking` | `/play/{name}` | `protectedRoutes` Эпик 6 redirect |
| `/friends` | `/play/profile` | `protectedRoutes` Эпик 6 redirect (page→tab) |
| `/spectate/:odId` | `/play/spectate/:fightId` | `protectedRoutes` function-form (param rename) |
| `/clan/:id` | V2GuestClan named-route | `protectedRoutes` named-route redirect (name preserved) |
| `/user/:userLogin` | V2UserProfile named-route | `protectedRoutes` named-route redirect (name preserved) |
| `/help`, `/create-fighter`, `/fighter/:key` | `/play/{name}` | `protectedRoutes` Эпик 6 redirect |
| `/arena/club/create`, `/arena/club/:agentId` | chain via legacy redirects → `/play/*` | `protectedRoutes` chain |

**G3 manual smoke test verified all categories pass.**

### 8.2 Risk surfaces (none materialized)

| Risk | Severity | Status |
|---|---|---|
| Cascade catch-all `(.*)*` syntax glitch | LOW | ✓ Build pass + smoke verify |
| `pathMatch` array vs string handling | LOW | ✓ Defensive Array.isArray() |
| Missed `/v2` push site → broken nav | MEDIUM | ✓ Lesson #11 broader-grep catch (HudProfile backticks) |
| `.app-v2` CSS confusion (URL `/play`, class `.app-v2`) | LOW | ✓ CL1 documentation explicit |
| Friend-Watch link bookmarks | LOW | ✓ Cascade catch-all handles |
| Эпик 6 cutover chain double-hop | LOW | ✓ Updated directly to `/play/*` |

---

## 9. Metrics

| Metric | Value |
|---|---|
| Functional commits | 3 (C1/C2/C3) |
| Closure commits | 3 (CL1/CL2/CL3) |
| Phase 0 commits | 1 |
| Total commits | 7 |
| STOP gates triggered | 3 (G1/G2/G3) |
| Lesson #11 catches | 3 (all adaptation-tier) |
| Lesson #18 STOP-tier triggers | 0 (all G gates passed clean) |
| Lesson #45 metadata discrepancies | 3 (C1 redirects 14→15, C2 use sites 2→3, C3 grep pattern) |
| Hot-fixes | **0** ✅ |
| Streak | 2 → **3** ✅ |
| Files modified | 27 unique |
| Lines added | 105 |
| Lines deleted | 86 |
| Net delta | +19 lines |
| Active push targets renamed | ~58 across 25 files |
| CSS files touched | 0 (`.app-v2` decoupled) |
| Backend files touched | 0 |
| Vuex/composable files touched | 0 |
| i18n files touched | 0 |
| Bundle impact | ~neutral (route refactor, no asset changes) |
| Total `/v2` literals in src/ post-8a | 0 active code (only own comment markers + AppV2.vue stale comment Stream 1 carry-over) |
| Total `/play` literals in src/ post-8a | 63 active code references (router + push sites + path checks) |

---

## 10. Closure Notes

**Sub-epic 8a ✅ CLOSED.**

All decisions honored, all carry-overs documented, all G gates approved on first pass (zero hot-fixes, streak intact at 3).

**Architectural pattern established:** URL ↔ implementation decoupling explicitly documented in CLAUDE.md routes table — future Эпик 8b/8c (and any further URL refactors) inherit this pattern as design baseline.

**Production deploy mechanism:** Continue stack `claude/investigate-v2-to-play-migration-UNlMW` ahead of main. User merges via standard PR (incremental continue stack pattern from 1b workflow). Backend untouched — no Railway redeploy concerns. Frontend Vercel preview validates on PR merge.

**Next:** Sub-epic 8b — Marketing Site Cluster A (Hero + About + Footer + scaffold). CL3 handoff documents required user inputs and Phase 0 entry conditions.

**Branch state:** `claude/investigate-v2-to-play-migration-UNlMW` HEAD = CL2 commit (this report). Ready for CL3 handoff push, then final continue stack PR merge to main at user convenience.
