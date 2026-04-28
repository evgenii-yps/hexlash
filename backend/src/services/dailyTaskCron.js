/**
 * Daily Task Cron — resets training-scope daily tasks at midnight UTC.
 * Follows agentScheduler.js setInterval pattern. scope='general' tasks preserve legacy "complete-once" semantic (D5-b).
 * Uses lazy allocation (D4-α): yesterday's UserDailyTask training rows are deleted,
 * new rows are created on first progress event of the new day in the POST /daily/:id/progress handler.
 */

const prisma = require('../lib/prisma');

const DAY_MS = 24 * 60 * 60 * 1000;

let cronTimeout = null;
let cronInterval = null;

/**
 * Delete UserDailyTask rows for training-scope tasks assigned before today (UTC).
 * Idempotent — safe to call repeatedly.
 */
async function resetDailyTrainingTasks() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  try {
    const result = await prisma.userDailyTask.deleteMany({
      where: {
        task: { scope: 'training' },
        assignedDate: { lt: todayStart },
      },
    });
    if (result.count > 0) {
      console.log(`[DailyTaskCron] Reset ${result.count} expired training tasks at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error('[DailyTaskCron] Reset failed:', err);
  }
}

/**
 * Compute milliseconds until next midnight UTC.
 */
function calculateMsToNextMidnightUTC() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setUTCHours(24, 0, 0, 0); // tomorrow 00:00 UTC
  return nextMidnight.getTime() - now.getTime();
}

/**
 * Start the cron. Called once on server boot. Idempotent.
 * First reset triggers at next midnight UTC, then every 24h.
 */
function startDailyTaskCron() {
  if (cronTimeout || cronInterval) return; // idempotent

  const msToMidnight = calculateMsToNextMidnightUTC();
  console.log(`[DailyTaskCron] Started, first reset in ${Math.round(msToMidnight / 1000)}s (next midnight UTC)`);

  cronTimeout = setTimeout(() => {
    cronTimeout = null;
    resetDailyTrainingTasks();
    cronInterval = setInterval(resetDailyTrainingTasks, DAY_MS);
  }, msToMidnight);
}

/**
 * Stop the cron (graceful shutdown).
 */
function stopDailyTaskCron() {
  if (cronTimeout) {
    clearTimeout(cronTimeout);
    cronTimeout = null;
  }
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[DailyTaskCron] Stopped');
  }
}

module.exports = { startDailyTaskCron, stopDailyTaskCron, resetDailyTrainingTasks, calculateMsToNextMidnightUTC };
