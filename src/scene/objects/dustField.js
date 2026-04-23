// Epic 5 — Sub-Epic 5A Step 4.
// Shared dust-field builder: N additive-blended particles drifting upward,
// resetting to yMin once they cross yMax. Used by Training / Matchmaking /
// Create (each with scene-specific params).
//
// Distribution is independent per axis — Matchmaking uses asymmetric
// bounds (xRadius=4 / zRadius=3 with zOffset=-1) behind its CRT terminal;
// Training and Create use symmetric square bounds. Signature extended
// beyond the original 5A plan (scalar xzRadius) once Step 4 surfaced the
// MM asymmetry; see EPIC5_FINAL_REPORT §5 for the drift note.
//
// Returned `tick()` mutates the BufferAttribute in place. Zero per-tick
// allocations: positions Float32Array is reused and only the Y channel
// (i*3 + 1) is touched each frame.

export function createDustField(THREE, {
  count,
  xRadius,
  zRadius = xRadius,
  xOffset = 0,
  zOffset = 0,
  yMin = 0.3,
  yMax,
  yInitSpread = yMax - yMin,
  driftSpeed,
  color,
  size = 0.03,
  opacity = 0.45,
}) {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * (xRadius * 2) + xOffset;
    positions[i * 3 + 1] = Math.random() * yInitSpread + yMin;
    positions[i * 3 + 2] = (Math.random() - 0.5) * (zRadius * 2) + zOffset;
  }
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const group = new THREE.Points(geom, material);

  function tick() {
    const p = geom.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3 + 1] += driftSpeed;
      if (p[i * 3 + 1] > yMax) p[i * 3 + 1] = yMin;
    }
    geom.attributes.position.needsUpdate = true;
  }

  return { group, tick };
}
