-- AlterTable
ALTER TABLE "Club" ADD COLUMN "maxMembers" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "clubRole" TEXT;

-- Set clubRole for existing club owners
UPDATE "User" u SET "clubRole" = 'owner' FROM "Club" c WHERE u."id" = c."ownerId" AND u."clubId" = c."id";

-- Set clubRole for existing club members (non-owners)
UPDATE "User" SET "clubRole" = 'member' WHERE "clubId" IS NOT NULL AND "clubRole" IS NULL;
