/**
 * Pure helpers for User → Fighter #1 migration.
 * No Prisma dependency — safe to test without database.
 */

const DEFAULT_MODULES = ['predator', 'sentinel', 'analyst'];

/**
 * Transform User.progression.moves (object) → AgentProgression.moves (array).
 * Filters: only unlocked moves with level > 0.
 * @param {Object} movesObj - { moveId: { level, unlocked } }
 * @returns {Array<{moveId: string, level: number}>}
 */
function transformMoves(movesObj) {
  if (!movesObj || typeof movesObj !== 'object') return [];
  const result = [];
  for (const [moveId, data] of Object.entries(movesObj)) {
    if (data && data.unlocked && data.level > 0) {
      result.push({ moveId, level: data.level });
    }
  }
  return result;
}

/**
 * Extract modules from User.progression.playerModules with fallback.
 * @param {Array|null} playerModules
 * @returns {string[]} array of 3 archetype strings
 */
function extractModules(playerModules) {
  if (Array.isArray(playerModules) && playerModules.length >= 3) {
    return playerModules;
  }
  return DEFAULT_MODULES;
}

/**
 * Calculate branch XP from User.progression with freeXP distribution.
 * freeXP is split equally across 3 branches (floor, max 2 XP lost).
 * @param {Object} progression - User.progression
 * @returns {{ speedXp: number, powerXp: number, techniqueXp: number }}
 */
function calculateBranchXp(progression) {
  const branchExp = progression.branchExp || { speed: 0, power: 0, technique: 0 };
  const freeXpPerBranch = Math.floor((progression.freeXP || 0) / 3);
  return {
    speedXp: (branchExp.speed || 0) + freeXpPerBranch,
    powerXp: (branchExp.power || 0) + freeXpPerBranch,
    techniqueXp: (branchExp.technique || 0) + freeXpPerBranch,
  };
}

/**
 * Transform User.progression.moves (object) → AgentProgression.research (object).
 * Same format: { moveId: { unlocked: true, level: N } }
 * @param {Object} movesObj - { moveId: { level, unlocked } }
 * @returns {Object}
 */
function transformResearch(movesObj) {
  if (!movesObj || typeof movesObj !== 'object') return {};
  const result = {};
  for (const [moveId, data] of Object.entries(movesObj)) {
    if (data && data.unlocked && data.level > 0) {
      result[moveId] = { unlocked: true, level: data.level };
    }
  }
  return result;
}

module.exports = { transformMoves, extractModules, calculateBranchXp, transformResearch, DEFAULT_MODULES };
