# Sub-epic 8 — Phase 0 Investigation Report — Part 2A (Q4-Q7)

**Continued from:** `EPIC6_SUBEPIC_8_PHASE_0_REPORT_PART1.md` (STEP 0 + Q1-Q3)
**Continues to:** `EPIC6_SUBEPIC_8_PHASE_0_REPORT_PART2B.md` (6 mandatory subsections + path candidates basis + risks)

**Split rationale:** 3-part split (8th application of preventive split framework, expansion from 2-part initial plan due to second stream timeout pattern в PART2 attempt — per 5R/5T/5U infrastructure-driven framework reactive variant). Anticipated в handoff §"Phase 0 expected size" — single-write attempt с preventive split fallback ready (3-part split likely if API stream timeout).

---

## Q4 — Final smoke test plan

### Q4.1 — Pre-merge checklist

**Required к pass BEFORE merge `claude/investigate-cutover-gate-RpOyg` → main (Эпик 6 closure deploy):**

| # | Checklist item | Verification method | Owner |
|---|---|---|---|
| 1 | All 5 acceptance gate areas pass (Q1.2/Q1.3) | User-driven manual visual sweep | User |
| 2 | All Sub-epic 8 cutover redirects work (target route loads after old URL hit) | Manual click-through bookmarks | User |
| 3 | No console errors на v2 routes (open DevTools, sweep) | DevTools sweep per route | User |
| 4 | Mobile breakpoints sane (Telegram WebApp 320px-720px) | Viewport switch in DevTools | User |
| 5 | Build pass `npm run build` (last commit) | Automated | Claude Code |
| 6 | No type errors / lint errors | `npm run lint` если defined | Automated |
| 7 | Backend production state matches FE expectations | Probes per Q4.2 | User + automated |
| 8 | All 30+ continue-stack commits coherent на target branch | `git log` review pre-PR | User |
| 9 | PR description summarizes Эпик 6 retrospective | Manual draft | Claude Code |
| 10 | Production rollback procedure documented | See Q4.4 | Claude Code |

### Q4.2 — BE compatibility verification

**Critical BE endpoints/messages — verify against production `api.hexlash.com`:**

**REST endpoints (production verify post-cutover):**
- `GET /v1/user/me` — captain field present (Sub-epic 6B-3a-backend deploy verified — already deployed via PR #353)
- `GET /v1/user/search` — public response shape
- `GET /v1/user/login/:login` — public response shape
- `GET /v1/user/id/:id` — public response shape
- `GET /v1/agent/list` — captain feature operational (Sub-epic 5R isCaptain restoration verified — PR via main `8ae36f0`)
- `GET /v1/agent/rankings` — leaderboard data
- `GET /v1/clan/search` — clan ratings
- `GET /v1/friends/list` — friends data (NOTE Q6 — `currentFight` field MISSING per Q6.1 audit)
- `POST /v1/clan/invite/respond` — invite flow
- `POST /v1/auth/login` `/v1/auth/register` `/v1/auth/reset` `/v1/auth/telegram` — auth flows

**WS messages (production verify):**
- Auth: protocol header `Bearer_<token>` (per CLAUDE.md WebSocket Protocol)
- PvP fight: `pvp_ready` `round_result` `dice_*` `coach_*` `fight_end` `overdrive_start` `match_cancelled` `pvp_surrender` `fight_state_resume`
- Spectate: `SpectateJoin` `SpectateLeave` `SpectatorListMsg` (Sub-epic 6 deferred-deploy — code on continue stack, NOT yet on main)
- Matchmaking: `MatchmakingStartMsg` `MatchmakingCancelMsg` `MatchFoundMsg` `MatchmakingQueueMsg` `match_cancelled`
- Friends: `friend_status` `challenge_received` `challenge_start` `challenge_declined`
- Punch: `PunchInfoRequestMsg` `PunchBatchRequestMsg`

**⚠️ DEPLOY DEPENDENCY ALERT:**

Per Sub-epic 6 closure (CLAUDE.md ~line 4-line "production state" section): **Spectate BE infrastructure (C1-C5, C9.5) НЕ deployed к production main** (waits Sub-epic 8 cutover per branch strategy). Production main BE has only Sub-epic 4b PR #355 + Sub-epic 6 C4.5 PR #356 (surrender routing fix) deployed.

This means:
- **`/v2/spectate/:fightId` will NOT work in production after Sub-epic 8 frontend cutover IF backend not deployed**
- BE `SpectateJoin` handler missing in prod main
- BE `match.spectators` Set missing
- BE `sendToSpectators` helper missing

**Sub-epic 8 deploy chain MUST include backend deploy** — either:
- (a) Cherry-pick Sub-epic 6 BE commits (C1+C2+C3+C4+C5+C9.5) к new fix-branch from main → PR → merge → Railway auto-deploy
- (b) Direct merge `claude/investigate-cutover-gate-RpOyg` → main (Q2.5-A) — atomic deploy всех 30+ commits including Sub-epic 6 BE
- (c) Two-stage Q2.5-C: visual-v2 branch carrying continue-stack work first, then Sub-epic 8 cherry-pick

**Lesson #33 6th application** — backend deploy chain critical для Sub-epic 8 acceptance.

### Q4.3 — Mobile responsive sanity check

**Telegram WebApp compat (per CLAUDE.md description — primary mobile target):**

Mobile breakpoints critical для verify (Sub-epic 7 + earlier):
- 320px (small mobile)
- 375px (iPhone)
- 414px (large mobile)
- 720px (tablet — `@media max-width: 720px` breakpoint used в profile.css per Sub-epic 5J Lesson #32 catch)
- 820px (Sub-epic 5L convention used in HudFighterDetail per Lesson #32 catch — file convention trumps cross-file)

**Critical mobile routes (manual sweep при acceptance gate):**
- `/auth/login` `/auth/signup` — keyboard does not push form off-screen
- `/v2` (Pit hub) — 3D scene render + HUD overlay accessible
- `/v2/fight` — HUD HP cards + dice button + coach buttons reachable on small mobile
- `/v2/spectate/:fightId` — HUD info readable, no overflow
- `/v2/matchmaking` — search timer + Cancel + countdown UI readable
- `/v2/profile` — 4-card HUD stacks correctly @720px
- `/v2/wallet` — balance card + Connect Wallet button on mobile
- `/v2/account` — 4 modals stacked, scrollable

**Carry-over verifications:**
- `.training-tasks` panel mobile @820px (HudSocialTasks per Sub-epic 5J)
- HudFighterDetail `.set-captain-btn` + `.captain-badge` + `.autofight-row` 820px (Sub-epic 5O P2)
- HudClan grid breakpoints (Sub-epic 5L)

### Q4.4 — Production deploy plan

**Deploy steps (proposed order):**

1. **Pre-deploy gate (Sub-epic 8 acceptance gate completion):**
   - All 5 functional areas verified user-side (Q1.2)
   - All cutover redirect commits build pass + push
   - Visual verify сutover through bookmarks (Q4.1)

2. **Backend deploy (Q4.2 deploy dependency):**
   - Decision per Q2.5: (a) cherry-pick Sub-epic 6 BE commits, OR (b) atomic merge continue stack
   - If (a): create branch `fix/sub-epic-6-spectate-be` from main HEAD, cherry-pick C1+C2+C3+C4+C5+C9.5, PR → main → merge → Railway auto-deploy
   - If (b): rely on Q2.5-A direct merge (carries BE commits)
   - **Verify post-deploy:** `https://api.hexlash.com/v1/...` healthcheck + spectate BE handler probe

3. **Frontend deploy:**
   - Per Q2.5 chosen reconciliation:
     - Q2.5-A: Direct merge `claude/investigate-cutover-gate-RpOyg` → main (single PR, ~30+ commits)
     - Q2.5-B: Squash-merge → main (single squash commit)
     - Q2.5-C: Two-stage (visual-v2 → main first, then Sub-epic 8 cherry-pick)
     - Q2.5-D: Selective cherry-pick
   - GitOps trigger: push к main → Vercel deploy frontend / Railway deploy backend (per CLAUDE.md `## Build & Deploy`)

4. **Post-deploy verification:**
   - Production smoke test (subset of Q1.2 acceptance gate scenarios)
   - DevTools sweep на production URL
   - Telegram WebApp test (real Telegram client)
   - Monitor for ~30 min — error logs, user reports

5. **Эпик 6 closure documentation:**
   - PR merge confirmation
   - Production deploy verification
   - CLAUDE.md update (Эпик 6 CLOSED ✅ marker)
   - Final report commit

**Rollback procedure (if regression surfaces post-deploy):**

| Severity | Action | Steps |
|---|---|---|
| Frontend regression isolated к single route | Revert specific cutover commit | `git revert <sha>` + new PR → main |
| Frontend regression broad | Revert merge PR | GitHub PR revert button → new PR auto-generated |
| Backend regression | Cherry-pick BE rollback | New `fix/<rollback-name>` branch → revert cherry-pick → PR |
| Catastrophic | Full main reset к pre-cutover SHA | `git reset --hard <pre-cutover-sha>` + force-push (USER AUTHORIZATION REQUIRED) |

**Lesson #18 STOP framework** для rollback decisions: if regression surfaces, STOP cutover progression, document failure mode, decide fix-forward (additional commit) vs rollback (revert).

---

## Q5 — Эпик 6 closure documentation scope

### Q5.1 — Final report scope

**Comprehensive retrospective across 14 sub-epics — proposed structure:**

```markdown
# Эпик 6 — Final Report (Эпик Cutover + Closure)

## Executive Summary
- Дата старта / closure
- 14 sub-epics всего
- Streak finale (32 expected)
- Эпик scope: визуальная миграция v1 → v2 + cutover

## Per-sub-epic summary
[14 entries — each: name, scope, commits, key achievements, closure shape]

## Cumulative metrics
- Total commits в Эпике 6
- Recoveries history (entering 79+, exiting 89+)
- Lessons promoted (entering 35, exiting 38)
- Phase 0 catches cumulative (10 + 38 + 61 + 50 + 30 = 189 in Sub-epics 4a-7 alone)
- Hot-fix metric: 32-streak achieved ✅

## Architectural achievements
- v2 design system migration (Neon Discipline)
- Belt System (replaces ELO)
- Captain in Public UI
- Fight Club abstraction (FightClub model 1:1 user)
- Action-based PvE / archetype-modifier PvP
- Clan social system + Activity Feed + 3-step retirement system
- Production-ready PvP with reconnect snapshot replay

## Methodology contributions
- Mode A discipline + STOP-and-confirm pattern
- Investigation-refines-ТЗ (sextuple precedent)
- Preventive split framework (8 applications)
- Convention discovery reflex (Lesson #32)
- Reflex catch tiering (Lesson #35: adaptation/bug-bundle/scope-boundary)
- 6 mandatory Phase 0 subsections (5 prior + 6th PROMOTED Sub-epic 6)
- 5 distinct closure shapes
- 5 cherry-pick PR cumulative (Lesson #33 chain)
- Lesson #43 PROMOTED (bootstrap branch divergence reflex, 9-occurrence chain)
- Lesson #44 PROMOTED (re-anchor scope after strategy revision)
- Lesson #45 PROMOTED (Phase 0 metadata error pattern, 12-occurrence chain)

## Carry-overs going forward (Эпик 7+ scope)
[List ~20-25 remaining items]

## Production deploy summary
- Final deploy method (per Q2.5 decision)
- Production verification results
- Rollback prepared

## Lessons learned (cumulative 38 promoted)
[List или summary]

## Acknowledgments / closing notes
```

**Estimated final report size:** 600-800 lines.

### Q5.2 — Lessons cumulative

**38 lessons promoted к end of Sub-epic 7. Inventory verification:**

Per CLAUDE.md "Lessons promoted" running tally:
- Lessons #1-#10 — early Sub-epics 5E-5J era foundation
- Lesson #11 — verify shape (universally applied)
- Lessons #12-#17 — methodology toolkit growth
- Lesson #18 — STOP at structural mismatch
- Lessons #19-#21 — exposure-aware tuning + ClanScene precedent
- Lesson #22 — HUD scoped selector match
- Lessons #23-#29 — process refinements
- Lesson #30 — Pattern reuse semantic vs mechanical
- Lessons #31-#34 — schema migrations + convention discovery + deploy environment + HUD overlay layout
- Lesson #35 — Reflex catch tiering (adaptation/bug-bundle/scope-boundary)
- Lessons #36-#42 — active candidates (NOT promoted, awaiting 2nd occurrence)
- Lesson #43 — PROMOTED 4b (bootstrap branch divergence reflex, 9-occurrence chain)
- Lesson #44 — PROMOTED Sub-epic 6 (re-anchor scope after strategy revision)
- Lesson #45 — PROMOTED Sub-epic 7 (Phase 0 metadata error pattern, 12-occurrence chain)

**Active candidates entering Sub-epic 8 (7):** #36/#37/#38/#39/#40/#41/#42

Per CLAUDE.md, candidates require 2nd occurrence для promotion. Sub-epic 8 may surface promotion candidates.

### Q5.3 — Streak metric history milestones

**Streak progression Эпик 5 + Эпик 6:**

| Sub-epic | Streak | Notes |
|---|---|---|
| 5E | 1 | First clean closure |
| 5J | 6 | First closer slot continue stack |
| 5R | 14 | Q1 backend `/v1/agent/list` 500 closure |
| 5U | 17 | Эпик 5 §4.2 100% (CLOSED ✅) |
| 6A | 18 | Эпик 6 first cutover sub-epic |
| 6B-1 | 19 | First coverage gap closed (port-and-replace) |
| 6B-2 | 20 | Deprecation-via-redirect pattern established |
| 6B-3a-backend | 21 | Code-complete + deferred-verify pattern |
| 6B-3 | 22 | First M-size frontend; reactive split |
| 6B-3b | 23 | Smallest sub-epic в Эпике 6; scope-deferral pattern |
| Sub-epic 1 | 24 | Half-way Эпик 6 (50%) |
| Sub-epic 2 | 25 | Path D reversal (Path A → Path D) |
| Sub-epic 3 | 26 | Path A per-sub-route v2 ports |
| Sub-epic 4a | 27 | Pre-edit catches methodology validated (10) |
| Sub-epic 4b | 28 | Lesson #43 PROMOTED |
| Sub-epic 5 | 29 | 61 catches ceiling |
| Sub-epic 6 | 30 | 6th Phase 0 subsection PROMOTED + Lesson #44 PROMOTED + new closure shape |
| Sub-epic 7 | 31 | Lesson #45 PROMOTED + auth/wallet redesign closed (#4) |
| **Sub-epic 8 expected** | **32** | Эпик 6 CLOSED ✅ |

**Streak preservation rules** (Lesson #35 framework):
- **Adaptation-tier** recoveries do NOT break streak
- **Bug-bundle-tier** does NOT break streak
- **Scope-boundary-tier** triggers Lesson #18 STOP, also does NOT break streak
- **Hot-fix recoveries** (post-commit fix-forward) DO break streak

**Sub-epic 8 risk:** acceptance gate failure → STOP escalation → fix-forward decision могла break streak. User-driven manual verify critical.

### Q5.4 — Hand-off к Эпик 7+

**Outline scope future work (post-migration):**

**Эпик 7 candidate streams:**

1. **Refactor / cleanup**
   - Vuetify removal completion (Эпик 6 left 15-20 fragments using Vuetify primitives — per Q3.2)
   - PreparationView + FightClubView v2 ports OR retirement decision
   - Locale cleanup (10 → English-only per carry-over #7 user direction)
   - i18n consolidation (cross-locale value-equivalence — карry-over from Sub-epic 5T methodology)
   - Asset audit (unused images / icons)

2. **Backend consolidation**
   - ErrorMsg shape consolidation (carry-over #31 — 5 BE callsites bypass sendError helper)
   - ELO duplication consolidation (carry-over #30 — `eloService.calculateElo` vs inline)
   - Captain payload field naming asymmetry (carry-over #33 — name/elo vs username/rating)

3. **Feature work**
   - 3D models + devices system (carry-over #6 — replaces legacy skins)
   - Achievement badge для retirement (carry-over #2 — backend Achievement entity required)
   - Filter chips BE extension (carry-over #29 — matchmaking BE feature)
   - Switcher3DPunch revisit if needed (carry-over #14 — preserved per user)
   - Cumulative damage stats (carry-over #20)
   - Coach active boost UI (carry-over #22)
   - XP earned display (carry-over #28)

4. **Visual polish**
   - Log actor colors (carry-over #21 — beyond warden/predator slots)
   - Single coach overlay vs dual (carry-over #23 — architectural change)
   - HudProfile card-creep monitor (Lesson #36 candidate — 6/7 threshold)

5. **PvP enhancements**
   - Spectate UI gaps post-MVP (carry-over #34/#35/#36/#37 — closed in Sub-epic 7 but more polish possible)

6. **Web3 integration**
   - Wagmi composables expansion (Эпик 6 only Wallet connect, no chain interactions yet)
   - NFT mint v2 UI (HexlashAgents.sol + ABI exist per CLAUDE.md, feature flag disabled)
   - Token withdrawal post-listing
   - x402 micropayment activation (premium reports)

**Эпик 7 sub-epic count estimate:** 8-15 (similar к Эпик 6 scope range).

---

## Q6 — Friends "Watch Live" closure (carry-over Sub-epic 7 deferred)

### Q6.1 — BE current state

**`/v1/friends/list` response shape (verified verbatim from `backend/src/routes/friends.js:225-239`):**

```js
const friends = friendships.map(f => {
  const friend = f.user1Id === userId ? f.user2 : f.user1;
  const isOnline = clients.has(friend.id);
  return {
    id: friend.id,
    username: friend.name || friend.login,
    login: friend.login,
    rating: friend.rating,
    avatarUrl: friend.avatarUrl,
    skin: friend.skin,
    status: isOnline ? 'online' : 'offline',
    addedAt: f.createdAt.getTime(),
    captain: captainMap.get(friend.id) || null,
  };
});
```

**`status` enum verified:** `'online' | 'offline'` only. **NO `'in_fight'` status currently emitted by `/list`.**

**`currentFight` field — NOT IN response.** ⚠️

**Where `currentFight` referenced в FE (per investigation):**
- `src/components/pvp/FriendCard.vue:8-9` — checks `friend.status === 'in_fight' && friend.currentFight` + renders `vs {{ friend.currentFight.opponent }}`
- `src/components/hud/HudProfile.vue:588-592` — `// 5N — Watch live fight (Path α mock port). currentFight is defined on the [unfinished comment]` + `const fightId = f.currentFight?.id || f.id;`
- `src/views/FriendsView.vue:132` — `query: { odName: friend.currentFight?.opponent }` (legacy v1 view, will be deleted Phase B)

**Status:** **`currentFight` field expected by FE BUT NOT emitted by BE.** Current behavior:
- Friends list status always `online | offline` (never `in_fight`)
- Watch button conditional `v-if="f.status === 'in_fight'"` НИКОГДА не surfaces
- Watch wiring (Sub-epic 7 5N HudProfile) effectively DEAD code w/o BE support

### Q6.2 — FE current state

**HudProfile Watch button (Sub-epic 5N + Sub-epic 7 wiring):**

`src/components/hud/HudProfile.vue:153` (visible per investigation):
```html
:aria-label="t.spectate.watchLive"
```

Current button handler `onWatch(f)` calls:
```js
const fightId = f.currentFight?.id || f.id;
router.push(`/v2/spectate/${fightId}`);
```

Logic: if `f.currentFight` set, use its `id`; else fall back к friend's user `id` (which would be wrong — `:fightId` route param expects fight UUID, not user ID).

**Defensive optional chain `?.` saves currently** (no crash since `currentFight` is undefined), but Watch button never displays since `f.status === 'in_fight'` always false.

### Q6.3 — BE touch coordination

**Sub-epic 8 implementation options:**

**Option Q6-A — Bundle с Friends Watch Live BE extension:**

BE changes needed:
1. `friends.js` `/list` route: add `status: 'in_fight'` detection (probe pvpCombatEngine matches Map для player1Id/player2Id == friend.id)
2. Add `currentFight: { id: matchId, opponent: opponentName }` field if `in_fight`

Estimated BE changes: ~20-30 lines в `friends.js`.

**Option Q6-B — Bundle с #31 ErrorMsg consolidation:**

#31 carry-over: 5 BE callsites bypass `sendError` helper:
- Investigation surface needed для exact callsite list
- Consolidation `errorDto: {code, message}` shape

**Combined Q6-A + Q6-B BE bundle:** ~50-80 lines BE diff. Cherry-pick PR `fix/friends-watch-live + errormsg-consolidation` from main HEAD.

**Option Q6-C — Defer к Эпик 7+:**

Skip Sub-epic 8 BE touch. Watch Live feature remains FE-only (DEAD code условный display). Mark в carry-overs forward к Эпик 7+.

**Cherry-pick PR planning if Q6-A или Q6-B applied (Lesson #33 6th application):**

| Action | Branch | Commits |
|---|---|---|
| 1 | Designated `claude/investigate-cutover-gate-RpOyg` Sub-epic 8 functional commits include BE changes | 1-2 BE commits + functional commits |
| 2 | Create `fix/friends-watch-live-be` from main HEAD | New branch |
| 3 | Cherry-pick BE commits к `fix/friends-watch-live-be` | 1-2 commits |
| 4 | PR `fix/friends-watch-live-be` → main | New PR |
| 5 | Merge PR → Railway auto-deploy backend | Railway webhook |
| 6 | Verify production: `curl https://api.hexlash.com/v1/friends/list` | Probe |

**Lesson #33 6 prior applications:** 6B-3a-backend / Sub-epic 1 / Sub-epic 4b PR #355 / Sub-epic 6 PR #356 (5 prior actually) / **Sub-epic 8 BE bundle = potential 6th**.

**Recommendation basis:**
- **Q6-C (defer)** if Sub-epic 8 scope already large (cutover commits + closure docs)
- **Q6-A (Friends only)** if BE bundle minimal scope
- **Q6-A + Q6-B combined** if BE deploy chain optimization (one cherry-pick PR closes 2 carry-overs)

User decision needed.

---

## Q7 — i18n cleanup (deferred bundle)

### Q7.1 — Inventory deferred i18n keys

**Investigation surfaced:**

`src/components/hud/HudSpectate.vue` references (verbatim per grep):
- Line 121: `{{ t.spectate.coachPause || 'Coach Pause' }}`
- Line 124: `{{ t.spectate.coachPauseStatus || 'Fighters consulting their coaches...' }}`

`src/components/hud/HudProfile.vue` reference:
- Line 153: `:aria-label="t.spectate.watchLive"`

**i18n key audit (en.js source of truth, verbatim per Read):**

```js
spectate: {
    title: 'SPECTATING',
    spectators: 'watching',
    round: 'Round',
    fightLog: 'FIGHT LOG',
    uses: 'uses',
    damage: 'damage',
    critical: 'CRIT',
    wins: 'wins',
    leave: 'Leave',
    watch: 'Watch',
    watchLive: 'Watch live fight',  // ← exists
},
```

**MISSING keys:**
- `spectate.coachPause` — referenced HudSpectate:121, MISSING from en.js
- `spectate.coachPauseStatus` — referenced HudSpectate:124, MISSING from en.js

**EXISTING keys (closed по Sub-epic 7 history):**
- `spectate.title/spectators/round/fightLog/uses/damage/critical/wins/leave/watch/watchLive` — all exist en.js

**ru.js (sample verify):**
- `watchLive: 'Смотреть прямой бой'` — exists

**Gap scope:** 2 missing keys × 11 locales = **22 additions needed.**

### Q7.2 — Locale file structure verification

**11 locale files** (`src/locales/`):
- `ar.js de.js en.js es.js fr.js hi.js index.js ja.js ko.js pt.js ru.js zh.js`
- + `pages/` directory (rules + help long-form content)
- `index.js` — i18n bootstrap (per CLAUDE.md custom reactive i18n)

**Convention per CLAUDE.md i18n section:**
- 11 locales total (en, ru, de, es, fr, pt, ar, hi, ja, ko, zh)
- Phase 1 / Sub-epic policy: new keys obligatorily в en + ru, остальные 9 = English fallback
- Sub-epic 5T value-equivalence methodology surfaced: 9 locales частично have hardcoded English placeholders

**Sub-epic 8 i18n keys add policy** (mirror established):
- en.js: real English values
- ru.js: real Russian translations
- de/es/fr/pt/ar/hi/ja/ko/zh: English fallback (literal copies — per `de.js` precedent CLAUDE.md Sub-epic 5N)

### Q7.3 — Bundle scope decision basis

**Sub-epic 8 in-scope candidate:**

Add 2 missing keys × 11 locales = **22 additions** in single commit.

| Aspect | Value |
|---|---|
| Scope size | XS (2 keys × 11 locales = 22 lines) |
| Commits needed | 1 |
| Risk | Very low (additive locale entries) |
| Streak safety | Adaptation-tier (Lesson #35) |

**Recommendation basis:** **Q7 bundle in Sub-epic 8 is cheap** (22 line additions). Closes deferred carry-overs from Sub-epic 7 C10 + C15. Single i18n commit, no risk.

**Alternative Q7-defer:** Mark forward к Эпик 7+ если Sub-epic 8 scope getting too large.

**HudProfile aria-label `watchLive` already wired** через `t.spectate.watchLive` (key exists). No additional i18n action needed для aria-label closure.

---

**Part 2A ends here.** Continued in `EPIC6_SUBEPIC_8_PHASE_0_REPORT_PART2B.md` (6 mandatory subsections + path candidates basis table + risks).
