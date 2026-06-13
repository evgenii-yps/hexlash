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
