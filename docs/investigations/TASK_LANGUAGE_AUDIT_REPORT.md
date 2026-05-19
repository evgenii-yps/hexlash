# Task-language Retire — Investigation Report

**Date:** 2026-05-18
**Branch:** `claude/investigate-task-language`
**HEAD SHA:** `44fa7ff` (PR #386 parking #8 closure merged — STEP 0 verified via `grep "CLOSED as vestigial via investigation PR #385" CLAUDE.md` → 1 hit)
**Scope:** Read-only audit. No code changes. Single deliverable.
**Trigger:** CLAUDE.md parking item #11 (Phase 10 Stage A deferred): "SocialTask.language + DailyTask.language columns + task.js route filters + seed.js rewrite + RU-duplicate prod data cleanup. Backend extension series." Plus parking item #12 (decision needed before Phase 11 executes: 11 RU-task user-history rows — accept loss vs migrate FKs).

---

## TL;DR

`SocialTask.language` + `DailyTask.language` are **fully vestigial at every level**: column data, server-side filter logic, frontend transport chain, and — confirmed at Gate 2 via owner-executed Railway SQL — **production user-task tables are empty**. `UserSocialTask` and `UserDailyTask` hold **0 rows** total on prod (not just the RU subset). No user-history to migrate, no cascade impact to manage, no FK-constraint procedure required. The retire is a clean single-PR operation: drop 14 RU seed entries + drop `language` column + drop `:language` URL param + drop FE service-layer default.

**FK execution finding (downgraded from critical to nice-to-know):** `UserSocialTask.taskId → SocialTask.id` and `UserDailyTask.taskId → DailyTask.id` use **`ON DELETE RESTRICT`** at SQL level (init migration lines 188 + 194). This **would have** required a procedural workaround if user-task tables held data, but Gate 2 confirmed they're empty system-wide [confirmed], so `DELETE FROM "SocialTask" WHERE language = 'ru'` will succeed without FK violation. Owner's "DELETE с cascade" decision is effectively a no-op (nothing to cascade onto).

**Production database numbers** (Gate 2 — owner-executed Railway SQL, 2026-05-18):
- `SocialTask`: 12 rows total (6 EN + 6 RU) [confirmed via Q1+Q10]
- `DailyTask`: 16 rows total (8 EN + 8 RU) [confirmed via Q2+Q10]
- No surprise `language` values — only `'en'` and `'ru'` [confirmed via Q3]
- `UserSocialTask`: **0 rows total** (not 0 RU — 0 overall) [confirmed via Q10]
- `UserDailyTask`: **0 rows total** [confirmed via Q10]
- All 14 RU task definitions have zero user completions, zero in-progress records [confirmed via Q5+Q7]

**Parallel-system check (§6): NO parallel system found.** Three independent grep-based checks (alternative backend writers, alternative FE dispatch sites, recent prod wipe via migrations) all returned negative. `UserSocialTask`/`UserDailyTask` are the only persistent representation of task completion in the code. The empty state on prod is genuine (low-traffic testhexlash environment, or v2 social/daily task system simply pre-adoption) — not the result of a wipe or routing to alternative tables.

**Carry-forward findings from Gate 1:**
- Seed.js writes **28 task definitions** (14 EN + 14 RU) — verified via `grep -oP "language: '[a-z]+'"` [confirmed].
- Vuex `task/fetchAllSocialTasks` + `task/fetchAllDailyTasks` actions accept **no `language` argument** [confirmed]. Both v2 callsites (`HudSocialTasks.vue:84`, `HudTraining.vue:129`) dispatch with zero payload.
- Inline `tasks.map(...)` response shape in `task.js:21-29`/:70-83 **drops `task.language` from API response** [confirmed].
- `SocialTaskModel` + `DailyTaskModel` have **no `language` constructor field** [confirmed].

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

[confirmed via owner-executed read-only SELECT queries on Railway dashboard against production database, 2026-05-18; full raw output in Appendix A.4]

### Counts table

| Table | Total rows | EN rows | RU rows | Notes |
|---|---|---|---|---|
| `SocialTask` | **12** | 6 | 6 | Seed entries: 1:1 EN-to-RU pairing per category [confirmed via Q1] |
| `DailyTask` | **16** | 8 | 8 | Seed entries: 1:1 EN-to-RU pairing per category [confirmed via Q2] |
| `UserSocialTask` | **0** | 0 | 0 | Empty — no user has ever completed any social task on this prod environment [confirmed via Q4+Q10] |
| `UserDailyTask` | **0** | 0 | 0 | Empty — no user has any daily-task progress or completion on this prod [confirmed via Q6+Q10] |

### Language-value surprise check (Q3)

[confirmed via Q3 returning zero rows]: no task entries exist with `language IS NULL` or `language NOT IN ('en', 'ru')`. The column holds only the two expected values. No typos, no other locale codes, no NULLs.

### Per-task RU breakdown

**SocialTask RU (6 rows)** [confirmed via Q5]: all 6 rows show `completions = 0` and `unique_users = 0`. No user has ever interacted with any RU SocialTask entry. Categories covered: SUBSCRIBE_TELEGRAM, SUBSCRIBE_X, SUBSCRIBE_YOUTUBE, SUBSCRIBE_DISCORD, SUBSCRIBE_INSTAGRAM, TASK_CONFIRM_EMAIL — all mirror the corresponding EN entries.

**DailyTask RU (8 rows)** [confirmed via Q7]: all 8 rows show `total_rows = 0`, `completed_rows = 0`, `in_progress_rows = 0`. Categories: FIGHT_X_BATTLES, WIN_X_BATTLES, INVITE_FRIEND (scope=general) + HIT_BAG_X_TIMES, LAND_X_COMBOS, SPEND_FULL_ENERGY, TRAIN_X_MINUTES, EARN_X_TAPS (scope=training).

### Freshness distribution (Q8 + Q9)

Both freshness queries returned **zero rows**, consistent with `UserSocialTask` and `UserDailyTask` being completely empty. No history to date-bucket [confirmed].

### Key inference

The original Phase 10 Stage A inventory claim of "11 RU-duplicate task rows with FK relations in `UserSocialTask` / `UserDailyTask` (user-history)" is **stale and superseded** by this Gate 2 audit. Whatever the count was at Phase 10 estimation time (≈3 months ago), the current state is **zero user-task rows of any language**. Owner's parking item #12 ("11 RU-task user-history rows — accept loss vs migrate FKs") is **moot** — there are no rows to either accept-loss or migrate.

### Why the tables are empty (working hypothesis, NOT confirmed)

Three plausible explanations, ranked by likelihood:

1. **Low-traffic testhexlash environment** — the production database queried may correspond to the `test.hexlash.com` deployment rather than the user-facing `hexlash.com`. With low organic traffic and v2-system rollout in April 2026, even a populated user base could have left these tables sparse, but zero is still surprising for active production. [unverified — owner can confirm via Railway environment selection or by checking other user-related table row counts]
2. **V2 task system pre-adoption** — `HudSocialTasks.vue` (Sub-epic 5I, April 2026) and HudTraining's daily-task panel (Sub-epic 5K, April 2026) are recent surface area additions. Users may not have reached the relevant UI flows in volume, or task-completion buttons may have had reliability issues. [unverified]
3. **Earlier informal data clear** — owner or someone with DB access could have manually truncated the tables at some point (e.g., during 5K deploy migration troubleshooting) without committing a migration. Check C below confirms NO migration-based wipe; ad-hoc DB operations remain possible. [unverified]

None of these affect the retire plan — the table contents are zero regardless of explanation.

---

## Cascade impact analysis

[confirmed via §1 schema reading + §4 prod counts]

### Schema-level facts (unchanged from Gate 1)

| Element | onDelete (Prisma schema) | onDelete (SQL constraint) | Implication |
|---|---|---|---|
| `UserSocialTask.taskId → SocialTask.id` | NOT specified | `ON DELETE RESTRICT` (init migration line 188) | Would block DELETE on SocialTask if referenced |
| `UserDailyTask.taskId → DailyTask.id` | NOT specified | `ON DELETE RESTRICT` (init migration line 194) | Would block DELETE on DailyTask if referenced |
| `UserSocialTask.userId → User.id` | NOT specified | `ON DELETE RESTRICT` (init migration line 185) | Irrelevant — no User deletion planned |
| `UserDailyTask.userId → User.id` | NOT specified | `ON DELETE RESTRICT` (init migration line 191) | Irrelevant |

### Real impact

Because `UserSocialTask` and `UserDailyTask` are **empty** [confirmed via §4 Q10], the `ON DELETE RESTRICT` constraints will not fire. `DELETE FROM "SocialTask" WHERE language = 'ru'` and `DELETE FROM "DailyTask" WHERE language = 'ru'` will both succeed cleanly, deleting 6 + 8 = 14 rows total.

**No two-step DELETE, no schema migration to Cascade, no raw SQL FK redefinition required.** Owner's "DELETE с cascade" decision is preserved as documented intent for the case of future user-task references appearing between audit and execution (extremely unlikely given current Vuex-action-without-language-arg state, but the safety guard remains): see §7 Recommendation for a defensive pre-DELETE re-check.

### Rows that will be deleted

| Source table | Filter | Row count | Notes |
|---|---|---|---|
| `SocialTask` | `WHERE language = 'ru'` | 6 | All have zero user references [confirmed via Q5] |
| `DailyTask` | `WHERE language = 'ru'` | 8 | All have zero user references [confirmed via Q7] |
| `UserSocialTask` | (via FK cascade or two-step) | 0 | Empty regardless |
| `UserDailyTask` | (via FK cascade or two-step) | 0 | Empty regardless |
| **Total** | — | **14** | Plus implicitly: 14 EN rows survive untouched |

---

## Surprise findings

### SP-1 (Gate 1) — Vuex `task/fetchAllSocialTasks` and `task/fetchAllDailyTasks` accept no language argument

Vuex action signature `async fetchAllSocialTasks({commit})` has no `language` slot. Both v2 consumer callsites (`HudSocialTasks.vue:84`, `HudTraining.vue:129`) dispatch without payload. The service-layer `language` parameter chain is **dead from the Vuex layer outward** — `language` is `undefined` until the bottom `fetchAllSocialTasks(language = 'en')` default kicks in. Removing the parameter from the service signatures (along with the backend route param) would be a no-op for callers. [confirmed]

### SP-2 (Gate 1) — `formatTaskResponse` is inline and already strips `language`

No `formatTaskResponse` helper exists. Both task list endpoints inline `tasks.map((task) => ({ id, title, description, link, tokens, isCompleted, category }))` (and analogous shape for daily tasks). **`language` is already absent from the response body** [confirmed]. Dropping the column on backend won't change API response shape — zero FE breakage on the response side.

### SP-3 (Gate 1) — RU entries are full alt-rows by `category`, not translation duplicates

RU and EN tasks share the same `category` strings (both have `SUBSCRIBE_TELEGRAM`, etc.). Seed idempotency relies on the composite `(category, language)` lookup. There is **no `@@unique([category, language])` constraint** in the schema [confirmed via Prisma schema reading + init migration index list] — only seed-time code enforces uniqueness logically. Fine for retire (drop both `language` column and per-language entries simultaneously), but flag: a future seed run between schema-drop and seed-rewrite could re-create rows under the wrong assumption.

### SP-4 (Gate 1) — RU task TITLES/DESCRIPTIONS are visible RU strings, but project is English-only

The 14 RU seed entries contain Russian strings in `title`/`description` fields. Since project shipped English-only post-referral-серии and FE always requests `/task/social/en` (per SP-1), these strings have been **dead content** living on prod — never served. Zombie data, not active-but-unused-translations.

### SP-5 (Gate 1) — No prior migration attempted RU→EN duplicate consolidation

`grep -l "DailyTask\|SocialTask\|language" backend/prisma/migrations/*` returns only init migration + 5K + Phase 10 [confirmed]. No historical attempts to merge or remap RU entries. Clean slate for execution-phase decision.

### SP-6 (Gate 2 — **THE BIG ONE**) — User-task tables are empty system-wide

[confirmed via Q4+Q6+Q10] `UserSocialTask` and `UserDailyTask` hold zero rows in production. Not just the RU subset — the entire tables. This completely changes the execution shape from "carefully migrate or accept-loss of 11 RU user-history rows" (Phase 10 deferral assumption) to "simply DELETE 14 task definition rows; no user-row implications". See §6 parallel-system check below for the verification chain that confirmed this is not the result of routing to alternative tables.

### SP-7 (Gate 2) — Parallel-system check (no parallel system found)

Owner asked at Gate 2 boundary: "could there be a parallel task-completion system writing to tables other than `UserSocialTask`/`UserDailyTask`?" Three independent checks were run:

#### Check A — alternative backend write paths

[confirmed via 4 grep queries against `backend/src/`]

**Result: only `backend/src/routes/task.js` writes to UserSocialTask / UserDailyTask.**

| Site | Operation | Path |
|---|---|---|
| `task.js:109` | `prisma.userSocialTask.create` | POST /task/complete/:taskId — social branch |
| `task.js:134` | `prisma.userDailyTask.create` | POST /task/complete/:taskId — daily branch |
| `task.js:188` | `prisma.userDailyTask.create` | POST /task/daily/:id/progress — lazy allocation (5K) |
| `task.js:211/219` | `prisma.userDailyTask.update` + `prisma.user.update` | POST /task/daily/:id/progress — atomic transaction |

`prisma.user.update` calls at `task.js:113, 138, 219` increment `User.balance` after task completion. **NO** task-completion state is stored on `User` itself (no `subscribedToDiscord`, `joinedTelegram`, or similar flag-fields exist anywhere in the schema). The only persistence representation of "user X completed task Y" is a row in `UserSocialTask` or `UserDailyTask`. [confirmed]

**`awardAchievement`/`UserAchievement` are NOT used for social/daily task completion.** Existing `UserAchievement` writes (fight.js, pvpCombatEngine.js, etc.) target unrelated achievement categories (FIGHT_MASTER, PROJECT_MAYHEM, etc.) — not the SUBSCRIBE_* / FIGHT_X_BATTLES / HIT_BAG_X_TIMES task categories. [confirmed via `grep -rn "awardAchievement\|UserAchievement\|achievements\." backend/src/ --include="*.js" | grep -iE "task|social|daily|subscribe"` returning empty]

**Other `User.update` callsites** (clan.js, retirementService.js, handler.js:317 punch batch, user.js misc, auth.js referral) — all unrelated to social/daily task completion [confirmed].

#### Check B — alternative frontend dispatch sites

[confirmed via grep across `src/`]

**Result: all task-completion dispatches funnel through `taskService` and standard `/v1/task/*` endpoints.**

| FE site | Dispatch | Backend endpoint hit |
|---|---|---|
| `HudSocialTasks.vue:123` | `task/updateSocialTask` → `taskService.sendUpdateSocialTask` → `completeTaskApiCall(taskId)` | POST `/v1/task/complete/:taskId` |
| `SubscribeModal.vue:58` (emits `'complete'` to `HudSocialTasks.onTaskComplete`) | Same chain as above | POST `/v1/task/complete/:taskId` |
| `useClickToHit.js:98,99,102,107` (training tap/combo/energy/earn-taps progress) | `task/incrementDailyProgress` → `taskService.incrementDailyProgress` | POST `/v1/task/daily/:id/progress` |
| `useTrainingState.js:98` (session-time training progress) | Same | POST `/v1/task/daily/:id/progress` |
| `webSocketState.js:159,162` (server-push inbound) | `task/receivedSocialTask`, `task/receivedDailyTask` | **NO HTTP write back** — these are WS-inbound merges only, the WS message body is committed to Vuex local state via `addSocialTask`/`addDailyTask` mutation. No bypass route exists. |

**NO `apiClient` direct call bypassing `taskService` in any task-related component** [confirmed]. **NO parallel Vuex module** like `socialState` / `referralState` / `subscriptionState` exists [confirmed via `ls src/core/state/modules/`].

#### Check C — recent prod data wipe via migrations

[confirmed via `ls -lat backend/prisma/migrations/` + `grep -rn "TRUNCATE\|DELETE FROM" backend/prisma/migrations/`]

**Result: NO migration has performed bulk data deletion on `UserSocialTask` or `UserDailyTask`.**

| Migration | Date | Relevant body |
|---|---|---|
| `20260312000000_init` | 2026-03-12 | CREATE TABLE for both User-task tables |
| `20260428000000_add_daily_task_progress_and_scope` | 2026-04-28 | 5K: ADD COLUMN scope/progress/assignedDate to UserDailyTask, DROP/CREATE INDEX. **Did not delete data.** |
| `20260508000000_email_data_cleanup` | 2026-05-08 | ALTER TABLE User — strictly User-table scope, not task tables |
| `20260515000000_drop_user_language_field` | 2026-05-15 | Drop User.language column — strictly User-table scope |

**`grep -rn "TRUNCATE\|DELETE FROM" backend/prisma/migrations/` returns empty** [confirmed]. There is no migration-recorded bulk data deletion on User-task tables.

This leaves three possibilities for the empty state:
- a. Tables have always been empty in this particular environment (low traffic / pre-adoption — most likely)
- b. Tables were manually wiped via ad-hoc DB operations (not via migrations) — possible but outside the audit's evidence scope
- c. Tables are being populated and reset by `dailyTaskCron` (`backend/src/services/dailyTaskCron.js:24` calls `prisma.userDailyTask.deleteMany({...})` for training-scope daily reset at midnight UTC) — but the cron only deletes; it never creates, so this would account for daily-task table starting empty each UTC day but does NOT explain `UserSocialTask` being empty (social tasks are not subject to daily reset).

#### Verdict

**No parallel system exists.** `UserSocialTask` + `UserDailyTask` are the only persistent representation of social- and daily-task completion in the entire codebase. The empty state on prod is genuine. Whether the cause is low traffic, pre-adoption, or ad-hoc data clear is unknown but does not affect the retire plan — there is nothing to migrate or cascade onto.

---

## Recommendation for execution phase

[Gate 2 final — based on confirmed §4 + §5 + §6 findings]

### Shape: single PR

**Strongly recommended single-PR.** Phasing offered no benefit given:
- Zero user-row dependency on RU task entries [§4 confirmed]
- Zero FE language read sites and a small surface (2 callers, both already passing nothing) [§3 confirmed]
- Inline backend response shape already drops `language` [SP-2 confirmed]
- No parallel system implications [§6 confirmed]

### Execution sequence (single PR)

```
1. Pre-flight verify (mandatory immediately before merge):
   Re-run the §4 Q4+Q6+Q10 SQL on prod via Railway dashboard.
   If UserSocialTask or UserDailyTask is no longer 0 (e.g., real user activity
   occurred between audit and execution), STOP and re-evaluate the cascade
   procedure. Otherwise proceed.

2. Backup (procedure below).

3. Schema migration:
   - Drop `language` column from SocialTask: ALTER TABLE "SocialTask" DROP COLUMN "language";
   - Drop `language` column from DailyTask: ALTER TABLE "DailyTask" DROP COLUMN "language";
   - (Optional, if owner accepts SP-3 carry-over) — Add `@@unique([category])` on
     SocialTask and `@@unique([category, scope])` on DailyTask to make seed
     idempotency lookup work after the language pivot drops. WITHOUT this,
     seed.js must use a different idempotency key (see step 5).

4. Backend route + filter cleanup:
   - task.js: drop `:language` URL param from both GET endpoints. Routes become
     `GET /v1/task/social` and `GET /v1/task/daily`.
   - Drop `const { language } = req.params` (lines 10, 41) and `where: { language }` /
     `whereClause = { language }` (lines 13, 50). The whereClause for daily simplifies
     to `{ scope }` (optional).

5. Seed.js cleanup:
   - Drop all 14 RU entries (lines 44-49, 69-71, 78-82).
   - Drop `language: 'en'` from remaining 14 EN entries.
   - Replace idempotency `findFirst({ where: { category, language } })` (lines 54, 87)
     with `findFirst({ where: { category } })` (or with `where: { category, scope }` for
     DailyTask, depending on step 3 decision).
   - Drop the `language` field from the in-memory arrays.

6. Frontend cleanup:
   - taskService.js: drop the `language` parameter from `fetchAllSocialTasks`,
     `fetchAllDailyTasks`, `getAllSocialTasksFromLocalAndAPI`,
     `getAllDailyTasksFromLocalAndAPI`, `getSocialTasksFromAPI`, `getDailyTasksFromAPI`.
   - URL templates: `\`/task/social/${language}\`` → `'/task/social'`; same for daily.

7. Pre-DELETE cleanup (run after schema migration on prod):
   - Actually, if the schema migration in step 3 drops the language column,
     RU rows become indistinguishable from EN rows (they all collapse to
     unfiltered). At that point the RU rows have duplicate category strings
     with the EN rows. So DELETE must happen BEFORE the schema migration:

   Revised step order:
     3a. DELETE FROM "SocialTask" WHERE language = 'ru';
     3b. DELETE FROM "DailyTask" WHERE language = 'ru';
     3c. THEN run the column-drop migration.

   This means the migration file must contain the DELETE statements followed by
   the ALTER TABLE statements, OR the DELETE runs via a separate migration that
   sequences before the column-drop migration.

8. Deploy order (Railway):
   - This is a backend+schema change. Per CLAUDE.md branch strategy, the
     execution branch must be cherry-picked or branched from main with the
     backend changes, since visual-migration branches don't auto-deploy backend.
   - Frontend changes can ship on the same PR if it lands directly to main, OR
     after backend deploys if a deploy-window guarantee is preferred.
```

### Backup procedure

Owner-side, before merging the execution PR:

```bash
# Railway dashboard → your prod DB → "Backups" tab → "Create Backup Now"
# This produces a Railway-managed point-in-time snapshot that can be restored
# via the dashboard if needed. Note the backup timestamp.
```

Optional supplementary pg_dump (if direct DB URL is available):

```bash
# Schema + task-related data only (small files, fast)
pg_dump $DATABASE_URL --schema-only --no-owner --no-acl > backup-schema-YYYY-MM-DD.sql
pg_dump $DATABASE_URL --data-only --no-owner --no-acl \
  --table='"SocialTask"' --table='"DailyTask"' \
  --table='"UserSocialTask"' --table='"UserDailyTask"' \
  > backup-task-data-YYYY-MM-DD.sql

# Verify integrity:
wc -l backup-task-data-YYYY-MM-DD.sql   # >0 lines expected
ls -lh backup-task-data-YYYY-MM-DD.sql  # >0 bytes expected
```

Store backup files outside the repo (e.g., local disk, secure cloud storage). Do not commit to git.

### Defensive edge cases

| Risk | Mitigation |
|---|---|
| User activity between audit and execution populates `UserSocialTask`/`UserDailyTask` with RU references | Pre-flight Q4+Q6+Q10 re-check immediately before merge (step 1 above). Trivial to run via the existing SQL queries file. |
| Concurrent seed.js run with stale code re-creates RU entries after the migration | Disable seed during deploy window (likely already done — verify via Railway logs). Confirm post-migration seed.js code drops RU entries entirely. |
| Frontend deploys with stale `:language` URL param before backend route accepts the new format | Backend route can accept both `/task/social` AND `/task/social/:language` for one deploy window via Express route ordering (`router.get('/social', ...)` then `router.get('/social/:language', ...)`). After FE deploys, remove the legacy route. **OR** ship both in one PR to a single auto-deploy environment. |
| Schema migration runs but RU rows still in DB (out-of-order in the migration body) | Order matters — DELETE must happen BEFORE the column drop (see step 7). Test on a staging copy if available. |

### Open questions for owner (Gate 2 final)

1. **Schema idempotency choice** (SP-3 + step 3) — drop `language` column only and rely on seed-time logic with `@@unique([category])` enforcement, or drop language without adding any new uniqueness constraint (and rely solely on seed.js `findFirst({ category })` logic)? The former is safer; the latter is less invasive.
2. **DailyTask uniqueness scope** — should `DailyTask` get `@@unique([category])` or `@@unique([category, scope])`? Both `general` and `training` scopes share some category names (e.g., `INVITE_FRIEND` is general; `HIT_BAG_X_TIMES` is training — no observed cross-scope collision in seed.js). Owner's call.
3. **Empty user-task tables (SP-6)** — is the prod environment queried in §4 the actual user-facing production, or a staging snapshot? If actual prod with users, the zero-row state may warrant a separate investigation (low-priority but interesting given v2 system has been live since April 2026). Suggested but not required before retire executes.
4. **Backend deploy chain** — execution PR is FE+BE. Per CLAUDE.md branch strategy convention (Phase 11 series candidate; cherry-pick to `main` from continue stack for backend changes), execute as a single PR directly to `main`, not from any visual-migration continue stack? Owner confirm.

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

[confirmed via owner-executed Railway dashboard SQL run on 2026-05-18 against prod database; raw screenshots in chat, textual summary below from owner-provided table; full queries shipped in `docs/investigations/TASK_LANGUAGE_SQL_QUERIES.md`]

**Q1 — SocialTask definitions by language**

```
 language | rows
----------+------
 en       |    6
 ru       |    6
(2 rows)
```

**Q2 — DailyTask definitions by language**

```
 language | rows
----------+------
 en       |    8
 ru       |    8
(2 rows)
```

**Q3 — Any unexpected language values**

```
 table_name | language | rows
------------+----------+------
(0 rows)
```

**Q4 — UserSocialTask rows tied to RU SocialTask definitions**

```
 total_user_rows | unique_users | earliest_completed | latest_completed
-----------------+--------------+--------------------+------------------
               0 |            0 | NULL               | NULL
(1 row)
```

**Q5 — UserSocialTask breakdown per RU task definition**

```
 task_id | category            | title                  | completions | unique_users
---------+---------------------+------------------------+-------------+--------------
 [uuid]  | TASK_CONFIRM_EMAIL  | Подтвердить Email      |           0 |            0
 [uuid]  | SUBSCRIBE_TELEGRAM  | Подписаться на Telegram|           0 |            0
 [uuid]  | SUBSCRIBE_X         | Подписаться на X       |           0 |            0
 [uuid]  | SUBSCRIBE_YOUTUBE   | Подписаться на YouTube |           0 |            0
 [uuid]  | SUBSCRIBE_DISCORD   | Присоединиться к Discord|          0 |            0
 [uuid]  | SUBSCRIBE_INSTAGRAM | Подписаться на Instagram|          0 |            0
(6 rows — all completions = 0, all unique_users = 0)
```

**Q6 — UserDailyTask rows tied to RU DailyTask definitions**

```
 total_user_rows | unique_users | completed_rows | in_progress_rows | earliest_assigned | latest_assigned | earliest_completed | latest_completed
-----------------+--------------+----------------+------------------+-------------------+-----------------+--------------------+------------------
               0 |            0 |              0 |                0 | NULL              | NULL            | NULL               | NULL
(1 row)
```

**Q7 — UserDailyTask breakdown per RU task definition**

```
 task_id | category          | scope    | title                            | total_rows | completed_rows | in_progress_rows | unique_users
---------+-------------------+----------+----------------------------------+------------+----------------+------------------+--------------
 [uuid]  | FIGHT_X_BATTLES   | general  | Проведи 3 боя                    |          0 |              0 |                0 |            0
 [uuid]  | WIN_X_BATTLES     | general  | Выиграй 2 боя                    |          0 |              0 |                0 |            0
 [uuid]  | INVITE_FRIEND     | general  | Пригласи друга                   |          0 |              0 |                0 |            0
 [uuid]  | HIT_BAG_X_TIMES   | training | Ударь грушу 500 раз              |          0 |              0 |                0 |            0
 [uuid]  | LAND_X_COMBOS     | training | Сделай 5 комбо                   |          0 |              0 |                0 |            0
 [uuid]  | SPEND_FULL_ENERGY | training | Потрать всю энергию              |          0 |              0 |                0 |            0
 [uuid]  | TRAIN_X_MINUTES   | training | Тренируйся 5 минут               |          0 |              0 |                0 |            0
 [uuid]  | EARN_X_TAPS       | training | Заработай 500 тапов за сессию    |          0 |              0 |                0 |            0
(8 rows — all zero, owner reports page 1 visible showed 5; all 8 confirmed zero per summary)
```

**Q8 — Freshness distribution (RU UserSocialTask completion dates)**

```
 month_bucket | completions
--------------+-------------
(0 rows — Query returned no rows)
```

**Q9 — Freshness distribution (RU UserDailyTask assigned dates)**

```
 month_bucket | total_rows | completed_rows
--------------+------------+----------------
(0 rows)
```

**Q10 — Sanity check: total task tables size**

```
 table_name     | rows
----------------+------
 DailyTask      |   16
 SocialTask     |   12
 UserDailyTask  |    0
 UserSocialTask |    0
(4 rows)
```

### A.5 — Gate 2 check raw outputs (parallel-system audit)

**Check A — backend write-path grep (positive results)**

```
$ grep -rn "awardAchievement\|UserAchievement\|achievements\." backend/src/ --include="*.js" | grep -iE "task|social|daily|subscribe"
(empty — no hits)
```

```
$ grep -rn "completedAt\|isCompleted\|markComplete" backend/src/ --include="*.js"
backend/src/services/pvpCombatEngine.js:735:          isCompleted: true,     (← fight context, not task)
backend/src/websocket/handler.js:464:              isCompleted: true,        (← fight context, not task)
backend/src/routes/task.js:27:      isCompleted: task.users.length > 0,
backend/src/routes/task.js:77:        isCompleted: userTask ? !!userTask.completedAt : false,
backend/src/routes/task.js:128:        where: { userId: req.userId, taskId, completedAt: { not: null } },
backend/src/routes/task.js:135:        data: { userId: req.userId, taskId, completedAt: new Date() },
backend/src/routes/task.js:194:    if (userTask.completedAt) {
backend/src/routes/task.js:200:          isCompleted: true,
backend/src/routes/task.js:215:          completedAt: justCompleted ? new Date() : null,
backend/src/routes/task.js:232:        isCompleted: !!updated.completedAt,
backend/src/routes/fight.js:72:        isCompleted: true,                    (← fight context, not task)
```

All task-related `completedAt`/`isCompleted` hits are in `task.js`. The 3 outliers (`pvpCombatEngine.js`, `handler.js`, `fight.js`) are fight-context, not task-context [confirmed].

```
$ grep -rn "prisma\.user\.update" backend/src/ --include="*.js"
[28 hits across clan.js, retirementService.js, handler.js, user.js, auth.js, task.js, routes/clan.js]
```

Of these 28 `prisma.user.update` callsites, only **3 are task-context** (`task.js:113, 138, 219`) and all of them increment `balance` after task completion in the same transaction as the UserSocialTask/UserDailyTask create. None store task-completion state on `User` itself.

**Check B — frontend dispatch grep**

```
$ grep -rn "dispatch.*task\|dispatch.*social\|dispatch.*daily" src/ --include="*.js" --include="*.vue"
src/components/hud/HudSocialTasks.vue:84:    store.dispatch('task/fetchAllSocialTasks');
src/components/hud/HudSocialTasks.vue:123:    store.dispatch('task/updateSocialTask', updated);
src/components/hud/HudTraining.vue:129:    store.dispatch('task/fetchAllDailyTasks');
src/scene/interaction/useTrainingState.js:98:      store.dispatch('task/incrementDailyProgress', { kind: 'session_time', amount: 300 });
src/scene/interaction/useClickToHit.js:98:    store.dispatch('task/incrementDailyProgress', { kind: 'tap', amount: 1 });
src/scene/interaction/useClickToHit.js:99:    store.dispatch('task/incrementDailyProgress', { kind: 'earn_taps_threshold', amount: gain });
src/scene/interaction/useClickToHit.js:102:      store.dispatch('task/incrementDailyProgress', { kind: 'combo', amount: 1 });
src/scene/interaction/useClickToHit.js:107:      store.dispatch('task/incrementDailyProgress', { kind: 'energy_full', amount: 60 });
src/core/state/modules/webSocketState.js:159:                    await store.dispatch('task/receivedSocialTask', taskModel);
src/core/state/modules/webSocketState.js:162:                    await store.dispatch('task/receivedDailyTask', taskModel);
```

All task dispatches funnel through the `task/*` Vuex namespace. `receivedSocialTask`/`receivedDailyTask` are inbound from WS — they only commit to local state (`addSocialTask`/`addDailyTask` mutations in `taskState.js:35-58`), no HTTP write [confirmed via reading `taskState.js:100-119`].

**Check C — migration history wipe check**

```
$ ls -lat backend/prisma/migrations/ | head -8
total 112
20260429000000_restore_is_captain_to_agent
20260508000000_email_data_cleanup
20260508010000_add_email_auth_tokens
20260515000000_drop_user_language_field
20260403100000_add_agent_fight_mode
...
$ grep -rn "TRUNCATE\|DELETE FROM" backend/prisma/migrations/
(empty — no hits)
```

No migration body contains a bulk delete operation on any task table [confirmed]. The `dailyTaskCron.js:24` runtime DELETE is per-day reset for training scope only; it cannot account for `UserSocialTask` being empty (social tasks are not subject to daily reset).

---

**End of Gate 2 report. All sections complete. Awaiting PR open + owner review.**
