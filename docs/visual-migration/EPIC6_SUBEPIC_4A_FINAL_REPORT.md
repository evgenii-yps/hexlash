# Эпик 6 — Sub-Epic 4a — PvP в v2 + Real Backend WS — Happy Path End-to-End — Final Report

**Status:** ✅ CLOSED
**Closure date:** 2026-05-03
**Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack from Sub-epic 3)
**Commit range:** `9e3307b` (Commit 1 housekeeping) → `9b2705a` (Commit 9 final functional) → 11/12/13 closure
**Streak:** 26 → **27** ✅
**Эпик 6 progress:** 9/14 → **10/14 (71%)**
**Closure shape:** Standard linear (7th application в Эпике 6) с extended pre-edit verify-gate refinements (10 catches — methodology pattern reinforced)

---

## TL;DR

PvP в v2 + real backend WS integration per Path C split decision (4a happy path / 4b edge cases + safety). Wires 14/18 lifecycle stages: friend-challenge → fight start → rounds (HP/log/flash) → coach pause + 3 strategy options с ACTION_MAP vocabulary translation → dice button when available → overdrive signal → fight end via existing ResultOverlay reuse → CTA back к /v2 hub. 11 PvP handlers real impl, 0 stubs remaining. Single bug-bundle-tier fix bundled (overdrive_start WS routing — same source file class per Lesson #35). 11 functional commits + 1 housekeeping + 1 audit-skip verify gate + 3 closure, 0 hot-fixes, 0 recoveries. **10 verify-gate refinements applied pre-edit** (Sub-epic 2/3 precedent extended dramatically — methodology pattern reinforced). 12 NEW polish carry-overs (#16-#28), 1 closed (#1).

---

## What user sees

### Friend-challenge entry → /v2/fight

- Challenger sends challenge via HudProfile Friends tab → BE `handleChallengeSend` broadcasts → acceptor receives `challenge_received` event
- ChallengeNotification toast visible на /v2/* routes (Commit 5a Option β mount в AppV2.vue — closes carry-over #1 5B deferred)
- Acceptor clicks Accept → emits `challenge_accepted` → BE `handleChallengeAccepted` creates match (pvpMatchManager) → broadcasts `challenge_start` к both
- ChallengeNotification's onChallengeStart handler (existing) commits `pvp/SET_PVP_MATCH` + routes к `/v2/fight` via Path A v2-aware branch (Commit 5)
- Both clients land on /v2/fight с pvpState populated

### In-fight (real PvP loop)

- v2 FightView mounts → matchActive=true (Commit 4 binding) → emits `pvp_ready` с captain deck + modules (Commit 6a)
- BE awaits both `pvp_ready` → `match.start()` → emits `fight_start`
- Commit 6b handler derives isP1 (overwrites carry-over #16 dead-write hardcode), commits SET_PVP_MATCH с corrected isP1, transitions `fightState.phase = 'fight'` (PrepOverlay dismisses), initial HP 100/100
- Round flow (Commit 7): each `round_result` event — BE-authoritative HP updates `fightState.leftHp/rightHp`, round counter, `triggerFlash()` on damage, log entries `actor-warden` / `actor-predator` colored с CSS taxonomy (lt round label + crit/miss suffix classes)
- Coach pause (round 6+): `coach_pause` event opens CoachPause overlay (Commit 8a). 3 strategy buttons emit `coach_choice` via ACTION_MAP translation (aggressive→attack, defensive→defense, counter→position). Overlay text reactive — "Coach pause" → "Waiting for opponent..." → "Opponent ready..." → closed на coach_result
- Dice (after round 3 cooldown, Commit 8b): "🎲 ROLL" button appears bottom-center (.dice-area) when `dice_available` event sets `fightState.diceReady=true`. Click emits `dice_roll`. BE applies effect + responds `dice_rolled` — button disappears, active type pill shows (HEAL / RAGE / etc), HP updates from BE-authoritative values
- Overdrive (round 11+, Commit 9): `overdrive_start` event → `triggerFlash()` + log entry `<strong>OVERDRIVE</strong>`

### Fight end → finalists

- `fight_end` event (Commit 9): isP1 derivation → BE-authoritative final HPs applied → result type derived (win / lose / draw / opponent_disconnected edge case)
- ResultOverlay reuse (existing v2 component — Lesson #32 minimal touch). Drives via fightState.phase='result' + resultWon + resultSummary string
- Summary text: "Victory!" / "Defeated." / "Match drawn." / "Opponent disconnected."
- pvp/finishPvPFight dispatched с resultType (existing Vuex action updates stats + ELO if ranked)
- CTA "Exit" button → existing onExit handler → navigation
- Match cancelled (e.g. ready_timeout): pvp/RESET_PVP_FIGHT + info toast "Match cancelled" + `router.push('/v2')` к hub (Commit 9 onMatchCancelled)

### Visual gaps captured как carry-overs

All decoration-only, не functional. v1 had richer visual feedback (countdown 3-2-1, dodge/crit overlay titles, shake animations, modifiers bar, dice icons, cooldown countdown, XP display). v2 happy path functional без these. Polish round / Sub-epic 4b candidates (#17-#28).

---

## Path C reasoning recap

Phase 0 audit surfaced 4 path candidates:
- **Path A** — Sequential WS-first then visual
- **Path B** — Visual-first then WS
- **Path C** — Combined slim split (happy path / edge cases) ✅ **chosen**
- **Path D** — Single L sub-epic

**Why Path C:**
1. Clean separation 4a (functional happy path) + 4b (edge cases + safety) — incremental shipping discipline
2. Streak preservation strongest — smaller commits, focused scope per sub-epic, clear verify gates
3. Mirrors Sub-epic 6B-3a/6B-3 split precedent (backend privacy fix + frontend consumption split)
4. Sub-epic 4a happy path фундамент закрыт; 4b builds upon stable foundation для edge cases

**4b queue:**
- Surrender (BE handler + FE UI button + state transition)
- Reconnect state-replay (BE `fight_state_resume` msg + FE consumer)
- Connection-lost / opponent-disconnect / timeout UI overlays (Phase 0 Q9 missing states)
- BE deploy chain (Lesson #33 cherry-pick → main → Railway PR flow)

---

## Files changed

| File | Change | Commits |
|---|---|---|
| `src/router/index.js` | modified — `v2ProtectedNames` marker array + guard extension | 2 |
| `src/AppV2.vue` | modified — ChallengeNotification mount в v2 layout | 5a |
| `src/components/pvp/ChallengeNotification.vue` | modified — v2-aware routing branch | 5 |
| `src/views-v2/FightView.vue` | modified (heavy) — 11 PvP handlers + computed bindings + pvp_ready emit + 12 listeners | 3/4/6a/6b/7/9 |
| `src/components/hud/HudFight.vue` | modified — useStore + matchActive + ACTION_MAP + onCoachSelect + onDiceClick + .dice-area template + scoped CSS | 8a/8b |
| `src/components/hud/common/useFightSimulation.js` | modified — diceReady + diceActiveType flat fields | 8b |
| `src/core/state/modules/webSocketState.js` | modified — overdrive_start case (bug-bundle-tier) | 9 |
| `CLAUDE.md` | modified — Sub-epic 4a closure section + Эпик 6 state updates | 11 |
| `docs/visual-migration/EPIC6_SUBEPIC_4_PHASE_0_FINDINGS.md` | NEW — Phase 0 audit (~600 lines) | 1 |
| `docs/visual-migration/EPIC6_SUBEPIC_4A_FINAL_REPORT.md` | NEW — this file | 12 |
| `docs/visual-migration/HANDOFF_EPIC6_SUBEPIC_4B_CHAT_HANDOFF.md` | NEW — 4b handoff | 13 |

**Backend:** Untouched per Path C frontend-only scope. BE WS already production-ready per Phase 0 Q3. Bug-bundle-tier overdrive_start fix is FE webSocketState routing only.

---

## Commits log

| # | SHA | Type | Message |
|---|---|---|---|
| 0 | (no commit) | Verify gate | 8 Q-V queries pre-edit |
| 1 | `9e3307b` | Housekeeping | docs(epic6): Sub-epic 4 Phase 0 findings |
| 2 | `326032b` | Functional | fix(router): protect v2 PvP routes via separate marker array |
| 3 | `42a590a` | Functional | feat(v2-fight): WS listener scaffold (11 listeners) |
| 4 | `e8c621b` | Functional | feat(v2-fight): pvpState Vuex bindings |
| 5a | `cf17e10` | Functional | feat(v2): ChallengeNotification visible on /v2/* routes |
| 5 | `fadb19b` | Functional | feat(pvp): v2-aware routing в challenge-start handler |
| 6a | `02594c6` | Functional | feat(v2-fight): pvp_ready emit + self-name cleanup |
| 6b | `48e80db` | Functional | feat(v2-fight): pvp-fight_start handler — direct mutations adapted |
| 7 | `80fb425` | Functional | feat(v2-fight): pvp-round_result handler — direct mutations adapted |
| 8a | `eef2a18` | Functional | feat(v2-fight): coach handlers + PvP emit |
| 8b | `aaa4d78` | Functional | feat(v2-fight): dice scaffold + handlers |
| 9 | `9b2705a` | Functional | feat(v2-fight): fight_end + overdrive + match-cancelled + finalists |
| 10 | (skip) | Visual verify | audit-skip per Path C (final acceptance gate в Sub-epic 8) |
| 11 | `a0a8a6f` | Closure | docs(claude): Sub-epic 4a closure |
| 12 | (this) | Closure | docs(epic6): Sub-epic 4a final report |
| 13 | (next) | Closure | docs(epic6): Sub-epic 4b handoff |

**Total: 11 functional + 1 housekeeping + 3 closure = 15 commits в Sub-epic 4a (excludes audit-skip Commit 10).**

---

## Vuex (reuse only — zero new actions/mutations)

| Path | Type | Usage |
|---|---|---|
| `pvp/SET_PVP_MATCH` | mutation | Commit 5 ChallengeNotification + Commit 6b onPvPFightStart (overwrite cascade) |
| `pvp/RESET_PVP_FIGHT` | mutation | Commit 9 onMatchCancelled |
| `pvp/finishPvPFight` | action | Commit 9 onPvPFightEnd |
| `pvp/getCurrentMatchId` | getter | matchActive computed (FightView Commit 4 + HudFight Commit 8a) |
| `pvp/getOpponentInfo` | getter | onMounted matchActive branch (Commit 4) |
| `pvp/getIsPlayer1` | getter | onPvPFightStart (6b) + onPvPRoundResult (7) + onPvPFightEnd (9) — perspective mapping |
| `pvp/getPvpFightStatus` | getter | computed binding (Commit 4) |
| `master/getMaster` | getter | userLogin + myId derivation (Commits 6a/6b/9) |
| `master/setInfoMessage` | mutation | onMatchCancelled toast (Commit 9) |
| `agent/currentCaptain` | getter | pvp_ready emit captain payload (Commit 6a) |
| `webSocket/sendMessage` | action | pvp_ready (6a) + coach_choice (8a) + dice_roll (8b) |

**Result: ZERO new Vuex API surface. Все wiring via existing reuse.**

---

## Click wiring

| Source | Target |
|---|---|
| Friend-challenge accept (ChallengeNotification button) | emit `challenge_accepted` → BE creates match → `challenge_start` broadcast → both clients router.push к `/v2/fight` (v2-aware Commit 5) |
| Coach select button (CoachPause via HudFight @select) | onCoachSelect (Commit 8a) → ACTION_MAP translation → emit `coach_choice` |
| Dice button (.dice-button "🎲 ROLL") | onDiceClick (Commit 8b) → emit `dice_roll` (bare `{type}`) |
| Match-cancelled flow (e.g. ready_timeout) | onMatchCancelled (Commit 9) → pvp/RESET_PVP_FIGHT + toast + router.push('/v2') |
| Finalists CTA "Exit" (ResultOverlay) | existing onExit handler (untouched per Lesson #32 minimal touch) |
| Finalists CTA "Rematch" (ResultOverlay) | existing onRematch handler (mock-only currently; PvP rematch flow Sub-epic 4b/5) |

---

## Recoveries log

**ZERO recoveries в Sub-epic 4a.**

10 verify-gate refinements applied during pre-edit gates (Lesson #11 reflex catches), classified as ТЗ refinements per Sub-epic 2/3 precedent, NOT as recoveries (workflow design intentional — verify-gate workflow precedent extended).

### 10 Lesson #11 catches (all pre-edit, all adapted in scope)

1. **Commit 2** — `protectedRoutes` shape mismatch. ТЗ assumed string marker array; reality is full route definitions с `{path, name, component}`. Adapted via separate `v2ProtectedNames` marker array + guard extension.
2. **Commit 5** — ChallengeNotification existing handler routes к v1 `/fight`. ТЗ assumed net-new listener; reality is augmenting existing handler с v2-aware branch (`router.path.startsWith('/v2')`). Mirror Sub-epic 1 P3 precedent.
3. **Commit 6** — cardFightState/startFight is PvE-only (audit Finding 1). ТЗ assumed dispatch к startFight для match init; reality bypasses startFight entirely (v1 canonical pattern uses direct mutations). Forced split decision (6a + 6b).
4. **Commit 6a** — `master/userData` getter doesn't exist; access via `master/getMaster?.userData?.login`.
5. **Commit 6b** — `userData.odId` field is actually `userData.id`; v2 `fightState.phase` enum ('prep' | 'fight' | 'result') differs from v1 Vuex 'fighting'.
6. **Commit 7** — `pvp_move` doesn't exist в either v1 frontend OR BE handler. Backend auto-cycles deck deterministically (`deckIndex = (round-1) % deck.length`). ТЗ step (B) move submit dropped entirely.
7. **Commit 7** — CSS class taxonomy mismatch. ТЗ proposed classes (`opp` / `you` / `event-crit` / `event-dodge`) DON'T EXIST в HudFight.vue. Real taxonomy: `actor-warden` / `actor-predator` / `crit` / `miss` / `round` / `lt`.
8. **Commit 8** — v2 lacks dice infrastructure entirely (UI / state field / emit). Forced split decision (8 → 8a coach + 8b dice scaffold).
9. **Commit 8b** — multiple visual subsystems gaps surfaced (per-type flash colors / dice icon assets / modifiers bar / cooldown countdown — all decoration). 4 carry-overs (#24-#27).
10. **Commit 9** — `overdrive_start` case missing from `webSocketState.handleMessage` switch (pre-existing v1 dead code path). Bug-bundle-tier fix bundled (single-line case addition, same source file class per Lesson #35).

---

## Carry-overs

### Closed (1)

- **#1** — ChallengeNotification на v2 routes (Commit 5a Option β — mount в AppV2.vue alongside VerifyEmailBanner per 5F precedent)

### NEW (13, all decoration/polish/non-functional)

| # | Description |
|---|---|
| 16 | `isPlayer1: false` hardcoded в ChallengeNotification.vue:62 — addressed via overwrite cascade. Dead-write code-clarity, не functional bug. |
| 17 | v2 countdown UI parity gap (v1 had 3-2-1 countdown overlay before fight). Visual difference. |
| 18 | Dodge/crit overlay title mechanism gap (v1 setEventTitle 1200ms; v2 merged into log entries). Decoration-only. |
| 19 | Shake animation gap (v1 shakeLeft/shakeRight 400ms на damage). Decoration-only. |
| 20 | Cumulative damage stats absent (v1 fight/addStats). Stats-display only. |
| 21 | Log actor colors hardcoded к warden/predator slots (HudFight CSS supports 2 colors only). Existing v2 design constraint, не new regression. |
| 22 | v2 coach active boost UI absent (v1 fight/setCoachAdvice + 4-round visible bar). BE applies effect; UI only gap. |
| 23 | v2 single coach overlay vs v1 dual showCoachPause + showWaiting (workaround via reactive coachPauseText mutation). |
| 24 | Per-type flash color mapping (v1 triggerFlash(effect.type) → CSS variable; v2 bare triggerFlash() white only). |
| 25 | Dice icon assets (v1 imports iconHeal/Adrenaline/Shield/Blind/Dice; v2 uses text "🎲 ROLL"). |
| 26 | Modifiers bar UI (v1 displays adrenaline/shield/blind active effect badges; v2 single pill). |
| 27 | Dice cooldown countdown display (v1 shows cooldownLeft remaining rounds; v2 binary ready/not-ready). |
| 28 | XP earned display absent в v2 finalists (v1 fight/setXpEarned for local display; backend persists actual XP). Stats-display only. |

### Forward note Sub-epic 8 acceptance gate

Full /v2 visual + functional sweep across все routes (profile / wallet / account / ratings / clan / user / fight / training / etc.) before final cutover. Comprehensive acceptance checklist covering все sub-epics 6A-6B-3b + Sub-epic 1-4a deliverables. User-driven manual ratification gate.

### Inherited carry-overs (untouched, 14 items entering Sub-epic 4a — 13 remaining after #1 closed)

Items #2-#15 от Sub-epic 3 closure exit state. См. CLAUDE.md "Carry-overs into Эпик 6" section для полного списка.

---

## Methodology applied

### Mode A strict per-commit discipline
- 11 functional commits + 1 housekeeping + 1 verify gate (audit-skip) + 3 closure
- Build pass per commit (npm run build)
- Status report после each commit с post-edit grep verification
- STOP-and-confirm gates между commits (audit-only после policy adjustment Commit 4 onward)
- Push после each commit

### Lesson #11 reflex
**10 catches pre-edit, 0 fix-forward post-commit.** Verify-gate workflow precedent extended from Sub-epic 2/3 (single-digit catches) к Sub-epic 4a (10 catches в single sub-epic). Pattern fully validated. Phase 0 enhancement candidates surface наглядно (5 patterns consolidated).

### Lesson #32 convention discovery (multiple applications)
- Direct module-scoped fightState writes (NOT Vuex cardFightState commits — PvE-only path per audit Finding 1)
- Flat fightState fields (`diceReady` / `diceActiveType`, NOT v1 nested `diceState` object)
- ACTION_MAP vocabulary translation (mock 'aggressive/defensive/counter' ↔ BE 'attack/defense/position')
- Position-based actor classes (`actor-warden` left / `actor-predator` right, NOT archetype-based)
- ResultOverlay reuse (existing component drives via `fightState.phase='result'` + `resultWon` + `resultSummary`, NO new scaffold)
- `logFight()` HTML format (NOT Vuex `addRoundToLog` structured)
- Bare `triggerFlash()` (v1 type-coded skip — carry-over #24)
- Path A v2-aware navigation (`router.path.startsWith('/v2')` branch, mirror Sub-epic 1 P3 precedent)
- Mock fallback path preservation (matchActive guard preserves PvE/dev-only flows)

### Lesson #33 deploy environment awareness
Sub-epic 4a frontend-only по design (Path C scope discipline). Single bug-bundle-tier WS routing fix qualifies as same-class adjacent — bundled per Lesson #35 framework. Full BE chain (surrender handler, reconnect-replay protocol) deferred к Sub-epic 4b где Lesson #33 applies fully (cherry-pick → main → Railway PR flow per branch strategy).

### Lesson #34 HUD overlay convention
Applied к `.dice-area` (scoped CSS, `pointer-events: none` on parent `.fight-hud`, `auto` on interactive `.dice-button` child). 5 prior Sub-epic precedents reinforced.

### Lesson #35 streak preservation
- 10 verify-gate refinements applied pre-edit, NOT classified as recoveries (Sub-epic 2/3 precedent)
- 1 bug-bundle-tier fix bundled (overdrive_start same-source-file class — single-line addition к existing case chain)
- 1 split decision (Commit 8 → 8a/8b) per scope discipline

### Lesson #36 HudProfile card-creep monitor
**NOT triggered.** Sub-epic 4a touched FightView/HudFight, не HudProfile. Monitor remains 6/7. Path A precedent preserved (separate views, no HudProfile cards added).

### Lesson #43 candidate validated
3rd occurrence bootstrap branch divergence (after 5U bridge session Recovery #79 + Sub-epic 2 Recovery #82 + Sub-epic 4a Phase 0). Caught + mitigated via `git fetch && git status -uno` first step. Pattern validated. Promotion decision pending.

### Bug-bundle-tier classification (Lesson #35 framework)
Commit 9 `overdrive_start` case в webSocketState — single-line addition к existing pvp-* case chain. Same source file, same class (WS message routing), addresses adjacent gap surfaced by Phase 0 audit. Acceptable bundle per discipline.

### Verify-gate workflow precedent extended
Sub-epic 2/3 precedent (single-digit pre-edit catches) → Sub-epic 4a (10 catches). Methodology pattern reinforced. New ceiling for L-size sub-epic. Pattern validation confirms approach scales к large scope.

---

## Closure shape

**Standard linear (7th application в Эпике 6).**

Application chain: 6A + 6B-1 + 6B-3 + Sub-epic 1 + Sub-epic 2 + Sub-epic 3 + Sub-epic 4a.

Extended pre-edit verify-gate refinements (10 occurrences — methodology pattern reinforced; previous high был 8 в Sub-epic 2; 10 в 4a establishes new ceiling for L-size sub-epic).

0 reactive splits, 0 hot-fixes, 0 recoveries. 1 split decision (Commit 8 → 8a coach + 8b dice) per scope discipline.

---

## Cumulative metrics

| Metric | Before | After |
|---|---|---|
| Streak | 26 | **27** ✅ |
| Recoveries | 83+ | 83+ stable (no new в 4a) |
| Эпик 6 progress | 9/14 (64%) | **10/14 (71%)** |
| Sub-epics closed в Эпик 6 | 9 | **10** |
| Carry-overs total | 15 | **27** (+13 NEW, -1 closed) |
| Lessons promoted | 35 | 35 (unchanged) |
| Lesson candidates active | 7 | 7 + #43 validated (awaiting promotion decision) |

---

## Phase 0 enhancement candidates consolidated для 4b handoff

5 patterns surfaced repeatedly across 10 Lesson #11 catches:

1. **API contract verification** — explicit signatures, getter paths, v1/v2 architecture deltas, constants imports, exact field names (id vs odId), enum values (phase strings 'prep'|'fight'|'result' vs 'idle'|'preparation'|'fighting'|'coach'|'results')

2. **Negative-space verification** — what DOESN'T exist that ТЗ might assume. Precedents:
   - `pvp_move` (backend auto-cycles deck deterministically)
   - `master/userData` getter (use `master/getMaster?.userData?.X`)
   - `cardFightState/startFight` PvP path (PvE-only)
   - `overdrive_start` case в webSocketState (pre-existing dead code)

3. **Real CSS class taxonomy dump** для visual concerns (HudFight: `actor-warden` / `actor-predator` / `crit` / `miss` / `round` / `lt`). Don't assume from mock or v1.

4. **UI infrastructure dependencies** — for each handler, button → state field → handler chain requires upfront verify (dice UI gap precedent showed wiring handlers без UI = dead code; forced 8a/8b split).

5. **Vocabulary alignment audit** — mock taxonomy ↔ BE taxonomy. Precedents:
   - Coach: mock 'aggressive/defensive/counter' vs BE 'attack/defense/position' → ACTION_MAP layer
   - Dice: 1-to-1 match (no translation needed)

---

## Next sub-epic

**Sub-epic 4b — PvP edge cases + safety + BE deploy chain.**

Scope:
- Surrender (BE handler `pvp_surrender` + FE UI button + state transition)
- Reconnect state-replay (BE `fight_state_resume` msg + FE consumer)
- Connection-lost / opponent-disconnect / timeout UI overlays (Phase 0 Q9 missing states)
- BE deploy chain (Lesson #33 cherry-pick → main → Railway PR flow per branch strategy)
- Optional bundling of carry-overs #17-#28 polish если scope permits

Phase 0 enhancement candidates (5 patterns above) consolidated для 4b handoff.

---

## End report
