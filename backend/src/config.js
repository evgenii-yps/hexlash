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

  // PvP Combat
  MAX_HP: 100,
  MAX_ROUNDS: 10,
  EXTRA_ROUNDS: 2,
  EXTRA_ROUND_DAMAGE_MULTIPLIER: 2,
  TOTAL_ROUNDS: 12,
  MAX_DECK_SIZE: 8,
  MIN_DECK_SIZE: 4,
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

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_AUTH_MAX_AGE_SEC: 300, // 5 minutes

  // AI Trainer
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: 'claude-haiku-4-5-20251001',
  AI_TRAINER_MAX_TOKENS: 300,
  AI_BUILD_DESCRIPTION_MAX_TOKENS: parseInt(process.env.AI_BUILD_DESCRIPTION_MAX_TOKENS) || 60,
  AI_TRAINER_ENABLED: process.env.AI_TRAINER_ENABLED !== 'false',
};
