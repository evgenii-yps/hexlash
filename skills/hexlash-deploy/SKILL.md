---
name: hexlash-deploy
description: Deploy, infrastructure, env vars, CI/CD, and rollout procedures for Hexlash. Use when deploying to test or prod, configuring environment variables, debugging build/runtime issues, planning database migrations, or running rollout scripts (migrate-all-users, backfill-captains).
---

# Hexlash Deployment

## When to Use
Triggers on any deploy/infra task: pushing to test or prod, env var changes, CI/CD debugging, rollout planning, migration script execution, kill switch operations, healthcheck failures.

## Environments

### Test — test.hexlash.com
- **Purpose:** staging for new features before prod rollout
- **Database:** separate PostgreSQL instance from prod (CRITICAL — never point test backend at prod DB)
- **Deploy trigger:** auto from push to `test` branch via `.github/workflows/gitops.yaml`
- **Frontend hosting:** Docker + Nginx via `nginx.test.conf`. Image pushed to Docker Hub (`invariant0x/hexlash-frontend`), then GitOps deploys via `Invariant0x/HexLashApp-DevOps` repo (`fc-dev/applications/frontend/WEB-deployment.yaml`)
- **Backend hosting:** Node.js Docker container (`backend/Dockerfile`), port 3000. CMD runs `prisma migrate deploy && seed.js && node src/index.js` on every start. Backend CI/CD is NOT in this repo — deployed separately via external GitOps.

### Prod — hexlash.com
- **Database:** Railway PostgreSQL (likely — based on `backend/src/index.js:104` comment "Railway sets this automatically" and Phase 1 handoff references). Not fully verified, treat as Railway by default but confirm before any DB operation.
- **Frontend hosting:** Docker + Nginx via `nginx.prod.conf`. Same CI pipeline as test but deploys to `fc-prod/applications/frontend/WEB-deployment.yaml`
- **Backend hosting:** [UNKNOWN — needs human input: likely same Docker + Railway pattern as test, but backend workflow not in this repo]
- **Deploy trigger:** auto from push to `main` branch via same `gitops.yaml` workflow

### Vercel (legacy/fallback)
- `vercel.json` exists in project root (SPA rewrite rule only)
- CORS allows `hexlash.vercel.app`
- Actual production uses Docker+Nginx, not Vercel. Vercel config may be legacy or emergency fallback.

## Required Environment Variables (Backend)

### Mandatory — server crashes without these
- `JWT_SECRET` — JWT signing key. **No default.** Server throws on startup if missing (`config.js:3-5`).
- `DATABASE_URL` — PostgreSQL connection string. Prisma reads from here.

### Mandatory for features (server starts but features break)
- `TELEGRAM_BOT_TOKEN` — required for Telegram WebApp HMAC-SHA256 auth validation. Default: `''` (empty string, Telegram auth silently fails).
- `ANTHROPIC_API_KEY` — required for AI Trainer (`/v1/ai/*` endpoints). Default: `''`. Without it AI endpoints return errors but backend runs.

### Feature flags
- `MIGRATION_ENABLED` — controls lazy User → Fighter #1 migration on `GET /me`. **Default: `true`** (`process.env.MIGRATION_ENABLED !== 'false'` in config.js:128). Set to `'false'` as kill switch to disable lazy migration.
- `AI_TRAINER_ENABLED` — feature flag for AI Trainer. Default: `true` (`process.env.AI_TRAINER_ENABLED !== 'false'`).
- `X402_ENABLED` — x402 micropayment for premium reports. Default: `false` (`process.env.X402_ENABLED === 'true'`).
- `NFT_MINTING_ENABLED` — NFT minting requirement for agents. Default: `false` (`process.env.NFT_MINTING_ENABLED === 'true'`).

### Other env vars (optional)
- `PORT` — backend port. Default: `3000`.
- `WS_PORT` — legacy, not used in practice. Default: `444`. WebSocket actually runs on same HTTP server as Express.
- `FRONTEND_URL` — added to CORS allowlist if not already present. Default: `'http://localhost:5173'`.
- `UPLOAD_DIR` — file upload directory. Default: `'./uploads'`.
- `BASE_RPC_URL` — Base chain RPC for NFT verification. Default: `'https://mainnet.base.org'`.
- `AGENT_NFT_CONTRACT` — NFT contract address. Default: `''`.
- `PAYMENT_RECEIVER_ADDRESS` — x402 payment receiver. Default: `''`.
- `AI_BUILD_DESCRIPTION_MAX_TOKENS` — Default: `60`.

### Constants in config.js (NOT env vars)
- `ANTHROPIC_MODEL` = `'claude-haiku-4-5-20251001'`
- `TELEGRAM_AUTH_MAX_AGE_SEC` = `300` (5 min replay window)
- `USDC_CONTRACT_BASE` = `'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'`
- Full game balance constants (combat, ELO, clan levels, scheduler) — see `hexlash-gamedesign` skill

## Frontend Build Variables

Frontend does NOT use `VITE_*` env vars for API/WS URLs. Instead, `vite.config.js` uses `define` to inject build-time constants based on `--mode`:

| Constant | prod mode | test mode | Usage |
|----------|-----------|-----------|-------|
| `__API_SERVER_URL__` | `'https://api.hexlash.com'` | `'https://apitest.hexlash.com'` | `apiClient.js` baseURL |
| `__WEB_SOCKET_URL__` | `'wss://api.hexlash.com'` | `'wss://apitest.hexlash.com'` | `WebSocketClient.js` URL |
| `__APP_VERSION__` | from `package.json` version | same | ProfileView, RainView |
| `__IS_PROD__` | `true` | `false` | ProfileView |
| `__MOCK_MODE__` | `false` | `false` | `mockData.js` (only `--mode mock`) |

Only 3 actual `VITE_*` env vars in codebase (all Web3, all with defaults):
- `VITE_WALLETCONNECT_PROJECT_ID` — WalletConnect project ID (has hardcoded fallback)
- `VITE_AGENT_NFT_CONTRACT` — NFT contract address (default `''`)
- `VITE_NFT_MINTING_ENABLED` — NFT feature flag (default `false`)

Amplitude API key is hardcoded in `App.vue:201` (not configurable via env).

## Build Commands

### Frontend
- `npm run dev` — Vite dev server on port 5173
- `npm run dev:mock` — Vite with mock data mode
- `npm run build` / `npm run build:prod` — production build (`--mode prod`)
- `npm run build:test` — test build (`--mode test`)
- `npm run preview` — preview production build locally
- Output: `dist/`. Includes: JS obfuscation, Brotli compression, image optimization (mozjpeg/pngquant/webp), terser (drops console).

### Backend
- `npm start` — production: `prisma migrate deploy && seed.js && node src/index.js`
- `npm run dev` — dev with `node --watch src/index.js` (Node.js native watch, not nodemon)
- `npm test` — `node --test tests/**/*.test.js`
- `npm run db:migrate` — `npx prisma migrate deploy`
- `npm run db:seed` — `node prisma/seed.js`
- `npm run db:setup` — migrate + seed
- `npx prisma generate` — regenerate Prisma client after schema changes (also runs on `postinstall`)
- `npx prisma studio` — visual DB browser (use for spot-checks during rollout)

## Healthcheck Endpoints
- `GET /` → `{ status: 'ok', service: 'hexlash-api', version: '1.0.0' }`
- `GET /health` → `{ status: 'ok' }`
Both on backend Express server, used by load balancer / monitoring.

## CI/CD Architecture

**Workflow:** `.github/workflows/gitops.yaml` — "Build and Deploy Frontend"

**Trigger:** push to `test` or `main` branch (auto, no manual gate).

**Steps:**
1. Checkout repo
2. Docker login (Docker Hub, `invariant0x`)
3. Build frontend Docker image with `TARGET_ENV=$BRANCH_NAME` (selects `build:test` or `build:prod`, and `nginx.test.conf` or `nginx.prod.conf`)
4. Push to Docker Hub: `invariant0x/hexlash-frontend:{branch}-{sha}` + `:latest`
5. Checkout `Invariant0x/HexLashApp-DevOps` repo
6. Update `WEB-deployment.yaml` in `fc-dev/` (test) or `fc-prod/` (prod) with new image tag
7. Push to DevOps repo → triggers Kubernetes/GitOps deployment
8. Cleanup: delete old Docker Hub tags (keep last 10)

**Build logs:** GitHub Actions UI → "Build and Deploy Frontend" workflow. Docker image tags visible on Docker Hub (`invariant0x/hexlash-frontend`).

**IMPORTANT:** This workflow deploys FRONTEND ONLY.

### Backend deploy (CRITICAL — separate from frontend)
Backend CI/CD is **NOT in the hexlash repo**. Frontend pushes to `test`/`main` branches trigger frontend-only Docker builds via `.github/workflows/gitops.yaml`.

Backend deploy mechanism: **UNKNOWN — needs clarification from Yura/DevOps**. Likely candidates:
- Separate `HexLashApp-DevOps` GitOps repo
- Railway auto-deploy from main
- Manual SSH/Docker push by DevOps team

**Implication:** a single push to `main` or `test` does NOT redeploy backend. Backend changes (config.js, routes, services) require a separate trigger that is currently undocumented in this skill. Before any rollout that touches backend code, confirm with Yura how to actually push the backend.

## CORS Configuration

Allowed origins (explicit, no wildcards):
- `https://hexlash.com`
- `https://www.hexlash.com`
- `https://test.hexlash.com`
- `https://hexlash.vercel.app`
- Plus `FRONTEND_URL` from env (for dev)

Adding new subdomain requires editing `allowedOrigins` array in `backend/src/index.js`.

## Rollout Procedures

### Standard deploy (no DB migrations)
1. Merge PR to target branch (`test` or `main`)
2. CI auto-triggers (GitHub Actions)
3. Watch build in GitHub Actions UI → "Build and Deploy Frontend"
4. Wait for healthcheck green
5. Smoke test: open site → login → main screen → check WebSocket connects → check no errors in browser console
6. Watch backend logs first 5 minutes for unexpected ERROR lines

### Migration rollout (Captain series and similar schema/data changes)
**Pre-flight (CRITICAL):**
0. **Check current state of target DB** before assuming "fresh start": open `prisma studio` against target `DATABASE_URL`. Check if `Agent` table has any rows with `isCaptain=true` (lazy migration already ran). Check if `User` table has rows where corresponding Agent #1 exists (partial migration state). If state is mixed: STOP. Decide whether to clean up, continue from where lazy left off, or rebuild test DB from prod snapshot.
1. Confirm `DATABASE_URL` points to TEST DB (not prod) — triple check
2. Confirm DB backup exists (last 24h)
3. Confirm `MIGRATION_ENABLED=false` BEFORE deploy (prevents lazy migration race with batch script)
4. Confirm kill switch tested: `MIGRATION_ENABLED=false` + restart actually disables lazy migration

**Execution:**
1. Deploy backend to environment
2. Wait healthcheck green
3. Run `npx prisma migrate deploy` if schema changes (NOTE: `npm start` already runs this, but explicit run is safer for verification)
4. Run `node backend/scripts/migrate-all-users.js` — idempotent, skips already migrated users, logs `[migration]` tag. Forces `MIGRATION_ENABLED=true` internally.
5. Spot-check 3-5 users via `npx prisma studio`: Fighter #1 exists, fields populated
6. Run `node backend/scripts/backfill-captains.js` — idempotent, skips clubs with existing captain, promotes oldest agent. Logs `[backfill]` tag.
7. Spot-check same users: isCaptain=true on one agent per FightClub
8. Set `MIGRATION_ENABLED=true` and restart (enables lazy migration for any users created after batch ran)
9. Manual QA: PvE fight → Captain.wins+1 (NOT User.pveWins). PvP matchmaking → opponent skin = Captain skin. ProfileView shows two layers (Trainer + Captain).
10. Monitor logs for `[migration]` and `[backfill]` tags for 24h

### Kill switch
- `MIGRATION_ENABLED=false` + restart backend → lazy migration off, existing migrated users keep working, new users not migrated
- For full rollback: requires DB restore from backup (no in-place rollback for migrated data)

## Vite Obfuscation

Obfuscator config (`vite.config.js:58-68`):
- `compact: true`, `controlFlowFlattening: true` (threshold 0.75)
- `deadCodeInjection: true` (threshold 0.4)
- `stringArray: false`
- **Excludes:** `src/router/**`, `node_modules/**`
- **No special Web3 exclusions.** Web3 libs (ethers, viem, @wagmi) go through node_modules exclude, so they are NOT obfuscated. This is correct — obfuscating Web3 libs would break ABI encoding.

## Common Gotchas
- **DATABASE_URL leak:** copying prod env to test → catastrophic. Always verify URL hostname before any DB operation.
- **JWT_SECRET missing:** backend exits immediately on startup, no fallback (intentional security hardening). Check logs for crash loop.
- **MIGRATION_ENABLED race:** if you run `migrate-all-users.js` while `MIGRATION_ENABLED=true`, lazy migration fires on `/me` calls in parallel → unpredictable state. Always: set false → batch run → set true. The script itself forces `MIGRATION_ENABLED=true` internally via `process.env`.
- **`backend/npm start` runs migrate + seed + start** on every backend restart (`npx prisma migrate deploy && node prisma/seed.js && node src/index.js`). Seed is verified idempotent: achievements use `upsert` by type, social/daily tasks use `findFirst + skip if exists`. Safe to restart, no data corruption. But: any future seed additions MUST follow the same pattern, or restarts will duplicate data.
- **Prisma client out of date:** after schema change, must run `prisma generate` before backend starts, otherwise type errors. `postinstall` hook handles this on `npm install`.
- **CORS explicit allowlist:** no wildcard `*.vercel.app`. Adding new subdomain requires explicit entry in `backend/src/index.js`.
- **Body limit 1mb:** uploads larger than 1mb fail on `express.json`. Avatar upload uses Multer (separate middleware) to bypass this.
- **WebSocket and HTTP share port:** `WS_PORT=444` in config.js is legacy/unused. WebSocket attaches to Express HTTP server. Don't try to expose port 444 separately.
- **Amplitude key hardcoded:** in `App.vue:201`, not configurable via env. Changing requires code change + redeploy.
- **Frontend env vars are build-time:** `__API_SERVER_URL__` etc. are baked into JS at build. Changing API URL requires rebuild, not just env var change.
- **Frontend push ≠ backend deploy.** GH Actions only builds frontend. Backend lives in external GitOps. Pushing to main updates frontend in ~5min, backend could lag or never deploy without explicit action.
- **`MIGRATION_ENABLED=true` is the silent default.** Any backend instance without explicit `MIGRATION_ENABLED=false` runs lazy migration on every `/me` call. Before any "fresh" rollout, check the actual state of the test DB — partial lazy migration may have already happened.

## Prisma Database

### 20 Models
User, Club, ClubInvite, ClanEvent, FightClub, Achievement, UserAchievement, SocialTask, UserSocialTask, DailyTask, UserDailyTask, Fight, PunchInfo, FriendRequest, Friendship, Agent, AgentTactics, AgentProgression, AgentFightLog

### Rules
- NEVER edit existing migration files in `prisma/migrations/`
- Create new migrations for schema changes
- Test migrations locally before deploying
- Seed data: 16 achievements + social/daily tasks (en/ru)
- Prisma singleton via `backend/src/lib/prisma.js` — all routes/services use shared instance

## Files NOT to Modify (without explicit permission)
- `nginx.prod.conf`, `nginx.test.conf`
- `.github/workflows/*` (especially `gitops.yaml`)
- `prisma/migrations/*` (existing migrations are immutable)
- `Dockerfile`, `backend/Dockerfile` (without testing locally first)
- `src/assets/abi/*` — contract ABIs

## Related
- **`hexlash-api`** — backend env vars deep dive, JWT, Prisma singleton pattern
- **`hexlash-testing`** — smoke test checklists, regression checks after rollout
- **CLAUDE.md sections:** Backend Config, Build & Deploy, Security Hardening, Database Models
- **Phase 1 map:** rollout state, kill switch procedures, parking debt
