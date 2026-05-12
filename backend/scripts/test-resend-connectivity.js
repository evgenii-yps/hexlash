/**
 * TODO(remove-before-phase-7): one-off Resend connectivity test script.
 *
 * Verifies end-to-end pipeline: env vars → Resend SDK → API auth → DKIM/SPF/
 * deliverability for the verified `hexlash.com` domain → recipient inbox.
 *
 * Usage (run locally, never on Railway/prod):
 *
 *   cd backend
 *   RESEND_API_KEY="re_<your-key>" \
 *   EMAIL_FROM_DOMAIN="hexlash.com" \
 *   APP_URL="https://www.hexlash.com" \
 *     node scripts/test-resend-connectivity.js your.personal@email.com
 *
 * Sends a fake verify-email to the provided address. Expected outcome:
 * - Console prints `Result: { ok: true, id: '<uuid>' }` within 2-3 seconds
 * - Recipient inbox receives "Verify your Hexlash email" with rendered HTML
 * - Resend dashboard → Logs tab shows the send event (delivered/bounced/etc)
 *
 * If `ok: false` → check `error` field for cause:
 *   - "validation_error" → domain not verified in Resend OR bad FROM address
 *   - "missing_api_key" → env var not exported in shell
 *   - "rate_limit_exceeded" → free tier 100/day cap (unlikely on first run)
 *   - network error → corporate proxy / VPN / DNS issue
 *
 * REMOVE THIS FILE before Phase 7 final report — it's a development artifact,
 * not production code. Test infrastructure for emailService is in
 * tests/emailService.test.js (mock-based, no real API calls).
 */

require('dotenv').config();

const { sendVerifyEmail } = require('../src/services/emailService');

async function main() {
  const targetEmail = process.argv[2];
  if (!targetEmail) {
    console.error('Usage: node scripts/test-resend-connectivity.js <your-email>');
    console.error('');
    console.error('Required env vars:');
    console.error('  RESEND_API_KEY      from Resend dashboard');
    console.error('  EMAIL_FROM_DOMAIN   verified domain (e.g. hexlash.com)');
    console.error('  APP_URL             public app URL (e.g. https://www.hexlash.com)');
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY env var not set');
    process.exit(1);
  }
  if (!process.env.EMAIL_FROM_DOMAIN) {
    console.error('ERROR: EMAIL_FROM_DOMAIN env var not set');
    process.exit(1);
  }
  if (!process.env.APP_URL) {
    console.error('ERROR: APP_URL env var not set');
    process.exit(1);
  }

  console.log(`Sending test verify-email to: ${targetEmail}`);
  console.log(`From: noreply@${process.env.EMAIL_FROM_DOMAIN}`);
  console.log(`App URL: ${process.env.APP_URL}`);
  console.log('');

  const fakeToken = 'test-token-' + Date.now();
  const result = await sendVerifyEmail(targetEmail, fakeToken);

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.ok) {
    console.log('');
    console.log('✅ Resend infrastructure connected. Check your inbox in 1-2 minutes.');
    console.log(`   Resend dashboard → Logs tab will show this send (id: ${result.id})`);
    process.exit(0);
  } else {
    console.log('');
    console.log('❌ Send failed. Check error above.');
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Unexpected exception:', err);
  process.exit(1);
});
