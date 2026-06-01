// Game-cleanup reset: the gutted project has no startup seed data.
//
// This is an intentional no-op. It is kept (rather than deleted) so the
// `db:seed` / `db:setup` npm scripts and any external references resolve
// cleanly. It does NOT instantiate a Prisma client or touch the database —
// the old game seed wrote to tables (Achievement / SocialTask / DailyTask)
// that were dropped in migration 20260601000000_game_cleanup_reset, which
// crash-looped the container on deploy. There is nothing to seed now.

function main() {
  console.log('Seed: nothing to seed (no-op).');
}

main();
