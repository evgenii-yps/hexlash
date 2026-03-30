-- AlterTable
ALTER TABLE "Club" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Club" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;

-- Update maxMembers default for new clubs (level 1 = 20 members)
ALTER TABLE "Club" ALTER COLUMN "maxMembers" SET DEFAULT 20;
