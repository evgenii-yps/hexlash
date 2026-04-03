-- CreateTable: FightClub
CREATE TABLE "FightClub" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "maxAgents" INTEGER NOT NULL DEFAULT 2,
    "legendSkin" TEXT,
    "legendArchetype" TEXT,
    "legendBuff" JSONB,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FightClub_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FightClub_ownerId_key" ON "FightClub"("ownerId");

-- AddForeignKey
ALTER TABLE "FightClub" ADD CONSTRAINT "FightClub_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing agents: create FightClub for each agent owner
INSERT INTO "FightClub" ("id", "ownerId", "level", "xp", "maxAgents", "legendSkin", "legendArchetype", "legendBuff", "updatedAt")
SELECT
    gen_random_uuid(),
    a."ownerId",
    COALESCE(c."level", 1),
    COALESCE(c."xp", 0),
    COALESCE(c."maxAgents", 2),
    c."legendSkin",
    c."legendArchetype",
    c."legendBuff",
    NOW()
FROM (SELECT DISTINCT "ownerId", "clubId" FROM "Agent") a
LEFT JOIN "Club" c ON c."id" = a."clubId"
ON CONFLICT ("ownerId") DO NOTHING;

-- Add fightClubId column to Agent
ALTER TABLE "Agent" ADD COLUMN "fightClubId" TEXT;

-- Populate fightClubId from existing ownership
UPDATE "Agent" a SET "fightClubId" = fc."id"
FROM "FightClub" fc WHERE fc."ownerId" = a."ownerId";

-- Drop old clubId foreign key and index
ALTER TABLE "Agent" DROP CONSTRAINT IF EXISTS "Agent_clubId_fkey";
DROP INDEX IF EXISTS "Agent_clubId_idx";

-- Make fightClubId NOT NULL and add FK
ALTER TABLE "Agent" ALTER COLUMN "fightClubId" SET NOT NULL;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_fightClubId_fkey" FOREIGN KEY ("fightClubId") REFERENCES "FightClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Agent_fightClubId_idx" ON "Agent"("fightClubId");

-- Drop old clubId column
ALTER TABLE "Agent" DROP COLUMN "clubId";

-- Remove Club Mode fields from Club
ALTER TABLE "Club" DROP COLUMN IF EXISTS "maxAgents";
ALTER TABLE "Club" DROP COLUMN IF EXISTS "legendSkin";
ALTER TABLE "Club" DROP COLUMN IF EXISTS "legendArchetype";
ALTER TABLE "Club" DROP COLUMN IF EXISTS "legendBuff";
