# Sub-Epic 5R — Q1 Backend `/v1/agent/list` 500 dedicated debug — FINAL REPORT

## Section 1 — Header

- **Date:** 2026-04-30
- **Branch (continue stack):** `claude/setup-5e-shop-mode-a-khIAi`
- **HEAD before:** `a829c84` (5Q P6 6B closure)
- **HEAD after Phase 1:** `3f6e8dd` (Phase 1 retroactive migration on continue stack)
- **Predecessor:** Sub-Epic 5Q ζ Retirement
- **Type:** Q1 backend dedicated debug (Option X / Strategy C → pivoted to Strategy D + user-side execution)
- **Branches involved (atypical):** continue stack `claude/setup-5e-shop-mode-a-khIAi` (visual migration work + Phase 1 fix copy) + `fix/restore-agent-iscaptain-column` (cherry-picked from continue stack to main via PR #353) + `main` (production deploy target via empty trigger commit `da01369`)

## Section 2 — Scope summary

**Shipped:**

1. Forward migration `20260429000000_restore_is_captain_to_agent` — 12 lines, idempotent across environments via `ADD COLUMN IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` guards
2. PR #353 to main: cherry-picked Phase 1 fix from continue stack (commit `1257fe6` on branch `fix/restore-agent-iscaptain-column`)
3. Empty trigger commit `da01369` on main — forced Railway auto-deploy to pick up latest main HEAD after queue incident left previous deployment stuck on PR #352

**Conditional dropped:**

- P5 regression test — skipped. Root cause was data-level (orphan migration applied without code companion), not code-level. Regression test would test the wrong abstraction layer. Drift detection logic (Lesson #36 candidate) is the appropriate mitigation, not unit test.
- P6 bug-bundle cleanup — skipped. Single root cause (one missing column), no adjacent same-class bugs.

**Frontend cleanup:** none — Q1 was backend-only.

## Section 3 — Phase-by-phase log

**P1 — Strategy C local repro setup (planned) → pivoted to user-side prod query (Strategy D-like):**

- Investigation matrix Q1.1-Q1.5 surfaced no docker-compose in repo (greenfield invention required) and sandbox capability unclear
- Sandbox empirically confirmed no TCP egress (Recovery #61) — Strategy C unworkable from sandbox
- Pivoted to user-side execution: Railway dashboard SQL console for prod `_prisma_migrations` queries

**P2 — Reproduction:**

- Confirmed via prod Postgres `_prisma_migrations` dump — orphan migration `20260416000000_remove_is_captain_from_agent` applied 2026-04-16 13:59:22, no code companion in repo
- Visual reproduction via hexlash.com — agent creation returned 500 "Internal server error" (frontend graceful fallback hid `/agent/list` 500 as "No Captain Set" empty state)

**P3 — Root cause analysis:**

- Initial hypothesis H1 (orphan migration) → confirmed via prod dump
- Recovery #64: Claude Code surfaced original commit `4062ed8` (Apr 16 captain removal, deployed) + PR #350 (rollback to 2026-04-14 snapshot, code-only — DB migration not reverted)
- Definitive root cause: **incomplete rollback drift** — code returned to pre-removal state, prod DB stayed in dropped state. Schema described captain alive, DB described captain dropped. Frontend graceful fallback (`userData?.captain || null`) masked bug as "No Captain Set" empty state since 2026-04-16.

**P4 — Fix implementation:**

- Forward migration with idempotent guards (Phase 1 commit `3f6e8dd` on continue stack)
- Cherry-pick to new branch `fix/restore-agent-iscaptain-column` from main HEAD (commit `1257fe6`)
- PR #353 created → merged into main as `8ae36f0`
- Railway queue incident: PR #353 deployment marked REMOVED, ACTIVE stayed on PR #352 (Recovery #65)
- Manual "Redeploy on active" rebuilt same old commit (Recovery #66) — Railway Redeploy preserves commit hash, does not fetch latest
- Empty trigger commit `da01369` pushed to main → Railway webhook → fresh deployment `fb8ed855` → Build phase loaded 21 migrations → `prisma migrate deploy` applied `20260429000000_restore_is_captain_to_agent` → `ADD COLUMN` executed → backend operational

**Visual verify:** agent created successfully in The Pit. Backend `/v1/agent/list` returns 200, AgentScheduler tick errors stopped (previously spammed every 30s with `column Agent.isCaptain does not exist`).

## Section 4 — Lessons applied

**#11 verify shape (running tally critical):** Approximately 8 reflex catches during 5R session. Each caught a divergence between asserted and verified state. Cumulative recoveries entering 5R: 58. Estimated entering 5S: 66 (+8 catches in this session, full log in §7). Reflex remained valuable across both Claude Code and design-Claude sides.

**#18 STOP at structural mismatch:** Triggered multiple times by Claude Code:

- Pre-flight branch divergence detection (continue stack vs harness slug) — switched only after zero-divergence verification
- Schema drift verification before Option A vs C decision — refused to proceed with destructive Option A on unverified premise
- Sandbox TCP egress failure — pivoted Strategy C → user-side execution rather than fabricating workaround
- Phase 1 destructive proposal STOP — design-Claude initially proposed full code deletion, Claude Code surfaced contradiction with 5G/5L/5M working captain feature → forced Option C (restore) decision

Each STOP saved a destructive action on incomplete information.

**#33 deploy-environment awareness (KEY for 5R):** Validated again across multiple environment layers. Lesson now formally extends to multi-layer awareness:

- Sandbox (Claude Code execution context) — no TCP egress, no Docker
- Developer machine — has Docker, has psql, has TCP egress
- Railway internal network — `*.railway.internal` resolvable only from inside same project
- Railway proxy (TCP) — `*.proxy.rlwy.net:<port>` reachable externally with credentials
- Production runtime — different from test environment (test env DB never had orphan migration)

Each layer has distinct network/auth/capability profile. Investigation strategy must match the available layer.

**#32 convention discovery reflex:** Backend deploy convention is via main branch through GitHub auto-deploy webhook (testhexlash service). Visual migration continue stack `claude/setup-5e-shop-mode-a-khIAi` is frontend work, never reaches backend deploy. Phase 1 commit on continue stack was correct for visual-migration epic record-keeping but did not deliver fix to production. Cherry-pick PR to main was the structurally correct path for backend code reaching prod.

**#35 reflex catch tiering:** Per-Phase tier predictions held: P1 setup-tier (greenfield invention), P2 reproduction-tier (user-side query), P3 root-cause-tier (data-level not code-level — surprise), P4 fix-tier (single migration file). P3 surprise (incomplete rollback vs simple orphan migration) consistent with investigation-refines-ТЗ pattern (5O / 5Q / 5R now triple precedent).

## Section 5 — Lessons new (candidates)

**Lesson #36 candidate (PROMOTE pending 2nd test) — "Incomplete rollback drift detection":**

- **Definition:** Code rollback without corresponding DB rollback creates schema drift guaranteed. Code describes state X (post-rollback), DB stays in state Y (post-applied-migration that triggered rollback). The drift is invisible if frontend has graceful fallback for the missing data.
- **Symptom in 5R:** Frontend `userData?.captain || null` rendered "No Captain Set" empty state instead of error UI. Bug invisible to end users for 13 days (2026-04-16 → 2026-04-29). Backend errors logged silently, no user-facing alert.
- **Mitigation candidates:**
  - CI healthcheck running `prisma migrate status` on prod after each deploy, alert on drift
  - Rollback procedure runbook explicitly requiring DB-side revert step (or explicit acknowledgement that DB stays forward, with documented schema-vs-DB diff)
  - Periodic prod `_prisma_migrations` dump comparison with repo `migrations/` directory
- **Validation history:** 5R single occurrence. Pre-formal until 2nd similar pattern surfaces.

**Lesson #37 candidate (pre-formal) — "Sandbox capability empirical verification":**

- **Definition:** Pre-investigation ТЗ assumed Strategy C (docker-compose local repro from sandbox) executable without verification. Empirical test (TCP egress to Railway proxy) failed across the board including generic public hosts. Strategy C/D both required user-side execution — sandbox was not a viable execution context for prod-touching diagnostics.
- **Mitigation:** Pre-flight phase should include explicit capability checks for the planned strategy:
  - TCP egress test (`nc -zw5 <generic-host> 443`)
  - Docker availability test (`docker --version` AND `docker run hello-world`)
  - Required tool presence (psql, prisma CLI, etc.)
- **Cost:** ~5 seconds at start of investigation, prevents extended pivot mid-Phase
- **Pre-formal until 2nd test.**

**Lesson #38 candidate (pre-formal) — "Multi-layer deploy environment awareness extension":**

- Sub-pattern of #33. Specifically: each runtime layer (sandbox / dev machine / Railway internal / Railway proxy / prod) has distinct network/auth/capability profile.
- Articulation: when Strategy mentions "local repro" or "production diagnostic", be explicit which **layer** is doing the work. "Local" can mean sandbox-local OR developer-machine-local with very different capabilities.
- Pre-formal until 2nd articulation.

**Atypical sentinel split framework — minor variation:**

- 5Q established framework: split adopted after 5 stream idle timeouts (reactive).
- 5R variation: split adopted after 1 timeout (preventive) for Phase 7 FINAL_REPORT.
- Document as minor variation, not new framework. Reactive vs preventive both valid depending on deliverable size and timeout count. Default remains single-write per 5P clarification, escalate to split on 2-3 timeout confirmation OR proactively on long-form deliverable post-first-timeout.

## Section 6 — Cumulative metrics

| Metric | Before 5R | After 5R |
|---|---|---|
| Sub-epics | 18/22 (82%) | **19/22 (86%)** ✓ |
| Hot-fix streak | 13 | **14** (preserved — see closing note) |
| Lessons promoted | 35 | 35 (no promotion — #36 stays candidate at single occurrence) |
| Lesson candidates | 0 active | 3 active (#36 pending 2nd test, #37/#38 pre-formal) |
| Recoveries cumulative | 58 | **66+** (+8 catches in 5R session, see §7) |
| Carry-overs | 6 | 5 (Q1 closed) |

**Q1 carry-over closed.** 4-defer history (5N/5O/5P/5Q) terminated. Anti-defer commitment honored — closure was structural (root cause identified + fix shipped + visual verified), not silent further-defer.

## Section 7 — Recovery log (5R session detail)

8 mid-flight catches during 5R session. Each represents a divergence between asserted state and verified state, caught before downstream destructive action.

**Recovery #59 — Step 1 migration enumeration gap (Claude Code self-catch):**

- During Q1.4 schema drift verification, initial `ls -lat | head -10` showed "23 directories" but only listed 6 by mtime. Claude Code flagged the gap as "left unverified".
- Resolution: full enumeration revealed 21 entries (20 migrations + lock file + parent dirs), all accounted for. No drift in repo.
- Significance: structural-mismatch reflex caught own incomplete check before extending claims.

**Recovery #60 — Design-Claude hallucinated prod migrations dump (Claude Code STOP):**

- Design-Claude asserted "Claude Code already sent _prisma_migrations dump" — Claude Code searched conversation, no such dump existed (sandbox couldn't reach prod, dump was actually from user-side Railway query that arrived in different message).
- Resolution: Claude Code Lesson #18 STOP refused to proceed on unverified premise. Explicit ask for actual dump from user. Dump arrived. Hypothesis re-evaluated.
- Significance: cross-side verification reflex caught design-Claude inference error before destructive Phase 1 commit.

**Recovery #61 — Sandbox TCP egress empirical detection:**

- Strategy C (docker-compose local repro) and Strategy D (prod DATABASE_URL access) both presumed sandbox can reach external networks. Empirical test: `nc -zw5 shinkansen.proxy.rlwy.net 34758` timeout, `nc -zw5 google.com 443` also timeout. Sandbox firewall blocks all outbound TCP.
- Resolution: pivoted to user-side execution via Railway dashboard SQL console. Strategy unchanged in spirit (read-only prod query), execution layer changed (sandbox → user-side).
- Significance: deploy-environment awareness applied at sandbox layer, not just dev/prod layer.

**Recovery #62 — Option C vs A design surface (Claude Code surfaced contradiction):**

- Design-Claude proposed Option A (delete isCaptain field, code-side cleanup) when prod DB had column dropped.
- Claude Code surfaced contradiction: 5G/5L/5M sub-epics each have CLAUDE.md notes about working captain feature (visual verify passed). If column truly gone, those features would all 500. Claude Code presented Option C alternative (forward migration to restore column, no code changes).
- Resolution: User decision Option C. Smaller delta, no feature regression, aligned prod with documented intent.
- Significance: design-Claude initial proposal was destructive product rollback dressed as bug fix. Claude Code's reading of full epic history caught the misframing.

**Recovery #63 — Branch strategy assumption error (design-Claude):**

- Design-Claude assumed Phase 1 commit on continue stack `claude/setup-5e-shop-mode-a-khIAi` would reach production. Backend deploys via main branch (testhexlash service auto-deploy from GitHub webhook). Continue stack is frontend visual migration epic, never merges to main until Epic 6.
- Resolution: cherry-pick Phase 1 commit to new branch `fix/restore-agent-iscaptain-column` from main HEAD, PR #353 to main, merge.
- Significance: backend fixes require separate branch path from visual migration work. Future backend fixes during visual migration epic should default to PR-to-main pattern, not continue stack accumulation.

**Recovery #64 — Incomplete rollback discovery (Claude Code surfaced):**

- During Phase 2 cherry-pick pre-flight, Claude Code investigated main history around isCaptain. Found commit `4062ed8` (Apr 16 captain removal, deployed to prod) + PR #350 (rollback to 2026-04-14 snapshot, code-only).
- This explained why prod DB had migration applied but repo had no migration file: rollback reverted code-side without DB-side revert.
- Significance: definitive root cause framing changed from "orphan migration of unknown origin" to "incomplete rollback drift". Lesson #36 candidate emerged from this catch.

**Recovery #65 — Railway queue incident detection:**

- After PR #353 merged, Railway showed PR #353 deployment as REMOVED, ACTIVE stayed on PR #352 (cors-vercel-regex). Railway dashboard banner indicated "elevated numbers of queued deploys" incident.
- Initial "Redeploy on active" rebuild reused PR #352 commit (Railway Redeploy preserves commit hash).
- Resolution: empty trigger commit `da01369` pushed to main → fresh Railway webhook → new deployment with current main HEAD `da01369` (containing migration file).
- Significance: Railway Redeploy semantic ≠ "deploy latest" — it's "re-execute same commit". Distinction matters during incidents or when chain of deploys went wrong.

**Recovery #66 — Build cache stale on first redeploy:**

- First redeploy attempt (manual on active deployment) rebuilt PR #352 commit, build artifact contained 20 migrations (no `20260429`). Deploy log: "20 migrations found / No pending migrations to apply" while errors continued.
- Resolution: documented as part of Recovery #65. Empty commit on main was the actual fix.
- Significance: validation of build artifact contents (migration count in deploy log) is a useful smoke test before debugging higher-level symptoms.

## Section 8 — Closing note + acceptance checklist

**Acceptance:**

- [x] Q1 closed: 500 → 200 on `/v1/agent/list` (visual verified — agent created in The Pit, AgentScheduler errors stopped)
- [x] Agent creation works (visual verified — agent `dfsf` created, IDLE status, REPORT widget functional)
- [x] Phase 1 functional commit landed on continue stack (`3f6e8dd`) AND cherry-picked to main via PR #353 (`8ae36f0`)
- [x] Empty trigger commit pushed to main (`da01369`) for Railway redeploy
- [x] Production deployment `fb8ed855` Active, migration `20260429000000_restore_is_captain_to_agent` applied
- [x] Phase 7 FINAL_REPORT (this file, atypical split 7A/7B/7C)
- [ ] Phase 8 HANDOFF_5S (next)
- [ ] Phase 9 CLAUDE.md update (next)

**Hot-fix streak decision:**

5R Phase 1 was a single clean commit (no rebase, no follow-up fix). Phase 2 deployment phase was user-side action per Strategy D framework — not a hot-fix in the established sense (which counts unplanned code-side patches after a Phase status report). Empty trigger commit `da01369` was infrastructure trigger, not code fix.

**14-streak preserved.** Q1 anti-defer commitment honored: 4-defer history (5N/5O/5P/5Q) terminated structurally with visual verification, not deferred further.

**Atypical split usage (this report):** Preventive split applied after first stream idle timeout on Phase 7 monolithic attempt. Three commits (7A/7B/7C) for FINAL_REPORT. Not counted as hot-fix per 5Q precedent (infrastructure-driven recovery, not size violation).

**Carry-overs forward to 5S:**

1. Animation для retirement (5Q drop)
2. Achievement badge для retirement (5Q drop, requires backend extension)
3. Legacy RetirementPanel.vue orphan cleanup
4. HudProfile card-creep observation
5. i18n cross-section reuse note
6. **NEW from 5R:** Lesson #36 validation — incomplete rollback drift detection (await 2nd occurrence for promotion)
7. **NEW from 5R:** Branch strategy doc — backend fixes go via PR-to-main, not continue stack accumulation (formalize for future visual migration sub-epics)

**Recommended next sub-epic (5S):**

Pull from anti-rec list per HANDOFF_5R framework:

- (Y) γ AI Trainer (M-size feature) — viable, deferred from 5R Option Y
- (Z) Cleanup batch (legacy RetirementPanel orphan + smaller items, S-size) — deferred from 5R Option Z

5S handoff (Phase 8) will detail recommended path with pre-flight templates per option.

**Closing:**

Sub-Epic 5R closes Q1 carry-over after extended 4-defer history. Root cause was incomplete rollback drift — a class of bug that's invisible to end users when frontend has graceful fallback for missing data. Detection mechanism (Lesson #36 candidate) is the structural improvement to prevent recurrence, beyond the surgical fix shipped.

19/22 (86%) milestone reached. 14-streak preserved. Three more sub-epics to Epic 5 closure.
