# Phase 0 Report — Sub-epic 7 — Visual polish + Auth/Wallet redesign — PART 1

**Branch:** `claude/visual-polish-auth-wallet-6xe6m` (harness fresh-slug; same SHA as continue stack)
**HEAD:** `d27bcbe` (Sub-epic 6 CL3 closure commit)
**Path:** γ — mixed batch with explicit milestones (FIXED per user)
**Streak entering:** 30 ✅
**Эпик 6 progress:** 13/14 (93%)
**Phase 0 mode:** Investigation only, no edits.

---

## STEP 0 — Git verify result

```bash
git fetch                  # → branches sync, no errors
git status -uno            # → On branch claude/visual-polish-auth-wallet-6xe6m, nothing to commit
git branch --show-current  # → claude/visual-polish-auth-wallet-6xe6m
git log --oneline -5       # → d27bcbe docs(6): Sub-epic 7 chat handoff (CL3)
                           #   e1a66e9 docs(6): Sub-epic 6 final report (CL2)
                           #   709e692 docs(6): CLAUDE.md update — Sub-epic 6 closure (CL1)
                           #   c488192 feat(spectate): cleanup discipline + leave handlers
                           #   996d40f feat(spectate): race guards (Q8.1-Q8.3)
```

### Recovery #88 — Lesson #43 8th occurrence (adaptation-tier)

**Detected:** Harness assigned fresh slug `claude/visual-polish-auth-wallet-6xe6m`. ТЗ specified continue stack `claude/investigate-matchmaking-2JlwO-WfdV0`. Both branches point to same SHA `d27bcbe` (Sub-epic 6 CL3 closure). System-level directive in environment header explicitly says "Develop on branch `claude/visual-polish-auth-wallet-6xe6m`".

**Decision:** Stay on harness fresh-slug. Phase 0 is read-only investigation — branch choice doesn't affect findings, output saved to `/mnt/user-data/outputs/` (outside repo). Same SHA = zero work-loss risk. Adaptation-tier per Lesson #35 framework, identical to Recoveries #82/#85/#86/#87. Pattern stable across 8 consecutive occurrences (5U / Sub-epic 2 / 4a / 4b / 5 / 6 Phase 0 / 6 CL1 / 7 Phase 0).

**Implication for Phase 1 design-Claude:** First commit decision needed — stay on harness slug `claude/visual-polish-auth-wallet-6xe6m` (matches system directive, same as 5U precedent which also broke continue stack for designated branch) OR switch к continue stack `claude/investigate-matchmaking-2JlwO-WfdV0` (matches Sub-epic 2-6 single-PR pattern). Both branches ahead of main, same SHA — reconciliation already deferred к Эпик 6 cutover per HANDOFF_EPIC6_CUTOVER §3 R5. Recommendation: stay on harness slug since system directive is explicit; reconciliation в Sub-epic 8 territory anyway.

---

## Q1 — Polish carry-over batch organization (Path γ)

### Q1.1 — Per-item factual evaluation

| # | Item | File:line evidence | Bundle? | Size | Files touched | Dependencies |
|---|---|---|---|---|---|---|
| **11** | friendsState.searchPlayers captain field drop | `src/core/state/modules/friendsState.js:133-141` (map drops `captain`); `src/components/pvp/PlayerSearchResult.vue:6` (`:captain="player.captain"` always undef); `src/components/ui/UserCaptainBadge.vue:2-10` (renders "—" fallback) | YES | XS (1 line + map field add) | friendsState.js | None |
| **12** | HudRatings 8-col CSS grid mismatch | `src/styles/v24/ratings.css:134-144, 166-168` (`grid-template-columns: 50px 2fr 90px 80px 70px 70px 70px 70px` hardcoded 8); HudRatings.vue thead line 372-379 (CLANS=6 cells), 405-412 (AGENTS=6), 449-457 (FIGHTERS=7) | YES | S (per-tab modifier classes) | ratings.css + HudRatings.vue | Adds `.ratings-thead--clans`/`--agents`/`--fighters` modifier classes |
| **13** | HudRatings keyboard a11y | HudRatings.vue:299-318 (tab `<button>` no `role="tab"`/`aria-selected`/`aria-controls`); 388-391 (`<div @click=...>` no `tabindex`/`role="button"`/keydown.enter) | YES | S (HTML attributes batch) | HudRatings.vue | None |
| **18** | Dodge/crit overlay title mechanism | v1: `CardFightView.vue:67-70` (.event-title template) + 940-950 (`fight/setEventTitle` commit + 1200ms timeout) + 1411-1434 (CSS @keyframes titlePop). v2: HudFight.vue absent | YES | M | HudFight.vue + useFightSimulation.js + fight-overlays.css | None |
| **19** | Shake animation gap | v1: `CardFightView.vue:1320-1327` (@keyframes shake 0.35s) + 24-51 (template `:class="{ 'fighter-shake': shakeLeft }"`) + 458-459 (trigger setTimeout 400ms). v2: HudFight.vue absent | YES | S | HudFight.vue + useFightSimulation.js + fight-overlays.css | None |
| **20** | Cumulative damage stats | v1: `cardFightState.js:261-269` (addStats mutation: totalDamageDealt/Taken/criticalHits). v2: useFightSimulation.js absent (no fightStats field) | MAYBE | S-M | useFightSimulation.js + ResultOverlay.vue | UI scope decision (handoff "MAYBE") |
| **21** | Log actor colors hardcoded warden/predator | useFightSimulation.js:111 (`actorClass = isLeft ? 'actor-warden' : 'actor-predator'` position-based, not archetype) | NO | — | — | Confirmed v2-introduced prototype convention, NOT v1 parity gap (CardFightView.vue has zero `actor-warden`/`actor-predator` refs) |
| **22** | v2 coach active boost UI | v1: `CardFightView.vue:101-105` (.coach-active-bar with iconTrainer + label + roundsLeft `{{ R }}R`). v2 useFightSimulation.js has `coachStrategy` but no `coachActive`/`coachRoundsLeft` | YES | M | HudFight.vue + useFightSimulation.js + fight-overlays.css | Need iconTrainer asset (already exists per #25) |
| **23** | v2 single coach overlay vs v1 dual | v1: `CardFightView.vue:273` (`showWaiting` ref) + 177 (.pvp-waiting-overlay) separate from coach choice. v2 HudFight.vue:139 mutates `coachPauseText = 'Waiting for opponent...'` (Sub-epic 4a workaround) | YES | S | useFightSimulation.js + CoachPause.vue | Refactor to `coachPauseState: 'choosing'\|'waiting'\|null` enum |
| **24** | Per-type flash color mapping | v1: `CardFightView.vue:474-488` (8-color map heal/adrenaline/shield/blind/rage/crit/damage/overdrive). v2 `useFlashHit.js:19-34` bare signature, no params, white-only | YES | S-M | useFlashHit.js + HudFight.vue | Inline-style binding |
| **25** | Dice icon assets | v1: `CardFightView.vue:250-256` imports 8 icons (dice/trainer/adrenaline/shield/blind/attack/defense/position) from `@/assets/images/icons/`. Assets verified ✓. v2 HudFight.vue:56 uses emoji "🎲 ROLL" | YES | S | HudFight.vue (+ optional useFightSimulation.js DICE_ITEMS const mirror v1 cardFightState.js:20-27) | Asset paths already exist |
| **26** | Modifiers bar UI | v1: `CardFightView.vue:94-98` (.modifiers-bar with 3 badges: mod-double/shield/blind). v2 HudFight.vue:53-60 single `dice-active-pill` only | YES | M | HudFight.vue + useFightSimulation.js + fight-overlays.css | Couple с #25 (icons needed) |
| **27** | Dice cooldown countdown | v1: cardFightState `cooldownLeft: 3` field, but template doesn't explicitly render. v2 useFightSimulation.js:39 `diceReady: false` binary only | YES | XS-S | useFightSimulation.js + HudFight.vue | None |
| **28** | XP earned display | v1: `CardFightView.vue:187-190` (.xp-earned-block result overlay) + dispatches at lines 630/738/1118. v2 ResultOverlay.vue:1-29 absent | MAYBE | S | ResultOverlay.vue + useFightSimulation.js (or read backend) | UI scope decision; backend persists actual XP — local display = preview only |
| **32** | `.mm-main left:270px` filters-hidden gap | `src/styles/v24/matchmaking.css:154-164` (`left: 270px` reserves filter sidebar space); HudMatchmaking.vue:21 (`<div class="mm-filters" v-if="false">`) | YES | XS (1-line CSS + comment marker) | matchmaking.css | Preserve revival path (filter chips are carry-over #29 BE extension) |
| **34** | Coach pause read-only overlay (HudSpectate) | HudSpectate.vue absent (lines 54-80 fight log only); useSpectateState.js:138-148 `onSpectateCoachPause` appends generic log entry | YES | M | HudSpectate.vue + useSpectateState.js + fight-overlays.css (or scoped) | Read-only variant of CoachPause.vue (no click handlers) |
| **35** | activeEffects badges (HudSpectate) | useSpectateState.js:31-55 has player1Hp/player2Hp/fightLog but NO `activeEffects` field. HudSpectate.vue no badges template | YES | M | HudSpectate.vue + useSpectateState.js | Couple с #25 #26 (icons + bar pattern) |
| **36** | "joined late" visual indicator | useSpectateState.js:248-272 `onSpectateFightStateResume` appends roundResults to fightLog identical к live entries (no `replayed` flag); HudSpectate.vue:54-80 only `.sp-log-crit` conditional class | YES | XS | useSpectateState.js + HudSpectate.vue (or scoped CSS) | None |
| **37** | `.sp-result--draw` CSS class verification | HudSpectate.vue:116-122 computed returns `'sp-result--draw'` for draw winner. Lines 405-415 only define `.sp-result--win` and `.sp-result--loss` — `.sp-result--draw` MISSING | YES | XS (1 CSS rule) | HudSpectate.vue scoped style | None |

**14 active items** for Path γ batching (#21 confirmed out-of-scope; #29/#30/#33 confirmed out-of-scope per handoff §Q1.3).

### Q1.2 — Bundle proposals (Path γ chunks)

5 polish bundles + 3 Auth/Wallet clusters proposed. Sequence chosen for Path γ "alternating" pattern (polish → auth/wallet → polish → ...) per user-visibility incremental closure preference:

| Bundle | Items | Theme | Size estimate | Files | Commit count estimate |
|---|---|---|---|---|---|
| **B1 — Quick wins** | #11, #12, #13, #32, #36, #37 | Single-line/CSS/HTML batch fixes (no Vue logic changes) | XS-S | friendsState.js, ratings.css, HudRatings.vue, matchmaking.css, useSpectateState.js, HudSpectate.vue scoped | **2 commits** (B1a CSS-only: #12+#32+#37; B1b state/template: #11+#13+#36) |
| **B2 — HudFight visual polish core** | #18, #19, #24, #27 | Damage feedback (event titles, shake, per-type flash, cooldown) | M | HudFight.vue + useFightSimulation.js + useFlashHit.js + fight-overlays.css | **2-3 commits** (split if size grows) |
| **B3 — Dice icons + modifiers bar** | #25, #26 | Asset import + modifier badges (coupled — bar uses icons) | M | HudFight.vue + useFightSimulation.js + fight-overlays.css | **1-2 commits** |
| **B4 — Coach UX completion** | #22, #23 | Active boost bar + showWaiting state semantic | M | HudFight.vue + useFightSimulation.js + CoachPause.vue + fight-overlays.css | **1-2 commits** |
| **B5 — HudSpectate polish** | #34, #35 | Spectate UX gaps (coach overlay + active effects) | M | HudSpectate.vue + useSpectateState.js | **1-2 commits** |
| **B6 — Optional UI** | #20, #28 | Cumulative stats / XP earned display (MAYBE per handoff) | S-M | useFightSimulation.js + ResultOverlay.vue | **0-1 commits** (decide post-B2/B3) |

**Auth+Wallet clusters** (see Q2.4):
| Cluster | Theme | Commits estimate |
|---|---|---|
| **AW1** | Auth flow redesign (4 forms + RainView container audit) | 3-4 |
| **AW2** | Wallet redesign (ProfileWallet + GameBalanceCard + ConnectWallet refresh) | 2-3 |
| **AW3** | Account components Vuetify→v2 port (#14 + #15) | 2-3 |

**Total commit estimate (Path γ all bundles included):** ~14-19 commits. Within 12-18 ТЗ range, drift to 19 acceptable if MAYBE items B6 included. Risk-trim: defer B6 to Эпик 7+ if scope pressure surfaces.

**Recommended Path γ sequence (alternating pattern):**
1. B1a (CSS quick wins, builds confidence) → 2. B2 (HudFight core polish) → 3. **AW3 (Vuetify→v2 port — bridge к auth/wallet)** → 4. B3 (icons + modifiers) → 5. **AW2 (Wallet redesign)** → 6. B4 (coach completion) → 7. **AW1 (Auth redesign — biggest risk last)** → 8. B5 (Spectate polish) → 9. B1b (remaining quick wins) → 10. B6 (optional, if time).

### Q1.3 — Out-of-scope items verified

Per handoff §Q1.3 these 4 items ARE out-of-scope для Sub-epic 7:

| # | Item | Reason verified |
|---|---|---|
| **21** | Log actor colors hardcoded warden/predator | Position-based (`isLeft ? 'actor-warden' : 'actor-predator'` per useFightSimulation.js:111). v2-introduced prototype convention (CardFightView.vue grep returned 0 matches). Per handoff: existing constraint, fix would require log-entry color refactor orthogonal to polish. ✓ |
| **29** | Filter chips (Archetype/Belt) BE extension | Backend matchmaking.js currently only supports ELO-proximity FCFS queue. Adding archetype/belt/eloDelta queue params = sizeable BE feature. UI markup preserved hidden via `v-if="false"` (HudMatchmaking.vue:21). Defer к dedicated future BE feature sub-epic. ✓ |
| **30** | ELO duplication consolidation | `eloService.calculateElo` (asymmetric) used by agentFightService.js; inline `pvpCombatEngine.calculateElo` (symmetric) used for PvP fights. Math equivalent K=32. Refactor candidate, не sub-epic 7 polish. ✓ |
| **33** | Captain vs opponent payload field name asymmetry (`name`/`elo` vs `username`/`rating`) | FE-side normalization already implemented Sub-epic 5 C8 (HudMatchmaking VS display computed wrappers). BE-side consolidation = larger refactor surface. Polish/Эпик 7+ candidate. ✓ |

No findings during Phase 0 investigation suggest these should be reclassified into Sub-epic 7. Out-of-scope confirmed.

---

## Q2 — Auth+Wallet redesign scope

### Q2.1 — Component inventory

#### Auth flow files

| File path | Lines | State | v2 routing? |
|---|---|---|---|
| `src/views/RainView.vue` | 1212 | Mixed: scoped CSS + `--hex-*` tokens; Three.js + Kokomi + custom shaders 3D rain background; dynamically loads child auth form via `shallowRef` based on `route.path` | NO (v1 only — `/auth/*` routes still use RainView) |
| `src/components/fragments/auth/Login.vue` | 184 | Custom InputField + Vuetify `v-progress-circular` (line 50-54) + `VBtn` (line 57); state: login/password/loading/showPassword | NO (mounted в RainView) |
| `src/components/fragments/auth/Signup.vue` | 217 | 3× InputField + `v-progress-circular` (78-82) + `VBtn` (85); state: login/password/confirmPassword/errorMessage/showPassword/showConfirmPassword | NO |
| `src/components/fragments/auth/Reset.vue` | 119 | InputField + `v-progress-circular` (19-23) + `VBtn` (26); reads `master/getResetState` getter | NO |
| `src/components/fragments/auth/TelegramLogin.vue` | 135 | InputField (read-only chatId display) + `VBtn` retry; reads `window.Telegram.WebApp.initData` | NO |
| `src/core/models/internal/passwordResetStateModel.js` | (state model) | Vuex state model | — |

**Auth router state** (`src/router/index.js:9-14`): `/auth/login`/`/auth/signup`/`/auth/reset`/`/auth/telegram` ALL mount `RainView` (single component, dynamic child selection by path). Routes are NOT in `protectedRoutes` array — guest-only by design. Authenticated users redirected to `/v2` by guard at line 222-229.

**Total auth lines:** ~1,867 (1,212 RainView + 655 forms).

#### Wallet flow files

| File path | Lines | State | v2 wrapper |
|---|---|---|---|
| `src/components/fragments/profile/wallet/ConnectWallet.vue` | 372 (via agent A; 8855 bytes) | Custom Teleport-to-body modal; uses wagmi `useAccount`/`useConnect`/`useDisconnect`/`useConnectors`; **`defineExpose({ openModal })` line 177** ✓ | Mounted via lazy-load in HudProfile + HudProfileWallet (Sub-epic 5B + 5/6B-3a precedent) |
| `src/components/fragments/profile/wallet/ProfileWallet.vue` | 85 | v1 legacy container; mounts ConnectWallet + GameBalanceCard; watches wagmi `address` → dispatches `master/updateMaster` (lines 41-47) | Replaced by HudProfileWallet (Sub-epic 3) |
| `src/components/fragments/profile/wallet/GameBalanceCard.vue` | 57 | `<VCard>` wrapper (Vuetify); displays `master.getBalance()` formatted; `font-family: 'AnonymousBalance'` | Mounted in HudProfileWallet (Sub-epic 3) |
| `src/components/fragments/profile/wallet/BuyTokens.vue` | 337 | Token purchase flow (future); currently disabled per CLAUDE.md "BuyTokens removed from render" | Not mounted (legacy preserved) |
| `src/core/web3/wagmiConfig.js` | 20 | Wagmi config: chains [base], 3 connectors (injected/coinbaseWallet smartWalletOnly/walletConnect); `projectId` env var fallback `5591a1606e3dab80a0262f4f534f494d` | — |
| `src/components/hud/HudProfileWallet.vue` | 173 | v2 wrapper (Sub-epic 3); imports GameBalanceCard direct + lazy-loads ConnectWallet via `shallowRef`/`markRaw`/`nextTick × 2` pattern | This IS the v2 wrapper |

**Total wallet lines:** ~1,044.

#### Account components inventory

| File path | Lines | Vuetify primitives used |
|---|---|---|
| `src/components/fragments/profile/account/ConfirmEmail.vue` | 120 | InputField + `VBtnDark` |
| `src/components/fragments/profile/account/ChangeLogin.vue` | 200 | InputField + `VModal` (line 35, max-width=500) + `VCard` + `v-progress-circular` |
| `src/components/fragments/profile/account/ChangePassword.vue` | 161 | 3× InputField + `VBtnDark` (trigger+cancel) + `VModal` (line 13) + `VCard` + `v-progress-circular` + `VBtn` (confirm `.confirm-btn`) |
| `src/components/fragments/profile/account/DeleteAccount.vue` | 79 | `VBtnDark` (trigger) + `VModal` (line 12) + `VCard` + `VBtn` (`.confirm-delete-btn` `--hex-danger`) |
| `src/components/fragments/profile/account/Switcher3DPunch.vue` | 87 | `VBtnDark` + `v-switch` (Vuetify) |
| `src/components/fragments/profile/account/SoundToggle.vue` | 59 | (per agent A — secondary inventory) |
| `src/components/fragments/profile/account/ChangeLanguage.vue` | 85 | (per agent A) |
| `src/components/fragments/profile/account/ProfileAccount.vue` | 48 | v1 container |

**Account total:** ~839 lines across 8 components, 4 of which (ConfirmEmail/ChangeLogin/ChangePassword/DeleteAccount) currently mounted AS-IS in HudProfileAccount.vue (109 lines, Sub-epic 3).

### Q2.2 — Functional preservation list

The following functional flows must NOT regress during Auth+Wallet redesign:

**Auth:**
- Login flow (email/password) — `master/login` action dispatch, server JWT response, redirect to `/v2`
- Signup flow — client-side validation (8-char min, password confirm match) + `master/register` dispatch
- Password reset — `master/resetPassword` action; current backend returns 501 "not implemented" honestly (per CLAUDE.md security hardening)
- Telegram WebApp auth — `window.Telegram.WebApp.initData` parse + HMAC-SHA256 backend validation (5min replay window per CLAUDE.md)
- Guest-only guard — `/auth/*` routes redirect authenticated users to `/v2`

**Wallet:**
- Wagmi connector list (injected / coinbaseWallet smartWalletOnly / walletConnect)
- `useAccount` watch → `master/updateMaster { walletAddress }` dispatch (HudProfile.vue:284-385 + ProfileWallet.vue:41-47)
- ConnectWallet modal `openModal()` exposed method (line 177); lazy-mount pattern preserved
- Game balance display via `master.getBalance()` (formatted with DECIMALS)
- Withdraw click → `info.withdrawAfterListing` toast (per Sub-epic 3)

**Account:**
- `master/sendCheckLoginAvailable` debounce check (ChangeLogin)
- `master/updateMaster` for email/login/password edits
- `master/deleteAccount` → internal cleanup → `router.push('/')` cascade through guard к `/auth/login`
- `master/setInfoMessage` + `InfoMessageModel.withTimeout` toast pattern

### Q2.3 — Scope sizing

**Total Auth+Wallet redesign size: M-L** (in line with handoff estimate).

**Per-cluster breakdown:**

| Cluster | Files | Lines impacted | Commits estimate | Risks |
|---|---|---|---|---|
| **AW1 — Auth redesign** | RainView (1212) + Login (184) + Signup (217) + Reset (119) + TelegramLogin (135) | ~1,867 (visual restyle, not full rewrite) | **3-4** | RainView 3D rain background (1212 lines, Three.js+Kokomi) — keep/scrap critical decision; preserving 3D layer = restyle forms only (1-2 commits); scrapping 3D = full new view (4-5 commits) |
| **AW2 — Wallet redesign** | HudProfileWallet (173) + GameBalanceCard (57) + ConnectWallet (372) + ProfileWallet (85, may delete) | ~687 | **2-3** | Wagmi composables coupling (must preserve `useAccount` watch + dispatch pattern); ConnectWallet modal = already custom Teleport (no Vuetify dep) — mostly visual restyle |
| **AW3 — Account Vuetify→v2 port** | 4 components: ConfirmEmail (120) + ChangeLogin (200) + ChangePassword (161) + DeleteAccount (79); decide on Switcher3DPunch (#14) | ~647 | **2-3** | VModal × 3 + VCard × 3 + VBtnDark + v-progress-circular × 2 — needs v2 modal primitive (see Q5) |

**Total Auth+Wallet:** **7-10 commits**, ~3,200 lines visual surface.

**Major risks:**
1. **RainView 3D rain — keep/scrap decision** ← **CRITICAL USER DECISION FOR PHASE 1**. Lines 462-661 are custom Three.js classes (RainFloor with bicubic shaders + Rain instanced billboard particles). Scrapping = lose visual identity but reduce maintenance + bundle. Preserving = restyle child forms only. **Recommendation: preserve 3D rain** (visual identity asset, working stable, bundle cost already paid; restyle scope = 4 forms only).
2. **Wagmi integration coupling** — DO NOT change `useAccount`/`useConnect`/`useDisconnect`/`useConnectors` API surface. Restyle visual layer only. ConnectWallet.vue lines 27-79 (Teleport modal) already v2-style, may need minimal token alignment.
3. **Vuetify modal removal** — VModal × 3 in account components requires v2 modal pattern. Two options:
   - **Option a:** Use existing `.hex-modal-overlay` + `.hex-modal` CSS classes (defined in `hexlash-ui.css:440-478`) inline + manual Teleport — но требует SFC scaffolding в каждом file
   - **Option b:** Create dedicated `Modal.vue` primitive в `src/components/ui/` exposing `openModal()` API (mirror PhModal precedent) — bundle decision Sub-epic 7 OR defer Эпик 7+
4. **Account component AS-IS preservation** — Sub-epic 3 ported these AS-IS (carry-over #15). Path для AW3 = full Vuetify→v2 swap, NOT preserve. Will visibly change account UI.
5. **Bundle expansion** — RainView is 1212 lines, easy to scope-creep. Strict Path γ "alternating" sequence guards against pulling AW1 forward; complete polish bundles first.

### Q2.4 — Path γ cluster proposal для Auth+Wallet

3 clusters, sequenced per Q1.2 alternating pattern (AW3 → AW2 → AW1, smallest-to-largest risk progression):

**Cluster AW3 — Account Vuetify→v2 port (3 commits):**
1. Decide modal strategy (a vs b) — if (b), create `Modal.vue` primitive first (carry-over surfaces #14 Switcher3DPunch decision: drop OR port — recommend drop per Sub-epic 3 Q-tactical-1 decision)
2. Port ChangeLogin + ConfirmEmail (smaller surface, no destructive actions) to v2 tokens
3. Port ChangePassword + DeleteAccount (modal-heavy, destructive) to v2 tokens

**Cluster AW2 — Wallet redesign (2-3 commits):**
1. GameBalanceCard restyle — replace `<VCard>` wrapper with v2-token-styled custom div (or HexCard from `src/components/ui/`)
2. HudProfileWallet visual refresh — adjust title/back-btn styling, ensure overall v2 aesthetic (Wallet view background, layout polish)
3. ConnectWallet modal restyle (optional — already custom Teleport, may only need token alignment)

**Cluster AW1 — Auth redesign (3-4 commits):**
1. RainView container audit + decide 3D rain layer (per Q2.3 risk #1) — write decision in commit comment
2. Login + Signup restyle — replace v-progress-circular + VBtn with v2 equivalents
3. Reset + TelegramLogin restyle — same pattern
4. RainView 3D rain final touch (если scope позволяет — light/glow tweaks к v2 palette)

**Total AW: 8-10 commits.** Combined with polish bundles 6-9 commits → **Sub-epic 7 total: 14-19 commits.**

---

## Q3 — Polish bundle concrete grouping

For each bundle from Q1.2: file diff outline (no code edits — only changes described).

### B1a — CSS-only quick wins (#12 + #32 + #37)

**Commit:** `feat(polish): close 3 visual carry-overs (HudRatings grid + matchmaking sidebar gap + draw class)` OR similar.

**Files modified (3):**

1. `src/styles/v24/ratings.css` (lines 134-144 + 166-168) — extract per-tab grid templates:
   - Add `.ratings-thead--clans, .rt-row--clans { grid-template-columns: 50px 2fr 90px 80px 70px 70px; }` (6 cols)
   - Add `.ratings-thead--agents, .rt-row--agents { grid-template-columns: 50px 1.5fr 1fr 90px 80px 70px; }` (6 cols, agent-specific weights)
   - Add `.ratings-thead--fighters, .rt-row--fighters { grid-template-columns: 50px 2fr 80px 80px 70px 70px 70px; }` (7 cols)
   - Keep existing 8-col rule as fallback OR remove (decide based on whether other consumers exist — verify via grep before edit)

2. `src/components/hud/HudRatings.vue` (lines 372-379 + 405-412 + 449-457) — add modifier classes:
   - CLANS thead/tbody add class `ratings-thead--clans`/`rt-row--clans`
   - AGENTS thead/tbody add class `ratings-thead--agents`/`rt-row--agents`
   - FIGHTERS thead/tbody add class `ratings-thead--fighters`/`rt-row--fighters`

3. `src/styles/v24/matchmaking.css` (line 156, `.mm-main` rule) — change `left: 270px` → `left: 14px`. Add comment marker:
   ```css
   /* B1a: Sub-epic 5 C3 hid filter sidebar via v-if=false. Restoring left:14px until carry-over #29 BE
      filter chips supported. Revert to left:270px when filters revived. */
   ```

4. `src/components/hud/HudSpectate.vue` scoped style block (after line 415) — add:
   ```css
   .sp-result--draw .sp-result-text {
     /* mirror .sp-result--win/--loss but with --hex-warning palette */
     background: rgba(212, 168, 67, 0.15);
     border: 2px solid var(--hex-warning);
     color: var(--hex-warning);
   }
   ```

**Lines touched (approx):** ratings.css +30/-5, HudRatings.vue +6 (class additions only), matchmaking.css +1 line edit + 3 lines comment, HudSpectate.vue +6.

**No-go warnings:**
- Don't refactor entire ratings.css grid system — minimum-touch only
- Don't add `display: contents` or other non-standard tricks; modifier classes only
- Don't touch HudRatings.vue script logic (state/methods); HTML attributes only

### B1b — State/template quick wins (#11 + #13 + #36)

**Commit:** `feat(polish): close FE-only quick wins (captain field + a11y + replay marker)` OR split into 3 atomic commits per Mode A.

**Files modified (3):**

1. `src/core/state/modules/friendsState.js` (lines 133-141) — add `captain: u.captain || null` to mapped object. 1 line.

2. `src/components/hud/HudRatings.vue` (lines 299-318 tab `<button>` + 388-391 row `<div>`):
   - Tab buttons: add `role="tab"` + `:aria-selected="activeTab === 'myclan'"` + `aria-controls="ratings-panel"` (+ matching `id="ratings-panel"` on tbody container)
   - Row divs: add `tabindex="0"` + `role="button"` + `@keydown.enter="$router.push(...)"` + `@keydown.space.prevent="$router.push(...)"`
   - Wrapper: add `role="tablist"` to tab container

3. `src/scene/interaction/useSpectateState.js` (line 248-272 `onSpectateFightStateResume`) — add `replayed: true` to log entries appended in replay branch.
   `src/components/hud/HudSpectate.vue` (lines 54-80 fight log) — add `:class="{ 'sp-log-replayed': entry.replayed }"` binding + scoped CSS rule:
   ```css
   .sp-log-replayed { opacity: 0.6; border-left: 2px solid var(--text-dim); padding-left: 8px; }
   ```

**Lines touched:** friendsState.js +1, HudRatings.vue +12 (3 attributes × 4 callsites), useSpectateState.js +3, HudSpectate.vue +5.

**No-go warnings:**
- Don't add Vuex captain action — friendsState already loads captain via captainMap (per backend friends.js line 237)
- Don't refactor tab semantic structure — minimum-touch a11y additions only
- Don't add new keyboard shortcuts beyond Enter/Space (out of scope — would be different a11y carry-over)

### B2 — HudFight visual polish core (#18 + #19 + #24 + #27)

**Files modified (4):**

1. `src/scene/interaction/useFightSimulation.js` (state extension + doExchange logic):
   - Add to fightState reactive object (lines 20-41): `eventTitle: null`, `eventTitleClass: ''`, `shakeLeftActive: false`, `shakeRightActive: false`, `diceCooldownLeft: 0`
   - In doExchange (lines 105-152) after hit/miss detection: commit `eventTitle` + `eventTitleClass` (`event-dodge`/`event-crit`/`event-damage`); 1200ms setTimeout to clear
   - In doExchange after HP mutation (lines 139-150): set `shakeLeftActive` or `shakeRightActive` based on victim side; 400ms setTimeout to clear
   - In nextExchange/round logic: decrement `diceCooldownLeft` if > 0

2. `src/scene/interaction/useFlashHit.js` (lines 19-34 `triggerFlash`):
   - Change signature: `export function triggerFlash(type = 'damage')`
   - Add color map (mirror v1 CardFightView.vue:474-488 8-color)
   - Add `flashColor` reactive ref alongside `flashing`
   - Update HudFight.vue line 74 binding: add `:style="{ backgroundColor: flashColor }"`

3. `src/components/hud/HudFight.vue`:
   - Template: add `.event-title` overlay (after fighter cards, position: fixed top-center): `<div v-if="fightState.eventTitle" :class="['event-title', fightState.eventTitleClass]">{{ fightState.eventTitle }}</div>`
   - Template: add `:class="{ shake: fightState.shakeLeftActive }"` to left fighter (line 17), same for right (line 33)
   - Template: add cooldown indicator near dice button: `<div v-if="fightState.diceCooldownLeft > 0" class="dice-cooldown">{{ fightState.diceCooldownLeft }}R</div>`
   - Template: update `.hit-flash` div line 74 with `:style` binding from `flashColor`

4. `src/styles/v24/fight-overlays.css`:
   - Add `.event-title` base + variants (`.event-dodge` cyan, `.event-crit` red, `.event-damage` orange) — port styling from CardFightView.vue lines 1411-1434
   - Add `@keyframes shake` (port from CardFightView.vue 1320-1327) + `.fight-fighter.shake { animation: shake 0.35s ease; }`
   - Add `.dice-cooldown` rule (small badge, positioned next to dice button)

**Lines touched:** useFightSimulation.js +25, useFlashHit.js +18, HudFight.vue +12 (template) + 0 (style — global), fight-overlays.css +50.

**No-go warnings:**
- Don't change HP mutation logic (existing damage/dodge/crit derivation must remain Vuex-truth-based)
- Don't add new fightState fields beyond enumerated 5 above
- Don't extract `triggerFlash` callers en-masse — Sub-epic 4a established `triggerFlash()` bare calls; polish = adding type param progressively, not refactor

### B3 — Dice icons + modifiers bar (#25 + #26)

**Files modified (3):**

1. `src/components/hud/HudFight.vue`:
   - Imports section: add 5 icon imports from `@/assets/images/icons/` (dice + adrenaline + shield + blind + heal)
   - Template line 56 (dice button): replace `🎲 ROLL` text with `<img :src="iconDice" class="dice-icon-asset" alt=""/> <span>ROLL</span>`
   - Template (after dice-area, lines ~60+): add `.modifiers-bar` block — v-if `anyActiveEffect` computed; render badges per active effect via v-for or explicit conditionals

2. `src/scene/interaction/useFightSimulation.js`:
   - Add `activeEffects: { adrenaline: false, shield: false, blind: false, overdrive: false }` to fightState
   - Add `DICE_ITEMS` const mirror v1 cardFightState.js:20-27 (`{ id, image, color, statusLabel }` per effect)
   - Add `anyActiveEffect` computed: `Object.values(fightState.activeEffects).some(v => v)`
   - In dice roll handler / coach boost logic: set `activeEffects[type] = true`; clear after 1 round (or per effect duration spec)

3. `src/styles/v24/fight-overlays.css`:
   - Add `.modifiers-bar` (flexbox row, gap: var(--hex-spacing-sm), positioned below dice-area)
   - Add `.mod-badge` base + per-type variants (`.mod-adrenaline` --hex-dice-adrenaline color, `.mod-shield` --hex-dice-shield, `.mod-blind` --hex-dice-blind)
   - Add `.dice-icon-asset { width: 18px; height: 18px; }` for inline icon в dice button

**Lines touched:** HudFight.vue +20 (template) + 5 imports, useFightSimulation.js +25 (DICE_ITEMS const + activeEffects field + computed), fight-overlays.css +60.

**No-go warnings:**
- Don't change asset paths from `@/assets/images/icons/` — already verified to exist
- Don't add multi-stack effect counters (e.g., "adrenaline ×2") — booleans only, matches v2 simplification
- Don't change dice button click handler logic (`onDiceClick`) — only template asset

### B4 — Coach UX completion (#22 + #23)

**Files modified (3):**

1. `src/scene/interaction/useFightSimulation.js`:
   - Add to fightState: `coachActive: false`, `coachAction: null`, `coachRoundsLeft: 0`, `coachPauseState: null` (enum: 'choosing' | 'waiting' | null replaces existing `coachPauseOpen` boolean)
   - In `setCoachStrategy` (line 167-173): set `coachActive=true`, `coachAction=strat`, `coachRoundsLeft=4`, `coachPauseState='waiting'`
   - In nextExchange round increment: decrement `coachRoundsLeft`; clear `coachActive` when reaches 0
   - In `showCoachPause` (line 155-165): set `coachPauseState='choosing'` (player picks); on coach choice → 'waiting'; on coach_result → null

2. `src/components/hud/HudFight.vue`:
   - Template: add `.coach-active-bar` (v-if `fightState.coachActive`, position: fixed top-center or side panel) — port from CardFightView.vue:101-105 with `iconTrainer` import + label + `{{ fightState.coachRoundsLeft }}R`
   - CoachPause mount: pass `:state="fightState.coachPauseState"` prop instead of `coachPauseText`

3. `src/components/hud/common/CoachPause.vue`:
   - Add `state` prop (`'choosing' | 'waiting' | null`)
   - Conditional rendering: `state === 'choosing'` → render 3 strategy buttons; `state === 'waiting'` → render spinner + "Waiting for opponent..." text; `state === null` → component hidden
   - Remove existing `coachPauseText` prop (or keep optional for backward compat one commit — verify callsites first)

**Lines touched:** useFightSimulation.js +15 (state + state machine logic), HudFight.vue +6 (coach-active-bar), CoachPause.vue +20 (state prop + conditional template).

**No-go warnings:**
- Don't introduce dual-overlay (separate showWaiting overlay) — handoff requested semantic clarity via single component with state prop, not duplicate components
- Don't change WS event handlers (coach_choice / coach_result emit logic) — only state derivation and rendering
- Don't extend coach boost effects beyond +25% damage/-30% incoming/etc per existing engine — UI only

### B5 — HudSpectate polish (#34 + #35)

**Files modified (2):**

1. `src/scene/interaction/useSpectateState.js`:
   - Add to spectateState: `coachPauseActive: false`, `coachPauseRound: 0`, `player1ActiveEffects: []`, `player2ActiveEffects: []`
   - In `onSpectateCoachPause` (lines 138-148): set `coachPauseActive=true`, store `coachPauseRound=detail.round`; on coach_result event clear `coachPauseActive=false`
   - In `onSpectateRoundResult` (lines 77-104): if `detail.player1?.activeEffects` populate `player1ActiveEffects = detail.player1.activeEffects`; same for player2

2. `src/components/hud/HudSpectate.vue`:
   - Template: add `.spectate-coach-pause` overlay (v-if `spectateState.coachPauseActive`) — read-only variant of CoachPause: kicker "COACH PAUSE" + round badge + 3 disabled-look buttons (no click handlers, opacity 0.6)
   - Template: add active effects badges in fighter cards header (above HP bar) — v-for over `player1ActiveEffects` / `player2ActiveEffects` arrays with icon + label per effect (couples с #25 icon imports)
   - Scoped style: `.spectate-coach-pause` mirroring CoachPause.vue but read-only state; `.sp-effect-badge` per-type variants

**Lines touched:** useSpectateState.js +15, HudSpectate.vue +35 (template + scoped CSS).

**No-go warnings:**
- Don't add coach choice handlers (read-only; spectator cannot interact)
- Don't change WS event subscription (existing `coach_pause` listener already wired Sub-epic 6)
- Don't make active effects clickable (display only)
- Lesson #34 HUD overlay: scoped style block — `.spectate-coach-pause` `position: fixed; pointer-events: none` (read-only, no interaction)

### B6 — Optional UI (#20 + #28) — DECIDE post-B2/B3

**Recommendation:** Defer to Эпик 7+ unless time surplus. Both items are display-only enhancements; functional gameplay unaffected. If included:

1. **#20 cumulative damage stats:** Add `fightStats: { totalDamageDealt: 0, totalDamageTaken: 0, criticalHits: 0 }` to fightState; accumulate in doExchange; display in ResultOverlay summary text
2. **#28 XP earned display:** Add `xpEarned` to fightState; calculate or read from BE in endFight; render `<div class="xp-earned-block">+{{ xpEarned }} XP</div>` in ResultOverlay.vue (port CSS from CardFightView.vue:1894-1918)

Decision factor: backend persists actual XP per CLAUDE.md Captain Agent flow — local display is preview convenience only. Skip unless user explicitly requests.

---

**END OF PART 1.**

Continued in PART 2 — Q4 ErrorMsg / Q5 Vuetify→v2 / Q6 Friends / Q7 NoConnection.
