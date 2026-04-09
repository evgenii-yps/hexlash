const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { awardClanXP } = require('../utils/clanLevel');
const { createClanEvent } = require('../utils/clanEvents');

const router = express.Router();

// POST /v1/fight/save
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { isWin, isDraw, roundsPlayed, totalDamageDealt } = req.body;

    if (typeof isWin !== 'boolean' || typeof isDraw !== 'boolean') {
      return res.status(400).json({ error: 'isWin and isDraw are required booleans' });
    }

    const updateData = {
      totalFights: { increment: 1 },
      pveTotalFights: { increment: 1 },
    };

    if (isWin) {
      updateData.wins = { increment: 1 };
      updateData.pveWins = { increment: 1 };
    } else if (isDraw) {
      updateData.draws = { increment: 1 };
      updateData.pveDraws = { increment: 1 };
    } else {
      updateData.losses = { increment: 1 };
      updateData.pveLosses = { increment: 1 };
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
    });

    // Update clan stats and award clan XP if user is in a clan
    if (user.clanId) {
      const clanUpdate = { battles: { increment: 1 } };
      if (isWin) {
        clanUpdate.wins = { increment: 1 };
      }
      await prisma.clan.update({
        where: { id: user.clanId },
        data: clanUpdate,
      });

      const fightResult = isWin ? 'win' : isDraw ? 'draw' : 'lose';
      awardClanXP(user.clanId, fightResult).catch(e => console.error('Clan XP error:', e));

      const eventType = isWin ? 'fight_win' : isDraw ? 'fight_draw' : 'fight_lose';
      createClanEvent(user.clanId, eventType, req.userId, null, {
        opponentName: req.body.opponentName || 'AI',
        playerHp: req.body.playerHp ?? null,
        opponentHp: req.body.opponentHp ?? null,
        mode: 'pve',
      });
    }

    await prisma.fight.create({
      data: {
        fighterOneId: req.userId,
        winnerId: isWin ? req.userId : null,
        duration: roundsPlayed || 0,
        actions: roundsPlayed || 0,
        isCompleted: true,
      },
    });

    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Save fight error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
