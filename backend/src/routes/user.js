const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { formatUserResponse } = require('../utils/helpers');

const router = express.Router();
const prisma = new PrismaClient();

// GET /v1/user/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { achievements: true },
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
router.post('/edit', authMiddleware, async (req, res) => {
  try {
    const { profileData } = req.body;
    if (!profileData) {
      return res.status(400).json({ error: 'Profile data required' });
    }

    const allowedFields = ['name', 'email', 'language', 'skin', 'walletAddress'];
    const updateData = {};
    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field];
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      include: { achievements: true },
    });

    res.json({ data: formatUserResponse(user) });
  } catch (err) {
    console.error('Edit user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/user/reset
router.post('/reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ data: { success: true } });
    }

    // In production, send a password reset email here
    // For now, just return success
    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/user/delete
router.post('/delete', authMiddleware, async (req, res) => {
  try {
    await prisma.userAchievement.deleteMany({ where: { userId: req.userId } });
    await prisma.userSocialTask.deleteMany({ where: { userId: req.userId } });
    await prisma.userDailyTask.deleteMany({ where: { userId: req.userId } });
    await prisma.punchInfo.deleteMany({ where: { userId: req.userId } });
    await prisma.user.delete({ where: { id: req.userId } });

    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/user/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    // In production, verify the code and update user
    // For now, accept any code and mark as verified
    const { code, userId } = req.body;

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });
    }

    res.json({ data: true });
  } catch (err) {
    console.error('Verify email error:', err);
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
      include: { achievements: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: formatUserResponse(user) });
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
      include: { achievements: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: formatUserResponse(user) });
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
      sortBy = 'battles',
      sortDirection = 'DESC',
      page = '0',
      size = '10',
      clubId = null,
    } = req.query;

    const pageNum = parseInt(page);
    const pageSize = Math.min(parseInt(size), 50);

    const sortField = {
      battles: 'totalFights',
      wins: 'wins',
      balance: 'balance',
      name: 'name',
    }[sortBy] || 'totalFights';

    const where = {};
    if (name) {
      where.OR = [
        { name: { contains: name } },
        { login: { contains: name } },
      ];
    }
    if (clubId) {
      where.clubId = clubId;
    }

    const users = await prisma.user.findMany({
      where,
      include: { achievements: true },
      orderBy: { [sortField]: sortDirection.toLowerCase() },
      skip: pageNum * pageSize,
      take: pageSize,
    });

    res.json({ data: users.map(formatUserResponse) });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
