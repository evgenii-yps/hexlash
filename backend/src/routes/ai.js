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
const { AI_TRAINER_ENABLED, ANTHROPIC_API_KEY } = require('../config');

const router = express.Router();

// Per-user wallet backstop. The client break-detector already caps ~12 model
// calls per bout (cooldown + ceiling); this guards the server-side spend if many
// bouts run. Keyed by authenticated userId (falls back to IP).
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

module.exports = router;
