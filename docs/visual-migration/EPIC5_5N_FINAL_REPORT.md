# Sub-Epic 5N — Spectate Flag (Option δ, Path α Mock Port) — FINAL REPORT

**Status:** ✅ CLOSED 2026-04-29.
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued through 5E-5N stack).
**Predecessor:** 5M ✅ CLOSED (`e8858ab`).
**Audit ref:** §4.2 #4 (🔴 Missing → ✅ Done).
**Hot-fix metric:** **0 — 10-streak achieved** (5E + 5F + 5G + 5H + 5I + 5J + 5K + 5L + 5M + 5N).
**Cumulative lesson tally:** **34 (UNCHANGED)**. Lesson #34 first real test passed.
**Эпик 5 §4.2 progress:** **15/22 done (68%)** — past two-thirds milestone.

---

## §1 Phase + commit timeline

| # | Commit | Phase | Description |
|---|---|---|---|
| 0 | (pre-flight) | Investigation | Q1-Q3 + D-bundle resolved; Blocker A branch switch from `claude/setup-FJboo` (harness slug) → `claude/setup-5e-shop-mode-a-khIAi` (5E-5M stack continuation, single PR target) |
| 1 | `5a78676` | Phase 1 | HudSpectate.vue port (~395 lines) + SpectateView.vue orchestrator (~37 lines) + V2Spectate route (3 modified files) |
| 2 | `9a9252a` | Phase 2 | HudProfile Friends tab Watch button (v-if `in_fight` + onWatch handler + .fc-action-btn.watch CSS variant) |
| 3 | `0393a9b` | Phase 3 | HudFight `.spectate-badge` mode-gated (bundled fix — Epic 3A always-visible bug) |
| 4 | `f15d7be` | Phase 4 | i18n keys port across 11 locales (Case B — 8 locales had missing spectate block, English fallback per de.js convention) |
| 5 | (no commit) | Phase 5 | Visual sign-off — user confirmed `/v2/spectate/<id>` works on Vercel preview |
| 6 | (no commit) | Phase 6 | 8/8 grep checklist PASS — verify-only |
| 7 | `464f059` | Phase 7 | CLAUDE.md Sub-Epic 5N section (+106 lines) |
| 8 | (this) | Phase 8 | EPIC5_5N_FINAL_REPORT.md |
| 9 | (next) | Phase 9 | HANDOFF_EPIC5_5O_CHAT_HANDOFF.md |

**Total commits:** 5 functional + 1 docs (Phase 7) + 1 docs (this) + 1 docs (Phase 9 pending) = **7 commits + 2 verify-only phases**.

---

## §2 Files matrix

### Created (2)

| File | Purpose | Lines |
|---|---|---|
| `src/components/hud/HudSpectate.vue` | HUD overlay + mock simulation logic | ~395 |
| `src/views-v2/SpectateView.vue` | Route orchestrator (NO 3D scene per Path α discipline) | ~37 |

### Modified (6)

| File | Change | Net delta |
|---|---|---|
| `src/router/index.js` | V2Spectate route registered as 11th child of `/v2` | +5 |
| `src/components/hud/HudProfile.vue` | Friends tab Watch button + onWatch handler + useRouter import | +11 |
| `src/styles/v24/profile.css` | `.fc-action-btn.watch` variant rule (mirror primary/danger pattern) | +11 |
| `src/components/hud/HudFight.vue` | isSpectating computed + useRoute import + v-if on .spectate-badge + CSS comment update | +13/-4 |
| `src/locales/{es,fr,pt,ar,hi,ja,ko,zh}.js` | Spectate i18n block (8 files × 11 lines, English fallback values) | +88 total |

### Reused as-is (7)

- Legacy SpectateView mock simulation logic (port структуру 1:1, parameters preserved)
- Existing 11-locale i18n infrastructure (3 had keys, 8 added)
- `pixelIcons.js` spectate icon (defined, not yet rendered in 5N)
- HudProfile Friends tab `in_fight` status detection (lines 514-552 unchanged)
- `.fc-action-btn.primary/.danger` variant pattern (mirror precedent for `.watch`)
- Vue Router `useRoute` (sibling import beside existing `useRouter` in HudFight)
- `de.js` "English fallback" convention (literal English values copy-paste)

---

## §3 Технические детали (12 sub-sections)

### 3.1 Path α Mock port discipline

5N target = port legacy SpectateView к v2 architecture **without** backend integration. Backend integration deferred к dedicated PvP-integration sub-epic — 4th time this deferral mentioned в CLAUDE.md (5C item #1, 5C item #11, 5J/5K HANDOFF, 5N Path α). Discipline boundary explicit:

- ✅ Mock simulation logic (setInterval + Math.random)
- ✅ Frontend i18n + UI design tokens
- ✅ Vue Router state-based mode detection
- ❌ NO backend WS broadcast extension
- ❌ NO Vuex spectate state module
- ❌ NO new backend endpoints / Prisma changes

### 3.2 Lesson #34 first real test (preventive application)

5M added Lesson #34 (HUD overlay layout convention) after Phase 2 fix discovered `.autofight-row` rendered hidden under back-btn. 5N Phase 1 was first sub-epic to apply Lesson #34 **preventively** at design time — not retroactively. Pre-edit verification (Phase 1 verify #4-5-15-16) confirmed `.detail-hud` / `.shop-hud` / `.fight-hud` precedent: container `position: absolute; inset: 0; pointer-events: none`, interactive children `position: fixed` + explicit corner coordinates + `pointer-events: auto`. HudSpectate `.spectate-hud` final verify: 16 hits position/pointer-events (2 abs container + 7 fixed children + 7 pe:auto + 3 pe:none) — comprehensive layout architecture. **Lesson #34 transferability confirmed.**

### 3.3 Mock simulation parameters

Ported verbatim from legacy SpectateView (lines 140-220) with explicit constants extracted:

- `MAX_HP = 100`
- `MAX_ROUNDS = 10`
- `TICK_MS = 2000` (round simulation interval)
- `damage = 8 + Math.floor(Math.random() * 15)` → range **8-22**
- `crit_chance = 0.15` → 15% probability
- `crit_multiplier = 1.5`
- `MOVE_NAMES` = 10-name pool (Jab/Hook/Uppercut/Cross/Straight/Combo/Counter/Block Strike/Feint/Rapid Fire)
- `spectatorCount` = `Math.floor(Math.random() * 8) + 2` → 2-10 initial; drift +/-1 with 30% probability per round
- 1s delay before first round (visual settling)

### 3.4 SpectateView v2 orchestrator NOT register 3D scene

Unlike typical v2 view pattern (ShopView/ProfileView/ClanView all do `buildXScene + registerScene + activateScene`), SpectateView deliberately omits scene registration. Path α reasoning: spectate is mock-only, prior active scene (whatever user came from — most likely 'profile' via Friends tab) stays as visual backdrop. CanvasLayer fallback (`if (!getActiveScene()) activateScene('pit')` at line 87 of CanvasLayer.vue) handles direct-URL access. **37 lines orchestrator** (vs ShopView 41) reflects discipline.

### 3.5 `src/views-v2/` directory structure discovery

ТЗ §3 template suggested `src/views/v2/SpectateViewV2.vue` as alternative path. Phase 1 pre-edit verify #2 caught reality: existing v2 views live in `src/views-v2/` (10 files: AppV2 children including ShopView, ProfileView, etc). Path corrected before any file write — Lesson #11/#32 reflex. Final path: `src/views-v2/SpectateView.vue` (no `V2` suffix per existing convention — Vue route name `V2Spectate` distinguishes).

### 3.6 HudProfile Watch button conditional render + fallback chain

Friends tab template (line 144-157) had 2 templates (pending vs default). Watch button added to `<template v-else>` block, conditionally rendered:

```vue
<button
  v-if="f.status === 'in_fight'"
  class="fc-action-btn watch"
  aria-label="Watch live fight"
  @click="onWatch(f)"
>Watch</button>
```

Position before Challenge button per legacy `FriendsView.vue` precedent (separate-button pattern, NOT replace Challenge — server gates challenge attempts to in-fight friends). Handler:

```js
function onWatch(f) {
  const fightId = f.currentFight?.id || f.id;
  router.push(`/v2/spectate/${fightId}`);
}
```

`currentFight` field exists in `friendsState.js:73-78` mutation but NEVER populated by current backend (Phase 1 investigation Q2e confirmed). Optional chain fallback к `f.id` is always-used today; protects future PvP-integration when backend wires real match IDs. **Forward-compatible coding pattern.**

### 3.7 CSS variant в global profile.css (.fc-action-btn.watch)

Phase 2 pre-edit verify #5/#7 caught `.fc-action-btn` styles live in `src/styles/v24/profile.css:383-412` (global namespace `.app-v2 .fc-action-btn`), NOT scoped block в HudProfile.vue. Mirror precedent: `.app-v2 .fc-action-btn.primary` + `.app-v2 .fc-action-btn.danger`. New variant `.app-v2 .fc-action-btn.watch` (lines 410-418):

```css
.app-v2 .fc-action-btn.watch {
  background: rgba(255, 6, 111, 0.15);
  border-color: var(--hex-primary);
  color: var(--hex-primary);
}
.app-v2 .fc-action-btn.watch:hover {
  background: rgba(255, 6, 111, 0.25);
  color: #fff;
}
```

Distinguishes от Challenge (also pink, primary variant) via softer tinted background fill (Challenge primary uses border-color only, no fill). Convention discovery via Lesson #32 — pre-edit grep before adding.

### 3.8 HudFight `useRoute` import already partial

Phase 1 investigation Q3 noted HudFight already imports `useRouter` (line 87). Phase 3 pre-edit verify #2/#4 confirmed: needed only sibling `useRoute` import (`import { useRouter, useRoute } from 'vue-router'`) + invocation. No risk of duplicate import / circular concerns. **Minimal-touch addition** beside existing pattern.

### 3.9 Defensive route detection — `name === 'V2Spectate' || path.startsWith('/v2/spectate')`

ТЗ §4 Phase 3 (a) recommended both checks for defensive coding. Reasoning:

- `route.name === 'V2Spectate'` — primary clean check via Vue Router metadata
- `route.path.startsWith('/v2/spectate')` — fallback if route metadata mismatch (e.g. hash routing edge cases, programmatic route push without name)

Single boolean OR expression — both covered single line. Cost: negligible. Benefit: edge-case safety. Preserved.

### 3.10 Phase 4 Case B i18n discovery — Phase 1 status false-positive

ТЗ §4 Phase 4 explicitly anticipated 3 cases (A verify-only / B fix commit / C structural mismatch) with most-likely outcome predicted as Case A. Phase 1 status report claimed "11 locales have spectate section" — **inaccurate**. Phase 4 pre-edit re-grep across `src/locales/{en,ru,de,es,fr,pt,ar,hi,ja,ko,zh}.js` revealed only **3 of 11** had spectate block (en + ru + de). 8 locales missing (es/fr/pt/ar/hi/ja/ko/zh) → would throw `t.spectate.title` undefined at runtime since `t` fallback is **language-level** (`languages[code] || languages.en`, full dict swap), NOT key-level partial fallback.

**Lesson #11 self-correction running tally:** 49 → **50** (+1 от 5N Phase 4). Pattern: status reports CAN contain false-positives, re-grep prior claims at decision points before action.

### 3.11 English fallback convention — `de.js` precedent

Per CLAUDE.md i18n policy ("9 локалей в English fallback для Club Mode подсекций"), missing keys in non-en locales are filled with literal English values — NOT real translations, NOT empty strings. `de.js` precedent confirmed Phase 4 verify #3 (German file with `'SPECTATING'` / `'watching'` literal English values). 5N Phase 4 copied identical block к 8 missing locales:

```js
spectate: {
  title: 'SPECTATING',     spectators: 'watching',
  round: 'Round',          fightLog: 'FIGHT LOG',
  uses: 'uses',            damage: 'damage',
  critical: 'CRIT',        wins: 'wins',
  leave: 'Leave',
},
```

Real localization for 9 fallback locales = future i18n pass (carry-over к 5U candidate).

### 3.12 sed batch insertion validation

Uniform `xpAllocation: {` anchor at line 640 across all 8 missing locales (Phase 4 verify #11/#12) enabled single sed loop:

```bash
for f in es fr pt ar hi ja ko zh; do
  sed -i '/^  xpAllocation: {$/i\  spectate: {\n    title: '\''SPECTATING'\'',...' "src/locales/$f.js"
done
```

Post-insert validation:
- `grep -c "title: 'SPECTATING'"` returned `1` per file × 8 = 8/8 PASS
- 2 sanity file reads (es.js ASCII + ar.js RTL) confirmed block correctly placed before xpAllocation
- RTL char safety: spectate values are English, ar.js xpAllocation neighbor (`متاح` Arabic) unaffected

---

## §4 Проверки + verify gates

### Phase 1 pre-commit verify (8/8 PASS)

1. HudSpectate.vue file exists ✅
2. SpectateView v2 file exists ✅
3. Route registered ✅
4. Mock simulation hits: 9 (≥3 expected) ✅
5. Lesson #34 position/pointer-events: 16 (≥4) ✅
6. Cleanup hooks: 4 (≥2) ✅
7. i18n keys used: 7 (≥6) ✅
8. Scoped style root match `.spectate-hud {` ✅

### Phase 2 pre-commit verify (6/6 PASS)

v-if `in_fight` ✅ | onWatch + router.push ✅ | useRouter import ✅ | CSS `.watch` variant ✅ | aria-label ✅ | fallback chain ✅

### Phase 3 pre-commit verify (5/5 PASS)

v-if on `.spectate-badge` ✅ | useRoute import + invocation ✅ | isSpectating computed ✅ | V2Spectate route name referenced ✅ | path-based fallback check ✅

### Phase 4 pre-commit verify (8/8 PASS)

All 8 locales have `title: 'SPECTATING'` line ✅ | es.js + ar.js sanity grep correct placement ✅ | Build clean ✅

### Phase 5 visual sign-off

User confirmed `/v2/spectate/<id>` works on Vercel preview — HUD overlay correct, mock simulation runs, Lesson #34 layout applied, no regressions on /v2/* features.

### Phase 6 grep checklist (8/8 PASS, verify-only)

All 8 automated checks per ТЗ §4 Phase 6: HudSpectate exists ✅ | route registered ✅ | HudProfile Watch ✅ | HudFight gate ✅ | Lesson #34 convention ✅ | cleanup hooks ✅ | build ✅ | cumulative tally stable (50) ✅

### Phase 7 pre-commit verify (6/6 PASS)

CLAUDE.md Sub-Epic 5N refs (2) ✅ | 10-streak quoted ✅ | 15/22 (68%) quoted ✅ | Path α refs (7) ✅ | English fallback refs (10) ✅ | "34 UNCHANGED" quoted ✅

---

## §5 Расхождения — осознанные

1. **SpectateView v2 orchestrator NOT register 3D scene** — Path α discipline preserved, prior active scene stays as backdrop (vs typical v2 view pattern с `buildXScene + registerScene + activateScene`). Conscious decision for mock-port; backend integration would re-evaluate.
2. **Inline EN "Watch" string** (NOT i18n key) — `spectate.watch` key absent в всех 11 locales. Per v2 HUD inline-EN convention (5K-5M precedent — i18n deferred to dedicated 5F-style sub-epic), documented as carry-over к 5U.
3. **CSS lives в global profile.css** (`.fc-action-btn.watch`) — mirrors `.fc-action-btn.primary/.danger` pattern at lines 397-407, NOT scoped block in HudProfile.vue. Convention discovery via Lesson #32 pre-edit grep.
4. **Phase 3 defensive double-check route detection** — single boolean OR with both `route.name === 'V2Spectate'` + `route.path.startsWith('/v2/spectate')` checks. ТЗ §4 Phase 3 (a) recommended pattern, preserved для metadata mismatch / hash routing edge cases.
5. **Phase 4 Case B handled per ТЗ flow** — Phase 1 status false-positive ("11 locales spectate") caught в pre-edit re-grep, anticipated single-fix commit per ТЗ §4 Case A/B/C decision tree. **NOT hot-fix recovery** (decision tree absorbed reality, fix included in original ТЗ scope).
6. **`currentFight?.id || f.id` fallback chain** — backend never populates `currentFight` field today. Optional chain protects future PvP-integration sub-epic when backend wires real match IDs. Forward-compatible coding.
7. **CSS comment update в HudFight.vue** — same-file scope, descriptive accuracy maintenance documenting 5N change for future readers (replaced "Always visible in our spectate-by-default HUD" with "5N gated on V2Spectate route name / path prefix").
8. **Esc handler synthesizes click on back button** — `document.querySelector('.spectate-hud .sp-back')?.click()` — accessibility extension за рамок ТЗ. Conscious refinement for keyboard nav.

---



## §6 Lessons applied + introduced

### Validated working patterns

- **#11 verify shape с реальным data** — 1 catch в 5N (Phase 4 self-correction of Phase 1 status false-positive "11 locales spectate" → reality 3 locales). Cumulative running tally: 49 → **50** (+1 от 5N Phase 4). Pattern stable across 5E-5N runs.
- **#18 STOP at structural mismatch** — Phase 4 Case A → Case B escalation per ТЗ flow (NOT scope creep). Anticipated decision-tree branch, not retroactive panic.
- **#22 HUD scoped selector match** — `.spectate-hud` template root matches scoped style root (Phase 1). N/A for Phase 2/3 (global CSS / template-only edits).
- **#30 Pattern reuse — semantic vs mechanical** — `de.js` "English fallback" convention extended к 8 locales semantically (literal English values), NOT mechanical `null` / empty strings.
- **#32 Convention discovery reflex** — applied во всех phases: `src/views-v2/` directory pattern (Phase 1 verify #2), `.fc-action-btn` CSS file location (Phase 2 verify #5/#7), `useRoute` import sibling pattern (Phase 3 verify #2/#4), route name `V2Spectate` re-verify (Phase 3 verify #3), `xpAllocation:` anchor uniformity (Phase 4 verify #11/#12), `de.js` English fallback precedent (Phase 4 verify #3).
- **#34 (NEW от 5M) HUD overlay layout convention** — **first real test PASSED.** HudSpectate `.spectate-hud` overlay convention applied **preventively** pre-edit (16 hits position/pointer-events). NOT 5M Phase 2 mistake (where `.autofight-row` rendered hidden under back-btn) repeated. **Transferability confirmed.**

### 5N-introduced practice (transferable)

- **Pre-edit re-verification of prior status claims** — Phase 4 caught Phase 1 false-positive. Toolkit refinement к Lesson #11: "при new dependent operation re-grep prior claims вместо trust status as ground truth". Specialization #11 для multi-phase runs.
- **Mock port discipline pattern (Path α)** — explicit boundary (no backend, no new Vuex, no 3D scene registration). Transferable к future deferred-integration scenarios where pure-frontend port = scope discipline.
- **English fallback convention для i18n** — literal English values copied к non-English locales per `de.js` precedent until dedicated localization pass. Pattern для future feature i18n with deferred translation.

### Anti-patterns avoided

- **0 hot-fix attempts** (Phase 4 Case B = anticipated ТЗ flow, NOT recovery)
- **0 scope creep** (Phase 3 same-file bundled fix only, NOT 9-callsite phantom mutation expansion level)
- **0 fabricated solutions** (i18n English fallback follows `de.js` precedent verbatim)
- **0 missed pre-edit reverification** (Phase 4 caught Phase 1 false-positive at decision point)

### Lessons added

**0 new.** 5N applied existing lessons (#11/#18/#22/#30/#32/#34) preventively + reactively. Lesson #34 first real test confirmed transferability (preventive application possible at design time, не retroactive only).

**Cumulative lesson tally: 34 (UNCHANGED).**

---

## §7 Deferred — carry-overs к future sub-epics

### Direct 5N carry-overs

- `spectate.watch` i18n key для 11 locales — defer к 5U pass (dedicated i18n localization sub-epic)
- Real localization для 8 fallback locales (es/fr/pt/ar/hi/ja/ko/zh) — same 5U pass
- ChallengeNotification widget hidden on `/v2/*` (App.vue line 35 `v-if="!isV2Route"`) — V2 users won't see incoming challenge toast (5B Phase 8 pre-existing carry-over, separate PvP-integration concern)

### Backend PvP-integration sub-epic (4th time mentioned в CLAUDE.md)

Dedicated future sub-epic should address:

- Real spectate WS broadcast (Path γ candidate — extend `pvpCombatEngine.emit()` к spectator socket list)
- `currentFight` field population на friend objects (currently always null)
- Spectator subscription/unsubscribe endpoints
- Spectator list management в `pvpCombatEngine`
- Live ratings tab integration (Ratings list "live now" candidates)
- HudSpectate replace mock simulation с real round_result / fight_end events

### Inherited carry-overs (Эпик 5 §4.2 / prior sub-epics)

- Backend `/v1/agent/list` 500 fix (5M Phase 4 carry-over) — unblocks AutoFight visual verify
- `master/setError` phantom mutation 8 callsites cleanup (5M Phase 3 carry-over) — AgentDetailView (5) + ResearchTree (2) + RetirementPanel (1)
- AutoFight mobile responsive `.autofight-row` `@media @820px` (5M Phase 2 fix carry-over)
- HudClan further splitting (5L carry-over)
- ClanScene further mood iteration (5L carry-over)
- `trState` removal entirely (5K Q6 carry-over)

### 5O+ candidates per audit gap matrix §4.2

- **γ AI Trainer (#12)** — M scope ~5-7 commits, ResultOverlay augmentation
- **ε FightClub level + Morning Report (#14)** — M scope ~5-7 commits, Daily login flow
- **ζ Retirement (#15)** — M scope ~5-7 commits, RetirementPanel reuse via augmentation
- **ψ Carry-overs polish batch** — S-M scope ~3-5 commits (bundles 5M backend 500 + phantom mutation cleanup + AutoFight mobile + etc)
- **η Onboarding tour (#21)** — L scope ~8-10 commits, defer
- **θ MoveTree + DeckBuilder (#16)** — L scope ~10+ commits, defer

---

## §8 Footer + transition

### Hot-fix metric

**0 — 10-streak achieved** (5E + 5F + 5G + 5H + 5I + 5J + 5K + 5L + 5M + 5N — ten of twelve sub-epics в Эпике 5 в clean run after 5D's 5-attempt false-trail).

- Phase 3 `.spectate-badge` fix = bug-bundle pattern (same-file scope, 5G/5M precedent — intentional decision-maker, NOT recovery)
- Phase 4 i18n Case B = anticipated ТЗ Case A/B/C decision tree absorbing reality, NOT retroactive recovery

### Bundle impact

- **HudSpectate lazy chunk:** 4.14kb raw / 1.55kb brotli (new lazy import on `/v2/spectate/:fightId` navigation)
- **i18n keys port:** +88 source lines × 11 locales × brotli compression ≈ negligible delta on main `index-*.css/js` chunks
- **HudProfile + HudFight + profile.css:** all in main chunks, +35 net source lines, sub-1kb compressed delta

### Backend tests

**N/A.** 5N is pure-frontend mock port. No Prisma changes, no `node:test` updates, no new endpoints.

### §4.2 progress

**15/22 done (68%) — past two-thirds milestone achieved** (+1 от 5N — Spectate #4 ✅).

Remaining: 4 partial + 3 missing (per HANDOFF_5N §1 audit recap).

### Transition к 5O

See `HANDOFF_EPIC5_5O_CHAT_HANDOFF.md` (Phase 9 next commit). Recommended: **ψ Carry-overs polish batch** (S-M, includes backend `/v1/agent/list` 500 fix unblock + phantom mutation cleanup + AutoFight mobile) **OR** **γ AI Trainer** (M new UX work). Avoid stacking another L scope immediately.

**Sub-Epic 5N — TRULY CLOSED.** ✅

