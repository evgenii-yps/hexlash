/**
 * User → Fighter #1 migration service.
 *
 * Lazy migration triggered on GET /v1/user/me.
 * Creates Agent "Fighter #1" from User.progression data.
 * Idempotent: safe to call multiple times.
 */

const prisma = require('../lib/prisma');
const { getOrCreateFightClub } = require('./fightClubService');
const config = require('../config');
const { transformMoves, extractModules, calculateBranchXp, transformResearch } = require('../utils/migrationHelpers');

/**
 * Lazy migration: User → Fighter #1.
 *
 * @param {string} userId
 * @returns {{ migrated: boolean, agentId?: string, reason?: string }}
 */
async function migrateUserToFighter(userId) {
  if (!config.MIGRATION_ENABLED) {
    return { migrated: false, reason: 'disabled' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { agents: { select: { id: true } } },
  });

  if (!user) {
    return { migrated: false, reason: 'user_not_found' };
  }

  if (user.agents.length > 0) {
    return { migrated: false, reason: 'already_has_agents' };
  }

  if (!user.progression) {
    return { migrated: false, reason: 'no_progression' };
  }

  const progression = user.progression;
  const modules = extractModules(progression.playerModules);
  const moves = transformMoves(progression.moves);
  const research = transformResearch(progression.moves);
  const deck = Array.isArray(user.deck) ? user.deck : (Array.isArray(progression.deck) ? progression.deck : []);
  const branchXp = calculateBranchXp(progression);

  const fightClub = await getOrCreateFightClub(userId);

  const result = await prisma.$transaction(async (tx) => {
    const agent = await tx.agent.create({
      data: {
        name: 'Fighter #1',
        skin: user.skin || 'skin_m_1.png',
        primaryModule: modules[0] || null,
        secondaryModule: modules[1] || null,
        tertiaryModule: modules[2] || null,
        fightClubId: fightClub.id,
        ownerId: userId,
      },
    });

    await tx.agentTactics.create({
      data: {
        agentId: agent.id,
        aggression: 'balanced',
        dicePolicy: 'smart',
        coachPreference: 'auto',
        emergencyThreshold: 30,
        restPeriod: 600000,
        fightMode: 'pve_training',
      },
    });

    await tx.agentProgression.create({
      data: {
        agentId: agent.id,
        research,
        moves,
        deck,
        speedXp: branchXp.speedXp,
        powerXp: branchXp.powerXp,
        techniqueXp: branchXp.techniqueXp,
      },
    });

    // Zero out freeXP on User progression
    if (progression.freeXP && progression.freeXP > 0) {
      const updatedProgression = { ...progression, freeXP: 0 };
      await tx.user.update({
        where: { id: userId },
        data: { progression: updatedProgression },
      });
    }

    return agent;
  });

  console.log(`[migration] user=${userId} migrated to agent=${result.id}`);
  return { migrated: true, agentId: result.id };
}

module.exports = { migrateUserToFighter };
