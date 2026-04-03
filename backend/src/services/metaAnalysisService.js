/**
 * Meta Analysis Service — gathers global stats for Lv3 premium reports.
 */

const prisma = require('../lib/prisma');

const MIN_AGENTS_FOR_META = 10;

/**
 * Gather global meta statistics for comparison.
 * @returns {Object|null} metaStats (null if insufficient data)
 */
async function gatherMetaStats() {
  const totalAgents = await prisma.agent.count();
  if (totalAgents < MIN_AGENTS_FOR_META) return null;

  // Average ELO
  const eloAgg = await prisma.agent.aggregate({ _avg: { elo: true } });
  const avgElo = Math.round(eloAgg._avg.elo || 1000);

  // ELO distribution (get all ELOs, compute percentiles)
  const allElos = await prisma.agent.findMany({
    where: { totalFights: { gte: 5 } },
    select: { elo: true },
    orderBy: { elo: 'asc' },
  });
  const eloValues = allElos.map(a => a.elo);
  const percentile = (arr, p) => arr[Math.floor(arr.length * p / 100)] || 1000;

  // Top builds by win rate (agents with 20+ fights)
  const topAgents = await prisma.agent.findMany({
    where: { totalFights: { gte: 20 } },
    select: { primaryModule: true, secondaryModule: true, tertiaryModule: true, wins: true, totalFights: true },
  });

  const buildMap = {};
  for (const a of topAgents) {
    const key = `${a.primaryModule}/${a.secondaryModule}/${a.tertiaryModule}`;
    if (!buildMap[key]) buildMap[key] = { primary: a.primaryModule, secondary: a.secondaryModule, tertiary: a.tertiaryModule, wins: 0, fights: 0 };
    buildMap[key].wins += a.wins;
    buildMap[key].fights += a.totalFights;
  }
  const topBuilds = Object.values(buildMap)
    .map(b => ({ ...b, winRate: Math.round((b.wins / b.fights) * 100) }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5);

  // Win rates by primary archetype
  const archetypeWinRates = {};
  const archetypes = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];
  for (const arch of archetypes) {
    const agg = await prisma.agent.aggregate({
      where: { primaryModule: arch, totalFights: { gte: 5 } },
      _avg: { wins: true, totalFights: true },
      _count: true,
    });
    if (agg._count > 0 && agg._avg.totalFights > 0) {
      archetypeWinRates[arch] = Math.round((agg._avg.wins / agg._avg.totalFights) * 100);
    }
  }

  // Best tactics combos
  const tacticsAgents = await prisma.agent.findMany({
    where: { totalFights: { gte: 10 } },
    include: { tactics: { select: { aggression: true, dicePolicy: true } } },
    select: { wins: true, totalFights: true, tactics: true },
  });
  const tacticsMap = {};
  for (const a of tacticsAgents) {
    if (!a.tactics) continue;
    const key = `${a.tactics.aggression}/${a.tactics.dicePolicy}`;
    if (!tacticsMap[key]) tacticsMap[key] = { aggression: a.tactics.aggression, dicePolicy: a.tactics.dicePolicy, wins: 0, fights: 0 };
    tacticsMap[key].wins += a.wins;
    tacticsMap[key].fights += a.totalFights;
  }
  const bestTactics = Object.values(tacticsMap)
    .filter(t => t.fights >= 10)
    .map(t => ({ ...t, winRate: Math.round((t.wins / t.fights) * 100) }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5);

  return {
    totalAgents,
    avgElo,
    p25: percentile(eloValues, 25),
    p50: percentile(eloValues, 50),
    p75: percentile(eloValues, 75),
    p90: percentile(eloValues, 90),
    topBuilds,
    archetypeWinRates,
    bestTactics,
  };
}

/**
 * Get club's position in global ranking.
 */
async function getClubRanking(clubId) {
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { wins: true, battles: true } });
  if (!club) return { rank: 0, totalClubs: 0, percentile: 0 };

  const totalClubs = await prisma.club.count({ where: { battles: { gt: 0 } } });
  const clubsAbove = await prisma.club.count({
    where: { battles: { gt: 0 }, wins: { gt: club.wins } },
  });

  const rank = clubsAbove + 1;
  const percentile = totalClubs > 0 ? Math.round((rank / totalClubs) * 100) : 100;

  // Avg ELO of club's agents
  const eloAgg = await prisma.agent.aggregate({
    where: { clubId },
    _avg: { elo: true },
  });

  return {
    rank,
    totalClubs,
    percentile,
    avgElo: Math.round(eloAgg._avg.elo || 1000),
  };
}

module.exports = { gatherMetaStats, getClubRanking, MIN_AGENTS_FOR_META };
