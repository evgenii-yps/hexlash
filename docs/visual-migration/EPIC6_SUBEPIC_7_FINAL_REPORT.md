# Sub-epic 7 — Final Report — Visual polish round + Auth + Wallet redesign

**Status:** ✅ CLOSED clean
**Date:** 2026-05-05
**Branch:** `claude/visual-polish-auth-wallet-6xe6m` (continue stack — Sub-epic 7 closed here)
**Base SHA entering:** `d27bcbe` (Sub-epic 6 CL3)
**Final functional SHA:** `0f59fe2` (C15 — last functional)
**Closure SHAs:** `0aba5bb` (C16 CLAUDE.md), C17 (this), C18 (handoff — pending)
**Commit count:** 18 (15 functional + 1 STOP recovered + 3 closure)
**Path:** γ FIXED (mixed batch user decision)

---

## 1. Executive Summary

Sub-epic 7 закрыт clean across 18 commits, implementing 16 carry-over closures + 1 reclassification (#27 architectural divergence). Main user request — **carry-over #4 Auth+Wallet redesign** (started 6A) — closed fully via 4 commits (C11 wallet + C12-C14 auth fragments). Streak 30 → 31 preserved через 2 STOP recoveries (C5 + C11 first attempts) c zero hot-fixes и zero functional regressions.

**Key metrics:**
- Functional commits: 15 (C1-C15)
- STOP recoveries: 2 (C5 first attempt #27 dice cooldown, C11 first attempt scope mismatch) — clean ТЗ revisions, no work loss
- Closure commits: 3 (C16 CLAUDE.md, C17 this file, C18 handoff)
- Carry-overs closed: 16 (#4, #11, #12, #13, #15 [4/4 components], #18, #19, #24, #25, #26, #31, #32, #34, #35, #36, #37)
- Carry-overs reclassified: 1 (#27 — architectural divergence v1→v2 dice mechanic)
- Cumulative catches: 30 (25 Lesson #11 + 5 Lesson #32) — within Phase 0 prediction 30-60
- Phase 0 metadata errors: 11 occurrences (Lesson #45 PROMOTED)
- Recoveries: +1 (Recovery #88 — Lesson #43 8th occurrence harness fresh-slug)
- Hot-fix metric: **0 — 31-streak achieved**

**Эпик 6 progress entering:** 13/14 sub-epics
**Эпик 6 progress exiting:** **14/14 (100% functional)** — only Sub-epic 8 cutover remaining

---

## 2. Commit Chain

### Functional commits (15)

| # | SHA | Cluster | Description | Lines |
|---|---|---|---|---|
| C1 | `9343eaf` | B1a | CSS quick wins (HudRatings 8-col grid #12, .mm-main offset #32, .sp-result--draw #37) | +35 -7 |
| C2 | `21259cb` | B1b | FE state/template (captain field #11, a11y #13, replay marker #36) | +58 -5 |
| C3 | `87b7ece` | B1c | Tolerant ErrorMsg parser (#31) + bonus silent BE bug fix | +7 -2 |
| C4 | `a710814` | B2 part 1 | HudFight event titles + shake (#18, #19) | +120 -2 |
| C5 | `b0daa24` | B2 part 2 (revised) | Per-type flash colors (#24) — STOP1 recovered, #27 reclassified | +43 -6 |
| C6 | `9d31d36` | B3 | Dice icons + modifiers bar (#25, #26) | +103 -1 |
| C7 | `70132be` | AW3 c1 | ConfirmEmail port (#15 1/4) — smallest functional commit | +3 -2 |
| C8 | `1815564` | AW3 c2 | ChangeLogin + first VModal swap (#15 2/4) | +57 -14 |
| C9 | `f34b2e7` | AW3 c3 | ChangePassword + DeleteAccount + taxonomy expansion (#15 4/4) | +170 -114 |
| C10 | `1ff1a22` | B4 | Coach pause read-only overlay HudSpectate (#34) | +85 -2 |
| C11 | `58e133d` | AW2 (revised) | ConnectWallet canonical migration + GameBalanceCard (#4 wallet) — STOP2 recovered | +23 -46 (DRY win) |
| C12 | `25ed54e` | AW1 c1 | Login form (#4 auth 1/3) | +26 -19 |
| C13 | `240045e` | AW1 c2 | Signup + Reset (#4 auth 2/3) — first fully clean commit | +50 -38 |
| C14 | `e8a36eb` | AW1 c3 | TelegramLogin (#4 auth 3/3 — closes #4 fully) | +23 -22 |
| C15 | `0f59fe2` | B5 | HudSpectate active effects badges (#35) + .mod-badge taxonomy extraction | +131 -27 |

### Closure commits

| # | SHA | Description |
|---|---|---|
| C16 | `0aba5bb` | docs(7): CLAUDE.md sync — sub-epic mapping + 16 carry-over closures + Sub-epic 7 closure narrative section |
| C17 | (this) | docs(7): Final Report — comprehensive retrospective |
| C18 | next | docs(7): Sub-epic 8 Handoff |

---

## 3. Per-cluster Breakdown

### B-bundle phase (C1-C6, C10) — 7 commits, 13 carry-overs closed + 1 reclassified

**B1a (C1) — CSS quick wins:**
- Files: `ratings.css`, `HudRatings.vue`, `matchmaking.css`, `HudSpectate.vue`
- Closes: #12, #32, #37
- Lesson #11 catches: 1 (mobile @media awareness — placement before @media block to preserve responsive override)
- Lesson #32 catches: 2 (`.app-v2 ` prefix discovery + scoped CSS hex literal convention noted)

**B1b (C2) — State/template quick wins:**
- Files: `friendsState.js`, `HudRatings.vue`, `useSpectateState.js`, `HudSpectate.vue`
- Closes: #11, #13, #36
- Lesson #11 catches: 2 (4-tab adaptation — ТЗ assumed 3 tabs; duplicate `:class` shifted-left fix pre-edit)
- Lesson #32 catches: 1 (greenfield a11y — zero existing role="tab" callsites in codebase)

**B1c (C3) — FE tolerant parser:**
- Files: `webSocketState.js`
- Closes: #31 + bonus silent BE bug fix
- Lesson #11 catches: 1 (model verification surfaced `fromJSON(undefined)` throws TypeError — production-relevant fix beyond shape mismatch)

**B2 part 1 (C4) — HudFight event titles + shake:**
- Files: `useFightSimulation.js`, `HudFight.vue`, `fight-overlays.css`
- Closes: #18, #19
- Lesson #11 catches: 1 (Phase 0 file location wrong — `src/components/hud/common/useFightSimulation.js` not `src/scene/interaction/`)
- Lesson #32 catches: 3 (file path, fighter card class naming `fight-fighter left/right` not BEM `--left/--right`, `.app-v2 ` prefix mixed token convention)
- Race guard deviation (defensive setEventTitle race-tolerant clear, adaptation-tier acknowledgement)

**B2 part 2 (C5 revised) — Per-type flash colors:**
- Files: `useFlashHit.js`, `useFightSimulation.js`, `HudFight.vue`
- Closes: #24 + reclassifies #27 (v1→v2 dice mechanic architectural divergence)
- **First STOP** Sub-epic 7 (C5 first attempt — Lesson #18 STOP-tier triggered)
- Lesson #11 catches: 1 (CSS conflict surfaced — `.hit-flash` rule had hardcoded white bg requiring CSS custom property bridge `--flash-color`)
- Mirror precedent: #16 ChallengeNotification.vue:62 reclassification (Sub-epic 4b)

**B3 (C6) — Dice icons + modifiers bar:**
- Files: `HudFight.vue`, `useFightSimulation.js`, `FightView.vue`
- Closes: #25, #26
- Lesson #11 catches: 2 (CSS scope mismatch — ТЗ said `fight-overlays.css` but actual location HudFight scoped block; BE field name `effects` not `activeEffects` для round_result payload)
- Lesson #32 catches: 1 (HudFight scoped style uses bare selectors per Vue scope auto-isolation, NOT `.app-v2 ` prefix)

**B4 (C10) — Coach pause overlay (HudSpectate):**
- Files: `HudSpectate.vue`, `useSpectateState.js`
- Closes: #34
- Lesson #11 catches: 3 (state negative-space — zero coach overlay fields existed, BE payload fields differ from ТЗ assumption `{round, timeLimit}` not `{round, fighterName, strategy}`, HudFight uses `<CoachPause>` SFC not inline modal)
- DRY validation: first non-AW3 use of canonical `.hex-modal-*` taxonomy

### AW3 phase (C7-C9) — 3 commits, 1 carry-over (4 account components)

**AW3 c1 (C7) — ConfirmEmail port:**
- Files: `ConfirmEmail.vue`
- Closes: #15 1/4
- Smallest functional commit Sub-epic 7 (+3 -2)
- Lesson #11 catches: 1 (VBtnDark architectural finding — Vuetify global alias `main.js:82-90` `VBtnDark: VBtn`, NOT separate SFC file)
- Pattern establishment: HexButton import + class preservation strategy

**AW3 c2 (C8) — ChangeLogin + first VModal swap:**
- Files: `ChangeLogin.vue`
- Closes: #15 2/4
- Lesson #11 catches: 4 (Vuetify scope undercount 9 actual vs 5-6 ТЗ; `.hex-modal-*` taxonomy minimal — only 3 classes vs 7 ТЗ assumed; VModal API simpler — `v-model="dialog"` already manual ref; ConnectWallet precedent uses `.wallet-modal-*` parallel pattern not `.hex-modal-*` reference)
- Establishes inline Teleport modal pattern для C9 reuse

**AW3 c3 (C9) — ChangePassword + DeleteAccount + taxonomy expansion:**
- Files: `hexlash-ui.css`, `ChangePassword.vue`, `DeleteAccount.vue`, `ChangeLogin.vue` (cleanup)
- Closes: #15 4/4 (carry-over #15 fully closed)
- Largest AW3 commit (+170 -114)
- Lesson #11 catches: 3 (token verification — `--hex-border-subtle` doesn't exist; ChangePassword Vuetify count 9 actual vs 5-6 ТЗ; DeleteAccount count 6 actual vs 3-4 ТЗ)
- Taxonomy expansion: +`.hex-modal-body` + `.hex-modal-actions` + `.hex-modal-close` + `.hex-spinner` + `hex-spin` keyframes
- ChangeLogin cleanup: `.cl-modal-*` scoped → canonical `.hex-modal-*`

### AW2 phase (C11) — 1 commit (Option γ — compressed from 2-commit plan)

**AW2 (C11 revised) — ConnectWallet canonical migration + GameBalanceCard:**
- Files: `ConnectWallet.vue`, `GameBalanceCard.vue`
- Closes: #4 wallet portion
- **Second STOP** Sub-epic 7 (C11 first attempt — scope mismatch)
- Net -23 lines (DRY win — canonical taxonomy reduces scoped CSS)
- Lesson #32 catches: 1 (hybrid canonical-modifier pattern — `.cw-modal-*` overrides on `.hex-modal-*` base preserves divergent visual character)
- ProfileWallet was already v2-clean (verified C11 STOP — 85 lines, zero Vuetify, used HexCard + BackButton)
- Wagmi composables (4) preserved verbatim: useAccount/useConnect/useDisconnect/useConnectors

### AW1 phase (C12-C14) — 3 commits, 1 carry-over (4 auth fragments)

**AW1 c1 (C12) — Login form:**
- Files: `Login.vue`
- Closes: #4 auth 1/3
- Lesson #11 catches: 1 (Phase 0 path metadata: RainView at `src/views/` not `src/views-v2/auth/`)
- Token enhancement deviation: hardcoded `rgba(255, 6, 111, 0.5)` → canonical `var(--hex-primary-glow)` (Sub-epic 7 token migration intent)
- Establishes AW1 pattern: HexButton primary lg block + `.auth-btn` glow + `.hex-spinner` + `.auth-loader` 32px size override

**AW1 c2 (C13) — Signup + Reset:**
- Files: `Signup.vue`, `Reset.vue`
- Closes: #4 auth 2/3
- **First fully clean commit Sub-epic 7** (0 catches, 0 deviations)
- Pure C12 pattern reuse — Phase 0 metadata accuracy improved on pattern-reuse commits

**AW1 c3 (C14) — TelegramLogin (closes #4 fully):**
- Files: `TelegramLogin.vue`
- Closes: #4 auth 3/3 — **#4 main user request CLOSED FULLY**
- 0 catches, 0 metadata errors — second fully clean commit
- Smart deviation: `.auth-btn` rule removed entirely (TelegramLogin had no glow shadow pre-edit, preserved per Mode A "preserve verbatim absence")
- Telegram WebApp API: 11 references preserved verbatim (`window.Telegram.WebApp` + `initData` + `initDataUnsafe` + chatId/hash/inviteCode derivation)

### B5 phase (C15) — 1 commit, 1 carry-over + 3rd taxonomy extraction

**B5 (C15) — HudSpectate active effects + `.mod-badge*` taxonomy extraction:**
- Files: `hexlash-ui.css`, `HudFight.vue`, `useSpectateState.js`, `HudSpectate.vue`
- Closes: #35 + DRY taxonomy extraction
- Final functional commit Sub-epic 7
- Lesson #11 catches: 1 (path mismatch — `useSpectateState.js` at `src/scene/interaction/` matching C10 finding, NOT `src/components/hud/common/` per ТЗ — Lesson #45 11th occurrence)
- Lesson #32 catches: 1 (BE-truth field naming `player1*/player2*` per Sub-epic 6 6th subsection invariant, NOT self-anchored `p1*/p2*` ТЗ used)
- Architectural deviation: modifier bars positioned natural flow inside `.sp-fighter` cards, NOT absolute `--left`/`--right` ТЗ proposed (cleaner integration с existing layout)

---

## 4. Lesson #45 PROMOTION Narrative — 11 Occurrences

**Pattern:** Phase 0 hypothesis может ошибочно extrapolate v1 mechanism / file structure / API shape / SFC architecture к v2 без investigating actual current code.

**11 occurrences enumerated:**

| # | Commit | Phase 0 assumption | Reality | Mitigation applied |
|---|---|---|---|---|
| 1 | C4 | `useFightSimulation.js` в `src/scene/interaction/` | `src/components/hud/common/` | Pre-edit grep file location (find -name) |
| 2 | C5 (first) | FE round-counter dice cooldown portable from v1 | v2 BE-truth dice mechanic — NOT portable | STOP → reclassification (#27) |
| 3 | C5 revised | "likely no Edit 4 needed" CSS prediction | Edit 4 mandatory (CSS conflict) — solved via CSS custom property bridge `--flash-color` | Pre-edit grep existing rules surfaced conflict |
| 4 | C7 | VBtnDark.vue SFC file exists | VBtnDark = Vuetify alias в main.js:82 (`VBtnDark: VBtn` global config) | Pre-edit `find src -name "VBtnDark*"` — zero matches |
| 5 | C8 | ChangeLogin = "5-6 Vuetify primitives" | Reality 9 primitives (VBtnDark + VBtn × 2 + VModal + VCard + 3× v-card-* + v-progress-circular) | Pre-edit grep ALL Vuetify tag patterns |
| 6 | C8 | `.hex-modal-*` taxonomy 7 classes | Only 3 classes (overlay/modal/title) | Pre-edit verify hexlash-ui.css contents |
| 7 | C8 | VModal `v-model:show` API mapping needed | Already manual `v-model="dialog"` ref + explicit setters | Pre-edit grep VModal usage pattern |
| 8 | C8 | ConnectWallet uses `.hex-modal-*` precedent | Uses `.wallet-modal-*` parallel scoped pattern (component-specific) | Pre-edit verify referenced precedent |
| 9 | C9 | `--hex-border-subtle` token | Token doesn't exist; `--hex-border-default` correct | Pre-edit verify token list |
| 10 | C12 | RainView.vue в `src/views-v2/auth/` | `src/views/RainView.vue` (legacy v1 path) | Pre-edit `find src -name "RainView*"` |
| 11 | C15 | `useSpectateState.js` в `src/components/hud/common/` | `src/scene/interaction/useSpectateState.js` (matches C10 prior finding) | Pre-edit `find src -name "useSpectateState*"` |

**Mitigation strategy proven:** Pre-edit verification step count scales с commit complexity:
- 3 steps for trivial CSS
- 5-7 steps for component changes
- 8-9 steps для modal/auth/wallet swaps (C8/C9)

**Pattern observation:** catches concentrate в pattern-establishment commits (C7, C8, C9, C11, C12). Pattern-reuse commits (C13, C14) had **zero** Phase 0 metadata catches. Phase 0 reliability correlates negatively с novelty. Future planning: high catch rate expected on first commit of new architectural area; low catch rate expected on repeat applications.

---

## 5. STOP Recovery Analysis

**2 STOPs Sub-epic 7. Both recovered cleanly via revised ТЗ — no work loss.**

### STOP 1 — C5 first attempt (B2 part 2)

- **Trigger:** Lesson #18 STOP-tier — v1→v2 dice mechanic semantic divergence
- **Phase 0 hypothesis:** FE round-counter dice cooldown portable from v1 CardFightView
- **Reality:** v2 binary `diceReady` flag (Sub-epic 4a-6 BE-truth migration); BE controls re-enable via `dice_available` event
- **Resolution:** Option A scope reduction — close #24 only, reclassify #27 architectural divergence
- **Recovery time:** 1 ТЗ revision cycle
- **Lesson #44 reflex applied:** explicit re-anchor scope, no mental-model carry-over к Edit attempts
- **Outcome:** C5 revised landed clean `b0daa24` с #24 closed + #27 reclassified properly documented

### STOP 2 — C11 first attempt (AW2 commit 1)

- **Trigger:** Phase 0 metadata error — "Wallet ~1044 lines" was domain aggregate (ProfileWallet 85 + ConnectWallet 372 + GameBalanceCard 57 + BuyTokens deferred), NOT single ProfileWallet file
- **Reality:** ProfileWallet 85 lines, already v2-clean (zero Vuetify primitives — used HexCard + BackButton + composed children). Real wallet redesign work lives в ConnectWallet (372 lines) + GameBalanceCard (57 lines)
- **Resolution:** Option γ scope shift — combine ConnectWallet + GameBalanceCard в 1 commit (drop original C12 ProfileWallet plan)
- **Recovery time:** 1 ТЗ revision cycle
- **Net result:** AW2 phase compressed к 1 commit (saved 1 commit Sub-epic 7); commit count 19 → 18 actual
- **Outcome:** C11 revised landed clean `58e133d` с #4 wallet portion fully closed

**Conclusion:** Mode A discipline working as designed. STOPs surface assumption mismatches BEFORE code edits — zero work loss across both STOPs. 2 STOPs / 17 functional+STOP attempts = 12% STOP rate (acceptable Mode A friction для complex sub-epic с 11 Phase 0 metadata error pattern occurrences).

---

## 6. DRY Win Analysis — 3 Taxonomy Extractions

**Pattern:** When 2+ components share visual character, extract к global `hexlash-ui.css`. Mirror C9 pattern.

### Extraction 1 — `.hex-modal-*` (C8 establishment + C9 expansion)

- **Pre-C8:** only 3 classes defined (`.hex-modal-overlay` + `.hex-modal` + `.hex-modal-title`); body/actions/close missing per Phase 0 PART 3A discovery
- **C9 expansion:** added `.hex-modal-body` + `.hex-modal-actions` + `.hex-modal-close` (+ `:hover`)
- **Consumers:** 5 components Sub-epic 7
  - ChangeLogin (C8 establishment scoped `.cl-modal-*` → C9 cleanup migration к canonical)
  - ChangePassword (C9 — direct canonical)
  - DeleteAccount (C9 — direct canonical с `variant="danger"`)
  - HudSpectate coach pause overlay (C10 — first non-AW3 consumer)
  - ConnectWallet (C11 hybrid — canonical base + `.cw-*` modifiers)
- **DRY validation:** ConnectWallet C11 migration net -23 lines despite ADD operations (canonical taxonomy reduces scoped CSS duplication)

### Extraction 2 — `.hex-spinner` + `hex-spin` keyframes (C9)

- Replaces `<v-progress-circular>` Vuetify dependency across all auth/wallet/account flows
- **Consumers:** 8 components Sub-epic 7 (per-consumer size override pattern)
  - `.cl-spinner` (C8 ChangeLogin)
  - `.cp-loader` (C9 ChangePassword)
  - `.cw-spinner-lg` (C11 ConnectWallet 40px)
  - `.auth-loader` (C12-C14 Login/Signup/Reset/Telegram 32px)
- **Net Vuetify reduction:** 8× v-progress-circular eliminated

### Extraction 3 — `.mod-badge*` (C15)

- Active effect badges shared HudFight (C6 origin) + HudSpectate (C15 reuse)
- **C15 cleanup migration:** HudFight scoped `.mod-badge*` rules removed (now provided globally), template references unchanged (canonical taxonomy backwards compat)
- **Consumers:** 2 components с identical visual via canonical (HudFight player view, HudSpectate × 2 fighter sides)

### Hybrid canonical-modifier pattern (C11 ConnectWallet precedent)

When component has divergent visual character from canonical, use:
- Canonical base class (`.hex-modal-overlay` + `.hex-modal` + `.hex-modal-close`)
- Component-prefix modifier (`.cw-modal-overlay` + `.cw-modal-content`) — overrides z-index 9000 (vs canonical 1000), max-width 400px (vs 90vw), 1px subtle border (vs 2px primary)

Layered approach preserves DRY benefits + visual character. Reusable approach для future overlays с unique visual context.

---

## 7. BE-truth Preservation Invariant Validation

**All composables / API integrations preserved verbatim across Sub-epic 7.**

### Wagmi composables (AW2)

- `useAccount` / `useConnect` / `useDisconnect` / `useConnectors` — verbatim across 3 callsites (ConnectWallet, ProfileWallet, HudProfile)
- Wagmi config (`src/core/web3/wagmiConfig.js`) — UNTOUCHED
- Connection state machine — UNTOUCHED
- Chain switching logic — UNTOUCHED
- `address` watch → `master/updateMaster { walletAddress }` dispatch chain — UNTOUCHED

### Telegram WebApp API (AW1)

- `window.Telegram.WebApp.initData` access — verbatim
- `window.Telegram.WebApp.initDataUnsafe` access — verbatim
- chatId / hash / inviteCode derivation logic — UNTOUCHED
- Auth payload signing / dispatch logic — UNTOUCHED
- 11 references preserved across TelegramLogin C14 edit

### Vuex chains (all clusters)

Auth/wallet Vuex actions preserved verbatim throughout:
- `master/login`, `master/register`, `master/resetPassword`, `master/getResetState`, `master/clearResetState`
- `master/saveTelegramFlag`, `master/telegram`
- `master/updateMaster`, `master/sendCheckLoginAvailable`, `master/changePassword`, `master/deleteAccount`
- `master/getMaster`, `master/getLoginState`, `master/setInfoMessage`

All dispatch + commit chains preserved через template-only edits (HexButton swap + canonical modal). Zero script logic modifications.

### BE event payload derivation

- **Active effects (C15):** strictly from `detail.player{1,2}.effects` array per `pvpCombatEngine.js:323/331`. No FE synthesis.
- **Coach pause (C10):** strictly from BE `coach_pause` event per `pvpCombatEngine.js:483`. Scenario A confirmed (BE broadcasts to spectators).
- **ErrorMsg (C3):** tolerant к both nested `{errorDto: {code, message}}` + flat `{error, code}` BE shapes. 5 BE callsite consolidation deferred к Эпик 7+ as known debt.

### RainView 3D rain — UNTOUCHED across 4 AW1 commits

- File: `src/views/RainView.vue` (1212 lines Three.js + Kokomi + custom shaders)
- User decision honored throughout Sub-epic 7
- Verified via `git diff --stat src/views/RainView.vue` empty after each AW1 commit (C12, C13×2, C14)
- Login/Signup/Reset/TelegramLogin fragments are independent components (no RainView imports)

---

## 8. Carry-over Closure Matrix

### 16 carry-overs CLOSED

| # | Title | Source | Closed in |
|---|---|---|---|
| #4 | Auth+Wallet redesign (main user request) | 6A | C11+C12+C13+C14 |
| #11 | friendsState captain field drop | Sub-epic 2 | C2 |
| #12 | HudRatings 8-col grid mismatch | Sub-epic 2 | C1 |
| #13 | HudRatings keyboard a11y | Sub-epic 2 | C2 |
| #15 | Account Vuetify→v2 port (4/4 components) | Sub-epic 3 | C7+C8+C9 |
| #18 | Dodge/crit overlay titles | Sub-epic 4a polish | C4 |
| #19 | Shake animation | Sub-epic 4a polish | C4 |
| #24 | Per-type flash colors | Sub-epic 4a polish | C5 revised |
| #25 | Dice icon assets | Sub-epic 4a polish | C6 |
| #26 | Modifiers bar UI | Sub-epic 4a polish | C6 |
| #31 | ErrorMsg shape FE tolerant + bonus silent BE bug fix | Sub-epic 5 polish | C3 |
| #32 | .mm-main filter sidebar gap | Sub-epic 5 polish | C1 |
| #34 | Coach pause read-only spectator overlay | Sub-epic 6 polish | C10 |
| #35 | Active effects badges (HudSpectate) | Sub-epic 6 polish | C15 |
| #36 | Replayed log marker (joined late) | Sub-epic 6 polish | C2 |
| #37 | .sp-result--draw CSS class | Sub-epic 6 polish | C1 |

### 1 RECLASSIFIED

- **#27** — Dice cooldown countdown — RECLASSIFIED Sub-epic 7 (C5) as v1 FE round-counter architecture not portable к v2 BE-truth dice model. v2 binary `diceReady` flag intentional (Sub-epic 4a-6 BE-truth migration). Future BE protocol extension required (`cooldownRemaining` field в `dice_unavailable` event). **Mirror precedent:** #16 ChallengeNotification.vue:62 reclassification (Sub-epic 4b).

### 12 carry-overs forward (Sub-epic 8 или Эпик 7+)

| # | Title | Disposition |
|---|---|---|
| #14 | Switcher3DPunch | PRESERVE per user — deferred Эпик 7+ if 3D punch revisit |
| #20 | Cumulative damage stats | Out of scope per Phase 0 user decision — deferred Эпик 7+ |
| #21 | Log actor colors hardcoded | Existing v2 design constraint, not regression |
| #22 | Coach active boost UI | BE-truth integration concern — deferred Эпик 7+ |
| #23 | Single coach overlay vs v1 dual | HudFight uses CoachPause SFC, intentional architecture |
| #28 | XP earned display | Out of scope per Phase 0 user decision |
| #29 | Filter chips BE extension | Large BE feature, separate sub-epic candidate |
| #30 | ELO duplication consolidation | Refactor sub-epic candidate |
| #33 | Captain payload field name asymmetry | BE refactor candidate |
| **Friends "Watch Live" closure** | DEFERRED к Sub-epic 8 (BE touch needed per Phase 0 Q6) |
| **i18n keys (`spectate.coachPause`/`coachPauseStatus`)** | DEFERRED Sub-epic 8 i18n cleanup if exists в roadmap |
| **HudSpectate myclan tab a11y polish** | Minor a11y gap, Sub-epic 8 polish |

---

## 9. Forward Gates — Sub-epic 8 Pre-cutover Prep

**Mandatory user-facing functional verification (acceptance gate):**

1. **Auth flows** (RainView 3D rain backdrop):
   - `/auth/login` Login form (HexButton primary + form validation + Vuex login dispatch)
   - `/auth/signup` Signup form (3× InputField + showPassword toggle + register dispatch)
   - `/auth/reset` Reset password (2-state UI: form vs success message)
   - `/auth/telegram` TelegramLogin (Telegram WebApp initData parse + auto-login flow)

2. **Wallet flows:**
   - Connect (MetaMask / Coinbase / WalletConnect connectors via wagmi)
   - Disconnect (clear address + Vuex updateMaster sync)
   - GameBalance display (master.getBalance() formatted с DECIMALS)

3. **Account flows (4 modals):**
   - ConfirmEmail (HexButton swap)
   - ChangeLogin (canonical .hex-modal-* + sendCheckLoginAvailable debounce)
   - ChangePassword (3× InputField + canonical .hex-modal-* + 3-field password validation)
   - DeleteAccount (destructive flow, HexButton variant=danger, deleteAccount dispatch + redirect cascade)

4. **HUD spectator (Sub-epic 6 + 7 surface):**
   - Active effects badges per fighter side (player1 LEFT, player2 RIGHT)
   - Coach pause read-only overlay (BE-driven, no interaction)

5. **HUD fight (Sub-epic 4a + 7 surface):**
   - Event titles (DODGE / CRITICAL!) с pop animation
   - Shake animation on damage hit (per victim side)
   - Per-type flash colors (8 colors via FLASH_COLORS map)
   - Dice icons + modifiers bar (3 effect badges)

**Cutover decisions Sub-epic 8 needs:**
- v1 → v2 routing strategy (redirects from old routes к new)
- Legacy file removal scope (v1 RainView path? CardFightView? ProfileWallet? deprecated components?)
- Final smoke test before merge `claude/visual-polish-auth-wallet-6xe6m` → `main`

---

## 10. Cumulative Metrics Summary

| Metric | Entering Sub-epic 7 | Exiting Sub-epic 7 |
|---|---|---|
| Streak | 30 | **31** |
| Recoveries | 87+ | **88+** (+1: #88 Lesson #43 8th occurrence) |
| Lessons promoted | 37 | **38** (+1: #45 Phase 0 metadata error pattern, 11 occurrences) |
| Lesson candidates active | 7 (#36-#42) | 7 (UNCHANGED) |
| Эпик 6 progress | 13/14 (93%) | **14/14 (100% functional)** |
| Carry-overs cumulative | ~37 forward | -16 closed -1 reclassified = ~20 forward |
| Hot-fix metric | 0 hot-fixes | **0 (31-streak)** |

**Phase 0 metadata error pattern observation:**
- Sub-epic 4a: 10 catches
- Sub-epic 4b: 38 catches
- Sub-epic 5: 61 catches
- Sub-epic 6: 50 catches
- **Sub-epic 7: 30 catches** (within Phase 0 prediction 30-60; mid-range given mixed scope batch)

Pattern reuse commits (C13, C14) had **0 catches** confirming hypothesis: Phase 0 reliability correlates negatively с novelty.

---

## 11. Closure Shape

**Standard linear** (10th application Эпик 6).

10 standard linear closures: 6A + 6B-1 + 6B-3 + Sub-epic 1 + Sub-epic 2 + Sub-epic 3 + Sub-epic 4a + Sub-epic 4b + Sub-epic 5 + **Sub-epic 7**. (Sub-epic 6 used Code-complete + deferred-deploy NEW shape — 5th distinct.)

**No backend touches in Sub-epic 7** → no Lesson #33 application → no cherry-pick PR к main → no Railway deploy. Pure FE migration.

ErrorMsg BE consolidation (#31 known debt) deferred к Эпик 7+ per Q4 Option B decision.

**STOPs (2) absorbed cleanly via revised ТЗ workflow (C5 first attempt — dice cooldown reclassification; C11 first attempt — wallet scope mismatch). Both STOPs recovered к clean execution с zero functional regressions. STOP discipline framework working as designed (Lesson #18 STOP-tier classification + Mode A escalation discipline).**

---

## 12. Architectural Decisions

### Path γ FIXED (Phase 0 user decision)

Mixed batch with explicit milestones:
- 5 polish bundles (B1a/B1b/B1c/B2/B3) + B4 + B5
- 3 Auth/Wallet clusters (AW3 → AW2 → AW1)
- Alternating polish + auth/wallet clusters per Phase 0 plan

**Validation:** 14-19 commit estimate confirmed accurate (15 functional + 1 STOP recovered = 16 attempts; 18 total с 3 closure).

### RainView 3D rain UNTOUCHED (Phase 0 user decision)

User confirmed RainView preservation. AW1 commits restyle child auth fragments only. RainView (1212 lines Three.js + Kokomi + custom shaders) untouched throughout.

### Modal strategy Option a (Phase 0 user decision)

Inline `<Teleport to="body">` + canonical `.hex-modal-*` CSS classes (NOT new `Modal.vue` SFC primitive). Mirror existing precedent: ConnectWallet uses inline Teleport.

**Validation:** Pattern works cleanly across 5 Sub-epic 7 modal consumers. Hybrid canonical-modifier extension (C11 ConnectWallet) handles divergent visual character без forcing new abstraction.

### #14 Switcher3DPunch SKIP per user decision

Switcher3DPunch.vue (87 lines) preserves Vuetify-style. NOT touched Sub-epic 7. Niche feature — deferred Эпик 7+ if 3D punch toggle revisit needed.

### #27 Dice cooldown RECLASSIFICATION

Mirror precedent #16 (Sub-epic 4b ChallengeNotification reclassification). Pattern: when v1 mechanism not portable к v2 architecture, reclassify rather than fix-forward. Documented для future Claude — do NOT "implement #27" via FE round counter.

### Component prefix CSS modifier pattern

Established C11 ConnectWallet (`.cw-*`). Reused C10 HudSpectate (`.sp-coach-*`), C8/C9 ChangeLogin/ChangePassword/DeleteAccount via canonical `.hex-modal-*` directly (no prefix needed when canonical visual matches). Pattern proven across 7 components Sub-epic 7.

---

**End of Sub-epic 7 Final Report.**
