/* HEXLASH — AI routes (/v1/ai). The fighter-intention endpoint backs the hybrid
   intention layer's "model brain": the arena posts a WORD context on fight breaks
   and gets back strict JSON { intention, read }. Auth-guarded + rate-limited; the
   API key lives only here (server-side). On any failure the client falls back to
   the deterministic spinal cord, so a non-200 is a normal, expected outcome. */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit; // IPv6-safe IP helper (v8) for the fallback key
const { authMiddleware } = require('../middleware/auth');
const { getFighterIntention } = require('../services/fighterIntentionService');
const { getLegendCommand } = require('../services/legendCommandService');
const { AI_TRAINER_ENABLED, ANTHROPIC_API_KEY } = require('../config');

const router = express.Router();

// Per-user wallet backstop, shared by both endpoints below. The client
// break-detectors already cap each bout (~12 for a fighter, 5 for the legend,
// and the two never run in the same bout); this guards the server-side spend if
// many bouts run. Keyed by authenticated userId (falls back to IP).
const intentionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || ipKeyGenerator(req.ip), // auth runs first so userId is set; IP fallback stays IPv6-safe
  message: { error: 'too_many_intention_requests' },
});

router.post('/fighter-intention', authMiddleware, intentionLimiter, async (req, res) => {
  if (!AI_TRAINER_ENABLED || !ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ai_intention_disabled' });
  }
  try {
    const { portrait, self, foe, memory, phase, trigger } = req.body || {};
    const result = await getFighterIntention({ portrait, self, foe, memory, phase, trigger });
    return res.json(result); // { intention, read }
  } catch (err) {
    const status = err.code === 'BAD_OUTPUT' ? 422 : err.code === 'AI_DISABLED' ? 503 : 502;
    return res.status(status).json({ error: err.code || 'intention_failed' });
  }
});

/* Legend command (COMMAND part B). Same shape and same guards as the fighter
   endpoint above: auth, the same per-user wallet backstop, the key stays here.

   ⚠️ THE SAME LIMITER ON PURPOSE, NOT A SECOND ONE. The two never run in the
      same bout — the COMMAND toggle needs more than one fighter on the player's
      side, and a field that big forces every body onto its reflexes — so one
      shared budget cannot be overspent by adding the legend, and a second
      limiter would only make the real ceiling twice today's without anyone
      deciding that.

   A non-200 here is normal: the client keeps the legend on her threshold table. */
router.post('/legend-command', authMiddleware, intentionLimiter, async (req, res) => {
  if (!AI_TRAINER_ENABLED || !ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ai_legend_disabled' });
  }
  try {
    const { portrait, units, foes, levers, phase, trigger } = req.body || {};
    const result = await getLegendCommand({ portrait, units, foes, levers, phase, trigger });
    return res.json(result); // { lever, target, line, lineWhy }
  } catch (err) {
    const status = err.code === 'BAD_OUTPUT' ? 422 : err.code === 'AI_DISABLED' ? 503 : 502;
    return res.status(status).json({ error: err.code || 'legend_command_failed' });
  }
});

module.exports = router;
