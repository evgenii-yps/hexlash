# Backend audit — email auth readiness

**Audit date:** 2026-05-08
**Branch audited:** `claude/cleanup-stream-1-phase0` @ `adf9040` (Stream 1 closure HEAD)
**Mode:** read-only / discovery
**Scope:** baseline understanding of backend auth + user model + email infra **before** writing email auth implementation TZ. Zero code changes.

---

## 1. Stack

| Layer | Tech | Source |
|---|---|---|
| Runtime | Node.js (require-based CommonJS, no TypeScript) | `package.json:6` (`main: src/index.js`), `src/index.js:1` |
| Framework | Express **4.21.1** | `package.json` deps |
| ORM | Prisma **5.22.0** | `package.json` deps |
| DB | PostgreSQL | `prisma/schema.prisma:5-8` (`provider = "postgresql"`, `url = env("DATABASE_URL")`) |
| Auth lib | jsonwebtoken **9.0.2** + bcryptjs **2.4.3** | `package.json` deps |
| Rate limiting | express-rate-limit **8.3.1** | `package.json` deps |
| Security headers | helmet **8.1.0** | `package.json` deps |
| WS | ws **8.18.0** | `package.json` deps |
| File upload | multer | (irrelevant for email auth) |
| External APIs | @anthropic-ai/sdk (AI Trainer) | (irrelevant for email auth) |

**Migrations location:** `backend/prisma/migrations/` (Prisma timestamped folders e.g. `20260312000000_init/`).

**Build/start:** `npm start` runs `prisma migrate deploy && node prisma/seed.js && node src/index.js` — migrations + seed run on every container boot.

**No backend-specific CLAUDE.md** — single repo CLAUDE.md (frontend root) covers both layers.

---

## 2. User model

**Path:** `backend/prisma/schema.prisma`, `model User { ... }` block (lines 10-115 approx).

**Fields:**

| Field | Type | Default | Constraints | Notes |
|---|---|---|---|---|
| `id` | String | `uuid()` | `@id` | primary key |
| `login` | String | — | `@unique` | only unique field besides id and inviteId |
| `password` | String | — | (not nullable) | bcrypt hash |
| **`email`** | **String** | **`""` (empty string)** | **NO `@unique`, NO `@index`, NOT nullable** | **see §2 verdict below** |
| **`emailVerified`** | **Boolean** | **`false`** | — | toggled by `POST /v1/user/verify-email` (currently accepts any code) |
| **`initialVerified`** | **Boolean** | **`true`** | — | semantic: telegram-imported users had emails marked initial-verified. Post-1b telegram excision, default still `true`. Used in `formatUserResponse` only — exposed but not gated on. |
| `language` | String | `"en"` | — | |
| `name` | String | `"Anonymous"` | — | |
| `avatarUrl` | String | `""` | — | |
| `isBlocked` | Boolean | `false` | — | login refuses blocked accounts |
| `balance` | Int | `0` | — | (non-auth: in-game currency, register seeds 1,000,000) |
| `walletAddress` | String? | null | nullable | |
| `skin` | String | `"skin_m_1.png"` | — | (non-auth) |
| `rating`, `totalFights`, `wins`, `losses`, `draws`, `pveWins/Losses/Draws/TotalFights`, `pvpWins/Losses/Draws/TotalFights` | Int | various | — | (non-auth game stats) |
| `totalTaps` | Int | `0` | — | (non-auth) |
| `progression`, `deck`, `settings` | Json? | null | nullable | (non-auth) |
| `luckPercentage` | Float | `0` | — | (non-auth) |
| `wonTokens`, `freeTokens`, `lostTokens`, `invitedUsers`, `noSkipDays` | Int | `0` | — | (non-auth) |
| **`referredBy`** | **String?** | **null** | nullable | login of referrer (NOT id — login string) |
| `inviteId` | String? | `uuid()` | `@unique` | unused since 1b telegram excision; legacy artifact |
| `clanId` | String? | null | nullable, FK to Clan | — |
| `clanRole` | String? | null | values: "owner"/"deputy"/"member" | — |
| `createdAt` | DateTime | `now()` | — | |
| `updatedAt` | DateTime | — | `@updatedAt` | |

**Relations:** clan, achievements (UserAchievement), socialTasks, dailyTasks, punchInfo, fights (3 relations), friend requests (2), friendships (2), clan invites (2), agents, fightClub.

### §2 verdicts — email field status

| Concern | Status |
|---|---|
| `email` field present? | ✅ YES |
| nullable? | ❌ NO — typed as `String` (not `String?`), default `""` (empty string) |
| unique constraint? | ❌ NO `@unique` |
| indexed? | ❌ NO `@index` |
| Verification flag? | ✅ `emailVerified` Boolean default `false` |
| Verification token storage? | ❌ NO `verifyToken` / `verifyTokenExpiresAt` fields |
| Reset token storage? | ❌ NO `resetPasswordToken` / `resetPasswordExpiresAt` fields |
| Email update audit trail? | ❌ NO `emailUpdatedAt` / `previousEmail` fields |

**Critical implication:** `email = ""` is the default for ALL users registered via `POST /v1/auth/register` (which never asks for email). Many existing prod users likely have `email=""`. Adding `@unique` requires either:
- (a) DB migration to convert empty strings to `null` + change column type to `String?` + then add `@unique` (PostgreSQL allows multiple `null` in unique columns) — OR
- (b) Backfill flow forcing all users to set unique emails before unique constraint added

`initialVerified` field is opaque — only used in `formatUserResponse`, no business logic gates on it. Likely legacy from telegram-as-auth era (telegram users had emails marked verified-on-import). Can be safely ignored for email auth design.

---

## 3. Existing auth endpoints

### 3.1 — `backend/src/routes/auth.js` (162 lines)

| Method | Path | Auth | Body | Response (success) | Response (error) | Description |
|---|---|---|---|---|---|---|
| `POST` | `/v1/auth/login` | none + rate limit (5/15min/IP) | `{login, password}` | `{data: {jwtToken}}` | 400 missing, 401 invalid, 403 blocked, 500 internal | Case-insensitive login lookup (`login: { equals, mode: 'insensitive' }`), bcrypt compare, blocked check, 30d JWT sign |
| `POST` | `/v1/auth/register` | none + rate limit (3/1h/IP) | `{login, password, referralCode?}` | `{data: {jwtToken}}` | 400 missing/length, 409 conflict, 500 | login length 3-30, password ≥6, case-insensitive uniqueness, bcrypt hash rounds=10, NEWBIE achievement grant, referral processing, balance seed 1,000,000, 30d JWT sign |
| `GET` | `/v1/auth/login-available/:login` | none | URL param `:login` | `{data: {available: bool}}` | 500 | Case-insensitive availability check |

**Deleted endpoints** (in code comments):
- `POST /v1/auth/telegram` + `validateTelegramPayload` HMAC helper — DELETED in Sub-epic 1b C8 (decision #2, Telegram-as-auth excised). 0 prod TG-only users per 1b §6.4 audit.

### 3.2 — `backend/src/routes/user.js` auth-relevant endpoints

| Method | Path | Auth | Body / params | Response | Description |
|---|---|---|---|---|---|
| `GET` | `/v1/user/me` | JWT | — | `{data: formatUserResponse(user, {captain})}` | Lazy User→Fighter migration trigger; full self profile incl. `email` + `emailVerified` + `initialVerified` |
| `POST` | `/v1/user/edit` | JWT | `{profileData}` with allowed fields: `name, login, email, language, skin, walletAddress` | `{data: formatUserResponse(user)}` | Allows updating email — **no format validation, no uniqueness check, no re-verification trigger** (sets emailVerified=false NOT done — flag stays whatever it was) |
| `POST` | `/v1/user/reset` | none | (any) | **501 `{error: 'Password reset is not yet implemented'}`** | Cosmetic stub. Per file comment line 83: "TODO: implement password reset with email token" |
| `POST` | `/v1/user/delete` | JWT | — | `{data: {success: true}}` | Cascade delete with `$transaction` (clans, fights, friends, achievements, tasks, punch) |
| `POST` | `/v1/user/verify-email` | JWT | `{code}` | `{data: true}` | **NOT a real verification — accepts ANY non-empty code, blindly sets `emailVerified=true` for `req.userId`. Per file comment line 150: "TODO: implement proper verification with email token instead of accepting any code"** |
| Other endpoints (avatar, profile lookups, search, skin, progression, settings, referrals, retirement) | various | JWT | various | various | Not auth-related, listed for completeness |

### 3.3 — Auth middleware

`backend/src/middleware/auth.js`:
- `authMiddleware` — requires `Authorization: Bearer <token>` header, `jwt.verify(token, JWT_SECRET)`, sets `req.userId = decoded.userId`. Returns 401 on missing/invalid.
- `optionalAuth` — same flow but silently ignores invalid/missing tokens (no 401), `req.userId` remains undefined. Found exported but **NOT used** by any route — unused export.

### 3.4 — JWT contract

- Sign: `jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })` (utils/helpers.js:5)
- Verify: anywhere with header `Bearer <token>` OR WS protocol header `Bearer_<token>` (websocket/handler.js:55)
- **No refresh token mechanism** — single 30-day JWT, no rotation
- **No revoke list** — logout is client-side only (drop JWT from localStorage)

### 3.5 — Auth surface gaps for email-auth feature

Need (not present):
- ❌ `POST /v1/auth/forgot-password` (initiate reset email)
- ❌ `POST /v1/auth/reset-password` (consume reset token, set new password)
- ❌ Real `POST /v1/auth/verify-email` with token (current verify-email accepts any code blindly)
- ❌ `POST /v1/auth/resend-verification` (resend verify email)
- ❌ Email-as-login in `POST /v1/auth/login` (currently login by `User.login` field only, not email)
- ❌ Email collection in register (current register doesn't accept email param at all)

---

## 4. Email service

### 4.1 — Provider

**NOT configured.** Discovery results:

- **Zero email-related deps in `package.json`**: no `@sendgrid/mail`, `nodemailer`, `resend`, `postmark`, `mailgun-js`, `@aws-sdk/client-ses`, none.
- **Zero email-related env vars** in `backend/.env.example` (verified: only `DATABASE_URL`, `JWT_SECRET`, `PORT`, `WS_PORT`, `FRONTEND_URL`, `UPLOAD_DIR`, `ANTHROPIC_API_KEY`).
- **Zero email-related code** in `backend/src/`: grep `sendEmail|sendMail|nodemailer|sendgrid` returns 0 hits.
- **Zero email templates / mail / views directories**: full backend tree scan shows only `src/{data, lib, middleware, routes, services, utils, websocket}`, `prisma/`, `scripts/`, `tests/`. No `templates/`, `mail/`, `email/`, `views/`.

### 4.2 — Verdict

**Greenfield email infrastructure required.** Vendor decision pending (SendGrid / Postmark / Resend / Mailgun / AWS SES / SMTP self-host). Each requires:
1. npm dep + env var (e.g. `SENDGRID_API_KEY`)
2. Service module (e.g. `backend/src/services/emailService.js`) with `sendEmail({to, subject, html, text})` interface
3. Template files OR inline HTML (depending on vendor — SendGrid supports server-side templates, others need files)
4. Bounce/complaint webhook handler (optional but recommended for deliverability)
5. SPF/DKIM/DMARC DNS configuration on `hexlash.com` domain (Stream 4/infrastructure side, not pure code)

---

## 5. Referral system

### 5.1 — Backend handling

**Source:** `backend/src/routes/auth.js:28-56` — `processReferral(newUser, referralCode)` helper:

1. Skip if `referralCode` empty or self-referral (`referralCode === newUser.login`)
2. Lookup referrer by `prisma.user.findUnique({ where: { login: referralCode } })` — **referralCode is the referrer's `login`**, not a separate code field
3. If referrer not found — silent return (no error)
4. `$transaction` updates both users:
   - new user: set `referredBy = referrer.login`, `totalTaps += REFERRAL_REWARD_TAPS`
   - referrer: `invitedUsers += 1`, `totalTaps += REFERRAL_REWARD_TAPS`
5. Errors silently logged via `console.error` (fire-and-forget pattern)

`REFERRAL_REWARD_TAPS` constant defined in `config.js` (per CLAUDE.md = 500 taps both sides).

### 5.2 — Storage

- **`User.referredBy`**: String? nullable, stores referrer's `login` (not id)
- **`User.invitedUsers`**: Int counter on referrer
- **No separate `referrals` table** — relationship is purely `User.referredBy → User.login`

**Implications:**
- Single-hop only (A invited B, no chain)
- If referrer changes login (via `POST /user/edit` allowed-field), `referredBy` strings on referred users become stale (broken FK semantically)
- No timestamp on referral relation — `User.createdAt` of referred user is closest proxy

### 5.3 — Endpoint exposure

`GET /v1/user/referrals` (`backend/src/routes/user.js:384-414`, requires auth):

```json
{
  "data": {
    "referralCode": "<user's own login — used as code>",
    "referralCount": <user.invitedUsers>,
    "referredBy": "<login of who referred current user, or null>",
    "referrals": [
      { "login": "<referred user login>", "joinedAt": "<createdAt>" },
      ...
    ]
  }
}
```

- `referrals` array: `findMany({ where: { referredBy: user.login }, orderBy: { createdAt: 'desc' }, take: 50 })` — paginated (hardcoded limit 50, no offset) by createdAt desc, latest 50 invitees
- **No pagination cursor / total count beyond `invitedUsers`** — UI can show "you invited N users, 50 most recent listed"

### 5.4 — History tracking

✅ Yes — but minimally. Each invited user's `User.createdAt` is the join timestamp. No explicit "ReferralEvent" table tracking source → destination → reward amount → timestamp. Sufficient for current "who joined via you" UI, insufficient for analytics like "show conversion rate" or "rewards claimed history".

---

## 6. Security / Infrastructure notes

| Concern | Finding | Verdict |
|---|---|---|
| Password hashing | `bcrypt.hash(password, 10)` at `auth.js:115`, `bcrypt.compare` at `auth.js:74` | ✅ bcryptjs with rounds=10 — industry standard. Not Argon2 (would be stronger) but bcryptjs widely accepted. |
| Auth strategy | JWT only, 30-day expiry, no refresh token, no revoke list | ⚠️ Long expiry without rotation — acceptable for game session UX but if leaked token persists 30 days. **Not blocking email-auth feature** but worth noting for security pass later. |
| JWT secret | `JWT_SECRET` env var, server crashes on missing (config.js:3-4) | ✅ Hardened per CLAUDE.md Security Hardening section |
| Login rate limit | 5 attempts / 15 min / IP (auth.js:12-18) | ✅ |
| Register rate limit | 3 attempts / 1 hour / IP (auth.js:20-26) | ✅ |
| Reset rate limit | N/A (501 stub, no real handler) | — |
| Verify-email rate limit | **NONE** (user.js:151 verify-email handler has no limiter) | ⚠️ When email-auth ships, this needs limiter — currently not exploitable since handler is fake (accepts any code) but real handler will be a token brute-force vector |
| CORS allowed origins | `hexlash.com`, `www.hexlash.com`, `test.hexlash.com`, `hexlash.vercel.app` + `FRONTEND_URL` env + Vercel preview regex `^https://testhexlash-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$` | ✅ Explicit allowlist, regex anchored, project-prefixed |
| CORS preflight | `app.options('*', cors(corsOptions))` | ✅ |
| Helmet | `helmet **8.1.0**` dep present | ✅ Installed (verify usage in index.js per recommended next steps) |
| Trust proxy | `app.set('trust proxy', 1)` (index.js:27) | ✅ Required for accurate rate-limit IPs behind Vercel/Railway proxy |

### Red flags

- 🟡 **`POST /v1/user/verify-email` accepts ANY non-empty code** — currently a 1-line `update({ emailVerified: true })`. NOT a vulnerability today (no real semantics gated on `emailVerified`) but **MUST be replaced with token-based verification** when email auth ships. Otherwise users can spoof email verification with any string POST.

- 🟡 **`POST /v1/user/edit` allows email change without re-verification** — sets `email` directly via allowed-fields list (user.js:51), no validation that email format is valid, no re-trigger of `emailVerified=false`, no sending re-verify email. Real risk: user types valid email, then changes it to attacker's email later, bypasses verification. **MUST add email-change-triggers-reverification logic**.

- 🟡 **No email format validation anywhere** — `User.email` is `String` default `""`. No regex check on `/edit` or anywhere. Empty default means most existing users have `email=""`. Implicitly OK only because nothing reads `email` for security gates today.

- 🟢 **`updateJwtToken` pre-existing dead import** at `src/core/state/modules/masterState.js:10` — frontend-only, unrelated to backend audit. Carried forward from Stream 1 deferred carry-overs.

- 🟢 No plaintext passwords. No SQL injection (Prisma parametrized). No CSRF concern (JWT in Authorization header, not cookies). No obvious vector in audit scope.

---

## 7. Gap analysis для email auth task

### 7.1 — Schema changes required

| Change | Reason |
|---|---|
| Add `verifyToken` String? + `verifyTokenExpiresAt` DateTime? | Real email verification flow needs single-use server-issued tokens |
| Add `resetPasswordToken` String? + `resetPasswordExpiresAt` DateTime? | Real password reset flow needs single-use server-issued tokens |
| Change `email` from `String` default `""` → `String?` (nullable) | Empty string default is semantic abuse; nullable is correct shape for "not set" |
| Add `@@unique([email])` constraint conditional on email being non-null | Prevent two accounts with same email; PostgreSQL allows multiple NULLs in unique columns natively |
| Optional: add `@@index([email])` if login-by-email becomes feature | Faster lookup if querying users by email |
| Optional: add `previousEmail` String? + `emailUpdatedAt` DateTime? | Audit trail for email changes (debug + abuse investigation) |
| Optional: drop `initialVerified` field | Legacy artifact from telegram-as-auth era, no business logic gates on it currently. Out of email-auth scope per Lesson #18 — flag forward as separate cleanup |

**Migration strategy:** generate `npx prisma migrate dev --name add_email_auth_tokens` after schema edits. PostgreSQL handles NULL→empty backfill via `UPDATE users SET email = NULL WHERE email = ''` in custom SQL block, then run `prisma migrate deploy` on prod. Idempotent design recommended.

### 7.2 — New endpoints required

| Endpoint | Method | Body | Purpose |
|---|---|---|---|
| `/v1/auth/forgot-password` | POST | `{email}` | Generate `resetPasswordToken`, send email with reset URL containing token |
| `/v1/auth/reset-password` | POST | `{token, newPassword}` | Verify token + expiry, hash new password, clear token |
| `/v1/auth/verify-email` | POST | `{token}` | (replaces current `/v1/user/verify-email` stub) verify token + expiry, set `emailVerified=true`, clear token |
| `/v1/auth/resend-verification` | POST | requires JWT | Generate new `verifyToken`, send email |
| `/v1/auth/login` (modified) | POST | `{login OR email, password}` | Accept email as login alternative — extend lookup to `OR: [{ login }, { email }]` |
| `/v1/auth/register` (modified) | POST | `{login, email, password, referralCode?}` | Add email param, validate format, check uniqueness, generate verifyToken, send verify email |
| `/v1/user/edit` (modified) | POST | as-is, but on email change | Add: validate format, check uniqueness against other users, set `emailVerified=false`, generate new verifyToken, trigger verify email send |

Rate limits required for all new endpoints (same pattern as login/register limiters).

### 7.3 — Email infrastructure (greenfield)

| Item | Implementation |
|---|---|
| Vendor selection | User decision: SendGrid / Postmark / Resend / Mailgun / AWS SES / SMTP self-host |
| npm dep + env var | e.g. `@sendgrid/mail` + `SENDGRID_API_KEY` (add to `.env.example`) |
| Service module | `backend/src/services/emailService.js` with `sendEmail({to, subject, html, text})` interface, vendor-agnostic shape |
| Template files | `backend/src/services/email-templates/{verify-email, reset-password, welcome}.html` (+ optional plain-text `.txt` siblings) — handlebars-style `{{token}}` substitution OR vendor-side templates |
| Domain auth (DNS) | SPF + DKIM + DMARC records on `hexlash.com` (deliverability — out of code scope, infra task) |
| Bounce handling | Optional — vendor webhook → `backend/src/routes/email-webhook.js` → log/disable bounced addresses |

### 7.4 — Frontend changes required

(Not in audit scope per ТЗ §7 "что НЕ входит" but listing for next ТЗ author awareness.)

| Frontend change | File reference |
|---|---|
| Send `email` field in `master/register` payload | Already collected in `EmailForm.vue` (auth-redesign Эпик 9), commented out per `TODO(auth-email)` — uncomment + extend dispatch |
| Forgot password UI | New view OR overlay (auth-redesign deleted `/auth/reset` route in 1b C5; needs new entry point — could be link на login screen) |
| Verify-email view (token in URL) | Existing `/verify-email` route in router (per CLAUDE.md routes table) — verify it accepts `?token=...` query param + dispatches new BE endpoint |
| Resend verification button | In Profile or VerifyEmail banner — calls new `/v1/auth/resend-verification` |
| `EmailForm.vue` validation | Existing email regex client-side, keep |

---

## 8. Recommended next steps

1. **Vendor decision (BLOCKING)** — user picks email service provider. Affects npm dep + env var name + service module shape. Recommend Resend or Postmark for low setup friction; SendGrid for established choice; AWS SES for cost optimization at scale. SMTP self-host is high-effort, recommend against.

2. **Migration design (separate sub-epic ТЗ)** — one clean Prisma migration adding all 4 token fields + email type change + unique constraint. Idempotent + reversible. Test on local PostgreSQL before deploy. Per CLAUDE.md branch convention (5R Recovery #63), backend changes need cherry-pick PR к main, not continue stack.

3. **Endpoint design (separate sub-epic ТЗ)** — design 4-5 new endpoints + modify 3 existing. Define exact body/response shape, rate-limit policies, token expiry windows (typically 24h verify, 1h reset). Consider single-purpose endpoints vs combined (e.g. `/auth/email-action?type=verify|reset`).

4. **Email service module + templates (sub-epic part)** — `services/emailService.js` interface vendor-agnostic so future swap is single-file. Templates with i18n placeholders (current 11-locale support — replicate per-locale email templates? Or one English-only fallback initially?).

5. **Token security policy** — single-use (consumed on verification), expiry windows, cryptographically random (`crypto.randomBytes(32).toString('hex')` not `Math.random()` — CLAUDE.md Security Hardening §"Crypto temp password" precedent). Store as **hash** of token in DB (one-way), not raw token, to prevent DB-leak abuse — decision for ТЗ author.

6. **Replace fake `/v1/user/verify-email`** — current handler accepts any code, must be removed or repointed to new flow. Coordinate with frontend `VerifyEmailView.vue` consumer.

7. **Add email-change triggers re-verification** in `POST /v1/user/edit` — when `email` field changes, set `emailVerified=false` + regenerate verifyToken + send verify email.

8. **Backfill plan for existing users** — `email=""` rows: either nullable migration auto-converts (`UPDATE users SET email=NULL WHERE email=''`), OR force users to set email on next login via banner. Decision affects: do we accept accounts without email (login-only auth still works)? If yes, email is "optional but verified if set". If no, force-prompt all existing users.

9. **i18n for email templates** — 11 locales support exists in frontend; backend has no i18n infra. Start with English-only templates, add i18n in future polish stream if user requests multi-lang emails.

10. **Stream 1 surfaced carry-over to address before email-auth ТЗ author starts** — `updateJwtToken` pre-existing dead import in `masterState.js:10` (FE concern, not BE — minor cleanup, can be bundled into FE side of email-auth implementation).

### Suggested ТЗ split for email-auth implementation

- **Sub-epic A (BE schema + token infra):** migration + 4 token fields + crypto helpers + email service module skeleton + vendor selection
- **Sub-epic B (BE endpoints):** 4 new endpoints + 3 modified, full token lifecycle, rate limits, replacing fake verify-email
- **Sub-epic C (FE wiring):** uncomment email field in register payload, forgot-password UI, verify-email URL flow, resend button
- **Sub-epic D (templates + DNS):** template files per-vendor, DNS SPF/DKIM/DMARC setup, deliverability test

Each sub-epic ~1 PR. Sub-epic A blocking prerequisite for B; B/C parallelizable; D independent infra/polish.

---

## End of audit

Зеркало этого отчёта — `docs/BACKEND_AUDIT_EMAIL_AUTH.md`. No code changes made during audit per ТЗ §6 antipatterns.
