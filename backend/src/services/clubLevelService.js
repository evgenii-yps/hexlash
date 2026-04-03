const { CLAN_LEVEL_CONFIG, CLAN_XP_REWARDS } = require('../config');
const prisma = require('../lib/prisma');
const { createClanEvent } = require('../utils/clanEvents');

const MAX_LEVEL = 10;

/**
 * Calculate level from total XP.
 * @param {number} xp - Total club XP
 * @returns {number} level (1-10)
 */
function calculateLevel(xp) {
  for (let lvl = MAX_LEVEL; lvl >= 1; lvl--) {
    if (xp >= CLAN_LEVEL_CONFIG[lvl].xpRequired) {
      return lvl;
    }
  }
  return 1;
}

/**
 * Get maxAgents for a given level.
 * @param {number} level
 * @returns {number}
 */
function calculateMaxAgents(level) {
  const config = CLAN_LEVEL_CONFIG[level] || CLAN_LEVEL_CONFIG[1];
  return config.maxAgents;
}

/**
 * Get full level info with progress percentage.
 * @param {number} xp - Total club XP
 * @returns {{ level, xp, xpForCurrentLevel, xpForNextLevel, progress, maxAgents, maxMembers, xpBonus, isMaxLevel }}
 */
function getLevelInfo(xp) {
  const level = calculateLevel(xp);
  const current = CLAN_LEVEL_CONFIG[level];
  const next = CLAN_LEVEL_CONFIG[level + 1];
  const isMaxLevel = !next;

  let progress = 100;
  if (!isMaxLevel) {
    const progressXP = xp - current.xpRequired;
    const progressMax = next.xpRequired - current.xpRequired;
    progress = progressMax > 0 ? Math.min(100, Math.round(progressXP / progressMax * 100)) : 0;
  }

  return {
    level,
    xp,
    xpForCurrentLevel: current.xpRequired,
    xpForNextLevel: next ? next.xpRequired : null,
    progress,
    maxAgents: current.maxAgents,
    maxMembers: current.maxMembers,
    xpBonus: current.xpBonus,
    isMaxLevel,
  };
}

/**
 * Add XP to a club and handle level-ups (updates level, maxMembers, maxAgents).
 * @param {string} clubId
 * @param {number} xpAmount
 * @returns {{ club, leveledUp, oldLevel, newLevel }}
 */
async function addClubXp(clubId, xpAmount) {
  if (!xpAmount || xpAmount <= 0) return { club: null, leveledUp: false };

  const club = await prisma.club.update({
    where: { id: clubId },
    data: { xp: { increment: xpAmount } },
  });

  const oldLevel = club.level;
  const newLevel = calculateLevel(club.xp);

  if (newLevel > oldLevel) {
    const config = CLAN_LEVEL_CONFIG[newLevel];
    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        level: newLevel,
        maxMembers: config.maxMembers,
        maxAgents: config.maxAgents,
      },
    });
    createClanEvent(clubId, 'level_up', null, null, { level: newLevel });
    return { club: updated, leveledUp: true, oldLevel, newLevel };
  }

  return { club, leveledUp: false, oldLevel, newLevel: oldLevel };
}

/**
 * Get XP reward amount for an agent fight result.
 * @param {string} result - victory|defeat|draw
 * @param {string} mode - pve_training|ranked|free_arena
 * @returns {number}
 */
function getFightXpReward(result, mode) {
  const isRanked = mode === 'ranked';
  const resultMap = { victory: 'win', defeat: 'lose', draw: 'draw' };
  const key = resultMap[result] || result;
  const prefix = isRanked ? 'agent_ranked_' : 'agent_';
  return CLAN_XP_REWARDS[prefix + key] || 0;
}

module.exports = {
  calculateLevel,
  calculateMaxAgents,
  getLevelInfo,
  addClubXp,
  getFightXpReward,
};
