const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/auth');

// ── Send friend request ────────────────────────────────────────────────────
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { targetId } = req.body;
    const fromId = req.userId;

    if (fromId === targetId) {
      return res.status(400).json({ error: 'Cannot add yourself' });
    }

    // Check target exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check already friends
    const [id1, id2] = fromId < targetId ? [fromId, targetId] : [targetId, fromId];
    const friendship = await prisma.friendship.findUnique({
      where: { user1Id_user2Id: { user1Id: id1, user2Id: id2 } },
    });
    if (friendship) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check existing request from us
    const existing = await prisma.friendRequest.findUnique({
      where: { fromId_toId: { fromId, toId: targetId } },
    });
    if (existing && existing.status === 'pending') {
      return res.status(400).json({ error: 'Request already sent' });
    }

    // Check reverse request (they already sent us one)
    const reverse = await prisma.friendRequest.findUnique({
      where: { fromId_toId: { fromId: targetId, toId: fromId } },
    });
    if (reverse && reverse.status === 'pending') {
      // Auto-accept — both want to be friends
      await prisma.friendRequest.update({
        where: { id: reverse.id },
        data: { status: 'accepted' },
      });
      await prisma.friendship.create({
        data: { user1Id: id1, user2Id: id2 },
      });
      console.log('[FRIENDS] Auto-accepted: mutual request', fromId, '<->', targetId);
      return res.json({ status: 'accepted' });
    }

    // Create or update request (if previously declined, allow re-send)
    if (existing) {
      await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: 'pending', createdAt: new Date() },
      });
    } else {
      await prisma.friendRequest.create({
        data: { fromId, toId: targetId },
      });
    }

    console.log('[FRIENDS] Request sent:', fromId, '->', targetId);
    res.json({ status: 'pending' });
  } catch (error) {
    console.error('[FRIENDS] Error sending request:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// ── Get incoming requests ──────────────────────────────────────────────────
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: { toId: req.userId, status: 'pending' },
      include: {
        from: {
          select: { id: true, name: true, login: true, rating: true, avatarUrl: true, skin: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = requests.map(r => ({
      id: r.from.id,
      requestId: r.id,
      username: r.from.name || r.from.login,
      login: r.from.login,
      rating: r.from.rating,
      avatarUrl: r.from.avatarUrl,
      skin: r.from.skin,
      sentAt: r.createdAt.getTime(),
    }));

    res.json({ requests: formatted });
  } catch (error) {
    console.error('[FRIENDS] Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// ── Get outgoing requests ──────────────────────────────────────────────────
router.get('/requests/outgoing', authMiddleware, async (req, res) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: { fromId: req.userId, status: 'pending' },
      include: {
        to: {
          select: { id: true, name: true, login: true, rating: true, avatarUrl: true, skin: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = requests.map(r => ({
      id: r.to.id,
      requestId: r.id,
      username: r.to.name || r.to.login,
      login: r.to.login,
      rating: r.to.rating,
      avatarUrl: r.to.avatarUrl,
      skin: r.to.skin,
      sentAt: r.createdAt.getTime(),
    }));

    res.json({ requests: formatted });
  } catch (error) {
    console.error('[FRIENDS] Error fetching outgoing requests:', error);
    res.status(500).json({ error: 'Failed to fetch outgoing requests' });
  }
});

// ── Accept request ─────────────────────────────────────────────────────────
router.post('/accept', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.toId !== req.userId) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already handled' });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    const [id1, id2] = request.fromId < request.toId
      ? [request.fromId, request.toId]
      : [request.toId, request.fromId];

    await prisma.friendship.create({
      data: { user1Id: id1, user2Id: id2 },
    });

    console.log('[FRIENDS] Accepted:', request.fromId, '<->', request.toId);
    res.json({ status: 'accepted' });
  } catch (error) {
    console.error('[FRIENDS] Error accepting:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// ── Decline request ────────────────────────────────────────────────────────
router.post('/decline', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.toId !== req.userId) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'declined' },
    });

    console.log('[FRIENDS] Declined:', request.id);
    res.json({ status: 'declined' });
  } catch (error) {
    console.error('[FRIENDS] Error declining:', error);
    res.status(500).json({ error: 'Failed to decline request' });
  }
});

// ── Get friends list ───────────────────────────────────────────────────────
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: { select: { id: true, name: true, login: true, rating: true, avatarUrl: true, skin: true } },
        user2: { select: { id: true, name: true, login: true, rating: true, avatarUrl: true, skin: true } },
      },
    });

    const friends = friendships.map(f => {
      const friend = f.user1Id === userId ? f.user2 : f.user1;
      return {
        id: friend.id,
        username: friend.name || friend.login,
        login: friend.login,
        rating: friend.rating,
        avatarUrl: friend.avatarUrl,
        skin: friend.skin,
        status: 'offline',
        addedAt: f.createdAt.getTime(),
      };
    });

    res.json({ friends });
  } catch (error) {
    console.error('[FRIENDS] Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// ── Remove friend ──────────────────────────────────────────────────────────
router.post('/remove', authMiddleware, async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.userId;

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    // Also clean up friend request records
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { fromId: userId, toId: friendId },
          { fromId: friendId, toId: userId },
        ],
      },
    });

    console.log('[FRIENDS] Removed:', userId, '<->', friendId);
    res.json({ status: 'removed' });
  } catch (error) {
    console.error('[FRIENDS] Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

module.exports = router;
