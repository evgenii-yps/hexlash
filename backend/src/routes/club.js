const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { formatClubResponse, awardAchievement } = require('../utils/helpers');
const { COST_CREATE_CLUB, DECIMALS } = require('../config');
const { createClanEvent } = require('../utils/clanEvents');

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
    const sanitizedName = name.replace(/\s{2,}/g, ' ');
    if (!/^[\p{L}\p{N} ]{3,30}$/u.test(sanitizedName)) {
      return res.status(400).json({ error: 'Club name must be 3-30 characters, only letters, digits and spaces' });
    }
    const description = (clubData.description || '').trim().slice(0, 500);

    // Check if user is not already in a club
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.clubId) {
      return res.status(400).json({ error: 'Already in a club' });
    }

    // Check if user has enough taps
    if (user.totalTaps < COST_CREATE_CLUB) {
      return res.status(400).json({ error: 'Not enough taps' });
    }

    const isPublic = clubData.isPublic !== undefined ? clubData.isPublic : true;

    const fullClub = await prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          name: sanitizedName,
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
          totalTaps: { decrement: COST_CREATE_CLUB },
        },
      });

      return tx.club.findUnique({
        where: { id: club.id },
        include: { _count: { select: { members: true } } },
      });
    });

    // Award PAPER_STREET achievement for creating a club
    awardAchievement(prisma, req.userId, 'PAPER_STREET').catch(() => {});

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
      const trimmedName = name.trim().replace(/\s{2,}/g, ' ');
      if (!/^[\p{L}\p{N} ]{3,30}$/u.test(trimmedName)) {
        return res.status(400).json({ error: 'Club name must be 3-30 characters, only letters, digits and spaces' });
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

      // Award PROJECT_MAYHEM achievement for joining a club
      awardAchievement(prisma, req.userId, 'PROJECT_MAYHEM').catch(() => {});
      createClanEvent(clubId, 'member_join', req.userId);

      const fullClub = await prisma.club.findUnique({
        where: { id: clubId },
        include: { _count: { select: { members: true } } },
      });
      return res.json({ data: formatClubResponse(fullClub) });
    }

    // Leaving a club
    const leavingUser = await prisma.user.findUnique({ where: { id: req.userId } });
    const leavingClubId = leavingUser?.clubId;

    await prisma.user.update({
      where: { id: req.userId },
      data: { clubId: null, clubRole: null },
    });

    if (leavingClubId) {
      createClanEvent(leavingClubId, 'member_leave', req.userId);
    }

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
      level: 'level',
    }[sortBy] || 'battles';

    const sortOrder = sortDirection.toLowerCase();
    const orderBy = sortField === 'members'
      ? { members: { _count: sortOrder } }
      : { [sortField]: sortOrder };

    const where = {};
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
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

    createClanEvent(requester.clubId, 'role_change', req.userId, userId, { role });

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

    createClanEvent(requester.clubId, 'member_kick', req.userId, userId);

    res.json({ data: { kickedUserId: userId } });
  } catch (err) {
    console.error('Kick member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/invite
router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requester.clubId) {
      return res.status(400).json({ error: 'You are not in a club' });
    }

    if (!['owner', 'deputy'].includes(requester.clubRole)) {
      return res.status(403).json({ error: 'Only owner or deputy can invite' });
    }

    const club = await prisma.club.findUnique({
      where: { id: requester.clubId },
      include: { _count: { select: { members: true } } },
    });

    if (club._count.members >= club.maxMembers) {
      return res.status(400).json({ error: 'Club is full' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (target.clubId) {
      return res.status(400).json({ error: 'User already in a club' });
    }

    // Check friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: req.userId, user2Id: userId },
          { user1Id: userId, user2Id: req.userId },
        ],
      },
    });
    if (!friendship) {
      return res.status(400).json({ error: 'User is not your friend' });
    }

    // Expire any stale pending invites for this user+club
    await prisma.clubInvite.updateMany({
      where: {
        clubId: club.id,
        inviteeId: userId,
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    // Check for existing pending invite
    const existingInvite = await prisma.clubInvite.findFirst({
      where: {
        clubId: club.id,
        inviteeId: userId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      return res.status(400).json({ error: 'Invite already pending' });
    }

    // Create persistent invite (48h expiry)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const invite = await prisma.clubInvite.create({
      data: {
        clubId: club.id,
        inviterId: req.userId,
        inviteeId: userId,
        expiresAt,
      },
    });

    // Send real-time notification via WebSocket (if online)
    const { sendToUser } = require('../websocket/handler');
    const inviterName = requester.name || requester.login || 'Player';

    sendToUser(userId, {
      type: 'club_invite',
      inviteId: invite.id,
      clubId: club.id,
      clubName: club.name,
      inviterId: req.userId,
      inviterName,
    });

    res.json({ data: { invited: userId, inviteId: invite.id } });
  } catch (err) {
    console.error('Club invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/club/invites — get pending invites for current user
router.get('/invites', authMiddleware, async (req, res) => {
  try {
    // Expire stale invites first
    await prisma.clubInvite.updateMany({
      where: {
        inviteeId: req.userId,
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    const invites = await prisma.clubInvite.findMany({
      where: {
        inviteeId: req.userId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        club: { select: { id: true, name: true, avatarUrl: true } },
        inviter: { select: { id: true, name: true, login: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: invites.map(inv => ({
        id: inv.id,
        clubId: inv.club.id,
        clubName: inv.club.name,
        clubAvatarUrl: inv.club.avatarUrl,
        inviterId: inv.inviter.id,
        inviterName: inv.inviter.name || inv.inviter.login || 'Player',
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get invites error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/club/invite/respond — accept or decline an invite
router.post('/invite/respond', authMiddleware, async (req, res) => {
  try {
    const { inviteId, action } = req.body;

    if (!inviteId || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'inviteId and action (accept/decline) required' });
    }

    const invite = await prisma.clubInvite.findUnique({
      where: { id: inviteId },
      include: { club: { include: { _count: { select: { members: true } } } } },
    });

    if (!invite || invite.inviteeId !== req.userId) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invite already ' + invite.status });
    }

    if (invite.expiresAt < new Date()) {
      await prisma.clubInvite.update({ where: { id: inviteId }, data: { status: 'expired' } });
      return res.status(400).json({ error: 'Invite expired' });
    }

    if (action === 'decline') {
      await prisma.clubInvite.update({ where: { id: inviteId }, data: { status: 'declined' } });
      return res.json({ data: { status: 'declined' } });
    }

    // Accept — validate and join
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.clubId) {
      return res.status(400).json({ error: 'Already in a club' });
    }

    if (invite.club._count.members >= invite.club.maxMembers) {
      return res.status(400).json({ error: 'Club is full' });
    }

    await prisma.$transaction([
      prisma.clubInvite.update({ where: { id: inviteId }, data: { status: 'accepted' } }),
      prisma.user.update({
        where: { id: req.userId },
        data: { clubId: invite.clubId, clubRole: 'member' },
      }),
    ]);

    // Award PROJECT_MAYHEM achievement for joining a club
    awardAchievement(prisma, req.userId, 'PROJECT_MAYHEM').catch(() => {});
    createClanEvent(invite.clubId, 'member_join', req.userId);

    const fullClub = await prisma.club.findUnique({
      where: { id: invite.clubId },
      include: { _count: { select: { members: true } } },
    });

    // Notify inviter via WS
    const { sendToUser } = require('../websocket/handler');
    const acceptorName = user.name || user.login || 'Player';
    sendToUser(invite.inviterId, {
      type: 'club_invite_accepted',
      acceptedBy: req.userId,
      acceptedByName: acceptorName,
      clubId: invite.clubId,
    });

    res.json({ data: formatClubResponse(fullClub) });
  } catch (err) {
    console.error('Invite respond error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/club/:clubId/events
router.get('/:clubId/events', authMiddleware, async (req, res) => {
  try {
    const { clubId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);
    const before = req.query.before ? new Date(req.query.before) : null;

    // Access check: only clan members
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.clubId !== clubId) {
      return res.status(403).json({ error: 'Only clan members can view events' });
    }

    const where = { clubId };
    if (before) {
      where.createdAt = { lt: before };
    }

    const events = await prisma.clanEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        club: false,
      },
    });

    // Collect unique actor/target IDs for batch lookup
    const userIds = new Set();
    for (const e of events) {
      if (e.actorId) userIds.add(e.actorId);
      if (e.targetId) userIds.add(e.targetId);
    }

    const users = userIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, login: true, skin: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    res.json({
      data: events.map(e => ({
        id: e.id,
        type: e.type,
        actor: e.actorId ? (userMap[e.actorId] || { id: e.actorId }) : null,
        target: e.targetId ? (userMap[e.targetId] || { id: e.targetId }) : null,
        data: e.data,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get clan events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /v1/club
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requester.clubId) {
      return res.status(400).json({ error: 'You are not in a club' });
    }

    const club = await prisma.club.findUnique({ where: { id: requester.clubId } });
    if (club.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only club owner can dissolve the club' });
    }

    await prisma.$transaction([
      prisma.clubInvite.deleteMany({
        where: { clubId: club.id },
      }),
      prisma.user.updateMany({
        where: { clubId: club.id },
        data: { clubId: null, clubRole: null },
      }),
      prisma.club.delete({
        where: { id: club.id },
      }),
    ]);

    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Delete club error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
