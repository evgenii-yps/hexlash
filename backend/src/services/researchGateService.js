/**
 * Research Gate Service — per-agent research tree.
 *
 * Each agent has its own research tree (AgentProgression.research).
 * Research controls which moves the agent can learn (AgentProgression.moves)
 * and up to what level.
 *
 * Flow: research unlock/upgrade → learn move (capped by research level) → add to deck.
 */

const prisma = require('../lib/prisma');

// ── Move data ──────────────────────────────────────────────────────

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

// Ordered moves per branch (index = position, 0-based)
const BRANCH_MOVES = {
  speed: ['jab', 'double_jab', 'rapid_fire', 'combo_strike', 'flurry', 'hurricane'],
  power: ['straight', 'hook', 'uppercut', 'haymaker', 'hammer_fist', 'knockout_blow'],
  technique: ['block_strike', 'counter_jab', 'feint_cross', 'parry_punish', 'slip_counter', 'precision_strike'],
};

const BRANCH_XP_FIELD = {
  speed: 'speedXp',
  power: 'powerXp',
  technique: 'techniqueXp',
};

// ── Cost tables (from src/data/requirements.js) ────────────────────

// Cost to level up a researched move (key = target level)
// Level 1 is free (included in unlock)
const LEVEL_UP_REQUIREMENTS = {
  2: { taps: 100, exp: 50 },
  3: { taps: 200, exp: 100 },
  4: { taps: 350, exp: 200 },
  5: { taps: 500, exp: 350 },
};

// Cost to unlock a new move (key = level of the PREVIOUS move in branch)
// Higher prerequisite = lower cost (reward for deeper training)
const UNLOCK_REQUIREMENTS = {
  3: { taps: 300, exp: 150 },
  4: { taps: 250, exp: 120 },
  5: { taps: 200, exp: 100 },
};

// Legacy export alias (agent learn-move uses XP-only costs)
const LEVEL_UP_XP_COST = {
  2: 50,
  3: 100,
  4: 200,
  5: 350,
};

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Get the position (0-based index) of a move within its branch.
 */
function getMovePosition(moveId) {
  const branch = MOVE_BRANCHES[moveId];
  if (!branch) return -1;
  return BRANCH_MOVES[branch].indexOf(moveId);
}

/**
 * Get the previous move in the same branch (null if first).
 */
function getPreviousMove(moveId) {
  const branch = MOVE_BRANCHES[moveId];
  if (!branch) return null;
  const moves = BRANCH_MOVES[branch];
  const idx = moves.indexOf(moveId);
  return idx > 0 ? moves[idx - 1] : null;
}

/**
 * Parse research JSON safely.
 * @returns {Object} research map { moveId: { unlocked, level } }
 */
function parseResearch(research) {
  if (!research || typeof research !== 'object') return {};
  return research;
}

// ── Lazy migration ──────────────────────────────────────────────────

/**
 * Migrate User.progression.moves → AgentProgression.research for an agent.
 * Only runs once: when agent's research is empty ({}).
 * Does NOT touch freeXP. Only copies moves → research and branchExp → xp (if xp == 0).
 *
 * @param {string} agentId
 * @param {string} userId
 * @returns {Object|null} updated AgentProgression or null if no migration needed
 */
async function migrateAgentResearch(agentId, userId) {
  const [agent, agentProg, user] = await Promise.all([
    prisma.agent.findUnique({ where: { id: agentId }, select: { id: true } }),
    prisma.agentProgression.findUnique({ where: { agentId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { progression: true } }),
  ]);

  if (!agent || !agentProg) return null;

  // Check if research is empty
  const research = parseResearch(agentProg.research);
  if (Object.keys(research).length > 0) return null;

  // No user progression to migrate from
  if (!user || !user.progression || !user.progression.moves) return null;

  // Build research from User.progression.moves
  const newResearch = {};
  for (const [moveId, data] of Object.entries(user.progression.moves)) {
    if (data && data.unlocked && data.level > 0) {
      newResearch[moveId] = { unlocked: true, level: data.level };
    }
  }

  if (Object.keys(newResearch).length === 0) return null;

  // Build update data
  const updateData = { research: newResearch };

  // Copy branchExp → agent xp fields (only if current == 0)
  const branchExp = user.progression.branchExp || {};
  if (agentProg.speedXp === 0 && (branchExp.speed || 0) > 0) {
    updateData.speedXp = branchExp.speed;
  }
  if (agentProg.powerXp === 0 && (branchExp.power || 0) > 0) {
    updateData.powerXp = branchExp.power;
  }
  if (agentProg.techniqueXp === 0 && (branchExp.technique || 0) > 0) {
    updateData.techniqueXp = branchExp.technique;
  }

  const updated = await prisma.agentProgression.update({
    where: { agentId },
    data: updateData,
  });

  console.log(`[research-migration] agent=${agentId} user=${userId} moves=${Object.keys(newResearch).length}`);
  return updated;
}

/**
 * Ensure research is populated for an agent. Call before reading research.
 * No-op if research is already populated.
 */
async function ensureResearch(agentId, userId) {
  return migrateAgentResearch(agentId, userId);
}

// ── Per-agent research functions ────────────────────────────────────

/**
 * Get agent's research tree.
 * @param {string} agentId
 * @returns {Object} { moveId: { unlocked: bool, level: number } }
 */
async function getAgentResearch(agentId) {
  const prog = await prisma.agentProgression.findUnique({
    where: { agentId },
    select: { research: true },
  });
  return parseResearch(prog?.research);
}

/**
 * Check if an agent can learn/upgrade a move (gated by agent's own research).
 * @param {string} agentId
 * @param {string} moveId
 * @param {number} targetLevel
 * @returns {{ allowed: boolean, reason?: string, researchLevel: number }}
 */
async function canAgentLearnMove(agentId, moveId, targetLevel) {
  if (!MOVE_BRANCHES[moveId]) {
    return { allowed: false, reason: 'Unknown move', researchLevel: 0 };
  }

  const research = await getAgentResearch(agentId);
  const entry = research[moveId];

  if (!entry || !entry.unlocked) {
    return { allowed: false, reason: 'Move not researched', researchLevel: 0 };
  }

  if (targetLevel > entry.level) {
    return { allowed: false, reason: 'Research level too low', researchLevel: entry.level };
  }

  return { allowed: true, researchLevel: entry.level };
}

/**
 * Validate an agent's deck against its own research.
 * @param {string} agentId
 * @param {Array<string>} deck
 * @param {Array<{moveId: string, level: number}>} agentMoves
 * @returns {{ valid: boolean, invalidMoves: string[], reasons: string[] }}
 */
async function validateAgentDeck(agentId, deck, agentMoves) {
  const research = await getAgentResearch(agentId);
  const agentMoveMap = Object.fromEntries(agentMoves.map(m => [m.moveId, m.level]));

  const invalidMoves = [];
  const reasons = [];

  for (const moveId of deck) {
    if (!agentMoveMap[moveId]) {
      invalidMoves.push(moveId);
      reasons.push(`Move not learned: ${moveId}`);
      continue;
    }
    if (!research[moveId] || !research[moveId].unlocked) {
      invalidMoves.push(moveId);
      reasons.push(`Move not researched: ${moveId}`);
    }
  }

  return { valid: invalidMoves.length === 0, invalidMoves, reasons };
}

/**
 * Get all moves for an agent's research tree view + learning status.
 * Returns ALL 18 moves organized by branch, with research + learn status.
 *
 * @param {string} agentId
 * @returns {Array<{moveId, branch, position, researchLevel, locked, unlockable, agentLearnedLevel, canLearnUpgrade, learnXpCost, researchCost}>}
 */
async function getAvailableMovesForAgent(agentId) {
  const agentProg = await prisma.agentProgression.findUnique({ where: { agentId } });
  if (!agentProg) return [];

  const research = parseResearch(agentProg.research);
  const agentMoveMap = {};
  if (Array.isArray(agentProg.moves)) {
    for (const m of agentProg.moves) {
      agentMoveMap[m.moveId] = m.level;
    }
  }

  const result = [];

  for (const [branch, moves] of Object.entries(BRANCH_MOVES)) {
    for (let i = 0; i < moves.length; i++) {
      const moveId = moves[i];
      const entry = research[moveId];
      const researchLevel = entry?.unlocked ? entry.level : 0;
      const agentLearnedLevel = agentMoveMap[moveId] || 0;
      const position = i;

      // Research status
      const isUnlocked = !!entry?.unlocked;
      let locked = !isUnlocked;
      let unlockable = false;
      let researchCost = null;

      if (!isUnlocked) {
        // Check if first move in branch (always unlockable, free)
        if (i === 0) {
          unlockable = true;
          researchCost = { taps: 0, exp: 0 };
        } else {
          // Check prerequisite: previous move must be researched at Lv3+
          const prevMoveId = moves[i - 1];
          const prevEntry = research[prevMoveId];
          if (prevEntry?.unlocked && prevEntry.level >= 3) {
            unlockable = true;
            researchCost = UNLOCK_REQUIREMENTS[prevEntry.level] || UNLOCK_REQUIREMENTS[5];
          }
        }
      } else if (researchLevel < 5) {
        // Can upgrade research
        const targetLevel = researchLevel + 1;
        researchCost = LEVEL_UP_REQUIREMENTS[targetLevel] || null;
      }

      // Learn status (capped by research level)
      const canLearnUpgrade = isUnlocked && agentLearnedLevel < researchLevel && agentLearnedLevel < 5;
      const nextLearnLevel = agentLearnedLevel + 1;
      const learnXpCost = canLearnUpgrade ? (nextLearnLevel <= 1 ? 0 : (LEVEL_UP_XP_COST[nextLearnLevel] || 0)) : null;

      result.push({
        moveId,
        branch,
        position,
        researchLevel,
        locked,
        unlockable,
        agentLearnedLevel,
        canLearnUpgrade,
        learnXpCost,
        researchCost,
      });
    }
  }

  return result;
}

/**
 * Calculate the cost of a research action (unlock or upgrade).
 *
 * @param {string} action - 'unlock' or 'upgrade'
 * @param {string} moveId
 * @param {Object} research - agent's current research tree
 * @returns {{ taps: number, exp: number } | null} cost or null if action not possible
 */
function calculateResearchCost(action, moveId, research) {
  const branch = MOVE_BRANCHES[moveId];
  if (!branch) return null;

  if (action === 'unlock') {
    const entry = research[moveId];
    if (entry?.unlocked) return null; // Already unlocked

    const position = getMovePosition(moveId);
    if (position === 0) {
      return { taps: 0, exp: 0 }; // First move in branch is free
    }

    const prevMoveId = getPreviousMove(moveId);
    if (!prevMoveId) return null;
    const prevEntry = research[prevMoveId];
    if (!prevEntry?.unlocked || prevEntry.level < 3) return null; // Prerequisite not met

    return UNLOCK_REQUIREMENTS[prevEntry.level] || UNLOCK_REQUIREMENTS[5];
  }

  if (action === 'upgrade') {
    const entry = research[moveId];
    if (!entry?.unlocked) return null; // Not unlocked
    if (entry.level >= 5) return null; // Max level

    const targetLevel = entry.level + 1;
    return LEVEL_UP_REQUIREMENTS[targetLevel] || null;
  }

  return null;
}

/**
 * Validate and execute a research action (unlock or upgrade).
 * Runs in a transaction: deducts User.totalTaps + Agent branchXp, updates research.
 *
 * @param {string} agentId
 * @param {string} userId
 * @param {string} action - 'unlock' or 'upgrade'
 * @param {string} moveId
 * @returns {{ success: boolean, error?: string, progression?: Object, tapsSpent?: number, xpSpent?: number }}
 */
async function executeResearchAction(agentId, userId, action, moveId) {
  if (!MOVE_BRANCHES[moveId]) {
    return { success: false, error: 'Unknown move' };
  }
  if (action !== 'unlock' && action !== 'upgrade') {
    return { success: false, error: 'Invalid action' };
  }

  const [agentProg, user, agent] = await Promise.all([
    prisma.agentProgression.findUnique({ where: { agentId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, totalTaps: true } }),
    prisma.agent.findUnique({ where: { id: agentId }, select: { ownerId: true, status: true } }),
  ]);

  if (!agentProg || !user || !agent) {
    return { success: false, error: 'Agent or user not found' };
  }
  if (agent.ownerId !== userId) {
    return { success: false, error: 'Access denied' };
  }
  if (agent.status === 'fighting') {
    return { success: false, error: 'Cannot research while fighting' };
  }

  const research = parseResearch(agentProg.research);
  const cost = calculateResearchCost(action, moveId, research);

  if (!cost) {
    if (action === 'unlock') {
      const entry = research[moveId];
      if (entry?.unlocked) return { success: false, error: 'Move already unlocked' };
      return { success: false, error: 'Prerequisites not met' };
    }
    if (action === 'upgrade') {
      const entry = research[moveId];
      if (!entry?.unlocked) return { success: false, error: 'Move not unlocked' };
      if (entry.level >= 5) return { success: false, error: 'Already at max level' };
      return { success: false, error: 'Cannot upgrade' };
    }
    return { success: false, error: 'Action not possible' };
  }

  // Check resources
  if (cost.taps > 0 && user.totalTaps < cost.taps) {
    return { success: false, error: 'Not enough taps' };
  }

  const branch = MOVE_BRANCHES[moveId];
  const xpField = BRANCH_XP_FIELD[branch];
  if (cost.exp > 0 && agentProg[xpField] < cost.exp) {
    return { success: false, error: 'Not enough branch XP' };
  }

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct taps from User
    if (cost.taps > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { totalTaps: { decrement: cost.taps } },
      });
    }

    // Build research update
    const updatedResearch = { ...research };
    if (action === 'unlock') {
      updatedResearch[moveId] = { unlocked: true, level: 1 };
    } else {
      updatedResearch[moveId] = { ...updatedResearch[moveId], level: updatedResearch[moveId].level + 1 };
    }

    // Build progression update
    const progUpdate = { research: updatedResearch };
    if (cost.exp > 0) {
      progUpdate[xpField] = { decrement: cost.exp };
    }

    const updated = await tx.agentProgression.update({
      where: { agentId },
      data: progUpdate,
    });

    return updated;
  });

  return {
    success: true,
    progression: result,
    tapsSpent: cost.taps,
    xpSpent: cost.exp,
  };
}

module.exports = {
  MOVE_BRANCHES,
  ALL_MOVE_IDS,
  LEVEL_UP_XP_COST,
  LEVEL_UP_REQUIREMENTS,
  UNLOCK_REQUIREMENTS,
  BRANCH_XP_FIELD,
  BRANCH_MOVES,
  getMovePosition,
  getPreviousMove,
  parseResearch,
  ensureResearch,
  getAgentResearch,
  canAgentLearnMove,
  validateAgentDeck,
  getAvailableMovesForAgent,
  calculateResearchCost,
  executeResearchAction,
};
