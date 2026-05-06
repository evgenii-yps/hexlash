# Sub-Epic 5P — Carry-overs Cleanup ψ-2 (Option A) — FINAL REPORT

**Status:** ✅ CLOSED 2026-04-29.
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continue 5E-5O stack, single PR target к `visual-v2`).
**HEAD before:** `85eec77` (5O Phase 6 closure tip).
**HEAD after P3:** `1064c3f`.
**Predecessor:** 5O ✅ CLOSED.
**Audit ref:** §4.2 closes carry-overs from 5L (HudClan splitting completion) + 5O (P1 aria-label deferred + P3 setInfo phantom surfaced); не adds new audit items.

---

## 1. Scope summary

**Shipped (3 functional commits):**

| # | Item | Source | Tier (#35) | Commit |
|---|---|---|---|---|
| P1 | aria-label `spectate.watchLive` key + HudProfile `:aria-label` binding | 5O P1 deferred | Adaptation | `ff2f463` |
| P2 | `master/setInfo` phantom mutation × 7 → `setInfoMessage` + `InfoMessageModel.withText()` | 5O P3 surfaced | **Bug-bundle (second empirical test)** | `2f6ff46` |
| P3 | HudClanEmpty.vue extract from HudClan.vue no-clan branch | 5L → 5O optional | Adaptation + #30 sub-pattern | `1064c3f` |

**Dropped (Q1):** Backend `/v1/agent/list` 500 — **3rd consecutive defer.** Same reasoning as 5O Q1 + 5M P4: root cause unobservable from frontend grep, requires runtime logs (Vercel/kubectl/DB inspect). No runtime access surfaced в 5P pre-flight either. Lesson #33 deploy-environment risk + speculative-fix risk persist. Forward-deferred к dedicated backend-debugging sub-epic with explicit "needs runtime access" gate.

**Skipped optional:** **None** — все Low priority carry-over items addressed in 5P (item 5 HudClan splitting closed, items 3 + 4 from HANDOFF_5P closed).

**Predicted: 3 functional + 3 finals = 6 total.** ✅ Matched.

---

## 2. Phase-by-phase log

### Phase 1 — aria-label `spectate.watchLive` (commit `ff2f463`)

**Files changed:** 12 (11 locales + HudProfile.vue), +12/-1.

**Pre-edit findings:**
- aria-label confirmed **static** at HudProfile line 153 (`aria-label="Watch live fight"`) — no Lesson #18 STOP trigger
- `t` reactive ref already imported via line 236 (5O P1 inheritance)
- Vue binding precedent в same file (`:title=` lines 34, 96) → `:aria-label` follows convention

**Decisions (Lesson #32):**
- Vue 3 binding `:aria-label="t.spectate.watchLive"` (NOT interpolation `aria-label="{{ ... }}"`)
- New sub-key `watchLive` adjacent to `watch:` (5O P1 added) — semantic grouping (action verb + descriptive accessibility variant)
- en `'Watch live fight'`, ru `'Смотреть прямой бой'`, 9 fallback English (5N convention)

**First aria-label i18n binding в HUD** — sets precedent для future descriptive accessibility strings. Lesson #32 candidate для cross-component reuse в later sub-epics.

### Phase 2 — `master/setInfo` × 7 callsites factory replace (commit `2f6ff46`)

**Files changed:** 3 (AgentDetailView.vue / CreateAgentView.vue / RetirementPanel.vue), +10/-7.

**Pre-edit findings:**
- 7 callsites confirmed exact (matches 5P investigation matrix — recovery #55 was 5O scope expansion 5→7 via CreateAgentView discovery)
- All uniform: `store.commit('master/setInfo', { text: <expr> })` — no try/catch wrapping, no extra payload fields
- Lesson #18 STOP triggers absent
- **Lesson #35 scope-boundary check proactive:** grep for `master/setWarning|setNotification|setAlert|setMessage` returned **0 hits** — master state phantom mutation family **closed** (no third defer expected on this line)

**Lesson #35 second empirical validation ✅:**
- Same model family (master state messages — `setInfoMessage`/`setErrorMessage` siblings at masterState.js:87/90)
- Same factory shape (`InfoMessageModel.withText()` parallel `ErrorMessageModel.withText()`)
- Same callsite pattern as 5O P3 setError × 9
- Mechanical 1:1 replacement, no structural mismatches

Side-by-side comparison:
```js
// 5O P3 setError
store.commit('master/setErrorMessage', ErrorMessageModel.withText(err?.response?.data?.error || 'Training failed'));
// 5P P2 setInfo
store.commit('master/setInfoMessage', InfoMessageModel.withText(t.value.club?.lblTacticsSaved || 'Tactics saved'));
```

Identical structure, different model class. Tier classification empirically robust.

**Imports added (Lesson #32 per-file convention):**
- AgentDetailView.vue: with semicolons (matches 5O P3)
- CreateAgentView.vue: with semicolons
- RetirementPanel.vue: no semicolons (matches 5O P3 file convention)

### Phase 3 — HudClanEmpty.vue extract (commit `1064c3f`)

**Files changed:** 2 (HudClan.vue modified, HudClanEmpty.vue created), +148/-125.

**Pre-edit Lesson #18 STOP triggers — all 3 verified absent:**
- Deep Vuex coupling? No — `searchQuery`/`filteredClans`/`joinRequested` pure local UI state
- Shared CSS selectors? No — CSS lives in external `src/styles/v24/clan.css` (5L precedent — `.app-v2` namespace)
- Lifecycle hooks in no-clan branch? No — lazy CreateClan modal is event-driven only

**Lesson #30 toolkit growth — Path D invert default applied (key architectural decision):**

Sibling pattern (HudClanHeader/Info/Roster) = pure-presentational `defineProps` + Vuex data lifted to parent — appropriate for **has-clan data display**. HudClanEmpty has different needs: **owns local UI state** (no upstream Vuex to lift from). Forcing parallel API would create artificial parent state with no real ownership.

**Decision: self-contained child** (NOT props-and-emits pattern). Different ownership model = different child shape.

**Line counts:**

| File | Before | After | Target | Status |
|---|---|---|---|---|
| HudClan.vue | 388 | **271** | ~250-280 | ✅ |
| HudClanEmpty.vue | — | **140** (new) | ~80-120 | Slightly over (+20, acceptable per ТЗ ±30) |
| Combined | 388 | 411 | — | +23 net (boilerplate overhead inherent) |

**Imports cleanup (Lesson #11 reflex):**
- Parent: `BROWSABLE_CLANS` removed (no longer used in parent)
- Parent: `shallowRef`/`markRaw` re-checked — still used by ClanEdit modal (lines 198, 205), not orphaned
- Child: imports `BROWSABLE_CLANS` + Vue refs/shallowRef/markRaw/nextTick/computed

**No regressions:**
- has-clan branch untouched (lines 93-163 original / 19-89 after extract)
- no-clan UX preserved verbatim (template + state + lazy modal logic)
- Visual parity (structural change only — no styling delta)

---

## 3. Lessons applied (validated)

- **#11 verify shape с реальным data** — running tally **+1 cumulative recovery в 5P** (investigation matrix surfaced setInfo 5→7 via CreateAgentView discovery — recovery #55). Phase 2/3 functional commits surfaced no new false-positives (matrix accurate going in).
- **#18 STOP at structural mismatch** — Phase 3 explicitly verified all 3 triggers absent pre-edit (deep Vuex / shared CSS / lifecycle hooks). Conservative scope-boundary discipline preserved across 5P.
- **#22 HUD scoped selector match** — Phase 3 parent `.clan-hud` scoped block preserved; children rely on `.app-v2` global namespace per 5L precedent.
- **#30 toolkit growth — Path D invert default** — Phase 3 concrete application: child shape derives from natural use, NOT forced parallel symmetry с siblings. Self-contained HudClanEmpty (owns local UI state + own lazy modal) vs sibling pattern (props + emits + Vuex lifted). Different ownership models = different child shapes.
- **#32 convention discovery reflex** — Phase 1 Vue 3 binding precedent (`:aria-label`, NOT interpolation), Phase 2 semicolon style per file, Phase 3 5L precedent reuse for component decomposition + external CSS pattern. Three distinct applications.
- **#33 deploy-environment awareness** — Q1 dropped specifically (3rd defer) because backend touch + visual verify chain elevates risk без runtime access. Frontend-only batch preserved Vercel preview sufficiency.
- **#35 reflex catch tiering — second empirical test** — Phase 2 bug-bundle-tier prediction held empirically (same model family / factory shape / callsite pattern as 5O P3 setError). Toolkit validated. Scope-boundary check proactive ('master/setWarning|Notification|Alert|Message' returned 0) closed phantom mutation family on this line.

---

## 4. Lessons new — none formal

**Lesson #30 sub-pattern surfaced (commentary only, pre-formal):**

Phase 3 produced concrete generalizable observation worth recording, but **not yet promoting to formal Lesson #36** — needs second instance for empirical confirmation:

> When extracting component to mirror sibling decomposition, don't force prop/emit symmetry if child's data ownership model differs. Sibling shapes that lift state to parent (props-from-Vuex pattern) ≠ universal child shape — depends on whether child **consumes upstream data** (lift to parent, child = pure-presentational) OR **owns local state** (self-contained child, no parent state to lift).

**Decision:** documented в commentary here + commit message. If η Onboarding / θ MoveTree (or another future extract) surfaces second instance → promote to formal Lesson #36.

**Lesson #35 second empirical validation** strengthens but doesn't add new entry. Bug-bundle-tier prediction empirically robust across two test scenarios (5O setError × 9 + 5P setInfo × 7).

**Cumulative lesson tally:** 35 → **35** (UNCHANGED).

---

## 5. Cumulative metrics update

| Metric | Before 5P | After 5P |
|---|---|---|
| Sub-epics done | 16/22 (73%) | **17/22 (77%)** ← past three-quarters reached |
| Hot-fix streak | 11 (5E-5O) | **12 (5E-5P)** |
| Lessons cumulative | 35 | **35** (unchanged — #30 sub-pattern documented commentary, #35 second validation refinement) |
| Cumulative recoveries | 54 (5E-5O) | **55** (+1 в 5P: investigation matrix setInfo 5→7) |

**Hot-fix metric:** **0 hot-fix attempts на ложной траектории.** Continues 5E-5O precedent — **12-streak achieved.** All conscious decisions documented в commit messages + status reports.

**Carry-over count:** 4 entering 5P → **1 leaving 5P** (Q1 backend only — drastic reduction).

---

## 6. Carry-overs forward (1 item)

| # | Item | Source | Priority | Recommended target |
|---|---|---|---|---|
| 1 | Backend `/v1/agent/list` 500 fix | 5M P4 → 5O Q1 → **5P Q1 (3rd defer)** | **HIGH** | Dedicated backend-debugging sub-epic with prod log access strategy decision (Lesson #33) |

**Closed in 5P:**
- ✅ aria-label `"Watch live fight"` i18n (5O P1 surfaced)
- ✅ `master/setInfo` × 7 phantom mutation (5O P3 surfaced)
- ✅ HudClan no-clan branch split (5L originally optional, deferred 5O)

**Master state phantom mutation family — CLOSED.** Lesson #35 scope-boundary proactive check ('master/setWarning|Notification|Alert|Message' returned 0) confirmed no further phantoms exist on this line. No third defer expected from this family.

---

## 7. Sub-Epic 5P — CLOSED

✅ All acceptance criteria met:
- [x] 3 functional commits landed на `claude/setup-5e-shop-mode-a-khIAi` (`ff2f463` / `2f6ff46` / `1064c3f`)
- [x] Q1 backend deferred с documented reasoning (3rd defer)
- [x] All Low priority carry-overs from HANDOFF_5P closed (items 2 + 3 + 4)
- [x] No hot-fix events
- [x] Q1 carry-over forward documented (this report §6 priority 1)
- [x] No new audit items added — closes existing carry-overs only
- [x] Lesson #30 sub-pattern documented commentary (pre-formal)
- [x] Lesson #35 second empirical validation noted

**Route table `/v2/*` UNCHANGED** — 5P closes carry-overs from existing routes, не adds new routes.

**12-streak preserved.** Past three-quarters milestone reached (17/22 = 77.3%).

**Closing note:** 5P demonstrates Lesson #35 toolkit empirical robustness — bug-bundle-tier prediction held under second test scenario (P2 setInfo). Lesson #30 path D invert default surfaced concrete sub-pattern application (P3 HudClanEmpty self-contained shape). Carry-over accumulation control achieved (4 → 1) — clean ledger entering 5Q.

5Q decision: feature work options ranked в HANDOFF_5Q. Backend Q1 still gated на runtime access strategy decision; if logs accessible → dedicated debug sub-epic, otherwise feature work (γ AI Trainer / ζ Retirement / ε FightClub / etc.) takes priority.
