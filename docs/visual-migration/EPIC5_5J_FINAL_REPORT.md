# EPIC5 Sub-Epic 5J FINAL REPORT — Profile Move (Path 2)

**Закрыт:** 2026-04-28
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continued from 5I)
**Predecessor:** 5I ✅ CLOSED (`fd4b575`)
**Path 2 of 5J HANDOFF §4 — small wins first** per user A→B order

## §3 Технические детали

### 3.1 Path D invert default — semantic decision rationale

Investigation Block 8 surfaced 4 alternative approaches:
- Path A (refactor с conditional positioning prop)
- Path B (new variant component HudSocialTasksProfile.vue)
- Path C (CSS-only override)
- Path D (invert default — drop fixed-pos from base, .is-overlay opt-in modifier)

Path D chose semantically aligned per lesson #30 — natural card shape default, overlay = special context. Vs Path C minimum-touch but semantically backward.

### 3.2 80% token alignment finding

Pre-existing visual lineage `.tsp-*` ≈ `.profile-card`:
- Both use `--bg-panel` background
- Both use `var(--font-mono)` для typography
- Both use `--text-dim` для secondary text
- Border / padding / blur deltas — minor (8px vs 6px radius / 16px 18px vs 12px 14px / blur 14px vs 12px)

This finding enabled "drop container styles" decision (Step 1) without fighting cascade.

### 3.3 Investigation-driven structural decisions

Block 6/7/8 analysis enabled choosing Path D:
- Block 6 — current visual style of HudSocialTasks
- Block 7 — Profile card baseline для mirror reference
- Block 8 — 4-option matrix с trade-offs

Без investigation — decision был бы guess-driven.

### 3.4 Branch switch resolution (Blocker A)

Pre-flight Step 0 caught harness directive (`claude/profile-move-migration-lgqnb`) vs ТЗ branch (`claude/setup-5e-shop-mode-a-khIAi`) divergence. Per Lesson #18 — STOP at structural mismatch, no blind git ops. User explicit permission required перед `git checkout`.

### 3.5 Shifted-left recovery (Step 1)

Step 1 had false-positive grep recovery: initial `grep -A8 "training-social-panel"` returned `position: fixed` count 1, but context bleed в adjacent `.is-overlay` block (which legitimately has `position: fixed`). Tight `awk` between-braces verify confirmed default rule body = 0.

This is **Lesson #11 reflex shifted earlier в pipeline** — caught at functional commit, not waiting для Step 6 verify checklist.

### 3.6 `.is-overlay` modifier as defensive future-proof

Currently 0 consumers (HudTraining mount removed Step 4). Added для:
- Future overlay context features (если когда-нибудь нужно)
- Cheap insurance vs re-refactor цена позже

### 3.7 Mobile @820px scope refinement

Was global (`@media (max-width: 820px) .training-social-panel { ... }`). Now scoped к `.is-overlay` only. Reasoning: mobile rule made sense only для overlay context (bottom-anchored fixed). В Profile card context — `.profile-grid` mobile @720px rule handles layout.

### 3.8 Wrapper title decision

HudProfile mount = `<div class="profile-card social-tasks-card"><HudSocialTasks /></div>`. Drop `.profile-card-title` wrapper в favor of HudSocialTasks own `.tsp-header` (with count badge UX).

Reasoning: avoiding double-title (and `.tsp-title` ≈ `.profile-card-title` typography per Block 6). Count badge UX preserved.

### 3.9 Grid template extension semantics

Desktop: `minmax(0, 1fr) minmax(0, 1.2fr) auto` → `minmax(0, 1fr) minmax(0, 1.2fr) auto auto` (3→4 rows).
Mobile @720px: `auto auto auto auto` → `auto auto auto auto auto` (4→5 rows).

### 3.10 `.social-tasks-card` rule

```css
.app-v2 .social-tasks-card {
  grid-column: 1 / -1;
  max-height: 360px;
}
```

`grid-column: 1 / -1` mirrors Settings card (spans both cols). `max-height: 360px` cap для scroll containment — tasks list scrolls internally вместо stretching grid row.

### 3.11 Lesson #30 toolkit growth

5J-introduced refinement (within #30 toolkit, not new entry):

> "Path D invert default — when component visited multiple contexts, default к most-natural shape; opt-in modifier для special contexts. Drop fixed-position from base когда card-context = natural; add .is-overlay modifier для overlay reuse."

Cumulative lesson tally remains 30 (UNCHANGED).

## §4 Проверки

- Pre-flight Step 0 → 1 blocker caught (branch mismatch), 10/10 checks PASS после resolution
- Step 1 build pass — diff +14/-3
- Step 2 build pass — diff +8/0
- Step 3 build pass — diff +13/-2
- Step 4 build pass — diff -4
- Step 5 visual sign-off — user accepted
- Step 6 → 9/9 automated checks PASS, 0 false positives
- Step 7 build pass (+72 CLAUDE.md)

## §5 Расхождения — осознанные

1. **Drop wrapper `.profile-card-title`** — count badge UX preserved via HudSocialTasks own `.tsp-header`
2. **`.is-overlay` modifier defensive future-proof** — no current consumers, cheap insurance
3. **Mobile @820px scoped к `.is-overlay`** — was global, now overlay-only
4. **Path 2 chose over Path 1** — small wins first per user A→B order
5. **Branch switch after pre-flight Blocker A** — harness override per user explicit permission
6. **`.social-tasks-card` `max-height: 360px` cap** — для scroll containment

## §6 Уроки для 5K и далее

### Validated working patterns
- **#11 verify shape** — 11th cumulative recovery (Step 1 awk between-braces vs raw grep -A8)
- **#18 STOP at structural mismatch** — applied at pre-flight Blocker A (no blind git ops, user permission required)
- **#22** — N/A в 5J (все styles в shared profile.css или scoped HudSocialTasks block, no specificity conflicts)
- **#30 Pattern reuse — semantic vs mechanical** — TOOLKIT GROWTH (Path D invert default sub-pattern)

### 5J-introduced refinement (within #30 toolkit, not new entry)

> "Path D invert default — when component visited multiple contexts, default к most-natural shape; opt-in modifier для special contexts."

### 5J-introduced practice

> "Shifted-left recovery — false-positive grep awareness applied на functional commit (awk between-braces verify) instead of waiting для verify checklist Step 6. Lesson #11 reflex shifted earlier в pipeline."

### Anti-patterns avoided
- 0 blind git ops при Blocker A (user explicit permission required)
- 0 mechanical pattern application (Path D chose semantic alignment over Path C minimum-touch)
- 0 fabricated CSS rules (existing tokens reused)
- 0 abandoned scope (Step 1 unstyled intermediate state was deliberate, communicated in advance)

### Lessons added
None new. Refinement of #30 toolkit + practice extension.

**Cumulative lesson tally:** 30 (UNCHANGED).

## §7 Deferred list

- HudSocialTasks i18n — defer 5L per plan §R8
- `.is-overlay` modifier consumers — currently 0, may be used в future overlay contexts
- Daily Tasks backend — 5K (Path 1, biggest scope в Эпике 5)
- Settings card visual review — defer 5G/5H polish
- HudClan splitting (5D #11, 430 lines) — defer 5G/5H polish
- ClanScene mood polish (5D #4) — defer 5G/5H polish

## §8 Footer

**Hot-fix metric:** 0 — **6-streak** (5E + 5F + 5G + 5H + 5I + 5J — half of all sub-epics в Эпике 5 в clean run)

**Bundle impact:** ~22.53kb CSS gzip stable (per Step 7 build report)

**§4.2 progress:** 12/22 done (55%) — **UNCHANGED** (5J relocation, not new feature; Social Tasks #11 already counted в 5I)

**Transition к 5K:** see HANDOFF_5K. **5K = Path 1 Daily Tasks backend (recommended)** OR alternative single feature. Investigation findings preserved (backend infra ready / Prisma + Express + Docker / agentScheduler precedent для cron / Vuex unified task/* module).

---

**End of EPIC5_5J_FINAL_REPORT.**

## §1 Шаги и коммиты

| # | Commit | Step |
|---|--------|------|
| 0 | (pre-flight) | 1 blocker caught (Blocker A — branch mismatch harness vs ТЗ) |
| 0.5 | (user decision) | Branch switch к `claude/setup-5e-shop-mode-a-khIAi` per explicit permission |
| 1 | `42e7b7b` | HudSocialTasks drop fixed-position default + .is-overlay modifier |
| 2 | `92e83d0` | HudProfile add 5-я card |
| 3 | `8a361f5` | profile.css grid extend + .social-tasks-card rule |
| 4 | `1e368f3` | HudTraining drop HudSocialTasks embed |
| 5 | (skipped, verify-only) | Visual sign-off — user accepted |
| 6 | (skipped, verify-only) | 9/9 automated checks PASS |
| 7 | `037dec8` | CLAUDE.md Sub-Epic 5J section |
| 8 | `<this commit>` | EPIC5_5J_FINAL_REPORT.md |
| 9 | `<next>` | HANDOFF_EPIC5_5K_CHAT_HANDOFF.md |

## §2 Файлы

**Created:** 0
**Augmented:** 0
**Reused as-is:** 3+ (task/* Vuex / SubscribeModal augmentation / .profile-card pattern)
**Modified:** 4
- `src/components/hud/HudSocialTasks.vue` (+14/-3) — drop fixed-pos default + .is-overlay modifier + scope mobile @820px
- `src/components/hud/HudProfile.vue` (+8/0) — import + 5th card mount
- `src/components/hud/HudTraining.vue` (0/-4) — remove embed + import + comment
- `src/styles/v24/profile.css` (+13/-2) — grid extend + .social-tasks-card rule + 3 5J markers

**Removed:** 0
