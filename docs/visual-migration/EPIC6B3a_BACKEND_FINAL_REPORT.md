# EPIC 6B-3a-backend — FINAL REPORT

## Section 1 — Header

- **Date:** 2026-05-01
- **Branch:** `claude/investigate-retirement-animation-zQeg4` (continuation of 6B-2 designated branch)
- **HEAD before Phase 1:** `a9c35d8` (6B-2 Phase 2b closure — Эпик 6 progress 3/11)
- **HEAD after Phase 1:** `aa1ad73` (5 functional commits)
- **HEAD after Phase 2a:** `<NEW_HASH>` (this commit)
- **Predecessor:** Sub-Epic 6B-2 — `/profile/skins` (Coverage Gap Closure через Deprecation)
- **Type:** **Backend privacy fix, S-M size, backend-only**
- **Status:** **CODE COMPLETE clean ✅, deploy verify DEFERRED** (Variant C, user-confirmed)
- **Significance:**
  - **First backend-only sub-epic в Эпике 6** (all prior sub-epics 6A / 6B-1 / 6B-2 were frontend-only)
  - **First sub-epic с deferred-verify closure shape** (new methodology pattern)
  - Closes critical privacy leak across 3 guest endpoints (`/login/:login`, `/id/:id`, `/search`)
  - First sub-epic с recorded recovery (Recovery #80) since 5R era

---

## Section 2 — What 6B-3a-backend did

### Strategic context

Phase 0 6B-3 (frontend guest profile sub-epic) surfaced critical backend privacy leak — `formatUserResponse` helper returns FULL user data (incl. `email`, `walletAddress`, `balance`, `wonTokens`, `freeTokens`, `progression`, `deck`, `settings`) when called from guest endpoints. v1 ProfileView simply doesn't render these fields, but the data IS sent over the wire to any authenticated user querying anyone's profile.

User chose **Path 2 (backend safety first)** over Path 1 (frontend filter only). This split sub-epic chain — added 6B-3a-backend as dedicated sub-epic before 6B-3.

### Variant chosen and applied

**Option A from Phase 0** — new helper `formatUserPublicResponse` + existing `formatUserResponse` untouched.

**Concrete changes:**

| Action | Location | Diff |
|---|---|---|
| Add new helper | `backend/src/utils/helpers.js` | +61/-1 |
| Switch `/v1/user/login/:login` to public helper | `backend/src/routes/user.js:204` + import line | +2/-2 |
| Switch `/v1/user/id/:id` to public helper | `backend/src/routes/user.js:224` | +1/-1 |
| Switch `/v1/user/search` (per-row .map) to public helper | `backend/src/routes/user.js:274` | +1/-1 |
| Add integration tests | `backend/tests/helpers.test.js` (new) | +176 |

**Existing `formatUserResponse` preserved untouched** for own contexts:
- `GET /v1/user/me` (line 36)
- `POST /v1/user/edit` (line 75)
- WebSocket handler (line 323) — punch batch user info update

### Public fields exposed (25)

- **Identity:** `id`, `login`, `name`, `avatarUrl`, `skin`, `isBlocked`, `clanId`, `clanRole`
- **Stats:** `rating`, `totalFights`, `wins`, `losses`, `draws`, `pveWins/Losses/Draws/TotalFights`, `pvpWins/Losses/Draws/TotalFights`, `luckPercentage`, `invitedUsers`
- **Timestamp:** `createdAt` (join date)
- **Achievements:** array of `achievementId` strings (mapped via existing convention `(a) => a.achievementId`)
- **Optional:** `captain` (via `getCaptainPublicInfo`)

### Private fields excluded (17)

- **Account:** `email`, `emailVerified`, `initialVerified`, `inviteId`
- **Financial:** `balance`, `walletAddress`, `wonTokens`, `freeTokens`, `lostTokens`
- **Game state:** `progression`, `deck`, `settings`, `noSkipDays`, `totalTaps`
- **UI/referral:** `language`, `referredBy`
- **Privacy timestamp:** `updatedAt` (last-seen tracking concern)

### Discipline

5 functional commits Mode A in Phase 1, build/test/syntax verification + push between each. Phase 2a (this report) + Phase 2b (CLAUDE.md update) close documentation contract.

---

## Section 3 — Pivot trajectory

### Strategic decisions in 6B-3a-backend session (2)

**1. Path 2 (backend safety first) chosen via user input** — overrode default frontend-filter approach. Created 6B-3a-backend as dedicated sub-epic, splitting 6B-3 chain. Strategic refinement, not pivot.

**2. Inline scope expansion via Phase 0 finding** — original ТЗ targeted only `/login/:login`. Phase 0 surfaced same leak в `/id/:id` (line 224) и `/search` (line 274 list endpoint). Scope expanded к 3 guest endpoints. Investigation refined ТЗ — quintuple-precedent pattern.

### Pattern continuation

**Quintuple-precedent investigation-refines-ТЗ pattern applied — not extended** (5O / 5Q / 5R / 5S / 5T pattern continues at quintuple, no 6th instance promotion). Same closure shape as 6A / 6B-1 / 6B-2 для investigation-refines part.

---

## Section 4 — Functional changes detail

### Per-commit summary

| # | Commit | File | Diff | Description |
|---|---|---|---|---|
| 1 | `6510ff5` | helpers.js | +61/-1 | Add `formatUserPublicResponse` helper |
| 2 | `d4da52a` | routes/user.js | +2/-2 | Switch `/login/:login` + import |
| 3 | `f7014f0` | routes/user.js | +1/-1 | Switch `/id/:id` |
| 4 | `054bf0b` | routes/user.js | +1/-1 | Switch `/search` per-row |
| 5 | `aa1ad73` | tests/helpers.test.js | +176 (new) | 6 integration tests |

**Net:** +241/-5 across 5 commits, 3 files.

### Phase 0 verification (Lesson #11)

- 9 Q-templates investigation comprehensive (Q1-Q9)
- Surfaced 5 STOP conditions (5+ formatUserResponse usages, no helper tests, deploy infrastructure unclear, V1 ProfileStats reads private fields, borderline classifications)
- Surfaced 4 design decisions (strategy, endpoints scope, borderline fields, deploy gate)
- Pre-Phase-1 step verified deploy mechanism + acceptance gate strategy

### Pre-edit verifications (5 commits + 2 re-investigations)

- Branch + HEAD + clean state checks per commit
- grep verifications before insert/edit
- **Re-investigation step Commit 3** (`/id/:id` structure): confirmed identical к `/login/:login` — no nested logic, no conditional shaping
- **Re-investigation step Commit 4** (`/search` `.map()` signature): confirmed simple `.map()` без per-user conditional, captainMap fetch untouched, pagination at DB level

### Build verification

`node --check` pass × 5 commits. No syntax errors introduced.

### Test verification

- **Baseline:** 71 tests across 16 suites (5 existing test files, all `node:test` framework with `describe/it` + `node:assert/strict`)
- **Final:** 77 tests across 18 suites (+6 new, 0 regressions)
- All 6 new tests passed first run after Recovery #80 fix (env setup)

### Functional sandbox verification (Commit 1)

- `typeof formatUserPublicResponse === 'function'` ✓
- 25 public keys returned across mock User probe ✓
- **0 private fields leaked** verified across 15 sensitive fields probed (email, balance, walletAddress, wonTokens, freeTokens, lostTokens, progression, deck, settings, language, inviteId, referredBy, noSkipDays, totalTaps, updatedAt) ✓
- Achievements correctly mapped via `achievementId` (existing convention preserved)

### ТЗ template correction applied (Commit 1)

ТЗ template specified `(user.achievements || []).map(a => a.id)` для achievement mapping. Pre-edit investigation revealed existing `formatUserResponse` (helpers.js:50-52) uses `a.achievementId` (matches Prisma `UserAchievement` join shape).

**Convention discovery (Lesson #32) applied:** mirrored existing pattern verbatim. Used `a.achievementId`, NOT `a.id`. Flagged для Commit 5 test mock adjustment — test mock used `{ achievementId: 'first_blood' }` correctly per user confirmation.

This prevented frontend regression (frontend uses array of `achievementId` strings to look up achievements).

---

## Section 5 — Recoveries log

### Recovery #80 — Test JWT_SECRET environmental issue (adaptation-tier per Lesson #35)

**Trigger:** First test run после Commit 5 file creation failed with:
```
Error: JWT_SECRET environment variable is required. Server cannot start without it.
  at Object.<anonymous> (/home/user/testhexlash/backend/src/config.js:4:9)
  ...
  at Object.<anonymous> (/home/user/testhexlash/backend/src/utils/helpers.js:2:24)
```

Test exit code 1, summary: `# tests 72 / # pass 71 / # fail 1`.

**Root cause:** `helpers.js:2` imports `config.js` which throws at module-load time if `JWT_SECRET` env var unset. Existing 5 test files don't transitively import `config.js` — they use Prisma directly which doesn't need JWT_SECRET. New `helpers.test.js` is **first test that imports helpers** → triggered config-load on require chain.

**Detection:** Pre-commit (caught при первом `npm test` run после file creation). Did NOT reach origin.

**Fix applied (single line, top of test file):**

```js
// helpers.js transitively requires config.js, which throws if JWT_SECRET is
// unset at module-load time. Provide a benign default so this test file can
// run via plain `npm test` without env setup. Real env value (if set) wins.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
```

This:
- Sets benign default for test environments
- Real env value wins if already set (no override of dev/CI configurations)
- Preserves existing `npm test` invocation для all tests
- Single line, no test file structure change

After fix: re-ran `npm test` → 77 tests / 77 pass / 0 fail ✓.

**Tier classification per Lesson #35:**

| Criterion | Status | Reason |
|---|---|---|
| Hot-fix? | ❌ NO | Caught pre-commit, fix-within-Phase, conscious decision |
| Bug-bundle? | ❌ NO | Single root cause (env var missing), no parallel callsites |
| Scope-boundary? | ❌ NO | Fix внутри test file, в scope sub-epic'a (test infrastructure) |
| **Adaptation-tier?** | ✅ **YES** | Environmental expectation mismatch surfaced + fixed (test runner expectation vs config.js hard requirement) |

**Streak impact:** **PRESERVED** (adaptation-tier doesn't break streak per Lesson #35 framework).

### Cumulative recoveries

**79+ → 80+** (+1 Recovery #80, adaptation-tier).

---

## Section 6 — Lessons applied + new candidates

### Existing 35 lessons applied

- **#11 (pre-edit verification reflex)** — applied 5 times per commit + 2 re-investigation steps (Commit 3 `/id/:id`, Commit 4 `/search`)
- **#18 (STOP triggers)** — Phase 0 STOP correctly invoked (5 STOP conditions surfaced); Pre-Phase-1 STOP applied (deploy mechanism investigation needed); Commit 5 test failure STOP applied (Recovery #80 caught pre-commit)
- **#22 (HUD scoped selector match)** — N/A (backend-only sub-epic, no HUD touched)
- **#30 (pattern reuse — semantic vs mechanical)** — applied: new helper `formatUserPublicResponse` mirrors existing `formatUserResponse` shape pattern (constructor pattern, options.captain branch) but with semantic distinction (public-only fields). Semantic reuse, не mechanical copy
- **#32 (convention discovery reflex)** — **applied multiple times:**
  - Test framework convention: ТЗ template used `test()` direct API + `node:assert`. Existing 5 test files use `describe/it` + `node:assert/strict`. Convention discovery → mirrored existing
  - Achievement mapping convention: ТЗ template used `a.id`. Existing helper uses `a.achievementId`. Convention discovery → mirrored existing, flagged для test mock alignment
- **#33 (deploy-environment awareness)** — applied throughout:
  - Phase 0 surfaced deploy-gating concern (STOP condition)
  - Pre-Phase-1 mini-task verified specifics (apitest unreachable from sandbox)
  - Phase 2 closure declared **Variant C (deploy verify deferred)** — first explicit application
- **#34 (HUD overlay layout convention)** — N/A (no HUD touched)
- **#35 (reflex catch tiering)** — applied to Recovery #80 classification (adaptation-tier confirmed via 4-criterion check)

### Cumulative tally

**35 → 35 (UNCHANGED).**

### Carry-over candidate status from 5R-5U

All 5 candidates (#36 / #37 / #38 / #39 / #40) — status unchanged. Most N/A в 6B-3a-backend (#36 incomplete-rollback drift inapplicable here, #37/#38 sandbox/multi-layer addressed via deferred-verify pattern not new lesson, #39/#40 i18n inapplicable).

### New candidates from 6B-3a-backend

**0.**

---

## Section 7 — Methodology contributions

### 1 NEW methodology pattern established

**"Code-complete + deferred-verify" closure shape (Variant C from Phase 0 acceptance options).**

**First sub-epic в Эпике 6 closing с deferred deploy verify.** Pattern characteristics:

- Code complete + sandbox-verified through tests + functional probe
- Production deploy mechanism gates final acceptance verify (Lesson #33 territory)
- Closure declared as "code complete, deploy verify pending"
- **Mandatory pre-condition imposed на downstream sub-epic** (here: 6B-3 cannot start Phase 1 без cherry-pick + merge + deploy + verify chain)
- CLAUDE.md tracks deferred verify status в multiple visible locations (sub-epic section + chapter overview + warning block)
- **Streak math reflects gating honestly** — streak preserved at entry value (NOT incremented), transitions only after verify completes

### Pattern complementarity

Эпик 6 has now developed 3 distinct closure shapes:

| Pattern | Origin | Use case |
|---|---|---|
| **Linear closure** | 6A | Clean execution, methodology-applied, no recoveries, frontend routing |
| **Deprecation-via-redirect** | 6B-2 | Gap closed через scope simplification (legacy concept retired) |
| **Code-complete + deferred-verify** | **6B-3a-backend (NEW)** | Backend changes need separate deploy chain (5R Lesson #33 territory) |

### 6B-3a-backend closure shape

**First backend-only slot, linear-with-recovery, methodology-contributing (1 new pattern).**

Honest closure shape — code complete on designated branch with full sandbox verification, but final acceptance gate (production deploy verify) gated on user-side action external to this branch.

---

## Section 8 — Closure metrics + carry-overs + acceptance

### Closure metrics

| Metric | Value |
|---|---|
| Total commits (Phase 1 + Phase 2) | 7 (5 functional + Phase 2a + Phase 2b) |
| Functional commits | 5 |
| Files changed (functional) | 3 (helpers.js + routes/user.js + tests/helpers.test.js new) |
| **Recoveries** | **1 (Recovery #80, adaptation-tier)** |
| Hot-fixes | **0 — streak preserved per Lesson #35** |
| Strategic scope decisions | 2 (Path 2 backend-first, scope expansion к 3 endpoints) |
| **Methodology contributions** | **1 — code-complete + deferred-verify closure shape** |
| New lesson candidates | 0 |
| Tests added | 6 (71 baseline → 77 final) |
| Preventive split applications | 0 |
| Reactive split applications | 0 |

### Эпик 6 progress

**4/13 sub-epics done (31%).** Roadmap expanded 11 → 13 due к 6B-3a-backend + 6B-3b split (originally planned 6B-3 single sub-epic).

### Sub-Epic 6B-3a-backend — CODE COMPLETE clean ✅, deploy verify DEFERRED

### Streak status

**20 (PRESERVED, NOT incremented)** — unusual closure pattern. Will transition к **21 ONLY after deploy verify completes pre-6B-3.**

This is the first sub-epic в Эпике 6 (and в running streak counter overall) closing с streak gated on user-side action external to designated branch. Honest accounting of closure status.

### Carry-overs forward to 6B-3+ + 6C (entering 6B-3a-backend: 6 items, exiting: 8 items)

| # | Item | Source | Status post-6B-3a-backend |
|---|---|---|---|
| 1 | Achievement badge для retirement | 5Q drop, κ Path B | CARRY-OVER |
| 2 | HudProfile card-creep monitor | 5L+ → 5S Q1.3 | MONITOR-FORWARD (still 6/7, **6B-3a-backend NOT triggered** ✓ — no HUD touched) |
| 3 | Lesson #36 validation track | 5R | CARRY-OVER |
| 4 | Auth + Wallet visual redesign | 6A | CARRY-OVER (6B-10) |
| 5 | `/rules` → v2 port | 6B-1 Phase 0 | CARRY-OVER |
| 6 | 3D models + devices system | 6B-2 user direction | CARRY-OVER (post-migration) |
| 7 | **NEW: Locale cleanup (10 → English-only)** | 6B-3a user direction | NEW CARRY-OVER (Эпик 7+ scope) |
| 8 | **NEW: `/user/search` `sortBy=balance` query param** | 6B-3a Phase 1 finding (Commit 4 re-investigation) | NEW CARRY-OVER (secondary leak vector — sort by private financial field exposes relative inferences even через filtered response; out of 6B-3a-backend scope; follow-up sub-epic candidate) |

**Net 6B-2 → 6B-3a-backend accounting:** 6 entering 6B-3a-backend → 8 leaving (6 carried forward unchanged + 2 new from session findings).

### Closed in 6B-3a-backend

- ✅ Critical privacy leak across 3 guest endpoints (`/login/:login`, `/id/:id`, `/search`) — all responses now use `formatUserPublicResponse`
- ✅ New helper + integration tests + ТЗ template corrections (achievementId convention)
- ✅ Path 2 (backend safety first) strategic decision implemented
- ✅ Code-complete + deferred-verify closure pattern established as methodology contribution

### Pending к 6B-3 onwards

- **MANDATORY:** Pre-6B-3 deploy verify task (separate ТЗ when user ready)
- 6B-3 (frontend `/user/:userLogin` guest profile UI) — gated until deploy verify success
- 6B-3b (entry points wiring — ClanRoster + Ratings + Friends к view profile) — split from 6B-3
- All other Эпик 6 carry-overs (clan dynamic, ratings full, profile sub-routes, PvP/matchmaking, spectate, etc.)

### ⚠ MANDATORY pre-condition для 6B-3

**Before 6B-3 Phase 1 starts, deploy verify MUST complete:**

1. Cherry-pick 5 commits (`6510ff5..aa1ad73`) onto new branch from main HEAD (suggested name: `fix/user-public-response`)
2. Push new branch
3. Open PR → main
4. Merge → Railway auto-deploy на `api.hexlash.com`
5. Authenticated curl probe `/v1/user/login/:someone` → verify response shape:
   - **Contains:** `id`, `login`, `name`, `avatarUrl`, `rating`, stats (totalFights/wins/losses/draws + pve/pvp variants), `achievements`, `captain`, `createdAt`, `isBlocked`, `luckPercentage`, `invitedUsers`, `clanId`, `clanRole`, `skin`
   - **Does NOT contain:** `email`, `balance`, `walletAddress`, `wonTokens`, `freeTokens`, `progression`, `deck`, `settings`, `language`, `updatedAt`, `inviteId`, `referredBy`
6. After verify success → 6B-3a-backend streak transitions **20 → 21**
7. 6B-3 Phase 1 ТЗ unblocked

**Until verify completes, 6B-3 Phase 1 ТЗ MUST NOT be executed** even if all other pre-conditions met.

### Acceptance checklist

- [x] `formatUserPublicResponse` helper created (privacy-safe variant)
- [x] 3 guest endpoints switched (`/login/:login` + `/id/:id` + `/search`)
- [x] `formatUserResponse` preserved untouched (own contexts: `/me`, `/edit`, WS handler)
- [x] Integration tests added (6 new, 77 total pass, 0 regressions)
- [x] Build clean (node --check × 5 commits)
- [x] Sandbox functional verify pass (Commit 1 probe — 0 private leaks across 15 sensitive fields)
- [x] Recovery #80 documented (adaptation-tier, streak preserved)
- [x] FINAL_REPORT_6B3a-backend.md created (this commit, Phase 2a)
- [ ] CLAUDE.md updated с 3 edits (Phase 2b — forthcoming)
- [ ] **Deploy verify** — DEFERRED к pre-6B-3 mandatory step
- [ ] **Streak 20 → 21 transition** — gated на deploy verify (unusual closure pattern, NOT closed in this Phase 2)

---

**End of EPIC 6B-3a-backend Final Report.**
