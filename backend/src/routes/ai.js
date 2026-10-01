/* HEXLASH — AI routes (/v1/ai). The fighter-intention endpoint backs the hybrid
   intention layer's "model brain": the arena posts a WORD context on fight breaks
   and gets back strict JSON { intention, read }. Rate-limited; the API key lives
   only here (server-side). On any failure the client falls back to the
   deterministic spinal cord, so a non-200 is a normal, expected outcome.

   WHO MAY CALL. A signed-in player (Bearer token) OR a guest (no token, an
   anonymous X-Guest-Id) — guest play is the only entry the game has today, so the
   model has to work for it. Guests are admitted on THESE TWO ROUTES ONLY, and the
   spend is bounded on the server: a per-IP burst limit and one shared daily
   ceiling (AI_GUEST_DAILY_CAP). Players behave exactly as before.

   EVERY CALL WRITES ONE LOG LINE (services/aiLog.js): route, guest/player, status,
   tokens, time. No request text, no ids. */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit; // IPv6-safe IP helper (v8) for the guest key
const { authOrGuest } = require('../middleware/auth');
const { getFighterIntention } = require('../services/fighterIntentionService');
const { getLegendCommand } = require('../services/legendCommandService');
const { takeGuestSlot } = require('../services/guestAiBudget');
const { logModelCall } = require('../services/aiLog');
const { AI_TRAINER_ENABLED, ANTHROPIC_API_KEY, AI_GUEST_RATE_MAX } = require('../config');

const router = express.Router();

const PLAYER_RATE_MAX = 60; // per account per window — unchanged

// Per-caller wallet backstop, shared by both endpoints below. The client
// break-detectors already cap each bout (~12 for a fighter, 5 for the legend,
// and the two never run in the same bout); this guards the server-side spend if
// many bouts run.
//   • signed-in player → keyed by userId, PLAYER_RATE_MAX per window (as before)
//   • guest            → keyed by IP, AI_GUEST_RATE_MAX per window. A guest has no
//     account to key on, and the id they send is free to forge, so the address is
//     the only thing that holds. ipKeyGenerator folds IPv6 addresses to their /56
//     so one machine cannot dodge the limit by rotating addresses in its block.
const intentionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: (req) => (req.isGuest ? AI_GUEST_RATE_MAX : PLAYER_RATE_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.isGuest ? `guest|${ipKeyGenerator(req.ip)}` : req.userId), // auth runs first, so isGuest/userId are set
  handler: (req, res) => {
    logModelCall({
      route: req.path.replace(/^\//, ''), caller: req.isGuest ? 'guest' : 'player',
      status: 429, reason: 'rate_limited',
    });
    res.status(429).json({ error: 'too_many_intention_requests' });
  },
});

let warnedDisabled = false; // "model is off" is said once, not per call

/**
 * One model route: admit, spend-guard, call, log. The answer bodies and status
 * codes are the same as before the guest change.
 */
function modelRoute(route, disabledError, failedError, run) {
  return async (req, res) => {
    const caller = req.isGuest ? 'guest' : 'player';
    const t0 = Date.now();
    let usage = null;
    const log = (status, extra) => logModelCall({ route, caller, status, usage, ms: Date.now() - t0, ...extra });

    if (!AI_TRAINER_ENABLED || !ANTHROPIC_API_KEY) {
      if (!warnedDisabled) {
        warnedDisabled = true;
        console.warn('[ai] model is OFF (no ANTHROPIC_API_KEY or AI_TRAINER_ENABLED=false) — every call answers 503 and fighters stay on reflexes');
      }
      return res.status(503).json({ error: disabledError });
    }
    // Guests share ONE daily budget for the whole server. Players are not counted.
    if (req.isGuest && !takeGuestSlot()) {
      log(503, { reason: 'guest_daily_cap' });
      return res.status(503).json({ error: 'ai_guest_daily_cap' });
    }
    try {
      const result = await run(req.body || {}, { onUsage: (u) => { usage = u; } });
      log(200);
      return res.json(result);
    } catch (err) {
      const status = err.code === 'BAD_OUTPUT' ? 422 : err.code === 'AI_DISABLED' ? 503 : 502;
      log(status, { err, reason: err.code === 'BAD_OUTPUT' ? 'bad_output' : undefined });
      return res.status(status).json({ error: err.code || failedError });
    }
  };
}

router.post('/fighter-intention', authOrGuest, intentionLimiter,
  modelRoute('fighter-intention', 'ai_intention_disabled', 'intention_failed', (body, opts) => {
    const { portrait, self, foe, memory, phase, trigger } = body;
    return getFighterIntention({ portrait, self, foe, memory, phase, trigger }, opts); // { intention, read }
  }));

/* Legend command (COMMAND part B). Same shape and same guards as the fighter
   endpoint above: the same admission (player or guest), the same wallet backstop,
   the key stays here.

   ⚠️ THE SAME LIMITER ON PURPOSE, NOT A SECOND ONE. The two never run in the
      same bout — the COMMAND toggle needs more than one fighter on the player's
      side, and a field that big forces every body onto its reflexes — so one
      shared budget cannot be overspent by adding the legend, and a second
      limiter would only make the real ceiling twice today's without anyone
      deciding that. (Exception: the SPAR bout, see data/commandBalance.js.)

   A non-200 here is normal: the client keeps the legend on her threshold table. */
router.post('/legend-command', authOrGuest, intentionLimiter,
  modelRoute('legend-command', 'ai_legend_disabled', 'legend_command_failed', (body, opts) => {
    const { portrait, units, foes, levers, phase, trigger } = body;
    return getLegendCommand({ portrait, units, foes, levers, phase, trigger }, opts); // { lever, target, line, lineWhy }
  }));

module.exports = router;
