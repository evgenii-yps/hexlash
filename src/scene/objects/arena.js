// Epic 2 — pit-view hub. Step 6.
// Octagonal ring: platform + outer floor + 8 posts + 3 ropes per side + cage.
// Source: prototype lines 5161-5319.
// PATCH_EPIC2_STEPS_5_8.md applied:
//   - Two SEPARATE concrete textures: platformTex (repeat 1,1) and floorTex (repeat 6,6).
//     Created in PitScene.js, passed in via opts.
//   - Floor moved from PitScene.js (Step 3 temp) into here.

export const RING_RADIUS = 4.2;
export const RING_HEIGHT = 0.6;
export const POST_HEIGHT = 2.4;
export const ROPE_HEIGHTS = [0.55, 1.15, 1.75];

export function buildArena(scene, THREE, { platformTex, floorTex, metalTex }) {
  const arena = new THREE.Group();
  scene.add(arena);

  const sides = 8;
  // Octagon vertices: flat-top so flat sides face the camera diagonally.
  const vertices = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + Math.PI / sides;
    vertices.push(new THREE.Vector2(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS));
  }

  // --- PLATFORM (concrete, octagonal, raised) ---
  const platformShape = new THREE.Shape();
  vertices.forEach((v, i) => {
    i === 0 ? platformShape.moveTo(v.x, v.y) : platformShape.lineTo(v.x, v.y);
  });
  platformShape.closePath();
  const platformGeom = new THREE.ExtrudeGeometry(platformShape, {
    depth: RING_HEIGHT,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 2,
  });
  platformGeom.rotateX(-Math.PI / 2);
  const platform = new THREE.Mesh(
    platformGeom,
    new THREE.MeshStandardMaterial({
      map: platformTex,
      color: 0xb8b8c0,
      roughness: 0.92,
      metalness: 0.05,
    }),
  );
  platform.receiveShadow = true;
  platform.castShadow = false; // by prototype design — see Step 6 report.
  arena.add(platform);

  // --- OUTER FLOOR (concrete tiles 6×6, room-wide) ---
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      color: 0x2c2c34,
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  arena.add(floor);

  // --- POSTS (8 brushed-steel cylinders + sphere caps) ---
  const postMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    color: 0x4a4d58,
    roughness: 0.4,
    metalness: 0.85,
  });
  vertices.forEach((v) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.10, POST_HEIGHT, 16),
      postMat,
    );
    post.position.set(v.x, RING_HEIGHT + POST_HEIGHT / 2, v.y);
    post.castShadow = true;
    arena.add(post);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 12),
      postMat,
    );
    cap.position.set(v.x, RING_HEIGHT + POST_HEIGHT, v.y);
    cap.castShadow = true;
    arena.add(cap);
  });

  // --- ROPES (3 levels between adjacent posts) ---
  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22,
    roughness: 0.6,
    metalness: 0.3,
  });
  for (let i = 0; i < sides; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % sides];
    const dx = b.x - a.x;
    const dz = b.y - a.y;
    const len = Math.sqrt(dx * dx + dz * dz);
    ROPE_HEIGHTS.forEach((h) => {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, len, 8),
        ropeMat,
      );
      rope.position.set((a.x + b.x) / 2, RING_HEIGHT + h, (a.y + b.y) / 2);
      // Cylinder length axis = Y; lookAt next post then rotate 90° on X to align.
      rope.lookAt(b.x, RING_HEIGHT + h, b.y);
      rope.rotateX(Math.PI / 2);
      arena.add(rope);
    });
  }

  // --- CAGE (4 horizontal bars + verticals every ~0.32 along each side) ---
  const cageBarMat = new THREE.MeshStandardMaterial({
    color: 0x3a3d48,
    roughness: 0.55,
    metalness: 0.6,
  });
  const cageTopY = RING_HEIGHT + POST_HEIGHT - 0.05;
  const cageBotY = RING_HEIGHT + ROPE_HEIGHTS[ROPE_HEIGHTS.length - 1] + 0.15;
  for (let i = 0; i < sides; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % sides];
    const dx = b.x - a.x;
    const dz = b.y - a.y;
    const len = Math.sqrt(dx * dx + dz * dz);
    const midX = (a.x + b.x) / 2;
    const midZ = (a.y + b.y) / 2;

    const horizCount = 4;
    for (let h = 0; h < horizCount; h++) {
      const y = cageBotY + (cageTopY - cageBotY) * (h / (horizCount - 1));
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, len, 6),
        cageBarMat,
      );
      bar.position.set(midX, y, midZ);
      bar.lookAt(b.x, y, b.y);
      bar.rotateX(Math.PI / 2);
      arena.add(bar);
    }

    const vertCount = Math.max(2, Math.round(len / 0.32));
    for (let v = 1; v < vertCount; v++) {
      const t = v / vertCount;
      const x = a.x + dx * t;
      const z = a.y + dz * t;
      const vbar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.010, cageTopY - cageBotY, 6),
        cageBarMat,
      );
      vbar.position.set(x, (cageTopY + cageBotY) / 2, z);
      arena.add(vbar);
    }
  }

  return { arena, vertices };
}
