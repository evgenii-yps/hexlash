const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  isQualifyingWin,
  calculateBelt,
  checkHexmaster,
  applyWin,
  BELT_THRESHOLDS,
  HEXMASTER_THRESHOLD,
  QUALITY_FILTER_GRADE,
} = require('../src/services/beltService');

// ── isQualifyingWin ─────────────────────────────────────────────

describe('isQualifyingWin', () => {
  it('PvE zone (grade < 8): always qualifies', () => {
    assert.equal(isQualifyingWin(0, null), true);
    assert.equal(isQualifyingWin(0, 0), true);
    assert.equal(isQualifyingWin(7, null), true);
    assert.equal(isQualifyingWin(7, 0), true);
    assert.equal(isQualifyingWin(7, 3), true);
  });

  it('quality zone (grade >= 8): opponent >= grade-1 qualifies', () => {
    assert.equal(isQualifyingWin(8, 8), true);   // equal
    assert.equal(isQualifyingWin(8, 7), true);    // exactly grade-1
    assert.equal(isQualifyingWin(10, 9), true);   // grade-1
    assert.equal(isQualifyingWin(10, 10), true);  // equal
    assert.equal(isQualifyingWin(10, 15), true);  // higher
  });

  it('quality zone: opponent < grade-1 does not qualify', () => {
    assert.equal(isQualifyingWin(8, 6), false);
    assert.equal(isQualifyingWin(10, 8), false);
    assert.equal(isQualifyingWin(20, 0), false);
  });

  it('PvE bot (null) treated as belt 0', () => {
    assert.equal(isQualifyingWin(0, null), true);  // 0 >= 0-1=-1 → true (also PvE zone)
    assert.equal(isQualifyingWin(1, null), true);   // 0 >= 1-1=0 → true (PvE zone)
    assert.equal(isQualifyingWin(8, null), false);  // 0 >= 8-1=7 → false
    assert.equal(isQualifyingWin(32, null), false); // 0 >= 31 → false
  });
});

// ── calculateBelt ───────────────────────────────────────────────

describe('calculateBelt', () => {
  it('0 wins → grade 0', () => {
    assert.equal(calculateBelt(0), 0);
  });

  it('exact thresholds', () => {
    assert.equal(calculateBelt(1), 1);     // white-1
    assert.equal(calculateBelt(3), 2);     // white-2
    assert.equal(calculateBelt(10), 4);    // yellow-0
    assert.equal(calculateBelt(50), 8);    // orange-0
    assert.equal(calculateBelt(2800), 32); // black
  });

  it('between thresholds → lower grade', () => {
    assert.equal(calculateBelt(2), 1);     // between 1 and 3
    assert.equal(calculateBelt(49), 7);    // between 35 and 50
    assert.equal(calculateBelt(2799), 31); // just below black
  });

  it('above max threshold → grade 32', () => {
    assert.equal(calculateBelt(5000), 32);
    assert.equal(calculateBelt(99999), 32);
  });
});

// ── checkHexmaster ──────────────────────────────────────────────

describe('checkHexmaster', () => {
  it('below threshold → false', () => {
    assert.equal(checkHexmaster(0), false);
    assert.equal(checkHexmaster(3999), false);
  });

  it('at threshold → true', () => {
    assert.equal(checkHexmaster(HEXMASTER_THRESHOLD), true);
  });

  it('above threshold → true', () => {
    assert.equal(checkHexmaster(5000), true);
  });
});

// ── applyWin ────────────────────────────────────────────────────

describe('applyWin', () => {
  it('qualifying win increments qualifiedWins', () => {
    const agent = { belt: 0, qualifiedWins: 0, isHexmaster: false };
    const result = applyWin(agent, null);
    assert.equal(result.qualified, true);
    assert.equal(result.qualifiedWins, 1);
    assert.equal(result.belt, 1); // 1 win → grade 1
    assert.equal(result.beltChanged, true);
  });

  it('non-qualifying win is a no-op', () => {
    const agent = { belt: 10, qualifiedWins: 95, isHexmaster: false };
    const result = applyWin(agent, 5); // opponent too weak
    assert.equal(result.qualified, false);
    assert.equal(result.qualifiedWins, 95);
    assert.equal(result.belt, 10);
    assert.equal(result.beltChanged, false);
  });

  it('belt promotion on threshold crossing', () => {
    // 9 wins → grade 3 (white-3, threshold 6). 10 wins → grade 4 (yellow-0)
    const agent = { belt: 3, qualifiedWins: 9, isHexmaster: false };
    const result = applyWin(agent, 0);
    assert.equal(result.qualified, true);
    assert.equal(result.qualifiedWins, 10);
    assert.equal(result.belt, 4);
    assert.equal(result.beltChanged, true);
  });

  it('win without belt change', () => {
    // 1 win → grade 1, 2 wins → still grade 1 (next threshold at 3)
    const agent = { belt: 1, qualifiedWins: 1, isHexmaster: false };
    const result = applyWin(agent, 0);
    assert.equal(result.qualified, true);
    assert.equal(result.qualifiedWins, 2);
    assert.equal(result.belt, 1);
    assert.equal(result.beltChanged, false);
  });

  it('hexmaster unlock', () => {
    const agent = { belt: 32, qualifiedWins: HEXMASTER_THRESHOLD - 1, isHexmaster: false };
    const result = applyWin(agent, 32);
    assert.equal(result.qualified, true);
    assert.equal(result.qualifiedWins, HEXMASTER_THRESHOLD);
    assert.equal(result.isHexmaster, true);
    assert.equal(result.hexmasterUnlocked, true);
  });

  it('already hexmaster → hexmasterUnlocked stays false', () => {
    const agent = { belt: 32, qualifiedWins: HEXMASTER_THRESHOLD + 10, isHexmaster: true };
    const result = applyWin(agent, 32);
    assert.equal(result.isHexmaster, true);
    assert.equal(result.hexmasterUnlocked, false);
  });

  it('PvE bot at quality zone does not qualify', () => {
    const agent = { belt: 8, qualifiedWins: 50, isHexmaster: false };
    const result = applyWin(agent, null); // null → belt 0
    assert.equal(result.qualified, false);
    assert.equal(result.qualifiedWins, 50);
  });

  it('does not mutate original agent', () => {
    const agent = { belt: 0, qualifiedWins: 0, isHexmaster: false };
    applyWin(agent, null);
    assert.equal(agent.qualifiedWins, 0);
    assert.equal(agent.belt, 0);
  });
});
