const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk').default;
const config = require('../config');
const { authMiddleware } = require('../middleware/auth');

// In-memory rate limiter (no external dependencies)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

const buildDescRateLimitMap = new Map();
const BUILD_DESC_RATE_LIMIT_MAX = 10; // 10 requests per minute

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

function checkBuildDescRateLimit(userId) {
  const now = Date.now();
  const userRequests = buildDescRateLimitMap.get(userId) || [];
  const recent = userRequests.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= BUILD_DESC_RATE_LIMIT_MAX) {
    buildDescRateLimitMap.set(userId, recent);
    return false;
  }

  recent.push(now);
  buildDescRateLimitMap.set(userId, recent);
  return true;
}

// Anthropic client singleton
let anthropicClient = null;

function getAnthropicClient() {
  if (!anthropicClient && config.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// Cleanup Map every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of rateLimitMap) {
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) rateLimitMap.delete(userId);
    else rateLimitMap.set(userId, recent);
  }
  for (const [userId, timestamps] of buildDescRateLimitMap) {
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) buildDescRateLimitMap.delete(userId);
    else buildDescRateLimitMap.set(userId, recent);
  }
  for (const [userId, timestamps] of autoFightRateLimitMap) {
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) autoFightRateLimitMap.delete(userId);
    else autoFightRateLimitMap.set(userId, recent);
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

CRITICAL: Section labels must ALWAYS be in English exactly as shown below, even when responding in another language. Only the content under each label should be in the requested language.

Fight Summary (2-3 sentences about the fight)
What You Did Well (specific positives)
What Went Wrong (specific issues)
Advice (concrete suggestions on modules and moves)

Each section label must be on its own line, followed by the content on the next line. Keep total response under 150 words.`;

function buildUserPrompt(fightLog, locale) {
  let prompt = 'Fight Analysis Request\n\n';
  prompt += `Result: ${fightLog.result}\n`;
  prompt += `Player build: ${(fightLog.playerDeck || []).join(' + ')}\n`;
  prompt += `Player modules: ${(fightLog.playerModules || []).join(' + ') || 'unknown'}\n`;
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

    const VALID_RESULTS = ['win', 'loss', 'draw'];
    if (!VALID_RESULTS.includes(fightLog.result)) {
      return res.status(400).json({ error: 'Invalid result. Must be win, loss, or draw.' });
    }

    const MAX_ROUNDS_LIMIT = 15;
    const MAX_DECK = 8;

    if (fightLog.rounds != null) {
      if (!Array.isArray(fightLog.rounds)) {
        return res.status(400).json({ error: 'rounds must be an array' });
      }
      if (fightLog.rounds.length > MAX_ROUNDS_LIMIT) {
        fightLog.rounds = fightLog.rounds.slice(0, MAX_ROUNDS_LIMIT);
      }
    }

    if (fightLog.playerDeck != null) {
      if (!Array.isArray(fightLog.playerDeck) || fightLog.playerDeck.length > MAX_DECK) {
        return res.status(400).json({ error: 'playerDeck must be an array of up to 8 strings' });
      }
    }

    if (fightLog.opponentDeck != null) {
      if (!Array.isArray(fightLog.opponentDeck) || fightLog.opponentDeck.length > MAX_DECK) {
        return res.status(400).json({ error: 'opponentDeck must be an array of up to 8 strings' });
      }
    }

    if (fightLog.playerHP != null) {
      const hp = Number(fightLog.playerHP);
      if (isNaN(hp) || hp < 0 || hp > 100) {
        return res.status(400).json({ error: 'playerHP must be a number between 0 and 100' });
      }
    }

    if (fightLog.opponentHP != null) {
      const hp = Number(fightLog.opponentHP);
      if (isNaN(hp) || hp < 0 || hp > 100) {
        return res.status(400).json({ error: 'opponentHP must be a number between 0 and 100' });
      }
    }

    if (fightLog.totalRounds != null) {
      const tr = Number(fightLog.totalRounds);
      if (isNaN(tr) || tr < 1 || tr > MAX_ROUNDS_LIMIT) {
        return res.status(400).json({ error: `totalRounds must be a number between 1 and ${MAX_ROUNDS_LIMIT}` });
      }
    }

    const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';

    // Build prompts
    const userPrompt = buildUserPrompt(fightLog, validLocale);

    // Call Claude API
    const client = getAnthropicClient();
    if (!client) {
      return res.status(503).json({ error: 'AI Trainer temporarily unavailable' });
    }
    const response = await client.messages.create({
      model: config.ANTHROPIC_MODEL,
      max_tokens: config.AI_TRAINER_MAX_TOKENS,
      temperature: 0.7,
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

// ── Auto Fight Summary ──────────────────────────────────────────────────

const autoFightRateLimitMap = new Map();
const AUTO_FIGHT_RATE_LIMIT_MAX = 5; // 5 requests per minute

function checkAutoFightRateLimit(userId) {
  const now = Date.now();
  const userRequests = autoFightRateLimitMap.get(userId) || [];
  const recent = userRequests.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= AUTO_FIGHT_RATE_LIMIT_MAX) {
    autoFightRateLimitMap.set(userId, recent);
    return false;
  }

  recent.push(now);
  autoFightRateLimitMap.set(userId, recent);
  return true;
}

const AUTO_FIGHT_SYSTEM_PROMPT = `You are an AI fighting trainer for Hexlash — an auto-battle game on Base blockchain.

Players build fighters by combining 3 behavioral modules (archetypes):
- Predator: Relentless aggression, goes all-in under pressure
- Sentinel: Iron wall defense, counterattacks when pressured
- Ghost: Evasion and deception, strikes from shadows
- Analyst: Reads patterns, adapts, most rational fighter
- Maverick: Pure chaos, unpredictable, flashes of brilliance
- Juggernaut: Unstoppable pressure, never changes tactics

Combat moves from 3 branches:
- Speed: jab, double_jab, rapid_fire, combo_strike, flurry, hurricane
- Power: straight, hook, uppercut, haymaker, hammer_fist, knockout_blow
- Technique: block_strike, counter_jab, feint_cross, parry_punish, slip_counter, precision_strike

Special mechanics:
- Dice: random effects (Heal, Adrenaline, Shield, Blind, Rage, Crit)
- Coach advice: Attack/Defense/Position boost for 4 rounds
- Emergency protocol: Medkit (+HP), Adrenaline (x2 dmg), Shield (block)

You are analyzing a SERIES of auto fights (not a single fight). Look for patterns across multiple fights.

Respond with exactly 4 sections. CRITICAL: Section labels must ALWAYS be in English exactly as shown below, even when responding in another language. Only the content under each label should be in the requested language.

Session Overview
(Win/loss ratio, trends, average HP remaining, how many close fights)

Strengths
(What works well in the current build across multiple fights)

Weaknesses
(Recurring problems, patterns of losses)

Recommendation
(Concrete advice: modules to swap, moves to add/remove, dice/coach usage tips)

Rules:
- Be concise, direct, motivating — like a real boxing coach
- Reference specific patterns across fights (not individual rounds)
- Suggest concrete changes
- Maximum 200 words total
- Do NOT use markdown (no **, no ##, no bullets with -)
- Each section label on its own line, content on the next line
- Respond in the language specified by locale`;

function buildAutoFightUserPrompt(fights, totalFights, period, locale) {
  let prompt = `Auto Fight Series Analysis\n\n`;
  prompt += `Period: ${period}\n`;
  prompt += `Fights analyzed: ${fights.length} of ${totalFights} total\n\n`;

  const wins = fights.filter(f => f.result === 'win').length;
  const losses = fights.filter(f => f.result === 'loss').length;
  const draws = fights.filter(f => f.result === 'draw').length;
  prompt += `Record: ${wins}W / ${losses}L / ${draws}D\n`;

  const avgPlayerHP = Math.round(fights.reduce((sum, f) => sum + f.playerHP, 0) / fights.length);
  const avgRounds = Math.round(fights.reduce((sum, f) => sum + f.rounds, 0) / fights.length * 10) / 10;
  prompt += `Avg player HP remaining: ${avgPlayerHP}/100\n`;
  prompt += `Avg rounds: ${avgRounds}\n\n`;

  // Module usage
  const moduleCounts = {};
  fights.forEach(f => {
    (f.playerModules || []).forEach(m => { moduleCounts[m] = (moduleCounts[m] || 0) + 1; });
  });
  prompt += `Player modules used: ${Object.entries(moduleCounts).map(([m, c]) => `${m}(${c})`).join(', ')}\n`;

  // Dice & coach usage
  const diceUsedCount = fights.filter(f => f.diceUsed).length;
  const coachUsedCount = fights.filter(f => f.coachUsed).length;
  const emergencyUsedCount = fights.filter(f => f.emergencyUsed).length;
  prompt += `Dice used: ${diceUsedCount}/${fights.length} fights\n`;
  prompt += `Coach used: ${coachUsedCount}/${fights.length} fights\n`;
  prompt += `Emergency used: ${emergencyUsedCount}/${fights.length} fights\n\n`;

  // Dice effects breakdown
  const diceEffects = {};
  fights.filter(f => f.diceUsed && f.diceEffect).forEach(f => {
    diceEffects[f.diceEffect] = (diceEffects[f.diceEffect] || 0) + 1;
  });
  if (Object.keys(diceEffects).length > 0) {
    prompt += `Dice effects: ${Object.entries(diceEffects).map(([e, c]) => `${e}(${c})`).join(', ')}\n`;
  }

  // Coach choices breakdown
  const coachChoices = {};
  fights.filter(f => f.coachUsed && f.coachChoice).forEach(f => {
    coachChoices[f.coachChoice] = (coachChoices[f.coachChoice] || 0) + 1;
  });
  if (Object.keys(coachChoices).length > 0) {
    prompt += `Coach choices: ${Object.entries(coachChoices).map(([c, n]) => `${c}(${n})`).join(', ')}\n`;
  }

  prompt += `\nFight details:\n`;
  fights.forEach((f, i) => {
    prompt += `#${i + 1}: ${f.result} | HP ${f.playerHP}vs${f.opponentHP} | ${f.rounds}rds`;
    prompt += ` | modules: ${(f.playerModules || []).join('+')}`;
    prompt += ` vs ${(f.opponentModules || []).join('+')}`;
    if (f.diceUsed) prompt += ` | dice:${f.diceEffect}`;
    if (f.coachUsed) prompt += ` | coach:${f.coachChoice}`;
    if (f.emergencyUsed) prompt += ` | emergency`;
    prompt += `\n`;
  });

  prompt += `\nLocale: ${locale || 'en'}`;
  return prompt;
}

router.post('/auto-fight-summary', authMiddleware, async (req, res) => {
  const startTime = Date.now();

  try {
    // Feature flag check
    if (!config.AI_TRAINER_ENABLED) {
      return res.status(503).json({ error: 'AI features are disabled' });
    }

    // API key check
    if (!config.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI service temporarily unavailable' });
    }

    // Rate limit check
    if (!checkAutoFightRateLimit(req.userId)) {
      return res.status(429).json({ error: 'Too many requests. Max 5 analyses per minute.' });
    }

    // Validate input
    const { fights, totalFights, period, locale } = req.body;

    if (!Array.isArray(fights) || fights.length < 1 || fights.length > 48) {
      return res.status(400).json({ error: 'fights must be an array with 1-48 entries' });
    }

    const VALID_PERIODS = ['last_5', 'last_10', 'all'];
    if (!VALID_PERIODS.includes(period)) {
      return res.status(400).json({ error: 'period must be last_5, last_10, or all' });
    }

    const VALID_RESULTS = ['win', 'loss', 'draw'];
    for (const fight of fights) {
      if (!fight.result || !VALID_RESULTS.includes(fight.result)) {
        return res.status(400).json({ error: 'Each fight must have a valid result (win, loss, draw)' });
      }
      if (fight.playerHP != null) {
        const hp = Number(fight.playerHP);
        if (isNaN(hp) || hp < 0 || hp > 100) {
          return res.status(400).json({ error: 'playerHP must be 0-100' });
        }
      }
      if (fight.opponentHP != null) {
        const hp = Number(fight.opponentHP);
        if (isNaN(hp) || hp < 0 || hp > 100) {
          return res.status(400).json({ error: 'opponentHP must be 0-100' });
        }
      }
    }

    const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';

    // Build prompt
    const userPrompt = buildAutoFightUserPrompt(fights, totalFights || fights.length, period, validLocale);

    // Call Claude API with AbortController timeout
    const client = getAnthropicClient();
    if (!client) {
      return res.status(503).json({ error: 'AI service temporarily unavailable' });
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 15000);

    try {
      const response = await client.messages.create({
        model: config.ANTHROPIC_MODEL,
        max_tokens: 400,
        temperature: 0.7,
        system: AUTO_FIGHT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }, { signal: abortController.signal });

      clearTimeout(timeout);

      const analysis = response.content[0].text;
      const elapsed = Date.now() - startTime;

      console.log(`[Auto Fight Summary] User ${req.userId} | ${fights.length} fights | ${period} | ${elapsed}ms`);

      return res.json({
        analysis,
        model: config.ANTHROPIC_MODEL,
        fightsAnalyzed: fights.length,
      });
    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[Auto Fight Summary] Error for user ${req.userId} (${elapsed}ms):`, error.message);

    if (error.name === 'AbortError') {
      return res.status(503).json({ error: 'Analysis timed out' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    return res.status(500).json({ error: 'Analysis failed' });
  }
});

// ── Build Description ────────────────────────────────────────────────────

const buildDescriptionCache = new Map();

const VALID_MODULES = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];
const SUPPORTED_LOCALES = ['en', 'ru', 'de', 'es', 'fr', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh'];
const LOCALE_NAMES = {
  en: 'English', ru: 'Russian', de: 'German', es: 'Spanish', fr: 'French',
  pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
};

const BUILD_DESCRIPTION_SYSTEM_PROMPT = `You are a fight narrator for Hexlash, an AI auto-battle game where players build fighters from behavioral modules.

The 6 modules and their personalities:
- Predator: Relentless aggression. Goes all-in under pressure. Never lets go.
- Sentinel: Iron wall. Counterattacks. Full defense when pressured.
- Ghost: Evasion and deception. Strikes from the shadows.
- Analyst: Reads patterns. Adapts. The most rational fighter.
- Maverick: Pure chaos. Unpredictable. Flashes of brilliance.
- Juggernaut: Unstoppable pressure. Never changes tactics.

The player selected 3 modules for their fighter. Describe the fighter's combat style.

Rules:
- Keep it very short — maximum 2 sentences, under 25 words total
- Tone: bold, confident, with attitude — like a ring announcer
- Do NOT mention module names directly (don't say "Predator module")
- Do NOT use quotation marks or titles
- Respond ONLY with the description text
- Respond in the language specified by the user

Examples of good length and tone (English):
- "A thinking machine wrapped in brute force. No escape once it locks on."
- "Pure chaos wrapped in muscle. No plan, no mercy."
- "Patience is a weapon here. Adapts, then ends it in two moves."`;

router.post('/build-description', authMiddleware, async (req, res) => {
  try {
    if (!config.AI_TRAINER_ENABLED) {
      return res.json({ description: null, error: 'AI features disabled' });
    }

    if (!config.ANTHROPIC_API_KEY) {
      return res.json({ description: null, error: 'AI service unavailable' });
    }

    if (!checkBuildDescRateLimit(req.userId)) {
      return res.json({ description: null, error: 'Too many requests' });
    }

    const { modules, locale } = req.body;

    // Validate modules
    if (!Array.isArray(modules) || modules.length !== 3 || !modules.every(m => VALID_MODULES.includes(m))) {
      return res.status(400).json({ description: null, error: 'Invalid modules' });
    }

    // Validate locale
    const lang = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';

    // Normalize: sort for consistent cache key
    const sorted = [...modules].sort();
    const cacheKey = `${sorted.join('_')}_${lang}`;

    // Check cache
    if (buildDescriptionCache.has(cacheKey)) {
      return res.json({ description: buildDescriptionCache.get(cacheKey), cached: true });
    }

    // Call Claude API
    const client = getAnthropicClient();
    if (!client) {
      return res.json({ description: null, error: 'AI service unavailable' });
    }
    const response = await client.messages.create({
      model: config.ANTHROPIC_MODEL,
      max_tokens: config.AI_BUILD_DESCRIPTION_MAX_TOKENS,
      temperature: 0.8,
      system: BUILD_DESCRIPTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Modules: ${sorted.join(', ')}\nLanguage: ${LOCALE_NAMES[lang]}` }],
    });

    const description = response.content[0].text;
    buildDescriptionCache.set(cacheKey, description);

    console.log(`[Build Description] ${cacheKey} | cache size: ${buildDescriptionCache.size}`);

    return res.json({ description, cached: false });

  } catch (error) {
    console.error(`[Build Description] Error:`, error.message);
    return res.json({ description: null, error: 'AI service unavailable' });
  }
});

module.exports = router;
