import * as THREE from 'three';

// Shared palette (3 grays from reference)
const COL = {
  hoodie:  0x6f7178,  // mid gray
  pants:   0x3a3c44,  // dark gray
  skin:    0xd8c0a8,  // muted skin tone (face only)
  hair:    0x161620,  // dark
  sneaker: 0xe8e8ec,  // light gray (white-ish)
  gloves:  0x1a1a22,  // near-black (or wraps?)
};

// ============ STYLE A: LOW-POLY ============
// Boxy primitives, visible facets, characteristic stylized silhouette.
export function makeFighterLowPoly() {
  const g = new THREE.Group();
  const matHoodie = new THREE.MeshStandardMaterial({
    color: COL.hoodie, roughness: 0.85, metalness: 0.05, flatShading: true
  });
  const matPants = new THREE.MeshStandardMaterial({
    color: COL.pants, roughness: 0.9, metalness: 0.05, flatShading: true
  });
  const matSneaker = new THREE.MeshStandardMaterial({
    color: COL.sneaker, roughness: 0.7, metalness: 0.05, flatShading: true
  });
  const matGloves = new THREE.MeshStandardMaterial({
    color: COL.gloves, roughness: 0.6, metalness: 0.1, flatShading: true
  });
  const matSkin = new THREE.MeshStandardMaterial({
    color: COL.skin, roughness: 0.7, metalness: 0.0, flatShading: true
  });
  const matHair = new THREE.MeshStandardMaterial({
    color: COL.hair, roughness: 0.6, metalness: 0.1, flatShading: true
  });

  // ---- LEGS (sweatpants — slightly tapered, low-poly cylinders w/ low segments)
  const legGeo = new THREE.CylinderGeometry(0.13, 0.16, 0.95, 6); // 6 sides = facets visible
  const legL = new THREE.Mesh(legGeo, matPants);
  legL.position.set(-0.13, 0.51, 0); legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, matPants);
  legR.position.set( 0.13, 0.51, 0); legR.castShadow = true;
  legL.userData.bodyPart = 'legL';
  legR.userData.bodyPart = 'legR';
  g.add(legL, legR);

  // ---- SNEAKERS (low boxy)
  const shoeGeo = new THREE.BoxGeometry(0.20, 0.08, 0.32);
  const shoeL = new THREE.Mesh(shoeGeo, matSneaker);
  shoeL.position.set(-0.13, 0.04, 0.05); shoeL.castShadow = true;
  const shoeR = new THREE.Mesh(shoeGeo, matSneaker);
  shoeR.position.set( 0.13, 0.04, 0.05); shoeR.castShadow = true;
  shoeL.userData.bodyPart = 'shoeL';
  shoeR.userData.bodyPart = 'shoeR';
  g.add(shoeL, shoeR);

  // ---- TORSO (hoodie — wider box, slightly bevelled feel via low-segment cylinder)
  // Use an octagonal cylinder for boxy hoodie torso
  const torsoGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.78, 8);
  const torso = new THREE.Mesh(torsoGeo, matHoodie);
  torso.position.y = 1.20; torso.castShadow = true;
  torso.userData.bodyPart = 'torso';
  g.add(torso);

  // hoodie hood lump on the back of neck (cone-like shape, draped)
  const hoodLump = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 6),
    matHoodie
  );
  hoodLump.position.set(0, 1.65, -0.18);
  hoodLump.scale.set(1, 0.7, 0.8);
  hoodLump.castShadow = true;
  hoodLump.userData.bodyPart = 'hoodLump';
  g.add(hoodLump);

  // ---- ARMS (in guard, bent, hands UP at face — match reference)
  // Upper arm
  const upperArmGeo = new THREE.CylinderGeometry(0.10, 0.09, 0.38, 6);
  const upperL = new THREE.Mesh(upperArmGeo, matHoodie);
  upperL.position.set(-0.40, 1.40, 0.05);
  upperL.rotation.z = 0.3;  // slightly out
  upperL.castShadow = true;
  const upperR = new THREE.Mesh(upperArmGeo, matHoodie);
  upperR.position.set( 0.40, 1.40, 0.05);
  upperR.rotation.z = -0.3;
  upperR.castShadow = true;
  upperL.userData.bodyPart = 'upperL';
  upperR.userData.bodyPart = 'upperR';
  g.add(upperL, upperR);

  // Forearm — ANGLED UP, bringing fists to face
  const forearmGeo = new THREE.CylinderGeometry(0.085, 0.08, 0.38, 6);
  const foreL = new THREE.Mesh(forearmGeo, matHoodie);
  foreL.position.set(-0.34, 1.65, 0.18);
  foreL.rotation.x = -0.9;  // forearm pointing forward + up
  foreL.castShadow = true;
  const foreR = new THREE.Mesh(forearmGeo, matHoodie);
  foreR.position.set( 0.34, 1.65, 0.18);
  foreR.rotation.x = -0.9;
  foreR.castShadow = true;
  foreL.userData.bodyPart = 'foreL';
  foreR.userData.bodyPart = 'foreR';
  g.add(foreL, foreR);

  // Fists (low-poly icospheres / boxes)
  const fistGeo = new THREE.BoxGeometry(0.14, 0.14, 0.16);
  const fistL = new THREE.Mesh(fistGeo, matGloves);
  fistL.position.set(-0.32, 1.90, 0.36); fistL.castShadow = true;
  const fistR = new THREE.Mesh(fistGeo, matGloves);
  fistR.position.set( 0.32, 1.90, 0.36); fistR.castShadow = true;
  fistL.userData.bodyPart = 'fistL';
  fistR.userData.bodyPart = 'fistR';
  g.add(fistL, fistR);

  // ---- NECK
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.10, 0.10, 6),
    matSkin
  );
  neck.position.y = 1.65;
  neck.castShadow = true;
  neck.userData.bodyPart = 'neck';
  g.add(neck);

  // ---- HEAD (boxy octagonal)
  const headGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.30, 8);
  const head = new THREE.Mesh(headGeo, matSkin);
  head.position.y = 1.85; head.castShadow = true;
  head.userData.bodyPart = 'head';
  g.add(head);

  // hair (flat low cap on top)
  const hair = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8),
    matHair
  );
  hair.position.y = 2.02;
  hair.castShadow = true;
  hair.userData.bodyPart = 'hair';
  g.add(hair);

  // small tag for collision/find later
  g.userData.style = 'lowpoly';
  g.userData.fighterVersion = 1;
  return g;
}

// ============ STYLE B: SEMI-REAL ============
// Smoother forms, more segments, no flat shading. Softer silhouette.
export function makeFighterSemiReal() {
  const g = new THREE.Group();
  const matHoodie = new THREE.MeshStandardMaterial({
    color: COL.hoodie, roughness: 0.78, metalness: 0.05
  });
  const matPants = new THREE.MeshStandardMaterial({
    color: COL.pants, roughness: 0.85, metalness: 0.05
  });
  const matSneaker = new THREE.MeshStandardMaterial({
    color: COL.sneaker, roughness: 0.55, metalness: 0.08
  });
  const matGloves = new THREE.MeshStandardMaterial({
    color: COL.gloves, roughness: 0.5, metalness: 0.15
  });
  const matSkin = new THREE.MeshStandardMaterial({
    color: COL.skin, roughness: 0.6, metalness: 0.0
  });
  const matHair = new THREE.MeshStandardMaterial({
    color: COL.hair, roughness: 0.5, metalness: 0.15
  });

  // ---- LEGS (smooth tapered cylinders, more segments)
  const legGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.95, 20);
  const legL = new THREE.Mesh(legGeo, matPants);
  legL.position.set(-0.13, 0.51, 0); legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, matPants);
  legR.position.set( 0.13, 0.51, 0); legR.castShadow = true;
  g.add(legL, legR);

  // ---- SNEAKERS (rounded boxes)
  const shoeShape = new THREE.Shape();
  shoeShape.moveTo(-0.10, -0.16);
  shoeShape.lineTo( 0.10, -0.16);
  shoeShape.bezierCurveTo(0.13, -0.16, 0.13,  0.16, 0.10, 0.16);
  shoeShape.lineTo(-0.10,  0.16);
  shoeShape.bezierCurveTo(-0.13, 0.16, -0.13, -0.16, -0.10, -0.16);
  const shoeGeo = new THREE.ExtrudeGeometry(shoeShape, {
    depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2
  });
  const shoeL = new THREE.Mesh(shoeGeo, matSneaker);
  shoeL.rotation.x = -Math.PI / 2;
  shoeL.position.set(-0.13, 0.0, 0.05); shoeL.castShadow = true;
  const shoeR = new THREE.Mesh(shoeGeo, matSneaker);
  shoeR.rotation.x = -Math.PI / 2;
  shoeR.position.set( 0.13, 0.0, 0.05); shoeR.castShadow = true;
  g.add(shoeL, shoeR);

  // ---- TORSO (hoodie — smooth, slightly oversized)
  const torsoGeo = new THREE.CylinderGeometry(0.36, 0.40, 0.78, 24);
  const torso = new THREE.Mesh(torsoGeo, matHoodie);
  torso.position.y = 1.20; torso.castShadow = true;
  g.add(torso);

  // shoulder caps (sphere) — adds volume where arm meets torso
  const shoulderGeo = new THREE.SphereGeometry(0.16, 16, 12);
  const shL = new THREE.Mesh(shoulderGeo, matHoodie);
  shL.position.set(-0.36, 1.55, 0); shL.castShadow = true;
  const shR = new THREE.Mesh(shoulderGeo, matHoodie);
  shR.position.set( 0.36, 1.55, 0); shR.castShadow = true;
  g.add(shL, shR);

  // hood (smoother, draped over back of neck/shoulders)
  const hood = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 20, 14),
    matHoodie
  );
  hood.position.set(0, 1.62, -0.18);
  hood.scale.set(1.05, 0.75, 0.85);
  hood.castShadow = true;
  g.add(hood);

  // ---- ARMS (in guard)
  const upperArmGeo = new THREE.CylinderGeometry(0.10, 0.09, 0.38, 16);
  const upperL = new THREE.Mesh(upperArmGeo, matHoodie);
  upperL.position.set(-0.40, 1.40, 0.05);
  upperL.rotation.z = 0.3;
  upperL.castShadow = true;
  const upperR = new THREE.Mesh(upperArmGeo, matHoodie);
  upperR.position.set( 0.40, 1.40, 0.05);
  upperR.rotation.z = -0.3;
  upperR.castShadow = true;
  g.add(upperL, upperR);

  // elbow joints (small spheres)
  const elbowGeo = new THREE.SphereGeometry(0.10, 16, 12);
  const elbL = new THREE.Mesh(elbowGeo, matHoodie);
  elbL.position.set(-0.45, 1.55, 0.18); elbL.castShadow = true;
  const elbR = new THREE.Mesh(elbowGeo, matHoodie);
  elbR.position.set( 0.45, 1.55, 0.18); elbR.castShadow = true;
  g.add(elbL, elbR);

  // forearm
  const forearmGeo = new THREE.CylinderGeometry(0.085, 0.08, 0.40, 16);
  const foreL = new THREE.Mesh(forearmGeo, matHoodie);
  foreL.position.set(-0.36, 1.70, 0.22);
  foreL.rotation.x = -0.95;
  foreL.castShadow = true;
  const foreR = new THREE.Mesh(forearmGeo, matHoodie);
  foreR.position.set( 0.36, 1.70, 0.22);
  foreR.rotation.x = -0.95;
  foreR.castShadow = true;
  g.add(foreL, foreR);

  // fists (rounded — sphere with slight squash)
  const fistGeo = new THREE.SphereGeometry(0.10, 18, 14);
  const fistL = new THREE.Mesh(fistGeo, matGloves);
  fistL.position.set(-0.34, 1.95, 0.42);
  fistL.scale.set(1.0, 1.05, 1.15);
  fistL.castShadow = true;
  const fistR = new THREE.Mesh(fistGeo, matGloves);
  fistR.position.set( 0.34, 1.95, 0.42);
  fistR.scale.set(1.0, 1.05, 1.15);
  fistR.castShadow = true;
  g.add(fistL, fistR);

  // ---- NECK
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.10, 0.10, 16),
    matSkin
  );
  neck.position.y = 1.65;
  neck.castShadow = true;
  g.add(neck);

  // ---- HEAD (rounded sphere, slightly elongated)
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 18),
    matSkin
  );
  head.position.y = 1.85;
  head.scale.set(0.92, 1.05, 0.95);
  head.castShadow = true;
  g.add(head);

  // hair (rounded cap)
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 20, 14),
    matHair
  );
  hair.position.y = 1.92;
  hair.scale.set(1.0, 0.55, 1.0);
  hair.castShadow = true;
  // clip to top half via group masking — easier: just position high
  g.add(hair);

  g.userData.style = 'semireal';
  return g;
}

// ============ ARCHETYPE GLOW ============
// A subtle colored disc on the floor under fighter's feet. No interior light —
// that was tinting the body and killing the gray hoodie palette.
export function addArchetypeGlow(fighterGroup, hexColor) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 5, 128, 128, 128);
  const r = (hexColor >> 16) & 255;
  const gr = (hexColor >> 8) & 255;
  const b = hexColor & 255;
  grad.addColorStop(0, `rgba(${r},${gr},${b},0.7)`);
  grad.addColorStop(0.35, `rgba(${r},${gr},${b},0.3)`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const discMat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
  // Disc sized to a fighter's footprint, not half the ring
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.01;
  disc.userData.isArchGlow = true;
  fighterGroup.add(disc);
}
