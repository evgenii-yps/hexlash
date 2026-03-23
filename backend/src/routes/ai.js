const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk').default;
const config = require('../config');
const { authMiddleware } = require('../middleware/auth');

// In-memory rate limiter (no external dependencies)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];

  // Remove expired entries
  const recent = userRequests.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(userId, recent);
    return false;
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

// Cleanup Map every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of rateLimitMap) {
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) rateLimitMap.delete(userId);
    else rateLimitMap.set(userId, recent);
  }
}, 5 * 60 * 1000);

const SYSTEM_PROMPT = `You are an AI fighting trainer for Hexlash — an auto-battle game on Base blockchain.

Players build fighters by combining 3 behavioral modules (archetypes):
- Predator: Relentless aggression, goes all-in under pressure
- Sentinel: Iron wall defense, counterattacks when pressured
- Ghost: Evasion and deception, strikes from shadows
- Analyst: Reads patterns, adapts, most rational fighter
- Maverick: Pure chaos, unpredictable, flashes of brilliance
- Juggernaut: Unstoppable pressure, never changes tactics

The fighter has a deck of 4-8 combat moves from 3 branches:
- Speed: jab, double_jab, rapid_fire, combo_strike, flurry, hurricane
- Power: straight, hook, uppercut, haymaker, hammer_fist, knockout_blow
- Technique: block_strike, counter_jab, feint_cross, parry_punish, slip_counter, precision_strike

During fight there are special mechanics:
- Dice: random effects (Heal, Adrenaline, Shield, Blind, Rage, Crit)
- Coach advice: Attack/Defense/Position boost for 4 rounds
- Emergency protocol: Medkit (+HP), Adrenaline (x2 dmg), Shield (block)

Analyze the fight log and respond with:
1. Brief fight summary (2-3 sentences)
2. What the player did well
3. What went wrong
4. Specific advice: which modules to swap, which moves to add/remove

Rules:
- Be concise, direct, motivating — like a real boxing coach
- Reference specific rounds and moments from the fight
- Suggest concrete changes
- Maximum 150 words
- Respond in the language specified by locale

CRITICAL FORMATTING RULE:
- Do NOT use markdown (no **, no ##, no bullets with -)
- Separate each section with a blank line
- Use these exact labels on their own line:

Fight Summary (2-3 sentences about the fight)
What You Did Well (specific positives)
What Went Wrong (specific issues)
Advice (concrete suggestions on modules and moves)

Each section label must be on its own line, followed by the content on the next line. Keep total response under 150 words.`;

function buildUserPrompt(fightLog, locale) {
  let prompt = 'Fight Analysis Request\n\n';
  prompt += `Result: ${fightLog.result}\n`;
  prompt += `Player build: ${(fightLog.playerDeck || []).join(' + ')}\n`;
  prompt += `Opponent build: ${(fightLog.opponentDeck || []).join(' + ')}\n\n`;
  prompt += `Final HP: Player ${fightLog.playerHP}/100, Opponent ${fightLog.opponentHP}/100\n`;
  prompt += `Total rounds: ${fightLog.totalRounds || 'unknown'}\n\n`;
  prompt += `Dice: ${fightLog.diceUsed ? fightLog.diceEffect : 'not used'}\n`;
  prompt += `Coach: ${fightLog.coachUsed ? fightLog.coachChoice : 'not used'}\n`;
  prompt += `Emergency: ${fightLog.emergencyUsed ? fightLog.emergencyType : 'not used'}\n\n`;

  if (fightLog.rounds && fightLog.rounds.length > 0) {
    prompt += 'Round-by-round:\n';
    fightLog.rounds.forEach((r, i) => {
      prompt += `Round ${i + 1}: ${JSON.stringify(r)}\n`;
    });
  }

  prompt += `\nLocale: ${locale || 'en'}`;
  return prompt;
}

router.post('/analyze-fight', authMiddleware, async (req, res) => {
  const startTime = Date.now();

  try {
    // Feature flag check
    if (!config.AI_TRAINER_ENABLED) {
      return res.status(503).json({ error: 'AI Trainer is disabled' });
    }

    // API key check
    if (!config.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI Trainer temporarily unavailable' });
    }

    // Rate limit check
    if (!checkRateLimit(req.userId)) {
      return res.status(429).json({ error: 'Too many requests. Max 5 analyses per minute.' });
    }

    // Validate input
    const { fightLog, locale } = req.body;
    if (!fightLog || !fightLog.result) {
      return res.status(400).json({ error: 'Invalid fight data' });
    }

    // Build prompts
    const userPrompt = buildUserPrompt(fightLog, locale);

    // Call Claude API
    const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: config.ANTHROPIC_MODEL,
      max_tokens: config.AI_TRAINER_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const analysis = response.content[0].text;
    const elapsed = Date.now() - startTime;

    console.log(`[AI Trainer] User ${req.userId} | ${fightLog.result} | ${fightLog.totalRounds} rounds | ${elapsed}ms`);

    return res.json({
      analysis,
      model: config.ANTHROPIC_MODEL,
    });

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[AI Trainer] Error for user ${req.userId} (${elapsed}ms):`, error.message);

    if (error.status === 429) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    return res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;
