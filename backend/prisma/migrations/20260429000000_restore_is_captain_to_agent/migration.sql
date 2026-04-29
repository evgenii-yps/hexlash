-- 5R Phase 1 — Restore Agent.isCaptain dropped by orphan production migration
-- (20260416000000_remove_is_captain_from_agent applied to prod 2026-04-16,
--  never committed to repo; confirmed via Railway _prisma_migrations dump).
--
-- Idempotent: prod adds column back; test/dev (where column never dropped)
-- sees no-op via IF NOT EXISTS guards.

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "isCaptain" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Agent_fightClubId_isCaptain_idx" ON "Agent"("fightClubId", "isCaptain");
