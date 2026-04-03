/**
 * Agent Scheduler — runs automatic agent fights on a timer.
 * Agents with autoFight=true fight PvE bots based on their restPeriod.
 */

const prisma = require('../lib/prisma');
const { runAutoFight, runRankedFight } = require('./agentFightService');
const { findRankedPairs } = require('./rankedMatchmaker');
const {
  AGENT_SCHEDULER_TICK_MS,
  AGENT_MAX_FIGHTS_PER_TICK,
  AGENT_MAX_FIGHTS_PER_DAY,
  AGENT_STUCK_TIMEOUT_MS,
} = require('../config');

let schedulerInterval = null;
let isProcessing = false;

/**
 * Start the scheduler. Called once on server boot.
 */
function startScheduler() {
  if (schedulerInterval) return;
  console.log(`[AgentScheduler] Started, tick every ${AGENT_SCHEDULER_TICK_MS / 1000}s`);
  schedulerInterval = setInterval(tick, AGENT_SCHEDULER_TICK_MS);
  // First tick immediately (catch up agents that waited during downtime)
  tick();
}

/**
 * Stop the scheduler (graceful shutdown).
 */
function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[AgentScheduler] Stopped');
  }
}

/**
 * One scheduler tick.
 */
async function tick() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // Recover stuck agents (fighting > 5 min)
    await recoverStuckAgents();

    // Wake up resting agents whose rest period has elapsed
    await wakeUpRestingAgents();

    // Find agents ready for auto-fight
    const readyAgents = await getReadyAgents();

    let fightsRun = 0;

    // PvE Training fights
    const pveAgents = readyAgents.filter(a => !a.tactics?.fightMode || a.tactics.fightMode === 'pve_training');
    for (const agent of pveAgents) {
      if (fightsRun >= AGENT_MAX_FIGHTS_PER_TICK) break;
      try {
        await runScheduledFight(agent);
        fightsRun++;
      } catch (err) {
        console.error(`[AgentScheduler] PvE fight failed for agent ${agent.id}:`, err.message);
      }
    }

    // Ranked fights
    try {
      const pairs = await findRankedPairs();
      for (const { agent1, agent2 } of pairs) {
        if (fightsRun >= AGENT_MAX_FIGHTS_PER_TICK) break;
        try {
          await runRankedFight(agent1.id, agent2.id);
          // Set both to resting
          const rest1 = agent1.tactics?.restPeriod || 600000;
          const rest2 = agent2.tactics?.restPeriod || 600000;
          await prisma.agent.update({ where: { id: agent1.id }, data: { status: 'resting', nextFightAt: new Date(Date.now() + rest1) } });
          await prisma.agent.update({ where: { id: agent2.id }, data: { status: 'resting', nextFightAt: new Date(Date.now() + rest2) } });
          fightsRun += 2;
        } catch (err) {
          console.error(`[AgentScheduler] Ranked fight failed:`, err.message);
        }
      }
    } catch (err) {
      console.error('[AgentScheduler] Ranked matchmaking error:', err.message);
    }

    if (fightsRun > 0) {
      console.log(`[AgentScheduler] Tick: ${fightsRun} fights completed`);
    }
  } catch (err) {
    console.error('[AgentScheduler] Tick error:', err);
  } finally {
    isProcessing = false;
  }
}

/**
 * Recover agents stuck in 'fighting' status for too long.
 */
async function recoverStuckAgents() {
  const cutoff = new Date(Date.now() - AGENT_STUCK_TIMEOUT_MS);
  const { count } = await prisma.agent.updateMany({
    where: {
      status: 'fighting',
      updatedAt: { lt: cutoff },
    },
    data: { status: 'idle' },
  });
  if (count > 0) {
    console.log(`[AgentScheduler] Recovered ${count} stuck agents`);
  }
}

/**
 * Wake up resting agents whose nextFightAt has passed.
 */
async function wakeUpRestingAgents() {
  await prisma.agent.updateMany({
    where: {
      status: 'resting',
      nextFightAt: { lte: new Date() },
    },
    data: { status: 'idle' },
  });
}

/**
 * Find agents ready for an automatic fight.
 */
async function getReadyAgents() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const agents = await prisma.agent.findMany({
    where: {
      status: 'idle',
      autoFight: true,
    },
    include: {
      tactics: true,
      progression: true,
      _count: {
        select: {
          fightLogs: {
            where: { createdAt: { gte: startOfDay } },
          },
        },
      },
    },
    take: AGENT_MAX_FIGHTS_PER_TICK * 2,
  });

  return agents.filter(agent => {
    const deck = agent.progression?.deck;
    if (!Array.isArray(deck) || deck.length < 4) return false;
    if (agent._count.fightLogs >= AGENT_MAX_FIGHTS_PER_DAY) return false;
    return true;
  });
}

/**
 * Run an auto-fight for one agent and set resting status after.
 */
async function runScheduledFight(agent) {
  await runAutoFight(agent.id, agent.ownerId);

  // Set resting with next fight time
  const restPeriod = agent.tactics?.restPeriod || 600000;
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      status: 'resting',
      nextFightAt: new Date(Date.now() + restPeriod),
    },
  });
}

module.exports = { startScheduler, stopScheduler };
