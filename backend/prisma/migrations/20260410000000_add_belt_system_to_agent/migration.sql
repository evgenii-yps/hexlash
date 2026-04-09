-- AlterTable: Add belt system fields to Agent
ALTER TABLE "Agent" ADD COLUMN "belt" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Agent" ADD COLUMN "qualifiedWins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Agent" ADD COLUMN "isHexmaster" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Agent_belt_idx" ON "Agent"("belt");
