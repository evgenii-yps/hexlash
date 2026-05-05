# Sub-epic 8 — Phase 0 Investigation Report — Part 1 (STEP 0 + Q1-Q3)

**Date:** 2026-05-05
**Branch:** `claude/investigate-cutover-gate-RpOyg` (designated, Option B per Lesson #44)
**HEAD:** `1a3db1d` (Sub-epic 7 closure 3 — handoff commit)
**Streak entering:** 31 ✅
**Recoveries entering:** 88+
**Lessons promoted entering:** 38
**Mode:** Read-only investigation (no edits, no commits) per ТЗ
**Output split:** 2 parts (preventive split per 5R/5T/5U infrastructure-driven framework, 8th application)

---

## STEP 0 — Bootstrap branch verification (Lesson #43 9th occurrence)

**Expected per ТЗ:**
- Branch: `claude/visual-polish-auth-wallet-6xe6m` (continue stack от Sub-epic 7)
- HEAD SHA: C18 = `1a3db1d`
- Working tree: clean

**Actual (verbatim git output):**

```
$ git fetch
[fetched all branches]

$ git status -uno
On branch claude/investigate-cutover-gate-RpOyg
nothing to commit (use -u to show untracked files)

$ git branch --show-current
claude/investigate-cutover-gate-RpOyg

$ git log --oneline -5
1a3db1d docs(7): closure 3 — Handoff Sub-epic 8 (FINAL Sub-epic 7 commit)
3c6e248 docs(7): closure 2 — Final Report Sub-epic 7
0aba5bb docs(7): closure 1 — CLAUDE.md update for Sub-epic 7 completion
0f59fe2 feat(polish): close HudSpectate active effects badges (#35) — final B5
e8a36eb feat(auth-wallet): port TelegramLogin к v2 — closes #4 (auth portion 3/3)
```

**Verification result:**
- Branch divergence: harness fresh-slug vs continue stack — **same SHA `1a3db1d`** ✅ (zero work-loss risk)
- Working tree: clean ✅
- HEAD: matches expected Sub-epic 7 closure ✅

**Recovery #89 logged** — Lesson #43 9-occurrence chain validated:
1. 5U (5U closer slot)
2. Sub-epic 2
3. 4a Phase 0
4. 4b Phase 0
5. 5 Phase 0
6. 6 Phase 0
7. 6 CL1 boundary
8. 7 Phase 0 (Recovery #88)
9. **8 Phase 0 (Recovery #89)** ← this one

Adaptation-tier per Lesson #35 (environment/harness configuration discrepancy, не code bug).

**Re-anchor decision (Lesson #44):** **Option B** — proceed на designated branch `claude/investigate-cutover-gate-RpOyg`.

**Rationale:**
1. **5U closer-slot precedent** — Sub-epic 8 IS closer для Эпик 6 (mirror того, как 5U был closer для Эпик 5 на designated branch breaking 11-decision continue stack precedent).
2. **HANDOFF_EPIC6_CUTOVER §3 R5 explicit guidance** — continue stack reconciliation deferred к Sub-epic 8 cutover. Sub-epic 8 IS that cutover.
3. **Branch name semantic match** — `investigate-cutover-gate-RpOyg` буквально matches task scope ("cutover gate").
4. **Continue-stack 5-decision chain (Recoveries #82/#85/#86/#87/#88) накопил большой stack без production deploy** — natural break point для cutover ratification.

**Continue stack `claude/visual-polish-auth-wallet-6xe6m` reconciliation:** deferred к Sub-epic 8 functional phase (см. Q2.5).

---

## Q1 — Pre-cutover acceptance gate scope

### Q1.1 — Full /v2 routes inventory

Source: `/home/user/testhexlash/src/router/index.js` (255 lines).

**v2Routes (17 children of `/v2` parent):**

| # | Path | Name | Component | Auth | Notes |
|---|---|---|---|---|---|
| 0 | `/v2` (parent) | V2Root | AppV2.vue | — (parent shell) | Lazy-loaded |
| 1 | `/v2` (index) | V2Pit | PitViewV2.vue | NO | Hub (default child) |
| 2 | `/v2/fd/:key` | V2FighterDetail | FighterDetailView.vue | NO | Dynamic UUID + legacy mocks |
| 3 | `/v2/fight` | V2Fight | FightView.vue | **YES** (v2ProtectedNames) | PvP real |
| 4 | `/v2/training` | V2Training | TrainingView.vue | NO | Heavy bag |
| 5 | `/v2/matchmaking` | V2Matchmaking | MatchmakingView.vue | **YES** (v2ProtectedNames) | Real BE |
| 6 | `/v2/create` | V2Create | CreateView.vue | NO | Agent creation |
| 7 | `/v2/profile` | V2Profile | ProfileView.vue | NO | Own profile (4-card HUD) |
| 8 | `/v2/ratings` | V2Ratings | RatingsView.vue | NO | 4-tab leaderboard |
| 9 | `/v2/clan` | V2Clan | ClanView.vue | NO | Own clan view (5D) |
| 10 | `/v2/clan/:id` | V2GuestClan | GuestClanView.vue | NO | Guest clan (Sub-epic 1) |
| 11 | `/v2/shop` | V2Shop | ShopView.vue | NO | Cosmetics catalog |
| 12 | `/v2/spectate/:fightId` | V2Spectate | SpectateView.vue | **YES** (v2ProtectedNames) | Real BE (Sub-epic 6) |
| 13 | `/v2/help` | V2Help | HelpView.vue | NO | Help page (6B-1) |
| 14 | `/v2/user/:userLogin` | V2UserProfile | UserProfileView.vue | NO | Guest profile (6B-3) |
| 15 | `/v2/wallet` | V2Wallet | WalletView.vue | NO | Wallet (Sub-epic 3 Path A) |
| 16 | `/v2/account` | V2Account | AccountView.vue | NO | Account settings (Sub-epic 3) |

**v2ProtectedNames marker** (Sub-epic 4a P1 fix, line 77):
```js
const v2ProtectedNames = ['V2Fight', 'V2Matchmaking', 'V2Spectate'];
```

Auth applied via name marker matched in `router.beforeEach` guard (line 224-225):
```js
const isProtectedRoute =
    protectedRoutes.some(route => route.name === to.name || route.path === to.path) ||
    v2ProtectedNames.includes(to.name);
```

**14/16 v2 child routes effectively public.** 3 PvP-related routes auth-protected via marker. **Carry-over #10 (v2 cutover auth posture audit)** — group-level guard на `v2Routes` parent vs per-route `protectedRoutes` entries decision postponed к Sub-epic 8 territory (см. Q2 Path δ candidate).

### Q1.2 — 5 functional areas verification chain

#### Area 1 — Auth flows (RainView 3D rain backdrop)

| Route | Name | Component | Auth |
|---|---|---|---|
| `/auth/login` | Login | RainView.vue | NO |
| `/auth/signup` | Signup | RainView.vue | NO |
| `/auth/reset` | Reset | RainView.vue | NO |
| `/auth/telegram` | TelegramLogin | RainView.vue | NO |

**Component baseline:** `src/views/RainView.vue` (1212 lines per CLAUDE.md, Three.js + Kokomi + custom shaders). UNTOUCHED across all Sub-epic 7 AW1 commits.

**Auth fragments (post Sub-epic 7 AW1 redesign):**
- `src/components/fragments/auth/Login.vue` — HexButton + Vuex login
- `src/components/fragments/auth/Signup.vue` — HexButton + 3× InputField
- `src/components/fragments/auth/Reset.vue` — 2-state flow
- `src/components/fragments/auth/TelegramLogin.vue` — Telegram WebApp auto-login

**Vuex actions verified used:** `master/login`, `master/register`, `master/resetPassword`, `master/saveTelegramFlag`, `master/telegram`, `master/getResetState`, `master/clearResetState` (per CLAUDE.md Sub-epic 7 AW1 documentation).

**Visual tokens:** HexButton (5 variants), `.hex-spinner` (canonical), `--hex-primary`/`--hex-text-primary` design tokens, AnonymousBalance font для balance display.

**Recent changes (Sub-epic 7 C12-C14 AW1):** 4 fragments ported Vuetify→v2 design system. **RainView preserved verbatim** (per user decision — preserve 3D scene).

#### Area 2 — Wallet flows

| Route | Name | Component | Auth |
|---|---|---|---|
| `/v2/wallet` | V2Wallet | WalletView.vue | NO |
| `/profile/wallet` | — | redirect → `/v2/wallet` | (via redirect, auth applied legacy) |

**⚠️ HANDOFF METADATA ERROR DETECTED (Recovery #90 — Lesson #45 12th occurrence):**

ТЗ §"Pre-cutover acceptance gate" + handoff §"5 functional areas" reference `/v2/profile/wallet` — **THIS ROUTE DOES NOT EXIST.** Real route per `src/router/index.js:158-161`: `/v2/wallet` (V2Wallet name, WalletView.vue component).

History: Sub-epic 3 (Path A per-sub-route v2 ports) split `/profile/wallet` and `/profile/account` into standalone v2 views (`/v2/wallet` + `/v2/account`), NOT child routes of `/v2/profile`. Handoff §"5 functional areas" §2 carries forward outdated naming pattern from earlier sub-epics.

**Adaptation-tier per Lesson #35.** Future ТЗ для Sub-epic 8 must reference `/v2/wallet` not `/v2/profile/wallet`.

**Component baselines:**
- `src/views-v2/WalletView.vue` (89 lines) — orchestrator, Pattern A scene-shared 'profile'
- `src/components/hud/HudProfileWallet.vue` — Wallet HUD (~167 lines): GameBalanceCard mount + withdraw handler + ConnectWallet local mount

**Wagmi composables (per Sub-epic 7 AW2 verbatim preservation):**
- `useAccount()` — wallet address state
- `useConnect()` — connector list + connect action
- `useDisconnect()` — disconnect action
- `useConnectors()` — available connectors enumeration

**Visual tokens:** Canonical `.hex-modal-*` taxonomy (overlay + content + body + actions + close + title), `.hex-spinner` (40px override `.cw-spinner-lg`), `.cw-modal-overlay`/`.cw-modal-content` modifiers (hybrid canonical-modifier C11 pattern).

**BE WS messages handled:** None (REST-only via wagmi web3 layer + GameBalanceCard local state).

**Recent changes (Sub-epic 7 C11 AW2):** ConnectWallet `.wallet-modal-*` → canonical `.hex-modal-*` taxonomy migration; GameBalanceCard VCard→HexCard.

#### Area 3 — Account flows (4 modals via /v2/account)

| Route | Name | Component | Auth |
|---|---|---|---|
| `/v2/account` | V2Account | AccountView.vue | NO |
| `/profile/account` | — | redirect → `/v2/account` | (legacy auth) |

**Component baselines:**
- `src/views-v2/AccountView.vue` (89 lines) — orchestrator
- `src/components/hud/HudProfileAccount.vue` (~110 lines) — 4 components stacked + scoped style

**4 Account fragments (Sub-epic 7 AW3):**
- `src/components/fragments/profile/account/ConfirmEmail.vue` — HexButton swap (C7)
- `src/components/fragments/profile/account/ChangeLogin.vue` — canonical modal + dispatch (C8)
- `src/components/fragments/profile/account/ChangePassword.vue` — 3× InputField + cancel/confirm (C9)
- `src/components/fragments/profile/account/DeleteAccount.vue` — danger variant + confirmation (C9)

**⚠️ Vuetify residual:** Per Q3.2 inventory below, ChangeLogin/ChangePassword/DeleteAccount STILL use VModal for nested confirm dialogs even after Sub-epic 7 AW3 swap. AW3 swapped buttons to HexButton + canonical `.hex-modal-*` taxonomy expansion (body/actions/close), but underlying VModal primitive preserved verbatim per scope discipline.

**Vuex actions verified used:** `master/updateMaster`, `master/sendCheckLoginAvailable`, `master/deleteAccount`, `master/setInfoMessage` + `InfoMessageModel.withTimeout`.

**Visual tokens:** HexButton, `.hex-modal-*` (canonical), `.hex-spinner`, InputField (legacy preserved verbatim per Sub-epic 3 Q-tactical-Phase1-3).

#### Area 4 — HUD spectator (HudSpectate)

| Route | Name | Component | Auth |
|---|---|---|---|
| `/v2/spectate/:fightId` | V2Spectate | SpectateView.vue | **YES** (v2ProtectedNames) |

**Component baselines:**
- `src/views-v2/SpectateView.vue` (~102 lines, Sub-epic 6 lifecycle expansion)
- `src/components/hud/HudSpectate.vue` (~437 lines after Sub-epic 6 mock gut + Sub-epic 7 C10 coach pause + C15 active effects)

**Composable:** `src/scene/interaction/useSpectateState.js` (~283 lines, Sub-epic 6 mirror Sub-epic 5 useMatchmakingState pattern)

**BE WS messages handled (Sub-epic 6):**
- `SpectateJoin` (FE→BE) — subscribe at mount
- `SpectateLeave` (FE→BE) — unsubscribe at unmount
- `SpectatorListMsg` (BE→FE) — initial spectator list
- `round_result` — HP + active effects update (per-fighter `effects: [{type, roundsLeft}]`)
- `dice_rolled` / `dice_available` — dice state
- `coach_pause` / `coach_result` — coach pause overlay state (Sub-epic 7 C10)
- `fight_end` — match end with reason
- `overdrive_start` — overdrive phase
- `fight_state_resume` — late-join state hydration (Sub-epic 6 C10)

**Visual tokens (Sub-epic 7 polish):**
- `.mod-badge*` taxonomy (extracted globally к hexlash-ui.css C15 — DRY win, shared with HudFight)
- `.hex-modal-overlay` / `.hex-modal-content` (canonical, coach pause C10)
- `.sp-coach-*` modifiers (scoped)
- `.sp-log-replayed` (joined-late marker C10)
- `.sp-result--draw` (gold palette warning, C1)

**Per-tab grid modifier classes** (Sub-epic 7 C1): `.ratings-thead--clans/agents/fighters` × tbody — eliminates trailing whitespace.

**Friends-only auth** (Sub-epic 6 C4): server-side check at SpectateJoin handler — `currentUser` must be friend of player1 OR player2.

#### Area 5 — HUD fight (HudFight)

| Route | Name | Component | Auth |
|---|---|---|---|
| `/v2/fight` | V2Fight | FightView.vue | **YES** (v2ProtectedNames) |

**Component baselines:**
- `src/views-v2/FightView.vue` (Sub-epic 4a + 4b PvP listeners + handlers)
- `src/components/hud/HudFight.vue` — fight HUD с dice + coach pause + result overlay
- `src/components/hud/common/useFightSimulation.js` — fightState reactive (mock + BE-truth)

**BE WS messages handled (Sub-epic 4a/4b):**
- `pvp_ready` — match start
- `round_result` — HP + effects + log
- `dice_roll` (FE→BE) / `dice_rolled` / `dice_available` — dice cycle
- `coach_pause` / `coach_choice` (FE→BE) / `coach_result` — coach mechanic
- `fight_end` — reason branching (victory/defeat/draw/surrender/opponent_surrendered/match_timeout/disconnect)
- `overdrive_start` — overdrive phase
- `pvp_surrender` (FE→BE) — surrender (Sub-epic 4b C2/C3)
- `fight_state_resume` — reconnect snapshot replay (Sub-epic 4b C4-C7)
- `match_cancelled` — ready_timeout

**Visual tokens (Sub-epic 7 polish):**
- `.mod-badge*` taxonomy (3 effect badges: adrenaline/shield/blind, C6 + C15 extraction)
- `.event-title` + `titlePop` keyframe (DODGE / CRITICAL!, C4)
- `.shake-left` / `.shake-right` + `shake` keyframe (per-victim side, C4)
- `.hit-flash` + 8-color FLASH_COLORS map (heal/adrenaline/shield/blind/rage/crit/parry/feint, C5)
- 5 dice icons (dice/adrenaline/shield/blind/heal SVG, C6)

**Vuex actions verified used:** `pvp/SET_PVP_MATCH`, `pvp/RESET_PVP_FIGHT`, `pvp/finishPvPFight`, `pvp/getCurrentMatchId`, `pvp/getOpponentInfo`, `pvp/getIsPlayer1`, `pvp/getPvpFightStatus`, `master/getMaster`, `master/setInfoMessage`, `agent/currentCaptain`, `webSocket/sendMessage`.

### Q1.3 — Acceptance test scenarios per area

#### Area 1 — Auth (8 scenarios)

| # | Scenario | Expected | Verify |
|---|---|---|---|
| 1.1 | Login: valid creds | redirect to `/` (Home/Pit) + master state populated | RainView render → form submit → navigate to `/v2` |
| 1.2 | Login: invalid creds | inline error display, no navigate | error toast or InputField error state |
| 1.3 | Signup: valid form | account created + auto-login + redirect | Vuex register action success path |
| 1.4 | Signup: existing login | inline error "login taken" | API error 409 surface |
| 1.5 | Reset: enter email | "code sent" state | `master/getResetState` triggers display flip |
| 1.6 | Reset: enter code + new password | password reset success + redirect to login | Vuex `resetPassword` action |
| 1.7 | TelegramLogin: real Telegram client | auto-login via initData | requires actual Telegram WebApp env (manual smoke only) |
| 1.8 | TelegramLogin: missing initData | fallback message OR redirect | graceful degradation |

#### Area 2 — Wallet (4 scenarios)

| # | Scenario | Expected | Verify |
|---|---|---|---|
| 2.1 | Open `/v2/wallet`: visit | GameBalanceCard render с balance + "Connect Wallet" CTA | wagmi `useAccount` returns null connect state |
| 2.2 | Click "Connect Wallet" | ConnectWallet modal opens (Teleport to body, .hex-modal-overlay) | Lazy mount + connector list |
| 2.3 | Connect via Browser Wallet | wagmi connect succeeds + Wallet id-field shows short address | `useConnect` + watch sync `master/updateMaster({walletAddress})` |
| 2.4 | Click withdraw on balance card | info toast "After listing" 3s | `master/setInfoMessage` + `info.withdrawAfterListing` |

#### Area 3 — Account (8 scenarios)

| # | Scenario | Expected | Verify |
|---|---|---|---|
| 3.1 | Open `/v2/account`: visit | 4 components stacked (ConfirmEmail / ChangeLogin / ChangePassword / DeleteAccount) | All render с canonical .hex-modal-* taxonomy |
| 3.2 | ConfirmEmail: click | email send flow | Vuex action |
| 3.3 | ChangeLogin: click | modal opens с InputField | Lazy modal mount |
| 3.4 | ChangeLogin: submit valid login | success toast + master state update | `master/sendCheckLoginAvailable` + `master/updateMaster` |
| 3.5 | ChangeLogin: submit taken login | error toast | API error surface |
| 3.6 | ChangePassword: submit valid old + new | success toast + modal close | Vuex action |
| 3.7 | DeleteAccount: click delete | confirmation modal с danger button | UX guard |
| 3.8 | DeleteAccount: confirm | account deleted + redirect to `/auth/login` | `master/deleteAccount` cascade |

#### Area 4 — HUD spectator (5 scenarios)

| # | Scenario | Expected | Verify |
|---|---|---|---|
| 4.1 | Friend в bout: click "Watch" | navigate to `/v2/spectate/:fightId` | router + auth check |
| 4.2 | Direct URL `/v2/spectate/<fightId>` non-friend | auth fail OR redirect | BE friends-only check |
| 4.3 | Mid-fight join (late-join) | replay log entries (`.sp-log-replayed`) + current state | `fight_state_resume` payload hydration |
| 4.4 | Active effects display | per-fighter mod-badges render с counters | `round_result` effects[] update |
| 4.5 | Coach pause display | read-only overlay (`.hex-modal-overlay`) | `coach_pause` event handler |

#### Area 5 — HUD fight (10 scenarios)

| # | Scenario | Expected | Verify |
|---|---|---|---|
| 5.1 | Friend challenge accept → /v2/fight | match start + 2 fighters + initial HP 100/100 | `pvp_ready` emit + `fight_start` |
| 5.2 | Round flow | HP updates + log entries | `round_result` handler |
| 5.3 | DODGE event | `.event-title` overlay + titlePop animation | `setEventTitle` helper |
| 5.4 | CRITICAL! event | overlay + flash | type-coded FLASH_COLORS |
| 5.5 | Per-victim shake | left/right side shake | `triggerShake` helper |
| 5.6 | Dice roll | button visible after cooldown + click → BE response | `diceReady` flag + `dice_roll` emit |
| 5.7 | Active effects modifiers bar | 3 badges visible during effect | `activeEffects` state from `round_result` |
| 5.8 | Coach pause | overlay opens с 3 strategy buttons | `coach_pause` + `coach_choice` emit |
| 5.9 | Surrender | confirm dialog → BE handler → "You surrendered" overlay | `pvp_surrender` emit + reason='surrender' |
| 5.10 | Opponent surrender | "Opponent surrendered" overlay | reason='opponent_surrendered' |

### Q1.4 — Pass/fail criteria + recovery path

**Pass criteria:**
- Each area: ALL scenarios visually verified by user
- No console errors related к area functionality
- No regression vs Sub-epic 7 closure baseline (commit `1a3db1d`)

**Fail criteria → STOP escalation:**
- ANY scenario fails (regression detected)
- Console errors related к v2 routing or component lifecycle
- WS message handler errors

**Recovery path (Lesson #18 STOP framework):**
1. STOP — no fix-forward
2. Document failure mode (route, scenario, error log, screenshot)
3. Decide: fix-forward в Sub-epic 8 (additional commit) OR rollback к prior commit
4. If fix-forward: scope new commit с pre-edit verify (Lesson #11) + post-edit verify
5. If rollback: revert offending commit + re-test acceptance gate

**Acceptance gate timing:**
- BEFORE Phase 1 cutover commits (gate must pass first)
- Re-verify AFTER each cutover commit (subset re-test)
- Final full sweep BEFORE merge `visual-v2` → main (production deploy gate)

---

## Q2 — v1→v2 routing cutover strategy

### Q2.1 — Old v1 → new v2 path mappings inventory

**Already redirected (4 from 6A + extensions through Sub-epics 1/3):**

| v1 Path | v2 Target | Mechanism | Sub-epic |
|---|---|---|---|
| `/help` | `/v2/help` | `redirect: '/v2/help'` | 6B-1 |
| `/training` | `/v2/training` | `redirect: '/v2/training'` | 6A |
| `/create-fighter` | `/v2/create` | `redirect: '/v2/create'` | 6A |
| `/fighter/:key` | `/v2/fd/:key` | `redirect: to => '/v2/fd/${to.params.key}'` | 6A |
| `/profile` | `/v2/profile` | `redirect: '/v2/profile'` | 6A |
| `/profile/balance` | `/v2/profile` | `redirect: '/v2/profile'` | Sub-epic 3 |
| `/profile/wallet` | `/v2/wallet` | `redirect: '/v2/wallet'` | Sub-epic 3 |
| `/profile/account` | `/v2/account` | `redirect: '/v2/account'` | Sub-epic 3 |
| `/profile/skins` | `/v2/profile` | named `Skins` + redirect | 6B-2 (deprecation) |
| `/user/:userLogin` | `/v2/user/:userLogin` | function-form named `V2UserProfile` | 6B-3 |
| `/clan/:id` | `/v2/clan/:id` | function-form named `V2GuestClan` | Sub-epic 1 |
| `/club/:id` | `/clan/:id` (then → /v2) | cascade redirect | Legacy |
| `/fight-club` | `/arena/club` (NOT /v2) | legacy | — |
| `/club/agent/:agentId` | `/fighter/:agentId` (then → /v2) | cascade | Legacy |
| `/club/agent/create` | `/create-fighter` (then → /v2) | cascade | Legacy |
| `/arena/club/create` | `/create-fighter` | cascade | Legacy |
| `/arena/club/:agentId` | `/fighter/:agentId` | cascade | Legacy |
| `/arena` | `/arena/club` | redirect | Legacy |

**Still pointing к v1 components (Sub-epic 8 cutover candidates):**

| v1 Path | v1 Component | v2 Target candidate | Notes |
|---|---|---|---|
| `/` (Home) | RainView | — | Stays (auth backdrop) |
| `/arena/fight` | PreparationView.vue | NO direct v2 equivalent | Pit hub `/v2` covers? PreparationView for arena prep, может остаться v1 |
| `/arena/club` | FightClubView.vue | NO direct v2 equivalent | FightClub UI (own agents roster) — может остаться v1 OR new V2FightClub |
| `/ratings/:type` | RatingsView.vue | `/v2/ratings` | Sub-epic 2 ported but :type param not used in v2 (4 internal tabs) |
| `/fight` | CardFightView.vue | `/v2/fight` | **Sub-epic 4a/4b PvP shipped в v2** — primary cutover candidate |
| `/friends` | FriendsView.vue | `/v2/profile` (Friends card) OR `/v2/user/:login` | Sub-epic 5B HudProfile Friends card covers core flows |
| `/matchmaking` | MatchmakingView.vue | `/v2/matchmaking` | **Sub-epic 5 ported real BE** — primary cutover candidate |
| `/spectate/:odId` | SpectateView.vue | `/v2/spectate/:fightId` | **Sub-epic 6 ported real BE** — primary cutover candidate (param name change `:odId` → `:fightId`) |

**Param name changes on cutover:**
- `/spectate/:odId` → `/v2/spectate/:fightId` — semantic rename (odId was legacy odessa param). Cutover redirect must transform: `redirect: to => /v2/spectate/${to.params.odId}`

**Public routes (NOT cutover):**

| Path | Component | Status |
|---|---|---|
| `/privacy` | PrivacyView.vue | Stays v1 (legal page, auto-generated HTML) |
| `/404` | NotFoundView.vue | Stays v1 |
| `/rules` | PageView.vue | **Carry-over #5** — port к v2 (deferred) |
| `/verify-email` | VerifyEmailView.vue | Stays v1 (auth flow) |
| `/r/:username` | beforeEnter referral handler | Stays v1 |

**Auth routes (NEVER cutover — RainView is v2-aesthetic-compatible):**
- `/auth/login` `/auth/signup` `/auth/reset` `/auth/telegram` — 3D rain backdrop sole "v2-aesthetic" auth surface

### Q2.2 — Redirect mechanism options

**Existing 6A pattern (verified working in production):**

```js
// String-form (path-only):
{path: '/help', redirect: '/v2/help'},

// Function-form (param transform):
{path: '/fighter/:key', redirect: to => `/v2/fd/${to.params.key}`},

// Named-form (typed param):
{
    path: '/user/:userLogin',
    redirect: to => ({ name: 'V2UserProfile', params: { userLogin: to.params.userLogin } }),
},
```

**3 mechanism variants (all Vue Router 4 native):**

| Mechanism | When to use | Pros | Cons |
|---|---|---|---|
| String-form `redirect: '/v2/...'` | Path 1:1 mapping, no params | Cleanest syntax | No param transform |
| Function-form `redirect: to => ...path` | Param rename or transform | Full flexibility | More code |
| Named-form `redirect: to => ({name, params})` | Type-safe routing | Validates against route registry | Verbose |

**Recommendation basis:** Sub-epic 8 cutover should use **same mechanism as existing 6A redirects** для consistency:
- `/fight` `/matchmaking` — string-form (path 1:1)
- `/spectate/:odId` → `/v2/spectate/:fightId` — function-form (param rename)
- `/ratings/:type` → `/v2/ratings` — function-form OR string + drop param (4 internal tabs subsume)

**No client-side rewrite needed** — Vue Router redirects work in SPA context (history mode, `createWebHistory()` per router/index.js:180).

**Auth applied к redirects:** legacy v1 paths in `protectedRoutes` array (router/index.js:32-71). Auth applied via `router.beforeEach` guard BEFORE redirect resolves (line 224 — `to.path === route.path` match). Post-cutover: redirect target inherits target route's auth posture (V2Fight/V2Matchmaking/V2Spectate via v2ProtectedNames).

### Q2.3 — Backwards compat period decision basis

**Per route assessment:**

| Route | v1 fallback needed? | Removal trigger |
|---|---|---|
| `/fight` | NO — Sub-epic 4a/4b shipped, BE-compatible | Atomic cutover safe |
| `/matchmaking` | NO — Sub-epic 5 shipped, real BE | Atomic cutover safe |
| `/spectate/:odId` | NO — Sub-epic 6 shipped, real BE + production hotfix C4.5 deployed | Atomic cutover safe |
| `/ratings/:type` | MAYBE — Sub-epic 2 reversed Path A → Path D, :type param dropped | User behaviour: bookmark survival via redirect |
| `/friends` | MAYBE — Sub-epic 5B integrated в HudProfile Friends card | User flow change (separate page → tab) |
| `/arena/fight` | MAYBE — PreparationView no v2 equivalent | Decision: stay v1 OR new V2 view |
| `/arena/club` | MAYBE — FightClubView no v2 equivalent | Decision: stay v1 OR new V2 view |

**Bookmark survival:** All cutover redirects preserve URL semantics через redirect (user bookmarks `/fight` → loads `/v2/fight`). No 404.

**Recommendation basis:** **No backwards compat period needed для cutover candidates** — redirects handle bookmark migration transparently. Optional preservation for `/arena/fight` + `/arena/club` если v2 equivalent not designed (separate Sub-epic candidate).

### Q2.4 — 4 path candidates strategic basis для Hexlash

**Path α — Atomic cutover (single-commit redirect)**

Single commit replaces ALL 5 remaining v1-pointing protectedRoutes lines (62-69) с redirects:

```js
{path: '/ratings/:type', redirect: to => '/v2/ratings'},
{path: '/ratings', redirect: '/v2/ratings'},
{path: '/fight', redirect: '/v2/fight'},
{path: '/friends', redirect: '/v2/profile'},  // OR keep v1 if user flow critical
{path: '/matchmaking', redirect: '/v2/matchmaking'},
{path: '/spectate/:odId', redirect: to => `/v2/spectate/${to.params.odId}`},
```

| Aspect | Value |
|---|---|
| Routes affected | 5-6 (depending on /friends decision) |
| LOC commit estimate | ~10-15 lines diff (router only) |
| Legacy files preserved | All v1 .vue files (5+: CardFightView/MatchmakingView/SpectateView/RatingsView/FriendsView) — separate cleanup commit Q3 |
| Production user impact | Immediate cutover — all users land in /v2 next page load |
| Rollback complexity | Single revert |

**Hexlash pros:**
- Cleanest single-commit semantics for cutover ratification
- Lowest legacy debt going forward
- Simplest rollback (single revert)
- Matches 6A precedent (single-commit redirect pattern)
- Acceptance gate already user-driven manual ratification — fits gate model

**Hexlash cons:**
- High blast radius if regression in ANY area surfaces post-cutover
- Telegram WebApp users могут hit issue если v2 mobile breakpoint regression
- All BE-FE integration regressions surface simultaneously (no isolation per area)

---

**Path β — Phased cutover (per-feature redirect)**

5-6 sequential commits, one per feature area:

```
Commit 1: cutover /ratings/:type → /v2/ratings
Commit 2: cutover /matchmaking → /v2/matchmaking
Commit 3: cutover /fight → /v2/fight
Commit 4: cutover /spectate/:odId → /v2/spectate/:fightId
Commit 5: cutover /friends → /v2/profile (or keep v1)
[Commit 6: arena/fight + arena/club decision if cutover к new V2 view]
```

| Aspect | Value |
|---|---|
| Routes affected | 5-6 (one per commit) |
| LOC commit estimate | ~3-5 lines diff per commit |
| Legacy files preserved | Same as Path α (separate Q3 commits) |
| Production user impact | Per-commit incremental — partial v2 deploys |
| Rollback complexity | Per-commit revert (granular) |

**Hexlash pros:**
- Lower risk per commit
- Granular rollback
- Per-commit acceptance gate verify possible
- Natural fit с Mode A discipline
- Better incident isolation if regression surfaces (which feature broke?)

**Hexlash cons:**
- More commits, longer Sub-epic 8 (5-6 functional + closure = 8-10 commits)
- Each commit needs build pass + push + visual verify cycle
- Pre-cutover acceptance gate full sweep still required (gate is full-sweep oriented)
- Cherry-pick PR coordination if any commit needs production deploy split

---

**Path γ — Soft cutover (default route change + v1 fallback)**

Change default routing without redirecting v1 paths. Possible mechanisms:
- Conditional UI: BottomMenu/links все point к /v2/* paths (FE side)
- Old /v1 paths preserved для bookmarks but no longer surface in UI
- Eventual removal в Эпик 7+ once usage drops

| Aspect | Value |
|---|---|
| Routes affected | UI links (multiple component edits) |
| LOC commit estimate | ~30-50 lines diff (UI links across BottomMenu, hubs, etc.) |
| Legacy files preserved | ALL v1 .vue files preserved indefinitely |
| Production user impact | Gradual migration — both v1 + v2 functional |
| Rollback complexity | Revert UI link edits |

**Hexlash pros:**
- Lowest production user impact (both versions work)
- Easiest rollback (UI changes only)
- Safer if v2 has subtle regression unfound в acceptance gate

**Hexlash cons:**
- Highest legacy debt going forward (legacy code stays indefinitely)
- Эпик 6 not "complete" in clean sense (cutover deferred)
- Increases Эпик 7+ cleanup scope significantly
- Ambiguous "what is current state" semantic
- Doesn't match Эпик 6 closure intent (full v2 default)

---

**Path δ — Hybrid (atomic + selective v1 preservation)**

Atomic redirect для confident routes, preserve v1 для uncertain ones:

```js
// Atomic redirect (Sub-epic 4a/4b/5/6 fully shipped):
{path: '/fight', redirect: '/v2/fight'},
{path: '/matchmaking', redirect: '/v2/matchmaking'},
{path: '/spectate/:odId', redirect: to => `/v2/spectate/${to.params.odId}`},

// Preserved v1 (no v2 equivalent OR risk-averse):
{path: '/ratings/:type', name: 'Ratings', component: () => import("/src/views/RatingsView.vue"), props: true},
{path: '/friends', name: 'Friends', component: () => import("/src/views/FriendsView.vue")},
{path: '/arena/fight', name: 'ArenaFight', component: () => import("/src/views/PreparationView.vue")},
{path: '/arena/club', name: 'ArenaFightClub', component: () => import("/src/views/FightClubView.vue")},
```

| Aspect | Value |
|---|---|
| Routes affected | 3 cutover + 4 preserved = 7 |
| LOC commit estimate | ~5-10 lines diff (selective lines) |
| Legacy files preserved | RatingsView/FriendsView/PreparationView/FightClubView (.vue files preserved) |
| Production user impact | Mixed — PvP fully v2, navigation/preparation legacy |
| Rollback complexity | Per-route revert |

**Hexlash pros:**
- Risk-managed cutover (high-confidence routes go atomic, uncertain stay v1)
- Preserves PreparationView + FightClubView (no v2 equivalent designed)
- Scope clarity: only ports proven v2 routes
- Fits "code-complete + deferred-deploy" closure shape (Sub-epic 6 precedent)

**Hexlash cons:**
- Mixed semantic state (some routes v2, some v1)
- "What's current?" confusion for new users
- Requires explicit decision per uncertain route
- Эпик 6 closure has split semantics

---

### Q2.5 (NEW from user) — Continue-stack reconciliation strategy

**Branch state inventory:**

| Branch | HEAD | Status | Commits ahead of main |
|---|---|---|---|
| `main` | (production target) | Production deployed (PR #353/#354/#355/#356 merged) | 0 |
| `visual-v2` | (parallel branch) | Defined в CLAUDE.md as "Development branch" but не fully reflected current state | Unknown — separate branch |
| `claude/visual-polish-auth-wallet-6xe6m` (continue stack) | `1a3db1d` | Sub-epic 5J → 5T → 5U → 6A → ... → Sub-epic 7 closure | ~30+ commits |
| `claude/investigate-cutover-gate-RpOyg` (designated, current) | `1a3db1d` | Same SHA as continue stack | ~30+ commits |

**Continue stack content (last 30 commits, верхушка):**
- 14 sub-epics' functional commits (6A through Sub-epic 7)
- Closure commits (CL1/CL2/CL3 per sub-epic)
- Preventive splits (Phase 0 reports, FINAL_REPORTs)
- Bug-bundle fixes (Sub-epic 4b C10 STOP-skipped, Sub-epic 6 cherry-pick)

**Reconciliation options для Sub-epic 8:**

**Option Q2.5-A — Direct merge `claude/investigate-cutover-gate-RpOyg` → main**

Process:
1. Sub-epic 8 functional + closure commits land на designated branch
2. PR `claude/investigate-cutover-gate-RpOyg` → `main` (cherry-pick prep ИЛИ direct merge)
3. Single PR closes Эпик 6 + production deploy

| Pro | Con |
|---|---|
| Cleanest closure semantic | ~30+ commits in single PR (review burden) |
| Single production deploy moment | All commits land atomic (ВЫ regression risk) |
| Branch reconciliation одним actом | If Sub-epic 8 fails, harder to backout |

**Option Q2.5-B — Squash-merge designated branch → main**

Process:
1. Sub-epic 8 commits на designated branch
2. Squash all 30+ continue-stack-then-Sub-epic-8 commits into single Эпик 6 closure commit on main

| Pro | Con |
|---|---|
| Cleanest main history | Loses sub-epic git granularity |
| Single production deploy | Hard к bisect if regression |
| Atomic Эпик 6 closure | Loses ~30+ semantically meaningful commits |

**Option Q2.5-C — Merge `visual-v2` → main first, then Sub-epic 8 cherry-pick**

Process:
1. (Pre-Sub-epic 8) PR `visual-v2` → main с continue-stack work merged into visual-v2 first
2. Sub-epic 8 commits на designated branch
3. Cherry-pick Sub-epic 8 commits к main

| Pro | Con |
|---|---|
| Two-stage deploy (less atomic risk) | Two PRs needed |
| visual-v2 state aligned с main mid-cutover | Complexity coordination |
| Sub-epic 8 isolated test | Continue stack reconciliation indirect |

**Option Q2.5-D — Cherry-pick selectively**

Process:
1. Identify "essential" continue-stack commits vs "internal scaffold" (closure docs, splits)
2. Cherry-pick essential к main
3. Sub-epic 8 commits атомарно на main directly

| Pro | Con |
|---|---|
| Most curated main history | Subjective "essential" classification |
| Clean production deploy | Manual cherry-pick burden |
| No squash loss for important commits | Risk dropping legitimate context |

**Recommendation basis:** User decision required. **Q2.5-A (Direct merge)** matches "single closure" semantic Эпик 6. **Q2.5-C (visual-v2 first)** safest for two-stage deploy. **Q2.5-B (squash)** if commit history burden too high.

**Branch strategy convention** (CLAUDE.md ~line 770): "backend code fixes... be cherry-picked к a new branch from main HEAD (`fix/<short-description>`), PR'd to main → merged → backend auto-deploy via testhexlash service webhook." This applies к Sub-epic 8 IF Friends "Watch Live" + #31 ErrorMsg BE bundle.

---

## Q3 — Legacy file removal scope

### Q3.1 — v1 components candidate к delete

**v1 views inventory** (`src/views/` — 17 files):

| File | Status | Consumers (router refs + imports) | Safe to delete? |
|---|---|---|---|
| `RainView.vue` | KEEP | authRoutes (4 routes) + Home + Referral + protectedRoutes Home | NO (used by all auth) |
| `PrivacyView.vue` | KEEP | publicRoutes /privacy | NO |
| `NotFoundView.vue` | KEEP | publicRoutes /404 + /:pathMatch wildcard | NO |
| `PageView.vue` | KEEP | publicRoutes /rules | NO (carry-over #5 — port к v2 deferred) |
| `VerifyEmailView.vue` | KEEP | publicRoutes /verify-email | NO (legacy verify flow) |
| `PreparationView.vue` | KEEP/?? | protectedRoutes /arena/fight | DECISION — no v2 equivalent |
| `FightClubView.vue` | KEEP/?? | protectedRoutes /arena/club | DECISION — no v2 equivalent |
| `RatingsView.vue` | DELETE candidate | protectedRoutes /ratings/:type | After Sub-epic 8 redirect cutover |
| `CardFightView.vue` | DELETE candidate | protectedRoutes /fight | After Sub-epic 4a/4b cutover |
| `FriendsView.vue` | DELETE candidate | protectedRoutes /friends | After Sub-epic 5B integration cutover |
| `MatchmakingView.vue` | DELETE candidate | protectedRoutes /matchmaking | After Sub-epic 5 cutover |
| `SpectateView.vue` | DELETE candidate | protectedRoutes /spectate/:odId | After Sub-epic 6 cutover |
| `ProfileView.vue` | DELETE candidate | NOT in router (orphaned per Sub-epic 1) | YES (orphaned) |
| `ClanView.vue` | DELETE candidate | NOT in router (orphaned per Sub-epic 1) | YES (orphaned) |
| `AgentDetailView.vue` | DELETE candidate | NOT in router (replaced by /v2/fd/:key) | YES (orphaned, has setError phantom mutation refs Sub-epic 5O closure) |
| `CreateAgentView.vue` | DELETE candidate | NOT in router (replaced by /v2/create) | YES (orphaned) |
| `TrainingView.vue` | DELETE candidate | NOT in router (replaced by /v2/training) | YES (orphaned) |

**Verification commands:**
```bash
# Each candidate, verify no imports:
grep -rn "import.*from.*'@/views/AgentDetailView" src/
grep -rn "import.*from.*'@/views/ProfileView" src/
# (etc.)
```

**Sub-epic 8 deletion scope (proposed):**

**Phase A — Orphaned files (no router refs, safe atomic delete):**
- `src/views/ProfileView.vue` (orphaned per Sub-epic 1 carry-over)
- `src/views/ClanView.vue` (orphaned per Sub-epic 1)
- `src/views/AgentDetailView.vue` (orphaned per Sub-epic 4 era)
- `src/views/CreateAgentView.vue` (orphaned)
- `src/views/TrainingView.vue` (orphaned)

**Phase B — Cutover-dependent (delete AFTER redirect cutover):**
- `src/views/CardFightView.vue` (after /fight redirect)
- `src/views/MatchmakingView.vue` (after /matchmaking redirect)
- `src/views/SpectateView.vue` (after /spectate/:odId redirect)
- `src/views/RatingsView.vue` (after /ratings/:type redirect)
- `src/views/FriendsView.vue` (after /friends redirect)

**Phase C — Decision-pending:**
- `src/views/PreparationView.vue` — keep v1 OR design new V2 (not Sub-epic 8 scope likely)
- `src/views/FightClubView.vue` — keep v1 OR design new V2 (not Sub-epic 8 scope likely)

### Q3.2 — Vuetify dependency removal possibility

**Inventory сurrent state:**

`grep -l "VBtn|VBtnDark|VModal|VCard|v-btn|v-card|v-modal|v-dialog|v-text-field|v-progress" src/` returns **30 files**.

**Breakdown:**

**v1-only consumers (will be removed with v1 view deletion Phase B/C):**
- `src/views/AgentDetailView.vue` (orphaned, Phase A delete)
- `src/views/CardFightView.vue` (Phase B delete)
- `src/views/ClanView.vue` (orphaned, Phase A)
- `src/views/PreparationView.vue` (decision-pending)
- `src/views/ProfileView.vue` (orphaned, Phase A)
- `src/views/RatingsView.vue` (Phase B delete)
- `src/views/TrainingView.vue` (orphaned)
- `src/views/VerifyEmailView.vue` (KEEP — legacy verify flow)

**Reused fragments (used by both v1 and v2 — preserved with v2 inheritance):**
- `src/components/fragments/auth/Login.vue` — used by RainView (auth, KEEP)
- `src/components/fragments/auth/Reset.vue` — RainView KEEP
- `src/components/fragments/auth/Signup.vue` — RainView KEEP
- `src/components/fragments/auth/TelegramLogin.vue` — RainView KEEP
- `src/components/fragments/clan/ClanEdit.vue` — HudClan v2 (Sub-epic 1 augmented)
- `src/components/fragments/clan/ClanPageContent.vue` — legacy ClanView (orphaned — delete OK)
- `src/components/fragments/clan/ClanWithdraw.vue` — verify usage
- `src/components/fragments/clan/CreateClan.vue` — HudClanEmpty v2 (Sub-epic 1 augmented)
- `src/components/fragments/clan/MyClanTab.vue` — legacy RatingsView (Phase B delete)
- `src/components/fragments/profile/ProfileButtons.vue` — verify v1 vs v2 usage (6B-2 button removal)
- `src/components/fragments/profile/ProfileInvite.vue` — verify v1 vs v2 usage
- `src/components/fragments/profile/ReferralModal.vue` — HudProfile v2 (Sub-epic 5H augmented)
- `src/components/fragments/profile/account/ChangeLogin.vue` — HudProfileAccount v2 (Sub-epic 7 AW3)
- `src/components/fragments/profile/account/ChangePassword.vue` — Sub-epic 7 AW3
- `src/components/fragments/profile/account/DeleteAccount.vue` — Sub-epic 7 AW3
- `src/components/fragments/profile/account/SoundToggle.vue` — verify v1 vs v2 usage
- `src/components/fragments/profile/account/Switcher3DPunch.vue` — carry-over #14 SKIP per user
- `src/components/fragments/profile/skins/ProfileSkins.vue` — 6B-2 deprecation, verify orphaned
- `src/components/fragments/profile/wallet/BuyTokens.vue` — disabled per CLAUDE.md, verify
- `src/components/fragments/profile/wallet/GameBalanceCard.vue` — HudProfileWallet v2 (Sub-epic 7 C11)
- `src/components/fragments/training/DailyTasks.vue` — verify v1 vs v2 (Sub-epic 5K)
- `src/components/fragments/training/SocialTasks.vue` — legacy ProfileView usage per CLAUDE.md (orphaned)
- `src/components/fragments/training/SubscribeModal.vue` — HudSocialTasks v2 (Sub-epic 5I augmented)
- `src/components/fragments/training/TaskModal.vue` — verify v1 vs v2

**v2 HUDs с Vuetify residual (verify per file):**
- `src/components/hud/HudClan.vue` — 1 hit
- `src/components/hud/HudClanEmpty.vue` — 2 hits
- `src/components/hud/HudProfileWallet.vue` — 1 hit
- `src/components/hud/HudSocialTasks.vue` — 1 hit
- `src/components/hud/HudRetirement.vue` — 1 hit (HexButton in template OK; v-* may be vuetify ref scan false-positive)

**Other consumers:**
- `src/components/Error.vue`, `src/components/Info.vue`, `src/components/NewAchievement.vue` — global toast/modal, KEEP (used in legacy + v2 layout)
- `src/components/club/AgentRoster.vue` — club mode legacy (orphaned после `/arena/club` decision)
- `src/components/menu/BottomMenu.vue` — v1 navigation (orphaned после `/v2` becomes default per Path α)
- `src/components/ui/BackButton.vue`, `src/components/ui/NoConnection.vue` — verify
- `src/main.js` — Vuetify global init
- `src/styles/hexlash-ui.css`, `src/assets/main.css` — CSS imports (NOT actually Vuetify — false-positive scan match for `v-*` token name)

**Package.json:**
```
"vite-plugin-vuetify": "^2.1.3"
```
(no `vuetify` direct dep listed — verify full package.json для vuetify dep)

**Decision basis для Vuetify removal:**

**Sub-epic 8 in-scope:** Remove Vuetify imports от orphaned v1 views (Phase A delete cascade naturally removes consumers).

**Sub-epic 8 out-of-scope:** Full Vuetify removal от reused fragments (auth/clan/profile/account/training fragments). These augmented для v2 reuse but Vuetify primitive preserved verbatim per Sub-epic 7 AW3 scope discipline. Full Vuetify→v2 port = **Эпик 7+ refactor sub-epic** (carry-over candidate, follows #15 pattern).

**Recommendation:** Phase A v1 view deletion will reduce Vuetify consumers by ~5-7 files. Remaining consumers (~15-20 files) preserved per Sub-epic 7 scope discipline. `vite-plugin-vuetify` dependency stays.

### Q3.3 — Asset cleanup

Out of scope для Phase 0 deep dive (image-by-image audit requires visual review). **Recommendation:** defer к Эпик 7+ asset audit sub-epic. No blocker для Sub-epic 8 cutover.

**Quick observation:**
- `src/assets/images/` — backgrounds, icons (multiple files)
- `src/assets/fonts/` — Anonymous + AnonymousBalance
- `src/assets/sound/` — punch_air.mp3, punch_hit.mp3, rain.mp3 (audit — RainView uses rain.mp3)
- `src/assets/abi/` — smart contract ABIs (carry-over forward к web3 sub-epic Эпик 7+)

**Sub-epic 8 minimal scope:** Skip asset audit. Add к Эпик 7+ retrospective.

### Q3.4 — CSS cleanup

**Current CSS imports inventory:**

`src/main.js` (legacy v1 entry — applied via `import` к global Vue app):
```js
import './assets/colors.css'    // legacy --pink/--dark/--gray* — used ONLY by PrivacyView per CLAUDE.md
import './assets/main.css'      // global styles + scrollable view pattern
import './styles/hexlash-ui.css' // canonical .hex-* taxonomy
```

`src/AppV2.vue` (v2 root):
```js
import '@/styles/hexlash-v24.css'  // v2 scoped under .app-v2 namespace
```

`src/styles/hexlash-v24.css` (v2 entry — chains 12 imports):
- `./v24/tokens.css` (Google Fonts + CSS variables)
- `./v24/effects.css` (.grain, .scanlines, .vignette)
- `./v24/fight-overlays.css`
- `./v24/training.css`
- `./v24/matchmaking.css`
- `./v24/create.css`
- `./v24/profile.css`
- `./v24/ratings.css`
- `./v24/clan.css`
- `./v24/shop.css`
- `./v24/verify.css`
- `./v24/help.css`

**Cleanup decisions:**

**KEEP:**
- `src/assets/colors.css` — sole consumer PrivacyView (auto-generated legal HTML с inline styles)
- `src/assets/main.css` — global scroll patterns referenced by legacy v1 views (still active)
- `src/styles/hexlash-ui.css` — canonical taxonomy (HexButton, HexCard, .hex-modal-*, .hex-spinner, .mod-badge*) — used by both legacy fragments + v2
- All `src/styles/v24/*.css` — v2 scoped, all referenced

**No CSS cleanup в Sub-epic 8 scope.** Per CLAUDE.md, `colors.css` legacy preservation is documented exception (PrivacyView).

**Future Эпик 7+:** If PrivacyView ported к v2, `colors.css` removable.

---

**Part 1 ends here.** Continued in `EPIC6_SUBEPIC_8_PHASE_0_REPORT_PART2.md` (Q4-Q7 + 6 mandatory subsections + path candidates basis table + risks).
