-- Stream 1.5 / Email Auth Phase 1 Step 2 — Schema additions for email auth flow
--
-- Adds:
--   1. Unique constraint on User.email (now nullable post-Step 1 cleanup)
--   2. verifyToken / verifyTokenExpiresAt — email verification flow (24h TTL)
--   3. resetToken / resetTokenExpiresAt — password reset flow (1h TTL)
--   4. Unique constraints on both token columns (fast lookup + uniqueness)
--
-- PREREQUISITE: 20260508000000_email_data_cleanup must have applied successfully.
-- This migration assumes:
--   - email column is nullable (DROP NOT NULL applied)
--   - email column has no DEFAULT '' (DROP DEFAULT applied)
--   - all empty-string emails converted to NULL
--   - no duplicate non-NULL emails exist (verified by diagnostic script)
--
-- Case-sensitivity note: @unique on email is CASE-SENSITIVE in PostgreSQL by
-- default. Application code (auth.js login + forgot-password) MUST normalize
-- to lowercase BEFORE storing/querying. If case-insensitive DB-level uniqueness
-- needed in future, replace with: CREATE UNIQUE INDEX ON "User" (LOWER(email)).
-- Current implementation: app-side LOWER() normalization — sufficient for
-- expected scale + matches existing User.login case-insensitive lookup pattern.
--
-- PostgreSQL allows multiple NULL values in unique columns natively — wallet-
-- only users (email=NULL) and dormant verify/reset states (token=NULL) all
-- coexist without constraint conflict.

-- Step 2.1 — Unique constraint on email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Step 2.2 — Email verification token fields
ALTER TABLE "User" ADD COLUMN "verifyToken" TEXT;
ALTER TABLE "User" ADD COLUMN "verifyTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_verifyToken_key" ON "User"("verifyToken");

-- Step 2.3 — Password reset token fields
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
