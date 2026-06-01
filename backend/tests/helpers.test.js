// helpers.test.js — formatUserResponse / formatUserPublicResponse.
// Game-cleanup reset: game fields (rating/wins/balance/skin/clan/captain/
// achievements/progression/deck) removed. These now return only account /
// auth / web3 fields. Tests updated to lock the new shape.

// helpers.js transitively requires config.js, which throws if JWT_SECRET is
// unset at module-load time. Provide a benign default so this test file can
// run via plain `npm test` without env setup. Real env value (if set) wins.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { formatUserResponse, formatUserPublicResponse } = require('../src/utils/helpers');

const mockUser = {
  id: 'user-1',
  inviteId: 'invite-1',
  login: 'alice',
  email: 'alice@example.com',
  emailVerified: true,
  initialVerified: true,
  name: 'Alice',
  avatarUrl: 'a.png',
  isBlocked: false,
  walletAddress: '0xabc',
  settings: { theme: 'dark' },
  invitedUsers: 3,
  referredBy: 'bob',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z'),
};

describe('formatUserResponse', () => {
  it('includes account / auth / web3 fields', () => {
    const result = formatUserResponse(mockUser);
    assert.equal(result.id, 'user-1');
    assert.equal(result.login, 'alice');
    assert.equal(result.email, 'alice@example.com');
    assert.equal(result.emailVerified, true);
    assert.equal(result.name, 'Alice');
    assert.equal(result.avatarUrl, 'a.png');
    assert.equal(result.walletAddress, '0xabc');
    assert.equal(result.inviteId, 'invite-1');
    assert.equal(result.referredBy, 'bob');
    assert.equal(result.invitedUsers, 3);
    assert.deepEqual(result.settings, { theme: 'dark' });
    assert.equal(result.createdAt, '2026-01-01T00:00:00.000Z');
    assert.equal(result.updatedAt, '2026-02-01T00:00:00.000Z');
  });

  it('excludes removed game fields', () => {
    const result = formatUserResponse(mockUser);
    for (const f of ['balance', 'skin', 'rating', 'wins', 'losses', 'progression', 'deck', 'clanId', 'captain', 'achievements', 'totalTaps']) {
      assert.equal(result[f], undefined, `${f} should be absent`);
    }
  });
});

describe('formatUserPublicResponse', () => {
  it('includes public account fields only', () => {
    const result = formatUserPublicResponse(mockUser);
    assert.equal(result.id, 'user-1');
    assert.equal(result.login, 'alice');
    assert.equal(result.name, 'Alice');
    assert.equal(result.avatarUrl, 'a.png');
    assert.equal(result.isBlocked, false);
    assert.ok(result.createdAt);
  });

  it('excludes private + removed game fields', () => {
    const result = formatUserPublicResponse(mockUser);
    for (const f of ['email', 'walletAddress', 'settings', 'referredBy', 'balance', 'skin', 'rating', 'clanId', 'captain', 'achievements']) {
      assert.equal(result[f], undefined, `${f} should be absent`);
    }
  });
});
