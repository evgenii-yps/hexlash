// Epic 3Bc — Holo fighter + setHologram utility.
// Prototype 8937-8945 (setHologram) + 8935 (fighter spawn).
// ONLY transparent + opacity — no emissive / fresnel / rim shader. Handoff
// §5.4 was wrong on that; see EPIC3Bb_FINAL_REPORT §5 for the correction.
// Array material check is mandatory — accessories may carry Array<material>
// and traverse must not touch them (would crash on .transparent assignment).
// materialize lerp lands in Step 10.

import { makeFighterLowPoly } from './fighterModel.js';

export const HOLO_ALPHA_INITIAL = 0.35;

export function setHologram(group, alpha) {
  group.traverse((o) => {
    if (o.material && !Array.isArray(o.material)) {
      o.material.transparent = true;
      o.material.opacity = alpha;
    }
  });
}

export function makeHoloFighter(THREE) {
  // Default variant = warden (makeFighterLowPoly unchanged). Archetype glow
  // (Step 6) colours the space around the fighter while all 6 archetype
  // ids currently share the warden mesh. Epic 4 extends with real variants
  // via a variant parameter through makeFighterLowPoly.
  const fighter = makeFighterLowPoly(THREE);
  setHologram(fighter, HOLO_ALPHA_INITIAL);
  return fighter;
}
