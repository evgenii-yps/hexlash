/**
 * FightClub Service — manages personal fight clubs (auto-created per user).
 */

const prisma = require('../lib/prisma');
const { CLAN_LEVEL_CONFIG, CLAN_XP_REWARDS } = require('../config');

/**
 * Get or create FightClub for a user. Auto-creates on first access.
 */
async function getOrCreateFightClub(userId) {
  let fc = await prisma.fightClub.findUnique({ where: { ownerId: userId } });
  if (!fc) {
    fc = await prisma.fightClub.create({ data: { ownerId: userId } });
  }
  return fc;
}

const MAX_LEVEL = 10;

function calculateLevel(xp) {
  for (let lvl = MAX_LEVEL; lvl >= 1; lvl--) {
    if (xp >= CLAN_LEVEL_CONFIG[lvl].xpRequired) return lvl;
  }
  return 1;
}

function calculateMaxAgents(level) {
  return (CLAN_LEVEL_CONFIG[level] || CLAN_LEVEL_CONFIG[1]).maxAgents;
}

function getLevelInfo(xp) {
  const level = calculateLevel(xp);
  const current = CLAN_LEVEL_CONFIG[level];
  const next = CLAN_LEVEL_CONFIG[level + 1];
  const isMaxLevel = !next;
  let progress = 100;
  if (!isMaxLevel) {
    const pXP = xp - current.xpRequired;
    const pMax = next.xpRequired - current.xpRequired;
    progress = pMax > 0 ? Math.min(100, Math.round(pXP / pMax * 100)) : 0;
  }
  return {
    level, xp,
    xpForCurrentLevel: current.xpRequired,
    xpForNextLevel: next ? next.xpRequired : null,
    progress,
    maxAgents: current.maxAgents,
    xpBonus: current.xpBonus,
    isMaxLevel,
  };
}

/**
 * Add XP to a FightClub and handle level-ups.
 */
async function addFightClubXp(fightClubId, xpAmount) {
  if (!xpAmount || xpAmount <= 0) return { fightClub: null, leveledUp: false };

  const fc = await prisma.fightClub.update({
    where: { id: fightClubId },
    data: { xp: { increment: xpAmount } },
  });

  const oldLevel = fc.level;
  const newLevel = calculateLevel(fc.xp);

  if (newLevel > oldLevel) {
    const config = CLAN_LEVEL_CONFIG[newLevel];
    const updated = await prisma.fightClub.update({
      where: { id: fightClubId },
      data: { level: newLevel, maxAgents: config.maxAgents },
    });
    return { fightClub: updated, leveledUp: true, oldLevel, newLevel };
  }

  return { fightClub: fc, leveledUp: false, oldLevel, newLevel: oldLevel };
}

/**
 * Get legend buff for a FightClub.
 */
async function getFightClubLegendBuff(fightClubId) {
  if (!fightClubId) return null;
  const fc = await prisma.fightClub.findUnique({
    where: { id: fightClubId },
    select: { legendBuff: true },
  });
  return fc?.legendBuff || null;
}

/**
 * Get XP reward amount for an agent fight result.
 */
function getFightXpReward(result, mode) {
  const isRanked = mode === 'ranked';
  const resultMap = { victory: 'win', defeat: 'lose', draw: 'draw' };
  const key = resultMap[result] || result;
  const prefix = isRanked ? 'agent_ranked_' : 'agent_';
  return CLAN_XP_REWARDS[prefix + key] || 0;
}

/**
 * Returns the "active agent" for a user — the agent that represents them in combat.
 * Rule: first agent by createdAt ASC within the user's FightClub.
 * Replaces captain-based logic (Phase −1 migration).
 *
 * @param {string} userId
 * @returns {Promise<Object|null>} Agent with tactics + progression, or null if no agents
 */
async function getActiveAgent(userId) {
  const fightClub = await prisma.fightClub.findUnique({
    where: { ownerId: userId },
  });
  if (!fightClub) return null;

  return prisma.agent.findFirst({
    where: { fightClubId: fightClub.id },
    orderBy: { createdAt: 'asc' },
    include: {
      tactics: true,
      progression: true,
    },
  });
}

module.exports = {
  getOrCreateFightClub,
  calculateLevel,
  calculateMaxAgents,
  getLevelInfo,
  addFightClubXp,
  getFightClubLegendBuff,
  getFightXpReward,
  getActiveAgent,
};
