// Epic 2 — pit-view hub. Steps 4-5.
// Beams (4), hanging lamps (3), drain grate (32 slots),
// crowd silhouettes (18 figures), ground fog (80 points).
// Sources:
//   - lines 5365-5394 (beams + makeBeam)
//   - lines 5396-5459 (makeHangingLamp + 3 lamps)
//   - lines 5461-5477 (drain grate)
//   - lines 5481-5521 (crowd: makeCrowdFigure + 18 anchors)
//   - lines 6016-6031 (ground fog) — see PATCH_EPIC2_STEPS_5_8.md
//
// Решение по структуре: создаём внутреннюю group `env` (как в прототипе),
// добавляем её в scene. Балки/лампы/решётка/толпа/пыль — внутри env.

const ROOM_WALL_HEIGHT = 9;
const ROOM_RADIUS = 18;

function makeBeam(THREE, length, beamMat) {
  const beamGroup = new THREE.Group();
  // top flange
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.08, 0.4),
    beamMat,
  );
  top.position.y = 0.2;
  // bottom flange
  const bot = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.08, 0.4),
    beamMat,
  );
  bot.position.y = -0.2;
  // web
  const web = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.4, 0.06),
    beamMat,
  );
  beamGroup.add(top, bot, web);
  return beamGroup;
}

function makeHangingLamp(THREE, env, x, z, intensity, color) {
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x14141c,
    roughness: 0.6,
    metalness: 0.4,
  });
  // stem from ceiling
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8),
    stemMat,
  );
  stem.position.set(x, ROOM_WALL_HEIGHT - 1.1, z);
  env.add(stem);
  // shade — open-bottom cone, dark outside
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 0.55, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1a1c24,
      roughness: 0.7,
      metalness: 0.6,
      side: THREE.DoubleSide,
    }),
  );
  shade.position.set(x, ROOM_WALL_HEIGHT - 2.3, z);
  shade.rotation.x = Math.PI; // point down
  env.add(shade);
  // shade interior (emissive — the "lit" inner side)
  const shadeInside = new THREE.Mesh(
    new THREE.ConeGeometry(0.43, 0.50, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.4,
    }),
  );
  shadeInside.position.set(x, ROOM_WALL_HEIGHT - 2.3, z);
  shadeInside.rotation.x = Math.PI;
  env.add(shadeInside);
  // bulb (emissive sphere)
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 12, 8),
    new THREE.MeshBasicMaterial({ color }),
  );
  bulb.position.set(x, ROOM_WALL_HEIGHT - 2.45, z);
  env.add(bulb);
  // downward spot light
  const spot = new THREE.SpotLight(color, intensity, 14, Math.PI * 0.35, 0.6, 1.4);
  spot.position.set(x, ROOM_WALL_HEIGHT - 2.4, z);
  spot.target.position.set(x, 0, z);
  env.add(spot);
  env.add(spot.target);
  // light cone visualization (volumetric fake)
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, ROOM_WALL_HEIGHT - 2.4, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.045,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  cone.position.set(x, (ROOM_WALL_HEIGHT - 2.4) / 2, z);
  env.add(cone);
  return spot;
}

export function buildEnvironment(scene, THREE) {
  const env = new THREE.Group();
  scene.add(env);

  // ---- CEILING BEAMS (4 crossing I-beams)
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c24,
    roughness: 0.7,
    metalness: 0.5,
  });
  for (let i = -1; i <= 1; i += 2) {
    const beamX = makeBeam(THREE, ROOM_RADIUS * 2, beamMat);
    beamX.position.set(0, ROOM_WALL_HEIGHT - 0.4, i * 5);
    env.add(beamX);
    const beamZ = makeBeam(THREE, ROOM_RADIUS * 2, beamMat);
    beamZ.position.set(i * 5, ROOM_WALL_HEIGHT - 0.4, 0);
    beamZ.rotation.y = Math.PI / 2;
    env.add(beamZ);
  }

  // ---- HANGING LAMPS (3)
  makeHangingLamp(THREE, env, 0, 0, 1.4, 0xfff0e0);
  makeHangingLamp(THREE, env, -3.5, 1, 0.8, 0xffe0c0);
  makeHangingLamp(THREE, env, 3.5, -1, 0.8, 0xffe0c0);

  // ---- FLOOR DRAINAGE GRATE (32 slots between R=5.0 and R=5.7)
  const grateMat = new THREE.MeshStandardMaterial({
    color: 0x06060c,
    roughness: 1.0,
    metalness: 0.0,
  });
  const grateInnerR = 5.0;
  const grateOuterR = 5.7;
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const r = (grateInnerR + grateOuterR) / 2;
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.02, 0.12),
      grateMat,
    );
    slot.position.set(Math.cos(a) * r, 0.005, Math.sin(a) * r);
    slot.rotation.y = -a;
    env.add(slot);
  }

  // ---- CROWD SILHOUETTES (18 figures, loose semicircle behind ring)
  const crowdAnchors = [
    { ang: -2.6, r: 8.5 }, { ang: -2.3, r: 9.0 }, { ang: -2.0, r: 8.2 },
    { ang: -1.7, r: 9.3 }, { ang: -1.4, r: 8.6 }, { ang: -1.1, r: 8.9 },
    { ang: -0.8, r: 9.1 }, { ang: -0.4, r: 8.4 }, { ang: 0.0,  r: 9.2 },
    { ang: 0.4,  r: 8.7 }, { ang: 0.8,  r: 9.0 }, { ang: 1.1,  r: 8.5 },
    { ang: 1.4,  r: 8.8 }, { ang: 1.7,  r: 9.4 }, { ang: 2.0,  r: 8.3 },
    { ang: 2.3,  r: 9.1 }, { ang: 2.6,  r: 8.6 }, { ang: 3.0,  r: 9.0 },
  ];
  const crowdGroup = new THREE.Group();
  crowdAnchors.forEach((p) => {
    const x = Math.cos(p.ang) * p.r + (Math.random() - 0.5) * 0.6;
    const z = Math.sin(p.ang) * p.r + (Math.random() - 0.5) * 0.6;
    const scale = 0.9 + Math.random() * 0.25;
    crowdGroup.add(makeCrowdFigure(THREE, x, z, scale));
  });
  env.add(crowdGroup);

  // ---- GROUND FOG (80 points, low stratum)
  // PATCH_EPIC2_STEPS_5_8.md — explicit params.
  const groundFogCount = 80;
  const dustGeom = new THREE.BufferGeometry();
  const gfPos = new Float32Array(groundFogCount * 3);
  for (let i = 0; i < groundFogCount; i++) {
    gfPos[i * 3] = (Math.random() - 0.5) * 22;
    gfPos[i * 3 + 1] = Math.random() * 0.6;
    gfPos[i * 3 + 2] = (Math.random() - 0.5) * 22;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(gfPos, 3));
  const gfMat = new THREE.PointsMaterial({
    color: 0x665570,
    size: 0.25,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const groundFog = new THREE.Points(dustGeom, gfMat);
  env.add(groundFog);

  return { env, crowdGroup, dustGeom };
}

function makeCrowdFigure(THREE, x, z, scale) {
  const crowd = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.85,
  });
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * scale, 0.32 * scale, 1.4 * scale, 8),
    mat,
  );
  body.position.y = 0.7 * scale;
  crowd.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18 * scale, 10, 8),
    mat,
  );
  head.position.y = 1.55 * scale;
  crowd.add(head);
  crowd.position.set(x, 0, z);
  crowd.lookAt(0, 0.7 * scale, 0);
  return crowd;
}
