// Epic 3Bc Step 1 — Create state + ARCHETYPES constant.
// Module-scoped reactive store (pattern 3A useFightSimulation / 3Ba
// useTrainingState / 3Bb useMatchmakingState). ARCHETYPES is a 1-to-1 port
// of prototype hexlash_v24.html lines 9030-9067.
//
// Handoff §5.3 resolution: 6 archetypes in UI (not 2). makeFighterLowPoly
// only supports warden/predator visual variants currently — archetype id
// drives setArchetypeGlow colour; remaining 4 variants arrive in Epic 4.

import { reactive } from 'vue';

export const ARCHETYPES = [
  {
    id: 'predator', name: 'Predator', short: 'PRE',
    color: 0xFF066F,
    tagline: 'Aggressive striker. Closes distance, trades hard.',
    stats: { aggression: 0.9, patience: 0.3, risk: 0.7 },
  },
  {
    id: 'analyst', name: 'Analyst', short: 'ANA',
    color: 0x4dd9ff,
    tagline: 'Reads the opponent. Counters off mistakes.',
    stats: { aggression: 0.4, patience: 0.85, risk: 0.3 },
  },
  {
    id: 'ghost', name: 'Ghost', short: 'GHO',
    color: 0xA855F7,
    tagline: 'Evasive. Slips, never trades clean.',
    stats: { aggression: 0.35, patience: 0.7, risk: 0.55 },
  },
  {
    id: 'sentinel', name: 'Sentinel', short: 'SEN',
    color: 0x2ee07f,
    tagline: 'Defensive wall. Outlasts. Wins on points.',
    stats: { aggression: 0.25, patience: 0.95, risk: 0.15 },
  },
  {
    id: 'maverick', name: 'Maverick', short: 'MAV',
    color: 0xFFA133,
    tagline: 'Wildcard. High risk, high reward swings.',
    stats: { aggression: 0.75, patience: 0.25, risk: 0.95 },
  },
  {
    id: 'juggernaut', name: 'Juggernaut', short: 'JUG',
    color: 0xD4A843,
    tagline: 'Power-first. Slow but devastating.',
    stats: { aggression: 0.65, patience: 0.5, risk: 0.4 },
  },
];

export const createState = reactive({
  step: 1,               // 1 archetype | 2 name | 3 confirm
  archetypeId: null,     // 'predator' | ... | null
  name: '',
  // creating — Epic 4 Step 5. True from Create-Fighter click until the
  // backend POST /v1/agent/create resolves. Disables the button + shows
  // the "Creating…" label so a slow round-trip can't be re-fired.
  creating: false,
  // materializing — true during the 1.2s opacity lerp that follows a
  // successful create (and the 700 ms pause before navigation). Distinct
  // from `creating` because the visual phases serialise: backend → animate.
  materializing: false,
  // error — Epic 4 Step 5. Inline message rendered under Create Fighter
  // when the backend rejects (validation, roster full, server error, etc).
  // Form state is preserved so the user can edit + retry without losing
  // their archetype/name picks.
  error: null,
});

export function resetCreateState() {
  createState.step = 1;
  createState.archetypeId = null;
  createState.name = '';
  createState.creating = false;
  createState.materializing = false;
  createState.error = null;
}

// Handler wired from HudCreate in Step 8. scene api is injected via deps
// object so this module has no direct dependency on CreateScene instance.
// Epic 4 extension point: `setVariant(id)` for per-archetype fighter mesh.
export function onArchetypeChange(id, { setGlow }) {
  createState.archetypeId = id;
  const a = ARCHETYPES.find((x) => x.id === id);
  if (a && setGlow) setGlow(a.color);
}
