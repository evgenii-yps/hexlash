-- AlterTable: make agent module fields optional
ALTER TABLE "Agent" ALTER COLUMN "primaryModule" DROP NOT NULL;
ALTER TABLE "Agent" ALTER COLUMN "secondaryModule" DROP NOT NULL;
ALTER TABLE "Agent" ALTER COLUMN "tertiaryModule" DROP NOT NULL;
