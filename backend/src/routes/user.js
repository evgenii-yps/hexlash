const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { formatUserResponse } = require('../utils/helpers');

const router = express.Router();

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

    const allowedFields = ['name', 'login', 'email', 'language', 'skin', 'walletAddress'];
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
// TODO: implement password reset with email token
router.post('/reset', (req, res) => {
  res.status(501).json({ error: 'Password reset is not yet implemented' });
});

// POST /v1/user/delete
router.post('/delete', authMiddleware, async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const userId = req.userId;

      // Remove user from clubs they belong to (not owner)
      await tx.user.update({
        where: { id: userId },
        data: { clubId: null },
      });

      // Transfer or delete owned clubs
      const ownedClubs = await tx.club.findMany({ where: { ownerId: userId } });
      for (const club of ownedClubs) {
        // Find another member to transfer ownership
        const otherMember = await tx.user.findFirst({
          where: { clubId: club.id, NOT: { id: userId } },
        });
        if (otherMember) {
          await tx.club.update({
            where: { id: club.id },
            data: { ownerId: otherMember.id },
          });
        } else {
          // No other members — delete the club
          await tx.club.delete({ where: { id: club.id } });
        }
      }

      // Delete all related records
      await tx.userAchievement.deleteMany({ where: { userId } });
      await tx.userSocialTask.deleteMany({ where: { userId } });
      await tx.userDailyTask.deleteMany({ where: { userId } });
      await tx.punchInfo.deleteMany({ where: { userId } });

      // Nullify optional fight references (preserve fight history where possible)
      await tx.fight.updateMany({ where: { fighterTwoId: userId }, data: { fighterTwoId: null } });
      await tx.fight.updateMany({ where: { winnerId: userId }, data: { winnerId: null } });
      // Delete fights where user is the required fighterOne (can't nullify required FK)
      await tx.fight.deleteMany({ where: { fighterOneId: userId } });

      // Delete friend requests and friendships
      await tx.friendRequest.deleteMany({
        where: { OR: [{ fromId: userId }, { toId: userId }] },
      });
      await tx.friendship.deleteMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/user/verify-email
// TODO: implement proper verification with email token instead of accepting any code
router.post('/verify-email', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    // Only allow verifying the authenticated user's own email
    await prisma.user.update({
      where: { id: req.userId },
      data: { emailVerified: true },
    });

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
        { name: { contains: name, mode: 'insensitive' } },
        { login: { contains: name, mode: 'insensitive' } },
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

// PUT /v1/user/skin
// Valid skin patterns: skin_m_1.png, skin_w_26.png, vip_k1.png, vip_t2.png
const VALID_SKIN_PATTERN = /^(skin_(m|w)_\d{1,3}|vip_(k|t)\d{1,2})\.png$/;

router.put('/skin', authMiddleware, async (req, res) => {
  try {
    const { skin } = req.body;
    if (!skin || typeof skin !== 'string' || !VALID_SKIN_PATTERN.test(skin)) {
      return res.status(400).json({ error: 'Invalid skin value' });
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { skin },
    });

    res.json({ data: { skin: updated.skin } });
  } catch (err) {
    console.error('[USER] Skin error:', err);
    res.status(500).json({ error: 'Failed to save skin' });
  }
});

// PUT /v1/user/progression
router.put('/progression', authMiddleware, async (req, res) => {
  try {
    const { progression, deck } = req.body;
    const data = {};

    if (progression !== undefined) {
      if (progression.moveLevels) {
        for (const [moveId, level] of Object.entries(progression.moveLevels)) {
          if (level > 5 || level < 1) {
            return res.status(400).json({ error: 'Invalid move level' });
          }
        }
      }
      if (progression.branchXP) {
        for (const [branch, xp] of Object.entries(progression.branchXP)) {
          if (xp < 0) {
            return res.status(400).json({ error: 'Invalid XP value' });
          }
        }
      }
      data.progression = progression;
    }

    if (deck !== undefined) {
      if (!Array.isArray(deck) || deck.length > 8) {
        return res.status(400).json({ error: 'Invalid deck' });
      }
      data.deck = deck;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No data to update' });
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data,
    });

    res.json({ data: { progression: updated.progression, deck: updated.deck } });
  } catch (err) {
    console.error('[USER] Progression error:', err);
    res.status(500).json({ error: 'Failed to save progression' });
  }
});

// PUT /v1/user/settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { language, settings } = req.body;
    const data = {};

    if (language !== undefined) data.language = language;
    if (settings !== undefined) data.settings = settings;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No data to update' });
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data,
    });

    res.json({ data: { language: updated.language, settings: updated.settings } });
  } catch (err) {
    console.error('[USER] Settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
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
