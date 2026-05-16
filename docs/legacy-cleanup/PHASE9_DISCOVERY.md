# Phase 9 — Discovery Report

L11 stale doc-comments refresh. Cosmetic phase. Шаг 1 (L11 named files) + Шаг 2 (sверх явные маркеры) finished. **STOP gate before refresh edits — awaiting user approval.**

---

## STEP 0 — Branch + SHA verification (Lesson #43)

**ТЗ expected** (handoff text):
- Branch: `claude/hexlash-design-setup-wbwFA`
- HEAD: `bb6c600` (Phase 8 cleanup)

**Initial actual** (session start):
- Branch: `claude/legacy-cleanup-phase-9-LgCup` (harness fresh-slug from `origin/main` HEAD `7a5f870`)
- HEAD: `7a5f870` — 17+ legacy-cleanup commits missing
- **Variant: γ (real divergence — content non-empty against expected)**

**Resolution per user direction (Option A):**
- Switched to `claude/hexlash-design-setup-wbwFA`
- HEAD: `569ccea` = `feat(hud): inline help modal — full guide link to /play/help` (updated expected — 1 commit ahead of `bb6c600`, added between Phase 8 closure and Phase 9 start; out of L11 scope, see §E)
- 20 commits ahead of `origin/main` (19 legacy-cleanup series + 1 HUD modal — handoff "17/18" was undercount)
- All series commits reachable from `569ccea`

Phase 9 commits go on top of `569ccea`.

---

## Шаг 1 — L11 named files

### `src/main.js`

**1 doc-comment found:**

| Line | Content | Type | Action |
|---|---|---|---|
| 105–106 | `// Phase 1.5c — English-only: locale boot/restore logic removed (was setLanguage from localStorage/store on app start).` | **Type 2** (useful migration context) | **keep** |

No header comment, no other inline docs. File is otherwise pure imports + Vuetify init + initializeApp orchestration.

### `src/locales/index.js`

**1 doc-block (lines 1–19):**

| Lines | Content | Type | Action |
|---|---|---|---|
| 1–19 | Header block: "English-only i18n (Phase 1.5c — multi-locale support removed)" + API surface guarantees + removal inventory (10 locales + 8 helper items) + rationale for keeping `t` as `computed`. | **Type 2** | **keep verbatim** |

This is excellent migration documentation. Every line earns its place.

### `src/core/state/modules/masterState.js`

**11 doc-comments / inline comments found:**

| # | Line(s) | Content (gist) | Type | Action |
|---|---|---|---|---|
| 1 | 37 | `// Server skin takes priority; use localStorage only as fallback for new accounts` | **Type 1** (current behavior) | **keep** |
| 2 | 130–133 | Email Auth Phase 5.5 — skipRedirect rationale. **Parenthetical example "telegram-auth callsite" references Telegram auth excised in Sub-Epic 1b** (Эпик 7+). | **Type 3** (partially stale — wrapper text valid, example dead) | **reword** — drop dead example |
| 3 | 157–160 | Email Auth Phase 5 verifyEmail rename + signature change + public endpoint note. Mentions "1b artifact" — that's an architectural marker, not a stale reference. | **Type 2** | **keep** |
| 4 | 176–179 | requestPasswordReset + backend's generic-200 rationale | **Type 1** | **keep** |
| 5 | 184–187 | confirmPasswordReset auto-login flow | **Type 1** | **keep** |
| 6 | 197–199 | resendVerification + VerifyEmailBanner usage + 1/5min throttle | **Type 1** | **keep** |
| 7 | 211, 214, 229, 261 | Russian inline comments (`// Отправка обновленных данных на сервер`, `// Обновление состояния`) | **Type 1** (current behavior; Russian) | **keep** (per scope discipline — code-comment English-conversion is a separate larger pass; not stale) |
| 8 | 240–242 | `// Phase 1.5c — setLanguage action removed (English-only). Backend User.language field is preserved per scope discipline but FE no longer reads/writes it.` Forward-pointer to L10 parking. | **Type 2** | **keep** |
| 9 | 272–276 | 5Q Phase 1 retirement actions design rationale. References `user.progression` — that's the **backend Prisma model `User.progression`**, alive (Phase 7-pre-2 was FE-only Vuex retire). Comment is accurate. | **Type 2** | **keep** |

**Reword proposal for #2 (lines 130–133):**

```diff
-            // Email Auth Phase 5.5 — signup-with-email shows "Check your inbox"
-            // success screen instead of immediate redirect. Caller passes
-            // skipRedirect: true to opt out of auto-redirect; default behavior
-            // (no email signup, telegram-auth callsite, etc.) preserved.
+            // Email Auth Phase 5.5 — signup-with-email shows "Check your inbox"
+            // success screen instead of immediate redirect. Caller passes
+            // skipRedirect: true to opt out of auto-redirect; default behavior
+            // (no-email signup) preserved.
```

---

## Шаг 2 — Sверх L11 явные маркеры (retired-entity refs in comments across `src/`)

ТЗ-listed маркеры: PageView, BackButton, Card, ProfileAccount, ProfileSkins, ProfileInvite, ProfileWallet, DailyTasks, SocialTasks, TaskModal, `progressionState`, `background_page.webp`, 11-locales infrastructure.

**Greppable clean results:**
- `PageView` — **0 hits** ✅
- `BackButton` — **0 hits** ✅
- `Card.vue` (fragments/Card retired Phase 8) — **0 hits** ✅
- `ProfileAccount` / `ProfileSkins` / `ProfileInvite` (Phases 2–4 retired) — **0 stale comment hits** (all hits are to v2 `HudProfileAccount.vue` / `HudProfileWallet.vue` which are different files) ✅
- `background_page.webp` — **0 hits** ✅
- 11-locales — **0 hits** (only the legitimate Phase 1.5c header in `locales/index.js`) ✅
- `DailyTasks` / `TaskModal` — **0 stale hits** ✅ (only hits are to `HudSocialTasks` / `HudTraining` / `taskRepository` / `taskService` — those are alive)

**Confirmed-stale hits below.**

### B.1 — `ProfileWallet` refs (Phase 5 retired)

| File:line | Current text gist | Action |
|---|---|---|
| `HudProfileWallet.vue:51` | `// ... Mirror v1 ProfileWallet:55-58 verbatim.` | **reword** — drop dead line ref |
| `HudProfile.vue:275–278` | `// UserModel.walletAddress is kept in sync by ProfileWallet / ConnectWallet via master/updateMaster ...` | **reword** — drop ProfileWallet from sync-source list (now only ConnectWallet + own watcher) |
| `HudProfile.vue:309–315` | `// ConnectWallet is reused verbatim from legacy (same component ProfileWallet mounts). ...` | **reword** — drop "same component ProfileWallet mounts" |
| `HudProfile.vue:359–365` | `// Legacy ProfileWallet.vue keeps master.userData.walletAddress in sync with Wagmi's useAccount(address)... v2 users who connect from /v2/profile would otherwise be stranded with a stale walletAddress. This watcher covers the v2 case ...` | **reword** — explain watcher in current-architecture terms (catches address changes outside the modal — auto-reconnect, account switch); also addresses `/v2/profile` path drift incidentally |
| `ConnectWallet.vue:177–178` | `// Additive — does not affect legacy consumers (ProfileWallet.vue) which use the component as-is.` | **reword** — drop legacy-consumer paragraph (no legacy consumers remain; current consumers are HudProfile Identity card + HudProfileWallet CTA) |

**Reword proposals (compact, drop verbatim line refs to retired files):**

`HudProfileWallet.vue:51` ↓
```diff
-// Withdraw — toast as-is per ТЗ A4 (Sub-epic 7 Auth+Wallet redesign territory
-// для real x402 logic). Mirror v1 ProfileWallet:55-58 verbatim.
+// Withdraw — toast as-is per ТЗ A4 (Sub-epic 7 Auth+Wallet redesign territory
+// для real x402 logic).
```

`HudProfile.vue:275–278` ↓
```diff
 // --- Wallet ---
-// UserModel.walletAddress is kept in sync by ProfileWallet / ConnectWallet via
-// `master/updateMaster { walletAddress }` on connect/disconnect. Reading it
-// here gives us a stable value without depending on a Wagmi hook.
+// UserModel.walletAddress is kept in sync by ConnectWallet (modal flow) plus
+// the fallback watcher below for wagmi address changes outside the modal
+// (auto-reconnect, account switch). Reading it here gives a stable value
+// without depending on a Wagmi hook directly.
```

`HudProfile.vue:309–315` ↓
```diff
 // --- ConnectWallet modal integration (Step 10) ---
-// ConnectWallet is reused verbatim from legacy (same component ProfileWallet
-// mounts). We add `defineExpose({ openModal })` there so this HUD can trigger
-// the modal without rendering the inline "Connect Wallet" button — and
-// lazy-load via dynamic import so Profile bundle stays lean for users who
-// never open it. The source layout is rendered with display:none; the modal
-// itself teleports to body and is unaffected.
+// ConnectWallet (src/components/fragments/profile/wallet/) exposes openModal
+// via defineExpose so this HUD can trigger the modal without rendering the
+// inline "Connect Wallet" button. Lazy-load via dynamic import so Profile
+// bundle stays lean for users who never open it. The source layout is
+// rendered with display:none; the modal itself teleports to body and is
+// unaffected.
```

`HudProfile.vue:359–365` ↓
```diff
 // --- Wallet address sync (Step 10) ---
-// Legacy ProfileWallet.vue keeps master.userData.walletAddress in sync with
-// Wagmi's useAccount(address) via dispatch('master/updateMaster'). That
-// component only mounts on /profile/wallet — v2 users who connect from
-// /v2/profile would otherwise be stranded with a stale walletAddress. This
-// watcher covers the v2 case with the same pattern.
+// ConnectWallet dispatches `master/updateMaster { walletAddress }` from
+// inside its modal on connect / disconnect. This watcher catches address
+// changes that happen outside the modal — auto-reconnect on page load,
+// account switch in the wallet extension — to keep master.userData in sync.
```

`ConnectWallet.vue:174–178` ↓
```diff
-// Expose openModal so external callers (e.g. v2 HudProfile Identity card)
-// can trigger the modal directly without rendering the inline "Connect
-// Wallet" button. Epic 5 Sub-Epic 5B Step 10. Additive — does not affect
-// legacy consumers (ProfileWallet.vue) which use the component as-is.
+// Expose openModal so external callers (HudProfile Identity card,
+// HudProfileWallet "Connect Wallet" CTA) can trigger the modal directly
+// without rendering the inline "Connect Wallet" button. Sub-Epic 5B Step 10.
 defineExpose({ openModal })
```

### B.2 — `ProfileView` refs (Эпик 6 cutover retired v1 file)

Verified `src/views/ProfileView.vue` does NOT exist. v2 `src/views-v2/ProfileView.vue` exists and is alive.

| File:line | Current text gist | Action |
|---|---|---|
| `HudProfile.vue:649–653` | `// __APP_VERSION__ / __IS_PROD__ are compile-time defines from vite.config (see CLAUDE.md Build section). Legacy ProfileView.vue:101-102 reads the same way.` | **reword** — drop dead line ref |

Reword:
```diff
 // --- Settings: Build ---
-// __APP_VERSION__ / __IS_PROD__ are compile-time defines from vite.config
-// (see CLAUDE.md Build section). Legacy ProfileView.vue:101-102 reads the
-// same way. Format mirrors prototype 4708: "v0.13.0 · prod".
+// __APP_VERSION__ / __IS_PROD__ are compile-time defines from vite.config
+// (see CLAUDE.md Build section). Format mirrors prototype 4708: "v0.13.0 · prod".
```

### B.3 — `ProfileAchievements` + `ProfileButtons` refs (Phase 1 retired — files gone)

Verified `find src -name "ProfileAchievements.vue" -o -name "ProfileButtons.vue"` returns nothing. Both retired by Phase 1 leaf-orphan cleanup.

| File:line | Current text gist | Action |
|---|---|---|
| `HudProfile.vue:445` | `// ... Legacy ProfileAchievements.vue matches ...` | **reword** — drop legacy ref or rewrite as standalone explanation |
| `HudProfile.vue:661–663` | `// ... Legacy ProfileButtons uses the same single-dispatch pattern. ...` | **reword** — drop legacy ref |

Will read full context lines and propose reword in implementation. Likely just trim the "Legacy X" parenthetical clause without changing surrounding meaning.

### B.4 — `progressionState` refs (Phase 7-pre-2 retired the Vuex module)

| File:line | Current text gist | Type | Action |
|---|---|---|---|
| `masterService.js:13–18` | JSDoc: `Phase 7-pre-2 Part B: dropped broken-namespace commits to progressionState/restoreProgression + progressionState/restoreDeck (namespace did not exist — silent no-ops; module retired).` | **Type 2** (migration history) | **keep** — IS the explanation, written during the cleanup |
| `cardFightState.js:95` | `xpAwarded: false,  // true after XP display (Captain XP awarded via backend, not progressionState)` | **Type 3** (contrast-with-retired-module) | **reword** — drop "not progressionState" contrast |
| `cardFightState.js:240–244` | `// Phase 7-pre-2 Part B cascade: progression module retired, so rootState.progression is undefined. buildPlayerFighter handles empty {} via its own defaults (.deck \|\| [], .moves \|\| {}).` | **Type 2** (parking #8 rationale) | **keep** — documents the parking item context |
| `powerRating.js:131` | JSDoc: `@param {Object} progressionState - Vuex progression module state` | **Type 3** (stale source description) | **reword** — describe shape, not retired source |

Reword for `cardFightState.js:95`:
```diff
-    xpAwarded: false,  // true after XP display (Captain XP awarded via backend, not progressionState)
+    xpAwarded: false,  // true after XP display (Captain XP persisted by backend)
```

Reword for `powerRating.js:131–134`:
```diff
 /**
  * Build a player fighter object from progression state for power calculation.
  *
- * @param {Object} progressionState - Vuex progression module state
+ * @param {Object} progressionState - Object with .deck (array of moveIds) and
+ *   .moves (map of moveId → { level, unlocked }). Legacy shape from the
+ *   retired progression Vuex module; callers now pass an empty {} when no
+ *   progression data is available (see cardFightState startFight).
  * @param {string[]} playerModules - Player's 3 selected modules
  * @returns {Object} Fighter object suitable for calculatePowerRating
  */
```

### B.5 — `SocialTasks` (Phase 6 retired) + ProfileView refs in HudSocialTasks / SubscribeModal

| File:line | Current text gist | Action |
|---|---|---|
| `HudSocialTasks.vue:1–15` | Header block mentions "Legacy SocialTasks.vue itself untouched (0-line preserved)" — `SocialTasks.vue` retired Phase 6, claim obsolete | **reword** — drop "0-line preserved" claim, but keep architectural-choice context as migration history |
| `SubscribeModal.vue:67–73` | `// ... Legacy ProfileView/SocialTasks reuse remains unchanged (they don't call openModal — internal dialog ref still defaults to false on legacy mount, but legacy path uses alternate trigger via parent v-model).` Both ProfileView (Эпик 6) and SocialTasks (Phase 6) retired. Paragraph fully obsolete. | **reword** — drop legacy-reuse paragraph; `defineExpose({ openModal })` augmentation itself is still useful (HudSocialTasks consumer alive) |

Reword for `HudSocialTasks.vue:1–15`:
```diff
 <!-- Sub-Epic 5I Phase 2 — HudSocialTasks v2-native panel.
-     Replaces failed Option A (legacy SocialTasks inline embed — incompatible
-     with HUD layout). v2 design language: mirrors .training-tasks Daily
+     v2 design language: mirrors .training-tasks Daily
      Tasks panel positioning + Choose Archetype card structure (HudCreate.vue
      precedent).

      SubscribeModal reused via 1-line defineExpose augmentation (Option B
      Q1 β). Lazy import + markRaw + nextTick × 2 + ref method trigger
-     pattern (5B ConnectWallet precedent). Legacy SocialTasks.vue itself
-     untouched (0-line preserved); only nested SubscribeModal.vue augmented
-     (2 lines: openModal function + defineExpose).
+     pattern (5B ConnectWallet precedent). Legacy SocialTasks.vue retired in
+     legacy-cleanup Phase 6 along with DailyTasks + TaskModal; only nested
+     SubscribeModal.vue augmentation (2 lines: openModal function +
+     defineExpose) remains in use.

      Vuex bindings mirror TrainingView reactive computeds. Idempotency
      guard prevents duplicate fetch on re-mount. -->
```

Reword for `SubscribeModal.vue:66–73`:
```diff
-// 5I Phase 2 — defineExpose augmentation (Option B Q1 β).
-// Allows v2 HudSocialTasks lazy-mount pattern (5B ConnectWallet precedent)
-// to trigger modal opening from outside. Legacy ProfileView/SocialTasks
-// reuse remains unchanged (they don't call openModal — internal `dialog`
-// ref still defaults to false on legacy mount, but legacy path uses
-// alternate trigger via parent v-model).
+// defineExpose augmentation (Sub-Epic 5I Phase 2). Allows HudSocialTasks
+// lazy-mount pattern (5B ConnectWallet precedent) to trigger modal opening
+// from outside.
 function openModal() {
   dialog.value = true;
 }
 defineExpose({ openModal });
```

---

## Section C — Auxiliary findings (out of ТЗ явный маркер list, surfaced incidentally)

ТЗ scope is L11 + явные маркеры list. The following surfaced during Шаг 2 grep but are **not** part of the cleanup-series retirement scope. **Recommend defer to separate cosmetic pass** — flagging here for transparency.

### C.1 — Closed-gaps paragraph in `HudProfile.vue:489–494`

Comment claims two gaps "deferred to Sub-Epic 5D/5G":

1. *"ChallengeNotification widget is hidden on /v2/\* (App.vue v-if), so v2 users don't see incoming challenge toasts."* — **Closed by Sub-Epic 4a Commit 5a** (ChallengeNotification mounted in `AppV2.vue:6` per `AppV2.vue:23` comment, verified by grep).
2. *"challenge_start server event navigates to legacy /fight in the WS handler — a v2 sender lands on legacy Fight view."* — **Closed by Sub-Epic 4a Commit 5** (v2-aware routing in ChallengeNotification per Эпик 6 closure carry-over #38).

Both gaps closed before Phase 9. Comment is misleading.

**Status: out of ТЗ явный маркер scope.** Doesn't reference retired-by-cleanup-series entity. Mention to user; recommend separate pass.

### C.2 — `/v2/` path drift in comments (Sub-Epic 8a renamed `/v2/*` → `/play/*`)

`grep '/v2/' src/` in comments returned 16+ files with stale `/v2/` paths:
`HudRatings.vue`, `HudPit.vue`, `HudFighterDetail.vue`, `HudFight.vue`, `HudProfile.vue`, `HudClan.vue` (via ClanEdit/CreateClan), `useCreatedFighter.js`, `useFightSetup.js`, `useClickToHit.js`, `CanvasLayer.vue`, `archetypeColors.js`. Real path is now `/play/*` after Sub-Epic 8a.

These are not in ТЗ явный маркер list (8a migration is post-cleanup-series), but technically `/v2` URLs are retired. Mostly trivia path strings inside comments; functionally inert.

**Status: out of scope.** Recommend defer to separate cosmetic pass or roll into the "stale doc comments referencing deleted v1 views" parking item (already deferred per Эпик 6 Sub-epic 8 carry-over #46 — *"~25-30 doc comment cleanup pass"*).

---

## Section D — Out-of-scope code findings (CODE not comments)

Phase 9 ТЗ: "Не trogat функциональный код. Только комментарии." Flagging for transparency:

1. **`masterState.js:9`** — `import {updateJwtToken} from "@/core/services/masterService.js";` — unused import. Already in Stream 1 cleanup carry-over (`Sub-Epic Stream 1 Cleanup Batch` section, listed under "Carry-overs surfaced in C3 — DEFERRED"). Out of Phase 9 scope. No action.

2. **`cardFightState.js:244`** — `const progressionState = rootState.progression || {};` — reads `rootState.progression` from retired Vuex module (Phase 7-pre-2 retired the namespace). Defensive `|| {}` makes it silent-fall-back to empty object. Already parking item #8 (*"Review startFight progression dependency (defensive nil-check маскирует семантический вопрос)"*). Out of Phase 9 scope. No action.

---

## Section E — `569ccea` внешний commit context

Between Phase 8 closure (`bb6c600`) and Phase 9 start (`569ccea`), one functional commit was added to the continue stack:

```
569cceae feat(hud): inline help modal — full guide link to /play/help
```

**Scope:** adds secondary-action link at bottom of inline HUD help modal that navigates to `/play/help` (full HelpView, ported in Phase 8). Closes modal on click.

**Files touched:** `src/components/hud/HelpModal.vue` (+14), `src/styles/v24/help.css` (+29). **Does NOT touch any L11 named file** (`main.js`, `locales/index.js`, `masterState.js`). **Does NOT introduce any comment referring to retired-by-cleanup-series entities.** No interference with Phase 9 analysis.

**Side effect (per user direction):** Help UX coherence parking item (Эпик 6 carry-over) is **closed by this commit** — Variant C ("inline-модалка остаётся, но в ней появляется ссылка 'Full guide → /play/help'"). Brief from parallel mini-conversation no longer needed.

---

## Section F — Summary

**Шаг 1 — L11 named files (13 doc-comments classified):**
- Type 1 (current behavior — keep): 8
- Type 2 (useful migration context — keep): 4
- Type 3 (stale — reword): 1 (`masterState.js:130–133` telegram-auth parenthetical)
- Drop: 0

**Шаг 2 — Sверх (явные маркеры) findings (10 stale comment sites in 6 files):**
- B.1 ProfileWallet refs: 5 sites in 4 files → 5 reword
- B.2 ProfileView refs: 1 site → 1 reword
- B.3 ProfileAchievements + ProfileButtons refs: 2 sites in 1 file → 2 reword
- B.4 progressionState refs: 4 sites in 3 files → 2 keep (migration documentation) + 2 reword
- B.5 SocialTasks + ProfileView refs: 2 sites in 2 files → 2 reword

**Total proposed edits: 13 comment-reword sites across 7 files.** Zero comment deletes (all rewordings preserve the surrounding doc-block; just drop dead refs / line numbers / retired-component mentions).

**Files affected by Шаг 4 commit:**
- `src/core/state/modules/masterState.js`
- `src/components/hud/HudProfileWallet.vue`
- `src/components/hud/HudProfile.vue`
- `src/components/fragments/profile/wallet/ConnectWallet.vue`
- `src/components/hud/HudSocialTasks.vue`
- `src/components/fragments/training/SubscribeModal.vue`
- `src/core/state/modules/cardFightState.js`
- `src/utils/powerRating.js`

(8 files — `masterState.js` covers Шаг 1 #2, the other 7 cover Шаг 2 findings.)

**Out-of-scope flagged in §C/§D — recommend separate pass:**
- §C.1 closed-gaps paragraph in `HudProfile.vue:489–494`
- §C.2 `/v2/` path drift (~16 files)
- §D.1 unused `updateJwtToken` import — Stream 1 carry-over
- §D.2 `rootState.progression` defensive read — parking #8

---

## Шаг 4 plan (post-STOP-gate approval)

One commit `feat(legacy-cleanup): Phase 9 — refresh stale doc-comments (L11)`:
- 13 comment-reword edits across 8 files per proposals above
- No functional code changes
- No CLAUDE.md / parking-related preserves touched
- `npm run build` clean verification post-edit
- Final grep on retired entities (ProfileView, ProfileWallet, ProfileAchievements, ProfileButtons, progressionState, DailyTasks/SocialTasks/TaskModal, PageView, BackButton, Card, background_page) — only legitimate migration markers (§B.3 #1, §B.4 #1, §B.4 #3) and §C path-drift hits should remain. No free-form stale refs left in scope.

**Awaiting user approval before Шаг 4.**
