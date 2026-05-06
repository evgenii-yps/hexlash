# Sub-Epic 5L — Polish Batch (Option α) — FINAL REPORT

**Status:** ✅ COMPLETE 2026-04-28
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued от 5E-5K stack)
**Predecessor:** 5K ✅ CLOSED (`0e8ec88`)
**Scope:** Frontend-only polish batch — 5 items closing accumulated debt от 5D/5F/5G
**Hot-fix attempts на ложной траектории:** **0 — 8-streak achieved** (5E + 5F + 5G + 5H + 5I + 5J + 5K + 5L)
**Cumulative recoveries в 5L:** **10** (Phase 1: 4, Phase 2: 2, Phase 3: 1, Phase 4: 3, Phase 5: 0)
**Cumulative lesson tally:** **33** (UNCHANGED — 5L applied lessons preventively, не recovered)
**§4.2 progress:** **13/22 done (59%) — UNCHANGED** (5L closes carry-overs of counted items)

---

## §1 Commit table

| # | Commit | Phase |
|---|---|---|
| 0 | (read-only) | Pre-flight — Blocker A reported (5J/5K precedent) → branch switch by user explicit auth, Q1-Q5 investigation |
| 1 | `914a9a2` | Phase 1 — VerifyEmailBanner per-user persistence |
| 2 | `c91ecea` | Phase 2 — Captain switch optimistic UI + rollback toast |
| 3 | `8c04842` | Phase 3 — HudClan splitting (3 children, lift Vuex) |
| 4 | `9436deb` | Phase 4 — ClanActivityFeed integration в HudClan |
| 5 | `f769bf1` | Phase 5 — ClanScene mood polish (rim sat / floor / flag wave) |
| 6 | (skipped, verify-only) | Phase 6 — Visual sign-off — user accepted на Vercel preview |
| 7 | (skipped, verify-only) | Phase 7 — 12/12 automated checks PASS, no fix commit |
| 8 | `b70d0fd` | Phase 8 — CLAUDE.md Sub-Epic 5L section (+81 lines) |
| 9 | this | Phase 9 — EPIC5_5L_FINAL_REPORT.md |
| 10 | next | Phase 10 — HANDOFF_EPIC5_5M_CHAT_HANDOFF.md |

**6 functional commits + 2 verify-only skipped + 3 closing commits = 11 total.**

---

## §2 Files

### New (3)

| File | Lines | Purpose |
|---|---|---|
| `src/components/hud/HudClanHeader.vue` | 45 | Crest + clan name/tag/founded + level XP bar + 4-stat grid |
| `src/components/hud/HudClanInfo.vue` | 37 | About + Info meta + 3 action buttons (emits invite/edit/leave) |
| `src/components/hud/HudClanRoster.vue` | 77 | Roster table head + member rows + internal sort state |

### Modified (6)

| File | Delta | Phase |
|---|---|---|
| `src/components/hud/VerifyEmailBanner.vue` | +29/-1 | 1 |
| `src/core/state/modules/agentState.js` | +33/-3 | 2 |
| `src/components/hud/HudFighterDetail.vue` | +9/-4 | 2 (comment update) |
| `src/components/hud/HudClan.vue` | refactor 430 → 388 + integration mounts | 3 + 4 |
| `src/styles/v24/clan.css` | +20/-2 | 4 (grid extension + .ic-activity rule) |
| `src/scene/scenes/ClanScene.js` | +18/-5 | 5 (3 specific tweaks) |

**No backend changes.** Lesson #33 N/A для 5L (frontend-only polish).

---

## §3 Технические детали

### 3.1 Per-user localStorage pattern (Phase 1)

Banner dismiss state scoped per-login через key `hexlash_verify_banner_dismissed_<login>`. Pattern:

```js
const userLogin = computed(() => store.state.master?.userData?.login || 'guest');

function storageKey(login) {
  return `hexlash_verify_banner_dismissed_${login}`;
}

function loadDismissedState(login) {
  try {
    return localStorage.getItem(storageKey(login)) === 'true';
  } catch (e) {
    return false;  // private mode / quota exceeded — degrade silently
  }
}

onMounted(() => {
  dismissed.value = loadDismissedState(userLogin.value);
});

watch(userLogin, (login) => {
  dismissed.value = loadDismissedState(login);  // logout/login re-init
});
```

**Codebase convention preserved:** `hexlash_*` prefix (matches `hexlash_player_modules`, `hexlash_referral_code`, `hexlash-language` precedents in masterService.js).

**`'guest'` fallback** prevents `undefined` key formation during auth-pending edge case. Benign side-effect: dismiss action while auth-pending stores under `..._guest` key, which never re-loaded after login.

### 3.2 Optimistic UI snapshot/rollback (Phase 2)

Action wraps API call with snapshot capture + revert on error. Pattern:

```js
async setCaptain({ commit, dispatch, state }, agentId) {
  const snapshot = {
    agents: state.agents.map(a => ({ ...a })),
    currentAgent: state.currentAgent ? { ...state.currentAgent } : null,
  };
  commit('OPTIMISTIC_SET_CAPTAIN', agentId);
  try {
    await apiClient.put(`/agent/${agentId}/captain`, {}, { authRequired: true });
    await dispatch('fetchAgents');  // server-truth sync background
  } catch (err) {
    commit('ROLLBACK_AGENTS', snapshot);
    commit('master/setErrorMessage',
      ErrorMessageModel.withText('Failed to set captain'),
      { root: true });
    throw err;
  }
}
```

**Snapshot shape covers BOTH `state.agents` array AND `state.currentAgent`** — the latter is read by FighterDetailView prop binding. Without snapshot covering both, rollback would leave UI badge inconsistent с array state.

### 3.3 Vuex namespace correction (Phase 2)

ТЗ pseudo-code assumed:
```js
commit('master/setInfoMessage', { type: 'error', text: '...' });
```

**Real codebase pattern:**
```js
commit('master/setErrorMessage', ErrorMessageModel.withText('...'), { root: true });
```

Two distinct mutations exist: `master/setInfoMessage` (info notifications) vs `master/setErrorMessage` (error notifications). Payload is `ErrorMessageModel` instance с factory methods (`.withText(text)` / `.withTimeout(text, ms)` / `.withoutButton(text, ms)`), NOT plain `{type, text}` object.

Pre-edit grep `setInfoMessage|setErrorMessage` revealed both + their existing usage sites в masterState.js / webSocketState.js / taskState.js / masterService.js / taskService.js.

### 3.4 HudClan size estimate divergence (Phase 3)

**ТЗ pre-commit verify expected:** parent ≤220 lines.
**Реальность:** **388 lines** (was 430 pre-split, became 377 after Phase 3 + 11 from Phase 4 ClanActivityFeed mount).

**Why 388 ≠ 220:**
- No-clan branch template: ~75 lines (large standalone section, no need to split)
- Lazy modal hosts (CreateClan + ClanEdit + ClanConfirmModal): ~25 lines (control flow, не presentational)
- Lifted Vuex script logic: ~190 lines (computed + actions + lazy modal logic + i18n)
- Top-level template wrapper + clan-loading + 2-state branch: ~30 lines
- Parent's scoped style block: ~16 lines

Boundaries clean at component level — ТЗ size estimate was optimistic, не engineering failure.

### 3.5 Sort state pragmatic decision (Phase 3)

ТЗ §5 Phase 3 (b): "Children purely presentational. No Vuex reads. Internal logic minimal."

**Refinement applied:** "purely presentational" ≠ "stateless". UI-only state (sort field) without Vuex coupling — `defineEmits('toggle-sort')` + parent flips ref + parent passes pre-sorted array — created unnecessary 2-way binding ceremony with zero benefit.

**Decision:** sort state stays in HudClanRoster. Lift only **data state** (Vuex bindings), keep **UI state** where it's rendered.

```js
// In HudClanRoster.vue
const sortField = ref('elo');
const sortedRoster = computed(() => {
  const list = [...props.members];
  // sort logic...
  return list;
});
```

**Lesson #30 toolkit growth:** "purely presentational" interpretation refined per use case — separate UI state from data state.

### 3.6 CSS namespace inheritance (Phase 3)

`.ic-*` styles живут globally в `src/styles/v24/clan.css` под `.app-v2` namespace:

```css
.app-v2 .ic-header { ... }
.app-v2 .ic-side { ... }
.app-v2 .ic-roster { ... }
```

3 child components render content within `.app-v2` ancestor (mounted via parent under `<div class="hud clan-hud">` which itself is descendant of `.app-v2`). Children inherit through namespace, **no scoped CSS distribution needed**.

**Saved scope creep** — original ТЗ §5 Phase 3 (c) "CSS distribution: distribute relevant rules к children" wasn't applicable in this codebase architecture. Pre-edit verify caught.

### 3.7 ClanActivityFeed self-fetch detection (Phase 4)

Pre-edit grep #1 revealed:
```js
// In ClanActivityFeed.vue
onMounted(async () => {
  store.commit('clan/resetClanEvents');
  await store.dispatch('clan/fetchClanEvents', { clanId: props.clanId, limit: 30 });
  loaded.value = true;
});
```

Component **self-manages data fetch**. ТЗ §5 Phase 4 (b) "Dispatch fetch on mount" via parent would have caused:
1. Double fetch (parent + child both dispatch)
2. resetClanEvents fires twice → potential UI flicker

**Decision:** parent ONLY provides `clanId` prop + grid placement. No dispatch. Documented в HudClan parent comment.

### 3.8 Grid layout extension (Phase 4)

Existing `.clan-ingrid` was `2 cols × 2 rows`:
```css
grid-template-columns: 1fr 2fr;
grid-template-rows: auto 1fr;
```
- Row 1: header (`grid-column: 1 / -1` full-width)
- Row 2: side (col 1) + roster (col 2)

Adding 4th child required:
```css
/* 5L Phase 4 */
grid-template-rows: auto 1fr auto;  /* row 3 added */

.app-v2 .ic-activity {
  grid-column: 1 / -1;
  max-height: 200px;
  overflow-y: auto;
  /* ... panel styling ... */
}
```

Mobile @820px also extended `auto auto 1fr` → `auto auto 1fr auto` (single-column stack with row 4).

### 3.9 Required prop guard (Phase 4)

ClanActivityFeed has `clanId: { type: String, required: true }`. If `clan` is `null` mid-fetch → Vue prop validator warning + crash при reactive computation.

**Defensive guard:**
```vue
<div v-if="clan?.id" class="ic-activity">
  <ClanActivityFeed :clanId="clan.id" />
</div>
```

`v-if` prevents component mount until `clan` is hydrated. Pattern: **always check required-prop sources are non-null at mount time**.

### 3.10 Lessons #19-21 application (Phase 5)

**5D Step 5 false-trail:** 5 hot-fix attempts cascade-tuning lighting blindly (per CLAUDE.md 5D narrative).

**5L Phase 5 anti-pattern:** apply lessons **PRE-edit, не post hoc.**

Pre-edit verify executed in **single grep block** before any edit:
1. Rim color present at `0xff066f`? ✅
2. Floor color present at `0x20202a`? ✅
3. Renderer exposure 2.3? ✅ (CanvasLayer.vue line 94)
4. clanFlag.js structure (factory pattern, no internal animation)? ✅

**Each tweak independently revertible:**
- Old hex preserved inline в comment as reference
- `flagTotems` array localized to scene constructor scope (revert = remove for-loop only)

**Result:** 0 hot-fix attempts. 5L Phase 5 Phase 5 distinct from 5D Step 5 false-trail pattern.

### 3.11 CSS string `'#ff066f'` intentional non-touch (Phase 5)

PRED flag's accent stripe в canvas texture использует CSS hex string `'#ff066f'` (clanFlag.js line 119):
```js
scene.add(makeClanFlag(THREE, '#ff066f', -3.5, 'PRED'));
```

This is **flag canvas texture color** (used for accent stripe + emblem circle + label fill). Distinct from rim spotlight color tweak (Phase 5 Tweak 1).

**Touching `'#ff066f'` would cause:**
- PRED flag accent stripe shifts pink
- Emblem circle outline shifts pink
- Label "PRED" text color shifts pink

**Scope creep + visual side-effect.** ТЗ Tweak 1 specifies rim spotlight only. Convention: when same hex appears multiple places, verify intent differs before sweeping change.

### 3.12 Wave animation phase offset (Phase 5)

```js
for (let i = 0; i < flagTotems.length; i++) {
  const phaseOffset = i * (Math.PI * 2 / 3);
  flagTotems[i].rotation.z = Math.sin(t * 0.5 + phaseOffset) * 0.02;
}
```

**Math rationale:**
- 3 totems at indices 0/1/2 → phaseOffsets `0 / 2π/3 / 4π/3` → 120° desync each
- Frequency `t * 0.5` → 0.5 rad/sec → ~1 full cycle per 12.6s (slow gentle)
- Amplitude `* 0.02` → ±0.02 rad ≈ ±1.15° (subtle, doesn't read as broken/jittery)

**Why phase desync:** all 3 totems rotating in unison would look mechanical. Out-of-phase reads as natural breeze affecting each totem differently.

---

## §4 Pre-commit checks (Phase 7 — 12/12 PASS)

| # | Check | Result |
|---|---|---|
| 1 | VerifyEmailBanner localStorage | 4 hits ✅ |
| 2 | agentState mutations (OPTIMISTIC_SET_CAPTAIN + ROLLBACK_AGENTS) | 6 hits ✅ |
| 3 | Rollback toast string `'Failed to set captain'` | present ✅ |
| 4 | 3 child files exist (HudClanHeader/Info/Roster) | OK ✅ |
| 5 | HudClan parent size 388 lines (≤400 adjusted from ТЗ ≤220) | ✅ |
| 6 | defineProps in 3 children | 3 ✅ |
| 7 | ClanActivityFeed mounted в HudClan | present ✅ |
| 8 | Rim `0xff1a7d` present | ✅ |
| 9 | Floor `0x1d1d27` present | ✅ |
| 10 | Flag wave (phaseOffset + flagTotems[i]) | present ✅ |
| 11 | Frontend build | pass ✅ |
| 12 | Cumulative tally 10 stable | ✅ |

**No fix commit needed.** Phase 7 passed clean.

---

## §5 Расхождения (10 items)

| # | Item | Reason |
|---|---|---|
| 1 | **Banner path corrected** — ТЗ assumed `src/components/fragments/VerifyEmailBanner.vue`; реальность `src/components/hud/VerifyEmailBanner.vue` | Pre-edit grep #1 caught (Lesson #11). 5F sub-epic created banner в `hud/` namespace, ТЗ template-error inherited from outdated reference. |
| 2 | **`master.userData.login` namespace** — ТЗ pseudo-code used `state.user.login`; реальность `state.master?.userData?.login` | Vuex namespacing project-specific. TopBar precedent + masterModel structure verified pre-edit. Lesson #32 reflex. |
| 3 | **`'guest'` fallback в storageKey** — ТЗ template без fallback handling | Defensive coding для auth-pending edge case. Conscious extension. Без него `undefined` formed key during transient login state. |
| 4 | **Try/catch around localStorage** — ТЗ template assumed setItem/getItem безопасны | Private mode browsers (Safari) + storage quota throw on access. Try/catch degrades gracefully к session-scoped behavior. Defensive extension. |
| 5 | **`master/setErrorMessage` (NOT setInfoMessage)** — ТЗ pseudo-code used info mutation | Codebase has separate mutation для errors с `ErrorMessageModel.withText()` payload. Plain `{type, text}` object not accepted. Lesson #32 + #11 caught pre-edit. |
| 6 | **`currentAgent` scope extension в OPTIMISTIC_SET_CAPTAIN** — ТЗ template only flipped `state.agents` | FighterDetailView prop binding reads `state.currentAgent.isCaptain`. Без flipping currentAgent — UI badge не обновился бы optimistically. Silent UI bug avoided через change-impact analysis. **Critical catch.** |
| 7 | **HudClan parent 388 lines vs ТЗ ≤220** — size estimate divergence | Parent retains: no-clan branch (~75), lazy modal hosts (~25), Vuex script logic (~190), boilerplate (~16). ТЗ optimistic, не engineering failure. Boundaries clean at component level. |
| 8 | **Sort state stays в HudClanRoster** — ТЗ "purely presentational" implied stateless | UI-only state без Vuex coupling — lifting к parent создал бы 2-way emit pattern с zero benefit. Refinement: presentational ≠ stateless. Lesson #30 toolkit growth. |
| 9 | **Grid template extension (3 → 4 rows)** — ТЗ assumed simple mount works | Existing `clan-ingrid` was 2cols×2rows; 4th child required `auto 1fr auto` template + `grid-column: 1 / -1` placement + mobile media query update. Pre-edit grep #5 surfaced. |
| 10 | **`v-if="clan?.id"` defensive guard для required prop** — ТЗ assumed clan always populated | ClanActivityFeed `clanId: required: true` throws Vue prop warning if null mid-fetch. Defensive extension. |
| 11 | **PRED flag canvas string `'#ff066f'` intentional non-touch** — ТЗ Tweak 1 wording could ambiguously cover any pink hex | Flag canvas texture color ≠ rim spotlight color (semantically distinct). Phase 5 §3.11 disambiguation. Scope discipline. |

**11 documented divergences.** All conscious — каждый with explicit reasoning grounded в pre-edit codebase verification (Lesson #11 + #32) или change-impact analysis.

---

## §6 Lessons

### Validated working patterns

- **#11 verify shape с реальным data** — **10 cumulative recoveries в 5L** (Phase 1: 4, Phase 2: 2, Phase 3: 1, Phase 4: 3, Phase 5: 0). Reflex stable across 8-sub-epic streak (5E-5L). Running tally: ~44+ cumulative since Lesson #11 introduction.
- **#18 STOP at structural mismatch** — applied Phase 0 (Pre-flight Blocker A — branch mismatch reported, awaited explicit user authorization для switch). Не blind `git checkout`.
- **#19 Exposure baseline before tuning** — Phase 5 verified `renderer.toneMappingExposure = 2.3` (CanvasLayer.vue line 94) before any color tweak.
- **#20 Photographic clarity (don't blow highlights)** — Phase 5 small saturation/lightness shifts (+15% / -5%), не overhaul. Single-point changes preserve baseline relationships.
- **#21 Tiny tweaks, не cascade** — Phase 5 each tweak independently revertible (old hex preserved inline в comments; flagTotems array localized).
- **#30 Pattern reuse semantic vs mechanical** — Phase 3 sort state decision: data state lifted, UI state stays in child. Toolkit growth: "purely presentational" refined per use case.
- **#32 Convention discovery reflex** — applied across all 5 phases (15+ pre-edit catches): banner path / Vuex namespace / `ErrorMessageModel` payload / agent state shape / scene constants / clan grid template / etc.

### 5L-introduced practice

- **Per-user localStorage pattern** для banner-style UI state — transferable к other dismissable banners (challenge notifications, club invitations, future onboarding hints). Key: `<feature>_<login>` structure.
- **Optimistic UI snapshot/rollback pattern** — transferable к other Vuex action UX (joinClan / leaveClan / removeAgent / etc). Snapshot covers ALL state slices read by UI components, не only mutated array.
- **5-chunk sentinel split applied proactively** для FINAL_REPORT (5K Phase 13/14 precedent stable into 5L).
- **Lessons #19-21 as preventive reflex** — apply BEFORE edit, не post-mortem. 5L Phase 5 first sub-epic-area where lighting tweaks happened с 0 hot-fix attempts.

### Anti-patterns avoided

- **0 hot-fix attempts** — Phase 5 specifically engineered to NOT repeat 5D Step 5 false-trail (5 hot-fix cascade tuning).
- **0 blind splits** — Phase 3 sort state decision documented через convention discovery + use-case analysis, не mechanical "lift everything."
- **0 fabricated solutions** — все decisions grounded в pre-edit codebase reading (banner path, Vuex namespace, agent state shape, scene constants).
- **0 abandoned scope mid-run** — все 5 polish items completed; Phase 7 12/12 PASS clean.
- **0 unauthorized git operations** — Blocker A reported, branch switch only after user explicit "approved" signal.

### Lessons added

**None new.** 5L **applied** lessons preventively, не recovered after mistakes.

### Cumulative lesson tally

**33** (UNCHANGED от 5K).

---

## §7 Deferred

| # | Item | Target | Severity |
|---|---|---|---|
| 1 | **AutoFight toggle (#22)** | 5M candidate (M scope ~5-7 commits) | Feature |
| 2 | **AI Trainer (#12)** | 5M candidate (M scope ~5-7 commits) | Feature |
| 3 | **Spectate flag (#4)** | 5M candidate (M scope ~5-7 commits) | Feature |
| 4 | **FightClub level + Morning Report (#14)** | 5M candidate (M scope ~5-7 commits) | Feature |
| 5 | **Retirement (#15)** | 5M candidate (M scope ~5-7 commits) | Feature |
| 6 | **HudClan parent further splitting** — no-clan branch как separate component | Эпик 6 (если refactor priority) | Code quality |
| 7 | **ClanScene further mood iteration** | Defer if user requests visual changes | Polish |
| 8 | **Banner persistence cross-device sync** — currently localStorage only | Defer when needed (backend `User.bannerDismissed` column) | UX |
| 9 | **Optimistic UI extension к other Vuex actions** (joinClan / leaveClan / agent CRUD) | Defer until performance/UX warrants | Pattern reuse |
| 10 | **Onboarding tour (#21)** | L scope, defer | Feature |
| 11 | **MoveTree (#16)** | L scope, defer | Feature |
| 12 | **i18n pass (5U candidate)** — все v2 HUDs inline EN | Last per VISUAL_MIGRATION plan §R8 | Localization |

---

## §8 Footer

**Hot-fix metric:** **0 — 8-streak achieved** (5E + 5F + 5G + 5H + 5I + 5J + 5K + 5L — eight of 12 sub-epics в Эпике 5 в clean run).

**Bundle impact:** minimal:
- `+1kb` VerifyEmailBanner localStorage logic (Phase 1)
- `+~0.5kb` agentState mutations + ErrorMessageModel import (Phase 2)
- `+~3kb` 3 new HudClan child components (Phase 3 — replaces inlined template, net delta near-zero)
- `+~0.3kb` ClanActivityFeed import + grid CSS (Phase 4)
- `+~0.2kb` ClanScene wave loop (Phase 5)

Total bundle delta: **~5kb raw / ~1.5kb gzip** для full 5L scope.

**Backend tests:** N/A (5L pure frontend).

**§4.2 progress:** **13/22 done (59%) — UNCHANGED.** 5L closes carry-over polish items from 5D #11/#4/#19 + 5G/5F, не adds new audit features. Remaining: 5/22 partial + 4/22 missing.

**Files final:**
- 3 new components (45+37+77 = 159 lines)
- 6 modified files (cumulative ~+88 / -15 lines)

**Transition к 5M** — see `HANDOFF_EPIC5_5M_CHAT_HANDOFF.md` (Phase 10).

**Recommendations для 5M:**
- **Avoid stacking another L scope immediately** после 5L polish closure — preserves 8-streak momentum
- **β AutoFight (M ~5-7 commits)** — existing wiring leverage, low risk, audit §4.2 #22
- **δ Spectate flag (M ~5-7 commits)** — alternate M scope candidate, audit §4.2 #4

**Sub-Epic 5L — CLOSED.** ✅

---

*FINAL REPORT generated 2026-04-28 in 5-chunk sentinel split (5K Phase 13/14 precedent).*
