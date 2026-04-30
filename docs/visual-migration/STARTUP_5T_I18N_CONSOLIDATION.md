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
