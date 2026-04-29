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
