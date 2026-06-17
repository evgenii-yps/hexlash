/* HEXLASH — facet card READOUT (DISPLAY ONLY).

   Turns the ONE number each facet already carries into the two things the
   upgrade card shows for ALL 60 facets in a SINGLE format: a clean percent +
   a short word plate. The data is read as-is — NO fight effect, NO mutation:
     hard branches  → statBonus { stat, pct }       (RAM/HUNT/STING → strikePower,
                                                       BASTION/BREAKER → toughness)
     other branches → behaviorReadout { axis, delta }  (the facet's dominant shift)
   (Both produced in upgradeData.js; see the combat layer for the live effect.)

   This is the ONE place to tune the display: the axis→percent coefficient and
   the phrase table. English-only. Reword the phrases freely later — nothing in
   combat reads this file. */

// Axis shift → percent for display. One delta point ≈ this many percent points.
// Hard grades show their real statBonus.pct; behaviour grades show |delta| ×
// this — so both read as a clean percent (axis deltas are 4..14, landing in the
// same 4..22% band as the hard ramp). Tunable.
export const AXIS_PCT_PER_DELTA = 1;

// stat → phrase (hard branches; the bonus is always a buff). `down` kept for
// symmetry / future-proofing — current data never goes negative here.
const STAT_PHRASES = {
  strikePower: { up: 'Harder hits', down: 'Softer hits' },
  toughness: { up: 'Tougher', down: 'Frailer' },
  // Extra competence seams (facet `extraBonuses`, beyond the hard-branch ramp).
  blockPenetration: { up: 'Pierces guard', down: 'Less pierce' },
  interruptResist: { up: 'Unshakable', down: 'Easily shaken' },
  accuracy: { up: 'Sharper aim', down: 'Looser aim' },
  feintChance: { up: 'Fakes more', down: 'Fakes less' },
  feintPayoff: { up: 'Deadly feint', down: 'Weaker feint' },
  chargeGain: { up: 'Charges faster', down: 'Charges slower' },
  chargePower: { up: 'Heavier charge', down: 'Lighter charge' },
  staminaRegen: { up: 'Recovers faster', down: 'Recovers slower' },
  blockMitigation: { up: 'Stronger guard', down: 'Weaker guard' },
  blockCounter: { up: 'Block riposte', down: 'Weaker riposte' },
  interruptBonus: { up: 'Punishes swings', down: 'Softer catch' },
  dodgeCounter: { up: 'Dodge counter', down: 'Weaker counter' },
  missCounter: { up: 'Punishes whiffs', down: 'Softer punish' },
  chargeMax: { up: 'Bigger charge', down: 'Smaller charge' },
  chargePen: { up: 'Charge pierces', down: 'Less pierce' },
};

// axis → phrase by direction (behaviour branches). Short (2–3 words); meaning
// follows the behaviour.js axis semantics. The single table to reword later.
const AXIS_PHRASES = {
  distance: { up: 'Keeps distance', down: 'Fights close' },
  initiative: { up: 'Drives in', down: 'Waits more' },
  tempo: { up: 'Faster tempo', down: 'Slower tempo' },
  weight: { up: 'Heavier hits', down: 'Lighter, faster' },
  stick: { up: 'Keeps pressing', down: 'Hits and leaves' },
  resilience: { up: 'Holds steady', down: 'More fragile' },
  counter: { up: 'Punishes openings', down: 'Less punish' },
  slip: { up: 'Slips more', down: 'Easier to hit' },
};

// Percent to show for a facet — rounded integer MAGNITUDE (always ≥ 0; the
// direction lives in the phrase, so the format stays uniform across all 60).
// null only if a facet somehow carries no readout (every facet has one).
export function facetPercent(face) {
  if (!face) return null;
  if (face.statBonus) return Math.round(face.statBonus.pct * 100);
  if (face.behaviorReadout) return Math.round(Math.abs(face.behaviorReadout.delta) * AXIS_PCT_PER_DELTA);
  return null;
}

// Word plate for a facet — same lookup shape for hard + behaviour. '' if missing.
export function facetPhrase(face) {
  if (!face) return '';
  if (face.statBonus) {
    const t = STAT_PHRASES[face.statBonus.stat];
    return t ? (face.statBonus.pct >= 0 ? t.up : t.down) : '';
  }
  if (face.behaviorReadout) {
    const t = AXIS_PHRASES[face.behaviorReadout.axis];
    return t ? (face.behaviorReadout.delta >= 0 ? t.up : t.down) : '';
  }
  return '';
}

// One axis shift → a display line: signed magnitude + its directional phrase.
// Sign uses U+2212 minus for a clean mono glyph. Reuses the phrase table.
function axisLine(axis, delta) {
  const t = AXIS_PHRASES[axis];
  return {
    sign: delta >= 0 ? '+' : '−',
    pct: Math.round(Math.abs(delta) * AXIS_PCT_PER_DELTA),
    phrase: t ? (delta >= 0 ? t.up : t.down) : axis,
  };
}

// FULL ordered readout for a facet — EVERY significant effect, primary first,
// each carrying its DIRECTION (sign + directional phrase). Display only — pure
// read of the existing data, no mutation, no new fight effect.
//   Hard branch  → the stat % leads (always +; it is what the branch is about),
//                  then its axis shifts, largest |delta| first.
//   Behaviour    → the axis shifts, dominant (largest |delta|) first — index 0
//                  matches the old single dominant readout (stable sort keeps the
//                  first-wins-on-a-tie order of dominantShift).
// Each line: { sign, pct, phrase }. Render index 0 prominent, the rest quieter.
export function facetEffects(face) {
  if (!face) return [];
  const out = [];
  if (face.statBonus) {
    const t = STAT_PHRASES[face.statBonus.stat];
    out.push({
      sign: face.statBonus.pct >= 0 ? '+' : '−',
      pct: Math.round(Math.abs(face.statBonus.pct) * 100),
      phrase: t ? (face.statBonus.pct >= 0 ? t.up : t.down) : face.statBonus.stat,
    });
  }
  // Extra competence seams (blockPenetration / interruptResist …) — the facet's
  // OTHER number projection, after the ramp stat, before the movement shifts.
  for (const eb of face.extraBonuses || []) {
    const t = STAT_PHRASES[eb.stat];
    out.push({
      sign: eb.pct >= 0 ? '+' : '−',
      pct: Math.round(Math.abs(eb.pct) * 100),
      phrase: t ? (eb.pct >= 0 ? t.up : t.down) : eb.stat,
    });
  }
  const shifts = (face.shifts || []).slice().sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  for (const sh of shifts) out.push(axisLine(sh.axis, sh.delta));
  return out;
}
