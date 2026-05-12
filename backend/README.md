# Hexlash Backend

Express 4 + Prisma 5 + PostgreSQL backend для Hexlash game.

Single-repo monorepo — frontend at `/src/`, backend at `/backend/`. Production deployed via Railway. Frontend deployed via Vercel. CLAUDE.md (repo root) is the comprehensive project memory + architecture reference.

## Quick start

```bash
cd backend
npm install
cp .env.example .env  # fill in real values
npx prisma migrate deploy
node prisma/seed.js
npm run dev
```

Server runs on `PORT` (default 3000), WebSocket on `WS_PORT` (default 444).

## Required environment variables

See `.env.example` for complete list. Critical:

- `DATABASE_URL` — PostgreSQL connection string (Railway provides automatically in production)
- `JWT_SECRET` — server REFUSES to start without this (hardened per Security section в CLAUDE.md)
- `RESEND_API_KEY`, `EMAIL_FROM_DOMAIN`, `APP_URL` — Email Auth series (see below)
- `ANTHROPIC_API_KEY` — AI Trainer feature
- `PORT`, `WS_PORT`, `FRONTEND_URL`, `UPLOAD_DIR` — server config

Production secrets live in Railway service environment variables (never committed). Local `.env` file is gitignored.

## Email Authentication (Resend)

Email Auth series adds email verification + password reset flows. Provider: [Resend](https://resend.com) (selected per `docs/EMAIL_PROVIDER_COMPARISON.md`).

### Required env vars

```
RESEND_API_KEY=re_xxxxxxxxxxxx       # from Resend dashboard → API Keys
EMAIL_FROM_DOMAIN=hexlash.com        # verified domain
APP_URL=https://www.hexlash.com      # frontend URL for email links (no trailing slash)
```

### DNS setup (one-time per domain)

1. Add domain in Resend dashboard
2. Add 4 DNS records к domain registrar (Namecheap / Cloudflare / etc.):
   - **TXT** `resend._domainkey` → DKIM (long key value provided by Resend)
   - **MX** `send` → `feedback-smtp.<region>.amazonses.com` priority 10
   - **TXT** `send` → `v=spf1 include:amazonses.com ~all` (SPF)
   - **TXT** `_dmarc` → `v=DMARC1; p=none;` (DMARC, optional but recommended)
3. Click "Verify records" in Resend dashboard
4. Domain Status flips к "Verified" — emails can now send from `noreply@<domain>`

Production state: `hexlash.com` verified at Resend, region `eu-west-1` (Ireland). DKIM + MX + SPF records active. DMARC `p=none` (monitoring mode — upgrade к `p=quarantine` after 30-60 days of clean logs).

### Email flow endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/v1/auth/register` | none + rate limit | Accepts optional `email`, sends verify email if provided |
| POST | `/v1/auth/login` | none + rate limit | Accepts `login` field as handle OR email (`@` detection) |
| POST | `/v1/auth/forgot-password` | none + rate limit | Generic 200 response, sends reset email iff verified user found |
| POST | `/v1/auth/reset-password` | none + rate limit | Token + new password → auto-login JWT |
| POST | `/v1/user/verify-email` | none (token IS auth) | Token-based flip emailVerified=true |
| POST | `/v1/user/resend-verification` | JWT + rate limit | Re-sends verify email |
| POST | `/v1/user/edit` | JWT | Email change triggers reverify cascade (emailVerified=false + new token + send) |

### Token lifetimes

- **Verify token**: 24 hours
- **Reset token**: 1 hour (stricter for password ops per security best practice)

### Rate limits

- `/auth/login`: 5/15min/IP
- `/auth/register`: 3/hr/IP
- `/auth/forgot-password`: 3/hr per (IP, email) tuple
- `/auth/reset-password`: 5/15min/IP
- `/user/verify-email`: 10/15min/IP
- `/user/resend-verification`: 1/5min/user

### Implementation files

- `src/services/emailService.js` — Resend SDK wrapper, `{ok, error?, id?}` contract, never throws
- `src/services/templates/verifyEmail.js` — HTML + plain text template (24h TTL footer)
- `src/services/templates/resetPassword.js` — HTML + plain text template (1h TTL + "ignore if not requested" footer)
- `src/routes/auth.js` — register/login/forgot-password/reset-password handlers
- `src/routes/user.js` — verify-email/resend-verification/edit handlers
- `tests/emailService.test.js` — 10 mock-based unit tests
- `tests/auth.test.js` — 11 contract-lock tests (regex, token format, expiry math)

### Resend usage monitoring

Set up alerts когда usage approaches free tier limit (3,000 emails/month):
- Resend Dashboard → Settings → Usage → enable email notifications
- Estimated usage at current scale: ~150-1500 emails/month (well within free tier)

Detailed flow rationale + decisions: `docs/EMAIL_AUTH_IMPLEMENTATION_REPORT.md`.

## Tests

```bash
cd backend
npm test   # runs node:test against tests/**/*.test.js
```

Convention: pure unit tests, no DB integration (per Sub-epic 5K Lesson #32 in CLAUDE.md). Endpoint integration covered by manual QA via curl + browser flow during Phase 6.

Total tests after Email Auth series: **105**.

## Migrations

Schema in `prisma/schema.prisma`, migrations in `prisma/migrations/`.

```bash
# Dev (creates new migration from schema diff):
npx prisma migrate dev --name <descriptive_name>

# Production (apply existing migrations):
npx prisma migrate deploy   # runs as part of `npm start` on Railway boot
```

**Important** for any schema change:
1. Backup database before applying на prod (Railway dashboard or `pg_dump`)
2. Run diagnostic scripts in `scripts/` to count affected rows
3. Use cherry-pick PR pattern для backend changes (Lesson #33 в CLAUDE.md) — schema migration в isolated PR before code consumers

## Deployment

Railway auto-deploys on `main` branch push via GitOps webhook. Container restart runs `npm start`:

```
prisma migrate deploy && node prisma/seed.js && node src/index.js
```

Migrations apply sequentially on container boot. Backend may restart 1-2 times during deploy — normal.

Frontend (Vercel) deploys independently from same monorepo.

## References

- Project memory + architecture: `/CLAUDE.md`
- Email Auth implementation: `docs/EMAIL_AUTH_IMPLEMENTATION_REPORT.md`
- Email provider comparison: `docs/EMAIL_PROVIDER_COMPARISON.md`
- Backend audit (pre-Email-Auth): `docs/BACKEND_AUDIT_EMAIL_AUTH.md`
- Skills for Claude Code: `/skills/hexlash-api/SKILL.md` (backend conventions)
