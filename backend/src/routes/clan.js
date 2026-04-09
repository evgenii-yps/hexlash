const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { formatClubResponse, awardAchievement } = require('../utils/helpers');
const { COST_CREATE_CLUB, DECIMALS } = require('../config');
const { createClanEvent } = require('../utils/clanEvents');

const router = express.Router();

// GET /v1/clan/id/:clanId
router.get('/id/:clanId', authMiddleware, async (req, res) => {
  try {
    const clan = await prisma.clan.findUnique({
      where: { id: req.params.clanId },
      include: { _count: { select: { members: true } } },
    });

    if (!clan) {
      return res.status(404).json({ error: 'Clan not found' });
    }

    res.json({ data: formatClubResponse(clan) });
  } catch (err) {
    console.error('Get clan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/clan/add
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { clanData } = req.body;
    if (!clanData || !clanData.name) {
      return res.status(400).json({ error: 'Clan name required' });
    }

    // Validate name and description
    const name = clanData.name.trim();
    const sanitizedName = name.replace(/\s{2,}/g, ' ');
    if (!/^[\p{L}\p{N} ]{3,30}$/u.test(sanitizedName)) {
      return res.status(400).json({ error: 'Clan name must be 3-30 characters, only letters, digits and spaces' });
    }
    const description = (clanData.description || '').trim().slice(0, 500);

    // Check if user is not already in a clan
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.clanId) {
      return res.status(400).json({ error: 'Already in a clan' });
    }

    const isPublic = clanData.isPublic !== undefined ? clanData.isPublic : true;

    const fullClan = await prisma.$transaction(async (tx) => {
      const clan = await tx.clan.create({
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
          clanId: clan.id,
          clanRole: 'owner',
        },
      });

      return tx.clan.findUnique({
        where: { id: clan.id },
        include: { _count: { select: { members: true } } },
      });
    });

    // Award PAPER_STREET achievement for creating a clan
    awardAchievement(prisma, req.userId, 'PAPER_STREET').catch(() => {});

    res.json({ data: formatClubResponse(fullClan) });
  } catch (err) {
    console.error('Create clan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/clan/edit
router.post('/edit', authMiddleware, async (req, res) => {
  try {
    const { clanId, name, description, isPublic } = req.body;
    if (!clanId) {
      return res.status(400).json({ error: 'Clan ID required' });
    }

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) {
      return res.status(404).json({ error: 'Clan not found' });
    }
    if (clan.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only clan owner can edit' });
    }

    const updateData = {};
    if (name !== undefined) {
      const trimmedName = name.trim().replace(/\s{2,}/g, ' ');
      if (!/^[\p{L}\p{N} ]{3,30}$/u.test(trimmedName)) {
        return res.status(400).json({ error: 'Clan name must be 3-30 characters, only letters, digits and spaces' });
      }
      updateData.name = trimmedName;
    }
    if (description !== undefined) updateData.description = description.trim().slice(0, 500);
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updated = await prisma.clan.update({
      where: { id: clanId },
      data: updateData,
      include: { _count: { select: { members: true } } },
    });

    res.json({ data: formatClubResponse(updated) });
  } catch (err) {
    console.error('Edit clan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/clan/put-avatar
router.post('/put-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.clanId) {
      return res.status(400).json({ error: 'User is not in a clan' });
    }

    const clan = await prisma.clan.findUnique({ where: { id: user.clanId } });
    if (clan.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only clan owner can change avatar' });
    }

    const avatarUrl = req.file.filename;
    await prisma.clan.update({
      where: { id: user.clanId },
      data: { avatarUrl },
    });

    res.json({ data: { id: user.clanId, avatarUrl } });
  } catch (err) {
    console.error('Clan avatar error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/clan/change
router.post('/change', authMiddleware, async (req, res) => {
  try {
    const { clanId } = req.body;

    if (clanId) {
      // Joining a clan
      const clan = await prisma.clan.findUnique({
        where: { id: clanId },
        include: { _count: { select: { members: true } } },
      });
      if (!clan) {
        return res.status(404).json({ error: 'Clan not found' });
      }
      if (!clan.isPublic) {
        return res.status(403).json({ error: 'Clan is private' });
      }
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (user.clanId === clanId) {
        return res.status(400).json({ error: 'Already in this clan' });
      }
      if (clan._count.members >= clan.maxMembers) {
        return res.status(400).json({ error: 'Clan is full' });
      }

      await prisma.user.update({
        where: { id: req.userId },
        data: { clanId, clanRole: 'member' },
      });

      // Award PROJECT_MAYHEM achievement for joining a clan
      awardAchievement(prisma, req.userId, 'PROJECT_MAYHEM').catch(() => {});
      createClanEvent(clanId, 'member_join', req.userId);

      const fullClan = await prisma.clan.findUnique({
        where: { id: clanId },
        include: { _count: { select: { members: true } } },
      });
      return res.json({ data: formatClubResponse(fullClan) });
    }

    // Leaving a clan
    const leavingUser = await prisma.user.findUnique({ where: { id: req.userId } });
    const leavingClanId = leavingUser?.clanId;

    await prisma.user.update({
      where: { id: req.userId },
      data: { clanId: null, clanRole: null },
    });

    if (leavingClanId) {
      createClanEvent(leavingClanId, 'member_leave', req.userId);
    }

    res.json({ data: null });
  } catch (err) {
    console.error('Change clan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/clan/search
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

    const clans = await prisma.clan.findMany({
      where,
      include: { _count: { select: { members: true } } },
      orderBy,
      skip: pageNum * pageSize,
      take: pageSize,
    });

    res.json({ data: clans.map(formatClubResponse) });
  } catch (err) {
    console.error('Search clans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/clan/set-role
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
    if (!requester.clanId) {
      return res.status(400).json({ error: 'You are not in a clan' });
    }

    const clan = await prisma.clan.findUnique({ where: { id: requester.clanId } });
    if (clan.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only clan owner can set roles' });
    }

    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.clanId !== requester.clanId) {
      return res.status(400).json({ error: 'User is not a member of this clan' });
    }

    if (role === 'deputy') {
      const deputyCount = await prisma.user.count({
        where: { clanId: requester.clanId, clanRole: 'deputy' },
      });
      if (deputyCount >= 3) {
        return res.status(400).json({ error: 'Maximum 3 deputies allowed' });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { clanRole: role },
    });

    createClanEvent(requester.clanId, 'role_change', req.userId, userId, { role });

    res.json({ data: { userId, role } });
  } catch (err) {
    console.error('Set role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/clan/transfer-ownership
router.post('/transfer-ownership', authMiddleware, async (req, res) => {
  try {
    const { newOwnerId } = req.body;

    if (!newOwnerId) {
      return res.status(400).json({ error: 'newOwnerId required' });
    }

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requester.clanId) {
      return res.status(400).json({ error: 'You are not in a clan' });
    }

    const clan = await prisma.clan.findUnique({ where: { id: requester.clanId } });
    if (clan.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only clan owner can transfer ownership' });
    }

    if (newOwnerId === req.userId) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    const target = await prisma.user.findUnique({ where: { id: newOwnerId } });
    if (!target || target.clanId !== requester.clanId) {
      return res.status(400).json({ error: 'User is not a member of this clan' });
    }

    // Determine old owner's new role
    const deputyCount = await prisma.user.count({
      where: { clanId: requester.clanId, clanRole: 'deputy' },
    });
    const oldOwnerRole = deputyCount < 3 ? 'deputy' : 'member';

    await prisma.$transaction([
      prisma.clan.update({
        where: { id: requester.clanId },
        data: { ownerId: newOwnerId },
      }),
      prisma.user.update({
        where: { id: newOwnerId },
        data: { clanRole: 'owner' },
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { clanRole: oldOwnerRole },
      }),
    ]);

    res.json({ data: { newOwnerId, oldOwnerRole } });
  } catch (err) {
    console.error('Transfer ownership error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/clan/kick
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
    if (!requester.clanId) {
      return res.status(400).json({ error: 'You are not in a clan' });
    }

    const clan = await prisma.clan.findUnique({ where: { id: requester.clanId } });
    const isOwner = clan.ownerId === req.userId;
    const isDeputy = requester.clanRole === 'deputy';

    if (!isOwner && !isDeputy) {
      return res.status(403).json({ error: 'Only owner or deputy can kick members' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.clanId !== requester.clanId) {
      return res.status(400).json({ error: 'User is not a member of this clan' });
    }

    // Deputies can only kick regular members
    if (isDeputy && target.clanRole !== 'member') {
      return res.status(403).json({ error: 'Deputies can only kick regular members' });
    }

    // Owner cannot be kicked
    if (target.clanRole === 'owner') {
      return res.status(403).json({ error: 'Cannot kick the clan owner' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { clanId: null, clanRole: null },
    });

    createClanEvent(requester.clanId, 'member_kick', req.userId, userId);

    res.json({ data: { kickedUserId: userId } });
  } catch (err) {
    console.error('Kick member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/clan/invite
router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requester.clanId) {
      return res.status(400).json({ error: 'You are not in a clan' });
    }

    if (!['owner', 'deputy'].includes(requester.clanRole)) {
      return res.status(403).json({ error: 'Only owner or deputy can invite' });
    }

    const clan = await prisma.clan.findUnique({
      where: { id: requester.clanId },
      include: { _count: { select: { members: true } } },
    });

    if (clan._count.members >= clan.maxMembers) {
      return res.status(400).json({ error: 'Clan is full' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (target.clanId) {
      return res.status(400).json({ error: 'User already in a clan' });
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

    // Expire any stale pending invites for this user+clan
    await prisma.clanInvite.updateMany({
      where: {
        clanId: clan.id,
        inviteeId: userId,
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    // Check for existing pending invite
    const existingInvite = await prisma.clanInvite.findFirst({
      where: {
        clanId: clan.id,
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
    const invite = await prisma.clanInvite.create({
      data: {
        clanId: clan.id,
        inviterId: req.userId,
        inviteeId: userId,
        expiresAt,
      },
    });

    // Send real-time notification via WebSocket (if online)
    const { sendToUser } = require('../websocket/handler');
    const inviterName = requester.name || requester.login || 'Player';

    sendToUser(userId, {
      type: 'clan_invite',
      inviteId: invite.id,
      clanId: clan.id,
      clanName: clan.name,
      inviterId: req.userId,
      inviterName,
    });

    res.json({ data: { invited: userId, inviteId: invite.id } });
  } catch (err) {
    console.error('Clan invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/clan/invites — get pending invites for current user
router.get('/invites', authMiddleware, async (req, res) => {
  try {
    // Expire stale invites first
    await prisma.clanInvite.updateMany({
      where: {
        inviteeId: req.userId,
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    const invites = await prisma.clanInvite.findMany({
      where: {
        inviteeId: req.userId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        clan: { select: { id: true, name: true, avatarUrl: true } },
        inviter: { select: { id: true, name: true, login: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: invites.map(inv => ({
        id: inv.id,
        clanId: inv.clan.id,
        clanName: inv.clan.name,
        clanAvatarUrl: inv.clan.avatarUrl,
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

// POST /v1/clan/invite/respond — accept or decline an invite
router.post('/invite/respond', authMiddleware, async (req, res) => {
  try {
    const { inviteId, action } = req.body;

    if (!inviteId || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'inviteId and action (accept/decline) required' });
    }

    const invite = await prisma.clanInvite.findUnique({
      where: { id: inviteId },
      include: { clan: { include: { _count: { select: { members: true } } } } },
    });

    if (!invite || invite.inviteeId !== req.userId) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invite already ' + invite.status });
    }

    if (invite.expiresAt < new Date()) {
      await prisma.clanInvite.update({ where: { id: inviteId }, data: { status: 'expired' } });
      return res.status(400).json({ error: 'Invite expired' });
    }

    if (action === 'decline') {
      await prisma.clanInvite.update({ where: { id: inviteId }, data: { status: 'declined' } });
      return res.json({ data: { status: 'declined' } });
    }

    // Accept — validate and join
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.clanId) {
      return res.status(400).json({ error: 'Already in a clan' });
    }

    if (invite.clan._count.members >= invite.clan.maxMembers) {
      return res.status(400).json({ error: 'Clan is full' });
    }

    await prisma.$transaction([
      prisma.clanInvite.update({ where: { id: inviteId }, data: { status: 'accepted' } }),
      prisma.user.update({
        where: { id: req.userId },
        data: { clanId: invite.clanId, clanRole: 'member' },
      }),
    ]);

    // Award PROJECT_MAYHEM achievement for joining a clan
    awardAchievement(prisma, req.userId, 'PROJECT_MAYHEM').catch(() => {});
    createClanEvent(invite.clanId, 'member_join', req.userId);

    const fullClan = await prisma.clan.findUnique({
      where: { id: invite.clanId },
      include: { _count: { select: { members: true } } },
    });

    // Notify inviter via WS
    const { sendToUser } = require('../websocket/handler');
    const acceptorName = user.name || user.login || 'Player';
    sendToUser(invite.inviterId, {
      type: 'clan_invite_accepted',
      acceptedBy: req.userId,
      acceptedByName: acceptorName,
      clanId: invite.clanId,
    });

    res.json({ data: formatClubResponse(fullClan) });
  } catch (err) {
    console.error('Invite respond error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/clan/:clanId/events
router.get('/:clanId/events', authMiddleware, async (req, res) => {
  try {
    const { clanId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);
    const before = req.query.before ? new Date(req.query.before) : null;

    // Access check: only clan members
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.clanId !== clanId) {
      return res.status(403).json({ error: 'Only clan members can view events' });
    }

    const where = { clanId };
    if (before) {
      where.createdAt = { lt: before };
    }

    const events = await prisma.clanEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        clan: false,
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

// DELETE /v1/clan
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!requester.clanId) {
      return res.status(400).json({ error: 'You are not in a clan' });
    }

    const clan = await prisma.clan.findUnique({ where: { id: requester.clanId } });
    if (clan.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only clan owner can dissolve the clan' });
    }

    await prisma.$transaction([
      prisma.clanInvite.deleteMany({
        where: { clanId: clan.id },
      }),
      prisma.user.updateMany({
        where: { clanId: clan.id },
        data: { clanId: null, clanRole: null },
      }),
      prisma.clan.delete({
        where: { id: clan.id },
      }),
    ]);

    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Delete clan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
