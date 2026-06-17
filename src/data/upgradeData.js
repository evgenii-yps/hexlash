/* HEXLASH — pre-fight CONTENT + lookup (stubs · game design owns final copy).
   SINGLE source for all three screens (select → upgrade → arena). Core ids
   (natisk/nalet/skala/zasada) and face states (lit/open/locked) are CONTRACT —
   do not rename. English-only. Geometry lives in upgradeGeometry.js. */

import { COMBAT_BALANCE } from './combatBalance.js';

/* RESOURCE — shared core point pool. Split across all crystals. */
export const RESOURCE = 5;

/* The four cores — production palette (locked). id → store (read by arena as-is).
   ix   — core index (card «CORE 0N»).
   name — display name (EN). sig — one-word signature force.
   hue  — primary colour (whole screen tints via --core).
   sup  — supporting glow tone. MUST stay in the same hue family as hue
          (README §sup-discipline) so the bloom never drifts into a neighbour. */
export const CORES = [
  { id: 'natisk', ix: '01', name: 'ONSLAUGHT', sig: 'PRESSURE', hue: '#FF3344', sup: '#FF7A88',
    manner: 'Marches in close and never lets the distance go.' },
  { id: 'nalet', ix: '02', name: 'RAIDER', sig: 'TEMPO', hue: '#FFA526', sup: '#FFC97A',
    manner: 'Strikes, drops, strikes again — touches and gone.' },
  { id: 'skala', ix: '03', name: 'BULWARK', sig: 'DURABILITY', hue: '#2ED6B0', sup: '#7AE6D0',
    manner: 'Takes the hit, grinds it down, gives it back later.' },
  { id: 'zasada', ix: '04', name: 'AMBUSH', sig: 'COUNTER', hue: '#9461FF', sup: '#BFA0FF',
    manner: 'Waits in silence, then a single, paid-in-full strike.' },
];

/* face: { id, name, state, shifts, conditionals, effects }
   state ∈ 'lit' | 'open' | 'locked'  — DO NOT rename states.

   Facet behaviour contract (data-каркас, src/data/behavior.js). Every facet
   carries three lists; the resolver reads them uniformly:
     shifts       — flat lever changes, each { axis, delta }: axis ∈ behaviour
                    AXES, delta added to the 0..100 lever, result clamped. Read
                    + applied now (cores fight by core profile + lit-facet shifts).
     conditionals — string tags for condition-fired / accruing mechanics. STORED
                    only this pass — behaviour approximated by the shifts above
                    until the tagged mechanic is coded.
     effects      — string tags for branch-tip tricks (vertices). STORED only —
                    coded point-by-point later, approximated by shifts for now.
     bonuses      — optional [{ stat, pct }] competence adds BEYOND the hard-branch
                    ramp (blockPenetration, interruptResist, …). LIVE — resolveBehavior
                    sums them into statBonuses → buildFighter `sb.*` → the real
                    mechanic (block pierce, interrupt resistance). Surfaced on the
                    facet as `extraBonuses`.

   This pass: every facet is 'open' (no lit/locked gating yet) and each branch's
   `limit` is its full size — the global RESOURCE pool is the real cap until
   pricing lands. Lighting many at once pins the axes (temporary, awaits pricing). */
const s = (axis, delta) => ({ axis, delta }); // axis-shift shorthand (movement manner)
const b = (stat, pct) => ({ stat, pct }); // competence-bonus shorthand (facet → sb.* seam)

/* Largest-magnitude axis shift of a facet (its dominant lever), as the
   behaviour READOUT for the future card: { axis, delta } of the biggest |delta|
   (first wins on a tie → deterministic). Pure read of the EXISTING shifts — no
   new logic, no extra fight effect. null if the facet has no shifts. */
function dominantShift(shifts) {
  let best = null;
  for (const sh of shifts || []) {
    if (!sh) continue;
    if (!best || Math.abs(sh.delta) > Math.abs(best.delta)) best = sh;
  }
  return best ? { axis: best.axis, delta: best.delta } : null;
}

/* mkBranch(id, name, faces, stat?) — `stat` tags a "hard" branch (strikePower /
   toughness): each facet then carries a `statBonus { stat, pct }` — a percent to
   that characteristic, sized by depth from COMBAT_BALANCE.gradeBonusRamp (this is
   the NEW number layer; the facet's behaviour shifts are untouched). On the other
   (behaviour) branches `stat` is null and each facet instead surfaces a
   `behaviorReadout { axis, delta }` from its dominant existing shift — DATA ONLY
   for the card, no new fight effect. Each facet ends up with exactly one readout:
   `statBonus` (hard) or `behaviorReadout` (behaviour); the other is null. */
function mkBranch(id, name, faces, stat = null) {
  const ramp = COMBAT_BALANCE.gradeBonusRamp;
  return {
    id,
    name,
    limit: faces.length, // full branch openable; RESOURCE pool is the live cap
    faces: faces.map((f, i) => {
      const shifts = f.shifts || [];
      // statBonus pct by depth (i=0..4 → grade 1..5); clamp the index defensively.
      const statBonus = stat
        ? { stat, pct: ramp[Math.min(i, ramp.length - 1)] }
        : null;
      return {
        id: i + 1,
        name: f.name,
        state: 'open',
        shifts,
        conditionals: f.conditionals || [],
        effects: f.effects || [],
        // Competence adds beyond the hard-branch ramp — flow to statBonuses → sb.*
        // (blockPenetration, interruptResist, …). LIVE; empty on most facets.
        extraBonuses: f.bonuses || [],
        // UI readout (data only; rendered by a later upgrade-screen pass):
        statBonus, // hard branches: { stat, pct } — % to the characteristic
        behaviorReadout: stat ? null : dominantShift(shifts), // behaviour branches: { axis, delta }
      };
    }),
  };
}

/* CRYSTALS[coreId] = [{ id, name, limit, faces:[{ id, name, state, shifts,
   conditionals, effects }] }]. Three branches per core, five facets each (1→5,
   the 5th is the branch tip / vertex). limit — per-crystal cap (= branch size
   here); double-clamp with the global RESOURCE pool. */
export const CRYSTALS = {
  natisk: [
    // RAM — a slow, heavy fighter that breaks straight THROUGH the guard. Number:
    // strikePower (whole-branch ramp = «бьёт тяжелее») + blockPenetration (Guard
    // Crush / Breakthrough, the REAL pierce seam) + interrupt resistance (Unshaken).
    // Movement: weight UP = a heavier, slower gait — manner, NOT damage (that's
    // strikePower). No counter (not RAM's home).
    mkBranch('a', 'RAM', [
      // Heavier, slower, more crushing blow: strikePower (ramp) + a weightier gait.
      { name: 'Heavy Hit', shifts: [s('weight', 14)] },
      // Caves a raised guard: really pierces the block (blockPenetration seam).
      { name: 'Guard Crush', shifts: [s('weight', 8)], bonuses: [b('blockPenetration', COMBAT_BALANCE.ramGuardCrushPen)] },
      // Can't be knocked off the swing: interrupt-resistance seam + holds steady.
      { name: 'Unshaken', shifts: [s('resilience', 14)], bonuses: [b('interruptResist', COMBAT_BALANCE.ramUnshakenInterruptResist)] },
      // The closer it gets, the more it breaks (close_damage_ramp — conditional,
      // approximated by the close-in shift until the ramp mechanic is coded).
      { name: 'Close Power', shifts: [s('distance', -8), s('weight', 6)], conditionals: ['close_damage_ramp'] },
      // VERTEX — straight through the guard: near-total block pierce + an overload hit.
      { name: 'Breakthrough', shifts: [s('weight', 10)], bonuses: [b('blockPenetration', COMBAT_BALANCE.ramBreakthroughPen)], effects: ['overload_strike'] },
    ], 'strikePower'),
    // CHASE — a fast, clingy pursuer that captures distance and won't let go.
    // Number/movement: initiative + distance (close the gap) up front, then stick
    // (cling, cut escape) through the tip. Stays light/quick — no weight; no counter.
    mkBranch('b', 'CHASE', [
      // Explodes into range — a sharp entry that closes the gap.
      { name: 'Hard Entry', shifts: [s('distance', -8), s('initiative', 6)] },
      // Runs down a retreating foe: presses + keeps closing (chase_strike conditional).
      { name: 'Run-Down', shifts: [s('stick', 8), s('distance', -6)], conditionals: ['chase_strike'] },
      // Cuts off the angles / escape routes — pure cling.
      { name: 'Cut Off', shifts: [s('stick', 10)] },
      // Clings on, won't be shaken off, and stays glued in close.
      { name: 'Cling', shifts: [s('stick', 10), s('distance', -6)] },
      // VERTEX — pins the foe in close: stick to the ceiling, almost no disengage.
      { name: 'Lockdown', shifts: [s('stick', 14), s('distance', -8)], effects: ['lockdown'] },
    ]),
    // FRENZY — accelerating, relentless TEMPO. Number/movement: tempo across the
    // whole branch — longer strings, shorter gaps, ramps as it lands. No weight,
    // no counter. No Breather wants enemy-regen suppression (a CROSS-FIGHTER seam,
    // NOT built — see report); its tempo+stick approximate the relentlessness for
    // now. Rampage ramps with no ceiling, the escalate safeguard as the backstop.
    mkBranch('c', 'FRENZY', [
      // Longer strings of blows.
      { name: 'Long Combo', shifts: [s('tempo', 8)] },
      // Shorter gaps between attacks.
      { name: 'No Pause', shifts: [s('tempo', 10)] },
      // Speeds up as it lands (hit_accel — conditional, accruing accel later).
      { name: 'Building Momentum', shifts: [s('tempo', 6)], conditionals: ['hit_accel'] },
      // Never lets the foe recover (no_breather — REQUIRES a cross-fighter regen-
      // suppression seam; tagged + approximated by tempo+stick pressure for now).
      { name: 'No Breather', shifts: [s('tempo', 6), s('stick', 6)], conditionals: ['no_breather'] },
      // VERTEX — ramps with no ceiling.
      { name: 'Rampage', shifts: [s('tempo', 12)], effects: ['rampage'] },
    ]),
  ],
  nalet: [
    // JAB (УКОЛ) — hit-and-run pricker: accurate first strike, big bounce out past
    // the answer, quick in-out tempo. Number: accuracy (Pinpoint Entry — REAL miss
    // seam) + distance (the bounce). Movement: light/quick (low weight kept, no
    // dump up). No counter (not its home).
    mkBranch('a', 'JAB', [
      // Strike then bounce out fast — a quick in-out exchange.
      { name: 'Quick Out', shifts: [s('distance', 8), s('tempo', 6)] },
      // Pinpoint first strike: the entry rarely misses (accuracy seam).
      { name: 'Pinpoint Entry', shifts: [s('initiative', 6)], bonuses: [b('accuracy', COMBAT_BALANCE.jabPinpointAccuracy)] },
      // Bounces out beyond the foe's counter-range, elusive on the way.
      { name: 'Far Bounce', shifts: [s('distance', 10), s('slip', 6)] },
      // A clean trade speeds the next dart-in (clean_chain — conditional).
      { name: 'Clean Exchange', shifts: [s('tempo', 8)], conditionals: ['clean_chain'] },
      // VERTEX — enter-hit-exit as one motion: almost nothing to answer with.
      { name: 'Perfect Prick', shifts: [s('initiative', 10), s('distance', 8), s('slip', 6)], effects: ['perfect_jab'] },
    ]),
    // FEINT (ФИНТ) — a real trickster on the LIVE feint mechanic: fakes often,
    // punishes the bite hard, and breaks its own rhythm so the foe can't read the
    // real attack. Number: feintChance / feintPayoff seams + variable tempo. No
    // counter, no weight (light).
    mkBranch('b', 'FEINT', [
      // Throws more fakes — the feint-frequency seam.
      { name: 'Fake-In', shifts: [s('tempo', 4)], bonuses: [b('feintChance', COMBAT_BALANCE.feintFakeInChance)] },
      // When the foe bites a feint, the punish strike bites harder (payoff seam).
      { name: 'Punish Reaction', shifts: [s('tempo', 4)], bonuses: [b('feintPayoff', COMBAT_BALANCE.feintPunishPayoff)] },
      // Breaks the rhythm — variable cadence, the real attack hides in the noise.
      { name: 'Broken Rhythm', shifts: [s('tempo', 8)], conditionals: ['rhythm_break'] },
      // Jolts the foe's swing with a fake (feint → interrupt). REQUIRES a seam —
      // a feint lands nothing, so it can't interrupt today (tagged, see report).
      { name: 'Feint to Interrupt', shifts: [s('tempo', 6)], conditionals: ['feint_interrupt'] },
      // VERTEX — fake → opening → clean strike: the most reliable pierce (max payoff).
      { name: 'Setup Combo', shifts: [s('tempo', 6)], bonuses: [b('feintPayoff', COMBAT_BALANCE.feintSetupPayoff)], effects: ['feint_combo'] },
    ]),
    // HUNT (ОХОТА) — a patient hunter that loads a charged haymaker and reads the
    // opening. Number: strikePower (ramp) + charge (Charged Run gain, Killing Run
    // power — REAL charge seams) + accuracy (Read the Tell). counter ONLY on
    // Punish Aggression. Light — no weight dump (was heavy; removed).
    mkBranch('c', 'HUNT', [
      // Studies the foe (waits a touch longer), then a pinpoint entry (accuracy).
      { name: 'Read the Tell', shifts: [s('initiative', -6)], bonuses: [b('accuracy', COMBAT_BALANCE.huntReadAccuracy)] },
      // Harder on a spent / open foe (punish_exhausted). REQUIRES a seam — needs to
      // read the foe's stamina for the damage bonus (tagged, see report).
      { name: 'Strike the Open', shifts: [s('initiative', 4)], conditionals: ['punish_exhausted'] },
      // Builds the charge while spacing / circling out (charge-gain seam).
      { name: 'Charged Run', shifts: [s('distance', 6)], bonuses: [b('chargeGain', COMBAT_BALANCE.huntChargedGain)] },
      // The ONLY counter in RAIDER — the more the foe presses, the more it pays.
      { name: 'Punish Aggression', shifts: [s('counter', 10)], conditionals: ['punish_aggression'] },
      // VERTEX — one loaded, devastating run: a full charge releases at max power.
      { name: 'Killing Run', shifts: [s('distance', 6)], bonuses: [b('chargePower', COMBAT_BALANCE.huntKillingPower)], effects: ['lethal_entry'] },
    ], 'strikePower'),
  ],
  skala: [
    mkBranch('a', 'BASTION', [
      { name: 'Tough Hide', shifts: [s('resilience', 10)] },
      { name: 'Steady', shifts: [s('resilience', 8)] },
      { name: 'Catch Breath', shifts: [s('resilience', 6)], conditionals: ['breather_regen'] },
      { name: 'Dig In', shifts: [s('resilience', 8), s('distance', -6)], conditionals: ['dig_in'] },
      { name: 'Unbreakable', shifts: [s('resilience', 12)], effects: ['fortress'] },
    ], 'toughness'),
    mkBranch('b', 'BREAKER', [
      { name: 'Block & Jab', shifts: [s('counter', 8), s('distance', -4)] },
      { name: 'Catch the Wind-up', shifts: [s('counter', 8)] },
      { name: 'Hard Meet', shifts: [s('counter', 8)] },
      { name: 'Retaliation', shifts: [s('counter', 8)], conditionals: ['retaliate_ramp'] },
      { name: 'Counter Wall', shifts: [s('counter', 8), s('weight', 6)], effects: ['counter_trap'] },
    ], 'toughness'),
    mkBranch('c', 'VICE', [
      { name: 'Body Shove', shifts: [s('stick', 8), s('distance', -6)] },
      { name: 'Heavy Slam', shifts: [s('weight', 10)] },
      { name: 'No Way Around', shifts: [s('stick', 8)] },
      { name: 'Pin', shifts: [s('stick', 8), s('distance', -6)], conditionals: ['pin'] },
      { name: 'Clinch', shifts: [s('stick', 10), s('weight', 6)], effects: ['clinch'] },
    ]),
  ],
  zasada: [
    mkBranch('a', 'TRAP', [
      { name: 'Hard Counter', shifts: [s('counter', 10)] },
      { name: 'Slip & Punish', shifts: [s('counter', 8), s('slip', 6)] },
      { name: 'Punish Aggression', shifts: [s('counter', 10)], conditionals: ['punish_aggression'] },
      { name: 'Punish Whiff', shifts: [s('counter', 8)], conditionals: ['punish_whiff'] },
      { name: 'Perfect Trap', shifts: [s('counter', 10), s('slip', 4)], effects: ['perfect_trap'] },
    ]),
    mkBranch('b', 'SHADOW', [
      { name: 'Long Slip', shifts: [s('slip', 10)] },
      { name: 'Hard to Reach', shifts: [s('slip', 8), s('distance', 6)] },
      { name: "Run 'Em Ragged", shifts: [s('slip', 8)], conditionals: ['exhaust'] },
      { name: 'Open Window', shifts: [s('slip', 8), s('distance', 6)], conditionals: ['evade_window'] },
      { name: 'Phantom', shifts: [s('slip', 12)], effects: ['phantom'] },
    ]),
    mkBranch('c', 'STING', [
      { name: 'Loaded Hit', shifts: [s('weight', 10)] },
      { name: 'Longer Charge', shifts: [s('weight', 8), s('initiative', -4)], conditionals: ['charge'] },
      { name: 'Hit the Opening', shifts: [s('weight', 8), s('initiative', -6)], conditionals: ['vulnerable_strike'] },
      { name: 'Pierce', shifts: [s('weight', 8)], effects: ['pierce'] },
      { name: 'Execution', shifts: [s('weight', 14)], effects: ['execute'] },
    ], 'strikePower'),
  ],
};

/* Look up a core by id. One id contract across all three screens — no bridge.
   Fallback to BULWARK (CORES[2]) keeps upgrade/arena sane if the pick is empty
   (the route guard normally blocks that). */
export const getCore = (id) => CORES.find((c) => c.id === id) || CORES[2];
