# Sub-epic 8 — Phase 0 Investigation Report — Part 2B (Mandatory subsections + Path candidates + Risks)

**Continued from:** `EPIC6_SUBEPIC_8_PHASE_0_REPORT_PART2A.md` (Q4-Q7)
**Final part of 3-part split.** Parts: PART1 (STEP 0 + Q1-Q3), PART2A (Q4-Q7), PART2B (this).

---

## 6 Mandatory Phase 0 Enhancement Subsections

Per Sub-epic 4a/4b/5/6/7 precedent (10/38/61/50/30 catches validated). Sub-epic 8 expected ~25-50 catches (L size — cutover novelty).

### Subsection 1 — API contract verification

**Vue Router 4 redirect entry exact syntax** (verified via existing 6A-cutover patterns):

```js
// String-form (path 1:1 mapping):
{path: '/help', redirect: '/v2/help'},

// Function-form (param transform):
{path: '/fighter/:key', redirect: to => `/v2/fd/${to.params.key}`},

// Named-form (typed param):
{
    path: '/user/:userLogin',
    redirect: to => ({ name: 'V2UserProfile', params: { userLogin: to.params.userLogin } }),
},
```

Notes:
- `redirect` field is alongside `path` field (NOT inside `meta`)
- `name` field optional in redirect entries (но если присутствует, route registered с тем names)
- No `props: true` needed in redirect entries (passes through to target)
- Auth applied BEFORE redirect resolves (via `router.beforeEach` guard, line 224)

**Friends `/v1/friends/list` API shape** (verbatim from `backend/src/routes/friends.js:225-239`):

```js
{
  id: friend.id,
  username: friend.name || friend.login,
  login: friend.login,
  rating: friend.rating,
  avatarUrl: friend.avatarUrl,
  skin: friend.skin,
  status: 'online' | 'offline',  // NOT 'in_fight' currently
  addedAt: f.createdAt.getTime(),
  captain: captainMap.get(friend.id) || null,
}
```

**`currentFight` field NOT in response** — Sub-epic 8 Q6 BE addition needed if Watch Live closure bundled.

**ErrorMsg shape (sendError helper, line 480-486):**

```js
function sendError(ws, code, message) {
    ws.send(JSON.stringify({
        type: 'error',
        errorDto: { code, message },
    }));
}
```

Sub-epic 7 C3 added FE tolerant parser handling both `{errorDto: {code, message}}` AND flat `{error, code}`. Carry-over #31: 5 BE callsites bypass `sendError` helper (specific list requires deeper grep).

**WS message inventory still relevant for cutover** (verified Sub-epic 4a-6):

PvP fight (V2Fight):
- `pvp_ready`, `round_result`, `dice_roll`/`dice_rolled`/`dice_available`, `coach_pause`/`coach_choice`/`coach_result`, `fight_end` (с reason branching), `overdrive_start`, `pvp_surrender`, `fight_state_resume`, `match_cancelled`

Spectate (V2Spectate):
- `SpectateJoin`, `SpectateLeave`, `SpectatorListMsg`, plus broadcast versions of above 7 PvP events

Matchmaking (V2Matchmaking):
- `MatchmakingStartMsg`, `MatchmakingCancelMsg`, `MatchFoundMsg`, `MatchmakingQueueMsg`, `match_cancelled`

Friends (HudProfile Friends card):
- `friend_status`, `challenge_received`, `challenge_start`, `challenge_declined`

### Subsection 2 — Negative-space verification

**Что НЕ существует — для предотвращения assumption errors:**

**Routes that DO NOT exist (handoff metadata mismatch sweep):**

⚠️ **Recovery #90 — Lesson #45 12th occurrence:**

| Handoff reference | Реальность |
|---|---|
| `/v2/profile/wallet` (handoff line 353) | DOES NOT EXIST. Real: `/v2/wallet` (V2Wallet name) |
| `/v2/profile/account` (potentially implied) | DOES NOT EXIST. Real: `/v2/account` (V2Account name) |

`/v2/profile/skins` also DOES NOT EXIST — `/profile/skins` redirects к `/v2/profile` (Sub-epic 6B-2 deprecation).

**Sweep result:** Single `/v2/profile/wallet` reference в handoff (line 353 only). `/v2/profile/account` correctly not referenced. CLAUDE.md clean.

**v1 views already removed (NONE — all 17 still present):**

Per `ls src/views/`:
- All 17 v1 views still present on disk
- No file deletion has occurred yet across Эпик 6 (only routing redirects)

**Assumed orphans actually still imported (verify before delete):**
- `src/views/ProfileView.vue` — assumed orphaned per Sub-epic 1, BUT verify `grep -rn "import.*ProfileView" src/`
- `src/views/ClanView.vue` — assumed orphaned per Sub-epic 1
- `src/views/AgentDetailView.vue` — assumed orphaned per Sub-epic 4 era
- `src/views/CreateAgentView.vue` — assumed orphaned
- `src/views/TrainingView.vue` — assumed orphaned

**Verification commands (must run pre-deletion in Sub-epic 8 Phase A):**

```bash
grep -rn "import.*from.*'@/views/ProfileView'" src/
grep -rn "import.*from.*'@/views/ClanView'" src/
grep -rn "import.*from.*'@/views/AgentDetailView'" src/
grep -rn "import.*from.*'@/views/CreateAgentView'" src/
grep -rn "import.*from.*'@/views/TrainingView'" src/
```

If 0 imports + no router refs (verified Q1.1) → safe atomic delete. Если import surface — STOP, investigate.

**Vuetify v2 area imports (negative — components that DON'T import Vuetify в v2 area):**

Most `views-v2/*.vue` files и `components/hud/Hud*.vue` files do NOT import Vuetify directly. The 5 v2 HUDs that show v-* patterns (HudClan / HudClanEmpty / HudProfileWallet / HudSocialTasks / HudRetirement) — verify:
- May be false-positive scan matches (CSS class names containing "v-" не Vuetify)
- May be reused fragment templates (legacy fragments wrapped в v2 HUDs)

Per Sub-epic 7 AW3 closure: most Vuetify residual in v2 area is **reused legacy fragments preserved verbatim** (Login/Reset/Signup/TelegramLogin auth + ChangeLogin/ChangePassword/DeleteAccount account + ConfirmEmail). Sub-epic 8 deletion of v1 views does NOT cascade к delete of these reused fragments (still consumed by RainView auth).

**Legacy stylesheets — NOT removable Sub-epic 8:**
- `src/assets/colors.css` — sole consumer PrivacyView (auto-generated legal HTML), KEEP
- `src/assets/main.css` — global scroll patterns, used by legacy v1 + v2 layouts
- `src/styles/hexlash-ui.css` — canonical taxonomy used by both legacy + v2

### Subsection 3 — Real CSS class taxonomy dump

**Vuetify global stylesheet:** Vue plugin `vite-plugin-vuetify` injects styles globally. No explicit Vuetify CSS file in `src/`. Removal требует package-level dependency removal (Эпик 7+).

**`.app-v2 ` prefix consistency check** (per Sub-epic 7 lessons + audit):

`src/styles/v24/*.css` — all 12 v24 CSS files use `.app-v2 ` prefix для namespacing per established convention.

`src/styles/hexlash-ui.css` — canonical taxonomy. Some classes like `.hex-modal-*`, `.hex-spinner`, `.mod-badge*` are NOT prefixed (they live globally for Teleport-to-body modals + cross-component reuse per Sub-epic 7 C9/C15 expansion DRY pattern).

**`.hex-*` taxonomy full inventory** (key classes, verified canonical):
- `.hex-button` + variants (primary/secondary/ghost/danger/archetype) + sizes (sm/md/lg)
- `.hex-card` + variants (default/elevated/archetype/active/result) + padding sizes
- `.hex-progress` + variants (hp/branch/generic)
- `.hex-badge` + variants (archetype/branch/status/counter/custom)
- `.hex-modal-overlay` + `.hex-modal-content` + `.hex-modal-title` + `.hex-modal-body` + `.hex-modal-actions` + `.hex-modal-close` (Sub-epic 7 C9 expansion)
- `.hex-spinner` + `hex-spin` keyframes (Sub-epic 7 C9 canonical)
- `.mod-badge` + `.mod-badge-icon` + `.mod-badge--{adrenaline,shield,blind}` (Sub-epic 7 C15 extraction)
- `--hex-*` CSS variables (color, font, spacing tokens)

**`.v-*` legacy Vuetify classes still in use:**

5 v2 HUDs show patterns matching `v-btn|v-card|v-modal|v-dialog|v-text-field|v-progress`:
- HudClan.vue (1 hit)
- HudClanEmpty.vue (2 hits)
- HudProfileWallet.vue (1 hit)
- HudSocialTasks.vue (1 hit)
- HudRetirement.vue (1 hit per inventory)

Per HudRetirement Sub-epic 5Q closure — uses HexButton + canonical CSS spinner per v2 design system. The "1 hit" likely false-positive scan (e.g., `v-tooltip` class string или `v-show` directive — neither Vuetify primitive).

Reused fragments (legacy preserved) are explicit Vuetify consumers — these augmented for v2 reuse but Vuetify primitive remained per Sub-epic 7 scope discipline.

**Migration completeness verification:**
- Sub-epic 7 AW1+AW2+AW3 closed Vuetify→v2 design system migration for buttons + spinners + modal taxonomy (canonical)
- InputField primitive preserved (Sub-epic 3 Q-tactical-Phase1-3)
- VModal preserved для confirm dialogs (Sub-epic 7 AW3 scope discipline)
- Full Vuetify removal = Эпик 7+ refactor sub-epic

### Subsection 4 — UI infrastructure dependencies

**Cutover redirect chain integrity** (verified Vue Router 4 behavior):

```
Old route (/fight) → router.beforeEach guard (auth check)
                  → if authenticated, redirect resolves
                  → new route (/v2/fight) loaded
                  → V2Fight component mounted (FightView.vue)
                  → v2ProtectedNames check (V2Fight in marker array)
                  → guard re-applies (already authenticated, passes)
                  → component initialization
```

**Auth guard semantics (verified `router.beforeEach`, lines 214-252):**
- Match conditions: `route.name === to.name || route.path === to.path`
- v2ProtectedNames check: `v2ProtectedNames.includes(to.name)`
- Both checks chained via OR
- Behaviour after redirect: `to.name` is the NEW route's name, so v2ProtectedNames check applies to TARGET route correctly

**Query params + hash fragments preservation:**

Vue Router 4 default redirect behavior:
- String redirect `/v2/foo`: query and hash NOT preserved by default
- Function redirect: `to` includes query/hash, can manually preserve via return object

For Sub-epic 8 cutover, query/hash preservation generally NOT needed (бookmarks rarely include these for cutover candidates). If needed, function-form:

```js
{path: '/spectate/:odId', redirect: to => ({
    path: `/v2/spectate/${to.params.odId}`,
    query: to.query,
    hash: to.hash,
})},
```

**Back-button behavior post-redirect:**

Vue Router 4 default: redirect REPLACES history entry (not pushed). Back button skips redirected URL и goes к previous entry.

Example: User on `/some-page` → navigates `/fight` → redirected к `/v2/fight` → presses back → goes к `/some-page` (NOT `/fight`).

This is desirable behavior для cutover (avoids redirect loop on back).

**5 functional areas verification chain (Q1.2 reference):**

Per area: open route → verify HUD render → click primary action → verify state change → verify navigation → close → verify cleanup.

Specific chain dependencies verified during investigation:
- Auth → Vuex `master/login` action → API call → master state populated → router push к `/`
- Wallet → wagmi `useConnect` → modal opens → user selects connector → connect resolves → master state updated via watcher
- Account → modal click → action dispatch → API call → success toast → modal close
- Spectate → SpectateJoin emit → BE responds SpectatorListMsg → state hydrate → ws events flow into HUD
- Fight → pvp_ready → fight_start → round_result loop → fight_end with reason

### Subsection 5 — Vocabulary alignment audit

**Old v1 path → new v2 path final inventory** (consolidating Q2.1 + carry-over #16 reclassifications):

**Already cutover (no action Sub-epic 8):**

| v1 Path | v2 Path | Sub-epic |
|---|---|---|
| `/help` | `/v2/help` | 6B-1 |
| `/training` | `/v2/training` | 6A |
| `/create-fighter` | `/v2/create` | 6A |
| `/fighter/:key` | `/v2/fd/:key` | 6A |
| `/profile` | `/v2/profile` | 6A |
| `/profile/balance` | `/v2/profile` | Sub-epic 3 |
| `/profile/wallet` | `/v2/wallet` | Sub-epic 3 |
| `/profile/account` | `/v2/account` | Sub-epic 3 |
| `/profile/skins` | `/v2/profile` | 6B-2 |
| `/user/:userLogin` | `/v2/user/:userLogin` | 6B-3 |
| `/clan/:id` | `/v2/clan/:id` | Sub-epic 1 |

**Cutover candidates Sub-epic 8 (5+ routes, depending on path):**

| v1 Path | v2 Path | Param transform? |
|---|---|---|
| `/fight` | `/v2/fight` | No (path 1:1) |
| `/matchmaking` | `/v2/matchmaking` | No |
| `/spectate/:odId` | `/v2/spectate/:fightId` | YES — param rename `:odId` → `:fightId` |
| `/ratings/:type` | `/v2/ratings` | YES — drop `:type` (4 internal tabs subsume) |
| `/friends` | `/v2/profile` (HudProfile Friends card) | YES — different page, query may need preserve |
| `/arena/fight` | (no v2 equivalent) | DECISION |
| `/arena/club` | (no v2 equivalent) | DECISION |

**View component name mapping** (для legacy file deletion):

| v1 Component (`src/views/*.vue`) | Replaced by v2 |
|---|---|
| ProfileView.vue | views-v2/ProfileView.vue (Sub-epic 5B) |
| ClanView.vue | views-v2/ClanView.vue (Sub-epic 5D) + GuestClanView.vue (Sub-epic 1) |
| AgentDetailView.vue | views-v2/FighterDetailView.vue (Epic 4) |
| CreateAgentView.vue | views-v2/CreateView.vue (Epic 3Bc) |
| TrainingView.vue | views-v2/TrainingView.vue (Epic 3Ba) |
| MatchmakingView.vue | views-v2/MatchmakingView.vue (Sub-epic 5) |
| SpectateView.vue | views-v2/SpectateView.vue (Sub-epic 6) |
| CardFightView.vue | views-v2/FightView.vue (Sub-epic 4a/4b) |
| RatingsView.vue | views-v2/RatingsView.vue (Sub-epic 2 — Path D structure) |
| FriendsView.vue | HudProfile Friends card (Sub-epic 5B integration) |
| FightClubView.vue | (no v2) — DECISION |
| PreparationView.vue | (no v2) — DECISION |
| RainView.vue | KEEP (auth backdrop, never cutover) |
| PrivacyView.vue | KEEP (legal page) |
| NotFoundView.vue | KEEP (404 fallback) |
| PageView.vue | (carry-over #5 — `/rules` v2 port deferred) |
| VerifyEmailView.vue | KEEP (verify flow) |

**Asset paths:** No asset path changes anticipated в Sub-epic 8 (cutover is route-level, не asset-level).

### Subsection 6 — Semantic invariant + flow direction verification

**MANDATORY — PROMOTED Sub-epic 6.** Critical для cutover specifically.

**Route resolution semantics — old route guards trigger after redirect:**

Vue Router 4 behavior:
- `router.beforeEach` runs ONCE per navigation
- For redirect: guard runs FIRST с original `to`, sees redirect, resolves к target, guard runs AGAIN с new `to` (target route)
- Auth check applied to TARGET route (post-redirect), not original

Example: User hits `/fight` (auth-protected) → guard сheck `to.name === 'Fight'` (true, authenticated) → redirect resolves к `/v2/fight` → guard check `to.name === 'V2Fight'` (`v2ProtectedNames.includes('V2Fight')` true) → authenticated, proceed.

**Redirect cascade behavior:**

Existing cascades в router:
- `/club/:id` → `/clan/:id` → `/v2/clan/:id` (2-step cascade)
- `/club/agent/create` → `/create-fighter` → `/v2/create` (2-step)
- `/arena/club/:agentId` → `/fighter/:agentId` → `/v2/fd/:agentId` (2-step)

Vue Router 4: cascading redirects work transparently. Each intermediate redirect resolves until final non-redirect route.

**Risk:** Infinite loop possible if circular redirect created. Mitigate by careful path design (one-way arrows: legacy → v2, never v2 → legacy).

**Post-cutover state machine — which `/v1` routes remain valid:**

After Sub-epic 8 cutover (Path α atomic):

**KEEP routes (production-ratified post-cutover):**
- All authRoutes (`/auth/*`)
- `/` (Home — RainView)
- `/privacy` `/404` `/rules` `/verify-email` `/r/:username`
- All v2Routes (now de facto default)
- All redirect entries (legacy URL bookmark survival)

**REMOVED routes (post Phase B v1 view deletion):**
- v1 components disappear from disk (`src/views/CardFightView.vue` etc.)
- Router entries for `/fight` `/matchmaking` `/spectate/:odId` `/ratings/:type` `/friends` BECOME redirects (not removed) — preserve bookmark survival

**KEEP/DECISION:**
- `/arena/fight` `/arena/club` — depends on v2 equivalent decision
- `/club/:id` `/club/agent/*` `/arena/club/*` cascading redirects — preserve OR cleanup (Эпик 7+)

**BE-truth invariants vs derived FE state в migration boundaries:**

**Carry-over #16 future-Claude warning** (per CLAUDE.md Sub-epic 4b/5/6 + 7):
- `src/components/pvp/ChallengeNotification.vue:62` hardcode `isPlayer1: false` IS semantically correct
- BE invariant: `pvpMatchManager.createMatch(matchId, {challenger as player1}, {acceptor as player2})`
- `handleChallengeAccepted` runs on acceptor side, who IS player2 by convention
- Original 4a "fix" classification inverted — overwrite cascade в FightView `onPvPFightStart` is defensive redundancy, не corrective
- ТЗ proposed derivation `data.opponent?.odId !== userData.id` would always evaluate `true` → would set `isPlayer1: true` on acceptor → **inverted from correct value**

**Sub-epic 8 Phase 1 must NOT "fix" к computed expression.**

**Carry-over #27 reclassification** (per CLAUDE.md Sub-epic 7):
- Dice cooldown countdown UI: v1 FE round-counter NOT portable к v2 BE-truth dice model
- v2 binary `diceReady` flag intentional (Sub-epic 4a-6 BE-truth migration)
- Future BE protocol extension required (`cooldownRemaining` field в `dice_unavailable` event)
- Mirror precedent #16

**Sub-epic 8 Phase 1 must NOT "implement #27" via FE round counter.**

**ChallengeNotification routing branch behavior post-cutover:**

`ChallengeNotification.vue` has v2-aware routing branch (Sub-epic 7):
```js
if (router.currentRoute.value.path.startsWith('/v2')) {
    router.push('/v2/fight');
} else {
    router.push('/fight');  // legacy v1
}
```

Post-cutover (Path α): `/fight` redirects к `/v2/fight`. Branch behavior:
- Legacy branch fires `router.push('/fight')` → guard → redirect resolves → `/v2/fight` loads
- Functionally same end state as v2 branch

**Recommendation:** ChallengeNotification routing branch SAFE post-cutover (no break), но SIMPLIFICATION possible (drop branch, always `router.push('/v2/fight')`). Optional polish, not Sub-epic 8 scope blocker.

---

## Path Candidates Strategic Basis Table

**Final consolidated table per Q2.4 investigation + Hexlash-specific factors:**

| Path | Кратко | Routes | LOC | Legacy preserved | Production impact | Hexlash pros | Hexlash cons |
|---|---|---|---|---|---|---|---|
| **α — Atomic** | Single-commit redirect ALL 5-6 v1 paths | 5-6 (one commit) | ~10-15 lines | All v1 .vue (separate Q3 commits) | Immediate cutover all users next page load | Cleanest semantic, lowest legacy debt, simplest rollback (single revert), matches 6A precedent, fits user-driven acceptance gate model | High blast radius, regression в any area surfaces simultaneously, telegram WebApp mobile risk, BE-FE integration regressions surface together |
| **β — Phased** | Per-feature redirect commits | 5-6 (separate commits) | ~3-5 lines per commit | Same as α | Per-commit incremental | Lower per-commit risk, granular rollback, per-commit acceptance gate verify possible, fits Mode A discipline naturally, better incident isolation | More commits (5-6 functional + closure = 8-10 total), each commit needs build/push/verify cycle, full sweep gate still required, cherry-pick coordination if BE deploy split needed |
| **γ — Soft** | Default route change + v1 fallback (UI links only) | UI links across ~10-15 components | ~30-50 lines | ALL v1 .vue preserved indefinitely | Gradual migration (both versions work) | Lowest production user impact, easiest rollback (UI changes only), safer if v2 has subtle regression | Highest legacy debt going forward, Эпик 6 not "complete" semantic, increases Эпик 7+ cleanup scope significantly, ambiguous "current state", doesn't match Эпик 6 closure intent |
| **δ — Hybrid** | Atomic for confident routes, preserve v1 для uncertain | 3 cutover + 4 preserved = 7 | ~5-10 lines | RatingsView/FriendsView/PreparationView/FightClubView | Mixed (PvP fully v2, navigation/preparation legacy) | Risk-managed (high-confidence atomic, uncertain stay v1), preserves PreparationView+FightClubView (no v2 equivalent), scope clarity, fits "code-complete + deferred-deploy" closure shape | Mixed semantic state, "what's current?" confusion, requires explicit decision per uncertain route, Эпик 6 closure has split semantics |

**Recommendation factual basis (NOT user decision):**

- **Path α** if acceptance gate passes cleanly across all 5 functional areas. Lowest legacy debt going forward. Matches "single closure" Эпик 6 semantic.
- **Path β** if user prefers conservative incremental approach. Trade longer Sub-epic 8 для safety.
- **Path γ** if user wants safer rollback option. Trade legacy debt для production safety.
- **Path δ** if PreparationView+FightClubView decision uncertain — preserve v1 для these, atomic для PvP routes. Trade clean closure semantic для risk management.

**User decision needed early Sub-epic 8 Phase 1 perевод pre-Phase 1 STOP-and-confirm gate.**

---

## Identified Risks / Open Questions

### Critical risks (Sub-epic 8 blockers if not addressed)

1. **Backend deploy dependency для Spectate (Q4.2)** — Sub-epic 6 BE infrastructure (C1-C5, C9.5) НЕ deployed к production main. `/v2/spectate/:fightId` cutover non-functional until backend deployed. **Sub-epic 8 deploy chain MUST include backend deploy.**

2. **Continue-stack reconciliation strategy (Q2.5)** — 30+ commits accumulated, requires user decision on merge approach (Q2.5-A/B/C/D). Production deploy method depends on this choice.

3. **Acceptance gate failure recovery path (Q1.4)** — User-driven manual ratification critical. If failure surfaces, Lesson #18 STOP framework mandatory. Decision: fix-forward vs rollback.

### Open questions for user decision

1. **Cutover path α/β/γ/δ choice (Q2.4)** — required early Sub-epic 8 Phase 1.

2. **Continue-stack reconciliation Q2.5-A/B/C/D** — required for deploy planning.

3. **PreparationView + FightClubView disposition** — keep v1, design new V2, OR retire (Sub-epic 8 scope decision).

4. **Friends "Watch Live" closure (Q6)** — bundle BE in Sub-epic 8 OR defer Эпик 7+. If bundle:
   - Q6-A (Friends only) ИЛИ
   - Q6-A + Q6-B (Friends + ErrorMsg consolidation) ИЛИ
   - Q6-C (defer)

5. **i18n bundle (Q7)** — XS bundle cheap (22 lines), recommend include. User confirms.

6. **Legacy file deletion scope (Q3.1)** — Phase A orphans (5 files safe atomic), Phase B cutover-dependent (5 files), Phase C decision-pending (2 files PreparationView+FightClubView). Confirm scope.

7. **Vuetify dependency removal (Q3.2)** — Sub-epic 8 minimal (Phase A cascade) vs Эпик 7+ full removal. Recommend minimal.

8. **`/friends` cutover destination** — `/v2/profile` (HudProfile Friends card) vs preserve v1 (Sub-epic 5B integration sufficient OR full FriendsView v2 port needed).

### Recovery candidates surfaced (Phase 0)

- **Recovery #89 — Lesson #43 9th occurrence** (bootstrap branch divergence, adaptation-tier — already authorized Option B per Lesson #44).
- **Recovery #90 — Lesson #45 12th occurrence** (handoff metadata error: `/v2/profile/wallet` ≠ real `/v2/wallet`). Single occurrence handoff line 353. Future ТЗ для Sub-epic 8 must reference `/v2/wallet` not `/v2/profile/wallet`.

### Lesson candidates active entering Sub-epic 8 (7)

- #36 (HudProfile card-creep monitor — 6/7 threshold)
- #37 (sandbox capability empirical verification — pre-formal)
- #38 (multi-layer deploy environment awareness — pre-formal sub-pattern of #33)
- #39 (pre-migration callsite enumeration / generic-word scoping — Lesson #11 i18n specialization)
- #40 (locale section-ordering variance — sub-pattern of #11)
- #41 (visual verify gate ≠ end-to-end test)
- #42 (pre-existing bugs surface during visual verify)

**Sub-epic 8 may surface 2nd occurrences for any of these → promotion candidates.**

### Methodology applied этой Phase 0

- **Lesson #11 reflex** — pre-edit verification on every assertion. Recovery #90 caught via this.
- **Lesson #18 STOP framework** — applied к Recovery #89 (branch divergence) → user-authorized re-anchor decision via Lesson #44.
- **Lesson #32 convention discovery** — verified Vue Router 4 redirect syntax patterns (3 forms) vs ТЗ assumptions; verified Friends `/list` actual response shape vs assumed shape.
- **Lesson #33 deploy environment awareness** — surfaced Sub-epic 6 BE deploy gap dependency для Sub-epic 8 cutover (Q4.2 + Q6.3).
- **Lesson #43 PROMOTED** — STEP 0 applied as mandatory first step.
- **Lesson #44 PROMOTED** — re-anchor scope after branch divergence applied (Option B authorization).
- **Lesson #45 PROMOTED** — Phase 0 metadata error pattern applied retroactively to handoff itself (Recovery #90 surface).

### Methodology contributions THIS Phase 0 (potential candidates)

- **Triple-layer split rationale documentation** — preventive split framework 8th application reactive variant. Pattern: 2-part split planned, 3-part split applied after timeout pattern surface. Documents 5R/5T/5U pattern reactive variant explicitly.
- **Handoff metadata error retroactive sweep** — Lesson #45 12th occurrence demonstrated value of retroactive sweep. Pattern для future Phase 0 reports: actively grep handoff for path/file references, verify each against actual code.

---

## Summary

**Phase 0 deliverables:**

| Part | File | Lines | Coverage |
|---|---|---|---|
| 1 | `EPIC6_SUBEPIC_8_PHASE_0_REPORT_PART1.md` | ~855 | STEP 0 + Q1-Q3 |
| 2A | `EPIC6_SUBEPIC_8_PHASE_0_REPORT_PART2A.md` | ~410 | Q4-Q7 |
| 2B | `EPIC6_SUBEPIC_8_PHASE_0_REPORT_PART2B.md` | this | 6 mandatory subsections + path candidates basis + risks |
| **Total** | — | ~1700 | Comprehensive |

**Key findings:**

1. **17 v2Routes** все children of `/v2` parent. v2ProtectedNames marker pattern (3 PvP routes auth-protected). 14/16 child routes effectively public.
2. **5 cutover candidates** для Sub-epic 8 Phase 1: `/fight`, `/matchmaking`, `/spectate/:odId` (param rename к `:fightId`), `/ratings/:type`, `/friends`.
3. **Backend deploy dependency** — Sub-epic 6 BE infrastructure (Spectate handlers + match.spectators) НЕ deployed к production main. Sub-epic 8 MUST include backend deploy (Lesson #33 6th application).
4. **Continue stack ~30+ commits** ahead of main. Reconciliation strategy Q2.5-A/B/C/D requires user decision.
5. **Recovery #90 surfaced** — handoff metadata error `/v2/profile/wallet` (real: `/v2/wallet`). Single occurrence, isolated.
6. **Phase A orphan deletions** safe atomic: ProfileView/ClanView/AgentDetailView/CreateAgentView/TrainingView (5 files).
7. **Friends "Watch Live"** dead code currently — `currentFight` field NOT в `/v1/friends/list` response. Q6 bundle decision required.
8. **i18n bundle** XS (22 lines, 2 missing spectate keys × 11 locales). Recommend include.

**Open questions:** 8 identified для user decision early Sub-epic 8 Phase 1.

**Recovery candidates:** 2 (#89 + #90), both adaptation-tier per Lesson #35 — streak preserved.

**Phase 0 → Phase 1 transition:** awaiting user decisions on path candidate (α/β/γ/δ), Q2.5 reconciliation (A/B/C/D), Q6 Friends bundle, Phase A/B/C scope confirmation. Recommend STOP-and-confirm gate before Phase 1 first commit.

---

**Phase 0 Report — END.**

**Streak entering: 31. Streak exiting Phase 0: 31** (Phase 0 read-only, no commits, no streak change).

**Sub-epic 8 ready to enter Phase 1 после user decisions on 8 open questions.**
