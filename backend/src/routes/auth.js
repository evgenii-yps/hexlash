const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { generateToken } = require('../utils/helpers');
const { TELEGRAM_BOT_TOKEN, TELEGRAM_AUTH_MAX_AGE_SEC } = require('../config');

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

const telegramLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many Telegram auth attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
    const { login: rawLogin, password } = req.body;
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

    const jwtToken = generateToken(user.id);
    res.json({ data: { jwtToken } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate Telegram WebApp initData signature
function validateTelegramPayload(payload) {
  if (!TELEGRAM_BOT_TOKEN) return false;
  const { hash, ...data } = payload;
  if (!hash) return false;

  // Check auth_date freshness
  if (data.auth_date) {
    const age = Math.floor(Date.now() / 1000) - parseInt(data.auth_date);
    if (age > TELEGRAM_AUTH_MAX_AGE_SEC) return false;
  }

  // Build data-check-string: sorted key=value pairs
  const checkString = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join('\n');

  // HMAC-SHA256 with key = SHA256(bot_token)
  const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  return hmac === hash;
}

// POST /v1/auth/telegram
router.post('/telegram', telegramLimiter, async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Telegram payload required' });
    }

    // Validate Telegram signature (skip only if bot token not configured)
    if (TELEGRAM_BOT_TOKEN && !validateTelegramPayload(payload)) {
      return res.status(403).json({ error: 'Invalid Telegram signature' });
    }

    const telegramId = payload.id || payload.user?.id;
    const telegramName = payload.first_name || payload.user?.first_name || 'TelegramUser';

    if (!telegramId) {
      return res.status(400).json({ error: 'Missing Telegram user ID' });
    }

    const login = `tg_${telegramId}`;

    let user = await prisma.user.findUnique({ where: { login } });

    if (!user) {
      const tempPassword = crypto.randomBytes(12).toString('base64url');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      user = await prisma.user.create({
        data: {
          login,
          password: hashedPassword,
          name: telegramName,
          balance: 1000000,
        },
      });

      const jwtToken = generateToken(user.id);
      return res.json({
        data: { jwtToken, tempPassword, name: telegramName },
      });
    }

    const jwtToken = generateToken(user.id);
    res.json({ data: { jwtToken } });
  } catch (err) {
    console.error('Telegram auth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
