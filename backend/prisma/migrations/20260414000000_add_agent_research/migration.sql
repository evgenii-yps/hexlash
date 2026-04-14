-- AlterTable: Add research JSON field to AgentProgression
ALTER TABLE "AgentProgression" ADD COLUMN "research" JSONB NOT NULL DEFAULT '{}';
