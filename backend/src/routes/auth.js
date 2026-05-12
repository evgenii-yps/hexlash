const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { generateToken, generateRandomToken } = require('../utils/helpers');
const { REFERRAL_REWARD_TAPS } = require('../config');
const { sendVerifyEmail, sendResetEmail } = require('../services/emailService');

const rateLimit = require('express-rate-limit');

const router = express.Router();

// ── Rate limiters ──────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many registration attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email Auth Phase 3 — forgot-password rate limiter.
// Per-(IP, email) tuple keying. Uses lowercased email from body to prevent
// case-variation bypass. Falls back to IP-only if body.email missing/empty
// (still throttles unauthenticated probes). Generic 200 response from
// handler ensures rate limit response itself doesn't leak email existence.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  // Generic message — same shape as success path, no email-leak vector
  message: { message: "If this email is registered and verified, you'll receive a reset link." },
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    const email = (req.body && req.body.email && typeof req.body.email === 'string')
      ? req.body.email.toLowerCase().trim()
      : '';
    return email ? `${ip}|${email}` : ip;
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many password reset attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Helpers ────────────────────────────────────────────────────────────────

// RFC-lite email regex — practical, matches what FE EmailForm.vue uses.
// Pre-validation, NOT authoritative — Resend SDK + DNS will reject truly
// invalid recipient addresses at send time.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email);
}

function normalizeEmail(email) {
  return String(email).toLowerCase().trim();
}

// Process referral reward for a newly created user
async function processReferral(newUser, referralCode) {
  if (!referralCode || referralCode === newUser.login) return;
  try {
    const referrer = await prisma.user.findUnique({
      where: { login: referralCode },
    });
    if (!referrer) return;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: newUser.id },
        data: {
          referredBy: referrer.login,
          totalTaps: { increment: REFERRAL_REWARD_TAPS },
        },
      }),
      prisma.user.update({
        where: { id: referrer.id },
        data: {
          invitedUsers: { increment: 1 },
          totalTaps: { increment: REFERRAL_REWARD_TAPS },
        },
      }),
    ]);
  } catch (err) {
    console.error('Referral processing error:', err);
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────

// POST /v1/auth/login
// Body: { login, password }. `login` field accepts handle OR email.
// Detection: presence of '@' → email lookup, else handle lookup.
// Both lookups case-insensitive (login via Prisma `mode: 'insensitive'`,
// email via app-side toLowerCase).
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { login: rawLogin, password } = req.body;
    const loginOrEmail = rawLogin?.trim();
    if (!loginOrEmail || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    // Email Auth Phase 3 — handle-or-email detection via '@' presence
    let user;
    if (loginOrEmail.includes('@')) {
      const normalizedEmail = normalizeEmail(loginOrEmail);
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } else {
      user = await prisma.user.findFirst({
        where: { login: { equals: loginOrEmail, mode: 'insensitive' } },
      });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    const jwtToken = generateToken(user.id);
    res.json({ data: { jwtToken } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/auth/register
// Body: { login, password, email?, referralCode? }
// Email is OPTIONAL — wallet-only / handle-only users may register without it.
// If email provided: validated, normalized, uniqueness-checked, then a verify
// token is generated + verification email sent (non-blocking — registration
// succeeds even if email send fails; user can resend via Phase 4 endpoint).
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { login: rawLogin, password, email: rawEmail, referralCode } = req.body;
    const login = rawLogin?.trim();
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    if (login.length < 3 || login.length > 30) {
      return res.status(400).json({ error: 'Login must be 3-30 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Email Auth Phase 3 — optional email validation + uniqueness
    let normalizedEmail = null;
    if (rawEmail !== undefined && rawEmail !== null && String(rawEmail).trim() !== '') {
      if (!isValidEmail(String(rawEmail).trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      normalizedEmail = normalizeEmail(rawEmail);
      const existingByEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingByEmail) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const existing = await prisma.user.findFirst({
      where: { login: { equals: login, mode: 'insensitive' } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Login already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Email Auth Phase 3 — generate verifyToken iff email provided
    let verifyToken = null;
    let verifyTokenExpiresAt = null;
    if (normalizedEmail) {
      verifyToken = generateRandomToken();
      verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    }

    const user = await prisma.user.create({
      data: {
        login,
        password: hashedPassword,
        name: login,
        email: normalizedEmail,
        emailVerified: false,
        verifyToken,
        verifyTokenExpiresAt,
        balance: 1000000, // 1.0 token starting balance (DECIMALS=6)
      },
    });

    // Grant NEWBIE achievement
    const newbieAch = await prisma.achievement.findUnique({ where: { type: 'NEWBIE' } });
    if (newbieAch) {
      await prisma.userAchievement.create({
        data: { userId: user.id, achievementId: newbieAch.id },
      });
    }

    // Process referral reward
    await processReferral(user, referralCode?.trim());

    // Email Auth Phase 3 — send verify email iff email provided
    // Non-blocking: failure logged but registration succeeds. User retries
    // via /v1/user/resend-verification (Phase 4 endpoint).
    if (normalizedEmail && verifyToken) {
      const sendResult = await sendVerifyEmail(normalizedEmail, verifyToken);
      if (!sendResult.ok) {
        console.error(
          `[register] verify email send failed for user=${user.id} email=${normalizedEmail}:`,
          sendResult.error
        );
      }
    }

    const jwtToken = generateToken(user.id);
    res.json({ data: { jwtToken } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sub-epic 1b C8: validateTelegramPayload helper + POST /auth/telegram handler
// DELETED (decision #2 — Telegram-as-auth excised). Existing tg_<id> login users
// (0 in prod per Phase 0 §6.4 audit) can still authenticate via password if known.

// GET /v1/auth/login-available/:login
router.get('/login-available/:login', async (req, res) => {
  try {
    const { login } = req.params;
    const existing = await prisma.user.findFirst({
      where: { login: { equals: login, mode: 'insensitive' } },
    });
    res.json({ data: { available: !existing } });
  } catch (err) {
    console.error('Login check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/auth/forgot-password
// Body: { email }
// Email Auth Phase 3 — initiates password reset flow.
//
// Critical security invariant: response is GENERIC 200 in ALL cases —
// success, email-not-found, email-not-verified, rate-limited. NEVER
// leak whether email exists in the system. Side effect (sending email)
// happens iff user exists AND emailVerified=true.
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  // Generic response — every code path returns this exact shape
  const GENERIC_RESPONSE = {
    message: "If this email is registered and verified, you'll receive a reset link.",
  };

  try {
    const { email } = req.body;

    // Validate format — invalid emails get 400 (different from "not found")
    // because the request body itself is malformed
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // No user OR user not verified → return generic 200, NO email sent.
    // Both branches indistinguishable to caller — prevents enumeration.
    if (!user || !user.emailVerified) {
      return res.json(GENERIC_RESPONSE);
    }

    // Generate reset token (1h TTL — stricter than verify's 24h per security)
    const resetToken = generateRandomToken();
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt },
    });

    // Non-blocking send — log failure but still return generic 200
    const sendResult = await sendResetEmail(normalizedEmail, resetToken);
    if (!sendResult.ok) {
      console.error(
        `[forgot-password] reset email send failed for user=${user.id}:`,
        sendResult.error
      );
    }

    return res.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error('Forgot password error:', err);
    // Even on internal error, return generic 200 — internal error reveals
    // nothing about email existence. Logged server-side for diagnosis.
    return res.json(GENERIC_RESPONSE);
  }
});

// POST /v1/auth/reset-password
// Body: { token, newPassword }
// Email Auth Phase 3 — completes password reset, auto-logs in user.
//
// Token is single-use (cleared on success) and time-bounded (1h TTL).
// Returns JWT on success — convenience UX so user lands logged-in after
// reset (avoids extra login step right after password change).
router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    // Generic message for "not found" + "expired" — same shape avoids
    // distinguishing token validity vs expiry by response timing/content
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    // Auto-login after reset — issue fresh JWT
    const jwtToken = generateToken(user.id);
    res.json({ data: { jwtToken } });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
