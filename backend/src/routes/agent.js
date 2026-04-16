const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const {
  MOVE_BRANCHES,
  ALL_MOVE_IDS,
  LEVEL_UP_XP_COST,
  BRANCH_XP_FIELD,
  canAgentLearnMove,
  validateAgentDeck,
  getAvailableMovesForAgent,
  ensureResearch,
  executeResearchAction,
} = require('../services/researchGateService');
const { runPveTraining } = require('../services/agentFightService');

const router = express.Router();

// Validation constants
const VALID_ARCHETYPES = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];
const VALID_AGGRESSION = ['cautious', 'balanced', 'aggressive'];
const VALID_DICE_POLICY = ['always', 'smart', 'never'];
const VALID_COACH_PREF = ['attack', 'defense', 'position', 'auto'];
const VALID_EMERGENCY = [0, 20, 30];
const VALID_REST_PERIOD = [600000, 1800000, 3600000];
const VALID_FIGHT_MODE = ['pve_training', 'ranked', 'free_arena'];
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

// GET /v1/agent/fight-club — get fight club level info
router.get('/fight-club', authMiddleware, async (req, res) => {
  try {
    const { getOrCreateFightClub, getLevelInfo } = require('../services/fightClubService');
    const fc = await getOrCreateFightClub(req.userId);
    const info = getLevelInfo(fc.xp);
    const currentAgents = await prisma.agent.count({ where: { ownerId: req.userId } });
    console.log('[AGENT FIGHT-CLUB]', { ownerId: req.userId, currentAgents, maxAgents: info.maxAgents, fightClubId: fc.id });
    res.json({ data: { ...info, currentAgents, fightClubId: fc.id } });
  } catch (err) {
    console.error('Get fight club error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/agent/rankings
router.get('/rankings', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const where = { totalFights: { gte: 5 } };
    const [rankings, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy: [{ isHexmaster: 'desc' }, { belt: 'desc' }, { qualifiedWins: 'desc' }],
        take: limit,
        skip: offset,
        select: {
          id: true, name: true, skin: true, elo: true,
          primaryModule: true, secondaryModule: true, tertiaryModule: true,
          wins: true, losses: true, draws: true, totalFights: true,
          belt: true, qualifiedWins: true, isHexmaster: true,
          owner: { select: { id: true, login: true, skin: true } },
        },
      }),
      prisma.agent.count({ where }),
    ]);

    res.json({
      rankings: rankings.map((a, i) => ({
        rank: offset + i + 1,
        agent: {
          id: a.id, name: a.name, skin: a.skin, elo: a.elo,
          primaryModule: a.primaryModule, secondaryModule: a.secondaryModule, tertiaryModule: a.tertiaryModule,
          wins: a.wins, losses: a.losses, draws: a.draws, totalFights: a.totalFights,
          belt: a.belt, qualifiedWins: a.qualifiedWins, isHexmaster: a.isHexmaster,
        },
        owner: a.owner,
      })),
      total,
    });
  } catch (err) {
    console.error('Get rankings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/agent/list
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { ownerId: req.userId },
      include: agentInclude,
      orderBy: { createdAt: 'asc' },
    });

    console.log('[AGENT LIST]', { ownerId: req.userId, count: agents.length, agents: agents.map(a => ({ id: a.id, name: a.name })) });
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

    // Lazy migration: populate research if empty
    const migrated = await ensureResearch(agent.id, req.userId);
    if (migrated) {
      agent.progression = migrated;
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

    // Get or create FightClub (auto-created, no clan required)
    const { getOrCreateFightClub } = require('../services/fightClubService');
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const fightClub = await getOrCreateFightClub(req.userId);

    // Validate roster limit
    const agentCount = await prisma.agent.count({ where: { ownerId: req.userId } });
    console.log('[AGENT CREATE] roster check', { ownerId: req.userId, agentCount, maxAgents: fightClub.maxAgents, fightClubId: fightClub.id });
    if (agentCount >= fightClub.maxAgents) {
      return res.status(400).json({ error: 'Agent roster is full', currentAgents: agentCount, maxAgents: fightClub.maxAgents });
    }

    // NFT check (feature flag)
    const { checkMintRequirement } = require('../services/nftService');
    const ownedAgents = await prisma.agent.count({ where: { ownerId: req.userId } });
    const mintCheck = await checkMintRequirement(user.walletAddress, ownedAgents);
    if (!mintCheck.allowed) {
      return res.status(403).json({ error: mintCheck.reason, nftRequired: true, nftBalance: mintCheck.nftBalance });
    }

    // Validate name
    if (!name || !NAME_REGEX.test(name)) {
      return res.status(400).json({ error: 'Invalid agent name' });
    }

    // Validate skin
    if (!skin || !SKIN_REGEX.test(skin)) {
      return res.status(400).json({ error: 'Invalid skin' });
    }

    // Validate modules (optional — can be set later in AgentDetail)
    for (const mod of [primaryModule, secondaryModule, tertiaryModule]) {
      if (mod != null && !VALID_ARCHETYPES.includes(mod)) {
        return res.status(400).json({ error: 'Invalid module' });
      }
    }

    const agent = await prisma.$transaction(async (tx) => {
      const created = await tx.agent.create({
        data: {
          name: name.trim(),
          skin,
          primaryModule: primaryModule || null,
          secondaryModule: secondaryModule || null,
          tertiaryModule: tertiaryModule || null,
          fightClubId: fightClub.id,
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

    const { fightMode } = req.body;
    if (fightMode !== undefined) {
      if (!VALID_FIGHT_MODE.includes(fightMode)) {
        return res.status(400).json({ error: 'Invalid fight mode value' });
      }
      updateData.fightMode = fightMode;
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

const trainLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Too many training fights, try again later' },
});

// POST /v1/agent/:id/train
router.post('/:id/train', authMiddleware, trainLimiter, async (req, res) => {
  try {
    const result = await runPveTraining(req.params.id, req.userId);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Train agent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /v1/agent/:id/auto-fight
router.put('/:id/auto-fight', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: { progression: true },
    });

    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    if (agent.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    if (enabled) {
      const deck = Array.isArray(agent.progression?.deck) ? agent.progression.deck : [];
      if (deck.length < 4) {
        return res.status(400).json({ error: 'Agent needs at least 4 moves in deck' });
      }
    }

    const updated = await prisma.agent.update({
      where: { id: req.params.id },
      data: {
        autoFight: enabled,
        status: 'idle',
        nextFightAt: enabled ? new Date() : null,
      },
      select: { id: true, autoFight: true, status: true, nextFightAt: true },
    });

    res.json({ agent: updated });
  } catch (err) {
    console.error('Toggle auto-fight error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/agent/:id/auto-fight-status
router.get('/:id/auto-fight-status', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });

    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    if (agent.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayFights = await prisma.agentFightLog.count({
      where: { agentId: agent.id, createdAt: { gte: startOfDay } },
    });

    const lastFight = await prisma.agentFightLog.findFirst({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
      select: { result: true },
    });

    res.json({
      autoFight: agent.autoFight,
      status: agent.status,
      nextFightAt: agent.nextFightAt,
      todayFights,
      maxFightsPerDay: 50,
      lastFightResult: lastFight?.result || null,
    });
  } catch (err) {
    console.error('Auto-fight status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/agent/:id/available-moves
router.get('/:id/available-moves', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.params.id } });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Lazy migration: populate research if empty
    await ensureResearch(agent.id, req.userId);

    const moves = await getAvailableMovesForAgent(req.params.id);

    res.json({ moves });
  } catch (err) {
    console.error('Get available moves error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/agent/:id/learn-move
router.post('/:id/learn-move', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: { progression: true },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (agent.status === 'fighting') {
      return res.status(400).json({ error: 'Cannot learn while fighting' });
    }

    const { moveId, targetLevel } = req.body;

    // Validate moveId exists
    if (!ALL_MOVE_IDS.includes(moveId)) {
      return res.status(400).json({ error: 'Unknown move' });
    }

    // Validate targetLevel
    if (!Number.isInteger(targetLevel) || targetLevel < 1 || targetLevel > 5) {
      return res.status(400).json({ error: 'Invalid target level' });
    }

    // Check current agent level for this move
    const agentMoves = Array.isArray(agent.progression.moves) ? agent.progression.moves : [];
    const currentMove = agentMoves.find(m => m.moveId === moveId);
    const currentLevel = currentMove ? currentMove.level : 0;

    if (targetLevel !== currentLevel + 1) {
      return res.status(400).json({ error: 'Can only upgrade one level at a time' });
    }

    // Research Gate check — per-agent research
    const check = await canAgentLearnMove(agent.id, moveId, targetLevel);
    if (!check.allowed) {
      return res.status(403).json({ error: check.reason });
    }

    // XP cost (level 1 is free)
    const xpCost = targetLevel <= 1 ? 0 : (LEVEL_UP_XP_COST[targetLevel] || 0);
    const branch = MOVE_BRANCHES[moveId];
    const xpField = BRANCH_XP_FIELD[branch];

    if (xpCost > 0 && agent.progression[xpField] < xpCost) {
      return res.status(400).json({ error: 'Not enough XP' });
    }

    // Update moves array
    const updatedMoves = [...agentMoves];
    const existingIdx = updatedMoves.findIndex(m => m.moveId === moveId);
    if (existingIdx >= 0) {
      updatedMoves[existingIdx] = { moveId, level: targetLevel };
    } else {
      updatedMoves.push({ moveId, level: targetLevel });
    }

    // Build update data
    const updateData = { moves: updatedMoves };
    if (xpCost > 0) {
      updateData[xpField] = { decrement: xpCost };
    }

    const progression = await prisma.agentProgression.update({
      where: { agentId: req.params.id },
      data: updateData,
    });

    res.json({ progression, learned: { moveId, level: targetLevel } });
  } catch (err) {
    console.error('Learn move error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /v1/agent/:id/deck
router.put('/:id/deck', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: { progression: true },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (agent.status === 'fighting') {
      return res.status(400).json({ error: 'Cannot change deck while fighting' });
    }

    const { deck } = req.body;

    if (!Array.isArray(deck) || deck.length < 4 || deck.length > 8) {
      return res.status(400).json({ error: 'Deck must have 4-8 moves' });
    }

    // Check duplicates
    if (new Set(deck).size !== deck.length) {
      return res.status(400).json({ error: 'Duplicate moves in deck' });
    }

    // Check all moves are learned by agent
    const agentMoves = Array.isArray(agent.progression.moves) ? agent.progression.moves : [];
    const agentMoveIds = new Set(agentMoves.map(m => m.moveId));
    for (const moveId of deck) {
      if (!agentMoveIds.has(moveId)) {
        return res.status(400).json({ error: `Move not learned: ${moveId}` });
      }
    }

    // Validate against agent's own research
    const validation = await validateAgentDeck(req.params.id, deck, agentMoves);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reasons[0] });
    }

    const progression = await prisma.agentProgression.update({
      where: { agentId: req.params.id },
      data: { deck },
    });

    res.json({ progression });
  } catch (err) {
    console.error('Update deck error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const researchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { error: 'Too many research actions, try again later' },
});

// POST /v1/agent/:id/research — unlock or upgrade a move in agent's research tree
router.post('/:id/research', authMiddleware, researchLimiter, async (req, res) => {
  try {
    const { action, moveId } = req.body;

    if (!action || !moveId) {
      return res.status(400).json({ error: 'action and moveId are required' });
    }

    if (action !== 'unlock' && action !== 'upgrade') {
      return res.status(400).json({ error: 'action must be "unlock" or "upgrade"' });
    }

    if (!ALL_MOVE_IDS.includes(moveId)) {
      return res.status(400).json({ error: 'Unknown move' });
    }

    // Lazy migration: populate research if empty
    await ensureResearch(req.params.id, req.userId);

    const result = await executeResearchAction(req.params.id, req.userId, action, moveId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      progression: result.progression,
      tapsSpent: result.tapsSpent,
      xpSpent: result.xpSpent,
    });
  } catch (err) {
    console.error('Research action error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/agent/:id/allocate-xp — transfer freeXP from User to agent branch XP
router.post('/:id/allocate-xp', authMiddleware, async (req, res) => {
  try {
    const { branch, amount } = req.body;

    // Validate branch
    if (!branch || !['speed', 'power', 'technique'].includes(branch)) {
      return res.status(400).json({ error: 'branch must be "speed", "power", or "technique"' });
    }

    // Validate amount
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive integer' });
    }

    // Verify agent ownership
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      select: { ownerId: true },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check user has enough freeXP
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { progression: true },
    });

    if (!user || !user.progression) {
      return res.status(400).json({ error: 'No progression data' });
    }

    const freeXP = user.progression.freeXP || 0;
    if (freeXP < amount) {
      return res.status(400).json({ error: 'Not enough free XP' });
    }

    const xpField = BRANCH_XP_FIELD[branch];

    // Transaction: deduct freeXP from User, add to agent branchXp
    const result = await prisma.$transaction(async (tx) => {
      // Deduct freeXP from User.progression
      const updatedProgression = { ...user.progression, freeXP: freeXP - amount };
      await tx.user.update({
        where: { id: req.userId },
        data: { progression: updatedProgression },
      });

      // Add to agent branch XP
      const updatedProg = await tx.agentProgression.update({
        where: { agentId: req.params.id },
        data: { [xpField]: { increment: amount } },
      });

      return { userFreeXP: freeXP - amount, agentProgression: updatedProg };
    });

    res.json({
      freeXP: result.userFreeXP,
      progression: result.agentProgression,
    });
  } catch (err) {
    console.error('Allocate XP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
