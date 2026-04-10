---
name: hexlash-deploy
description: Сборка, деплой и инфраструктура Hexlash. Триггерится на deploy, билд, build, Docker, Dockerfile, Nginx, Vercel, CI, CD, GitHub Actions, релиз, release, env, environment variables, prod, production, test.hexlash, hexlash.com, gitops, package.json scripts, Prisma migrate. Грузить вместе с hexlash-dev. Для backend env — hexlash-api. Для frontend сборки — hexlash-vue.
---

# hexlash-deploy — Build & Deploy

## Главное правило

Деплой имеет **две прод-цели**: Vercel (быстрый) и Docker/Nginx (контролируемый). При изменении сборки, env или CI — проверять, что обе цели работают.

---

## Окружения

| Окружение | Frontend URL | Backend API | WS |
|-----------|-------------|-------------|-----|
| Local dev | `localhost:5173` | `localhost:3000` | `ws://localhost:3000` |
| Test | `test.hexlash.com` | `apitest.hexlash.com` | `wss://apitest.hexlash.com` |
| Production | `hexlash.com` | `api.hexlash.com` | `wss://api.hexlash.com` |
| Vercel | `hexlash.vercel.app` | (настраивается) | (настраивается) |

CORS на бэкенде: `hexlash.com`, `test.hexlash.com`, `hexlash.vercel.app` (без wildcard).

---

## Frontend — сборка

- **Сборщик:** Vite 7, конфиг `vite.config.js`
- **Команды:**
  - `npm run dev` — dev-сервер на :5173
  - `npm run build` / `npm run build:prod` — production
  - `npm run build:test` — test окружение
  - `npm run dev:mock` — mock mode
  - `npm run preview` — локальный preview
- **Режимы:** `prod`, `test`, `mock` — определяют API/WS сервер через compile-time defines
- **Compile-time defines** (НЕ `import.meta.env`):
  - `__API_SERVER_URL__` — URL бэкенда (из `vite.config.js` по режиму)
  - `__WEB_SOCKET_URL__` — URL WebSocket
  - `__IS_PROD__` — boolean
  - `__MOCK_MODE__` — boolean
  - `__APP_VERSION__` — из package.json
- **Оптимизации:** JS obfuscation, Brotli, image optimization (mozjpeg/pngquant/webp), terser (drops console)
- **Output:** `/dist`

---

## Backend — запуск

- **Runtime:** Node.js 20 + Express
- **БД:** PostgreSQL через Prisma
- **Команды** (в `/backend`):
  - `npm run dev` — dev с автоперезапуском (`node --watch`)
  - `npm start` — production: `prisma migrate deploy` + `seed.js` + `node src/index.js`
  - `npx prisma migrate dev --name <desc>` — создать миграцию
  - `npx prisma migrate deploy` — применить миграции в проде
  - `npx prisma generate` — сгенерировать клиент
  - `node prisma/seed.js` — seed данные
- **Порты:** Express 3000 (default), WS на том же HTTP-сервере
- **Health checks:** `GET /` и `GET /health`

---

## Обязательные env-переменные backend

**Сервер крашится без них** (by design):

| Переменная | Назначение |
|------------|------------|
| `JWT_SECRET` | Подпись JWT. Без неё — crash при старте. |
| `DATABASE_URL` | PostgreSQL connection string для Prisma |

**Важные (с дефолтами):**
- `TELEGRAM_BOT_TOKEN` — HMAC валидация Telegram auth
- `ANTHROPIC_API_KEY` — Claude API для AI Trainer
- `PORT` (3000), `FRONTEND_URL` (`http://localhost:5173`)
- `AI_TRAINER_ENABLED` (true), `ANTHROPIC_MODEL` (`claude-haiku-4-5-20251001`)
- `NFT_MINTING_ENABLED` (false), `X402_ENABLED` (false)
- `MIGRATION_ENABLED` (true)

Полный список → `/backend/src/config.js` (источник правды).

---

## Docker деплой

**Два Dockerfile:**

| Файл | Назначение |
|------|-----------|
| `Dockerfile` (корень) | Frontend: multi-stage Node 20 → Nginx 1.26. `TARGET_ENV` ARG выбирает build:prod / build:test |
| `backend/Dockerfile` | Backend: Node 20, Prisma generate, migrate + seed + start |

**Nginx:** Раздаёт статику фронтенда (НЕ reverse proxy к backend). Backend работает отдельно на `api.hexlash.com` / `apitest.hexlash.com`.

- `nginx.prod.conf` — `hexlash.com`, порты 8080 (HTTP→HTTPS redirect) + 8443 (SSL)
- `nginx.test.conf` — `test.hexlash.com`, те же порты
- SSL сертификаты: `/etc/certs/hexlash.com.crt` + `.key`
- Статические файлы: `expires max` + `Cache-Control: public`

---

## Vercel деплой (фронтенд)

- `vercel.json` — SPA rewrites (`/(.*) → /index.html`)
- Build: `npm run build`
- Output: `dist`
- Auto-deploy при push

---

## CI/CD — GitHub Actions (GitOps)

**Файл:** `.github/workflows/gitops.yaml`

**Триггер:** push в `test` или `main`

**Flow:**
1. Checkout → Docker login → Build frontend image с `TARGET_ENV` (branch name)
2. Push в Docker Hub: `invariant0x/hexlash-frontend:{branch}-{sha}` + `:latest`
3. Checkout DevOps репозиторий (`HexLashApp-DevOps`)
4. Обновить `WEB-deployment.yaml` с новым image tag (test → `fc-dev/`, main → `fc-prod/`)
5. Push в DevOps main → K8s подхватывает
6. Cleanup: удаление старых Docker Hub тегов (оставляет 10 последних)

---

## Prisma миграции — правила

- **Dev:** `npx prisma migrate dev --name <description>`
- **Prod:** **только** `npx prisma migrate deploy` — никогда `migrate dev` или `db push`
- **Никогда не редактировать** уже применённую миграцию
- **Откат:** писать обратную миграцию вручную (Prisma не поддерживает auto-rollback)
- Seed: 16 achievements + social/daily tasks

---

## Релизный чеклист

- [ ] `npm run build` без ошибок
- [ ] Env-переменные настроены на целевом окружении
- [ ] Prisma миграция применена на test и работает
- [ ] Полный flow проверен: login → arena → fight → results
- [ ] WS-протокол синхронизирован фронт ↔ бэк
- [ ] Локали: новые тексты в 11 языках
- [ ] CORS origins актуальны
- [ ] CLAUDE.md обновлён

---

## Запрещено

- Комитить `.env` файлы или секреты
- Хардкодить production URL — через `vite.config.js` defines или env/config
- `prisma db push` в production
- Редактировать применённые миграции
- Менять `JWT_SECRET` без координации (инвалидирует все сессии)
- CORS на `*` или wildcard — только явные origins
- Деплоить frontend без backend при изменении API/WS контракта
- Пушить в `main`/`test` напрямую без проверки

---

## Чеклист изменения деплоя

- [ ] Определена цель: Vercel / Docker / backend / CI
- [ ] Если env — обновлены: config.js, GitHub Secrets, Vercel env, прод-сервер
- [ ] Если build — `npm run build` локально ok
- [ ] Если nginx — оба конфига (prod + test) проверены
- [ ] Если Prisma — миграция через `migrate dev`, проверена на test
- [ ] Если CORS — origins в `/backend/src/index.js`
- [ ] Если CI — `.github/workflows/gitops.yaml` понятно комментирован
- [ ] CLAUDE.md обновлён

---

## Где что искать

| Хочешь | Файл |
|--------|------|
| Frontend сборка + defines | `vite.config.js` |
| Frontend package scripts | `package.json` |
| Backend env + config | `/backend/src/config.js` |
| Frontend Dockerfile | `Dockerfile` |
| Backend Dockerfile | `backend/Dockerfile` |
| Nginx prod | `nginx.prod.conf` |
| Nginx test | `nginx.test.conf` |
| CI/CD | `.github/workflows/gitops.yaml` |
| Vercel | `vercel.json` |
| Prisma миграции | `/backend/prisma/migrations/` |
| Prisma схема | `/backend/prisma/schema.prisma` |
| CORS origins | `/backend/src/index.js` |

---

## Связанные скиллы

- `hexlash-dev` — всегда первым
- `hexlash-api` — для backend env, Prisma, миграций
- `hexlash-vue` — для фронтенд сборки
- `hexlash-websocket` — если меняется протокол
- `hexlash-i18n` — если добавляются языки
- `hexlash-testing` — для релизного чеклиста
