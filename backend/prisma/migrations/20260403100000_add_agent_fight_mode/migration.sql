-- AlterTable: Add fightMode field to AgentTactics
ALTER TABLE "AgentTactics" ADD COLUMN "fightMode" TEXT NOT NULL DEFAULT 'pve_training';
