# Sub-Epic 5H — Referral QR — Final Report

**Date closed:** 2026-04-28
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued from 5E + 5F + 5G — same harness slug, single PR target)
**Predecessor:** 5G ✅ CLOSED (`e58f2be`)
**Commit range:** `7933105` (Step 2 — only functional commit) → `<step 6>` (Step 6, this)

---

## §1 Шаги и коммиты

| Step | Commit | Что |
|---|---|---|
| 0 | (pre-flight only) | 2 ТЗ corrections caught at zero-commit cost (Correction A: defineExpose unnecessary for mount-on-demand lifecycle; Correction B: CSS lives in profile.css, not scoped block) |
| 0.5 | (skipped) | Branch slug — continue current `claude/setup-5e-shop-mode-a-khIAi` (5F/5G precedent) |
| 1 | (verify-only — no commit) | ReferralModal mount-on-demand requirements confirmed (Teleport at root + close emit + no v-if guard = visible on mount) |
| 2 | `7933105` | epic5-5h: step 2 — lazy ReferralModal host + Identity Referral row |
| 3 | (skipped — verify-only) | Visual sign-off — user confirmed |
| 4 | (verify-only — no commit) | 9/9 automated checks PASS — first sub-epic в running tally без false-positive grep recovery |
| 5 | `8c989b1` | epic5-5h: step 5 — CLAUDE.md Sub-Epic 5H section |
| 6 | `<step 6>` | epic5-5h: step 6 — EPIC5_5H_FINAL_REPORT.md |
| 7 | `<step 7>` | epic5-5h: step 7 — HANDOFF_EPIC5_5I_CHAT_HANDOFF.md |

## §2 Файлы

### Созданы (0)
5H — augmentation pattern reuse, no new files.

### Augmented (0)
**Correction A — legacy file untouched.** ReferralModal.vue (`src/components/fragments/profile/ReferralModal.vue`) remains 288 lines, zero edits. Mount-on-demand lifecycle works as-is via existing `<Teleport to="body">` + `emit('close')` API.

### Reused as-is (5)
- `apiClient.getReferrals()` endpoint (`src/core/api/apiClient.js`) — `GET /user/referrals authRequired`
- `qrcode` library (^1.5.4 в package.json — used inside legacy modal)
- `navigator.clipboard.writeText` API pattern (used in legacy modal copy btn + ProfileInvite + HudProfile wallet)
- `navigator.share` API pattern with clipboard fallback (legacy modal share btn)
- ReferralModal full body (288 lines) — **untouched per Correction A**

Plus parallel use: legacy ProfileView.vue still mounts ReferralModal via static `import` + `v-if` toggle. Both v1 and v2 trigger paths coexist without conflict.

### Изменены (2)
- `src/components/hud/HudProfile.vue` (+40 / -0) — Identity card 5th row + lazy host markup + script integration (ReferralComp shallowRef + referralMounted ref + loadReferralModal async + onReferralClick async + referralLinkText computed) + ReferralModal host markup
- `src/styles/v24/profile.css` (+6 / -0) — `.ifv.referral` base + `:hover` rules (mirror `.ifv.wallet` pattern, placed after `.ifv.wallet.disabled:hover`)

### Удалены (0)

## §3 Технические детали

### 3.1 Smallest sub-epic в Эпике 5
4 commits total: 1 functional (Step 2 `7933105`) + 3 closing (Step 5 CLAUDE.md / Step 6 FINAL_REPORT / Step 7 HANDOFF_5I). Verify-only steps × 3 (Step 1, 3, 4) closed without commits. Compare 5E (~25 commits, full Shop scene + HUD), 5F (10 commits, triple batch), 5G (5 commits, in-place HUD modification). 5H scope = "1 row + 1 handler + ~6 lines CSS". Pattern matched smallest scope possible для feature delivery via augmentation reuse при clean codebase.

### 3.2 Pre-flight Step 0 corrections × 2
Lesson #11 reflex caught 2 ТЗ assumption errors at zero-commit cost:

- **Correction A — `defineExpose` unnecessary for ReferralModal**. ТЗ §Step 1 assumed mirror of ConnectWallet pattern (internal `isOpen` ref + `openModal()` + `defineExpose`). Pre-flight Step 7 grep `isOpen|openModal|modelValue` returned **0 hits** — ReferralModal has no internal open state. Modal mount = visible (Teleport at template root, no v-if guard). Mount-on-demand lifecycle differs от ConnectWallet's long-lived hidden component pattern. Resolution: skip `defineExpose` entirely — `v-if="referralMounted"` parent toggle = visibility control.
- **Correction B — CSS file location refinement**. ТЗ §Step 2 assumed `.ifv.wallet` rule lives в HudProfile.vue scoped style block. Pre-flight `grep "\.ifv" src/` revealed actual location: `src/styles/v24/profile.css:156-163`. 5H rule добавлена в same file для consistency (not scoped block).

Cumulative TZ self-correction tally: **7 corrections across 5F (3) + 5G (2) + 5H (2)**. Pattern stable: pre-flight investment continues paying compound interest (zero-commit fixes vs mid-run hot-fixes в 5D).

### 3.3 Mount-on-demand vs long-lived modal lifecycle
ConnectWallet (5B): persistent state across opens (wallet connector list cached, address sticky), внутренний `showModal` ref controls visibility, host element always mounted (`display: none` source layout), modal teleports to body when shown. `openModal()` flips `showModal=true` to reveal.

ReferralModal (5H): fetches data fresh per open (`apiClient.getReferrals()` + `QRCode.toDataURL()` both run в `onMounted`), modal contents always visible when component mounted (Teleport at root, no internal hide). Parent v-if mount = visibility. Unmount on close = full teardown. Reopening = remount = fresh fetch.

Both lifecycles valid; choosing wrong one creates ceremony (defineExpose no-op) или regression (forced internal state breaks legacy parent). Lesson: pattern reuse = semantic adaptation, не mechanical mirror.

### 3.4 `defineExpose` skip rationale + augmentation reuse rule
**5H is the first sub-epic in Epic 5 series что reuses legacy modal без any augmentation.** ReferralModal.vue остаётся 288 lines, zero edits. Compare:

- 5B ConnectWallet: `defineExpose({ openModal })` augmentation в legacy file
- 5D CreateClan + ClanEdit: `defineExpose({ openModal })` + v2-aware navigation conditionals
- 5H ReferralModal: **0 augmentation** — pure consumption via lazy import + parent v-if

Validates "augmentation reuse rule" deeper variant: minimal touch isn't always 1-line — sometimes it's **0 lines**. Modal API (`emit('close')` + `<Teleport to="body">`) was already sufficient for parent-controlled lifecycle.

### 3.5 `shallowRef` для component instance
HudProfile.vue line 325: `const ReferralComp = shallowRef(null)`. Vue 3 best practice — component objects (returned from `import().default`) shouldn't be deeply reactive. `shallowRef` skips proxy wrapping for nested properties, avoiding overhead на large component definitions. Self-applied (not in ТЗ template) после grep'а ConnectWallet usage (`CWComp = shallowRef(null)`) — alignment с 5B precedent. 5H §5 расхождение #6 documents as improvement-not-divergence.

### 3.6 CSS file location refinement (Correction B)
ТЗ assumed `.ifv.wallet` rule в HudProfile.vue scoped style. Pre-flight Step 10 grep `^\.ifv\.wallet\b` returned 0 hits in HudProfile.vue, then broader `grep -rn "\.ifv" src/` found actual location: `src/styles/v24/profile.css`. `.ifv.wallet` block at lines 156-163. 5H `.ifv.referral` rule добавлен в same file (after `.ifv.wallet.disabled:hover`, before `.ifv.belt-value`) для structural consistency.

Pattern: legacy v2 styling lives в external `v24/*.css` files for cross-component reusability (e.g., `.id-field` selectors used by Identity card structure in HudProfile.vue). Scoped style blocks reserve для component-specific styling that won't leak. The Identity card field rules belong к external file — это правильное место architecturally.

### 3.7 5B semantic pattern reuse
**Core principle preserved:**
- Lazy import via `await import('@/components/fragments/profile/ReferralModal.vue')`
- `markRaw(mod.default)` to skip deep reactivity on Component object
- Dynamic `<component :is="ReferralComp" v-if="referralMounted">` host pattern
- Parent owns mount/unmount toggle

**Ceremony dropped:**
- `defineExpose({ openModal })` — not needed (no internal show flag)
- `await nextTick(); await nextTick(); ref.value?.openModal?.();` chain — not needed (mount = visible)
- Component ref attribute (`ref="referralRef"`) — not needed (no method call)

Result: simpler code, same architectural benefits (lazy chunk, no overhead when closed). Lesson #30 distillation.

### 3.8 Closes 5B-deferred carry-over
5B Sub-Epic FINAL_REPORT §7 Deferred #2 mentioned "referral shortcut" as candidate for future sub-epic. 5H closes this. Pattern: cross-sub-epic carry-over closure (3-sub-epic span: 5B → 5F MODAL_CONTENT cleanup → 5H Referral). Compares to 5F MODAL_CONTENT closure (which closed 5C/5D/5E §14 carry-overs — also 3-sub-epic span).

Carry-over closure metric: 5F closed 3 deferred items + 5G closed 1 (captain switch) + 5H closed 1 (referral) = **5 deferred items closed across 4 sub-epics**. Tracking discipline (FINAL_REPORT §7 lists) enables systematic closure.

### 3.9 First sub-epic без false-positive grep recovery
Step 4 9/9 checks PASS at first read — no count-vs-expected mismatches requiring locate-verification. Cumulative recoveries running tally:
- 5E: 4 (v-html / @@PART × 2 / @@PART step 11)
- 5F: 4 (MODAL_CONTENT × 2 / PhModal / @@PART hand-off doc)
- 5G: 1 (isCaptain count=2 in code+comment)
- 5H: **0**
- **Total: 9 across 4 sub-epics**

Significance: lesson #11 reflex working **as preventive** (Step 0 caught 2 corrections, scope was clean from start) — not just reactive (Step N false-positive recoveries). 5H proves the reflex extends beyond grep-count verification into **shape-vs-assumption upfront catching**. Pre-flight investment delivers compound returns.

### 3.10 Truncate logic для long logins
`referralLinkText` computed:
```js
const text = `hexlash.com/r/${login}`;
return text.length > 24 ? text.slice(0, 22) + '…' : text;
```

24-char threshold matches Wallet field truncation behavior visually (long Ethereum addresses truncate via parent `.ifv` ellipsis). Trade-off: ellipsis hides full URL on long logins (>10 chars), but the QR code in the modal contains full link. UX rationale: id-field row is preview, modal is full content.

## §4 Проверки

- **Pre-flight Step 0** → 2 corrections caught at zero-commit cost
- **Step 1 verify-only** → ReferralModal lifecycle confirmed (3 mount-on-demand criteria)
- **Step 2 build pass** — 47.86s
- **Step 3 visual sign-off** → user confirmed all 6 expected test cases (5th row + hover + click + lazy chunk + close + regression)
- **Step 4 → 9/9 automated checks PASS** — no false positives, first sub-epic в Epic 5 без recovery
- **Step 5 build pass** — 49.49s, +70 lines CLAUDE.md
- **Smoke regression** — VerifyEmailBanner (5F) / HelpModal (5F) / Captain switch (5G) / hub plinths / wallet field — all unchanged
- **Lazy chunk verification** — ReferralModal-*.js chunk only fetched on first Referral row click (DevTools Network tab)

## §5 Расхождения — осознанные

### 5.1 Vuetify `<v-progress-circular>` сохранён в legacy modal
Q3 augmentation reuse rule — don't touch unless visual breaks. Vuetify exists in v2 build via legacy components transitively. Modal QR loading spinner uses `<v-progress-circular size="40" indeterminate>`.

### 5.2 Hardcoded `https://hexlash.com/r/{login}` URL
Q4 — out of 5H scope. Env-var refactor (DEV vs PROD URL) is separate concern, deferred к infrastructure sub-epic.

### 5.3 Truncate logic 24 chars + ellipsis для long logins
UX consistency с Wallet row pattern. See §3.10.

### 5.4 ReferralModal `defineExpose` skip (vs ТЗ §Step 1 augmentation plan)
Pre-flight Correction A. Mount-on-demand pattern (data fetched fresh per open) ≠ ConnectWallet long-lived pattern. Validates lesson: 5B precedent применять **semantically** (lazy import + lazy mount), не **mechanically** (defineExpose-must-be-there). 5H-introduced refinement → Lesson #30.

### 5.5 CSS rule в `src/styles/v24/profile.css` (vs ТЗ assumed scoped style block)
Pre-flight Correction B. `.ifv.wallet` rule found в profile.css, mirror там же per consistency. ТЗ self-correction via lesson #11 reflex.

### 5.6 `shallowRef` для ReferralComp (vs `ref` в ТЗ template)
Vue 3 best practice для component instance refs, избегает deep reactivity overhead. Self-applied as improvement matching 5B (`CWComp = shallowRef(null)`), не divergence — alignment with precedent.

## §6 Уроки для 5I и далее

### Validated working patterns (5H apply)

- **#11 verify shape с реальным data** — 5H validated as **preventive mode**. Step 0 caught 2 ТЗ assumption errors (defineExpose unnecessary + CSS file location) before any code change. Step 4 returned 9/9 clean — first sub-epic без reactive recovery in running tally. Pattern works dual-mode: pre-write catch (Step 0) + post-write recovery (Step N).
- **#22 HUD scoped selector match** — applied для `.ifv.referral` через `.app-v2 .id-field` ancestor chain в profile.css. Validated.
- **5B ConnectWallet pattern** — semantic reuse validated (core principle preserved, ceremony dropped per target lifecycle).

### 5H-introduced patterns (5I+ can apply)

- **Augmentation reuse rule deeper variant — 0-line legacy touch** — 5H proved minimal touch isn't always 1-line. ReferralModal's existing `<Teleport to="body">` + `emit('close')` API was sufficient для parent-controlled v-if mount/unmount lifecycle. Pattern: assess legacy component's full API surface before deciding augmentation scope.
- **Mount-on-demand vs long-lived modal lifecycle distinction** — explicit categorization prevents wrong pattern force-fit. Mount-on-demand (data fresh per open): ReferralModal, future modals fetching data на mount. Long-lived (state persists across opens): ConnectWallet (connector list, address sticky).

### Lessons added (1 new — #30)

**#30 Pattern reuse — semantic vs mechanical** — when reusing precedent pattern (e.g., 5B ConnectWallet → 5H ReferralModal), distinguish core principle (lazy import + lazy mount) from ceremonial details (defineExpose + nextTick × 2 + ref method). Adapt to target component's actual lifecycle. Mechanical mirror leads к dead code (e.g., no-op `openModal` just for symmetry); semantic adaptation respects component's real needs. Lesson #11 specialization для cross-sub-epic pattern reuse.

### Lessons 1-29 inherited from 5A-5G + 5H adds #30

Total tally cumulative across Epic 5:
- **5A/5B/5C inherited:** 18 (lessons #1-18)
- **5D added:** 6 (#19-24) — exposure compensation focus
- **5F added:** 3 (#25-27) — TZ self-correction / delta preservation / cascade dead code
- **5G added:** 2 (#28-29) — bug-bundle / mirror real convention
- **5H added:** 1 (#30) — pattern reuse semantic vs mechanical
- **Total: 30 lessons documented across 8 sub-epics**

Pattern: Epic 5 is knowledge capture run as much as feature delivery. Each sub-epic после 5D adds refined understanding of codebase patterns + meta-process improvements.

## §7 Deferred list

| # | Item | Target |
|---|---|---|
| 1 | Optimistic UI для referral data fetch (current await) | 5G-style polish if decided |
| 2 | Toast notification на copy success (currently silent — `copied=true` reverts after 2s but no global toast) | Backend toast system OR 5L i18n if linked |
| 3 | Real-time invited friends list update (currently fetch-on-mount only) | WebSocket integration sub-epic |
| 4 | ReferralModal Vuetify migration — replace `<v-progress-circular>` с custom CSS spinner | If v2 drops Vuetify dependency entirely (separate scope) |
| 5 | Custom referral URLs / promo codes (backend feature) | Backend referral system enhancement |
| 6 | ReferralModal i18n (already uses `t.value.referral.lblTitle` — i18n keys exist, just preserve verbatim) | 5L i18n pass — no work needed для 5H, modal already i18n-ready |
| 7 | Long login truncation — current 24-char threshold may need adjustment based on real data distribution | UX polish if user reports issues |
| 8 | Referral analytics — track click-through, share success rates | Analytics sub-epic (Amplitude integration) |

## §8 Footer

**Sub-Epic 5H — CLOSED.** ✅

### Route table /v2/* (unchanged from 5G)

5H modifies HudProfile.vue + profile.css in-place; **no new routes**. All existing routes (`/v2`, `/v2/fd/*`, `/v2/fight`, `/v2/training`, `/v2/matchmaking`, `/v2/create`, `/v2/profile`, `/v2/ratings`, `/v2/clan`, `/v2/shop`) unchanged. ReferralModal accessible via Identity card 5th row click on `/v2/profile`.

### Эпик 5 §4.2 features progress

- After 5A-5E: 6/22 done
- After 5F: 9/22 done (+3 — Verify email / Help overlay / MODAL cleanup)
- After 5G: 10/22 done (+1 — Captain switch)
- **After 5H: 11/22 done (+1)** — Referral QR #8: ❌ Missing → ✅ Done
- Remaining: 5/22 partial + 6/22 missing

### Key metrics

- **Коммитов:** 1 functional + 1 CLAUDE.md + 1 FINAL_REPORT (this) + 1 HANDOFF_5I (Step 7) = **4 total**
  - Step 0: pre-flight only (no commit)
  - Step 0.5: skipped (no commit)
  - Step 1: skipped (verify-only, no commit)
  - Step 2: `7933105` — lazy ReferralModal host + Identity Referral row
  - Step 3: skipped (visual sign-off)
  - Step 4: skipped (verify-only, all PASS)
  - Step 5: `8c989b1` — CLAUDE.md
  - Step 6: `<step 6>` — FINAL_REPORT
  - Step 7: `<step 7>` — HANDOFF_5I
- **Новых файлов:** 0 (smallest sub-epic в Эпике 5)
- **Augmented:** 0 (legacy ReferralModal untouched)
- **Reused as-is:** 5 (apiClient endpoint + qrcode lib + clipboard/share APIs + ReferralModal full body + ProfileView legacy still working)
- **Изменённых:** 2 (HudProfile.vue +40 / profile.css +6)
- **Удалённых:** 0
- **Добавленных строк:** ~46 в source (HudProfile + profile.css) + 70 (CLAUDE.md) + ~270 (FINAL_REPORT this) = ~386 total
- **Расхождений:** 6 (§5.1-5.6) — 3 from ТЗ template + 3 from pre-flight corrections
- **Новых уроков:** 1 (#30 Pattern reuse — semantic vs mechanical)
- **Deferred carry-over:** 8 items distributed (5G-style polish × 1, 5L i18n × 1, backend × 3, infra/analytics × 3)

### Hot-fix narrative metric

**0 hot-fix attempts на ложной траектории.** Continues 5E/5F/5G precedent — **4-streak** (5E + 5F + 5G + 5H all 0 hot-fix).

Compare:
- 5A: 0 hot-fixes
- 5B: 1 hot-fix (ConnectWallet display:none discovery → урок #23)
- 5C: 1 hot-fix mid-epic
- 5D: 5 hot-fix attempts Step 5 (before correct port discovery) + 2 augmentation hot-fixes (Steps 7+8) = 7 unplanned commits → lessons #19-24
- 5E: 0 unplanned hot-fixes
- 5F: 0 unplanned hot-fixes (3 blockers caught pre-Step 1 via lesson #11 reflex)
- 5G: 0 unplanned hot-fixes (2 ТЗ corrections caught pre-Step 1; 1 false-positive recovery Step 4)
- **5H: 0 unplanned hot-fixes** (2 ТЗ corrections caught pre-Step 1; **0 false-positive recoveries Step 4** — first sub-epic без reactive recovery)

**4-streak** confirms preventive Lesson #11 application discipline. Pre-flight Step 0 investment delivers compound returns: structural issues caught at zero-commit cost, scope clean from start, Step 4 verify trivial.

### Bundle impact

5H: **1 new lazy chunk** + minor existing chunk growth.
- ReferralModal lazy chunk (~5-8kB raw / ~2kB gzip post-minification, includes qrcode lib reference) — fetched on first Referral row click
- HudProfile lazy chunk grows ~1kB raw from added imports + handler code (small)
- profile.css inlined в main `index.css` chunk через `@import` Vite не chunk-splits — +6 lines / ~150 bytes

Net 5H addition: ~7-9kB raw / ~2.5kB gzip к user-fetched payload при первом visit `/v2/profile` + клик Referral row.

### Transition к 5I

Следующий sub-epic per VISUAL_MIGRATION plan: 5I TBD. Pre-flight план для нового чата — `docs/visual-migration/HANDOFF_EPIC5_5I_CHAT_HANDOFF.md` (Step 7).

**Designated branch для 5I run:**
- Continue current `claude/setup-5e-shop-mode-a-khIAi` (5E+5F+5G+5H stack pattern) если harness designation unchanged, ИЛИ
- New `claude/*` slug if harness provides one. Verify branch via `git branch --show-current` + сверить recent commits против 5H CLOSED state (hashes `8c989b1` Step 5 CLAUDE.md + `<step 6>` Step 6 FINAL_REPORT + `<step 7>` Step 7 HANDOFF должны присутствовать в history).

### Carry-over для 5I consideration

Per audit gap matrix (§4.2 progress 11/22), top remaining items:
- **Medium candidates** (single-feature sub-epics): AutoFight toggle (#22), Spectate flag (#4), Social tasks (#11), AI Trainer port в v2 ResultOverlay (#12), Challenges notification panel (#6), FightClub level + Morning Report (#14), Retirement (#15)
- **Polish batch** (5I as cleanup): HudClan splitting (430 lines), ClanScene mood tune, ClanActivityFeed integration, 5F banner dismiss persistence, 5E floor concrete texture restore, 5E dust yMax extension, 5G optimistic UI captain swap, 5H referral data optimistic
- **Big sub-epics** (отдельные runs): i18n (#19, defer last), Auth entry sub-scene (#1), Onboarding tour (#21), MoveTree/DeckBuilder (#16)

**5H pattern для 5I consideration:** if 5I picks single feature with augmentation reuse via legacy modal/component, lesson #30 applies — assess lifecycle (mount-on-demand vs long-lived) before mechanical 5B mirror. Augmentation reuse rule's "0-line touch" variant is option when target API already sufficient.

---

**End of Sub-Epic 5H Final Report.**
