require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Server cannot start without it.');
}

module.exports = {
  PORT: parseInt(process.env.PORT || '3000'),
  WS_PORT: parseInt(process.env.WS_PORT || '444'),
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  DECIMALS: 6,
  COST_PER_CLICK: 2,
  COST_CREATE_CLUB: 10000,
  PUNCH_MAX_PER_INTERVAL: 10000,
  PUNCH_MAX_PER_BATCH: 10000,
  PUNCH_INTERVAL_MS: 3600000, // 1 hour

  // Referral
  REFERRAL_REWARD_TAPS: 500,

  // PvP Combat
  MAX_HP: 100,
  MAX_ROUNDS: 10,
  EXTRA_ROUNDS: 2,
  EXTRA_ROUND_DAMAGE_MULTIPLIER: 2,
  TOTAL_ROUNDS: 12,
  MAX_DECK_SIZE: 8,
  MIN_DECK_SIZE: 4,
  MIN_PVP_DECK_SIZE: 3,     // PvP allows starter deck (3 moves), PvE DeckBuilder enforces 4
  COUNTDOWN_MS: 3000,
  ROUND_ANIMATION_MS: 1500,
  BASE_DAMAGE: 15,
  POSITION_BONUS: 5,
  DICE_COOLDOWN_ROUNDS: 3,
  DICE_PAUSE_TIMEOUT_MS: 10000,
  EMERGENCY_HP_THRESHOLD: 30,
  COACH_MIN_ROUND: 6,
  COACH_BOOST_ROUNDS: 4,
  COACH_PAUSE_TIMEOUT_MS: 10000,

  // WebSocket
  WS_PING_INTERVAL_MS: 30000,    // server ping every 30s
  WS_PONG_TIMEOUT_MS: 10000,     // kill connection if no pong in 10s
  PVP_READY_TIMEOUT_MS: 15000,   // cancel match if player not ready in 15s

  // PvP Archetype Modifiers (passive bonuses per archetype)
  SLOT_WEIGHTS: [0.5, 0.3, 0.2],
  ARCHETYPE_MODIFIERS: {
    predator:   { dmgBonus: 0.10, incomingReduction: 0,    dodgeChance: 0,    critChance: 0.08, critMult: 1.5 },
    sentinel:   { dmgBonus: 0,    incomingReduction: 0.15, dodgeChance: 0,    critChance: 0,    critMult: 1.0 },
    ghost:      { dmgBonus: 0,    incomingReduction: 0,    dodgeChance: 0.08, critChance: 0,    critMult: 1.0 },
    analyst:    { dmgBonus: 0.05, incomingReduction: 0.05, dodgeChance: 0.02, critChance: 0.02, critMult: 1.3 },
    maverick:   { dmgBonus: 0,    incomingReduction: 0,    dodgeChance: 0.04, critChance: 0.04, critMult: 1.5, randomRange: 0.10 },
    juggernaut: { dmgBonus: 0.08, incomingReduction: 0,    dodgeChance: 0,    critChance: 0.03, critMult: 1.5 },
  },

  // Clan Level System
  CLAN_LEVEL_CONFIG: {
    1:  { xpRequired: 0,      maxMembers: 20, maxAgents: 2, xpBonus: 0 },
    2:  { xpRequired: 1000,   maxMembers: 20, maxAgents: 3, xpBonus: 0 },
    3:  { xpRequired: 3000,   maxMembers: 25, maxAgents: 4, xpBonus: 0 },
    4:  { xpRequired: 6000,   maxMembers: 25, maxAgents: 5, xpBonus: 5 },
    5:  { xpRequired: 10000,  maxMembers: 30, maxAgents: 6, xpBonus: 10 },
    6:  { xpRequired: 20000,  maxMembers: 30, maxAgents: 6, xpBonus: 10 },
    7:  { xpRequired: 35000,  maxMembers: 40, maxAgents: 6, xpBonus: 15 },
    8:  { xpRequired: 55000,  maxMembers: 40, maxAgents: 6, xpBonus: 15 },
    9:  { xpRequired: 80000,  maxMembers: 45, maxAgents: 6, xpBonus: 20 },
    10: { xpRequired: 120000, maxMembers: 50, maxAgents: 6, xpBonus: 20 },
  },
  CLAN_TAP_SHARE: 0.05, // 5% of member taps go to clan treasury
  CLAN_XP_REWARDS: {
    win: 10,
    draw: 5,
    lose: 3,
    agent_win: 10,
    agent_draw: 5,
    agent_lose: 2,
    agent_ranked_win: 20,
    agent_ranked_draw: 10,
    agent_ranked_lose: 5,
  },

  // Agent Scheduler
  AGENT_SCHEDULER_TICK_MS: 30000,       // 30 seconds
  AGENT_MAX_FIGHTS_PER_TICK: 10,
  AGENT_MAX_FIGHTS_PER_DAY: 50,
  AGENT_STUCK_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes

  // ELO System
  ELO_K_FACTOR: 32,
  ELO_MIN: 100,
  ELO_MAX: 3000,
  ELO_MATCH_RANGE: 200,

  // Ranked
  RANKED_REMATCH_COOLDOWN: 5,
  RANKED_MAX_PAIRS_PER_TICK: 5,
  RANKED_MIN_FIGHTS_FOR_RANKING: 5,
  FREE_ARENA_MAX_PAIRS_PER_TICK: 5,

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_AUTH_MAX_AGE_SEC: 300, // 5 minutes

  // AI Trainer
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: 'claude-haiku-4-5-20251001',
  AI_TRAINER_MAX_TOKENS: 300,
  AI_BUILD_DESCRIPTION_MAX_TOKENS: parseInt(process.env.AI_BUILD_DESCRIPTION_MAX_TOKENS) || 60,
  AI_TRAINER_ENABLED: process.env.AI_TRAINER_ENABLED !== 'false',

  // Premium Report (Lv3)
  PREMIUM_REPORT_MAX_TOKENS: 2000,
  PREMIUM_REPORT_RATE_LIMIT: 10,
  X402_ENABLED: process.env.X402_ENABLED === 'true',
  X402_PREMIUM_REPORT_PRICE: 20000, // 0.02 USDC (6 decimals)
  X402_PAYMENT_RECEIVER: process.env.PAYMENT_RECEIVER_ADDRESS || '',
  USDC_CONTRACT_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',

  // NFT Minting
  NFT_MINTING_ENABLED: process.env.NFT_MINTING_ENABLED === 'true',
  AGENT_NFT_CONTRACT: process.env.AGENT_NFT_CONTRACT || '',
  BASE_RPC_URL: process.env.BASE_RPC_URL || 'https://mainnet.base.org',

  // Migration
  MIGRATION_ENABLED: process.env.MIGRATION_ENABLED !== 'false', // default true, set 'false' to disable
};
