const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function formatUserResponse(user) {
  return {
    id: user.id,
    inviteId: user.inviteId,
    email: user.email,
    emailVerified: user.emailVerified,
    initialVerified: user.initialVerified,
    language: user.language,
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
    clubId: user.clubId,
    clubRole: user.clubRole,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    achievements: user.achievements
      ? user.achievements.map((a) => a.achievementId)
      : [],
  };
}

function formatClubResponse(club) {
  return {
    id: club.id,
    name: club.name,
    description: club.description,
    avatarUrl: club.avatarUrl,
    owner: club.ownerId,
    balance: club.balance,
    battles: club.battles,
    wins: club.wins,
    level: club.level || 1,
    xp: club.xp || 0,
    isPublic: club.isPublic,
    maxMembers: club.maxMembers,
    members: club._count ? club._count.members : (club.members ? club.members.length : 0),
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

module.exports = { generateToken, formatUserResponse, formatClubResponse, awardAchievement };
