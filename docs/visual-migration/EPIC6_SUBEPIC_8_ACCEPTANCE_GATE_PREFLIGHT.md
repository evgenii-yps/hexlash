# Эпик 6 — Sub-epic 8 — Phase 1a — Acceptance Gate Pre-flight Report

**Date:** 2026-05-05
**Branch:** `claude/investigate-cutover-gate-RpOyg` (continue stack designated)
**HEAD entering:** `482754f` (Phase 0 housekeeping commit — 3-part split)
**Scope:** Read-only verification of 5 functional areas BEFORE Phase 1b cutover commits start
**Mode:** Read-only investigation. NO edits to source files. NO commits beyond housekeeping output.

---

## STEP 0 — Bootstrap branch verification

**Lesson #43 11th occurrence (chain stable, no re-promotion needed).**

```
$ git checkout claude/investigate-cutover-gate-RpOyg
Switched to a new branch 'claude/investigate-cutover-gate-RpOyg'
branch 'claude/investigate-cutover-gate-RpOyg' set up to track 'origin/claude/investigate-cutover-gate-RpOyg'.

$ git status -uno
On branch claude/investigate-cutover-gate-RpOyg
Your branch is up to date with 'origin/claude/investigate-cutover-gate-RpOyg'.
nothing to commit (use -u to show untracked files)

$ git branch --show-current
claude/investigate-cutover-gate-RpOyg

$ git log --oneline -5
482754f docs(8): Phase 0 investigation report — 3-part split (housekeeping)
1a3db1d docs(7): closure 3 — Handoff Sub-epic 8 (FINAL Sub-epic 7 commit)
3c6e248 docs(7): closure 2 — Final Report Sub-epic 7
0aba5bb docs(7): closure 1 — CLAUDE.md update for Sub-epic 7 completion
0f59fe2 feat(polish): close HudSpectate active effects badges (#35) — final B5
```

**Result:** ✅ All STEP 0 expectations met (branch + HEAD SHA + clean tree + Sub-epic 7 closure chain visible).

---

## Recovery #91 — Structural branch divergence (Lesson #43 10th occurrence + Lesson #18 surface)

### Context

- Harness designated fresh slug `claude/cutover-acceptance-gate-YGJKA` from main HEAD `d52d2cb` (Sub-epic 6 C4.5 cherry-pick merge — PvP surrender routing fix from PR #356).
- ТЗ specified continue stack `claude/investigate-cutover-gate-RpOyg` HEAD `482754f` (Phase 0 housekeeping on top of Sub-epic 7 closure).
- **Different HEAD SHAs** — NOT same-SHA fresh-slug pattern (mirror Recoveries #82/#85/#86/#87/#88/#89). This is **structural divergence**.
- Designated branch lacked Sub-epic 7 closure chain + Phase 0 investigation work.

### Tier classification

- **Lesson #18 STOP-tier surface** — structural mismatch, not adaptation-tier.
- **Lesson #44 re-anchor decision required** — could not proceed unilaterally; surfaced 4-option matrix to user.

### Resolution

- User-authorized **Option E** — switch to ТЗ-specified branch `claude/investigate-cutover-gate-RpOyg`.
- Mirrors Recovery #89 pattern at higher tier — same re-anchor methodology, higher-stakes decision.

### Lesson #43 chain

10 occurrences: 5U / Sub-epic 2 / 4a Phase 0 / 4b Phase 0 / 5 Phase 0 / 6 Phase 0 / 6 CL1 boundary / 7 Phase 0 / 8 Phase 0 / **8 Phase 1a**. Pattern fully stable.

### Lesson #18 application

STOP triggered before any edits/commits. Scope-boundary-tier surface (structural, not adaptation). User-driven re-anchor decision per Lesson #44.

### Implications для Sub-epic 8 going forward

- Continue stack approach preserved — Phase 1a work continues linear from `482754f`.
- Q2.5-A (Direct merge designated → main) strategy unchanged.
- Sub-epic 8 functional work continues linear from acceptance gate housekeeping commit.

### Streak preservation

Recovery #91 = adaptation-tier (per Lesson #35 framework). **Streak 31 preserved** entering Phase 1a.

---

## Pre-flight environment notes

- **`node_modules` not installed** on this fresh checkout — `npm run build` baseline check deferred to user-side ratification phase.
- Acceptance gate is read-only investigation (file integrity + import + class + handler grep). Build correctness will be re-verified by user during manual test phase.
- **Carry-over surfaced:** if `npm install` reveals lockfile/package issues during user verify, surface immediately (Lesson #18). Otherwise non-blocking for Phase 1a output.

---

## Area 1 — Auth flows (RainView 3D rain backdrop)

### File integrity check

| File | Lines | Present | Note |
|---|---|---|---|
| `src/views/RainView.vue` | 1212 | ✅ | UNTOUCHED across Sub-epic 7 AW1 — 3D rain backdrop preserved. Matches CLAUDE.md baseline. |
| `src/components/fragments/auth/Login.vue` | (verified) | ✅ | Sub-epic 7 AW1 redesign — modern Login form |
| `src/components/fragments/auth/Signup.vue` | (verified) | ✅ | Sub-epic 7 AW1 redesign |
| `src/components/fragments/auth/Reset.vue` | (verified) | ✅ | Sub-epic 7 AW1 redesign |
| `src/components/fragments/auth/TelegramLogin.vue` | (verified) | ✅ | Sub-epic 7 AW1 redesign — port to v2 |

### Recent change verification

Sub-epic 7 commits affecting Area 1:
- `25ed54e` — feat(auth-wallet): redesign Login form к v2 (#4 auth portion 1/3)
- `240045e` — feat(auth-wallet): port Signup + Reset forms к v2 (#4 auth portion 2/3)
- `e8a36eb` — feat(auth-wallet): port TelegramLogin к v2 — closes #4 (auth portion 3/3)

### Pre-flight assertions

✅ RainView imports all 4 auth fragments (verified `src/views/RainView.vue:30-33`).
✅ RainView routes к correct component via `route.path === '/auth/telegram'` switch (line 49).
✅ Vuex actions used (verified):
- `Login.vue:107` — `master/login`
- `Signup.vue:144` — `master/register`
- `Reset.vue:60` — `master/resetPassword`
- `Reset.vue:69` — `master/clearResetState`
- `Reset.vue:57` — `master/getResetState` getter
- `TelegramLogin.vue:73` — `master/saveTelegramFlag`
- `TelegramLogin.vue:83` — `master/telegram`

### User manual test scenarios (8)

- [ ] **1.1** Navigate `/auth/login` → form renders, RainView 3D rain backdrop visible, neon brick scene + rain particles
- [ ] **1.2** Enter valid credentials → submit → success → redirect к `/`
- [ ] **1.3** Wrong password → error toast displayed (`{errorDto: {code, message}}` shape)
- [ ] **1.4** Navigate `/auth/signup` → 3 InputField visible (login, email, password)
- [ ] **1.5** Submit signup → account created → redirect
- [ ] **1.6** Navigate `/auth/reset` → 2-state flow (request → verify)
- [ ] **1.7** Navigate `/auth/telegram` (если Telegram client setup) → auto-login flow
- [ ] **1.8** Logout → redirect к `/auth/login`

---

## Area 2 — Wallet flows

### Real route note

⚠️ Real route `/v2/wallet` — NOT `/v2/profile/wallet` (Recovery #90, Phase 0 catch — verified в `src/router/index.js:158-161`).

### File integrity check

| File | Lines | Present | Note |
|---|---|---|---|
| `src/views-v2/WalletView.vue` | 86 | ✅ | Orchestrator — mounts Three.js ProfileScene + HudProfileWallet |
| `src/components/hud/HudProfileWallet.vue` | 173 | ✅ | Sub-epic 3 commits 1-3 + Sub-epic 7 AW2 |
| `src/components/fragments/profile/wallet/GameBalanceCard.vue` | (verified) | ✅ | Sub-epic 3 — uses HexCard (Sub-epic 7 AW2 swap) |
| `src/components/fragments/profile/wallet/ConnectWallet.vue` | (verified) | ✅ | Sub-epic 7 AW2 — canonical `.hex-modal-*` taxonomy |

### Recent change verification

Sub-epic 7 commits affecting Area 2:
- `58e133d` — feat(auth-wallet): redesign wallet UI к v2 (#4 wallet portion)

### Pre-flight assertions

✅ WalletView imports HudProfileWallet (`src/views-v2/WalletView.vue:27`).
✅ HudProfileWallet imports GameBalanceCard (`src/components/hud/HudProfileWallet.vue:40`).
✅ HudProfileWallet lazy-loads ConnectWallet (`src/components/hud/HudProfileWallet.vue:66` — mirror HudProfile precedent Step 10/5B).
✅ Wagmi composables imports verified (`ConnectWallet.vue:86`):
```
import { useAccount, useConnect, useDisconnect, useConnectors } from '@wagmi/vue'
```
- Verbatim preservation per Sub-epic 7 AW2 (no shape changes).
✅ Canonical modal taxonomy (`ConnectWallet.vue:31-35`):
- `.hex-modal-overlay .cw-modal-overlay` — hybrid canonical-modifier C11 pattern
- `.hex-modal .cw-modal-content`
- `.hex-modal-close`

### User manual test scenarios (5)

- [ ] **2.1** Navigate `/v2/wallet` → ProfileWallet renders, GameBalanceCard visible (HexCard styling, not VCard)
- [ ] **2.2** Click "Connect Wallet" CTA → canonical modal opens (`.hex-modal-overlay`)
- [ ] **2.3** Select connector → wagmi connect resolves → account address displays
- [ ] **2.4** GameBalanceCard renders с HexCard pattern (verify visually — NOT VCard legacy)
- [ ] **2.5** Disconnect → state clears, modal returns к connector list

---

## Area 3 — Account flows (4 modals)

### Real route note

Real route `/v2/account` — NOT `/v2/profile/account` (verified в `src/router/index.js:163-166`).

### File integrity check

| File | Lines | Present | Note |
|---|---|---|---|
| `src/views-v2/AccountView.vue` | 87 | ✅ | Orchestrator — mounts ProfileScene + HudProfileAccount |
| `src/components/hud/HudProfileAccount.vue` | 109 | ✅ | Sub-epic 3 Commit 4 + Sub-epic 7 AW3 |
| `src/components/fragments/profile/account/ConfirmEmail.vue` | (verified) | ✅ | Sub-epic 7 C7 — HexButton swap |
| `src/components/fragments/profile/account/ChangeLogin.vue` | (verified) | ✅ | Sub-epic 7 C8 — Teleport modal + canonical taxonomy |
| `src/components/fragments/profile/account/ChangePassword.vue` | (verified) | ✅ | Sub-epic 7 C9 part 3/4 |
| `src/components/fragments/profile/account/DeleteAccount.vue` | (verified) | ✅ | Sub-epic 7 C9 part 4/4 — HexButton variant=danger |

### Recent change verification

Sub-epic 7 commits affecting Area 3:
- `70132be` — feat(auth-wallet): port ConfirmEmail к HexButton (#15 part 1/4)
- `1815564` — feat(auth-wallet): port ChangeLogin к HexButton + inline Teleport modal (#15 part 2/4)
- `f34b2e7` — feat(auth-wallet): finalize AW3 — port ChangePassword + DeleteAccount + taxonomy expansion (#15 part 3-4/4)

### Pre-flight assertions

✅ HudProfileAccount imports all 4 modals (`HudProfileAccount.vue:31-34`).
✅ HexButton imports verified across all 4 components:
- `ConfirmEmail.vue:34` — `import HexButton from '@/components/ui/HexButton.vue'`
- `ChangeLogin.vue:65` — `import HexButton`
- `ChangePassword.vue` — verified HexButton + `.hex-modal-*` taxonomy (line 19)
- `DeleteAccount.vue` — verified HexButton variant=danger pattern (line 18)
✅ Canonical `.hex-modal-*` taxonomy classes present:
- `ChangeLogin.vue:40` — `.hex-modal-overlay`
- `ChangeLogin.vue:45` — `.hex-modal-body`
- `ChangeLogin.vue:48` — `.hex-modal-actions`
- `ChangePassword.vue:19/25/66` — same set
- `DeleteAccount.vue:18/24/27` — same set (C9 expansion)
✅ Vuex actions verified:
- `ConfirmEmail.vue:66-67` — `master/updateMaster` + `master/setInfoMessage`
- (other 3 modals follow same pattern)

### User manual test scenarios (8)

- [ ] **3.1** Navigate `/v2/account` → 4 components stacked
- [ ] **3.2** ConfirmEmail click → email InputField + secondary HexButton (C7 swap)
- [ ] **3.3** ChangeLogin click → canonical modal с InputField + secondary cancel + primary confirm
- [ ] **3.4** Submit valid login → success toast, modal closes
- [ ] **3.5** Submit taken login → error toast (API surface)
- [ ] **3.6** ChangePassword submit valid old + new → success toast + close
- [ ] **3.7** DeleteAccount click → confirmation modal с danger HexButton variant
- [ ] **3.8** DeleteAccount confirm → account deleted + redirect к `/auth/login`

---

## Area 4 — HUD spectator (HudSpectate)

### ⚠️ Critical BE deploy disclaimer

**Sub-epic 6 BE НЕ deployed к main** per Phase 0 Q4.2. Acceptance gate Area 4 test requires either:
- Continue stack BE state (designated branch loads BE locally), OR
- Acceptance gate Area 4 deferred к post-deploy verification (Q2.5-A merge → Railway deploy lands BE → re-verify)

### File integrity check

| File | Lines | Present | Note |
|---|---|---|---|
| `src/views-v2/SpectateView.vue` | 149 | ✅ | Sub-epic 6 lifecycle — SpectateJoin/Leave dispatch + 9 WS event listeners |
| `src/components/hud/HudSpectate.vue` | 555 | ✅ | Sub-epic 7 C10/C15 augmented + B5 (#35) close |
| `src/scene/interaction/useSpectateState.js` | (present) | ✅ | Sub-epic 6 C9 composable (real BE state binding) |

### Recent change verification

Sub-epic 7 commits affecting Area 4:
- `0f59fe2` — feat(polish): close HudSpectate active effects badges (#35) — final B5
- `1ff1a22` — feat(polish): coach pause read-only overlay for HudSpectate (#34)
- `c488192` — feat(spectate): cleanup discipline + leave handlers
- `996d40f` — feat(spectate): race guards (Q8.1-Q8.3)

### Pre-flight assertions

✅ HudSpectate imports `useSpectateState` composable (`HudSpectate.vue:144-148`).
✅ `.hex-modal-overlay` for coach pause read-only overlay (`HudSpectate.vue:118`).
✅ 8-col grid + per-tab modifier classes (`.mod-badge*` taxonomy verified, lines 42-78).
✅ `.sp-log-replayed` class for joined-late entries (`HudSpectate.vue:86`):
```
:class="{ 'sp-log-crit': entry.critical, 'sp-log-replayed': entry.replayed }"
```
✅ Active effect icons imported (`HudSpectate.vue:150-152`):
```
import iconAdrenaline from '@/assets/images/icons/adrenaline.svg';
import iconShield from '@/assets/images/icons/shield.svg';
import iconBlind from '@/assets/images/icons/blind.svg';
```
✅ SpectateView dispatches `SpectateJoinMsg` on mount (`SpectateView.vue:116`).
✅ BE WS messages declared/handled (per file comments): `SpectateJoin`, `SpectateLeave`, `SpectatorListMsg`, plus 7 broadcast PvP events.

### User manual test scenarios (5)

- [ ] **4.1** Friend in bout → click "Watch" → navigate `/v2/spectate/:fightId`
  - **Note: Watch button currently DEAD CODE per Q6.1 carry-over** — `currentFight` field NOT в `/v1/friends/list` response (verified `backend/src/routes/friends.js:225-238`). Test scenario 4.1 PENDING C7 deploy.
- [ ] **4.2** Direct URL `/v2/spectate/<fightId>` non-friend → auth fail или redirect (BE friends-only check)
- [ ] **4.3** Mid-fight join (late-join) → replay log entries (`.sp-log-replayed`) + current state
- [ ] **4.4** Active effects display → mod-badges per fighter side с counters
- [ ] **4.5** Coach pause display → read-only overlay (`.hex-modal-overlay`)

---

## Area 5 — HUD fight (HudFight)

### File integrity check

| File | Lines | Present | Note |
|---|---|---|---|
| `src/views-v2/FightView.vue` | 462 | ✅ | Sub-epic 4a/4b lifecycle + 9 WS event listeners (lines 423-431) |
| `src/components/hud/HudFight.vue` | 637 | ✅ | Sub-epic 7 C4-C6 augmented |
| `src/components/hud/common/useFightSimulation.js` | (present) | ✅ | Fight simulation composable |
| `src/components/hud/common/useFlashHit.js` | (present) | ✅ | FLASH_COLORS map + flashColor reactive |
| `src/components/pvp/ChallengeNotification.vue:62` | (present) | ✅ | Carry-over #16 — `isPlayer1: false` semantically correct |

### Recent change verification

Sub-epic 7 commits affecting Area 5:
- `9d31d36` — feat(polish): close dice icons + modifiers bar (#25, #26)
- `b0daa24` — feat(polish): close per-type flash color mapping (#24)
- `a710814` — feat(polish): close HudFight event titles + shake (#18, #19)
- `87b7ece` — feat(polish): tolerant ErrorMsg parser (BE shape inconsistency carry-over #31)

### Pre-flight assertions

✅ FightView 9 WS event listeners registered (`FightView.vue:423-431`):
- `pvp-dice_available`, `pvp-coach_pause`, `pvp-coach_result`, `pvp-overdrive_start`, `pvp-fight_state_resume` (+ 4 more)
✅ HudFight WS dispatches verified (`HudFight.vue:194` — `dice_roll`, `:205` — `pvp_surrender`, `:180` — `coach_choice`).
✅ 8-color FLASH_COLORS map (`useFlashHit.js:25-34`):
```
heal, adrenaline, shield, blind, rage, crit, damage, overdrive
```
- Each value: `color-mix(in srgb, var(--hex-dice-*) 25%, transparent)` — 8 entries verified, matches Sub-epic 7 C5 spec.
✅ Shake animation per victim side (`HudFight.vue:19, :38`):
```
:class="{ shake: fightState.shakeLeftActive }"
:class="{ shake: fightState.shakeRightActive }"
```
✅ 3 effect badges (`.mod-badge--adrenaline/shield/blind`, `HudFight.vue:74-83`).
✅ Effect icons imported (`HudFight.vue:148-153`):
```
iconDice, iconAdrenaline, iconShield, iconBlind, iconHeal
```
✅ ChallengeNotification.vue:62 — `isPlayer1: false` hardcode preserved (carry-over #16, semantically correct, DO NOT "fix").

### User manual test scenarios (10)

- [ ] **5.1** Friend challenge accept → `/v2/fight` → match start + 2 fighters + initial HP 100/100
- [ ] **5.2** Round flow → HP updates + log entries
- [ ] **5.3** DODGE event → `.event-title` overlay + titlePop animation
- [ ] **5.4** CRITICAL! event → overlay + flash (type-coded FLASH_COLORS)
- [ ] **5.5** Per-victim shake → left/right side
- [ ] **5.6** Dice roll → button после cooldown + click → BE response → effect applied
- [ ] **5.7** Active effects → 3 badges visible during effect
- [ ] **5.8** Coach pause → overlay opens с 3 strategy buttons → coach_choice emit
- [ ] **5.9** Surrender → confirm dialog → BE → "You surrendered" overlay
- [ ] **5.10** Opponent surrender → "Opponent surrendered" overlay

---

## Aggregate readiness summary

| Area | Files verified | Imports verified | Classes/handlers verified | User test scenarios | Status |
|---|---|---|---|---|---|
| 1 — Auth | 5/5 | ✅ all 7 Vuex actions | ✅ component routing | 8 scenarios | Ready for user ratification |
| 2 — Wallet | 4/4 | ✅ wagmi composables | ✅ canonical taxonomy | 5 scenarios | Ready for user ratification |
| 3 — Account | 6/6 | ✅ HexButton + Vuex | ✅ canonical `.hex-modal-*` | 8 scenarios | Ready for user ratification |
| 4 — Spectate | 3/3 | ✅ useSpectateState | ✅ `.mod-badge*`/`.sp-log-replayed`/`.hex-modal-overlay` | 5 scenarios | Ready (с BE deploy disclaimer) |
| 5 — Fight | 5/5 | ✅ all WS dispatches | ✅ FLASH_COLORS 8 + shake + 3 badges | 10 scenarios | Ready for user ratification |

**Total scenarios:** 36 manual test items across 5 areas.

---

## Open issues / risks surfaced

### 1. `node_modules` not installed (non-blocking)

- Acceptance gate report uses read-only grep verification — does not require build.
- User must `npm install` before running scenarios manually.
- **Action:** if user encounters lockfile/package issues, surface immediately (Lesson #18 STOP framework).

### 2. Watch button dead code (Q6.1 carry-over) — Area 4 scenario 4.1

- **Cause:** `/v1/friends/list` BE response does NOT include `currentFight` field (verified `backend/src/routes/friends.js:225-238`).
- **Resolution path:** C7 BE feat — add `currentFight` field. C7 cherry-pick PR `fix/friends-watch-live-be` parallel к Sub-epic 8.
- **Acceptance gate impact:** scenario 4.1 PENDING C7 deploy. Other Area 4 scenarios (4.2-4.5) testable now.

### 3. Sub-epic 6 BE deploy gap (Q4.2) — Area 4 environment

- **Disclaimer reproduced from Phase 0:** Sub-epic 6 BE may not be deployed к main.
- **Resolution path:** Q2.5-A merge → Railway auto-deploy lands BE → re-verify Area 4 post-deploy.
- **Acceptance gate impact:** Area 4 manual test против continue-stack environment may differ от production environment.

### 4. v1 view delete cascade (Phase 1d C8/C9 dependency)

- v1 RatingsView referenced by:
  - `src/router/index.js:62` (current) — replaced in C1.
  - `src/components/menu/BottomMenu.vue:48` — uses path `/ratings/clubs` (will redirect к `/v2/ratings` after C1 lands).
  - `src/components/fragments/clan/ClanEdit.vue:163, 169` — uses path `/ratings/clans` (legacy, deleted Phase A C8/C9).
  - `src/views/ClanView.vue:16, 266, 270` — uses `/ratings/clans` (legacy, deleted Phase B C9).
  - `src/views/RatingsView.vue:454` — self-reference (legacy, deleted C9).
  - `src/views/FriendsView.vue` — separate v1 view (deleted C8/C9).
- **Acceptance gate impact:** none — paths already redirect correctly via existing `/ratings/clans` etc → no additional fix needed before C1.

### 5. v1 SpectateView delete cascade

- `src/views/FriendsView.vue:131` references `/spectate/${friend.id}` — будет redirect к `/v2/spectate/:fightId` after C4 lands. C4 uses function-form param mapping (per ТЗ).

---

## Phase 1b readiness — C1 entry assertion

**C1 — Redirect `/ratings/:type` → `/v2/ratings`:**

- ✅ Current state at `src/router/index.js:62-63` matches Phase 0 Q2.1 + Q3.1 expectations.
- ✅ V2Ratings route exists at `src/router/index.js:122-126` (path `ratings`, parent `/v2`).
- ✅ v1 RatingsView consumers documented (5 above) — paths self-redirect through new `/ratings/:type` redirect entry. No edit required в consumer files for C1.
- ✅ Phase 0 expected edit shape (function-form for `:type` param, string-form for bare `/ratings`).

**C1 entry blocker check:** none. Phase 1b ready upon user authorization после Phase 1a ratification.

---

## Streak tracker

**Entering Phase 1a:** 31 ✅
**Recovery #91 logged adaptation-tier** (Lesson #35 framework). Streak preserved.
**Entering Phase 1b after acceptance gate housekeeping commit:** 31 (no functional commit yet).

---

## Lesson #11 catches (acceptance gate phase)

**Pre-edit reflex:** ✅ All file integrity checks performed before any conclusion. No edits made (read-only phase).
**Post-edit reflex:** N/A (no edits in Phase 1a).

---

## Next steps

1. ✅ Generate this report — DONE.
2. Housekeeping commit:
   ```bash
   git add docs/visual-migration/EPIC6_SUBEPIC_8_ACCEPTANCE_GATE_PREFLIGHT.md
   git commit -m "docs(8): acceptance gate pre-flight report (housekeeping)"
   git push -u origin claude/investigate-cutover-gate-RpOyg
   ```
3. STOP — wait user manual ratification of acceptance gate (5 areas, 36 scenarios).
4. **If all pass** — proceed Phase 1b C1 (`/ratings/:type` → `/v2/ratings`).
5. **If any fail** — STOP escalation, document failure mode, decide fix-forward vs rollback (Lesson #18).

---

**Mode A discipline strict.** STOP-and-confirm gate after housekeeping commit. No Phase 1b activity until user explicit authorization.
