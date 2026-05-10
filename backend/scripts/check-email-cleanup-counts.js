/**
 * Email cleanup pre-migration diagnostic script.
 *
 * Run BEFORE applying 20260508000000_email_data_cleanup migration to ANY
 * environment with real data (test/staging/prod). Prints counts that the
 * migration affects + flags duplicate emails that would block Step 2's
 * unique constraint addition.
 *
 * Usage:
 *   cd backend
 *   DATABASE_URL=<your-db-url> node scripts/check-email-cleanup-counts.js
 *
 * Read-only — performs SELECT queries only, no mutations. Safe to run anytime.
 *
 * Output interpretation:
 * - "Empty/NULL email count": users that will have email set to NULL by
 *   Step 1 migration. Expected to be the majority of users (register endpoint
 *   never accepted email pre-Email-Auth-Phase-1).
 * - "Case-sensitive duplicate emails": will block Step 2 unique constraint —
 *   STOP gate, manual reconciliation required before applying.
 * - "Case-insensitive duplicate emails": warning — Step 2 uses CASE-SENSITIVE
 *   unique by default. If this count > 0, prepare for app-side normalization
 *   policy decision (suggested: lowercase all emails in app code before
 *   storing).
 *
 * Email Auth Phase 1.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Email cleanup pre-migration diagnostic ===\n');

  const totalUsers = await prisma.user.count();
  console.log(`Total users in DB: ${totalUsers}`);

  const emptyOrNullCount = await prisma.user.count({
    where: { OR: [{ email: '' }, { email: null }] },
  });
  console.log(`Users with email='' or email=NULL: ${emptyOrNullCount}`);
  console.log(`  → these will be set to NULL by Step 1 migration\n`);

  const nonEmptyCount = totalUsers - emptyOrNullCount;
  console.log(`Users with non-empty email: ${nonEmptyCount}`);

  // Case-sensitive duplicates — would block Step 2 @unique constraint atomically
  const caseSensitiveDuplicates = await prisma.$queryRaw`
    SELECT email, COUNT(*)::int AS count
    FROM "User"
    WHERE email IS NOT NULL AND email != ''
    GROUP BY email
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
  `;

  if (caseSensitiveDuplicates.length === 0) {
    console.log('Case-sensitive duplicate emails: 0  ✅ Step 2 unique constraint will succeed\n');
  } else {
    console.log(`Case-sensitive duplicate emails: ${caseSensitiveDuplicates.length} groups`);
    console.log('  → STOP — manual reconciliation required before Step 2 migration');
    console.log('  → Top 20 duplicates:');
    for (const dup of caseSensitiveDuplicates) {
      console.log(`     ${dup.email}: ${dup.count} users`);
    }
    console.log();
  }

  // Case-insensitive duplicates — warning for app-level normalization policy
  const caseInsensitiveDuplicates = await prisma.$queryRaw`
    SELECT LOWER(email) AS email_lower, COUNT(*)::int AS count
    FROM "User"
    WHERE email IS NOT NULL AND email != ''
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
  `;

  if (caseInsensitiveDuplicates.length === 0) {
    console.log('Case-insensitive duplicate emails: 0  ✅\n');
  } else {
    console.log(`Case-insensitive duplicate emails: ${caseInsensitiveDuplicates.length} groups (warning — Step 2 uses case-sensitive unique by default)`);
    console.log('  → If you want case-insensitive uniqueness, normalize all emails to lowercase before applying Step 2');
    console.log('  → Top 20:');
    for (const dup of caseInsensitiveDuplicates) {
      console.log(`     ${dup.email_lower}: ${dup.count} users`);
    }
    console.log();
  }

  console.log('=== Migration plan ===');
  console.log('1. Backup database (REQUIRED for prod).');
  console.log('2. Apply Step 1: 20260508000000_email_data_cleanup');
  console.log('3. Apply Step 2: 20260508010000_add_email_auth_tokens');
  console.log('4. Verify: re-run this script — emptyOrNullCount should match emptied count + 0 duplicates remain.');
  console.log();
  console.log('If duplicates exist (case-sensitive count > 0), STOP and reconcile before Step 2.');
}

main()
  .catch((err) => {
    console.error('Diagnostic script error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
