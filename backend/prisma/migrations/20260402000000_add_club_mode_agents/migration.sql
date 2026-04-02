-- AlterTable: Add agent-related fields to Club
ALTER TABLE "Club" ADD COLUMN "maxAgents" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Club" ADD COLUMN "legendSkin" TEXT;
ALTER TABLE "Club" ADD COLUMN "legendArchetype" TEXT;
ALTER TABLE "Club" ADD COLUMN "legendBuff" JSONB;

-- CreateTable: Agent
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skin" TEXT NOT NULL,
    "primaryModule" TEXT NOT NULL,
    "secondaryModule" TEXT NOT NULL,
    "tertiaryModule" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "totalFights" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "lastFightAt" TIMESTAMP(3),
    "nextFightAt" TIMESTAMP(3),
    "clubId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AgentTactics
CREATE TABLE "AgentTactics" (
    "id" TEXT NOT NULL,
    "aggression" TEXT NOT NULL DEFAULT 'balanced',
    "dicePolicy" TEXT NOT NULL DEFAULT 'smart',
    "coachPreference" TEXT NOT NULL DEFAULT 'auto',
    "emergencyThreshold" INTEGER NOT NULL DEFAULT 30,
    "restPeriod" INTEGER NOT NULL DEFAULT 600000,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "AgentTactics_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AgentProgression
CREATE TABLE "AgentProgression" (
    "id" TEXT NOT NULL,
    "speedXp" INTEGER NOT NULL DEFAULT 0,
    "powerXp" INTEGER NOT NULL DEFAULT 0,
    "techniqueXp" INTEGER NOT NULL DEFAULT 0,
    "moves" JSONB NOT NULL DEFAULT '[]',
    "deck" JSONB NOT NULL DEFAULT '[]',
    "agentId" TEXT NOT NULL,

    CONSTRAINT "AgentProgression_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AgentFightLog
CREATE TABLE "AgentFightLog" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "opponentName" TEXT,
    "opponentId" TEXT,
    "opponentOwnerId" TEXT,
    "rounds" INTEGER NOT NULL,
    "playerHpLeft" INTEGER NOT NULL,
    "opponentHpLeft" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "eloChange" INTEGER NOT NULL DEFAULT 0,
    "fightData" JSONB,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentFightLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Agent_clubId_idx" ON "Agent"("clubId");
CREATE INDEX "Agent_ownerId_idx" ON "Agent"("ownerId");
CREATE INDEX "Agent_elo_idx" ON "Agent"("elo");
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTactics_agentId_key" ON "AgentTactics"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProgression_agentId_key" ON "AgentProgression"("agentId");

-- CreateIndex
CREATE INDEX "AgentFightLog_agentId_idx" ON "AgentFightLog"("agentId");
CREATE INDEX "AgentFightLog_createdAt_idx" ON "AgentFightLog"("createdAt");
CREATE INDEX "AgentFightLog_mode_idx" ON "AgentFightLog"("mode");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTactics" ADD CONSTRAINT "AgentTactics_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProgression" ADD CONSTRAINT "AgentProgression_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentFightLog" ADD CONSTRAINT "AgentFightLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
