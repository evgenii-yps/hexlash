// Epic 5 — Sub-Epic 5A Step 1.
// Shared octagonal-room builder: floor disc + 8 planar walls + optional fog.
// Used by Training / Matchmaking / Create scenes (PitScene has its own with a
// ceiling and is not covered here).
//
// Scene owns material creation. Concrete-texture repeat is shared state on
// the Texture object (see materials/concrete.js note) — each scene MUST build
// its own texture instance. Helper is geometry-only.

export function buildOctagonalRoom(THREE, scene, {
  R = 14,
  H = 8,
  floorRadius,
  floorMaterial,
  wallMaterial,
  wallSegments = 8,
  fogColor = 0x070811,
  fogDensity,
  receiveShadow = true,
}) {
  if (typeof fogDensity === 'number') {
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);
  }

  // Floor disc — rotated flat, sits at y=0.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(floorRadius, 64),
    floorMaterial,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = receiveShadow;
  scene.add(floor);

  // Wall ring — N planar segments facing the origin. Each plane spans the
  // chord between two adjacent vertices of the regular N-gon inscribed in R.
  const walls = [];
  for (let i = 0; i < wallSegments; i++) {
    const a1 = (i / wallSegments) * Math.PI * 2;
    const a2 = ((i + 1) / wallSegments) * Math.PI * 2;
    const x1 = Math.cos(a1) * R, z1 = Math.sin(a1) * R;
    const x2 = Math.cos(a2) * R, z2 = Math.sin(a2) * R;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(wallLen, H),
      wallMaterial,
    );
    wall.position.set((x1 + x2) / 2, H / 2, (z1 + z2) / 2);
    wall.lookAt(0, H / 2, 0);
    scene.add(wall);
    walls.push(wall);
  }

  return { floor, walls };
}
