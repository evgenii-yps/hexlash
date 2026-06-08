/* HEXLASH — pre-fight CONTENT + lookup (stubs · game design owns final copy).
   SINGLE source for all three screens (select → upgrade → arena). Core ids
   (natisk/nalet/skala/zasada) and face states (lit/open/locked) are CONTRACT —
   do not rename. English-only. Geometry lives in upgradeGeometry.js. */

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

   This pass: every facet is 'open' (no lit/locked gating yet) and each branch's
   `limit` is its full size — the global RESOURCE pool is the real cap until
   pricing lands. Lighting many at once pins the axes (temporary, awaits pricing). */
const s = (axis, delta) => ({ axis, delta }); // shift shorthand
function mkBranch(id, name, faces) {
  return {
    id,
    name,
    limit: faces.length, // full branch openable; RESOURCE pool is the live cap
    faces: faces.map((f, i) => ({
      id: i + 1,
      name: f.name,
      state: 'open',
      shifts: f.shifts || [],
      conditionals: f.conditionals || [],
      effects: f.effects || [],
    })),
  };
}

/* CRYSTALS[coreId] = [{ id, name, limit, faces:[{ id, name, state, shifts,
   conditionals, effects }] }]. Three branches per core, five facets each (1→5,
   the 5th is the branch tip / vertex). limit — per-crystal cap (= branch size
   here); double-clamp with the global RESOURCE pool. */
export const CRYSTALS = {
  natisk: [
    mkBranch('a', 'RAM', [
      { name: 'Heavy Hit', shifts: [s('weight', 10)] },
      { name: 'Guard Crush', shifts: [s('weight', 8)] },
      { name: 'Unshaken', shifts: [s('resilience', 12)] },
      { name: 'Close Power', shifts: [s('distance', -8), s('weight', 6)], conditionals: ['close_damage_ramp'] },
      { name: 'Breakthrough', shifts: [s('weight', 10)], effects: ['overload_strike'] },
    ]),
    mkBranch('b', 'CHASE', [
      { name: 'Hard Entry', shifts: [s('distance', -8), s('initiative', 4)] },
      { name: 'Run-Down', shifts: [s('stick', 10)], conditionals: ['chase_strike'] },
      { name: 'Cut Off', shifts: [s('stick', 8)] },
      { name: 'Cling', shifts: [s('stick', 8), s('distance', -6)] },
      { name: 'Lockdown', shifts: [s('stick', 12), s('distance', -8)], effects: ['lockdown'] },
    ]),
    mkBranch('c', 'FRENZY', [
      { name: 'Long Combo', shifts: [s('tempo', 8)] },
      { name: 'No Pause', shifts: [s('tempo', 10)] },
      { name: 'Building Momentum', shifts: [s('tempo', 6)], conditionals: ['hit_accel'] },
      { name: 'No Breather', shifts: [s('tempo', 6), s('stick', 6)] },
      { name: 'Rampage', shifts: [s('tempo', 12)], effects: ['rampage'] },
    ]),
  ],
  nalet: [
    mkBranch('a', 'JAB', [
      { name: 'Quick Out', shifts: [s('slip', 10)] },
      { name: 'Clean Entry', shifts: [s('weight', 6)] },
      { name: 'Far Bounce', shifts: [s('slip', 10), s('distance', 6)] },
      { name: 'Chain Step', shifts: [s('tempo', 6)], conditionals: ['clean_chain'] },
      { name: 'Perfect Jab', shifts: [s('slip', 10), s('tempo', 6)], effects: ['perfect_jab'] },
    ]),
    mkBranch('b', 'FEINT', [
      { name: 'Fake-In', shifts: [s('counter', 8)], effects: ['feint'] },
      { name: 'Punish Reaction', shifts: [s('counter', 10)] },
      { name: 'Broken Rhythm', shifts: [s('tempo', 6)], conditionals: ['rhythm_break'] },
      { name: 'Cut the Wind-up', shifts: [s('counter', 8)], effects: ['interrupt'] },
      { name: 'Feint Combo', shifts: [s('counter', 10), s('weight', 6)], effects: ['feint_combo'] },
    ]),
    mkBranch('c', 'HUNT', [
      { name: 'Read the Tell', shifts: [s('initiative', -6), s('counter', 6)] },
      { name: 'Strike the Open', shifts: [s('weight', 8)], conditionals: ['punish_open'] },
      { name: 'Charged Run', shifts: [s('weight', 8)], conditionals: ['charge'] },
      { name: 'Punish Aggression', shifts: [s('counter', 10)], conditionals: ['punish_aggression'] },
      { name: 'Lethal Entry', shifts: [s('weight', 12)], effects: ['lethal_entry'] },
    ]),
  ],
  skala: [
    mkBranch('a', 'BASTION', [
      { name: 'Tough Hide', shifts: [s('resilience', 10)] },
      { name: 'Steady', shifts: [s('resilience', 8)] },
      { name: 'Catch Breath', shifts: [s('resilience', 6)], conditionals: ['breather_regen'] },
      { name: 'Dig In', shifts: [s('resilience', 8), s('distance', -6)], conditionals: ['dig_in'] },
      { name: 'Unbreakable', shifts: [s('resilience', 12)], effects: ['fortress'] },
    ]),
    mkBranch('b', 'BREAKER', [
      { name: 'Block & Jab', shifts: [s('counter', 10)] },
      { name: 'Catch the Wind-up', shifts: [s('counter', 8)] },
      { name: 'Hard Meet', shifts: [s('counter', 8)] },
      { name: 'Retaliation', shifts: [s('counter', 8)], conditionals: ['retaliate_ramp'] },
      { name: 'Counter Wall', shifts: [s('counter', 10), s('weight', 6)], effects: ['counter_trap'] },
    ]),
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
      { name: 'Perfect Trap', shifts: [s('counter', 12)], effects: ['perfect_trap'] },
    ]),
    mkBranch('b', 'SHADOW', [
      { name: 'Long Slip', shifts: [s('slip', 10)] },
      { name: 'Hard to Reach', shifts: [s('slip', 8), s('distance', 6)] },
      { name: "Run 'Em Ragged", shifts: [s('slip', 8)], conditionals: ['exhaust'] },
      { name: 'Open Window', shifts: [s('slip', 6), s('counter', 6)], conditionals: ['evade_window'] },
      { name: 'Phantom', shifts: [s('slip', 12)], effects: ['phantom'] },
    ]),
    mkBranch('c', 'STING', [
      { name: 'Loaded Hit', shifts: [s('weight', 10)] },
      { name: 'Longer Charge', shifts: [s('weight', 8), s('initiative', -4)], conditionals: ['charge'] },
      { name: 'Hit the Opening', shifts: [s('weight', 8), s('counter', 6)], conditionals: ['vulnerable_strike'] },
      { name: 'Pierce', shifts: [s('weight', 8)], effects: ['pierce'] },
      { name: 'Execution', shifts: [s('weight', 14)], effects: ['execute'] },
    ]),
  ],
};

/* Look up a core by id. One id contract across all three screens — no bridge.
   Fallback to BULWARK (CORES[2]) keeps upgrade/arena sane if the pick is empty
   (the route guard normally blocks that). */
export const getCore = (id) => CORES.find((c) => c.id === id) || CORES[2];
