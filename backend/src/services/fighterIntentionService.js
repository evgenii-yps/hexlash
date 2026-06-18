/* HEXLASH — fighter intention (Claude API). The "model brain" half of the hybrid
   intention layer. The arena calls this on fight BREAKS (not every tick) to pick
   ONE of 7 intentions for a fighter, in character. Backend-only — the Anthropic
   API key never reaches the browser; the arena POSTs a WORD context (character
   portrait + own/foe state + foe memory + fight phase — NO raw axis numbers) and
   gets back strict JSON { intention, read }.

   The prompt is VERSIONED in code (PROMPT_VERSION) so it can evolve without a
   silent behaviour drift; it is built from word fragments, never one frozen blob.
   Model: a Haiku-class model (fast + cheap) read from config (ANTHROPIC_MODEL). */
const Anthropic = require('@anthropic-ai/sdk');
const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = require('../config');

const PROMPT_VERSION = 'fighter-intention-v1';

// The 7 intentions — the model MUST return exactly one (matched case-insensitively).
const VALID_INTENTIONS = ['PRESS', 'STRIKE', 'STING', 'HOLD', 'BREAK', 'BREATHE', 'CATCH'];
const VALID_SET = new Set(VALID_INTENTIONS);

const MAX_TOKENS = 120; // tiny — one small JSON object
const READ_MAX_LEN = 120;

// Lazy singleton — only constructed when a key is present (so the route can 503
// cleanly when AI is off, without crashing on boot).
let client = null;
const getClient = () => {
  if (!ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return client;
};

// Versioned SYSTEM prompt — the fighter is a CHARACTER with a fixed temperament,
// described in words. It picks ONE intention that fits both character + the live
// moment and returns ONLY JSON. Assembled from lines so it stays editable.
function buildSystemPrompt() {
  return [
    'You are the fighting mind of a single combatant in a one-on-one duel.',
    'You ARE this fighter — a character with a fixed temperament given to you in words.',
    'Each turn you pick ONE intention for the next stretch of the fight that fits',
    'BOTH your character and the live situation. Let temperament lead; react to the moment.',
    '',
    'The 7 intentions:',
    '- PRESS: drive forward, close the distance, force the exchange.',
    '- STRIKE: commit a heavy series now (worth it only with the foe in reach).',
    '- STING: light pokes from spacing; build toward a big shot.',
    '- HOLD: stand your ground, trade blows, guard up.',
    '- BREAK: break off, slip aside, reset the rhythm.',
    '- BREATHE: retreat and recover your wind (stamina).',
    "- CATCH: wait out the foe's swing and punish it.",
    '',
    'Stay in character: a presser presses, a counter-puncher waits, a spacer stings, a wall holds.',
    '',
    'Respond with ONLY a JSON object — no prose, no markdown fences:',
    '{"intention":"<one of PRESS|STRIKE|STING|HOLD|BREAK|BREATHE|CATCH>","read":"<at most 8 words: your read of the moment>"}',
  ].join('\n');
}

// USER prompt — the WORD context. No raw numbers or axis values ever go in here.
function buildUserPrompt(ctx) {
  const { portrait = [], self = {}, foe = {}, memory = [], phase = '', trigger = '' } = ctx || {};
  const lines = [];
  lines.push('YOUR CHARACTER:');
  lines.push(portrait.length ? portrait.map((p) => `- ${p}`).join('\n') : '- a plain, unremarkable fighter');
  lines.push('');
  lines.push('YOU RIGHT NOW:');
  lines.push(`- health: ${self.hp || 'unknown'}`);
  lines.push(`- wind: ${self.stamina || 'unknown'}`);
  lines.push(`- power saved up: ${self.charge || 'none'}`);
  lines.push(`- stance: ${self.stance || 'open'}`);
  lines.push(`- current intention: ${self.current || 'none'}`);
  lines.push('');
  lines.push('THE FOE:');
  lines.push(`- range: ${foe.range || 'unknown'}`);
  lines.push(`- manner: ${foe.manner || 'unknown'}`);
  lines.push(`- guard: ${foe.guard || 'open'}`);
  lines.push(`- health: ${foe.hp || 'unknown'}`);
  lines.push(`- wind: ${foe.stamina || 'unknown'}`);
  lines.push('');
  lines.push('RECENT FOE BEHAVIOUR:');
  lines.push(memory.length ? memory.map((m) => `- ${m}`).join('\n') : '- nothing notable yet');
  lines.push('');
  lines.push(`FIGHT PHASE: ${phase || 'unknown'}`);
  if (trigger) lines.push(`WHAT JUST CHANGED: ${trigger}`);
  lines.push('');
  lines.push('Pick your intention now.');
  return lines.join('\n');
}

// Extract + validate the model's JSON. Returns { intention, read } or null (the
// caller treats null as "no valid intention" → the client stays on spinal). Robust
// to stray prose / markdown by grabbing the first {...} block.
function parseIntention(text) {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let obj;
  try { obj = JSON.parse(m[0]); } catch (e) { return null; }
  if (!obj || typeof obj.intention !== 'string') return null;
  const intention = obj.intention.trim().toUpperCase();
  if (!VALID_SET.has(intention)) return null;
  let read = typeof obj.read === 'string' ? obj.read.trim() : '';
  if (read.length > READ_MAX_LEN) read = read.slice(0, READ_MAX_LEN);
  return { intention, read };
}

// Call Claude for one intention. THROWS on no-key / API error / unparseable output
// (err.code: AI_DISABLED | BAD_OUTPUT | else generic) — the route maps that to a
// non-200 so the frontend silently keeps the spinal cord.
async function getFighterIntention(ctx) {
  const c = getClient();
  if (!c) { const e = new Error('AI disabled'); e.code = 'AI_DISABLED'; throw e; }
  const resp = await c.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(ctx) }],
  });
  const text = ((resp && resp.content) || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const parsed = parseIntention(text);
  if (!parsed) { const e = new Error('Model returned no valid intention'); e.code = 'BAD_OUTPUT'; throw e; }
  return parsed;
}

module.exports = {
  getFighterIntention,
  buildSystemPrompt,
  buildUserPrompt,
  parseIntention,
  PROMPT_VERSION,
  VALID_INTENTIONS,
};
