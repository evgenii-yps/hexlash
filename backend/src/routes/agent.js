const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation constants
const VALID_ARCHETYPES = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];
const VALID_AGGRESSION = ['cautious', 'balanced', 'aggressive'];
const VALID_DICE_POLICY = ['always', 'smart', 'never'];
const VALID_COACH_PREF = ['attack', 'defense', 'position', 'auto'];
const VALID_EMERGENCY = [0, 20, 30];
const VALID_REST_PERIOD = [600000, 1800000, 3600000];
const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ0-9\s_-]{2,20}$/;
const SKIN_REGEX = /^(skin_(m|w)_\d{1,3}|vip_(k|t)\d{1,2})\.png$/;

const agentInclude = {
  tactics: true,
  progression: true,
};

const createAgentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many agents created, try again later' },
});

// GET /v1/agent/list
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { ownerId: req.userId },
      include: agentInclude,
      orderBy: { createdAt: 'asc' },
    });

    res.json({ agents });
  } catch (err) {
    console.error('List agents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/agent/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: agentInclude,
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ agent });
  } catch (err) {
    console.error('Get agent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/agent/create
router.post('/create', authMiddleware, createAgentLimiter, async (req, res) => {
  try {
    const { name, skin, primaryModule, secondaryModule, tertiaryModule } = req.body;

    // Validate user has a club
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.clubId) {
      return res.status(400).json({ error: 'No club found' });
    }

    // Validate roster limit
    const club = await prisma.club.findUnique({ where: { id: user.clubId } });
    const agentCount = await prisma.agent.count({ where: { clubId: user.clubId } });
    if (agentCount >= club.maxAgents) {
      return res.status(400).json({ error: 'Agent roster is full' });
    }

    // Validate name
    if (!name || !NAME_REGEX.test(name)) {
      return res.status(400).json({ error: 'Invalid agent name' });
    }

    // Validate skin
    if (!skin || !SKIN_REGEX.test(skin)) {
      return res.status(400).json({ error: 'Invalid skin' });
    }

    // Validate modules
    const modules = [primaryModule, secondaryModule, tertiaryModule];
    for (const mod of modules) {
      if (!VALID_ARCHETYPES.includes(mod)) {
        return res.status(400).json({ error: 'Invalid module' });
      }
    }

    const agent = await prisma.$transaction(async (tx) => {
      const created = await tx.agent.create({
        data: {
          name: name.trim(),
          skin,
          primaryModule,
          secondaryModule,
          tertiaryModule,
          clubId: user.clubId,
          ownerId: req.userId,
        },
      });

      await tx.agentTactics.create({
        data: { agentId: created.id },
      });

      await tx.agentProgression.create({
        data: { agentId: created.id },
      });

      return tx.agent.findUnique({
        where: { id: created.id },
        include: agentInclude,
      });
    });

    res.status(201).json({ agent });
  } catch (err) {
    console.error('Create agent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /v1/agent/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, skin, primaryModule, secondaryModule, tertiaryModule } = req.body;
    const updateData = {};

    // Validate name if provided
    if (name !== undefined) {
      if (!NAME_REGEX.test(name)) {
        return res.status(400).json({ error: 'Invalid agent name' });
      }
      updateData.name = name.trim();
    }

    // Validate skin if provided
    if (skin !== undefined) {
      if (!SKIN_REGEX.test(skin)) {
        return res.status(400).json({ error: 'Invalid skin' });
      }
      updateData.skin = skin;
    }

    // Validate modules if any provided
    const moduleFields = { primaryModule, secondaryModule, tertiaryModule };
    const hasModuleChange = Object.values(moduleFields).some((v) => v !== undefined);

    if (hasModuleChange) {
      if (agent.status === 'fighting') {
        return res.status(400).json({ error: 'Cannot change modules while fighting' });
      }
      for (const [key, val] of Object.entries(moduleFields)) {
        if (val !== undefined) {
          if (!VALID_ARCHETYPES.includes(val)) {
            return res.status(400).json({ error: 'Invalid module' });
          }
          updateData[key] = val;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await prisma.agent.update({
      where: { id: req.params.id },
      data: updateData,
      include: agentInclude,
    });

    res.json({ agent: updated });
  } catch (err) {
    console.error('Update agent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /v1/agent/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (agent.status === 'fighting') {
      return res.status(400).json({ error: 'Cannot delete agent while fighting' });
    }

    await prisma.agent.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete agent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /v1/agent/:id/tactics
router.put('/:id/tactics', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { aggression, dicePolicy, coachPreference, emergencyThreshold, restPeriod } = req.body;
    const updateData = {};

    if (aggression !== undefined) {
      if (!VALID_AGGRESSION.includes(aggression)) {
        return res.status(400).json({ error: 'Invalid aggression value' });
      }
      updateData.aggression = aggression;
    }

    if (dicePolicy !== undefined) {
      if (!VALID_DICE_POLICY.includes(dicePolicy)) {
        return res.status(400).json({ error: 'Invalid dice policy value' });
      }
      updateData.dicePolicy = dicePolicy;
    }

    if (coachPreference !== undefined) {
      if (!VALID_COACH_PREF.includes(coachPreference)) {
        return res.status(400).json({ error: 'Invalid coach preference value' });
      }
      updateData.coachPreference = coachPreference;
    }

    if (emergencyThreshold !== undefined) {
      if (!VALID_EMERGENCY.includes(emergencyThreshold)) {
        return res.status(400).json({ error: 'Invalid emergency threshold value' });
      }
      updateData.emergencyThreshold = emergencyThreshold;
    }

    if (restPeriod !== undefined) {
      if (!VALID_REST_PERIOD.includes(restPeriod)) {
        return res.status(400).json({ error: 'Invalid rest period value' });
      }
      updateData.restPeriod = restPeriod;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const tactics = await prisma.agentTactics.update({
      where: { agentId: req.params.id },
      data: updateData,
    });

    res.json({ tactics });
  } catch (err) {
    console.error('Update tactics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/agent/:id/fights
router.get('/:id/fights', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const where = { agentId: req.params.id };

    if (req.query.mode && ['pve_training', 'ranked', 'free_arena'].includes(req.query.mode)) {
      where.mode = req.query.mode;
    }

    const [fights, total] = await Promise.all([
      prisma.agentFightLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.agentFightLog.count({ where }),
    ]);

    res.json({ fights, total });
  } catch (err) {
    console.error('Get agent fights error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
