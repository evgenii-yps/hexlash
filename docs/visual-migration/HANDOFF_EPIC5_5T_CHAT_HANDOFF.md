# HANDOFF — Sub-Epic 5S closed → 5T start

**Date:** 2026-04-30
**From:** Sub-Epic 5S Z Cleanup batch closure
**To:** Sub-Epic 5T start (option pending user decision)
**Branch:** `claude/setup-5e-shop-mode-a-khIAi` (continue stack — 10th decision precedent maintained from 5J)
**HEAD:** `85bd545` (P3c — 5S CLOSURE)

---

## 1. Where we are

**Sub-Epic 5S CLOSED.** Z Cleanup batch executed with optimal streak-preserving outcome. Investigation-driven scope reduction transformed S-size sub-epic into XS-size functional work (5 candidate items → 1 actual work item via P0.5 matrix).

**Progress: 20/22 (91%).** Two sub-epics remaining to Epic 5 closure.

**Hot-fix streak: 15 achieved** (5E-5S clean — first explicit streak-preservation-as-primary-goal sub-epic, validated approach).

**Cumulative metrics:**

- Lessons promoted: 35 (no promotion in 5S)
- Lesson candidates: 3 active (unchanged from 5R — no advancement, no new candidates)
  - #36 — Incomplete rollback drift detection (PROMOTE pending 2nd test)
  - #37 — Sandbox capability empirical verification (pre-formal)
  - #38 — Multi-layer deploy environment awareness extension (pre-formal, sub-pattern of #33)
- Cumulative recoveries: 71+ (5 catches in 5S session, see EPIC5_5S_FINAL_[REPORT.md](http://REPORT.md) §7)

---

## 2. What 5S closed

**Item #1 — RetirementPanel.vue orphan removal** (P1 commit `058ebeb`):

- File `src/components/club/RetirementPanel.vue` (160 lines) removed via `git rm`
- 2 doc-comments in `src/components/hud/HudRetirement.vue` updated to historical refs ("replaces legacy RetirementPanel removed in 5S")
- Build delta: gzip −4.11 kB confirmed orphan was contributing redundant patterns to bundle pre-tree-shake (end-to-end orphan validation, not just static orphan)

**Item #7 — Branch strategy formalization** (already closed in 5R Phase 9):

- Confirmed during 5S as no-action (already in [CLAUDE.md](http://CLAUDE.md) `## Branch (Git)` section)
- Documented in 5S as ledger-clear, not work commit

**Investigation-refines-ТЗ pattern — quadruple precedent:**

- 5O Q2 (5→7 scope adjustment)
- 5Q (4 ТЗ assumptions refined)
- 5R (4+ pivots during root cause analysis)
- 5S (5 scope items → 1 actual work item via P0.5 matrix)
- Status: pattern firmly established. Pre-investigation ТЗ continues to be treated as draft.

**Preventive split framework — fully stabilized (3rd application):**

- 5R Phase 7 FINAL_REPORT (1st preventive split, after 1 timeout)
- 5S P0 STARTUP file (2nd preventive split, after 1 timeout)
- 5S P3a FINAL_REPORT (3rd preventive split, after 1 timeout)
- 5S P3b HANDOFF_5T (4th application — preventive from start, no timeout needed to trigger)
- Long-form handoff/FINAL deliverables now default to split-from-start strategy

---

## 3. 5T option matrix

| Option | Sub-epic candidate | Size | Streak risk | Notes |
|---|---|---|---|---|
| **γ** | AI Trainer | M | Medium | Feature work, deferred from 5R + 5S. 15-streak resilient enough for M-size feature now. Real product value. |
| **ι** | i18n consolidation | M | Low-medium | Promoted from "vague note" to formal task in 5S Q1.4. 45 cross-section duplicates documented. Clean refactor pattern. |
| ε | FightClub feature | M-L | High | Anti-rec from 5Q (scope ambiguity AI Lv1/2/3 tiering) |
| η | Onboarding | M | High | Anti-rec (design ambiguity) |
| θ | MoveTree | L | High | Anti-rec (size, less streak-friendly) |

**Recommended: γ AI Trainer (5T) → ι i18n consolidation (5U) → Epic 5 closure.**

Decision framework:

- **5T = γ:** feature work appropriate now that 15-streak achieved. Real product value (AI Trainer post-fight analysis, deferred two sub-epics). Anthropic SDK already in backend deps (per [CLAUDE.md](http://CLAUDE.md) line 13).
- **5U = ι:** i18n consolidation as final cleanup before Epic 5 close. Sized M but mostly mechanical (locale section restructure + ~100 callsite renames × 11 locales). Streak-friendly via per-locale phase ordering.
- **Anti-recs:** ε/η/θ remain anti-rec — defer to Epic 6 cutover phase or Epic 7+ feature work post-migration

**Alternative ordering (5T = ι, 5U = γ)** valid if user prefers ending Epic 5 on feature work rather than refactor. Refactor-first ordering recommended because i18n touch surface lower (no architectural decisions), feature work rewards the streak completion.

---

## 4. Pre-flight Q-templates per option

### Option γ (AI Trainer) Q-templates

**Q1.** Backend `agentAITrainer` route/service location:

```bash
grep -rn "trainer\|aiTrainer\|train.*agent" backend/src/routes/ backend/src/services/
ls backend/src/routes/ai*
ls backend/src/services/ | grep -iE "ai|trainer|claude"
```

**Q2.** Anthropic SDK usage in backend (existing patterns):

```bash
grep -rn "anthropic\|@anthropic-ai" backend/src/ backend/package.json
cat backend/package.json | grep -A2 anthropic
```

**Q3.** Frontend AI Trainer modal/view existing scaffolding:

```bash
grep -rn "AITrainer\|aiTrainer\|ai-trainer" src/views/ src/components/
ls src/components/ | grep -iE "ai|trainer"
```

**Q4.** Result-overlay integration point (where AI Trainer surfaces):

```bash
grep -rn "result.*overlay\|ResultOverlay\|HudResult" src/views/ src/components/
ls src/components/hud/ | grep -i result
```

**Q5.** API contract from prototype:

- Look in `hexlash_v24.html` for AI Trainer dialogue UI markers (`ai-trainer`, `trainer-`, etc.)
- Match against current `agentAITrainer` (if exists) for gap analysis
- Document expected request/response shape

### Option ι (i18n consolidation) Q-templates

**Q1.** Confirm 45 dupes still current (drift check from 5S Q1.4):

```bash
node -e "
const data = require('./src/locales/en.js').default || require('./src/locales/en.js');
const keys = [];
function walk(o, prefix='') {
  if (typeof o !== 'object' || o === null) return;
  Object.entries(o).forEach(([k,v]) => {
    if (typeof v === 'object' && v !== null) walk(v, prefix+k+'.');
    else if (typeof v === 'string') keys.push({path: prefix+k, value: v});
  });
}
walk(data);
const dupes = {};
keys.forEach(k => { if(!dupes[k.value]) dupes[k.value] = []; dupes[k.value].push(k.path); });
const significant = Object.entries(dupes).filter(([_,v]) => v.length > 1 && v[0].split('.')[0] !== v[1].split('.')[0]);
console.log('Cross-section dupes:', significant.length);
"
```

**Q2.** Common namespace candidates (frequency analysis):

```bash
# Top dupe clusters by occurrence count
grep -rEh "t\.(modal|common|btn|action)\." src/ --include="*.vue" 2>/dev/null | head -20
```

**Q3.** i18n key call-site scope:

```bash
grep -rEn "\bt\.[a-z]+\.[a-z]+" src/ --include="*.vue" --include="*.js" | wc -l
# Total i18n call-site count для refactor surface estimation
```

**Q4.** Locale file structure consistency check:

```bash
for locale in src/locales/{en,ru,de,es,fr,hi,ja,ko,pt,zh,ar}.js; do
  echo "=== $locale ==="
  wc -l "$locale"
done
```

**Q5.** Migration strategy candidates:

- Per-section batch (one section at a time, 11 locales each commit) — lowest risk, ~10 commits
- Common-keys-first (introduce `t.common.*` namespace, migrate dupes, then refactor remaining) — fewer commits, higher per-commit surface
- Hybrid (common namespace + 2-3 high-traffic sections) — middle ground

---

## 5. Carry-overs forward to 5T (5 items)

Inherited from 5L-5R + new from 5S:

| # | Item | Source | Status |
|---|---|---|---|
| 1 | Animation для retirement | 5Q drop | CARRY-OVER (frontend animation pass, deferred) |
| 2 | Achievement badge для retirement | 5Q drop | CARRY-OVER (requires backend extension — Achievement entity DB schema work) |
| 3 | HudProfile card-creep monitor | 5L+ → 5S Q1.3 | MONITOR-FORWARD (6/7 threshold; trigger refactor if 7th card added in 5T-5V) |
| 4 | i18n cross-section reuse — formal M-size task | 5O+ → 5S Q1.4 PROMOTED | 45 dupes documented; sized M; candidate for 5T or 5U as Option ι |
| 5 | Lesson #36 validation track | 5R | CARRY-OVER (await 2nd occurrence of incomplete rollback drift for promotion + mitigation prototyping) |

**Net 5S → 5T:** 7 entering 5S → 5 leaving (RetirementPanel orphan closed, branch strategy confirmed already-closed). Goal was 3-4; slight miss acceptable given investigation findings — i18n promoted from "vague note" to "sized formal task" represents real progress even if count doesn't drop.

**Closed in 5S:**

- ~~RetirementPanel.vue orphan cleanup~~ ✅ (P1)
- ~~Branch strategy formalization~~ ✅ (already closed in 5R Phase 9 — confirmed in 5S as no-action)

---

## 6. Active disciplines reminder

**Mode A strict** — 1 commit per Phase, push, status report, wait ok.

**Branch:** continue stack `claude/setup-5e-shop-mode-a-khIAi` for visual migration work (10th continue stack decision after 5S — extends to 11th if 5T continues). Backend fixes (if Option γ surfaces them) — separate branch from main + PR per Recovery #63 lesson formalized in [CLAUDE.md](http://CLAUDE.md) `## Branch (Git)`.

**Sentinel split — fully stabilized framework:**

- Single-write default per 5P clarification for short deliverables (code commits, single-Phase work)
- Long-form docs (handoff, FINAL_REPORT) default to **preventive split from start** — 4-application precedent (5R P7 / 5S P0 / 5S P3a / 5S P3b)
- Reactive variant (5Q 5-timeout threshold) preserved as fallback for unexpected length surprises
- Both valid; preventive-from-start now standard for handoff-class deliverables

**Convention discovery reflex (Lesson #32):** mirror existing patterns, не invent. Backend conventions ≠ frontend conventions. AI Trainer (Option γ) work needs particular care — Anthropic SDK pattern in backend, frontend modal pattern via existing HUD-v2 conventions.

**Pre-edit verification reflex (Lesson #11):** running tally 71+ recoveries entering 5T. Reflex valuable across both Claude Code and design-Claude sides. Validation-not-just-catch principle (5S P1 pre-edit re-verify clean — assumption held — was equally valuable as a catch).

**STOP triggers (Lesson #18):** any structural mismatch — escalate, не auto-fix. Especially for Option γ feature work — backend route additions, model schema additions, AI prompt template — convention discovery first, code action after.

**Investigation refines ТЗ:** quadruple precedent now (5O / 5Q / 5R / 5S). Pre-investigation ТЗ ALWAYS treated as draft. Investigation matrix → ТЗ refinement → execution.

**Reflex catch tiering (Lesson #35):**

- Adaptation-tier (TZ assumption mismatch) — fix within Phase, no Lesson #18 trigger, no hot-fix
- Bug-bundle-tier (same-class additional callsites) — fix within Phase as expansion
- Scope-boundary-tier (different class, different model) — STOP, document carry-over, Lesson #18 IS triggered

---

## 7. Files for 5T start

When user starts 5T, design-Claude должен read:

1. **[CLAUDE.md](http://CLAUDE.md)** — full source of truth (after Phase 9 update of 5S)
2. **`docs/visual-migration/EPIC5_5S_FINAL_[REPORT.md](http://REPORT.md)`** — closure detail (P3a1+P3a2 split, 5 recoveries, 15-streak achievement)
3. **`docs/visual-migration/HANDOFF_EPIC5_5T_CHAT_[HANDOFF.md](http://HANDOFF.md)`** — this file
4. **`docs/visual-migration/EPIC5_5R_FINAL_[REPORT.md](http://REPORT.md)`** — predecessor closure (recovery #59-66 framing, 8-recovery session pattern, branch strategy formalization origin)
5. **`docs/visual-migration/VISUAL_MIGRATION_[PLAN.md](http://PLAN.md)`** — overall plan

---

## 8. Recommended workflow для start of 5T

1. User attaches this HANDOFF + 5S FINAL_REPORT + [CLAUDE.md](http://CLAUDE.md) to fresh design-Claude chat
2. Design-Claude reads file list per §7
3. Design-Claude presents 5T option matrix (γ vs ι) с user-side decision request
4. User picks γ or ι (or one of anti-recs if pressure forces)
5. Design-Claude prepares pre-flight Q-templates per chosen option (templates in §4)
6. Claude Code runs investigation (read-only)
7. Investigation matrix → ТЗ refinement → Phase-by-Phase execution

---

## 9. Closing

5S closes Z Cleanup batch with optimal streak-preserving outcome. 20/22 milestone reached. **Two sub-epics remaining for Epic 5 closure** (5T + 5U). 15-streak preserved.

After Epic 5 closure (22/22) → **Epic 6 cutover** (final): `/v2/*` becomes default, continue stack merges to main, legacy `/src` components removed, parking list (52 items in `/docs/[phase1-parking-list.md](http://phase1-parking-list.md)`) addressed.

Trajectory:

- After 5T: 21/22 (95%)
- After 5U: 22/22 (100%) — Epic 5 CLOSED ✅
- Epic 6: cutover + legacy delete + parking list resolution

Ready for 5T start when user is.
