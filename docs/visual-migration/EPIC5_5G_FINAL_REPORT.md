# Sub-Epic 5G — Captain Switch UI — Final Report

**Date closed:** 2026-04-28
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued from 5E + 5F — same harness slug)
**Predecessor:** 5F ✅ CLOSED (`fb3b370`)
**Commit range:** `d0bcbed` (Step 1) → `<step 6>` (Step 6, this)

---

## §1 Шаги и коммиты

| Step | Commit | Что |
|---|---|---|
| 0 | (pre-flight only) | 2 ТЗ corrections caught at zero-commit cost (`.fd-top-bar` non-existence + fd CSS file non-existence). Plus position `absolute` → `fixed` mirror correction noted via pre-edit grep |
| 0.5 | (skipped) | Branch slug — continue current `claude/setup-5e-shop-mode-a-khIAi` (5F precedent) |
| 1 | `d0bcbed` | epic5-5g: step 1 — kicker bug fix + set-captain btn/badge stub |
| 2 | `65a1d6e` | epic5-5g: step 2 — set-captain btn + captain-badge CSS |
| 3 | (skipped) | Visual sign-off — verify only, user closed |
| 4 | (verify-only) | 10 automated checks PASS — no fix commit |
| 5 | `ebeb2ef` | epic5-5g: step 5 — CLAUDE.md Sub-Epic 5G section |
| 6 | `<step 6>` | epic5-5g: step 6 — EPIC5_5G_FINAL_REPORT.md |
| 7 | `<step 7>` | epic5-5g: step 7 — HANDOFF_EPIC5_5H_CHAT_HANDOFF.md |

## §2 Файлы

### Созданы (0)
5G не создаёт новых файлов — feature implementation in-place в HudFighterDetail.vue (template + script + scoped style block).

### Augmented (0)
No legacy component augmentation needed — backend `agent/setCaptain` action ready, hub auto-refresh via Epic 4 Step 5.5 watcher.

### Reused as-is (3)
- `agent/setCaptain` Vuex action (`src/core/state/modules/agentState.js:110-113`) — `apiClient.put('/agent/:id/captain')` + auto-refetch via `dispatch('fetchAgents')`. No service file abstraction (direct apiClient call в action body).
- CanvasLayer watcher (`src/scene/CanvasLayer.vue:105-118`) — `watch(() => store.getters['agent/agentsList'], (newList) => pit.refreshFighters({captain, secondAgent}))`. Auto-fires on dispatch cascade.
- `agentData` prop binding (`src/views-v2/FighterDetailView.vue:5`) — already exposes `isCaptain` flag через real agent data (UUID path → `fetchAgent` → currentAgent → agentData).

### Изменены (1)
- `src/components/hud/HudFighterDetail.vue` (+102 / -1) — kicker bug fix + btn/badge template + `useStore` import + `settingCaptain` ref + `onSetCaptain` handler + scoped CSS rules (.set-captain-btn + .captain-badge + mobile @media)

### Удалены (0)

## §3 Технические детали

### 3.1 Investigation-driven scope expansion (kicker bug discovery)
Pre-spec investigation (read-only grep run before ТЗ write) surfaced kicker bug в HudFighterDetail.vue line 127-128: `if (props.agent) return 'Captain · ' + capArch(props.agent.primaryModule)` — **every** real agent shown с "Captain · " prefix regardless of `isCaptain` flag. Found alongside Step 5 (existing buttons grep) — adjacent to 5G's own scope (same file, captain system focus). Decision: **bundle 1-line fix с 5G Step 1**, не deferred к polish run отдельным commit'ом. Pattern: when investigation finds adjacent bug в same file/scope, bundle if low-risk single-line fix.

Alternative considered: separate sub-epic 5G' для bug fix only (1-commit). Rejected — too granular, scope-coherent с 5G captain system focus.

### 3.2 TZ self-correction via pre-flight (Step 0)
Lesson #11 reflex caught 2 ТЗ assumption errors at zero-commit cost:

- **`.fd-top-bar` wrapper non-existence** — ТЗ §Step 1 (b) markup spec assumed `<div class="fd-top-bar"><button class="back-btn">...</button>...</div>` flex container. Pre-flight grep `fd-top-bar|back-btn` returned only `back-btn` line 7 (direct child of `.detail-hud`, no wrapper). Resolved per Correction 1 (a): place btn/badge as **direct sibling of `.back-btn`**, mirroring existing absolute-positioned convention.
- **fd CSS file non-existence** — ТЗ §Step 2 referenced `src/styles/v24/fighterDetail.css`. Pre-flight `ls src/styles/v24/` returned no `fd*`/`fighter*`/`detail*` file. CSS lives **inline в HudFighterDetail.vue scoped style block** (where `.back-btn` already styled, line 241+). Resolved per Correction 2 (a): add 5G rules to scoped style block, drop hexlash-v24.css `@import`.

Both surfaced + reported to user before any Step 1 code change. User confirmed resolutions. **3rd ТЗ self-correction precedent в Epic 5** (after 5F's 3 blockers + 5G's 2 corrections — pre-flight pattern stable across 5 sub-epic streak).

### 3.3 `position: fixed` vs ТЗ-suggested `absolute`
ТЗ §Step 2 reminder used `position: absolute; top: 14px; right: 14px;` для new btn/badge. Pre-edit grep verified `.back-btn` actual rule:
```css
.back-btn {
  position: fixed;
  top: 14px; left: 14px;
  ...
  z-index: 60;
}
```
**Codebase reality** uses `fixed` (viewport-anchored). To **truly mirror** the back-btn convention (Q1 placement decision), 5G btn/badge use `position: fixed` + `z-index: 60` (matching exactly). Both visually equivalent at 14px top placement (no scroll context where they'd differ), but `fixed` matches existing pattern documented в file. Lesson #11 reflex: verify shape, не follow user phrasing literally when reality differs. Documented as Расхождение #7.

### 3.4 Cascade Epic 4 Step 5.5 reuse
Epic 4 Step 5.5 wired hub auto-refresh via `CanvasLayer.vue:105-118`:
```js
stopAgentsWatch = watch(
  () => store.getters['agent/agentsList'],
  (newList) => {
    const cap = newList.find((a) => a.isCaptain) || null;
    const second = cap ? (newList.find((a) => !a.isCaptain) || null) : null;
    pit.refreshFighters({ captain: cap, secondAgent: second });
  },
);
```
5G `onSetCaptain` dispatches `agent/setCaptain` → action calls `dispatch('fetchAgents')` → state.agents updates → `agentsList` getter recomputes (sorted captain-first via `agentState.js:23` comparator) → watcher fires → `pit.refreshFighters` re-renders both slots. **Zero manual refresh code в 5G** — existing infra picks up cascade automatically. Pattern: when adjacent epic provides reactive infra, lean on it rather than duplicate dispatch consumption.

### 3.5 `agent/setCaptain` action signature
```js
async setCaptain({ dispatch }, agentId) {
  await apiClient.put(`/agent/${agentId}/captain`, {}, { authRequired: true });
  await dispatch('fetchAgents');
}
```
Single string parameter (`agentId`). PUT `/agent/:id/captain` with empty body. On success, refetches full agents list (which auto-triggers PitScene refresh per §3.4). No service file abstraction — direct apiClient call в action body. 5G handler simply does `await store.dispatch('agent/setCaptain', props.agent.id)`.

### 3.6 Q1-Q7 decisions summary
| Q | Decision | Reasoning |
|---|---|---|
| Q1 — Btn placement | `.back-btn` mirror right edge | Persistent visibility, не scroll-tied (preserves existing absolute-positioned convention) |
| Q2 — Already-captain UI | Replace btn с non-clickable badge | Передаёт state visually + semantically (pink-tinted = primary brand). Avoids disabled-ugly state |
| Q3 — Legacy mocks (agent===null) | Hide btn+badge via `v-if="props.agent"` | Mock keys (warden/predator) have no real id для dispatch endpoint |
| Q4 — Confirmation flow | Direct dispatch, no ConfirmModal | Reversible action vs 5D ClanLeave destructive precedent |
| Q5 — Error UX | console.error only | No toast system в v2 — не fabricate. Audit confirmed |
| Q6 — Loading UX | opacity 0.6 + pointer-events:none | ~300-500ms call too short для spinner |
| Q7 — Optimistic vs await | Await before badge change | Simpler, no revert logic; polish optional в next sub-epic |

### 3.7 Z-index pairing (60)
`.back-btn` z-index: 60. New `.set-captain-btn` + `.captain-badge` set explicit `z-index: 60` для consistent layering. Prevents btn/badge from sliding under scene canvas (z-index baseline) or under VerifyEmailBanner (z-index 86, but banner pushes top-bar down — different concern). Mirror parity = predictable layout.

### 3.8 Vue `<template v-if>` guard
Used `<template v-if="props.agent">` wrapping both badge (`v-if="props.agent.isCaptain"`) and btn (`v-else`). The outer template guard hides whole block when agent is null (legacy mocks). Inner v-if/v-else split ensures **exactly one** of badge/btn renders for real agents — no flicker, no transitional state. Vue idiomatic pattern для mutually exclusive UI variants based on data shape.

### 3.9 Reactive class binding for busy state
`:class="{ busy: settingCaptain }"` + `:disabled="settingCaptain"` — dual-bound. CSS `.busy` modifier sets opacity: 0.6 + pointer-events: none + cursor: default; HTML `disabled` blocks click natively. Both cover the same window (~300-500ms during dispatch). After `await` completes, `settingCaptain.value = false` reverts both. No state leak on error (try/catch/finally).

### 3.10 Lesson #11 reflex — 9th false-positive recovery
Step 4 Check 1 raw count = 2 (expected 1 per ТЗ). Pre-Step-1 reflex applied: locate hits → both в kicker block, one in code (`return props.agent.isCaptain`) + one in explanatory comment ("respect isCaptain flag"). Both legitimate. Running tally across Epic 5 sub-epics:

| Sub-Epic | False-positive recoveries | Locations |
|---|---|---|
| 5E | 4 | v-html / @@PART × 2 / @@PART step 11 |
| 5F | 4 | MODAL_CONTENT × 2 / PhModal / @@PART hand-off doc |
| 5G | 1 | isCaptain comment vs code (Step 4 Check 1) |
| **Total** | **9** | Pattern reflex stable across 5+ sub-epic streak |

## §4 Проверки

- **`node --check`** не применим к .vue файлам — verified через `npm run build` каждый шаг
- **`npm run build`** — pass на 4 commits + closing:
  - Step 1: 52.24s (Vite cache warm from 5F continuous run)
  - Step 2: 1m 8s (cold cache after pause)
  - Step 5: 33.62s (hot cache, fastest 5G build)
  - Step 6 (this): TBD post-commit
- **Grep sanity:**
  - Stale references (MODAL_CONTENT/PhModal in HudFighterDetail.vue) — 0 ✓
  - Captain-related selectors — 10 (8 set-captain-btn + 4 captain-badge across template + 7 CSS rules)
  - Lesson #11 false-positive recovery — 1 (isCaptain count=2 in Step 4 Check 1, both legitimate)
- **Pre-commit Step 4 checklist** — 10/10 PASS:
  1. Kicker bug fix (`isCaptain` conditional in computed)
  2. Set-as-Captain btn template
  3. Captain badge template
  4. `v-if="props.agent"` Q3 guard
  5. `agent/setCaptain` dispatch wired
  6. `settingCaptain` ref + bindings (6 occurrences)
  7. CSS rules in HudFighterDetail.vue scoped style (per Correction 2, 10 selectors)
  8. urok #11 — false-positive recovered (count=2, both legitimate)
  9. urok #5 — N/A (no scene mount/unmount in 5G)
  10. Build pass
- **Visual verify Step 3** — user signed off (legacy mock environment validates btn/badge correctly hidden via `v-if`)
- **Smoke test** — fighter clicks /v2/fd/:id navigation works (Epic 4 Step 6 dynamic FD path), real agent paths cascade through `fetchAgent` → currentAgent → `agentData` prop

## §5 Расхождения — осознанные

### 5.1 Kicker bug fix bundled (NEW PATTERN)
Single-line fix bundled с 5G Step 1, не отдельный sub-epic. Investigation-driven: bug discovered alongside captain system grep, scope-related (same file, captain system focus). Pattern: when investigation finds adjacent bug в same file/scope, bundle if low-risk single-line fix.

### 5.2 No ConfirmModal — direct dispatch
Q4 decision: reversible action vs 5D ClanLeave destructive precedent. ConfirmModal reserved для irreversible operations.

### 5.3 No optimistic UI — await before badge change
Q7 decision: simpler, no revert logic. Polish optional later (5H/5G' candidate если ever needed).

### 5.4 No toast notification on success
No toast system в v2 (audit confirmed). console.error only on failure path. 5L i18n / future toast system port — separate scope.

### 5.5 No spinner during dispatch
Q6 decision: ~300-500ms call too short для spinner UX. Opacity 0.6 + pointer-events:none + scale(0.97) on click communicates "busy" sufficiently.

### 5.6 Legacy mocks excluded via `v-if="props.agent"`
warden/predator inline mocks (`agent === null`) have no real id для dispatch endpoint. Btn+badge wrapped в outer `<template v-if>` guard.

### 5.7 `position: fixed` (mirror `.back-btn`) vs ТЗ-suggested `absolute`
Pre-edit grep showed `.back-btn` uses `position: fixed; z-index: 60`. To truly mirror convention (Q1 intent), 5G btn/badge use `fixed` instead of `absolute`. Lesson #11 reflex applied — verify shape with real codebase, не trust ТЗ phrasing literally when reality differs.

### 5.8 `.fd-top-bar` wrapper non-existence (ТЗ self-correction)
ТЗ §Step 1 (b) markup assumed `<div class="fd-top-bar">` wrapper. Pre-flight grep verified: no such wrapper. `.back-btn` is direct child of `.detail-hud`, positioned `fixed top:14px left:14px`. 5G btn/badge added as same-level sibling. Resolution per Correction 1 (a) — minimal change, mirrors existing convention.

### 5.9 fd CSS file non-existence (ТЗ self-correction)
ТЗ §Step 2 referenced `src/styles/v24/fighterDetail.css`. Pre-flight verify: no such file. CSS lives inline в HudFighterDetail.vue scoped style block (consistent с `.back-btn`). 5G rules added к scoped block. Drop hexlash-v24.css `@import` (not needed). Resolution per Correction 2 (a).

## §6 Уроки для 5H и далее

### Validated working patterns (5G apply)

- **#5 strict teardown order** — N/A для 5G (no scene mount/unmount; CSS-only feature in existing HUD). Will re-apply в 5H/5I if new scene introduced.
- **#11 verify shape с реальным data** — applied 8+ times running tally (4 в 5E + 4 в 5F + 1 в 5G). Pattern reflex-level. 5G validated 3 specific applications: investigation pre-spec (kicker bug discovery), pre-flight Step 0 (2 ТЗ assumption errors), Step 4 false-positive recovery (isCaptain count=2 in comment+code).
- **#18 STOP tuning + START structural inspection** — N/A для 5G (no visual mismatches; Step 3 sign-off clean).
- **#22 HUD scoped selector match** — applied для `.set-captain-btn` + `.captain-badge` в HudFighterDetail.vue scoped style block (file-scoped style, applies через `.app-v2` parent in DOM hierarchy). Validated.

### 5G-introduced patterns (5H+ can apply)

- **Bug-bundle in scope** — investigation findings (e.g., kicker bug в case 5G) могут быть scope-extended если изначальный focus area touches the file. Single-line fix bundled с 5G — не deferred к polish run. Pattern для future investigation-driven sub-epics: when grep finds adjacent bug, bundle if low-risk single-line.
- **Mirror real convention** — when ТЗ phrasing differs from codebase reality (e.g., ТЗ said `position: absolute`, codebase uses `fixed`), pre-edit grep wins. Verify shape реальной реализации, не trust ТЗ verbatim. Lesson #11 specialization для CSS/markup conventions.
- **Cascade infra reuse** — Epic 4 Step 5.5 watcher means 5G не нужно manual refresh code; existing infra handles cascade. Pattern: when adjacent epic provides reactive infra, lean on it rather than duplicate dispatch consumption.
- **Investigation-driven scope expansion** — pre-spec investigation findings drive ТЗ scope extension. Found kicker bug + Q1-Q7 closing all done in single TZ write before any commits. Reduces mid-run hot-fix risk.

### Lessons added (2 new)

- **Bug-bundle in scope** (5G-introduced) — see §5.1.
- **Mirror real convention** (5G-introduced) — Lesson #11 specialization для structural details. See §5.7.

### Lessons 1-24 inherited from 5A-5F (distilled)

1. Git log verify before finals
2. DOM HUD vs 3D raycast — оба path grep'нуть
3. masterModel vs UserModel asymmetry (Date wrapping)
4. Vuex action dispatch vs direct call (multi-step atomic)
5. Lazy scene pattern — default для v2 sub-scenes
6. 5A helper reuse — mandatory grep first
7. Lazy modal + defineExpose augment
8. Hot-fix mid-epic приемлем, multi-part норма
9. Preemptive edit-split для файлов >100 строк
10. HUD line count soft-300 — splitting candidate
11. **Shape assumptions в ТЗ require pre-verification (5G: 3 applications в run; 9th cumulative recovery)**
12. v2 HUD components MUST own pointer-events reset
13. Prototype values require target-hardware retuning
14. ТЗ HUD markup specs обязаны включать canonical Vue scaffolding
15. SPEC import paths must cite real precedent verbatim
16. Visual readability is multi-factor — first check renderer exposure
17. Visual issue first move = literal diff against working precedent
18. 2 failed visual tunes → STOP tuning, START structural inspection
19. Exposure compensation FIRST при port'е prototype scenes (N/A для 5G)
20. Renderer settings delta как primary diagnostic (N/A для 5G)
21. Cone-angle adjustments в exposure compensation toolkit (N/A для 5G)
22. Pre-commit grep для HUD scoped style — selector ↔ template root match
23. display:none на lazy modal host pattern — conditional на legacy template
24. Augmentation grep router.push в legacy file
25. **TZ self-correction via pre-flight (5F-introduced, 5G validated)** — surface assumption errors ДО Step 1 write
26. **Delta preservation для adaptation (5F-introduced)** — extract delta, не copy value blindly
27. **Cascade dead code discovery (5F-introduced)** — dependent infrastructure may be cascade-removable
28. **Bug-bundle in scope (5G-introduced)** — investigation-driven adjacent bug fix bundling
29. **Mirror real convention (5G-introduced)** — pre-edit grep over ТЗ phrasing for structural details

## §7 Deferred list

| # | Item | Target |
|---|---|---|
| 1 | Optimistic UI polish — current await before badge change; revert logic if optimistic ever needed | 5H or later polish (Q7 deferred decision) |
| 2 | Toast notification system — для success/error feedback (currently console.error only on fail) | Backend toast infra sub-epic OR 5L i18n if linked |
| 3 | Legacy mock id resolution — if ever ship real warden/predator UUIDs, btn/badge would activate | Legacy data wiring sub-epic (low priority) |
| 4 | Captain badge i18n — currently inline EN "✓ Captain" | 5L i18n pass |
| 5 | "Set as Captain" btn label i18n | 5L i18n pass |
| 6 | Captain switch confirmation modal — Q4 deferred; if future destructive captain swap policy emerges | Backend captain-system sub-epic if scope expands |
| 7 | Spinner UX during dispatch — Q6 deferred; if dispatch latency grows beyond 500ms | 5H polish if needed |
| 8 | Hub-side captain visual transition — current snap swap via PitScene.refreshFighters; smooth crossfade would be polish | 5G' polish если decided |

## §8 Footer

**Sub-Epic 5G — CLOSED.** ✅

### Route table /v2/* (unchanged from 5F)

5G modifies HudFighterDetail.vue in-place; **no new routes**. All existing routes (`/v2`, `/v2/fd/*`, `/v2/fight`, `/v2/training`, `/v2/matchmaking`, `/v2/create`, `/v2/profile`, `/v2/ratings`, `/v2/clan`, `/v2/shop`) unchanged.

### Эпик 5 §4.2 features progress

- After 5A-5E: 6/22 done
- After 5F: 9/22 done (+3)
- **After 5G: 10/22 done (+1)** — Captain switch UI #18: 🟡 Partial → ✅ Done
- Remaining: 5/22 partial + 7/22 missing

### Key metrics

- **Коммитов:** 2 functional + 1 CLAUDE.md + 1 FINAL_REPORT (this) + 1 HANDOFF_5H (Step 7) = **5 total**
  - Step 0: pre-flight only (no commit)
  - Step 0.5: skipped (no commit)
  - Step 1: `d0bcbed` — kicker fix + btn/badge stub
  - Step 2: `65a1d6e` — CSS
  - Step 3: skipped (visual sign-off)
  - Step 4: skipped (verify-only, all PASS)
  - Step 5: `ebeb2ef` — CLAUDE.md
  - Step 6: `<step 6>` — FINAL_REPORT
  - Step 7: `<step 7>` — HANDOFF_5H
- **Новых файлов:** 0 (in-place modification)
- **Augmented:** 0
- **Reused as-is:** 3 (`agent/setCaptain` action, CanvasLayer watcher, agentData prop binding)
- **Изменённых:** 1 (HudFighterDetail.vue +102/-1)
- **Удалённых:** 0
- **Добавленных строк:** ~102 в HudFighterDetail + 72 (CLAUDE.md) + ~290 (FINAL_REPORT this) = ~464 total
- **Расхождений:** 9 (§5.1-5.9)
- **Новых уроков:** 2 (Bug-bundle in scope, Mirror real convention) — both Lesson #11 specializations
- **Deferred carry-over:** 8 items distributed (5L i18n × 2, 5H polish × 3, backend sub-epic × 2, legacy data × 1)

### Hot-fix narrative metric

**0 hot-fix attempts на ложной траектории.** Continues 5E/5F precedent — **third consecutive sub-epic в Epic 5 без unplanned hot-fixes.**

Compare:
- 5A: 0 hot-fixes
- 5B: 1 hot-fix (ConnectWallet display:none discovery → урок #23)
- 5C: 1 hot-fix mid-epic
- 5D: 5 hot-fix attempts Step 5 (before correct port discovery) + 2 augmentation hot-fixes (Steps 7+8) = 7 unplanned commits → lessons #19-24
- 5E: 0 unplanned hot-fixes
- 5F: 0 unplanned hot-fixes (3 blockers caught pre-Step 1 via lesson #11 reflex)
- **5G: 0 unplanned hot-fixes** (2 ТЗ corrections caught pre-Step 1; 1 false-positive recovery Step 4 — both lesson #11 reflex)

3-streak без hot-fixes confirms reflex-level pattern adherence. Pre-flight investment continues paying compound interest.

### Bundle impact

5G: **0 new bundle chunks.** Feature implementation in-place — `+102` lines к existing HudFighterDetail.vue. Affects only the FighterDetailView lazy chunk. Expected delta minimal (~3-4kB raw / ~1kB gzip post-minification), не measured separately due to in-place modification.

### Transition к 5H

Следующий sub-epic per VISUAL_MIGRATION plan: 5H TBD. Pre-flight план для нового чата — `docs/visual-migration/HANDOFF_EPIC5_5H_CHAT_HANDOFF.md` (Step 7).

**Designated branch для 5H run:**
- Continue current `claude/setup-5e-shop-mode-a-khIAi` (5E+5F+5G stack pattern) если harness designation unchanged, ИЛИ
- New `claude/*` slug if harness provides one. Verify branch via `git branch --show-current` + сверить recent commits против 5G CLOSED state (hashes `ebeb2ef` Step 5 CLAUDE.md + `<step 6>` Step 6 FINAL_REPORT + `<step 7>` Step 7 HANDOFF должны присутствовать в history).

### Carry-over для 5H consideration

Per audit gap matrix (§4.2 progress), top remaining items:
- **Medium candidates** (single-feature sub-epics): AutoFight toggle (#22), Spectate flag (#4), Social tasks (#11), AI Trainer port в v2 ResultOverlay (#12), Challenges notification panel (#6), Referral QR (#8)
- **Polish batch** (5H as cleanup): HudClan splitting (430 lines), ClanScene mood tune, ClanActivityFeed integration (clan fragments group), 5F banner dismiss persistence, 5E floor concrete texture restore, 5E dust yMax extension
- **Big sub-epics** (отдельные runs): i18n (#19, defer last), Auth entry sub-scene (#1), Onboarding tour (#21), MoveTree/DeckBuilder (#16), Retirement (#15), FightClub level + Morning Report (#14)

---

**End of Sub-Epic 5G Final Report.**
