const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { formatUserResponse, formatUserPublicResponse, generateRandomToken } = require('../utils/helpers');
const { sendVerifyEmail } = require('../services/emailService');

const router = express.Router();

// ── Email Auth Phase 4 — helpers + rate limiters ───────────────────────────

// Mirror auth.js EMAIL_RE (contract lock — same regex on both sides of API).
// If auth.js EMAIL_RE drifts, auth.test.js + this file's edit endpoint will
// disagree. Tests/auth.test.js "Email validation regex (contract lock)"
// catches drift.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email);
}

function normalizeEmail(email) {
  return String(email).toLowerCase().trim();
}

// verify-email rate limiter — IP-based, public endpoint (no auth — token is auth)
const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many verification attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// resend-verification rate limiter — per user (NOT per IP — prevents user
// spamming themselves), 1 request per 5 minutes. authMiddleware sets
// req.userId BEFORE limiter runs (middleware order in route chain below).
const resendVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1,
  message: { error: 'Verification email already sent — try again in 5 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // req.userId is set by authMiddleware (which runs before this limiter).
    // Fall back to IP if userId missing (shouldn't happen — auth fails first).
    return req.userId || req.ip || 'unknown';
  },
});

// GET /v1/user/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: formatUserResponse(user) });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/user/edit
// Email Auth Phase 4 — closes red flag #2: email change now invalidates
// emailVerified + regenerates verifyToken + sends re-verify email + clears
// pending resetToken. Other fields keep existing behavior.
router.post('/edit', authMiddleware, async (req, res) => {
  try {
    const { profileData } = req.body;
    if (!profileData) {
      return res.status(400).json({ error: 'Profile data required' });
    }

    // ── Email Auth Phase 4 — handle email branch separately ───────────────
    // Strategy: pop email out of profileData, handle it explicitly with
    // validation + uniqueness + reverify logic. Other fields flow through
    // the existing generic loop unchanged.
    let emailUpdate = null; // null = no email change; object = fields to set
    let emailRecipient = null; // address to send verify email AFTER DB update
    let emailTokenForSend = null; // token to embed in verify email

    if (profileData.email !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { email: true },
      });
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Defensive — owner decision: forbid removal of email via /edit.
      // Users wanting to remove email should use /delete (full account
      // removal) or contact support. Empty string / null / whitespace-only
      // → 400 "Cannot remove email". Prevents accidental data loss from
      // UI bugs or typos. To remove: set email to a different valid
      // address (which reverifies) — never to empty.
      const rawEmail = profileData.email;
      if (rawEmail === null || (typeof rawEmail === 'string' && rawEmail.trim() === '')) {
        return res.status(400).json({ error: 'Cannot remove email' });
      }

      if (!isValidEmail(String(rawEmail).trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const normalized = normalizeEmail(rawEmail);

      if (currentUser.email === normalized) {
        // Same email — no-op, fall through к generic field loop without
        // email-related side effects
      } else {
        // Actual change — uniqueness check + reverify cascade
        const existingByEmail = await prisma.user.findFirst({
          where: { email: normalized, NOT: { id: req.userId } },
        });
        if (existingByEmail) {
          return res.status(409).json({ error: 'Email already in use' });
        }

        const newVerifyToken = generateRandomToken();
        const newVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        emailUpdate = {
          email: normalized,
          emailVerified: false,
          verifyToken: newVerifyToken,
          verifyTokenExpiresAt: newVerifyTokenExpiresAt,
          // Clear any pending reset — old reset token attacker-resistant on
          // email change (compromised reset link can't redirect к new email)
          resetToken: null,
          resetTokenExpiresAt: null,
        };
        emailRecipient = normalized;
        emailTokenForSend = newVerifyToken;
      }

      // Remove email from profileData so the generic loop below doesn't
      // overwrite the carefully-constructed emailUpdate
      delete profileData.email;
    }

    // Generic field loop — account fields only (game 'skin' removed in reset)
    const allowedFields = ['name', 'login', 'walletAddress'];
    const updateData = {};
    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field];
      }
    }

    // Validate login uniqueness if changing login
    if (updateData.login) {
      const existing = await prisma.user.findFirst({
        where: { login: { equals: updateData.login, mode: 'insensitive' }, NOT: { id: req.userId } },
      });
      if (existing) {
        return res.status(409).json({ error: 'Login already taken' });
      }
    }

    // Merge email branch into updateData if email actually changed
    const finalUpdate = emailUpdate ? { ...updateData, ...emailUpdate } : updateData;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: finalUpdate,
    });

    // Send verify email AFTER successful DB update — non-blocking.
    // If send fails, user keeps emailVerified=false (correct state) and can
    // retry via /v1/user/resend-verification.
    if (emailRecipient && emailTokenForSend) {
      const sendResult = await sendVerifyEmail(emailRecipient, emailTokenForSend);
      if (!sendResult.ok) {
        console.error(
          `[edit] reverify email send failed for user=${req.userId} email=${emailRecipient}:`,
          sendResult.error
        );
      }
    }

    res.json({ data: formatUserResponse(user) });
  } catch (err) {
    console.error('Edit user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sub-epic email-auth Phase 4 — POST /v1/user/reset 501 stub DELETED.
// Replaced by POST /v1/auth/forgot-password + /v1/auth/reset-password
// (Phase 3, PR #373 merged). Zero consumers verified pre-delete.

// POST /v1/user/delete
router.post('/delete', authMiddleware, async (req, res) => {
  try {
    // Game-cleanup reset: all game relation tables were dropped, so the user
    // record has no remaining dependents to cascade — a plain delete suffices.
    await prisma.user.delete({ where: { id: req.userId } });

    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/user/verify-email
// Email Auth Phase 4 — FIX red flag #1 (was: accepted any "code" blindly,
// set emailVerified=true for authenticated user — bypassed actual email
// verification entirely).
//
// New: token-based verification. Token in body IS the authentication —
// no JWT required, since user clicks link from email и may not have an
// active session. Token is single-use (cleared on success) и time-bounded
// (24h TTL set at register/edit/resend-verification).
router.post('/verify-email', verifyEmailLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { verifyToken: token },
    });

    // Generic message for both not-found и expired — same shape avoids
    // distinguishing token validity vs expiry by response timing/content
    if (!user || !user.verifyTokenExpiresAt || user.verifyTokenExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExpiresAt: null,
      },
    });

    res.json({ data: formatUserResponse(updatedUser) });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/user/resend-verification
// Email Auth Phase 4 — auth-required endpoint to request a fresh verify
// email. Used by frontend banner "Verify your email — Resend" button.
// Throttled 1 request per 5 min per user (resendVerificationLimiter).
//
// Pre-conditions enforced:
// - User must be authenticated (JWT — middleware order: auth before limiter
//   so req.userId is set when limiter keyGenerator runs)
// - User must have email set (cannot resend if email=null)
// - User must NOT already be verified (waste otherwise; 400 explicit)
router.post('/resend-verification', authMiddleware, resendVerificationLimiter, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    if (!user.email) {
      return res.status(400).json({ error: 'No email associated with account' });
    }

    const newToken = generateRandomToken();
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken: newToken,
        verifyTokenExpiresAt: newExpiresAt,
      },
    });

    // Non-blocking — log failure but still return success.
    // Avoids leaking infra issues; if send genuinely failed, user can
    // retry after rate-limit window (5 min).
    const sendResult = await sendVerifyEmail(user.email, newToken);
    if (!sendResult.ok) {
      console.error(
        `[resend-verification] send failed for user=${user.id} email=${user.email}:`,
        sendResult.error
      );
    }

    res.json({ data: { message: 'Verification email sent' } });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/user/put-avatar
router.post('/put-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = req.file.filename;
    await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl },
    });

    res.json({ data: { avatarUrl } });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/user/login/:login
router.get('/login/:login', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { login: req.params.login },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: formatUserPublicResponse(user) });
  } catch (err) {
    console.error('Get user by login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/user/id/:id
router.get('/id/:id', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: formatUserPublicResponse(user) });
  } catch (err) {
    console.error('Get user by id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/user/search
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const {
      name = '',
      sortBy = 'name',
      sortDirection = 'ASC',
      page = '0',
      size = '10',
    } = req.query;

    const pageNum = parseInt(page);
    const pageSize = Math.min(parseInt(size), 50);

    // Game-cleanup reset: game sort fields (battles/wins/balance) removed —
    // only account fields remain sortable.
    const sortField = {
      name: 'name',
      login: 'login',
      createdAt: 'createdAt',
    }[sortBy] || 'name';

    const where = {};
    if (name) {
      where.OR = [
        { name: { contains: name, mode: 'insensitive' } },
        { login: { contains: name, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { [sortField]: sortDirection.toLowerCase() },
      skip: pageNum * pageSize,
      take: pageSize,
    });

    res.json({ data: users.map(u => formatUserPublicResponse(u)) });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/user/referrals
router.get('/referrals', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { login: true, invitedUsers: true, referredBy: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const referrals = await prisma.user.findMany({
      where: { referredBy: user.login },
      select: { login: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      data: {
        referralCode: user.login,
        referralCount: user.invitedUsers,
        referredBy: user.referredBy,
        referrals: referrals.map(r => ({ login: r.login, joinedAt: r.createdAt })),
      },
    });
  } catch (err) {
    console.error('Get referrals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
