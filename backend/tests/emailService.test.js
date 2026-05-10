/**
 * emailService.test.js — unit tests for Resend wrapper.
 *
 * Mock strategy: dependency injection via __setClient hook. emailService
 * exports __setClient(mockClient) — replaces internal lazy-instantiated
 * Resend client with mock. Each test sets a fresh mock + asserts call shape
 * + return shape.
 *
 * Mirrors backend test convention (node:test + node:assert/strict per
 * helpers.test.js + dailyTaskService.test.js precedent — Lesson #32
 * convention discovery from Sub-epic 5K).
 *
 * Email Auth Phase 2.
 */

// Set required env vars BEFORE requiring emailService.
// emailService.js reads env lazily at first send, so we set defaults here
// so getFromAddress() / getAppUrl() don't throw.
process.env.EMAIL_FROM_DOMAIN = process.env.EMAIL_FROM_DOMAIN || 'test.example.com';
process.env.APP_URL = process.env.APP_URL || 'https://test.example.com';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test-key';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  sendVerifyEmail,
  sendResetEmail,
  __setClient,
} = require('../src/services/emailService');

// ── Mock factories ─────────────────────────────────────────────────────────

function makeSuccessMock(idValue = 'resend-id-123') {
  return {
    emails: {
      send: async () => ({ data: { id: idValue }, error: null }),
    },
    _capturedPayload: null,
  };
}

function makeErrorMock(errorValue = { name: 'validation_error', message: 'bad request' }) {
  return {
    emails: {
      send: async () => ({ data: null, error: errorValue }),
    },
  };
}

function makeThrowMock(errMessage = 'network unreachable') {
  return {
    emails: {
      send: async () => { throw new Error(errMessage); },
    },
  };
}

// Mock that captures the payload Resend would receive
function makeCapturingMock(idValue = 'captured-id') {
  const captured = { payload: null };
  return {
    client: {
      emails: {
        send: async (payload) => {
          captured.payload = payload;
          return { data: { id: idValue }, error: null };
        },
      },
    },
    captured,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('emailService.sendVerifyEmail', () => {
  beforeEach(() => __setClient(null)); // reset before each test

  it('calls Resend with correct from / to / subject / html / text payload', async () => {
    const { client, captured } = makeCapturingMock();
    __setClient(client);

    await sendVerifyEmail('user@example.com', 'tok-abc');

    assert.ok(captured.payload, 'payload was captured');
    assert.equal(captured.payload.from, 'Hexlash <noreply@test.example.com>');
    assert.equal(captured.payload.to, 'user@example.com');
    assert.equal(captured.payload.subject, 'Verify your Hexlash email');
    assert.match(captured.payload.html, /Verify your email/);
    assert.match(captured.payload.html, /https:\/\/test\.example\.com\/verify-email\?token=tok-abc/);
    assert.match(captured.payload.text, /Verify your email: https:\/\/test\.example\.com\/verify-email\?token=tok-abc/);
    assert.match(captured.payload.text, /24 hours/);
  });

  it('returns { ok: true, id } on Resend success', async () => {
    __setClient(makeSuccessMock('id-success'));
    const result = await sendVerifyEmail('user@example.com', 'tok-1');
    assert.deepEqual(result, { ok: true, id: 'id-success' });
  });

  it('returns { ok: false, error } when Resend responds with error (no throw)', async () => {
    const errorObj = { name: 'rate_limited', message: 'too many' };
    __setClient(makeErrorMock(errorObj));
    const result = await sendVerifyEmail('user@example.com', 'tok-2');
    assert.equal(result.ok, false);
    assert.deepEqual(result.error, errorObj);
  });

  it('returns { ok: false, error } when Resend throws exception (no propagation)', async () => {
    __setClient(makeThrowMock('connection refused'));
    const result = await sendVerifyEmail('user@example.com', 'tok-3');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'connection refused');
  });

  it('URL-encodes the token in the link', async () => {
    const { client, captured } = makeCapturingMock();
    __setClient(client);

    await sendVerifyEmail('user@example.com', 'tok with spaces+&');

    assert.match(captured.payload.html, /token=tok%20with%20spaces%2B%26/);
    assert.match(captured.payload.text, /token=tok%20with%20spaces%2B%26/);
  });
});

describe('emailService.sendResetEmail', () => {
  beforeEach(() => __setClient(null));

  it('calls Resend with correct from / to / subject / html / text payload', async () => {
    const { client, captured } = makeCapturingMock();
    __setClient(client);

    await sendResetEmail('user@example.com', 'reset-tok-xyz');

    assert.ok(captured.payload);
    assert.equal(captured.payload.from, 'Hexlash <noreply@test.example.com>');
    assert.equal(captured.payload.to, 'user@example.com');
    assert.equal(captured.payload.subject, 'Reset your Hexlash password');
    assert.match(captured.payload.html, /Reset your password/);
    assert.match(captured.payload.html, /https:\/\/test\.example\.com\/reset-password\?token=reset-tok-xyz/);
    assert.match(captured.payload.text, /1 hour/);
    assert.match(captured.payload.text, /If you didn't request this/);
  });

  it('returns { ok: true, id } on Resend success', async () => {
    __setClient(makeSuccessMock('reset-id-success'));
    const result = await sendResetEmail('user@example.com', 'tok-1');
    assert.deepEqual(result, { ok: true, id: 'reset-id-success' });
  });

  it('returns { ok: false, error } when Resend responds with error (no throw)', async () => {
    const errorObj = { name: 'validation', message: 'invalid email' };
    __setClient(makeErrorMock(errorObj));
    const result = await sendResetEmail('bad-email', 'tok-2');
    assert.equal(result.ok, false);
    assert.deepEqual(result.error, errorObj);
  });

  it('returns { ok: false, error } when Resend throws exception', async () => {
    __setClient(makeThrowMock('timeout'));
    const result = await sendResetEmail('user@example.com', 'tok-3');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'timeout');
  });
});

describe('emailService URL handling', () => {
  beforeEach(() => __setClient(null));

  it('strips trailing slash from APP_URL', async () => {
    const orig = process.env.APP_URL;
    process.env.APP_URL = 'https://test.example.com///';
    try {
      const { client, captured } = makeCapturingMock();
      __setClient(client);
      await sendVerifyEmail('user@example.com', 'tok-1');
      assert.match(captured.payload.html, /https:\/\/test\.example\.com\/verify-email\?token=tok-1/);
      assert.doesNotMatch(captured.payload.html, /\.com\/{2,}verify-email/);
    } finally {
      process.env.APP_URL = orig;
    }
  });
});
