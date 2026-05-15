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
 * so we don't accidentally generate weak tokens (preferable к failing
 * the request over silently degrading security).
 *
 * Email Auth Phase 3.
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function formatUserResponse(user, options = {}) {
  const response = {
    id: user.id,
    inviteId: user.inviteId,
    email: user.email,
    emailVerified: user.emailVerified,
    initialVerified: user.initialVerified,
    name: user.name,
    login: user.login,
    avatarUrl: user.avatarUrl,
    isBlocked: user.isBlocked,
    balance: user.balance,
    walletAddress: user.walletAddress,
    skin: user.skin,
    rating: user.rating,
    totalFights: user.totalFights,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    pveWins: user.pveWins,
    pveLosses: user.pveLosses,
    pveDraws: user.pveDraws,
    pveTotalFights: user.pveTotalFights,
    pvpWins: user.pvpWins,
    pvpLosses: user.pvpLosses,
    pvpDraws: user.pvpDraws,
    pvpTotalFights: user.pvpTotalFights,
    totalTaps: user.totalTaps,
    progression: user.progression,
    deck: user.deck,
    settings: user.settings,
    luckPercentage: user.luckPercentage,
    wonTokens: user.wonTokens,
    freeTokens: user.freeTokens,
    lostTokens: user.lostTokens,
    invitedUsers: user.invitedUsers,
    referredBy: user.referredBy,
    noSkipDays: user.noSkipDays,
    clanId: user.clanId,
    clanRole: user.clanRole,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    achievements: user.achievements
      ? user.achievements.map((a) => a.achievementId)
      : [],
  };
  // Attach captain public info if provided via options
  if (options.captain !== undefined) {
    response.captain = options.captain;
  }
  return response;
}

/**
 * Returns user data safe for public/guest exposure.
 * Excludes: email, walletAddress, balance, financial tokens (won/free/lost),
 *           progression, deck, settings, inviteId, referredBy,
 *           noSkipDays, totalTaps, updatedAt.
 *
 * Used by guest endpoints: /user/login/:login, /user/id/:id, /user/search.
 *
 * @param {Object} user - Prisma User record (with achievements relation if needed)
 * @param {Object} options
 * @param {Object|null} options.captain - public captain info via getCaptainPublicInfo
 * @returns {Object} public-safe user response
 */
function formatUserPublicResponse(user, options = {}) {
  const response = {
    // Identity (public)
    id: user.id,
    login: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    skin: user.skin,
    isBlocked: user.isBlocked,

    // Clan affiliation (public)
    clanId: user.clanId,
    clanRole: user.clanRole,

    // Game state — public
    rating: user.rating,
    totalFights: user.totalFights,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    pveWins: user.pveWins,
    pveLosses: user.pveLosses,
    pveDraws: user.pveDraws,
    pveTotalFights: user.pveTotalFights,
    pvpWins: user.pvpWins,
    pvpLosses: user.pvpLosses,
    pvpDraws: user.pvpDraws,
    pvpTotalFights: user.pvpTotalFights,
    luckPercentage: user.luckPercentage,
    invitedUsers: user.invitedUsers,

    // Timestamp (public — join date only)
    createdAt: user.createdAt,

    // Achievements — public showcase (preserve existing array-of-IDs format)
    achievements: user.achievements
      ? user.achievements.map((a) => a.achievementId)
      : [],
  };

  if (options.captain !== undefined) {
    response.captain = options.captain;
  }

  return response;
}

function formatClanResponse(clan) {
  return {
    id: clan.id,
    name: clan.name,
    description: clan.description,
    avatarUrl: clan.avatarUrl,
    owner: clan.ownerId,
    balance: clan.balance,
    battles: clan.battles,
    wins: clan.wins,
    level: clan.level || 1,
    xp: clan.xp || 0,
    isPublic: clan.isPublic,
    maxMembers: clan.maxMembers,
    members: clan._count ? clan._count.members : (clan.members ? clan.members.length : 0),
  };
}

/**
 * Award an achievement to a user (idempotent — skips if already awarded).
 * Returns the achievement type if newly awarded, null otherwise.
 */
async function awardAchievement(prismaClient, userId, achievementType) {
  const achievement = await prismaClient.achievement.findUnique({
    where: { type: achievementType },
  });
  if (!achievement) return null;

  const existing = await prismaClient.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
  });
  if (existing) return null;

  await prismaClient.userAchievement.create({
    data: { userId, achievementId: achievement.id },
  });

  return achievementType;
}

module.exports = { generateToken, generateRandomToken, formatUserResponse, formatUserPublicResponse, formatClanResponse, awardAchievement };
