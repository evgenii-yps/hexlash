# Task-language Audit — SQL Queries

**For Gate 2 of `TASK_LANGUAGE_AUDIT_REPORT.md`.** Owner-run only.

## Procedure

1. Open Railway dashboard → your production database → **Data** tab → **Query** panel.
2. Run each query below **one at a time** (top to bottom).
3. Paste the **complete tabular output** into the matching `<!-- RESULT: paste here -->` placeholder below the query (replace the placeholder line with the actual output between the result fences).
4. When done, either:
   - Commit + push directly to this branch (`claude/investigate-task-language`), OR
   - Paste all results into chat — Claude Code will commit them.

## Safety guarantees

- **All queries are read-only `SELECT`** — zero DDL, zero DML, no mutations.
- No CTE side effects. No `RETURNING`. No volatile functions.
- Safe to re-run any number of times.
- If any query errors out (e.g., wrong table name due to schema drift), paste the error message verbatim into the RESULT block and move on — Claude Code will adjust the next query set.

## Schema reference (for query interpretation)

Quoted identifiers are required because Prisma uses CamelCase table names. PostgreSQL would otherwise downcase them.

- `"SocialTask"` (id String, language String NOT NULL DEFAULT 'en', category String, ...)
- `"DailyTask"` (id String, language String NOT NULL DEFAULT 'en', category String, scope String NOT NULL DEFAULT 'general', ...)
- `"UserSocialTask"` (id Int, "userId" String, "taskId" String, "completedAt" DateTime DEFAULT now())
- `"UserDailyTask"` (id Int, "userId" String, "taskId" String, progress Int, "assignedDate" DateTime DEFAULT now(), "completedAt" DateTime NULLABLE)

---

## Q1 — SocialTask definitions by language

**Question:** How many SocialTask rows exist per language value on production?

```sql
SELECT language, COUNT(*) AS rows
FROM "SocialTask"
GROUP BY language
ORDER BY language;
```

```
<!-- RESULT: paste here -->
```

---

## Q2 — DailyTask definitions by language

**Question:** How many DailyTask rows exist per language value on production?

```sql
SELECT language, COUNT(*) AS rows
FROM "DailyTask"
GROUP BY language
ORDER BY language;
```

```
<!-- RESULT: paste here -->
```

---

## Q3 — Any unexpected language values

**Question:** Are there any task definitions with `language` outside the expected `{en, ru}` set (NULL, capitalization variants, typos, other codes)?

```sql
SELECT 'SocialTask' AS table_name, language, COUNT(*) AS rows
FROM "SocialTask"
WHERE language IS NULL OR language NOT IN ('en', 'ru')
GROUP BY language
UNION ALL
SELECT 'DailyTask' AS table_name, language, COUNT(*) AS rows
FROM "DailyTask"
WHERE language IS NULL OR language NOT IN ('en', 'ru')
GROUP BY language
ORDER BY table_name, language;
```

Empty result is a valid answer (= no surprise values).

```
<!-- RESULT: paste here -->
```

---

## Q4 — UserSocialTask rows tied to RU SocialTask definitions

**Question:** How many `UserSocialTask` rows reference an RU `SocialTask`? How many distinct users? What is the date span (earliest / latest completion)?

```sql
SELECT
  COUNT(*) AS total_user_rows,
  COUNT(DISTINCT ust."userId") AS unique_users,
  MIN(ust."completedAt") AS earliest_completed,
  MAX(ust."completedAt") AS latest_completed
FROM "UserSocialTask" ust
JOIN "SocialTask" st ON ust."taskId" = st.id
WHERE st.language = 'ru';
```

```
<!-- RESULT: paste here -->
```

---

## Q5 — UserSocialTask breakdown per RU task definition

**Question:** For each RU SocialTask, how many users have completed it?

```sql
SELECT
  st.id AS task_id,
  st.category AS category,
  st.title AS title,
  COUNT(ust.id) AS completions,
  COUNT(DISTINCT ust."userId") AS unique_users
FROM "SocialTask" st
LEFT JOIN "UserSocialTask" ust ON ust."taskId" = st.id
WHERE st.language = 'ru'
GROUP BY st.id, st.category, st.title
ORDER BY completions DESC, st.category;
```

```
<!-- RESULT: paste here -->
```

---

## Q6 — UserDailyTask rows tied to RU DailyTask definitions

**Question:** How many `UserDailyTask` rows reference an RU `DailyTask`? How many distinct users? Date spans for both `assignedDate` and `completedAt` (the latter may have NULLs for in-progress rows)?

```sql
SELECT
  COUNT(*) AS total_user_rows,
  COUNT(DISTINCT udt."userId") AS unique_users,
  COUNT(udt."completedAt") AS completed_rows,
  COUNT(*) - COUNT(udt."completedAt") AS in_progress_rows,
  MIN(udt."assignedDate") AS earliest_assigned,
  MAX(udt."assignedDate") AS latest_assigned,
  MIN(udt."completedAt") AS earliest_completed,
  MAX(udt."completedAt") AS latest_completed
FROM "UserDailyTask" udt
JOIN "DailyTask" dt ON udt."taskId" = dt.id
WHERE dt.language = 'ru';
```

```
<!-- RESULT: paste here -->
```

---

## Q7 — UserDailyTask breakdown per RU task definition

**Question:** For each RU DailyTask, how many user rows exist? Split between completed vs in-progress?

```sql
SELECT
  dt.id AS task_id,
  dt.category AS category,
  dt.scope AS scope,
  dt.title AS title,
  COUNT(udt.id) AS total_rows,
  COUNT(udt."completedAt") AS completed_rows,
  COUNT(udt.id) - COUNT(udt."completedAt") AS in_progress_rows,
  COUNT(DISTINCT udt."userId") AS unique_users
FROM "DailyTask" dt
LEFT JOIN "UserDailyTask" udt ON udt."taskId" = dt.id
WHERE dt.language = 'ru'
GROUP BY dt.id, dt.category, dt.scope, dt.title
ORDER BY total_rows DESC, dt.scope, dt.category;
```

```
<!-- RESULT: paste here -->
```

---

## Q8 — Freshness distribution (RU UserSocialTask completion dates)

**Question:** How recent are the RU UserSocialTask completions? Bucketed by months back from today.

```sql
SELECT
  date_trunc('month', ust."completedAt") AS month_bucket,
  COUNT(*) AS completions
FROM "UserSocialTask" ust
JOIN "SocialTask" st ON ust."taskId" = st.id
WHERE st.language = 'ru'
GROUP BY date_trunc('month', ust."completedAt")
ORDER BY month_bucket DESC;
```

```
<!-- RESULT: paste here -->
```

---

## Q9 — Freshness distribution (RU UserDailyTask assigned dates)

**Question:** How recent are the RU UserDailyTask assignments? (Includes both completed and in-progress.)

```sql
SELECT
  date_trunc('month', udt."assignedDate") AS month_bucket,
  COUNT(*) AS total_rows,
  COUNT(udt."completedAt") AS completed_rows
FROM "UserDailyTask" udt
JOIN "DailyTask" dt ON udt."taskId" = dt.id
WHERE dt.language = 'ru'
GROUP BY date_trunc('month', udt."assignedDate")
ORDER BY month_bucket DESC;
```

```
<!-- RESULT: paste here -->
```

---

## Q10 — Sanity check: total task tables size

**Question:** What are the absolute total row counts in all four task tables? Helps frame the RU subset against the whole dataset.

```sql
SELECT 'SocialTask' AS table_name, COUNT(*) AS rows FROM "SocialTask"
UNION ALL SELECT 'DailyTask', COUNT(*) FROM "DailyTask"
UNION ALL SELECT 'UserSocialTask', COUNT(*) FROM "UserSocialTask"
UNION ALL SELECT 'UserDailyTask', COUNT(*) FROM "UserDailyTask"
ORDER BY table_name;
```

```
<!-- RESULT: paste here -->
```

---

## After running

Save the file (with results pasted into each RESULT block), then either:

1. **Commit + push to this branch** (`claude/investigate-task-language`):
   ```
   git add docs/investigations/TASK_LANGUAGE_SQL_QUERIES.md
   git commit -m "data(sql): production task-language audit query results"
   git push
   ```

2. **OR paste raw output into the chat** — Claude Code will commit them.

Once results land, the audit resumes at Gate 2 and the main report's `§4` / `§5` / `§6` / `§Recommendation` will be filled.
