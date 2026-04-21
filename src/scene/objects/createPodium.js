// Epic 3Bc Step 1 — Create podium stub.
// Disc + ring geometry lands in Step 4. Prototype lines 8913-8930.
// NOT a reuse of hub plinth.js — different geometry (solid disc + torus ring
// vs glass plate with "+"). Pattern: one object = one module (3Ba/3Bb).

export function createPodium(THREE) {
  return new THREE.Group();
}
