# Legacy Cleanup — Phase 0 Audit Report

**Branch:** `claude/hexlash-design-setup-wbwFA` (α-variant, same SHA as origin/main `7a5f870`, post-referral PR #378)
**Date:** 2026-05-14
**Scope:** Discovery only. No code edits. No file deletions.

---

## STEP 0 (Lesson #43)

- Branch: `claude/hexlash-design-setup-wbwFA`
- HEAD SHA: `7a5f870` = `origin/main`
- Content diff vs origin/main: empty
- Variant: **α** (harness fresh-slug, same SHA)
- Decision: proceed adaptation-tier, no switch required

---

## Executive summary

The audit confirmed that the L1–L11 backlog is **a partial slice** of remaining legacy. Reality grep surfaced a much larger orphan cluster centred on the **legacy v1 ProfileView ecosystem** — that view was deleted in an earlier sub-epic but its 13+ fragment components stayed behind. Combined with the explicitly preserved v1 routes (`/arena/fight`, `/arena/club`, `/rules`), the codebase carries **27 component orphans + 3 live v1 routes + 4+ orphan i18n keys + 3 backend `language` fields** of dead surface.

Critical correction to backlog assumptions:

- **L3 is NOT legacy.** The 4 account fragments (`ConfirmEmail`/`ChangeLogin`/`ChangePassword`/`DeleteAccount`) are *actively imported by v2* `HudProfileAccount.vue` (per Sub-epic 7 reuse decision). Their parent `ProfileAccount.vue` (L1) is the orphan, but the fragments themselves stay.
- **L7 is already done.** The `auth.telegram.*` / `auth.reset.*` locale blocks were removed in Sub-epic 1b. Backlog item is stale; closes as no-op.
- **L11 "stale doc comments"** are accurate history markers (not lies). Whether to keep them is style preference, not factual cleanup.

Vuetify-removal feasibility (honest assessment): **not realistic in this series.** 30 source files still touch Vuetify primitives, of which 17+ are mounted by live v2 code (global toasts/popups, account/wallet HUDs, clan modals, social-task modals). Legacy cleanup will *reduce* the Vuetify footprint by removing ~13 files (orphans + 3 v1 routed views, once their routes are dealt with), but a dedicated Vuetify-removal series remains afterwards.

---

## Part A — L1–L11 verification

Methodology: for each item, `ls` + `grep -rn "<base>" src/ backend/` to find real importers/callsites, then classification per ТЗ rubric.

### L1 — `src/components/fragments/profile/account/ProfileAccount.vue`

- **File:** exists (1314 bytes)
- **Importers (live in `src/`):** **0**
- **Doc-mentions only:** `HudProfileAccount.vue` (comment narrating port history)
- **Classification:** `legacy-confirmed`
- **Notes:** ProfileAccount imports L2 (`Switcher3DPunch`), L3 (4 account fragments), and `SoundToggle`. Deleting L1 unblocks L2 + `SoundToggle` (chain-orphan) but **must keep L3** alive (used by v2 HUD).

### L2 — `src/components/fragments/profile/account/Switcher3DPunch.vue`

- **File:** exists (1996 bytes)
- **Importers:** only `ProfileAccount.vue` (L1) — chain dependency
- **Vuetify:** yes
- **Classification:** `legacy-confirmed` (deletes once L1 deleted)
- **Notes:** HudProfileAccount.vue explicitly states "Switcher3DPunch SKIPPED per Q-tactical-1 (carry-over #14 polish)" — confirms v2 deliberately omits this feature. No v2 equivalent exists; deletion is a permanent feature drop.

### L3 — Account fragments: `ConfirmEmail` / `ChangeLogin` / `ChangePassword` / `DeleteAccount`

- **Files:** all 4 exist
- **Importers per file:**

  | File | v2 importer | v1 importer | Status |
  |---|---|---|---|
  | ConfirmEmail.vue | HudProfileAccount.vue:18,31 | ProfileAccount.vue (L1) | live |
  | ChangeLogin.vue | HudProfileAccount.vue:19,32 | ProfileAccount.vue (L1) | live |
  | ChangePassword.vue | HudProfileAccount.vue:20,33 | ProfileAccount.vue (L1) | live |
  | DeleteAccount.vue | HudProfileAccount.vue:23,34 | ProfileAccount.vue (L1) | live |

- **Vuetify:** yes — all 4 still use Vuetify primitives (`VModal`, `VBtn`, etc.). Sub-epic 7 Carry-over #15 confirmed Vuetify→v2 design system port was **not** completed for these — only `HexButton` swap + canonical `.hex-modal-*` taxonomy expansion happened.
- **Classification:** `not-legacy`
- **Notes:** This contradicts the L3 backlog framing. The fragments are dual-consumed (legacy ProfileAccount.vue + v2 HudProfileAccount.vue). After L1 deletion the v2 import remains the sole consumer.

### L4 — `src/components/fragments/profile/skins/ProfileSkins.vue`

- **File:** exists (3637 bytes)
- **Importers:** **0**
- **Vuetify:** yes
- **Classification:** `legacy-confirmed`
- **Notes:** Sub-epic 6B-2 closed the `/profile/skins` route via deprecation-via-redirect (route → `/play/profile`); the `Skins` view itself was orphaned at that point. Companion i18n block `t.profile.skins.*` (lblTitle, lblFree) is likely orphan too.

### L5 — `src/components/fragments/profile/wallet/BuyTokens.vue`

- **File:** exists (9392 bytes)
- **Importers (live in `src/`):** **0**
- **Doc-mentions only:** `contractState.js:2` — comment "BuyTokens component hidden until Base contract is ready"
- **Vuetify:** yes
- **Classification:** `preserve` (per backlog intent — confirmed disabled, no live callsite)
- **Open question for STOP gate:** confirm `preserve` decision still holds, or downgrade to `legacy-confirmed` if Base-contract phase has been dropped from roadmap. Default: `preserve`.

### L6 — `lblChangeLanguage` in `src/locales/en.js:48`

- **Key:** exists
- **Callsites:** **0** (only self-reference in `en.js`; one comment mention in L1 ProfileAccount.vue lines 7)
- **Classification:** `legacy-confirmed` (orphan key, deletes safely)
- **Notes:** English-only migration left this key behind. Adjacent: 3 *more* orphan keys found (see Part B §3).

### L7 — `auth.telegram.*` / `auth.reset.*` keys in `en.js`

- **Reality check:** `grep -n "telegram:\|reset:" src/locales/en.js` returns **zero matches in `auth:` block**
- **Status:** **already removed** in Sub-epic 1b C7 (`feat(i18n): remove Telegram auth locale keys`)
- **Classification:** **STALE BACKLOG ITEM — already closed, no work**
- **Bonus finding:** `auth.login.btnReset` (line 29) is the lingering "reset password" trace — 0 callsites. Adds to orphan-key list.

### L8 — `INVITE_DURATION = 30` magic number in `ClanInviteNotification.vue`

- **File:** exists (8375 bytes), **live** — mounted globally via `App.vue:36`
- **Magic number:** line 35 `const INVITE_DURATION = 30;` (seconds), referenced lines 37/52/173/201
- **Classification:** `not-legacy` (live component, tech-debt only)
- **Notes:** Magic-number extraction is its own micro-cleanup, low priority. Out of scope of "delete legacy" — it's "name a constant".

### L9 — `src/components/fragments/profile/ProfileInvite.vue`

- **File:** exists (3925 bytes), first line: `<!-- ProfileInvite — referral feature disabled, preserved for future reactivation. -->`
- **Importers:** **0**
- **Vuetify:** yes
- **Classification:** `needs-decision` (file explicitly self-labels as preserved, but with v2 referral now shipped via `ReferralModal.vue`, the "future reactivation" rationale may have been overtaken by events)
- **Open question for STOP gate:** the v2 referral flow is live (`HudProfile.vue` lazy-mounts `ReferralModal.vue`). Is the original ProfileInvite feature still on roadmap, or is it superseded? Default if no decision: `preserve` (respect self-label).

### L10 — Backend `User.language` field

- **Schema:** `backend/prisma/schema.prisma:28` — `language String @default("en")` on `User` model
- **Backend reads:** `backend/src/utils/helpers.js:29` includes `language: user.language` in `formatUserResponse`
- **Backend writes:** `backend/src/routes/user.js:571,583` — `PUT /v1/user/edit` accepts `language` param and writes; response returns `{ data: { language, settings } }`
- **Frontend handling:** `src/core/models/masterModel.js:56` — `delete userData.language;` (explicit strip from response). English-only migration delegated removal to frontend.
- **Classification:** `legacy-confirmed` (orphan from frontend perspective — value written, ignored on read)
- **Two adjacent fields (same audit):**
  - `SocialTask.language` (schema line 181) — used by `GET /task/social/:language` (`task.js:13`), frontend always passes `'en'` (`taskService.js:37,43`)
  - `DailyTask.language` (schema line 204) — used by `GET /task/daily/:language` (`task.js:50`), frontend always passes `'en'` (`taskService.js:74,80`)

  Both are effectively dead in single-locale operation: the WHERE clause filters to a value that's always `'en'`. Same cleanup category — schema migration drops the field + simplifies query + removes path param.

- **Total backend cleanup scope (L10 extended):**
  - Schema: drop 3 `language` columns from 3 models
  - Routes: change `/task/social/:language` + `/task/daily/:language` to `/task/social` + `/task/daily` (or keep param and ignore)
  - `helpers.js`: drop `language` from `formatUserResponse`
  - `routes/user.js`: drop `language` from `PUT /user/edit` accept-list
  - Frontend `taskService.js`: drop `language` arg from service signatures
  - Migration: 1 destructive migration dropping 3 columns

- **Open question for STOP gate:** confirm backend cleanup runs as a **separate cherry-pick PR**, not bundled with frontend continue-stack PR. Default: yes, separate (Lesson #33 + branch strategy per CLAUDE.md).

### L11 — Stale doc comments (`main.js` / `locales/index.js` / `masterState.js`)

- **`main.js:105–106`:**
  ```
  // Phase 1.5c — English-only: locale boot/restore logic removed
  // (was setLanguage from localStorage/store on app start).
  ```
- **`locales/index.js:1–20`:** large header block describing what English-only migration removed (`languages` map, `setLanguage`, `detectBrowserLanguage`, etc.)
- **`masterState.js:269`:**
  ```
  // Phase 1.5c — setLanguage action removed (English-only). Backend [...]
  ```
- **Classification:** `needs-decision`
- **Notes:** None of these comments lie. They're history markers describing removed surfaces. "Stale" in the backlog framing means "noise after English-only fully landed" — which is style preference, not factual cleanup.
- **Open question for STOP gate:** rule-of-thumb — keep or strip migration-history comments? Default if no rule: keep (low blast-radius, no harm, future devs may want context).

---

## Part B — Beyond-perimeter discovery

### B.1 — Routes still wired to v1 views

After auditing `src/router/index.js`, **3 routes mount v1 view components (not redirects):**

| Path | Route name | v1 view file | v2 equivalent? | Status |
|---|---|---|---|---|
| `/rules` | `Rules` | `src/views/PageView.vue` | partial (`/play/help` = HelpView, different content) | **needs port** (carry-over from Sub-epic 6B-1 Phase 0; backlog #5 `/rules` v2 port) |
| `/arena/fight` | `ArenaFight` | `src/views/PreparationView.vue` | none yet (`/play/matchmaking` + `/play/fight` cover adjacent flow but not 1:1) | **explicitly preserved** per CLAUDE.md Sub-epic 8 Q8 ("Phase C deferred to Эпик 7+") |
| `/arena/club` | `ArenaFightClub` | `src/views/FightClubView.vue` | covered by `/play` hub (V2Pit) | **explicitly preserved** per same Sub-epic 8 Q8 decision |

**Observation:** `PreparationView.vue` is the **last hold-out** Vuetify-using v1 view. `FightClubView.vue` — need to check (not explicitly catalogued in this audit pass; assume Vuetify too based on era).

### B.2 — Redirects from legacy paths to `/play/*`

`src/router/index.js` `protectedRoutes` contains **15 redirect entries** preserving legacy URLs for bookmark survival:

```
/help                     → /play/help
/arena                    → /arena/club          (legacy intra-v1 alias)
/create-fighter           → /play/create
/fighter/:key             → /play/fd/:key
/arena/club/create        → /create-fighter      (chain redirect)
/arena/club/:agentId      → /fighter/:agentId    (chain redirect)
/user/:userLogin          → V2UserProfile (named)
/profile                  → /play/profile
/profile/balance          → /play/profile
/profile/wallet           → /play/wallet
/profile/account          → /play/account
/profile/skins            → /play/profile        (L4 deprecation-via-redirect)
/clan/:id                 → V2GuestClan (named)
/club/:id                 → /clan/:id            (chain redirect)
/fight-club               → /arena/club
/club/agent/create        → /create-fighter
/club/agent/:agentId      → /fighter/:agentId
/ratings/:type            → /play/ratings
/ratings                  → /play/ratings
/training                 → /play/training
/fight                    → /play/fight
/friends                  → /play/profile
/matchmaking              → /play/matchmaking
/spectate/:odId           → /play/spectate/:odId
```

Plus `legacyV2Redirects` (Sub-epic 8a cascade): `/v2` and `/v2/:pathMatch(.*)*` → `/play/*`.

**Open question for STOP gate (item #5 of ТЗ):** keep all 15+ legacy redirects for bookmark survival, or trim ones less likely to be bookmarked? Audit *does not propose removal* — bookmark survival is the explicit reason these exist; URL stability is a UX contract. Default: keep all.

### B.3 — Vuetify-island inventory

**30 frontend files** still use Vuetify primitives. Categorised:

**A. Global app-mount (live, v2 still depends on these):**
- `src/main.js` — Vuetify plugin registration + 20+ primitive imports
- `src/components/Error.vue` — `v-snackbar` + `VBtn` (toast)
- `src/components/Info.vue` — `v-snackbar` + `VBtn` (toast)
- `src/components/NewAchievement.vue` — `VModal` + `VCard*` family (achievement popup)

**B. Live v2 HUDs / fragments (Vuetify mounted from v2 paths):**
- `src/components/hud/HudClan.vue`
- `src/components/hud/HudClanEmpty.vue`
- `src/components/hud/HudProfileWallet.vue`
- `src/components/hud/HudSocialTasks.vue`
- `src/components/fragments/clan/ClanEdit.vue`
- `src/components/fragments/clan/ClanPageContent.vue`
- `src/components/fragments/clan/CreateClan.vue`
- `src/components/fragments/profile/account/ChangeLogin.vue` *(L3)*
- `src/components/fragments/profile/account/ChangePassword.vue` *(L3)*
- `src/components/fragments/profile/account/DeleteAccount.vue` *(L3)*
- `src/components/fragments/profile/wallet/ConnectWallet.vue`
- `src/components/fragments/profile/wallet/GameBalanceCard.vue`
- `src/components/fragments/training/SubscribeModal.vue` *(lazy from HudSocialTasks)*

**C. v1 routed views (still alive):**
- `src/views/PreparationView.vue`
- (FightClubView — not explicitly audited for Vuetify in this pass; treat as suspected)

**D. Orphans (Vuetify-using but ZERO live importers — die with cleanup):**
- `src/components/ui/BackButton.vue` *(used only by orphan ProfileAccount/ProfileSkins/ProfileWallet + live `views/PageView.vue` for `/rules`)*
- `src/components/fragments/clan/ClanWithdraw.vue` *(self-labelled "feature disabled, preserved for future reactivation")*
- `src/components/fragments/profile/ProfileAchievements.vue`
- `src/components/fragments/profile/ProfileButtons.vue`
- `src/components/fragments/profile/ProfileStats.vue`
- `src/components/fragments/profile/ProfileInvite.vue` *(L9)*
- `src/components/fragments/profile/account/ProfileAccount.vue` *(L1)*
- `src/components/fragments/profile/account/Switcher3DPunch.vue` *(L2)*
- `src/components/fragments/profile/account/SoundToggle.vue` *(chain-orphan via L1)*
- `src/components/fragments/profile/skins/ProfileSkins.vue` *(L4)*
- `src/components/fragments/profile/wallet/BuyTokens.vue` *(L5 — preserve)*
- `src/components/fragments/profile/wallet/ProfileWallet.vue` *(NEW orphan — beyond backlog)*
- `src/components/fragments/training/DailyTasks.vue`
- `src/components/fragments/training/SocialTasks.vue`
- `src/components/fragments/training/TaskModal.vue` *(chain-orphan via DailyTasks)*

**Vuetify footprint after legacy cleanup:** Category D orphans drop (13–14 files, depending on L5/L9 preserve decisions). Categories A + B + C remain → **~17 files** still on Vuetify. Plus `main.js` plugin registration.

### B.4 — Parallel v2 / legacy pairs

Beyond `ProfileAccount.vue` ↔ `AccountView.vue`:

| Legacy artifact | v2 equivalent | Equivalence quality |
|---|---|---|
| `ProfileAccount.vue` *(L1)* | `views-v2/AccountView.vue` + `HudProfileAccount.vue` | 1:1, fragments shared |
| `ProfileSkins.vue` *(L4)* | none (concept dropped — see Sub-epic 6B-2) | deprecated outright |
| `ProfileWallet.vue` *(NEW orphan)* | `views-v2/WalletView.vue` + `HudProfileWallet.vue` | 1:1 |
| `ProfileButtons.vue` *(NEW orphan)* | absorbed into `HudProfile.vue` | refactored away |
| `ProfileAchievements.vue` *(NEW orphan)* | absorbed into `HudProfile.vue` (16-tile grid) | refactored away |
| `ProfileStats.vue` *(NEW orphan)* | absorbed into `HudProfile.vue` (Performance card) | refactored away |
| `ProfileAvatar.vue` / `ProfileName.vue` *(NEW orphans)* | absorbed into `HudProfile.vue` (Identity card) | refactored away |
| `ProfileInvite.vue` *(L9)* | `ReferralModal.vue` (lazy-mounted from `HudProfile.vue`) | superseded |
| `DailyTasks.vue` *(NEW orphan)* | `HudTraining.vue` reads same Vuex store directly | refactored away |
| `SocialTasks.vue` *(NEW orphan)* | `HudSocialTasks.vue` (Sub-epic 5I + 5J) | refactored away |
| `views/PreparationView.vue` | (deferred — kept as v1 per Sub-epic 8 Q8) | none |
| `views/FightClubView.vue` | hub at `/play` (V2Pit) covers role | partial |
| `views/PageView.vue` | `views-v2/HelpView.vue` covers `/help`; `/rules` not ported | partial |

### B.5 — Orphan i18n keys (en.js, 892 lines)

Targeted scan (key → callsites in `src/` excluding `en.js` itself):

| Key | Callsites | Status |
|---|---|---|
| `auth.login.btnReset` | 0 | **ORPHAN** (Sub-epic 1b cleanup remnant) |
| `profile.account.lblChangeLanguage` *(L6)* | 0 | **ORPHAN** |
| `profile.account.lblConfirmEmail` | 0 | **ORPHAN** *(grep shows zero — verify scope; ConfirmEmail.vue uses different key)* |
| `profile.account.is3dPunch` + `soundToggle` | low/likely-orphan after L1 dies | needs deep scan |
| `profile.skins.lblTitle` / `lblFree` | 0–1 *(used only by orphan ProfileSkins.vue)* | **chain-ORPHAN** after L4 |
| `profile.invite.*` block | low *(used only by orphan ProfileInvite.vue if it dies)* | **chain-ORPHAN** candidate |
| `profile.account.lblBuyTokens` | 0 | **ORPHAN** |
| `profile.account.lblChangeLogin` | 1 (ChangeLogin.vue:5 — live) | live |
| `profile.account.lblChangePassword` | 2 (ChangePassword.vue:10,23 — live) | live |
| `profile.account.lblDeleteAccount` | 1 (DeleteAccount.vue:9 — live) | live |
| `profile.account.lblWithdraw` | 3 | live |

**Scope statement:** a thorough orphan-key sweep across all 892 lines of `en.js` is **not done in this Phase 0** — it would consume more time than the audit budget. The above is a sampling of high-suspicion buckets (account/skins/invite/reset). A full sweep is a candidate task for a dedicated i18n-cleanup phase if the spot-check yields enough hits to justify it.

### B.6 — 11-locale-infrastructure remnants

Per `locales/index.js` header comment + grep:

- ✅ `languages` map — removed
- ✅ `currentLanguage` ref — removed
- ✅ `setLanguage()` / `getLanguage()` / `availableLanguages` — removed
- ✅ `detectBrowserLanguage()` — removed
- ✅ `ruCountRule()` — removed (per same comment, 0 callsites confirmed)
- ✅ Locale boot/restore in `main.js` — removed (replaced by comment lines 105–106)
- ✅ `setLanguage` action in `masterState.js` — removed (replaced by comment line 269)
- ⚠️ **Frontend doesn't strip `language` field from User**: `masterModel.js:56` does `delete userData.language` — *frontend handles this by delete-on-receive*, not by backend omission. Cleaner approach: backend stops sending it (covered by L10).
- ⚠️ **Backend `User.language` + `SocialTask.language` + `DailyTask.language`** persist (covered by L10).
- ⚠️ **3 history comments** in `main.js`, `locales/index.js`, `masterState.js` describing what was removed (covered by L11).

### B.7 — Orphan component cluster (NEW — beyond L1–L11)

Full zero-importer scan across `src/components/**/*.vue` (boundary regex `\b<base>\b` matching either `import ... base` or `<base ...` template usage) yielded **27 orphans**:

```
Category 1 — v1 ProfileView ecosystem (parent ProfileView.vue already deleted):
  src/components/fragments/profile/ProfileButtons.vue        [Vuetify]
  src/components/fragments/profile/ProfileStats.vue          [Vuetify]
  src/components/fragments/profile/ProfileAchievements.vue   [Vuetify]
  src/components/fragments/profile/PvPStatsCard.vue
  src/components/fragments/profile/ProfileName.vue
  src/components/fragments/profile/ProfileAvatar.vue

Category 2 — backlog L1/L4/L5/L9:
  src/components/fragments/profile/account/ProfileAccount.vue [L1, Vuetify]
  src/components/fragments/profile/skins/ProfileSkins.vue     [L4, Vuetify]
  src/components/fragments/profile/wallet/BuyTokens.vue       [L5, preserve, Vuetify]
  src/components/fragments/profile/ProfileInvite.vue          [L9, Vuetify]

Category 3 — NEW wallet orphan (beyond backlog):
  src/components/fragments/profile/wallet/ProfileWallet.vue   [Vuetify]

Category 4 — v1 training fragments:
  src/components/fragments/training/SocialTasks.vue           [Vuetify]
  src/components/fragments/training/DailyTasks.vue            [Vuetify]
  src/components/fragments/training/Punch3D.vue
  src/components/fragments/training/TaskModal.vue (chain via DailyTasks) [Vuetify]

Category 5 — v1 fight fragments:
  src/components/fragments/fight/HPBar.vue
  src/components/fragments/fight/RoundDisplay.vue

Category 6 — preserved-by-self-label clan:
  src/components/fragments/clan/ClanWithdraw.vue              [Vuetify, self-preserve]
  src/components/fragments/clan/MyClanTab.vue

Category 7 — design-system primitives never adopted:
  src/components/ui/HexProgress.vue                           (only defined in src/test-components.html)
  src/components/ui/HexBadge.vue                              (same)
  src/components/ui/ButtonText.vue
  src/components/ui/carousel/CarouselItem.vue
  src/components/ui/carousel/CarouselContent.vue
  src/components/ui/carousel/CarouselNext.vue
  src/components/ui/carousel/CarouselPrevious.vue

Category 8 — v2 HUD stubs/leftovers:
  src/components/hud/common/PhModal.vue       (removed from HudPit in Sub-epic 5F)
  src/components/hud/common/FighterBadge.vue  (stub never filled — CLAUDE.md Эпик 3 §"Эпик 3 поздние фазы")
```

**Chain-orphans (live importer is itself orphan):**
- `Switcher3DPunch.vue` (L2) — imported by orphan L1
- `SoundToggle.vue` — imported by orphan L1
- `UserAvatar.vue` + `UserName.vue` — imported by `PreparationView.vue` (still routed, see Part B.1)
- `BackButton.vue` — imported by L1, L4, ProfileWallet, and live `views/PageView.vue`. After L1+L4+ProfileWallet deleted + PageView v2-ported → orphan.

---

## Part C — Dependency map + phase proposal

### C.1 — Legacy ↔ v2 readiness map

| Legacy artifact | v2 replacement state | Risk of removal |
|---|---|---|
| L1 ProfileAccount.vue | ✅ HudProfileAccount.vue ships full equivalent | Low |
| L2 Switcher3DPunch.vue | ❌ no v2 equivalent (feature drop per Sub-epic 7 carry-over #14) | Permanent feature loss (already accepted upstream) |
| L3 fragments | ✅ shared between v1 and v2 — keep | n/a (not legacy) |
| L4 ProfileSkins.vue | ❌ concept dropped Sub-epic 6B-2 (deprecation-via-redirect) | Already accepted |
| L5 BuyTokens.vue | ⏸️ preserved for future Base contract phase | Preserve (audit default) |
| L6 lblChangeLanguage | n/a (orphan key) | Trivial |
| L7 telegram/reset locale | ✅ already cleaned (Sub-epic 1b) — backlog stale | n/a |
| L8 INVITE_DURATION | n/a (live component, tech debt only) | Magic-number extraction only |
| L9 ProfileInvite.vue | ✅ ReferralModal.vue ships v2 referral (lazy from HudProfile) | Low if confirmed superseded |
| L10 User.language + SocialTask.language + DailyTask.language | ✅ frontend already strips/ignores; backend cleanup unblocks schema | Medium — destructive migration |
| L11 stale comments | n/a (history markers) | Trivial, style preference |
| NEW orphans (Category 1, 3, 4, 5) | ✅ all replaced by v2 HUDs OR refactored away | Low |
| NEW orphans (Category 7 design-system) | ❌ never adopted | Low — deletes the unused half of "Neon Discipline" primitives |
| NEW orphans (Category 8 HUD stubs) | Already off the navigation graph (PhModal in 5F, FighterBadge never wired) | Low |
| Routed `/rules` → PageView | ❌ not ported to v2 (carry-over to dedicated 6B-1b or 6C sub-epic) | Blocks `views/PageView.vue` + `BackButton.vue` deletion |
| Routed `/arena/fight` → PreparationView | ⏸️ preserved per Sub-epic 8 Q8 | Out of scope of this series |
| Routed `/arena/club` → FightClubView | ⏸️ preserved per Sub-epic 8 Q8 | Out of scope of this series |

### C.2 — Dependency graph inside the cleanup set

```
ROUTES (live)
  /rules ───────────────────────────────► views/PageView.vue ──► BackButton.vue (ui/)
  /arena/fight ─────────────────────────► views/PreparationView.vue ──► UserAvatar.vue, UserName.vue
                                                                       └► [Vuetify primitives]
  /arena/club ──────────────────────────► views/FightClubView.vue
                                                                       └► [Vuetify primitives suspected]
  /profile/skins ───► [REDIRECT to /play/profile]
  /profile/account ─► [REDIRECT to /play/account]
  /profile/wallet ──► [REDIRECT to /play/wallet]

ORPHAN ROOTS (zero live importers)
  L1 ProfileAccount.vue ──► L2 Switcher3DPunch.vue
                          ─► L3 (4 fragments)  [KEEP — used by v2 HudProfileAccount]
                          ─► SoundToggle.vue
                          ─► BackButton.vue [also used by PageView + L4 + ProfileWallet]
  L4 ProfileSkins.vue ────► BackButton.vue
  L9 ProfileInvite.vue ──► (Vuetify)
  L5 BuyTokens.vue ──────► [PRESERVE]
  ProfileWallet.vue (NEW) ► ConnectWallet.vue [KEEP — live in v2 HudProfileWallet]
                          ─► GameBalanceCard.vue [KEEP]
                          ─► BackButton.vue
  ProfileButtons / ProfileStats / ProfileAchievements / PvPStatsCard / ProfileAvatar / ProfileName (NEW) — pure leaves
  DailyTasks.vue (NEW) ───► TaskModal.vue  (chain-orphan, leaf)
  SocialTasks.vue (NEW) ──► SubscribeModal.vue [KEEP — live lazy-mount from HudSocialTasks]
  Punch3D.vue (NEW) ─────► Three.js (leaf)
  HPBar / RoundDisplay (NEW) — pure leaves
  ClanWithdraw.vue, MyClanTab.vue (NEW) — pure leaves
  HexProgress / HexBadge / ButtonText / Carousel×4 (NEW) — pure leaves
  PhModal.vue, FighterBadge.vue (NEW) — pure leaves

BACKEND (independent)
  User.language → /v1/user/edit (writer), /v1/user/me (reader via formatUserResponse)
  SocialTask.language → /v1/task/social/:language → frontend always passes 'en'
  DailyTask.language → /v1/task/daily/:language → frontend always passes 'en'

I18N (in en.js)
  auth.login.btnReset (orphan)
  profile.account.lblChangeLanguage / lblConfirmEmail / lblBuyTokens / is3dPunch / soundToggle (orphan / chain-orphan)
  profile.skins.* (chain-orphan after L4)
  profile.invite.* (chain-orphan candidate after L9 decision)
```

Graph is mostly **leaves** — very few interlocking dependencies. The risk concentration is on the 3 live v1 routed views (out of scope per Sub-epic 8 Q8 lock for `/arena/*`; `/rules` is on the backlog for a dedicated future sub-epic).

### C.3 — Phase proposal

**Driving order:** safety (leaves before roots) + Vuetify-removal prioritisation (Vuetify-using leaves dropped first, freeing Vuetify-footprint) + frontend before backend (Vercel single-PR, then backend cherry-pick PR).

#### Phase 1 — Pure-leaf orphans (frontend, single PR, lowest risk)

**Goal:** delete components with zero importers and no chain deps.

Files to remove (16):
- Category 1 (v1 ProfileView leaves): `ProfileButtons.vue`, `ProfileStats.vue`, `ProfileAchievements.vue`, `PvPStatsCard.vue`, `ProfileName.vue`, `ProfileAvatar.vue`
- Category 4 leaves: `Punch3D.vue`
- Category 5: `HPBar.vue`, `RoundDisplay.vue`
- Category 6: `MyClanTab.vue`
- Category 7: `HexProgress.vue`, `HexBadge.vue`, `ButtonText.vue`, `CarouselItem.vue`, `CarouselContent.vue`, `CarouselNext.vue`, `CarouselPrevious.vue` *(also drop `src/components/ui/carousel/` directory)*
- Category 8: `PhModal.vue`, `FighterBadge.vue`

Vuetify-footprint reduction: ~4 files (ProfileButtons/Stats/Achievements + Hex* + others without Vuetify but freeing the cluster).

Verification: `npm run build` clean; no router breakage; no broken imports.

#### Phase 2 — Chain orphans from L1 (frontend, single PR)

**Goal:** delete L1 + everything that becomes orphan as a result.

Files to remove (4):
- `L1 ProfileAccount.vue`
- `L2 Switcher3DPunch.vue` (chain-orphan via L1)
- `SoundToggle.vue` (chain-orphan via L1) — **VERIFY** no other v2 file imports it (audit grep shows only L1; if any v2 file picks it up, halt)
- Drop directory `src/components/fragments/profile/account/` if it ends up containing only L3 fragments (then it stays — keep folder for L3)

i18n drop (companion to Phase 2):
- `t.profile.account.lblChangeLanguage` (L6)
- `t.profile.account.is3dPunch`
- `t.profile.account.soundToggle`
- `t.profile.account.lblConfirmEmail` (if confirmed orphan)
- Any other `t.profile.account.*` keys that only L1 referenced — full sub-tree audit before delete.

Vuetify-footprint reduction: 3 files (L1, L2, SoundToggle).

#### Phase 3 — L4 + chain (frontend, single PR)

**Goal:** drop deprecated skins concept fully.

Files to remove (1):
- `L4 ProfileSkins.vue`
- Drop directory `src/components/fragments/profile/skins/` (single file inside)

i18n drop:
- `t.profile.skins.lblTitle`, `t.profile.skins.lblFree` (whole `skins:` block)

Vuetify-footprint reduction: 1 file.

#### Phase 4 — L9 + chain (frontend, single PR, gated on STOP-gate decision)

**Goal:** drop ProfileInvite if STOP-gate confirms feature is superseded by ReferralModal.

**Skipped if owner answers "preserve"** to STOP-gate Q2 (L7/L9 classification).

Files to remove (1):
- `L9 ProfileInvite.vue`

i18n drop:
- `t.profile.invite.*` block (verify zero non-ProfileInvite consumers first)

Vuetify-footprint reduction: 1 file.

#### Phase 5 — ProfileWallet.vue orphan (NEW finding, frontend, single PR)

**Goal:** drop the third Profile-ecosystem orphan that the backlog missed.

Files to remove (1):
- `src/components/fragments/profile/wallet/ProfileWallet.vue`

Side effects:
- `ConnectWallet.vue` + `GameBalanceCard.vue` — keep (v2 HUDs use them via lazy mount)
- `BuyTokens.vue` (L5) — keep (preserve)
- Directory `src/components/fragments/profile/wallet/` stays with 3 files.

Vuetify-footprint reduction: 1 file.

#### Phase 6 — v1 training fragment orphans (frontend, single PR)

**Goal:** drop the training-side parallel pair tail.

Files to remove (3):
- `DailyTasks.vue`
- `SocialTasks.vue`
- `TaskModal.vue` (chain via DailyTasks — verify zero other importers)
- Keep `SubscribeModal.vue` (lazy-mounted from HudSocialTasks)

i18n drop:
- Any task-related keys *exclusively* consumed by these files (audit before delete)

Vuetify-footprint reduction: 3 files.

#### Phase 7 — Misc i18n + orphan-key sweep (frontend, single PR)

**Goal:** clean leftover dead keys in `en.js`.

Removals:
- `auth.login.btnReset` (orphan from password-reset cleanup)
- Any account/skins/invite/wallet keys orphaned by Phases 2–6
- Full sweep of remaining `en.js` (892 lines) for zero-callsite keys — separate audit step in Phase 7 prep

#### Phase 8 — `/rules` v2 port (frontend, dedicated sub-epic-sized work)

**Goal:** kill the last live v1 routed view that's in cleanup scope.

Estimated to be its own sub-epic. Once `views/PageView.vue` retires:
- Drop `PageView.vue`
- Drop `BackButton.vue` (last consumer dies)

Vuetify-footprint reduction: 2 files.

#### Phase 9 — L11 stale doc comments (cosmetic, frontend, optional)

**Goal:** strip migration-history comments if owner confirms.

Minimal commit if approved. Skip if owner prefers to retain history.

#### Phase 10 — L10 backend cleanup (backend, **cherry-pick PR, separate from continue stack**)

Migration order (mandatory: migrations before code, Lesson #33):

**10a.** Prisma migration: drop `language` column from `User`, `SocialTask`, `DailyTask` (single migration file, 3 ALTER TABLE statements).

**10b.** Backend code update (same PR):
- `helpers.js` — drop `language: user.language` from `formatUserResponse`
- `routes/user.js` — drop `language` accept from `PUT /user/edit`; drop `language` from response shape
- `routes/task.js` — change `WHERE language = X` queries to plain `findMany`; remove `language` path param OR keep param signature for backwards-compat and ignore
- New Prisma client regen

**10c.** Frontend follow-up (same PR or next continue-stack PR):
- `taskService.js` — drop `language='en'` arg from `fetchAllSocialTasks` / `fetchAllDailyTasks` signatures
- `masterModel.js:56` — strip `delete userData.language;` (no longer needed)

**Risk:** schema migrations require Railway deploy coordination. Default cherry-pick PR pattern per CLAUDE.md branch strategy.

#### Phase 11 — L5 / L8 / ClanWithdraw — explicit non-actions in this series

- **L5 BuyTokens.vue** — preserve, do not delete in this series
- **L8 INVITE_DURATION** — magic-number extraction, separate micro-task
- **ClanWithdraw.vue** — preserve (self-labelled), do not delete in this series

#### Phase 12 — STOP gate before every destructive commit

Per ТЗ: actual file deletion requires explicit owner approval per phase. Each phase boundary = STOP gate.

### C.4 — Phase ordering rationale

Why this order:
1. **Phase 1 first** — pure leaves, zero blast radius, validates the audit grep methodology
2. **Phase 2** before **Phase 3/4/5** — L1 is the largest single orphan and unblocks the most chain-orphans
3. **Phase 3** (L4) is independent — could happen anywhere
4. **Phase 5** (ProfileWallet) is independent — could happen anywhere
5. **Phase 6** (training fragments) is independent — could happen anywhere
6. **Phase 7** (i18n sweep) batched after components are gone so we see *all* keys that turn orphan
7. **Phase 8** (/rules v2 port) deferred — separate effort
8. **Phase 9** (L11 comments) optional final polish
9. **Phase 10** (backend) **separate cherry-pick PR**, independent from frontend continue stack

Phases 1–7 can be batched into 1–2 continue-stack PRs depending on how the owner wants to size the work. Phase 8 + Phase 10 are explicitly separate.

### C.5 — Vuetify-removal feasibility

**Honest assessment: Vuetify-removal is NOT finishable in this legacy-cleanup series.**

Current Vuetify-using file count: **30**.

After legacy cleanup (Phases 1–9, frontend-only):
- Category D orphans drop: ~13 files
- `BackButton.vue` requires Phase 8 (`/rules` v2 port)
- Survivors: **~17 files** still on Vuetify

The surviving 17 files split into two hard cases:

**Case A — Global toast/popup trio (3 files):**
`Error.vue`, `Info.vue`, `NewAchievement.vue` are mounted *globally* in `App.vue`. They are the runtime backbone of all v2 messaging. Porting them to a v2-native toast system (using `--hex-*` tokens + scoped CSS) is a **non-trivial design exercise**, not a cleanup task. Touches every Vuex `setInfoMessage`/`setErrorMessage` consumer — though only at the rendering layer.

**Case B — Live v2 HUDs that still use Vuetify primitives internally (~14 files):**
HudClan, HudClanEmpty, HudProfileWallet, HudSocialTasks, ConnectWallet, GameBalanceCard, ChangeLogin/ChangePassword/DeleteAccount (L3), CreateClan, ClanEdit, ClanPageContent, SubscribeModal, PreparationView. Sub-epic 7 carry-over #15 flagged the L3 trio explicitly; the rest accumulated. Each requires a focused port pass.

**Recommendation:** scope a follow-up "Vuetify Removal" series after legacy cleanup completes, ~10–15 sub-epics depending on grouping. Two sub-streams:
- Stream A: global toast/popup port (3 files, single sub-epic, but design-heavy)
- Stream B: per-cluster HUD port (split across clusters: account / wallet / clan / training / preparation)

The legacy cleanup series **prepares** for Vuetify removal by reducing the surface, but does not complete it.

---

## Vне scope, на заметку (out-of-scope findings)

1. **`src/test-components.html`** + **`test-icons.html`** — design-system demo files that reference `HexProgress` and `HexBadge`. If those primitives are deleted in Phase 1, these test files also need an update or removal pass (sub-task of design-system housekeeping, not legacy cleanup).
2. **`Punch3D.vue` Three.js orphan** — Three.js is also used by `Punch3D.vue` (orphan) + `views/TrainingView.vue` (the Sub-epic 5K-era 3D training view; need to verify live status). If `Punch3D.vue` is the only Three.js consumer, removing it may shrink the Three.js bundle weight. Worth a build-bundle measurement note in the destructive PR.
3. **Mock-mode infrastructure** (`src/core/mock/mockData.js` + 7 service consumers) — alive and intentional, not legacy.
4. **HudProfile.vue card-creep monitor** (Sub-epic 5L+ carry-over #2) — still at 6/7. None of the planned legacy cleanups add a card, so monitor remains untriggered. No action.
5. **`/profile/skins` redirect (router protectedRoutes)** — currently maps `/profile/skins → /play/profile`. After L4 deletion the redirect can stay (no UI change), but the `name: 'Skins'` route name is *only* used as a redirect target — orphan name itself. Trivial follow-up at most.
6. **`HudProfile.vue:651`** has a stale doc comment referencing "Legacy ProfileView.vue:101-102" — that file no longer exists. Same category as L11 (stale history comments). Adds to Phase 9 scope if approved.

---

## Открытые вопросы для STOP gate

Per ТЗ §"Открытые вопросы для STOP gate" — facts laid out, decisions deferred to owner.

### Q1 — L5 (`BuyTokens.vue`)

**Fact:** 0 live callsites. `contractState.js:2` comment confirms intentional disabled state ("hidden until Base contract is ready"). Vuetify-using.

**Default if no answer:** `preserve`. Skip in cleanup phases.

**Alternative if owner downgrades:** add to Phase 5 (alongside ProfileWallet.vue removal — same `wallet/` folder).

### Q2 — L7 / L9 final classification

**L7 (`auth.telegram.*` / `auth.reset.*`):** **already done.** No work, backlog item closes.

**L9 (`ProfileInvite.vue`):** 0 callsites, file self-labels "preserved for future reactivation," but v2 referral is shipped via `ReferralModal.vue` (live, lazy from HudProfile). Owner decides whether the original feature is still on roadmap or superseded.

- If superseded → add to Phase 4 (drop file + `t.profile.invite.*` block).
- If still on roadmap → keep as preserve (audit default given self-label).

### Q3 — Depth of beyond-perimeter Vuetify audit

**Fact:** lightweight inventory done (30 files, A/B/C/D classification). Each surviving Vuetify consumer is named.

Owner decides:
- (a) Continue with this depth → cleanup proceeds, Vuetify removal scoped as a separate series afterwards (recommendation).
- (b) Deepen into per-file refactor proposals → scope balloons, audit re-runs.

**Default:** (a) — proceed with Phase 1 onwards, log Vuetify-removal as a follow-up series.

### Q4 — L10 (backend `User.language` / `SocialTask.language` / `DailyTask.language`)

**Fact:** 3 fields, 3 routes, 1 frontend strip, 1 schema migration. Frontend already ignores `User.language`. Removal is mechanical.

Decision needed:
- Confirm Phase 10 runs as **separate cherry-pick PR** (recommendation per branch strategy).
- Confirm scope includes all 3 fields (not just `User.language`).
- Confirm Prisma migration is part of the same PR (mandatory per Lesson #33 — migrations before code).

**Default:** all three points confirmed yes; Phase 10 is a separate PR with single migration + accompanying code change.

### Q5 — Legacy redirects (15 entries)

**Fact:** all 15 redirects exist for bookmark survival. None of them depend on legacy *components* (they all map to `/play/*` v2 destinations). They are URL-stability contracts.

Decision:
- (a) Keep all → no action (recommendation).
- (b) Audit each one against bookmark-frequency / inbound-link analytics (out of scope of this Phase 0 — would need real telemetry).

**Default:** (a). The cost of keeping a redirect map is near-zero; the cost of breaking a shared link is real.

---

## Acceptance checklist (for STOP-gate sign-off)

- [x] L1–L11 each have a classification + grep evidence
- [x] Routes-to-legacy enumerated (3 live v1 routed views)
- [x] Redirects on legacy paths inventoried (15 entries)
- [x] Vuetify-island inventory done (30 files, A/B/C/D categorised)
- [x] Parallel-pair list constructed
- [x] Orphan i18n keys spot-checked (full sweep deferred to Phase 7)
- [x] 11-locale-infrastructure trace done (5 ✅ removed + 2 ⚠️ pending L10 + 1 ⚠️ L11)
- [x] Dependency graph constructed
- [x] Phase proposal with ordering rationale + Vuetify-removal feasibility assessment
- [x] Explicit "out of scope, on the radar" section
- [x] Open questions for owner laid out (5 items, ТЗ-mandated)
- [x] No code edits, no file deletions in this Phase 0
- [x] Report is markdown

---

## Next step

Wait for owner STOP-gate decisions on Q1–Q5, then plan Phase 1 (pure-leaf orphans, lowest risk) commit chain.

End of Phase 0 audit.
