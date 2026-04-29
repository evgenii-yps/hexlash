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
