const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /v1/task/social/:language
router.get('/social/:language', authMiddleware, async (req, res) => {
  try {
    const { language } = req.params;

    const tasks = await prisma.socialTask.findMany({
      where: { language },
      include: {
        users: {
          where: { userId: req.userId },
        },
      },
    });

    const result = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      link: task.link,
      tokens: task.tokens,
      isCompleted: task.users.length > 0,
      category: task.category,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('Get social tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/task/daily/:language
router.get('/daily/:language', authMiddleware, async (req, res) => {
  try {
    const { language } = req.params;
    const { scope } = req.query; // 5K — optional ?scope=training filter

    // 5K — today's UTC date range for training-scope daily-cycle filter (D4-α lazy allocation)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const whereClause = { language };
    if (scope) whereClause.scope = scope;

    const tasks = await prisma.dailyTask.findMany({
      where: whereClause,
      include: {
        users: {
          where: {
            userId: req.userId,
            // 5K — training tasks: filter to today only (daily-cycle); general tasks: any row (legacy semantic)
            ...(scope === 'training' && {
              assignedDate: { gte: todayStart, lt: todayEnd },
            }),
          },
          orderBy: { assignedDate: 'desc' },
          take: 1,
        },
      },
    });

    const result = tasks.map((task) => {
      const userTask = task.users[0];
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        tokens: task.tokens,
        isCompleted: userTask ? !!userTask.completedAt : false,
        progress: userTask ? userTask.progress : 0,
        goal: task.value,    // 5K — explicit goal alias
        value: task.value,   // backward compat (DailyTaskModel reads this)
        link: task.link,
        category: task.category,
        scope: task.scope,   // 5K — new field
      };
    });

    res.json({ data: result });
  } catch (err) {
    console.error('Get daily tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/task/complete/:taskId
router.post('/complete/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Try social task first
    let task = await prisma.socialTask.findUnique({ where: { id: taskId } });
    if (task) {
      const existing = await prisma.userSocialTask.findUnique({
        where: { userId_taskId: { userId: req.userId, taskId } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Task already completed' });
      }

      await prisma.userSocialTask.create({
        data: { userId: req.userId, taskId },
      });

      await prisma.user.update({
        where: { id: req.userId },
        data: { balance: { increment: task.tokens } },
      });

      return res.json({ data: { success: true } });
    }

    // Try daily task
    task = await prisma.dailyTask.findUnique({ where: { id: taskId } });
    if (task) {
      const existing = await prisma.userDailyTask.findUnique({
        where: { userId_taskId: { userId: req.userId, taskId } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Task already completed' });
      }

      await prisma.userDailyTask.create({
        data: { userId: req.userId, taskId },
      });

      await prisma.user.update({
        where: { id: req.userId },
        data: { balance: { increment: task.tokens } },
      });

      return res.json({ data: { success: true } });
    }

    res.status(404).json({ error: 'Task not found' });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
