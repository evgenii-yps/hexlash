const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Achievements
  const achievements = [
    { type: 'NEWBIE', title: 'Newbie', description: 'Registered in the game', icon: 'newbie.png' },
    { type: 'CONNECTED_FIGHTER', title: 'Connected Fighter', description: 'Completed 100 punches', icon: 'connected_fighter.png' },
    { type: 'REGULAR_FIGHTER', title: 'Regular Fighter', description: 'Completed 1000 punches', icon: 'regular_fighter.png' },
    { type: 'BATTLE_VETERAN', title: 'Battle Veteran', description: 'Completed 5000 punches', icon: 'battle_veteran.png' },
    { type: 'FIGHT_MASTER', title: 'Fight Master', description: 'Completed 10000 punches', icon: 'fight_master.png' },
    { type: 'COACH', title: 'Coach', description: 'Invited 5 friends', icon: 'coach.png' },
    { type: 'RECRUITER', title: 'Recruiter', description: 'Invited 20 friends', icon: 'recruiter.png' },
    { type: 'PROJECT_MAYHEM', title: 'Project Mayhem', description: 'Joined a clan', icon: 'project_mayhem.png' },
    { type: 'MEATLOAF', title: 'Meatloaf', description: 'Won 10 fights', icon: 'meatloaf.png' },
    { type: 'TYLER', title: 'Tyler', description: 'Won 50 fights', icon: 'tyler.png' },
    { type: 'EXPERT', title: 'Expert', description: 'Won 100 fights', icon: 'expert.png' },
    { type: 'LUCKY_ONE', title: 'Lucky One', description: 'Won with 1 HP left', icon: 'lucky_one.png' },
    { type: 'BOB', title: 'Bob', description: 'Completed all social tasks', icon: 'bob.png' },
    { type: 'PAPER_STREET', title: 'Paper Street', description: 'Created a clan', icon: 'paper_street.png' },
    { type: 'MEETING_PARTICIPANT', title: 'Meeting Participant', description: 'Participated in a meeting', icon: 'meeting.png' },
    { type: 'GOLDEN_RULE', title: 'Golden Rule', description: 'First rule of HexLash', icon: 'golden_rule.png' },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { type: ach.type },
      update: ach,
      create: ach,
    });
  }
  console.log(`Seeded ${achievements.length} achievements`);

  // Social Tasks — Phase 11 (PR #387 audit): language column retired, RU
  // entries dropped. Idempotency now keyed on category (schema @@unique([category])).
  const allSocialTasks = [
    { title: 'Subscribe to Telegram', description: 'Join our Telegram channel', link: 'https://t.me/hexlash', tokens: 50000, category: 'SUBSCRIBE_TELEGRAM' },
    { title: 'Follow on X', description: 'Follow us on X (Twitter)', link: 'https://x.com/hexlash', tokens: 50000, category: 'SUBSCRIBE_X' },
    { title: 'Subscribe on YouTube', description: 'Subscribe to our YouTube channel', link: 'https://youtube.com/@hexlash', tokens: 50000, category: 'SUBSCRIBE_YOUTUBE' },
    { title: 'Join Discord', description: 'Join our Discord server', link: 'https://discord.gg/hexlash', tokens: 50000, category: 'SUBSCRIBE_DISCORD' },
    { title: 'Follow on Instagram', description: 'Follow us on Instagram', link: 'https://instagram.com/hexlash', tokens: 50000, category: 'SUBSCRIBE_INSTAGRAM' },
    { title: 'Confirm Email', description: 'Verify your email address', link: '', tokens: 100000, category: 'TASK_CONFIRM_EMAIL' },
  ];

  for (const task of allSocialTasks) {
    const existing = await prisma.socialTask.findFirst({
      where: { category: task.category },
    });
    if (!existing) {
      await prisma.socialTask.create({ data: task });
    }
  }
  console.log(`Seeded ${allSocialTasks.length} social tasks`);

  // Daily Tasks — Phase 11 (PR #387 audit): language column retired, RU
  // entries dropped. Idempotency now keyed on category (schema @@unique([category])).
  // 5K — scope: 'general' = legacy complete-once tasks; 'training' = daily-reset tasks (HIT/COMBO/ENERGY/TIME/TAPS)
  const allDailyTasks = [
    // General scope (legacy semantic — complete-once)
    { title: 'Fight 3 battles', description: 'Complete 3 battles today', tokens: 30000, category: 'FIGHT_X_BATTLES', value: 3, scope: 'general' },
    { title: 'Win 2 battles', description: 'Win 2 battles today', tokens: 50000, category: 'WIN_X_BATTLES', value: 2, scope: 'general' },
    { title: 'Invite a friend', description: 'Invite a friend to join the game', tokens: 100000, category: 'INVITE_FRIEND', link: '', scope: 'general' },
    // Training scope (5K — daily-reset, Training Hub display)
    { title: 'Hit the bag 500 times', description: 'Train by hitting the punching bag', tokens: 20000, category: 'HIT_BAG_X_TIMES', value: 500, scope: 'training' },
    { title: 'Land 5 combos', description: 'Land 5 combos with x3+ multiplier', tokens: 15000, category: 'LAND_X_COMBOS', value: 5, scope: 'training' },
    { title: 'Spend full energy', description: 'Drain your training energy from 60 to 0', tokens: 10000, category: 'SPEND_FULL_ENERGY', value: 60, scope: 'training' },
    { title: 'Train 5 minutes', description: 'Stay in a training session for 5 minutes', tokens: 15000, category: 'TRAIN_X_MINUTES', value: 300, scope: 'training' },
    { title: 'Earn 500 taps in session', description: 'Earn 500 taps during a single training session', tokens: 20000, category: 'EARN_X_TAPS', value: 500, scope: 'training' },
  ];

  for (const task of allDailyTasks) {
    const existing = await prisma.dailyTask.findFirst({
      where: { category: task.category },
    });
    if (existing) {
      // 5K — sync scope field on re-seed (existing HIT_BAG_X_TIMES rows after migration default to 'general', need flip to 'training')
      if (existing.scope !== task.scope) {
        await prisma.dailyTask.update({
          where: { id: existing.id },
          data: { scope: task.scope },
        });
      }
    } else {
      await prisma.dailyTask.create({ data: task });
    }
  }
  console.log(`Seeded ${allDailyTasks.length} daily tasks`);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
