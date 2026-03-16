const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper: determine online status (seen within last 5 minutes)
function isOnline(lastSeen) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatUser(user) {
  return {
    id: user.id,
    username: user.name,
    login: user.login,
    rating: user.wins * 25 - user.losses * 15 + 1000, // derived rating
    status: isOnline(user.lastSeen) ? 'online' : 'offline',
    avatarUrl: user.avatarUrl || '',
    skin: user.skin || 'skin_m_1.png',
  };
}

// ─── GET /v1/friends — list accepted friends ──────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: req.userId },
          { receiverId: req.userId },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    const friends = friendships.map(f => {
      const friendUser = f.senderId === req.userId ? f.receiver : f.sender;
      return formatUser(friendUser);
    });

    res.json(friends);
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// ─── GET /v1/friends/requests — incoming + outgoing pending requests ──────────
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const incoming = await prisma.friendship.findMany({
      where: { receiverId: req.userId, status: 'pending' },
      include: { sender: true },
    });

    const outgoing = await prisma.friendship.findMany({
      where: { senderId: req.userId, status: 'pending' },
      include: { receiver: true },
    });

    res.json({
      incoming: incoming.map(f => ({
        requestId: f.id,
        ...formatUser(f.sender),
        sentAt: f.createdAt,
      })),
      outgoing: outgoing.map(f => ({
        requestId: f.id,
        ...formatUser(f.receiver),
        sentAt: f.createdAt,
      })),
    });
  } catch (err) {
    console.error('Get friend requests error:', err);
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

// ─── POST /v1/friends/request — send friend request ──────────────────────────
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { targetId } = req.body;

    if (!targetId) {
      return res.status(400).json({ error: 'targetId required' });
    }
    if (targetId === req.userId) {
      return res.status(400).json({ error: 'Cannot add yourself' });
    }

    // Check target exists
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check no existing friendship in either direction
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: req.userId, receiverId: targetId },
          { senderId: targetId, receiverId: req.userId },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Request already exists or already friends' });
    }

    const friendship = await prisma.friendship.create({
      data: {
        senderId: req.userId,
        receiverId: targetId,
        status: 'pending',
      },
    });

    res.json({ success: true, requestId: friendship.id });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// ─── POST /v1/friends/accept — accept incoming request ───────────────────────
router.post('/accept', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;

    const updated = await prisma.friendship.updateMany({
      where: {
        id: requestId,
        receiverId: req.userId,
        status: 'pending',
      },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// ─── POST /v1/friends/decline — decline incoming request ─────────────────────
router.post('/decline', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;

    await prisma.friendship.deleteMany({
      where: {
        id: requestId,
        receiverId: req.userId,
        status: 'pending',
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Decline friend request error:', err);
    res.status(500).json({ error: 'Failed to decline request' });
  }
});

// ─── DELETE /v1/friends/:targetId — remove friend ────────────────────────────
router.delete('/:targetId', authMiddleware, async (req, res) => {
  try {
    const { targetId } = req.params;

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: req.userId, receiverId: targetId },
          { senderId: targetId, receiverId: req.userId },
        ],
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// ─── GET /v1/friends/search?q=name — search users (not yet friends) ──────────
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Get existing friendship IDs to exclude
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: req.userId },
          { receiverId: req.userId },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    const excludeIds = new Set([req.userId]);
    friendships.forEach(f => {
      excludeIds.add(f.senderId);
      excludeIds.add(f.receiverId);
    });

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { login: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    res.json(users.map(formatUser));
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
