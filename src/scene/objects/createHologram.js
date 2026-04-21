// Epic 3Bc — Holo fighter + setHologram utility.
// Prototype 8937-8945 (setHologram) + 8935 (fighter spawn).
// ONLY transparent + opacity — no emissive / fresnel / rim shader. Handoff
// §5.4 was wrong on that; see EPIC3Bb_FINAL_REPORT §5 for the correction.
// Array material check is mandatory — accessories may carry Array<material>
// and traverse must not touch them (would crash on .transparent assignment).
// materialize lerp lands in Step 10.

import { makeFighterLowPoly } from './fighterModel.js';

export const HOLO_ALPHA_INITIAL = 0.35;

// --- MATERIALIZE (prototype 9231-9258) ---
// Opacity lerp from dim hologram to solid fighter + a brief pause before
// the caller's onDone fires. Linear easing — prototype 9242 uses plain
// `0.35 + (1.0 - 0.35) * t`. DOM flash overlay is the caller's concern
// (HudCreate triggers via .flash class toggle) — this module only owns
// the 3D side.
export const MATERIALIZE_FROM = 0.35;
export const MATERIALIZE_TO = 1.0;
export const MATERIALIZE_DURATION_MS = 1200;
export const MATERIALIZE_PAUSE_MS = 700;

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

// startMaterializeAnimation — owned by the caller (HudCreate / CreateView).
// Returns { cancel() }; caller must invoke cancel() on unmount or if the
// user aborts via Esc/Back mid-lerp, otherwise a stray requestAnimationFrame
// tick + setTimeout onDone could navigate after the view is disposed.
// Pattern symmetric to 3Bb startSearchLogAnimation cancel handle.
export function startMaterializeAnimation(
  group,
  fromAlpha,
  toAlpha,
  durationMs,
  { onDone } = {},
) {
  const startT = performance.now();
  let cancelled = false;
  let rafId = null;
  let timeoutId = null;

  function step() {
    if (cancelled) return;
    const t = Math.min(1, (performance.now() - startT) / durationMs);
    const alpha = fromAlpha + (toAlpha - fromAlpha) * t;
    setHologram(group, alpha);
    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      // Prototype 9247-9255 — pause 700ms before caller's onDone (which
      // in v2 navigates to /v2 hub via router.push).
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (!cancelled && onDone) onDone();
      }, MATERIALIZE_PAUSE_MS);
    }
  }

  rafId = requestAnimationFrame(step);

  return {
    cancel() {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      rafId = null;
      timeoutId = null;
    },
  };
}
