# Sub-Epic 5T — ι i18n Consolidation (Hybrid-2 Strategy)

**Mode A strict.** После каждого Phase → commit + push + status report → wait ok.

5T = 21st sub-epic в Эпике 5. Goal: 16-streak, dupe elimination via hybrid namespace approach.

**Pivot context:** Original 5T scope = γ AI Trainer (M-size feature). Phase 0.5 + Phase 1 audit revealed: (a) AI Trainer fully exists in v1 (greenfield assumption falsified — Recovery #72 candidate); (b) v2 fightState is mock per Epic 3A intent — fundamental shape mismatch with v1 backend endpoint expectations (Recovery #73 candidate). Path α (pragmatic adapter) would have shipped degraded AI output → negative product UX. Path γ (backend extension) would have triggered Lesson #33 PR-to-main chain → high streak risk. **Pivot to ι i18n consolidation = clean refactor, low streak risk, real value (45 cross-section dupes documented in 5S Q1.4).**

`STARTUP_5T_AI_TRAINER.md` (γ scope, commit `aac35a3`) **stays in repo as historical investigation record.** Pivot reasoning preserved transparently. γ AI Trainer carry-forward to Epic 6+ when v2 fight wires real PvP/PvE data.

---

## 🌳 Branch verify

```bash
git branch --show-current
# Expected: claude/setup-5e-shop-mode-a-khIAi (continue stack — 11th decision precedent maintained)

git log --oneline -3
# Expected top: aac35a3 (5T P0 STARTUP_5T_AI_TRAINER.md — γ scope, historical)
# Just below: 1a9497d (5S P3d post-closure backfill)
# Then: 85bd545 (5S P3c CLOSURE)

git status
# Expected: clean
```

**FAIL behaviour:** standard — STOP, status report, wait ok.

---

## 📍 Контекст проекта

Hexlash — PvP fighting game. Vue 3 + Vuex + Three.js + Vite frontend, Express + Prisma + PostgreSQL backend.

**Visual migration:** prototype `hexlash_v24.html` → v2 architecture (`/v2/*` routes).

**Эпик 5 — Missing features встраивание.** Progress: 20/22 done (91%) — 5S CLOSED.

**15-streak без hot-fixes** (5E-5S all clean) entering 5T. Goal: **16-streak**.

**Cumulative lessons: 35.** Candidates: #36 PROMOTE pending, #37/#38 pre-formal.

**Cumulative recoveries entering 5T: 71+.** **5T P0.5+P1+P0b adapted total: 74+ (3 candidates added — #72 greenfield falsified, #73 v2 mock fightState gap, #74 Yesterday symmetry false).** All adaptation-tier per Lesson #35.

**Carry-overs entering 5T: 5** (retirement animation, retirement badge, HudProfile monitor, i18n consolidation [now active scope], Lesson #36 validation).

---

## 🎯 5T ι Scope — Hybrid-2 Strategy

**Source:** 5S Q1.4 documented 45 cross-section dupes in en.js. 5T Phase 0b investigation refined understanding: count is **en-centric** — non-en locales already have fewer dupes due to existing locale gaps. Cross-locale strict 3x+ threshold yields **8 clean Track B keys + 3 Track A reuses = 11 dupe groups eliminated** (out of 14 high-pain 3x+ groups; 3 dropped per cross-locale strict cutoff).

**Strategic insight:** `t.modal.btn*` namespace already exists as de-facto common namespace (6 keys: btnCancel/btnConfirm/btnOk/btnSave/btnCreate/btnNext). **Two-track approach:**

- **Track A** — expand `t.modal.btn*` reuse to non-modal callers (3 dupe groups, zero locale-file touch — call-site rewrites only)
- **Track B** — introduce `t.common.*` for non-button vocabulary (8 dupe groups, locale-file additions + call-site rewrites)

### Track A — modal.btn* expansion (call-sites only)

| Source paths | Target | Cross-locale verified |
|---|---|---|
| `clan.lblCancel`, `xpAllocation.cancel` | `modal.btnCancel` | ✅ all 11 locales have target |
| `club.lblConfirmStep` | `modal.btnConfirm` | ✅ all 11 locales have target |
| `club.lblNext` | `modal.btnNext` | ✅ all 11 locales have target |

**Estimated callsite rewrites: ~10-15.** No locale-file changes.

### Track B — t.common.* introduction (locale + call-sites)

8 keys, 100% cross-locale clean (zero locale-fill required):

| Target | Source paths | Dupe count |
|---|---|---|
| `t.common.back` | profile.back / club.lblBack / friends.back / deck.lblBack | 4-way |
| `t.common.wins` | profile.stats.lblWins / clan.lblWins / pvp.wins / rating.wins | 4-way |
| `t.common.retry` | auth.telegram.retry / fight.lblAiRetry / rating.btnRetry | 3-way |
| `t.common.totalFights` | profile.stats.lblTotalFights / clan.lblTotalFights / rating.total | 3-way |
| `t.common.losses` | profile.stats.lblLosses / pvp.losses / rating.losses | 3-way |
| `t.common.name` | clan.lblClanName / clan.inputName / rating.participantName | 3-way |
| `t.common.members` | clan.lblMembersCount / clan.tabMembers / rating.members | 3-way |
| `t.common.moves` | club.lblMoves / training.lblMoves / deck.lblMoves | 3-way |

**Estimated callsite rewrites: ~30-40 across 8 keys.**

### Dropped from Track B (cross-locale strict cutoff)

- `t.common.today` — en: 3-way; ru-ar: 2-way (`club.lblToday` missing in 10 non-en locales). Below strict cross-locale threshold.
- `t.common.yesterday` — en: 2-way (Recovery #74 — Yesterday symmetry false). Never qualified.
- `t.common.login` — en+ru: 3-way; de-ar: 2-way (`profile.invite.btnLogin` missing in 9 locales). Below strict cross-locale threshold.
- `t.common.loading` — already top-level; migration = sideways shuffle.

**Reason:** Option α (strict 3x+ across all locales) selected over Option β (en-centric + English-fallback fill). Reasoning: scope discipline (ι = dupe elimination, not translation parity), streak preservation (no scope creep post-pivot), CLAUDE.md i18n convention (English-fallback = runtime, not codebase practice).

### Excluded from this pass (carry-forward)

- 31 × 2x-only dupes (lower pain, defer)
- gameData.branches.{speed,power,technique}.name (game-data namespace, semantic conflict with UI labels — Lesson #32 boundary)
- club:184 / clan:126 internal restructuring (out-of-scope, would be Strategy 3 hybrid)
- 3 cross-locale-fragmented keys (today/yesterday/login) — defer to future i18n parity sub-epic
- Pre-existing locale gaps (`profile.invite.btnLogin` missing 9 locales, `club.lblToday`/`club.lblYesterday` missing 10 locales) — pre-existing, separate concern

---

## 📋 Phase plan

| Phase | Что | Commits | Branch | Notes |
|---|---|---|---|---|
| ✅ P0 | STARTUP_5T_AI_TRAINER.md (γ scope, historical) | 1 done | continue stack | aac35a3 |
| ✅ P0.5 | γ investigation matrix → Recovery #72/#73 → pivot decision | 0 | — | Read-only |
| ✅ P0b | ι investigation matrix Q1.1-Q1.5 + Q1.6 locale Δ audit → Recovery #74 → Track B = 8 keys | 0 | — | Read-only |
| **P0c** | **THIS commit (split P0c1+P0c2) — STARTUP_5T_I18N_CONSOLIDATION.md** | **2** | continue stack | Preventive split (5th application) |
| P1 | Add `t.common.*` block to all 11 locales (8 keys × 11 = 88 entries). Old source paths PRESERVED for backward compat. | 1 | continue stack | Sequential safety per Option I |
| P2 | Track A migration — `modal.btn{Cancel,Confirm,Next}` call-site rewrites (~10-15 callsites) | 1 | continue stack | Frontend only, no locale touch |
| P3 | Track B migration — `t.common.*` call-site rewrites (~30-40 callsites for 8 keys). Possibly split per dupe-cluster if timeout. | 1-2 | continue stack | Per-key safe rollout if split needed |
| P4 | Build verify + visual smoke test — sections render strings correctly across 11 locales (spot-check 3-4 key locales: en, ru, ja, ar [RTL]) | 0-1 | continue stack | Commit only if fix needed |
| P5 | Old keys cleanup — remove migrated source paths from locale files (8 Track B keys × ~3 paths × 11 locales = ~264 deletions; 3 Track A source paths × 11 locales = ~33 deletions). Total ~297 deletions. | 1 | continue stack | Per Option I — last after migration complete |
| P6a + P6b | FINAL_REPORT preventive split (4-application precedent) | 2 | continue stack | Adaptation-infrastructure |
| P7a + P7b | HANDOFF_5U_CHAT_HANDOFF.md preventive split | 2 | continue stack | Same |
| P8 | CLAUDE.md update — 5T section, recoveries #72-74, pivot reasoning, sextuple-precedent investigation-refines-ТЗ, scope discipline note, hybrid-2 framework | 1 | continue stack | |

**Total estimated: 12-14 commits** (within M-size envelope; +1 from P0c split).

**P1+P5 ordering rationale (Option I — sequential safety):**
- P1 adds new `t.common.*` keys, old source paths remain available
- P2/P3 migrate callsites — system has both old and new keys live during migration
- P5 deletes old keys only after all callsites migrated and verified
- If any phase interrupted, system remains functional (no half-migrated breakage)

---

## ❓ Phase 1 prep — Pre-flight checklist

Before starting P1 functional work:

1. ✅ HEAD `aac35a3` confirmed (will be updated after P0c1+P0c2)
2. ✅ Branch clean
3. ✅ STARTUP file committed (this Phase 0c)
4. **Read CLAUDE.md `## i18n System` section** for locale file structure conventions
5. **Spot-check `src/locales/en.js` structure** — confirm top-level keys list (29 sections per Q1.4) — decide where to insert `common:` block (alphabetical? after `modal:`? user preference)
6. **Decide insertion point:** recommend after `modal:` block (semantic clustering — both are common namespaces). Confirm with design-Claude before P1.

---

## 🛠 Mandatory pre-flight reading

1. `CLAUDE.md` — full source of truth (3975 lines)
2. `docs/visual-migration/STARTUP_5T_AI_TRAINER.md` — γ historical scope (commit aac35a3)
3. `docs/visual-migration/HANDOFF_EPIC5_5T_CHAT_HANDOFF.md` — original 5T handoff (option matrix γ vs ι, Q-templates §4)
4. `docs/visual-migration/EPIC5_5S_FINAL_REPORT.md` — 5S closure (5 recoveries, 15-streak, i18n promotion in Q1.4)
5. `docs/visual-migration/EPIC5_5R_FINAL_REPORT.md` — 5R (8 recoveries, branch strategy formalization)
6. `docs/visual-migration/VISUAL_MIGRATION_PLAN.md` — overall plan

---

## 🧠 Critical lessons applied (5R-5S inheritance + 5T learnings)

- **#11 verify shape** — running tally **74+ recoveries** entering P1. Pre-edit grep before edits. Cross-locale audit precedent (Q1.6) — don't measure single-locale.
- **#18 STOP at structural mismatch** — locale file structure conventions matter. If non-en locales differ structurally from en (different nesting depth, missing sections), STOP and document.
- **#32 convention discovery reflex** — i18n locale file convention: CommonJS export (`module.exports`), nested object structure, English-fallback runtime convention NOT codebase fill convention.
- **#33 deploy-environment awareness** — ι is frontend-only refactor, no backend touch, no PR-to-main path. Continue stack throughout.
- **#35 reflex catch tiering** — adaptation-tier dominant in 5T (3 candidates all adaptation). Bug-bundle-tier may apply if missed callsite surfaces in P4 verify (extend in-Phase if same-class). Scope-boundary-tier triggers if non-i18n issue surfaces (Lesson #18 STOP).

### 5T-specific reflexes

- **En-centric measurement avoidance** — Q1.6 lesson. Always cross-locale audit для i18n work.
- **Sequential safety** (Option I P1+P5 ordering) — old keys preserved until migration verified.
- **Per-cluster split readiness** — P3 may need split per dupe-cluster if 30-40 callsite rewrites cause timeout. Adaptation-infrastructure, not recovery.

---

## 🎯 Hot-fix streak

**15-streak** entering P1 (5E-5S all clean + 5T P0/P0c record-keeping commits not functional). Goal: **16-streak** by 5T closure.

---

## 🚀 Workflow Step 0 (post-P0c commit)

After P0c2 commit + push + status:

1. Wait for design-Claude **ok**
2. Pre-flight P1 — read `## i18n System` section in CLAUDE.md
3. Inspect `src/locales/en.js` head — confirm top-level structure, locate insertion point for `common:` block
4. Report insertion-point recommendation (suggested: after `modal:` block) for design-Claude confirm
5. Execute P1 — single commit adding `common:` block to all 11 locales

---

## 📋 5T running totals

- **Commits:** 1 (P0 γ STARTUP, historical) + 2 P0c1+P0c2 = 3 after this phase
- **Recovery candidates:** 3 (#72 greenfield falsified, #73 v2 mock gap → drove pivot, #74 Yesterday symmetry false)
- **Streak:** 15 preserved
- **Pivot:** γ → ι (documented in this file + future FINAL_REPORT)
- **Sextuple-precedent investigation-refines-ТЗ:** 5 sub-epic precedent (5O/5Q/5R/5S/5T) + 3 intra-5T refinements
- **Preventive split applications:** 5 (5R P7 / 5S P0 / 5S P3a / 5S P3b / 5T P0c)

---

## 🚀 Действия после P0c2 commit

1. **WAIT for ok**
2. Pre-flight P1 reading + insertion point reconnaissance
3. P1 — add `common:` block to 11 locales (single commit)
4. WAIT for ok
5. P2 — Track A migrate (single commit)
6. WAIT for ok
7. P3 — Track B migrate (1-2 commits, possibly split)
8. WAIT for ok
9. P4 — verify (0-1 commits)
10. WAIT for ok
11. P5 — old keys cleanup (single commit)
12. WAIT for ok
13. P6a/P6b — FINAL split
14. WAIT for ok
15. P7a/P7b — HANDOFF_5U split
16. WAIT for ok
17. P8 — CLAUDE.md update (closes 5T)

**Mode A strict throughout. No phase-jumping. Wait ok between each.**

---

**Поехали.**

---

## ⚠️ Scope amendment (P0d) — Recovery #75 + Path D ultra-strict

**Triggered:** Phase 1 Step 1 reconnaissance revealed value-equivalence methodology gap in Q1.6 audit.

### Recovery #75 candidate

Q1.6 locale audit checked PRESENCE of keys across 11 locales but did not verify VALUE EQUIVALENCE across cross-section "dupe" claims. Cross-source value comparison in Phase 1 Step 1 revealed:

- **All 8 Track B keys have cross-locale value divergence**
- **2 of 3 Track A keys have cross-locale value divergence** (Confirm + Next)
- **Only Cancel** is truly identical across all 11 locales

**Pattern discovered:** majority of "duplicate values" are hardcoded English placeholders in non-EN locales (`club.lblBack: "Back"`, `club.lblConfirmStep: "Confirm"`, `clan.tabMembers: "Members"`, etc.) — localization debt artifacts, NOT genuine duplication.

**Adaptation-tier per Lesson #35.** Refines premise, doesn't block execution.

**Lesson #11 sub-pattern surfaced:** value-equivalence verification specialization. Future i18n investigations must run cross-locale value comparison alongside presence check. Documented in FINAL_REPORT methodology section.

### Path D ultra-strict — scope reduction

**Track A revised:**

| Source paths | Target | Status |
|---|---|---|
| `clan.lblCancel`, `xpAllocation.cancel` | `modal.btnCancel` | ✅ all 11 locales value-identical |
| ~~`club.lblConfirmStep` → `modal.btnConfirm`~~ | DROPPED | 10 locales divergent |
| ~~`club.lblNext` → `modal.btnNext`~~ | DROPPED | 9 locales divergent |

**Track B revised: ELIMINATED ENTIRELY.** All 8 candidates have cross-locale value divergence.

### Scope after amendment

**1 dupe group eliminated cleanly** (down from 11 planned). 5T ι converted from M → XS sub-epic.

**Carry-forward for future i18n parity sub-epic:**
- 8+ broken English placeholders in non-EN locales (`club.*`, `pvp.*`, `clan.tabMembers`, `clan.lblTotalFights`, `fight.lblAiRetry`)
- Genuine context-divergent translations (`name`, `retry`, `wins`, `losses`)
- 31 × 2x-only dupes (originally excluded)
- 3 cross-locale-fragmented keys (today/yesterday/login)
- Pre-existing locale gaps (`profile.invite.btnLogin` × 9 locales, `club.lblToday`/`club.lblYesterday` × 10 locales)

### Rationale for Path D ultra-strict (not B/C)

- **Path A (drop ι entirely):** rejected — 2nd pivot in same sub-epic = pathological scope thrashing
- **Path B (Cancel-only minimal):** functionally converges with D
- **Path C (consolidate + fix English placeholders):** rejected — scope explosion, translation quality concerns (design-Claude can't QA 11-language translations), wrong sub-epic for localization debt fix
- **Path D ultra-strict:** preserves streak, ships clean migration, honest scope, real methodology contribution via Recovery #75

### Refined Phase plan post-amendment

| Phase | Status | Commits |
|---|---|---|
| P0 / P0c1 / P0c2 | ✅ done | 3 |
| **P0d** | **THIS amendment** | 1 |
| P1 | Cancel migration | 1 |
| P2 | Old keys cleanup (`clan.lblCancel`, `xpAllocation.cancel` × 11 locales) | 1 |
| P3 | Build verify | 0-1 |
| P4a/P4b | FINAL_REPORT split | 2 |
| P5a/P5b | HANDOFF_5U split | 2 |
| P6 | CLAUDE.md update | 1 |

**Total estimated: 8-10 commits.**

### 5T running totals after P0d

- Commits: 4 (P0 γ + P0c1 + P0c2 + P0d)
- Recovery candidates: 4 (#72/#73/#74/#75) — all adaptation-tier
- Streak: 15 preserved
- Pivot count: 1 major (γ → ι) + 1 scope amendment (ι full → ι ultra-strict)
- Methodology contributions: en-centric measurement avoidance (5T) + value-equivalence verification (Recovery #75)

### Self-correction note

P0c1 line ~22 stated locale files use CommonJS `module.exports`. **Correction:** they use ESM `export default`. Minor factual error, no functional impact (P1 will write correct ESM-compatible code regardless). Documented in FINAL_REPORT errata.

---

**P0d amendment complete. Awaiting ok → P1 (Cancel migration).**
