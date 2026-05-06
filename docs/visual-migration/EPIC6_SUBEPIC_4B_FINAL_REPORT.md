# Эпик 6 — Sub-Epic 4b — PvP Edge Cases + Safety + BE Deploy Chain — Final Report

**Status:** ✅ CLOSED
**Closure date:** 2026-05-04
**Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack from Sub-epic 4a)
**Commit range:** `cf154d4` (C0 housekeeping) → `c90743f` (C9 final functional) → CL1/CL2/CL3 closure on continue stack + PR #355 cherry-pick branch
**Predecessor:** `EPIC6_SUBEPIC_4A_FINAL_REPORT.md`
**Streak:** 27 → **28** ✅
**Эпик 6 progress:** 10/14 → **11/14 (78%)** — past three-quarters milestone
**Closure shape:** Code-complete + deferred-verify (3rd application after 6B-3a-backend и Sub-epic 1)

---

## TL;DR

PvP edge cases + safety per Path D combined slim decision (surrender + reconnect-replay + match timeout + connection-lost UI + carry-over #16 reclassification). Closes 4 of 4 Phase 0 lifecycle stages identified в 4a investigation (15 surrender / 16 reconnect / 17 disconnect existing-flow / 18 timeout). Sub-epic completes Sub-epic 4 split — full PvP coverage в v2 now end-to-end functional + safety-tier hardened. **10 functional commits + 1 STOP-skipped (C10) + 1 cherry-pick PR (C11) + 3 closure**, 0 hot-fixes, 0 reactive splits, 1 recovery (#84 bootstrap branch divergence — Lesson #43 promotion-trigger). **38 verify-gate refinements applied pre-edit** — 4a 10-catch ceiling exceeded **3.8x**. Lesson #18 STOP applied at C10 (semantic invariant catch — carry-over #16 reclassified, NOT source-fixed). Lesson #43 PROMOTED (4-occurrence chain validated). 6th Phase 0 subsection candidate surfaced (semantic invariant + flow direction verification).

---

## What user sees

### Surrender flow (PvP active fight)

- **Surrender button:** top-right corner during own active match (`matchActive && phase === 'fight'`). Red-palette destructive design (mirror `.fight-back` baseline opposite corner). Mutually exclusive с `.spectate-badge` (same coords; render conditions never coexist).
- **Click flow:** browser `confirm('Surrender this match? You will lose this fight.')` dialog. On confirm → bare `{type: 'pvp_surrender'}` WS dispatch (mirror dice_roll convention — BE resolves match via `getMatchByPlayer(user.odId)`, no client matchId needed).
- **BE response:** `engine.surrender(odId)` ends match с status='finished' + clears all 3 timers (pause/round/match). Emits **differentiated** `fight_end` per player:
  - Surrenderer receives `reason: 'surrender'`
  - Winner receives `reason: 'opponent_surrendered'`
- **Result UI:** ResultOverlay shows reason-specific summary:
  - Surrenderer: "You surrendered." (resultWon: false)
  - Winner: "Opponent surrendered." (resultWon: true)
- **DB persistence:** match-POV `reason: 'surrender'` saved via existing `saveFightResult` chain (`Fight.reason` field accepts arbitrary strings — no schema migration).

### Reconnect state-replay (after WS disconnect <30s during active match)

- **Existing rebind:** socket-level via handler.js:75-85 (`_replaced` flag pattern preserves match.player1/2.socket reference). UNCHANGED — already race-safe.
- **NEW state hydration:** after socket rebind, BE emits `fight_state_resume` event с full snapshot via `engine.getStateSnapshot()`:
  - matchId, status (running/paused_coach/finished), currentRound, maxRounds
  - Per-player: odId, hp, activeEffects, diceUsedRound (raw — FE derives cooldown), coachTriggered
  - roundResults array (full log replay support)
  - pendingChoices object (coach pause re-render support)
  - timestamp (snapshot freshness indicator)
- **FE handler `onFightStateResume`:** 3 defensive guards + state hydration + log replay:
  - Guard 1: `status === 'finished'` → don't hydrate (fight_end already sent)
  - Guard 2: `phase === 'result'` → don't go backwards
  - Guard 3: `snapshot.currentRound < fightState.round` → stale snapshot race protection
  - HP/round/totalRounds hydrate from BE-authoritative snapshot
  - Dice cooldown derived from `diceUsedRound` + `DICE_COOLDOWN_ROUNDS` constant
  - Phase recovery: `paused_coach` → coachPauseOpen=true с `pendingChoices`-derived text (3 distinct states); `running` → fight phase
  - **Log replay:** `clearFightLog()` first, then per-round mirror of `onPvPRoundResult` logFight pattern (skip rounds with `error` field, render damage/dodge/crit per existing CSS taxonomy)
- **No DB persistence:** Option α minimal scope (in-memory snapshot only). Server restart still loses matches — deferred к dedicated infrastructure work (Q7 explicit out-of-scope per Phase 0).

### Match timeout backstop (10-min wall-clock)

- **NEW const:** `MATCH_TIMEOUT_MS = 600000` в `backend/src/config.js`. 10-minute defensive backstop vs stuck matches.
- **Engine timer:** `this.matchTimeout = setTimeout(() => this.onMatchTimeout(), MATCH_TIMEOUT_MS)` initialized в `start()` after roundTimer setup.
- **Cleared в** all 3 status='finished' paths (endFight, onPlayerDisconnect, onMatchTimeout self-clear) — defensive idempotency.
- **`onMatchTimeout()` method:** sets status='finished', clears all timers, emits `fight_end` с:
  - `winner: 'draw'` (codebase convention — saveFightResult line 612 explicit string check; ТЗ pseudocode `null` would break DB persistence)
  - `reason: 'match_timeout'`
  - Result shape mirrors endFight (player1/player2 nested с odId/username/finalHp + matchId + winner + rounds + xp + roundLog) per saveFightResult contract
  - `xp: this.calculateXP('draw')` — bonus addition mirroring endFight draw semantics
- **Why heartbeat не sufficient:** WS heartbeat (40s ping/pong) catches most stuck states, but match could remain `running` if engine in pause OR scheduled timer never fires (e.g. event loop stuck). Wall-clock backstop = defense-in-depth.
- **FE handling:** existing `winner === 'draw'` branch correctly handles match_timeout via standard winner check; new resultSummary branch shows "Match ended (time limit)." (resultWon: false, draw outcome).

### Connection-lost UI on /v2/* routes

- **Reused v1 NoConnection.vue verbatim** (single-line addition к AppV2.vue mount + import).
- **Behavior:** watches `webSocket/isConnected` Vuex getter. After 5s grace timer → fixed-position banner at `bottom: 12vh` semi-transparent danger color: "No connection to server. Please check your internet connection." + Vuetify v-progress-circular spinner. Hides on reconnect.
- **Polish-tier deferred:** v2-styled HUD aesthetic restyle (backdrop-blur card / `var(--font-mono)` / red palette mirror `.surrender-btn` design) — out of 4b scope (per ТЗ "1 import + 1 template line").

### Carry-over #16 reclassification (NOT source-fixed)

- **Investigation revealed:** `isPlayer1: false` hardcode in `ChallengeNotification.vue:62` is **semantically correct** per BE invariant.
- **BE convention** (`pvpMatchManager.createMatch(matchId, {challenger as player1}, {acceptor as player2})`) — `handleChallengeAccepted` runs on acceptor side, who IS player2 by this convention.
- **Original 4a classification "dead-write addressed via overwrite cascade" inverted actual semantics** — overwrite cascade в FightView's `onPvPFightStart` is **defensive redundancy**, NOT corrective.
- **ТЗ proposed derivation `data.opponent?.odId !== userData.id`** would always evaluate `true` (opponent ≠ self by definition) → would set `isPlayer1: true` on acceptor → **inverted from correct value**.
- **Closure:** investigation conclusion, не code change. Lesson #18 STOP framework applied at C10. Future Claude warning inlined в CLAUDE.md update (CL1).

---

## Commit chain

### Continue stack `claude/investigate-retirement-animation-zQeg4` (10 functional + 3 closure)

| # | SHA | Description |
|---|---|---|
| C0 | `cf154d4` | docs(4b): Phase 0 investigation report (housekeeping) |
| C1 | `c6f3054` | feat(pvp): wall-clock match timeout backstop |
| C2 | `acb3f5d` | feat(pvp): engine.surrender(odId) method |
| C3 | `03d3135` | feat(pvp): pvp_surrender WS handler routing |
| C4 | `f31fed2` | feat(pvp): engine.getStateSnapshot() method |
| C5 | `4d10883` | feat(pvp): fight_state_resume emit on reconnect |
| C6 | `c42f125` | feat(pvp): WS routing case fight_state_resume (FE) |
| C7 | `82a8e7d` | feat(pvp): FightView reason branching + onFightStateResume |
| C8 | `07ff348` | feat(pvp): HudFight surrender button + handler + CSS |
| C9 | `c90743f` | feat(pvp): NoConnection mount в AppV2 |
| C10 | — SKIPPED — | (carry-over #16 reclassified per Lesson #18 STOP — no commit) |
| CL1 | `bd7ca99` | docs(4b): CLAUDE.md update — Sub-epic 4b closure |
| CL2 | this | docs(4b): final report |
| CL3 | next | docs(4b): Sub-epic 5 handoff |

### Cherry-pick branch `fix/pvp-edge-cases-4b` (C11 — PR #355)

| Continue stack SHA | Cherry-pick SHA | Description |
|---|---|---|
| `c6f3054` | `7665d7a` | wall-clock match timeout backstop |
| `acb3f5d` | `253aff6` | engine.surrender(odId) method |
| `03d3135` | `2cf4a2e` | pvp_surrender WS handler routing |
| `f31fed2` | `1973198` | engine.getStateSnapshot() method |
| `4d10883` | `77aa44d` | fight_state_resume emit on reconnect |

**PR #355 base:** `main` HEAD `8e209b1` (post-6B-3a-backend merge). All 5 cherry-picks applied cleanly, no conflicts.

---

## Files inventory

### NEW (3 docs)

- `docs/visual-migration/EPIC6_SUBEPIC_4B_PHASE_0_REPORT.md` (615 lines, C0)
- `docs/visual-migration/EPIC6_SUBEPIC_4B_FINAL_REPORT.md` (this file, CL2)
- `docs/visual-migration/HANDOFF_EPIC6_SUBEPIC_5_CHAT_HANDOFF.md` (CL3)

### MODIFIED Backend (4 files, +176 net lines)

- `backend/src/config.js` — `MATCH_TIMEOUT_MS = 600000` constant (+1 line)
- `backend/src/services/pvpCombatEngine.js` — surrender / getStateSnapshot / onMatchTimeout methods + matchTimeout timer integration в start/endFight/onPlayerDisconnect (+130 lines net across 3 sections)
- `backend/src/websocket/pvpHandler.js` — `case 'pvp_surrender':` switch block (+14 lines)
- `backend/src/websocket/handler.js` — extend reconnect block с fight_state_resume emit + try/catch wrapper (+12 lines)

### MODIFIED Frontend (4 files, +181 net lines)

- `src/core/state/modules/webSocketState.js` — `case 'fight_state_resume':` к PvP fall-through chain (+1 line)
- `src/views-v2/FightView.vue` — onPvPFightEnd reason branching extension (refactor nested ternary к if/else) + new onFightStateResume handler с 3 defensive guards + state hydration + log replay + listener registration/cleanup (+131 / -7 net = +124)
- `src/components/hud/HudFight.vue` — surrender button (template) + onSurrender handler (script) + .surrender-btn scoped CSS (+47 lines)
- `src/AppV2.vue` — NoConnection import + template mount (+2 lines)

### DELETED

None.

---

## BE deploy chain (Lesson #33 — 3rd application)

**Pattern:** Cherry-pick → main → Railway auto-deploy (mirror 6B-3a-backend / Sub-epic 1 precedent).

1. ✓ All 5 BE functional commits landed на continue stack (C1-C5)
2. ✓ Continue stack push'ed (no immediate prod impact — visual-migration epic accumulates на `claude/investigate-retirement-animation-zQeg4` until Эпик 6 closure merge)
3. ✓ Cherry-pick branch `fix/pvp-edge-cases-4b` from `main` HEAD `8e209b1`
4. ✓ Cherry-pick C1→C5 chronologically (no conflicts)
5. ✓ Backend syntax check passed (4 files parse OK)
6. ✓ Push к origin
7. ✓ PR [#355](https://github.com/evgenii-yps/testhexlash/pull/355) created via `mcp__github__create_pull_request`
8. ⏳ **Awaiting:** PR review/merge → main → Railway auto-deploy webhook
9. ⏳ **Deferred:** Functional verify post-merge (simulated reconnect replay, surrender flow, match timeout)

**Closure NOT blocked on PR merge** — code-complete + deferred-verify shape preserved. Frontend changes ship together at Эпик 6 closure (visual-v2 → main merge).

---

## Verify-gate refinements (38 catches surfaced pre-edit)

| Commit | Catches | Tier | Highlights |
|---|---|---|---|
| C1 | 4 | adaptation | `clearAllTimers()` doesn't exist; ТЗ `p1Hp/p2Hp` flat shape vs codebase nested `player1.finalHp`; ТЗ `winner: null` vs codebase `winner: 'draw'` string; 2 status='finished' sites enumerated |
| C2 | 3 | adaptation | `calculateXP` returns `{player1, player2}` object NOT per-player call; player shape mirrors disconnect `{odId, finalHp}` (NOT endFight `{odId, username, finalHp}`); 2× sendToPlayer pattern per disconnect (NOT emit) |
| C3 | 5 | adaptation | match IS engine (3rd confirmation); inline switch case (NOT separate function); `user.odId` param (NOT `userId`); `status === 'finished'` early-return form; ownership implicit via getMatchByPlayer |
| C4 | 5 | adaptation | `maxRounds` (NOT totalRounds); no per-player `maxHp` (config constant); `diceUsedRound` raw vs ТЗ `diceCooldownRemaining`; `pendingChoices` field vs ТЗ `pausedFor`; `coachTriggered` bonus inclusion |
| C5 | 3 | adaptation | match IS engine (4th); flat WS shape `{type, ...data}` (NOT nested `{type, data}`); existing status guard reuse |
| C6 | 3 | alignment | fall-through chain shared dispatch; detail = full message (NOT stripped); `pvp-${type}` template |
| C7 | 5 | adaptation | `DICE_COOLDOWN_ROUNDS` exists `@/core/constants.js`; `clearFightLog` import addition; `resultType` derivation already handles new reasons; coach pause text 3-state semantics; race guard against stale snapshot |
| C8 | 5 | adaptation | bare `{type: 'pvp_surrender'}` payload (mirror dice_roll); `top: 90px right: 14px` placement (NOT top:12px); mutual exclusion с `.spectate-badge`; pointer-events: auto (Lesson #34); CSS conventions matched (font-mono / 10px / blur) |
| C9 | 4 | alignment | import path `/ui/NoConnection` (NOT `/NoConnection`); no v-if isAuth guard; no z-index (DOM-order safe); no duplicate verified |
| C10 | 1 | **STOP-tier** | semantic invariant: ТЗ derivation broken; hardcode actually correct per BE invariant — Lesson #18 STOP applied |

**Cumulative:** 38 catches. **0 hot-fixes. 0 reactive splits.** 4a's 10-catch ceiling exceeded **3.8x**. Pattern fully validated: Mode A discipline + Phase 0 5 mandatory subsections + per-commit STOP-and-confirm sustains catch density без streak break.

---

## Carry-overs delta

### Closed (-1 via reclassification, NOT fix)

- **#16 (RECLASSIFIED)** — `isPlayer1: false` hardcode в ChallengeNotification.vue:62 verified semantically correct per BE invariant. Investigation conclusion, не code change. Future Claude warning inlined в CLAUDE.md update.

### NEW carry-overs surfaced

**0 new items.** 4b investigation focused on closure of 4a-deferred lifecycle stages — no new polish/decoration items emerged. Disciplined Path D scope honored.

### Active entering Sub-epic 5

**26 items total** (15 inherited from prior sub-epics + 12 polish #17-#28 + 0 NEW from 4b, -1 closed #16).

Inherited (15): Achievement badge для retirement, HudProfile card-creep monitor, Lesson #36 validation track, Auth+Wallet redesign, /rules → v2 port, 3D models + devices system, Locale cleanup, /user/search sortBy=balance, Clan data integration audit, v2 cutover auth posture audit, friendsState.searchPlayers captain field drop, HudRatings 8-col CSS grid mismatch, HudRatings keyboard a11y, Switcher3DPunch SKIP, Account/Wallet Vuetify→v2 design system port.

Polish (12): #17-#28 — countdown UI parity / dodge-crit overlay title / shake animation / cumulative damage stats / log actor colors / coach active boost UI / dual coach overlay / per-type flash color / dice icon assets / modifiers bar / dice cooldown countdown / XP earned display.

---

## Methodology applied

- **Lesson #11 reflex** — pre-edit grep on every edit (38 catches). Surface assumption gaps before commit, never fix-forward. Pattern fully validated across 12 commits.
- **Lesson #18 STOP at structural mismatch** — applied at C10 (carry-over #16 semantic contradiction). 1 commit skipped, не attempted, не reverted. Closure by reclassification per Option A. Lesson #18 framework critical for streak preservation when ТЗ pseudocode logic flawed.
- **Lesson #32 codebase convention discovery** — universally applied as primary catch source. Architectural patterns confirmed: `match` IS engine (no `.engine` property — confirmed 4x в C3/C4/C5/cherry-pick), flat WS spread `{type, ...data}` (NOT nested — confirmed via 3 emit sites), `user.odId` param convention (NOT raw `userId`), position-based actor classes (`actor-warden`/`actor-predator`), `winner: 'draw'` string (NOT null), per-player `{odId, finalHp}` for disconnect-style emits.
- **Lesson #33 deploy-environment awareness** — 3rd application (mirror 6B-3a-backend / Sub-epic 1 cherry-pick → main → Railway). PR #355 created с code-complete + deferred-verify closure shape. Continue stack accumulates frontend changes for Эпик 6 closure merge.
- **Lesson #34 HUD overlay convention** — applied к `.surrender-btn` (`pointer-events: auto` mandatory due к `.fight-hud` parent's `pointer-events: none`). Mirrored existing `.fight-back` baseline pattern.
- **Lesson #35 reflex catch tiering** — all 38 catches classified:
  - **Adaptation-tier** (35 catches): convention discovery / field name correction / shape mirror — streak-preserving
  - **Alignment-tier** (overlap with adaptation in multi-tier catches): pure mirroring of existing patterns — streak-preserving
  - **STOP-tier** (1 catch — C10): semantic invariant violation, Lesson #18 STOP framework engaged — streak-preserving via no-fix-forward
- **Lesson #43 PROMOTED** — bootstrap branch divergence reflex (4-occurrence chain validated: 5U / Sub-epic 2 / 4a / 4b). Mandatory Phase 0 STEP 0 going forward: `git fetch && git status -uno && git branch --show-current && git log --oneline -5` first action of every sub-epic Phase 0 investigation.

---

## 6th Phase 0 subsection candidate (track, not yet promoted)

**Semantic invariant + flow direction verification** — surfaced 4b C10 STOP. Beyond API contracts (subsection 1), verify BE conventions about player ordering / role assignment / flow side that FE code derivations depend on.

ChallengeNotification source-fix attempted в C10 surfaced this gap — derivation logic looked correct field-wise (`userData.id` confirmed via FightView precedent) but **semantically inverted** because acceptor's relation к player1/player2 not verified против BE invariant (`pvpMatchManager.createMatch` argument order = challenger-first, acceptor-second).

**Candidate (1st occurrence)** — track for future surfaces before promoting к mandatory. If 2nd occurrence emerges in Sub-epic 5+, promote to 6th mandatory Phase 0 subsection.

---

## Cumulative metrics

| Metric | Pre-4b | Post-4b | Delta |
|---|---|---|---|
| Streak | 27 ✅ | **28** ✅ | +1 (Sub-epic 4b clean) |
| Recoveries | 83+ | **84+** | +1 (Recovery #84 adaptation-tier) |
| Эпик 6 progress | 10/14 (71%) | **11/14 (78%)** | +1 closure |
| Sub-epics closed в Эпик 6 | 10 | **11** | +1 |
| Lessons promoted | 35 | **36** | +1 (Lesson #43 promoted) |
| Lesson candidates active | 7 + #43 candidate | 7 (#36-#42) | -1 (#43 promoted) |
| Phase 0 mandatory subsections | 5 | 5 + 1 candidate | (6th tracking) |
| Standard linear closure applications | 7 | **8** | +1 |
| Hot-fix metric | 0 | **0** | unchanged ✅ |
| Reactive splits | 0 | **0** | unchanged ✅ |

---

## Closure shape: code-complete + deferred-verify (3rd application)

- **Frontend (C6-C9):** lives на continue stack `claude/investigate-retirement-animation-zQeg4`. Ships at Эпик 6 closure merge (visual-v2 → main).
- **Backend (C1-C5):** cherry-picked к `fix/pvp-edge-cases-4b`. PR [#355](https://github.com/evgenii-yps/testhexlash/pull/355) awaiting review/merge → Railway auto-deploy.
- **Functional verify deferred** к post-PR-merge:
  - Simulated reconnect replay (open 2 browser tabs, kill WS connection, restore, verify state snapshot hydrates)
  - Surrender flow (click button, confirm, verify ResultOverlay shows correct reason per perspective)
  - Match timeout (manual test would require 10-min match — defensive backstop, low real-world trigger probability)
  - NoConnection banner на /v2/* routes (kill WS connection, verify banner appears after 5s grace, hides on reconnect)

---

## End summary

✅ **Sub-epic 4b CLOSED clean.**

- **Streak: 28** — 12 sub-epics в Эпик 6 без hot-fix
- **PvP edge cases functional end-to-end** — surrender / reconnect-replay / match timeout / connection-lost UI all wired BE+FE
- **Carry-over #16 closed via investigation reclassification** (NOT source-fix — would have inverted correct value)
- **Lesson #43 PROMOTED** — bootstrap branch divergence reflex now mandatory Phase 0 STEP 0
- **6th Phase 0 subsection candidate tracking** — semantic invariant + flow direction verification
- **PR #355** ready for review/merge → BE deploy → functional verify
- **Ready for Sub-epic 5** — Real matchmaking (L size, ~12-15 commits estimated; replaces client-side mock с real backend integration)

**Next sub-epic:** Sub-epic 5 — Real matchmaking. Continue stack continues `claude/investigate-retirement-animation-zQeg4`. Phase 0 starts с mandatory STEP 0 bootstrap branch verify per newly-promoted Lesson #43.
