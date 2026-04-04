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

// ── Shared constants ────────────────────────────────────────────────────
const VALID_MODULES = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];
const SUPPORTED_LOCALES = ['en', 'ru', 'de', 'es', 'fr', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh'];
const LOCALE_NAMES = {
  en: 'English', ru: 'Russian', de: 'German', es: 'Spanish', fr: 'French',
  pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
};

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

    // Call Claude API with AbortController timeout
    const client = getAnthropicClient();
    if (!client) {
      return res.status(503).json({ error: 'AI Trainer temporarily unavailable' });
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 15000);

    try {
      const response = await client.messages.create({
        model: config.ANTHROPIC_MODEL,
        max_tokens: config.AI_TRAINER_MAX_TOKENS,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }, { signal: abortController.signal });

      clearTimeout(timeout);

      const analysis = response.content?.[0]?.text;
      if (!analysis) {
        return res.status(502).json({ error: 'Empty response from AI' });
      }
      const elapsed = Date.now() - startTime;

      return res.json({
        analysis,
        model: config.ANTHROPIC_MODEL,
      });
    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[AI Trainer] Error for user ${req.userId} (${elapsed}ms):`, error.message);

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

    // Call Claude API with AbortController timeout
    const client = getAnthropicClient();
    if (!client) {
      return res.json({ description: null, error: 'AI service unavailable' });
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 10000);

    try {
      const response = await client.messages.create({
        model: config.ANTHROPIC_MODEL,
        max_tokens: config.AI_BUILD_DESCRIPTION_MAX_TOKENS,
        temperature: 0.8,
        system: BUILD_DESCRIPTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Modules: ${sorted.join(', ')}\nLanguage: ${LOCALE_NAMES[lang]}` }],
      }, { signal: abortController.signal });

      clearTimeout(timeout);

      const description = response.content?.[0]?.text;
      if (!description) {
        return res.json({ description: null, error: 'Empty response from AI' });
      }
      buildDescriptionCache.set(cacheKey, description);

      return res.json({ description, cached: false });
    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    console.error(`[Build Description] Error:`, error.message);
    return res.json({ description: null, error: 'AI service unavailable' });
  }
});

// ── Morning Report ────────────────────────────────────────────────────

const morningReportRateLimitMap = new Map();
const MORNING_REPORT_RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MORNING_REPORT_RATE_LIMIT_MAX = 3;
const morningReportCache = new Map();
const MORNING_REPORT_CACHE_TTL = 30 * 60 * 1000; // 30 min

function checkMorningReportRateLimit(userId) {
  const now = Date.now();
  const reqs = (morningReportRateLimitMap.get(userId) || []).filter(ts => now - ts < MORNING_REPORT_RATE_LIMIT_WINDOW);
  if (reqs.length >= MORNING_REPORT_RATE_LIMIT_MAX) { morningReportRateLimitMap.set(userId, reqs); return false; }
  reqs.push(now);
  morningReportRateLimitMap.set(userId, reqs);
  return true;
}

const { gatherClubStats, buildMorningReportPrompt } = require('../services/morningReportService');

router.post('/morning-report', authMiddleware, async (req, res) => {
  try {
    if (!config.AI_TRAINER_ENABLED || !config.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI analysis unavailable' });
    }

    if (!checkMorningReportRateLimit(req.userId)) {
      return res.status(429).json({ error: 'Too many requests. Max 3 reports per hour.' });
    }

    const prisma = require('../lib/prisma');
    const { getOrCreateFightClub } = require('../services/fightClubService');
    const fightClub = await getOrCreateFightClub(req.userId);

    const { period = 'today' } = req.body;
    const VALID_PERIODS = ['today', 'yesterday', 'last_7d'];
    if (!VALID_PERIODS.includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    // Check cache
    const dateKey = new Date().toISOString().slice(0, 13);
    const cacheKey = `${fightClub.id}:${period}:${dateKey}`;
    const cached = morningReportCache.get(cacheKey);
    if (cached && Date.now() - cached.generatedAt < MORNING_REPORT_CACHE_TTL) {
      return res.json({ report: cached.report, cached: true });
    }

    // Gather stats
    const stats = await gatherClubStats(fightClub.id, period);

    if (stats.totalFights === 0) {
      return res.json({
        report: {
          period,
          generatedAt: new Date().toISOString(),
          stats: { totalFights: 0, wins: 0, losses: 0, draws: 0, winRate: 0, bestAgent: null, worstAgent: null, totalXpEarned: 0, agentStats: [] },
          analysis: null,
        },
      });
    }

    // Get fight club info
    const prompt = buildMorningReportPrompt('Fight Club', fightClub.level || 1, stats);

    // Dynamic max_tokens based on agent count
    const activeAgents = stats.agentStats.filter(a => a.fights > 0).length;
    const maxTokens = Math.min(400 + activeAgents * 150, 1200);

    // Call Claude
    const client = getAnthropicClient();
    if (!client) return res.status(503).json({ error: 'AI service unavailable' });

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 15000);

    try {
      const response = await client.messages.create({
        model: config.ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }, { signal: abortController.signal });
      clearTimeout(timeout);

      const rawText = response.content?.[0]?.text || '';
      let analysis = null;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
      } catch {
        analysis = { summary: rawText, highlights: '', concerns: '', recommendation: '', agents: [] };
      }
      if (analysis && !analysis.agents) analysis.agents = [];

      const report = {
        period,
        generatedAt: new Date().toISOString(),
        stats: {
          totalFights: stats.totalFights,
          wins: stats.wins,
          losses: stats.losses,
          draws: stats.draws,
          winRate: stats.winRate,
          bestAgent: stats.bestAgent ? { name: stats.bestAgent.name, winRate: stats.bestAgent.winRate, fights: stats.bestAgent.fights } : null,
          worstAgent: stats.worstAgent ? { name: stats.worstAgent.name, winRate: stats.worstAgent.winRate, fights: stats.worstAgent.fights } : null,
          totalXpEarned: stats.totalXpEarned,
          agentStats: stats.agentStats.map(a => ({
            agentId: a.agentId, name: a.name, skin: a.skin, elo: a.elo, eloChange: a.eloChange,
            fights: a.fights, wins: a.wins, losses: a.losses, draws: a.draws, winRate: a.winRate,
            recentResults: a.recentResults,
          })),
        },
        analysis,
      };

      morningReportCache.set(cacheKey, { report, generatedAt: Date.now() });
      return res.json({ report, cached: false });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('[Morning Report] Error:', error.message);
    if (error.name === 'AbortError') return res.status(503).json({ error: 'Analysis timed out' });
    return res.status(500).json({ error: 'Report generation failed' });
  }
});

// ── Premium Report (Lv3) ─────────────────────────────────────────────

const { verifyPayment } = require('../middleware/x402');
const { gatherMetaStats, getClubRanking } = require('../services/metaAnalysisService');
const { buildLv3Prompt } = require('../services/morningReportService');

const premiumRateLimitMap = new Map();
const PREMIUM_RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function checkPremiumRateLimit(userId) {
  const now = Date.now();
  const reqs = (premiumRateLimitMap.get(userId) || []).filter(ts => now - ts < PREMIUM_RATE_LIMIT_WINDOW);
  if (reqs.length >= config.PREMIUM_REPORT_RATE_LIMIT) { premiumRateLimitMap.set(userId, reqs); return false; }
  reqs.push(now);
  premiumRateLimitMap.set(userId, reqs);
  return true;
}

router.post('/premium-report', authMiddleware, verifyPayment, async (req, res) => {
  try {
    if (!config.AI_TRAINER_ENABLED || !config.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI analysis unavailable' });
    }

    if (!checkPremiumRateLimit(req.userId)) {
      return res.status(429).json({ error: 'Rate limit: max 10 premium reports per day' });
    }

    const { getOrCreateFightClub: getOrCreateFC } = require('../services/fightClubService');
    const fightClub = await getOrCreateFC(req.userId);

    const { period = 'today' } = req.body;
    const VALID_PERIODS = ['today', 'yesterday', 'last_7d'];
    if (!VALID_PERIODS.includes(period)) return res.status(400).json({ error: 'Invalid period' });

    // Gather all data
    const [stats, metaStats, clubRanking] = await Promise.all([
      gatherClubStats(fightClub.id, period),
      gatherMetaStats(),
      getClubRanking(fightClub.id),
    ]);

    if (stats.totalFights === 0) {
      return res.json({
        report: {
          period, generatedAt: new Date().toISOString(),
          stats: { totalFights: 0 }, meta: clubRanking, analysis: null,
        },
        payment: { txHash: req.paymentTxHash, verified: req.paymentVerified },
      });
    }

    const prompt = buildLv3Prompt('Fight Club', fightClub.level || 1, stats, metaStats, clubRanking);

    const client = getAnthropicClient();
    if (!client) return res.status(503).json({ error: 'AI service unavailable' });

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 25000);

    try {
      const response = await client.messages.create({
        model: config.ANTHROPIC_MODEL,
        max_tokens: config.PREMIUM_REPORT_MAX_TOKENS,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }, { signal: abortController.signal });
      clearTimeout(timeout);

      const rawText = response.content?.[0]?.text || '';
      let analysis = null;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
      } catch {
        analysis = { metaSummary: rawText, agents: [], trainingPlan: '', forecast: '' };
      }
      if (analysis && !analysis.agents) analysis.agents = [];

      return res.json({
        report: {
          period,
          generatedAt: new Date().toISOString(),
          stats: {
            totalFights: stats.totalFights, wins: stats.wins, losses: stats.losses, draws: stats.draws, winRate: stats.winRate,
            totalXpEarned: stats.totalXpEarned,
            agentStats: stats.agentStats.map(a => ({
              agentId: a.agentId, name: a.name, skin: a.skin, elo: a.elo, eloChange: a.eloChange,
              fights: a.fights, wins: a.wins, losses: a.losses, winRate: a.winRate,
            })),
          },
          meta: clubRanking,
          analysis,
        },
        payment: { txHash: req.paymentTxHash, verified: req.paymentVerified },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('[Premium Report] Error:', error.message);
    if (error.name === 'AbortError') return res.status(503).json({ error: 'Analysis timed out' });
    return res.status(500).json({ error: 'Report generation failed' });
  }
});

// Cleanup rate limit Maps every 5 minutes to prevent memory leaks
// Placed after all Map declarations to avoid referencing before initialization
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
  for (const [userId, timestamps] of morningReportRateLimitMap) {
    const recent = timestamps.filter(ts => now - ts < MORNING_REPORT_RATE_LIMIT_WINDOW);
    if (recent.length === 0) morningReportRateLimitMap.delete(userId);
    else morningReportRateLimitMap.set(userId, recent);
  }
  // Clean stale report cache
  for (const [key, entry] of morningReportCache) {
    if (Date.now() - entry.generatedAt > MORNING_REPORT_CACHE_TTL) morningReportCache.delete(key);
  }
  for (const [userId, timestamps] of premiumRateLimitMap) {
    const recent = timestamps.filter(ts => now - ts < PREMIUM_RATE_LIMIT_WINDOW);
    if (recent.length === 0) premiumRateLimitMap.delete(userId);
    else premiumRateLimitMap.set(userId, recent);
  }
}, 5 * 60 * 1000);

module.exports = router;
