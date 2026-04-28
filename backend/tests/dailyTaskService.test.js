const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

/**
 * Daily Task Service tests — pure unit + pattern level (matches existing test precedent:
 * beltService.test.js, captainService.test.js — comment: "Integration tests require DB,
 * run via manual smoke test"). Prisma queries are pattern-simulated.
 */

const { calculateMsToNextMidnightUTC } = require('../src/services/dailyTaskCron');

const DAY_MS = 24 * 60 * 60 * 1000;

// ── calculateMsToNextMidnightUTC ────────────────────────────────

describe('calculateMsToNextMidnightUTC', () => {
  it('returns a positive integer', () => {
    const ms = calculateMsToNextMidnightUTC();
    assert.ok(Number.isFinite(ms), 'must be finite');
    assert.ok(ms > 0, 'must be > 0');
  });

  it('returns less than 24h (1 day)', () => {
    const ms = calculateMsToNextMidnightUTC();
    assert.ok(ms <= DAY_MS, `expected <= ${DAY_MS}, got ${ms}`);
  });

  it('aligns to next UTC midnight', () => {
    const before = Date.now();
    const ms = calculateMsToNextMidnightUTC();
    const target = new Date(before + ms);
    // Target should be at UTC midnight (within tolerance for execution drift)
    assert.equal(target.getUTCHours(), 0);
    assert.equal(target.getUTCMinutes(), 0);
    assert.equal(target.getUTCSeconds(), 0);
  });
});

// ── Progress math invariants (pattern tests) ────────────────────

describe('progress math invariants', () => {
  // Pure helper mirroring POST /daily/:id/progress logic
  function computeNewProgress(currentProgress, amount, goal) {
    return Math.min(currentProgress + amount, goal);
  }
  function isJustCompleted(newProgress, goal) {
    return newProgress >= goal;
  }

  it('increment within bounds: progress accumulates', () => {
    assert.equal(computeNewProgress(0, 1, 500), 1);
    assert.equal(computeNewProgress(50, 25, 500), 75);
    assert.equal(computeNewProgress(499, 1, 500), 500);
  });

  it('increment past goal: capped at goal (Math.min)', () => {
    assert.equal(computeNewProgress(450, 100, 500), 500); // would be 550
    assert.equal(computeNewProgress(0, 9999, 500), 500);   // huge over-shoot
    assert.equal(computeNewProgress(499, 50, 500), 500);
  });

  it('exact goal: just completes', () => {
    assert.equal(computeNewProgress(0, 500, 500), 500);
    assert.equal(isJustCompleted(500, 500), true);
  });

  it('below goal: not completed', () => {
    assert.equal(isJustCompleted(499, 500), false);
    assert.equal(isJustCompleted(0, 500), false);
  });
});

// ── Idempotency invariants (pattern tests) ──────────────────────

describe('idempotent completion', () => {
  // Mirrors handler shape: { id, progress, completedAt }, returns reward state
  function applyProgressUpdate(userTask, amount, goal, taskTokens) {
    if (userTask.completedAt) {
      return { progress: userTask.progress, isCompleted: true, rewardGranted: 0 };
    }
    const newProgress = Math.min(userTask.progress + amount, goal);
    const justCompleted = newProgress >= goal;
    return {
      progress: newProgress,
      isCompleted: justCompleted,
      rewardGranted: justCompleted ? taskTokens : 0,
    };
  }

  it('already-completed task: no double reward', () => {
    const userTask = { progress: 500, completedAt: new Date() };
    const r = applyProgressUpdate(userTask, 100, 500, 20000);
    assert.equal(r.isCompleted, true);
    assert.equal(r.rewardGranted, 0); // no double reward
    assert.equal(r.progress, 500);    // progress unchanged
  });

  it('first completion: reward granted exactly once', () => {
    const userTask = { progress: 499, completedAt: null };
    const r = applyProgressUpdate(userTask, 1, 500, 20000);
    assert.equal(r.isCompleted, true);
    assert.equal(r.rewardGranted, 20000);
  });

  it('progress without completion: no reward', () => {
    const userTask = { progress: 100, completedAt: null };
    const r = applyProgressUpdate(userTask, 50, 500, 20000);
    assert.equal(r.isCompleted, false);
    assert.equal(r.rewardGranted, 0);
    assert.equal(r.progress, 150);
  });

  it('multi-step then complete: reward granted only on threshold crossing', () => {
    let userTask = { progress: 0, completedAt: null };
    // 5 increments of 100 each → reaches 500, completes on last
    for (let i = 0; i < 4; i++) {
      const r = applyProgressUpdate(userTask, 100, 500, 20000);
      assert.equal(r.rewardGranted, 0, `intermediate step ${i + 1} should not grant`);
      userTask = { progress: r.progress, completedAt: r.isCompleted ? new Date() : null };
    }
    const final = applyProgressUpdate(userTask, 100, 500, 20000);
    assert.equal(final.isCompleted, true);
    assert.equal(final.rewardGranted, 20000);
  });
});

// ── Cron reset filter semantics (pattern tests) ─────────────────

describe('cron reset filter', () => {
  // Pure helper mirroring resetDailyTrainingTasks where clause
  function buildResetFilter(todayStart) {
    return {
      task: { scope: 'training' },
      assignedDate: { lt: todayStart },
    };
  }
  // Pure simulator mirroring the deleteMany predicate
  function rowMatchesResetFilter(row, todayStart) {
    return row.task.scope === 'training' && row.assignedDate < todayStart;
  }

  it('filter targets scope=training only (D5-b)', () => {
    const todayStart = new Date('2026-04-28T00:00:00Z');
    const f = buildResetFilter(todayStart);
    assert.equal(f.task.scope, 'training');
    assert.deepEqual(f.assignedDate, { lt: todayStart });
  });

  it('preserves general-scope rows (legacy semantic)', () => {
    const todayStart = new Date('2026-04-28T00:00:00Z');
    const yesterdayGeneral = {
      task: { scope: 'general' },
      assignedDate: new Date('2026-04-27T12:00:00Z'),
    };
    assert.equal(rowMatchesResetFilter(yesterdayGeneral, todayStart), false);
  });

  it('deletes yesterday training rows', () => {
    const todayStart = new Date('2026-04-28T00:00:00Z');
    const yesterdayTraining = {
      task: { scope: 'training' },
      assignedDate: new Date('2026-04-27T12:00:00Z'),
    };
    assert.equal(rowMatchesResetFilter(yesterdayTraining, todayStart), true);
  });

  it('preserves today training rows', () => {
    const todayStart = new Date('2026-04-28T00:00:00Z');
    const todayTraining = {
      task: { scope: 'training' },
      assignedDate: new Date('2026-04-28T08:00:00Z'),
    };
    assert.equal(rowMatchesResetFilter(todayTraining, todayStart), false);
  });

  it('preserves rows exactly at today UTC midnight (boundary)', () => {
    const todayStart = new Date('2026-04-28T00:00:00Z');
    const exactBoundary = {
      task: { scope: 'training' },
      assignedDate: new Date('2026-04-28T00:00:00Z'), // exactly equal — not < todayStart
    };
    assert.equal(rowMatchesResetFilter(exactBoundary, todayStart), false);
  });
});

// ── Validation invariants (POST /daily/:id/progress) ────────────

describe('progress amount validation', () => {
  // Mirror endpoint validation logic
  function isValidAmount(amount) {
    return typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
  }

  it('positive integers valid', () => {
    assert.equal(isValidAmount(1), true);
    assert.equal(isValidAmount(100), true);
  });

  it('zero invalid', () => {
    assert.equal(isValidAmount(0), false);
  });

  it('negative invalid', () => {
    assert.equal(isValidAmount(-1), false);
    assert.equal(isValidAmount(-100), false);
  });

  it('non-numeric invalid', () => {
    assert.equal(isValidAmount('5'), false);
    assert.equal(isValidAmount(null), false);
    assert.equal(isValidAmount(undefined), false);
    assert.equal(isValidAmount({}), false);
  });

  it('NaN / Infinity invalid', () => {
    assert.equal(isValidAmount(NaN), false);
    assert.equal(isValidAmount(Infinity), false);
    assert.equal(isValidAmount(-Infinity), false);
  });
});
