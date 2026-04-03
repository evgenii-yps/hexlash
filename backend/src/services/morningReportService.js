/**
 * Morning Report Service — gathers club stats and builds Claude prompt for daily reports.
 */

const prisma = require('../lib/prisma');

/**
 * Get date range from period string.
 */
function getDateRange(period) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'yesterday': {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 1);
      return { start, end: startOfToday };
    }
    case 'last_7d':
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
    case 'today':
    default:
      return { start: startOfToday, end: now };
  }
}

/**
 * Gather club fight stats for a period.
 * @param {string} clubId
 * @param {string} period
 * @returns {Object} stats
 */
async function gatherClubStats(clubId, period) {
  const { start, end } = getDateRange(period);

  // Get all agents for this club
  const agents = await prisma.agent.findMany({
    where: { clubId },
    select: { id: true, name: true, elo: true, wins: true, losses: true, draws: true, totalFights: true, primaryModule: true, secondaryModule: true, tertiaryModule: true },
  });

  if (!agents.length) return { agents: [], fights: [], totalFights: 0 };

  const agentIds = agents.map(a => a.id);

  // Get fight logs for period
  const fights = await prisma.agentFightLog.findMany({
    where: {
      agentId: { in: agentIds },
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Aggregate stats
  const totalFights = fights.length;
  const wins = fights.filter(f => f.result === 'victory').length;
  const losses = fights.filter(f => f.result === 'defeat').length;
  const draws = fights.filter(f => f.result === 'draw').length;
  const winRate = totalFights > 0 ? Math.round((wins / totalFights) * 100) : 0;
  const totalXpEarned = fights.reduce((s, f) => s + (f.xpEarned || 0), 0);

  // Per-agent breakdown
  const agentStats = agents.map(a => {
    const agentFights = fights.filter(f => f.agentId === a.id);
    const aWins = agentFights.filter(f => f.result === 'victory').length;
    const aTotal = agentFights.length;
    return {
      name: a.name,
      elo: a.elo,
      fights: aTotal,
      wins: aWins,
      losses: agentFights.filter(f => f.result === 'defeat').length,
      draws: agentFights.filter(f => f.result === 'draw').length,
      winRate: aTotal >= 3 ? Math.round((aWins / aTotal) * 100) : null,
      modules: [a.primaryModule, a.secondaryModule, a.tertiaryModule],
      totalEloChange: agentFights.reduce((s, f) => s + (f.eloChange || 0), 0),
    };
  }).filter(a => a.fights > 0);

  // Best/worst by win rate (min 3 fights)
  const ranked = agentStats.filter(a => a.winRate !== null).sort((a, b) => b.winRate - a.winRate);
  const bestAgent = ranked[0] || null;
  const worstAgent = ranked.length > 1 ? ranked[ranked.length - 1] : null;

  // Mode breakdown
  const pveCount = fights.filter(f => f.mode === 'pve_training').length;
  const rankedCount = fights.filter(f => f.mode === 'ranked').length;
  const freeCount = fights.filter(f => f.mode === 'free_arena').length;

  return {
    agents: agentStats,
    totalFights, wins, losses, draws, winRate, totalXpEarned,
    bestAgent, worstAgent,
    pveCount, rankedCount, freeCount,
  };
}

/**
 * Build Claude prompt for morning report.
 */
function buildMorningReportPrompt(clubName, clubLevel, stats) {
  let agentSummaries = '';
  for (const a of stats.agents) {
    agentSummaries += `- ${a.name} (ELO ${a.elo}, ${a.modules.join('/')}): ${a.wins}W/${a.losses}L/${a.draws}D`;
    if (a.totalEloChange) agentSummaries += ` ELO ${a.totalEloChange > 0 ? '+' : ''}${a.totalEloChange}`;
    agentSummaries += '\n';
  }

  return `You are an AI fight club manager assistant for Hexlash, a battle game.

Analyze this club's performance and provide a brief morning report.

Club: "${clubName}" (Level ${clubLevel})
Agents: ${stats.agents.length}

Fight Summary:
- Total fights: ${stats.totalFights}
- Wins: ${stats.wins}, Losses: ${stats.losses}, Draws: ${stats.draws} (${stats.winRate}% win rate)
${stats.bestAgent ? `- Best agent: ${stats.bestAgent.name} (${stats.bestAgent.winRate}% win rate, ${stats.bestAgent.fights} fights)` : ''}
${stats.worstAgent ? `- Worst agent: ${stats.worstAgent.name} (${stats.worstAgent.winRate}% win rate, ${stats.worstAgent.fights} fights)` : ''}
- Modes: PvE: ${stats.pveCount}, Ranked: ${stats.rankedCount}, Free Arena: ${stats.freeCount}
- Total XP earned: ${stats.totalXpEarned}

Agent details:
${agentSummaries}

Respond in JSON format:
{
  "summary": "2-3 sentence overall assessment",
  "highlights": "What went well (1-2 sentences)",
  "concerns": "What needs attention (1-2 sentences, or 'None' if all good)",
  "recommendation": "One actionable advice (1 sentence)"
}

Be concise, specific, reference agent names and numbers. Tone: professional fight manager.`;
}

module.exports = { gatherClubStats, buildMorningReportPrompt, getDateRange };
