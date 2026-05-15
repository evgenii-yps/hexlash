# Phase 10 — Stage A Inventory + STOP Gate

Шаг A.1 complete. Шаг A.2 STOP triggered — scope expansion beyond ТЗ-assumed "3 fields + helpers/routes". User decision required on 3 deploy-order / data-migration choice points before proceeding to Шаг A.3.

---

## STEP 0 result

| | |
|---|---|
| Branch | `claude/phase10-backend-language-retire` ✅ |
| HEAD SHA | `7a5f870` ✅ matches `origin/main` |
| Variant | clean fresh-branch start (γ-prevention) |
| Note | working tree reverted to `origin/main` content on branch switch — 8 files modified per system reminders. Expected — Phase 9 edits live on continue stack, return on Stage B switch back. |

---

## Шаг A.1 — Inventory

### A.1.1 — Prisma schema (3 fields, no relations/indexes/constraints)

| Model | Line | Field | Type |
|---|---|---|---|
| `User` | 28 | `language` | `String @default("en")` |
| `SocialTask` | 181 | `language` | `String @default("en")` |
| `DailyTask` | 204 | `language` | `String @default("en")` |

All 3 are plain columns. No FKs, no indexes, no constraints, no unique. Clean DROP COLUMN candidates.

### A.1.2 — Backend code references

**`backend/src/utils/helpers.js` (2 sites):**
- Line 29: `language: user.language,` — inside `formatUserResponse` output shape.
- Line 79: JSDoc for `formatUserPublicResponse` exclusion list mentions `"language"`.

**`backend/src/routes/task.js` (6 sites — both endpoints):**
- Line 7-8: `GET /v1/task/social/:language` route path + handler.
- Line 10: `const { language } = req.params;`
- Line 13: `where: { language },` — Prisma findMany filter.
- Line 38-39: `GET /v1/task/daily/:language` — same shape.
- Line 41: `const { language } = req.params;`
- Line 50: `const whereClause = { language };` — Prisma findMany filter.

**`backend/src/routes/user.js` (4 sites):**
- Line 165: `const allowedFields = ['name', 'login', 'language', 'skin', 'walletAddress'];` — inside `PUT /v1/user/edit`.
- Line 568: `const { language, settings } = req.body;` — inside `PUT /v1/user/settings`.
- Line 571: `if (language !== undefined) data.language = language;`
- Line 583: `res.json({ data: { language: updated.language, settings: updated.settings } });`

**`backend/src/routes/ai.js` (3 hits — OUT OF SCOPE):**
- Lines 97, 104, 286 — all are **AI prompt template strings** instructing Claude to "respond in language specified by locale". The `locale` is read from `req.body.locale` (lines 156, 307), validated against `SUPPORTED_LOCALES`, defaulting to `'en'`. **Independent of `User.language` Prisma column.** No DB dependency. No change needed.

**`backend/prisma/seed.js` ⚠ NEW FINDING (33 sites):**
- 12 SocialTask seed entries (6 EN + 6 RU) with `language: 'en'` / `language: 'ru'` field.
- 13 DailyTask seed entries (3 general EN + 3 general RU + 5 training EN + 2 missing → 5 training RU actually = 6 + 5 + 5 = let me recount: 3 general EN + 3 general RU + 5 training EN + 5 training RU = **16 daily**, actually 16 not 13).

  Recount: lines 66-68 (3 general EN), 69-71 (3 general RU), 73-77 (5 training EN), 78-82 (5 training RU) = **16 daily entries**. Plus 12 social = 28 task entries.

- 2 idempotency `findFirst` calls: `where: { category: task.category, language: task.language }` (lines 54, 87).

**Seed runs on every Railway boot** per `package.json` start script: `npx prisma migrate deploy && node prisma/seed.js && node src/index.js`. After column drop, seed would Prisma-error on every boot → server crash loop.

**`backend/tests/` (2 sites):**
- `helpers.test.js:29` — fixture `mockUser` has `language: 'ru'` field.
- `helpers.test.js:140` — assertion `assert.equal(result.language, undefined);` (tests that `formatUserPublicResponse` excludes language). Will become trivially true after column drop, but assertion itself doesn't break.
- `auth.test.js:226` — comment-only mention in `it('contract documented above', ...)` test (no runtime assertion on language).

### A.1.3 — Frontend code references (current state on `origin/main`, pre-Stage-B)

**`src/core/services/taskService.js` ⚠ DEPLOY-ORDER FINDING:**
- Lines 16, 26, 37, 53, 63, 74 — `language` parameter (default `'en'`) in 6 functions.
- **Lines 43, 80** — frontend ACTIVELY constructs and sends task URLs:
  ```js
  apiClient.get(`/task/social/${language}`, ...)
  apiClient.get(`/task/daily/${language}`, ...)
  ```
- So current frontend on `origin/main` (and on production Vercel right now) is hitting `/v1/task/social/en` and `/v1/task/daily/en` with the path segment.

**`src/core/models/masterModel.js`:**
- Line 16: `language = 'en'` (constructor default).
- Line 49: destructures `language` from `userData`.
- Line 56: `delete userData.language` — strips it before storing remainder.
- Line 64: passes `language` into model.
- **Result:** if backend drops `language` from response shape, frontend destructures undefined, deletes a non-existent key (no-op), defaults to `'en'`. **Safe** — backend response shape change does not break frontend masterModel.

---

## Шаг A.2 — STOP gate findings

Three points where ТЗ assumption diverges from reality. **All require user decision before Шаг A.3.**

### Finding 1 — `seed.js` cleanup (data + idempotency)

**Issue:** seed.js seeds 28 task rows. After `DROP COLUMN language`, all 28 `prisma.X.create({ data: { ..., language: 'XX' } })` calls Prisma-error on next deploy → server crash on Railway boot.

**Must do as part of Stage A:** strip `language: '...'` from all 28 task entries + update idempotency `where:` clauses.

**Side effect:** 11 RU-duplicate entries (categories same as EN counterparts) become idempotent dupes — second create call skips since first EN already exists. **Net effect: seed becomes English-only-by-design.** Acceptable per project English-only direction.

**But: existing prod database has RU rows already present.** After migration drops the `language` column, those 11 RU rows become "orphan-by-category" duplicates without language differentiation. Two sub-options:

- **1a:** Migration ONLY drops columns. RU rows persist in prod DB as title-only-different duplicates. Frontend `findMany()` returns ~22 rows (or however many actually exist). Frontend shows duplicate tasks until manual data cleanup.
- **1b:** Migration drops columns AND deletes RU rows from prod. FK relations: `UserSocialTask` / `UserDailyTask` have no cascade delete, so straight `DELETE FROM SocialTask WHERE language='ru'` fails on FK violation. Need either: (a) DELETE child UserSocialTask records first, (b) UPDATE child records to point to EN equivalents (preserves user completion history), or (c) accept data loss.

### Finding 2 — Frontend task-route deploy-order risk

**Issue:** ТЗ Шаг A.5 recommends Option 1 (drop `:language` path placeholder from routes) citing "фронт не передаёт `language`". **This is inaccurate for tasks:** frontend `taskService.js` ACTIVELY sends `/task/social/${language}` and `/task/daily/${language}` from production right now (pre-Stage-B).

**Deploy-order risk if Option 1 chosen:**
- Stage A deploys to Railway → backend drops `/:language` path placeholder.
- Pre-Stage-B Vercel still serves frontend that sends `/v1/task/social/en` URL.
- Backend route no longer matches → 404 on every task fetch → users see no tasks.
- Window = minutes-to-hours until Stage B Vercel deploy rolls out.

**Option 2 (defensive)** keeps `:language` path placeholder, accepts but ignores the value, drops the Prisma `where` filter. Backwards-compatible. Old frontend URLs continue to work. Stage B drops the param. Follow-up phase (Phase 11+) drops the placeholder once frontend confirmed deployed.

**Recommendation: Option 2 for Stage A deploy safety.** ТЗ recommendation Option 1 was based on inaccurate assumption — surfacing for explicit override decision.

### Finding 3 — Scope split candidate

ТЗ scope assumed 3-field drop = trivial. Reality:
- **`User.language`:** clean drop. helpers.js + user.js updates + 1 column drop + test update. Low risk.
- **`SocialTask.language` + `DailyTask.language`:** drag-in includes seed.js rewrite (28 entries), real-data RU duplicate problem (Finding 1), deploy-order route placeholder problem (Finding 2). Medium-to-high complexity depending on data-cleanup option.

**Option X (split):** Phase 10 ships only `User.language` drop. Tasks `language` columns deferred to a dedicated Phase 11. Cleaner scope per series methodology, follows precedent of Phase 1 sub-PR splitting and Phase 7-pre / 7-pre-2 / 7 layer-splitting.

**Option Y (full scope, defensive, 1a):** all 3 columns dropped, Option 2 defensive routes, seed.js rewritten, RU prod rows accepted as duplicates. Manual data cleanup separate post-merge task.

**Option Z (full scope, defensive, 1b):** all 3 columns dropped, Option 2 defensive routes, seed.js rewritten, migration includes data-cleanup SQL (DELETE child relations + DELETE RU rows). Cleanest data outcome but destructive — user task completion history for RU-localized tasks lost (or migrated to EN equivalents with FK update).

---

## Decision matrix

| Option | Scope | Risk | Complexity | Data outcome |
|---|---|---|---|---|
| **X** | `User.language` only | Low | Small Stage A | Tasks unchanged; deferred Phase 11 |
| **Y** | All 3 | Medium | Medium Stage A | Prod has dupe task rows; manual cleanup later |
| **Z** | All 3 + data migration | Medium-high | Larger Stage A | Cleanest; potential RU-task user history loss or FK rewrite |

In all 3 options: route defensive Option 2 (keep `:language` placeholder, drop filter).

---

## What I need from you

1. **Scope decision:** Option X / Y / Z.
2. **If Y or Z:** confirm route placeholder strategy (recommend Option 2 defensive — keep placeholder, drop filter; Option 1 risks deploy-window 404s).
3. **If Z:** preferred data-cleanup approach — accept RU user task history loss, OR migrate UserSocialTask/UserDailyTask FKs to EN equivalents (preserves history).

Awaiting your direction. Not touching files until you decide.

---

## Files held — no edits applied

- `backend/prisma/schema.prisma` — unchanged
- `backend/prisma/seed.js` — unchanged
- `backend/src/utils/helpers.js` — unchanged
- `backend/src/routes/task.js` — unchanged
- `backend/src/routes/user.js` — unchanged
- `backend/tests/helpers.test.js` — unchanged
- No Prisma migration generated yet
