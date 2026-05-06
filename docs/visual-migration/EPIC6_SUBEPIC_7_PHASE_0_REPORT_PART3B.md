# Phase 0 Report — Sub-epic 7 — Visual polish + Auth/Wallet redesign — PART 3B

**Continued from PART 3A.** This part covers Subsections 4-6 + Lesson #36 + Recoveries + Phase 0 catches + Final summary.

---

## Subsection 4 — UI infrastructure dependencies

Phase 0 mandate: for each new handler chain (button → state → handler), verify dependency chain through all layers (Vue component → composable → store → service → API).

### Auth flow chain — Login

| Layer | File:line | Element |
|---|---|---|
| User trigger | `Login.vue:99` | `<form @submit.prevent="handleSubmit">` (form submit; or VBtn click also triggers) |
| Handler | `Login.vue:99-105` | `handleSubmit()` async — sets `loading.value=true`, dispatches `master/login`, `finally { loading.value=false }` |
| Vuex action | `master/login` | dispatch payload `{ login: trimmed, password }` |
| Service | `userService.js` (TBD verify) | wraps apiClient call |
| API | `POST /v1/auth/login` | rate-limited 5/15min per CLAUDE.md security |
| State update | `master/getLoginState` | `isAuthenticated: true`, JWT stored |
| Side effects | router redirect via guard cascade | unauthenticated → Login; authenticated → `/v2` (line 222-229 + redirect logic) |

**Sub-epic 7 AW1 commit:** restyles VBtn + InputField visual layer; preserves dispatch chain entirely.

### Auth flow chain — Signup

| Layer | File:line | Element |
|---|---|---|
| Trigger | `Signup.vue:130` | form submit |
| Validation | `Signup.vue:118-128` | client-side: all fields required, password ≥8 chars, password === confirmPassword (sets `errorMessage` ref) |
| Handler | `Signup.vue:130-148` | `handleSubmit()` async — dispatches `master/register`, catch sets errorMessage, finally loading=false |
| Vuex action | `master/register` | dispatch payload `{ login, password }` |
| Backend | `POST /v1/auth/signup` | rate-limited 3/hr per CLAUDE.md |

**Sub-epic 7 AW1 commit:** restyles 3× InputField + VBtn; preserves validation logic + dispatch chain.

**Note:** Backend supports `referralCode` parameter (per CLAUDE.md "Referral System") but current FE Signup.vue dispatch payload at line 130 does NOT include it. Referral capture happens at `/r/:username` route (per CLAUDE.md Referral 1/3) via separate flow that stores `referralCode` в localStorage → register/telegram dispatch reads it. Verify that this localStorage-read pattern survives Sub-epic 7 restyle (the dispatch payload may pull from localStorage internally в `master/register` action).

### Auth flow chain — Reset

| Layer | File:line | Element |
|---|---|---|
| Trigger | `Reset.vue:55` | form submit |
| Handler | `Reset.vue:54-56` | `handleResetSubmit()` dispatches `master/resetPassword(email.value)` |
| Vuex action | `master/resetPassword` | dispatch payload `email: string` |
| Backend | `POST /v1/auth/reset` | returns 501 "not implemented" honestly per CLAUDE.md |
| State update | `master/getResetState` | `loading`, `errorMessage`, `successMessage` exposed |

**Sub-epic 7 AW1 commit:** restyles InputField + VBtn; preserves clearResetState mount logic (line 62-64).

### Auth flow chain — Telegram

| Layer | File:line | Element |
|---|---|---|
| Trigger | `TelegramLogin.vue:60` | `onMounted()` → `initTelegramWebApp()` |
| Handler | `TelegramLogin.vue:59-91` | reads `window.Telegram.WebApp.initData` + URL `?invite` query param + dispatches `master/telegram` |
| Vuex action | `master/telegram` | dispatch payload `{ chatId, initData, hash, inviteCode }` |
| Backend | `POST /v1/auth/telegram` | HMAC-SHA256 signature validation + 5min replay window per CLAUDE.md |

**Sub-epic 7 AW1 commit:** restyles InputField (read-only chatId) + VBtn (retry); preserves Telegram WebApp initData parse logic.

### Wallet connect chain

| Layer | File:line | Element |
|---|---|---|
| Trigger | `HudProfileWallet.vue:64-78` | `openConnectWallet()` async — dynamic `import()` ConnectWallet → markRaw → showRef → nextTick × 2 → `cwRef.value?.openModal?.()` |
| Modal display | `ConnectWallet.vue:27-79` | Teleport-to-body conditional rendering on `showModal` ref |
| Connector list | `ConnectWallet.vue:50-73` | renders `useConnectors()` array, dedup, filter Injected→"Browser Wallet" |
| Connect handler | `ConnectWallet.vue:140` | `connect({ connector })` async (wagmi `useConnect` composable) |
| Watch sync | `HudProfile.vue:375-385` + `ProfileWallet.vue:41-47` | `watch(wagmiAddress)` → dispatches `master/updateMaster { walletAddress }` |
| Vuex sync | `master/updateMaster` | persists walletAddress to UserModel + backend `PUT /v1/user/edit` |

**Sub-epic 7 AW2 commit:** restyles ConnectWallet modal visual layer (already custom Teleport, no Vuetify dep — minor token alignment); preserves wagmi composable signatures + watch sync chain.

### Account flow chain — ChangePassword (representative)

| Layer | File:line | Element |
|---|---|---|
| Trigger | `ChangePassword.vue:3` | `<VBtnDark>` click → `dialog = true` |
| Modal display | `ChangePassword.vue:13` | `<VModal v-model="dialog" max-width="500">` |
| Form | `ChangePassword.vue:18-40` | 3× InputField (current/new/confirm) |
| Submit handler | `ChangePassword.vue` (TBD line) | dispatches `master/updateMaster { currentPassword, newPassword }` (verify exact action shape before AW3 commit) |
| Vuex action | `master/updateMaster` | persists через backend |

**Sub-epic 7 AW3 commit:** swaps VModal → inline Teleport + `.hex-modal-overlay`/`.hex-modal`; swaps VBtnDark → HexButton secondary; replaces v-progress-circular с CSS spinner; preserves dispatch chain.

**Pre-edit verification needed:** read ChangePassword.vue submit handler line range to verify exact `master/updateMaster` payload — payload field names matter for AW3 commit not breaking existing flow.

### Account flow chain — DeleteAccount (destructive)

| Layer | File:line | Element |
|---|---|---|
| Trigger | `DeleteAccount.vue:3` | `<VBtnDark>` "Delete Account" trigger |
| Modal display | `DeleteAccount.vue:12-13` | VModal + VCard confirmation |
| Confirm handler | `DeleteAccount.vue` (line 19-…) | `<VBtn class="confirm-delete-btn">` triggers `master/deleteAccount` action |
| Vuex action | `master/deleteAccount` | per CLAUDE.md Sub-epic 3 — internal `clearAuthData` + `router.push('/')` cascade → guard → Login |
| Side effect | router guard chain | redirects to `/auth/login` |

**Sub-epic 7 AW3 commit:** swaps VModal → inline Teleport modal; swaps VBtn destructive → HexButton danger variant; preserves deleteAccount action + redirect cascade.

### Polish chain — B2 dodge/crit overlay (#18)

| Layer | File:line | Element |
|---|---|---|
| Trigger | doExchange round simulation | `useFightSimulation.js:105-152` — hit/miss detection branches |
| State mutation | NEW field | `fightState.eventTitle` + `fightState.eventTitleClass` (fields not yet present) |
| Display | NEW template | `<div v-if="fightState.eventTitle" :class="['event-title', fightState.eventTitleClass]">{{ ... }}</div>` |
| Lifecycle | setTimeout 1200ms | clears event title |

**Dependency:** No external service / API. Pure FE state + template + CSS.

### Polish chain — B3 dice icon import (#25)

| Layer | File:line | Element |
|---|---|---|
| Asset source | `src/assets/images/icons/` | dice.svg, adrenaline.svg, shield.svg, blind.svg, heal.svg verified ✓ |
| Import | NEW в HudFight.vue | `import iconDice from '@/assets/images/icons/dice.svg'` |
| Template | dice button update | `<img :src="iconDice"> ROLL` |

### Polish chain — B5 spectate active effects (#35)

| Layer | File:line | Element |
|---|---|---|
| BE source | round_result event payload | `detail.player1?.activeEffects` (verify shape with backend pvpCombatEngine.js or WS protocol — per Sub-epic 6 contract) |
| State extract | `useSpectateState.js:77-104` (`onSpectateRoundResult`) | NEW: `if (detail.player1?.activeEffects) spectateState.player1ActiveEffects = detail.player1.activeEffects` |
| Display | HudSpectate.vue template | NEW: badges in fighter card header |

**Pre-edit verification:** confirm BE event payload includes `activeEffects` field. If absent — bundle is reduced к coach pause overlay only; activeEffects defers к BE extension.

### Lesson #34 HUD overlay convention (re-iteration)

For all new HUD additions during Sub-epic 7:
- Root container: `position: fixed/absolute; inset: 0; pointer-events: none;`
- Interactive children: `pointer-events: auto;` (mandatory override)
- z-index alignment within scoped namespace
- Mirror existing `.hud-*` patterns

Specifically AW1/AW2/AW3 likely create new HUD-overlay-style elements (auth form container, wallet modal triggers, account section back/title) — apply Lesson #34 default in scoped blocks.

---

## Subsection 5 — Vocabulary alignment audit

Phase 0 mandate: explicit Vuetify → v2 mapping reference. Used by AW3 + B-bundles.

| Vuetify primitive | v2 token / primitive | Status | Migration path |
|---|---|---|---|
| `<VModal v-model="open" max-width="500">` | inline Teleport + `.hex-modal-overlay` + `.hex-modal` (Option a) OR new `Modal.vue` SFC primitive (Option b) | ⚠️ CSS ready, SFC missing | **Option a recommended** — mirror ConnectWallet.vue Teleport-inline pattern; Option b deferred к Эпик 7+ |
| `<VCard>` | `<HexCard variant="default" padding="md">` | ✅ Ready | 1:1 swap; verify variant matches visual (default/elevated for modal cards) |
| `<VCardTitle>`, `<VCardText>`, `<VCardActions>` | HexCard slots: `header`, default body, `footer` | ✅ Ready | Slot composition |
| `<VBtnDark>` | `<HexButton variant="secondary">` (outline-style) OR `variant="ghost"` (minimal) | ⚠️ Ready (verify visual match) | VBtnDark = dark filled button; HexButton secondary = outline. May need custom `.hex-button--dark` modifier OR use ghost + override CSS |
| `<VBtn>` (primary action) | `<HexButton variant="primary">` | ✅ Ready | 1:1 swap |
| `<VBtn>` (destructive — `.confirm-delete-btn`) | `<HexButton variant="danger">` | ✅ Ready | 1:1 swap; preserves `--hex-danger` color |
| `<VBtn>` (cancel — `.cancel-btn`) | `<HexButton variant="ghost">` or `variant="secondary"` | ✅ Ready | 1:1 swap |
| `<v-progress-circular size="20" indeterminate>` | Custom CSS spinner (mirror `.tsp-spinner` pattern from training.css) | ⚠️ Pattern exists, no shared primitive | Per-consumer scoped CSS (3-4 spinner sites: ChangeLogin, ChangePassword, NoConnection, possibly auth forms) |
| `<v-switch v-model="value">` | (Out of scope — Switcher3DPunch SKIP per #14) | N/A | DROP recommendation per Q5.3; if PORT chosen, mirror `SoundToggle.vue` pattern (custom v2 toggle, success green on-state) |
| `<v-text-field>` | `<InputField>` | ✅ Already в use | InputField.vue is v2-native, used in all auth + account forms |
| `<v-img>` | `<img>` native | ✅ Trivial | 1:1 (per Sub-epic 5J precedent — drop Vuetify dependency for simple icons) |
| `<VSpacer>` | flex spacer `<div style="flex: 1">` OR margin utility | ✅ Trivial | 1:1 |
| `Teleport to="body"` | Native Vue 3 — no Vuetify dep | ✅ Already standard | Already used by ConnectWallet, HelpModal, PhModal patterns |

### Per-cluster mapping summary

**AW3 cluster (Account components):**
- ChangeLogin.vue: VModal × 1 → inline Teleport; VCard × 1 → HexCard; v-progress-circular × 1 → CSS spinner; InputField preserved (v2-native)
- ChangePassword.vue: VModal × 1 → inline Teleport; VCard × 1 → HexCard; VBtnDark × 2 → HexButton secondary; VBtn × 1 → HexButton primary; v-progress-circular × 1 → CSS spinner; 3× InputField preserved
- DeleteAccount.vue: VModal × 1 → inline Teleport; VCard × 1 → HexCard; VBtnDark × 1 → HexButton secondary; VBtn × 1 (destructive) → HexButton danger
- ConfirmEmail.vue: InputField preserved; VBtnDark → HexButton secondary
- GameBalanceCard.vue: VCard → HexCard (or scoped div) + verify `master.getBalance()` formatting preserved

**AW1 cluster (Auth forms):**
- Login.vue: 2× InputField preserved; v-progress-circular → CSS spinner; VBtn → HexButton primary
- Signup.vue: 3× InputField preserved; v-progress-circular → CSS spinner; VBtn → HexButton primary
- Reset.vue: 1× InputField preserved; v-progress-circular → CSS spinner; VBtn → HexButton primary
- TelegramLogin.vue: 1× InputField preserved (read-only); VBtn → HexButton primary

**AW2 cluster (Wallet):**
- ConnectWallet.vue: already custom Teleport (no VModal); only minor token alignment if needed
- ProfileWallet.vue: legacy v1 wrapper — may DELETE if HudProfileWallet (v2) covers all flows (verify Sub-epic 3 routing for `/profile/wallet` redirects all к `/v2/wallet` via `claude/visual-polish-auth-wallet-6xe6m` + 6A precedent)

### Total Vuetify → v2 swap surface

- `<VModal>` × 3 sites
- `<VCard>` × 4 sites (3 in modals + 1 GameBalanceCard) [+ N inline VCard nested usages — verify per-component]
- `<VBtnDark>` × 4+ sites (ConfirmEmail × 1, ChangePassword × 2, DeleteAccount × 1)
- `<VBtn>` × 6+ sites (Login, Signup, Reset, TelegramLogin × 4 + ChangePassword confirm × 1 + DeleteAccount confirm × 1)
- `<v-progress-circular>` × 5 sites (Login, Signup, Reset, ChangeLogin, ChangePassword) + 1 в NoConnection (B5/Q7)
- `<v-switch>` × 1 site (Switcher3DPunch — DROP candidate per #14)

**Total: ~22-23 Vuetify primitive callsites in Sub-epic 7 swap scope.**

Per CLAUDE.md broader Vuetify census (16 VModal sites grep, 134 VBtnDark+VBtn+VCard+VTextField+InputField imports total) — Sub-epic 7 covers ~7-10% of total Vuetify surface. Remaining bulk (BuyTokens, ProfileButtons, ProfileInvite, NewAchievement, ClanWithdraw, ClanEdit, ClanPageContent, training SubscribeModal/TaskModal/DailyTasks, etc.) defers к Эпик 7+ legacy code cleanup OR sub-epic 8 cutover hardening.

---

## Subsection 6 — Semantic invariant + flow direction verification

Phase 0 mandate: BE-truth invariants vs derived FE state. PROMOTED Sub-epic 6 — now mandatory.

### Auth flow semantic invariants

**1. User authentication state derivation:**
- **BE-truth:** JWT token issued by `POST /v1/auth/login` (or signup/reset/telegram). Token contains `userId` and TTL.
- **FE-derived:** `master/getLoginState` getter returns `{ isAuthenticated: boolean, ... }`. Authentication = JWT present + valid signature + not expired.
- **Verification mechanism:** `apiClient` interceptor adds `Authorization: Bearer <jwt>` header. Backend `authMiddleware` validates per request.
- **Restoration on reload:** JWT persisted to localStorage (verify exact key); UserModel populated from `GET /v1/user/me` on reload.
- **Single source of truth:** JWT validity = ground truth. FE `isAuthenticated` is derivation from JWT presence + decode + (optional) expiry check.
- **Sub-epic 7 AW1 implication:** restyle restyles forms only. DO NOT change JWT handling, localStorage persistence keys, or apiClient interceptor pattern. AW1 commits should NOT touch `master/login` action body.

**2. Post-auth redirect flow:**
- **Trigger:** Successful auth dispatch → store mutation sets `isAuthenticated = true` → component finally block → router cascade
- **Direction:** `/auth/login` (guest) → POST → 200 OK → `master/login` mutation → guard re-evaluation → if `isAuthenticated` → next destination
- **Default destination:** `/` Home route → guard checks → currently goes to `/v2` (per system migration to v2 default routes)
- **Special case:** Saved fight state — `getSavedFightPhase()` may redirect к `/fight` instead of home
- **Carry-over implication:** v2 cutover auth posture audit (carry-over #10) tracks this — Sub-epic 7 AW1 should NOT introduce custom redirect logic; preserves existing guard chain.

**3. Session restoration on reload:**
- **Trigger:** Vue app boots → `App.vue` → `master/init` action → loads UserModel from local storage / IndexedDB / WS sync per CLAUDE.md "Data Persistence" section
- **Backend sync:** `GET /v1/user/me` restores authoritative state on login restore
- **Implication:** AW1 restyle preserves init flow. NO touches к `master/init` action.

### Wallet semantic invariants

**1. Connection state machine:**
- **States:** disconnected → connecting → connected → (disconnecting) → disconnected
- **BE-truth:** wagmi internal connector state — `useAccount().isConnected` reactive ref is ground truth
- **FE-derived:** ConnectWallet modal `pendingConnector` ref = "connecting" UI indicator; not authoritative state
- **Critical invariant:** `useAccount().address` reactive ref = active address (only meaningful if `isConnected === true`)
- **Sub-epic 7 AW2 implication:** preserve `useAccount/useConnect/useDisconnect/useConnectors` API surface verbatim. Restyle modal visuals only.

**2. Wallet → User account derivation:**
- **Direction:** wagmi `useAccount().address` watch → dispatches `master/updateMaster { walletAddress }` → UserModel.walletAddress updated → backend persists `PUT /v1/user/edit` или `/v1/user/wallet`
- **Disconnect handling:** `address === undefined/null` → dispatch `{ walletAddress: '' }` per ProfileWallet.vue:43-47 + HudProfile.vue:385 patterns
- **Critical invariant:** wagmi state is ground truth для wallet. UserModel.walletAddress = derived persisted reflection. If they diverge (e.g., user switches wallets), wagmi watch reconciles.
- **Sub-epic 7 AW2 implication:** preserve watch + dispatch chain. DO NOT add new derivation logic. The pattern is already correct.

**3. Sign-in-with-wallet coupling — VERIFIED ABSENT:**
- Current Hexlash architecture: wallet connect is **independent** of auth (Login/Signup/Telegram). User logs in first (JWT), THEN can optionally connect wallet for token operations.
- No "Sign in with Ethereum" (SIWE / EIP-4361) flow currently — verified by absence of SIWE-related code in wagmiConfig.js + auth components.
- **Sub-epic 7 implication:** AW2 should NOT introduce SIWE coupling. Wallet remains supplemental к JWT-based auth. Preserves architecture.

### Coach pause / fight state derivation (B4)

**1. CoachPauseState invariant (refactor item #23):**
- Current v2: single `coachPauseOpen` boolean + `coachPauseText` string mutated by HudFight.vue:139 ("Waiting for opponent...") — this is FE-derived state
- BE-truth: `coach_pause` event from BE indicates fight paused; `coach_result` indicates resumption
- Direction: BE event → FE state derivation → UI render
- **Sub-epic 7 B4 implication:** introduce `coachPauseState: 'choosing' | 'waiting' | null` enum — distinguishes 2 FE-derivation states triggered by single BE-truth ("paused"). Player picks a strategy → `coach_choice` WS dispatch → BE → BE applies effect after timeout/both-decided → BE emits `coach_result` → FE clears state.
- **Critical:** DO NOT introduce derivation that conflicts с BE-truth. State transitions must mirror BE event flow.

**2. Coach active boost duration (#22):**
- BE-truth: BE engine applies coach boost effect for COACH_BOOST_ROUNDS (4 rounds per CLAUDE.md). BE doesn't broadcast roundsLeft — FE derives.
- FE-derived: `coachRoundsLeft` decremented per round in FE. Initial value = 4 set in setCoachStrategy.
- **Risk:** if BE applies boost differently (e.g., based on actual rounds elapsed in match clock vs FE round counter), FE display can drift.
- **Sub-epic 7 B4 implication:** verify BE COACH_BOOST_ROUNDS aligns with FE constant. If discrepancy — FE displays "approximate" duration (acceptable per existing v1 pattern, since v1 does same derivation per CardFightView.vue:101-105).

### Carry-over #16 future-Claude warning re-iteration

**`isPlayer1: false` hardcode в `ChallengeNotification.vue:62` IS semantically correct.**
- BE invariant: `pvpMatchManager.createMatch(matchId, {challenger as player1}, {acceptor as player2})`
- ChallengeNotification handles `challenge_accepted` event — runs on **acceptor side**, who IS player2 by BE convention.
- ТЗ-proposed derivation `data.opponent?.odId !== userData.id` would always evaluate `true` (opponent ≠ self) → would set `isPlayer1: true` on acceptor → **inverted from correct value**.
- **Sub-epic 7 implication:** if AW1/AW2 work touches ChallengeNotification.vue (unlikely, but possible if challenge UI gets restyled): DO NOT "fix" this hardcode. It's correct.
- This invariant verified Sub-epic 5 + Sub-epic 6 (per CLAUDE.md). Stable across 2 occurrences.

### Sub-epic 7 derived state risks

Phase 1 ТЗ writers should be aware of these derivation patterns in scope:

1. **Auth `isAuthenticated`** — derivation from JWT validity. Don't introduce alternative checks.
2. **Wallet `isConnected`** — wagmi-driven. Don't introduce parallel state.
3. **Coach pause state** — BE event-driven; FE distinguishes 2 sub-states for UX. Don't add 3rd derivation that conflicts.
4. **Active effects in spectate** — BE event payload field; FE caches in spectateState. Don't compute alternative active state.
5. **isPlayer1 in challenge** — BE invariant; hardcoded literal correct. Don't compute.

---

## Lesson #36 status — HudProfile card count

**Current count: 6 cards.** Per `src/components/hud/HudProfile.vue`:

1. Line 19: `<!-- IDENTITY -->` `<div class="profile-card">`
2. Line 61: `<!-- PERFORMANCE -->`
3. Line 102: `<!-- FRIENDS -->`
4. Line 185: `<!-- SETTINGS -->`
5. Line 219: `<!-- 5Q — Retirement card -->`
6. Line 226: `<!-- 5J — Social Tasks card -->`

Lesson #36 monitor threshold: 7 cards triggers refactor (split HudProfile or re-organize).

### Sub-epic 7 trigger assessment

**Auth + Wallet redesign assessment — DOES NOT add card to HudProfile:**

- AW1 (Auth) — works in `RainView.vue` + child auth forms — these are NOT HudProfile children. `/auth/*` routes are separate from `/v2/profile`. **No card added to HudProfile.**
- AW2 (Wallet) — works in `HudProfileWallet.vue` (`/v2/wallet` separate route per Sub-epic 3 Path A) + `ConnectWallet.vue` modal + `GameBalanceCard.vue`. The Wallet section is its own /v2/wallet view, NOT a card in HudProfile. **No card added to HudProfile.**
- AW3 (Account components) — works in `HudProfileAccount.vue` (`/v2/account` separate route per Sub-epic 3 Path A) + 4 account components (ConfirmEmail, ChangeLogin, ChangePassword, DeleteAccount). The Account section is its own /v2/account view, NOT a card in HudProfile. **No card added to HudProfile.**

**Verdict:** Sub-epic 7 main scope (Auth+Wallet+Account) does NOT increase HudProfile card count. Lesson #36 monitor remains 6/7.

**Polish bundle assessment:**

- B1-B6 polish bundles (carry-overs #11-#37) — none touch HudProfile card structure. Items #11/#13 modify HudProfile internal state binding (Friends card row a11y) but don't add cards. **Monitor not triggered.**

**Final Lesson #36 status entering Sub-epic 7 Phase 1: 6/7 (UNCHANGED).**

If Phase 1 ТЗ surfaces an unexpected card addition (e.g., Wallet preview within HudProfile, or referral display) → trigger Lesson #36 refactor STOP boundary, escalate к design-Claude.

---

## Recoveries log

### Recovery #88 — Phase 0 STEP 0 bootstrap branch verification (Lesson #43 8th occurrence)

**Detected:** Pre-flight git verify revealed harness assigned fresh slug `claude/visual-polish-auth-wallet-6xe6m` instead of continue stack `claude/investigate-matchmaking-2JlwO-WfdV0` documented in handoff. Both branches at SHA `d27bcbe` (Sub-epic 6 CL3 closure commit) — zero work-loss risk.

**Classification:** Adaptation-tier per Lesson #35 framework. Mirror of Recoveries #82 (Sub-epic 2) / #85 (Sub-epic 5) / #86 (Sub-epic 6 Phase 0) / #87 (Sub-epic 6 CL1 boundary). Pattern stable across 8 consecutive occurrences:

| # | Sub-epic | Phase | Branch divergence detail |
|---|---|---|---|
| 1 | 5U | Phase 0 STEP 0 | Designated branch override per user |
| 2 | Sub-epic 2 | Phase 0 STEP 0 | Harness `claude/review-documentation-MPIjj` vs continue stack |
| 3 | 4a | Phase 0 STEP 0 | Same SHA, harness fresh-slug |
| 4 | 4b | Phase 0 STEP 0 | Same SHA, harness fresh-slug |
| 5 | Sub-epic 5 | Phase 0 STEP 0 | Harness `claude/investigate-matchmaking-2JlwO` |
| 6 | Sub-epic 6 | Phase 0 STEP 0 | Same SHA, harness fresh-slug |
| 7 | Sub-epic 6 | CL1 boundary | Harness `claude/fix-surrender-bug-S7LfH` |
| 8 | **Sub-epic 7** | **Phase 0 STEP 0** | **Harness `claude/visual-polish-auth-wallet-6xe6m`, same SHA `d27bcbe`** |

**Decision rationale (Sub-epic 7):** System-level directive in environment header explicitly says "Develop on branch `claude/visual-polish-auth-wallet-6xe6m`". Phase 0 is read-only investigation — branch choice doesn't affect findings; output saved к `/mnt/user-data/outputs/` (outside repo). Same SHA = zero work-loss risk. Stay on harness fresh-slug.

**Implication for Phase 1:** First commit decision needed — stay on harness slug (matches system directive, mirror 5U precedent) OR switch к continue stack (matches Sub-epic 2-6 single-PR pattern). Recommendation: stay on harness slug since (a) system directive is explicit, (b) reconciliation already deferred к Эпик 6 cutover per HANDOFF_EPIC6_CUTOVER §3 R5, (c) two branches both ahead of main at same SHA — final reconciliation в Sub-epic 8.

**Status:** Streak preserved. **Cumulative recoveries: 87+ → 88+** (after Phase 0 closure).

**Pattern stable. Lesson #43 already PROMOTED — no further promotion action needed.**

---

## Phase 0 catches log

Phase 0 was investigation-only (no edits). Lesson #11 reflex applied during fact-gathering. Notable surfaces during investigation:

### Catch #1 — `.hex-modal` CSS classes pre-exist (positive negative-space surprise)

**Surface:** Initial assumption (pre-Phase-0) was that v2 has no modal primitive at all — would need to create from scratch. Investigation read of hexlash-ui.css revealed `.hex-modal-overlay` (lines 440-452) + `.hex-modal` (455-466) + `.hex-modal-title` (469-478) ALREADY defined.

**Impact:** Reduces AW3 cluster scope — modal swap can use existing CSS classes inline (Option a) without new SFC primitive (Option b). User notes this finding explicitly per ТЗ context.

**Tier:** Positive surprise — pre-edit verification confirmed available infrastructure. Validation of Lesson #11 reflex (verify shape with real data, не assume).

### Catch #2 — `NoConnection.vue` already in v2 ui directory

**Surface:** Handoff Q7 implied NoConnection needs migration к v2 directory + v2 token alignment. Investigation found NoConnection.vue ALREADY at `src/components/ui/NoConnection.vue` AND ALREADY uses `--hex-*` tokens throughout scoped style. Only Vuetify dependency: `<v-progress-circular>` for loader spinner.

**Impact:** Reduces Q7 scope — restyle is minor (replace v-progress-circular + tokenize remaining magic values). Bundle с B5 Spectate polish trivial.

**Tier:** Adaptation — handoff assumption refined by codebase reality. No structural concern.

### Catch #3 — `v2ProtectedNames` array narrow (only 3 routes)

**Surface:** Investigation of router.beforeEach guard revealed `v2ProtectedNames = ['V2Fight', 'V2Matchmaking', 'V2Spectate']` — only 3 of 14 v2 child routes flagged. Other 11 v2 routes (V2Pit/V2FighterDetail/V2Training/V2Create/V2Profile/V2Ratings/V2Clan/V2GuestClan/V2Shop/V2Help/V2UserProfile/V2Wallet/V2Account) are effectively public despite being protected-route conceptually.

**Impact:** Carry-over #10 (v2 cutover auth posture audit) reinforced as real concern. Confirms Sub-epic 8 territory. **Sub-epic 7 should NOT add new v2 routes (e.g. `/v2/auth/*`) without addressing systemic auth posture FIRST** — would amplify the gap.

**Tier:** Adaptation + scope-boundary signaling. Reaffirms carry-over #10 priority.

### Catch #4 — `ErrorMsg` shape divergence is intentional documented in code

**Surface:** Investigation of backend handler.js found line 671 in-code comment: *"ErrorMsg shape: BE flat {type, error, code} per Sub-epic 5 carry-over"*. The divergence is acknowledged + intentional pending consolidation, not bug.

**Impact:** Q4 decision is informed by intentional state — Option B (FE tolerant parser) is even more justified, since BE consolidation is known debt being deferred.

**Tier:** Adaptation — handoff carry-over corroborated by code comment. Validates recommendation Option B.

### Catch #5 — Switcher3DPunch + `punch/is2DPunchEnabled` may have hidden consumers

**Surface:** Pre-edit grep needed before AW3 DROP commit для Switcher3DPunch. Specifically `is2DPunchEnabled` getter may be consumed by `Punch3D.vue` or other 3D-rendering components for conditional rendering. If consumers exist, DROP becomes structural concern.

**Impact:** Phase 1 AW3 commit must include explicit grep step before file deletion. If hidden consumers found → escalate decision к design-Claude (PRESERVE Vuetify-style).

**Tier:** Pre-edit verification reminder. Lesson #11 reflex applied.

### Catch #6 — Backend `referralCode` parameter in register dispatch

**Surface:** Sub-epic 7 AW1 commit will edit Signup.vue. Current dispatch payload at `Signup.vue:130` is `{ login, password }` only. Backend supports `referralCode` per CLAUDE.md "Referral System" — value comes from localStorage. Verify that `master/register` action internally reads localStorage `referralCode` (via `referralCodeService` или similar), so AW1 visual restyle preserves this behavior implicitly.

**Impact:** AW1 Signup.vue commit must NOT remove form pattern that localStorage read pattern depends on. Pre-edit verification needed.

**Tier:** Pre-edit verification reminder. Lesson #11 reflex.

### Total Phase 0 catches: 6

All catches adaptation-tier OR pre-edit verification reminders. Zero STOP-tier triggered. Zero hot-fix concerns. Pattern parity с Sub-epic 5/6 Phase 0 reports.

---

## Final summary

### Total Sub-epic 7 commit estimate

**Initial handoff estimate:** 12-18 commits (M-L size).
**Phase 0 preview (PART 1):** 14-19 commits (slight upward drift).
**Phase 0 final estimate (after detailed bundle/cluster review):**

| Cluster | Commits | Notes |
|---|---|---|
| B1a CSS quick wins (#12, #32, #37) | 1 | Atomic |
| B1b State/template quick wins (#11, #13, #36) | 1 | OR split к 3 atomic per Mode A — defer decision к Phase 1 |
| B1c FE tolerant parser (#31 ErrorMsg Option B) | 1 | Bundled per Q4 recommendation; OR fold into B1b if scope tight |
| B2 HudFight visual polish core (#18, #19, #24, #27) | 2 | Likely split (event title + shake separate from flash + cooldown) |
| B3 Dice icons + modifiers bar (#25, #26) | 1-2 | Couple — icons enable bar |
| B4 Coach UX completion (#22, #23) | 1-2 | Active bar separate from showWaiting refactor |
| B5 HudSpectate polish + NoConnection bundle (#34, #35, Q7 NoConnection) | 1-2 | Coach pause overlay separate from active effects |
| B6 Optional UI (#20, #28) | 0-1 | DECIDE post-B2/B3; recommend skip |
| AW3 Account Vuetify→v2 port + #14 Switcher3DPunch DROP | 3 | (1) modal strategy + Switcher3DPunch DROP + ConfirmEmail; (2) ChangeLogin; (3) ChangePassword + DeleteAccount |
| AW2 Wallet redesign | 2 | (1) GameBalanceCard restyle + HudProfileWallet visual; (2) ConnectWallet modal token alignment |
| AW1 Auth redesign | 3-4 | (1) RainView container audit + decision marker; (2) Login + Signup; (3) Reset + TelegramLogin; (4) RainView 3D rain final touch — optional 4th |

**Total range: 16-21 commits.** Within handoff M-L estimate (drift к 21 acceptable if optional B6 + AW1 4th included; trim к 16 if defer-aggressive).

**Recommended target: 17-18 commits** (drop B6, atomic B1b/B1c, AW1 без 4th touch-up). Comfortable middle.

### Path γ cluster sequence — final proposal

Per handoff "alternating polish + auth/wallet" pattern. Starting smallest-risk-first principle. Order:

| # | Cluster | Items | Commits | Cumulative |
|---|---|---|---|---|
| **1** | **B1a** | CSS quick wins (#12, #32, #37) | 1 | 1 |
| **2** | **B1b** | State/template quick wins (#11, #13, #36) | 1 | 2 |
| **3** | **B1c** | FE tolerant parser (#31 Option B) | 1 | 3 |
| **4** | **B2** | HudFight visual polish core (#18, #19, #24, #27) | 2 | 5 |
| **5** | **AW3** | Account Vuetify→v2 + #14 DROP | 3 | 8 |
| **6** | **B3** | Dice icons + modifiers bar (#25, #26) | 1-2 | 9-10 |
| **7** | **AW2** | Wallet redesign | 2 | 11-12 |
| **8** | **B4** | Coach UX completion (#22, #23) | 1-2 | 12-14 |
| **9** | **AW1** | Auth redesign | 3-4 | 15-18 |
| **10** | **B5** | HudSpectate polish + NoConnection (#34, #35, Q7) | 1-2 | 16-20 |

**Closure phases:** + 3 closure commits (CLAUDE.md update, FINAL_REPORT, HANDOFF_EPIC6_SUBEPIC_8).

**Total: ~17-18 functional + 3 closure = 20-21 commits in Sub-epic 7.**

**Rationale for sequence:**
1. B1a/B1b/B1c first — quick wins build confidence + close fastest carry-overs
2. B2 next — core HudFight polish is the largest single PvP UX improvement; user-visible value
3. AW3 mid — Vuetify→v2 port establishes modal pattern (Option a inline) before auth/wallet visual work
4. B3 alternates back к polish — dice/modifiers complete fight UX
5. AW2 wallet — smaller AW commit, lower risk
6. B4 coach UX — important fight UX completion (not blocking but valuable)
7. AW1 auth — biggest risk last, RainView + 4 forms restyle in one cluster
8. B5 spectate + NoConnection — polish closure + final v2 token alignment

### Critical user decisions needed before Phase 1

**1. Path γ confirmed FIXED.** No revision needed unless Phase 0 surfaces structural blocker (none detected).

**2. Modal strategy AW3 (Option a vs b).** RECOMMENDATION: **Option a (inline Teleport)**.
- Faster, mirrors ConnectWallet.vue precedent
- No new abstraction overhead
- Defers `Modal.vue` SFC primitive к Эпик 7+
- Trade-off: ~90 lines repetitive Teleport scaffolding across 3 components
- **Decision: confirm Option a OR override к Option b.**

**3. ErrorMsg shape (Q4) — bundle/defer.** RECOMMENDATION: **Option B (FE tolerant parser)** bundled in B1c.
- Single FE file edit (webSocketState.js:142-144)
- No BE touch → no Lesson #33 6th application risk
- Closes user-visible symptom (silently swallowed errors will surface)
- BE consolidation deferred к Эпик 7+
- **Decision: confirm Option B OR override к Option A (BE fix + cherry-pick PR) OR Option C (defer Sub-epic 8).**

**4. Switcher3DPunch (#14) — drop/port/preserve.** RECOMMENDATION: **DROP** (delete file + cleanup punchState references).
- Aligns с Sub-epic 3 Q-tactical-1 SKIP precedent
- Closes carry-over #14 cleanly
- Reduces Vuetify v-switch surface
- Pre-edit verification needed: grep `is2DPunchEnabled\|set2DPunch\|Switcher3DPunch\|is3dPunch` to confirm zero hidden consumers
- **Decision: confirm DROP OR override к PRESERVE (Vuetify-style remains).**

**5. RainView 3D rain — keep/scrap.** RECOMMENDATION: **KEEP**.
- 3D rain background = visual identity asset, working stable
- Scrapping = lose distinctiveness + bundle savings ~?? KB unclear
- Restyle scope = 4 forms only (preserve container)
- **Decision: confirm KEEP OR override к SCRAP (would expand AW1 scope).**

**6. Friends Watch Live closure (Q6) — bundle/defer.** RECOMMENDATION: **DEFER к Sub-epic 8**.
- BE touches required (currentFight + 'in_fight' status field)
- Sub-epic 8 has comprehensive sweep — natural fit
- Sub-epic 7 scope discipline preserved
- **Decision: confirm DEFER OR override к BUNDLE (adds Lesson #33 6th application + BE commit).**

**7. AW1 4th commit — RainView 3D rain final touch.** RECOMMENDATION: **SKIP** (defer к Эпик 7+).
- Optional polish; not user-visible value
- AW1 already 3 commits without it
- **Decision: confirm SKIP OR include if scope allows.**

**8. B6 optional UI (#20, #28) — include/skip.** RECOMMENDATION: **SKIP**.
- #20 cumulative damage stats — display only, BE persists actual XP
- #28 XP earned display — local preview only, backend authoritative
- Defer к Эпик 7+ unless user explicitly requests
- **Decision: confirm SKIP OR include 1 commit each.**

**9. Branch decision — first commit.** RECOMMENDATION: **stay on `claude/visual-polish-auth-wallet-6xe6m`** (system directive).
- Matches harness assignment (per Recovery #88)
- 5U precedent (designated branch over continue stack accepted)
- Reconciliation already deferred к Эпик 6 cutover (Sub-epic 8)
- **Decision: confirm stay OR override switch к continue stack.**

### Risks list

**HIGH:**
1. **AW1 Auth scope expansion (RainView 1212 lines)** — preserving 3D rain limits restyle to forms only (manageable). If scrap chosen mid-flow → Lesson #44 re-anchor required + Phase 1 ТЗ rewrite.
2. **AW3 modal swap regression** — destructive flow (DeleteAccount) regression risk; ChangePassword + ChangeLogin + DeleteAccount confirm dialogs must work atomically. Recommend AW3-Commit3 (DeleteAccount last) для max scrutiny.
3. **Vuetify → v2 dispatch chain preservation** — replacing Vuetify primitives must NOT touch dispatch logic. Pre-edit verification на каждом commit.

**MEDIUM:**
4. **Lesson #36 7-card refactor trigger** — none of Sub-epic 7 work expected to add card к HudProfile (verified). If unexpected addition surfaces (e.g. Phase 1 ТЗ adds wallet preview к HudProfile), STOP boundary triggered.
5. **Path γ alternating sequence break** — if user surfaces priority shift mid-flow (e.g. "AW1 first now"), Lesson #44 re-anchor strict — re-propagate sequence через все downstream artefacts.
6. **B5 NoConnection bundle scope drift** — restyle is minor (~15 lines CSS), but если verify-progress-circular replacement requires shared `.hex-spinner` primitive, scope expands. Recommend per-consumer scoped CSS spinner (no abstraction).
7. **#11 friendsState captain field — verify no test regressions** — adding `captain: u.captain || null` to map output should be additive only, but verify no consumers check map output strictly.

**LOW:**
8. **Backend referralCode coupling в Signup AW1** — visual restyle should not affect localStorage read pattern, but pre-edit verify chain.
9. **Switcher3DPunch hidden consumers** — pre-edit grep mandatory before AW3-Commit1 DROP.
10. **NoConnection BottomMenu collision** — `bottom: 12vh` may overlap с BottomMenu legacy view; verify v2 routes (BottomMenu hidden on PvP screens per CLAUDE.md, but verify matchmaking/spectate/fight/auth/wallet contexts).

### Phase 1 ТЗ writer checklist

When writing Phase 1 ТЗ для Sub-epic 7:
1. Resolve 9 critical decisions above (recommended defaults vs user override)
2. Apply 6 mandatory subsections (per Sub-epic 6 PROMOTED — semantic invariant + flow direction is now mandatory)
3. Mode A discipline — 1 commit per step, build pass per commit, push per commit, STOP-and-confirm after C1
4. Lesson #11 reflex — pre-edit + post-edit grep on every edit
5. Lesson #32 — convention discovery, mirror existing pattern
6. Lesson #34 — HUD overlay convention default
7. Lesson #44 — re-anchor scope after revision; no mental-model carry-overs between audit reminder blocks
8. Cherry-pick PR pattern only IF Q4 Option A chosen OR Q6 BUNDLE chosen (otherwise pure FE Sub-epic — no Lesson #33 application)
9. Closure shape: **Standard linear** if no BE touches; **Code-complete + deferred-deploy** if BE touches bundled

### Overall assessment

**Sub-epic 7 is functionally well-scoped given Phase 0 findings.** Key positives:
- v2 design system primitives mostly ready (Modal CSS exists, Card/Button/Input/Progress/Badge SFCs ready)
- NoConnection already в v2 directory + tokens
- ConnectWallet already custom Teleport (no Vuetify modal removal)
- Wagmi composables stable + не trogать
- HudProfile card-creep monitor at 6/7 — Sub-epic 7 expected NOT trigger
- Auth/wallet/account flows functional preservation requirements clear
- 14 polish carry-overs cleanly bundleable in 5-7 commits

Key concerns:
- AW1 RainView 1212 lines — largest visual surface in Sub-epic 7
- VModal × 3 swap with no SFC primitive abstraction — repetitive Teleport scaffolding (acceptable trade-off per Option a)
- 3 critical user decisions early-Phase-1 needed to unblock writing

**Streak risk: LOW.** Sub-epic 7 follows Sub-epic 5/6 mature scope pattern. Lesson #11 reflex stable across 8 sub-epics. Phase 0 catches 6 — all adaptation-tier OR pre-edit verification reminders. No STOP-tier surfaces.

**Recommendation: proceed к Phase 1 ТЗ writing with 9 critical decisions presented к user in single batch.**

---

**END OF PART 3B — PHASE 0 COMPLETE.**

Phase 0 report saved across 4 files:
- `/mnt/user-data/outputs/EPIC6_SUBEPIC_7_PHASE_0_REPORT_PART1.md` (STEP 0 + Q1 + Q2 + Q3)
- `/mnt/user-data/outputs/EPIC6_SUBEPIC_7_PHASE_0_REPORT_PART2.md` (Q4 + Q5 + Q6 + Q7)
- `/mnt/user-data/outputs/EPIC6_SUBEPIC_7_PHASE_0_REPORT_PART3A.md` (Subsections 1-3)
- `/mnt/user-data/outputs/EPIC6_SUBEPIC_7_PHASE_0_REPORT_PART3B.md` (Subsections 4-6 + Lesson #36 + Recoveries + Phase 0 catches + Final summary)

Total Phase 0 surface: ~1900 lines across 4 files. Within Sub-epic 5/6 Phase 0 size range (800-1000 lines each, this 4-part split distributes к smaller atomic files for stream timeout resilience).
