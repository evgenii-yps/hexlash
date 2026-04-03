/**
 * Agent Fight Service — orchestrates agent fights (PvE Training, Ranked, Free Arena).
 * Handles: combat simulation, XP distribution, fight logging, agent status updates.
 */

const prisma = require('../lib/prisma');
const { simulateAgentFight, generatePveBot } = require('./agentCombatEngine');
const { addFightClubXp, getFightClubLegendBuff, getFightXpReward } = require('./fightClubService');
const { MOVE_BRANCHES } = require('./researchGateService');
const { calculateElo } = require('./eloService');

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
    const legendBuff = await getFightClubLegendBuff(agent.fightClubId);
    const fightResult = simulateAgentFight(fighter1, bot, { mode: 'pve_training', legendBuff });

    // Calculate XP (with legend XP buff)
    const rawXp = BASE_FIGHT_XP[fightResult.result] || BASE_FIGHT_XP.defeat;
    let xpMultiplier = XP_MULTIPLIERS.pve_training;
    if (legendBuff?.xpBonus) {
      const archMatch = agent.primaryModule === legendBuff.archetype;
      xpMultiplier *= 1 + (archMatch ? legendBuff.xpBonus * 1.5 : legendBuff.xpBonus);
    }
    const earnedXp = Math.round(rawXp * xpMultiplier);
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
    if (agent.fightClubId && clubXpAmount > 0) {
      addFightClubXp(agent.fightClubId, clubXpAmount)
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

/**
 * Core agent-vs-agent fight. Used by ranked and free arena.
 * @param {string} agent1Id
 * @param {string} agent2Id
 * @param {Object} options - { mode, applyElo, xpMultiplier }
 * @returns {Object} fight result for both agents
 */
async function _executeAgentVsAgentFight(agent1Id, agent2Id, options) {
  const { mode = 'ranked', applyElo = true, xpMultiplier = 1.0 } = options;

  const [a1, a2] = await Promise.all([
    prisma.agent.findUnique({ where: { id: agent1Id }, include: { tactics: true, progression: true } }),
    prisma.agent.findUnique({ where: { id: agent2Id }, include: { tactics: true, progression: true } }),
  ]);

  if (!a1 || !a2) throw new Error('Agent not found');
  if (a1.status !== 'idle' || a2.status !== 'idle') throw new Error('Agent not idle');

  await prisma.$transaction([
    prisma.agent.update({ where: { id: agent1Id }, data: { status: 'fighting' } }),
    prisma.agent.update({ where: { id: agent2Id }, data: { status: 'fighting' } }),
  ]);

  try {
    const fighter1 = {
      agent: { primaryModule: a1.primaryModule, secondaryModule: a1.secondaryModule, tertiaryModule: a1.tertiaryModule },
      tactics: a1.tactics, progression: a1.progression,
    };
    const fighter2 = {
      agent: { primaryModule: a2.primaryModule, secondaryModule: a2.secondaryModule, tertiaryModule: a2.tertiaryModule },
      tactics: a2.tactics, progression: a2.progression,
    };

    // Get legend buff (use a1's club, both agents may have different clubs)
    const legendBuff1 = await getFightClubLegendBuff(a1.fightClubId);
    const fightResult = simulateAgentFight(fighter1, fighter2, { mode, legendBuff: legendBuff1 });

    // ELO (only for ranked)
    let eloChangeA = 0, eloChangeB = 0, newEloA = a1.elo, newEloB = a2.elo;
    if (applyElo) {
      const elo = calculateElo(a1.elo, a2.elo, fightResult.result);
      eloChangeA = elo.changeA;
      eloChangeB = elo.changeB;
      newEloA = elo.newRatingA;
      newEloB = elo.newRatingB;
    }

    // XP for agent 1
    const a1RawXp = BASE_FIGHT_XP[fightResult.result] || BASE_FIGHT_XP.defeat;
    const a1Xp = Math.round(a1RawXp * xpMultiplier);
    const a1BranchXp = distributeXpByBranch(fightResult.roundLog, a1Xp);

    // Invert result for agent 2
    const a2Result = fightResult.result === 'victory' ? 'defeat' : fightResult.result === 'defeat' ? 'victory' : 'draw';
    const a2RawXp = BASE_FIGHT_XP[a2Result] || BASE_FIGHT_XP.defeat;
    const a2Xp = Math.round(a2RawXp * xpMultiplier);

    // XP distribution for agent 2 (fighter2 moves)
    const a2BranchCounts = { speed: 0, power: 0, technique: 0 };
    for (const round of fightResult.roundLog) {
      const moveId = round.fighter2?.move?.moveId;
      if (moveId && MOVE_BRANCHES[moveId]) a2BranchCounts[MOVE_BRANCHES[moveId]]++;
    }
    const a2Total = a2BranchCounts.speed + a2BranchCounts.power + a2BranchCounts.technique;
    const a2BranchXp = a2Total === 0
      ? { speedXp: 0, powerXp: 0, techniqueXp: 0 }
      : {
          speedXp: Math.max(a2BranchCounts.speed > 0 ? 1 : 0, Math.floor(a2Xp * a2BranchCounts.speed / a2Total)),
          powerXp: Math.max(a2BranchCounts.power > 0 ? 1 : 0, Math.floor(a2Xp * a2BranchCounts.power / a2Total)),
          techniqueXp: Math.max(a2BranchCounts.technique > 0 ? 1 : 0, Math.floor(a2Xp * a2BranchCounts.technique / a2Total)),
        };

    const statsFor = (result, newElo) => {
      const s = { totalFights: { increment: 1 }, lastFightAt: new Date(), status: 'idle', elo: newElo };
      if (result === 'victory') s.wins = { increment: 1 };
      else if (result === 'defeat') s.losses = { increment: 1 };
      else s.draws = { increment: 1 };
      return s;
    };

    const a1ClubXp = getFightXpReward(fightResult.result, mode);
    const a2ClubXp = getFightXpReward(a2Result, mode);

    await prisma.$transaction([
      prisma.agent.update({ where: { id: agent1Id }, data: statsFor(fightResult.result, newEloA) }),
      prisma.agent.update({ where: { id: agent2Id }, data: statsFor(a2Result, newEloB) }),
      prisma.agentProgression.update({
        where: { agentId: agent1Id },
        data: { speedXp: { increment: a1BranchXp.speedXp }, powerXp: { increment: a1BranchXp.powerXp }, techniqueXp: { increment: a1BranchXp.techniqueXp } },
      }),
      prisma.agentProgression.update({
        where: { agentId: agent2Id },
        data: { speedXp: { increment: a2BranchXp.speedXp }, powerXp: { increment: a2BranchXp.powerXp }, techniqueXp: { increment: a2BranchXp.techniqueXp } },
      }),
      prisma.agentFightLog.create({
        data: {
          agentId: agent1Id, mode, result: fightResult.result,
          opponentName: a2.name, opponentId: agent2Id, opponentOwnerId: a2.ownerId,
          rounds: fightResult.rounds, playerHpLeft: fightResult.fighter1HpLeft, opponentHpLeft: fightResult.fighter2HpLeft,
          xpEarned: a1Xp, eloChange: eloChangeA, fightData: fightResult,
        },
      }),
      prisma.agentFightLog.create({
        data: {
          agentId: agent2Id, mode, result: a2Result,
          opponentName: a1.name, opponentId: agent1Id, opponentOwnerId: a1.ownerId,
          rounds: fightResult.rounds, playerHpLeft: fightResult.fighter2HpLeft, opponentHpLeft: fightResult.fighter1HpLeft,
          xpEarned: a2Xp, eloChange: eloChangeB, fightData: fightResult,
        },
      }),
    ]);

    if (a1.fightClubId && a1ClubXp > 0) addFightClubXp(a1.fightClubId, a1ClubXp).catch(e => console.error('Club XP error:', e));
    if (a2.fightClubId && a2ClubXp > 0) addFightClubXp(a2.fightClubId, a2ClubXp).catch(e => console.error('Club XP error:', e));

    return {
      result: fightResult.result, rounds: fightResult.rounds,
      agent1: { id: agent1Id, result: fightResult.result, eloChange: eloChangeA, newElo: newEloA, xpEarned: a1Xp },
      agent2: { id: agent2Id, result: a2Result, eloChange: eloChangeB, newElo: newEloB, xpEarned: a2Xp },
    };
  } catch (err) {
    await prisma.agent.updateMany({ where: { id: { in: [agent1Id, agent2Id] } }, data: { status: 'idle' } }).catch(() => {});
    throw err;
  }
}

/** Ranked fight: ELO changes, 100% XP. */
async function runRankedFight(agent1Id, agent2Id) {
  return _executeAgentVsAgentFight(agent1Id, agent2Id, { mode: 'ranked', applyElo: true, xpMultiplier: XP_MULTIPLIERS.ranked });
}

/** Free Arena fight: no ELO, 80% XP. */
async function runFreeArenaFight(agent1Id, agent2Id) {
  return _executeAgentVsAgentFight(agent1Id, agent2Id, { mode: 'free_arena', applyElo: false, xpMultiplier: XP_MULTIPLIERS.free_arena });
}

module.exports = {
  XP_MULTIPLIERS,
  BASE_FIGHT_XP,
  MANUAL_FIGHT_COOLDOWN_MS,
  distributeXpByBranch,
  runPveTraining,
  runAutoFight,
  runRankedFight,
  runFreeArenaFight,
};
