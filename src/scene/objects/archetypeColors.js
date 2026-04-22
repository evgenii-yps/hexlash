// Epic 4 Step 6 — shared archetype-glow colour resolver.
// Extracted from PitScene where Step 2 introduced it; FighterDetailScene
// also needs it now (dynamic FD picks glow from agent.primaryModule).
//
// Resolution order:
//   1. legacy 'warden' / 'predator' mock keys (used by hub fallback +
//      legacy /v2/fd/warden|predator routes);
//   2. one of the 6 backend archetypes (predator/sentinel/ghost/analyst/
//      maverick/juggernaut) via the ARCHETYPES table from useCreateState;
//   3. fallback to warden gold for null / unknown ids (e.g. agent created
//      without a primaryModule picked).

import { ARCHETYPES } from '../interaction/useCreateState.js';

export const LEGACY_ARCHETYPE_COLORS = {
  warden:   0xD4A843, // gold
  predator: 0xFF066F, // neon pink
};

export function pickFighterColor(archetypeId) {
  if (LEGACY_ARCHETYPE_COLORS[archetypeId] !== undefined) {
    return LEGACY_ARCHETYPE_COLORS[archetypeId];
  }
  const a = ARCHETYPES.find((x) => x.id === archetypeId);
  return a ? a.color : LEGACY_ARCHETYPE_COLORS.warden;
}
