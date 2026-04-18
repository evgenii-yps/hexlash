/**
 * ============================================================
 * BACKFILL SCRIPT — assign Captain to FightClubs without one
 * ============================================================
 *
 * For each FightClub that has agents but no Captain:
 * promotes the oldest Agent (by createdAt) to Captain.
 * Idempotent: skips clubs that already have a Captain.
 *
 * Usage: node backend/scripts/backfill-captains.js
 * Requires: DATABASE_URL env var (or .env file in backend/)
 *
 * CAUTION: This script WRITES to the database. Run on dev first.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const prisma = require('../src/lib/prisma');

async function main() {
  console.log('=== Backfill Captains ===\n');

  const clubs = await prisma.fightClub.findMany({
    select: { id: true, ownerId: true },
  });

  console.log(`Found ${clubs.length} FightClubs.\n`);

  let promoted = 0;
  let skipped = 0;
  let empty = 0;

  for (const club of clubs) {
    // Check if club already has a Captain
    const existingCaptain = await prisma.agent.findFirst({
      where: { fightClubId: club.id, isCaptain: true },
      select: { id: true },
    });

    if (existingCaptain) {
      skipped++;
      continue;
    }

    // Find oldest agent in club
    const oldestAgent = await prisma.agent.findFirst({
      where: { fightClubId: club.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });

    if (!oldestAgent) {
      empty++;
      continue;
    }

    await prisma.agent.update({
      where: { id: oldestAgent.id },
      data: { isCaptain: true },
    });

    promoted++;
    console.log(`[backfill] club=${club.id} promoted agent=${oldestAgent.id} (${oldestAgent.name}) to captain`);
  }

  console.log(`\n=== Done ===`);
  console.log(`Promoted: ${promoted}`);
  console.log(`Skipped (already has captain): ${skipped}`);
  console.log(`Empty (no agents): ${empty}`);
  console.log(`Total clubs: ${clubs.length}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
