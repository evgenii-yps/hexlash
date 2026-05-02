# Эпик 6 — Sub-Epic 3 — Profile Sub-Routes Deep Links — Final Report

**Status:** ✅ CLOSED
**Closure date:** 2026-05-03
**Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack from Sub-epic 2)
**Commit range:** `8e3d8ce` (Commit 1) → `5353e42` (Commit 8 functional) → 10/11/12 closure
**Streak:** 25 → **26** ✅
**Эпик 6 progress:** 8/14 → **9/14 (64%)**
**Closure shape:** Standard linear (6th application в Эпике 6)

---

## TL;DR

Port `/profile/balance|wallet|account` к v2 standalone views via Path A (per-sub-route v2 ports). Two new v2 views (`/v2/wallet` + `/v2/account`) с Pattern A scene-shared 'profile' и Pattern B HUD-only mount. Three redirect transformations preserving v1 URL auth protection. Four account components ported AS-IS preserving Vuetify (carry-over #15). One Switcher3DPunch SKIP (carry-over #14). 8 functional commits + 1 visual verify + 3 closure commits, 0 hot-fixes, 0 recoveries (verify-gate adjustments applied pre-edit per Sub-epic 2 workflow precedent).

---

## What user sees

### `/v2/wallet` (NEW)

- ProfileScene 3D background (mirror Pattern A 'profile' scene from /v2/profile).
- "← Back" button top-left → returns к `/v2/profile`.
- "WALLET" title top-center.
- GameBalanceCard centered showing GAME BALANCE / formatted balance value (DECIMALS conversion via `master.getBalance()`).
- Click anywhere on balance card → toast "Token withdrawal will be available after listing" (3-second timeout).
- "Connect Wallet" CTA button below card → click triggers local lazy-mount ConnectWallet modal (mirror HudProfile lazy-load pattern verbatim).
- Modal close → returns к /v2/wallet view (no navigation side-effects, master/updateMaster handles wallet state global).
- Direct navigation works. `/profile/wallet` URL → 302 redirect → `/v2/wallet`.

### `/v2/account` (NEW)

- ProfileScene 3D background (same scene as /v2/wallet, scene-shared 'profile').
- "← Back" button top-left → returns к `/v2/profile`.
- "ACCOUNT SETTINGS" title top-center.
- 4 components stacked в flat list (mirror v1 ProfileAccount ordering):
  1. **ConfirmEmail** — email input + "Send Confirm" button (visible when email changed or unverified) + error feedback.
  2. **ChangeLogin** — login input + 200ms-debounce availability check + ✏️ confirm icon → VModal confirmation dialog.
  3. **ChangePassword** — "Change Password" button → VModal с 3 password fields (current / new / confirm new) + validation.
  4. **DeleteAccount** — visual gap separator (24px margin + component own 20px = ~44px clearance) + "Delete Account" button → VModal confirmation dialog.
- Direct navigation works. `/profile/account` URL → 302 redirect → `/v2/account`.

### `/profile/balance` redirect

- Direct nav на `/profile/balance` → 302 redirect → `/v2/profile`.
- Per Phase 0 Q1 finding: `/profile/balance` was no-op route in v1 (rendered ProfileView default branch без balance-specific UI). Trivial closure.

### Visual inconsistency note

Vuetify components (VBtnDark / VModal / VCard / InputField) render with v1 styling vs surrounding v2 HUD aesthetic. Acceptable trade-off for streak preservation per Q-tactical-Phase1-3. Carry-over #15 captures this for polish round.

---

## Path A reasoning

### 4 path candidates evaluated

- **Path A — Per-sub-route v2 ports** (chosen) — separate `/v2/wallet` + `/v2/account` standalone views. Mirrors 6B-3 + Sub-epic 1 precedent.
- **Path B — Unified `/v2/profile` internal tabs** — disqualified: triggers Lesson #36 HudProfile card-creep monitor saturation (6/7 → 7/7).
- **Path C — Mix (selective port + redirects)** — rejected: inconsistent treatment (wallet half-migrated, account fully migrated).
- **Path D — All redirects only** — rejected: multiple functional regressions (5 account components + balance display + withdraw all lost).

### Why Path A

1. Pattern proven (6B-3 GuestProfileView, Sub-epic 1 GuestClanView both used standalone v2 views with Pattern B HUD-only).
2. Card-creep monitor preserved at 6/7 (Lesson #36 anti-recommendation against Path B respected).
3. M-size scope (~12 commits) — parity with Sub-epic 2 trajectory.
4. Closes substantial functional gaps (5 of 8 v1 account components migrated, 2 of 3 wallet features, balance no-op resolved).
5. Standalone views = clean separation, deep-link survival, future-extensibility.

---

## Files changed

| File | Action | Lines |
|---|---|---|
| `src/router/index.js` | modified | +12 / −3 net (2 V2 routes + 3 redirects) |
| `src/views-v2/WalletView.vue` | NEW | ~89 |
| `src/views-v2/AccountView.vue` | NEW | ~89 |
| `src/components/hud/HudProfileWallet.vue` | NEW | ~167 (after Commits 1-3) |
| `src/components/hud/HudProfileAccount.vue` | NEW | ~110 (after Commits 4-7) |
| `CLAUDE.md` | modified | Sub-epic 3 closure section + cross-references + carry-overs update |
| `docs/visual-migration/EPIC6_SUBEPIC_3_FINAL_REPORT.md` | NEW (this file) | ~ |
| `docs/visual-migration/HANDOFF_EPIC6_SUBEPIC_4_CHAT_HANDOFF.md` | NEW (Commit 12) | ~ |

**Files DELETED:** None. v1 ProfileView.vue retained for Sub-epic 8 final cutover cleanup.

---

## Commits log

| # | SHA | Type | Message |
|---|---|---|---|
| 0 | (no commit) | Verify gate | Branch verify + 8 read-only queries (Q-V1..Q-V8) |
| 1 | `8e3d8ce` | Functional | Scaffold /v2/wallet route + WalletView + HudProfileWallet skeleton + /profile/wallet redirect (Pattern A scene-shared) |
| 2 | `d23ef1a` | Functional | Wire GameBalanceCard к HudProfileWallet (master.getBalance() source, port AS-IS) |
| 3 | `9d0514a` | Functional | Wire withdraw toast + ConnectWallet local mount к HudProfileWallet |
| 4 | `bbc5549` | Functional | Scaffold /v2/account route + AccountView + HudProfileAccount skeleton + /profile/account redirect (Pattern A scene-shared) |
| 5 | `38693e8` | Functional | Port ConfirmEmail к HudProfileAccount (port AS-IS, Vuetify preserved) |
| 6 | `52a4160` | Functional | Port ChangeLogin + ChangePassword к HudProfileAccount (port AS-IS) |
| 7 | `641165c` | Functional | Port DeleteAccount к HudProfileAccount (final account component, port AS-IS) |
| 8 | `5353e42` | Functional | Redirect /profile/balance → /v2/profile (no-op route closure) |
| 9 | (no commit) | Visual verify gate | User-driven manual QA, no edits, all 4 components + 3 redirects verified |
| 10 | `92373c3` | Closure | docs(claude): Sub-epic 3 closure |
| 11 | TBD | Closure | docs(epic6): Sub-epic 3 final report |
| 12 | TBD | Closure | docs(epic6): Sub-epic 4 handoff |

**Total:** 8 functional commits + 1 audit-skip (visual verify) + 3 closure = 12 commits.

---

## Vuex (reuse only — zero new actions)

| Action | Use case | Source |
|---|---|---|
| `master/getMaster` | All views (master state binding) | Existing |
| `master.getBalance()` method | GameBalanceCard balance source | Existing UserModel method |
| `master/updateMaster` | Email/login/password edits | Existing |
| `master/setInfoMessage` + `InfoMessageModel.withTimeout` | Withdraw toast + component feedback | Existing |
| `master/sendCheckLoginAvailable` | ChangeLogin debounce check | Existing |
| `master/deleteAccount` | DeleteAccount internal flow | Existing |

**Path verifications applied (Q-V2/Q-V4/Q-V6 findings):**
- `InfoMessageModel`: `@/core/models/internal/infoMessageModel.js` named export
- `GameBalanceCard`: `src/components/fragments/profile/wallet/GameBalanceCard.vue`
- `ConnectWallet`: `src/components/fragments/profile/wallet/ConnectWallet.vue` (local mount lazy-load mirror)

---

## Click wiring

| Source | Target |
|---|---|
| WalletView back | `/v2/profile` |
| AccountView back | `/v2/profile` |
| Balance card click | Withdraw toast (3s) |
| Connect Wallet CTA | Local lazy-mount ConnectWallet modal |
| ChangeLogin confirm | Vuex `master/updateMaster { login }` (after VModal confirm) |
| ChangePassword confirm | Vuex `master/updateMaster { newPassword, oldPassword }` |
| DeleteAccount confirm | Vuex `master/deleteAccount` → `clearAuthData` → `router.push('/')` → guard cascade → `/auth/login` |

---

## Recoveries log

**ZERO recoveries в Sub-epic 3.**

8 verify-gate adjustments applied during Commit 0 (A1-A8), classified as ТЗ refinements via verification gate workflow (per Sub-epic 2 precedent), NOT as recoveries:

- **A1** — Pattern A scene-shared 'profile' over Pattern B HUD-only (Q-V5 verified UserProfileView precedent).
- **A2/A6** — V2Wallet/V2Account NOT in protectedRoutes (Q-V8 verified existing v2 routes effectively public; carry-over #10 territory).
- **A3** — `master.getBalance()` method (NOT `master.userData.balance`).
- **A4** — `store.commit('master/setInfoMessage', InfoMessageModel.withTimeout(...))` (NOT `dispatch('info/showToast')`).
- **A5** — ConnectWallet local mount lazy-load pattern (mirror HudProfile verbatim).
- **A7** — All 4 account components AS-IS preserving Vuetify.
- **A8** — DeleteAccount post-delete chain handled internally.
- **InfoMessageModel path** — `@/core/models/internal/infoMessageModel.js` named export.

Workflow design intentional: Verify-gate refinements happen PRE-edit, не fix-forward POST-edit. Streak preservation clean.

---

## Carry-overs

### Closed (0)

No carry-overs closed in Sub-epic 3 (all 13 entering inherited untouched, except as noted).

### NEW (2)

- ⚪ **#14 — Switcher3DPunch SKIP** (per Q-tactical-1 Sub-epic 3 scope decision). v1 ProfileAccount component for 3D punch view toggle. Niche feature, not migrated к v2. Polish round candidate or absorbable into Sub-epic 7 (Auth + Wallet redesign).

- ⚪ **#15 — Account/Wallet components Vuetify → v2 design system port** (per Q-tactical-Phase1-3 + Q-tactical-Phase1-5). 4 account components + GameBalanceCard ported AS-IS preserving Vuetify (VBtnDark / VModal / VCard / InputField). Visual inconsistency vs surrounding v2 HUD aesthetic. Polish round candidate or absorbable into Sub-epic 7.

### Forward note (Sub-epic 8 acceptance gate, NEW)

Pre-cutover full /v2 visual + functional sweep across все routes (profile / wallet / account / ratings / clan / user / fight / training / etc.) before final cutover. Comprehensive acceptance checklist covering все sub-epics 6A-6B-3b + Sub-epic 1-3 deliverables. User-driven manual ratification gate. Documented в Sub-epic 4 handoff for forward propagation.

### Inherited (untouched, 13 items)

Items #1-13 unchanged from Sub-epic 2 closure exit state.

---

## Methodology applied

- **Mode A strict per-commit discipline** — 8 functional commits + 1 visual verify gate + 3 closure commits, build pass per commit, status report + push + STOP-and-confirm gates.

- **Lesson #11 reflex** — pre-edit + post-edit grep на every edit. Examples: Commit 0 8-query verify gate, Commit 4 cross-component VModal teleport-to-body safety verification, Commit 7 post-delete redirect chain end-to-end verification.

- **Lesson #32 convention discovery** — Pattern A scene-shared, InfoMessageModel path, `master.getBalance()` method, ConnectWallet local mount lazy-load mirror HudProfile verbatim.

- **Lesson #34 HUD overlay convention** — applied к HudProfileWallet + HudProfileAccount (scoped style блок, namespaced classes, pointer-events reset).

- **Lesson #35 streak preservation** — Phase 0.2 verify-gate adjustments applied pre-edit, not classified as recoveries.

- **Lesson #36 HudProfile card-creep monitor** — NOT triggered (Path A separates wallet + account into standalone views). Monitor remains 6/7. Path B explicitly disqualified during path selection.

- **Q-V8 carry-over consistency** — V2Wallet + V2Account follow existing v2 unprotected pattern. Auth posture systematic fix deferred к carry-over #10 (Sub-epic 8 territory).

- **Verify-gate workflow precedent** (from Sub-epic 2) — TZ refinements happen pre-edit during Commit 0, не classified as recoveries.

---

## Closure shape: Standard linear (6th application в Эпике 6)

**Application chain:** 6A + 6B-1 + 6B-3 + Sub-epic 1 (was 6B-4) + Sub-epic 2 (was 6B-5) + **Sub-epic 3 (was 6B-6)**.

- 0 reactive splits triggered
- 0 hot-fixes
- 0 recoveries (clean verify-gate workflow execution)

Visual verify gate (Commit 9) passed clean — all 4 account components + 3 redirects + 2 wallet features functional, no console errors, no reactive split needed.

---

## Cumulative metrics

- **Streak:** 25 → **26** ✅
- **Recoveries:** 83+ stable (no new in Sub-epic 3)
- **Эпик 6 progress:** 8/14 → **9/14 (64%)**
- **Sub-epics closed in Эпик 6:** 8 → **9**
- **Carry-overs total:** 13 → **15** (+2 new: #14 Switcher3DPunch SKIP, #15 Vuetify→v2 port)
- **Lessons promoted:** 35 (unchanged)
- **Lesson candidates active:** 7 (unchanged, #36-#42)

---

## Next sub-epic

**Sub-epic 4** — PvP в v2 + real backend WS (was 6B-7, L size, may split into 4a/4b).

Handoff document: `docs/visual-migration/HANDOFF_EPIC6_SUBEPIC_4_CHAT_HANDOFF.md` (Commit 12).

Forward note in handoff: pre-cutover acceptance gate (full /v2 sweep) для Sub-epic 8.

---

## End report
