# Dead-Code & Unused-Asset Audit — Hexlash

**Date:** 2026-05-25
**Branch:** `audit/dead-code-2026-05-25`
**Scope:** Whole repo (frontend `src/`, backend `backend/`, docs, assets, deps).
**Status:** REPORT ONLY — nothing deleted, nothing refactored. Deletion is a separate, later task gated on owner review.

> ⚠️ **Read this first.** The project is mid-redesign (v1→v2 "visual migration", now mostly cut over to `/play`). Several "dead" findings are dead *because their v2 replacement already shipped* and the v1 original was never removed. A few are dead *because their consumer was deleted but the leaf survived*. Confidence levels reflect how safe each call is. When in doubt this report says MEDIUM/LOW, not HIGH.

---

## 1. Methodology

All analysis is **static (grep-based)**, fully reproducible, run from repo root. `node_modules` is **not installed** in this environment (no network), so dynamic tools (`depcheck`, `ts-prune`, bundle analysis, `npm run build`) were not available. Findings rely on source inspection only.

**Note on the referenced starting point:** the task referenced `docs/state-report-2026-05-24.md` as a prior inventory to build on. **That file does not exist** in the repo (searched repo-wide). This audit was therefore built from scratch.

Techniques used:

1. **Component orphan graph (iterative).** For every `.vue`/`.js` file, grep the basename (word-boundary) across `src/`, excluding self. Files with zero references = first-order orphans. Then *remove* found orphans and re-scan — repeated until stable (3 iterations) to surface second-order cascades (a leaf used only by an orphan). Roots that are reachable without a name-import (`main.js`, `App.vue`, `AppV2.vue`, `router/index.js`, `store.js`) were excluded from "orphan" status.
   - *Limitation:* basename grep over-counts generic names (`branches`, `requirements`, `moves`) — a local variable or legal-text word counts as a "reference". These were re-checked **manually by exact import path** (`grep "from .*data/branches"`), which caught two orphans the automated pass missed.
2. **Router map.** Parsed `src/router/index.js` for `component:` imports and `redirect:` entries to establish which views are reachable and which are backward-compat redirects.
3. **Vuex internals.** For each namespaced module, extracted `actions`/`getters`/`mutations` names, then grepped `dispatch('ns/x')` / `getters['ns/x']` / `mapActions`/`mapGetters` plus unprefixed intra-module dispatch.
4. **i18n keys.** Top-level sections of `en.js` cross-checked against `t.section.key` / `t.value.section.key` usage, with explicit protection of documented dynamic-access subtrees (`gameData.*`, `belts.*`, `arena.archetypes.*`, etc.).
5. **Backend.** Mounted routes in `index.js` → each endpoint path grepped against frontend `src/core/services/*` + `apiClient.js`, and against other backend files (internal calls). Prisma models/fields grepped for `prisma.<model>` / field usage.
6. **Assets.** `find src/assets public` inventory; each non-skin basename grepped across `src/` + `index.html` + CSS `url(...)`. Skin folders treated as live (dynamic `/images/skins/${skin}`).
7. **Deps.** Each `package.json` dependency grepped for an import string in `src/`.

Reproduction examples:
```bash
# orphan scan (basename, word-boundary, excl self)
for f in $(find src -name "*.vue" -o -name "*.js"); do
  b=$(basename "$f" | sed 's/\.[^.]*$//')
  [ "$(grep -rl --include=*.vue --include=*.js "\b$b\b" src | grep -v "^$f$" | wc -l)" -eq 0 ] && echo "ORPHAN $f"
done
# exact-import recheck for generic-named data files
grep -rn "from ['\"].*data/branches" src/
# backend endpoint caller check
grep -rn "/user/progression" src/core/
```

---

## 2. Findings by category

### A. Vue components with no usage

Confirmed orphans (zero real references; verified by exact-name and, where the name is generic, by import path). Sizes and last-touch dates from `git log`.

| File | Lines | Last commit | Why dead | Conf. |
|---|---|---|---|---|
| `src/components/AiTrainerAnalysis.vue` | 229 | 2026-04-17 | Sole mount was v1 `CardFightView.vue` (deleted). Zero imports anywhere. CLAUDE.md still lists AI Trainer as live — **stale**. | **HIGH** |
| `src/components/club/ResearchTree.vue` | 497 | 2026-05-05 | Consumer `AgentDetailView.vue` was deleted in the legacy cleanup; ResearchTree survived. Zero imports. CLAUDE.md still describes it as live in AgentDetailView — **stale**. | **HIGH** |
| `src/components/club/SkinPicker.vue` | 110 | 2026-04-17 | Consumer was `CreateAgentView.vue` (deleted). Zero imports. | **HIGH** |
| `src/components/club/ArchetypeSelector.vue` | 107 | 2026-05-14 | Same (CreateAgentView gone). Zero imports. | **HIGH** |
| `src/components/fragments/clan/ClanWithdraw.vue` | 194 | 2026-04-17 | Zero references anywhere in `src/`. | **HIGH** |
| `src/components/fragments/clan/ClanPageContent.vue` | 1085 | 2026-04-18 | Consumers were v1 `ClanView.vue` + `MyClubTab.vue` (both deleted; v2 uses `views-v2/ClanView.vue` + `HudClan.vue`, which do **not** import it). Zero references. **Largest single orphan.** | **HIGH** |

Second-order orphans — currently used *only* by `ClanPageContent.vue` (above). They become safely removable **once ClanPageContent is removed** (Pack 2):

| File | Lines | Why | Conf. |
|---|---|---|---|
| `src/components/fragments/clan/ClanStats.vue` | 114 | Imported only by ClanPageContent. | **HIGH** (cascade) |
| `src/components/fragments/clan/ClanAvatar.vue` | 61 | Imported only by ClanPageContent. | **HIGH** (cascade) |
| `src/components/fragments/clan/ClanOwnerAvatar.vue` | 211 | Imported only by ClanPageContent. | **HIGH** (cascade) |

> `ClanActivityFeed.vue`, `ClanConfirmModal.vue`, `ClanEdit.vue`, `CreateClan.vue` in the same folder are **LIVE** (consumed by `HudClan.vue` / `HudClanEmpty.vue` / `ClanView.vue` / `ChallengeNotification.vue`) — do **not** touch.

**MEDIUM — wired but dead-in-practice:**

| File | Lines | Nuance | Conf. |
|---|---|---|---|
| `src/components/ui/PixelIcon.vue` | — | Imported by `HexButton.vue` (12 consumers, very live) via its `icon` prop. But **no `<HexButton>` anywhere passes an `icon`** (grep: 0). The whole pixel-icon render path is reachable-but-never-exercised. CLAUDE.md documents PixelIcon as "currently unused". Removing it requires also stripping HexButton's icon prop — not a clean delete. | **MEDIUM** |

`src/components/fragments/profile/wallet/BuyTokens.vue` — appears orphan (only a *comment* in `contractState.js` mentions it; not rendered, per CLAUDE.md "temporarily disabled"). **PROTECTED ZONE** (root of the Base-contract subsystem) — listed for awareness only, no deletion proposed. See O.

### B. Vuex actions / mutations / getters with no callers

**No phantom dispatches** — every `dispatch('X/...')` namespace maps to a registered module (no silent no-op bugs). Modules: `user, master, clan, task, punch, fight (cardFightState), contract, webSocket, achievement, friends, pvp, agent`.

**Dead actions** (0 callers incl. unprefixed intra-module):

| Module | Action | Conf. | Note |
|---|---|---|---|
| master | `uploadMasterAvatar` | HIGH | Documented **preserve** item — flag only. |
| master | `changeGuestArchetype` | HIGH | Guest-session subsystem (partially dead). |
| master | `endGuestSession` | HIGH | Guest-session subsystem. |
| agent | `fetchAvailableMoves` | HIGH | Consumer was ResearchTree/AgentDetail. |
| fight (cardFight) | `checkEmergencyProtocol` | HIGH | |

> `master/restoreGuestSession` and `webSocket/handleInternalError` are dispatched **internally** (unprefixed) → LIVE, do not flag.

**Dead getters** (0 external consumers — these live *inside* otherwise-live module files, so removal is line-level editing, not file deletion):

- achievement: `getAllAchievements`
- user: `getUserById`, `isLimitReached`
- master: `getSignupState`
- clan: `isLimitReached`
- task: `hasIncompleteDailyTasks`
- friends (6): `getOutgoingRequests`, `incomingRequestsCount`, `isFriend`, `getOutgoingChallenge`, `getIncomingChallenge`, `getFriendFight`
- agent (7): `agentById`, `canCreateAgent`, `activeAgents`, `idleAgents`, `fightingAgents`, `restingAgents`, `fightClubProgress`
- fight/cardFight (19): `getOpponent`, `getFightPhase`, `getDifficulty`, `getLiveHP1`, `getLiveHP2`, `getRoundNum`, `getRoundLog`, `getCurrentRound`, `getPlayerModifiers`, `getDiceState`, `getFightStats`, `getEventTitle`, `getEventTitleClass`, `getEventImage`, `getCoachAdvice`, `getXpEarned`, `getXpAwarded`, `getBuildDescription`, `isOverdrive`

Confidence **HIGH** that each is uncalled. The large `fight/*` cluster is dead because v2 `FightView.vue` uses module-scoped reactive state + `pvp/*` getters instead of `cardFight` getters. *Live `fight` getters (do NOT touch): `getPlayerModules`, `getEmergencyProtocol`, `isBuildValid`.*

**Dead mutations:** MEDIUM. Mutations committed only by the dead actions/getters above are likely dead, but each was **not** individually caller-traced. Verify `commit('FOO')` sites per-mutation before removing.

**contractState (PROTECTED):** all 6 actions + 10 getters have exactly 1 caller (`BuyTokens.vue`, the preserved sole consumer). MEDIUM, **no deletion** — see O.

### C. Routes with no inbound links

No truly orphaned route *definitions* — every entry in `router/index.js` is either (a) a live mounted view or (b) an intentional backward-compat **redirect** (legacy `/v2/*`, `/profile/*`, `/ratings/*`, `/fight`, `/matchmaking`, `/spectate/:odId`, etc. → `/play/*`). These redirects preserve bookmarks/shared links and should be kept.

**One reachability nuance (MEDIUM/LOW, an Open Question — not "dead"):** the v1 arena screens `PreparationView.vue` (`/arena/fight`) and `FightClubView.vue` (`/arena/club`) render in the **v1 `App.vue` shell**, and are linked only from `BottomMenu.vue` — which itself only renders on non-`/play` routes. **Nothing in the v2 `/play` UI links to `/arena/*`** (grep: 0). So from the v2 hub these screens are effectively unreachable-via-UI, surviving only by direct URL. This is the documented "Phase C deferred" cutover state (CLAUDE.md Sub-epic 8) — the v2 Club-Mode equivalent doesn't exist yet. **Do not delete**; flagged for the owner to confirm the deferral is still intended (see Open Questions).

### D. Backend routes / controllers / helpers with no callers

**HIGH — fully dead (no frontend caller, no internal call):**

| Endpoint | File | Evidence | Conf. |
|---|---|---|---|
| `PUT /v1/user/progression` | `backend/src/routes/user.js:515` | Frontend `progressionState` module was retired (legacy cleanup Phase 7-pre-2). `grep /user/progression src/core` → 0. Matches CLAUDE.md parking #8. | **HIGH** |
| `PUT /v1/user/skin` | `backend/src/routes/user.js:492` | Skins concept deprecated (6B-2). No `changeSkin`/`/user/skin` caller in `src/`. | **HIGH** |
| `PUT /v1/user/settings` | `backend/src/routes/user.js:569` | No caller in `src/core/`. | **HIGH** |
| `POST /v1/ai/analyze-fight` | `backend/src/routes/ai.js:136` | Sole caller was `AiTrainerAnalysis.vue` (dead, see A). Endpoint + AI-Trainer feature dead. CLAUDE.md inaccurately lists it live. | **HIGH** |

**Confirmed ALIVE despite suspicion (do NOT flag):** `/ai/morning-report`, `/ai/premium-report` (MorningReport.vue via FightClubView), `/ai/build-description` (ModuleBuilder.vue), `/user/retire` + `/user/retirement-status` (HudRetirement.vue), all auth endpoints (`forgot-password`/`reset-password` are **implemented now**, not 501), `task/social/:language` + `task/daily/:language` (LIVE, though `:language` is always `'en'` — vestigial param).

**Service/util exports:** no orphaned exports — `helpers.js`, `metaAnalysisService`, `morningReportService`, `emailService`, `retirementService`, `migrationHelpers` all imported with ≥1 caller. (CLAUDE.md references a `formatClubResponse`; the actual export is `formatClanResponse` — naming drift only, not dead code.)

### E. Prisma models / fields with no usage

- **`User.language`** — already **DROPPED** (Phase 10). Confirmed absent from `schema.prisma`; `user.js:566` comment notes it. ✅
- **`SocialTask.language` / `DailyTask.language`** — **already absent** from current schema. The `:language` route param on `task/social` + `task/daily` is now **vestigial** (always maps to `'en'`). MEDIUM cleanup (route-param simplification + `seed.js`), tracked as CLAUDE.md parking #11.
- **Models:** all 19 referenced via `prisma.<model>`. No dead models.
- **Legend fields** (`FightClub.legendSkin/legendArchetype/legendBuff`) — LIVE (retirement subsystem).
- **NFT / x402 fields** — none in schema (NFT is config-flag only). Nothing to flag.

### F. Scripts / utilities with no callers

| Path | Assessment | Conf. |
|---|---|---|
| `scripts/smoke-test/` (playwright.config.js, smoke.spec.js, package.json, README) | Self-contained Playwright harness, **not wired into root package.json or any CI workflow** (grep: 0 refs). Manual on-demand tool. Not dead, just un-automated. | MEDIUM (keep) |
| `backend/scripts/backfill-belts.js`, `backfill-captains.js`, `migrate-all-users.js` | One-time backfills — almost certainly already run. Not invoked by app code. Cheap historical record. | MEDIUM (keep) |
| `backend/scripts/calibrate-belts.js`, `cleanup-agents.js` | Ad-hoc maintenance utilities. | MEDIUM (keep) |
| `backend/scripts/check-email-cleanup-counts.js` | Diagnostic count script; **not** listed in CLAUDE.md's script inventory — possible one-off orphan from email-cleanup work. | LOW |
| `docs/generate_pdf.py` (21.5 KB) | One-shot generator: `docs/0x_*.md` → `Hexlash_Combat_System_Documentation.pdf`. Needs Python+fpdf2 (not in project toolchain). Functional but manual. | MEDIUM |
| Root `package.json` scripts (`dev`/`build`/`preview`/…) | All standard Vite, all valid. **No dead npm scripts.** (Note: no `lint`/`test` script exists — frontend has no test runner.) | — |

### G. Dependencies (package.json) with no imports

`node_modules` not installed → sizes are estimates from package reputation.

**HIGH — zero references anywhere in `src/`:**

| Package | Notes | Conf. |
|---|---|---|
| `@vueuse/core` | 0 imports. Genuinely unused. | **HIGH** |
| `lucide-vue-next` | 0 imports. Icon lib, unused (project uses inline SVG / own icon assets). | **HIGH** |

**MEDIUM — Web3 area, 0 direct imports but sensitive / possibly transitive:**

| Package | Notes | Conf. |
|---|---|---|
| `@reown/appkit` | 0 refs anywhere (not in `wagmiConfig.js` or `main.js`). Wallet flow uses `@wagmi/vue`'s `walletConnect` connector instead. Looks genuinely unused, but Web3/wallet is sensitive + heavy dep → owner call. | **MEDIUM** (likely removable) |
| `@reown/appkit-adapter-wagmi` | Same — 0 refs. | **MEDIUM** |
| `@coinbase/wallet-sdk` | 0 direct refs, but `coinbaseWallet` connector (from `@wagmi/vue/connectors`, used in `wagmiConfig.js:11`) pulls it transitively. Declaring it directly is redundant but removing it may need verification. | MEDIUM (likely keep) |
| `viem` | 0 direct refs; transitive peer of wagmi. | MEDIUM (keep) |
| `@wagmi/core` | 0 direct refs; transitive peer of `@wagmi/vue`. | MEDIUM (keep) |

**LIVE (confirmed used):** `@amplitude/analytics-browser` (3), `@tanstack/vue-query` (1), `@wagmi/vue` (4), `axios` (1), `debounce` (3), `ethers` (2), `howler` (1), `idb` (1), `jwt-decode` (1), `qrcode` (1), `three` (26), `vuex` (22), `vue`, `vue-router`.

**⚠️ Inverse problem (see O):** `vuetify` is **imported in `main.js`** but is **NOT declared** in `package.json` dependencies (only `vite-plugin-vuetify` is). This is a *missing* declared dependency, not a dead one — flagged for correctness.

### H. Locales / i18n keys

- Only `en.js` remains (+ `pages/help/en.json`, `pages/rules/en.json` merged via `index.js`). The 10 other locale files and multi-locale machinery were already removed. `index.js` is clean. **No leftover locale files.** ✅
- **All 20 top-level sections of `en.js` are referenced** (USED or DYNAMIC-LIVE). No fully-dead section.
- **Dead leaf keys (HIGH but knowingly preserved):** `info.firstFight`, `info.firstTraining` — zero refs; documented as preserved first-time-UX strings awaiting re-wire. Only `info.withdrawAfterListing` + `info.withdrawClanDisable` of the `info` section are live.
- Dynamic-access subtrees correctly resolve to live usage and must **not** be flagged: `gameData.branches/moves`, `belts.*`, `arena.archetypes/archetypeDesc/protocolName/protocolTrigger/buildStyle`, `pages.help/rules`.

### I. Assets with no references

Skin folders (`public/images/skins/` ~7.5 MB, `public/images/tgskins/` ~7.3 MB) are **LIVE** (dynamic `/images/skins/${skin}` + DB `User.skin`) — not flagged. All `public/` favicons/manifest/icons/`og-image.png`/`ammo.wasm.*`/`telegram-web.js` are referenced in `index.html`/`manifest.json` — live. All `achievement_*.png`, combat/archetype SVGs in `src/assets/images/icons/`, and all fonts are imported — live.

**Candidate dead assets (the v1 3D punch bag + Three.js `Punch3D.vue` are gone; v2 scene uses procedural geometry, no `GLTFLoader`/`TextureLoader` in `src/`):**

| Path | Size | Conf. |
|---|---|---|
| `src/assets/images/background_club.webp` | 672 KB | **HIGH** (v2 uses `background_arena.webp`, the only referenced bg) |
| `src/assets/images/background_profile.webp` | 784 KB | **HIGH** |
| `src/assets/images/background_rating.webp` | 808 KB | **HIGH** |
| `src/assets/images/background_trainings.webp` | 896 KB | **HIGH** |
| `src/assets/models/punching-bags.gltf` + `.bin` | 8 KB + 748 KB | **HIGH** (no loader refs) |
| `src/assets/textures/punch-texture.png` | 612 KB | **HIGH** |
| `src/assets/textures/punch_texture2.png` / `.webp` | 576 KB / 44 KB | **HIGH** |
| `src/assets/textures/colors.png`, `grid.png` | 4 KB + 4 KB | **HIGH** |
| `src/assets/images/punch.png` | 84 KB | **HIGH** |
| `src/assets/sound/punch_hit.mp3` | 4 KB | **HIGH** (only `punch_air.mp3` is used, by BottomMenu) |
| `src/assets/brand/logo-1024-black-bg.png` | 60 KB | **HIGH** (separate from live `public/og-image.png`) |
| `src/assets/images/icon_lock.png` | 24 KB | **HIGH** |
| 15 orphan SVGs in `src/assets/images/` | ~50 KB | **HIGH** |

Orphan SVGs: `icon_arrow_down.svg`, `icon_copy.svg`, `icon_draw.svg`, `icon_hide.svg`, `icon_lock.svg`, `icon_lock_white.svg`, `icon_lose.svg`, `icon_lucky.svg`, `icon_money_in.svg`, `icon_right_arrow.svg`, `icon_show.svg`, and `icons/attack.svg`, `icons/defense.svg`, `icons/position.svg`, `icons/trainer.svg` (action/trainer icons not imported by any v2 HUD).

> RainView assets (`rain.mp3`, `scene.glb`, `brick-normal2`, `rain-normal`, `asphalt-pbr01/`, `door/`) and `background_page.webp` are **already deleted** — confirmed absent.

**≈ 6.1 MB reclaimable** (backgrounds ~3.2 MB + model/textures ~2.0 MB + misc).

### J. CSS classes & `--hex-*` tokens with no usage

**135 `--hex-*` tokens defined; 77 statically referenced via `var()` → 62 statically unreferenced.**

⚠️ **Default MEDIUM, never HIGH** — many "unreferenced" tokens are consumed via **runtime string construction**: `--hex-belt-${color}` (BeltBadge), `--hex-arch-${id}` (ArchetypeSelector/AgentCard), `--hex-branch-${b}` (ResearchTree). Whole families resolve dynamically.

Clearly-unreferenced with no dynamic path (still MEDIUM — likely reserved for unbuilt redesign features): all 5 `--hex-rank-*` (bronze/silver/gold/platinum/diamond — league/tier system never built), `--hex-spacing-xxl`, `--hex-transition-slow`, `--hex-shadow-card`, `--hex-glow-lg`, `--hex-blur-lg`, `--hex-bg-deep`, `--hex-border-hi`, `--hex-mode-club`, `--hex-action-attack`, `--hex-action-position`, the `*-bg` victory/defeat/draw/info variants, and ~24 per-archetype `--hex-arch-*-{bg,dark,glow,light}` variants.

**No orphan CSS files** — every `.css` is `@import`-ed or imported via `main.js`.

### K. ABI / Web3 artifacts (PROTECTED — report only, no deletion)

| File | Ref status |
|---|---|
| `src/assets/abi/abi.json` | **REFERENCED** — `contractService.js` (`import contractABI`). |
| `src/assets/abi/HexlashAgents.json` | **UNREFERENCED** — zero imports. Its consumer chain (NFT mint) is in the preserve zone. **No deletion proposed.** |

### L. Documentation / `.md` files

`docs/` holds ~135 `.md` + 1 PDF + 1 `.py` + 1 standalone HTML, ~3.5 MB — overwhelmingly **historical migration paperwork** (Эпик 1–9 + Legacy Cleanup, all CLOSED). Almost none referenced by code.

| Group | Size | State / category | Conf. |
|---|---|---|---|
| `docs/visual-migration/` — ~40 `HANDOFF_*_CHAT_HANDOFF.md` | up to 31 KB ea | Single-use chat handoffs, all consumed. | **HIGH** stale |
| `docs/visual-migration/` — ~12 `*_PHASE_0_*` reports | up to 89 KB | Pre-flight investigations for closed sub-epics; purpose spent. | **HIGH** stale |
| `docs/visual-migration/` — ~45 `*_FINAL_REPORT.md` | 25–39 KB ea | Retrospectives of shipped work. | HIGH (historical; archive vs delete) |
| `docs/visual-migration/hexlash_v24.html` | **466 KB** | v24 prototype "source of truth" for the (now finished) migration. Single largest doc artifact. | MEDIUM (historical) |
| `docs/visual-migration/STARTUP_5T_AI_TRAINER.md` | — | Describes work that was **pivoted away** (→ i18n). | HIGH stale |
| `docs/legacy-cleanup/PHASE*_*.md` + `*.txt` | 232 KB | Completed-phase reports + working `.txt` lists. `SERIES_CLOSED.md` is the keep-index. | HIGH (work done) |
| Root `docs/*_REPORT.md`, `HANDOFF_POST_STREAM_1.md`, `auth-redesign-implementation-report.md`, `visual-audit-2026-04.md` | 7–29 KB | Shipped-work reports / consumed handoffs. | MEDIUM |

**Keep — live reference (do NOT flag):** the 5 combat design docs `docs/0[1-3]*.md` (source for `generate_pdf.py`), `club-mode-concept.md`, `docs/investigations/TASK_LANGUAGE_*` (back the still-open Phase 11), `SERIES_CLOSED.md`, and `CLAUDE.md`.

> The doc bulk is **low-risk to archive** but documents closed work. Owner should decide archive-vs-delete policy (see Open Questions). This is housekeeping, not code risk.

### M. Large commented-out code blocks (>10 lines)

**Not found.** Every >10-line comment run inspected (`FightView.vue:366`, `ClanScene.js:55`, `PitScene.js:153`, all `scene/objects/*` headers, `locales/index.js`, etc.) is **intentional documentation / JSDoc header**, not commented-out code. No dead code hiding in comments.

### N. Tests for removed code

Backend `backend/tests/` (8 files): all target **still-existing** code — `beltService`, `captainService`, `userMigrationService`, `emailService`, `helpers`, `captainArenaFlow`, `auth`, `dailyTaskService` (imports from `dailyTaskCron.js`, exists). **No stale tests.** Frontend has no test runner / spec files.

### O. Other

1. **Phantom (undeclared) dependency — `vuetify`.** `main.js` does `import {createVuetify} from 'vuetify'` and uses `.use(vuetify)`, and `vite-plugin-vuetify` autoImports Vuetify components — but **`vuetify` is not in `package.json` dependencies** (only the plugin is). Build relies on it being present transitively/implicitly. This is a *correctness* risk (clean `npm install` could break). **Recommend declaring `vuetify` explicitly** (not a deletion — opposite). Note: this contradicts CLAUDE.md's "Vuetify 2" — the plugin requires `vuetify >=3`.
2. **CLAUDE.md staleness (meta-finding).** CLAUDE.md asserts `AiTrainerAnalysis`, `ResearchTree`, and `ClanPageContent` are LIVE — all three are dead (their consumers were deleted). The AI-Trainer feature is described as active but is fully orphaned (frontend + `/ai/analyze-fight` backend). Worth correcting when these are removed.
3. **Guest-session subsystem partially dead.** `master/changeGuestArchetype`, `master/endGuestSession`, `master/getSignupState` are dead getters/actions while `master/restoreGuestSession` stays live (internal). Looks like a half-removed feature — owner should confirm whether guest mode is being kept.
4. **WS request DTO classes dead but protocol alive.** `src/core/models/ws/req/PunchBatchRequestMsg.js` (20L) + `FightTicketRequest.js` (20L) + their base `WsBase.js` (5L) have zero imports — `webSocketState.js` now builds WS messages inline. The *protocol message types* are alive; the *model classes* are not. (`ws/res/ErrorSocket.js` IS still used — keep.)
5. **`fightStylePreview.js`** (`src/utils/`, 47L) — CLAUDE.md already marks it "DEAD CODE — not imported". Confirmed zero imports. **HIGH.**
6. **Data files orphaned via the research subsystem:** `src/data/requirements.js` (14L, only "ref" is the legal word "requirements" in PrivacyView — false positive) and `src/data/branches.js` (20L, imported only by the orphan ResearchTree) + `src/data/clanLevels.js` (45L, imported only by orphan ClanPageContent). All **HIGH** (cascade). `cardPower.js`, `moves.js`, `clanMock.js`, `shopMock.js`, `pixelIcons.js` are live (or, for pixelIcons, dead-in-practice via PixelIcon — see A).
7. **Demo/cruft files at non-standard locations:** `test-icons.html` (root, 4.4 KB), `src/test-icons.html` (16.6 KB), `src/test-belts.html` (11.9 KB) — pixel-icon/belt demos, not part of the build. `HexlashApp-Frontend.iml` (575 B, IntelliJ module file — IDE cruft, usually gitignored). `Hexlash_Combat_System_Documentation.pdf` (172 KB root) — regenerable output of `generate_pdf.py`. All **HIGH/MEDIUM** housekeeping.

---

## 3. Summary

**Finding counts (excluding protected zones):**

| Confidence | Count (approx) |
|---|---|
| **HIGH** | ~16 orphan frontend files; 4 dead backend endpoints; ~32 dead Vuex getters + 5 actions; ~30 dead assets (~6.1 MB); 2 unused deps; ~90 historical docs; 4 demo/cruft files |
| **MEDIUM** | PixelIcon path, mutations, 4 Web3 deps, vestigial `:language` param, ~24 reserved CSS tokens, doc archive policy, smoke-test/backfill scripts |
| **LOW** | v1 `/arena/*` reachability, `check-email-cleanup-counts.js` |

**Estimated reclaim:**
- **Code:** ~2,800 lines across ~16 orphan frontend files + ~37 dead Vuex exports (line-level inside live files) + 3 dead backend endpoints.
- **Assets:** **~6.1 MB** (precise — backgrounds 3.2 MB, model/textures 2.0 MB, misc).
- **Docs:** ~3 MB of historical markdown (incl. the 466 KB `hexlash_v24.html`) — archive candidate.
- **Deps:** 2 HIGH-confidence removable packages (`@vueuse/core`, `lucide-vue-next`) + up to 2 Web3 packages (`@reown/appkit*`) pending owner confirmation.

**Top-5 fattest / least-obvious findings:**
1. **~6.1 MB dead assets** — biggest disk reclaim; the four unused `background_*.webp` + the orphaned 3D-punch-bag model/textures.
2. **`ClanPageContent.vue` (1085L) + its 3-component cascade + `clanLevels.js`** — largest single code orphan; superseded by v2 `HudClan`.
3. **`docs/visual-migration/` ~3 MB** of closed-epic paperwork (incl. 466 KB `hexlash_v24.html`) — non-obvious because it's not code.
4. **The entire Research subsystem is dead** (`ResearchTree.vue` 497L + `branches.js` + `requirements.js` + `agent/fetchAvailableMoves`) — **non-obvious because CLAUDE.md still documents it as live.**
5. **~37 dead Vuex getters/actions** scattered inside *live* module files (esp. 19 `cardFight` getters) — invisible to a file-level scan; superseded by v2's reactive-state fight model.

---

## 4. Recommended cleanup order

### Pack 1 — Low risk (HIGH, standalone, no cross-dependencies)
Delete-safe in one PR; each has zero references and no dependents:
- `src/components/AiTrainerAnalysis.vue` (+ backend `POST /ai/analyze-fight` route + its handler)
- `src/components/club/SkinPicker.vue`, `src/components/club/ArchetypeSelector.vue`
- `src/components/fragments/clan/ClanWithdraw.vue`
- `src/utils/fightStylePreview.js`
- `src/core/models/ws/req/PunchBatchRequestMsg.js`, `FightTicketRequest.js`, and `src/core/models/ws/WsBase.js` (the latter once the two req DTOs go)
- **Assets** (category I) — the ~6.1 MB list; verify `punch_hit.mp3` once more before removal.
- Backend dead endpoints: `PUT /user/progression`, `PUT /user/skin`, `PUT /user/settings`.
- Demo/cruft: `test-icons.html` (root), `src/test-icons.html`, `src/test-belts.html`, `HexlashApp-Frontend.iml`.

### Pack 2 — Medium risk (HIGH but dependency-ordered cascades)
Remove in the right order, re-grepping after each:
- **Clan page chain:** delete `ClanPageContent.vue` **first**, then its now-orphaned `ClanStats.vue`, `ClanAvatar.vue`, `ClanOwnerAvatar.vue`, and `src/data/clanLevels.js`. (Confirm `HudClan`/`ClanView` still build — they don't use these.)
- **Research chain:** delete `ResearchTree.vue` **first**, then `src/data/branches.js` and `src/data/requirements.js`; also remove dead `agent/fetchAvailableMoves` action and `fight/checkEmergencyProtocol`.
- **Vuex getters/actions** (category B) — line-level edits inside live modules; remove the listed dead getters/actions, then verify each removed mutation is no longer committed. Do `npm run build` after.

### Pack 3 — Needs owner decision (MEDIUM/LOW)
- `PixelIcon.vue` + `pixelIcons.js` + HexButton `icon` prop (kill the whole pixel-icon path, or keep as reserved).
- Web3 deps `@reown/appkit` + `@reown/appkit-adapter-wagmi` (remove?), and declaring `vuetify` explicitly.
- Deps `@vueuse/core`, `lucide-vue-next` (HIGH-unused but a dependency change → owner sign-off).
- Vestigial `:language` route param + `SocialTask.language`/`DailyTask.language` seed cleanup (CLAUDE.md Phase 11).
- Reserved CSS `--hex-*` tokens (esp. `--hex-rank-*`).
- Doc archive policy (category L) — archive vs delete the ~3 MB of closed-epic paperwork.
- v1 `/arena/*` screens (`PreparationView`, `FightClubView` + their subtree) — depends on Club-Mode v2 cutover plan.
- Guest-session subsystem (keep or finish removing).
- Backend one-off scripts + `scripts/smoke-test/` (keep as tooling, or wire into CI).

---

## 5. Open questions for the owner

1. **`docs/state-report-2026-05-24.md` is missing.** The task said to use it as a starting point — it doesn't exist in the repo. Was it committed elsewhere / on another branch, or not yet created?
2. **v1 `/arena/*` (PreparationView + FightClubView + Club-Mode subtree):** still URL-routable but unreachable from the v2 `/play` UI. Is the v2 Club-Mode cutover still planned (keep these), or has Club-Mode been dropped (then this whole subtree — AgentCard/AgentRoster/MorningReport/ModuleBuilder/ModeSelector — becomes a large deletable block)?
3. **Locales:** the 10 non-`en` locales are gone and won't be regenerated, correct? (No leftover machinery found — just confirming the English-only decision is permanent before treating `:language` params as vestigial.)
4. **Docs archive policy:** OK to delete the ~90 closed-epic HANDOFF/PHASE_0/FINAL_REPORT files and the 466 KB `hexlash_v24.html`, or move them to an `archive/` folder / git history only?
5. **Web3 deps:** are `@reown/appkit` / `@reown/appkit-adapter-wagmi` intended for a planned wallet-modal redesign, or leftovers? (Currently 0 references; wallet flow uses `@wagmi/vue` connectors.)
6. **Guest session:** is anonymous/guest play still a planned feature (keep `changeGuestArchetype`/`endGuestSession`/`getSignupState`) or fully abandoned?
7. **`vuetify` dependency:** confirm we should add `vuetify` to `package.json` explicitly (it's imported but undeclared) — and is the long-term plan to remove Vuetify entirely (a separate migration)?
8. **PixelIcon system:** kill it (component + data + HexButton icon prop), or keep as a reserved design-system primitive?
