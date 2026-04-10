---
name: hexlash-api
description: Backend API Hexlash — Express, Prisma, JWT, миграции, middleware, валидация. Триггерится на API, endpoint, route, Express, Prisma, schema, migration, JWT, auth, middleware, validation, rate limit, backend, /v1/, req, res, model, database, PostgreSQL, security, CORS. Грузить вместе с hexlash-dev. Для WS — hexlash-websocket. Для деплоя — hexlash-deploy. Для AI — hexlash-ai.
---

# hexlash-api — Backend API

## Главное правило

Backend прошёл **security hardening**. Перед изменениями в auth, env, validation или Prisma — прочитать CLAUDE.md "Security Hardening". Не откатывать защитные меры. Новая ручка = auth middleware по умолчанию.

---

## Стек

Express 4, Prisma 5 (PostgreSQL), JWT, bcryptjs, ws (shared HTTP), Multer, express-rate-limit, @anthropic-ai/sdk, helmet

---

## Структура

```
/backend/src/
  index.js           — Express + WebSocket entry, CORS, health checks
  config.js          — все константы и env (ИСТОЧНИК ПРАВДЫ)
  lib/prisma.js      — Prisma singleton (использовать ВСЕГДА)
  routes/            — 10 файлов: auth, user, clan, task, file, fight, stats, friends, ai, agent
  middleware/         — auth.js (JWT), upload.js (Multer), x402.js (payment, feature flag)
  websocket/         — handler.js (общий), pvpHandler.js (PvP)
  services/          — 17 сервисов (см. CLAUDE.md)
  utils/             — helpers, clanEvents, clanLevel, migrationHelpers
  data/              — archetypes, branches, cardPower, moves
/backend/prisma/
  schema.prisma      — 19 моделей (ИСТОЧНИК ПРАВДЫ по БД)
  seed.js            — achievements + tasks
  migrations/        — НЕ РЕДАКТИРОВАТЬ применённые
/backend/scripts/    — backfill, calibrate, cleanup, migrate
```

---

## Базовые правила

- **Путь:** `/v1/<resource>`
- **JSON:** `express.json({ limit: '1mb' })`. Не повышать без nginx.
- **CORS:** `hexlash.com`, `www.hexlash.com`, `test.hexlash.com`, `hexlash.vercel.app` + FRONTEND_URL. **Никаких wildcard.**
- **Health:** `GET /` и `GET /health` — публичные
- **Auth:** Bearer token → `middleware/auth.js` → `req.userId`
- **Все защищённые ручки** используют `req.userId`, никогда userId из body/query
- **Errors:** 400/401/403/404/429/500. Не светить stack traces.

---

## Prisma — обязательно

- **Singleton:** `require('../lib/prisma')`. **Никогда** `new PrismaClient()`.
- **Транзакции:** `prisma.$transaction([...])` для каскадных операций
- **Prod:** только `prisma migrate deploy`. **Никогда** `db push`.
- **Schema:** `/backend/prisma/schema.prisma` — источник правды
- **Cascade delete** пользователя: через `$transaction` (clans, fights, friends, achievements, tasks, punch)
- **`onDelete`** — проверять перед изменением relations

---

## Миграции

- Dev: `npx prisma migrate dev --name <short_snake_case>`
- Prod: `npx prisma migrate deploy`
- Никогда не редактировать применённые
- Перед прод: проверить на test
- Подробности: `hexlash-deploy`

---

## Аутентификация

- **JWT_SECRET** — env, **сервер крашится без него** (by design)
- **Bearer:** `Authorization: Bearer <token>`
- **Telegram:** HMAC-SHA256 via `validateTelegramPayload()`, replay window 5 мин
- **Password reset:** 501 (не реализовано). **Не fake success.**
- **Temp passwords:** `crypto.randomBytes(12)`, **не `Math.random()`**

---

## Rate limiting

- Login: 5 / 15 мин
- Register: 3 / час
- Telegram: 10 / 15 мин
- AI morning-report: 3 / час
- AI premium-report: 10 / день
- Agent create: 10 / час
- Agent train: 30 / час

Публичные endpoints — рассмотреть rate limit.

---

## Routes

| Файл | Путь | Назначение |
|------|------|-----------|
| `auth.js` | `/v1/auth` | login, signup, reset, telegram |
| `user.js` | `/v1/user` | profile, stats, avatar, achievements, skin, progression, retirement, delete |
| `clan.js` | `/v1/clan` | create, edit, members, balance, invites, events, roles |
| `task.js` | `/v1/task` | daily + social tasks |
| `file.js` | `/v1/file` | avatar upload |
| `fight.js` | `/v1/fight` | save result, history |
| `stats.js` | `/v1/stats` | player + game statistics |
| `friends.js` | `/v1/friends` | list, requests, search |
| `ai.js` | `/v1/ai` | analyze-fight, morning-report, premium-report, build-description |
| `agent.js` | `/v1/agent` | CRUD, tactics, fights, Research Gate, train, auto-fight, rankings, fight-club level, captain |

---

## Валидация

- **Skin:** `/^skin_(m|w)_\d{1,3}\.png$|^vip_(k|t)\d{1,2}\.png$/`
- **Clan name:** unicode `\p{L}\p{N}`, 3-30 chars, no emoji
- **Agent name:** 2-20 chars, no special chars
- **Deck:** 4-8 moveId (PvP min 3 via `MIN_PVP_DECK_SIZE`)
- **Modules:** from 6 archetypes whitelist
- **Tactics:** каждое поле — whitelist
- Whitelist > blacklist. Числа — type + range.

---

## Env-переменные

**Обязательные (crash):** `JWT_SECRET`, `DATABASE_URL`

**Важные:** `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`

**С дефолтами:** PORT(3000), FRONTEND_URL, UPLOAD_DIR, ANTHROPIC_MODEL, AI_TRAINER_ENABLED(true), NFT_MINTING_ENABLED(false), X402_ENABLED(false), MIGRATION_ENABLED(true)

Полный список → `/backend/src/config.js`.

---

## Security Hardening (не откатывать)

- JWT без default secret
- Telegram HMAC-SHA256
- Rate limiting auth
- Crypto temp passwords
- CORS без wildcard
- Body limit 1mb
- XSS: `{{ }}` вместо `v-html`
- Skin regex validation
- Email verify requires auth
- Password reset honest 501
- Cascade delete $transaction
- Prisma singleton

---

## Запрещено

- `new PrismaClient()` — только singleton
- userId из body/query вместо `req.userId`
- `prisma db push` в проде
- Редактировать применённые миграции
- CORS wildcard
- Stack traces клиенту
- Хардкодить секреты
- `Math.random()` для security
- Endpoints без auth для user data
- Поднимать body limit без nginx
- Fake success на password reset
- Откатывать Security Hardening

---

## Чеклист новой ручки

- [ ] Путь `/v1/<resource>`
- [ ] `authMiddleware` если user data
- [ ] `req.userId`, не из body
- [ ] Входные данные валидированы
- [ ] Prisma singleton
- [ ] Понятные коды и сообщения
- [ ] Без stack traces
- [ ] Транзакция при каскадных изменениях
- [ ] Rate limit для публичных
- [ ] Миграция если новая модель
- [ ] CLAUDE.md обновлён (routes table)

---

## Где что искать

| Хочешь | Файл |
|--------|------|
| Env + константы | `/backend/src/config.js` |
| Prisma singleton | `/backend/src/lib/prisma.js` |
| Auth middleware | `/backend/src/middleware/auth.js` |
| x402 payment | `/backend/src/middleware/x402.js` |
| Schema БД | `/backend/prisma/schema.prisma` |
| CORS / limits | `/backend/src/index.js` |
| Agent 16 endpoints | `/backend/src/routes/agent.js` |
| AI endpoints | `/backend/src/routes/ai.js` |

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-websocket` — для WS-протокола
- `hexlash-deploy` — для миграций и env в проде
- `hexlash-ai` — для AI endpoints и промптов
- `hexlash-vue` — если затрагивает фронт-сторону
