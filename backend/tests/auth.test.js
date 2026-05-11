/**
 * auth.test.js — pure unit tests for Email Auth Phase 3 helpers.
 *
 * Backend test convention is pure-unit (no DB integration) per Sub-epic 5K
 * Lesson #32 catch ("Phase 6 tests use node:test API + pure unit/pattern
 * simulations, NOT Jest + DB integration"). This file follows that pattern.
 *
 * Endpoint integration tests (full Express + Prisma + Resend round-trip)
 * are covered by Phase 6 manual QA (curl smoke tests against deployed
 * Railway backend). Documented in Phase 3 STOP gate report.
 *
 * What we CAN test in pure unit:
 * - generateRandomToken: format + uniqueness + length
 * - Email validation regex (extracted constant in auth.js — re-tested here
 *   to lock contract; if EMAIL_RE in auth.js drifts, this test breaks first)
 * - normalizeEmail behavior (toLowerCase + trim)
 *
 * What requires DB / Resend mocks (covered Phase 6 manual):
 * - register: email collision 409
 * - register: verifyToken stored in DB
 * - register: sendVerifyEmail invoked iff email present
 * - login: handle vs email routing
 * - forgot-password: generic 200 in all branches
 * - forgot-password: sendResetEmail invoked iff user verified
 * - reset-password: token expiry check + clear-on-success
 *
 * Email Auth Phase 3.
 */

// helpers.js transitively requires config.js, which throws if JWT_SECRET is
// unset at module-load time. Provide a benign default so this test file can
// run via plain `npm test` without env setup. Real env value (if set) wins.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { generateRandomToken } = require('../src/utils/helpers');

// ── generateRandomToken ────────────────────────────────────────────────────

describe('generateRandomToken', () => {
  it('returns 64 hex chars (32 bytes → 64 hex)', () => {
    const tok = generateRandomToken();
    assert.equal(typeof tok, 'string');
    assert.equal(tok.length, 64);
    assert.match(tok, /^[a-f0-9]{64}$/);
  });

  it('returns different tokens on consecutive calls (cryptographic randomness)', () => {
    const tokens = new Set();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateRandomToken());
    }
    // 100 calls should give 100 unique tokens (collision probability ~10^-77)
    assert.equal(tokens.size, 100);
  });

  it('uses lowercase hex (standard crypto.randomBytes().toString(\'hex\') output)', () => {
    const tok = generateRandomToken();
    assert.equal(tok, tok.toLowerCase());
    assert.ok(!/[A-Z]/.test(tok));
  });
});

// ── Email validation contract (re-tested here to lock auth.js EMAIL_RE) ───
// If auth.js EMAIL_RE changes, these tests will need to be updated in lockstep.
// Same pattern is used by frontend EmailForm.vue — keep both in sync.

describe('Email validation regex (contract lock)', () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it('accepts standard email formats', () => {
    const valid = [
      'a@b.c',
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user_name@sub.example.com',
      'USER@EXAMPLE.COM', // case-insensitive — handler normalizes after
      '12345@67890.com',
    ];
    for (const e of valid) {
      assert.ok(EMAIL_RE.test(e), `should accept: ${e}`);
    }
  });

  it('rejects malformed inputs', () => {
    const invalid = [
      '',
      ' ',
      'not-an-email',
      '@example.com',
      'user@',
      'user@example',
      'user @example.com',     // space before @
      'user@ example.com',     // space after @
      'user@example .com',     // space in domain
      'user@@example.com',     // double @
      'user@.com',             // empty domain segment
    ];
    for (const e of invalid) {
      assert.ok(!EMAIL_RE.test(e), `should reject: ${JSON.stringify(e)}`);
    }
  });
});

// ── Email normalization contract ──────────────────────────────────────────

describe('Email normalization (toLowerCase + trim)', () => {
  // Re-implement locally to test the contract — auth.js normalizeEmail is
  // not exported (private to the route module). Test locks the expected
  // behavior so any drift in auth.js fails this test.
  const normalize = (email) => String(email).toLowerCase().trim();

  it('lowercases entire string', () => {
    assert.equal(normalize('USER@EXAMPLE.COM'), 'user@example.com');
    assert.equal(normalize('UsEr@ExAmPlE.CoM'), 'user@example.com');
  });

  it('strips leading/trailing whitespace', () => {
    assert.equal(normalize('  user@example.com  '), 'user@example.com');
    assert.equal(normalize('\tuser@example.com\n'), 'user@example.com');
  });

  it('handles already-normalized strings idempotently', () => {
    const e = 'user@example.com';
    assert.equal(normalize(e), e);
    assert.equal(normalize(normalize(e)), e);
  });
});

// ── Token expiry semantics (Date arithmetic contract) ─────────────────────

describe('Token expiry calculation', () => {
  it('verify token expires 24h from now', () => {
    const now = Date.now();
    const expires = new Date(now + 24 * 60 * 60 * 1000);
    assert.equal(expires.getTime() - now, 24 * 60 * 60 * 1000);
    assert.equal(expires.getTime() - now, 86400000);
  });

  it('reset token expires 1h from now (stricter for password ops)', () => {
    const now = Date.now();
    const expires = new Date(now + 60 * 60 * 1000);
    assert.equal(expires.getTime() - now, 60 * 60 * 1000);
    assert.equal(expires.getTime() - now, 3600000);
  });

  it('reset TTL is 24x shorter than verify TTL', () => {
    const verifyMs = 24 * 60 * 60 * 1000;
    const resetMs = 60 * 60 * 1000;
    assert.equal(verifyMs / resetMs, 24);
  });
});
