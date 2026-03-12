const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// POST /v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login: rawLogin, password } = req.body;
    const login = rawLogin?.trim();
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { login } });
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
router.post('/register', async (req, res) => {
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

    const existing = await prisma.user.findUnique({ where: { login } });
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

// POST /v1/auth/telegram
router.post('/telegram', async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Telegram payload required' });
    }

    // For now, create or find user based on telegram data
    const telegramId = payload.id || payload.user?.id;
    const telegramName = payload.first_name || payload.user?.first_name || 'TelegramUser';
    const login = `tg_${telegramId}`;

    let user = await prisma.user.findUnique({ where: { login } });

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8);
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
    const existing = await prisma.user.findUnique({ where: { login } });
    res.json({ data: { available: !existing } });
  } catch (err) {
    console.error('Login check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
