/**
 * Research Gate Service
 * Controls what moves agents can learn based on the player's personal progression.
 * Rule: agent can only learn moves the player has researched, up to the player's level.
 */

const prisma = require('../lib/prisma');

// Move → branch mapping (from src/data/moves.js, backend copy)
const MOVE_BRANCHES = {
  jab: 'speed', double_jab: 'speed', rapid_fire: 'speed',
  combo_strike: 'speed', flurry: 'speed', hurricane: 'speed',
  straight: 'power', hook: 'power', uppercut: 'power',
  haymaker: 'power', hammer_fist: 'power', knockout_blow: 'power',
  block_strike: 'technique', counter_jab: 'technique', feint_cross: 'technique',
  parry_punish: 'technique', slip_counter: 'technique', precision_strike: 'technique',
};

const ALL_MOVE_IDS = Object.keys(MOVE_BRANCHES);

// XP cost per level (from src/data/requirements.js)
// Level 1 = free, levels 2-5 cost XP
const LEVEL_UP_XP_COST = {
  2: 50,
  3: 100,
  4: 200,
  5: 350,
};

const BRANCH_XP_FIELD = {
  speed: 'speedXp',
  power: 'powerXp',
  technique: 'techniqueXp',
};

/**
 * Get the player's researched moves from User.progression.
 * @param {string} userId
 * @returns {Array<{moveId: string, level: number}>}
 */
async function getPlayerResearch(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { progression: true },
  });

  if (!user || !user.progression || !user.progression.moves) {
    return [];
  }

  const result = [];
  for (const [moveId, data] of Object.entries(user.progression.moves)) {
    if (data.unlocked && data.level > 0) {
      result.push({ moveId, level: data.level });
    }
  }
  return result;
}

/**
 * Check if an agent can learn/upgrade a move based on Research Gate.
 * @param {string} userId
 * @param {string} moveId
 * @param {number} targetLevel
 * @returns {{ allowed: boolean, reason?: string, playerLevel: number }}
 */
async function canAgentLearnMove(userId, moveId, targetLevel) {
  if (!MOVE_BRANCHES[moveId]) {
    return { allowed: false, reason: 'Unknown move', playerLevel: 0 };
  }

  const research = await getPlayerResearch(userId);
  const playerMove = research.find(r => r.moveId === moveId);

  if (!playerMove) {
    return { allowed: false, reason: 'Move not researched by player', playerLevel: 0 };
  }

  if (targetLevel > playerMove.level) {
    return { allowed: false, reason: 'Player research level too low', playerLevel: playerMove.level };
  }

  return { allowed: true, playerLevel: playerMove.level };
}

/**
 * Validate an agent's entire deck against Research Gate.
 * @param {string} userId
 * @param {Array<string>} deck
 * @param {Array<{moveId: string, level: number}>} agentMoves
 * @returns {{ valid: boolean, invalidMoves: string[], reasons: string[] }}
 */
async function validateAgentDeck(userId, deck, agentMoves) {
  const research = await getPlayerResearch(userId);
  const researchMap = Object.fromEntries(research.map(r => [r.moveId, r.level]));
  const agentMoveMap = Object.fromEntries(agentMoves.map(m => [m.moveId, m.level]));

  const invalidMoves = [];
  const reasons = [];

  for (const moveId of deck) {
    if (!agentMoveMap[moveId]) {
      invalidMoves.push(moveId);
      reasons.push(`Move not learned: ${moveId}`);
      continue;
    }
    if (!researchMap[moveId]) {
      invalidMoves.push(moveId);
      reasons.push(`Move not researched by player: ${moveId}`);
    }
  }

  return { valid: invalidMoves.length === 0, invalidMoves, reasons };
}

/**
 * Get all moves available for an agent to learn (based on player research).
 * @param {string} userId
 * @param {string} agentId
 * @returns {Array<{moveId, branch, maxLevel, agentCurrentLevel, canUpgrade, xpCost}>}
 */
async function getAvailableMovesForAgent(userId, agentId) {
  const [research, agentProg] = await Promise.all([
    getPlayerResearch(userId),
    prisma.agentProgression.findUnique({ where: { agentId } }),
  ]);

  const agentMoveMap = {};
  if (agentProg && Array.isArray(agentProg.moves)) {
    for (const m of agentProg.moves) {
      agentMoveMap[m.moveId] = m.level;
    }
  }

  return research.map(({ moveId, level: maxLevel }) => {
    const agentCurrentLevel = agentMoveMap[moveId] || 0;
    const nextLevel = agentCurrentLevel + 1;
    const canUpgrade = agentCurrentLevel < maxLevel && nextLevel <= 5;
    const xpCost = nextLevel <= 1 ? 0 : (LEVEL_UP_XP_COST[nextLevel] || 0);

    return {
      moveId,
      branch: MOVE_BRANCHES[moveId],
      maxLevel,
      agentCurrentLevel,
      canUpgrade,
      xpCost: canUpgrade ? xpCost : null,
    };
  });
}

module.exports = {
  MOVE_BRANCHES,
  ALL_MOVE_IDS,
  LEVEL_UP_XP_COST,
  BRANCH_XP_FIELD,
  getPlayerResearch,
  canAgentLearnMove,
  validateAgentDeck,
  getAvailableMovesForAgent,
};
