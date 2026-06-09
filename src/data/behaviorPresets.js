/* HEXLASH — DEV-ONLY behaviour signature presets. NOT part of the real
   play → upgrade → arena flow (there the opponent gets a RANDOM core and the
   player resolves from its picked core + lit facets). These exist purely for the
   arena's A/B dev stand: each preset writes the 8 behaviour axes
   (see src/data/behavior.js) DIRECTLY — bypassing cores + facets — to crank one
   core into its signature extreme, so two builds can be stood up under identical
   conditions and judged by movement manner alone (no colour hint). Numbers are
   picked straight off the axis semantics.

   Axis (0 … 100, 50 = neutral):
     distance   — 0 in-close      … 100 far out
     initiative — 0 waits         … 100 drives in at the foe
     tempo      — 0 rare singles  … 100 flurries
     weight     — 0 light/fast    … 100 heavy/slow
     stick      — 0 hits & leaves … 100 sticks and keeps pressing
     resilience — 0 glass         … 100 unshakable
     counter    — 0 passive       … 100 punishes the opening
     slip       — 0 easy to hit   … 100 elusive */
import { AXIS_IDS, AXIS_NEUTRAL, clampAxis } from './behavior.js';

export const SIG_PRESETS = {
  // Pressure: drives straight into contact, never backs off, heavy slow blows,
  // hangs on after the strike. initiative↑ distance→in-close weight↑ stick↑
  // slip↓ counter↓.
  onslaught: {
    id: 'onslaught', tag: 'ONS', label: 'ONSLAUGHT-SIG',
    axes: { distance: 5, initiative: 100, tempo: 60, weight: 95, stick: 100, resilience: 65, counter: 10, slip: 5 },
  },
  // Tempo: dart in–hit–leave–re-enter from another angle, light + fast, doesn't
  // hang, keeps spacing between raids. tempo↑ distance↑ slip↑ stick↓ weight↓.
  raider: {
    id: 'raider', tag: 'RAID', label: 'RAIDER-SIG',
    axes: { distance: 80, initiative: 70, tempo: 95, weight: 10, stick: 5, resilience: 30, counter: 45, slip: 90 },
  },
  // Survivability: doesn't chase, eats damage without staggering, grinds the foe
  // down up close. initiative↓ (but won't run) resilience↑ distance→in-close
  // when engaged slip↓.
  bulwark: {
    id: 'bulwark', tag: 'BULW', label: 'BULWARK-SIG',
    axes: { distance: 15, initiative: 30, tempo: 35, weight: 70, stick: 75, resilience: 100, counter: 55, slip: 10 },
  },
  // Counterattack: never leads, circles at range, punishes the opening.
  // initiative↓ distance↑ counter↑ slip↑.
  ambush: {
    id: 'ambush', tag: 'AMB', label: 'AMBUSH-SIG',
    axes: { distance: 85, initiative: 10, tempo: 25, weight: 65, stick: 15, resilience: 40, counter: 100, slip: 85 },
  },
  // Baseline — every axis neutral. The "no manner" reference.
  neutral: {
    id: 'neutral', tag: 'NEU', label: 'NEUTRAL',
    axes: { distance: 50, initiative: 50, tempo: 50, weight: 50, stick: 50, resilience: 50, counter: 50, slip: 50 },
  },
};

// Order the dev L/R cycle-buttons step through.
export const SIG_ORDER = ['onslaught', 'raider', 'bulwark', 'ambush', 'neutral'];

// presetBehavior(id) → a resolved behaviour object shaped exactly like
// resolveBehavior's output ({ axes, effects, conditionals }) so it drops straight
// into buildFighter's `behavior` slot. Axes are clamped + filled across all 8
// ids defensively (a missing axis falls back to neutral). Unknown id → null
// (caller falls back to the core-derived behaviour).
export function presetBehavior(id) {
  const p = SIG_PRESETS[id];
  if (!p) return null;
  const axes = {};
  for (const a of AXIS_IDS) axes[a] = clampAxis(p.axes[a] == null ? AXIS_NEUTRAL : p.axes[a]);
  return { axes, effects: [], conditionals: [] };
}
