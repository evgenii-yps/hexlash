const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function formatUserResponse(user) {
  const response = {
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
    clanId: user.clanId,
    clanRole: user.clanRole,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    achievements: user.achievements
      ? user.achievements.map((a) => a.achievementId)
      : [],
  };
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

module.exports = { generateToken, formatUserResponse, formatClanResponse, awardAchievement };
