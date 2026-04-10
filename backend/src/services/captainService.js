/**
 * Captain Service — manages the Captain designation within a FightClub.
 * Invariant: exactly one Agent with isCaptain=true per FightClub (or zero if empty).
 */

const prisma = require('../lib/prisma');

/**
 * Atomically swap Captain in a FightClub + one-time ELO seed.
 * @param {string} fightClubId
 * @param {string} newCaptainId - Agent to become Captain
 * @param {string} requestUserId - User making the request (ownership check)
 * @returns {{ oldCaptainId: string|null, newCaptainId: string, noop?: boolean, eloSeeded?: boolean }}
 */
async function setCaptain(fightClubId, newCaptainId, requestUserId) {
  return await prisma.$transaction(async (tx) => {
    const club = await tx.fightClub.findUnique({
      where: { id: fightClubId },
      include: { owner: { select: { rating: true } } },
    });
    if (!club || club.ownerId !== requestUserId) {
      throw Object.assign(new Error('Access denied'), { status: 403, code: 'FORBIDDEN' });
    }

    const newCaptain = await tx.agent.findUnique({ where: { id: newCaptainId } });
    if (!newCaptain || newCaptain.fightClubId !== fightClubId) {
      throw Object.assign(new Error('Agent not in this club'), { status: 400, code: 'NOT_IN_CLUB' });
    }

    if (newCaptain.status === 'fighting') {
      throw Object.assign(new Error('Agent is currently fighting'), { status: 400, code: 'AGENT_FIGHTING' });
    }

    const oldCaptain = await tx.agent.findFirst({
      where: { fightClubId, isCaptain: true },
    });

    if (oldCaptain?.id === newCaptainId) {
      return { oldCaptainId: oldCaptain.id, newCaptainId, noop: true };
    }

    // Atomic swap
    if (oldCaptain) {
      await tx.agent.update({ where: { id: oldCaptain.id }, data: { isCaptain: false } });
    }

    // One-time ELO seed: if agent has default ELO and owner has non-default rating
    let eloSeeded = false;
    const seedData = { isCaptain: true };
    if (newCaptain.elo === 1000 && club.owner.rating && club.owner.rating !== 1000) {
      seedData.elo = club.owner.rating;
      eloSeeded = true;
    }

    await tx.agent.update({ where: { id: newCaptainId }, data: seedData });

    return { oldCaptainId: oldCaptain?.id ?? null, newCaptainId, eloSeeded };
  });
}

/**
 * Get current Captain of a FightClub.
 * @param {string} fightClubId
 * @returns {Object|null} Agent object or null
 */
async function getCaptain(fightClubId) {
  return prisma.agent.findFirst({
    where: { fightClubId, isCaptain: true },
    include: { tactics: true, progression: true },
  });
}

/**
 * Get Captain Agent fully populated for combat usage.
 * Returns null if user has no FightClub or no Captain.
 * @param {string} userId
 * @returns {Object|null} Agent with progression + tactics
 */
async function getCaptainForCombat(userId) {
  const club = await prisma.fightClub.findUnique({ where: { ownerId: userId } });
  if (!club) return null;
  return prisma.agent.findFirst({
    where: { fightClubId: club.id, isCaptain: true },
    include: { progression: true, tactics: true },
  });
}

/**
 * Check if an Agent can be deleted.
 * Captain with other agents in club → cannot delete (must reassign first).
 * Captain as only agent OR non-captain → can delete.
 * @param {string} agentId
 * @returns {{ canDelete: boolean, reason?: string }}
 */
async function canDeleteAgent(agentId) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { isCaptain: true, fightClubId: true },
  });

  if (!agent) return { canDelete: false, reason: 'not_found' };
  if (!agent.isCaptain) return { canDelete: true };

  const othersCount = await prisma.agent.count({
    where: { fightClubId: agent.fightClubId, id: { not: agentId } },
  });

  if (othersCount > 0) {
    return { canDelete: false, reason: 'captain_protected' };
  }

  return { canDelete: true };
}

module.exports = { setCaptain, getCaptain, getCaptainForCombat, canDeleteAgent };
