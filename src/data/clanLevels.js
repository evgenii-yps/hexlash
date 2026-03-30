export const CLAN_LEVEL_CONFIG = {
  1:  { xpRequired: 0,      maxMembers: 20, xpBonus: 0 },
  2:  { xpRequired: 1000,   maxMembers: 20, xpBonus: 0 },
  3:  { xpRequired: 3000,   maxMembers: 25, xpBonus: 0 },
  4:  { xpRequired: 6000,   maxMembers: 25, xpBonus: 5 },
  5:  { xpRequired: 10000,  maxMembers: 30, xpBonus: 10 },
  6:  { xpRequired: 20000,  maxMembers: 30, xpBonus: 10 },
  7:  { xpRequired: 35000,  maxMembers: 40, xpBonus: 15 },
  8:  { xpRequired: 55000,  maxMembers: 40, xpBonus: 15 },
  9:  { xpRequired: 80000,  maxMembers: 45, xpBonus: 20 },
  10: { xpRequired: 120000, maxMembers: 50, xpBonus: 20 },
};

export const MAX_CLAN_LEVEL = 10;

/**
 * Get clan level progress info for display.
 * @param {number} level - Current clan level (1-10)
 * @param {number} xp - Current total XP
 * @returns {{ level, xp, currentThreshold, nextThreshold, progressXP, progressMax, percent, isMaxLevel }}
 */
export function getClanLevelProgress(level, xp) {
  const current = CLAN_LEVEL_CONFIG[level] || CLAN_LEVEL_CONFIG[1];
  const next = CLAN_LEVEL_CONFIG[level + 1];
  const isMaxLevel = !next;

  const currentThreshold = current.xpRequired;
  const nextThreshold = next ? next.xpRequired : current.xpRequired;
  const progressXP = xp - currentThreshold;
  const progressMax = nextThreshold - currentThreshold;
  const percent = isMaxLevel ? 100 : (progressMax > 0 ? Math.min(100, Math.round(progressXP / progressMax * 100)) : 0);

  return {
    level,
    xp,
    currentThreshold,
    nextThreshold,
    progressXP,
    progressMax,
    percent,
    isMaxLevel,
    maxMembers: current.maxMembers,
    xpBonus: current.xpBonus,
  };
}
