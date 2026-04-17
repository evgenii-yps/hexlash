-- Phase 4.6: User.country (ISO 3166-1 alpha-2)

ALTER TABLE "User" ADD COLUMN "country" TEXT;

CREATE INDEX "User_country_idx" ON "User"("country");
