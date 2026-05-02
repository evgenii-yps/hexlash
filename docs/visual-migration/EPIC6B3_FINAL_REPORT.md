# EPIC 6B-3 — FINAL REPORT

## Section 1 — Header

- **Date:** 2026-05-02
- **Branch:** `claude/investigate-retirement-animation-zQeg4` (continuation post-deploy-verify of 6B-3a-backend)
- **HEAD before Phase 1:** `6df400e` (post-streak-21-declaration of 6B-3a-backend)
- **HEAD after Phase 1:** `c8745a6` (8 functional commits — 6 base + 2 reactive split)
- **HEAD after Phase 2a:** `<NEW_HASH>` (this commit)
- **Predecessor:** Sub-Epic 6B-3a-backend — Privacy Fix (CLOSED clean ✅, deploy verified)
- **Type:** **Frontend new view + routing + backend integration, M size**
- **Status:** **CLOSED clean ✅**
- **Significance:**
  - **First M-size sub-epic в Эпике 6** (all prior sub-epics 6A / 6B-1 / 6B-2 / 6B-3a-backend were S or S-M)
  - **First sub-epic relying на verified privacy-fixed backend** (uses 6B-3a-backend's `formatUserPublicResponse` deployed на `api.hexlash.com`)
  - **First reactive split applied в Эпике 6** (Commit 7 → 7a + 7b — 5T precedent, 2nd application в running streak overall)

---

## Section 2 — What 6B-3 did

Создан guest profile view для просмотра чужих профилей (`/user/:userLogin`) в v2. Closes 3rd functional gap из 9 identified в Wave 2 audit (`/help` 6B-1 + `/profile/skins` 6B-2 + **`/user/:userLogin` 6B-3 ✓**).

### Concrete changes

| Action | Location | Diff |
|---|---|---|
| Vuex extension (Path C) — new action + state | `src/core/state/modules/userState.js` | +44/-0 |
| New view (Pattern A scene-shared) | `src/views-v2/UserProfileView.vue` (new) | +109 |
| New HUD (4 cards + 6 UI states) | `src/components/hud/HudUserProfile.vue` (new) | +586 |
| i18n keys (userProfile block) | `src/locales/en.js` | +5/-0 |
| Route registration + redirect | `src/router/index.js` | +9/-1 |
| **Reactive split 7a** — Achievements label fix | `src/components/hud/HudUserProfile.vue` | +1/-1 |
| **Reactive split 7b** — error preservation в service | `src/core/services/userService.js` | +4/-1 |

**Net:** +758/-4 across 8 commits, 5 files (4 modified + 2 new).

### Vuex Path C (Commit 1)

- Added state: `loadingGuest: false`, `errorGuest: null`
- Added mutations: `setLoadingGuest`, `setErrorGuest`
- Added new action: `getGuestUserByLogin(userLogin)` — wraps existing service path с loading/error tracking. Captures structured error `{ status, message }`.
- **Existing `getUserByLogin` action UNTOUCHED** — 4 v1 callsites (ClanPageContent, ClanView, RatingsView, v1 ProfileView) unaffected.
- Existing `users` array cache reused (via existing `setUser` mutation).

### Routing (Commits 5 + 6)

- `/v2/user/:userLogin` registered as child of `/v2` (V2UserProfile name)
- `/user/:userLogin` swapped to function-form redirect: `to => ({ name: 'V2UserProfile', params: { userLogin: to.params.userLogin } })`
- Name `UserProfile` removed (Phase 0 6B-3 confirmed 0 by-name callsites)
- v1 ProfileView.vue file preserved on disk (still used by `/profile/balance|wallet|account` per 6A Option X)

### View architecture (Commits 2 + 3)

- **Pattern A scene-shared** — UserProfileView mirrors v2 ProfileView verbatim, registers scene `'profile'` (per MV-4 finding — ProfileScene has no owner-specific elements, captain showcase is HUD-side)
- **Self-redirect** — if `:userLogin` matches current user's login, `router.replace('/v2/profile')` (own profile)
- **Watcher `immediate: true`** — dispatches `getGuestUserByLogin` on route enter / param change
- **HudUserProfile** — separate component (parallel к own HudProfile), 4 read-only cards: Identity / Performance / Achievements / Captain showcase (only if `guestUser.captain` set). Edit buttons absent (HUD HUD overlay convention preserved per Lesson #34).
- **6 UI states**: Loading (spinner), Found (cards), 404 (Back button), Banned (`isBlocked === true` — Back button), Network error (Retry + Back), Self-redirect (handled in parent UserProfileView watcher).

### Backend integration

Frontend trusts backend response shape verified в 6B-3a-backend deploy. **No frontend filtering duplication** — 6B-3a-backend's `formatUserPublicResponse` returns ONLY public-by-design fields (25 fields), strips 17 private. UserModel reconstruction from response works because excluded fields default к `undefined` или type defaults в model.

### i18n (Commit 4)

- Added top-level `userProfile: { notFound, banned, error }` block в `en.js` (line 716, between spectate и xpAllocation blocks)
- HudUserProfile uses `t.section?.key || 'fallback'` syntax (custom reactive ref convention per HelpView 6B-1 mirror)
- Other 9 locales fall back к English per CLAUDE.md convention

### Reactive split (Commits 7a + 7b)

**Visual verification round 1 surfaced 2 bugs:**

**Bug 1 (Commit 7a) — Achievements label rendering raw object:**
- Root cause: `t.profile.achievements` is **nested object** in en.js (lines 132-137: `{ lblAchievements, lblHidden, lblCompleteToUnlock, congratulations }`). Optional chain returned object → `||` short-circuited → Vue rendered `[object Object]`.
- Fix (Scenario A): single-line change to `t.profile?.achievements?.lblAchievements || 'Achievements'`. Reuses existing nested key (mirrors v1 ProfileAchievements i18n contract). 1 line +/-

**Bug 2 (Commit 7b) — 404 case shows generic error instead of "User not found":**
- Root cause: `fetchUserByLogin` (userService.js) catches axios error and re-throws **brand new generic Error** without preserving `error.response.status`. By the time `getGuestUserByLogin` action's catch sees the wrapped error, `.response` is undefined → `.status` extraction yields `0` → `errorGuest.status === 404` check fails → fallback k generic error path.
- Fix (Path 1 — service-layer minimal touch): wrap retains `.status` and `.response` properties from original axios error. Drift safety verified per INV-3 caller analysis (4 callers — none read `.status` или `.response` from wrapped error currently; additive properties only).
- Fix scope: 3 changes (typo fix "club data" → "user", `wrapped.status` assignment, `wrapped.response` assignment). 4 lines +/- 1.

### Visual verification round 2

User confirmed both fixes: existing user displays "Achievements" label correctly, non-existing user shows "User not found" panel with Back button.

---

## Section 3 — Pivot trajectory

### 1 reactive split (Commit 7 → 7a + 7b)

Visual verification round 1 surfaced 2 bugs. Investigation INV-1..INV-5 identified root causes (i18n shape mismatch + service-layer error stripping). Commit 7 split into:
- **7a** — single-line HudUserProfile fix (Scenario A — reuse existing nested key)
- **7b** — service-layer Path 1 (preserve error properties via wrapped Error)

**5T precedent applied** — reactive split when investigation/visual-verify surfaces issues mid-Phase. Fix-within-Phase (NOT post-Phase-2 hot-fix). Streak preserved per Lesson #35 framework.

### 1 scope expansion via investigation

ТЗ Commit 7b template specified `userState.js` action layer fix. Investigation INV-3 surfaced root cause was service layer (`userService.js fetchUserByLogin` discards original error в catch). ТЗ-preference "избегать service touch" overridden post-investigation — drift safety verified, Path 1 service touch approved.

### Sextuple-precedent extension of investigation-refines-ТЗ pattern

Was quintuple at 6B-2 (5O / 5Q / 5R / 5S / 5T). 6B-3a-backend continued at quintuple (no extension). **6B-3 extends к sextuple** through:

1. Phase 0 (10-Q investigation, executed earlier) → user input Path 2 backend-first decision
2. Phase 1 ТЗ refined (split 6B-3 into 6B-3a-backend + 6B-3 frontend)
3. Mini-verify (MV-1..MV-6) before Phase 1 commits → Path C decision + custom `t.*` syntax confirmation
4. Phase 1 ТЗ refined inline (Path C shape adjusts state structure)
5. Phase 1 commits 1-6
6. Investigation INV-1..INV-5 → reactive split decision
7. Refined ТЗ для 7a + 7b
8. Commits 7a + 7b applied

**Sextuple precedent count** — pattern continues established methodology.

---

## Section 4 — Functional changes detail

### Per-commit summary

| # | Commit | File | Diff | Description |
|---|---|---|---|---|
| 1 | `7035052` | userState.js | +44/-0 | Path C extension — getGuestUserByLogin action + state |
| 2 | `2df7150` | UserProfileView.vue | +109 (new) | Pattern A scene-shared, self-redirect, watcher dispatch |
| 3 | `33ebb2e` | HudUserProfile.vue | +586 (new) | 4 cards + 6 UI states, custom t.* syntax |
| 4 | `61c629d` | en.js | +5/-0 | userProfile i18n block (notFound/banned/error) |
| 5 | `c23d842` | router/index.js | +5/-0 | V2UserProfile child route registration |
| 6 | `4db9307` | router/index.js | +4/-1 | /user/:userLogin redirect (function-form) |
| **7a** | `a2dbe96` | HudUserProfile.vue | +1/-1 | **Bug 1 — Achievements label i18n shape** |
| **7b** | `c8745a6` | userService.js | +4/-1 | **Bug 2 — error preservation в service catch** |

**Net:** +758/-4 across 8 commits, 5 files.

### Phase 0 verification (Lesson #11)

- 10-Q template investigation comprehensive (executed before 6B-3a-backend split decision)
- Mini-verify (MV-1..MV-6) — 6-point context refresh before Phase 1 commits
- Investigation INV-1..INV-5 — 5-point root cause analysis для 2 surfaced bugs

### Pre-edit verifications + re-investigation steps

8 commits с pre-edit grep + post-edit grep + `npm run build` × 8. Re-investigation steps applied for:
- Commit 5 (route insertion point)
- Commit 6 (by-name callsite re-check для name removal safety)
- Commit 7b (file/function targeting confirmation)

### Build verification

`npm run build` clean × 8 commits. Only existing 500 kB chunk warning preserved (vendor bundle baseline).

### Bundle delta (vs 6B-3a-backend Phase 2b baseline)

| Metric | Baseline | After 6B-3 | Delta |
|---|---|---|---|
| `dist/` total | 20M | 20M | unchanged |
| Main bundle (raw) | 3328.45 kB | 3327.88 kB | -0.57 kB |
| Main bundle (brotli) | 828.09 kB | 828.92 kB | +0.83 kB |
| New chunk: UserProfileView | — | 8 KB raw / 2.3 KB brotli (JS) + 6.86 KB raw / 1.2 KB brotli (CSS) | new |

HudUserProfile bundled into UserProfileView chunk (Vite static-import collapse — matches 6B-1 HelpView precedent).

---

## Section 5 — Recoveries log

**0 recoveries в 6B-3 session.**

### Reactive split classification (Lesson #35 framework)

**Commits 7a + 7b are NOT recoveries.** Both bugs caught **pre-Phase-2 via visual verify gate** (acceptance check ran BEFORE Phase 2 docs commits started). Fix-within-Phase via planned splits.

**Distinction matters:**
- **Recovery** would be: bug discovered post-Phase-2 / post-deploy → fix forward → breaks streak (e.g. Recovery #80 в 6B-3a-backend, but that was caught pre-commit during functional Phase 1, classified adaptation-tier)
- **Reactive split** is: planned investigation-driven fix path applied within same Phase before docs closure

System working as designed: visual verification gate before Phase 2 caught both bugs, reactive split methodology (5T precedent) applied to fix forward without streak break.

### Cumulative recoveries

**80+ → 80+** (UNCHANGED).

---

## Section 6 — Lessons applied + new candidates

### Existing 35 lessons applied

- **#11 (pre-edit verification reflex)** — applied 8 times (per commit) + 6 mini-verify points (MV-1..MV-6) + 5 investigation points (INV-1..INV-5). Reflex stable across M-size sub-epic.
- **#18 (STOP triggers)** — multiple invocations:
  - Phase 0 (5 STOP conditions)
  - Pre-Phase-1 backend deploy investigation (Lesson #33 territory pre-recognition)
  - Mini-verify Path C decision (Vuex shape mismatch surfaced)
  - INV-3 service-layer override decision (ТЗ-preference reversal post-evidence)
- **#22 (`<style scoped>` selector match)** — applied к HudUserProfile.vue root selector `.user-profile-hud`
- **#30 (component decomposition signals)** — flagged HudUserProfile size (586 lines) but not applied — single-file acceptable at this scale (mirrors HudClan precedent ~388 lines pre-split в 5P; HudShop 220). Split candidate если 6C polish requires.
- **#32 (convention discovery reflex)** — applied multiple times:
  - i18n syntax convention (`t.section?.key` not `$t()`)
  - `useRoute()` placement в setup, not inside functions (ТЗ template typo correction)
  - HudProfile own pattern (Achievements hardcoded, no i18n) — informed Bug 1 fix decision
  - Service-layer error wrap pattern preservation (existing convention preserved через wrap shape — Path 1 minimal touch)
  - Test framework convention (carry-forward awareness from 6B-3a-backend's Recovery #80)
- **#33 (deploy-environment awareness)** — N/A для 6B-3 frontend-only sub-epic. Verified pre-condition (6B-3a-backend deploy verified) before Phase 0.
- **#34 (HUD overlay convention)** — applied to HudUserProfile root `pointer-events: none` + opt-in children (header / status panels / grid / action buttons)
- **#35 (reflex catch tiering)** — applied to reactive split classification (NOT recovery, fix-within-Phase via planned splits)

### Cumulative tally

**35 → 35 (UNCHANGED).**

### Carry-over candidate status from 5R-5U

All 5 candidates (#36 / #37 / #38 / #39 / #40) — status unchanged. All N/A в 6B-3 (frontend-only sub-epic relying on already-deployed verified backend).

### New candidates from 6B-3

**0.**

---

## Section 7 — Methodology contributions

**0 new methodology contributions.**

### Patterns applied / extended

- **Sextuple-precedent extension of investigation-refines-ТЗ pattern** — was quintuple at 6B-2 / 6B-3a-backend, now sextuple через 6B-3 multi-round investigation (Phase 0 → user direction → Phase 1 ТЗ → MV mini-verify → Path C → Phase 1 commits → INV → reactive split). Pattern strengthens with each application.
- **Reactive split (5T precedent, 2nd application в running streak)** — first был 5T itself (i18n consolidation Path D ultra-strict). 6B-3 second application post Phase 0/Phase 1/MV/INV chain. Pattern continues established methodology.
- **Code-complete + deferred-verify pattern indirect leverage** — 6B-3 depended on 6B-3a-backend deploy verify completion before unblocked. Demonstrated dependency chain handling between sub-epics.
- **Backend trust convention** — frontend doesn't duplicate backend privacy filtering (relies on `formatUserPublicResponse` shape). Single source of truth для public field whitelist.

### 6B-3 closure shape

**First M-size frontend slot, reactive-split-applied, methodology-applied (not contributing).**

Honest closure shape — established methodology applied cleanly across larger surface (M vs prior S sub-epics). Reactive split worked as designed (caught pre-Phase-2, fixed within Phase). Backend dependency chain handled correctly (deploy verify before frontend Phase 1 unblocked).

---

## Section 8 — Closure metrics + carry-overs + acceptance

### Closure metrics

| Metric | Value |
|---|---|
| Total commits (Phase 1 + Phase 2) | 10 (8 functional + Phase 2a + Phase 2b) |
| Functional commits | 8 (6 base + 2 reactive split) |
| Files changed (functional) | 5 (4 modified + 2 new + 1 service touch) |
| Recoveries | **0** |
| Hot-fixes | 0 — **streak preserved** |
| Reactive splits | **1 (Commit 7 → 7a + 7b)** |
| Investigation-refines-ТЗ rounds | 2 (Mini-verify + INV) — sextuple-precedent extends |
| Strategic scope decisions | 1 (INV-3 service-layer override post-evidence) |
| Methodology contributions | 0 |
| New lesson candidates | 0 |
| Tests added | 0 (frontend, no backend tests in scope) |
| Preventive split applications | 0 |
| Reactive split applications | **1 (5T precedent, 2nd application в running streak)** |
| Card-creep monitor | 6/7 — **NOT triggered** ✓ (HudUserProfile separate component, не adds к own HudProfile cards) |

### Эпик 6 progress

**5/13 sub-epics done (38%).** Past third milestone reached.

### Sub-Epic 6B-3 — CLOSED ✅

### Streak status

**21 → 22** transition pending Phase 2b clean closure. Will achieve **22-streak** at Phase 2b commit.

### Carry-overs forward (entering 6B-3: 8 items, exiting: 8 items — net zero)

| # | Item | Source | Status post-6B-3 |
|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop, κ Path B | CARRY-OVER |
| 2 | HudProfile card-creep monitor | 5L+ → 5S Q1.3 | MONITOR-FORWARD (still 6/7, **6B-3 NOT triggered** ✓ — separate HudUserProfile component pattern preserves monitor) |
| 3 | Lesson #36 validation track | 5R | CARRY-OVER (await 2nd occurrence) |
| 4 | Auth + Wallet visual redesign | 6A user request | CARRY-OVER (sub-epic 6B-10) |
| 5 | `/rules` → v2 port | 6B-1 Phase 0 | CARRY-OVER (6C cleanup или 6B-1b candidate) |
| 6 | 3D models + devices system | 6B-2 user direction | CARRY-OVER (post-migration / Эпик 7+) |
| 7 | Locale cleanup (10 → English-only) | 6B-3a user direction | CARRY-OVER (Эпик 7+ scope) |
| 8 | `/user/search sortBy=balance` query param leak | 6B-3a Phase 1 finding | CARRY-OVER (secondary leak vector — out of 6B-3 scope) |

**Net 6B-3a-backend → 6B-3 accounting:** 8 entering 6B-3 → 8 leaving (0 new, 0 closures).

### Closed in 6B-3

- ✅ `/user/:userLogin` GAP → FULL coverage. New v2 UserProfileView mounted at `/v2/user/:userLogin`. Top-level `/user/:userLogin` redirects к v2. v1 ProfileView.vue file preserved для `/profile/balance|wallet|account` deep-links.
- ✅ Auth guard preserved (new redirect destination is in v2 routes — protected at runtime via JWT requirement on `/v1/user/login/:login` API call)
- ✅ Backend integration verified — uses 6B-3a-backend's privacy-safe response shape

### Pending к 6B-3b onwards

- **6B-3b** (next sub-epic) — wire up entry points в HudClanRoster + HudRatings + HudProfile.Friends к open `/v2/user/:login` (S-size, expected straightforward)
- 6B-4 (clan dynamic), 6B-5 (full ratings), 6B-6 (profile sub-routes deep-links), 6B-7/8 (PvP/matchmaking real backend), 6B-9 (spectate real backend), 6B-10 (Auth + Wallet redesign) — Эпик 6 remaining
- 6C — v1 component file deletion + v2 children flattening + branch reconciliation
- Эпик 7+ — locale cleanup, 3D models system, search sortBy fix, etc.

### Acceptance checklist

- [x] userState Vuex extension (Path C — `getGuestUserByLogin` + loading/error state)
- [x] UserProfileView.vue created (Pattern A scene-shared, self-redirect logic)
- [x] HudUserProfile.vue created (4 read-only cards + 6 UI states)
- [x] i18n keys added (en.js — `userProfile.notFound/banned/error`)
- [x] `/v2/user/:userLogin` route registered (V2UserProfile)
- [x] `/user/:userLogin` swapped to function-form redirect
- [x] **Reactive split applied (Commits 7a + 7b)** — both bugs from visual verify round 1 fixed
- [x] Drift safety verified для service-layer touch (Path 1 — INV-3 caller analysis)
- [x] Backend integration verified (uses 6B-3a-backend public response shape)
- [x] HudProfile card-creep monitor preserved (6/7 — separate HudUserProfile component pattern)
- [x] Build clean × 8 commits
- [x] Visual verification round 2 confirmed both bug fixes (round 1 surfaced bugs, round 2 confirmed fixes)
- [x] No regression in existing routes (visual check covered self-redirect + 8 other cases)
- [x] FINAL_REPORT_6B3.md created (this commit, Phase 2a)
- [ ] CLAUDE.md updated с 3 edits (Phase 2b — forthcoming)
- [ ] Streak 22 declared (Phase 2b)

---

**End of EPIC 6B-3 Final Report.**
