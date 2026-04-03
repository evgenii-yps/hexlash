-- AlterTable: Add autoFight field to Agent
ALTER TABLE "Agent" ADD COLUMN "autoFight" BOOLEAN NOT NULL DEFAULT false;
