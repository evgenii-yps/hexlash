const express = require('express');
const { clients } = require('../websocket/handler');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /v1/stats/online — public, no auth required
router.get('/online', (req, res) => {
  try {
    const onlineCount = clients.size;
    res.json({
      online: onlineCount,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error getting online count:', error);
    res.status(500).json({ error: 'Failed to get online count' });
  }
});

// GET /v1/stats/leaderboard/country?country=US&limit=50 (Phase 4.6)
// Returns top users from given country ranked by their best agent's ELO.
router.get('/leaderboard/country', authMiddleware, async (req, res) => {
  try {
    const country = (req.query.country || '').toUpperCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    if (!/^[A-Z]{2}$/.test(country)) {
      return res.status(400).json({ error: 'Invalid country code' });
    }

    const users = await prisma.user.findMany({
      where: { country },
      select: {
        id: true,
        login: true,
        country: true,
        agents: {
          select: { id: true, name: true, elo: true, belt: true, skin: true },
          orderBy: { elo: 'desc' },
          take: 1,
        },
      },
      take: limit * 2, // oversample — some users have 0 agents
    });

    const ranked = users
      .filter(u => u.agents.length > 0)
      .map(u => ({
        userId: u.id,
        login: u.login,
        country: u.country,
        agent: u.agents[0],
      }))
      .sort((a, b) => b.agent.elo - a.agent.elo)
      .slice(0, limit);

    return res.json({ data: { country, count: ranked.length, leaderboard: ranked } });
  } catch (err) {
    console.error('Country leaderboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch country leaderboard' });
  }
});

// GET /v1/stats/live-matches?limit=20 (Phase 4.6)
// Returns most recent finished PvP matches for live feed.
router.get('/live-matches', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const matches = await prisma.fight.findMany({
      where: { mode: 'pvp', isCompleted: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        winnerId: true,
        player1Id: true,
        player2Id: true,
        player1Hp: true,
        player2Hp: true,
        reason: true,
      },
    });

    const userIds = [...new Set(matches.flatMap(m => [m.player1Id, m.player2Id]).filter(Boolean))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        login: true,
        country: true,
        agents: {
          select: { id: true, name: true, skin: true, elo: true },
          orderBy: { elo: 'desc' },
          take: 1,
        },
      },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const enriched = matches.map(m => ({
      id: m.id,
      createdAt: m.createdAt,
      player1: userMap[m.player1Id] || null,
      player2: userMap[m.player2Id] || null,
      player1Hp: m.player1Hp,
      player2Hp: m.player2Hp,
      winnerId: m.winnerId,
      reason: m.reason,
    }));

    return res.json({ data: { matches: enriched } });
  } catch (err) {
    console.error('Live matches error:', err);
    return res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});

module.exports = router;
