-- CreateTable
CREATE TABLE "ClanEvent" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClanEvent_clubId_createdAt_idx" ON "ClanEvent"("clubId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClanEvent" ADD CONSTRAINT "ClanEvent_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
