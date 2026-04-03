/**
 * Agent Fight Service — orchestrates agent fights (PvE Training, Ranked, Free Arena).
 * Handles: combat simulation, XP distribution, fight logging, agent status updates.
 */

const prisma = require('../lib/prisma');
const { simulateAgentFight, generatePveBot } = require('./agentCombatEngine');
const { addClubXp, getFightXpReward } = require('./clubLevelService');
const { MOVE_BRANCHES } = require('./researchGateService');

// XP multipliers by mode
const XP_MULTIPLIERS = {
  pve_training: 0.7,
  ranked: 1.0,
  free_arena: 0.8,
};

// Base XP per fight result (before multiplier)
const BASE_FIGHT_XP = {
  victory: 20,
  defeat: 8,
  draw: 14,
};

// Minimum cooldown between manual fights (ms)
const MANUAL_FIGHT_COOLDOWN_MS = 10000;

/**
 * Distribute XP across branches proportionally to moves used in the fight.
 * @param {Array} roundLog - fight round log
 * @param {number} totalXp - total XP to distribute
 * @returns {{ speedXp: number, powerXp: number, techniqueXp: number }}
 */
function distributeXpByBranch(roundLog, totalXp) {
  const branchCounts = { speed: 0, power: 0, technique: 0 };

  for (const round of roundLog) {
    const moveId = round.fighter1?.move?.moveId;
    if (moveId && MOVE_BRANCHES[moveId]) {
      branchCounts[MOVE_BRANCHES[moveId]]++;
    }
  }

  const totalUses = branchCounts.speed + branchCounts.power + branchCounts.technique;
  if (totalUses === 0) {
    return { speedXp: 0, powerXp: 0, techniqueXp: 0 };
  }

  let speedXp = Math.floor(totalXp * branchCounts.speed / totalUses);
  let powerXp = Math.floor(totalXp * branchCounts.power / totalUses);
  let techniqueXp = Math.floor(totalXp * branchCounts.technique / totalUses);

  if (branchCounts.speed > 0 && speedXp === 0) speedXp = 1;
  if (branchCounts.power > 0 && powerXp === 0) powerXp = 1;
  if (branchCounts.technique > 0 && techniqueXp === 0) techniqueXp = 1;

  return { speedXp, powerXp, techniqueXp };
}

/**
 * Core fight execution — shared by manual training and auto-fight.
 * @param {Object} agent - Agent with tactics + progression included
 * @param {Object} options - { statusAfterFight: 'idle'|'resting' }
 * @returns {Object} { fight, updatedAgent, updatedProgression, clubXpResult }
 */
async function _executeFight(agent, options = {}) {
  const { statusAfterFight = 'idle' } = options;

  // Set fighting status
  await prisma.agent.update({ where: { id: agent.id }, data: { status: 'fighting' } });

  try {
    const fighter1 = {
      agent: { primaryModule: agent.primaryModule, secondaryModule: agent.secondaryModule, tertiaryModule: agent.tertiaryModule },
      tactics: agent.tactics,
      progression: agent.progression,
    };

    const bot = generatePveBot(agent.elo);
    const fightResult = simulateAgentFight(fighter1, bot, { mode: 'pve_training' });

    // Calculate XP
    const rawXp = BASE_FIGHT_XP[fightResult.result] || BASE_FIGHT_XP.defeat;
    const earnedXp = Math.round(rawXp * XP_MULTIPLIERS.pve_training);
    const branchXp = distributeXpByBranch(fightResult.roundLog, earnedXp);
    const clubXpAmount = getFightXpReward(fightResult.result, 'pve_training');

    // Stats update
    const statsUpdate = {
      totalFights: { increment: 1 },
      lastFightAt: new Date(),
      status: statusAfterFight,
    };
    if (fightResult.result === 'victory') statsUpdate.wins = { increment: 1 };
    else if (fightResult.result === 'defeat') statsUpdate.losses = { increment: 1 };
    else statsUpdate.draws = { increment: 1 };

    const [updatedAgent, updatedProgression, fightLog] = await prisma.$transaction([
      prisma.agent.update({ where: { id: agent.id }, data: statsUpdate }),
      prisma.agentProgression.update({
        where: { agentId: agent.id },
        data: {
          speedXp: { increment: branchXp.speedXp },
          powerXp: { increment: branchXp.powerXp },
          techniqueXp: { increment: branchXp.techniqueXp },
        },
      }),
      prisma.agentFightLog.create({
        data: {
          agentId: agent.id,
          mode: 'pve_training',
          result: fightResult.result,
          opponentName: bot.agent.name,
          rounds: fightResult.rounds,
          playerHpLeft: fightResult.fighter1HpLeft,
          opponentHpLeft: fightResult.fighter2HpLeft,
          xpEarned: earnedXp,
          eloChange: 0,
          fightData: fightResult,
        },
      }),
    ]);

    // Club XP (async, non-blocking)
    let clubXpResult = { earned: clubXpAmount, leveledUp: false };
    if (agent.clubId && clubXpAmount > 0) {
      addClubXp(agent.clubId, clubXpAmount)
        .then(r => { if (r.leveledUp) clubXpResult.leveledUp = true; })
        .catch(e => console.error('Club XP error:', e));
    }

    return {
      fight: {
        id: fightLog.id,
        mode: 'pve_training',
        result: fightResult.result,
        rounds: fightResult.rounds,
        playerHpLeft: fightResult.fighter1HpLeft,
        opponentHpLeft: fightResult.fighter2HpLeft,
        xpEarned: earnedXp,
        opponentName: bot.agent.name,
        fightData: fightResult,
      },
      agent: {
        wins: updatedAgent.wins,
        losses: updatedAgent.losses,
        draws: updatedAgent.draws,
        totalFights: updatedAgent.totalFights,
      },
      progression: {
        speedXp: updatedProgression.speedXp,
        powerXp: updatedProgression.powerXp,
        techniqueXp: updatedProgression.techniqueXp,
      },
      clubXp: clubXpResult,
    };
  } catch (err) {
    await prisma.agent.update({ where: { id: agent.id }, data: { status: 'idle' } }).catch(() => {});
    throw err;
  }
}

/**
 * Run a manual PvE Training fight.
 * @param {string} agentId
 * @param {string} userId - for ownership check
 * @returns {Object} { fight, agent, progression, clubXp }
 */
async function runPveTraining(agentId, userId) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { tactics: true, progression: true },
  });

  if (!agent) throw Object.assign(new Error('Agent not found'), { status: 404 });
  if (agent.ownerId !== userId) throw Object.assign(new Error('Access denied'), { status: 403 });
  if (agent.status === 'fighting') throw Object.assign(new Error('Agent is busy'), { status: 400 });

  // Cooldown check (manual only)
  if (agent.lastFightAt && (Date.now() - agent.lastFightAt.getTime()) < MANUAL_FIGHT_COOLDOWN_MS) {
    const waitSec = Math.ceil((MANUAL_FIGHT_COOLDOWN_MS - (Date.now() - agent.lastFightAt.getTime())) / 1000);
    throw Object.assign(new Error(`Agent needs rest, try again in ${waitSec} seconds`), { status: 400 });
  }

  const deck = Array.isArray(agent.progression?.deck) ? agent.progression.deck : [];
  if (deck.length < 4) throw Object.assign(new Error('Agent deck must have at least 4 moves'), { status: 400 });

  return _executeFight(agent, { statusAfterFight: 'idle' });
}

/**
 * Run an automatic fight (called by scheduler).
 * No cooldown check, sets status to 'fighting' then caller sets 'resting'.
 * @param {string} agentId
 * @param {string} ownerId
 * @returns {Object} fight result
 */
async function runAutoFight(agentId, ownerId) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { tactics: true, progression: true },
  });

  if (!agent) throw new Error('Agent not found');
  if (agent.ownerId !== ownerId) throw new Error('Ownership mismatch');

  const deck = Array.isArray(agent.progression?.deck) ? agent.progression.deck : [];
  if (deck.length < 4) throw new Error('Deck too small');

  // Status after fight is 'idle' here; scheduler sets 'resting' + nextFightAt after
  return _executeFight(agent, { statusAfterFight: 'idle' });
}

module.exports = {
  XP_MULTIPLIERS,
  BASE_FIGHT_XP,
  MANUAL_FIGHT_COOLDOWN_MS,
  distributeXpByBranch,
  runPveTraining,
  runAutoFight,
};
