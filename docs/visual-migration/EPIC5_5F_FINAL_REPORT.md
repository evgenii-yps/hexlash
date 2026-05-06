# Sub-Epic 5F — Triple Small Batch — Final Report

**Date closed:** 2026-04-28
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued from 5E — same harness slug)
**Predecessor:** 5E ✅ CLOSED (`929986d`)
**Commit range:** `a4808d4` (Step 1) → `<step 9>` (Step 9, this)

---

## §1 Шаги и коммиты

| Step | Commit | Что |
|---|---|---|
| 0 | (pre-flight only) | 3 blockers surfaced + resolved before Step 1 |
| 0.5 | (cancelled) | Branch slug — continue current `claude/setup-5e-shop-mode-a-khIAi` per Blocker 1 resolution |
| 1 | `a4808d4` | epic5-5f: step 1 — MODAL_CONTENT.warden + .predator cleanup (5C/5D/5E carry-over) |
| 2 | `a6265d1` | epic5-5f: step 2 — VerifyEmailBanner stub + Vuex wire (emailVerified + router.push) |
| 3 | `5fb195a` | epic5-5f: step 3 — verify-banner CSS port + body push-down |
| 4 | `dcbf424` | epic5-5f: step 4 — HelpModal stub + ? icon trigger |
| 5 | `59ad533` | epic5-5f: step 5 — HelpModal CSS + ? icon button styles |
| 6 | (skipped) | Visual sign-off deferred per user — final verify after Step 10 |
| 7 | (verify-only) | 11 automated checks PASS — no fix commit needed |
| 8 | `d9830ac` | epic5-5f: step 8 — CLAUDE.md Sub-Epic 5F section |
| 9 | `<step 9>` | epic5-5f: step 9 — EPIC5_5F_FINAL_REPORT.md |
| 10 | `<step 10>` | epic5-5f: step 10 — HANDOFF_EPIC5_5G_CHAT_HANDOFF.md |

## §2 Файлы

### Созданы (4)
- `src/components/hud/VerifyEmailBanner.vue` — 71 lines — banner с Vue Transition slide + body.verify-shown class sync
- `src/components/hud/HelpModal.vue` — 73 lines — Teleport-to-body modal с 6 sections + Esc handler + backdrop close
- `src/styles/v24/verify.css` — 73 lines — port prototype 3395-3445 + body push-down rule, scoped `.app-v2`
- `src/styles/v24/help.css` — 151 lines — `.app-v2 .tb-help-btn` (scoped) + `.help-*` global (Teleport-aware) + @keyframes helpFadeIn + mobile @820px

### Augmented (0)
Path A pure для banner; new pattern для HelpModal — никаких legacy augmentation.

### Reused as-is (1)
- `master.userData.emailVerified` field (existing, set by `master/sendVerifyEmail` action) — used for banner conditional

### Изменены (5)
- `src/components/hud/HudPit.vue` (−75 / +20) — MODAL_CONTENT + PhModal infrastructure removal + helpOpen ref + HelpModal lazy mount + TopBar @help-click binding
- `src/views-v2/PitViewV2.vue` (−45 / +9) — PH_MODAL_IDS array + hudRef + dead branch removal
- `src/AppV2.vue` (+2) — VerifyEmailBanner mount (global для всех /v2/*)
- `src/components/hud/common/TopBar.vue` (+10 / −3) — `.v2-topbar__right` flex wrapper + `?` btn + `help-click` emit
- `src/styles/hexlash-v24.css` (+2) — `@import './v24/verify.css'` + `@import './v24/help.css'`

### Удалены (0)
Net −66 lines от dead code cleanup (Step 1) — но без явного `git rm`, через переписывание HudPit.vue + PitViewV2.vue.

## §3 Технические детали

### 3.1 3-sub-epic carry-over closing
MODAL_CONTENT.warden + .predator entries hung over from 5C #14 + 5D #14 + 5E #9 deferred lists. 5F Step 1 closes the carry-over chain. Verified в prototype that these were dead code in original implementation too — line 6948: `if (key === 'warden' || key === 'predator') { openFighterDetail(key); return; }` — early return before MODAL_CONTENT lookup. Audit Q2 confirmed.

### 3.2 Cascade dead code discovery в Step 1
Initial Step 1 goal was "delete 2 entries from MODAL_CONTENT". After deletion, MODAL_CONTENT became empty `{}` — which made entire PhModal infrastructure dead code: `PhModal` import + 4 refs (`modalOpen`, `modalKicker`, `modalTitle`, `modalDesc`) + `openPhModal()` + `closeModal()` + `defineExpose({ openPhModal })` + `<PhModal>` template mount. PitViewV2.vue similarly: `PH_MODAL_IDS = []` + `hudRef = ref(null)` + `if (PH_MODAL_IDS.includes(...))` branch + `ref="hudRef"` attribute. Total removed: −75 lines от HudPit + −45 lines от PitViewV2 = **−120 lines dead code**, +29 lines updated comments = **net −66 lines** в Step 1 alone.

Pattern: when removing the **last** entries from a dispatch table, audit dependent infrastructure for cascade dead code. Don't leave orphan dispatcher with empty table.

### 3.3 Pre-flight Step 0 blocker discovery
Lesson #11 in action — running pre-flight greps **before** Step 1 surfaced 3 blockers in user-supplied ТЗ:
- **Blocker 1** — branch slug: harness still designated `claude/setup-5e-shop-mode-a-khIAi` (5E branch). ТЗ §3 expected new slug `claude/<harness-slug>` placeholder. Resolved: continue 5E branch (no switch).
- **Blocker 2** — field name: ТЗ used `master.userData.verified` but 0 grep hits in masterState.js. Real field is `emailVerified` (set by `commit('updateMaster', {emailVerified: true})` after successful code submission).
- **Blocker 3** — action signature: ТЗ assumed `master/sendVerifyEmail` is "resend link" action. Real signature `async sendVerifyEmail({commit, state}, code)` — это submit-code action (POSTs to `/user/verify-email` with verification code from email link). 0 grep hits for `resend` / `sendVerificationEmail` / `requestVerify` actions. No "resend" backend endpoint exists.

All 3 surfaced + reported to user before any Step 1 code change. User confirmed resolutions. Result: **0 wasted commits на ТЗ-vs-reality mismatch**. Compare 5D Step 5 hot-fix series (5 wasted commits before correct port).

### 3.4 Blocker 2 resolution: `verified` → `emailVerified`
Trivial field rename in VerifyEmailBanner computed (`store.state.master?.userData?.emailVerified`). Without resolution: banner would show forever (always undefined → falsy → `!verified === true`). Fix applied Step 2 inline.

### 3.5 Blocker 3 resolution: router.push instead of fabricated resend
Two options considered (per Step 0 blocker report):
- (a) Skip "Resend Link" btn entirely — informational banner only
- (b) Replace btn with "Verify Now" → `router.push('/verify-email')` — navigate to existing legacy verify flow
- (c) Add new `master/resendVerifyEmail` Vuex action + backend endpoint (out of 5F scope)

User selected (b). Minimal additive change: ships functional banner that takes user to existing flow instead of inventing new endpoint. Real `resend` endpoint deferred to backend purchase sub-epic.

### 3.6 Mount location: AppV2.vue (global) vs PitViewV2.vue (per-view)
Original ТЗ §Step 2 instruction conflicted with §Step 3 visual verify expectation:
- §Step 2 literally: "Mount: В `src/views-v2/PitViewV2.vue`"
- §Step 3 visual verify expectation: "Banner persists across views (`/v2/profile`, `/v2/ratings`, etc.) — это global, not just hub"

Resolved per stated intent (visual verify expectation): mount in **AppV2.vue** so banner appears на всех `/v2/*` routes (hub + profile + ratings + clan + training + matchmaking + create + shop + fight + fd). z-index ordering: CanvasLayer → router-view → VerifyEmailBanner (z-index 86 prototype) → GlobalOverlays (z-index 150-200, paints over banner — atmospheric grain on top, intentional per prototype).

### 3.7 Adaptation deltas в verify.css
Three adaptations from prototype 3395-3445, all documented в CSS header comment:
- **Selector:** `.top-bar` (prototype) → `.v2-topbar` (codebase namespace, verified pre-edit grep — TopBar.vue line 51)
- **Push-down value:** 36px (prototype) → 48px (5F). Preserves prototype +36px delta поверх codebase baseline `top: 12px` (vs prototype baseline 0). Pattern: extract delta, не value blindly. Intent-preservation при adaptation.
- **`.notif-panel` push-down rule dropped** — no v2 NotificationPanel exists yet (audit-confirmed missing, deferred к PvP-integration sub-epic).

### 3.8 Vue Transition вместо CSS class toggle
Prototype implementation: `.verify-banner { transform: translateY(-100%) }` default + `.verify-banner.show { transform: translateY(0) }` toggled via JS `classList.add('show')`. v2 implementation: Vue 3 `<Transition name="verify-slide">` wrapper with `verify-slide-enter-from { translateY(-100%) }` + `verify-slide-leave-to { translateY(-100%) }`. Idiomatic Vue 3, equivalent visual, лучше lifecycle handling (auto-cleanup on unmount).

### 3.9 Selector scope split в help.css
HelpModal uses `<Teleport to="body">` (PhModal precedent — escapes `.app-v2` wrapper for clean z-index stack). Consequence: Teleported elements live OUTSIDE `.app-v2` in DOM, so `.app-v2 .help-*` selector won't match them. Split scope:

| Selector | Scope | DOM location |
|----------|-------|--------------|
| `.app-v2 .tb-help-btn` (+ :hover, :active) | `.app-v2` ancestor | inside TopBar (within `.app-v2` wrapper) |
| `.help-backdrop` / `.help-modal` / `.help-*` | global (no `.app-v2`) | Teleported to `<body>` |
| `@keyframes helpFadeIn` | global | always at root |
| `@media (max-width: 820px)` (modal/title) | global | targets Teleported elements |

PhModal precedent (`.v2-ph-modal`, `.v2-ph-backdrop` без `.app-v2` ancestor) confirms pattern. Documented в help.css header comment.

### 3.10 Wrapper-based button cluster
TopBar получил new `.v2-topbar__right` flex group wrapping help btn + avatar btn. Existing `.v2-topbar__left` already used same pattern для resources. Symmetric. Future-extensible — notif btn / settings btn могут добавиться в этот же right cluster без structural rework.

### 3.11 HelpModal — НЕ PhModal reuse
Bonus check Step 0.5 verified PhModal API:
- Props: `open`, `kicker`, `title`, `desc` — single description string + hardcoded "Coming soon" footer
- HelpModal needs: 6 multi-section content (h3 + p × 6), no "Coming soon" text, larger sizing (640px vs 440px)

Decision: create new HelpModal component following PhModal patterns (Teleport, namespaced classes, Esc handler, backdrop close). Augmenting PhModal с slot — invasive for one-off use. Documented в HelpModal.vue header comment + 5F расхождение #1.

### 3.12 Avatar btn pairing
`.tb-help-btn` style 1:1 match с `.v2-avatar-btn`: 44px circle, `border-radius: 50%`, `border: 1px solid rgba(255,255,255,0.2)`, `background: rgba(14,16,28,0.72)`, `color: #fff`, hover `border-color: var(--hex-primary) + background: rgba(32,24,40,0.85)`, active `transform: scale(0.97)`. Differs only в font properties для `?` glyph display (`font-size: 18px`, `font-weight: 600`, `letter-spacing: 0` vs avatar's 13px / default / 1px). Visual pair achieved — both buttons read as matching right-cluster.

## §4 Проверки

- **`node --check`** не применим к .vue / .css файлам — verified через `npm run build` каждый шаг
- **`npm run build`** — pass на всех 5 functional + 2 closing commits:
  - Step 1: 53.21s
  - Step 2: 39.34s
  - Step 3: 38.91s
  - Step 4: 39.30s
  - Step 5: 37.44s (fastest — Vite cache warm)
  - Step 7 (verify-only): 56.90s
  - Step 8: 42.61s
  - Step 9 (this): TBD post-commit
- **Grep sanity** — все 5 false-positive recoveries (Step 1 × 3, Step 7 × 2): MODAL_CONTENT/PhModal/PH_MODAL_IDS hits в **header comments** (changelog documentation), 0 actual code references after cleanup
- **Pre-commit Step 7 checklist** — 11/11 PASS:
  1. MODAL_CONTENT cleanup (warden:|predator: count = 0)
  2. VerifyEmailBanner mounted in AppV2.vue (NOT PitViewV2 — Step 2 blocker fix)
  3. Verify Now → router.push('/verify-email') (NOT master/sendVerifyEmail — blocker 3 fix)
  4. Verify banner CSS rules (5 prefixed)
  5. body.verify-shown push-down rule
  6. HelpModal lazy mount (v-if="helpOpen") in HudPit
  7. ? icon trigger (tb-help-btn)
  8. help.css imported
  9. urok #11 — no fabricated hits (residual matches comment-only)
  10. urok #12 — N/A для Teleported HelpModal (PhModal precedent)
  11. Build pass
- **Visual verify** — deferred per user "финал проверим после Step 10" decision. Final verify on Vercel preview after HANDOFF commit.
- **Smoke test** (static trace from Step 1) — all 7 named plinth click branches + DOM avatar path + fighter UUID fallback covered. 0 broken paths.

## §5 Расхождения — осознанные

### 5.1 HelpModal не из prototype
Created с нуля per plan §4.2 #3 recommendation. Prototype only имеет Onboarding overlay (line 4237 onbRoot). Document as new pattern в FINAL §3.11.

### 5.2 Help content — inline EN strings
6 sections + button labels + close × hardcoded EN. i18n defer last per plan §R8 (5L sub-epic). Inventory: "How to play", "HEXLASH", "The basics" / "Hub navigation" / "Training" / "PvP combat" / "Clans" / "Shop" + 6 paragraph texts.

### 5.3 Banner dismiss state — НЕ persisted
Local `dismissed` ref в VerifyEmailBanner.vue. Refresh restores banner. 5G polish candidate если decided.

### 5.4 Banner btn label "Verify Now" vs prototype "Resend Link"
Reason: no `resendVerifyEmail` Vuex action existed (blocker 3). Reuse existing legacy verify flow (`router.push('/verify-email')`) вместо invention. Real `resend` endpoint deferred к backend purchase sub-epic.

### 5.5 Banner mounted в AppV2.vue (global) vs original ТЗ PitViewV2.vue (per-view)
ТЗ self-correction per stated intent: §Step 3 visual verify expectation specified "Banner persists across views". §Step 2 mount instruction was incomplete edit. Resolved per intent.

### 5.6 `emailVerified` field (codebase) vs original ТЗ `verified` (assumed name)
TZ self-correction via pre-flight Step 0 (Blocker 2). Lesson #11 in action.

### 5.7 `master/sendVerifyEmail` semantics — submit-code, not resend-link
TZ assumption corrected. Banner Verify Now btn navigates to legacy `/verify-email` view вместо dispatch'а несуществующего resend endpoint.

### 5.8 Selector scope split в help.css
`.tb-help-btn` scoped с `.app-v2`, `.help-*` global (Teleport-aware). Document в CSS header + §3.9. PhModal precedent.

### 5.9 `.top-bar` (prototype) → `.v2-topbar` (codebase namespace)
Codebase uses `.v2-` prefix throughout v2 components. Adaptation для CSS rule selectors.

### 5.10 `.notif-panel` push-down rule dropped
No v2 NotificationPanel exists yet. Audit confirmed missing. Defer к PvP-integration sub-epic when notif overlay ships.

### 5.11 Banner default visible (no initial `translateY(-100%)`)
Vue Transition handles enter/leave вместо prototype CSS class toggle. Idiomatic Vue 3, equivalent visual.

## §6 Уроки для 5G и далее

### Validated working patterns (5F apply)

- **#5 strict teardown order** — VerifyEmailBanner `onBeforeUnmount` removes body.verify-shown class
- **#11 verify shape с реальным data** — applied 5+ times в run (3 blockers Step 0 + 2 false-positive recoveries Step 7). Pattern: при unexpected state — first verify где именно matched (comment / code / string), не just count or assumption
- **#12 pointer-events** — N/A для Teleport modal (PhModal precedent), explicitly documented в §3.9 + help.css header
- **#18 STOP tuning + START structural inspection** — N/A (no visual mismatches в run; would have been used if Step 6 visual sign-off had not been deferred)
- **#22 HUD scoped selector match** — applied для VerifyEmailBanner (`.verify-banner` root scoped `.app-v2 .verify-banner`) + `.tb-help-btn` (in-DOM trigger scoped `.app-v2 .tb-help-btn`). HelpModal — exception explicitly documented (Teleport bypasses `.app-v2` ancestor)

### 5F-introduced practices

- **TZ self-correction via pre-flight Step 0** — pattern для surfacing blockers ДО Step 1 write. Lesson #11 generalised: pre-flight checks **before** code mutation catch ТЗ-vs-reality mismatches at zero-commit cost. 5F surfaced 3 blockers, all resolved before any work. Compare 5D where blockers surfaced mid-Step (Step 5 hot-fix series cost 5 wasted commits).
- **Delta preservation для adaptation** — extract delta, не copy value blindly. Verify-banner push-down 36px (prototype absolute) → 48px (5F absolute, preserves +36px delta поверх codebase 12px baseline). Pattern для intent-preservation при adaptation: identify what the prototype was DOING, not what number it was using.
- **Cascade dead code discovery** — initial cleanup goal expanded когда found dependent dead code (PhModal infrastructure после MODAL_CONTENT removal). Pattern: when removing **last** entries from a dispatch table, audit dependent infrastructure for cascade dead code. Don't leave orphan dispatcher with empty table.

### Lessons added: none new

5F validates lesson #11 stable through 7-source-of-truth changes между ТЗ and reality (3 blockers Step 0 + branch slug clarification + mount location intent-vs-literal + 2 grep false positives). No new lessons needed — existing toolkit covers все scenarios encountered.

### Lessons 1-24 inherited from 5A-5E (distilled)

1. Git log verify before finals (factual hashes)
2. DOM HUD vs 3D raycast — оба path grep'нуть
3. masterModel vs UserModel asymmetry (Date wrapping)
4. Vuex action dispatch vs direct call (multi-step atomic)
5. Lazy scene pattern — default для v2 sub-scenes
6. 5A helper reuse — mandatory grep first
7. Lazy modal + defineExpose augment (5B precedent)
8. Hot-fix mid-epic приемлем, multi-part норма
9. Preemptive edit-split для файлов >100 строк
10. HUD line count soft-300 — splitting candidate в polish
11. **Shape assumptions в ТЗ require pre-verification (5F: 5+ recoveries в run)**
12. v2 HUD components MUST own pointer-events reset
13. Prototype values require target-hardware retuning
14. ТЗ HUD markup specs обязаны включать canonical Vue scaffolding
15. SPEC import paths must cite real precedent verbatim
16. Visual readability is multi-factor — first check renderer exposure
17. Visual issue first move = literal diff against working precedent
18. 2 failed visual tunes → STOP tuning, START structural inspection
19. **Exposure compensation FIRST при port'е prototype scenes** (5E validated, N/A для 5F — no scene work)
20. **Renderer settings delta как primary diagnostic** (N/A для 5F)
21. **Cone-angle adjustments belong в exposure compensation toolkit** (N/A для 5F)
22. Pre-commit grep для HUD scoped style — selector ↔ template root match
23. display:none на lazy modal host pattern — conditional на legacy template
24. Augmentation grep router.push в legacy file

## §7 Deferred list

| # | Item | Target |
|---|---|---|
| 1 | Banner dismiss persistence (currently local state, refresh restores) | 5G polish если decided, либо backend purchase sub-epic если linked с user-prefs |
| 2 | HelpModal i18n (inline EN strings — 6 sections + 8 labels) | 5L i18n sub-epic per plan §R8 |
| 3 | HelpModal content expansion (currently 6 sections, может grow с onboarding scope) | Parallel с Onboarding sub-epic если ships |
| 4 | `.notif-panel` push-down rule (когда v2 NotificationPanel ships) | PvP-integration sub-epic OR 5G polish если notif separate |
| 5 | Real `master/resendVerifyEmail` Vuex action + backend endpoint | Backend purchase sub-epic (symmetric с purchase deferral — both need new backend endpoints) |
| 6 | Cascade dead code retrospective check для 5G — grep PhModal references в codebase (legacy components возможно ещё use) | 5G polish OR separate cleanup commit |
| 7 | "?" icon в TopBar только в hub right cluster — других v2 views не имеют TopBar (only HudPit). Help modal accessible только из hub | Per-view help affordance — defer 5G polish если decided |
| 8 | i18n field names в banner text (`{{ field-specific }}` pattern) — currently EN-only with hardcoded "Clans, Ratings, and on-chain features" | 5L i18n |

## §8 Footer

**Sub-Epic 5F — CLOSED.** ✅

### Route table /v2/* (unchanged from 5E)

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub — real captain + secondAgent + auto-refresh |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ FD |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ |
| `/v2/matchmaking` | 3Bb | ✅ |
| `/v2/create` | 3Bc + 4 | ✅ |
| `/v2/profile` | 5B | ✅ |
| `/v2/ratings` | 5C | ✅ |
| `/v2/clan` | 5D | ✅ |
| `/v2/shop` | 5E | ✅ |

5F не добавляет new routes — features are global overlays:
- VerifyEmailBanner mounted в AppV2.vue → visible on все routes when `emailVerified === false`
- HelpModal mounted в HudPit (hub-only — only `/v2`)
- MODAL_CONTENT cleanup — pure dead code removal, no UX change

### Key metrics

- **Коммитов:** 5 functional + 1 CLAUDE.md + 1 FINAL_REPORT (this) + 1 HANDOFF_5G (Step 10) = **8 total**
  - Step 0: pre-flight only (no commit)
  - Step 0.5: cancelled (no commit)
  - Step 1: `a4808d4` — MODAL cleanup
  - Step 2: `a6265d1` — VerifyEmailBanner stub
  - Step 3: `5fb195a` — verify-banner CSS
  - Step 4: `dcbf424` — HelpModal stub
  - Step 5: `59ad533` — HelpModal CSS
  - Step 6: skipped (visual sign-off deferred)
  - Step 7: skipped (verify-only, all PASS)
  - Step 8: `d9830ac` — CLAUDE.md
  - Step 9: `<step 9>` — FINAL_REPORT
  - Step 10: `<step 10>` — HANDOFF_5G
- **Новых файлов:** 4 (VerifyEmailBanner, HelpModal, verify.css, help.css)
- **Augmented:** 0
- **Reused as-is:** 1 (existing `master.userData.emailVerified` field)
- **Изменённых:** 5 (HudPit, PitViewV2, AppV2, TopBar, hexlash-v24.css)
- **Удалённых:** 0 файлов; net **−66 lines** dead code в 2 modified files (Step 1 cascade cleanup)
- **Добавленных строк:** ~368 в 4 new files + ~30 в modified files + 76 (CLAUDE.md) + ~290 (FINAL_REPORT this) = ~764 total
- **Расхождений:** 11 (§5.1-5.11)
- **Новых уроков:** 0 — validates lesson #11 + adds 3 new patterns (TZ self-correction via pre-flight, delta preservation, cascade dead code discovery)
- **Deferred carry-over:** 8 items distributed (5L i18n × 2, 5G polish × 3, backend purchase sub-epic × 2, parallel sub-epic × 1)

### Hot-fix narrative metric

**0 hot-fix attempts на ложной траектории.** Continues 5E precedent — second sub-epic в Epic 5 без unplanned hot-fixes.

Compare:
- 5A: 0 hot-fixes
- 5B: 1 hot-fix (ConnectWallet display:none discovery → урок #23)
- 5C: 1 hot-fix mid-epic
- 5D: 5 hot-fix attempts Step 5 (before correct port discovery) + 2 augmentation hot-fixes (Steps 7+8) = 7 unplanned commits → lessons #19-24
- 5E: 0 unplanned hot-fixes
- **5F: 0 unplanned hot-fixes** (3 blockers caught pre-Step 1 via lesson #11 reflex)

Lessons #11 + 5E #19-21 + 5F new patterns (pre-flight TZ self-correction, delta preservation, cascade dead code) — toolkit working. Hot-fix prevention through aggressive pre-flight verification.

### Bundle impact

5F adds primarily DOM elements (banner + modal) — bundle delta минимальный:
- VerifyEmailBanner.vue: ~71 lines compiled (banner + Vue Transition + Vuex bindings)
- HelpModal.vue: ~73 lines compiled (Teleport + 6 sections markup + Esc handler)
- verify.css: 73 lines, inlined в main `index.css` chunk через `@import` (Vite не chunk-splits @import inside SFC)
- help.css: 151 lines, same `@import` inlining
- Net 5F addition: ~5kB raw / ~1.5kB gzip к main bundle

### Transition к 5G

Следующий sub-epic per VISUAL_MIGRATION plan: 5G TBD. Pre-flight план для нового чата — `docs/visual-migration/HANDOFF_EPIC5_5G_CHAT_HANDOFF.md` (Step 10).

**Designated branch для 5G run:**
- Continue current `claude/setup-5e-shop-mode-a-khIAi` (5E+5F stack pattern) если harness designation unchanged, ИЛИ
- New `claude/*` slug if harness provides one. Verify branch via `git branch --show-current` + сверить recent commits против 5F CLOSED state (hashes `d9830ac` Step 8 CLAUDE.md + `<step 9>` Step 9 FINAL_REPORT + `<step 10>` Step 10 HANDOFF должны присутствовать в history).

### Carry-over для 5G consideration

Per audit gap matrix (§4 Step 0), top remaining items:
- **Medium candidates** (single-feature sub-epics): Captain switch UI, AutoFight toggle, Social tasks, AI Trainer port в v2 ResultOverlay, Spectate flag, Challenges notification panel
- **Polish batch** (5G as cleanup): HudClan splitting (430 lines), ClanScene mood tune, ClanActivityFeed integration, MODAL_CONTENT.warden+predator already done в 5F (was 5G candidate)
- **Big sub-epics** (отдельные runs): i18n (#19, defer last), Auth entry sub-scene (#1), Onboarding tour (#21), MoveTree/DeckBuilder (#16)

---

**End of Sub-Epic 5F Final Report.**
