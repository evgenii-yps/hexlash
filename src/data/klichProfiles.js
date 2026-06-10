/* Klich (combat-call) EFFECT profiles — the temporary behaviour-axis bump each
   call lays over the fighter's current profile, with an attack → hold → release
   envelope. Directions are fixed by design; magnitudes + durations are the
   tunable knobs and live HERE in one place (not scattered through the engine).

   Axes are the 8 behaviour axes (src/data/behavior.js); deltas are in axis units
   (0..100, signed) added on top of the base profile. `dur` is the total effect
   length in seconds. `attack` / `release` are fractions of `dur` for the rise /
   fall (the middle holds at full strength); a small attack + large release reads
   as a sharp spike that fades, a larger attack reads softer.

   buildFighter sums the live envelopes of all active calls additively over the
   BASE axes, clamps to 0..100, and re-derives the affected knobs each frame —
   so the base profile is never mutated and the fighter returns to it EXACTLY
   when the calls expire (no residual drift). Stacked / repeated calls just sum
   and auto-prune. */
export const KLICH_PROFILES = {
  // ВПЕРЁД — into the exchange: drive in hard + close the gap. Short sharp burst.
  forward: { axes: { initiative: 35, distance: -30 }, dur: 2.5, attack: 0.1, release: 0.8 },
  // ОТХОД — break distance: open the gap. Short sharp burst.
  retreat: { axes: { distance: 40 }, dur: 2.5, attack: 0.1, release: 0.8 },
  // ДЕРЖАТЬ — dig in, ride out a series: tougher + sticks on, AND visibly hunkers
  // into a guard — grows in close (distance−) and stops pushing (initiative−) so
  // the call reads as a defensive POSE even when no hits are landing, not only
  // through damage. Longer, softer envelope.
  hold: { axes: { resilience: 35, stick: 25, distance: -20, initiative: -15 }, dur: 6.0, attack: 0.25, release: 0.4 },
};
