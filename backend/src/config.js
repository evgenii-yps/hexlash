require('dotenv').config();

module.exports = {
  PORT: parseInt(process.env.PORT || '3000'),
  WS_PORT: parseInt(process.env.WS_PORT || '444'),
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  DECIMALS: 6,
  COST_PER_CLICK: 2,
  COST_CREATE_CLUB: 10000,
  PUNCH_MAX_PER_INTERVAL: 10000,
  PUNCH_MAX_PER_BATCH: 10000,
  PUNCH_INTERVAL_MS: 3600000, // 1 hour
};
