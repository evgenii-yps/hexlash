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
    daysInClub: user.daysInClub,
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
    isPublic: club.isPublic,
    maxMembers: club.maxMembers,
    members: club._count ? club._count.members : (club.members ? club.members.length : 0),
  };
}

module.exports = { generateToken, formatUserResponse, formatClubResponse };
