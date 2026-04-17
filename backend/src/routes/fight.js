const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { awardClanXP } = require('../utils/clanLevel');
const { createClanEvent } = require('../utils/clanEvents');
const { getActiveAgent } = require('../services/fightClubService');
const { applyWin } = require('../services/beltService');
const {
  STAKE_AMOUNTS,
  STAKE_PAYOUT_MULTIPLIER,
  STAKE_DRAW_RETURN,
  STAKE_LOSE_RETURN,
} = require('../config');

const router = express.Router();

// POST /v1/fight/start — optional stake deduction before PvE fight (Phase 4.3, PvE only)
// Body: { stake: 'low' | 'medium' | 'high' | null }
// Returns: { data: { stakeApplied, stakeAmount?, newBalance? } }
// Backwards-compat: stake=null/missing → no-op, stakeApplied=false.
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { stake } = req.body || {};
    if (!stake) {
      return res.json({ data: { stakeApplied: false } });
    }
    if (!Object.prototype.hasOwnProperty.call(STAKE_AMOUNTS, stake)) {
      return res.status(400).json({ error: 'Invalid stake level' });
    }

    const stakeAmount = STAKE_AMOUNTS[stake];

    // Atomic conditional decrement — prevents race when two concurrent requests
    // pass the balance check before either commits. updateMany with the balance
    // gate ensures at most one of N concurrent requests succeeds when
    // balance < N * stakeAmount.
    const result = await prisma.user.updateMany({
      where: { id: req.userId, balance: { gte: stakeAmount } },
      data: { balance: { decrement: stakeAmount } },
    });

    if (result.count === 0) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { balance: true },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(400).json({
        error: 'Insufficient balance',
        required: stakeAmount,
        current: user.balance,
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { balance: true },
    });

    return res.json({
      data: {
        stakeApplied: true,
        stakeAmount,
        newBalance: updated.balance,
      },
    });
  } catch (err) {
    console.error('Fight start (stake) error:', err);
    return res.status(500).json({ error: 'Failed to start fight' });
  }
});

// POST /v1/fight/save — PvE fight result via active agent (first by createdAt)
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { isWin, isDraw, roundsPlayed, totalDamageDealt, stake } = req.body;

    if (typeof isWin !== 'boolean' || typeof isDraw !== 'boolean') {
      return res.status(400).json({ error: 'isWin and isDraw are required booleans' });
    }

    // Load active agent for this user (first by createdAt)
    const agent = await getActiveAgent(req.userId);
    if (!agent) {
      return res.status(409).json({ error: 'No fighter found. Create a fighter in Club Mode first.', code: 'NO_ACTIVE_AGENT' });
    }

    // Build agent stats update
    const agentStats = { totalFights: { increment: 1 }, lastFightAt: new Date() };
    if (isWin) agentStats.wins = { increment: 1 };
    else if (isDraw) agentStats.draws = { increment: 1 };
    else agentStats.losses = { increment: 1 };

    // Belt progression (PvE bot = null opponent belt)
    let beltUpdate = null;
    if (isWin) {
      beltUpdate = applyWin(agent, null);
      if (beltUpdate.qualified) {
        agentStats.belt = beltUpdate.belt;
        agentStats.qualifiedWins = beltUpdate.qualifiedWins;
        agentStats.isHexmaster = beltUpdate.isHexmaster;
      }
    }

    // Update active agent stats (not User)
    await prisma.agent.update({ where: { id: agent.id }, data: agentStats });

    // Clan stats (still uses User's clanId — clan tracks member participation)
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { clanId: true } });
    if (user?.clanId) {
      const clanUpdate = { battles: { increment: 1 } };
      if (isWin) clanUpdate.wins = { increment: 1 };
      await prisma.clan.update({ where: { id: user.clanId }, data: clanUpdate });

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

    // Fight record (still links to User for history)
    await prisma.fight.create({
      data: {
        fighterOneId: req.userId,
        winnerId: isWin ? req.userId : null,
        duration: roundsPlayed || 0,
        actions: roundsPlayed || 0,
        isCompleted: true,
      },
    });

    // Phase 4.3: Stake payout. Deduction already happened on /fight/start;
    // here we only credit payout based on result.
    let newBalance;
    if (stake && Object.prototype.hasOwnProperty.call(STAKE_AMOUNTS, stake)) {
      const stakeAmount = STAKE_AMOUNTS[stake];
      let multiplier;
      if (isWin) multiplier = STAKE_PAYOUT_MULTIPLIER;       // 2
      else if (isDraw) multiplier = STAKE_DRAW_RETURN;       // 1
      else multiplier = STAKE_LOSE_RETURN;                   // 0

      const payout = stakeAmount * multiplier;
      if (payout > 0) {
        const updated = await prisma.user.update({
          where: { id: req.userId },
          data: { balance: { increment: payout } },
          select: { balance: true },
        });
        newBalance = updated.balance;
      } else {
        const user = await prisma.user.findUnique({
          where: { id: req.userId },
          select: { balance: true },
        });
        newBalance = user.balance;
      }
    }

    res.json({
      data: {
        success: true,
        beltUpdate: beltUpdate || undefined,
        ...(newBalance !== undefined && { newBalance }),
      },
    });
  } catch (err) {
    console.error('Save fight error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
