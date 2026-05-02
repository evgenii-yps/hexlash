# Эпик 6 — Sub-Epic 2 — Ratings Reconciliation — Final Report

**Status:** ✅ CLOSED
**Closure date:** 2026-05-03
**Branch:** `claude/investigate-retirement-animation-zQeg4` (continue stack from Sub-epic 1)
**Commit range:** `4546b8e` (Commit 1) → `9d80ce8` (Commit 13 docs) → 14/15 closure
**Streak:** 24 → **25** ✅
**Эпик 6 progress:** 7/14 → **8/14 (57%)** — past half-way mark
**Closure shape:** Standard linear (5th application в Эпике 6)

---

## TL;DR

Reverse 5C Path A unified-leaderboard mock decision. `/v2/ratings` теперь показывает real backend data в 4 v1-style tabs (My Clan / Clans / Fighters / Agents). 100% client-side mock (`ratingsMock.js`) deleted. All 4 tabs wired к existing/new Vuex actions с pre-emptive F3 mitigation pattern (reset → load atomic). Click wiring closes 6B-3b deferral. Dead `AgentLeaderboard.vue` deleted (closes 5G carry-over). 11 functional commits + 1 audit-skip + 3 closure commits, 0 hot-fixes, 3 adaptation-tier recoveries (streak preserved per Lesson #35).

---

## What user sees

`/v2/ratings` opens с **My Clan tab default**.

**MY_CLAN tab (dual-branch):**
- Has-clan → compact summary card (avatar + name + Lv N · M members + Wins / Battles), click → `/v2/clan`.
- No-clan → "You're not in a clan" + CTA "Create or browse clans" → `/v2/clan`.

**CLANS tab:** 200ms debounce search + leaderboard от `/v1/clan/search`. 6 cols (# / Clan / Members / Wins / Losses / WR). Row click → `/v2/clan/:id` (Sub-epic 1 GuestClanView).

**FIGHTERS tab:** 200ms debounce search + leaderboard от `/v1/user/search`. 7 cols (# / Handle / Archetype / Belt / ELO / W/L / WR — Streak dropped). Sticky your-row visible (Fighters-only) с captain ELO + myRank computed. Row click → `/v2/user/:login` (6B-3 GuestProfileView).

**AGENTS tab:** leaderboard от `/v1/agent/rankings` (totalFights ≥ 5 backend filter). 6 cols (# / Agent / Owner / Belt / Q. Wins / ELO). NO search input (endpoint doesn't support). Hexmaster agents show 👑 emoji + "Hexmaster" badge. Row click → `/v2/fd/:agentId` (Epic 4 V2FighterDetail dynamic UUID).

All data REAL (no mock). Streak column dropped полностью.

---

## Path D Hybrid — mental model reversal от 5C Path A

5C Path A established `/v2/ratings` как **unified leaderboard** (5 scopes × 2 seasons) per prototype-first port. Client-side mock через `ratingsMock.js` (Mulberry32 seeded RNG, 10 datasets). Real API wiring deferred к "PvP-integration sub-epic".

**Phase 0 investigation surfaced:**
- v1 had 3 ratings types (MY_CLAN / CLANS / FIGHTERS), Agents tab dead code (AgentLeaderboard.vue 0 imports)
- Backend reality: 3 search/ranking endpoints (`/v1/user/search`, `/v1/clan/search`, `/v1/agent/rankings`)
- v2 5-scope mental model required friends/country/live/season backend tracking — все absent
- Sticky your-row was the only real piece (captain data binding); rest = "обман пользователя" (fake data presented as real)

**4 paths considered:**
- Path A (drop scopes — v1-style 3 tabs) — preserves backend, loses v2 architecture
- Path B (keep scopes — v2-minimal) — drop friends/country/live, keep global+clan
- Path C (keep scopes — v2-maximal) — extend backend для full 5-scope support (multi-sub-epic, L size)
- Path D (Hybrid 4 tabs + Agents) — port v1 mental model + activate dead `/v1/agent/rankings`, closes 5G dead code carry-over в bonus

**User chose Path D.** Rationale: if remodel — go to honest model. Path D closes more carry-overs while preserving streak-friendly backend untouched approach.

**Methodology classification:** Path D is REFINEMENT, не PIVOT. Surface findings (mock dishonesty, backend reality, 6B-3b deferral closure pressure) refined the mental model adopted в 5C. Pivot reasoning preservation principle (Эпик 5 §4.2 contribution) — both 5C Path A and Sub-epic 2 Path D documented в CLAUDE.md, neither erased.

---

## Files changed

| File | Action | Cumulative size |
|---|---|---|
| `src/components/hud/HudRatings.vue` | refactored 5-scope/2-season → 4-tab + per-tab data wiring | ~+260 / −150 across Commits 2-7 |
| `src/core/state/modules/agentState.js` | +`loadAgentRankings` action (Path A extension) | +36 |
| `src/core/models/userModel.js` | additive `captain` + `rating` extraction (4 symmetric points) | +13 |
| `src/styles/v24/ratings.css` | dead 5C CSS rules removed | −38 |
| `src/data/ratingsMock.js` | DELETED | −91 |
| `src/components/ratings/AgentLeaderboard.vue` | DELETED (closes 5G dead code) | −244 |
| `CLAUDE.md` | Sub-epic 2 closure section + cross-references + carry-overs update | +93 / −13 |
| `docs/visual-migration/EPIC6_SUBEPIC_2_FINAL_REPORT.md` | NEW (this file) | new |
| `docs/visual-migration/HANDOFF_EPIC6_SUBEPIC_3_CHAT_HANDOFF.md` | NEW (Commit 15) | new |

Folder `src/components/ratings/` removed entirely (auto-removed when last file deleted).

---

## Vuex (Path A extension — reuse + extend)

**NEW (Commit 1):**
- `agent/loadAgentRankings({ commit, state }, { offset = 0, limit = 20 } = {})` — calls `apiClient.get('/agent/rankings', { params, authRequired: true })` directly (mirrors agent module convention per Recovery #81). REPLACE semantics deliberate (preempts F3-style stale-rows для own action).
- `agent/setAgentRankings` mutation (REPLACE)
- `agent/updateAgentRankingsState` mutation
- `agent/getAgentRankings` getter
- State: `agentRankings: { items, total, limitReached, pageSize: 20 }`

**REUSED (existing):**
- `user/loadParticipantRatings` (Commit 4) — APPEND mutation confirmed pre-edit. F3 mitigation enforced: `commit('user/resetParticipantRatings')` BEFORE `dispatch`.
- `clan/loadClanRatings` (Commit 5) — APPEND mutation confirmed pre-edit. F3 mitigation identical pattern.
- `clan/getClanById` (Commit 7) — sync getter + async dispatch для MY_CLAN tab. Option B (separate dispatch + sync getter) chosen после pre-edit confirmed master state doesn't have nested clan object.

---

## Click wiring (closes 6B-3b deferral)

| Source | Target | Sub-epic |
|---|---|---|
| FIGHTERS row | `/v2/user/:login` | 6B-3 |
| CLANS row | `/v2/clan/:id` | Sub-epic 1 |
| AGENTS row | `/v2/fd/:agentId` | Epic 4 V2FighterDetail |
| MY_CLAN summary card | `/v2/clan` | 5D |

6B-3b scope-deferral pattern (HudRatings click wiring → integrated в Sub-epic 2) — fully closed.

---

## Recoveries log (3, all adaptation-tier per Lesson #35, streak preserved)

### Recovery #81 — agent module convention discovery (Commit 1)

**Trigger:** ТЗ Commit 1 step 1 specified NEW `src/core/services/agentService.js` (axios wrapper). Pre-edit reads revealed:
- `agentService.js` не существует
- agent module единственный без service layer
- All 14 actions в `agentState.js` use `apiClient.get/post/put` напрямую (lines 105/256/285 verified)
- `apiClient` interceptor unwraps `response.data`

**Resolution:** Option B chosen — single-file edit к `agentState.js` mirroring `fetchFightHistory` shape (line 256, same offset/limit pagination). Lesson #32 reflex applied: mirror local convention wins over ТЗ literal cross-module пattern.

**Tier:** Adaptation per Lesson #35. ТЗ assumption based on CLAUDE.md L34 service pattern; agent module-specific convention not surfaced при ТЗ writing. Streak preserved.

### Recovery #82 — branch divergence on bootstrap (Commit 1)

**Trigger:** Harness bootstrapped fresh-slug `claude/review-documentation-MPIjj`; ТЗ explicitly required continue stack `claude/investigate-retirement-animation-zQeg4 @ bd2189f`. Discovered после edits applied (uncommitted).

**Resolution:** User-authorized switch (`git checkout` + fast-forward, 4 missing commits, none touched `agentState.js` — zero conflict). Same SHA = zero work loss risk.

**Tier:** Adaptation per Lesson #35. Mirror of Recovery #79 (5U bridge session pattern) — environment/harness configuration discrepancy, не code bug. Streak preserved.

**Lesson candidate (observation):** Bootstrap fresh-slug branch issue теперь имеет 2 occurrences (#79 + #82). Future ТЗ kickoff messages should include explicit `git checkout {target_branch}` step BEFORE "прочитай CLAUDE.md". Promote к full lesson if 3rd occurrence happens.

### Recovery #83 — UserModel shape mismatch (Commit 4)

**Trigger:** ТЗ Commit 4 assumed `UserModel.fromJSON` includes `captain` + `rating`. Pre-edit reads revealed:
- `UserModel.fromJSON` (lines 107-166) destructures 23 fields из JSON
- Constructor + fromJSON have IDENTICAL extraction set — no asymmetry
- Neither extracts: `captain`, `rating`, `belt`, `isHexmaster`, `primaryModule`
- Backend `/v1/user/search` response (post-6B-3a-backend) per CLAUDE.md L4385 includes 25 public fields including `captain` (optional) + `rating`

**Verify pre-edit Q-A1..A4 — comprehensive consumer audit:**
- Q-A1: Constructor + fromJSON identical extraction → confirm symmetry
- Q-A2: 5 callsites total all через userService — small blast radius
- Q-A3: FriendCard bypasses UserModel (raw friend response с captain attached). PlayerSearchResult silently broken (manual reshape drops captain — pre-existing, NEW carry-over #11). ChallengeNotification out-of-band WebSocket.
- Q-A4: master state captain — own user only, не path для other users

**Resolution:** Option A — additive UserModel extension (`captain` + `rating` к constructor params + this.X assignments + fromJSON destructure + new UserModel pass — 4 symmetric points). Co-scoped within Commit 4 (single commit, 2 files). Bug-bundle pattern precedent (5G/6B-3 same-sub-epic structural prerequisite).

**Tier:** Adaptation per Lesson #35. Forward-aligns с CLAUDE.md "Captain in Public UI" pattern (L233). Single-commit closure preserved streak.

---

## Carry-overs

### Closed (2)

- ✅ **5G dead code** (`AgentLeaderboard.vue` + stale CLAUDE.md "Agent Rankings + Leagues" section) — file deleted Commit 9, section marked DEPRECATED Commit 13.
- ✅ **6B-3b HudRatings click wiring deferral** — wired Commits 4/5/6 (FIGHTERS/CLANS/AGENTS row navigation + MY_CLAN summary card click).

### NEW (3)

- ⚪ **#11 — friendsState.searchPlayers captain field drop.** Manual reshape (`friendsState.js:133-141`) drops `captain` field → `PlayerSearchResult.vue :captain="player.captain"` always undefined → `UserCaptainBadge` always renders "—" no-captain dash. Pre-existing silent bug, surfaced в Commit 4 pre-edit verify. NOT created by Sub-epic 2. Polish round candidate / friends sub-epic candidate.

- ⚪ **#12 — HudRatings 8-col CSS grid mismatch.** `.ratings-thead` + `.rt-row` `grid-template-columns` hardcoded к 8 cols (5C era). FIGHTERS uses 7 cells (1 trailing empty), CLANS/AGENTS use 6 cells (2 trailing empty). Cosmetic only — all tabs functional, just visual trailing whitespace. Deferred per design-Claude direction Commit 11. Per-tab grid modifier classes (Option a) — polish round candidate.

- ⚪ **#13 — HudRatings keyboard accessibility.** Tab buttons lack `role="tab"` / `aria-selected` / `aria-controls`. Row click divs lack `tabindex` / `role="button"` / Enter-key handlers. Pre-existing 5C inheritance, applies к 4-tab structure. NOT regression. Polish round candidate.

### Inherited (untouched)

- Achievement badge для retirement (5Q drop)
- HudProfile card-creep monitor (still 6/7 — Sub-epic 2 NOT triggered, HudRatings standalone HUD)
- Lesson #36 validation track (await 2nd occurrence)
- Auth + Wallet visual redesign (Sub-epic 7)
- `/rules` → v2 port (6B-1 Phase 0 surface)
- 3D models + devices system (Эпик 7+ scope)
- Locale cleanup (10 → English-only) (Эпик 7+ scope)
- `/user/search sortBy=balance` query param (6B-3a Phase 1 finding)
- Clan data integration audit (Sub-epic 1 surface)
- v2 cutover auth posture audit (Sub-epic 1 surface)

---

## Methodology applied

- **Mode A strict per-commit discipline** — 11 functional commits + 1 audit-skip (Commit 8) + 3 closure commits, build pass per commit, status report + push + STOP-and-confirm gates between every step.

- **Lesson #11 reflex** — pre-edit + post-edit grep на every edit. Examples: Commit 2 false-positive Mulberry32-style discrimination, Commit 4 captain consumer audit Q-A1..A4 (4 deep verify checks before any edit), Commit 9 zero-callsite verify, Commit 11 per-class dead-rule verify.

- **Lesson #32 convention discovery** — multiple applications:
  - Agent module direct-apiClient pattern (#81 — instead of ТЗ literal service layer)
  - `res` variable naming in new action (mirror agentState convention)
  - Div-grid pattern reuse (mirror FIGHTERS pattern across CLANS/AGENTS)
  - `.rt-*` CSS class consistency (visual coherence)
  - `master.userData?.clanId` path mirror (HudClan + HudGuestClan + MyClanTab triple-precedent verified pre-edit)
  - Scoped CSS for myclan styling (component-local instead of clan.css cross-pollination)
  - Backend-provided `row.rank` (vs idx+1) for AGENTS — forward-align с pagination

- **Lesson #35 adaptation-tier × 3** — all 3 recoveries (#81/#82/#83) preserved streak per environment/convention discrepancy classification.

- **Lesson #36 HudProfile card-creep monitor** — NOT triggered (HudRatings standalone HUD). Monitor remains 6/7. Sub-epic 2 не contributed к monitor saturation.

- **Pre-emptive F3 mitigation pattern** — discovered Commit 1 pre-edit verify (clanState + userState use APPEND mutations, separate reset mutations exist). Designed Commit 4 forward, applied Commits 4/5 verbatim. Reset → load atomic, prevents stale-rows leak on search refetch. Pattern principle reusable any APPEND-mutation Vuex tabs.

- **Mental-model reversal acknowledged explicitly** — Path D reverses 5C Path A. Documented via deprecation note в 5C section + deprecation note в v1 RatingsView description. Не classified as pivot — refinement based on post-5C surface findings.

- **Pivot reasoning preservation principle** (Эпик 5 §4.2 contribution) — 5C Path A reasoning preserved в CLAUDE.md alongside Sub-epic 2 Path D reasoning. Future readers see complete decision history.

---

## Closure shape: Standard linear (5th application в Эпике 6)

**Application chain:** 6A + 6B-1 + 6B-3 + Sub-epic 1 (was 6B-4) + **Sub-epic 2 (was 6B-5)**.

- 0 reactive splits triggered
- 0 hot-fixes
- 3 adaptation-tier recoveries (Lesson #35 streak-preserving tier)

Visual verify gate (Commit 12) passed clean — all 4 tabs functional, click navigation works, no console errors. No reactive split needed.

---

## Cumulative metrics

- **Streak:** 24 → **25** ✅
- **Recoveries:** 80+ → **83+** (#81 service convention, #82 branch divergence, #83 UserModel shape — all adaptation-tier)
- **Эпик 6 progress:** 7/14 → **8/14 (57%)** — past half-way mark
- **Sub-epics closed in Эпик 6:** 7 → **8**
- **Carry-overs total:** 10 → **13** (5G + 6B-3b deferral closed; #11/#12/#13 added)
- **Lessons promoted:** 35 (unchanged)
- **Lesson candidates active:** 7 (unchanged, #36-#42)

---

## Next sub-epic

**Sub-epic 3** — Profile sub-routes deep links (was 6B-6, S-M size, ~6-8 commits estimated).

Handoff document: `docs/visual-migration/HANDOFF_EPIC6_SUBEPIC_3_CHAT_HANDOFF.md` (Commit 15).

---

## End report
