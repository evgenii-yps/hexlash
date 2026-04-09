const { CLAN_LEVEL_CONFIG, CLAN_XP_REWARDS } = require('../config');
const prisma = require('../lib/prisma');
const { createClanEvent } = require('./clanEvents');

/**
 * Get clan level info for display.
 */
function getClanLevelInfo(level, xp) {
  const current = CLAN_LEVEL_CONFIG[level] || CLAN_LEVEL_CONFIG[10];
  const next = CLAN_LEVEL_CONFIG[level + 1];
  return {
    level,
    xp,
    xpRequired: next ? next.xpRequired : current.xpRequired,
    maxMembers: current.maxMembers,
    xpBonus: current.xpBonus,
    isMaxLevel: !next,
  };
}

/**
 * Award XP to a clan after a fight and handle level-ups.
 * @param {string} clanId - The clan ID
 * @param {'win'|'draw'|'lose'} result - Fight result for the member
 */
async function awardClanXP(clanId, result) {
  const xpReward = CLAN_XP_REWARDS[result] || 0;
  if (!xpReward) return;

  const clan = await prisma.clan.update({
    where: { id: clanId },
    data: { xp: { increment: xpReward } },
  });

  // Check for level up
  const nextLevel = clan.level + 1;
  const nextConfig = CLAN_LEVEL_CONFIG[nextLevel];
  if (nextConfig && clan.xp >= nextConfig.xpRequired) {
    await prisma.clan.update({
      where: { id: clanId },
      data: {
        level: nextLevel,
        maxMembers: nextConfig.maxMembers,
        maxAgents: nextConfig.maxAgents,
      },
    });
    createClanEvent(clanId, 'level_up', null, null, { level: nextLevel });
  }
}

module.exports = { getClanLevelInfo, awardClanXP };
