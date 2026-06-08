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
   carries three lists — EMPTY this pass (the resolver reads them uniformly so
   the wiring is done; numbers land in a later pass, behaviourally a no-op until
   then):
     shifts       — flat lever changes, each { axis, delta }: axis ∈ behaviour
                    AXES, delta added to the 0..100 lever, result clamped.
     conditionals — shifts that fire on a condition / accrue over a fight
                    (template types — defined later).
     effects      — tagged tricks (branch tips, feints) — coded point-by-point. */
function mkFaces(names, states) {
  return names.map((nm, i) => ({
    id: i + 1, name: nm, state: states[i], shifts: [], conditionals: [], effects: [],
  }));
}

/* CRYSTALS[coreId] = [{ id, name, limit, faces:[{ id, name, state }] }]
   limit — per-crystal cap on how many facets can be lit.
   Double-clamp: per-crystal `limit` + global RESOURCE pool. Content = stub. */
export const CRYSTALS = {
  natisk: [
    { id: 'a', name: 'PUSH', limit: 3,
      faces: mkFaces(['EDGE', 'SPIKE', 'RAM', 'CRASH', 'BREAK'], ['lit', 'lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'LOCK', limit: 2,
      faces: mkFaces(['GRIP', 'HOLD', 'PIN', 'SEAL'], ['lit', 'open', 'open', 'locked']) },
    { id: 'c', name: 'TEMPO', limit: 3,
      faces: mkFaces(['BEAT', 'DRIVE', 'SURGE', 'BURN', 'OVERRUN'], ['open', 'open', 'open', 'locked', 'locked']) },
  ],
  nalet: [
    { id: 'a', name: 'RAID', limit: 3,
      faces: mkFaces(['DASH', 'SLASH', 'HIT', 'TAG', 'CUT'], ['lit', 'open', 'open', 'open', 'locked']) },
    { id: 'b', name: 'BREAK', limit: 2,
      faces: mkFaces(['SPLIT', 'SLIP', 'PEEL', 'GHOST'], ['lit', 'lit', 'open', 'locked']) },
    { id: 'c', name: 'FAKE', limit: 2,
      faces: mkFaces(['JAB', 'FEINT', 'BAIT', 'LURE'], ['open', 'open', 'open', 'locked']) },
    { id: 'd', name: 'TOUCH', limit: 3,
      faces: mkFaces(['TAP', 'MARK', 'TRACE', 'PRICK'], ['open', 'open', 'locked', 'locked']) },
  ],
  skala: [
    { id: 'a', name: 'CRUST', limit: 3,
      faces: mkFaces(['SHELL', 'PLATE', 'SLAB', 'WALL', 'BUNKER'], ['lit', 'lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'GRIND', limit: 2,
      faces: mkFaces(['WEAR', 'TOLL', 'DRAG', 'DRAIN'], ['lit', 'open', 'open', 'locked']) },
    { id: 'c', name: 'ANCHOR', limit: 3,
      faces: mkFaces(['ROOT', 'HOLD', 'SET', 'BIND', 'MOOR'], ['open', 'open', 'open', 'locked', 'locked']) },
  ],
  zasada: [
    { id: 'a', name: 'HUSH', limit: 2,
      faces: mkFaces(['STILL', 'VEIL', 'SHADE', 'MUTE'], ['lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'SNARE', limit: 3,
      faces: mkFaces(['HOOK', 'WIRE', 'CATCH', 'TRIP', 'NET'], ['lit', 'open', 'open', 'open', 'locked']) },
    { id: 'c', name: 'PAYBACK', limit: 2,
      faces: mkFaces(['REPAY', 'TOLL', 'MARK'], ['open', 'open', 'locked']) },
  ],
};

/* Look up a core by id. One id contract across all three screens — no bridge.
   Fallback to BULWARK (CORES[2]) keeps upgrade/arena sane if the pick is empty
   (the route guard normally blocks that). */
export const getCore = (id) => CORES.find((c) => c.id === id) || CORES[2];
