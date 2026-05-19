-- Phase 11 — Task-language retire
--
-- Background: SocialTask.language + DailyTask.language columns are vestigial.
-- Project shipped English-only post-referral-серии. Frontend transport chain
-- hardcodes 'en' via taskService default param, never passes a real language.
-- Backend response shape already strips task.language (inline tasks.map in
-- task.js). Audit: docs/investigations/TASK_LANGUAGE_AUDIT_REPORT.md (PR #387).
--
-- Production state (verified 2026-05-18 via owner-executed Railway SQL):
--   - SocialTask:     12 rows (6 EN + 6 RU)
--   - DailyTask:      16 rows (8 EN + 8 RU)
--   - UserSocialTask: 0 rows total (empty system-wide, not just RU subset)
--   - UserDailyTask:  0 rows total
--
-- FK constraint UserSocialTask.taskId → SocialTask.id is ON DELETE RESTRICT
-- per init migration 20260312000000_init. Restriction would have blocked
-- DELETE on SocialTask with user references; UserSocialTask being empty
-- makes the restriction nonbinding. Same for UserDailyTask / DailyTask.
--
-- Pre-flight (owner-side, MUST RUN immediately before merge — see
-- docs/investigations/TASK_LANGUAGE_SQL_QUERIES.md):
--
--   SELECT 'UserSocialTask' AS t, COUNT(*) FROM "UserSocialTask"
--   UNION ALL SELECT 'UserDailyTask',  COUNT(*) FROM "UserDailyTask";
--
-- If either count > 0 between audit and execution, STOP and re-evaluate —
-- this migration's DELETE statements would silently obliterate user
-- progress without warning.
--
-- ── Step 1: DELETE RU task definitions (MUST run before column drop) ─────
-- Removes 6 SocialTask + 8 DailyTask = 14 rows. After this step the RU rows
-- are gone and the surviving 14 EN rows have unique category values, which
-- is the precondition for the unique-index creation in Step 3.

DELETE FROM "SocialTask" WHERE language = 'ru';
DELETE FROM "DailyTask"  WHERE language = 'ru';

-- ── Step 2: Drop language column from both task tables ───────────────────

ALTER TABLE "SocialTask" DROP COLUMN "language";
ALTER TABLE "DailyTask"  DROP COLUMN "language";

-- ── Step 3: Add @@unique([category]) to replace seed-time logical uniqueness ─
-- Previously seed.js used findFirst({where: {category, language}}) for
-- idempotency. After dropping language, seed.js switches to upsert/findFirst
-- by category alone; this index enforces the same invariant at schema level.

CREATE UNIQUE INDEX "SocialTask_category_key" ON "SocialTask"("category");
CREATE UNIQUE INDEX "DailyTask_category_key"  ON "DailyTask"("category");
