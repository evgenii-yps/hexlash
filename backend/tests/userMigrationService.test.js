const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { transformMoves, extractModules, calculateBranchXp } = require('../src/utils/migrationHelpers');

// ── transformMoves ──────────────────────────────────────────────

describe('transformMoves', () => {
  it('transforms unlocked moves with level > 0', () => {
    const input = {
      jab: { level: 2, unlocked: true },
      straight: { level: 1, unlocked: true },
      hook: { level: 0, unlocked: false },
    };
    const result = transformMoves(input);
    assert.equal(result.length, 2);
    assert.deepEqual(result.find(m => m.moveId === 'jab'), { moveId: 'jab', level: 2 });
    assert.deepEqual(result.find(m => m.moveId === 'straight'), { moveId: 'straight', level: 1 });
  });

  it('filters out unlocked but level 0', () => {
    const input = {
      jab: { level: 0, unlocked: true },
    };
    assert.equal(transformMoves(input).length, 0);
  });

  it('filters out locked moves', () => {
    const input = {
      jab: { level: 3, unlocked: false },
    };
    assert.equal(transformMoves(input).length, 0);
  });

  it('handles null/undefined input', () => {
    assert.deepEqual(transformMoves(null), []);
    assert.deepEqual(transformMoves(undefined), []);
    assert.deepEqual(transformMoves({}), []);
  });

  it('handles malformed move entries', () => {
    const input = {
      jab: null,
      straight: { level: 1, unlocked: true },
      hook: 'invalid',
    };
    const result = transformMoves(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].moveId, 'straight');
  });

  it('preserves all 18 moves when all unlocked', () => {
    const moves = {};
    const moveIds = [
      'jab', 'double_jab', 'rapid_fire', 'combo_strike', 'flurry', 'hurricane',
      'straight', 'hook', 'uppercut', 'haymaker', 'hammer_fist', 'knockout_blow',
      'block_strike', 'counter_jab', 'feint_cross', 'parry_punish', 'slip_counter', 'precision_strike',
    ];
    moveIds.forEach((id, i) => { moves[id] = { level: i % 5 + 1, unlocked: true }; });
    const result = transformMoves(moves);
    assert.equal(result.length, 18);
  });
});

// ── extractModules ──────────────────────────────────────────────

describe('extractModules', () => {
  it('uses playerModules when available', () => {
    assert.deepEqual(extractModules(['ghost', 'maverick', 'juggernaut']), ['ghost', 'maverick', 'juggernaut']);
  });

  it('falls back to defaults when null', () => {
    assert.deepEqual(extractModules(null), ['predator', 'sentinel', 'analyst']);
  });

  it('falls back to defaults when too short', () => {
    assert.deepEqual(extractModules(['ghost']), ['predator', 'sentinel', 'analyst']);
  });

  it('falls back to defaults when undefined', () => {
    assert.deepEqual(extractModules(undefined), ['predator', 'sentinel', 'analyst']);
  });
});

// ── calculateBranchXp ───────────────────────────────────────────

describe('calculateBranchXp', () => {
  it('distributes branchExp + freeXP/3', () => {
    const result = calculateBranchXp({ branchExp: { speed: 150, power: 200, technique: 100 }, freeXP: 30 });
    assert.equal(result.speedXp, 160);
    assert.equal(result.powerXp, 210);
    assert.equal(result.techniqueXp, 110);
  });

  it('handles missing branchExp', () => {
    const result = calculateBranchXp({ freeXP: 9 });
    assert.equal(result.speedXp, 3);
    assert.equal(result.powerXp, 3);
    assert.equal(result.techniqueXp, 3);
  });

  it('handles missing freeXP', () => {
    const result = calculateBranchXp({ branchExp: { speed: 10, power: 20, technique: 5 } });
    assert.equal(result.speedXp, 10);
    assert.equal(result.powerXp, 20);
    assert.equal(result.techniqueXp, 5);
  });

  it('loses remainder on uneven freeXP', () => {
    const result = calculateBranchXp({ branchExp: { speed: 0, power: 0, technique: 0 }, freeXP: 7 });
    assert.equal(result.speedXp, 2);
    assert.equal(result.powerXp, 2);
    assert.equal(result.techniqueXp, 2);
    // 7 - 6 = 1 XP lost (acceptable)
  });
});
