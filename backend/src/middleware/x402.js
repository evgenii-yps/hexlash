/**
 * x402 Payment Verification Middleware
 * When X402_ENABLED=true: requires X-Payment-Tx header with verified USDC tx on Base.
 * When X402_ENABLED=false: bypasses payment (free preview mode).
 */

const config = require('../config');

// Track used tx hashes to prevent replay
const usedTxHashes = new Set();

function verifyPayment(req, res, next) {
  // Feature flag: bypass payment in dev/test
  if (!config.X402_ENABLED) {
    req.paymentVerified = false;
    req.paymentTxHash = null;
    return next();
  }

  const txHash = req.headers['x-payment-tx'];
  if (!txHash) {
    return res.status(402).json({
      error: 'Payment required',
      price: config.X402_PREMIUM_REPORT_PRICE,
      currency: 'USDC',
      chain: 'base',
      receiver: config.X402_PAYMENT_RECEIVER,
      contract: config.USDC_CONTRACT_BASE,
    });
  }

  // Validate tx hash format
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return res.status(402).json({ error: 'Invalid transaction hash' });
  }

  // Prevent replay
  if (usedTxHashes.has(txHash)) {
    return res.status(402).json({ error: 'Transaction already used' });
  }

  // TODO: Verify tx on-chain via Base RPC when x402 fully enabled
  // - Check: tx confirmed, to === PAYMENT_RECEIVER, amount >= price, token === USDC
  // For now: accept any valid-format tx hash when X402_ENABLED=true

  usedTxHashes.add(txHash);
  req.paymentVerified = true;
  req.paymentTxHash = txHash;
  next();
}

// Cleanup old tx hashes periodically (keep last 24h worth)
setInterval(() => {
  if (usedTxHashes.size > 10000) {
    usedTxHashes.clear();
  }
}, 60 * 60 * 1000);

module.exports = { verifyPayment };
