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
 * Gather club fight stats for a period (Lv2: includes per-agent details).
 * @param {string} clubId
 * @param {string} period
 * @returns {Object} stats
 */
async function gatherClubStats(clubId, period) {
  const { start, end } = getDateRange(period);

  const agents = await prisma.agent.findMany({
    where: { clubId },
    include: { tactics: true },
    select: undefined, // need all fields + tactics
  });

  // Re-query with select since include and select can't combine
  const agentsRaw = await prisma.agent.findMany({
    where: { clubId },
    include: { tactics: true },
  });

  if (!agentsRaw.length) return { agents: [], agentStats: [], totalFights: 0 };

  const agentIds = agentsRaw.map(a => a.id);

  const fights = await prisma.agentFightLog.findMany({
    where: {
      agentId: { in: agentIds },
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Aggregate totals
  const totalFights = fights.length;
  const wins = fights.filter(f => f.result === 'victory').length;
  const losses = fights.filter(f => f.result === 'defeat').length;
  const draws = fights.filter(f => f.result === 'draw').length;
  const winRate = totalFights > 0 ? Math.round((wins / totalFights) * 100) : 0;
  const totalXpEarned = fights.reduce((s, f) => s + (f.xpEarned || 0), 0);

  // Per-agent detailed breakdown
  const agentStats = agentsRaw.map(a => {
    const af = fights.filter(f => f.agentId === a.id);
    const aWins = af.filter(f => f.result === 'victory').length;
    const aLosses = af.filter(f => f.result === 'defeat').length;
    const aDraws = af.filter(f => f.result === 'draw').length;
    const aTotal = af.length;

    // Recent results (last 5)
    const recentResults = af.slice(0, 5).map(f =>
      f.result === 'victory' ? 'W' : f.result === 'defeat' ? 'L' : 'D'
    );

    // Fight detail metrics
    const fightData = af.map(f => f.fightData).filter(Boolean);
    const avgRounds = aTotal > 0 ? Math.round(af.reduce((s, f) => s + (f.rounds || 0), 0) / aTotal * 10) / 10 : 0;
    const avgHpLeft = aWins > 0 ? Math.round(af.filter(f => f.result === 'victory').reduce((s, f) => s + (f.playerHpLeft || 0), 0) / aWins) : 0;

    // Dice/coach/emergency rates from fightData
    let diceCount = 0, coachCount = 0, emergencyCount = 0;
    for (const fd of fightData) {
      if (fd.totalDiceUsed?.fighter1 > 0) diceCount++;
      if (fd.totalCoachUsed?.fighter1 > 0) coachCount++;
      const hasEmergency = (fd.roundLog || []).some(r => r.fighter1?.emergencyTriggered);
      if (hasEmergency) emergencyCount++;
    }

    return {
      agentId: a.id,
      name: a.name,
      skin: a.skin,
      elo: a.elo,
      eloChange: af.reduce((s, f) => s + (f.eloChange || 0), 0),
      fights: aTotal,
      wins: aWins,
      losses: aLosses,
      draws: aDraws,
      winRate: aTotal >= 3 ? Math.round((aWins / aTotal) * 100) : null,
      xpEarned: af.reduce((s, f) => s + (f.xpEarned || 0), 0),
      fightMode: a.tactics?.fightMode || 'pve_training',
      tactics: {
        aggression: a.tactics?.aggression || 'balanced',
        dicePolicy: a.tactics?.dicePolicy || 'smart',
        coachPreference: a.tactics?.coachPreference || 'auto',
      },
      build: {
        primary: a.primaryModule,
        secondary: a.secondaryModule,
        tertiary: a.tertiaryModule,
      },
      recentResults,
      avgRounds,
      avgHpLeft,
      diceUsageRate: aTotal > 0 ? Math.round((diceCount / aTotal) * 100) : 0,
      coachUsageRate: aTotal > 0 ? Math.round((coachCount / aTotal) * 100) : 0,
      emergencyRate: aTotal > 0 ? Math.round((emergencyCount / aTotal) * 100) : 0,
    };
  });

  // Best/worst by win rate (min 3 fights)
  const withRate = agentStats.filter(a => a.winRate !== null).sort((a, b) => b.winRate - a.winRate);
  const bestAgent = withRate[0] || null;
  const worstAgent = withRate.length > 1 ? withRate[withRate.length - 1] : null;

  // Mode breakdown
  const pveCount = fights.filter(f => f.mode === 'pve_training').length;
  const rankedCount = fights.filter(f => f.mode === 'ranked').length;
  const freeCount = fights.filter(f => f.mode === 'free_arena').length;

  return {
    agentStats,
    totalFights, wins, losses, draws, winRate, totalXpEarned,
    bestAgent, worstAgent,
    pveCount, rankedCount, freeCount,
  };
}

/**
 * Build Claude prompt for morning report (Lv2: includes per-agent analysis request).
 */
function buildMorningReportPrompt(clubName, clubLevel, stats) {
  const activeAgents = stats.agentStats.filter(a => a.fights > 0);

  let agentSections = '';
  for (const a of activeAgents) {
    agentSections += `\nAgent: "${a.name}" (${a.build.primary}/${a.build.secondary}/${a.build.tertiary})
ELO: ${a.elo} (${a.eloChange >= 0 ? '+' : ''}${a.eloChange})
Mode: ${a.fightMode} | Tactics: ${a.tactics.aggression}/${a.tactics.dicePolicy}/${a.tactics.coachPreference}
Record: ${a.wins}W/${a.losses}L/${a.draws}D${a.winRate !== null ? ` (${a.winRate}%)` : ''}
Recent: ${a.recentResults.join(' ') || 'none'}
Avg rounds: ${a.avgRounds}, Avg HP left (wins): ${a.avgHpLeft}
Dice use: ${a.diceUsageRate}%, Coach use: ${a.coachUsageRate}%, Emergency: ${a.emergencyRate}%
`;
  }

  return `You are an AI fight club manager assistant for Hexlash, a battle game.

Analyze this club's performance and provide a morning report with per-agent analysis.

Club: "${clubName}" (Level ${clubLevel})
Active agents: ${activeAgents.length}

Fight Summary:
- Total fights: ${stats.totalFights}
- Wins: ${stats.wins}, Losses: ${stats.losses}, Draws: ${stats.draws} (${stats.winRate}% win rate)
${stats.bestAgent ? `- Best agent: ${stats.bestAgent.name} (${stats.bestAgent.winRate}%, ${stats.bestAgent.fights} fights)` : ''}
${stats.worstAgent ? `- Worst agent: ${stats.worstAgent.name} (${stats.worstAgent.winRate}%, ${stats.worstAgent.fights} fights)` : ''}
- Modes: PvE: ${stats.pveCount}, Ranked: ${stats.rankedCount}, Free Arena: ${stats.freeCount}
- Total XP earned: ${stats.totalXpEarned}

Agent details:${agentSections}

Respond in JSON format:
{
  "summary": "2-3 sentence overall assessment",
  "highlights": "What went well (1-2 sentences)",
  "concerns": "What needs attention (1-2 sentences, or 'None' if all good)",
  "recommendation": "One actionable advice (1 sentence)",
  "agents": [
    {
      "name": "exact agent name",
      "assessment": "1-2 sentence performance assessment",
      "tacticsAdvice": "Specific tactics advice or 'Current tactics are working well'",
      "buildAdvice": "Build advice or 'Build is solid'"
    }
  ]
}

Include one entry in "agents" for each agent listed above. Be concise, specific. Tone: professional fight manager.`;
}

module.exports = { gatherClubStats, buildMorningReportPrompt, getDateRange };
