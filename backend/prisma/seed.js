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

  // Social Tasks — idempotent: skip if already exists by category+language
  const allSocialTasks = [
    { title: 'Subscribe to Telegram', description: 'Join our Telegram channel', link: 'https://t.me/hexlash', tokens: 50000, category: 'SUBSCRIBE_TELEGRAM', language: 'en' },
    { title: 'Follow on X', description: 'Follow us on X (Twitter)', link: 'https://x.com/hexlash', tokens: 50000, category: 'SUBSCRIBE_X', language: 'en' },
    { title: 'Subscribe on YouTube', description: 'Subscribe to our YouTube channel', link: 'https://youtube.com/@hexlash', tokens: 50000, category: 'SUBSCRIBE_YOUTUBE', language: 'en' },
    { title: 'Join Discord', description: 'Join our Discord server', link: 'https://discord.gg/hexlash', tokens: 50000, category: 'SUBSCRIBE_DISCORD', language: 'en' },
    { title: 'Follow on Instagram', description: 'Follow us on Instagram', link: 'https://instagram.com/hexlash', tokens: 50000, category: 'SUBSCRIBE_INSTAGRAM', language: 'en' },
    { title: 'Confirm Email', description: 'Verify your email address', link: '', tokens: 100000, category: 'TASK_CONFIRM_EMAIL', language: 'en' },
    { title: 'Подписаться на Telegram', description: 'Присоединяйтесь к нашему Telegram каналу', link: 'https://t.me/hexlash', tokens: 50000, category: 'SUBSCRIBE_TELEGRAM', language: 'ru' },
    { title: 'Подписаться на X', description: 'Подпишитесь на нас в X (Twitter)', link: 'https://x.com/hexlash', tokens: 50000, category: 'SUBSCRIBE_X', language: 'ru' },
    { title: 'Подписаться на YouTube', description: 'Подпишитесь на наш YouTube канал', link: 'https://youtube.com/@hexlash', tokens: 50000, category: 'SUBSCRIBE_YOUTUBE', language: 'ru' },
    { title: 'Присоединиться к Discord', description: 'Присоединяйтесь к нашему Discord серверу', link: 'https://discord.gg/hexlash', tokens: 50000, category: 'SUBSCRIBE_DISCORD', language: 'ru' },
    { title: 'Подписаться на Instagram', description: 'Подпишитесь на нас в Instagram', link: 'https://instagram.com/hexlash', tokens: 50000, category: 'SUBSCRIBE_INSTAGRAM', language: 'ru' },
    { title: 'Подтвердить Email', description: 'Подтвердите ваш email адрес', link: '', tokens: 100000, category: 'TASK_CONFIRM_EMAIL', language: 'ru' },
  ];

  for (const task of allSocialTasks) {
    const existing = await prisma.socialTask.findFirst({
      where: { category: task.category, language: task.language },
    });
    if (!existing) {
      await prisma.socialTask.create({ data: task });
    }
  }
  console.log(`Seeded ${allSocialTasks.length} social tasks`);

  // Daily Tasks — idempotent: skip if already exists by category+language
  // 5K — scope: 'general' = legacy complete-once tasks; 'training' = daily-reset tasks (HIT/COMBO/ENERGY/TIME/TAPS)
  const allDailyTasks = [
    // General scope (legacy semantic — complete-once)
    { title: 'Fight 3 battles', description: 'Complete 3 battles today', tokens: 30000, category: 'FIGHT_X_BATTLES', value: 3, language: 'en', scope: 'general' },
    { title: 'Win 2 battles', description: 'Win 2 battles today', tokens: 50000, category: 'WIN_X_BATTLES', value: 2, language: 'en', scope: 'general' },
    { title: 'Invite a friend', description: 'Invite a friend to join the game', tokens: 100000, category: 'INVITE_FRIEND', link: '', language: 'en', scope: 'general' },
    { title: 'Проведи 3 боя', description: 'Проведите 3 боя сегодня', tokens: 30000, category: 'FIGHT_X_BATTLES', value: 3, language: 'ru', scope: 'general' },
    { title: 'Выиграй 2 боя', description: 'Выиграйте 2 боя сегодня', tokens: 50000, category: 'WIN_X_BATTLES', value: 2, language: 'ru', scope: 'general' },
    { title: 'Пригласи друга', description: 'Пригласите друга в игру', tokens: 100000, category: 'INVITE_FRIEND', link: '', language: 'ru', scope: 'general' },
    // Training scope (5K — daily-reset, Training Hub display)
    { title: 'Hit the bag 500 times', description: 'Train by hitting the punching bag', tokens: 20000, category: 'HIT_BAG_X_TIMES', value: 500, language: 'en', scope: 'training' },
    { title: 'Land 5 combos', description: 'Land 5 combos with x3+ multiplier', tokens: 15000, category: 'LAND_X_COMBOS', value: 5, language: 'en', scope: 'training' },
    { title: 'Spend full energy', description: 'Drain your training energy from 60 to 0', tokens: 10000, category: 'SPEND_FULL_ENERGY', value: 60, language: 'en', scope: 'training' },
    { title: 'Train 5 minutes', description: 'Stay in a training session for 5 minutes', tokens: 15000, category: 'TRAIN_X_MINUTES', value: 300, language: 'en', scope: 'training' },
    { title: 'Earn 500 taps in session', description: 'Earn 500 taps during a single training session', tokens: 20000, category: 'EARN_X_TAPS', value: 500, language: 'en', scope: 'training' },
    { title: 'Ударь грушу 500 раз', description: 'Тренируйтесь, ударяя грушу', tokens: 20000, category: 'HIT_BAG_X_TIMES', value: 500, language: 'ru', scope: 'training' },
    { title: 'Сделай 5 комбо', description: 'Сделай 5 комбо с множителем x3+', tokens: 15000, category: 'LAND_X_COMBOS', value: 5, language: 'ru', scope: 'training' },
    { title: 'Потрать всю энергию', description: 'Опустоши тренировочную энергию с 60 до 0', tokens: 10000, category: 'SPEND_FULL_ENERGY', value: 60, language: 'ru', scope: 'training' },
    { title: 'Тренируйся 5 минут', description: 'Останься в тренировочной сессии 5 минут', tokens: 15000, category: 'TRAIN_X_MINUTES', value: 300, language: 'ru', scope: 'training' },
    { title: 'Заработай 500 тапов за сессию', description: 'Заработай 500 тапов за одну тренировочную сессию', tokens: 20000, category: 'EARN_X_TAPS', value: 500, language: 'ru', scope: 'training' },
  ];

  for (const task of allDailyTasks) {
    const existing = await prisma.dailyTask.findFirst({
      where: { category: task.category, language: task.language },
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
