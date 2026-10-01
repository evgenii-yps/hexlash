/* HEXLASH — one log line per call to the language model.

   WHAT A LINE CARRIES: which route, guest or player, the HTTP status we answered,
   input/output tokens (resp.usage from Anthropic) and how long the answer took.
   WHAT IT NEVER CARRIES: the request text, the guest id, the user id, the IP —
   nothing that identifies anyone or says what happened in the fight.

   An error from Anthropic itself (bad key, rate limit, empty balance, overload)
   gets its own plain line on top, because those are the ones an owner has to act
   on, and they would otherwise hide inside a generic 502. */

function classifyAnthropicError(err) {
  const status = err && (err.status || err.statusCode);
  const msg = String((err && (err.message || (err.error && err.error.message))) || '').toLowerCase();
  if (status === 401 || status === 403) return { kind: 'ANTHROPIC_KEY_REJECTED', hint: 'API key is invalid or has no access — check ANTHROPIC_API_KEY' };
  if (msg.includes('credit balance') || msg.includes('billing')) return { kind: 'ANTHROPIC_BALANCE_EMPTY', hint: 'Anthropic account has no credit — top up the balance' };
  if (status === 429) return { kind: 'ANTHROPIC_RATE_LIMITED', hint: 'Anthropic rate limit hit — calls are being throttled upstream' };
  if (status === 529 || (status >= 500 && status < 600)) return { kind: 'ANTHROPIC_UNAVAILABLE', hint: 'Anthropic is overloaded or down — fighters stay on reflexes' };
  if (status === 400) return { kind: 'ANTHROPIC_BAD_REQUEST', hint: 'Anthropic rejected the request itself' };
  return null;
}

/**
 * @param {object} o
 *   route   'fighter-intention' | 'legend-command'
 *   caller  'guest' | 'player'
 *   status  HTTP status we answered
 *   usage   { input_tokens, output_tokens } from resp.usage, or null
 *   ms      time to answer
 *   reason  short reason for refusals that never reached Anthropic
 *   err     the thrown error, when the call failed
 */
function logModelCall({ route, caller, status, usage, ms, reason, err }) {
  const inTok = usage && Number.isFinite(usage.input_tokens) ? usage.input_tokens : '-';
  const outTok = usage && Number.isFinite(usage.output_tokens) ? usage.output_tokens : '-';
  let line = `[ai] route=${route} caller=${caller} status=${status} in=${inTok} out=${outTok} ms=${Math.round(ms || 0)}`;
  if (reason) line += ` reason=${reason}`;
  console.log(line);
  const known = err ? classifyAnthropicError(err) : null;
  if (known) {
    console.error(`[ai] ${known.kind} route=${route} upstream_status=${err.status || err.statusCode} — ${known.hint}`);
  }
}

module.exports = { logModelCall, classifyAnthropicError };
