// perfProbe.js — dev-only performance readout for the home ⇄ mode flight.
//
// It exists so the OWNER can take the numbers on a real phone without opening dev
// tools: append ?perf=1 to the address, press FIGHT a few times, read the corner.
//
// Cost when it is off: none. PERF_ON is resolved ONCE at module load, and every
// call site guards on it, so with no query parameter not a single measuring
// statement runs inside the frame loop — the guard is the only thing there.
//
// Reads, and why each one is on the card:
//   FPS n/cap  — the loop is deliberately FPS-CAPPED (60 on a mouse, 30 on touch,
//                see HomeScene), so a phone showing 29/30 is healthy, not slow.
//                Without the cap printed next to it that number reads as a fault.
//   MIN        — the worst frame seen during the LAST flight, as an FPS. This is
//                the honest number for "did the transition stutter".
//   STALL      — whether the low-FPS watchdog rode that flight out early
//                (FLIGHT.lowFpsDt / lowFpsFrames).
//   PLATES     — what the mode plates cost the home scene at init: build time and
//                triangles. This is the figure the "build them lazily instead"
//                decision hangs on.
import { reactive } from 'vue';

export const PERF_ON = (() => {
  try {
    return new URLSearchParams(window.location.search).get('perf') === '1';
  } catch {
    return false; // no window / malformed query — stay off, never throw on boot
  }
})();

export const perfState = reactive({
  fps: 0,
  cap: 0,             // the loop's own FPS cap, so `fps` can be read in context
  minFps: 0,          // worst frame of the LAST flight, expressed as FPS
  stalled: false,     // …and whether the watchdog cut that flight short
  flights: 0,
  plateBuildMs: 0,    // buildModePlates() wall time at scene init
  plateTris: 0,       // triangles the plates ADD to the home scene …
  plateHiddenTris: 0, // … of which this many are the invisible pick boxes (not drawn)
});

let acc = 0;
let frames = 0;
let worstDt = 0;

/** Per-frame sample. Guard the call with PERF_ON. */
export function perfFrame(dt, flying) {
  acc += dt;
  frames += 1;
  if (acc >= 0.5) { // half-second window — steady enough to read off a phone
    perfState.fps = Math.round(frames / acc);
    acc = 0;
    frames = 0;
  }
  if (flying && dt > worstDt) worstDt = dt;
}

export function perfFlightStart() {
  worstDt = 0;
  perfState.stalled = false;
}

export function perfFlightEnd(stalled) {
  perfState.flights += 1;
  perfState.minFps = worstDt > 0 ? Math.round(1 / worstDt) : 0;
  perfState.stalled = !!stalled;
}

export function setPerfCap(cap) { perfState.cap = cap; }

export function setPlateCost(ms, tris, hiddenTris) {
  perfState.plateBuildMs = Math.round(ms * 100) / 100;
  perfState.plateTris = tris;
  perfState.plateHiddenTris = hiddenTris;
}

/**
 * Triangles a subtree adds to the scene, split into drawn and not-drawn. Lines
 * (the plate rims) and sprites are skipped — neither is a triangle cost worth
 * reporting, and the pick boxes have material.visible=false so they never draw.
 */
export function countTriangles(root) {
  let drawn = 0;
  let hidden = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    const n = g.index
      ? g.index.count / 3
      : (g.attributes.position ? g.attributes.position.count / 3 : 0);
    if (o.material && o.material.visible === false) hidden += n;
    else drawn += n;
  });
  return { drawn: Math.round(drawn), hidden: Math.round(hidden) };
}
