/**
 * ============================================================
 * BACKFILL SCRIPT — writes belt/qualifiedWins/isHexmaster to DB
 * ============================================================
 *
 * Replays all AgentFightLog history to calculate each agent's
 * belt grade and qualified wins, then writes results to the
 * Agent table. Run AFTER migration add_belt_system_to_agent.
 *
 * Usage: node backend/scripts/backfill-belts.js
 * Requires: DATABASE_URL env var (or .env file in backend/)
 *
 * CAUTION: This script WRITES to the database. Run on dev first.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { isQualifyingWin, calculateBelt, checkHexmaster, getBeltDisplay, BELT_THRESHOLDS } = require('../src/services/beltService');

function getBeltLabel(grade) {
  const d = getBeltDisplay(grade);
  return d.stripes > 0 ? `${d.color}-${d.stripes}` : d.color;
}

async function main() {
  console.log('============================================================');
  console.log('BACKFILL SCRIPT — writes belt data to Agent table');
  console.log('============================================================\n');

  // 1. Load all agents
  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, wins: true, elo: true },
  });
  console.log(`Total agents: ${agents.length}`);

  // 2. Load all fight logs ordered by time
  const logs = await prisma.agentFightLog.findMany({
    select: { id: true, agentId: true, result: true, mode: true, opponentId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Total fight logs: ${logs.length}\n`);

  // 3. Simulate belt progression (same logic as calibrate-belts.js)
  const agentState = {};
  for (const a of agents) {
    agentState[a.id] = { belt: 0, qualifiedWins: 0, name: a.name, totalWins: a.wins, elo: a.elo };
  }

  for (const log of logs) {
    const state = agentState[log.agentId];
    if (!state) continue;

    if (log.result === 'victory') {
      let opponentBelt = null;
      if (log.opponentId && agentState[log.opponentId]) {
        opponentBelt = agentState[log.opponentId].belt;
      }

      if (isQualifyingWin(state.belt, opponentBelt)) {
        state.qualifiedWins++;
        const newBelt = calculateBelt(state.qualifiedWins);
        if (newBelt > state.belt) state.belt = newBelt;
      }
    }
  }

  // 4. Write results to DB
  console.log('Writing belt data to database...');
  let updated = 0;
  for (const [id, state] of Object.entries(agentState)) {
    const isHexmaster = checkHexmaster(state.qualifiedWins);
    await prisma.agent.update({
      where: { id },
      data: {
        belt: state.belt,
        qualifiedWins: state.qualifiedWins,
        isHexmaster,
      },
    });
    updated++;
  }
  console.log(`Updated ${updated} agents.\n`);

  // 5. Output distribution
  console.log('DISTRIBUTION:');
  const distribution = {};
  let hexmasterCount = 0;
  for (let g = 0; g <= 32; g++) distribution[g] = 0;

  for (const state of Object.values(agentState)) {
    distribution[state.belt]++;
    if (checkHexmaster(state.qualifiedWins)) hexmasterCount++;
  }

  for (let g = 0; g <= 32; g++) {
    const label = `Grade ${String(g).padStart(2)} (${getBeltLabel(g).padEnd(8)})`;
    console.log(`  ${label}: ${distribution[g]} agents`);
  }
  console.log(`  Hexmaster:           ${hexmasterCount} agents`);

  // 6. Top 10
  const sorted = Object.entries(agentState)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.qualifiedWins - a.qualifiedWins);

  console.log('\nTOP 10 BY QUALIFIED WINS:');
  for (let i = 0; i < Math.min(10, sorted.length); i++) {
    const s = sorted[i];
    const hm = checkHexmaster(s.qualifiedWins) ? ' [HEXMASTER]' : '';
    console.log(`  ${i + 1}. ${s.name} (id=${s.id}) — totalWins=${s.totalWins}, qualifiedWins=${s.qualifiedWins}, finalBelt=${getBeltLabel(s.belt)}${hm}`);
  }

  console.log('\n============================================================');
  console.log('BACKFILL COMPLETE');
  console.log('============================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
