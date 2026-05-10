-- Stream 1.5 / Email Auth Phase 1 Step 1 — Data cleanup before adding @unique on email
--
-- Background: User.email column was created (init migration 20260312000000) as
-- TEXT NOT NULL DEFAULT ''. Many existing users likely have email='' (default).
-- Adding @unique constraint atomically would fail on duplicate empty strings.
-- This migration drops NOT NULL + default + converts empty strings to NULL,
-- preparing for Step 2 (20260508010000_add_email_auth_tokens) which adds the
-- unique constraint + new token fields.
--
-- PostgreSQL allows multiple NULL values in unique columns natively, so all
-- pre-existing email-less users keep working post-Step 2.
--
-- ── Pre-deploy diagnostics (REQUIRED on prod before applying) ───────────────
-- Run these queries via Prisma Studio, psql, or pgAdmin:
--
--   -- Count of users to be cleaned up:
--   SELECT COUNT(*) FROM "User" WHERE "email" = '' OR "email" IS NULL;
--
--   -- Detect duplicate non-empty emails (CASE-SENSITIVE per current behavior):
--   SELECT email, COUNT(*) FROM "User"
--     WHERE email != '' AND email IS NOT NULL
--     GROUP BY email HAVING COUNT(*) > 1;
--
--   -- Detect case-insensitive duplicate emails (will block Step 2 unique on
--   -- naive @unique; Step 2 uses case-sensitive unique by default — see Step 2
--   -- migration notes for upgrade path if case-insensitive uniqueness needed):
--   SELECT LOWER(email), COUNT(*) FROM "User"
--     WHERE email != '' AND email IS NOT NULL
--     GROUP BY LOWER(email) HAVING COUNT(*) > 1;
--
-- If duplicates found → STOP, manual reconciliation required before applying
-- this migration. Either:
--   (a) Keep one user per email, set others' email to NULL
--   (b) Rename duplicate emails (append +N suffix) for owners to claim
--   (c) Surface to user for case-by-case decision
--
-- See backend/scripts/check-email-cleanup-counts.js for automated diagnostic.
-- ────────────────────────────────────────────────────────────────────────────

-- Step 1.1 — drop NOT NULL + default on email column
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" DROP DEFAULT;

-- Step 1.2 — empty strings → NULL (cleanup pre-existing default-value rows)
UPDATE "User" SET "email" = NULL WHERE "email" = '';
