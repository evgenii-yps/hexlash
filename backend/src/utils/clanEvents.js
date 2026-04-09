const prisma = require('../lib/prisma');

/**
 * Create a clan event record. Silent on failure — event logging
 * must never break the main operation.
 */
async function createClanEvent(clanId, type, actorId = null, targetId = null, data = null) {
  try {
    return await prisma.clanEvent.create({
      data: { clanId, type, actorId, targetId, data },
    });
  } catch (e) {
    console.error('ClanEvent write error:', e.message);
    return null;
  }
}

module.exports = { createClanEvent };
