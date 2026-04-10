-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "isCaptain" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Agent_fightClubId_isCaptain_idx" ON "Agent"("fightClubId", "isCaptain");
