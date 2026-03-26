const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { formatClubResponse } = require('../utils/helpers');
const { COST_CREATE_CLUB, DECIMALS } = require('../config');

const router = express.Router();

// GET /v1/club/id/:clubId
router.get('/id/:clubId', authMiddleware, async (req, res) => {
  try {
    const club = await prisma.club.findUnique({
      where: { id: req.params.clubId },
      include: { _count: { select: { members: true } } },
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json({ data: formatClubResponse(club) });
  } catch (err) {
    console.error('Get club error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/add
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { clubData } = req.body;
    if (!clubData || !clubData.name) {
      return res.status(400).json({ error: 'Club name required' });
    }

    // Validate name and description
    const name = clubData.name.trim();
    if (!/^[a-zA-Z0-9 ]{1,32}$/.test(name)) {
      return res.status(400).json({ error: 'Club name must be 1-32 characters, only letters, digits and spaces' });
    }
    const description = (clubData.description || '').trim().slice(0, 500);

    // Check if user is not already in a club
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.clubId) {
      return res.status(400).json({ error: 'Already in a club' });
    }

    const isPublic = clubData.isPublic !== undefined ? clubData.isPublic : true;

    const fullClub = await prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          name,
          description,
          ownerId: req.userId,
          isPublic,
        },
      });

      await tx.user.update({
        where: { id: req.userId },
        data: {
          clubId: club.id,
          clubRole: 'owner',
        },
      });

      return tx.club.findUnique({
        where: { id: club.id },
        include: { _count: { select: { members: true } } },
      });
    });

    res.json({ data: formatClubResponse(fullClub) });
  } catch (err) {
    console.error('Create club error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/edit
router.post('/edit', authMiddleware, async (req, res) => {
  try {
    const { clubId, name, description, isPublic } = req.body;
    if (!clubId) {
      return res.status(400).json({ error: 'Club ID required' });
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    if (club.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only club owner can edit' });
    }

    const updateData = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!/^[a-zA-Z0-9 ]{1,32}$/.test(trimmedName)) {
        return res.status(400).json({ error: 'Club name must be 1-32 characters, only letters, digits and spaces' });
      }
      updateData.name = trimmedName;
    }
    if (description !== undefined) updateData.description = description.trim().slice(0, 500);
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updated = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      include: { _count: { select: { members: true } } },
    });

    res.json({ data: formatClubResponse(updated) });
  } catch (err) {
    console.error('Edit club error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/put-avatar
router.post('/put-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.clubId) {
      return res.status(400).json({ error: 'User is not in a club' });
    }

    const club = await prisma.club.findUnique({ where: { id: user.clubId } });
    if (club.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only club owner can change avatar' });
    }

    const avatarUrl = req.file.filename;
    await prisma.club.update({
      where: { id: user.clubId },
      data: { avatarUrl },
    });

    res.json({ data: { id: user.clubId, avatarUrl } });
  } catch (err) {
    console.error('Club avatar error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/change
router.post('/change', authMiddleware, async (req, res) => {
  try {
    const { clubId } = req.body;

    if (clubId) {
      // Joining a club
      const club = await prisma.club.findUnique({
        where: { id: clubId },
        include: { _count: { select: { members: true } } },
      });
      if (!club) {
        return res.status(404).json({ error: 'Club not found' });
      }
      if (!club.isPublic) {
        return res.status(403).json({ error: 'Club is private' });
      }
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (user.clubId === clubId) {
        return res.status(400).json({ error: 'Already in this club' });
      }
      if (club._count.members >= club.maxMembers) {
        return res.status(400).json({ error: 'Club is full' });
      }

      await prisma.user.update({
        where: { id: req.userId },
        data: { clubId, clubRole: 'member' },
      });

      const fullClub = await prisma.club.findUnique({
        where: { id: clubId },
        include: { _count: { select: { members: true } } },
      });
      return res.json({ data: formatClubResponse(fullClub) });
    }

    // Leaving a club
    await prisma.user.update({
      where: { id: req.userId },
      data: { clubId: null, clubRole: null },
    });

    res.json({ data: null });
  } catch (err) {
    console.error('Change club error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/club/search
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const {
      name = '',
      sortBy = 'battles',
      sortDirection = 'DESC',
      page = '0',
      size = '10',
    } = req.query;

    const pageNum = parseInt(page);
    const pageSize = Math.min(parseInt(size), 50);

    const sortField = {
      battles: 'battles',
      wins: 'wins',
      balance: 'balance',
      name: 'name',
      members: 'members',
    }[sortBy] || 'battles';

    const sortOrder = sortDirection.toLowerCase();
    const orderBy = sortField === 'members'
      ? { members: { _count: sortOrder } }
      : { [sortField]: sortOrder };

    const where = {};
    if (name) {
      where.name = { contains: name };
    }

    const clubs = await prisma.club.findMany({
      where,
      include: { _count: { select: { members: true } } },
      orderBy,
      skip: pageNum * pageSize,
      take: pageSize,
    });

    res.json({ data: clubs.map(formatClubResponse) });
  } catch (err) {
    console.error('Search clubs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/set-role
router.post('/set-role', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role required' });
    }
    if (!['deputy', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "deputy" or "member"' });
    }

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requester.clubId) {
      return res.status(400).json({ error: 'You are not in a club' });
    }

    const club = await prisma.club.findUnique({ where: { id: requester.clubId } });
    if (club.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only club owner can set roles' });
    }

    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.clubId !== requester.clubId) {
      return res.status(400).json({ error: 'User is not a member of this club' });
    }

    if (role === 'deputy') {
      const deputyCount = await prisma.user.count({
        where: { clubId: requester.clubId, clubRole: 'deputy' },
      });
      if (deputyCount >= 3) {
        return res.status(400).json({ error: 'Maximum 3 deputies allowed' });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { clubRole: role },
    });

    res.json({ data: { userId, role } });
  } catch (err) {
    console.error('Set role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/transfer-ownership
router.post('/transfer-ownership', authMiddleware, async (req, res) => {
  try {
    const { newOwnerId } = req.body;

    if (!newOwnerId) {
      return res.status(400).json({ error: 'newOwnerId required' });
    }

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requester.clubId) {
      return res.status(400).json({ error: 'You are not in a club' });
    }

    const club = await prisma.club.findUnique({ where: { id: requester.clubId } });
    if (club.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only club owner can transfer ownership' });
    }

    if (newOwnerId === req.userId) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    const target = await prisma.user.findUnique({ where: { id: newOwnerId } });
    if (!target || target.clubId !== requester.clubId) {
      return res.status(400).json({ error: 'User is not a member of this club' });
    }

    // Determine old owner's new role
    const deputyCount = await prisma.user.count({
      where: { clubId: requester.clubId, clubRole: 'deputy' },
    });
    const oldOwnerRole = deputyCount < 3 ? 'deputy' : 'member';

    await prisma.$transaction([
      prisma.club.update({
        where: { id: requester.clubId },
        data: { ownerId: newOwnerId },
      }),
      prisma.user.update({
        where: { id: newOwnerId },
        data: { clubRole: 'owner' },
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { clubRole: oldOwnerRole },
      }),
    ]);

    res.json({ data: { newOwnerId, oldOwnerRole } });
  } catch (err) {
    console.error('Transfer ownership error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/kick
router.post('/kick', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot kick yourself' });
    }

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requester.clubId) {
      return res.status(400).json({ error: 'You are not in a club' });
    }

    const club = await prisma.club.findUnique({ where: { id: requester.clubId } });
    const isOwner = club.ownerId === req.userId;
    const isDeputy = requester.clubRole === 'deputy';

    if (!isOwner && !isDeputy) {
      return res.status(403).json({ error: 'Only owner or deputy can kick members' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.clubId !== requester.clubId) {
      return res.status(400).json({ error: 'User is not a member of this club' });
    }

    // Deputies can only kick regular members
    if (isDeputy && target.clubRole !== 'member') {
      return res.status(403).json({ error: 'Deputies can only kick regular members' });
    }

    // Owner cannot be kicked
    if (target.clubRole === 'owner') {
      return res.status(403).json({ error: 'Cannot kick the club owner' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { clubId: null, clubRole: null },
    });

    res.json({ data: { kickedUserId: userId } });
  } catch (err) {
    console.error('Kick member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
