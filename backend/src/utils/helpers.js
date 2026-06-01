const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET } = require('../config');

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Cryptographically secure random token for email-auth flows
 * (verifyToken / resetToken). 32 random bytes → 64 hex chars.
 * crypto.randomBytes throws if entropy unavailable — let it propagate
 * so we don't accidentally generate weak tokens.
 *
 * Email Auth Phase 3.
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Game-cleanup reset: all game scalar fields (rating, wins, balance, skin,
// progression, deck, clan, captain, achievements, etc.) removed. These now
// return only account / auth / web3 fields.

function formatUserResponse(user) {
  return {
    id: user.id,
    inviteId: user.inviteId,
    email: user.email,
    emailVerified: user.emailVerified,
    initialVerified: user.initialVerified,
    name: user.name,
    login: user.login,
    avatarUrl: user.avatarUrl,
    isBlocked: user.isBlocked,
    walletAddress: user.walletAddress,
    settings: user.settings,
    invitedUsers: user.invitedUsers,
    referredBy: user.referredBy,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * Returns user data safe for public/guest exposure.
 * Excludes account-private fields (email, walletAddress, settings, referral).
 * Used by guest endpoints: /user/login/:login, /user/id/:id, /user/search.
 */
function formatUserPublicResponse(user) {
  return {
    id: user.id,
    login: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
  };
}

module.exports = { generateToken, generateRandomToken, formatUserResponse, formatUserPublicResponse };
