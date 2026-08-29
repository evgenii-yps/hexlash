# v1 Club-Mode Subsystem — Dependency Map

**Date:** 2026-05-25
**Branch:** `audit/club-mode-deps-2026-05-25`
**Scope:** Map every file / component / Vuex export / backend endpoint / DB field / asset touched by removing the **v1 Club-Mode / Arena UI**.
**Status:** RECON ONLY — nothing deleted. Removal is a separate task (**Pack 3.2**) after owner review.

> **Product framing (Decisions Log 25.05.2026).** Club-Mode (player runs a club of fighters) **remains the product goal**. The **v1 implementation** (`/arena/*` screens + their components) is technically unfit as the Этап-1 foundation and will be **rewritten** under Neon Discipline. So: **tear down v1 screens, keep the Club-Mode foundation** (Prisma `Agent`/`Captain`/`Belt`, fight-club progression, backend services, AI report endpoints).
>
> Three buckets are kept strictly separate below:
> - **v1-front** — screens/components → removal candidates.
> - **Foundation** — DB models, backend services, AI endpoints, the `agent` Vuex module → **KEEP** (the new Club-Mode will re-wire them).
> - **Shared infra** — auth/WS/base Vuex/design-system primitives → not Club-Mode-specific, untouched.

---

## 1. Methodology

Static grep analysis from repo root, reproducible. `node`/`npm` available; no runtime tracing used.

**Import graph (who-imports-what), two passes:**
```bash
# deps a file pulls in:
grep -nE "import .*from ['\"]@/" <file>
# consumers (who pulls a node in):
grep -rln "\bNodeName\b" src --include=*.vue --include=*.js | grep -v "/NodeName.vue"
```
Second pass re-runs the consumer grep *excluding* already-classified v1 files, to surface second-order orphans (a leaf used only by a v1 node).

**Vuex / backend coupling:**
```bash
grep -rhoE "['\"](fight|agent)/[a-zA-Z]+" <consumer>     # exact dispatched action/getter names
grep -rln "ai/morning-report" src                        # endpoint callers
```

**v1-front vs Foundation split rule:** a node is **v1-front** only if *every* live consumer chain terminates at `/arena/*`. If any consumer is a `/play/*` (v2) file, it's **EXTERNAL_LIVE** (keep / re-point). Vuex modules/DB models with `/play` consumers are **Foundation** even if a *specific* action is currently v1-only.

**Status legend:** `V1_LEAF` (only reachable from v1 arena, safe), `V1_BRANCH` (v1 + another non-live/preserved file), `EXTERNAL_LIVE` (also used by live `/play` — do NOT delete), `FOUNDATION` (Club-Mode bedrock — keep by decision).

---

## 2. Surface inventory

### 2.1 v1-front nodes (removal candidates)

| Path | Lines | Imports (pulls in) | Imported by (consumers) | Status |
|---|---|---|---|---|
| `views/PreparationView.vue` | 276 | UserAvatar, UserName, ModuleBuilder, ModeSelector, HexButton, store, router, t, statsService | `router` (`/arena/fight`) | **V1_LEAF** |
| `views/FightClubView.vue` | 198 | MorningReport, AgentRoster, store, t | `router` (`/arena/club`) **+ `fragments/clan/ClanPageContent.vue`** | **V1_BRANCH** ¹ |
| `components/club/AgentRoster.vue` | 112 | AgentCard, t | FightClubView only | **V1_LEAF** (cascade) |
| `components/club/AgentCard.vue` | 173 | HexCard, HexButton, beltDisplay, t | AgentRoster only | **V1_LEAF** (cascade) |
| `components/club/MorningReport.vue` | 378 | HexButton, BeltBadge, apiClient, t | FightClubView only | **V1_LEAF** (cascade) |
| `components/fragments/modules/ModuleBuilder.vue` | 471 | ARCHETYPES, store, apiClient, 3 dice icons, t | PreparationView only | **V1_LEAF** (cascade) |
| `components/arena/ModeSelector.vue` | 244 | t | PreparationView only | **V1_LEAF** (cascade) |
| `components/fragments/profile/UserAvatar.vue` | 78 | (none local) | PreparationView only | **V1_LEAF** (cascade) ² |
| `components/fragments/profile/UserName.vue` | 45 | (none local) | PreparationView only | **V1_LEAF** (cascade) ² |

**Subtotal: 9 files, ~1,975 lines.**

¹ **FightClubView nuance.** Its only *router* consumer is `/arena/club`. It is also imported by `fragments/clan/ClanPageContent.vue` — but ClanPageContent is itself a **preserved-orphan** (flagged dead in the dead-code audit, kept by owner decision, zero live consumers). So this is a dead→dead link: removing FightClubView only forces a matching edit/removal inside the already-dead ClanPageContent. Not a true live branch. **Flagged for owner** (see §11).

² **UserAvatar / UserName nuance.** Named/located as generic profile fragments (`fragments/profile/`) but **only** PreparationView imports them (v2 `/play` profile uses `HudProfile` inline avatar/handle instead). They orphan on v1 removal. Possibly reusable by the future Club-Mode rewrite — **owner call** whether to delete or shelve (§11).

### 2.2 Transitively-pulled nodes that are NOT removable (EXTERNAL_LIVE)

Re-pass confirms these are shared with live `/play` UI — **keep**:

| Node | Why kept |
|---|---|
| `components/ui/HexButton.vue` | 12 consumers; mostly `/play` (HudRetirement, ChangePassword, ConfirmEmail, ConnectWallet, ReferralModal, ChangeLogin, DeleteAccount, ClanEdit) |
| `components/ui/HexCard.vue` | `fragments/profile/wallet/GameBalanceCard.vue` (live `/play` wallet) |
| `components/ui/BeltBadge.vue` | `HudProfile.vue`, `UserCaptainBadge.vue` (live) |
| `utils/beltDisplay.js` | `HudRatings`, `HudFighterDetail`, `HudProfile` (live) |
| `core/data/archetypes.js` (`ARCHETYPES`) | `HudCreate`, `HudPit`, `TopBar`, `HudProfile`, `GuestArchetypeSelect`, scene files, engines (live) |
| `core/services/statsService.js` (`getOnlinePlayersCount`) | `views-v2/MatchmakingView.vue` (live) |
| `assets/images/icons/{heal,adrenaline,shield}.svg` | `HudFight`, `HudSpectate`, `cardFightState` (live) |

---

## 3. Router map

All `/arena/*` routes (in `src/router/index.js`):

| Line | Path | Target | Disposition |
|---|---|---|---|
| 79 | `/arena` | redirect → `/arena/club` | **Re-point** → `/play` (or 404) |
| 80 | `/arena/fight` | `PreparationView.vue` (component) | **Remove** (view deleted) → redirect `/play` |
| 81 | `/arena/club` | `FightClubView.vue` (component) | **Remove** (view deleted) → redirect `/play` |
| 84 | `/arena/club/create` | redirect → `/create-fighter` | **Keep** — points to live `/play` create; valid backward-compat |
| 85 | `/arena/club/:agentId` | redirect → `/fighter/:id` | **Keep** — points to live `/play` FD; valid backward-compat |
| 102 | `/fight-club` | redirect → `/arena/club` | **Re-point** → `/play` (its current target dies) |
| 303-304 | `beforeEach` guard | fight-in-progress restore for `/arena/fight` & `/arena` | **Remove** guard branch |

**No `/v2/arena/*` redirects exist** (the v2 cutover never created arena paths).

**Bookmarks / shared links:** `/arena/fight` and `/arena/club` currently land on live screens. After removal, recommend **redirect `/arena` and `/arena/*` → `/play`** (the new hub) for graceful bookmark handling rather than 404. The two `:agentId`/`create` redirects already resolve to live `/play` targets and can stay as-is.

**Knock-on — `BottomMenu.vue`** (`src/components/menu/BottomMenu.vue`, consumer: `App.vue` v1 shell): its first nav item links to `/arena` (line 46) and its active-state logic special-cases `/arena` (lines 58-59). Removing `/arena` breaks that item. BottomMenu is the **v1 shell nav** (hidden on `/play`); its other items (`/training`, `/ratings/clubs`, `/profile`) are themselves redirect-to-`/play` links. This is part of the **wider v1-shell-vs-v2 cutover**, broader than Club-Mode — **flagged (§11)**, not classified as a Club-Mode leaf here. Its `icon_arena.svg` asset (`assets/images/icon_arena.svg`) is BottomMenu-only.

---

## 4. Vuex impact

### 4.1 `cardFight` module (namespace `fight`) — `core/state/modules/cardFightState.js`, 257 lines

This is the **frontend PvE fight-simulation engine** behind `/arena/fight`. Consumer audit:

- **Actions** (`loadModules`, `setEmergencyProtocol`, `setPlayerModules`, `startFight`, `saveFightState`): dispatched by **PreparationView + ModuleBuilder (v1) only**, EXCEPT `setPlayerModules` which is also committed by `masterService.js:25` (`commit('fight/setPlayerModules', userData.progression.playerModules)` on init).
- **Getters** (post-Pack-2: `getPlayerModules`, `getEmergencyProtocol`, `isBuildValid`): consumers are **ModuleBuilder + PreparationView (v1) only**.
- **v2 fight does NOT touch this module** — `views-v2/FightView.vue` has **0** `fight/` references; it uses `pvp/*` + module-scoped reactive state.

**Confidence HIGH** that after v1 removal the `cardFight` module is orphaned **except** the single `masterService` `setPlayerModules` commit. Its dependency chain (frontend PvE engine) cascades:

| File | Lines | Consumers | Note |
|---|---|---|---|
| `core/engine/combatEngine.js` | — | cardFightState only | PvE round sim |
| `core/engine/aiStrategy.js` | — | combatEngine, cardFightState | |
| `core/engine/opponentGenerator.js` | — | cardFightState only | |
| `utils/powerRating.js` | — | opponentGenerator, cardFightState | `buildPlayerFighter`/`calculatePowerRating` |

⚠️ **Do NOT auto-delete in 3.2.** Whether the frontend PvE engine is "v1 tech-debt to rewrite" or "reusable foundation" is a **product decision** (the new Club-Mode is backend-driven per `agentScheduler.js`, which would make the frontend PvE sim genuinely removable — but that's the owner's call). Classified **needs-decision (3.2.e)** + §11. The lone `masterService` `setPlayerModules` link must be untangled before any cardFight removal.

### 4.2 `agent` module (namespace `agent`) — **FOUNDATION, keep entirely**

Heavily used by live `/play`: `FighterDetailView`, `CreateView`, `MatchmakingView`, `FightView`, `HudRatings`, `HudFighterDetail`, `CanvasLayer`, `useMatchmakingState`, `useCreatedFighter` dispatch `fetchAgent`, `createAgent`, `setCaptain`, `toggleAutoFight`, `loadAgentRankings`, `agentsList`, `currentCaptain`, `getAgentRankings`, `fetchAgents`. **This is the v2 Club-Mode bedrock.**

v1 (`PreparationView`/`FightClubView`) uses `agentsList`, `currentCaptain`, `fetchAgents`, `fetchFightClubLevel` — the first three are **also** used by `/play`, so they do **not** orphan.

**One v1-only sub-area:** `fetchFightClubLevel` action + `SET_FIGHT_CLUB_LEVEL`/`SET_FIGHT_CLUB_LEVEL_LOADING` mutations + `fightClubLevel`/`fightClubLevelLoading` state (lines 8-9, 75-76, 108-116) — sole consumer is **FightClubView (v1)**. After v1 removal these orphan. **But this is fight-club progression = Foundation → KEEP** (the new Club-Mode dashboard will re-consume it). Confidence HIGH it orphans; **decision: preserve**.

### 4.3 Other modules
No other Vuex actions/getters/mutations/state are orphaned by v1 arena removal (the Pack-2 dead getters are already gone). **Not found** elsewhere.

### 4.4 Foundation Vuex checklist (KEEP even if temporarily orphaned)
- ✅ entire `agent` module (incl. `fetchFightClubLevel` + `fightClubLevel` state)
- ✅ `agent/currentCaptain`, `agent/agentsList`, `agent/setCaptain` (captain system)

---

## 5. Backend impact

| Endpoint | File | Current caller | Disposition |
|---|---|---|---|
| `POST /ai/morning-report` | `routes/ai.js` | `MorningReport.vue` (v1) **only** | **KEEP** — Foundation. Orphans on v1 removal, but `morningReportService` is a protected Club-Mode service and the report is core to the future Club dashboard. |
| `POST /ai/build-description` | `routes/ai.js` | `ModuleBuilder.vue` (v1) **only** | **KEEP** — Foundation. Build-description is intrinsic to fighter creation in the future Club-Mode. Orphans on v1 removal but preserve. |
| `POST /user/retire`, `GET /user/retirement-status` | `routes/user.js` | `masterState.js` actions → **`HudRetirement.vue` (live `/play`)** | **EXTERNAL_LIVE — keep.** Not v1. (Retirement UI already migrated to `/play` in Pack-1-era.) |

**Backend services (protected / Foundation, keep):** `captainService`, `beltService`, `userMigrationService`, `morningReportService`, `metaAnalysisService`, `retirementService`. None become removable.

**No backend endpoint is a safe removal candidate** from v1 arena teardown — the two that orphan (`morning-report`, `build-description`) are explicitly preserved Foundation. Confidence HIGH.

---

## 6. Prisma / DB impact

- **`Agent` model** — **FOUNDATION, keep.** Confirmed used by live `/play` (the `agent` Vuex module → many v2 views) and the backend agent subsystem (`agentScheduler`, `agentFightService`, etc.), not just v1.
- **`Captain` flag / `Belt` fields / fight-club progression** — Foundation, keep. `currentCaptain` getter + `setCaptain` live in `/play` (HudFighterDetail "Set as Captain", Pit hub captain display). `fightClubLevel` (DB-backed via `GET /agent/fight-club` → `fetchFightClubLevel`) currently surfaced only by v1 FightClubView, but the underlying FightClub model/progression is Foundation.
- **Removal candidates: none.** No Prisma model or field is used *exclusively* by the v1 front or by a backend endpoint being removed (no backend endpoint is being removed). Everything DB-side is Foundation or shared. Confidence HIGH.

---

## 7. Assets impact

| Asset | Consumers | Status |
|---|---|---|
| `assets/images/background_arena.webp` | PreparationView + FightClubView (**v1 only**) | **V1_LEAF** — orphans on v1 removal. (Not used by `/play`.) |
| `assets/images/icon_arena.svg` | `BottomMenu.vue` only | Tied to BottomMenu (v1 shell, §3/§11) — not deleted here |

Dice icons `heal/adrenaline/shield.svg` are **EXTERNAL_LIVE** (HudFight/HudSpectate/cardFightState) — keep. No other arena-only assets found.

---

## 8. i18n keys impact

Top-level sections in `en.js`: `arena:` (line 77), `club:` (line 211). **Both are SHARED with live `/play` — NOT bulk-removable:**

- **`arena.*`** — static consumers (`t.arena…`) are all v1 (ModeSelector, ModuleBuilder, PreparationView). **BUT** the `arena.archetypes` / `archetypeDesc` / `protocolName` / `protocolTrigger` / `buildStyle` subsections are **dynamic-access live** (runtime keys read by `HudCreate` and ModuleBuilder per the i18n architecture notes). Removing the whole `arena` section would break v2 archetype labels.
- **`club.*`** — consumers include **`HudRetirement.vue` (live `/play`)** alongside v1 (MorningReport, AgentRoster, AgentCard, ResearchTree[preserved-orphan], FightClubView) + `masterState`.

**Recommendation:** **no bulk i18n deletion.** Only individual v1-only leaf keys may be removed, and only after a per-key audit (which keys does HudRetirement/HudCreate actually read). Confidence to bulk-remove: **LOW** (high risk of breaking live labels). Defer to a careful follow-up — marked MEDIUM/needs-care (§10.c, §11).

---

## 9. Summary

**Under removal (v1-front):**
- **9 files, ~1,975 lines:** 2 views (PreparationView 276, FightClubView 198) + 5 components (AgentRoster 112, AgentCard 173, MorningReport 378, ModuleBuilder 471, ModeSelector 244) + 2 profile fragments (UserAvatar 78, UserName 45).
- **1 asset:** `background_arena.webp`.
- **Routes:** 2 component routes removed, 2 redirects re-pointed, 2 backward-compat redirects kept, 1 `beforeEach` branch removed.

**Needs owner decision before removal (not auto-delete):**
- `cardFight` module (257L) + frontend PvE engine (`combatEngine`/`aiStrategy`/`opponentGenerator`/`powerRating`) — orphans except the `masterService.setPlayerModules` link; is it v1-debt or reusable?
- `FightClubView` ↔ `ClanPageContent` dead→dead link.
- `UserAvatar`/`UserName` — delete or shelve for Club-Mode rewrite?
- `BottomMenu` Arena item (wider v1-shell cutover).
- i18n `arena.*` / `club.*` per-key cleanup.

**Foundation — KEEP (may temporarily orphan, do NOT delete):**
- ✅ `agent` Vuex module in full, incl. `fetchFightClubLevel` + `fightClubLevel` state.
- ✅ Prisma `Agent`/`Captain`/`Belt` + FightClub progression.
- ✅ Backend services: `captainService`, `beltService`, `userMigrationService`, `morningReportService`, `metaAnalysisService`, `retirementService`.
- ✅ Endpoints `/ai/morning-report`, `/ai/build-description` (orphan-but-preserve).

**NEVER delete (EXTERNAL_LIVE, in active `/play`):**
- HexButton, HexCard, BeltBadge, `beltDisplay.js`, `archetypes.js`, `statsService.getOnlinePlayersCount`, dice icons; `/user/retire(+status)` (HudRetirement). Each has ≥1 live `/play` consumer.

---

## 10. Recommended deletion order (Pack 3.2)

**3.2.a — Pure leaves (V1_LEAF, no inter-dependencies):**
- `ModeSelector.vue`, `MorningReport.vue`, `AgentCard.vue` (after AgentRoster), `UserAvatar.vue`, `UserName.vue` — none import each other except the AgentRoster→AgentCard order (see 3.2.b).
- `background_arena.webp`.

**3.2.b — Cascade (delete in order, re-grep after each):**
1. `PreparationView.vue` first → then its now-orphaned children `ModuleBuilder.vue`, `ModeSelector.vue`, `UserAvatar.vue`, `UserName.vue`.
2. `FightClubView.vue` first → then `AgentRoster.vue` → then `AgentCard.vue`; and `MorningReport.vue`. (Also patch the dead `ClanPageContent.vue` reference — see §11.)

**3.2.c — Routes & i18n cleanup:**
- Router: remove `/arena/fight` + `/arena/club` component routes + `beforeEach` arena branch; re-point `/arena`, `/fight-club` → `/play`; keep the two `:agentId`/`create` redirects.
- i18n: **per-key only**, after auditing which `arena.*`/`club.*` keys HudCreate/HudRetirement read. Do not bulk-remove.

**3.2.d — Backend orphans & DB fields:**
- **None to delete.** The only orphaning endpoints (`/ai/morning-report`, `/ai/build-description`) are preserved Foundation. No DB field qualifies.

**3.2.e — Needs further owner decision (do NOT include in a mechanical pass):**
- `cardFight` module + frontend PvE engine (`combatEngine`/`aiStrategy`/`opponentGenerator`/`powerRating`) + the `masterService.setPlayerModules` untangle.
- `BottomMenu` Arena item / v1-shell cutover.
- `UserAvatar`/`UserName` delete-vs-shelve.

---

## 11. Open questions

1. **Frontend PvE engine (`cardFight` + `combatEngine`/`aiStrategy`/`opponentGenerator`/`powerRating`):** v1 tech-debt to delete, or reusable for the new Club-Mode? The new Club-Mode is backend-driven (agentScheduler simulates fights server-side), which suggests the *frontend* PvE sim is removable — but confirm. Also: what should replace the `masterService.commit('fight/setPlayerModules', …)` init link if cardFight is removed?
2. **`fetchFightClubLevel` / `fightClubLevel` state:** keep as Foundation (recommended) even though only v1 FightClubView reads it today, correct? The new Club dashboard will re-consume it.
3. **`UserAvatar.vue` / `UserName.vue`:** generic-looking profile fragments used only by PreparationView. Delete, or shelve for the Club-Mode rewrite?
4. **`ClanPageContent.vue` dead→dead link:** it imports FightClubView but is itself a preserved-orphan. On FightClubView removal, do we (a) also remove the now-broken import line inside ClanPageContent, or (b) finally delete ClanPageContent too (it's been dead since the audit)?
5. **`BottomMenu` / v1 shell:** removing `/arena` breaks BottomMenu's Arena item. Is the whole v1 `App.vue` shell + BottomMenu slated for removal in a separate cutover, or should BottomMenu's Arena item just be dropped now?
6. **Bookmark policy:** redirect `/arena/*` → `/play`, or serve 404?
7. **i18n:** OK to defer `arena.*`/`club.*` per-key cleanup to a dedicated audit (they're shared with live HudCreate/HudRetirement), rather than touch them in 3.2?
