-- DropIndex
DROP INDEX "Agent_fightClubId_isCaptain_idx";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "isCaptain";
