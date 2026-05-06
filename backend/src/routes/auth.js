const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { generateToken } = require('../utils/helpers');
const { REFERRAL_REWARD_TAPS } = require('../config');

const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiters for auth endpoints
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

// POST /v1/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { login: rawLogin, password } = req.body;
    const login = rawLogin?.trim();
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: { login: { equals: login, mode: 'insensitive' } },
    });
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
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { login: rawLogin, password, referralCode } = req.body;
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

    const existing = await prisma.user.findFirst({
      where: { login: { equals: login, mode: 'insensitive' } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Login already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        login,
        password: hashedPassword,
        name: login,
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

module.exports = router;
