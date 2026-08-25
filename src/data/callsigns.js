/* HEXLASH — fighter callsigns. The player never names a fighter by hand: eight
   naming prompts in a row is paperwork, not play, and an unnamed roster reads as
   eight identical dolls. So a callsign is handed out on recruitment.

   House rules for the list (keep them if you extend it):
     • one or two syllables, hard consonants, sayable out loud;
     • English, uppercase, letters only — no digits, no jokes, no fantasy;
     • no collision with anything else the game already calls something: the four
       core names (ONSLAUGHT / RAIDER / BULWARK / AMBUSH) and the place names
       (ARENA / FORGE / SPACE / THE PIT).
   52 entries against a roster cap of 8, so a repeat is not something the player
   can reach by playing — the differentiator below is a safety net, not a feature. */
export const CALLSIGNS = [
  'VULK', 'ORNE', 'KRAIT', 'SABLE', 'TORCH', 'VANE', 'RUST', 'ASH',
  'GRIM', 'HALT', 'FLINT', 'SLATE', 'BRIG', 'CINDER', 'DRAKE', 'EMBER',
  'FANG', 'GIRDER', 'HAWK', 'IRON', 'JOLT', 'KEEL', 'LODE', 'MARROW',
  'NOX', 'ONYX', 'PIKE', 'QUARRY', 'RAVEN', 'SCAR', 'TALON', 'UMBER',
  'VECTOR', 'WRACK', 'YOKE', 'ZINC', 'BASALT', 'CLEAVE', 'DUSK', 'EDGE',
  'GRIT', 'HOLLOW', 'INGOT', 'JACKAL', 'KILN', 'LANCE', 'NETTLE', 'PITCH',
  'RIDGE', 'SHALE', 'THORN', 'WOLFRAM',
];

/**
 * A callsign nobody in `taken` is using. Random among the free ones so two
 * fighters recruited back to back do not read as a sequence.
 * If every name is somehow in use, fall back to NAME-2, NAME-3, … — ugly on
 * purpose, so it is obvious this branch was reached.
 */
export function pickCallsign(taken = []) {
  const used = new Set(taken);
  const free = CALLSIGNS.filter((n) => !used.has(n));
  if (free.length) return free[Math.floor(Math.random() * free.length)];

  const base = CALLSIGNS[Math.floor(Math.random() * CALLSIGNS.length)];
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
