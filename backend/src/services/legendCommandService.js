/* HEXLASH — legend command (Claude API). The thinking half of COMMAND part B.
   The arena's COMMAND layer wakes this on fight BREAKS (not every tick) to pick
   ONE lever for ONE of the player's fighters, in the legend's own voice.

   WHY THIS IS A SEPARATE SERVICE FROM fighterIntentionService. A fighter picks
   one of 7 intentions for ITSELF. The legend picks a LEVER for SOMEONE ELSE out
   of a set that changes every second (charges burn, cooldowns run), and it also
   speaks. Different question, different answer shape, different validation —
   folding both into one prompt would make each worse.

   ⚠️ ONE REQUEST CARRIES BOTH THE DECISION AND THE LINE (ТЗ part B, work 2 §2).
      A second call just for the words would double the bill for nothing.

   ⚠️ THE LEGEND CANNOT REACH FOR WHAT THE FINGER CANNOT REACH. The caller sends
      the levers that are free RIGHT NOW (charge left AND off cooldown); anything
      outside that list is rejected here, not silently "understood". Same rule as
      the client: the legend goes through the player's door, never her own.

   Backend-only — the API key never reaches the browser. The arena POSTs a WORD
   context (legend portrait + both sides + the live lever set), NO raw axis
   numbers, and gets back strict JSON { lever, target, line }.

   On ANY failure the client falls back to its threshold table, so a non-200 is a
   normal, expected outcome — not an incident. */
const Anthropic = require('@anthropic-ai/sdk');
const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = require('../config');

const PROMPT_VERSION = 'legend-command-v1';

// The line the legend says. 28 characters, not 40 (правка to ТЗ part B §1):
// with the name prefix ("ELDER: ") that lands near 35, which is one line at the
// block's real width on a 390pt phone. A short line in a core's manner also hits
// harder than a long one — and costs fewer tokens.
const LINE_MAX_LEN = 28;

const MAX_TOKENS = 100; // tiny — one small JSON object, and the line is capped

// Lazy singleton — only built when a key is present, so the route can 503
// cleanly when AI is off instead of crashing on boot.
let client = null;
const getClient = () => {
  if (!ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return client;
};

// ── Разбраковка реплики ───────────────────────────────────────────────────
// ТЗ §3 lists what gets a line thrown away. It is thrown away WHOLE — never
// trimmed, never patched. A patched line is words the legend did not say.

// Latin letters, digits, spaces and the punctuation a spoken line needs. Anything
// else (Cyrillic, CJK, emoji, box drawing) fails — the line is English by spec.
const LATIN_ONLY = /^[A-Za-z0-9 .,!?'’\-:;]+$/;

// The project's own vocabulary. In the legend's mouth these read as the game
// talking about itself instead of a fighter talking about a fight.
const INTERNAL_WORDS = ['house', 'hexarch', 'temper', 'doctrine', 'ascension'];

// Plain profanity. Short on purpose: a long list starts catching real words.
const PROFANITY = ['fuck', 'shit', 'bitch', 'bastard', 'damn', 'asshole', 'crap'];

// Talking about the screen instead of the fight.
//
// ⚠️ "press" IS NOT HERE, AND THAT IS A CONSCIOUS DEPARTURE FROM ТЗ §3. The ТЗ
//    lists press/button/tap together, but in THIS game PRESS is one of the seven
//    intentions and PUSH is one of the three klichs: "PRESS HIM NOW" is a
//    pressure core speaking in character, not a line about a button. Banning the
//    word outright would mute exactly the ONSLAUGHT voice we are building. So
//    the unambiguous UI nouns are banned, and "press" is banned only in the
//    shapes that can only mean a control — see UI_PRESS below.
const UI_WORDS = ['button', 'tap ', 'tap.', 'click', 'screen', 'menu', 'icon', 'swipe', 'cooldown'];
const UI_PRESS = /\bpress\s+(the|this|that|it|here)\b/i;

// The player is the person holding the phone. The legend fights alongside them,
// she does not narrate them.
const THIRD_PERSON = ['player', 'the user', 'coach'];

/**
 * Проверить реплику. Возвращает { ok: true, line } либо { ok: false, why }.
 *
 * `why` — короткая причина, и она нужна не для красоты: приёмка требует
 * доложить, сколько реплик выброшено И ПО КАКОЙ ПРИЧИНЕ раздельно.
 */
function validateLine(raw) {
  if (typeof raw !== 'string') return { ok: false, why: 'not_a_string' };
  const line = raw.trim();
  if (!line) return { ok: false, why: 'empty' };
  if (line.length > LINE_MAX_LEN) return { ok: false, why: 'too_long' };
  if (!LATIN_ONLY.test(line)) return { ok: false, why: 'not_latin' };
  const low = line.toLowerCase();
  if (INTERNAL_WORDS.some((w) => low.includes(w))) return { ok: false, why: 'internal_vocab' };
  if (PROFANITY.some((w) => low.includes(w))) return { ok: false, why: 'profanity' };
  if (UI_WORDS.some((w) => low.includes(w)) || UI_PRESS.test(low)) return { ok: false, why: 'ui_talk' };
  if (THIRD_PERSON.some((w) => low.includes(w))) return { ok: false, why: 'third_person' };
  return { ok: true, line };
}

// ── Промпт ────────────────────────────────────────────────────────────────

/**
 * SYSTEM. The legend is a RETIRED fighter who now calls the shots — a character
 * with a fixed temperament, given in words. Assembled from lines so it stays
 * editable instead of being one frozen blob.
 */
function buildSystemPrompt() {
  return [
    'You are a retired champion watching your side fight, and you call the shots.',
    'You ARE this character — a fighter who earned the right to command, with a',
    'fixed temperament given to you in words. You do not fight yourself any more.',
    '',
    'Each turn you may spend ONE lever on ONE of your fighters, or spend nothing.',
    'You may ONLY use a lever from the AVAILABLE LEVERS list — nothing else exists',
    'for you right now. Spending nothing is a real answer: a lever wasted early is',
    'a lever missing when it decides the fight.',
    '',
    'Let temperament lead, read the moment second.',
    '',
    'You also SAY one short line, in your own voice, about what you just decided.',
    `Rules for the line: English, AT MOST ${LINE_MAX_LEN} characters, clipped and spoken.`,
    'Talk about the fight and your fighters — never about the screen, never about',
    'the person holding it. No profanity. Short hits harder than long.',
    '',
    'Respond with ONLY a JSON object — no prose, no markdown fences:',
    '{"lever":"<an id from AVAILABLE LEVERS, or none>","target":<a number from YOUR FIGHTERS, or 0>,"line":"<your line>"}',
    'Use lever "none" and target 0 when you decide to spend nothing.',
  ].join('\n');
}

/**
 * USER. The WORD context. No raw numbers or axis values ever go in here — the
 * same rule the fighter prompt follows, and for the same reason: the model is
 * told what a person would see, not what the engine stores.
 */
function buildUserPrompt(ctx) {
  const { portrait = [], levers = [], units = [], foes = {}, phase = '', trigger = '' } = ctx || {};
  const lines = [];
  lines.push('WHO YOU ARE:');
  lines.push(portrait.length ? portrait.map((p) => `- ${p}`).join('\n') : '- a hard, plain commander');
  lines.push('');
  lines.push('YOUR FIGHTERS:');
  lines.push(units.length
    ? units.map((u, i) => `${i + 1}. ${u.name || 'a fighter'} — ${u.hp || 'unknown'}${u.note ? `, ${u.note}` : ''}`).join('\n')
    : '- none standing');
  lines.push('');
  lines.push('AGAINST YOU:');
  lines.push(`- numbers: ${foes.count || 'unknown'}`);
  lines.push(`- shape: ${foes.state || 'unknown'}`);
  lines.push('');
  lines.push('AVAILABLE LEVERS (all you can reach this moment):');
  lines.push(levers.length
    ? levers.map((l) => `- ${l.id}: ${l.name}${l.does ? ` — ${l.does}` : ''}${l.left != null ? ` (${l.left} left)` : ''}`).join('\n')
    : '- nothing is free right now');
  lines.push('');
  lines.push(`FIGHT PHASE: ${phase || 'unknown'}`);
  if (trigger) lines.push(`WHAT JUST CHANGED: ${trigger}`);
  lines.push('');
  lines.push('Decide now.');
  return lines.join('\n');
}

// ── Разбор ответа ─────────────────────────────────────────────────────────

/**
 * Вытащить и проверить ответ модели.
 *
 * Возвращает `{ lever, target, line, lineWhy }`:
 *   lever   — id из списка доступных, либо 'none';
 *   target  — номер бойца 1..N, либо 0;
 *   line    — реплика, ЛИБО пустая строка, если она не прошла разбраковку;
 *   lineWhy — почему выброшена ('' когда прошла). Нужен для отчёта приёмки.
 *
 * ⚠️ РЕПЛИКА И РЕШЕНИЕ ВЫБРАСЫВАЮТСЯ ПОРОЗНЬ, И ЭТО НАРОЧНО. Плохая реплика не
 *    отменяет верного решения: легенда тогда действует и молчит, а игрок видит
 *    служебную расшифровку — ровно то, что требует ТЗ §3. Обратное неверно:
 *    негодное решение уносит с собой и реплику, потому что реплика описывает
 *    именно его.
 *
 * Возвращает null, когда негодно САМО РЕШЕНИЕ — тогда правила остаются на
 * табличке порогов.
 */
function parseCommand(text, allowedLevers = [], unitCount = 0) {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let obj;
  try { obj = JSON.parse(m[0]); } catch (e) { return null; }
  if (!obj || typeof obj.lever !== 'string') return null;

  const lever = obj.lever.trim().toLowerCase();
  // «Ничего» — полноценный ответ, а не отказ: легенда бережёт заряд.
  const none = lever === 'none' || lever === '';
  if (!none && !allowedLevers.includes(lever)) return null; // рычага нет в руках — ответ целиком негоден

  let target = Number(obj.target);
  if (!Number.isInteger(target) || target < 0 || target > unitCount) target = 0;
  if (!none && target === 0) return null; // рычаг адресный: без цели он бессмыслен

  const checked = validateLine(obj.line);
  return {
    lever: none ? 'none' : lever,
    target: none ? 0 : target,
    line: checked.ok ? checked.line : '',
    lineWhy: checked.ok ? '' : checked.why,
  };
}

// ── Вызов ─────────────────────────────────────────────────────────────────

/**
 * Спросить модель об одном решении. БРОСАЕТ при отсутствии ключа / ошибке API /
 * неразбираемом ответе (err.code: AI_DISABLED | BAD_OUTPUT | прочее) — маршрут
 * превращает это в не-200, и клиент молча остаётся на табличке порогов.
 */
async function getLegendCommand(ctx, opts = {}) {
  const c = getClient();
  if (!c) { const e = new Error('AI disabled'); e.code = 'AI_DISABLED'; throw e; }
  const allowed = ((ctx && ctx.levers) || []).map((l) => String(l.id).toLowerCase());
  const unitCount = ((ctx && ctx.units) || []).length;
  const resp = await c.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(ctx) }],
  });
  // Token usage for the one-line call log (see services/aiLog.js). Reported before
  // parsing, so a call whose answer is thrown away is still counted.
  if (opts.onUsage && resp && resp.usage) opts.onUsage(resp.usage);
  const text = ((resp && resp.content) || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const parsed = parseCommand(text, allowed, unitCount);
  if (!parsed) { const e = new Error('Model returned no usable command'); e.code = 'BAD_OUTPUT'; throw e; }
  return parsed;
}

module.exports = {
  getLegendCommand,
  buildSystemPrompt,
  buildUserPrompt,
  parseCommand,
  validateLine,
  PROMPT_VERSION,
  LINE_MAX_LEN,
};
