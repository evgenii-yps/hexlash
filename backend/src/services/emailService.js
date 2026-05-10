/**
 * Email service — wrapper around Resend SDK.
 *
 * Email Auth Phase 2. Vendor-agnostic-ish interface so future provider swap
 * (Postmark / SES / SMTP) is single-file. Caller (auth.js / user.js) gets
 * `{ ok: boolean, error?: any, id?: string }` and decides next action.
 *
 * IMPORTANT: sendVerifyEmail / sendResetEmail NEVER throw. Failures are
 * logged + returned as `{ ok: false, error }`. Caller code (e.g. register
 * endpoint) MUST NOT block user-facing flow on email send failure — user
 * gets account, retries via /v1/user/resend-verification.
 *
 * Resend client is lazily instantiated (factory pattern) so:
 * 1. Tests can inject a mock client via `__setClient` exported below.
 * 2. RESEND_API_KEY env var is read at first send, not at module load
 *    (boot of unrelated routes doesn't fail if env missing during dev).
 *
 * Required env vars:
 *   - RESEND_API_KEY      — from Resend dashboard
 *   - EMAIL_FROM_DOMAIN   — e.g. "hexlash.com" (verified in Resend)
 *   - APP_URL             — e.g. "https://www.hexlash.com" (no trailing slash)
 */

const { Resend } = require('resend');
const { verifyEmailTemplate } = require('./templates/verifyEmail');
const { resetPasswordTemplate } = require('./templates/resetPassword');

// Lazy-instantiated Resend client. Tests inject a mock via __setClient.
let _client = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('[emailService] RESEND_API_KEY env var is required');
  }
  _client = new Resend(apiKey);
  return _client;
}

function getFromAddress() {
  const domain = process.env.EMAIL_FROM_DOMAIN;
  if (!domain) {
    throw new Error('[emailService] EMAIL_FROM_DOMAIN env var is required');
  }
  return `Hexlash <noreply@${domain}>`;
}

function getAppUrl() {
  const url = process.env.APP_URL;
  if (!url) {
    throw new Error('[emailService] APP_URL env var is required');
  }
  return url.replace(/\/+$/, ''); // strip trailing slashes
}

async function sendVerifyEmail(toEmail, token) {
  const url = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  try {
    const { data, error } = await getClient().emails.send({
      from: getFromAddress(),
      to: toEmail,
      subject: 'Verify your Hexlash email',
      html: verifyEmailTemplate({ url }),
      text: `Verify your email: ${url}\n\nThis link expires in 24 hours.`,
    });
    if (error) {
      console.error('[emailService] sendVerifyEmail failed:', error);
      return { ok: false, error };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('[emailService] sendVerifyEmail exception:', err.message);
    return { ok: false, error: err.message };
  }
}

async function sendResetEmail(toEmail, token) {
  const url = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  try {
    const { data, error } = await getClient().emails.send({
      from: getFromAddress(),
      to: toEmail,
      subject: 'Reset your Hexlash password',
      html: resetPasswordTemplate({ url }),
      text: `Reset your password: ${url}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });
    if (error) {
      console.error('[emailService] sendResetEmail failed:', error);
      return { ok: false, error };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('[emailService] sendResetEmail exception:', err.message);
    return { ok: false, error: err.message };
  }
}

// Test-only injection hook — sets the internal Resend client to a mock.
// Pass null to reset to lazy real instantiation.
function __setClient(mockClient) {
  _client = mockClient;
}

module.exports = {
  sendVerifyEmail,
  sendResetEmail,
  __setClient,
};
