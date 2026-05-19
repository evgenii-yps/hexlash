const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /v1/task/social/:language
// Phase 11 (PR #387 audit): SocialTask.language column retired. URL `:language`
// param preserved for backward compatibility — frontend taskService.js hardcodes
// 'en' via default arg, so the param is a no-op accepted as cosmetic legacy.
// Filter removed; all (now English-only) social tasks are returned.
router.get('/social/:language', authMiddleware, async (req, res) => {
  try {
    const tasks = await prisma.socialTask.findMany({
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
// Phase 11 (PR #387 audit): DailyTask.language column retired. URL `:language`
// param preserved for backward compatibility — frontend taskService.js hardcodes
// 'en' via default arg, so the param is a no-op accepted as cosmetic legacy.
// Filter removed; whereClause now only carries 5K scope filter (when ?scope=...).
router.get('/daily/:language', authMiddleware, async (req, res) => {
  try {
    const { scope } = req.query; // 5K — optional ?scope=training filter

    // 5K — today's UTC date range for training-scope daily-cycle filter (D4-α lazy allocation)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const whereClause = {};
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
      // 5K — Phase 1 dropped userId_taskId unique key (now [userId, taskId, assignedDate]).
      // Use findFirst instead of findUnique to find any existing completion row regardless of date.
      // Legacy semantic preserved for general-scope tasks (any prior row → already completed).
      const existing = await prisma.userDailyTask.findFirst({
        where: { userId: req.userId, taskId, completedAt: { not: null } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Task already completed' });
      }

      await prisma.userDailyTask.create({
        data: { userId: req.userId, taskId, completedAt: new Date() },
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

// 5K — POST /v1/task/daily/:id/progress
// Body: { amount: Int } — increment progress toward goal. Auto-completes when progress >= goal.
// Idempotent: already-completed tasks return state without double reward. Atomic: progress + balance update в $transaction.
router.post('/daily/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { amount = 1 } = req.body || {};
    const userId = req.userId;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const task = await prisma.dailyTask.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!task.value || task.value <= 0) {
      return res.status(400).json({ error: 'Task has no goal' });
    }

    // Today's UTC date range (D4-α lazy allocation — UserDailyTask row created on first progress event)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    let userTask = await prisma.userDailyTask.findFirst({
      where: {
        userId,
        taskId,
        assignedDate: { gte: todayStart, lt: todayEnd },
      },
    });

    // Lazy create today's row if missing
    if (!userTask) {
      userTask = await prisma.userDailyTask.create({
        data: { userId, taskId, progress: 0, assignedDate: todayStart },
      });
    }

    // Already completed today — idempotent no-op (no double reward)
    if (userTask.completedAt) {
      return res.json({
        data: {
          id: userTask.id,
          progress: userTask.progress,
          goal: task.value,
          isCompleted: true,
          rewardGranted: 0,
        },
      });
    }

    const newProgress = Math.min(userTask.progress + amount, task.value);
    const justCompleted = newProgress >= task.value;

    // Atomic: progress update + balance increment (only if just completed) in single transaction
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.userDailyTask.update({
        where: { id: userTask.id },
        data: {
          progress: newProgress,
          completedAt: justCompleted ? new Date() : null,
        },
      });
      if (justCompleted) {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: task.tokens } },
        });
      }
      return u;
    });

    res.json({
      data: {
        id: updated.id,
        progress: updated.progress,
        goal: task.value,
        isCompleted: !!updated.completedAt,
        rewardGranted: justCompleted ? task.tokens : 0,
      },
    });
  } catch (err) {
    console.error('Daily task progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
