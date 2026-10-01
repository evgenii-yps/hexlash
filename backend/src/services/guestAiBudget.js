/* HEXLASH — guest model budget. ONE shared per-day ceiling of guest calls to the
   language model, for the whole server (AI_GUEST_DAILY_CAP in config.js).

   WHY A SERVER-WIDE CEILING AND NOT A PER-GUEST ONE. A guest has no account and
   the id they send is free to forge, so a per-guest cap would protect nothing. What
   we actually need to bound is the money: the worst day costs cap × price per call
   no matter who is asking. Signed-in players are NOT counted here — they stay
   under their own per-account limiter, unchanged.

   The day is the UTC day. The count lives in memory: a restart resets it, which
   only ever errs on the side of letting a few more calls through on that day, and
   the per-IP limiter still bounds the rate. */
const { AI_GUEST_DAILY_CAP } = require('../config');

let dayKey = '';
let used = 0;

const today = (now) => new Date(now).toISOString().slice(0, 10);

function roll(now) {
  const k = today(now);
  if (k !== dayKey) { dayKey = k; used = 0; }
}

/** Take one guest call from today's budget. false = the ceiling is reached. */
function takeGuestSlot(now = Date.now(), cap = AI_GUEST_DAILY_CAP) {
  roll(now);
  if (used >= cap) return false;
  used += 1;
  return true;
}

/** For the log line and tests. */
function guestBudgetUsed(now = Date.now()) {
  roll(now);
  return used;
}

function resetGuestBudget() { dayKey = ''; used = 0; }

module.exports = { takeGuestSlot, guestBudgetUsed, resetGuestBudget };
