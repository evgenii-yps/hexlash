# HANDOFF — Sub-Epic 5T closed → 5U start

**Date:** 2026-04-30
**From:** Sub-Epic 5T ι i18n Consolidation (Path D ultra-strict) closure
**To:** Sub-Epic 5U start (option pending user decision — 5U is THE closer for Epic 5)
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continue stack — 11th decision precedent maintained from 5J-5T)
**HEAD:** `837aa7e` (P4b2 — FINAL_REPORT closure). Will update post-P5b/P6.

---

## 1. Where we are

**Sub-Epic 5T CLOSED** (pending P6 CLAUDE.md update finalizing). Methodology-heavy sub-epic — dual-pivot trajectory (γ → ι → Path D ultra-strict) with P1 collapse to NO-OP. 1 functional commit + 4 docs commits + 3 FINAL_REPORT split commits + (forthcoming P5/P6).

**Эпик 5 §4.2 progress: 21/22 (95%) — ONE sub-epic remaining.** 5U is the **closer** — Epic 5 §4.2 reaches 22/22 at successful 5U closure.

**Hot-fix streak: 15 preserved entering 5U.** Goal: **16-streak by 5U closure** = clean Epic 5 finale.

**After Epic 5 closure → Epic 6 cutover (final):** `/v2/*` becomes default route, continue stack merges to main, legacy `/src` components removed, parking list (52 items in `/docs/phase1-parking-list.md`) addressed.

### Cumulative metrics entering 5U

- **Lessons promoted:** 35 (no promotion in 5T)
- **Lesson candidates active:** 5
  - **#36** — Incomplete rollback drift detection (PROMOTE pending 2nd test, N/A in 5T)
  - **#37** — Sandbox capability empirical verification (pre-formal, N/A in 5T)
  - **#38** — Multi-layer deploy environment awareness extension (pre-formal, sub-pattern of #33, N/A in 5T)
  - **#39 (new from 5T)** — Pre-migration callsite enumeration / generic-word scoping (Lesson #11 specialization for i18n; PROMOTE pending 2nd application)
  - **#40 (new from 5T)** — Locale section-ordering variance (sub-pattern of #11; PROMOTE pending 2nd occurrence)
- **Cumulative recoveries:** ~77 (71+ entering 5T + 6 in 5T session — #72/#73/#74/#75/#76/#77, all adaptation-tier per Lesson #35)

---

## 2. What 5T closed

5T = methodology-heavy sub-epic with dual-pivot trajectory.

### Functional outcome

- **22 orphan locale entries deleted** in P2 commit `141e814` (`clan.lblCancel` × 11 locales + `xpAllocation.cancel` × 11 locales)
- 0 source-code changes
- `modal.btnCancel` preserved (15 active callsites)
- Build clean, end-to-end orphan validation confirmed (P3 NO-OP)

### Methodology outcome (4 contributions)

1. **3-layer i18n validation framework** — presence (Q1.1) → value-equivalence (Q1.6 refined) → callsite-presence (Q1.7 P1 Step 1). Each layer caught a distinct failure mode (Recovery #75/#76).
2. **Section-ordering-variance awareness** — locale files do NOT share section ordering across translations. Pattern-based scoping required.
3. **Generic-word collision pre-check pattern** — keys with common English words require section-scoped uniqueness verification before structural edits (Recovery #77 catch).
4. **Dual-pivot precedent (γ → ι → Path D)** — intra-sub-epic strategic re-pivots tractable when investigation surfaces premise issues. 3-condition validity rule per FINAL_REPORT §7.

### Recovery log (6 candidates, all adaptation-tier)

- **#72** — γ greenfield assumption falsified (P0.5)
- **#73** — v2 mock fightState gap (P0.5)
- **#74** — Yesterday symmetry false (P0b Q1.6)
- **#75** — Value-equivalence methodology gap (P0d trigger)
- **#76** — Orphan source paths (P1 Step 1) → P1 collapse to NO-OP
- **#77** — Generic-word section collision (P2 Step 4 pre-edit) → averted destructive sed

### Pivots

- **2 strategic:** γ AI Trainer → ι i18n consolidation (Recovery #72/#73); ι Hybrid-2 (11 dupe groups) → ι Path D ultra-strict (1 dupe group, Recovery #74/#75)
- **1 collapse:** P1 functional commit → P1 NO-OP (Recovery #76)

### Investigation-refines-ТЗ pattern — quintuple-precedent firmly established

5O / 5Q / 5R / 5S / 5T = 5 sub-epic precedent. 5T extended pattern to support intra-sub-epic re-pivots (3-condition validity rule per FINAL_REPORT §7). Pre-investigation ТЗ continues default-treated as draft for entire sub-epic duration, not just initial scope refinement.

### Preventive split framework — 6 applications + 1 reactive in 5T alone

Infrastructure-driven framework fully matured. Long-form docs deliverables default to preventive split from start (P0c1, P0c2, P4a, P4b2, P5a, P5b). Reactive variant fallback on stream idle timeout intact (P4b → P4b1+P4b2 reactive split).

---

## 3. 5U option matrix

5U is the **last** sub-epic before Epic 5 closure (§4.2 reaches 22/22). Selection criteria:

1. **Streak-friendly** (16-streak goal; Epic 5 ends with clean closure preferable)
2. **Bounded scope** (no surprise expansion mid-sub-epic; reactive split tolerable, scope explosion not)
3. **Real value-add** (functional improvement OR institutional knowledge OR carry-over closure)
4. **Closes carry-overs** preferred over opens new (4 carry-overs forward, see §4)

| Option | Sub-epic candidate | Size | Streak risk | Notes |
|---|---|---|---|---|
| **κ** | Retirement animation (Path A) | S | Low | Frontend animation pass for retirement UI. 1 carry-over closure. Streak-friendly closer. **RECOMMENDED.** |
| **κ Path B** | Retirement animation + achievement badge | M | Low-medium | Animation (S, frontend) + badge (M, requires backend Achievement entity DB schema → Lesson #33 PR-to-main chain). 2 carry-overs closure. Higher value-add but elevated streak risk via backend chain. |
| **γ** | AI Trainer | M | Medium | Deferred 3 sub-epics (5R/5S/5T pivot). v2 mock fightState gap remains blocker (Recovery #73). Backend Anthropic SDK ready. **High product value** but high streak risk for closer slot. |
| **λ** | i18n parity (carry-forward from 5T) | M-L | Medium-high | 8+ broken English placeholders, 31 × 2x dupes, 3 cross-locale-fragmented keys, pre-existing locale gaps. Translation correctness verification + scope ambiguity = high streak risk. **Anti-rec for closer slot.** |
| **μ** | HudProfile card-creep refactor | M | Medium | 6/7 monitor threshold (5L+→5S→5T). Trigger condition not yet met. Pre-emptive refactor = scope creep. Defer until 7th card added. |
| **ν** | Lesson-candidate validation pass | XS-S | Very low | 5 active candidates (#36-#40). Pure documentation review + cross-reference for validity / promotion / drop. **Streak-safe by construction** but lower visible value-add. Defensible but uninspiring closer. |
| ε | FightClub feature | M-L | High | Anti-rec preserved from 5Q (scope ambiguity AI Lv1/2/3 tiering). Defer to Epic 7+. |
| η | Onboarding | M | High | Anti-rec preserved (design ambiguity). Defer. |
| θ | MoveTree | L | High | Anti-rec preserved (size unfriendly to streak goal). Defer. |

### Recommended: κ Path A (Retirement animation, S, streak-safe)

Reasoning:

- **Closes 1 of 4 carry-overs** (animation deferred since 5Q)
- **S-size scope** = streak-friendly closure for Epic 5
- **Frontend-only** (no PR-to-main chain, Lesson #33 not triggered)
- **Real visible UX improvement** (retirement is feature-complete except visual polish)
- 16-streak goal achievable with low risk

### Alternative options considered

- **κ Path B (animation + badge):** valid if double carry-over closure prioritized over streak risk. Backend Achievement entity DB schema work + Railway deploy chain raises medium streak risk via Lesson #33 deploy environment awareness. Defensible if user wants 2 carry-overs closed in single sub-epic; escalates streak management.
- **γ AI Trainer:** valid if user prefers ending Epic 5 on feature work. Risk: v2 mock fightState gap (Recovery #73 unresolved) requires backend extension OR pragmatic adapter (degraded UX). Both raise streak risk + scope ambiguity. **Not recommended for closer slot** — better as Epic 6+ feature work post-cutover.
- **ν Lesson-candidate validation:** valid if streak preservation maxed and user accepts low value-add closer. Effectively maintenance mode. Streak-safe by construction but doesn't ship visible improvement. Defensible Epic 5 closer if 16-streak is the only KPI.
- **λ i18n parity anti-rec:** translation correctness + scope ambiguity = high streak risk. Defer to Epic 6+ or dedicated localization sub-epic post-Epic-5.

---

## 4. Carry-overs forward (5T → 5U)

| # | Item | Source | Status |
|---|---|---|---|
| 1 | Animation для retirement | 5Q drop | **CARRY-OVER** (κ Path A primary candidate for 5U) |
| 2 | Achievement badge для retirement | 5Q drop | CARRY-OVER (κ Path B if double closure attempted; backend extension required, Lesson #33 chain) |
| 3 | HudProfile card-creep monitor | 5L+ → 5S Q1.3 | MONITOR-FORWARD (6/7 threshold; trigger refactor only if 7th card added in 5U or Epic 6) |
| 4 | Lesson #36 validation track | 5R | CARRY-OVER (await 2nd occurrence of incomplete rollback drift; N/A in 5T frontend-only) |

### Future i18n parity sub-epic candidates

Documented in 5T FINAL_REPORT §8 as future scope, **NOT 5U scope** (per Path D scope discipline + λ anti-rec for closer slot):

- 8+ broken English placeholders in non-EN locales (`club.lblBack`, `pvp.wins`, `clan.tabMembers`, `clan.lblTotalFights`, `pvp.losses`, `club.lblMoves`, `fight.lblAiRetry`, `club.lblConfirmStep`, `club.lblNext`)
- Genuine context-divergent translations (`name`: clan-entity vs person; `retry`: verbose vs short; `wins`/`losses`: PvP-context shorter form)
- 31 × 2x-only dupes (originally excluded from 5T per Path D scope discipline)
- 3 cross-locale-fragmented keys (today/yesterday/login)
- Pre-existing locale gaps (`profile.invite.btnLogin` × 9 locales, `club.lblToday`/`club.lblYesterday` × 10 locales)
- gameData.branches.{speed,power,technique}.name (semantic separation from UI labels — Lesson #32 boundary)
- club:184 / clan:126 internal restructuring (out-of-scope, Strategy 3 hybrid)

These accumulate as **future i18n parity sub-epic** candidates — Epic 6+ or post-Epic-5 dedicated localization work, not 5U.
