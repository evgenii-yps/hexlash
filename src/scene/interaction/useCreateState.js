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
  materializing: false,  // true during 1.2s opacity lerp
});

export function resetCreateState() {
  createState.step = 1;
  createState.archetypeId = null;
  createState.name = '';
  createState.materializing = false;
}

// Handler wired from HudCreate in Step 8. scene api is injected via deps
// object so this module has no direct dependency on CreateScene instance.
// Epic 4 extension point: `setVariant(id)` for per-archetype fighter mesh.
export function onArchetypeChange(id, { setGlow }) {
  createState.archetypeId = id;
  const a = ARCHETYPES.find((x) => x.id === id);
  if (a && setGlow) setGlow(a.color);
}
