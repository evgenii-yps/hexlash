/* HEXLASH — upgrade screen · CONTENT (stubs · game design owns final copy).
   Ported 1:1 from upgrade_handoff/data.js (content block). Core/crystal/face
   names, numbers and limits are working stubs. Core ids go into the store — DO
   NOT CHANGE. The game is English-only; all visible copy is EN. */

/* RESOURCE — shared core point pool. Split across all crystals. */
export const RESOURCE = 5;

/* The four cores — SINGLE source for all three screens (select → upgrade →
   arena). id — DO NOT CHANGE (goes into the store; read by the arena as-is).
   ix  — core index (select card «CORE 0N»).
   name — display name (EN, same on upgrade and arena).
   sig — signature force, one word (select card subtitle).
   hue — core's primary colour (the whole screen tints to it via --core).
   sup — supporting tone (lower glow layer of the core, inner drawing). */
export const CORES = [
  { id: 'natisk', ix: '01', name: 'ONSLAUGHT', sig: 'PRESSURE', hue: '#FF3344', sup: '#FF7A3D',
    manner: 'Marches in close and never lets the distance go.' },
  { id: 'nalet', ix: '02', name: 'RAIDER', sig: 'TEMPO', hue: '#FFA526', sup: '#FFD93D',
    manner: 'Strikes, drops, strikes again — a series of touches, then gone.' },
  { id: 'skala', ix: '03', name: 'BULWARK', sig: 'DURABILITY', hue: '#2ED6B0', sup: '#5DD6E6',
    manner: 'Takes the hit, grinds it down, gives it back later.' },
  { id: 'zasada', ix: '04', name: 'AMBUSH', sig: 'COUNTER', hue: '#9461FF', sup: '#D461FF',
    manner: 'Waits in silence, then a single, paid-in-full strike.' },
];

/* face: { id, name, state }   state ∈ 'lit' | 'open' | 'locked'  — DO NOT rename states */
function mkFaces(states) {
  return states.map((s, i) => ({ id: i + 1, name: 'Facet ' + String(i + 1).padStart(2, '0'), state: s }));
}

/* CRYSTALS[coreId] = [{ id, name, limit, faces:[...] }]
   limit — crystal's own cap (how many faces it will ever let you light).
   Double limiter: crystal limit + the core's shared RESOURCE. */
export const CRYSTALS = {
  natisk: [
    { id: 'a', name: 'Drive', limit: 3, faces: mkFaces(['lit', 'lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'Clinch', limit: 2, faces: mkFaces(['lit', 'open', 'open', 'locked']) },
    { id: 'c', name: 'Tempo', limit: 3, faces: mkFaces(['open', 'open', 'open', 'locked', 'locked']) },
  ],
  nalet: [
    { id: 'a', name: 'Raid', limit: 3, faces: mkFaces(['lit', 'open', 'open', 'open', 'locked']) },
    { id: 'b', name: 'Break', limit: 2, faces: mkFaces(['lit', 'lit', 'open', 'locked']) },
    { id: 'c', name: 'Feint', limit: 2, faces: mkFaces(['open', 'open', 'open', 'locked']) },
    { id: 'd', name: 'Touch', limit: 3, faces: mkFaces(['open', 'open', 'locked', 'locked']) },
  ],
  skala: [
    { id: 'a', name: 'Crust', limit: 3, faces: mkFaces(['lit', 'lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'Grind', limit: 2, faces: mkFaces(['lit', 'open', 'open', 'locked']) },
    { id: 'c', name: 'Anchor', limit: 3, faces: mkFaces(['open', 'open', 'open', 'locked', 'locked']) },
  ],
  zasada: [
    { id: 'a', name: 'Silence', limit: 2, faces: mkFaces(['lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'Trap', limit: 3, faces: mkFaces(['lit', 'open', 'open', 'open', 'locked']) },
    { id: 'c', name: 'Payback', limit: 2, faces: mkFaces(['open', 'open', 'locked']) },
  ],
};

/* Look up a core by id. One id contract (natisk / nalet / skala / zasada) across
   all three screens — no bridge anymore. Fallback to BULWARK (CORES[2]) keeps
   the upgrade/arena sane if the pick is somehow empty (the route guard normally
   blocks that). */
export const getCore = (id) => CORES.find((c) => c.id === id) || CORES[2];
