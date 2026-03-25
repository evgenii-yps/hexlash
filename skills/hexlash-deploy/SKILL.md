---
name: hexlash-deploy
description: Hexlash deployment, infrastructure, and CI/CD configuration. Use this skill when working on build config, Docker, Nginx, Vercel, environment variables, Prisma migrations, GitHub Actions, production setup, staging, database, Railway, or any deployment-related task. Triggers on mentions of deploy, deployment, build, Docker, Dockerfile, Nginx, Vercel, CI/CD, CI, CD, migrations, production, staging, environment, env, variables, Railway, database setup, server setup, port, CORS, health check, workflow, pipeline, gitops.
---

# Hexlash Deploy & Infrastructure

## Frontend Build

- **Bundler:** Vite 7
- **Optimizations:** JS obfuscation, Brotli compression, image optimization (mozjpeg/pngquant/webp), terser (drops console statements)
- **Build command:** `npm run build` (outputs to `/dist`)
- **Dev server:** `npm run dev` (port 5173)
- **Config:** `vite.config.js`

## Backend

- **Runtime:** Node.js + Express 4
- **Port:** 3000 (configurable via PORT env)
- **WebSocket:** Same HTTP server, shared port
- **Database:** PostgreSQL via Prisma 5
- **Health checks:** `GET /` and `GET /health`

## Docker

- `Dockerfile` in project root
- `nginx.prod.conf` — Production Nginx config
- `nginx.test.conf` — Test/staging Nginx config

## Vercel

- Frontend deployment target
- Config: `vercel.json` in project root
- Preview deployments on PRs

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `PORT` | No | 3000 | Backend server port |
| `WS_PORT` | No | 444 | WebSocket port (legacy, now shared) |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | 'default-secret' | JWT signing key |
| `FRONTEND_URL` | No | 'http://localhost:5173' | CORS origin |
| `UPLOAD_DIR` | No | './uploads' | File upload directory |
| `ANTHROPIC_API_KEY` | No | — | Claude API key for AI Trainer |
| `ANTHROPIC_MODEL` | No | 'claude-sonnet-4-20250514' | AI model |
| `AI_TRAINER_ENABLED` | No | true | Feature flag for AI Trainer |

## CORS Configuration

Allowed origins:
- `hexlash.com`
- `test.hexlash.com`
- `hexlash.vercel.app`
- `*.vercel.app`

## Prisma Database

### Commands
```bash
npx prisma migrate dev      # Apply migrations (development)
npx prisma migrate deploy   # Apply migrations (production)
npx prisma generate         # Generate client
npx prisma db seed          # Seed data
npx prisma studio           # Visual DB editor
```

### Rules
- NEVER edit existing migration files in `prisma/migrations/`
- Create new migrations for schema changes
- Test migrations locally before deploying
- Seed data: 16 achievements + social/daily tasks (en/ru)

### 12 Models
User, Club, Achievement, UserAchievement, SocialTask, UserSocialTask, DailyTask, UserDailyTask, Fight, PunchInfo, FriendRequest, Friendship

## CI/CD

- GitHub Actions: `.github/workflows/gitops.yaml`
- Do NOT modify workflow files without explicit permission

## Domains

| Domain | Environment |
|--------|-------------|
| `hexlash.com` | Production |
| `test.hexlash.com` | Staging/Test |
| `hexlash.vercel.app` | Vercel preview |

## Backend Hosting

- Railway or any Node.js host with PostgreSQL
- Requires persistent storage for uploads
- WebSocket support required (no HTTP-only proxies)

## Deploy Checklist

1. Run `npm run build` — verify no errors
2. Check environment variables are set
3. Run `npx prisma migrate deploy` on target database
4. Verify health check endpoints respond
5. Test WebSocket connectivity
6. Verify CORS allows frontend origin
