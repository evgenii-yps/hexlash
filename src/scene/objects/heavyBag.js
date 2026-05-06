// Epic 2 — pit-view hub. Step 10.
// Heavy bag: training interactable. Swaying bag on a chain, far left of the ring.
// Source: prototype lines 5526-5575 (geometry) + 7267-7269 (sway in render tick).
//
// Caller is responsible for:
//   - scene.add(bag) — this file returns the Group, does not attach
//   - per-frame sway: bag.rotation.x = sin(t*0.7)*0.025; bag.rotation.z = cos(t*0.55)*0.018
//   - optional dedicated spotlight (see PitScene — prototype 5577-5581)
//
// Pre-seeded userData.isClickable + id for Steps 16 (raycaster) and 17 (clicks).

/**
 * Build the heavy bag interactable.
 * @param {import('three')} THREE
 * @returns {import('three').Group} heavy bag, positioned at (-8, 0, 3)
 */
export function buildHeavyBag(THREE) {
  const heavyBag = new THREE.Group();

  // Chain (5 torus links, alternating rotation to suggest interlocking)
  const chainMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a32, roughness: 0.5, metalness: 0.7,
  });
  for (let i = 0; i < 5; i++) {
    const link = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.022, 6, 12),
      chainMat,
    );
    link.position.y = 3.6 - i * 0.12;
    link.rotation.x = (i % 2) * Math.PI / 2;
    heavyBag.add(link);
  }

  // Bag body — cylinder + two hemispheres to make a capsule
  const bagMat = new THREE.MeshStandardMaterial({
    color: 0x222226, roughness: 0.85, metalness: 0.15,
  });
  const bagBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 1.5, 24),
    bagMat,
  );
  bagBody.position.y = 2.25;
  bagBody.castShadow = true;
  heavyBag.add(bagBody);

  const bagTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    bagMat,
  );
  bagTop.position.y = 3.0;
  bagTop.castShadow = true;
  heavyBag.add(bagTop);

  const bagBot = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    bagMat,
  );
  bagBot.position.y = 1.5;
  bagBot.castShadow = true;
  heavyBag.add(bagBot);

  // Canvas seam strap — thin band around the top
  const strap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.325, 0.325, 0.08, 24),
    new THREE.MeshStandardMaterial({
      color: 0x111114, roughness: 0.9, metalness: 0.1,
    }),
  );
  strap.position.y = 2.85;
  heavyBag.add(strap);

  // Place far left, outside the ring
  heavyBag.position.set(-8, 0, 3);
  heavyBag.userData.isClickable = true;
  heavyBag.userData.id = 'training';

  return heavyBag;
}
