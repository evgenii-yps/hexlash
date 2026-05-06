// Epic 3Ba Step 4 — Training heavy bag (large, centered).
// Source: prototype hexlash_v24.html lines 9616-9666.
//
// NOT the hub `heavyBag.js` — hub version is smaller and side-positioned.
// Pattern Эпика 2 — один объект = один модуль, not shared config.

export function buildTrainingBag(THREE) {
  const bag = new THREE.Group();

  // --- 6-link visible chain (torus segments alternating 90°) ---
  const chainMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a32, roughness: 0.5, metalness: 0.7,
  });
  for (let i = 0; i < 6; i++) {
    const link = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.025, 6, 12),
      chainMat,
    );
    link.position.y = 4.0 - i * 0.14;
    link.rotation.x = (i % 2) * Math.PI / 2;
    bag.add(link);
  }

  // --- Body + top/bot hemispheres (shared material) ---
  const bagMat = new THREE.MeshStandardMaterial({
    color: 0x222226, roughness: 0.85, metalness: 0.15,
  });

  const bagBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 1.9, 24),
    bagMat,
  );
  bagBody.position.y = 2.0;
  bagBody.castShadow = true;
  bag.add(bagBody);

  // Top hemisphere: phiStart=0, phiLength=π/2 (upper half along Y).
  const bagTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    bagMat,
  );
  bagTop.position.y = 2.95;
  bagTop.castShadow = true;
  bag.add(bagTop);

  // Bottom hemisphere: phiStart=π/2, phiLength=π/2 (lower half).
  const bagBot = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    bagMat,
  );
  bagBot.position.y = 1.05;
  bagBot.castShadow = true;
  bag.add(bagBot);

  // --- 2 straps (darker, wider than body so they read as overlay) ---
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x111114, roughness: 0.9, metalness: 0.1,
  });
  const strap1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.10, 24),
    strapMat,
  );
  strap1.position.y = 2.80;
  bag.add(strap1);

  const strap2 = strap1.clone();
  strap2.position.y = 1.20;
  bag.add(strap2);

  bag.position.set(0, 0, 0);
  return bag;
}
