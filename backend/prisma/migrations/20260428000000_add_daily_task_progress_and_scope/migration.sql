-- 5K — Daily Tasks: scope field + progress tracking + daily-cycle assignedDate

-- AlterTable: DailyTask add scope
ALTER TABLE "DailyTask" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'general';

-- AlterTable: UserDailyTask add progress + assignedDate, make completedAt nullable
ALTER TABLE "UserDailyTask" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserDailyTask" ADD COLUMN "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "UserDailyTask" ALTER COLUMN "completedAt" DROP NOT NULL;
ALTER TABLE "UserDailyTask" ALTER COLUMN "completedAt" DROP DEFAULT;

-- DropIndex: old unique constraint [userId, taskId]
DROP INDEX "UserDailyTask_userId_taskId_key";

-- CreateIndex: new compound unique constraint [userId, taskId, assignedDate] — allows daily cycling
CREATE UNIQUE INDEX "UserDailyTask_userId_taskId_assignedDate_key" ON "UserDailyTask"("userId", "taskId", "assignedDate");
