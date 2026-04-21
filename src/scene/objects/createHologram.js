// Epic 3Bc Step 1 — Holo fighter + setHologram utility stub.
// Prototype 8937-8945: ONLY transparent + opacity, no emissive/fresnel.
// Array material check is mandatory — accessories may carry Array<material>.
// Full fighter factory + breathing animation land in Step 5.
// materialize lerp lands in Step 10.

import { makeFighterLowPoly } from './fighterModel.js';

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
  // colours the space around the fighter (Step 6) while all 6 archetype ids
  // currently share the warden mesh. Epic 4 extends with real variants.
  const fighter = makeFighterLowPoly(THREE);
  setHologram(fighter, 0.35);
  return fighter;
}
