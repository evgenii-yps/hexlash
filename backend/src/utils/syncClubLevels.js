/**
 * One-time script: recalculate level, maxMembers, and maxAgents for all clubs based on their xp.
 * Usage: node backend/src/utils/syncClubLevels.js
 */
const prisma = require('../lib/prisma');
const { calculateLevel } = require('../services/clubLevelService');
const { CLAN_LEVEL_CONFIG } = require('../config');

async function syncClubLevels() {
  const clubs = await prisma.club.findMany({ select: { id: true, xp: true, level: true, maxMembers: true, maxAgents: true } });

  let updated = 0;
  for (const club of clubs) {
    const correctLevel = calculateLevel(club.xp);
    const config = CLAN_LEVEL_CONFIG[correctLevel];

    if (club.level !== correctLevel || club.maxMembers !== config.maxMembers || club.maxAgents !== config.maxAgents) {
      await prisma.club.update({
        where: { id: club.id },
        data: {
          level: correctLevel,
          maxMembers: config.maxMembers,
          maxAgents: config.maxAgents,
        },
      });
      console.log(`Club ${club.id}: level ${club.level}->${correctLevel}, maxMembers ${club.maxMembers}->${config.maxMembers}, maxAgents ${club.maxAgents}->${config.maxAgents}`);
      updated++;
    }
  }

  console.log(`Done. ${updated}/${clubs.length} clubs updated.`);
  await prisma.$disconnect();
}

syncClubLevels().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
