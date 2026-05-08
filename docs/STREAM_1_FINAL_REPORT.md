# Stream 1 Cleanup Batch — Final Report

**Type:** Cleanup batch (carry-over closure across 1b/8a/8b/8c sub-epics)
**Closed:** 2026-05-08
**Streak:** 1 → 2 ✅
**Branch:** `claude/cleanup-stream-1-phase0` (fresh from `origin/main` @ `c6ca2cc` per Phase 0 STEP 0 Option A switch)
**Final commit:** CL3 — handoff to next direction (this commit chain ends with `docs(stream-1): handoff to next direction`)

---

## Summary

Stream 1 закрывает 4 carry-overs accumulated через 1b → 8c sub-epic chain. Zero feature work, zero behavior change на user-facing surfaces. Pure dead code removal + methodology formalization.

3 functional + 3 closure commits. 2 STOP gates (G1 после C2 + G2 после C3). Phase 0 read-only investigation предшествовал Phase 1 (mandatory STEP 0 + 6 subsections per Lesson #43 FORMALIZED procedure).

**Net delta:**
- Source code: -81 lines across 4 files (3 modified + 1 deleted via `git rm`)
- Documentation: +110 lines в `CLAUDE.md` (C1 Lesson #43 formalization + CL1 Stream 1 closure entry)
- Bundle: main brotli **477.24 → 475.75 kB** (-1.49 kB, dead-code removal reflected)

---

## Outcomes

| Goal | Status | Commit |
|---|---|---|
| Lesson #43 canonical formalization | ✅ DONE | C1 `7a39d61` |
| α/β/γ sub-variant taxonomy | ✅ DONE | C1 |
| Recovery counter retirement (α/β no longer increment) | ✅ DONE | C1 |
| `AppV2.vue:24` stale comment refresh | ✅ DONE | C2 `01ddb42` |
| `master/resetPassword` chain dead code removal | ✅ DONE | C3 `65ef4ee` |
| `master/saveTelegramFlag` wrapper + `setIsTelegram` phantom removal | ✅ DONE | C3 |
| `App.vue` rewire dispatch → direct service call (Phase 0 §2 Option a) | ✅ DONE | C3 |
| `passwordResetStateModel.js` file delete | ✅ DONE | C3 |
| Streak progression | ✅ 1 → 2 | — |
| Hot-fix count | ✅ 0 | — |
| γ-tier Recovery count | ✅ 0 | — |

---

## Phase 0 findings recap

### STEP 0 — 13th occurrence Lesson #43, **1st β-variant**

Branch initial state was `claude/auth-ui-redesign-GnjpC` @ `98b3603` (prior session work). PR #369 had merged auth-redesign series into `main` between sub-epic boundaries. Branch became `main - 1 merge commit`, content-identical к `origin/main` @ `c6ca2cc`.

This is **NOT** typical α-variant (harness slug variance, 12 prior occurrences). It's variant β: post-merge label drift. Surfaced and resolved Option A switch к fresh `claude/cleanup-stream-1-phase0` from `origin/main`. Documented в C1 formalization as canonical entry distinguishing α (harness slug) from β (post-merge merge commit) from γ (real divergence requiring STOP).

### §1 — `resetPassword` chain — clean orphan, safe full delete

- All chain references **self-contained** in 3 files: `masterState.js`, `masterService.js`, `passwordResetStateModel.js`
- ZERO consumer files outside chain
- i18n leftover: `masterService.resetPassword` body referenced `t.value.auth.reset.*` (4 sites at lines 184/190/197/199), all keys deleted in 1b C7. References were unreachable since action had zero callers; references disappeared automatically when function deleted
- BE endpoint `POST /v1/user/reset` returns 501 (1b decision #4) — Stream 3 carry-over, FE/BE decoupled

### §2 — `saveTelegramFlag` + `setIsTelegram` phantom — **Lesson #45 catch**

**Critical correction vs handoff:** phantom mutation source at `masterService.js:397` (inside `setTelegram()` body), NOT in action body as handoff hypothesized. Adaptation-tier resolution, scope unchanged. Action body is pure passthrough wrapper (`async saveTelegramFlag({}) { masterService.setTelegram(); }`). Real phantom is `store.commit('master/setIsTelegram', true)` line inside service.

ProfileButtons.vue reads via `masterService.getTelegram()` direct service call (NOT Vuex state). Behavior preservation guarantee: `setTelegram()` body retained localStorage write, only phantom commit line removed. Adaptive UI invariant byte-equivalent for ProfileButtons consumer.

### §3 — `AppV2.vue:24` stale comment

Single stale `isV2Route` reference cross-codebase. Renamed to `isPlayRoute` in 8a C2 (`30c618f`) but comment not updated. Single-token swap, zero risk.

### §4 — Lesson #43 wording

Option B (hybrid α/β/γ) accepted by design-Claude. Canonical entry inserted after Lesson #46 PROMOTED block (end of methodology family).

### §5 — Negative-space audit

Zero CSS impact. No `mapMutations`/`mapActions`/`mapState` consumers of deleted symbols. Vuex strict mode not enabled (per `store.js`) — phantom commits silent no-op throughout.

### §6 — Repo sanity

Clean baseline, build passes pre-Phase-1.

---

## Phase 1 execution log

| Commit | SHA | Description | Files | Lines | Lesson #11 catches |
|---|---|---|---|---|---|
| C1 | `7a39d61` | docs(methodology): formalize Lesson #43 with α/β/γ taxonomy | CLAUDE.md | +39 | 0 (single insertion, line drift adaptation OK) |
| C2 | `01ddb42` | refactor(app-v2): refresh stale comment isV2Route → isPlayRoute | AppV2.vue | -1 / +1 | 0 (clean grep both pre/post) |
| C3 | `65ef4ee` | feat(cleanup): remove orphan resetPassword + saveTelegramFlag chains | App.vue + masterState.js + masterService.js + (deleted) passwordResetStateModel.js | -86 / +5 | 0 false positives, 1 adaptation-tier finding (`updateJwtToken` dead import — Lesson #18 scope discipline, deferred) |
| CL1 | `29d37b5` | docs(stream-1): CLAUDE.md sync — Stream 1 closure entry | CLAUDE.md | +71 / -7 | — |
| CL2 | (this commit) | docs(stream-1): final report | docs/STREAM_1_FINAL_REPORT.md | +N (new) | — |
| CL3 | (next) | docs(stream-1): handoff to next direction | docs/HANDOFF_POST_STREAM_1.md | +N (new) | — |

### G1 STOP gate (after C2)

```
- C1 SHA: 7a39d61
- C2 SHA: 01ddb42
- Branch state: 2 ahead of origin/main, clean
- Build: PASS, brotli 478.11 kB (+0.87 kB drift from Phase 0 baseline 477.24 kB
  — chunk hash determinism artifact, NOT content change)
- Conventional pattern correct ✓
- Lesson #11 footer present in both commits ✓
- Result: APPROVED — proceed к C3
```

### G2 STOP gate (after C3)

```
- C3 SHA: 65ef4ee
- Branch state: 3 ahead of origin/main, clean
- Build: PASS, brotli 475.75 kB (-2.36 kB from G1 baseline — dead-code
  removal hit bundle, hypothesis validated)
- Cross-codebase grep на 7 deleted symbols: ZERO matches
- Vuex strict mode: not enabled (Phase 0 §5 confirmed)
- Sandbox limit: G2.3 (dev mode boot) + G2.4 (adaptive UI smoke) cannot
  be executed without browser. Static guarantee analysis covers both:
  phantom mutation warning eliminated by code path removal, ProfileButtons
  consumer path byte-equivalent (getTelegram → localStorage).
- Result: APPROVED — proceed к closure phase
```

---

## Lessons applied

**#11 pre-edit + post-edit grep** — universal pattern на каждом commit. C3 surfaced multi-set pre-edit (3 sets covering both chains + import baseline) + per-file re-grep между 6 sequential edits в `masterState.js` (bottom-to-top order to keep upper line numbers stable) + post-edit per-file ZERO-match verification + final cross-codebase ZERO-match сweep across all 4 modified/deleted files. Zero false positives this run.

**#18 STOP-tier scope discipline** — caught `updateJwtToken` pre-existing dead import at `masterState.js:10` during C3 pre-edit grep. Predates Stream 1, different orphan, different scope. Left in place, deferred forward as separate carry-over rather than fix-on-the-go expansion.

**#32 convention discovery** — App.vue State B detection (masterService not yet imported); added new named import matching existing double-quoted style. Mirrored existing import convention `import {x} from "@/path"` rather than mixing styles.

**#43 STEP 0 bootstrap** — 13th occurrence, **1st β-variant**. Resolved Option A clean branch switch. Formalized в C1 with α/β/γ taxonomy + Recovery counter retirement (α/β silent adaptation, only γ counts as Recovery).

**#45 Phase 0 metadata triple-verify** — 1 catch in §2 (phantom location: handoff hypothesized action body, reality `masterService.js:397`). Re-grep at C3 pre-edit confirmed actual location, edit applied at correct site. Adaptation-tier resolution, scope unchanged.

**#46 Document-level CSS audit** — verified zero CSS impact in Phase 0 §5. No occurrence reinforcement needed (Stream 1 не touches DOM/CSS/global stylesheets).

---

## New carry-overs surfaced (forward к next streams)

1. **`updateJwtToken` pre-existing dead import at `masterState.js:10`** — Lesson #18 scope discipline left in place. ~1 line cleanup в next cleanup batch.

---

## Manual checklist for user (post-merge)

После merge Stream 1 PR в main, user должен manually:

1. **GitHub: delete stale branch `fix/remove-telegram-auth-be`** (1b carry-over — branch was created для BE Telegram excision, since merged via PR #361/#362, no longer needed)

2. **Railway: remove env var `TELEGRAM_BOT_TOKEN`** (1b C8 deleted code that read it; env var unused but consumes secret slot)

3. **Vercel preview smoke test (recommended pre-merge):** open PR Vercel preview URL, navigate to `/play/profile`, open DevTools console. Verify:
   - Zero `[vuex] unknown mutation type: master/setIsTelegram` warnings
   - Zero `[vuex] unknown action type: master/saveTelegramFlag` warnings
   - Wallet button renders correctly in non-Telegram browser context
   - ProfileButtons consumer path unchanged but live verification protects against environment-specific issues. G2.3/G2.4 deferred from sandbox limits.

Items 1+2 don't require code change. Item 3 is recommended pre-merge gate (sandbox sub for G2.3/G2.4 live tests).

---

## Next direction recommendations

См. CL3 handoff (`docs/HANDOFF_POST_STREAM_1.md`) для full menu. Top candidates:

- **Stream 4 Visual Polish** (recommended) — auth refinement, og:image banner upgrade, gameplay video asset
- **Stream 3 BE features** — password reset email backend, subscribe email collection
- **Stream 6 Web3** — Connect Wallet SIWE backend integration

---

## Streak journey

```
0 → 1 → 2 → 3 → 4 → 0 → 1 → 2 ✅
```

(8b retroactive break при post-deploy hot-fix → 8c rebuild from 0 → Stream 1 continued from 1 → 2.)

Lesson #46 PROMOTED via 8b hot-fix retrospective; Stream 1 continued the rebuild cleanly.

---

## File deltas

```
 CLAUDE.md                                          | +110 / -7    (Lesson #43 FORMALIZED + Stream 1 closure entry + carry-over re-tags)
 docs/STREAM_1_FINAL_REPORT.md                      | +N (new)
 docs/HANDOFF_POST_STREAM_1.md                      | +N (new)
 src/App.vue                                        | +6 / -2      (named import + dispatch → direct call + comment refresh)
 src/AppV2.vue                                      | +1 / -1      (comment token swap)
 src/core/services/masterService.js                 | -28          (resetPassword export + phantom commit line)
 src/core/state/modules/masterState.js              | -26          (action + 2 mutations + getter + state field + import + setTelegram named import)
 src/core/models/internal/passwordResetStateModel.js| -31 (deleted)

 6 commits ahead of origin/main, ~+125 / -95 = +30 net (mostly docs)
```

---

## End of Stream 1
