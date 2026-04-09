/**
 * ============================================================
 * READ-ONLY CALIBRATION SCRIPT — no DB writes
 * ============================================================
 *
 * Simulates belt progression for all agents using their fight
 * history. Outputs distribution and top agents for threshold
 * tuning. Safe to run on production.
 *
 * Usage: node backend/scripts/calibrate-belts.js
 * Requires: DATABASE_URL env var (or .env file in backend/)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Draft thresholds (subject to tuning after calibration) ──

const BELT_THRESHOLDS = [
  // [grade, qualifiedWinsRequired, color, stripes]
  [0,    0,    'white',  0],
  [1,    1,    'white',  1],
  [2,    3,    'white',  2],
  [3,    6,    'white',  3],
  [4,    10,   'yellow', 0],
  [5,    16,   'yellow', 1],
  [6,    24,   'yellow', 2],
  [7,    35,   'yellow', 3],
  // --- quality filter kicks in at grade 8 ---
  [8,    50,   'orange', 0],
  [9,    70,   'orange', 1],
  [10,   95,   'orange', 2],
  [11,   125,  'orange', 3],
  [12,   160,  'green',  0],
  [13,   200,  'green',  1],
  [14,   245,  'green',  2],
  [15,   295,  'green',  3],
  [16,   350,  'blue',   0],
  [17,   415,  'blue',   1],
  [18,   490,  'blue',   2],
  [19,   575,  'blue',   3],
  [20,   670,  'purple', 0],
  [21,   775,  'purple', 1],
  [22,   890,  'purple', 2],
  [23,   1015, 'purple', 3],
  [24,   1150, 'brown',  0],
  [25,   1300, 'brown',  1],
  [26,   1465, 'brown',  2],
  [27,   1645, 'brown',  3],
  [28,   1840, 'red',    0],
  [29,   2050, 'red',    1],
  [30,   2275, 'red',    2],
  [31,   2515, 'red',    3],
  [32,   2800, 'black',  0],
];

const HEXMASTER_THRESHOLD = 4000;
const QUALITY_FILTER_GRADE = 8;

// ── Belt calculation helpers ──

function calculateBelt(qualifiedWins) {
  let grade = 0;
  for (const [g, threshold] of BELT_THRESHOLDS) {
    if (qualifiedWins >= threshold) grade = g;
    else break;
  }
  return grade;
}

function getBeltLabel(grade) {
  const entry = BELT_THRESHOLDS[grade];
  if (!entry) return `unknown-${grade}`;
  return entry[3] > 0 ? `${entry[2]}-${entry[3]}` : entry[2];
}

function isQualifyingWin(agentBelt, opponentBelt) {
  if (agentBelt < QUALITY_FILTER_GRADE) return true;
  const effective = opponentBelt ?? 0;
  return effective >= agentBelt - 1;
}

// ── Main ──

async function main() {
  console.log('============================================================');
  console.log('READ-ONLY CALIBRATION SCRIPT — no DB writes');
  console.log('============================================================\n');

  // 1. Load all agents
  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, wins: true, losses: true, draws: true, totalFights: true, elo: true },
  });
  console.log(`Total agents: ${agents.length}`);

  // 2. Load all fight logs ordered by time
  const logs = await prisma.agentFightLog.findMany({
    select: { id: true, agentId: true, result: true, mode: true, opponentId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Total fight logs processed: ${logs.length}\n`);

  // 3. Simulate belt progression per agent
  // Track each agent's virtual state: { belt, qualifiedWins }
  const agentState = {};
  for (const a of agents) {
    agentState[a.id] = { belt: 0, qualifiedWins: 0, name: a.name, totalWins: a.wins, elo: a.elo };
  }

  for (const log of logs) {
    const state = agentState[log.agentId];
    if (!state) continue; // orphaned log

    if (log.result === 'victory') {
      // Determine opponent belt at this point in time
      let opponentBelt = null;
      if (log.opponentId && agentState[log.opponentId]) {
        opponentBelt = agentState[log.opponentId].belt;
      } else {
        opponentBelt = null; // PvE bot
      }

      if (isQualifyingWin(state.belt, opponentBelt)) {
        state.qualifiedWins++;
        // Check for belt promotion
        const newBelt = calculateBelt(state.qualifiedWins);
        if (newBelt > state.belt) {
          state.belt = newBelt;
        }
      }
    }
  }

  // 4. Output distribution
  console.log('DISTRIBUTION:');
  const distribution = {};
  let hexmasterCount = 0;
  for (let g = 0; g <= 32; g++) distribution[g] = 0;

  for (const id of Object.keys(agentState)) {
    const s = agentState[id];
    distribution[s.belt]++;
    if (s.qualifiedWins >= HEXMASTER_THRESHOLD) hexmasterCount++;
  }

  for (let g = 0; g <= 32; g++) {
    const label = `Grade ${String(g).padStart(2)} (${getBeltLabel(g).padEnd(8)})`;
    console.log(`  ${label}: ${distribution[g]} agents`);
  }
  console.log(`  Hexmaster:           ${hexmasterCount} agents`);

  // 5. Top 10 by qualifiedWins
  const sorted = Object.entries(agentState)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.qualifiedWins - a.qualifiedWins);

  console.log('\nTOP 10 BY QUALIFIED WINS:');
  for (let i = 0; i < Math.min(10, sorted.length); i++) {
    const s = sorted[i];
    const hm = s.qualifiedWins >= HEXMASTER_THRESHOLD ? ' [HEXMASTER]' : '';
    console.log(`  ${i + 1}. ${s.name} (id=${s.id}) — totalWins=${s.totalWins}, qualifiedWins=${s.qualifiedWins}, finalBelt=${getBeltLabel(s.belt)}, elo=${s.elo}${hm}`);
  }

  // 6. Edge cases
  console.log('\nEDGE CASES:');

  // Agents stuck at white-3 boundary (grade 3→4 = 6→10 wins)
  const stuckAtBoundary = Object.values(agentState).filter(s => s.belt === 3 && s.totalWins >= 10).length;
  console.log(`  Agents at white-3 with totalWins >= 10 (PvE→quality boundary): ${stuckAtBoundary}`);

  // Agents with big gap between totalWins and qualifiedWins
  const bigGap = Object.values(agentState).filter(s => s.totalWins > 0 && s.qualifiedWins / s.totalWins < 0.5).length;
  console.log(`  Agents with qualifiedWins < 50% of totalWins: ${bigGap}`);

  // Agents with 0 qualified wins but > 0 total wins
  const zeroQualified = Object.values(agentState).filter(s => s.totalWins > 0 && s.qualifiedWins === 0).length;
  console.log(`  Agents with totalWins > 0 but qualifiedWins = 0: ${zeroQualified}`);

  // Max grade reached
  const maxGrade = Math.max(...Object.values(agentState).map(s => s.belt));
  console.log(`  Highest grade reached: ${maxGrade} (${getBeltLabel(maxGrade)})`);

  console.log('\n============================================================');
  console.log('END OF CALIBRATION — review distribution and adjust thresholds');
  console.log('============================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
