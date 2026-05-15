// helpers.js transitively requires config.js, which throws if JWT_SECRET is
// unset at module-load time. Provide a benign default so this test file can
// run via plain `npm test` without env setup. Real env value (if set) wins.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { formatUserResponse, formatUserPublicResponse } = require('../src/utils/helpers');

/**
 * helpers.test.js — pure unit tests for response shapers.
 * formatUserPublicResponse must include public-by-design fields and exclude
 * private fields (account / financial / game state / privacy timestamps).
 * formatUserResponse (existing) must remain unchanged — regression check.
 *
 * Mock User shape mirrors Prisma User record. `achievements` uses
 * { achievementId } shape per Prisma `UserAchievement` join (matches existing
 * map convention in formatUserResponse line 50: `(a) => a.achievementId`).
 */

const mockUser = {
  // Identity
  id: 'user-123',
  inviteId: 'INV-XYZ',
  email: 'secret@example.com',
  emailVerified: true,
  initialVerified: false,
  name: 'TestPlayer',
  login: 'testplayer',
  avatarUrl: 'https://example.com/a.png',
  isBlocked: false,
  // Financial
  balance: 1500,
  walletAddress: '0xABC123',
  skin: 'skin_m_1.png',
  // Stats
  rating: 1234,
  totalFights: 50,
  wins: 30,
  losses: 15,
  draws: 5,
  pveWins: 20,
  pveLosses: 8,
  pveDraws: 2,
  pveTotalFights: 30,
  pvpWins: 10,
  pvpLosses: 7,
  pvpDraws: 3,
  pvpTotalFights: 20,
  totalTaps: 9999,
  // Game state
  progression: { stage: 5 },
  deck: { slot1: 'card-A' },
  settings: { sound: true },
  luckPercentage: 12.5,
  // Tokens
  wonTokens: 500,
  freeTokens: 100,
  lostTokens: 50,
  // Referral
  invitedUsers: 3,
  referredBy: 'inviter-abc',
  noSkipDays: 7,
  // Clan
  clanId: 'clan-1',
  clanRole: 'MEMBER',
  // Timestamps
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-12-31'),
  // Achievements (Prisma UserAchievement join shape — { achievementId })
  achievements: [{ achievementId: 'first_blood' }, { achievementId: 'champion' }],
};

describe('formatUserPublicResponse', () => {
  it('includes all public fields', () => {
    const result = formatUserPublicResponse(mockUser);

    // Identity
    assert.equal(result.id, 'user-123');
    assert.equal(result.login, 'testplayer');
    assert.equal(result.name, 'TestPlayer');
    assert.equal(result.avatarUrl, 'https://example.com/a.png');
    assert.equal(result.skin, 'skin_m_1.png');
    assert.equal(result.isBlocked, false);

    // Clan
    assert.equal(result.clanId, 'clan-1');
    assert.equal(result.clanRole, 'MEMBER');

    // Stats
    assert.equal(result.rating, 1234);
    assert.equal(result.totalFights, 50);
    assert.equal(result.wins, 30);
    assert.equal(result.losses, 15);
    assert.equal(result.draws, 5);
    assert.equal(result.pveWins, 20);
    assert.equal(result.pveLosses, 8);
    assert.equal(result.pveDraws, 2);
    assert.equal(result.pveTotalFights, 30);
    assert.equal(result.pvpWins, 10);
    assert.equal(result.pvpLosses, 7);
    assert.equal(result.pvpDraws, 3);
    assert.equal(result.pvpTotalFights, 20);
    assert.equal(result.luckPercentage, 12.5);
    assert.equal(result.invitedUsers, 3);

    // Timestamp
    assert.ok(result.createdAt instanceof Date);

    // Achievements (mapped to IDs via achievementId per existing convention)
    assert.deepEqual(result.achievements, ['first_blood', 'champion']);
  });

  it('excludes private fields', () => {
    const result = formatUserPublicResponse(mockUser);

    // Account
    assert.equal(result.email, undefined);
    assert.equal(result.emailVerified, undefined);
    assert.equal(result.initialVerified, undefined);
    assert.equal(result.inviteId, undefined);

    // Financial
    assert.equal(result.balance, undefined);
    assert.equal(result.walletAddress, undefined);
    assert.equal(result.wonTokens, undefined);
    assert.equal(result.freeTokens, undefined);
    assert.equal(result.lostTokens, undefined);

    // Game state
    assert.equal(result.progression, undefined);
    assert.equal(result.deck, undefined);
    assert.equal(result.settings, undefined);
    assert.equal(result.noSkipDays, undefined);
    assert.equal(result.totalTaps, undefined);

    // UI / referral
    assert.equal(result.referredBy, undefined);

    // Privacy timestamp (last-seen tracking concern)
    assert.equal(result.updatedAt, undefined);
  });

  it('accepts captain option', () => {
    const captain = { id: 'captain-1', name: 'Cap', skin: 'skin_m_2.png' };
    const result = formatUserPublicResponse(mockUser, { captain });

    assert.deepEqual(result.captain, captain);
  });

  it('omits captain key when option not provided', () => {
    const result = formatUserPublicResponse(mockUser);
    assert.ok(!('captain' in result));
  });

  it('handles missing achievements gracefully', () => {
    const userNoAch = { ...mockUser, achievements: undefined };
    const result = formatUserPublicResponse(userNoAch);
    assert.deepEqual(result.achievements, []);
  });
});

describe('formatUserResponse (existing helper — regression check)', () => {
  it('still includes private fields (unchanged behavior)', () => {
    const result = formatUserResponse(mockUser);

    assert.equal(result.email, 'secret@example.com');
    assert.equal(result.balance, 1500);
    assert.equal(result.walletAddress, '0xABC123');
    assert.equal(result.wonTokens, 500);
    assert.equal(result.progression.stage, 5);
  });
});
