const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk').default;
const config = require('../config');
const { authMiddleware } = require('../middleware/auth');

// In-memory rate limiter (no external dependencies)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

const buildDescRateLimitMap = new Map();
const BUILD_DESC_RATE_LIMIT_MAX = 10; // 10 requests per minute

// ── Shared constants ────────────────────────────────────────────────────
const VALID_MODULES = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];
const SUPPORTED_LOCALES = ['en', 'ru', 'de', 'es', 'fr', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh'];
const LOCALE_NAMES = {
  en: 'English', ru: 'Russian', de: 'German', es: 'Spanish', fr: 'French',
  pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
};

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

const { gatherClanStats, buildMorningReportPrompt } = require('../services/morningReportService');

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
    const stats = await gatherClanStats(fightClub.id, period);

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
const { gatherMetaStats, getClanRanking } = require('../services/metaAnalysisService');
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
    const [stats, metaStats, clanRanking] = await Promise.all([
      gatherClanStats(fightClub.id, period),
      gatherMetaStats(),
      getClanRanking(fightClub.id),
    ]);

    if (stats.totalFights === 0) {
      return res.json({
        report: {
          period, generatedAt: new Date().toISOString(),
          stats: { totalFights: 0 }, meta: clanRanking, analysis: null,
        },
        payment: { txHash: req.paymentTxHash, verified: req.paymentVerified },
      });
    }

    const prompt = buildLv3Prompt('Fight Club', fightClub.level || 1, stats, metaStats, clanRanking);

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
          meta: clanRanking,
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
