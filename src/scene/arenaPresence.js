// Presence layer for the arena — drives the rift-glow pulse + the rising sparks.
// Single state (the former "Clean platform" mood A): restrained whole-rift
// breathing, manual orbit only. The MOOD A/B/C switcher + the B/C extras
// (ambient dust, hex-cell pulse bands, idle camera drift) were removed — B/C
// were visually indistinguishable from A, so the arena is one state now.
//
// The rift glow (core + halo + walls + contour + sparks, built in buildArena)
// pulses AS ONE — no beam runs along the line. Sparks rise from the chasm.
// Discipline: one pink (#FF0069 from --hex-primary), one glow (the rift). Under
// prefers-reduced-motion the glow holds static at its lit peak and all motion
// (pulse / sparks) stops.

export function createArenaPresence(scene, refs) {
  const { riftGlow, sparks } = refs;
  const sparkPosAttr = sparks.points.geometry.attributes.position;

  let reduced = false;

  // Sparks belong to the rift — visible in motion, hidden when reduced-motion
  // holds the rift static.
  const applyVisibility = () => { sparks.points.visible = !reduced; };
  const setReducedMotion = (b) => { reduced = b; applyVisibility(); };

  // Whole-rift breathing — slow, restrained (the former variant A).
  const breath = { c: 0.91, a: 0.09, w: (Math.PI * 2) / 5.0 };

  // Transient flash of the whole rift when a fighter lands a hit at the seam
  // (same pink, no second colour). Decays over ~0.32s; added on top of the
  // breathing factor.
  let lastT = 0;
  let flashAmt = 0;
  let flashStart = 0;
  const triggerFlash = (a = 0.55) => { flashAmt = a; flashStart = lastT; };

  const update = (t) => {
    lastT = t;
    // Rift pulse — one factor for the whole glow (no running beam).
    const f = reduced ? 1 : breath.c + breath.a * Math.sin(t * breath.w);
    const flash = (!reduced && flashAmt > 0) ? flashAmt * Math.max(0, 1 - (t - flashStart) / 0.32) : 0;
    for (let i = 0; i < riftGlow.length; i++) riftGlow[i].mat.opacity = riftGlow[i].base * (f + flash);

    if (reduced) return; // static lit state, no sparks motion

    // Sparks rising out of the chasm (deterministic, wrap at the top).
    for (let i = 0; i < sparks.count; i++) {
      const y = sparks.yMin + ((t * sparks.sSpeed[i] + sparks.sPhase[i]) % sparks.span);
      sparks.position[i * 3 + 1] = y;
    }
    sparkPosAttr.needsUpdate = true;
  };

  // Sparks + rift glow are owned by buildArena — nothing presence-local to free.
  const dispose = () => {};

  return { setReducedMotion, triggerFlash, update, dispose };
}
