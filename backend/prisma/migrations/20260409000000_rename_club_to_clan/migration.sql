-- ═════════════════════════════════════════════════════════════
-- MIGRATION: Rename Club → Clan, ClubInvite → ClanInvite
-- DATE: 2026-04-09
-- TICKET: #P1-rename-1 (Phase 1)
--
-- ROLLBACK PLAN:
-- 1. Restore database from backup taken before this migration
-- 2. Run: npx prisma migrate resolve --rolled-back 20260409000000_rename_club_to_clan
-- 3. Restore previous schema.prisma from git: git checkout HEAD~1 -- backend/prisma/schema.prisma
-- 4. Run: npx prisma generate
--
-- DOWN MIGRATION (alternative — use only if backup unavailable):
-- BEGIN;
-- ALTER TABLE "Clan" RENAME TO "Club";
-- ALTER TABLE "ClanInvite" RENAME TO "ClubInvite";
-- ALTER TABLE "User" RENAME COLUMN "clanId" TO "clubId";
-- ALTER TABLE "User" RENAME COLUMN "clanRole" TO "clubRole";
-- ALTER TABLE "ClanEvent" RENAME COLUMN "clanId" TO "clubId";
-- ALTER TABLE "ClanInvite" RENAME COLUMN "clanId" TO "clubId";
-- ALTER TABLE "Club" RENAME CONSTRAINT "Clan_pkey" TO "Club_pkey";
-- ALTER TABLE "ClubInvite" RENAME CONSTRAINT "ClanInvite_pkey" TO "ClubInvite_pkey";
-- ALTER TABLE "Club" RENAME CONSTRAINT "Clan_ownerId_fkey" TO "Club_ownerId_fkey";
-- ALTER TABLE "User" RENAME CONSTRAINT "User_clanId_fkey" TO "User_clubId_fkey";
-- ALTER TABLE "ClanEvent" RENAME CONSTRAINT "ClanEvent_clanId_fkey" TO "ClanEvent_clubId_fkey";
-- ALTER TABLE "ClubInvite" RENAME CONSTRAINT "ClanInvite_clanId_fkey" TO "ClubInvite_clubId_fkey";
-- ALTER TABLE "ClubInvite" RENAME CONSTRAINT "ClanInvite_inviterId_fkey" TO "ClubInvite_inviterId_fkey";
-- ALTER TABLE "ClubInvite" RENAME CONSTRAINT "ClanInvite_inviteeId_fkey" TO "ClubInvite_inviteeId_fkey";
-- ALTER INDEX "ClanInvite_clanId_inviteeId_status_key" RENAME TO "ClubInvite_clubId_inviteeId_status_key";
-- ALTER INDEX "ClanInvite_inviteeId_status_idx" RENAME TO "ClubInvite_inviteeId_status_idx";
-- ALTER INDEX "ClanEvent_clanId_createdAt_idx" RENAME TO "ClanEvent_clubId_createdAt_idx";
-- COMMIT;
-- ═════════════════════════════════════════════════════════════

-- A) Rename tables
ALTER TABLE "Club" RENAME TO "Clan";
ALTER TABLE "ClubInvite" RENAME TO "ClanInvite";

-- B) Rename columns in upstream models
ALTER TABLE "User" RENAME COLUMN "clubId" TO "clanId";
ALTER TABLE "User" RENAME COLUMN "clubRole" TO "clanRole";
ALTER TABLE "ClanEvent" RENAME COLUMN "clubId" TO "clanId";
ALTER TABLE "ClanInvite" RENAME COLUMN "clubId" TO "clanId";

-- C) Rename primary keys
ALTER TABLE "Clan" RENAME CONSTRAINT "Club_pkey" TO "Clan_pkey";
ALTER TABLE "ClanInvite" RENAME CONSTRAINT "ClubInvite_pkey" TO "ClanInvite_pkey";

-- D) Rename foreign keys
ALTER TABLE "Clan" RENAME CONSTRAINT "Club_ownerId_fkey" TO "Clan_ownerId_fkey";
ALTER TABLE "User" RENAME CONSTRAINT "User_clubId_fkey" TO "User_clanId_fkey";
ALTER TABLE "ClanEvent" RENAME CONSTRAINT "ClanEvent_clubId_fkey" TO "ClanEvent_clanId_fkey";
ALTER TABLE "ClanInvite" RENAME CONSTRAINT "ClubInvite_clubId_fkey" TO "ClanInvite_clanId_fkey";
ALTER TABLE "ClanInvite" RENAME CONSTRAINT "ClubInvite_inviterId_fkey" TO "ClanInvite_inviterId_fkey";
ALTER TABLE "ClanInvite" RENAME CONSTRAINT "ClubInvite_inviteeId_fkey" TO "ClanInvite_inviteeId_fkey";

-- E) Rename unique constraints and indexes
ALTER INDEX "ClubInvite_clubId_inviteeId_status_key" RENAME TO "ClanInvite_clanId_inviteeId_status_key";
ALTER INDEX "ClubInvite_inviteeId_status_idx" RENAME TO "ClanInvite_inviteeId_status_idx";
ALTER INDEX "ClanEvent_clubId_createdAt_idx" RENAME TO "ClanEvent_clanId_createdAt_idx";
