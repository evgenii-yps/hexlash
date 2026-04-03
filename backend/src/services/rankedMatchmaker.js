/**
 * Ranked Matchmaker — finds pairs of agents for ranked fights.
 * Matches by ELO proximity, different owners, rematch cooldown.
 */

const prisma = require('../lib/prisma');
const {
  ELO_MATCH_RANGE,
  RANKED_REMATCH_COOLDOWN,
  RANKED_MAX_PAIRS_PER_TICK,
  AGENT_MAX_FIGHTS_PER_DAY,
} = require('../config');

/**
 * Find pairs of agents ready for ranked fights.
 * @returns {Array<{agent1: Object, agent2: Object}>}
 */
async function findRankedPairs() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const agents = await prisma.agent.findMany({
    where: {
      status: 'idle',
      autoFight: true,
      tactics: { fightMode: 'ranked' },
    },
    include: {
      tactics: true,
      progression: true,
      _count: {
        select: {
          fightLogs: { where: { createdAt: { gte: startOfDay } } },
        },
      },
    },
    orderBy: { elo: 'asc' },
  });

  // Filter: deck >= 4, daily limit
  const eligible = agents.filter(a => {
    const deck = a.progression?.deck;
    if (!Array.isArray(deck) || deck.length < 4) return false;
    if (a._count.fightLogs >= AGENT_MAX_FIGHTS_PER_DAY) return false;
    return true;
  });

  if (eligible.length < 2) return [];

  const pairs = [];
  const matched = new Set();

  for (let i = 0; i < eligible.length && pairs.length < RANKED_MAX_PAIRS_PER_TICK; i++) {
    if (matched.has(eligible[i].id)) continue;
    const a1 = eligible[i];

    for (let j = i + 1; j < eligible.length; j++) {
      if (matched.has(eligible[j].id)) continue;
      const a2 = eligible[j];

      if (a1.ownerId === a2.ownerId) continue;
      if (Math.abs(a1.elo - a2.elo) > ELO_MATCH_RANGE) continue;

      // Rematch cooldown: check if a2 was in a1's last N ranked fights
      const recentOpponents = await prisma.agentFightLog.findMany({
        where: { agentId: a1.id, mode: 'ranked' },
        orderBy: { createdAt: 'desc' },
        take: RANKED_REMATCH_COOLDOWN,
        select: { opponentId: true },
      });
      if (recentOpponents.some(f => f.opponentId === a2.id)) continue;

      pairs.push({ agent1: a1, agent2: a2 });
      matched.add(a1.id);
      matched.add(a2.id);
      break;
    }
  }

  return pairs;
}

module.exports = { findRankedPairs };
