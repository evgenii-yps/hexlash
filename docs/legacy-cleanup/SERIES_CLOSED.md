# Legacy Cleanup Series — CLOSED ✅

**Final artifact.** Comprehensive series retrospective. Closes 2026-05-15 with PR #380 (frontend merge) + PR #379 (Phase 10 Stage A backend).

This document is the standalone counterpart to the **`## Legacy Cleanup Series — CLOSED ✅`** section in [`CLAUDE.md`](../../CLAUDE.md). Both carry the same information; this file exists so the series stays self-contained inside `docs/legacy-cleanup/` for archival reference even if CLAUDE.md is later restructured.

---

## Summary

| | |
|---|---|
| **Series start** | 2026-04-XX (Phase 0 audit, `e30210d`) |
| **Series close** | 2026-05-15 (PR #380 merged) |
| **Phases executed** | 10 + Wrap-up |
| **Commits** | 24 (22 series + 2 wrap-up infrastructure) |
| **PRs merged к main** | 2 (#379 Phase 10 Stage A backend; #380 final frontend merge) |
| **Branch** | `claude/hexlash-design-setup-wbwFA` (continue stack), `fix/restore-agent-iscaptain-column` (PR #379 cherry-pick) |
| **Series streak** | 10/10 phases closed, plus wrap-up — zero hot-fixes, zero γ-tier recoveries |
| **Status** | **CLOSED ✅** |

---

## Cumulative impact

| Metric | Delta |
|---|---|
| Vue components retired | **14** |
| Vuex modules retired | **2** (`progressionState` whole; `punchState` partial) |
| Vuex actions retired | **38** + **22 cascade** items |
| Service-layer methods retired | **10** |
| i18n keys retired (`en.js`) | **448** (892 → 465 lines, **−48%**) |
| Assets retired | **265 KB** (`background_page.webp`) |
| Bundle size delta | **−44 KB** |
| Backend column dropped | `User.language` (PR #379) |
| v1 route chains retired | `/rules` chain (PageView + BackButton + Card + asset + router cascade) |

---

## Phases

| Phase | Scope | Commit(s) | Artifact |
|---|---|---|---|
| 0 | Audit | `e30210d` | [`PHASE0_AUDIT_REPORT.md`](PHASE0_AUDIT_REPORT.md) |
| 1.A | 23 pure-leaf orphan components — v1 ProfileView leaves | `73b90bd` | — |
| 1.B | Design-system primitives never adopted | `9f852f2` | — |
| 1.C | Misc leaf orphans (training/fight/clan/HUD) | `19958a9` | — |
| 2 | L1 ProfileAccount + chain | `a1d638b` | — |
| 3 | L4 ProfileSkins | `91b36d9` | — |
| 4 | L9 ProfileInvite (superseded by ReferralModal) | `0b64835` | — |
| 5 | ProfileWallet (NEW orphan beyond backlog) | `38ac3d2` | — |
| 6 | v1 training fragments (DailyTasks/SocialTasks/TaskModal) | `1312bcb` | — |
| 7-pre A | Vuex audit | `106f8ea` | [`PHASE7_PRE_PART_A_REPORT.md`](PHASE7_PRE_PART_A_REPORT.md) |
| 7-pre B | 38 actions + 22 cascade retired | `f771d5b` | — |
| 7-pre-2 A | Module/service audit | `5e4f017` | [`PHASE7_PRE_2_PART_A_REPORT.md`](PHASE7_PRE_2_PART_A_REPORT.md) |
| 7-pre-2 B | `progressionState` whole-module + `punchState` partial + Group C + 10 service-methods + CLAUDE.md contract-subsystem note + runtime nil-check | `bee213b` | — |
| 7 A | i18n audit (807 → 466 candidates after dynamic-access save) | `ba891ee` | [`PHASE7_PART_A_REPORT.md`](PHASE7_PART_A_REPORT.md) |
| 7 B | 448 i18n keys retired, `en.js` −48%, CLAUDE.md i18n architecture notes | `0bfaac4` | — |
| 8 Phase 0 | `/rules` v2 port discovery | `e161b53` | [`PHASE8_PHASE0_AUDIT_REPORT.md`](PHASE8_PHASE0_AUDIT_REPORT.md) |
| 8 implementation | RulesView (Path A) + route + redirect + cross-links + Skins orphan-name | `4ef81a1` + `44ee528` | — |
| 8 cleanup | v1 `/rules` chain retired: PageView + BackButton + Card + 265 KB asset + router cascade | `bb6c600` | — |
| (out-of-series) | HUD inline help modal — full guide link к `/play/help` (closes Help UX coherence parking) | `569ccea` | — |
| 9 discovery | L11 stale doc-comments + scope beyond | `794cc42` | [`PHASE9_DISCOVERY.md`](PHASE9_DISCOVERY.md) |
| 9 refresh | 14 reword edits across 8 files | `d040369` | — |
| 10 Stage A | Backend `User.language` column drop + helpers/routes/tests | **PR #379** (`f6fc38c`, `2101822`) | [`PHASE10_STAGE_A_INVENTORY.md`](PHASE10_STAGE_A_INVENTORY.md) |
| 10 Stage B | Frontend `masterModel` strip + `taskState` dead reads + mockData cleanup + masterState comment refresh | `34ac25f` | — |
| Wrap-up | Playwright smoke infrastructure (`scripts/smoke-test/`) | `2b80f21` | — |
| Wrap-up | SSO guard + VERCEL_BYPASS opt-in | `aa5cca3` | — |
| Wrap-up | Smoke report | `6c656ba` | [`WRAP_UP_SMOKE_REPORT.md`](WRAP_UP_SMOKE_REPORT.md) |

---

## Original backlog (L1–L11) — final disposition

| # | Item | Disposition | Phase | Commit |
|---|---|---|---|---|
| L1 | `ProfileAccount.vue` | ✅ **CLOSED** | Phase 2 | `a1d638b` |
| L2 | `Switcher3DPunch.vue` | ✅ **CLOSED** (via L1 chain) | Phase 2 | `a1d638b` |
| L3 | `ConfirmEmail`/`ChangeLogin`/`ChangePassword`/`DeleteAccount` | ❌ **NOT LEGACY** — Phase 0 reclassified, alive в v2 `HudProfileAccount` | Phase 0 | — |
| L4 | `ProfileSkins.vue` | ✅ **CLOSED** | Phase 3 | `91b36d9` |
| L5 | `BuyTokens.vue` | 🛡 **PRESERVE** — sealed под Base contract phase | n/a | — |
| L6 | `lblChangeLanguage` orphan key | ✅ **CLOSED** (part of Phase 7 i18n sweep) | Phase 7 B | `0bfaac4` |
| L7 | `auth.telegram` / `auth.reset` keys | ✅ **CLOSED** — pre-series (referral migration + 1b Telegram excision) | n/a | — |
| L8 | `INVITE_DURATION` magic number | ❌ **NOT LEGACY** — tech debt, отдельная микро-задача в parking | n/a | — |
| L9 | `ProfileInvite.vue` | ✅ **CLOSED** — superseded by ReferralModal | Phase 4 | `0b64835` |
| L10 | Backend language fields | ⚪ **PARTIALLY CLOSED** — `User.language` ✅ Phase 10 Stage A; `SocialTask.language` + `DailyTask.language` deferred к Phase 11 | Phase 10 Stage A | PR #379 |
| L11 | Stale doc comments | ✅ **CLOSED** — 14 reword edits across 8 files | Phase 9 | `d040369` |

**Totals:** Closed 7 · Reclassified not-legacy 2 · Preserve 1 · Partial 1.

---

## Findings beyond backlog (6 categories)

Series discovered substantially more debt than the original L1–L11 audit captured:

1. **`ProfileWallet.vue`** (Phase 5) — surfaced during Phase 2 chain follow-up
2. **v1 training fragments** — `DailyTasks` / `SocialTasks` / `TaskModal` (Phase 6) — replaced by v2 HUD
3. **38 Vuex actions + 22 cascade items** (Phase 7-pre) — dead action chains from earlier sub-epics never wired
4. **`progressionState` whole-module retired + `punchState` partial + `cardFight` / `pvpState` / `agentState` orphan entries + 10 service-methods** (Phase 7-pre-2)
5. **448 i18n keys** (Phase 7) — orphan English-only keys after multi-locale → English-only migration
6. **v1 `/rules` chain** — `PageView` + `BackButton` + `Card` + 265 KB `background_page.webp` asset + router cascade (Phase 8)

Plus **27 orphan components** from Phase 1 atomic batch (1.A / 1.B / 1.C clusters).

---

## Active parking list (snapshot at series close)

Forward к Эпик 7+ work / future series. Snapshot mirrors CLAUDE.md `## Legacy Cleanup Series — CLOSED ✅ → Active parking list` section.

### Preserve / carve-outs (intentional — do not touch without coordinated phase)

1. `uploadMasterAvatar` Vuex action
2. `webSocket/handleInternalError` Vuex action (defensive handler)
3. `nftMintService.js` whole file (mirror L5 BuyTokens dependency)
4. **Contract subsystem** — `contract/*` Vuex + `contractService` + `contractState` + `contractABI`. Sealed под Base contract phase.
5. **L5 `BuyTokens.vue`** — preserve under Base contract phase
6. `friends.*` (23 i18n keys) — preserve pending Friends UI regression investigation (parking #7)

### Open findings (require separate work)

7. **Friends UI regression investigation** — when/why disappeared, was it sanctioned, restore?
8. **Product question: progression-restore/sync re-implement** — 3 broken-namespace silent no-op finding, functionality dead on prod for unknown duration
9. **Review `startFight` progression dependency** — defensive `rootState.progression || {}` nil-check, masks semantic question parented to #8
10. **Telegram adaptive flag chain preserve-zone broken** — `ProfileButtons.vue` removed in Phase 1.A; `isTelegramMiniApp` flag still written with 0 readers
11. **Phase 11 candidate** — `SocialTask.language` + `DailyTask.language` columns + `task.js` route filters + `seed.js` rewrite + RU-duplicate prod data cleanup
12. **Phase 11 sub-decision** — 11 RU-task user-history rows: accept loss vs migrate FKs
13. **`ModuleBuilder.vue:131,139,150`** — `.value` on string primitive (pre-existing bug from Phase 1.5c)

### Tech debt / methodology / minor

14. `userRepository.getUserByIdFromDB` — DB-layer orphan
15. `punchService` structural review (folding into `webSocketState`?)
16. `restoreProgressionFromServer` rename candidate
17. `localStorage['hexlash_progression']` orphan-data cleanup at next major migration
18. PixelIcon / HexButton icon-prop refactor (icon prop never adopted by app)
19. `test-icons.html` orphan demo file at repo root
20. Vuetify removal — separate series after legacy-cleanup
21. `updateJwtToken` pre-existing dead import at `masterState.js:10` (Stream 1 C3 carry-over)

### Closed during series (NOT in parking)

- ✅ Help UX coherence — closed by `569ccea`

---

## Methodology lessons learned (3 cross-cutting — M1/M2/M3)

These are series-level process insights, complementing the Эпик 5–6 Lesson catalogue (#1–#46) without adding new numbered entries.

### M1 — Full cross-stack inventory BEFORE ТЗ-writing

Phase 10 ТЗ surfaced 3× scope expansion only after Stage A inventory pass (locales / models / services / migrations / tests / routes — 6 layers). Without upfront inventory, ТЗ underestimated scope by ~3× and Stage A risked spilling into Stage B without explicit gate.

**Pattern для future cleanup series:** Phase 0 must include layered inventory (FE consumers / BE consumers / DB schema / locale duplicates / tests / migrations) before sizing decisions. Mirrors Lesson #45 (Phase 0 metadata triple-verify) but at series scope.

### M2 — Cross-check preserve-zone justifications when retiring components

Phase 1.A retired `ProfileButtons.vue` after grep showed no live wires. Stream 1 post-series Phase 0 discovery: `App.vue:203-216` adaptive-UI Telegram detection chain wrote `isTelegramMiniApp` flag whose **sole reader** was the just-retired `ProfileButtons.vue`. Flag became dead-write (0 readers) silently.

**Pattern:** when retiring components inside or near a documented preserve-zone, grep the preserve-zone's stated dependencies independently — don't assume CLAUDE.md preserve notes are still accurate. Mirrors Lesson #11 broader-than-ТЗ-grep but at chain-link level. Parking item #10 captures the dead-write that resulted.

### M3 — Phase 0 audit checklist additions for future series

From cumulative blind spots surfaced across Phases 7-pre, 7-pre-2, 7 Part A:

- **Broken-namespace grep** — `store.dispatch('foo/bar')` где module `foo` doesn't exist → silent no-op + console warning. Phase 7-pre-2 found 3 such call-sites that masked real product gaps for unknown prod duration. Add to Phase 0: enumerate all `dispatch('NAMESPACE/`) calls, verify NAMESPACE exists в module registry.
- **`rootState.<module>` cross-module grep** — modules that read other modules' state via `rootState.foo.bar` create silent dependencies invisible to single-module greps. Phase 7-pre-2 surfaced `startFight` `rootState.progression || {}` after `progressionState` retirement → defensive nil-check papered over a semantic question (parking #9). Add to Phase 0: grep `rootState\.<module>` across all `*State.js` before declaring module orphan.
- **i18n dynamic-access patterns** — narrow regex `t\.value\.[a-zA-Z]+\[` misses `?.[`, `[id]` template syntax, chained optional `?.X?.[id]`. Phase 7 Part A caught 6 dynamic patterns, saved 71 keys from false retire (807 → 466 candidates, then 448 retired). Add to Phase 0 i18n audit: extend regex to cover `\?\.\[`, `t\..*\?\.\[` (chained optional), and `[varname]` (template runtime keys).
- **Asset orphan scan** — images / fonts / audio referenced only by retired components remain в `public/` and `src/assets/`. Phase 8 caught `background_page.webp` (265 KB) only because `bb6c600` reviewer noticed the same author retired its sole consumer в `4ef81a1`. Add to Phase 0: when retiring a component / view, grep its template + scoped CSS for `src=` / `url(` / `import` of `.webp/.png/.jpg/.mp3/.ttf/.woff` and surface assets с sole-consumer linkage as cleanup candidates.

---

## Merged PRs

- **PR #379** — Phase 10 Stage A backend (`User.language` column drop + helpers/routes/tests + 105 backend tests passing). Merged 2026-05-15.
- **PR #380** — Legacy Cleanup Series final merge (10 phases + wrap-up, 24 commits). Merged 2026-05-15.

---

## Reports index

| File | Phase | Scope |
|---|---|---|
| [`PHASE0_AUDIT_REPORT.md`](PHASE0_AUDIT_REPORT.md) | 0 | Initial L1–L11 audit |
| [`PHASE7_PRE_PART_A_REPORT.md`](PHASE7_PRE_PART_A_REPORT.md) | 7-pre A | Vuex action audit (38 + 22 cascade) |
| [`PHASE7_PRE_2_PART_A_REPORT.md`](PHASE7_PRE_2_PART_A_REPORT.md) | 7-pre-2 A | Module + service-layer audit |
| [`PHASE7_PART_A_REPORT.md`](PHASE7_PART_A_REPORT.md) | 7 A | i18n audit (807 → 466 → 448 retired) |
| [`PHASE7_RETIRE_LIST.txt`](PHASE7_RETIRE_LIST.txt) | 7 | i18n retire list |
| [`PHASE7_DYNAMIC_PROTECTED.txt`](PHASE7_DYNAMIC_PROTECTED.txt) | 7 | i18n dynamic-access protected keys |
| [`PHASE8_PHASE0_AUDIT_REPORT.md`](PHASE8_PHASE0_AUDIT_REPORT.md) | 8 Phase 0 | `/rules` v2 port discovery |
| [`PHASE9_DISCOVERY.md`](PHASE9_DISCOVERY.md) | 9 | L11 stale doc-comment discovery |
| [`PHASE10_STAGE_A_INVENTORY.md`](PHASE10_STAGE_A_INVENTORY.md) | 10 Stage A | Backend `User.language` inventory |
| [`WRAP_UP_SMOKE_REPORT.md`](WRAP_UP_SMOKE_REPORT.md) | Wrap-up | Playwright smoke harness + Vercel SSO finding |
| `SERIES_CLOSED.md` (this file) | n/a | Final series summary artifact |

---

## Status

**Legacy Cleanup Series — CLOSED ✅.**

Next direction is owner's call. Parking items #7–#21 are independent — they're new series candidates or micro-tasks, no longer legacy cleanup work. Priority ordering decision is on the owner.

Likely next-direction shortlist (owner-prioritized):

- **Phase 11 candidate** — task-language retirement (#11/#12)
- **Friends UI regression investigation** (#7)
- **Telegram adaptive flag chain decision** (#10)
- **Vuetify removal series** (#20)

— end of series —
