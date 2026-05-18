# Task-language Retire — Investigation Report

**Date:** 2026-05-18
**Branch:** `claude/investigate-task-language`
**HEAD SHA:** `44fa7ff` (PR #386 parking #8 closure merged — STEP 0 verified via `grep "CLOSED as vestigial via investigation PR #385" CLAUDE.md` → 1 hit)
**Scope:** Read-only audit. No code changes. Single deliverable.
**Trigger:** CLAUDE.md parking item #11 (Phase 10 Stage A deferred): "SocialTask.language + DailyTask.language columns + task.js route filters + seed.js rewrite + RU-duplicate prod data cleanup. Backend extension series." Plus parking item #12 (decision needed before Phase 11 executes: 11 RU-task user-history rows — accept loss vs migrate FKs).

---

## TL;DR

`SocialTask.language` and `DailyTask.language` columns + filter chain (URL param → Prisma `where` filter → no FE exposure) are **vestigial** — the entire FE consumer chain hardcodes `'en'` via a `= 'en'` default in `taskService.js` and **never passes a real language argument** from any caller. Backend filter mechanically works but receives only `'en'` from production traffic. RU task definitions in seed.js exist as historical English-only-project artefacts.

**Critical execution-phase finding (NOT trivial):** FK constraints on `UserSocialTask.taskId` + `UserDailyTask.taskId` use **`ON DELETE RESTRICT`** at SQL level [confirmed by reading `20260312000000_init/migration.sql` lines 188 + 194]. Direct `DELETE FROM SocialTask WHERE language='ru'` will **fail with FK violation** if any UserSocialTask/UserDailyTask references exist. Owner's "DELETE с cascade" decision is achievable through three procedures (each documented in §Recommendation), but is NOT a single trivial DELETE.

**Production SQL deferred to Gate 2** — `docs/investigations/TASK_LANGUAGE_SQL_QUERIES.md` shipped with this PR; owner runs queries in Railway dashboard and either pastes results into the file or sends them via chat for §4 + §Cascade impact to be filled. This report is **Gate 1 complete** (§1-3 + SQL queries file). §4-Recommendation will be added once owner returns SQL results.

**Surfaced bonus findings already at Gate 1:**
- Seed.js currently writes **28 task definitions** (14 EN + 14 RU) — split equally [confirmed]. Phase 10 estimate of "~28" was accurate.
- Vuex `task/fetchAllSocialTasks` and `task/fetchAllDailyTasks` actions accept **no language argument** [confirmed]. The 2 frontend callsites (`HudSocialTasks.vue:84`, `HudTraining.vue:129`) both invoke `store.dispatch('task/...')` with zero payload.
- `formatTaskResponse` (inline `tasks.map(...)` in `task.js:21-29` + `:70-83`) **drops `task.language` from API response** [confirmed]. FE never sees the language field. The language column is purely a server-side filter mechanism.
- `SocialTaskModel` + `DailyTaskModel` (frontend) have **no `language` constructor field** [confirmed]. Even if backend leaked it, FE model would strip it.

---

## Database schema state

### Models touched

[confirmed via reading `backend/prisma/schema.prisma:173-219`]

#### `SocialTask` (line 173-182)

```prisma
model SocialTask {
  id          String  @id @default(uuid())
  title       String
  description String  @default("")
  link        String  @default("")
  tokens      Int     @default(0)
  category    String
  language    String  @default("en")
  users       UserSocialTask[]
}
```

| Property | Value | Notes |
|---|---|---|
| `language` type | `String` (NOT nullable) | `[confirmed]` |
| `language` default | `"en"` | `[confirmed]` |
| `language` indexed | NO — no `@@index` on language | `[confirmed]` |
| `language` part of unique key | NO — no `@@unique` involving language | `[confirmed]` |
| Reverse relation | `users UserSocialTask[]` (cascade target) | `[confirmed]` |

#### `UserSocialTask` (line 184-193)

```prisma
model UserSocialTask {
  id          Int        @id @default(autoincrement())
  userId      String
  taskId      String
  completedAt DateTime   @default(now())
  user        User       @relation(fields: [userId], references: [id])
  task        SocialTask @relation(fields: [taskId], references: [id])

  @@unique([userId, taskId])
}
```

| Property | Value | Notes |
|---|---|---|
| `task` relation onDelete | **Not specified in Prisma schema** → SQL-level is `ON DELETE RESTRICT` per init migration | `[confirmed]` |
| `task` relation onUpdate | Not specified → SQL `ON UPDATE CASCADE` per init migration | `[confirmed]` |
| `user` relation onDelete | Not specified → SQL `ON DELETE RESTRICT` per init migration | `[confirmed]` |
| Unique constraint | `@@unique([userId, taskId])` — user can complete each task once | `[confirmed]` |
| `completedAt` | DateTime with `@default(now())` — useful for §4 freshness query | `[confirmed]` |
| `id` | `Int @id @default(autoincrement())` — note: integer PK, not UUID | `[confirmed]` |

#### `DailyTask` (line 195-206)

```prisma
model DailyTask {
  id          String  @id @default(uuid())
  title       String
  description String  @default("")
  tokens      Int     @default(0)
  category    String
  link        String  @default("")
  value       Int?
  language    String  @default("en")
  scope       String  @default("general") // 5K — "general" | "training"
  users       UserDailyTask[]
}
```

| Property | Value | Notes |
|---|---|---|
| `language` type | `String` (NOT nullable) | `[confirmed]` |
| `language` default | `"en"` | `[confirmed]` |
| `language` indexed | NO | `[confirmed]` |
| `scope` field | Added in 5K migration `20260428000000_add_daily_task_progress_and_scope` | `[confirmed]` |
| Reverse relation | `users UserDailyTask[]` | `[confirmed]` |

#### `UserDailyTask` (line 208-219)

```prisma
model UserDailyTask {
  id           Int       @id @default(autoincrement())
  userId       String
  taskId       String
  progress     Int       @default(0)        // 5K — current progress toward goal
  assignedDate DateTime  @default(now())    // 5K — for daily-cycle filtering
  completedAt  DateTime?                    // 5K — nullable, set when progress >= goal
  user         User      @relation(fields: [userId], references: [id])
  task         DailyTask @relation(fields: [taskId], references: [id])

  @@unique([userId, taskId, assignedDate])  // 5K — allow same task different days
}
```

| Property | Value | Notes |
|---|---|---|
| `task` relation onDelete | Not specified → SQL `ON DELETE RESTRICT` per init migration | `[confirmed]` |
| `progress`, `assignedDate`, `completedAt` | All added in 5K migration `20260428000000_add_daily_task_progress_and_scope` | `[confirmed]` |
| Unique constraint | `@@unique([userId, taskId, assignedDate])` — replaces older `[userId, taskId]` constraint dropped in 5K migration | `[confirmed]` |
| `assignedDate` | DateTime `@default(now())` — useful for §4 freshness query | `[confirmed]` |

### Migration history relevant to task-language chain

[confirmed via reading the 3 migration files + grep across `backend/prisma/migrations/`]

| Migration | Date | Relevant change |
|---|---|---|
| `20260312000000_init` | 2026-03-12 | Created SocialTask + DailyTask + UserSocialTask + UserDailyTask tables. Added `language TEXT NOT NULL DEFAULT 'en'` on both SocialTask + DailyTask. FK constraints: `UserSocialTask.taskId → SocialTask.id ON DELETE RESTRICT ON UPDATE CASCADE` and analogous for UserDailyTask. |
| `20260428000000_add_daily_task_progress_and_scope` | 2026-04-28 | 5K — added `scope` to DailyTask, added `progress`/`assignedDate` to UserDailyTask, dropped old `[userId, taskId]` unique constraint, created new `[userId, taskId, assignedDate]` unique. **Did NOT touch language column.** |
| `20260515000000_drop_user_language_field` | 2026-05-15 | Phase 10 Stage A — dropped `User.language` column only. **Explicitly deferred SocialTask.language + DailyTask.language** to a follow-up phase (per migration header comment). |

**No migration has modified the `language` column on SocialTask or DailyTask since `20260312000000_init`** [confirmed]. Defaults, NOT-NULL, and absence of index have been stable for entire project lifetime.

---

## Backend code lifecycle

[confirmed via `grep -rn "language" backend/src/ --include="*.js" | grep -iE "task|social|daily"`]

### All `language` callsites in backend (task scope)

| File | Line | Context | Status |
|---|---|---|---|
| `backend/src/routes/task.js` | 7 | Route comment `// GET /v1/task/social/:language` | live |
| `backend/src/routes/task.js` | 8 | Route declaration `router.get('/social/:language', authMiddleware, ...)` | live |
| `backend/src/routes/task.js` | 10 | `const { language } = req.params` | live |
| `backend/src/routes/task.js` | 13 | Prisma filter `where: { language }` on `prisma.socialTask.findMany` | live |
| `backend/src/routes/task.js` | 38 | Route comment `// GET /v1/task/daily/:language` | live |
| `backend/src/routes/task.js` | 39 | Route declaration `router.get('/daily/:language', authMiddleware, ...)` | live |
| `backend/src/routes/task.js` | 41 | `const { language } = req.params` | live |
| `backend/src/routes/task.js` | 50 | Build whereClause: `const whereClause = { language }` + optional scope merge | live |
| `backend/prisma/seed.js` | 38-49 | 12 SocialTask entries (6 EN + 6 RU) with explicit `language: 'en'` / `'ru'` | live (idempotent seed) |
| `backend/prisma/seed.js` | 54 | Seed idempotency lookup: `findFirst({ where: { category, language } })` | live |
| `backend/prisma/seed.js` | 66-82 | 16 DailyTask entries (8 EN + 8 RU) with explicit `language: 'en'` / `'ru'` | live (idempotent seed) |
| `backend/prisma/seed.js` | 87 | Seed idempotency lookup: `findFirst({ where: { category, language } })` | live |

### Seed.js entry breakdown

[confirmed via `grep -oP "language: '[a-z]+'" backend/prisma/seed.js | sort | uniq -c`]

| language | count |
|---|---|
| `'en'` | 14 |
| `'ru'` | 14 |
| **total** | **28** |

Of these 28:
- **SocialTask: 12 entries** (6 EN + 6 RU) — categories: SUBSCRIBE_TELEGRAM, SUBSCRIBE_X, SUBSCRIBE_YOUTUBE, SUBSCRIBE_DISCORD, SUBSCRIBE_INSTAGRAM, TASK_CONFIRM_EMAIL × 2 languages
- **DailyTask: 16 entries** (8 EN + 8 RU) — categories: FIGHT_X_BATTLES, WIN_X_BATTLES, INVITE_FRIEND (scope=general) + HIT_BAG_X_TIMES, LAND_X_COMBOS, SPEND_FULL_ENERGY, TRAIN_X_MINUTES, EARN_X_TAPS (scope=training) × 2 languages

Phase 10 Stage A's "~28 task entries" estimate was accurate [confirmed].

### Lifecycle table — `SocialTask.language`

| Phase | Site | Detail |
|---|---|---|
| **WRITE** | `backend/prisma/seed.js:38-49` + idempotency `findFirst({where: {category, language}})` line 54 | Seed creates 12 entries (6 EN + 6 RU) on first deploy + every re-seed (skip-if-exists). No other writer. |
| **PERSIST** | PostgreSQL `SocialTask.language` column (TEXT, NOT NULL, DEFAULT 'en') | No mid-life mutations — `language` is set at creation and never updated. |
| **READ (server-side filter only)** | `backend/src/routes/task.js:13` — `prisma.socialTask.findMany({ where: { language } })` driven by URL param `:language` | Filter mechanism. Reads ONLY for the WHERE clause. |
| **READ (response-shape exposure)** | `backend/src/routes/task.js:21-29` — `tasks.map((task) => ({ id, title, description, link, tokens, isCompleted, category }))` | `language` is **NOT included** in response body. Frontend never receives the column value. |
| **RESTORE** | N/A — no client-side persistence layer for the language field | The whole notion of "restore language" doesn't exist; it's a server-only filter knob. |

### Lifecycle table — `DailyTask.language`

| Phase | Site | Detail |
|---|---|---|
| **WRITE** | `backend/prisma/seed.js:66-82` + idempotency `findFirst({where: {category, language}})` line 87 | Seed creates 16 entries (8 EN + 8 RU). Same idempotency pattern. |
| **PERSIST** | PostgreSQL `DailyTask.language` column (TEXT, NOT NULL, DEFAULT 'en') | Same as SocialTask. |
| **READ (server-side filter)** | `backend/src/routes/task.js:50` — `whereClause = { language }` plus optional scope merge | Filter mechanism. Filter passes `language` AND optionally `scope` together. |
| **READ (response-shape exposure)** | `backend/src/routes/task.js:70-83` — response map drops `task.language` | Same shape principle as SocialTask. FE doesn't see it. |
| **RESTORE** | N/A | Same as SocialTask. |

### Other backend `language` usage (out of task scope, audited for completeness)

| File | Line | Context | Verdict |
|---|---|---|---|
| `backend/src/routes/ai.js` | 97, 104, 286 | AI prompt content references "language" as a word in English natural-language text (Claude Trainer system prompts) | NOT a column reference — false positive, out of scope |
| `backend/src/routes/user.js` | 566 | Comment block: `// Phase 10: language accept/return retired (User.language column dropped)` | Historical narration, no code dependency |
| Any other `task.language` filter / writer outside `task.js` + `seed.js` | — | NONE — `grep -rn "task.language\|socialTask.language\|dailyTask.language" backend/src/` returns zero hits | `[confirmed]` |

---

## Frontend code lifecycle

[confirmed via `grep -rn "language" src/ --include="*.js" --include="*.vue" | grep -iE "task|social|daily"`]

### All `language` callsites in frontend (task scope)

| File | Line | Context | Status |
|---|---|---|---|
| `src/core/services/taskService.js` | 16 | `export const getAllSocialTasksFromLocalAndAPI = async (language) => {` | live (signature accepts arg, but no caller passes it) |
| `src/core/services/taskService.js` | 22 | `getSocialTasksFromAPI(language)` (internal call) | live |
| `src/core/services/taskService.js` | 26 | `export const getSocialTasksFromAPI = (language) =>` | live |
| `src/core/services/taskService.js` | 28 | `fetchAllSocialTasks(language).then(...)` (internal call) | live |
| `src/core/services/taskService.js` | 37 | `export const fetchAllSocialTasks = async (language = 'en') => {` — **DEFAULT 'en' kicks in** | live, default-driven |
| `src/core/services/taskService.js` | 43 | `apiClient.get(\`/task/social/${language}\`, ...)` — URL template | live |
| `src/core/services/taskService.js` | 53 | `getAllDailyTasksFromLocalAndAPI = async (language) => {` | live |
| `src/core/services/taskService.js` | 59 | `getDailyTasksFromAPI(language)` | live |
| `src/core/services/taskService.js` | 63 | `export const getDailyTasksFromAPI = (language) =>` | live |
| `src/core/services/taskService.js` | 65 | `fetchAllDailyTasks(language).then(...)` | live |
| `src/core/services/taskService.js` | 74 | `export const fetchAllDailyTasks = async (language = 'en') => {` — **DEFAULT 'en'** | live, default-driven |
| `src/core/services/taskService.js` | 80 | `apiClient.get(\`/task/daily/${language}\`, ...)` — URL template | live |
| `src/components/hud/HudSocialTasks.vue` | 2 | Code comment "v2 design **language**: mirrors .training-tasks ..." | NOT a language-column reference — false positive |

### Vuex action signatures

[confirmed via reading `src/core/state/modules/taskState.js:72-91`]

```js
async fetchAllSocialTasks({commit}) {
    commit('setIsLoadingSocialTasks', true);
    try {
        await taskService.getAllSocialTasksFromLocalAndAPI();  // ← called with no language argument
    } catch (error) {
        console.error('Error fetching social tasks:', error);
    } finally {
        commit('setIsLoadingSocialTasks', false);
    }
},
async fetchAllDailyTasks({commit}) {
    commit('setIsLoadingDailyTasks', true);
    try {
        await taskService.getAllDailyTasksFromLocalAndAPI();  // ← same, no language
    } catch (error) {
        console.error('Error fetching daily tasks:', error);
    } finally {
        commit('setIsLoadingDailyTasks', false);
    }
},
```

**Both Vuex actions accept `{commit}` only — no `language` parameter exists in the action signature** [confirmed]. The chain forwards `undefined` through `getAllSocialTasksFromLocalAndAPI` → `getSocialTasksFromAPI` → `fetchAllSocialTasks`, where the default parameter `language = 'en'` materializes the value.

### All callers of the task-fetch chain

[confirmed via `grep -rn "fetchAllSocialTasks\|fetchAllDailyTasks\|getAllSocialTasksFromLocalAndAPI\|..." src/` filtered to exclude internal hits]

| File | Line | Caller | Argument passed |
|---|---|---|---|
| `src/components/hud/HudSocialTasks.vue` | 84 | `store.dispatch('task/fetchAllSocialTasks')` | **none — Vuex action signature has no language slot** |
| `src/components/hud/HudTraining.vue` | 129 | `store.dispatch('task/fetchAllDailyTasks')` | **none** |

**Total external callers of the task-fetch chain: 2.** Neither passes a language argument. **Both flows resolve to `'en'`** via the service-layer default. `[confirmed]`

### Frontend model exposure of `language`

[confirmed via reading `src/core/models/socialTaskModel.js` + `dailyTaskModel.js`]

- `SocialTaskModel` constructor params: `id, title, description, link, tokens, isCompleted, category` — **no `language`** [confirmed]
- `DailyTaskModel` constructor params: `id, title, description, tokens, isCompleted, link, category` — **no `language`** [confirmed]
- Even if backend leaked language in the response, the FE model wouldn't accept it.

### Lifecycle table — frontend perspective

| Phase | Site | Detail |
|---|---|---|
| **WRITE (URL build)** | `taskService.js:43, :80` — `\`/task/social/${language}\`` + `\`/task/daily/${language}\`` | Always interpolates `'en'` (default param). |
| **TRANSPORT** | HTTP GET → backend route handler | URL contains `/v1/task/social/en` or `/v1/task/daily/en` always. |
| **RECEIVE** | `taskService.js:46` → `SocialTaskModel.fromJSON(task)` (or analogous `DailyTaskModel`) | Model strips `language` even if present. |
| **PERSIST** | `taskRepository.js` (IndexedDB cache) via `saveSocialTasksToLocalDB` / `saveDailyTasksToLocalDB` | Caches model-shape, so no `language`. |
| **READ in UI** | `HudSocialTasks.vue` + `HudTraining.vue` reads `task.title`, `task.description`, etc. | No `task.language` read anywhere. |

### Critical conclusion for execution-phase planning

The frontend has **zero functional dependency on the `language` URL param** beyond the URL building mechanism. After Phase 10 (`User.language` dropped) the implicit reasoning that the URL param "could" carry a real language disappeared, but the dead default-driven `'en'` remained. When `language` column is dropped from the schema:

- Backend route signature change (drop the `:language` URL param) breaks every FE caller URL building, but since FE always passes `'en'` literally, a route signature like `GET /v1/task/social` (no param) works after a single FE service-layer update.
- Alternatively: keep the route signature for one deploy window, just stop using the param in the WHERE clause. Then drop the param later.

This is a clean retire scenario from the FE perspective. `[confirmed]`

---

## Production database state

**Status: deferred to Gate 2.**

SQL queries shipped in `docs/investigations/TASK_LANGUAGE_SQL_QUERIES.md`. Owner runs them in Railway dashboard (read-only SELECT only, no mutations); results returned via chat OR pasted directly into the file. This report's §4 will be filled with real numbers + raw output going into Appendix A.4 once SQL results are returned.

The minimum 6 questions the SQL set addresses:

1. Counts task definitions per `language` value for `SocialTask`
2. Counts task definitions per `language` value for `DailyTask`
3. Any non-{en, ru} `language` values (NULL, other codes, typos)
4. `UserSocialTask` rows referencing RU `SocialTask` entries — total + unique users
5. `UserDailyTask` rows referencing RU `DailyTask` entries — total + unique users
6. Freshness of the user-history rows (using `completedAt` on UserSocialTask + `assignedDate`/`completedAt` on UserDailyTask)

---

## Cascade impact analysis

**Status: deferred to Gate 2** — full impact requires SQL counts from §4.

Pre-Gate-1 schema-level facts that the impact analysis will build on:

| Element | onDelete (Prisma schema) | onDelete (SQL constraint) | Implication |
|---|---|---|---|
| `UserSocialTask.taskId → SocialTask.id` | NOT specified | `ON DELETE RESTRICT` (init migration line 188) | Direct DELETE on SocialTask **fails if any UserSocialTask references the row** |
| `UserDailyTask.taskId → DailyTask.id` | NOT specified | `ON DELETE RESTRICT` (init migration line 194) | Same — DELETE on DailyTask **fails if UserDailyTask rows reference it** |
| `UserSocialTask.userId → User.id` | NOT specified | `ON DELETE RESTRICT` (init migration line 185) | Irrelevant to this audit (no User deletion planned) |
| `UserDailyTask.userId → User.id` | NOT specified | `ON DELETE RESTRICT` (init migration line 191) | Irrelevant |

**Critical:** Owner's "DELETE с cascade" decision is **not directly executable** against current schema. The deletion must either:

**Option A — Two-step DELETE** (no schema change):
```sql
-- Inside a transaction:
DELETE FROM "UserSocialTask" WHERE "taskId" IN (SELECT id FROM "SocialTask" WHERE language = 'ru');
DELETE FROM "UserDailyTask"  WHERE "taskId" IN (SELECT id FROM "DailyTask"  WHERE language = 'ru');
DELETE FROM "SocialTask" WHERE language = 'ru';
DELETE FROM "DailyTask"  WHERE language = 'ru';
```

**Option B — Schema migration to onDelete: Cascade first, then DELETE:** Add `onDelete: Cascade` to both `task` relations in `schema.prisma`, generate migration, deploy, then run two simple DELETEs.

**Option C — One-shot with raw SQL CASCADE clause** (PostgreSQL feature): `ALTER TABLE "UserSocialTask" DROP CONSTRAINT "UserSocialTask_taskId_fkey", ADD CONSTRAINT "UserSocialTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SocialTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;` then DELETE. (Same effect as Option B, just done via raw migration SQL instead of via Prisma schema regeneration.)

The full §Recommendation will weigh trade-offs (deploy-order risk, rollback path, atomicity) after SQL §4 confirms the exact UserSocialTask + UserDailyTask reference counts.

---

## Surprise findings

**Status: tentative pre-Gate-2.** A few items have surfaced already during §1-3 audit:

### SP-1 — Vuex `task/fetchAllSocialTasks` and `task/fetchAllDailyTasks` accept no language argument

The Vuex action signatures (`async fetchAllSocialTasks({commit})`) have no `language` slot. Both v2 consumer callsites (`HudSocialTasks.vue:84`, `HudTraining.vue:129`) dispatch without payload. The service-layer `language` parameter chain is **dead from the Vuex layer outward** — `language` is `undefined` until the bottom `fetchAllSocialTasks(language = 'en')` default kicks in. Removing the parameter from the service signatures (along with the backend route param) would be a no-op for callers. `[confirmed]`

### SP-2 — `formatTaskResponse` is inline and already strips `language`

There is no `formatTaskResponse` helper. The two task list endpoints inline `tasks.map((task) => ({ id, title, description, link, tokens, isCompleted, category }))` (and analogous shape for daily tasks). **`language` is already absent from the response body** [confirmed]. This means dropping the column on backend won't change API response shape — zero FE breakage on the response side.

### SP-3 — RU entries are not "translation duplicates", they are full alt-rows by `category`

RU and EN tasks share the same `category` strings (e.g., both have `SUBSCRIBE_TELEGRAM`). Seed idempotency relies on the composite `(category, language)` lookup. There is **no `@@unique([category, language])` constraint** in the schema [confirmed via Prisma schema reading + init migration `CREATE UNIQUE INDEX` lines] — only the seed code enforces uniqueness logically. This is fine for retire (drop both `language` column and the per-language entries simultaneously), but worth flagging: a future seed run between schema-drop and seed-rewrite could re-create rows under the wrong assumption.

### SP-4 — RU task TITLES, DESCRIPTIONS are visible RU strings, but project is English-only

The 14 RU seed entries contain Russian strings in `title` and `description` fields (e.g., "Подписаться на Telegram", "Подтвердите ваш email адрес"). Since project shipped English-only post-referral-серии, these strings have been **dead content** living on prod — never served (because FE always requests `/task/social/en` per SP-1). The RU rows are zombie data, not active-but-unused-translations. Confirms vestigial classification at content level, not just schema level.

### SP-5 — No prior migration attempted RU→EN duplicate consolidation

`grep -l "DailyTask\|SocialTask\|language" backend/prisma/migrations/*` returns only init migration + 5K + Phase 10 [confirmed]. No historical attempts to merge or remap RU entries. Clean slate for execution-phase decision.

### SP-6 — Surfaced ones pending SQL

Several candidates whose answer depends on prod data:
- Are there `language` values **other** than 'en'/'ru'? (Q3 in SQL set — must verify NULL, capitalization variants, typos.)
- Are the 11 RU user-history rows mentioned in original Phase 10 inventory still accurate? Maybe the number is higher, lower, or 0 now (3+ months elapsed).
- Are the affected users active? `completedAt` / `assignedDate` distribution will tell.

---

## Recommendation for execution phase

**Status: deferred to Gate 2** — full recommendation needs §4 numbers + §5 cascade scope.

Pre-Gate-1 directional notes (subject to revision after SQL results):

### Likely shape

**Single-PR is feasible** given that:
- FE has zero language read sites and a small surface (2 callers, both already passing nothing)
- Backend route changes are minimal (drop `:language` URL param, drop `where: { language }` clauses)
- Schema migration is mechanical (drop column + drop FK constraint variant)
- Seed.js rewrite is moderate (drop 14 RU entries, drop `language` field, adjust idempotency lookup to `category` only — needs `@@unique([category])` or app-level enforcement)

**Phased may be preferable if** SQL reveals significantly more `UserSocialTask`/`UserDailyTask` rows than the original 11 (e.g., active users with ongoing daily-task progress), in which case Phase 1 = drop RU data + tighten schema, Phase 2 = drop column + update routes/FE/seed.

### Backup procedure (will be finalized in Gate 2)

Standard Railway/PostgreSQL backup before execution:

```bash
# Owner-side, before merging execution PR:
# 1. Capture pre-migration snapshot (Railway dashboard → Database → Backups → "Create Backup Now")
#    OR via pg_dump if direct access available:
pg_dump $DATABASE_URL --schema-only --no-owner --no-acl > backup-schema-YYYY-MM-DD.sql
pg_dump $DATABASE_URL --data-only --no-owner --no-acl \
  --table='"SocialTask"' --table='"DailyTask"' \
  --table='"UserSocialTask"' --table='"UserDailyTask"' \
  > backup-task-data-YYYY-MM-DD.sql

# 2. Verify backup integrity (line count, file size > 0)
# 3. Store both files in safe location (NOT the repo)
# 4. Only then proceed with deploy.
```

This procedure also lets you reproduce the exact pre-execution state in case rollback is needed.

### Open questions for owner (will be expanded after SQL)

1. **Cascade procedure choice** — Option A (two-step DELETE, no schema change first), Option B (schema migration to `onDelete: Cascade` first), or Option C (raw SQL FK redefinition)? Each has different deploy-order implications.
2. **Schema cleanup scope** — drop only the `language` column, or also tighten task-uniqueness via new `@@unique([category])` constraint to replace seed idempotency lookup?
3. **Seed.js rewrite scope** — same 14 EN entries with `language` field removed, or also consolidate to one entry per category (no language at all in schema)?

---

## Appendix

### A.1 — git evidence

```
$ git log -1 --format="%H %s"
44fa7ff549e412eba3d1d3184ee8be84277e053b Merge pull request #386 from evgenii-yps/docs/parking-8-closure

$ grep -c "CLOSED as vestigial via investigation PR #385" CLAUDE.md
1
```

STEP 0 verified — PR #386 marker present on `main`.

### A.2 — full grep results

#### Backend task-language grep

```
$ grep -rn "language" backend/src/ --include="*.js" | grep -iE "task|social|daily"
backend/src/routes/task.js:7:// GET /v1/task/social/:language
backend/src/routes/task.js:8:router.get('/social/:language', authMiddleware, async (req, res) => {
backend/src/routes/task.js:10:    const { language } = req.params;
backend/src/routes/task.js:13:      where: { language },
backend/src/routes/task.js:38:// GET /v1/task/daily/:language
backend/src/routes/task.js:39:router.get('/daily/:language', authMiddleware, async (req, res) => {
backend/src/routes/task.js:41:    const { language } = req.params;
backend/src/routes/task.js:50:    const whereClause = { language };
```

#### Seed.js language entry summary

```
$ grep -oP "language: '[a-z]+'" backend/prisma/seed.js | sort | uniq -c
     14 language: 'en'
     14 language: 'ru'
```

#### Frontend task-language grep

```
$ grep -rn "language" src/ --include="*.js" --include="*.vue" | grep -iE "task|social|daily"
src/components/hud/HudSocialTasks.vue:2:     v2 design language: mirrors .training-tasks Daily Tasks panel  (← false-pos, code-comment)
src/core/services/taskService.js:16:export const getAllSocialTasksFromLocalAndAPI = async (language) => {
src/core/services/taskService.js:22:    getSocialTasksFromAPI(language);
src/core/services/taskService.js:26:export const getSocialTasksFromAPI = (language) => {
src/core/services/taskService.js:28:    fetchAllSocialTasks(language).then(async (loadedTasks) => {
src/core/services/taskService.js:37:export const fetchAllSocialTasks = async (language = 'en') => {
src/core/services/taskService.js:43:        const response = await apiClient.get(`/task/social/${language}`, {
src/core/services/taskService.js:53:export const getAllDailyTasksFromLocalAndAPI = async (language) => {
src/core/services/taskService.js:59:    getDailyTasksFromAPI(language);
src/core/services/taskService.js:63:export const getDailyTasksFromAPI = (language) => {
src/core/services/taskService.js:65:    fetchAllDailyTasks(language).then(async (loadedTasks) => {
src/core/services/taskService.js:74:export const fetchAllDailyTasks = async (language = 'en') => {
src/core/services/taskService.js:80:        const response = await apiClient.get(`/task/daily/${language}`, {
```

### A.3 — Prisma migration history (task-relevant excerpt)

```
$ ls backend/prisma/migrations/
20260312000000_init                                  ← created SocialTask + DailyTask + language col + FK constraints
20260316000000_add_pvp_fields
20260317000000_add_friends_system
20260319000000_add_persistent_user_fields
20260326000000_add_club_roles_and_limits
20260328000000_remove_days_in_club
20260328100000_add_referral_field
20260329000000_add_club_invite
20260330000000_add_clan_level_xp
20260330100000_add_clan_events
20260402000000_add_club_mode_agents
20260403000000_add_agent_auto_fight
20260403100000_add_agent_fight_mode
20260404000000_refactor_fight_club
20260405000000_agent_modules_optional
20260409000000_rename_club_to_clan
20260409120000_update_clan_achievement_descriptions
20260410000000_add_belt_system_to_agent
20260411000000_add_is_captain_to_agent
20260414000000_add_agent_research
20260428000000_add_daily_task_progress_and_scope     ← 5K — scope/progress/assignedDate (DID NOT touch language)
20260429000000_restore_is_captain_to_agent
20260508000000_email_data_cleanup
20260508010000_add_email_auth_tokens
20260515000000_drop_user_language_field              ← Phase 10 — dropped User.language only
migration_lock.toml
```

Relevant init-migration excerpts (truncated):

```sql
-- 20260312000000_init/migration.sql line 74-83:
CREATE TABLE "SocialTask" (
    ...
    "language" TEXT NOT NULL DEFAULT 'en',
    ...
    CONSTRAINT "SocialTask_pkey" PRIMARY KEY ("id")
);
-- line 97-107:
CREATE TABLE "DailyTask" (
    ...
    "language" TEXT NOT NULL DEFAULT 'en',
    ...
    CONSTRAINT "DailyTask_pkey" PRIMARY KEY ("id")
);
-- line 185-194: FK constraints
ALTER TABLE "UserSocialTask" ADD CONSTRAINT "UserSocialTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSocialTask" ADD CONSTRAINT "UserSocialTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SocialTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserDailyTask" ADD CONSTRAINT "UserDailyTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserDailyTask" ADD CONSTRAINT "UserDailyTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DailyTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

Phase 10 Stage A migration explicitly defers task-language scope (header comment in `20260515000000_drop_user_language_field/migration.sql`):

> Scope X (decision per PHASE10_STAGE_A_INVENTORY.md): only User.language. SocialTask.language + DailyTask.language deferred to a follow-up phase due to seed.js / route-deploy-order / RU-duplicate-data complexity.

### A.4 — Production SQL query results

**To be filled at Gate 2** once owner returns results from `docs/investigations/TASK_LANGUAGE_SQL_QUERIES.md`.

---

**End of Gate 1 report. Pending: owner SQL run → Gate 2 fill-in of §4 + §5 + §6 surfacing + §Recommendation + Appendix A.4.**
