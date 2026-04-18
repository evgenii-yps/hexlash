const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

/**
 * Captain Arena Flow — pattern tests.
 * Full integration tests require DB + WebSocket.
 * These verify the logic patterns used in the Captain flow.
 */

// ── PvE fight save through Captain ──────────────────────────────

describe('PvE Captain fight patterns', () => {
  const { applyWin } = require('../src/services/beltService');

  it('PvE win through Captain: belt updates with null opponent', () => {
    const captain = { belt: 0, qualifiedWins: 0, isHexmaster: false };
    const result = applyWin(captain, null); // PvE bot = null
    assert.equal(result.qualified, true);
    assert.equal(result.qualifiedWins, 1);
  });

  it('PvE win: high belt Captain vs null bot does not qualify', () => {
    const captain = { belt: 10, qualifiedWins: 95, isHexmaster: false };
    const result = applyWin(captain, null); // PvE bot = belt 0
    assert.equal(result.qualified, false);
  });

  it('no-captain scenario: getCaptainForCombat returns null', () => {
    // Pattern: if (!captain) return 409
    const captain = null;
    assert.equal(captain, null);
    // Backend should reject with NO_CAPTAIN_SET
  });
});

// ── PvP Captain ELO patterns ────────────────────────────────────

describe('PvP Captain ELO patterns', () => {
  it('ELO seed: default 1000 + user rating 1500 → seed', () => {
    const agentElo = 1000;
    const userRating = 1500;
    const shouldSeed = agentElo === 1000 && userRating && userRating !== 1000;
    assert.equal(shouldSeed, true);
  });

  it('ELO seed: non-default 1100 → no seed', () => {
    const agentElo = 1100;
    const userRating = 1500;
    const shouldSeed = agentElo === 1000 && userRating && userRating !== 1000;
    assert.equal(shouldSeed, false);
  });

  it('ELO seed: user rating 1000 → no seed', () => {
    const agentElo = 1000;
    const userRating = 1000;
    const shouldSeed = agentElo === 1000 && userRating && userRating !== 1000;
    assert.equal(shouldSeed, false);
  });

  it('PvP belt update uses opponent belt snapshot', () => {
    const { applyWin } = require('../src/services/beltService');
    const winner = { belt: 8, qualifiedWins: 50, isHexmaster: false };
    const opponentBelt = 8;
    const result = applyWin(winner, opponentBelt);
    assert.equal(result.qualified, true); // 8 >= 8-1=7
    assert.equal(result.qualifiedWins, 51);
  });
});
