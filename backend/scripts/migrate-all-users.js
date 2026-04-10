/**
 * ============================================================
 * BACKFILL SCRIPT — migrate all Users to Fighter #1
 * ============================================================
 *
 * Iterates all users and runs migrateUserToFighter() for each.
 * Idempotent: safe to run multiple times (skips already migrated users).
 *
 * Usage: node backend/scripts/migrate-all-users.js
 * Requires: DATABASE_URL env var (or .env file in backend/)
 *
 * CAUTION: This script WRITES to the database. Run on dev first.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const prisma = require('../src/lib/prisma');

// Force migration enabled for this script
process.env.MIGRATION_ENABLED = 'true';
const { migrateUserToFighter } = require('../src/services/userMigrationService');

async function main() {
  console.log('=== User → Fighter #1 Migration ===\n');

  const users = await prisma.user.findMany({
    select: { id: true, login: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${users.length} users.\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      const result = await migrateUserToFighter(user.id);
      if (result.migrated) {
        migrated++;
        console.log(`[${i + 1}/${users.length}] ✓ ${user.login} → agent=${result.agentId}`);
      } else {
        skipped++;
        if ((i + 1) % 50 === 0) {
          console.log(`[${i + 1}/${users.length}] - ${user.login} skipped (${result.reason})`);
        }
      }
    } catch (err) {
      errors++;
      console.error(`[${i + 1}/${users.length}] ✗ ${user.login}: ${err.message}`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${users.length}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
