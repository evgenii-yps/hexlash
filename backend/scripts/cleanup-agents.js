/**
 * Cleanup script: delete all agents for a given user login.
 * Usage: node scripts/cleanup-agents.js <login>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const login = process.argv[2];
  if (!login) {
    console.error('Usage: node scripts/cleanup-agents.js <login>');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ where: { login } });
  if (!user) {
    console.error('User not found:', login);
    process.exit(1);
  }

  const agents = await prisma.agent.findMany({
    where: { ownerId: user.id },
    include: { tactics: true, progression: true },
  });

  console.log(`Found ${agents.length} agents for user "${login}" (id=${user.id}):`);
  agents.forEach(a => {
    console.log(`  - ${a.id} | name="${a.name}" | skin=${a.skin} | elo=${a.elo} | status=${a.status} | modules=${a.primaryModule}/${a.secondaryModule}/${a.tertiaryModule} | created=${a.createdAt.toISOString()}`);
  });

  if (agents.length === 0) {
    console.log('Nothing to delete.');
    process.exit(0);
  }

  // Delete fight logs, tactics, progression first (cascade should handle it, but be explicit)
  const agentIds = agents.map(a => a.id);

  const logsDeleted = await prisma.agentFightLog.deleteMany({ where: { agentId: { in: agentIds } } });
  console.log(`Deleted ${logsDeleted.count} fight logs.`);

  const tacticsDeleted = await prisma.agentTactics.deleteMany({ where: { agentId: { in: agentIds } } });
  console.log(`Deleted ${tacticsDeleted.count} tactics records.`);

  const progressionDeleted = await prisma.agentProgression.deleteMany({ where: { agentId: { in: agentIds } } });
  console.log(`Deleted ${progressionDeleted.count} progression records.`);

  const result = await prisma.agent.deleteMany({ where: { ownerId: user.id } });
  console.log(`Deleted ${result.count} agents.`);

  console.log('Done.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
